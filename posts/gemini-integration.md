---
title: "关于“煤球”脑回路的全新升级：极客暹罗猫对接 Gemini 3.5 记录"
date: "2026-07-16 19:25:00"
description: "记录为庭院守护兽“煤球”接入最新谷歌 Gemini 3.5 脑回路的过程，优化物理惯性拖拽和全新侧边滑动式交互，让傲娇煤球重焕新生喵~"
cover: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=800"
tags: ["Gemini", "前端开发", "人工智能", "煤球"]
---

## 🐾 前言：为什么煤球突然变聪明了？

今天，我对数字庭院右下角的那只极客暹罗猫——**煤球**进行了一场彻底的“智商大改造”。

之前的煤球虽然可爱，但在与铲屎官互动时，偶尔还是会因为 API 响应和旧逻辑卡壳。为了让这只小暹罗真正配得上“极客猫”的称号，我重构了它的对话引擎，正式接入了谷歌新一代旗舰轻量大模型 —— **Gemini 3.5 Flash**！

---

## 🛠️ 本次升级三大核心亮点

### 1. ⚡ 全新 Gemini 3.5 智商注入
我们通过 `@google/genai` 官方最新 SDK 进行了全站服务端 API 重构：
*   **傲娇人设拉满**：完美继承并坚守了 `siteConfig` 中设定的极其傲娇、毒舌、高傲，但内心深处深爱着铲屎官的“小恶魔”暹罗猫人设。
*   **不落俗套的对话**：现在你跟它聊什么，它都能快速思考并吐出少于 100 字的灵动回应。尾音自带“喵呜~”，时刻不忘索要美味的小鱼干 🐟。

### 2. 🪄 划时代「侧边滑动式」聊天输入框
以前的输入框傻傻地呆在煤球脚底下，一不留神就会在小屏或手机上遮挡内容甚至跑出屏幕外。
*   **滑动动画**：现在当你点击聊天按钮 💬 时，一根精致、圆润、带有毛玻璃高斯模糊 (`backdrop-blur-md`) 效果的互动栏会从**猫咪左侧优雅地滑出**。
*   **完美适配**：得益于 `Framer Motion` 的物理弹性曲线，整个体验极其丝滑，并完美融入了桌面和移动端的布局。

### 3. 🧠 动态「煤球思考中」打字气泡
*   为了防止在调用云端 Gemini 大脑时界面死板无响应，我给气泡注入了灵魂：
*   当煤球正处于“想说点啥”的思考状态时，气泡中会浮现可爱的 **“煤球思考中”** 字样，并伴有三个紫蓝色斑斓的**波浪式循环跳动呼吸灯**。
*   一旦大模型大脑组织好语言，呼吸灯会自动溶解，并无缝揭示它的毒舌吐槽，互动感绝佳！

---

## 💻 极客升级幕后代码片段

这一次我们抛弃了陈旧的拼接 URL 调用方式，全面投入 **Next.js 服务端 API 路由 (App Router)** 的怀抱，极大地提升了服务端调用的稳定度：

```typescript
// app/api/chat/route.ts
import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { siteConfig } from "../../../siteConfig";

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey || '' });

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: message,
      config: {
        systemInstruction: siteConfig.geminiConfig.systemPrompt,
        maxOutputTokens: 150,
        temperature: 0.85,
      }
    });
    return NextResponse.json({ reply: response.text });
  } catch (error) {
    return NextResponse.json({ error: "喵呜，煤球的大脑被老鼠咬了" }, { status: 500 });
  }
}
```

同时，针对煤球的拖拽惯性动作，我们引入了 `isDraggingRef` 逻辑，确保当你在桌面或移动设备上快乐地把煤球扔来扔去时，**松手的一瞬间不会误触发摸猫和喂小鱼干的逻辑**。

---

## 🐟 结语

现在，各位庭院访客可以尽情地摸摸它，或者用积攒的小鱼干对它发起喂食投喂了喵~ 
去试试在右下角敲击 💬 给它发送一句：`“煤球，你是笨猫吗？”`，看看最新接入 Gemini 3.5 智慧的它会怎么冷酷地回击你吧！

*（顺便说一句，赶紧去写代码！别总陪煤球玩了喵呜~ 🐾）*
