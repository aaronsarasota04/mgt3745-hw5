(async () => {
  'use strict';

  // Keep saved drafts scoped to this feature and avoid accidental global variables.
  const storageKey = 'mgt3745.job-fit.v1';
  const API = 'https://mgt3745-hw4.arahim.workers.dev';
  const userSkillsInput = document.querySelector('#skills-input');
  const jobInput = document.querySelector('#job-input');
  const evaluateButton = document.querySelector('#evaluate-button');
  const suggestRolesButton = document.querySelector('#suggest-roles-button');
  const statusMessage = document.querySelector('#status-message');
  const resultCard = document.querySelector('#result-card');
  const matchScore = document.querySelector('#match-score');
  const matchSummary = document.querySelector('#match-summary');
  const matchedList = document.querySelector('#matched-list');
  const missingList = document.querySelector('#missing-list');
  const suggestionsCard = document.querySelector('#suggestions-card');
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

  // Fetch persisted entries from the remote Worker D1 database.
  async function load() {
    const res = await fetch(API + '/entries');
    if (!res.ok) {
      return [];
    }
    return res.json();
  }

  // Save the current evaluation state to the remote Worker D1 database.
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

  // Create an object representing the current text values of the form fields.
  function buildDraftState() {
    return {
      userSkills: userSkillsInput.value,
      jobText: jobInput.value
    };
  }

  // Send an evaluated match snapshot to the remote Worker storage.
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

  // Send a request to the backend Worker endpoint to obtain Gemini-powered role suggestions.
  async function fetchJobSuggestions(userSkills, jobText) {
    const response = await fetch(API + '/job-suggestions', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ userSkills, jobText })
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(errorText || `Status ${response.status}`);
    }

    return response.json();
  }

  // Render suggested job roles and skills safely into the DOM using textContent to prevent XSS.
  function renderSuggestions(suggestions) {
    if (!suggestionsList || !suggestionsCard) {
      return;
    }

    suggestionsList.replaceChildren();

    suggestions.forEach(item => {
      const card = document.createElement('article');
      card.className = 'suggestion-item';

      const roleHeading = document.createElement('h3');
      roleHeading.textContent = item.role;
      card.append(roleHeading);

      const explanationParagraph = document.createElement('p');
      explanationParagraph.className = 'suggestion-explanation';
      explanationParagraph.textContent = item.explanation;
      card.append(explanationParagraph);

      if (Array.isArray(item.relevantSkillsToBuild) && item.relevantSkillsToBuild.length > 0) {
        const skillsHeading = document.createElement('h4');
        skillsHeading.className = 'suggestion-skills-heading';
        skillsHeading.textContent = 'Relevant skills to build';
        card.append(skillsHeading);

        const skillsList = document.createElement('ul');
        skillsList.className = 'suggestion-skills-list';
        item.relevantSkillsToBuild.forEach(skill => {
          const skillItem = document.createElement('li');
          skillItem.textContent = skill;
          skillsList.append(skillItem);
        });
        card.append(skillsList);
      }

      suggestionsList.append(card);
    });

    suggestionsCard.hidden = false;
  }

  // Validate the user's skillset, request job-role suggestions, and handle success and failure paths.
  async function suggestJobRoles() {
    const rawSkills = userSkillsInput.value.trim();
    const skills = extractSkills(rawSkills);

    // Reject empty skill input without sending a Gemini API request as specified in acceptance criteria.
    if (!skills.length) {
      statusMessage.className = 'status-text validation-message';
      statusMessage.textContent = 'Enter at least one skill you know before requesting job suggestions.';
      if (suggestionsCard) {
        suggestionsCard.hidden = true;
      }
      return false;
    }

    // Preserve the current form values in storage and local scope before initiating network request.
    const currentState = buildDraftState();
    saveDraft(currentState);

    statusMessage.className = 'status-text';
    statusMessage.textContent = 'Requesting role suggestions from Gemini...';

    try {
      const data = await fetchJobSuggestions(rawSkills, jobInput.value);
      const suggestions = data && data.suggestions;

      // Ensure that the returned suggestions are structured properly.
      const isValid = Array.isArray(suggestions) && suggestions.length > 0
        && suggestions.every(item => typeof item.role === 'string' && typeof item.explanation === 'string');

      if (!isValid) {
        throw new Error('Unusable suggestions format');
      }

      renderSuggestions(suggestions);
      statusMessage.className = 'status-text';
      statusMessage.textContent = 'Job suggestions loaded.';
      return true;
    } catch {
      // Explain that suggestions could not be generated while preserving user entered inputs.
      statusMessage.className = 'status-text validation-message';
      statusMessage.textContent = 'Suggestions could not be generated at this time. Please try again.';
      if (suggestionsCard) {
        suggestionsCard.hidden = true;
      }
      userSkillsInput.value = currentState.userSkills;
      jobInput.value = currentState.jobText;
      return false;
    }
  }

  // Restore the draft before wiring the click action so a failed storage write never clears typed input.
  const savedState = await loadState();
  if (savedState.userSkills) {
    userSkillsInput.value = savedState.userSkills;
  }
  if (savedState.jobText) {
    jobInput.value = savedState.jobText;
  }

  evaluateButton.addEventListener('click', async () => {
    const nextState = buildDraftState();
    saveDraft(nextState);
    const valid = await evaluateMatch();
    if (!valid) {
      return;
    }
    statusMessage.textContent = 'Comparison saved.';
  });

  if (suggestRolesButton) {
    suggestRolesButton.addEventListener('click', async () => {
      await suggestJobRoles();
    });
  }
})();
