import { FC, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { timelineFetchAsync } from "./timelineSlice";
import "./Timeline.scss";

export const Message: FC<{ rank: number; row: number }> = ({ rank, row }) => {
    const message = useAppSelector((state) => state.timeline.messages[rank]);
    const indentation = useAppSelector(
        (state) => state.timeline.threadIndentation[message.threadId] ?? 0
    );
    return (
        <div
            className="message"
            style={{
                gridRow: row,
                gridColumn: 1 + indentation,
            }}
        >
            <img
                className="profile-picture"
                src={
                    message.sender?.avatarUrl ||
                    "https://www.personality-database.com/profile_images/34247.png"
                }
            />
            <span className="sender-name">
                {message.sender?.displayName || "Tim"}
            </span>
            <span className="content">{message.body.content}</span>
        </div>
    );
};

export const Timeline: FC = () => {
    const messages = useAppSelector((state) => state.timeline.messages);
    return (
        <div className="timeline">
            {Object.values(messages).map((message, index) => (
                <Message
                    rank={message.timeRank}
                    row={1 + index}
                    key={message.id}
                />
            ))}
        </div>
    );
};
