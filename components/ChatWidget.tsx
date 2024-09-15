import React, { useState } from "react";
import ChatArea, { Conversation } from "@/components/ChatArea";
import UserInput from "@/components/UserInput";
import { Ask } from "@/libs/chatbees";

interface ChatWidgetProps {
  aid: string;
  apiKey: string;
  collectionName: string;
  docName: string;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ aid, apiKey, collectionName, docName }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isHovered, setIsHovered] = useState(false);

  const conversationId = conversations.find(
    ({ botMsg }) => botMsg?.conversation_id,
  )?.botMsg?.conversation_id || "";
  const history_messages = conversations.reduce(
    (acc, { userMsg, botMsg }) => [...acc, [userMsg, botMsg?.answer || ""]],
    [] as string[][],
  );

  const askQuestion = (userMsg: string) => {
    const conversation: Conversation = {
      userMsg,
    };
    setConversations([...conversations, conversation]);

    Ask(aid, apiKey!, collectionName!, docName!, userMsg, history_messages, conversationId).then((botMsg) => {
      setConversations((prevConversations) => {
        const index = prevConversations.findIndex((conv) => conv === conversation);
        if (index !== -1) {
          const newConversations = [...prevConversations];
          newConversations.splice(index, 1, { userMsg, botMsg });
          return newConversations;
        }
        return prevConversations;
      });
    });
  };

  const clearConversations = () => {
    setConversations([]);
  };

  return (
    <div className="p-4">
      <div
        className="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {isHovered && conversations.length > 0 && (
          <button
            className="absolute top-2 right-2 text-red-500 bg-white p-2 rounded"
            onClick={clearConversations}
            title="Clear Chat"
          >
            <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"
              p-id="1461" width="24" height="24">
              <path
                d="M921.9 413.3l-187.1-108 115-199.2c9.9-17.1 4-39.3-13.2-49.2-17.1-9.9-39.3-4-49.2 13.2l-115 199.2-187.1-108c-17.1-9.9-39.3-4-49.2 13.2L89 555.9c-9.9 17.1-4 39.3 13.2 49.2l627 362c17.1 9.9 39.3 4 49.2-13.2L935 462.4c9.9-17.1 4-39.2-13.1-49.1zM725.3 881.7l-148.7-85.9 63.3-129.7c9.9-17.1 4-39.3-13.2-49.2l-8.7-5c-17.1-9.9-30.6 1-40.5 18.2l-63.3 129.7-125.1-72.2 80.7-119.7c9.9-17.1 12.6-34.3-4.5-44.2l-8.7-5c-17.1-9.9-39.3-4-49.2 13.2l-80.7 119.7L178 565.7 359.7 371 803 627l-77.7 254.7z m99.3-325.4L410.2 317l70.4-75.4 374.1 216-30.1 98.7z"
                fill="currentColor" p-id="1462"></path>
            </svg>
          </button>
        )}
        <ChatArea conversations={conversations}/>
      </div>
      <UserInput askQuestion={askQuestion} disabled={!docName}/>
    </div>
  );
};

export default ChatWidget;
