import { configureStore, ThunkAction, Action } from "@reduxjs/toolkit";
import { timelineReducer } from "../features/timeline/timelineSlice";

export const store = configureStore({
    reducer: {
        timeline: timelineReducer,
    },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
    ReturnType,
    RootState,
    unknown,
    Action<string>
>;
