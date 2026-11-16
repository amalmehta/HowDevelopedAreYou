// Draws a 1200x630 share card for a result and returns a PNG Blob.
// Holds only the percentiles and peer age range you choose to share; nothing else.
globalThis.HDAY = globalThis.HDAY || {};
(function () {
  const W = 1200, H = 630;
  const C = { bg: "#FAF7F2", ink: "#2A2622", muted: "#7C736A", line: "#E9E1D5", accent: "#4A6A8A", soft: "#E3EAF1", warm: "#B5603F" };

  function loadImage(src) {
    return new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
  }

  async function shareCard(result, content) {
    const cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    const g = cv.getContext("2d");
    await (document.fonts ? document.fonts.ready : Promise.resolve());
    const serif = '"Newsreader", Georgia, serif', sans = '"Inter", -apple-system, sans-serif';

    g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
    const icon = await loadImage("icon.svg");
    if (icon) g.drawImage(icon, 72, 64, 56, 56);
    g.fillStyle = C.ink; g.font = `500 30px ${serif}`; g.fillText("How Developed Are You?", 144, 102);

    const pct = Math.round(result.maturity.pct);
    g.font = `500 168px ${serif}`; g.fillStyle = C.ink;
    g.fillText(`${pct}`, 72, 320);
    const w = g.measureText(`${pct}`).width;
    g.font = `500 56px ${serif}`; g.fillStyle = C.muted; g.fillText("th", 72 + w + 8, 250);

    g.fillStyle = C.ink; g.font = `500 34px ${serif}`;
    g.fillText("percentile for personality maturity", 72, 380);
    g.fillStyle = C.muted; g.font = `400 24px ${sans}`;
    g.fillText(`compared with people aged ${result.peers.lo}–${result.peers.hi}`, 72, 420);
    if (result.maturity.range) {
      const [a, b] = result.maturity.range.map(Math.round);
      g.fillText(`likely range ${a}–${b}`, 72, 456);
    }

    // three traits
    const x0 = 700, bw = 420;
    ["C", "A", "ES"].forEach((t, i) => {
      const y = 200 + i * 96, p = result.traits[t].pct;
      g.fillStyle = C.ink; g.font = `500 22px ${sans}`; g.fillText(content.traits[t].name, x0, y);
      g.fillStyle = C.muted; g.textAlign = "right"; g.fillText(`${Math.round(p)}`, x0 + bw, y); g.textAlign = "left";
      g.fillStyle = C.line; roundRect(g, x0, y + 16, bw, 10, 5); g.fill();
      g.fillStyle = C.soft; g.fillRect(x0 + bw * .25, y + 16, bw * .5, 10);
      g.fillStyle = C.accent; g.beginPath(); g.arc(x0 + bw * p / 100, y + 21, 10, 0, Math.PI * 2); g.fill();
    });

    g.fillStyle = C.line; g.fillRect(72, 520, W - 144, 1);
    g.fillStyle = C.muted; g.font = `400 20px ${sans}`;
    g.fillText("A percentile, not an age. 30 public-domain IPIP items · norms from 18,175 people.", 72, 566);
    g.fillStyle = C.warm; g.fillRect(72, 520, 64, 3);

    return new Promise((res) => cv.toBlob(res, "image/png"));
  }

  function roundRect(g, x, y, w, h, r) {
    g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }

  HDAY.shareCard = shareCard;
})();
