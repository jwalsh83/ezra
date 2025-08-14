// lib/ezra.js
import { isoDate, ACCENT, PLANNER_URL } from "./utils";

export function analyzeIntent(goal){
  const g=(goal||"").toLowerCase();
  const buckets=[
    {intent:'spiritual', kws:['god','prayer','psalm','sabbath','christ','scripture','forgive','bless','gratitude','grateful']},
    {intent:'focus', kws:['focus','deep-work','deep work','distraction','notifications','block','timer']},
    {intent:'planning', kws:['plan','outline','roadmap','schedule','calendar','breakdown','next step','steps']},
    {intent:'decision', kws:['decide','decision','choose','option','tradeoff','pros','cons']},
    {intent:'confidence', kws:['anxious','overwhelmed','stuck','motivation','confidence','courage','fear']},
    {intent:'relationship', kws:['meet','call','email','conversation','stakeholder','mentor','team','family','friend']},
    {intent:'wellness', kws:['sleep','walk','hydrate','stretch','health','exercise','workout']},
    {intent:'learning', kws:['read','study','learn','course','practice','notes']},
    {intent:'admin', kws:['inbox','email','doc','documentation','paperwork','budget','invoice']},
    {intent:'creative', kws:['write','draft','sketch','design','record','film','paint']}
  ];
  for(const b of buckets){ if(b.kws.some(k=> g.includes(k))) return b.intent; }
  return 'general';
}

/**
 * Less formulaic first turn:
 * - Single, warm question tailored by intent.
 * - No boilerplate checklist.
 * - Optional gentle spiritual nudge only when spiritual=1.
 */
export function seedEzraFirstTurn(ctx){
  const { goal, intent:rawIntent, spiritual } = ctx || {};
  const intent = rawIntent || analyzeIntent(goal);

  // Intent-tailored simple questions (short, human)
  const Q = {
    focus:       "What would make the next 30 minutes clearly successful?",
    planning:    "What concrete outcome will you finish in the next 30 minutes?",
    decision:    "What single criterion helps you choose right now?",
    confidence:  "What’s the smallest step you’re willing to take now?",
    relationship:"What clear, kind message could you send today?",
    wellness:    "What’s one small action you can do in 10 minutes?",
    learning:    "What exactly will you learn or practice today?",
    admin:       "Which small admin task will you finish first?",
    creative:    "What’s the smallest shippable version you can start now?",
    spiritual:   "What would faithful action look like in the next hour?",
    general:     "What’s the next small step that moves this forward?"
  };

  let question = Q[intent] || Q.general;

  // Light, optional spiritual cue (no sermon)
  if (String(spiritual) === "1") {
    question += " (If helpful, take 60 seconds of quiet first.)";
  }

  // Return only the question—let Ezra lead naturally
  return question;
}

/**
 * Softer fallback if OpenAI fails:
 * - No lists, no template—one line of reassurance + a single question.
 */
export function fallbackEzraReply(text){
  const t = (text || "").trim();
  const hint = t ? "" : "Let’s pick one clear win.";
  return `${hint}${hint ? " " : ""}What’s the smallest next step you can finish in 20–30 minutes?`;
}

/**
 * Planner prefill:
 * - Removes checklist/rigid cadence language.
 * - Asks Ezra to start with one attunement sentence + one question.
 * - Keeps it warm and practical; no templates.
 */
export function buildPlannerURL(base, goal){
  try{
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const date = isoDate();
    const intent = analyzeIntent(goal);
    const spiritual = /god|prayer|psalm|sabbath|christ|forgive|gratitude|grateful|bless|faith|scripture/i.test(goal||"") ? 1 : 0;

    const prefill = [
      `Context — ${date} (${tz})`,
      `Goal: ${goal || '(blank)'}`,
      `Intent: ${intent}${spiritual ? ' (spiritual)' : ''}`,
      "",
      "You are Ezra, a calm, wise mentor. Be warm, human, and practical.",
      "Turn 1: write one attunement sentence and ask one brief, helpful question.",
      "Avoid templates or checklists unless I ask. Keep it natural."
    ].join('\n');

    const hash = new URLSearchParams({
      v: '2',
      mode: 'guide',
      cadence: '2-3',     // hint only; Ezra still chooses brevity
      lead: '1',
      intent,
      goal,
      date,
      tz,
      spiritual: String(spiritual)
    }).toString();

    const joiner = base.includes('?') ? '&' : '?';
    return `${base}${joiner}q=${encodeURIComponent(prefill)}#${hash}`;
  }catch(e){
    return `${PLANNER_URL}#goal=${encodeURIComponent(goal||'')}`;
  }
}
