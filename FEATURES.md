# Orbit News: every feature and the code that makes it

Each line names the files and the marks (a function, a class, a string) that
make a feature; `tests/features.test.mjs` fails when one goes missing. To
remove a feature on purpose, delete its line in the same commit.

## The stories

- Stories read from the builder's page, painted at once from the phone's copy — `public/app.mjs`: `packJson(PAGE`, `peekPack`, `cleanPage`
- A new build looked for every 5 minutes and on coming back — `public/app.mjs`: `5 * 60_000`, `visibilitychange`
- Pull to refresh — `public/app.mjs`: `pullToRefresh`
- A story's bar: each side's outlets as lengths, the counts in words — `public/views/parts.mjs`, `public/lib/stories.mjs`: `export function bar`, `export function counts`, `export function barOf`
- A story's coverage on its row: the outlets' marks, how many, the bar only for a kind sides take (the spectrum one feature) — `public/views/parts.mjs`, `public/lib/stories.mjs`: `export function coverage`, `export function marks`, `export const sidesTaken`
- 一句話講清楚: each story's neutral one line by the AI (built once, from the outlets' own headlines) under its headline, marked with the spark; 國際新聞中文標題: a world story's Chinese headline on a Chinese phone (a Taiwan story's English one on an English phone), the outlets' own under it in the sheet — `public/lib/lines.mjs`, `public/views/parts.mjs`: `shownTitle`, `aiLine`, `public/views/story.mjs`: `storyTitle`
- China's state media counted apart (官媒), every other outlet on a side — `public/lib/stories.mjs`, `public/views/story.mjs`: `export const stateMedia`, `中國官媒`
- A one-sided story says which side left it out — `public/views/parts.mjs`: `story.blind`, `沒報`
- The lead story with its picture, credited to its outlet — `public/views/parts.mjs`: `export function leadCard`, `圖：`
- Every story's picture beside it in a list, a play mark when it has a clip — `public/views/parts.mjs`: `nw-thumb`, `export const playMark`
- What a story is about and how long it has run (政治 · 報導 3 天) — `public/views/parts.mjs`: `export function aboutLine`, `報導 ${d} 天`
- When the stories were gathered, and that headlines and pictures are the outlets' own — `public/views/parts.mjs`: `export function builtLine`

## The tabs

- 頭條's lead stories (Taiwan's top three, the world's top two) swiped sideways, a dot each, ‹ › on a computer — `public/views/parts.mjs`, `public/views/lists.mjs`: `export function carousel`, `nw-hero-track`, `const leadsOf`
- 頭條: a front page: the lead stories with their summaries, 要聞 in pictures, the outlets' clips, the world's, each topic's, the one-sided ones, your reading in a line — `public/views/lists.mjs`, `public/views/parts.mjs`: `export function renderTop`, `要聞`, `export function storyCard`, `export function clipCard`, `nw-topic-sec`, `export function readingLine`
- 台灣 and 國際: every story, most important first, by topic (全部, 政治, 兩岸… 生活, 健康, 科學, 文化, 運動, 影音), the topic's lead in its picture, 20 at a time — `public/views/lists.mjs`, `public/lib/stories.mjs`: `export function renderRegion`, `nw-topics`, `nw-region-lead`, `export const onTopic`, `export function topicsIn`
- A swipe across 台灣, 國際 or 單邊 goes to the topic beside, the title and tabs staying put — `public/views/lists.mjs`, `public/app.mjs`: `function swipeTabs`, `q-day-still`
- The older stories kept (a month), asked for at a list's end or by an old link — `public/views/lists.mjs`, `public/app.mjs`, `public/views/story.mjs`: `function pastPart`, `hooks.past =`, `news/past.json`, `state.past`
- 單邊: stories only one side carries, grouped by the side that left them out — `public/views/lists.mjs`, `public/lib/stories.mjs`: `export function renderSide`, `export function oneSided`
- 單邊 by region, side, then kind: a text tab for 台灣 and 國際 (a swipe between), each end's count of stories it left out as a tile that filters to them, then each kind (政治, 兩岸, 經濟…) three at a time with the rest folded — `public/views/lists.mjs`, `public/lib/stories.mjs`: `const sideRegions`, `nw-blind-tile`, `function kindPart`, `export function byKind`
- 媒體: your reading by side (Taiwan's and the world's), every outlet on its line — `public/views/outlets.mjs`: `export function renderOutlets`, `TW_PLACES`, `INTL_PLACES`
- A tab or a story from the address (#intl, #s=<id>) — `public/app.mjs`: `function openFromHash`, `s=(\w+)`

## The sheets

- A story: picture and summary credited, the bar, which parties its headlines name, every side's headlines side by side, a side with none saying so — `public/views/story.mjs`: `export function openStory`, `function sideCard`, `標題提到`, `的媒體報這則`
- A story's clips: the outlet's own YouTube clip played in the sheet (YouTube's privacy-enhanced player), the others in a row, an outlet's video page opened on its site — `public/views/story.mjs`, `public/views/lists.mjs`: `export function player`, `youtube-nocookie.com/embed`, `nw-story-clips`, `export function play`
- Video and news together (Jay 11-10): a tap on a story's picture with a play mark plays its clip at the sheet's top; its other clips right under the story; clips from 25 outlets' YouTube channels, each matched to its story by the builder (Orbit-Core `CHANNELS`, `matchClips`) — `public/views/parts.mjs`, `public/views/story.mjs`: `const tapStory`, `hooks.play`
- How a story's coverage grew, a bar a day — `public/views/story.mjs`: `nw-days`, `每天的報導`
- A story's coverage card: the bar, each side's count, the side that left it out, the parties named; for a kind sides don't take, who covers it — `public/views/story.mjs`: `function spectrum`, `各邊的報導`, `報導的媒體`
- A story's sheet goes to the stories beside it in the list it came from: a swipe, the arrow keys, and a foot that stays at the sheet's bottom (‹ 上一則 · 3 / 20 · 下一則 ›, each headline on a wide sheet) — `public/views/story.mjs`: `function footOf`, `ArrowRight`, `nw-story-foot`, `kitUI.daySwipe`
- A story's headlines grouped by outlet: each outlet's newest, its others folded under it, four outlets a side at first — `public/views/story.mjs`: `function sideCard`, `nw-hl-more`, `nw-side-more`
- A topic's tab lists the stories of that topic with the topic as their tag; a topic with fewer than three stories has no tab — `public/views/lists.mjs`, `public/lib/stories.mjs`: `export const asTopic`, `export const TAB_MIN`
- A clip YouTube won't play here (its owner allows it only on YouTube) opens YouTube instead — `public/views/story.mjs`: `enablejsapi=1`, `nw-player-out`
- A world story shows how Taiwan's outlets put it: their bar and headlines by side — `public/views/story.mjs`, `public/lib/stories.mjs`: `function taiwanPart`, `function twOf`
- A headline opens the outlet's own page and counts for 我的閱讀 — `public/shell.mjs`: `export function outletLink`, `hooks.read(o)`
- An outlet: its owner, its place on each line, why (each source linked), its recent stories — `public/views/outlets.mjs`: `export function openOutlet`, `BASIS`, `依據較弱`

## 我的閱讀

- Which outlets were opened, a day at a time, never which article — `public/lib/reading.mjs`: `export function addRead`, `KEEP_DAYS`
- Kept on the Orbit Pass, merged with the phone's copy, never counted twice — `public/app.mjs`, `public/lib/reading.mjs`: `passSync(q`, `export function mergeLogs`, `orbit-news.log.v1`
- The balance by side over 30 days, and what it says — `public/lib/reading.mjs`: `export function balanceOf`, `export function leanOf`
