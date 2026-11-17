import { test } from 'node:test';
import assert from 'node:assert/strict';
import { interestsOf } from '../public/lib/mine.mjs';
import { yourStories } from '../public/lib/follows.mjs';

// (你關心的 now heads 頭條 with News' own follows too: lib/follows.mjs yourStories.)
const mineOf = (page, interests, most = 5) => yourStories(page, { interests, most });

const holds = [{ code: '2330', symbol: '2330.TW', name: '台積電', en: 'TSMC', market: 'tw' }, { code: 'AAPL', symbol: 'AAPL', name: 'Apple', en: 'Apple', market: '' }];
const follows = [
  { league: 'nba', id: '13', name: 'Los Angeles Lakers', zh: '洛杉磯湖人', short: '湖人' },
  { league: 'epl', id: '359', name: 'Arsenal', zh: '兵工廠', short: '兵工廠' },
  { league: 'mlb', id: '1', name: 'Shohei Ohtani', athlete: true }
];
let imp = 100;
const story = (id, title, items = [], topics = []) => ({ id, title, imp: imp--, topics, items: items.map(t => ['cna', t, 'https://x']) });
const game = (id, title, items = []) => story(id, title, items, ['sport']);

test('what you hold and follow, each by its names; short words never', () => {
  const all = interestsOf(holds, follows);
  assert.deepEqual(all.map(i => [i.label, i.kind]), [['台積電', 'hold'], ['Apple', 'hold'], ['湖人', 'follow'], ['兵工廠', 'follow'], ['Shohei Ohtani', 'follow']]);
  assert.equal(interestsOf([{ name: 'AB', en: 'AB', code: '1', market: 'tw' }]).length, 0);
});

test('stories found by any outlet’s headline, Taiwan’s first, at most a few', () => {
  const page = {
    tw: [story('a', '立法院三讀'), story('b', '外資賣超', ['台積電股價收跌 2%']), story('c', '(2330) 法說會'), story('d', '物價上漲23300元')],
    intl: [game('e', 'Lakers beat Celtics'), game('f', 'Ohtani signs'), story('g', 'Pineapple prices rise')]
  };
  const got = mineOf(page, interestsOf(holds, follows));
  assert.deepEqual(got.map(x => [x.story.id, x.why.label]), [['b', '台積電'], ['c', '台積電'], ['e', '湖人'], ['f', 'Shohei Ohtani']]);
  assert.equal(mineOf(page, interestsOf(holds, follows), 2).length, 2);
  assert.deepEqual(mineOf(page, []), []);
  const busy = { tw: [1, 2, 3, 4].map(n => story(`t${n}`, `台積電 ${n}`)), intl: [game('l', 'Lakers win')] };
  assert.deepEqual(mineOf(busy, interestsOf(holds, follows)).map(x => x.story.id), ['t1', 't2', 'l']);
});

test('a story is about a holding by its title or enough of its headlines, never one in passing (Jay 11-15)', () => {
  const heads = Array.from({ length: 40 }, (_, i) => `黃仁勳辭輝達執行長 ${i}`);
  const huang = story('h', 'Why Jensen Huang’s Nvidia scandal has everyone quoting Warren Buffett', [...heads, '黃仁勳辭輝達執行長、台積電入股 Anthropic 本周大事回顧']);
  assert.deepEqual(mineOf({ tw: [huang], intl: [] }, interestsOf(holds, [])), []);
  const tsmc = story('t', '輝達換帥 供應鏈震盪', ['台積電股價跌', '台積電法說會', '供應鏈憂心']);
  assert.deepEqual(mineOf({ tw: [tsmc], intl: [] }, interestsOf(holds, [])).map(x => x.story.id), ['t']);
});

test('a team or player followed in Sports is about a game of its league only (11-17: the Nationals tagged every 國民黨 story)', () => {
  const ones = [
    { league: 'mlb', id: '20', name: 'Washington Nationals', zh: '華盛頓國民', short: '國民' },
    { league: 'nba', id: '23', name: 'Sacramento Kings', zh: '沙加緬度國王', short: '國王' },
    { league: 'mlb', id: '9', name: 'Aaron Judge', athlete: true }
  ];
  const page = {
    tw: [
      story('kmt', '國民黨團提案 藍綠交鋒', ['國民黨：與黨中央無關', '國民黨主席回應'], ['pol']),
      game('tpbl', 'TPBL克雷格大三元 國王作客輕取雲豹', ['新北國王贏球', '國王豪取三連勝']),
      game('nats', '國民隊簽下新王牌', ['國民補強先發', 'MLB國民開出合約'])
    ],
    intl: [story('court', 'Judge blocks the tariffs', ['Judge rules against White House'], ['pol']), game('nyy', 'Aaron Judge wins MVP', ['Yankees star Judge named AL MVP'])]
  };
  assert.deepEqual(mineOf(page, interestsOf([], ones)).map(x => [x.story.id, x.why.label]), [['nats', '國民'], ['nyy', 'Aaron Judge']]);
  // (A club's cup games are its own.)
  const cup = { tw: [], intl: [game('ucl', 'Arsenal beat Bayern in the Champions League', ['Champions League: Arsenal 3-1 Bayern'])] };
  assert.deepEqual(mineOf(cup, interestsOf([], follows)).map(x => x.story.id), ['ucl']);
});
