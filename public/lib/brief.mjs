// 今天五則 (the AI plan's 每日五則, code first): a morning's five stories picked
// for this person, one line each (the headline), ready from 7:00 Taiwan time
// and kept all day, so the five don't shuffle while they're read. Picked by
// code: the day's order (the builder's weight) lifted by what the person
// opens (the kit's feedback.mjs, by topic and region) and by what they hold
// and follow (你關心的, lib/mine.mjs); never a story the page's top already
// shows; two at most from one topic, at most two of the world's. No AI, nothing sent.

// From this hour (Taiwan's) the day's five are ready.
export const BRIEF_HOUR = 7;
const TW = 8 * 3_600_000;
// Taiwan's day and hour of a moment.
export const twHour = now => new Date(now + TW).getUTCHours();
export const twDate = now => new Date(now + TW).toISOString().slice(0, 10);

// What a story is learnt by: its first two topics and its region.
export const keysOf = story => [...(story?.topics || []).slice(0, 2).map(t => `t:${t}`), story?.region ? `r:${story.region}` : null].filter(Boolean);
export const itemOf = story => ({ id: story.id, keys: keysOf(story) });

// The five: [{ story, why }] (`why`: what of theirs it's about, from `mine`).
//   page: { tw, intl }; skip: ids shown above; lift(item) → × (0.4–2.5);
//   mine: [{ story, why }] (你關心的).
export function briefOf(page, { skip = new Set(), lift = () => 1, mine = [], most = 5, perTopic = 2, perRegion = { tw: 4, intl: 2 } } = {}) {
  if (!page) return [];
  const whyOf = new Map(mine.map(m => [m.story.id, m.why]));
  const pool = [];
  // (Taiwan's top 40 and the world's top 20, by place: the first is worth most; the world's less.)
  const add = (list, n, w) =>
    (list || []).slice(0, n).forEach((story, i) => {
      if (!story?.id || skip.has(story.id)) return;
      const score = (w / (1 + 0.12 * i)) * lift(itemOf(story)) * (whyOf.has(story.id) ? 2 : 1);
      pool.push({ story, score });
    });
  add(page.tw, 40, 1);
  add(page.intl, 20, 0.6);
  pool.sort((a, b) => b.score - a.score);
  const out = [];
  const topics = new Map();
  const regions = new Map();
  for (const { story } of pool) {
    const t = story.topics?.[0] || '';
    const r = story.region || '';
    if (t && (topics.get(t) || 0) >= perTopic) continue;
    if ((regions.get(r) || 0) >= (perRegion[r] ?? 4)) continue;
    topics.set(t, (topics.get(t) || 0) + 1);
    regions.set(r, (regions.get(r) || 0) + 1);
    out.push({ story, why: whyOf.get(story.id) || null });
    if (out.length >= most) break;
  }
  return out;
}

// The day's five, kept: the ids picked at the first look after 7:00, read
// back all day (a story gone from the page is filled from a fresh pick).
// `kept`: { day, ids } or null; → { day, ids, list } or null before 7:00.
export function dayBrief(page, kept, now, opts = {}) {
  if (!page || twHour(now) < BRIEF_HOUR) return null;
  const day = twDate(now);
  const fresh = briefOf(page, opts);
  if (kept?.day !== day || !Array.isArray(kept.ids)) return { day, ids: fresh.map(x => x.story.id), list: fresh };
  const byId = new Map([...(page.tw || []), ...(page.intl || [])].map(s => [s.id, s]));
  const whyOf = new Map((opts.mine || []).map(m => [m.story.id, m.why]));
  const skip = opts.skip || new Set();
  const list = kept.ids.filter(id => byId.has(id) && !skip.has(id)).map(id => ({ story: byId.get(id), why: whyOf.get(id) || null }));
  for (const x of fresh) if (list.length < (opts.most || 5) && !list.some(y => y.story.id === x.story.id)) list.push(x);
  return { day, ids: list.map(x => x.story.id), list };
}
