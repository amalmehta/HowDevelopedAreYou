// History and settings in this browser's localStorage only (key "hday.v1").
// Every read is validated; anything malformed is dropped, never trusted.
globalThis.HDAY = globalThis.HDAY || {};
(function () {
  const KEY = "hday.v1";
  const DEFAULTS = { settings: { theme: "system", saveHistory: true, reduceMotion: false }, history: [] };

  function backend() {
    try { return globalThis.localStorage || null; } catch { return null; }
  }

  function isNum(x, lo, hi) { return typeof x === "number" && isFinite(x) && x >= lo && x <= hi; }

  function validResult(r) {
    if (!r || typeof r !== "object" || r.version !== 1) return false;
    if (!Number.isInteger(r.age) || !isNum(r.age, 16, 99)) return false;
    if (typeof r.date !== "string" || isNaN(Date.parse(r.date))) return false;
    if (!r.maturity || !isNum(r.maturity.pct, 0, 100) || !isNum(r.maturity.mean, 1, 5)) return false;
    for (const t of ["C", "A", "ES"]) {
      const v = r.traits && r.traits[t];
      if (!v || !isNum(v.pct, 0, 100) || !isNum(v.mean, 1, 5)) return false;
    }
    return true;
  }

  function load(store = backend()) {
    const data = JSON.parse(JSON.stringify(DEFAULTS));
    if (!store) return data;
    let raw;
    try { raw = JSON.parse(store.getItem(KEY) || "null"); } catch { return data; }
    if (!raw || typeof raw !== "object") return data;
    const s = raw.settings || {};
    if (["system", "light", "dark"].includes(s.theme)) data.settings.theme = s.theme;
    if (typeof s.saveHistory === "boolean") data.settings.saveHistory = s.saveHistory;
    if (typeof s.reduceMotion === "boolean") data.settings.reduceMotion = s.reduceMotion;
    if (Array.isArray(raw.history)) data.history = raw.history.filter(validResult).slice(-200);
    return data;
  }

  function save(data, store = backend()) {
    if (!store) return false;
    try { store.setItem(KEY, JSON.stringify(data)); return true; } catch { return false; }
  }

  function clear(store = backend()) {
    if (store) try { store.removeItem(KEY); } catch {}
  }

  HDAY.store = { load, save, clear, validResult, KEY };
  if (typeof module !== "undefined") module.exports = HDAY.store;
})();
