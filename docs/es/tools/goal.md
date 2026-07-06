---
doc-schema-version: 1
read_when:
    - Quieres que OpenClaw mantenga un objetivo visible durante una sesión larga
    - Necesitas pausar, reanudar, bloquear, completar o borrar un objetivo de sesión
    - Quieres comprender las herramientas get_goal, create_goal y update_goal
    - Quieres ver cómo aparecen los objetivos en la TUI
summary: 'Objetivos de sesión: objetivos duraderos por sesión, controles /goal, herramientas de objetivo del modelo, presupuestos de tokens y estado de TUI'
title: Objetivo
x-i18n:
    generated_at: "2026-07-06T10:53:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 046356770522dc8a5584a59f3322b4502554a4b7f129b074da633861050ee5fd
    source_path: tools/goal.md
    workflow: 16
---

# Objetivo

Un **objetivo** es un objetivo duradero asociado a la sesión actual de OpenClaw.
Proporciona al agente y al operador una meta compartida para trabajos de larga duración,
sin convertir esa meta en una tarea en segundo plano, recordatorio, trabajo cron u
orden permanente.

Los objetivos son estado de sesión: se mueven con la clave de sesión, sobreviven a
reinicios del proceso y aparecen en `/goal`, las herramientas de objetivo orientadas al modelo y el pie de página de la TUI.

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
ya que cualquier texto después de `/goal` que no sea una palabra de acción conocida se trata como un
nuevo objetivo.

## Para qué sirven los objetivos

Usa un objetivo cuando una sesión tenga un resultado concreto que deba permanecer visible
durante muchos turnos:

- Cierre de una PR: corregir, verificar, ejecutar autoreview, enviar y abrir o actualizar la PR.
- Ejecución de depuración: reproducir el error, identificar la superficie propietaria, parchear y
  demostrar la corrección.
- Pasada de documentación: leer la documentación relevante, escribir la página nueva, enlazarla de forma cruzada y
  verificar la compilación de la documentación.
- Tarea de mantenimiento: inspeccionar el estado actual, hacer cambios acotados, ejecutar las
  comprobaciones correctas e informar qué cambió.

Un objetivo no es una cola de tareas. Usa [TaskFlow](/es/automation/taskflow),
[tareas](/es/automation/tasks), [trabajos cron](/es/automation/cron-jobs) u
[órdenes permanentes](/es/automation/standing-orders) cuando el trabajo deba ejecutarse desacoplado,
repetirse según una programación, desplegarse en subtrabajos gestionados o persistir como una política.

## Referencia de comandos

`/goal` sin argumentos imprime el resumen del objetivo actual:

```text
Goal
Status: active
Objective: get CI green for PR 87469 and push the fix
Tokens used: 12k
Token budget: 12k/50k

Commands: /goal edit <objective>, /goal pause, /goal complete, /goal clear
```

| Comando                                             | Efecto                                                                   |
| --------------------------------------------------- | ------------------------------------------------------------------------ |
| `/goal` o `/goal status`                           | Muestra el objetivo actual.                                                   |
| `/goal start <objective>`                           | Crea un objetivo nuevo para la sesión actual.                               |
| `/goal set <objective>`, `/goal create <objective>` | Alias de `start`.                                                     |
| `/goal <objective>`                                 | También crea un objetivo nuevo (cualquier texto que no sea una palabra de acción reconocida). |
| `/goal edit <objective>`                            | Reformula el objetivo actual; el estado y la contabilidad de tokens permanecen igual.      |
| `/goal pause [note]`                                | Pausa un objetivo activo.                                                    |
| `/goal resume [note]`                               | Reanuda un objetivo pausado, bloqueado, limitado por uso o limitado por presupuesto.         |
| `/goal complete [note]`                             | Marca el objetivo como logrado.                                                  |
| `/goal done [note]`                                 | Alias de `complete`.                                                    |
| `/goal block [note]`                                | Marca el objetivo como bloqueado.                                                   |
| `/goal blocked [note]`                              | Alias de `block`.                                                       |
| `/goal clear`                                       | Elimina el objetivo de la sesión.                                        |

Solo puede existir un objetivo en una sesión a la vez. Iniciar un segundo objetivo falla
con `Goal error: goal already exists` hasta que se borre el actual.

`/goal start` no acepta una marca de presupuesto de tokens; un presupuesto solo puede establecerse
mediante la herramienta orientada al modelo `create_goal`.

## Estados

- `active`: la sesión está persiguiendo el objetivo.
- `paused`: el operador pausó el objetivo; `/goal resume` lo vuelve a activar.
- `blocked`: el agente o el operador informó un bloqueo real; `/goal resume`
  lo vuelve a activar cuando hay nueva información o estado disponible.
- `budget_limited`: se alcanzó el presupuesto de tokens configurado; `/goal resume`
  reinicia la persecución desde el mismo objetivo con una ventana de presupuesto nueva.
- `usage_limited`: reservado para un futuro estado de parada por límite de uso; `/goal
resume` reinicia la persecución de la misma manera.
- `complete`: el objetivo se logró. Los objetivos completos son terminales; usa `/goal
clear` antes de iniciar otro objetivo.

`/new` y `/reset` borran el objetivo de la sesión actual, ya que intencionalmente
inician un contexto de sesión nuevo.

## Presupuestos de tokens

Los objetivos pueden tener un presupuesto de tokens positivo opcional, establecido mediante el
parámetro `token_budget` de la herramienta `create_goal`. El presupuesto se mide desde el
conteo de tokens fresco de la sesión en el momento de creación del objetivo. Si la sesión solo tiene una
instantánea de tokens obsoleta o desconocida cuando comienza el objetivo, OpenClaw espera la
siguiente instantánea fresca y la usa como línea base, de modo que los tokens gastados antes de que
existiera el objetivo no se le cargan.

Cuando el uso alcanza el presupuesto, el objetivo pasa a `budget_limited`. Esto no
elimina el objetivo ni borra el objetivo; indica al operador y al
agente que el objetivo ya no se está persiguiendo activamente hasta que se reanude o
se borre. Reanudar inicia una nueva ventana de presupuesto en el conteo de tokens fresco actual.

Los presupuestos de tokens son una barrera de protección para objetivos de sesión, no un límite de facturación. La cuota del proveedor,
los informes de coste y el comportamiento de la ventana de contexto siguen usando los controles normales
de uso y modelo de OpenClaw.

## Herramientas del modelo

OpenClaw expone tres herramientas de objetivo a los entornos de ejecución de agentes:

| Herramienta          | Propósito                                                                                                                  |
| ------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `get_goal`    | Lee el objetivo actual de la sesión: estado, objetivo, uso de tokens y presupuesto de tokens.                                         |
| `create_goal` | Crea un objetivo solo cuando el usuario o las instrucciones del sistema lo solicitan explícitamente. Falla si la sesión ya tiene un objetivo. |
| `update_goal` | Marca el objetivo como `complete` o `blocked`.                                                                                   |

El modelo no puede pausar, reanudar, borrar ni reemplazar un objetivo silenciosamente. Esos permanecen como
controles de operador/sesión mediante `/goal` y comandos de restablecimiento, para que el agente
pueda informar el logro o un bloqueo genuino sin mover discretamente la
meta.

`update_goal` debe marcar un objetivo como `complete` solo cuando el objetivo se haya
logrado realmente. Debe marcar un objetivo como `blocked` solo después de que la misma
condición de bloqueo se repita durante al menos tres turnos consecutivos del objetivo, no por
dificultad ordinaria ni por falta de pulido.

## Contexto de objetivo en cada turno

Cada turno de usuario/chat con un objetivo activo incluye esta línea de contexto de rol de usuario:

```text
Active goal: <objective> — advance it or update its status (get_goal/update_goal).
```

OpenClaw mantiene la línea compacta truncando los objetivos largos. Los objetivos pausados,
bloqueados, limitados por presupuesto, limitados por uso y completos no se inyectan,
por lo que una parada del operador permanece en vigor hasta que el objetivo se reanude.

## Control UI

La Control UI web muestra el objetivo como una píldora compacta encima del compositor del chat:
un icono de estado, la etiqueta de estado (por ejemplo `Pursuing goal`), el
objetivo truncado y un temporizador de tiempo transcurrido en vivo.

La píldora incluye controles en línea:

- **Lápiz** rellena previamente el compositor con `/goal edit <objective>` para que el
  objetivo pueda reformularse y enviarse.
- **Pausar / reanudar** alterna entre `/goal pause` y `/goal resume` según
  el estado actual.
- **Papelera** envía `/goal clear`.
- **Chevron** expande la píldora para mostrar el objetivo completo, la nota de estado más reciente,
  el uso de tokens y el tiempo transcurrido.

Los botones de acción se ocultan mientras el compositor no puede enviar (por ejemplo,
cuando la conexión del Gateway está caída); el chevron de expansión sigue funcionando.

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

El pie de página es intencionalmente compacto. Usa `/goal` para ver el objetivo completo,
la nota, el presupuesto de tokens y los comandos disponibles.

## Comportamiento en canales

`/goal` funciona en sesiones de OpenClaw con capacidad de comandos, incluida la TUI y
las superficies de chat que permiten comandos de texto. El estado del objetivo está asociado a la
clave de sesión, no al transporte, por lo que dos superficies que comparten una clave de sesión ven el
mismo objetivo.

El estado del objetivo no es una directiva de entrega: no fuerza respuestas a través de un
canal, cambia el comportamiento de la cola, aprueba herramientas ni programa trabajo.

## Solución de problemas

| Mensaje                                | Significado                                                                                                                                      |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `Goal error: goal already exists`      | La sesión ya tiene un objetivo. Usa `/goal` para inspeccionarlo, `/goal complete` si está listo, o `/goal clear` antes de iniciar un objetivo distinto. |
| `Goal error: goal not found`           | La sesión aún no tiene objetivo. Inicia uno con `/goal start <objective>`.                                                                       |
| `Goal error: goal is already complete` | El objetivo es terminal. Bórralo antes de iniciar o reanudar otro objetivo.                                                                |

Si el uso de tokens muestra `0` o parece obsoleto, es posible que la sesión activa aún no tenga una
instantánea de tokens fresca. El uso se actualiza a medida que OpenClaw registra el uso de la sesión
y los totales derivados de la transcripción.

## Relacionado

- [Comandos slash](/es/tools/slash-commands)
- [TUI](/es/web/tui)
- [Herramienta de sesión](/es/concepts/session-tool)
- [Compaction](/es/concepts/compaction)
- [TaskFlow](/es/automation/taskflow)
- [Órdenes permanentes](/es/automation/standing-orders)
