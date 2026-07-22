---
doc-schema-version: 1
read_when:
    - Quieres que OpenClaw mantenga un objetivo visible durante una sesión prolongada
    - Necesita pausar, reanudar, bloquear, completar o borrar el objetivo de una sesión.
    - Se desea comprender las herramientas get_goal, create_goal y update_goal
    - Se quiere ver cómo aparecen los objetivos en la TUI
summary: 'Objetivos de sesión: objetivos duraderos por sesión, controles de /goal, herramientas de objetivos del modelo, presupuestos de tokens y estado de la TUI'
title: Objetivo
x-i18n:
    generated_at: "2026-07-21T22:45:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8bfe25eb9901394b32b61729fbcb6a7bd711ed859d284fa39b637000ed7f0a18
    source_path: tools/goal.md
    workflow: 16
---

# Objetivo

Un **objetivo** es una meta duradera asociada a la sesión actual de OpenClaw.
Proporciona al agente y al operador una meta compartida para el trabajo de larga duración,
sin convertirla en una tarea en segundo plano, un recordatorio, un trabajo Cron ni una
orden permanente.

Los objetivos forman parte del estado de la sesión: se trasladan con la clave de sesión, sobreviven a los
reinicios del proceso y aparecen en `/goal`, en las herramientas de objetivo disponibles para el modelo y en el pie
de la TUI.

Las finalizaciones de comandos desacoplados regresan al hilo orientado al usuario de origen, por lo que
el siguiente turno sigue viendo el mismo objetivo incluso cuando la ejecución del comando utilizó
una sesión independiente con otra política de entorno aislado.

## Inicio rápido

```text
/goal start conseguir que la CI pase para el PR 87469 y enviar la corrección
/goal
/goal edit conseguir que la CI pase para el PR 87469, enviar la corrección y actualizar la documentación
/goal pause esperando a la CI
/goal resume
/goal complete enviado y verificado
/goal clear
```

`start` es opcional: `/goal get CI green for PR 87469` también crea un objetivo,
ya que cualquier texto después de `/goal` que no sea una palabra de acción conocida se trata como un
nuevo objetivo.

## Para qué sirven los objetivos

Use un objetivo cuando una sesión tenga un resultado concreto que deba permanecer visible
durante muchos turnos:

- Cierre de un PR: corregir, verificar, ejecutar la revisión automática, enviar y abrir o actualizar el PR.
- Una sesión de depuración: reproducir el error, identificar la superficie responsable, aplicar un parche y
  demostrar la corrección.
- Una revisión de documentación: leer la documentación pertinente, escribir la página nueva, añadir enlaces cruzados y
  verificar la compilación de la documentación.
- Una tarea de mantenimiento: inspeccionar el estado actual, realizar cambios acotados, ejecutar las
  comprobaciones adecuadas e informar de los cambios.

Un objetivo no es una cola de tareas. Use [Task Flow](/es/automation/taskflow),
[tareas](/es/automation/tasks), [trabajos Cron](/es/automation/cron-jobs) u
[órdenes permanentes](/es/automation/standing-orders) cuando el trabajo deba ejecutarse de forma desacoplada,
repetirse según una programación, distribuirse en subtareas gestionadas o persistir como política.

## Referencia de comandos

`/goal` sin argumentos muestra el resumen del objetivo actual:

```text
Objetivo
Estado: activo
Objetivo: conseguir que la CI pase para el PR 87469 y enviar la corrección
Tokens usados: 12k
Presupuesto de tokens: 12k/50k

Comandos: /goal edit <objective>, /goal pause, /goal complete, /goal clear
```

| Comando                                             | Efecto                                                                   |
| --------------------------------------------------- | ------------------------------------------------------------------------ |
| `/goal` o `/goal status`                           | Muestra el objetivo actual.                                                   |
| `/goal start <objective>`                           | Crea un objetivo nuevo para la sesión actual.                               |
| `/goal set <objective>`, `/goal create <objective>` | Alias de `start`.                                                     |
| `/goal <objective>`                                 | También crea un objetivo nuevo (cualquier texto que no sea una palabra de acción reconocida). |
| `/goal edit <objective>`                            | Reformula el objetivo actual; el estado y la contabilización de tokens se mantienen.      |
| `/goal pause [note]`                                | Pausa un objetivo activo.                                                    |
| `/goal resume [note]`                               | Reanuda un objetivo pausado, bloqueado, limitado por uso o limitado por presupuesto.         |
| `/goal complete [note]`                             | Marca el objetivo como alcanzado.                                                  |
| `/goal done [note]`                                 | Alias de `complete`.                                                    |
| `/goal block [note]`                                | Marca el objetivo como bloqueado.                                                   |
| `/goal blocked [note]`                              | Alias de `block`.                                                       |
| `/goal clear`                                       | Elimina el objetivo de la sesión.                                        |

Solo puede existir un objetivo por sesión a la vez. El intento de iniciar un segundo objetivo falla
con `Goal error: goal already exists` hasta que se elimine el actual.

`/goal start` no acepta una opción de presupuesto de tokens; el presupuesto solo puede establecerse
mediante la herramienta `create_goal` disponible para el modelo.

## Estados

- `active`: la sesión está persiguiendo el objetivo.
- `paused`: el operador pausó el objetivo; `/goal resume` vuelve a activarlo.
- `blocked`: el agente o el operador informó de un bloqueo real; `/goal resume`
  vuelve a activarlo cuando hay información o un estado nuevos disponibles.
- `budget_limited`: se alcanzó el presupuesto de tokens configurado; `/goal resume`
  reinicia la consecución del mismo objetivo con un nuevo intervalo de presupuesto.
- `usage_limited`: reservado para un futuro estado de detención por límite de uso; `/goal
resume` reinicia la consecución del mismo modo.
- `complete`: se alcanzó el objetivo. Los objetivos completados son terminales; use `/goal
clear` antes de iniciar otro objetivo.

`/new` y `/reset` eliminan el objetivo de la sesión actual, ya que inician
intencionadamente un contexto de sesión nuevo.

## Presupuestos de tokens

Los objetivos pueden tener un presupuesto de tokens positivo opcional, establecido mediante el
parámetro `token_budget` de la herramienta `create_goal`. El presupuesto se mide desde el
recuento actualizado de tokens de la sesión en el momento de crear el objetivo. Si la sesión solo dispone de una
instantánea de tokens obsoleta o desconocida cuando se inicia el objetivo, OpenClaw espera a la
siguiente instantánea actualizada y la usa como referencia, por lo que no se contabilizan los tokens consumidos antes de
que existiera el objetivo.

Cuando el uso alcanza el presupuesto, el objetivo pasa a `budget_limited`. Esto no
elimina el objetivo ni borra su descripción; indica al operador y al
agente que el objetivo ya no se está persiguiendo activamente hasta que se reanude o
elimine. Al reanudarlo, se inicia un nuevo intervalo de presupuesto a partir del recuento
actualizado de tokens vigente.

Los presupuestos de tokens son un mecanismo de protección para el objetivo de la sesión, no un límite de facturación. La
cuota del proveedor, los informes de costes y el comportamiento de la ventana de contexto siguen utilizando los
controles normales de uso y modelo de OpenClaw.

## Herramientas del modelo

OpenClaw expone tres herramientas de objetivo a los entornos de agentes:

| Herramienta          | Finalidad                                                                                                                  |
| ------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `get_goal`    | Lee el objetivo de la sesión actual: estado, descripción, uso de tokens y presupuesto de tokens.                                         |
| `create_goal` | Crea un objetivo solo cuando el usuario o las instrucciones del sistema lo solicitan explícitamente. Falla si la sesión ya tiene un objetivo. |
| `update_goal` | Marca el objetivo como `complete` o `blocked`.                                                                                   |

El modelo no puede pausar, reanudar, eliminar ni sustituir silenciosamente un objetivo. Estas acciones siguen siendo
controles del operador o de la sesión mediante `/goal` y los comandos de restablecimiento, para que el agente
pueda informar de la consecución o de un bloqueo real sin cambiar silenciosamente la
meta.

`update_goal` solo debe marcar un objetivo como `complete` cuando este se haya
alcanzado realmente. Solo debe marcar un objetivo como `blocked` después de que la misma
condición de bloqueo se repita durante al menos tres turnos consecutivos del objetivo, no por
dificultades normales ni por retoques pendientes.

## Contexto del objetivo en cada turno

Cada turno de usuario o chat con un objetivo activo incluye esta línea de contexto con rol de usuario:

```text
Objetivo activo: <objective> — aváncelo o actualice su estado (get_goal/update_goal).
```

OpenClaw mantiene la línea compacta truncando los objetivos largos. Los objetivos pausados,
bloqueados, limitados por presupuesto, limitados por uso y completados no se insertan,
por lo que una detención del operador permanece vigente hasta que se reanuda el objetivo.

## Interfaz de control

La interfaz web de control muestra el objetivo como una etiqueta compacta encima del cuadro de redacción del chat:
un icono de estado, la etiqueta del estado (por ejemplo, `Pursuing goal`), el
objetivo truncado y un temporizador en vivo del tiempo transcurrido.

La etiqueta incluye controles integrados:

- **Lápiz** rellena previamente el cuadro de redacción con `/goal edit <objective>` para poder
  reformular y enviar el objetivo.
- **Pausar/reanudar** alterna entre `/goal pause` y `/goal resume` según
  el estado actual.
- **Papelera** envía `/goal clear`.
- **Chevrón** expande la etiqueta para mostrar el objetivo completo, la última nota de
  estado, el uso de tokens y el tiempo transcurrido.

Los botones de acción permanecen ocultos mientras el cuadro de redacción no puede enviar mensajes (por ejemplo,
cuando la conexión con el Gateway está caída); el chevrón de expansión sigue funcionando.

## TUI

El pie de la TUI mantiene visible el objetivo de la sesión activa junto a los campos de agente,
sesión y modelo, antes de los indicadores de tokens y modo.

Ejemplos del pie:

- `Pursuing goal (12k/50k)` para un objetivo activo con presupuesto de tokens.
- `Goal paused (/goal resume)` para un objetivo pausado.
- `Goal blocked (/goal resume)` para un objetivo bloqueado.
- `Goal hit usage limits (/goal resume)` para un objetivo limitado por uso.
- `Goal unmet (50k/50k)` para un objetivo limitado por presupuesto.
- `Goal achieved (42k)` para un objetivo completado.

El pie es intencionadamente compacto. Use `/goal` para ver el objetivo completo,
la nota, el presupuesto de tokens y los comandos disponibles.

## Comportamiento del canal

`/goal` funciona en sesiones de OpenClaw compatibles con comandos, incluidas la TUI y
las superficies de chat que permiten comandos de texto. El estado del objetivo está asociado a la
clave de sesión, no al transporte, por lo que dos superficies que comparten una clave de sesión ven el
mismo objetivo.

El estado del objetivo no es una directiva de entrega: no obliga a enviar respuestas a través de un
canal, no cambia el comportamiento de la cola, no aprueba herramientas ni programa trabajo.

## Solución de problemas

| Mensaje                                | Significado                                                                                                                                      |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `Goal error: goal already exists`      | La sesión ya tiene un objetivo. Use `/goal` para inspeccionarlo, `/goal complete` si ha terminado o `/goal clear` antes de iniciar un objetivo diferente. |
| `Goal error: goal not found`           | La sesión aún no tiene ningún objetivo. Inicie uno con `/goal start <objective>`.                                                                       |
| `Goal error: goal is already complete` | El objetivo es terminal. Elimínelo antes de iniciar o reanudar otro objetivo.                                                                |

Si el uso de tokens muestra `0` o parece obsoleto, es posible que la sesión activa aún no tenga una
instantánea actualizada de tokens. El uso se actualiza a medida que OpenClaw registra el uso de la sesión
y los totales derivados de la transcripción.

## Contenido relacionado

- [Comandos con barra](/es/tools/slash-commands)
- [TUI](/es/web/tui)
- [Herramienta de sesión](/es/concepts/session-tool)
- [Compaction](/es/concepts/compaction)
- [Task Flow](/es/automation/taskflow)
- [Órdenes permanentes](/es/automation/standing-orders)
