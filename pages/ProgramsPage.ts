import type { Locator, Page } from '@playwright/test';

import { NewProgramModal } from './NewProgramModal';

const BASE_URL = process.env.DIDAXIS_URL ?? 'https://test.didaxis.studio';
const PROGRAMS_URL = `${BASE_URL}/programs`;

export class ProgramsPage {
  readonly newProgramModal: NewProgramModal;
  readonly pageHeading: Locator;
  readonly pageSubtitle: Locator;
  readonly newProgramButton: Locator;
  readonly programsTable: Locator;

  constructor(private readonly page: Page) {
    this.newProgramModal = new NewProgramModal(page);
    this.pageHeading = page.getByRole('heading', { name: 'Programs', level: 2 });
    this.pageSubtitle = page.getByText('Manage academic programs and semesters');
    this.newProgramButton = page.getByRole('button', { name: '+ New Program' });
    this.programsTable = page.getByRole('main').getByRole('table');
  }

  async goto() {
    await this.page.goto(PROGRAMS_URL);
  }

  async openNewProgramForm() {
    await this.newProgramButton.click();
    await this.newProgramModal.dialog.waitFor({ state: 'visible' });
  }

  programRow(programName: string): Locator {
    return this.programsTable
      .getByRole('row')
      .filter({ has: this.page.getByText(programName, { exact: true }) });
  }

  programRowDescription(programName: string, description: string): Locator {
    return this.programRow(programName).getByText(description);
  }

  programRowNameLabel(programName: string): Locator {
    return this.programRow(programName).getByText(programName, { exact: true });
  }

  editProgramButton(programName: string): Locator {
    return this.page.getByRole('button', { name: `Edit ${programName}`, exact: true });
  }

  async createProgram(
    programName: string,
    options?: {
      description?: string;
      trackProgram?: (uuid: string) => void;
    },
  ) {
    const modal = this.newProgramModal;
    await modal.fillProgramName(programName);
    if (options?.description !== undefined) {
      await modal.fillDescription(options.description);
    }
    const id = await modal.submitCreate();
    options?.trackProgram?.(id);
  }
}
