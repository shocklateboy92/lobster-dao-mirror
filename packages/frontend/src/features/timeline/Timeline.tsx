import { FC, Fragment, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { timelineFetchAsync } from "./timelineSlice";
import "./Timeline.scss";

export const Message: FC<{ rank: number; row: number }> = ({ rank, row }) => {
    const message = useAppSelector((state) => state.timeline.messages[rank]);
    const indentation = useAppSelector(
        (state) => state.timeline.threadIndentation[message.threadId] ?? 0
    );
    const messageParts = message.body.content.split("\n");
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
            <span className="content">
                {messageParts.map((part, index) => (
                    <Fragment key={index}>
                        {index > 0 && <br />}
                        {part}
                    </Fragment>
                ))}
            </span>
        </div>
    );
};

export const Timeline: FC = () => {
    const messageOrder = useAppSelector((state) => state.timeline.messageOrder);
    const highlightedThreads = useAppSelector(
        (state) => state.timeline.highlightedThreads
    );
    const indentation = useAppSelector(
        (state) => state.timeline.threadIndentation
    );
    const firstRank = messageOrder[0];
    console.log(messageOrder);
    return (
        <div className="timeline">
            {Object.entries(highlightedThreads).map(([id, thread]) => (
                <div
                    key={id}
                    style={{
                        gridColumn: indentation[id] + 1,
                        gridRowStart: thread.first,
                        gridRowEnd: thread.last + 1,
                    }}
                    className="thread-background"
                ></div>
            ))}
            {messageOrder.map((rank, index) => (
                <Message rank={rank} row={1 + index} key={rank} />
            ))}
        </div>
    );
};
