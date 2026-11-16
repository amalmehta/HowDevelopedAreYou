// The 30 IPIP Big-Five Factor Markers used (ipip.ori.org, public domain; Goldberg et al. 2006), written to measure Goldberg's (1992) factor markers.
// trait: C = Conscientiousness, A = Agreeableness, ES = Emotional Stability.
// rev: true means the item is scored 6 - answer (it points away from the trait).
// Wording is exactly as in the norm sample so the norms apply.
globalThis.HDAY = globalThis.HDAY || {};
HDAY.items = [
  { id: "C1",  trait: "C",  rev: false, text: "I am always prepared." },
  { id: "A1",  trait: "A",  rev: true,  text: "I feel little concern for others." },
  { id: "N1",  trait: "ES", rev: true,  text: "I get stressed out easily." },
  { id: "C2",  trait: "C",  rev: true,  text: "I leave my belongings around." },
  { id: "A2",  trait: "A",  rev: false, text: "I am interested in people." },
  { id: "N2",  trait: "ES", rev: false, text: "I am relaxed most of the time." },
  { id: "C3",  trait: "C",  rev: false, text: "I pay attention to details." },
  { id: "A3",  trait: "A",  rev: true,  text: "I insult people." },
  { id: "N3",  trait: "ES", rev: true,  text: "I worry about things." },
  { id: "C4",  trait: "C",  rev: true,  text: "I make a mess of things." },
  { id: "A4",  trait: "A",  rev: false, text: "I sympathize with others' feelings." },
  { id: "N4",  trait: "ES", rev: false, text: "I seldom feel blue." },
  { id: "C5",  trait: "C",  rev: false, text: "I get chores done right away." },
  { id: "A5",  trait: "A",  rev: true,  text: "I am not interested in other people's problems." },
  { id: "N5",  trait: "ES", rev: true,  text: "I am easily disturbed." },
  { id: "C6",  trait: "C",  rev: true,  text: "I often forget to put things back in their proper place." },
  { id: "A6",  trait: "A",  rev: false, text: "I have a soft heart." },
  { id: "N6",  trait: "ES", rev: true,  text: "I get upset easily." },
  { id: "C7",  trait: "C",  rev: false, text: "I like order." },
  { id: "A7",  trait: "A",  rev: true,  text: "I am not really interested in others." },
  { id: "N7",  trait: "ES", rev: true,  text: "I change my mood a lot." },
  { id: "C8",  trait: "C",  rev: true,  text: "I shirk my duties." },
  { id: "A8",  trait: "A",  rev: false, text: "I take time out for others." },
  { id: "N8",  trait: "ES", rev: true,  text: "I have frequent mood swings." },
  { id: "C9",  trait: "C",  rev: false, text: "I follow a schedule." },
  { id: "A9",  trait: "A",  rev: false, text: "I feel others' emotions." },
  { id: "N9",  trait: "ES", rev: true,  text: "I get irritated easily." },
  { id: "C10", trait: "C",  rev: false, text: "I am exacting in my work." },
  { id: "A10", trait: "A",  rev: false, text: "I make people feel at ease." },
  { id: "N10", trait: "ES", rev: true,  text: "I often feel blue." },
];
if (typeof module !== "undefined") module.exports = HDAY.items;
