// Orbit News: Taiwan's and the world's news, each story with every outlet
// that carries it, counted by side (the spectrum one feature). Five tabs:
// 頭條 (a front page: the lead stories swiped sideways, the top ones in
// pictures, clips, each topic's), 台灣, 國際 (by topic, a swipe to the next,
// most important first, then the older ones kept), 單邊 (stories only one
// side's outlets carry) and 媒體 (each outlet's place and why; your reading
// by side).
//
// This file starts the app, reads the stories and opens tabs; the screens
// are views/*.mjs. The stories are the builder's (Orbit-Core builders/news.js,
// every 10 minutes → R2 news/index.json and news/past.json, read through the
// proxy's /data/);
// the reading log is this app's payload on the Orbit Pass (`news`), kept on
// the phone too, merged with the Pass's copy before anything is written
// (the kit's pass-sync.mjs).
import * as kitUI from '#kit/ui.mjs';
import * as orbitKit from '#kit/orbit.mjs';
import { passSync } from '#kit/pass-sync.mjs';
import { orbitSession, tabBar, topActions, installGate, watchUpdates, keepOffline, storedAccount, cachedPayload, packJson } from '#kit/orbit.mjs';
import { state, hooks, lang, W, today } from './shell.mjs';
import { cleanPage } from './lib/stories.mjs';
import { cleanLines } from './lib/lines.mjs';
import { cleanTr } from './lib/tr.mjs';
import { cleanSides } from './lib/sides.mjs';
import { cleanMarkets } from './lib/markets.mjs';
import { cleanBriefs } from './lib/briefs.mjs';
import { interestsOf } from './lib/mine.mjs';
import { learnSet } from './lib/learn.mjs';
import { decodeLog, encodeLog, mergeLogs, trimLog, addRead, markRead, setFollow } from './lib/reading.mjs';
import { renderTop, renderRegion, renderSide, keptLists } from './views/lists.mjs';
import { renderOutlets } from './views/outlets.mjs';
import { openStory, warmStory } from './views/story.mjs';
import { stopVideo, videoPlaying } from './views/video.mjs';
import { searchFor } from './views/search.mjs';
import { askQuery } from './lib/search.mjs';
import { testPage, testFlags } from './lib/testing.mjs';

document.documentElement.lang = lang === 'en' ? 'en' : 'zh-Hant';
const $ = id => document.getElementById(id);
const TABS = ['top', 'tw', 'intl', 'side', 'outlets'];
const VIEWS = { top: renderTop, tw: box => renderRegion(box, 'tw'), intl: box => renderRegion(box, 'intl'), side: renderSide, outlets: renderOutlets };
const TITLES = { top: W('頭條', 'Top'), tw: W('台灣', 'Taiwan'), intl: W('國際', 'World'), side: W('單邊', 'One side'), outlets: W('媒體', 'Outlets') };
// (The app's own glyphs where the kit has none: an island, a globe, an eye
// half shut, outlets on a line.)
const TAB_ICONS = {
  top: 'home',
  tw: '<path d="M15.8 2.8c-2 .7-3.7 2-4.9 3.8-1.5 2.2-2.5 4.7-2.9 7.3-.3 2 .1 4 1 5.8.4.8.9 1.6 1.7 1.7.6-.7.8-1.6 1.2-2.4 1.1-2.2 2.6-4.3 3.6-6.6.9-2.1 1.5-4.4 1.4-6.7 0-1.1-.3-2.1-1.1-2.9z"/>',
  intl: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.3 2.4 3.5 5.2 3.5 8.5s-1.2 6.1-3.5 8.5c-2.3-2.4-3.5-5.2-3.5-8.5S9.7 5.9 12 3.5z"/>',
  side: '<path d="M2.5 12S6 5.5 12 5.5c1.6 0 3 .4 4.3 1.1M21.5 12S18 18.5 12 18.5c-1.6 0-3-.4-4.3-1.1"/><path d="M4.5 19.5 19.5 4.5"/>',
  outlets: '<path d="M3.5 12h17"/><circle cx="6" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="18" cy="12" r="2"/><path d="M6 6.5v-2M18 6.5v-2M12 19.5v-2"/>'
};
const VERSION = document.querySelector('meta[name="build-version"]')?.content || 'dev';
const PAGE = 'news/index.json';
const PAST = 'news/past.json';
const SPORT = 'news/sport.json';

const q = orbitSession('news', { lang });
// 今天五則 learns from what's opened and passed over (the kit's feedback.mjs, the
// family's one engine, kept on the Pass; loaded on the side: an older kit picks without it).
import('#kit/feedback.mjs')
  .then(m => {
    m.keep?.(q, 'news');
    state.fb = m;
  })
  .catch(() => {});

// ---- The reading log ----------------------------------------------------------------

let stamp = 1;
const LOCAL_KEY = 'orbit-news.log.v1';
function keepLocal() {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify({ account: storedAccount(), payload: encodeLog(state.log) }));
  } catch {}
}
function localCopy() {
  try {
    const kept = JSON.parse(localStorage.getItem(LOCAL_KEY) || 'null');
    return kept && kept.account === storedAccount() ? kept.payload : null;
  } catch {
    return null;
  }
}
const absorb = theirs => (state.log = trimLog(mergeLogs(state.log, theirs), today()));
const pass = passSync(q, {
  decode: decodeLog,
  encode: () => encodeLog(state.log),
  apply: theirs => {
    const was = encodeLog(state.log);
    absorb(theirs);
    keepLocal();
    // (Drawn again only when the Pass's copy changed the log: a whole front page each open for nothing, else.)
    if (encodeLog(state.log) === was) return;
    stamp++;
    if (state.tab === 'outlets' || state.tab === 'top') quietRefresh();
  }
});
let timer = 0;
function sync({ soon = false } = {}) {
  clearTimeout(timer);
  if (soon) return (timer = setTimeout(() => sync(), 4000));
  if (!state.loaded) return Promise.resolve();
  return pass.sync();
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') sync();
  else load();
});
// A headline opened: counted for its outlet today (the page itself isn't
// redrawn under the person; 我的閱讀 is when they're back).
hooks.read = outlet => {
  addRead(state.log, outlet, today());
  readLater();
  pass.changed();
  keepLocal();
  sync({ soon: true });
};
// A story opened in its sheet: marked read (its row dimmed once the sheet
// closes), with how big it was, so big news since shows as 新進展.
hooks.opened = story => {
  markRead(state.log, story);
  opened.add(story.id);
  readLater();
  pass.changed();
  keepLocal();
  sync({ soon: true });
};
// What's read never reorders the list under the reader (Jay 11-13: closing a
// story "reshuffle[d]" the list: a read story sinks, 你可能錯過 and 今天五則
// move on). A closed sheet dims the rows it opened, in place; the lists are
// ranked again with it only when drawn anew: another tab, a pull, new stories.
const opened = new Set();
let readWaiting = false;
const readLater = () => (readWaiting = true);
function dimOpened() {
  // (In the lists kept for another topic too: views/lists.mjs.)
  for (const id of opened) for (const root of [document, ...keptLists()]) for (const row of root.querySelectorAll(`[data-story="${CSS.escape(id)}"]`)) row.classList.add('nw-read');
  opened.clear();
}
// Followed or let go (lib/reading.mjs keys): kept on the Pass like the reading,
// and taught to 今天五則 (a topic followed lifts its stories).
hooks.follow = (key, on) => {
  setFollow(state.log, key, on);
  // (Following something lifts its stories now: the lists ranked anew.)
  state.held.clear();
  if (on && key.startsWith('t:')) state.fb?.did?.('news', [key], 3);
  logChanged();
  quietRefresh();
};
function logChanged() {
  stamp++;
  pass.changed();
  keepLocal();
  sync({ soon: true });
}
// (Something tapped on the list shown: that list drawn again, the others kept as they are.)
hooks.render = () => render();
// (What the lists were drawn from: views/lists.mjs keeps each topic's list till it changes.)
hooks.stamp = () => stamp;
hooks.tab = tab => showTab(tab, { top: true });
hooks.word = w => q.go('vocab', `word=${encodeURIComponent(w)}`);
hooks.law = hash => q.go('law', hash);
hooks.reload = () => (state.held.clear(), load({ fresh: true }));

// ---- The stories ----------------------------------------------------------------------

// Read through the kit (memory, the phone's copy, then /data/): a copy two
// minutes old is used as is; a failed read keeps the last one.
let reading = null;
// (一句話講清楚: the AI's lines beside them, read the same way; none read, the outlets' own titles only.)
const LINES = 'news/lines.json';
let linesBuilt = null;
function loadLines(fresh) {
  return packJson(LINES, { ttl: fresh ? 0 : 120_000, timeout: 20_000 })
    .then(raw => {
      if (raw?.built === linesBuilt) return;
      linesBuilt = raw?.built ?? null;
      state.lines = cleanLines(raw);
      stamp++;
      quietRefresh();
    })
    .catch(() => {});
}
// One language (lib/tr.mjs): every headline the AI didn't title, the top summaries, translated ahead.
const TR = 'news/tr.json';
let trBuilt = null;
function loadTr(fresh) {
  return packJson(TR, { ttl: fresh ? 0 : 120_000, timeout: 20_000 })
    .then(raw => {
      if (raw?.built === trBuilt) return;
      trBuilt = raw?.built ?? null;
      state.tr = cleanTr(raw);
      stamp++;
      quietRefresh();
    })
    .catch(() => {});
}
// 看法案: the laws Taiwan's stories name (Orbit-Core's builders/news-laws.js), read with the stories.
const LAWS = 'news/laws.json';
let lawsBuilt = null;
function loadLaws(fresh) {
  return packJson(LAWS, { ttl: fresh ? 0 : 120_000, timeout: 20_000 })
    .then(raw => {
      if (raw?.built === lawsBuilt) return;
      lawsBuilt = raw?.built ?? null;
      state.laws = raw?.stories && typeof raw.stories === 'object' ? raw.stories : {};
    })
    .catch(() => {});
}
// 各方怎麼說: how each side framed the top stories (Orbit-Core's builders/ai.js newsSides), read with the stories.
const SIDES = 'news/sides.json';
let sidesBuilt = null;
function loadSides(fresh) {
  return packJson(SIDES, { ttl: fresh ? 0 : 120_000, timeout: 20_000 })
    .then(raw => {
      if (raw?.built === sidesBuilt) return;
      sidesBuilt = raw?.built ?? null;
      state.sides = cleanSides(raw);
    })
    .catch(() => {});
}
// 重點整理: our few points on the top stories (Orbit-Core's builders/ai.js newsBriefs), read with the stories.
const BRIEFS = 'news/briefs.json';
let briefsBuilt = null;
function loadBriefs(fresh) {
  return packJson(BRIEFS, { ttl: fresh ? 0 : 120_000, timeout: 20_000 })
    .then(raw => {
      if (raw?.built === briefsBuilt) return;
      briefsBuilt = raw?.built ?? null;
      state.briefs = cleanBriefs(raw);
    })
    .catch(() => {});
}
// 預測市場: Polymarket's markets beside the stories they're about (Orbit-Core's builders/news-markets.js), read with the stories.
const MARKETS = 'news/markets.json';
let marketsBuilt = null;
function loadMarkets(fresh) {
  return packJson(MARKETS, { ttl: fresh ? 0 : 120_000, timeout: 20_000 })
    .then(raw => {
      if (raw?.built === marketsBuilt) return;
      marketsBuilt = raw?.built ?? null;
      state.markets = cleanMarkets(raw);
      stamp++;
      quietRefresh();
    })
    .catch(() => {});
}
// (你關心的: the family's notebook, read again with each load; a holding or team gone, its stories go.)
function loadInterests() {
  return import('#kit/family.mjs')
    .then(f => {
      const next = interestsOf(f.heard?.('stock', 'holds') || [], f.heard?.('sports', 'follows') || []);
      const learn = learnSet(f.heard?.('vocab', 'learning', { maxAge: 30 * 86_400_000 }));
      const sig = l => (l ? [...l.byForm.keys()].join() : '');
      if (next.map(i => i.label).join() === state.interests.map(i => i.label).join() && sig(learn) === sig(state.learn)) return;
      state.interests = next;
      state.learn = learn;
      stamp++;
      quietRefresh();
    })
    .catch(() => {});
}
function load({ fresh = false } = {}) {
  if (reading) return reading;
  loadLines(fresh);
  loadTr(fresh);
  loadInterests();
  loadLaws(fresh);
  loadSides(fresh);
  loadMarkets(fresh);
  loadBriefs(fresh);
  // (The 測試工具's newsFail: the read fails as a real one would.)
  const button = document.getElementById('refresh');
  if (button) button.disabled = true;
  reading = (testFlags().newsFail ? Promise.reject(new Error('test: news failing')) : packJson(PAGE, { ttl: fresh ? 0 : 120_000, timeout: 20_000 }))
    .then(raw => {
      const page = testPage(cleanPage(raw));
      const changed = page.built !== state.page?.built;
      state.page = page;
      state.failed = false;
      if (changed) (stamp++, quietRefresh());
    })
    .catch(() => {
      state.failed = !state.page;
      if (!state.page) (stamp++, quietRefresh());
    })
    .finally(() => {
      reading = null;
      if (button) button.disabled = false;
    });
  return reading;
}
// The older stories kept, read only when asked (a list's end, an old link).
let pastReading = null;
hooks.past = () =>
  (pastReading ||= packJson(PAST, { ttl: 30 * 60_000, timeout: 20_000 })
    .then(raw => {
      state.past = cleanPage(raw);
      state.pastFailed = false;
      stamp++;
    })
    .catch(() => (state.pastFailed = true))
    .finally(() => (pastReading = null)));
// Orbit Sports' 相關新聞 opens a sports report here (#s=), one outlet's too,
// which News' own pages leave out: the builder's sports pack (the kit's
// news-sport.mjs SPORT_PATH), read only for such a link. (None read: an empty one.)
hooks.sport = () =>
  packJson(SPORT, { ttl: 10 * 60_000, timeout: 20_000 })
    .then(raw => (state.sport = cleanPage(raw)))
    .catch(() => (state.sport = cleanPage(null)));
// A new build every 10 minutes: looked for every 5 while the app is in view.
setInterval(() => document.visibilityState === 'visible' && load(), 5 * 60_000);

// ---- Drawing ----------------------------------------------------------------------

function render({ ifChanged = false } = {}) {
  const box = $(`panel-${state.tab}`);
  if (!box) return;
  if (ifChanged && box.dataset.drawn === String(stamp)) return;
  box.dataset.drawn = String(stamp);
  readWaiting = false;
  VIEWS[state.tab](box);
  // (The title stays put as a swipe moves the list under it.)
  if (state.tab !== TABS[0]) {
    const title = kitUI.navTitle(TITLES[state.tab]);
    title.classList.add('q-day-still');
    box.prepend(title);
  }
}
const tabNav = tabBar({
  tabs: TABS.map(id => ({ id, label: TITLES[id], icon: TAB_ICONS[id] })),
  onSelect: tab => showTab(tab),
  hash: id => `#${id}`
});
function showTab(tab, { top = false } = {}) {
  if (tab !== state.tab) stopVideo();
  state.tab = tab;
  if (readWaiting) ((readWaiting = false), stamp++);
  tabNav.select(tab, top ? { top: true } : undefined);
  render({ ifChanged: true });
}
// (Many reads land together as News opens: the stories, the AI's titles, the
// translations, the markets. One draw for them all, not a whole page each:
// the page froze two seconds on a phone, Jay 11-13.)
let redraw = 0;
const quietRefresh = () => {
  if (redraw) return;
  redraw = setTimeout(() => {
    redraw = 0;
    if (document.querySelector('dialog.q-sheet[open]')) return;
    // (A clip playing in 影音 isn't cut off: drawn once it stops.)
    if (videoPlaying()) return;
    if (state.loaded) render({ ifChanged: true });
    dimOpened();
  }, 80);
};
// A sheet closed: what changed under it drawn now.
document.addEventListener('close', () => setTimeout(() => (quietRefresh(), dimOpened())), true);
// (A finger down on a story: its AI parts asked a moment before the tap opens it; views/story.mjs warmStory.)
document.addEventListener('pointerdown', e => {
  const id = e.target?.closest?.('[data-story]')?.dataset?.story;
  if (id) warmStory(id);
}, { passive: true, capture: true });

window.__fxStarted = true;
const gated = installGate('news', lang);
watchUpdates({ current: VERSION, key: 'orbitNews', cachePrefix: 'orbit-news-' });
// A pull down on a phone, the refresh button on a computer (the kit's; it
// spins while a read runs, and runs when the connection comes back).
topActions(q, { refresh: () => (state.held.clear(), load({ fresh: true })) });

async function boot() {
  const starting = q.start();
  // The stories this phone kept, drawn at once; the fresh ones as they come.
  const [kept, keptLines, keptTr, keptMarkets] = await Promise.all([PAGE, LINES, TR, MARKETS].map(p => orbitKit.peekPack?.(p).catch(() => null)));
  if (kept?.data && !testFlags().newsFail) state.page = testPage(cleanPage(kept.data));
  // (The AI's titles, the translations and the markets kept with them, so the
  // first draw is the whole one: the fresh ones redraw only if newer.)
  if (keptLines?.data && linesBuilt === null) ((state.lines = cleanLines(keptLines.data)), (linesBuilt = keptLines.data.built ?? null));
  if (keptTr?.data && trBuilt === null) ((state.tr = cleanTr(keptTr.data)), (trBuilt = keptTr.data.built ?? null));
  if (keptMarkets?.data && marketsBuilt === null) ((state.markets = cleanMarkets(keptMarkets.data)), (marketsBuilt = keptMarkets.data.built ?? null));
  const mine = decodeLog(localCopy() || cachedPayload('news'));
  if (mine) absorb(mine);
  const first = load();
  const show = () => {
    state.loaded = true;
    openFromHash(true);
  };
  // (Drawn once: the kept stories at once, else the fresh ones when they
  // land; the fresh ones over the kept draw themselves, load(), only if newer.)
  // (A kept front over an hour old is waited on a moment for today's, so the
  // first draw isn't reshuffled a second later: 1.5 s at most, then the kept one.)
  const old = !state.page || Date.now() - (state.page.built || 0) > 3_600_000;
  if (!state.page) await first;
  else if (old) await Promise.race([first, new Promise(r => setTimeout(r, 1500))]);
  show();
  kitUI.ready(Promise.resolve());
  const signed = await starting;
  const logWas = encodeLog(state.log);
  await pass.first(signed, { local: Boolean(mine) });
  for (const item of signed?.inbox || []) absorb(decodeLog(item.payload) || {});
  keepLocal();
  pass.watch();
  // (The Pass's reading log drawn only if it changed what the page shows.)
  if (encodeLog(state.log) !== logWas) (stamp++, quietRefresh());
  await sync();
  for (const item of signed?.inbox || []) q.dropInbox(item.id).catch(() => {});
}
if (!gated) boot();

// The address: a tab (#intl), a story (#s=<id>) over its tab, or a search (#q=<words>).
function openFromHash(start = false) {
  // 問 Orbit's question (the Pass sheet, kit ask-orbit.mjs: #ask=<words>): 頭條 searched for it.
  // (The address read first: the tab shown writes its own over it.)
  if (/(?:^#|&)ask=/.test(location.hash)) {
    const hash = location.hash;
    showTab('top');
    import('#kit/ask-orbit.mjs')
      .then(m => {
        const q = askQuery(m.takeAsk?.({ hash, pathname: location.pathname, search: location.search }));
        if (q) searchFor(q);
      })
      .catch(() => {});
    return;
  }
  const hash = decodeURIComponent(location.hash.slice(1));
  const story = /^s=(\w+)$/.exec(hash)?.[1];
  // (#q=<words>: 頭條 on that search.)
  const find = /^q=(.+)$/s.exec(hash)?.[1];
  const tab = TABS.includes(hash) ? hash : find ? 'top' : start ? 'top' : null;
  if (tab) showTab(tab);
  if (find) searchFor(find);
  if (story) openStory(story);
}
window.addEventListener('hashchange', () => state.loaded && openFromHash());

// A turn of the phone or a window resized: the page laid out again.
let fitNow = '';
orbitKit.onScreen?.(fit => {
  const key = `${fit.w3}${fit.wide}${globalThis.innerHeight > 600}`;
  if (key === fitNow) return;
  fitNow = key;
  stamp++;
  if (state.loaded) render();
});

keepOffline();
