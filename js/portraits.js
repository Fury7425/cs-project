// Hand-built cartoon pixel portraits (64x64), Nintendo-handheld style:
// flat cel shading (light / base / shade), coloured outlines per part, chunky readable features.
// Every face is assembled from hand-tuned parts below — no photos, no generated images.
(function () {
  'use strict';
  const S = 64, CX = 32;

  // [light, base, shade, line]
  const R = {
    skin:  ['#ffe4c8', '#f6c6a0', '#dc9c7c', '#8a4c3c'],
    skinT: ['#f6cfa2', '#e2a676', '#be7e58', '#6e3c28'],
    skinO: ['#f6d8bc', '#e2b494', '#c08c70', '#78483a'],
    skinP: ['#fff0e0', '#fad8bc', '#e4ae94', '#94584a'],
    black: ['#56566a', '#2c2c3a', '#1a1a26', '#08080e'],
    brown: ['#b8865c', '#8c5c3a', '#643e26', '#361c10'],
    auburn:['#c48454', '#985830', '#6a3a1e', '#3a1c0c'],
    gray:  ['#eceef4', '#c2c6d2', '#9298ac', '#525a6e'],
    white: ['#ffffff', '#eef0f6', '#c6ccdc', '#6c7488'],
    suit:  ['#5c6688', '#3a405c', '#262a40', '#10121e'],
    suitB: ['#76604c', '#524234', '#382c22', '#18100a'],
    shirt: ['#ffffff', '#f0f2f8', '#c8cede', '#6a7088'],
    hanbok:['#ffffff', '#eee8dc', '#cabea8', '#6c604e'],
    rag:   ['#e6cea0', '#c6aa7a', '#9c825a', '#5a4630'],
    teal:  ['#6eaaa6', '#3e7c80', '#2a5658', '#10302e'],
    grayC: ['#a2a6b4', '#767a8a', '#535664', '#24262e'],
    blue:  ['#72a6f4', '#3468cc', '#224898', '#0c2052'],
    khaki: ['#d6c296', '#ae9a6a', '#86724c', '#463a24'],
    uni:   ['#4c4e60', '#282a36', '#18181f', '#060609'],
    purple:['#7c5c9c', '#4e3a70', '#30244a', '#120c20'],
    red:   ['#f47060', '#cc3c34', '#8c2426', '#4a0e12'],
    gold:  ['#fff2a4', '#eac24a', '#b28c2a', '#5a4010'],
    navy:  ['#4a5a8a', '#2c3866', '#1c2448', '#0a0e22'],
  };
  const BG = { // [base, light]
    warm: ['#d8a868', '#f0cc8a'], rose: ['#c48a98', '#e2b0b8'], cold: ['#6e7ea8', '#94a4c8'],
    sky: ['#6aa8e0', '#9cd0f4'], night: ['#2a2040', '#40335c'], green: ['#7aa866', '#a4cc84'],
  };

  // ---------- mask + paint utilities ----------
  const newM = () => new Uint8Array(S * S);
  const inb = (x, y) => x >= 0 && y >= 0 && x < S && y < S;
  const at = (m, x, y) => inb(x, y) ? m[y * S + x] : 1;   // outside the frame counts as "inside" (no line on frame edge)
  const has = (m, x, y) => inb(x, y) && m[y * S + x];
  function ell(m, cx, cy, rx, ry, v = 1) {
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const dx = (x + .5 - cx) / rx, dy = (y + .5 - cy) / ry;
      if (dx * dx + dy * dy <= 1) m[y * S + x] = v;
    }
    return m;
  }
  function rect(m, x0, y0, w, h, v = 1) {
    x0 = Math.round(x0); y0 = Math.round(y0); w = Math.round(w); h = Math.round(h); // fractional coords would index the wrong row
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (inb(x, y)) m[y * S + x] = v;
    return m;
  }
  function poly(m, pts, v = 1) {
    for (let y = 0; y < S; y++) {
      const xs = [], yc = y + .5;
      for (let i = 0; i < pts.length; i++) {
        const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
        if ((ay <= yc && by > yc) || (by <= yc && ay > yc)) xs.push(ax + (yc - ay) / (by - ay) * (bx - ax));
      }
      xs.sort((a, b) => a - b);
      for (let i = 0; i + 1 < xs.length; i += 2)
        for (let x = Math.round(xs[i]); x < Math.round(xs[i + 1]); x++) if (inb(x, y)) m[y * S + x] = v;
    }
    return m;
  }
  const minus = (m, n) => { for (let i = 0; i < m.length; i++) if (n[i]) m[i] = 0; return m; };
  const plus = (m, n) => { for (let i = 0; i < m.length; i++) if (n[i]) m[i] = 1; return m; };
  const clipY = (m, y0, y1) => { for (let y = 0; y < S; y++) if (y < y0 || y >= y1) for (let x = 0; x < S; x++) m[y * S + x] = 0; return m; };

  let buf; // Uint8ClampedArray RGBA of the portrait being painted
  const rgbCache = {};
  const rgb = h => rgbCache[h] || (rgbCache[h] = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)));
  function put(x, y, col) {
    if (!inb(x, y) || !col) return;
    const [r, g, b] = rgb(col), o = (y * S + x) * 4;
    buf[o] = r; buf[o + 1] = g; buf[o + 2] = b; buf[o + 3] = 255;
  }
  // flat cel shading: light rim upper-left, shade band lower-right, coloured outline on the part's edge
  function paint(m, ramp, o = {}) {
    const k = o.k ?? 3, [lt, base, sh, ln] = ramp;
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      if (!m[y * S + x]) continue;
      const edge = !at(m, x - 1, y) || !at(m, x + 1, y) || !at(m, x, y - 1) || !at(m, x, y + 1);
      if (o.dither && !edge && (x + y) % 2) continue;
      let c;
      if (edge && o.line !== false) c = o.lineCol || ln;
      else if (o.flat) c = base;
      else if (!at(m, x + k, y + k) || !at(m, x + 1, y + k + 1) || (o.shadeFn && o.shadeFn(x, y))) c = sh;
      else if (o.light !== false && (!at(m, x - 1, y - 1) || !at(m, x - 2, y - 1))) c = lt;
      else c = base;
      put(x, y, c);
    }
  }
  // drop a shade shadow of `caster` onto pixels of `target` (e.g. hair onto forehead)
  function cast(target, caster, dx, dy, col) {
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++)
      if (target[y * S + x] && !caster[y * S + x] && has(caster, x - dx, y - dy)) put(x, y, col);
  }
  function line(x0, y0, x1, y1, col) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1;
    for (let i = 0; i <= n; i++) put(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), col);
  }
  // rows of chars -> pixels; pal maps char -> colour; mirror=true flips horizontally (for the right eye)
  function stamp(x, y, rows, pal, mirror) {
    const w = Math.max(...rows.map(r => r.length));
    rows.forEach((row, j) => [...row].forEach((ch, i) => {
      const c = pal[ch]; if (c) put(mirror ? x + w - 1 - i : x + i, y + j, c);
    }));
  }

  // ---------- face features ----------
  // left-eye stamps; the right eye is the mirror image. k = lash/line, i = iris, h = highlight, w = white, s = lid shade
  // 6-7 px wide eyes with lids, sclera, iris and a catch-light — the left eye; right eye is mirrored
  const EYES = {
    kid:    { neutral: ['.kkkkk.', 'kkwhiik', 'kwiiiik', '.kiiik.', '..sss..'], smile: ['.......', '..kkk..', '.k...k.', 'k.....k'],
              sad: ['.......', 'kkkkkk.', '.whiik.', '.kiik..', '..ss...'], angry: ['kk.....', '.kkkkkk', '.kwhiik', '..kiik.'],
              surprised: ['.kkkkk.', 'kwwwwwk', 'kwwhiwk', 'kwwiiwk', '.kkkkk.'] },
    adult:  { neutral: ['.kkkkk', 'kwwhik.', '.wiiiw.', '..sss..'], smile: ['.......', '..kkk..', '.k...k.', 's.....s'],
              sad: ['.......', 'kkkkkk.', '.whiik.', '..sss..'], angry: ['kkk....', '.kkkkkk', '..whik.', '...ss..'],
              surprised: ['.kkkkk.', 'kwwhiwk', 'kwwiiwk', '.kkkkk.'] },
    narrow: { neutral: ['kkkkkk.', '.whiik.', '..sss..'], smile: ['.......', '.kkkkk.', 'k.....k'], sad: ['.......', 'kkkkkk.', '..hik..', '..ss...'],
              angry: ['kkk....', '.kkkkkk', '..hik..'], surprised: ['.kkkkk.', 'kwwhiwk', '.kkkkk.'] },
    old:    { neutral: ['kkkkkk.', 'swhiik.', '.ssss..', 's.s....'], smile: ['.......', '.kkkkk.', 'k.....k', '.s.s.s.'],
              sad: ['.......', 'kkkkkk.', '.whik..', 'sssss..'], angry: ['kkk....', '.kkkkkk', '.swhik.', '..ss...'],
              surprised: ['.kkkkk.', 'kwwhiwk', '.kkkkk.', '.s.s...'] },
  };
  const MOUTHS = {
    neutral: ['.kkkkk.', '..sss..'], smile: ['k.....k', '.kkkkk.', '..sss..'], grin: ['kkkkkkk', 'kwwwwwk', '.krrrk.', '..kkk..'], smirk: ['......k', '.kkkkk.', '..ss...'],
    sad: ['..kkk..', '.k...k.', 'k.....k'], angry: ['kkkkkkk', 'kwkwkwk', 'kkkkkkk'], surprised: ['..kkk..', '.krrrk.', '.krrrk.', '..kkk..'], pain: ['.kkkkk.', 'kwkwkwk', '.kkkkk.'],
  };
  function eyes(sp, mood) {
    const set = EYES[sp.eyes || 'adult'], st = set[mood] || set.neutral;
    const ey = sp.ey, ex = sp.ex, w = st[0].length;
    const pal = { k: sp.lash || '#1a1020', i: sp.iris || '#2a1e1a', h: '#ffffff', w: '#f4f4f8', s: sp.skin[2] };
    stamp(CX - ex - Math.ceil(w / 2), ey - 1, st, pal, false);
    stamp(CX + ex - Math.floor(w / 2), ey - 1, st, pal, true);
    if (sp.blush) { put(CX - ex - 2, ey + 3, sp.blush); put(CX - ex - 1, ey + 3, sp.blush); put(CX + ex + 1, ey + 3, sp.blush); put(CX + ex + 2, ey + 3, sp.blush); }
  }
  function brows(sp, mood) {
    const by = sp.ey - 3 - (sp.browGap || 0), ex = sp.ex, c = sp.browCol || sp.hair?.[3] || '#1a1020', th = sp.browThick || 1;
    const shapes = { // [outerY, innerY] offsets
      neutral: [0, 0], smile: [0, -1], sad: [1, -1], angry: [-1, 2], surprised: [-2, -2],
    };
    const [o, i] = shapes[mood] || shapes.neutral;
    for (const s of [-1, 1]) {
      const x0 = CX + s * (ex + 4), x1 = CX + s * (ex - 3);
      for (let t = 0; t < th; t++) line(x0, by + o + t, x1, by + i + t, c);
    }
  }
  function nose(sp) { // light from the upper left: shade on the nose's right side, nostrils below
    const y = sp.ey + 2, sh = sp.skin[2], ln = sp.skin[3], lt = sp.skin[0];
    if (sp.nose === 'big') {
      for (let j = -1; j < 5; j++) put(CX + 2, y + j, sh);
      put(CX + 3, y + 4, sh); put(CX, y + 1, lt); put(CX, y + 2, lt);
      stamp(CX - 2, y + 5, ['k.ss.k'], { k: ln, s: sh });
    } else if (sp.nose === 'button') { put(CX + 1, y + 2, sh); put(CX + 2, y + 3, sh); stamp(CX - 1, y + 4, ['k.k'], { k: ln }); }
    else { for (let j = 0; j < 4; j++) put(CX + 2, y + j, sh); put(CX, y + 2, lt); stamp(CX - 1, y + 4, ['k.sk'], { k: ln, s: sh }); }
  }
  function contour(sp, head) { // cheekbones, eye sockets and jaw shadow give the flat head some form
    const sh = sp.skin[2], lt = sp.skin[0];
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      if (!head[y * S + x]) continue;
      const dx = x - CX, dy = y - sp.cy;
      if (dx > sp.w * .45 && dy > 1 && dy < sp.h * .55 && (x + y) % 2 === 0) put(x, y, sh);         // shaded right cheek
      if (dx < -sp.w * .35 && dx > -sp.w * .7 && dy > 2 && dy < 5) put(x, y, lt);                  // lit left cheekbone
      if (Math.abs(Math.abs(dx) - sp.ex) < 3 && dy === -3 + (sp.kid ? 0 : 0) && sp.socket) put(x, y, sh); // brow ridge
    }
  }
  function mouth(sp, mood) {
    let key = sp.mouthMap?.[mood] || mood;
    if (!MOUTHS[key]) key = 'neutral';
    const st = MOUTHS[key], w = st[0].length;
    stamp(CX - Math.floor(w / 2) + (sp.mouthX || 0), sp.my, st, { k: sp.lip || sp.skin[3], w: '#ffffff', r: '#b8404a', s: sp.skin[2] });
  }

  function shine(m, sp) { // glossy highlight band + strand lines on the hair
    const top = sp.cy - sp.h, [lt, , sh] = sp.hair;
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      if (!m[y * S + x] || !at(m, x - 1, y) || !at(m, x + 1, y) || !at(m, x, y - 1)) continue;
      const u = (x - CX + 3) / sp.w, band = top + 3 + u * u * 5;
      if (Math.abs(y - band) < 1 && u < .55 && u > -.9) put(x, y, lt);
      else if (Math.abs(y - band - 1) < 1 && u < .3 && u > -.6 && x % 2) put(x, y, lt);
      else if ((x * 7 + y * 3) % 11 === 0 && y > band + 2) put(x, y, sh);
    }
  }

  // ---------- hair, facial hair, hats, clothes ----------
  function headMask(sp) {
    const m = ell(newM(), CX, sp.cy, sp.w, sp.h);
    const b = sp.cy + sp.h;
    if (sp.jaw === 'square') poly(m, [[CX - sp.w, sp.cy], [CX + sp.w, sp.cy], [CX + sp.w - 1, b - 5], [CX + 4, b], [CX - 4, b], [CX - sp.w + 1, b - 5]]);
    if (sp.jaw === 'long') poly(m, [[CX - sp.w + 1, sp.cy], [CX + sp.w - 1, sp.cy], [CX + sp.w - 3, b - 2], [CX + 2, b + 2], [CX - 2, b + 2], [CX - sp.w + 3, b - 2]]);
    return m;
  }
  function hairMasks(sp) { // returns { back, front }
    const { cy, w, h } = sp, st = sp.hairStyle, top = cy - h;
    const back = newM(), front = newM();
    const shell = (grow = 1.5, line = .45) => { // hair cap; sides trimmed above the ears except a thin sideburn
      const m = minus(ell(newM(), CX, cy - 1, w + grow, h + grow), ell(newM(), CX, cy + h * line + 1, w - .5, h));
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++)
        if (y > cy - h * .42 && !(Math.abs(x - CX) > w - 2.5 && y < cy)) m[y * S + x] = 0;
      return m;
    };
    switch (st) {
      case 'part': { // neat side part with a swept fringe
        plus(front, shell(1.5, .5));
        poly(front, [[CX - w - 1, cy - h * .3], [CX - 3, top + 1], [CX + w, cy - h * .45], [CX + w - 3, cy - h * .32], [CX + 2, cy - h * .55], [CX - w + 3, cy - h * .25]]);
        break;
      }
      case 'wavy': { // full, wavy volume (missionaries)
        plus(front, shell(2.5, .42));
        for (let i = -3; i <= 3; i++) ell(front, CX + i * 3.6, top + 1 + (i % 2 ? 1 : -1), 3.4, 3);
        poly(front, [[CX - w - 2, cy - h * .45], [CX - 1, top + 2], [CX + w + 1, cy - h * .5], [CX + 2, cy - h * .62]]);
        break;
      }
      case 'kidMessy': { // center-parted braided boy, flyaway strands
        plus(front, shell(1.5, .4));
        for (const [x0, len] of [[-9, 5], [-4, 7], [2, 6], [7, 5], [10, 3]]) poly(front, [[CX + x0 - 2, top + 3], [CX + x0 + 2, top + 3], [CX + x0 + 1 - len * .2, top - len + 3]]);
        poly(front, [[CX - w, cy - 2], [CX - 1, top + 3], [CX - 4, cy - 6]]); poly(front, [[CX + w, cy - 2], [CX + 1, top + 3], [CX + 4, cy - 6]]);
        break;
      }
      case 'short': { // short modern / 1940s cut
        plus(front, shell(1.2, .5));
        poly(front, [[CX - w, cy - 4], [CX - 3, top + 2], [CX + w, cy - 5], [CX + 5, cy - 7], [CX - 4, cy - 6]]);
        break;
      }
      case 'bangs': { // soft modern bangs (연우)
        plus(front, shell(2, .44));
        for (let i = -2; i <= 2; i++) poly(front, [[CX + i * 5 - 4, cy - 9], [CX + i * 5 + 3, cy - 9], [CX + i * 5 + (i < 0 ? -2 : 2), cy - 3 - (i === 0 ? 1 : 0)]]);
        break;
      }
      case 'sangtu': { // topknot under a 망건 band
        plus(front, shell(.8, .52));
        ell(front, CX, top - 2, 3.2, 3.6);
        break;
      }
      case 'bun': { // married woman's 쪽진머리: centre part, low bun showing at the side
        plus(front, shell(1.2, .5));
        ell(back, CX + w - 1, cy + 3, 4, 4);
        break;
      }
      case 'balding': { // bald crown with side hair
        plus(front, minus(shell(1.2, .3), ell(newM(), CX, top + 1, w - 2, h * .55)));
        clipY(front, cy - h * .45, cy + 3);
        break;
      }
      case 'thinning': { // receding but combed
        plus(front, shell(1, .5));
        minus(front, ell(newM(), CX, top + 3, w - 4, 4));
        break;
      }
      case 'slick': plus(front, shell(1, .58)); break;          // combed back, forehead clear
      case 'buzz': plus(front, shell(.6, .52)); break;          // close crop
      case 'none': break;
    }
    return { back, front };
  }
  function facialHair(sp) {
    const m = newM(), my = sp.my, b = sp.cy + sp.h;
    for (const kind of sp.facial || []) {
      if (kind === 'walrus') poly(m, [[CX - 7, my - 2], [CX, my - 4], [CX + 7, my - 2], [CX + 8, my + 2], [CX + 4, my + 1], [CX, my], [CX - 4, my + 1], [CX - 8, my + 2]]);
      if (kind === 'trim') poly(m, [[CX - 5, my - 2], [CX, my - 3], [CX + 5, my - 2], [CX + 5, my], [CX, my - 1], [CX - 5, my]]);
      if (kind === 'thinKr') { poly(m, [[CX - 5, my - 2], [CX + 5, my - 2], [CX + 6, my + 2], [CX + 4, my - 1], [CX - 4, my - 1], [CX - 6, my + 2]]); }
      if (kind === 'goatee') poly(m, [[CX - 4, my + 2], [CX + 4, my + 2], [CX + 3, b + 2], [CX, b + 5], [CX - 3, b + 2]]);
      if (kind === 'krGoatee') poly(m, [[CX - 2, my + 3], [CX + 2, my + 3], [CX + 1, b + 6], [CX - 1, b + 6]]);
      if (kind === 'full') { poly(m, [[CX - sp.w, sp.cy + 2], [CX - sp.w + 3, my - 1], [CX + sp.w - 3, my - 1], [CX + sp.w, sp.cy + 2], [CX + sp.w - 1, b - 3], [CX + 4, b + 3], [CX - 4, b + 3], [CX - sp.w + 1, b - 3]]); minus(m, ell(newM(), CX, my + 1, 4, 2)); }
      if (kind === 'stubble') for (let y = my - 2; y < b; y++) for (let x = CX - sp.w + 2; x < CX + sp.w - 2; x++) if ((x * 3 + y * 5) % 7 === 0) put(x, y, sp.skin[2]);
    }
    return m;
  }
  function body(sp) {
    const kid = sp.kid, top = Math.round(sp.cy + sp.h + (kid ? 1 : 3)), hw = kid ? 20 : 25;
    const torso = poly(newM(), [[CX - hw - 2, 64], [CX - hw + 1, top + 6], [CX - 11, top], [CX + 11, top], [CX + hw - 1, top + 6], [CX + hw + 2, 64]]);
    return { torso, top };
  }
  function drawBody(sp) {
    const { torso, top } = body(sp), o = sp.outfit, rc = R[sp.cloth] || R.suit;
    if (o === 'hoodie') { // hood bunched behind the neck
      paint(ell(newM(), CX, top + 1, 15, 5), rc, { k: 2 });
    }
    paint(torso, rc, { k: 4 });
    const neck = rect(newM(), CX - 5, sp.cy + sp.h - 6, 10, top - (sp.cy + sp.h - 6) + 4);
    paint(neck, sp.skin, { k: 2, light: false, shadeFn: (x, y) => y < sp.cy + sp.h + 2 });
    // collar / front details drawn over the neck bottom
    const d = newM();
    if (o === 'suit' || o === 'labcoat') {
      const v = poly(newM(), [[CX - 6, top - 1], [CX + 6, top - 1], [CX + 1, top + 11], [CX - 1, top + 11]]);
      paint(v, R.shirt, { k: 2 });
      if (sp.tie === 'bow') { paint(poly(newM(), [[CX - 4, top], [CX, top + 2], [CX + 4, top], [CX + 4, top + 4], [CX, top + 2], [CX - 4, top + 4]]), R[sp.tieCol || 'black'], { k: 1 }); }
      else if (sp.tie) paint(poly(newM(), [[CX - 1, top + 1], [CX + 1, top + 1], [CX + 2, top + 9], [CX, top + 11], [CX - 2, top + 9]]), R[sp.tieCol || 'red'], { k: 1 });
      const lap = o === 'labcoat' ? R.white : rc;
      if (o === 'labcoat') { paint(poly(newM(), [[CX - 23, 64], [CX - 21, top + 6], [CX - 7, top], [CX - 1, top + 16], [CX - 3, 64]]), R.white, { k: 3 }); paint(poly(newM(), [[CX + 23, 64], [CX + 21, top + 6], [CX + 7, top], [CX + 1, top + 16], [CX + 3, 64]]), R.white, { k: 3 }); }
      else { line(CX - 7, top, CX - 1, top + 13, lap[3]); line(CX + 7, top, CX + 1, top + 13, lap[3]); }
    } else if (o === 'hanbok' || o === 'rag' || o === 'official') { // 저고리 with a white 동정 collar crossing left over right
      const band = poly(newM(), [[CX - 8, top - 1], [CX - 4, top - 1], [CX + 9, top + 12], [CX + 5, top + 13]]);
      paint(band, o === 'official' ? R.white : R.hanbok, { k: 1 });
      const band2 = poly(newM(), [[CX + 8, top - 1], [CX + 4, top - 1], [CX + 1, top + 5], [CX + 4, top + 6]]);
      paint(band2, R.hanbok, { k: 1 });
      if (o === 'official') { // 흉배: embroidered chest badge
        const badge = rect(newM(), CX - 9, top + 7, 9, 9); paint(badge, R.navy, { k: 2 });
        stamp(CX - 8, top + 9, ['.g.g.', 'ggggg', '.ggg.', 'g.g.g'], { g: R.gold[1] });
      } else if (sp.goreum !== false) { // ribbon tie
        paint(poly(newM(), [[CX + 5, top + 11], [CX + 9, top + 12], [CX + 7, top + 22], [CX + 4, top + 21]]), R[sp.goreum || 'red'], { k: 1 });
      }
      if (o === 'rag') { // patches and a tear
        paint(rect(newM(), CX - 15, top + 8, 6, 5), R.khaki, { k: 1 }); paint(rect(newM(), CX + 12, top + 10, 5, 4), R.brown, { k: 1 });
        line(CX - 4, 60, CX - 2, 64, R.rag[3]);
      }
    } else if (o === 'uniform' || o === 'police') { // standing collar + buttons
      const col = rect(newM(), CX - 8, top - 2, 16, 4);
      paint(col, R.uni, { k: 1 });
      if (o === 'uniform') { put(CX - 7, top - 2, '#fff'); put(CX + 6, top - 2, '#fff'); line(CX - 7, top - 2, CX + 6, top - 2, '#d8dce8'); }
      if (o === 'police') { paint(rect(newM(), CX - 8, top - 2, 4, 4), R.red, { k: 1 }); paint(rect(newM(), CX + 4, top - 2, 4, 4), R.red, { k: 1 }); }
      for (let y = top + 4; y < 64; y += 5) { put(CX, y, R.gold[1]); put(CX + 1, y, R.gold[2]); }
    } else if (o === 'hoodie') {
      line(CX - 3, top + 1, CX - 4, top + 10, '#ffffff'); line(CX + 3, top + 1, CX + 4, top + 10, '#ffffff');
      paint(rect(newM(), CX - 2, top - 1, 4, 2), R.shirt, { k: 1 });
      stamp(CX + 9, top + 9, ['.gg.', 'g..g', '.gg.'], { g: '#ffffff' }); // little crest
    } else if (o === 'work') { // rough collar, open neck
      paint(poly(newM(), [[CX - 9, top - 1], [CX - 3, top - 1], [CX, top + 7], [CX - 7, top + 4]]), R[sp.cloth], { k: 1 });
      paint(poly(newM(), [[CX + 9, top - 1], [CX + 3, top - 1], [CX, top + 7], [CX + 7, top + 4]]), R[sp.cloth], { k: 1 });
    } else if (o === 'robe') {
      line(CX, top, CX, 64, R.purple[3]);
    }
    return d;
  }
  function hat(sp) {
    const { cy, w, h } = sp, top = cy - h, k = sp.hat;
    if (k === 'gat') { // translucent horsehair 갓: crown + wide brim + bead strap
      const crown = poly(newM(), [[CX - 6, top - 9], [CX + 6, top - 9], [CX + 7, top + 2], [CX - 7, top + 2]]);
      paint(crown, R.black, { dither: true, k: 1 });
      const brim = ell(newM(), CX, top + 2, w + 10, 2.6);
      paint(brim, R.black, { dither: true, k: 1 });
      for (let y = top + 4; y < cy + h - 2; y += 2) { put(CX - w - 1 + (y - top) * .12, y, '#f2e6c8'); put(CX + w + 1 - (y - top) * .12, y, '#f2e6c8'); }
    }
    if (k === 'manggeon') { // horsehair headband only
      paint(rect(newM(), CX - w + 1, cy - h * .5, (w - 1) * 2, 3), R.black, { k: 1, dither: true });
    }
    if (k === 'student' || k === 'police') { // peaked cap with badge
      const dome = minus(ell(newM(), CX, top + 3, w + 1.5, 7), rect(newM(), 0, top + 6, S, S));
      rect(dome, CX - w - 1, top - 1, (w + 1) * 2 + 1, 6);
      paint(dome, R.uni, { k: 2 });
      if (k === 'police') paint(rect(newM(), CX - w - 1, top + 3, (w + 1) * 2 + 1, 3), R.red, { k: 1 });
      paint(ell(newM(), CX, top + 6, w + 2, 2.2), R.black, { k: 1 });           // visor
      stamp(CX - 1, top, k === 'police' ? ['.g.', 'ggg', '.g.'] : ['gg', 'gg'], { g: R.gold[1] });
    }
    if (k === 'headband') {
      paint(rect(newM(), CX - w, cy - h * .45, w * 2, 3), R.white, { k: 1 });
      paint(poly(newM(), [[CX + w - 2, cy - h * .45], [CX + w + 4, cy - h * .45 + 4], [CX + w + 2, cy - h * .45 + 6], [CX + w - 2, cy - h * .45 + 3]]), R.white, { k: 1 });
    }
    if (k === 'bandage') { // head bandage with a spot of blood
      paint(poly(newM(), [[CX - w, cy - 7], [CX + w, cy - 10], [CX + w, cy - 6], [CX - w, cy - 3]]), R.white, { k: 1 });
      put(CX + 4, cy - 7, '#c83a3a'); put(CX + 5, cy - 7, '#c83a3a'); put(CX + 5, cy - 8, '#e05050');
    }
  }

  // ---------- the cast ----------
  const base = (o) => Object.assign({ cy: 28, w: 12, h: 14, jaw: 'round', skin: R.skin, eyes: 'adult', nose: 'small', bg: 'warm' }, o);
  const SPECS = {
    bokdong_kid: base({ bg: 'warm', kid: true, cy: 31, w: 12, h: 12.5, skin: R.skinT, hair: R.black, hairStyle: 'kidMessy', outfit: 'rag', cloth: 'rag', eyes: 'kid', nose: 'button', mouthMap: { neutral: 'smirk', smile: 'grin' }, goreum: 'brown',
      extra: sp => { put(CX - 9, sp.ey + 5, R.skinT[2]); put(CX - 8, sp.ey + 5, R.skinT[2]); put(CX - 8, sp.ey + 6, R.skinT[2]); put(CX + 9, sp.ey - 6, R.skinT[3]); } }), // dirt smudge + scar nick
    makdong: base({ bg: 'warm', kid: true, cy: 33, w: 11, h: 11, skin: R.skinT, hair: R.black, hairStyle: 'kidMessy', outfit: 'rag', cloth: 'hanbok', eyes: 'kid', nose: 'button', blush: '#e89a88', goreum: 'blue' }),
    bokdong_adult: base({ bg: 'rose', skin: R.skinT, hair: R.black, hairStyle: 'short', hat: 'headband', outfit: 'work', cloth: 'khaki', jaw: 'square', facial: ['thinKr', 'stubble'], browThick: 2, mouthMap: { smile: 'grin' } }),
    bokdong_old: base({ bg: 'cold', skin: R.skinO, hair: R.gray, hairStyle: 'thinning', outfit: 'work', cloth: 'grayC', eyes: 'old', jaw: 'square', facial: ['thinKr'], browCol: '#9aa0b0', browThick: 2,
      extra: sp => { line(CX - 6, sp.cy - 9, CX - 2, sp.cy - 10, sp.skin[2]); line(CX + 2, sp.cy - 10, CX + 6, sp.cy - 9, sp.skin[2]); line(CX - 8, sp.my - 3, CX - 7, sp.my + 1, sp.skin[2]); line(CX + 8, sp.my - 3, CX + 7, sp.my + 1, sp.skin[2]); } }),
    allen: base({ bg: 'warm', hair: R.brown, hairStyle: 'part', outfit: 'suit', cloth: 'suit', tie: 'bow', facial: ['trim', 'goatee'], nose: 'big', jaw: 'long', iris: '#4a6a8a', glasses: 'round' }),
    underwood: base({ bg: 'warm', hair: R.auburn, hairStyle: 'wavy', outfit: 'suit', cloth: 'suitB', tie: 'red', facial: ['full'], nose: 'big', iris: '#4a6a8a', mouthMap: { smile: 'smile' } }),
    underwood_old: base({ bg: 'rose', skin: R.skinO, hair: R.gray, hairStyle: 'thinning', outfit: 'suit', cloth: 'suitB', tie: 'black', facial: ['full'], nose: 'big', eyes: 'old', iris: '#4a6a8a', browCol: '#8a90a2', browThick: 2 }),
    appenzeller: base({ bg: 'warm', hair: R.black, hairStyle: 'wavy', outfit: 'suit', cloth: 'suit', tie: 'bow', facial: ['walrus'], nose: 'big', w: 12.5, iris: '#3a4a6a' }),
    avison: base({ bg: 'rose', hair: R.brown, hairStyle: 'part', outfit: 'labcoat', cloth: 'suit', tie: 'black', facial: ['trim'], nose: 'big', jaw: 'square', iris: '#4a5a7a', browThick: 2 }),
    severance: base({ bg: 'rose', skin: R.skinO, hair: R.white, hairStyle: 'balding', outfit: 'suit', cloth: 'suit', tie: 'bow', facial: ['walrus'], nose: 'big', eyes: 'old', iris: '#4a6a8a', browCol: '#b8c0d0', browThick: 2 }),
    park_seoyang: base({ bg: 'rose', hair: R.black, hairStyle: 'slick', partLine: true, outfit: 'labcoat', cloth: 'suit', tie: 'black', eyes: 'adult', w: 11.5, jaw: 'long' }),
    yun: base({ bg: 'cold', hair: R.black, hairStyle: 'short', hat: 'student', outfit: 'uniform', cloth: 'uni', eyes: 'adult', jaw: 'long', w: 11.5, h: 14.5, iris: '#1e1a22' }),
    jeong_byeongwook: base({ bg: 'cold', hair: R.black, hairStyle: 'buzz', outfit: 'uniform', cloth: 'uni', eyes: 'kid', w: 12.5, h: 13.5, nose: 'button', blush: '#eaa090' }),
    choi: base({ bg: 'cold', hair: R.black, hairStyle: 'thinning', partLine: true, outfit: 'suit', cloth: 'suit', tie: 'black', glasses: 'round', jaw: 'square', eyes: 'narrow' }),
    jeong_inbo: base({ bg: 'cold', skin: R.skinO, hair: R.black, hairStyle: 'short', outfit: 'hanbok', cloth: 'grayC', glasses: 'round', jaw: 'long', w: 11, eyes: 'narrow', goreum: 'grayC' }),
    baek_namun: base({ bg: 'cold', hair: R.black, hairStyle: 'slick', outfit: 'suit', cloth: 'suit', tie: 'red', jaw: 'square', w: 12.5, browThick: 2 }),
    guard: base({ bg: 'night', skin: R.skinO, hair: R.black, hairStyle: 'short', hat: 'police', outfit: 'police', cloth: 'uni', eyes: 'narrow', jaw: 'square', facial: ['trim'], browThick: 2, mouthMap: { neutral: 'neutral' },
      extra: sp => { for (let x = CX - sp.w + 1; x < CX + sp.w; x++) for (let y = sp.cy - sp.h + 7; y < sp.ey - 1; y++) if ((x + y) % 2 === 0) put(x, y, sp.skin[3]); } }), // cap shadow over the brow
  };
  // the 기록관: hood, shadowed face, lantern glow
  SPECS.keeper = base({ bg: 'night', skin: R.skinT, hair: R.black, hairStyle: 'kidMessy', outfit: 'robe', cloth: 'purple', eyes: 'kid', kid: true, cy: 31, w: 12, h: 12.5, hood: true, mouthMap: { reveal: 'grin', neutral: 'neutral' } });
  // the player, 연우: Yonsei-blue hoodie, modern bangs
  SPECS.me = base({ bg: 'cold', hair: R.black, hairStyle: 'bangs', outfit: 'hoodie', cloth: 'blue', eyes: 'adult', nose: 'small', w: 11.5, h: 13.5 });
  // generic NPCs intentionally have no portrait (name plate only)
  delete SPECS.guard;
  SPECS.kim_pilsun = SPECS.park_seoyang; SPECS.baek_nakjun = SPECS.baek_namun;

  // ---------- assembly ----------
  function render(id, mood) {
    const sp0 = SPECS[id];
    if (!sp0) return null;
    const sp = Object.assign({}, sp0);
    // big-head framing: faces fill most of the frame, shoulders peek in at the bottom
    sp.w *= 1.42; sp.h *= 1.36; sp.cy = 29 + (sp.kid ? 2 : 0) + (sp.cyOff || 0);
    sp.ex = Math.round(sp.w * .44); sp.ey = Math.round(sp.cy + 1); sp.my = Math.round(sp.cy + sp.h * .58);
    if (sp.kid) { sp.ey = Math.round(sp.cy + 2); sp.my = Math.round(sp.cy + sp.h * .62); }
    buf = new Uint8ClampedArray(S * S * 4);

    // background: flat era colour, dithered lighter disc behind the head, diagonal stripes
    const [bb, bl] = BG[sp.bg] || BG.warm;
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const d = Math.hypot(x - 26, y - 22) / 34, t = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5][(y & 3) * 4 + (x & 3)] / 16;
      put(x, y, 1 - d > t * .9 + .05 ? bl : bb);
    }
    const head = headMask(sp), hm = hairMasks(sp);
    if (sp.hood) { // hood back panel
      paint(ell(newM(), CX, sp.cy + 2, sp.w + 8, sp.h + 9), R.purple, { k: 3 });
    }
    paint(hm.back, sp.hair, { k: 2 });
    drawBody(sp);
    // ears
    if (!sp.hood) for (const s of [-1, 1]) {
      const ear = ell(newM(), CX + s * sp.w, sp.ey + 1, 2.6, 4);
      paint(ear, sp.skin, { k: 1, light: false });
      put(CX + s * sp.w, sp.ey + 1, sp.skin[2]);
    }
    paint(head, sp.skin, { k: 3 });
    contour(sp, head);
    // features
    eyes(sp, mood); brows(sp, mood); nose(sp); mouth(sp, mood);
    if (sp.extra) sp.extra(sp);
    const fh = facialHair(sp);
    if (fh.some(Boolean)) paint(fh, sp.facialCol || sp.hair, { k: 2 });
    if (sp.facial?.includes('walrus') || sp.facial?.includes('full')) { // keep the mouth readable under the moustache
      if (mood === 'smile' || mood === 'surprised' || mood === 'angry') mouth(sp, mood);
    }
    if (sp.glasses) for (const s of [-1, 1]) {
      const gx = CX + s * sp.ex, ring = minus(ell(newM(), gx, sp.ey, 4.2, 3.6), ell(newM(), gx, sp.ey, 3.2, 2.6));
      for (let i = 0; i < ring.length; i++) if (ring[i]) put(i % S, (i / S) | 0, '#3a2e26');
      put(gx - 1, sp.ey - 1, '#ffffff');
      line(CX - 1, sp.ey - 1, CX + 1, sp.ey - 1, '#3a2e26');
      line(CX + s * (sp.ex + 4), sp.ey - 1, CX + s * sp.w, sp.ey - 2, '#3a2e26');
    }
    paint(hm.front, sp.hair, { k: 2 });
    if (!['thinning', 'balding'].includes(sp.hairStyle)) shine(hm.front, sp);
    if (sp.partLine) line(CX - 5, sp.cy - sp.h + 1, CX - 7, sp.cy - sp.h * .52, sp.hair[3]);
    cast(head, hm.front, 1, 2, sp.skin[2]);
    hat(sp);
    if (sp.hat === 'gat' || sp.hat === 'student' || sp.hat === 'police') cast(head, ell(newM(), CX, sp.cy - sp.h + 4, sp.w + 3, 3), 0, 2, sp.skin[2]);

    if (sp.hood) { // hood front: frames the face, face falls into shadow, lantern lights it from below-right
      const hood = minus(ell(newM(), CX, sp.cy - 1, sp.w + 7, sp.h + 8), ell(newM(), CX, sp.cy + 3, sp.w - .5, sp.h + 1));
      clipY(hood, 0, 52);
      paint(hood, R.purple, { k: 3 });
      for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
        if (!head[y * S + x] || hood[y * S + x]) continue;
        const lit = Math.hypot(x - 44, y - 48) < 18;
        if (mood === 'reveal' || lit) continue;
        if (y < sp.ey + 3) put(x, y, '#1a1028');                       // hood shadow: solid over the eyes
        else if ((x + y) % 2 === 0) put(x, y, '#2a1c38');              // dithered falloff toward the chin
      }
      if (mood !== 'reveal') { // two glints instead of eyes
        for (const s of [-1, 1]) { put(CX + s * sp.ex, sp.ey, '#ffe8a0'); put(CX + s * sp.ex, sp.ey + 1, '#f8b048'); }
      }
      // lantern
      const lx = 50, ly = 54;
      for (let y = -9; y <= 9; y++) for (let x = -9; x <= 9; x++) { const d = Math.hypot(x, y) / 9; if (d < 1 && (x + y) % 2 === 0 && 1 - d > .3) put(lx + x, ly + y, d < .4 ? '#fff0b0' : '#f0a848'); }
      paint(rect(newM(), lx - 3, ly - 4, 7, 8), R.gold, { k: 2 }); put(lx, ly, '#ffffff'); put(lx, ly - 1, '#fff8c0');
    }
    const c = document.createElement('canvas'); c.width = c.height = S;
    c.getContext('2d').putImageData(new ImageData(buf, S, S), 0, 0);
    return c;
  }

  const cache = {};
  window.Portraits = {
    size: S,
    ids: Object.keys(SPECS),
    get(id, mood = 'neutral') {
      if (!id || id === 'narrator') return null;
      if (id === 'keeper' && mood !== 'reveal') mood = 'neutral';
      const key = id + ':' + mood;
      if (!(key in cache)) { try { cache[key] = render(id, mood); } catch (e) { console.warn('portrait', id, e); cache[key] = null; } }
      return cache[key];
    },
    credits() { return []; }, // all portraits are original pixel art
  };
})();
