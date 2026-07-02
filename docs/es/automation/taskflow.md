---
read_when:
    - Quieres entender cómo se relaciona Task Flow con las tareas en segundo plano
    - Encuentras Flujo de tareas o flujo de tareas de openclaw en notas de la versión o documentación
    - Quieres inspeccionar o gestionar el estado duradero del flujo
summary: Capa de orquestación de TaskFlow por encima de las tareas en segundo plano
title: Flujo de tareas
x-i18n:
    generated_at: "2026-07-02T00:42:34Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7b74a773e34c02421d22ce11ae0aa29fed82664383f0680e7623787db7d79c8e
    source_path: automation/taskflow.md
    workflow: 16
---

Task Flow es el sustrato de orquestación de flujos que se sitúa sobre las [tareas en segundo plano](/es/automation/tasks). Gestiona flujos duraderos de varios pasos con su propio estado, seguimiento de revisiones y semántica de sincronización, mientras las tareas individuales siguen siendo la unidad de trabajo desacoplado.

## Cuándo usar Task Flow

Usa Task Flow cuando el trabajo abarque varios pasos secuenciales o ramificados y necesites seguimiento duradero del progreso entre reinicios del gateway. Para operaciones únicas en segundo plano, una [tarea](/es/automation/tasks) simple es suficiente.

| Escenario                             | Uso                  |
| ------------------------------------- | -------------------- |
| Trabajo único en segundo plano        | Tarea simple         |
| Canalización de varios pasos (A, luego B, luego C) | Task Flow (gestionado) |
| Observar tareas creadas externamente  | Task Flow (reflejado) |
| Recordatorio de una sola vez          | Trabajo Cron         |

## Patrón confiable de flujo de trabajo programado

Para flujos de trabajo recurrentes, como informes de inteligencia de mercado, trata la programación, la orquestación y las comprobaciones de confiabilidad como capas separadas:

1. Usa [Tareas programadas](/es/automation/cron-jobs) para la temporización.
2. Guarda el contexto anterior en los propios archivos, la base de datos o el estado de herramientas del flujo de trabajo.
3. Usa [Lobster](/es/tools/lobster) para pasos deterministas, puertas de aprobación y tokens de reanudación.
4. Usa Task Flow para seguir la ejecución de varios pasos entre tareas hijas, esperas, reintentos y reinicios del gateway.

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

Usa `session:<id>` cuando el trabajo deba dirigirse a un chat o sesión conocidos para el contexto de entrega o la inicialización segura de preferencias. Cron sigue ejecutando cada ejecución en una sesión desacoplada, así que coloca los resúmenes de ejecuciones anteriores y el estado permanente del flujo de trabajo en un almacenamiento explícito que el trabajo pueda leer.

Dentro del flujo de trabajo, coloca las comprobaciones de confiabilidad antes del paso de resumen del LLM:

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

- Disponibilidad del navegador y elección de perfil, por ejemplo `openclaw` para estado gestionado o `user` cuando se requiere una sesión de Chrome con inicio de sesión. Consulta [Navegador](/es/tools/browser).
- Credenciales de API y cuota para cada fuente.
- Alcance de red para los endpoints requeridos.
- Herramientas requeridas habilitadas para el agente, como `lobster`, `browser` y `llm-task`.
- Destino de fallo configurado para cron, de modo que los fallos previos sean visibles. Consulta [Tareas programadas](/es/automation/cron-jobs#delivery-and-output).

Campos recomendados de procedencia de datos para cada elemento recopilado:

```json
{
  "sourceUrl": "https://example.com/report",
  "retrievedAt": "2026-04-24T12:00:00Z",
  "asOf": "2026-04-24",
  "title": "Example report",
  "content": "..."
}
```

Haz que el flujo de trabajo rechace o marque como obsoletos los elementos antes del resumen. El paso del LLM debe recibir solo JSON estructurado y se le debe pedir que conserve `sourceUrl`, `retrievedAt` y `asOf` en su salida. Usa [Tarea LLM](/es/tools/llm-task) cuando necesites un paso de modelo validado por esquema dentro del flujo de trabajo.

Para flujos de trabajo reutilizables de equipos o comunidades, empaqueta la CLI, los archivos `.lobster` y cualquier nota de configuración como una skill o plugin, y publícalo a través de [ClawHub](/clawhub). Mantén las barreras de protección específicas del flujo de trabajo en ese paquete, salvo que a la API del plugin le falte una capacidad genérica necesaria.

## Modos de sincronización

### Modo gestionado

Task Flow posee el ciclo de vida de principio a fin. Crea tareas como pasos del flujo, las impulsa hasta su finalización y avanza automáticamente el estado del flujo.

Ejemplo: un flujo de informe semanal que (1) recopila datos, (2) genera el informe y (3) lo entrega. Task Flow crea cada paso como una tarea en segundo plano, espera a que se complete y luego pasa al siguiente paso.

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### Modo reflejado

Task Flow observa tareas creadas externamente y mantiene el estado del flujo sincronizado sin asumir la propiedad de la creación de tareas. Esto es útil cuando las tareas se originan en trabajos cron, comandos de CLI u otras fuentes, y quieres una vista unificada de su progreso como flujo.

Ejemplo: tres trabajos cron independientes que juntos forman una rutina de "operaciones matutinas". Un flujo reflejado sigue su progreso colectivo sin controlar cuándo ni cómo se ejecutan.

## Estado duradero y seguimiento de revisiones

Cada flujo conserva su propio estado y sigue las revisiones para que el progreso sobreviva a los reinicios del gateway. El seguimiento de revisiones permite detectar conflictos cuando varias fuentes intentan avanzar el mismo flujo de forma concurrente.
El registro de flujos usa SQLite con mantenimiento acotado del registro de escritura anticipada, incluidos
puntos de control periódicos y al apagarse, para que los gateways de larga duración no conserven
archivos auxiliares `registry.sqlite-wal` sin límite.

## Comportamiento de cancelación

`openclaw tasks flow cancel` establece una intención de cancelación persistente en el flujo. Las tareas activas dentro del flujo se cancelan y no se inician nuevos pasos. La intención de cancelación persiste entre reinicios, por lo que un flujo cancelado permanece cancelado incluso si el gateway se reinicia antes de que todas las tareas hijas hayan terminado.

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

Los flujos coordinan tareas, no las reemplazan. Un solo flujo puede impulsar varias tareas en segundo plano durante su vida útil. Usa `openclaw tasks` para inspeccionar registros de tareas individuales y `openclaw tasks flow` para inspeccionar el flujo de orquestación.

## Relacionado

- [Tareas en segundo plano](/es/automation/tasks) — el registro de trabajo desacoplado que coordinan los flujos
- [CLI: tareas](/es/cli/tasks) — referencia de comandos de CLI para `openclaw tasks flow`
- [Descripción general de la automatización](/es/automation) — todos los mecanismos de automatización de un vistazo
- [Trabajos Cron](/es/automation/cron-jobs) — trabajos programados que pueden alimentar flujos
