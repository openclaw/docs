---
read_when:
    - Quieres entender cómo se relaciona Flujo de tareas con las tareas en segundo plano
    - Encuentras Flujo de tareas o el flujo de tareas de openclaw en las notas de la versión o en la documentación
    - Quieres inspeccionar o gestionar el estado persistente del flujo
summary: 'Flujo de tareas: capa de orquestación de flujos por encima de las tareas en segundo plano'
title: Flujo de tareas
x-i18n:
    generated_at: "2026-04-24T05:18:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 90286fb783db5417ab5e781377a85be76cd3f9e9b32da57558c2d8f02b813dba
    source_path: automation/taskflow.md
    workflow: 15
---

Flujo de tareas es el sustrato de orquestación de flujos que se sitúa por encima de las [tareas en segundo plano](/es/automation/tasks). Gestiona flujos duraderos de varios pasos con su propio estado, seguimiento de revisiones y semántica de sincronización, mientras que las tareas individuales siguen siendo la unidad de trabajo desacoplado.

## Cuándo usar Flujo de tareas

Usa Flujo de tareas cuando el trabajo abarque varios pasos secuenciales o ramificados y necesites un seguimiento duradero del progreso entre reinicios del Gateway. Para operaciones individuales en segundo plano, una [tarea](/es/automation/tasks) simple es suficiente.

| Escenario                            | Uso                  |
| ------------------------------------ | -------------------- |
| Trabajo único en segundo plano       | Tarea simple         |
| Canalización de varios pasos (A, luego B, luego C) | Flujo de tareas (gestionado) |
| Observar tareas creadas externamente | Flujo de tareas (reflejado) |
| Recordatorio de una sola vez         | Trabajo de Cron      |

## Modos de sincronización

### Modo gestionado

Flujo de tareas controla el ciclo de vida de extremo a extremo. Crea tareas como pasos del flujo, las lleva hasta su finalización y hace avanzar el estado del flujo automáticamente.

Ejemplo: un flujo de informe semanal que (1) recopila datos, (2) genera el informe y (3) lo entrega. Flujo de tareas crea cada paso como una tarea en segundo plano, espera a que finalice y luego pasa al siguiente paso.

```text
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### Modo reflejado

Flujo de tareas observa tareas creadas externamente y mantiene el estado del flujo sincronizado sin asumir la propiedad de la creación de tareas. Esto resulta útil cuando las tareas se originan en trabajos de Cron, comandos de CLI u otras fuentes, y quieres una vista unificada de su progreso como flujo.

Ejemplo: tres trabajos de Cron independientes que juntos forman una rutina de "operaciones matutinas". Un flujo reflejado realiza el seguimiento de su progreso colectivo sin controlar cuándo ni cómo se ejecutan.

## Estado duradero y seguimiento de revisiones

Cada flujo conserva su propio estado y realiza un seguimiento de las revisiones para que el progreso sobreviva a los reinicios del Gateway. El seguimiento de revisiones permite detectar conflictos cuando varias fuentes intentan hacer avanzar el mismo flujo al mismo tiempo.

## Comportamiento de cancelación

`openclaw tasks flow cancel` establece una intención de cancelación persistente en el flujo. Las tareas activas dentro del flujo se cancelan y no se inicia ningún paso nuevo. La intención de cancelación persiste entre reinicios, por lo que un flujo cancelado sigue cancelado incluso si el Gateway se reinicia antes de que todas las tareas hijas hayan terminado.

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
| `openclaw tasks flow list`        | Muestra los flujos rastreados con estado y modo de sincronización |
| `openclaw tasks flow show <id>`   | Inspecciona un flujo por id de flujo o clave de búsqueda |
| `openclaw tasks flow cancel <id>` | Cancela un flujo en ejecución y sus tareas activas |

## Cómo se relacionan los flujos con las tareas

Los flujos coordinan tareas; no las reemplazan. Un solo flujo puede controlar varias tareas en segundo plano a lo largo de su ciclo de vida. Usa `openclaw tasks` para inspeccionar registros de tareas individuales y `openclaw tasks flow` para inspeccionar el flujo de orquestación.

## Relacionado

- [Tareas en segundo plano](/es/automation/tasks) — el registro de trabajo desacoplado que coordinan los flujos
- [CLI: tasks](/es/cli/tasks) — referencia de comandos de CLI para `openclaw tasks flow`
- [Resumen de automatización](/es/automation) — todos los mecanismos de automatización de un vistazo
- [Trabajos de Cron](/es/automation/cron-jobs) — trabajos programados que pueden alimentar flujos
