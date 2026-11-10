import { test } from 'node:test';
import assert from 'node:assert/strict';
import { learnSet, learnParts, wordsIn } from '../public/lib/learn.mjs';

const set = learnSet({ words: [{ w: 'abandon', zh: '放棄' }, { w: 'tariff', zh: '關稅' }, { w: 'seize', zh: '抓住', f: ['seized', 'seizes'] }, { w: 'study', zh: '研究' }, { w: 'an', zh: '一個' }] });

test('a learnt word is found in its forms, as a whole word only', () => {
  const parts = learnParts('US abandons plan as tariffs bite; police seized boats', set);
  assert.deepEqual(parts.filter(p => typeof p === 'object').map(p => [p.t, p.w]), [['abandons', 'abandon'], ['tariffs', 'tariff'], ['seized', 'seize']]);
  assert.equal(parts.map(p => (typeof p === 'object' ? p.t : p)).join(''), 'US abandons plan as tariffs bite; police seized boats');
  assert.equal(learnParts('Abandonment and tariffed-out', set).length, 1);
  assert.equal(learnParts('New studies show', set)[1].w, 'study');
});

test('which words a story uses, most first; none without the notebook', () => {
  assert.deepEqual(wordsIn(['Tariff talks', 'New tariffs as China abandons deal'], set).map(w => [w.w, w.n]), [['tariff', 2], ['abandon', 1]]);
  assert.equal(learnSet(null), null);
  assert.deepEqual(wordsIn(['tariffs'], null), []);
  assert.equal(learnParts('an apple', set).length, 1);
});
