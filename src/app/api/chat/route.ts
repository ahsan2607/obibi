import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Initialize Gemini API
const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req: Request) {
  try {
    const { chatId, message, history } = await req.json();

    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not set in environment variables" },
        { status: 500 }
      );
    }

    // Convert history to Gemini format
    const formattedHistory = history.map((msg: any) => ({
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.text }],
    }));

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Start chat with history
    const chat = model.startChat({
      history: formattedHistory,
      systemInstruction: "You are a helpful and empathetic health assistant. You can answer questions about medicines, healthy habits, and general wellness. Do NOT give formal medical diagnoses. Always recommend consulting a real doctor for serious conditions.",
    });

    const result = await chat.sendMessage(message);
    const responseText = result.response.text();

    return NextResponse.json({ text: responseText });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json(
      { error: "Failed to generate response", details: error.message },
      { status: 500 }
    );
  }
}
