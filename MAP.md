# Orbit News: the map

Taiwan's and the world's news, each event gathered into one story with every
outlet that carries it, counted by side: Taiwan's 偏綠 · 中間 · 偏藍, the
English left · centre · right. Signs in with the Orbit Pass; 我的閱讀 syncs on
it. In Orbit's own look (Orbit-Core DESIGN §11): `data-look="native"`,
`look.css` after `news.css`. Started 2026-11-10 (Jay: "like Ground News but
for Taiwan": the idea only; the look, names and words are Orbit's own).

Live: https://orbit.jaypengx.com/news/

## Where the stories come from

- **The builder** (Orbit-Core `builders/news.js`, on the Runner's :00 :10 :18
  :30 :40 :50 slots) reads every outlet's RSS, Atom or Google-News sitemap
  (`FEEDS`; an unchanged feed answers 304), keeps 48 hours of headlines
  (R2 `private/news/items.json.gz`), groups them into stories (TF-IDF over
  two-character pieces for Chinese, stemmed words and summaries for English;
  `groupStories`) and writes `news/index.json`: `{ built, tw: [story], intl:
  [story] }`, only stories two outlets or more carry, ranked by outlets and
  freshness, 120 a region at most. No AI. A story: `{ id, title, by, sum,
  sumBy, img, imgBy, at, first, n, sides, blind, parties, items: [[outlet,
  headline, url, at]] }`; `blind` is the side that left it out (3 outlets
  or more, 2 hours or more, all on one side).
- **The outlets** (Orbit-Core `kit/news-outlets.mjs`, one table for the
  builder and the app): each outlet's name, site, owner, kind, its place on
  藍綠 (`tw`), 統獨 (`cs`) or US left–right (`lr`), and the sources for it
  (`BASIS`, `weak` where it rests on owner and stance alone). No outlet is
  placed 白: no study rates one so; a story names the parties its headlines
  name (`partiesIn`).
- **The phone** reads the page with the kit's `packJson` (the proxy's
  `/data/`, edge-cached 2 minutes), painting first from its own copy
  (`peekPack`), and again every 5 minutes in view and on return.

## Files

- `public/app.mjs`: starts the app, reads the stories, the Pass sync, tabs and the address (`#tw`, `#s=<story id>`).
- `public/shell.mjs`: state, words, outlets' names and marks, `outletLink` (a headline that opens the outlet and counts a read).
- `public/lib/stories.mjs`: the page as read (`cleanPage`), a story's bar (`barOf`), headlines by side (`bySide`), one-sided groups (`oneSided`), orders, `agoOf`.
- `public/lib/reading.mjs`: 我的閱讀's log `{ v: 1, days: { day: { outlet: taps } } }`, merged by each day's larger count, 60 days kept; `balanceOf`, `leanOf`.
- `public/views/parts.mjs`: the bar, a story row, the lead card, the page's foot.
- `public/views/lists.mjs`: 頭條, 台灣 / 國際, 單邊.
- `public/views/story.mjs`: a story's sheet (`.q-sheet-wide`; each side a card, `.q-sheet-cols`).
- `public/views/outlets.mjs`: 媒體 and an outlet's sheet.
- `public/news.css`, `public/look.css`: the sides' colours (`--nw-g` `--nw-c` `--nw-b` `--nw-l` `--nw-r`; never the app's violet), rows, cards.
- `public/sw.js`: the kit's service worker. Outlets' pictures are never kept (no `sw-images.js`): they're theirs, hotlinked.

## Terms

Headlines, links, the outlet's own summary (≤ 80 Chinese characters, 160
English) and its feed picture, each credited (`by`, `sumBy`, `imgBy`); every
tap opens the outlet's site. AllSides' ratings are credited where shown (CC
BY-NC 4.0: no money is made here).

## Deploying

`.github/workflows/deploy.yml` tests on every push to main and publishes
`public/` with Orbit-Core `deploy/cf-site.mjs` when this repo has a
`CLOUDFLARE_API_TOKEN`; until then Orbit-Core's `news-site.yml` publishes it
with Orbit-Core's token (every 15 minutes it looks for a new commit here, and
by hand). Push with `sh ../Orbit-Core/tools/push.sh`.
