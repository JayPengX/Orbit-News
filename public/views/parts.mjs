// The pieces every list draws: a story's bar (how many outlets of each side
// carry it), its row, the lead story's card, and the line under a list.
import { h, tag } from '#kit/ui.mjs';
import { W, en, sideText, sideFull, ago, outletName } from '../shell.mjs';
import { barOf } from '../lib/stories.mjs';

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
// (or, one-sided, which side left it out). `onOpen(story)`.
export function storyRow(story, onOpen, { side = true } = {}) {
  const tail = side && story.blind ? tag(W(`${sideFull(story.blind)}沒報`, `None ${sideFull(story.blind).toLowerCase()}`), 'tint', `var(--nw-${story.blind})`) : h('small', { class: 'nw-ago', text: ago(story.at) });
  return h('button', { type: 'button', class: 'nw-row', 'data-story': story.id, onclick: () => onOpen(story) }, [
    h('span', { class: 'nw-row-title', text: story.title }),
    h('span', { class: 'nw-row-meta' }, [bar(story), counts(story), tail])
  ]);
}
export const storyList = (stories, onOpen, opts) => h('div', { class: 'nw-list' }, stories.map(s => storyRow(s, onOpen, opts)));

// The story a page leads with: its picture (the outlet's own, credited),
// headline, bar and counts.
export function leadCard(story, onOpen) {
  const pic = story.img
    ? h('span', { class: 'nw-lead-pic' }, [
        h('img', { src: story.img, alt: '', loading: 'eager', decoding: 'async', referrerpolicy: 'no-referrer', onerror: e => e.target.closest('.nw-lead-pic')?.remove() })
      ])
    : null;
  return h('button', { type: 'button', class: 'nw-lead', 'data-story': story.id, onclick: () => onOpen(story) }, [
    pic,
    h('span', { class: 'nw-lead-body' }, [
      h('span', { class: 'nw-lead-title', text: story.title }),
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
