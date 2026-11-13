// One language at a time (lib/tr.mjs; Jay 11-13): an outlet's words in the
// reader's, asked for once, only what isn't in theirs already.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cleanTr, foreign, askTr, trCache } from '../public/lib/tr.mjs';
import { titleOf } from '../public/lib/lines.mjs';

test('which texts are the other language’s, and what news/tr.json gives', () => {
  assert.equal(foreign('Storm hits coast', false), true);
  assert.equal(foreign('颱風來襲', false), false);
  assert.equal(foreign('颱風來襲', true), true);
  assert.equal(foreign('', true), false);
  const tr = cleanTr({ tr: { a: { zh: '暴風襲擊海岸', sum: '摘要', s: 'A storm.' }, b: 'junk', c: {} } });
  assert.deepEqual([...tr.keys()], ['a']);
  // (The AI's title first, the plain translation's after it, the outlet's own last.)
  const w = { region: 'intl', title: 'Storm hits coast' };
  assert.deepEqual(titleOf(w, { zh: 'AI 標題' }, false, tr.get('a')), { text: 'AI 標題', ai: true, lang: 'zh-Hant' });
  assert.deepEqual(titleOf(w, null, false, tr.get('a')), { text: '暴風襲擊海岸', ai: false, lang: 'zh-Hant' });
  assert.deepEqual(titleOf(w, null, true, tr.get('a')), { text: 'Storm hits coast', ai: false, lang: 'en' });
});

test('a story’s texts asked for once a session, only those in the other language', async () => {
  const seen = [];
  const fetchImpl = async (u, init) => {
    seen.push(JSON.parse(init.body));
    return new Response(JSON.stringify({ tr: { 'Big storm': '大暴風' } }));
  };
  assert.equal(await askTr('a', ['Big storm', '颱風來襲', 'Big storm'], false, { fetchImpl }), 1);
  assert.deepEqual(seen[0], { id: 'a', to: 'zh-TW', texts: ['Big storm'] });
  assert.equal(trCache.get('Big storm'), '大暴風');
  assert.equal(await askTr('a', ['Big storm'], false, { fetchImpl }), 0);
  assert.equal(seen.length, 1);
  // (A failed ask is asked again next time.)
  const down = async () => { throw new Error('offline'); };
  assert.equal(await askTr('b', ['Small storm'], false, { fetchImpl: down }), 0);
  await askTr('b', ['Small storm'], false, { fetchImpl });
  assert.equal(seen.length, 2);
});
