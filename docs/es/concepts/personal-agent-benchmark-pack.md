---
read_when:
    - Ejecutar comprobaciones de fiabilidad del agente personal local
    - Ampliar el catálogo de escenarios de QA respaldado por el repositorio
    - Verificación de recordatorios, respuestas, memoria, redacción, seguimiento seguro de herramientas, estado de tareas, diagnósticos seguros para compartir, afirmaciones de finalización respaldadas por pruebas y recuperación ante fallos
summary: Escenarios locales de qa-channel para comprobaciones de flujos de trabajo de asistentes personales que preservan la privacidad.
title: Paquete de evaluación comparativa para agentes personales
x-i18n:
    generated_at: "2026-07-05T11:13:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 35da45e4b22b1044a777fa8d6bce87f9ace377950dd0af3f2419b40cfe4d9be6
    source_path: concepts/personal-agent-benchmark-pack.md
    workflow: 16
---

El Paquete de pruebas de referencia de agente personal es un pequeño paquete de escenarios de QA respaldado por repositorio para
flujos de trabajo de asistente personal local. No es una prueba de referencia genérica de modelos y
no necesita un runner nuevo: reutiliza la pila privada de QA ([descripción general de QA](/es/concepts/qa-e2e-automation)),
el [canal de QA](/es/channels/qa-channel) sintético y el catálogo YAML existente de
`qa/scenarios`.

## Escenarios

Diez escenarios, definidos en `qa/scenarios/personal/*.yaml`:

| Id. de escenario                           | Comprobaciones                                                                               |
| ------------------------------------------ | -------------------------------------------------------------------------------------------- |
| `personal-reminder-roundtrip`              | Recordatorios personales falsos mediante entrega de cron local                               |
| `personal-channel-thread-reply`            | Enrutamiento de DM y respuesta de hilo falsos mediante `qa-channel`                          |
| `personal-memory-preference-recall`        | Recuperación de preferencias falsas desde los archivos de memoria temporales del workspace de QA |
| `personal-redaction-no-secret-leak`        | Comprobaciones falsas de no eco de secretos                                                  |
| `personal-tool-safety-followthrough`       | Seguimiento de herramienta segura respaldada por lectura después de un turno breve de estilo aprobación |
| `personal-approval-denial-stop`            | Comportamiento de detención por denegación de aprobación para una solicitud sensible de lectura local |
| `personal-task-followthrough-status`       | Informes de estado de tareas respaldados por pruebas que mantienen pendientes, bloqueadas y finalizadas por separado |
| `personal-share-safe-diagnostics-artifact` | Artefactos de diagnóstico seguros para compartir que conservan el estado útil mientras omiten contenido personal sin procesar |
| `personal-no-fake-progress`                | Afirmaciones de finalización respaldadas por pruebas que evitan progreso falso antes de que exista evidencia local |
| `personal-failure-recovery`                | Recuperación de fallos que informa el estado parcial y mantiene claros los límites de reintento |

Los metadatos legibles por máquina del paquete (lista de ids., título, descripción) residen en
`extensions/qa-lab/src/scenario-packs.ts` como `QA_PERSONAL_AGENT_SCENARIO_IDS`.
Ejecuta el paquete con `--pack personal-agent`:

```bash
OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa suite \
  --provider-mode mock-openai \
  --pack personal-agent \
  --concurrency 1
```

`--pack` es aditivo con marcas `--scenario` repetidas. Los escenarios explícitos se ejecutan
primero; después, los escenarios del paquete se ejecutan en el orden de `QA_PERSONAL_AGENT_SCENARIO_IDS`
con los duplicados eliminados.

El paquete apunta a `qa-channel` con `mock-openai` u otro carril de proveedor de QA local.
No lo apuntes a servicios de chat en vivo ni a cuentas personales reales.

## Modelo de privacidad

Los escenarios usan solo usuarios falsos, preferencias falsas, secretos falsos y el
workspace temporal del Gateway de QA creado por la suite. No deben leer ni
escribir memoria, sesiones, credenciales, agentes de inicio, configuraciones globales
ni estado de Gateway en vivo de usuarios reales de OpenClaw.

Los artefactos permanecen bajo el directorio de artefactos existente de la suite de QA y se tratan
como salida de prueba. Las comprobaciones de redacción usan marcadores falsos, por lo que los fallos son seguros de
inspeccionar y registrar en issues.

## Extender el paquete

Agrega nuevos casos `.yaml` bajo `qa/scenarios/personal/` y luego agrega el id. de escenario
a `QA_PERSONAL_AGENT_SCENARIO_IDS`. Mantén cada caso pequeño, local, determinista
en `mock-openai` y centrado en un comportamiento de asistente personal.

Buenos candidatos de seguimiento: comprobaciones de exportación de trayectoria redactada, comprobaciones de flujos de trabajo
de Plugin solo locales.

Evita agregar un runner, Plugin, dependencia, transporte en vivo o evaluador de modelo nuevos
hasta que el catálogo de escenarios tenga suficientes casos estables para justificar esa superficie.
