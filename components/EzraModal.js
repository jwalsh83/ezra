"use client";
import React from "react";
import { GuideIcon } from "./Icons";
import { ACCENT, escapeHTML } from "../lib/utils";
import { seedEzraFirstTurn, fallbackEzraReply, analyzeIntent } from "../lib/ezra";

function renderAssistantHTML(text = "") {
  // Escape user-provided characters, then convert **bold** to <strong>
  const html = escapeHTML(text).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  return <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: html }} />;
}

export default function EzraModal({ open, onClose, goal }){
  const [messages, setMessages] = React.useState([]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const context = React.useMemo(()=>{
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const date = new Date(); date.setHours(0,0,0,0);
    return { goal, date: date.toISOString().slice(0,10), tz, intent: analyzeIntent(goal), spiritual: /god|prayer|psalm|sabbath|christ|forgive|gratitude|grateful|bless|faith|scripture/i.test(goal||"")?1:0 };
  }, [goal]);

  React.useEffect(()=>{
    if(!open) return;
    const seed = seedEzraFirstTurn(context);
    setMessages([{ role:'assistant', content: seed }]);
  }, [open]);

  async function send(){
    const text = input.trim(); if(!text) return; setInput(""); 
    const next = [...messages, { role:'user', content: text }]; setMessages(next); setLoading(true);
    try{
      const res = await fetch("/api/ezra/reply", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ messages: next, context }) });
      if(res.ok){ const data = await res.json(); setMessages([...next, { role:'assistant', content: data.message }]); setLoading(false); return; }
    }catch(_e){}
    setMessages([...next, { role:'assistant', content: fallbackEzraReply(text) }]); setLoading(false);
  }

  if(!open) return null;
  return (
    <div className="fixed inset-0 z-40 grid place-items-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-10 w-[min(96vw,720px)] max-h-[86vh] rounded-3xl bg-white ring-1 ring-black/5 flex flex-col" style={{ borderRight:`3px solid ${ACCENT}`, borderBottom:`3px solid ${ACCENT}` }}>
        <div className="px-5 py-4 border-b border-neutral-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-neutral-800"><GuideIcon/> <span className="font-medium">Ask Ezra</span></div>
          <button onClick={onClose} className="px-3 py-1.5 rounded-xl border border-neutral-300 hover:border-neutral-900 text-sm">Close</button>
        </div>

        <div className="px-5 pt-2 pb-4 text-neutral-900 italic">{goal}</div>
        
<div className="px-5 overflow-y-auto flex-1 space-y-4">
  {messages.map((m, i) => (
    <div key={i} className={m.role === "assistant" ? "" : "ml-auto text-right whitespace-pre-wrap"}>
      {m.role === "assistant" ? renderAssistantHTML(m.content) : m.content}
    </div>
  ))}
  {loading && <div className="text-neutral-500">Ezra is thinking…</div>}
</div>
        
        <div className="p-4 border-t border-neutral-200 flex items-center gap-2">
          <input value={input} onChange={(e)=>setInput(e.target.value)} onKeyDown={(e)=>{ if(e.key==='Enter') send(); }} placeholder="Type a quick reply" className="flex-1 px-3 py-2 rounded-xl border border-neutral-300 outline-none focus:border-neutral-900" />
          <button onClick={send} className="px-4 py-2 rounded-2xl text-sm font-medium text-white" style={{ background: ACCENT }}>Send</button>
        </div>
      </div>
    </div>
  );
}
