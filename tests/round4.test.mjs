// 11-17 round 4: the app's own wiring, read from its source (the boot and its
// events need a browser; these lines are what the fixes rest on).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../public/app.mjs', import.meta.url), 'utf8');

// Back after 10 minutes away with a clip playing in 影音: the feed was drawn
// anew at once and the clip was gone; it's drawn once the clip stops.
test('back from away: a playing clip holds the redraw', () => {
  const vis = app.slice(app.indexOf("addEventListener('visibilitychange'"), app.indexOf('\n});', app.indexOf("addEventListener('visibilitychange'")));
  assert.match(vis, /anew && state\.loaded && \(videoPlaying\(\) \? quietRefresh\(\) : render\(\)\)/);
});

// A pull, the refresh button and a list's 重新整理 cleared the held order but
// drew nothing unless the build was new: the lists stayed as they were, then
// reshuffled later on their own. All three rank anew and draw after the read.
test('a pull ranks the lists anew and draws them once read', () => {
  assert.match(app, /const pulled = \(\) => \(state\.held\.clear\(\), Promise\.resolve\(load\(\{ fresh: true \}\)\)\.then\(\(\) => \(stamp\+\+, quietRefresh\(\)\)\)\);/);
  assert.match(app, /hooks\.reload = pulled;/);
  assert.match(app, /topActions\(q, \{ refresh: pulled \}\);/);
});

// A pass merged into this one: its reading and follows absorbed from the
// inbox were never written back, so no other device saw them.
test('an absorbed inbox is written back to the Pass', () => {
  const boot = app.slice(app.indexOf('async function boot()'));
  const absorbAt = boot.indexOf('absorb(decodeLog(item.payload)');
  const changedAt = boot.indexOf('if (signed?.inbox?.length) pass.changed();');
  assert.ok(absorbAt > 0 && changedAt > absorbAt, 'pass.changed() after the inbox is absorbed');
  assert.ok(changedAt < boot.indexOf('pass.watch();'), 'and before the Pass is watched');
});

// The older stories were read once a session: a story that left the front
// while News stayed open in Orbit was in neither copy, and a link to it from
// Securities or Law said 「這則新聞已經不在了」 though past.json had it.
test('the older stories are read again once the front has moved on', () => {
  const shell = readFileSync(new URL('../public/shell.mjs', import.meta.url), 'utf8');
  const story = readFileSync(new URL('../public/views/story.mjs', import.meta.url), 'utf8');
  const search = readFileSync(new URL('../public/views/search.mjs', import.meta.url), 'utf8');
  const line = shell.match(/export const pastOld = (\(\) => .*);/)[1];
  const state = { past: null, pastFor: null, page: { built: 1 } };
  const pastOld = new Function('state', `return ${line}`)(state);
  assert.equal(pastOld(), false, 'nothing read yet: not old, just unread');
  Object.assign(state, { past: { tw: [] }, pastFor: 1 });
  assert.equal(pastOld(), false, 'read beside this front');
  state.page = { built: 2 };
  assert.equal(pastOld(), true, 'the front moved on');
  assert.match(app, /state\.pastFor = state\.page\?\.built \?\? null;/);
  assert.match(app, /packJson\(PAST, \{ ttl: pastOld\(\) \? 0 :/);
  assert.match(story, /const past = \(\) => \(state\.past && !pastOld\(\) \? gone\(\) : hooks\.past\(\)\.then\(again\)\);/);
  assert.match(search, /if \(\(!state\.past \|\| pastOld\(\)\) && !pastAsked\)/);
  // (Drawn before pastAsked is let go: a failed read never asks in a loop.)
  assert.match(search, /hooks\.past\(\)\?\.then\?\.\(\(\) => \(query\.trim\(\) && drawResults\(\), \(pastAsked = false\)\)\);/);
});

// 我的閱讀 counted a read for every clip player made: one clip chosen in 影音
// counted three times (its tap, the next story's clip playing on by itself,
// 完整報導 going on with it in the sheet). Only a clip chosen counts.
test('a clip counts as read once, when chosen', () => {
  const story = readFileSync(new URL('../public/views/story.mjs', import.meta.url), 'utf8');
  const video = readFileSync(new URL('../public/views/video.mjs', import.meta.url), 'utf8');
  assert.match(story, /export function player\(clip, \{ start = 0, onTime = null, onEnd = null, count = true \} = \{\}\) \{\n {2}if \(count\) hooks\.read\(clip\[0\]\);/);
  assert.match(story, /player\(atHead, \{ start, count: !goesOn \}\)/);
  assert.match(story, /draw\(at, \{ clip, start, goesOn \}\);/);
  assert.match(video, /count: !auto,/);
  assert.match(video, /if \(after && now\?\.card === card\) goOn\(after, true\);/);
  assert.match(video, /card\.__play = o => play\(clips\[0\], o\);/);
  assert.match(video, /clip: c\[1\], start: t, goesOn: true/);
  // (下一則 › tapped is chosen: counted.)
  assert.match(video, /onclick: \(\) => goOn\(after\),/);
});

// The English sheet named every law in Chinese (勞動基準法): the builder
// carries the ministry's English name (`ne`, Orbit-Core news-laws.js).
test('a law on the English sheet by its English name where it has one', () => {
  const story = readFileSync(new URL('../public/views/story.mjs', import.meta.url), 'utf8');
  assert.match(story, /title: \(en && typeof l\.ne === 'string' && l\.ne\) \|\| l\.n,/);
});
