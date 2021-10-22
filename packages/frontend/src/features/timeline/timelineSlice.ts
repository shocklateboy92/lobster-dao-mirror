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

function determineIndentation(
    messages: IMessage[],
    highlightedThreads: ThreadLookup
): ThreadIndentationLookup {
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
    days: {
        [isoDate: string]:
            | {
                  threadIndentation: ThreadIndentationLookup;
                  highlightedThreads: ThreadLookup;
                  messageOrder: number[];
              }
            | undefined;
    };
    messages: { [timeRank: number]: IMessage };
}

const initialState: TimelineState = {
    days: {},
    messages: {},
};

export const timelineFetchAsync = createAsyncThunk<
    IMessage[],
    string,
    { state: RootState }
>("timeline/fetch", async (date, { getState }) => {
    const messages = await fetchMessages(date);
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
                Object.fromEntries(
                    action.payload.map((message) => [message.timeRank, message])
                ),
                state.messages
            );
            const messageOrder = action.payload
                .map((message) => message.timeRank)
                .sort((a, b) => a - b);
            const orderedMessageInfo = messageOrder.map(
                (rank) => newMessages[rank]
            );
            const highlightedThreads =
                determineHighlightedThreads(orderedMessageInfo);
            const threadIndentation = determineIndentation(
                orderedMessageInfo,
                highlightedThreads
            );
            return {
                days: {
                    ...state.days,
                    [action.meta.arg]: {
                        highlightedThreads,
                        threadIndentation,
                        messageOrder,
                    },
                },
                messages: newMessages,
            };
        });
    },
});

export const timelineReducer = timelineSlice.reducer;
