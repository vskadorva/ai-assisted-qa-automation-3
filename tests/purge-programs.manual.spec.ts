import { expect, request, test, type APIRequestContext } from '@playwright/test';
import { tokenForCleanup } from '../fixtures/cleanup.fixture';

const baseURL = process.env.DIDAXIS_URL ?? 'https://test.didaxis.studio';

function purgeLimit(): number | 'all' {
  const raw = process.env.PURGE_LIMIT?.trim() ?? '';
  if (raw === 'all') return 'all';
  if (/^[1-9]\d*$/.test(raw)) return Number(raw);
  throw new Error(
    'Refusing to delete. Set PURGE_LIMIT to a positive count or "all".\n' +
      '  npm run purge -- 100\n' +
      '  npm run purge -- 300\n' +
      '  npm run purge -- 1000\n' +
      '  npm run purge -- all',
  );
}

function apiContext(token: string) {
  return request.newContext({
    baseURL,
    extraHTTPHeaders: { Authorization: `Bearer ${token}` },
  });
}

async function getPrograms(token: string) {
  const api = await apiContext(token);
  try {
    const response = await api.get('/api/programs');
    const data = response.ok() ? await response.json() : null;
    return { status: response.status(), data };
  } finally {
    await api.dispose();
  }
}

async function deleteProgram(api: APIRequestContext, id: string) {
  return api.delete(`/api/programs/${id}`);
}

test('manually purge programs from GET /api/programs', async () => {
  test.setTimeout(60 * 60 * 1000);
  const limit = purgeLimit();

  let token = await tokenForCleanup();
  let list = await getPrograms(token);
  if (list.status === 401) {
    process.env.DIDAXIS_API_TOKEN = '';
    token = await tokenForCleanup();
    list = await getPrograms(token);
  }

  expect(list.status, `GET /api/programs failed: ${list.status}`).toBeLessThan(400);

  const ids: string[] = [];
  for (const program of list.data?.data ?? []) {
    if (typeof program?.id === 'string') ids.push(program.id);
  }

  const targets = limit === 'all' ? ids : ids.slice(0, limit);
  console.log(
    `Stored ${ids.length} program ids. Deleting ${targets.length} (${limit === 'all' ? 'all' : `first ${limit}`}).`,
  );

  let api = await apiContext(token);
  let deleted = 0;
  const failed: { id: string; status: number }[] = [];

  try {
    for (const id of targets) {
      let response = await deleteProgram(api, id);
      if (response.status() === 401) {
        await api.dispose();
        process.env.DIDAXIS_API_TOKEN = '';
        token = await tokenForCleanup();
        api = await apiContext(token);
        response = await deleteProgram(api, id);
      }
      if (response.ok() || response.status() === 404) {
        deleted += 1;
      } else {
        failed.push({ id, status: response.status() });
      }
      if (deleted > 0 && deleted % 50 === 0) {
        console.log(`Deleted ${deleted} of ${targets.length}`);
      }
    }
  } finally {
    await api.dispose();
  }

  console.log(`Deleted ${deleted}. Failed ${failed.length}.`);
  expect(failed, failed.map((item) => `${item.id} -> ${item.status}`).join('\n')).toEqual([]);
});
