// The stories as the builder wrote them (Orbit-Core builders/news.js →
// news/index.json: { built, tw: [story], intl: [story] }), read for the
// screens. A story: { id, title, by, sum, sumBy, img, imgBy, at, first, n,
// sides, blind, parties, items: [[outlet, headline, url, at]] }.
import { sideOf, SIDES, outletOf } from '#kit/news-outlets.mjs';

export const REGIONS = ['tw', 'intl'];
// The two ends of a region's line (the middle is c).
export const ENDS = { tw: ['g', 'b'], intl: ['l', 'r'] };

// A page as read: anything not a story list left out, each story checked.
export function cleanPage(x) {
  const page = { built: Number(x?.built) || 0, tw: [], intl: [] };
  for (const r of REGIONS)
    for (const s of Array.isArray(x?.[r]) ? x[r] : [])
      if (s && typeof s.id === 'string' && typeof s.title === 'string' && Array.isArray(s.items)) page[r].push({ ...s, region: r, items: s.items.filter(it => Array.isArray(it) && outletOf(it[0]) && /^https?:\/\//.test(it[2] || '')) });
  return page;
}

export const storyById = (page, id) => REGIONS.map(r => page?.[r]?.find(s => s.id === id)).find(Boolean) || null;

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

// A list in one order: 'wide' (the builder's: most outlets, fading with
// age) or 'new' (the latest headline first).
export function ordered(stories, how = 'wide') {
  return how === 'new' ? [...stories].sort((a, b) => b.at - a.at) : stories;
}

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
