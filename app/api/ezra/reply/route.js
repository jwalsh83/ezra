import { NextResponse } from "next/server";
import { fallbackEzraReply } from "../../../../lib/ezra";

const SYS = `You are Ezra: a calm, encouraging mentor.
Be brief, human, and practical.
Default to 2–3 exchanges to reach clear actions; continue only if the user asks.
When appropriate, include a 3-item section titled "Checklist" with items <=7 words.
Close with one short question: "Keep going, or good to go?"`;

// Adds clear diagnostics without changing the UX
export async function POST(req) {
  const { messages, context } = await req.json();
  const lastUser = messages?.[messages.length - 1]?.content || "";
  const key = process.env.OPENAI_API_KEY;

  if (!key) {
    return NextResponse.json({
      message: fallbackEzraReply(lastUser),
      usedFallback: true,
      reason: "Missing OPENAI_API_KEY",
    });
  }

  try {
    const body = {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYS },
        { role: "system", content: `Context: ${JSON.stringify(context)}` },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    };

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(body),
    });

    const raw = await res.text();
    if (!res.ok) {
      console.error("OpenAI error", res.status, raw);
      return NextResponse.json({
        message: fallbackEzraReply(lastUser),
        usedFallback: true,
        reason: `OpenAI ${res.status}: ${safeSlice(raw, 180)}`,
      });
    }

    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      console.error("OpenAI parse error", e, raw);
      return NextResponse.json({
        message: fallbackEzraReply(lastUser),
        usedFallback: true,
        reason: "OpenAI response parse error",
      });
    }

    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      console.error("OpenAI empty content", data);
      return NextResponse.json({
        message: fallbackEzraReply(lastUser),
        usedFallback: true,
        reason: "OpenAI returned no content",
      });
    }

    return NextResponse.json({ message: content, usedFallback: false });
  } catch (e) {
    console.error("OpenAI fetch threw", e);
    return NextResponse.json({
      message: fallbackEzraReply(lastUser),
      usedFallback: true,
      reason: e?.message || "Unknown error",
    });
  }
}

function safeSlice(str, n) {
  try {
    return String(str).slice(0, n);
  } catch {
    return "";
  }
}
