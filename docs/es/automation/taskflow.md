---
read_when:
    - Quieres entender cómo se relaciona Task Flow con las tareas en segundo plano.
    - Encuentras TaskFlow o el flujo de tareas de OpenClaw en las notas de la versión o en la documentación
    - Quieres inspeccionar o gestionar el estado persistente del flujo
summary: Capa de orquestación de TaskFlow sobre las tareas en segundo plano
title: Flujo de tareas
x-i18n:
    generated_at: "2026-07-11T22:53:48Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5ccc6acf58b4b44c2989e3061bff08dabce8ef385706102360c756a1286ddd1b
    source_path: automation/taskflow.md
    workflow: 16
---

Task Flow es la capa de orquestación situada sobre las [tareas en segundo plano](/es/automation/tasks). Un flujo es un registro duradero de trabajo de varios pasos, con su propio estado, estado JSON, contador de revisiones y registros de tareas vinculados. Los flujos sobreviven a los reinicios del Gateway; las tareas individuales siguen siendo la unidad de trabajo desacoplado.

## Cuándo usar Task Flow

| Escenario                                           | Uso                                            |
| --------------------------------------------------- | ---------------------------------------------- |
| Una sola tarea en segundo plano                     | Tarea simple                                   |
| Proceso de varios pasos controlado por código Plugin | Task Flow (administrado)                       |
| Inicio desacoplado de ACP o de un subagente         | Task Flow (reflejado, creado automáticamente)  |
| Recordatorio de una sola ejecución                  | Tarea de Cron                                  |

## Modos de sincronización

### Modo administrado

Un flujo administrado tiene un controlador: código Plugin que crea el flujo mediante la API de Task Flow del entorno de ejecución de plugins, con un objetivo y un identificador de controlador obligatorio, y luego lo controla explícitamente.

- Cada paso se ejecuta como una tarea en segundo plano creada dentro del flujo; la clave de propietario y el origen del solicitante del flujo se transfieren a las tareas secundarias.
- El controlador hace avanzar el flujo entre `running`, `waiting` y los estados terminales, y almacena un estado JSON arbitrario de los pasos en el registro del flujo.
- Cada modificación incluye la revisión esperada del flujo. Una escritura obsoleta se rechaza como conflicto de revisión en lugar de sobrescribir un estado más reciente.
- Una vez solicitada la cancelación, se rechazan nuevas tareas secundarias y el flujo finaliza como `cancelled` cuando no queda ninguna tarea secundaria activa.

Ejemplo: un flujo de informe semanal que (1) recopila datos, (2) genera el informe y (3) lo entrega, con una tarea en segundo plano por paso:

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### Modo reflejado

OpenClaw crea automáticamente un flujo reflejado de una sola tarea cuando se inicia una ejecución desacoplada de ACP o de un subagente (tareas vinculadas a una sesión con finalización entregable). El registro del flujo refleja su única tarea subyacente —estado, objetivo y tiempos—, de modo que los inicios desacoplados obtienen un identificador de flujo estable para las interfaces de estado y reintento sin necesidad de un controlador. Los flujos reflejados muestran el modo de sincronización `task_mirrored` en la CLI.

## Estados de los flujos

| Estado      | Significado                                                                                  |
| ----------- | -------------------------------------------------------------------------------------------- |
| `queued`    | Creado, aún sin progreso                                                                     |
| `running`   | El flujo está avanzando activamente                                                          |
| `waiting`   | El flujo administrado está detenido según los metadatos de espera (temporizador, evento externo) |
| `blocked`   | Un paso terminó sin un resultado utilizable; `blockedTaskId` o el resumen indican cuál       |
| `succeeded` | Completado correctamente                                                                     |
| `failed`    | Completado con un error                                                                       |
| `cancelled` | Cancelación solicitada y todas las tareas secundarias finalizadas                            |
| `lost`      | El flujo perdió su estado subyacente autoritativo                                             |

## Estado duradero y seguimiento de revisiones

Los registros de flujo se conservan en la base de datos de estado SQLite compartida (`~/.openclaw/state/openclaw.sqlite`, tabla `flow_runs`) junto con los registros de tareas, por lo que el progreso sobrevive a los reinicios del Gateway. Cada escritura incrementa la `revision` del flujo; los escritores simultáneos que proporcionan una revisión esperada obsoleta reciben un conflicto y deben volver a leer. El crecimiento del WAL está limitado mediante los puntos de control automáticos de SQLite y puntos de control pasivos periódicos, con puntos de control de truncado durante el apagado. El archivo auxiliar heredado `flows/registry.sqlite` de instalaciones anteriores se importa mediante `openclaw doctor`.

## Comportamiento de la cancelación

`openclaw tasks flow cancel` establece una intención de cancelación persistente en el flujo, cancela sus tareas secundarias activas y rechaza nuevas tareas secundarias administradas. Cuando ya no queda ninguna tarea secundaria activa, el flujo finaliza como `cancelled`, ya sea inmediatamente o mediante el proceso de mantenimiento si las tareas secundarias tardan más en finalizar. La intención se conserva, por lo que un flujo cancelado permanece cancelado aunque el Gateway se reinicie antes de que todas las tareas secundarias hayan terminado.

## Comandos de la CLI

```bash
# List active and recent flows
openclaw tasks flow list [--status <status>] [--json]

# Show details for a specific flow
openclaw tasks flow show <lookup> [--json]

# Cancel a running flow and its active tasks
openclaw tasks flow cancel <lookup>
```

| Comando                           | Descripción                                                                                      |
| --------------------------------- | ------------------------------------------------------------------------------------------------ |
| `openclaw tasks flow list`        | Flujos registrados con modo de sincronización, estado, revisión, controlador y recuentos de tareas |
| `openclaw tasks flow show <id>`   | Inspecciona un flujo por su identificador o clave de propietario, incluidas las tareas vinculadas |
| `openclaw tasks flow cancel <id>` | Cancela un flujo en ejecución y sus tareas activas                                                |

Los flujos también están incluidos en `openclaw tasks audit` (detección de flujos obsoletos o dañados) y `openclaw tasks maintenance` (finaliza cancelaciones atascadas y elimina los flujos terminales después de 7 días).

## Patrón fiable de flujo de trabajo programado

Para flujos de trabajo recurrentes, como informes de inteligencia de mercado, trate la programación, la orquestación y las comprobaciones de fiabilidad como capas independientes:

1. Use [Tareas programadas](/es/automation/cron-jobs) para controlar los tiempos.
2. Use una sesión de Cron persistente cuando el flujo de trabajo deba aprovechar el contexto anterior.
3. Use [Lobster](/es/tools/lobster) para pasos deterministas, controles de aprobación y tokens de reanudación.
4. Use Task Flow para realizar el seguimiento de la ejecución de varios pasos entre tareas secundarias, esperas, reintentos y reinicios del Gateway.

Ejemplo de estructura de Cron:

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

Use `--session session:<id>` en lugar de `isolated` cuando el flujo de trabajo recurrente necesite deliberadamente un historial, resúmenes de ejecuciones anteriores o contexto permanente. Use `isolated` cuando cada ejecución deba comenzar desde cero y todo el estado necesario esté especificado explícitamente en el flujo de trabajo.

Dentro del flujo de trabajo, coloque las comprobaciones de fiabilidad antes del paso de resumen del LLM:

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

Comprobaciones preliminares recomendadas:

- Disponibilidad del navegador y selección del perfil, por ejemplo, `openclaw` para el estado administrado o `user` cuando se requiera una sesión de Chrome con la sesión iniciada. Consulte [Navegador](/es/tools/browser).
- Credenciales de la API y cuota para cada fuente.
- Accesibilidad de red de los puntos de conexión necesarios.
- Herramientas necesarias habilitadas para el agente, como `lobster`, `browser` y `llm-task`.
- Destino de errores configurado para Cron, de modo que los fallos de las comprobaciones preliminares sean visibles. Consulte [Tareas programadas](/es/automation/cron-jobs#delivery-and-output).

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

Haga que el flujo de trabajo rechace o marque como obsoletos los elementos antes de resumirlos. El paso del LLM debe recibir únicamente JSON estructurado y se le debe pedir que conserve `sourceUrl`, `retrievedAt` y `asOf` en su salida. Use [Tarea de LLM](/es/tools/llm-task) cuando necesite un paso de modelo validado mediante un esquema dentro del flujo de trabajo.

Para flujos de trabajo reutilizables por equipos o comunidades, empaquete la CLI, los archivos `.lobster` y las notas de configuración como una Skill o un plugin y publíquelo mediante [ClawHub](/clawhub). Mantenga las medidas de protección específicas del flujo de trabajo en ese paquete, salvo que a la API del plugin le falte alguna capacidad genérica necesaria.

## Relación entre los flujos y las tareas

Los flujos coordinan tareas, no las sustituyen. Un solo flujo puede controlar varias tareas en segundo plano a lo largo de su ciclo de vida. Use `openclaw tasks` para inspeccionar registros de tareas individuales y `openclaw tasks flow` para inspeccionar el flujo que las orquesta.

## Contenido relacionado

- [Tareas en segundo plano](/es/automation/tasks) - el registro de trabajo desacoplado que coordinan los flujos
- [CLI: tareas](/es/cli/tasks) - referencia de comandos de la CLI para `openclaw tasks flow`
- [Descripción general de la automatización](/es/automation) - todos los mecanismos de automatización de un vistazo
- [Tareas de Cron](/es/automation/cron-jobs) - tareas programadas que pueden alimentar los flujos
