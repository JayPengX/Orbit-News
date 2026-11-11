import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cleanSides, sidesOf } from '../public/lib/sides.mjs';

test('各方怎麼說: read whole and checked, shown in the bar’s order, only the sides a story has', () => {
  const raw = { built: 1, sides: { a: { sides: { b: { zh: '藍', en: 'Blue' }, g: { zh: '綠', en: 'Green' }, x: { zh: '?', en: '?' } }, diff: { zh: '差', en: '' } }, one: { sides: { g: { zh: '綠', en: 'G' } } }, bad: null } };
  const m = cleanSides(raw);
  assert.deepEqual([...m.keys()], ['a'], 'one side is nothing to compare');
  assert.equal(m.get('a').diff, null, 'a diff needs both languages');
  const s = sidesOf({ region: 'tw', sides: { g: 2, c: 3, b: 1 } }, m.get('a'));
  assert.deepEqual(s.rows.map(r => r.side), ['g', 'b']);
  assert.equal(sidesOf({ region: 'tw', sides: { g: 2 } }, m.get('a')), null, 'a side gone from its coverage is dropped');
  assert.equal(cleanSides(null).size, 0);
});

test('a difference that says each side again is left out (Jay 11-10)', async () => {
  const { cleanSides } = await import('../public/lib/sides.mjs');
  const said = cleanSides({ sides: { a: { sides: { g: { zh: '引外交部稱「假消息」', en: 'x' }, b: { zh: '談經貿', en: 'y' }, c: { zh: '用「逼」「限一周」', en: 'z' } }, diff: { zh: '偏綠引官方說法，偏藍談經貿利益，中間用「逼」強調施壓。', en: 'recap' } }, b: { sides: { g: { zh: '甲', en: 'a' }, b: { zh: '乙', en: 'b' } }, diff: { zh: '只有偏藍提到 3 億補助', en: 'Only blue names the 300m subsidy' } } } });
  assert.equal(said.get('a').diff, null);
  assert.equal(said.get('b').diff.zh, '只有偏藍提到 3 億補助');
});
