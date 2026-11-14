// 重點整理 and 各方怎麼說 on a tap (Orbit-Core's ai-open.js; Jay 11-14: "make
// AI feature like this a button to click like we do in orbit law, never spend
// a penny on AI on things user didn't interact with"): nothing is made ahead
// or on opening a story. The first reader's tap makes it (a few seconds, its
// shape shown meanwhile), everyone's tap after gets the kept one at once.
// Asked once a story a visit. → { out } | { error } (kit ai.mjs aiSays).
import { API } from '#kit/domain.mjs';

// The topics sides frame and the two ends that must both carry the story
// (Orbit-Core's builders/ai.js sidesWanted): only those are asked for sides.
const FRAMED = new Set(['pol', 'cs', 'world', 'def', 'law']);
const ENDS = { tw: ['g', 'b'], intl: ['l', 'r'] };
export const sidesAsked = s => (s?.topics || []).some(t => FRAMED.has(t)) && ENDS[s?.region === 'intl' ? 'intl' : 'tw'].every(k => (s.sides?.[k] || 0) > 0);
// (Three outlets at least: builders/ai.js briefWanted.)
export const briefAsked = s => (s?.n || 0) >= 3;

// Asked with the reader's Pass session (the kit's workerJson): only a pass
// with Orbit AI has one made (Orbit-Core eco.js levelOf); a kept one is
// anyone's. (`fetchImpl`: the tests' own, unsigned.)
const asked = new Map();
export function openAi(f, id, { fetchImpl = null, timeoutMs = 30_000 } = {}) {
  const k = `${f}|${id}`;
  const query = `f=${encodeURIComponent(f)}&id=${encodeURIComponent(id)}`;
  const ask = fetchImpl
    ? () => fetchImpl(`${API}/ai/open?${query}`, { signal: AbortSignal.timeout?.(timeoutMs) }).then(r => r.json().catch(() => ({})).then(j => (r.ok ? j : { error: 'upstream', ...j })))
    : () => import('#kit/orbit.mjs').then(kit => kit.workerJson('/ai/open', query, { timeout: timeoutMs, errors: true }));
  if (!asked.has(k))
    asked.set(
      k,
      Promise.resolve()
        .then(ask)
        .then(j => (j?.out ? { out: j.out } : { error: j?.error || (globalThis.navigator?.onLine === false ? 'offline' : 'upstream') }))
        .catch(() => ({ error: 'upstream' }))
        // (A failure isn't kept: the next tap asks again.)
        .then(r => (r.out || asked.delete(k), r))
    );
  return asked.get(k);
}
