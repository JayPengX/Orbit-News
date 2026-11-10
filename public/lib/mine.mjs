// 你關心的先看 (the plan's family links, Jay 11-10): the stories about what
// the person holds in Orbit Securities and follows in Orbit Sports, read
// from the family's notebook on this phone (kit family.mjs: stock.holds,
// sports.follows; names only). Matched by name in a story's headlines:
// Chinese names as written, English ones as whole words, a Taiwan stock's
// code only standing alone. No AI, nothing sent.

const latin = w => /^[\x20-\x7e]+$/.test(w);
// A word long enough not to match by chance (湖人 yes, 人 no; Heat no, it's a word).
const usable = w => (latin(w) ? w.length >= 5 : w.length >= 2);
const US = new Set(['nba', 'wnba', 'mlb', 'nfl', 'nhl', 'ncaaf', 'ncaab']);
const esc = w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// What to look for: [{ label, kind: 'hold' | 'follow', re }].
export function interestsOf(holds = [], follows = []) {
  const out = [];
  const add = (label, kind, words) => {
    const zh = [...new Set(words.filter(w => w && !latin(w) && usable(w)))];
    const en = [...new Set(words.filter(w => w && latin(w) && usable(w) && !/^\d+$/.test(w)))];
    const codes = words.filter(w => /^\d{4,6}$/.test(w || ''));
    const parts = [...zh.map(esc), ...en.map(w => `\\b${esc(w)}\\b`), ...codes.map(c => `(?<!\\d)${c}(?!\\d)`)];
    if (label && parts.length) out.push({ label, kind, re: new RegExp(parts.join('|'), 'i') });
  };
  for (const s of Array.isArray(holds) ? holds : []) if (s?.name) add(s.name, 'hold', [s.name, s.en, s.market === 'tw' ? s.code : null]);
  // (An American team or a player by its last word too: Lakers, Ohtani; a club by its whole name.)
  const last = f => (f.athlete || US.has(f.league) ? String(f.name).trim().split(/\s+/).pop() : null);
  for (const f of Array.isArray(follows) ? follows : []) if (f?.name) add(f.short || f.zh || f.name, 'follow', [f.zh, f.short, f.name, last(f)]);
  return out;
}

// The headlines a story is known by: its own and each outlet's.
const textOf = story => [story.title, story.zh, ...(story.items || []).map(it => it[1]), ...(story.tw?.items || []).map(it => it[1])].filter(Boolean).join('\n');

// The stories about them, most important first (Taiwan's, then the world's,
// each in the page's order), each with what it's about: [{ story, why }].
// Two at most for any one of them, so one busy stock doesn't fill it.
export function mineOf(page, interests, most = 6, each = 2) {
  if (!page || !interests?.length) return [];
  const out = [];
  const count = new Map();
  for (const story of [...(page.tw || []), ...(page.intl || [])]) {
    const text = textOf(story);
    const hit = interests.find(i => (count.get(i) || 0) < each && i.re.test(text));
    if (!hit) continue;
    count.set(hit, (count.get(hit) || 0) + 1);
    out.push({ story, why: hit });
    if (out.length >= most) break;
  }
  return out;
}
