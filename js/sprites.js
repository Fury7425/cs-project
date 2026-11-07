/* Sprites: 16x24 hand-authored character templates + 16x16 map items.
   Grids are strings, one letter per pixel ('.' = transparent).
   Row rules: 16 chars = exact; shorter = centered; leading '|' = left-aligned, right-padded.
   Characters are built from head + torso + legs templates for 3 views (d=down, u=up, l=left; right = mirror of left),
   then recoloured through a per-look palette and decorated with overlays (hats, beards, props...). */
(function () {
  'use strict';

  var r = function (ch, n) { return new Array(n + 1).join(ch); };
  var warnings = [];

  /* ---------- colour helpers ---------- */
  function rgb(h) { return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)]; }
  function hex(a) { return '#' + a.map(function (v) { v = Math.max(0, Math.min(255, Math.round(v))); return (v < 16 ? '0' : '') + v.toString(16); }).join(''); }
  function shade(h, f) { return hex(rgb(h).map(function (v) { return v * f; })); }
  function light(h, f) { return hex(rgb(h).map(function (v) { return v + (255 - v) * f; })); }

  /* ---------- grid helpers ---------- */
  function norm(s) {
    if (s.charAt(0) === '|') return (s.slice(1) + r('.', 16)).slice(0, 16);
    if (s.length > 16) { warnings.push('too long: ' + s); return s.slice(0, 16); }
    var n = 16 - s.length, l = n >> 1;
    if (n & 1) warnings.push('odd width: ' + s);
    return r('.', l) + s + r('.', n - l);
  }
  function rev(s) { return s.split('').reverse().join(''); }
  function all(rows) { return { d: rows, u: rows, l: rows }; }

  /* ---------- heads (10 rows). h/H hair, s/S skin, e eye, o outline ---------- */
  var HEAD = {
    short: {
      d: ['oooooooo', 'o' + r('h', 8) + 'o', 'o' + 'hhHhhhhhhh' + 'o', 'o' + r('h', 10) + 'o',
        'oh' + r('s', 8) + 'ho', 'o' + 'ssessssess' + 'o', 'o' + r('s', 10) + 'o', 'o' + r('s', 7) + 'So',
        'o' + r('s', 5) + 'So', r('o', 6)],
      u: ['oooooooo', 'o' + r('h', 8) + 'o', 'o' + 'hhhhHHhhhh' + 'o', 'o' + r('h', 10) + 'o', 'o' + r('h', 10) + 'o',
        'o' + r('h', 10) + 'o', 'o' + r('h', 10) + 'o', 'o' + r('h', 8) + 'o', 'o' + r('S', 6) + 'o', r('o', 6)],
      l: ['....oooooooo....', '...ohhhhhhhho...', '..ohhhHhhhhhho..', '..ohhhhhhhhhho..',
        '..osssssshhhho..', '.ossessssshhho..', '.osssssssshhhho.', '..ossssssSshho..',
        '...ossssssSho...', '....oooooooo....']
    },
    long: {
      d: ['oooooooo', 'o' + r('h', 8) + 'o', 'o' + 'hhHhhhhhhh' + 'o', 'o' + r('h', 10) + 'o',
        'ohh' + r('s', 6) + 'hho', 'o' + 'hsessssesh' + 'o', 'oh' + r('s', 8) + 'ho', 'ohh' + r('s', 6) + 'hho',
        'ohho' + r('s', 4) + 'ohho', 'o' + 'hhh' + r('o', 6) + 'hhh' + 'o'],
      u: ['oooooooo', 'o' + r('h', 8) + 'o', 'o' + 'hhhhHHhhhh' + 'o', 'o' + r('h', 10) + 'o', 'o' + r('h', 10) + 'o',
        'o' + r('h', 10) + 'o', 'o' + r('h', 10) + 'o', 'o' + r('h', 10) + 'o', 'o' + r('h', 10) + 'o', 'o' + r('h', 12) + 'o'],
      l: ['....oooooooo....', '...ohhhhhhhho...', '..ohhhHhhhhhho..', '..ohhhhhhhhhho..',
        '..osssssshhhho..', '.ossessssshhho..', '.osssssssshhhho.', '..osssssshhhhho.',
        '...ossssshhhhho.', '....ooooohhhho..']
    }
  };

  /* ---------- torsos (6 rows, shoulders to hip). c cloth, C cloth shade, s/S hands ---------- */
  var TD = ['o' + r('c', 10) + 'o', 'ocC' + r('c', 8) + 'Cco', 'ocC' + r('c', 8) + 'Cco', 'ocC' + r('c', 8) + 'Cco',
    'ocC' + r('c', 8) + 'Cco', 'osS' + r('c', 8) + 'Sso'];
  var TORSO = {
    d: TD, u: TD,
    l: ['o' + r('c', 8) + 'o', 'occcCCccco', 'occcCCccco', 'occcCCccco', 'occcCCccco', 'occcssccco']
  };

  /* ---------- legs (7 rows) : stand + step A (step B = mirror of A) ---------- */
  var PANTS = {
    f: {
      stand: ['o' + r('p', 8) + 'o', 'opppoopppo', 'opPo..opPo', 'opPo..opPo', 'opPo..opPo', 'obbo..obbo', 'oooo..oooo'],
      A: ['o' + r('p', 8) + 'o', 'opppoopppo', 'opPo..opPo', 'opPo..opPo', 'opPo..obbo', 'obbo..oooo', '|...oooo']
    },
    s: {
      stand: ['oppppo', 'oppppo', 'opppPo', 'opppPo', 'opppPo', '|....obbbbbo', '|....ooooooo'],
      A: ['oppppo', '....opppppo.....', '...oppo.opppo...', '..oppo...oppo...', '..oppo....oppo..',
        '.obbbo....obbo..', '.ooooo....oooo..']
    }
  };
  var SKIRT_ROWS = ['o' + r('k', 10) + 'o', 'o' + 'kkkKkkkkkk' + 'o', 'o' + 'kkkkKkkkkkkk' + 'o', 'o' + 'kkkKkkkkKkkk' + 'o',
    'o' + r('k', 12) + 'o', 'o' + 'kkKkkkkkkKkk' + 'o'];
  var SKIRT = {
    f: { stand: SKIRT_ROWS.concat(['ooo' + 'bb' + 'oooo' + 'bb' + 'ooo']),
      A: SKIRT_ROWS.concat(['ooobb' + r('o', 9)]) },
    s: { stand: ['o' + r('k', 8) + 'o', 'o' + 'kkkKkkkk' + 'o', 'o' + 'kkkkKkkkkk' + 'o', 'o' + 'kkkKkkkkKk' + 'o',
        'o' + r('k', 10) + 'o', 'o' + 'kkKkkkkkKk' + 'o', 'obb' + r('o', 9) + ''],
      A: ['o' + r('k', 8) + 'o', 'o' + 'kkkKkkkk' + 'o', 'o' + 'kkkkKkkkkk' + 'o', 'o' + 'kkkKkkkkKk' + 'o',
        'o' + r('k', 10) + 'o', 'o' + 'kkKkkkkkKk' + 'o', 'ooobb' + r('o', 7)] }
  };

  /* which template rows each body size keeps (child/tiny = shorter torso + legs, drawn lower).
     Early-console chibi proportions: big 10-row head, 4-row torso, 3-row legs (split pant + shoe); adult 17px, 1px over its tile. */
  var SEL = {
    adult: { t: [0, 1, 3, 5], l: [3, 5, 6] },
    child: { t: [0, 5], l: [3, 5, 6] },
    tiny: { t: [0, 5], l: [5, 6] }
  };

  /* ---------- overlays ----------
     part: head (y = row relative to head top, may be -1) | torso/legs (y = template row index) | abs (canvas row) | behind (abs, drawn first)
     d/u/l: rows (l may be a function(frame)); sym: also paint mirror image (down/up views) */
  var OV = {};
  function cap(band) {
    var d = ['oooooooo', 'ogGggggggo', 'o' + r('g', 10) + 'o', 'o' + r('g', 10) + 'o', band, 'o' + r('n', 12) + 'o'];
    return { part: 'head', y: -1, d: d, u: d.slice(0, 5), l: d.slice(0, 5).concat(['|.o' + r('n', 6) + 'o']) };
  }
  OV.gat = { part: 'head', y: -1, d: all(['oooooooo', 'ogGggggggo', 'o' + r('g', 8) + 'o', 'o' + r('g', 10) + 'o', 'o' + r('g', 14) + 'o', 'o' + r('G', 12) + 'o']).d };
  OV.gat.u = OV.gat.l = OV.gat.d;
  OV.tophat = { part: 'head', y: -1 };
  OV.tophat.d = OV.tophat.u = OV.tophat.l = ['oooooooo', 'ogGggggggo', 'o' + r('g', 8) + 'o', 'o' + r('q', 8) + 'o', 'o' + r('g', 12) + 'o', r('o', 14)];
  OV.cap = cap('o' + r('q', 10) + 'o');
  OV.policecap = cap('o' + r('q', 4) + 'aa' + r('q', 4) + 'o');
  OV.glasses = { part: 'head', y: 4,
    d: ['|....fff..fff', '|....feffffef', '|....fff..fff'], u: [],
    l: ['|...fff', '|...fefffff', '|...fff'] };
  OV.moustache = { part: 'head', y: 6, d: ['mmmmmm', 'm....m'], u: [], l: ['|..mmmm'] };
  OV.beard = { part: 'head', y: 5, u: [],
    d: ['m........m', r('m', 10), r('m', 8), r('m', 6), 'o' + r('m', 6) + 'o', 'o' + r('m', 4) + 'o'],
    l: ['|........mm', '|..mmmmmmm', '|...mmmmmm', '|....mmmmm', '|...ommmmmo', '|....ommmo'] };
  OV.knot = { part: 'head', y: -1, d: ['hhhh'], u: ['hhhh'], l: ['hhhh'] };
  OV.messy = { part: 'head', y: -1, d: ['h..hh..h'], u: ['h..hh..h'], l: ['h..hh..h'] };
  OV.headband = { part: 'head', y: 3, d: [r('w', 10)], u: [r('w', 10)], l: ['|...' + r('w', 10)] };
  OV.bandhead = { part: 'head', y: 2, d: [r('w', 12), 'wwEEwwwwwwww'], u: [r('w', 12), r('w', 12)],
    l: ['|..' + r('w', 12), '|..wwEEwwwwww'] };
  OV.bandage = { part: 'legs', y: 3, d: ['|...owwo'], u: ['|...owwo'],
    l: function (f) { return f === 0 ? ['|.....owwwwo'] : f === 1 ? ['|...owwo'] : ['|.........owwo']; } };
  OV.pack = { part: 'torso', y: 0, sym: false,
    d: ['j....j', 'j....j', 'j....j', 'j....j'],
    u: [r('j', 8), 'jJJJJJJj', 'jJJJJJJj', 'jJJJJJJj', r('j', 8)],
    l: ['|..........jjjj', '|..........jjjj', '|..........jjjj', '|..........jjjj', '|..........jjjj'] };
  OV.hoodie = { part: 'torso', y: 0,
    d: [r('C', 8), '|.....w..w', '|.....w..w', '|.....a..a', r('C', 8)],
    u: [r('C', 10), r('C', 8)], l: ['|....CCCCCC'] };
  OV.suit = { part: 'torso', y: 0, d: ['wwww', 'CwaawC', 'CwaawC', 'CCaaCC'], u: [],
    l: ['|....ww', '|....wa', '|....Ca', '|....Ca'] };
  OV.uniform = { part: 'torso', y: 0, d: ['a....a', '|.......a', '|.......a', '|.......a', '|.......a'], u: [],
    l: ['|....a', '|....a', '|....a', '|....a', '|....a'] };
  OV.hanbok = { part: 'torso', y: 0, d: ['ww....ww', 'ww..ww', 'wwww', 'aa', 'a..a'], u: [],
    l: ['|....w', '|....ww', '|....wa', '|....aa'] };
  OV.widesleeve = { part: 'torso', y: 2, sym: true, d: ['|occC', '|occC', '|occC', '|oCCC'], u: ['|occC', '|occC', '|occC', '|oCCC'],
    l: ['|....occcco', '|....occcco', '|....occcco', '|....oCCCCo'] };
  OV.rolled = { part: 'torso', y: 1, sym: true, d: ['|..ww', '|..sS', '|..sS', '|..sS'], u: ['|..ww', '|..sS', '|..sS', '|..sS'],
    l: ['|.......ww', '|.......ss', '|.......ss', '|.......ss'] };
  OV.bib = { part: 'torso', y: 0, d: ['a....a', r('a', 6), r('a', 6), r('a', 6), r('a', 6), r('a', 6)], u: ['a....a'],
    l: ['', '|....aaaa', '|....aaaa', '|....aaaa', '|....aaaa', '|....aaaa'] };
  OV.patch = { part: 'torso', y: 1, d: ['|..........aa', '|..........aa'], u: ['|..........aa', '|..........aa'],
    l: ['|........aa', '|........aa'] };
  OV.sling = { part: 'torso', y: 1, d: ['|..ww', '|..ww', '|..ww', '|..ww'], u: [], l: ['|.......ww', '|.......ww', '|.......ww', '|.......ww'] };
  OV.whitecoat = { part: 'torso', y: 0, d: ['aaaa', 'aa', 'CC', 'CC', 'CC', 'CC'], u: ['CC', 'CC', 'CC', 'CC', 'CC', 'CC'], l: ['|....aa'] };
  OV.coattails = { part: 'legs', y: 0, d: ['o' + r('c', 10) + 'o', 'o' + r('c', 10) + 'o'], u: ['o' + r('c', 10) + 'o', 'o' + r('c', 10) + 'o'],
    l: ['o' + r('c', 8) + 'o', 'o' + r('c', 8) + 'o'] };
  OV.broom = { part: 'abs', y: 8,
    d: [].concat(rows(12, '|...............x'), ['|............yyyy', '|............yyyy', '|............yyyy', '|............oyyo']),
    l: [].concat(rows(12, '|..x'), ['|yyyyy', '|yyyyy', '|yyyyy', '|oyyyo']) };
  OV.broom.u = OV.broom.d;
  OV.saber = { part: 'abs', y: 17,
    d: ['|..............aa', '|..............xx', '|..............xx', '|..............xx', '|..............xx', '|..............xx', '|...............v'],
    l: ['|...........aa', '|............xx', '|............xx', '|............xx', '|............xx', '|............xx', '|............vv'] };
  OV.saber.u = OV.saber.d.map(function (s) { return '|' + rev(norm(s)); });
  OV.lantern = { part: 'abs', y: 15,
    d: ['|.............oo', '|............oooo', '|............oYYo', '|............oYWo', '|............oYYo', '|............oooo'] };
  OV.lantern.u = OV.lantern.d;
  OV.lantern.l = OV.lantern.d.map(function (s) { return '|' + rev((s.slice(1) + r('.', 16)).slice(0, 16)); });
  OV.hood = (function () {
    var d = ['oooooo', 'o' + 'gGgggggg' + 'o', 'o' + r('g', 10) + 'o', 'o' + r('g', 12) + 'o', 'o' + r('g', 12) + 'o',
      'o' + 'ggg' + r('n', 6) + 'ggg' + 'o', 'o' + 'ggnYnnnnYnng' + 'o', 'o' + 'gg' + r('n', 8) + 'gg' + 'o',
      'o' + 'ggg' + r('n', 4) + 'ggg' + 'o', 'o' + r('g', 8) + 'o', 'o' + r('g', 12) + 'o'];
    var u = ['oooooo', 'o' + 'gGgggggg' + 'o', 'o' + r('g', 10) + 'o', 'o' + r('g', 12) + 'o', 'o' + r('g', 12) + 'o', 'o' + r('g', 12) + 'o',
      'o' + r('g', 12) + 'o', 'o' + r('g', 12) + 'o', 'o' + r('g', 10) + 'o', 'o' + r('g', 10) + 'o', 'o' + r('g', 12) + 'o'];
    var l = u.map(function (s, i) {
      s = norm(s);
      if (i >= 5 && i <= 8) s = s.slice(0, 2) + (i === 6 ? 'nYn' : 'nnn') + s.slice(5);
      return s;
    });
    return { part: 'head', y: -1, d: d, u: u, l: l };
  })();
  (function () { // A-frame (jige) loaded with bricks
    var A = 'x' + 'LRRRrLRRRrLR' + 'x', B = 'x' + 'RRrLRRRrLRRR' + 'x', M = 'x' + r('r', 12) + 'x', T = 'x' + r('x', 12) + 'x';
    OV.aframe = { part: 'abs', y: 7, u: [T, A, M, B, M, A, M, B, M, A, T],
      d: [], l: [] };
    OV.aframePoles = { part: 'behind', y: 7, d: rows(13, 'x' + r('.', 14) + 'x'), u: [], l: [] };
    OV.straps = { part: 'torso', y: 0, d: ['x....x', 'x....x', 'x....x', 'x....x', 'x....x'], u: [], l: [] };
  })();
  function rows(n, s) { var a = []; for (var i = 0; i < n; i++) a.push(s); return a; }

  /* long hair falling over the back / side of the shoulders */
  var LONGHAIR = {
    part: 'torso', y: 0,
    u: ['o' + r('h', 10) + 'o', 'o' + r('h', 8) + 'o', 'o' + r('h', 6) + 'o', 'o' + r('h', 4) + 'o'],
    l: ['|.........hhh', '|.........hhh', '|..........hh']
  };

  /* ---------- palette ---------- */
  function palette(L) {
    var skin = L.skin || '#f0c8a0', hair = L.hair || '#2a2220', c = L.c || '#8a8a8a', p = L.pants || shade(c, .8),
      k = L.skirt || c, g = L.g || '#1a1a22', j = L.j || '#3a3a48', R = '#b4502e';
    return {
      o: '#1c1624', e: '#241a1c', s: skin, S: shade(skin, .82), h: hair, H: light(hair, .25), m: L.m || hair,
      c: c, C: shade(c, .78), l: light(c, .3), a: L.a || '#d8b040', p: p, P: shade(p, .8), k: k, K: shade(k, .8),
      b: L.shoes || '#3a2c24', w: '#f4f0e8', W: '#fff6d0', g: g, G: light(g, .18), q: L.q || '#c8c8d0',
      f: '#26262e', x: '#8a5a32', y: '#d8b868', R: R, r: '#7e3420', L: '#d27a52', Y: '#ffd860', n: '#241820',
      v: '#c8ccd8', E: '#c0392b', j: j, J: shade(j, .75)
    };
  }

  /* ---------- looks ---------- */
  var looks = {};
  function look(id, o) { o.id = id; looks[id] = o; }
  var STUD = { c: '#26283a', pants: '#26283a', shoes: '#14141a', g: '#1a1a24', q: '#c8c8d0', hair: '#1c1a1e', skin: '#ecc29c' };
  function mix(base, o) { var n = {}, k; for (k in base) n[k] = base[k]; for (k in o) n[k] = o[k]; return n; }

  look('me', { hair: '#2e2420', skin: '#f2c9a5', c: '#2f62d6', pants: '#3d5a8c', shoes: '#f2f2f2', a: '#dfe6f5', j: '#e0a030', ovs: ['hoodie', 'pack'] });
  look('bokdong_kid', { size: 'child', hair: '#2a2018', skin: '#d9a47c', c: '#cdbf9c', pants: '#a89a78', shoes: '#d9a47c', a: '#7a8c5a', ovs: ['messy', 'patch'] });
  look('makdong', { size: 'tiny', hair: '#2a2018', skin: '#d9a47c', c: '#b9a888', pants: '#9a8c70', shoes: '#d9a47c', a: '#8a7a5a', ovs: ['messy', 'patch', 'bandage'] });
  look('bokdong_adult', { hair: '#2a2018', skin: '#c99370', c: '#e4dcc4', pants: '#7a6a52', shoes: '#b09060', ovs: ['knot', 'headband', 'rolled'] });
  look('bokdong_old', { hair: '#bfc0c4', m: '#cfcfd2', skin: '#d8a888', c: '#5a6e82', pants: '#46586a', shoes: '#2a2a30', a: '#8d9aa8', ovs: ['bib', 'moustache', 'broom'] });
  look('allen', { hair: '#5a3e28', skin: '#f4cdb0', c: '#3a3f55', pants: '#33384a', shoes: '#1c1c20', a: '#9a2a2a', ovs: ['suit', 'moustache'] });
  look('underwood', { hair: '#3a2a1c', skin: '#f2c8aa', c: '#5b4636', pants: '#4a3a2c', shoes: '#1c1c20', a: '#7a2a2a', ovs: ['suit', 'beard'] });
  look('underwood_old', { hair: '#d8d8d8', m: '#e4e4e4', skin: '#e8c0a0', c: '#25252e', pants: '#202028', shoes: '#14141a', a: '#5a2a2a', ovs: ['suit', 'beard'] });
  look('appenzeller', { hair: '#6a4a30', skin: '#f2c8aa', c: '#2c3a4a', pants: '#262f3c', shoes: '#1c1c20', a: '#2a4a2a', ovs: ['suit', 'moustache'] });
  look('avison', { hair: '#8a7a68', m: '#a89c8c', skin: '#f0c4a8', c: '#4a4e52', pants: '#3c4044', shoes: '#1c1c20', a: '#3a3a5a', ovs: ['suit', 'beard'] });
  look('severance', { hair: '#cfcfcf', m: '#dedede', skin: '#f0c8b0', c: '#202028', pants: '#1a1a22', shoes: '#101014', g: '#16161c', q: '#8a2a2a', a: '#7a2a2a', ovs: ['suit', 'moustache', 'tophat'] });
  look('park_seoyang', { hair: '#1e1a1c', skin: '#efc7a0', c: '#eef1f4', pants: '#2c3040', shoes: '#1c1c20', a: '#3a4a6a', ovs: ['whitecoat', 'coattails'] });
  look('official', { hair: '#1a1618', skin: '#ecc29c', c: '#2f4a8a', pants: '#2b3a66', shoes: '#1a1a20', g: '#18181e', a: '#d8b04a', ovs: ['hanbok', 'widesleeve', 'moustache', 'gat'] });
  look('commoner_m', { hair: '#2a2220', skin: '#d6a07a', c: '#e8e2d0', pants: '#cfc6aa', shoes: '#a88c58', a: '#8a7a5a', ovs: ['knot', 'hanbok'] });
  look('commoner_f', { hair: '#1c1618', hairStyle: 'long', legs: 'skirt', skin: '#eec6a2', c: '#f2eee2', skirt: '#4a7aa0', shoes: '#f0f0f0', a: '#b04060', ovs: ['hanbok'] });
  look('hurt', { hair: '#2a2220', skin: '#d6a07a', c: '#b8aa88', pants: '#8a7c60', shoes: '#a88c58', a: '#8a7a5a', ovs: ['knot', 'bandhead', 'sling'] });
  look('worker', { hair: '#2a2220', skin: '#c99370', c: '#9a8c70', pants: '#5c5040', shoes: '#3a3228', ovs: ['headband', 'rolled', 'straps', 'aframePoles', 'aframe'] });
  look('student_1940s', mix(STUD, { a: '#d8b040', ovs: ['uniform', 'cap'] }));
  look('yun', mix(STUD, { c: '#1e1e24', pants: '#1e1e24', a: '#d8b040', ovs: ['uniform', 'cap', 'glasses'] }));
  look('jeong_byeongwook', mix(STUD, { c: '#3c4660', pants: '#3c4660', a: '#d8b040', ovs: ['uniform'] }));
  look('prof_jeong', { hair: '#d4d0c8', m: '#d4d0c8', skin: '#e6bf9a', c: '#d8d4c4', skirt: '#d8d4c4', legs: 'skirt', shoes: '#3a3228', a: '#5a4a3a', ovs: ['hanbok', 'widesleeve', 'glasses', 'moustache'] });
  look('prof_baek', { hair: '#1c1a1e', skin: '#ecc29c', c: '#4a4a52', pants: '#3e3e46', shoes: '#1c1c20', a: '#2a4a8a', ovs: ['suit', 'glasses'] });
  look('guard', { hair: '#1a1618', skin: '#ecc29c', c: '#1a1e2a', pants: '#1a1e2a', shoes: '#0e0e12', g: '#1a1e2a', q: '#d02828', a: '#d8b040', ovs: ['uniform', 'policecap', 'moustache', 'saber'] });
  look('keeper', { legs: 'skirt', c: '#3c3a52', skirt: '#3c3a52', g: '#33314a', skin: '#8a6a5a', shoes: '#14101c', ovs: ['hood', 'lantern'] });

  /* static props occupying a 24-row cell (content bottom-aligned) */
  var PROP = {
    sign: { rows: ['oooooooooooooo', 'oLLLLLLLLLLLLo', 'oRRttttttttRRo', 'oRRRRRRRRRRRRo', 'oRRttttttRRRRo', 'orrrrrrrrrrrro', 'oooooooooooooo',
      'oRro', 'oRro', 'oRro', 'oRro', 'oRro', 'oRro', 'oRro', 'oooooo'], y: 8, pal: 'sign' }
  };
  var ITEMPAL = {
    brick: { o: '#2a1812', L: '#e08a60', R: '#b4502e', r: '#8a3420', m: '#d8c8b0', d: 'rgba(0,0,0,.28)' },
    wood: { o: '#2a1a0e', L: '#d8a468', R: '#b07c44', r: '#8a5a2c', n: '#d0d4dc', d: 'rgba(0,0,0,.28)' },
    page: { o: '#2a2a32', W: '#f6f2e2', D: '#c8c0a8', t: '#6a6a78', E: '#c0392b', d: 'rgba(0,0,0,.25)' },
    notice: { o: '#2a1a0e', L: '#d8a468', R: '#a0703c', r: '#7a5028', W: '#f6f2e2', t: '#6a6a78', p: '#d03a3a', d: 'rgba(0,0,0,.28)' },
    heart: { o: '#4a0e22', L: '#ffb0c0', R: '#e83a5a', r: '#b01e40' },
    coin: { o: '#4a3410', L: '#fff0a0', G: '#e0b440', g: '#a87820', n: '#3a2808' },
    lamp: { o: '#241a10', M: '#8a8a96', Y: '#ffd860', W: '#fff8d8', z: 'rgba(255,214,96,.35)' },
    sign: { o: '#2a1a0e', L: '#d8a468', R: '#b07c44', r: '#8a5a2c', t: '#6a4a2a' }
  };
  var ITEMS = {
    brick: { y: 5, rows: ['oooooooooooooo', 'oLLLLLLLLLLLLo', 'oRRRRRoRRRRRRo', 'orrrrrorrrrrro', 'oooooooooooooo', 'oLLLLLLLLLLLLo',
      'oRRRRRRRRoRRRo', 'orrrrrrrrorrro', 'oooooooooooooo', '|.dddddddddddd'] },
    wood: { y: 4, rows: ['oooooooooooooo', 'oLLLLLLLLLLLLo', 'oRRRnRRRRRRnRo', 'orrrrrrrrrrrro', 'oooooooooooooo', 'oLLLLLLLLLLLLo',
      'oRnRRRRRRRRRno', 'orrrrrrrrrrrro', 'oooooooooooooo', '|.dddddddddddd'] },
    page: { y: 1, rows: ['|...ooooooo', '|...oWWWWWoo', '|...oWWWWWWDo', '|...oWWWWWWWWo', '|...oWttttttWo', '|...oWWWWWWWWo',
      '|...oWttttttWo', '|...oWWWWWWWWo', '|...oWttttWWWo', '|...oWWWWWWWWo', '|...oWtttttWWo', '|...oWWWWWEEWo', '|...oooooooooo', '|....dddddddddd'] },
    notice: { y: 2, rows: ['oooooooooooooo', 'oLLLLLLLLLLLLo', 'oRRRRRRRRRRRRo', 'oRpWWWRRWWWpRo', 'oRWttWRRWttWRo', 'oRWWWWRRWWWWRo',
      'oRWttWRWWWWWRo', 'oRWWWWRWttWWRo', 'oRRRRRRWWWWWRo', 'orrrrrrrrrrrro', 'oooooooooooooo', 'oRo......oRo', 'oRo......oRo', 'ooo......ooo'] },
    heart: { y: 2, rows: ['ooo..ooo', 'oRRRooRRRo', 'oLLRRRRRRRRo', 'oLRRRRRRRRRo', 'oRRRRRRRRRRo', 'orRRRRRRRRro', 'ooRRRRRRRRoo',
      'orRRRRRRro', 'ooRRRRoo', 'ooRRoo', 'oooo'] },
    coin: { y: 2, rows: ['oooooooo', 'ooLLLLGGGGoo', 'oLLGGGGGGGgo', 'oLGGooooGGgo', 'oGGGonnoGGgo', 'oGGGonnoGGgo', 'oGGGooooGGgo',
      'oGGGGGGGGggo', 'oggGGGGGGggo', 'ooggggggggoo', 'oooooooo'] },
    lamp: { y: 1, rows: ['oooo', 'o..o', 'oooooooo', 'zoMMMMMMoz', 'zoYYYYYYoz', 'zoYYWWYYoz', 'zoYWWWWYoz', 'zoYYWWYYoz',
      'zoYYYYYYoz', 'oMMMMMMo', 'oooooooo'] }
  };

  /* ---------- rendering ---------- */
  function mkCanvas(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function blank() { var g = []; for (var y = 0; y < 24; y++) g.push(r('.', 16).split('')); return g; }
  function paint(G, rowsArr, y0, mirror) {
    for (var i = 0; i < rowsArr.length; i++) {
      var y = y0 + i; if (y < 0 || y >= 24 || !rowsArr[i]) continue;
      var s = norm(rowsArr[i]);
      for (var x = 0; x < 16; x++) {
        var ch = s.charAt(x); if (ch !== '.') G[y][x] = ch;
        if (mirror) { var m = s.charAt(15 - x); if (m !== '.') G[y][x] = m; }
      }
    }
  }
  function swing(rowsArr, side) { // raise one arm by 1px (upper-body arm columns only)
    var g = rowsArr.map(function (s) { return norm(s).split(''); }), n = g.length, cols = side ? [13, 14] : [1, 2];
    cols.forEach(function (cx) {
      for (var i = 1; i < n - 1; i++) g[i][cx] = g[i + 1][cx];
      g[n - 1][cx] = '.';
    });
    return g.map(function (a) { return a.join(''); });
  }
  function build(L, dir, frame) { // dir: d|u|l ; returns 24 strings
    var sz = SEL[L.size || 'adult'], top = 24 - (10 + sz.t.length + sz.l.length), G = blank(), bob = frame ? 1 : 0;
    var headY = top, torsoY = top + 10, legY = 24 - sz.l.length, ovs = (L.ovs || []).map(function (n) { return OV[n]; }), i;
    function run(part) {
      ovs.forEach(function (o) {
        if (o.part !== part) return;
        var rw = o[dir]; if (typeof rw === 'function') rw = rw(frame);
        if (!rw || !rw.length) return;
        var y;
        if (part === 'abs' || part === 'behind') y = o.y;
        else if (part === 'head') y = headY + bob + o.y;
        else {
          var s = part === 'torso' ? sz.t : sz.l;
          rw.forEach(function (row, k) {
            var pos = s.indexOf(o.y + k); if (pos < 0) return;
            paint(G, [row], (part === 'torso' ? torsoY + bob : legY) + pos, o.sym && dir !== 'l');
          });
          return;
        }
        paint(G, rw, y, o.sym && dir !== 'l');
      });
    }
    run('behind');
    // legs
    var lt = (L.legs === 'skirt' ? SKIRT : PANTS)[dir === 'l' ? 's' : 'f'];
    var lg = frame === 0 ? lt.stand : frame === 1 ? lt.A : lt.A.map(function (s) { return rev(norm(s)); });
    paint(G, sz.l.map(function (k) { return lg[k]; }), legY);
    run('legs');
    // upper body
    var style = HEAD[L.hairStyle || 'short'][dir];
    paint(G, style, headY + bob);
    var tr = sz.t.map(function (k) { return TORSO[dir][k]; });
    if (dir !== 'l' && frame) tr = swing(tr, frame === 2);
    paint(G, tr, torsoY + bob);
    if (L.hairStyle === 'long' && LONGHAIR[dir]) paint(G, LONGHAIR[dir], torsoY + bob);
    run('head'); run('torso'); run('abs');
    return G.map(function (a) { return a.join(''); });
  }

  var cache = {}, pals = {};
  function draw2(cv, grid, pal) {
    var g = cv.getContext('2d');
    for (var y = 0; y < grid.length; y++) for (var x = 0; x < 16; x++) {
      var ch = grid[y].charAt(x); if (ch === '.' || !pal[ch]) continue;
      g.fillStyle = pal[ch]; g.fillRect(x, y, 1, 1);
    }
    return cv;
  }
  function frameCanvas(id, dir, frame) {
    var key = id + '|' + dir + '|' + frame; if (cache[key]) return cache[key];
    var L = looks[id] || looks.commoner_m, cv = mkCanvas(16, 24), grid;
    if (PROP[id]) {
      var P = PROP[id]; grid = []; for (var y = 0; y < 24; y++) grid.push(r('.', 16));
      P.rows.forEach(function (s, i) { grid[P.y + i] = norm(s); });
      draw2(cv, grid, ITEMPAL[P.pal]);
    } else if (id === 'notice_board') {
      grid = []; for (var y2 = 0; y2 < 24; y2++) grid.push(r('.', 16));
      ITEMS.notice.rows.forEach(function (s, i) { grid[8 + i] = norm(s); });
      draw2(cv, grid, ITEMPAL.notice);
    } else {
      var d = dir === 'right' ? 'l' : dir === 'left' ? 'l' : dir === 'up' ? 'u' : 'd';
      grid = build(L, d, frame);
      if (dir === 'right') grid = grid.map(rev);
      draw2(cv, grid, pals[id] || (pals[id] = palette(L)));
    }
    return (cache[key] = cv);
  }
  var DIRS = ['down', 'up', 'left', 'right'];
  function get(id, dir, frame) {
    if (typeof dir === 'number') dir = DIRS[dir] || 'down';
    if (DIRS.indexOf(dir) < 0) dir = 'down';
    return frameCanvas(id, dir, (frame | 0) % 3);
  }
  var itemCache = {};
  function itemCanvas(kind) {
    if (itemCache[kind]) return itemCache[kind];
    var I = ITEMS[kind], cv = mkCanvas(16, 16); if (!I) return null;
    var grid = []; for (var y = 0; y < 16; y++) grid.push(r('.', 16));
    I.rows.forEach(function (s, i) { if (I.y + i < 16) grid[I.y + i] = norm(s); });
    var g = cv.getContext('2d'), pal = ITEMPAL[kind];
    for (var yy = 0; yy < 16; yy++) for (var x = 0; x < 16; x++) {
      var ch = grid[yy].charAt(x); if (ch === '.' || !pal[ch]) continue;
      g.fillStyle = pal[ch]; g.fillRect(x, yy, 1, 1);
    }
    return (itemCache[kind] = cv);
  }

  window.Sprites = {
    looks: looks,
    warnings: warnings,
    /** Draw a character; (x,y) = top-left of its tile, sprite extends 8px above the tile. */
    draw: function (ctx, x, y, lookId, dir, frame) { ctx.drawImage(get(lookId, dir, frame), Math.round(x), Math.round(y) - 8); },
    get: get,
    /** Draw a 16x16 map item at tile top-left (x,y). */
    drawItem: function (ctx, x, y, kind) { var c = itemCanvas(kind); if (c) ctx.drawImage(c, Math.round(x), Math.round(y)); },
    items: Object.keys(ITEMS)
  };
})();
