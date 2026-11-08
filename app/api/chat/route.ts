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

// 简单的内存频率限制：同一 IP 每分钟最多 10 次，防止 Gemini 配额被脚本刷爆
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 10;
const requestLog = new Map<string, number[]>();

function clientKey(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local';
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (requestLog.get(key) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX) {
    requestLog.set(key, recent);
    return true;
  }
  recent.push(now);
  requestLog.set(key, recent);
  return false;
}

// 单条消息长度上限，防止超长 prompt 消耗 token
const MAX_MESSAGE_LENGTH = 500;

export async function POST(req: NextRequest) {
  if (isRateLimited(clientKey(req))) {
    return NextResponse.json({ error: '消息发送太频繁啦，休息一下再试试～' }, { status: 429 });
  }

  try {
    const body = await req.json().catch(() => null);
    const message = typeof body?.message === 'string' ? body.message.trim() : '';

    if (!message) {
      return NextResponse.json({ error: '消息不能为空' }, { status: 400 });
    }
    if (message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json({ error: `消息太长了，最多 ${MAX_MESSAGE_LENGTH} 字` }, { status: 400 });
    }

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

  } catch (error) {
    // 内部错误细节只进服务端日志，对客户端固定通用文案
    console.error("🚨 Gemini API error:", error);
    return NextResponse.json({ error: "爱丽丝的通信模块出故障了，稍后再试一次吧！" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "Ready", model: siteConfig.geminiConfig?.modelId || "gemini-2.5-flash-lite" });
}
