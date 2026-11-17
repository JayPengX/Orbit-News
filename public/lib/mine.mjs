// 你關心的先看 (the plan's family links, Jay 11-10): the stories about what
// the person holds in Orbit Securities and follows in Orbit Sports, read
// from the family's notebook on this phone (kit family.mjs: stock.holds,
// sports.follows; names only). Matched by name in a story's headlines:
// Chinese names as written, English ones as whole words, a Taiwan stock's
// code only standing alone. No AI, nothing sent.

import * as kitNews from '#kit/news-outlets.mjs';
import { leagueOf } from './leagues.mjs';

const US = new Set(['nba', 'wnba', 'mlb', 'nfl', 'nhl', 'ncaaf', 'ncaab']);
// The kit's matcher (namesRe, shared with Securities' 持股新聞); a phone on an
// older kit has none yet: nothing matched until it updates.
const namesRe = (words, codes) => kitNews.namesRe?.(words, codes) || null;

// What to look for: [{ label, kind: 'hold' | 'follow', re }].
export function interestsOf(holds = [], follows = []) {
  const out = [];
  const add = (label, kind, words, codes = [], more = {}) => {
    const re = namesRe(words, codes);
    if (label && re) out.push({ label, kind, re, ...more });
  };
  for (const s of Array.isArray(holds) ? holds : []) if (s?.name) add(s.name, 'hold', [s.name, s.en], s.market === 'tw' ? [s.code] : []);
  // (An American team or a player by its last word too: Lakers, Ohtani; a club by its whole name.)
  const last = f => (f.athlete || US.has(f.league) ? String(f.name).trim().split(/\s+/).pop() : null);
  // (A team or player is about a game only: 國民 (the Nationals) tagged every
  // 國民黨 story, 太陽 (the Suns) a solar one, Judge every court, White the
  // White House, 11-17. `league`: the story's, where it can be told.)
  for (const f of Array.isArray(follows) ? follows : []) if (f?.name) add(f.short || f.zh || f.name, 'follow', [f.zh, f.short, f.name, last(f)], [], { sport: true, league: String(f.league || '') });
  return out;
}

// A story on a sports page in a league the follow plays in, or one News
// can't place (a national team's, other sports): 新北國王's TPBL game is no
// Sacramento Kings story, nor the NFL's Giants the baseball Giants'. A
// club's cup games are its own (Arsenal in the Champions League).
const SOCCER = new Set(['epl', 'bundesliga', 'seriea', 'ligue1', 'mls', 'scotland', 'laliga', 'ucl', 'uel', 'uecl', 'facup', 'nationsleague', 'soccer']);
const CUPS = new Set(['ucl', 'uel', 'uecl', 'facup', 'nationsleague', 'soccer']);
const leagues = new WeakMap();
const leagueOfStory = s => (leagues.has(s) ? leagues.get(s) : (leagues.set(s, leagueOf(s)), leagues.get(s)));
export function inLeague(story, league) {
  if (!league) return true;
  const l = leagueOfStory(story);
  return l === league || l === 'other' || l === 'national' || (SOCCER.has(league) && CUPS.has(l));
}
// Whether a story is about one of `interestsOf`'s: a holding by its names; a
// team or player by its names in a sports story of its league.
export const isAbout = (story, i) => Boolean(story && i) && (!i.sport || ((story.topics || []).includes('sport') && inLeague(story, i.league))) && about(story, i.re);

export const textOf = story => (kitNews.storyText ? kitNews.storyText(story) : [story.title, story.zh].filter(Boolean).join('\n'));

// Whether a story is about it: its title says so, or enough of its headlines
// (two, and one in eight). One in passing is not (Jay 11-15: Jensen Huang's
// scandal marked 持股 台積電 by one weekly round-up among its 120 headlines).
export function about(story, re) {
  if (!re) return false;
  if (re.test([story?.title, story?.zh].filter(Boolean).join('\n'))) return true;
  const heads = [...(story?.items || []), ...(story?.tw?.items || [])].map(it => it?.[1]).filter(Boolean);
  if (!heads.length) return re.test(textOf(story));
  const n = heads.filter(t => re.test(t)).length;
  return n >= Math.min(2, heads.length) && n * 8 >= heads.length;
}
