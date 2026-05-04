---
read_when:
    - Usar /steer o /tell mientras un agente ya se está ejecutando
    - Comparación de /steer con /queue steer
    - Decidir si dirigir la ejecución actual, un subagente o una sesión ACP
sidebarTitle: Steer
summary: Dirigir una ejecución activa sin cambiar el modo de cola
title: Dirigir
x-i18n:
    generated_at: "2026-05-04T02:26:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 71e1c80c0eea86d5c3c29513d3ed0675c04779fc9c6ee3b8a76c4bedaa264d22
    source_path: tools/steer.md
    workflow: 16
---

`/steer` envía indicaciones a una ejecución ya activa. Es para momentos de "ajustar esta
ejecución mientras todavía está trabajando", no para iniciar un turno nuevo.

## Sesión actual

Usa `/steer` de nivel superior para apuntar a la ejecución activa de la sesión actual:

```text
/steer prefer the smaller patch and keep the tests focused
/tell summarize before making the next tool call
```

Comportamiento:

- Apunta solo a la ejecución activa de la sesión actual.
- Funciona independientemente del modo `/queue` de la sesión.
- No inicia una nueva ejecución cuando la sesión está inactiva.
- Responde con una advertencia cuando no hay ninguna ejecución activa que orientar.
- Usa la ruta de orientación del entorno de ejecución activo, por lo que el modelo ve las indicaciones en
  el siguiente límite compatible del entorno de ejecución.

## Orientación frente a cola

`/queue steer` cambia cómo se comportan los mensajes entrantes normales cuando llegan
mientras una ejecución está activa. `/steer <message>` es un comando explícito que intenta
inyectar el mensaje de ese comando en la ejecución activa en el siguiente límite compatible del entorno de ejecución,
independientemente de la configuración `/queue` almacenada.

Uso:

- `/steer <message>` cuando quieres guiar la ejecución activa ahora mismo.
- `/queue steer` cuando quieres que los mensajes normales futuros orienten las ejecuciones activas de forma
  predeterminada.
- `/queue collect` o `/queue followup` cuando los mensajes nuevos deben esperar a un
  turno posterior en lugar de orientar la ejecución activa.

Para los modos de cola y el comportamiento de reserva, consulta [Cola de comandos](/es/concepts/queue) y
[Cola de orientación](/es/concepts/queue-steering).

## Subagentes

Usa `/subagents steer` cuando el destino sea una ejecución secundaria:

```text
/subagents steer 2 focus only on the API surface
```

`/steer` de nivel superior no selecciona un subagente por id ni por índice de lista. Siempre
apunta a la ejecución activa de la sesión actual. Consulta [Subagentes](/es/tools/subagents) para
los ids, las etiquetas y los comandos de control de subagentes.

## Sesiones ACP

Usa `/acp steer` cuando el destino sea una sesión de arnés ACP:

```text
/acp steer --session agent:main:acp:codex tighten the repro
```

Consulta [Agentes ACP](/es/tools/acp-agents) para la selección de sesiones ACP y el comportamiento del entorno
de ejecución.

## Relacionado

- [Comandos slash](/es/tools/slash-commands)
- [Cola de comandos](/es/concepts/queue)
- [Cola de orientación](/es/concepts/queue-steering)
- [Subagentes](/es/tools/subagents)
