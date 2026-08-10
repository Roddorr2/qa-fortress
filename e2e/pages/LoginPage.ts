import { Page, Locator } from '@playwright/test';

/**
 * Page Object para la página de Login.
 * Regla de Oro: Ningún selector debe existir fuera de esta clase.
 * Regla de Plata: Ninguna aserción de negocio vive aquí, solo interacciones.
 */
export class LoginPage {
  readonly page: Page;
  private readonly usernameInput: Locator;
  private readonly passwordInput: Locator;
  private readonly loginButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.usernameInput = page.getByRole('textbox', { name: /usuario|email/i });
    this.passwordInput = page.getByLabel(/contraseña|password/i);
    this.loginButton = page.getByRole('button', { name: /entrar|login/i });
  }

  /**
   * Navega a la página de login.
   */
  async goto() {
    const baseUrl = process.env.UI_URL || 'http://localhost:3000';
    await this.page.goto(`${baseUrl}/login`);
  }

  /**
   * Completa las credenciales en el formulario.
   */
  async fillCredentials(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
  }

  /**
   * Envía el formulario de login.
   */
  async submit() {
    await this.loginButton.click();
  }

  /**
   * Acción de negocio completa para facilitar tests que solo necesitan loguearse.
   */
  async performLogin(username: string, password: string) {
    await this.fillCredentials(username, password);
    await this.submit();
  }
}
