// 你關心的先看 (the plan's family links, Jay 11-10): the stories about what
// the person holds in Orbit Securities and follows in Orbit Sports, read
// from the family's notebook on this phone (kit family.mjs: stock.holds,
// sports.follows; names only). Matched by name in a story's headlines:
// Chinese names as written, English ones as whole words, a Taiwan stock's
// code only standing alone. No AI, nothing sent.

import * as kitNews from '#kit/news-outlets.mjs';

const US = new Set(['nba', 'wnba', 'mlb', 'nfl', 'nhl', 'ncaaf', 'ncaab']);
// The kit's matcher (namesRe, shared with Securities' 持股新聞); a phone on an
// older kit has none yet: nothing matched until it updates.
const namesRe = (words, codes) => kitNews.namesRe?.(words, codes) || null;

// What to look for: [{ label, kind: 'hold' | 'follow', re }].
export function interestsOf(holds = [], follows = []) {
  const out = [];
  const add = (label, kind, words, codes = []) => {
    const re = namesRe(words, codes);
    if (label && re) out.push({ label, kind, re });
  };
  for (const s of Array.isArray(holds) ? holds : []) if (s?.name) add(s.name, 'hold', [s.name, s.en], s.market === 'tw' ? [s.code] : []);
  // (An American team or a player by its last word too: Lakers, Ohtani; a club by its whole name.)
  const last = f => (f.athlete || US.has(f.league) ? String(f.name).trim().split(/\s+/).pop() : null);
  for (const f of Array.isArray(follows) ? follows : []) if (f?.name) add(f.short || f.zh || f.name, 'follow', [f.zh, f.short, f.name, last(f)]);
  return out;
}

const textOf = story => (kitNews.storyText ? kitNews.storyText(story) : [story.title, story.zh].filter(Boolean).join('\n'));

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
