import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cleanMarkets, pct, pcts, move, STALE } from '../public/lib/markets.mjs';

const NOW = Date.parse('2026-11-12T13:00:00Z');
const page = (built, m) => ({ built, stories: { a: [m] } });
const jensen = { e: '1', slug: 'jensen-huang-out', zh: '黃仁勳何時宣布卸任？', en: 'When will Jensen Huang step down?', kind: 'dates', rows: [{ md: '12/31', en: 'December 31', p: 0.12, d: 0.05 }, { md: 'bad', p: 0.2, d: 0 }] };

test('預測市場: read whole and checked; a deadline row needs its date', () => {
  const m = cleanMarkets(page(NOW, jensen), NOW);
  assert.deepEqual(m.get('a')[0].rows.map(r => [r.md, r.p]), [['12/31', 0.12]]);
  assert.equal(cleanMarkets(page(NOW, { ...jensen, slug: 'x/../y' }), NOW).size, 0, 'a source address is Polymarket’s event, nothing else');
  assert.equal(cleanMarkets(page(NOW, { ...jensen, rows: [{ md: '12/31', p: 1.4 }] }), NOW).size, 0, 'a chance past 100% is no chance');
  assert.equal(cleanMarkets(null, NOW).size, 0);
});

test('a chance is live: a page past three hours old shows none', () => {
  assert.equal(cleanMarkets(page(NOW - STALE + 60_000, jensen), NOW).size, 1);
  assert.equal(cleanMarkets(page(NOW - STALE - 1, jensen), NOW).size, 0);
});

test('chances and moves as read', () => {
  assert.deepEqual([pct(0.004), pct(0.123), pct(0.996)], ['<1%', '12%', '>99%']);
  assert.deepEqual([move(0.051), move(-0.03), move(0.004)], ['▲5', '▼3', '']);
});

test('options that exclude each other add to 100%: 55.5% and 44.5% are 56% and 44%, never 56% and 45%', () => {
  const rows = [{ p: 0.555 }, { p: 0.445 }];
  assert.deepEqual(pcts(rows, true), ['56%', '44%']);
  assert.deepEqual(pcts(rows, false), ['56%', '45%'], 'a ladder of deadlines is each its own chance');
  assert.deepEqual(pcts([{ p: 0.653 }, { p: 0.347 }], true), ['65%', '35%']);
  assert.deepEqual(pcts([{ p: 0.296 }, { p: 0.144 }, { p: 0.133 }, { p: 0.097 }], true), ['30%', '14%', '13%', '10%'], 'a race’s leaders: the shown share as it is');
  assert.deepEqual(pcts([{ p: 0.996 }, { p: 0.004 }], true), ['>99%', '<1%']);
  const one = { ...jensen, kind: 'pick', one: 1, rows: [{ en: 'Over $4T', zh: '4兆美元以上', p: 0.555, d: 0.13 }, { en: 'Under $4T', zh: '未達4兆美元', p: 0.445, d: 0.055 }] };
  assert.equal(cleanMarkets(page(NOW, one), NOW).get('a')[0].one, true);
  assert.equal(cleanMarkets(page(NOW, { ...one, kind: 'dates', rows: [{ md: '12/31', p: 0.5 }] }), NOW).get('a')[0].one, false);
});
