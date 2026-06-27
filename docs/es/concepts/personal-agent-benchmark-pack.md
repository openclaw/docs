---
read_when:
    - Ejecución de comprobaciones locales de fiabilidad del agente personal
    - Ampliar el catálogo de escenarios de QA respaldado por el repositorio
    - Verificación de recordatorios, respuestas, memoria, redacción, seguimiento seguro de herramientas, estado de tareas, diagnósticos seguros para compartir, afirmaciones de finalización respaldadas por pruebas y recuperación ante fallos
summary: Escenarios locales de qa-channel para comprobaciones de flujos de trabajo de asistentes personales que preservan la privacidad.
title: Paquete de pruebas comparativas de agente personal
x-i18n:
    generated_at: "2026-06-27T11:18:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a5a6b653abbba0718a6287d4e471435f15ef5823aa62abd238a14d955fdc1e5a
    source_path: concepts/personal-agent-benchmark-pack.md
    workflow: 16
---

El paquete de referencia de agente personal es un pequeño paquete de escenarios de QA respaldado por repositorio para
flujos de trabajo de asistente personal local. No es una referencia genérica de modelos y
no requiere un runner nuevo. El paquete reutiliza la pila privada de QA descrita en
[descripción general de QA](/es/concepts/qa-e2e-automation), el
[canal de QA](/es/channels/qa-channel) sintético y el catálogo YAML
`qa/scenarios` existente.

El primer paquete es intencionalmente limitado:

- recordatorios personales falsos mediante entrega de cron local
- enrutamiento falso de DM y respuestas de hilos mediante `qa-channel`
- recuperación falsa de preferencias desde los archivos de memoria temporales del espacio de trabajo de QA
- comprobaciones falsas de no eco de secretos
- seguimiento seguro de herramientas respaldado por lectura después de un breve turno de estilo aprobación
- comportamiento de detención ante denegación de aprobación para una solicitud sensible de lectura local
- informes de estado de tareas respaldados por pruebas que mantienen separados pendiente, bloqueado y hecho
- artefactos de diagnóstico seguros para compartir que mantienen estado útil mientras omiten contenido personal sin procesar
- afirmaciones de finalización respaldadas por pruebas que evitan el progreso falso antes de que exista evidencia local
- recuperación de fallos que informa el estado parcial y mantiene claros los límites de reintento

## Escenarios

Los metadatos legibles por máquina del paquete viven en
`extensions/qa-lab/src/scenario-packs.ts`. Ejecuta el paquete con
`--pack personal-agent`:

```bash
OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa suite \
  --provider-mode mock-openai \
  --pack personal-agent \
  --concurrency 1
```

`--pack` es aditivo con banderas `--scenario` repetidas. Los escenarios explícitos se ejecutan
primero; luego, los escenarios del paquete se ejecutan en el orden de `QA_PERSONAL_AGENT_SCENARIO_IDS` con
los duplicados eliminados.

El paquete está diseñado para `qa-channel` con `mock-openai` u otro carril local de proveedor de QA.
No debe apuntarse a servicios de chat en vivo ni a cuentas personales reales.

## Modelo De Privacidad

Los escenarios usan solo usuarios falsos, preferencias falsas, secretos falsos y el
espacio de trabajo temporal de QA Gateway creado por la suite. No deben leer ni escribir
memoria, sesiones, credenciales, agentes de inicio, configuraciones globales
ni estado de Gateway en vivo de usuarios reales de OpenClaw.

Los artefactos permanecen bajo el directorio existente de artefactos de la suite de QA y deben
tratarse como salida de pruebas. Las comprobaciones de censura usan marcadores falsos, por lo que los fallos son seguros
de inspeccionar y registrar en incidencias.

## Ampliación Del Paquete

Agrega nuevos casos `.yaml` bajo `qa/scenarios/personal/`; luego, agrega el identificador del escenario
a `QA_PERSONAL_AGENT_SCENARIO_IDS`. Mantén cada caso pequeño, local, determinista
en `mock-openai` y enfocado en un comportamiento de asistente personal.

Buenos candidatos de seguimiento:

- comprobaciones de exportación de trayectoria censurada
- comprobaciones de flujo de trabajo de plugin solo local

Evita agregar un runner, plugin, dependencia, transporte en vivo o juez de modelo
nuevo hasta que el catálogo de escenarios tenga suficientes casos estables para justificar esa superficie.
