import { BotAnswer } from "@/libs/chatbees";
import React, { useMemo } from "react";

export interface Conversation {
  userMsg: string;
  botMsg?: BotAnswer;
  error?: { message: string };
}

const ChatConversation: React.FC<Conversation> = ({ userMsg, botMsg, error }) => {
  const thinkingBees = useMemo(() => (<span className="inline-flex items-center">
    <svg className="animate-spin h-5 w-5 text-blue-600 mr-4" xmlns="http://www.w3.org/2000/svg" fill="none"
      viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    Bees are thinking...</span>), []);

  return (
    <>
      <div className="self-end bg-black text-white rounded-l-lg rounded-tr-lg p-2 max-w-[85%]">
        {userMsg}
      </div>
      <div
        className="self-start bg-gray-200 rounded-r-lg rounded-tl-lg p-1.5 m-1 border-2 border-transparent max-w-[85%]">
        {error
          ? <span className="text-red-500 italic">
            Something went wrong: {error?.message}
          </span>
          : botMsg
            ? botMsg.answer.split("\n").map(
              (line, i) => <div key={i}>{line}</div>,
            )
            : thinkingBees
        }
      </div>
    </>
  );
};

export default ChatConversation;
