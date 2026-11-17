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
  // (The translation once it has come, the outlet's own till then.)
  const w = { region: 'intl', title: 'Storm hits coast' };
  assert.deepEqual(titleOf(w, false, '暴風襲擊海岸'), { text: '暴風襲擊海岸', lang: 'zh-Hant' });
  assert.deepEqual(titleOf(w, false, null), { text: 'Storm hits coast', lang: 'en' });
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

test('a sheet’s texts past the Worker’s 60 are asked next time, never marked asked unsent (11-17)', async () => {
  const texts = Array.from({ length: 70 }, (_, i) => `Outlet headline number ${i}`);
  const sent = [];
  const fetchImpl = async (u, init) => {
    const b = JSON.parse(init.body);
    sent.push(b.texts.length);
    return new Response(JSON.stringify({ tr: {} }));
  };
  await askTr('big', texts, false, { fetchImpl });
  await askTr('big', texts, false, { fetchImpl });
  assert.deepEqual(sent, [60, 10]);
});

test('no answer (offline, a timeout: the signed ask gives { ok: false }, never throws) is asked again once back (11-17)', async () => {
  const none = async () => ({ ok: false });
  const sent = [];
  const fetchImpl = async (u, init) => {
    const b = JSON.parse(init.body);
    sent.push(b);
    return new Response(JSON.stringify({ tr: Object.fromEntries((b.texts || b.items.map(it => it.texts[0])).map(t => [t, `譯 ${t}`])) }));
  };
  assert.equal(await askTr('off', ['Offline headline'], false, { fetchImpl: none }), 0);
  assert.equal(await askTr('off', ['Offline headline'], false, { fetchImpl }), 1);
  const el = { dataset: { tr: 'Offline title', trid: 'o1' } };
  const root = { querySelectorAll: () => [el] };
  assert.equal(await askTitles(root, false, { fetchImpl: none }), 0);
  assert.equal(await askTitles(root, false, { fetchImpl }), 1);
  assert.equal(sent.length, 2);
});

test('a translation let go from the phone’s 400 is asked again when drawn (it stayed marked asked: back to the outlet’s words for the session)', async () => {
  const fetchImpl = async (u, init) => {
    const b = JSON.parse(init.body);
    const texts = b.texts || b.items.map(it => it.texts[0]);
    return new Response(JSON.stringify({ tr: Object.fromEntries(texts.map(t => [t, `譯 ${t}`])) }));
  };
  const el = { dataset: { tr: 'Early title of the session', trid: 'e1' } };
  assert.equal(await askTitles({ querySelectorAll: () => [el] }, false, { fetchImpl }), 1);
  for (let i = 0; i < 8; i++) await askTr(`big${i}`, Array.from({ length: 60 }, (_, j) => `Filler ${i} ${j}`), false, { fetchImpl });
  assert.equal(trCache.has('Early title of the session'), false);
  assert.equal(await askTitles({ querySelectorAll: () => [{ dataset: { tr: 'Early title of the session', trid: 'e1' } }] }, false, { fetchImpl }), 1);
});

test('titles waiting are painted after each ask, whatever it brought (a list drawn ahead stayed in the other language)', async () => {
  const { readFileSync } = await import('node:fs');
  const src = readFileSync(new URL('../public/lib/tr.mjs', import.meta.url), 'utf8');
  assert.match(src, /askTitles\(root, en\)\.then\(\(\) => trPaint\(root, en\)\)/);
});

test('world sports titles held back from a Chinese 頭條 are asked by their own stories (only titles drawn were asked: 運動 showed Taiwan’s alone)', async () => {
  const { askStoryTitles } = await import('../public/lib/tr.mjs');
  const sent = [];
  const fetchImpl = async (u, init) => {
    const b = JSON.parse(init.body);
    sent.push(b);
    return new Response(JSON.stringify({ tr: Object.fromEntries(b.items.map(it => [it.texts[0], `譯 ${it.texts[0]}`])) }));
  };
  const n = await askStoryTitles([{ id: 'ts1', title: 'Yankees win the pennant' }, { id: 'ts2', title: 'Arsenal top the table' }], false, { fetchImpl });
  assert.equal(n, 2);
  assert.deepEqual(sent[0].items, [{ id: 'ts1', texts: ['Yankees win the pennant'] }, { id: 'ts2', texts: ['Arsenal top the table'] }]);
  const { readFileSync } = await import('node:fs');
  const lists = readFileSync(new URL('../public/views/lists.mjs', import.meta.url), 'utf8');
  assert.match(lists, /if \(waiting\.length\) askStoryTitles\(waiting, en\)\.then\(n => n && hooks\.render\(\)\);/);
});
