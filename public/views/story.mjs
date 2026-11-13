// A story's sheet: its picture and summary (credited to their outlets), its
// coverage (how many outlets of each side, which side left it out, which
// parties its headlines name, a bar a day), the outlets' clips, and every
// outlet's headlines side by side: one column a side (偏綠 · 中間 · 偏藍, or
// left · centre · right, China's state media apart), one over the other on a
// phone. A headline opens the outlet's own page. A swipe sideways (or ‹ ›,
// or the arrow keys) goes to the story beside it in the list it came from.
import { h, sheet, tag, moreToggle, list, cell } from '#kit/ui.mjs';
import * as kitUI from '#kit/ui.mjs';
import { PARTY_WORDS } from '#kit/news-outlets.mjs';
import { state, hooks, W, en, sideFull, ago, outletName, outletMark, outletLink, regionName, topicName, openOut } from '../shell.mjs';
import { storyById, bySide, barOf, stateMedia, sidesTaken, daysOf, picturesOf, relatedOf, timelineOf } from '../lib/stories.mjs';
import { followKey } from '../lib/reading.mjs';
import { followPill, wordsKey } from './follows.mjs';
import { sized } from '../lib/pics.mjs';
import { bar, marks, clipCard, playMark, shownTitle, storyList } from './parts.mjs';
import { learnParts, wordsIn } from '../lib/learn.mjs';
import { sidesOf } from '../lib/sides.mjs';
import { pcts, move, sourceUrl } from '../lib/markets.mjs';
import { itemOf } from '../lib/brief.mjs';

// 新聞學單字: on a world story, the words being learned in Orbit Words
// underlined in its English lines (lib/learn.mjs; the notebook's, nothing
// sent), and listed under its headlines, each opening its card in Words.
const learning = story => (story.region === 'intl' && state.learn) || null;
const marked = (text, story) =>
  learning(story) ? learnParts(text, state.learn).map(p => (typeof p === 'string' ? p : h('u', { class: 'nw-learn', title: p.zh, text: p.t }))) : [text];
function learnPart(story) {
  const set = learning(story);
  const words = set ? wordsIn([story.title, story.sum, ...(story.items || []).map(it => it[1])], set, 8) : [];
  if (!words.length) return null;
  return h('section', { class: 'nw-learn-sec' }, [
    h('h3', { class: 'nw-story-h', text: W('學單字', 'Words you’re learning') }),
    h('p', { class: 'nw-learn-note', text: W('這則用到你在 Orbit Words 學的字，點一下看單字卡。', 'This story uses words you’re learning in Orbit Words. Tap one for its card.') }),
    h('div', { class: 'q-chips nw-learn-words' }, words.map(w => h('button', { type: 'button', class: 'q-chip nw-learn-word', onclick: () => hooks.word(w.w) }, [h('b', { lang: 'en', text: w.w }), w.zh ? h('small', { lang: 'zh-Hant', text: w.zh }) : null].filter(Boolean))))
  ]);
}

// A YouTube clip in YouTube's own player (its privacy-enhanced address:
// no cookie until it plays); counted for 我的閱讀 as its outlet's. Should
// YouTube refuse to play it here (its owner allows it only on YouTube, or
// it's gone), the player says so and opens it there (Jay 11-10: clips that
// won't play).
export function player(clip) {
  hooks.read(clip[0]);
  const frame = h('iframe', {
    src: `https://www.youtube-nocookie.com/embed/${clip[1]}?autoplay=1&playsinline=1&rel=0&enablejsapi=1&origin=${encodeURIComponent(location.origin)}`,
    title: clip[3] || 'YouTube',
    allow: 'autoplay; encrypted-media; picture-in-picture; fullscreen',
    allowfullscreen: true,
    referrerpolicy: 'strict-origin-when-cross-origin'
  });
  const box = h('div', { class: 'nw-player' }, [frame]);
  const refused = () =>
    box.replaceChildren(
      h('a', { class: 'nw-player-out', href: `https://www.youtube.com/watch?v=${clip[1]}`, target: '_blank', rel: 'noopener' }, [
        clip[4] ? h('img', { src: clip[4], alt: '', referrerpolicy: 'no-referrer' }) : null,
        h('span', { text: W('這段影片只能在 YouTube 看 ›', 'This clip plays only on YouTube ›') })
      ])
    );
  // (YouTube's player tells the page it's in what happens, once asked to: an
  // error 100, 101 or 150 is a clip that won't play here.)
  const hear = e => {
    if (e.source !== frame.contentWindow) return;
    let m = e.data;
    try {
      m = typeof m === 'string' ? JSON.parse(m) : m;
    } catch {
      return;
    }
    if (m?.event === 'onError' && [2, 5, 100, 101, 150, 153].includes(Number(m.info))) (removeEventListener('message', hear), refused());
  };
  addEventListener('message', hear);
  frame.addEventListener('load', () => frame.contentWindow?.postMessage(JSON.stringify({ event: 'listening', id: clip[1], channel: 'widget' }), '*'));
  return box;
}

let shown = null;
// A story's sheet. `clip`: a YouTube id to play at its head at once; `list`:
// the stories it was opened from, in their order (else its region's page).
export function openStory(id, { clip = '', list = null, via = '' } = {}) {
  const find = () => storyById(state.page, id, state.past, state.sport);
  const story = find();
  // (An older story, from a link: the past read first. A sports report Orbit
  // Sports' 相關新聞 opened, one outlet's, not on News' pages: the sports pack.)
  // (Gone from all, or the older ones unreadable: said, never a tap that does nothing.)
  const gone = () => kitUI.toast?.(state.pastFailed ? W('暫時讀不到這則新聞，稍後再試。', 'Can’t get this story right now. Try again shortly.') : W('這則新聞已經不在了。', 'This story is no longer available.'), { ms: 2400 });
  const again = () => (find() ? openStory(id, { clip, list, via }) : gone());
  const past = () => (state.past ? gone() : hooks.past().then(again));
  if (!story) return void (!state.sport && hooks.sport ? hooks.sport().then(() => (find() ? again() : past())) : past());
  // (What's opened teaches 今天五則: from it, or from anywhere else.)
  state.fb?.picked?.('news', itemOf(story), Date.now(), { from: via === 'brief' ? 'list' : 'elsewhere' });
  shown?.close?.();
  const from = (list?.length ? list : state.page?.[story.region] || []).filter(Boolean);
  const order = from.some(s => s.id === id) ? from : [story];
  let at = order.findIndex(s => s.id === id);
  const body = h('div', { class: 'nw-story' });
  // (The way to the stories beside it stays at the sheet's foot: ‹ 上一則 3 / 20 下一則 ›.)
  const foot = order.length > 1 ? footOf(order, d => step(d)) : null;
  const sh = sheet({ title: regionName(story.region), cls: 'q-sheet-wide nw-story-sheet', body: [body], foot, label: story.title, onClose: () => {
      shown = null;
      // (The link's #s= let go: the same link opens it again.)
      if (/^#s=/.test(location.hash)) history.replaceState(history.state, '', `#${state.tab}`);
    } });
  shown = sh;
  const draw = (i, opts = {}) => {
    at = i;
    const s = order[i];
    // (Read: its row quieter once the sheet closes; big news since, 新進展.)
    hooks.opened(s);
    body.replaceChildren(...storyParts(s, opts));
    sh.el.setAttribute('aria-label', s.title);
    foot?.paint(i);
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

// The sheet's foot: ‹ the one before, where it is (3 / 20), the one after ›;
// on a wide sheet each says its headline (Jay 11-10: hard to get around).
function footOf(order, step) {
  const go = dir => {
    const t = h('span', { class: 'nw-foot-t' });
    const b = h('button', { type: 'button', class: `nw-foot-go nw-foot-${dir > 0 ? 'next' : 'prev'}`, onclick: () => step(dir) }, [
      h('b', { text: dir > 0 ? W('下一則 ›', 'Next ›') : W('‹ 上一則', '‹ Previous') }),
      t
    ]);
    return Object.assign(b, { t });
  };
  const prev = go(-1);
  const next = go(1);
  const at = h('small', { class: 'nw-foot-at', 'aria-live': 'polite' });
  const nav = h('nav', { class: 'q-sheet-foot nw-story-foot', 'aria-label': W('上一則、下一則', 'Previous and next') }, [prev, at, next]);
  return Object.assign(nav, {
    paint(i) {
      prev.disabled = i <= 0;
      next.disabled = i >= order.length - 1;
      prev.t.textContent = order[i - 1]?.title || '';
      next.t.textContent = order[i + 1]?.title || '';
      at.textContent = `${i + 1} / ${order.length}`;
    }
  });
}

// One story's parts, top to bottom.
// The sheet's headline: the AI's in the reader's language over the outlets'
// own (a world story on a Chinese phone), said to be the AI's.
function storyTitle(story, lang) {
  const t = shownTitle(story);
  return [
    h('h2', { class: 'nw-story-title', lang: t.lang, text: t.text }),
    t.ai ? h('p', { class: 'nw-story-orig', lang }, marked(story.title, story)) : null,
    t.ai ? h('small', { class: 'nw-ai-note', text: W('標題由 AI 依各家標題翻譯', 'Headline translated by AI from the outlets’ own') }) : null
  ];
}

function storyParts(story, { clip = '' } = {}) {
  const lang = story.region === 'intl' ? 'en' : 'zh-Hant';
  const groups = bySide(story);
  const sides = [...Object.keys(groups).filter(k => k !== 'none'), 'none'];
  const cards = sides.filter(s => groups[s].length || (s !== 'none' && sidesTaken(story))).map(s => sideCard(s, groups[s], story));
  // The head's picture, or the clip playing; a story with a clip shows its
  // picture with a play mark, and a tap plays it there.
  const yt = (story.clips || []).filter(c => c[1]);
  // (Credited; a clip also opens on YouTube, should its player refuse here.)
  const credit = (c, by = story.imgBy) =>
    h('figcaption', {}, [
      c ? W(`影片：${outletName(c[0])}`, `Video: ${outletName(c[0])}`) : W(`圖：${outletName(by)}`, `Photo: ${outletName(by)}`),
      c ? h('a', { href: `https://www.youtube.com/watch?v=${c[1]}`, target: '_blank', rel: 'noopener', text: W('在 YouTube 看', 'Watch on YouTube') }) : null
    ]);
  const media = h('figure', { class: 'nw-story-pic' });
  const playIn = c => media.replaceChildren(player(c), credit(c));
  const pics = picturesOf(story);
  const still = pics[0]?.[0] || yt[0]?.[4];
  if (clip && yt.some(c => c[1] === clip)) playIn(yt.find(c => c[1] === clip));
  else if (still) {
    // (One that won't load gives way to another outlet's, then the clip's
    // own still; the credit follows it. Each asked at a sheet's size first,
    // lib/pics.mjs, then as given.)
    const next = [...pics, ...(yt[0]?.[4] ? [[yt[0][4], '']] : [])].flatMap(a => [[sized(a[0], 'l'), a[1]], a]).filter((a, i, all) => all.findIndex(b => b[0] === a[0]) === i);
    next.shift();
    let cap = yt.length ? credit(yt[0]) : pics[0]?.[1] ? credit(null, pics[0][1]) : null;
    const img = h('img', {
      src: sized(still, 'l'),
      alt: '',
      decoding: 'async',
      referrerpolicy: 'no-referrer',
      onerror: () => {
        const alt = next.shift();
        if (!alt) return void (yt.length ? img.remove() : media.remove());
        img.src = alt[0];
        if (!yt.length && cap && alt[1]) cap.replaceWith((cap = credit(null, alt[1])));
      }
    });
    media.append(yt.length ? h('button', { type: 'button', class: 'nw-story-play', 'aria-label': W('播放影片', 'Play the clip'), onclick: () => playIn(yt[0]) }, [img, playMark()]) : img, cap || '');
  }
  const pic = media.childNodes.length ? media : null;
  // The other clips (and outlets' own video pages): a row of their own.
  const others = (story.clips || []).filter(c => c[1] !== (clip || yt[0]?.[1]));
  const clipRow = others.length
    ? h('section', { class: 'nw-story-clips' }, [
        h('h3', {}, [W('影音', 'Video'), h('small', { text: ` ${others.length}` })]),
        kitUI.rail(others.map(c => clipCard({ story, clip: c }, ({ clip: x }) => (x[1] ? (playIn(x), media.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' })) : (hooks.read(x[0]), openOut(x[2]))))))
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
      ...storyTitle(story, lang),
      // (Our 重點整理 below says it fuller: the outlet's own summary then left to its site.)
      story.sum && !state.briefs?.has?.(story.id) ? h('p', { class: 'nw-sum', lang }, [...marked(story.sum, story), story.sumBy ? h('small', { text: ` — ${outletName(story.sumBy)}` }) : null]) : null,
      h('p', { class: 'nw-story-line' }, [marks(story, 6), h('span', { text: [W(`${story.n} 家`, `${story.n} outlets`), W(`${story.m || story.items.length} 則`, `${story.m || story.items.length} reports`), ago(story.at)].join(' · ') })]),
      followRow(story)
    ])
  ]);
  // (Its other clips right under it: watching is part of the story.)
  // Then who carries it, each side's outlets and how they put it, Taiwan's
  // outlets on a world story, and how it grew a day at a time.
  return [
    head,
    pointsOf(story),
    clipRow,
    spectrum(story),
    sidesSay(story),
    oddsPart(story),
    h('section', { class: 'nw-sides-sec' }, [
      h('h3', { class: 'nw-story-h', text: sidesTaken(story) ? W('各邊怎麼下標', 'How each side puts it') : W('各家怎麼下標', 'How each outlet puts it') }),
      h('div', { class: 'q-sheet-cols nw-sides' }, cards)
    ]),
    learnPart(story),
    lawPart(story),
    taiwanPart(story),
    worldLink(story),
    timeline(story),
    growthOf(story),
    relatedPart(story),
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
  // (Each side's count in one line under the bar: ● 偏綠 3 ● 中間 7 ● 偏藍 2.)
  const legend = h('p', { class: 'nw-legend' }, [
    ...parts.map(p => h('span', { class: 'nw-legend-part' }, [h('i', { class: `nw-dot nw-s-${p.side}`, 'aria-hidden': 'true' }), sideFull(p.side), h('b', { text: String(p.n) })])),
    sm ? h('span', { class: 'nw-legend-part' }, [h('i', { class: 'nw-dot nw-s-none', 'aria-hidden': 'true' }), W('中國官媒', 'China state media'), h('b', { text: String(sm) })]) : null
  ]);
  if (!taken)
    return h('section', { class: 'nw-spec' }, [
      h('div', { class: 'nw-spec-head' }, [h('b', { text: W('報導的媒體', 'Who covers it') }), h('small', { text: W(`${story.n} 家`, `${story.n} outlets`) })]),
      h('p', { class: 'nw-spec-say', text: W('生活、健康、科學、文化和運動新聞沒有立場之分，這裡不畫光譜。', 'Life, health, science, culture and sport have no sides to take, so no spectrum here.') })
    ]);
  return h('section', { class: 'nw-spec' }, [
    h('div', { class: 'nw-spec-head' }, [h('b', { text: W('各邊的報導', 'Coverage by side') }), h('small', { text: W(`${story.n} 家`, `${story.n} outlets`) })]),
    bar(story, { big: true }),
    legend,
    story.blind ? h('p', { class: 'nw-spec-note' }, [tag(W(`${sideFull(story.blind)}的媒體都沒報`, `No ${sideFull(story.blind).toLowerCase()} outlet carries it`), 'tint', `var(--nw-${story.blind})`)]) : null,
    parties ? h('p', { class: 'nw-spec-say', text: parties }) : null
  ]);
}

// A Taiwan story the world's outlets carry too: the way to theirs.
function worldLink(story) {
  const w = story.world && storyById(state.page, story.world, state.past);
  if (!w) return null;
  return h('button', { type: 'button', class: 'nw-world-go', onclick: () => openStory(w.id) }, [
    h('small', { text: W(`國際媒體也在報 · ${w.n} 家`, `World outlets carry it too · ${w.n}`) }),
    h('span', { lang: 'en', text: w.title }),
    h('b', { 'aria-hidden': 'true', text: '›' })
  ]);
}

// 重點整理 (Jay 11-13: reading kept in the app): the story's few points in
// our own words (the AI's, from the outlets' headlines and feed summaries:
// lib/briefs.mjs), and the way to the whole report on the outlet's own site
// (iOS's quick view in the app, closed back to the story; the Safari app
// when the person chose it on the Pass). Never an article copied here.
function pointsOf(story) {
  const b = state.briefs?.get?.(story.id);
  const lead = story.items.find(it => it[0] === story.by) || story.items[0];
  const full = lead ? outletLink(lead, [h('span', { text: W(`到${outletName(lead[0])}看全文`, `Read it on ${outletName(lead[0])}`) }), h('b', { 'aria-hidden': 'true', text: ' ›' })], 'nw-full') : null;
  if (!b) return full ? h('div', { class: 'nw-full-row' }, [full]) : null;
  const lang = en ? 'en' : 'zh-Hant';
  return h('section', { class: 'nw-points' }, [
    h('h3', { class: 'nw-story-h' }, [W('重點整理', 'The key points'), aiMark()]),
    h('ul', { class: 'nw-points-list' }, b.points.map(p => h('li', { lang, text: en ? p.en : p.zh }))),
    full
  ]);
}

// 追蹤: the story's topic and the parties its headlines name, each a follow
// (their stories then rise through 頭條, tagged).
function followRow(story) {
  const t = story.topics?.[0];
  const pills = [
    t && topicName(t, story.region) ? followPill(followKey('t', t), { label: W(`追蹤${topicName(t, story.region)}`, `Follow ${topicName(t, story.region)}`) }) : null,
    ...(story.parties || []).filter(p => PARTY_WORDS[p]).map(p => followPill(wordsKey(PARTY_WORDS[p][0]), { label: W(`追蹤${PARTY_WORDS[p][0]}`, `Follow the ${PARTY_WORDS[p][1]}`) }))
  ].filter(Boolean);
  return pills.length ? h('div', { class: 'nw-follow-pills' }, pills) : null;
}

// 來龍去脈: how the story went, a line a turn (its first report, then each
// day's or few hours' headline that added the most; lib/stories.mjs
// timelineOf), each opening the outlet's report.
function timeline(story) {
  const turns = timelineOf(story);
  if (turns.length < 2) return null;
  const when = at => {
    const d = new Date(at);
    const day = d.toLocaleDateString(en ? 'en-GB' : 'zh-TW', { month: 'numeric', day: 'numeric' });
    const hm = d.toLocaleTimeString(en ? 'en-GB' : 'zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false });
    return `${day} ${hm}`;
  };
  return h('section', { class: 'nw-timeline' }, [
    h('h3', { class: 'nw-story-h', text: W('來龍去脈', 'How it unfolded') }),
    h('ol', { class: 'nw-turns' }, turns.map(t => h('li', { class: 'nw-turn' }, [
      h('small', { class: 'nw-turn-when' }, [h('span', { class: 'num', text: when(t.at) }), t.n > 1 ? h('span', { text: W(` · ${t.n} 則`, ` · ${t.n}`) }) : null]),
      outletLink([t.outlet, t.title, t.url], [outletMark(t.outlet, 18), h('span', { lang: story.region === 'intl' ? 'en' : 'zh-Hant', text: t.title })], 'nw-turn-head')
    ])))
  ]);
}

// 相關新聞: the stories nearest this one (lib/stories.mjs relatedOf), each
// opening in this sheet's place.
function relatedPart(story) {
  const near = relatedOf(story, [state.page, state.past]).map(x => x.story);
  if (!near.length) return null;
  return h('section', { class: 'nw-related' }, [h('h3', { class: 'nw-story-h', text: W('相關新聞', 'Related stories') }), storyList(near, s => openStory(s.id, { list: near }))]);
}

// 各方怎麼說: each side's angle in a line, the one difference that matters
// most on top (the AI's, from their headlines only; lib/sides.mjs), over
// the headlines themselves, which show it's so.
function sidesSay(story) {
  const said = sidesTaken(story) && sidesOf(story, state.sides?.get?.(story.id));
  if (!said) return null;
  const pick = x => (en ? x.en : x.zh);
  return h('section', { class: 'nw-say' }, [
    h('h3', { class: 'nw-story-h' }, [W('各方怎麼說', 'How each side tells it'), aiMark()]),
    h('div', { class: 'nw-say-card' }, [
      said.diff ? h('p', { class: 'nw-say-diff', lang: en ? 'en' : 'zh-Hant', text: pick(said.diff) }) : null,
      h('div', { class: 'nw-say-rows' }, said.rows.map(r => h('div', { class: 'nw-say-row' }, [h('span', { class: 'nw-say-who' }, [h('i', { class: `nw-dot nw-s-${r.side}`, 'aria-hidden': 'true' }), h('b', { text: sideFull(r.side) })]), h('p', { lang: en ? 'en' : 'zh-Hant', text: pick(r) })]))),
      h('small', { class: 'nw-ai-note', text: W('AI 只依各邊的標題整理角度，不評斷誰對；標題在下面。', 'Written by AI from each side’s headlines only, never who’s right; the headlines are below.') })
    ].filter(Boolean))
  ]);
}

// The Orbit AI mark beside a part the AI had a hand in (the family's, never a sparkle).
function aiMark() {
  const mark = h('i', { class: 'nw-ai-mark', 'aria-label': 'Orbit AI' });
  mark.innerHTML = kitUI.icons?.ai || kitUI.icons?.spark || '';
  return mark;
}

// 預測市場: the question the story raises as Polymarket's traders price it
// (lib/markets.mjs; the pair confirmed by the AI, the chances Polymarket's):
// one chance, the chances by deadline, or a race's leaders, each a bar with
// its day's move; the source a tap away. Two markets at most.
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function byWhen(md) {
  const [a, b, c] = md.split('/').map(Number);
  const [y, m, d] = c ? [a, b, c] : [0, a, b];
  return W(`${y ? `${y}/` : ''}${m}/${d} 前`, `By ${MONTHS_EN[m - 1]} ${d}${y ? `, ${y}` : ''}`);
}
function oddsPart(story) {
  const ms = state.markets?.get?.(story.id);
  if (!ms?.length) return null;
  // (A long person's name by its last name alone, never cut: the long-name rule; anything else as written.)
  const fit = n => (n.length > 16 && /^\p{Lu}[\p{L}'-]+(?: \p{Lu}[\p{L}'.-]+)+$/u.test(n) ? n.split(' ').pop() : n);
  const row = (r, kind, zh, p) => {
    const name = kind === 'dates' ? byWhen(r.md) : kind === 'pick' ? (zh ? r.zh : fit(r.en)) : '';
    const mv = move(r.d);
    return h('div', { class: `nw-odds-row${name ? '' : ' one'}` }, [
      name ? h('span', { class: 'nw-odds-name', lang: kind === 'pick' && !zh ? 'en' : null, text: name }) : null,
      h('span', { class: 'nw-odds-bar', 'aria-hidden': 'true' }, [h('i', { style: { width: `${Math.max(1, Math.round(r.p * 100))}%` } })]),
      h('b', { class: 'nw-odds-p', text: p }),
      h('small', { class: 'nw-odds-move', 'aria-label': mv ? W(`一天${r.d > 0 ? '上升' : '下降'} ${mv.slice(1)} 個百分點`, `${r.d > 0 ? 'Up' : 'Down'} ${mv.slice(1)} points in a day`) : null, text: mv })
    ].filter(Boolean));
  };
  const rowsOf = m => {
    const ps = pcts(m.rows, m.one);
    const zh = !en && m.rows.every(x => x.zh);
    return m.rows.map((r, i) => row(r, m.kind, zh, ps[i]));
  };
  // (What ▲▼ means, once, beside the heading: a day's move in percentage points.)
  const moved = ms.some(m => m.rows.some(r => move(r.d)));
  return h('section', { class: 'nw-odds' }, [
    h('h3', { class: 'nw-story-h' }, [W('預測市場', 'Market odds'), aiMark(), moved ? h('small', { class: 'nw-odds-key', text: W('▲▼ 一天漲跌（百分點）', '▲▼ points moved in a day') }) : null].filter(Boolean)),
    h(
      'div',
      { class: 'nw-odds-cards' },
      ms.map(m =>
        h('div', { class: 'nw-odds-card' }, [
          h('p', { class: 'nw-odds-q', lang: en ? 'en' : 'zh-Hant', text: en ? m.en : m.zh }),
          h('div', { class: 'nw-odds-rows' }, rowsOf(m)),
          h('a', { class: 'nw-odds-src', href: sourceUrl(m), target: '_blank', rel: 'noopener', onclick: e => (e.preventDefault(), openOut(sourceUrl(m))) }, [W('Polymarket 交易者估的機率', 'Chances as Polymarket traders price them'), h('span', { 'aria-hidden': 'true', text: ' ›' })])
        ])
      )
    )
  ]);
}

// 看法案: the laws its headlines name, each opening in Orbit Law: its bill
// when a headline speaks of changing it (修法, 草案, 三讀…), else the law
// itself (Orbit-Core's builders/news-laws.js, code only).
function lawPart(story) {
  const laws = (state.laws?.[story.id] || []).filter(l => l?.n && /^[A-Z]\d{7}$/.test(l.p || '') && /^\d+:\d+$/.test(l.k || ''));
  if (!laws.length) return null;
  const sub = l => (!l.bill ? W('法規全文', 'The law') : l.open > 0 || !l.passed ? W('法案 · 審議中', 'Bill · before the Legislative Yuan') : W(`法案 · ${l.passed} 三讀`, `Bill · passed ${l.passed}`));
  return list(
    laws.map(l => cell({ title: l.n, sub: sub(l), chevron: true, onClick: () => hooks.law(l.bill ? `item=${l.k.replace(':', '-')}` : `law=${l.p}`) })),
    { head: W('提到的法律', 'Laws it names'), big: true, foot: W('在 Orbit Law 打開', 'Opens in Orbit Law') }
  );
}

// How coverage grew, a bar a day (only past its first day). Most stories
// last a few days (Jay 11-12: three bars in a width laid out for weeks):
// up to a week a row a day, its bar across the width and its count; longer,
// columns sharing the width.
const ROWS_UP_TO = 7;
function growthOf(story) {
  if (!(story.days?.length > 1)) return null;
  const peak = Math.max(1, ...story.days.map(x => x[1]));
  const day = x => x.replace(/^0?(\d+)-0?(\d+)$/, '$1/$2');
  const pct = n => `${Math.max(4, (n / peak) * 100)}%`;
  const rows = story.days.length <= ROWS_UP_TO;
  return h('section', { class: `nw-days${rows ? ' nw-days-rows' : ''}`, role: 'img', 'aria-label': story.days.map(([x, n]) => `${x} ${n}`).join(', ') }, [
    h('h3', { class: 'nw-story-h', text: W('每天的報導', 'Reports a day') }),
    rows
      ? h('span', { class: 'nw-days-list' }, story.days.map(([x, n]) => h('span', { class: 'nw-day-row' }, [h('small', { class: 'nw-day-k', text: day(x) }), h('span', { class: 'nw-day-track' }, [h('i', { style: { width: pct(n) } })]), h('b', { class: 'nw-day-n', text: W(`${n} 則`, String(n)) })])))
      : h('span', { class: 'nw-days-bars' }, story.days.map(([x, n]) => h('span', { class: 'nw-day' }, [h('i', { style: { height: pct(n) } }), h('small', { text: day(x) })])))
  ]);
}

// Taiwan's outlets on a world story (the builder's `tw`): their own bar
// (偏綠 · 中間 · 偏藍) and headlines, beside the world's (Jay 11-10).
function taiwanPart(story) {
  const tw = story.tw;
  if (story.region !== 'intl' || !tw?.items?.length) return null;
  const fake = { region: 'tw', sides: tw.sides, n: tw.n, items: tw.items };
  const groups = bySide(fake);
  const cards = Object.keys(groups)
    .filter(k => k !== 'none' && groups[k].length)
    .map(k => sideCard(k, groups[k], fake, { most: 3 }));
  return h('section', { class: 'nw-sides-sec nw-tw-sec' }, [
    h('h3', { class: 'nw-story-h' }, [W('台灣媒體怎麼報', 'How Taiwan’s outlets put it'), h('small', { text: W(` ${tw.n} 家`, ` ${tw.n}`) })]),
    h('div', { class: 'nw-spec nw-tw-spec' }, [bar(fake, { big: true }), h('p', { class: 'nw-legend' }, barOf(fake).parts.map(p => h('span', { class: 'nw-legend-part' }, [h('i', { class: `nw-dot nw-s-${p.side}`, 'aria-hidden': 'true' }), sideFull(p.side), h('b', { text: String(p.n) })])))]),
    h('div', { class: 'q-sheet-cols nw-sides' }, cards)
  ]);
}

// One side's column: its name and count, then each outlet once, its
// newest headline (its others folded under it), `most` outlets at first
// (Jay 11-10: 80 headlines in a row were hard to get through); a side with
// none says so (that's the point of the page).
function sideCard(side, items, story, { most = 4 } = {}) {
  const lang = story.region === 'intl' ? 'en' : 'zh-Hant';
  const by = new Map();
  for (const it of [...items].sort((a, b) => b[3] - a[3])) by.set(it[0], [...(by.get(it[0]) || []), it]);
  const outlets = [...by];
  const head = h('div', { class: 'nw-side-head' }, [
    h('i', { class: `nw-dot nw-s-${side}`, 'aria-hidden': 'true' }),
    h('b', { text: side === 'none' ? W('中國官媒', 'China state media') : sideFull(side) }),
    h('small', { text: W(`${outlets.length} 家`, `${outlets.length}`) })
  ]);
  const line = (it, first) =>
    outletLink(it, [
      first ? h('span', { class: 'nw-hl-src' }, [outletMark(it[0], 20), h('span', { text: outletName(it[0]) }), h('small', { text: ago(it[3]) })]) : h('small', { class: 'nw-hl-when', text: ago(it[3]) }),
      h('span', { class: 'nw-hl-t', lang }, marked(it[1], story))
    ], first ? 'nw-hl' : 'nw-hl nw-hl-also');
  const group = ([o, [first, ...also]]) => {
    const box = h('div', { class: 'nw-hl-group' }, [line(first, true)]);
    if (also.length) {
      const b = h('button', { type: 'button', class: 'nw-hl-more', text: W(`${outletName(o)}還有 ${also.length} 則`, `${also.length} more from ${outletName(o)}`), onclick: () => b.replaceWith(...also.map(it => line(it, false))) });
      box.append(b);
    }
    return box;
  };
  const card = h('section', { class: `nw-side nw-side-${side}` });
  const none = !items.length ? h('p', { class: 'nw-side-none', text: W(`沒有${sideFull(side)}的媒體報這則。`, `No ${sideFull(side).toLowerCase()} outlet carries this.`) }) : null;
  const draw = all => {
    const rest = outlets.length - most;
    card.replaceChildren(
      ...[head, none, ...outlets.slice(0, all ? outlets.length : most).map(group), rest > 0 ? moreToggle({ more: W(`再看 ${rest} 家`, `${rest} more outlets`), less: W('收起', 'Fewer'), open: all, onToggle: draw, cls: 'nw-side-more' }) : null].filter(Boolean)
    );
  };
  draw(false);
  return card;
}
