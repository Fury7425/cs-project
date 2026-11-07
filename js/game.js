/* game.js — engine: flow runner, overworld, quests, visual-novel dialogue layer.
   Reads window.STORY; uses Sprites/Portraits/Music/Sfx/Voice/Cutscenes when present. */
(() => {
'use strict';
const $ = id => document.getElementById(id);
const g = $('c').getContext('2d');
const V = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const SOLID = 'TPWRBYXGD#HMQ';
const ST = window.STORY || { characters: {}, flow: [], acts: {} };
const CH = ST.characters || {};
const SAVE = 'yonsei-v2';

// ---------- safe wrappers (a missing module must never crash the game) ----------
const call = (o, m, ...a) => { try { return o && o[m] ? o[m](...a) : undefined; } catch (e) { return undefined; } };
const sfx = (n, pitch) => call(window.Sfx, 'play', n, pitch);
const music = (id, o) => id && call(window.Music, 'play', id, o);
const cuts = () => window.Cutscenes;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const store = { get: k => { try { return localStorage.getItem(k); } catch { return null; } },
                set: (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch {} } };

// ---------- state ----------
let mode = 'ov', ovNext = null, ovAlt = null, frame = 0, actT = 0, toastT, started = false;
let fi = 0, resumeSi = 0, flags = {}, act = null, actId = '', scene = null; // flow index, story flags, active act, full-screen vn scene
let map = null, exitPos = null, ents = [], mobs = [], fx = [], lanes = new Set(), p;
let si = 0, prog = 0, hearts = 3, grace = 0, failed = false, running = false, shake = 0, fade = 0, fadeDir = 0, fadeCb = null, lastBump = 0;
const stats = { t0: Date.now(), caught: 0, wrong: 0, rec: new Set() };
const held = [];
const flagOK = f => f[0] === '!' ? !flags[f.slice(1)] : !!flags[f];

const step = () => act && act.steps[si];
const unlocked = () => act && si >= act.steps.length;
const itemLook = e => typeof e.item === 'string' ? e.item : (e.sprite || e.tag); // sprite first: quest tags like 'mat' have no art
// `from`/`until` = step indexes, so people only stand on the map in the years they belong to
// `away`: a persuaded patient walks off to the hospital and is back (healed) once the whole step is done
const present = e => (e.from == null || si >= e.from) && (e.until == null || si < e.until) && !(e.away && e.done && step()?.tag === e.tag);
const visible = e => present(e) && (!e.item || (!e.done && (e.tag === 'heart' || step()?.tag === e.tag)));
const entAt = (x, y) => ents.find(e => !e.item && present(e) && e.x === x && e.y === y);
const recable = e => !e.item && e.id !== 'quiz';
const recKey = e => `${actId}:${e.k0}`;
const isTarget = e => { const s = step(); return s && !e.item && present(e) && ((s.who && s.who === e.id) || (s.tag && s.tag === e.tag && !e.done)); };
const totalRec = () => Object.values(ST.acts || {}).reduce((n, a) => n + (a.ents || []).filter(recable).length, 0);

function hud() {
  $('hl').textContent = act ? act.title : '연세 역사 탐험';
  $('hr').style.color = '';
  if (!act) { $('hr').textContent = ''; return; }
  const s = step(), n = act.steps.length;
  const goal = s ? `목표 [${si + 1}/${n}] ${s.goal}${s.need ? ` (${prog}/${s.need})` : ''}` : `목표: ${act.hint}로 나가기`;
  $('hr').innerHTML = mark((act.hearts ? `화충 ${'♥'.repeat(hearts)}${'♡'.repeat(3 - hearts)} · ` : '') + goal);
}
function toast(m) {
  $('hr').style.color = '#fc0'; $('hr').textContent = m;
  clearTimeout(toastT); toastT = setTimeout(hud, 2200);
}
function burst(x, y, c, n = 10) {
  for (let i = 0; i < n; i++) { const a = Math.PI * 2 * i / n; fx.push({ x: x + 8, y: y + 8, vx: Math.cos(a) * 1.5, vy: Math.sin(a) * 1.5 - 1, t: 30, c }); }
}

// ---------- title / end overlay ----------
function overlay(html, next, alt) {
  mode = 'ov'; $('ov').innerHTML = html; $('ov').style.display = 'flex'; $('ov').className = '';
  const close = f => () => { $('ov').style.display = 'none'; mode = 'play'; ovAlt = null; f(); };
  ovNext = close(next); ovAlt = alt && close(alt);
  const b = $('ov').querySelector('button');
  if (b) b.onclick = e => { e.stopPropagation(); const f = ovAlt; ovNext = null; f && f(); };
}
function showTitle() {
  act = null; map = null; scene = { bg: 'title', t: 0 }; hud(); music('title');
  let sv = null; try { sv = JSON.parse(store.get(SAVE)); } catch {}
  const can = sv && sv.fi > 0 && ST.flow[sv.fi];
  overlay(`<p class="kicker">1885 — 1957</p><h1>연세 역사 탐험</h1><p class="sub">기록관</p>
    <p class="dim">방향키로 걷고, Z 키로 사람들과 이야기하세요.</p>
    ${can ? '<button>이어하기 (C)</button>' : ''}
    <p class="blink">Z 키를 눌러 처음부터 시작</p>`,
    newGame, can ? () => {
      flags = sv.flags || {}; stats.rec = new Set(sv.rec || []);
      stats.caught = sv.caught || 0; stats.wrong = sv.wrong || 0; stats.t0 = Date.now() - (sv.ms || 0); // play time carries over
      resumeSi = sv.si || 0; runFlow(sv.fi);
    } : null);
  $('ov').className = 'title';
}
function newGame() {
  flags = {}; stats.t0 = Date.now(); stats.caught = stats.wrong = 0; stats.rec = new Set();
  const m = /f=(\d+)/.exec(location.hash); // dev shortcut: index.html#f=N jumps to flow item N
  runFlow(m ? +m[1] : 0);
}

// ---------- flow runner ----------
// si = quest step inside the current act, so a reload resumes mid-act instead of replaying the whole act
function save() { store.set(SAVE, JSON.stringify({ fi, si: act ? si : 0, flags, rec: [...stats.rec], caught: stats.caught, wrong: stats.wrong, ms: Date.now() - stats.t0 })); }
function nextFlow() { runFlow(fi + 1); }
function runFlow(i) {
  fi = i; scene = null; act = null; map = null; save();
  const it = ST.flow[fi];
  if (!it) return credits();
  hud();
  if (it.type === 'cutscene') {
    mode = 'cut';
    if (!cuts() || !cuts().play) return nextFlow();
    cuts().play(it.id, () => { $('cut').style.display = 'none'; nextFlow(); });
  } else if (it.type === 'vn') {
    mode = 'scene'; scene = { bg: it.bg || 'black', t: 0 }; fade = 1; fadeDir = -1;
    music(it.music);
    say(it.script, nextFlow);
  } else if (it.type === 'act') loadAct(it.id);
  else if (it.type === 'credits') credits();
  else nextFlow();
}
function credits() {
  scene = null; act = null; map = null; hud(); store.set(SAVE, null);
  const lines = (ST.credits || []).filter(s => typeof s === 'string');
  // the player's own choices, read back as the diary would record them
  const mine = [['trust_bokdong', '1885 · 폰을 훔친 아이에게 웃어 주었다', '1885 · 폰을 훔친 아이를 붙잡았다'],
    ['watched_surgery', '1885 · 수술 내내 등불을 들고 눈을 떼지 않았다', '1885 · 칼날 앞에서 고개를 돌렸다'],
    ['called_out', '1908 · 박서양을 향한 말에 맞섰다', '1908 · 아무 말도 하지 못했다'],
    ['promised_underwood', '1915 · 언더우드에게 "꼭 보실 거예요"라고 말했다', '1915 · 언더우드의 신촌 이야기를 끝까지 들었다'],
    ['told_future', '1941 · 복동에게 해방의 날을 알려 주었다', '1941 · 복동의 물음에 말없이 고개를 저었다']]
    .map(([f, y, n]) => flags[f] ? y : n);
  const sec = Math.round((Date.now() - stats.t0) / 1000), n = stats.rec.size, T = totalRec();
  const rank = n >= T && !stats.wrong ? '연세 역사 마스터' : n >= T * .6 ? '연세 역사 탐험가' : '새내기 연세인';
  overlay(`<p class="kicker">기록관 · 1885 — 1957</p><h1>마지막 장</h1>
    <p class="dim">역사 기록 ${n}/${T} · 퀴즈 오답 ${stats.wrong} · 붙잡힘 ${stats.caught} · ${Math.floor(sec / 60)}분 ${sec % 60}초</p>
    <h2 class="gold">칭호: ${rank}</h2>
    <div class="credits"><b>연우가 남긴 기록</b><br>${mine.map(esc).join('<br>')}<br><br>${lines.map(esc).join('<br>')}</div>
    <p class="blink">Z 키를 눌러 처음으로</p>`, showTitle);
}

// ---------- act loading ----------
function loadAct(id, again) {
  const a = (ST.acts || {})[id];
  if (!a) return nextFlow();
  act = a; actId = id; scene = null; si = 0; prog = 0; hearts = 3; fx = [];
  map = a.map.map(r => [...r]);
  exitPos = map.flatMap((r, y) => r.map((t, x) => t === 'E' ? [x, y] : null)).find(Boolean);
  ents = (a.ents || []).map(e => ({ ...e, dir: 'down', done: 0, k0: `${e.x},${e.y}` }));
  scatter();
  mobs = (a.mobs || []).filter(([, r]) => r && r.length > 1).map(([kind, route]) =>
    ({ kind, route, ri: 0, rd: 1, x: route[0][0], y: route[0][1], px: route[0][0] * 16, py: route[0][1] * 16, dir: 'down', wait: 0 }));
  lanes = new Set(); // every tile a mob walks or a guard can see from its lane: never a respawn point
  for (const { route } of mobs)
    for (let i = 1; i < route.length; i++) {
      const [ax, ay] = route[i - 1], [bx, by] = route[i], dx = Math.sign(bx - ax), dy = Math.sign(by - ay);
      for (let k = -3, n = Math.abs(bx - ax) + Math.abs(by - ay) + 3; k <= n; k++) lanes.add(`${ax + dx * k},${ay + dy * k}`);
    }
  for (const { route } of mobs) for (const [wx, wy] of route) for (let k = -3; k <= 3; k++) { lanes.add(`${wx + k},${wy}`); lanes.add(`${wx},${wy + k}`); } // glances at turns
  const [x, y] = a.start;
  p = { x, y, px: x * 16, py: y * 16, dir: 'up', anim: 0, walk: 0, cp: [x, y], inv: 0 };
  mode = 'play'; fade = 1; fadeDir = -1; actT = 240; music(a.music || id);
  const resume = resumeSi; resumeSi = 0;
  if (resume) { // replay the finished steps silently: buildings, swapped-in `after` lines, done pick-ups
    for (; si < resume && si < a.steps.length; si++) {
      const s = a.steps[si];
      for (const [bx, by, roof, wall] of s.build || []) { [...roof].forEach((c, k) => map[by][bx + k] = c); [...wall].forEach((c, k) => map[by + 1][bx + k] = c); }
      for (const e of ents) if ((s.who && e.id === s.who) || (s.tag && e.tag === s.tag)) { if (s.tag) e.done = 1; if (e.after) e.script = e.after; }
    }
    if (SOLID.includes(map[p.y][p.x])) { p.y++; p.py = p.y * 16; }
    hud(); return toast('이어서 진행합니다 · ' + (step() ? step().goal : act.hint + '로 나가기'));
  }
  hud();
  if (!again) say(a.intro);
}
// semi-random spawn: items and `hurt`/scatter entities land on a random reachable tile within 3 of their authored spot
function scatter() {
  const key = (x, y) => `${x},${y}`, [sx, sy] = act.start;
  const movable = e => e.item || e.scatter || e.tag === 'hurt';
  const reach = new Set([key(sx, sy)]), q = [[sx, sy]];
  while (q.length) { // BFS over walkable ground so nothing spawns somewhere unreachable
    const [x, y] = q.shift();
    for (const [dx, dy] of Object.values(V)) {
      const nx = x + dx, ny = y + dy, t = map[ny]?.[nx], k = key(nx, ny);
      if (t && !SOLID.includes(t) && t !== 'E' && !reach.has(k)) { reach.add(k); q.push([nx, ny]); }
    }
  }
  const taken = new Set([key(sx, sy), ...ents.filter(e => !e.item && !movable(e)).map(e => key(e.x, e.y))]);
  for (const [, route] of act.mobs || []) // keep solid NPCs off patrol lanes
    for (let i = 1; i < route.length; i++) {
      let [x, y] = route[i - 1]; const [tx, ty] = route[i];
      for (; ; x += Math.sign(tx - x), y += Math.sign(ty - y)) { taken.add('m' + key(x, y)); if (x === tx && y === ty) break; }
    }
  for (const e of ents) {
    if (!movable(e)) continue;
    const c = [];
    for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
      const x = e.x + dx, y = e.y + dy, k = key(x, y);
      if (reach.has(k) && '.,F'.includes(map[y][x]) && !taken.has(k) && (e.item || !taken.has('m' + k))) c.push([x, y]);
    }
    if (c.length) [e.x, e.y] = c[(Math.random() * c.length) | 0];
    taken.add(key(e.x, e.y));
  }
}
function leave() {
  mode = 'fade'; fadeDir = 1; sfx('quest');
  fadeCb = nextFlow;
}

// ---------- quest ----------
function complete() {
  const s = step();
  for (const [x, y, roof, wall] of s.build || []) {
    [...roof].forEach((c, k) => map[y][x + k] = c);
    [...wall].forEach((c, k) => map[y + 1][x + k] = c);
    for (let k = 0; k < roof.length; k += 2) burst((x + k) * 16, (y + 1) * 16, '#f8e050', 6);
    shake = 8;
    if (SOLID.includes(map[p.y][p.x])) { p.y = y + 3; p.px = p.x * 16; p.py = p.y * 16; } // don't trap player inside new building
  }
  if (s.set) flags[s.set] = true;
  if (s.warp) { [p.x, p.y] = s.warp; p.px = p.x * 16; p.py = p.y * 16; p.dir = 'down'; } // the scene moved the player (e.g. out a back window)
  si++; prog = 0; save(); if (!lanes.has(`${p.x},${p.y}`)) p.cp = [p.x, p.y]; hud(); sfx('quest'); burst(p.px, p.py, '#f8e050');
  const next = () => toast(unlocked() ? `출구가 열렸어요! → ${act.hint}` : `새 목표: ${step().goal}`);
  s.done ? say(s.done, next) : next();
}
function count() { prog++; hud(); if (prog >= step().need) complete(); }

function talk(e) {
  if (!/^(sign|notice_board)$/.test(e.sprite)) e.dir = { up: 'down', down: 'up', left: 'right', right: 'left' }[p.dir];
  const isNew = recable(e) && !stats.rec.has(recKey(e));
  if (recable(e)) stats.rec.add(recKey(e));
  const s = step();
  if (s?.who && s.who === e.id) {
    const fin = () => { if (e.after) e.script = e.after; complete(); };
    if (!s.quiz) return say(s.script || e.script, fin);
    const intro = s.script || [{ id: 'quiz_intro', who: 'keeper', text: '이 시대의 기록을 지키려면 내 질문에 답해야 하오.' }];
    openVN(!!scene); return runScript(intro, () => quiz(s.quiz, fin));
  }
  if (s?.tag && e.tag === s.tag && !e.done) {
    failed = false;
    return say(e.q || e.script, () => {
      if (failed) { failed = false; return toast('설득에 실패했다… 다시 말을 걸어 다른 말을 해 보자.'); }
      e.done = 1; burst(e.x * 16, e.y * 16, '#80f080');
      if (e.after) e.script = e.after; count();
    });
  }
  say(e.script, isNew ? () => { sfx('confirm'); toast(`역사 기록 수집! (${stats.rec.size}/${totalRec()})`); } : null);
}
// quiz runs inside an already-open VN session; every question is a choice line from the keeper.
// A wrong answer repeats the question with the answers reshuffled, so guessing by position doesn't work.
function quiz(qs, done) {
  let i = 0;
  const who = 'keeper';
  const ask = () => {
    if (i >= qs.length) return showLine({ who, mood: 'smile', text: '훌륭하오! 이 시대의 기록은 그대가 지켰소.' }, () => { closeVN(); done(); });
    const Q = qs[i], order = Q.a.map((_, k) => k).sort(() => Math.random() - .5);
    showLine({ who, text: `Q${i + 1}/${qs.length}. ${Q.q}`, choice: order.map(k => ({ text: Q.a[k], fn: () => {
      if (k === Q.c) { sfx('ok'); i++; showLine({ who, mood: 'smile', text: `정답! ${Q.why}` }, ask); }
      else { // same question again, answers reshuffled; the miss still counts against the final title
        sfx('bad'); stats.wrong++; shake = 6;
        showLine({ who, text: '땡! 기록이 흐트러졌소.\n다시 생각해 보시오.' }, ask);
      }
    } })) }, null);
  };
  ask();
}
function pickup() {
  const it = ents.find(e => e.item && visible(e) && e.x === p.x && e.y === p.y);
  if (!it) return;
  const look = itemLook(it);
  it.done = 1; sfx(look === 'heart' ? 'heart' : look === 'page' ? 'page' : 'pick');
  burst(it.x * 16, it.y * 16, { coin: '#f8e050', brick: '#e07050', wood: '#c89058', page: '#ffffff', heart: '#ff6080' }[look] || '#ffffff');
  if (it.tag === 'heart') { hearts = Math.min(3, hearts + 1); hud(); toast('화충의 기운이 되살아났다! ♥'); }
  else count();
}

function caught(kind) {
  burst(p.px, p.py, kind === 'doubt' ? '#b080e0' : '#ff4040');
  p.x = p.cp[0]; p.y = p.cp[1]; p.px = p.x * 16; p.py = p.y * 16; p.inv = 90;
  shake = 12; sfx('bad'); stats.caught++;
  for (const m of mobs) if (m.kind === 'doubt') { m.chase = false; m.wait = 90; } // blobs back off so the respawn isn't a trap
  if (kind === 'doubt') return say(act.doubtLines || ['편견과 오해에 가로막혔다…', '제자리로 돌아간다.']);
  hearts--; hud();
  if (hearts > 0) return say([{ id: 'sys_guard_1', who: 'guard', text: '"거기 누구냐!"' }, `감시에 걸렸다! 화충의 기운이 줄었다… (${'♥'.repeat(hearts)})\n임무를 받은 자리로 돌아간다.`]);
  say([{ id: 'sys_guard_2', who: 'guard', text: '"거기 누구냐!"' }, '화충의 기운이 모두 꺼졌다…\n지금 목표를 처음부터 다시 시작한다.'], () => { resumeSi = si; loadAct(actId, true); });
}

function act_() {
  const C = cuts();
  if (C && C.active) { call(C, 'key', 'KeyZ'); return; } // touch A button during a cutscene
  if (mode === 'ov') { const f = ovNext; ovNext = null; f && f(); return; }
  if (vn.open) { vnAdvance(); return; }
  if (mode !== 'play' || !map || p.px !== p.x * 16 || p.py !== p.y * 16) return;
  const [dx, dy] = V[p.dir], e = entAt(p.x + dx, p.y + dy);
  if (e) talk(e);
}

function free(x, y) {
  const t = map[y]?.[x];
  if (!t || SOLID.includes(t)) return false;
  if (t === 'E' && !unlocked()) { toast(`퀘스트를 먼저 끝내야 해요 → ${step().goal}`); return false; }
  return !entAt(x, y);
}

// ---------- visual-novel dialogue layer ----------
const vn = { open: false, st: 'idle', ln: null, text: '', n: 0, adv: null, opts: null, sel: 0, lock: 0, bl: 0, pitch: 1, L: null, R: null, side: null };
const NAMES = { me: '연우', guard: '순사', keeper: '기록관' };
const backlog = []; // [name, text] of recent lines, shown with L
function toggleLog() {
  const el = $('vnLog'), on = el.style.display !== 'block';
  el.style.display = on ? 'block' : 'none';
  if (!on) return;
  el.innerHTML = '<p class="dim">지난 대화 · L / Z 로 닫기</p>' +
    backlog.map(([n, t]) => `<p>${n ? `<b>${esc(n)}</b>  ` : ''}${mark(t)}</p>`).join('');
  el.scrollTop = el.scrollHeight;
}
$('vnLog').onclick = e => { e.stopPropagation(); toggleLog(); };
const pctx = { L: $('vnL').firstElementChild.getContext('2d'), R: $('vnR').firstElementChild.getContext('2d') };
function openVN(full) {
  vn.open = true; vn.L = vn.R = null; vn.side = null; vn.st = 'idle';
  $('vn').style.display = 'block';
  $('vn').classList.toggle('full', !!full); $('vn').classList.remove('narr');
  $('vnL').classList.remove('on'); $('vnR').classList.remove('on');
}
function closeVN() {
  vn.open = false; vn.st = 'idle'; $('vn').style.display = 'none'; call(window.Voice, 'stop');
  grace = 50; // a mob that wandered next to the player mid-conversation can't catch them the instant it closes
  if (scene && scene.temp) scene = null;
}
function say(script, onEnd) {
  if (!script || !script.length) { onEnd && onEnd(); return; }
  if (!vn.open) openVN(!!scene);
  runScript(script, () => { closeVN(); onEnd && onEnd(); });
}
// plays lines in order; skips lines whose `if` flag is unset; calls done() after the last
function runScript(script, done) {
  let i = 0;
  const next = () => {
    while (i < script.length && script[i] && script[i].if && !flagOK(script[i].if)) i++;
    if (i >= script.length) return done && done();
    showLine(script[i++], next);
  };
  next();
}
function showLine(ln, adv) {
  if (typeof ln === 'string') ln = { text: ln };
  vn.ln = ln; vn.adv = adv; vn.text = ln.text || ''; vn.n = 0; vn.st = 'type'; vn.sel = 0; vn.opts = null; vn.bl = 0; vn.lock = 0;
  if (ln.bg) { // inside an act, `bg` lifts the conversation off the street map onto its own backdrop until the VN closes
    if (!scene) { scene = { temp: true }; $('vn').classList.add('full'); }
    if (ln.bg === 'map' && scene.temp) { scene = null; $('vn').classList.remove('full'); }
    else { scene.bg = ln.bg; scene.t = 0; }
  }
  const who = ln.who === 'narrator' ? null : ln.who, ch = who ? (CH[who] || {}) : null, narr = !who;
  $('vn').classList.toggle('narr', narr);
  const nm = $('vnName');
  if (narr) nm.style.display = 'none';
  else {
    nm.style.display = 'block'; nm.style.background = ch.color || '#556';
    nm.innerHTML = esc(ch.name || NAMES[who] || who) + (ch.title ? `<small>${esc(ch.title)}</small>` : '');
    const k = (ln.side || (who === 'me' ? 'right' : 'left')) === 'right' ? 'R' : 'L', prev = vn[k];
    const slot = { id: ch.portrait || who, mood: ln.mood || 'neutral' };
    if (!prev || prev.id !== slot.id) { const el = $('vn' + k); el.classList.remove('in'); void el.offsetWidth; el.classList.add('in'); }
    vn[k] = slot; vn.side = k;
    let h = 0; for (const c of who) h = (h * 31 + c.charCodeAt(0)) % 100;
    vn.pitch = 0.8 + h / 100 * 0.6; // per-speaker blip pitch
  }
  $('vnL').classList.toggle('dim', vn.side !== 'L'); $('vnR').classList.toggle('dim', vn.side !== 'R');
  $('vnText').textContent = ''; $('vnChoices').innerHTML = ''; $('vnNext').style.visibility = 'hidden';
  if (vn.text) { backlog.push([who ? (ch.name || NAMES[who] || who) : '', vn.text]); if (backlog.length > 60) backlog.shift(); }
  if (ln.sfx) sfx(ln.sfx);
  if (ln.id) { call(window.Voice, 'stop'); try { Promise.resolve(call(window.Voice, 'play', ln.id)).catch(() => {}); } catch {} }
}
// key places/items get their own colour; t = full line, n = chars typed so far
const KW = (() => {
  const m = new Map(); for (const [c, ws] of Object.entries(ST.keywords || {})) for (const w of ws) m.set(w, c);
  const ws = [...m.keys()].sort((a, b) => b.length - a.length).map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return { m, re: ws.length ? new RegExp(ws.join('|'), 'g') : null };
})();
function mark(t, n = t.length) {
  let out = '', i = 0;
  if (KW.re) for (const x of t.matchAll(KW.re)) {
    if (x.index >= n) break;
    const e = Math.min(n, x.index + x[0].length);
    out += esc(t.slice(i, x.index)) + `<span class="kw-${KW.m.get(x[0])}">${esc(t.slice(x.index, e))}</span>`; i = e;
  }
  return out + esc(t.slice(i, n));
}
window.markKW = mark; // cutscene captions use the same highlighting
function vnFinish() {
  vn.n = vn.text.length; $('vnText').innerHTML = mark(vn.text);
  let opts = (vn.ln.choice || []).filter(o => !o.if || flagOK(o.if));
  if (opts.some(o => o.fail)) opts = opts.map(o => [Math.random(), o]).sort((a, b) => a[0] - b[0]).map(x => x[1]); // persuasion: no fixed "right slot"
  if (opts.length) { vn.st = 'choice'; vn.opts = opts; vn.sel = 0; vn.cl = 36; renderChoices(); sfx('select'); return; } // cl: Z-mashing through text can't auto-pick
  vn.st = 'done'; vn.lock = vn.ln.pause ? Math.ceil(vn.ln.pause / 16.7) : 0; // pause = beat before ▼ appears
  if (!vn.lock) $('vnNext').style.visibility = 'visible';
}
function renderChoices() {
  $('vnChoices').innerHTML = vn.opts.map((o, k) => `<div data-k="${k}" class="${k === vn.sel ? 'on' : ''}">${k === vn.sel ? '▶' : '　'} ${mark(o.text)}</div>`).join('');
}
function pick(k) {
  const o = vn.opts[k]; if (!o) return;
  sfx('confirm'); if (o.set) flags[o.set] = true;
  if (o.fail) failed = true; // a wrong argument: the conversation ends without counting, talk again to retry
  const adv = vn.adv; vn.st = 'gap'; vn.opts = null; $('vnChoices').innerHTML = '';
  if (o.fn) return o.fn();
  if (o.next) return runScript(o.next, adv);
  adv && adv();
}
function vnAdvance() {
  if (vn.st === 'type') return vnFinish();
  if (vn.st === 'choice') return vn.cl ? undefined : pick(vn.sel);
  if (vn.st === 'done' && !vn.lock) { const f = vn.adv; vn.st = 'gap'; $('vnNext').style.visibility = 'hidden'; f && f(); }
}
function vnUpdate() {
  if (vn.cl > 0) vn.cl--;
  if (vn.lock > 0 && --vn.lock === 0 && vn.st === 'done') $('vnNext').style.visibility = 'visible';
  if (vn.st !== 'type') return;
  const len = vn.text.length, before = Math.floor(vn.n);
  vn.n = Math.min(len, vn.n + 1.5); // ~90 chars/s; Z still finishes the line instantly
  const now = Math.floor(vn.n);
  if (now !== before) {
    $('vnText').innerHTML = mark(vn.text, now);
    vn.bl += now - before;
    if (vn.bl >= 4 + (now & 1)) { vn.bl = 0; if (/\S/.test(vn.text[now - 1] || '')) sfx('blip', vn.pitch); }
  }
  if (now >= len) vnFinish();
}
function drawPortraits() {
  for (const k of ['L', 'R']) {
    const s = vn[k], c = pctx[k], el = $('vn' + k);
    c.clearRect(0, 0, 64, 64);
    let img = null;
    const NOPORT = ['narrator', 'official', 'commoner_m', 'commoner_f', 'hurt', 'hurt_f', 'worker', 'guard']; // generic NPCs: name plate only
    if (s && !NOPORT.includes(s.id)) { try { img = call(window.Portraits, 'get', s.id, s.mood) || call(window.Portraits, 'get', s.id, 'neutral'); } catch {} }
    if (img) { try { c.drawImage(img, 0, 0, 64, 64); } catch {} }
    el.classList.toggle('on', !!(s && img));
  }
}
$('vn').onclick = act_;
$('vnChoices').onclick = e => {
  e.stopPropagation();
  const k = e.target.closest('[data-k]')?.dataset.k;
  if (k != null && vn.st === 'choice') { vn.sel = +k; pick(+k); }
};

// ---------- input (keyboard + touch) ----------
const DIRK = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', KeyW: 'up', KeyS: 'down', KeyA: 'left', KeyD: 'right' };
const press = d => {
  if (vn.open) {
    if (vn.st === 'choice' && (d === 'up' || d === 'down')) {
      vn.sel = (vn.sel + (d === 'up' ? -1 : 1) + vn.opts.length) % vn.opts.length; renderChoices(); sfx('select');
    }
    return;
  }
  if (!held.includes(d)) held.push(d);
};
const release = d => { const i = held.indexOf(d); if (i >= 0) held.splice(i, 1); };
const firstGesture = () => { if (!started) { started = true; if (mode === 'ov' && !act && (!scene || scene.bg === 'title')) music('title'); } };

// ---------- secret admin: type "yonsei" to toggle; then ] = skip current part, [ = jump to any flow item ----------
const ADMIN_CODE = 'KeyY,KeyO,KeyN,KeyS,KeyE,KeyI';
let admin = false, typed = [];
function adminKey(code) {
  typed = [...typed, code].slice(-6);
  if (typed.join() === ADMIN_CODE) { admin = !admin; typed = []; toast(admin ? '관리자 모드 ON · ] 건너뛰기 · [ 이동' : '관리자 모드 OFF'); return true; }
  if (!admin) return false;
  const C = cuts();
  if (code === 'BracketRight') { // skip: whole cutscene / whole vn scene / one quest step (or leave once unlocked)
    if (C && C.active) call(C, 'key', 'Escape');
    else if (mode === 'scene') { closeVN(); nextFlow(); }
    else if (act && mode === 'play') { closeVN(); unlocked() ? leave() : complete(); }
    return true;
  }
  if (code === 'BracketLeft') { // jump: native prompt listing every flow item
    if (C && C.active) { toast('컷신 중에는 ] 로 먼저 건너뛰세요'); return true; }
    const list = ST.flow.map((it, i) => `${i}: ${it.type} ${(ST.acts || {})[it.id]?.title || it.id || ''}`).join('\n');
    const n = parseInt(prompt(`이동할 번호 (관리자)\n${list}`, fi), 10);
    if (n >= 0 && n < ST.flow.length) {
      closeVN(); $('ov').style.display = 'none'; ovNext = ovAlt = null; fadeCb = null; fadeDir = 0; fade = 0; held.length = 0;
      runFlow(n);
    }
    return true;
  }
  return false;
}

addEventListener('pointerdown', firstGesture);
addEventListener('keydown', e => {
  firstGesture();
  if (!e.repeat && adminKey(e.code)) { e.preventDefault(); return; }
  const logOpen = $('vnLog').style.display === 'block';
  if ((e.code === 'KeyL' && !cuts()?.active) || (logOpen && ['KeyZ', 'Space', 'Enter', 'Escape'].includes(e.code))) {
    e.preventDefault(); if (!e.repeat && (logOpen || backlog.length)) toggleLog(); return;
  }
  if (logOpen) return; // the backlog owns the keyboard while it is open
  if (e.code === 'KeyM') { const m = window.AudioCtl; if (m) { m.setMuted(!m.muted); toast(m.muted ? '소리 끔' : '소리 켬'); } return; }
  const C = cuts();
  if (C && C.active) { // cutscene owns the keyboard
    if (['KeyZ', 'Space', 'Enter', 'NumpadEnter', 'Escape'].includes(e.code)) { e.preventDefault(); if (!e.repeat) call(C, 'key', e.code); }
    return;
  }
  const d = DIRK[e.code]; // e.code: works with Korean IME on
  if (d) { e.preventDefault(); if (!e.repeat) press(d); return; }
  if (['ShiftLeft', 'ShiftRight', 'KeyX'].includes(e.code)) running = true;
  if (e.code === 'KeyC' && mode === 'ov' && ovAlt) { const f = ovAlt; ovNext = null; f(); }
  if (['KeyZ', 'Space', 'Enter', 'NumpadEnter'].includes(e.code)) { e.preventDefault(); if (!e.repeat) act_(); }
});
addEventListener('keyup', e => {
  if (DIRK[e.code]) release(DIRK[e.code]);
  if (['ShiftLeft', 'ShiftRight', 'KeyX'].includes(e.code)) running = false;
});
addEventListener('blur', () => { held.length = 0; running = false; });
$('ov').onclick = act_;
for (const b of document.querySelectorAll('[data-d]')) {
  b.onpointerdown = e => { e.preventDefault(); press(b.dataset.d); };
  b.onpointerup = b.onpointerleave = b.onpointercancel = () => release(b.dataset.d);
}
$('ba').onpointerdown = e => { e.preventDefault(); if ($('vnLog').style.display === 'block') toggleLog(); else act_(); };
$('bl').onpointerdown = e => { e.preventDefault(); if (backlog.length || $('vnLog').style.display === 'block') toggleLog(); };
$('bb').onpointerdown = e => { e.preventDefault(); running = true; };
$('bb').onpointerup = $('bb').onpointerleave = $('bb').onpointercancel = () => running = false;

// ---------- update ----------
function sight(m) {
  const [dx, dy] = V[m.dir], gx = Math.round(m.px / 16), gy = Math.round(m.py / 16), out = [];
  for (let k = 1; k <= 3; k++) {
    const x = gx + dx * k, y = gy + dy * k, t = map[y]?.[x];
    if (!t || SOLID.includes(t)) break;
    out.push([x, y]);
  }
  return out;
}
const mobFree = (x, y) => { const t = map[y]?.[x]; return t && !SOLID.includes(t) && t !== 'E' && !entAt(x, y) && !mobs.some(o => o.x === x && o.y === y) && !(x === p.x && y === p.y); };
const faceDir = (dx, dy) => dx > 0 ? 'right' : dx < 0 ? 'left' : dy > 0 ? 'down' : 'up';
// doubt blobs patrol their lane but lunge at the player within 4 tiles (give up past 6), steering around walls
function doubtStep(m) {
  const d = Math.abs(p.x - m.x) + Math.abs(p.y - m.y);
  // no lunging during the first 4s of an act, right after a catch, or while the player stands near the
  // respawn point — otherwise a blob parked next to the checkpoint catches the player again and again
  const calm = p.inv || grace || actT > 0 || Math.abs(p.x - p.cp[0]) + Math.abs(p.y - p.cp[1]) <= 2;
  if (d <= 4 && !calm) m.chase = true; else if (d > 6 || calm) m.chase = false;
  let [tx, ty] = m.chase ? [p.x, p.y] : m.route[m.ri];
  if (!m.chase && m.x === tx && m.y === ty) {
    if (!m.route[m.ri + m.rd]) m.rd = -m.rd;
    m.ri += m.rd; [tx, ty] = m.route[m.ri];
  }
  const dx = Math.sign(tx - m.x), dy = Math.sign(ty - m.y);
  const tries = Math.abs(tx - m.x) >= Math.abs(ty - m.y) ? [[dx, 0], [0, dy]] : [[0, dy], [dx, 0]];
  for (const [a, b] of tries) {
    if (!a && !b) continue;
    const x = m.x + a, y = m.y + b;
    // only a chasing blob walks into the player
    if ((m.chase && x === p.x && y === p.y) || mobFree(x, y)) { m.x = x; m.y = y; m.dir = faceDir(a, b); return; }
  }
  // boxed in (e.g. a house between it and its lane): sidestep randomly, then hesitate
  const side = Object.values(V).filter(([a, b]) => mobFree(m.x + a, m.y + b));
  if (side.length) { const [a, b] = side[(Math.random() * side.length) | 0]; m.x += a; m.y += b; m.dir = faceDir(a, b); }
  else m.wait = 12;
}
function updateMob(m) {
  if (m.wait > 0) {
    m.wait--;
    if (m.kind === 'guard' && m.nd) { // at the end of a beat the guard glances both ways before turning back
      const side = /left|right/.test(m.nd) ? ['up', 'down'] : ['left', 'right'];
      m.dir = m.wait > 26 ? side[0] : m.wait > 13 ? side[1] : m.nd;
    }
    return;
  }
  if (m.kind === 'doubt') {
    if (m.px === m.x * 16 && m.py === m.y * 16) doubtStep(m);
    m.px += Math.sign(m.x * 16 - m.px); m.py += Math.sign(m.y * 16 - m.py);
    return;
  }
  if (m.px === m.x * 16 && m.py === m.y * 16) {
    let [tx, ty] = m.route[m.ri];
    if (m.x === tx && m.y === ty) {
      if (!m.route[m.ri + m.rd]) m.rd = -m.rd;
      m.ri += m.rd; m.wait = m.kind === 'guard' ? 40 : 0;
      [tx, ty] = m.route[m.ri];
    }
    const dx = Math.sign(tx - m.x), dy = dx ? 0 : Math.sign(ty - m.y);
    m.dir = m.nd = dx > 0 ? 'right' : dx < 0 ? 'left' : dy > 0 ? 'down' : 'up';
    if (m.wait) return; // turned to face next leg, pause before walking
    m.x += dx; m.y += dy;
  }
  m.px += Math.sign(m.x * 16 - m.px); m.py += Math.sign(m.y * 16 - m.py);
}

function update() {
  frame++;
  fx = fx.filter(f => { f.x += f.vx; f.y += f.vy; f.vy += .08; return --f.t > 0; });
  if (shake) shake--;
  if (fadeDir) {
    fade += fadeDir * .05;
    if (fade >= 1) { fade = 1; fadeDir = 0; const f = fadeCb; fadeCb = null; f && f(); }
    else if (fade <= 0) { fade = 0; fadeDir = 0; }
  }
  const C = cuts();
  if (C && C.active) { call(C, 'update'); return; }
  if ($('vnLog').style.display === 'block') return; // reading the backlog pauses everything
  if (vn.open) { vnUpdate(); return; }
  if (mode !== 'play' || !map) return;

  if (actT > 0) actT--;
  mobs.forEach(updateMob);
  if (frame % 30 === 0 && act.hearts && mobs.some(m => m.kind === 'guard')) { // stealth music when a guard is near
    const near = mobs.some(m => m.kind === 'guard' && Math.abs(m.px - p.px) + Math.abs(m.py - p.py) < 112);
    music(near ? 'stealth' : (act.music || actId));
  }
  if (frame % 100 === 0) { // NPCs glance around
    const ps = ents.filter(e => !e.item && !/^(sign|notice_board)$/.test(e.sprite));
    const e = ps[(Math.random() * ps.length) | 0];
    if (e) e.dir = ['up', 'down', 'left', 'right'][(Math.random() * 4) | 0];
  }
  if (grace > 0) grace--;
  if (p.inv > 0) p.inv--;
  else if (!grace) for (const m of mobs) {
    const touch = Math.abs(m.px - p.px) < 12 && Math.abs(m.py - p.py) < 12;
    const seen = m.kind === 'guard' && sight(m).some(([x, y]) => (x === p.x && y === p.y) || (x === Math.round(p.px / 16) && y === Math.round(p.py / 16)));
    if (touch || seen) return caught(m.kind);
  }

  // grid movement: 2px/frame walking, 4px/frame running
  if (p.px !== p.x * 16 || p.py !== p.y * 16) {
    const sp = running ? 4 : 2, ddx = p.x * 16 - p.px, ddy = p.y * 16 - p.py;
    p.px += Math.sign(ddx) * Math.min(sp, Math.abs(ddx));
    p.py += Math.sign(ddy) * Math.min(sp, Math.abs(ddy));
    const rem = Math.abs(p.x * 16 - p.px) + Math.abs(p.y * 16 - p.py);
    p.walk = rem >= 8 ? (p.anim % 2 ? 1 : 2) : 0;
    if (!rem) { pickup(); if (map[p.y][p.x] === 'E') leave(); }
    return;
  }
  const d = held[held.length - 1];
  if (!d) { p.walk = 0; return; }
  p.dir = d;
  const [dx, dy] = V[d];
  if (free(p.x + dx, p.y + dy)) { p.x += dx; p.y += dy; p.anim++; }
  else {
    p.walk = (frame >> 3) % 2 + 1; // blocked: walk in place
    if (frame - lastBump > 18) { sfx('bump'); lastBump = frame; }
  }
}

// ---------- draw: sprites (Sprites module, with simple-shape fallbacks) ----------
function sprite(sx, sy, P) {
  g.fillStyle = '#101010';
  for (const [a, b, w, h] of P) g.fillRect(sx + a - 1, sy + b - 1, w + 2, h + 2);
  for (const [a, b, w, h, c] of P) { g.fillStyle = c; g.fillRect(sx + a, sy + b, w, h); }
}
const FB = { // fallback looks when Sprites is missing
  me: { skin: '#f8c8a0', hair: '#282018', top: '#1a3f95', bottom: '#2a2a3a' },
  guard: { skin: '#f8c8a0', hair: '#181818', top: '#16161a', bottom: '#16161a', hat: 'cap', capBand: '#c02020' },
  keeper: { skin: '#f8c8a0', hair: '#e8e8e8', top: '#0a3a8a', bottom: '#0a3a8a', beard: 1 },
  official: { skin: '#f8c8a0', hair: '#181818', top: '#f4f2ea', bottom: '#dcdad0', hat: 'gat' },
  def: { skin: '#f8c8a0', hair: '#181818', top: '#a8a8a0', bottom: '#888880' },
};
function fbPerson(sx, sy, look, dir, walk) {
  const L = FB[look] || FB.def, P = [], r = (a, b, w, h, c) => P.push([a, b, w, h, c]);
  g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(sx + 3, sy + 14, 10, 2);
  if (walk) sy -= 1;
  r(4, 11, 3, walk === 1 ? 3 : 4, L.bottom); r(9, 11, 3, walk === 2 ? 3 : 4, L.bottom);
  r(3, 7, 10, 5, L.top);
  r(4, 1, 8, 7, L.skin);
  ({ down: [[4, 1, 8, 2], [4, 3, 1, 2], [11, 3, 1, 2]], up: [[4, 1, 8, 5]], left: [[4, 1, 8, 2], [9, 3, 3, 3]], right: [[4, 1, 8, 2], [4, 3, 3, 3]] })[dir]
    .forEach(a => r(...a, L.hair));
  if (L.hat === 'gat') { r(1, 1, 14, 1, '#141414'); r(5, -3, 6, 4, '#141414'); }
  if (L.hat === 'cap') r(4, 0, 8, 2, '#181c2c');
  sprite(sx, sy, P);
  g.fillStyle = '#101010';
  for (const [a, b] of { down: [[6, 4], [9, 4]], left: [[5, 4]], right: [[10, 4]], up: [] }[dir]) g.fillRect(sx + a, sy + b, 1, 2);
  if (L.capBand) { g.fillStyle = L.capBand; g.fillRect(sx + 4, sy + 1, 8, 1); }
}
function sign(sx, sy) {
  sprite(sx, sy, [[7, 9, 2, 6, '#6a4020'], [2, 3, 12, 7, '#d4a464']]);
  g.fillStyle = '#8a6030'; g.fillRect(sx + 4, sy + 5, 8, 1); g.fillRect(sx + 4, sy + 7, 6, 1);
}
function person(sx, sy, look, dir, fr) {
  if (look === 'sign' || look === 'notice_board') {
    try { if (window.Sprites && Sprites.draw) { Sprites.draw(g, sx, sy, look, dir, 0); return; } } catch {}
    return sign(sx, sy);
  }
  try {
    if (window.Sprites && Sprites.draw) {
      g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(sx + 3, sy + 14, 10, 2);
      Sprites.draw(g, sx, sy, look, dir, fr); return;
    }
  } catch {}
  fbPerson(sx, sy, look, dir, fr);
}
function item(sx, sy, look) {
  // pulsing gold halo + bobbing arrow so pickups read clearly on busy ground tiles
  const p = (frame >> 2) % 8;
  g.fillStyle = `rgba(255,220,80,${0.3 + 0.06 * (p < 4 ? p : 8 - p)})`;
  g.beginPath(); g.ellipse(sx + 8, sy + 10, 9, 6, 0, 0, Math.PI * 2); g.fill();
  const ay = sy - 7 + ((frame >> 3) % 2);
  for (let i = 0; i < 5; i++) { g.fillStyle = '#2a1812'; g.fillRect(sx + 4 + i, ay + i, 9 - 2 * i, 1); }
  for (let i = 0; i < 4; i++) { g.fillStyle = '#ffe060'; g.fillRect(sx + 5 + i, ay + i, 7 - 2 * i, 1); }
  sy += (frame >> 4) % 2;
  let drawn = false;
  try { if (window.Sprites && Sprites.drawItem) { Sprites.drawItem(g, sx, sy, look, frame); drawn = true; } } catch {}
  if (!drawn) {
    sprite(sx, sy, {
      coin:  [[4, 6, 8, 8, '#c8a040'], [6, 4, 4, 2, '#a07828']],
      brick: [[2, 7, 12, 6, '#b44a2e']],
      wood:  [[2, 6, 12, 3, '#a0703c'], [2, 10, 12, 3, '#8a5a2c']],
      page:  [[4, 3, 8, 11, '#f4f0e0']],
      heart: [[3, 5, 4, 4, '#e83a5a'], [9, 5, 4, 4, '#e83a5a'], [4, 8, 8, 3, '#e83a5a'], [6, 11, 4, 2, '#e83a5a']],
    }[look] || [[4, 5, 8, 8, '#f4f0e0']]);
    if (look === 'page') { g.fillStyle = '#8a8a8a'; g.fillRect(sx + 5, sy + 5, 6, 1); g.fillRect(sx + 5, sy + 8, 6, 1); g.fillRect(sx + 5, sy + 11, 4, 1); }
  }
  if ((frame >> 3) % 6 === 0) { g.fillStyle = '#fff'; g.fillRect(sx + 12, sy + 2, 1, 3); g.fillRect(sx + 11, sy + 3, 3, 1); } // twinkle
}
function doubt(sx, sy) {
  sprite(sx, sy + ((frame >> 3) % 2), [[2, 4, 12, 10, '#6a3a8a'], [4, 2, 8, 2, '#6a3a8a'], [3, 14, 3, 1, '#6a3a8a'], [10, 14, 3, 1, '#6a3a8a']]);
  g.fillStyle = '#fff'; g.fillRect(sx + 5, sy + 6, 2, 2); g.fillRect(sx + 9, sy + 6, 2, 2);
  g.fillStyle = '#f8e050'; g.fillRect(sx + 6, sy + 10, 4, 1);
}
function bubble(sx, sy) {
  const b = sy - 13 + ((frame >> 4) % 2);
  g.fillStyle = '#101010'; g.fillRect(sx + 4, b - 1, 8, 11);
  g.fillStyle = '#fff'; g.fillRect(sx + 5, b, 6, 9);
  g.fillStyle = '#e02020'; g.fillRect(sx + 7, b + 1, 2, 4); g.fillRect(sx + 7, b + 6, 2, 2);
}
function dots(sx, sy) { // unread history record
  const b = sy - 7;
  g.fillStyle = '#101010'; g.fillRect(sx + 3, b - 1, 10, 5);
  g.fillStyle = '#e8e8e8'; g.fillRect(sx + 4, b, 8, 3);
  g.fillStyle = '#606060'; for (let k = 0; k < 3; k++) g.fillRect(sx + 5 + k * 2, b + 1, 1, 1);
}
function arrow(cx, cy) { // points at the current goal when it is off screen
  const s = step();
  let t = null;
  if (!s) t = exitPos;
  else if (s.who) { const e = ents.find(e => e.id === s.who && present(e)); t = e && [e.x, e.y]; }
  else {
    const c = ents.filter(e => e.tag === s.tag && !e.done && visible(e))
      .sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0];
    t = c && [c.x, c.y];
  }
  if (!t || (frame >> 4) % 2) return;
  const tx = t[0] * 16 + 8 - cx, ty = t[1] * 16 + 8 - cy;
  if (tx > 4 && tx < 252 && ty > 4 && ty < 220) return;
  const px = p.px + 8 - cx, py = p.py + 8 - cy, a = Math.atan2(ty - py, tx - px);
  const ax = Math.max(10, Math.min(246, tx)), ay = Math.max(10, Math.min(214, ty));
  g.save(); g.translate(ax, ay); g.rotate(a);
  g.fillStyle = '#101010'; g.beginPath(); g.moveTo(8, 0); g.lineTo(-6, -7); g.lineTo(-6, 7); g.fill();
  g.fillStyle = '#f8e050'; g.beginPath(); g.moveTo(6, 0); g.lineTo(-4, -5); g.lineTo(-4, 5); g.fill();
  g.restore();
}

function tile(t, x, y, sx, sy) {
  const f = (c, a, b, w, h) => { g.fillStyle = c; g.fillRect(sx + a, sy + b, w, h); };
  const h = k => { let n = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(k, 1442695041); n = Math.imul(n ^ (n >>> 13), 1274126177); return (n ^ (n >>> 16)) >>> 0; };
  const at = (dx, dy) => map[y + dy]?.[x + dx];
  const dirt = act?.ground === 'dirt', gc = dirt ? '#b49668' : '#5cb84c'; // 1885 town: packed earth, not lawn
  const grass = () => {
    f(gc, 0, 0, 16, 16);
    if (!dirt) { for (let i = 0; i < 3; i++) { const r = h(i); f('#469e3c', r % 14 + 1, (r >> 5) % 13 + 1, 1, 2); } return; }
    for (let i = 0; i < 3; i++) { const r = h(i); f('#9e8258', r % 14 + 1, (r >> 5) % 14 + 1, 2, 1); }
    if (h(9) % 4 === 0) { const r = h(10), a = r % 11 + 2, b = (r >> 6) % 10 + 3; f('#6e9448', a, b, 1, 2); f('#6e9448', a + 2, b + 1, 1, 1); } // weed tuft
  };
  const path = () => { f(dirt ? '#d6bc88' : '#d8b474', 0, 0, 16, 16); for (let i = 0; i < 2; i++) { const r = h(i + 5); f('#bf9a5c', r % 15, (r >> 5) % 15, 1, 1); } };
  // roofs read their neighbours: ridge on top, eave + tile ends at the bottom, hipped/rounded ends,
  // so a 2-row block of R becomes one big roof. R = 기와 (tiled), H = 초가 (thatched).
  const roof = th => {
    const L = at(-1, 0) === th, Rt = at(1, 0) === th, U = at(0, -1) === th, Dn = at(0, 1) === th, top = U ? 0 : 2;
    grass();
    const C = th === 'H' ? { base: '#c4a058', dark: '#97762f', lite: '#e0c27c', edge: '#6a4e22' }
                         : { base: '#525b6b', dark: '#363d49', lite: '#7d889a', edge: '#22262e' };
    f(C.base, 0, top, 16, 16 - top);
    if (th === 'R') {
      for (let k = 1; k < 16; k += 4) { f(C.dark, k, top, 1, 16 - top); f(C.lite, k + 2, top, 1, 16 - top); } // 골기와 rows
      if (!U) { f(C.edge, 0, top, 16, 3); f(C.lite, 0, top, 16, 1); }                                           // 용마루 ridge
      if (!Dn) { f(C.edge, 0, 12, 16, 3); for (let k = 1; k < 16; k += 4) f('#a4aebe', k, 12, 2, 2); f('#14161a', 0, 15, 16, 1); } // eave + 막새
      for (const [side, has] of [[0, L], [1, Rt]]) {
        if (has) continue;
        const X = (a, w) => side ? 16 - a - w : a;
        if (!U) for (let k = 0; k < 5; k++) f(gc, X(0, 5 - k), top + k, 5 - k, 1);                            // hipped end
        if (!Dn) { f(gc, X(0, 2), 14, 2, 2); f(C.lite, X(0, 1), 10, 1, 1); f(C.edge, X(0, 1), 11, 1, 2); f(C.edge, X(1, 1), 12, 1, 2); } // upturned eave tip
      }
    } else {
      for (let i = 0; i < 12; i++) { const r = h(i + 20); f(C.dark, r % 15, top + (r >> 4) % (15 - top), 1, 2); f(C.lite, (r >> 8) % 14, top + (r >> 12) % (15 - top), 2, 1); }
      for (let k = top + 4; k < 13; k += 5) f(C.dark, 0, k, 16, 1);                                              // rope bands
      if (!U) f(C.lite, 0, top, 16, 1);
      if (!Dn) { f(C.edge, 0, 13, 16, 1); for (let k = 0; k < 16; k++) if (h(k + 40) % 3) f(C.edge, k, 14, 1, 1 + h(k + 50) % 2); f(gc, 0, 15, 16, 1); for (let k = 0; k < 16; k++) if (h(k + 60) % 2) f('#3a2c14', k, 15, 1, 1); } // straw fringe
      for (const [side, has] of [[0, L], [1, Rt]]) {
        if (has) continue;
        const X = (a, w) => side ? 16 - a - w : a;
        if (!U) [4, 2, 1, 1].forEach((w, k) => f(gc, X(0, w), top + k, w, 1));                              // rounded crown
        if (!Dn) [1, 2].forEach((w, k) => f(gc, X(0, w), 13 + k, w, 1));
      }
    }
  };
  switch (t) {
    case 'R': case 'H': roof(t); break;
    case 'M': // 흙벽: mud wall with straw flecks, thin posts, a small 봉창 window, rubble footing
      f('#a8845a', 0, 0, 16, 13); for (let i = 0; i < 5; i++) { const r = h(i + 30); f('#c8a878', r % 15, (r >> 5) % 12, 1, 1); }
      f('#4a3018', 0, 0, 16, 1); f('#5a3a20', 0, 0, 1, 13); f('#5a3a20', 15, 0, 1, 13);
      if (h(3) % 2 && at(1, 0) !== 'D') { f('#4a3018', 5, 3, 6, 6); f('#e6d8b0', 6, 4, 4, 4); f('#4a3018', 7, 4, 1, 4); f('#4a3018', 6, 6, 4, 1); }
      f('#8a8070', 0, 13, 16, 3); f('#6e6658', 0, 13, 16, 1); f('#6e6658', 4, 14, 1, 2); f('#6e6658', 10, 14, 1, 2); break;
    case 'Q': // 제중원: official hanok — red pillars, 단청 beam, big lattice window, tall stone base
      f('#efe8d6', 0, 0, 16, 16); f('#2a7a6a', 0, 0, 16, 2); f('#c83a2a', 2, 0, 2, 2); f('#c83a2a', 10, 0, 2, 2); f('#f0e0a0', 6, 0, 2, 1); f('#f0e0a0', 14, 0, 1, 1);
      f('#8a2a1e', 0, 2, 2, 10); f('#8a2a1e', 14, 2, 2, 10); f('#b03a26', 0, 2, 1, 10);
      f('#7a3a20', 3, 3, 10, 8); f('#f4ecd0', 4, 4, 8, 6); f('#7a3a20', 6, 4, 1, 6); f('#7a3a20', 9, 4, 1, 6); f('#7a3a20', 4, 6, 8, 1); f('#7a3a20', 4, 8, 8, 1);
      f('#aca596', 0, 12, 16, 4); f('#8a8478', 0, 12, 16, 1); f('#8a8478', 7, 13, 1, 3); f('#8a8478', 2, 14, 1, 2); f('#8a8478', 12, 14, 1, 2); break;
    case ',': path(); break;
    case '_': f('#bcb6a8', 0, 0, 16, 16); f('#a29c8e', 0, 15, 16, 1); f('#a29c8e', 15, 0, 1, 16); break;
    case 'F': grass(); { const s = (frame >> 5) % 2; f('#f05050', 3, 4 + s, 2, 2); f('#f8d840', 10, 9 - s, 2, 2); f('#ffffff', 6, 12, 2, 2); } break;
    case 'T': grass(); f('#6a4424', 6, 11, 4, 5); f('#14501e', 1, 1, 14, 11); f('#2a8436', 2, 2, 12, 8); f('#4ea852', 4, 3, 5, 3); break;
    case 'P': grass(); f('#7a5a3a', 7, 12, 2, 4); f('#14501e', 4, 0, 8, 13); f('#2e8a3a', 5, 1, 6, 10); f('#5bb05e', 6, 2, 2, 6); break;
    case 'W': { f('#2f6fd0', 0, 0, 16, 16); const o = ((frame >> 4) + x) % 4 * 4; f('#7ab0f8', o, 4, 4, 1); f('#7ab0f8', (o + 8) % 16, 11, 4, 1); break; }
    case 'B': // hanok wall under a tiled roof: plaster, timber posts and beam, 창호 lattice, stone 기단
      f('#ece4d0', 0, 0, 16, 16); f('#5a381e', 0, 0, 16, 2); f('#6a4426', 0, 0, 2, 13); f('#6a4426', 14, 0, 2, 13);
      f('#7a4c28', 4, 3, 8, 8); f('#f2e8c8', 5, 4, 6, 6); f('#7a4c28', 7, 4, 1, 6); f('#7a4c28', 5, 6, 6, 1); f('#7a4c28', 5, 8, 6, 1);
      f('#9a948a', 0, 13, 16, 3); f('#7e786e', 0, 13, 16, 1); f('#7e786e', 5, 14, 1, 2); f('#7e786e', 11, 14, 1, 2); break;
    case 'Y': f('#7c3c2c', 0, 0, 16, 16); for (let j = 0; j < 3; j++) f('#5c2a1e', 0, j * 4 + 3, 16, 1); f('#3a1a12', 0, 13, 16, 3); break;
    case 'X': f('#b44a2e', 0, 0, 16, 16); for (let j = 0; j < 4; j++) { f('#8a3420', 0, j * 4 + 3, 16, 1); f('#8a3420', j % 2 ? 3 : 11, j * 4, 1, 3); }
              f('#1e2a40', 5, 4, 6, 7); f(act?.dark ? '#f8d870' : '#6a8cc0', 6, 5, 2, 2); break;
    case 'G': f('#b6ae9a', 0, 0, 16, 16); f('#968e7a', 0, 7, 16, 1); f('#968e7a', 0, 15, 16, 1);
              f(act?.dark ? '#5a4a20' : '#26303e', 5, 3, 6, 9); f('#b6ae9a', 5, 3, 1, 1); f('#b6ae9a', 10, 3, 1, 1); f(act?.dark ? '#f8d870' : '#4a5a78', 6, 5, 1, 3); break;
    case 'D': { const b = map[y][x - 1], bg = b && b !== 'D' ? b : 'B'; tile(bg, x, y, sx, sy);
              if (bg === 'Q') { // 제중원 gate: 현판 signboard over red double doors
                f('#1a1410', 1, 0, 14, 6); f('#c8a040', 1, 0, 14, 1); f('#c8a040', 1, 5, 14, 1); f('#c8a040', 1, 0, 1, 6); f('#c8a040', 14, 0, 1, 6);
                f('#f0d070', 3, 2, 2, 2); f('#f0d070', 7, 1, 2, 3); f('#f0d070', 11, 2, 2, 2);
                f('#3a1a10', 2, 6, 12, 10); f('#a8321e', 3, 7, 5, 9); f('#a8321e', 8, 7, 5, 9); f('#d04a30', 3, 7, 5, 1); f('#d04a30', 8, 7, 5, 1); f('#f0c040', 7, 11, 1, 1); f('#f0c040', 8, 11, 1, 1);
              } else { f('#3a2010', 4, 3, 8, 13); f('#7a4a28', 5, 4, 6, 12); f('#5a3418', 7, 4, 1, 12); f('#f0c040', 9, 10, 1, 1); }
              break; }
    case '#': grass(); f('#5a5a54', 0, 3, 16, 11); f('#9c9c94', 0, 4, 16, 9); f('#bdbdb5', 0, 4, 16, 2); f('#6c6c64', (x % 2) * 8 + 3, 8, 1, 5); break;
    case 'E': path();
      if (unlocked()) { const c = frame % 40 < 20 ? '#f8e050' : '#f89830'; f(c, 2, 2, 12, 2); f(c, 2, 12, 12, 2); f(c, 2, 2, 2, 12); f(c, 12, 2, 2, 12); }
      else { f('#5a3418', 1, 4, 2, 10); f('#5a3418', 13, 4, 2, 10); f('#c82828', 0, 6, 16, 4); f('#f4f4f4', 3, 6, 3, 4); f('#f4f4f4', 10, 6, 3, 4); }
      break;
    default: grass();
  }
}

function drawWorld() {
  let cx = Math.max(0, Math.min(map[0].length * 16 - 256, p.px + 8 - 128));
  let cy = Math.max(0, Math.min(map.length * 16 - 224, p.py + 8 - 112));
  if (shake) { cx += ((Math.random() * 5) | 0) - 2; cy += ((Math.random() * 5) | 0) - 2; }
  for (let y = (cy >> 4) - 1; y <= (cy >> 4) + 15; y++)
    for (let x = (cx >> 4) - 1; x <= (cx >> 4) + 17; x++) { const t = map[y]?.[x]; if (t) tile(t, x, y, x * 16 - cx, y * 16 - cy); }
  if (act.dark) { // night: cool tint plus a soft pool of light around the player, so the map stays readable
    g.fillStyle = 'rgba(16,20,64,.3)'; g.fillRect(0, 0, 256, 224);
    const lx = p.px + 8 - cx, ly = p.py + 8 - cy, vg = g.createRadialGradient(lx, ly, 40, lx, ly, 200);
    vg.addColorStop(0, 'rgba(0,0,20,0)'); vg.addColorStop(1, 'rgba(0,0,20,.35)');
    g.fillStyle = vg; g.fillRect(0, 0, 256, 224);
  }
  g.fillStyle = `rgba(255,60,60,${.25 + .1 * ((frame >> 3) % 2)})`;
  for (const m of mobs) if (m.kind === 'guard') for (const [x, y] of sight(m)) g.fillRect(x * 16 - cx, y * 16 - cy, 16, 16);

  const list = [
    ...ents.filter(visible).map(e => [e.y * 16 - (e.item ? 1 : 0), e]),
    ...mobs.map(m => [m.py, m]),
    [p.py, p],
  ].sort((a, b) => a[0] - b[0]);
  for (const [, e] of list) {
    if (e === p) { if (!(p.inv && (frame >> 2) % 2)) person(p.px - cx, p.py - cy, 'me', p.dir, p.walk); continue; }
    if (e.route) { e.kind === 'doubt' ? doubt(e.px - cx, e.py - cy) : person(e.px - cx, e.py - cy, 'guard', e.dir, e.wait ? 0 : ((e.px + e.py) >> 3) % 2 + 1); continue; }
    const sx = e.x * 16 - cx, sy = e.y * 16 - cy;
    if (e.item) item(sx, sy, itemLook(e));
    else {
      // at night friendly people carry a little warm light, so a student in a black uniform never reads as a policeman
      if (act.dark && !/^(sign|notice_board)$/.test(e.sprite)) { g.fillStyle = 'rgba(255,214,140,.22)'; g.fillRect(sx - 2, sy + 10, 20, 7); g.fillRect(sx + 1, sy + 8, 14, 11); }
      person(sx, sy, e.sprite, e.dir, 0);
    }
    // "!" = current goal (hidden once the player is right next to it, so it never sits on the player's head);
    // "…" = unread record, only when the player is close, so the map isn't covered in bubbles
    const near = Math.abs(e.x - p.x) + Math.abs(e.y - p.y);
    if (isTarget(e)) { if (near > 1) bubble(sx, sy); }
    else if (near <= 3 && recable(e) && !stats.rec.has(recKey(e))) dots(sx, sy);
  }
  for (const f of fx) { g.globalAlpha = Math.min(1, f.t / 15); g.fillStyle = f.c; g.fillRect(f.x - cx - 1, f.y - cy - 1, 2, 2); }
  g.globalAlpha = 1;
  arrow(cx, cy);
}

// ---------- full-screen VN backgrounds ----------
// the same painted art as the cutscenes, so the scene never "downgrades" between a cutscene page and dialogue
const BGS = { archive: ['intro', 0], diary: ['intro', 1], keeper: ['keeper', 0], title: ['c1', 1], gate: ['c1', 1],
              hospital: ['c2x', 0], ymca: ['c2x', 1], attic: ['c3', 2] };
const bgCache = {};
function backdrop(name, t) {
  const k = BGS[name];
  if (!k) return false;
  if (!(name in bgCache)) bgCache[name] = call(cuts(), 'backdrop', ...k) || null;
  const cv = bgCache[name] && call(bgCache, name, t);
  if (!cv) return false;
  g.drawImage(cv, 46, 0, 292, 256, 0, 0, 256, 224); // 384x256 -> centre crop to 256:224
  return true;
}
function drawScene() {
  const t = scene.t++;
  if (scene.bg === 'dusk' && map) { // the same street, at sundown
    drawWorld(); g.fillStyle = 'rgba(70,24,40,.45)'; g.fillRect(0, 0, 256, 224);
    g.fillStyle = 'rgba(255,140,60,.12)'; g.fillRect(0, 0, 256, 224); return;
  }
  if (scene.bg === 'lamp') { // a dark room lit by one oil lamp
    g.fillStyle = '#07050a'; g.fillRect(0, 0, 256, 224);
    const r = 92 + Math.sin(t * .13) * 3 + Math.sin(t * .37) * 2, gr = g.createRadialGradient(128, 96, 4, 128, 96, r);
    gr.addColorStop(0, 'rgba(255,200,110,.55)'); gr.addColorStop(.4, 'rgba(160,90,40,.22)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 256, 224);
    g.fillStyle = '#3a2a1a'; g.fillRect(124, 98, 8, 6); g.fillStyle = '#ffe0a0'; g.fillRect(127, 91 + (t >> 3) % 2, 2, 6);
    return;
  }
  if (!backdrop(scene.bg, t)) { g.fillStyle = '#000'; g.fillRect(0, 0, 256, 224); }
}

function draw() {
  const C = cuts();
  if (C && C.active) return call(C, 'draw');
  g.fillStyle = '#000'; g.fillRect(0, 0, 256, 224);
  if (scene) drawScene();
  else if (map) drawWorld();
  if (fade > 0) { g.fillStyle = `rgba(0,0,0,${fade})`; g.fillRect(0, 0, 256, 224); }
  if (vn.open) drawPortraits();
}

// fixed 60Hz step so speed is the same on 120/144Hz screens
let acc = 0, last = 0;
function loop(t) {
  acc += Math.min(100, t - last); last = t;
  while (acc >= 1000 / 60) { update(); acc -= 1000 / 60; }
  draw(); requestAnimationFrame(loop);
}
requestAnimationFrame(t => { last = t; loop(t); });

window.Game = { get flags() { return flags; }, get s() { return { p, mobs, ents, si, prog, mode, actId, hearts }; }, runFlow }; // debug handle
if (!ST.flow.length) overlay('<h1>연세 역사 탐험</h1><p class="dim">data/story.js 를 불러오지 못했어요.</p>', () => location.reload());
else showTitle();
})();
