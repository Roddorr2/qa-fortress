# Matriz de Trazabilidad de Casos de Prueba — QA-Fortress

Cada caso referencia el requerimiento/historia de usuario de StockPulse que valida. Esto es lo que demuestra que no escribiste tests al azar, sino que cubriste el negocio de forma deliberada.

| ID | Módulo | Escenario | Tipo | Prioridad | Referencia (StockPulse) |
|---|---|---|---|---|---|
| TC-001 | Auth | Login con credenciales válidas emite JWT válido | API | Alta | FR-07 |
| TC-002 | Auth | Login con credenciales inválidas responde 401 | API | Alta | FR-07 |
| TC-003 | Auth | Token expirado es rechazado en endpoint protegido | API | Media | NFR-05 |
| TC-004 | Ventas | Venta con stock suficiente descuenta correctamente | E2E + DB | Alta | US-01 |
| TC-005 | Ventas | Venta con stock insuficiente es rechazada (422) | API | Alta | US-01 |
| TC-006 | Ventas | Venta concurrente sobre último stock: solo una gana | Concurrencia | Crítica | US-02 |
| TC-007 | Transferencias | Transferencia exitosa entre sucursales con stock suficiente | E2E + DB | Alta | US-04 |
| TC-008 | Transferencias | Transferencia rechazada por stock insuficiente en origen | API | Media | US-04 |
| TC-009 | Alertas | Alerta de bajo stock llega por WebSocket tras una venta | E2E | Alta | US-03 |
| TC-010 | Roles | Cajero no puede crear productos (403) | API | Alta | US-05 |
| TC-011 | Roles | Admin puede crear, editar y desactivar productos | API | Media | FR-01 |
| TC-012 | Reportes | Historial de ventas filtrado por fecha devuelve resultados correctos | API | Media | US-06 |
| TC-013 | Productos | Búsqueda paginada de productos respeta filtros combinados | API | Baja | FR-10 |

**Convención de tags:** TC-001 a TC-003 y TC-010 → `@smoke` (flujo crítico de auth/roles). El resto de Ventas/Transferencias/Alertas → `@regression`. TC-006 → `@concurrency` (se ejecuta por separado, no en cada push, por su costo).