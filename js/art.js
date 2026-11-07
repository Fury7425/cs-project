// window.Art — shared pixel painter helpers (moved from v1). All painters target the active context.
(function () {
  let q = null; // active target context

  const Art = {
    B4: [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5], // Bayer 4x4
    get cur() { return q; },
    ctx(c) { const o = q; q = c; return o; },
    layer(w, h, fn) { // offscreen canvas painted with Art.* while fn runs
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const o = q; q = c.getContext('2d');
      try { fn(); } finally { q = o; }
      return c;
    },
    wrap: (v, m) => ((v % m) + m) % m,
    rng: s => () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296,
  };
  const B4 = Art.B4;

  const px = Art.px = (c, a, b, w = 1, h = 1) => { q.fillStyle = c; q.fillRect(Math.round(a), Math.round(b), Math.round(w), Math.round(h)); };

  Art.grad = function (x0, y0, w, h, stops) { // vertical dithered gradient
    for (let y = 0; y < h; y++) {
      const t = y / (h - 1 || 1);
      let i = 0; while (i < stops.length - 2 && t > stops[i + 1][0]) i++;
      const [t0, c0] = stops[i], [t1, c1] = stops[i + 1], f = Math.max(0, Math.min(1, (t - t0) / (t1 - t0)));
      let cur = null, rs = 0;
      for (let x = 0; x <= w; x++) {
        const c = x < w ? (B4[(y & 3) * 4 + (x & 3)] / 16 < f ? c1 : c0) : null;
        if (c !== cur) { if (cur) px(cur, x0 + rs, y0 + y, x - rs, 1); cur = c; rs = x; }
      }
    }
  };

  Art.dglow = function (cx, cy, r, c, k = 1) { // dithered radial glow
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
      const d = Math.hypot(x, y) / r;
      if (d < 1 && B4[((cy + y) & 3) * 4 + ((cx + x) & 3)] / 16 < (1 - d) ** 2 * k) px(c, cx + x, cy + y);
    }
  };

  Art.light = function (cx, cy, r, rgb, a) { // smooth additive glow
    const gr = q.createRadialGradient(cx, cy, 0, cx, cy, r);
    gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(1, `rgba(${rgb},0)`);
    q.globalCompositeOperation = 'lighter'; q.fillStyle = gr; q.fillRect(cx - r, cy - r, r * 2, r * 2);
    q.globalCompositeOperation = 'source-over';
  };

  Art.poly = function (pts, col) { // pixel-exact scanline polygon
    let y0 = Infinity, y1 = -Infinity;
    for (const [, y] of pts) { y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    for (let y = Math.floor(y0); y <= y1; y++) {
      const xs = [], yc = y + .5;
      for (let i = 0; i < pts.length; i++) {
        const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
        if ((ay <= yc && by > yc) || (by <= yc && ay > yc)) xs.push(ax + (yc - ay) / (by - ay) * (bx - ax));
      }
      xs.sort((a, b) => a - b);
      for (let i = 0; i + 1 < xs.length; i += 2) px(col, xs[i], y, Math.max(1, Math.round(xs[i + 1]) - Math.round(xs[i])), 1);
    }
  };

  const blob = Art.blob = function (cx, cy, rx, ry, c) {
    for (let y = -Math.floor(ry); y <= ry; y++) { const hw = rx * Math.sqrt(Math.max(0, 1 - (y / ry) ** 2)); px(c, cx - hw, cy + y, hw * 2 + 1, 1); }
  };

  const line = Art.line = function (x0, y0, x1, y1, c) {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) | 0;
    for (let i = 0; i <= n; i++) px(c, x0 + (x1 - x0) * i / (n || 1), y0 + (y1 - y0) * i / (n || 1));
  };

  Art.ridge = function (w, y0, amp, seed, col, bottom, rim) {
    for (let x = 0; x < w; x++) {
      const y = Math.round(y0 + Math.sin(x * .013 + seed) * amp + Math.sin(x * .031 + seed * 2.3) * amp * .45 + Math.sin(x * .071 + seed * 5) * amp * .15);
      px(col, x, y, 1, bottom - y); if (rim) px(rim, x, y, 1, 1);
    }
  };

  Art.roof = function (cx, ye, w, th, col, hi) { // hanok roof silhouette, ye = eave line
    const half = w / 2;
    for (let x = -half; x <= half; x++) {
      const u = Math.abs(x) / half;
      const top = Math.round(u < .5 ? ye - th : ye - th + (th - 6) * ((u - .5) / .5) - 3 * u ** 14), bot = ye + 4 - 9 * u ** 8;
      for (let y = top; y < bot; y++) px(hi && (y - top) % 4 === 0 ? hi : col, cx + x, y);
    }
  };

  Art.tree = function (x, y, h, c, hi) {
    px('#1a1218', x - 1, y - h * .4, 3, h * .4);
    blob(x, y - h * .6, h * .28, h * .26, c); blob(x - h * .12, y - h * .8, h * .22, h * .2, c); blob(x + h * .1, y - h * .85, h * .2, h * .18, c);
    if (hi) blob(x + h * .1, y - h * .9, h * .1, h * .08, hi);
  };

  Art.poplar = function (x, y, s) { // baekyang: pale trunk, tall slim crown lit from the left
    px('#c8bca8', x - Math.max(1, s * 1.2), y - 30 * s, Math.max(2, s * 2.4), 30 * s);
    blob(x, y - 62 * s, 6 * s + .5, 36 * s, '#2a6a38'); blob(x - 2 * s, y - 66 * s, 3 * s + .5, 28 * s, '#7ab858');
  };

  Art.flame = function (x, y, w, h, s) {
    for (const [c, m] of [['#c8321e', 1], ['#f08a28', .7], ['#ffe070', .4]])
      for (let k = 0; k < h * m; k += 2) px(c, x - Math.max(1, w * m * (1 - k / (h * m)) ** .8) / 2 + Math.sin(k * .15 + s) * 2, y - k, Math.max(1, w * m * (1 - k / (h * m)) ** .8), 2);
  };

  Art.man = function (x, y, h, o = {}) { // silhouette person, feet at (x,y)
    const b = o.body || '#14122a', hc = o.hatc || b, w = Math.max(3, h * .3), sh = y - h * .78, lw = w * (o.coat ? .85 : .5), rs = o.rs || 1;
    Art.poly([[x - w / 2, sh], [x + w / 2, sh], [x + lw, y], [x - lw, y]], b);
    blob(x, y - h * .9, Math.max(1.5, h * .085), Math.max(2, h * .1), o.skin || b);
    const hy = y - h * .98;
    if (o.hat === 'gat') { px(hc, x - h * .21, hy + h * .02, h * .42, 1); px(hc, x - h * .07, hy - h * .1, h * .14, h * .12); }
    else if (o.hat === 'cap') { px(hc, x - h * .1, hy + h * .02, h * .2, 2); px(hc, x - h * .08, hy - h * .02, h * .16, 2); }
    else if (o.hat === 'top') { px(hc, x - h * .14, hy + h * .02, h * .28, 1); px(hc, x - h * .08, hy - h * .1, h * .16, h * .12); }
    if (o.load) { px('#8a8a98', x - w * .55, sh - h * .2, w * 1.1, h * .2); line(x - w * .5, sh, x - w * .5, sh - h * .2, '#5a4030'); line(x + w * .5, sh, x + w * .5, sh - h * .2, '#5a4030'); }
    if (o.rim) { px(o.rim, x + rs * w / 2 - (rs > 0 ? 1 : 0), sh, 1, y - sh); px(o.rim, x + rs * h * .085 - (rs > 0 ? 1 : 0), y - h * .93, 1, 3); }
  };

  window.Art = Art;
})();
