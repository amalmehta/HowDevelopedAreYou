# File structure

```
README.md                 What it is, screenshots, links
HowDevelopedAreYou?.md    The project spec (decisions, definitions, changelog)
site/                     The whole website (deploy this folder)
  index.html              Page shell, Content-Security-Policy, settings dialog
  styles.css              Light and dark themes, layout, motion
  app.js                  Screens, keyboard, chart, history, settings, share
  scoring.js              Pure scoring: answers + age -> percentiles, bands, range
  items.js                The 30 IPIP statements with trait and reverse key
  norms.js                GENERATED percentile tables by age (tools/build_norms.py)
  content.js              Trait explainers and sources
  storage.js              localStorage history and settings, validated
  share.js                Draws the 1200x630 share card
  icon.svg                App icon and favicon (growth rings)
tools/
  build_norms.py          Downloads the open dataset, builds norms, prints validity report
  .cache/                 Downloaded data (git-ignored)
tests/
  scoring.test.js         node --test suite
  personas.js             Sample takers: normal, edge and failure cases
docs/
  SYSTEM-DESIGN.md        Architecture, scoring definitions, threat model, trade-offs
  INSTRUCTIONS.md         Run, test, rebuild, manual checklist
  FILE-STRUCTURE.md       This file
  PROMPTS.md              Prompt log
  images/                 README screenshots
```
