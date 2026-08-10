# Historias de Usuario — QA-Fortress

Aquí el "usuario" es el equipo de ingeniería (SDET, desarrolladores, CI). Formato Given/When/Then igual que en StockPulse, para mantener consistencia entre proyectos.

---

### US-01 — Feedback rápido en cada push
**Como** desarrollador, **quiero** que la suite de smoke corra automáticamente en cada push, **para** enterarme en minutos si rompí algo crítico.
**Prioridad:** Must · **Estimación:** 5

```gherkin
Escenario: Push dispara smoke tests
  Dado que un desarrollador hace push a una rama feature
  Cuando el pipeline de CI se ejecuta
  Entonces la suite @smoke corre en menos de 2 minutos
  Y el resultado queda visible en el Pull Request
```

---

### US-02 — Validar que no hay sobreventa bajo concurrencia real
**Como** SDET, **quiero** un test automatizado que simule dos compras simultáneas del último stock, **para** tener evidencia objetiva de que StockPulse protege esa regla de negocio en cada release.
**Prioridad:** Must · **Estimación:** 8

```gherkin
Escenario: Test de concurrencia con dos contextos de navegador
  Dado que el producto "Teclado Mecánico" tiene 1 unidad en Sucursal 1
  Cuando dos contextos de Playwright intentan comprarlo simultáneamente
  Entonces solo una transacción se confirma en UI
  Y una consulta directa a la base de datos confirma stock final = 0
```

---

### US-03 — Contract testing de la API
**Como** SDET, **quiero** validar que cada endpoint respeta su contrato (status code + forma del JSON), **para** detectar breaking changes antes de que lleguen a producción.
**Prioridad:** Must · **Estimación:** 5

```gherkin
Escenario: Endpoint de ventas respeta su contrato
  Dado que la colección de Postman contiene el request "Crear Venta"
  Cuando se ejecuta contra el ambiente de test
  Entonces el status code es 201
  Y el cuerpo de la respuesta cumple el JSON Schema definido
```

---

### US-04 — Setup de datos sin depender de la UI
**Como** SDET, **quiero** crear el estado inicial de cada test (usuarios, productos, stock) vía API, **para** que mis tests sean rápidos y no dependan de bugs de UI ajenos al escenario que pruebo.
**Prioridad:** Must · **Estimación:** 3

---

### US-05 — Reporte navegable de cada ejecución
**Como** SDET, **quiero** un reporte HTML con capturas de pantalla de cada fallo, **para** debuggear sin tener que reproducir el test localmente.
**Prioridad:** Should · **Estimación:** 3

---

### US-06 — Trazabilidad de casos de prueba
**Como** líder técnico, **quiero** que cada test esté mapeado a un ID documentado, **para** saber exactamente qué reglas de negocio están cubiertas y cuáles no.
**Prioridad:** Should · **Estimación:** 2