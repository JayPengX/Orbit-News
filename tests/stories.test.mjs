// The builder's page as the screens read it (lib/stories.mjs): checked on
// the way in, each story's bar, its headlines by side, the one-sided ones.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cleanPage, barOf, bySide, oneSided, storiesWith, agoOf, storyById, onTopic, topicsIn, clipsOf, daysOf, picturesOf } from '../public/lib/stories.mjs';

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

test("a story's bar: each side's count and share of the outlets with a side", () => {
  const { parts, rated } = barOf(cleanPage(raw).tw[0]);
  assert.equal(rated, 4);
  assert.deepEqual(parts.map(p => [p.side, p.n, p.share]), [['g', 1, 0.25], ['c', 1, 0.25], ['b', 2, 0.5]]);
});

test('headlines by side, China\'s state media apart', () => {
  const page = cleanPage(raw);
  const tw = bySide(page.tw[0]);
  assert.deepEqual(tw.b.map(i => i[0]), ['udn', 'chinatimes']);
  assert.deepEqual(tw.g.map(i => i[0]), ['ltn']);
  const intl = bySide(page.intl[0]);
  assert.deepEqual([intl.l.length, intl.r.length, intl.none.map(i => i[0])], [1, 1, ['xinhua']]);
});

test('a story counts China\'s state media apart; the sides\' bar only for a kind sides take', async () => {
  const { stateMedia, sidesTaken } = await import('../public/lib/stories.mjs');
  const page = cleanPage(raw);
  assert.equal(stateMedia(page.intl[0]), 1);
  assert.equal(stateMedia(page.tw[0]), 0);
  // (A reading's bar has no headlines: 媒體 went blank for anyone who'd opened one, 11-10.)
  assert.equal(stateMedia({ region: 'tw', sides: { g: 2, c: 1, b: 0 }, n: 3 }), 0);
  assert.equal(sidesTaken({ topics: ['pol'] }), true);
  assert.equal(sidesTaken({ topics: ['sport'] }), false);
  assert.equal(sidesTaken({ topics: ['life', 'pol'] }), true);
  assert.equal(sidesTaken({ topics: [] }), true);
});

test('one-sided stories by the side that left them out; orders; an outlet\'s stories', () => {
  const page = cleanPage(raw);
  assert.deepEqual(oneSided(page).map(g => [g.region, g.missing, g.stories.map(s => s.id)]), [['tw', 'g', ['b']]]);
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

test('單邊 by kind: each one-sided story once, under its first kind; each side’s count', async () => {
  const { byKind, blindAll, blindCounts, oneSided } = await import('../public/lib/stories.mjs');
  const st = (id, region, blind, topics, n = 3) => ({ id, region, blind, topics, n, at: 0, items: [] });
  const page = { tw: [st('a', 'tw', 'b', ['pol', 'cs'], 5), st('b', 'tw', 'g', ['eco']), st('c', 'tw', '', ['pol'])], intl: [st('d', 'intl', 'r', ['cs', 'world'], 4)] };
  const all = blindAll(page);
  assert.deepEqual(all.map(s => s.id), ['a', 'd', 'b']);
  assert.deepEqual(byKind(all, ['pol', 'cs', 'eco']).map(([t, l]) => [t, l.map(s => s.id)]), [['pol', ['a']], ['cs', ['d']], ['eco', ['b']]]);
  assert.deepEqual(blindCounts(all), [{ region: 'tw', ends: [{ side: 'g', n: 1 }, { side: 'b', n: 1 }] }, { region: 'intl', ends: [{ side: 'l', n: 0 }, { side: 'r', n: 1 }] }]);
  assert.deepEqual(oneSided(page, 'cs').map(g => [g.region, g.missing, g.stories.map(s => s.id)]), [['tw', 'b', ['a']], ['intl', 'r', ['d']]]);
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
