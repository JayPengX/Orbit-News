import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Another app shown in Orbit leaves News's frame running, read as hidden (kit
// suite.mjs), and a YouTube clip in it played on behind the other app
// (2026-11-17, proven with a stand-in player: no command reached it). Out of
// sight a clip playing is paused; back, it goes on from that second; one the
// person paused or played out is left as it is.
const src = readFileSync(new URL('../public/views/story.mjs', import.meta.url), 'utf8');

test('every clip player is known, with the state YouTube says it is in', () => {
  const fn = src.slice(src.indexOf('export function player('), src.indexOf('\n}\n', src.indexOf('export function player(')));
  assert.match(fn, /players\.add\(me\)/);
  assert.match(fn, /m\?\.event === 'onStateChange'[^\n]*me\.state = Number\(m\.info\)/);
  assert.match(fn, /m\?\.event === 'infoDelivery'[^\n]*me\.state = m\.info\.playerState/);
});

test('out of sight a playing clip is paused, and played again on return', () => {
  const watch = src.slice(src.indexOf("document.addEventListener('visibilitychange'"), src.indexOf('export function player('));
  assert.match(watch, /away && p\.state !== 0 && p\.state !== 2\) \(command\(p\.frame, 'pauseVideo'\), \(p\.held = true\)\)/);
  assert.match(watch, /!away && p\.held\) \(command\(p\.frame, 'playVideo'\), \(p\.held = false\)\)/);
  assert.match(src, /JSON\.stringify\(\{ event: 'command', func, args: \[\] \}\)/);
});
