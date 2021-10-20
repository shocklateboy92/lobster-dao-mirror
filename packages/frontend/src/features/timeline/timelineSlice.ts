import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { IMessage } from "models";
import { RootState } from "../../app/store";
import { fetchMessages } from "./timelineAPI";

interface Thread {
    first: number;
    last: number;
    count: number;
}

type ThreadLookup = { [threadId: string]: Thread };
type ThreadIndentationLookup = { [threadId: string]: number };

function determineHighlightedThreads(messages: IMessage[]): ThreadLookup {
    const threads: { [threadId: string]: Thread } = {};
    for (const message of messages) {
        if (!threads[message.threadId]) {
            threads[message.threadId] = {
                first: message.timeRank,
                last: message.timeRank,
                count: 1,
            };
        } else {
            threads[message.threadId].count += 1;
            threads[message.threadId].last = message.timeRank;
        }
    }
    for (const threadId in threads) {
        if (threads[threadId].count < 2) {
            delete threads[threadId];
        }
    }
    return threads;
}

function determineIndentation(messages: IMessage[]): ThreadIndentationLookup {
    const highlightedThreads = determineHighlightedThreads(messages);
    const indentations: ThreadIndentationLookup = {};
    const currentlyAllocated = new Set<number>();

    for (const { threadId, timeRank } of messages) {
        const messageThread = highlightedThreads[threadId];
        if (messageThread) {
            if (messageThread.first === timeRank) {
                // Is first element of thread
                for (let i = 1; i <= messages.length; ++i) {
                    if (!currentlyAllocated.has(i)) {
                        indentations[threadId] = i;
                        currentlyAllocated.add(i);
                        break;
                    }
                }
            } else if (messageThread.last === timeRank) {
                // Is last element of thread
                currentlyAllocated.delete(indentations[threadId]);
            }
        }
    }
    return indentations;
}

export interface TimelineState {
    messages: { [timeRank: number]: IMessage };
    messageOrder: number[];
    threadIndentation: ThreadIndentationLookup;
    lastFetchedTimeRank: number;
}

const initialState: TimelineState = {
    messages: {},
    messageOrder: [],
    threadIndentation: {},
    lastFetchedTimeRank: 0,
};

export const timelineFetchAsync = createAsyncThunk<
    IMessage[],
    void,
    { state: RootState }
>("timeline/fetch", async (index, arg) => {
    const lastRank = arg.getState().timeline.lastFetchedTimeRank;
    const messages = await fetchMessages(lastRank);
    return messages;
});

const timelineSlice = createSlice({
    name: "timeline",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(timelineFetchAsync.fulfilled, (state, action) => {
            const newMessages = Object.assign(
                {},
                state.messages,
                Object.fromEntries(
                    action.payload.map((message) => [message.timeRank, message])
                )
            );
            const newMessagesOrder = state.messageOrder.concat(
                action.payload
                    .map((message) => message.timeRank)
                    .sort((a, b) => a - b)
            );
            const threadIndentation = determineIndentation(
                newMessagesOrder.map((rank) => newMessages[rank])
            );
            const newLastRank =
                newMessagesOrder[newMessagesOrder.length - 1] + 1;
            return {
                messages: newMessages,
                messageOrder: newMessagesOrder,
                threadIndentation,
                lastFetchedTimeRank: newLastRank || state.lastFetchedTimeRank,
            };
        });
    },
});

export const timelineReducer = timelineSlice.reducer;
