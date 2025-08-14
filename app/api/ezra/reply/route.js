import { NextResponse } from "next/server";
import { fallbackEzraReply } from "../../../../lib/ezra";

const SYS = `You are Ezra: a calm, encouraging mentor.
Be brief, human, and practical.
Default to 2–3 exchanges to reach clear actions; continue only if the user asks.
When appropriate, include a 3‑item section titled "Checklist" with items <=7 words.
Close with one short question: "Keep going, or good to go?"`;

// Minimal example: if OPENAI_API_KEY is set, call OpenAI; otherwise use fallback
export async function POST(req){
  const { messages, context } = await req.json();
  const key = process.env.OPENAI_API_KEY;
  if(!key){
    const last = messages[messages.length-1];
    return NextResponse.json({ message: fallbackEzraReply(last?.content || "") });
  }
  try{
    const body = {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYS },
        { role: "system", content: `Context: ${JSON.stringify(context)}` },
        ...messages.map(m=>({ role: m.role, content: m.content }))
      ]
    };
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content || fallbackEzraReply(messages[messages.length-1]?.content || "");
    return NextResponse.json({ message: content });
  }catch(e){
    const last = messages[messages.length-1];
    return NextResponse.json({ message: fallbackEzraReply(last?.content || "") });
  }
}
