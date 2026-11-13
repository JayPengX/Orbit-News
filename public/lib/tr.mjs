// One language at a time (Jay 11-13: "a full traditional Chinese experience
// and full English experience"): an outlet's own words in the reader's
// language, by plain translation (Orbit-Core's translate.js, Google's free
// month, never the AI's). Two ways in:
//   news/tr.json   every story's headline the AI didn't title, and the top
//                  stories' summaries, made ahead (builders/news-tr.js):
//                  { built, tr: { id: { zh | en, sum } } }
//   POST /news-tr  a story's own texts as it's opened (its outlets'
//                  headlines, its summary, its clips' titles), each made
//                  once and kept on the server; here, for the session.
// A text already in the reader's language is never asked for. What can't
// be had (none left this month, offline) shows the outlet's own.
import { API } from '#kit/domain.mjs';

const HAN = /[㐀-鿿]/;
// Whether a text is in the other language from the reader's.
export const foreign = (text, en) => Boolean(text) && HAN.test(text) === Boolean(en);

export function cleanTr(raw) {
  const out = new Map();
  const tr = raw && typeof raw === 'object' ? raw.tr : null;
  if (!tr || typeof tr !== 'object') return out;
  for (const [id, e] of Object.entries(tr)) {
    if (!e || typeof e !== 'object') continue;
    const s = k => (typeof e[k] === 'string' ? e[k].trim() : '');
    if (s('zh') || s('en') || s('sum')) out.set(id, { zh: s('zh'), en: s('en'), sum: s('sum'), s: s('s') });
  }
  return out;
}

// The session's translations, by the text they're of.
export const trCache = new Map();
const asked = new Set();

// Asks for a story's texts not had yet (each once a session); → how many came.
export async function askTr(id, texts, en, { fetchImpl = globalThis.fetch } = {}) {
  const want = [...new Set(texts.filter(t => foreign(t, en) && !trCache.has(t) && !asked.has(`${id}\n${t}`)))];
  if (!want.length || !fetchImpl) return 0;
  for (const t of want) asked.add(`${id}\n${t}`);
  try {
    const r = await fetchImpl(`${API}/news-tr`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, to: en ? 'en' : 'zh-TW', texts: want.slice(0, 60) }) });
    if (!r.ok) return 0;
    const j = await r.json();
    let n = 0;
    for (const [src, v] of Object.entries(j?.tr || {})) if (typeof v === 'string' && v.trim() && !foreign(v, en)) trCache.set(src, v.trim()), n++;
    return n;
  } catch {
    // (Failed: asked again on the next opening.)
    for (const t of want) asked.delete(`${id}\n${t}`);
    return 0;
  }
}

// What's drawn waiting (`data-tr`, the text it's of) given its translation.
export function trPaint(root, en) {
  let n = 0;
  for (const el of root?.querySelectorAll?.('[data-tr]') || []) {
    const v = trCache.get(el.dataset.tr);
    if (!v) continue;
    el.textContent = v;
    el.lang = en ? 'en' : 'zh-Hant';
    delete el.dataset.tr;
    n++;
  }
  return n;
}
// The texts drawn waiting for theirs.
export const trWaiting = root => [...(root?.querySelectorAll?.('[data-tr]') || [])].map(el => el.dataset.tr);
