// 你關心的 at the top of 頭條 (Jay 11-13: "like Sports' design idea": what
// you follow first, as Sports' 我的比賽 heads 首頁): the stories about what
// the person follows here (people and any words, topics, outlets: the
// reading log's `follow`, lib/reading.mjs) and in the family (what they hold
// in Orbit Securities, follow in Orbit Sports: lib/mine.mjs), each with what
// of theirs it's about; and 你可能錯過 (stories their usual side's outlets
// leave out or barely carry). On the phone, nothing sent, no AI.
import { REGIONS, ENDS } from './stories.mjs';
import { findStories } from './search.mjs';
import { followsOf, readState, leanOf, balanceOf } from './reading.mjs';
import { textOf } from './mine.mjs';

// What each follow finds: { label, kind: 'follow', key, has(story) }.
// Words (a person, a company) as a search finds them, only where they're in
// a headline or summary (`strong`: not a passing word in one outlet's line);
// a topic, its stories; an outlet, the stories it leads or is one of a few on.
// `ctx`: findStories' ({ lines, outletName, topicName }).
export function followFinds(log, page, ctx = {}) {
  const out = [];
  for (const f of followsOf(log)) {
    if (f.kind === 'w') {
      const ids = new Set(findStories([page], f.id, ctx, { strong: true }).map(x => x.story.id));
      out.push({ label: f.id, kind: 'follow', key: f.key, has: s => ids.has(s.id) });
    } else if (f.kind === 't') out.push({ label: ctx.topicName?.(f.id, 'tw') || f.id, kind: 'topic', key: f.key, has: s => s.topics?.[0] === f.id });
    // (An outlet's own: its headline leads the story, or it's one of the few
    // on it; every big story has nearly every outlet, and isn't theirs.)
    else if (f.kind === 'o') out.push({ label: ctx.outletName?.(f.id) || f.id, kind: 'outlet', key: f.key, has: s => s.by === f.id || ((s.n || 0) <= 4 && (s.items || []).some(it => it[0] === f.id)) });
  }
  return out;
}

// The stories for the top of 頭條: [{ story, why }], the most important first
// (both regions together), `each` at most for any one thing followed (a busy
// topic doesn't fill it), the most specific first when a story is about
// several (words, then what's held and followed in the family, then topics,
// then outlets). Stories already read sink below the rest (one with big news
// since stays up). `interests`: lib/mine.mjs interestsOf's; `finds`:
// followFinds'.
const ORDER = { follow: 0, hold: 1, topic: 2, outlet: 3 };
export function yourStories(page, { finds = [], interests = [], log = null, now = Date.now(), live = () => false, most = 5, each = 2, skip = new Set() } = {}) {
  if (!page) return [];
  const all = [...finds, ...interests.map(i => ({ ...i, has: s => i.re.test(textOf(s)) }))].sort((a, b) => (ORDER[a.kind] ?? 1) - (ORDER[b.kind] ?? 1));
  if (!all.length) return [];
  const stories = REGIONS.flatMap(r => page[r] || [])
    .filter(s => !skip.has(s.id))
    .sort((a, b) => (b.imp || 0) - (a.imp || 0));
  const count = new Map();
  const out = [];
  const take = list => {
    for (const story of list) {
      if (out.length >= most) return;
      if (out.some(x => x.story.id === story.id)) continue;
      const hit = all.find(i => (count.get(i) || 0) < each && i.has(story));
      if (!hit) continue;
      count.set(hit, (count.get(hit) || 0) + 1);
      out.push({ story, why: { label: hit.label, kind: hit.kind === 'topic' || hit.kind === 'outlet' ? 'follow' : hit.kind } });
    }
  };
  const fresh = s => readState(log, s, { now, live: live(s) }) !== 'read';
  take(stories.filter(fresh));
  take(stories.filter(s => !fresh(s)));
  return out;
}

// 你可能錯過: when most of what the person opened in 30 days came from one
// end (偏綠 or 偏藍; abroad left or right: leanOf), the stories they'd likely
// miss: those their end left out (`blind`), then those the other end
// carries widely while theirs barely does, unread, the most important
// first; `most` at most. → { region, lean, stories } or null.
const OTHER = { g: 'b', b: 'g', l: 'r', r: 'l' };
export function missedOf(page, log, today, { most = 2, now = Date.now(), skip = new Set() } = {}) {
  if (!page) return null;
  for (const region of REGIONS) {
    const { lean } = leanOf(balanceOf(log, region, today));
    if (!lean || !ENDS[region].includes(lean)) continue;
    const other = OTHER[lean];
    const unread = s => !skip.has(s.id) && !readState(log, s, { now });
    const list = page[region] || [];
    const left = list.filter(s => s.blind === lean && unread(s));
    const theirs = list.filter(s => s.blind !== lean && (s.sides?.[other] || 0) >= 3 && (s.sides?.[lean] || 0) <= 1 && (s.sides?.[other] || 0) >= 3 * (s.sides?.[lean] || 0) && unread(s));
    const stories = [...left, ...theirs.sort((a, b) => (b.imp || 0) - (a.imp || 0))].slice(0, most);
    if (stories.length) return { region, lean, stories };
  }
  return null;
}
