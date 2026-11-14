// 影音 (台灣 and 國際's tab): the news told by its clips, a story at a time
// (Jay 11-14: a list of videos was "super unhelpful … make it about using
// video to look for news"). Each story with a clip that plays here, most
// important first: its best clip at full width (a tap plays it in place),
// the story's title and one line of what happened, every outlet's clip on
// it in a strip (a tap swaps the one playing), its coverage, and 完整報導
// opening the sheet at the same second. A clip played to its end goes on to
// the next story's; 下一則 skips there.
import { h, moreToggle, empty } from '#kit/ui.mjs';
import { state, hooks, W, en, ago, outletName, outletMark, topicName, openOut } from '../shell.mjs';
import { isLive } from '../lib/stories.mjs';
import { picture, playMark, shownTitle, shownSum, coverage, liveTag, newTag } from './parts.mjs';
import { openStory, player, aiMark } from './story.mjs';

const PAGE = 8;
// How many each region's feed shows.
const shownOf = { tw: PAGE, intl: PAGE };

// A story's clips that play here (YouTube's), the builder's best first;
// those on the outlet's own player after, opened on its site.
const playable = s => (s.clips || []).filter(c => c[1]);
export const videoStories = stories => stories.filter(s => playable(s).length);

// The one playing now (one at a time): its card, put back as a still.
let now = null;
export function stopVideo() {
  if (!now) return;
  const was = now;
  now = null;
  was.stop();
}
// Something plays in the feed (app.mjs holds its redraw till it stops).
export const videoPlaying = () => Boolean(now?.card?.isConnected);

// The feed. `stories`: the region's, in its order.
export function renderVideo(box, region, stories, { chips, foot }) {
  stopVideo();
  // (No second row of kinds under the tabs: it only said the tabs again,
  // 政治 · 兩岸 · 國際 twice. A topic's tab marks its stories' clips.)
  const list = videoStories(stories);
  const shown = list.slice(0, shownOf[region]);
  const left = list.length - shown.length;
  const feed = h('div', { class: 'nw-vfeed' }, shown.map(s => videoCard(s, list)));
  const pager = left > 0 ? moreToggle({ more: W(`再看 ${Math.min(PAGE, left)} 則`, `${Math.min(PAGE, left)} more`), less: null, onToggle: () => {
    // (Put under the ones there, not the feed drawn again: Jay 11-14, 再看 "jump[ed] the UI".)
    const from = shownOf[region];
    shownOf[region] += PAGE;
    feed.append(...list.slice(from, shownOf[region]).map(s => videoCard(s, list)));
    const n = list.length - shownOf[region];
    n > 0 ? pager.set(false, W(`再看 ${Math.min(PAGE, n)} 則`, `${Math.min(PAGE, n)} more`), null) : pager.remove();
  } }) : null;
  box.replaceChildren(
    chips,
    h('div', { class: 'nw-region nw-video' }, [
      shown.length ? feed : empty({ icon: 'play', title: W('還沒有影片', 'No clips yet'), body: W('媒體的影片會跟著新聞出現在這裡。', 'Outlets’ clips show here with their stories.') }),
      pager,
      foot
    ])
  );
}

// The story's one line: our 重點整理's "what happened" (the AI's, marked),
// else the outlet's own summary in the reader's language; none while it
// waits for its translation.
function lineOf(story) {
  const b = state.briefs?.get?.(story.id);
  const p = b?.points?.find(x => x.k === 'what') || b?.points?.[0];
  if (p) return h('span', { class: 'nw-v-line', lang: en ? 'en' : 'zh-Hant' }, [en ? p.en : p.zh, ' ', aiMark(W('重點由 AI 依各家報導寫成', 'Written by AI from the outlets’ reports'))]);
  const t = shownSum(story);
  return t.text && !t.wait ? h('span', { class: 'nw-v-line', lang: t.lang, text: t.text }) : null;
}

// A clip's still: its own frame (what plays), the outlet over it, a play mark.
function still(clip, story, { size = 'l' } = {}) {
  const pic = picture(clip[4] || story.img, 'nw-v-pic', { size }) || h('span', { class: 'nw-v-pic' });
  pic.append(playMark());
  return pic;
}

// One story's card.
function videoCard(story, list) {
  const clips = playable(story);
  const sites = (story.clips || []).filter(c => !c[1]);
  let clip = clips[0];
  let at = 0;
  const stage = h('div', { class: 'nw-v-stage' });
  const bar = h('div', { class: 'nw-v-bar', hidden: true });
  const card = h('article', { class: 'nw-v', 'data-story': story.id });
  // (Its still: a tap plays it here.)
  const poster = () =>
    stage.replaceChildren(
      h('button', { type: 'button', class: 'nw-v-play', 'aria-label': W(`播放${outletName(clip[0])}的影片`, `Play ${outletName(clip[0])}’s clip`), onclick: () => play(clip) }, [
        still(clip, story),
        h('span', { class: 'nw-v-by' }, [outletMark(clip[0], 18), h('span', { text: outletName(clip[0]) })])
      ])
    );
  const strip = clips.length + sites.length > 1 ? h('div', { class: 'q-rail small nw-v-strip', 'data-noswipe': '' }) : null;
  const mark = () =>
    strip?.querySelectorAll('.nw-v-clip').forEach(b => {
      const on = b.dataset.clip === clip[1];
      b.classList.toggle('on', on);
      b.setAttribute('aria-current', on ? 'true' : 'false');
    });
  const next = () => {
    let n = card.nextElementSibling;
    while (n && !n.__play) n = n.nextElementSibling;
    return n;
  };
  // (Playing: who made it, YouTube's own page, the next story.)
  const drawBar = () => {
    const after = next();
    bar.replaceChildren(
      h('span', { class: 'nw-v-credit', text: W(`影片：${outletName(clip[0])}`, `Video: ${outletName(clip[0])}`) }),
      h('a', { href: `https://www.youtube.com/watch?v=${clip[1]}`, target: '_blank', rel: 'noopener', text: W('在 YouTube 看', 'Watch on YouTube') }),
      after ? h('button', { type: 'button', class: 'nw-v-next', onclick: () => goOn(after), text: W('下一則 ›', 'Next ›') }) : null
    );
    bar.hidden = false;
  };
  // (The next story's card in view, its clip playing.)
  const goOn = after => {
    stopVideo();
    after.scrollIntoView?.({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    after.__play();
  };
  function play(c, { start = 0 } = {}) {
    if (now?.card !== card) stopVideo();
    clip = c;
    at = start;
    stage.replaceChildren(
      player(c, {
        start,
        onTime: t => (at = t),
        // (Played to its end: on to the next story's, as a feed goes.)
        onEnd: () => {
          const after = next();
          if (after && now?.card === card) goOn(after);
        }
      })
    );
    drawBar();
    mark();
    card.classList.add('is-on');
    now = {
      card,
      stop: () => {
        bar.hidden = true;
        card.classList.remove('is-on');
        poster();
        mark();
      }
    };
  }
  card.__play = () => play(clips[0]);
  // (The whole story: its sheet, the clip on at the same second.)
  const openAll = () => {
    const playing = now?.card === card;
    const c = clip;
    const t = Math.floor(at);
    stopVideo();
    openStory(story.id, { list, ...(playing ? { clip: c[1], start: t } : {}) });
  };
  if (strip)
    strip.replaceChildren(
      ...clips.map(c =>
        h('button', { type: 'button', class: 'nw-v-clip', 'data-clip': c[1], 'aria-label': W(`${outletName(c[0])}的影片`, `${outletName(c[0])}’s clip`), onclick: () => play(c) }, [
          still(c, story, { size: 's' }),
          h('span', { class: 'nw-v-clip-by' }, [outletMark(c[0], 16), h('span', { text: outletName(c[0]) })])
        ])
      ),
      // (An outlet's own player: on its site.)
      ...sites.map(c =>
        h('button', { type: 'button', class: 'nw-v-clip is-out', onclick: () => (hooks.read(c[0]), openOut(c[2])) }, [
          still(c, story, { size: 's' }),
          h('span', { class: 'nw-v-clip-by' }, [outletMark(c[0], 16), h('span', { text: outletName(c[0]) }), h('small', { 'aria-hidden': 'true', text: '↗' })])
        ])
      )
    );
  poster();
  mark();
  const t = shownTitle(story);
  const topic = story.topics?.[0] ? topicName(story.topics[0], story.region) : '';
  const live = liveTag(story) || newTag(story);
  const when = isLive(story, state.page?.built) ? '' : ago(story.at);
  card.replaceChildren(
    stage,
    bar,
    h('button', { type: 'button', class: 'nw-v-text', onclick: openAll }, [
      h('small', { class: 'nw-kicker' }, [live, [topic, when].filter(Boolean).join(' · ')]),
      h('span', { class: 'nw-v-title', lang: t.lang, text: t.text }),
      lineOf(story)
    ]),
    strip,
    h('div', { class: 'nw-v-foot' }, [coverage(story), h('button', { type: 'button', class: 'nw-v-all', onclick: openAll, text: W('完整報導 ›', 'Full story ›') })])
  );
  return card;
}
