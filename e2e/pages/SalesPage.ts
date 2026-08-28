import { Page, Locator, expect } from '@playwright/test';

export class SalesPage {
  readonly page: Page;
  private readonly saleDialog: Locator;
  private readonly branchSelect: Locator;
  private readonly productSelect: Locator;
  private readonly quantityInput: Locator;
  private readonly confirmSaleButton: Locator;
  private readonly successMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.saleDialog = page.getByRole('dialog');
    this.branchSelect = this.saleDialog.getByRole('combobox', { name: /sucursal/i });
    this.productSelect = this.saleDialog.getByRole('combobox', { name: /producto|product/i });
    this.quantityInput = this.saleDialog.getByRole('spinbutton', { name: /cantidad|quantity/i });
    this.confirmSaleButton = this.saleDialog.getByRole('button', { name: /confirmar|sell/i });
    this.successMessage = page
      .getByText(/venta/i)
      .filter({ hasText: /registrada|realizada|exitosa|completada|creada|procesada|éxito|success/i })
      .or(page.getByRole('status'))
      .or(page.getByText(/éxito|exitosa|success/i))
      .first();
  }

  async goto() {
    await this.page.goto('/sales');
  }

  async openSaleForm() {
    await this.page.getByRole('button', { name: /registro de venta/i }).click();
  }

  async selectBranch(branchId: string) {
    await this.branchSelect.selectOption(branchId);
    await this.productSelect.locator('option:not([value=""])').first().waitFor({ state: 'attached', timeout: 5000 }).catch(() => {});
  }

  async selectProduct(productId: string) {
    // Esperar explícitamente a que la opción de este producto esté en el DOM
    await this.productSelect.locator(`option[value="${productId}"]`).waitFor({ state: 'attached', timeout: 5000 });
    await this.productSelect.selectOption(productId);
    // Esperar a que el texto "Stock disponible" aparezca en el diálogo, lo que garantiza que React procesó la selección
    await this.saleDialog.getByText(/Stock disponible/i).waitFor({ state: 'visible', timeout: 5000 });
  }

  async enterQuantity(quantity: number) {
    await this.quantityInput.fill(quantity.toString());
    await this.quantityInput.dispatchEvent('change');
  }

  async confirmSale() {
    await expect(this.confirmSaleButton).toBeEnabled({ timeout: 5000 });
    await this.confirmSaleButton.click();
    // Esperar a que el modal se cierre (confirmando que la venta fue procesada y aceptada por el backend)
    await this.saleDialog.waitFor({ state: 'hidden', timeout: 10000 });
  }

  async getSuccessMessageLocator(): Locator {
    return this.successMessage;
  }
}
