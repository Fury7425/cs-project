# 연세 역사 탐험 v2 — module contract

Single-page game, opened straight from disk (`file://`). Therefore:
- **Classic `<script src>` tags only** (no ES modules, no fetch of local files, no `getImageData` on images loaded from disk — the canvas would be tainted). Images are used only via `drawImage` or `<img>`.
- Every module exposes **one global object** and touches nothing else except the shared DOM ids listed below.
- No build step, no npm packages. External: only the Galmuri font CSS from jsDelivr (already in index.html).
- Korean UI text. Code comments in English.

Load order in `index.html`:
```
js/art.js        -> window.Art        (shared pixel painter helpers)
js/audio.js      -> window.Music, window.Sfx, window.Voice
js/sprites.js    -> window.Sprites
js/portraits.js  -> window.Portraits
js/cutscenes.js  -> window.Cutscenes   (engine + intro, c1, c2)
js/cutscenes2.js -> registers c3, c4, epilogue
data/story.js    -> window.STORY       (characters, flow, intro/epilogue VN scripts, act1)
data/story2.js   -> adds STORY.acts.act2, STORY.acts.act3
js/game.js       -> boots the game (engine, maps, quests, VN dialog UI)
```

## Resolution
- Game world canvas `#c`: 256x224, tiles 16x16, maps 24x18 tiles, camera scrolls (unchanged from v1).
- Characters in the world: **16 wide x 24 tall** sprites, feet on the tile's bottom edge (sprite drawn from y-8 to y+16 relative to the tile top).
- Cutscene canvas `#cs`: 384x336 with letterbox bars 40px top/bottom (scene area 384x256 at y=40).
- Visual-novel portraits: **96 wide x 120 tall** pixel art, displayed with CSS `image-rendering: pixelated` at 3x in the VN layer.

## window.Art (js/art.js)
Pixel-exact painters drawing onto a target 2D context. All take integer-ish coords and round.
```
Art.ctx(ctx)                         // set the active target context; returns previous
Art.layer(w, h, fn)                  // offscreen canvas; fn() paints with Art.* targeting it; returns canvas
Art.px(color, x, y, w=1, h=1)
Art.poly(points, color)              // scanline polygon, no antialiasing
Art.blob(cx, cy, rx, ry, color)      // filled ellipse
Art.line(x0, y0, x1, y1, color)
Art.grad(x, y, w, h, stops)          // vertical Bayer-dithered gradient; stops [[0,'#hex'],[.5,'#hex'],[1,'#hex']]
Art.dglow(cx, cy, r, color, k=1)     // dithered radial glow
Art.light(cx, cy, r, 'r,g,b', alpha) // smooth additive glow (globalCompositeOperation 'lighter')
Art.ridge(w, y0, amp, seed, color, bottom, rim)
Art.roof(cx, eaveY, w, thickness, color, tileHighlight)   // hanok roof silhouette
Art.tree(x, y, h, color, highlight)
Art.rng(seed) -> () => float in [0,1)
Art.wrap(v, m)
Art.B4                               // Bayer 4x4 matrix
```
(These already exist inside v1 `index.html` — move them, don't reinvent.)

## window.Music / Sfx / Voice (js/audio.js)
WebAudio only, synthesized (no audio files except optional voice). Must not throw if AudioContext is unavailable. Lazily create the context on the first user gesture.
```
Music.play(trackId, {fade=1.0})   // crossfade to track, loops; same id = no-op
Music.stop({fade=1.0})
Music.duck(on)                    // lower music while voice plays
Sfx.play(name)                    // blip, select, confirm, pick, quest, ok, bad, bump, step, door, page, heart, thunder, alarm, bell
Audio.setMuted(bool), Audio.muted // global mute (M key) — expose as window.AudioCtl
Voice.play(lineId) -> Promise     // tries new Audio(`audio/voice/${lineId}.mp3`); resolves silently if missing. Future TTS drop-in.
Voice.stop()
```
Track ids (all must exist): `title, intro, act1, act2, act3, stealth, vn_warm, vn_sad, vn_tense, cut_fire, cut_sea, cut_dawn, cut_build, cut_rain, cut_liberation, ending, epilogue`.

## window.Sprites (js/sprites.js)
Hand-authored pixel templates (string grids + palette), 16x24, 4 directions x 3 frames (stand, stepA, stepB). Recolor per look; accessory overlays (gat, cap, top hat, glasses, beard, braid/bun, bandage, white coat, A-frame load, lantern).
```
Sprites.draw(ctx, x, y, lookId, dir, frame)   // (x,y) = tile top-left of the character's tile; frame 0|1|2
Sprites.looks                                  // { lookId: {...} } list for game.js
```
Required look ids: `me` (연우, 2026 student, Yonsei-blue hoodie, jeans, sneakers), `bokdong_kid` (9yo, patched 저고리, bare feet, topknot-less messy hair), `makdong` (smaller kid, bandaged leg), `bokdong_adult` (mason, rolled sleeves, headband), `bokdong_old` (janitor, grey hair, 작업복, broom), `allen`, `underwood`, `underwood_old`, `appenzeller`, `avison`, `severance`, `park_seoyang` (young Korean doctor, white coat), `official` (gat + hanbok official), `commoner_m`, `commoner_f`, `hurt`, `worker`, `student_1940s`, `yun` (윤동주, black student uniform + cap), `jeong_byeongwook` (정병욱, student uniform), `prof_jeong` (정인보, hanbok, round glasses), `prof_baek` (백남운, suit), `guard` (Japanese police, black uniform + cap with red band, saber), `keeper` (the 기록관, hooded robe, lantern), `sign`, `notice_board`.

## window.Portraits (js/portraits.js)
```
Portraits.get(id, mood='neutral') -> HTMLCanvasElement|HTMLImageElement (96x120) or null
Portraits.ids
```
Two sources:
1. **Photo portraits** of real people: pre-rendered PNGs in `assets/portraits/<id>.png` (made offline from public-domain Wikimedia Commons photos by `dev/pixelize.py`). Loaded via `new Image()`. Moods map to the same image. Existing ids: `allen, appenzeller, avison, baek_nakjun, baek_namun, gojong, jeong_inbo, kim_pilsun, lillias, min_yeongik, park_seoyang, severance, underwood, underwood_old, yun`.
2. **Procedural portraits** for fictional/no-photo characters, painted with `Art` at 96x120 in the same palette/dither style (8-colour ramps with 4x4 Bayer dither — see `RAMPS` in dev/pixelize.py: warm=1880s, rose=1900–20s, cold=1930–40s), with moods `neutral, smile, sad, angry, surprised` (eyes/brows/mouth variants). Required: `me` (연우, modern, rose/neutral ramp but with a hint of Yonsei blue), `bokdong_kid` (warm), `makdong` (warm), `bokdong_adult` (rose), `bokdong_old` (cold), `choi` (최현배 c.1935, round glasses, short hair, suit, cold), `jeong_byeongwook` (cold), `guard` (cold, cap shadowing eyes), `keeper` (hood + lantern glow, face mostly shadow; mood `reveal` shows bokdong_kid's grin), `official` (warm, gat), `commoner_m`, `commoner_f`, `hurt` (warm), `worker` (rose), `narrator` (returns null).

## window.Cutscenes (js/cutscenes.js)
```
Cutscenes.play(id, onDone)   // takes over #cut/#cs/#cap/#ctag; Z/click advances, Esc skips all; calls onDone
Cutscenes.active             // bool
Cutscenes.key(code)          // game.js forwards keydown while active
Cutscenes.update()           // 60Hz step, called by game loop while active
Cutscenes.draw()             // called by game loop while active
```
Scene ids: `intro`, `c1`, `c2`, `c3`, `c4`, `epilogue` — shot lists in dev/STORY_BIBLE.md. Each scene = `{tag, music, shots:[{caption, make()}]}` where `make()` returns `draw(t)` exactly like v1. Captions may be multi-line Korean.
Split across two files so two people can work at once: `js/cutscenes.js` defines the engine + `Cutscenes.register(id, scene)` + scenes `intro, c1, c2`; `js/cutscenes2.js` (loaded right after) registers `c3, c4, epilogue`.

## window.STORY (data/story.js) — pure data, no logic
```
STORY.characters = { id: { name: '언더우드', title: '선교사', portrait: 'underwood', sprite: 'underwood', color: '#hex' } }
STORY.flow = [ {type:'cutscene', id:'intro'}, {type:'vn', bg:'archive', music:'intro', script:[...]}, {type:'cutscene', id:'c1'}, {type:'act', id:'act1'}, ..., {type:'credits'} ]
// 'vn' = full-screen visual-novel scene (no map); bg ids: 'archive' (2026 archive at night), 'black'. game.js draws simple bgs itself.
STORY.acts = { act1: { title, hint, music, map: [...rows], start:[x,y], dark?:bool, hearts?:bool,
                       intro: <script>, steps: [...], ents: [...], mobs: [...] }, ... }
```
**Dialogue script** (`<script>`) = array of lines. A line is either a string (narration) or an object:
```
{ id:'a1_allen_03', who:'allen', mood:'neutral'|'smile'|..., text:'...', side:'left'|'right',
  pause: ms,           // optional extra beat before next line
  sfx: 'door',         // optional
  choice: [ {text:'...', next:<script>, set:'flagName'} ],   // optional branch
  if: 'flagName' }     // optional: only shown when flag set
```
- `who:'me'` is the player (portrait shown on the right).
- Every object line has a unique stable `id` (act_speaker_nn) so `Voice.play(id)` can attach TTS audio later.
- Steps (quests) keep v1 semantics: `{goal, who, script}` (talk), `{goal, tag, need, done:<script>}` (collect/talk-to-N), `{goal, who, quiz:[...]}`, `{build:[[x,y,roof,wall]]}`; `ents` entries: `{x,y,id?,name,sprite,script,tag?,item?,after?:<script>,q?:<script>}`; `mobs: [[kind, route]]` with kind `doubt|guard`.

## Shared DOM (index.html)
`#hud #hl #hr` HUD · `#wrap` · `#c` world canvas · `#vn` visual-novel layer (portraits `#vnL #vnR`, name `#vnName`, text `#vnText`, choices `#vnChoices`, next arrow `#vnNext`) · `#ov` title/end overlay · `#cut #cs #cap #ctag #cskip` cutscenes · `#pad` touch controls · `#help`.
