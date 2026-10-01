import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

// Regression for the PMI brand-colour commit, which search-and-replaced the apostrophe entity
// `&#039;` with a colour hex in every hand-rolled HTML-escape helper, leaving `&#2A0C5A;`. A
// browser reads that as the control character U+0002 followed by literal "A0C5A;", so every
// user-authored apostrophe ("Kim's course") rendered as garbage on the dashboard, outline and QA.

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

async function sourceFiles(dir) {
  const entries = await readdir(join(repoRoot, dir), { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const rel = `${dir}/${entry.name}`;
    if (entry.isDirectory()) files.push(...await sourceFiles(rel));
    else if (entry.isFile() && /\.(js|mjs|html)$/.test(entry.name)) files.push(rel);
  }
  return files;
}

describe('HTML character references in source', () => {
  test('every numeric character reference is well-formed (decimal or x-prefixed hex)', async () => {
    const files = [...await sourceFiles('js'), ...await sourceFiles('components'), 'app.js', 'index.html'];
    const bad = [];
    for (const file of files) {
      const text = await readFile(join(repoRoot, file), 'utf8');
      // `&#` must be followed by digits, or by x/X and hex digits, then `;`. Anything else
      // (e.g. `&#2A0C5A;`) is a broken reference the browser silently mangles.
      for (const match of text.matchAll(/&#(?!\d+;)(?![xX][0-9A-Fa-f]+;)[0-9A-Za-z]*;/g)) {
        bad.push(`${file}: ${match[0]}`);
      }
    }
    expect(bad).toEqual([]);
  });

  test('every hand-rolled HTML apostrophe escape produces a real apostrophe reference', async () => {
    const files = [...await sourceFiles('js'), 'app.js'];
    const wrong = [];
    for (const file of files) {
      const text = await readFile(join(repoRoot, file), 'utf8');
      for (const match of text.matchAll(/\.replace\(\/'\/g,\s*'([^']*)'\)/g)) {
        // Only HTML-entity escapes are in scope; `%27` (URL encoding) and `\u0027` (JS string
        // escaping) are different, legitimate escapes.
        if (match[1].startsWith('&') && !['&#39;', '&#039;', '&apos;'].includes(match[1])) wrong.push(`${file}: replaces ' with ${match[1]}`);
      }
    }
    expect(wrong).toEqual([]);
  });
});
