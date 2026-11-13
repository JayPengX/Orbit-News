// 重點整理 (Jay 11-13: "make it more in app"): a story's few points in our
// own words, the AI's, made once a story from its outlets' headlines and
// feed summaries (Orbit-Core's builders/ai.js newsBriefs → news/briefs.json:
// { built, briefs: { id: { points: [{ k, zh, en }], m, at } } }, k what
// happened, the background, what's next: 11-13; older ones carry none).
// Read whole and checked here: two points at least, four at most, each short.
export const KINDS = ['what', 'why', 'next'];
const txt = (v, n) => (typeof v === 'string' ? v.trim().slice(0, n) : '');

export function cleanBriefs(raw) {
  const out = new Map();
  const all = raw && typeof raw === 'object' ? raw.briefs : null;
  if (!all || typeof all !== 'object') return out;
  for (const [id, b] of Object.entries(all)) {
    const points = (Array.isArray(b?.points) ? b.points : [])
      .slice(0, 4)
      .map(p => ({ k: KINDS.includes(p?.k) ? p.k : '', zh: txt(p?.zh, 60), en: txt(p?.en, 220) }))
      .filter(p => p.zh && p.en);
    if (points.length >= 2) out.set(id, { points, at: Number(b.at) || 0 });
  }
  return out;
}
