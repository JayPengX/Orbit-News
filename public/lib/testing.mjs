// Orbit News's own switches in the kit's 測試工具 (hidden until unlocked:
// Orbit Pass › seven taps on 除錯紀錄). Read where the stories come in
// (app.mjs load) as globalThis.ORBIT_TEST?.flags?.<name>; the kit's clock and
// network switches work here as everywhere. Only what's drawn changes: the
// reading log and the Pass are untouched, nothing more is asked of the Worker.
//   newsEmpty     the builder's page has no stories
//   newsFail      the stories can't be read (nothing kept shown either)
//   oneSided      the top Taiwan story carried by one side only (單邊)
//   badClip       every clip an id YouTube won't play (the 「只能在 YouTube 看」 fallback)
import { W } from '../shell.mjs';
import { ENDS } from './stories.mjs';
import { sideOf } from '#kit/news-outlets.mjs';

export const testFlags = () => globalThis.ORBIT_TEST?.flags || {};

// A page as the switches have it (a copy). No switch: the same page.
export function testPage(page) {
  const on = testFlags();
  if (!page || !(on.newsEmpty || on.oneSided || on.badClip)) return page;
  if (on.newsEmpty) return { ...page, tw: [], intl: [] };
  let { tw, intl } = page;
  if (on.oneSided && tw.length) {
    // (The end it has fewest headlines from goes missing; its headlines with it.)
    const s = tw[0];
    const count = side => s.items.filter(it => sideOf(it[0], 'tw') === side).length;
    const missing = ENDS.tw.slice().sort((a, b) => count(a) - count(b))[0];
    const items = s.items.filter(it => sideOf(it[0], 'tw') !== missing);
    tw = [{ ...s, blind: missing, items: items.length ? items : s.items }, ...tw.slice(1)];
  }
  if (on.badClip) {
    // (Eleven characters, YouTube's shape: a clip that isn't there, error 100.)
    const bad = s => (s.clips?.length ? { ...s, clips: s.clips.map(c => [c[0], 'xxxxxxxxxxx', ...c.slice(2)]) } : s);
    tw = tw.map(bad);
    intl = intl.map(bad);
  }
  return { ...page, tw, intl };
}

if (typeof document !== 'undefined') {
  (globalThis.ORBIT_TEST_TOOLS ||= []).push(
    { app: 'news', title: W('沒有新聞', 'No stories'), sub: W('新聞列表是空的', 'The page of stories is empty'), flag: 'newsEmpty' },
    { app: 'news', title: W('讀不到新聞', 'Stories can’t be read'), sub: W('讀新聞失敗，手機上也沒有留下的', 'The read fails and nothing is kept on the phone'), flag: 'newsFail' },
    { app: 'news', title: W('單邊新聞', 'A one-sided story'), sub: W('第一則台灣新聞只有一邊的媒體報', 'The top Taiwan story carried by one side only'), flag: 'oneSided' },
    { app: 'news', title: W('影片不能播', 'Clips won’t play'), sub: W('每段影片都是 YouTube 拒播的', 'Every clip is one YouTube refuses'), flag: 'badClip' }
  );
}
