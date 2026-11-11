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
import { cleanSides } from './lib/sides.mjs';
import { interestsOf } from './lib/mine.mjs';
import { learnSet } from './lib/learn.mjs';
import { decodeLog, encodeLog, mergeLogs, trimLog, addRead } from './lib/reading.mjs';
import { renderTop, renderRegion, renderSide } from './views/lists.mjs';
import { renderOutlets } from './views/outlets.mjs';
import { openStory } from './views/story.mjs';

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
  stamp++;
  pass.changed();
  keepLocal();
  sync({ soon: true });
};
hooks.render = () => (stamp++, render());
hooks.tab = tab => showTab(tab, { top: true });
hooks.word = w => q.go('vocab', `word=${encodeURIComponent(w)}`);
hooks.law = hash => q.go('law', hash);
hooks.reload = () => load({ fresh: true });

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
  loadInterests();
  loadLaws(fresh);
  loadSides(fresh);
  reading = packJson(PAGE, { ttl: fresh ? 0 : 120_000, timeout: 20_000 })
    .then(raw => {
      const page = cleanPage(raw);
      const changed = page.built !== state.page?.built;
      state.page = page;
      state.failed = false;
      if (changed) (stamp++, quietRefresh());
    })
    .catch(() => {
      state.failed = !state.page;
      if (!state.page) (stamp++, quietRefresh());
    })
    .finally(() => (reading = null));
  return reading;
}
// The older stories kept, read only when asked (a list's end, an old link).
let pastReading = null;
hooks.past = () =>
  (pastReading ||= packJson(PAST, { ttl: 30 * 60_000, timeout: 20_000 })
    .then(raw => {
      state.past = cleanPage(raw);
      state.pastFailed = false;
    })
    .catch(() => (state.pastFailed = true))
    .finally(() => (pastReading = null)));
// A new build every 10 minutes: looked for every 5 while the app is in view.
setInterval(() => document.visibilityState === 'visible' && load(), 5 * 60_000);

// ---- Drawing ----------------------------------------------------------------------

function render({ ifChanged = false } = {}) {
  const box = $(`panel-${state.tab}`);
  if (!box) return;
  if (ifChanged && box.dataset.drawn === String(stamp)) return;
  box.dataset.drawn = String(stamp);
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
  state.tab = tab;
  tabNav.select(tab, top ? { top: true } : undefined);
  render({ ifChanged: true });
}
const quietRefresh = () => {
  if (document.querySelector('dialog.q-sheet[open]')) return;
  if (state.loaded) render({ ifChanged: true });
};
// A sheet closed: what changed under it drawn now.
document.addEventListener('close', () => setTimeout(quietRefresh), true);

window.__fxStarted = true;
const gated = installGate('news', lang);
watchUpdates({ current: VERSION, key: 'orbitNews', cachePrefix: 'orbit-news-' });
topActions(q);
kitUI.pullToRefresh?.(() => load({ fresh: true }), { disabled: () => Boolean(reading) || !state.loaded });

async function boot() {
  const starting = q.start();
  // The stories this phone kept, drawn at once; the fresh ones as they come.
  const [kept, keptLines] = await Promise.all([PAGE, LINES].map(p => orbitKit.peekPack?.(p).catch(() => null)));
  if (kept?.data) state.page = cleanPage(kept.data);
  // (The AI's titles kept with them, so the first draw is the whole one: the fresh ones redraw only if newer.)
  if (keptLines?.data && linesBuilt === null) ((state.lines = cleanLines(keptLines.data)), (linesBuilt = keptLines.data.built ?? null));
  const mine = decodeLog(localCopy() || cachedPayload('news'));
  if (mine) absorb(mine);
  const first = load();
  const show = () => {
    state.loaded = true;
    openFromHash(true);
  };
  // (Drawn once: the kept stories at once, else the fresh ones when they
  // land; the fresh ones over the kept draw themselves, load(), only if newer.)
  if (!state.page) await first;
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

// The address: a tab (#intl), or a story (#s=<id>) over its tab.
function openFromHash(start = false) {
  const hash = decodeURIComponent(location.hash.slice(1));
  const story = /^s=(\w+)$/.exec(hash)?.[1];
  const tab = TABS.includes(hash) ? hash : start ? 'top' : null;
  if (tab) showTab(tab);
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
