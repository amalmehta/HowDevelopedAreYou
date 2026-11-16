// UI: screens, keyboard, motion, settings, history. All text is set with
// textContent (never innerHTML with data) so nothing can inject markup.
(function () {
  const { items, norms, scoring, store, content } = HDAY;
  const app = document.getElementById("app");
  const root = document.documentElement;
  let data = store.load();
  let state = { screen: "intro", age: null, idx: 0, answers: {}, result: null, advanceTimer: null };

  // ---------- tiny DOM helper ----------
  function el(tag, attrs = {}, ...kids) {
    const n = tag.startsWith("svg:") ? document.createElementNS("http://www.w3.org/2000/svg", tag.slice(4)) : document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === "class") n.setAttribute("class", v);
      else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
      else if (k === "text") n.textContent = v;
      // CSP forbids style attributes; set through the CSSOM instead
      else if (k === "style") for (const d of v.split(";")) { const [p, val] = d.split(":"); if (val) n.style.setProperty(p.trim(), val.trim()); }
      else n.setAttribute(k, v === true ? "" : v);
    }
    for (const c of kids.flat()) if (c != null && c !== false) n.append(c.nodeType ? c : document.createTextNode(String(c)));
    return n;
  }
  const show = (node) => { app.replaceChildren(node); };

  // ---------- settings ----------
  const sysReduce = matchMedia("(prefers-reduced-motion: reduce)");
  function applySettings() {
    const t = data.settings.theme;
    if (t === "system") root.removeAttribute("data-theme"); else root.setAttribute("data-theme", t);
    root.classList.toggle("reduce-motion", data.settings.reduceMotion || sysReduce.matches);
  }
  function persist() { store.save(data); }

  // ---------- intro ----------
  function intro() {
    state = { ...state, screen: "intro", idx: 0, answers: {}, result: null };
    const err = el("p", { class: "hint", id: "age-hint", text: "Used only to pick your comparison group. Stays on this device." });
    const input = el("input", { class: "age-input", id: "age", type: "number", inputmode: "numeric", min: 16, max: 99, placeholder: "e.g. 29", "aria-describedby": "age-hint", value: state.age ?? "" });
    const start = () => {
      const age = Number(input.value);
      if (!scoring.validAge(age)) {
        err.textContent = "Enter a whole number from 16 to 99."; err.classList.add("error"); input.focus(); return;
      }
      state.age = age; state.idx = 0; state.answers = {}; question();
    };
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") start(); });
    const icon = (d) => el("svg:svg", { viewBox: "0 0 24 24", "aria-hidden": "true" }, el("svg:path", { d }));
    show(el("section", { class: "screen intro" },
      el("img", { class: "mark", src: "icon.svg", alt: "" }),
      el("h1", { text: "How developed are you?" }),
      el("p", { class: "lede", text: "With age, most people grow more organized, warmer and steadier. Thirty statements show where you are on those three traits, compared with people your own age." }),
      el("div", { class: "age-form" },
        el("label", { for: "age", text: "Your age" }), input,
        el("button", { class: "btn primary", onclick: start, text: "Start" })),
      err,
      el("button", { class: "link-btn", onclick: sample, text: "See a sample result first →" }),
      el("ul", { class: "facts" },
        el("li", {}, icon("M12 7v5l3 2M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17"), "About 4 minutes"),
        el("li", {}, icon("M7 11V8a5 5 0 0 1 10 0v3M5.5 11h13v9.5h-13z"), "Nothing leaves your browser"),
        el("li", {}, icon("M5 19V9M12 19V5M19 19v-7"), "Compared with 18,175 people")),
      el("details", { class: "about" },
        el("summary", { text: "What this measures, and what it doesn't" }),
        el("div", { class: "detail-body" },
          el("p", {}, el("b", { text: "Maturity here means three traits: " }), "conscientiousness, agreeableness and emotional stability. Across many studies these rise on average as people age; psychologists call it the maturity principle."),
          el("p", {}, el("b", { text: "You get a percentile, not an age. " }), "We tested turning answers into an age. Personality explains only about 6% of the differences in people's ages, so an honest guess would span about 43 years. A percentile among your age peers is something we can measure."),
          el("p", {}, el("b", { text: "It's self-report. " }), "You're describing yourself, and most people describe themselves a little kindly. Answer how you usually are, not how you'd like to be."))),
    ));
    setTimeout(() => input.focus({ preventScroll: true }), 50);
  }

  // ---------- questions ----------
  const LABELS = ["Disagree", "", "Neutral", "", "Agree"];
  function question() {
    state.screen = "q";
    const it = items[state.idx];
    const chosen = state.answers[it.id];
    const pct = (Object.keys(state.answers).length / items.length) * 100;
    const scale = el("div", { class: "scale", role: "radiogroup", "aria-label": "How well does this describe you?" },
      [1, 2, 3, 4, 5].map((v) => el("button", {
        class: "choice" + (chosen === v ? " on" : ""), role: "radio", "aria-checked": chosen === v ? "true" : "false",
        "aria-label": `${v}${LABELS[v - 1] ? " " + LABELS[v - 1] : ""}`, onclick: () => answer(v),
      }, el("span", { class: "dot", text: v }), el("small", { text: LABELS[v - 1] }))));
    show(el("section", { class: "screen-q" },
      el("div", { class: "q-meta" }, el("span", { text: "How well does this describe you?" }), el("span", { text: `${state.idx + 1} / ${items.length}` })),
      el("div", { class: "progress", "aria-hidden": "true" }, el("i", { style: `width:${pct}%` })),
      el("p", { class: "statement" }, el("span", { text: `“${it.text}”` })),
      scale,
      el("div", { class: "q-foot" },
        el("button", { class: "link-btn", onclick: back, text: state.idx ? "← Back" : "← Change age" }),
        el("span", {}, "Keys ", el("kbd", { text: "1" }), "–", el("kbd", { text: "5" }), " · ", el("kbd", { text: "←" }), " back"))));
  }
  function answer(v) {
    const it = items[state.idx];
    state.answers[it.id] = v;
    // instant feedback, then advance after a short beat
    app.querySelectorAll(".choice").forEach((b, i) => { b.classList.toggle("on", i + 1 === v); b.setAttribute("aria-checked", i + 1 === v); });
    const bar = app.querySelector(".progress > i");
    if (bar) bar.style.width = `${(Object.keys(state.answers).length / items.length) * 100}%`;
    clearTimeout(state.advanceTimer);
    state.advanceTimer = setTimeout(() => {
      if (state.idx < items.length - 1) { state.idx++; question(); } else finish();
    }, 180);
  }
  function back() {
    clearTimeout(state.advanceTimer);
    if (state.idx === 0) intro(); else { state.idx--; question(); }
  }

  function finish() {
    try {
      state.result = scoring.score(state.answers, state.age, items, norms);
    } catch (e) {
      toast(e.message); state.idx = items.findIndex((it) => !state.answers[it.id]); return question();
    }
    if (data.settings.saveHistory) { data.history.push(state.result); persist(); }
    result(state.result);
  }

  // A made-up 34-year-old, clearly labelled, so people can see the result before taking it.
  function sample() {
    const keyed = { C: 4, A: 4, ES: 3 }, tweak = { C5: 5, C9: 3, A3: 2, N3: 2, N10: 4 };
    const ans = Object.fromEntries(items.map((it) => {
      const k = tweak[it.id] ?? keyed[it.trait];
      return [it.id, it.rev ? 6 - k : k];
    }));
    state.result = scoring.score(ans, 34, items, norms);
    state.result.sample = true;
    result(state.result);
  }

  // ---------- result ----------
  function ordinal(n) { const s = ["th", "st", "nd", "rd"], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }

  function result(r) {
    state.screen = "result";
    const pct = Math.round(r.maturity.pct);
    const peers = `people aged ${r.peers.lo}–${r.peers.hi}`;
    const head = el("div", { class: "result-head" },
      r.sample ? el("p", { class: "note", style: "text-align:center;margin:0 auto 14px", text: "Sample result for a made-up 34-year-old. Not yours, and not saved." }) : null,
      el("p", { class: "eyebrow", text: r.sample ? "Sample: personality maturity" : "Your personality maturity" }),
      el("p", { class: "big" }, String(pct), el("small", { text: ordinal(pct).slice(String(pct).length) })),
      el("h1", { text: `More mature than about ${pct} in 100 ${peers}.` }),
      r.maturity.range ? el("p", { class: "eyebrow", title: "Your score plus or minus one standard error of measurement, estimated from how consistently people answer the 30 items (Cronbach's alpha 0.85). Roughly a 2-in-3 chance your true percentile is in here.",
        text: `Likely range ${Math.round(r.maturity.range[0])}–${Math.round(r.maturity.range[1])} (estimate)` }) : null,
      el("span", { class: "badge " + r.maturity.band, text: content.bands[r.maturity.band] }),
      r.lowConfidence ? el("p", { class: "note", text: `Fewer people your age took the test the norms come from (${r.peers.n} aged ${r.peers.lo}–${r.peers.hi}), so treat this as a rough guide.` }) : null);

    const traits = el("section", { class: "card" },
      el("h2", { text: "The three traits" }),
      el("p", { class: "sub", text: `Where you sit among ${r.peers.n.toLocaleString()} ${peers}. The shaded middle is the typical half.` }),
      scoring.TRAITS.map((t) => traitRow(t, r.traits[t])));

    const chart = el("section", { class: "card" },
      el("h2", { text: "How maturity changes with age" }),
      el("p", { class: "sub", text: "Line: average score (1–5) at each age. Shaded: the middle half of people that age. Dot: you." }),
      ageChart(r),
      el("details", {}, el("summary", { text: "How to read this" }),
        el("div", { class: "detail-body" },
          el("p", { text: "The line rises: on average, older people describe themselves as more organized, warmer and steadier. But it rises slowly, and people of the same age vary far more than the averages of different ages do. That's why your dot can sit well above or below the line at any age, and why we don't turn your score into an age." }))));

    const rests = el("section", { class: "card" },
      el("h2", { text: "What this rests on" }),
      el("details", {}, el("summary", { text: "What a percentile means" }),
        el("div", { class: "detail-body" },
          el("p", { text: `Line up 100 ${peers} by their score. Your percentile is roughly how many of them you'd stand ahead of. ${pct} means you score higher than about ${pct} and lower than about ${100 - pct}. Ties count as half.` }),
          el("p", { text: "It describes where you stand in a group. It isn't a grade: 50 is exactly typical." }))),
      el("details", {}, el("summary", { text: "Limits" }),
        el("div", { class: "detail-body" },
          el("p", { text: "Self-report: these are your answers about yourself, and people tend to answer a little kindly." }),
          el("p", { text: "The comparison group is one 2012 online sample of 18,175 people. Most were young (median age 23) and many were from English-speaking countries. Only 272 people were over 60." }),
          el("p", { text: "One sitting: mood on the day moves scores a little. Retaking on another day shows how stable your result is." }),
          el("p", { text: "Not a diagnosis, and not a measure of worth. Lower conscientiousness often comes with spontaneity, lower agreeableness with honesty, and lower emotional stability with sensitivity." }))),
      el("details", {}, el("summary", { text: "Sources" }),
        el("div", { class: "detail-body" },
          ["caspi2005", "roberts2006", "soto2011", "bleidorn2013", "roberts2017", "goldberg1992", "goldberg2006", "ipip", "openpsych"].map(sourceLine))));

    const hist = !r.sample && data.history.length > 1 ? historyTrend() : null;

    show(el("section", { class: "screen" }, head, traits, hist, chart, rests,
      el("div", { class: "btn-row center actions" },
        r.sample ? null : el("button", { class: "btn primary", onclick: () => share(r), text: "Save share card" }),
        el("button", { class: r.sample ? "btn primary" : "btn", onclick: () => { if (r.sample || !state.age) return intro(); state.idx = 0; state.answers = {}; question(); }, text: r.sample ? "Take the test" : "Retake" }),
        el("button", { class: "btn", onclick: historyScreen, text: "Past results" }))));
    window.scrollTo({ top: 0 });
  }

  function traitRow(t, v) {
    const c = content.traits[t];
    const p = Math.round(v.pct);
    return el("div", { class: "trait" },
      el("div", { class: "trait-top" },
        el("span", { class: "trait-icon", "aria-hidden": "true", text: c.icon }),
        el("span", { class: "trait-name" }, c.name, el("small", { text: c.short })),
        el("span", { class: "trait-pct" }, ordinal(p), el("small", { text: content.bands[v.band].replace(" people your age", "") }))),
      el("div", { class: "meter", role: "img", "aria-label": `${c.name}: ${ordinal(p)} percentile` },
        el("span", { class: "mid" }), el("span", { class: "you", style: `left:${Math.min(98, Math.max(2, v.pct))}%` })),
      el("div", { class: "meter-scale", "aria-hidden": "true" }, el("span", { text: "lower" }), el("span", { text: "typical" }), el("span", { text: "higher" })),
      el("details", {}, el("summary", { text: "What it means and what moves it" }),
        el("div", { class: "detail-body" },
          el("p", {}, el("b", { text: "Scoring higher: " }), c.high),
          el("p", {}, el("b", { text: "Scoring lower: " }), c.low),
          el("p", {}, el("b", { text: "With age: " }), c.age),
          el("p", {}, el("b", { text: "What moves it: " }), c.moves),
          el("p", {}, el("b", { text: "One thing to try " }), el("span", { class: "cite", text: "(a suggestion, not a research finding)" }), ": ", c.tryThis),
          el("p", { class: "cite" }, "Your average: ", v.mean.toFixed(1), " of 5 · peers' average: ", v.peerMean.toFixed(1)),
          c.sources.map(sourceLine))));
  }

  function sourceLine(id) {
    const s = content.sources[id];
    return el("p", { class: "cite" }, s.text, " ", el("a", { href: s.url, target: "_blank", rel: "noopener noreferrer", text: "Link" }));
  }

  // single-series line: average maturity by age, user's dot, hover crosshair
  function ageChart(r) {
    const pts = scoring.curve(norms);
    const W = 640, H = 240, L = 36, R = 16, T = 16, B = 28;
    const you = r.maturity.mean;
    const yMin = Math.floor(Math.min(2.5, you - 0.2) * 2) / 2, yMax = Math.ceil(Math.max(4.5, you + 0.2) * 2) / 2;
    const x = (a) => L + ((a - 16) / (70 - 16)) * (W - L - R);
    const y = (v) => T + (1 - (v - yMin) / (yMax - yMin)) * (H - T - B);
    const line = (key) => pts.map((p, i) => `${i ? "L" : "M"}${x(p.age).toFixed(1)},${y(p[key]).toFixed(1)}`).join("");
    const path = line("mean");
    const bandPath = line("q75") + [...pts].reverse().map((p) => `L${x(p.age).toFixed(1)},${y(p.q25).toFixed(1)}`).join("") + "Z";
    const svg = el("svg:svg", { class: "chart", viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": `Average maturity rises from ${pts[0].mean.toFixed(2)} at 16 to ${pts[pts.length - 1].mean.toFixed(2)} at 70. Your score is ${r.maturity.mean.toFixed(2)}.` });
    const axis = el("svg:g", { class: "axis" });
    for (let v = yMin; v <= yMax + 1e-9; v += 0.5) {
      axis.append(el("svg:line", { class: "grid", x1: L, x2: W - R, y1: y(v), y2: y(v) }));
      axis.append(el("svg:text", { x: L - 8, y: y(v) + 4, "text-anchor": "end", text: v.toFixed(1) }));
    }
    for (const a of [20, 30, 40, 50, 60, 70]) axis.append(el("svg:text", { x: x(a), y: H - 8, "text-anchor": "middle", text: a }));
    svg.append(axis, el("svg:path", { class: "band", d: bandPath }), el("svg:path", { class: "avg", d: path }));
    const ax = Math.min(70, r.age);
    svg.append(el("svg:circle", { class: "you", cx: x(ax), cy: y(you), r: 7 }));
    const right = x(ax) > W - 120;
    svg.append(el("svg:text", { class: "you-label", x: x(ax) + (right ? -12 : 12), y: y(you) + 4, "text-anchor": right ? "end" : "start", text: `You · ${you.toFixed(2)}` }));
    const hover = el("svg:g", { class: "hover", visibility: "hidden" });
    const hl = el("svg:line", { class: "hover-line", y1: T, y2: H - B });
    const hd = el("svg:circle", { r: 4, fill: "var(--accent)" });
    hover.append(hl, hd);
    svg.append(hover);
    const tip = el("div", { class: "chart-tip" });
    const wrap = el("div", { class: "chart-wrap" }, svg, tip);
    svg.addEventListener("pointermove", (e) => {
      const b = svg.getBoundingClientRect();
      const sx = ((e.clientX - b.left) / b.width) * W;
      const age = Math.round(16 + ((sx - L) / (W - L - R)) * 54);
      if (age < 16 || age > 70) return;
      const p = pts[age - 16];
      hover.setAttribute("visibility", "visible");
      hl.setAttribute("x1", x(age)); hl.setAttribute("x2", x(age));
      hd.setAttribute("cx", x(age)); hd.setAttribute("cy", y(p.mean));
      tip.textContent = `Age ${age}: average ${p.mean.toFixed(2)}, middle half ${p.q25.toFixed(2)}–${p.q75.toFixed(2)}`;
      tip.style.left = `${(x(age) / W) * 100}%`; tip.style.top = `${(y(p.mean) / H) * b.height}px`; tip.style.opacity = 1;
    });
    svg.addEventListener("pointerleave", () => { tip.style.opacity = 0; hover.setAttribute("visibility", "hidden"); });
    return wrap;
  }

  function historyTrend() {
    const h = data.history, prev = h[h.length - 2], cur = h[h.length - 1];
    const d = Math.round(cur.maturity.pct - prev.maturity.pct);
    return el("section", { class: "card" },
      el("h2", { text: "Since last time" }),
      el("p", { class: "sub", text: `${new Date(prev.date).toLocaleDateString()}: ${ordinal(Math.round(prev.maturity.pct))} → now ${ordinal(Math.round(cur.maturity.pct))}` }),
      el("p", { class: "detail-body", text: Math.abs(d) < 20
        ? `A ${Math.abs(d)}-point change. Two takes by the same person typically differ by about 20 points from measurement noise alone (an estimate), so this isn't evidence of real change.`
        : Math.abs(d) < 36
        ? `A ${Math.abs(d)}-point ${d > 0 ? "rise" : "drop"}. More than typical noise, but changes this size still happen by chance about 1 time in 20 or more. See if it holds next time.`
        : `A ${Math.abs(d)}-point ${d > 0 ? "rise" : "drop"}. Noise alone rarely does this (under 1 in 20, an estimate), so something has likely shifted.` }));
  }

  // ---------- history ----------
  function historyScreen() {
    state.screen = "history";
    const h = [...data.history].reverse();
    const body = h.length
      ? el("ul", { class: "hist-list" }, h.map((r, i) => {
          const older = h[i + 1];
          const d = older ? Math.round(r.maturity.pct - older.maturity.pct) : null;
          return el("li", {},
            el("button", { class: "link-btn hist-date", style: "text-align:left;padding:0", onclick: () => { state.result = r; result(r); } },
              new Date(r.date).toLocaleDateString(undefined, { dateStyle: "medium" }), el("small", { text: `Age ${r.age} · ${content.bands[r.maturity.band]}` })),
            el("span", { class: "delta", text: d == null ? "" : `${d > 0 ? "+" : ""}${d}` }),
            el("strong", { text: ordinal(Math.round(r.maturity.pct)) }));
        }))
      : el("div", { class: "empty" }, el("img", { src: "icon.svg", alt: "" }),
          el("p", { text: data.settings.saveHistory ? "No saved results yet. Take the test, then retake it in a few months to see how you change." : "Saving is off, so nothing is kept. You can turn it on in Settings." }),
          el("button", { class: "btn primary", onclick: intro, text: "Take the test" }));
    show(el("section", { class: "screen" },
      el("section", { class: "card" },
        el("h2", { text: "Past results" }),
        el("p", { class: "sub", text: "Saved in this browser only. Changes under about 20 points are normal measurement noise (an estimate)." }),
        body),
      h.length ? el("div", { class: "btn-row center actions" }, el("button", { class: "btn primary", onclick: intro, text: "Take it again" })) : null));
  }

  // ---------- share, export, delete ----------
  async function share(r) {
    toast("Making your card…");
    const blob = await HDAY.shareCard(r, content);
    const file = new File([blob], "How Developed Are You.png", { type: "image/png" });
    if (navigator.canShare && navigator.canShare({ files: [file] }) && matchMedia("(pointer: coarse)").matches) {
      try { await navigator.share({ files: [file], title: "How Developed Are You?" }); return; } catch {}
    }
    download(blob, "How Developed Are You.png");
    toast("Share card saved to your downloads");
  }
  function download(blob, name) {
    const a = el("a", { href: URL.createObjectURL(blob), download: name });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }
  let toastTimer;
  function toast(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { t.hidden = true; }, 2600);
  }

  // ---------- settings dialog ----------
  const dlg = document.getElementById("settings");
  const setTheme = document.getElementById("set-theme"), setSave = document.getElementById("set-save"), setMotion = document.getElementById("set-motion");
  function openSettings() {
    setTheme.value = data.settings.theme; setSave.checked = data.settings.saveHistory; setMotion.checked = data.settings.reduceMotion;
    if (!dlg.open) dlg.showModal();
  }
  setTheme.addEventListener("change", () => { data.settings.theme = setTheme.value; applySettings(); persist(); });
  setSave.addEventListener("change", () => { data.settings.saveHistory = setSave.checked; persist(); });
  setMotion.addEventListener("change", () => { data.settings.reduceMotion = setMotion.checked; applySettings(); persist(); });
  document.getElementById("export").addEventListener("click", () => {
    download(new Blob([JSON.stringify({ exported: new Date().toISOString(), ...data }, null, 2)], { type: "application/json" }), "How Developed Are You results.json");
  });
  document.getElementById("delete-all").addEventListener("click", () => {
    if (!confirm(`Delete ${data.history.length} saved result(s) and your settings from this browser? This can't be undone.`)) return;
    store.clear(); data = store.load(); applySettings(); openSettings(); toast("Everything deleted");
    if (state.screen === "history") historyScreen();
  });
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });

  document.getElementById("open-settings").addEventListener("click", openSettings);
  document.getElementById("open-history").addEventListener("click", historyScreen);
  document.getElementById("home").addEventListener("click", intro);

  // ---------- keyboard ----------
  document.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === ",") { e.preventDefault(); openSettings(); return; }
    if (dlg.open || e.metaKey || e.ctrlKey || e.altKey) return;
    if (state.screen === "q") {
      if (/^[1-5]$/.test(e.key)) { e.preventDefault(); answer(Number(e.key)); }
      else if (e.key === "ArrowLeft" || e.key === "Backspace") { e.preventDefault(); back(); }
      else if (e.key === "ArrowRight" && state.answers[items[state.idx].id] && state.idx < items.length - 1) { state.idx++; question(); }
    }
  });

  sysReduce.addEventListener("change", applySettings);
  applySettings();
  if (location.hash === "#sample") sample(); else intro();
})();
