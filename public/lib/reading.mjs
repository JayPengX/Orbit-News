// 我的閱讀: which outlets the person opened, a day at a time, never which
// article; the stories they opened (read marks, Jay 11-13) and what they
// follow. The app's payload on the Orbit Pass (`news`), kept on the phone
// too; two copies merge by taking each day's larger count for each outlet
// (a tap counted on one phone is never counted twice, nor lost), each
// story's later read and each follow's later word (a follow let go is kept
// as let go, its time negative, so another phone's older copy can't bring
// it back).
//
//   { v: 1, days: { 'YYYY-MM-DD': { <outlet id>: <taps> } },
//     read: { <story id>: [minute read, headlines then, outlets then] },
//     follow: { <key>: minute followed (negative: let go then) } }
// A follow's key: 'w:<words>' (a person, a company, any words: found as a
// search finds them), 't:<topic id>', 'o:<outlet id>'.
import { sideOf, SIDES, outletOf } from '#kit/news-outlets.mjs';

export const LOG_VERSION = 1;
// Days kept: a balance reads 30; the rest is a margin for a phone that was away.
export const KEEP_DAYS = 60;
export const emptyLog = () => ({ v: LOG_VERSION, days: {}, read: {}, follow: {} });
// Read marks kept: 30 days (a story lives a month at most), the newest 600.
export const READ_DAYS = 30;
export const READ_MOST = 600;
// A follow let go is remembered this long (another phone's older copy is
// merged within it), then forgotten.
const GONE_DAYS = 90;
const MIN = 60_000;
const isMinute = t => Number.isInteger(t) && t > 0 && t < 1e9;
export const followKey = (kind, id) => `${kind}:${String(id).trim()}`;
const KEY = /^(?:w:.{1,40}|t:[a-z]{2,8}|o:[\w-]{1,30})$/su;

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
  const read = x?.read && typeof x.read === 'object' ? x.read : {};
  for (const [id, m] of Object.entries(read))
    if (/^\w{1,16}$/.test(id) && Array.isArray(m) && isMinute(m[0])) log.read[id] = [m[0], count(m[1]), count(m[2])];
  const follow = x?.follow && typeof x.follow === 'object' ? x.follow : {};
  for (const [k, t] of Object.entries(follow)) if (KEY.test(k) && (k[0] !== 'o' || outletOf(k.slice(2))) && isMinute(Math.abs(t))) log.follow[k] = t;
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
  const theirs = cleanLog(b);
  for (const [id, m] of Object.entries(theirs.read)) if (!out.read[id] || out.read[id][0] < m[0]) out.read[id] = m;
  for (const [k, t] of Object.entries(theirs.follow)) if (!(k in out.follow) || Math.abs(out.follow[k]) < Math.abs(t)) out.follow[k] = t;
  return out;
}

const dayNum = d => Date.parse(`${d}T00:00:00Z`) / 86_400_000;
// Only the last KEEP_DAYS days to `today`.
export function trimLog(log, today, keep = KEEP_DAYS) {
  const t = dayNum(today);
  for (const day of Object.keys(log.days)) if (t - dayNum(day) >= keep) delete log.days[day];
  // (Read marks a month and the newest READ_MOST; a let-go follow GONE_DAYS.)
  const now = (t + 1) * 1440;
  const marks = Object.entries(log.read || {}).filter(([, m]) => now - m[0] < READ_DAYS * 1440).sort((a, b) => b[1][0] - a[1][0]).slice(0, READ_MOST);
  log.read = Object.fromEntries(marks);
  for (const [k, at] of Object.entries(log.follow || {})) if (at < 0 && now + at > GONE_DAYS * 1440) delete log.follow[k];
  return log;
}

// ---- Read marks ----

// A story opened (its sheet), at `now`: marked read with how big it was then.
export function markRead(log, story, now = Date.now()) {
  if (!story?.id) return log;
  log.read[story.id] = [Math.floor(now / MIN), count(story.m || story.items?.length || 0), count(story.n || 0)];
  return log;
}
// How far a story has come since it was read: '' never opened, 'read', or
// 'new' (a big development since: half as many headlines again and 4 at
// least, a third more outlets and 3 at least, or breaking now over 2 hours
// after it was read). `live`: it's breaking now (lib/stories.mjs isLive).
export function readState(log, story, { now = Date.now(), live = false } = {}) {
  const mark = story?.id && log?.read?.[story.id];
  if (!mark) return '';
  const [t, m, n] = mark;
  const moreHeads = (story.m || 0) - m >= Math.max(4, Math.ceil(m * 0.5));
  const moreOutlets = (story.n || 0) - n >= Math.max(3, Math.ceil(n / 3));
  const later = (story.at || 0) > t * MIN;
  return later && (moreHeads || moreOutlets || (live && now - t * MIN > 2 * 3_600_000)) ? 'new' : 'read';
}

// ---- Follows ----

// What's followed, the newest first: [{ key, kind: 'w' | 't' | 'o', id }].
export const followsOf = log =>
  Object.entries(log?.follow || {})
    .filter(([, t]) => t > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => ({ key, kind: key[0], id: key.slice(2) }));
export const following = (log, key) => (log?.follow?.[key] || 0) > 0;
// Follow or let go, at `now` (a let-go kept as one, so it stays gone on every phone).
export function setFollow(log, key, on, now = Date.now()) {
  if (!KEY.test(key)) return log;
  log.follow[key] = (on ? 1 : -1) * Math.floor(now / MIN);
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
