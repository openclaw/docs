---
read_when:
    - Quieres entender cómo se relaciona el flujo de tareas con las tareas en segundo plano
    - Te encuentras con el flujo de tareas o el flujo de tareas de openclaw en las notas de la versión o en la documentación
    - Quieres inspeccionar o gestionar el estado duradero del flujo
summary: Capa de orquestación de flujos de tareas por encima de las tareas en segundo plano
title: Flujo de tareas
x-i18n:
    generated_at: "2026-04-23T13:57:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: f94a3cda89db5bfcc6c396358bc3fcee40f9313e102dc697d985f40707381468
    source_path: automation/taskflow.md
    workflow: 15
---

# Flujo de tareas

El flujo de tareas es el sustrato de orquestación de flujos que se sitúa por encima de las [tareas en segundo plano](/es/automation/tasks). Gestiona flujos duraderos de varios pasos con su propio estado, seguimiento de revisiones y semántica de sincronización, mientras que las tareas individuales siguen siendo la unidad de trabajo desacoplado.

## Cuándo usar el flujo de tareas

Usa el flujo de tareas cuando el trabajo abarque varios pasos secuenciales o ramificados y necesites un seguimiento duradero del progreso entre reinicios del Gateway. Para operaciones individuales en segundo plano, una [tarea](/es/automation/tasks) simple es suficiente.

| Escenario                             | Uso                    |
| ------------------------------------- | ---------------------- |
| Trabajo único en segundo plano        | Tarea simple           |
| Canalización de varios pasos (A, luego B, luego C) | Flujo de tareas (gestionado) |
| Observar tareas creadas externamente  | Flujo de tareas (reflejado) |
| Recordatorio de una sola vez          | Trabajo Cron           |

## Modos de sincronización

### Modo gestionado

El flujo de tareas controla el ciclo de vida de extremo a extremo. Crea tareas como pasos del flujo, las lleva hasta su finalización y avanza el estado del flujo automáticamente.

Ejemplo: un flujo de informe semanal que (1) recopila datos, (2) genera el informe y (3) lo entrega. El flujo de tareas crea cada paso como una tarea en segundo plano, espera a que finalice y luego pasa al siguiente paso.

```
Flow: weekly-report
  Step 1: gather-data     → task created → succeeded
  Step 2: generate-report → task created → succeeded
  Step 3: deliver         → task created → running
```

### Modo reflejado

El flujo de tareas observa tareas creadas externamente y mantiene el estado del flujo sincronizado sin asumir la responsabilidad de crear las tareas. Esto resulta útil cuando las tareas se originan en trabajos Cron, comandos de CLI u otras fuentes, y quieres una vista unificada de su progreso como flujo.

Ejemplo: tres trabajos Cron independientes que en conjunto forman una rutina de "operaciones matutinas". Un flujo reflejado hace seguimiento de su progreso colectivo sin controlar cuándo ni cómo se ejecutan.

## Estado duradero y seguimiento de revisiones

Cada flujo conserva su propio estado y hace seguimiento de las revisiones para que el progreso sobreviva a los reinicios del Gateway. El seguimiento de revisiones permite detectar conflictos cuando varias fuentes intentan hacer avanzar el mismo flujo al mismo tiempo.

## Comportamiento de cancelación

`openclaw tasks flow cancel` establece una intención de cancelación persistente en el flujo. Las tareas activas dentro del flujo se cancelan y no se inician pasos nuevos. La intención de cancelación persiste entre reinicios, por lo que un flujo cancelado sigue cancelado incluso si el Gateway se reinicia antes de que todas las tareas hijas hayan terminado.

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

Los flujos coordinan tareas, no las sustituyen. Un solo flujo puede controlar varias tareas en segundo plano a lo largo de su ciclo de vida. Usa `openclaw tasks` para inspeccionar registros de tareas individuales y `openclaw tasks flow` para inspeccionar el flujo de orquestación.

## Relacionado

- [Tareas en segundo plano](/es/automation/tasks) — el registro de trabajo desacoplado que coordinan los flujos
- [CLI: tasks](/es/cli/tasks) — referencia de comandos de CLI para `openclaw tasks flow`
- [Resumen de automatización](/es/automation) — todos los mecanismos de automatización de un vistazo
- [Trabajos Cron](/es/automation/cron-jobs) — trabajos programados que pueden alimentar flujos
