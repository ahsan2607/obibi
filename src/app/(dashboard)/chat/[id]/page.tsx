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
  const [aiId, setAiId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    /**
     * Fetches the chat history from Supabase.
     */
    const fetchChat = async () => {
      const { data: chatData } = await supabase
        .from("chats")
        .select("ai_id")
        .eq("id", id)
        .maybeSingle();

      if (chatData?.ai_id) {
        setAiId(chatData.ai_id);
      }

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
    if (!user || (!input.trim() && !selectedImage) || sending) return;

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
        for (const action of resData.extractedActions) {
          if (action.action === "add to reminder database") {
            const rangeText = action.freqRange === 'daily' ? 'Hari' : action.freqRange === 'weekly' ? 'Minggu' : 'Bulan';
            const finalDosageString = `${action.freqCount || 1}x Per ${rangeText} (${action.dosisAmount || 1} ${action.stockUnit || 'piece'})`;

            const { data: medData, error: medError } = await supabase
              .from("medications")
              .insert([{
                patient_id: user.id,
                name: action.medicine_name || "Unknown Medicine",
                description: action.description || "Added via AI Assistant",
                dosage: finalDosageString,
                side_effects: action.side_effects || "",
                form: action.form || "tablet",
                stock_quantity: 0,
                stock_unit: action.stockUnit || "piece",
                is_active: true
              }])
              .select()
              .single();

            if (!medError && medData) {
              const times: string[] = Array.isArray(action.scheduledTimes) ? action.scheduledTimes : ["08:00"];
              const schedulePromises = times.map(time => {
                return supabase.from("medication_schedules").insert([{
                  patient_id: user.id,
                  medication_id: medData.id,
                  scheduled_time: time,
                  dosis: `${action.dosisAmount || 1} ${action.stockUnit || 'piece'}`,
                  start_date: new Date().toISOString().split("T")[0],
                  instructions: action.freqRange || "daily"
                }]);
              });
              await Promise.all(schedulePromises);
            }
          }
        }
        aiText += "\n\n*(System: Assistant has automatically added the medication and schedule to your reminder database!)*";
      }

      const updatedLogAI = [...updatedLogUser, `AI: ${aiText}`];
      setChatLog(updatedLogAI);

      await supabase
        .from("chat_messages")
        .insert([
          { chat_id: id, patient_id: user?.id, role: "user", content: logText, ai_id: aiId || 1 },
          { chat_id: id, patient_id: user?.id, role: "assistant", content: aiText, ai_id: aiId || 1 }
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
