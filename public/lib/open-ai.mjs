// 重點整理 and 各方怎麼說 made when a story is first opened (Orbit-Core's
// ai-open.js; Jay 11-14: "only spend it as I use it but kept fast enough"):
// nothing is made ahead for stories nobody reads. The first reader's open
// makes it (a few seconds, its shape shown meanwhile), everyone after gets
// the kept one at once. Asked once a story a visit; null when there's none.
import { API } from '#kit/domain.mjs';

// The topics sides frame and the two ends that must both carry the story
// (Orbit-Core's builders/ai.js sidesWanted): only those are asked for sides.
const FRAMED = new Set(['pol', 'cs', 'world', 'def', 'law']);
const ENDS = { tw: ['g', 'b'], intl: ['l', 'r'] };
export const sidesAsked = s => (s?.topics || []).some(t => FRAMED.has(t)) && ENDS[s?.region === 'intl' ? 'intl' : 'tw'].every(k => (s.sides?.[k] || 0) > 0);
// (Three outlets at least: builders/ai.js briefWanted.)
export const briefAsked = s => (s?.n || 0) >= 3;

const asked = new Map();
export function openAi(f, id, { fetchImpl = globalThis.fetch, timeoutMs = 30_000 } = {}) {
  const k = `${f}|${id}`;
  if (!asked.has(k))
    asked.set(
      k,
      Promise.resolve()
        .then(() => fetchImpl(`${API}/ai/open?f=${encodeURIComponent(f)}&id=${encodeURIComponent(id)}`, { signal: AbortSignal.timeout?.(timeoutMs) }))
        .then(r => (r.ok ? r.json() : null))
        .then(j => j?.out || null)
        .catch(() => null)
        // (A failure isn't kept: the next open asks again.)
        .then(out => (out || asked.delete(k), out))
    );
  return asked.get(k);
}
