---
read_when:
    - Quieres entender cómo se relaciona TaskFlow con las tareas en segundo plano
    - Encuentras TaskFlow o el flujo de tareas de OpenClaw en notas de versión o documentación
    - Quieres inspeccionar o gestionar el estado duradero del flujo
summary: Capa de orquestación de TaskFlow sobre tareas en segundo plano
title: Flujo de tareas
x-i18n:
    generated_at: "2026-07-05T11:01:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5ccc6acf58b4b44c2989e3061bff08dabce8ef385706102360c756a1286ddd1b
    source_path: automation/taskflow.md
    workflow: 16
---

Task Flow es la capa de orquestación sobre las [tareas en segundo plano](/es/automation/tasks). Un flujo es un registro duradero de trabajo de varios pasos con su propio estado, estado JSON, contador de revisión y registros de tareas vinculados. Los flujos sobreviven a los reinicios del gateway; las tareas individuales siguen siendo la unidad de trabajo desacoplado.

## Cuándo usar Task Flow

| Escenario                                  | Uso                                         |
| ----------------------------------------- | ------------------------------------------- |
| Trabajo único en segundo plano            | Tarea simple                                |
| Pipeline de varios pasos impulsado por código de plugin | Task Flow (administrado)                    |
| Creación de ACP desacoplado o subagente   | Task Flow (reflejado, creado automáticamente) |
| Recordatorio de una sola ejecución        | Trabajo Cron                                |

## Modos de sincronización

### Modo administrado

Un flujo administrado tiene un controlador: código de plugin que crea el flujo mediante la API de Task Flow del runtime del plugin con un objetivo y un id de controlador obligatorio, y luego lo impulsa explícitamente.

- Cada paso se ejecuta como una tarea en segundo plano creada bajo el flujo; la clave de propietario del flujo y el origen del solicitante se transfieren a las tareas hijas.
- El controlador avanza el flujo entre `running`, `waiting` y estados terminales, y almacena estado de paso JSON arbitrario en el registro del flujo.
- Cada mutación pasa la revisión esperada del flujo. Una escritura obsoleta se rechaza como conflicto de revisión en lugar de sobrescribir un estado más nuevo.
- Una vez solicitada la cancelación, se rechazan nuevas tareas hijas, y el flujo finaliza como `cancelled` cuando ninguna tarea hija permanece activa.

Ejemplo: un flujo de informe semanal que (1) recopila datos, (2) genera el informe y (3) lo entrega, con una tarea en segundo plano por paso:

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### Modo reflejado

OpenClaw crea automáticamente un flujo reflejado de una tarea cuando se inicia una ejecución desacoplada de ACP o subagente (tareas con alcance de sesión y finalización entregable). El registro del flujo refleja su única tarea subyacente - estado, objetivo y tiempos - para que las creaciones desacopladas obtengan un identificador de flujo estable para superficies de estado y reintento sin controlador. Los flujos reflejados muestran el modo de sincronización `task_mirrored` en la CLI.

## Estados de flujo

| Estado      | Significado                                                               |
| ----------- | ------------------------------------------------------------------------- |
| `queued`    | Creado, aún sin progresar                                                 |
| `running`   | El flujo está progresando activamente                                     |
| `waiting`   | El flujo administrado está estacionado en metadatos de espera (temporizador, evento externo) |
| `blocked`   | Un paso terminó sin un resultado utilizable; `blockedTaskId`/resumen indican cuál |
| `succeeded` | Completado correctamente                                                  |
| `failed`    | Completado con un error                                                   |
| `cancelled` | Cancelación solicitada y todas las tareas hijas resueltas                 |
| `lost`      | El flujo perdió su estado subyacente autoritativo                         |

## Estado duradero y seguimiento de revisiones

Los registros de flujo persisten en la base de datos de estado SQLite compartida (`~/.openclaw/state/openclaw.sqlite`, tabla `flow_runs`) junto con los registros de tareas, por lo que el progreso sobrevive a los reinicios del gateway. Cada escritura incrementa la `revision` del flujo; los escritores concurrentes que pasan una revisión esperada obsoleta reciben un conflicto y deben volver a leer. El crecimiento de WAL está limitado por el autocheckpointing de SQLite más checkpoints pasivos periódicos, con checkpoints de truncado al apagar. El sidecar heredado `flows/registry.sqlite` de instalaciones anteriores se importa mediante `openclaw doctor`.

## Comportamiento de cancelación

`openclaw tasks flow cancel` establece una intención de cancelación persistente en el flujo, cancela sus tareas hijas activas y rechaza nuevas tareas hijas administradas. Una vez que ninguna tarea hija permanece activa, el flujo finaliza como `cancelled`: de inmediato o mediante el barrido de mantenimiento si las hijas tardan más en resolverse. La intención se conserva, por lo que un flujo cancelado permanece cancelado incluso si el gateway se reinicia antes de que todas las tareas hijas hayan terminado.

## Comandos de CLI

```bash
# List active and recent flows
openclaw tasks flow list [--status <status>] [--json]

# Show details for a specific flow
openclaw tasks flow show <lookup> [--json]

# Cancel a running flow and its active tasks
openclaw tasks flow cancel <lookup>
```

| Comando                           | Descripción                                                             |
| --------------------------------- | ----------------------------------------------------------------------- |
| `openclaw tasks flow list`        | Flujos rastreados con modo de sincronización, estado, revisión, controlador y conteos de tareas |
| `openclaw tasks flow show <id>`   | Inspecciona un flujo por id de flujo o clave de propietario, incluidas las tareas vinculadas |
| `openclaw tasks flow cancel <id>` | Cancela un flujo en ejecución y sus tareas activas                      |

Los flujos también están cubiertos por `openclaw tasks audit` (hallazgos de flujos obsoletos o rotos) y `openclaw tasks maintenance` (finaliza cancelaciones atascadas, elimina flujos terminales después de 7 días).

## Patrón de workflow programado confiable

Para workflows recurrentes como informes de inteligencia de mercado, trata la programación, la orquestación y las comprobaciones de confiabilidad como capas separadas:

1. Usa [Tareas programadas](/es/automation/cron-jobs) para la temporización.
2. Usa una sesión cron persistente cuando el workflow deba basarse en contexto previo.
3. Usa [Lobster](/es/tools/lobster) para pasos deterministas, puertas de aprobación y tokens de reanudación.
4. Usa Task Flow para rastrear la ejecución de varios pasos a través de tareas hijas, esperas, reintentos y reinicios del gateway.

Ejemplo de forma cron:

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

Usa `--session session:<id>` en lugar de `isolated` cuando el workflow recurrente necesite historial deliberado, resúmenes de ejecuciones anteriores o contexto permanente. Usa `isolated` cuando cada ejecución deba empezar desde cero y todo el estado requerido sea explícito en el workflow.

Dentro del workflow, coloca las comprobaciones de confiabilidad antes del paso de resumen del LLM:

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

Comprobaciones de preflight recomendadas:

- Disponibilidad del navegador y elección de perfil, por ejemplo `openclaw` para estado administrado o `user` cuando se requiere una sesión de Chrome iniciada. Consulta [Navegador](/es/tools/browser).
- Credenciales de API y cuota para cada fuente.
- Accesibilidad de red para los endpoints requeridos.
- Herramientas requeridas habilitadas para el agente, como `lobster`, `browser` y `llm-task`.
- Destino de fallo configurado para cron para que los fallos de preflight sean visibles. Consulta [Tareas programadas](/es/automation/cron-jobs#delivery-and-output).

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

Haz que el workflow rechace o marque elementos obsoletos antes de la síntesis. El paso de LLM debe recibir solo JSON estructurado y se le debe pedir que preserve `sourceUrl`, `retrievedAt` y `asOf` en su salida. Usa [LLM Task](/es/tools/llm-task) cuando necesites un paso de modelo validado por esquema dentro del workflow.

Para workflows reutilizables de equipo o comunidad, empaqueta la CLI, los archivos `.lobster` y cualquier nota de configuración como una skill o plugin, y publícalo mediante [ClawHub](/es/clawhub). Mantén las barandillas específicas del workflow en ese paquete a menos que a la API del plugin le falte una capacidad genérica necesaria.

## Cómo se relacionan los flujos con las tareas

Los flujos coordinan tareas, no las reemplazan. Un solo flujo puede impulsar varias tareas en segundo plano durante su vida útil. Usa `openclaw tasks` para inspeccionar registros de tareas individuales y `openclaw tasks flow` para inspeccionar el flujo orquestador.

## Relacionado

- [Tareas en segundo plano](/es/automation/tasks) - el libro mayor de trabajo desacoplado que coordinan los flujos
- [CLI: tasks](/es/cli/tasks) - referencia de comandos de CLI para `openclaw tasks flow`
- [Resumen de automatización](/es/automation) - todos los mecanismos de automatización de un vistazo
- [Trabajos Cron](/es/automation/cron-jobs) - trabajos programados que pueden alimentar flujos
