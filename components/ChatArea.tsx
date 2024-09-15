import React, { Fragment, useRef, useEffect } from "react";
import { BotAnswer } from "@/libs/chatbees";

export interface Conversation {
  userMsg: string;
  botMsg?: BotAnswer;
  error?: unknown;
}

interface ChatAreaProps {
  conversations: Conversation[];
}

const ChatArea: React.FC<ChatAreaProps> = ({ conversations }) => {
  const chatAreaRef = useRef<HTMLDivElement>(null);
  const lastUserMsgRef = useRef<HTMLDivElement>(null);
  const lastBotMsgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatAreaRef.current && lastUserMsgRef.current && lastBotMsgRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight
        - lastUserMsgRef.current.clientHeight
        - lastBotMsgRef.current.clientHeight
        - 16;
    }
  }, [conversations]);

  const thinkingBees = <span className="inline-flex items-center">
    <svg className="animate-spin h-5 w-5 text-blue-600 mr-4" xmlns="http://www.w3.org/2000/svg" fill="none"
      viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    Bees are thinking...</span>;

  const conversationMapper = ({ userMsg, botMsg, error }: Conversation, index: number) => (
    <Fragment key={index}>
      <div
        ref={index === conversations.length - 1 ? lastUserMsgRef : null}
        className="self-end bg-black text-white rounded-l-lg rounded-tr-lg p-2 max-w-[85%]">
        {userMsg}
      </div>
      <div
        ref={index === conversations.length - 1 ? lastBotMsgRef : null}
        className="self-start bg-gray-200 rounded-r-lg rounded-tl-lg p-1.5 m-1 border-2 border-transparent max-w-[85%]">
        {
          error
            ? <span className="text-red-500 italic">
              Something went wrong:
              {
                // @ts-expect-error: type of `error` is unknown
                error?.message
              }
            </span>
            :
            (botMsg
              ? botMsg.answer.split("\n").map(
                (line, i) => <div key={i}>{line}</div>,
              )
              : thinkingBees)
        }
      </div>
    </Fragment>
  );

  return (
    <div
      ref={chatAreaRef}
      className="flex-1 px-2.5 bg-white text-black overflow-y-auto flex flex-col border border-gray-300 border-t border-t-gray-200 h-[75vh]">
      <div
        className="self-start bg-gray-200 rounded-r-lg rounded-tl-lg p-1.5 m-1 border-2 border-transparent flex flex-col max-w-[85%]">
        Hello! How can I help you today?
      </div>
      {conversations.map(conversationMapper)}
    </div>
  );
};

export default ChatArea;
