// 預測市場 (Jay 11-12): Polymarket's open markets on the question a story
// raises (黃仁勳 會不會下台, who wins a race), each beside its story.
// Orbit-Core's builders/news-markets.js finds the pairs in code, the AI
// confirms each and words its question; the chances are Polymarket's
// prices. R2 news/markets.json: { built, stories: { id: [{ e, slug, zh, en,
// kind, rows: [{ p, d, en?, zh?, md? }] }] } }, read whole and checked here.
// A page older than STALE shows nothing: a chance is a live number.

export const STALE = 3 * 3_600_000;
const KINDS = new Set(['yes', 'dates', 'pick']);
const txt = (v, n) => (typeof v === 'string' ? v.trim().slice(0, n) : '');
const chance = v => (typeof v === 'number' && v >= 0 && v <= 1 ? v : null);

export function cleanMarkets(raw, now = Date.now()) {
  const out = new Map();
  const all = raw && typeof raw === 'object' ? raw.stories : null;
  if (!all || typeof all !== 'object' || !(now - (Number(raw.built) || 0) < STALE)) return out;
  for (const [id, list] of Object.entries(all)) {
    if (!Array.isArray(list)) continue;
    const ms = [];
    for (const m of list.slice(0, 2)) {
      const zh = txt(m?.zh, 40), en = txt(m?.en, 120), slug = txt(m?.slug, 200);
      if (!zh || !en || !/^[\w-]+$/.test(slug) || !KINDS.has(m.kind) || !Array.isArray(m.rows)) continue;
      const rows = m.rows
        .slice(0, 4)
        .map(r => ({ p: chance(r?.p), d: typeof r?.d === 'number' && Math.abs(r.d) <= 1 ? r.d : 0, en: txt(r?.en, 60), zh: txt(r?.zh, 16), md: /^(\d{4}\/)?\d{1,2}\/\d{1,2}$/.test(r?.md || '') ? r.md : '' }))
        .filter(r => r.p != null && (m.kind === 'yes' || (m.kind === 'dates' ? r.md : r.en)));
      if (rows.length) ms.push({ slug, zh, en, kind: m.kind, rows });
    }
    if (ms.length) out.set(id, ms);
  }
  return out;
}

// A chance as a reader sees it: 12%, under 1% as <1%, over 99% as >99%.
export const pct = p => (p < 0.01 ? '<1%' : p > 0.99 ? '>99%' : `${Math.round(p * 100)}%`);
// A day's move in points (▲5, ▼3), none under one point.
export const move = d => (Math.abs(d) < 0.01 ? '' : `${d > 0 ? '▲' : '▼'}${Math.round(Math.abs(d) * 100)}`);
// The market's page on Polymarket (the source, credited).
export const sourceUrl = m => `https://polymarket.com/event/${m.slug}`;
