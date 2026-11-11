// The story tabs: 頭條 (a front page: the lead stories swiped sideways, the
// top stories in pictures, the day's clips, the world's, each topic's, the
// one-sided ones, your reading in a line), 台灣 and 國際 (every story, most
// important first, by topic, a swipe to the next topic, then the older ones
// kept), 單邊 (stories only one side carries, Taiwan's or the world's, by
// the side that left them out, then by kind).
import { h, section, empty, moreToggle } from '#kit/ui.mjs';
import * as kitUI from '#kit/ui.mjs';
import * as kitNews from '#kit/news-outlets.mjs';
import { state, hooks, W, en, sideFull, regionName, today, topicName, openOut } from '../shell.mjs';
import { oneSided, onTopic, topicsIn, clipsOf, blindAll, byKind, asTopic, TAB_MIN, ENDS } from '../lib/stories.mjs';
import { balanceOf, leanOf } from '../lib/reading.mjs';
import { mineOf } from '../lib/mine.mjs';
import { dayBrief, itemOf } from '../lib/brief.mjs';
import { storyList, briefList, storyCards, clipCard, leadCard, carousel, builtLine, bar } from './parts.mjs';
import { openStory } from './story.mjs';
import { withSearch } from './search.mjs';

// A story opened, with the list it was in (its sheet swipes through it).
const open = (story, list) => openStory(story.id, { list });
const goTab = tab => () => hooks.tab(tab);
// A clip played: a YouTube one in its story's sheet, an outlet's own video
// page on its site (counted for 我的閱讀).
export function play({ story, clip }) {
  if (clip[1]) return openStory(story.id, { clip: clip[1] });
  hooks.read(clip[0]);
  openOut(clip[2]);
}
// The topics in their table's order (政治 first), those with stories.
const topicOrder = () => (kitNews.TOPICS || []).filter(t => t.on !== false).map(t => t.id);
const go = (region, topic) => () => {
  state.topic[region] = topic;
  state.shown[region] = 20;
  hooks.tab(region);
};

// Nothing read yet, or the read failed with nothing kept.
function notYet(box) {
  if (state.page) return false;
  box.replaceChildren(
    state.failed
      ? empty({ icon: 'list', title: W('讀不到新聞', 'Couldn’t get the news'), body: W('連上網路後再試一次。', 'Try again once you’re online.'), action: { label: W('再試一次', 'Try again'), onTap: () => hooks.reload() } })
      : kitUI.waiting(h('div', { class: 'nw-wait' }, [h('div', { class: 'nw-lead' }, [h('span', { class: 'nw-lead-pic' }), h('span', { class: 'nw-lead-body' }, [h('span', { class: 'nw-lead-title', text: '今天的頭條新聞標題，兩行左右的長度' })])]), storyList([], open)]))
  );
  return true;
}

// The way on to a whole tab, at a section's foot.
const more = (words, to) => {
  const onTap = typeof to === 'function' ? to : goTab(to);
  return kitUI.goBar?.(words, onTap) || h('button', { type: 'button', class: 'q-more', onclick: onTap, text: words });
};

// The lead stories: Taiwan's top three and the world's top two, Taiwan's first.
const leadsOf = (tw, intl) => [tw[0], tw[1], intl[0], tw[2], intl[1]].filter(Boolean);
// Today, as a front page dates itself: 11月10日 星期二.
const dateLine = () => new Date().toLocaleDateString(en ? 'en-GB' : 'zh-TW', { month: 'long', day: 'numeric', weekday: 'long' });

export function renderTop(box) {
  if (notYet(box)) return;
  const { tw, intl } = state.page;
  const leads = leadsOf(tw, intl);
  const seen = new Set(leads.map(s => s.id));
  const top = tw.filter(s => !seen.has(s.id)).slice(0, 6);
  for (const s of top) seen.add(s.id);
  // 你關心的 and 今天五則 (past the top: five more, picked for this person,
  // kept all day from 7:00; lib/brief.mjs), each story once on the page.
  const forYou = mineOf(state.page, state.interests, 5);
  const brief = briefNow(forYou, seen);
  for (const x of brief) seen.add(x.story.id);
  const clips = clipsOf([...tw.slice(0, 40), ...intl.slice(0, 20)], 12);
  const world = (tw.length ? intl : []).filter(s => !seen.has(s.id)).slice(0, 5);
  // Each topic's most important not shown above, three at a time (國際's
  // own section above stands for the world: one 國際 on the page).
  const topics = topicOrder()
    .filter(t => !(t === 'world' && world.length))
    .map(t => [t, tw.filter(s => s.topics?.[0] === t && !seen.has(s.id))])
    .filter(([, list]) => list.length >= 2)
    .map(([t, list]) =>
      section(topicName(t, 'tw'), [storyList(list.slice(0, 3), s => open(s, list)), more(W(`更多${topicName(t, 'tw')}新聞`, `More ${topicName(t, 'tw').toLowerCase()}`), go('tw', t))], { cls: 'nw-topic-sec' })
    );
  const sides = oneSided(state.page);
  const one = sides.flatMap(g => g.stories).sort((a, b) => b.n - a.n).slice(0, 3);
  const mine = balanceOf(state.log, 'tw', today());
  const hero = h('div', { class: 'nw-front' }, [
    h('p', { class: 'nw-date', text: dateLine() }),
    leads.length ? carousel(leads, open) : null,
    top.length ? section(W('要聞', 'Top stories'), [storyCards(top, open)], { cls: 'nw-top-sec' }) : null,
    clips.length ? section(W('影音', 'Video'), [kitUI.rail(clips.map(c => clipCard(c, play))), h('p', { class: 'nw-foot', text: W('各家媒體自己的影片，在 YouTube 的播放器裡播。', 'Each outlet’s own clips, played in YouTube’s player.') })], { cls: 'nw-clips-sec' }) : null
  ]);
  // 你關心的: stories about what you hold in Securities and follow in Sports
  // (the family's notebook on this phone, lib/mine.mjs), wherever they sit above.
  const whyOf = new Map(forYou.map(m => [m.story.id, m.why]));
  const inBrief = new Set(brief.map(x => x.story.id));
  const mineStories = forYou.map(m => m.story).filter(s => !inBrief.has(s.id));
  const parts = [
    brief.length
      ? section(W('今天五則', 'Today’s five'), [briefList(brief, (s, list) => openStory(s.id, { list, via: 'brief' })), h('p', { class: 'nw-foot', text: W('頭條之外再五則，你常點開的主題排前面，每天早上 7 點換。', 'Five past the headlines, the topics you open first; new each morning at 7.') })], { cls: 'nw-brief-sec', ai: true })
      : null,
    mineStories.length ? section(W('你關心的', 'For you'), [storyList(mineStories, s => open(s, mineStories), { why: s => whyOf.get(s.id) }), h('p', { class: 'nw-foot', text: W('依你在 Orbit 證券的持股、Orbit 運動追蹤的球隊。', 'From what you hold in Orbit Securities and follow in Orbit Sports.') })], { cls: 'nw-mine-sec', ai: true }) : null,
    world.length ? section(regionName('intl'), [storyList(world, s => open(s, intl)), more(W(`國際全部 ${intl.length} 則`, `All ${intl.length} world stories`), 'intl')]) : null,
    ...topics,
    one.length ? section(W('單邊', 'One side'), [h('p', { class: 'nw-lede', text: W('只有一邊的媒體在報的新聞。', 'Stories only one side’s outlets carry.') }), storyList(one, open), more(W('看全部單邊新聞', 'All one-sided stories'), 'side')]) : null,
    section(W('我的閱讀', 'Your reading'), [readingLine(mine), more(W('看各家媒體的位置', 'Where each outlet stands'), 'outlets')])
  ];
  // (Under 搜尋's field, kept in place: views/search.mjs.)
  withSearch(box, [hero, h('div', { class: 'q-flow nw-flow' }, parts.filter(Boolean)), builtLine(state.page)]);
  kitUI.flowColumns?.(box);
}

// 今天五則, the day's: the five kept since the first look after 7:00 (on
// this phone), each noted as shown so what's passed over teaches the picks.
const BRIEF_KEY = 'orbit-news.brief.v1';
function briefNow(mine, skip) {
  let kept = null;
  try {
    kept = JSON.parse(localStorage.getItem(BRIEF_KEY) || 'null');
  } catch {}
  const fb = state.fb;
  const b = dayBrief(state.page, kept, Date.now(), { skip, mine, lift: fb?.lifter ? fb.lifter('news') : undefined });
  if (!b) return [];
  if (kept?.day !== b.day || String(kept.ids) !== String(b.ids)) {
    try {
      localStorage.setItem(BRIEF_KEY, JSON.stringify({ day: b.day, ids: b.ids }));
    } catch {}
  }
  fb?.shown?.('news', b.list.map(x => itemOf(x.story)));
  return b.list;
}

// 我的閱讀 in a line: your bar and what it says, or how it starts.
export function readingLine(b) {
  const { lean } = leanOf(b);
  const words =
    lean === null
      ? b.total
        ? W(`近 30 天點開 ${b.total} 則台灣新聞，再多一些就看得出偏向。`, `${b.total} Taiwan stories opened in 30 days; a few more and the lean shows.`)
        : W('點開新聞的標題，這裡就算出你讀的多半是哪一邊的媒體。', 'Open any headline and this shows which side’s outlets you mostly read.')
      : lean
        ? W(`近 30 天點開的台灣新聞，多半是${sideFull(lean)}的媒體。`, `Most Taiwan news you opened in 30 days: ${sideFull(lean).toLowerCase()} outlets.`)
        : W('近 30 天點開的台灣新聞，各邊都有。', 'The Taiwan news you opened in 30 days comes from every side.');
  return h('div', { class: 'nw-mine' }, [b.total ? bar({ region: 'tw', sides: b.sides, n: b.total }, { big: true }) : null, h('p', { text: words })]);
}

// 台灣 or 國際: every story, most important first, 20 at a time; a topic's
// text tabs (全部, 政治, 兩岸…, 影音), a swipe across the list to the next
// one; the topic's lead story in its picture, then the rest; past the list,
// the older stories kept.
export function renderRegion(box, region) {
  if (notYet(box)) return;
  const stories = state.page[region];
  const tabs = tabsOf(region);
  const topic = tabs.includes(state.topic[region]) ? state.topic[region] : 'all';
  const name = t => (t === 'all' ? W('全部', 'All') : topicName(t, region));
  const pick = t => () => {
    state.topic[region] = t;
    state.shown[region] = 20;
    hooks.render();
  };
  const chips = textTabs(tabs, topic, name, pick);
  swipeTabs(box, region, () => tabsOf(region), () => (state.shown[region] = 20));
  showTab(chips);
  if (topic === 'video') {
    const clips = stories.flatMap(s => (s.clips || []).slice(0, 2).map(clip => ({ story: s, clip })));
    box.replaceChildren(chips, h('div', { class: 'nw-region' }, [h('div', { class: 'nw-clip-grid' }, clips.map(c => clipCard(c, play))), builtLine(state.page)]));
    return;
  }
  const all = onTopic(stories, topic).map(s => asTopic(s, topic));
  const shown = all.slice(0, state.shown[region]);
  const left = all.length - shown.length;
  // (Its first story with a picture leads; the rest in their order.)
  const lead = shown.find(s => s.img) && shown.indexOf(shown.find(s => s.img)) < 3 ? shown.find(s => s.img) : null;
  const rest = shown.filter(s => s !== lead);
  const pager = left > 0 ? moreToggle({ more: W(`再看 ${Math.min(20, left)} 則`, `${Math.min(20, left)} more`), less: null, onToggle: () => ((state.shown[region] += 20), hooks.render()) }) : null;
  box.replaceChildren(
    chips,
    h('div', { class: 'nw-region' }, [
      lead ? h('div', { class: 'nw-region-lead' }, [leadCard(lead, open, { list: all })]) : null,
      all.length ? storyListIn(rest, all) : empty({ icon: 'list', title: W('還沒有新聞', 'No stories yet'), body: W('兩家以上在報的新聞會出現在這裡。', 'Stories two outlets or more carry show here.') }),
      pager,
      left > 0 ? null : pastPart(region, topic),
      builtLine(state.page)
    ])
  );
}
// Rows that open with the whole topic's list (not only those shown).
const storyListIn = (shown, all) => storyList(shown, story => open(story, all));
// A region's tabs: 全部, its topics in the table's order (those with
// TAB_MIN stories at least: a tab of one story isn't a tab, Jay 11-10),
// 影音 when it has clips.
function tabsOf(region) {
  const stories = state.page?.[region] || [];
  const have = new Set(topicsIn(stories).filter(([, n]) => n >= TAB_MIN).map(([t]) => t));
  return ['all', ...topicOrder().filter(t => have.has(t) && topicName(t, region)), ...(stories.some(s => s.clips?.length) ? ['video'] : [])];
}
// A row of text tabs, the chosen one marked (it stays as the list slides).
const textTabs = (tabs, on, name, pick) =>
  h('div', { class: 'q-chips q-texttabs nw-topics q-day-still', role: 'tablist' }, tabs.map(t => h('button', { type: 'button', class: `q-chip${on === t ? ' on' : ''}`, role: 'tab', 'aria-selected': String(on === t), onclick: pick(t), text: name(t) })));
// The chosen tab in view, as a swipe moves it past the row's edge.
function showTab(chips) {
  if (!chips) return;
  requestAnimationFrame(() => {
    const on = chips.querySelector('.on');
    if (on && chips.scrollWidth > chips.clientWidth) chips.scrollTo({ left: Math.max(0, on.offsetLeft - chips.clientWidth / 2 + on.offsetWidth / 2), behavior: 'smooth' });
  });
}
// A swipe across 台灣, 國際 or 單邊 goes to the tab beside (the kit's
// daySwipe: the list follows the finger and slides in; the title and tabs
// stay). `key`: the tab's place in state.topic.
function swipeTabs(box, key, tabsNow, reset) {
  if (box.dataset.swipe) return;
  box.dataset.swipe = '1';
  kitUI.daySwipe?.(box, dir => {
    const tabs = tabsNow();
    const i = tabs.indexOf(tabs.includes(state.topic[key]) ? state.topic[key] : 'all') + dir;
    if (i < 0 || i >= tabs.length) return false;
    state.topic[key] = tabs[i];
    reset?.();
    hooks.render();
    return true;
  });
}

// The older stories kept (news/past.json): asked for at a list's end, then
// a topic's, most important first.
function pastPart(region, topic) {
  if (!state.past)
    return h('button', { type: 'button', class: 'nw-past-ask', onclick: e => ((e.currentTarget.disabled = true), hooks.past().then(() => hooks.render())) }, [
      h('b', { text: state.pastFailed ? W('讀不到更早的新聞，再試一次', 'Couldn’t get older stories; try again') : W('更早的重要新聞', 'Older important stories') }),
      h('small', { text: W('過去一個月仍值得一看的報導', 'Stories from the past month still worth a look') })
    ]);
  const list = onTopic(state.past[region] || [], topic).map(s => asTopic(s, topic));
  if (!list.length) return null;
  const shown = list.slice(0, state.shownPast?.[region] || 20);
  const left = list.length - shown.length;
  return section(W('更早', 'Earlier'), [
    storyList(shown, open),
    left > 0 ? moreToggle({ more: W(`再看 ${Math.min(20, left)} 則`, `${Math.min(20, left)} more`), less: null, onToggle: () => ((state.shownPast = { ...state.shownPast, [region]: shown.length + 20 }), hooks.render()) }) : null
  ]);
}

// 單邊: the stories only one side's outlets carry, Taiwan's or the world's
// (a text tab each, a swipe between); how many each side left out, a tap on
// one shows only those; then by kind (政治, 兩岸, 經濟…), three a kind and
// the rest folded under it (Jay 11-10: hard to get around).
const sideRegions = () => ['tw', 'intl'].filter(r => blindAll(state.page).some(s => s.region === r));
export function renderSide(box) {
  if (notYet(box)) return;
  const lede = h('p', { class: 'nw-lede', text: W('三家以上、超過兩小時在報，卻只有一邊的媒體報的新聞。不一定是刻意不報，但另一邊的讀者可能沒看到。', 'Stories three outlets or more have carried for over two hours, all on one side. Not always a choice, but the other side’s readers may not have seen them.') });
  const tabs = sideRegions();
  if (!tabs.length) {
    box.replaceChildren(h('div', { class: 'nw-oneside' }, [lede, empty({ icon: 'check', title: W('現在沒有單邊的新聞', 'No one-sided stories now'), body: W('每則三家以上在報的新聞，兩邊都有人報。', 'Every story three or more outlets carry has both sides on it.') }), builtLine(state.page)]));
    return;
  }
  const region = tabs.includes(state.topic.side) ? state.topic.side : tabs[0];
  const pick = r => () => ((state.topic.side = r), (state.blind = ''), hooks.render());
  const chips = tabs.length > 1 ? textTabs(tabs, region, regionName, pick) : null;
  swipeTabs(box, 'side', sideRegions, () => (state.blind = ''));
  const mine = blindAll(state.page).filter(s => s.region === region);
  const blind = ENDS[region].includes(state.blind) ? state.blind : '';
  // (Each end's count, a tap shows only the stories it left out; again, all.)
  const tiles = h(
    'div',
    { class: 'nw-blind-tiles', role: 'group', 'aria-label': W('各邊沒報的新聞', 'Stories each side left out') },
    ENDS[region].map(side => {
      const n = mine.filter(s => s.blind === side).length;
      const on = blind === side;
      return h('button', { type: 'button', class: `nw-blind-tile${on ? ' on' : ''}`, 'aria-pressed': String(on), disabled: !n, onclick: () => ((state.blind = on ? '' : side), hooks.render()) }, [
        h('small', {}, [h('i', { class: `nw-dot nw-s-${side}`, 'aria-hidden': 'true' }), W(`${sideFull(side)}沒報`, `None ${sideFull(side).toLowerCase()}`)]),
        h('b', { text: String(n) })
      ]);
    })
  );
  const shown = blind ? mine.filter(s => s.blind === blind) : mine;
  const parts = byKind(shown, topicOrder()).map(([t, list]) => kindPart(t, list.map(s => asTopic(s, t)), region, !blind));
  box.replaceChildren(...[chips, h('div', { class: 'nw-oneside' }, [lede, tiles, h('div', { class: 'q-flow nw-flow' }, parts), builtLine(state.page)])].filter(Boolean));
  showTab(chips);
  kitUI.flowColumns?.(box);
}
// One kind's one-sided stories: three, the rest folded under them.
function kindPart(t, list, region, side) {
  const rows = h('div');
  const draw = all => {
    rows.replaceChildren(storyList(all ? list : list.slice(0, 3), s => open(s, list), { side }));
    kitUI.flowColumns?.(rows.closest('.nw-oneside'));
  };
  draw(false);
  const fold = list.length > 3 ? moreToggle({ more: W(`再看 ${list.length - 3} 則`, `${list.length - 3} more`), less: W('收起', 'Fewer'), onToggle: draw }) : null;
  return section(topicName(t, region), [rows, fold], { count: list.length, shd: true });
}
