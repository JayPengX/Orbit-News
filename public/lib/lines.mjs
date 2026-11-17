// The headline a reader sees: a world story's in Chinese on a Chinese phone,
// a Taiwan story's in English on an English one, by plain translation (`t`, a
// string, lib/tr.mjs) once it has come; else the outlets' own.
export function titleOf(story, en = false, t = null) {
  if (t) return { text: t, lang: en ? 'en' : 'zh-Hant' };
  return { text: story.title, lang: story.region === 'intl' ? 'en' : 'zh-Hant' };
}
