import { test, expect } from '../../fixtures/test-base';
import { SalesPage } from '../../pages/SalesPage';
import { LoginPage } from '../../pages/LoginPage';

test.describe('Flujo de Ventas @regression', () => {

  test('TC-004: Venta con stock suficiente descuenta correctamente en UI y DB', async ({ page, seeder, dbHelper }) => {
    // ARRANGE: Sucursal y producto con stock suficiente (10) para realizar la venta sin sobregiro
    const branchId = await seeder.seedBranch('Sucursal Centro Test');
    const productId = await seeder.seedProduct('Laptop Pro', 1500);
    const initialStock = 10;
    
    await seeder.seedStock(productId, branchId, initialStock);
    
    // Email único para aislar la prueba y rol de cajero autorizado para el punto de venta (FR-07)
    const cashierEmail = `cajero_${Date.now()}@stockpulse.com`;
    await seeder.seedUser(cashierEmail, 'CAJERO', 'password123');
    const quantityToSell = 2;

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.performLogin(cashierEmail, 'password123');

    // ACT: Registro de venta de 2 unidades en el formulario operativo
    const salesPage = new SalesPage(page);
    await salesPage.goto();
    await salesPage.openSaleForm();
    await salesPage.selectBranch(branchId);
    await salesPage.selectProduct(productId);
    await salesPage.enterQuantity(quantityToSell);

    const [ventaResponse] = await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes('/api/v1/sales') && res.status() === 201,
        { timeout: 10000 }
      ),
      salesPage.confirmSale(),
    ]);
    expect(ventaResponse.status(), 'La venta no retornó HTTP 201').toBe(201);

    // ASSERT UI: La interfaz confirma la transacción cerrando el diálogo de venta
    await expect(page.getByRole('dialog')).toBeHidden();

    // RN-01: El stock remanente en la fuente de verdad debe reflejar exactamente 10 - 2 = 8 unidades
    await expect.poll(async () => {
      return await dbHelper.getStockForProduct(productId, branchId);
    }, {
      message: 'El stock final en la base de datos no cuadra con la venta realizada',
      timeout: 5000,
    }).toBe(initialStock - quantityToSell);
  });

});
