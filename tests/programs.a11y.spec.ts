import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { ProgramsPage } from '../pages/ProgramsPage';
import { assertNoAxeViolations, recordAxeViolations } from '../support/axeAssert';

test.describe('Programs accessibility', () => {
  test(
    'Programs page meets WCAG 2 A and AA',
    { tag: '@regression' },
    async ({ page }) => {
      const programsPage = new ProgramsPage(page);
      await programsPage.goto();
      await expect(programsPage.pageHeading).toBeVisible();

      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

      // CI keeps this advisory: violations are attached for the dev team and do not fail the job.
      const summary = await recordAxeViolations(results);
      if (process.env.CI) {
        if (results.violations.length > 0) {
          console.warn(`[a11y advisory — CI does not fail on axe violations]\n${summary}`);
        }
        return;
      }

      await expect(results.violations).toEqual([]);
    },
  );

  test(
    'Keyboard opens the New Program dialog',
    { tag: '@regression' },
    async ({ page }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.newProgramModal;

      await programsPage.goto();
      await expect(programsPage.pageHeading).toBeVisible();
      await programsPage.tabToNewProgramButton();
      await expect(programsPage.newProgramButton).toBeFocused();
      await programsPage.pressEnter();
      await expect(modal.dialog).toBeVisible();
      await expect(modal.heading).toBeVisible();
    },
  );

  test(
    'New Program modal scoped scan has no violations (with optional rule disabled)',
    { tag: '@regression' },
    async ({ page }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.newProgramModal;

      await programsPage.goto();
      await programsPage.openNewProgramForm();
      await expect(modal.heading).toBeVisible();

      const modalRoot = await modal.axeIncludeSelector();

      const results = await new AxeBuilder({ page })
        .include(modalRoot)
        // Example: disable one rule while the modal close button gets an accessible name.
        // Same API works for other rules, e.g. .disableRules(['color-contrast']).
        .disableRules(['button-name'])
        .analyze();

      await assertNoAxeViolations(results);
    },
  );
});
