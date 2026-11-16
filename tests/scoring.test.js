const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const items = require("../site/items.js");
const norms = require("../site/norms.js");
const S = require("../site/scoring.js");
const store = require("../site/storage.js");
const personas = require("./personas.js");

test("30 items, 10 per trait, reverse keys match the IPIP key", () => {
  assert.equal(items.length, 30);
  for (const t of ["C", "A", "ES"]) assert.equal(items.filter((i) => i.trait === t).length, 10);
  const rev = items.filter((i) => i.rev).map((i) => i.id).sort();
  assert.deepEqual(rev, ["A1", "A3", "A5", "A7", "C2", "C4", "C6", "C8",
    "N1", "N10", "N3", "N5", "N6", "N7", "N8", "N9"].sort());
});

test("norms cover every age 16-70 with >= 300 peers and full tables", () => {
  for (let a = 16; a <= 70; a++) {
    const e = norms.ages[a];
    assert.ok(e.n >= 300, `age ${a} n=${e.n}`);
    assert.equal(e.M.length, 121);
    for (const t of ["C", "A", "ES"]) assert.equal(e[t].length, 41);
    // percentiles never go down as the score goes up
    for (let i = 1; i < e.M.length; i++) assert.ok(e.M[i] >= e.M[i - 1]);
    assert.ok(e.M[0] >= 0 && e.M[120] <= 100);
  }
});

test("the maturity principle holds in the norms (C, A, ES rise from 18 to 50)", () => {
  for (const t of ["C", "A", "ES", "M"]) assert.ok(norms.ages[50]["mean_" + t] > norms.ages[18]["mean_" + t], t);
});

test("bands use the stated thresholds", () => {
  assert.equal(S.band(24.9), "low");
  assert.equal(S.band(25), "typical");
  assert.equal(S.band(75), "typical");
  assert.equal(S.band(75.1), "high");
});

for (const p of personas) {
  test(`persona: ${p.name}`, () => {
    if (!p.expect.ok) {
      assert.throws(() => S.score(p.answers, p.age, items, norms), RangeError);
      return;
    }
    const r = S.score(p.answers, p.age, items, norms);
    assert.ok(r.maturity.pct >= 0 && r.maturity.pct <= 100);
    if (p.expect.mean !== undefined) assert.equal(r.maturity.mean, p.expect.mean);
    if (p.expect.band) assert.equal(r.maturity.band, p.expect.band);
    if (p.expect.lowConfidence !== undefined) assert.equal(r.lowConfidence, p.expect.lowConfidence);
    assert.ok(store.validResult(r), "result passes storage validation");
  });
}

test("likely range brackets the percentile and uses the measured SEM", () => {
  assert.ok(norms.meta.alpha > 0.8 && norms.meta.alpha < 0.95, `alpha ${norms.meta.alpha}`);
  const r = S.score(Object.fromEntries(items.map((it) => [it.id, 3])), 30, items, norms);
  const [lo, hi] = r.maturity.range;
  assert.ok(lo <= r.maturity.pct && r.maturity.pct <= hi);
  assert.ok(hi - lo > 10 && hi - lo < 50, `width ${hi - lo}`);
});

test("same answers score lower percentile for an older peer group", () => {
  const ans = Object.fromEntries(items.map((it) => [it.id, it.rev ? 2 : 4]));
  const young = S.score(ans, 18, items, norms).maturity.pct;
  const old = S.score(ans, 55, items, norms).maturity.pct;
  assert.ok(young > old, `${young} vs ${old}`);
});

test("a score at the peer median lands near the 50th percentile", () => {
  // keyed 4 on everything is close to the overall mean (~3.4-3.7); check monotonic & sane
  const e = norms.ages[30];
  const medianIdx = e.M.findIndex((p) => p >= 50);
  assert.ok(Math.abs(30 + medianIdx - e.mean_M * 30) < 4, "median within 4 points of mean sum");
});

test("app scoring matches an independent recount on real dataset rows", { skip: !fs.existsSync(path.join(__dirname, "../tools/.cache/data.csv")) }, () => {
  const lines = fs.readFileSync(path.join(__dirname, "../tools/.cache/data.csv"), "utf8").split("\n");
  const head = lines[0].split("\t");
  let checked = 0;
  for (const line of lines.slice(1, 400)) {
    const r = line.split("\t"); if (r.length < head.length) continue;
    const row = Object.fromEntries(head.map((h, i) => [h, r[i]]));
    const age = +row.age; if (!(age >= 16 && age <= 70)) continue;
    const ans = Object.fromEntries(items.map((it) => [it.id, +row[it.id]]));
    if (Object.values(ans).some((x) => x === 0)) continue;
    const res = S.score(ans, age, items, norms);
    // Independent: Emotional Stability = 6 - Neuroticism mean, with N2/N4 reversed for N.
    const nRev = new Set([2, 4]);
    let n = 0; for (let i = 1; i <= 10; i++) { const x = +row["N" + i]; n += nRev.has(i) ? 6 - x : x; }
    assert.ok(Math.abs(res.traits.ES.mean - (6 - n / 10)) < 1e-9);
    checked++;
  }
  assert.ok(checked > 200);
});

test("storage drops malformed history and keeps valid entries", () => {
  const mem = { v: null, getItem() { return this.v; }, setItem(k, v) { this.v = v; }, removeItem() { this.v = null; } };
  const good = S.score(Object.fromEntries(items.map((it) => [it.id, 3])), 30, items, norms);
  mem.v = JSON.stringify({ settings: { theme: "neon", saveHistory: false }, history: [good, { version: 1, age: "<img>" }, null, 5] });
  const d = store.load(mem);
  assert.equal(d.settings.theme, "system");
  assert.equal(d.settings.saveHistory, false);
  assert.equal(d.history.length, 1);
  mem.v = "{not json"; assert.deepEqual(store.load(mem).history, []);
  store.clear(mem); assert.equal(mem.v, null);
});
