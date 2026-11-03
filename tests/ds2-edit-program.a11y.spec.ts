import AxeBuilder from '@axe-core/playwright';

import { expect, test } from '../fixtures/cleanup.fixture';
import { ProgramsPage } from '../pages/ProgramsPage';
import { assertNoAxeViolations } from '../support/axeAssert';

function uniqueProgramName(stamp: number): string {
  return `Web Development 2026-${stamp}`;
}

test.describe('DS-2: Edit Program dialog accessibility', () => {
  test(
    'Edit Program dialog has no WCAG 2 A or AA violations in its subtree',
    { tag: '@regression' },
    async ({ page, trackProgram }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.editProgramModal;
      const stamp = Date.now();
      const programName = uniqueProgramName(stamp);

      await programsPage.goto();
      await programsPage.seedProgram(programName, { trackProgram });
      await programsPage.openEditProgramForm(programName);
      await expect(modal.heading).toBeVisible();

      const root = await modal.axeIncludeSelector();

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .include(root)
        .analyze();

      await assertNoAxeViolations(results);
    },
  );
});
