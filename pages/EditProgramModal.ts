import type { Locator, Page } from '@playwright/test';

export class EditProgramModal {
  readonly dialog: Locator;
  readonly heading: Locator;
  readonly programNameInput: Locator;
  readonly descriptionInput: Locator;
  readonly cancelButton: Locator;
  readonly saveButton: Locator;
  readonly showAiGenerationConfigButton: Locator;
  readonly validationError: Locator;

  constructor(private readonly page: Page) {
    this.dialog = page.getByRole('dialog').filter({
      has: page.getByRole('heading', { name: 'Edit Program' }),
    });
    this.heading = this.dialog.getByRole('heading', { name: 'Edit Program' });
    this.programNameInput = this.dialog.getByLabel('Program Name');
    this.descriptionInput = this.dialog.getByLabel('Description');
    this.cancelButton = this.dialog.getByRole('button', { name: 'Cancel' });
    this.saveButton = this.dialog.getByRole('button', { name: 'Save' });
    this.showAiGenerationConfigButton = this.dialog.getByRole('button', {
      name: /Show AI Generation Config/i,
    });
    this.validationError = this.dialog.getByRole('alert').or(
      this.dialog.getByText(/already exists|duplicate|unique|maximum|too long|invalid/i),
    );
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
      throw new Error('Edit Program dialog is missing aria-labelledby and aria-label');
    });
  }

  async clickSave() {
    await this.saveButton.click();
  }

  async submitSave(): Promise<void> {
    const updated = this.page.waitForResponse((response) => {
      if (response.request().method() !== 'PATCH' || !response.ok()) return false;
      try {
        return new URL(response.url()).pathname.startsWith('/api/programs/');
      } catch {
        return false;
      }
    });
    await this.clickSave();
    await updated;
  }
}
