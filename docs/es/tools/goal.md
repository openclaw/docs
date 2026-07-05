---
doc-schema-version: 1
read_when:
    - Quieres que OpenClaw mantenga un objetivo visible durante una sesión larga
    - Necesitas pausar, reanudar, bloquear, completar o borrar un objetivo de sesión
    - Quieres entender las herramientas get_goal, create_goal y update_goal
    - Quieres ver cómo aparecen los objetivos en la TUI
summary: 'Objetivos de sesión: objetivos duraderos por sesión, controles de /goal, herramientas de objetivos del modelo, presupuestos de tokens y estado de la TUI'
title: Objetivo
x-i18n:
    generated_at: "2026-07-05T11:47:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3ff943a751c75213124c85fefbb3f3bca4469841793873983adbc1cec6fcd629
    source_path: tools/goal.md
    workflow: 16
---

# Objetivo

Un **objetivo** es un objetivo duradero adjunto a la sesión actual de OpenClaw.
Le da al agente y al operador una meta compartida para trabajo de larga duración,
sin convertir esa meta en una tarea en segundo plano, recordatorio, trabajo cron ni
orden permanente.

Los objetivos son estado de sesión: se mueven con la clave de sesión, sobreviven a
reinicios del proceso y aparecen en `/goal`, las herramientas de objetivos orientadas al modelo y el pie de página de la TUI.

## Inicio rápido

```text
/goal start get CI green for PR 87469 and push the fix
/goal
/goal pause waiting for CI
/goal resume
/goal complete pushed and verified
/goal clear
```

`start` es opcional: `/goal get CI green for PR 87469` también crea un objetivo,
ya que cualquier texto después de `/goal` que no sea una palabra de acción conocida se trata como un
nuevo objetivo.

## Para qué sirven los objetivos

Usa un objetivo cuando una sesión tenga un resultado concreto que deba permanecer visible
a lo largo de muchos turnos:

- Un cierre de PR: corregir, verificar, hacer revisión automática, hacer push y abrir o actualizar el PR.
- Una ejecución de depuración: reproducir el error, identificar la superficie propietaria, aplicar el parche y
  probar la corrección.
- Una pasada de documentación: leer la documentación relevante, escribir la página nueva, enlazarla de forma cruzada y
  verificar la compilación de la documentación.
- Una tarea de mantenimiento: inspeccionar el estado actual, hacer cambios acotados, ejecutar las
  comprobaciones correctas e informar qué cambió.

Un objetivo no es una cola de tareas. Usa [Flujo de tareas](/es/automation/taskflow),
[tareas](/es/automation/tasks), [trabajos cron](/es/automation/cron-jobs) u
[órdenes permanentes](/es/automation/standing-orders) cuando el trabajo deba ejecutarse desacoplado,
repetirse según una programación, ramificarse en subtrabajo gestionado o persistir como una política.

## Referencia de comandos

`/goal` sin argumentos imprime el resumen del objetivo actual:

```text
Goal
Status: active
Objective: get CI green for PR 87469 and push the fix
Tokens used: 12k
Token budget: 12k/50k

Commands: /goal pause, /goal complete, /goal clear
```

| Comando                                             | Efecto                                                                   |
| --------------------------------------------------- | ------------------------------------------------------------------------ |
| `/goal` o `/goal status`                            | Muestra el objetivo actual.                                              |
| `/goal start <objective>`                           | Crea un objetivo nuevo para la sesión actual.                            |
| `/goal set <objective>`, `/goal create <objective>` | Alias de `start`.                                                        |
| `/goal <objective>`                                 | También crea un objetivo nuevo (cualquier texto que no sea una palabra de acción reconocida). |
| `/goal pause [note]`                                | Pausa un objetivo activo.                                                |
| `/goal resume [note]`                               | Reanuda un objetivo pausado, bloqueado, limitado por uso o limitado por presupuesto. |
| `/goal complete [note]`                             | Marca el objetivo como logrado.                                          |
| `/goal done [note]`                                 | Alias de `complete`.                                                     |
| `/goal block [note]`                                | Marca el objetivo como bloqueado.                                        |
| `/goal blocked [note]`                              | Alias de `block`.                                                        |
| `/goal clear`                                       | Elimina el objetivo de la sesión.                                        |

Solo puede existir un objetivo en una sesión a la vez. Iniciar un segundo objetivo falla
con `Goal error: goal already exists` hasta que se borre el actual.

`/goal start` no acepta una marca de presupuesto de tokens; un presupuesto solo puede establecerse
mediante la herramienta orientada al modelo `create_goal`.

## Estados

- `active`: la sesión está trabajando para alcanzar el objetivo.
- `paused`: el operador pausó el objetivo; `/goal resume` lo vuelve a activar.
- `blocked`: el agente o el operador informó un bloqueo real; `/goal resume`
  lo vuelve a activar cuando hay nueva información o estado disponible.
- `budget_limited`: se alcanzó el presupuesto de tokens configurado; `/goal resume`
  reinicia la ejecución desde el mismo objetivo con una ventana de presupuesto nueva.
- `usage_limited`: reservado para un estado de detención futuro por límite de uso; `/goal
resume` reinicia la ejecución de la misma manera.
- `complete`: el objetivo se logró. Los objetivos completados son terminales; usa `/goal
clear` antes de iniciar otro objetivo.

`/new` y `/reset` borran el objetivo actual de la sesión, ya que intencionalmente
inician un contexto de sesión nuevo.

## Presupuestos de tokens

Los objetivos pueden tener un presupuesto opcional positivo de tokens, establecido mediante el
parámetro `token_budget` de la herramienta `create_goal`. El presupuesto se mide desde el
conteo de tokens reciente de la sesión en el momento de creación del objetivo. Si la sesión solo tiene una
instantánea de tokens obsoleta o desconocida cuando comienza el objetivo, OpenClaw espera la
siguiente instantánea reciente y la usa como línea base, de modo que los tokens gastados antes de que
existiera el objetivo no se le cargan.

Cuando el uso alcanza el presupuesto, el objetivo pasa a `budget_limited`. Esto
no elimina el objetivo ni borra la finalidad; indica al operador y al
agente que el objetivo ya no se persigue activamente hasta que se reanude o
se borre. Reanudar inicia una nueva ventana de presupuesto en el conteo de tokens
reciente actual.

Los presupuestos de tokens son una barandilla para objetivos de sesión, no un límite de facturación. La cuota del proveedor,
los informes de costos y el comportamiento de la ventana de contexto siguen usando los controles normales
de uso y modelo de OpenClaw.

## Herramientas del modelo

OpenClaw expone tres herramientas de objetivo a los arneses de agentes:

| Herramienta   | Propósito                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `get_goal`    | Leer el objetivo actual de la sesión: estado, finalidad, uso de tokens y presupuesto de tokens.                          |
| `create_goal` | Crear un objetivo solo cuando las instrucciones del usuario o del sistema lo soliciten explícitamente. Falla si la sesión ya tiene un objetivo. |
| `update_goal` | Marcar el objetivo como `complete` o `blocked`.                                                                          |

El modelo no puede pausar, reanudar, borrar ni reemplazar un objetivo silenciosamente. Esos siguen siendo
controles del operador o de la sesión mediante `/goal` y comandos de restablecimiento, de modo que el agente
pueda informar el logro o un bloqueo genuino sin mover discretamente el
objetivo.

`update_goal` debe marcar un objetivo como `complete` solo cuando la finalidad se haya
logrado realmente. Debe marcar un objetivo como `blocked` solo después de que la misma
condición de bloqueo se repita durante al menos tres turnos consecutivos del objetivo, no por
dificultad ordinaria ni por falta de refinamiento.

## TUI

El pie de página de la TUI mantiene visible el objetivo de la sesión activa junto a los campos de agente,
sesión y modelo, antes de los indicadores de tokens/modo.

Ejemplos de pie de página:

- `Pursuing goal (12k/50k)` para un objetivo activo con presupuesto de tokens.
- `Goal paused (/goal resume)` para un objetivo pausado.
- `Goal blocked (/goal resume)` para un objetivo bloqueado.
- `Goal hit usage limits (/goal resume)` para un objetivo limitado por uso.
- `Goal unmet (50k/50k)` para un objetivo limitado por presupuesto.
- `Goal achieved (42k)` para un objetivo completado.

El pie de página es intencionadamente compacto. Usa `/goal` para ver la finalidad completa,
la nota, el presupuesto de tokens y los comandos disponibles.

## Comportamiento de canales

`/goal` funciona en sesiones de OpenClaw con capacidad de comandos, incluida la TUI y
las superficies de chat que permiten comandos de texto. El estado del objetivo se adjunta a la
clave de sesión, no al transporte, de modo que dos superficies que comparten una clave de sesión ven el
mismo objetivo.

El estado del objetivo no es una directiva de entrega: no fuerza respuestas a través de un
canal, no cambia el comportamiento de la cola, no aprueba herramientas ni programa trabajo.

## Solución de problemas

| Mensaje                                | Significado                                                                                                                                 |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `Goal error: goal already exists`      | La sesión ya tiene un objetivo. Usa `/goal` para inspeccionarlo, `/goal complete` si terminó, o `/goal clear` antes de iniciar una finalidad diferente. |
| `Goal error: goal not found`           | La sesión aún no tiene ningún objetivo. Inicia uno con `/goal start <objective>`.                                                            |
| `Goal error: goal is already complete` | El objetivo es terminal. Bórralo antes de iniciar o reanudar otra finalidad.                                                                 |

Si el uso de tokens muestra `0` o parece obsoleto, es posible que la sesión activa aún no tenga una
instantánea reciente de tokens. El uso se actualiza a medida que OpenClaw registra el uso de sesión
y los totales derivados de la transcripción.

## Relacionado

- [Comandos de barra](/es/tools/slash-commands)
- [TUI](/es/web/tui)
- [Herramienta de sesión](/es/concepts/session-tool)
- [Compaction](/es/concepts/compaction)
- [Flujo de tareas](/es/automation/taskflow)
- [Órdenes permanentes](/es/automation/standing-orders)
