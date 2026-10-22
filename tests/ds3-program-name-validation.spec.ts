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

test.describe('DS-3: Program name validation and duplicate prevention (admin)', () => {
  test.beforeEach(async ({ page }) => {
    const programsPage = new ProgramsPage(page);
    await programsPage.goto();
  });

  test('TC-001: Accept program name with special characters', async ({ page, trackProgram }) => {
    const programsPage = new ProgramsPage(page);
    const modal = programsPage.newProgramModal;
    const programName = 'Informatique & IA - Niveau 2';
    const description = 'Bilingual STEM track';

    await programsPage.openNewProgramForm();
    await programsPage.createProgram(programName, { description, trackProgram });

    await expect(modal.dialog).toBeHidden();
    await expect(programsPage.programRow(programName)).toBeVisible();
  });

  test('TC-002: Same name with different casing is handled per product duplicate rules', async ({
    page,
    trackProgram,
  }) => {
    const programsPage = new ProgramsPage(page);
    const modal = programsPage.newProgramModal;
    const stamp = Date.now();
    const existingName = `Web Development 2026-${stamp}`;
    const caseVariant = `web development 2026-${stamp}`;

    await programsPage.seedProgram(existingName, { trackProgram });
    await programsPage.openNewProgramForm();
    await modal.fillProgramName(caseVariant);

    const createResponse = page.waitForResponse(
      (response) =>
        response.request().method() === 'POST' &&
        response.ok() &&
        new URL(response.url()).pathname === '/api/programs',
    );
    await modal.clickCreate();

    const rejected = await modal.validationError.isVisible().catch(() => false);
    if (rejected) {
      await expect(modal.validationError).toBeVisible();
      await expect(programsPage.programRow(existingName)).toHaveCount(1);
      return;
    }

    const response = await createResponse;
    const body = await response.json();
    const id = body?.data?.id as string | undefined;
    if (id) trackProgram(id);

    await expect(modal.dialog).toBeHidden();
    await expect(programsPage.programRow(caseVariant)).toBeVisible();
  });

  test('TC-003: Renaming a program to its current name succeeds without false duplicate error', async ({
    page,
    trackProgram,
  }) => {
    const programsPage = new ProgramsPage(page);
    const editModal = programsPage.editProgramModal;
    const programName = `Web Development 2026-${Date.now()}`;
    const updatedDescription = 'Updated description without rename';

    await programsPage.seedProgram(programName, {
      description: 'Original description',
      trackProgram,
    });

    await programsPage.openEditProgramForm(programName);
    await editModal.fillDescription(updatedDescription);
    await editModal.submitSave();

    await expect(editModal.validationError).toHaveCount(0);
    await expect(editModal.dialog).toBeHidden();
    await expect(
      programsPage.programRowDescription(programName, updatedDescription),
    ).toBeVisible();
  });

  test('TC-004: Reject program name with only whitespace', async ({ page }) => {
    const programsPage = new ProgramsPage(page);
    const modal = programsPage.newProgramModal;

    await programsPage.openNewProgramForm();
    await modal.fillProgramName('   ');

    await expect(modal.createButton).toBeDisabled();
    await expect(modal.dialog).toBeVisible();
  });

  test('TC-005: Reject duplicate program name', async ({ page, trackProgram }) => {
    const programsPage = new ProgramsPage(page);
    const modal = programsPage.newProgramModal;
    const programName = `Web Development 2026-${Date.now()}`;

    await programsPage.seedProgram(programName, { trackProgram });
    const { httpStatus } = await programsPage.attemptCreateProgram(programName);

    await expect(programsPage.programRow(programName)).toHaveCount(1);
    expect(httpStatus === null || httpStatus >= 400).toBeTruthy();
    await expect(modal.dialog).toBeVisible();
    await expect(modal.validationError).toBeVisible();
  });

  test('TC-006: Empty program name cannot be submitted via create', async ({ page }) => {
    const programsPage = new ProgramsPage(page);
    const modal = programsPage.newProgramModal;

    await programsPage.openNewProgramForm();
    await modal.fillDescription('Optional description');

    await expect(modal.createButton).toBeDisabled();
    await expect(modal.dialog).toBeVisible();
  });

  test('TC-007: Duplicate name on edit is rejected while editing another program', async ({
    page,
    trackProgram,
  }) => {
    const programsPage = new ProgramsPage(page);
    const editModal = programsPage.editProgramModal;
    const stamp = Date.now();
    const existingName = `Web Development 2026-${stamp}`;
    const programToEdit = `AI Bootcamp 2026-${stamp}`;

    await programsPage.seedProgram(existingName, { trackProgram });
    await programsPage.seedProgram(programToEdit, { trackProgram });

    await programsPage.openEditProgramForm(programToEdit);
    await editModal.fillProgramName(existingName);
    await editModal.clickSave();

    await expect(editModal.dialog).toBeVisible();
    await expect(editModal.validationError).toBeVisible();
    await expect(programsPage.programRow(programToEdit)).toBeVisible();
    await expect(programsPage.programRow(existingName)).toHaveCount(1);
  });

  test('TC-008: Leading and trailing whitespace around a valid name is trimmed before duplicate check', async ({
    page,
    trackProgram,
  }) => {
    const programsPage = new ProgramsPage(page);
    const modal = programsPage.newProgramModal;
    const programName = `Web Development 2026-${Date.now()}`;
    const paddedDuplicate = `  ${programName}  `;

    await programsPage.seedProgram(programName, { trackProgram });
    const { httpStatus } = await programsPage.attemptCreateProgram(paddedDuplicate);

    await expect(programsPage.programRow(programName)).toHaveCount(1);
    expect(httpStatus === null || httpStatus >= 400).toBeTruthy();
    await expect(modal.dialog).toBeVisible();
    await expect(modal.validationError).toBeVisible();
  });

  test('TC-009: Program names with Unicode and emoji are validated consistently', async ({
    page,
    trackProgram,
  }) => {
    const programsPage = new ProgramsPage(page);
    const modal = programsPage.newProgramModal;
    const programName = `Programme 🎓 2026-${Date.now()}`;

    await programsPage.seedProgram(programName, { trackProgram });
    const { httpStatus } = await programsPage.attemptCreateProgram(programName);

    await expect(programsPage.programRow(programName)).toHaveCount(1);
    expect(httpStatus === null || httpStatus >= 400).toBeTruthy();
    await expect(modal.dialog).toBeVisible();
    await expect(modal.validationError).toBeVisible();
  });

  test('TC-010: Names with only tabs or mixed whitespace are treated as empty', async ({
    page,
  }) => {
    const programsPage = new ProgramsPage(page);
    const modal = programsPage.newProgramModal;

    await programsPage.openNewProgramForm();
    await modal.fillProgramName('\t \t ');

    await expect(modal.createButton).toBeDisabled();
    await expect(modal.dialog).toBeVisible();
  });

  test('TC-011: Maximum-length boundary name does not break duplicate detection', async ({
    page,
    trackProgram,
  }) => {
    const programsPage = new ProgramsPage(page);
    const modal = programsPage.newProgramModal;
    const stamp = Date.now();
    const maxName = programNameAtMaxLength(stamp);
    const nearDuplicate = `${maxName.slice(0, NAME_MAX_LENGTH - 1)}y`;

    await programsPage.seedProgram(maxName, { trackProgram });

    const { httpStatus: duplicateStatus } = await programsPage.attemptCreateProgram(maxName);
    await expect(programsPage.programRow(maxName)).toHaveCount(1);
    expect(duplicateStatus === null || duplicateStatus >= 400).toBeTruthy();
    await expect(modal.validationError).toBeVisible();

    await modal.cancel();
    await programsPage.attemptCreateProgram(nearDuplicate);
    const id = await modal.submitCreate();
    trackProgram(id);

    await expect(modal.dialog).toBeHidden();
    await expect(programsPage.programRow(nearDuplicate)).toBeVisible();
  });

  test('TC-012: SQL-like characters in name do not break validation or storage', async ({
    page,
    trackProgram,
  }) => {
    const programsPage = new ProgramsPage(page);
    const modal = programsPage.newProgramModal;
    const programName = "Test'; DROP TABLE programs;--";

    await programsPage.openNewProgramForm();
    await programsPage.createProgram(programName, {
      description: 'Security regression name literal',
      trackProgram,
    });

    await expect(modal.dialog).toBeHidden();
    await expect(programsPage.programRowNameLabel(programName)).toHaveText(programName);
  });
});
