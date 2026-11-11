// An outlet's picture at the size it's shown (Jay 11-11: pictures slow to
// show). The feeds name a picture at its biggest (a 96-pixel thumbnail
// came as 6000 × 4000, 2 MB); most outlets' own servers make it smaller
// when asked by its address (a width in the query, a size in the path, the
// outlet's own resizer), so it's still theirs, from them, never kept (MAP.md
// Terms). Two sizes: 's' a row's thumbnail (about 480 wide), 'l' a lead's or
// a sheet's picture (about 960). An outlet not listed here, or an address
// not in the shape it knows, is asked as it is; a smaller one that fails
// gives way to the address as given (parts.mjs `picture`).
//
// Each rule checked against the outlets' live pictures on 2026-11-11
// (size before → after, small): 中天 770 KB → 20, 鏡週刊 240 → 29, 三立 50
// → 26, NYT 660 → 70, Insider 1.3 MB → 20, NPR 2.3 MB → 29, New York Post
// 3.3 MB → 43, Semafor 430 → 19.

const W = { s: 480, l: 960 };
// (A width in the query: the value replaced, or added.)
const query = (key, add = false) => (u, w) => {
  if (u.searchParams.has(key)) u.searchParams.set(key, String(w));
  else if (add) u.searchParams.append(key, String(w));
  else return null;
  return u.href;
};
const RULES = [
  // YouTube: the 16:9 one for a row (no black bars), the 480 one as given for a lead.
  [/^i\.ytimg\.com$/, (u, w) => (w <= W.s ? u.href.replace(/\/(?:hq|sd|maxres)default\.jpg$/, '/mqdefault.jpg') : null)],
  // 中天: its own resizer (Nuxt's IPX), as its site asks it.
  [/^storage\.ctinews\.com$/, (u, w) => `https://ctinews.com/_ipx/w_${w}&f_webp&q_80/${u.href}`],
  // 三立: -PH 800 wide, -XXL 510.
  [/^attach\.setn\.com$/, (u, w) => (w <= W.s ? u.href.replace(/-PH\.jpg$/i, '-XXL.jpg') : null)],
  // 鏡週刊: -w1600 → -w480 / -w800.
  [/^v3-statics\.mirrormedia\.mg$/, (u, w) => u.href.replace(/-w(?:1200|1600|2400)\.(jpe?g|png|webp)$/i, `-w${w <= W.s ? 480 : 800}.$1`)],
  // 新頭殼: resize_action2/800 → 400.
  [/^images\.newtalk\.tw$/, (u, w) => (w <= W.s ? u.href.replace(/\/resize_action2\/\d+\//, '/resize_action2/400/') : null)],
  // The New York Times: one of its named crops, 600 wide or 1024.
  [/^static01\.nyt\.com$/, (u, w) => u.href.replace(/-(?:superJumbo|jumbo|mediumSquareAt3X|threeByTwoMediumAt2X|videoSixteenByNineJumbo1600|facebookJumbo|articleLarge)\.(jpe?g|png)$/, `-${w <= W.s ? 'articleLarge' : 'jumbo'}.$1`)],
  // The BBC: /standard/976/ → 480.
  [/^ichef\.bbci\.co\.uk$/, (u, w) => (w <= W.s ? u.href.replace(/\/(standard|branded_news)\/\d+\//, '/$1/480/') : null)],
  // The Independent, The Blaze: ?width=.
  [/^(?:static\.independent\.co\.uk|www\.theblaze\.com)$/, query('width')],
  // WordPress sites (Washington Examiner, The Hill, New York Post): ?w=.
  [/^(?:www\.washingtonexaminer\.com|thehill\.com)$/, query('w')],
  [/^nypost\.com$/, (u, w) => (/\?w%3D\d+$/.test(u.href) ? u.href.replace(/\?w%3D\d+$/, `?w=${w}`) : query('w')(u, w))],
  // Fox News: the size in the path (/931/523/), kept to its shape.
  [
    /^a57\.foxnews\.com$/,
    (u, w) => {
      const m = /\/(\d{3,4})\/(\d{3,4})\/([^/]+)$/.exec(u.pathname);
      if (!m || Number(m[1]) <= w) return null;
      u.pathname = u.pathname.replace(/\/\d+\/\d+\/([^/]+)$/, `/${w}/${Math.round((w * Number(m[2])) / Number(m[1]))}/$1`);
      return u.href;
    }
  ],
  // ABC News: _16x9_1600 → 608 / 992.
  [/^s\.abcnews\.com$/, (u, w) => u.href.replace(/_(16x9|4x3|1x1)_\d+\.jpg/, `_$1_${w <= W.s ? 608 : 992}.jpg`)],
  // Semafor, Deutsche Welle (imgix), Insider, Time: a width in the query.
  [/^(?:img\.semafor\.com|dw-wp-production\.imgix\.net)$/, query('w', true)],
  [/^i\.insider\.com$/, query('width', true)],
  [/^static\.time\.com$/, query('width', true)],
  // CNN: its own crop to a width.
  [/^media\.cnn\.com$/, (u, w) => (u.searchParams.has('c') ? `${u.origin}${u.pathname}?c=original&q=w_${w},c_fill` : null)],
  // NPR: /resize/6000x4000!/ → /resize/480/.
  [/^npr\.brightspotcdn\.com$/, (u, w) => u.href.replace(/\/resize\/\d+x\d+!?\//, `/resize/${w}/`)],
  // Sky News: /1920x1080/ → /768x432/.
  [/^e3\.365dm\.com$/, (u, w) => (w <= W.s ? u.href.replace(/\/\d{3,4}x\d{3,4}\//, '/768x432/') : null)],
  // TVBS: &w=1200&h=675 → kept to its shape.
  [
    /^news-images\.tvbs\.com\.tw$/,
    (u, w) => {
      const [pw, ph] = [Number(u.searchParams.get('w')), Number(u.searchParams.get('h'))];
      if (!(pw > w && ph)) return null;
      u.searchParams.set('w', String(w));
      u.searchParams.set('h', String(Math.round((w * ph) / pw)));
      return u.href;
    }
  ]
];

// The address of `src` about `size` wide ('s' or 'l'); the address itself
// when the outlet has no smaller one we know.
export function sized(src, size = 's') {
  if (typeof src !== 'string' || !/^https:\/\//.test(src)) return src;
  let u;
  try {
    u = new URL(src);
  } catch {
    return src;
  }
  const rule = RULES.find(([host]) => host.test(u.hostname));
  if (!rule) return src;
  try {
    return rule[1](u, W[size] || W.s) || src;
  } catch {
    return src;
  }
}

// A picture that's no picture (a video's stream address) left out; one of
// the few outlets whose pictures run from 250 KB to several MB and that make
// no smaller one (華視, 東森, Politico, CGTN, The Atlantic) asked after the
// other outlets' for a row's small picture (its own when it's the only one).
const NOT_PICTURE = /\.(?:m3u8|mp4|mpd)(?:$|\?)/i;
const HEAVY = /^(?:www\.cts\.com\.tw|img\.news\.ebc\.net\.tw|static\.politico\.com|news\.cgtn\.com|video\.cgtn\.com|cdn\.theatlantic\.com)$/;
const hostOf = src => {
  try {
    return new URL(src).hostname;
  } catch {
    return '';
  }
};
export const notPicture = src => NOT_PICTURE.test(src || '');
export const heavy = src => HEAVY.test(hostOf(src));
