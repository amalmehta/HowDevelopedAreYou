// Plain-language explainers and sources. Every research claim carries a source id.
globalThis.HDAY = globalThis.HDAY || {};
HDAY.content = {
  bands: {
    low: "Less than most people your age",
    typical: "Typical for your age",
    high: "More than most people your age",
  },
  traits: {
    C: {
      name: "Conscientiousness",
      icon: "✓",
      short: "Organized, reliable, follows through.",
      high: "Plans ahead, keeps promises, finishes what you start.",
      low: "Spontaneous and flexible; structure and follow-through take more effort.",
      age: "On average it rises, especially between ages 20 and 40.",
      moves: "Taking on adult roles (a steady job, a partner, a family) that ask you to be dependable. Across 62 countries, people matured earlier where those roles start earlier. This is the social investment idea: the role's expectations slowly reshape your habits.",
      tryThis: "Pick one small commitment you keep at the same time every day for two weeks.",
      sources: ["roberts2006", "bleidorn2013"],
    },
    A: {
      name: "Agreeableness",
      icon: "♡",
      short: "Warm, considerate, cooperative.",
      high: "Notices how others feel, gives the benefit of the doubt, avoids needless conflict.",
      low: "Direct and skeptical; you put the task or the truth ahead of keeping the peace.",
      age: "Long-term studies find it changes mainly in later life; people in their 50s and 60s score higher than people in their 20s.",
      moves: "Less is known than for the other two. The same adult roles (partner, parent, caregiver) are the leading idea, but the evidence is weaker.",
      tryThis: "In your next disagreement, say the other person's view back to them before giving yours.",
      sources: ["roberts2006", "soto2011", "bleidorn2013"],
    },
    ES: {
      name: "Emotional stability",
      icon: "≈",
      short: "Calm and even under stress.",
      high: "Setbacks don't knock you over for long; your mood stays steady.",
      low: "You feel stress and low moods strongly. That often comes with sensitivity, which isn't a flaw.",
      age: "On average it rises, especially between ages 20 and 40.",
      moves: "The trait that changes most through deliberate effort: across 207 studies, therapy shifted it noticeably in about 24 weeks on average, and the change lasted.",
      tryThis: "When you notice stress, name it in a few words (\"I'm anxious about the deadline\") before deciding what to do.",
      sources: ["roberts2006", "roberts2017"],
    },
  },
  sources: {
    goldberg1992: { text: "Goldberg, L. R. (1992). The development of markers for the Big-Five factor structure. Psychological Assessment, 4(1), 26–42. (The factor markers the IPIP items were written to measure.)", url: "https://doi.org/10.1037/1040-3590.4.1.26" },
    ipip: { text: "International Personality Item Pool: 50-item IPIP Big-Five Factor Markers (public domain).", url: "https://ipip.ori.org/new_ipip-50-item-scale.htm" },
    roberts2006: { text: "Roberts, B. W., Walton, K. E., & Viechtbauer, W. (2006). Patterns of mean-level change in personality traits across the life course: A meta-analysis of longitudinal studies. Psychological Bulletin, 132(1), 1–25.", url: "https://doi.org/10.1037/0033-2909.132.1.1" },
    bleidorn2013: { text: "Bleidorn, W., Klimstra, T. A., Denissen, J. J. A., Rentfrow, P. J., Potter, J., & Gosling, S. D. (2013). Personality maturation around the world: A cross-cultural examination of social-investment theory. Psychological Science, 24(12), 2530–2540.", url: "https://doi.org/10.1177/0956797613498396" },
    caspi2005: { text: "Caspi, A., Roberts, B. W., & Shiner, R. L. (2005). Personality development: Stability and change. Annual Review of Psychology, 56, 453–484 (\"The maturity principle\", p. 468).", url: "https://doi.org/10.1146/annurev.psych.55.090902.141913" },
    goldberg2006: { text: "Goldberg, L. R., et al. (2006). The International Personality Item Pool and the future of public-domain personality measures. Journal of Research in Personality, 40(1), 84–96.", url: "https://doi.org/10.1016/j.jrp.2005.08.007" },
    roberts2017: { text: "Roberts, B. W., Luo, J., Briley, D. A., Chow, P. I., Su, R., & Hill, P. L. (2017). A systematic review of personality trait change through intervention. Psychological Bulletin, 143(2), 117–141.", url: "https://doi.org/10.1037/bul0000088" },
    soto2011: { text: "Soto, C. J., John, O. P., Gosling, S. D., & Potter, J. (2011). Age differences in personality traits from 10 to 65: Big Five domains and facets in a large cross-sectional sample. Journal of Personality and Social Psychology, 100(2), 330–348.", url: "https://doi.org/10.1037/a0021717" },
    openpsych: { text: "Open Psychometrics BIG5 raw data (c. 2012; 19,719 people; published for research). Our norms are percentile tables computed from it; the site states no licence.", url: "https://openpsychometrics.org/_rawdata/" },
  },
};
if (typeof module !== "undefined") module.exports = HDAY.content;
