import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { ProgramsPage } from '../pages/ProgramsPage';
import { assertNoAxeViolations } from '../support/axeAssert';

test.describe('Programs accessibility', () => {
  test('Programs page has no detectable axe violations', async ({ page }) => {
    const programsPage = new ProgramsPage(page);
    await programsPage.goto();
    await expect(programsPage.pageHeading).toBeVisible();

    const results = await new AxeBuilder({ page }).analyze();

    await assertNoAxeViolations(results);
  });

  test('New Program modal scoped scan has no violations (with optional rule disabled)', async ({
    page,
  }) => {
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
  });
});
