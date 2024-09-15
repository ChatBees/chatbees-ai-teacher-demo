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

  const askQuestion = (userMsg: string) => {
    const conversation: Conversation = {
      userMsg,
    };
    setConversations([...conversations, conversation]);

    Ask(aid, apiKey!, collectionName!, docName!, userMsg, [], "").then((botMsg) => {
      setConversations((prevConversations) => {
        const index = prevConversations.findIndex((conv) => conv.userMsg === userMsg);
        if (index !== -1) {
          const newConversations = [...prevConversations];
          newConversations.splice(index, 1, { userMsg, botMsg });
          return newConversations;
        }
        return prevConversations;
      });
    });
  };

  return (
    <div className="p-4">
      <ChatArea conversations={conversations}/>
      <UserInput askQuestion={askQuestion} disabled={!docName}/>
    </div>
  );
};

export default ChatWidget;
