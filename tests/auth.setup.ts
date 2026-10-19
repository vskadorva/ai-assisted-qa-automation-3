import { test as setup } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

function requireCredentials(): { email: string; password: string } {
  const email = process.env.DIDAXIS_EMAIL;
  const password = process.env.DIDAXIS_PASSWORD;
  if (!email || !password) {
    throw new Error(
      'Set DIDAXIS_EMAIL and DIDAXIS_PASSWORD in .env before running tests.',
    );
  }
  return { email, password };
}

setup('authenticate', async ({ page }) => {
  const { email, password } = requireCredentials();

  await page.goto('https://test.didaxis.studio/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL((url) => !url.pathname.includes('/login'));
  await page.goto('https://test.didaxis.studio/programs');
  await page.waitForURL('**/programs');

  fs.mkdirSync(path.dirname(authFile), { recursive: true });
  await page.context().storageState({ path: authFile });
});
