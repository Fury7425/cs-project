/* audio.js — window.Music / Sfx / Voice / AudioCtl
 * Raw WebAudio, no external libraries (Tone.js NOT needed). Everything degrades silently
 * when AudioContext is missing or blocked. Context is created on the first user gesture.
 *
 * Pattern notation (one string per voice, looped):
 *   "F#5:3 E5 D5:2 r:2"   NOTE[:steps]  (default 1 step), r = rest, A4+C5+E5:4 = chord, "|" ignored
 *   m60 = raw midi number.   1 step = 1/div of a beat (div=2 -> eighth notes in 4/4 or 3/4,
 *   div=3 -> eighths in 12/8 where a beat is a dotted quarter).
 * Drum strings: one char per step. k kick, s snare, h hat, H open hat, t tom, w wood block,
 *   c crash, n noise wave swell, r rain/crackle tick, . rest.
 */
(function () {
  'use strict';

  /* ---------------------------------------------------------------- state */
  var AC = window.AudioContext || window.webkitAudioContext;
  var ctx = null, master, musBus, duckG, sfxBus, revIn, dlyIn, noiseBuf, pulseW;
  var muted = false;
  try { muted = localStorage.getItem('yh_muted') === '1'; } catch (e) {}

  function ensure() {
    if (ctx) return true;
    if (!AC) return false;
    try {
      ctx = new AC();
      master = ctx.createGain(); master.gain.value = muted ? 0 : 0.8;
      var comp = ctx.createDynamicsCompressor();
      master.connect(comp); comp.connect(ctx.destination);
      duckG = ctx.createGain(); musBus = ctx.createGain(); musBus.gain.value = 0.7;
      musBus.connect(duckG); duckG.connect(master);
      sfxBus = ctx.createGain(); sfxBus.gain.value = 0.6; sfxBus.connect(master);
      // reverb: generated decaying-noise impulse
      var conv = ctx.createConvolver(), n = Math.floor(ctx.sampleRate * 2.2), ir = ctx.createBuffer(2, n, ctx.sampleRate);
      for (var c = 0; c < 2; c++) {
        var d = ir.getChannelData(c);
        for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.6);
      }
      conv.buffer = ir;
      revIn = ctx.createGain(); revIn.connect(conv);
      var rg = ctx.createGain(); rg.gain.value = 0.55; conv.connect(rg); rg.connect(musBus);
      // feedback delay
      var dl = ctx.createDelay(1), fb = ctx.createGain(), lp = ctx.createBiquadFilter();
      dl.delayTime.value = 0.34; fb.gain.value = 0.34; lp.type = 'lowpass'; lp.frequency.value = 2200;
      dlyIn = ctx.createGain(); dlyIn.connect(dl); dl.connect(lp); lp.connect(fb); fb.connect(dl); lp.connect(musBus);
      // 2s noise
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      var nd = noiseBuf.getChannelData(0);
      for (var j = 0; j < nd.length; j++) nd[j] = Math.random() * 2 - 1;
      // 25% pulse wave (cosine series)
      var re = new Float32Array(33), im = new Float32Array(33);
      for (var k = 1; k < 33; k++) re[k] = 2 / (k * Math.PI) * Math.sin(k * Math.PI * 0.25);
      pulseW = ctx.createPeriodicWave(re, im);
    } catch (e) { ctx = null; AC = null; return false; }
    return true;
  }

  function unlock() {
    if (!ensure()) return;
    try { if (ctx.state === 'suspended') ctx.resume(); } catch (e) {}
    if (pend && !curId) { var p = pend; pend = null; Music.play(p.id, p.o); }
  }
  ['pointerdown', 'mousedown', 'keydown', 'touchstart'].forEach(function (ev) {
    document.addEventListener(ev, unlock, { passive: true });
  });
  document.addEventListener('visibilitychange', function () {
    if (!ctx) return;
    try { document.hidden ? ctx.suspend() : ctx.resume(); } catch (e) {}
  });

  /* ------------------------------------------------------------- helpers */
  var NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function nm(s) {
    var m = /^([A-G])([#b]?)(-?\d)$/.exec(s);
    return (+m[3] + 1) * 12 + NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  }
  function tm(x) { return /^m\d+$/.test(x) ? +x.slice(1) : nm(x); }
  function hz(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function R(s, n) { return new Array(n + 1).join(s + ' '); }       // repeat with spaces
  function rep(s, n) { return new Array(n + 1).join(s); }           // repeat raw (drums)

  // pattern string -> {len, by:{pos:[{d,n:[midi]}]}}
  function parse(s) {
    var by = {}, pos = 0;
    s.replace(/\|/g, ' ').trim().split(/\s+/).forEach(function (tk) {
      if (!tk) return;
      var p = tk.split(':'), d = p[1] ? +p[1] : 1;
      if (p[0] !== 'r' && p[0] !== '.') (by[pos] = by[pos] || []).push({ d: d, n: p[0].split('+').map(tm) });
      pos += d;
    });
    return { len: pos, by: by };
  }

  // chord string "D3-A3-D4 B2-F#3-B3" (one chord per bar) -> arpeggio; shape digits index chord tones
  function ARP(c, shape) {
    return c.split(' ').map(function (ch) {
      var n = ch.split('-').map(nm);
      return shape.split('').map(function (x) {
        if (x === '.') return 'r';
        var i = +x; return 'm' + (n[i % n.length] + 12 * Math.floor(i / n.length));
      }).join(' ');
    }).join(' ');
  }
  function PAD(c, len) { return c.split(' ').map(function (ch) { return ch.replace(/-/g, '+') + ':' + len; }).join(' '); }
  // roots "D2 B1" + shape chars: 1 root, 5 fifth, 8 octave, . rest, - hold
  function BASS(roots, shape) {
    return roots.split(' ').map(function (x) {
      var m = nm(x), out = [], last = null;
      shape.split('').forEach(function (c) {
        if (c === '-' && last) { last.d++; return; }
        last = { d: 1, m: c === '.' ? null : m + (c === '5' ? 7 : c === '8' ? 12 : 0) };
        out.push(last);
      });
      return out.map(function (o) { return (o.m === null ? 'r' : 'm' + o.m) + ':' + o.d; }).join(' ');
    }).join(' ');
  }
  function V(i, v, p, o) { o = o || {}; o.i = i; o.v = v; o.p = p; return o; }   // melodic voice
  function DR(s, v, o) { o = o || {}; o.dr = s; o.v = v; return o; }              // drum voice

  /* ----------------------------------------------------------- instruments */
  function env(g, t, dur, a, d, s, r, pk) {
    var p = g.gain;
    p.setValueAtTime(0.0001, t);
    p.linearRampToValueAtTime(pk, t + a);
    p.setTargetAtTime(Math.max(pk * s, 0.0001), t + a, d / 3);
    p.setTargetAtTime(0.0001, t + dur, r / 3);
  }
  function osc(type, f, t, end, out) {
    var o = ctx.createOscillator();
    if (type === 'pulse') o.setPeriodicWave(pulseW); else o.type = type;
    o.frequency.setValueAtTime(f, t); o.connect(out); o.start(t); o.stop(end);
    return o;
  }
  function filt(type, f, q, out) {
    var b = ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; if (q) b.Q.value = q; b.connect(out); return b;
  }
  function gn(v, out) { var g = ctx.createGain(); g.gain.value = v; g.connect(out); return g; }

  function note(inst, m, t, dur, out, pk) {
    var f = hz(m), g = ctx.createGain(), end, fl, o;
    g.connect(out);
    switch (inst) {
      case 'pluck': // gayageum-like: bright pluck, quick pitch settle, darkening filter
        dur = Math.min(Math.max(dur * 1.8, 0.5), 2.2); end = t + dur + 0.4;
        fl = filt('lowpass', 4200, 1.5, g);
        fl.frequency.setValueAtTime(4200, t); fl.frequency.exponentialRampToValueAtTime(700, t + 0.35);
        env(g, t, dur, 0.003, 0.28, 0.03, 0.25, pk);
        o = osc('triangle', f * 1.015, t, end, fl); o.frequency.exponentialRampToValueAtTime(f, t + 0.05);
        osc('sawtooth', f * 1.004, t, end, gn(0.25, fl));
        break;
      case 'sq': case 'pulse':
        end = t + dur + 0.2; env(g, t, dur, 0.01, 0.08, 0.65, 0.07, pk);
        osc(inst === 'sq' ? 'square' : 'pulse', f, t, end, filt('lowpass', 3000, 0.5, g));
        break;
      case 'tri':
        end = t + dur + 0.2; env(g, t, dur, 0.008, 0.05, 0.85, 0.06, pk);
        osc('triangle', f, t, end, g);
        break;
      case 'pad':
        end = t + dur + 1.4; env(g, t, dur, Math.min(0.7, dur * 0.45), 0.3, 1, 0.7, pk);
        fl = filt('lowpass', 1100, 0.4, g);
        osc('sawtooth', f * 1.0035, t, end, gn(0.5, fl)); osc('sawtooth', f * 0.9965, t, end, gn(0.5, fl));
        break;
      case 'flute':
        end = t + dur + 0.4; env(g, t, dur, 0.07, 0.1, 0.8, 0.14, pk);
        o = osc('sine', f, t, end, g); osc('triangle', f, t, end, gn(0.25, g));
        var vib = ctx.createGain();   // vibrato fades in
        vib.gain.setValueAtTime(0, t); vib.gain.linearRampToValueAtTime(f * 0.007, t + 0.35); vib.connect(o.frequency);
        osc('sine', 5.2, t, end, vib);
        break;
      case 'bell':
        dur = 1.6; end = t + dur + 0.6; env(g, t, dur, 0.002, 0.5, 0.0001, 0.4, pk);
        osc('sine', f, t, end, g); osc('sine', f * 2.76, t, end, gn(0.3, g)); osc('sine', f * 5.4, t, end, gn(0.1, g));
        break;
    }
  }

  function nsrc(t, dur, out) {
    var s = ctx.createBufferSource(); s.buffer = noiseBuf; s.connect(out); s.start(t, Math.random() * 1.5, dur + 0.05);
  }
  function burst(t, dur, ft, f, q, v, out) {   // filtered noise burst with exp decay
    var g = ctx.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g.connect(out); nsrc(t, dur, filt(ft, f, q, g));
  }
  function tn(f, d, type, v, slide, t, out) {  // simple decaying tone with optional pitch slide
    var g = ctx.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    g.connect(out);
    var o = osc(type, f, t, t + d + 0.05, g);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + d);
  }
  function drum(ch, t, out) {
    switch (ch) {
      case 'k': tn(140, 0.16, 'sine', 1, 45, t, out); break;
      case 's': burst(t, 0.13, 'bandpass', 1800, 0.8, 0.7, out); tn(190, 0.07, 'triangle', 0.4, 120, t, out); break;
      case 'h': burst(t, 0.04, 'highpass', 7000, 0, 0.45, out); break;
      case 'H': burst(t, 0.16, 'highpass', 6500, 0, 0.4, out); break;
      case 't': tn(200, 0.2, 'sine', 0.9, 100, t, out); break;
      case 'w': tn(1000, 0.05, 'sine', 0.7, 780, t, out); tn(1700, 0.03, 'sine', 0.3, 0, t, out); break;
      case 'c': burst(t, 1.1, 'highpass', 5000, 0, 0.5, out); break;
      case 'r': burst(t + Math.random() * 0.05, 0.02, 'highpass', 5500, 0, 0.15 + Math.random() * 0.25, out); break;
      case 'n':   // slow noise swell (waves / timpani-roll feel)
        var g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.7, t + 1.3); g.gain.linearRampToValueAtTime(0.0001, t + 2.8); g.connect(out);
        var b = filt('bandpass', 450, 0.7, g); b.frequency.linearRampToValueAtTime(900, t + 1.3);
        nsrc(t, 2.8, b); break;
    }
  }

  /* ----------------------------------------------------------------- music */
  var T = {};   // track definitions
  function track(id, bpm, div, vs, o) { o = o || {}; o.bpm = bpm; o.div = div; o.vs = vs; T[id] = o; }

  var D4 = '01232123', ARIMEL =
    'D5:1 E5:1 D5:1 E5:1 G5:2 A5:2 G5:2 A5:2 B5:4 A5:2 G5:2 E5:2 D5:2 ' +
    'D5:1 E5:1 D5:1 E5:1 G5:2 A5:2 B5:2 D6:2 B5:2 A5:2 G5:2 E5:2 D5:2 G5:2';   // 본조아리랑, 8 bars of 3/4 (G major)
  var ARICH = 'G3-D4-G4 C3-G3-C4 E3-B3-E4 D3-A3-D4 G3-D4-G4 A3-E4-A4 G3-D4-G4 D3-A3-D4';
  var ARIRT = 'G2 C2 E2 D2 G2 A2 G2 D2';

  // title — mysterious but warm, D pentatonic (D E F# A B), 16 bars
  (function () {
    var A = 'F#5:3 E5 D5:2 r:2 E5:2 F#5:2 A5:4 B5:3 A5 F#5:2 E5:2 D5:6 r:2';
    var B = 'A5:2 B5:2 A5:2 F#5:2 E5:3 F#5 A5:4 F#5:2 E5:2 D5:2 E5:2 D5:8';
    var C = 'B5:3 A5 F#5:2 A5:2 B5:2 D6:2 B5:2 A5:2 F#5:3 E5 D5:2 E5:2 D5:8';
    var ch = 'D3-A3-D4-F#4 B2-F#3-B3-D4 G2-D3-G3-B3 A2-E3-A3-C#4';
    track('title', 78, 2, [
      V('flute', 0.17, A + ' ' + B + ' ' + A + ' ' + C, { w: 0.5, d: 0.25 }),
      V('pluck', 0.13, ARP(ch, D4), { w: 0.4 }),
      V('pad', 0.1, PAD(ch, 8), { w: 0.6 }),
      V('tri', 0.3, BASS('D2 B1 G1 A1', '1...5...')),
      DR('..h...h.', 0.12)
    ]);
  })();

  // intro — archive at night, sparse bells over a drone, A minor pentatonic, 8 bars
  (function () {
    var ch = 'A3-E4-A4-C5 G3-D4-G4-B4 C3-G3-C4-E4 E3-B3-E4-G4';
    track('intro', 60, 2, [
      V('bell', 0.2, 'E5:4 r:2 A5:2 G5:4 E5:2 D5:2 C5:3 D5 E5:4 r:4 A5:4 G5:2 E5:2 D5:2 C5:2 A4:8 r:4 E5:2 A5:2 G5:4 r:4', { w: 0.8, d: 0.35 }),
      V('pad', 0.11, PAD(ch, 8), { w: 0.7 }),
      V('pluck', 0.09, ARP(ch, '0.1.2.3.'), { w: 0.6, d: 0.2 }),
      V('tri', 0.28, BASS('A1 G1 C2 E1', '1-------'))
    ]);
  })();

  // act1 — 1880s, gayageum pluck, 12/8 semachi feel, G pentatonic, 16 bars
  (function () {
    var A = 'D5:3 E5:3 G5:3 E5:3 D5:6 B4:3 A4:3 G4:3 A4:3 B4:3 D5:3 E5:9 r:3 ' +
            'G5:3 E5:3 D5:3 E5:3 G5:3 A5:3 B5:6 A5:3 G5:3 E5:3 D5:3 G4:12';
    var B = 'B4:3 D5:3 E5:6 G5:6 E5:3 D5:3 E5:3 D5:3 B4:3 A4:3 D5:9 r:3 ' +
            'B4:3 D5:3 E5:3 G5:3 A5:6 G5:6 E5:3 G5:3 E5:3 D5:3 G4:12';
    var ch = 'G3-D4-G4 E3-B3-E4 D3-A3-D4 E3-B3-E4';
    track('act1', 64, 3, [
      V('pluck', 0.2, A + ' ' + B, { w: 0.35 }),
      V('flute', 0.1, 'r:96 ' + B, { w: 0.5 }),
      V('pluck', 0.1, ARP(ch, '0.1.2.1.2.1.'), { w: 0.3, o: 0 }),
      V('pad', 0.06, PAD(ch, 12), { w: 0.5 }),
      V('tri', 0.28, BASS('G2 E2 D2 E2', '1.....5.....')),
      DR('k..w.ww..w.w', 0.35)
    ]);
  })();

  // act2 — busy and hopeful, C pentatonic, 16 bars
  (function () {
    var A = 'E5:2 G5:2 A5:2 G5:2 E5:2 D5:2 C5:4 D5:2 E5:2 G5:2 E5:2 D5:2 C5:2 D5:4';
    var B = 'G5:2 A5:2 C6:2 A5:2 G5:2 E5:2 G5:4 A5:2 G5:2 E5:2 D5:2 C5:8';
    var B2 = 'G5:2 A5:2 C6:2 D6:2 E6:4 C6:4 A5:2 G5:2 E5:2 D5:2 C5:8';
    var ch = 'C3-G3-C4-E4 A2-E3-A3-C4 F2-C3-F3-A3 G2-D3-G3-B3';
    track('act2', 112, 2, [
      V('pulse', 0.15, A + ' ' + B + ' ' + A + ' ' + B2, { w: 0.25, d: 0.15 }),
      V('pluck', 0.1, ARP(ch, '01231232'), { w: 0.3 }),
      V('pad', 0.06, PAD(ch, 8), { w: 0.4 }),
      V('tri', 0.3, BASS('C2 A1 F1 G1', '1.1.5.8.')),
      DR('k.h.s.h.k.h.s.h.k.h.s.h.k.s.ksks', 0.3)
    ]);
  })();

  // act3 — tense, sparse, A minor pentatonic, 8 bars
  (function () {
    var ch = 'A3-E4-A4-C5 F3-C4-F4-A4 G3-D4-G4-B4 E3-B3-E4-G4';
    track('act3', 72, 2, [
      V('pulse', 0.13, 'A4:4 r:2 C5:2 E5:3 D5 C5:4 A4:6 G4:2 E4:8 r:2 A4:2 C5:2 E5:2 G5:3 E5 D5:4 C5:4 D5:2 C5:2 A4:8', { w: 0.5, d: 0.3 }),
      V('pad', 0.09, PAD(ch, 8), { w: 0.6 }),
      V('pluck', 0.08, ARP(ch, '0.1.2.1.'), { w: 0.5, d: 0.2 }),
      V('tri', 0.3, BASS('A1 F1 G1 E1', '1...1.5.')),
      DR('k.......k.....w.k.......k...h.w.', 0.28)
    ]);
  })();

  // stealth — very sparse, heartbeat bass, hint of b2 (E phrygian-ish), 8 bars
  (function () {
    var ch = 'E3-B3-E4 E3-A3-E4 F3-B3-F4 E3-B3-E4';
    track('stealth', 66, 2, [
      V('pulse', 0.1, 'E4:3 r:5 F4:1 E4:1 r:6 G4:3 r:1 A4:2 r:2 B4:6 r:2 E4:3 r:5 D4:2 E4:2 r:4 F4:2 E4:2 D4:2 E4:2 E4:8', { w: 0.6, d: 0.4 }),
      V('pad', 0.08, PAD(ch, 8), { w: 0.7 }),
      V('tri', 0.34, BASS('E1 E1 F1 E1', '1.1.....')),
      V('bell', 0.1, 'r:26 F6:1 r:1 B6:1 r:3', { w: 0.8, d: 0.4 }),
      DR('..w...w.h.....w.', 0.18)
    ]);
  })();

  // vn_warm — gentle conversation, F pentatonic, 8 bars
  (function () {
    var ch = 'F3-A3-C4-F4 D3-A3-D4-F4 Bb2-F3-Bb3-D4 C3-G3-C4-E4';
    track('vn_warm', 76, 2, [
      V('flute', 0.15, 'C5:4 A4:2 C5:2 D5:4 C5:2 A4:2 G4:4 A4:2 C5:2 F4:8 A4:2 C5:2 D5:2 F5:2 F5:4 D5:2 C5:2 D5:2 C5:2 A4:4 F4:8', { w: 0.5, d: 0.2 }),
      V('pluck', 0.1, ARP(ch, D4), { w: 0.4 }),
      V('pad', 0.08, PAD(ch, 8), { w: 0.6 }),
      V('tri', 0.28, BASS('F2 D2 Bb1 C2', '1...5...')),
      V('bell', 0.07, 'r:10 C6:2 r:12 A5:2 r:6', { w: 0.7, d: 0.3 })
    ]);
  })();

  // vn_sad — slow, D minor pentatonic, 8 bars
  (function () {
    var ch = 'D3-F3-A3-D4 G3-Bb3-D4-G4 Bb2-F3-Bb3-D4 A2-E3-A3-C#4';
    track('vn_sad', 56, 2, [
      V('flute', 0.15, 'A4:4 C5:2 D5:2 C5:6 A4:2 G4:4 A4:2 C5:2 A4:8 D5:4 C5:2 A4:2 G4:4 F4:4 G4:2 A4:2 C5:2 A4:2 D4:8', { w: 0.7, d: 0.3 }),
      V('pad', 0.1, PAD(ch, 8), { w: 0.7 }),
      V('pluck', 0.08, ARP(ch, '0..1..2.'), { w: 0.6 }),
      V('tri', 0.26, BASS('D2 G1 Bb1 A1', '1-------'))
    ]);
  })();

  // vn_tense — surgery, D minor with b2/b5 colour, pulsing, 8 bars
  (function () {
    var ch = 'D3-A3-D4 D3-G3-Bb3 Bb2-F3-A3 A2-E3-A3';
    track('vn_tense', 100, 2, [
      V('pulse', 0.12, 'A4:2 r:2 Bb4:2 A4:2 G4:2 r:2 F4:2 E4:2 A4:2 r:2 Bb4:2 C5:2 D5:4 C#5:2 A4:2 A4:2 r:2 Bb4:2 A4:2 G4:2 F4:2 E4:2 D4:2 F4:2 A4:2 D5:2 C5:2 Bb4:2 G4:2 A4:4', { w: 0.35, d: 0.2 }),
      V('pad', 0.08, PAD(ch, 8), { w: 0.5 }),
      V('tri', 0.3, BASS('D2 D2 Bb1 A1', '11.11.1.')),
      DR('k.hhk.hhk.hhk.hhk.hhk.hhkkhskhss', 0.25)
    ]);
  })();

  // cut_fire — urgent, A minor pentatonic, driving, 8 bars
  (function () {
    var ch = 'A3-C4-E4-A4 A3-C4-E4-A4 F3-A3-C4-F4 G3-B3-D4-G4';
    track('cut_fire', 132, 2, [
      V('pulse', 0.15, 'A4:1 C5:1 E5:2 A5:2 G5:1 E5:1 A4:1 C5:1 E5:2 G5:2 A5:2 C6:2 A5:2 G5:2 E5:2 D5:4 E5:4 A4:1 C5:1 E5:2 A5:2 G5:1 E5:1 C6:2 D6:2 E6:4 D6:2 C6:2 A5:2 G5:2 A5:8', { w: 0.25 }),
      V('sq', 0.07, ARP(ch, '01230123')),
      V('pad', 0.07, PAD('A3-E4-A4 A3-E4-A4 F3-C4-F4 G3-D4-G4', 8), { w: 0.4 }),
      V('tri', 0.32, BASS('A1 A1 F1 G1', '1.1.5.1.')),
      DR('k.hsk.hsk.hsk.hsk.hsk.hskkhsksss', 0.35),
      DR('r.r..r.r', 0.5)
    ]);
  })();

  // cut_sea — 12/8 rolling waves, D major pentatonic, 8 bars
  (function () {
    var ch = 'D3-A3-D4-F#4 B2-F#3-B3-D4 G2-D3-G3-B3 A2-E3-A3-C#4';
    track('cut_sea', 56, 3, [
      V('flute', 0.16, 'F#5:3 A5:3 B5:6 A5:3 F#5:3 E5:6 D5:3 E5:3 F#5:3 A5:3 B5:9 r:3 A5:3 B5:3 D6:3 B5:3 A5:6 F#5:6 E5:3 F#5:3 E5:3 D5:3 D5:12', { w: 0.6, d: 0.25 }),
      V('pluck', 0.1, ARP(ch, '012321012321'), { w: 0.5 }),
      V('pad', 0.1, PAD(ch, 12), { w: 0.7 }),
      V('tri', 0.26, BASS('D2 B1 G1 A1', '1.....5.....')),
      DR('n' + rep('.', 11) + 'n' + rep('.', 11), 0.25)
    ]);
  })();

  // cut_dawn — hopeful rise, G pentatonic, 8 bars
  (function () {
    var ch = 'G3-D4-G4 E3-B3-E4 C3-G3-D4 D3-A3-D4';
    track('cut_dawn', 70, 2, [
      V('flute', 0.16, 'D5:4 G5:4 B5:6 A5:2 G5:4 E5:4 D5:8 E5:2 G5:2 A5:2 B5:2 D6:6 B5:2 A5:4 G5:2 E5:2 G5:8', { w: 0.6, d: 0.25 }),
      V('pluck', 0.11, ARP(ch, '0.1.2.1.'), { w: 0.4 }),
      V('pad', 0.09, PAD(ch, 8), { w: 0.6 }),
      V('tri', 0.28, BASS('G2 E2 C2 D2', '1...5...')),
      V('bell', 0.09, 'r:14 D6:2 r:12 B5:2 r:2', { w: 0.8, d: 0.3 }),
      DR('k.......k...w...k.......k...h...', 0.15)
    ]);
  })();

  // cut_build — construction, rhythmic hammering, C pentatonic, 8 bars
  (function () {
    var ch = 'C3-G3-C4-E4 A2-E3-A3-C4 F2-C3-F3-A3 G2-D3-G3-B3';
    track('cut_build', 104, 2, [
      V('pulse', 0.14, 'C5:2 C5:2 E5:2 G5:2 A5:2 G5:2 E5:4 C5:2 C5:2 E5:2 G5:2 A5:2 C6:2 D6:4 E6:2 D6:2 C6:2 A5:2 G5:2 A5:2 G5:4 E5:2 G5:2 A5:2 C6:2 C6:8', { w: 0.25, d: 0.12 }),
      V('pluck', 0.1, ARP(ch, '01231232'), { w: 0.3 }),
      V('pad', 0.06, PAD(ch, 8), { w: 0.4 }),
      V('tri', 0.3, BASS('C2 A1 F1 G1', '1.5.1.5.')),
      V('bell', 0.07, 'r:2 C7:1 r:5', { w: 0.3 }),
      DR('khshkhsh', 0.28),
      DR('w.w.w.w.', 0.2)
    ]);
  })();

  // cut_rain — sparse, D minor pentatonic, falling rain ticks, 8 bars
  (function () {
    var ch = 'D3-A3-D4 G3-D4-G4 F3-C4-F4 A2-E3-A3';
    track('cut_rain', 60, 2, [
      V('pluck', 0.2, 'A4:3 r:1 C5:2 D5:2 C5:4 A4:4 G4:3 r:1 A4:2 C5:2 D5:8 F5:3 r:1 D5:2 C5:2 A4:6 G4:2 F4:4 G4:2 A4:2 D4:8', { w: 0.8, d: 0.35 }),
      V('pad', 0.09, PAD(ch, 8), { w: 0.7 }),
      V('bell', 0.1, 'r:5 D6:1 r:9 A5:1 r:6 G6:1 r:9', { w: 0.9, d: 0.4 }),
      V('tri', 0.22, BASS('D2 G1 F1 A1', '1-------')),
      DR('rr.r.rr.r..rr.r.', 0.35)
    ]);
  })();

  // cut_liberation — 본조아리랑 slow swell, 3/4, 16 bars (pass 1 low & soft, pass 2 full)
  track('cut_liberation', 62, 2, [
    V('pad', 0.1, PAD(ARICH + ' ' + ARICH, 6), { w: 0.7 }),
    V('flute', 0.15, ARIMEL + ' r:48', { o: -12, w: 0.7, d: 0.2 }),
    V('flute', 0.16, 'r:48 ' + ARIMEL, { w: 0.6, d: 0.25 }),
    V('pluck', 0.1, 'r:48 ' + ARP(ARICH, '0.1.2.'), { w: 0.5 }),
    V('tri', 0.26, 'r:48 ' + BASS(ARIRT, '1-----')),
    V('bell', 0.09, 'r:42 D6:2 r:46 G6:6', { w: 0.9, d: 0.3 }),
    DR('n' + rep('.', 47) + rep('k.....', 8), 0.3)
  ]);

  // ending — full warm 본조아리랑 arrangement, 3/4, 24 bars (3 passes)
  track('ending', 84, 2, [
    V('pluck', 0.2, ARIMEL + ' r:48 ' + ARIMEL, { w: 0.4, d: 0.12 }),
    V('flute', 0.15, 'r:48 ' + ARIMEL + ' ' + ARIMEL, { w: 0.5, d: 0.2 }),
    V('pulse', 0.06, 'r:96 ' + ARIMEL, { o: 12, w: 0.4, d: 0.2 }),
    V('pluck', 0.1, ARP(ARICH, '0.1.2.'), { w: 0.4 }),
    V('pad', 0.08, PAD(ARICH, 6), { w: 0.6 }),
    V('tri', 0.26, 'r:48 ' + R(BASS(ARIRT, '1.5.8.'), 2)),
    V('bell', 0.09, 'r:30 D6:2 r:30 G6:2 r:30 B5:2 r:42 G6:6', { w: 0.9, d: 0.3 }),
    DR(rep('.', 96) + 'c.hw.h' + rep('k.hw.h', 7), 0.3)
  ]);

  // epilogue — calm close, G pentatonic with an Arirang echo, 8 bars
  (function () {
    var ch = 'G3-D4-G4 E3-B3-E4 C3-G3-D4 G3-D4-G4';
    track('epilogue', 64, 2, [
      V('bell', 0.14, 'G5:4 D5:2 E5:2 G5:4 A5:4 B5:6 A5:2 G5:8 E5:4 G5:2 A5:2 B5:4 D6:4 B5:2 A5:2 G5:2 E5:2 G5:8', { w: 0.9, d: 0.35 }),
      V('flute', 0.1, 'r:8 G5:4 D5:2 E5:2 G5:4 A5:4 B5:6 A5:2 G5:8 r:24', { w: 0.7, d: 0.3 }),
      V('pad', 0.1, PAD(ch, 8), { w: 0.7 }),
      V('pluck', 0.08, ARP(ch, '0.1.2.1.'), { w: 0.6 }),
      V('tri', 0.24, BASS('G2 E2 C2 G2', '1-------'))
    ]);
  })();

  /* ----------------------------------------------------- music scheduler */
  var LOOK = 0.2, active = [], timer = null, curId = null, cur = null, pend = null;

  function mkTrack(id) {
    var d = T[id], g = ctx.createGain(); g.gain.value = 0; g.connect(musBus);
    var tr = { id: id, g: g, sd: 60 / (d.bpm * d.div), step: 0, next: ctx.currentTime + 0.08, dead: false, vs: [] };
    d.vs.forEach(function (v) {
      var n = gn(v.v, g);
      if (v.w) n.connect(gn(v.w, revIn));
      if (v.d) n.connect(gn(v.d, dlyIn));
      if (v.dr) tr.vs.push({ v: v, n: n, len: v.dr.length });
      else { if (!v.P) v.P = parse(v.p); tr.vs.push({ v: v, n: n, len: v.P.len, by: v.P.by }); }
    });
    return tr;
  }

  function sched(tr, s, t) {
    tr.vs.forEach(function (x) {
      var pos = s % x.len;
      if (x.v.dr) { var ch = x.v.dr.charAt(pos); if (ch !== '.') drum(ch, t, x.n); return; }
      var es = x.by[pos]; if (!es) return;
      var o = x.v.o || 0;
      es.forEach(function (e) {
        var pk = 1 / Math.sqrt(e.n.length);
        e.n.forEach(function (m) { note(x.v.i, m + o, t, e.d * tr.sd, x.n, pk); });
      });
    });
  }

  function tick() {
    if (!ctx) return;
    var now = ctx.currentTime;
    active = active.filter(function (tr) { return !tr.dead; });
    if (!active.length) { clearInterval(timer); timer = null; return; }
    active.forEach(function (tr) {
      if (tr.next < now - 0.3) tr.next = now + 0.05;   // tab was throttled: skip ahead
      while (tr.next < now + LOOK) {
        try { sched(tr, tr.step, tr.next); } catch (e) {}
        tr.step++; tr.next += tr.sd;
      }
    });
  }

  function fadeOut(tr, f) {
    var now = ctx.currentTime, p = tr.g.gain;
    p.cancelScheduledValues(now); p.setValueAtTime(p.value, now); p.linearRampToValueAtTime(0, now + Math.max(f, 0.02));
    setTimeout(function () { tr.dead = true; }, f * 1000 + 60);
    setTimeout(function () { try { tr.g.disconnect(); } catch (e) {} }, f * 1000 + 3500);   // let reverb tails ring out
  }

  var Music = {
    ids: Object.keys(T),
    get current() { return curId; },
    play: function (id, o) {
      try {
        o = o || {}; var f = o.fade == null ? 1 : o.fade;
        if (!T[id] || id === curId) return;
        if (!ctx) { pend = { id: id, o: o }; return; }   // wait for a user gesture
        var old = cur, tr = mkTrack(id), now = ctx.currentTime;
        cur = tr; curId = id; active.push(tr);
        tr.g.gain.setValueAtTime(0.0001, now); tr.g.gain.linearRampToValueAtTime(T[id].lv || 1, now + Math.max(f, 0.02));
        if (old) fadeOut(old, f);
        if (!timer) timer = setInterval(tick, 30);
        tick();
      } catch (e) {}
    },
    stop: function (o) {
      try {
        pend = null; curId = null;
        if (cur && ctx) { fadeOut(cur, o && o.fade != null ? o.fade : 1); }
        cur = null;
      } catch (e) {}
    },
    duck: function (on) {
      try { if (ctx) duckG.gain.setTargetAtTime(on ? 0.3 : 1, ctx.currentTime, 0.12); } catch (e) {}
    }
  };

  /* ------------------------------------------------------------------ sfx */
  var S = {
    blip: function (t, o) { tn(880, 0.05, 'square', 0.15, 0, t, o); },
    select: function (t, o) { tn(660, 0.06, 'square', 0.14, 0, t, o); tn(990, 0.07, 'square', 0.14, 0, t + 0.05, o); },
    confirm: function (t, o) { [523, 659, 784].forEach(function (f, i) { tn(f, 0.1, 'square', 0.14, 0, t + i * 0.06, o); }); },
    pick: function (t, o) { tn(880, 0.12, 'square', 0.14, 1320, t, o); tn(1320, 0.14, 'triangle', 0.18, 0, t + 0.1, o); },
    quest: function (t, o) { [523, 659, 784, 1047].forEach(function (f, i) { tn(f, i === 3 ? 0.5 : 0.12, 'square', 0.13, 0, t + i * 0.11, o); tn(f / 2, i === 3 ? 0.5 : 0.12, 'triangle', 0.15, 0, t + i * 0.11, o); }); },
    ok: function (t, o) { tn(660, 0.08, 'triangle', 0.22, 0, t, o); tn(880, 0.16, 'triangle', 0.22, 0, t + 0.08, o); },
    bad: function (t, o) { tn(220, 0.22, 'sawtooth', 0.15, 110, t, o); tn(165, 0.28, 'square', 0.12, 80, t + 0.1, o); },
    bump: function (t, o) { tn(110, 0.09, 'square', 0.2, 70, t, o); burst(t, 0.06, 'lowpass', 500, 0, 0.3, o); },
    step: function (t, o) { burst(t, 0.04, 'lowpass', 500 + Math.random() * 500, 0, 0.12, o); },
    door: function (t, o) { tn(140, 0.08, 'sine', 0.5, 90, t, o); tn(140, 0.08, 'sine', 0.5, 90, t + 0.13, o); burst(t + 0.25, 0.4, 'bandpass', 700, 2, 0.18, o); },
    page: function (t, o) { burst(t, 0.14, 'highpass', 3000, 0, 0.18, o); burst(t + 0.05, 0.1, 'highpass', 4500, 0, 0.12, o); },
    heart: function (t, o) { tn(80, 0.13, 'sine', 0.6, 50, t, o); tn(70, 0.16, 'sine', 0.5, 45, t + 0.17, o); },
    thunder: function (t, o) { burst(t, 2.2, 'lowpass', 320, 0.5, 0.7, o); tn(55, 1.8, 'sine', 0.5, 30, t, o); burst(t + 0.35, 1.4, 'lowpass', 200, 0, 0.4, o); },
    alarm: function (t, o) { for (var i = 0; i < 6; i++) tn(i % 2 ? 660 : 880, 0.13, 'square', 0.13, 0, t + i * 0.15, o); },
    bell: function (t, o) { tn(1318, 1.3, 'sine', 0.22, 0, t, o); tn(1318 * 2.76, 0.8, 'sine', 0.07, 0, t, o); tn(659, 1.5, 'sine', 0.12, 0, t, o); }
  };
  var Sfx = {
    names: Object.keys(S),
    play: function (name) {
      try {
        if (!S[name] || !ensure()) return;
        unlock();
        S[name](ctx.currentTime + 0.01, sfxBus);
      } catch (e) {}
    }
  };

  /* ---------------------------------------------------------------- voice */
  var vAud = null, vMiss = 0, vHit = false; // no voice pack shipped: stop asking after 3 misses (no 404 per line)
  var Voice = {
    play: function (id) {
      Voice.stop();
      if (!vHit && vMiss >= 3) return Promise.resolve();
      return new Promise(function (res) {
        var done = false, a;
        function fin() { if (done) return; done = true; if (vAud === a) vAud = null; Music.duck(false); res(); }
        try {
          a = new Audio('audio/voice/' + encodeURIComponent(id) + '.mp3');
          vAud = a; a.muted = muted;
          a.addEventListener('ended', fin); a.addEventListener('error', function () { vMiss++; fin(); });
          a.addEventListener('playing', function () { vHit = true; Music.duck(true); });
          var p = a.play(); if (p && p.catch) p.catch(fin);
        } catch (e) { fin(); }
      });
    },
    stop: function () {
      var a = vAud; vAud = null;
      if (a) { try { a.pause(); a.dispatchEvent(new Event('ended')); } catch (e) {} }
    }
  };

  /* ----------------------------------------------------------- global mute */
  var AudioCtl = {
    get muted() { return muted; },
    setMuted: function (b) {
      muted = !!b;
      try { localStorage.setItem('yh_muted', muted ? '1' : '0'); } catch (e) {}
      try { if (ctx) master.gain.setTargetAtTime(muted ? 0 : 0.8, ctx.currentTime, 0.03); } catch (e) {}
      if (vAud) vAud.muted = muted;
    },
    toggle: function () { AudioCtl.setMuted(!muted); return muted; }
  };

  window.Music = Music; window.Sfx = Sfx; window.Voice = Voice; window.AudioCtl = AudioCtl;
})();
