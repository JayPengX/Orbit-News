// A story's sheet: its picture and summary (credited to their outlets), the
// bar with every side's count, which side left it out, which parties its
// headlines name, and every outlet's headlines side by side: one column a
// side (偏綠 · 中間 · 偏藍, or left · centre · right and the unrated), one
// over the other on a phone. A headline opens the outlet's own page.
import { h, sheet, tag } from '#kit/ui.mjs';
import { PARTY_WORDS } from '#kit/news-outlets.mjs';
import { state, W, sideFull, ago, outletName, outletMark, outletLink, regionName } from '../shell.mjs';
import { storyById, bySide, ENDS } from '../lib/stories.mjs';
import { bar, counts } from './parts.mjs';

let shown = null;
export function openStory(id) {
  const story = storyById(state.page, id);
  if (!story) return;
  shown?.close?.();
  const groups = bySide(story);
  const sides = [...Object.keys(groups).filter(k => k !== 'none'), 'none'];
  const ends = ENDS[story.region];
  const cards = sides
    .filter(s => groups[s].length || ends.includes(s))
    .map(s => sideCard(s, groups[s], story));
  const parties = story.parties?.length ? W(`標題提到：${story.parties.map(p => PARTY_WORDS[p][0]).join('、')}`, `Headlines name: ${story.parties.map(p => PARTY_WORDS[p][1]).join(', ')}`) : '';
  const pic = story.img
    ? h('figure', { class: 'nw-story-pic' }, [
        h('img', { src: story.img, alt: '', decoding: 'async', referrerpolicy: 'no-referrer', onerror: e => e.target.closest('figure')?.remove() }),
        story.imgBy ? h('figcaption', { text: W(`圖：${outletName(story.imgBy)}`, `Photo: ${outletName(story.imgBy)}`) }) : null
      ])
    : null;
  // The picture and the words beside it on a wide sheet, one over the other on a phone.
  const head = h('div', { class: 'nw-story-head' }, [
    pic,
    h('div', { class: 'nw-story-text' }, [
      h('h2', { class: 'nw-story-title', lang: story.region === 'intl' ? 'en' : 'zh-Hant', text: story.title }),
      story.sum ? h('p', { class: 'nw-sum', lang: story.region === 'intl' ? 'en' : 'zh-Hant' }, [story.sum, story.sumBy ? h('small', { text: ` — ${outletName(story.sumBy)}` }) : null]) : null,
      h('div', { class: 'nw-story-bar' }, [bar(story, { big: true }), counts(story, { full: true })]),
      story.blind ? h('p', { class: 'nw-story-note' }, [tag(W(`${sideFull(story.blind)}的媒體都沒報`, `No ${sideFull(story.blind).toLowerCase()} outlet carries it`), 'tint', `var(--nw-${story.blind})`)]) : null,
      h('p', { class: 'nw-story-line', text: [W(`${story.n} 家媒體`, `${story.n} outlets`), W(`最早 ${ago(story.first)}`, `first ${ago(story.first)}`), W(`最新 ${ago(story.at)}`, `latest ${ago(story.at)}`), parties].filter(Boolean).join(' · ') })
    ])
  ]);
  const body = h('div', { class: 'nw-story' }, [
    head,
    h('div', { class: 'q-sheet-cols nw-sides' }, cards),
    h('p', { class: 'nw-foot', text: W('標題、摘要和圖片屬於各家媒體；點標題到原網站看全文。', 'Headlines, summaries and pictures are each outlet’s own; tap one to read it on its site.') })
  ]);
  shown = sheet({ title: regionName(story.region), cls: 'q-sheet-wide nw-story-sheet', body: [body], label: story.title, onClose: () => (shown = null) });
}

// One side's column: its name and count, each outlet's headlines; a side
// with none says so (that's the point of the page).
function sideCard(side, items, story) {
  const outlets = [...new Set(items.map(it => it[0]))];
  const head = h('div', { class: 'nw-side-head' }, [
    h('i', { class: `nw-dot nw-s-${side}`, 'aria-hidden': 'true' }),
    h('b', { text: side === 'none' ? W('未評', 'Unrated') : sideFull(side) }),
    h('small', { text: W(`${outlets.length} 家`, `${outlets.length}`) })
  ]);
  const rows = items.map(it =>
    outletLink(it, [
      h('span', { class: 'nw-hl-src' }, [outletMark(it[0], 20), h('span', { text: outletName(it[0]) }), h('small', { text: ago(it[3]) })]),
      h('span', { class: 'nw-hl-t', lang: story.region === 'intl' ? 'en' : 'zh-Hant', text: it[1] })
    ], 'nw-hl')
  );
  const none = !items.length ? h('p', { class: 'nw-side-none', text: W(`沒有${sideFull(side)}的媒體報這則。`, `No ${sideFull(side).toLowerCase()} outlet carries this.`) }) : null;
  return h('section', { class: `nw-side nw-side-${side}` }, [head, none, ...rows]);
}
