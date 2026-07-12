---
read_when:
    - Usar /steer o /tell mientras un agente ya está en ejecución
    - Comparación de /steer con los modos de /queue
    - Decidir si redirigir la ejecución actual o una sesión de ACP
sidebarTitle: Steer
summary: Dirigir una ejecución activa sin cambiar el modo de cola
title: Dirigir
x-i18n:
    generated_at: "2026-07-11T23:39:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2e73f3f2fd938ee9dbdd14d183abe7f8676dbc7bb7382e6ad2c1fd41034fa09c
    source_path: tools/steer.md
    workflow: 16
---

`/steer` primero intenta enviar indicaciones a una ejecución que ya está activa. Sirve para
momentos en los que se desea «ajustar esta ejecución mientras aún está en curso». Si el entorno de ejecución actual
no puede aceptar indicaciones, OpenClaw envía el mensaje como un prompt normal en lugar
de descartarlo.

## Sesión actual

Use `/steer` en el nivel superior para dirigirse a la ejecución activa de la sesión actual:

```text
/steer prefer the smaller patch and keep the tests focused
/tell summarize before making the next tool call
```

Comportamiento:

- Se dirige únicamente a la ejecución activa de la sesión actual.
- Funciona independientemente del modo `/queue` de la sesión.
- Inicia un turno normal con el mismo mensaje cuando la sesión está inactiva o la
  ejecución activa no puede aceptar indicaciones.
- Usa la ruta de indicaciones del entorno de ejecución activo, por lo que el modelo recibe las indicaciones en
  el siguiente límite compatible del entorno de ejecución.

## Indicaciones frente a cola

`/queue steer` hace que los mensajes entrantes normales intenten proporcionar indicaciones a la ejecución activa cuando
llegan mientras hay una ejecución activa. `/steer <message>` es un comando explícito
que intenta inyectar el mensaje de ese comando en la ejecución activa en el siguiente
límite compatible del entorno de ejecución, independientemente de la configuración almacenada de `/queue`. Cuando
esa inyección no está disponible, se elimina el prefijo del comando y `<message>`
continúa como un prompt normal.

Uso:

- `/steer <message>` cuando quiera guiar la ejecución activa en ese momento.
- `/queue steer` cuando quiera que los futuros mensajes normales proporcionen indicaciones a las ejecuciones activas de forma
  predeterminada.
- `/queue collect` o `/queue followup` cuando los futuros mensajes normales deban esperar
  a un turno posterior en lugar de proporcionar indicaciones a la ejecución activa.
- `/queue interrupt` cuando el mensaje más reciente deba reemplazar la ejecución activa
  en lugar de proporcionarle indicaciones.

Para conocer los modos de cola y los límites de las indicaciones, consulte [Cola de comandos](/es/concepts/queue) y
[Cola de indicaciones](/es/concepts/queue-steering).

## Subagentes

El comando `/steer` de nivel superior se dirige a la ejecución activa de la sesión actual. Los subagentes informan
a su sesión superior o solicitante; `/subagents` solo proporciona visibilidad.

## Sesiones ACP

Use `/acp steer` cuando el destino sea una sesión de arnés ACP:

```text
/acp steer --session agent:main:acp:codex tighten the repro
```

Consulte [Agentes ACP](/es/tools/acp-agents) para obtener información sobre la selección de sesiones ACP y el comportamiento del entorno de
ejecución.

## Contenido relacionado

- [Comandos con barra](/es/tools/slash-commands)
- [Cola de comandos](/es/concepts/queue)
- [Cola de indicaciones](/es/concepts/queue-steering)
- [Subagentes](/es/tools/subagents)
