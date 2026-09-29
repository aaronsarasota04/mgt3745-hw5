(async () => {
  'use strict';

  // Keep saved drafts scoped to this feature and avoid accidental global variables.
  const storageKey = 'mgt3745.job-fit.v1';
  const API = 'https://mgt3745-hw4.arahim.workers.dev';
  const userSkillsInput = document.querySelector('#skills-input');
  const jobInput = document.querySelector('#job-input');
  const evaluateButton = document.querySelector('#evaluate-button');
  const statusMessage = document.querySelector('#status-message');
  const resultCard = document.querySelector('#result-card');
  const matchScore = document.querySelector('#match-score');
  const matchSummary = document.querySelector('#match-summary');
  const matchedList = document.querySelector('#matched-list');
  const missingList = document.querySelector('#missing-list');
  const suggestButton = document.querySelector('#suggest-button');
  const suggestStatus = document.querySelector('#suggest-status');
  const suggestionsList = document.querySelector('#suggestions-list');

  // Map common user-entered terms to stable labels used by the comparison result.
  const skillCatalog = [
    { label: 'Python', aliases: ['python', 'py'] },
    { label: 'JavaScript', aliases: ['javascript', 'js'] },
    { label: 'SQL', aliases: ['sql'] },
    { label: 'Java', aliases: ['java'] },
    { label: 'React', aliases: ['react'] },
    { label: 'Node.js', aliases: ['node.js', 'node', 'nodejs'] },
    { label: 'AWS', aliases: ['aws', 'amazon web services'] },
    { label: 'Docker', aliases: ['docker'] },
    { label: 'Kubernetes', aliases: ['kubernetes', 'k8s'] },
    { label: 'ETL', aliases: ['etl', 'extract transform load'] },
    { label: 'Spark', aliases: ['spark'] },
    { label: 'PySpark', aliases: ['pyspark', 'spark sql'] },
    { label: 'Git', aliases: ['git'] },
    { label: 'REST APIs', aliases: ['rest api', 'rest apis', 'api design'] },
    { label: 'Tableau', aliases: ['tableau'] },
    { label: 'Power BI', aliases: ['power bi', 'powerbi'] },
    { label: 'Excel', aliases: ['excel'] },
    { label: 'Machine Learning', aliases: ['machine learning', 'ml'] },
    { label: 'Statistics', aliases: ['statistics', 'statistical analysis'] },
    { label: 'Data Modeling', aliases: ['data modeling', 'data model'] },
    { label: 'Leadership', aliases: ['leadership', 'mentoring'] }
  ];

  // Normalize synonyms before comparison so common abbreviations count as the same skill.
  function normalizeSkill(value) {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9+#\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Split comma- and line-separated input into non-empty entries for comparison.
  function parseList(value) {
    return value
      .split(/[\n,]+/)
      .map(part => part.trim())
      .filter(Boolean);
  }

  // Convert each entered item to one canonical skill name without changing the input text.
  function canonicalSkillName(value) {
    const normalized = normalizeSkill(value);
    if (!normalized) {
      return value.trim();
    }

    for (const skill of skillCatalog) {
      if (skill.aliases.some(alias => normalizeSkill(alias) === normalized || normalized.includes(normalizeSkill(alias)))) {
        return skill.label;
      }
    }

    return value.trim();
  }

  // Build a unique list of canonical skills from the user's free-form entries.
  function extractSkills(value) {
    const entries = parseList(value);
    const found = [];

    entries.forEach(entry => {
      const canonical = canonicalSkillName(entry);
      if (canonical && !found.includes(canonical)) {
        found.push(canonical);
      }
    });

    return found;
  }

  // Render a safe text-only list and allow empty lists to stay empty when a perfect match has no missing skills.
  function renderList(listNode, items, emptyText = 'No skill match yet.') {
    listNode.replaceChildren();

    if (items.length === 0) {
      if (emptyText === null) {
        return;
      }

      const item = document.createElement('li');
      item.textContent = emptyText;
      listNode.append(item);
      return;
    }

    items.forEach(itemText => {
      const item = document.createElement('li');
      item.textContent = itemText;
      listNode.append(item);
    });
  }

  async function load() {
    const res = await fetch(API + '/entries');
    if (!res.ok) {
      return [];
    }
    return res.json();
  }

  async function save(entry) {
    const res = await fetch(API + '/entries', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(entry)
    });

    if (!res.ok) {
      const reason = await res.text();
      if (res.status === 400) {
        statusMessage.className = 'status-text validation-message';
        statusMessage.textContent = 'Text is too long. Ensure it is less than 2000 characters';
        return false;
      }
      statusMessage.textContent = 'Could not sync to the server: ' + (reason || res.status);
      return false;
    }

    return true;
  }

  // Read and validate the last draft, falling back safely when storage is unavailable or corrupt.
  async function loadState() {
    try {
      const storedText = window.localStorage.getItem(storageKey);
      if (storedText !== null) {
        const parsed = JSON.parse(storedText);
        if (parsed && typeof parsed === 'object') {
          return {
            userSkills: typeof parsed.userSkills === 'string' ? parsed.userSkills : '',
            jobText: typeof parsed.jobText === 'string' ? parsed.jobText : ''
          };
        }
      }
    } catch {
      statusMessage.textContent = 'Saved entries could not be read. Your current form values stay in place until you save again.';
    }

    try {
      const entries = await load();
      const latest = Array.isArray(entries) && entries.length > 0 ? entries[entries.length - 1] : null;
      if (latest && typeof latest.text === 'string') {
        const parsed = JSON.parse(latest.text);
        if (parsed && typeof parsed === 'object') {
          return {
            userSkills: typeof parsed.userSkills === 'string' ? parsed.userSkills : '',
            jobText: typeof parsed.jobText === 'string' ? parsed.jobText : ''
          };
        }
      }
    } catch {
      // The network itself may be down; we keep the in-browser draft and let the user continue.
    }

    return { userSkills: '', jobText: '' };
  }

  // Persist the draft to the browser only; the Worker is updated only when the user explicitly evaluates a match.
  function saveDraft(nextState) {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(nextState));
      return true;
    } catch {
      statusMessage.textContent = 'Could not save. Your typed values are still here and can be retried.';
      return false;
    }
  }

  function buildDraftState() {
    return {
      userSkills: userSkillsInput.value,
      jobText: jobInput.value
    };
  }

  async function saveEvaluation(nextState) {
    try {
      return await save({ text: JSON.stringify(nextState) });
    } catch {
      statusMessage.textContent = 'Could not reach the server';
      return false;
    }
  }

  // Validate both inputs, calculate the percentage, and update only the result view.
  async function evaluateMatch() {
    const userSkills = extractSkills(userSkillsInput.value);
    const jobText = jobInput.value.trim();

    if (!userSkills.length) {
      statusMessage.className = 'status-text validation-message';
      statusMessage.textContent = 'Enter at least one skill you know before checking a role.';
      resultCard.hidden = true;
      return false;
    }

    if (!jobText) {
      statusMessage.className = 'status-text validation-message';
      statusMessage.textContent = 'Add the job requirements to compare against your skills.';
      resultCard.hidden = true;
      return false;
    }

    const saved = await saveEvaluation(buildDraftState());
    if (!saved) {
      resultCard.hidden = true;
      return false;
    }

    const jobRequirements = extractSkills(jobText);
    const matchedSkills = jobRequirements.filter(skill =>
      userSkills.some(userSkill => normalizeSkill(userSkill) === normalizeSkill(skill))
    );
    const missingSkills = jobRequirements.filter(skill => !matchedSkills.includes(skill));
    const score = jobRequirements.length === 0
      ? 0
      : Math.round((matchedSkills.length / jobRequirements.length) * 100);

    const statusText = score >= 75
      ? 'Strong fit. This role looks like a realistic match.'
      : score >= 50
        ? 'Partial fit. A few tools are missing, but the role may still be worth pursuing.'
        : 'Weak fit. The missing requirements are significant for this role.';

    matchScore.textContent = `${score}%`;
    matchSummary.textContent = statusText;
    renderList(matchedList, matchedSkills);
    renderList(missingList, missingSkills, score === 100 ? null : 'No skill match yet.');
    resultCard.hidden = false;
    statusMessage.className = 'status-text';
    statusMessage.textContent = 'Match check complete.';

    saveDraft(buildDraftState());
    return true;
  }

  // Request job-role suggestions from the Worker, which calls the Gemini API server-side so the API key never reaches the browser.
  async function fetchJobSuggestions(userSkills) {
    const res = await fetch(API + '/job-suggestions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ userSkills, jobText: jobInput.value })
    });

    if (!res.ok) {
      const reason = await res.text().catch(() => '');
      return { ok: false, status: res.status, reason };
    }

    const data = await res.json();
    return { ok: true, suggestions: data.suggestions };
  }

  // Render each suggestion as a card with the role name, explanation, and skills to build next.
  function renderSuggestions(suggestions) {
    suggestionsList.replaceChildren();

    suggestions.forEach(item => {
      const card = document.createElement('article');
      card.className = 'suggestion-card';

      const roleHeading = document.createElement('h3');
      roleHeading.textContent = item.role;
      card.append(roleHeading);

      const explanation = document.createElement('p');
      explanation.className = 'suggestion-explanation';
      explanation.textContent = item.explanation;
      card.append(explanation);

      if (Array.isArray(item.relevantSkillsToBuild) && item.relevantSkillsToBuild.length > 0) {
        const skillsLabel = document.createElement('p');
        skillsLabel.className = 'suggestion-skills-label';
        skillsLabel.textContent = 'Skills to build';
        card.append(skillsLabel);

        const skillsList = document.createElement('ul');
        skillsList.className = 'suggestion-skills';
        item.relevantSkillsToBuild.forEach(skill => {
          const li = document.createElement('li');
          li.textContent = skill;
          skillsList.append(li);
        });
        card.append(skillsList);
      }

      suggestionsList.append(card);
    });

    suggestionsList.hidden = false;
  }

  // Validate the skillset, call the Worker, and display suggestions or an error without clearing entered values.
  async function showSuggestions() {
    const userSkills = userSkillsInput.value.trim();
    suggestionsList.replaceChildren();
    suggestionsList.hidden = true;

    if (!userSkills) {
      suggestStatus.className = 'status-text validation-message';
      suggestStatus.textContent = 'Enter at least one skill above before requesting suggestions.';
      suggestionsList.hidden = true;
      return;
    }

    suggestStatus.className = 'status-text';
    suggestStatus.textContent = 'Finding similar roles…';
    suggestButton.disabled = true;

    let result;
    try {
      result = await fetchJobSuggestions(userSkills);
    } catch {
      suggestStatus.textContent = 'Could not reach the server. Your skills and job requirements are still here.';
      suggestButton.disabled = false;
      return;
    }

    suggestButton.disabled = false;

    if (!result.ok) {
      suggestionsList.hidden = true;
      if (result.status === 400) {
        suggestStatus.className = 'status-text validation-message';
        suggestStatus.textContent = 'Enter at least one skill above before requesting suggestions.';
      } else {
        const reason = result.reason.trim();
        suggestStatus.textContent = reason
          ? `Suggestions failed: ${reason}${reason.endsWith('.') ? '' : '.'} Your skills and job requirements are still here.`
          : 'Suggestions could not be generated right now. Your skills and job requirements are still here.';
      }
      return;
    }

    renderSuggestions(result.suggestions);
    suggestStatus.textContent = 'Suggestions ready. Explore these roles as starting points for further research.';
  }

  // Restore the draft before wiring the click action so a failed storage write never clears typed input.
  const savedState = await loadState();
  userSkillsInput.value = savedState.userSkills;
  jobInput.value = savedState.jobText;

  evaluateButton.addEventListener('click', async () => {
    const nextState = buildDraftState();
    saveDraft(nextState);
    const valid = await evaluateMatch();
    if (!valid) {
      return;
    }
    statusMessage.textContent = 'Comparison saved.';
  });

  suggestButton.addEventListener('click', showSuggestions);
})();

