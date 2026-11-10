# Orbit News: every feature and the code that makes it

Each line names the files and the marks (a function, a class, a string) that
make a feature; `tests/features.test.mjs` fails when one goes missing. To
remove a feature on purpose, delete its line in the same commit.

## The stories

- Stories read from the builder's page, painted at once from the phone's copy — `public/app.mjs`: `packJson(PAGE`, `peekPack`, `cleanPage`
- A new build looked for every 5 minutes and on coming back — `public/app.mjs`: `5 * 60_000`, `visibilitychange`
- Pull to refresh — `public/app.mjs`: `pullToRefresh`
- A story's bar: each side's outlets as lengths, the counts in words — `public/views/parts.mjs`, `public/lib/stories.mjs`: `export function bar`, `export function counts`, `export function barOf`
- A one-sided story says which side left it out — `public/views/parts.mjs`: `story.blind`, `沒報`
- The lead story with its picture, credited to its outlet — `public/views/parts.mjs`: `export function leadCard`, `圖：`
- When the stories were gathered, and that headlines and pictures are the outlets' own — `public/views/parts.mjs`: `export function builtLine`

## The tabs

- 頭條: the lead story, Taiwan's and the world's widest, the one-sided ones, your reading in a line — `public/views/lists.mjs`: `export function renderTop`, `export function readingLine`
- 台灣 and 國際: every story, by most outlets or the latest, 20 at a time — `public/views/lists.mjs`, `public/lib/stories.mjs`: `export function renderRegion`, `最多家報`, `export function ordered`
- 單邊: stories only one side carries, grouped by the side that left them out — `public/views/lists.mjs`, `public/lib/stories.mjs`: `export function renderSide`, `export function oneSided`
- 媒體: your reading by side (Taiwan's and the world's), every outlet on its line — `public/views/outlets.mjs`: `export function renderOutlets`, `TW_PLACES`, `INTL_PLACES`
- A tab or a story from the address (#intl, #s=<id>) — `public/app.mjs`: `function openFromHash`, `s=(\w+)`

## The sheets

- A story: picture and summary credited, the bar, which parties its headlines name, every side's headlines side by side, a side with none saying so — `public/views/story.mjs`: `export function openStory`, `function sideCard`, `標題提到`, `的媒體報這則`
- A headline opens the outlet's own page and counts for 我的閱讀 — `public/shell.mjs`: `export function outletLink`, `hooks.read(o)`
- An outlet: its owner, its place on each line, why (each source linked), its recent stories — `public/views/outlets.mjs`: `export function openOutlet`, `BASIS`, `依據較弱`

## 我的閱讀

- Which outlets were opened, a day at a time, never which article — `public/lib/reading.mjs`: `export function addRead`, `KEEP_DAYS`
- Kept on the Orbit Pass, merged with the phone's copy, never counted twice — `public/app.mjs`, `public/lib/reading.mjs`: `passSync(q`, `export function mergeLogs`, `orbit-news.log.v1`
- The balance by side over 30 days, and what it says — `public/lib/reading.mjs`: `export function balanceOf`, `export function leanOf`
