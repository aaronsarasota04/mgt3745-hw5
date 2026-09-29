// evals/worker.test.js
// The code eval. Run with:   API=https://mgt3745-hw4.<you>.workers.dev npm test
// Each test names the EARS row it checks. Add at least one for your new feature.
import { test } from "node:test";
import assert from "node:assert/strict";

const API = process.env.API;
if (!API) throw new Error("Set API to your deployed Worker URL: API=https://... npm test");

test("EARS: THE SYSTEM SHALL return all entries in creation order (GET /entries is 200 + array)", async () => {
  const res = await fetch(API + "/entries");
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(Array.isArray(body));
  for (let i = 1; i < body.length; i++) assert.ok(body[i].id > body[i - 1].id, "ids ascending");
});

test("EARS: IF the entry text is missing, THEN THE SYSTEM SHALL reject it (POST {} is 400)", async () => {
  const res = await fetch(API + "/entries", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}",
  });
  assert.equal(res.status, 400);
  assert.ok((await res.text()).length > 0, "400 carries a reason");
});

test("EARS: WHEN a valid entry is submitted, THE SYSTEM SHALL store it (POST then GET shows it)", async () => {
  const marker = "eval-" + Date.now();
  const post = await fetch(API + "/entries", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text: marker }),
  });
  assert.equal(post.status, 201);
  const list = await (await fetch(API + "/entries")).json();
  assert.ok(list.some(e => e.text === marker), "posted entry appears in GET");
});

test("EARS: IF the skillset is empty, THEN THE SYSTEM SHALL display a validation message and SHALL NOT send a Gemini API request.", async () => {
  const missing = await fetch(API + "/job-suggestions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jobText: "Python, SQL" }),
  });
  assert.equal(missing.status, 400);
  assert.match(await missing.text(), /userSkills required/i, "missing skillset is rejected");

  const blank = await fetch(API + "/job-suggestions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ userSkills: "   ", jobText: "Python, SQL" }),
  });
  assert.equal(blank.status, 400);
  assert.match(await blank.text(), /userSkills required/i, "blank skillset is rejected");
});

/*test("EARS: IF the Gemini API is unavailable, rejects the request, or returns unusable suggestions, THEN THE SYSTEM SHALL explain that suggestions could not be generated and preserve the user's entered skills and job requirements.", async () => {
  const res = await fetch(API + "/job-suggestions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ userSkills: "Python, SQL", jobText: "Python, SQL, ETL" }),
  });
  assert.ok([429, 502].includes(res.status), "Gemini outage path is surfaced as an error");
  const text = await res.text();
  assert.match(text, /Gemini|quota|unavailable|could not|error/i, "error explains the suggestion failure");
});*/

test("EARS: IF the Gemini API is unavailable, rejects the request, or returns unusable suggestions, THEN THE SYSTEM SHALL explain that suggestions could not be generated and preserve the user's entered skills and job requirements.", async () => {
  const userSkills = "Python, SQL";
  const jobText = "Python, SQL, ETL";

  const res = await fetch(API + "/job-suggestions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ userSkills, jobText }),
  });

  assert.ok(
    [429, 502].includes(res.status),
    "Gemini outage path is surfaced as an error"
  );

  const text = await res.text();

  assert.match(
    text,
    /Gemini|quota|unavailable|could not|error/i,
    "error explains the suggestion failure"
  );

  // Verify the user's entered information was preserved in /entries.
  const entriesRes = await fetch(API + "/entries");
  assert.equal(entriesRes.status, 200);

  const entries = await entriesRes.json();

  const saved = entries.find((entry) => {
    try {
      const data = JSON.parse(entry.text);
      return (
        data.userSkills === userSkills &&
        data.jobText === jobText
      );
    } catch {
      return false;
    }
  });

  assert.ok(
    saved,
    "user's entered skills and job requirements are preserved"
  );
});
