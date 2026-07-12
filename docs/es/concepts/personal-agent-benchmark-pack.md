---
read_when:
    - Ejecución de comprobaciones locales de fiabilidad del agente personal
    - Ampliación del catálogo de escenarios de control de calidad respaldado por el repositorio
    - Verificación de recordatorios, respuestas, memoria, censura, seguimiento seguro de herramientas, estado de tareas, diagnósticos seguros para compartir, afirmaciones de finalización respaldadas por pruebas y recuperación ante fallos
summary: Escenarios locales de qa-channel para comprobar flujos de trabajo de asistentes personales que preservan la privacidad.
title: Paquete de pruebas comparativas para agentes personales
x-i18n:
    generated_at: "2026-07-11T23:00:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 35da45e4b22b1044a777fa8d6bce87f9ace377950dd0af3f2419b40cfe4d9be6
    source_path: concepts/personal-agent-benchmark-pack.md
    workflow: 16
---

El paquete de pruebas de referencia del agente personal es un pequeño conjunto de escenarios de control de calidad respaldado por el repositorio para
flujos de trabajo locales de asistentes personales. No es una prueba de referencia genérica de modelos y
no necesita un ejecutor nuevo: reutiliza la infraestructura privada de control de calidad ([descripción general de control de calidad](/es/concepts/qa-e2e-automation)),
el [canal de control de calidad](/es/channels/qa-channel) sintético y el catálogo YAML existente
`qa/scenarios`.

## Escenarios

Diez escenarios, definidos en `qa/scenarios/personal/*.yaml`:

| Id. del escenario                          | Comprobaciones                                                                                                       |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `personal-reminder-roundtrip`              | Recordatorios personales ficticios mediante entrega local de Cron                                                    |
| `personal-channel-thread-reply`            | Enrutamiento de mensajes directos y respuestas en hilos ficticios mediante `qa-channel`                              |
| `personal-memory-preference-recall`        | Recuperación de preferencias ficticias desde los archivos de memoria del espacio de trabajo temporal de control de calidad |
| `personal-redaction-no-secret-leak`        | Comprobaciones ficticias de que no se repitan secretos                                                               |
| `personal-tool-safety-followthrough`       | Seguimiento seguro de herramientas respaldado por lectura después de un breve turno similar a una aprobación         |
| `personal-approval-denial-stop`            | Comportamiento de detención ante la denegación de aprobación de una solicitud confidencial de lectura local          |
| `personal-task-followthrough-status`       | Informe del estado de tareas respaldado por pruebas que mantiene separados los estados pendiente, bloqueado y completado |
| `personal-share-safe-diagnostics-artifact` | Artefactos de diagnóstico seguros para compartir que conservan información de estado útil y omiten el contenido personal sin procesar |
| `personal-no-fake-progress`                | Afirmaciones de finalización respaldadas por pruebas que evitan indicar avances falsos antes de que existan pruebas locales |
| `personal-failure-recovery`                | Recuperación ante fallos que informa del estado parcial y mantiene claros los límites de reintento                   |

Los metadatos legibles por máquina del paquete (lista de identificadores, título y descripción) se encuentran en
`extensions/qa-lab/src/scenario-packs.ts` como `QA_PERSONAL_AGENT_SCENARIO_IDS`.
Ejecute el paquete con `--pack personal-agent`:

```bash
OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa suite \
  --provider-mode mock-openai \
  --pack personal-agent \
  --concurrency 1
```

`--pack` es acumulativo con varias opciones `--scenario`. Los escenarios explícitos se ejecutan
primero y, después, los escenarios del paquete se ejecutan en el orden de `QA_PERSONAL_AGENT_SCENARIO_IDS`,
eliminando los duplicados.

El paquete está dirigido a `qa-channel` con `mock-openai` u otra vía local de proveedor de control de calidad.
No lo dirija a servicios de chat activos ni a cuentas personales reales.

## Modelo de privacidad

Los escenarios utilizan únicamente usuarios ficticios, preferencias ficticias, secretos ficticios y el
espacio de trabajo temporal del Gateway de control de calidad creado por el conjunto. No deben leer ni
escribir la memoria de usuarios reales de OpenClaw, sesiones, credenciales, agentes de inicio, configuraciones
globales ni el estado activo del Gateway.

Los artefactos permanecen en el directorio de artefactos existente del conjunto de control de calidad y se tratan
como resultados de pruebas. Las comprobaciones de censura utilizan marcadores ficticios, por lo que los fallos se pueden
inspeccionar y registrar en incidencias de forma segura.

## Ampliación del paquete

Añada nuevos casos `.yaml` en `qa/scenarios/personal/` y, después, añada el identificador del escenario
a `QA_PERSONAL_AGENT_SCENARIO_IDS`. Mantenga cada caso pequeño, local, determinista
en `mock-openai` y centrado en un comportamiento del asistente personal.

Buenos candidatos para futuras ampliaciones: comprobaciones de exportación de trayectorias censuradas y comprobaciones de
flujos de trabajo de plugins exclusivamente locales.

Evite añadir un ejecutor, plugin, dependencia, transporte activo o evaluador de modelos nuevo
hasta que el catálogo de escenarios tenga suficientes casos estables para justificar esa superficie.
