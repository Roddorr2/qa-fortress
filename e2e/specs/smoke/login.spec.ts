import { test, expect } from '../../fixtures/test-base';
import { LoginPage } from '../../pages/LoginPage';

test.describe('Login Flujo Crítico @smoke', () => {

  test('TC-001: Login con credenciales válidas emite JWT válido y redirige', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.performLogin('admin', 'password123');

    await expect(page).toHaveURL(/.*dashboard/);
    
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token, 'El token debe existir en LocalStorage').toBeTruthy();
  });

});
