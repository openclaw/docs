---
doc-schema-version: 1
read_when:
    - Quieres que OpenClaw mantenga un objetivo visible durante una sesión larga
    - Necesitas pausar, reanudar, bloquear, completar o borrar un objetivo de sesión
    - Quieres comprender las herramientas get_goal, create_goal y update_goal
    - Quieres ver cómo aparecen los objetivos en la TUI
summary: 'Objetivos de sesión: objetivos duraderos por sesión, controles /goal, herramientas de objetivos del modelo, presupuestos de tokens y estado de TUI'
title: Objetivo
x-i18n:
    generated_at: "2026-06-27T13:05:26Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4313983dff7f37496f6c996303cace75f6863a71c8a9cd5367fdafbcc3f459c4
    source_path: tools/goal.md
    workflow: 16
---

# Objetivo

Un **objetivo** es una finalidad duradera adjunta a la sesión actual de OpenClaw.
Da al agente y al operador una meta compartida para trabajos de larga duración,
sin convertir esa meta en una tarea en segundo plano, recordatorio, trabajo Cron u
orden permanente.

Los objetivos son estado de sesión. Se mueven con la clave de sesión, sobreviven a
reinicios del proceso, aparecen en `/goal`, están disponibles para el modelo a
través de las herramientas de objetivo y aparecen en el pie de página de la TUI
cuando la sesión activa tiene uno.

## Inicio rápido

Establece un objetivo:

```text
/goal start get CI green for PR 87469 and push the fix
```

Consúltalo:

```text
/goal
```

Páusalo cuando el trabajo esté esperando intencionalmente:

```text
/goal pause waiting for CI
```

Reanúdalo:

```text
/goal resume
```

Márcalo como completado:

```text
/goal complete pushed and verified
```

Bórralo:

```text
/goal clear
```

## Para qué sirven los objetivos

Usa un objetivo cuando una sesión tenga un resultado concreto que deba seguir
visible durante muchos turnos:

- Cierre de una PR: corregir, verificar, ejecutar autoreview, enviar cambios y
  abrir o actualizar la PR.
- Ejecución de depuración: reproducir el error, identificar la superficie
  propietaria, aplicar el parche y demostrar la corrección.
- Revisión de documentación: leer la documentación relevante, escribir la nueva
  página, enlazarla de forma cruzada y verificar la compilación de la
  documentación.
- Tarea de mantenimiento: inspeccionar el estado actual, hacer cambios acotados,
  ejecutar las comprobaciones correctas e informar qué cambió.

Un objetivo no es una cola de tareas. Usa [TaskFlow](/es/automation/taskflow),
[tareas](/es/automation/tasks), [trabajos Cron](/es/automation/cron-jobs) u
[órdenes permanentes](/es/automation/standing-orders) cuando el trabajo deba
ejecutarse desacoplado, repetirse según un horario, desplegarse en subtrabajos
gestionados o persistir como una política.

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

Comandos:

- `/goal` o `/goal status` muestra el objetivo actual.
- `/goal start <objective>` crea un nuevo objetivo para la sesión actual.
- `/goal set <objective>` y `/goal create <objective>` son alias de `start`.
- `/goal pause [note]` pausa un objetivo activo.
- `/goal resume [note]` reanuda un objetivo pausado, bloqueado, limitado por uso
  o limitado por presupuesto.
- `/goal complete [note]` marca el objetivo como logrado.
- `/goal done [note]` es un alias de `complete`.
- `/goal block [note]` marca el objetivo como bloqueado.
- `/goal blocked [note]` es un alias de `block`.
- `/goal clear` elimina el objetivo de la sesión.

Solo puede existir un objetivo en una sesión a la vez. Iniciar un segundo
objetivo falla hasta que se borre el actual.

## Estados

Los objetivos usan un conjunto pequeño de estados:

- `active`: la sesión está persiguiendo el objetivo.
- `paused`: el operador pausó el objetivo; `/goal resume` lo vuelve a activar.
- `blocked`: el agente o el operador informó un bloqueador real; `/goal resume`
  lo vuelve a activar cuando hay nueva información o estado disponible.
- `budget_limited`: se alcanzó el presupuesto de tokens configurado; `/goal resume`
  reinicia la búsqueda desde el mismo objetivo.
- `usage_limited`: reservado para estados de detención por límite de uso;
  `/goal resume` reinicia la búsqueda cuando está permitido.
- `complete`: el objetivo se logró. Los objetivos completados son terminales; usa
  `/goal clear` antes de iniciar otro objetivo.

`/new` y `/reset` borran el objetivo de la sesión actual porque intencionalmente
inician un contexto de sesión nuevo.

## Presupuestos de tokens

Los objetivos pueden tener un presupuesto de tokens positivo opcional. El
presupuesto se almacena con el objetivo y se mide desde el recuento nuevo de
tokens de la sesión en el momento de creación. Si la sesión actual solo tiene uso
de tokens obsoleto o desconocido cuando comienza el objetivo, OpenClaw espera la
siguiente instantánea nueva de tokens de sesión y la usa como línea base, de modo
que los tokens gastados antes de que existiera el objetivo no se cargan al
objetivo.

Cuando el uso de tokens alcanza el presupuesto, el objetivo cambia a
`budget_limited`. Esto no elimina el objetivo ni borra la finalidad. Indica al
operador y al agente que el objetivo ya no se está persiguiendo activamente hasta
que se reanude o se borre.

Los presupuestos de tokens son una barrera de seguridad para objetivos de sesión,
no un límite de facturación. La cuota del proveedor, los informes de costos y el
comportamiento de la ventana de contexto siguen usando los controles normales de
uso y modelo de OpenClaw.

## Herramientas del modelo

OpenClaw expone tres herramientas de objetivo principales a los arneses de agente:

- `get_goal`: lee el objetivo de la sesión actual, incluidos estado, finalidad,
  uso de tokens y presupuesto de tokens.
- `create_goal`: crea un objetivo solo cuando las instrucciones del usuario, del
  sistema o del desarrollador lo solicitan explícitamente. Falla si la sesión ya
  tiene un objetivo.
- `update_goal`: marca el objetivo como `complete` o `blocked`.

El modelo no puede pausar, reanudar, borrar ni reemplazar un objetivo en silencio.
Esos son controles de operador/sesión mediante `/goal` y comandos de reinicio.
Esto impide que el agente mueva la meta discretamente, a la vez que conserva una
ruta limpia para que el agente informe el logro o un bloqueador genuino.

La herramienta `update_goal` debe marcar un objetivo como `complete` solo cuando
la finalidad se haya logrado realmente. Debe marcar un objetivo como `blocked`
solo cuando se haya repetido la misma condición bloqueante y el agente no pueda
avanzar de forma significativa sin nueva entrada del usuario o un cambio de
estado externo.

## TUI

La TUI mantiene visible el objetivo de la sesión activa en el pie de página junto
al agente, la sesión, el modelo, los controles de ejecución y los recuentos de
tokens.

Ejemplos de pie de página:

- `Pursuing goal (12k/50k)` para un objetivo activo con presupuesto de tokens.
- `Goal paused (/goal resume)` para un objetivo pausado.
- `Goal blocked (/goal resume)` para un objetivo bloqueado.
- `Goal hit usage limits (/goal resume)` para un objetivo limitado por uso.
- `Goal unmet (50k/50k)` para un objetivo limitado por presupuesto.
- `Goal achieved (42k)` para un objetivo completado.

El pie de página es intencionalmente compacto. Usa `/goal` para ver la finalidad
completa, la nota, el presupuesto de tokens y los comandos disponibles.

## Comportamiento de canales

El comando `/goal` funciona en sesiones de OpenClaw con capacidad de comandos,
incluidas la TUI y las superficies de chat que permiten comandos de texto. El
estado del objetivo se adjunta a la clave de sesión, no al transporte. Si dos
superficies usan la misma sesión, ven el mismo objetivo.

El estado del objetivo no es una directiva de entrega. No fuerza respuestas a
través de un canal, cambia el comportamiento de la cola, aprueba herramientas ni
programa trabajo.

## Solución de problemas

`Goal error: goal already exists` significa que la sesión ya tiene un objetivo.
Usa `/goal` para inspeccionarlo, `/goal complete` si está terminado o
`/goal clear` antes de iniciar una finalidad diferente.

`Goal error: goal not found` significa que la sesión aún no tiene objetivo.
Inicia uno con `/goal start <objective>`.

`Goal error: goal is already complete` significa que el objetivo es terminal.
Bórralo antes de iniciar o reanudar otra finalidad.

Si el uso de tokens aparece como `0` u obsoleto, es posible que la sesión activa
aún no tenga una instantánea nueva de tokens. El uso se actualiza a medida que
OpenClaw registra el uso de sesión y los totales derivados de la transcripción.

## Relacionado

- [Comandos de barra](/es/tools/slash-commands)
- [TUI](/es/web/tui)
- [Herramienta de sesión](/es/concepts/session-tool)
- [Compaction](/es/concepts/compaction)
- [TaskFlow](/es/automation/taskflow)
- [Órdenes permanentes](/es/automation/standing-orders)
