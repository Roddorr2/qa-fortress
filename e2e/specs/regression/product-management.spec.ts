import { test, expect } from '../../fixtures/test-base';
import { LoginPage } from '../../pages/LoginPage';
import { SalesPage } from '../../pages/SalesPage';

test.describe('Gestión de Productos (FR-01, RN-03)', () => {
  test('solo ADMIN puede crear y desactivar productos, los cuales desaparecen para el cajero', async ({ page, context, seeder, dbHelper }) => {
    // ARRANGE
    const adminEmail = `admin_prod_${Date.now()}@test.com`;
    const cajeroEmail = `cajero_prod_${Date.now()}@test.com`;
    
    await seeder.seedUser(adminEmail, 'ADMIN', 'pass123');
    await seeder.seedUser(cajeroEmail, 'CAJERO', 'pass123');

    // ACT: Flujo administrativo
    const loginPageAdmin = new LoginPage(page);
    await loginPageAdmin.goto();
    await loginPageAdmin.performLogin(adminEmail, 'pass123');

    await page.goto('/admin/products');
    
    const timestamp = Date.now();
    const productSku = `SKU-TEC-${timestamp}`;
    const productName = `Teclado Mecánico ${timestamp}`;

    await page.getByRole('button', { name: /nuevo|new/i }).click();
    await page.getByRole('textbox', { name: 'SKU', exact: true }).fill(productSku);
    await page.getByRole('textbox', { name: 'Nombre', exact: true }).fill(productName);
    await page.getByRole('spinbutton', { name: /precio|price/i }).fill('120');
    await page.getByRole('button', { name: 'Guardar' }).click();
    
    await expect(page.getByText(productName)).toBeVisible();

    // RN-03: El administrador desactiva el producto para retirarlo del catálogo operativo
    const row = page.locator('tr').filter({ hasText: productSku });
    const editBtn = row.getByRole('button', { name: /editar|edit/i }).or(row.locator('button')).first();
    await editBtn.click();

    const activeCheckbox = page.getByRole('checkbox', { name: 'Producto Activo' });
    await activeCheckbox.waitFor({ state: 'visible', timeout: 5000 });
    if (await activeCheckbox.isChecked()) {
      await activeCheckbox.uncheck();
    } else {
      await activeCheckbox.click();
    }

    await page.getByRole('button', { name: 'Guardar' }).click();

    // RN-03: Verificación en la fuente de verdad — el producto debe persistirse como inactivo
    await expect.poll(async () => {
      const dbResult = await dbHelper.query(
        'SELECT activo FROM productos WHERE sku = $1',
        [productSku]
      );
      return dbResult.rows[0]?.activo;
    }, {
      message: 'El producto no fue actualizado a activo=false en la base de datos',
      timeout: 10000,
    }).toBe(false);

    // Contexto de cajero aislado para evaluar el catálogo visible desde su rol (FR-01, FR-07)
    const cajeroContext = await page.context().browser()!.newContext();
    const cajeroPage = await cajeroContext.newPage();
    const loginPageCajero = new LoginPage(cajeroPage);
    await loginPageCajero.goto();
    await loginPageCajero.performLogin(cajeroEmail, 'pass123');

    const salesPage = new SalesPage(cajeroPage);
    await salesPage.goto();
    await salesPage.openSaleForm();

    // RN-03: Un producto inactivo no debe aparecer como opción seleccionable para venta
    const saleDialog = cajeroPage.getByRole('dialog');
    const productSelect = saleDialog.getByRole('combobox', { name: /producto|product/i }).or(cajeroPage.locator('#sale-product-select'));
    const productOptionsText = await productSelect.innerText();
    expect(productOptionsText).not.toContain(productName);

    await cajeroContext.close();
  });

  test('cajero es redirigido a vista de no autorizado al intentar acceder a panel de admin', async ({ page, seeder }) => {
    // ARRANGE
    const cajeroEmail = `cajero_unauth_${Date.now()}@test.com`;
    await seeder.seedUser(cajeroEmail, 'CAJERO', 'pass123');

    // ACT
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.performLogin(cajeroEmail, 'pass123');
    
    // Control de accesos (RN-04): Un cajero no debe poder ingresar a módulos administrativos
    await page.goto('/admin/products');

    // RN-04: El sistema debe bloquear el acceso no autorizado y mostrar la vista de denegación
    await expect(page).toHaveURL(/.*unauthorized|.*denied|.*403/i);
    await expect(
      page
        .getByRole('heading', { name: /acceso denegado|no autorizado|unauthorized/i })
        .or(page.getByText(/acceso denegado|no autorizado|unauthorized/i))
    ).toBeVisible();
  });
});
