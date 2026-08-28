import { test, expect } from '../../fixtures/test-base';

test.describe('Health Check (Smoke)', () => {
  test('debe retornar 200 OK en el endpoint de actuator health', async ({ request, seeder, apiHelper }) => {
    // ARRANGE: Credenciales administrativas para verificación de infraestructura
    const userEmail = `health_admin_${Date.now()}@test.com`;
    await seeder.seedUser(userEmail, 'ADMIN', 'pass123');
    const token = await apiHelper.login(userEmail, 'pass123');

    // ACT
    const actuatorUrl = process.env.API_URL?.replace('/api/v1', '/actuator') || '';
    const response = await request.get(`${actuatorUrl}/health`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    // ASSERT: El servicio debe reportar disponibilidad operativa inmediata (UP)
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    expect(body.status).toBe('UP');
  });
});
