import { test as base, Page } from '@playwright/test';
import { ApiClient } from './api-client';
import { DbHelper } from '../../db-validations/sql/db-client';
import { TestSeeder } from '../../db-validations/sql/seeder';
import { LoginPage } from '../pages/LoginPage';

type MyFixtures = {
  apiHelper: ApiClient;
  dbHelper: DbHelper;
  seeder: TestSeeder;
  authenticatedPage: Page;
};

/**
 * Fixtures personalizados de QA-Fortress.
 * Proveen aislamiento de datos, herramientas de validación cruzada en base de datos
 * y gestión del ciclo de vida (setup y teardown) para cada prueba.
 */
export const test = base.extend<MyFixtures>({
  apiHelper: async ({ request }, use) => {
    const apiClient = new ApiClient(request);
    await use(apiClient);
  },
  dbHelper: async ({}, use) => {
    const dbHelper = new DbHelper();
    await use(dbHelper);
    // Libera la conexión con el servidor para evitar saturación de recursos
    await dbHelper.close();
  },
  seeder: async ({ dbHelper }, use) => {
    const seeder = new TestSeeder(dbHelper);
    await use(seeder);
    // Limpieza atómica de datos generados para garantizar aislamiento entre pruebas
    await seeder.cleanup();
  },
  authenticatedPage: async ({ page }, use) => {
    // Precondición: sesión administrativa activa para evaluar flujos internos directos
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    
    const adminUser = process.env.ADMIN_USER as string;
    const adminPass = process.env.ADMIN_PASS as string;
    await loginPage.performLogin(adminUser, adminPass);
    
    await use(page);
  }
});

export { expect } from '@playwright/test';
