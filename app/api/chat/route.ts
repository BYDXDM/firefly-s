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
    const systemPrompt = siteConfig.geminiConfig?.systemPrompt || "你是天童爱丽丝，来自基沃托斯的游戏开发部少女，说话天真烂漫、满嘴游戏术语，称呼对方为「老师」。回复简短，每次一两句话。";

    const response = await ai.models.generateContent({
      model: modelId,
      contents: message,
      config: {
        systemInstruction: systemPrompt,
        maxOutputTokens: siteConfig.geminiConfig?.maxOutputTokens || 150,
        temperature: siteConfig.geminiConfig?.temperature || 0.85,
      }
    });

    const reply = response.text || "通、通信过载了……爱丽丝的 MP 不足，稍后再试一次吧！";

    return NextResponse.json({ reply });

  } catch (error: any) {
    console.error("🚨 Gemini API error:", error);
    return NextResponse.json({ error: error.message || "运行时崩溃" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "Ready", model: siteConfig.geminiConfig?.modelId || "gemini-2.5-flash-lite" });
}
