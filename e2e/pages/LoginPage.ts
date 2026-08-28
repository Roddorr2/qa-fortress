import { Page, Locator, expect } from "@playwright/test";

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
    this.usernameInput = page.getByRole("textbox", { name: /usuario|email/i });
    this.passwordInput = page.getByLabel(/contraseña|password/i);
    this.loginButton = page.getByRole("button", {
      name: /Iniciar Sesión|login/i,
    });
  }

  /**
   * Navega a la página de login.
   */
  async goto() {
    await this.page.goto('/login');
  }

  /**
   * Completa las credenciales en el formulario.
   */
  async fillCredentials(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.usernameInput.dispatchEvent('input');
    await this.usernameInput.dispatchEvent('change');
    await this.passwordInput.fill(password);
    await this.passwordInput.dispatchEvent('input');
    await this.passwordInput.dispatchEvent('change');
  }

  /**
   * Envía el formulario de login.
   */
  async submit() {
    await expect(this.loginButton).toBeEnabled({ timeout: 5000 });
    await this.loginButton.click();
    // Espera que la navegación complete y salga de la ruta /login hacia cualquier vista de destino
    await this.page.waitForURL((url) => !url.pathname.endsWith('/login'));
  }

  /**
   * Acción de negocio completa para facilitar tests que solo necesitan loguearse.
   */
  async performLogin(username: string, password: string) {
    await this.fillCredentials(username, password);
    await this.submit();
  }
}
