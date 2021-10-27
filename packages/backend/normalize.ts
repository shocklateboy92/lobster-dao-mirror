require("dotenv").config();
import { LogLevel, LogService } from "@sorunome/matrix-bot-sdk";
import { IMessage, versions } from "models";
import { fetchAllMessages, initDb, writeMessage, deleteMessage } from "./db";

LogService.setLevel(LogLevel.DEBUG);

const desiredVersion = versions.DATE_NORMALIZATION;

const upgradePath: { [version: number]: (message: IMessage) => IMessage } = {};
upgradePath[versions.NO_VERSION] = (message) => {
    message.version = versions.INITIAL;
    return message;
};
upgradePath[versions.INITIAL] = (message) => {
    const oldDate = message.utcDate;
    const dateParts = message.utcDate.split("-").map((part) => parseInt(part));
    if (dateParts.length != 3 || dateParts.some((part) => isNaN(part))) {
        throw new Error(`Invalid date ${oldDate}`);
    }
    // Increment the month by 1, since it's 0-indexed for some reason
    dateParts[1] += 1;
    message.utcDate = dateParts.join("-");
    message.version = versions.DATE_NORMALIZATION;
    return message;
};

const processMessage = async (message: IMessage) => {
    let messageVersion = message.version ?? versions.NO_VERSION;
    if (messageVersion != desiredVersion) {
        LogService.debug(`Upgrading ${JSON.stringify(message, null, 2)}`);
        const oldUtcDate = message.utcDate;
        const oldId = message.id;
        while (messageVersion < desiredVersion) {
            const updater = upgradePath[messageVersion];
            if (updater === undefined) {
                throw new Error(
                    `No way to update message from version ${messageVersion}`
                );
            }
            message = upgradePath[messageVersion](message);
            LogService.debug(`to ${JSON.stringify(message, null, 2)}`);
            messageVersion = message.version ?? versions.NO_VERSION;
        }
        if (message.id != oldId || message.utcDate != oldUtcDate) {
            LogService.debug("Deleting old message");
            // We've moved the message to a new key, so delete the old one manually
            await deleteMessage(oldId, oldUtcDate);
        }
        await writeMessage(message);
    } else {
        LogService.debug(`Skipping message ${message.id}`);
    }
};

initDb().then(async () => {
    LogService.debug("Fetching all messages");
    const messages = await fetchAllMessages();
    if (messages === undefined) {
        throw new Error("Failed to fetch messages");
    }
    LogService.debug(`Fetched ${messages.length} messages`);

    let outgoingUpdates = [];
    for (var i = 0; i < messages.length; ++i) {
        outgoingUpdates.push(processMessage(messages[i]));
    }
    await Promise.all(outgoingUpdates);
});
