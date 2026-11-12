# Orbit News: every feature and the code that makes it

Each line names the files and the marks (a function, a class, a string) that
make a feature; `tests/features.test.mjs` fails when one goes missing. To
remove a feature on purpose, delete its line in the same commit.

## The stories

- Stories read from the builder's page, painted at once from the phone's copy — `public/app.mjs`: `packJson(PAGE`, `peekPack`, `cleanPage`
- A new build looked for every 5 minutes and on coming back — `public/app.mjs`: `5 * 60_000`, `visibilitychange`
- Pull to refresh on a phone, the kit's refresh button on a computer (spinning while a read runs; run again when the connection comes back) — `public/app.mjs`: `topActions(q, { refresh:`, `button.disabled = true`
- A story's bar: each side's outlets as lengths, the counts in words — `public/views/parts.mjs`, `public/lib/stories.mjs`: `export function bar`, `export function counts`, `export function barOf`
- A story's coverage on its row: the outlets' marks, how many, the bar only for a kind sides take (the spectrum one feature) — `public/views/parts.mjs`, `public/lib/stories.mjs`: `export function coverage`, `export function marks`, `export const sidesTaken`
- 你關心的: on 頭條, the stories about the stocks you hold in Orbit Securities and the teams and players you follow in Orbit Sports, marked 持股 or 追蹤 (`lib/mine.mjs`, `views/lists.mjs`; read from the phone's family notebook, nothing sent).
- 今天五則: on 頭條 from 7:00 each morning, five stories past the headlines picked for you, the topics you open most first and what you hold or follow lifted, numbered with one headline each, the same five all day (`lib/brief.mjs`, `views/lists.mjs`, `views/parts.mjs briefList`; learnt on the phone and the Pass by the kit's `feedback.mjs`, no AI).
- 新聞學單字: on a world story, the words you're learning in Orbit Words underlined in its English headlines and listed as 學單字, each opening its card in Words (`lib/learn.mjs`, `views/story.mjs`; read from the phone's family notebook, nothing sent).
- 看法案: a Taiwan story's 提到的法律, each opening its bill or the law in Orbit Law (`views/story.mjs`, Orbit-Core's `builders/news-laws.js`).
- 各方怎麼說: on a political or world story, each side's angle in a line and the difference that matters most, written by AI from each side's headlines, never who's right (`views/story.mjs` `sidesSay`, Orbit-Core's `builders/ai.js` `newsSides`).
- 國際新聞中文標題: a world story's Chinese headline on a Chinese phone (a Taiwan story's English one on an English phone), the outlets' own under it in the sheet; no AI line under a headline (it only said the headline again, Jay 11-10) — `public/lib/lines.mjs`, `public/views/parts.mjs`: `shownTitle`, `public/views/story.mjs`: `storyTitle`
- China's state media counted apart (官媒), every other outlet on a side — `public/lib/stories.mjs`, `public/views/story.mjs`: `export const stateMedia`, `中國官媒`
- A one-sided story says which side left it out — `public/views/parts.mjs`: `story.blind`, `沒報`
- The lead story with its picture, credited to its outlet — `public/views/parts.mjs`: `export function leadCard`, `圖：`
- Every story's picture beside it in a list, a play mark when it has a clip — `public/views/parts.mjs`: `nw-thumb`, `export const playMark`
- A picture that won't load gives way to another outlet's (the builder's `alts`), its credit following; the space gone only when none load (Jay 11-11) — `public/views/parts.mjs`, `public/lib/stories.mjs`: `const storyPicture`, `export const picturesOf`
- Pictures quick and smooth (Jay 11-11): each asked at the size it's shown from the outlet's own server (19 outlets' smaller sizes, 中天's resizer), the few megabyte ones last in a row, each fading in on its held grey place — `public/lib/pics.mjs`, `public/views/parts.mjs`, `public/news.css`: `export function sized`, `export const heavy`, `nw-pic-wait`
- What a story is about and how long it has run (政治 · 報導 3 天) — `public/views/parts.mjs`: `export function aboutLine`, `報導 ${d} 天`
- When the stories were gathered, and that headlines and pictures are the outlets' own — `public/views/parts.mjs`: `export function builtLine`

## The tabs

- 頭條's lead stories (Taiwan's top three, the world's top two) swiped sideways, a dot each, ‹ › on a computer — `public/views/parts.mjs`, `public/views/lists.mjs`: `export function carousel`, `nw-hero-track`, `const leadsOf`
- 頭條: a front page: the lead stories with their summaries, 要聞 in pictures, the outlets' clips, the world's, each topic's, the one-sided ones, your reading in a line — `public/views/lists.mjs`, `public/views/parts.mjs`: `export function renderTop`, `要聞`, `export function storyCard`, `export function clipCard`, `nw-topic-sec`, `export function readingLine`
- 搜尋 (Jay 11-11): a field atop 頭條 finds any story the phone holds by its headline, summary, any outlet's headline, outlet, topic or party, as you type; found words marked, why it was found, outlets as chips, recent searches, `#q=` — `public/lib/search.mjs`, `public/views/search.mjs`, `public/views/lists.mjs`: `export function findStories`, `export function findOutlets`, `export function withSearch`, `orbit-news.finds.v1`, `nw-found-mark`
- 問 Orbit's question (`#ask=`, the Pass sheet's box) opens 頭條 searched for it — `public/app.mjs`, `public/lib/search.mjs`: `export const askQuery`, `askQuery(m.takeAsk`
- 台灣 and 國際: every story, most important first, by topic (全部, 政治, 兩岸… 生活, 健康, 科學, 文化, 運動, 影音), the topic's lead in its picture, 20 at a time — `public/views/lists.mjs`, `public/lib/stories.mjs`: `export function renderRegion`, `nw-topics`, `nw-region-lead`, `export const onTopic`, `export function topicsIn`
- A swipe across 台灣, 國際 or 單邊 goes to the topic beside, the title and tabs staying put — `public/views/lists.mjs`, `public/app.mjs`: `function swipeTabs`, `q-day-still`
- The older stories kept (a month), asked for at a list's end or by an old link — `public/views/lists.mjs`, `public/app.mjs`, `public/views/story.mjs`: `function pastPart`, `hooks.past =`, `news/past.json`, `state.past`
- 單邊: stories only one side carries, grouped by the side that left them out — `public/views/lists.mjs`, `public/lib/stories.mjs`: `export function renderSide`, `export function oneSided`
- 單邊 by region, side, then kind: a text tab for 台灣 and 國際 (a swipe between), each end's count of stories it left out as a tile that filters to them, then each kind (政治, 兩岸, 經濟…) three at a time with the rest folded — `public/views/lists.mjs`, `public/lib/stories.mjs`: `const sideRegions`, `nw-blind-tile`, `function kindPart`, `export function byKind`
- 媒體: your reading by side (Taiwan's and the world's), every outlet on its line — `public/views/outlets.mjs`: `export function renderOutlets`, `TW_PLACES`, `INTL_PLACES`
- A tab or a story from the address (#intl, #s=<id>) — `public/app.mjs`: `function openFromHash`, `s=(\w+)`

## The sheets

- 快訊 (Jay 11-12, 黃仁勳 resigning sat 19th): a story many outlets carried in the last 2 hours (7, or 10 for an old story's new turn; news, not games) is marked live by Orbit-Core's `builders/news.js` and ranked up; the phone shows a pulsing red 快訊 before its kicker and leads the front page's carousel with it (two at most), while the page is under an hour old and the story was heard of in 2 hours — `public/lib/stories.mjs`, `public/views/parts.mjs`, `public/views/lists.mjs`: `export const isLive`, `export const liveTag`, `nw-live-tag`
- 預測市場 (Jay 11-12): a story's open question as Polymarket's traders price it (黃仁勳 會不會下台, who wins a race): one chance, chances by deadline, or a race's leaders, each a bar with its day's move, the source a tap away; matched in code by Orbit-Core's `builders/news-markets.js`, each pair confirmed by AI (Orbit AI mark), no Taiwan vote's market in its 10 quiet days, nothing past 3 hours old; a story with one says 預測市場 on its row — `public/lib/markets.mjs`, `public/views/story.mjs`, `public/views/parts.mjs`: `export function cleanMarkets`, `function oddsPart`, `nw-odds-card`, `Market odds`
- A story: picture and summary credited, the bar, which parties its headlines name, every side's headlines side by side, a side with none saying so — `public/views/story.mjs`: `export function openStory`, `function sideCard`, `標題提到`, `的媒體報這則`
- A story's clips: the outlet's own YouTube clip played in the sheet (YouTube's privacy-enhanced player), the others in a row, an outlet's video page opened on its site — `public/views/story.mjs`, `public/views/lists.mjs`: `export function player`, `youtube-nocookie.com/embed`, `nw-story-clips`, `export function play`
- Video and news together (Jay 11-10): a tap on a story's picture with a play mark plays its clip at the sheet's top; its other clips right under the story; clips from 25 outlets' YouTube channels, each matched to its story by the builder (Orbit-Core `CHANNELS`, `matchClips`) — `public/views/parts.mjs`, `public/views/story.mjs`: `const tapStory`, `hooks.play`
- How a story's coverage grew, a row a day with its count (columns past a week) — `public/views/story.mjs`: `nw-days`, `每天的報導`
- A story's coverage card: the bar, each side's count, the side that left it out, the parties named; for a kind sides don't take, who covers it — `public/views/story.mjs`: `function spectrum`, `各邊的報導`, `報導的媒體`
- A story's sheet goes to the stories beside it in the list it came from: a swipe, the arrow keys, and a foot that stays at the sheet's bottom (‹ 上一則 · 3 / 20 · 下一則 ›, each headline on a wide sheet) — `public/views/story.mjs`: `function footOf`, `ArrowRight`, `nw-story-foot`, `kitUI.daySwipe`
- A story's headlines grouped by outlet: each outlet's newest, its others folded under it, four outlets a side at first — `public/views/story.mjs`: `function sideCard`, `nw-hl-more`, `nw-side-more`
- A topic's tab lists the stories of that topic with the topic as their tag; a topic with fewer than three stories has no tab — `public/views/lists.mjs`, `public/lib/stories.mjs`: `export const asTopic`, `export const TAB_MIN`
- The videos inside the outlets' articles (Jay 11-12): Taiwan's outlets' pages read for the article's own clip, a YouTube one played here, one on the outlet's own player opened on its site (Orbit-Core `pageOf`, `CLIPS_AT`) — `public/views/parts.mjs`: `到網站看`
- A clip YouTube won't play here (its owner allows it only on YouTube) opens YouTube instead — `public/views/story.mjs`: `enablejsapi=1`, `nw-player-out`
- A world story shows how Taiwan's outlets put it: their bar and headlines by side — `public/views/story.mjs`, `public/lib/stories.mjs`: `function taiwanPart`, `function twOf`
- A headline opens the outlet's own page and counts for 我的閱讀 — `public/shell.mjs`: `export function outletLink`, `hooks.read(o)`
- An outlet: its owner, its place on each line, why (each source linked), its recent stories — `public/views/outlets.mjs`: `export function openOutlet`, `BASIS`, `依據較弱`

## 我的閱讀

- Which outlets were opened, a day at a time, never which article — `public/lib/reading.mjs`: `export function addRead`, `KEEP_DAYS`
- Kept on the Orbit Pass, merged with the phone's copy, never counted twice — `public/app.mjs`, `public/lib/reading.mjs`: `passSync(q`, `export function mergeLogs`, `orbit-news.log.v1`
- The balance by side over 30 days, and what it says — `public/lib/reading.mjs`: `export function balanceOf`, `export function leanOf`
