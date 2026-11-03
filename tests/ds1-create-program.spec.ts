import { expect, test } from '../fixtures/cleanup.fixture';
import { ProgramsPage } from '../pages/ProgramsPage';

const DESCRIPTION_TEXT = 'Full-stack web development program';
const NAME_MAX_LENGTH = 100;
const DESCRIPTION_MAX_LENGTH = 500;

function webDevelopmentName(stamp: number): string {
  return `Web Development 2026-${stamp}`;
}

function specialCharacterName(stamp: number): string {
  return `Informatique & IA - Niveau 2 ${stamp}`;
}

function programNameExactly100Characters(stamp: number): string {
  const seed = `WD2026-${stamp}-`;
  return seed.length >= NAME_MAX_LENGTH
    ? seed.slice(0, NAME_MAX_LENGTH)
    : seed.padEnd(NAME_MAX_LENGTH, 'x');
}

function programName101Characters(): string {
  return 'x'.repeat(NAME_MAX_LENGTH + 1);
}

function descriptionExactly500Characters(stamp: number): string {
  const seed = `${DESCRIPTION_TEXT} ${stamp} `;
  return seed.length >= DESCRIPTION_MAX_LENGTH
    ? seed.slice(0, DESCRIPTION_MAX_LENGTH)
    : seed.padEnd(DESCRIPTION_MAX_LENGTH, 'x');
}

function description501Characters(stamp: number): string {
  return `${descriptionExactly500Characters(stamp)}x`;
}

test.describe('DS-1: Create new academic program', () => {
  test(
    'Navigate to program creation form',
    { tag: '@regression' },
    async ({ page }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.newProgramModal;

      await programsPage.goto();
      await programsPage.openNewProgramForm();

      await expect(modal.dialog).toBeVisible();
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

      await programsPage.goto();
      await programsPage.openNewProgramForm();
      await programsPage.createProgram(programName, {
        description: DESCRIPTION_TEXT,
        trackProgram,
      });

      await expect(modal.dialog).toBeHidden();
      await expect(programsPage.programRow(programName)).toBeVisible();
      await expect(
        programsPage.programRowDescription(programName, DESCRIPTION_TEXT),
      ).toBeVisible();
    },
  );

  test(
    'Create a program when Description is left empty',
    { tag: '@regression' },
    async ({ page, trackProgram }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.newProgramModal;
      const programName = webDevelopmentName(Date.now());

      await programsPage.goto();
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

      await programsPage.goto();
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

      await programsPage.goto();
      const postPromise = programsPage.waitForProgramCreatePost();
      await programsPage.openNewProgramForm();
      await modal.fillDescription(DESCRIPTION_TEXT);

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

      await programsPage.goto();
      await programsPage.openNewProgramForm();
      await modal.fillProgramName(programName);
      await modal.fillDescription(DESCRIPTION_TEXT);
      await modal.cancel();

      await expect(modal.dialog).toBeHidden();
      await expect(programsPage.programRow(programName)).toHaveCount(0);
    },
  );

  test(
    'Reject a duplicate program name',
    { tag: '@regression' },
    async ({ page, trackProgram }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.newProgramModal;
      const programName = webDevelopmentName(Date.now());

      await programsPage.goto();
      await programsPage.seedProgram(programName, { trackProgram });
      await programsPage.attemptCreateProgram(programName, {
        description: DESCRIPTION_TEXT,
        trackProgram,
      });

      await expect(modal.validationError).toBeVisible();
      await expect(modal.dialog).toBeVisible();
      await expect(programsPage.programRow(programName)).toHaveCount(1);
    },
  );

  test(
    'Program name of only spaces is not submitted',
    { tag: '@regression' },
    async ({ page }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.newProgramModal;

      await programsPage.goto();
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
      const programName = programNameExactly100Characters(Date.now());

      await programsPage.goto();
      await programsPage.openNewProgramForm();
      await programsPage.createProgram(programName, {
        description: DESCRIPTION_TEXT,
        trackProgram,
      });

      await expect(modal.dialog).toBeHidden();
      await expect(programsPage.programRow(programName)).toBeVisible();
    },
  );

  test(
    'Program name longer than 100 characters is rejected',
    { tag: '@regression' },
    async ({ page, trackProgram }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.newProgramModal;
      const longName = programName101Characters();

      await programsPage.goto();
      await programsPage.openNewProgramForm();
      await modal.fillProgramName(longName);

      const responsePromise = page.waitForResponse(
        (response) =>
          response.request().method() === 'POST' &&
          new URL(response.url()).pathname === '/api/programs',
        { timeout: 15_000 },
      );
      await modal.clickCreate();

      const response = await responsePromise.catch(() => null);
      if (response?.ok()) {
        const body = await response.json();
        const id = body?.data?.id;
        if (typeof id === 'string') {
          trackProgram(id);
        }
      }

      await expect(modal.validationError).toBeVisible();
      await expect(modal.validationError).toContainText(/100/);
      await expect(modal.dialog).toBeVisible();
      expect(response === null || !response.ok()).toBeTruthy();
    },
  );

  test(
    'Description of exactly 500 characters is accepted',
    { tag: '@regression' },
    async ({ page, trackProgram }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.newProgramModal;
      const stamp = Date.now();
      const programName = webDevelopmentName(stamp);
      const description = descriptionExactly500Characters(stamp);

      await programsPage.goto();
      await programsPage.openNewProgramForm();
      await programsPage.createProgram(programName, {
        description,
        trackProgram,
      });

      await expect(modal.dialog).toBeHidden();
      await expect(programsPage.programRow(programName)).toBeVisible();
    },
  );

  test(
    'Description longer than 500 characters is rejected',
    { tag: '@regression' },
    async ({ page, trackProgram }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.newProgramModal;
      const stamp = Date.now();
      const programName = webDevelopmentName(stamp);
      const longDescription = description501Characters(stamp);

      await programsPage.goto();
      await programsPage.openNewProgramForm();
      await modal.fillProgramName(programName);
      await modal.fillDescription(longDescription);

      const responsePromise = page.waitForResponse(
        (response) =>
          response.request().method() === 'POST' &&
          new URL(response.url()).pathname === '/api/programs',
        { timeout: 15_000 },
      );
      await modal.clickCreate();

      const response = await responsePromise.catch(() => null);
      if (response?.ok()) {
        const body = await response.json();
        const id = body?.data?.id;
        if (typeof id === 'string') {
          trackProgram(id);
        }
      }

      await expect(modal.validationError).toBeVisible();
      await expect(modal.validationError).toContainText(/500/);
      await expect(modal.dialog).toBeVisible();
      expect(response === null || !response.ok()).toBeTruthy();
    },
  );

  test(
    'Accept a program name that contains special characters',
    { tag: '@regression' },
    async ({ page, trackProgram }) => {
      const programsPage = new ProgramsPage(page);
      const modal = programsPage.newProgramModal;
      const programName = specialCharacterName(Date.now());

      await programsPage.goto();
      await programsPage.openNewProgramForm();
      await programsPage.createProgram(programName, {
        description: DESCRIPTION_TEXT,
        trackProgram,
      });

      await expect(modal.dialog).toBeHidden();
      await expect(programsPage.programRow(programName)).toBeVisible();
    },
  );
});
