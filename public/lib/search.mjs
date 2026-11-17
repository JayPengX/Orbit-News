// 搜尋 (Jay 11-11: "a search bar, now it's more passive news watching"):
// every story the phone holds (the 3 days' page, the older ones kept once
// read), found by any of its words: its headline, the outlet's summary,
// every outlet's own headline, the outlets' names, its topics and the
// parties it names. All on the phone: nothing sent, nothing paid for, an
// answer as each letter is typed.
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

// Where a word is found. Chinese anywhere (it has no spaces); a word of
// Latin letters or digits only where a word starts, and one of three or
// fewer where it ends too (AI, US, UN, 16). Anywhere, 「AI」 found Ukraine,
// said and again first (200 of the day's 497 stories), 「UN」 171, 「K-pop」
// the Pope, 「F-16」 a fire on the 16th; a followed AI lifted them all.
// Longer ones run on (tariff finds tariffs, Trump Trump's). → (text) => index or -1.
const LATIN = /^[a-z0-9]+$/;
export function finder(w) {
  if (!LATIN.test(w)) return (text, from = 0) => text.indexOf(w, from);
  const re = new RegExp(`(?<![a-z0-9])${w}${w.length <= 3 ? '(?![a-z0-9])' : ''}`, 'g');
  return (text, from = 0) => {
    re.lastIndex = from;
    return re.exec(text)?.index ?? -1;
  };
}
const finds = w => {
  const at = finder(w);
  return text => at(text) >= 0;
};

// One story's text by weight, folded once.
const FIELDS = { title: 6, sum: 3, heads: 2, names: 2 };
// (`tr`: the title's and summary's translations the phone has, as the reader
// sees them: an English reader's "budget" never found the Taiwan story whose
// row says it, searched in the outlets' Chinese alone.)
const shownOf = (story, tr) => (tr ? [tr(story.title) || '', story.sum ? tr(story.sum) || '' : ''] : ['', '']);
function indexOf(story, { outletName, topicName, tr }) {
  const heads = (story.items || []).map(it => fold(it[1]));
  const world = (story.tw?.items || []).map(it => fold(it[1]));
  const outlets = [...new Set((story.items || []).map(it => it[0]))];
  const [title, sum] = shownOf(story, tr);
  return {
    shown: `${title}\n${sum}`,
    title: fold(`${story.title} ${title}`),
    sum: fold(`${story.sum ?? ''} ${sum}`),
    heads: [...heads, ...world],
    names: fold([...outlets.flatMap(o => outletName?.(o) || []), ...(story.topics || []).map(t => topicName?.(t, story.region) || ''), ...(story.parties || [])].join(' '))
  };
}

// The stories matching `q`, best first: [{ story, score, hit }] where `hit`
// is the outlet's headline [outlet, headline] that has the words when the
// headline shown doesn't (to say why it was found). `pages`: the page and
// the past (either may be null). `ctx`: { outletName, topicName }
// (the names in the page's language), `now`. `strong`: a word counts only
// in the headline, the summary or two outlets' headlines (a followed name,
// lib/follows.mjs: never one outlet's passing mention, an outlet's or a
// topic's name).
export function findStories(pages, q, ctx = {}, { most = 200, strong = false } = {}) {
  const words = wordsOf(q);
  if (!words.length) return [];
  const has = new Map(words.map(w => [w, finds(w)]));
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
        // (Folded again once a translation has come.)
        if (!ix || (ctx.tr && ix.shown !== shownOf(story, ctx.tr).join('\n'))) {
          ix = indexOf(story, ctx);
          ctx.cache?.set(story, ix);
        }
        let score = 0;
        let ok = true;
        for (const w of words) {
          const found = has.get(w);
          const inTitle = found(ix.title);
          const heads = ix.heads.filter(found).length;
          const best = inTitle ? FIELDS.title : found(ix.sum) ? FIELDS.sum : heads >= (strong ? 2 : 1) ? FIELDS.heads : !strong && found(ix.names) ? FIELDS.names : 0;
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
        const hit = words.every(w => has.get(w)(ix.title)) ? null : (story.items || []).find(it => words.every(w => has.get(w)(fold(it[1])))) || (story.items || []).find(it => words.some(w => has.get(w)(fold(it[1])))) || null;
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
  for (const w of words) {
    const at = finder(w);
    for (let i = at(low); i >= 0 && w; i = at(low, i + 1)) for (let k = i; k < i + w.length; k++) on[k] = true;
  }
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
