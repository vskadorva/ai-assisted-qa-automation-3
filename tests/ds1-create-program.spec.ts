import { expect, test } from '../fixtures/cleanup.fixture';
import { ProgramsPage } from '../pages/ProgramsPage';

const DESCRIPTION = 'Full-stack web development program';
const NAME_MAX_LENGTH = 100;

function programNameAtMaxLength(stamp: number): string {
  const seed = `MaxLen-${stamp}-`;
  return seed.length >= NAME_MAX_LENGTH
    ? seed.slice(0, NAME_MAX_LENGTH)
    : seed.padEnd(NAME_MAX_LENGTH, 'x');
}

function webDevelopmentName(stamp: number): string {
  return `Web Development 2026-${stamp}`;
}

function specialCharacterName(stamp: number): string {
  return `Informatique & IA - Niveau 2-${stamp}`;
}

test.describe('DS-1: Create new academic program', () => {
  test.beforeEach(async ({ page }) => {
    const programsPage = new ProgramsPage(page);
    await programsPage.goto();
  });

  test(
    'Navigate to program creation form',
    { tag: '@regression' },
    async ({ page }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.newProgramModal;

      await programsPage.openNewProgramForm();

      await expect(modal.dialog).toBeVisible();
      await expect(modal.heading).toBeVisible();
      await expect(modal.programNameInput).toBeVisible();
      await expect(modal.descriptionInput).toBeVisible();
    },
  );

  test(
    'Successfully create a program',
    { tag: '@regression' },
    async ({ page, trackProgram }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.newProgramModal;
      const programName = webDevelopmentName(Date.now());

      await programsPage.openNewProgramForm();
      await programsPage.createProgram(programName, {
        description: DESCRIPTION,
        trackProgram,
      });

      await expect(modal.dialog).toBeHidden();
      await expect(programsPage.programRow(programName)).toBeVisible();
      await expect(programsPage.programRowDescription(programName, DESCRIPTION)).toBeVisible();
    },
  );

  test(
    'Create a program when Description is left empty',
    { tag: '@regression' },
    async ({ page, trackProgram }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.newProgramModal;
      const programName = webDevelopmentName(Date.now());

      await programsPage.openNewProgramForm();
      await programsPage.createProgram(programName, { trackProgram });

      await expect(modal.dialog).toBeHidden();
      await expect(programsPage.programRow(programName)).toBeVisible();
    },
  );

  test(
    'Validation prevents empty program name',
    { tag: '@regression' },
    async ({ page }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.newProgramModal;

      const postPromise = programsPage.waitForProgramCreatePost();
      await programsPage.openNewProgramForm();

      await expect(modal.createButton).toBeDisabled();
      await expect(modal.dialog).toBeVisible();
      expect(await postPromise).toBeNull();
    },
  );

  test(
    'Description without a program name does not enable Create',
    { tag: '@regression' },
    async ({ page }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.newProgramModal;

      await programsPage.openNewProgramForm();
      const postPromise = programsPage.waitForProgramCreatePost();
      await modal.fillDescription(DESCRIPTION);

      await expect(modal.createButton).toBeDisabled();
      await expect(modal.dialog).toBeVisible();
      expect(await postPromise).toBeNull();
    },
  );

  test(
    'Cancel does not create a program',
    { tag: '@regression' },
    async ({ page }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.newProgramModal;
      const programName = webDevelopmentName(Date.now());

      await programsPage.openNewProgramForm();
      await modal.fillProgramName(programName);
      await modal.fillDescription(DESCRIPTION);
      await modal.cancel();

      await expect(modal.dialog).toBeHidden();
      await expect(programsPage.programRow(programName)).toHaveCount(0);
    },
  );

  test(
    'Program name of only spaces is not submitted',
    { tag: '@regression' },
    async ({ page }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.newProgramModal;

      await programsPage.openNewProgramForm();
      const postPromise = programsPage.waitForProgramCreatePost();
      await modal.fillProgramName('   ');

      await expect(modal.createButton).toBeDisabled();
      await expect(modal.dialog).toBeVisible();
      expect(await postPromise).toBeNull();
    },
  );

  test(
    'Program name of exactly 100 characters is accepted',
    { tag: '@regression' },
    async ({ page, trackProgram }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.newProgramModal;
      const programName = programNameAtMaxLength(Date.now());

      await programsPage.openNewProgramForm();
      await programsPage.createProgram(programName, {
        description: DESCRIPTION,
        trackProgram,
      });

      await expect(modal.dialog).toBeHidden();
      await expect(programsPage.programRow(programName)).toBeVisible();
    },
  );

  test(
    'Accept a program name that contains special characters',
    { tag: '@regression' },
    async ({ page, trackProgram }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.newProgramModal;
      const programName = specialCharacterName(Date.now());

      await programsPage.openNewProgramForm();
      await programsPage.createProgram(programName, {
        description: DESCRIPTION,
        trackProgram,
      });

      await expect(modal.dialog).toBeHidden();
      await expect(programsPage.programRow(programName)).toBeVisible();
    },
  );
});
