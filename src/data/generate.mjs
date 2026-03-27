import { readFileSync, writeFileSync } from 'fs';

// Read current 5k file, deduplicate, and check count
const dir = '/Users/cravv/Projects/monkey_type_cli/src/data/';

const raw5k = JSON.parse(readFileSync(dir + 'english-5k.json', 'utf8'));
const seen = new Set();
const unique5k = [];
for (const w of raw5k) {
  if (!seen.has(w)) {
    seen.add(w);
    unique5k.push(w);
  }
}
console.log(`5k file: ${raw5k.length} total, ${unique5k.length} unique after dedup`);

const raw1k = JSON.parse(readFileSync(dir + 'english-1k.json', 'utf8'));
const seen1k = new Set();
const unique1k = [];
for (const w of raw1k) {
  if (!seen1k.has(w)) {
    seen1k.add(w);
    unique1k.push(w);
  }
}
console.log(`1k file: ${raw1k.length} total, ${unique1k.length} unique after dedup`);

const raw200 = JSON.parse(readFileSync(dir + 'english-200.json', 'utf8'));
const seen200 = new Set();
const unique200 = [];
for (const w of raw200) {
  if (!seen200.has(w)) {
    seen200.add(w);
    unique200.push(w);
  }
}
console.log(`200 file: ${raw200.length} total, ${unique200.length} unique after dedup`);

// Output the unique lists temporarily so we know what we need to add
console.log(`\nNeed to add to reach targets:`);
console.log(`  200 file: need ${200 - unique200.length} more words`);
console.log(`  1k file: need ${1000 - unique1k.length} more words`);
console.log(`  5k file: need ${5000 - unique5k.length} more words`);
