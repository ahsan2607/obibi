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
          history: updatedLogUser
            .filter(msg => msg.role !== "system")
            .map(msg => ({
              role: msg.role === "user" ? "user" : "model",
              text: msg.content
            })),
          newlyAdded: newlyAdded
        }),
      });

      if (!res.ok) throw new Error("API error");
      const resData = await res.json();
      
      let aiText = resData.text;

      // ── STEP 1: Show AI response IMMEDIATELY & save messages to DB ──
      // This ensures the conversation is visible and persisted even if
      // action processing takes time or user refreshes.
      const logsWithAiResponse: ChatMessage[] = [
        ...updatedLogUser,
        { role: "assistant", content: aiText }
      ];
      setChatLog(logsWithAiResponse);
      setSending(false); // Stop showing loading dots immediately

      // Save user + assistant messages to DB right away
      await supabase.from("chat_messages").insert([
        { chat_id: id, patient_id: user?.id, role: "user", content: logText, ai_id: aiId || 1 },
        { chat_id: id, patient_id: user?.id, role: "assistant", content: aiText, ai_id: aiId || 1 }
      ]);

      // ── STEP 2: Process actions in the background ─────────────────
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

          // ── ADD SCHEDULE to existing medication ──────────────────────
          if (action.action === "add schedule") {
            const medId = Number(action.medication_id);
            const { data: schedData, error: schedError } = await supabase
              .from("medication_schedules")
              .insert([{
                patient_id: user.id,
                medication_id: medId,
                scheduled_time: action.scheduled_time || "08:00",
                dosis: action.dosis || "1 piece",
                start_date: new Date().toISOString().split("T")[0],
                instructions: action.instructions || "daily"
              }])
              .select("*, medications(name)")
              .single();

            if (!schedError && schedData) {
              const medName = (schedData.medications as any)?.name || "Obat";
              addedMeds.push(`jadwal ditambahkan: ${medName} pukul ${schedData.scheduled_time} [Jadwal ID: ${schedData.id}]`);
              setNewlyAdded(prev => ({
                ...prev,
                schedules: [...prev.schedules, { id: schedData.id, time: schedData.scheduled_time, medication_id: schedData.medication_id }]
              }));
            } else {
              console.error("Failed to add schedule", schedError);
            }
          }

          // ── DELETE MEDICATION with cascade ───────────────────────────
          if (action.action === "delete medication") {
            const medId = Number(action.medication_id);
            try {
              // 1. Fetch schedules for this medication
              const { data: schedules } = await supabase
                .from("medication_schedules")
                .select("id")
                .eq("medication_id", medId);

              const scheduleIds = schedules?.map(s => s.id) || [];

              if (scheduleIds.length > 0) {
                // 2. Delete reminders
                await supabase.from("reminder").delete().in("jadwal_id", scheduleIds);
                // 3. Delete compliance logs
                await supabase.from("compliance_logs").delete().in("schedule_id", scheduleIds);
                // 4. Delete schedules
                await supabase.from("medication_schedules").delete().eq("medication_id", medId);
              }

              // 5. Delete medication
              const { data: deletedMed, error: deleteError } = await supabase
                .from("medications")
                .delete()
                .eq("id", medId)
                .select("name")
                .single();

              if (!deleteError && deletedMed) {
                addedMeds.push(`obat dihapus: ${deletedMed.name} (ID: ${medId}) beserta ${scheduleIds.length} jadwal terkait`);
                // Clean from newlyAdded state too
                setNewlyAdded(prev => ({
                  medications: prev.medications.filter(m => m.id !== medId),
                  schedules: prev.schedules.filter(s => s.medication_id !== medId)
                }));
              } else {
                console.error("Failed to delete medication", deleteError);
              }
            } catch (err) {
              console.error("Delete medication cascade failed", err);
            }
          }

          // ── DELETE SCHEDULE with cascade ─────────────────────────────
          if (action.action === "delete schedule") {
            const schedId = Number(action.schedule_id);
            try {
              // 1. Delete reminders for this schedule
              await supabase.from("reminder").delete().eq("jadwal_id", schedId);
              // 2. Delete compliance logs for this schedule
              await supabase.from("compliance_logs").delete().eq("schedule_id", schedId);
              // 3. Delete the schedule itself
              const { data: deletedSched, error: deleteError } = await supabase
                .from("medication_schedules")
                .delete()
                .eq("id", schedId)
                .select("*, medications(name)")
                .single();

              if (!deleteError && deletedSched) {
                const medName = (deletedSched.medications as any)?.name || "Obat";
                addedMeds.push(`jadwal dihapus: ${medName} pukul ${deletedSched.scheduled_time} (Jadwal ID: ${schedId})`);
                setNewlyAdded(prev => ({
                  ...prev,
                  schedules: prev.schedules.filter(s => s.id !== schedId)
                }));
              } else {
                console.error("Failed to delete schedule", deleteError);
              }
            } catch (err) {
              console.error("Delete schedule cascade failed", err);
            }
          }

          // ── ADD DRUG INTERACTION ─────────────────────────────────────
          if (action.action === "add drug interaction") {
            const { data: interactionData, error: interactionError } = await supabase
              .from("drug_interactions")
              .insert([{
                patient_id: user.id,
                medication_pair: [action.drug_1 || "Unknown", action.drug_2 || "Unknown"],
                target_medication: action.drug_1 || "Unknown",
                risk_level: action.risk_level || "Moderate",
                finding_details: action.finding_details || "Dicatat melalui AI Assistant"
              }])
              .select()
              .single();

            if (!interactionError && interactionData) {
              addedMeds.push(`interaksi obat ditambahkan: ${action.drug_1} ↔ ${action.drug_2} (risiko: ${action.risk_level || 'Moderate'}) [ID: ${interactionData.id}]`);
            } else {
              console.error("Failed to add drug interaction", interactionError);
            }
          }

          // ── DELETE DRUG INTERACTION ──────────────────────────────────
          if (action.action === "delete drug interaction") {
            const interactionId = Number(action.interaction_id);
            const { data: deletedInteraction, error: deleteError } = await supabase
              .from("drug_interactions")
              .delete()
              .eq("id", interactionId)
              .select("medication_pair, risk_level")
              .single();

            if (!deleteError && deletedInteraction) {
              const pair = deletedInteraction.medication_pair || ["?", "?"];
              addedMeds.push(`interaksi obat dihapus: ${pair[0]} ↔ ${pair[1]} (ID: ${interactionId})`);
            } else {
              console.error("Failed to delete drug interaction", deleteError);
            }
          }
        }
      }

      // ── STEP 3: After actions complete, append system message ──────
      if (addedMeds.length > 0) {
        const systemContent = `Assistant has automatically processed the following action(s): ${addedMeds.join(", ")}!`;
        setChatLog(prev => [...prev, { role: "system", content: systemContent }]);
        await supabase.from("chat_messages").insert([{
          chat_id: id,
          patient_id: user?.id,
          role: "system",
          content: systemContent,
          ai_id: aiId || 1
        }]);
      }

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
