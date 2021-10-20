export interface IMessage {
    id: string;
    /**
     * @summary UTC date of message timestamp.
     * Used for paritioning messages in cosmos db.
     */
    utcDate: string;

    timeStamp: Date;

    /**
     * @summary Id of the first message in this reply chain.
     */
    threadId: string;

    /**
     * @summary Deeplink to original telegram message.
     */
    messageUrl: string;

    /**
     * @summary Persistent, contiguous, chronological ordering of messages for display purposes.
     */
    timeRank: number;

    body: {
        type: "text";
        content: string;
    };

    sender: {
        displayName: string;
        /**
         * @summary Full URL of the avatar image in the azure blob storage account.
         */
        avatarUrl?: string;
    };
}
