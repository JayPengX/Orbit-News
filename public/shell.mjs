// What every screen shares: the state, the words, the outlets' names and
// marks, the sides' words, and the hooks app.mjs fills in (a headline
// opened, a redraw). Screens (views/*.mjs) draw from here.
import { lang, W } from '#kit/lang.mjs';
import * as fmt from '#kit/format.mjs';
import * as orbitKit from '#kit/orbit.mjs';
import { h, logoTile } from '#kit/ui.mjs';
import { outletOf, outletIcon, sideName, sideWord } from '#kit/news-outlets.mjs';
import * as kitNews from '#kit/news-outlets.mjs';
import { emptyLog, readState, following } from './lib/reading.mjs';
import { agoOf, isLive } from './lib/stories.mjs';

export { lang, W };
export const en = lang === 'en';

// The phone's own day (kit localDay), Taiwan's on an older kit.
export const today = () => (fmt.localDay || fmt.twDay)(Date.now());
export const state = {
  tab: 'top',
  // The builder's page (lib/stories.mjs cleanPage), null until read; `failed`: the
  // last read failed and nothing was kept.
  page: null,
  failed: false,
  // 台灣 and 國際's topic ('all', a topic's id, or 'video'); how many shown.
  topic: { tw: 'all', intl: 'all', side: 'tw' },
  // 單邊's filter: the side whose missing stories are shown ('' both).
  blind: '',
  shown: { tw: 20, intl: 20 },
  // The past's page (older stories kept, news/past.json), read when asked.
  past: null,
  pastFailed: false,
  // Orbit Sports' sports reports (news/sport.json), read for a link from its 相關新聞.
  sport: null,
  // The AI's one lines and titles by story (lib/lines.mjs), an empty Map until read.
  lines: new Map(),
  // 你關心的: what Securities holds and Sports follows on this phone (lib/mine.mjs interestsOf).
  interests: [],
  // 新聞學單字: the words being learned in Orbit Words on this phone (lib/learn.mjs learnSet), null if none.
  learn: null,
  // 看法案: the laws each Taiwan story names, by story id (news/laws.json), {} until read.
  laws: {},
  // 各方怎麼說: how each side framed a story, by id (news/sides.json, lib/sides.mjs), empty until read.
  sides: new Map(),
  // 預測市場: Polymarket's markets on a story's question, by id (news/markets.json, lib/markets.mjs), empty until read.
  markets: new Map(),
  // 重點整理: a story's points in our words, by id (news/briefs.json, Orbit-Core builders/ai.js newsBriefs), empty until read.
  briefs: new Map(),
  // 我的閱讀's log, the read marks and the follows (lib/reading.mjs), on the Pass.
  log: emptyLog(),
  // What's followed on the page: id → { why, lift } (lib/follows.mjs followedOf), made each 頭條, 台灣 or 國際 draw.
  followed: new Map(),
  // What the person opens, learnt (the kit's feedback.mjs, loaded on the side; null until then or on an older kit).
  fb: null,
  loaded: false
};

// Filled in by app.mjs: read(outlet) counts a headline opened; render() redraws;
// tab(id) opens a tab at its top; reload() reads the stories again; past()
// reads the older stories (a promise); word(w) opens a word's card in Orbit Words; law(hash) a law or bill in Orbit Law.
// follow(key, on) follows or lets go (lib/reading.mjs keys); opened(story) marks a story read.
export const hooks = { read() {}, render() {}, tab() {}, reload() {}, play() {}, word() {}, law() {}, follow() {}, opened() {}, past: async () => {} };

// A story as far as this person has read it: '' not opened, 'read', or 'new'
// (a big development since they read it: lib/reading.mjs readState).
export const readMark = story => readState(state.log, story, { live: isLive(story, state.page?.built) });
export const isFollowing = key => following(state.log, key);

// A topic's name (政治, 兩岸…; abroad 中國); '' on a kit without topics.
export const topicName = (id, region = 'tw') => (id === 'video' ? W('影音', 'Video') : kitNews.topicWord?.(id, lang, region) || '');

// An outlet's name in the page's language, short.
export const outletName = id => {
  const o = outletOf(id);
  return o ? (en ? o.en : o.zh) : id;
};
// Its mark (the site's own icon) on the kit's logo tile.
export const outletMark = (id, size = 24) => logoTile(outletIcon(id, size > 32 ? 128 : 64), { size, alt: '', fallbackText: outletName(id), kind: 'company' });

export const sideText = side => sideWord(side, lang);
export const sideFull = side => sideName(side, lang);
export const ago = at => agoOf(at, Date.now(), en);
export const regionName = r => (r === 'tw' ? W('台灣', 'Taiwan') : W('國際', 'World'));

// A page out of the app, opened by code: the way the person chose on the Pass
// sheet (iOS's quick view, or the Safari app: the kit's openLink; an older kit,
// a new tab). A plain <a> follows that choice by itself.
export const openOut = url => (orbitKit.openLink ? orbitKit.openLink(url) : globalThis.open?.(url, '_blank', 'noopener'));

// A headline that opens the outlet's own page (in a new tab: the app stays
// where it was; the Safari app when the person chose it), counted for 我的閱讀.
export function outletLink(item, children, cls = '') {
  const [o, , url] = item;
  return h('a', { class: cls, href: url, target: '_blank', rel: 'noopener', onclick: () => hooks.read(o) }, children);
}

