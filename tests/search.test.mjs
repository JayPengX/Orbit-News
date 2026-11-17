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
const ctx = { now: T, outletName: id => ({ ltn: '自由時報', udn: '聯合報', cna: '中央社', pts: '公視', nyt: 'New York Times' })[id] || id, topicName: () => '' };

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

test('every word must be found; the summary and 臺/台 count', () => {
  assert.deepEqual(findStories([page], '賴清德 花費', ctx).map(f => f.story.id), ['a']);
  assert.deepEqual(findStories([page], '臺積電 5868', ctx).map(f => f.story.id), ['b']);
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

test('an English reader’s search finds the words of the title they see (the translation), and again once it has come', () => {
  const tw = { id: 't1', region: 'tw', title: '立法院三讀通過明年度總預算', sum: '', items: [['ltn', '立法院三讀通過明年度總預算', 'https://x.tw/1', 1]], at: 1, imp: 5 };
  const page = { tw: [tw], intl: [] };
  const tr = new Map();
  const cache = new WeakMap();
  const ctx = { cache, tr: t => tr.get(t) };
  assert.deepEqual(findStories([page], 'budget', ctx), []);
  tr.set(tw.title, 'Legislative Yuan passes next year’s budget');
  assert.deepEqual(findStories([page], 'budget', ctx).map(f => f.story.id), ['t1']);
  assert.deepEqual(findStories([page], 'Legislative Yuan', ctx).map(f => f.story.id), ['t1']);
  // The outlets' own words still found.
  assert.deepEqual(findStories([page], '總預算', ctx).map(f => f.story.id), ['t1']);
});

// Latin words inside other words (proven 11-18 on the day's 497 stories:
// 「AI」 found Ukraine, said and again first, 200 of them; 「UN」 171; 「K-pop」
// the Pope; 「F-16」 a fire on the 16th; a followed AI lifted them all).
test('a Latin word is found where a word starts, a short one only whole; Chinese anywhere', () => {
  const w = (id, title) => s(id, title, { region: 'intl' });
  const pg = {
    tw: [s('tw', 'AI股全面重挫 台積電ADR跌逾5%')],
    intl: [w('ukr', 'Ukraine says Russia struck again'), w('ai', 'US moves to block AI chips'), w('pope', 'Pope wraps up Peru visit'), w('kpop', 'BTS tops K-pop awards'), w('fire', 'Fire kills 11 on the 16th'), w('jet', 'Ukraine gets more F-16 jets'), w('tar', 'Tariffs rise again'), w('un', 'UN agency presses on flights'), w('fun', 'A fun run in Taipei')]
  };
  const ids = q => findStories([pg], q, ctx).map(f => f.story.id).sort();
  assert.deepEqual(ids('AI'), ['ai', 'tw']);
  assert.deepEqual(ids('K-pop'), ['kpop']);
  assert.deepEqual(ids('F-16'), ['jet']);
  assert.deepEqual(ids('UN'), ['un']);
  // (A longer word runs on: tariff finds tariffs; Chinese as ever.)
  assert.deepEqual(ids('tariff'), ['tar']);
  assert.deepEqual(ids('台積'), ['tw']);
  assert.deepEqual(marked('Ukraine and AI said', 'ai'), [['Ukraine and ', false], ['AI', true], [' said', false]]);
});
