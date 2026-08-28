import { APIRequestContext, expect } from "@playwright/test";

/**
 * Cliente API para preparar el estado de la aplicación antes de las pruebas E2E.
 * Se rige por el principio: "Nunca uses la UI para el setup de datos".
 */
export class ApiClient {
  private request: APIRequestContext;
  private accessToken: string | null = null;
  private baseUrl: string = process.env.API_URL as string;

  constructor(request: APIRequestContext) {
    this.request = request;
  }

  /**
   * Obtiene un JWT válido para realizar peticiones autenticadas.
   */
  async login(username: string, password: string): Promise<string> {
    const response = await this.request.post(`${this.baseUrl}/auth/login`, {
      data: { email: username, password },
    });

    expect(response.ok(), "El login por API falló en el setup").toBeTruthy();

    const body = await response.json();
    this.accessToken = body.accessToken;
    return this.accessToken!;
  }

  /**
   * Genera los headers incluyendo la autorización si existe el accessToken.
   */
  private getHeaders() {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (this.accessToken) {
      headers["Authorization"] = `Bearer ${this.accessToken}`;
    }
    return headers;
  }

  /**
   * Crea un usuario de prueba dinámico.
   */
  async createUser(username: string, role: string = "admin") {
    const response = await this.request.post(`${this.baseUrl}/users`, {
      headers: this.getHeaders(),
      data: { email: username, password: "password123", role },
    });
    if (!response.ok()) {
      console.error("API Error al crear usuario:", await response.text());
    }
    expect(response.ok(), "Fallo al crear usuario de prueba").toBeTruthy();
    return response.json();
  }

  /**
   * Crea una sucursal de prueba.
   */
  async createBranch(
    nombre: string,
    direccion: string = "Dirección de prueba",
  ) {
    const response = await this.request.post(
      `${this.baseUrl}/admin/branches`,
      {
        headers: this.getHeaders(),
        data: { nombre, direccion },
      },
    );
    if (!response.ok()) {
      console.error("API Error al crear sucursal:", await response.text());
    }
    expect(response.ok(), "Fallo al crear sucursal").toBeTruthy();
    const data = await response.json();
    return data.id;
  }

  /**
   * Crea un producto.
   */
  async createProduct(productData: any) {
    const response = await this.request.post(
      `${this.baseUrl}/admin/products`,
      {
        headers: this.getHeaders(),
        data: productData,
      },
    );
    if (!response.ok()) {
      console.error("API Error al crear producto:", await response.text());
    }
    expect(
      response.ok(),
      "La creación del producto por API falló",
    ).toBeTruthy();
    const data = await response.json();
    return data.id;
  }

  /**
   * Añade stock inicial a un producto en una sucursal.
   */
  async addStock(productId: string, branchId: string, quantity: number) {
    const response = await this.request.post(
      `${this.baseUrl}/stock/transfer`,
      {
        headers: this.getHeaders(),
        // Usamos las llaves exactas que exige tu backend
        data: { 
          productoId: productId, 
          sucursalOrigenId: "123e4567-e89b-12d3-a456-426614174000",
          sucursalDestinoId: branchId, 
          cantidad: quantity,
          usuarioId: "123e4567-e89b-12d3-a456-426614174000"
        },
      },
    );
    if (!response.ok()) {
      console.error("API Error al añadir stock:", await response.text());
    }
    expect(response.ok(), "Fallo al añadir stock inicial").toBeTruthy();
  }

  /**
   * Método de limpieza para ejecutar en el teardown.
   */
  async cleanupTestData(testUserId: string) {
    if (testUserId) {
      await this.request.delete(`${this.baseUrl}/users/${testUserId}`, {
        headers: this.getHeaders(),
      });
    }
  }
}
