// 我的閱讀 (lib/reading.mjs): the log of outlets opened, a day at a time;
// two copies merge without counting a tap twice; the balance by side.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyLog, addRead, mergeLogs, trimLog, balanceOf, leanOf, decodeLog, encodeLog } from '../public/lib/reading.mjs';

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
