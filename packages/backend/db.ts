import { CosmosClient } from "@azure/cosmos";
import { IMessage } from "models";

const DB_CONNECTION_STR = requiredParam("DB_CONNECTION_STR");
const DB_NAME = "test";
const CONTAINER_NAME = "messages";

const client = new CosmosClient(DB_CONNECTION_STR);
const database = client.database(DB_NAME);
const container = database.container(CONTAINER_NAME);

export const initDb = async () => {
    await client.databases.createIfNotExists({ id: DB_NAME });
    await database.containers.createIfNotExists({
        id: CONTAINER_NAME,
        partitionKey: "/utcDate",
    });
};

export const fetchMessage = async (
    id: string
): Promise<IMessage | undefined> => {
    const response = await container.items
        .query({
            query: "SELECT * FROM messages m WHERE m.id = @id",
            parameters: [{ name: "@id", value: id }],
        })
        .fetchAll();
    return response.resources[0];
};

export const writeMessage = (message: IMessage) =>
    container.items.upsert(message);

function requiredParam(name: string) {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Required environment variable ${name} not set`);
    }
    return value;
}
