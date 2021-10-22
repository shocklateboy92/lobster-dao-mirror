import { FC, Fragment, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { timelineFetchAsync } from "./timelineSlice";
import "./Timeline.scss";
import { useDispatch } from "react-redux";

export const Message: FC<{ rank: number; row: number; date: string }> = ({
    rank,
    row,
    date,
}) => {
    const message = useAppSelector((state) => state.timeline.messages[rank]);
    const indentation = useAppSelector(
        (state) =>
            state.timeline.days[date]?.threadIndentation[message.threadId] ?? 0
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

export const Timeline: FC<{ date: string }> = ({ date }) => {
    const messageOrder = useAppSelector(
        (state) => state.timeline.days[date]?.messageOrder || []
    );
    const highlightedThreads = useAppSelector(
        (state) => state.timeline.days[date]?.highlightedThreads || {}
    );
    const indentation = useAppSelector(
        (state) => state.timeline.days[date]?.threadIndentation || {}
    );
    const dispatch = useAppDispatch();
    useEffect(() => {
        dispatch(timelineFetchAsync(date));
        console.log("Creating timer");
        const timerHandle = window.setInterval(
            () => dispatch(timelineFetchAsync(date)),
            15000
        );
        return () => {
            console.log("Clearing timer");
            window.clearInterval(timerHandle);
        };
    }, [date, dispatch]);
    const firstRank = messageOrder[0];
    return (
        <div className="timeline">
            {Object.entries(highlightedThreads).map(([id, thread]) => (
                <div
                    key={id}
                    style={{
                        gridColumn: indentation[id] + 1,
                        gridRowStart: thread.first - firstRank + 1,
                        gridRowEnd: thread.last - firstRank + 2,
                    }}
                    className="thread-background"
                ></div>
            ))}
            {messageOrder.map((rank, index) => (
                <Message rank={rank} row={1 + index} date={date} key={rank} />
            ))}
        </div>
    );
};
