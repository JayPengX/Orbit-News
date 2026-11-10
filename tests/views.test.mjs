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
