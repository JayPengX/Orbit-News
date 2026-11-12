// The pieces every list draws: a story's coverage (the outlets' marks, how
// many, and the bar of each side's count), its row, its card, the lead
// stories' carousel, and the line under a list.
import { h, tag } from '#kit/ui.mjs';
import { W, en, hooks, state, sideText, sideFull, ago, outletName, outletMark, topicName } from '../shell.mjs';
import * as kitUI from '#kit/ui.mjs';
import { titleOf } from '../lib/lines.mjs';
import { barOf, daysOf, outletsOf, sidesTaken, stateMedia, picturesOf } from '../lib/stories.mjs';
import { sized } from '../lib/pics.mjs';

// An outlet's picture, hotlinked (never kept), asked at the size it's shown
// (`size`: 's' a row's, 'l' a lead's; lib/pics.mjs `sized`), the address as
// given should that one fail. One that won't load gives way to the next
// outlet's (`alts`: [[picture, outlet]], the builder's); gone, with its
// card's has-pic, only when none load (Jay 11-11: an empty space where 32
// other outlets had one). `onBy(outlet)`: whose shows now ('' none). Its
// place is held at its shape, filled grey, and the picture fades in once
// it's there (one already loaded this visit is there at once: no fade).
export const picture = (src, cls, { eager = false, alts = [], onBy = null, size = 's' } = {}) => {
  if (!src) return null;
  const queue = [];
  const seen = new Set();
  const add = (u, by) => u && !seen.has(u) && (seen.add(u), queue.push([u, by]));
  for (const [u, by] of [[src, null], ...(alts || []).filter(a => a?.[0])]) add(sized(u, size), by), add(u, by);
  const box = h('span', { class: cls });
  let by = null;
  const img = h('img', {
    src: queue.shift()[0],
    alt: '',
    loading: eager ? 'eager' : 'lazy',
    fetchpriority: eager ? 'high' : null,
    decoding: 'async',
    referrerpolicy: 'no-referrer',
    onload: () => box.classList.remove('nw-pic-wait'),
    onerror: () => {
      const next = queue.shift();
      if (next) {
        img.src = next[0];
        if (next[1] !== null && next[1] !== by) onBy?.((by = next[1]));
        return;
      }
      box.closest('.has-pic')?.classList.remove('has-pic');
      box.remove();
      onBy?.('');
    }
  });
  if (!img.complete) box.classList.add('nw-pic-wait');
  box.append(img);
  return box;
};
// A story's picture with its others to fall back on.
const storyPicture = (story, cls, opts = {}) => {
  const [first, ...alts] = picturesOf(story, { light: (opts.size || 's') === 's' });
  return picture(first?.[0], cls, { ...opts, alts });
};
// A clip's mark on a picture: a play button.
const PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg>';
export const playMark = () => {
  const i = h('i', { class: 'nw-play', 'aria-hidden': 'true' });
  i.innerHTML = PLAY;
  return i;
};
const withClip = (pic, story) => {
  if (pic && story.clips?.some(c => c[1])) pic.append(playMark());
  return pic;
};
// A tap on a story: on its picture with a play mark, its clip plays at the
// sheet's top (video and news one, Jay 11-10); elsewhere, the story opens.
const tapStory = (story, onOpen, list) => e => {
  const clip = e.target.closest?.('.nw-thumb, .nw-card-pic, .nw-lead-pic') && story.clips?.find(c => c[1])?.[1];
  return clip ? hooks.play(story.id, clip, list) : onOpen(story, list);
};
// The headline as the reader sees it (a world story's in Chinese, by the
// AI, from the outlets' own) and the AI's neutral one line under it, its
// spark marking it the AI's (lib/lines.mjs).
export const shownTitle = story => titleOf(story, state.lines?.get?.(story.id), en);
const titleSpan = (story, cls) => {
  const t = shownTitle(story);
  return h('span', { class: cls, lang: t.lang, text: t.text });
};

// What a story is about and how long it has run: 政治 · 報導 3 天; `when`
// adds how long ago it was last heard of.
export function aboutLine(story, { days = true, when = false } = {}) {
  const topic = story.topics?.[0] ? topicName(story.topics[0], story.region) : '';
  const d = daysOf(story);
  const run = days && d > 1 ? W(`報導 ${d} 天`, `${d} days`) : '';
  // (預測市場: a story with a market's chances in its sheet says so.)
  const odds = state.markets?.has?.(story.id) ? W('預測市場', 'Market odds') : '';
  return [topic, run, odds, when ? ago(story.at) : ''].filter(Boolean).join(' · ');
}

// The bar: a segment for each side that carries the story, as long as its
// count (the counts in words for a screen reader: 偏綠 1、中間 4、偏藍 3).
export function bar(story, { big = false } = {}) {
  const { parts, rated } = barOf(story);
  const words = parts.map(p => `${sideFull(p.side)} ${p.n}`).join(W('、', ', '));
  const el = h('span', { class: `nw-bar${big ? ' big' : ''}${rated ? '' : ' none'}`, role: 'img', 'aria-label': rated ? words : W('沒有可分邊的媒體', 'No outlet on a side') });
  for (const p of parts) if (p.n) el.append(h('i', { class: `nw-s-${p.side}`, style: { flexGrow: String(p.n) } }));
  return el;
}
// Each side's count in words (綠 1 中 4 藍 3), China's state media apart
// (a reading's own count of them as `state`: it has no headlines).
export function counts(story, { full = false } = {}) {
  const { parts, rated } = barOf(story);
  const state = story.state ?? stateMedia(story);
  return h('span', { class: 'nw-counts' }, [
    ...parts.flatMap((p, i) => [i ? ' ' : '', h('b', { class: `nw-t-${p.side}`, text: full ? sideFull(p.side) : sideText(p.side) }), ` ${p.n}`]),
    full && state ? W(` 官媒 ${state}`, ` State media ${state}`) : '',
    !rated && !state ? W(`${story.n} 家`, `${story.n}`) : ''
  ]);
}
// The outlets carrying it: the first few marks, overlapping.
export function marks(story, most = 4) {
  const ids = outletsOf(story).slice(0, most);
  return h('span', { class: 'nw-marks', 'aria-hidden': 'true' }, ids.map(id => outletMark(id, 18)));
}
// A story's coverage in a line: the marks, how many outlets, the bar (only
// for a kind sides take: the spectrum is one feature, Jay 11-10), and its
// one-sided tag when one side left it out.
export function coverage(story, { side = true, bar: withBar = true } = {}) {
  const tail = side && story.blind ? tag(W(`${sideFull(story.blind)}沒報`, `None ${sideFull(story.blind).toLowerCase()}`), 'tint', `var(--nw-${story.blind})`) : null;
  return h('span', { class: 'nw-cover' }, [
    marks(story),
    h('span', { class: 'nw-n', text: W(`${story.n} 家媒體`, `${story.n} outlets`) }),
    withBar && sidesTaken(story) ? bar(story) : null,
    tail,
    // (A world story Taiwan's outlets carry too: how many.)
    story.tw?.n ? h('span', { class: 'nw-tw-n', text: W(`台灣 ${story.tw.n} 家`, `Taiwan ${story.tw.n}`) }) : null
  ]);
}

// One story in a list: what it's about and when, its headline, its
// coverage; its picture beside it, a play mark on it when it has a clip.
// `onOpen(story, list)`: the list it's in goes along (the sheet swipes through it).
// `why(story)`: what of the person's it's about (你關心的: 持股 台積電, 追蹤 湖人), before the kicker.
export function storyRow(story, onOpen, { side = true, list = null, why = null, mark = null, note = null } = {}) {
  const pic = withClip(storyPicture(story, 'nw-thumb'), story);
  const mine = why?.(story);
  const kicker = h('small', { class: 'nw-kicker' }, [mine ? mineTag(mine) : null, aboutLine(story, { days: false, when: true })]);
  // (`mark(text)`: the title's found words marked, a search's; `note(story)`: a line under it, why it was found.)
  const title = titleSpan(story, 'nw-row-title');
  const pieces = mark ? mark(title.textContent) : null;
  // (In one inline run: a clamped title's own children each take a line.)
  if (pieces) title.replaceChildren(h('span', {}, pieces));
  return h('button', { type: 'button', class: `nw-row${pic ? ' has-pic' : ''}`, 'data-story': story.id, onclick: tapStory(story, onOpen, list) }, [
    h('span', { class: 'nw-row-main' }, [kicker, title, note?.(story) || null, coverage(story, { side })]),
    pic
  ]);
}
export const storyList = (stories, onOpen, opts = {}) => h('div', { class: 'nw-list' }, stories.map(s => storyRow(s, onOpen, { ...opts, list: stories })));

// 今天五則: five lines, numbered, each what it's about (or what of the
// person's: 持股 台積電) over its headline; no pictures, the brief reads at a glance.
export const mineTag = mine => h('b', { class: `nw-mine-tag nw-mine-${mine.kind}`, text: `${mine.kind === 'hold' ? W('持股', 'Held') : W('追蹤', 'Following')} ${mine.label}` });
export function briefList(items, onOpen) {
  const list = items.map(x => x.story);
  return h(
    'ol',
    { class: 'nw-brief' },
    items.map(({ story, why }, i) =>
      h('li', {}, [
        h('button', { type: 'button', class: 'nw-brief-row', 'data-story': story.id, onclick: tapStory(story, onOpen, list) }, [
          h('span', { class: 'nw-brief-n', 'aria-hidden': 'true', text: String(i + 1) }),
          h('span', { class: 'nw-brief-main' }, [h('small', { class: 'nw-kicker' }, [why ? mineTag(why) : null, aboutLine(story, { days: false })]), titleSpan(story, 'nw-brief-title')])
        ])
      ])
    )
  );
}

// A story as a card (the front page's 要聞): its picture over its topic,
// headline and coverage on a wide page; a row with the picture beside it on
// a narrow one (by the grid's own width, news.css).
export function storyCard(story, onOpen, list = null) {
  const pic = withClip(storyPicture(story, 'nw-card-pic', { size: globalThis.innerWidth >= 600 ? 'l' : 's' }), story);
  return h('button', { type: 'button', class: `nw-card${pic ? ' has-pic' : ''}`, 'data-story': story.id, onclick: tapStory(story, onOpen, list) }, [
    pic,
    h('span', { class: 'nw-card-body' }, [h('small', { class: 'nw-kicker', text: aboutLine(story, { when: true }) }), titleSpan(story, 'nw-card-title'), coverage(story)])
  ]);
}
export const storyCards = (stories, onOpen) => h('div', { class: 'nw-cards q-rows-full' }, stories.map(s => storyCard(s, onOpen, stories)));

// A clip in the 影音 row: the outlet's YouTube picture with a play mark,
// the outlet and its headline. `onPlay({ story, clip })`.
export function clipCard(entry, onPlay) {
  const { story, clip } = entry;
  const pic = picture(clip[4] || story.img, 'nw-clip-pic', { size: 'l' }) || h('span', { class: 'nw-clip-pic' });
  pic.append(playMark());
  return h('button', { type: 'button', class: 'nw-clip', 'data-story': story.id, onclick: () => onPlay(entry) }, [
    pic,
    h('span', { class: 'nw-clip-src' }, [outletMark(clip[0], 18), h('span', { text: outletName(clip[0]) }), clip[1] ? null : h('small', { text: W('到網站看', 'On its site') })]),
    h('span', { class: 'nw-clip-title', lang: story.region === 'intl' ? 'en' : 'zh-Hant', text: clip[3] || story.title })
  ]);
}

// A lead story: its picture (the outlet's own, credited), what it's about,
// the headline at a title's size, the outlet's summary, its coverage.
export function leadCard(story, onOpen, { list = null, eager = true } = {}) {
  // (The credit follows the picture that loads, gone with the last.)
  const creditOf = by => W(`圖：${outletName(by)}`, `Photo: ${outletName(by)}`);
  const firstBy = picturesOf(story)[0]?.[1];
  const credit = firstBy ? h('small', { class: 'nw-credit', text: creditOf(firstBy) }) : null;
  const pic = withClip(storyPicture(story, 'nw-lead-pic', { size: 'l', eager, onBy: by => (by ? credit && (credit.textContent = creditOf(by)) : credit?.remove()) }), story);
  const about = aboutLine(story, { when: true });
  return h('button', { type: 'button', class: `nw-lead${pic ? ' has-pic' : ''}`, 'data-story': story.id, onclick: tapStory(story, onOpen, list) }, [
    pic,
    h('span', { class: 'nw-lead-body' }, [
      about ? h('small', { class: 'nw-kicker', text: about }) : null,
      titleSpan(story, 'nw-lead-title'),
      story.sum ? h('span', { class: 'nw-lead-sum', text: story.sum }) : null,
      h('span', { class: 'nw-lead-gap', 'aria-hidden': 'true' }),
      sidesTaken(story) ? h('span', { class: 'nw-lead-bar' }, [bar(story, { big: true }), counts(story, { full: true })]) : null,
      coverage(story, { bar: false }),
      credit
    ])
  ]);
}

// The front page's lead stories, one at a time, swiped sideways (a peek of
// the next one at its edge says there's more), with a dot each and ‹ › to
// step on a computer. Two at a time once the page is wide.
export function carousel(stories, onOpen) {
  const slides = stories.map((s, i) => h('div', { class: 'nw-hero-slide', role: 'group', 'aria-roledescription': W('頭條', 'lead story'), 'aria-label': `${i + 1} / ${stories.length}` }, [leadCard(s, onOpen, { list: stories, eager: i < 2 })]));
  const track = h('div', { class: 'nw-hero-track', 'data-noswipe': '' }, slides);
  const at = () => {
    const w = slides[1] ? slides[1].offsetLeft - slides[0].offsetLeft : 1;
    return Math.max(0, Math.min(slides.length - 1, Math.round(track.scrollLeft / (w || 1))));
  };
  const go = i => {
    const s = slides[Math.max(0, Math.min(slides.length - 1, i))];
    track.scrollTo({ left: s.offsetLeft - slides[0].offsetLeft, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };
  const dots = stories.map((s, i) => h('button', { type: 'button', class: `nw-dotbtn${i ? '' : ' on'}`, 'aria-label': W(`第 ${i + 1} 則`, `Story ${i + 1}`), 'aria-current': i ? null : 'true', onclick: () => go(i) }));
  const step = d => h('button', { type: 'button', class: `nw-step nw-step-${d > 0 ? 'next' : 'prev'}`, 'aria-label': d > 0 ? W('下一則', 'Next') : W('上一則', 'Previous'), text: d > 0 ? '›' : '‹', onclick: () => go(at() + d) });
  const prev = step(-1);
  const next = step(1);
  let frame = 0;
  const mark = () => {
    frame = 0;
    const i = at();
    dots.forEach((d, k) => (d.classList.toggle('on', k === i), k === i ? d.setAttribute('aria-current', 'true') : d.removeAttribute('aria-current')));
    prev.disabled = i === 0;
    next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
  };
  track.addEventListener('scroll', () => (frame ||= requestAnimationFrame(mark)), { passive: true });
  prev.disabled = true;
  return h('section', { class: 'nw-hero', 'aria-label': W('頭條', 'Top stories') }, [track, stories.length > 1 ? h('div', { class: 'nw-hero-nav' }, [prev, h('span', { class: 'nw-dots' }, dots), next]) : null]);
}

// The page's foot: when the stories were gathered, and from whom.
export function builtLine(page) {
  if (!page?.built) return null;
  const t = new Date(page.built);
  const hm = t.toLocaleTimeString(en ? 'en-GB' : 'zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false });
  return h('p', { class: 'nw-foot', text: W(`${hm} 整理 · 標題、摘要和圖片屬於各家媒體，點開到原網站看全文`, `Gathered at ${hm} · Headlines, summaries and pictures are each outlet's own; a tap opens its site`) });
}
