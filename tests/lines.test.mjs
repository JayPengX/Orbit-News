import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cleanLines, titleOf, lineOf } from '../public/lib/lines.mjs';

const lines = cleanLines({ lines: { a: { line: '立法院三讀通過預算案，總額 3 兆元。', zh: '立院三讀通過總預算', en: 'Legislature passes the budget' }, b: { line: '', zh: '美聯準會維持利率不變', en: '' }, bad: 3 } });

test('lines read as the builder writes them, a broken one left out', () => {
  assert.equal(lines.size, 2);
  assert.equal(lines.get('b').zh, '美聯準會維持利率不變');
});

test('a world story in Chinese on a Chinese phone, a Taiwan story in English on an English one', () => {
  const tw = { id: 'a', region: 'tw', title: '總預算三讀' };
  const intl = { id: 'b', region: 'intl', title: 'Fed holds rates' };
  assert.deepEqual(titleOf(tw, lines.get('a')), { text: '總預算三讀', ai: false, lang: 'zh-Hant' });
  assert.deepEqual(titleOf(tw, lines.get('a'), true), { text: 'Legislature passes the budget', ai: true, lang: 'en' });
  assert.deepEqual(titleOf(intl, lines.get('b')), { text: '美聯準會維持利率不變', ai: true, lang: 'zh-Hant' });
  assert.deepEqual(titleOf(intl, undefined), { text: 'Fed holds rates', ai: false, lang: 'en' });
});

test('the one line only on Chinese phones, never the headline again', () => {
  const tw = { id: 'a', region: 'tw', title: '總預算三讀' };
  assert.equal(lineOf(tw, lines.get('a')), '立法院三讀通過預算案，總額 3 兆元。');
  assert.equal(lineOf(tw, lines.get('a'), true), '');
  assert.equal(lineOf({ ...tw, title: '立法院三讀通過預算案，總額 3 兆元' }, lines.get('a')), '');
});
