import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '../fixtures/cleanup.fixture';
import { ProgramsPage } from '../pages/ProgramsPage';
import { assertNoAxeViolations } from '../support/axeAssert';

test.describe('DS-2: Edit Program accessibility', () => {
  test(
    'Edit Program dialog has no WCAG 2 A or AA violations',
    { tag: '@regression' },
    async ({ page, trackProgram }) => {
      const programsPage = new ProgramsPage(page);
      const editModal = programsPage.editProgramModal;
      const programName = `Web Development 2026 ${Date.now()}`;

      await programsPage.goto();
      await programsPage.seedProgram(programName, { trackProgram });
      await programsPage.openEditProgramForm(programName);
      await expect(editModal.heading).toBeVisible();

      const root = await editModal.axeIncludeSelector();
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .include(root)
        .analyze();

      await assertNoAxeViolations(results);
    },
  );
});
