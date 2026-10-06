const view = document.querySelector('#appView');
const qCount = document.querySelector('#qCount');
const readyCount = document.querySelector('#readyCount');
const STORAGE = 'stargazer-psychiatry-v03';
let db = { questions: [], categories: [] };
let state = loadState();
let activeTimer = null;

const PRESSURE_CHAINS = {
  q02: ['q03','q04','q05'],
  q03: ['q04','q05','q06'],
  q06: ['q07','q08','q09'],
  q07: ['q08','q09','q10'],
  q13: ['q14','q15','q16'],
  q21: ['q22','q23','q24'],
  q25: ['q26','q27','q28'],
  q31: ['q32','q33','q34'],
  q43: ['q44','q45','q46'],
  q50: ['q51','q52']
};
const BOSS_IDS = ['q03','q07','q08','q15','q22','q27','q32','q43','q51','q52'];

function defaultState(){return {ratings:{},completed:{},favorites:{},lastCategory:'all',sessions:[],resume:null};}
function loadState(){
  try { return {...defaultState(), ...(JSON.parse(localStorage.getItem(STORAGE)) || {})}; }
  catch { return defaultState(); }
}
function saveState(){ localStorage.setItem(STORAGE, JSON.stringify(state)); updateStats(); }
function updateStats(){
  const total = db.questions.length || 0;
  const ready = Object.values(state.ratings).filter(v => Number(v) >= 4).length;
  if(qCount) qCount.textContent = total;
  if(readyCount) readyCount.textContent = total ? Math.round((ready/total)*100)+'%' : '0%';
}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
function cat(id){return db.categories.find(c=>c.id===id) || {name:'Interview',color:'purple',icon:'★'};}
function getQ(id){return db.questions.find(q=>q.id===id);}
function clearTimer(){ if(activeTimer){clearInterval(activeTimer);activeTimer=null;} }
function shuffle(a){return [...a].sort(()=>Math.random()-0.5);}
function formatTime(sec){return `${String(Math.floor(sec/60)).padStart(2,'0')}:${String(sec%60).padStart(2,'0')}`;}

async function init(){
  try {
    const res = await fetch('data/questions.json');
    db = await res.json(); updateStats(); openRoute('practice');
  } catch(err){ view.innerHTML = `<div class="error-box"><b>DATA LINK ERROR</b><p>Open this repository through a local web server or GitHub Pages so the interview database can load.</p></div>`; }
}

function openRoute(key){
  clearTimer();
  const routes = {story:renderStory,practice:renderPractice,mock:renderMock,flashcards:renderFlashcards,rapid:renderRapid,progress:renderProgress,quick:renderRapid};
  (routes[key] || renderPractice)(); wireRoutes();
  view.scrollIntoView({behavior:'smooth',block:'nearest'});
}
function wireRoutes(){document.querySelectorAll('[data-route]').forEach(b=>{if(!b.dataset.bound){b.dataset.bound='1';b.addEventListener('click',e=>openRoute(e.currentTarget.dataset.route));}});}

function renderStory(){
  view.innerHTML = `<div class="module-head"><div><div class="eyebrow">▶ SAVE POINT 01</div><h2>MY STORY</h2><p>Your interview narrative in four checkpoints. Think in ideas, not memorized sentences.</p></div><div class="story-badge">✿ YOUR QUEST</div></div>
  <div class="story-map"><div class="map-line"></div><div class="map-node active"><b>01</b><span>FOUNDATION</span></div><div class="map-node"><b>02</b><span>RADIOLOGY</span></div><div class="map-node"><b>03</b><span>GROWTH</span></div><div class="map-node"><b>04</b><span>PSYCHIATRY</span></div></div>
  <div class="story-grid"><article class="story-card pink"><span class="step">01</span><h3>Strong foundation</h3><p>Academic strength, medical training, research experience, and a genuine interest in diagnostic reasoning.</p><div class="keywords">ACADEMICS • SCIENCE • RESEARCH</div></article>
  <article class="story-card purple"><span class="step">02</span><h3>Radiology clarified fit</h3><p>Three years of Radiology built diagnostic discipline while revealing how important direct patient connection is to you.</p><div class="keywords">DIAGNOSTIC • PATIENTS • CLARITY</div></article>
  <article class="story-card gold"><span class="step">03</span><h3>Six years of responsibility & growth</h3><p>NIH research, family responsibilities, property management, reflection, resilience, and personal growth. Those responsibilities are now settled.</p><div class="keywords">NIH • FAMILY • MATURITY</div></article>
  <article class="story-card blue"><span class="step">04</span><h3>Deliberate commitment to Psychiatry</h3><p>Psychiatry brings together rigorous diagnostic reasoning, listening, therapeutic relationships, and longitudinal care.</p><div class="keywords">PSYCHIATRY • CONNECTION • COMMITMENT</div></article></div>
  <div class="golden-rule"><b>CORE MESSAGE</b><span>“My path has not been linear, but it has been very clarifying.”</span></div>`;
}

function renderPractice(filter=state.lastCategory || 'all', search=''){
  state.lastCategory=filter;
  const filtered=db.questions.filter(q=>(filter==='all'||q.category===filter) && (!search || (q.question+' '+q.answer+' '+q.keywords.join(' ')).toLowerCase().includes(search.toLowerCase())));
  view.innerHTML = `<div class="module-head"><div><div class="eyebrow">▶ QUESTION BANK</div><h2>PRACTICE</h2><p>Recall the structure first. Reveal your model answer only after you have spoken.</p></div><div class="counter-chip">${filtered.length} / ${db.questions.length}</div></div>
  <div class="toolbar"><input id="questionSearch" class="pixel-input" placeholder="SEARCH QUESTIONS..." value="${esc(search)}" aria-label="Search questions"><div class="category-tabs"><button class="tab ${filter==='all'?'active':''}" data-cat="all">ALL</button>${db.categories.map(c=>`<button class="tab ${filter===c.id?'active':''}" data-cat="${c.id}">${c.icon} ${esc(c.name)}</button>`).join('')}</div></div>
  <div class="question-list">${filtered.map(renderQuestionCard).join('') || '<div class="empty-state">NO QUESTIONS MATCH. Try another search or category.</div>'}</div>`;
  view.querySelector('#questionSearch')?.addEventListener('input',e=>renderPractice(filter,e.target.value));
  view.querySelectorAll('[data-cat]').forEach(b=>b.addEventListener('click',()=>renderPractice(b.dataset.cat,''))); bindQuestionCards();
}
function renderQuestionCard(q){
  const c=cat(q.category), rating=state.ratings[q.id]||0, done=!!state.completed[q.id], fav=!!state.favorites[q.id], boss=BOSS_IDS.includes(q.id);
  return `<article class="question-card ${c.color} ${boss?'boss-card':''}" data-qid="${q.id}"><div class="question-top"><div class="category-label">${c.icon} ${esc(c.name)} ${boss?'<span class="boss-tag">BOSS</span>':''}</div><button class="heart-btn ${fav?'on':''}" data-fav="${q.id}" title="Favorite">${fav?'♥':'♡'}</button></div>
    <h3>${esc(q.question)}</h3><div class="question-meta"><span>⏱ ${q.seconds}s target</span><span>${done?'✓ REHEARSED':'○ NOT YET'}</span>${PRESSURE_CHAINS[q.id]?'<span>↳ FOLLOW-UP CHAIN</span>':''}</div>
    <div class="recall-box"><b>RECALL MAP</b><div>${q.keywords.map(k=>`<span>${esc(k)}</span>`).join('')}</div></div>
    <div class="card-actions"><button class="reveal-btn" data-reveal="${q.id}">REVEAL MODEL ANSWER</button>${PRESSURE_CHAINS[q.id]?`<button class="chain-btn" data-chain="${q.id}">PLAY PRESSURE CHAIN</button>`:''}</div>
    <div class="answer-panel" id="answer-${q.id}"><div class="answer-label">MODEL ANSWER</div><p>${esc(q.answer)}</p><div class="rating-row"><span>HOW READY?</span>${[1,2,3,4,5].map(n=>`<button class="rating ${rating>=n?'set':''}" data-rate="${q.id}" data-value="${n}">${n}</button>`).join('')}</div><button class="complete-btn ${done?'done':''}" data-complete="${q.id}">${done?'✓ REHEARSED':'MARK REHEARSED'}</button></div></article>`;
}
function bindQuestionCards(){
  view.querySelectorAll('[data-reveal]').forEach(b=>b.addEventListener('click',()=>{const p=view.querySelector('#answer-'+b.dataset.reveal);p.classList.toggle('show');b.textContent=p.classList.contains('show')?'HIDE MODEL ANSWER':'REVEAL MODEL ANSWER';}));
  view.querySelectorAll('[data-rate]').forEach(b=>b.addEventListener('click',()=>{state.ratings[b.dataset.rate]=Number(b.dataset.value);saveState();renderPractice(state.lastCategory||'all');}));
  view.querySelectorAll('[data-complete]').forEach(b=>b.addEventListener('click',()=>{state.completed[b.dataset.complete]=!state.completed[b.dataset.complete];saveState();renderPractice(state.lastCategory||'all');}));
  view.querySelectorAll('[data-fav]').forEach(b=>b.addEventListener('click',()=>{state.favorites[b.dataset.fav]=!state.favorites[b.dataset.fav];saveState();renderPractice(state.lastCategory||'all');}));
  view.querySelectorAll('[data-chain]').forEach(b=>b.addEventListener('click',()=>startInterview([b.dataset.chain,...(PRESSURE_CHAINS[b.dataset.chain]||[])],'pressure')));
}

function renderMock(){
  const resume=state.resume;
  view.innerHTML=`<div class="module-head"><div><div class="eyebrow">▶ SIMULATION ROOM</div><h2>MOCK INTERVIEW</h2><p>Choose your run. Speak aloud before revealing notes. Pressure mode follows the interviewer’s logic instead of asking isolated questions.</p></div><div class="story-badge">◆ PRESSURE TEST</div></div>
  ${resume?`<div class="resume-banner"><div><b>✦ SAVED RUN</b><span>${esc(resume.modeLabel)} • QUESTION ${resume.index+1}/${resume.ids.length}</span></div><button class="pixel-btn primary" id="resumeRun">RESUME RUN</button><button class="pixel-btn" id="discardRun">DISCARD</button></div>`:''}
  <div class="mode-grid"><button class="mode-card" data-length="10" data-mode="standard"><b>10</b><span>QUICK RUN</span><small>Warm-up + key risks</small></button><button class="mode-card" data-length="15" data-mode="standard"><b>15</b><span>STANDARD RUN</span><small>Balanced interview</small></button><button class="mode-card" data-length="30" data-mode="standard"><b>30</b><span>FULL INTERVIEW</span><small>Deep rehearsal</small></button><button class="mode-card pressure" data-length="8" data-mode="pressure"><b>⚔</b><span>PRESSURE RUN</span><small>Follow-up chains + pushback</small></button><button class="mode-card boss" data-mode="boss"><b>★</b><span>BOSS ROOM</span><small>Your highest-risk questions</small></button></div>
  <div class="game-rules"><div><b>🎙 SPEAK</b><span>Answer aloud first.</span></div><div><b>⏱ TIMER</b><span>Stay near the target.</span></div><div><b>✦ REVEAL</b><span>Compare after answering.</span></div><div><b>💾 SAVE</b><span>Runs can be resumed.</span></div></div>`;
  view.querySelectorAll('[data-length]').forEach(b=>b.addEventListener('click',()=>startMock(Number(b.dataset.length),b.dataset.mode)));
  view.querySelector('[data-mode="boss"]')?.addEventListener('click',()=>startMock(10,'boss'));
  view.querySelector('#resumeRun')?.addEventListener('click',()=>startInterview(state.resume.ids,state.resume.mode,state.resume.index));
  view.querySelector('#discardRun')?.addEventListener('click',()=>{state.resume=null;saveState();renderMock();});
}

function pickQuestions(n, mode){
  if(mode==='boss') return shuffle(BOSS_IDS).map(getQ).filter(Boolean).slice(0,n);
  if(mode==='pressure'){
    const anchors=shuffle(Object.keys(PRESSURE_CHAINS)).slice(0,Math.max(2,Math.ceil(n/4)));
    let ids=[]; anchors.forEach(a=>ids.push(a,...PRESSURE_CHAINS[a]));
    ids=[...new Set(ids)]; return ids.map(getQ).filter(Boolean).slice(0,n);
  }
  const priority=['core','radiology','gap','psychiatry','risk','program','personal','future'];
  let chosen=[]; priority.forEach(c=>{const pool=shuffle(db.questions.filter(q=>q.category===c));if(pool[0])chosen.push(pool[0]);});
  chosen=[...chosen,...shuffle(db.questions.filter(q=>!chosen.includes(q)))]; return chosen.slice(0,n);
}
function startMock(n,mode='standard'){const qs=pickQuestions(n,mode);startInterview(qs.map(q=>q.id),mode,0);}

function startInterview(ids,mode='standard',startIndex=0){
  clearTimer();
  const clean=ids.filter(id=>getQ(id));
  state.resume={ids:clean,index:startIndex,mode,modeLabel:mode==='pressure'?'PRESSURE RUN':mode==='boss'?'BOSS ROOM':'STANDARD RUN'}; saveState();
  runInterview(clean,mode,startIndex);
}
function runInterview(ids,mode,index){
  if(index>=ids.length){finishMock(ids,mode);return;}
  const q=getQ(ids[index]); const c=cat(q.category); let remaining=q.seconds; let revealed=false; let timerStarted=false;
  state.resume={ids,index,mode,modeLabel:mode==='pressure'?'PRESSURE RUN':mode==='boss'?'BOSS ROOM':'STANDARD RUN'}; saveState();
  const chainNext=(PRESSURE_CHAINS[q.id]||[]).some(id=>ids.includes(id));
  view.innerHTML=`<div class="mock-progress"><span>QUESTION ${index+1} / ${ids.length}</span><span>${c.icon} ${esc(c.name)}</span><span>${mode==='pressure'?'⚔ PRESSURE':mode==='boss'?'★ BOSS':'◆ STANDARD'}</span></div>
  <div class="interview-console ${mode}"><div class="interviewer-avatar"><div class="avatar-flower">✿</div><span>INTERVIEWER</span></div><div class="timer-box" id="timer">${formatTime(remaining)}</div><div class="mock-screen"><div class="eyebrow">▶ ${mode==='pressure'?'FOLLOW-UP PRESSURE':'INTERVIEWER'}</div><h2>${esc(q.question)}</h2><div class="mock-prompt">${mode==='pressure'&&chainNext?'This answer may trigger a follow-up. Stay calm and answer the question you were actually asked.':'Take a breath. Answer aloud before revealing your notes.'}</div><div class="mock-actions"><button class="pixel-btn primary" id="startTimer">${timerStarted?'TIMER RUNNING':'START TIMER'}</button><button class="pixel-btn" id="revealMock">REVEAL NOTES</button><button class="pixel-btn" id="skipMock">SKIP</button></div><div class="timer-note">TARGET ${q.seconds} SECONDS • ${q.seconds<=45?'CONCISE':'STRUCTURED'} ANSWER</div><div id="mockAnswer" class="mock-answer"><div class="answer-label">YOUR RECALL MAP</div><div class="recall-large">${q.keywords.map(k=>`<span>${esc(k)}</span>`).join('')}</div><p>${esc(q.answer)}</p><div class="answer-reflection"><label>HOW DID THAT ANSWER FEEL?</label><div>${[1,2,3,4,5].map(n=>`<button class="rating ${state.ratings[q.id]>=n?'set':''}" data-mock-rate="${n}">${n}</button>`).join('')}</div></div><div class="mock-nav"><button class="complete-btn" id="mockDone">${index===ids.length-1?'FINISH RUN':'NEXT QUESTION →'}</button></div></div></div></div>`;
  const timerEl=view.querySelector('#timer');
  function tick(){remaining--;timerEl.textContent=formatTime(Math.max(0,remaining));timerEl.classList.toggle('danger',remaining<=10);if(remaining<=0){clearTimer();timerEl.textContent='00:00';}}
  view.querySelector('#startTimer').addEventListener('click',e=>{if(activeTimer)return;e.currentTarget.textContent='TIMER RUNNING';timerStarted=true;activeTimer=setInterval(tick,1000);});
  view.querySelector('#revealMock').addEventListener('click',()=>{revealed=!revealed;view.querySelector('#mockAnswer').classList.toggle('show',revealed);});
  view.querySelector('#skipMock').addEventListener('click',()=>runInterview(ids,mode,index+1));
  view.querySelector('#mockDone').addEventListener('click',()=>{clearTimer();state.completed[q.id]=true;saveState();runInterview(ids,mode,index+1);});
  view.querySelectorAll('[data-mock-rate]').forEach(b=>b.addEventListener('click',()=>{state.ratings[q.id]=Number(b.dataset.mockRate);saveState();renderMockQuestionAfterRating(q.id); }));
}
function renderMockQuestionAfterRating(id){
  const current=state.resume; if(!current){return;} runInterview(current.ids,current.mode,current.index);
}
function finishMock(ids,mode){
  clearTimer(); const done=ids.filter(id=>state.completed[id]).length; state.resume=null; state.sessions=state.sessions||[]; state.sessions.unshift({date:new Date().toISOString(),mode,count:ids.length,completed:done}); state.sessions=state.sessions.slice(0,20); saveState();
  view.innerHTML=`<div class="finish-card"><div class="pixel-heart">✿</div><div class="eyebrow">▶ SAVE POINT REACHED</div><h2>${mode==='boss'?'BOSS ROOM CLEARED':mode==='pressure'?'PRESSURE RUN COMPLETE':'RUN COMPLETE'}</h2><p>You completed a ${mode==='boss'?'Boss Room':mode==='pressure'?'Pressure':'standard'} run with <b>${ids.length}</b> questions. Your next challenge is to repeat the run with less dependence on the model answers.</p><div class="finish-stats"><div><b>${ids.length}</b><span>QUESTIONS</span></div><div><b>${ids.filter(id=>state.ratings[id]>=4).length}</b><span>READY ★★★★+</span></div><div><b>${done}</b><span>REHEARSED</span></div></div><button class="pixel-btn primary" data-route="mock">RUN AGAIN</button><button class="pixel-btn" data-route="practice">PRACTICE WEAK AREAS</button></div>`; wireRoutes();
}

function renderFlashcards(){
  let pool=db.questions.filter(q=>state.favorites[q.id]); if(!pool.length) pool=db.questions; let i=0,revealed=false;
  function card(){const q=pool[i%pool.length],c=cat(q.category);view.innerHTML=`<div class="module-head"><div><div class="eyebrow">▶ RECALL MODE</div><h2>FLASHCARDS</h2><p>Speak first. The card is here to prompt memory, not replace it.</p></div><div class="counter-chip">${i+1} / ${pool.length}</div></div><div class="flashcard ${c.color}"><div class="category-label">${c.icon} ${esc(c.name)}</div><h2>${esc(q.question)}</h2><div class="flash-hint">${revealed?'<b>RECALL MAP</b> '+q.keywords.map(k=>`<span>${esc(k)}</span>`).join(''):'ANSWER ALOUD BEFORE YOU FLIP'}</div>${revealed?`<p class="flash-answer">${esc(q.answer)}</p>`:''}<button class="pixel-btn primary" id="flip">${revealed?'HIDE ANSWER':'REVEAL ANSWER'}</button></div><div class="flash-nav"><button class="pixel-btn" id="prev">← PREVIOUS</button><button class="pixel-btn" id="next">NEXT →</button></div>`;view.querySelector('#flip').addEventListener('click',()=>{revealed=!revealed;card();});view.querySelector('#prev').addEventListener('click',()=>{i=(i-1+pool.length)%pool.length;revealed=false;card();});view.querySelector('#next').addEventListener('click',()=>{state.completed[q.id]=true;saveState();i=(i+1)%pool.length;revealed=false;card();});} card();
}
function renderRapid(){
  const ids=['q01','q07','q13','q21','q04']; const qs=ids.map(id=>db.questions.find(q=>q.id===id)).filter(Boolean);
  view.innerHTML=`<div class="module-head"><div><div class="eyebrow">▶ LAST-MINUTE SAVE POINT</div><h2>5-MINUTE RAPID REVIEW</h2><p>If the interview starts in five minutes, rehearse these five answers and keep these three principles in mind.</p></div><div class="story-badge">⚡ READY MODE</div></div><div class="rapid-grid">${qs.map((q,i)=>`<article><span>0${i+1}</span><h3>${esc(q.short)}</h3><p>${esc(q.answer)}</p></article>`).join('')}</div><div class="rules"><h3>THREE RULES</h3><div><b>01</b> Don't apologize for your path.</div><div><b>02</b> Don't criticize Radiology or imply Psychiatry is easier.</div><div><b>03</b> Make it clear: responsibilities are resolved and you are ready to commit.</div></div>`;
}
function renderProgress(){
  const total=db.questions.length, done=Object.values(state.completed).filter(Boolean).length, ready=Object.values(state.ratings).filter(v=>v>=4).length;
  const byCat=db.categories.map(c=>{const qs=db.questions.filter(q=>q.category===c.id),r=qs.filter(q=>state.ratings[q.id]>=4).length;return {...c,total:qs.length,ready:r};});
  const sessions=(state.sessions||[]).slice(0,5);
  view.innerHTML=`<div class="module-head"><div><div class="eyebrow">▶ SAVE DATA</div><h2>PROGRESS</h2><p>Your rehearsal data stays in this browser. Nothing here requires an account.</p></div><button class="pixel-btn" id="reset">RESET LOCAL DATA</button></div><div class="progress-hero"><div><b>${done}</b><span>REHEARSED</span></div><div><b>${ready}</b><span>READY ★★★★+</span></div><div><b>${total?Math.round(done/total*100):0}%</b><span>COMPLETION</span></div></div><div class="category-progress">${byCat.map(c=>`<div class="progress-row"><span>${c.icon} ${esc(c.name)}</span><div class="bar"><i style="width:${c.total?Math.round(c.ready/c.total*100):0}%"></i></div><b>${c.ready}/${c.total}</b></div>`).join('')}</div><div class="session-log"><h3>RECENT RUNS</h3>${sessions.length?sessions.map(s=>`<div><span>${new Date(s.date).toLocaleDateString()}</span><b>${esc((s.mode||'standard').toUpperCase())}</b><span>${s.count} questions</span></div>`).join(''):'<p>No completed runs yet. Your first run will appear here.</p>'}</div>`;
  view.querySelector('#reset').addEventListener('click',()=>{if(confirm('Reset all local rehearsal data?')){state=defaultState();saveState();renderProgress();}});
}

/* ==============================
   PHASE 4 — PERFORMANCE LAB
   Local-first voice rehearsal + analytics
   ============================== */

const PHASE4_STORAGE = 'stargazer-psychiatry-v04';
let recorder = null;
let recorderChunks = [];
let recorderStream = null;
let speechRecognition = null;
let liveTranscript = '';
let answerStartedAt = null;
let answerElapsed = 0;
let answerInterval = null;
let currentPerformance = null;

function phase4DefaultState(){
  return {
    ratings:{}, completed:{}, favorites:{}, lastCategory:'all', sessions:[], resume:null,
    performances:[], streak:{days:[],lastDay:null}, preferences:{voice:true,transcript:true}
  };
}
function phase4LoadState(){
  let old={};
  try{old=JSON.parse(localStorage.getItem(STORAGE)||'{}')||{};}catch{}
  let fresh={};
  try{fresh=JSON.parse(localStorage.getItem(PHASE4_STORAGE)||'{}')||{};}catch{}
  const base=phase4DefaultState();
  const merged={...base,...old,...fresh};
  merged.ratings={...old.ratings,...fresh.ratings};
  merged.completed={...old.completed,...fresh.completed};
  merged.favorites={...old.favorites,...fresh.favorites};
  merged.sessions=[...(fresh.sessions||[]),...(old.sessions||[])].slice(0,40);
  merged.performances=fresh.performances||[];
  merged.streak=fresh.streak||base.streak;
  merged.preferences={...base.preferences,...(fresh.preferences||{})};
  return merged;
}
state=phase4LoadState();
function phase4Save(){
  try{localStorage.setItem(PHASE4_STORAGE,JSON.stringify(state));}catch(e){}
  try{localStorage.setItem(STORAGE,JSON.stringify(state));}catch(e){}
  updateStats();
}
function dayKey(d=new Date()){return d.toISOString().slice(0,10);}
function updateStreak(){
  const today=dayKey();
  if(state.streak.lastDay===today)return;
  const days=new Set(state.streak.days||[]); days.add(today);
  state.streak.days=[...days].sort().slice(-60); state.streak.lastDay=today;
}
function phase4StopTimer(){if(answerInterval){clearInterval(answerInterval);answerInterval=null;} if(activeTimer){clearInterval(activeTimer);activeTimer=null;}}
function phase4FormatSeconds(s){return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;}
function phase4StartClock(){
  answerStartedAt=performance.now(); answerElapsed=0;
  const el=document.querySelector('#answerClock');
  if(el) el.textContent=phase4FormatSeconds(answerElapsed);
  answerInterval=setInterval(()=>{
    answerElapsed=Math.floor((performance.now()-answerStartedAt)/1000);
    const node=document.querySelector('#answerClock'); if(node) node.textContent=phase4FormatSeconds(answerElapsed);
  },250);
}
function phase4StopClock(){
  if(answerStartedAt) answerElapsed=Math.max(0,Math.round((performance.now()-answerStartedAt)/1000));
  if(answerInterval){clearInterval(answerInterval);answerInterval=null;}
  answerStartedAt=null;
  return answerElapsed;
}
function hasSpeech(){return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;}
function startSpeech(){
  if(!hasSpeech()) return false;
  const C=window.SpeechRecognition||window.webkitSpeechRecognition;
  speechRecognition=new C(); speechRecognition.continuous=true; speechRecognition.interimResults=true; speechRecognition.lang='en-US';
  speechRecognition.onresult=e=>{
    let text='';
    for(let i=e.resultIndex;i<e.results.length;i++) text+=e.results[i][0].transcript+' ';
    liveTranscript=(liveTranscript+' '+text).trim().replace(/\s+/g,' ');
    const el=document.querySelector('#liveTranscript'); if(el) el.textContent=liveTranscript||'Listening…';
  };
  speechRecognition.onerror=()=>{};
  try{speechRecognition.start();return true;}catch{return false;}
}
function stopSpeech(){if(speechRecognition){try{speechRecognition.stop();}catch{} speechRecognition=null;}}
async function startRecorder(){
  if(!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) return false;
  try{
    recorderStream=await navigator.mediaDevices.getUserMedia({audio:true});
    recorderChunks=[]; recorder=new MediaRecorder(recorderStream);
    recorder.ondataavailable=e=>{if(e.data.size)recorderChunks.push(e.data);};
    recorder.start(); return true;
  }catch{return false;}
}
function stopRecorder(){return new Promise(resolve=>{
  if(!recorder){resolve(null);return;}
  recorder.onstop=()=>{
    const blob=new Blob(recorderChunks,{type:recorder.mimeType||'audio/webm'});
    recorderStream?.getTracks().forEach(t=>t.stop()); recorder=null; recorderStream=null; recorderChunks=[]; resolve(blob);
  };
  try{recorder.stop();}catch{resolve(null);}
});}
function countFillerWords(text){
  const t=(text||'').toLowerCase();
  const terms=['um','uh','like','you know','actually','basically','so'];
  return terms.reduce((n,w)=>n+(t.match(new RegExp('\\b'+w.replace(/ /g,'\\s+')+'\\b','g'))||[]).length,0);
}
function performanceAdvice(p,q){
  const target=q.seconds||60; const ratio=p.duration/target; const tips=[];
  if(ratio<0.45) tips.push('Your answer was quite short. Make sure you answered the question and gave one concrete reason or example.');
  else if(ratio>1.55) tips.push('Your answer ran long. Lead with the main point, then give only the supporting details the interviewer needs.');
  else tips.push('Your answer length was within a useful interview range.');
  if(p.fillerWords>=6) tips.push(`You logged ${p.fillerWords} possible filler words. Pause instead of filling silence when you need to think.`);
  if(p.selfRating<=2) tips.push('This is a practice target. Rehearse from the recall map rather than memorizing the full model answer.');
  if(p.selfRating>=4) tips.push('Strong self-rating. Try the same question again with fewer notes to build automatic recall.');
  return tips;
}
function recordPerformance(q,mode,duration,selfRating,transcript){
  updateStreak();
  const p={id:'p'+Date.now(),date:new Date().toISOString(),questionId:q.id,category:q.category,mode,duration,target:q.seconds||60,selfRating:Number(selfRating||0),fillerWords:countFillerWords(transcript),transcript:(transcript||'').slice(0,1800)};
  state.performances.unshift(p); state.performances=state.performances.slice(0,100);
  state.completed[q.id]=true; if(selfRating)state.ratings[q.id]=Number(selfRating);
  phase4Save(); return p;
}
function readinessScore(){
  const ratings=Object.values(state.ratings).map(Number).filter(Boolean);
  const avg=ratings.length?ratings.reduce((a,b)=>a+b,0)/ratings.length:0;
  const coverage=db.questions.length?Object.values(state.completed).filter(Boolean).length/db.questions.length:0;
  const perf=state.performances||[];
  const recent=perf.slice(0,12);
  const timing=recent.length?recent.filter(p=>p.duration>=p.target*.45&&p.duration<=p.target*1.55).length/recent.length:0;
  return Math.round((avg/5)*55+coverage*25+timing*20);
}
function categoryAnalytics(){
  return db.categories.map(c=>{
    const qs=db.questions.filter(q=>q.category===c.id), ps=(state.performances||[]).filter(p=>p.category===c.id);
    const rated=qs.map(q=>Number(state.ratings[q.id]||0)).filter(Boolean);
    const avg=rated.length?rated.reduce((a,b)=>a+b,0)/rated.length:0;
    const ready=qs.filter(q=>Number(state.ratings[q.id])>=4).length;
    const practiced=qs.filter(q=>state.completed[q.id]).length;
    const recent=ps.slice(0,8); const onTime=recent.length?recent.filter(p=>p.duration>=p.target*.45&&p.duration<=p.target*1.55).length/recent.length:0;
    return {...c,total:qs.length,ready,practiced,avg,onTime};
  });
}
function weakCategories(){return categoryAnalytics().sort((a,b)=>((a.avg||0)-(b.avg||0))).slice(0,3);}

function renderProgress(){
  const total=db.questions.length, done=Object.values(state.completed).filter(Boolean).length, ready=Object.values(state.ratings).filter(v=>v>=4).length;
  const score=readinessScore(), streak=state.streak.days?.length||0, perf=state.performances||[];
  const cats=categoryAnalytics(), weak=weakCategories(), recent=perf.slice(0,6);
  const scoreLabel=score>=85?'INTERVIEW READY':score>=70?'STRONG FOUNDATION':score>=50?'BUILDING CONFIDENCE':'START REHEARSING';
  view.innerHTML=`<div class="module-head"><div><div class="eyebrow">▶ STARGAZER PERFORMANCE LAB</div><h2>PROGRESS</h2><p>Your rehearsal analytics stay on this device. Voice recordings are not uploaded or stored by this app.</p></div><button class="pixel-btn" id="reset">RESET LOCAL DATA</button></div>
  <div class="readiness-card"><div class="readiness-flower">✿</div><div><div class="eyebrow">STARGAZER READINESS</div><strong>${score}</strong><span>/ 100</span><b>${scoreLabel}</b><p>${weak.length?`Next focus: ${weak[0].name}.`: 'Complete a rehearsal to unlock targeted recommendations.'}</p></div></div>
  <div class="progress-hero"><div><b>${done}</b><span>REHEARSED</span></div><div><b>${ready}</b><span>READY ★★★★+</span></div><div><b>${streak}</b><span>ACTIVE DAYS</span></div><div><b>${perf.length}</b><span>PERFORMANCES</span></div></div>
  <div class="analytics-grid"><section class="analytics-panel"><h3>✦ CATEGORY READINESS</h3>${cats.map(c=>`<div class="analytics-row"><div class="analytics-name"><span>${c.icon} ${esc(c.name)}</span><small>${c.practiced}/${c.total} practiced • avg ${c.avg?c.avg.toFixed(1):'—'}</small></div><div class="bar"><i style="width:${c.total?Math.round(c.ready/c.total*100):0}%"></i></div><b>${c.total?Math.round(c.ready/c.total*100):0}%</b></div>`).join('')}</section><section class="analytics-panel"><h3>⚠ NEXT TARGETS</h3>${weak.map((c,i)=>`<article class="target-card"><span>0${i+1}</span><div><b>${c.icon} ${esc(c.name)}</b><small>${c.avg?`Average readiness ${c.avg.toFixed(1)}/5`:'No rating yet'}</small><button class="mini-btn" data-focus="${c.id}">PRACTICE</button></div></article>`).join('')}</section></div>
  <section class="analytics-panel"><h3>🎙 RECENT PERFORMANCE</h3>${recent.length?recent.map(p=>{const q=getQ(p.questionId);return `<div class="performance-row"><div><b>${esc(q?.question||p.questionId)}</b><small>${new Date(p.date).toLocaleString()} • ${esc(p.mode)}</small></div><span>${phase4FormatSeconds(p.duration)} / ${phase4FormatSeconds(p.target)}</span><strong>${p.selfRating||'—'}/5</strong><em>${p.fillerWords} fillers</em></div>`}).join(''):'<p class="empty-copy">No voice/performance sessions yet. Start a rehearsal in Mock Interview and use PERFORMANCE MODE.</p>'}</section>
  <section class="analytics-panel"><h3>💡 STARGAZER COACH</h3><div class="coach-grid">${coachTips(score,weak,perf).map(t=>`<div class="coach-tip">${t}</div>`).join('')}</div></section>
  <div class="session-log"><h3>RECENT RUNS</h3>${(state.sessions||[]).slice(0,6).map(s=>`<div><span>${new Date(s.date).toLocaleDateString()}</span><b>${esc((s.mode||'standard').toUpperCase())}</b><span>${s.count} questions</span></div>`).join('')||'<p>No completed runs yet.</p>'}</div>`;
  view.querySelector('#reset').addEventListener('click',()=>{if(confirm('Reset all local rehearsal data, ratings, sessions, and performance analytics?')){state=phase4DefaultState();phase4Save();renderProgress();}});
  view.querySelectorAll('[data-focus]').forEach(b=>b.addEventListener('click',()=>renderPractice(b.dataset.focus,'')));
}
function coachTips(score,weak,perf){
  const tips=[];
  if(score<50) tips.push('🌱 Start with 5–10 core questions. Build consistency before chasing perfect answers.');
  else if(score<75) tips.push('🌿 You have a foundation. Spend your next session on your weakest category rather than repeating only comfortable questions.');
  else tips.push('🌸 Your readiness is strong. Shift toward pressure runs and answering without looking at the model response.');
  if(weak[0]) tips.push(`⚔ Your current training target is <b>${esc(weak[0].name)}</b>. Practice three questions from this category today.`);
  if(perf.length&&perf.slice(0,8).filter(p=>p.fillerWords>=6).length>=3) tips.push('🎙 You are logging frequent filler words. Try a one-breath pause before difficult questions.');
  if(perf.length&&perf.slice(0,8).filter(p=>p.duration>p.target*1.55).length>=3) tips.push('⏱ Several recent answers ran long. Practice giving your main point in the first 15 seconds.');
  if(!perf.length) tips.push('🎙 Turn on Performance Mode in a mock interview to start measuring answer length and optional transcript-based filler words.');
  return tips.slice(0,4);
}

function performanceControls(q,mode,index,ids){
  let revealed=false, recording=false, recordingStarted=false, localBlob=null;
  liveTranscript=''; answerElapsed=0;
  view.innerHTML=`<div class="mock-progress"><span>QUESTION ${index+1} / ${ids.length}</span><span>${cat(q.category).icon} ${esc(cat(q.category).name)}</span><span>🎙 PERFORMANCE</span></div>
  <div class="interview-console performance-console ${mode}"><div class="interviewer-avatar"><div class="avatar-flower">✿</div><span>INTERVIEWER</span></div><div class="timer-box" id="answerClock">0:00</div><div class="mock-screen"><div class="eyebrow">▶ PERFORMANCE MODE</div><h2>${esc(q.question)}</h2><div class="mock-prompt">Answer aloud. The app measures time locally. Optional speech recognition creates a temporary transcript for filler-word feedback.</div>
  <div class="performance-status" id="performanceStatus">READY — PRESS RECORD WHEN YOU ARE READY.</div>
  <div class="mock-actions"><button class="pixel-btn primary" id="recordBtn">● START RECORDING</button><button class="pixel-btn" id="transcriptBtn">${state.preferences.transcript?'TRANSCRIPT ON':'TRANSCRIPT OFF'}</button><button class="pixel-btn" id="revealPerf">REVEAL NOTES</button></div>
  <div class="live-transcript" id="liveTranscript">${hasSpeech()&&state.preferences.transcript?'Transcript will appear here while you speak.':'Speech recognition is not available in this browser.'}</div>
  <div class="timer-note">TARGET ${q.seconds} SECONDS • YOUR VOICE STAYS LOCAL</div>
  <div id="perfNotes" class="mock-answer"><div class="answer-label">RECALL MAP</div><div class="recall-large">${q.keywords.map(k=>`<span>${esc(k)}</span>`).join('')}</div><p>${esc(q.answer)}</p></div>
  <div id="performanceReview" class="performance-review" hidden><h3>✦ PERFORMANCE CHECK</h3><div id="performanceFeedback"></div><label>HOW READY DID THAT FEEL?</label><div class="rating-row">${[1,2,3,4,5].map(n=>`<button class="rating" data-performance-rate="${n}">${n}</button>`).join('')}</div><div class="mock-nav"><button class="complete-btn" id="performanceNext">${index===ids.length-1?'FINISH PERFORMANCE RUN':'NEXT QUESTION →'}</button></div></div>
  </div></div>`;
  const status=document.querySelector('#performanceStatus'); const recordBtn=document.querySelector('#recordBtn');
  document.querySelector('#transcriptBtn').addEventListener('click',()=>{state.preferences.transcript=!state.preferences.transcript;phase4Save();document.querySelector('#transcriptBtn').textContent=state.preferences.transcript?'TRANSCRIPT ON':'TRANSCRIPT OFF';});
  document.querySelector('#revealPerf').addEventListener('click',()=>{revealed=!revealed;document.querySelector('#perfNotes').hidden=!revealed;});
  recordBtn.addEventListener('click',async()=>{
    if(recording){
      recording=false; const duration=phase4StopClock(); stopSpeech(); localBlob=await stopRecorder();
      recordBtn.textContent='● RECORD AGAIN'; status.textContent=`RECORDED ${phase4FormatSeconds(duration)} — REVIEW YOUR ANSWER.`; 
      document.querySelector('#performanceReview').hidden=false;
      currentPerformance={duration,blob:localBlob,transcript:liveTranscript};
      const feedback=performanceAdvice({duration,fillerWords:countFillerWords(liveTranscript),selfRating:0},q).map(x=>`<p>• ${x}</p>`).join('');document.querySelector('#performanceFeedback').innerHTML=feedback;
      return;
    }
    recording=true; liveTranscript=''; answerElapsed=0; phase4StartClock();
    const audioOK=await startRecorder(); const speechOK=state.preferences.transcript?startSpeech():false;
    recordingStarted=true; recordBtn.textContent='■ STOP & REVIEW'; status.textContent=`RECORDING${audioOK?' • AUDIO CAPTURED LOCALLY':''}${speechOK?' • TRANSCRIPTING':''}`;
    if(!audioOK) status.textContent+=' • MICROPHONE RECORDING UNAVAILABLE — TIMER STILL ACTIVE';
  });
  document.querySelectorAll('[data-performance-rate]').forEach(b=>b.addEventListener('click',()=>{
    const rating=Number(b.dataset.performanceRate); const duration=currentPerformance?.duration||phase4StopClock();
    document.querySelectorAll('[data-performance-rate]').forEach(x=>x.classList.remove('set')); b.classList.add('set');
    const p=recordPerformance(q,mode,duration,rating,currentPerformance?.transcript||liveTranscript); currentPerformance={...currentPerformance,...p,selfRating:rating};
    document.querySelector('#performanceFeedback').innerHTML=performanceAdvice(p,q).map(x=>`<p>• ${x}</p>`).join('');
  }));
  document.querySelector('#performanceNext').addEventListener('click',()=>{if(!currentPerformance?.selfRating){alert('Choose a readiness rating first.');return;}phase4StopTimer();runInterview(ids,mode,index+1);});
}
function runInterview(ids,mode,index){
  if(index>=ids.length){finishMock(ids,mode);return;}
  const q=getQ(ids[index]);
  if(window.__performanceMode){performanceControls(q,mode,index,ids);return;}
  let remaining=q.seconds; let revealed=false;
  state.resume={ids,index,mode,modeLabel:mode==='pressure'?'PRESSURE RUN':mode==='boss'?'BOSS ROOM':'STANDARD RUN'}; phase4Save();
  const chainNext=(PRESSURE_CHAINS[q.id]||[]).some(id=>ids.includes(id));
  view.innerHTML=`<div class="mock-progress"><span>QUESTION ${index+1} / ${ids.length}</span><span>${cat(q.category).icon} ${esc(cat(q.category).name)}</span><span>${mode==='pressure'?'⚔ PRESSURE':mode==='boss'?'★ BOSS':'◆ STANDARD'}</span></div><div class="interview-console ${mode}"><div class="interviewer-avatar"><div class="avatar-flower">✿</div><span>INTERVIEWER</span></div><div class="timer-box" id="timer">${formatTime(remaining)}</div><div class="mock-screen"><div class="eyebrow">▶ ${mode==='pressure'?'FOLLOW-UP PRESSURE':'INTERVIEWER'}</div><h2>${esc(q.question)}</h2><div class="mock-prompt">${chainNext?'This answer may trigger a follow-up. Stay calm and answer the question you were actually asked.':'Take a breath. Answer aloud before revealing your notes.'}</div><div class="mock-actions"><button class="pixel-btn primary" id="startTimer">START TIMER</button><button class="pixel-btn" id="performanceBtn">🎙 PERFORMANCE MODE</button><button class="pixel-btn" id="revealMock">REVEAL NOTES</button><button class="pixel-btn" id="skipMock">SKIP</button></div><div class="timer-note">TARGET ${q.seconds} SECONDS • ${q.seconds<=45?'CONCISE':'STRUCTURED'} ANSWER</div><div id="mockAnswer" class="mock-answer"><div class="answer-label">YOUR RECALL MAP</div><div class="recall-large">${q.keywords.map(k=>`<span>${esc(k)}</span>`).join('')}</div><p>${esc(q.answer)}</p><div class="answer-reflection"><label>HOW DID THAT ANSWER FEEL?</label><div>${[1,2,3,4,5].map(n=>`<button class="rating ${state.ratings[q.id]>=n?'set':''}" data-mock-rate="${n}">${n}</button>`).join('')}</div></div><div class="mock-nav"><button class="complete-btn" id="mockDone">${index===ids.length-1?'FINISH RUN':'NEXT QUESTION →'}</button></div></div></div></div>`;
  const timerEl=view.querySelector('#timer');
  function tick(){remaining--;timerEl.textContent=formatTime(Math.max(0,remaining));timerEl.classList.toggle('danger',remaining<=10);if(remaining<=0){clearTimer();timerEl.textContent='00:00';}}
  view.querySelector('#startTimer').addEventListener('click',e=>{if(activeTimer)return;e.currentTarget.textContent='TIMER RUNNING';activeTimer=setInterval(tick,1000);});
  view.querySelector('#performanceBtn').addEventListener('click',()=>{window.__performanceMode=true;clearTimer();performanceControls(q,mode,index,ids);});
  view.querySelector('#revealMock').addEventListener('click',()=>{revealed=!revealed;view.querySelector('#mockAnswer').classList.toggle('show',revealed);});
  view.querySelector('#skipMock').addEventListener('click',()=>runInterview(ids,mode,index+1));
  view.querySelector('#mockDone').addEventListener('click',()=>{clearTimer();state.completed[q.id]=true;phase4Save();runInterview(ids,mode,index+1);});
  view.querySelectorAll('[data-mock-rate]').forEach(b=>b.addEventListener('click',()=>{state.ratings[q.id]=Number(b.dataset.mockRate);phase4Save();view.querySelectorAll('[data-mock-rate]').forEach(x=>x.classList.toggle('set',Number(x.dataset.mockRate)<=state.ratings[q.id]));}));
}
function finishMock(ids,mode){
  clearTimer(); window.__performanceMode=false; const done=ids.filter(id=>state.completed[id]).length;
  state.resume=null; state.sessions=state.sessions||[]; state.sessions.unshift({date:new Date().toISOString(),mode,count:ids.length,completed:done,score:readinessScore()}); state.sessions=state.sessions.slice(0,30); phase4Save();
  view.innerHTML=`<div class="finish-card"><div class="pixel-heart">✿</div><div class="eyebrow">▶ SAVE POINT REACHED</div><h2>${mode==='boss'?'BOSS ROOM CLEARED':mode==='pressure'?'PRESSURE RUN COMPLETE':'RUN COMPLETE'}</h2><p>You completed a ${mode==='boss'?'Boss Room':mode==='pressure'?'Pressure':'standard'} run. Your overall Stargazer readiness is now <b>${readinessScore()}/100</b>.</p><div class="finish-stats"><div><b>${ids.length}</b><span>QUESTIONS</span></div><div><b>${ids.filter(id=>state.ratings[id]>=4).length}</b><span>READY ★★★★+</span></div><div><b>${state.performances?.filter(p=>ids.includes(p.questionId)).length||0}</b><span>PERFORMANCES</span></div></div><button class="pixel-btn primary" data-route="progress">VIEW ANALYTICS</button><button class="pixel-btn" data-route="mock">RUN AGAIN</button></div>`;wireRoutes();
}

/* Phase 4 mock launcher: preserve Phase 3 choices, add performance runs. */
function renderMock(){
  const resume=state.resume;
  view.innerHTML=`<div class="module-head"><div><div class="eyebrow">▶ SIMULATION ROOM</div><h2>MOCK INTERVIEW</h2><p>Choose your run. Performance Mode adds private timing, optional transcript-based filler analysis, and a self-rating loop.</p></div><div class="story-badge">🎙 PERFORMANCE LAB</div></div>
  ${resume?`<div class="resume-banner"><div><b>✦ SAVED RUN</b><span>${esc(resume.modeLabel)} • QUESTION ${resume.index+1}/${resume.ids.length}</span></div><button class="pixel-btn primary" id="resumeRun">RESUME RUN</button><button class="pixel-btn" id="discardRun">DISCARD</button></div>`:''}
  <div class="mode-grid"><button class="mode-card" data-length="10" data-mode="standard"><b>10</b><span>QUICK RUN</span><small>Warm-up + key risks</small></button><button class="mode-card" data-length="15" data-mode="standard"><b>15</b><span>STANDARD RUN</span><small>Balanced interview</small></button><button class="mode-card" data-length="30" data-mode="standard"><b>30</b><span>FULL INTERVIEW</span><small>Deep rehearsal</small></button><button class="mode-card pressure" data-length="8" data-mode="pressure"><b>⚔</b><span>PRESSURE RUN</span><small>Follow-up chains + pushback</small></button><button class="mode-card boss" data-mode="boss"><b>★</b><span>BOSS ROOM</span><small>Highest-risk questions</small></button><button class="mode-card performance" data-length="10" data-mode="performance"><b>🎙</b><span>PERFORMANCE RUN</span><small>Voice + timing + analytics</small></button></div>
  <div class="game-rules"><div><b>🎙 VOICE</b><span>Audio stays local and is discarded after review.</span></div><div><b>⏱ TIMING</b><span>Measure your answer against the target.</span></div><div><b>📈 FEEDBACK</b><span>Rate yourself and build readiness.</span></div><div><b>💾 SAVE</b><span>Sessions and analytics persist locally.</span></div></div>`;
  view.querySelectorAll('[data-length]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.mode==='performance'){window.__performanceMode=true;}else window.__performanceMode=false;startMock(Number(b.dataset.length),b.dataset.mode==='performance'?'standard':b.dataset.mode);}));
  view.querySelector('[data-mode="boss"]')?.addEventListener('click',()=>{window.__performanceMode=false;startMock(10,'boss');});
  view.querySelector('#resumeRun')?.addEventListener('click',()=>{window.__performanceMode=false;startInterview(state.resume.ids,state.resume.mode,state.resume.index);});
  view.querySelector('#discardRun')?.addEventListener('click',()=>{state.resume=null;phase4Save();renderMock();});
}

/* Upgrade regular starts to persist the performance preference. */
function startMock(n,mode='standard'){const qs=pickQuestions(n,mode);startInterview(qs.map(q=>q.id),mode,0);}

init();
