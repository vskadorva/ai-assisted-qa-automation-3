---
name: self-heal
description: >
  Heals one drifted Playwright locator in its page object and opens a PR.
  Use the moment someone says "the build is red because a locator broke",
  "fix the drifted selector", "the test broke after a UI change", or
  "heal the suite" — even if they do not name this skill. Use it ONLY after
  triage classifies the red run as a test issue (drift), never for a real
  app bug.
---

# Self-heal

One repair per run. Every heal becomes a PR. Never merge.

Do not classify the run yourself. Do not delegate the locator edit to test-writer. Do not edit application source.

## Steps

1. Require triage's drift classification, else stop and route to bug-reporter.

   Proceed only when triage ([ci-failure-triage](../ci-failure-triage/SKILL.md)) has already classified this red run as a **test issue (drift)**: the assertion is still the right behavior, and a locator in `pages/` no longer matches the element.

   If triage has not classified this run, stop and delegate to triage. Do not heal on your own reading of the log.

   If the classification is anything else — real app bug, environment, flake, or a test issue that is not locator drift — stop and route to [jira-bug-reporter](../jira-bug-reporter/SKILL.md). Do not file until a human confirms the defect. Do not patch the POM so a product defect goes green.

2. From the trace, find the failing locator and its POM.

   Read the Playwright error and trace. Local runs leave them under `test-results/`. A CI run leaves them in the `playwright-report` artifact (see ci-failure-triage).

   Record the spec path, the exact test title, and the locator in the error (timeout or strict-mode violation). The stack frame under `pages/` names the page object and the `readonly` property to repair. That property is the only candidate. Do not pick a second locator from the same file.

3. Re-discover the element via the Playwright MCP a11y tree by its role + current accessible name.

   Use the Playwright MCP `browser_snapshot` (a11y tree). Do not take the new name from a screenshot.

   Base URL is `DIDAXIS_URL` or `https://test.didaxis.studio`. Open the page the failing test was on. If the MCP session is signed out, sign in at `/login` with `DIDAXIS_EMAIL` / `DIDAXIS_PASSWORD` from `.env`. Never hardcode credentials. If either variable is missing, stop and say recon was skipped.

   Find the control by its role and its current accessible name. That pair is the new locator. Read [pom-conventions](../pom-conventions/SKILL.md): `getByRole`, then `getByLabel` / `getByPlaceholder`, then `getByText`. No CSS or XPath.

   If no node has that role, or the control the scenario needs is absent, this is not drift. Stop and route to bug-reporter.

4. Patch the locator in the POM, minimal role-based diff, never the spec's assertions.

   Change only that one locator assignment in `pages/`. Keep the property name. Do not refactor the page object. Do not edit `tests/`, `fixtures/`, or application source. Every `expect(...)` stays byte-for-byte as it was.

5. Re-run and prove green WITH assertions unchanged (green via a weakened assertion is a bug, escalate).

   Before the run, `git diff` on `tests/` must show no assertion edits. If it touches `expect`, revert the spec.

   ```bash
   npx playwright test <spec> -g "<exact title>"
   ```

   Green with those same assertions is the proof. If the re-run is red, stop. One repair per run — do not try another locator and do not re-run that spec again.

   If the only way to go green is to change, remove, or loosen an assertion, revert that edit. Green via a weakened assertion is a bug, escalate: stop and route to bug-reporter. Do not open the heal PR.

6. Report the old->new locator diff + the green run.

   Reply with the report below, then open the PR. Commit only the POM locator change. Push and `gh pr create`. Never merge. A human approves the merge.

   If the spec or `features/<KEY>.feature` names a DS key, put that key in the PR title and body.

## Report

```markdown
## Self-heal

**Classification:** test issue (drift) — triage <run id or PR comment>
**Spec:** `tests/...` — `<exact title>`
**POM:** `pages/<Page>.ts` — `<property>`

### Locator
- **Old:** `page.getByRole(...)`
- **New:** `page.getByRole(...)`
- **A11y:** role `<role>`, accessible name `<name>` (Playwright MCP `browser_snapshot`)

### Proof
- Command: `npx playwright test <spec> -g "<exact title>"`
- Result: passed
- Assertions: unchanged (`git diff` on the spec has no `expect` edits)

### PR
<url>
```

## Rules

- One repair per run. Leave every other red locator for the next run.
- Every heal becomes a PR. No PR when the proof is missing or the assertion moved.
- Never merge. Never file a Bug until a human confirms the defect.
