// The pieces every list draws: a story's bar (how many outlets of each side
// carry it), its row, the lead story's card, and the line under a list.
import { h, tag } from '#kit/ui.mjs';
import { W, en, sideText, sideFull, ago, outletName, outletMark, topicName } from '../shell.mjs';
import { barOf, daysOf } from '../lib/stories.mjs';

// An outlet's picture, hotlinked (never kept), gone if it can't be had.
export const picture = (src, cls, { eager = false } = {}) =>
  src ? h('span', { class: cls }, [h('img', { src, alt: '', loading: eager ? 'eager' : 'lazy', decoding: 'async', referrerpolicy: 'no-referrer', onerror: e => e.target.parentElement?.remove() })]) : null;
// A clip's mark on a picture: a play button.
const PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg>';
export const playMark = () => {
  const i = h('i', { class: 'nw-play', 'aria-hidden': 'true' });
  i.innerHTML = PLAY;
  return i;
};
// What a story is about and how long it has run: 政治 · 第 3 天.
export function aboutLine(story, { days = true } = {}) {
  const topic = story.topics?.[0] ? topicName(story.topics[0], story.region) : '';
  const d = daysOf(story);
  const run = days && d > 1 ? W(`報導 ${d} 天`, `${d} days`) : '';
  return [topic, run].filter(Boolean).join(' · ');
}

// The bar: a segment for each side that carries the story, as long as its
// count; `legend` the counts in words beside it (綠 1 中 4 藍 3).
export function bar(story, { big = false } = {}) {
  const { parts, rated } = barOf(story);
  const words = parts.map(p => `${sideFull(p.side)} ${p.n}`).join(W('、', ', '));
  const el = h('span', { class: `nw-bar${big ? ' big' : ''}${rated ? '' : ' none'}`, role: 'img', 'aria-label': rated ? words : W('沒有評過的媒體', 'No rated outlets') });
  for (const p of parts) if (p.n) el.append(h('i', { class: `nw-s-${p.side}`, style: { flexGrow: String(p.n) } }));
  return el;
}
export function counts(story, { full = false } = {}) {
  const { parts, rated } = barOf(story);
  const unrated = story.n - rated;
  if (!rated) return h('span', { class: 'nw-counts', text: W(`${story.n} 家未評`, `${story.n} unrated`) });
  return h('span', { class: 'nw-counts' }, [
    ...parts.flatMap((p, i) => [i ? ' ' : '', h('b', { class: `nw-t-${p.side}`, text: full ? sideFull(p.side) : sideText(p.side) }), ` ${p.n}`]),
    full && unrated > 0 ? W(` 未評 ${unrated}`, ` Unrated ${unrated}`) : ''
  ]);
}

// One story in a list: its headline, its bar and counts, and how long ago
// (or, one-sided, which side left it out); its picture beside it, a play
// mark on it when it has a clip. `onOpen(story)`.
export function storyRow(story, onOpen, { side = true } = {}) {
  const tail = side && story.blind ? tag(W(`${sideFull(story.blind)}沒報`, `None ${sideFull(story.blind).toLowerCase()}`), 'tint', `var(--nw-${story.blind})`) : h('small', { class: 'nw-ago', text: ago(story.at) });
  const pic = picture(story.img, 'nw-thumb');
  if (pic && story.clips?.some(c => c[1])) pic.append(playMark());
  return h('button', { type: 'button', class: `nw-row${pic ? ' has-pic' : ''}`, 'data-story': story.id, onclick: () => onOpen(story) }, [
    h('span', { class: 'nw-row-main' }, [h('span', { class: 'nw-row-title', text: story.title }), h('span', { class: 'nw-row-meta' }, [bar(story), counts(story), tail])]),
    pic
  ]);
}
// A story as a card (the front page's 要聞): its picture over its topic,
// headline and bar on a wide page; a row with the picture beside it on a
// narrow one (by the grid's own width, news.css).
export function storyCard(story, onOpen) {
  const pic = picture(story.img, 'nw-card-pic');
  if (pic && story.clips?.some(c => c[1])) pic.append(playMark());
  const about = aboutLine(story);
  return h('button', { type: 'button', class: `nw-card${pic ? ' has-pic' : ''}`, 'data-story': story.id, onclick: () => onOpen(story) }, [
    pic,
    h('span', { class: 'nw-card-body' }, [
      about ? h('small', { class: 'nw-about', text: about }) : null,
      h('span', { class: 'nw-card-title', text: story.title }),
      h('span', { class: 'nw-row-meta' }, [bar(story), counts(story), h('small', { class: 'nw-ago', text: ago(story.at) })])
    ])
  ]);
}
export const storyCards = (stories, onOpen) => h('div', { class: 'nw-cards q-rows-full' }, stories.map(s => storyCard(s, onOpen)));
// A clip in the 影音 row: the outlet's YouTube picture with a play mark,
// the outlet and its headline. `onPlay({ story, clip })`.
export function clipCard(entry, onPlay) {
  const { story, clip } = entry;
  const pic = picture(clip[4] || story.img, 'nw-clip-pic') || h('span', { class: 'nw-clip-pic' });
  pic.append(playMark());
  return h('button', { type: 'button', class: 'nw-clip', 'data-story': story.id, onclick: () => onPlay(entry) }, [
    pic,
    h('span', { class: 'nw-clip-src' }, [outletMark(clip[0], 18), h('span', { text: outletName(clip[0]) }), clip[1] ? null : h('small', { text: W('到網站看', 'On its site') })]),
    h('span', { class: 'nw-clip-title', lang: story.region === 'intl' ? 'en' : 'zh-Hant', text: clip[3] || story.title })
  ]);
}
export const storyList = (stories, onOpen, opts) => h('div', { class: 'nw-list' }, stories.map(s => storyRow(s, onOpen, opts)));

// The story a page leads with: its picture (the outlet's own, credited),
// headline, bar and counts.
export function leadCard(story, onOpen) {
  const pic = picture(story.img, 'nw-lead-pic', { eager: true });
  if (pic && story.clips?.some(c => c[1])) pic.append(playMark());
  const about = aboutLine(story);
  return h('button', { type: 'button', class: 'nw-lead', 'data-story': story.id, onclick: () => onOpen(story) }, [
    pic,
    h('span', { class: 'nw-lead-body' }, [
      about ? h('small', { class: 'nw-about', text: about }) : null,
      h('span', { class: 'nw-lead-title', text: story.title }),
      story.sum ? h('span', { class: 'nw-lead-sum', text: story.sum }) : null,
      bar(story, { big: true }),
      h('span', { class: 'nw-row-meta' }, [counts(story, { full: true }), h('small', { class: 'nw-ago', text: ago(story.at) })]),
      story.img && story.imgBy ? h('small', { class: 'nw-credit', text: W(`圖：${outletName(story.imgBy)}`, `Photo: ${outletName(story.imgBy)}`) }) : null
    ])
  ]);
}

// The page's foot: when the stories were gathered, and from whom.
export function builtLine(page) {
  if (!page?.built) return null;
  const t = new Date(page.built);
  const hm = t.toLocaleTimeString(en ? 'en-GB' : 'zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false });
  return h('p', { class: 'nw-foot', text: W(`${hm} 整理 · 標題、摘要和圖片屬於各家媒體，點開到原網站看全文`, `Gathered at ${hm} · Headlines, summaries and pictures are each outlet's own; a tap opens its site`) });
}
