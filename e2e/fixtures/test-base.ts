import { test as base } from '@playwright/test';
import { ApiClient } from './api-client';
import { DbHelper } from '../../db-validations/sql/db-client';

type MyFixtures = {
  apiHelper: ApiClient;
  dbHelper: DbHelper;
};

/**
 * Extendemos el objeto test nativo de Playwright para inyectar automáticamente
 * nuestras herramientas de setup (como el apiHelper) en cada spec.
 */
export const test = base.extend<MyFixtures>({
  apiHelper: async ({ request }, use) => {
    const apiClient = new ApiClient(request);
    await use(apiClient);
  },
  dbHelper: async ({}, use) => {
    const dbHelper = new DbHelper();
    await use(dbHelper);
  },
});

export { expect } from '@playwright/test';
