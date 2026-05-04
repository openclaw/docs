---
read_when:
    - Cambiar la ejecución o la concurrencia de la respuesta automática
    - Explicación de los modos de /queue o del comportamiento de direccionamiento de mensajes
summary: Modos de cola de respuesta automática, valores predeterminados y anulaciones por sesión
title: Cola de comandos
x-i18n:
    generated_at: "2026-05-04T02:23:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 085aebe7059020f027eb08bb382cce2d253ea117eed0ca77d6ffd208f295acb1
    source_path: concepts/queue.md
    workflow: 16
---

Serializamos las ejecuciones de respuesta automática entrantes (todos los canales) mediante una pequeña cola en proceso para evitar que varias ejecuciones de agente colisionen, sin dejar de permitir paralelismo seguro entre sesiones.

## Por qué

- Las ejecuciones de respuesta automática pueden ser costosas (llamadas a LLM) y pueden colisionar cuando llegan varios mensajes entrantes casi al mismo tiempo.
- La serialización evita competir por recursos compartidos (archivos de sesión, registros, stdin de la CLI) y reduce la probabilidad de límites de tasa del proveedor.

## Cómo funciona

- Una cola FIFO con reconocimiento de carril vacía cada carril con un límite de concurrencia configurable (predeterminado 1 para carriles no configurados; main usa 4 de forma predeterminada, subagent usa 8).
- `runEmbeddedPiAgent` encola por **clave de sesión** (carril `session:<key>`) para garantizar solo una ejecución activa por sesión.
- Cada ejecución de sesión se encola después en un **carril global** (`main` de forma predeterminada), de modo que el paralelismo general queda limitado por `agents.defaults.maxConcurrent`.
- Cuando el registro detallado está habilitado, las ejecuciones en cola emiten un aviso breve si esperaron más de ~2 s antes de comenzar.
- Los indicadores de escritura se activan de inmediato al encolar (cuando el canal lo admite), por lo que la experiencia del usuario no cambia mientras esperamos nuestro turno.

## Valores predeterminados

Cuando no se configuran, todas las superficies de canales entrantes usan:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

`steer` es el valor predeterminado porque mantiene receptivo el turno del modelo activo sin iniciar una segunda ejecución de sesión. Vacía todos los mensajes de direccionamiento que llegaron antes del siguiente límite del modelo. Si la ejecución actual no puede aceptar direccionamiento, OpenClaw recurre a una entrada de cola de seguimiento.

## Modos de cola

Los mensajes entrantes pueden dirigir la ejecución actual, esperar a un turno de seguimiento, o ambas cosas:

- `steer`: encola mensajes de direccionamiento en el runtime activo. Pi entrega todos los mensajes de direccionamiento pendientes **después de que el turno actual del asistente termina de ejecutar sus llamadas de herramientas**, antes de la siguiente llamada a LLM; el app-server de Codex recibe un único `turn/steer` agrupado. Si la ejecución no está transmitiendo activamente o el direccionamiento no está disponible, OpenClaw recurre a una entrada de cola de seguimiento.
- `queue` (heredado): direccionamiento antiguo, de uno en uno. Pi entrega un mensaje de direccionamiento en cola en cada límite del modelo; el app-server de Codex recibe solicitudes `turn/steer` separadas. Prefiere `steer` salvo que necesites el comportamiento serializado anterior.
- `followup`: encola cada mensaje para un turno posterior del agente después de que termine la ejecución actual.
- `collect`: combina los mensajes en cola en un **único** turno de seguimiento después de la ventana de silencio. Si los mensajes apuntan a distintos canales/hilos, se vacían individualmente para preservar el enrutamiento.
- `steer-backlog` (también `steer+backlog`): dirige ahora **y** conserva el mismo mensaje para un turno de seguimiento.
- `interrupt` (heredado): aborta la ejecución activa de esa sesión y luego ejecuta el mensaje más reciente.

Steer-backlog significa que puedes recibir una respuesta de seguimiento después de la ejecución dirigida, por lo que las superficies de streaming pueden parecer duplicadas. Prefiere `collect`/`steer` si quieres una respuesta por mensaje entrante.

Para el comportamiento de temporización y dependencias específico del runtime, consulta [Cola de direccionamiento](/es/concepts/queue-steering). Para el comando explícito `/steer <message>`, consulta [Dirigir](/es/tools/steer).

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

- `debounceMs`: ventana de silencio antes de vaciar seguimientos en cola. Los números sin unidad son milisegundos; las unidades `ms`, `s`, `m`, `h` y `d` son aceptadas por las opciones de `/queue`.
- `cap`: mensajes máximos en cola por sesión. Los valores inferiores a `1` se ignoran.
- `drop: "summarize"`: predeterminado. Descarta las entradas en cola más antiguas según sea necesario, conserva resúmenes compactos y los inyecta como un prompt de seguimiento sintético.
- `drop: "old"`: descarta las entradas en cola más antiguas según sea necesario, sin conservar resúmenes.
- `drop: "new"`: rechaza el mensaje más reciente cuando la cola ya está llena.

Valores predeterminados: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Precedencia

Para seleccionar el modo, OpenClaw resuelve:

1. Anulación `/queue` por sesión, en línea o almacenada.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. `steer` predeterminado.

Para las opciones, las opciones de `/queue` en línea o almacenadas tienen prioridad sobre la configuración. Después se aplican el debounce específico del canal (`messages.queue.debounceMsByChannel`), los valores predeterminados de debounce de Plugin, las opciones globales de `messages.queue` y los valores predeterminados integrados. `cap` y `drop` son opciones globales/de sesión, no claves de configuración por canal.

## Anulaciones por sesión

- Envía `/queue <mode>` como comando independiente para almacenar el modo de la sesión actual.
- Las opciones se pueden combinar: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` o `/queue reset` borra la anulación de sesión.

## Alcance y garantías

- Se aplica a ejecuciones de agente de respuesta automática en todos los canales entrantes que usan la canalización de respuesta del Gateway (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat, etc.).
- El carril predeterminado (`main`) abarca todo el proceso para entradas + heartbeats principales; configura `agents.defaults.maxConcurrent` para permitir varias sesiones en paralelo.
- Pueden existir carriles adicionales (por ejemplo, `cron`, `cron-nested`, `nested`, `subagent`) para que los trabajos en segundo plano puedan ejecutarse en paralelo sin bloquear las respuestas entrantes. Los turnos de agente Cron aislados mantienen una ranura `cron` mientras su ejecución interna de agente usa `cron-nested`; ambos usan `cron.maxConcurrentRuns`. Los flujos `nested` compartidos que no son Cron conservan su propio comportamiento de carril. Estas ejecuciones desacopladas se rastrean como [tareas en segundo plano](/es/automation/tasks).
- Los carriles por sesión garantizan que solo una ejecución de agente toque una sesión determinada a la vez.
- Sin dependencias externas ni hilos de trabajo en segundo plano; TypeScript puro + promesas.

## Solución de problemas

- Si los comandos parecen atascados, habilita los registros detallados y busca líneas “queued for …ms” para confirmar que la cola se está vaciando.
- Si necesitas profundidad de cola, habilita los registros detallados y observa las líneas de temporización de la cola.
- Las ejecuciones del app-server de Codex que aceptan un turno y luego dejan de emitir progreso son interrumpidas por el adaptador de Codex para que el carril de sesión activo pueda liberarse en lugar de esperar al tiempo de espera de la ejecución externa.
- Cuando los diagnósticos están habilitados, las sesiones que permanecen en `processing` después de `diagnostics.stuckSessionWarnMs` sin respuesta, herramienta, estado, bloque ni progreso ACP observado se clasifican según la actividad actual. El trabajo activo se registra como `session.long_running`; el trabajo activo sin progreso reciente se registra como `session.stalled`; `session.stuck` se reserva para contabilidad de sesiones obsoletas sin trabajo activo, y solo esa ruta puede liberar el carril de sesión afectado para que el trabajo en cola se vacíe. Los diagnósticos `session.stuck` repetidos reducen su frecuencia mientras la sesión permanece sin cambios.

## Relacionado

- [Gestión de sesiones](/es/concepts/session)
- [Cola de direccionamiento](/es/concepts/queue-steering)
- [Dirigir](/es/tools/steer)
- [Política de reintentos](/es/concepts/retry)
