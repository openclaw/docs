---
read_when:
    - Usar /steer o /tell mientras un agente ya está en ejecución
    - Comparación de los modos /steer y /queue
    - Decidir si dirigir la ejecución actual o una sesión ACP
sidebarTitle: Steer
summary: Dirige una ejecución activa sin cambiar el modo de cola
title: Dirigir
x-i18n:
    generated_at: "2026-06-27T13:09:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2e73f3f2fd938ee9dbdd14d183abe7f8676dbc7bb7382e6ad2c1fd41034fa09c
    source_path: tools/steer.md
    workflow: 16
---

`/steer` primero intenta enviar orientación a una ejecución ya activa. Es para
momentos de "ajusta esta ejecución mientras todavía está trabajando". Si el runtime actual
no puede aceptar steering, OpenClaw envía el mensaje como un prompt normal en lugar
de descartarlo.

## Sesión actual

Usa `/steer` de nivel superior para apuntar a la ejecución activa de la sesión actual:

```text
/steer prefer the smaller patch and keep the tests focused
/tell summarize before making the next tool call
```

Comportamiento:

- Apunta solo a la ejecución activa de la sesión actual.
- Funciona independientemente del modo `/queue` de la sesión.
- Inicia un turno normal con el mismo mensaje cuando la sesión está inactiva o la
  ejecución activa no puede aceptar steering.
- Usa la ruta de steering del runtime activo, por lo que el modelo ve la orientación en
  el siguiente límite de runtime compatible.

## Steer frente a queue

`/queue steer` hace que los mensajes entrantes normales intenten dirigir la ejecución activa cuando
llegan mientras una ejecución está activa. `/steer <message>` es un comando explícito
que intenta inyectar el mensaje de ese comando en la ejecución activa en el siguiente
límite de runtime compatible, sin importar la configuración de `/queue` almacenada. Cuando
esa inyección no está disponible, se elimina el prefijo del comando y `<message>`
continúa como un prompt normal.

Uso:

- `/steer <message>` cuando quieres guiar la ejecución activa ahora mismo.
- `/queue steer` cuando quieres que los futuros mensajes normales dirijan las ejecuciones activas de forma
  predeterminada.
- `/queue collect` o `/queue followup` cuando los futuros mensajes normales deben esperar
  a un turno posterior en lugar de dirigir la ejecución activa.
- `/queue interrupt` cuando el mensaje más reciente debe reemplazar la ejecución activa
  en lugar de dirigirla.

Para los modos de cola y los límites de steering, consulta [Cola de comandos](/es/concepts/queue) y
[Cola de steering](/es/concepts/queue-steering).

## Sub-agentes

`/steer` de nivel superior apunta a la ejecución activa de la sesión actual. Los subagentes informan
a su sesión padre/solicitante; `/subagents` es solo para visibilidad.

## Sesiones ACP

Usa `/acp steer` cuando el objetivo sea una sesión de harness ACP:

```text
/acp steer --session agent:main:acp:codex tighten the repro
```

Consulta [Agentes ACP](/es/tools/acp-agents) para la selección de sesiones ACP y el comportamiento de runtime.

## Relacionado

- [Comandos slash](/es/tools/slash-commands)
- [Cola de comandos](/es/concepts/queue)
- [Cola de steering](/es/concepts/queue-steering)
- [Sub-agentes](/es/tools/subagents)
