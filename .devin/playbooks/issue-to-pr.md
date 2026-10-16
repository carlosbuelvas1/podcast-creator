# issue-to-pr

## Overview
Take the single highest-priority open issue in `carlosbuelvas1/podcast-creator` labeled `devin-ready` that has no open PR (`priority:P0` > `priority:P1` > `priority:P2`, oldest first), and deliver one PR that closes it.

## Procedure
1. Pull `main`. Read `AGENTS.md`.
2. Pick the issue: `gh issue list --label devin-ready --state open --json number,title,labels,createdAt`. Skip issues that are labeled `devin-blocked` or `needs-carlos`, and skip any issue that already has an open PR linked to it.
3. Read the whole issue, including its acceptance criteria and test notes. Comment "Working on this" on it.
4. Create the branch `devin/<issue-number>-<slug>` from `main`.
5. Implement only what the issue asks for. Spanish stays the default language. Every new visible text goes through `t()`, and its English key goes in `src/locales/en.json`.
6. Add or adjust Vitest tests (`src/*.test.js`) and Playwright smoke tests (`e2e/`) when they apply.
7. Run locally: `npm ci`, `npm run lint`, `npm test`, `npm run build`, `CI= npm run e2e`. All must pass.
8. Open the PR with `.github/PULL_REQUEST_TEMPLATE/devin_pr_template.md`. Fill in "Closes #N", what changed, how it was tested, screenshots, and ACUs used.
9. Wait for CI and fix it until it's green.
10. For UI changes, post before/after screenshots at 390px and 1280px.

## Specifications
- Exactly one issue and one PR per session.
- CI is green before the PR is called ready.
- No secrets in code, logs or PR text.
- Code is mostly comment-free, with no comments explaining workarounds.
- Spanish is the default language, and English keys are added for every new string.

## Forbidden actions
- Merging any PR.
- Force-pushing `main`.
- Touching more than one issue.
- Editing workflows or secrets, unless the issue says so.
- Calling the real xAI API (or real Supabase) in tests.
- Running destructive SQL, or changing GitHub Pages or Supabase project settings.
- Going over the session's ACU limit.

## If blocked
Add the `devin-blocked` label to the issue, comment on it explaining why and what is needed, and end the session.
