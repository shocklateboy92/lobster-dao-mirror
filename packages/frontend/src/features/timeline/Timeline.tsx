import { FC, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { timelineFetchAsync } from "./timelineSlice";
import "./Timeline.scss";

export const Timeline: FC = () => {
    const messages = useAppSelector((state) => state.timeline.messages);
    const threadIndentation = useAppSelector(
        (state) => state.timeline.threadIndentation
    );
    const dispatch = useAppDispatch();
    useEffect(() => {
        dispatch(timelineFetchAsync());
    }, []);
    return (
        <div className="timeline">
            {Object.values(messages).map((message, index) => (
                <div
                    style={{
                        gridRow: 1 + index,
                        gridColumn:
                            1 + (threadIndentation[message.threadId] ?? 0),
                    }}
                    key={message.id}
                >
                    Tim: {message.body.content}
                </div>
            ))}
        </div>
    );
};
