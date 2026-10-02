# Features and specification

## Kano-Classified Feature List

**Classification date:** 09/28/2026. Kano classes below are hypotheses, not validated Kano results. Interview dates are listed with the supporting evidence and in [USERS.md](USERS.md).

| # | Tool feature | Kano class (hypothesis) | Relevant user segment | Interview date | Supporting interview evidence |
|---|--------------|------------------------|-----------------------|----------------|------------------------------|
| 1 | Enter the applicant's skills and project evidence | Must-be (inferred) | PROFILE-01 and PROFILE-02 | INT-01: Saturday, September 5, 2026; INT-02: Friday, September 25, 2026 | INT-01 reported relying on personal projects and relevant experience; INT-02 reported having demonstrated internship work. Neither interview directly evaluated this input feature. |
| 2 | Enter the skills required by a job | Must-be (inferred) | PROFILE-01 and PROFILE-02 | INT-01: Saturday, September 5, 2026; INT-02: Friday, September 25, 2026 | INT-01 described applying for a specific software engineering role; INT-02 described a team-specific conversion decision. Comparing explicit role requirements is an inferred product need, not a feature either participant directly requested. |
| 3 | Calculate a percentage match between the two skill lists | Performance (inferred) | PROFILE-01 and PROFILE-02 | INT-01: Saturday, September 5, 2026; INT-02: Friday, September 25, 2026 | INT-01's application and offer involved different role levels, and INT-02's conversion involved demonstrated work and available headcount. These accounts motivate structured comparison but do not validate a numeric score. |
| 4 | Show matched and missing skills separately | Performance (inferred) | PROFILE-01 and PROFILE-02 | INT-01: Saturday, September 5, 2026; INT-02: Friday, September 25, 2026 | INT-01 reported projects and experience as evidence; INT-02 reported internship performance as evidence. Breaking evidence into matched and missing skills is an inferred way to make that comparison inspectable. |
| 5 | Summarize fit based on the match result | Attractive (inferred) | PROFILE-01, especially applicants without internships | INT-01: Saturday, September 5, 2026 | INT-01 reported receiving an offer at a different level than the role initially targeted. This supports exploring decision guidance, but does not show that a threshold summary would have changed his decision. |
| 6 | Save and restore submitted entries through the Worker and D1 | Unclassified (not assessed) | PROFILE-01 and PROFILE-02 | INT-01: Saturday, September 5, 2026; INT-02: Friday, September 25, 2026 | Neither INT-01 nor INT-02 discussed saving or restoring tool input. There is no interview evidence to assign a Kano class to persistence. |
| 7 | Suggest similar job roles using the user's skillset and a Gemini API response | Unclassified (not assessed) | PROFILE-01 and PROFILE-02 | No interview evidence | This is a proposed discovery feature; neither interview assessed AI-generated job-role suggestions. |

Interview dates are supplied for context; the table records whether each interview provided direct evidence for a feature. Kano classifications remain provisional because no feature-by-feature Kano questions were asked.

---

## 1. Context

The primary user is a senior Computer Science student at Georgia Tech pursuing software engineering or data engineering roles across the United States. They are open to relocation and expect to graduate in December 2026, so they need to decide quickly which opportunities are worth applying to and which ones are likely to be a poor fit. The core challenge is evaluating whether a role is still worth pursuing when the posted requirements are only a partial match, while also finding openings that may not appear on major job boards.

---

## 2. Users

This feature is designed for two early-career technical applicant segments: applicants without internship experience who rely on projects and other evidence, and applicants with internship experience seeking full-time conversion. The interviews suggest that hiring outcomes can reflect both candidate evidence and circumstances such as team headcount; two interviews do not establish how common these experiences are.

---

## 3. Scope

**This does:**
- Help the user decide whether a role is worth pursuing when the requirements are only a partial match.
- Suggest similar job roles based on the user's entered skills using a Gemini API-backed response.
- Find opportunities beyond major job boards, including company pages, alumni, and recruiter channels.
- Support decisions using projects, relevant experience, and network signals instead of rigid checklist thinking.

**This deliberately does not do:**
- Guarantee interviews or offers.
- Replace networking, portfolio work, or direct outreach.
- Treat every job description as equally relevant or every role as a good fit.

---

## 4. Behavior

- The user compares a role’s requirements against their background, including coursework, projects, relevant experience, and job-specific skills.
- The user can request similar job-role suggestions based on the skills they entered; the system sends that skillset to the Gemini API through the server and displays the returned suggestions.
- If a role is not an exact match, the user can still assess whether it is worth pursuing when the core responsibilities, toolset, and growth potential are aligned.
- The user searches across multiple channels, not just major job boards, including company career pages, alumni networks, recruiter outreach, and other less visible sources.

---

## 5. Constraints

- The feature is for a student in the final semester before graduation, when application timing and volume matter.
- It should rely only on user-provided or public information, such as resume details, projects, and job descriptions.
- It should not require private employer data or internal hiring records.
- The Gemini API credential must remain server-side and must not be exposed to the browser.
- Generated role suggestions are ideas for further research, not verified current openings or employment predictions.
- It must support multiple job-search channels rather than depending on one platform.

---

## 6. Acceptance

- WHEN the user enters two comma- or line-separated lists, THE SYSTEM SHALL compare the list values by normalized skill names and compute a percentage match as the integer value of round((matchedSkillCount / totalJobSkillCount) * 100), where totalJobSkillCount is the number of unique normalized skills in the job list.
- IF either list is empty after trimming and removing blanks, THEN THE SYSTEM SHALL display a validation message and SHALL NOT compute a match score.
- IF the computed match score is 100%, THEN THE SYSTEM SHALL display 100% and SHALL show no missing-skill entries.
- IF the computed match score is between 50% and 99%, THEN THE SYSTEM SHALL display a potential-fit summary and list the qualifications that are missing from the user’s list.
- IF the computed match score is below 50%, THEN THE SYSTEM SHALL display a weak-fit summary and list all missing qualifications in descending order of the job list.
- IF the computed match score is between 0% and 100% inclusive, THEN THE SYSTEM SHALL show the matched skills and missing skills as separate lists to support objective review of the comparison.
- THE SYSTEM SHALL ignore blank entries and duplicate values after normalization so that match calculations are repeatable and objectively testable.
- IF the user reloads the page after comparing two lists, THEN THE SYSTEM SHALL restore both entered lists from saved browser state.
- IF a submitted entry exceeds 2,000 characters, THEN THE SYSTEM SHALL reject it with a 400 response and identify that the entry is too long.
- WHEN the user requests similar jobs with a non-empty skillset, THE SYSTEM SHALL send the skillset to the Gemini API through the server and display suggested job roles with a short explanation of their relationship to the skillset and relevant skills to build.
- WHEN the Worker receives a valid `POST /job-suggestions` request, THE SYSTEM SHALL return structured job suggestions and SHALL save the submitted skillset using a parameterized D1 statement.
- IF the skillset is empty, THEN THE SYSTEM SHALL display a validation message and SHALL NOT send a Gemini API request.
- IF the Gemini API is unavailable, rejects the request, or returns unusable suggestions, THEN THE SYSTEM SHALL explain that suggestions could not be generated and preserve the user's entered skills and job requirements.
- THE SYSTEM SHALL keep the Gemini API credential out of browser-visible code and responses.

---

## Handoff Test

*A competent stranger would still need to know which evidence sources are considered strong enough to justify applying to a role, and how the system should weigh factors such as project quality, recruiter connections, and experience gaps. This specification is based on two interviews and should be treated as a practical starting point rather than a fully validated model of hiring behavior.*

## Verification

| Criterion | Steps and input | Expected result | Observed result | Status | Evidence / commit |
|---|---|---|---|---|---|
| EARS 1: normalized comparison | Enter user list `Python, SQL, AWS` and job list `Python, SQL, ETL, AWS`, then click Compare fit. | Score is 75% and the summary reflects a strong fit. | Score displayed as 75% and the strong-fit summary was shown. | PASS | Verified by `node --test app.test.js` with EARS 1 test. |
| EARS 2: empty input validation | Enter an empty user list with `Python` in the job list, then click Compare fit. Also test the reverse. | Validation message appears and no score is computed. | The status message was `Enter at least one skill you know before checking a role.` and then `Add the job requirements to compare against your skills.` | PASS | Verified by `node --test app.test.js` with EARS 2 test. |
| EARS 3: exact match | Enter user list `Python, SQL, AWS` and job list `Python, SQL, AWS`, then click Compare fit. | Score is 100% and missing list is empty. | Score displayed as 100% and missing list had zero entries. | PASS | Verified by `node --test app.test.js` with EARS 3 test. |
| EARS 4: partial fit threshold | Enter user list `Python, SQL` and job list `Python, SQL, ETL, AWS`, then click Compare fit. | Score is 50% and missing skills are listed. | Score displayed as 50% and the missing list included `ETL` and `AWS`. | PASS | Verified by `node --test app.test.js` with EARS 4 test. |
| EARS 5: weak fit threshold | Enter user list `Python` and job list `Python, SQL, ETL, AWS`, then click Compare fit. | Score is below 50% and the weak-fit summary appears. | Score displayed as 25% and the weak-fit summary was shown. | PASS | Verified by `node --test app.test.js` with EARS 5 test. |
| EARS 6: separate matched/missing lists | Enter user list `Python, SQL` and job list `Python, SQL, ETL`, then click Compare fit. | Matched and missing lists are both shown. | Matched list retained `Python` and `SQL`; missing list retained `ETL`. | PASS | Verified by `node --test app.test.js` with EARS 6 test. |
| EARS 7: normalization and deduplication | Enter `Python, , SQL, Python` and `Python, SQL, SQL`, then click Compare fit. | Blank items and duplicates are ignored, and score is 100%. | Score displayed as 100% and missing list stayed empty. | PASS | Verified by `node --test app.test.js` with EARS 7 test. |
| EARS 8: saved lists survive reload | Enter user list `Python, Java, Go, Rust` and job list `Python, Go, Databricks`, compare, then reload the page. | The percentage is generated and both entered lists remain available after reload. | Score displayed as 67%, and both lists were restored after reload; behavior was also manually checked. | PASS | Verified by `node --test app.test.js` with EARS 8 test and manual check. |
| EARS 9: suggest roles from a skillset | Enter a non-empty skillset and request similar jobs. | The system sends the skillset to Gemini through the server and displays job-role suggestions with explanations and relevant skills to build; the API key is not exposed to the browser. | Worker unit tests verified the server request, structured response, and D1 write with mocked Gemini/D1; app tests rendered a mocked suggestion; a manual live click returned role suggestions. | PASS | `npm run test:unit`; `evals/worker.test.js`, `EARS: WHEN the Worker receives a valid POST /job-suggestions request...`; `app.test.js`, `a 429 retry clears suggestions from the previous successful request`; manual browser check. |
| EARS 10: handle invalid input or Gemini failure | Submit an empty skillset, then simulate an unavailable API or unusable response while skills and job requirements are entered. | Empty input is rejected without an API request; API failures are explained and both entered lists remain unchanged. | Worker tests verify empty input is rejected before Gemini and exercise a rate-limited response; app tests verify error messaging. The empty-input UI message and actual retention of both field values are not directly asserted. | PARTIAL | `evals/worker.test.js`, empty-skillset and Gemini-unavailable EARS tests; `app.test.js`, `suggestion errors show the sanitized Gemini reason` and `a 429 retry clears suggestions from the previous successful request`. Add UI assertions for the empty-input message and preservation of both input values to complete coverage. |
| Survive cleared cache and server persistence | Save a valid entry, clear the browser cache and localStorage for the app, reload the page, and verify the entry still appears from the deployed Worker/D1 state. | The record remains available across cache clears because storage is on the server, not only in the browser. | The saved record still appeared after reload, confirming persistence across a cleared browser cache. | PASS | Manual check against the deployed page; this is the HW3 CANNOT TEST YET that became testable and was tested. |
| Failure: browser storage is unavailable | Block localStorage reads and writes, load the page, enter both lists, and submit a valid comparison. | The page reports the storage failure and keeps the user's entered values available. | Not tested in this verification. The failure path has not been exercised with blocked browser storage. | CANNOT TEST YET | A controlled localStorage read/write failure test is needed before marking this PASS. |
| Failure: network is down | Block network access to the Worker or disconnect the client from the internet while the page loads or submits. | The user sees a clear network error and the page does not silently succeed. | No outage was intentionally simulated during verification, so the live app did not expose a blackout path we could trust in this environment. | CANNOT TEST YET | No reliable way to force a controlled outage of the deployed Cloudflare endpoint from this Codespace without interrupting unrelated work. |
| Failure: server returns 500 | Trigger a server-side exception or a D1 binding failure while the page makes a request. | The page shows a server error message instead of crashing the UI or returning a silent failure. | Normal GET/POST requests for this live worker were successful or returned 400; we did not force a 500 path because the deployed D1 binding is healthy. | CANNOT TEST YET | The Worker includes a 500 branch, but a controlled 500 cannot be reproduced reliably without deliberately breaking the deployed service. |
| Failure: server returns 400 | Send a request with a JSON body that is empty or too long (for example, a `text` value > 2,000 characters) to the Worker endpoint. | The request is rejected with HTTP 400 and the user is told why. | A too-long entry returned `400` and the page displayed `Text is too long. Ensure it is less than 2000 characters`. | PASS | Manual browser check against the deployed Worker. |
| Failure: second client writes to the same table | Open two browser clients or tabs and submit different entries to the same shared table. | The app should either serialize writes or explicitly document the lack of concurrency guarantees. | No locking or conflict-resolution behavior was implemented; the app accepts shared persistence but does not define multi-user write semantics. | DEFERRED | ADR-002 accepts shared D1 storage, but not the concurrency contract, conflict handling, or coordination needed for multi-user write safety. |

Cover a normal action, relevant invalid input, and persistence or failure. Classify unselected requirements separately. Record actual outcomes; all-PASS is acceptable with evidence, but a failure mode may also be explicitly CANNOT TEST YET or DEFERRED when the current app does not define that behavior yet.
