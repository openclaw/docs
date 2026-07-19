---
read_when:
    - Uso de /steer o /tell mientras un agente ya está en ejecución
    - Comparación de /steer con los modos de /queue
    - Decidir si dirigir la ejecución actual o una sesión ACP
sidebarTitle: Steer
summary: Orienta una ejecución activa sin cambiar el modo de cola
title: Dirigir
x-i18n:
    generated_at: "2026-07-19T02:09:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: d420e14982d52520e415103ffa6d86923fad6f13c43ff7741ebbd8dde0d0073f
    source_path: tools/steer.md
    workflow: 16
---

`/steer` primero intenta enviar instrucciones a una ejecución que ya está activa. Está pensado para
situaciones en las que se desea «ajustar esta ejecución mientras aún está trabajando». Si el entorno de ejecución actual
no puede aceptar instrucciones, OpenClaw envía el mensaje como un prompt normal en lugar
de descartarlo.

## Sesión actual

Use `/steer` de nivel superior para dirigirse a la ejecución activa de la sesión actual:

```text
/steer prefer the smaller patch and keep the tests focused
/tell summarize before making the next tool call
```

Comportamiento:

- Se dirige únicamente a la ejecución activa de la sesión actual.
- Funciona independientemente del modo `/queue` de la sesión.
- Inicia un turno normal con el mismo mensaje cuando la sesión está inactiva o la
  ejecución activa no puede aceptar instrucciones.
- Utiliza la ruta de instrucciones del entorno de ejecución activo, por lo que el modelo recibe las instrucciones en
  el siguiente límite compatible del entorno de ejecución.

## Instrucciones frente a cola

`/queue steer` hace que los mensajes entrantes normales intenten dar instrucciones a la ejecución activa cuando
llegan mientras hay una ejecución activa. `/steer <message>` es un comando explícito
que intenta inyectar el mensaje de ese comando en la ejecución activa en el siguiente
límite compatible del entorno de ejecución, independientemente del ajuste `/queue` almacenado. Cuando
esa inyección no está disponible, se elimina el prefijo del comando y `<message>`
continúa como un prompt normal.

El comando explícito `/steer` (y `/tell`) está respaldado por el Gateway. En
`openclaw chat` o `openclaw tui --local`, seleccione `/queue steer` y envíe las
instrucciones como un mensaje normal; el entorno de ejecución integrado aplica la misma política de instrucciones
sin reenviar un comando del Gateway.

Use:

- `/steer <message>` cuando quiera orientar la ejecución activa en ese momento.
- `/queue steer` cuando quiera que, de forma predeterminada, los futuros mensajes normales den instrucciones a las ejecuciones activas.
- `/queue collect` o `/queue followup` cuando los futuros mensajes normales deban esperar
  a un turno posterior en lugar de dar instrucciones a la ejecución activa.
- `/queue interrupt` cuando el mensaje más reciente deba sustituir la ejecución activa
  en lugar de darle instrucciones.

Para obtener información sobre los modos de cola y los límites de las instrucciones, consulte [Cola de comandos](/es/concepts/queue) y
[Cola de instrucciones](/es/concepts/queue-steering).

## Subagentes

`/steer` de nivel superior se dirige a la ejecución activa de la sesión actual. Los subagentes informan
a su sesión superior/solicitante; `/subagents` solo sirve para aportar visibilidad.

## Sesiones de ACP

Use `/acp steer` cuando el destino sea una sesión del entorno de pruebas de ACP:

```text
/acp steer --session agent:main:acp:codex tighten the repro
```

Consulte [Agentes de ACP](/es/tools/acp-agents) para obtener información sobre la selección de sesiones de ACP y el comportamiento del entorno
de ejecución.

## Contenido relacionado

- [Comandos con barra diagonal](/es/tools/slash-commands)
- [Cola de comandos](/es/concepts/queue)
- [Cola de instrucciones](/es/concepts/queue-steering)
- [Subagentes](/es/tools/subagents)
