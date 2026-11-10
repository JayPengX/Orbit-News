// A story's sheet: its picture and summary (credited to their outlets), its
// coverage (how many outlets of each side, which side left it out, which
// parties its headlines name, a bar a day), the outlets' clips, and every
// outlet's headlines side by side: one column a side (偏綠 · 中間 · 偏藍, or
// left · centre · right, China's state media apart), one over the other on a
// phone. A headline opens the outlet's own page. A swipe sideways (or ‹ ›,
// or the arrow keys) goes to the story beside it in the list it came from.
import { h, sheet, tag } from '#kit/ui.mjs';
import * as kitUI from '#kit/ui.mjs';
import { PARTY_WORDS } from '#kit/news-outlets.mjs';
import { state, hooks, W, sideFull, ago, outletName, outletMark, outletLink, regionName, topicName } from '../shell.mjs';
import { storyById, bySide, barOf, stateMedia, sidesTaken, daysOf } from '../lib/stories.mjs';
import { bar, marks, clipCard, playMark } from './parts.mjs';

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
// A story's sheet. `clip`: a YouTube id to play at its head at once; `list`:
// the stories it was opened from, in their order (else its region's page).
export function openStory(id, { clip = '', list = null } = {}) {
  const story = storyById(state.page, id, state.past);
  // (An older story, from a link: the past read first.)
  if (!story) return void (!state.past && hooks.past().then(() => storyById(state.page, id, state.past) && openStory(id, { clip, list })));
  shown?.close?.();
  const from = (list?.length ? list : state.page?.[story.region] || []).filter(Boolean);
  const order = from.some(s => s.id === id) ? from : [story];
  let at = order.findIndex(s => s.id === id);
  const body = h('div', { class: 'nw-story' });
  // (Where it is in its list, under the sheet's title: 3 / 20.)
  const where = order.length > 1 ? h('small', { class: 'q-sheet-sub nw-story-at' }) : null;
  const sh = sheet({ title: regionName(story.region), cls: 'q-sheet-wide nw-story-sheet', body: [body], label: story.title, onClose: () => (shown = null) });
  if (where) sh.head.querySelector('h2')?.after(where);
  shown = sh;
  const draw = (i, opts = {}) => {
    at = i;
    const s = order[i];
    body.replaceChildren(...storyParts(s, { ...opts, nav: order.length > 1 ? navOf(order, i, step) : null }));
    sh.el.setAttribute('aria-label', s.title);
    if (where) where.textContent = `${i + 1} / ${order.length}`;
  };
  // The story beside: drawn at the sheet's top (the kit's own swipe slides it in).
  const step = (dir, { top = true } = {}) => {
    const i = at + dir;
    if (i < 0 || i >= order.length) return false;
    draw(i);
    if (top && kitUI.freshScreen) kitUI.freshScreen(sh.el);
    else if (top) sh.el.scrollTo?.(0, 0);
    return true;
  };
  draw(at, { clip });
  kitUI.daySwipe?.(body, dir => step(dir));
  sh.el.addEventListener('keydown', e => {
    if (e.target.closest?.('input, textarea, iframe') || e.altKey || e.metaKey || e.ctrlKey) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') step(e.key === 'ArrowRight' ? 1 : -1) && e.preventDefault();
  });
}

// A story's clip played from a list (a tap on its picture's play mark).
hooks.play = (id, clip, list) => openStory(id, { clip, list });

// The way to the stories beside it: ‹ the one before, the one after ›.
function navOf(order, i, step) {
  const side = (dir, s) =>
    s
      ? h('button', { type: 'button', class: `nw-story-go nw-go-${dir > 0 ? 'next' : 'prev'}`, onclick: () => step(dir) }, [
          h('small', { text: dir > 0 ? W('下一則 ›', 'Next ›') : W('‹ 上一則', '‹ Previous') }),
          h('span', { lang: s.region === 'intl' ? 'en' : 'zh-Hant', text: s.title })
        ])
      : h('span', { class: 'nw-story-go none' });
  return h('nav', { class: 'nw-story-nav', 'aria-label': W('上一則、下一則', 'Previous and next') }, [side(-1, order[i - 1]), side(1, order[i + 1])]);
}

// One story's parts, top to bottom.
function storyParts(story, { clip = '', nav = null } = {}) {
  const lang = story.region === 'intl' ? 'en' : 'zh-Hant';
  const groups = bySide(story);
  const sides = [...Object.keys(groups).filter(k => k !== 'none'), 'none'];
  const cards = sides.filter(s => groups[s].length || (s !== 'none' && sidesTaken(story))).map(s => sideCard(s, groups[s], story));
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
  // The other clips (and outlets' own video pages): a row of their own.
  const others = (story.clips || []).filter(c => c[1] !== (clip || yt[0]?.[1]));
  const clipRow = others.length
    ? h('section', { class: 'nw-story-clips' }, [
        h('h3', {}, [W('影音', 'Video'), h('small', { text: ` ${others.length}` })]),
        kitUI.rail(others.map(c => clipCard({ story, clip: c }, ({ clip: x }) => (x[1] ? (playIn(x), media.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' })) : (hooks.read(x[0]), globalThis.open?.(x[2], '_blank', 'noopener'))))))
      ])
    : null;
  const topics = (story.topics || []).map(t => topicName(t, story.region)).filter(Boolean);
  const d = daysOf(story);
  const about = [...topics, d > 1 ? W(`報導 ${d} 天`, `${d} days`) : ''].filter(Boolean).join(' · ');
  // The picture and the words beside it on a wide sheet, one over the other on a phone.
  const head = h('div', { class: 'nw-story-head' }, [
    pic,
    h('div', { class: 'nw-story-text' }, [
      about ? h('small', { class: 'nw-kicker', text: about }) : null,
      h('h2', { class: 'nw-story-title', lang, text: story.title }),
      story.sum ? h('p', { class: 'nw-sum', lang }, [story.sum, story.sumBy ? h('small', { text: ` — ${outletName(story.sumBy)}` }) : null]) : null,
      h('p', { class: 'nw-story-line' }, [marks(story, 6), h('span', { text: [W(`${story.n} 家`, `${story.n} outlets`), W(`${story.m || story.items.length} 則`, `${story.m || story.items.length} reports`), ago(story.at)].join(' · ') })])
    ])
  ]);
  // (Its other clips right under it: watching is part of the story.)
  return [
    head,
    clipRow,
    spectrum(story),
    h('div', { class: 'q-sheet-cols nw-sides' }, cards),
    nav,
    h('p', { class: 'nw-foot', text: W('標題、摘要和圖片屬於各家媒體；點標題到原網站看全文。', 'Headlines, summaries and pictures are each outlet’s own; tap one to read it on its site.') })
  ].filter(Boolean); // (replaceChildren would write a missing part as "null")
}

// Who carries it: the bar with each side's count under it (and China's
// state media apart), the side that left it out, the parties its headlines
// name, how coverage grew a day at a time. For a kind sides don't take (a
// game, a storm), only the outlets and the days.
function spectrum(story) {
  const { parts } = barOf(story);
  const sm = stateMedia(story);
  const taken = sidesTaken(story);
  const parties = story.parties?.length ? W(`標題提到 ${story.parties.map(p => PARTY_WORDS[p][0]).join('、')}`, `Headlines name the ${story.parties.map(p => PARTY_WORDS[p][1]).join(', ')}`) : '';
  const legend = h('div', { class: 'nw-legend' }, [
    ...parts.map(p => h('span', { class: 'nw-legend-part' }, [h('small', {}, [h('i', { class: `nw-dot nw-s-${p.side}`, 'aria-hidden': 'true' }), sideFull(p.side)]), h('b', { text: String(p.n) })])),
    sm ? h('span', { class: 'nw-legend-part' }, [h('small', {}, [h('i', { class: 'nw-dot nw-s-none', 'aria-hidden': 'true' }), W('中國官媒', 'China state media')]), h('b', { text: String(sm) })]) : null
  ]);
  const peak = Math.max(1, ...(story.days || []).map(x => x[1]));
  const growth =
    story.days?.length > 1
      ? h('div', { class: 'nw-days', role: 'img', 'aria-label': story.days.map(([x, n]) => `${x} ${n}`).join(', ') }, [
          h('small', { text: W('每天的報導', 'Reports a day') }),
          h('span', { class: 'nw-days-bars' }, story.days.map(([x, n]) => h('span', { class: 'nw-day' }, [h('i', { style: { height: `${Math.max(8, (n / peak) * 100)}%` } }), h('small', { text: x.replace(/^0?(\d+)-0?(\d+)$/, '$1/$2') })])))
        ])
      : null;
  return h('section', { class: 'nw-spec' }, [
    h('div', { class: 'nw-spec-head' }, [h('b', { text: taken ? W('各邊的報導', 'Coverage by side') : W('報導的媒體', 'Who covers it') }), h('small', { text: W(`${story.n} 家`, `${story.n} outlets`) })]),
    bar(story, { big: true }),
    legend,
    taken && story.blind ? h('p', { class: 'nw-spec-note' }, [tag(W(`${sideFull(story.blind)}的媒體都沒報`, `No ${sideFull(story.blind).toLowerCase()} outlet carries it`), 'tint', `var(--nw-${story.blind})`)]) : null,
    !taken ? h('p', { class: 'nw-spec-say', text: W('生活、健康、科學、文化和運動新聞沒有立場之分，這裡只看哪些媒體在報。', 'Life, health, science, culture and sport have no sides to take: this shows only who covers it.') }) : null,
    parties ? h('p', { class: 'nw-spec-say', text: parties }) : null,
    growth
  ]);
}

// One side's column: its name and count, each outlet's headlines; a side
// with none says so (that's the point of the page).
function sideCard(side, items, story) {
  const outlets = [...new Set(items.map(it => it[0]))];
  const head = h('div', { class: 'nw-side-head' }, [
    h('i', { class: `nw-dot nw-s-${side}`, 'aria-hidden': 'true' }),
    h('b', { text: side === 'none' ? W('中國官媒', 'China state media') : sideFull(side) }),
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
