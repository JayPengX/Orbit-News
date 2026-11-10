// 我的閱讀: which outlets the person opened, a day at a time, never which
// article. The app's payload on the Orbit Pass (`news`), kept on the phone
// too; two copies merge by taking each day's larger count for each outlet
// (a tap counted on one phone is never counted twice, nor lost).
//
//   { v: 1, days: { 'YYYY-MM-DD': { <outlet id>: <taps> } } }
import { sideOf, SIDES, outletOf } from '#kit/news-outlets.mjs';

export const LOG_VERSION = 1;
// Days kept: a balance reads 30; the rest is a margin for a phone that was away.
export const KEEP_DAYS = 60;
export const emptyLog = () => ({ v: LOG_VERSION, days: {} });

const isDay = d => /^\d{4}-\d{2}-\d{2}$/.test(d);
const count = n => (Number.isFinite(n) && n > 0 ? Math.min(Math.floor(n), 999) : 0);

// A log from anything (a payload's JSON, an older copy): only what's sound kept.
export function cleanLog(x) {
  const log = emptyLog();
  const days = x && typeof x === 'object' && x.days && typeof x.days === 'object' ? x.days : {};
  for (const [day, outlets] of Object.entries(days)) {
    if (!isDay(day) || !outlets || typeof outlets !== 'object') continue;
    const kept = {};
    for (const [o, n] of Object.entries(outlets)) if (outletOf(o) && count(n)) kept[o] = count(n);
    if (Object.keys(kept).length) log.days[day] = kept;
  }
  return log;
}

export function decodeLog(payload) {
  if (payload == null || payload === '') return emptyLog();
  try {
    const x = typeof payload === 'string' ? JSON.parse(payload) : payload;
    return x && typeof x === 'object' ? cleanLog(x) : null;
  } catch {
    return null;
  }
}
export const encodeLog = log => JSON.stringify(cleanLog(log));

export function mergeLogs(a, b) {
  const out = cleanLog(a);
  for (const [day, outlets] of Object.entries(cleanLog(b).days)) {
    const mine = (out.days[day] ||= {});
    for (const [o, n] of Object.entries(outlets)) mine[o] = Math.max(mine[o] || 0, n);
  }
  return out;
}

const dayNum = d => Date.parse(`${d}T00:00:00Z`) / 86_400_000;
// Only the last KEEP_DAYS days to `today`.
export function trimLog(log, today, keep = KEEP_DAYS) {
  const t = dayNum(today);
  for (const day of Object.keys(log.days)) if (t - dayNum(day) >= keep) delete log.days[day];
  return log;
}

// One tap on an outlet's headline, on `day`.
export function addRead(log, outlet, day) {
  if (!outletOf(outlet) || !isDay(day)) return log;
  const d = (log.days[day] ||= {});
  d[outlet] = Math.min((d[outlet] || 0) + 1, 999);
  return log;
}

// The balance over the `days` days to `today`, for one region: each side's
// taps, those of outlets with no side (unrated, state media) apart, and the
// outlets by taps, most first.
export function balanceOf(log, region, today, days = 30) {
  const t = dayNum(today);
  const sides = Object.fromEntries(SIDES[region].map(s => [s, 0]));
  let none = 0;
  const by = new Map();
  for (const [day, outlets] of Object.entries(log?.days || {})) {
    if (t - dayNum(day) >= days || dayNum(day) > t) continue;
    for (const [o, n] of Object.entries(outlets)) {
      const out = outletOf(o);
      if (!out || out.region !== region) continue;
      const s = sideOf(out, region);
      if (s) sides[s] += n;
      else none += n;
      by.set(o, (by.get(o) || 0) + n);
    }
  }
  const total = Object.values(sides).reduce((a, b) => a + b, 0);
  return { sides, none, total, outlets: [...by].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)) };
}

// What the balance says in one line: which side most of it is, or even.
// → { lean: side | '' (even) | null (too few to say), share (0–1) }
export function leanOf({ sides, total }, min = 5) {
  if (total < min) return { lean: null, share: 0 };
  const [top, n] = Object.entries(sides).sort((a, b) => b[1] - a[1])[0];
  return n / total >= 0.6 ? { lean: top, share: n / total } : { lean: '', share: n / total };
}
