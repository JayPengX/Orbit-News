// 我的閱讀 (lib/reading.mjs): the log of outlets opened, a day at a time;
// two copies merge without counting a tap twice; the balance by side.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyLog, addRead, mergeLogs, trimLog, balanceOf, leanOf, decodeLog, encodeLog, markRead, markDeep, sunk, sinkOf } from '../public/lib/reading.mjs';

test('a tap counts once for its outlet and day; an unknown outlet or day is not kept', () => {
  const log = emptyLog();
  addRead(log, 'ltn', '2026-11-10');
  addRead(log, 'ltn', '2026-11-10');
  addRead(log, 'nobody', '2026-11-10');
  addRead(log, 'udn', 'today');
  assert.deepEqual(log.days, { '2026-11-10': { ltn: 2 } });
});

test("two phones' copies merge by each day's larger count, never added twice", () => {
  const a = { v: 1, days: { '2026-11-09': { ltn: 3 }, '2026-11-10': { udn: 1 } } };
  const b = { v: 1, days: { '2026-11-09': { ltn: 2, cna: 1 } } };
  assert.deepEqual(mergeLogs(a, b).days, { '2026-11-09': { ltn: 3, cna: 1 }, '2026-11-10': { udn: 1 } });
  assert.deepEqual(mergeLogs(mergeLogs(a, b), b), mergeLogs(a, b));
});

test('a payload reads back as written; junk is no log, nothing is an empty one', () => {
  const log = addRead(emptyLog(), 'bbc', '2026-11-10');
  assert.deepEqual(decodeLog(encodeLog(log)), log);
  assert.equal(decodeLog('{not json'), null);
  assert.deepEqual(decodeLog(''), emptyLog());
});

test('only 60 days are kept; the balance reads 30, by side; an outlet no longer read (China\'s state media, 11-14) not counted', () => {
  const log = { v: 1, days: { '2026-08-01': { ltn: 9 }, '2026-10-01': { udn: 4 }, '2026-11-09': { ltn: 3, cna: 1, chinatimes: 2 }, '2026-11-10': { bbc: 2, xinhua: 1, fox: 1 } } };
  trimLog(log, '2026-11-10');
  assert.deepEqual(Object.keys(log.days).sort(), ['2026-10-01', '2026-11-09', '2026-11-10']);
  const tw = balanceOf(log, 'tw', '2026-11-10');
  assert.deepEqual(tw.sides, { g: 3, c: 1, b: 2 });
  assert.equal(tw.total, 6);
  assert.deepEqual(tw.outlets[0], ['ltn', 3]);
  const intl = balanceOf(log, 'intl', '2026-11-10');
  assert.deepEqual(intl.sides, { l: 0, c: 2, r: 1 });
  assert.equal(intl.none, 0);
  assert.ok(!intl.outlets.some(([o]) => o === 'xinhua'));
});

test('a lean is said only past five taps and three in five on one side', () => {
  assert.equal(leanOf({ sides: { g: 2, c: 1, b: 0 }, total: 3 }).lean, null);
  assert.equal(leanOf({ sides: { g: 4, c: 1, b: 1 }, total: 6 }).lean, 'g');
  assert.equal(leanOf({ sides: { g: 2, c: 2, b: 2 }, total: 6 }).lean, '');
});

test('what was seen goes further down: a sheet opened a little (and back up with the hours), an article read far (Jay 11-15)', () => {
  const now = Date.parse('2026-11-15T04:00:00Z');
  const H = 3_600_000;
  const st = id => ({ id, m: 10, n: 6, at: now - 5 * H });
  const list = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map(st);
  const log = emptyLog();
  markRead(log, list[0], now - H); // its sheet opened only
  markDeep(log, list[1], now - H); // an article of it read
  const order = sunk(list, log, { now }).map(s => s.id);
  assert.equal(order[0], 'c', 'the unseen first');
  assert.ok(order.indexOf('a') < order.indexOf('b'), 'looked at sits above read');
  assert.ok(order.indexOf('b') >= 6, 'read goes far down');
  // A looked-at story comes back as hours pass; a read one stays down a day and a half.
  assert.ok(sinkOf(log, list[0], { now: now + 24 * H }) < sinkOf(log, list[0], { now }));
  assert.equal(sinkOf(log, list[1], { now: now + 24 * H }), sinkOf(log, list[1], { now }));
  // A big development since: news again, where it was.
  assert.equal(sinkOf(log, { ...list[1], m: 30, at: now }, { now }), 1);
  // Kept through the Pass and merged: read on either phone stays read.
  const back = decodeLog(encodeLog(log));
  assert.equal(back.read.b[3], 1);
  const other = emptyLog();
  markRead(other, list[1], now);
  assert.equal(mergeLogs(other, log).read.b[3], 1);
  // Opened again in its sheet: still read.
  markRead(log, list[1], now);
  assert.equal(log.read.b[3], 1);
});
