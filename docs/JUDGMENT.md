# Judgment Eval: <feature>

The seven checklist questions, extended to at least ten, specific to this
feature and this STYLE.md. Two grader columns. If the second grader is a
model, paste the prompt you gave it at the bottom and mark every disagreement.
Agreement under 80 percent is a finding about the rubric, logged in EVALS.md.

| # | Question (yes/no) | You | Grader 2 | Agree? |
|---|---|---|---|---|
| 1 | Only index.html, styles.css, app.js changed? | Yes | No | No |
| 2 | No innerHTML with user input anywhere in the diff? |Yes | Yes | Yes |
| 3 | No string-concatenated SQL in worker.js? |No | Yes | No |
| 4 | Every text color is a STYLE.md token? |No | No | Yes |
| 5 | Every font is a STYLE.md token? |Yes | No | No |
| 6 | No new dependency in package.json? |Yes | Yes | Yes |
| 7 | Data goes through the Worker, not local state alone? |Yes | Yes | Yes |
| 8 | When the Worker returns 400, the reason is shown on the page? |Yes | No | No |
| 9 | If the Gemini API fails or is rate-limited, is that shown in the output? | Yes | Yes | Yes |
| 10 | Is there no Gemini API key anywhere in the project? | Yes | Yes | Yes |

Agreement: 6 of 10 (60%)

## Grader 2 prompt (if a model)
```
Go through the entire project and answer yes/no only to the 10 questions listed in Judgement eval. Do not modify any other part of the project.
```
