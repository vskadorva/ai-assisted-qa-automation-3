# AI-assisted QA automation (Didaxis)

Playwright end-to-end tests for Didaxis, with Cursor agents and skills for turning Jira stories into specs and handling backlog generation in CI.

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- npm

## Install

```bash
git clone <repository-url>
cd ai-assisted-qa-automation-3
npm ci
npx playwright install --with-deps chromium
```

## Environment

Tests load variables from a root `.env` file (see `playwright.config.ts`).

```bash
cp .env.example .env
```

Edit `.env` and set at least the **Run tests** variables:

| Variable | Purpose |
|----------|---------|
| `DIDAXIS_URL` | Application base URL |
| `DIDAXIS_EMAIL` / `DIDAXIS_PASSWORD` | Login for auth setup and UI flows |
| `DIDAXIS_API_TOKEN` | API bearer for program cleanup (optional at first run; may be refreshed after login) |

Optional `DIDAXIS_ALT_EMAIL` / `DIDAXIS_ALT_PASSWORD` support permission probes when you add those tests.

Do not commit `.env`. Use placeholders only in `.env.example`.

The **Agent / CI setup** block in `.env.example` (`CURSOR_API_KEY`, Atlassian vars) is for the test-generation workflow and Jira MCP—not required to run the suite locally.

## Run tests

Full suite (setup project signs in once, then Chromium specs):

```bash
npx playwright test
```

Other scripts:

```bash
npm run test:ui      # Playwright UI mode
npm run test:headed  # Headed browser
npm run report       # Open last HTML report
```

Manual-only specs (`*.manual.spec.ts`) are excluded from the default config. Use `playwright.manual.config.ts` when you intentionally run them.

## Run a tagged slice

Each test should carry a single tag (for example `@regression` or `@DS-3`). Run a subset with `--grep`:

```bash
npx playwright test --grep @regression
npx playwright test --grep @DS-3
```

## CI

- **E2E Tests** (`.github/workflows/e2e.yml`) — `npx playwright test` on push/PR; needs Didaxis secrets only.
- **Test generation** (`.github/workflows/test-generation.yml`) — headless Cursor `agent` backlog mode; needs Didaxis secrets plus `CURSOR_API_KEY` and Atlassian credentials.

## Cursor agents and skills

This repo ships automation guidance under `.cursor/`:

| Path | Role |
|------|------|
| `.cursor/rules/constitution.mdc` | Playwright guardrails (locators, assertions, tags) |
| `.cursor/rules/qa-orchestration.mdc` | When to analyze tickets, write tests, heal, or file bugs |
| `.cursor/rules/playwright-conventions.mdc` | Patterns aligned with existing specs and POMs |
| `.cursor/agents/` | Subagents: `test-writer`, `triage`, `bug-reporter` |
| `.cursor/skills/` | Workflows: Jira → Gherkin, self-heal, API cleanup, explore-and-generate, etc. |
| `.cursor/hooks.json` | Hooks that enforce generation and assertion policies |

**Local agent use:** Open the repo in [Cursor](https://cursor.com), enable the Atlassian MCP (or plugin) in **Settings → MCP**, and sign in so Jira/Confluence tools work. Put Didaxis credentials in `.env` for UI recon and test runs.

**CI agent use:** Store `CURSOR_API_KEY`, `ATLASSIAN_EMAIL`, `ATLASSIAN_API_TOKEN`, and optionally set `ATLASSIAN_BASE_URL` to match your site; mirror Didaxis variables as GitHub Actions secrets. Trigger **Test generation** via `workflow_dispatch`.

Gherkin plans live under `features/`; implementing specs live under `tests/` with page objects in `pages/` and shared fixtures in `fixtures/`.

## Project layout (tests)

```
tests/           # Playwright specs
pages/           # Page objects (role-first locators)
fixtures/        # Auth cleanup and shared test fixtures
features/        # Gherkin plans (Jira / explore)
playwright/.auth # Generated storage state (gitignored)
```
