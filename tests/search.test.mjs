// 搜尋 (lib/search.mjs): every story the phone holds found by any of its words.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fold, wordsOf, findStories, findOutlets, marked, keepFind } from '../public/lib/search.mjs';

const T = Date.parse('2026-11-11T03:00:00Z');
const H = 3_600_000;
const s = (id, title, extra = {}) => ({ id, title, at: T, imp: 10, items: [], topics: [], parties: [], region: 'tw', ...extra });
const page = {
  tw: [
    s('a', '賴清德出訪友邦 外交部說明行程', { items: [['ltn', '賴清德出訪友邦 外交部說明行程', 'u', T], ['udn', '總統出訪 藍營質疑花費', 'u', T]], imp: 20 }),
    s('b', '台積電營收創新高', { sum: '臺積電十月營收5868億元', items: [['cna', '台積電營收創新高', 'u', T]] }),
    s('c', '颱風動態 氣象署發布海警', { items: [['pts', '颱風逼近 賴清德視察防災', 'u', T]], at: T - 40 * H })
  ],
  intl: [s('d', 'Republicans elect Jim Jordan as House minority leader', { region: 'intl', items: [['nyt', 'Jordan wins vote', 'u', T]] })]
};
const past = { tw: [s('e', '舊聞：賴清德就職', { at: T - 300 * H, imp: 5 })], intl: [] };
const ctx = { now: T, lines: new Map([['d', { zh: '美眾院共和黨選喬丹任少數黨領袖', en: '' }]]), outletName: id => ({ ltn: '自由時報', udn: '聯合報', cna: '中央社', pts: '公視', nyt: 'New York Times' })[id] || id, topicName: () => '' };

test('folding: full width, case, 臺 and punctuation alike', () => {
  assert.equal(fold('ＴＳＭＣ　臺積電！'), 'tsmc 台積電');
  assert.deepEqual(wordsOf('  賴清德  出訪 賴清德 '), ['賴清德', '出訪']);
  assert.deepEqual(wordsOf('   '), []);
});

test('found by headline first, then by an outlet’s own headline; the past too', () => {
  const found = findStories([page, past], '賴清德', ctx);
  // (In the headline counts over in an outlet's headline, newer over older.)
  assert.deepEqual(found.map(f => f.story.id), ['a', 'e', 'c']);
  // (c's own headline lacks the name: the outlet's headline that has it says why.)
  assert.deepEqual(found[2].hit, ['pts', '颱風逼近 賴清德視察防災']);
  assert.equal(found[0].hit, null);
});

test('every word must be found; the summary, 臺/台 and the AI’s Chinese title count', () => {
  assert.deepEqual(findStories([page], '賴清德 花費', ctx).map(f => f.story.id), ['a']);
  assert.deepEqual(findStories([page], '臺積電 5868', ctx).map(f => f.story.id), ['b']);
  assert.deepEqual(findStories([page], '少數黨', ctx).map(f => f.story.id), ['d']);
  assert.deepEqual(findStories([page], 'jordan', ctx).map(f => f.story.id), ['d']);
  assert.deepEqual(findStories([page], '自由時報', ctx).map(f => f.story.id), ['a']);
  assert.deepEqual(findStories([page], '沒有這則', ctx), []);
  assert.deepEqual(findStories([page], '', ctx), []);
});

test('outlets by name in either language', () => {
  const outlets = { ltn: { zh: '自由時報', en: 'Liberty Times' }, nyt: { zh: '紐約時報', en: 'The New York Times' } };
  assert.deepEqual(findOutlets(outlets, '時報'), ['ltn', 'nyt']);
  assert.deepEqual(findOutlets(outlets, 'new york'), ['nyt']);
  assert.deepEqual(findOutlets(outlets, ''), []);
});

test('found words marked in the shown text', () => {
  assert.deepEqual(marked('臺積電營收', '台積電'), [['臺積電', true], ['營收', false]]);
  assert.deepEqual(marked('Jim Jordan wins', 'jordan'), [['Jim ', false], ['Jordan', true], [' wins', false]]);
  assert.deepEqual(marked('abc', ''), [['abc', false]]);
});

test('recent searches: newest first, each once, eight at most', () => {
  assert.deepEqual(keepFind(['颱風', '台積電'], '台積電'), ['台積電', '颱風']);
  assert.deepEqual(keepFind(['a'], '  '), ['a']);
  assert.equal(keepFind(Array.from({ length: 8 }, (_, i) => `x${i}`), 'new').length, 8);
});

test('問 Orbit’s question (#ask=) as a search: the asking taken off', async () => {
  const { askQuery } = await import('../public/lib/search.mjs');
  assert.equal(askQuery('颱風的新聞'), '颱風');
  assert.equal(askQuery('台積電最新消息'), '台積電');
  assert.equal(askQuery('今天有什麼新聞'), '');
  assert.equal(askQuery('latest news about Trump'), 'trump');
  assert.equal(askQuery(undefined), '');
});
