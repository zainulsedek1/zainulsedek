/* SAH. — app logic. Vanilla JS, data stays on the phone (localStorage). */
'use strict';

/* ================= helpers ================= */
const KEY = 'sah.v1';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const ds = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return ds(d); };
const diff = (a, b) => Math.round((parse(b) - parse(a)) / 864e5);
const Q = new URLSearchParams(location.search);
const DEV_DATE = Q.get('date'), DEV_T = Q.get('t');
const now = () => {
  const n = new Date();
  if (!DEV_DATE) return n;
  const d = parse(DEV_DATE);
  if (DEV_T) d.setHours(+DEV_T.slice(0, 2), +DEV_T.slice(2, 4)); else d.setHours(n.getHours(), n.getMinutes(), n.getSeconds());
  return d;
};
const today = () => ds(now());
const dow = s => { const d = parse(s).getDay(); return d === 0 ? 7 : d; };
const DOW = ['', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const fmtDay = s => `${DOW[dow(s)]} ${parse(s).getDate()} ${MON[parse(s).getMonth()]}`;
const fmtDM = s => `${parse(s).getDate()} ${MON[parse(s).getMonth()]}`;
const mmss = sec => { sec = Math.max(0, Math.ceil(sec)); return `${Math.floor(sec / 60)}:${pad(sec % 60)}`; };
const toMin = hm => { const [h, m] = hm.split(':').map(Number); return h * 60 + m; };
const hrs = h => `${Math.floor(h)}H ${pad(Math.round((h % 1) * 60))}M`;
const r1 = n => Math.round(n * 10) / 10;
const round5 = n => Math.round(n / 5) * 5;
const pick = (arr, seed) => arr[Math.abs(seed) % arr.length];

const I = {
  today: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/>',
  plan: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  fuel: '<path d="M3 11h18a9 9 0 0 1-18 0zM8 7c0-2 2-2 2-4M13 7c0-2 2-2 2-4"/>',
  sleep: '<path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z"/>',
  you: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
  check: '<path d="M5 12.5 10 17 19 7"/>',
  play: '<path d="M7 4v16l13-8z" fill="currentColor" stroke="none"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  down: '<path d="M12 4v12M6 11l6 6 6-6M4 20h16"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  share: '<path d="M12 3v13M7 8l5-5 5 5M5 14v5h14v-5"/>',
};
const ic = (n, sw = 2.2) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n]}</svg>`;

/* ================= state ================= */
const blank = () => ({ v: 1, profile: null, days: {}, weights: [], waists: [], logs: {}, active: null, ui: {} });
let S;
try { S = Object.assign(blank(), JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) { S = blank(); }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('Storage full or blocked'); } };
const day = d => (S.days[d] ||= { checks: {}, protein: 0, water: 0, pl: [], wind: [] });
const peek = d => S.days[d] || { checks: {}, protein: 0, water: 0, pl: [], wind: [] };

/* ================= program ================= */
const weekOf = d => Math.floor(diff(PLAN.start, d) / 7) + 1;
const phaseOf = d => PHASES.find(p => d >= p.from && d <= p.to) || null;
function sessionId(d) {
  if (d < PLAN.start) return 'PRE';
  if (d === PLAN.wedding) return 'SAH';
  if (d > PLAN.wedding) return 'DONE';
  const w = weekOf(d), x = dow(d);
  if (w <= 2) { const a = w === 1; return [null, a ? 'FB_A' : 'FB_B', 'ZONE2', a ? 'FB_B' : 'FB_A', 'ZONE2', a ? 'FB_A' : 'FB_B', 'ACTIVE', 'CHECKIN'][x]; }
  if (w <= 10) return [null, 'UPPER_A', 'LOWER_A', 'ENGINE', 'UPPER_B', 'LOWER_B', 'ACTIVE', 'CHECKIN'][x];
  return [null, 'READY_A', 'READY_B', 'WALK', 'REST', 'REST', 'SAH', 'REST'][x];
}
function build(d, wid = sessionId(d)) {
  const W = WORKOUTS[wid];
  const ph = phaseOf(d) || PHASES[0];
  const sets = SETS[ph.id];
  const blocks = [];
  if (W.cardio) {
    let segs = W.cardio.segments;
    if (!segs) { // ENGINE intervals
      const rounds = ph.id === 'push' ? 10 : 8;
      segs = [{ label: 'WARM UP', secs: 300, hard: false }];
      for (let i = 0; i < rounds; i++) segs.push({ label: 'HARD', secs: 30, hard: true }, { label: 'EASY', secs: 90, hard: false });
      segs.push({ label: 'COOL DOWN', secs: 300, hard: false });
    }
    blocks.push({ k: 'cardio', label: W.cardio.label, note: W.cardio.note, segs });
  }
  (W.items || []).forEach(([id, t, reps]) => blocks.push({ k: 'ex', id, sets: sets[t], reps, main: t === 'M' }));
  if (ph.id === 'push' && ['UPPER_A', 'UPPER_B', 'LOWER_B'].includes(wid)) {
    blocks.push({ k: 'cardio', label: 'Finisher: Incline Walk', note: '10–12% incline, ~5 km/h. Steady breathing. This is fat-loss work, not a sprint.', segs: [{ label: 'FINISHER', secs: 600, hard: false }] });
  }
  const totalSecs = blocks.filter(b => b.k === 'cardio').reduce((a, b) => a + b.segs.reduce((x, s) => x + s.secs, 0), 0);
  return { wid, ...W, phase: ph, rir: ph.rir, blocks, cardioMins: Math.round(totalSecs / 60) };
}
const isTrain = W => W.type === 'lift' || W.type === 'cardio';
const range = r => { const m = String(r).match(/(\d+)\D+(\d+)/); return m ? [+m[1], +m[2]] : [+r, +r]; };

/* ================= targets ================= */
function curWeight() {
  const w = S.weights.slice().sort((a, b) => a.d < b.d ? -1 : 1);
  if (!w.length) return S.profile?.w0 || 0;
  const last = w[w.length - 1].d;
  const recent = w.filter(x => diff(x.d, last) < 7);
  return recent.reduce((a, x) => a + x.kg, 0) / recent.length;
}
function targets() {
  const p = S.profile; if (!p) return null;
  const w = curWeight();
  const bmr = 10 * w + 6.25 * p.h - 5 * p.age + (p.sex === 'f' ? -161 : 5);
  const tdee = bmr * 1.55;
  const floor = p.sex === 'f' ? 1300 : 1600;
  const kcal = Math.max(floor, Math.round((tdee - 600) / 50) * 50);
  const protein = round5(2.0 * w);
  const fat = round5(0.8 * w);
  const carbs = Math.max(0, round5((kcal - protein * 4 - fat * 9) / 4));
  return { w, bmr: Math.round(bmr), tdee: Math.round(tdee / 10) * 10, kcal, protein, fat, carbs };
}

/* ================= prayer times (JAKIM method, calculated on-device) ================= */
const prayerCache = {};
function prayers(dstr) {
  if (prayerCache[dstr]) return prayerCache[dstr];
  const { lat, lng, tz } = PLAN.loc;
  const R = Math.PI / 180;
  const sin = x => Math.sin(x * R), cos = x => Math.cos(x * R), tan = x => Math.tan(x * R);
  const asin = x => Math.asin(x) / R, acos = x => Math.acos(Math.max(-1, Math.min(1, x))) / R;
  const atan2 = (y, x) => Math.atan2(y, x) / R, acot = x => Math.atan(1 / x) / R;
  const fix = (a, b) => { a = a - b * Math.floor(a / b); return a < 0 ? a + b : a; };
  const dt = parse(dstr);
  let y = dt.getFullYear(), m = dt.getMonth() + 1; const d = dt.getDate();
  if (m <= 2) { y -= 1; m += 12; }
  const A = Math.floor(y / 100), B = 2 - A + Math.floor(A / 4);
  const jd0 = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + B - 1524.5 - lng / (15 * 24);
  const sun = jd => {
    const D = jd - 2451545.0;
    const g = fix(357.529 + 0.98560028 * D, 360), q = fix(280.459 + 0.98564736 * D, 360);
    const L = fix(q + 1.915 * sin(g) + 0.020 * sin(2 * g), 360), e = 23.439 - 0.00000036 * D;
    const RA = fix(atan2(cos(e) * sin(L), cos(L)) / 15, 24);
    return { decl: asin(sin(e) * sin(L)), eqt: q / 15 - RA };
  };
  const mid = t => fix(12 - sun(jd0 + t).eqt, 24);
  const at = (ang, t, ccw) => { const dc = sun(jd0 + t).decl; const T = acos((-sin(ang) - sin(dc) * sin(lat)) / (cos(dc) * cos(lat))) / 15; return mid(t) + (ccw ? -T : T); };
  const asr = (f, t) => { const dc = sun(jd0 + t).decl; return at(-acot(f + tan(Math.abs(lat - dc))), t); };
  const raw = { subuh: at(18, 5 / 24, true), syuruk: at(0.833, 6 / 24, true), zohor: mid(0.5), asar: asr(1, 13 / 24), maghrib: at(0.833, 18 / 24), isyak: at(18, 18 / 24) };
  const ihtiyat = { subuh: 1, syuruk: -2, zohor: 2, asar: 1, maghrib: 0, isyak: 0 };
  const out = {};
  for (const k in raw) { const mins = Math.ceil((raw[k] + tz - lng / 15) * 60 + ihtiyat[k]); out[k] = `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`; }
  return (prayerCache[dstr] = out);
}

/* ================= daily checks ================= */
function sleepH(d) { const s = peek(d).sleep; return s ? s.h : null; }
function workoutDone(d) { return !!peek(d).workout; }
function checkState(d) {
  const D = peek(d), T = targets() || { protein: 0 }, W = WORKOUTS[sessionId(d)];
  const restDay = !isTrain(W);
  return {
    sleep: (sleepH(d) ?? 0) >= 7 || !!D.checks.sleep,
    train: workoutDone(d) || !!D.checks.train || restDay,
    protein: (T.protein && D.protein >= T.protein) || !!D.checks.protein,
    water: D.water >= 6 || !!D.checks.water,
    steps: !!D.checks.steps,
    nosugar: !!D.checks.nosugar,
  };
}
const score = d => Object.values(checkState(d)).filter(Boolean).length;
function streak() {
  const t = today(); let d = score(t) >= 4 ? t : addDays(t, -1); let n = 0;
  const first = S.profile?.d0 || t;
  while (d >= first && score(d) >= 4) { n++; d = addDays(d, -1); }
  return n;
}

/* ================= timeline ================= */
const hm = m => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
function gymTimes(d) {
  // Leave after Subuh (min 06:05); Subuh drifts from ~05:48 (Nov) to ~06:15 (Jan).
  const leave = Math.max(toMin('06:05'), Math.ceil((toMin(prayers(d).subuh) + 15) / 5) * 5);
  const train = leave + 10;
  return { leave: hm(leave), train: hm(train), breakfast: hm(Math.min(train + 65, toMin('07:45'))) };
}
const ampm = t => { const [h, m] = t.split(':').map(Number); return `${h % 12 || 12}:${pad(m)} ${h < 12 ? 'AM' : 'PM'}`; };
function timeline(d) {
  const P = prayers(d), W = WORKOUTS[sessionId(d)], wkend = dow(d) >= 6, items = [];
  const add = (t, n, s, k) => items.push({ t, n, s, k });
  add('05:30', 'Wake up', 'Same time every day. Glass of water.', 'sleep');
  add(P.subuh, 'Subuh', '', 'prayer');
  if (!wkend) {
    add('05:40', 'Weigh in', 'After the toilet, before food.', 'me');
    const g = gymTimes(d);
    if (isTrain(W)) { add(g.leave, 'Head to the gym', 'Anytime Fitness · Plaza Shah Alam', 'gym'); add(g.train, `Train · ${W.short}`, `~${W.mins} min`, 'gym'); }
    else add(g.train, 'Morning walk', '15–20 min outside. Daylight resets your body clock.', 'gym');
    add(g.breakfast, 'Breakfast', 'Protein first.', 'meal');
    add('08:10', 'Leave for work', '~40 min to Ara Damansara', 'work');
    add('09:00', 'Work', 'Stand up every hour. Refill your bottle.', 'work');
    add('12:30', 'Lunchbox', 'Mum\'s lauk · 1 cup rice · half sayur', 'meal');
    add('16:00', 'Snack + walk', 'Yogurt, eggs or fruit', 'meal');
    add('18:00', 'Head home', '', 'work');
  } else {
    add('07:00', dow(d) === 7 ? 'Check-in' : 'Move', dow(d) === 7 ? 'Weight, waist, progress photo' : '30–45 min walk, badminton or swim', 'gym');
    add('08:00', 'Breakfast', 'Protein first.', 'meal');
    add('13:00', 'Lunch', '1 cup rice · protein · sayur', 'meal');
    add('16:30', 'Snack', 'Fruit, yogurt or eggs', 'meal');
  }
  add(P.zohor, 'Zohor', '', 'prayer'); add(P.asar, 'Asar', '', 'prayer'); add(P.maghrib, 'Maghrib', '', 'prayer');
  add('19:30', 'Dinner', '½ cup rice · protein · sayur', 'meal');
  add(P.isyak, 'Isyak', '', 'prayer');
  add('21:45', 'Wind down', 'Phone out of the bedroom. Lights dim.', 'sleep');
  add('22:30', 'Lights out', '7 hours starts now.', 'sleep');
  return items.sort((a, b) => toMin(a.t) - toMin(b.t));
}

/* ================= UI shell ================= */
const main = () => $('#main');
let deferredInstall = null;
function toast(msg) {
  let t = $('#toast'); if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 1800);
}
function buzz(p = 30) { try { navigator.vibrate && navigator.vibrate(p); } catch (e) { } }
let actx;
function beep(n = 1) {
  try {
    actx ||= new (window.AudioContext || window.webkitAudioContext)();
    for (let i = 0; i < n; i++) {
      const o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime + i * 0.22;
      o.frequency.value = 880; o.type = 'square'; g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.25, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      o.connect(g).connect(actx.destination); o.start(t); o.stop(t + 0.18);
    }
  } catch (e) { }
}
let wakeLock = null;
async function keepAwake(on) {
  try {
    if (on && 'wakeLock' in navigator && !wakeLock) { wakeLock = await navigator.wakeLock.request('screen'); wakeLock.addEventListener('release', () => wakeLock = null); }
    if (!on && wakeLock) { await wakeLock.release(); wakeLock = null; }
  } catch (e) { }
}

const TABS = [['today', 'TODAY'], ['plan', 'PLAN'], ['fuel', 'FUEL'], ['sleep', 'SLEEP'], ['you', 'YOU']];
function tabbar(cur) {
  return `<div class="tabbar"><nav>${TABS.map(([k, l]) => `<a href="#${k}" class="${k === cur ? 'on' : ''}">${ic(k)}<span>${l}</span></a>`).join('')}</nav></div>`;
}
const hdr = (title) => `<div class="top"><div class="brand">SAH<b>.</b></div><div class="row">${deferredInstall ? `<button class="chip volt" data-a="install">${ic('down')} INSTALL</button>` : ''}<span class="eyebrow">${esc(title || fmtDay(today()))}</span></div></div>`;

/* ================= views ================= */
function vOnboard() {
  const left = Math.max(0, diff(today(), PLAN.wedding));
  const p = S.ui.onb || { sex: '' };
  return `<div class="onb fade">
    <div class="top"><div class="brand">SAH<b>.</b></div><span class="eyebrow">NIKAH · 23 JAN 2027</span></div>
    <div class="hero-o"><p class="d xxl num">${left}</p><p class="d l">DAYS TO SAH.</p>
    <p class="mute" style="margin-top:14px;max-width:34ch">11 weeks. One plan. Science-backed training, Mak's cooking, 7 hours of sleep. Let's set your numbers.</p></div>
    <div class="stack" style="margin-top:28px">
      <div class="field"><span>Sex (for the calorie formula)</span><div class="seg">
        <button data-a="onbsex" data-v="m" class="${p.sex === 'm' ? 'on' : ''}">Male</button><button data-a="onbsex" data-v="f" class="${p.sex === 'f' ? 'on' : ''}">Female</button></div></div>
      <div class="grid3">
        <label class="field"><span>Age</span><input class="input" id="o-age" inputmode="numeric" placeholder="yrs" value="${esc(p.age || '')}"></label>
        <label class="field"><span>Height cm</span><input class="input" id="o-h" inputmode="decimal" placeholder="cm" value="${esc(p.h || '')}"></label>
        <label class="field"><span>Weight kg</span><input class="input" id="o-w" inputmode="decimal" placeholder="kg" value="${esc(p.w || '')}"></label>
      </div>
      <button class="btn" data-a="onbgo" style="margin-top:18px">SET MY TARGETS</button>
      <p class="tiny dim">Your data stays on this phone. No account, no server.</p>
    </div></div>`;
}

function vWelcome() {
  const T = targets();
  return `<div class="fade">${hdr('YOUR TARGETS')}
    <p class="eyebrow">DAILY TARGET</p>
    <p class="d xl num volt">${T.kcal.toLocaleString()}</p><p class="d m">KCAL / DAY</p>
    <div class="grid3" style="margin-top:20px">
      <div class="stat"><div class="v">${T.protein}g</div><div class="k">Protein</div></div>
      <div class="stat"><div class="v">${T.carbs}g</div><div class="k">Carbs</div></div>
      <div class="stat"><div class="v">${T.fat}g</div><div class="k">Fat</div></div></div>
    <div class="card" style="margin-top:14px"><p class="small mute">Maintenance ≈ <b class="volt">${T.tdee.toLocaleString()} kcal</b>. You'll eat ~600 below it — the edge of what research says still lets you build muscle while losing fat. Protein at 2 g/kg protects every gram of muscle.</p></div>
    <div class="card line" style="margin-top:12px"><p class="eyebrow">INSTALL ON ANDROID</p><p class="small" style="margin-top:6px">Chrome menu <b>⋮</b> → <b>Install app</b> (or <b>Add to Home screen</b>). It works offline after that.</p>
    ${deferredInstall ? `<button class="btn sm" data-a="install" style="margin-top:12px">${ic('down')} INSTALL NOW</button>` : ''}</div>
    <a class="btn" href="#today" style="margin-top:22px">LET'S GO ${ic('play')}</a></div>`;
}

function vToday() {
  const d = today(), wid = sessionId(d), W = build(d, wid), ph = phaseOf(d), wk = weekOf(d);
  const toW = diff(d, PLAN.wedding), toF = diff(d, PLAN.fitting), D = peek(d), T = targets();
  const C = checkState(d), sc = Object.values(C).filter(Boolean).length, st = streak();
  const seed = diff(PLAN.start, d) + 100;
  const hero = toW > 0
    ? `<p class="d xxl num">${toW}</p><p class="d l">${toW === 1 ? 'DAY' : 'DAYS'} TO SAH<span class="volt">.</span></p>`
    : toW === 0 ? `<p class="d xxl volt">SAH.</p><p class="d l">TODAY. ALHAMDULILLAH.</p>` : `<p class="d xl volt">MARRIED.</p><p class="d m">KEEP THE HABITS.</p>`;
  const chips = [
    d < PLAN.start ? `<span class="chip volt">WEEK 1 STARTS ${fmtDay(PLAN.start)}</span>` : ph ? `<span class="chip volt">WEEK ${wk} · ${ph.name}</span>` : '',
    toF > 0 ? `<span class="chip">FITTING IN ${toF}D</span>` : toF === 0 ? `<span class="chip red">FITTING TODAY</span>` : '',
    st > 0 ? `<span class="chip">🔥 ${st}-DAY STREAK</span>` : '',
  ].join('');

  // session card
  let sess;
  const active = S.active && S.active.d === d;
  if (isTrain(W)) {
    const exN = W.blocks.filter(b => b.k === 'ex').length;
    const done = workoutDone(d);
    sess = `<div class="card volt session"><div class="stripe"></div>
      <p class="eyebrow">TODAY · ${ampm(gymTimes(d).train)}${ph ? ` · ${ph.name}` : ''}</p>
      <p class="d l">${esc(W.name)}</p>
      <div class="meta"><span>~${W.mins} MIN</span>${exN ? `<span>${exN} EXERCISES</span>` : ''}${W.cardioMins ? `<span>${W.cardioMins} MIN CARDIO</span>` : ''}</div>
      ${done ? `<button class="btn ink" data-a="go" data-h="session/${d}">${ic('check', 3)} DONE · VIEW</button>`
        : active ? `<a class="btn ink" href="#workout">${ic('play')} RESUME WORKOUT</a>`
          : `<button class="btn ink" data-a="start" data-d="${d}">${ic('play')} START WORKOUT</button>`}
      ${done || active ? '' : `<a class="link" href="#session/${d}" style="display:block;text-align:center;margin-top:12px;color:var(--ink)">See the full session →</a>`}</div>`;
  } else {
    sess = `<div class="card ${wid === 'SAH' ? 'volt' : ''} session"><p class="eyebrow">TODAY</p><p class="d l">${esc(W.name)}</p><p class="${wid === 'SAH' ? '' : 'mute'}" style="margin-top:6px">${esc(W.note)}</p></div>`;
  }
  if (S.active && S.active.d !== d) sess = `<a class="btn ghost" href="#workout" style="margin-bottom:12px">${ic('play')} RESUME ${esc(WORKOUTS[S.active.wid].name)}</a>` + sess;

  // sleep prompt
  const sh = sleepH(d);
  const sleepCard = sh == null
    ? `<div class="card"><div class="row between"><div><p class="eyebrow">LAST NIGHT</p><p class="d s" style="margin-top:6px">HOW DID YOU SLEEP?</p></div><span class="chip">${ic('sleep')}</span></div>
      <div class="grid2" style="margin-top:14px"><label class="field"><span>Lights out</span><input type="time" class="input" id="sl-bed" value="22:30"></label>
      <label class="field"><span>Woke up</span><input type="time" class="input" id="sl-wake" value="05:30"></label></div>
      <button class="btn sm" data-a="sleepsave" data-d="${d}" style="margin-top:12px">LOG SLEEP</button></div>`
    : `<a href="#sleep" class="card row between" style="text-decoration:none;color:inherit"><div><p class="eyebrow">LAST NIGHT</p><p class="d m num ${sh >= 7 ? 'volt' : ''}" style="margin-top:4px">${hrs(sh)}</p></div><span class="chip ${sh >= 7 ? 'volt' : 'red'}">${sh >= 7 ? 'GOAL HIT' : 'UNDER 7H'}</span></a>`;

  const CH = [
    ['sleep', '7H SLEEP', sh != null ? hrs(sh).toLowerCase() : 'tap to log'],
    ['train', isTrain(W) ? 'SESSION' : 'REST DAY', isTrain(W) ? (workoutDone(d) ? 'done' : W.short) : 'recovery counts'],
    ['protein', 'PROTEIN', `${D.protein} / ${T ? T.protein : '–'} g`],
    ['water', '3L WATER', `${(D.water * 0.5).toFixed(1)} L · tap +500ml`],
    ['steps', '10K STEPS', 'tap when done'],
    ['nosugar', 'NO SUGAR DRINKS', 'teh O / kopi O kosong'],
  ];
  const checks = CH.map(([id, l, sub]) => `<button class="check ${C[id] ? 'on' : ''}" data-a="check" data-id="${id}"><span class="ck">${ic('check', 3.4)}</span><span><span class="lbl">${l}</span><span class="sub">${esc(sub)}</span></span></button>`).join('');

  const tl = timeline(d), nowM = now().getHours() * 60 + now().getMinutes();
  const nextIdx = tl.findIndex(x => toMin(x.t) > nowM);
  const tlh = tl.map((x, i) => `<div class="tl-i ${x.k} ${nextIdx === -1 || i < nextIdx ? 'past' : ''} ${i === nextIdx ? 'now' : ''}"><div class="tl-t">${x.t}</div><div class="tl-dot"></div><div><div class="tl-n">${esc(x.n)}</div>${x.s ? `<div class="tl-d">${esc(x.s)}</div>` : ''}</div></div>`).join('');

  return `<div class="fade">${hdr()}
    <section class="hero">${hero}<div class="hero-sub">${chips}</div></section>
    <p class="d xs" style="margin:22px 0 16px;color:var(--mute);font-stretch:75%">${esc(pick(LINES, seed))}</p>
    ${sess}
    <div class="sec"><div class="sec-h"><p class="d s">TODAY'S CHECKLIST</p><span class="eyebrow num">${sc}/6</span></div>
      <div class="checks">${checks}</div><div class="score">${[0, 1, 2, 3, 4, 5].map(i => `<i class="${i < sc ? 'on' : ''}"></i>`).join('')}</div>
      <p class="tiny dim" style="margin-top:8px">4 of 6 keeps your streak alive.</p></div>
    <div class="sec">${sleepCard}</div>
    <div class="sec"><div class="sec-h"><p class="d s">RUN-SHEET</p><span class="eyebrow">${PLAN.loc.name} prayer times</span></div>
      <div class="card tight tl">${tlh}</div>
      <p class="tiny dim" style="margin-top:8px">Prayer times calculated on-device with JAKIM parameters — may differ by 1–2 min from e-Solat.</p></div>
  </div>`;
}

function vSession(d) {
  if (!d || !/^\d{4}-\d\d-\d\d$/.test(d)) d = today();
  const W = build(d), done = peek(d).workout;
  const blocks = W.blocks.map((b, i) => b.k === 'cardio'
    ? `<div class="row between"><div class="grow"><p class="d xs">${esc(b.label)}</p><p class="tiny mute" style="margin-top:4px">${esc(b.note)}</p></div><span class="chip">${Math.round(b.segs.reduce((a, s) => a + s.secs, 0) / 60)} MIN</span></div>`
    : `<div class="row between"><div class="grow"><p class="d xs">${esc(EX[b.id].name)}${b.main ? ' <span class="volt" style="font-size:12px;letter-spacing:.1em">MAIN</span>' : ''}</p><p class="tiny mute" style="margin-top:4px">${esc(EX[b.id].target)}</p></div><span class="chip num">${b.sets} × ${esc(b.reps)}</span></div>`).join('');
  const doneH = done ? `<div class="card volt" style="margin-top:14px"><p class="eyebrow">COMPLETED</p><p class="d m">${done.sets} SETS · ${done.mins} MIN</p>${done.vol ? `<p class="small">${done.vol.toLocaleString()} kg moved</p>` : ''}</div>` : '';
  return `<div class="fade"><div class="top"><button class="iconbtn" data-a="back">${ic('back')}</button><span class="eyebrow">${fmtDay(d)}</span></div>
    <p class="eyebrow">${W.phase ? `WEEK ${Math.max(1, weekOf(d))} · ${W.phase.name}` : ''}</p>
    <p class="d xl" style="margin:6px 0 10px">${esc(W.name)}</p>
    ${isTrain(W) ? `<div class="target"><span class="chip volt">~${W.mins} MIN</span><span class="chip">STOP ${W.rir} REPS BEFORE FAILURE</span></div>
    <div class="hint"><b>Warm-up:</b> ${WARMUP}</div>
    <div class="card list" style="margin-top:14px">${blocks}</div>${doneH}
    ${S.active && S.active.d === d ? `<a class="btn" href="#workout" style="margin-top:20px">${ic('play')} RESUME WORKOUT</a>` : `<button class="btn" data-a="start" data-d="${d}" style="margin-top:20px">${ic('play')} ${done ? 'DO IT AGAIN' : 'START WORKOUT'}</button>`}
    <p class="tiny dim" style="margin-top:10px;text-align:center">"Stop X reps before failure" = you could have done X more with good form.</p>`
      : `<div class="card"><p>${esc(W.note)}</p></div>`}</div>`;
}

/* ---------- Workout player ---------- */
let RT = null;   // rest timer {end,total,next}
let CT = null;   // cardio timer {bi,idx,end,left,running}
let tickH = null;

function startWorkout(d) {
  if (S.active && S.active.d !== d && !confirm('You have an unfinished workout. Discard it and start this one?')) { location.hash = '#workout'; return; }
  const W = build(d);
  const sets = {};
  W.blocks.forEach((b, i) => {
    if (b.k !== 'ex') return;
    const last = lastLog(b.id);
    sets[i] = Array.from({ length: b.sets }, (_, j) => ({ kg: last ? (last.sets[Math.min(j, last.sets.length - 1)]?.kg ?? '') : '', reps: '', done: false }));
  });
  S.active = { d, wid: W.wid, t0: Date.now(), i: 0, sets, cdone: {} };
  save(); CT = null; location.hash = '#workout';
}
function lastLog(id) { const L = S.logs[id]; return L && L.length ? L[L.length - 1] : null; }
function suggestion(b) {
  const L = lastLog(b.id), E = EX[b.id];
  if (!L) return `<b>First time.</b> Pick a weight you could lift ${range(b.reps)[1] + 3}+ times. Smooth reps, full range. Log it — next time the app tells you what to do.`;
  const [lo, hi] = range(b.reps);
  const s = L.sets.map(x => `${x.reps}`).join(', ');
  const kg = L.sets[0]?.kg;
  const allTop = L.sets.length >= 1 && L.sets.every(x => +x.reps >= hi);
  const unit = E.time ? 's' : '';
  const lastStr = `Last (${fmtDM(L.date)}): ${kg ? kg + ' kg × ' : ''}${s}${unit}`;
  if (allTop) return `${esc(lastStr)}<br><b class="volt">Top of the range on every set → ${esc(STEP[E.kind])}.</b>`;
  if (L.sets.some(x => +x.reps < lo)) return `${esc(lastStr)}<br><b>Below ${lo}? Drop the weight a little and own every rep.</b>`;
  return `${esc(lastStr)}<br><b>Same weight. Beat at least one set by 1 rep.</b>`;
}

function vWorkout() {
  const A = S.active;
  if (!A) { location.hash = '#today'; return ''; }
  const W = build(A.d, A.wid), n = W.blocks.length, i = Math.min(A.i, n - 1), b = W.blocks[i];
  const prog = W.blocks.map((x, j) => `<i class="${j < i || (x.k === 'ex' ? (A.sets[j] || []).every(s => s.done) : A.cdone[j]) ? 'on' : ''} ${j === i ? 'cur' : ''}"></i>`).join('');
  const last = i === n - 1;
  let body;
  if (b.k === 'cardio') {
    if (!CT || CT.bi !== i) CT = { bi: i, idx: 0, left: b.segs[0].secs, end: 0, running: false };
    const seg = b.segs[CT.idx] || b.segs[b.segs.length - 1];
    const total = b.segs.reduce((a, s) => a + s.secs, 0);
    body = `<p class="eyebrow">BLOCK ${i + 1} / ${n} · CARDIO · ${Math.round(total / 60)} MIN</p>
      <p class="d l ex-name">${esc(b.label)}</p>
      <div class="hint">${esc(b.note)}</div>
      <div class="ctimer ${seg.hard ? 'hard' : ''}" id="ct" style="margin-top:16px">
        <p class="d m" id="ct-lbl">${A.cdone[i] ? 'DONE' : esc(seg.label)}</p>
        <p class="big" id="ct-big">${A.cdone[i] ? '✓' : mmss(CT.running ? (CT.end - Date.now()) / 1000 : CT.left)}</p>
        ${b.segs.length > 1 ? `<p class="eyebrow" id="ct-r" style="color:inherit">${CT.idx + 1} / ${b.segs.length}</p>` : ''}
      </div>
      ${b.segs.length > 1 ? `<div class="segs" id="ct-segs">${b.segs.map((s, j) => `<i class="${s.hard ? 'h' : ''} ${j < CT.idx ? 'on' : ''}"></i>`).join('')}</div>` : ''}
      <div class="grid2" style="margin-top:18px">
        <button class="btn ${CT.running ? 'ghost' : ''}" data-a="ctgo" id="ct-btn">${CT.running ? ic('pause') + ' PAUSE' : ic('play') + (CT.idx || CT.left !== b.segs[0].secs ? ' RESUME' : ' START')}</button>
        <button class="btn line" data-a="ctdone">${A.cdone[i] ? 'DONE ✓' : 'MARK DONE'}</button></div>`;
  } else {
    const E = EX[b.id], S2 = A.sets[i];
    const rows = S2.map((s, j) => `<div class="set ${s.done ? 'done' : ''}">
      <div class="n">${j + 1}</div>
      <input inputmode="decimal" data-in="kg" data-j="${j}" placeholder="${E.kind === 'bw' ? 'BW' : 'kg'}" value="${esc(s.kg)}">
      <input inputmode="numeric" data-in="reps" data-j="${j}" placeholder="${range(b.reps)[1]}" value="${esc(s.reps)}">
      <button class="go" data-a="setdone" data-j="${j}" aria-label="Set done">${ic('check', 3)}</button></div>`).join('');
    body = `<p class="eyebrow">EXERCISE ${W.blocks.slice(0, i + 1).filter(x => x.k === 'ex').length} / ${W.blocks.filter(x => x.k === 'ex').length}${b.main ? ' · MAIN LIFT' : ''}</p>
      <p class="d l ex-name">${esc(E.name)}</p>
      <p class="mute small">${esc(E.target)}</p>
      <div class="target"><span class="chip volt">${b.sets} SETS</span><span class="chip">${esc(b.reps)} ${E.time ? 'SEC' : 'REPS'}</span><span class="chip">${W.rir} IN RESERVE</span><span class="chip">REST ${mmss(E.rest)}</span></div>
      <div class="hint">${suggestion(b)}</div>
      <div class="sets"><div class="set-h"><span>SET</span><span>KG</span><span>${E.time ? 'SEC' : 'REPS'}</span><span></span></div>${rows}</div>
      <details class="how"><summary>HOW TO DO IT</summary><ol>${E.cues.map(c => `<li>${esc(c)}</li>`).join('')}</ol>
        ${E.swap ? `<p class="small mute" style="margin:-4px 0 12px">${esc(E.swap)}</p>` : ''}
        <a class="btn sm line" style="margin-bottom:16px" target="_blank" rel="noopener" href="https://www.youtube.com/results?search_query=${encodeURIComponent(E.name + ' proper form')}">${ic('play')} WATCH A DEMO</a></details>`;
  }
  return `<div class="fade">
    <div class="wk-top"><button class="iconbtn" data-a="wexit" aria-label="Leave">${ic('close')}</button><span class="eyebrow">${esc(W.name)} · <span id="w-el">${mmss((Date.now() - A.t0) / 1000)}</span></span><button class="chip" data-a="finish">FINISH</button></div>
    <div class="progress">${prog}</div>
    ${body}
    <div class="wk-nav"><button class="btn ghost" data-a="prev" ${i === 0 ? 'disabled' : ''} aria-label="Previous">${ic('back')}</button>
    ${last ? `<button class="btn" data-a="finish">FINISH WORKOUT ${ic('check', 3)}</button>` : `<button class="btn" data-a="next">NEXT ${ic('play')}</button>`}</div>
  </div>`;
}

function renderOverlay() {
  let o = $('#ov');
  if (!RT) { o && o.remove(); return; }
  if (!o) { o = document.createElement('div'); o.id = 'ov'; o.className = 'overlay'; document.body.appendChild(o); }
  o.innerHTML = `<div class="inner"><div class="row between"><span class="eyebrow" style="color:var(--ink)">REST</span><span class="eyebrow" style="color:var(--ink)">${esc(RT.label)}</span></div>
    <div class="center"><p class="big" id="rt-big">${mmss((RT.end - Date.now()) / 1000)}</p><p class="d m" style="margin-top:14px">${esc(RT.next)}</p></div>
    <div class="ctrls"><button class="btn ghostink" data-a="rt" data-v="-15">−15s</button><button class="btn ghostink" data-a="rt" data-v="15">+15s</button>
    <button class="btn ink" data-a="rtskip">SKIP REST</button></div></div>`;
}

function tick() {
  const A = S.active;
  const el = $('#w-el'); if (el && A) el.textContent = mmss((Date.now() - A.t0) / 1000);
  if (RT) {
    const left = (RT.end - Date.now()) / 1000;
    const b = $('#rt-big'); if (b) b.textContent = mmss(left);
    if (left <= 0) { RT = null; renderOverlay(); beep(3); buzz([200, 100, 200]); toast('GO. NEXT SET.'); }
  }
  if (CT && CT.running && A) {
    const W = build(A.d, A.wid), b = W.blocks[CT.bi];
    let left = (CT.end - Date.now()) / 1000;
    if (left <= 0) {
      CT.idx++;
      if (CT.idx >= b.segs.length) { CT.running = false; CT.idx = b.segs.length - 1; CT.left = 0; A.cdone[CT.bi] = true; save(); beep(3); buzz([300, 100, 300]); toast('BLOCK DONE'); render(); return; }
      const s = b.segs[CT.idx]; CT.end = Date.now() + s.secs * 1000; left = s.secs; beep(s.hard ? 2 : 1); buzz(150);
      if (location.hash === '#workout') render(); return;
    }
    const big = $('#ct-big'); if (big) big.textContent = mmss(left);
  }
}

function finishWorkout() {
  const A = S.active; if (!A) return;
  const W = build(A.d, A.wid);
  let sets = 0, vol = 0; const prs = [];
  W.blocks.forEach((b, i) => {
    if (b.k !== 'ex') return;
    const done = (A.sets[i] || []).filter(s => s.done).map(s => ({ kg: s.kg === '' ? 0 : +s.kg, reps: +s.reps || 0 }));
    if (!done.length) return;
    const prevBest = Math.max(0, ...(S.logs[b.id] || []).flatMap(l => l.sets.map(s => +s.kg || 0)));
    const best = Math.max(...done.map(s => s.kg));
    if (best > 0 && prevBest > 0 && best > prevBest) prs.push(`${EX[b.id].name} ${best} kg`);
    (S.logs[b.id] ||= []).push({ date: A.d, sets: done });
    sets += done.length; vol += done.reduce((a, s) => a + s.kg * (EX[b.id].time ? 0 : s.reps), 0);
  });
  const cardio = Object.keys(A.cdone).length;
  const mins = Math.max(1, Math.round((Date.now() - A.t0) / 60000));
  day(A.d).workout = { wid: A.wid, sets, vol: Math.round(vol), mins, cardio, prs, at: Date.now() };
  const d = A.d; S.active = null; RT = null; CT = null; save(); renderOverlay(); keepAwake(false);
  location.hash = `#done/${d}`;
}

function vDone(d) {
  const w = peek(d).workout; if (!w) { location.hash = '#today'; return ''; }
  const left = diff(today(), PLAN.wedding);
  return `<div class="fade done-hero"><p class="eyebrow">${fmtDay(d)} · ${esc(WORKOUTS[w.wid].name)}</p>
    <p class="d xxl" style="margin-top:12px">DONE.</p><p class="d l" style="margin-top:6px">${esc(pick(DONE_LINES, w.at))}</p>
    <div class="grid2" style="margin-top:26px">
      <div class="stat"><div class="v">${w.mins}</div><div class="k">Minutes</div></div>
      <div class="stat"><div class="v">${w.sets}</div><div class="k">Sets</div></div>
      <div class="stat"><div class="v">${w.vol.toLocaleString()}</div><div class="k">KG moved</div></div>
      <div class="stat"><div class="v volt">${Math.max(0, left)}</div><div class="k">Days to SAH.</div></div></div>
    ${w.prs && w.prs.length ? `<div class="card volt" style="margin-top:14px"><p class="eyebrow">NEW BESTS</p><ul class="bullets">${w.prs.map(p => `<li><b>${esc(p)}</b></li>`).join('')}</ul></div>` : ''}
    <div class="card" style="margin-top:14px"><p class="small"><b>Now:</b> breakfast with protein within the next hour, then a big glass of water.</p></div>
    <a class="btn" href="#today" style="margin-top:22px">BACK TO TODAY</a></div>`;
}

/* ---------- Plan ---------- */
function vPlan() {
  const t = today(), curPh = phaseOf(t), curWk = t >= PLAN.start ? weekOf(t) : 0;
  const open = S.ui.openWeek ?? curWk;
  const ms = [['START', PLAN.start, 'Week 1, day 1'], ['FITTING', PLAN.fitting, 'Checkpoint · tell the tailor you\'re still cutting'], ['SAH.', PLAN.wedding, 'Nikah']];
  const msH = ms.map(([n, d, s]) => { const x = diff(t, d); return `<div class="milestone"><div class="dt"><b>${parse(d).getDate()}</b><small>${MON[parse(d).getMonth()]}</small></div><div class="grow"><p class="d s">${n}</p><p class="small mute">${esc(s)}</p></div><span class="chip ${x === 0 ? 'volt' : ''}">${x > 0 ? `IN ${x}D` : x === 0 ? 'TODAY' : 'DONE'}</span></div>`; }).join('<div style="height:12px"></div>');
  const phases = PHASES.map(p => {
    const weeks = [];
    for (let w = p.weeks[0]; w <= p.weeks[1]; w++) {
      const ws = addDays(PLAN.start, (w - 1) * 7);
      const days = [];
      for (let k = 0; k < 7; k++) {
        const d = addDays(ws, k); if (d > PLAN.wedding) break;
        const W = WORKOUTS[sessionId(d)], done = workoutDone(d);
        days.push(`<a class="dayrow ${d === t ? 'today' : ''} ${done ? 'done' : ''}" href="#session/${d}"><span class="tiny" style="font-weight:800;letter-spacing:.06em">${fmtDay(d).replace(/ \w+$/, '')}</span><b>${esc(W.short)}</b><span class="ok">${done ? ic('check', 3).replace('<svg', '<svg width="18" height="18"') : isTrain(W) ? '›' : ''}</span></a>`);
      }
      weeks.push(`<div class="week ${w === curWk ? 'cur' : ''}"><button class="week-h" style="width:100%" data-a="week" data-w="${w}"><span>WEEK ${w} · ${fmtDM(ws)}</span><span>${open === w ? '–' : '+'}</span></button>${open === w ? `<div class="days">${days.join('')}</div>` : ''}</div>`);
    }
    return `<div class="phase ${curPh && curPh.id === p.id ? 'cur' : ''}"><div class="phase-h"><div><p class="eyebrow">WEEKS ${p.weeks[0]}${p.weeks[1] !== p.weeks[0] ? '–' + p.weeks[1] : ''} · ${fmtDM(p.from)} – ${fmtDM(p.to)}</p><p class="d l" style="margin-top:6px">${p.name}</p></div>${curPh && curPh.id === p.id ? '<span class="chip volt">NOW</span>' : ''}</div>
      <div class="phase-b"><p class="d xs volt" style="font-stretch:75%">${esc(p.line)}</p><ul class="bullets small" style="margin:8px 0 14px">${p.focus.map(f => `<li>${esc(f)}</li>`).join('')}</ul>${weeks.join('')}</div></div>`;
  }).join('<div style="height:12px"></div>');
  const sci = SCIENCE.map(s => `<div class="sci"><p class="v">${esc(s.v)}</p><p class="small" style="margin-top:4px">${esc(s.f)}</p><p class="p">${esc(s.p)}</p><a class="tiny" href="${s.u}" target="_blank" rel="noopener" style="display:inline-block;margin-top:8px;color:var(--mute)">${esc(s.s)} ↗</a></div>`).join('');
  return `<div class="fade">${hdr('11 WEEKS')}
    <p class="d xl">THE PLAN<span class="volt">.</span></p>
    <div class="card" style="margin-top:18px">${msH}</div>
    <div class="sec"><div class="sec-h"><p class="d s">PHASES</p><span class="eyebrow">TAP A WEEK</span></div>${phases}</div>
    <div class="sec card volt"><p class="eyebrow">15 DEC · FITTING DAY</p><p class="d m" style="margin:6px 0 10px">TAILOR BRIEF</p><ul class="bullets">${FITTING.map(f => `<li>${esc(f)}</li>`).join('')}</ul></div>
    <div class="sec card"><p class="eyebrow">18–23 JAN</p><p class="d m" style="margin:6px 0 4px">WEDDING WEEK</p><p class="small mute" style="margin-bottom:6px">Look your best by keeping everything boringly normal. No crash diets, no water cutting.</p>
      <div class="list">${WEDDING_WEEK.map(([d, s]) => `<div><p class="d xs volt">${d}</p><p class="small" style="margin-top:4px">${esc(s)}</p></div>`).join('')}</div></div>
    <div class="sec"><div class="sec-h"><p class="d s">THE SCIENCE</p><span class="eyebrow">WHY IT WORKS</span></div><div class="card">${sci}</div>
    <p class="tiny dim" style="margin-top:10px">Not medical advice. If you have a health condition, check with a doctor before starting.</p></div>
  </div>`;
}

/* ---------- Fuel ---------- */
function vFuel() {
  const d = today(), D = peek(d), T = targets();
  const pct = Math.min(100, Math.round(D.protein / T.protein * 100));
  return `<div class="fade">${hdr()}
    <p class="d xl">FUEL<span class="volt">.</span></p>
    <div class="card volt" style="margin-top:18px"><p class="eyebrow">DAILY TARGET · ~600 BELOW MAINTENANCE</p>
      <div class="row between" style="align-items:flex-end"><p class="d xl num">${T.kcal.toLocaleString()}</p><p class="d s" style="padding-bottom:8px">KCAL</p></div>
      <div class="grid3" style="margin-top:12px"><div><p class="d m">${T.protein}g</p><p class="eyebrow">PROTEIN</p></div><div><p class="d m">${T.carbs}g</p><p class="eyebrow">CARBS</p></div><div><p class="d m">${T.fat}g</p><p class="eyebrow">FAT</p></div></div></div>
    <div class="sec"><div class="sec-h"><p class="d s">PROTEIN TODAY</p>${D.pl && D.pl.length ? `<button class="link" data-a="pundo">UNDO</button>` : ''}</div>
      <div class="card"><div class="counter"><p class="d xl num ${D.protein >= T.protein ? 'volt' : ''}">${D.protein}</p><p class="d s mute" style="padding-bottom:6px">/ ${T.protein} G</p></div>
      <div class="bar" style="margin-top:12px"><i style="width:${pct}%"></i></div>
      <p class="tiny mute" style="margin-top:8px">${D.protein >= T.protein ? 'Target hit. Muscle protected.' : `${T.protein - D.protein} g to go. Tap what you ate.`}</p></div>
      <div class="foods" style="margin-top:10px">${PROTEIN_FOODS.map((f, i) => `<button class="food" data-a="padd" data-i="${i}"><span class="g">+${f.g}</span><b>${esc(f.n)}</b><small>${esc(f.d)}</small></button>`).join('')}</div>
      <div class="grid2" style="margin-top:8px"><button class="btn ghost sm" data-a="pcustom" data-v="-5">−5 G</button><button class="btn ghost sm" data-a="pcustom" data-v="5">+5 G</button></div></div>
    <div class="sec"><div class="sec-h"><p class="d s">WATER</p><span class="eyebrow num">${(D.water * 0.5).toFixed(1)} / 3 L</span></div>
      <div class="drops">${[1, 2, 3, 4, 5, 6].map(i => `<button class="drop ${i <= D.water ? 'on' : ''}" data-a="water" data-v="${i}">500</button>`).join('')}</div>
      <p class="tiny dim" style="margin-top:8px">Each tap = one 500 ml bottle.</p></div>
    <div class="sec card"><p class="d m">THE SAH PLATE</p>
      <div class="row" style="margin-top:14px;gap:18px"><div style="width:120px;height:120px;border-radius:50%;flex:none;background:conic-gradient(#5FA34A 0 50%, var(--volt) 50% 75%, #F2F2F2 75% 100%)"></div>
      <div class="gap-s small"><p><b style="color:#7CC462">½ SAYUR</b> — as much as you like</p><p><b class="volt">¼ PROTEIN</b> — 1–2 palms</p><p><b>¼ NASI</b> — 1 cup lunch, ½ cup dinner</p></div></div>
      <p class="tiny mute" style="margin-top:14px">Rice stays. Measure it with the same cup every day — 1 cup cooked ≈ 200 kcal.</p></div>
    <div class="sec"><p class="d s" style="margin-bottom:12px">THE DAY</p><div class="card list">${MEALS.map(m => `<div><div class="row between"><p class="d xs">${m.n}</p><span class="eyebrow">${m.t}</span></div><p class="tiny mute" style="margin:2px 0 6px">${esc(m.s)}</p><ul class="bullets small">${m.o.map(o => `<li>${esc(o)}</li>`).join('')}</ul></div>`).join('')}</div></div>
    <div class="sec"><p class="d s" style="margin-bottom:12px">SMART SWAPS</p><div class="card list">${SWAPS.map(([a, b]) => `<div class="swap"><span class="x">${esc(a)}</span><span class="arrow">→</span><span>${esc(b)}</span></div>`).join('')}</div></div>
    <div class="sec card volt"><p class="eyebrow">SCREENSHOT OR SHARE</p><p class="d m" style="margin:6px 0 10px">TIPS FOR MAK</p><ul class="bullets">${MAK_TIPS.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
      <button class="btn ink sm" data-a="share" style="margin-top:16px">${ic('share')} SHARE WITH MAK</button></div>
    <div class="sec card"><p class="d m" style="margin-bottom:10px">KENDURI &amp; MAKAN EVENTS</p><ul class="bullets small">${KENDURI.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>
  </div>`;
}

/* ---------- Sleep ---------- */
function vSleep() {
  const d = today(), D = peek(d);
  const last7 = Array.from({ length: 7 }, (_, i) => addDays(d, i - 6));
  const vals = last7.map(x => sleepH(x));
  const logged = vals.filter(v => v != null);
  const avg = logged.length ? logged.reduce((a, b) => a + b, 0) / logged.length : null;
  const hit = logged.filter(v => v >= 7).length;
  const max = 9;
  const bars = last7.map((x, i) => { const v = vals[i]; return `<div class="b"><em>${v != null ? r1(v) : '–'}</em><div class="track"><i class="${v >= 7 ? 'ok' : ''}" style="height:${v ? Math.min(100, v / max * 100) : 2}%"></i></div><small>${DOW[dow(x)].slice(0, 1)}</small></div>`; }).join('');
  const nowM = now().getHours() * 60 + now().getMinutes();
  let toBed = toMin('22:30') - nowM; if (toBed < -180) toBed += 1440;
  const s = D.sleep || {};
  const wind = D.wind || [];
  return `<div class="fade">${hdr()}
    <p class="d xl">SLEEP<span class="volt">.</span></p>
    <div class="card volt" style="margin-top:18px"><p class="eyebrow">TONIGHT</p><p class="d l" style="margin:6px 0">LIGHTS OUT 22:30</p>
      <p class="small">${toBed > 0 ? `In ${Math.floor(toBed / 60)}h ${pad(toBed % 60)}m. Wind down starts at 21:45.` : 'It\'s past lights out. Phone down, go to bed — 5:30 still happens.'}</p></div>
    <div class="sec"><div class="sec-h"><p class="d s">LOG LAST NIGHT</p>${D.sleep ? `<span class="chip ${D.sleep.h >= 7 ? 'volt' : 'red'}">${hrs(D.sleep.h)}</span>` : ''}</div>
      <div class="card"><div class="grid2"><label class="field"><span>Lights out</span><input type="time" class="input" id="sl-bed" value="${s.bed || '22:30'}"></label>
      <label class="field"><span>Woke up</span><input type="time" class="input" id="sl-wake" value="${s.wake || '05:30'}"></label></div>
      <button class="btn sm" data-a="sleepsave" data-d="${d}" style="margin-top:12px">${D.sleep ? 'UPDATE' : 'LOG SLEEP'}</button></div></div>
    <div class="sec"><div class="sec-h"><p class="d s">LAST 7 NIGHTS</p><span class="eyebrow">${hit}/7 NIGHTS ≥ 7H</span></div>
      <div class="card"><div class="sleepbars"><div class="goal" style="bottom:${Math.round(20 + 130 * 7 / max)}px"></div>${bars}</div>
      <div class="grid2" style="margin-top:16px"><div class="stat" style="background:var(--s2)"><div class="v">${avg ? hrs(avg) : '–'}</div><div class="k">7-day average</div></div><div class="stat" style="background:var(--s2)"><div class="v">7H</div><div class="k">Target</div></div></div></div></div>
    <div class="sec"><div class="sec-h"><p class="d s">WIND-DOWN · 21:45</p><span class="eyebrow num">${wind.length}/${WIND_DOWN.length}</span></div>
      <div class="gap-s">${WIND_DOWN.map((w, i) => `<button class="check ${wind.includes(i) ? 'on' : ''}" data-a="wind" data-i="${i}" style="min-height:0;flex-direction:row;align-items:center;justify-content:flex-start;gap:12px;width:100%"><span class="ck" style="flex:none">${ic('check', 3.4)}</span><span class="lbl" style="margin:0;font-size:17px">${esc(w)}</span></button>`).join('')}</div></div>
    <div class="sec"><p class="d s" style="margin-bottom:12px">THE RESET RULES</p><div class="card list">${SLEEP_RULES.map(([h, t], i) => `<div><p class="d xs"><span class="volt">${pad(i + 1)}</span> ${esc(h)}</p><p class="small mute" style="margin-top:4px">${esc(t)}</p></div>`).join('')}</div>
    <p class="tiny dim" style="margin-top:10px">Why it matters: dieting on 5.5h vs 8.5h of sleep meant 55% less fat lost and 60% more muscle lost (Nedeltcheva 2010).</p></div>
  </div>`;
}

/* ---------- You ---------- */
function weeklyRate() {
  const w = S.weights.slice().sort((a, b) => a.d < b.d ? -1 : 1);
  if (w.length < 4) return null;
  const last = w[w.length - 1].d;
  const a = w.filter(x => diff(x.d, last) < 7), b = w.filter(x => diff(x.d, last) >= 7 && diff(x.d, last) < 14);
  if (!a.length || !b.length) return null;
  const am = a.reduce((s, x) => s + x.kg, 0) / a.length, bm = b.reduce((s, x) => s + x.kg, 0) / b.length;
  return (bm - am) / bm * 100;
}
function weightChart() {
  const p = S.profile, w = S.weights.slice().sort((a, b) => a.d < b.d ? -1 : 1);
  const x0 = w.length && w[0].d < PLAN.start ? w[0].d : PLAN.start, x1 = PLAN.wedding, span = diff(x0, x1);
  const startKg = p.w0, weeks = span / 7;
  const lo1 = startKg * Math.pow(0.99, weeks), lo06 = startKg * Math.pow(0.994, weeks);
  const ys = w.map(x => x.kg).concat([startKg, lo1]);
  const yMin = Math.floor(Math.min(...ys) - 1), yMax = Math.ceil(Math.max(...ys) + 1);
  const W = 340, H = 200, L = 32, Rr = 8, T = 10, B = 24;
  const X = d => L + diff(x0, d) / span * (W - L - Rr), Y = kg => T + (yMax - kg) / (yMax - yMin) * (H - T - B);
  const band = `${X(x0)},${Y(startKg)} ${X(x1)},${Y(lo06)} ${X(x1)},${Y(lo1)}`;
  const avg = w.map((x, i) => { const r = w.filter(y => diff(y.d, x.d) >= 0 && diff(y.d, x.d) < 7); return [x.d, r.reduce((s, y) => s + y.kg, 0) / r.length]; });
  const grid = []; for (let k = yMin; k <= yMax; k += Math.max(1, Math.round((yMax - yMin) / 4))) grid.push(`<line x1="${L}" x2="${W - Rr}" y1="${Y(k)}" y2="${Y(k)}" stroke="#222"/><text x="${L - 6}" y="${Y(k) + 4}" fill="#6A6A6A" font-size="10" text-anchor="end">${k}</text>`);
  const fx = X(PLAN.fitting);
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Weight trend">
    ${grid.join('')}
    <polygon points="${band}" fill="rgba(212,255,58,.12)"/>
    <line x1="${fx}" x2="${fx}" y1="${T}" y2="${H - B}" stroke="#444" stroke-dasharray="3 3"/><text x="${fx}" y="${H - 8}" fill="#A3A3A3" font-size="10" text-anchor="middle">FITTING</text>
    <text x="${W - Rr}" y="${H - 8}" fill="#D4FF3A" font-size="10" text-anchor="end" font-weight="800">SAH.</text>
    <text x="${L}" y="${H - 8}" fill="#A3A3A3" font-size="10">${fmtDM(x0)}</text>
    ${w.map(x => `<circle cx="${X(x.d)}" cy="${Y(x.kg)}" r="2.5" fill="#6A6A6A"/>`).join('')}
    ${avg.length > 1 ? `<polyline points="${avg.map(([d, k]) => `${X(d)},${Y(k)}`).join(' ')}" fill="none" stroke="#D4FF3A" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>` : ''}
  </svg><p class="tiny mute" style="margin-top:6px"><span class="volt">■</span> target zone (0.6–1%/week) · <span class="volt">—</span> 7-day average · dots = daily weigh-ins</p>`;
}
function vYou() {
  const p = S.profile, T = targets(), d = today();
  const w = S.weights.slice().sort((a, b) => a.d < b.d ? -1 : 1);
  const todayW = w.find(x => x.d === d);
  const cw = curWeight(), change = cw - p.w0, rate = weeklyRate();
  let rateMsg = '';
  if (rate != null) {
    rateMsg = rate > 1.1 ? ['red', 'TOO FAST', 'You\'re losing more than 1%/week — that costs muscle. Add ~150 kcal (½ cup rice) a day.']
      : rate >= 0.5 ? ['volt', 'ON TARGET', 'Fat loss at a muscle-safe pace. Change nothing.']
        : ['', 'SLOW', 'Under 0.5%/week. Cut ~150 kcal (skip the dinner rice or sweet drinks) or add 2K steps a day.'];
  }
  const ws = S.waists.slice().sort((a, b) => a.d < b.d ? -1 : 1);
  const past = Object.keys(S.days).filter(x => x <= d);
  const sched = []; for (let x = PLAN.start; x <= d && x < PLAN.wedding; x = addDays(x, 1)) if (isTrain(WORKOUTS[sessionId(x)])) sched.push(x);
  const doneN = sched.filter(workoutDone).length;
  const sl = Array.from({ length: 7 }, (_, i) => sleepH(addDays(d, -i))).filter(v => v != null);
  const best = Object.entries(S.logs).map(([id, L]) => { let b = null; L.forEach(l => l.sets.forEach(s => { if (!b || (+s.kg > +b.kg) || (+s.kg === +b.kg && +s.reps > +b.reps)) b = { ...s, date: l.date }; })); return [id, b]; }).filter(([, b]) => b);
  return `<div class="fade">${hdr()}
    <p class="d xl">YOU<span class="volt">.</span></p>
    <div class="card" style="margin-top:18px"><p class="eyebrow">MORNING WEIGH-IN · ${fmtDay(d)}</p>
      <div class="row" style="margin-top:10px"><input class="input grow" id="w-in" inputmode="decimal" placeholder="${r1(cw) || 'kg'}" value="${todayW ? todayW.kg : ''}"><button class="btn sm" style="width:120px" data-a="wsave">${todayW ? 'UPDATE' : 'SAVE'}</button></div>
      <p class="tiny dim" style="margin-top:8px">After the toilet, before food or water. Daily numbers jump around — the 7-day average is what counts.</p></div>
    <div class="grid3" style="margin-top:10px">
      <div class="stat"><div class="v num">${r1(cw)}</div><div class="k">7-day avg kg</div></div>
      <div class="stat"><div class="v num ${change < 0 ? 'volt' : ''}">${change > 0 ? '+' : ''}${r1(change)}</div><div class="k">Since start</div></div>
      <div class="stat"><div class="v num">${rate != null ? r1(rate) + '%' : '–'}</div><div class="k">Per week</div></div></div>
    ${rateMsg ? `<div class="card ${rateMsg[0] === 'volt' ? 'volt' : ''}" style="margin-top:10px;${rateMsg[0] === 'red' ? 'border:2px solid var(--red)' : ''}"><p class="d s">${rateMsg[1]}</p><p class="small" style="margin-top:6px">${rateMsg[2]}</p></div>` : `<p class="tiny dim" style="margin-top:10px">Weekly rate shows after 2 weeks of weigh-ins. Ignore week 1 — it's mostly water.</p>`}
    <div class="sec card">${weightChart()}</div>
    <div class="sec"><div class="sec-h"><p class="d s">WAIST</p><span class="eyebrow">SUNDAYS · AT THE NAVEL</span></div>
      <div class="card"><div class="row"><input class="input grow" id="waist-in" inputmode="decimal" placeholder="cm"><button class="btn sm" style="width:120px" data-a="waistsave">SAVE</button></div>
      ${ws.length ? `<div class="row between" style="margin-top:14px"><div><p class="d m num">${ws[ws.length - 1].cm} CM</p><p class="tiny mute">${fmtDay(ws[ws.length - 1].d)}</p></div>${ws.length > 1 ? `<span class="chip ${ws[ws.length - 1].cm <= ws[0].cm ? 'volt' : ''}">${r1(ws[ws.length - 1].cm - ws[0].cm)} CM SINCE START</span>` : ''}</div>` : ''}
      <p class="tiny dim" style="margin-top:8px">Waist dropping + weights going up = you're losing fat and building muscle.</p></div></div>
    <div class="sec"><p class="d s" style="margin-bottom:12px">SCOREBOARD</p><div class="grid2">
      <div class="stat"><div class="v">${doneN}<span class="mute" style="font-size:24px">/${sched.length}</span></div><div class="k">Sessions done</div></div>
      <div class="stat"><div class="v">${streak()}</div><div class="k">Day streak</div></div>
      <div class="stat"><div class="v">${sl.length ? r1(sl.reduce((a, b) => a + b, 0) / sl.length) + 'H' : '–'}</div><div class="k">Sleep 7-day avg</div></div>
      <div class="stat"><div class="v">${past.filter(x => peek(x).protein >= T.protein).length}</div><div class="k">Protein days hit</div></div></div></div>
    ${best.length ? `<div class="sec"><p class="d s" style="margin-bottom:12px">BEST LIFTS</p><div class="card list">${best.map(([id, b]) => `<div class="row between"><span class="small"><b>${esc(EX[id].name)}</b></span><span class="d xs num volt">${b.kg ? b.kg + ' KG × ' : ''}${b.reps}${EX[id].time ? 'S' : ''}</span></div>`).join('')}</div></div>` : ''}
    <div class="sec"><p class="d s" style="margin-bottom:12px">PROFILE</p><div class="card">
      <div class="seg"><button data-a="psex" data-v="m" class="${p.sex === 'm' ? 'on' : ''}">Male</button><button data-a="psex" data-v="f" class="${p.sex === 'f' ? 'on' : ''}">Female</button></div>
      <div class="grid2" style="margin-top:10px"><label class="field"><span>Age</span><input class="input" id="p-age" inputmode="numeric" value="${p.age}"></label><label class="field"><span>Height cm</span><input class="input" id="p-h" inputmode="decimal" value="${p.h}"></label></div>
      <button class="btn ghost sm" data-a="psave" style="margin-top:10px">UPDATE PROFILE</button>
      <p class="tiny mute" style="margin-top:12px">Targets update automatically as your weight drops: <b class="volt">${T.kcal} kcal · ${T.protein} g protein</b> (maintenance ≈ ${T.tdee}).</p></div></div>
    <div class="sec"><p class="d s" style="margin-bottom:12px">APP</p><div class="gap-s">
      ${deferredInstall ? `<button class="btn" data-a="install">${ic('down')} INSTALL APP</button>` : `<div class="card tight"><p class="small"><b>Install on Android:</b> Chrome menu ⋮ → <b>Install app</b> / <b>Add to Home screen</b>.</p></div>`}
      <button class="btn ghost sm" data-a="export">${ic('down')} BACK UP MY DATA</button>
      <label class="btn ghost sm">RESTORE FROM BACKUP<input type="file" accept="application/json" id="imp" hidden></label>
      <p class="tiny dim">Everything is stored on this phone only. Back up once a week so clearing Chrome data never wipes your progress.</p>
      <button class="link" data-a="reset" style="color:var(--red);margin-top:8px">Reset everything</button></div></div>
  </div>`;
}

/* ================= router ================= */
function render() {
  clearInterval(tickH); tickH = null;
  const [r, arg] = location.hash.replace(/^#/, '').split('/');
  const m = main();
  if (!S.profile) { m.className = 'full'; m.innerHTML = vOnboard(); $('#tabs').innerHTML = ''; return; }
  const views = { today: vToday, plan: vPlan, fuel: vFuel, sleep: vSleep, you: vYou, session: () => vSession(arg), workout: vWorkout, done: () => vDone(arg), welcome: vWelcome };
  const key = views[r] ? r : 'today';
  const full = ['workout', 'session', 'done', 'welcome'].includes(key);
  m.className = full ? 'full' : '';
  m.innerHTML = views[key]();
  $('#tabs').innerHTML = full ? '' : tabbar(key);
  if (key === 'workout' && S.active) { keepAwake(true); tickH = setInterval(tick, 250); }
  renderOverlay();
  if (RT && !tickH) tickH = setInterval(tick, 250);
}
let lastRoute = '';
window.addEventListener('hashchange', () => { const r = location.hash.split('/')[0]; if (r !== lastRoute) window.scrollTo(0, 0); lastRoute = r; render(); });

/* ================= actions ================= */
const ACT = {
  go: el => location.hash = '#' + el.dataset.h,
  back: () => history.length > 1 ? history.back() : (location.hash = '#today'),
  install: async () => { if (!deferredInstall) return; deferredInstall.prompt(); await deferredInstall.userChoice; deferredInstall = null; render(); },
  onbsex: el => { S.ui.onb = { ...(S.ui.onb || {}), ...readOnb(), sex: el.dataset.v }; render(); },
  onbgo: () => {
    const o = { ...(S.ui.onb || {}), ...readOnb() };
    const age = +o.age, h = +o.h, w = +String(o.w).replace(',', '.');
    if (!o.sex) return toast('Pick male or female');
    if (!(age > 12 && age < 100 && h > 120 && h < 230 && w > 35 && w < 250)) return toast('Check your numbers');
    const d = today();
    S.profile = { sex: o.sex, age, h, w0: w, d0: d };
    S.weights = S.weights.filter(x => x.d !== d).concat({ d, kg: w });
    delete S.ui.onb; save(); location.hash = '#welcome'; render();
  },
  start: el => startWorkout(el.dataset.d),
  check: el => {
    const d = today(), D = day(d), id = el.dataset.id;
    if (id === 'protein') return location.hash = '#fuel';
    if (id === 'sleep' && sleepH(d) == null) return location.hash = '#sleep';
    if (id === 'water') { D.water = Math.min(12, D.water + 1); save(); render(); return toast(`+500 ML · ${(D.water * 0.5).toFixed(1)} L`); }
    if (id === 'train' && isTrain(WORKOUTS[sessionId(d)]) && !workoutDone(d) && !D.checks.train) { location.hash = '#session/' + d; return; }
    D.checks[id] = !D.checks[id]; buzz(20); save(); render();
  },
  sleepsave: el => {
    const bed = $('#sl-bed').value, wake = $('#sl-wake').value; if (!bed || !wake) return;
    let m = toMin(wake) - toMin(bed); if (m <= 0) m += 1440;
    day(el.dataset.d).sleep = { bed, wake, h: m / 60 }; save(); render(); toast(m >= 420 ? 'NICE. 7H+ BANKED.' : 'LOGGED. EARLIER TONIGHT.');
  },
  setdone: el => {
    const A = S.active, j = +el.dataset.j, i = A.i, s = A.sets[i][j];
    const W = build(A.d, A.wid), b = W.blocks[i], E = EX[b.id];
    if (s.done) { s.done = false; save(); render(); return; }
    const row = el.closest('.set');
    s.kg = row.querySelector('[data-in=kg]').value.replace(',', '.');
    s.reps = row.querySelector('[data-in=reps]').value || String(range(b.reps)[1]);
    s.done = true;
    // carry weight forward to next empty sets
    A.sets[i].forEach((x, k) => { if (k > j && !x.done && x.kg === '') x.kg = s.kg; });
    save(); buzz(40);
    const moreSets = A.sets[i].some(x => !x.done);
    const isLast = i === W.blocks.length - 1 && !moreSets;
    if (!isLast) {
      const nextB = moreSets ? b : W.blocks[i + 1];
      const nextTxt = moreSets ? `NEXT: SET ${A.sets[i].findIndex(x => !x.done) + 1}${s.kg ? ` · ${s.kg} KG` : ''}` : `NEXT: ${nextB.k === 'ex' ? EX[nextB.id].name : nextB.label}`;
      RT = { end: Date.now() + E.rest * 1000, label: E.name, next: nextTxt };
      if (!moreSets) A.i = Math.min(i + 1, W.blocks.length - 1);
      save();
    }
    render();
  },
  rt: el => { if (RT) { RT.end += +el.dataset.v * 1000; tick(); } },
  rtskip: () => { RT = null; renderOverlay(); },
  next: () => { const A = S.active; A.i++; save(); CT = null; window.scrollTo(0, 0); render(); },
  prev: () => { const A = S.active; A.i = Math.max(0, A.i - 1); save(); CT = null; window.scrollTo(0, 0); render(); },
  wexit: () => { location.hash = '#today'; keepAwake(false); },
  finish: () => {
    const A = S.active; const any = Object.values(A.sets).some(a => a.some(s => s.done)) || Object.keys(A.cdone).length;
    if (!any) { if (confirm('Nothing logged yet. Cancel this workout?')) { S.active = null; RT = null; CT = null; save(); keepAwake(false); location.hash = '#today'; } return; }
    if (!Object.values(A.sets).every(a => a.every(s => s.done)) && !confirm('Some sets aren\'t ticked. Finish anyway?')) return;
    finishWorkout();
  },
  ctgo: () => {
    if (!CT) return;
    if (CT.running) { CT.left = (CT.end - Date.now()) / 1000; CT.running = false; }
    else { const A = S.active, b = build(A.d, A.wid).blocks[CT.bi]; if (A.cdone[CT.bi]) { A.cdone[CT.bi] = false; CT.idx = 0; CT.left = b.segs[0].secs; } CT.end = Date.now() + CT.left * 1000; CT.running = true; beep(1); }
    save(); render();
  },
  ctdone: () => { const A = S.active; A.cdone[CT.bi] = !A.cdone[CT.bi]; if (A.cdone[CT.bi]) { CT.running = false; } save(); render(); },
  week: el => { const w = +el.dataset.w; S.ui.openWeek = (S.ui.openWeek ?? (today() >= PLAN.start ? weekOf(today()) : 0)) === w ? -1 : w; save(); render(); },
  padd: el => { const f = PROTEIN_FOODS[+el.dataset.i], D = day(today()); D.protein += f.g; D.pl.push(f.g); buzz(20); save(); render(); toast(`+${f.g} G ${f.n.toUpperCase()}`); },
  pcustom: el => { const v = +el.dataset.v, D = day(today()); D.protein = Math.max(0, D.protein + v); D.pl.push(v); save(); render(); },
  pundo: () => { const D = day(today()); const v = D.pl.pop(); if (v != null) D.protein = Math.max(0, D.protein - v); save(); render(); },
  water: el => { const D = day(today()), v = +el.dataset.v; D.water = D.water === v ? v - 1 : v; save(); render(); },
  share: async () => {
    const txt = 'Mak, tips untuk 10 minggu ni (sampai nikah 23 Jan):\n\n' + MAK_TIPS.map(t => '• ' + t).join('\n') + '\n\nTerima kasih Mak ❤️';
    try { if (navigator.share) await navigator.share({ text: txt }); else { await navigator.clipboard.writeText(txt); toast('Copied — paste in WhatsApp'); } } catch (e) { }
  },
  wind: el => { const D = day(today()), i = +el.dataset.i; D.wind = D.wind.includes(i) ? D.wind.filter(x => x !== i) : D.wind.concat(i); buzz(15); save(); render(); },
  wsave: () => {
    const v = +($('#w-in').value || '').replace(',', '.'); if (!(v > 35 && v < 250)) return toast('Enter your weight in kg');
    const d = today(); S.weights = S.weights.filter(x => x.d !== d).concat({ d, kg: v }); save(); render(); toast('WEIGH-IN SAVED');
  },
  waistsave: () => {
    const v = +($('#waist-in').value || '').replace(',', '.'); if (!(v > 40 && v < 200)) return toast('Enter waist in cm');
    const d = today(); S.waists = S.waists.filter(x => x.d !== d).concat({ d, cm: v }); save(); render(); toast('WAIST SAVED');
  },
  psex: el => { S.profile.sex = el.dataset.v; save(); render(); },
  psave: () => {
    const age = +$('#p-age').value, h = +$('#p-h').value.replace(',', '.');
    if (!(age > 12 && age < 100 && h > 120 && h < 230)) return toast('Check your numbers');
    S.profile.age = age; S.profile.h = h; save(); render(); toast('PROFILE UPDATED');
  },
  export: () => {
    const blob = new Blob([JSON.stringify(S, null, 1)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `sah-backup-${today()}.json`; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  },
  reset: () => { if (confirm('Delete ALL your data on this phone? This cannot be undone.') && confirm('Really? Back up first if unsure.')) { localStorage.removeItem(KEY); S = blank(); location.hash = ''; render(); } },
};
function readOnb() {
  const g = id => $(id)?.value ?? '';
  return { age: g('#o-age'), h: g('#o-h'), w: g('#o-w') };
}

document.addEventListener('click', e => {
  const el = e.target.closest('[data-a]'); if (!el) return;
  const f = ACT[el.dataset.a]; if (f) { e.preventDefault(); f(el); }
});
document.addEventListener('input', e => {
  const el = e.target;
  if (el.dataset.in && S.active) { const s = S.active.sets[S.active.i]?.[+el.dataset.j]; if (s) { s[el.dataset.in] = el.value; save(); } }
});
document.addEventListener('change', e => {
  if (e.target.id !== 'imp') return;
  const f = e.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = () => { try { const o = JSON.parse(r.result); if (!o || typeof o !== 'object' || !('days' in o)) throw 0; S = Object.assign(blank(), o); save(); render(); toast('RESTORED'); } catch (err) { toast('Not a SAH. backup file'); } };
  r.readAsText(f);
});
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { if (location.hash === '#workout' && S.active) keepAwake(true); if (!['#workout'].includes(location.hash) && !document.querySelector('input:focus')) render(); } });
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; if (!document.querySelector('input:focus')) render(); });
window.addEventListener('appinstalled', () => { deferredInstall = null; toast('INSTALLED. SEE YOU AT 5:30.'); });

if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js');
lastRoute = location.hash.split('/')[0];
render();
