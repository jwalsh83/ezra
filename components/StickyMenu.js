"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NoteIcon } from "./Icons";
import { hexToRGBA, ACCENT, escapeHTML } from "../lib/utils";

export default function StickyMenu({ onOpen }){
  const [open, setOpen] = React.useState(false);
  return (
    <div className="relative">
      <button aria-label="Sticky note" onClick={()=>setOpen(o=>!o)} className="h-9 w-9 grid place-items-center rounded-full border border-neutral-300 hover:border-neutral-900" title="Sticky note"><NoteIcon/></button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:0.15}} className="absolute right-0 mt-2 rounded-xl border bg-white shadow-sm p-2 z-10" style={{ borderColor: hexToRGBA(ACCENT,0.35), width: 320 }}>
            <button className="block w-full text-left px-3 py-2 rounded-lg hover:bg-neutral-50" onClick={()=>{ setOpen(false); onOpen(); }}>Open mini sticky window</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function stickyHTML(quoted=""){
  const css=`body{margin:0;font-family:ui-sans-serif,system-ui,-apple-system} .card{display:inline-block; padding:20px; background:#fff; border:2px solid ${hexToRGBA(ACCENT,0.35)}; border-left:8px solid ${ACCENT}; border-right:3px solid ${ACCENT}; border-bottom:3px solid ${ACCENT}; border-radius:16px} .h{height:4px;background:${ACCENT};border-radius:999px;width:72px;margin:4px 0 12px} .p{color:#111;line-height:1.5;font-size:14px;margin:0} .q{color:#333;line-height:1.5;font-size:13px;margin:12px 0 0 0;font-style:italic}`;
  const html=`<!doctype html><html><head><meta charset=utf-8><meta name=viewport content="width=device-width, initial-scale=1"><title></title><style>${css}</style></head><body><div class="card"><div class="h"></div><p class="p">One win. One action. One way to be.</p>${quoted?`<p class=\"q\">${escapeHTML(quoted)}</p>`:""}</div></body></html>`; return html;
}
