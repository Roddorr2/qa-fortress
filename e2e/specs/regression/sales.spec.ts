import { test, expect } from '../../fixtures/test-base';
import { SalesPage } from '../../pages/SalesPage';
import { LoginPage } from '../../pages/LoginPage';

test.describe('Flujo de Ventas @regression', () => {

  test('TC-004: Venta con stock suficiente descuenta correctamente en UI y DB', async ({ page, apiHelper, dbHelper }) => {
    // 1. Arrange: Setup de precondiciones
    // Mock de lo que haría apiHelper: crear sucursal, producto y asignar 10 unidades de stock
    // const branchId = await apiHelper.createBranch('Sucursal Centro');
    // const productId = await apiHelper.createProduct({ name: 'Laptop Pro' });
    // await apiHelper.addStock(productId, branchId, 10);
    
    // Hardcodeado temporalmente para propósitos ilustrativos del framework
    const productId = 101; 
    const branchId = 1;
    const initialStock = 10;
    const quantityToSell = 2;

    // Login rápido
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.performLogin('admin', 'password123');

    // 2. Act: Ejecutar la venta en UI
    const salesPage = new SalesPage(page);
    await salesPage.goto();
    await salesPage.selectProduct('Laptop Pro');
    await salesPage.enterQuantity(quantityToSell);
    await salesPage.confirmSale();

    // 3. Assert Nivel 1: Validación de UI
    await expect(await salesPage.getSuccessMessageLocator()).toBeVisible();

    // 4. Assert Nivel 2: Validación Directa en Base de Datos (Crucial)
    // Se espera que el sistema tome su tiempo en sincronizar, pero en este ejemplo lo hacemos directo
    const finalStock = await dbHelper.getStockForProduct(productId, branchId);
    
    // Verificamos matemáticamente el resultado real
    expect(finalStock, 'El stock final en la base de datos no cuadra con la venta realizada').toBe(initialStock - quantityToSell);
  });

});
