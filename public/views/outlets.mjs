// 媒體: your reading (近 30 天 by side, Taiwan's and the world's), then
// every outlet on its line: Taiwan's from 深綠 to 深藍, the English ones from
// left to right (AllSides', else Media Bias/Fact Check's: none unrated),
// China's state media apart. An outlet
// opens its sheet: its owner, its place on each line, why (each source
// linked), and the stories it's in today.
import { h, section, sheet, list, cell, empty } from '#kit/ui.mjs';
import * as kitUI from '#kit/ui.mjs';
import * as kitNews from '#kit/news-outlets.mjs';
import { OUTLETS, BASIS, placeWord, outletOf } from '#kit/news-outlets.mjs';
import { state, W, lang, en, today, outletName, outletMark, sideFull, regionName } from '../shell.mjs';
import { balanceOf, leanOf } from '../lib/reading.mjs';
import { storiesWith } from '../lib/stories.mjs';
import { bar, storyList, counts } from './parts.mjs';
import { openStory } from './story.mjs';
import { followPill, openFollows, followName } from './follows.mjs';
import { followKey, followsOf } from '../lib/reading.mjs';

// Each line's places, end to end, with the side colour each stands on.
const TW_PLACES = [-2, -1, 0, 1, 2].map(v => ({ v, side: v < 0 ? 'g' : v > 0 ? 'b' : 'c', label: placeWord('tw', v, lang), of: o => o.region === 'tw' && o.tw === v }));
const INTL_PLACES = [
  ...[-2, -1, 0, 1, 2].map(v => ({ v, side: v < 0 ? 'l' : v > 0 ? 'r' : 'c', label: placeWord('lr', v, lang), of: o => o.region === 'intl' && o.lr === v }))
];
// (No Chinese state media, Jay 11-14: "we don't need dictatorship to tell us what news is".)
// The sports outlets: on no scale, a group of their own (Jay 11-14: "let them be alone").
const SPORTS = kitNews.SPORTS_OUTLETS || new Set();
const sportsCard = () => {
  const all = Object.values(OUTLETS).filter(o => SPORTS.has(o.id));
  return all.length ? h('div', { class: 'nw-chips' }, all.map(o => h('button', { type: 'button', class: 'nw-chip', onclick: () => openOutlet(o.id) }, [outletMark(o.id, 20), h('span', { text: outletName(o.id) })]))) : null;
};

// One card: each place a row, its side's dot and name over its outlets.
function places(list) {
  const all = Object.values(OUTLETS).filter(o => !SPORTS.has(o.id));
  const rows = list
    .map(p => ({ ...p, outlets: all.filter(p.of) }))
    .filter(p => p.outlets.length)
    .map(p =>
      h('div', { class: 'nw-place' }, [
        h('b', { class: 'nw-place-name' }, [h('i', { class: `nw-dot nw-s-${p.side}${Math.abs(p.v) === 1 ? ' lean' : ''}`, 'aria-hidden': 'true' }), p.label]),
        h('div', { class: 'nw-chips' }, p.outlets.map(o => h('button', { type: 'button', class: 'nw-chip', onclick: () => openOutlet(o.id) }, [outletMark(o.id, 20), h('span', { text: outletName(o.id) })])))
      ])
    );
  return h('div', { class: 'nw-places' }, rows);
}

// 我的閱讀 for one region: its bar, what it says, the outlets most opened.
function mine(region) {
  const b = balanceOf(state.log, region, today());
  const { lean } = leanOf(b);
  if (!b.total && !b.none) return null;
  const say =
    !b.total ? W(`${b.none} 則，都是中國官媒`, `${b.none}, all from China’s state media`)
    : lean === null ? W(`${b.total} 則，再多一些才看得出偏向`, `${b.total} so far; a few more and the lean shows`)
    : lean ? W(`多半是${sideFull(lean)}的媒體`, `Mostly ${sideFull(lean).toLowerCase()} outlets`)
    : W('各邊都有', 'From every side');
  return h('div', { class: 'nw-mine' }, [
    h('div', { class: 'nw-mine-head' }, [h('b', { text: regionName(region) }), h('small', { text: say })]),
    b.total ? bar({ region, sides: b.sides, n: b.total }, { big: true }) : null,
    b.total ? counts({ region, sides: b.sides, n: b.total, state: b.none }, { full: true }) : null,
    h('p', { class: 'nw-mine-top', text: W(`最常點開：${b.outlets.slice(0, 3).map(([o, n]) => `${outletName(o)} ${n}`).join('、')}`, `Opened most: ${b.outlets.slice(0, 3).map(([o, n]) => `${outletName(o)} ${n}`).join(', ')}`) })
  ]);
}

export function renderOutlets(box) {
  const tw = mine('tw');
  const intl = mine('intl');
  // 我的追蹤: what's followed in a line, the sheet a tap away.
  const follows = followsOf(state.log);
  const names = [...follows.map(followName), ...(state.interests || []).map(i => i.label)];
  const followRow = list([cell({ icon: kitUI.icons?.star || null, title: W('我的追蹤', 'Following'), sub: names.length ? names.slice(0, 6).join(W('、', ', ')) : W('人物、主題、媒體', 'People, topics, outlets'), chevron: true, onClick: openFollows })]);
  const reading = section(W('我的閱讀', 'Your reading'), [
    tw || intl
      ? h('div', { class: 'q-focus nw-mine-card' }, [h('p', { class: 'nw-mine-lede', text: W('近 30 天你點開的新聞，依媒體的位置', 'What you opened in 30 days, by where each outlet stands') }), tw, intl])
      : empty({ icon: 'chart', title: W('還沒點開過新聞', 'Nothing opened yet'), body: W('點開任何一則標題，這裡就算出你讀的多半是哪一邊的媒體。只存在你的 Orbit Pass。', 'Open any headline and this shows which side’s outlets you mostly read. Kept only on your Orbit Pass.') }),
    followRow
  ]);
  const parts = [
    reading,
    section(W('台灣媒體', 'Taiwan’s outlets'), [h('p', { class: 'nw-lede', text: W('藍綠的位置依學術研究；各家在統獨上的位置也一樣排。', 'Placed blue–green by published research; each stands the same way on unification–independence.') }), places(TW_PLACES)]),
    section(W('國際媒體', 'World outlets'), [h('p', { class: 'nw-lede', text: W('左右的位置依 AllSides Media Bias Ratings™；AllSides 沒評過的，依 Media Bias/Fact Check。', 'Left and right as rated by AllSides Media Bias Ratings™; where AllSides has none, by Media Bias/Fact Check.') }), places(INTL_PLACES)]),
    sportsCard() ? section(W('運動媒體', 'Sports outlets'), [h('div', { class: 'nw-places' }, [sportsCard()])]) : null,
    h('p', { class: 'nw-foot', text: W('點一家看它的擁有者、位置和依據。位置說的是一家媒體整體的傾向，不是每一篇報導。', 'Tap one for its owner, place and why. A place is an outlet’s lean as a whole, not each report’s.') })
  ];
  box.replaceChildren(h('div', { class: 'q-flow nw-flow' }, parts));
  kitUI.flowColumns?.(box);
}

// One outlet's sheet.
export function openOutlet(id) {
  const o = outletOf(id);
  if (!o) return;
  const places = SPORTS.has(id)
    ? [cell({ title: W('運動媒體', 'Sports outlet'), value: W('不排藍綠左右', 'On no side') })]
    : o.region === 'tw'
      ? [
          cell({ title: W('藍綠', 'Blue–green'), value: placeWord('tw', o.tw, lang) }),
          cell({ title: W('統獨', 'Unification–independence'), value: placeWord('cs', o.cs, lang) })
        ]
      : [
          cell({ title: W('左右', 'Left–right'), value: o.kind === 'state' || SPORTS.has(o.id) ? W('不適用', 'Not placed') : placeWord('lr', o.lr, lang) }),
          o.cs != null ? cell({ title: W('統獨', 'Unification–independence'), value: placeWord('cs', o.cs, lang) }) : null
        ].filter(Boolean);
  const why = o.basis.map(k => BASIS[k]).filter(Boolean).map(b => cell({ title: en ? b.en : b.zh, href: b.url || '', chevron: Boolean(b.url) }));
  for (const c of why) if (c.tagName === 'A') Object.assign(c, { target: '_blank', rel: 'noopener' });
  const stories = state.page ? storiesWith(state.page, id) : [];
  const body = h('div', { class: 'nw-outlet' }, [
    h('div', { class: 'nw-outlet-head' }, [outletMark(id, 56), h('span', {}, [h('b', { text: outletName(id) }), h('small', { text: en ? o.owner.en : o.owner.zh })]), followPill(followKey('o', id))]),
    list(places, { head: W('位置', 'Place') }),
    SPORTS.has(id) ? null : list(why, { head: W('依據', 'Why'), foot: o.weak ? W('沒有研究評過這家，依擁有者和公開立場判斷，依據較弱。', 'No study has rated it: placed by owner and stated stance, weaker evidence.') : '' }),
    // (The count the rows shown: 自由時報's said 「最近的 183 則」 over twelve, 11-12.)
    stories.length ? section(W(`最近的 ${Math.min(12, stories.length)} 則`, `${Math.min(12, stories.length)} recent stories`), [storyList(stories.slice(0, 12), s => openStory(s.id, { list: stories }))], { shd: true }) : null
  ]);
  sheet({ title: outletName(id), cls: 'nw-outlet-sheet', body: [body] });
}
