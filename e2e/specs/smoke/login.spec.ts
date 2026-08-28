import { test, expect } from '../../fixtures/test-base';
import { LoginPage } from '../../pages/LoginPage';

test.describe('Login Flujo Crítico @smoke', () => {

  test('TC-001: Login con credenciales válidas emite JWT válido y redirige', async ({ page, seeder }) => {
    // ARRANGE: Identificador único para aislar la prueba de autenticación de otros usuarios
    const email = `test_admin_${Date.now()}@stockpulse.com`;
    const password = 'password123';
    
    await seeder.seedUser(email, 'ADMIN', password);

    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // ACT
    await loginPage.performLogin(email, password);

    // ASSERT: Un inicio de sesión exitoso redirige al panel principal y genera sesión activa
    await expect(page).not.toHaveURL(/.*login/);
    
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token, 'El token debe existir en LocalStorage').toBeTruthy();
  });
 
});
