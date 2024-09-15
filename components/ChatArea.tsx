import React, { useRef, useEffect } from "react";
import ChatConversation, { Conversation } from "@/components/ChatConversation";

interface ChatAreaProps {
  conversations: Conversation[];
}

const ChatArea: React.FC<ChatAreaProps> = ({ conversations }) => {
  const chatAreaRef = useRef<HTMLDivElement>(null);
  const lastConversationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatAreaRef.current && lastConversationRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight
        - lastConversationRef.current.clientHeight
        - 16;
    }
  }, [conversations]);

  return (
    <div
      ref={chatAreaRef}
      className="px-2.5 text-black overflow-y-auto flex flex-col border border-gray-300 border-t border-t-gray-200 h-[75vh]">
      <div
        className="self-start bg-gray-200 rounded-r-lg rounded-tl-lg p-1.5 m-1 border-2 border-transparent max-w-[85%]">
        Any Question? Just Ask!
      </div>
      {
        conversations.map(
          (conversation, index) => (
            <div
              ref={index === conversations.length - 1 ? lastConversationRef : null} key={index}
              className="flex flex-col"
            >
              <ChatConversation {...conversation} />
            </div>
          )
        )
      }
    </div>
  );
};

export default ChatArea;
