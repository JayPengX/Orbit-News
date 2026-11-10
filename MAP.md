# Orbit News: the map

Taiwan's and the world's news (politics in the wide sense: tech, the economy,
society; and, from Jay's 11-10 widening, life, health, science, culture and
sport), each event gathered into one story with every outlet that carries it,
counted by side: Taiwan's 偏綠 · 中間 · 偏藍, the English left · centre ·
right. The spectrum is one feature, not a filter. Signs in with the Orbit Pass; 我的閱讀 syncs on
it. In Orbit's own look (Orbit-Core DESIGN §11): `data-look="native"`,
`look.css` after `news.css`. Started 2026-11-10 (Jay: "like Ground News but
for Taiwan": the idea only; the look, names and words are Orbit's own).

Live: https://orbit.jaypengx.com/news/

## Where the stories come from

- **The builder** (Orbit-Core `builders/news.js`, on the Runner's :00 :10 :18
  :30 :40 :50 slots) reads every outlet's RSS, Atom or Google-News sitemap
  (`FEEDS`, 110 of them: an outlet's main feed every build, the outlets
  added 11-10 every 2nd, the sections beside a main feed every 3rd,
  `feedsDue`, about 80 a build; an unchanged feed answers 304), keeps 48
  hours of headlines, leaves filler out (gossip, fortune, lottery, viral,
  clickbait, promos: `fillerOf`, `softOf`; sport and health are news), groups them into stories (TF-IDF over
  two-character pieces for Chinese, stemmed words and summaries for English;
  `groupStories`) and adds each group to the story it continues (`deskOf`),
  so a story is kept for days or weeks (3, 14 or 30 days after its last
  headline, by how many outlets carried it), growing as coverage comes. A
  story of no topic (the kit's `TOPICS`: a game of Pokémon) isn't shown.
  Ranked by importance (outlets, headlines 4 an outlet, days, a kind's
  `weight`: culture 0.8, sport 0.6), fading by half in 36 hours. Each build reads 12 of the top stories'
  pages once (`pageOf`): the outlet's picture (og:image) where the feed gave
  none, and its own YouTube clip (a VideoObject's embedUrl or the article's
  embed; one on every page of an outlet is its channel's, dropped). Writes
  `news/index.json` (stories heard of in 3 days, 180 Taiwan's, 140 the
  world's) and `news/past.json` (older ones by importance, each outlet's
  newest headline); its state in R2 `private/news/items.json.gz`. No AI. A
  story: `{ id, title, by, sum, sumBy, img, imgBy, at, first, n, m, days,
  sides, blind, parties, topics, imp, clips: [[outlet, youtubeId or '', url,
  title, picture]], items: [[outlet, headline, url, at, video?]] }`;
  `blind` is the side that left it out (3 outlets or more, 2 hours or more,
  all on one side; only a topic sides take).
- **The outlets** (Orbit-Core `kit/news-outlets.mjs`, one table for the
  builder and the app): each outlet's name, site, owner, kind, its place on
  藍綠 (`tw`), 統獨 (`cs`) or left–right (`lr`: AllSides', else Media
  Bias/Fact Check's), and the sources for it (`BASIS`, `weak` where it rests
  on owner and stance alone). Every outlet has a place (no 未評) but China's
  state media, counted apart as 官媒. No outlet is placed 白: no study rates
  one so; a story names the parties its headlines name (`partiesIn`). Its
  `TOPICS` are what News covers: the sides' own (政治, 兩岸, 國際, 國防,
  經濟, 科技, 能源, 司法, 社會) and those past them (生活, 健康, 科學, 文化,
  運動: `spectrum: false`, never one-sided, no bar on their rows); one line
  widens it.
- **The phone** reads the page with the kit's `packJson` (the proxy's
  `/data/`, edge-cached 2 minutes), painting first from its own copy
  (`peekPack`), and again every 5 minutes in view and on return; the past
  only when asked (a list's end, an old story's link: `hooks.past`).

## Files

- `public/app.mjs`: starts the app, reads the stories (and the past when asked), the Pass sync, tabs and the address (`#tw`, `#s=<story id>`).
- `public/shell.mjs`: state, words, outlets' names and marks, `outletLink` (a headline that opens the outlet and counts a read), `openOut` (a page opened by code: the kit's `openLink`, so iOS's quick view or the Safari app, as the person chose on the Pass sheet's 連結; a plain link follows that by itself).
- `public/lib/stories.mjs`: the page as read (`cleanPage`), a story's bar (`barOf`), headlines by side (`bySide`), China's state media (`stateMedia`), whether sides take it (`sidesTaken`), one-sided groups (`oneSided`, by kind `blindAll`, `byKind`, `blindCounts`), topics (`onTopic`, `topicsIn`), clips (`clipsOf`), `daysOf`, `agoOf`.
- `public/lib/reading.mjs`: 我的閱讀's log `{ v: 1, days: { day: { outlet: taps } } }`, merged by each day's larger count, 60 days kept; `balanceOf`, `leanOf`.
- `public/views/parts.mjs`: a story's coverage (`coverage`: the outlets' marks overlapping, `marks`, how many, the bar), a story row (what it's about and when over its headline, its picture beside it), a card (`storyCard`: a row on a phone, picture over words when wide, by its section's width), a clip card, the lead card, the lead stories' `carousel` (scroll-snap, a peek of the next, dots and ‹ ›; two at a time from 900 wide), the page's foot.
- `public/views/lists.mjs`: 頭條 (a front page: the date, the carousel of Taiwan's top three and the world's top two, 要聞 cards, 影音 rail, the world's, each topic's), 台灣 / 國際 (topic text tabs, a swipe across the list to the topic beside: the kit's `daySwipe`, `swipeTabs`; the topic's lead in its picture; the past at the end), 單邊 (by kind: text tabs and the same swipe, each side's count left out, then the stories); `play` (a YouTube clip in its story's sheet, a video page on its site). A story opens with the list it was in.
- `public/views/story.mjs`: a story's sheet (`.q-sheet-wide`; its picture or its clip in YouTube's privacy-enhanced player, `player`; the coverage card, `spectrum`: the bar, each side's count, 官媒 apart, the side that left it out, the parties named, a bar a day; its other clips right under the story; `hooks.play`: a list's tap on a picture with a play mark opens it playing; each side a card, `.q-sheet-cols`; ‹ › to the stories beside, `navOf`, also a swipe on the sheet (`daySwipe`) and the arrow keys; where it is in its list under the title).
- `public/views/outlets.mjs`: 媒體 and an outlet's sheet.
- `public/news.css`, `public/look.css`: the sides' colours (`--nw-g` `--nw-c` `--nw-b` `--nw-l` `--nw-r`; never the app's violet), rows, cards.
- `public/sw.js`: the kit's service worker. Outlets' pictures are never kept (no `sw-images.js`): they're theirs, hotlinked.

## Terms

Headlines, links, the outlet's own summary (≤ 80 Chinese characters, 160
English) and its picture (its feed's, or the one its page sets for sharing),
each credited (`by`, `sumBy`, `imgBy`); every tap opens the outlet's site. An
outlet's YouTube clip plays in YouTube's own player (youtube-nocookie.com),
credited, with a link to it on YouTube; nothing of it is kept. AllSides'
ratings are credited where shown (CC BY-NC 4.0: no money is made here).

## Deploying

`.github/workflows/deploy.yml` tests on every push to main and publishes
`public/` with Orbit-Core `deploy/cf-site.mjs` when this repo has a
`CLOUDFLARE_API_TOKEN`; until then Orbit-Core's `news-site.yml` publishes it
with Orbit-Core's token: the news build (`newsSite`) starts it once for each
new commit here, within 10 minutes of a push; by hand too. Push with `sh ../Orbit-Core/tools/push.sh`.
