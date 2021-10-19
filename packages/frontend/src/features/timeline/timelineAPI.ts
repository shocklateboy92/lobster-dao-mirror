import { CosmosClient } from "@azure/cosmos";
import { IMessage } from "models";

const DB_CONNECTION_STR = process.env.REACT_APP_DB_CONNECTION_STR;
if (!DB_CONNECTION_STR) {
    throw new Error(
        "Server has misconfigured DB Access token (email the webmaster)"
    );
}
const DB_NAME = "test";
const CONTAINER_NAME = "messages";

const client = new CosmosClient(DB_CONNECTION_STR);
const database = client.database(DB_NAME);
const container = database.container(CONTAINER_NAME);

export async function fetchMessages(): Promise<IMessage[]> {
    const response = await container.items
        .query("SELECT * FROM messages m ORDER BY m.timeRank ASC")
        .fetchAll();
    return response.resources;
}
