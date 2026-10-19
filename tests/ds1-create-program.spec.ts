import { expect, test } from '../fixtures/cleanup.fixture';
import { ProgramsPage } from '../pages/ProgramsPage';

test.describe('DS-1: Create new academic program (admin)', () => {
  test.beforeEach(async ({ page }) => {
    const programsPage = new ProgramsPage(page);
    await programsPage.goto();
  });

  test('TC-001: Admin can open the program creation form from the Programs page', async ({
    page,
  }) => {
    const programsPage = new ProgramsPage(page);
    const modal = programsPage.newProgramModal;

    await expect(programsPage.pageHeading).toBeVisible();
    await expect(programsPage.pageSubtitle).toBeVisible();

    await programsPage.openNewProgramForm();

    await expect(modal.heading).toBeVisible();
    await expect(modal.programNameInput).toBeVisible();
    await expect(modal.descriptionInput).toBeVisible();
    await expect(modal.cancelButton).toBeVisible();
    await expect(modal.createButton).toBeVisible();
    await expect(modal.showAiGenerationConfigButton).toBeVisible();
  });

  test('TC-002: A valid program is created and appears in the program list', async ({
    page,
    trackProgram,
  }) => {
    const programsPage = new ProgramsPage(page);
    const modal = programsPage.newProgramModal;
    const programName = `Web Development 2026-${Date.now()}`;
    const description = 'Full-stack web development program';

    await programsPage.openNewProgramForm();
    await programsPage.createProgram(programName, { description, trackProgram });

    await expect(modal.dialog).toBeHidden();
    await expect(programsPage.programRow(programName)).toBeVisible();
    await expect(programsPage.programRowDescription(programName, description)).toBeVisible();
  });

  test('TC-003: Program can be created with description left empty', async ({
    page,
    trackProgram,
  }) => {
    const programsPage = new ProgramsPage(page);
    const modal = programsPage.newProgramModal;
    const programName = `Data Science Fundamentals-${Date.now()}`;

    await programsPage.openNewProgramForm();
    await programsPage.createProgram(programName, { trackProgram });

    await expect(modal.dialog).toBeHidden();
    await expect(programsPage.programRow(programName)).toBeVisible();
  });

  test('TC-004: Create action is unavailable when Program Name is empty', async ({ page }) => {
    const programsPage = new ProgramsPage(page);
    const modal = programsPage.newProgramModal;

    await programsPage.openNewProgramForm();
    await modal.fillDescription(`Optional description ${Date.now()}`);

    await expect(modal.createButton).toBeDisabled();
    await expect(modal.dialog).toBeVisible();
  });

  test('TC-005: Program is not created when user cancels the form', async ({ page }) => {
    const programsPage = new ProgramsPage(page);
    const modal = programsPage.newProgramModal;
    const programName = `Temporary Draft Program-${Date.now()}`;

    await programsPage.openNewProgramForm();
    await modal.fillProgramName(programName);
    await modal.cancel();

    await expect(modal.dialog).toBeHidden();
    await expect(programsPage.programRow(programName)).toHaveCount(0);
  });

  test('TC-007: Whitespace-only program name is treated as empty', async ({ page }) => {
    const programsPage = new ProgramsPage(page);
    const modal = programsPage.newProgramModal;

    await programsPage.openNewProgramForm();
    await modal.fillProgramName('   ');

    await expect(modal.createButton).toBeDisabled();
  });

  test('TC-008: Description accepts long text and special characters', async ({
    page,
    trackProgram,
  }) => {
    const programsPage = new ProgramsPage(page);
    const modal = programsPage.newProgramModal;
    const programName = `Cybersecurity 2026-${Date.now()}`;
    const description =
      'Covers OWASP Top 10, TLS 1.3, & "secure by design" — 100% hands-on.';

    await programsPage.openNewProgramForm();
    await programsPage.createProgram(programName, { description, trackProgram });

    await expect(modal.dialog).toBeHidden();
    await expect(programsPage.programRow(programName)).toBeVisible();
  });

  test('TC-009: Leading and trailing spaces in Program Name are trimmed on save', async ({
    page,
    trackProgram,
  }) => {
    const programsPage = new ProgramsPage(page);
    const modal = programsPage.newProgramModal;
    const baseName = `Mobile Apps 2026-${Date.now()}`;
    const paddedName = `  ${baseName}  `;
    const description = 'iOS and Android track';

    await programsPage.openNewProgramForm();
    await modal.fillProgramName(paddedName);
    await modal.fillDescription(description);
    const id = await modal.submitCreate();
    trackProgram(id);

    await expect(modal.dialog).toBeHidden();
    await expect(programsPage.programRow(baseName)).toBeVisible();
    await expect(programsPage.programRowNameLabel(baseName)).toHaveText(baseName);
  });

  test('TC-010: Very long program names are accepted (no client maxlength today)', async ({
    page,
    trackProgram,
  }) => {
    const programsPage = new ProgramsPage(page);
    const modal = programsPage.newProgramModal;
    const programName = `Len-${Date.now()}-` + 'Y'.repeat(300);

    await programsPage.openNewProgramForm();
    await programsPage.createProgram(programName, { trackProgram });

    await expect(modal.dialog).toBeHidden();
    await expect(programsPage.editProgramButton(programName)).toBeVisible();
  });

  test('TC-011: AI Generation Config can be expanded without blocking create', async ({
    page,
    trackProgram,
  }) => {
    const programsPage = new ProgramsPage(page);
    const modal = programsPage.newProgramModal;
    const programName = `AI Config Smoke ${Date.now()}`;

    await programsPage.openNewProgramForm();
    await modal.showAiGenerationConfig();
    await programsPage.createProgram(programName, { trackProgram });

    await expect(modal.dialog).toBeHidden();
    await expect(programsPage.programRow(programName)).toBeVisible();
  });
});
