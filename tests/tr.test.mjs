// One language at a time (lib/tr.mjs; Jay 11-13): an outlet's words in the
// reader's, asked for once, only what isn't in theirs already.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { foreign, askTr, askTitles, trPaint, trCache, BATCH } from '../public/lib/tr.mjs';
import { titleOf } from '../public/lib/lines.mjs';

test('which texts are the other language’s, and what a title shows', () => {
  assert.equal(foreign('Storm hits coast', false), true);
  assert.equal(foreign('颱風來襲', false), false);
  assert.equal(foreign('颱風來襲', true), true);
  assert.equal(foreign('', true), false);
  // (The AI's title first, the translation after it, the outlet's own till it comes.)
  const w = { region: 'intl', title: 'Storm hits coast' };
  assert.deepEqual(titleOf(w, { zh: 'AI 標題' }, false, '暴風襲擊海岸'), { text: 'AI 標題', ai: true, lang: 'zh-Hant' });
  assert.deepEqual(titleOf(w, null, false, '暴風襲擊海岸'), { text: '暴風襲擊海岸', ai: false, lang: 'zh-Hant' });
  assert.deepEqual(titleOf(w, null, false, null), { text: 'Storm hits coast', ai: false, lang: 'en' });
});

test('a list’s waiting titles go in one capped batch, each once; the answers are painted in place', async () => {
  const els = Array.from({ length: BATCH + 5 }, (_, i) => ({ dataset: { tr: `Headline ${i}`, trid: `s${i}` }, set textContent(v) { this.t = v; } }));
  const root = { querySelectorAll: sel => (sel === '[data-trid]' ? els.filter(e => e.dataset.trid) : els.filter(e => e.dataset.tr)) };
  const seen = [];
  const fetchImpl = async (u, init) => {
    const b = JSON.parse(init.body);
    seen.push(b);
    return new Response(JSON.stringify({ tr: Object.fromEntries(b.items.map(it => [it.texts[0], `譯 ${it.texts[0]}`])) }));
  };
  assert.equal(await askTitles(root, false, { fetchImpl }), BATCH);
  assert.equal(seen.length, 1);
  assert.equal(seen[0].items.length, BATCH);
  assert.deepEqual(seen[0].items[0], { id: 's0', texts: ['Headline 0'] });
  assert.equal(trPaint(root, false), BATCH);
  assert.equal(els[0].t, '譯 Headline 0');
  assert.equal(els[0].dataset.trid, undefined);
  // (The rest in the next batch; none asked twice.)
  assert.equal(await askTitles(root, false, { fetchImpl }), 5);
  assert.equal(await askTitles(root, false, { fetchImpl }), 0);
  assert.equal(seen.length, 2);
  // (Down: the original stays, asked again later.)
  const one = { querySelectorAll: () => [{ dataset: { tr: 'Later one', trid: 'z' } }] };
  assert.equal(await askTitles(one, false, { fetchImpl: async () => { throw new Error('offline'); } }), 0);
  assert.equal(await askTitles(one, false, { fetchImpl }), 1);
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
