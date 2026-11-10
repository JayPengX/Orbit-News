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
