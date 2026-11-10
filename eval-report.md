# Suite reliability eval report

**Repo:** `vskadorva/ai-assisted-qa-automation-3`  
**Window:** last **24** completed **E2E Tests** workflow runs (`e2e.yml`) through **2026-11-10**  
**Note:** Cursor has no built-in telemetry for these metrics; everything below is derived from GitHub Actions logs, PR/check history, and a manual pass over Cursor agent transcripts for this project.

---

## Flake rate

| Metric | Value |
|--------|------:|
| Flaky test outcomes (passed only after retry) | **2** |
| Total test outcomes across the window (passed + failed + flaky) | **454** |
| **Flake rate** | **0.44%** (2 ÷ 454) |
| CI runs with ≥1 flaky test | **2** ÷ 24 (8.3%) |

**How measured:** `gh run list --workflow=e2e.yml --limit 25`, then `gh run view <id> --log` on each completed run. Parsed Playwright’s summary line (`N flaky`) and the GitHub notice that names the test. Config uses `retries: 2` on CI (`playwright.config.ts`).

**Flaky tests observed (2 unique):**

1. `tests/ds1-create-program.spec.ts` → TC-008: Description accepts long text and special characters (run `39350862535`, 2026-10-20, overall **success**).
2. `tests/programs.a11y.spec.ts` → Keyboard opens the New Program dialog (run `42149853005`, 2026-11-06, overall **failure**).

**What it tells us:** Retries mask almost no instability; flakes are rare compared with hard failures. The bigger problem is run-level redness (21/24 failures), not timing.

---

## Heal success rate

| Metric | Value |
|--------|------:|
| Drift heal campaigns (repair PRs, deduped) | **2** (#6 `newProgramButton`, #7 `emptyStateCreateButton`; #5 closed as duplicate of #6) |
| Healed cleanly (post-patch proof run green, `tests/` assertions unchanged) | **2** ÷ **2** → **100%** |
| **Masked regressions** (assertion weakened/deleted to go green) | **0** |

**How measured:**

- **PR history:** `gh search prs heal`, `gh pr view` / `gh pr checks` on #5–#8.
- **Session review:** [Self-heal after local PW failures](e639beb8-431f-45cd-afa5-6076587e38b5) — triage → one locator patch → `git diff tests/` clean → scoped `npx playwright test` proof before opening PR #5/#6.
- **Assertion safety:** heal PRs touch `pages/ProgramsPage.ts` only; no `expect` edits in repair diffs (aligned with `assertion-refusal` / orchestration policy).

**Caveats:** Scoped proof runs passed; **full-suite E2E on heal PRs still failed** (other Programme/Programs locators and unrelated reds). That is incomplete drift remediation, not a masked regression.

**What it tells us:** Self-heal discipline is sound (recon, single locator, no assertion edits), but **one locator per run** leaves multi-string POM drift only partly fixed, so CI stays red until the remaining labels are aligned.

---

## Generation-gate pass rate

**Definition (first ticket PR):** E2E **green** on first PR head + spec **conforming** (generation + constitution gates) + **maps to acceptance criteria** (Gherkin / Jira scenario coverage).

| Ticket | First PR | CI green (first head) | Conforming (static) | Maps to AC | Full gate pass |
|--------|----------|----------------------|---------------------|------------|----------------|
| DS-1 | #2 (open) | No (`test` fail / none green) | Yes on PR files | No `features/DS-1.feature` on `main` | **No** |
| DS-2 | #3 (open) | No | Yes on PR files | No feature file on `main` | **No** |
| DS-294 | #8 (merged) | No (run `42149786506`) | Yes (`tests/ds294-program-list-display.spec.ts` — role-first, one tag per test, `expect` in spec) | Yes (`features/DS-294.feature` scenarios ↔ test titles) | **No** |

| **Generation-gate pass rate (full triple)** | **0** ÷ **3** → **0%** |
| Partial (conforming + maps AC, CI not green) | **1** ÷ **3** (DS-294) |

**How measured:**

- **CI:** `gh pr checks` / Actions conclusions on first PR for each DS-linked generation PR.
- **Conforming:** Repo rules + static scan of current `tests/*.spec.ts` (no inline `page.locator`, no `waitForTimeout`, no tags on `describe`); hooks in `.cursor/hooks/generation-gate.sh` and `constitution-gate.sh` apply at edit time only — not replayable on historical edits.
- **Maps to AC:** Compare `features/*.feature` scenario intent to `tests/*` titles and steps (DS-294 aligned; DS-1/2 lack committed feature files on `main`).

**Test-generation workflow:** 3 `workflow_dispatch` runs **succeeded** as jobs; that does not imply green Playwright or full gate pass.

**What it tells us:** Agent output quality (structure, AC mapping for DS-294) is ahead of **CI green on first PR**; merges happened without a green E2E check as the hard gate.

---

## Ask vs guess

| Metric | Value |
|--------|------:|
| **Ask** — blocked on product/test facts, asked user (AskQuestion or explicit clarifier) | **0** in QA/test authoring sessions |
| **Guess** — material values committed without live/UI or API verification | **3** UI strings (`Programme` / `Programmes` / `Create Programme` in `ProgramsPage` before MCP/error-context recon) |

**How measured:** Ripgrep over `agent-transcripts/**/*.jsonl` for `AskQuestion` tool calls (excludes create-rule/create-skill boilerplate that *mentions* AskQuestion). “Guess” counted as distinct invented **product-facing** strings later disproven by live UI (documented in triage [e639beb8](e639beb8-431f-45cd-afa5-6076587e38b5)). Contrast: programs API edge-case work opened the real page before asserting copy ([841468c8](841468c8-b417-470e-b3e3-f00625e5a008)) — counted as recon, not guess.

**What it tells us:** The agent **recon’s well when prompted or when red**, but **defaults to conventions/docs** for labels instead of asking or browsing first — that produced the Programme drift cluster.

---

## Top reliability risk

**CI is predominantly red (21 failures, 2 successes, 2 `action_required` in the last 24 E2E runs), driven by locator drift and incomplete POM alignment — not flakes.** Merging heal/generation PRs without a green required check lets `main` stay broken.

## Next action

1. Finish `ProgramsPage` label alignment (`Programmes` → `Programs`, `Create Programme` → `Create Program`) in one PR, run full `npx playwright test` locally and on PR.
2. Make **E2E green** a required branch protection check before merge.
3. For backlog generation, fail the workflow step if `npx playwright test` is not green before `gh pr create` (or do not add `tests-generated` until green).

---

*Generated 2026-11-09. Re-run the flake aggregator with the script pattern in this report’s CI section to refresh numbers.*
