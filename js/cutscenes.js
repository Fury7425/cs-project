// window.Cutscenes — letterboxed painted cutscenes (384x336 canvas, 256px scene area at y=40).
// Engine + scenes: intro, c1, c2. More scenes register from cutscenes2.js via Cutscenes.register().
(function () {
  const { px, grad, dglow, light, poly, blob, line, ridge, roof, tree, flame, man, rng, wrap } = Art;
  const mkq = Art.layer;
  const $ = id => document.getElementById(id);
  let cg = null, q = null; // q === cg while a shot draws (kept as alias so painter code reads like v1)
  const scenes = {};
  let cs = null; // active playback state
  let VIG = null;
  let wired = false;

  // ---------------------------------------------------------------- shared helpers
  const pan = (t, f, max = 40) => -Math.floor(Math.min(max, t * .03) * f); // slow parallax drift
  const bird = (x, y, f, c) => { line(x - 4, y + f, x, y + 2, c); line(x, y + 2, x + 4, y + f, c); };
  // additive light shaft: quad from top edge (x0..x1 at y0) down to bottom edge (x2..x3 at y1)
  const shaft = (x0, x1, y0, x2, x3, y1, rgba) => {
    q.globalCompositeOperation = 'lighter'; q.fillStyle = rgba; q.beginPath();
    q.moveTo(x0, y0); q.lineTo(x1, y0); q.lineTo(x3, y1); q.lineTo(x2, y1); q.fill();
    q.globalCompositeOperation = 'source-over';
  };

  // ================================================================ INTRO
  // ----- intro 1: the 2026 archive at night, a student at a desk lamp -----
  const I1 = () => {
    const W = 424, r = rng(101);
    const motes = Array.from({ length: 44 }, () => ({ x: 170 + r() * 150, y: 100 + r() * 100, s: .3 + r() * .6, p: r() * 6 }));
    const shelf = (x0, x1) => {
      for (let tier = 0; tier < 4; tier++) {
        const y = 36 + tier * 38;
        for (let x = x0; x < x1;) {
          const w = 5 + r() * 9 | 0, h = 18 + r() * 12 | 0;
          px(['#5a4a3a', '#3e4e4c', '#4e4050', '#6a5a3a', '#34404e'][r() * 5 | 0], x, y + 32 - h, w, h);
          px('#a89878', x + 1, y + 32 - h + 3, Math.max(1, w - 2), 1);
          x += w + 1;
        }
        px('#1c1418', x0, y + 32, x1 - x0, 3); px('#3a2a2c', x0, y + 32, x1 - x0, 1);
      }
    };
    const bg = mkq(W, 256, () => {
      grad(0, 0, W, 190, [[0, '#060914'], [1, '#121a30']]);
      // window onto the night campus
      px('#2a3652', 52, 28, 96, 104); grad(56, 32, 88, 96, [[0, '#08102c'], [1, '#28386a']]);
      for (let x = 56; x < 144; x += 6) px('#070b1c', x, 100 + (Math.sin(x * .3) * 5 | 0) + (x % 4), 6, 28);
      for (let i = 0; i < 34; i++) px(r() < .55 ? '#f0c070' : '#9ac0f0', 58 + r() * 82, 104 + r() * 22, 1, 1);
      for (let i = 0; i < 18; i++) px('#8a9ac8', 58 + r() * 82, 34 + r() * 40, 1, 1);
      dglow(124, 52, 26, '#6a82b8', .9); blob(124, 52, 7, 7, '#e8eef8');
      px('#2a3652', 98, 32, 2, 96); px('#2a3652', 56, 80, 88, 2);
      px('#3a4a6a', 50, 130, 100, 3);
      shelf(262, W); shelf(0, 44);
      px('#0e0a10', 262, 0, 3, 190);
      grad(0, 190, W, 66, [[0, '#1a1620'], [1, '#06070c']]);
      for (let y = 196; y < 256; y += 7) px('#0e0c14', 0, y, W, 1);
      // desk
      px('#46322a', 96, 174, 224, 6); px('#6a4a38', 96, 174, 224, 1);
      px('#22161a', 102, 180, 212, 38); px('#120c10', 102, 196, 212, 1); px('#120c10', 102, 208, 212, 1);
      // lamp (banker's lamp)
      px('#2a2a30', 264, 168, 12, 6); line(270, 168, 254, 140, '#2a2a30');
      poly([[240, 136], [264, 134], [260, 150], [244, 152]], '#2c5a46'); px('#4a8a6a', 240, 136, 24, 1);
      // chair + seated student (hoodie in Yonsei blue), seen from the side
      px('#16121a', 142, 150, 6, 46); px('#16121a', 138, 192, 40, 4);
      const HD = '#1e3c86', HR = '#f0b060';
      poly([[152, 178], [154, 150], [170, 142], [188, 150], [190, 178]], HD);
      blob(172, 134, 8, 9, HD); blob(176, 136, 5, 6, '#1a1218'); // hood up, face in shadow
      px(HR, 190, 150, 1, 28); px(HR, 181, 130, 1, 7);
      poly([[186, 154], [198, 160], [212, 170], [206, 174], [190, 166]], HD); // arm reaching the desk
      px('#d8b098', 207, 171, 5, 3);
      // the bundle: a diary tied with twine
      px('#7a5a3a', 214, 166, 30, 9); px('#9a7a52', 214, 166, 30, 1); px('#2a1a12', 226, 166, 1, 9); px('#e8d8a8', 218, 169, 6, 1);
      // books and a mug
      px('#5a3a3a', 112, 164, 20, 10); px('#3a4a5a', 114, 158, 18, 6); px('#e8e4dc', 290, 164, 8, 10);
    });
    return t => {
      const ox = pan(t, .5);
      cg.drawImage(bg, ox, 0);
      const fl = .85 + .1 * Math.sin(t * .2) + .05 * Math.sin(t * .57);
      shaft(250 + ox, 256 + ox, 150, 160 + ox, 330 + ox, 218, `rgba(255,205,120,${.07 * fl})`);
      q.globalAlpha = .9 * fl; px('#fff0b0', 245 + ox, 148, 14, 2); q.globalAlpha = 1;
      light(252 + ox, 156, 120, '255,190,100', .36 * fl); light(232 + ox, 170, 60, '255,210,130', .18);
      light(124 + ox, 52, 80, '120,150,220', .12);
      q.globalAlpha = .7;
      for (const m of motes) px('#ffe8b0', m.x + ox + Math.sin(t * .02 + m.p) * 7, 100 + wrap(m.y - 100 - t * .1 * m.s, 100));
      q.globalAlpha = 1;
      // monitor-less night: a slow blink of a far smoke detector
      if ((t >> 5) % 6 === 0) px('#ff4030', 400 + ox, 12, 2, 2);
    };
  };

  // ----- intro 2: the diary opens, pages turn, memories rise as light -----
  const I2 = () => {
    const r = rng(111);
    const specks = Array.from({ length: 70 }, () => ({ x: 70 + r() * 250, o: r() * 260, s: .25 + r() * .5, p: r() * 6, k: r() < .3 }));
    const scribble = (x0, y0, w, rows, sd) => {
      const g2 = rng(sd);
      for (let i = 0; i < rows; i++) {
        px('#c8b484', x0, y0 + i * 9 + 7, w, 1);
        for (let x = x0 + 2; x < x0 + w - 6;) {
          const gw = 3 + g2() * 4 | 0, hz = g2() < .5;
          px('#4a321e', x, y0 + i * 9 + 1, hz ? gw : 1, hz ? 1 : 5); if (g2() < .6) px('#4a321e', x + (gw >> 1), y0 + i * 9 + 3, 1, 4);
          x += gw + 3 + (g2() < .2 ? 5 : 0);
        }
      }
    };
    const bg = mkq(384, 256, () => {
      grad(0, 0, 384, 256, [[0, '#0a0810'], [.5, '#1c1216'], [1, '#2c1c18']]);
      for (let y = 150; y < 256; y += 5) px(y % 10 ? '#241612' : '#321e16', 0, y, 384, 1);
      blob(192, 196, 170, 22, '#0a0608'); // shadow of the book
      px('#5a3a22', 36, 62, 312, 134); px('#6e4a2c', 36, 62, 312, 2); // cover
      px('#2a1a10', 36, 194, 312, 3);
      px('#e0d0a8', 42, 68, 148, 122); px('#d4c498', 194, 68, 148, 122); // pages
      for (let i = 0; i < 3; i++) { px('#b8a478', 42, 190 + i, 148, 1); px('#b8a478', 194, 190 + i, 148, 1); }
      scribble(52, 76, 128, 12, 1); scribble(204, 76, 128, 9, 2);
      // signature block, bottom of the right page
      for (const [dx, sd] of [[250, 7], [272, 8], [294, 9]]) { const g2 = rng(sd); for (let i = 0; i < 4; i++) { const hz = g2() < .5; px('#2c1a0e', dx + g2() * 8 | 0, 168 + g2() * 10 | 0, hz ? 7 : 2, hz ? 2 : 8); } }
      // spine shadow
      for (let x = 0; x < 10; x++) { q.globalAlpha = (10 - x) / 22; px('#3a2814', 192 - x, 68, 1, 122); px('#3a2814', 192 + x, 68, 1, 122); } q.globalAlpha = 1;
      // untied twine
      line(36, 120, 20, 140, '#a88a58'); line(20, 140, 28, 168, '#a88a58'); line(28, 168, 8, 176, '#a88a58');
    });
    const turn = (t0, t) => { // a page turning right to left around the spine
      const u = (t - t0) / 90; if (u <= 0 || u >= 1) return;
      const th = u * Math.PI, w = Math.cos(th) * 148, lift = Math.sin(th) * 10;
      q.globalAlpha = .3; poly([[192, 68], [192 + w * .95, 68], [192 + w * .95, 192 + lift], [192, 192]], '#000'); q.globalAlpha = 1;
      poly([[192, 68], [192 + w, 68 - lift], [192 + w, 190 - lift], [192, 190]], w > 0 ? '#e8dab4' : '#d8c8a0');
      px('#c8b484', Math.min(192, 192 + w), 68 - lift, Math.abs(w), 1);
    };
    return t => {
      cg.drawImage(bg, 0, 0);
      turn(60, t); turn(190, t); turn(320, t);
      const open = Math.min(1, t / 200), fl = .9 + .1 * Math.sin(t * .23);
      light(192, 130, 70 + open * 110, '255,205,120', (.18 + open * .42) * fl);
      light(192, 70, 40 + open * 60, '255,236,170', open * .35);
      for (const s of specks) {
        const age = wrap(t * s.s + s.o, 260), a = Math.min(1, age / 30, (260 - age) / 60) * open;
        q.globalAlpha = Math.max(0, a); px(s.k ? '#ffffff' : '#ffd070', s.x + Math.sin(t * .03 + s.p) * 12, 190 - age * .9, s.k ? 2 : 1, s.k ? 2 : 1);
      }
      q.globalAlpha = 1;
    };
  };

  // ----- intro 3: the keeper steps out of the stacks with a lantern -----
  const I3 = () => {
    const r = rng(121), VX = 192, motes = Array.from({ length: 50 }, () => ({ x: r() * 384, y: r() * 256, s: .3 + r() * .7, p: r() * 6 }));
    const bg = mkq(384, 256, () => {
      px('#04050a', 0, 0, 384, 256);
      poly([[0, 0], [150, 90], [234, 90], [384, 0]], '#080a12');
      poly([[0, 256], [150, 140], [234, 140], [384, 256]], '#10121a');
      px('#0a0c14', 150, 90, 84, 50);
      for (const side of [-1, 1]) {
        const X = d => side < 0 ? 150 * d : 384 - 150 * d; // d: 0 near .. 1 far
        const yTop = d => 90 * d, yBot = d => 256 - 116 * d;
        poly(side < 0 ? [[0, 0], [150, 90], [150, 140], [0, 256]] : [[384, 0], [234, 90], [234, 140], [384, 256]], '#0c0e18');
        const N = 12;
        for (let i = 0; i < N; i++) {
          const d0 = Math.pow(i / N, 1.5), d1 = Math.pow((i + 1) / N, 1.5);
          // map near-to-far: x runs from the screen edge toward the wall end
          const xa = side < 0 ? 150 * d0 : 384 - 150 * d0, xb = side < 0 ? 150 * d1 : 384 - 150 * d1;
          for (let tier = 0; tier < 4; tier++) {
            const v0 = tier / 4 + .02, v1 = (tier + 1) / 4 - .03;
            const ya0 = yTop(d0) + (yBot(d0) - yTop(d0)) * v0, ya1 = yTop(d0) + (yBot(d0) - yTop(d0)) * v1;
            const yb0 = yTop(d1) + (yBot(d1) - yTop(d1)) * v0, yb1 = yTop(d1) + (yBot(d1) - yTop(d1)) * v1;
            const col = ['#2a2230', '#222a34', '#30262a', '#262a26'][r() * 4 | 0];
            poly([[xa, ya0], [xb, yb0], [xb, yb1], [xa, ya1]], col);
            px('#0a0810', xa, ya1, 1, 1);
          }
        }
        void X;
      }
      grad(0, 140, 384, 116, [[0, '#0c0e16'], [1, '#050609']]);
    });
    const robe = (a) => {
      q.globalAlpha = a;
      const R = '#0a0810';
      poly([[192, 100], [176, 112], [168, 150], [156, 218], [228, 218], [216, 150], [208, 112]], R);
      blob(192, 104, 14, 16, R); blob(192, 108, 8, 10, '#020106');
      px('#f0c070', 188, 107, 2, 1); px('#f0c070', 195, 107, 2, 1);
      px('#f0a858', 216, 150, 1, 68); px('#f0a858', 207, 110, 1, 10); px('#f0a858', 204, 94, 3, 1);
      line(208, 128, 232, 150, R); line(209, 129, 233, 151, R);
      q.globalAlpha = 1;
    };
    return t => {
      cg.drawImage(bg, 0, 0);
      const a = Math.max(0, Math.min(1, (t - 40) / 120)), fl = .85 + .1 * Math.sin(t * .3) + .05 * Math.sin(t * .11);
      robe(a);
      // lantern
      q.globalAlpha = a; px('#3a2a1a', 229, 150, 10, 2); px('#3a2a1a', 229, 164, 10, 2); px('#3a2a1a', 229, 150, 1, 16); px('#3a2a1a', 238, 150, 1, 16);
      px('#ffd070', 230, 152, 8, 12); px('#fff4c0', 232, 155, 4, 6); q.globalAlpha = 1;
      light(234, 158, 150 * a + 20, '255,190,90', .55 * fl * a);
      light(234, 158, 40, '255,230,160', .5 * fl * a);
      // floor pool of light
      q.globalAlpha = .3 * a * fl; blob(234, 228, 90, 10, '#c8883a'); q.globalAlpha = 1;
      shaft(230, 238, 160, 150, 320, 256, `rgba(255,200,110,${.06 * a})`);
      q.globalAlpha = .8 * a;
      for (const m of motes) px('#ffe8b0', wrap(m.x + t * .1 * m.s + Math.sin(t * .02 + m.p) * 6, 384), wrap(m.y - t * .15 * m.s, 256));
      q.globalAlpha = 1;
    };
  };

  // ================================================================ CHAPTER 1 (ported from v1)
  // ----- 1-1: Hanyang burning (갑신정변) -----
  const A1 = () => {
    const W = 424, r = rng(7), PX = 270, PY = 200;
    const sky = mkq(W, 256, () => {
      grad(0, 0, W, 210, [[0, '#07061a'], [.3, '#1a0b2e'], [.58, '#5a1228'], [.8, '#c4452a'], [1, '#f8a038']]);
      px('#f8a038', 0, 210, W, 46);
      for (let i = 0; i < 110; i++) px(r() < .15 ? '#ffffff' : '#9a9ad0', r() * W, r() * 100);
    });
    const far = mkq(W, 256, () => ridge(W, 158, 24, 1.2, '#2c1030', 256, '#b0402c'));
    const mid = mkq(W, 256, () => ridge(W, 186, 16, 3.1, '#1a0a22', 256, '#8a3226'));
    const town = mkq(W, 256, () => {
      for (let i = 0; i < 14; i++) {
        const cx = 10 + i * 31 + r() * 10, w = 26 + r() * 14, ye = 214 + r() * 6;
        px('#0e0516', cx - w / 2 + 3, ye + 4, w - 6, 256 - ye);
        roof(cx, ye, w, 8, '#12071a', '#1c0c26');
        if (r() < .5) px('#f0a040', cx - 2 + r() * 8, ye + 10, 2, 3);
      }
    });
    const hall = mkq(W, 256, () => {
      px('#0c0412', PX - 86, PY - 4, 172, 60);
      px('#150818', PX - 66, PY - 30, 132, 28);
      for (let i = 0; i <= 8; i++) px('#2a1018', PX - 66 + i * 16.5, PY - 30, 3, 28);
      roof(PX, PY - 30, 172, 20, '#0c0412', '#24102a');
      px('#150818', PX - 34, PY - 58, 68, 20);
      for (let i = 0; i <= 4; i++) px('#2a1018', PX - 34 + i * 16.5, PY - 58, 3, 20);
      roof(PX, PY - 60, 104, 22, '#0c0412', '#24102a');
      px('#0c0412', PX - 3, PY - 92, 6, 8);
    });
    const fg = mkq(W, 256, () => {
      roof(30, 254, 300, 40, '#04020a', '#0a0612'); px('#04020a', 0, 252, W, 4);
      man(206, 240, 15, { body: '#06030a', rim: '#f08a28' }); man(215, 241, 13, { body: '#06030a', rim: '#f08a28' });
    });
    const em = Array.from({ length: 70 }, () => ({ x: 170 + r() * 230, s: .25 + r() * .7, o: r() * 300, p: r() * 6 }));
    const tongues = Array.from({ length: 22 }, (_, i) => i < 12
      ? { x: PX - 76 + i * 13.5, y: PY - 32, w: 9 + r() * 5, h: 16 + r() * 12 }
      : { x: PX - 40 + (i - 12) * 8.5, y: PY - 62, w: 8 + r() * 4, h: 14 + r() * 10 });
    return t => {
      const p = f => -Math.floor(Math.min(40, t * .03) * f), ox = p(.8);
      cg.drawImage(sky, p(.05), 0); cg.drawImage(far, p(.15), 0); cg.drawImage(mid, p(.35), 0); cg.drawImage(town, p(.55), 0); cg.drawImage(hall, ox, 0);
      q.save(); q.translate(ox, 0);
      tongues.forEach((f, i) => flame(f.x, f.y, f.w, f.h + 8 * Math.sin(t * .2 + i * 1.7) + 4 * Math.sin(t * .37 + i), t * .15 + i));
      for (let i = 0; i < 8; i++) { const age = (t * .4 + i * 36) % 288; q.globalAlpha = .4 * (1 - age / 288); blob(PX - 24 + i * 7 + age * .25, 140 - age * .55, 10 + age * .12, 7 + age * .09, '#1a0d1c'); }
      q.globalAlpha = 1;
      for (const e of em) px(e.p < 2 ? '#ffd060' : e.p < 4 ? '#f08a28' : '#ff6a30', e.x + Math.sin(t * .03 + e.p) * 9, 205 - ((t * e.s + e.o) % 215));
      q.restore();
      light(PX + ox, 165, 200, '255,110,40', .3 + .06 * Math.sin(t * .2) + .04 * Math.sin(t * .53));
      cg.drawImage(fg, p(1), 0);
    };
  };

  // ----- 1-2: steamship at dawn off Jemulpo (언더우드·아펜젤러) -----
  const A2 = () => {
    const r = rng(11), SH = '#0e1226', SL = '#24284c', RIM = '#e8906a';
    const bg = mkq(384, 256, () => {
      grad(0, 0, 384, 152, [[0, '#1b2a52'], [.4, '#5a4880'], [.72, '#e8806a'], [1, '#ffd890']]);
      dglow(250, 150, 70, '#ffe8a8', 1.1);
      for (let y = -26; y <= 0; y++) { const hw = Math.sqrt(26 * 26 - y * y); px('#fff4c0', 250 - hw, 150 + y, hw * 2, 1); }
      for (let x = 200; x < 384; x++) { const u = (x - 200) / 184, h = 30 * u * u * (3 - 2 * u) * (.75 + .25 * Math.sin(x * .09)); px('#2a2a56', x, 150 - h, 1, h + 4); px('#f0a070', x, 150 - h, 1, 1); }
      for (const [x, y, w] of [[330, 146, 14], [348, 144, 12], [366, 141, 14]]) { roof(x, y, w, 4, '#1c1c40'); px('#1c1c40', x - w / 2 + 2, y + 2, w - 4, 4); }
      grad(0, 150, 384, 106, [[0, '#f0b878'], [.1, '#c87a7a'], [.35, '#52508e'], [1, '#0c1234']]);
    });
    const clouds = mkq(768, 100, () => {
      for (let i = 0; i < 9; i++) { const cx = r() * 384 | 0, cy = 18 + r() * 70 | 0, rx = 40 + r() * 60, ry = 4 + r() * 5; for (const o of [0, 384]) { blob(cx + o, cy, rx, ry, '#7a5a90'); blob(cx + o, cy + ry * .4, rx * .9, ry * .5, '#f09a8a'); } }
    });
    const ship = mkq(172, 110, () => {
      poly([[6, 70], [138, 70], [160, 54], [146, 82], [128, 88], [20, 88], [8, 80]], SH); px(RIM, 8, 70, 130, 1);
      for (const mx of [34, 74, 110]) px(SH, mx, mx === 74 ? 6 : 12, 2, mx === 74 ? 64 : 58);
      for (const [mx, top, w, hh] of [[34, 22, 30, 26], [74, 12, 34, 30], [110, 22, 30, 26]]) {
        px(SH, mx - w / 2, top, w, 1);
        poly([[mx - w / 2 + 1, top + 1], [mx + w / 2 - 1, top + 1], [mx + w / 2 - 3, top + hh], [mx - w / 2 + 3, top + hh]], SL);
        px(RIM, mx + w / 2 - 2, top + 2, 1, hh - 4);
      }
      px(SH, 52, 40, 9, 30); px('#3a2a3a', 52, 40, 9, 2);
      line(36, 12, 160, 54, '#1a1e38'); line(36, 12, 6, 70, '#1a1e38'); line(112, 22, 160, 54, '#1a1e38'); line(150, 60, 172, 50, SH);
      man(130, 70, 15, { body: '#080a18', rim: RIM, hat: 'top' }); man(139, 70, 14, { body: '#080a18', rim: RIM, hat: 'top' });
    });
    const gulls = Array.from({ length: 5 }, (_, i) => ({ s: .3 + i * .1, o: i * 90, y: 50 + i * 13 }));
    return t => {
      cg.drawImage(bg, 0, 0);
      cg.drawImage(clouds, -Math.floor(t * .06 % 384), 0);
      for (let i = 0; i < 26; i++) { if (Math.sin(t * .1 + i * 1.7) < -.2) continue; const w = 3 + i * .9; px(i % 2 ? '#ffd890' : '#fff0b8', 250 + Math.sin(t * .07 + i * 2.1) * (2 + i * .4) - w / 2, 152 + i * 3.6, w, 1); }
      const rowC = ['#b88aa8', '#8a7ab8', '#5a5a9c', '#3a4080', '#2a3068', '#1c2658'];
      for (let row = 0; row < 14; row++) {
        const y = 154 + (row / 13) ** 1.6 * 96, sp = 40 + row * 8, len = 6 + row * 2, s = (.15 + row * .04) * (row % 2 ? 1 : -1);
        for (let k = -1; k * sp < 420; k++) px(rowC[row * 6 / 14 | 0], wrap(k * sp + t * s + row * 13, 384 + sp) - sp / 2, y, len, 1 + (row > 8));
      }
      const bob = Math.round(Math.sin(t * .04) * 2), sy = 100 + bob;
      q.save(); q.globalAlpha = .22; q.translate(40, sy + 84); q.scale(1, -1); q.drawImage(ship, 0, -84); q.restore();
      cg.drawImage(ship, 40, sy);
      for (let i = 0; i < 10; i++) { const age = (t * .5 + i * 30) % 300; q.globalAlpha = .5 * (1 - age / 300); blob(96 - age * .45, 140 + bob - age * .12, 3 + age * .04, 2 + age * .03, '#2a2438'); }
      q.globalAlpha = 1;
      for (const gl of gulls) bird(wrap(t * gl.s + gl.o, 440) - 30, gl.y + Math.sin(t * .08 + gl.o) * 5, (t >> 3) % 2 * 2, '#2a2038');
    };
  };

  // ----- 1-3: Gwanghyewon gate opens at sunrise -----
  const A3 = () => {
    const r = rng(31), motes = Array.from({ length: 36 }, () => ({ x: r() * 384, y: r() * 256, s: .4 + r(), p: r() * 6 }));
    const glyph = (x, y, sd) => { const g2 = rng(sd); for (let i = 0; i < 6; i++) { const hz = g2() < .5, len = 5 + g2() * 7 | 0; px('#e8d8a8', x + g2() * 6 | 0, y + g2() * 6 | 0, hz ? len : 1, hz ? 1 : len); } };
    const bg = mkq(384, 256, () => {
      grad(0, 0, 384, 110, [[0, '#2a3a66'], [.6, '#b07a88'], [1, '#f0b080']]);
      dglow(310, 100, 80, '#ffe0a0', 1.2);
      ridge(384, 84, 12, 4.2, '#4a4a7a', 170, '#f8c090');
      for (const x of [18, 58, 98, 292, 334, 372]) tree(x, 150, 70 + (x % 7) * 4, '#1c3a48', '#3a6a62');
      px('#d8b890', 0, 150, 384, 60); px('#b89870', 0, 192, 384, 18);
      poly([[40, 150], [70, 150], [50, 196], [20, 196]], '#b89a80'); poly([[300, 150], [330, 150], [310, 196], [280, 196]], '#b89a80');
      px('#8a7a78', 0, 196, 384, 14); for (let x = 0; x < 384; x += 14) px('#6a5a5a', x + ((x / 14) & 1) * 7, 196, 1, 14); px('#6a5a5a', 0, 203, 384, 1);
      px('#2a2a3a', 0, 142, 384, 8); px('#4a4a6a', 0, 142, 384, 1); for (let x = 0; x < 384; x += 5) px('#1a1a28', x, 143, 1, 7);
      roof(192, 128, 156, 26, '#26263a', '#4a4a6e');
      px('#3a2218', 132, 128, 120, 6); for (let x = 134; x < 250; x += 8) px('#5a3a28', x, 128, 3, 6);
      px('#1c1210', 166, 134, 52, 16); px('#c8a060', 166, 134, 52, 1); px('#c8a060', 166, 149, 52, 1); glyph(170, 137, 1); glyph(186, 137, 2); glyph(202, 137, 3);
      px('#4a2a1c', 132, 134, 6, 76); px('#4a2a1c', 246, 134, 6, 76);
      grad(138, 150, 108, 60, [[0, '#ffd890'], [1, '#ffb860']]);
      roof(192, 178, 64, 10, '#7a5a6a', '#9a7a80'); px('#8a6a6a', 168, 178, 48, 14);
      px('#5a2e22', 138, 150, 16, 60); px('#5a2e22', 230, 150, 16, 60);
      for (let y = 156; y < 208; y += 10) { px('#c8a060', 143, y, 2, 2); px('#c8a060', 235, y, 2, 2); }
      px('#f4ecd8', 272, 160, 20, 28); for (let y = 164; y < 186; y += 4) px('#7a6a5a', 275, y, 14, 1);
      grad(0, 210, 384, 46, [[0, '#d8b078'], [.4, '#b08a68'], [1, '#5a4a58']]);
      q.globalAlpha = .45; poly([[186, 210], [198, 210], [214, 256], [166, 256]], '#4a3a58'); q.globalAlpha = 1;
      man(192, 210, 46, { body: '#17142a', rim: '#ffe0a0' });
      for (const [x, y, h] of [[268, 236, 32], [284, 240, 36], [300, 234, 30], [256, 245, 38], [318, 243, 34], [112, 240, 30], [98, 244, 34]]) {
        q.globalAlpha = .35; poly([[x - 3, y], [x + 3, y], [x - 24, y + 14], [x - 40, y + 14]], '#3a3050'); q.globalAlpha = 1;
        man(x, y, h, { body: '#9c98c0', rim: '#ffe0b0', hat: 'gat', hatc: '#14122a', skin: '#14122a', coat: 1 });
      }
    });
    return t => {
      cg.drawImage(bg, 0, 0);
      q.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 4; i++) { const xs = 250 + i * 50; q.fillStyle = `rgba(255,220,150,${.05 + .03 * Math.sin(t * .02 + i * 1.7)})`; q.beginPath(); q.moveTo(xs, 0); q.lineTo(xs + 24, 0); q.lineTo(xs - 150, 256); q.lineTo(xs - 190, 256); q.fill(); }
      q.globalCompositeOperation = 'source-over';
      q.globalAlpha = .7; for (const m of motes) px('#fff0c0', wrap(m.x + t * .1 * m.s + Math.sin(t * .02 + m.p) * 6, 384), wrap(m.y - t * .12 * m.s, 256)); q.globalAlpha = 1;
    };
  };

  // ================================================================ CHAPTER 2
  // ----- 2-1 (new): Carnegie Hall, 1900 — Avison speaks, Severance rises -----
  const B0 = () => {
    const r = rng(201), SEAT_X = 138;
    const chand = [[192, 20, 1], [76, 36, .75], [308, 36, .75]];
    const bg = mkq(384, 256, () => {
      grad(0, 0, 384, 256, [[0, '#1c0d14'], [.5, '#3c1c1c'], [1, '#120a0e']]);
      // proscenium arch and stage backdrop
      blob(192, 112, 108, 96, '#9a7a38'); blob(192, 112, 100, 88, '#5a2c22');
      q.save(); q.beginPath(); q.ellipse(192, 112, 94, 82, 0, 0, Math.PI * 2); q.clip();
      grad(98, 30, 188, 120, [[0, '#4a2c1c'], [.6, '#a06a38'], [1, '#e0a050']]);
      for (let x = 108; x < 280; x += 7) { const h = 30 + (Math.sin(x * .2) * 14 | 0) + (x % 3) * 4; px('#d8b86a', x, 140 - h - 40, 4, h + 40); px('#fff0b0', x, 140 - h - 40, 1, h + 40); }
      q.restore();
      // stage
      px('#6a4a2c', 92, 140, 200, 20); px('#a07a48', 92, 140, 200, 1);
      for (let x = 92; x < 292; x += 12) px('#4a321e', x, 141, 1, 19);
      px('#241410', 86, 158, 212, 6);
      // balcony tiers, both sides
      for (const side of [-1, 1]) {
        for (let tier = 0; tier < 3; tier++) {
          const y = 66 + tier * 40, x0 = side < 0 ? 0 : 296, w = 88;
          px('#7a5a2c', x0, y, w, 6); px('#c8a050', x0, y, w, 1);
          px('#1a0e10', x0, y + 6, w, 4);
          for (let x = x0 + 2; x < x0 + w; x += 4) px('#a88438', x, y + 6, 1, 6);
          for (let i = 0; i < 10; i++) { const hx = x0 + 6 + i * 8 + r() * 3, hy = y - 7 - (r() * 2 | 0); px('#120a10', hx - 2, hy + 3, 5, 5); blob(hx, hy, 2, 2.5, '#0e080c'); }
          px('#241216', x0, y - 30, w, 28);
        }
        px('#8a6a30', side < 0 ? 84 : 296, 40, 4, 190);
      }
      for (const [x, y, s] of chand) { px('#2a1c12', x, 0, 1, y - 6); px('#c8a050', x - 10 * s, y, 20 * s, 2); px('#c8a050', x - 6 * s, y + 6, 12 * s, 2); }
      // speaker and podium
      man(192, 142, 22, { body: '#16101a', skin: '#d8b098', rim: '#ffe0a0' });
      px('#5a3a22', 184, 130, 16, 12); px('#8a6232', 184, 130, 16, 1);
      px('#f4ecd0', 188, 128, 8, 2);
    });
    // audience rows (rising man's seat is left empty in the middle row)
    const rowHeads = (y, sp, hr, skipX) => {
      for (let x = -sp * .3; x < 400; x += sp + (r() * 3 | 0)) {
        if (skipX !== undefined && Math.abs(x - skipX) < sp * .8) continue;
        const col = ['#0a060c', '#120a10', '#0e0a14', '#160e12'][r() * 4 | 0];
        poly([[x - hr * 1.5, y + 12], [x - hr * 1.2, y], [x + hr * 1.2, y], [x + hr * 1.5, y + 12]], col);
        blob(x, y - hr * .8, hr * .8, hr, col);
        if (r() < .12) px('#c8b8a8', x - hr * .5, y - hr * 1.7, hr, 1); // a bonnet
        px('#e8a860', x + hr * .6, y - hr * 1.2, 1, hr * .9); // rim from the stage light
      }
    };
    const back = mkq(384, 256, () => { rowHeads(194, 15, 5); rowHeads(214, 20, 6.5, SEAT_X); });
    const front = mkq(384, 256, () => { rowHeads(250, 30, 10); });
    const sway = Array.from({ length: 12 }, () => ({ x: r() * 384, p: r() * 6 }));
    return t => {
      cg.drawImage(bg, 0, 0);
      // spotlight cone on the speaker
      const sp = .08 + .02 * Math.sin(t * .05);
      shaft(184, 200, 0, 140, 244, 146, `rgba(255,236,170,${sp})`);
      cg.drawImage(back, 0, 0);
      // Severance stands up after a held breath
      const u = Math.max(0, Math.min(1, (t - 150) / 70)), e = u * u * (3 - 2 * u);
      man(SEAT_X, 232, 24 + e * 28, { body: '#0c0a12', skin: '#2a1c18', rim: '#ffd8a0', coat: 1, hat: 'top', hatc: '#0c0a12' });
      cg.drawImage(front, 0, 0);
      for (const [x, y, s] of chand) {
        const fl = .85 + .15 * Math.sin(t * .13 + x);
        light(x, y + 4, 70 * s, '255,200,110', .4 * fl);
        for (let i = 0; i < 6; i++) if (Math.sin(t * .2 + i * 2.3 + x) > .6) px('#fff8d0', x - 9 * s + i * 3.6 * s, y + 3, 1, 1);
      }
      light(192, 132, 60, '255,230,160', .22);
      light(SEAT_X, 200, 50 + e * 30, '255,200,120', .12 * e);
      // dust in the spot
      q.globalAlpha = .6;
      for (let i = 0; i < 18; i++) { const y = wrap(t * .2 + i * 13, 150), x = 192 + (i - 9) * (y / 150) * 3 + Math.sin(t * .02 + i) * 4; px('#fff0c0', x, y, 1, 1); }
      q.globalAlpha = 1;
      for (const s of sway) { q.globalAlpha = .25; px('#e8a860', s.x, 196 + Math.sin(t * .05 + s.p) * 1.5, 2, 1); q.globalAlpha = 1; }
    };
  };

  // ----- 2-2: Severance Memorial Hospital at dusk (1904, ported from v1) -----
  const B1 = () => {
    const W = 424, r = rng(21), wins = [];
    const sky = mkq(W, 256, () => {
      grad(0, 0, W, 215, [[0, '#2a2658'], [.4, '#8a5a8a'], [.72, '#f0907a'], [1, '#ffd0a0']]);
      px('#ffd0a0', 0, 215, W, 41); dglow(90, 190, 80, '#fff0c0', 1.1);
      for (let i = 0; i < 6; i++) { const cx = r() * W | 0, cy = 30 + r() * 90 | 0, rx = 30 + r() * 50, ry = 3 + r() * 4; blob(cx, cy, rx, ry, '#a0689a'); blob(cx, cy + ry * .5, rx * .85, ry * .5, '#f8a08a'); }
    });
    const hills = mkq(W, 256, () => { ridge(W, 176, 14, 1.7, '#6a4a80', 256, '#f8a888'); ridge(W, 198, 10, 4.1, '#43386a', 256, '#c47a80'); });
    const bricks = (x, y, w, h) => {
      px('#8a3a30', x, y, w, h);
      for (let yy = y; yy < y + h; yy += 4) { px('#6a2a28', x, yy, w, 1); for (let xx = x + ((yy >> 2) & 1) * 4; xx < x + w; xx += 8) px('#6a2a28', xx, yy, 1, 4); }
    };
    const main = mkq(W, 256, () => {
      grad(0, 214, W, 42, [[0, '#4e6a4a'], [1, '#1c2830']]);
      poly([[176, 256], [234, 256], [214, 214], [196, 214]], '#a88c7c');
      const BL = 100, BR = 316, BASE = 214;
      poly([[BL - 6, 162], [BL + 14, 132], [BR - 14, 132], [BR + 6, 162]], '#3c3c58');
      for (let y = 134; y < 162; y += 4) px('#52526e', BL - 4 + (y - 134) * .6, y, BR - BL + 8 - (y - 134) * 1.2, 1);
      bricks(BL, 162, BR - BL, BASE - 162); bricks(92, 118, 30, 44);
      px('#c8bca8', BL, 162, BR - BL, 2); px('#c8bca8', BL, 190, BR - BL, 1);
      poly([[166, 164], [208, 122], [250, 164]], '#e8dcc8'); poly([[172, 162], [208, 128], [244, 162]], '#8a3a30');
      blob(208, 148, 5, 5, '#e8dcc8'); blob(208, 148, 3, 3, '#1a1a30');
      poly([[88, 122], [107, 90], [126, 122]], '#3c3c58'); px('#3c3c58', 106, 80, 2, 12);
      for (const cx of [150, 262]) { px('#6a2a28', cx, 112, 9, 24); px('#3a1a18', cx - 2, 110, 13, 3); }
      for (const wy of [172, 196]) for (let i = 0; i < 7; i++) {
        const wx = 130 + i * 24; if (wy === 196 && Math.abs(wx + 4 - 208) < 14) continue;
        px('#e8dcc8', wx - 1, wy - 1, 10, 17); px('#1a1a30', wx, wy, 8, 15); px('#e8dcc8', wx + 3, wy, 1, 15); px('#e8dcc8', wx, wy + 6, 8, 1); wins.push([wx, wy]);
      }
      px('#e8dcc8', 195, 188, 26, 26); px('#2a1a20', 198, 192, 20, 22); px('#c8bca8', 190, 212, 36, 2); px('#a89c8c', 186, 214, 44, 2);
    });
    const fg = mkq(W, 256, () => {
      for (let x = 0; x < W; x += 6) { if (x > 150 && x < 262) continue; px('#241c2c', x, 236, 3, 20); px('#241c2c', x + 1, 234, 1, 2); }
      for (const [a, b] of [[0, 150], [262, W]]) { px('#241c2c', a, 240, b - a, 2); px('#241c2c', a, 250, b - a, 2); }
      tree(40, 232, 80, '#27402e', '#4a7050'); tree(395, 232, 90, '#27402e', '#4a7050');
      px('#241c2c', 329, 196, 3, 60); px('#241c2c', 325, 190, 11, 6);
    });
    return t => {
      const p = f => -Math.floor(Math.min(40, t * .03) * f), ox = p(.6);
      cg.drawImage(sky, p(.05), 0); cg.drawImage(hills, p(.3), 0); cg.drawImage(main, ox, 0);
      wins.forEach(([x, y], i) => { if (Math.sin(t * .008 + i * 2.3) < -.35) return; q.globalAlpha = .9; px('#ffd070', x + ox, y, 8, 15); px('#e8dcc8', x + ox + 3, y, 1, 15); px('#e8dcc8', x + ox, y + 6, 8, 1); q.globalAlpha = 1; light(x + ox + 4, y + 8, 18, '255,190,90', .22); });
      q.globalAlpha = .9; px('#ffc060', 198 + ox, 192, 20, 22); q.globalAlpha = 1; light(208 + ox, 204, 36, '255,190,90', .35);
      for (const cx of [154, 266]) for (let i = 0; i < 5; i++) { const age = (t * .3 + i * 30) % 150; q.globalAlpha = .35 * (1 - age / 150); blob(cx + ox + age * .35 + Math.sin(age * .05) * 3, 108 - age * .5, 3 + age * .05, 2 + age * .04, '#6a5a78'); }
      q.globalAlpha = 1;
      man(205 + ox, 246, 30, { body: '#e0d8ec', skin: '#d8b098', rim: '#ffd8a8', hat: 'top', hatc: '#2a2438' });
      man(193 + ox, 247, 26, { body: '#d0cce0', skin: '#14122a', rim: '#ffd8a8' });
      man(221 + ox, 247, 27, { body: '#8a86b0', skin: '#14122a', rim: '#ffd8a8', hat: 'gat', hatc: '#14122a', coat: 1 });
      cg.drawImage(fg, p(1), 0);
      light(330 + p(1), 194, 64, '255,200,110', .42 + .06 * Math.sin(t * .3));
      for (let i = 0; i < 3; i++) bird(wrap(t * (.35 + i * .12) + i * 130, 440) - 30, 50 + i * 16 + Math.sin(t * .09 + i) * 4, (t >> 3) % 2 * 2, '#3a2840');
    };
  };

  // ----- 2-3 (new): 1915, a rented YMCA classroom, Underwood at the blackboard -----
  const B3 = () => {
    const r = rng(231);
    // chalk strokes: lines of lettering near Underwood, plus a sketch of a building
    const strokes = [];
    for (let row = 0; row < 3; row++) for (let i = 0; i < 9; i++) {
      const x = 122 + i * 9 + r() * 2, y = 44 + row * 16, hz = r() < .45, len = 4 + r() * 5 | 0;
      strokes.push(hz ? [x, y + 4, x + len, y + 4] : [x + 2, y, x + 2, y + len]);
      if (r() < .4) strokes.push([x, y + 8, x + 5, y + 8]);
    }
    const bg = mkq(384, 256, () => {
      grad(0, 0, 384, 150, [[0, '#6a5848'], [1, '#8a7258']]);
      px('#4a3a2c', 0, 116, 384, 36); px('#2a1e16', 0, 114, 384, 3); px('#6a5238', 0, 116, 384, 1);
      grad(0, 150, 384, 106, [[0, '#8a6a42'], [1, '#26180f']]);
      for (let i = -8; i <= 8; i++) line(192 + i * 6, 152, 192 + i * 46, 256, '#5a4028');
      for (const y of [160, 174, 196, 228]) px('#6a4c30', 0, y, 384, 1);
      // blackboard
      px('#4a3220', 106, 24, 200, 96); px('#1e3a30', 111, 29, 190, 86);
      for (let y = 29; y < 115; y += 3) if (y & 4) px('#244436', 111, y, 190, 1);
      px('#6a4a2a', 106, 120, 200, 3); px('#e8e4d8', 150, 119, 6, 2); px('#e8e4d8', 160, 119, 4, 2);
      // sketch of a college building, right half of the board
      const CH = '#d8e0d0';
      px(CH, 214, 84, 70, 1); px(CH, 222, 66, 54, 1); px(CH, 222, 66, 1, 18); px(CH, 275, 66, 1, 18);
      line(214, 66, 249, 46, CH); line(284, 66, 249, 46, CH); px(CH, 214, 66, 70, 1);
      for (let i = 0; i < 5; i++) px(CH, 228 + i * 10, 68, 1, 16);
      px(CH, 244, 74, 10, 10);
      // windows with daylight, both sides
      for (const x0 of [14, 320]) {
        px('#3a2a1e', x0 - 3, 20, 62, 96); grad(x0, 24, 56, 88, [[0, '#bcdcf4'], [1, '#fff0c8']]);
        blob(x0 + 18, 50, 16, 4, '#f4faff'); blob(x0 + 38, 70, 12, 3, '#f4faff');
        for (let i = 0; i < 6; i++) px('#7a6a60', x0 + 2 + i * 9, 100, 7, 12); // tile roofs outside
        px('#3a2a1e', x0 + 27, 24, 2, 88); px('#3a2a1e', x0, 66, 56, 2);
        px('#8a7258', x0 - 4, 116, 64, 3);
      }
      // wall clock and stove
      blob(192, 12, 7, 7, '#d8d0b8'); blob(192, 12, 5, 5, '#f0ead8'); px('#2a1e16', 192, 8, 1, 5); px('#2a1e16', 192, 12, 3, 1);
      px('#1c1c24', 330, 126, 22, 26); px('#34343e', 330, 126, 22, 2); px('#1c1c24', 339, 0, 4, 126);
    });
    const rows = [[162, 20], [182, 24], [208, 28], [246, 32]], students = [];
    const stud = mkq(384, 256, () => {
      const counts = [18, 16, 14, 12];
      rows.forEach(([by, sp], k) => {
        const n = counts[k], span = n * sp * .9, x0 = 192 - span / 2;
        for (let i = 0; i < n; i++) {
          const x = x0 + (i + .5) * span / n, hr = sp * .2, lit = r() < .3;
          const col = lit ? ['#d8d0c0', '#c4bcae'][r() * 2 | 0] : ['#1c1e32', '#2a2c44', '#222638', '#181a28'][r() * 4 | 0];
          const hair = ['#0e0c12', '#14101a'][r() * 2 | 0];
          poly([[x - sp * .36, by], [x - sp * .3, by - sp * .42], [x + sp * .3, by - sp * .42], [x + sp * .36, by]], col);
          blob(x, by - sp * .42 - hr * .8, hr, hr * 1.15, hair);
          px('#d8b098', x - hr * .4, by - sp * .42 - hr * .1, hr * .8, 1);
          px('#fff0c0', x + (x < 192 ? -sp * .3 : sp * .3 - 1), by - sp * .4, 1, sp * .4);
          students.push([x, by - sp * .42 - hr * 1.6, k]);
        }
        px('#3a2616', 0, by, 384, 5); px('#6a4a2c', 0, by, 384, 1);
      });
    });
    const dust = Array.from({ length: 50 }, () => ({ x: r() * 384, y: r() * 256, s: .3 + r() * .6, p: r() * 6 }));
    const chalk = [];
    return t => {
      cg.drawImage(bg, 0, 0);
      // lettering appears stroke by stroke
      const n = Math.min(strokes.length, Math.floor(t / 9));
      for (let i = 0; i < n; i++) { const s = strokes[i]; line(s[0], s[1], s[2], s[3], '#ecece0'); }
      const cur = strokes[Math.min(n, strokes.length - 1)];
      const wob = Math.sin(t * .4) * .8;
      // Underwood, white-haired, back-lit by the windows
      const ux = 132, uy = 150, uh = 54, sx = ux + 5, sy = uy - uh * .72;
      man(ux, uy, uh, { body: '#2a2430', skin: '#e0b898', rim: '#ffe8b0', coat: 1 });
      blob(ux, uy - uh * .96, 5, 5, '#ece8e4'); px('#ece8e4', ux - 3, uy - uh * .84, 7, 4); // hair and beard
      px('#e0b898', ux - 2, uy - uh * .9, 4, 3);
      const cx = cur[2] + wob * .3, cy = cur[3];
      line(sx, sy, cx, cy, '#2a2430'); line(sx, sy + 1, cx, cy + 1, '#2a2430'); px('#ecece0', cx, cy, 2, 1);
      if (n < strokes.length && t % 5 === 0) chalk.push({ x: cx, y: cy, v: 0 });
      for (let i = chalk.length - 1; i >= 0; i--) { const c = chalk[i]; c.v += .12; c.y += c.v; q.globalAlpha = Math.max(0, 1 - c.v / 2); px('#f4f4ea', c.x, c.y, 1, 1); q.globalAlpha = 1; if (c.v > 2.2) chalk.splice(i, 1); }
      cg.drawImage(stud, 0, 0);
      // a few students shift in their seats
      for (let i = 0; i < students.length; i += 7) { const s = students[i]; if (Math.sin(t * .03 + i) > .985) px('#d8b098', s[0], s[1] + 4, 2, 1); }
      // shafts of daylight
      for (let i = 0; i < 3; i++) {
        const f = .06 + .02 * Math.sin(t * .015 + i * 2);
        shaft(14 + i * 16, 44 + i * 16, 24, 90 + i * 34, 180 + i * 44, 256, `rgba(255,240,190,${f})`);
        shaft(336 + i * 6, 366 + i * 6, 24, 230 - i * 40, 300 - i * 40, 256, `rgba(255,240,190,${f})`);
      }
      light(42, 70, 70, '255,236,180', .3); light(348, 70, 70, '255,236,180', .3);
      q.globalAlpha = .6;
      for (const d of dust) px('#fff6d0', wrap(d.x + t * .08 * d.s + Math.sin(t * .02 + d.p) * 5, 384), wrap(d.y + t * .05 * d.s, 256));
      q.globalAlpha = 1;
      // fade-in caption hold: nothing else
    };
  };

  // ================================================================ ENGINE
  const startShot = () => {
    const shot = cs.sc.shots[cs.i];
    q = cg; Art.ctx(cg);
    cs.draw = shot.make(); cs.cap = shot.caption; cs.f = 0; cs.n = 0; cs.lf = 0;
    $('cap').textContent = '';
    $('ctag').textContent = `${cs.sc.tag} · ${cs.i + 1}/${cs.sc.shots.length}`;
    const m = shot.music || cs.sc.music;
    if (m && window.Music) { try { Music.play(m, { fade: 1.2 }); } catch (e) { /* audio is optional */ } }
  };
  const end = () => {
    const f = cs.next; cs = null; C.active = false;
    $('cap').textContent = ''; $('cut').style.display = 'none';
    if (f) f();
  };
  // caption typed up to n chars; key places/items coloured by game.js's markKW when it is loaded
  // one wrapping <span>: #cap is a flex box, so bare text + spans would each become a separate flex column
  const capTo = n => { if (window.markKW) $('cap').innerHTML = `<span>${window.markKW(cs.cap, n)}</span>`; else $('cap').textContent = cs.cap.slice(0, n); };
  const advance = () => { // reveal full caption first, then move to the next shot
    if (!cs || cs.lf) return;
    if (cs.n < cs.cap.length) { cs.n = cs.cap.length; capTo(cs.n); } else cs.lf = 1;
  };
  const wire = () => {
    if (wired) return; wired = true;
    cg = $('cs').getContext('2d'); q = cg; cg.imageSmoothingEnabled = false;
    VIG = mkq(384, 256, () => { // vignette painted once
      const gr = Art.cur.createRadialGradient(192, 128, 70, 192, 128, 260);
      gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.6)');
      Art.cur.fillStyle = gr; Art.cur.fillRect(0, 0, 384, 256);
    });
    $('cut').addEventListener('click', advance);
    $('cskip').addEventListener('click', e => { e.stopPropagation(); if (cs) end(); });
  };

  const C = window.Cutscenes = {
    active: false,
    register(id, scene) { scenes[id] = scene; },
    play(id, onDone) {
      const sc = scenes[id];
      if (!sc) { if (onDone) onDone(); return; }
      wire();
      cs = { sc, i: 0, next: onDone };
      C.active = true; $('cut').style.display = 'block';
      startShot();
    },
    // paints one shot into its own 384x256 canvas so game.js can reuse cutscene art (VN backgrounds, title)
    backdrop(id, i) {
      const sc = scenes[id], shot = sc && sc.shots[i];
      if (!shot) return null;
      const cv = document.createElement('canvas'); cv.width = 384; cv.height = 256;
      const ctx = cv.getContext('2d'); ctx.imageSmoothingEnabled = false;
      const run = fn => { const a = cg, b = q, o = Art.ctx(ctx); cg = q = ctx; try { return fn(); } finally { cg = a; q = b; Art.ctx(o); } };
      const draw = run(shot.make);
      return t => { run(() => { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 384, 256); draw(t); if (VIG) ctx.drawImage(VIG, 0, 0); }); return cv; };
    },
    key(code) {
      if (!cs) return;
      if (code === 'Escape') end();
      else if (code === 'KeyZ' || code === 'Enter' || code === 'Space') advance();
    },
    update() {
      if (!cs) return;
      cs.f++;
      if (cs.lf) { if (++cs.lf > 24) { if (++cs.i >= cs.sc.shots.length) end(); else startShot(); } return; }
      if (cs.f > 16 && cs.n < cs.cap.length) {
        cs.n++; capTo(cs.n);
        if (cs.n % 5 === 0 && window.Sfx) { try { Sfx.play('blip'); } catch (e) { /* optional */ } }
      }
    },
    draw() {
      if (!cs) return;
      q = cg; Art.ctx(cg);
      cg.fillStyle = '#000'; cg.fillRect(0, 0, 384, 336);
      cg.save(); cg.beginPath(); cg.rect(0, 40, 384, 256); cg.clip(); cg.translate(0, 40);
      cs.draw(cs.f);
      cg.restore();
      cg.drawImage(VIG, 0, 40);
      const a = cs.lf ? Math.min(1, cs.lf / 24) : 1 - Math.min(1, cs.f / 36);
      if (a > 0) { cg.fillStyle = `rgba(0,0,0,${a})`; cg.fillRect(0, 40, 384, 256); }
    },
  };

  // ================================================================ SCENES
  C.register('intro', {
    tag: 'PROLOGUE · 2026', music: 'intro',
    shots: [
      { caption: '2026년 11월, 연세대학교 박물관 수장고.\n밤늦게까지 박물관 자원봉사를 하던 연우는 이름 없는 서적을 발견한다.', make: I1 },
      { caption: '옛 한글로 적힌 일기장.\n표지에는 주인으로 보이는 이름이 적혀 있었다. 김복동.', make: I2 },
    ],
  });
  // not played as a page any more: the intro VN shows the keeper over this art (Cutscenes.backdrop('keeper', 0))
  C.register('keeper', { tag: '', shots: [{ caption: '', make: I3 }] });
  C.register('c1', {
    tag: 'CHAPTER 1 · 1885', music: 'cut_fire',
    shots: [
      // A1 (burning palace) dropped from playback: weakest page, and the intro is shorter without it
      { caption: '갑신정변의 불길이 지나간 이듬해, 1885년 4월 5일 제물포.\n언더우드와 아펜젤러가 같은 배 위에서 조선 땅을 바라본다.', make: A2, music: 'cut_sea' },
      { caption: '1885년 4월 10일, 광혜원이 문을 열었다.\n한국 최초의 서양식 병원 — 연세의 시작이었다.', make: A3, music: 'cut_dawn' },
    ],
  });
  C.register('c2', {
    tag: 'CHAPTER 2 · 1900', music: 'cut_build',
    shots: [
      { caption: '1900년, 뉴욕 카네기홀.\n에비슨의 호소가 끝나자 클리블랜드의 사업가 세브란스가 자리에서 일어났다.', make: B0 },
    ],
  });
  // the 1904 hospital and 1915 classroom paintings now stage those scenes inside Act 2 (game.js BGS),
  // instead of spoiling them before the act's 1902 opening
  C.register('c2x', {
    tag: '', shots: [
      { caption: '', make: B1 },
      { caption: '', make: B3 },
    ],
  });
})();
