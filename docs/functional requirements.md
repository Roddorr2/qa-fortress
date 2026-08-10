# Requerimientos Funcionales — QA-Fortress

En un framework de automatización, los "requerimientos funcionales" son las **capacidades que el framework debe soportar**, no features de negocio.

| ID | Requerimiento | Prioridad |
|---|---|---|
| FR-01 | El framework debe permitir ejecutar únicamente la suite de smoke tests mediante un tag/filtro (`@smoke`) | Must |
| FR-02 | El framework debe permitir ejecutar la suite completa de regresión de forma independiente de la de smoke | Must |
| FR-03 | El framework debe encapsular todos los selectores de UI en clases Page Object, prohibiendo selectores sueltos en los specs | Must |
| FR-04 | El framework debe poder crear datos de prueba (usuarios, productos, stock) exclusivamente a través de la API, nunca navegando la UI | Must |
| FR-05 | El framework debe validar contratos de API (status code, forma del JSON) contra un JSON Schema definido por endpoint | Must |
| FR-06 | El framework debe poder ejecutar aserciones de validación directa contra la base de datos (SQL de solo lectura) | Must |
| FR-07 | El framework debe soportar simulación de solicitudes concurrentes desde múltiples contextos de navegador aislados | Must |
| FR-08 | El framework debe generar un reporte de ejecución navegable (HTML) con capturas de pantalla en caso de fallo | Should |
| FR-09 | El framework debe mapear cada test a un ID documentado en la matriz de trazabilidad (`test-cases.md`) | Should |
| FR-10 | El framework debe poder ejecutarse íntegramente dentro de un pipeline de CI sin intervención manual | Must |
| FR-11 | El framework debe realizar limpieza (teardown) automática de los datos creados durante cada test | Should |
| FR-12 | El framework debe soportar ejecución cross-browser (Chromium, Firefox, WebKit) para los specs E2E críticos | Could |
| FR-13 | El framework debe integrar Allure (o equivalente) para reportes históricos con tendencias de flakiness | Could |