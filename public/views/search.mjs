// 搜尋 at the top of 頭條 (Jay 11-11): one field; typing turns the front
// page into what's found (lib/search.mjs, on the phone, as each letter is
// typed): the outlets named, then the stories, best first, each headline's
// found words marked and, when an outlet's own headline is why it was found,
// that headline under it. Emptied, the front page is back where it was.
// The field and the results are made once and kept: the front page drawn
// again under them (a new build every 10 minutes) never takes the keyboard
// away. Recent searches (this phone's, `orbit-news.finds.v1`) as chips when
// the field is focused and empty. `#q=<words>` opens a search.
import { h, empty, moreToggle } from '#kit/ui.mjs';
import * as kitUI from '#kit/ui.mjs';
import { OUTLETS } from '#kit/news-outlets.mjs';
import { state, hooks, W, outletName, outletMark, topicName } from '../shell.mjs';
import { findStories, findOutlets, marked, keepFind, wordsOf } from '../lib/search.mjs';
import { storyRow } from './parts.mjs';
import { openStory } from './story.mjs';
import { openOutlet } from './outlets.mjs';

const FINDS_KEY = 'orbit-news.finds.v1';
const readFinds = () => {
  try {
    const x = JSON.parse(localStorage.getItem(FINDS_KEY) || '[]');
    return Array.isArray(x) ? x.filter(s => typeof s === 'string').slice(0, 8) : [];
  } catch {
    return [];
  }
};
const keep = q => {
  try {
    localStorage.setItem(FINDS_KEY, JSON.stringify(keepFind(readFinds(), q)));
  } catch {}
};

let query = '';
let shown = 30;
let head = null;
let field = null;
let recent = null;
let results = null;
let front = null;
let timer = 0;
// (Each story folded once while its page lasts.)
let cache = new WeakMap();
let pastAsked = false;

const markedNodes = text => marked(text, query).map(([t, on]) => (on ? h('mark', { class: 'nw-found-mark', text: t }) : t));

function drawRecent() {
  const finds = readFinds();
  const on = !query.trim() && document.activeElement === field?.input && finds.length > 0;
  recent.hidden = !on;
  if (!on) return;
  recent.replaceChildren(
    h('small', { class: 'nw-recent-head', text: W('最近搜尋', 'Recent') }),
    ...finds.map(f => h('button', { type: 'button', class: 'q-chip', text: f, onpointerdown: e => e.preventDefault(), onclick: () => setQuery(f, { keepIt: true }) }))
  );
}

function drawResults() {
  const q = query.trim();
  const on = Boolean(q);
  results.hidden = !on;
  if (front) front.hidden = on;
  drawRecent();
  // (The front page back: its columns dealt again, as they're never dealt hidden.)
  if (!on) return void (front && kitUI.flowColumns?.(front));
  // (The older stories kept: read once, the first time anything is searched.)
  if (!state.past && !pastAsked) {
    pastAsked = true;
    hooks.past()?.then?.(() => query.trim() && drawResults());
  }
  const found = findStories([state.page, state.past], q, { lines: state.lines, outletName, topicName, cache });
  const outlets = findOutlets(OUTLETS, q);
  const list = found.map(f => f.story);
  const hits = new Map(found.map(f => [f.story.id, f.hit]));
  const open = s => (keep(q), openStory(s.id, { list }));
  const note = s => {
    const hit = hits.get(s.id);
    return hit ? h('span', { class: 'nw-hit' }, [outletMark(hit[0], 14), h('span', {}, [`${outletName(hit[0])}：`, ...markedNodes(hit[1])])]) : null;
  };
  const parts = [];
  if (outlets.length)
    parts.push(
      h('div', { class: 'nw-found-outlets' }, outlets.map(id => h('button', { type: 'button', class: 'q-chip nw-outlet-chip', onclick: () => (keep(q), openOutlet(id)) }, [outletMark(id, 18), h('span', { text: outletName(id) })])))
    );
  if (list.length) {
    parts.push(h('p', { class: 'nw-found-n', text: W(`找到 ${list.length} 則新聞`, `${list.length} ${list.length === 1 ? 'story' : 'stories'}`) }));
    parts.push(h('div', { class: 'nw-list' }, list.slice(0, shown).map(s => storyRow(s, open, { list, mark: markedNodes, note }))));
    if (list.length > shown) parts.push(moreToggle({ more: W(`再看 ${Math.min(30, list.length - shown)} 則`, `${Math.min(30, list.length - shown)} more`), less: null, onToggle: () => ((shown += 30), drawResults()) }));
  } else if (!outlets.length)
    parts.push(
      empty({
        icon: 'search',
        title: W(`找不到「${q}」`, `Nothing for “${q}”`),
        body: wordsOf(q).length > 1 ? W('每個字都要找到，少打一兩個字試試。', 'Every word has to match: try fewer words.') : W('這三天和留下的新聞裡沒有，換個說法試試。', 'Not in the last days’ stories or those kept: try other words.')
      })
    );
  results.replaceChildren(...parts);
}

function setQuery(q, { keepIt = false } = {}) {
  query = q;
  shown = 30;
  if (field && field.input.value !== q) field.input.value = q;
  if (keepIt) keep(q);
  drawResults();
  if (q.trim()) globalThis.scrollTo?.({ top: 0 });
}

function make() {
  field = kitUI.search({
    placeholder: W('搜尋新聞、人物、媒體', 'Search stories, people, outlets'),
    onInput: v => {
      clearTimeout(timer);
      // (A letter at a time: drawn after a short pause, never under each key.)
      timer = setTimeout(() => setQuery(v), v.length < 2 ? 220 : 120);
    },
    onSubmit: v => (clearTimeout(timer), setQuery(v, { keepIt: true }), field.input.blur())
  });
  field.input.addEventListener('focus', drawRecent);
  field.input.addEventListener('blur', () => setTimeout(drawRecent, 150));
  recent = h('div', { class: 'nw-recent', hidden: true });
  head = h('div', { class: 'nw-search' }, [field, recent]);
  results = h('section', { class: 'nw-results', 'aria-live': 'polite', hidden: true });
}

// The front page under the field: `nodes` (renderTop's), the field and the
// results kept in place above them.
export function withSearch(box, nodes) {
  if (!head) make();
  cache = new WeakMap();
  for (const n of [...box.childNodes]) if (n !== head && n !== results) n.remove();
  if (head.parentNode !== box) box.prepend(head);
  if (results.parentNode !== box) head.after(results);
  front = h('div', { class: 'nw-front-page' }, nodes.filter(Boolean));
  box.append(front);
  // (A search showing is drawn again on the new stories.)
  if (query.trim()) drawResults();
  else front.hidden = false;
}

// `#q=<words>`: 頭條 opened on that search.
export function searchFor(q) {
  if (!head) make();
  setQuery(String(q || ''), { keepIt: true });
}
