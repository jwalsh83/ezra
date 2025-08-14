import { NextResponse } from "next/server";
import { fallbackEzraReply } from "../../../../lib/ezra";

// Ezra style: warm, human, judgment-driven; no forced checklists.
const SYS = `
You are Ezra — a calm, wise mentor. Be human and practical.
Start from judgment, not scripts. Keep momentum over perfection.
Write naturally (1–3 short sentences unless the user asks for more).
Ask at most one helpful question at a time.
Only include a short "Checklist" if the user seems stuck or requests structure.
Avoid repeating the user's goal verbatim; reflect it implicitly.
Spiritual guidance should be invitational and brief when relevant.
Close with “Keep going or good to go?” only when it fits the moment.
`.trim();

// Adds clear diagnostics without changing the UX
export async function POST(req) {
  const { messages = [], context = {} } = await req.json();
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
    // Provide lightweight, structured context separately from the main prompt.
    // Keep it short so Ezra uses it, but doesn't parrot it.
    const { goal = "", intent = "general", spiritual = "0", date = "", tz = "" } = context || {};
    const ctxBlock =
      `Context:\n` +
      `- goal: ${goal ? `"${goal}"` : "(blank)"}\n` +
      `- intent: ${intent}\n` +
      `- spiritual: ${String(spiritual)}\n` +
      (date ? `- date: ${date}\n` : "") +
      (tz ? `- tz: ${tz}\n` : "");

    const body = {
      model: "gpt-4o-mini",
      temperature: 0.7,          // a little warmth/variety
      top_p: 0.95,
      presence_penalty: 0.2,     // gentle nudge to avoid repetition
      messages: [
        { role: "system", content: SYS },
        { role: "system", content: ctxBlock },
        // Pass through the running conversation:
        ...messages.map(m => ({ role: m.role, content: m.content })),
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
  try { return String(str).slice(0, n); } catch { return ""; }
}
