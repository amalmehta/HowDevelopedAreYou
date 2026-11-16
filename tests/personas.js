// Sample takers covering the normal case, edge cases and failures.
// Each builds an answers object from a rule; `expect` is what scoring should do.
const items = require("../site/items.js");

const fill = (f) => Object.fromEntries(items.map((it) => [it.id, f(it)]));
// Answer as if your keyed score on every item were k (undoes the reverse key).
const keyed = (k) => fill((it) => (it.rev ? 6 - k : k));

module.exports = [
  { name: "Typical 29-year-old (keyed 4 on C, 4 on A, 3 on ES)", age: 29,
    answers: fill((it) => { const k = it.trait === "ES" ? 3 : 4; return it.rev ? 6 - k : k; }),
    expect: { ok: true } },
  { name: "All neutral (3s)", age: 35, answers: fill(() => 3), expect: { ok: true, mean: 3 } },
  { name: "Most mature possible", age: 22, answers: keyed(5), expect: { ok: true, mean: 5, band: "high" } },
  { name: "Least mature possible", age: 22, answers: keyed(1), expect: { ok: true, mean: 1, band: "low" } },
  { name: "Straight-liner: always 'Agree' (5)", age: 40, answers: fill(() => 5), expect: { ok: true } },
  { name: "Youngest allowed (16)", age: 16, answers: keyed(4), expect: { ok: true } },
  { name: "Older than the norms (85)", age: 85, answers: keyed(4), expect: { ok: true, lowConfidence: true } },
  { name: "Age 63 (thin norms)", age: 63, answers: keyed(3), expect: { ok: true, lowConfidence: true } },
  { name: "Too young (15)", age: 15, answers: keyed(3), expect: { ok: false } },
  { name: "Age not a whole number", age: 30.5, answers: keyed(3), expect: { ok: false } },
  { name: "Three answers missing", age: 30,
    answers: (() => { const a = keyed(3); delete a.C1; delete a.A5; delete a.N9; return a; })(),
    expect: { ok: false } },
  { name: "Out-of-range answer (6)", age: 30, answers: { ...keyed(3), C3: 6 }, expect: { ok: false } },
];
