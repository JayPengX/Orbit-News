// The story tabs: 頭條 (the lead story, Taiwan's and the world's widest,
// the one-sided ones, your reading in a line), 台灣 and 國際 (every story
// two outlets or more carry, by how many or by the latest), 單邊 (stories
// only one side carries, grouped by the side that left them out).
import { h, section, empty, moreToggle } from '#kit/ui.mjs';
import * as kitUI from '#kit/ui.mjs';
import { state, hooks, W, en, sideFull, regionName, today } from '../shell.mjs';
import { ordered, oneSided } from '../lib/stories.mjs';
import { balanceOf, leanOf } from '../lib/reading.mjs';
import { storyList, leadCard, builtLine, bar } from './parts.mjs';
import { openStory } from './story.mjs';

const open = story => openStory(story.id);
const goTab = tab => () => hooks.tab(tab);

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
const more = (words, tab) => kitUI.goBar?.(words, goTab(tab)) || h('button', { type: 'button', class: 'q-more', onclick: goTab(tab), text: words });

export function renderTop(box) {
  if (notYet(box)) return;
  const { tw, intl } = state.page;
  const [lead, ...rest] = tw.length ? tw : intl;
  const sides = oneSided(state.page);
  const one = sides.flatMap(g => g.stories).sort((a, b) => b.n - a.n).slice(0, 3);
  const mine = balanceOf(state.log, 'tw', today());
  const parts = [
    lead ? h('section', { class: 'q-section nw-lead-sec' }, [leadCard(lead, open)]) : null,
    tw.length > 1 ? section(regionName('tw'), [storyList((tw.length ? rest : []).slice(0, 6), open), more(W(`台灣全部 ${tw.length} 則`, `All ${tw.length} Taiwan stories`), 'tw')]) : null,
    intl.length ? section(regionName('intl'), [storyList((tw.length ? intl : rest).slice(0, 5), open), more(W(`國際全部 ${intl.length} 則`, `All ${intl.length} world stories`), 'intl')]) : null,
    one.length ? section(W('單邊', 'One side'), [h('p', { class: 'nw-lede', text: W('只有一邊的媒體在報的新聞。', 'Stories only one side’s outlets carry.') }), storyList(one, open), more(W('看全部單邊新聞', 'All one-sided stories'), 'side')]) : null,
    section(W('我的閱讀', 'Your reading'), [readingLine(mine), more(W('看各家媒體的位置', 'Where each outlet stands'), 'outlets')]),
    builtLine(state.page)
  ];
  box.replaceChildren(h('div', { class: 'q-flow nw-flow' }, parts.filter(Boolean)));
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

// 台灣 or 國際: every story, by how many outlets or the latest, 20 at a time.
export function renderRegion(box, region) {
  if (notYet(box)) return;
  const all = ordered(state.page[region], state.order[region]);
  const shown = all.slice(0, state.shown[region]);
  const tabs = h('div', { class: 'q-chips q-texttabs nw-order', role: 'tablist' }, [
    ['wide', W('最多家報', 'Most covered')],
    ['new', W('最新', 'Latest')]
  ].map(([id, label]) => h('button', { type: 'button', class: `q-chip${state.order[region] === id ? ' on' : ''}`, role: 'tab', 'aria-selected': String(state.order[region] === id), onclick: () => ((state.order[region] = id), (state.shown[region] = 20), hooks.render()), text: label })));
  const left = all.length - shown.length;
  const pager = left > 0 ? moreToggle({ more: W(`再看 ${Math.min(20, left)} 則`, `${Math.min(20, left)} more`), less: null, onToggle: () => ((state.shown[region] += 20), hooks.render()) }) : null;
  box.replaceChildren(
    h('div', { class: 'nw-region' }, [
      tabs,
      all.length ? storyList(shown, open) : empty({ icon: 'list', title: W('還沒有新聞', 'No stories yet'), body: W('兩家以上在報的新聞會出現在這裡。', 'Stories two outlets or more carry show here.') }),
      pager,
      builtLine(state.page)
    ])
  );
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
