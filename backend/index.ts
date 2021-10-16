import {
    AutojoinRoomsMixin,
    LogLevel,
    LogService,
    MatrixClient,
    SimpleFsStorageProvider,
} from "@sorunome/matrix-bot-sdk/lib/index";
import { Mutex } from "async-mutex";
import { IMessage } from "./models";
import { fetchMessage, initDb, writeMessage } from "./db";

const MATRIX_KEY = process.env.MATRIX_KEY || keyRequiredError("MATRIX_KEY");
const MATRIX_HOST = process.env.MATRIX_HOST || keyRequiredError("MATRIX_HOST");
const STORAGE_DIR = process.env.STORAGE_DIR || "./";

function keyRequiredError(name: string): string {
    throw new Error(`Environment variable ${name} is required`);
}

LogService.setLevel(LogLevel.WARN);

const storage = new SimpleFsStorageProvider(`${STORAGE_DIR}/matrix-state.json`);
const client = new MatrixClient(MATRIX_HOST, MATRIX_KEY, storage);
AutojoinRoomsMixin.setupOnClient(client);

const mutex = new Mutex();

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
        };
        await writeMessage(message);

        console.log(`Processed message '${event_id}'`);
    })
);

async function determineThreadId(messageId: string, parentId?: string) {
    console.log(`Got parent '${parentId}' for '${messageId}'`);
    if (parentId) {
        const parent = await fetchMessage(parentId);
        return parent?.threadId ?? messageId;
    }

    return messageId;
}

initDb().then(() => client.start().then(() => console.log("Client started!")));

export const foo = "blah";
