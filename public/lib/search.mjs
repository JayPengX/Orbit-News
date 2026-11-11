// 搜尋 (Jay 11-11: "a search bar, now it's more passive news watching"):
// every story the phone holds (the 3 days' page, the older ones kept once
// read), found by any of its words: its headline and the AI's in the other
// language, the outlet's summary, every outlet's own headline, the outlets'
// names, its topics and the parties it names. All on the phone: nothing sent,
// nothing paid for, an answer as each letter is typed.
//
// Matching: the text and the query folded alike (full-width to half, case,
// 臺 → 台, punctuation to spaces); every word of the query must be found in
// the story somewhere; a word found in the headline counts most, then the
// summary, then the outlets' headlines (more of them, more); the story's
// importance and freshness settle near ties.

import { REGIONS } from './stories.mjs';

export const fold = s =>
  String(s ?? '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/臺/g, '台')
    .replace(/[\s\p{P}\p{S}]+/gu, ' ')
    .trim();

// The query's words; Chinese typed with no spaces is one word (found as written).
export const wordsOf = q => [...new Set(fold(q).split(' ').filter(Boolean))];

// 問 Orbit's question (the Pass sheet's box, kit ask-orbit.mjs: #ask=<words>)
// as a search: the asking taken off (「颱風的新聞」 颱風); '' when nothing's
// left (「今天有什麼新聞」: 頭條 as it is).
const ASK_FILL = /今天|今日|最新|最近|現在|有什麼|有沒有|有關|關於|相關|請問|的|新聞|頭條|報導|消息|嗎|呢|\b(?:what'?s|any|latest|today'?s?|news|headlines?|about|on|the|in)\b/gi;
export const askQuery = text => wordsOf(String(text || '').replace(ASK_FILL, ' ')).join(' ');

// One story's text by weight, folded once.
const FIELDS = { title: 6, sum: 3, heads: 2, names: 2 };
function indexOf(story, { lines, outletName, topicName }) {
  const l = lines?.get?.(story.id);
  const heads = (story.items || []).map(it => fold(it[1]));
  const world = (story.tw?.items || []).map(it => fold(it[1]));
  const outlets = [...new Set((story.items || []).map(it => it[0]))];
  return {
    title: fold([story.title, l?.zh, l?.en].filter(Boolean).join(' ')),
    sum: fold(story.sum),
    heads: [...heads, ...world],
    names: fold([...outlets.flatMap(o => outletName?.(o) || []), ...(story.topics || []).map(t => topicName?.(t, story.region) || ''), ...(story.parties || [])].join(' '))
  };
}

// The stories matching `q`, best first: [{ story, score, hit }] where `hit`
// is the outlet's headline [outlet, headline] that has the words when the
// headline shown doesn't (to say why it was found). `pages`: the page and
// the past (either may be null). `ctx`: { lines, outletName, topicName }
// (the names in the page's language), `now`.
export function findStories(pages, q, ctx = {}, { most = 200 } = {}) {
  const words = wordsOf(q);
  if (!words.length) return [];
  const now = ctx.now ?? Date.now();
  const seen = new Set();
  const out = [];
  for (const page of pages)
    for (const r of REGIONS)
      for (const story of page?.[r] || []) {
        if (seen.has(story.id)) continue;
        seen.add(story.id);
        // (`ctx.cache`, a WeakMap: each story folded once while its page lasts.)
        let ix = ctx.cache?.get(story);
        if (!ix) {
          ix = indexOf(story, ctx);
          ctx.cache?.set(story, ix);
        }
        let score = 0;
        let ok = true;
        for (const w of words) {
          const inTitle = ix.title.includes(w);
          const heads = ix.heads.filter(t => t.includes(w)).length;
          const best = inTitle ? FIELDS.title : ix.sum.includes(w) ? FIELDS.sum : heads ? FIELDS.heads : ix.names.includes(w) ? FIELDS.names : 0;
          if (!best) {
            ok = false;
            break;
          }
          score += best + Math.min(heads, 6) * 0.5;
        }
        if (!ok) continue;
        // (Importance and freshness: a near tie goes to the bigger, newer story.)
        const hours = Math.max(0, (now - (story.at || 0)) / 3_600_000);
        score += Math.min(story.imp || 0, 40) * 0.05 + 2 * Math.pow(0.5, hours / 48);
        const hit = words.every(w => ix.title.includes(w)) ? null : (story.items || []).find(it => words.every(w => fold(it[1]).includes(w))) || (story.items || []).find(it => words.some(w => fold(it[1]).includes(w))) || null;
        out.push({ story, score, hit: hit ? [hit[0], hit[1]] : null });
      }
  return out.sort((a, b) => b.score - a.score || (b.story.at || 0) - (a.story.at || 0)).slice(0, most);
}

// The outlets whose name (either language) has the query: ids, at most `most`.
export function findOutlets(outlets, q, most = 4) {
  const w = fold(q);
  if (!w) return [];
  return Object.entries(outlets || {})
    .filter(([id, o]) => [o?.zh, o?.en, id].some(n => fold(n).replace(/ /g, '').includes(w.replace(/ /g, ''))))
    .map(([id]) => id)
    .slice(0, most);
}

// The text cut into pieces, those with a query word marked: [[text, marked]].
// (Folding keeps a character a character for Chinese and Latin text, so the
// places found in the folded text are the places in the shown one.)
export function marked(text, q) {
  const words = wordsOf(q);
  const s = String(text ?? '');
  if (!words.length || !s) return [[s, false]];
  const low = s.normalize('NFKC').toLowerCase().replace(/臺/g, '台');
  if (low.length !== s.length) return [[s, false]];
  const on = new Array(s.length).fill(false);
  for (const w of words)
    for (let i = low.indexOf(w); i >= 0 && w; i = low.indexOf(w, i + 1)) for (let k = i; k < i + w.length; k++) on[k] = true;
  const out = [];
  for (let i = 0; i < s.length; i++) {
    if (out.length && out.at(-1)[1] === on[i]) out.at(-1)[0] += s[i];
    else out.push([s[i], on[i]]);
  }
  return out;
}

// The searches kept on this phone, newest first, each once (8 at most).
export function keepFind(list, q, most = 8) {
  const t = String(q ?? '').trim();
  if (!t) return list || [];
  return [t, ...(list || []).filter(x => fold(x) !== fold(t))].slice(0, most);
}
