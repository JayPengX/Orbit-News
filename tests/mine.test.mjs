import { test } from 'node:test';
import assert from 'node:assert/strict';
import { interestsOf } from '../public/lib/mine.mjs';
import { yourStories } from '../public/lib/follows.mjs';

// (你關心的 now heads 頭條 with News' own follows too: lib/follows.mjs yourStories.)
const mineOf = (page, interests, most = 5) => yourStories(page, { interests, most });

const holds = [{ code: '2330', symbol: '2330.TW', name: '台積電', en: 'TSMC', market: 'tw' }, { code: 'AAPL', symbol: 'AAPL', name: 'Apple', en: 'Apple', market: '' }];
const follows = [
  { league: 'nba', id: '13', name: 'Los Angeles Lakers', zh: '洛杉磯湖人', short: '湖人' },
  { league: 'eng.1', id: '359', name: 'Arsenal', zh: '兵工廠', short: '兵工廠' },
  { league: 'mlb', id: '1', name: 'Shohei Ohtani', athlete: true }
];
let imp = 100;
const story = (id, title, items = []) => ({ id, title, imp: imp--, items: items.map(t => ['cna', t, 'https://x']) });

test('what you hold and follow, each by its names; short words never', () => {
  const all = interestsOf(holds, follows);
  assert.deepEqual(all.map(i => [i.label, i.kind]), [['台積電', 'hold'], ['Apple', 'hold'], ['湖人', 'follow'], ['兵工廠', 'follow'], ['Shohei Ohtani', 'follow']]);
  assert.equal(interestsOf([{ name: 'AB', en: 'AB', code: '1', market: 'tw' }]).length, 0);
});

test('stories found by any outlet’s headline, Taiwan’s first, at most a few', () => {
  const page = {
    tw: [story('a', '立法院三讀'), story('b', '外資賣超', ['台積電股價收跌 2%']), story('c', '(2330) 法說會'), story('d', '物價上漲23300元')],
    intl: [story('e', 'Lakers beat Celtics'), story('f', 'Ohtani signs'), story('g', 'Pineapple prices rise')]
  };
  const got = mineOf(page, interestsOf(holds, follows));
  assert.deepEqual(got.map(x => [x.story.id, x.why.label]), [['b', '台積電'], ['c', '台積電'], ['e', '湖人'], ['f', 'Shohei Ohtani']]);
  assert.equal(mineOf(page, interestsOf(holds, follows), 2).length, 2);
  assert.deepEqual(mineOf(page, []), []);
  const busy = { tw: [1, 2, 3, 4].map(n => story(`t${n}`, `台積電 ${n}`)), intl: [story('l', 'Lakers win')] };
  assert.deepEqual(mineOf(busy, interestsOf(holds, follows)).map(x => x.story.id), ['t1', 't2', 'l']);
});
