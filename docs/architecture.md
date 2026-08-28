# Arquitectura — QA-Fortress

## 1. Rol dentro del ecosistema

QA-Fortress no es una aplicación con usuarios finales — es una **herramienta de ingeniería** cuyo "cliente" es el pipeline de CI/CD y el equipo de desarrollo. Su arquitectura se diseña para maximizar mantenibilidad y velocidad de feedback, no experiencia de usuario final.

```mermaid
C4Context
    title Contexto de QA-Fortress

    Person(sdet, "SDET / QA Engineer", "Escribe y mantiene los tests")
    System(qafortress, "QA-Fortress", "Framework de automatización E2E + API")
    System_Ext(stockpulse, "StockPulse", "Sistema bajo prueba (SUT)")
    System_Ext(ci, "GitHub Actions", "Ejecuta la suite en cada PR/push")

    Rel(sdet, qafortress, "Escribe tests, revisa reportes")
    Rel(qafortress, stockpulse, "Ejecuta pruebas contra", "HTTP/WebSocket")
    Rel(ci, qafortress, "Dispara ejecución automática")
```

## 2. Capas del framework

```mermaid
C4Container
    title Contenedores de QA-Fortress

    Container(e2e, "Suite E2E", "Playwright + TypeScript", "Page Objects + Specs de UI")
    Container(api, "Suite API", "Postman/Newman + PyTest", "Contract testing y lógica de negocio vía API")
    Container(dbval, "Validaciones DB", "SQL + psycopg2/pg driver", "Aserciones cruzadas contra el estado real de la BD")
    ContainerDb(sut, "StockPulse (SUT)", "Spring Boot + Postgres", "Sistema bajo prueba")

    Rel(e2e, sut, "Interactúa vía navegador", "HTTP")
    Rel(api, sut, "Llama endpoints", "HTTP/JSON")
    Rel(dbval, sut, "Lee estado final", "SQL de solo lectura")
```

## 3. Pirámide de pruebas aplicada al proyecto

```mermaid
graph TD
    A["10% — Concurrencia / Escenarios críticos de negocio<br/>(Playwright multi-contexto)"]
    B["30% — E2E de flujos clave<br/>(Playwright + Page Object Model)"]
    C["60% — API / Contract Testing<br/>(Postman/Newman + PyTest)"]
    A --- B --- C
```

## 4. Flujo de ejecución en CI

```mermaid
sequenceDiagram
    participant Dev as Desarrollador
    participant GH as GitHub Actions
    participant QA as QA-Fortress
    participant SUT as StockPulse (ambiente de test)

    Dev->>GH: Push / Pull Request
    GH->>QA: Dispara job "api-contract"
    QA->>SUT: Ejecuta colección Postman/Newman
    GH->>QA: Dispara job "e2e-smoke" (en paralelo)
    QA->>SUT: Ejecuta specs @smoke con Playwright
    QA-->>GH: Publica reporte HTML como artefacto
    GH-->>Dev: ✅/❌ Estado del PR
```

## 5. Decisiones de arquitectura

| # | Decisión | Alternativa descartada | Justificación |
|---|---|---|---|
| ADR-01 | Page Object Model estricto | Selectores inline en cada spec | Un cambio de UI se corrige en un solo archivo, no en decenas de specs |
| ADR-02 | Setup de datos vía API, nunca vía UI | Crear datos de prueba navegando la UI | Tests más rápidos y no acoplados a bugs de UI ajenos al test que se está corriendo |
| ADR-03 | Doble suite API: Postman (contract) + PyTest (lógica) | Solo Postman o solo PyTest | Postman es más rápido para contract testing visual; PyTest permite lógica de aserción más compleja y reutilización de fixtures |
| ADR-04 | Aserciones cruzadas UI/API + DB | Confiar solo en lo que muestra la pantalla | La UI puede "mentir" (cachear, mostrar estado stale); la DB es la fuente de verdad |
| ADR-05 | Tags de ejecución (`@smoke`, `@regression`, `@concurrency`) | Un solo comando que corre todo siempre | Permite feedback rápido en cada push (smoke) y cobertura completa solo en PR a `main` |

## 6. Referencias cruzadas

- `docs/requirements-functional.md` — capacidades que el framework debe soportar
- `docs/requirements-non-functional.md` — tiempos de ejecución, flakiness, paralelización
- `docs/user-stories.md` — historias desde la perspectiva del SDET
- `docs/test-cases.md` — matriz de trazabilidad de casos de prueba