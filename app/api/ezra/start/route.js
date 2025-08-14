import { NextResponse } from "next/server";
import { seedEzraFirstTurn } from "../../../../lib/ezra";

// System prompt just for the very first turn.
const SYS_START = `
You are Ezra — a calm, wise mentor. Be human, warm, and practical.
For this FIRST TURN ONLY: write one short attunement line and ask one brief, helpful question.
Use plain language. No bullet points, no checklists, no emojis.
Do not restate the user's goal verbatim; reflect it implicitly.
If spiritual=1, you may add one gentle, optional cue (e.g., a moment of quiet).
Keep it natural (about 1–3 short sentences total).
`.trim();

export async function POST(req) {
  const ctx = await req.json();            // { goal, intent, spiritual, date, tz, ... }
  const key = process.env.OPENAI_API_KEY;

  // Fallback immediately if no key is configured
  if (!key) {
    return NextResponse.json({
      message: seedEzraFirstTurn(ctx),
      usedFallback: true,
      reason: "Missing OPENAI_API_KEY",
    });
  }

  try {
    const { goal = "", intent = "general", spiritual = "0", date = "", tz = "" } = ctx || {};

    // Small, structured context block (helps steer without parroting)
    const ctxBlock =
      `Context:\n` +
      `- goal: ${goal ? `"${goal}"` : "(blank)"}\n` +
      `- intent: ${intent}\n` +
      `- spiritual: ${String(spiritual)}\n` +
      (date ? `- date: ${date}\n` : "") +
      (tz ? `- tz: ${tz}\n` : "");

    const body = {
      model: "gpt-4o-mini",
      temperature: 0.7,
      top_p: 0.95,
      presence_penalty: 0.2,
      messages: [
        { role: "system", content: SYS_START },
        { role: "system", content: ctxBlock },
        // Nudge the model to begin the opener (or collect a goal once)
        {
          role: "user",
          content: goal
            ? "Please begin."
            : "Please ask me for a single-sentence goal before we proceed.",
        },
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
      console.error("OpenAI error (start)", res.status, safeSlice(raw, 200));
      return NextResponse.json({
        message: seedEzraFirstTurn(ctx),   // gentle, question-only fallback
        usedFallback: true,
        reason: `OpenAI ${res.status}`,
      });
    }

    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      console.error("OpenAI parse error (start)", e);
      return NextResponse.json({
        message: seedEzraFirstTurn(ctx),
        usedFallback: true,
        reason: "OpenAI response parse error",
      });
    }

    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      console.error("OpenAI empty content (start)", data);
      return NextResponse.json({
        message: seedEzraFirstTurn(ctx),
        usedFallback: true,
        reason: "OpenAI returned no content",
      });
    }

    return NextResponse.json({ message: content, usedFallback: false });
  } catch (e) {
    console.error("OpenAI fetch threw (start)", e);
    return NextResponse.json({
      message: seedEzraFirstTurn(ctx),
      usedFallback: true,
      reason: e?.message || "Unknown error",
    });
  }
}

function safeSlice(str, n) {
  try { return String(str).slice(0, n); } catch { return ""; }
}
