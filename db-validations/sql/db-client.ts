import { Client, QueryResult } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

/**
 * Cliente de base de datos para aserciones de Nivel 2.
 * Valida la fuente de verdad del negocio directamente en PostgreSQL
 * sin depender de la capa visual ni de endpoints intermedios.
 */
export class DbHelper {
  private client: Client;
  private connected = false;

  constructor() {
    this.client = new Client({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });
  }

  /**
   * Ejecuta consultas parametrizadas garantizando la reutilización de conexión.
   */
  async query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    if (!this.connected) {
      await this.client.connect();
      this.connected = true;
    }
    return this.client.query<T>(text, params);
  }

  /**
   * Libera la conexión con el servidor para evitar fugas de recursos en suites extensas.
   */
  async close(): Promise<void> {
    if (this.connected) {
      await this.client.end();
      this.connected = false;
    }
  }

  /**
   * Valida la disponibilidad de la base de datos de test antes de iniciar la suite (Smoke de infraestructura).
   */
  async ping(): Promise<boolean> {
    try {
      await this.query('SELECT 1');
      return true;
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED')) {
        throw new Error(
          `\n[ERROR CRÍTICO] No se pudo conectar a la base de datos PostgreSQL en ${process.env.DB_HOST}:${process.env.DB_PORT || 5432}.\n` +
          `Verifica que el contenedor de Docker de PostgreSQL o el servicio de base de datos esté encendido.\n`
        );
      }
      throw error;
    }
  }

  /**
   * Recupera el catálogo de roles definidos por las migraciones de la aplicación.
   */
  async getRoleNames(): Promise<string[]> {
    const result = await this.query<{ nombre: string }>('SELECT nombre FROM roles');
    return result.rows.map((row) => row.nombre);
  }

  /**
   * Garantiza la integridad del esquema de seguridad (FR-07): los roles deben
   * haber sido creados por las migraciones del sistema, nunca por los tests.
   */
  async verifyRequiredRoles(requiredRoles: string[]): Promise<void> {
    const existingRoles = await this.getRoleNames();
    const missingRoles = requiredRoles.filter((role) => !existingRoles.includes(role));

    if (missingRoles.length > 0) {
      throw new Error(
        `\n[ERROR CRÍTICO] Faltan roles obligatorios en la tabla 'roles' de la base de datos.\n` +
        `Roles faltantes: ${missingRoles.join(', ')}\n\n` +
        `SOLUCIÓN: La base de datos de test no tiene las migraciones de Flyway aplicadas correctamente.\n` +
        `QA-Fortress NO debe crear roles manuales. Asegúrate de que StockPulse haya aplicado ` +
        `su esquema inicial (ej. V2__insert_roles.sql) contra la base de datos de test antes de correr E2E.\n`
      );
    }
  }

  /**
   * Consulta el stock disponible de un producto en una sucursal específica (RN-01, RN-02).
   */
  async getStockForProduct(productId: string, branchId: string): Promise<number> {
    const result = await this.query(
      'SELECT cantidad FROM stocks WHERE producto_id = $1 AND sucursal_id = $2',
      [productId, branchId]
    );
    if (result.rows.length === 0) return 0;
    return result.rows[0].cantidad;
  }
}
