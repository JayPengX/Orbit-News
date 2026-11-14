// The pieces every list draws: a story's coverage (the outlets' marks, how
// many, and the bar of each side's count), its row, its card, the lead
// stories' carousel, and the line under a list.
import { h, tag } from '#kit/ui.mjs';
import { W, en, hooks, state, sideText, sideFull, ago, outletName, outletMark, topicName, readMark, isFollowing } from '../shell.mjs';
import * as kitUI from '#kit/ui.mjs';
import { titleOf } from '../lib/lines.mjs';
import { foreign, trCache } from '../lib/tr.mjs';
import { barOf, daysOf, outletsOf, sidesTaken, stateMedia, picturesOf, isLive, oneSideOf } from '../lib/stories.mjs';
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
export const shownTitle = story => titleOf(story, state.lines?.get?.(story.id), en, state.tr?.get?.(story.id));
// The outlet's summary as the reader sees it: in their language where it's
// been translated (lib/tr.mjs), else as the outlet wrote it.
export const shownSum = story => {
  const t = state.tr?.get?.(story.id);
  const other = foreign(story.sum, en);
  return other && t?.sum && t.s === story.sum ? { text: t.sum, lang: en ? 'en' : 'zh-Hant' } : { text: story.sum || '', lang: story.region === 'intl' ? 'en' : 'zh-Hant', wait: other };
};
// An outlet's own words in the reader's language: its translation where
// it's had (lib/tr.mjs), else as written, marked to be swapped when the
// story's translations come (views/story.mjs asks). `parts`: how it's
// drawn as written (a world story's learned words underlined).
export function said(tag, attrs, src, parts = [src]) {
  const other = foreign(src, en);
  const v = other ? trCache.get(src) : null;
  if (v) return h(tag, { ...attrs, lang: en ? 'en' : 'zh-Hant', text: v });
  const el = h(tag, attrs, parts);
  if (other) el.dataset.tr = src;
  return el;
}
const titleSpan = (story, cls) => {
  const t = shownTitle(story);
  return h('span', { class: cls, lang: t.lang, text: t.text });
};

// 快訊: a breaking story's mark before its kicker (a red dot that pulses).
export const liveTag = story => (isLive(story, state.page?.built) ? h('b', { class: 'nw-live-tag', text: W('快訊', 'Breaking') }) : null);
// 新進展: a story read before that has had a big development since (lib/reading.mjs readState).
export const newTag = story => (readMark(story) === 'new' ? h('b', { class: 'nw-new-tag', text: W('新進展', 'Updated') }) : null);
const kickerOf = (story, about, lead = null) => {
  const live = liveTag(story) || newTag(story);
  return live || lead || about ? h('small', { class: 'nw-kicker' }, [live, lead, about]) : null;
};
// How long ago, unless 快訊 or 新進展 already says it's now (the kicker one line at 320).
const whenShown = story => !isLive(story, state.page?.built) && readMark(story) !== 'new';
// A row or card read already (dimmed; Jay 11-13: "record what the user read"); one with news since isn't.
const readCls = story => (readMark(story) === 'read' ? ' nw-read' : '');
// What of theirs a story is about (追蹤 黃仁勳, 持股 台積電), on any list it's in (state.followed, lib/follows.mjs).
const followedWhy = story => state.followed?.get?.(story.id)?.why || null;

// What a story is about and how long it has run: 政治 · 報導 3 天; `when`
// adds how long ago it was last heard of.
export function aboutLine(story, { days = true, when = false, topic: withTopic = true, odds: withOdds = withTopic } = {}) {
  const topic = withTopic && story.topics?.[0] ? topicName(story.topics[0], story.region) : '';
  const d = daysOf(story);
  const run = days && d > 1 ? W(`報導 ${d} 天`, `${d} days`) : '';
  // (預測市場: a story with a market's chances in its sheet says so.)
  const odds = withOdds && state.markets?.has?.(story.id) ? W('預測市場', 'Market odds') : '';
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
// (An outlet followed first: Jay 11-13, yours where it covers the story.)
export function marks(story, most = 4) {
  const all = outletsOf(story);
  const ids = [...all.filter(id => isFollowing(`o:${id}`)), ...all.filter(id => !isFollowing(`o:${id}`))].slice(0, most);
  return h('span', { class: 'nw-marks', 'aria-hidden': 'true' }, ids.map(id => outletMark(id, 18)));
}
// 單邊's mark on a story wherever it's listed: words in the colour of the
// side that left it out, saying so in words (偏藍沒報, or 偏藍少報 where one
// or two carried it); never the counts (Jay 11-14: "using number to
// indicate is such a bad design"; the bar beside it shows the split, the
// sheet's line counts it).
export function oneSideTag(story) {
  const o = oneSideOf(story);
  if (!o) return null;
  // (Coloured words, not a capsule: the family's tags, docs/DESIGN.md §6.)
  return tag(o.L ? W(`${sideFull(o.light)}少報`, `Few ${LEANING[o.light].toLowerCase()}`) : W(`${sideFull(o.light)}沒報`, `None ${LEANING[o.light].toLowerCase()}`), 'tint', `var(--nw-${o.light})`);
}
// Who carried it and who didn't, in a line, by code (Jay 11-14): in the
// sheet with the counts, 偏左 20 家在報（CNN、衛報、NPR 等），偏右只有 2 家
// （福斯新聞、紐約郵報）; in a list by name only, no numbers on a card:
// 偏右只有福斯新聞、紐約郵報在報, or 只有偏綠的自由時報、三立新聞等在報.
const LEANING = { g: 'Green-leaning', b: 'Blue-leaning', l: 'Left-leaning', r: 'Right-leaning' };
export function oneSideLine(story, { full = false } = {}) {
  const o = oneSideOf(story);
  if (!o) return '';
  const names = (ids, most) => ids.slice(0, most).map(outletName).join(W('、', ', ')) + (ids.length > most ? W('等', ' and more') : '');
  if (!full)
    return o.L
      ? W(`${sideFull(o.light)}只有${names(o.few, 2)}在報`, `Of the ${LEANING[o.light].toLowerCase()}, only ${names(o.few, 2)}`)
      : W(`只有${sideFull(o.heavy)}的${names(o.carried, 2)}在報`, `Only the ${LEANING[o.heavy].toLowerCase()}: ${names(o.carried, 2)}`);
  const few = o.L ? W(`只有 ${o.L} 家（${names(o.few, 2)}）`, `only ${o.L} (${names(o.few, 2)})`) : W('一家都沒報', 'none');
  const many = W(`${o.H} 家在報（${names(o.carried, 3)}）`, `${o.H} (${names(o.carried, 3)})`);
  return W(`${sideFull(o.heavy)} ${many}，${sideFull(o.light)}${few}`, `${LEANING[o.heavy]}: ${many}; ${LEANING[o.light].toLowerCase()}: ${few}`);
}
// A story's coverage in a line: the marks, how many outlets, the bar (only
// for a kind sides take: the spectrum is one feature, Jay 11-10), and its
// 單邊 mark when one side left it out, or all but.
export function coverage(story, { side = true, bar: withBar = true } = {}) {
  const tail = side ? oneSideTag(story) : null;
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
// `why(story)`: what of the person's it's about (持股 台積電, 追蹤 湖人), before the kicker; else what's followed (state.followed).
export function storyRow(story, onOpen, { side = true, list = null, why = null, mark = null, note = null } = {}) {
  const pic = withClip(storyPicture(story, 'nw-thumb'), story);
  const mine = why ? why(story) : followedWhy(story);
  // (What of theirs it's about stands for its topic: one line at 320, Jay's 11-12 rule.)
  const kicker = kickerOf(story, aboutLine(story, { days: false, when: whenShown(story), topic: !mine }), mine ? mineTag(mine) : null);
  // (`mark(text)`: the title's found words marked, a search's; `note(story)`: a line under it, why it was found.)
  const title = titleSpan(story, 'nw-row-title');
  const pieces = mark ? mark(title.textContent) : null;
  // (In one inline run: a clamped title's own children each take a line.)
  if (pieces) title.replaceChildren(h('span', {}, pieces));
  return h('button', { type: 'button', class: `nw-row${pic ? ' has-pic' : ''}${readCls(story)}`, 'data-story': story.id, onclick: tapStory(story, onOpen, list) }, [
    h('span', { class: 'nw-row-main' }, [kicker, title, note?.(story) || null, coverage(story, { side })]),
    pic
  ]);
}
export const storyList = (stories, onOpen, opts = {}) => h('div', { class: 'nw-list' }, stories.map(s => storyRow(s, onOpen, { ...opts, list: stories })));

// 今天五則: five lines, numbered, each what it's about (or what of the
// person's: 持股 台積電) over its headline; no pictures, the brief reads at a glance.
// (A follow by its name alone, in the follow's colour: the kicker stays one line at 320.)
// An outlet the reader follows, put first inside a story (its headline, its
// clip) and said so: never lifted unseen (Jay 11-14: "mark it so user know
// they follow it and it's not secretly being push front causing bias reading").
export const followsOutlet = id => isFollowing(`o:${id}`);
export const followedFirst = (list, idOf) => [...list.filter(x => followsOutlet(idOf(x))), ...list.filter(x => !followsOutlet(idOf(x)))];
export const followMark = () => h('small', { class: 'nw-follow-mark', text: W('★ 追蹤', '★ Following') });
export const mineTag = mine => h('b', { class: `nw-mine-tag nw-mine-${mine.kind}`, text: mine.kind === 'hold' ? `${W('持股', 'Held')} ${mine.label}` : mine.label });
export function briefList(items, onOpen) {
  const list = items.map(x => x.story);
  return h(
    'ol',
    { class: 'nw-brief' },
    items.map(({ story, why }, i) =>
      h('li', {}, [
        h('button', { type: 'button', class: `nw-brief-row${readCls(story)}`, 'data-story': story.id, onclick: tapStory(story, onOpen, list) }, [
          h('span', { class: 'nw-brief-n', 'aria-hidden': 'true', text: String(i + 1) }),
          h('span', { class: 'nw-brief-main' }, [h('small', { class: 'nw-kicker' }, [newTag(story), why ? mineTag(why) : null, aboutLine(story, { days: false })]), titleSpan(story, 'nw-brief-title')])
        ])
      ])
    )
  );
}

// A story as a card (the front page's 要聞): its picture over its topic,
// headline and coverage on a wide page; a row with the picture beside it on
// a narrow one (by the grid's own width, news.css).
export function storyCard(story, onOpen, list = null) {
  const mine = followedWhy(story);
  const pic = withClip(storyPicture(story, 'nw-card-pic', { size: globalThis.innerWidth >= 600 ? 'l' : 's' }), story);
  return h('button', { type: 'button', class: `nw-card${pic ? ' has-pic' : ''}${readCls(story)}`, 'data-story': story.id, onclick: tapStory(story, onOpen, list) }, [
    pic,
    h('span', { class: 'nw-card-body' }, [kickerOf(story, aboutLine(story, { days: !mine, when: whenShown(story), topic: !mine }), mine ? mineTag(mine) : null), titleSpan(story, 'nw-card-title'), coverage(story)])
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
    h('span', { class: 'nw-clip-src' }, [outletMark(clip[0], 18), h('span', { text: outletName(clip[0]) }), followsOutlet(clip[0]) ? followMark() : null, clip[1] ? null : h('small', { text: W('到網站看', 'On its site') })]),
    clip[3] ? said('span', { class: 'nw-clip-title', lang: story.region === 'intl' ? 'en' : 'zh-Hant' }, clip[3]) : h('span', { class: 'nw-clip-title', lang: shownTitle(story).lang, text: shownTitle(story).text })
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
  const mine = followedWhy(story);
  const about = aboutLine(story, { days: !mine, when: whenShown(story), topic: !mine });
  return h('button', { type: 'button', class: `nw-lead${pic ? ' has-pic' : ''}${readCls(story)}`, 'data-story': story.id, onclick: tapStory(story, onOpen, list) }, [
    pic,
    h('span', { class: 'nw-lead-body' }, [
      kickerOf(story, about, mine ? mineTag(mine) : null),
      titleSpan(story, 'nw-lead-title'),
      story.sum ? h('span', { class: 'nw-lead-sum', lang: shownSum(story).lang, text: shownSum(story).text }) : null,
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
