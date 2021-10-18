import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { IMessage } from "models";
import { fetchMessages } from "./timelineAPI";

export interface TimelineState {
    messages: { [timeRank: number]: IMessage };
    order: number[];
}

const initialState: TimelineState = {
    messages: {},
    order: [],
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
            return {
                messages: Object.fromEntries(
                    action.payload.map((message) => [message.timeRank, message])
                ),
                order: [],
            };
        });
    },
});

export const timelineReducer = timelineSlice.reducer;
