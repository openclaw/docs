---
read_when:
    - Quieres entender cómo se relaciona Task Flow con las tareas en segundo plano
    - Encuentras TaskFlow u openclaw tasks flow en las notas de la versión o en la documentación
    - Quieres inspeccionar o gestionar el estado duradero del flujo
summary: Capa de orquestación de TaskFlow sobre las tareas en segundo plano
title: Flujo de tareas
x-i18n:
    generated_at: "2026-06-27T10:34:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e4f5ff3c9a68eb0408a180bc947a03b410568d7914cb1c1d7f31d6013e036096
    source_path: automation/taskflow.md
    workflow: 16
---

El flujo de tareas es el sustrato de orquestación de flujos que se sitúa por encima de las [tareas en segundo plano](/es/automation/tasks). Gestiona flujos duraderos de varios pasos con su propio estado, seguimiento de revisiones y semántica de sincronización, mientras que las tareas individuales siguen siendo la unidad de trabajo desacoplado.

## Cuándo usar el flujo de tareas

Usa el flujo de tareas cuando el trabajo abarque varios pasos secuenciales o ramificados y necesites seguimiento duradero del progreso entre reinicios del Gateway. Para operaciones individuales en segundo plano, una [tarea](/es/automation/tasks) simple es suficiente.

| Escenario                             | Uso                         |
| ------------------------------------- | --------------------------- |
| Trabajo individual en segundo plano   | Tarea simple                |
| Pipeline de varios pasos (A luego B luego C) | Flujo de tareas (gestionado) |
| Observar tareas creadas externamente  | Flujo de tareas (reflejado) |
| Recordatorio de una sola vez          | Trabajo Cron                |

## Patrón fiable de flujo de trabajo programado

Para flujos de trabajo recurrentes, como informes de inteligencia de mercado, trata la programación, la orquestación y las comprobaciones de fiabilidad como capas separadas:

1. Usa [Tareas programadas](/es/automation/cron-jobs) para la temporización.
2. Usa una sesión cron persistente cuando el flujo de trabajo deba basarse en contexto previo.
3. Usa [Lobster](/es/tools/lobster) para pasos deterministas, puertas de aprobación y tokens de reanudación.
4. Usa el flujo de tareas para seguir la ejecución de varios pasos entre tareas hijas, esperas, reintentos y reinicios del Gateway.

Forma de cron de ejemplo:

```bash
openclaw cron add \
  --name "Market intelligence brief" \
  --cron "0 7 * * 1-5" \
  --tz "America/New_York" \
  --session session:market-intel \
  --message "Run the market-intel Lobster workflow. Verify source freshness before summarizing." \
  --announce \
  --channel slack \
  --to "channel:C1234567890"
```

Usa `session:<id>` en lugar de `isolated` cuando el flujo de trabajo recurrente necesite historial deliberado, resúmenes de ejecuciones anteriores o contexto permanente. Usa `isolated` cuando cada ejecución deba empezar desde cero y todo el estado requerido esté explícito en el flujo de trabajo.

Dentro del flujo de trabajo, coloca las comprobaciones de fiabilidad antes del paso de resumen del LLM:

```yaml
name: market-intel-brief
steps:
  - id: preflight
    command: market-intel check --json
  - id: collect
    command: market-intel collect --json
    stdin: $preflight.json
  - id: summarize
    command: market-intel summarize --json
    stdin: $collect.json
  - id: approve
    command: market-intel deliver --preview
    stdin: $summarize.json
    approval: required
  - id: deliver
    command: market-intel deliver --execute
    stdin: $summarize.json
    condition: $approve.approved
```

Comprobaciones previas recomendadas:

- Disponibilidad del navegador y elección de perfil, por ejemplo `openclaw` para estado gestionado o `user` cuando se requiere una sesión de Chrome con sesión iniciada. Consulta [Navegador](/es/tools/browser).
- Credenciales de API y cuota para cada fuente.
- Alcanzabilidad de red para los endpoints requeridos.
- Herramientas requeridas habilitadas para el agente, como `lobster`, `browser` y `llm-task`.
- Destino de error configurado para cron para que los fallos de comprobación previa sean visibles. Consulta [Tareas programadas](/es/automation/cron-jobs#delivery-and-output).

Campos de procedencia de datos recomendados para cada elemento recopilado:

```json
{
  "sourceUrl": "https://example.com/report",
  "retrievedAt": "2026-04-24T12:00:00Z",
  "asOf": "2026-04-24",
  "title": "Example report",
  "content": "..."
}
```

Haz que el flujo de trabajo rechace o marque como obsoletos los elementos antes del resumen. El paso de LLM debe recibir solo JSON estructurado y debe pedírsele que preserve `sourceUrl`, `retrievedAt` y `asOf` en su salida. Usa [Tarea LLM](/es/tools/llm-task) cuando necesites un paso de modelo validado por esquema dentro del flujo de trabajo.

Para flujos de trabajo reutilizables de equipo o comunidad, empaqueta la CLI, los archivos `.lobster` y cualquier nota de configuración como una skill o plugin y publícalo mediante [ClawHub](/es/clawhub). Mantén las barreras de protección específicas del flujo de trabajo en ese paquete, salvo que a la API del plugin le falte una capacidad genérica necesaria.

## Modos de sincronización

### Modo gestionado

El flujo de tareas es propietario del ciclo de vida de principio a fin. Crea tareas como pasos del flujo, las lleva hasta su finalización y avanza el estado del flujo automáticamente.

Ejemplo: un flujo de informe semanal que (1) recopila datos, (2) genera el informe y (3) lo entrega. El flujo de tareas crea cada paso como una tarea en segundo plano, espera a que termine y luego pasa al siguiente paso.

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### Modo reflejado

El flujo de tareas observa tareas creadas externamente y mantiene sincronizado el estado del flujo sin asumir la propiedad de la creación de tareas. Esto resulta útil cuando las tareas se originan en trabajos cron, comandos de CLI u otras fuentes y quieres una vista unificada de su progreso como flujo.

Ejemplo: tres trabajos cron independientes que juntos forman una rutina de "operaciones matutinas". Un flujo reflejado sigue su progreso colectivo sin controlar cuándo ni cómo se ejecutan.

## Estado duradero y seguimiento de revisiones

Cada flujo conserva su propio estado y sigue revisiones para que el progreso sobreviva a los reinicios del Gateway. El seguimiento de revisiones permite detectar conflictos cuando varias fuentes intentan avanzar el mismo flujo de forma concurrente.
El registro de flujos usa SQLite con mantenimiento acotado del registro de escritura anticipada, incluidos puntos de control
periódicos y al apagarse, para que los Gateways de larga ejecución no conserven
archivos auxiliares `registry.sqlite-wal` sin límite.

## Comportamiento de cancelación

`openclaw tasks flow cancel` establece una intención de cancelación persistente en el flujo. Las tareas activas dentro del flujo se cancelan y no se inician pasos nuevos. La intención de cancelación persiste entre reinicios, de modo que un flujo cancelado permanece cancelado aunque el Gateway se reinicie antes de que todas las tareas hijas hayan terminado.

## Comandos de CLI

```bash
# List active and recent flows
openclaw tasks flow list

# Show details for a specific flow
openclaw tasks flow show <lookup>

# Cancel a running flow and its active tasks
openclaw tasks flow cancel <lookup>
```

| Comando                           | Descripción                                      |
| --------------------------------- | ------------------------------------------------ |
| `openclaw tasks flow list`        | Muestra los flujos seguidos con estado y modo de sincronización |
| `openclaw tasks flow show <id>`   | Inspecciona un flujo por id de flujo o clave de búsqueda |
| `openclaw tasks flow cancel <id>` | Cancela un flujo en ejecución y sus tareas activas |

## Cómo se relacionan los flujos con las tareas

Los flujos coordinan tareas, no las reemplazan. Un solo flujo puede controlar varias tareas en segundo plano a lo largo de su vida. Usa `openclaw tasks` para inspeccionar registros de tareas individuales y `openclaw tasks flow` para inspeccionar el flujo orquestador.

## Relacionado

- [Tareas en segundo plano](/es/automation/tasks) — el libro mayor de trabajo desacoplado que coordinan los flujos
- [CLI: tareas](/es/cli/tasks) — referencia de comandos de CLI para `openclaw tasks flow`
- [Resumen de automatización](/es/automation) — todos los mecanismos de automatización de un vistazo
- [Trabajos Cron](/es/automation/cron-jobs) — trabajos programados que pueden alimentar flujos
