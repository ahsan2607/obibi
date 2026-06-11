import React from "react";
import { Bot, ArrowRight } from "lucide-react";
import Link from "next/link";

/**
 * Renders an AI-focused banner encouraging users to chat with the health assistant.
 * 
 * Initial state: None.
 * Final state: Returns a styled gradient banner with a link to the chat page.
 */
export const AIBanner: React.FC = () => {
  return (
    <div className="bg-linear-to-r from-blue-600 to-indigo-600 rounded-3xl p-8 text-white shadow-md relative overflow-hidden">
      <div className="relative z-10 md:w-2/3">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-sm font-medium mb-4 backdrop-blur-sm border border-white/30">
          <Bot size={16} />
          <span>Hello AI - Your Health Assistant</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold mb-4 leading-tight">
          Have questions about your medicine?
        </h2>
        <p className="text-blue-100 mb-6 text-lg">
          Ask about indications, side effects, dosage, or share your prescription images directly with Hello AI!
        </p>
        <Link 
          href="/chat"
          className="inline-flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition shadow-sm"
        >
          Start Chatting Now
          <ArrowRight size={20} />
        </Link>
      </div>
      <Bot className="absolute -bottom-10 -right-10 w-64 h-64 text-white opacity-10" />
    </div>
  );
};
