// 重點整理 and 各方怎麼說 made on a story's first open (lib/open-ai.mjs, Jay
// 11-14: "only spend it as I use it"): asked once a visit, a failure asked
// again next open, only for stories that would have one.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openAi, briefAsked, sidesAsked } from '../public/lib/open-ai.mjs';

test('asked once a story; a failure is asked again', async () => {
  const urls = [];
  let ok = false;
  const fetchImpl = async u => (urls.push(u), ok ? new Response(JSON.stringify({ out: { points: [1] } })) : new Response('{}', { status: 502 }));
  assert.equal(await openAi('news-brief', 'x1', { fetchImpl }), null);
  ok = true;
  assert.deepEqual(await openAi('news-brief', 'x1', { fetchImpl }), { points: [1] });
  await openAi('news-brief', 'x1', { fetchImpl });
  assert.equal(urls.length, 2, 'kept once it came');
  assert.match(urls[0], /\/ai\/open\?f=news-brief&id=x1$/);
});

test('only stories that would have one are asked', () => {
  assert.equal(briefAsked({ n: 2 }), false);
  assert.equal(briefAsked({ n: 3 }), true);
  assert.equal(sidesAsked({ topics: ['pol'], sides: { g: 1, b: 2 } }), true);
  assert.equal(sidesAsked({ topics: ['pol'], sides: { g: 3 } }), false, 'one end only');
  assert.equal(sidesAsked({ topics: ['biz'], sides: { g: 1, b: 1 } }), false, 'a topic sides don’t frame');
  assert.equal(sidesAsked({ region: 'intl', topics: ['world'], sides: { l: 1, r: 1 } }), true);
});
