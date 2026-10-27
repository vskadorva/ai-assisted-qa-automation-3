import { expect, test } from '../fixtures/cleanup.fixture';
import { ProgramsPage } from '../pages/ProgramsPage';

/** Confluence: Program Setup — Field Definitions (Name max 100 characters). */
const NAME_MAX_LENGTH = 100;

function programNameAtMaxLength(stamp: number): string {
  const seed = `MaxLen-${stamp}-`;
  return seed.length >= NAME_MAX_LENGTH
    ? seed.slice(0, NAME_MAX_LENGTH)
    : seed.padEnd(NAME_MAX_LENGTH, 'x');
}

function programNameOverMaxLength(length: number): string {
  return 'x'.repeat(length);
}

test.describe('DS-3: Program name validation and duplicate prevention', () => {
  test.beforeEach(async ({ page }) => {
    const programsPage = new ProgramsPage(page);
    await programsPage.goto();
  });

  test('Accept program name with special characters', async ({ page, trackProgram }) => {
    const programsPage = new ProgramsPage(page);
    const modal = programsPage.newProgramModal;
    const programName = `Informatique & IA - Niveau 2 ${Date.now()}`;

    await programsPage.openNewProgramForm();
    await programsPage.createProgram(programName, { trackProgram });

    await expect(modal.dialog).toBeHidden();
    await expect(programsPage.programRow(programName)).toBeVisible();
  });

  test('Reject program name with only whitespace', async ({ page }) => {
    const programsPage = new ProgramsPage(page);
    const modal = programsPage.newProgramModal;

    await programsPage.openNewProgramForm();
    const postPromise = programsPage.waitForProgramCreatePost();
    await modal.fillProgramName('   ');

    await expect(modal.createButton).toBeDisabled();
    await expect(modal.dialog).toBeVisible();
    expect(await postPromise).toBeNull();
  });

  test('Reject duplicate program name', async ({ page, trackProgram }) => {
    const programsPage = new ProgramsPage(page);
    const modal = programsPage.newProgramModal;
    const programName = `Web Development 2026-${Date.now()}`;

    await programsPage.seedProgram(programName, { trackProgram });
    await programsPage.attemptCreateProgram(programName, { trackProgram });

    await expect(modal.validationError).toBeVisible();
    await expect(modal.dialog).toBeVisible();
    await expect(programsPage.programRow(programName)).toHaveCount(1);
  });

  test('Empty program name cannot be submitted', async ({ page }) => {
    const programsPage = new ProgramsPage(page);
    const modal = programsPage.newProgramModal;

    const postPromise = programsPage.waitForProgramCreatePost();
    await programsPage.openNewProgramForm();

    await expect(modal.createButton).toBeDisabled();
    await expect(modal.dialog).toBeVisible();
    expect(await postPromise).toBeNull();
  });

  test('Names with only tabs or mixed whitespace are treated as empty', async ({ page }) => {
    const programsPage = new ProgramsPage(page);
    const modal = programsPage.newProgramModal;

    await programsPage.openNewProgramForm();
    const postPromise = programsPage.waitForProgramCreatePost();
    await modal.fillProgramName('\t \t ');

    await expect(modal.createButton).toBeDisabled();
    await expect(modal.dialog).toBeVisible();
    expect(await postPromise).toBeNull();
  });

  test('Leading and trailing whitespace is trimmed before the duplicate check', async ({
    page,
    trackProgram,
  }) => {
    const programsPage = new ProgramsPage(page);
    const modal = programsPage.newProgramModal;
    const programName = `Web Development 2026-${Date.now()}`;
    const paddedDuplicate = `  ${programName}  `;

    await programsPage.seedProgram(programName, { trackProgram });
    await programsPage.attemptCreateProgram(paddedDuplicate, { trackProgram });

    await expect(modal.validationError).toBeVisible();
    await expect(modal.dialog).toBeVisible();
    await expect(programsPage.programRow(programName)).toHaveCount(1);
  });

  test('Program name longer than 100 characters is rejected', async ({ page, trackProgram }) => {
    const programsPage = new ProgramsPage(page);
    const modal = programsPage.newProgramModal;
    const longName = programNameOverMaxLength(NAME_MAX_LENGTH + 1);

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
    await expect(modal.dialog).toBeVisible();
    expect(response === null || !response.ok()).toBeTruthy();
  });

  test('Program name of exactly 100 characters is accepted', async ({ page, trackProgram }) => {
    const programsPage = new ProgramsPage(page);
    const modal = programsPage.newProgramModal;
    const programName = programNameAtMaxLength(Date.now());

    await programsPage.openNewProgramForm();
    await programsPage.createProgram(programName, { trackProgram });

    await expect(modal.dialog).toBeHidden();
    await expect(programsPage.programRow(programName)).toBeVisible();
  });
});
