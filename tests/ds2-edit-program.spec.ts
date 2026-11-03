import { expect, test } from '../fixtures/cleanup.fixture';
import { ProgramsPage } from '../pages/ProgramsPage';

const DESCRIPTION = 'Full-stack web development program';
const UPDATED_DESCRIPTION = 'Updated curriculum overview';

function uniqueProgramName(stamp: number): string {
  return `Web Development 2026-${stamp}`;
}

function uniqueUpdatedProgramName(stamp: number): string {
  return `Web Development 2026 - Updated-${stamp}`;
}

test.describe('DS-2: Edit existing program details', () => {
  test.beforeEach(async ({ page }) => {
    const programsPage = new ProgramsPage(page);
    await programsPage.goto();
  });

  test(
    'Open program for editing',
    { tag: '@regression' },
    async ({ page, trackProgram }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.editProgramModal;
      const stamp = Date.now();
      const programName = uniqueProgramName(stamp);

      await programsPage.seedProgram(programName, { description: DESCRIPTION, trackProgram });
      await programsPage.openEditProgramForm(programName);

      await expect(modal.dialog).toBeVisible();
      await expect(modal.heading).toBeVisible();
      await expect(modal.programNameInput).toHaveValue(programName);
      await expect(modal.descriptionInput).toHaveValue(DESCRIPTION);
    },
  );

  test(
    'Successfully edit a program name',
    { tag: '@regression' },
    async ({ page, trackProgram }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.editProgramModal;
      const stamp = Date.now();
      const programName = uniqueProgramName(stamp);
      const updatedName = uniqueUpdatedProgramName(stamp);

      await programsPage.seedProgram(programName, { description: DESCRIPTION, trackProgram });
      await programsPage.openEditProgramForm(programName);
      await modal.fillProgramName(updatedName);
      await modal.submitSave();

      await expect(modal.dialog).toBeHidden();
      await expect(programsPage.programRow(updatedName)).toBeVisible();
      await expect(programsPage.programRow(programName)).toHaveCount(0);
      await expect(programsPage.programRowDescription(updatedName, DESCRIPTION)).toBeVisible();
    },
  );

  test(
    'Edit preserves unchanged fields',
    { tag: '@regression' },
    async ({ page, trackProgram }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.editProgramModal;
      const stamp = Date.now();
      const programName = uniqueProgramName(stamp);

      await programsPage.seedProgram(programName, { description: DESCRIPTION, trackProgram });
      await programsPage.updateProgram(programName, { description: UPDATED_DESCRIPTION });

      await expect(modal.dialog).toBeHidden();
      await expect(programsPage.programRow(programName)).toBeVisible();
      await expect(
        programsPage.programRowDescription(programName, UPDATED_DESCRIPTION),
      ).toBeVisible();
    },
  );

  test(
    'Empty program name cannot be saved',
    { tag: '@regression' },
    async ({ page, trackProgram }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.editProgramModal;
      const stamp = Date.now();
      const programName = uniqueProgramName(stamp);

      await programsPage.seedProgram(programName, { trackProgram });
      await programsPage.openEditProgramForm(programName);

      const patchPromise = programsPage.waitForProgramUpdatePatch();
      await modal.fillProgramName('');

      await expect(modal.saveButton).toBeDisabled();
      await expect(modal.dialog).toBeVisible();
      expect(await patchPromise).toBeNull();
    },
  );

  test(
    'Cancel discards a name change',
    { tag: '@regression' },
    async ({ page, trackProgram }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.editProgramModal;
      const stamp = Date.now();
      const programName = uniqueProgramName(stamp);
      const updatedName = uniqueUpdatedProgramName(stamp);

      await programsPage.seedProgram(programName, { trackProgram });
      await programsPage.openEditProgramForm(programName);
      await modal.fillProgramName(updatedName);
      await modal.cancel();

      await expect(modal.dialog).toBeHidden();
      await expect(programsPage.programRow(programName)).toBeVisible();
      await expect(programsPage.programRow(updatedName)).toHaveCount(0);
    },
  );

  test(
    'Program name of only spaces cannot be saved',
    { tag: '@regression' },
    async ({ page, trackProgram }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.editProgramModal;
      const stamp = Date.now();
      const programName = uniqueProgramName(stamp);

      await programsPage.seedProgram(programName, { trackProgram });
      await programsPage.openEditProgramForm(programName);

      const patchPromise = programsPage.waitForProgramUpdatePatch();
      await modal.fillProgramName('   ');

      await expect(modal.saveButton).toBeDisabled();
      await expect(modal.dialog).toBeVisible();
      expect(await patchPromise).toBeNull();
    },
  );

  test(
    'Clearing the description keeps the program name',
    { tag: '@regression' },
    async ({ page, trackProgram }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.editProgramModal;
      const stamp = Date.now();
      const programName = uniqueProgramName(stamp);

      await programsPage.seedProgram(programName, { description: DESCRIPTION, trackProgram });
      await programsPage.openEditProgramForm(programName);
      await modal.fillDescription('');
      await modal.submitSave();

      await expect(modal.dialog).toBeHidden();
      await expect(programsPage.programRow(programName)).toBeVisible();
      await expect(programsPage.programRowDescription(programName, DESCRIPTION)).toHaveCount(0);
    },
  );
});
