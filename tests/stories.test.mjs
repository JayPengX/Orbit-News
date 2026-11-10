// The builder's page as the screens read it (lib/stories.mjs): checked on
// the way in, each story's bar, its headlines by side, the one-sided ones.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cleanPage, barOf, bySide, oneSided, ordered, storiesWith, agoOf, storyById } from '../public/lib/stories.mjs';

const T = Date.parse('2026-11-10T03:00:00Z');
const H = 3_600_000;
const story = (id, region, sides, items, extra = {}) => ({ id, title: id, at: T, first: T - H, n: new Set(items.map(i => i[0])).size, sides, blind: '', parties: [], items, ...extra });
const raw = {
  built: T,
  tw: [
    story('a', 'tw', { g: 1, c: 1, b: 2 }, [['udn', 'A1', 'https://udn.com/1', T], ['ltn', 'A2', 'https://ltn.com.tw/1', T - H], ['chinatimes', 'A3', 'https://chinatimes.com/1', T - 2 * H], ['cna', 'A4', 'https://cna.com.tw/1', T], ['nobody', 'x', 'https://x/1', T]]),
    story('b', 'tw', { g: 0, c: 1, b: 2 }, [['udn', 'B', 'https://udn.com/2', T - 3 * H], ['ctinews', 'B', 'https://ctinews.com/2', T - 3 * H], ['cna', 'B', 'https://cna.com.tw/2', T - 3 * H]], { blind: 'g', at: T - 2 * H }),
    { id: 'broken' }
  ],
  intl: [story('c', 'intl', { l: 1, c: 0, r: 1 }, [['nyt', 'C', 'https://nyt.com/3', T], ['fox', 'C', 'https://fox.com/3', T], ['dw', 'C', 'https://dw.com/3', T]])]
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

test('headlines by side, the unrated apart', () => {
  const page = cleanPage(raw);
  const tw = bySide(page.tw[0]);
  assert.deepEqual(tw.b.map(i => i[0]), ['udn', 'chinatimes']);
  assert.deepEqual(tw.g.map(i => i[0]), ['ltn']);
  const intl = bySide(page.intl[0]);
  assert.deepEqual([intl.l.length, intl.r.length, intl.none.map(i => i[0])], [1, 1, ['dw']]);
});

test('one-sided stories by the side that left them out; orders; an outlet\'s stories', () => {
  const page = cleanPage(raw);
  assert.deepEqual(oneSided(page).map(g => [g.region, g.missing, g.stories.map(s => s.id)]), [['tw', 'g', ['b']]]);
  assert.deepEqual(ordered(page.tw, 'new').map(s => s.id), ['a', 'b']);
  assert.deepEqual(storiesWith(page, 'cna').map(s => s.id), ['a', 'b']);
  assert.deepEqual(storiesWith(page, 'fox').map(s => s.id), ['c']);
});

test('how long ago, in both languages', () => {
  assert.equal(agoOf(T - 30_000, T), '剛剛');
  assert.equal(agoOf(T - 12 * 60_000, T), '12 分鐘前');
  assert.equal(agoOf(T - 3 * H, T, true), '3 hr ago');
  assert.equal(agoOf(T - 49 * H, T), '2 天前');
});
