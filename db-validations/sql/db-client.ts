import { Client, QueryResult } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar variables de entorno desde .env
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

/**
 * Helper para ejecutar consultas SQL directas contra la base de datos.
 * Se utiliza para aserciones cruzadas que validan el estado real subyacente.
 */
export class DbHelper {
  private client: Client;

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
   * Conecta a la DB, ejecuta el query y cierra la conexión.
   */
  async query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    try {
      await this.client.connect();
      const res = await this.client.query<T>(text, params);
      return res;
    } finally {
      // Siempre asegurarse de cerrar la conexión
      await this.client.end();
      // Instanciar un nuevo cliente para la próxima query ya que end() destruye el socket
      this.client = new Client({
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '5432', 10),
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
      });
    }
  }

  /**
   * Ejemplo de método helper específico para StockPulse.
   */
  async getStockForProduct(productId: number, branchId: number): Promise<number> {
    const result = await this.query(
      'SELECT quantity FROM inventory WHERE product_id = $1 AND branch_id = $2',
      [productId, branchId]
    );
    if (result.rows.length === 0) return 0;
    return result.rows[0].quantity;
  }
}
