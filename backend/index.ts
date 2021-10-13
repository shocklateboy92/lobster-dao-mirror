import {
    AutojoinRoomsMixin,
    LogLevel,
    LogService,
    MatrixClient,
    SimpleFsStorageProvider,
} from "@sorunome/matrix-bot-sdk/lib/index";

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

client.on("room.message", (roomId, event) => {
    if (event.content?.msgtype !== "m.text") {
        console.log(
            `Recieved non next event of type '${event.content?.msgtype}'`
        );
        return;
    }

    console.log(
        `Got message with content '${JSON.stringify(event.content, null, 2)}'`
    );
});

client.start().then(() => console.log("Client started!"));

export const foo = "blah";
