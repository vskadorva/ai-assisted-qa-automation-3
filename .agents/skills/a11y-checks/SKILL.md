---
name: a11y-checks
description: Adds @axe-core/playwright accessibility scans to Playwright tests.
  Apply whenever generating or reviewing any test for a new page or component
  in Didaxis — even if the user never mentions accessibility, a11y, or axe.
  Every new UI surface needs an axe scan; do not ship page/component coverage
  without one.
---

# Accessibility checks (axe)

When you add or change Playwright coverage for a **page or distinct UI
component**, you **must** add (or update) an accessibility test that runs
`AxeBuilder.analyze()`. This is not optional and does not require the user
to ask for it.

## When to apply

- New spec or new `test.describe` for a page, modal, drawer, or widget
- Refactor that moves UI steps into new POMs — verify a11y spec still scopes
  correctly
- Code review of tests that navigate to UI the project has not scanned yet

## Page-level scan

1. Navigate via Page Objects; wait until the page is ready (e.g. heading
   visible).
2. Run a full-page scan:

```typescript
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const results = await new AxeBuilder({ page }).analyze();
await expect(results.violations).toEqual([]);
```

Use **web-first** `expect` on `results.violations` in the test file — not
`assert`, not bare `if (results.violations.length)`.

## Component-level scan

For modals, dialogs, panels, or other subtrees, **scope** the scan with
`.include()` so violations outside the component do not fail the test.

1. Open the component via POM actions.
2. Resolve a stable include target (prefer a POM helper that returns a
   selector string for axe, e.g. `axeIncludeSelector()` on the dialog POM).
3. Scan only that subtree:

```typescript
const root = await modal.axeIncludeSelector();

const results = await new AxeBuilder({ page })
  .include(root)
  .analyze();

await expect(results.violations).toEqual([]);
```

## disableRules — last resort only

Use `.disableRules([...])` **only** when a rule is a known, documented
false positive or there is an tracked fix in flight. **Never** use it to
make a failing scan pass or to hide a real accessibility bug.

Every `.disableRules()` call **must** have an inline comment stating **why**
that rule is disabled and **what** will remove the disable later.

```typescript
const results = await new AxeBuilder({ page })
  .include(root)
  // Temporary: close button missing accessible name — JIRA-123; remove when fixed.
  .disableRules(['button-name'])
  .analyze();
```

If there is no honest reason, fix the UI or fail the test — do not disable.

## Output layout

- Prefer dedicated files: `tests/<feature>.a11y.spec.ts`
- Reuse POMs from `pages/`; no inline locators in specs (see `pom-conventions`)
- Mirror existing reference: `tests/programs.a11y.spec.ts`

## Checklist before finishing

- [ ] New/changed page or component has an axe test
- [ ] Component scans use `.include()`
- [ ] `await expect(results.violations).toEqual([])`
- [ ] Any `.disableRules()` has a commented, legitimate reason
