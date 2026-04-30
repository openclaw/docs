---
read_when:
    - Cambiar la ejecución o la concurrencia de la respuesta automática
    - Explicación de los modos de /queue o del comportamiento de encaminamiento de mensajes
summary: Modos de cola de respuesta automática, valores predeterminados y anulaciones por sesión
title: Cola de comandos
x-i18n:
    generated_at: "2026-04-30T05:38:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2ac0c0ded9558b080714fa4b8be0d552f985911bf19b427020f9654ae4955b2d
    source_path: concepts/queue.md
    workflow: 16
---

Serializamos las ejecuciones entrantes de respuesta automática (todos los canales) mediante una pequeña cola en proceso para evitar que varias ejecuciones de agentes colisionen, sin dejar de permitir paralelismo seguro entre sesiones.

## Por qué

- Las ejecuciones de respuesta automática pueden ser costosas (llamadas a LLM) y pueden colisionar cuando llegan varios mensajes entrantes con poca separación.
- La serialización evita competir por recursos compartidos (archivos de sesión, registros, stdin de la CLI) y reduce la probabilidad de límites de tasa del proveedor.

## Cómo funciona

- Una cola FIFO consciente de carriles drena cada carril con un límite de concurrencia configurable (predeterminado 1 para carriles no configurados; main predetermina 4, subagent a 8).
- `runEmbeddedPiAgent` encola por **clave de sesión** (carril `session:<key>`) para garantizar que solo haya una ejecución activa por sesión.
- Cada ejecución de sesión se encola luego en un **carril global** (`main` de forma predeterminada) para que el paralelismo total quede limitado por `agents.defaults.maxConcurrent`.
- Cuando el registro detallado está habilitado, las ejecuciones encoladas emiten un aviso breve si esperaron más de ~2 s antes de iniciarse.
- Los indicadores de escritura se activan inmediatamente al encolar (cuando el canal lo admite), por lo que la experiencia de usuario no cambia mientras esperamos nuestro turno.

## Valores predeterminados

Cuando no se configuran, todas las superficies de canales entrantes usan:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

`steer` es el valor predeterminado porque mantiene receptivo el turno del modelo activo sin
iniciar una segunda ejecución de sesión. Drena todos los mensajes de direccionamiento que llegaron
antes del siguiente límite del modelo. Si la ejecución actual no puede aceptar direccionamiento,
OpenClaw recurre a una entrada de cola de seguimiento.

## Modos de cola

Los mensajes entrantes pueden dirigir la ejecución actual, esperar a un turno de seguimiento, o ambas cosas:

- `steer`: encola mensajes de direccionamiento en el runtime activo. Pi entrega todos los mensajes de direccionamiento pendientes **después de que el turno actual del asistente termine de ejecutar sus llamadas a herramientas**, antes de la siguiente llamada al LLM; el servidor de aplicaciones Codex recibe un único `turn/steer` agrupado. Si la ejecución no está transmitiendo activamente o el direccionamiento no está disponible, OpenClaw recurre a una entrada de cola de seguimiento.
- `queue` (heredado): direccionamiento antiguo de uno en uno. Pi entrega un mensaje de direccionamiento encolado en cada límite del modelo; el servidor de aplicaciones Codex recibe solicitudes `turn/steer` separadas. Prefiere `steer` salvo que necesites el comportamiento serializado anterior.
- `followup`: encola cada mensaje para un turno posterior del agente después de que termine la ejecución actual.
- `collect`: fusiona los mensajes encolados en un **único** turno de seguimiento después de la ventana de silencio. Si los mensajes apuntan a canales/hilos diferentes, se drenan individualmente para preservar el enrutamiento.
- `steer-backlog` (también `steer+backlog`): dirige ahora **y** conserva el mismo mensaje para un turno de seguimiento.
- `interrupt` (heredado): aborta la ejecución activa de esa sesión y luego ejecuta el mensaje más reciente.

Steer-backlog significa que puedes obtener una respuesta de seguimiento después de la ejecución dirigida, por lo que
las superficies de streaming pueden parecer duplicados. Prefiere `collect`/`steer` si quieres
una respuesta por mensaje entrante.

Para el comportamiento de tiempos y dependencias específico del runtime, consulta
[Cola de direccionamiento](/es/concepts/queue-steering).

Configura de forma global o por canal mediante `messages.queue`:

```json5
{
  messages: {
    queue: {
      mode: "steer",
      debounceMs: 500,
      cap: 20,
      drop: "summarize",
      byChannel: { discord: "collect" },
    },
  },
}
```

## Opciones de cola

Las opciones se aplican a `followup`, `collect` y `steer-backlog` (y a `steer` o al `queue` heredado cuando el direccionamiento recurre a seguimiento):

- `debounceMs`: ventana de silencio antes de drenar seguimientos encolados. Los números sin unidad son milisegundos; las opciones de `/queue` aceptan las unidades `ms`, `s`, `m`, `h` y `d`.
- `cap`: máximo de mensajes encolados por sesión. Se ignoran los valores inferiores a `1`.
- `drop: "summarize"`: predeterminado. Descarta las entradas encoladas más antiguas según sea necesario, conserva resúmenes compactos y los inyecta como una instrucción sintética de seguimiento.
- `drop: "old"`: descarta las entradas encoladas más antiguas según sea necesario, sin conservar resúmenes.
- `drop: "new"`: rechaza el mensaje más reciente cuando la cola ya está llena.

Valores predeterminados: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Precedencia

Para la selección de modo, OpenClaw resuelve:

1. Anulación `/queue` en línea o almacenada por sesión.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. Valor predeterminado `steer`.

Para las opciones, las opciones `/queue` en línea o almacenadas tienen prioridad sobre la configuración. Después se aplican
el debounce específico del canal (`messages.queue.debounceMsByChannel`), los valores predeterminados de debounce del Plugin,
las opciones globales de `messages.queue` y los valores predeterminados integrados. `cap` y `drop` son opciones globales/de sesión, no claves de configuración por canal.

## Anulaciones por sesión

- Envía `/queue <mode>` como comando independiente para almacenar el modo de la sesión actual.
- Las opciones se pueden combinar: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` o `/queue reset` borra la anulación de sesión.

## Alcance y garantías

- Se aplica a las ejecuciones de agentes de respuesta automática en todos los canales entrantes que usan la canalización de respuestas del Gateway (web de WhatsApp, Telegram, Slack, Discord, Signal, iMessage, chat web, etc.).
- El carril predeterminado (`main`) es de alcance de proceso para entradas + heartbeats principales; define `agents.defaults.maxConcurrent` para permitir varias sesiones en paralelo.
- Pueden existir carriles adicionales (por ejemplo, `cron`, `cron-nested`, `nested`, `subagent`) para que los trabajos en segundo plano puedan ejecutarse en paralelo sin bloquear las respuestas entrantes. Los turnos aislados de agentes Cron mantienen una ranura `cron` mientras su ejecución interna de agente usa `cron-nested`; ambos usan `cron.maxConcurrentRuns`. Los flujos compartidos `nested` que no son Cron conservan su propio comportamiento de carril. Estas ejecuciones separadas se rastrean como [tareas en segundo plano](/es/automation/tasks).
- Los carriles por sesión garantizan que solo una ejecución de agente toque una sesión determinada a la vez.
- Sin dependencias externas ni hilos de worker en segundo plano; TypeScript puro + promesas.

## Solución de problemas

- Si los comandos parecen atascados, habilita registros detallados y busca líneas “queued for …ms” para confirmar que la cola se está drenando.
- Si necesitas la profundidad de la cola, habilita registros detallados y observa las líneas de tiempo de la cola.
- Cuando los diagnósticos están habilitados, las sesiones que permanecen en `processing` más allá de `diagnostics.stuckSessionWarnMs` registran una advertencia de sesión atascada. Las ejecuciones integradas activas, las operaciones de respuesta activas y las tareas de carril activas siguen siendo solo advertencias de forma predeterminada; la contabilidad obsoleta del inicio sin trabajo de sesión activo puede liberar el carril de sesión afectado para que el trabajo encolado se drene.

## Relacionado

- [Gestión de sesiones](/es/concepts/session)
- [Cola de direccionamiento](/es/concepts/queue-steering)
- [Política de reintentos](/es/concepts/retry)
