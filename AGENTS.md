# AGENTS.md

Podcast Creator: a step-by-step system, in Spanish, for creating a podcast from zero to launch. It is used by Carlos and Michelle.

## Ground rules
- Never merge PRs. Carlos merges.
- One issue → one PR. The PR body links it with `Closes #N`.
- CI must be green before a PR is called ready.
- Keep code mostly comment-free. Never add comments that explain workarounds.
- Spanish is the default language. Wrap every visible string in `t('texto en español')` from `src/i18n.js`, and add its English entry to `src/locales/en.json`. A Vitest test fails if a key is missing.
- Never print, log, echo or commit secrets or API keys. Keys (`XAI_API_KEY`, `YOUTUBE_API_KEY`) live only as Supabase secrets.
- No destructive SQL. Migrations go in `supabase/migrations/` and only add things. Ask Carlos (`needs-carlos`) before applying one.
- Don't change GitHub Pages or Supabase project settings.
- Tests and CI never call real Supabase or xAI. Use demo mode or mocks.
- UI text is in plain language, with no technical jargon.

## Stack
- React 19 + Vite, JavaScript (no TypeScript), plain CSS (`src/index.css`, dark purple tokens).
- Supabase: email/password auth, Postgres with RLS (`allowed_emails`, `is_allowed()`), and Edge Functions in `supabase/functions/` (`ai-chat`, `check-name`, `research-referente`).
- Demo mode: `src/demo.jsx` provides a read-only fake `DataContext`. `src/demo-ai.js` holds canned AI answers.
- Course content: `src/guide.js` (31 steps) and `src/modules/*.js` (10 modules).
- Deploy: GitHub Pages through `.github/workflows/deploy.yml` on push to `main`.

## Commands
```bash
source ~/.nvm/nvm.sh && nvm use 24
npm ci
npm run lint        # oxlint
npm test            # vitest run
npm run build
CI= npm run e2e     # Playwright smoke tests against vite preview (Chromium)
```

## Tests
- Unit tests: `src/*.test.js` (Vitest).
- Smoke tests: `e2e/smoke.spec.js`. The fixture in `e2e/fixtures.js` fails the test on any console error or on any request to Supabase, xAI, the YouTube API or iTunes.
- CI: `.github/workflows/ci.yml` runs the jobs "Lint, test y build" and "Smoke (Playwright)".

## PRs
- Branch: `devin/<issue-number>-<slug>`.
- Template: `.github/PULL_REQUEST_TEMPLATE/devin_pr_template.md`.
- For UI changes, include before/after screenshots at 390px and 1280px.
- Playbook: `.devin/playbooks/issue-to-pr.md`.
