import { test, expect } from '../../fixtures/test-base';
import { LoginPage } from '../../pages/LoginPage';

test.describe('Transferencia de Stock (FR-05, RN-02)', () => {
  test('debe transferir stock correctamente entre sucursales y ser atómico', async ({ page, seeder, dbHelper }) => {
    // ARRANGE
    const branchOrigenId = await seeder.seedBranch('Sucursal Centro');
    const branchDestinoId = await seeder.seedBranch('Sucursal Norte');
    const productId = await seeder.seedProduct('Laptop Pro', 1500);
    
    // Stock inicial: 10 en origen y 0 en destino para validar la transferencia exacta
    await seeder.seedStock(productId, branchOrigenId, 10);
    await seeder.seedStock(productId, branchDestinoId, 0);

    const userEmail = `encargado_${Date.now()}@test.com`;
    await seeder.seedUser(userEmail, 'ENCARGADO_SUCURSAL', 'pass123');

    // ACT
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.performLogin(userEmail, 'pass123');
    
    // El encargado de sucursal inicia la redistribución de inventario entre sucursales
    await page.goto('/sales');
    await page.getByRole('button', { name: /transferencia/i }).click();
    
    const dialog = page.getByRole('dialog');
    await dialog.waitFor({ state: 'visible', timeout: 5000 });

    const originSelect = dialog.getByLabel('Sucursal Origen');
    await originSelect.locator(`option[value="${branchOrigenId}"]`).waitFor({ state: 'attached', timeout: 5000 });
    await originSelect.selectOption(branchOrigenId);

    const destSelect = dialog.getByLabel('Sucursal Destino');
    await destSelect.locator(`option[value="${branchDestinoId}"]`).waitFor({ state: 'attached', timeout: 5000 });
    await destSelect.selectOption(branchDestinoId);

    const productSelect = dialog.getByLabel(/producto/i).or(dialog.getByRole('combobox', { name: /producto/i }));
    await productSelect.locator(`option[value="${productId}"]`).waitFor({ state: 'attached', timeout: 5000 });
    await productSelect.selectOption(productId);
    
    await dialog.getByRole('spinbutton', { name: /cantidad/i }).fill('3');
    await dialog.getByRole('button', { name: /confirmar|transferir/i }).click();

    // ASSERT UI: La interfaz procesa la transferencia y cierra el formulario
    await dialog.waitFor({ state: 'hidden', timeout: 5000 });

    // RN-02 (Principio de Suma Cero): El total de inventario entre sucursales debe conservarse (7 + 3 = 10)
    await expect.poll(async () => {
      const stockOrigen = await dbHelper.query(
        'SELECT cantidad FROM stocks WHERE producto_id = $1 AND sucursal_id = $2',
        [productId, branchOrigenId]
      );
      const stockDestino = await dbHelper.query(
        'SELECT cantidad FROM stocks WHERE producto_id = $1 AND sucursal_id = $2',
        [productId, branchDestinoId]
      );
      return {
        origen: stockOrigen.rows[0]?.cantidad,
        destino: stockDestino.rows[0]?.cantidad,
      };
    }, {
      message: 'Las cantidades de stock en BD no se actualizaron tras la transferencia',
      timeout: 5000,
    }).toEqual({
      origen: 7,
      destino: 3,
    });
  });

  test('debe rechazar transferencia si la cantidad es mayor al stock disponible', async ({ page, seeder, dbHelper }) => {
    // ARRANGE
    const branchOrigenId = await seeder.seedBranch('Sucursal Sur');
    const branchDestinoId = await seeder.seedBranch('Sucursal Este');
    const productId = await seeder.seedProduct('Monitor 4K', 400);
    
    await seeder.seedStock(productId, branchOrigenId, 5);

    const userEmail = `encargado_fail_${Date.now()}@test.com`;
    await seeder.seedUser(userEmail, 'ENCARGADO_SUCURSAL', 'pass123');

    // ACT
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.performLogin(userEmail, 'pass123');
    
    await page.goto('/sales');
    await page.getByRole('button', { name: /transferencia/i }).click();
    
    const dialog = page.getByRole('dialog');
    await dialog.waitFor({ state: 'visible', timeout: 5000 });
    
    const originSelect = dialog.getByLabel('Sucursal Origen');
    await originSelect.locator(`option[value="${branchOrigenId}"]`).waitFor({ state: 'attached', timeout: 5000 });
    await originSelect.selectOption(branchOrigenId);

    const destSelect = dialog.getByLabel('Sucursal Destino');
    await destSelect.locator(`option[value="${branchDestinoId}"]`).waitFor({ state: 'attached', timeout: 5000 });
    await destSelect.selectOption(branchDestinoId);

    const productSelect = dialog.getByLabel(/producto/i).or(dialog.getByRole('combobox', { name: /producto/i }));
    await productSelect.locator(`option[value="${productId}"]`).waitFor({ state: 'attached', timeout: 5000 });
    await productSelect.selectOption(productId);
    
    // Intento de transferir 10 unidades cuando la sucursal origen solo dispone de 5 (RN-02)
    const quantityInput = dialog.getByRole('spinbutton', { name: /cantidad/i });
    await quantityInput.fill('10');
    await quantityInput.dispatchEvent('change');

    // ASSERT UI (RN-02): La interfaz previene la transferencia deshabilitando la confirmación
    const submitBtn = dialog.getByRole('button', { name: /confirmar/i });
    await expect(
      submitBtn,
      'El botón de confirmación debe permanecer deshabilitado cuando la cantidad supera el stock disponible'
    ).toBeDisabled();

    // RN-02: La fuente de verdad confirma que el inventario de origen se mantiene inalterado en 5
    await expect.poll(async () => {
      const stockOrigenResult = await dbHelper.query(
        'SELECT cantidad FROM stocks WHERE producto_id = $1 AND sucursal_id = $2',
        [productId, branchOrigenId]
      );
      return stockOrigenResult.rows[0]?.cantidad;
    }, { timeout: 5000 }).toBe(5);
  });
});
