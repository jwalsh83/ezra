"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ACCENT, ACCENT_LIGHT, classNames, hexToRGBA, isoDate, formatDate } from "../lib/utils";
import { useEntries, useRatings, groupByDate, latestForDate } from "../lib/utils";
import { analyzeIntent } from "../lib/ezra";
import IntentRow from "../components/IntentRow";
import RateChip from "../components/RateChip";
import StickyMenu, { stickyHTML } from "../components/StickyMenu";
import Toast from "../components/Toast";
import { GuideIcon } from "../components/Icons";

const SUGGESTIONS = {
  success: [ "I ship the draft","I finish the proposal","I complete one hard thing","I protect two deep‑work blocks","I book the key meeting","I have one meaningful conversation","I close a lingering loop","I publish the update","I make the first call","I delegate one task","I clear my inbox once","I move the top goal forward","I fix the biggest blocker","I capture tomorrow’s plan","I review metrics and decide","I practice for 20 minutes","I read 10 pages with notes","I record a 2‑min Loom update","I run a 10‑min retro","I confirm a decision with stakeholders","I tidy my workspace for 10 min","I end on time","I help one person","I refine the roadmap in 15m","I reduce scope once","I document one process","I pair with a teammate","I remove one dependency","I sketch three options","I seek God’s will","I begin with prayer","I keep my word with integrity","I forgive quickly","I serve someone quietly","I choose gratitude","I speak truth with grace","I keep sabbath‑like margins" ],
  need: [ "turn off notifications","put phone in another room","block 2×45m focus","define the next smallest step","outline first, polish later","ask for feedback early","schedule a 15‑min check‑in","set a 25‑min timer and start","prep tools before starting","bundle shallow tasks (20m)","say no to one non‑essential","hydrate and stretch (2m)","draft three email templates","clarify the ‘done’ definition","move or shorten a meeting","clear the desk surface","open the doc and write one sentence","commit to a 3‑bullet outcome","close extra tabs","use headphones for immersion","break it into a checklist","time‑box the work on calendar","choose ambience and begin","tackle the hardest 10 minutes first","mark blockers and ask early","group similar tasks","pin the focus window","set status to ‘heads‑down’","pray for 5 minutes","read a psalm","practice 3 minutes of silence","write one gratitude note","reach out to encourage someone","confess and reset","step outside for a mindful walk","pause before I answer" ],
  become: [ "present","calm and decisive","curious","generous","courageous","patient","kind and direct","lighthearted","focused","resourceful","grateful","teachable","disciplined","humble","optimistic","resilient","attentive","bold","steady","supportive","joyful","wise","hopeful","consistent","clear‑minded","unhurried","encouraging","prayerful","faithful","gentle and firm","Christlike" ],
};

function mulberry32(a){ return function(){ let t=a+=0x6D2B79F5; t=Math.imul(t^t>>>15, t|1); t^=t+Math.imul(t^t>>>7, t|61); return ((t^t>>>14)>>>0)/4294967296 } }
function pick3(pool, rng){ const arr=[...pool]; const out=[]; for(let i=0;i<3&&arr.length;i++){ out.push(arr.splice(Math.floor(rng()*arr.length),1)[0]); } return out; }

import dynamic from "next/dynamic";
const EzraModal = dynamic(() => import("../components/EzraModal"), { ssr: false });

export default function Page(){
  const [entries, setEntries] = useEntries();
  const [ratings, setRatings] = useRatings();
  const [step, setStep] = React.useState(0);
  const [success, setSuccess] = React.useState("");
  const [need, setNeed] = React.useState("");
  const [become, setBecome] = React.useState("");
  const [locked, setLocked] = React.useState({ success:false, need:false, become:false });
  const [focusIdx, setFocusIdx] = React.useState(0);
  const [openFor, setOpenFor] = React.useState(null);
  const [toast, setToast] = React.useState({ show:false, message:"" });
  const [ezraOpen, setEzraOpen] = React.useState(false);
  const [ezraGoal, setEzraGoal] = React.useState("");

  const todayIso = isoDate();
  const existingToday = React.useMemo(()=>entries.some(e=>e.date===todayIso),[entries,todayIso]);
  React.useEffect(()=>{ if(existingToday){ const last = latestForDate(entries, todayIso); setSuccess(last?.success||""); setNeed(last?.need||""); setBecome(last?.become||""); setStep(1);} },[]);

  const daySeed = React.useMemo(()=>{ const d=new Date(); return parseInt(`${d.getFullYear()}${(d.getMonth()+1).toString().padStart(2,'0')}${d.getDate().toString().padStart(2,'0')}`)},[]);
  const baseRng = React.useMemo(()=>mulberry32(daySeed),[daySeed]);
  const [suggestMap, setSuggestMap] = React.useState({ success: pick3(SUGGESTIONS.success, baseRng), need: pick3(SUGGESTIONS.need, baseRng), become: pick3(SUGGESTIONS.become, baseRng) });
  function shuffle(id){ const rng=mulberry32(Math.floor(Math.random()*1e9)); setSuggestMap(m=>({ ...m, [id]: pick3(SUGGESTIONS[id], rng) })); }

  const statement = React.useMemo(()=> success||need||become ? `Today will be successful if ${success}. I need to ${need}. I want to be ${become}.` : "", [success,need,become]);
  const quotedStatement = React.useMemo(()=> statement ? `“${statement}”` : "", [statement]);
  const canSubmit = success.trim() && need.trim() && become.trim();

  function advanceFrom(id){ setLocked(l=>({ ...l,[id]:true })); if(id==='success') setFocusIdx(1); if(id==='need') setFocusIdx(2); if(id==='become') setFocusIdx(3); }
  function handleSubmit(){ if(!canSubmit) return; const next=[...entries]; next.push({ date:todayIso, savedAt: Date.now(), displayDate:formatDate(new Date()), success:success.trim(), need:need.trim(), become:become.trim(), statement }); next.sort((a,b)=> (b.savedAt??0)-(a.savedAt??0) || (a.date<b.date?1:-1)); setEntries(next); setStep(1); }
  function resetEntryFields(){ setSuccess(""); setNeed(""); setBecome(""); setLocked({success:false, need:false, become:false}); setFocusIdx(0); setOpenFor(null); }
  function resetMostRecentToday(){ setEntries((list)=>{ let idx=-1, maxT=-1; list.forEach((e,i)=>{ if(e.date===todayIso){ const t=e.savedAt??0; if(t>maxT){ maxT=t; idx=i; } } }); if(idx>-1){ const copy=[...list]; copy.splice(idx,1); return copy; } return list; }); resetEntryFields(); setStep(0); }

  const days = React.useMemo(()=> groupByDate(entries).slice(0,7), [entries]);
  const score = React.useMemo(()=>{ if(!days.length) return 0; const map={ low:0, mid:0.5, high:1 }; const sum=days.reduce((acc,day)=> acc+(map[ratings[day.date]]||0), 0); return Math.round((sum/days.length)*100); },[days, ratings]);
  function updateRating(date, rating){ setRatings((m)=> ({ ...m, [date]: rating })); }

  function openStickyWindow(quoted){ const w=window.open("", "daily-intent-sticky", "width=340,height=200,menubar=0,toolbar=0,location=0,status=0,scrollbars=0,resizable=0"); if(!w) return; const html=stickyHTML(quoted); w.document.open(); w.document.write(html); w.document.close(); }
  function onAskEzra(goal){ setEzraGoal(goal); setEzraOpen(true); }

  return (
    <div className="min-h-screen">
      <style>{`
        .accent-underline { border-bottom: 0; }
        .accent-highlight { box-shadow: inset 0 -12px 0 ${hexToRGBA(ACCENT_LIGHT,0.12)}, inset 0 -3px 0 ${ACCENT}; }
      `}</style>
      <div className="mx-auto max-w-3xl px-6 py-10">
        <header className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-neutral-900 text-neutral-50 grid place-items-center text-xs tracking-wider">Ez</div>
            <div className="text-sm font-medium">Ezra — Daily Goals</div>
            <div className="text-sm text-neutral-500">{formatDate()}</div>
          </div>
          <div className="flex items-center gap-3">
            {step!==2 ? (
              <button onClick={()=>setStep(2)} className="px-3 py-1.5 rounded-full border border-neutral-300 hover:border-neutral-900 text-sm">This week</button>
            ) : (
              <button onClick={()=> setStep(existingToday?1:0)} className="px-3 py-1.5 rounded-full border border-neutral-300 hover:border-neutral-900 text-sm">Today</button>
            )}
          </div>
        </header>

        <div className="rounded-3xl bg-white shadow-sm ring-1 ring-black/5 p-6 md:p-10" style={{ borderRight: `3px solid ${ACCENT}`, borderBottom: `3px solid ${ACCENT}` }}>
          <AnimatePresence mode="wait">
            {step===0 && (
              <motion.section key="entry" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:0.2}} className="space-y-8">
                <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Set today’s intent</h1>
                <div className="space-y-6 text-lg md:text-xl leading-relaxed">
                  <IntentRow id="success" labelPrefix="Today will be successful if" value={success} setValue={setSuccess} focused={focusIdx===0} locked={locked.success} onAdvance={()=>advanceFrom('success')} openFor={openFor} setOpenFor={setOpenFor} suggestions={pick3(SUGGESTIONS.success, mulberry32(1))} onShuffle={()=>{}} />
                  <IntentRow id="need" labelPrefix="I need to" value={need} setValue={setNeed} focused={focusIdx===1} locked={locked.need} onAdvance={()=>advanceFrom('need')} openFor={openFor} setOpenFor={setOpenFor} suggestions={pick3(SUGGESTIONS.need, mulberry32(2))} onShuffle={()=>{}} />
                  <IntentRow id="become" labelPrefix="I want to be" value={become} setValue={setBecome} focused={focusIdx===2} locked={locked.become} onAdvance={()=>advanceFrom('become')} openFor={openFor} setOpenFor={setOpenFor} suggestions={pick3(SUGGESTIONS.become, mulberry32(3))} onShuffle={()=>{}} />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <button onClick={resetEntryFields} className="px-4 py-2 rounded-xl border border-neutral-300 hover:border-neutral-900 text-sm">Reset</button>
                  <button onClick={handleSubmit} disabled={!canSubmit} className={classNames("px-5 py-2.5 rounded-2xl text-sm font-medium text-white", focusIdx===3?"ring-2 ring-offset-2":"", !canSubmit?"opacity-50 cursor-not-allowed":"")} style={{ background: ACCENT }}>Save & Continue</button>
                </div>
              </motion.section>
            )}

            {step===1 && (
              <motion.section key="final" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:0.2}} className="space-y-7">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">Today’s focus</h2>
                  <div className="flex items-center gap-2">
                    <button aria-label="Ask Ezra" className="h-9 w-9 relative grid place-items-center rounded-full border border-neutral-300 hover:border-neutral-900" onClick={()=>onAskEzra(quotedStatement)} title="Ask Ezra"><GuideIcon/></button>
                    <StickyMenu onOpen={()=>openStickyWindow(quotedStatement)} />
                  </div>
                </div>
                <p className="text-neutral-600">One win. One action. One way to be.</p>
                <div className="rounded-2xl bg-white p-6" style={{ border: `3px solid ${ACCENT}`, borderLeftWidth: 8, borderRightWidth: 3, borderBottomWidth: 3 }}>
                  <p className="text-lg leading-relaxed">{quotedStatement}</p>
                </div>
                <div className="flex items-center justify-end gap-3">
                  <button onClick={resetMostRecentToday} className="px-4 py-2 rounded-xl border border-neutral-300 hover:border-neutral-900 text-sm">Reset goal</button>
                  <button onClick={()=>setStep(2)} className="px-5 py-2.5 rounded-2xl text-sm font-medium text-white" style={{ background: ACCENT }}>Let’s go!</button>
                </div>
              </motion.section>
            )}

            {step===2 && (
              <motion.section key="review" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:0.2}} className="space-y-8">
                <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">This week</h2>
                <p className="text-neutral-600">Tap a rating for each day. Keep it light.</p>
                <div className="space-y-4">
                  {days.length===0 && <div className="text-neutral-500">No entries yet. Start today.</div>}
                  {days.map((day)=>(
                    <div key={day.date} className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 p-4 rounded-2xl border border-neutral-200 bg-white" style={{ borderRight: `3px solid ${ACCENT}`, borderBottom: `3px solid ${ACCENT}` }}>
                      <div className="md:w-60">
                        <div className="font-medium">{day.displayDate}</div>
                        <div className="text-sm text-neutral-500 truncate">{day.statement}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <RateChip label="Not yet" active={ratings[day.date]==='low'} onClick={()=>updateRating(day.date,'low')} />
                        <RateChip label="Progress" active={ratings[day.date]==='mid'} onClick={()=>updateRating(day.date,'mid')} />
                        <RateChip label="Nailed it" active={ratings[day.date]==='high'} onClick={()=>updateRating(day.date,'high')} />
                        <button aria-label="Ask Ezra for this goal" className="ml-1 h-8 w-8 grid place-items-center rounded-full border border-neutral-300 hover:border-neutral-900" title="Ask Ezra" onClick={()=>onAskEzra(`“${day.statement}”`)}><GuideIcon/></button>
                      </div>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="mb-2 text-sm text-neutral-600">Weekly momentum</div>
                  <div className="w-full h-3 bg-neutral-200 rounded-full overflow-hidden"><div className="h-full" style={{ background: ACCENT, width: `${score}%` }} /></div>
                  <div className="mt-3 flex items-center gap-2">{days.map((d)=> (<div key={d.date} role="img" aria-label={d.displayDate} className="h-2.5 w-2.5 rounded-full" style={{ background: ratings[d.date]==='high'? ACCENT : ratings[d.date]==='mid'? hexToRGBA(ACCENT,0.6) : ratings[d.date]==='low'? hexToRGBA(ACCENT,0.25) : '#e5e7eb' }} />))}</div>
                  <div className="mt-2 text-sm text-neutral-600">{score}% focused days</div>
                </div>
                <div className="flex items-center justify-end gap-3">
                  <button onClick={()=> setStep(existingToday?1:0)} className="px-4 py-2 rounded-xl border border-neutral-300 hover:border-neutral-900 text-sm">{existingToday? 'Back to today' : 'Back to entry'}</button>
                  <button onClick={()=>{ resetEntryFields(); setStep(0); }} className="px-5 py-2.5 rounded-2xl text-sm font-medium text-white" style={{ background: ACCENT }}>Create new goal</button>
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </div>
      </div>

      <Toast show={toast.show} message={toast.message} />
      {ezraOpen && <EzraModal open={true} goal={ezraGoal} onClose={()=>setEzraOpen(false)} />}
    </div>
  );
}

// dynamic import wrapper (avoid SSR)
function dynamicEzraModal(props){
  const EzraModal = React.useMemo(()=> require("../components/EzraModal").default, []);
  const Comp = EzraModal;
  return <Comp open={true} goal={props.goal} onClose={props.onClose} />;
}
