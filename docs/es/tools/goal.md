---
doc-schema-version: 1
read_when:
    - Quieres que OpenClaw mantenga un objetivo visible durante una sesión larga
    - Necesitas pausar, reanudar, bloquear, completar o borrar el objetivo de una sesión
    - Quieres comprender las herramientas get_goal, create_goal y update_goal
    - Quieres ver cómo aparecen los objetivos en la TUI
summary: 'Objetivos de sesión: objetivos persistentes por sesión, controles de /goal, herramientas de objetivos del modelo, presupuestos de tokens y estado de la TUI'
title: Objetivo
x-i18n:
    generated_at: "2026-07-11T23:34:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 046356770522dc8a5584a59f3322b4502554a4b7f129b074da633861050ee5fd
    source_path: tools/goal.md
    workflow: 16
---

# Objetivo

Un **objetivo** es un propósito duradero vinculado a la sesión actual de OpenClaw.
Proporciona al agente y al operador una meta compartida para el trabajo de larga duración,
sin convertirla en una tarea en segundo plano, un recordatorio, un trabajo Cron ni una
orden permanente.

Los objetivos forman parte del estado de la sesión: se trasladan con la clave de sesión,
sobreviven a los reinicios del proceso y aparecen en `/goal`, en las herramientas de
objetivos disponibles para el modelo y en el pie de la TUI.

## Inicio rápido

```text
/goal start get CI green for PR 87469 and push the fix
/goal
/goal edit get CI green for PR 87469, push the fix, and update docs
/goal pause waiting for CI
/goal resume
/goal complete pushed and verified
/goal clear
```

`start` es opcional: `/goal get CI green for PR 87469` también crea un objetivo,
ya que cualquier texto después de `/goal` que no sea una palabra de acción conocida se
trata como un nuevo propósito.

## Para qué sirven los objetivos

Use un objetivo cuando una sesión tenga un resultado concreto que deba permanecer visible
durante muchos turnos:

- El cierre de una PR: corregir, verificar, ejecutar la revisión automática, enviar los cambios y abrir o actualizar la PR.
- Una sesión de depuración: reproducir el error, identificar el componente responsable, aplicar una corrección y
  demostrar que funciona.
- Una revisión de documentación: leer la documentación pertinente, escribir la nueva página, añadir enlaces cruzados y
  verificar la compilación de la documentación.
- Una tarea de mantenimiento: inspeccionar el estado actual, realizar cambios acotados, ejecutar las
  comprobaciones adecuadas e informar de lo que cambió.

Un objetivo no es una cola de tareas. Use [TaskFlow](/es/automation/taskflow),
[tareas](/es/automation/tasks), [trabajos Cron](/es/automation/cron-jobs) u
[órdenes permanentes](/es/automation/standing-orders) cuando el trabajo deba ejecutarse de forma independiente,
repetirse según una programación, dividirse en subtareas administradas o persistir como una política.

## Referencia de comandos

`/goal` sin argumentos muestra el resumen del objetivo actual:

```text
Goal
Status: active
Objective: get CI green for PR 87469 and push the fix
Tokens used: 12k
Token budget: 12k/50k

Commands: /goal edit <objective>, /goal pause, /goal complete, /goal clear
```

| Comando                                             | Efecto                                                                            |
| --------------------------------------------------- | --------------------------------------------------------------------------------- |
| `/goal` o `/goal status`                            | Muestra el objetivo actual.                                                       |
| `/goal start <objective>`                           | Crea un nuevo objetivo para la sesión actual.                                     |
| `/goal set <objective>`, `/goal create <objective>` | Alias de `start`.                                                                 |
| `/goal <objective>`                                 | También crea un nuevo objetivo (cualquier texto que no sea una palabra de acción reconocida). |
| `/goal edit <objective>`                            | Reformula el propósito actual; el estado y el cómputo de tokens no cambian.       |
| `/goal pause [note]`                                | Pausa un objetivo activo.                                                         |
| `/goal resume [note]`                               | Reanuda un objetivo pausado, bloqueado o limitado por uso o presupuesto.          |
| `/goal complete [note]`                             | Marca el objetivo como alcanzado.                                                 |
| `/goal done [note]`                                 | Alias de `complete`.                                                              |
| `/goal block [note]`                                | Marca el objetivo como bloqueado.                                                 |
| `/goal blocked [note]`                              | Alias de `block`.                                                                 |
| `/goal clear`                                       | Elimina el objetivo de la sesión.                                                 |

Solo puede existir un objetivo por sesión a la vez. Intentar iniciar un segundo objetivo falla
con `Goal error: goal already exists` hasta que se borre el actual.

`/goal start` no acepta una opción de presupuesto de tokens; solo se puede establecer un presupuesto
mediante la herramienta `create_goal` disponible para el modelo.

## Estados

- `active`: la sesión está trabajando para alcanzar el objetivo.
- `paused`: el operador pausó el objetivo; `/goal resume` vuelve a activarlo.
- `blocked`: el agente o el operador informó de un bloqueo real; `/goal resume`
  vuelve a activarlo cuando hay nueva información o cambia el estado.
- `budget_limited`: se alcanzó el presupuesto de tokens configurado; `/goal resume`
  reinicia la consecución del mismo propósito con una nueva ventana de presupuesto.
- `usage_limited`: reservado para un futuro estado de detención por límite de uso; `/goal
resume` reinicia la consecución del objetivo de la misma manera.
- `complete`: se alcanzó el objetivo. Los objetivos completados son terminales; use `/goal
clear` antes de iniciar otro objetivo.

`/new` y `/reset` borran el objetivo de la sesión actual, ya que inician
intencionadamente un contexto de sesión nuevo.

## Presupuestos de tokens

Los objetivos pueden tener un presupuesto opcional de tokens positivo, establecido mediante el
parámetro `token_budget` de la herramienta `create_goal`. El presupuesto se mide a partir del
recuento actualizado de tokens de la sesión en el momento de crear el objetivo. Si la sesión solo tiene una
instantánea de tokens obsoleta o desconocida cuando se inicia el objetivo, OpenClaw espera a la
siguiente instantánea actualizada y la usa como referencia, por lo que los tokens consumidos antes de que
existiera el objetivo no se le imputan.

Cuando el uso alcanza el presupuesto, el objetivo pasa a `budget_limited`. Esto no
elimina el objetivo ni borra el propósito; indica al operador y al
agente que ya no se está trabajando activamente en él hasta que se reanude o
se borre. Al reanudarlo, comienza una nueva ventana de presupuesto a partir del recuento
actualizado de tokens.

Los presupuestos de tokens son una medida de protección para los objetivos de sesión, no un límite de facturación. La
cuota del proveedor, los informes de costes y el comportamiento de la ventana de contexto siguen usando los controles
normales de uso y de modelo de OpenClaw.

## Herramientas del modelo

OpenClaw ofrece tres herramientas de objetivos a los entornos de agentes:

| Herramienta   | Finalidad                                                                                                                   |
| ------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `get_goal`    | Lee el objetivo de la sesión actual: estado, propósito, uso de tokens y presupuesto de tokens.                              |
| `create_goal` | Crea un objetivo solo cuando las instrucciones del usuario o del sistema lo solicitan explícitamente. Falla si la sesión ya tiene un objetivo. |
| `update_goal` | Marca el objetivo como `complete` o `blocked`.                                                                              |

El modelo no puede pausar, reanudar, borrar ni reemplazar silenciosamente un objetivo. Estas acciones siguen siendo
controles del operador o de la sesión mediante `/goal` y los comandos de reinicio, para que el agente
pueda informar de la consecución o de un bloqueo real sin cambiar discretamente la
meta.

`update_goal` solo debe marcar un objetivo como `complete` cuando el propósito se haya
alcanzado realmente. Solo debe marcar un objetivo como `blocked` después de que la misma
condición de bloqueo se repita durante al menos tres turnos consecutivos del objetivo, no por
dificultades normales o falta de retoques finales.

## Contexto del objetivo en cada turno

Cada turno del usuario o del chat con un objetivo activo incluye esta línea de contexto con rol de usuario:

```text
Active goal: <objective> — advance it or update its status (get_goal/update_goal).
```

OpenClaw mantiene la línea compacta truncando los propósitos largos. Los objetivos pausados,
bloqueados, limitados por presupuesto, limitados por uso y completados no se insertan,
por lo que una detención del operador permanece vigente hasta que se reanuda el objetivo.

## Interfaz de control

La interfaz de control web muestra el objetivo como una etiqueta compacta sobre el editor del chat:
un icono de estado, la etiqueta del estado (por ejemplo, `Pursuing goal`), el propósito truncado
y un temporizador en vivo del tiempo transcurrido.

La etiqueta incluye controles integrados:

- **Lápiz** rellena previamente el editor con `/goal edit <objective>` para poder
  reformular y enviar el propósito.
- **Pausar/reanudar** alterna entre `/goal pause` y `/goal resume` según
  el estado actual.
- **Papelera** envía `/goal clear`.
- **Chevron** expande la etiqueta para mostrar el propósito completo, la nota de estado más
  reciente, el uso de tokens y el tiempo transcurrido.

Los botones de acción se ocultan mientras el editor no puede enviar mensajes (por ejemplo,
cuando la conexión con el Gateway está interrumpida); el chevron de expansión sigue funcionando.

## TUI

El pie de la TUI mantiene visible el objetivo de la sesión activa junto a los campos de agente,
sesión y modelo, antes de los indicadores de tokens y modo.

Ejemplos del pie:

- `Pursuing goal (12k/50k)` para un objetivo activo con un presupuesto de tokens.
- `Goal paused (/goal resume)` para un objetivo pausado.
- `Goal blocked (/goal resume)` para un objetivo bloqueado.
- `Goal hit usage limits (/goal resume)` para un objetivo limitado por uso.
- `Goal unmet (50k/50k)` para un objetivo limitado por presupuesto.
- `Goal achieved (42k)` para un objetivo completado.

El pie es intencionadamente compacto. Use `/goal` para consultar el propósito completo,
la nota, el presupuesto de tokens y los comandos disponibles.

## Comportamiento en los canales

`/goal` funciona en sesiones de OpenClaw que admiten comandos, incluidas la TUI y
las superficies de chat que permiten comandos de texto. El estado del objetivo está asociado a la
clave de sesión, no al medio de transporte, por lo que dos superficies que compartan una clave de sesión ven el
mismo objetivo.

El estado del objetivo no es una directiva de entrega: no fuerza las respuestas a través de un
canal, no cambia el comportamiento de la cola, no aprueba herramientas ni programa trabajo.

## Solución de problemas

| Mensaje                                | Significado                                                                                                                                           |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Goal error: goal already exists`      | La sesión ya tiene un objetivo. Use `/goal` para inspeccionarlo, `/goal complete` si terminó o `/goal clear` antes de iniciar un propósito diferente. |
| `Goal error: goal not found`           | La sesión aún no tiene ningún objetivo. Inicie uno con `/goal start <objective>`.                                                                     |
| `Goal error: goal is already complete` | El objetivo es terminal. Bórrelo antes de iniciar o reanudar otro propósito.                                                                          |

Si el uso de tokens muestra `0` o parece obsoleto, es posible que la sesión activa todavía no tenga una
instantánea de tokens actualizada. El uso se actualiza a medida que OpenClaw registra el uso de la sesión
y los totales derivados de la transcripción.

## Contenido relacionado

- [Comandos con barra](/es/tools/slash-commands)
- [TUI](/es/web/tui)
- [Herramienta de sesión](/es/concepts/session-tool)
- [Compaction](/es/concepts/compaction)
- [TaskFlow](/es/automation/taskflow)
- [Órdenes permanentes](/es/automation/standing-orders)
