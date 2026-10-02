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
  - Resolved 2026-10-01: Not supported. The first output needed edits to wire the feature into the existing UI, so it did not pass on first output.
- **Loose:** bolt will follow STYLE.md tokens better than AI Studio.
  - Resolved 2026-10-01: Not supported against commit `e3f44e6d21f6a7d36a8938fe972a9ab4267a53a8`. Both stylesheets use the same relevant values, so there is no evidence Bolt followed the tokens more closely.
- **Open:** The tool will introduce a dependency I did not ask for. Resolves when I read package.json.
  - Resolved 2026-10-01: No Gemini-specific dependency was added; package.json lists only Wrangler (^4), and the Gemini request uses built-in fetch.

## 3. Success criteria
| EARS row (feature) | Checked by | Where |
|---|---|---|
| WHEN the user enters two comma- or line-separated lists, THE SYSTEM SHALL compare the list values by normalized skill names and compute a percentage match as the integer value of round((matchedSkillCount / totalJobSkillCount) * 100), where totalJobSkillCount is the number of unique normalized skills in the job list. | test | app.test.js, `EARS 1: compares two normalized lists and computes a percentage match` |
| IF either list is empty after trimming and removing blanks, THEN THE SYSTEM SHALL display a validation message and SHALL NOT compute a match score. | test | app.test.js, `EARS 2: empty user or job list blocks the comparison` |
| IF the computed match score is 100%, THEN THE SYSTEM SHALL display 100% and SHALL show no missing-skill entries. | test | app.test.js, `EARS 3: 100% match shows a full score and no missing skills` |
| IF the computed match score is between 50% and 99%, THEN THE SYSTEM SHALL display a potential-fit summary and list the qualifications that are missing from the user’s list. | test | app.test.js, `EARS 4: 50% to 99% yields a potential-fit summary and a missing list` |
| IF the computed match score is below 50%, THEN THE SYSTEM SHALL display a weak-fit summary and list all missing qualifications in descending order of the job list. | test (partial: order is not asserted) | app.test.js, `EARS 5: below 50% shows a weak-fit summary and missing skills` |
| IF the computed match score is between 0% and 100% inclusive, THEN THE SYSTEM SHALL show the matched skills and missing skills as separate lists to support objective review. | test | app.test.js, `EARS 6: matched and missing skills are rendered in separate lists for review` |
| THE SYSTEM SHALL ignore blank entries and duplicate values after normalization so that match calculations are repeatable and objectively testable. | test | app.test.js, `EARS 7: blank items and duplicate values are ignored after normalization` |
| IF the user reloads the page after comparing two lists, THEN THE SYSTEM SHALL restore both entered lists from saved browser state. | test | app.test.js, `EARS 8: saved skill lists survive a page reload after comparison` |
| IF a submitted entry exceeds 2,000 characters, THEN THE SYSTEM SHALL reject it with a 400 response and identify that the entry is too long. | unit test | evals/worker.test.js, `EARS: IF a submitted entry exceeds 2,000 characters, THEN THE SYSTEM SHALL reject it with a 400 response and identify that the entry is too long.` |
| WHEN the user requests similar jobs with a non-empty skillset, THE SYSTEM SHALL send the skillset to the Gemini API through the server and display suggested job roles with a short explanation of their relationship to the skillset and relevant skills to build. | unit test | evals/worker.test.js, `EARS: WHEN the Worker receives a valid POST /job-suggestions request, THE SYSTEM SHALL return structured job suggestions and save the submitted skillset using a parameterized D1 statement.`; app.test.js, `a 429 retry clears suggestions from the previous successful request` |
| WHEN the Worker receives a valid `POST /job-suggestions` request, THE SYSTEM SHALL return structured job suggestions and SHALL save the submitted skillset using a parameterized D1 statement. | unit test | evals/worker.test.js, `EARS: WHEN the Worker receives a valid POST /job-suggestions request, THE SYSTEM SHALL return structured job suggestions and save the submitted skillset using a parameterized D1 statement.` |
| IF the skillset is empty, THEN THE SYSTEM SHALL display a validation message and SHALL NOT send a Gemini API request. | test (partial: Worker rejection is tested; UI message and no-upstream call are not asserted) | evals/worker.test.js, `EARS: IF the skillset is empty, THEN THE SYSTEM SHALL display a validation message and SHALL NOT send a Gemini API request.` |
| IF the Gemini API is unavailable, rejects the request, or returns unusable suggestions, THEN THE SYSTEM SHALL explain that suggestions could not be generated and preserve the user's entered skills and job requirements. | test | evals/worker.test.js, `EARS: IF the Gemini API is unavailable, rejects the request, or returns unusable suggestions, THEN THE SYSTEM SHALL explain that suggestions could not be generated and preserve the user's entered skills and job requirements.`; app.test.js, `suggestion errors show the sanitized Gemini reason` and `a 429 retry clears suggestions from the previous successful request` |
| THE SYSTEM SHALL keep the Gemini API credential out of browser-visible code and responses. | unit test | evals/worker.test.js, `EARS: THE SYSTEM SHALL keep the Gemini API credential out of browser-visible code and responses.` |

## 4. Error-analysis log
<!-- Every failure observed, a few words each, counted, sorted by count. -->
| Failure (a few words) | Count | Source | Category |
|---|---|---|---|
| Font uses three colors; gray is not in STYLE.md | 8 | Copilot | STYLE |
| Every text color misses STYLE.md tokens; two blues are lighter than color-primary | 8 | Copilot | STYLE |
| Buttons used its own blue, not color-primary | 2 | bolt, AI Studio | STYLE |
| EARS 10 could not produce suggestions when Gemini rate limit was exceeded (429) | 1 | Gemini API | Worker |
| Client mislabels 400s by endpoint: entries as “text too long,” suggestions as missing skills | 1 | Copilot | app.js |
| SQL was concatenated in worker.js instead of parameterized | 1 | Copilot from HW4 | app.js |
| Judgment eval agreement was below the 80% threshold (60%) | 1 | Judgment eval | JUDGMENT |

## 5. Evals
- **Code:** `API=https://mgt3745-hw4.arahim.workers.dev npm test`; 9 tests, 9 passed, 0 skipped. `npm run test:unit` runs the browser and Worker suites: 20 tests, 20 passed, 0 skipped. Screenshot in README.
- **Judgment:** docs/JUDGMENT.md, 10 questions, two graders, agreement 6/10 (60%).

## Verification table (carried from HW4)
<!-- Paste your HW4 verification table here; it is the ancestor of section 3. -->
