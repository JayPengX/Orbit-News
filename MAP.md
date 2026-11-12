# Orbit News: the map

Taiwan's and the world's news, each event gathered into one story with every
outlet that carries it, counted by side: Taiwan's 偏綠 · 中間 · 偏藍, the
English left · centre · right. The spectrum is one feature, not a filter.
Signs in with the Orbit Pass; 我的閱讀 syncs on it. Started 2026-11-10.
Live: https://orbit.jaypengx.com/news/

## Rules

Jay's, dated (Taiwan day; 11-10's by the hour), newest wins; the family's are in Orbit-Core `docs/RULEBOOK.md`.

- 11-10 Taiwan's and English news grouped into stories, each outlet's side shown (藍綠 and 統獨 for Taiwan, US left/right for English). "Like Ground News but for Taiwan" is the idea only, never its name, look or words (its "Blindspot" is our 單邊).
- 11-10 An outlet's place comes from a published source (`kit/news-outlets.mjs` `BASIS`), or its owner's stated stance marked weaker; never our own reading of its stories. No outlet placed 白: stories name the parties instead. Every outlet has a place (AllSides, else Media Bias/Fact Check); only China's state media stand apart, as 官媒.
- 11-10 Headlines, links, the outlet's short summary and feed picture only, each credited; every tap opens the outlet; never a whole article, never a picture or clip kept. No AI in the builder's grouping or placing.
- 11-10 Cloudflare goes out from Orbit-Core: News's site is published by Orbit-Core's `news-site.yml` with Orbit-Core's token.
- 11-10 A hub for any story outlets could take sides on (politics in the wide sense, tech, the economy, society); (08:08) life, health, science, culture and sport too (`TOPICS` `spectrum: false`: never one-sided, no bar, sport and culture ranked lighter). A story of no topic (a game of Pokémon) stays out; the topics are one table, so widening is a line.
- 11-10 Stories rank by importance (outlets, how much they wrote, for how many days), not newness; a big story stays for weeks (`keepFor`), its page growing.
- 11-10 Filler is left out (gossip, fortune, lottery, viral, clickbait, promos: `fillerOf`, `softOf`). Every story with a picture shows it; a picture that won't load falls back to the next outlet's (`alts`). An outlet's own YouTube clip plays in YouTube's player; never a channel's page read.
- 11-10 (08:08) Swipe: 頭條's lead stories, 台灣 and 國際 from topic to topic, a story's sheet from story to story.
- 11-10 (22:51) A world story shows how Taiwan's outlets put it (their bar and headlines, `tw`, joined by a word list `builders/news-words.js`, never AI); the big world outlets are in, each placed by AllSides. A site that refuses non-browsers is read through Bing News' feed of it (Google News refuses Cloudflare); 民視 through its YouTube channel.
- 11-10 (22:53) A story's first topic is what most of its headlines name, a second only where 40% name it; in a topic's tab a story's tag is that topic; a tab needs 3 stories; each topic keeps its best 12 past the front's cap; a kind past the sides forms from 2 outlets.
- 11-10 (22:57) YouTube Shorts are left out; a clip YouTube won't play here says so and opens YouTube; a channel is read only if its clips play elsewhere and aren't mostly Shorts.
- 11-10 (22:58) A story's sheet keeps ‹ 上一則 · n / N · 下一則 › at its foot; each outlet once a side (its other headlines folded), four a side at first; 單邊 by 台灣 / 國際, each side's count a tap filter, its kinds as sections; one company's monthly report is never another's story.
- 11-10 No one-line AI summary under a headline (it only said the headline again). 11-11 News isn't passive: a search heads 頭條.
- 11-12 預測市場 (Jay: "link news to prediction market … if 黃仁勳 will still be CEO … or polls of election"): a story's open question as Polymarket's traders price it, beside the story; read-only, the source credited, never a way to trade. Code finds each pair and the AI confirms it (a wrong match is worse than none); the chances are Polymarket's. No market on a Taiwan vote from ten days before it until the polls close (選罷法 §53's quiet days for polls).
- The sides' colours are their own (`--nw-g` `--nw-c` `--nw-b` `--nw-l` `--nw-r`), never the app's violet.

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
  title, picture]], items: [[outlet, headline, url, at, video?]], alts:
  [[picture, outlet]] (other outlets', tried in turn when img won't load) }`;
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
  (`peekPack`, the AI's titles with it: the front page is drawn once, again only when a newer build or a changed reading log comes), and again every 5 minutes in view and on return; the past
  only when asked (a list's end, an old story's link: `hooks.past`).

## Files (`public/`)

| File | What |
| --- | --- |
| `app.mjs`, `shell.mjs` | Start, reading the page (and the past when asked), the Pass sync, tabs and the address (`#tw`, `#s=<story id>`, `#q=<words>`); state, outlets' names and marks, `outletLink`, `openOut` (the kit's `openLink`) |
| `lib/stories.mjs` | The page as read (`cleanPage`), a story's bar, headlines by side, 官媒, one-sided groups, topics, clips |
| `lib/mine.mjs`, `brief.mjs`, `learn.mjs` | The family's links: 你關心的 (Securities' holdings, Sports' follows; `namesRe`); 今天五則 (code only, kit `feedback.mjs` as `news`); 新聞學單字 (Words' `vocab.learning`) |
| `lib/markets.mjs` | 預測市場: Polymarket's chances on a story's question (Orbit-Core `builders/news-markets.js` → `news/markets.json`, every 30 minutes; nothing shown past 3 hours old), drawn in the sheet's `oddsPart` |
| `lib/lines.mjs`, `sides.mjs` | The AI made once by Orbit-Core `builders/ai.js`: world stories' Chinese titles and Taiwan's English ones (`news/lines.json`); 各方怎麼說 (`news/sides.json`) |
| `lib/search.mjs`, `views/search.mjs` | 搜尋, on the phone as each letter is typed (`findStories`, `fold`), recent searches |
| `lib/reading.mjs`, `pics.mjs` | 我的閱讀's log; an outlet's picture at the size shown (`sized`, `heavy`) |
| `views/parts.mjs`, `lists.mjs`, `story.mjs`, `outlets.mjs` | Rows, cards, the carousel; 頭條, 台灣 / 國際, 單邊; a story's sheet (player, coverage, sides, 台灣媒體怎麼報, 看法案 from `news/laws.json`, the foot); 媒體 |
| `lib/testing.mjs` | The 測試工具's News switches (kit `testtools.mjs`, unlocked on the Pass): `newsEmpty`, `newsFail`, `oneSided`, `badClip`; applied in `app.mjs load` to what's drawn only |
| `news.css`, `look.css`, `sw.js` | The look; the kit's service worker (no `sw-images.js`: outlets' pictures are theirs, hotlinked) |

## Terms

Headlines, links, the outlet's own summary (≤ 80 Chinese characters, 160
English) and its picture (its feed's, or the one its page sets for sharing; asked at a smaller size from the outlet's own server where it makes one, `lib/pics.mjs`),
each credited (`by`, `sumBy`, `imgBy`); every tap opens the outlet's site. An
outlet's YouTube clip plays in YouTube's own player (youtube-nocookie.com),
credited, with a link to it on YouTube; nothing of it is kept. AllSides'
ratings are credited where shown (CC BY-NC 4.0: no money is made here).

## Deploying

`.github/workflows/deploy.yml` tests on every push to main and publishes
`public/` with Orbit-Core `deploy/cf-site.mjs` when this repo has a
`CLOUDFLARE_API_TOKEN`; until then Orbit-Core's `news-site.yml` publishes it
with Orbit-Core's token: the news build (`newsSite`) starts it once for each
new commit here, within 10 minutes of a push; by hand too.

## Run and test

`npm test`. With today's stories: `ORBIT_DATA=<folder with news/index.json> node ../Orbit-Core/tools/preview.mjs news --width 375`, or `--live` once the builder has run (in Orbit-Core `node builders/run.js news` writes nothing locally).
