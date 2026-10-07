#!/usr/bin/env node
// Replays the chain rule through every exercise's gradient data and verifies
// that each node's upstream value and downstream products are consistent.
// The exercise data lives inline in index.html between //__DATA__ markers;
// this script extracts it and checks the math. Exit code 1 on any failure.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const m = html.match(/\/\/__DATA__\n([\s\S]*?)\n\/\/\/DATA__/);
if (!m) {
  console.error('FAIL: //__DATA__ … ///DATA__ markers not found in index.html');
  process.exit(1);
}
const { EXS } = new Function(`${m[1]}\nreturn { EXS };`)();

let failures = 0;
if (EXS.length !== 10) {
  console.error(`FAIL: expected 10 exercises, found ${EXS.length}`);
  failures++;
}
EXS.forEach((ex, xi) => {
  const grad = { 'ℒ': 1 }; // seed: dℒ/dℒ = 1
  ex.N.forEach((n, k) => {
    const have = grad[n.o];
    if (have == null || Math.abs(have - n.U) > 1e-9) {
      failures++;
      console.error(
        `FAIL ex${xi + 1} "${ex.title}" node ${k} (${n.t}): ` +
        `chain rule gives upstream ${have}, data declares U = ${n.U}`
      );
    }
    n.i.forEach(([sym, local]) => {
      grad[sym] = (grad[sym] ?? 0) + local * n.U;
    });
  });
  console.log(`ok   ex${xi + 1}  ${ex.title}`);
});
if (failures) {
  console.error(`\n${failures} failure(s)`);
  process.exit(1);
}
console.log('\nAll exercises consistent: every upstream and downstream value follows from the chain rule.');
