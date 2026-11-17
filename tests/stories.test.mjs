// The builder's page as the screens read it (lib/stories.mjs): checked on
// the way in, each story's bar, its headlines by side.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cleanPage, hasStories, barOf, bySide, storiesWith, agoOf, storyById, onTopic, topicsIn, clipsOf, daysOf, picturesOf } from '../public/lib/stories.mjs';

const T = Date.parse('2026-11-10T03:00:00Z');
const H = 3_600_000;
const story = (id, region, sides, items, extra = {}) => ({ id, title: id, at: T, first: T - H, n: new Set(items.map(i => i[0])).size, sides, blind: '', parties: [], items, ...extra });
const raw = {
  built: T,
  tw: [
    story('a', 'tw', { g: 1, c: 1, b: 2 }, [['udn', 'A1', 'https://udn.com/1', T], ['ltn', 'A2', 'https://ltn.com.tw/1', T - H], ['chinatimes', 'A3', 'https://chinatimes.com/1', T - 2 * H], ['cna', 'A4', 'https://cna.com.tw/1', T], ['nobody', 'x', 'https://x/1', T]], {
      topics: ['pol', 'def', 3],
      days: [['11-09', 3], ['11-10', 2]],
      clips: [['pts', 'AbCdEfGhIjK', 'https://pts.org.tw/1', 'A clip', 'https://i.ytimg.com/vi/AbCdEfGhIjK/hqdefault.jpg'], ['nobody', 'AbCdEfGhIjK', 'https://x/1'], ['pts', 'not an id', 'https://pts.org.tw/2'], ['cbs', '', 'https://cbsnews.com/video/1', 'Video page', '']]
    }),
    story('b', 'tw', { g: 0, c: 1, b: 2 }, [['udn', 'B', 'https://udn.com/2', T - 3 * H], ['ctinews', 'B', 'https://ctinews.com/2', T - 3 * H], ['cna', 'B', 'https://cna.com.tw/2', T - 3 * H]], { blind: 'g', at: T - 2 * H }),
    { id: 'broken' }
  ],
  intl: [story('c', 'intl', { l: 1, c: 0, r: 1 }, [['nyt', 'C', 'https://nyt.com/3', T], ['fox', 'C', 'https://fox.com/3', T], ['xinhua', 'C', 'https://english.news.cn/3', T]])]
};

test('a page as read: broken stories and unknown outlets left out, each story knows its region', () => {
  const page = cleanPage(raw);
  assert.deepEqual(page.tw.map(s => s.id), ['a', 'b']);
  assert.equal(page.tw[0].items.length, 4);
  assert.equal(storyById(page, 'c').region, 'intl');
  assert.deepEqual(cleanPage(null), { built: 0, tw: [], intl: [] });
});

test('a front with no stories (an empty answer, an error, a changed shape) is a failed read, never drawn over the kept one', () => {
  assert.equal(hasStories(raw), true);
  for (const bad of [null, {}, [], { error: 'upstream' }, { built: T, tw: [], intl: [] }, { stories: raw.tw }]) assert.equal(hasStories(bad), false, JSON.stringify(bad)?.slice(0, 40));
});

test("a story's bar: each side's count and share of the outlets with a side", () => {
  // (As counted: no pool. The ends weighed by the page's outlets: the test below.)
  const { parts, rated } = barOf({ ...cleanPage(raw).tw[0], pool: null });
  assert.equal(rated, 4);
  assert.deepEqual(parts.map(p => [p.side, p.n, p.share]), [['g', 1, 0.25], ['c', 1, 0.25], ['b', 2, 0.5]]);
});

test('headlines by side; China\'s state media no longer read (Jay 11-14)', () => {
  const page = cleanPage(raw);
  const tw = bySide(page.tw[0]);
  assert.deepEqual(tw.b.map(i => i[0]), ['udn', 'chinatimes']);
  assert.deepEqual(tw.g.map(i => i[0]), ['ltn']);
  const intl = bySide(page.intl[0]);
  assert.deepEqual([intl.l.length, intl.r.length, intl.none.map(i => i[0])], [1, 1, []]);
});

test('no story counts state media (none read, Jay 11-14); the sides\' bar only for a kind sides take', async () => {
  const { stateMedia, sidesTaken } = await import('../public/lib/stories.mjs');
  const page = cleanPage(raw);
  assert.equal(stateMedia(page.intl[0]), 0);
  assert.equal(stateMedia(page.tw[0]), 0);
  // (A reading's bar has no headlines: 媒體 went blank for anyone who'd opened one, 11-10.)
  assert.equal(stateMedia({ region: 'tw', sides: { g: 2, c: 1, b: 0 }, n: 3 }), 0);
  assert.equal(sidesTaken({ topics: ['pol'] }), true);
  assert.equal(sidesTaken({ topics: ['sport'] }), false);
  assert.equal(sidesTaken({ topics: ['life', 'pol'] }), true);
  assert.equal(sidesTaken({ topics: [] }), true);
});

test('an outlet\'s stories', () => {
  const page = cleanPage(raw);
  assert.deepEqual(storiesWith(page, 'cna').map(s => s.id), ['a', 'b']);
  assert.deepEqual(storiesWith(page, 'fox').map(s => s.id), ['c']);
});

test('how long ago, in both languages', () => {
  assert.equal(agoOf(T - 30_000, T), '剛剛');
  assert.equal(agoOf(T - 12 * 60_000, T), '12 分鐘前');
  assert.equal(agoOf(T - 3 * H, T, true), '3 hr ago');
  assert.equal(agoOf(T - 49 * H, T), '2 天前');
});

test('topics, clips, how long a story ran, and the past', () => {
  const page = cleanPage(raw);
  const a = page.tw[0];
  assert.deepEqual(a.topics, ['pol', 'def']);
  assert.deepEqual(a.clips.map(c => c[1]), ['AbCdEfGhIjK', '']);
  assert.equal(daysOf(a), 1);
  assert.equal(daysOf({ first: T - 50 * H, at: T }), 3);
  assert.equal(daysOf({ first: T - 23 * H, at: T }), 1);
  assert.deepEqual(onTopic(page.tw, 'def').map(s => s.id), ['a']);
  assert.deepEqual(onTopic(page.tw, 'all').map(s => s.id), ['a', 'b']);
  assert.deepEqual(onTopic(page.tw, 'video').map(s => s.id), ['a']);
  assert.deepEqual(topicsIn(page.tw), [['pol', 1], ['def', 1]]);
  assert.deepEqual(clipsOf(page.tw).map(c => [c.story.id, c.clip[1]]), [['a', 'AbCdEfGhIjK']]);
  const past = cleanPage({ tw: [story('old', 'tw', { g: 1, c: 0, b: 0 }, [['ltn', 'Old', 'https://ltn.com.tw/9', T - 200 * H]])] });
  assert.equal(storyById(page, 'old'), null);
  assert.equal(storyById(page, 'old', past).title, 'old');
});

test('a picture that won’t load gives way to the other outlets’ (Jay 11-11: 圖：日本時報 over an empty space, 32 outlets more)', () => {
  const raw = {
    intl: [
      {
        id: 'x',
        title: 'US, Russia and Ukraine start talks in Abu Dhabi',
        img: 'https://www.japantimes.co.jp/a.jpg',
        imgBy: 'japantimes',
        alts: [['https://nypost.com/b.jpg', 'nypost'], ['javascript:alert(1)', 'cnn'], ['https://x.test/c.jpg', 'nobody'], ['https://www.japantimes.co.jp/a.jpg', 'japantimes'], ['https://i.ytimg.com/vi/AAAAAAAAAAA/hqdefault.jpg', 'cnn']],
        items: [['japantimes', 'U.S. calls for new Europe security', 'https://www.japantimes.co.jp/news/x', 1]]
      }
    ]
  };
  const s = cleanPage(raw).intl[0];
  assert.deepEqual(picturesOf(s), [
    ['https://www.japantimes.co.jp/a.jpg', 'japantimes'],
    ['https://nypost.com/b.jpg', 'nypost'],
    ['https://i.ytimg.com/vi/AAAAAAAAAAA/hqdefault.jpg', 'cnn']
  ]);
  assert.deepEqual(picturesOf({ id: 'y', items: [] }), []);
});

test('測試工具: no switch, the same page; each switch a copy', async () => {
  const { testPage } = await import('../public/lib/testing.mjs');
  const page = { built: 1, tw: [{ id: 'a', title: 'x', items: [['ltn', 'h', 'https://a'], ['udn', 'h', 'https://b']], clips: [['ltn', 'abcdefghijk', 'https://c']] }], intl: [] };
  delete globalThis.ORBIT_TEST;
  assert.equal(testPage(page), page);
  try {
    globalThis.ORBIT_TEST = { flags: { badClip: true } };
    const g = testPage(page);
    assert.equal(g.tw[0].clips[0][1], 'xxxxxxxxxxx');
    assert.equal(page.tw[0].clips[0][1], 'abcdefghijk', 'the page read untouched');
    globalThis.ORBIT_TEST = { flags: { newsEmpty: true } };
    assert.deepEqual(testPage(page).tw, []);
  } finally {
    delete globalThis.ORBIT_TEST;
  }
});

test('快訊: a story the builder marks live is breaking while the page is fresh and it was heard of lately, most outlets first', async () => {
  const { isLive, liveOf } = await import('../public/lib/stories.mjs');
  const a = { id: 'a', at: T, live: 8 };
  assert.equal(isLive(a, T, T + 10 * 60_000), true);
  // (A page built over an hour ago, a story heard of over 2 hours ago, or none marked: not breaking.)
  assert.equal(isLive(a, T - 61 * 60_000, T), false);
  assert.equal(isLive({ ...a, at: T - 3 * H }, T, T), false);
  assert.equal(isLive({ id: 'b', at: T }, T, T), false);
  const page = { built: T, tw: [{ id: 'x', at: T }, { id: 'y', at: T, live: 7 }], intl: [{ id: 'z', at: T, live: 20 }] };
  assert.deepEqual(liveOf(page, T).map(s => s.id), ['z', 'y']);
});

test('one saga once: a Taiwan story on a world story, or two on the same one, sharing a name, are one; the loose join alone is not', async () => {
  const { sameSaga, oneASaga } = await import('../public/lib/stories.mjs');
  const world = { id: 'w', region: 'intl', title: 'Nvidia CEO Jensen Huang to step down' };
  const quit = { id: 'a', region: 'tw', world: 'w', title: '黃仁勳辭輝達執行長 財務長克瑞斯任臨時CEO' };
  const board = { id: 'b', region: 'tw', world: 'w', title: '傳輝達董事會擬撤換黃仁勳 婚外情疑雲事件簿一覽' };
  const leave = { id: 'c', region: 'tw', world: 'w', title: '跟蔣萬安同天請假！沈伯洋宣布12日起請假衝刺' };
  const zhOf = s => (s.id === 'w' ? '黃仁勳陷醜聞 輝達董事會評估其去留' : '');
  assert.equal(sameSaga(quit, board), true);
  assert.equal(sameSaga(quit, world, zhOf), true);
  assert.equal(sameSaga(world, quit, zhOf), true);
  assert.equal(sameSaga(quit, world), false, 'no Chinese title for the world story: kept apart');
  assert.equal(sameSaga(quit, leave), false, 'joined to the same world story, nothing shared');
  assert.equal(sameSaga({ ...board, world: '' }, quit), false);
  assert.deepEqual(oneASaga([quit, world, board, leave, null], [], zhOf).map(s => s.id), ['a', 'c']);
  assert.deepEqual(oneASaga([board, leave], [quit], zhOf).map(s => s.id), ['c']);
});

test('a list drawn again keeps its order, fresh numbers in it, a new story at its own place (Jay 11-13: "reshuffle")', async () => {
  const { steady } = await import('../public/lib/stories.mjs');
  const held = new Map();
  const s = (id, n = 1) => ({ id, n });
  assert.deepEqual(steady(held, 'tw', [s('a'), s('b'), s('c')]).map(x => x.id), ['a', 'b', 'c']);
  const again = steady(held, 'tw', [s('c', 9), s('new'), s('a'), s('b')]);
  assert.deepEqual(again.map(x => x.id), ['a', 'new', 'b', 'c']);
  assert.equal(again.at(-1).n, 9, 'its fresh numbers');
  assert.deepEqual(steady(held, 'tw', [s('b'), s('a')]).map(x => x.id), ['a', 'b'], 'a story gone leaves');
  held.clear();
  assert.deepEqual(steady(held, 'tw', [s('b'), s('a')]).map(x => x.id), ['b', 'a'], 'a pull ranks anew');
});

test('the bar weighs the two ends by their outlets on the page (Jay 11-17: more left outlets made every story look left)', () => {
  const it = (o, t) => [o, t, `https://x.test/${o}/${t}`, T];
  const left = ['nyt', 'wapo', 'cnn', 'nbc', 'cbs', 'abc'];
  const right = ['fox', 'nypost', 'wexam'];
  const raw = {
    built: T,
    intl: [
      story('a', 'intl', { l: 4, c: 0, r: 2 }, [...left.slice(0, 4), ...right.slice(0, 2)].map(o => it(o, 'a'))),
      story('b', 'intl', { l: 2, c: 0, r: 1 }, [...left.slice(4), right[2]].map(o => it(o, 'b')))
    ]
  };
  const page = cleanPage(raw);
  assert.deepEqual(page.intl[0].pool, { l: 6, r: 3 });
  // 4 of 6 left, 2 of 3 right: the same share of each end's outlets, an even bar; the counts as written.
  const { parts } = barOf(page.intl[0]);
  assert.deepEqual(parts.map(p => p.n), [4, 0, 2]);
  assert.ok(Math.abs(parts[0].share - parts[2].share) < 1e-9);
  // No pool (a reading's own count): as counted.
  assert.deepEqual(barOf({ region: 'tw', sides: { g: 3, c: 1, b: 1 } }).parts.map(p => p.share), [0.6, 0.2, 0.2]);
});

test('one saga once on an English phone too: a world story is matched by Taiwan’s headlines on it until its title’s Chinese has come (黃仁勳 led twice in English)', async () => {
  const { sameSaga, oneASaga, worldZh } = await import('../public/lib/stories.mjs');
  const t1 = { id: 't1', region: 'tw', title: '黃仁勳宣布卸任輝達執行長 董事會將選新人', world: 'w1' };
  const t2 = { id: 't2', region: 'tw', title: '立法院三讀通過明年度總預算' };
  const w1 = { id: 'w1', region: 'intl', title: 'Jensen Huang to step down as Nvidia chief executive', tw: { items: [['ltn', '黃仁勳卸任輝達執行長 震撼科技業', 'https://x.tw/1', 1]] } };
  // An English phone: nothing kept for the world's English title.
  const none = () => undefined;
  assert.match(worldZh(w1, none), /黃仁勳/);
  assert.equal(sameSaga(t1, w1, s => worldZh(s, none)), true);
  assert.deepEqual(oneASaga([t1, t2, w1], [], s => worldZh(s, none)).map(s => s.id), ['t1', 't2']);
  // Its translation, once come, first; a Taiwan story has none.
  assert.equal(worldZh(w1, t => (t === w1.title ? '黃仁勳將卸任輝達執行長' : undefined)), '黃仁勳將卸任輝達執行長');
  assert.equal(worldZh(t1, none), '');
});
