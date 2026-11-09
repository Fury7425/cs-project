/* llm-worker.js — admin-only extra quiz questions: LFM3-1.7B on WebGPU, off the main thread.
   In:  { id, text, avoid: [question, ...] }
   Out: { status } | { ready: true } | { id, qs: [{ q, a, c, why, ai }] } (qs is [] on any failure) */
import * as ort from 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.31.1/dist/ort.webgpu.bundle.min.mjs';
import { Tokenizer } from 'https://cdn.jsdelivr.net/npm/@huggingface/tokenizers@0.2.0/dist/tokenizers.min.mjs';

const REPO = 'https://huggingface.co/LiquidAI/LFM3-1.7B-ONNX/resolve/main/';
const MODEL = 'model_q4f16'; // the model card's WebGPU build; plain model_q4 is its CPU build
const BOS = 124894, EOS = 124900;
const PREFILL_CHUNK = 256; // the model card's WebGPU limit
const MAX_NEW_TOKENS = 500;

ort.env.wasm.numThreads = 1; // the game is not cross-origin isolated; WebGPU does the work anyway

const squash = s => String(s).replace(/\s/g, '');

// Salvages every complete {...} so output cut off at the token limit still yields its finished questions.
// ponytail: grounding is a substring check on the answer only; a wrong question about a real term can still pass.
function parseQs(raw, source, avoid) {
  const text = squash(source), seen = new Set(avoid.map(squash)), out = [];
  for (const [m] of raw.matchAll(/\{[^{}]*\}/g)) {
    try {
      const { q, answer, wrong, why } = JSON.parse(m);
      if (!q || !Array.isArray(wrong) || wrong.length !== 2) continue;
      const a = [answer, ...wrong].map(s => String(s).trim()), key = squash(q), ans = squash(answer);
      if (a.some(x => !x || x.length > 30) || String(q).length > 80 || new Set(a.map(squash)).size !== 3) continue;
      if (seen.has(key) || !text.includes(ans) || key.includes(ans)) continue;
      seen.add(key);
      out.push({ q: String(q), a, c: 0, why: String(why || ''), ai: true });
    } catch { /* one malformed object must not lose the others */ }
  }
  return out.slice(0, 3);
}

const okQ = '{"q":"1885년에 문을 연 병원은?","answer":"광혜원","wrong":["세브란스","경신"],"why":"광혜원이오."}';
console.assert(parseQs(`[${okQ},{"q":"잘린`, '1885년 광혜원', []).length === 1, 'parseQs salvage');
console.assert(parseQs(okQ, '자료에 없음', []).length === 0, 'parseQs grounding');

// Cached so the 1.38 GB download happens once per browser.
async function bytes(url, label) {
  const cache = await caches.open('lfm3-1.7b');
  let res = await cache.match(url), saved = null;
  if (!res) {
    res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    saved = cache.put(url, res.clone()).catch(() => {}); // storage full: still usable, just downloads next time
  }
  const total = +res.headers.get('content-length') || 0;
  let got = 0, shown = -1;
  const counted = res.body.pipeThrough(new TransformStream({ transform(chunk, ctl) {
    got += chunk.length;
    const tens = total ? Math.floor(got / total * 10) * 10 : -1;
    if (label && tens !== shown) { shown = tens; postMessage({ status: `${label} ${tens}%` }); }
    ctl.enqueue(chunk);
  } }));
  const data = new Uint8Array(await new Response(counted).arrayBuffer());
  await saved;
  return data;
}

async function load() {
  const adapter = await navigator.gpu?.requestAdapter();
  if (!adapter) throw new Error('WebGPU 없음');
  if (!self.Float16Array) throw new Error('Float16Array 없음'); // caches are fp16; without it the bits would be misread
  const json = async f => JSON.parse(new TextDecoder().decode(await bytes(REPO + f)));
  const tok = new Tokenizer(await json('tokenizer.json'), await json('tokenizer_config.json'));
  const [model, weights] = [await bytes(`${REPO}onnx/${MODEL}.onnx`), await bytes(`${REPO}onnx/${MODEL}.onnx_data`, 'AI 모델 받는 중')];
  postMessage({ status: 'AI 모델 여는 중…' });
  const session = await ort.InferenceSession.create(model, {
    executionProviders: ['webgpu'],
    externalData: [{ path: `${MODEL}.onnx_data`, data: weights }],
    preferredOutputLocation: 'gpu-buffer', // caches stay on the GPU between steps
  });
  postMessage({ ready: true, status: 'AI 추가 문제 준비 완료' });
  return { tok, session };
}
const loaded = load();
loaded.catch(e => postMessage({ status: `AI 추가 문제 사용 불가: ${e.message}` }));

const TYPED = { float16: self.Float16Array, float32: Float32Array, int64: BigInt64Array };
const i64 = (values, dims) => new ort.Tensor('int64', BigInt64Array.from(values, BigInt), dims);

function emptyCaches(session) {
  const caches = {};
  for (const m of session.inputMetadata) {
    if (!m.name.startsWith('past_')) continue;
    const dims = m.shape.map(d => typeof d === 'number' ? d : /sequence/.test(d) ? 0 : 1);
    caches[m.name] = new ort.Tensor(m.type, new TYPED[m.type](dims.reduce((a, b) => a * b, 1)), dims);
  }
  return caches;
}

// ponytail: pure argmax; the card's repetition penalty also punishes JSON's own punctuation. Loops end at MAX_NEW_TOKENS.
const argmax = l => l.reduce((best, v, i) => v > l[best] ? i : best, 0);

async function generate({ tok, session }, prompt) {
  let ids = tok.encode(prompt, { add_special_tokens: false }).ids;
  if (ids[0] !== BOS) ids = [BOS, ...ids];
  const caches = emptyCaches(session);
  const keepDims = session.inputMetadata.find(m => m.name === 'logits_to_keep').shape.length ? [1] : [];
  let done = 0;

  const run = async (chunk, wantLogits) => {
    const out = await session.run({
      input_ids: i64(chunk, [1, chunk.length]),
      attention_mask: i64(Array(done + chunk.length).fill(1), [1, done + chunk.length]),
      position_ids: i64(chunk.map((_, k) => done + k), [1, chunk.length]),
      logits_to_keep: i64([1], keepDims),
      ...caches,
    });
    done += chunk.length;
    for (const [name, t] of Object.entries(out)) {
      if (name === 'logits') continue;
      const key = name.replace('present_conv', 'past_conv').replace('present.', 'past_key_values.');
      const old = caches[key];
      caches[key] = t;
      if (old.location === 'gpu-buffer' && old.gpuBuffer !== t.gpuBuffer) old.dispose();
    }
    if (!wantLogits) return out.logits.dispose();
    const [, n, vocab] = out.logits.dims, data = await out.logits.getData(true);
    return data.subarray((n - 1) * vocab, n * vocab);
  };

  try {
    let logits;
    for (let at = 0; at < ids.length; at += PREFILL_CHUNK)
      logits = await run(ids.slice(at, at + PREFILL_CHUNK), at + PREFILL_CHUNK >= ids.length);
    const made = [];
    while (made.length < MAX_NEW_TOKENS) {
      const t = argmax(logits);
      if (t === EOS) break;
      made.push(t);
      logits = await run([t], true);
    }
    return tok.decode(made);
  } finally {
    for (const t of Object.values(caches)) t.dispose();
  }
}

const buildPrompt = (text, avoid) => `<|im_start|>system
너는 역사 교육 게임의 퀴즈 출제자다. 주어진 자료에 적힌 사실만 쓰고, JSON만 출력한다.<|im_end|>
<|im_start|>user
[자료]
${text}

[요청]
위 자료만 근거로 삼지선다 문제 3개를 만들어라.
- 게임 속 농담이 아니라 연도, 인물, 장소, 사건을 묻는다.
- answer는 자료에 나온 표현 그대로 짧게 쓴다.
- wrong은 그럴듯하지만 틀린 보기 2개다.
- 다음 문제와 겹치면 안 된다: ${avoid.join(' / ')}
형식: [{"q":"질문","answer":"정답","wrong":["오답1","오답2"],"why":"한 문장 해설"}]<|im_end|>
<|im_start|>assistant
<think></think>`;

async function answer({ id, text, avoid }) {
  let qs = [];
  try {
    qs = parseQs(await generate(await loaded, buildPrompt(text, avoid)), text, avoid);
  } catch (e) {
    console.warn('LFM3 quiz failed', e);
  }
  postMessage({ id, qs });
}

let queue = Promise.resolve();
onmessage = ({ data }) => { queue = queue.then(() => answer(data)); }; // one generation at a time on the GPU
