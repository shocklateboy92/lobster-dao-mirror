import { BlobServiceClient } from "@azure/storage-blob";
import {
    AutojoinRoomsMixin,
    LogLevel,
    LogService,
    MatrixClient,
    SimpleFsStorageProvider,
} from "@sorunome/matrix-bot-sdk/lib/index";
import { Mutex } from "async-mutex";
import axios from "axios";
import { IMessage } from "models";
import { fetchMessage, getNextTimeRank, initDb, writeMessage } from "./db";

const MATRIX_KEY = process.env.MATRIX_KEY || keyRequiredError("MATRIX_KEY");
const MATRIX_HOST = process.env.MATRIX_HOST || keyRequiredError("MATRIX_HOST");
const BLOB_STORAGE_KEY =
    process.env.BLOB_STORAGE_KEY || keyRequiredError("BLOB_STORAGE_KEY");
const STORAGE_DIR = process.env.STORAGE_DIR || "./";

function keyRequiredError(name: string): string {
    throw new Error(`Environment variable ${name} is required`);
}

LogService.setLevel(LogLevel.WARN);

const storage = new SimpleFsStorageProvider(`${STORAGE_DIR}/matrix-state.json`);
const client = new MatrixClient(MATRIX_HOST, MATRIX_KEY, storage);
AutojoinRoomsMixin.setupOnClient(client);

const avatarsClient =
    BlobServiceClient.fromConnectionString(BLOB_STORAGE_KEY).getContainerClient(
        "avatars"
    );
const mutex = new Mutex();

interface IUserProfile {
    displayname: string;
    avatar_url: string;
}

client.on("room.message", (roomId, event) =>
    mutex.runExclusive(async () => {
        if (roomId !== "!mrkzEUqaZYrWLpLRmD:lasath.org") {
            return;
        }

        if (event.content?.msgtype !== "m.text") {
            console.log(
                `Recieved non next event of type '${event.content?.msgtype}'`
            );
            return;
        }

        console.log(
            `Got message with content '${JSON.stringify(event, null, 2)}'`
        );

        const profile: IUserProfile = await client.getUserProfile(event.sender);
        console.log("Got user profile: ", JSON.stringify(profile, null, 2));
        const blobName =
            profile.avatar_url && /[^\/]+$/.exec(profile.avatar_url)?.[0];
        let avatarUrl: string | undefined;
        if (blobName) {
            console.log(`Creating blob '${blobName}'`);
            const blobClient = avatarsClient.getBlockBlobClient(blobName);
            avatarUrl = blobClient.url;
            if (!(await blobClient.exists())) {
                const content = await axios.get<ArrayBuffer>(
                    client.mxcToHttp(profile.avatar_url),
                    {
                        responseType: "arraybuffer",
                    }
                );
                const blobContentType = content.headers["content-type"];
                console.log("Got img response of type" + blobContentType);
                await blobClient.uploadData(Buffer.from(content.data), {
                    blobHTTPHeaders: { blobContentType },
                });
            } else {
                console.log("Skipping existing blob");
            }
        } else {
            console.warn(
                `Got unknown avatar_url '${profile.avatar_url}' for user '${profile.displayname}'`
            );
        }

        const { event_id, content, origin_server_ts } = event;
        const timeStamp = new Date(origin_server_ts);
        const parentId = content["m.relates_to"]?.event_id;
        const message: IMessage = {
            id: event_id,
            utcDate: `${timeStamp.getUTCFullYear()}-${timeStamp.getUTCMonth()}-${timeStamp.getUTCDate()}`,
            threadId: await determineThreadId(event_id, parentId),
            timeStamp,
            messageUrl: content.external_url,
            body: {
                type: "text",
                content: content.body,
            },
            timeRank: getNextTimeRank(),
            sender: {
                displayName: profile.displayname,
                avatarUrl,
            },
        };
        await writeMessage(message);

        console.log(`Processed message '${event_id}'`);
    })
);

async function determineThreadId(messageId: string, parentId?: string) {
    if (parentId) {
        const parent = await fetchMessage(parentId);
        return parent?.threadId ?? messageId;
    }

    return messageId;
}

initDb().then(() => client.start().then(() => console.log("Client started!")));
