import type { Page, Route } from '@playwright/test';

import { expect, test } from '../fixtures/cleanup.fixture';
import { ProgramsPage } from '../pages/ProgramsPage';

function uniqueProgramName(readablePrefix: string): string {
  return `DS-294 ${readablePrefix} ${Date.now()}`;
}

function isProgramsCollection(route: Route): boolean {
  try {
    return new URL(route.request().url()).pathname === '/api/programs';
  } catch {
    return false;
  }
}

async function mockEmptyProgramsList(page: Page) {
  await page.route('**/api/programs**', async (route) => {
    if (route.request().method() === 'GET' && isProgramsCollection(route)) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] }),
      });
    }
    return route.continue();
  });
}

test.describe('DS-294: Program list display', () => {
  test('Display program list with key details', async ({ page, trackProgram }) => {
    const programsPage = new ProgramsPage(page);
    const programName = uniqueProgramName('Data Science Fundamentals');
    const description = 'Intro to statistics and Python';

    await programsPage.goto();
    await programsPage.seedProgram(programName, { description, trackProgram });
    await programsPage.goto();

    await expect(programsPage.programRow(programName)).toBeVisible();
    await expect(programsPage.programRowDescription(programName, description)).toBeVisible();
  });

  test('Each program in the list shows its own name and description', async ({
    page,
    trackProgram,
  }) => {
    const programsPage = new ProgramsPage(page);
    const cloudName = uniqueProgramName('Cloud Computing Basics');
    const cloudDescription = 'AWS and Azure foundations';
    const cyberName = uniqueProgramName('Cybersecurity Essentials');
    const cyberDescription = 'Network defence and threat modelling';

    await programsPage.goto();
    await programsPage.seedProgram(cloudName, { description: cloudDescription, trackProgram });
    await programsPage.seedProgram(cyberName, { description: cyberDescription, trackProgram });
    await programsPage.goto();

    await expect(programsPage.programRowDescription(cloudName, cloudDescription)).toBeVisible();
    await expect(programsPage.programRowDescription(cyberName, cyberDescription)).toBeVisible();
  });

  test('Empty state when no programs exist', async ({ page }) => {
    await mockEmptyProgramsList(page);

    const programsPage = new ProgramsPage(page);
    await programsPage.goto();

    await expect(programsPage.emptyStateMessage).toBeVisible();
    await expect(programsPage.emptyStateCreateButton).toBeVisible();
  });

  test('The empty-state prompt opens the New Program form', async ({ page }) => {
    await mockEmptyProgramsList(page);

    const programsPage = new ProgramsPage(page);
    const modal = programsPage.newProgramModal;
    await programsPage.goto();

    await programsPage.clickEmptyStateCreateProgram();

    await expect(modal.dialog).toBeVisible();
    await expect(modal.heading).toBeVisible();
  });

  test('Empty state is not shown when programs exist', async ({ page, trackProgram }) => {
    const programsPage = new ProgramsPage(page);
    const programName = uniqueProgramName('Data Science Fundamentals');
    const description = 'Intro to statistics and Python';

    await programsPage.goto();
    await programsPage.seedProgram(programName, { description, trackProgram });
    await programsPage.goto();

    await expect(programsPage.emptyStateMessage).toHaveCount(0);
    await expect(programsPage.emptyStateCreateButton).toHaveCount(0);
  });

  test('Programs table is not shown when no programs exist', async ({ page }) => {
    await mockEmptyProgramsList(page);

    const programsPage = new ProgramsPage(page);
    await programsPage.goto();

    await expect(programsPage.programsTable).toHaveCount(0);
  });

  test('Program without a description lists its name only', async ({ page, trackProgram }) => {
    const programsPage = new ProgramsPage(page);
    const programName = uniqueProgramName('Machine Learning Lab');

    await programsPage.goto();
    await programsPage.seedProgram(programName, { trackProgram });
    await programsPage.goto();

    await expect(programsPage.programRow(programName)).toBeVisible();
    await expect(programsPage.programRowNameLabel(programName)).toBeVisible();
  });

  test('Special characters in name and description display as entered', async ({
    page,
    trackProgram,
  }) => {
    const programsPage = new ProgramsPage(page);
    const programName = uniqueProgramName('Informatique & IA - Niveau 2');
    const description = 'Cours « avancé » : réseaux / sécurité';

    await programsPage.goto();
    await programsPage.seedProgram(programName, { description, trackProgram });
    await programsPage.goto();

    await expect(programsPage.programRowDescription(programName, description)).toBeVisible();
  });
});
