// 各方怎麼說: how each side's outlets framed a story, the AI's, made once
// a story from their own headlines only (Orbit-Core's builders/ai.js
// newsSides → news/sides.json). Read whole and checked here: a side the
// story's own coverage doesn't have is dropped, two sides at least.
import * as kitNews from '#kit/news-outlets.mjs';

const SIDE_KEYS = { tw: ['g', 'c', 'b'], intl: ['l', 'c', 'r'] };
const txt = (v, n) => (typeof v === 'string' ? v.trim().slice(0, n) : '');

export function cleanSides(raw) {
  const out = new Map();
  const all = raw && typeof raw === 'object' ? raw.sides : null;
  if (!all || typeof all !== 'object') return out;
  for (const [id, s] of Object.entries(all)) {
    if (!s || typeof s !== 'object' || !s.sides || typeof s.sides !== 'object') continue;
    const sides = {};
    for (const [k, v] of Object.entries(s.sides)) {
      const zh = txt(v?.zh, 80), en = txt(v?.en, 200);
      if (/^[gcblr]$/.test(k) && zh && en) sides[k] = { zh, en };
    }
    if (Object.keys(sides).length < 2) continue;
    const zh = txt(s.diff?.zh, 100), en = txt(s.diff?.en, 240);
    // (A difference that only says each side's line again is left out: Jay 11-10, the kit's sidesRecap.)
    const recap = kitNews.sidesRecap?.(zh, Object.values(sides).map(x => x.zh));
    out.set(id, { sides, diff: zh && en && !recap ? { zh, en } : null });
  }
  return out;
}

// The sides as a story shows them: in the bar's order, only those it has.
export function sidesOf(story, said) {
  if (!story || !said) return null;
  const order = SIDE_KEYS[story.region === 'intl' ? 'intl' : 'tw'];
  const rows = order.filter(k => said.sides[k] && (story.sides?.[k] || 0) > 0).map(k => ({ side: k, ...said.sides[k] }));
  return rows.length >= 2 ? { rows, diff: said.diff } : null;
}
