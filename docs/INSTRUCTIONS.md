# Instructions

## Run it

It's a static site. Any web server works:

```bash
python3 -m http.server 8642 --bind 127.0.0.1 --directory site
```

Then open http://localhost:8642. Add `#sample` to the URL to see a sample result.

## Test

```bash
node --test tests/scoring.test.js
```

Covers: item keys, norm tables, the stated band thresholds, the likely range, 12 sample takers (typical, neutral, extremes, straight-liner, ages 16/63/85, invalid age, missing and out-of-range answers), and a recount of real dataset rows. Needs Node 18+.

## Rebuild the norms

```bash
python3 tools/build_norms.py --report
```

Downloads the Open Psychometrics BIG5 data (523 KB) into `tools/.cache/` (git-ignored), rewrites `site/norms.js` and prints the validity report (age signal, held-out error, reliability). Needs Python 3.8+ and NumPy.

## Use

1. Enter your age (16–99), press Start or Enter.
2. Answer 30 statements: click, tap or press 1–5. ← goes back.
3. Read your percentile, the three traits, and "What it means and what moves it".
4. Save a share card, retake later, or see Past results (clock icon).
5. Settings (gear or ⌘,): theme, saving on/off, reduce motion, export or delete your data.

## Manual review checklist

Things the tests can't check. Walk through before calling a release done.

**Feel and look**
- [ ] Opening animation: the mark springs in once, under a second, and never blocks typing your age.
- [ ] With Reduce Motion on (system or Settings): plain fades only.
- [ ] Answering feels instant: the button lights on press, the next statement follows after a short beat, no flicker.
- [ ] Light and dark: every screen, the settings sheet, the chart, the share card (always light).
- [ ] Phone width (375 px): nothing clipped, buttons easy to hit, the feedback tab doesn't cover answers.
- [ ] Words: does the result feel fair and kind at the 5th percentile as well as the 95th?

**Truth**
- [ ] Every claim in "What it means" matches its linked source.
- [ ] Low-confidence note appears for ages 60+ and 71+.
- [ ] The likely range and "estimate" labels are visible wherever a number is.

**Privacy and security**
- [ ] DevTools → Network while taking the test: only fonts load; no other requests.
- [ ] DevTools → Application → Local Storage: only `hday.v1`; Delete everything empties it.
- [ ] Turn "Save results" off, take the test: nothing new in history.
- [ ] Share card contains only percentiles and the peer age range.
- [ ] Console shows no Content-Security-Policy violations.

**Live**
- [ ] The GitHub Pages URL loads over HTTPS and the feedback tab opens a GitHub issue.
