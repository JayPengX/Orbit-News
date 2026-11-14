// The stories as the builder wrote them (Orbit-Core builders/news.js →
// news/index.json: { built, tw: [story], intl: [story] }, the stories heard
// of in the last 3 days, most important first; news/past.json the same for
// older ones kept, by importance), read for the screens. A story: { id,
// title, by, sum, sumBy, img, imgBy, alts (others: [[picture, outlet]]), at,
// first, n (outlets), m (headlines),
// days: [['MM-DD', headlines]], sides, blind, parties, topics, imp, clips:
// [[outlet, youtubeId or '', url, title, picture]], items: [[outlet,
// headline, url, at, video?]] }.
import { sideOf, SIDES, outletOf } from '#kit/news-outlets.mjs';
import * as kitNews from '#kit/news-outlets.mjs';
import * as kitSport from './leagues.mjs';
import { heavy, notPicture } from './pics.mjs';

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
          items: s.items.filter(it => Array.isArray(it) && outletOf(it[0]) && web(it[2])),
          // (Other outlets' pictures, should its own not load.)
          alts: (Array.isArray(s.alts) ? s.alts : []).filter(p => Array.isArray(p) && /^https:\/\//.test(p[0] || '') && outletOf(p[1])),
          // (Taiwan's outlets on a world story: their own count and headlines.)
          tw: twOf(s.tw)
        });
  return page;
}

// Taiwan's outlets on a world story ({ n, sides: { g, c, b }, items }), or null.
function twOf(t) {
  const items = (Array.isArray(t?.items) ? t.items : []).filter(it => Array.isArray(it) && outletOf(it[0])?.region === 'tw' && web(it[2]));
  if (!items.length) return null;
  const sides = { g: 0, c: 0, b: 0 };
  for (const o of new Set(items.map(it => it[0]))) {
    const s = sideOf(o, 'tw');
    if (s) sides[s]++;
  }
  return { n: new Set(items.map(it => it[0])).size, sides, items };
}
// A story shown under one of its topics, that topic first: its tag is the
// tab's (Jay 11-10: 健康's list said 生活, 社會).
export const asTopic = (story, topic) => (!topic || topic === 'all' || topic === 'video' || story.topics?.[0] === topic ? story : { ...story, topics: [topic, ...(story.topics || []).filter(t => t !== topic)] });
// A topic's tab needs this many stories; fewer, it isn't offered.
export const TAB_MIN = 3;
// A story's pictures in the order a phone tries them: its own, then each
// other outlet's (the builder's alts), each address once (Jay 11-11: one
// outlet's picture that wouldn't load left an empty space).
// (A video's stream address left out. `light`, for a row's small picture:
// the few outlets whose pictures run to hundreds of KB or megabytes with no
// smaller size, lib/pics.mjs `heavy`, asked after the rest; a lead keeps the
// builder's order, a press photo over a clip's still.)
export const picturesOf = (story, { light = false } = {}) => {
  const seen = new Set();
  const all = [story?.img && [story.img, story.imgBy || ''], ...(story?.alts || [])].filter(p => p?.[0] && !notPicture(p[0]) && !seen.has(p[0]) && seen.add(p[0]));
  return light ? [...all.filter(p => !heavy(p[0])), ...all.filter(p => heavy(p[0]))] : all;
};

// 快訊: a story the builder found breaking (many outlets on it in the last
// 2 hours, `live`), while the page is fresh (built within the hour) and the
// story was heard of in the last 2 hours: a page left open overnight isn't breaking.
export const LIVE_FRESH = 60 * 60_000;
export const isLive = (story, built, now = Date.now()) => Boolean(story?.live > 0 && built && now - built <= LIVE_FRESH && now - (story.at || 0) <= 2 * LIVE_FRESH);
// The page's breaking stories, both regions, the most outlets first.
export const liveOf = (page, now = Date.now()) =>
  REGIONS.flatMap(r => (page?.[r] || []).filter(s => isLive(s, page.built, now))).sort((a, b) => b.live - a.live);

// One story told twice (Jay 11-12: 黃仁勳's resignation was a Taiwan story, its
// world story and the board's earlier Taiwan story, side by side on 頭條): a
// Taiwan story on a world story (its `world`), or two Taiwan stories on the same
// one, and their headlines share a name (three Chinese characters running: 黃仁勳).
// (The builder's join to a world story is loose, so the shared words decide.)
// `zhOf(story)`: a world story's Chinese title (the AI's), '' when none.
const grams = t => {
  const out = new Set();
  for (const run of String(t || '').match(/[\u4e00-\u9fff]{3,}/g) || []) for (let i = 0; i + 3 <= run.length; i++) out.add(run.slice(i, i + 3));
  return out;
};
export function sameSaga(a, b, zhOf = () => '') {
  if (!a || !b || a.id === b.id) return Boolean(a && b);
  const tw = a.region === 'tw' ? a : b;
  const other = tw === a ? b : a;
  const linked = tw.region === 'tw' && tw.world && (other.region === 'intl' ? tw.world === other.id : other.world === tw.world);
  if (!linked) return false;
  const mine = grams(tw.title);
  const theirs = other.region === 'intl' ? zhOf(other) : other.title;
  return [...grams(theirs)].some(g => mine.has(g));
}
// The stories, each saga once (the first of it kept), past those already `shown`.
export function oneASaga(stories, shown = [], zhOf) {
  const kept = [...shown];
  const out = [];
  for (const s of stories) {
    if (!s || kept.some(k => sameSaga(s, k, zhOf))) continue;
    kept.push(s);
    out.push(s);
  }
  return out;
}

// A story by its id, on the page or among the past's.
// (`more`: the past's stories, Sports' sports reports, looked through after the page.)
export const storyById = (page, id, ...more) => [page, ...more].flatMap(p => REGIONS.map(r => p?.[r]?.find(s => s.id === id))).find(Boolean) || null;

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

// A story's headlines by side: { <side>: [[outlet, headline, url, at]…], none: […], free: […] },
// each side's outlets newest first, an outlet's headlines together. none:
// China's state media; free: an outlet on no scale, a sports outlet (Jay
// 11-14: "let them be alone"), listed with the rest where sides aren't taken.
export function bySide(story) {
  const out = Object.fromEntries([...(SIDES[story.region] || SIDES.tw), 'none', 'free'].map(s => [s, []]));
  for (const it of story.items) out[sideOf(it[0], story.region) || (outletOf(it[0])?.kind === 'state' ? 'none' : 'free')].push(it);
  for (const k of Object.keys(out)) {
    const newest = new Map();
    for (const it of out[k]) newest.set(it[0], Math.max(newest.get(it[0]) || 0, it[3] || 0));
    out[k].sort((a, b) => newest.get(b[0]) - newest.get(a[0]) || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : (b[3] || 0) - (a[3] || 0)));
  }
  return out;
}

// The outlets of a story, one each, in the order their headlines come.
export const outletsOf = story => [...new Set((story.items || []).map(it => it[0]))];
// How many of them are China's state media (on no side: counted apart).
export const stateMedia = story => outletsOf(story).filter(o => outletOf(o)?.kind === 'state').length;
// A story of a kind sides take (politics, the economy…), not one past them
// (life, health, science, culture, sport: the kit's TOPICS `spectrum: false`).
const SPECTRUM = new Set((kitNews.TOPICS || []).filter(t => t.spectrum !== false).map(t => t.id));
export const sidesTaken = story => !story.topics?.length || story.topics.some(t => SPECTRUM.has(t) || !(kitNews.TOPICS || []).some(x => x.id === t));

// The one-sided stories (the builder's `blind`: carried by one end, none of
// the other), grouped by the side that left them out, widest first:
// [{ region, missing, stories }], only groups with any.
export function oneSided(page, topic = 'all') {
  const out = [];
  for (const region of REGIONS)
    for (const missing of ENDS[region]) {
      const stories = onTopic(page?.[region] || [], topic).filter(s => s.blind === missing).sort((a, b) => b.n - a.n || b.at - a.at);
      if (stories.length) out.push({ region, missing, stories });
    }
  return out;
}

// Every one-sided story, Taiwan's and the world's, widest first.
export const blindAll = page => REGIONS.flatMap(r => (page?.[r] || []).filter(s => s.blind)).sort((a, b) => b.n - a.n || b.at - a.at);
// Stories by kind, `order` the kinds' order: [[topic, stories]], each story
// once, under the first of its topics in `order`; only kinds with any.
export function byKind(stories, order) {
  const m = new Map(order.map(t => [t, []]));
  for (const s of stories) {
    const t = (s.topics || []).find(x => m.has(x));
    if (t) m.get(t).push(s);
  }
  return [...m].filter(([, list]) => list.length);
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

// ---- 相關新聞 and 來龍去脈 (Jay 11-13: "make it more in app") ----

// A line's terms: Chinese as two-character pieces, English as words of four
// letters or more (the commonest left out).
const EN_STOP = new Set('says told amid near more less back down take takes calls call make makes made plan plans wants want that this with from have been will what when where which their they them than then into over after about says said more most just also amid could would should report reports news live update updates video watch here year years week first last over'.split(' '));
export function termsOf(text) {
  const out = new Set();
  const s = String(text || '');
  for (const run of s.match(/[一-鿿]{2,}/g) || []) for (let i = 0; i + 2 <= run.length; i++) out.add(run.slice(i, i + 2));
  for (const w of s.toLowerCase().match(/[a-z][a-z'-]{3,}/g) || []) if (!EN_STOP.has(w)) out.add(w.replace(/'s$/, ''));
  return out;
}
// A story's terms: its headline and its outlets' first few.
const storyTerms = s => termsOf([s.title, ...(s.items || []).slice(0, 8).map(it => it[1])].join(' '));

// The stories most like this one (shared rare terms, its own region's; a
// Taiwan story's world story and the other way round a little nearer), `most`
// at most, the nearest first: [{ story, link }] (`link`: the builder joined
// them). `pages`: the page and the past (either may be null).
const isSport = s => s.topics?.[0] === 'sport';
const leagues = new WeakMap();
const leagueOf = s => (leagues.has(s) ? leagues.get(s) : (leagues.set(s, kitSport.leagueOf?.(s) || ''), leagues.get(s)));
export function relatedOf(story, pages, { most = 4, min = 0.2 } = {}) {
  if (!story) return [];
  const all = [];
  const seen = new Set([story.id]);
  for (const p of pages) for (const r of REGIONS) for (const s of p?.[r] || []) if (!seen.has(s.id)) (seen.add(s.id), all.push(s));
  // (How rare each term is among all the stories: 台灣 or 表示 tell little.)
  const terms = new Map(all.map(s => [s, storyTerms(s)]));
  const mine = storyTerms(story);
  const df = new Map();
  for (const t of mine) df.set(t, 0);
  for (const set of terms.values()) for (const t of set) if (df.has(t)) df.set(t, df.get(t) + 1);
  const idf = t => Math.log((all.length + 1) / ((df.get(t) || 0) + 1));
  const norm = set => Math.sqrt([...set].reduce((a, t) => a + (df.has(t) ? idf(t) ** 2 : 1), 0)) || 1;
  const mineNorm = norm(mine);
  const out = [];
  for (const s of all) {
    const set = terms.get(s);
    let dot = 0;
    for (const t of set) if (mine.has(t)) dot += idf(t) ** 2;
    // (Only a direct join: many Taiwan stories hang loosely on one world story.)
    const link = s.id === story.world || s.world === story.id;
    if (!link && s.region !== story.region) continue;
    // (A game's related are its league's, a sport's never another's: a judo
    // final under 七六人 v 暴龍 shared only 「上演…逆轉」, Jay 11-14. And a
    // sports story is no other story's.)
    if (!link && isSport(s) !== isSport(story)) continue;
    if (!link && isSport(story) && leagueOf(s) !== leagueOf(story)) continue;
    const score = dot / (mineNorm * norm(set)) + (link ? 0.1 : 0);
    if (score >= min) out.push({ story: s, link: Boolean(link), score });
  }
  return out.sort((a, b) => b.score - a.score || (b.story.imp || 0) - (a.story.imp || 0)).slice(0, most);
}

// 來龍去脈: how a story went, a line a turn: its first report, then each
// later day's (or, on a story of one day, each few hours') headline that
// the most outlets' say alike and that adds the most past what came before,
// with how many headlines that turn had. `most` lines at most (the first and
// the latest always). → [{ at, outlet, title, url, n }], [] when it never moved on.
const TW_MS = 8 * 3_600_000;
export function timelineOf(story, { most = 6 } = {}) {
  // (A time at Taiwan's midnight on the dot is a feed that gave only the day.)
  const items = (story?.items || []).filter(it => it[3] > 0 && (it[3] + TW_MS) % 86_400_000).slice().sort((a, b) => a[3] - b[3]);
  if (items.length < 3) return [];
  const span = items.at(-1)[3] - items[0][3];
  if (span < 6 * 3_600_000) return [];
  // (A day a turn past a day and a half; else three hours.)
  const size = span > 36 * 3_600_000 ? 86_400_000 : 3 * 3_600_000;
  const turns = new Map();
  for (const it of items) {
    const k = Math.floor((it[3] + TW_MS) / size);
    if (!turns.has(k)) turns.set(k, []);
    turns.get(k).push(it);
  }
  if (turns.size < 2) return [];
  const said = new Set();
  const out = [];
  let first = true;
  for (const group of turns.values()) {
    const sets = group.map(it => termsOf(it[1]));
    let best = 0;
    let bestScore = -Infinity;
    group.forEach((it, i) => {
      if (first) return;
      // (Said alike by the turn's others, new past what's been said.)
      const alike = sets.reduce((a, s, j) => (j === i ? a : a + [...sets[i]].filter(t => s.has(t)).length / (sets[i].size || 1)), 0);
      const fresh = [...sets[i]].filter(t => !said.has(t)).length / (sets[i].size || 1);
      const score = alike / Math.max(1, group.length - 1) + fresh;
      if (score > bestScore) (bestScore = score), (best = i);
    });
    const it = group[best];
    for (const t of sets[best]) said.add(t);
    out.push({ at: it[3], outlet: it[0], title: it[1], url: it[2], n: group.length });
    first = false;
  }
  if (out.length <= most) return out;
  // (Too many turns: the first, the latest, and the busiest between.)
  const mid = out.slice(1, -1).sort((a, b) => b.n - a.n).slice(0, most - 2);
  return [out[0], ...out.slice(1, -1).filter(x => mid.includes(x)), out.at(-1)];
}

// What's on screen keeps its place (Jay 11-13: opening News "get stuck a few
// seconds then reshuffle"): a list drawn again in the same opening keeps the
// order it was first drawn in, each story with its fresh numbers; a story
// gone leaves, a new one comes in at its own place. Ranked anew on a pull or
// the next opening. `held`: Map(list's key → its ids in order).
export function steady(held, key, list) {
  const was = held.get(key);
  if (!was) {
    held.set(key, list.map(s => s.id));
    return list;
  }
  const pos = new Map(was.map((id, i) => [id, i]));
  const out = list.filter(s => pos.has(s.id)).sort((a, b) => pos.get(a.id) - pos.get(b.id));
  list.forEach((s, i) => !pos.has(s.id) && out.splice(Math.min(i, out.length), 0, s));
  held.set(key, out.map(s => s.id));
  return out;
}
