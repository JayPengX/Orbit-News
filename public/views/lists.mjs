// The story tabs: 頭條 (a front page: the lead story, the top stories in
// pictures, the day's clips, the world's, each topic's, the one-sided ones,
// your reading in a line), 台灣 and 國際 (every story outlets could take
// sides on, most important first, by topic, then the older ones kept),
// 單邊 (stories only one side carries, grouped by the side that left them out).
import { h, section, empty, moreToggle } from '#kit/ui.mjs';
import * as kitUI from '#kit/ui.mjs';
import * as kitNews from '#kit/news-outlets.mjs';
import { state, hooks, W, sideFull, regionName, today, topicName } from '../shell.mjs';
import { oneSided, onTopic, topicsIn, clipsOf } from '../lib/stories.mjs';
import { balanceOf, leanOf } from '../lib/reading.mjs';
import { storyList, storyCards, clipCard, leadCard, builtLine, bar } from './parts.mjs';
import { openStory } from './story.mjs';

const open = story => openStory(story.id);
const goTab = tab => () => hooks.tab(tab);
// A clip played: a YouTube one in its story's sheet, an outlet's own video
// page on its site (counted for 我的閱讀).
export function play({ story, clip }) {
  if (clip[1]) return openStory(story.id, { clip: clip[1] });
  hooks.read(clip[0]);
  globalThis.open?.(clip[2], '_blank', 'noopener');
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

export function renderTop(box) {
  if (notYet(box)) return;
  const { tw, intl } = state.page;
  const [lead, ...rest] = tw.length ? tw : intl;
  const seen = new Set([lead?.id]);
  const top = rest.slice(0, 6);
  for (const s of top) seen.add(s.id);
  const clips = clipsOf([...tw.slice(0, 40), ...intl.slice(0, 20)], 12);
  const world = (tw.length ? intl : []).slice(0, 5);
  // Each topic's most important not shown above, three at a time.
  const topics = topicOrder()
    .map(t => [t, tw.filter(s => s.topics?.[0] === t && !seen.has(s.id))])
    .filter(([, list]) => list.length >= 2)
    .map(([t, list]) =>
      section(topicName(t, 'tw'), [storyList(list.slice(0, 3), open), more(W(`更多${topicName(t, 'tw')}新聞`, `More ${topicName(t, 'tw').toLowerCase()}`), go('tw', t))], { cls: 'nw-topic-sec' })
    );
  const sides = oneSided(state.page);
  const one = sides.flatMap(g => g.stories).sort((a, b) => b.n - a.n).slice(0, 3);
  const mine = balanceOf(state.log, 'tw', today());
  const hero = h('div', { class: 'nw-front' }, [
    lead ? h('section', { class: 'q-section nw-lead-sec' }, [leadCard(lead, open)]) : null,
    top.length ? section(W('要聞', 'Top stories'), [storyCards(top, open)], { cls: 'nw-top-sec' }) : null,
    clips.length ? section(W('影音', 'Video'), [kitUI.rail(clips.map(c => clipCard(c, play))), h('p', { class: 'nw-foot', text: W('各家媒體自己的影片，在 YouTube 的播放器裡播。', 'Each outlet’s own clips, played in YouTube’s player.') })], { cls: 'nw-clips-sec' }) : null
  ]);
  const parts = [
    world.length ? section(regionName('intl'), [storyList(world, open), more(W(`國際全部 ${intl.length} 則`, `All ${intl.length} world stories`), 'intl')]) : null,
    ...topics,
    one.length ? section(W('單邊', 'One side'), [h('p', { class: 'nw-lede', text: W('只有一邊的媒體在報的新聞。', 'Stories only one side’s outlets carry.') }), storyList(one, open), more(W('看全部單邊新聞', 'All one-sided stories'), 'side')]) : null,
    section(W('我的閱讀', 'Your reading'), [readingLine(mine), more(W('看各家媒體的位置', 'Where each outlet stands'), 'outlets')])
  ];
  box.replaceChildren(hero, h('div', { class: 'q-flow nw-flow' }, parts.filter(Boolean)), builtLine(state.page));
  kitUI.flowColumns?.(box);
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
// text tabs (全部, 政治, 兩岸…, 影音); past the list, the older stories kept.
export function renderRegion(box, region) {
  if (notYet(box)) return;
  const stories = state.page[region];
  const have = new Set(topicsIn(stories).map(([t]) => t));
  const tabs = ['all', ...topicOrder().filter(t => have.has(t) && topicName(t, region)), ...(stories.some(s => s.clips?.length) ? ['video'] : [])];
  const topic = tabs.includes(state.topic[region]) ? state.topic[region] : 'all';
  const name = t => (t === 'all' ? W('全部', 'All') : topicName(t, region));
  const pick = t => () => {
    state.topic[region] = t;
    state.shown[region] = 20;
    hooks.render();
  };
  const chips = h('div', { class: 'q-chips q-texttabs nw-topics', role: 'tablist' }, tabs.map(t => h('button', { type: 'button', class: `q-chip${topic === t ? ' on' : ''}`, role: 'tab', 'aria-selected': String(topic === t), onclick: pick(t), text: name(t) })));
  if (topic === 'video') {
    const clips = stories.flatMap(s => (s.clips || []).slice(0, 2).map(clip => ({ story: s, clip })));
    box.replaceChildren(h('div', { class: 'nw-region' }, [chips, h('div', { class: 'nw-clip-grid' }, clips.map(c => clipCard(c, play))), builtLine(state.page)]));
    return;
  }
  const all = onTopic(stories, topic);
  const shown = all.slice(0, state.shown[region]);
  const left = all.length - shown.length;
  const pager = left > 0 ? moreToggle({ more: W(`再看 ${Math.min(20, left)} 則`, `${Math.min(20, left)} more`), less: null, onToggle: () => ((state.shown[region] += 20), hooks.render()) }) : null;
  box.replaceChildren(
    h('div', { class: 'nw-region' }, [
      chips,
      all.length ? storyList(shown, open) : empty({ icon: 'list', title: W('還沒有新聞', 'No stories yet'), body: W('兩家以上在報的新聞會出現在這裡。', 'Stories two outlets or more carry show here.') }),
      pager,
      left > 0 ? null : pastPart(region, topic),
      builtLine(state.page)
    ])
  );
}

// The older stories kept (news/past.json): asked for at a list's end, then
// a topic's, most important first.
function pastPart(region, topic) {
  if (!state.past)
    return h('button', { type: 'button', class: 'nw-past-ask', onclick: e => ((e.currentTarget.disabled = true), hooks.past().then(() => hooks.render())) }, [
      h('b', { text: state.pastFailed ? W('讀不到更早的新聞，再試一次', 'Couldn’t get older stories; try again') : W('更早的重要新聞', 'Older important stories') }),
      h('small', { text: W('過去一個月仍值得一看的報導', 'Stories from the past month still worth a look') })
    ]);
  const list = onTopic(state.past[region] || [], topic);
  if (!list.length) return null;
  const shown = list.slice(0, state.shownPast?.[region] || 20);
  const left = list.length - shown.length;
  return section(W('更早', 'Earlier'), [
    storyList(shown, open),
    left > 0 ? moreToggle({ more: W(`再看 ${Math.min(20, left)} 則`, `${Math.min(20, left)} more`), less: null, onToggle: () => ((state.shownPast = { ...state.shownPast, [region]: shown.length + 20 }), hooks.render()) }) : null
  ]);
}

// 單邊: each side that left stories out, its stories.
export function renderSide(box) {
  if (notYet(box)) return;
  const groups = oneSided(state.page);
  const head = h('p', { class: 'nw-lede', text: W('三家以上、超過兩小時在報，卻只有一邊的媒體報的新聞（另一邊一家都沒有）。不一定是刻意不報，但另一邊的讀者可能沒看到。', 'Stories three outlets or more have carried for over two hours, all on one side, none on the other. Not always a choice, but the other side’s readers may not have seen them.') });
  const parts = groups.map(({ region, missing, stories }) =>
    section(W(`${regionName(region)}：${sideFull(missing)}的媒體沒報`, `${regionName(region)}: none ${sideFull(missing).toLowerCase()}`), [storyList(stories, open, { side: false })], { count: stories.length, shd: true })
  );
  box.replaceChildren(
    h('div', { class: 'nw-oneside' }, [
      head,
      parts.length ? h('div', { class: 'q-flow nw-flow' }, parts) : empty({ icon: 'check', title: W('現在沒有單邊的新聞', 'No one-sided stories now'), body: W('每則三家以上在報的新聞，兩邊都有人報。', 'Every story three or more outlets carry has both sides on it.') }),
      builtLine(state.page)
    ])
  );
  kitUI.flowColumns?.(box);
}
