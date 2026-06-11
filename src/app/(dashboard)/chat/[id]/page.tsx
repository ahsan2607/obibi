"use client";

import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase/client";
import { Bot } from "lucide-react";
import { useEffect, useRef, useState, use } from "react";
import { ChatMessageBubble } from "@/components/chat/ChatMessageBubble";
import { ChatInput } from "@/components/chat/ChatInput";

interface ChatMessageFromDB {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * ChatSessionPage component that manages a specific chat conversation.
 * 
 * Initial state: Fetches chat history for the given ID and sets up state for new messages.
 * Final state: Renders a scrollable message log and a chat input component.
 */
export default function ChatSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useAuth();
  const { id } = use(params);
  const [chatLog, setChatLog] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    /**
     * Fetches the chat history from Supabase.
     */
    const fetchChat = async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("role, content")
        .eq("chat_id", id)
        .order("created_at", { ascending: true });

      if (!error && data) {
        const logArray = (data as ChatMessageFromDB[]).map((msg) => 
          msg.role === 'user' ? `User: ${msg.content}` : `AI: ${msg.content}`
        );
        setChatLog(logArray);
      }
      setLoading(false);
    };

    fetchChat();
  }, [id, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatLog]);

  /**
   * Handles sending a new message to the AI assistant.
   * 
   * @param e - The form event.
   */
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !selectedImage) || sending) return;

    const userText = input.trim() || "[Image]";
    const logText = selectedImage ? `User: ${userText}\n[Image Attached]` : `User: ${userText}`;
    const updatedLogUser = [...chatLog, logText];
    
    setChatLog(updatedLogUser);
    setInput("");
    const imageToSend = selectedImage;
    setSelectedImage(null);
    setSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          chatId: id, 
          message: userText,
          imageBase64: imageToSend,
          history: updatedLogUser.map(msg => {
            const isUser = msg.startsWith("User:");
            return {
              role: isUser ? "user" : "model",
              text: msg.replace(/^(User:|AI:)\s*/, "")
            };
          }) 
        }),
      });

      if (!res.ok) throw new Error("API error");
      const resData = await res.json();
      
      let aiText = resData.text;

      if (resData.extractedActions && resData.extractedActions.length > 0) {
        aiText += "\n\n*(System: Assistant has added the medication to your schedule)*";
      }

      const updatedLogAI = [...updatedLogUser, `AI: ${aiText}`];
      setChatLog(updatedLogAI);

      await supabase
        .from("chat_messages")
        .insert([
          { chat_id: id, patient_id: user?.id, role: "user", content: logText },
          { chat_id: id, patient_id: user?.id, role: "assistant", content: aiText }
        ]);

    } catch (err) {
      console.error("Failed", err);
      alert("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="flex-1 flex items-center justify-center">Loading chat...</div>;

  return (
    <div className="flex flex-col h-full bg-white relative">
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {chatLog.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400">
            Start a conversation!
          </div>
        ) : (
          chatLog.map((msg, idx) => {
            const isUser = msg.startsWith("User:");
            const text = msg.replace(/^(User:|AI:)\s*/, "");
            return (
              <ChatMessageBubble 
                key={idx} 
                role={isUser ? "user" : "assistant"} 
                content={text} 
              />
            );
          })
        )}
        {sending && (
          <div className="flex gap-4 flex-row">
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-emerald-100 text-emerald-600">
              <Bot size={18} />
            </div>
            <div className="px-4 py-3 rounded-2xl bg-gray-100 text-gray-800 rounded-tl-none flex items-center gap-1">
               <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
               <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></span>
               <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <ChatInput
        input={input}
        setInput={setInput}
        selectedImage={selectedImage}
        setSelectedImage={setSelectedImage}
        sending={sending}
        handleSend={handleSend}
      />
    </div>
  );
}
