// The deploy's version stamp (scripts/stamp-version.mjs) on a copy of the
// page: every relative import gets the same ?v=, so each module is loaded
// once (a file imported both stamped and unstamped would be two modules,
// with two copies of the app's state).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, readdirSync, statSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test("every relative module import is stamped with its file's hash, ../ included", () => {
  const dir = mkdtempSync(join(tmpdir(), 'stamp-'));
  try {
    const src = new URL('../public/', import.meta.url).pathname;
    cpSync(src, dir, { recursive: true, filter: () => true });
    execFileSync(process.execPath, [new URL('../scripts/stamp-version.mjs', import.meta.url).pathname, 'T1', dir]);
    const walk = d => readdirSync(d).flatMap(f => (statSync(join(d, f)).isDirectory() ? (f === 'data' ? [] : walk(join(d, f))) : /\.(m?js)$/.test(f) ? [join(d, f)] : []));
    let checked = 0;
    for (const file of walk(dir)) {
      for (const m of readFileSync(file, 'utf8').matchAll(/(?:from|import\()\s*['"](\.{1,2}\/[^'"]+)['"]/g)) {
        assert.match(m[1], /\?v=[0-9a-f]{10,12}$/, `${file}: ${m[1]}`);
        checked++;
      }
    }
    assert.ok(checked > 8, String(checked));
    const html = readFileSync(join(dir, 'index.html'), 'utf8');
    assert.match(html, /content="T1"/);
    assert.match(html, /modulepreload" href="\.\/shell\.mjs\?v=[0-9a-f]{10,12}"/);
    // The kit modules too, all asked for with the page (kit/preload.mjs), the
    // kit's own imports included (the built kit's go through the import map).
    // Which kit files are listed is the kit's business (it renames and drops
    // them), so only the shape and the one every screen uses are checked.
    assert.match(html, /<!-- \/kit:head -->\n<script>\[(?:'[a-z0-9-]+\.mjs',){3,}[^\]]*'ui\.mjs'[^\]]*\]\.forEach/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
