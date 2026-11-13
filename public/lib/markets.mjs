// 預測市場 (Jay 11-12): Polymarket's open markets on the question a story
// raises (黃仁勳 會不會下台, who wins a race), each beside its story.
// Orbit-Core's builders/news-markets.js finds the pairs in code, the AI
// confirms each and words its question; the chances are Polymarket's
// prices. R2 news/markets.json: { built, stories: { id: [{ e, slug, zh, en,
// kind, one?, rows: [{ p, d, en?, zh?, md? }] }] } }, read whole and checked here
// (one: the options exclude each other, so their chances add to 100%).
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
      if (rows.length) ms.push({ slug, zh, en, kind: m.kind, one: m.kind === 'pick' && m.one === 1, rows });
    }
    if (ms.length) out.set(id, ms);
  }
  return out;
}

// A chance as a reader sees it: 12%, under 1% as <1%, over 99% as >99%.
export const pct = p => (p < 0.01 ? '<1%' : p > 0.99 ? '>99%' : `${Math.round(p * 100)}%`);
// A card's chances: options that exclude each other rounded so they add to
// 100% (the largest remainders round up: 55.5% and 44.5% are 56% and 44%,
// never 56% and 45%); else each on its own.
export function pcts(rows, one) {
  if (!one) return rows.map(r => pct(r.p));
  const tenths = rows.map(r => Math.round(r.p * 1000));
  const floor = tenths.map(t => Math.floor(t / 10));
  let left = Math.round(tenths.reduce((a, t) => a + t, 0) / 10) - floor.reduce((a, n) => a + n, 0);
  const order = tenths.map((t, i) => [t % 10, t, i]).sort((a, b) => b[0] - a[0] || b[1] - a[1]);
  for (const [, , i] of order) if (left-- > 0) floor[i]++;
  return floor.map((n, i) => (n < 1 && rows[i].p > 0 ? '<1%' : n > 99 && rows[i].p < 1 ? '>99%' : `${n}%`));
}
// A day's move in points (▲5, ▼3), none under one point.
export const move = d => (Math.abs(d) < 0.01 ? '' : `${d > 0 ? '▲' : '▼'}${Math.round(Math.abs(d) * 100)}`);
// The market's page on Polymarket (the source, credited).
export const sourceUrl = m => `https://polymarket.com/event/${m.slug}`;
