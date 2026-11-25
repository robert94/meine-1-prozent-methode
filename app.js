/* Meine 1%-Methode – V3.4. Ohne Backend, Tracking oder Fremdbibliotheken. */
(() => {
'use strict';
const KEY = 'meine-1-prozent-methode-v1'; // Absichtlich identisch für automatische Datenübernahme aus V1/V2.
const $ = id => document.getElementById(id);
const pad = n => String(n).padStart(2,'0');
const iso = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
let today = iso(new Date());
const toDate = x => {const [y,m,d]=x.split('-').map(Number);return new Date(y,m-1,d,12);};
const shift = (d,n) => {const x=toDate(d);x.setDate(x.getDate()+n);return iso(x);};
const human = (d,opts={weekday:'short',day:'numeric',month:'short',year:'numeric'}) => toDate(d).toLocaleDateString('de-DE',opts);
const html = s => String(s??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const uid = () => crypto?.randomUUID?.() ?? `u_${Date.now()}_${Math.random().toString(36).slice(2)}`;
const signed = n => n>0?`+${n}`:String(n);
const num = n => Number(n).toLocaleString('de-DE',{maximumFractionDigits:1});
const maxPts = 999;
let view='today', day=today, month=today.slice(0,7), toastHandle;
const icons={
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/>',
  bolt:'<path d="m13 2-9 12h7l-1 8 10-12h-7z"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
  chart:'<path d="M3 3v18h18"/><path d="m7 15 4-5 4 3 5-7"/>',
  list:'<path d="M9 6h12M9 12h12M9 18h12"/><path d="m3 6 1 1 2-2m-3 7 1 1 2-2m-3 7 1 1 2-2"/>',
  settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15.4l1 1.8-2.1 2.1-1.8-1A8 8 0 0 1 14 19.5l-.5 2.1h-3L10 19.5a8 8 0 0 1-2.5-1.2l-1.8 1-2.1-2.1 1-1.8A8 8 0 0 1 3.5 13L1.5 12l2-1a8 8 0 0 1 1.1-2.5l-1-1.8 2.1-2.1 1.8 1A8 8 0 0 1 10 4.5l.5-2.1h3L14 4.5a8 8 0 0 1 2.5 1.1l1.8-1 2.1 2.1-1 1.8a8 8 0 0 1 1.1 2.5l2 1-2 1a8 8 0 0 1-1.1 2.4"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  left:'<path d="m15 18-6-6 6-6"/>',right:'<path d="m9 18 6-6-6-6"/>',
  edit:'<path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L9 17l-4 1 1-4Z"/>',
  trash:'<path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m5 4v6m4-6v6"/>',
  archive:'<rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v12h14V8M10 12h4"/>',
  restore:'<path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5"/>',
  download:'<path d="M12 3v12m-4-4 4 4 4-4M4 17v4h16v-4"/>',
  upload:'<path d="M12 16V4m-4 4 4-4 4 4M4 17v4h16v-4"/>',
  up:'<path d="m6 15 6-6 6 6"/>',down:'<path d="m6 9 6 6 6-6"/>',
  lock:'<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  file:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/>',
  gift:'<rect x="3" y="8" width="18" height="13" rx="2"/><path d="M12 8v13M3 12h18M12 8c-2-1-5-2-5-4a2 2 0 0 1 4 0l1 4m0 0c2-1 5-2 5-4a2 2 0 0 0-4 0l-1 4"/>'
};
const ico = id => `<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${icons[id]||icons.sun}</svg>`;
const tabs=[{id:'today',label:'Heute',icon:'sun'},{id:'activities',label:'Aktivitäten',icon:'bolt'},{id:'habits',label:'Gewohnheiten',icon:'list'},{id:'rewards',label:'Wünsche',icon:'gift'},{id:'calendar',label:'Kalender',icon:'calendar'},{id:'stats',label:'Statistik',icon:'chart'},{id:'settings',label:'Daten',icon:'settings'}];
function newStore(){
 const defaults=[['Bewegung','20 Minuten aktiv gewesen','positive'],['Bewusste Familienzeit','Ohne Ablenkung','positive'],['Etwas gelesen oder gelernt','Mindestens 10 Minuten','positive'],['Wichtigste Aufgabe bearbeitet','','positive'],['Ziellos am Handy gescrollt','','negative'],['Wichtige Aufgabe aufgeschoben','','negative'],['Ungeplant länger gearbeitet','','negative'],['Unbewusst genascht','','negative']];
 return {schema:4,habits:defaults.map((h,i)=>({id:uid(),name:h[0],description:h[1],kind:h[2],schedule:'daily',createdOn:today,archivedOn:null,order:i})),days:{},rewards:[]};
}
function validPoint(n){return Number.isInteger(n)&&Math.abs(n)<=maxPts;}
function normalized(data){
 if(!data||![1,2,3,4].includes(data.schema)||!Array.isArray(data.habits)||!data.days||typeof data.days!=='object'||Array.isArray(data.days))throw Error('Datenformat unbekannt');
 if(data.schema===1||data.schema===2){
  for(const [date,e] of Object.entries(data.days)){
   const points={};
   for(const [id,answer] of Object.entries(e.responses||{})){
    if(answer==='skip')continue;
    const h=data.habits.find(h=>h.id===id);if(!h)continue;
    const w=data.schema===1?1:(Number(e.weights?.[id])||Number(h.weight)||1);
    const weight=Math.min(10,Math.max(1,Math.trunc(w)));
    points[id]=answer==='yes'?(h.kind==='negative'?-weight:weight):(h.kind==='negative'?weight:0);
   }
   e.points=points;
   e.activities=(e.activities||[]).map(a=>({id:a.id,name:a.name,points:a.done?Number(a.weight)||1:0}));
   delete e.responses;delete e.weights;
   if(typeof e.note!=='string')e.note='';
   data.days[date]=e;
  }
  data.schema=3;
 }
 if(data.schema===3){data.rewards=[];data.schema=4;}
 data.habits.forEach((h,i)=>{if(!h.id)h.id=uid();if(!Number.isFinite(h.order))h.order=i;if(!h.schedule)h.schedule='daily';if(!h.createdOn)h.createdOn=today;});
 for(const e of Object.values(data.days)){
  if(!e.points||typeof e.points!=='object'||Array.isArray(e.points))e.points={};
  if(!Array.isArray(e.activities))e.activities=[];
  if(typeof e.note!=='string')e.note='';
 }
 return data;
}
function validImport(v){
 if(!v||![1,2,3,4].includes(v.schema)||!Array.isArray(v.habits)||v.habits.length>2000||!v.days||typeof v.days!=='object'||Array.isArray(v.days)||Object.keys(v.days).length>20000)return false;
 const ids=new Set();
 for(const h of v.habits){if(!h||typeof h.id!=='string'||h.id.length>150||ids.has(h.id)||typeof h.name!=='string'||h.name.length>90||!['positive','negative'].includes(h.kind)||!['daily','weekdays','weekend'].includes(h.schedule)||typeof h.createdOn!=='string')return false;ids.add(h.id);}
 let count=0;
 for(const [date,e] of Object.entries(v.days)){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!e||typeof e!=='object'||typeof e.note!=='string'||e.note.length>2000)return false;
  if(v.schema>=3){
   if(!e.points||typeof e.points!=='object'||Array.isArray(e.points))return false;
   for(const [id,n] of Object.entries(e.points))if(!ids.has(id)||!validPoint(n))return false;
  }else{
   if(!e.responses||typeof e.responses!=='object')return false;
   for(const [id,ans] of Object.entries(e.responses))if(!ids.has(id)||!['yes','no','skip'].includes(ans))return false;
  }
  if(e.activities!==undefined){if(!Array.isArray(e.activities))return false;count+=e.activities.length;if(count>50000)return false;
   for(const a of e.activities)if(!a||typeof a.id!=='string'||typeof a.name!=='string'||a.name.length>90||(v.schema>=3?!validPoint(a.points):!Number.isInteger(a.weight)))return false;
  }
 }
 if(v.schema===4){
  if(!Array.isArray(v.rewards)||v.rewards.length>1500)return false;
  const rewardIds=new Set();
  for(const r of v.rewards){
   if(!r||typeof r.id!=='string'||r.id.length>150||rewardIds.has(r.id)||
      typeof r.name!=='string'||!r.name.trim()||r.name.length>90||
      !Number.isInteger(r.cost)||r.cost<1||r.cost>1000000||
      typeof r.createdOn!=='string'||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(r.createdOn)||
      !(r.redeemedOn===null||typeof r.redeemedOn==='string'&&/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(r.redeemedOn)))return false;
   rewardIds.add(r.id);
  }
 }
 return true;
}
let dataReadFailure=false;
function read(){try{const d=localStorage.getItem(KEY);if(!d)return newStore();const obj=JSON.parse(d);if(!validImport(obj))throw Error('Ungültiges Datenformat');if(obj.schema<3&&!localStorage.getItem('meine-1-prozent-methode-backup-vor-v3'))localStorage.setItem('meine-1-prozent-methode-backup-vor-v3',d);if(obj.schema<4&&!localStorage.getItem('meine-1-prozent-methode-backup-vor-v4'))localStorage.setItem('meine-1-prozent-methode-backup-vor-v4',d);return normalized(obj);}catch(err){console.error('Vorhandene lokale Daten konnten nicht gelesen werden. Sie werden NICHT überschrieben.',err);dataReadFailure=true;return newStore();}}
let store=read();
let habitToDelete=null;
function notice(t){const el=$('toast');el.textContent=t;el.classList.add('visible');clearTimeout(toastHandle);toastHandle=setTimeout(()=>el.classList.remove('visible'),2600);}
function save(){if(dataReadFailure){notice('Datenspeicher beschädigt. Vorhandene Daten nicht überschrieben.');return false;}try{localStorage.setItem(KEY,JSON.stringify(store));return true;}catch(err){console.error(err);notice('Speichern nicht möglich. Bitte Speicher prüfen.');return false;}}
function entry(d){return store.days[d]||{points:{},activities:[],note:''};}
function ensure(d){if(!store.days[d])store.days[d]={points:{},activities:[],note:''};return store.days[d];}
function allHabits(){return [...store.habits].sort((a,b)=>a.order-b.order);}
function active(h,d){const wd=toDate(d).getDay();return d>=h.createdOn&&(!h.archivedOn||d<h.archivedOn)&&!(h.pauses||[]).some(p=>d>=p.start&&d<p.end)&&(h.schedule==='daily'||(h.schedule==='weekdays'?wd>0&&wd<6:wd===0||wd===6));}
function currentHabits(d){return allHabits().filter(h=>active(h,d));}
function summary(d){const e=entry(d),p=Object.values(e.points).reduce((s,n)=>s+Number(n||0),0),a=e.activities.reduce((s,x)=>s+Number(x.points||0),0);return {score:Object.keys(e.points).length||e.activities.length||e.note.trim()?p+a:null,habits:p,activities:a,count:e.activities.length};}
// Das Guthaben ist von der Tages-/Wochenstatistik getrennt. Es ist ein gemeinsamer Topf für alle Wünsche.
function wallet(){let earned=0;for(const d of Object.keys(store.days)){if(d<=today)earned+=summary(d).score||0;}const spent=store.rewards.reduce((n,r)=>n+(r.redeemedOn?r.cost:0),0);return {earned,spent,available:earned-spent};}
function rewardProgress(balance,cost){return Math.min(100,Math.max(0,Math.round(Math.max(0,balance)/cost*100)));}

function btnNav(t){return `<button type="button" class="nav-link ${view===t.id?'active':''}" data-action="nav" data-view="${t.id}" ${view===t.id?'aria-current="page"':''}>${ico(t.icon)}<span>${t.label}</span></button>`;}
function page(title,subtitle='',right=''){return `<header class="topbar compact-header"><div><p class="eyebrow">MEINE 1%-METHODE</p><h1>${title}</h1>${subtitle?`<p class="subtext">${subtitle}</p>`:''}</div>${right?`<div class="header-actions">${right}</div>`:''}</header>`;}
function switcher(){return `<div class="date-switcher"><button class="icon-button" aria-label="Vorheriger Tag" data-action="previous">${ico('left')}</button><span class="date-label">${html(human(day))}</span><button class="icon-button" aria-label="Nächster Tag" data-action="next" ${day>=today?'disabled':''}>${ico('right')}</button></div>`;}
function adjustUI(kind,id,value){const type=kind==='habit'?'habit':'activity';return `<div class="points-control" role="group" aria-label="Punkte anpassen"><button type="button" class="point-button minus" data-action="adjust-${type}" data-id="${html(id)}" data-step="-1" aria-label="Einen Punkt abziehen">−</button><strong class="point-value ${value>0?'pos':value<0?'neg':''}" aria-label="${value} Punkte">${signed(value)}</strong><button type="button" class="point-button plus" data-action="adjust-${type}" data-id="${html(id)}" data-step="1" aria-label="Einen Punkt hinzufügen">+</button></div>`;}
function habitRow(h,e){const v=Number(e.points[h.id]||0);return `<div class="habit-row tiny-row"><div class="habit-info"><div class="habit-sign ${h.kind}" aria-hidden="true">${h.kind==='positive'?'+':'−'}</div><div class="habit-label"><strong>${html(h.name)}</strong>${h.description?`<small>${html(h.description)}</small>`:''}</div></div>${adjustUI('habit',h.id,v)}</div>`;}
function todayView(){const s=summary(day),e=entry(day),habits=currentHabits(day),pos=habits.filter(x=>x.kind==='positive'),neg=habits.filter(x=>x.kind==='negative');return page(day===today?'Dein Tag.':'Tagesrückblick.','Jede gute Entscheidung zählt.')+
 `<section class="card simple-score"><div class="score-main"><span class="score-eyebrow">DEIN PUNKTESTAND</span><div class="score-big ${s.score!==null&&s.score<0?'negative-score':''}">${s.score===null?'0':signed(s.score)} <span>Punkte</span></div><p class="score-caption">${signed(s.habits)} aus Gewohnheiten · ${signed(s.activities)} aus Aktivitäten</p><button class="wallet-inline" data-action="nav" data-view="rewards">${ico('gift')} Sparguthaben: <strong>${signed(wallet().available)} P.</strong> ${ico('right')}</button></div>${switcher()}</section>`+
 `<div class="section-head"><div class="section-title"><h2>Gewohnheiten</h2><span class="count">${habits.length}</span></div><button class="quiet-action" data-action="nav" data-view="habits">Verwalten ${ico('right')}</button></div>`+
 (pos.length?`<div class="mini-heading">Positiv</div><div class="card habit-list lean-list">${pos.map(h=>habitRow(h,e)).join('')}</div>`:'')+
 (neg.length?`<div class="mini-heading">Negativ</div><div class="card habit-list lean-list">${neg.map(h=>habitRow(h,e)).join('')}</div>`:'')+
 (!habits.length?`<div class="card empty-state">Keine Gewohnheiten für diesen Tag. <button class="button outline" data-action="nav" data-view="habits">Gewohnheiten verwalten</button></div>`:'')+
 `<div class="section-head"><div class="section-title"><h2>Aktivitäten</h2><span class="count">${e.activities.length}</span></div></div>`+
 `<div class="card today-activities">${e.activities.length?e.activities.map(a=>`<div class="today-activity-row"><span class="today-activity-name">${html(a.name)}</span><strong class="today-activity-points ${a.points<0?'negative-score':''}">${signed(a.points)}</strong></div>`).join(''):'<p class="today-activity-empty">Noch keine Aktivitäten für diesen Tag.</p>'}</div>`+
 `<p class="footnote">Mit <strong>+</strong> oder <strong>−</strong> änderst du die Punkte jeder Gewohnheit für diesen Tag. Keine Prozente, kein Tageslimit.</p>`;
}
function activityRow(a){return `<div class="activity-row lean-activity"><div class="activity-name"><strong>${html(a.name)}</strong></div>${adjustUI('activity',a.id,a.points)}<button class="icon-button" data-action="edit-activity" data-id="${html(a.id)}" aria-label="Aktivität bearbeiten">${ico('edit')}</button><button class="icon-button" data-action="delete-activity" data-id="${html(a.id)}" aria-label="Aktivität löschen">${ico('trash')}</button></div>`;}
function activitiesView(){const e=entry(day),sum=summary(day);return page('Aktivitäten.','Einmalige Dinge zählen genauso wie Gewohnheiten.')+
 `<div class="card activity-head"><div class="activity-score-label">${html(human(day))}</div><div class="activity-score-total">${signed(sum.activities)} <span>Aktivitätspunkte</span></div>${switcher()}</div>`+
 `<section class="card quick-activity-card"><form id="quick-activity-form" class="activity-add-form"><label for="quick-name" class="field-label">Neue Aktivität</label><div class="input-action-row"><input id="quick-name" class="text-input" required maxlength="90" autocomplete="off" placeholder="z. B. Wäsche abgehängt"><button class="button primary" type="submit">${ico('plus')} Hinzufügen</button></div></form><p class="helper-text">Neue Aktivitäten starten bei +1 Punkt. Bei Bedarf direkt mit + und − anpassen.</p></section>`+
 `<div class="section-head"><div class="section-title"><h2>Erfasst an diesem Tag</h2><span class="count">${e.activities.length}</span></div></div>`+
 `<div class="card lean-list activity-list-card">${e.activities.length?e.activities.map(activityRow).join(''):'<div class="empty-state"><h3>Noch keine Aktivitäten</h3><p>Trage ein, was du heute geschafft hast.</p></div>'}</div>`+
 `<div class="card note-card card-pad"><h2>Notiz zum Tag</h2><textarea id="day-note" maxlength="2000" placeholder="Was lief heute besonders gut?">${html(e.note)}</textarea><div class="note-caption">Automatisch auf diesem Gerät gespeichert</div></div>`;
}
function monthDate(ym){const [y,m]=ym.split('-').map(Number);return new Date(y,m-1,1,12);}
function monthShift(ym,n){const d=monthDate(ym);d.setMonth(d.getMonth()+n);return `${d.getFullYear()}-${pad(d.getMonth()+1)}`;}
function calendarView(){const dt=monthDate(month),y=dt.getFullYear(),m=dt.getMonth(),offset=(dt.getDay()+6)%7;const days=Array.from({length:42},(_,i)=>new Date(y,m,1-offset+i,12));const s=summary(day);const cells=days.map(x=>{const date=iso(x),score=summary(date).score,other=x.getMonth()!==m;return `<button class="day-button ${other?'other-month':''} ${date===today?'today':''} ${date===day?'selected':''}" data-action="pick-day" data-day="${date}" ${date>today?'disabled':''} aria-label="${html(human(date))}: ${score===null?'keine Einträge':signed(score)+' Punkte'}"><span>${x.getDate()}</span><i class="day-dot ${score===null?'missing':score>0?'good':score<0?'low':'neutral'}"></i></button>`;}).join('');return page('Kalender.','Deine Punkte im zeitlichen Verlauf.')+
 `<div class="calendar-layout"><section class="card calendar"><div class="calendar-head"><h2>${html(dt.toLocaleDateString('de-DE',{month:'long',year:'numeric'}))}</h2><div class="button-row"><button class="icon-button" data-action="month-prev" aria-label="Vorheriger Monat">${ico('left')}</button><button class="icon-button" data-action="month-next" aria-label="Nächster Monat" ${month>=today.slice(0,7)?'disabled':''}>${ico('right')}</button></div></div><div class="calendar-days">${['Mo','Di','Mi','Do','Fr','Sa','So'].map(x=>`<span class="day-of-week">${x}</span>`).join('')}${cells}</div><div class="legend"><span><i class="good"></i> Pluspunkte</span><span><i class="low"></i> Minuspunkte</span><span><i class="neutral"></i> Null Punkte</span></div></section>`+
 `<aside class="card side-info"><div><p class="eyebrow">AUSGEWÄHLTER TAG</p><h2>${html(human(day))}</h2><div class="calendar-score ${s.score!==null&&s.score<0?'negative-score':''}">${s.score===null?'–':signed(s.score)}</div><p>${s.score===null?'Noch keine Einträge vorhanden.':`${signed(s.habits)} Gewohnheiten · ${signed(s.activities)} Aktivitäten`}</p></div><button class="button primary" data-action="nav" data-view="today">Tag öffnen ${ico('right')}</button></aside></div>`;
}
function period(n){const scores=Array.from({length:n},(_,i)=>summary(shift(today,i-n+1)).score).filter(x=>x!==null);return {days:scores.length,average:scores.length?scores.reduce((a,b)=>a+b,0)/scores.length:null,sum:scores.reduce((a,b)=>a+b,0)};}
function statsView(){const a=period(7),b=period(30),days=Array.from({length:14},(_,i)=>shift(today,i-13));const vals=days.map(d=>summary(d).score);const max=Math.max(1,...vals.filter(x=>x!==null).map(x=>Math.abs(x)));const bars=days.map((d,i)=>{const v=vals[i];return `<div class="score-bar-item" title="${html(human(d))}: ${v===null?'ohne Eintrag':signed(v)+' Punkte'}"><div class="score-bar-number">${v===null?'':signed(v)}</div><div class="score-bar-track"><div class="score-bar-fill ${v===null?'empty':v<0?'negative':'positive'}" style="height:${v===null?5:Math.max(5,Math.round(Math.abs(v)/max*110))}px"></div></div><span>${toDate(d).getDate()}.${toDate(d).getMonth()+1}.</span></div>`;}).join('');
 const ranking=allHabits().map(h=>{let score=0,count=0;for(let i=0;i<30;i++){const e=entry(shift(today,-i));if(Object.hasOwn(e.points,h.id)){score+=Number(e.points[h.id]);count++;}}return {h,score,count};}).filter(x=>x.count).sort((x,y)=>y.score-x.score);
 return page('Statistik.','Nicht perfekt sein – langfristig vorankommen.')+`<div class="stat-grid">${statCard(a.average===null?'–':signed(num(a.average)),'7-Tage-Schnitt',`${a.days} Tage erfasst`)}${statCard(b.average===null?'–':signed(num(b.average)),'30-Tage-Schnitt',`${b.days} Tage erfasst`)}${statCard(signed(b.sum),'Punkte in 30 Tagen','Gewohnheiten und Aktivitäten')}</div>`+
 `<section class="card chart-card"><div class="chart-head"><h2>Deine letzten 14 Tage</h2></div><div class="simple-score-chart">${bars}</div><p class="footnote">Tage ohne Einträge werden nicht als null Punkte in den Durchschnitt gerechnet.</p></section>`+
 `<section class="card chart-card"><div class="chart-head"><h2>Gewohnheiten – letzte 30 Tage</h2></div>${ranking.length?ranking.map(x=>`<div class="ranking-row"><span>${html(x.h.name)}</span><strong class="${x.score<0?'negative-score':''}">${signed(x.score)} P.</strong></div>`).join(''):'<p class="small-muted">Noch keine Tagesbewertungen vorhanden.</p>'}</section>`;
}
function statCard(v,title,sub){return `<div class="card mini-stat"><div class="stat-label">${title}</div><div class="stat-number">${v}</div><div class="stat-info">${sub}</div></div>`;}
function habitList(items){return items.map((h,i)=>`<div class="manage-row ${h.archivedOn?'archived':''}"><div class="habit-info"><div class="habit-sign ${h.kind}">${h.kind==='positive'?'+':'−'}</div><div class="habit-label"><strong>${html(h.name)}</strong><small>${h.schedule==='daily'?'Täglich':h.schedule==='weekdays'?'Mo–Fr':'Sa–So'} · ${h.kind==='positive'?'Positiv':'Negativ'}</small></div></div><div class="manage-actions">${!h.archivedOn?`<button class="icon-button" title="Nach oben" data-action="move-up" data-id="${html(h.id)}" ${i===0?'disabled':''}>${ico('up')}</button><button class="icon-button" title="Nach unten" data-action="move-down" data-id="${html(h.id)}" ${i===items.length-1?'disabled':''}>${ico('down')}</button><button class="icon-button" title="Bearbeiten" data-action="edit-habit" data-id="${html(h.id)}">${ico('edit')}</button>`:''}<button class="icon-button" title="${h.archivedOn?'Aktivieren':'Pausieren'}" aria-label="${h.archivedOn?'Gewohnheit aktivieren':'Gewohnheit pausieren'}: ${html(h.name)}" data-action="${h.archivedOn?'restore-habit':'archive-habit'}" data-id="${html(h.id)}">${ico(h.archivedOn?'restore':'archive')}</button><button class="icon-button delete-habit-button" title="Endgültig löschen" aria-label="Gewohnheit endgültig löschen: ${html(h.name)}" data-action="delete-habit" data-id="${html(h.id)}">${ico('trash')}</button></div></div>`).join('');}
function habitsView(){const hs=allHabits(),active=hs.filter(x=>!x.archivedOn),archived=hs.filter(x=>x.archivedOn);return page('Gewohnheiten.','Hier legst du fest, was du beobachten möchtest.',`<button class="button primary small" data-action="add-habit">${ico('plus')} Neu</button>`)+
 `<div class="intro-panel">Punkte werden nicht mehr fest voreingestellt: Du vergibst sie <strong>jeden Tag direkt mit + und −</strong> in der Tagesansicht.</div>`+
 `<div class="section-head"><div class="section-title"><h2>Aktive Gewohnheiten</h2><span class="count">${active.length}</span></div></div><div class="card manage-list">${active.length?habitList(active):'<div class="empty-state">Noch keine Gewohnheiten angelegt.</div>'}</div>`+
 (archived.length?`<div class="section-head"><div class="section-title"><h2>Pausierte Gewohnheiten</h2><span class="count">${archived.length}</span></div></div><div class="card manage-list">${habitList(archived)}</div>`:'')+
 `<div class="settings-shortcut"><button class="button outline" data-action="nav" data-view="settings">${ico('settings')} Daten &amp; Sicherungen</button></div>`;
}
function rewardItem(r,balance){const left=Math.max(0,r.cost-Math.max(0,balance)),percent=rewardProgress(balance,r.cost),ready=balance>=r.cost;
 return `<article class="card reward-card"><div class="reward-card-head"><div class="reward-title"><h3>${html(r.name)}</h3><p>${num(r.cost)} Punkte benötigt</p></div><div class="reward-controls"><button class="icon-button" data-action="edit-reward" data-id="${html(r.id)}" aria-label="Wunsch bearbeiten">${ico('edit')}</button><button class="icon-button" data-action="delete-reward" data-id="${html(r.id)}" aria-label="Wunsch löschen">${ico('trash')}</button></div></div><div class="reward-progress-meta"><strong>${ready?'Ziel erreicht!':`${num(left)} Punkte fehlen`}</strong><span>${num(Math.min(r.cost,Math.max(0,balance)))} / ${num(r.cost)}</span></div><div class="reward-track" role="progressbar" aria-label="Sparfortschritt ${html(r.name)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}"><div style="width:${percent}%"></div></div><div class="reward-footer"><span class="small-muted">${percent}% erreicht</span><button class="button ${ready?'primary':'outline'} small" data-action="redeem-reward" data-id="${html(r.id)}" ${ready?'':'disabled'}>${ico('gift')} Einlösen</button></div></article>`;
}
function rewardsView(){const w=wallet(),pending=store.rewards.filter(r=>!r.redeemedOn),redeemed=store.rewards.filter(r=>r.redeemedOn).sort((a,b)=>b.redeemedOn.localeCompare(a.redeemedOn));
 return page('Wünsche.','Mit deinen Punkten auf kleine und große Belohnungen sparen.',`<button class="button primary small" data-action="add-reward">${ico('plus')} Wunsch</button>`)+
 `<section class="card wallet-card"><span class="score-eyebrow">DEIN SPARGUTHABEN</span><div class="wallet-total ${w.available<0?'negative-score':''}">${signed(w.available)} <span>Punkte</span></div><div class="wallet-splits"><span>Verdient: <strong>${signed(w.earned)}</strong></span><span>Eingelöst: <strong>−${num(w.spent)}</strong></span></div></section>`+
 `<p class="reward-hint">Alle Wünsche greifen auf <strong>dasselbe Punkteguthaben</strong> zu. Beim Einlösen werden Punkte abgezogen; deine Tages- und Wochenstatistik bleibt unverändert.${w.available<0?' Durch nachträgliche Änderungen ist dein Guthaben derzeit negativ.':''}</p>`+
 `<div class="section-head"><div class="section-title"><h2>Meine Sparziele</h2><span class="count">${pending.length}</span></div></div>`+
 (pending.length?`<div class="reward-grid">${pending.map(r=>rewardItem(r,w.available)).join('')}</div>`:`<div class="card empty-state"><h3>Noch keine Wünsche</h3><p>Lege dein erstes Sparziel mit einem selbst gewählten Punktepreis an.</p><button class="button primary" data-action="add-reward">${ico('plus')} Wunsch hinzufügen</button></div>`)+
 (redeemed.length?`<div class="section-head"><div class="section-title"><h2>Eingelöste Belohnungen</h2><span class="count">${redeemed.length}</span></div></div><div class="card reward-history">${redeemed.map(r=>`<div class="reward-history-row"><div><strong>${html(r.name)}</strong><small>Am ${html(human(r.redeemedOn))} eingelöst</small></div><div class="reward-history-actions"><b>−${num(r.cost)} P.</b><button class="button outline small" data-action="undo-reward" data-id="${html(r.id)}">Rückgängig</button></div></div>`).join('')}</div>`:'')+
 `<p class="footnote">Das Einlösen ist eine persönliche Belohnungsmarkierung; ein realer Kauf wird dadurch nicht ausgelöst.</p>`;
}
function settingsView(){return page('Daten & Einstellungen.','Keine Cloud, kein Konto, kein Abo.')+
 `<section class="card settings-block"><div class="settings-panel-head">${ico('lock')}<h2>Alles bleibt auf deinem Gerät</h2></div><p>Die App speichert Punkte, Gewohnheiten, Aktivitäten, Wünsche und Notizen ausschließlich im lokalen Browser-Speicher. Es gibt keinen Server für deine Daten und keine automatische Synchronisierung.</p><div class="warning"><strong>Bitte sichern:</strong> Beim Löschen von Browserdaten, beim Gerätewechsel oder beim Entfernen der Web-App können Daten verlorengehen. Erstelle regelmäßig eine JSON-Sicherung.</div></section>`+
 `<section class="card settings-block"><div class="settings-panel-head">${ico('download')}<h2>Sichern &amp; Wiederherstellen</h2></div><div class="settings-actions"><button class="button primary" data-action="export-json">${ico('download')} JSON-Sicherung</button><button class="button outline" data-action="export-csv">${ico('file')} CSV-Export</button><button class="button outline" data-action="import">${ico('upload')} JSON importieren</button><input class="file-input" id="import-file" type="file" accept=".json,application/json"></div><p class="footnote">Backups aus Version 1, 2 und 3 werden übernommen. Wünsche und Einlösungen sind in der JSON-Sicherung enthalten. Der Import ersetzt alle aktuellen lokalen Einträge.</p></section>`+
 `<section class="card settings-block"><div class="settings-panel-head">${ico('sun')}<h2>Auf dem iPhone installieren</h2></div><p>Die Website einmalig über eine HTTPS-Adresse in Safari öffnen und „Zum Home-Bildschirm“ wählen. Die installierte Version arbeitet nach dem Laden auch ohne Internet weiter. Eine HTML-Datei aus der Dateien-App ist auf dem iPhone keine zuverlässige Installation.</p></section>`+
 `<section class="card settings-block"><div class="settings-panel-head">${ico('trash')}<h2>Lokale Daten zurücksetzen</h2></div><p>Löscht alle hier gespeicherten Einträge unwiderruflich.</p><button class="button outline" data-action="reset">${ico('trash')} Alles zurücksetzen</button></section>`;
}
const renderers={today:todayView,activities:activitiesView,habits:habitsView,rewards:rewardsView,calendar:calendarView,stats:statsView,settings:settingsView};
function render(){const nav=tabs.map(btnNav).join('');$('sidebar-nav').innerHTML=nav;$('bottom-nav').innerHTML=tabs.filter(t=>t.id!=='settings').map(btnNav).join('');$('view').innerHTML=renderers[view]();document.title=`${tabs.find(t=>t.id===view)?.label||'Heute'} · Meine 1%-Methode`;}
function show(id){if(!renderers[id])return;view=id;render();window.scrollTo(0,0);}
function adjustHabit(id,amount){if(!store.habits.some(h=>h.id===id&&active(h,day)))return;const e=ensure(day),v=Number(e.points[id]||0);if(!validPoint(v+amount))return;e.points[id]=v+amount;save();render();}
function adjustActivity(id,amount){const a=ensure(day).activities.find(x=>x.id===id);if(!a||!validPoint(a.points+amount))return;a.points+=amount;save();render();}
function newActivity(){const input=$('quick-name');const name=input?.value.trim();if(!name||name.length>90)return notice('Bitte eine Aktivität eingeben.');ensure(day).activities.push({id:uid(),name,points:1});save();render();$('quick-name')?.focus();notice('Aktivität erfasst');}
function editActivity(id){const a=entry(day).activities.find(x=>x.id===id);if(!a)return;$('activity-id').value=id;$('activity-name').value=a.name;$('activity-dialog').showModal();$('activity-name').focus();}
function saveActivity(){const id=$('activity-id').value,name=$('activity-name').value.trim();if(!name)return notice('Bitte eine Bezeichnung eingeben.');const a=entry(day).activities.find(x=>x.id===id);if(a){a.name=name;save();$('activity-dialog').close();render();notice('Aktivität geändert');}}
function editHabit(id){const h=store.habits.find(h=>h.id===id);$('habit-id').value=h?.id||'';$('habit-name').value=h?.name||'';$('habit-description').value=h?.description||'';$('habit-dialog').querySelector(`[name="habit-kind"][value="${h?.kind||'positive'}"]`).checked=true;$('habit-dialog').querySelector(`[name="habit-schedule"][value="${h?.schedule||'daily'}"]`).checked=true;$('habit-dialog').showModal();$('habit-name').focus();}
function saveHabit(){const name=$('habit-name').value.trim();if(!name)return notice('Bitte eine Bezeichnung eingeben.');const d=$('habit-dialog'),id=$('habit-id').value,fields={name,description:$('habit-description').value.trim(),kind:d.querySelector('[name="habit-kind"]:checked').value,schedule:d.querySelector('[name="habit-schedule"]:checked').value};if(id){const h=store.habits.find(h=>h.id===id);if(h)Object.assign(h,fields);}else store.habits.push({id:uid(),...fields,createdOn:today,archivedOn:null,order:store.habits.length});save();d.close();render();notice(id?'Gewohnheit bearbeitet':'Gewohnheit erstellt');}
function editReward(id){const r=store.rewards.find(r=>r.id===id);if(r?.redeemedOn)return notice('Eingelöste Wünsche erst rückgängig machen.');$('reward-id').value=r?.id||'';$('reward-name').value=r?.name||'';$('reward-cost').value=r?.cost||'';$('reward-dialog-title').textContent=r?'Wunsch bearbeiten':'Neuer Wunsch';$('reward-dialog').showModal();$('reward-name').focus();}
function saveReward(){const name=$('reward-name').value.trim(),cost=Number($('reward-cost').value),id=$('reward-id').value;
 if(!name||name.length>90||!Number.isInteger(cost)||cost<1||cost>1000000)return notice('Bitte Wunschname und 1 bis 1.000.000 Punkte eingeben.');
 if(id){const r=store.rewards.find(r=>r.id===id&&!r.redeemedOn);if(!r)return;Object.assign(r,{name,cost});}
 else store.rewards.push({id:uid(),name,cost,createdOn:today,redeemedOn:null});
 if(!save())return;$('reward-dialog').close();render();notice(id?'Wunsch aktualisiert':'Wunsch angelegt');}
function redeemReward(id){const r=store.rewards.find(r=>r.id===id&&!r.redeemedOn);if(!r)return;const available=wallet().available;
 if(available<r.cost)return notice(`Noch ${num(r.cost-available)} Punkte nötig.`);
 if(!confirm(`„${r.name}“ für ${num(r.cost)} Punkte einlösen? Das ist nur deine persönliche Belohnung, kein echter Kauf.`))return;
 r.redeemedOn=today;if(!save()){r.redeemedOn=null;return;}render();notice('Wunsch eingelöst');}
function undoReward(id){const r=store.rewards.find(r=>r.id===id&&r.redeemedOn);if(!r)return;
 if(!confirm(`Einlösung von „${r.name}“ rückgängig machen und ${num(r.cost)} Punkte gutschreiben?`))return;
 const previous=r.redeemedOn;r.redeemedOn=null;if(!save()){r.redeemedOn=previous;return;}render();notice('Punkte zurückgebucht');}
function deleteReward(id){const r=store.rewards.find(r=>r.id===id&&!r.redeemedOn);if(!r)return;
 if(!confirm(`Wunsch „${r.name}“ löschen?`))return;const old=store.rewards;store.rewards=old.filter(x=>x.id!==id);if(!save()){store.rewards=old;return;}render();notice('Wunsch gelöscht');}
// Dauerhaftes Löschen entfernt auch alle historischen Tagespunkte dieser Gewohnheit.
// Aktivitäten, Notizen und eingelöste Wünsche bleiben erhalten.
function openDeleteHabit(id){
 const h=store.habits.find(x=>x.id===id);if(!h)return;
 let affected=0,points=0;
 for(const e of Object.values(store.days)){
  if(Object.hasOwn(e.points,h.id)){affected++;points+=Number(e.points[h.id]);}
 }
 habitToDelete=id;
 $('delete-habit-name').textContent=`„${h.name}“`;
 $('delete-habit-impact').textContent=affected
  ?`Bewertungen an ${affected} ${affected===1?'Tag':'Tagen'} (${signed(points)} Punkte) werden dauerhaft entfernt. Dein Sparguthaben ändert sich dadurch um ${signed(-points)} Punkte.`
  :'Es gibt keine bisherigen Tagespunkte für diese Gewohnheit.';
 $('delete-habit-dialog').showModal();
}
function confirmDeleteHabit(){
 const h=store.habits.find(x=>x.id===habitToDelete);
 if(!h)return $('delete-habit-dialog').close();
 const backup=JSON.stringify(store);
 store.habits=store.habits.filter(x=>x.id!==h.id);
 for(const e of Object.values(store.days))delete e.points[h.id];
 if(!save()){
  store=JSON.parse(backup);
  notice('Löschen fehlgeschlagen. Daten unverändert.');
  return;
 }
 habitToDelete=null;
 $('delete-habit-dialog').close();
 render();
 notice('Gewohnheit samt bisherigen Punkten gelöscht');
}
function reorder(id,amount){const list=allHabits().filter(h=>!h.archivedOn),i=list.findIndex(h=>h.id===id);if(i<0||i+amount<0||i+amount>=list.length)return;const a=list[i],b=list[i+amount],tmp=a.order;a.order=b.order;b.order=tmp;save();render();}
function download(name,body,type){const link=document.createElement('a'),url=URL.createObjectURL(new Blob([body],{type}));link.href=url;link.download=name;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);}
function exportJSON(){download(`1-prozent-methode-${today}.json`,JSON.stringify(store,null,2),'application/json;charset=utf-8');notice('JSON-Sicherung vorbereitet');}
function exportCSV(){const rows=[['Datum','Typ','Bezeichnung','Punkte','Notiz']];for(const d of Object.keys(store.days).sort()){const e=entry(d);for(const [id,p] of Object.entries(e.points)){const h=store.habits.find(x=>x.id===id);rows.push([d,'Gewohnheit',h?.name||id,p,e.note]);}for(const a of e.activities)rows.push([d,'Aktivität',a.name,a.points,e.note]);if(!Object.keys(e.points).length&&!e.activities.length&&e.note)rows.push([d,'Notiz','','',e.note]);}for(const r of store.rewards){if(r.redeemedOn)rows.push([r.redeemedOn,'Wunsch eingelöst',r.name,-r.cost,'Abzug nur vom Sparguthaben, nicht vom Tages-Score']);}const encode=s=>'"'+String(s??'').replace(/"/g,'""')+'"';download(`1-prozent-methode-${today}.csv`,'\uFEFF'+rows.map(r=>r.map(encode).join(';')).join('\r\n'),'text/csv;charset=utf-8');notice('CSV-Datei vorbereitet');}
function importFile(file){if(!file)return;if(file.size>5*1024*1024)return notice('Sicherung ist zu groß.');const r=new FileReader();r.onload=()=>{try{const raw=JSON.parse(r.result);if(!validImport(raw))throw Error('Ungültig');if(!confirm('Import ersetzt alle bisherigen Einträge auf diesem Gerät. Fortfahren?'))return;store=normalized(raw);dataReadFailure=false;if(!save())throw Error('Speichern fehlgeschlagen');day=today;month=today.slice(0,7);show('today');notice('Sicherung importiert');}catch(err){notice('Ungültige Sicherungsdatei');}};r.onerror=()=>notice('Datei konnte nicht gelesen werden');r.readAsText(file);}
document.addEventListener('click',event=>{
 const close=event.target.closest('[data-close]');if(close){$(close.dataset.close).close();return;}
 const btn=event.target.closest('[data-action]');if(!btn)return;const action=btn.dataset.action,id=btn.dataset.id;
 if(action==='nav')return show(btn.dataset.view);
 if(action==='add-reward')return editReward(null);
 if(action==='edit-reward')return editReward(id);
 if(action==='delete-reward')return deleteReward(id);
 if(action==='redeem-reward')return redeemReward(id);
 if(action==='undo-reward')return undoReward(id);
 if(action==='previous'){day=shift(day,-1);return render();}
 if(action==='next'){if(day<today)day=shift(day,1);return render();}
 if(action==='adjust-habit')return adjustHabit(id,Number(btn.dataset.step));
 if(action==='adjust-activity')return adjustActivity(id,Number(btn.dataset.step));
 if(action==='pick-day'){if(btn.dataset.day<=today){day=btn.dataset.day;return render();}}
 if(action==='month-prev'){month=monthShift(month,-1);return render();}
 if(action==='month-next'){if(month<today.slice(0,7))month=monthShift(month,1);return render();}
 if(action==='edit-activity')return editActivity(id);
 if(action==='delete-activity'){const a=entry(day).activities.find(x=>x.id===id);if(a&&confirm(`„${a.name}“ löschen?`)){ensure(day).activities=entry(day).activities.filter(x=>x.id!==id);save();render();}return;}
 if(action==='add-habit')return editHabit(null);
 if(action==='edit-habit')return editHabit(id);
 if(action==='delete-habit')return openDeleteHabit(id);
 if(action==='confirm-delete-habit')return confirmDeleteHabit();
 if(action==='move-up')return reorder(id,-1);
 if(action==='move-down')return reorder(id,1);
 if(action==='archive-habit'){const h=store.habits.find(x=>x.id===id);if(h&&confirm(`„${h.name}“ pausieren?`)){h.archivedOn=today;save();render();}return;}
 if(action==='restore-habit'){const h=store.habits.find(x=>x.id===id);if(h){h.pauses=h.pauses||[];if(h.archivedOn&&h.archivedOn<today)h.pauses.push({start:h.archivedOn,end:today});h.archivedOn=null;save();render();}return;}
 if(action==='export-json')return exportJSON();
 if(action==='export-csv')return exportCSV();
 if(action==='import')return $('import-file').click();
 if(action==='reset'&&confirm('Alle lokalen Gewohnheiten, Aktivitäten und Punkte löschen?')){store=newStore();dataReadFailure=false;save();day=today;show('today');notice('Daten zurückgesetzt');}
});
$('view').addEventListener('submit',e=>{if(e.target.id==='quick-activity-form'){e.preventDefault();newActivity();}});
$('view').addEventListener('input',e=>{if(e.target.id==='day-note'){ensure(day).note=e.target.value;save();}});
$('view').addEventListener('change',e=>{if(e.target.id==='import-file'){importFile(e.target.files[0]);e.target.value='';}});
$('habit-form').addEventListener('submit',e=>{e.preventDefault();saveHabit();});
$('activity-form').addEventListener('submit',e=>{e.preventDefault();saveActivity();});
$('reward-form').addEventListener('submit',e=>{e.preventDefault();saveReward();});
save();render();
if(dataReadFailure)setTimeout(()=>alert('Deine gespeicherten Daten konnten nicht geladen werden. Sie wurden zur Sicherheit nicht überschrieben. Bitte versuche zunächst, eine vorhandene JSON-Sicherung zu importieren.'),0);
function updateDayAfterMidnight(){const current=iso(new Date());if(current===today)return;const hadToday=day===today;today=current;if(hadToday)day=current;month=current.slice(0,7);render();}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)updateDayAfterMidnight();});
window.addEventListener('focus',updateDayAfterMidnight);
if('serviceWorker' in navigator && (location.protocol==='https:'||['localhost','127.0.0.1'].includes(location.hostname)))navigator.serviceWorker.register('./sw.js').catch(err=>console.warn('Offline-Speicherung nicht aktiv:',err));
})();
