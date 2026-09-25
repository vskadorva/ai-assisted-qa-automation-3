import { test, expect, type Page } from '@playwright/test';

const TODO_MVC_URL = 'https://demo.playwright.dev/todomvc/';

async function addTodo(page: Page, title: string) {
  const input = page.getByPlaceholder('What needs to be done?');
  await input.click();
  await input.fill(title);
  await input.press('Enter');
}

function todoWithTitle(page: Page, title: string) {
  return page
    .getByRole('list')
    .first()
    .getByRole('listitem')
    .filter({ has: page.getByText(title, { exact: true }) });
}

function longTitle200Characters(): string {
  const chunk = 'Buy milk ';
  let title = '';
  while (title.length < 200) {
    title += chunk;
  }
  return title.slice(0, 200);
}

test.beforeEach(async ({ page }) => {
  await page.goto(TODO_MVC_URL);
});

test('TC-001: "Buy milk" appears in the list as an active item', async ({ page }) => {
  await addTodo(page, 'Buy milk');

  const item = todoWithTitle(page, 'Buy milk');
  await expect(item).toBeVisible();
  await expect(item.getByRole('checkbox')).not.toBeChecked();
  await expect(item).not.toHaveClass(/completed/);
  await expect(page.getByText('1 item left')).toBeVisible();
});

test('TC-002: Completed item is struck through and no longer counted as left', async ({
  page,
}) => {
  await addTodo(page, 'Buy milk');

  const item = todoWithTitle(page, 'Buy milk');
  await item.getByRole('checkbox').click();

  await expect(item.getByRole('checkbox')).toBeChecked();
  await expect(item).toHaveClass(/completed/);
  await expect(page.getByText('0 items left')).toBeVisible();
});

test('TC-003: Deleted item is removed and the remaining count updates', async ({ page }) => {
  await addTodo(page, 'Buy milk');
  await addTodo(page, 'Walk dog');

  const buyMilk = todoWithTitle(page, 'Buy milk');
  await buyMilk.hover();
  await buyMilk.getByRole('button').click();

  await expect(buyMilk).toHaveCount(0);
  await expect(todoWithTitle(page, 'Walk dog')).toBeVisible();
  await expect(todoWithTitle(page, 'Walk dog').getByRole('checkbox')).not.toBeChecked();
  await expect(page.getByText('1 item left')).toBeVisible();
});

test('TC-004: Empty Enter does not add a blank item', async ({ page }) => {
  const input = page.getByPlaceholder('What needs to be done?');
  await input.click();
  await input.press('Enter');

  await expect(page.getByRole('listitem').filter({ hasText: /.+/ })).toHaveCount(0);
  await expect(page.getByText(/items? left/)).not.toBeVisible();
});

test('TC-005: Text stays in the input until Enter is pressed', async ({ page }) => {
  const input = page.getByPlaceholder('What needs to be done?');
  await input.fill('Buy milk');

  await expect(todoWithTitle(page, 'Buy milk')).toHaveCount(0);
  await expect(input).toHaveValue('Buy milk');
});

test('TC-006: Completing one item leaves the others active', async ({ page }) => {
  await addTodo(page, 'Buy milk');
  await addTodo(page, 'Walk dog');

  await todoWithTitle(page, 'Buy milk').getByRole('checkbox').click();

  await expect(todoWithTitle(page, 'Buy milk')).toHaveClass(/completed/);
  await expect(todoWithTitle(page, 'Walk dog')).not.toHaveClass(/completed/);
  await expect(todoWithTitle(page, 'Walk dog').getByRole('checkbox')).not.toBeChecked();
  await expect(page.getByText('1 item left')).toBeVisible();
});

test('TC-007: Deleting one item leaves the others in place', async ({ page }) => {
  await addTodo(page, 'Buy milk');
  await addTodo(page, 'Walk dog');

  const walkDog = todoWithTitle(page, 'Walk dog');
  await walkDog.hover();
  await walkDog.getByRole('button').click();

  await expect(walkDog).toHaveCount(0);
  await expect(todoWithTitle(page, 'Buy milk')).toBeVisible();
  await expect(todoWithTitle(page, 'Buy milk').getByRole('checkbox')).not.toBeChecked();
  await expect(page.getByText('1 item left')).toBeVisible();
});

test('TC-008: A one-character title is saved and shown', async ({ page }) => {
  await addTodo(page, 'A');

  await expect(todoWithTitle(page, 'A')).toBeVisible();
  await expect(page.getByText('1 item left')).toBeVisible();
});

test('TC-009: Whitespace-only input is not added', async ({ page }) => {
  await addTodo(page, '   ');

  await expect(page.getByRole('listitem').filter({ hasText: /\S/ })).toHaveCount(0);
});

test('TC-010: Leading and trailing spaces are trimmed from the title', async ({ page }) => {
  await addTodo(page, '  Buy milk  ');

  const item = todoWithTitle(page, 'Buy milk');
  await expect(item).toBeVisible();
  await expect(item).toHaveText('Buy milk');
});

test('TC-011: Special characters are stored and displayed as typed', async ({ page }) => {
  const title = 'Buy milk & eggs — "2%" <urgent>';
  await addTodo(page, title);

  await expect(page.getByText(title, { exact: true })).toBeVisible();
});

test('TC-012: Two items with the same title both remain in the list', async ({ page }) => {
  await addTodo(page, 'Buy milk');
  await addTodo(page, 'Buy milk');

  await expect(todoWithTitle(page, 'Buy milk')).toHaveCount(2);
  await expect(page.getByText('2 items left')).toBeVisible();
});

test('TC-013: A very long title is accepted and shown in full', async ({ page }) => {
  const title = longTitle200Characters();
  await addTodo(page, title);

  const item = todoWithTitle(page, title);
  await expect(item).toBeVisible();
  await expect(item).toHaveText(title);
  await expect(page.getByText('1 item left')).toBeVisible();
});
