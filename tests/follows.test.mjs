// 你關心的, read marks, 你可能錯過, 相關新聞, 來龍去脈 (Jay 11-13: News personal like Sports, reading kept in the app).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyLog, markRead, readState, setFollow, followsOf, following, mergeLogs, decodeLog, encodeLog, trimLog, addRead } from '../public/lib/reading.mjs';
import { followFinds, yourStories, missedOf } from '../public/lib/follows.mjs';
import { relatedOf, timelineOf } from '../public/lib/stories.mjs';
import { cleanBriefs } from '../public/lib/briefs.mjs';

const T = Date.parse('2026-11-12T12:00:00Z');
const it = (o, t, at = T) => [o, t, `https://x/${o}/${encodeURIComponent(t)}`, at];
const story = (id, title, x = {}) => ({ id, title, region: 'tw', topics: ['pol'], n: 5, m: 8, at: T, imp: 10, items: [it('cna', title)], sides: { g: 2, c: 2, b: 1 }, ...x });

test('a story read is read until it has big news since: half again the headlines, a third more outlets, or breaking hours later', () => {
  const log = emptyLog();
  const s = story('a', '立法院三讀', { m: 10, n: 6 });
  assert.equal(readState(log, s), '');
  markRead(log, s, T);
  assert.equal(readState(log, s, { now: T }), 'read');
  assert.equal(readState(log, { ...s, m: 13, at: T + 60_000 }), 'read', 'three more headlines is no news');
  assert.equal(readState(log, { ...s, m: 15, at: T + 60_000 }), 'new');
  assert.equal(readState(log, { ...s, n: 9, at: T + 60_000 }), 'new');
  assert.equal(readState(log, { ...s, m: 15 }), 'read', 'nothing heard after it was read');
  assert.equal(readState(log, { ...s, at: T + 60_000 }, { now: T + 3 * 3_600_000, live: true }), 'new');
  assert.equal(readState(log, { ...s, at: T + 60_000 }, { now: T + 3_600_000, live: true }), 'read');
});

test('follows and read marks ride the Pass: merged by the later word, a let-go stays let go', () => {
  const a = emptyLog();
  const b = emptyLog();
  setFollow(a, 'w:黃仁勳', true, T);
  setFollow(b, 'w:黃仁勳', true, T - 60_000);
  setFollow(a, 't:eco', true, T - 120_000);
  setFollow(b, 't:eco', false, T);
  markRead(a, story('s1', 'x'), T - 60_000);
  markRead(b, story('s1', 'x', { m: 20 }), T);
  const m = mergeLogs(a, b);
  assert.ok(following(m, 'w:黃仁勳'));
  assert.ok(!following(m, 't:eco'), 'unfollowed on the other phone, later');
  assert.deepEqual(m.read.s1, [Math.floor(T / 60_000), 20, 5]);
  assert.deepEqual(followsOf(m).map(f => f.key), ['w:黃仁勳']);
  assert.deepEqual(decodeLog(encodeLog(m)), m);
  // (Junk keys and outlets that aren't left out; an older copy with days only still reads.)
  assert.deepEqual(decodeLog(JSON.stringify({ v: 1, days: {}, follow: { 'o:nobody': 1, 'x:y': 2, 't:eco': 'a' } })).follow, {});
  assert.deepEqual(decodeLog(JSON.stringify({ v: 1, days: { '2026-11-10': { ltn: 1 } } })), addRead(emptyLog(), 'ltn', '2026-11-10'));
  // (A month of read marks kept; a let-go forgotten after 90 days.)
  const old = emptyLog();
  markRead(old, story('o', 'x'), T - 40 * 86_400_000);
  markRead(old, story('n', 'x'), T);
  setFollow(old, 'w:舊', false, T - 100 * 86_400_000);
  trimLog(old, '2026-11-12');
  assert.deepEqual(Object.keys(old.read), ['n']);
  assert.deepEqual(old.follow, {});
});

const page = {
  built: T,
  tw: [
    story('big', '颱風來襲 停班停課', { imp: 30, topics: ['life'], by: 'udn', n: 20, items: [it('udn', '颱風來襲'), it('cna', '颱風停班停課')] }),
    story('nv1', '黃仁勳辭職 輝達股價重挫', { imp: 25, topics: ['tech'] }),
    story('nv2', '輝達董事會 黃仁勳去留', { imp: 20, topics: ['tech'] }),
    story('nv3', '黃仁勳接班人', { imp: 15, topics: ['tech'] }),
    story('eco1', '央行升息半碼', { imp: 18, topics: ['eco'] }),
    story('scoop', '中央社獨家', { imp: 5, n: 3, by: 'cna', items: [it('cna', '中央社獨家'), it('udn', '獨家')] }),
    story('pass', '立法院 某議題', { imp: 12, items: [it('cna', '立法院 某議題'), it('udn', '黃仁勳 一句帶過')] })
  ],
  intl: []
};

test('你關心的: what’s followed, two a thing, the specific first, an outlet only its own', () => {
  const log = emptyLog();
  setFollow(log, 'w:黃仁勳', true, T);
  setFollow(log, 't:eco', true, T);
  setFollow(log, 'o:cna', true, T);
  const finds = followFinds(log, page, {});
  const got = yourStories(page, { finds, log, now: T });
  assert.deepEqual(got.map(x => [x.story.id, x.why.label]), [['nv1', '黃仁勳'], ['nv2', '黃仁勳'], ['eco1', 'eco'], ['scoop', 'cna']]);
  // (A story read sinks below the others; nothing followed, nothing.)
  markRead(log, page.tw[1], T);
  assert.equal(yourStories(page, { finds, log, now: T })[0].story.id, 'nv2');
  assert.deepEqual(yourStories(page, { log: emptyLog() }), []);
});

test('你可能錯過: what the side mostly read leaves out, then what the other side carries widely', () => {
  const log = emptyLog();
  for (let i = 0; i < 8; i++) addRead(log, 'ltn', '2026-11-12');
  const p = {
    tw: [
      story('even', '各邊都報', { imp: 30 }),
      story('wide', '藍營媒體大篇幅', { imp: 20, sides: { g: 1, c: 2, b: 5 } }),
      story('blind', '綠營沒報', { imp: 10, blind: 'g', sides: { g: 0, c: 1, b: 3 } })
    ],
    intl: []
  };
  const m = missedOf(p, log, '2026-11-12', { now: T });
  assert.equal(m.lean, 'g');
  assert.deepEqual(m.stories.map(s => s.id), ['blind', 'wide']);
  assert.equal(missedOf(p, emptyLog(), '2026-11-12'), null, 'too little read to say');
});

test('相關新聞 by shared rare words; 來龍去脈 a line a turn, the first report first', () => {
  const H = 3_600_000;
  const a = story('a', '寶林茶室案一審宣判 負責人判刑', { items: [it('cna', '寶林茶室案一審宣判', T), it('udn', '寶林茶室 負責人判1年10月', T + 5 * H), it('ltn', '寶林茶室案 市府盼上訴', T + 8 * H), it('tvbs', '寶林茶室案 倖存者：判太輕', T + 9 * H)] });
  // (A day's worth of other stories, as a page has: a word's rareness is counted among them.)
  const others = ['颱風來襲 停班停課', '立法院三讀電業法', '台股收漲百點', '中職總冠軍賽', '高鐵班次異動', '央行理監事會', '流感疫苗開打', '國防預算審查', '北市長選戰民調', '能源政策辯論', '科技大廠財報', '司法院人事案'].map((t, i) => story(`o${i}`, t));
  const p = { tw: [a, story('b', '寶林茶室案判決 蔣萬安盼重判'), ...others], intl: [] };
  assert.deepEqual(relatedOf(a, [p]).map(x => x.story.id), ['b']);
  const turns = timelineOf(a);
  assert.equal(turns[0].title, '寶林茶室案一審宣判');
  assert.ok(turns.length >= 3 && turns.at(-1).at > turns[0].at);
  assert.deepEqual(timelineOf(story('one', 'x')), [], 'a story that never moved on has none');
});

test('重點整理 as read: two to four points, each in both languages', () => {
  const b = cleanBriefs({ briefs: { a: { points: [{ zh: '一', en: 'one' }, { zh: '二', en: 'two' }, { zh: '', en: 'x' }] }, b: { points: [{ zh: '一', en: 'one' }] }, c: 'junk' } });
  assert.deepEqual([...b.keys()], ['a']);
  assert.equal(b.get('a').points.length, 2);
  assert.equal(cleanBriefs(null).size, 0);
});
