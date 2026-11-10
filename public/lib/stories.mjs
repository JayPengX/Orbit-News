// The stories as the builder wrote them (Orbit-Core builders/news.js →
// news/index.json: { built, tw: [story], intl: [story] }, the stories heard
// of in the last 3 days, most important first; news/past.json the same for
// older ones kept, by importance), read for the screens. A story: { id,
// title, by, sum, sumBy, img, imgBy, at, first, n (outlets), m (headlines),
// days: [['MM-DD', headlines]], sides, blind, parties, topics, imp, clips:
// [[outlet, youtubeId or '', url, title, picture]], items: [[outlet,
// headline, url, at, video?]] }.
import { sideOf, SIDES, outletOf } from '#kit/news-outlets.mjs';

export const REGIONS = ['tw', 'intl'];
// The two ends of a region's line (the middle is c).
export const ENDS = { tw: ['g', 'b'], intl: ['l', 'r'] };

const web = u => /^https?:\/\//.test(u || '');
// A page as read: anything not a story list left out, each story checked
// (its headlines and clips from known outlets, a clip's id YouTube's shape).
export function cleanPage(x) {
  const page = { built: Number(x?.built) || 0, tw: [], intl: [] };
  for (const r of REGIONS)
    for (const s of Array.isArray(x?.[r]) ? x[r] : [])
      if (s && typeof s.id === 'string' && typeof s.title === 'string' && Array.isArray(s.items))
        page[r].push({
          ...s,
          region: r,
          topics: Array.isArray(s.topics) ? s.topics.filter(t => typeof t === 'string') : [],
          days: Array.isArray(s.days) ? s.days.filter(d => Array.isArray(d) && typeof d[0] === 'string') : [],
          clips: (Array.isArray(s.clips) ? s.clips : []).filter(c => Array.isArray(c) && outletOf(c[0]) && /^(?:[\w-]{11})?$/.test(c[1] ?? 'x') && web(c[2])),
          items: s.items.filter(it => Array.isArray(it) && outletOf(it[0]) && web(it[2]))
        });
  return page;
}

// A story by its id, on the page or among the past's.
export const storyById = (page, id, past = null) => [page, past].flatMap(p => REGIONS.map(r => p?.[r]?.find(s => s.id === id))).find(Boolean) || null;

// The stories on a topic ('all': every one), in the builder's order.
export const onTopic = (stories, topic) => (topic === 'all' ? stories : topic === 'video' ? stories.filter(s => s.clips?.length) : stories.filter(s => s.topics?.includes(topic)));
// The topics these stories have, most stories first: [[topic, count]].
export function topicsIn(stories) {
  const n = new Map();
  for (const s of stories) for (const t of s.topics || []) n.set(t, (n.get(t) || 0) + 1);
  return [...n].sort((a, b) => b[1] - a[1]);
}
// Clips to watch: each story's first YouTube clip, stories in order, `most` at most.
export function clipsOf(stories, most = 12) {
  const out = [];
  for (const s of stories) {
    const c = s.clips?.find(x => x[1]);
    if (c) out.push({ story: s, clip: c });
    if (out.length >= most) break;
  }
  return out;
}
// How long a story has run, in days: 1 under a day from its first headline
// to its latest, 2 under two… (a night and its morning are one).
export const daysOf = story => Math.max(1, Math.floor(((story.at || 0) - (story.first || story.at || 0)) / 86_400_000) + 1);

// The bar: each side of the region with its count and share (of the outlets
// with a side), in the line's order; `rated` how many have one.
export function barOf(story) {
  const order = SIDES[story.region] || SIDES.tw;
  const counts = order.map(s => [s, Number(story.sides?.[s]) || 0]);
  const rated = counts.reduce((a, [, n]) => a + n, 0);
  return { rated, parts: counts.map(([side, n]) => ({ side, n, share: rated ? n / rated : 0 })) };
}

// A story's headlines by side: { <side>: [[outlet, headline, url, at]…], none: […] },
// each side's outlets newest first, an outlet's headlines together.
export function bySide(story) {
  const out = Object.fromEntries([...(SIDES[story.region] || SIDES.tw), 'none'].map(s => [s, []]));
  for (const it of story.items) out[sideOf(it[0], story.region) || 'none'].push(it);
  for (const k of Object.keys(out)) {
    const newest = new Map();
    for (const it of out[k]) newest.set(it[0], Math.max(newest.get(it[0]) || 0, it[3] || 0));
    out[k].sort((a, b) => newest.get(b[0]) - newest.get(a[0]) || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : (b[3] || 0) - (a[3] || 0)));
  }
  return out;
}

// The outlets of a story, one each, in the order their headlines come.
export const outletsOf = story => [...new Set(story.items.map(it => it[0]))];


// The one-sided stories (the builder's `blind`: carried by one end, none of
// the other), grouped by the side that left them out, widest first:
// [{ region, missing, stories }], only groups with any.
export function oneSided(page) {
  const out = [];
  for (const region of REGIONS)
    for (const missing of ENDS[region]) {
      const stories = (page?.[region] || []).filter(s => s.blind === missing).sort((a, b) => b.n - a.n || b.at - a.at);
      if (stories.length) out.push({ region, missing, stories });
    }
  return out;
}

// The stories one outlet is in, newest first.
export function storiesWith(page, outlet) {
  const region = outletOf(outlet)?.region;
  return (page?.[region] || []).filter(s => s.items.some(it => it[0] === outlet)).sort((a, b) => b.at - a.at);
}

// How long ago, in the page's words: 剛剛, 12 分鐘前, 3 小時前, 2 天前.
export function agoOf(at, now, en = false) {
  const m = Math.max(0, Math.round((now - at) / 60_000));
  if (m < 2) return en ? 'just now' : '剛剛';
  if (m < 60) return en ? `${m} min ago` : `${m} 分鐘前`;
  const h = Math.round(m / 60);
  if (h < 24) return en ? `${h} hr ago` : `${h} 小時前`;
  const d = Math.round(h / 24);
  return en ? `${d} day${d === 1 ? '' : 's'} ago` : `${d} 天前`;
}
