import { test, expect } from '../../fixtures/test-base';

test.describe('Concurrencia: Prevención de Sobregiro de Stock (FR-04, RN-01)', () => {
  test('debe evitar ventas que resulten en stock negativo bajo alta concurrencia', async ({ request, seeder, dbHelper, apiHelper }) => {
    // ARRANGE
    const branchId = await seeder.seedBranch('Sucursal Concurrencia Extrema');
    const productId = await seeder.seedProduct('RTX 4090 - Última Unidad', 2000);
    
    // Stock crítico de 1 sola unidad para probar el conflicto de concurrencia y sobregiro
    await seeder.seedStock(productId, branchId, 1);

    const userEmail = `cajero_concurrency_${Date.now()}@test.com`;
    const userId = await seeder.seedUser(userEmail, 'CAJERO', 'pass123');
    const token = await apiHelper.login(userEmail, 'pass123');

    // ACT: 10 cajeros intentan vender en simultáneo la única unidad disponible
    const concurrentRequests = 10;
    
    const requestPromises = Array.from({ length: concurrentRequests }).map(() => {
      return request.post(`${process.env.API_URL}/sales`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: {
          sucursalId: branchId,
          usuarioId: userId,
          items: [
            {
              productoId: productId,
              cantidad: 1
            }
          ]
        }
      });
    });

    const responses = await Promise.all(requestPromises);

    // ASSERT
    let successfulSales = 0;
    let failedSales = 0;

    for (const response of responses) {
      if (response.status() === 200 || response.status() === 201) {
        successfulSales++;
      } else {
        failedSales++;
      }
    }

    // RN-01: Exactamente 1 venta debe concretarse y las 9 restantes deben rechazarse para evitar stock negativo
    expect(successfulSales).toBe(1);
    expect(failedSales).toBe(concurrentRequests - 1);

    // RN-01: Verificación en la fuente de verdad — el stock remanente debe ser exactamente 0, jamás menor
    const stockResult = await dbHelper.query(
      'SELECT cantidad FROM stocks WHERE producto_id = $1 AND sucursal_id = $2',
      [productId, branchId]
    );
    
    const finalStock = stockResult.rows[0].cantidad;
    expect(finalStock).toBe(0);
    expect(finalStock).toBeGreaterThanOrEqual(0);
  });
});
