# EVALS.md

The verification table from HW3, grown up. Five sections, in this order.
The first two are written and committed BEFORE any tool sees the spec.

## 1. RAT statement
<!-- One sentence. The assumption that, if false, makes this build pointless,
     and what would show it is false. -->
The riskiest assumption in delegating the job matching tool is that if it fails to calculate a percentage match between user and job skills, it makes the delegation pointless. If the compare fit button is missing, or if pressed does not show either a percentage fit or a error message, it shows as false.

## 2. Prediction Stake (before build, <date and time>)
<!-- At least one of each. Never edit the prediction text; add resolutions below it. -->
- **Tight:** At least 3 out of 4 EARS rows related to the new feature (GEMINI API job suggestions) will pass on the tool's first output
  - Resolved <date>: _ of _.
- **Loose:** bolt will follow STYLE.md tokens better than AI Studio.
  - Resolved 2026-10-01: Not supported against commit `e3f44e6d21f6a7d36a8938fe972a9ab4267a53a8`. Both stylesheets use the same relevant values, so there is no evidence Bolt followed the tokens more closely.
- **Open:** The tool will introduce a dependency I did not ask for. Resolves when I read package.json.
  - Resolved <date>: ...

## 3. Success criteria
| EARS row (feature) | Checked by | Where |
|---|---|---|
| WHEN ..., THE SYSTEM SHALL ... | test | evals/worker.test.js, "..." |
| IF ..., THEN THE SYSTEM SHALL ... | judgment | docs/JUDGMENT.md #8 |
| THE SYSTEM SHALL ... | human | README, See It Work |

## 4. Error-analysis log
<!-- Every failure observed, a few words each, counted, sorted by count. -->
| Failure (a few words) | Count | Source | Category |
|---|---|---|---|
| Buttons used its own blue, not color-primary | 2 | bolt, AI Studio | STYLE |
| | | | |

## 5. Evals
- **Code:** `npm test` with `API=<worker url>`; _ tests, _ passing. Screenshot in README.
- **Judgment:** docs/JUDGMENT.md, _ questions, two graders, agreement _%.

## Verification table (carried from HW4)
<!-- Paste your HW4 verification table here; it is the ancestor of section 3. -->
