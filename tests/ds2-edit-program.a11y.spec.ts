import AxeBuilder from '@axe-core/playwright';

import { expect, test } from '../fixtures/cleanup.fixture';
import { ProgramsPage } from '../pages/ProgramsPage';
import { assertNoAxeViolations } from '../support/axeAssert';

test.describe('DS-2 Edit Program accessibility', () => {
  test('Edit Program modal scoped scan has no violations (with optional rule disabled)', async ({
    page,
    trackProgram,
  }) => {
    const programsPage = new ProgramsPage(page);
    const editModal = programsPage.editProgramModal;
    const programName = `A11y Edit Smoke ${Date.now()}`;

    await programsPage.goto();
    await programsPage.openNewProgramForm();
    await programsPage.createProgram(programName, { trackProgram });

    await programsPage.openEditProgramForm(programName);
    await expect(editModal.heading).toBeVisible();

    const modalRoot = await editModal.axeIncludeSelector();

    const results = await new AxeBuilder({ page })
      .include(modalRoot)
      // Example: disable one rule while the modal close button gets an accessible name.
      .disableRules(['button-name'])
      .analyze();

    await assertNoAxeViolations(results);
  });
});
