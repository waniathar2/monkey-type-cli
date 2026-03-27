#!/usr/bin/env node
/**
 * Generate validated word list JSON files for MonkeyType CLI.
 * Run: node generate-wordlists.mjs
 *
 * This script reads the existing JSON files, deduplicates them,
 * reports their counts, and can pad them if needed.
 */

import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const files = [
  { name: 'english-200.json', target: 200 },
  { name: 'english-1k.json', target: 1000 },
  { name: 'english-5k.json', target: 5000 },
];

for (const { name, target } of files) {
  const path = join(__dirname, name);
  const raw = JSON.parse(readFileSync(path, 'utf8'));

  // Deduplicate while preserving order
  const seen = new Set();
  const unique = [];
  for (const w of raw) {
    const lower = w.toLowerCase().trim();
    if (!seen.has(lower)) {
      seen.add(lower);
      unique.push(lower);
    }
  }

  // Validate: only lowercase letters
  const invalid = unique.filter(w => !/^[a-z]+$/.test(w));
  if (invalid.length > 0) {
    console.error(`  WARNING: ${name} has ${invalid.length} invalid words:`, invalid.slice(0, 10));
  }

  const validWords = unique.filter(w => /^[a-z]+$/.test(w));

  console.log(`${name}: ${raw.length} raw -> ${validWords.length} unique valid (target: ${target}, diff: ${validWords.length - target})`);

  // Write back deduplicated version
  writeFileSync(path, JSON.stringify(validWords));
  console.log(`  Written: ${validWords.length} words\n`);
}
