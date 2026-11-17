// A list of parts spread into the page never carries a missing one: the
// browser's replaceChildren and append write null as the text "null" (a
// story with no clips showed it under its coverage card, 11-10).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const dir = new URL('../public/views/', import.meta.url);
test('parts spread into the page are filtered of missing ones', () => {
  for (const f of readdirSync(dir).filter(f => f.endsWith('.mjs'))) {
    const src = readFileSync(new URL(f, dir), 'utf8');
    for (const [, name] of src.matchAll(/(?:replaceChildren|append)\(\.\.\.(\w+)\(/g)) {
      const body = src.slice(src.indexOf(`function ${name}(`));
      assert.ok(body.indexOf('function ') >= 0, `${f}: ${name} is defined here`);
      const end = body.search(/\n}\n/);
      assert.match(body.slice(0, end), /\]\.filter\(Boolean\);/, `${f}: ${name}'s parts filtered`);
    }
  }
});

// 11-17: with the news' source down and nothing kept, the screen said
// "連上網路後再試一次" to a phone that was online, and read again only at the
// next 5-minute look or a tap: it says the source isn't answering, and the
// app reads again in 30 s and the moment the phone is back online.
test('nothing read: said as the source not answering when online, and read again soon and on coming online', () => {
  const lists = readFileSync(new URL('../public/views/lists.mjs', import.meta.url), 'utf8');
  const app = readFileSync(new URL('../public/app.mjs', import.meta.url), 'utf8');
  assert.match(lists, /navigator\.onLine === false \? W\('連上網路後再試一次。'/);
  assert.match(app, /addEventListener\('online', \(\) => !state\.page && load\(\)\)/);
  const failed = app.slice(app.indexOf('.catch(() => {\n      state.failed = !state.page;'), app.indexOf('.finally(', app.indexOf('state.failed = !state.page;')));
  assert.match(failed, /again\(\)/, 'a failed read with nothing kept is read again on its own');
  assert.match(app, /function again\(\) \{[^}]*setTimeout\([^;]*load\(\), 30_000\)/);
});
