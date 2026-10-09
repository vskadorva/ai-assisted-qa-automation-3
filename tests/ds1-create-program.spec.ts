import type { Locator, Page } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { expect, test } from '../fixtures/cleanup.fixture';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const BASE_URL = process.env.DIDAXIS_URL ?? 'https://test.didaxis.studio';
const LOGIN_URL = `${BASE_URL}/login`;
const PROGRAMS_URL = `${BASE_URL}/programs`;

function requireAdminCredentials(): { email: string; password: string } {
  const email = process.env.DIDAXIS_EMAIL;
  const password = process.env.DIDAXIS_PASSWORD;
  if (!email || !password) {
    throw new Error(
      'Set DIDAXIS_EMAIL and DIDAXIS_PASSWORD in .env before running DS-1 tests.',
    );
  }
  return { email, password };
}

async function login(page: Page, email: string, password: string) {
  await page.goto(LOGIN_URL);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15_000 });
}

async function loginAsAdmin(page: Page) {
  const { email, password } = requireAdminCredentials();
  await login(page, email, password);
}

function createProgramDialog(page: Page) {
  return page.getByRole('dialog').filter({
    has: page.getByRole('heading', { name: 'New Program' }),
  });
}

function programsTable(page: Page) {
  return page.getByRole('main').getByRole('table');
}

async function openCreateProgramDialog(page: Page) {
  await page.getByRole('button', { name: '+ New Program' }).click();
  const dialog = createProgramDialog(page);
  await expect(dialog).toBeVisible();
  return dialog;
}

function programRow(page: Page, programName: string) {
  return programsTable(page)
    .getByRole('row')
    .filter({ has: page.getByText(programName, { exact: true }) });
}

function editProgramButton(page: Page, programName: string) {
  return page.getByRole('button', { name: `Edit ${programName}`, exact: true });
}

async function submitCreateProgram(
  page: Page,
  dialog: Locator,
  trackProgram: (uuid: string) => void,
) {
  const created = page.waitForResponse((response) => {
    if (response.request().method() !== 'POST' || !response.ok()) return false;
    try {
      return new URL(response.url()).pathname === '/api/programs';
    } catch {
      return false;
    }
  });
  await dialog.getByRole('button', { name: 'Create' }).click();
  const body = await (await created).json();
  const id = body?.data?.id;
  if (typeof id !== 'string') {
    throw new Error('Create program response did not include data.id');
  }
  trackProgram(id);
}

test.describe('DS-1: Create new academic program (admin)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(PROGRAMS_URL);
  });

  test('TC-001: Admin can open the program creation form from the Programs page', async ({
    page,
  }) => {
    await expect(page.getByRole('heading', { name: 'Programs', level: 2 })).toBeVisible();
    await expect(page.getByText('Manage academic programs and semesters')).toBeVisible();

    const dialog = await openCreateProgramDialog(page);

    await expect(dialog.getByRole('heading', { name: 'New Program' })).toBeVisible();
    await expect(dialog.getByLabel('Program Name')).toBeVisible();
    await expect(dialog.getByLabel('Description')).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Cancel' })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Create' })).toBeVisible();
    await expect(
      dialog.getByRole('button', { name: /Show AI Generation Config/i }),
    ).toBeVisible();
  });

  test('TC-002: A valid program is created and appears in the program list', async ({
    page,
    trackProgram,
  }) => {
    const programName = `Web Development 2026-${Date.now()}`;
    const description = 'Full-stack web development program';

    const dialog = await openCreateProgramDialog(page);
    await dialog.getByLabel('Program Name').fill(programName);
    await dialog.getByLabel('Description').fill(description);
    await submitCreateProgram(page, dialog, trackProgram);

    await expect(dialog).toBeHidden();
    const row = programRow(page, programName);
    await expect(row).toBeVisible();
    await expect(row.getByText(description)).toBeVisible();
  });

  test('TC-003: Program can be created with description left empty', async ({
    page,
    trackProgram,
  }) => {
    const programName = `Data Science Fundamentals-${Date.now()}`;

    const dialog = await openCreateProgramDialog(page);
    await dialog.getByLabel('Program Name').fill(programName);
    await submitCreateProgram(page, dialog, trackProgram);

    await expect(dialog).toBeHidden();
    await expect(programRow(page, programName)).toBeVisible();
  });

  test('TC-004: Create action is unavailable when Program Name is empty', async ({ page }) => {
    const dialog = await openCreateProgramDialog(page);
    await dialog.getByLabel('Description').fill(`Optional description ${Date.now()}`);

    const createButton = dialog.getByRole('button', { name: 'Create' });
    await expect(createButton).toBeDisabled();
    await expect(dialog).toBeVisible();
  });

  test('TC-005: Program is not created when user cancels the form', async ({ page }) => {
    const programName = `Temporary Draft Program-${Date.now()}`;

    const dialog = await openCreateProgramDialog(page);
    await dialog.getByLabel('Program Name').fill(programName);
    await dialog.getByRole('button', { name: 'Cancel' }).click();

    await expect(dialog).toBeHidden();
    await expect(programRow(page, programName)).toHaveCount(0);
  });

  test('TC-007: Whitespace-only program name is treated as empty', async ({ page }) => {
    const dialog = await openCreateProgramDialog(page);
    await dialog.getByLabel('Program Name').fill('   ');

    await expect(dialog.getByRole('button', { name: 'Create' })).toBeDisabled();
  });

  test('TC-008: Description accepts long text and special characters', async ({
    page,
    trackProgram,
  }) => {
    const programName = `Cybersecurity 2026-${Date.now()}`;
    const description =
      'Covers OWASP Top 10, TLS 1.3, & "secure by design" — 100% hands-on.';

    const dialog = await openCreateProgramDialog(page);
    await dialog.getByLabel('Program Name').fill(programName);
    await dialog.getByLabel('Description').fill(description);
    await submitCreateProgram(page, dialog, trackProgram);

    await expect(dialog).toBeHidden();
    await expect(programRow(page, programName)).toBeVisible();
  });

  test('TC-009: Leading and trailing spaces in Program Name are trimmed on save', async ({
    page,
    trackProgram,
  }) => {
    const baseName = `Mobile Apps 2026-${Date.now()}`;
    const paddedName = `  ${baseName}  `;
    const description = 'iOS and Android track';

    const dialog = await openCreateProgramDialog(page);
    await dialog.getByLabel('Program Name').fill(paddedName);
    await dialog.getByLabel('Description').fill(description);
    await submitCreateProgram(page, dialog, trackProgram);

    await expect(dialog).toBeHidden();
    const row = programRow(page, baseName);
    await expect(row).toBeVisible();
    await expect(row.locator('p').first()).toHaveText(baseName);
  });

  test('TC-010: Very long program names are accepted (no client maxlength today)', async ({
    page,
    trackProgram,
  }) => {
    const programName = `Len-${Date.now()}-` + 'Y'.repeat(300);

    const dialog = await openCreateProgramDialog(page);
    await dialog.getByLabel('Program Name').fill(programName);
    await submitCreateProgram(page, dialog, trackProgram);

    await expect(dialog).toBeHidden();
    await expect(editProgramButton(page, programName)).toBeVisible();
  });

  test('TC-011: AI Generation Config can be expanded without blocking create', async ({
    page,
    trackProgram,
  }) => {
    const programName = `AI Config Smoke ${Date.now()}`;

    const dialog = await openCreateProgramDialog(page);
    await dialog.getByRole('button', { name: /Show AI Generation Config/i }).click();
    await dialog.getByLabel('Program Name').fill(programName);
    await submitCreateProgram(page, dialog, trackProgram);

    await expect(dialog).toBeHidden();
    await expect(programRow(page, programName)).toBeVisible();
  });
});

test.describe('DS-1: Create new academic program (non-admin)', () => {
  test.beforeEach(async ({ page }) => {
    const email = process.env.DIDAXIS_NON_ADMIN_EMAIL;
    const password = process.env.DIDAXIS_NON_ADMIN_PASSWORD;
    test.skip(
      !email || !password,
      'Set DIDAXIS_NON_ADMIN_EMAIL and DIDAXIS_NON_ADMIN_PASSWORD to run TC-006.',
    );

    await login(page, email!, password!);
    await page.goto(PROGRAMS_URL);
  });

  test('TC-006: Non-admin user cannot access program creation', async ({ page }) => {
    const newProgramButton = page.getByRole('button', { name: '+ New Program' });
    const accessDenied = page.getByText(/access denied|not authorized|permission/i);

    if ((await newProgramButton.count()) === 0) {
      await expect(newProgramButton).toHaveCount(0);
      return;
    }

    await newProgramButton.click();
    await expect(accessDenied).toBeVisible();
    await expect(createProgramDialog(page)).toBeHidden();
  });
});
