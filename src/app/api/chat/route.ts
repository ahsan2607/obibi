import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

interface HistoryMessage {
  text: string;
  role: "user" | "assistant" | "model";
}

/**
 * Handles POST requests for the chat API, communicating with the OpenRouter AI model.
 * Automatically injects the user's active database context (medications, schedules, logs)
 * into the system prompt to enable contextual medical and scheduling assistance.
 */
export async function POST(req: Request) {
  try {
    const { chatId, message, history, imageBase64 } = await req.json();

    const apiKey = process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY || "";

    if (!apiKey) {
      return NextResponse.json(
        { error: "API Key (OPENROUTER_API_KEY or GEMINI_API_KEY) is not set in environment variables" },
        { status: 500 }
      );
    }

    // Initialize Supabase server client
    const supabase = await createClient();

    // Fetch patient_id from the chats table
    const { data: chatData } = await supabase
      .from("chats")
      .select("patient_id")
      .eq("id", chatId)
      .maybeSingle();

    const patientId = chatData?.patient_id;

    // Fetch user context from database if patientId exists
    let contextString = "No patient context available.";
    if (patientId) {
      // 1. Fetch active medications
      const { data: medications } = await supabase
        .from("medications")
        .select("name, description, dosage, side_effects, form, stock_quantity, stock_unit")
        .eq("patient_id", patientId)
        .eq("is_active", true);

      // 2. Fetch medication schedules
      const { data: schedules } = await supabase
        .from("medication_schedules")
        .select("scheduled_time, dosis, start_date, end_date, instructions, medications(name)")
        .eq("patient_id", patientId);

      // 3. Fetch compliance logs for the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { data: complianceLogs } = await supabase
        .from("compliance_logs")
        .select("status, logged_at, medication_schedules(medications(name))")
        .eq("patient_id", patientId)
        .gte("logged_at", sevenDaysAgo.toISOString());

      // Format patient context for the system prompt
      contextString = "Patient Context:\n";
      
      contextString += "\nAvailable Medications:\n";
      if (medications && medications.length > 0) {
        medications.forEach(m => {
          contextString += `- ${m.name} (${m.form}): ${m.dosage || 'No dosage specified'}. Stock: ${m.stock_quantity} ${m.stock_unit}. Side effects: ${m.side_effects || 'None'}\n`;
        });
      } else {
        contextString += "No active medications recorded.\n";
      }

      contextString += "\nActive Medication Schedules:\n";
      if (schedules && schedules.length > 0) {
        schedules.forEach(s => {
          const medName = (s.medications as any)?.name || "Unknown Medicine";
          contextString += `- ${medName}: ${s.dosis || '1 dose'} at ${s.scheduled_time}. Starts: ${s.start_date}${s.end_date ? `, Ends: ${s.end_date}` : ''}. Recurrence: ${s.instructions || 'daily'}\n`;
        });
      } else {
        contextString += "No schedules recorded.\n";
      }

      contextString += "\nRecent Compliance Logs (Last 7 Days):\n";
      if (complianceLogs && complianceLogs.length > 0) {
        complianceLogs.forEach(log => {
          const medName = (log.medication_schedules as any)?.medications?.name || "Unknown Medicine";
          const dateStr = log.logged_at ? new Date(log.logged_at).toLocaleDateString() : 'Unknown Date';
          contextString += `- [${dateStr}] ${medName}: Status: ${log.status}\n`;
        });
      } else {
        contextString += "No recent compliance logs.\n";
      }
    }

    // Convert history to OpenAI format
    const formattedHistory = (history as HistoryMessage[]).map((msg) => ({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.text,
    }));

    const systemInstruction = `You are a medicine reminder agent that reads images or text and returns a response with optionally an action response.

Action response are defined by exactly this format at the very end of your response, wrapped in a JSON array:
[{"action":"add to reminder database", "medicine_name":"string", "description":"string", "side_effects":"string", "form":"tablet", "dosisAmount":1, "stockUnit":"piece", "freqCount":3, "freqRange":"daily", "scheduledTimes":["08:00", "13:00", "20:00"]}]

form can be: tablet|capsule|liquid|cream|injection|drops
stockUnit can be: piece|ml|mg|drop|puff
freqRange can be: daily|weekly|monthly
Make sure the length of scheduledTimes matches freqCount.
Also you are a helpful and empathetic health assistant. You can answer questions about medicines, healthy habits, and general wellness. Do NOT give formal medical diagnoses. Always recommend consulting a real doctor for serious conditions.

Here is the current database context for the patient you are chatting with. Use this context to answer questions about their medications, schedules, and compliance/logs:
${contextString}`;

    // Construct the latest user message with multimodal support if image exists
    let latestMessageContent: any = message;
    if (imageBase64) {
      latestMessageContent = [
        { type: "text", text: message },
        { type: "image_url", image_url: { url: imageBase64 } }
      ];
    }

    const messages = [
      { role: "system", content: systemInstruction },
      ...formattedHistory,
      { role: "user", content: latestMessageContent }
    ];

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Medicine Reminder App",
      },
      body: JSON.stringify({
        model: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
        messages: messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    let responseText = data.choices?.[0]?.message?.content || "";

    // Parse the JSON array action if exists
    let extractedActions = null;
    const jsonMatch = responseText.match(/\[\s*\{\s*"action"\s*:\s*"add to reminder database"[\s\S]*\}\s*\]/);
    if (jsonMatch) {
      try {
        extractedActions = JSON.parse(jsonMatch[0]);
        // Remove the json string from the responseText to not clutter the chat
        responseText = responseText.replace(jsonMatch[0], '').trim();
      } catch (e) {
        console.error("Failed to parse action JSON", e);
      }
    }

    return NextResponse.json({ text: responseText, extractedActions });
  } catch (error) {
    console.error("OpenRouter API Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate response";
    return NextResponse.json(
      { error: "Failed to generate response", details: errorMessage },
      { status: 500 }
    );
  }
}
