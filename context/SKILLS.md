# SKILLS.md

Reusable patterns and delegation guidance, written so an agent (or a
stranger) could apply them next time. Each entry under fifteen lines.
Load-on-demand: an agent reads the heading first and the body only when relevant.

## Pattern: fetch with the failure shown on the page
**When:** any call from app.js to the Worker.
**Do:** check `res.ok`; on failure, read `res.text()` and put it in the
status element with `textContent`; wrap the call in try/catch for network
errors; never throw to the console.
**Because:** localStorage never failed; the network does (ADR-002).

## Delegation guidance: what to paste, what to check first
**Paste, in order:** PROJECT, FEATURES (rows marked), STYLE, STANDARDS, TOOLS, then the current page files. One instruction line naming the files it may touch.
**Check first:** the diff's file list, then innerHTML / concatenated SQL, then whether it used the tokens.
**Reliably wrong (this week):** Copilot: three colors including unapproved gray (8), non-token/lighter text colors (8), concatenated SQL (1), and incorrect Worker 400 messaging (1); Bolt and AI Studio: button blue not `color-primary` (2).

## Testing guidance: How to write unit/ integration tests for any new code added.
**When**: Any testing required for new EARS statements or any additional code added to the project
**Do**: All Javascript code will have a 100% of lines covered. If any lines are missing coverage, add tests for them. Each test will note the appropriate EARS statement and/or number of lines covered by that test
**Because**: Building on untested code can run into issues 
