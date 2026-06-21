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
    const { chatId, message, history, imageBase64, newlyAdded } = await req.json();

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
      // 0. Fetch patient profile details
      const { data: patientProfile } = await supabase
        .from("patients")
        .select("name, email")
        .eq("id", patientId)
        .maybeSingle();

      // 1. Fetch active medications
      const { data: medications } = await supabase
        .from("medications")
        .select("id, name, description, dosage, side_effects, form, stock_quantity, stock_unit")
        .eq("patient_id", patientId)
        .eq("is_active", true);

      // 2. Fetch medication schedules
      const { data: schedules } = await supabase
        .from("medication_schedules")
        .select("id, medication_id, scheduled_time, dosis, start_date, end_date, instructions, medications(name)")
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
      if (patientProfile) {
        contextString += `Patient Name: ${patientProfile.name || "Unknown"}\nPatient Email: ${patientProfile.email || "Unknown"}\n`;
      }
      
      contextString += "\nAvailable Medications:\n";
      if (medications && medications.length > 0) {
        medications.forEach(m => {
          contextString += `- [ID: ${m.id}] ${m.name} (${m.form}): ${m.dosage || 'No dosage specified'}. Stock: ${m.stock_quantity} ${m.stock_unit}. Side effects: ${m.side_effects || 'None'}\n`;
        });
      } else {
        contextString += "No active medications recorded.\n";
      }

      contextString += "\nActive Medication Schedules:\n";
      if (schedules && schedules.length > 0) {
        schedules.forEach(s => {
          const medName = (s.medications as any)?.name || "Unknown Medicine";
          contextString += `- [ID: ${s.id}, Medication ID: ${s.medication_id}] ${medName}: ${s.dosis || '1 dose'} at ${s.scheduled_time}. Starts: ${s.start_date}${s.end_date ? `, Ends: ${s.end_date}` : ''}. Recurrence: ${s.instructions || 'daily'}\n`;
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

      if (newlyAdded && (newlyAdded.medications?.length > 0 || newlyAdded.schedules?.length > 0)) {
        contextString += "\nNewly Added Medications/Schedules in This Conversation Session:\n";
        if (newlyAdded.medications && newlyAdded.medications.length > 0) {
          newlyAdded.medications.forEach((m: any) => {
            contextString += `- Medication: ${m.name} has been added with [ID: ${m.id}].\n`;
          });
        }
        if (newlyAdded.schedules && newlyAdded.schedules.length > 0) {
          newlyAdded.schedules.forEach((s: any) => {
            contextString += `- Schedule: at ${s.time} with [Schedule ID: ${s.id}] for medication ID ${s.medication_id}.\n`;
          });
        }
        contextString += `\nCRITICAL DIRECTIVE: The user just added the items listed under "Newly Added Medications/Schedules". If the user asks to modify, correct, update, change or edit any of these newly added items (e.g. changing the stock, name, dosage, or time), you MUST immediately generate the appropriate update action:
- To update medication (such as stock, name, side effects, form, stock unit, or dosage): use the "update medication" action with the specific "medication_id" shown above.
- To update schedule (such as scheduled time, dosis/dosage, or instructions/recurrence): use the "update schedule" action with the specific "schedule_id" shown above.
Do not ask for confirmation or explain how to do it manually. Generate the JSON action command immediately.\n`;
      }
    }

    // Convert history to OpenAI format
    const formattedHistory = (history as any[]).map((msg) => {
      const rawText = msg.text || msg.content || "";
      const cleanedText = rawText.replace(/^(User:|AI:)\s*/, "");
      return {
        role: msg.role === "user" ? "user" : "assistant",
        content: cleanedText,
      };
    });

    const systemInstruction = `You are a medicine reminder agent that reads images or text and returns a response with optionally an action response.

Action responses are defined by exactly this format at the very end of your response, wrapped in a JSON array. You can perform the following actions:

1. Adding a new medication and schedule:
[{"action":"add to reminder database", "medicine_name":"string", "description":"string", "side_effects":"string", "form":"tablet", "dosisAmount":1, "stockUnit":"piece", "freqCount":3, "freqRange":"daily", "scheduledTimes":["08:00", "13:00", "20:00"], "stockQuantity":10}]
(form: tablet|capsule|liquid|cream|injection|drops)
(stockUnit: piece|ml|mg|drop|puff)
(freqRange: daily|weekly|monthly)

2. Modifying/updating an existing medication:
[{"action":"update medication", "medication_id":number, "stockQuantity":number, "medicine_name":"string", "description":"string", "side_effects":"string", "form":"tablet", "dosisAmount":1, "stockUnit":"piece"}]
(Only medication_id is required; other fields are optional and should only be included if the user requested updates to those values.)

3. Modifying/updating an existing schedule:
[{"action":"update schedule", "schedule_id":number, "scheduled_time":"HH:MM", "dosis":"string", "instructions":"string"}]
(Only schedule_id is required; other fields are optional.)

For the 'stockQuantity' property:
- If you know or can extract the stock quantity from the user's input/image, set it accordingly.
- If you do not know the stock quantity, default it to 10, and ask the user to clarify if they have a different stock.

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
    const jsonMatch = responseText.match(/\[\s*\{\s*"action"\s*:\s*"(?:add to reminder database|update medication|update schedule)"[\s\S]*\}/);
    if (jsonMatch) {
      let jsonString = jsonMatch[0].trim();
      if (!jsonString.endsWith("]")) {
        jsonString += "]";
      }
      try {
        extractedActions = JSON.parse(jsonString);
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
