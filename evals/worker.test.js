// evals/worker.test.js
// The code eval. Run with:   API=https://mgt3745-hw4.<you>.workers.dev npm test
// Each test names the EARS row it checks. Add at least one for your new feature.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import worker from "../worker.js";

const API = process.env.API;
const integrationTest = API ? test : test.skip;

integrationTest("EARS: THE SYSTEM SHALL return all entries in creation order (GET /entries is 200 + array)", async () => {
  const res = await fetch(API + "/entries");
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(Array.isArray(body));
  for (let i = 1; i < body.length; i++) assert.ok(body[i].id > body[i - 1].id, "ids ascending");
});

integrationTest("EARS: IF the entry text is missing, THEN THE SYSTEM SHALL reject it (POST {} is 400)", async () => {
  const res = await fetch(API + "/entries", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}",
  });
  assert.equal(res.status, 400);
  assert.ok((await res.text()).length > 0, "400 carries a reason");
});

integrationTest("EARS: WHEN a valid entry is submitted, THE SYSTEM SHALL store it (POST then GET shows it)", async () => {
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

integrationTest("EARS: IF the skillset is empty, THEN THE SYSTEM SHALL display a validation message and SHALL NOT send a Gemini API request.", async () => {
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

integrationTest("EARS: IF the Gemini API is unavailable, rejects the request, or returns unusable suggestions, THEN THE SYSTEM SHALL explain that suggestions could not be generated and preserve the user's entered skills and job requirements.", async () => {
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

function makeDb() {
  const writes = [];

  return {
    writes,
    prepare(sql) {
      return {
        bind(...values) {
          return {
            async run() {
              writes.push({ sql, values });
            },
          };
        },
      };
    },
  };
}

function post(path, body) {
  return new Request(`https://worker.test${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

test("EARS: IF a submitted entry exceeds 2,000 characters, THEN THE SYSTEM SHALL reject it with a 400 response and identify that the entry is too long.", async () => {
  const db = makeDb();
  const response = await worker.fetch(
    post("/entries", { text: "x".repeat(2001) }),
    { DB: db },
  );

  assert.equal(response.status, 400);
  assert.match(await response.text(), /too long/i);
  assert.equal(db.writes.length, 0);
});

test("EARS: IF the skillset is empty, THEN THE SYSTEM SHALL reject it without a Gemini API request.", async () => {
  const db = makeDb();
  const originalFetch = globalThis.fetch;
  let geminiRequestCount = 0;
  globalThis.fetch = async () => {
    geminiRequestCount += 1;
    throw new Error("Gemini should not be called");
  };

  try {
    const response = await worker.fetch(
      post("/job-suggestions", { userSkills: "   ", jobText: "SQL" }),
      { DB: db, GEMINI_API: "unit-test-secret" },
    );

    assert.equal(response.status, 400);
    assert.match(await response.text(), /userSkills required/i);
    assert.equal(geminiRequestCount, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("EARS: WHEN the Worker receives a valid POST /job-suggestions request, THE SYSTEM SHALL return structured job suggestions and save the submitted skillset using a parameterized D1 statement.", async () => {
  const db = makeDb();
  const userSkills = "Python, SQL";
  const jobText = "Python, SQL, ETL";
  const suggestions = [{
    role: "Data Analyst",
    explanation: "Uses Python and SQL to analyze data.",
    relevantSkillsToBuild: ["ETL"],
  }];
  const generatedText = JSON.stringify({ suggestions });
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async (url, options) => {
    assert.match(url, /generativelanguage\.googleapis\.com/);
    assert.equal(options.method, "POST");
    assert.equal(options.headers["x-goog-api-key"], "unit-test-secret");
    const requestBody = JSON.parse(options.body);
    assert.match(requestBody.contents[0].parts[0].text, /Python, SQL/);
    return new Response(JSON.stringify({
      candidates: [{ content: { parts: [{ text: generatedText }] } }],
    }), { status: 200 });
  };

  try {
    const response = await worker.fetch(
      post("/job-suggestions", { userSkills, jobText }),
      { DB: db, GEMINI_API: "unit-test-secret" },
    );

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { suggestions });
    assert.equal(db.writes.length, 1);
    assert.match(db.writes[0].sql, /VALUES \(\?, \?\)/);
    assert.deepEqual(db.writes[0].values, [
      JSON.stringify({ userSkills, jobText }),
      generatedText,
    ]);
    assert.doesNotMatch(db.writes[0].sql, /Python|SQL|ETL/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("EARS: THE SYSTEM SHALL keep the Gemini API credential out of browser-visible code and responses.", async () => {
  const secret = "unit-test-secret";
  const db = makeDb();
  const originalFetch = globalThis.fetch;
  const browserSources = await Promise.all([
    readFile(new URL("../app.js", import.meta.url), "utf8"),
    readFile(new URL("../aisapp.js", import.meta.url), "utf8"),
  ]);

  for (const source of browserSources) {
    assert.doesNotMatch(source, /x-goog-api-key|generativelanguage\.googleapis\.com|AIza[0-9A-Za-z_-]{20,}/i);
  }

  globalThis.fetch = async () => new Response(JSON.stringify({
    error: { message: `Request rejected for key ${secret}` },
  }), { status: 429 });

  try {
    const response = await worker.fetch(
      post("/job-suggestions", { userSkills: "SQL", jobText: "Data" }),
      { DB: db, GEMINI_API: secret },
    );
    const text = await response.text();

    assert.equal(response.status, 502);
    assert.match(text, /\[redacted\]/);
    assert.ok(!text.includes(secret));
    assert.ok(!db.writes[0].values.join(" ").includes(secret));
  } finally {
    globalThis.fetch = originalFetch;
  }
});
