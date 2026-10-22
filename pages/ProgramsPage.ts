import type { Locator, Page } from '@playwright/test';

import { EditProgramModal } from './EditProgramModal';
import { NewProgramModal } from './NewProgramModal';

const BASE_URL = process.env.DIDAXIS_URL ?? 'https://test.didaxis.studio';
const PROGRAMS_URL = `${BASE_URL}/programs`;

export class ProgramsPage {
  readonly newProgramModal: NewProgramModal;
  readonly editProgramModal: EditProgramModal;
  readonly pageHeading: Locator;
  readonly pageSubtitle: Locator;
  readonly newProgramButton: Locator;
  readonly programsTable: Locator;

  constructor(private readonly page: Page) {
    this.newProgramModal = new NewProgramModal(page);
    this.editProgramModal = new EditProgramModal(page);
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

  /** Accessible edit control per Confluence UI map (✏️ → `Edit {name}` button). */
  editActions(): Locator {
    return this.page.getByRole('button', { name: /^Edit / });
  }

  async seedProgram(
    programName: string,
    options?: {
      description?: string;
      trackProgram?: (uuid: string) => void;
    },
  ) {
    await this.openNewProgramForm();
    await this.createProgram(programName, options);
    await this.programRow(programName).waitFor({ state: 'visible' });
  }

  async openEditProgramForm(programName: string) {
    await this.editProgramButton(programName).click();
    await this.editProgramModal.dialog.waitFor({ state: 'visible' });
  }

  async attemptCreateProgram(
    programName: string,
    options?: { description?: string },
  ): Promise<{ httpStatus: number | null }> {
    await this.openNewProgramForm();
    const modal = this.newProgramModal;
    await modal.fillProgramName(programName);
    if (options?.description !== undefined) {
      await modal.fillDescription(options.description);
    }

    const responsePromise = this.page
      .waitForResponse(
        (response) =>
          response.request().method() === 'POST' &&
          new URL(response.url()).pathname === '/api/programs',
        { timeout: 15_000 },
      )
      .catch(() => null);

    await modal.clickCreate();
    const response = await responsePromise;
    return { httpStatus: response ? response.status() : null };
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

  async updateProgram(
    currentName: string,
    options: {
      name?: string;
      description?: string;
    },
  ) {
    await this.openEditProgramForm(currentName);
    const modal = this.editProgramModal;
    if (options.name !== undefined) {
      await modal.fillProgramName(options.name);
    }
    if (options.description !== undefined) {
      await modal.fillDescription(options.description);
    }
    await modal.submitSave();
  }
}
