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

export const textOf = story => (kitNews.storyText ? kitNews.storyText(story) : [story.title, story.zh].filter(Boolean).join('\n'));
