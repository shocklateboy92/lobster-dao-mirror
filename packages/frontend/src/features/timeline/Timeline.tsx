import { IMessage } from "models";
import { FC, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { timelineFetchAsync } from "./timelineSlice";
import "./Timeline.scss";

type IndentationLookup = { [messageRank: string]: number };

function determineIndentation(messages: IMessage[]): IndentationLookup {
    const indentations: IndentationLookup = {};
    for (const message of messages) {
        indentations[message.id] = Math.floor(2.99999999 * Math.random());
    }
    return indentations;
}

export const Timeline: FC = () => {
    const messages = useAppSelector((state) => state.timeline.messages);
    const messageIndentation = determineIndentation(Object.values(messages));
    const dispatch = useAppDispatch();
    useEffect(() => {
        dispatch(timelineFetchAsync());
    }, []);
    return (
        <div className="timeline">
            {Object.values(messages).map((message, index) => (
                <div
                    style={{
                        gridRow: index + 1,
                        gridColumn: messageIndentation[message.id] + 1,
                    }}
                    key={message.id}
                >
                    Tim: {message.body.content}
                </div>
            ))}
        </div>
    );
};
