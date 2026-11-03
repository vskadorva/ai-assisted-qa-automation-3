import { expect, test } from '../fixtures/cleanup.fixture';
import { ProgramsPage } from '../pages/ProgramsPage';

/** Confluence: Program Setup — Field Definitions (Name max 100, Description max 500). */
const NAME_MAX_LENGTH = 100;
const DESCRIPTION_MAX_LENGTH = 500;

function uniqueStamp(): number {
  return Date.now();
}

function webDev2026Name(stamp: number): string {
  return `Web Development 2026 ${stamp}`;
}

function webDev2026UpdatedName(stamp: number): string {
  return `Web Development 2026 - Updated ${stamp}`;
}

function informatiqueName(stamp: number): string {
  return `Informatique & IA - Niveau 2 ${stamp}`;
}

function programNameAtMaxLength(stamp: number): string {
  const seed = `MaxLen-edit-${stamp}-`;
  return seed.length >= NAME_MAX_LENGTH
    ? seed.slice(0, NAME_MAX_LENGTH)
    : seed.padEnd(NAME_MAX_LENGTH, 'x');
}

function programNameOverMaxLength(length: number): string {
  return 'x'.repeat(length);
}

function descriptionAtMaxLength(stamp: number): string {
  const seed = `DescMax-edit-${stamp}-`;
  return seed.length >= DESCRIPTION_MAX_LENGTH
    ? seed.slice(0, DESCRIPTION_MAX_LENGTH)
    : seed.padEnd(DESCRIPTION_MAX_LENGTH, 'y');
}

function descriptionOverMaxLength(length: number): string {
  return 'y'.repeat(length);
}

const FULL_STACK_DESCRIPTION = 'Full-stack web development program';
const EVENING_COHORT_DESCRIPTION = 'Evening cohort for working adults';

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
      const stamp = uniqueStamp();
      const programName = webDev2026Name(stamp);

      await programsPage.seedProgram(programName, {
        description: FULL_STACK_DESCRIPTION,
        trackProgram,
      });
      await programsPage.openEditProgramForm(programName);

      await expect(modal.dialog).toBeVisible();
      await expect(modal.heading).toBeVisible();
      await expect(modal.programNameInput).toHaveValue(programName);
      await expect(modal.descriptionInput).toHaveValue(FULL_STACK_DESCRIPTION);
    },
  );

  test(
    'Successfully edit a program name',
    { tag: '@regression' },
    async ({ page, trackProgram }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.editProgramModal;
      const stamp = uniqueStamp();
      const programName = webDev2026Name(stamp);
      const updatedName = webDev2026UpdatedName(stamp);

      await programsPage.seedProgram(programName, { trackProgram });
      await programsPage.updateProgram(programName, { name: updatedName });

      await expect(modal.dialog).toBeHidden();
      await expect(programsPage.programRow(updatedName)).toBeVisible();
      await expect(programsPage.programRowNameLabel(programName)).toHaveCount(0);
    },
  );

  test(
    'Edit preserves unchanged fields',
    { tag: '@regression' },
    async ({ page, trackProgram }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.editProgramModal;
      const stamp = uniqueStamp();
      const programName = webDev2026Name(stamp);

      await programsPage.seedProgram(programName, {
        description: FULL_STACK_DESCRIPTION,
        trackProgram,
      });
      await programsPage.updateProgram(programName, {
        description: EVENING_COHORT_DESCRIPTION,
      });

      await expect(modal.dialog).toBeHidden();
      await expect(programsPage.programRowNameLabel(programName)).toBeVisible();
      await expect(
        programsPage.programRowDescription(programName, EVENING_COHORT_DESCRIPTION),
      ).toBeVisible();

      await programsPage.openEditProgramForm(programName);
      await expect(modal.programNameInput).toHaveValue(programName);
    },
  );

  test(
    'Save stays disabled when the program name is cleared',
    { tag: '@regression' },
    async ({ page, trackProgram }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.editProgramModal;
      const stamp = uniqueStamp();
      const programName = webDev2026Name(stamp);

      await programsPage.seedProgram(programName, { trackProgram });
      await programsPage.openEditProgramForm(programName);

      const patchPromise = programsPage.waitForProgramPatch();
      await modal.clearProgramName();

      await expect(modal.saveButton).toBeDisabled();
      await expect(programsPage.programRowNameLabel(programName)).toBeVisible();
      expect(await patchPromise).toBeNull();
    },
  );

  test(
    'Cancel discards a name change',
    { tag: '@regression' },
    async ({ page, trackProgram }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.editProgramModal;
      const stamp = uniqueStamp();
      const programName = webDev2026Name(stamp);
      const updatedName = webDev2026UpdatedName(stamp);

      await programsPage.seedProgram(programName, { trackProgram });
      await programsPage.openEditProgramForm(programName);
      await modal.fillProgramName(updatedName);
      await modal.cancel();

      await expect(modal.dialog).toBeHidden();
      await expect(programsPage.programRowNameLabel(programName)).toBeVisible();
      await expect(programsPage.programRowNameLabel(updatedName)).toHaveCount(0);
    },
  );

  test(
    'Reject editing a program to a duplicate name',
    { tag: '@regression' },
    async ({ page, trackProgram }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.editProgramModal;
      const stamp = uniqueStamp();
      const firstName = webDev2026Name(stamp);
      const secondName = informatiqueName(stamp);

      await programsPage.seedProgram(firstName, { trackProgram });
      await programsPage.seedProgram(secondName, { trackProgram });

      await programsPage.openEditProgramForm(firstName);
      await modal.fillProgramName(secondName);
      await modal.attemptSave({ trackProgram });

      await expect(modal.validationError).toBeVisible();
      await expect(modal.dialog).toBeVisible();
      await expect(programsPage.programRowNameLabel(firstName)).toHaveCount(1);
      await expect(programsPage.programRowNameLabel(secondName)).toHaveCount(1);
    },
  );

  test(
    'Whitespace-only program name is not saved',
    { tag: '@regression' },
    async ({ page, trackProgram }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.editProgramModal;
      const stamp = uniqueStamp();
      const programName = webDev2026Name(stamp);

      await programsPage.seedProgram(programName, { trackProgram });
      await programsPage.openEditProgramForm(programName);

      const patchPromise = programsPage.waitForProgramPatch();
      await modal.fillProgramName('   ');

      await expect(modal.saveButton).toBeDisabled();
      await expect(modal.dialog).toBeVisible();
      await expect(programsPage.programRowNameLabel(programName)).toBeVisible();
      expect(await patchPromise).toBeNull();
    },
  );

  test(
    'Edited program name of exactly 100 characters is accepted',
    { tag: '@regression' },
    async ({ page, trackProgram }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.editProgramModal;
      const stamp = uniqueStamp();
      const programName = webDev2026Name(stamp);
      const longName = programNameAtMaxLength(stamp);

      await programsPage.seedProgram(programName, { trackProgram });
      await programsPage.updateProgram(programName, { name: longName });

      await expect(modal.dialog).toBeHidden();
      await expect(programsPage.programRow(longName)).toBeVisible();
      await expect(programsPage.programRowNameLabel(programName)).toHaveCount(0);
    },
  );

  test(
    'Edited program name longer than 100 characters is rejected',
    { tag: '@regression' },
    async ({ page, trackProgram }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.editProgramModal;
      const stamp = uniqueStamp();
      const programName = webDev2026Name(stamp);
      const overMaxName = programNameOverMaxLength(NAME_MAX_LENGTH + 1);

      await programsPage.seedProgram(programName, { trackProgram });
      await programsPage.openEditProgramForm(programName);
      await modal.fillProgramName(overMaxName);
      const { httpStatus } = await modal.attemptSave({ trackProgram });

      await expect(modal.validationError).toBeVisible();
      await expect(modal.validationError).toContainText(/100/);
      await expect(modal.dialog).toBeVisible();
      await expect(programsPage.programRowNameLabel(programName)).toBeVisible();
      expect(httpStatus === null || httpStatus < 200 || httpStatus >= 300).toBeTruthy();
    },
  );

  test(
    'Edited description of exactly 500 characters is accepted',
    { tag: '@regression' },
    async ({ page, trackProgram }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.editProgramModal;
      const stamp = uniqueStamp();
      const programName = webDev2026Name(stamp);
      const longDescription = descriptionAtMaxLength(stamp);

      await programsPage.seedProgram(programName, {
        description: FULL_STACK_DESCRIPTION,
        trackProgram,
      });
      await programsPage.updateProgram(programName, { description: longDescription });

      await expect(modal.dialog).toBeHidden();
      await expect(programsPage.programRowNameLabel(programName)).toBeVisible();
    },
  );

  test(
    'Edited description longer than 500 characters is rejected',
    { tag: '@regression' },
    async ({ page, trackProgram }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.editProgramModal;
      const stamp = uniqueStamp();
      const programName = webDev2026Name(stamp);
      const overMaxDescription = descriptionOverMaxLength(DESCRIPTION_MAX_LENGTH + 1);

      await programsPage.seedProgram(programName, { trackProgram });
      await programsPage.openEditProgramForm(programName);
      await modal.fillDescription(overMaxDescription);
      const { httpStatus } = await modal.attemptSave({ trackProgram });

      await expect(modal.validationError).toBeVisible();
      await expect(modal.validationError).toContainText(/500/);
      await expect(modal.dialog).toBeVisible();
      await expect(programsPage.programRowNameLabel(programName)).toBeVisible();
      expect(httpStatus === null || httpStatus < 200 || httpStatus >= 300).toBeTruthy();
    },
  );

  test(
    'Accept an edited name that contains special characters',
    { tag: '@regression' },
    async ({ page, trackProgram }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.editProgramModal;
      const stamp = uniqueStamp();
      const programName = webDev2026Name(stamp);
      const specialName = informatiqueName(stamp);

      await programsPage.seedProgram(programName, { trackProgram });
      await programsPage.updateProgram(programName, { name: specialName });

      await expect(modal.dialog).toBeHidden();
      await expect(programsPage.programRow(specialName)).toBeVisible();
      await expect(programsPage.programRowNameLabel(programName)).toHaveCount(0);
    },
  );
});
