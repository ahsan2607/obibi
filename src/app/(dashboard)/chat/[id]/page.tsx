"use client";

import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase/client";
import { Bot } from "lucide-react";
import { useEffect, useRef, useState, use } from "react";
import { ChatMessageBubble } from "@/components/chat/ChatMessageBubble";
import { ChatInput } from "@/components/chat/ChatInput";

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
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
  const [chatLog, setChatLog] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [aiId, setAiId] = useState<number | null>(null);
  const [newlyAdded, setNewlyAdded] = useState<{
    medications: Array<{ id: number; name: string }>;
    schedules: Array<{ id: number; time: string; medication_id: number }>;
  }>({ medications: [], schedules: [] });
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
        setChatLog(data as ChatMessage[]);
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
    const logText = selectedImage ? `${userText}\n[Image Attached]` : userText;
    const userMessage: ChatMessage = { role: "user", content: logText };
    const updatedLogUser = [...chatLog, userMessage];
    
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
          history: updatedLogUser.map(msg => ({
            role: msg.role === "user" ? "user" : "model",
            text: msg.content
          })),
          newlyAdded: newlyAdded
        }),
      });

      if (!res.ok) throw new Error("API error");
      const resData = await res.json();
      
      let aiText = resData.text;
      const addedMeds: string[] = [];

      if (resData.extractedActions && resData.extractedActions.length > 0) {
        for (const action of resData.extractedActions) {
          if (action.action === "add to reminder database") {
            const rangeText = action.freqRange === 'daily' ? 'Hari' : action.freqRange === 'weekly' ? 'Minggu' : 'Bulan';
            const finalDosageString = `${action.freqCount || 1}x Per ${rangeText} (${action.dosisAmount || 1} ${action.stockUnit || 'piece'})`;

            const stockQty = action.stockQuantity !== undefined && action.stockQuantity !== null 
              ? Number(action.stockQuantity) 
              : 10;
            const isDefault = action.stockQuantity === undefined || action.stockQuantity === null;

            const { data: medData, error: medError } = await supabase
              .from("medications")
              .insert([{
                patient_id: user.id,
                name: action.medicine_name || "Unknown Medicine",
                description: action.description || "Added via AI Assistant",
                dosage: finalDosageString,
                side_effects: action.side_effects || "",
                form: action.form || "tablet",
                stock_quantity: stockQty,
                stock_unit: action.stockUnit || "piece",
                is_active: true
              }])
              .select()
              .single();

            if (!medError && medData) {
              const times: string[] = Array.isArray(action.scheduledTimes) ? action.scheduledTimes : ["08:00"];
              const schedulePromises = times.map(async (time) => {
                const { data: schedData, error: schedError } = await supabase
                  .from("medication_schedules")
                  .insert([{
                    patient_id: user.id,
                    medication_id: medData.id,
                    scheduled_time: time,
                    dosis: `${action.dosisAmount || 1} ${action.stockUnit || 'piece'}`,
                    start_date: new Date().toISOString().split("T")[0],
                    instructions: action.freqRange || "daily"
                  }])
                  .select()
                  .single();
                if (schedError) {
                  console.error("Failed to insert schedule", schedError);
                  return null;
                }
                return schedData;
              });
              const createdSchedules = await Promise.all(schedulePromises);
              const validSchedules = createdSchedules.filter((s): s is any => s !== null);
              const scheduleDetails = validSchedules
                .map(s => `${s.scheduled_time.slice(0, 5)} [Jadwal ID: ${s.id}]`)
                .join(", ");

              const scheduleInfo = scheduleDetails ? ` pada ${scheduleDetails}` : "";
              addedMeds.push(`${medData.name} [ID: ${medData.id}] (${isDefault ? "stok default: " : "stok: "}${stockQty} ${medData.stock_unit})${scheduleInfo}`);
              
              setNewlyAdded(prev => ({
                medications: [...prev.medications, { id: medData.id, name: medData.name }],
                schedules: [
                  ...prev.schedules,
                  ...validSchedules.map(s => ({ id: s.id, time: s.scheduled_time, medication_id: s.medication_id }))
                ]
              }));
            }
          }

          if (action.action === "update medication") {
            const medId = Number(action.medication_id);
            const updateData: any = {};
            if (action.medicine_name) updateData.name = action.medicine_name;
            if (action.description) updateData.description = action.description;
            if (action.side_effects) updateData.side_effects = action.side_effects;
            if (action.form) updateData.form = action.form;
            if (action.stockQuantity !== undefined) updateData.stock_quantity = Number(action.stockQuantity);
            if (action.stockUnit) updateData.stock_unit = action.stockUnit;

            if (action.dosisAmount || action.freqCount || action.freqRange) {
              const { data: existingMed } = await supabase
                .from("medications")
                .select("*")
                .eq("id", medId)
                .single();
              
              if (existingMed) {
                const dosisAmt = action.dosisAmount || existingMed.dosage?.match(/\((.*)\)/)?.[1]?.split(" ")?.[0] || "1";
                const count = action.freqCount || existingMed.dosage?.match(/^(\d+)x/)?.[1] || "3";
                const range = action.freqRange || (existingMed.dosage?.includes("Hari") ? "daily" : existingMed.dosage?.includes("Minggu") ? "weekly" : "monthly");
                const rangeText = range === 'daily' ? 'Hari' : range === 'weekly' ? 'Minggu' : 'Bulan';
                const stockUnitText = action.stockUnit || existingMed.stock_unit || "piece";
                updateData.dosage = `${count}x Per ${rangeText} (${dosisAmt} ${stockUnitText})`;
              }
            }

            const { data: updatedMed, error: updateError } = await supabase
              .from("medications")
              .update(updateData)
              .eq("id", medId)
              .select()
              .single();

            if (!updateError && updatedMed) {
              addedMeds.push(`diperbarui: ${updatedMed.name} (stok: ${updatedMed.stock_quantity})`);
            } else {
              console.error("Failed to update medication", updateError);
            }
          }

          if (action.action === "update schedule") {
            const schedId = Number(action.schedule_id);
            const updateData: any = {};
            if (action.scheduled_time) updateData.scheduled_time = action.scheduled_time;
            if (action.dosis) updateData.dosis = action.dosis;
            if (action.instructions) updateData.instructions = action.instructions;

            const { data: updatedSched, error: updateError } = await supabase
              .from("medication_schedules")
              .update(updateData)
              .eq("id", schedId)
              .select("*, medications(name)")
              .single();

            if (!updateError && updatedSched) {
              const medName = (updatedSched.medications as any)?.name || "Obat";
              addedMeds.push(`jadwal diperbarui: ${medName} ke pukul ${updatedSched.scheduled_time}`);
            } else {
              console.error("Failed to update schedule", updateError);
            }
          }
        }
      }

      const newLogs: ChatMessage[] = [
        ...updatedLogUser,
        { role: "assistant", content: aiText }
      ];
      if (addedMeds.length > 0) {
        newLogs.push({
          role: "system",
          content: `Assistant has automatically processed the following action(s): ${addedMeds.join(", ")}!`
        });
      }
      setChatLog(newLogs);

      const messagesToInsert = [
        { chat_id: id, patient_id: user?.id, role: "user", content: logText, ai_id: aiId || 1 },
        { chat_id: id, patient_id: user?.id, role: "assistant", content: aiText, ai_id: aiId || 1 }
      ];
      if (addedMeds.length > 0) {
        messagesToInsert.push({
          chat_id: id,
          patient_id: user?.id,
          role: "system",
          content: `Assistant has automatically processed the following action(s): ${addedMeds.join(", ")}!`,
          ai_id: aiId || 1
        });
      }
      await supabase.from("chat_messages").insert(messagesToInsert);

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
            const cleanedContent = msg.content.replace(/^(User:|AI:)\s*/, "");
            return (
              <ChatMessageBubble 
                key={idx} 
                role={msg.role} 
                content={cleanedContent} 
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
