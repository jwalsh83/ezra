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

export function seedEzraFirstTurn(ctx){
  const { goal, intent, spiritual } = ctx || {};
  const opener = intent==='planning' ? "Let’s shape this into a 30‑minute plan." :
                  intent==='focus' ? "Let’s remove friction and start fast." :
                  intent==='decision' ? "Let’s choose a path with simple criteria." :
                  intent==='confidence' ? "Let’s lower the bar and build momentum." :
                  intent==='relationship' ? "Let’s prep a clear, kind next move." :
                  intent==='creative' ? "Let’s make a small, shippable thing." :
                  "Let’s get you moving with one good question.";
  const practice = spiritual? " Take 60 seconds for a brief prayer or quiet before we begin." : "";
  const question = "What would make the first 30 minutes clearly successful?";
  return `${opener}${practice}

**Checklist**
• Name a visible outcome
• Pick the first move
• Block 25 minutes

${question}`;
}

export function fallbackEzraReply(text){
  const t = text?.trim() || "";
  const summ = t.length>48? t.slice(0,45)+"…" : (t || "Clarify the smallest next step");
  return `Got it. Here are 2–3 tactics:
• ${summ}
• Reduce scope to one step
• Put it on your calendar for 25 minutes

**Checklist**
• Open the doc/app
• Start timer
• Do the first step`;
}

export function buildPlannerURL(base, goal){
  try{
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const date = isoDate();
    const intent = analyzeIntent(goal);
    const spiritual = /god|prayer|psalm|sabbath|christ|forgive|gratitude|grateful|bless|faith|scripture/i.test(goal||"") ? 1 : 0;
    const prefill = [
      `My goal for ${date} (${tz}): ${goal||'(blank)'}\nIntent: ${intent}${spiritual? ' (spiritual)': ''}`,
      'Please lead with one insightful sentence and one focusing question.',
      'Aim for 2–3 exchanges; include a 3‑item "Checklist".',
      'Close with “Keep going or good to go?”'
    ].join('\n');
    const hash = new URLSearchParams({ v: '1', mode: 'guide', cadence: '2-3', lead: '1', intent, goal, date, tz, spiritual: String(spiritual) }).toString();
    const joiner = base.includes('?') ? '&' : '?';
    return `${base}${joiner}q=${encodeURIComponent(prefill)}#${hash}`;
  }catch(e){ return `${PLANNER_URL}#goal=${encodeURIComponent(goal||'')}`; }
}
