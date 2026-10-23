import path from 'path';

import { chromium } from '@playwright/test';

import { expect, test } from '../fixtures/cleanup.fixture';
import { ProgramsPage } from '../pages/ProgramsPage';

/** Confluence: Program Setup — Field Definitions (Name max 100 characters). */
const NAME_OVER_MAX_LENGTH = 'N'.repeat(101);

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

test.describe('DS-2: Edit existing program details (admin)', () => {
  test.beforeEach(async ({ page }) => {
    const programsPage = new ProgramsPage(page);
    await programsPage.goto();
  });

  test('TC-001: Open program for editing', async ({ page, trackProgram }) => {
    const programsPage = new ProgramsPage(page);
    const modal = programsPage.editProgramModal;
    const programName = `Web Development 2026-${Date.now()}`;
    const description = 'Full-stack web development program';

    await programsPage.seedProgram(programName, { description, trackProgram });
    await programsPage.openEditProgramForm(programName);

    await expect(modal.heading).toBeVisible();
    await expect(modal.programNameInput).toHaveValue(programName);
    await expect(modal.descriptionInput).toHaveValue(description);
  });

  test('TC-002: Successfully edit a program name', async ({ page, trackProgram }) => {
    const programsPage = new ProgramsPage(page);
    const modal = programsPage.editProgramModal;
    const stamp = Date.now();
    const programName = `Web Development 2026-${stamp}`;
    const updatedName = `Web Development 2026 - Updated-${stamp}`;

    await programsPage.seedProgram(programName, { trackProgram });
    await programsPage.openEditProgramForm(programName);
    await modal.fillProgramName(updatedName);
    await modal.submitSave();

    await expect(modal.dialog).toBeHidden();
    await expect(programsPage.programRow(updatedName)).toBeVisible();
    await expect(programsPage.programRow(programName)).toHaveCount(0);
  });

  test('TC-003: Edit preserves unchanged fields', async ({ page, trackProgram }) => {
    const programsPage = new ProgramsPage(page);
    const modal = programsPage.editProgramModal;
    const programName = `UX Design 2026-${Date.now()}`;
    const updatedDescription = 'Research, wireframes, and usability testing';

    await programsPage.seedProgram(programName, {
      description: 'Wireframes and usability basics',
      trackProgram,
    });

    await programsPage.openEditProgramForm(programName);
    await modal.fillDescription(updatedDescription);
    await modal.submitSave();

    await expect(modal.dialog).toBeHidden();
    await expect(programsPage.programRowNameLabel(programName)).toHaveText(programName);
    await expect(
      programsPage.programRowDescription(programName, updatedDescription),
    ).toBeVisible();
  });

  test('TC-004: Both name and description can be updated in a single save', async ({
    page,
    trackProgram,
  }) => {
    const programsPage = new ProgramsPage(page);
    const modal = programsPage.editProgramModal;
    const stamp = Date.now();
    const programName = `UX Design 2026-${stamp}`;
    const updatedName = `UX/UI Design 2026-${stamp}`;
    const updatedDescription = 'Research, wireframes, and usability testing';

    await programsPage.seedProgram(programName, { trackProgram });
    await programsPage.openEditProgramForm(programName);
    await modal.fillProgramName(updatedName);
    await modal.fillDescription(updatedDescription);
    await modal.submitSave();

    await expect(modal.dialog).toBeHidden();
    await expect(programsPage.programRow(updatedName)).toBeVisible();
    await expect(
      programsPage.programRowDescription(updatedName, updatedDescription),
    ).toBeVisible();
  });

  test('TC-005: Empty program name prevents save on edit', async ({ page, trackProgram }) => {
    const programsPage = new ProgramsPage(page);
    const modal = programsPage.editProgramModal;
    const programName = `Web Development 2026-${Date.now()}`;

    await programsPage.seedProgram(programName, { trackProgram });
    await programsPage.openEditProgramForm(programName);
    await modal.fillProgramName('');

    await expect(modal.saveButton).toBeDisabled();
    await expect(modal.dialog).toBeVisible();
    await expect(programsPage.programRow(programName)).toBeVisible();
  });

  test('TC-006: Canceling edit discards unsaved changes', async ({ page, trackProgram }) => {
    const programsPage = new ProgramsPage(page);
    const modal = programsPage.editProgramModal;
    const programName = `Web Development 2026-${Date.now()}`;

    await programsPage.seedProgram(programName, { trackProgram });
    await programsPage.openEditProgramForm(programName);
    await modal.fillProgramName('Should Not Persist');
    await modal.cancel();

    await expect(modal.dialog).toBeHidden();
    await expect(programsPage.programRow(programName)).toBeVisible();
    await expect(programsPage.programRow('Should Not Persist')).toHaveCount(0);
  });

  test.fixme('TC-007: Duplicate program name on edit is rejected', async ({ page, trackProgram }) => {
    const programsPage = new ProgramsPage(page);
    const modal = programsPage.editProgramModal;
    const stamp = Date.now();
    const existingName = `Web Development 2026-${stamp}`;
    const programToEdit = `Data Science 2026-${stamp}`;

    await programsPage.seedProgram(existingName, { trackProgram });
    await programsPage.seedProgram(programToEdit, { trackProgram });

    await programsPage.openEditProgramForm(programToEdit);
    await modal.fillProgramName(existingName);
    await modal.clickSave();

    await expect(modal.dialog).toBeVisible();
    await expect(modal.validationError).toBeVisible();
    await expect(programsPage.programRow(programToEdit)).toBeVisible();
    await expect(programsPage.programRow(existingName)).toHaveCount(1);
  });

  test('TC-008: Non-admin cannot edit programs', async ({ browser }) => {
    const email = process.env.DIDAXIS_NON_ADMIN_EMAIL;
    const password = process.env.DIDAXIS_NON_ADMIN_PASSWORD;
    test.skip(
      !email || !password,
      'Set DIDAXIS_NON_ADMIN_EMAIL and DIDAXIS_NON_ADMIN_PASSWORD to run RBAC coverage (features/DS-2.feature).',
    );

    const context = await browser.newContext();
    const page = await context.newPage();
    const base = process.env.DIDAXIS_URL ?? 'https://test.didaxis.studio';

    await page.goto(`${base}/login`);
    await page.getByLabel('Email').fill(email!);
    await page.getByLabel('Password').fill(password!);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL((url) => !url.pathname.includes('/login'));

    const programsPage = new ProgramsPage(page);
    await programsPage.goto();

    await expect(programsPage.editActions()).toHaveCount(0);
    await context.close();
  });

  test('TC-009: Whitespace-only name on edit is treated as empty', async ({
    page,
    trackProgram,
  }) => {
    const programsPage = new ProgramsPage(page);
    const modal = programsPage.editProgramModal;
    const programName = `Web Development 2026-${Date.now()}`;

    await programsPage.seedProgram(programName, { trackProgram });
    await programsPage.openEditProgramForm(programName);
    await modal.fillProgramName('   ');

    await expect(modal.saveButton).toBeDisabled();
    await expect(modal.dialog).toBeVisible();
    await expect(programsPage.programRow(programName)).toBeVisible();
  });

  test('TC-010: Special characters in edited name are accepted', async ({
    page,
    trackProgram,
  }) => {
    const programsPage = new ProgramsPage(page);
    const modal = programsPage.editProgramModal;
    const programName = `Informatique Base-${Date.now()}`;
    const updatedName = 'Informatique & IA - Niveau 2';

    await programsPage.seedProgram(programName, { trackProgram });
    await programsPage.openEditProgramForm(programName);
    await modal.fillProgramName(updatedName);
    await modal.submitSave();

    await expect(modal.dialog).toBeHidden();
    await expect(programsPage.programRow(updatedName)).toBeVisible();
  });

  test('TC-011: Concurrent edit last save wins or conflict is surfaced', async ({
    trackProgram,
  }) => {
    const stamp = Date.now();
    const programName = `Concurrent Edit ${stamp}`;
    const descriptionA = `Description A ${stamp}`;
    const descriptionB = `Description B ${stamp}`;

    const browser = await chromium.launch();
    const adminContext = await browser.newContext({ storageState: authFile });
    const pageA = await adminContext.newPage();
    const programsPageA = new ProgramsPage(pageA);
    await programsPageA.goto();
    await programsPageA.seedProgram(programName, { trackProgram });

    const contextB = await browser.newContext({ storageState: authFile });
    const pageB = await contextB.newPage();
    const programsPageB = new ProgramsPage(pageB);
    const modalB = programsPageB.editProgramModal;

    await programsPageB.goto();
    await programsPageB.openEditProgramForm(programName);
    await modalB.fillDescription(descriptionB);

    await programsPageA.openEditProgramForm(programName);
    await programsPageA.editProgramModal.fillDescription(descriptionA);
    await programsPageA.editProgramModal.submitSave();
    await expect(programsPageA.editProgramModal.dialog).toBeHidden();

    await modalB.clickSave();

    const conflictVisible = await modalB.validationError
      .isVisible()
      .catch(() => false);
    if (conflictVisible) {
      await expect(modalB.validationError).toBeVisible();
    } else {
      await expect(modalB.dialog).toBeHidden({ timeout: 60_000 });
      const row = programsPageB.programRow(programName);
      const showsA = await programsPageB
        .programRowDescription(programName, descriptionA)
        .isVisible()
        .catch(() => false);
      const showsB = await programsPageB
        .programRowDescription(programName, descriptionB)
        .isVisible()
        .catch(() => false);
      expect(showsA || showsB).toBe(true);
    }

    await contextB.close();
    await adminContext.close();
    await browser.close();
  });

  test.fixme('TC-012: Maximum-length name on edit behaves like create validation', async ({
    page,
    trackProgram,
  }) => {
    const programsPage = new ProgramsPage(page);
    const modal = programsPage.editProgramModal;
    const programName = `Max Length Edit ${Date.now()}`;
    const originalName = programName;

    await programsPage.seedProgram(programName, { trackProgram });
    await programsPage.openEditProgramForm(programName);
    await modal.fillProgramName(NAME_OVER_MAX_LENGTH);
    await modal.clickSave();

    await expect(modal.dialog).toBeVisible();
    await expect(modal.validationError).toBeVisible();
    await expect(programsPage.programRow(originalName)).toBeVisible();
    await expect(programsPage.programRow(NAME_OVER_MAX_LENGTH)).toHaveCount(0);
  });
});
