import { CosmosClient } from "@azure/cosmos";
import { IMessage } from "models";

const DB_CONNECTION_STR =
    "AccountEndpoint=https://lobster-dao-mirror.documents.azure.com:443/;AccountKey=mZqVa23wj1uUrZ0g1VxlMWAydBqg0uS5mT28fkZ5YXrCh2KRpQV5MJ8EOMNZWbMSakRTxmbAwJBWDNyGPXWkww==;";
const DB_NAME = "test";
const CONTAINER_NAME = "messages";

const client = new CosmosClient(DB_CONNECTION_STR);
const database = client.database(DB_NAME);
const container = database.container(CONTAINER_NAME);

export async function fetchMessages(): Promise<IMessage[]> {
    const response = await container.items.readAll<IMessage>().fetchAll();
    return response.resources;
}
