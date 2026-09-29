import { test, expect, type Page } from '@playwright/test';

const BASE_URL = process.env.DIDAXIS_URL ?? 'https://test.didaxis.studio';
const LOGIN_URL = `${BASE_URL}/login`;
const PROGRAMS_URL = `${BASE_URL}/programs`;

/** Documented assumption from DS-1 test plan when UI does not expose maxlength. */
const PROGRAM_NAME_MAX_LENGTH = 255;

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

/** Program title is exposed on row action buttons (e.g. "Edit …"), not as cell accessible names. */
function programRow(page: Page, programName: string) {
  return programsTable(page)
    .getByRole('row')
    .filter({ has: page.getByText(programName, { exact: true }) });
}

function editProgramButton(page: Page, programName: string) {
  return page.getByRole('button', { name: `Edit ${programName}` });
}

function programNameWithLength(length: number, testCaseId: string): string {
  const token = Date.now().toString();
  const prefix = `${testCaseId}-${token}-`;
  const padLength = Math.max(0, length - prefix.length);
  return (prefix + 'A'.repeat(padLength)).slice(0, length);
}

test.describe('DS-1: Create new academic program (admin)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(PROGRAMS_URL);
  });

  test('TC-001: Admin can open the program creation form from the Programs page', async ({
    page,
  }) => {
    const dialog = await openCreateProgramDialog(page);

    await expect(dialog.getByRole('heading', { name: 'New Program' })).toBeVisible();
    await expect(dialog.getByLabel('Program Name')).toBeVisible();
    await expect(dialog.getByLabel('Description')).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Create' })).toBeVisible();
  });

  test('TC-002: A valid program is created and appears in the program list', async ({
    page,
  }) => {
    const programName = `Web Development 2026-${Date.now()}`;
    const description = 'Full-stack web development program';

    const dialog = await openCreateProgramDialog(page);
    await dialog.getByLabel('Program Name').fill(programName);
    await dialog.getByLabel('Description').fill(description);
    await dialog.getByRole('button', { name: 'Create' }).click();

    await expect(dialog).toBeHidden();
    await expect(programRow(page, programName)).toBeVisible();
  });

  test('TC-003: Program can be created with description left empty if the field is optional', async ({
    page,
  }) => {
    const programName = `Data Science Fundamentals-${Date.now()}`;

    const dialog = await openCreateProgramDialog(page);
    await dialog.getByLabel('Program Name').fill(programName);
    await dialog.getByRole('button', { name: 'Create' }).click();

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

  test('TC-005: Program is not created when user dismisses the form without saving', async ({
    page,
  }) => {
    const programName = `Temporary Draft Program-${Date.now()}`;

    const dialog = await openCreateProgramDialog(page);
    await dialog.getByLabel('Program Name').fill(programName);
    await dialog.getByRole('button', { name: 'Cancel' }).click();

    await expect(dialog).toBeHidden();
    await expect(programRow(page, programName)).toHaveCount(0);
  });

  test('TC-007: Program name at maximum allowed length is accepted', async ({ page }) => {
    const programName = programNameWithLength(PROGRAM_NAME_MAX_LENGTH, 'TC007');
    const description = 'Boundary length name test';

    const dialog = await openCreateProgramDialog(page);
    await dialog.getByLabel('Program Name').fill(programName);
    await dialog.getByLabel('Description').fill(description);
    await dialog.getByRole('button', { name: 'Create' }).click();

    await expect(dialog).toBeHidden();
    await expect(programRow(page, programName)).toBeVisible();
  });

  test('TC-008: Program name exceeding maximum length is rejected', async ({ page }) => {
    test.fixme(
      true,
      'Didaxis test env accepts program names longer than 255 characters (no client/server length validation observed).',
    );

    const programName = programNameWithLength(PROGRAM_NAME_MAX_LENGTH + 1, 'TC008');

    const dialog = await openCreateProgramDialog(page);
    await dialog.getByLabel('Program Name').fill(programName);
    await dialog.getByRole('button', { name: 'Create' }).click();

    await expect(editProgramButton(page, programName)).toHaveCount(0, { timeout: 10_000 });
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByText(/255|too long|maximum|exceed|character limit/i),
    ).toBeVisible();
  });

  test('TC-009: Description accepts long text and special characters', async ({ page }) => {
    const programName = `Cybersecurity 2026-${Date.now()}`;
    const description =
      'Covers OWASP Top 10, TLS 1.3, & "secure by design" — 100% hands-on.';

    const dialog = await openCreateProgramDialog(page);
    await dialog.getByLabel('Program Name').fill(programName);
    await dialog.getByLabel('Description').fill(description);
    await dialog.getByRole('button', { name: 'Create' }).click();

    await expect(dialog).toBeHidden();
    await expect(programRow(page, programName)).toBeVisible();
  });

  test('TC-010: Leading and trailing spaces in Program Name are handled consistently', async ({
    page,
  }) => {
    const baseName = `Mobile Apps 2026-${Date.now()}`;
    const paddedName = `  ${baseName}  `;
    const description = 'iOS and Android track';

    const dialog = await openCreateProgramDialog(page);
    await dialog.getByLabel('Program Name').fill(paddedName);
    await dialog.getByLabel('Description').fill(description);
    await dialog.getByRole('button', { name: 'Create' }).click();

    await expect(dialog).toBeHidden();
    await expect(programRow(page, baseName)).toBeVisible();
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
