import React from "react";
import { User as UserIcon, Bot } from "lucide-react";

interface ChatMessageBubbleProps {
  role: "user" | "assistant";
  content: string;
}

/**
 * Renders a single message bubble in the chat session.
 * 
 * Initial state: Component receives the role (user or assistant) and the message content.
 * Final state: Returns a styled message bubble with an appropriate icon and alignment.
 */
export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({ role, content }) => {
  const isUser = role === "user";
  return (
    <div className={`flex gap-4 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          isUser ? "bg-blue-100 text-blue-600" : "bg-emerald-100 text-emerald-600"
        }`}
      >
        {isUser ? <UserIcon size={18} /> : <Bot size={18} />}
      </div>
      <div
        className={`max-w-[75%] px-4 py-3 rounded-2xl ${
          isUser
            ? "bg-blue-600 text-white rounded-tr-none"
            : "bg-gray-100 text-gray-800 rounded-tl-none"
        }`}
      >
        <div className="whitespace-pre-wrap text-sm leading-relaxed">{content}</div>
      </div>
    </div>
  );
};
