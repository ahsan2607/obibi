import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * All action types the chatbot can emit as JSON.
 * The system prompt instructs the LLM to output exactly one JSON array
 * at the end of its response when a database mutation is needed.
 */
const ALL_ACTION_TYPES = [
  "add to reminder database",
  "update medication",
  "update schedule",
  "add schedule",
  "delete medication",
  "delete schedule",
  "add drug interaction",
  "delete drug interaction",
] as const;

/**
 * Handles POST requests for the chat API, communicating with the OpenRouter AI model.
 * Automatically injects the user's active database context (medications, schedules, logs,
 * drug interactions) into the system prompt to enable contextual medical and scheduling assistance.
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

      // 4. Fetch existing drug interactions
      const { data: drugInteractions } = await supabase
        .from("drug_interactions")
        .select("id, medication_pair, target_medication, risk_level, finding_details")
        .eq("patient_id", patientId);

      // ── Build context string ──────────────────────────────────────────
      contextString = "";

      if (patientProfile) {
        contextString += `PASIEN: ${patientProfile.name || "Unknown"} (${patientProfile.email || "-"})\n`;
      }

      // Medications - compact table format
      contextString += "\nOBAT AKTIF:\n";
      if (medications && medications.length > 0) {
        medications.forEach(m => {
          contextString += `• ID:${m.id} | ${m.name} (${m.form}) | dosis:${m.dosage || '-'} | stok:${m.stock_quantity} ${m.stock_unit} | efek samping:${m.side_effects || '-'}\n`;
        });
      } else {
        contextString += "Belum ada obat.\n";
      }

      // Schedules - compact
      contextString += "\nJADWAL:\n";
      if (schedules && schedules.length > 0) {
        schedules.forEach(s => {
          const medName = (s.medications as any)?.name || "?";
          contextString += `• JadwalID:${s.id} | ObatID:${s.medication_id} (${medName}) | jam:${s.scheduled_time} | dosis:${s.dosis || '1'} | mulai:${s.start_date}${s.end_date ? ` s/d ${s.end_date}` : ''} | ${s.instructions || 'daily'}\n`;
        });
      } else {
        contextString += "Belum ada jadwal.\n";
      }

      // Compliance logs - compact
      contextString += "\nLOG KEPATUHAN (7 hari):\n";
      if (complianceLogs && complianceLogs.length > 0) {
        complianceLogs.forEach(log => {
          const medName = (log.medication_schedules as any)?.medications?.name || "?";
          const dateStr = log.logged_at ? new Date(log.logged_at).toLocaleDateString("id-ID") : '?';
          contextString += `• ${dateStr} ${medName}: ${log.status}\n`;
        });
      } else {
        contextString += "Tidak ada log.\n";
      }

      // Drug interactions - NEW
      contextString += "\nINTERAKSI OBAT TERCATAT:\n";
      if (drugInteractions && drugInteractions.length > 0) {
        drugInteractions.forEach(di => {
          const pair = di.medication_pair || [di.target_medication, "?"];
          contextString += `• InteraksiID:${di.id} | ${pair[0]} ↔ ${pair[1]} | risiko:${di.risk_level} | detail:${di.finding_details}\n`;
        });
      } else {
        contextString += "Belum ada catatan interaksi.\n";
      }

      // Newly added items from current session
      if (newlyAdded && (newlyAdded.medications?.length > 0 || newlyAdded.schedules?.length > 0)) {
        contextString += "\nBARU DITAMBAHKAN SESI INI:\n";
        if (newlyAdded.medications && newlyAdded.medications.length > 0) {
          newlyAdded.medications.forEach((m: any) => {
            contextString += `• Obat: ${m.name} (ID:${m.id})\n`;
          });
        }
        if (newlyAdded.schedules && newlyAdded.schedules.length > 0) {
          newlyAdded.schedules.forEach((s: any) => {
            contextString += `• Jadwal: jam ${s.time} (JadwalID:${s.id}, ObatID:${s.medication_id})\n`;
          });
        }
        contextString += "PENTING: Jika user minta koreksi item di atas, langsung generate aksi update/delete tanpa konfirmasi ulang.\n";
      }
    }

    // ── Filter & format history ─────────────────────────────────────────
    // CRITICAL FIX: exclude system messages from history sent to LLM
    const formattedHistory = (history as any[])
      .filter((msg) => {
        const role = msg.role || "";
        return role === "user" || role === "assistant" || role === "model";
      })
      .map((msg) => {
        const rawText = msg.text || msg.content || "";
        const cleanedText = rawText.replace(/^(User:|AI:)\s*/, "");
        return {
          role: msg.role === "user" ? "user" : "assistant",
          content: cleanedText,
        };
      });

    // ── System prompt — optimized for free/small LLMs ───────────────────
    const systemInstruction = `Kamu adalah asisten pengingat obat yang cerdas dan empatik. Kamu membantu pasien mengelola obat, jadwal, dan interaksi obat mereka.

ATURAN UTAMA:
- Jawab dalam Bahasa Indonesia yang ramah dan singkat
- JANGAN berikan diagnosa medis. Sarankan konsultasi dokter untuk hal serius
- Jika user minta aksi database (tambah/ubah/hapus obat/jadwal/interaksi), LANGSUNG generate JSON aksi. Jangan tanya konfirmasi berlebihan
- Jika informasi kurang (misal nama obat tidak jelas), baru tanya sekali saja
- JSON aksi HARUS ditulis di AKHIR respons, dalam format array JSON

DAFTAR AKSI (tulis persis seperti contoh):

1. TAMBAH OBAT BARU + JADWAL:
[{"action":"add to reminder database","medicine_name":"Amoxicillin","description":"Antibiotik","side_effects":"Mual","form":"capsule","dosisAmount":1,"stockUnit":"piece","freqCount":2,"freqRange":"daily","scheduledTimes":["08:00","20:00"],"stockQuantity":10}]
form: tablet|capsule|liquid|cream|injection|drops
stockUnit: piece|ml|mg|drop|puff
freqRange: daily|weekly|monthly

2. UPDATE OBAT (field opsional, hanya sertakan yang berubah):
[{"action":"update medication","medication_id":28,"stockQuantity":20}]
Field opsional: medicine_name, description, side_effects, form, dosisAmount, stockUnit, stockQuantity

3. UPDATE JADWAL (field opsional):
[{"action":"update schedule","schedule_id":42,"scheduled_time":"16:00"}]
Field opsional: scheduled_time, dosis, instructions

4. TAMBAH JADWAL KE OBAT YANG SUDAH ADA:
[{"action":"add schedule","medication_id":28,"scheduled_time":"16:00","dosis":"1 capsule","instructions":"daily"}]

5. HAPUS OBAT (beserta semua jadwal & log terkait):
[{"action":"delete medication","medication_id":28}]

6. HAPUS JADWAL:
[{"action":"delete schedule","schedule_id":42}]

7. TAMBAH INTERAKSI OBAT:
[{"action":"add drug interaction","drug_1":"Amoxicillin","drug_2":"Ibuprofen","risk_level":"Moderate","finding_details":"Dapat menyebabkan iritasi lambung"}]
risk_level: Low|Moderate|High|Severe

8. HAPUS INTERAKSI OBAT:
[{"action":"delete drug interaction","interaction_id":5}]

TIPS PENTING:
- Untuk mengubah jadwal dari 1 waktu ke 2 waktu: gunakan "update schedule" untuk waktu lama + "add schedule" untuk waktu baru. Contoh: ubah jadwal ID 42 (08:00) jadi 08:00 dan 16:00 → [{"action":"update schedule","schedule_id":42,"scheduled_time":"08:00"},{"action":"add schedule","medication_id":28,"scheduled_time":"16:00","dosis":"1 capsule","instructions":"daily"}]
- Boleh gabung beberapa aksi dalam 1 array JSON
- Jika stok tidak disebutkan user, default 10
- Gunakan ID yang ada di konteks database, JANGAN mengarang ID

DATA PASIEN SAAT INI:
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

    // ── Parse JSON action array from LLM response ──────────────────────
    // Build a regex that matches any of the known action types
    const actionTypesPattern = ALL_ACTION_TYPES.map(a => a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join("|");
    const jsonRegex = new RegExp(`\\[\\s*\\{\\s*"action"\\s*:\\s*"(?:${actionTypesPattern})"[\\s\\S]*\\}\\s*\\]`);

    let extractedActions = null;
    const jsonMatch = responseText.match(jsonRegex);
    if (jsonMatch) {
      let jsonString = jsonMatch[0].trim();
      // Ensure the array is properly closed
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

    // Clean up common LLM artifacts from free models
    // Some free models output raw JSON objects like {'type':'text','text':'...'} instead of clean text
    responseText = responseText
      .replace(/^\s*\{['"]type['"]\s*:\s*['"]text['"]\s*,\s*['"]text['"]\s*:\s*['"]/i, '')
      .replace(/['"]\s*\}\s*$/i, '')
      .trim();

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
