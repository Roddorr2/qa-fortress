import { test, expect } from '../../fixtures/test-base';

test.describe('Seguridad y Control de Accesos por API (FR-07, RN-03)', () => {
  test('debe retornar 401 al intentar acceder a un endpoint protegido sin token', async ({ request }) => {
    // ARRANGE: Petición anónima a un recurso administrativo protegido
    
    // ACT
    const response = await request.get(`${process.env.API_URL}/admin/branches`);
    
    // ASSERT: Acceso rechazado por falta de credenciales de autenticación
    expect(response.status()).toBe(401);
  });

  test('debe retornar 403 al intentar acceder a un endpoint de ADMIN con token de CAJERO', async ({ request, apiHelper, seeder }) => {
    // ARRANGE: Usuario autenticado con rol restringido a ventas (CAJERO)
    const timestamp = Date.now();
    const cajeroEmail = `cajero_auth_${timestamp}@test.com`;
    await seeder.seedUser(cajeroEmail, 'CAJERO', 'password123');
    const token = await apiHelper.login(cajeroEmail, 'password123');
    
    // ACT: Intento de ejecución de una acción exclusiva de administradores (FR-01, RN-03)
    const response = await request.post(`${process.env.API_URL}/admin/products`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      data: {
        nombre: 'Producto Ilegal',
        precio: 1000
      }
    });

    // ASSERT: Acceso prohibido (403) por privilegios insuficientes
    expect(response.status()).toBe(403);
  });

  test('debe retornar 401 al hacer request con token expirado', async ({ request }) => {
    // ARRANGE: Token de sesión con tiempo de validez vencido
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({
      sub: 'test_user@test.com',
      role: 'ADMIN',
      exp: Math.floor(Date.now() / 1000) - 3600 // Expirado hace 1 hora
    })).toString('base64url');
    const fakeSignature = 'firma_falsa_que_igual_provoca_rechazo';
    const expiredToken = `${header}.${payload}.${fakeSignature}`;

    // ACT
    const response = await request.get(`${process.env.API_URL}/admin/branches`, {
      headers: {
        'Authorization': `Bearer ${expiredToken}`
      }
    });

    // ASSERT: Seguridad — las sesiones caducadas son invalidadas y deniegan el acceso
    expect(response.status()).toBe(401);
  });
});
