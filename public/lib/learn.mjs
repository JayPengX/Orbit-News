// 新聞學單字 (the plan's family links, Jay 11-10): the words this person is
// learning in Orbit Words, read from the family's notebook on this phone
// (kit family.mjs vocab.learning: [{ w, zh, f forms }]), marked where a
// world story's English headlines use them, and listed under the story, each
// opening its card in Words. No AI, nothing sent.

const esc = w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// A word's usual forms, where Words didn't give them (study → studies, studied, studying).
function formsOf(w) {
  if (/\s/.test(w)) return [w];
  const out = [w, `${w}s`, `${w}es`, `${w}ed`, `${w}d`, `${w}ing`];
  if (/[^aeiou]y$/.test(w)) out.push(`${w.slice(0, -1)}ies`, `${w.slice(0, -1)}ied`);
  if (/[^aeiou]e$/.test(w)) out.push(`${w.slice(0, -1)}ing`);
  if (/[aeiou][bdgmnpt]$/.test(w) && w.length <= 6) out.push(`${w}${w.at(-1)}ed`, `${w}${w.at(-1)}ing`);
  return out;
}

// What to look for: { re, byForm: form → { w, zh } }, or null with no words.
// (Words of 3 letters or more; a, an, it are no lesson in a headline.)
export function learnSet(fact) {
  const list = Array.isArray(fact?.words) ? fact.words : [];
  const byForm = new Map();
  for (const x of list) {
    const w = typeof x?.w === 'string' ? x.w.trim() : '';
    if (w.length < 3 || !/^[a-z][a-z' -]*$/i.test(w)) continue;
    const word = { w, zh: typeof x.zh === 'string' ? x.zh : '' };
    const given = Array.isArray(x.f) ? x.f.filter(f => typeof f === 'string' && f.length >= 3) : [];
    for (const f of [...formsOf(w), ...given]) if (!byForm.has(f.toLowerCase())) byForm.set(f.toLowerCase(), word);
  }
  if (!byForm.size) return null;
  const forms = [...byForm.keys()].sort((a, b) => b.length - a.length).map(esc);
  return { re: new RegExp(`(?<![A-Za-z'’-])(${forms.join('|')})(?![A-Za-z'’-])`, 'gi'), byForm };
}

// A line cut where it uses a word: [text, { t, w, zh }, text, …].
export function learnParts(text, set) {
  const s = String(text || '');
  if (!set || !s) return [s];
  const out = [];
  let at = 0;
  for (const m of s.matchAll(set.re)) {
    if (m.index > at) out.push(s.slice(at, m.index));
    out.push({ t: m[0], ...set.byForm.get(m[0].toLowerCase()) });
    at = m.index + m[0].length;
  }
  if (at < s.length) out.push(s.slice(at));
  return out;
}

// The words a story's lines use, the most used first: [{ w, zh, n }].
export function wordsIn(lines, set, most = 8) {
  if (!set) return [];
  const n = new Map();
  for (const line of lines) for (const p of learnParts(line, set)) if (typeof p === 'object') n.set(p.w, { w: p.w, zh: p.zh, n: (n.get(p.w)?.n || 0) + 1 });
  return [...n.values()].sort((a, b) => b.n - a.n).slice(0, most);
}
