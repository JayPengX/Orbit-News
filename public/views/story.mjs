// A story's sheet: its picture and summary (credited to their outlets), the
// bar with every side's count, which side left it out, which parties its
// headlines name, and every outlet's headlines side by side: one column a
// side (偏綠 · 中間 · 偏藍, or left · centre · right and the unrated), one
// over the other on a phone. A headline opens the outlet's own page.
import { h, sheet, tag } from '#kit/ui.mjs';
import * as kitUI from '#kit/ui.mjs';
import { PARTY_WORDS } from '#kit/news-outlets.mjs';
import { state, hooks, W, sideFull, ago, outletName, outletMark, outletLink, regionName, topicName } from '../shell.mjs';
import { storyById, bySide, ENDS } from '../lib/stories.mjs';
import { bar, counts, clipCard, playMark } from './parts.mjs';

// A YouTube clip in YouTube's own player (its privacy-enhanced address:
// no cookie until it plays); counted for 我的閱讀 as its outlet's.
export function player(clip) {
  hooks.read(clip[0]);
  return h('div', { class: 'nw-player' }, [
    h('iframe', {
      src: `https://www.youtube-nocookie.com/embed/${clip[1]}?autoplay=1&playsinline=1&rel=0`,
      title: clip[3] || 'YouTube',
      allow: 'autoplay; encrypted-media; picture-in-picture; fullscreen',
      allowfullscreen: true,
      referrerpolicy: 'strict-origin-when-cross-origin'
    })
  ]);
}

let shown = null;
// A story's sheet; `clip`: a YouTube id to play at its head at once.
export function openStory(id, { clip = '' } = {}) {
  const story = storyById(state.page, id, state.past);
  // (An older story, from a link: the past read first.)
  if (!story) return void (!state.past && hooks.past().then(() => storyById(state.page, id, state.past) && openStory(id, { clip })));
  shown?.close?.();
  const groups = bySide(story);
  const sides = [...Object.keys(groups).filter(k => k !== 'none'), 'none'];
  const ends = ENDS[story.region];
  const cards = sides
    .filter(s => groups[s].length || ends.includes(s))
    .map(s => sideCard(s, groups[s], story));
  const parties = story.parties?.length ? W(`標題提到：${story.parties.map(p => PARTY_WORDS[p][0]).join('、')}`, `Headlines name: ${story.parties.map(p => PARTY_WORDS[p][1]).join(', ')}`) : '';
  // The head's picture, or the clip playing; a story with a clip shows its
  // picture with a play mark, and a tap plays it there.
  const yt = (story.clips || []).filter(c => c[1]);
  // (Credited; a clip also opens on YouTube, should its player refuse here.)
  const credit = c =>
    h('figcaption', {}, [
      c ? W(`影片：${outletName(c[0])}`, `Video: ${outletName(c[0])}`) : W(`圖：${outletName(story.imgBy)}`, `Photo: ${outletName(story.imgBy)}`),
      c ? h('a', { href: `https://www.youtube.com/watch?v=${c[1]}`, target: '_blank', rel: 'noopener', text: W('在 YouTube 看', 'Watch on YouTube') }) : null
    ]);
  const media = h('figure', { class: 'nw-story-pic' });
  const playIn = c => media.replaceChildren(player(c), credit(c));
  const still = story.img || yt[0]?.[4];
  if (clip && yt.some(c => c[1] === clip)) playIn(yt.find(c => c[1] === clip));
  else if (still) {
    const img = h('img', { src: still, alt: '', decoding: 'async', referrerpolicy: 'no-referrer', onerror: e => (yt.length ? e.target.remove() : media.remove()) });
    media.append(
      yt.length ? h('button', { type: 'button', class: 'nw-story-play', 'aria-label': W('播放影片', 'Play the clip'), onclick: () => playIn(yt[0]) }, [img, playMark()]) : img,
      yt.length ? credit(yt[0]) : story.imgBy ? credit(null) : ''
    );
  }
  const pic = media.childNodes.length ? media : null;
  // The other clips (and outlets' own video pages): a row under the head.
  const others = (story.clips || []).filter(c => c[1] !== (clip || yt[0]?.[1]));
  const clipRow = others.length
    ? h('section', { class: 'nw-story-clips' }, [
        h('h3', { text: W('影音', 'Video') }),
        kitUI.rail(others.map(c => clipCard({ story, clip: c }, ({ clip: x }) => (x[1] ? (playIn(x), media.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' })) : (hooks.read(x[0]), globalThis.open?.(x[2], '_blank', 'noopener'))))))
      ])
    : null;
  // How coverage grew: each day's headlines, a bar a day.
  const peak = Math.max(1, ...(story.days || []).map(d => d[1]));
  const growth =
    story.days?.length > 1
      ? h('div', { class: 'nw-days', role: 'img', 'aria-label': story.days.map(([d, n]) => `${d} ${n}`).join(', ') }, [
          h('small', { text: W(`每天的報導，共 ${story.m || story.items.length} 則`, `Headlines a day, ${story.m || story.items.length} in all`) }),
          h('span', { class: 'nw-days-bars' }, story.days.map(([d, n]) => h('span', { class: 'nw-day' }, [h('i', { style: { height: `${Math.max(8, (n / peak) * 100)}%` } }), h('small', { text: d.replace(/^0?(\d+)-0?(\d+)$/, '$1/$2') })])))
        ])
      : null;
  const topics = (story.topics || []).map(t => topicName(t, story.region)).filter(Boolean);
  // The picture and the words beside it on a wide sheet, one over the other on a phone.
  const head = h('div', { class: 'nw-story-head' }, [
    pic,
    h('div', { class: 'nw-story-text' }, [
      topics.length ? h('small', { class: 'nw-about', text: topics.join(' · ') }) : null,
      h('h2', { class: 'nw-story-title', lang: story.region === 'intl' ? 'en' : 'zh-Hant', text: story.title }),
      story.sum ? h('p', { class: 'nw-sum', lang: story.region === 'intl' ? 'en' : 'zh-Hant' }, [story.sum, story.sumBy ? h('small', { text: ` — ${outletName(story.sumBy)}` }) : null]) : null,
      h('div', { class: 'nw-story-bar' }, [bar(story, { big: true }), counts(story, { full: true })]),
      story.blind ? h('p', { class: 'nw-story-note' }, [tag(W(`${sideFull(story.blind)}的媒體都沒報`, `No ${sideFull(story.blind).toLowerCase()} outlet carries it`), 'tint', `var(--nw-${story.blind})`)]) : null,
      h('p', { class: 'nw-story-line', text: [W(`${story.n} 家媒體`, `${story.n} outlets`), W(`最早 ${ago(story.first)}`, `first ${ago(story.first)}`), W(`最新 ${ago(story.at)}`, `latest ${ago(story.at)}`), parties].filter(Boolean).join(' · ') }),
      growth
    ])
  ]);
  const body = h('div', { class: 'nw-story' }, [
    head,
    clipRow,
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
