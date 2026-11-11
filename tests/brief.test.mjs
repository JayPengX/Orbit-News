import { test } from 'node:test';
import assert from 'node:assert/strict';
import { briefOf, dayBrief, keysOf, twHour } from '../public/lib/brief.mjs';

const story = (id, region, topic) => ({ id, region, topics: [topic], title: id });
const page = {
  tw: [story('t1', 'tw', 'politics'), story('t2', 'tw', 'politics'), story('t3', 'tw', 'politics'), story('t4', 'tw', 'society'), story('t5', 'tw', 'money'), story('t6', 'tw', 'sports')],
  intl: [story('i1', 'intl', 'world'), story('i2', 'intl', 'world'), story('i3', 'intl', 'tech')]
};
// 08:00 and 06:00 in Taiwan on 2026-11-11.
const AT8 = Date.UTC(2026, 10, 11, 0);
const AT6 = Date.UTC(2026, 10, 10, 22);

test('keys: topics and region', () => {
  assert.deepEqual(keysOf(story('a', 'tw', 'politics')), ['t:politics', 'r:tw']);
  assert.equal(twHour(AT8), 8);
});

test('five, past what the top shows, two a topic, two of the world', () => {
  const out = briefOf(page, { skip: new Set(['t1']) }).map(x => x.story.id);
  assert.equal(out.length, 5);
  assert.ok(!out.includes('t1'));
  assert.ok(out.filter(id => id.startsWith('i')).length <= 2);
  assert.ok(out.some(id => id.startsWith('i')));
});

test('what the person opens lifts its topic; what they hold comes first', () => {
  const lift = item => (item.keys.includes('t:sports') ? 2.5 : 1);
  assert.equal(briefOf(page, { lift })[0].story.id, 't6');
  const why = { label: '台積電', kind: 'hold' };
  const out = briefOf(page, { mine: [{ story: page.tw[4], why }] });
  assert.equal(out[0].story.id, 't5');
  assert.equal(out[0].why, why);
});

test('ready at 7, kept all day, a story gone filled in', () => {
  assert.equal(dayBrief(page, null, AT6), null);
  const first = dayBrief(page, null, AT8);
  assert.equal(first.day, '2026-11-11');
  const kept = { day: first.day, ids: ['i3', 't6', 'gone'] };
  const again = dayBrief(page, kept, AT8 + 3_600_000);
  assert.deepEqual(again.ids.slice(0, 2), ['i3', 't6']);
  assert.equal(again.ids.length, 5);
  // (Another day: picked again.)
  assert.notEqual(dayBrief(page, kept, AT8 + 86_400_000).day, first.day);
});
