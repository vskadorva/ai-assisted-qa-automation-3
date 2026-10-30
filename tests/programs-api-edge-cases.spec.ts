import type { Page, Route } from '@playwright/test';

import { expect, test } from '../fixtures/cleanup.fixture';
import { ProgramsPage } from '../pages/ProgramsPage';

/**
 * Live Programs UI, 2026-10-29, https://test.didaxis.studio/programs
 * - POST 503: New Program dialog stays open. No alert, toast, or error copy.
 * - GET 200 `{ data: [] }`: "No programs yet. Create your first program to get started."
 *   A root JSON array `[]` throws reading `length` and leaves `#root` empty.
 * - GET 200 `{ data: "not-a-list" }`: throws `t.map is not a function` and leaves `#root` empty.
 *   No crash-guard copy.
 */

function isProgramsCollection(route: Route): boolean {
  try {
    return new URL(route.request().url()).pathname === '/api/programs';
  } catch {
    return false;
  }
}

async function fulfillPrograms(
  page: Page,
  method: string,
  status: number,
  body: string,
) {
  await page.route('**/api/programs**', async (route) => {
    if (route.request().method() === method && isProgramsCollection(route)) {
      return route.fulfill({
        status,
        contentType: 'application/json',
        body,
      });
    }
    return route.continue();
  });
}

test.describe('Programs API edge cases', () => {
  test(
    'Save shows no error message when create returns 503',
    { tag: '@regression' },
    async ({ page, trackProgram }) => {
      await fulfillPrograms(
        page,
        'POST',
        503,
        JSON.stringify({ message: 'Service Unavailable' }),
      );

      const programsPage = new ProgramsPage(page);
      const modal = programsPage.newProgramModal;
      const programName = `Service Outage ${Date.now()}`;

      await programsPage.goto();
      await programsPage.openNewProgramForm();
      await modal.fillProgramName(programName);

      const failedSave = page.waitForResponse(
        (response) =>
          response.request().method() === 'POST' &&
          response.status() === 503 &&
          new URL(response.url()).pathname === '/api/programs',
      );
      await modal.clickCreate();
      const response = await failedSave;
      if (response.ok()) {
        const body = await response.json();
        const id = body?.data?.id;
        if (typeof id === 'string') trackProgram(id);
      }

      await expect(modal.dialog).toBeVisible();
      await expect(modal.programNameInput).toHaveValue(programName);
      await expect(programsPage.alert).toHaveCount(0);
      await expect(programsPage.programRow(programName)).toHaveCount(0);
    },
  );

  test(
    'Empty program list shows the empty state',
    { tag: '@regression' },
    async ({ page }) => {
      await fulfillPrograms(page, 'GET', 200, JSON.stringify({ data: [] }));

      const programsPage = new ProgramsPage(page);
      await programsPage.goto();

      await expect(programsPage.emptyStateMessage).toBeVisible();
      await expect(programsPage.emptyStateCreateButton).toBeVisible();
    },
  );

  test(
    'Malformed programs payload leaves the page blank',
    { tag: '@regression' },
    async ({ page }) => {
      const pageErrors: string[] = [];
      page.on('pageerror', (error) => {
        pageErrors.push(String(error));
      });

      await fulfillPrograms(page, 'GET', 200, JSON.stringify({ data: 'not-a-list' }));

      const programsPage = new ProgramsPage(page);
      const malformedResponse = page.waitForResponse(
        (response) =>
          response.request().method() === 'GET' &&
          response.status() === 200 &&
          new URL(response.url()).pathname === '/api/programs',
      );
      await programsPage.goto();
      await malformedResponse;

      await expect.poll(() => pageErrors.length).toBeGreaterThan(0);
      await expect(programsPage.pageHeading).toHaveCount(0);
    },
  );
});
