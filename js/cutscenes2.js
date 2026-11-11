// cutscenes2.js - registers scenes c3, c4, epilogue (engine + intro/c1/c2 live in cutscenes.js).
// Scene space is 384x256; each make() returns draw(t) (t = frames since shot start, 60Hz).
// All painting goes through window.Art (active context = cutscene canvas while draw() runs).
(function () {
  'use strict';
  const A = window.Art;
  const px = (c, x, y, w, h) => A.px(c, x, y, w, h);
  const { grad, dglow, light, poly, blob, line, ridge, roof, rng, wrap, layer } = A;

  // ---- local helpers ----
  let scratch;
  const cx = () => { scratch = scratch || document.createElement('canvas').getContext('2d'); const p = A.ctx(scratch); A.ctx(p); return p; };
  const img = (c, x, y) => { const g = cx(); g.drawImage(c, Math.round(x), Math.round(y)); };
  const alpha = a => { cx().globalAlpha = a; };
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ease = v => { v = clamp(v); return v * v * (3 - 2 * v); };
  const FONT = '"Galmuri11","Galmuri9","Malgun Gothic",monospace';
  function txt(s, x, y, size, col, align) {
    const g = cx(); g.font = `${size}px ${FONT}`; g.textAlign = align || 'center'; g.textBaseline = 'middle';
    g.fillStyle = col; g.fillText(s, Math.round(x), Math.round(y));
  }
  function man(x, y, h, o = {}) { // silhouette person, feet at (x,y)
    const b = o.body || '#14122a', w = Math.max(3, h * .3), sh = y - h * .78, lw = w * (o.coat ? .85 : .5), rs = o.rs || 1;
    poly([[x - w / 2, sh], [x + w / 2, sh], [x + lw, y], [x - lw, y]], b);
    blob(x, y - h * .9, Math.max(1.5, h * .085), Math.max(2, h * .1), o.skin || b);
    const hy = y - h * .98, hc = o.hatc || b;
    if (o.hat === 'cap') { px(hc, x - h * .1, hy + h * .02, h * .2, 2); px(hc, x - h * .08, hy - h * .02, h * .16, 2); }
    else if (o.hat === 'wide') { px(hc, x - h * .17, hy + h * .03, h * .34, 1); px(hc, x - h * .09, hy - h * .06, h * .18, h * .09); }
    if (o.rim) { px(o.rim, x + rs * w / 2 - (rs > 0 ? 1 : 0), sh, 1, y - sh); px(o.rim, x + rs * h * .085 - (rs > 0 ? 1 : 0), y - h * .93, 1, 3); }
  }
  function poplar(x, y, s, a, b) { // baekyang: pale trunk, slim crown
    px('#c8bca8', x - Math.max(1, s * 1.2), y - 30 * s, Math.max(2, s * 2.4), 30 * s);
    blob(x, y - 62 * s, 6 * s + .5, 36 * s, a || '#2a6a38'); blob(x - 2 * s, y - 66 * s, 3 * s + .5, 28 * s, b || '#7ab858');
  }
  function flag(x, y, w, t, ph) { // waving 태극기 (columns offset by a sine), w wide, 2:3
    const h = Math.round(w * .66), R = Math.max(2, w * .17);
    for (let i = 0; i < w; i++) {
      const oy = Math.round(Math.sin(t * .13 + i * .45 + ph) * 1.5), sh = Math.sin(t * .13 + i * .45 + ph) > .6;
      px(sh ? '#d6d0c0' : '#f4f0e4', x + i, y + oy, 1, h);
      const dx = i - w / 2 + .5;
      if (Math.abs(dx) < R) { const d = Math.sqrt(R * R - dx * dx); px('#c8322a', x + i, y + oy + h / 2 - d, 1, d); px('#2a4a9a', x + i, y + oy + h / 2, 1, d); }
      if (w > 12 && (i < 2 || i >= w - 2)) { px('#14141c', x + i, y + oy + 1, 1, 2); px('#14141c', x + i, y + oy + h - 3, 1, 2); }
    }
    px('#5a4028', x - 1, y, 1, h + 14); // pole
  }
  // person with optional raised arm; used for crowds
  function folk(x, y, h, col, up, t, ph) {
    const w = Math.max(3, h * .3 | 0), j = up ? Math.round(Math.abs(Math.sin(t * .09 + ph)) * 2) : 0;
    px(col, x - w / 2, y - h * .62 - j, w, h * .62);
    blob(x, y - h * .74 - j, h * .1, h * .11, '#d8a880'); px('#1a1210', x - h * .1, y - h * .86 - j, h * .2, 3);
    if (up) line(x + w / 2, y - h * .55 - j, x + w / 2 + 2, y - h * 1.02 - j - Math.sin(t * .12 + ph) * 2, col);
  }

  // =====================================================================================
  // c3  1919 - 1941
  // =====================================================================================

  // ----- shot: 남대문역 광장, students rally (1919-03-05) -----
  const c3Station = () => {
    const W = 424, r = rng(19);
    const bg = layer(W, 256, () => {
      grad(0, 0, W, 190, [[0, '#6a7a92'], [.5, '#b8b4a8'], [1, '#f0d4a0']]);
      for (let i = 0; i < 6; i++) { const x = r() * W, y = 20 + r() * 90, rx = 40 + r() * 60; blob(x, y, rx, 7, '#8a96a8'); blob(x, y - 3, rx * .8, 4, '#c8ccd0'); }
      ridge(W, 150, 8, 2.2, '#5a6a7a', 256, '#8a9aaa');
      // Western-style station building
      const brick = '#6a3a34', dk = '#3a2024';
      px(brick, 70, 118, 290, 76); px(dk, 70, 114, 290, 5);
      px(brick, 180, 84, 70, 110); poly([[172, 86], [215, 56], [258, 86]], dk); px('#c8b890', 207, 66, 16, 16); blob(215, 74, 6, 6, '#e8dcc0'); px('#3a2024', 215, 70, 1, 5); px('#3a2024', 215, 74, 4, 1);
      for (const x of [70, 340]) { px(brick, x, 98, 20, 96); poly([[x - 3, 100], [x + 10, 80], [x + 23, 100]], dk); }
      for (let x = 98; x < 340; x += 22) { if (x > 172 && x < 252) continue; px('#1a1420', x, 136, 8, 14); px('#d8a050', x + 1, 137, 2, 3); px('#1a1420', x, 164, 8, 14); }
      px('#1a1420', 205, 150, 20, 44); blob(215, 150, 10, 8, '#1a1420');
      for (let i = 0; i < 7; i++) px('#8a5a44', 70 + i * 40, 118, 1, 76);
      px('#c8b890', 60, 194, 310, 3);
      grad(0, 194, W, 62, [[0, '#bca888'], [.5, '#8a7860'], [1, '#4a3c30']]);
      for (let y = 198; y < 256; y += 4) for (let x = (y >> 2 & 1) * 6; x < W; x += 12) px('#7a6a54', x, y, 5, 1);
    });
    // crowd rows: [x, row y, height, colour, arm up, has flag]
    const crowd = [];
    for (let row = 0; row < 4; row++) for (let i = 0; i < 26 - row * 2; i++) {
      const y = 214 + row * 11, wht = r() < .22;
      crowd.push({ x: r() * W, y, h: 24 + row * 3, col: wht ? '#d8d2c0' : ['#1c1c28', '#242434', '#2a2230'][r() * 3 | 0], up: r() < .5, fl: r() < .35, ph: r() * 6 });
    }
    const leaf = Array.from({ length: 34 }, () => ({ x: r() * W, y: r() * 256, s: .25 + r() * .3, p: r() * 6 }));
    return t => {
      const ox = -Math.floor(Math.min(34, t * .035));
      img(bg, ox, 0);
      for (const c of crowd) {
        const x = c.x + ox * (.9 + c.y / 700);
        folk(x, c.y, c.h, c.col, c.up, t, c.ph);
        if (c.up && c.fl) flag(x + c.h * .15, c.y - c.h * 1.02 - 12, 14, t, c.ph);
        if (c.y === 225) { /* mid row done; rickshaw drawn after */ }
      }
      // rickshaw with 김원벽 standing on it, flag high
      const rx = 196 + ox;
      blob(rx - 14, 240, 9, 9, '#1a1218'); blob(rx - 14, 240, 6, 6, '#8a6a44'); blob(rx + 14, 240, 9, 9, '#1a1218'); blob(rx + 14, 240, 6, 6, '#8a6a44');
      px('#2a1a14', rx - 16, 226, 32, 8); px('#3a2a20', rx - 14, 218, 28, 8);
      line(rx + 14, 226, rx + 36, 240, '#2a1a14');
      const lean = Math.sin(t * .06) * 1.5;
      man(rx, 218, 36, { body: '#14141e', skin: '#d8a880', hat: 'cap', rim: '#f0d8a0' });
      line(rx + 4, 198, rx + 12 + lean, 170, '#14141e');
      flag(rx + 11 + lean, 148, 30, t, 0);
      line(rx - 4, 198, rx - 10, 186, '#14141e');
      // sun-lit haze and drifting leaflets (독립선언서)
      light(120 + ox, 70, 150, '255,226,170', .2);
      alpha(.9); for (const l of leaf) { px('#f4ecd8', wrap(l.x + Math.sin(t * .03 + l.p) * 12 + ox, W), wrap(l.y + t * l.s, 256), 2, 2); } alpha(1);
      // foreground silhouettes, rim lit
      for (const [fx, fh] of [[20, 62], [76, 54], [330, 66], [380, 56]]) man(fx + ox * 1.4, 262, fh, { body: '#0a0a12', hat: 'cap', rim: '#e8c890' });
    };
  };

  // ----- shot: 제암리, burnt village, 스코필드 behind a camera (1919-04) -----
  const c3Jeam = () => {
    const W = 424, r = rng(29);
    const bg = layer(W, 256, () => {
      grad(0, 0, W, 190, [[0, '#2a3038'], [.5, '#5a626a'], [.85, '#9a9a94'], [1, '#c4b49c']]);
      ridge(W, 150, 12, 4.4, '#3a4650', 256, '#6a7a84');
      ridge(W, 176, 9, 1.7, '#242c34', 256, '#4a5864');
      grad(0, 196, W, 60, [[0, '#2c2824'], [1, '#0e0c0c']]);
      // charred house frames: posts, crooked beams, collapsed roof
      for (const [x, w, h] of [[70, 70, 46], [190, 84, 52], [310, 64, 40]]) {
        const y = 206;
        px('#0c0a0a', x - w / 2, y - 6, w, 6);
        for (let i = 0; i <= 4; i++) { const ph = h - (i % 2) * 14 - r() * 10; px('#0e0a0a', x - w / 2 + i * w / 4, y - ph, 3, ph); px('#4a2a1a', x - w / 2 + i * w / 4 + 2, y - ph, 1, ph * .6); }
        line(x - w / 2, y - h, x + w / 2 - 6, y - h + 12, '#0e0a0a'); line(x - w / 2 + 2, y - h + 1, x + w / 2 - 4, y - h + 13, '#0e0a0a');
        poly([[x + 8, y - 6], [x + w / 2 + 14, y - 6], [x + w / 2 + 4, y - 22]], '#12090a');
      }
      for (let i = 0; i < 40; i++) px(r() < .5 ? '#1a1414' : '#2a2018', r() * W, 210 + r() * 46, 2 + r() * 5, 1);
    });
    const embers = [[56, 204], [92, 205], [182, 205], [212, 204], [300, 205], [326, 205]];
    const smoke = Array.from({ length: 44 }, (_, i) => ({ e: embers[i % embers.length], o: r() * 400, s: .25 + r() * .25, sz: 5 + r() * 7 }));
    return t => {
      img(bg, 0, 0);
      // smoke columns drifting right and widening
      for (const s of smoke) {
        const u = (t * s.s + s.o) % 200, a = (1 - u / 200) * .5;
        alpha(a); blob(s.e[0] + u * .35 + Math.sin(u * .06 + s.o) * 5, s.e[1] - u * .85, s.sz + u * .09, s.sz * .8 + u * .07, '#3a3a40'); alpha(1);
      }
      for (const [ex, ey] of embers) { const f = .5 + .5 * Math.sin(t * .13 + ex); alpha(.5 + f * .4); px('#f08a28', ex - 3, ey, 7, 2); px('#ffd068', ex - 1, ey, 3, 1); alpha(1); light(ex, ey - 2, 30, '255,120,40', .18 + f * .1); }
      // 스코필드: wide-brim hat, tripod camera, black cloth
      const gx = 270, gy = 246;
      line(gx - 22, gy, gx - 12, gy - 28, '#0a0808'); line(gx - 2, gy, gx - 12, gy - 28, '#0a0808'); line(gx - 12, gy, gx - 12, gy - 28, '#0a0808');
      px('#0a0808', gx - 22, gy - 42, 20, 14); px('#3a3a42', gx - 22, gy - 42, 20, 1); blob(gx - 24, gy - 36, 3, 3, '#1a1c24'); px('#7a8aa0', gx - 25, gy - 37, 2, 2);
      poly([[gx - 3, gy - 42], [gx + 16, gy - 36], [gx + 12, gy - 18], [gx - 2, gy - 28]], '#0a0808');
      man(gx + 14, gy, 66, { body: '#0a0a0e', coat: 1, hat: 'wide', hatc: '#0a0a0e', rim: '#8a9aa8', rs: -1 });
      // quiet camera flash
      const fz = (t - 90) % 420;
      if (t > 90 && fz < 14) { const fa = (1 - fz / 14) * .55; cx().fillStyle = `rgba(235,240,255,${fa})`; cx().fillRect(0, 0, 384, 256); }
      alpha(.18); for (let i = 0; i < 30; i++) px('#9aa0a8', wrap(r() * 384 + t * .2 * (1 + i % 3), 384), wrap(i * 53 + t * .3, 256), 1, 1); alpha(1);
    };
  };

  // ----- shot: 핀슨관 attic, 윤동주 copying poems by lamplight (1941) -----
  const c3Attic = () => {
    const r = rng(61);
    const bg = layer(384, 256, () => {
      px('#080c12', 0, 0, 384, 256);
      // rafters under a steep roof
      poly([[0, 0], [384, 0], [384, 40], [192, 12], [0, 40]], '#0a0e16');
      for (let i = -6; i <= 6; i++) { line(192 + i * 6, 12 + Math.abs(i) * 1.5, 192 + i * 34, 256, '#10161e'); }
      for (const y of [60, 110]) line(0, y, 384, y - 28, '#0d121a');
      // gable window, rain-blue night
      px('#223040', 150, 44, 84, 80); px('#0e1a2c', 154, 48, 76, 72);
      grad(154, 48, 76, 72, [[0, '#0a1424'], [1, '#243a56']]);
      px('#10161e', 191, 48, 2, 72); px('#10161e', 154, 82, 76, 2);
      // boxes / bundles on the side
      px('#1a1410', 28, 170, 56, 40); px('#241a14', 28, 170, 56, 3); px('#14100c', 60, 190, 44, 24); px('#2a2018', 60, 190, 44, 2);
      for (let i = 0; i < 5; i++) px('#2a2418', 300 + i * 8, 160 - i * 4, 7, 50 + i * 4);
      // floor + desk
      grad(0, 214, 384, 42, [[0, '#120e0c'], [1, '#050404']]);
      px('#2a1a10', 112, 168, 170, 6); px('#1a0f0a', 118, 174, 6, 42); px('#1a0f0a', 270, 174, 6, 42);
    });
    const dust = Array.from({ length: 36 }, () => ({ x: 150 + r() * 120, y: 90 + r() * 110, s: .05 + r() * .12, p: r() * 6 }));
    const rain = Array.from({ length: 28 }, () => ({ x: 154 + r() * 74, o: r() * 100, s: .35 + r() * .4 }));
    return t => {
      img(bg, 0, 0);
      alpha(.7); for (const d of rain) { const y = 48 + wrap(t * d.s + d.o, 74); px('#b0cce8', d.x, y, 1, 4); px('#b0cce8', d.x + 1, y - 9, 1, 1); } alpha(1);
      const fk = Math.sin(t * .37) * .5 + Math.sin(t * .11) * .5;
      // papers: three stacks (the three copies) and the page being written
      px('#e8dcc0', 232, 160, 30, 8); px('#bba890', 232, 164, 30, 1); px('#f4ecd0', 232, 160, 30, 1);
      px('#e0d4b8', 242, 154, 22, 6); px('#bba890', 242, 157, 22, 1);
      px('#f4ecd0', 160, 162, 36, 6); for (let i = 0; i < 4; i++) px('#7a6a52', 164, 163 + (i & 1) * 2 + (i >> 1) * 0, 26 - i * 3, 1);
      // lamp
      px('#1a1010', 212, 152, 4, 16); px('#2a140c', 208, 140, 12, 14); px('#fff0b0', 210, 144 + fk * .5, 8, 8); px('#ffe070', 213, 146, 2, 4);
      // 윤동주: seated, head bowed, writing arm moves
      const P = '#0c0706', RM = '#f0a858', wr = Math.sin(t * .09) * 2;
      poly([[116, 168], [122, 130], [140, 118], [158, 126], [166, 168]], P); blob(150, 112, 8, 9, P);
      px(P, 142, 100, 16, 3); px(P, 147, 96, 8, 5); // cap
      poly([[152, 128], [166, 134], [178 + wr, 160], [172 + wr, 165]], P);
      line(153, 128, 160, 168, RM); px(RM, 158, 108, 1, 8); px(RM, 155, 104, 3, 1);
      px('#ffe8a0', 176 + wr, 163, 3, 1); // pen tip
      // light
      light(213, 152, 120, '255,190,90', .32 + .06 * fk); light(213, 150, 190, '255,160,60', .12);
      alpha(.55); for (const d of dust) px('#ffe8b8', d.x + Math.sin(t * .02 + d.p) * 6, wrap(d.y - t * d.s, 130) + 80, 1, 1); alpha(1);
      light(192, 84, 90, '120,160,220', .08);
    };
  };

  Cutscenes.register('c3', {
    tag: 'CHAPTER 3 · 1919–1941', music: 'cut_rain',
    shots: [
      { caption: '1919년 3월 5일, 남대문역 앞.\n학생들이 태극기를 들고 광장을 메웠다.', make: c3Station },
      { caption: '1919년 4월, 제암리.\n불탄 마을을 스코필드가 카메라에 담았다.', make: c3Jeam },
      { caption: '1941년 늦가을, 연희전문 핀슨관.\n윤동주는 19편의 시를 손으로 옮겨 적었다.', make: c3Attic },
    ],
  });

  // =====================================================================================
  // c4  1942 - 1945
  // =====================================================================================

  // ----- shot: the Underwood statue pulled down (1942-08-17) -----
  const c4Statue = () => {
    const W = 424, r = rng(42);
    const bg = layer(W, 256, () => {
      grad(0, 0, W, 180, [[0, '#8a8e94'], [.6, '#b4b2aa'], [1, '#d4cab4']]);
      for (let i = 0; i < 5; i++) blob(r() * W, 20 + r() * 80, 50 + r() * 50, 6, '#a4a8ac');
      ridge(W, 140, 10, 3.3, '#7a8690', 256, '#a0aab0');
      // stone building behind
      px('#6a6460', 40, 100, 150, 100); px('#4a4440', 40, 96, 150, 5); poly([[34, 98], [115, 70], [196, 98]], '#3c3836');
      for (let x = 56; x < 180; x += 20) for (const y of [116, 150]) { px('#2a2a30', x, y, 8, 18); px('#8a8a90', x, y, 8, 1); }
      grad(0, 200, W, 56, [[0, '#9a8c76'], [1, '#5a4e3e']]);
      for (let i = 0; i < 60; i++) px('#7a6c58', r() * W, 202 + r() * 54, 2 + r() * 4, 1);
      // plinth
      px('#7a7770', 168, 176, 44, 28); px('#a8a49a', 164, 172, 52, 6); px('#5a5750', 168, 196, 44, 8); px('#c8c4b8', 164, 172, 52, 1);
    });
    const sprite = layer(40, 70, () => { // bronze figure, feet at (20,69)
      poly([[10, 28], [30, 28], [34, 69], [6, 69]], '#3a3226'); poly([[12, 28], [18, 28], [20, 69], [8, 69]], '#5a4e36');
      blob(20, 18, 7, 8, '#4a4030'); blob(18, 16, 3, 4, '#76683e'); px('#2a2418', 13, 8, 14, 3);
      px('#2a2418', 20, 36, 9, 12); px('#6a5c3a', 20, 36, 9, 1);
      line(14, 28, 8, 46, '#3a3226'); px('#76683e', 11, 30, 1, 14);
    });
    const dust = Array.from({ length: 30 }, () => ({ a: r() * 6.28, s: .3 + r() * .8, z: r() }));
    const pullers = [0, 1, 2, 3, 4, 5].map(i => ({ x: 258 + i * 22, y: 244 - (i & 1) * 6, h: 36 - (i & 1) * 3 }));
    return t => {
      const fall = t < 90 ? 0 : t < 260 ? ease((t - 90) / 170) * .42 : t < 300 ? .42 + ease((t - 260) / 40) * .95 : 1.37;
      const down = t >= 300, sx = down && t < 316 ? Math.round(Math.sin(t * 2.4) * (316 - t) * .18) : 0;
      if (sx) cx().translate(sx, 0);
      img(bg, 0, 0);
      const pvx = 190, pvy = 172, th = down ? 1.5 : fall;
      const hx = pvx + 56 * Math.sin(fall), hy = pvy - 56 * Math.cos(fall);
      // ropes, drawn behind the statue
      if (!down) for (let i = 0; i < 4; i++) { const p = pullers[i]; line(hx, hy + i * 2, p.x - 4, p.y - p.h * .6, '#5a4a30'); line(hx, hy + 1 + i * 2, p.x - 4, p.y - p.h * .6 + 1, '#2a2218'); }
      const g = cx(); g.save();
      if (down) g.translate(262 - 8, 210); else g.translate(pvx, pvy);
      g.rotate(th); g.imageSmoothingEnabled = false; g.drawImage(sprite, -20, down ? -62 : -69); g.restore();
      // pullers lean harder as it tips
      for (const p of pullers) {
        const lean = down ? 0 : Math.min(4, t / 40);
        man(p.x + lean, p.y + (down ? 0 : 0), p.h, { body: '#2a2a2c', hat: 'cap', skin: '#c89870', rim: '#c8c0a8', rs: -1 });
        if (!down) line(p.x - 2 + lean, p.y - p.h * .6, p.x - 4, p.y - p.h * .6, '#2a2a2c');
      }
      // watching guards at left, black uniforms with red-band caps
      for (const x of [36, 64]) { man(x, 250, 46, { body: '#10101a', hat: 'cap', hatc: '#10101a', skin: '#c89870', rim: '#a8a090' }); px('#a8322a', x - 4, 250 - 46 * .98 + 2, 8, 1); line(x + 5, 250 - 30, x + 8, 250, '#50505a'); }
      // impact dust
      if (down) { const u = t - 300; for (const d of dust) { const e = u * d.s; alpha(clamp(1 - u / 150) * .6); blob(262 + Math.cos(d.a) * e * .9, 214 - Math.abs(Math.sin(d.a)) * e * .5 - u * .1 * d.z, 5 + e * .12, 4 + e * .08, '#cbbfa4'); } alpha(1); }
      if (t >= 296 && t < 302) { cx().fillStyle = 'rgba(255,255,240,.25)'; cx().fillRect(0, 0, 384, 256); }
      if (sx) cx().translate(-sx, 0);
    };
  };

  // ----- shot: Fukuoka prison window, a single falling star (1945-02-16). Quiet. -----
  const c4Prison = () => {
    const r = rng(45);
    const stars = Array.from({ length: 46 }, () => ({ x: 148 + r() * 88, y: 52 + r() * 86, p: r() * 6, b: r() }));
    const bg = layer(384, 256, () => {
      px('#06080c', 0, 0, 384, 256);
      for (let y = 0; y < 256; y += 8) { px('#0a0e14', 0, y, 384, 1); for (let x = ((y >> 3) & 1) * 12; x < 384; x += 24) px('#0a0e14', x, y, 1, 8); }
      px('#10161e', 138, 40, 108, 108);
      grad(146, 48, 92, 92, [[0, '#04060e'], [.7, '#0a1224'], [1, '#16243c']]);
      // bars
      for (const x of [160, 177, 194, 211, 228]) { px('#050608', x, 48, 4, 92); px('#2a3444', x, 48, 1, 92); }
      px('#050608', 146, 92, 92, 4);
      grad(0, 200, 384, 56, [[0, '#07090d'], [1, '#020304']]);
    });
    return t => {
      img(bg, 0, 0);
      for (const s of stars) { const a = .25 + .5 * Math.abs(Math.sin(t * .015 + s.p)) * (s.b > .8 ? 1.2 : .7); alpha(Math.min(1, a)); px(s.b > .9 ? '#e8f0ff' : '#8aa0c8', s.x, s.y, 1, 1); } alpha(1);
      // the one falling star: slow diagonal, long fading tail, once
      const u = t - 140;
      if (u > 0 && u < 130) {
        const sx = 232 - u * .55, sy = 54 + u * .5;
        for (let k = 0; k < 26; k++) { alpha((1 - k / 26) * (1 - u / 130)); px(k < 2 ? '#ffffff' : '#bcd0f0', sx + k * .55, sy - k * .5, 1, 1); } alpha(1);
        light(sx, sy, 22, '190,215,255', .35 * (1 - u / 130));
      }
      // faint moon-less glow of the window on the wall and the floor
      light(192, 96, 120, '70,100,150', .07 + .01 * Math.sin(t * .02));
      alpha(.1); for (const x of [160, 177, 194, 211, 228]) { poly([[x, 150], [x + 4, 150], [x + 30, 232], [x + 22, 232]], '#7a9acc'); } alpha(1);
      // slow breath-like vignette
      const v = .5 + .5 * Math.sin(t * .012);
      cx().fillStyle = `rgba(0,0,0,${.22 + v * .08})`; cx().fillRect(0, 0, 384, 256);
      // restore the window area a bit so the sky stays readable
      alpha(1);
    };
  };

  // ----- shot: 8.15 liberation, a joyful crowd of 태극기 -----
  const c4Liberation = () => {
    const W = 424, r = rng(815);
    const bg = layer(W, 256, () => {
      grad(0, 0, W, 170, [[0, '#4a90d0'], [.5, '#a8d4f0'], [1, '#fff0c0']]);
      for (let i = 0; i < 7; i++) { const x = r() * W, y = 14 + r() * 80, rx = 30 + r() * 50; blob(x, y, rx, 7, '#e8f4ff'); blob(x, y + 3, rx * .9, 4, '#c0dcf0'); }
      ridge(W, 140, 14, 5.1, '#4a7a6a', 256, '#7ab090');
      // Namdaemun-like gate in the distance
      px('#6a4a3a', 160, 116, 104, 44); px('#2a1a18', 188, 128, 48, 32); blob(212, 128, 24, 12, '#2a1a18');
      roof(212, 106, 140, 14, '#3a3a40', '#5a5a64'); roof(212, 88, 90, 10, '#3a3a40', '#5a5a64');
      grad(0, 160, W, 96, [[0, '#c8b890'], [1, '#6a5a44']]);
    });
    const crowd = [];
    for (let row = 0; row < 5; row++) for (let i = 0; i < 30; i++) crowd.push({
      x: r() * W, y: 190 + row * 14, h: 22 + row * 4, ph: r() * 6, fl: r() < .5,
      col: ['#f2eee0', '#f2eee0', '#e8e2d0', '#c8322a', '#2a4a9a', '#d8a838', '#4a8a5a', '#d87a98'][r() * 8 | 0],
    });
    crowd.sort((a, b) => a.y - b.y);
    const conf = Array.from({ length: 80 }, () => ({ x: r() * W, y: r() * 256, s: .3 + r() * .5, c: ['#e83a3a', '#2a5ac8', '#f8d848', '#fff', '#58c878'][r() * 5 | 0], p: r() * 6 }));
    return t => {
      const ox = -Math.floor(Math.min(24, t * .03));
      img(bg, ox, 0);
      light(300 + ox, 40, 200, '255,240,180', .3);
      const g = cx(); g.globalCompositeOperation = 'lighter'; // sun rays
      for (let k = 0; k < 5; k++) { const a = 1.9 + k * .25 + Math.sin(t * .01 + k) * .04; g.fillStyle = 'rgba(255,240,190,.07)'; g.beginPath(); g.moveTo(300 + ox, 30); g.lineTo(300 + ox + Math.cos(a - .06) * 400, 30 + Math.sin(a - .06) * 400); g.lineTo(300 + ox + Math.cos(a + .06) * 400, 30 + Math.sin(a + .06) * 400); g.fill(); }
      g.globalCompositeOperation = 'source-over';
      for (const c of crowd) {
        const x = c.x + ox * (.8 + c.y / 400);
        folk(x, c.y, c.h, c.col, true, t, c.ph);
        if (c.fl) flag(x + c.h * .12, c.y - c.h * 1.1 - 12, 10 + (c.h / 5 | 0), t, c.ph);
      }
      // banner over the crowd: 대한독립 만세
      const by = 128 + Math.sin(t * .05) * 2;
      px('#5a4028', 100 + ox, by - 10, 2, 60); px('#5a4028', 284 + ox, by - 10, 2, 60);
      px('#f4f0e4', 102 + ox, by, 182, 22); px('#d8d2c0', 102 + ox, by + 21, 182, 1);
      txt('대한독립 만세', 193 + ox, by + 11, 13, '#c8322a');
      for (const c of conf) { const cxp = wrap(c.x + Math.sin(t * .04 + c.p) * 14, W), cy = wrap(c.y + t * c.s, 256); alpha(.9); px(c.c, cxp, cy, 2, 2); px(c.c, cxp + 1, cy + 2, 1, 1); } alpha(1);
      for (const [fx, fh, col] of [[16, 70, '#2a2230'], [62, 58, '#e8e2d0'], [350, 68, '#e8e2d0']]) { folk(fx, 262, fh, col, true, t, fx); flag(fx + 8, 262 - fh * 1.05 - 20, 22, t, fx); }
    };
  };

  // ----- shot: 서울역 warehouse, 조선말 큰사전 manuscript found (1945-09) -----
  const c4Warehouse = () => {
    const r = rng(945);
    const bg = layer(384, 256, () => {
      px('#0a0806', 0, 0, 384, 256);
      for (let x = 0; x < 384; x += 24) { px('#14100c', x, 0, 3, 200); }
      for (let y = 0; y < 200; y += 12) px('#100c08', 0, y, 384, 1);
      for (const x of [60, 150, 240, 330]) { px('#2a3038', x - 12, 18, 24, 32); px('#8aa0b8', x - 9, 21, 18, 26); }
      grad(0, 200, 384, 56, [[0, '#1c150e'], [1, '#080604']]);
      // crates
      for (const [x, y, w, h] of [[20, 150, 60, 52], [90, 170, 44, 32], [28, 108, 44, 42], [300, 140, 70, 62], [330, 96, 44, 44], [254, 176, 44, 26]]) {
        px('#3a2814', x, y, w, h); px('#2a1c0e', x, y, w, 2); px('#4a361c', x, y + 2, w, 1);
        for (let k = 8; k < w; k += 12) px('#2a1c0e', x + k, y, 1, h);
        px('#2a1c0e', x, y + h / 2, w, 1);
      }
    });
    const dust = Array.from({ length: 70 }, () => ({ x: 40 + r() * 300, y: r() * 220, s: .04 + r() * .12, p: r() * 6 }));
    return t => {
      img(bg, 0, 0);
      // light shafts from the high windows
      const g = cx(); g.globalCompositeOperation = 'lighter';
      for (const x of [60, 150, 240, 330]) { g.fillStyle = 'rgba(190,210,235,.08)'; g.beginPath(); g.moveTo(x - 9, 24); g.lineTo(x + 9, 24); g.lineTo(x + 70, 230); g.lineTo(x - 10, 230); g.fill(); }
      g.globalCompositeOperation = 'source-over';
      // the opened crate and the bundle
      const gl = .75 + .25 * Math.sin(t * .05);
      px('#4a361c', 150, 168, 78, 34); px('#2a1c0e', 150, 168, 78, 2); px('#1a1008', 154, 172, 70, 28);
      poly([[146, 168], [178, 150], [232, 156], [226, 168]], '#5a4222'); // lid, propped open
      px('#e8dcc0', 160, 160, 50, 12); px('#f4ecd0', 160, 160, 50, 1);
      for (let i = 0; i < 5; i++) px('#7a6a52', 164 + i * 2, 163 + i * 2 - (i > 2 ? 4 : 0), 38 - i * 4, 1);
      px('#bba890', 160, 171, 50, 1);
      light(185, 160, 70, '255,220,150', .35 * gl); light(185, 158, 130, '255,190,100', .12);
      // a man kneeling, lantern-lit rim, holding up one sheet
      const P = '#0a0706', RM = '#f0b868';
      poly([[240, 214], [246, 176], [262, 166], [274, 176], [284, 214]], P); blob(262, 160, 7, 8, P);
      poly([[252, 176], [236, 182], [214, 168], [218, 164]], P);
      px('#f4ecd0', 208 + Math.sin(t * .04) * 1, 156, 14, 18); px('#7a6a52', 211, 160, 8, 1); px('#7a6a52', 211, 164, 8, 1); px('#7a6a52', 211, 168, 6, 1);
      line(256, 168, 258, 214, RM); px(RM, 255, 156, 1, 6);
      alpha(.7); for (const d of dust) { const x = d.x + Math.sin(t * .015 + d.p) * 8, y = wrap(d.y + t * d.s, 230); px('#d8e4f4', x, y, 1, 1); } alpha(1);
    };
  };

  Cutscenes.register('c4', {
    tag: 'CHAPTER 3 · 1942–1945', music: 'cut_liberation',
    shots: [
      { caption: '1942년 8월 17일, 연희전문.\n언더우드 동상이 끌어내려졌다.', make: c4Statue },
      { caption: '1945년 2월 16일, 후쿠오카 형무소.\n윤동주가 스물일곱의 나이로 숨을 거두었다.', make: c4Prison },
      { caption: '1945년 8월 15일.\n해방. 거리마다 태극기가 물결쳤다.', make: c4Liberation },
      { caption: '1945년 9월, 서울역 창고.\n조선말 큰사전 원고가 다시 발견되었다.', make: c4Warehouse },
    ],
  });

  // =====================================================================================
  // epilogue  1957 - 2026
  // =====================================================================================

  // ----- shot: 1957 sign, 연희 + 세브란스 = 연세 -----
  const epSign = () => {
    const W = 424, r = rng(57);
    const bg = layer(W, 256, () => {
      grad(0, 0, W, 190, [[0, '#6aa8d8'], [.6, '#bcdcf0'], [1, '#f4ecd0']]);
      for (let i = 0; i < 4; i++) blob(r() * W, 20 + r() * 70, 40 + r() * 40, 6, '#f4faff');
      ridge(W, 150, 9, 2.8, '#7a9a8a', 256, '#a8c8b0');
      // brick hall with a central tower, far
      px('#8a5a48', 60, 120, 240, 50); px('#6a4034', 60, 116, 240, 5); px('#8a5a48', 150, 92, 60, 78); poly([[144, 94], [180, 68], [216, 94]], '#4a3034');
      for (let x = 74; x < 290; x += 18) { if (x > 140 && x < 220) continue; px('#2a2028', x, 134, 7, 12); px('#2a2028', x, 152, 7, 12); }
      grad(0, 170, W, 86, [[0, '#a8b890'], [1, '#5a7048']]);
      px('#c8b898', 170, 170, 44, 86);
      // gate pillars
      for (const x of [88, 296]) { px('#bcb8aa', x, 120, 26, 136); px('#d8d4c8', x, 120, 26, 4); px('#8a8678', x + 22, 124, 4, 132); px('#d8d4c8', x - 3, 116, 32, 5); }
      // cross beam
      px('#4a2c1c', 80, 132, 248, 6); px('#6a4228', 80, 132, 248, 1);
    });
    const petals = Array.from({ length: 60 }, () => ({ x: r() * W, y: r() * 256, s: .25 + r() * .35, p: r() * 6 }));
    // pink branch silhouettes (top-left / top-right)
    const branch = layer(W, 90, () => {
      for (const [x0, dir] of [[0, 1], [W, -1]]) {
        let x = x0, y = 10;
        for (let i = 0; i < 9; i++) { const nx = x + dir * (24 + r() * 14), ny = y + (r() - .3) * 18; line(x, y, nx, ny, '#4a2c2a'); for (let k = 0; k < 5; k++) blob(nx + (r() - .5) * 20, ny + (r() - .5) * 14, 3 + r() * 3, 3 + r() * 2, r() < .5 ? '#f8c8d8' : '#fce8ee'); x = nx; y = Math.max(4, Math.min(60, ny)); }
      }
    });
    return t => {
      const ox = -Math.floor(Math.min(20, t * .03));
      img(bg, ox, 0); img(branch, ox, 0);
      // hanging board
      const sway = Math.sin(t * .03) * 1.2, bx = 112 + ox, by = 142;
      line(bx + 30, 138, bx + 34 + sway, by, '#2a1810'); line(bx + 168, 138, bx + 164 + sway, by, '#2a1810');
      px('#2a1a10', bx + sway, by, 200, 52); px('#4a3018', bx + sway + 2, by + 2, 196, 48); px('#5a3c20', bx + sway + 2, by + 2, 196, 1);
      px('#241408', bx + sway + 6, by + 6, 188, 40);
      // centres keep every word inside the board's inner panel (x 6..194); '연세' used to spill past the right edge
      const parts = [['연희', 28, 0], ['+', 54, 70], ['세브란스', 94, 130], ['=', 134, 220], ['연세', 164, 290]];
      for (const [s, dx, at] of parts) { alpha(ease((t - at) / 40)); txt(s, bx + sway + dx, by + 26, s === '연세' ? 18 : 14, s === '연세' ? '#ffd870' : '#f4ecd0'); }
      alpha(1);
      if (t > 290) light(bx + 164, by + 26, 60, '255,216,110', .18 * ease((t - 290) / 40));
      // students in 1950s school uniforms walking through the gate
      for (const [x, ph, h] of [[200, 0, 40], [150, 2, 36], [250, 4, 38]]) man(wrap(x + t * .25 + ph * 30, W) + ox, 246, h, { body: '#16162a', hat: 'cap', skin: '#c89870', rim: '#f4e8c0' });
      alpha(.9); for (const p of petals) { px(p.y % 2 > 1 ? '#fce8ee' : '#f8c8d8', wrap(p.x + Math.sin(t * .03 + p.p) * 16 - t * .15, W) + ox, wrap(p.y + t * p.s, 256), 2, 1); } alpha(1);
      light(70 + ox, 20, 160, '255,240,200', .16);
    };
  };

  // ----- shot: 2026 백양로 at dawn, students -----
  const epBaekyang = () => {
    const r = rng(2026), VX = 192, VY = 124;
    const bg = layer(384, 256, () => {
      grad(0, 0, 384, 150, [[0, '#2a2a5a'], [.4, '#8a6a8a'], [.75, '#f0a888'], [1, '#ffe0a0']]);
      for (let i = 0; i < 40; i++) px('#d8d8f0', r() * 384, r() * 50, 1, 1);
      blob(VX, 112, 70, 22, '#ffd890'); dglow(VX, 112, 50, '#fff0c0', 1);
      // stone gothic hall at the end of the road
      const st = '#2c2438';
      px(st, 150, 100, 84, 24); px(st, 168, 86, 48, 38); poly([[162, 88], [192, 66], [222, 88]], st);
      for (const x of [150, 226]) { px(st, x, 90, 8, 34); poly([[x - 1, 92], [x + 4, 80], [x + 9, 92]], st); }
      for (let x = 156; x < 232; x += 8) px('#f0b068', x, 108, 2, 5);
      px('#f8c880', 170, 96, 2, 6); px('#f8c880', 190, 96, 2, 6); px('#f8c880', 208, 96, 2, 6);
      // ground / road in perspective
      grad(0, VY + 6, 384, 130, [[0, '#d8b898'], [.4, '#8a7a82'], [1, '#2c2838']]);
      poly([[VX - 4, VY + 6], [VX + 4, VY + 6], [440, 256], [-56, 256]], '#6a6474');
      poly([[VX - 3, VY + 6], [VX + 3, VY + 6], [300, 256], [84, 256]], '#8a8494');
      // poplar rows, far to near
      for (let k = 12; k >= 0; k--) {
        const z = 1 + k * .55, s = 2.1 / z, base = VY + 8 + 150 / z * .9, off = 10 + 90 / z * 1.6;
        for (const sd of [-1, 1]) poplar(VX + sd * off, base, s, k > 8 ? '#4a5a7a' : '#2a5a48', k > 8 ? '#8aa0a0' : '#8ac868');
      }
    });
    // walkers: z from far (1) to near (0), mostly walking toward camera
    const walk = Array.from({ length: 11 }, (_, i) => ({ z: r(), lane: (r() - .5) * 1.4, sp: .0006 + r() * .0007, col: ['#2a4a9a', '#1a2a5a', '#3a3a4a', '#6a2a3a', '#2a2a2a'][r() * 5 | 0], ph: r() * 6, h: 28 + r() * 6, away: i % 4 === 0 }));
    const leaf = Array.from({ length: 40 }, () => ({ x: r() * 384, y: r() * 256, s: .2 + r() * .3, p: r() * 6 }));
    return t => {
      img(bg, 0, 0);
      const sun = clamp(t / 400);
      light(VX, 112, 150, '255,220,150', .15 + sun * .28);
      alpha(.18); for (let i = 0; i < 12; i++) px('#f8e4c8', 0, 150 + i * 8 + Math.sin(t * .01 + i) * 2, 384, 3); alpha(1); // low mist
      walk.sort((a, b) => b.z - a.z);
      for (const w of walk) {
        w.z = w.away ? (w.z + w.sp) % 1 : (w.z - w.sp + 1) % 1;
        const s = 1 - w.z * .85, y = VY + 8 + (256 - VY - 8) * (1 - w.z) ** 1.6 * .98 + 10, x = VX + w.lane * (30 + 220 * (1 - w.z) ** 1.4), h = w.h * s * 1.5, bob = Math.abs(Math.sin(t * .1 + w.ph)) * s * 1.5;
        man(x, y - bob, h, { body: w.col, skin: '#d8a880', rim: '#ffd890', rs: -1 });
        px('#1a1a24', x - h * .12, y - h * .7 - bob, h * .24, h * .3); // backpack
      }
      alpha(.9); for (const l of leaf) { px('#b8d878', wrap(l.x + Math.sin(t * .03 + l.p) * 20 - t * .2, 384), wrap(l.y + t * l.s, 256), 2, 1); } alpha(1);
      // foreground poplar trunks frame the shot
      px('#c8bca8', -2, 0, 8, 256); px('#a89c88', 4, 0, 2, 256); px('#c8bca8', 378, 0, 8, 256); px('#a89c88', 378, 0, 2, 256);
    };
  };

  // ----- shot: back in the 2026 archive, 연우 closes the diary -----
  const epArchive = () => {
    const r = rng(26);
    const bg = layer(384, 256, () => {
      px('#0c0c18', 0, 0, 384, 256);
      for (const x of [14, 60, 306, 352]) { px('#1a1620', x, 20, 30, 190); for (let y = 30; y < 200; y += 24) { px('#2a2230', x, y + 14, 30, 2); for (let b = x + 2; b < x + 28;) { const w = 2 + r() * 3 | 0, h = 8 + r() * 5 | 0; px(['#3a2a3a', '#2a3a4a', '#4a3a28', '#2a2a3a'][r() * 4 | 0], b, y + 14 - h, w, h); b += w + 1; } } }
      px('#222a3c', 150, 30, 84, 70); px('#2a4a7a', 154, 34, 76, 62); // window facing the sunrise
      grad(154, 34, 76, 62, [[0, '#2a3a6a'], [.6, '#c88a98'], [1, '#ffd890']]);
      px('#10141e', 191, 34, 2, 62); px('#10141e', 154, 64, 76, 2);
      grad(0, 190, 384, 66, [[0, '#14101a'], [1, '#07060a']]);
      px('#2a1a14', 96, 168, 192, 8); px('#1a100c', 104, 176, 8, 38); px('#1a100c', 272, 176, 8, 38);
    });
    const mote = Array.from({ length: 40 }, () => ({ x: 120 + r() * 160, y: 70 + r() * 100, s: .05 + r() * .1, p: r() * 6 }));
    return t => {
      img(bg, 0, 0);
      const c = ease((t - 90) / 120); // 0 open -> 1 closed
      const bx = 192, by = 164, pw = 44, ph = 22;
      // diary: left page fixed, right page folds over the spine
      px('#2a1a10', bx - pw - 2, by - 2, pw * 2 + 4, ph + 3);
      px('#e8dcc0', bx - pw, by, pw, ph); px('#bba890', bx - pw, by + ph - 1, pw, 1);
      for (let i = 0; i < 5; i++) px('#7a6a52', bx - pw + 4, by + 3 + i * 4, pw - 10 - (i & 1) * 6, 1);
      const rw = Math.round(pw * Math.cos(c * Math.PI));
      if (rw >= 0) { px('#e8dcc0', bx, by, rw, ph); for (let i = 0; i < 5; i++) px('#7a6a52', bx + 4, by + 3 + i * 4, Math.max(0, rw - 8), 1); }
      else { px('#4a2a1c', bx + rw, by - 1, -rw, ph + 1); px('#6a3a28', bx + rw, by - 1, -rw, 1); }
      if (c >= 1) { px('#4a2a1c', bx - pw, by - 1, pw, ph + 1); px('#6a3a28', bx - pw, by - 1, pw * 2, 1); px('#c8a860', bx - 12, by + 8, 24, 1); px('#c8a860', bx - 12, by + 12, 24, 1); }
      // lamp and 연우's silhouette leaning back, rim-lit by the window
      px('#1a1010', 130, 148, 4, 20); px('#2a140c', 124, 138, 14, 12); px('#fff0b0', 126, 142, 10, 6);
      const P = '#0a0810', RM = '#ffc080', br = Math.sin(t * .03);
      poly([[236, 214], [242, 160], [262, 144], [284, 150], [292, 214]], P); blob(262, 134 + br, 10, 11, P);
      px(RM, 271, 130 + br, 1, 8); px(RM, 290 - 2, 152, 1, 30);
      poly([[246, 164], [226, 168], [206 + c * 4, 170], [210 + c * 4, 164]], P);
      light(131, 146, 100, '255,200,110', .22); light(192, 70, 150, '255,200,140', .12 + c * .1);
      alpha(.55); for (const m of mote) px('#ffe8b8', m.x + Math.sin(t * .02 + m.p) * 5, wrap(m.y - t * m.s, 110) + 70, 1, 1); alpha(1);
      if (c >= 1) { const u = t - 210; alpha(clamp(1 - u / 120) * .8); for (let i = 0; i < 14; i++) px('#ffd890', bx + Math.sin(i * 2.3) * 14 + Math.sin(u * .04 + i) * 4, by - u * (.15 + (i % 4) * .07), 1, 1); alpha(1); }
    };
  };

  // ----- shot: 서시 on black, line by line -----
  const epPoem = () => {
    const r = rng(11);
    const stars = Array.from({ length: 70 }, () => ({ x: r() * 384, y: r() * 256, p: r() * 6, b: r() }));
    const L = ['죽는 날까지 하늘을 우러러', '한 점 부끄럼이 없기를,', '잎새에 이는 바람에도', '나는 괴로워했다.', '', '별을 노래하는 마음으로', '모든 죽어가는 것을 사랑해야지', '그리고 나한테 주어진 길을', '걸어가야겠다.', '', '오늘 밤에도 별이 바람에 스치운다.'];
    return t => {
      px('#03040a', 0, 0, 384, 256);
      for (const s of stars) { alpha(.2 + .5 * Math.abs(Math.sin(t * .012 + s.p)) * (s.b > .85 ? 1.3 : .6)); px(s.b > .93 ? '#e8f0ff' : '#7a90b8', s.x, s.y, 1, 1); } alpha(1);
      L.forEach((s, i) => { if (!s) return; alpha(ease((t - 40 - i * 55) / 70)); txt(s, 192, 40 + i * 17.5, 11, i === L.length - 1 ? '#ffe9a8' : '#e4e8f4'); });
      alpha(1);
    };
  };

  Cutscenes.register('epilogue', {
    tag: 'EPILOGUE · 1957–2026', music: 'epilogue',
    shots: [
      { caption: '1957년 1월 5일.\n연희대학교와 세브란스의과대학이 합쳐져 연세대학교가 되었다.', make: epSign },
      { caption: '2026년, 백양로의 새벽.\n그날의 기록 위로 오늘의 하루가 열린다.', make: epBaekyang },
      { caption: '기록관의 일기장이 닫힌다.\n기억을 이어 가는 일은 이제 연우의 몫이다.', make: epArchive },
      { caption: '윤동주, 「서시」 (1941. 11. 20.)', make: epPoem },
    ],
  });
})();
