# Canonical agent instructions


## Implementation

- Represent job-to-skill comparisons using percentages to show the degree of alignment between a user's skills and a job's requirements.
- Give each JavaScript function a distinct purpose and keep functions loosely coupled so that features can be expanded without unnecessarily affecting unrelated functionality.
- Add comments explaining the purpose of all JavaScript functions, HTML sections, and CSS sections so that other developers can understand and maintain the code.
- Use descriptive camelCase names and lexical scope. Keep HTML, CSS, and JavaScript separate.
- Explain significant reasons in comments.
- Use meaningful commit messages.
- Insert user text with textContent; do not use innerHTML for it.
- Label controls and preserve unsaved input after a failed write.
- Verify expected behavior before claiming completion.
- Never invent interview evidence or test results.
- Leave preview files as previews.


## Conflicting instructions

If a rule conflicts with another instruction file, resolve the conflict intentionally and do not silently apply a different policy.

Root CLAUDE.md imports this file for Claude Code. VS Code Copilot uses the separate .github/copilot-instructions.md adapter. A location under /context alone is not a guarantee of automatic discovery.

### Colleague Test

- **Read by:** Prince.
- **Misunderstood or asked about:** Why Claude should use different font sizes for the app.
- **Revision made:** Font-size guidance was removed from STANDARDS.md and CLAUDE.md and added to the task prompt.


