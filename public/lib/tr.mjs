// One language at a time (Jay 11-13: "a full traditional Chinese
// experience and full English experience"): an outlet's own words in the
// reader's language, by plain translation (Orbit-Core's translate.js,
// Google's free month, never the AI's), only for what's on screen, never
// ahead (11-14: it cost too much). Two ways in, both POST /news-tr:
//   a list's titles   the ones drawn waiting (`data-trid`), one batch of up
//                     to BATCH, asked a moment after a list is drawn;
//   a story's texts   its outlets' headlines, its summary, its clips'
//                     titles, as its sheet shows them.
// Each is made once on the server; here the answers are kept on the phone
// (TR_KEY). The outlet's own words show till an answer comes, and stay if
// none can be had (none left this month, offline).
import { API } from '#kit/domain.mjs';

const HAN = /[㐀-鿿]/;
// Whether a text is in the other language from the reader's.
export const foreign = (text, en) => Boolean(text) && HAN.test(text) === Boolean(en);

// The translations this phone has, by the text they're of (the newest KEEP kept on the phone).
export const BATCH = 30;
const KEEP = 400;
export const TR_KEY = 'news.tr.v1';
export const trCache = new Map();
try {
  for (const [k, v] of JSON.parse(globalThis.localStorage?.getItem(TR_KEY) || '[]')) if (typeof k === 'string' && typeof v === 'string') trCache.set(k, v);
} catch {}
const keep = () => {
  while (trCache.size > KEEP) trCache.delete(trCache.keys().next().value);
  try {
    globalThis.localStorage?.setItem(TR_KEY, JSON.stringify([...trCache]));
  } catch {}
};
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
    if (n) keep();
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
    delete el.dataset.trid;
    n++;
  }
  return n;
}
// The texts drawn waiting for theirs.
export const trWaiting = root => [...(root?.querySelectorAll?.('[data-tr]:not([data-trid])') || [])].map(el => el.dataset.tr);

// A list's titles drawn waiting (`data-trid` the story, `data-tr` its title): asked in one batch,
// each once a session (asked again only if the ask failed); → how many came.
export async function askTitles(root, en, { fetchImpl = globalThis.fetch } = {}) {
  const items = new Map();
  for (const el of root?.querySelectorAll?.('[data-trid]') || []) {
    const t = el.dataset.tr;
    if (items.size >= BATCH) break;
    if (t && el.dataset.trid && foreign(t, en) && !trCache.has(t) && !asked.has(`title\n${t}`)) items.set(t, el.dataset.trid);
  }
  if (!items.size || !fetchImpl) return 0;
  for (const t of items.keys()) asked.add(`title\n${t}`);
  try {
    const r = await fetchImpl(`${API}/news-tr`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to: en ? 'en' : 'zh-TW', items: [...items].map(([t, id]) => ({ id, texts: [t] })) }) });
    if (!r.ok) return 0;
    const j = await r.json();
    let n = 0;
    for (const [src, v] of Object.entries(j?.tr || {})) if (typeof v === 'string' && v.trim() && !foreign(v, en)) trCache.set(src, v.trim()), n++;
    if (n) keep();
    return n;
  } catch {
    for (const t of items.keys()) asked.delete(`title\n${t}`);
    return 0;
  }
}

// Titles waiting are asked for a moment after the page last changed, and swapped in place when they come.
export function watchTitles(root, en) {
  let t = 0;
  const go = () => {
    clearTimeout(t);
    t = setTimeout(() => askTitles(root, en).then(n => n && trPaint(root, en)), 400);
  };
  new MutationObserver(go).observe(root, { childList: true, subtree: true });
  go();
}
