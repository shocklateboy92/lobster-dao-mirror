import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { IMessage } from "models";
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
    threadIndentation: ThreadIndentationLookup;
}

const initialState: TimelineState = {
    messages: {},
    threadIndentation: {},
};

export const timelineFetchAsync = createAsyncThunk(
    "timeline/fetch",
    async () => {
        const messages = await fetchMessages();
        return messages;
    }
);

const timelineSlice = createSlice({
    name: "timeline",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(timelineFetchAsync.fulfilled, (_state, action) => {
            const threadIndentation = determineIndentation(action.payload);
            const messages = Object.fromEntries(
                action.payload.map((message) => [message.timeRank, message])
            );
            return {
                messages,
                threadIndentation,
            };
        });
    },
});

export const timelineReducer = timelineSlice.reducer;
