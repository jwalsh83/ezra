"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SparkIcon, ShuffleIcon, CheckIcon } from "./Icons";
import { classNames, hexToRGBA, ACCENT } from "../lib/utils";

export default function IntentRow({ id, labelPrefix, value, setValue, focused, locked, onAdvance, openFor, setOpenFor, suggestions, onShuffle }){
  const inputRef = React.useRef(null);
  React.useEffect(()=>{ if(focused && inputRef.current) inputRef.current.focus(); },[focused]);
  function handleKey(e){ if((e.key==='Enter'||e.key==='Tab') && value.trim()){ e.preventDefault(); setOpenFor(null); onAdvance(); } }
  return (
    <div className="relative">
      <div className="flex items-baseline gap-2">
        <span className="text-neutral-500">{labelPrefix}</span>
        <input ref={inputRef} id={id} value={value} readOnly={locked} onChange={(e)=>{ setValue(e.target.value); }} onKeyDown={handleKey} onMouseDown={(e)=>{ if(locked){ e.preventDefault(); } }} autoComplete="off" aria-label={id} className={classNames("min-w-[8ch] max-w-full px-1 outline-none border-0 bg-transparent text-neutral-900", (focused||value)?"accent-underline accent-highlight":"border-b border-neutral-300")} />
        <button type="button" aria-label="Show suggestions" onClick={()=>setOpenFor(openFor===id?null:id)} className="ml-1 h-8 w-8 relative grid place-items-center rounded-full border border-transparent" title="Suggestions"><SparkIcon/></button>
        {value && !locked && (<button type="button" aria-label="Mark line done" onClick={()=>{ setOpenFor(null); onAdvance(); }} className="ml-1 h-8 px-2 inline-flex items-center gap-1 rounded-full border border-neutral-300 hover:border-neutral-900 text-sm"><CheckIcon /></button>)}
      </div>
      <AnimatePresence initial={false}>{openFor===id && (
        <motion.div key={`${id}-sheet`} initial={{ opacity: 0, y: -10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.98 }} transition={{ type: "spring", stiffness: 520, damping: 22, mass: 0.7 }} className="absolute left-0 mt-2 rounded-2xl border bg-white shadow-sm z-10" style={{ borderColor: hexToRGBA(ACCENT,0.35), borderRight: `3px solid ${ACCENT}`, borderBottom: `3px solid ${ACCENT}` }}>
          <div className="p-3 flex flex-wrap gap-2 max-w-[calc(100vw-64px)]">
            {suggestions.map((s)=> (<button key={s} onClick={()=>{ setValue(s); setOpenFor(null); onAdvance(); }} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm hover:border-neutral-900" style={{ borderColor: hexToRGBA(ACCENT,0.35) }}>{s}</button>))}
            <button onClick={onShuffle} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm hover:border-neutral-900" style={{ borderColor: hexToRGBA(ACCENT,0.35) }} title="More suggestions"><ShuffleIcon/> More</button>
          </div>
        </motion.div>)}</AnimatePresence>
    </div>
  );
}
