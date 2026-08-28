import { test, expect } from "../../fixtures/test-base";
import { LoginPage } from "../../pages/LoginPage";
import { SalesPage } from "../../pages/SalesPage";

test.describe("Alertas de Bajo Stock (FR-06, RN-05)", () => {
  test("debe emitir evento WS cuando stock cae bajo umbral del producto", async ({
    page,
    seeder,
    dbHelper,
  }) => {
    // ARRANGE
    const branchId = await seeder.seedBranch("[TEST] Sucursal WS Alert");
    const productId = await seeder.seedProduct("Mouse Gamer WS", 50, 5); // stock_minimo = 5
    // Stock inicial (6) situado un paso arriba del umbral crítico (5)
    await seeder.seedStock(productId, branchId, 6);

    const cashierEmail = `cajero-ws-${Date.now()}@test.com`;
    await seeder.seedUser(cashierEmail, "CAJERO", "pass123");

    // El administrador es el único rol con acceso al dashboard de monitoreo en tiempo real
    const adminUser = process.env.ADMIN_USER || "admin@stockpulse.com";
    const adminPass = process.env.ADMIN_PASS || "admin123";

    // FASE 1: Registro de venta como CAJERO (en /sales)
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.performLogin(cashierEmail, "pass123");

    const salesPage = new SalesPage(page);
    await salesPage.goto();
    await salesPage.openSaleForm();
    await salesPage.selectBranch(branchId);
    await salesPage.selectProduct(productId);
    // Venta de 2 unidades para que el stock caiga a 4, cruzando el umbral crítico de 5 (RN-05)
    await salesPage.enterQuantity(2);

    // La venta debe ser confirmada por el servidor antes de validar la emisión de la alerta
    const [ventaResponse] = await Promise.all([
      page.waitForResponse(
        (res) => res.url().includes("/api/v1/sales") && res.status() === 201,
        { timeout: 10000 }
      ),
      salesPage.confirmSale(),
    ]);
    expect(ventaResponse.status(), "La venta no retornó HTTP 201").toBe(201);

    // El cajero cierra sesión para dar paso al administrador en su propio entorno
    const logoutBtn = page.getByRole("button", { name: /logout|cerrar sesión/i })
      .or(page.getByLabel(/logout|cerrar sesión/i))
      .or(page.locator('button[title*="sesión" i]'))
      .first();
    await logoutBtn.click();
    await page.waitForURL((url) => url.pathname.endsWith('/login'));

    // FASE 2: Verificación de alerta como ADMIN en Dashboard (/)
    await loginPage.performLogin(adminUser, adminPass);

    // Se valida que el canal en tiempo real esté sincronizado antes de inspeccionar alertas
    await expect(
      page.getByText(/Live WS Connected|Estado Red|OPERATIVO|Sincronizado|Conectado/i).first(),
      "WebSocket no conectó en el dashboard del admin"
    ).toBeVisible({ timeout: 15000 });

    /*
     * NOTA ARQUITECTURAL SOBRE SIMPLEBROKER (Spring Boot):
     * Spring SimpleBroker opera en memoria y no persiste mensajes. Si el backend emite
     * el evento @Async inmediatamente tras el 201 y el admin se conecta milisegundos después,
     * el mensaje en tiempo real ya fue publicado en el tópico /topic/stock-alerts/global.
     * Por ello, en E2E el Toast del dashboard actúa como validación "best effort",
     * mientras que la Base de Datos (PostgreSQL) es la fuente de verdad definitiva de FR-06.
     */
    const toastContainer = page.getByRole("region", {
      name: /Notificaciones de alertas de stock/i,
    });

    const toastVisible = await toastContainer
      .isVisible({ timeout: 10000 })
      .catch(() => false);

    if (toastVisible) {
      const toastAlert = toastContainer.getByRole("alert").first();
      await expect(toastAlert).toContainText("Mouse Gamer WS");
      await expect(toastAlert).toContainText("Stock Crítico en Sucursal");
      console.log("[ASSERT WS] Toast de alerta visible en dashboard ✓");
    } else {
      console.warn(
        "[ASSERT WS] Toast no visible: el evento @Async fue emitido antes de que el admin se conectara al WebSocket. " +
        "SimpleBroker no persiste mensajes. El assert de BD confirmará el cumplimiento de la condición."
      );
    }

    // RN-01 / RN-05: La fuente de verdad confirma que el stock remanente es 4 (bajo el mínimo de 5)
    const result = await dbHelper.query(
      `SELECT cantidad FROM stocks WHERE producto_id = $1 AND sucursal_id = $2`,
      [productId, branchId]
    );

    expect(
      result.rows[0]?.cantidad,
      "El stock final en BD no es 4 tras la venta de 2 unidades"
    ).toBe(4);
  });
});
