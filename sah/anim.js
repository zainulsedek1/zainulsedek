/* SAH. — exercise animations. A small 2D rig (side or front view) driven by
   two keyframe poses per exercise, solved with 2-bone IK and drawn as SVG. */
'use strict';

const RIG = { T: 40, N: 5, HR: 7, UA: 25, FA: 23, TH: 36, SH: 34, FT: 11 };
const COL = { body: '#D4FF3A', far: '#71881F', prop: '#5A5A5A', propHi: '#8C8C8C', plate: '#E4E4E4', floor: '#2A2A2A' };

/* ---------- maths ---------- */
const P2 = (x, y) => ({ x, y });
function ik(a, t, l1, l2, bend) {
  const dx = t.x - a.x, dy = t.y - a.y, d = Math.hypot(dx, dy) || 0.001;
  const dc = Math.min(l1 + l2 - 0.01, Math.max(Math.abs(l1 - l2) + 0.01, d));
  const ux = dx / d, uy = dy / d;
  const A = Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + dc * dc - l2 * l2) / (2 * l1 * dc)))) * bend;
  const j = P2(a.x + l1 * (ux * Math.cos(A) - uy * Math.sin(A)), a.y + l1 * (ux * Math.sin(A) + uy * Math.cos(A)));
  const ex = t.x - j.x, ey = t.y - j.y, el = Math.hypot(ex, ey) || 1;
  return { j, e: P2(j.x + ex / el * l2, j.y + ey / el * l2) };
}
const lerp = (a, b, k) => a + (b - a) * k;
function mix(A, B, k) {
  const o = {};
  for (const key in A) {
    const a = A[key], b = B[key];
    if (Array.isArray(a) && Array.isArray(b)) o[key] = a.map((v, i) => lerp(v, b[i], k));
    else if (typeof a === 'number' && typeof b === 'number') o[key] = lerp(a, b, k);
    else o[key] = a;
  }
  return o;
}
const ease = x => x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;

/* ---------- solvers ---------- */
function solveSide(p) {
  const hip = P2(p.hip[0], p.hip[1]);
  let dir;
  if (p.sh) { const dx = p.sh[0] - hip.x, dy = p.sh[1] - hip.y, l = Math.hypot(dx, dy) || 1; dir = P2(dx / l, dy / l); }
  else { const a = (p.lean || 0) * Math.PI / 180; dir = P2(Math.sin(a), -Math.cos(a)); }
  const sh = P2(hip.x + dir.x * RIG.T, hip.y + dir.y * RIG.T);
  const tl = (p.tilt || 0) * Math.PI / 180;
  const hd = P2(dir.x * Math.cos(tl) - dir.y * Math.sin(tl), dir.x * Math.sin(tl) + dir.y * Math.cos(tl));
  const head = P2(sh.x + hd.x * (RIG.N + RIG.HR), sh.y + hd.y * (RIG.N + RIG.HR));
  const h1 = p.hand, h2 = p.hand2 || [h1[0] - 3, h1[1] - 1];
  const a1 = ik(sh, P2(h1[0], h1[1]), RIG.UA, RIG.FA, p.eb ?? 1);
  const a2 = ik(sh, P2(h2[0], h2[1]), RIG.UA, RIG.FA, p.eb2 ?? p.eb ?? 1);
  const f1 = p.ankle, f2 = p.ankle2 || [f1[0] - 4, f1[1]];
  const l1 = ik(hip, P2(f1[0], f1[1]), RIG.TH, RIG.SH, p.kb ?? -1);
  const l2 = ik(hip, P2(f2[0], f2[1]), RIG.TH, RIG.SH, p.kb2 ?? p.kb ?? -1);
  const foot = (deg, e) => { const a = deg * Math.PI / 180; return P2(e.x + Math.cos(a) * RIG.FT, e.y + Math.sin(a) * RIG.FT); };
  return {
    hip, sh, head, el: a1.j, hand: a1.e, el2: a2.j, hand2: a2.e,
    knee: l1.j, ankle: l1.e, knee2: l2.j, ankle2: l2.e,
    toe: foot(p.toe ?? 0, l1.e), toe2: foot(p.toe2 ?? p.toe ?? 0, l2.e),
  };
}
function solveFront(p) {
  const cx = 100, hipY = p.hipY, shY = hipY - RIG.T, sw = 14;
  const shR = P2(cx + sw, shY), shL = P2(cx - sw, shY);
  const head = P2(cx, shY - RIG.N - RIG.HR);
  const hR = P2(cx + p.hand[0], p.hand[1]), hL = P2(cx - p.hand[0], p.hand[1]);
  const aR = ik(shR, hR, RIG.UA, RIG.FA, p.eb ?? -1), aL = ik(shL, hL, RIG.UA, RIG.FA, -(p.eb ?? -1));
  return { front: true, cx, hipY, shY, shR, shL, head, elR: aR.j, hR: aR.e, elL: aL.j, hL: aL.e, seated: !!p.seated };
}
const solve = (A, p) => A.view === 'front' ? solveFront(p) : solveSide(p);

/* ---------- drawing ---------- */
const f1 = n => Math.round(n * 10) / 10;
const ln = (a, b, c, w, extra = '') => `<line x1="${f1(a.x)}" y1="${f1(a.y)}" x2="${f1(b.x)}" y2="${f1(b.y)}" stroke="${c}" stroke-width="${w}" stroke-linecap="round"${extra}/>`;
const circ = (p, r, fill, stroke = 'none', sw = 0) => `<circle cx="${f1(p.x)}" cy="${f1(p.y)}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;

function propSvg(pr, s) {
  const at = typeof pr.at === 'string' ? s[pr.at] : pr.at ? P2(pr.at[0], pr.at[1]) : null;
  const off = pr.off ? P2(at.x + pr.off[0], at.y + pr.off[1]) : at;
  switch (pr.t) {
    case 'line': return ln(P2(pr.a[0], pr.a[1]), P2(pr.b[0], pr.b[1]), pr.c || COL.prop, pr.w || 5);
    case 'rect': return `<rect x="${pr.x}" y="${pr.y}" width="${pr.w}" height="${pr.h}" rx="${pr.r ?? 3}" fill="${pr.fill || COL.prop}"/>`;
    case 'bench': return `<rect x="${pr.x1}" y="${pr.y}" width="${pr.x2 - pr.x1}" height="6" rx="3" fill="${COL.prop}"/>` +
      ln(P2(pr.x1 + 8, pr.y + 6), P2(pr.x1 + 8, pr.floor ?? 140), COL.prop, 4) + ln(P2(pr.x2 - 8, pr.y + 6), P2(pr.x2 - 8, pr.floor ?? 140), COL.prop, 4);
    case 'db': { // dumbbell attached to a hand
      if (pr.o === 'v') return ln(P2(off.x, off.y - 9), P2(off.x, off.y + 9), COL.propHi, 3) + `<rect x="${f1(off.x - 6)}" y="${f1(off.y - 13)}" width="12" height="6" rx="2" fill="${COL.plate}"/><rect x="${f1(off.x - 6)}" y="${f1(off.y + 7)}" width="12" height="6" rx="2" fill="${COL.plate}"/>`;
      if (pr.o === 'h') return ln(P2(off.x - 9, off.y), P2(off.x + 9, off.y), COL.propHi, 3) + `<rect x="${f1(off.x - 13)}" y="${f1(off.y - 6)}" width="6" height="12" rx="2" fill="${COL.plate}"/><rect x="${f1(off.x + 7)}" y="${f1(off.y - 6)}" width="6" height="12" rx="2" fill="${COL.plate}"/>`;
      return circ(off, pr.r || 6, COL.plate, '#0A0A0A', 1.5);
    }
    case 'plate': return circ(off, pr.r || 10, COL.plate, '#0A0A0A', 2) + circ(off, 2.5, '#0A0A0A');
    case 'handle': return `<rect x="${f1(off.x - 3)}" y="${f1(off.y - 7)}" width="6" height="14" rx="3" fill="${COL.propHi}"/>`;
    case 'cable': return ln(P2(pr.from[0], pr.from[1]), off, COL.propHi, 1.5) + circ(P2(pr.from[0], pr.from[1]), 5, 'none', COL.prop, 3);
    case 'roller': return circ(off, pr.r || 6, COL.prop);
    case 'platform': { const a = (pr.ang || 0) * Math.PI / 180, dx = Math.cos(a) * 16, dy = Math.sin(a) * 16; return ln(P2(off.x - dx, off.y - dy), P2(off.x + dx, off.y + dy), COL.propHi, 6); }
    case 'pad': return `<rect x="${f1(off.x - pr.w / 2)}" y="${f1(off.y - pr.h / 2)}" width="${pr.w}" height="${pr.h}" rx="3" fill="${COL.prop}"/>`;
  }
  return '';
}

function figureSide(s, ghost) {
  const b = ghost ? COL.far : COL.body, f = COL.far;
  const o = ghost ? ' opacity=".35"' : '';
  return `<g${o}>` +
    ln(s.hip, s.knee2, f, 8) + ln(s.knee2, s.ankle2, f, 7) + ln(s.ankle2, s.toe2, f, 5) +
    ln(s.sh, s.el2, f, 6) + ln(s.el2, s.hand2, f, 5) +
    ln(s.hip, s.sh, b, 12) + circ(s.head, RIG.HR, b) +
    ln(s.hip, s.knee, b, 8) + ln(s.knee, s.ankle, b, 7) + ln(s.ankle, s.toe, b, 5) +
    `</g>`;
}
const armSide = (s, ghost) => `<g${ghost ? ' opacity=".35"' : ''}>${ln(s.sh, s.el, ghost ? COL.far : COL.body, 6) + ln(s.el, s.hand, ghost ? COL.far : COL.body, 5)}</g>`;

function figureFront(s, ghost) {
  const b = ghost ? COL.far : COL.body, o = ghost ? ' opacity=".35"' : '';
  const cx = s.cx, hy = s.hipY;
  let legs;
  if (s.seated) legs = ln(P2(cx - 8, hy), P2(cx - 12, hy + 6), b, 9) + ln(P2(cx + 8, hy), P2(cx + 12, hy + 6), b, 9) +
    ln(P2(cx - 12, hy + 8), P2(cx - 13, 134), b, 7) + ln(P2(cx + 12, hy + 8), P2(cx + 13, 134), b, 7);
  else legs = ln(P2(cx - 7, hy), P2(cx - 11, 102), b, 8) + ln(P2(cx - 11, 102), P2(cx - 12, 136), b, 7) +
    ln(P2(cx + 7, hy), P2(cx + 11, 102), b, 8) + ln(P2(cx + 11, 102), P2(cx + 12, 136), b, 7) +
    ln(P2(cx - 12, 137), P2(cx - 19, 138), b, 5) + ln(P2(cx + 12, 137), P2(cx + 19, 138), b, 5);
  return `<g${o}>${legs}${ln(P2(cx, hy), P2(cx, s.shY + 2), b, 16)}${ln(s.shL, s.shR, b, 8)}${circ(s.head, RIG.HR, b)}` +
    `${ln(s.shR, s.elR, b, 6)}${ln(s.elR, s.hR, b, 5)}${ln(s.shL, s.elL, b, 6)}${ln(s.elL, s.hL, b, 5)}</g>`;
}

/* ---------- exercise library ---------- */
const STAND = { hip: [99, 67], lean: 0, ankle: [100, 136], kb: -1 };
const ANIM = {
  goblet_squat: { slow: 'toB', say: ['SIT DOWN BETWEEN YOUR HEELS', 'DRIVE UP · CHEST TALL'],
    props: [{ t: 'db', at: 'hand', o: 'v' }],
    A: { ...STAND, lean: 4, hand: [114, 40], eb: 1 }, B: { hip: [80, 104], lean: 28, ankle: [100, 136], kb: -1, hand: [114, 78], eb: 1 } },
  smith_squat: { slow: 'toB', say: ['SIT BACK & DOWN · KNEES OUT', 'PUSH THE FLOOR AWAY'],
    props: [{ t: 'line', a: [104, -14], b: [104, 140], c: '#3A3A3A', w: 3, back: true }, { t: 'plate', at: 'sh', off: [0, -4], r: 9 }],
    A: { hip: [97, 67], lean: 10, ankle: [108, 136], kb: -1, hand: [100, 28], eb: -1 }, B: { hip: [80, 103], lean: 38, ankle: [108, 136], kb: -1, hand: [101, 74], eb: -1 } },
  db_rdl: { slow: 'toB', say: ['HIPS BACK · BACK FLAT', 'SQUEEZE GLUTES · STAND TALL'],
    props: [{ t: 'db', at: 'hand' }],
    A: { ...STAND, lean: 3, hand: [102, 73], eb: 1 }, B: { hip: [76, 78], lean: 80, ankle: [100, 136], kb: -1, hand: [114, 116], eb: 1 } },
  leg_press: { slow: 'toB', say: ['LOWER TO 90° · BACK ON PAD', 'PUSH THROUGH HEELS'],
    props: [{ t: 'line', a: [92, 122], b: [168, 58], c: '#3A3A3A', w: 4, back: true }, { t: 'line', a: [84, 120], b: [30, 80], w: 7, back: true }, { t: 'platform', at: 'ankle', off: [3, -3], ang: -50 }],
    A: { hip: [70, 112], lean: -52, ankle: [126, 72], kb: -1, toe: -55, hand: [78, 116], eb: 1 }, B: { hip: [70, 112], lean: -52, ankle: [104, 92], kb: -1, toe: -55, hand: [78, 116], eb: 1 } },
  leg_curl: { slow: 'toA', say: ['CURL · PAUSE 1 SEC', 'LOWER SLOWLY'],
    props: [{ t: 'line', a: [68, 114], b: [120, 114], w: 7, back: true }, { t: 'line', a: [66, 112], b: [60, 62], w: 7, back: true }, { t: 'pad', at: [116, 94], w: 18, h: 7 }, { t: 'roller', at: 'ankle', off: [2, 6], r: 6 }],
    A: { hip: [80, 106], lean: -6, ankle: [148, 112], kb: -1, toe: -70, hand: [84, 110], eb: 1 }, B: { hip: [80, 106], lean: -6, ankle: [108, 138], kb: -1, toe: -10, hand: [84, 110], eb: 1 } },
  leg_ext: { slow: 'toA', say: ['STRAIGHTEN · SQUEEZE QUADS', 'LOWER SLOWLY'],
    props: [{ t: 'line', a: [68, 108], b: [120, 108], w: 7, back: true }, { t: 'line', a: [66, 106], b: [60, 56], w: 7, back: true }, { t: 'roller', at: 'ankle', off: [5, -3], r: 6 }],
    A: { hip: [80, 100], lean: -6, ankle: [114, 134], kb: -1, toe: 0, hand: [84, 104], eb: 1 }, B: { hip: [80, 100], lean: -6, ankle: [148, 102], kb: -1, toe: -80, hand: [84, 104], eb: 1 } },
  calf_raise: { slow: 'toA', say: ['RISE ALL THE WAY · SQUEEZE', 'LOWER · FULL STRETCH'], floor: 148,
    props: [{ t: 'rect', x: 92, y: 138, w: 30, h: 10, back: true }, { t: 'pad', at: 'sh', off: [2, -4], w: 16, h: 6 }],
    A: { hip: [99, 67], lean: 0, ankle: [100, 136], kb: -1, toe: -22, hand: [106, 26], eb: -1 }, B: { hip: [99, 57], lean: 0, ankle: [100, 126], kb: -1, toe: 38, hand: [106, 16], eb: -1 } },
  hip_thrust: { slow: 'toA', say: ['DRIVE HIPS UP · SQUEEZE 1 SEC', 'LOWER WITH CONTROL'],
    props: [{ t: 'bench', x1: 30, x2: 70, y: 106, back: true }, { t: 'plate', at: 'hip', off: [2, -10], r: 10 }],
    A: { hip: [98, 130], sh: [66, 104], ankle: [124, 136], kb: -1, hand: [100, 120], eb: 1, tilt: -20 }, B: { hip: [100, 104], sh: [60, 103], ankle: [124, 136], kb: -1, hand: [100, 94], eb: 1, tilt: -40 } },
  walking_lunge: { slow: 'toB', say: ['LOWER BACK KNEE TO FLOOR', 'DRIVE THROUGH FRONT HEEL'],
    props: [{ t: 'db', at: 'hand' }],
    A: { hip: [100, 67], lean: 2, ankle: [118, 136], ankle2: [82, 134], toe2: 35, kb: -1, hand: [102, 73], eb: 1 }, B: { hip: [98, 99], lean: 4, ankle: [120, 136], ankle2: [68, 134], toe2: 60, kb: -1, hand: [101, 105], eb: 1 } },
  back_ext: { slow: 'toA', say: ['RISE TO A STRAIGHT LINE', 'LOWER · BACK FLAT'], floor: false,
    props: [{ t: 'line', a: [46, 150], b: [108, 90], w: 7, back: true }, { t: 'pad', at: 'hip', off: [4, 6], w: 14, h: 8 }, { t: 'roller', at: 'ankle', off: [4, 4], r: 5 }],
    A: { hip: [100, 92], sh: [114, 134], ankle: [52, 140], kb: -1, toe: 40, hand: [110, 120], eb: -1, tilt: 10 }, B: { hip: [100, 92], sh: [128, 64], ankle: [52, 140], kb: -1, toe: 40, hand: [118, 76], eb: -1 } },
  db_bench: { slow: 'toB', say: ['LOWER TO CHEST · 2–3 SEC', 'PRESS UP & IN'],
    props: [{ t: 'bench', x1: 44, x2: 130, y: 111, back: true }, { t: 'db', at: 'hand' }],
    A: { hip: [70, 104], lean: 90, ankle: [46, 136], kb: 1, hand: [111, 57], eb: -1 }, B: { hip: [70, 104], lean: 90, ankle: [46, 136], kb: 1, hand: [101, 99], eb: -1 } },
  incline_db: { slow: 'toB', say: ['LOWER TO UPPER CHEST', 'PRESS UP & IN'],
    props: [{ t: 'line', a: [88, 114], b: [30, 80], w: 7, back: true }, { t: 'line', a: [70, 118], b: [70, 140], w: 4, back: true }, { t: 'db', at: 'hand' }],
    A: { hip: [82, 106], lean: -60, ankle: [126, 136], kb: -1, hand: [52, 40], eb: -1, tilt: -10 }, B: { hip: [82, 106], lean: -60, ankle: [126, 136], kb: -1, hand: [50, 80], eb: -1, tilt: -10 } },
  chest_press: { slow: 'toA', say: ['PRESS OUT · DON\'T LOCK HARD', 'SLOW RETURN · FEEL THE STRETCH'],
    props: [{ t: 'line', a: [66, 112], b: [104, 112], w: 7, back: true }, { t: 'line', a: [66, 110], b: [60, 56], w: 7, back: true }, { t: 'handle', at: 'hand' }],
    A: { hip: [78, 106], lean: -8, ankle: [120, 136], kb: -1, hand: [94, 70], eb: 1 }, B: { hip: [78, 106], lean: -8, ankle: [120, 136], kb: -1, hand: [119, 68], eb: 1 } },
  lat_pulldown: { slow: 'toA', say: ['PULL ELBOWS DOWN TO RIBS', 'CONTROL UP · FULL STRETCH'],
    props: [{ t: 'line', a: [70, 114], b: [108, 114], w: 7, back: true }, { t: 'roller', at: [114, 98], r: 6 }, { t: 'cable', at: 'hand', from: [88, 4] }, { t: 'rect', x: 0, y: 0, w: 0, h: 0 }],
    A: { hip: [86, 108], lean: -8, ankle: [118, 136], kb: -1, hand: [86, 22], eb: 1 }, B: { hip: [86, 108], lean: -12, ankle: [118, 136], kb: -1, hand: [96, 64], eb: 1 } },
  assisted_pullup: { slow: 'toA', say: ['PULL CHEST TO THE BAR', 'LOWER ALL THE WAY'], floor: false,
    props: [{ t: 'line', a: [70, 8], b: [130, 8], c: COL.propHi, w: 4, back: true }, { t: 'pad', at: 'knee', off: [-8, 6], w: 26, h: 6 }],
    A: { hip: [99, 92], lean: 0, ankle: [64, 128], kb: -1, toe: 0, hand: [101, 8], eb: 1 }, B: { hip: [97, 62], lean: -4, ankle: [62, 98], kb: -1, toe: 0, hand: [101, 8], eb: 1 } },
  cable_row: { slow: 'toA', say: ['ROW TO BELLY · SQUEEZE BACK', 'REACH · STRETCH'],
    props: [{ t: 'line', a: [44, 120], b: [100, 120], w: 7, back: true }, { t: 'rect', x: 128, y: 104, w: 6, h: 36, back: true }, { t: 'cable', at: 'hand', from: [160, 96] }, { t: 'handle', at: 'hand' }],
    A: { hip: [70, 114], lean: 20, ankle: [124, 126], kb: -1, toe: -75, hand: [122, 94], eb: 1 }, B: { hip: [70, 114], lean: -4, ankle: [124, 126], kb: -1, toe: -75, hand: [90, 100], eb: 1 } },
  machine_row: { slow: 'toA', say: ['ELBOWS BACK · SQUEEZE 1 SEC', 'SLOW STRETCH FORWARD'],
    props: [{ t: 'line', a: [66, 114], b: [100, 114], w: 7, back: true }, { t: 'rect', x: 102, y: 56, w: 8, h: 34, back: true }, { t: 'handle', at: 'hand' }],
    A: { hip: [80, 108], lean: 12, ankle: [120, 136], kb: -1, hand: [130, 72], eb: 1 }, B: { hip: [80, 108], lean: 12, ankle: [120, 136], kb: -1, hand: [100, 76], eb: 1 } },
  db_ohp: { slow: 'toA', say: ['PRESS STRAIGHT UP', 'LOWER TO EAR LEVEL'],
    props: [{ t: 'line', a: [76, 112], b: [72, 46], w: 7, back: true }, { t: 'line', a: [76, 112], b: [104, 112], w: 7, back: true }, { t: 'db', at: 'hand' }],
    A: { hip: [86, 108], lean: -4, ankle: [120, 136], kb: -1, hand: [92, 60], eb: 1 }, B: { hip: [86, 108], lean: -4, ankle: [120, 136], kb: -1, hand: [87, 21], eb: 1 } },
  lat_raise: { view: 'front', slow: 'toA', say: ['RAISE TO SHOULDER HEIGHT', 'LOWER SLOWLY · NO SWING'],
    props: [{ t: 'db', at: 'hR' }, { t: 'db', at: 'hL' }],
    A: { hipY: 67, hand: [17, 73], eb: -1 }, B: { hipY: 67, hand: [58, 31], eb: -1 } },
  rear_delt: { view: 'front', slow: 'toA', say: ['SWEEP ARMS OUT & BACK', 'CONTROL FORWARD'],
    props: [{ t: 'handle', at: 'hR' }, { t: 'handle', at: 'hL' }],
    A: { hipY: 100, seated: true, hand: [6, 62], eb: -1 }, B: { hipY: 100, seated: true, hand: [60, 62], eb: -1 } },
  face_pull: { slow: 'toA', say: ['PULL TO FOREHEAD · ELBOWS HIGH', 'CONTROL OUT'],
    props: [{ t: 'cable', at: 'hand', from: [182, 20] }],
    A: { ...STAND, lean: -4, hand: [140, 22], eb: -1 }, B: { ...STAND, lean: -4, hand: [104, 12], eb: -1 } },
  tri_pushdown: { slow: 'toA', say: ['PUSH DOWN · ELBOWS PINNED', 'CONTROL UP'],
    props: [{ t: 'cable', at: 'hand', from: [138, -6] }, { t: 'handle', at: 'hand' }],
    A: { ...STAND, lean: 10, hand: [124, 46], eb: 1 }, B: { ...STAND, lean: 10, hand: [110, 76], eb: 1 } },
  db_curl: { slow: 'toA', say: ['CURL UP · ELBOWS STILL', 'LOWER 2–3 SEC'],
    props: [{ t: 'db', at: 'hand' }],
    A: { ...STAND, hand: [102, 74], eb: 1 }, B: { ...STAND, hand: [117, 37], eb: 1 } },
  hammer_curl: { slow: 'toA', say: ['CURL UP · PALMS FACING IN', 'LOWER 2–3 SEC'],
    props: [{ t: 'db', at: 'hand', o: 'h' }],
    A: { ...STAND, hand: [102, 74], eb: 1 }, B: { ...STAND, hand: [117, 37], eb: 1 } },
  cable_crunch: { slow: 'toA', say: ['CRUNCH RIBS TO HIPS', 'SLOWLY BACK UP'],
    props: [{ t: 'cable', at: 'hand', from: [150, 0] }],
    A: { hip: [100, 100], lean: 15, ankle: [66, 136], kb: 1, toe: 0, hand: [116, 54], eb: 1 }, B: { hip: [100, 100], lean: 72, ankle: [66, 136], kb: 1, toe: 0, hand: [146, 84], eb: 1, tilt: 20 } },
  knee_raise: { slow: 'toA', say: ['KNEES TO CHEST · CURL PELVIS', 'LOWER SLOWLY'], floor: false,
    props: [{ t: 'line', a: [86, 16], b: [86, 112], w: 7, back: true }, { t: 'line', a: [92, 84], b: [128, 84], w: 6, front: true }],
    A: { hip: [96, 98], lean: 0, ankle: [99, 166], kb: -1, toe: 60, hand: [122, 80], eb: 1 }, B: { hip: [96, 98], lean: -4, ankle: [118, 112], kb: -1, toe: 40, hand: [122, 80], eb: 1 } },
  plank: { slow: 'toA', tB: 2.2, tA: 2.2, say: ['BRACE · SQUEEZE GLUTES', 'BREATHE · STRAIGHT LINE'],
    A: { hip: [91, 120], sh: [130, 112], ankle: [22, 134], kb: 1, toe: 95, hand: [152, 136], eb: 1, tilt: 10 }, B: { hip: [91, 119], sh: [130, 111], ankle: [22, 134], kb: 1, toe: 95, hand: [152, 136], eb: 1, tilt: 10 } },
  side_plank: { slow: 'toA', say: ['LIFT HIPS · STRAIGHT LINE', 'HOLD · DON\'T SAG'],
    A: { hip: [92, 131], sh: [130, 112], ankle: [22, 136], kb: 1, toe: 0, hand: [134, 137], eb: 1 }, B: { hip: [91, 118], sh: [130, 112], ankle: [22, 136], kb: 1, toe: 0, hand: [134, 137], eb: 1 } },
  dead_bug: { slow: 'toB', say: ['REACH OPPOSITE ARM + LEG', 'RETURN · LOWER BACK DOWN'],
    A: { hip: [80, 132], lean: 90, ankle: [46, 96], ankle2: [49, 96], kb: 1, toe: -90, hand: [121, 86], hand2: [118, 86], eb: 1 },
    B: { hip: [80, 132], lean: 90, ankle: [46, 96], ankle2: [12, 124], kb: 1, toe: -90, toe2: -100, hand: [166, 126], hand2: [118, 86], eb: 1 } },
};

/* ---------- player ---------- */
function bounds(A, poses, floorY) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  const add = (p, r = 0) => { if (!p || typeof p.x !== 'number') return; x0 = Math.min(x0, p.x - r); x1 = Math.max(x1, p.x + r); y0 = Math.min(y0, p.y - r); y1 = Math.max(y1, p.y + r); };
  poses.forEach(s => Object.keys(s).forEach(k => add(s[k], k === 'head' ? RIG.HR : 4)));
  (A.props || []).forEach(pr => {
    if (pr.a) { add(P2(...pr.a)); add(P2(...pr.b)); }
    if (pr.from) add(P2(...pr.from), 6);
    if (pr.t === 'bench') { add(P2(pr.x1, pr.y)); add(P2(pr.x2, pr.y)); }
    if (pr.t === 'rect' && pr.w) { add(P2(pr.x, pr.y)); add(P2(pr.x + pr.w, pr.y + pr.h)); }
    if (Array.isArray(pr.at)) add(P2(...pr.at), 8);
  });
  if (floorY) add(P2(x0, floorY + 2));
  const pad = 12; x0 -= pad; y0 -= pad; x1 += pad; y1 += pad;
  let w = x1 - x0, h = y1 - y0; const ar = 1.5;
  if (w / h < ar) { const nw = h * ar; x0 -= (nw - w) / 2; w = nw; } else { const nh = w / ar; y0 -= (nh - h) / 2; h = nh; }
  return { x0, y0, w, h };
}
function frame(A, k, ghostK) {
  const floorY = A.floor === false ? null : (A.floor || 140);
  const P = mix(A.A, A.B, k), s = solve(A, P);
  let out = '';
  if (floorY) out += `<line x1="-500" y1="${floorY}" x2="700" y2="${floorY}" stroke="${COL.floor}" stroke-width="2"/>`;
  const props = A.props || [];
  props.filter(p => p.back).forEach(p => out += propSvg(p, s));
  if (ghostK != null) { const g = solve(A, mix(A.A, A.B, ghostK)); out += g.front ? figureFront(g, true) : figureSide(g, true) + armSide(g, true); }
  if (s.front) out += figureFront(s);
  else out += figureSide(s);
  props.filter(p => !p.back && !p.front && p.t === 'cable').forEach(p => out += propSvg(p, s));
  if (!s.front) out += armSide(s);
  props.filter(p => !p.back && p.t !== 'cable').forEach(p => out += propSvg(p, s));
  return out;
}
function phase(A, t) {
  const slowB = A.slow === 'toB';
  const dB = A.tB ?? (slowB ? 1.9 : 1.0), dA = A.tA ?? (slowB ? 1.0 : 1.9), hB = 0.4, hA = 0.55;
  let x = t % (dB + hB + dA + hA);
  if (x < dB) return { k: ease(x / dB), say: 0 };
  x -= dB; if (x < hB) return { k: 1, say: 0 };
  x -= hB; if (x < dA) return { k: 1 - ease(x / dA), say: 1 };
  return { k: 0, say: 1 };
}

const Anim = (() => {
  let items = [], raf = 0;
  const reduced = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function mount(root = document) {
    items = [];
    root.querySelectorAll('[data-anim]').forEach(el => {
      const A = ANIM[el.dataset.anim]; if (!A) { el.remove(); return; }
      const floorY = A.floor === false ? null : (A.floor || 140);
      const ss = [0, 0.5, 1].map(k => solve(A, mix(A.A, A.B, k)));
      const vb = bounds(A, ss, floorY);
      el.innerHTML = `<span class="anim-tag">HOW IT MOVES</span><svg viewBox="${f1(vb.x0)} ${f1(vb.y0)} ${f1(vb.w)} ${f1(vb.h)}" role="img" aria-label="Animation of the movement"><g></g></svg><p class="anim-say"></p>`;
      const it = { A, g: el.querySelector('g'), say: el.querySelector('.anim-say'), last: -1, t0: performance.now() };
      if (reduced()) { it.g.innerHTML = frame(A, 1, 0); it.say.textContent = `${A.say[0]} → ${A.say[1]}`; }
      else items.push(it);
    });
    cancelAnimationFrame(raf);
    if (items.length) raf = requestAnimationFrame(loop);
  }
  function loop(now) {
    items = items.filter(it => it.g.isConnected);
    if (!items.length) return;
    items.forEach(it => {
      const ph = phase(it.A, (now - it.t0) / 1000);
      it.g.innerHTML = frame(it.A, ph.k);
      if (ph.say !== it.last) { it.say.textContent = it.A.say[ph.say]; it.last = ph.say; }
    });
    raf = requestAnimationFrame(loop);
  }
  return { mount, has: id => !!ANIM[id] };
})();
