import { APIRequestContext, expect } from '@playwright/test';

/**
 * Cliente API para preparar el estado de la aplicación antes de las pruebas E2E.
 * Se rige por el principio: "Nunca uses la UI para el setup de datos".
 */
export class ApiClient {
  private request: APIRequestContext;
  private token: string | null = null;
  private baseUrl: string = process.env.API_URL || 'http://localhost:8080/api';

  constructor(request: APIRequestContext) {
    this.request = request;
  }

  /**
   * Obtiene un JWT válido para realizar peticiones autenticadas.
   */
  async login(username: string, password: string):Promise<string> {
    const response = await this.request.post(`${this.baseUrl}/auth/login`, {
      data: { username, password }
    });
    
    expect(response.ok(), 'El login por API falló en el setup').toBeTruthy();
    
    const body = await response.json();
    this.token = body.token;
    return this.token!;
  }

  /**
   * Genera los headers incluyendo la autorización si existe el token.
   */
  private getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  /**
   * Ejemplo: Crea un producto para tests de venta.
   */
  async createProduct(productData: any) {
    const response = await this.request.post(`${this.baseUrl}/products`, {
      headers: this.getHeaders(),
      data: productData
    });
    expect(response.ok(), 'La creación del producto por API falló').toBeTruthy();
    return response.json();
  }

  /**
   * Método de limpieza genérica para ejecutar en el teardown.
   */
  async cleanupTestData(testId: string) {
  }
}
