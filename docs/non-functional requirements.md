# Requerimientos No Funcionales — QA-Fortress

| Categoría | ID | Requerimiento | Métrica objetivo | Cómo se verifica |
|---|---|---|---|---|
| Performance | NFR-01 | La suite de smoke debe dar feedback rápido en cada push | Duración total < 2 minutos | Medición del job de CI |
| Performance | NFR-02 | La suite de regresión completa debe completarse en un tiempo razonable para no bloquear merges | Duración total < 15 minutos con paralelización | Medición del job de CI |
| Confiabilidad | NFR-03 | Los tests no deben ser intermitentes ("flaky") | Tasa de flakiness < 2% medida en 20 ejecuciones consecutivas | Re-ejecución de la suite completa 20 veces sin cambios de código |
| Aislamiento | NFR-04 | Cada test debe poder ejecutarse solo o en paralelo sin afectar a otros | 0 fallos atribuibles a orden de ejecución | Ejecutar la suite en orden aleatorio y en paralelo |
| Mantenibilidad | NFR-05 | Un cambio de selector de UI debe requerir editar un único archivo | 100% de selectores viven en `pages/`, 0% en `specs/` | Revisión de código / lint rule |
| Cobertura | NFR-06 | Los flujos de negocio críticos (venta, transferencia, concurrencia) deben tener cobertura E2E | 100% de los flujos "Must" de StockPulse cubiertos | Checklist cruzado contra `user-stories.md` de StockPulse |
| Portabilidad | NFR-07 | La suite debe poder correr igual en la máquina local y en CI | 0 configuración manual adicional fuera de variables de entorno | Ejecución en ambas condiciones sin diffs de resultado |
| Observabilidad | NFR-08 | Todo fallo debe incluir evidencia suficiente para debug sin re-ejecutar | Captura de pantalla + trace de Playwright adjuntos en cada fallo | Revisión del reporte HTML generado |
| Escalabilidad | NFR-09 | La suite debe poder paralelizarse a medida que crece el número de tests | Ejecución en ≥ 4 workers sin fallos de contención de datos | Configuración de `workers` en `playwright.config.ts` |