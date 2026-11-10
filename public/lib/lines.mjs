// 一句話講清楚 and 國際新聞中文標題 (Jay 11-10, the family's AI): Orbit-Core's
// builder (builders/ai.js newsLines, the AI door's news-lines) writes, once a
// story (again when its coverage doubles), from the outlets' own headlines
// and summaries only: a neutral one line of what happened (Chinese), and a
// short neutral headline in each language. R2 news/lines.json:
// { built, lines: { id: { line, zh, en, m } } }.

export function cleanLines(raw) {
  const out = new Map();
  const lines = raw && typeof raw === 'object' ? raw.lines : null;
  if (!lines || typeof lines !== 'object') return out;
  for (const [id, l] of Object.entries(lines)) {
    if (!l || typeof l !== 'object') continue;
    const s = k => (typeof l[k] === 'string' ? l[k].trim() : '');
    if (s('line') || s('zh') || s('en')) out.set(id, { line: s('line'), zh: s('zh'), en: s('en') });
  }
  return out;
}

// The headline a reader sees: a world story's in Chinese on a Chinese phone,
// a Taiwan story's in English on an English one; else the outlets' own.
// `ai`: whether it's the AI's (said so where it shows).
export function titleOf(story, l, en = false) {
  const want = en ? story.region !== 'intl' && l?.en : story.region === 'intl' && l?.zh;
  return want ? { text: want, ai: true, lang: en ? 'en' : 'zh-Hant' } : { text: story.title, ai: false, lang: story.region === 'intl' ? 'en' : 'zh-Hant' };
}

// The one line under it (Chinese phones: it's written in Chinese); '' none,
// or when it only says the headline again.
const squash = s => String(s || '').replace(/[\s，。、「」『』：:,.!?！？"'“”‘’（）()\-—]/g, '');
export function lineOf(story, l, en = false) {
  if (en || !l?.line) return '';
  const a = squash(l.line), t = squash(titleOf(story, l, en).text);
  return a && a !== t && !t.includes(a) ? l.line : '';
}
