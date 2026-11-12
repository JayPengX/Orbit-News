import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cleanMarkets, pct, move, STALE } from '../public/lib/markets.mjs';

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
