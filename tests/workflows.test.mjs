// A workflow GitHub can't read fails at once, with no job, and mails Jay
// (11-10: a one-line `run:` with ": " in it). Plain one-line values here
// never hold ": " (a block `|` or quotes do).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';

const dir = new URL('../.github/workflows/', import.meta.url);

test('workflows: no plain one-line value holds ": "', () => {
  for (const f of readdirSync(dir).filter(f => /\.ya?ml$/.test(f))) {
    readFileSync(new URL(f, dir), 'utf8').split('\n').forEach((line, i) => {
      const m = /^\s*(?:-\s+)?[\w-]+:\s+(?![|>'"])(.*)$/.exec(line.replace(/\s+#.*$/, ''));
      if (m && !/\$\{\{/.test(m[1])) assert.ok(!/:\s/.test(m[1]), `${f}:${i + 1}: ${line.trim()}`);
    });
  }
});
