import { DbHelper } from './db-client';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcryptjs';

export interface CreatedIds {
  stockIds: string[];
  userIds: string[];
  productIds: string[];
  branchIds: string[];
}

/**
 * Generador de datos y precondiciones de prueba (Test Data Seeding).
 * Garantiza el aislamiento total de datos registrando entidades efímeras
 * con trazabilidad para su eliminación atómica durante el teardown.
 */
export class TestSeeder {
  private created: CreatedIds = {
    stockIds: [],
    userIds: [],
    productIds: [],
    branchIds: []
  };

  constructor(private db: DbHelper) {}

  /**
   * Registra un producto en el catálogo con SKU dinámico para evitar colisiones entre tests.
   */
  async seedProduct(nombre: string, precio: number, stockMinimo: number = 0): Promise<string> {
    const id = randomUUID();
    const sku = `TEST-SKU-${Date.now()}`;
    try {
      await this.db.query(
        `INSERT INTO productos (id, sku, nombre, precio, stock_minimo, activo) 
         VALUES ($1, $2, $3, $4, $5, true)`,
        [id, sku, nombre, precio, stockMinimo]
      );
      this.created.productIds.push(id);
      return id;
    } catch (error: any) {
      throw new Error(`TestSeeder.seedProduct falló para ${nombre}: ${error.message}`);
    }
  }

  /**
   * Crea una sucursal operativa aislada para pruebas de inventario y transferencias.
   */
  async seedBranch(nombre: string): Promise<string> {
    const id = randomUUID();
    const direccion = `[TEST] Dirección automática para ${nombre}`;
    try {
      await this.db.query(
        `INSERT INTO sucursales (id, nombre, direccion) VALUES ($1, $2, $3)`,
        [id, nombre, direccion]
      );
      this.created.branchIds.push(id);
      return id;
    } catch (error: any) {
      throw new Error(`TestSeeder.seedBranch falló para ${nombre}: ${error.message}`);
    }
  }

  /**
   * Establece el stock inicial de un producto en una sucursal para fijar las precondiciones de prueba.
   */
  async seedStock(productId: string, branchId: string, cantidad: number): Promise<void> {
    const id = randomUUID();
    try {
      await this.db.query(
        `INSERT INTO stocks (id, producto_id, sucursal_id, cantidad, version) VALUES ($1, $2, $3, $4, 0)`,
        [id, productId, branchId, cantidad]
      );
      this.created.stockIds.push(id);
    } catch (error: any) {
      throw new Error(`TestSeeder.seedStock falló para producto ${productId}: ${error.message}`);
    }
  }

  /**
   * Crea un usuario autenticable asociándolo a un rol existente del sistema (FR-07).
   */
  async seedUser(email: string, roleName: string, password: string = 'password123'): Promise<string> {
    try {
      // Principio de seguridad: los roles son inmutables y provistos por el sistema base
      const roleResult = await this.db.query(`SELECT id FROM roles WHERE nombre = $1`, [roleName]);
      if (roleResult.rows.length === 0) {
        throw new Error(`Rol '${roleName}' no encontrado en la base de datos.`);
      }
      const roleId = roleResult.rows[0].id;

      const passwordHash = await bcrypt.hash(password, 10);
      const id = randomUUID();
      const nombre = `[TEST] Usuario ${roleName}`;
      await this.db.query(
        `INSERT INTO usuarios (id, email, password_hash, nombre, rol_id) VALUES ($1, $2, $3, $4, $5)`,
        [id, email, passwordHash, nombre, roleId]
      );
      this.created.userIds.push(id);
      return id;
    } catch (error: any) {
      throw new Error(`TestSeeder.seedUser falló para ${email}: ${error.message}`);
    }
  }

  /**
   * Teardown atómico: eliminación en orden inverso de dependencias para preservar la integridad referencial.
   */
  async cleanup(): Promise<void> {
    try {
      // 0. Transferencias registradas durante el test
      if (this.created.productIds.length > 0 || this.created.branchIds.length > 0) {
        await this.db.query(
          `DELETE FROM transferencias_stock WHERE producto_id = ANY($1) OR sucursal_origen_id = ANY($2) OR sucursal_destino_id = ANY($2)`,
          [this.created.productIds, this.created.branchIds]
        );
      }

      // 1. Inventario por sucursal
      if (this.created.stockIds.length > 0) {
        await this.db.query(`DELETE FROM stocks WHERE id = ANY($1)`, [this.created.stockIds]);
      }
      
      // 2. Líneas de detalle de ventas
      if (this.created.productIds.length > 0) {
        await this.db.query(`DELETE FROM detalle_ventas WHERE producto_id = ANY($1)`, [this.created.productIds]);
      }
      
      // 3. Cabeceras de ventas transaccionadas
      if (this.created.branchIds.length > 0) {
        await this.db.query(`DELETE FROM ventas WHERE sucursal_id = ANY($1)`, [this.created.branchIds]);
      }
      
      // 4. Usuarios de prueba
      if (this.created.userIds.length > 0) {
        await this.db.query(`DELETE FROM usuarios WHERE id = ANY($1)`, [this.created.userIds]);
      }
      
      // 5. Productos del catálogo
      if (this.created.productIds.length > 0) {
        await this.db.query(`DELETE FROM productos WHERE id = ANY($1)`, [this.created.productIds]);
      }
      
      // 6. Sucursales de prueba
      if (this.created.branchIds.length > 0) {
        await this.db.query(`DELETE FROM sucursales WHERE id = ANY($1)`, [this.created.branchIds]);
      }
      
      this.created = { stockIds: [], userIds: [], productIds: [], branchIds: [] };
    } catch (error: any) {
      console.error(`TestSeeder.cleanup falló: ${error.message}`);
    }
  }
}
