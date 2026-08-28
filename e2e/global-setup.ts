import { DbHelper } from '../db-validations/sql/db-client';

async function globalSetup() {
  console.log('--- Iniciando Global Setup de QA-Fortress ---');
  
  const db = new DbHelper();
  try {
    // 1. Verificar conectividad básica con la BD
    await db.ping();
    console.log('✓ Conexión a la base de datos de test exitosa.');

    // 2. Verificar que los roles base requeridos existan por Flyway
    await db.verifyRequiredRoles(['ADMIN', 'CAJERO', 'ENCARGADO_SUCURSAL']);
    console.log('✓ Entorno de test verificado. Roles base de datos intactos.');
  } finally {
    await db.close();
  }
}

export default globalSetup;
