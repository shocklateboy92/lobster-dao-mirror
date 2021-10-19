import { IMessage } from "models";
import { FC, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { timelineFetchAsync } from "./timelineSlice";
import "./Timeline.scss";

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

export const Timeline: FC = () => {
    const messages = useAppSelector((state) => state.timeline.messages);
    const threadIndentation = determineIndentation(Object.values(messages));
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
