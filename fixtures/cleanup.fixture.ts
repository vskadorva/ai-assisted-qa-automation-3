import { test as base, request, expect, chromium } from '@playwright/test';

type CleanupFixtures = {
  trackProgram: (uuid: string) => void;
};

const baseURL = () => process.env.DIDAXIS_URL ?? 'https://test.didaxis.studio';

function tokenExpiresAt(token: string): number | null {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
    return typeof payload.exp === 'number' ? payload.exp : null;
  } catch {
    return null;
  }
}

async function captureTokenFromLogin(): Promise<string> {
  const email = process.env.DIDAXIS_EMAIL;
  const password = process.env.DIDAXIS_PASSWORD;
  if (!email || !password) {
    throw new Error('Set DIDAXIS_EMAIL and DIDAXIS_PASSWORD in .env');
  }

  const browser = await chromium.launch();
  const page = await browser.newPage();
  const loginResponse = page.waitForResponse(
    (res) => res.url().endsWith('/api/auth/login') && res.ok(),
  );
  await page.goto(`${baseURL()}/login`);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  const body = await (await loginResponse).json();
  await browser.close();

  const token = body?.data?.access_token as string | undefined;
  if (!token) throw new Error('Login response did not include data.access_token');
  process.env.DIDAXIS_API_TOKEN = token;
  return token;
}

export async function tokenForCleanup(): Promise<string> {
  const token = process.env.DIDAXIS_API_TOKEN;
  const exp = token ? tokenExpiresAt(token) : null;
  const now = Math.floor(Date.now() / 1000);
  if (token && exp && exp > now + 15) return token;
  return captureTokenFromLogin();
}

async function deleteProgram(id: string, token: string) {
  const api = await request.newContext({
    baseURL: baseURL(),
    extraHTTPHeaders: { Authorization: `Bearer ${token}` },
  });
  try {
    return await api.delete(`/api/programs/${id}`);
  } finally {
    await api.dispose();
  }
}

export const test = base.extend<CleanupFixtures>({
  trackProgram: async ({}, use) => {
    const ids: string[] = [];
    await use((uuid) => {
      ids.push(uuid);
    });
    if (ids.length === 0) return;

    let token = await tokenForCleanup();
    for (const id of ids) {
      let response = await deleteProgram(id, token);
      if (response.status() === 401) {
        token = await captureTokenFromLogin();
        response = await deleteProgram(id, token);
      }
      if (!response.ok()) {
        throw new Error(`Cleanup failed for ${id}: ${response.status()}`);
      }
    }
  },
});

export { expect };
