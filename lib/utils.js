import React from "react";
export const ACCENT = "#0891B2";
export const ACCENT_LIGHT = "#22D3EE";
export const STORAGE_KEY = "daily-intent-entries-v4";
export const RATINGS_KEY = "daily-intent-ratings-v1";
export const PLANNER_URL = "https://chatgpt.com/g/g-689de3e89c5881919c61ee62622796b4-ezra-daily-goals-mentor";

export function classNames(...s){ return s.filter(Boolean).join(" "); }
export function hexToRGBA(hex, a=1){ const h=hex.replace('#',''); const b=parseInt(h.length===3?h.split('').map(c=>c+c).join(''):h,16); const r=(b>>16)&255,g=(b>>8)&255,u=b&255; return `rgba(${r}, ${g}, ${u}, ${a})`; }
export function isoDate(d = new Date()) { const dd = new Date(d); dd.setHours(0,0,0,0); return dd.toISOString().slice(0,10); }
export function formatDate(d = new Date()) { return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" }); }
export function escapeHTML(s=''){ return s.replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c])); }

export function useEntries(){
  const [entries, setEntries] = React.useState(()=>{ try{ const raw=localStorage.getItem(STORAGE_KEY); return raw?JSON.parse(raw):[] }catch{ return [] }});
  React.useEffect(()=>{ localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)); },[entries]);
  return [entries, setEntries];
}
export function useRatings(){
  const [ratings, setRatings] = React.useState(()=>{ try{ const raw=localStorage.getItem(RATINGS_KEY); return raw?JSON.parse(raw):{} }catch{ return {} }});
  React.useEffect(()=>{ localStorage.setItem(RATINGS_KEY, JSON.stringify(ratings)); },[ratings]);
  return [ratings, setRatings];
}

export function groupByDate(entries){
  const map=new Map();
  for(const e of entries){ const t=e.savedAt??0; const prev=map.get(e.date); if(!prev || (t>(prev.savedAt??0))) map.set(e.date, e); }
  const arr=[...map.values()].sort((a,b)=> (b.savedAt??0)-(a.savedAt??0) || (a.date<b.date?1:-1));
  return arr;
}
export function latestForDate(entries, date){
  let best=null, bestT=-1; for(const e of entries){ if(e.date===date){ const t=e.savedAt??0; if(t>bestT){ best=e; bestT=t; } } } return best;
}
