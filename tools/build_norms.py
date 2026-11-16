"""Build peer-percentile norms for How Developed Are You? from the open
openpsychometrics.org BIG5 dataset, and print a validity report.

    python3 tools/build_norms.py            # writes site/norms.js
    python3 tools/build_norms.py --report   # also prints the age-signal checks

Only derived percentile tables are written; no individual records.
"""
import io, json, os, sys, urllib.request, zipfile, datetime
import numpy as np

URL = "https://openpsychometrics.org/_rawdata/BIG5.zip"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, "tools", ".cache")
OUT = os.path.join(ROOT, "site", "norms.js")

MIN_AGE, MAX_AGE = 16, 70          # ages with their own table; older ages use 70
BASE_WINDOW, MIN_PEERS = 3, 300    # +/-3 years, widened until n >= 300
LOW_CONF_WINDOW = 6

# Items keyed toward the trait as named (Emotional Stability, Agreeableness,
# Conscientiousness). Reverse-keyed items score 6 - x.
REVERSE = {
    "ES": {1, 3, 5, 6, 7, 8, 9, 10},  # dataset N items; only N2, N4 point to stability
    "A": {1, 3, 5, 7},
    "C": {2, 4, 6, 8},
}
PREFIX = {"ES": "N", "A": "A", "C": "C"}


def load():
    path = os.path.join(CACHE, "data.csv")
    if not os.path.exists(path):
        os.makedirs(CACHE, exist_ok=True)
        print("downloading", URL, file=sys.stderr)
        raw = urllib.request.urlopen(URL, timeout=60).read()
        with zipfile.ZipFile(io.BytesIO(raw)) as z:
            with open(path, "wb") as f:
                f.write(z.read("BIG5/data.csv"))
    rows = [l.rstrip("\n").split("\t") for l in open(path, encoding="utf-8", errors="replace")]
    head, rows = rows[0], rows[1:]
    col = {h: i for i, h in enumerate(head)}
    ages, sums = [], {t: [] for t in REVERSE}
    dropped = {"missing": 0, "age": 0}
    items = []
    for r in rows:
        try:
            age = int(r[col["age"]])
        except ValueError:
            dropped["age"] += 1
            continue
        if not (MIN_AGE <= age <= 80):     # 80+ entries are mostly typos (e.g. 1990)
            dropped["age"] += 1
            continue
        vals = {}
        keyed = []
        ok = True
        for t, rev in REVERSE.items():
            s = 0
            for i in range(1, 11):
                x = int(r[col[f"{PREFIX[t]}{i}"]])
                if x == 0:
                    ok = False
                    break
                k = 6 - x if i in rev else x
                s += k
                keyed.append(k)
            if not ok:
                break
            vals[t] = s
        if not ok:
            dropped["missing"] += 1
            continue
        ages.append(age)
        items.append(keyed)
        for t in REVERSE:
            sums[t].append(vals[t])
    ages = np.array(ages)
    sums = {t: np.array(v) for t, v in sums.items()}
    sums["M"] = sums["ES"] + sums["A"] + sums["C"]
    return ages, sums, np.array(items, float), len(rows), dropped


def reliability(items):
    """Cronbach's alpha of the 30-item maturity sum, and its standard error of
    measurement (SEM) in sum points. An estimate: alpha reflects item
    consistency within one sitting, not day-to-day change."""
    k = items.shape[1]
    total = items.sum(1)
    alpha = k / (k - 1) * (1 - items.var(0, ddof=1).sum() / total.var(ddof=1))
    sem = total.std(ddof=1) * (1 - alpha) ** 0.5
    return round(float(alpha), 3), round(float(sem), 2)


def midrank_table(scores, lo, hi):
    """Percentile (mid-rank) for every possible integer sum lo..hi."""
    n = len(scores)
    counts = np.bincount(scores - lo, minlength=hi - lo + 1)
    below = np.concatenate([[0], np.cumsum(counts)[:-1]])
    return [round(float(100 * (b + c / 2) / n), 1) for b, c in zip(below, counts)]


def build(ages, sums):
    table = {}
    for age in range(MIN_AGE, MAX_AGE + 1):
        w = BASE_WINDOW
        while True:
            m = (ages >= age - w) & (ages <= age + w)
            if m.sum() >= MIN_PEERS or w > 40:
                break
            w += 1
        entry = {"n": int(m.sum()), "lo": int(max(age - w, MIN_AGE)), "hi": int(age + w),
                 "lowConfidence": bool(age >= 60 or w > LOW_CONF_WINDOW)}
        for t in ("ES", "A", "C"):
            entry[t] = midrank_table(sums[t][m], 10, 50)
            entry["mean_" + t] = round(float(sums[t][m].mean() / 10), 3)
        entry["M"] = midrank_table(sums["M"][m], 30, 150)
        entry["mean_M"] = round(float(sums["M"][m].mean() / 30), 3)
        table[age] = entry
    return table


def report(ages, sums):
    """Can personality predict age? Held-out check (seeded)."""
    rng = np.random.default_rng(0)
    X = np.stack([sums[t] / 10 for t in ("ES", "A", "C")], 1)
    corr = {t: round(float(np.corrcoef(X[:, i], ages)[0, 1]), 3) for i, t in enumerate(("ES", "A", "C"))}
    A = np.column_stack([np.ones(len(X)), X])
    beta, *_ = np.linalg.lstsq(A, ages, rcond=None)
    r2 = 1 - ((ages - A @ beta) ** 2).sum() / ((ages - ages.mean()) ** 2).sum()
    idx = rng.permutation(len(ages)); tr, te = idx[:13000], idx[13000:]
    grid = np.arange(16, 71)
    cl = lambda a: np.clip(a, 16, 70)
    coefs = [np.polyfit(cl(ages[tr]), X[tr, i], 2) for i in range(3)]
    mu = lambda a: np.stack([np.polyval(c, a) for c in coefs], -1)
    Si = np.linalg.inv(np.cov((X[tr] - mu(cl(ages[tr]))).T))
    w80, err = [], []
    for x, a in zip(X[te], ages[te]):
        d = x[None] - mu(grid); ll = -0.5 * np.einsum("ij,jk,ik->i", d, Si, d)
        p = np.exp(ll - ll.max()); c = np.cumsum(p / p.sum())
        q = lambda z: grid[np.searchsorted(c, z)]
        w80.append(q(.9) - q(.1)); err.append(abs(q(.5) - a))
    comp = X.mean(1)
    curve = np.polyval(np.polyfit(cl(ages[tr]), comp[tr], 2), grid)
    outside = float(((comp[te] < curve.min()) | (comp[te] > curve.max())).mean())
    return {
        "n": int(len(ages)), "median_age": float(np.median(ages)),
        "corr_with_age": corr, "r2_age_from_traits": round(float(r2), 3),
        "heldout_n": int(len(te)),
        "age_estimate_median_80pct_width_years": float(np.median(w80)),
        "age_estimate_mae_years": round(float(np.mean(err)), 1),
        "baseline_mae_always_median_age": round(float(np.mean(abs(ages[te] - np.median(ages[tr])))), 1),
        "share_outside_age_average_range": round(outside, 2),
        "n_age_61_80": int(((ages > 60) & (ages <= 80)).sum()),
    }


def main():
    ages, sums, items, total, dropped = load()
    table = build(ages, sums)
    alpha, sem = reliability(items)
    meta = {
        "source": "Open Psychometrics BIG5 dataset (c. 2012), openpsychometrics.org/_rawdata (no licence stated; used with attribution)",
        "rawRows": total, "usedRows": int(len(ages)), "dropped": dropped,
        "built": datetime.date.today().isoformat(),
        "window": f"+/-{BASE_WINDOW} years, widened until n>={MIN_PEERS}",
        "minAge": MIN_AGE, "maxAge": MAX_AGE,
        "alpha": alpha, "semSum": sem,
    }
    if "--report" in sys.argv:
        rep = report(ages, sums)
        meta["validity"] = rep
        print(json.dumps(rep, indent=2))
    with open(OUT, "w") as f:
        f.write("// Generated by tools/build_norms.py. Do not edit by hand.\n")
        f.write("globalThis.HDAY = globalThis.HDAY || {};\n")
        f.write("HDAY.norms = " + json.dumps({"meta": meta, "ages": table}, separators=(",", ":")) + ";\n")
        f.write("if (typeof module !== 'undefined') module.exports = HDAY.norms;\n")
    print(f"wrote {OUT}: {len(ages)} people, ages {MIN_AGE}-{MAX_AGE}", file=sys.stderr)


if __name__ == "__main__":
    main()
