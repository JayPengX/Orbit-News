# Orbit News: the map

Taiwan's and the world's news, each event gathered into one story with every
outlet that carries it, counted by side: Taiwan's 偏綠 · 中間 · 偏藍, the
English left · centre · right. The spectrum is one feature, not a filter.
Signs in with the Orbit Pass; 我的閱讀, the read marks and the follows sync on it. Started 2026-11-10.
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
- 11-13 More outlets, Taiwan's and the world's (Jay: "adding even more news outlet from Taiwan and international"), each placed by a source like the rest; Taiwan's places checked against the studies (Jay: "Taiwan news outlet sit majority in middle, that's probably not so true"): TVBS and 東森 moved to 偏藍, 民視 and 三立 to 深綠 by how TEDS 2019's voters see each channel (`teds2019`), 關鍵評論網 to 偏綠 by Media Bias/Fact Check's Taiwan ratings (`mbfc-tw`: its Left-Center is 偏綠, Right-Center 偏藍); an outlet no study has rated stays 中間 marked 依據較弱, never placed by our reading.
- 11-13 A story's picture is an outlet's photo, never a video's thumbnail while any outlet gave one (Jay: "don't use thumbnail with text"; a channel's frame carries its words burned in): Orbit-Core `THUMB_PIC`.
- 11-13 A story's head credits its photo and its clip each to its own outlet (圖：壹蘋 · ▶ 中天的影片), never the photo called the clip; its 影音 row lists every clip, the head's among them, marked 播放中 while it plays (Jay 11-13: "the title video and the only video listed is not the same").
- 11-12 The videos inside the articles count (Jay: "get the video embedded in a news web page … Taiwanese news site is the weak spot"): a story's clip may come from its outlets' own pages, only the article's own (never the box beside every article, never a Short); one on the outlet's own player opens on its site.
- 11-12 預測市場 (Jay: "link news to prediction market … if 黃仁勳 will still be CEO … or polls of election"): a story's open question as Polymarket's traders price it, beside the story; read-only, the source credited, never a way to trade. Code finds each pair and the AI confirms it (a wrong match is worse than none); the chances are Polymarket's. No market on a Taiwan vote from ten days before it until the polls close (選罷法 §53's quiet days for polls). A card's options in Chinese or as written, never half-translated; a person's name as the market writes it in English unless the story's headlines write it in Chinese (Jay 11-13: "for name use English for accuracy", never a guessed 巴克 or 黃樂); each option's label says what sets it apart (Jay 11-13: never two rows both "$4T"). A card says exactly what settles it (Jay 11-13): the question with its deadline and what's already decided (a ladder's rows say their own dates), a threshold's side as the market counts it (未達, never 以下 for under), options that exclude each other adding to 100%, and ▲▼ named once as a day's move in points.
- 11-13 Personal like Sports (Jay: "we never really consider orbit news as a reader … kind of like sports's design idea"): what you follow (people and any words, topics, outlets, and the family's holdings and teams) rises through 頭條 and each list, tagged ★ with what of yours it's about (Jay 11-13: "more integrated rather than just an independent section": no separate 你關心的 block), your outlets first in a story's marks; a story read is dimmed, and marked 新進展 when it has big news since; 我的閱讀 nudges toward what your usual side leaves out (你可能錯過). All of it on the phone and the person's own Pass, never sent elsewhere.
- 11-13 Reading kept in the app (Jay: "just make it more in app"): a story's sheet carries our own 重點整理 (the AI's, from the outlets' headlines and feed summaries only), each side's headlines, its clips, 來龍去脈 and 相關新聞; the whole report opens on the outlet's own site (iOS's quick view, closed back to the story). Never an article's text copied: outlets mark them 禁止轉載.
- 11-13 One story, one event (Jay: "spread text about the news and not so helpful trying to understand it", a world story of 38 outlets over four days holding Pence's 2028 run and Mark Kelly's beside Trump ending the Iran talks): a story keeps the headlines near its core, what drifted from it starts a story of its own where enough outlets carry it. Its title names the event, who did what (never a topic: 伊朗議題受關注), alone in the sheet with the Orbit AI mark; 重點整理 says what happened, the background and what comes next, each only where the outlets' own headlines and summaries say it; 各方怎麼說 shows every side that carried the story, or none (Jay: "no right wing"); a political story is never also 運動 or 生活 by a word in it (Jay: "why is this sport").
- 11-13 A kind with no sides (a game, a storm) lists its outlets in one card, those that wrote most first, never under 偏綠 · 中間 · 偏藍 (Jay: "if this kind of news has no spectrum then don't list them like spectrum"). The world's sports stories are 運動 by their teams and players (the Curry injury was 科技), and Taiwan's sports story finds the world's by the English names Sports' AI already gave it (`news/sport-who.json`, no new AI call), a game only a game (Jay: "why is this Taiwan outlet only"). A foreign person in Chinese only by the name Taiwan's press fixes (translate.js `KNOWN`), anyone else in English (Scott Colom, never 史考特科洛姆).
- 11-13 What's on screen never moves by itself (Jay: opening News "get stuck a few seconds then reshuffle"): lists hold their first-drawn order for the opening (`steady`), new stories slotting in; only a pull, a follow or the next opening ranks anew. Reads that land together are drawn once.
- 11-14 影音 is the news told by its clips, not a list of videos (Jay: "Video is basically a list of video super unhelpful … improve it significantly so it's actually about using video to look for news"): a story a card, its best clip playing in place, its title and one line, every outlet's clip on it beside, the whole story a tap away at the same second; one ends, the next story's begins. No second row of kinds under the tabs (it said the tabs again).
- 11-14 單邊 is the important stories one side all but leaves out, not the ones it has none of (Jay: "most news there is just less notable news"; "if just one of the other side report it it's not in 單邊?"): 8 outlets or more, 4 or more on one end and on the other a token one or two (one in 8 of a big story's), the lead 4 times past each end's usual share of the day's front, as important as the front's middle story or more (Orbit-Core `oneSidedOf`); the most important first; every one marked wherever it's listed by words in the colour of the side that left it out (偏藍沒報, 偏右少報; Jay 11-14: "using number to indicate is such a bad design": no counts on a card, the bar beside it shows the split), who carried it by name under it in 單邊, the counts only in its sheet; by code, never AI. By outlets, not readers: no published figures place each outlet's reach.
- 11-14 AI only for what someone opens (Jay: "only spend it as I use it but kept fast enough"): 重點整理 and 各方怎麼說 are made the first time anyone opens a story (Orbit-Core `/ai/open`, `lib/open-ai.mjs`), kept for everyone, their shape shown meanwhile, asked when a finger touches the story (`warmStory`); only 頭條's lead stories are made ahead (Orbit-Core `newsOpenAhead`). Titles nobody had made stay the outlets' own (Google's plain translation for the other language); 預測市場's new pairs and the sports stories' AI-read names wait (those made before stay).
- The sides' colours are their own (`--nw-g` `--nw-c` `--nw-b` `--nw-l` `--nw-r`), never the app's violet.

## Where the stories come from

- **The builder** (Orbit-Core `builders/news.js`, on the Runner's :00 :10 :18
  :30 :40 :50 slots) reads every outlet's RSS, Atom or Google-News sitemap
  (`FEEDS`, 165 of them for 122 outlets: an outlet's main feed every build,
  the outlets added 11-10 every 2nd, the sections beside a main feed every
  3rd, the outlets added 11-13 every 6th, `feedsDue`, under 90 a build; an
  unchanged feed answers 304), keeps 48
  hours of headlines, leaves filler out (gossip, fortune, lottery, viral,
  clickbait, promos: `fillerOf`, `softOf`; sport and health are news), groups them into stories (TF-IDF over
  two-character pieces for Chinese, stemmed words and summaries for English;
  `groupStories`) and adds each group to the story it continues (`deskOf`;
  each story kept to the headlines near its core, `keptOf`, what drifted
  starting its own),
  so a story is kept for days or weeks (3, 14 or 30 days after its last
  headline, by how many outlets carried it), growing as coverage comes. A
  story of no topic (the kit's `TOPICS`: a game of Pokémon) isn't shown.
  Ranked by importance (outlets, headlines 4 an outlet, days, a kind's
  `weight`: culture 0.8, sport 0.6), fading by half in 36 hours. Each build reads 12 of the top stories'
  pages once (`pageOf`) for the outlet's picture (og:image) where the feed
  gave none, and 12 more of Taiwan's outlets' (`CLIPS_AT`: 公視, 華視, 中天,
  東森, 中央社, 聯合, TVBS, 三立, ETtoday, 中時…) for a story with fewer than 2
  clips: the video in the article, a YouTube clip (VideoObject, og:video, the
  article's player, late-loaded too) or else the outlet's own player (三立's,
  中天's, 聯合影音's: a clip with id '', opened on its site). A clip on a page of
  another story is the box beside every article, dropped; each new YouTube id
  is asked once whether it's a Short (`shortOf`). A story shows up to 6
  clips (`CLIPS_SHOWN`): those that play here first (its articles' own, then
  the channels' matched by `matchClips`: near the story's middle, or a little
  less near and near one headline too, `CLIP_LOOSE`), each outlet once before
  twice, then the outlets' own video pages to fill. Writes
  `news/index.json` (stories heard of in 3 days, 180 Taiwan's, 140 the
  world's) and `news/past.json` (older ones by importance, each outlet's
  newest headline); its state in R2 `private/news/items.json.gz`. No AI. A
  story: `{ id, title, by, sum, sumBy, img, imgBy, at, first, n, m, days,
  sides, blind, parties, topics, imp, clips: [[outlet, youtubeId or '', url,
  title, picture]], items: [[outlet, headline, url, at, video?]], alts:
  [[picture, outlet]] (other outlets', tried in turn when img won't load) }`;
  `blind` is the side that left it out, or all but (`blindOf`, `oneSidedOf`:
  a topic sides take, 2 hours or more, 8 outlets or more, 4 or more on one
  end and a token one or two on the other, the lead past the day's front's,
  as important as the front's middle story or more).
  Also `news/sport.json` (Jay 11-13, for Orbit Sports' 相關新聞): the sports
  stories of 3 days, one outlet's report too (never on News' own pages), each
  with its kind (`k`: injury, ban, coach, move; kit `news-sport.mjs`) and the
  AI's reading of its names (`who`, `builders/ai.js` news-sport). Sports
  links one as `#s=<id>`; `hooks.sport` reads the pack only for such a link.
- **The outlets** (Orbit-Core `kit/news-outlets.mjs`, one table for the
  builder and the app): each outlet's name, site, owner, kind, its place on
  藍綠 (`tw`), 統獨 (`cs`) or left–right (`lr`: AllSides', else Media
  Bias/Fact Check's), and the sources for it (`BASIS`, `weak` where it rests
  on owner, group or stance alone; Taiwan's TV by TEDS 2019's question on
  each channel's colour, `teds2019`: deep where named as often as 中天,
  leaning where 5 points apart). Every outlet has a place (no 未評) but China's
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
| `lib/stories.mjs` | The page as read (`cleanPage`), a story's bar, headlines by side, 官媒, one-sided groups (`oneSided`, `blindAll`, `oneSideOf`), topics, clips |
| `lib/mine.mjs`, `brief.mjs`, `learn.mjs` | The family's links: 你關心的 (Securities' holdings, Sports' follows; `namesRe`); 今天五則 (code only, kit `feedback.mjs` as `news`); 新聞學單字 (Words' `vocab.learning`) |
| `lib/markets.mjs` | 預測市場: Polymarket's chances on a story's question (Orbit-Core `builders/news-markets.js` → `news/markets.json`, every 30 minutes; nothing shown past 3 hours old), drawn in the sheet's `oddsPart` |
| `lib/lines.mjs`, `sides.mjs` | The AI made once by Orbit-Core `builders/ai.js`: world stories' Chinese titles and Taiwan's English ones (`news/lines.json`); 各方怎麼說 (`news/sides.json`) |
| `lib/tr.mjs` | One language: plain translation (Orbit-Core `translate.js`, Google), never the AI's: titles and top summaries ahead (`news/tr.json`), a sheet's outlet words as it shows (POST `/news-tr`), the outlet's own till then |
| `lib/search.mjs`, `views/search.mjs` | 搜尋, on the phone as each letter is typed (`findStories`, `fold`), recent searches |
| `lib/reading.mjs`, `pics.mjs` | 我的閱讀's log, the read marks (`markRead`, `readState`) and the follows (`setFollow`, keys `w:` words, `t:` topic, `o:` outlet), the Pass payload `{ v: 1, days, read, follow }`; an outlet's picture at the size shown (`sized`, `heavy`) |
| `lib/follows.mjs`, `views/follows.mjs` | What's followed (`followFinds`, `followedOf`, `lifted`: News' follows and the family's, `lib/mine.mjs`; `yourStories` the five most important), 你可能錯過 (`missedOf`); 我的追蹤's sheet (`openFollows`) and the follow pill (kit `followButton`) |
| `lib/briefs.mjs` | 重點整理: our points on the top stories (Orbit-Core `builders/ai.js` `newsBriefs` → `news/briefs.json`) |
| `views/video.mjs` | 影音: the region's stories with clips, a card each (best clip playing in place, title and one line, every outlet's clip, coverage, 完整報導 at the same second), 下一則 and on at a clip's end; `stopVideo`, `videoPlaying` (app.mjs holds redraws while one plays) |
| `views/parts.mjs`, `lists.mjs`, `story.mjs`, `outlets.mjs` | Rows, cards, the carousel; 頭條, 台灣 / 國際, 單邊; a story's sheet (重點整理 and 看全文, player, coverage, sides, 台灣媒體怎麼報, 看法案 from `news/laws.json`, 來龍去脈 and 相關新聞 from `lib/stories.mjs` `timelineOf`, `relatedOf`, the foot); 媒體 |
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
