// What every screen shares: the state, the words, the outlets' names and
// marks, the sides' words, and the hooks app.mjs fills in (a headline
// opened, a redraw). Screens (views/*.mjs) draw from here.
import { lang, W } from '#kit/lang.mjs';
import * as fmt from '#kit/format.mjs';
import * as orbitKit from '#kit/orbit.mjs';
import { h, logoTile } from '#kit/ui.mjs';
import { outletOf, outletIcon, sideName, sideWord } from '#kit/news-outlets.mjs';
import * as kitNews from '#kit/news-outlets.mjs';
import { emptyLog } from './lib/reading.mjs';
import { agoOf } from './lib/stories.mjs';

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
  topic: { tw: 'all', intl: 'all', side: 'all' },
  shown: { tw: 20, intl: 20 },
  // The past's page (older stories kept, news/past.json), read when asked.
  past: null,
  pastFailed: false,
  log: emptyLog(),
  loaded: false
};

// Filled in by app.mjs: read(outlet) counts a headline opened; render() redraws;
// tab(id) opens a tab at its top; reload() reads the stories again; past()
// reads the older stories (a promise).
export const hooks = { read() {}, render() {}, tab() {}, reload() {}, play() {}, past: async () => {} };

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

// A headline that opens the outlet's own page (in a new tab: the app stays
// where it was), counted for 我的閱讀.
export function outletLink(item, children, cls = '') {
  const [o, , url] = item;
  return h('a', { class: cls, href: url, target: '_blank', rel: 'noopener', onclick: () => hooks.read(o) }, children);
}

// How many columns a page has room for (the kit's screenFit marks).
export function columnsHere() {
  const fit = orbitKit.screenFit?.();
  return fit?.w3 ? 3 : fit?.wide ? 2 : 1;
}
