import type { Locator, Page } from '@playwright/test';

export class NewProgramModal {
  readonly dialog: Locator;
  readonly heading: Locator;
  readonly programNameInput: Locator;
  readonly descriptionInput: Locator;
  readonly cancelButton: Locator;
  readonly createButton: Locator;
  readonly showAiGenerationConfigButton: Locator;

  constructor(private readonly page: Page) {
    this.dialog = page.getByRole('dialog').filter({
      has: page.getByRole('heading', { name: 'New Program' }),
    });
    this.heading = this.dialog.getByRole('heading', { name: 'New Program' });
    this.programNameInput = this.dialog.getByLabel('Program Name');
    this.descriptionInput = this.dialog.getByLabel('Description');
    this.cancelButton = this.dialog.getByRole('button', { name: 'Cancel' });
    this.createButton = this.dialog.getByRole('button', { name: 'Create' });
    this.showAiGenerationConfigButton = this.dialog.getByRole('button', {
      name: /Show AI Generation Config/i,
    });
  }

  async fillProgramName(name: string) {
    await this.programNameInput.fill(name);
  }

  async fillDescription(description: string) {
    await this.descriptionInput.fill(description);
  }

  async cancel() {
    await this.cancelButton.click();
  }

  async showAiGenerationConfig() {
    await this.showAiGenerationConfigButton.click();
  }

  /** Resolves a selector for axe `.include()` scoped to this dialog. */
  async axeIncludeSelector(): Promise<string> {
    await this.dialog.waitFor({ state: 'visible' });
    return this.dialog.evaluate((dialog) => {
      const labelledBy = dialog.getAttribute('aria-labelledby');
      if (labelledBy) {
        return `[role="dialog"][aria-labelledby="${labelledBy}"]`;
      }
      const label = dialog.getAttribute('aria-label');
      if (label) {
        return `[role="dialog"][aria-label="${CSS.escape(label)}"]`;
      }
      throw new Error('New Program dialog is missing aria-labelledby and aria-label');
    });
  }

  async submitCreate(): Promise<string> {
    const created = this.page.waitForResponse((response) => {
      if (response.request().method() !== 'POST' || !response.ok()) return false;
      try {
        return new URL(response.url()).pathname === '/api/programs';
      } catch {
        return false;
      }
    });
    await this.createButton.click();
    const body = await (await created).json();
    const id = body?.data?.id;
    if (typeof id !== 'string') {
      throw new Error('Create program response did not include data.id');
    }
    return id;
  }
}
