// app/api/chat/route.ts
import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { siteConfig } from "../../../siteConfig";

const apiKey = process.env.GEMINI_API_KEY;

const ai = new GoogleGenAI({
  apiKey: apiKey || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    if (!apiKey) {
      console.error("❌ Gemini API Key missing in environment");
      return NextResponse.json({ error: "Gemini API Key missing on server" }, { status: 500 });
    }

    const modelId = siteConfig.geminiConfig?.modelId || "gemini-2.5-flash-lite";
    const systemPrompt = siteConfig.geminiConfig?.systemPrompt || "你是一只可爱的猫咪，叫煤球。";

    const response = await ai.models.generateContent({
      model: modelId,
      contents: message,
      config: {
        systemInstruction: systemPrompt,
        maxOutputTokens: siteConfig.geminiConfig?.maxOutputTokens || 150,
        temperature: siteConfig.geminiConfig?.temperature || 0.85,
      }
    });

    const reply = response.text || "本喵现在不想理你喵...";

    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error("🚨 Gemini API error:", error);
    return NextResponse.json({ error: error.message || "运行时崩溃" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "Ready", model: siteConfig.geminiConfig?.modelId || "gemini-2.5-flash-lite" });
}
