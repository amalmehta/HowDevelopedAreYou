// Pure scoring: answers + age + norms -> result. No DOM, no storage.
// Definitions live in docs/SYSTEM-DESIGN.md ("Scoring").
globalThis.HDAY = globalThis.HDAY || {};
(function () {
  const TRAITS = ["C", "A", "ES"];
  const MIN_AGE = 16, MAX_AGE = 99;

  function band(pct) {
    if (pct < 25) return "low";
    if (pct > 75) return "high";
    return "typical";
  }

  function validAge(age) {
    return Number.isInteger(age) && age >= MIN_AGE && age <= MAX_AGE;
  }

  // answers: { itemId: 1..5 }
  function score(answers, age, items, norms) {
    if (!validAge(age)) throw new RangeError(`Age must be a whole number from ${MIN_AGE} to ${MAX_AGE}.`);
    const missing = items.filter((it) => ![1, 2, 3, 4, 5].includes(answers[it.id]));
    if (missing.length) throw new RangeError(`${missing.length} statement(s) not answered.`);

    const sums = { C: 0, A: 0, ES: 0 };
    for (const it of items) {
      const x = answers[it.id];
      sums[it.trait] += it.rev ? 6 - x : x;
    }
    const key = Math.min(Math.max(age, norms.meta.minAge), norms.meta.maxAge);
    const peer = norms.ages[key];
    const traits = {};
    for (const t of TRAITS) {
      const pct = peer[t][sums[t] - 10];
      const e = Math.round(norms.meta.traitSemSum[t]);
      const tAt = (s) => peer[t][Math.min(50, Math.max(10, s)) - 10];
      traits[t] = { mean: sums[t] / 10, pct, range: [tAt(sums[t] - e), tAt(sums[t] + e)], band: band(pct), peerMean: peer["mean_" + t] };
    }
    const total = sums.C + sums.A + sums.ES;
    const mPct = peer.M[total - 30];
    // Likely range: your score +/- one standard error of measurement (~68%).
    const sem = Math.round(norms.meta.semSum);
    const at = (s) => peer.M[Math.min(150, Math.max(30, s)) - 30];
    const range = [at(total - sem), at(total + sem)];
    return {
      version: 1,
      date: new Date().toISOString(),
      age,
      peers: { lo: peer.lo, hi: peer.hi, n: peer.n },
      lowConfidence: peer.lowConfidence || age > norms.meta.maxAge,
      maturity: { mean: total / 30, pct: mPct, range, band: band(mPct), peerMean: peer.mean_M },
      traits,
    };
  }

  // Average maturity by age, for the chart.
  function curve(norms) {
    const out = [];
    // q25/q75: the average-item score where peers cross the 25th and 75th percentile
    const q = (M, p) => (M.findIndex((v) => v >= p) + 30) / 30;
    for (let a = norms.meta.minAge; a <= norms.meta.maxAge; a++) {
      const e = norms.ages[a];
      out.push({ age: a, mean: e.mean_M, q25: q(e.M, 25), q75: q(e.M, 75) });
    }
    return out;
  }

  HDAY.scoring = { score, band, validAge, curve, TRAITS, MIN_AGE, MAX_AGE };
  if (typeof module !== "undefined") module.exports = HDAY.scoring;
})();
