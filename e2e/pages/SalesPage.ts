import { Page, Locator } from '@playwright/test';

export class SalesPage {
  readonly page: Page;
  private readonly productSelect: Locator;
  private readonly quantityInput: Locator;
  private readonly confirmSaleButton: Locator;
  private readonly successMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.productSelect = page.getByRole('combobox', { name: /producto|product/i });
    this.quantityInput = page.getByRole('spinbutton', { name: /cantidad|quantity/i });
    this.confirmSaleButton = page.getByRole('button', { name: /confirmar venta|sell/i });
    this.successMessage = page.getByText(/venta exitosa|sale successful/i);
  }

  async goto() {
    const baseUrl = process.env.UI_URL || 'http://localhost:3000';
    await this.page.goto(`${baseUrl}/sales`);
  }

  async selectProduct(productName: string) {
    await this.productSelect.selectOption({ label: productName });
  }

  async enterQuantity(quantity: number) {
    await this.quantityInput.fill(quantity.toString());
  }

  async confirmSale() {
    await this.confirmSaleButton.click();
  }

  async getSuccessMessageLocator(): Locator {
    return this.successMessage;
  }
}
