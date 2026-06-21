import React from "react";
import { User as UserIcon, Bot, CheckCircle2 } from "lucide-react";

interface ChatMessageBubbleProps {
  role: "user" | "assistant" | "system";
  content: string;
}

/**
 * Renders a single message bubble in the chat session.
 * 
 * Initial state: Component receives the role (user, assistant, or system) and the message content.
 * Final state: Returns a styled message bubble or system notification with an appropriate icon and alignment.
 */
export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = ({ role, content }) => {
  const isUser = role === "user";

  const renderMarkdown = (text: string) => {
    const lines = text.split("\n");
    
    return lines.map((line, lineIdx) => {
      // Check if it's a list item starting with * or - or a number
      const listMatch = line.match(/^(\s*)([*-]|\d+\.)\s+(.*)$/);
      
      // Parse bold text (**text**)
      const parseBold = (str: string) => {
        const parts = str.split(/\*\*([\s\S]*?)\*\*/g);
        return parts.map((part, partIdx) => {
          if (partIdx % 2 === 1) {
            return <strong key={partIdx} className="font-bold">{part}</strong>;
          }
          return part;
        });
      };

      if (listMatch) {
        const indent = listMatch[1].length * 8; // indentation pixels
        const bullet = listMatch[2];
        const contentStr = listMatch[3];
        
        return (
          <div key={lineIdx} className="flex items-start gap-2 mb-1" style={{ paddingLeft: `${indent}px` }}>
            <span className="select-none font-medium opacity-70 shrink-0">{bullet}</span>
            <div className="flex-1">{parseBold(contentStr)}</div>
          </div>
        );
      }
      
      return (
        <p key={lineIdx} className="min-h-[1em] mb-1">
          {parseBold(line)}
        </p>
      );
    });
  };

  if (role === "system") {
    return (
      <div className="flex justify-center my-4 w-full">
        <div className="max-w-[90%] md:max-w-[80%] flex gap-3 items-start px-5 py-4 rounded-2xl border border-blue-100 bg-blue-50/40 shadow-sm backdrop-blur-sm text-blue-900">
          <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 bg-blue-100 text-blue-600 mt-0.5 animate-pulse">
            <CheckCircle2 size={16} className="text-blue-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-xs text-blue-800 uppercase tracking-wider mb-1">System Action Processed</h4>
            <div className="text-sm leading-relaxed">{renderMarkdown(content)}</div>
          </div>
        </div>
      </div>
    );
  }

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
        <div className="text-sm leading-relaxed">{renderMarkdown(content)}</div>
      </div>
    </div>
  );
};
