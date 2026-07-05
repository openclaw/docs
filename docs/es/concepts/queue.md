---
read_when:
    - Cambiar la ejecución o la concurrencia de la respuesta automática
    - Explicación de los modos de /queue o del comportamiento de direccionamiento de mensajes
summary: Modos de cola de respuesta automática, valores predeterminados y anulaciones por sesión
title: Cola de comandos
x-i18n:
    generated_at: "2026-07-05T11:14:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 309d149545aaba91d2248dd6354d82e3cb7ddd489817a5f84acbb0269a0815ec
    source_path: concepts/queue.md
    workflow: 16
---

OpenClaw serializa las ejecuciones de respuesta automática entrantes (todos los canales) mediante una pequeña cola en proceso para evitar que varias ejecuciones de agente colisionen, al mismo tiempo que permite paralelismo seguro entre sesiones.

## Por qué

- Las ejecuciones de respuesta automática pueden ser costosas (llamadas a LLM) y pueden colisionar cuando llegan varios mensajes entrantes con poca diferencia de tiempo.
- La serialización evita la competencia por recursos compartidos (archivos de sesión, registros, stdin de la CLI) y reduce la probabilidad de límites de frecuencia aguas arriba.

## Cómo funciona

- Una cola FIFO consciente de carriles vacía cada carril con un límite de concurrencia configurable (valor predeterminado 1 para carriles sin configurar; `main` usa 4 de forma predeterminada, `subagent` usa 8).
- `runEmbeddedAgent` encola por **clave de sesión** (carril `session:<key>`) para garantizar que solo haya una ejecución activa por sesión.
- Cada ejecución de sesión se encola luego en un **carril global** (`main` de forma predeterminada) para que el paralelismo general quede limitado por `agents.defaults.maxConcurrent`.
- Cuando el registro detallado está habilitado, las ejecuciones en cola emiten un aviso breve si esperaron más de ~2 s antes de comenzar.
- Los indicadores de escritura siguen activándose inmediatamente al encolar (cuando el canal lo admite), por lo que la experiencia del usuario no cambia mientras la ejecución espera su turno.

## Valores predeterminados

Cuando no se configuran, todas las superficies de canales entrantes usan:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

El direccionamiento dentro del mismo turno es el valor predeterminado. Un prompt que llega durante una ejecución se inyecta en el runtime activo cuando la ejecución puede aceptar direccionamiento, por lo que no se inicia una segunda ejecución de sesión. Si la ejecución activa no puede aceptar direccionamiento, OpenClaw espera a que termine la ejecución activa antes de iniciar el prompt.

## Modos de cola

`/queue` controla qué hacen los mensajes entrantes normales mientras una sesión ya tiene una ejecución activa:

- `steer`: inyecta mensajes en el runtime activo. OpenClaw entrega todos los mensajes de direccionamiento pendientes **después de que el turno actual del asistente termine de ejecutar sus llamadas a herramientas**, antes de la siguiente llamada a LLM; el servidor de aplicación de Codex recibe un único `turn/steer` por lotes. Si la ejecución no está transmitiendo activamente o el direccionamiento no está disponible, OpenClaw espera hasta que termine la ejecución activa antes de iniciar el prompt.
- `followup`: no direcciona. Encola cada mensaje para un turno de agente posterior después de que termine la ejecución actual.
- `collect`: no direcciona. Fusiona los mensajes en cola en un **único** turno de seguimiento después de la ventana de silencio. Si los mensajes apuntan a canales/hilos diferentes, se vacían individualmente para conservar el enrutamiento.
- `interrupt`: aborta la ejecución activa de esa sesión y luego ejecuta el mensaje más reciente.

Para conocer el comportamiento de temporización y dependencias específico del runtime, consulta [Cola de direccionamiento](/es/concepts/queue-steering). Para el comando explícito `/steer <message>`, consulta [Direccionar](/es/tools/steer).

Configura globalmente o por canal mediante `messages.queue`:

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

Las opciones se aplican a la entrega en cola. `debounceMs` también establece la ventana de silencio de direccionamiento de Codex en modo `steer`:

- `debounceMs`: ventana de silencio antes de vaciar seguimientos en cola o lotes de recopilación; en el modo `steer` de Codex, ventana de silencio antes de enviar `turn/steer` por lotes. Los números sin unidad son milisegundos; las unidades `ms`, `s`, `m`, `h` y `d` son aceptadas por las opciones de `/queue`.
- `cap`: máximo de mensajes en cola por sesión. Los valores inferiores a `1` se ignoran.
- `drop: "summarize"` (predeterminado): descarta las entradas más antiguas en cola según sea necesario, conserva resúmenes compactos y los inyecta como un prompt de seguimiento sintético.
- `drop: "old"`: descarta las entradas más antiguas en cola según sea necesario, sin conservar resúmenes.
- `drop: "new"`: rechaza el mensaje más reciente cuando la cola ya está llena.

Valores predeterminados: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Direccionamiento y streaming

Cuando el streaming del canal es `partial` o `block`, el direccionamiento puede verse como varias respuestas visibles breves mientras la ejecución activa alcanza los límites del runtime:

- `partial`: la vista previa puede finalizar pronto y luego comienza una nueva vista previa después de que se acepte el direccionamiento.
- `block`: los bloques del tamaño de borrador pueden crear la misma apariencia secuencial.
- Sin streaming, el direccionamiento recurre a un seguimiento después de la ejecución activa cuando el runtime no puede aceptar direccionamiento dentro del mismo turno.

`steer` no aborta las herramientas en curso. Usa `/queue interrupt` cuando el mensaje más reciente deba abortar la ejecución actual.

## Precedencia

Para la selección de modo, OpenClaw resuelve:

1. Anulación de `/queue` en línea o almacenada por sesión.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. `steer` predeterminado.

Para las opciones, las opciones de `/queue` en línea o almacenadas prevalecen sobre la configuración. Luego se aplican el debounce específico del canal (`messages.queue.debounceMsByChannel`), los valores predeterminados de debounce del plugin, las opciones globales de `messages.queue` y los valores predeterminados integrados, en ese orden. `cap` y `drop` son opciones globales/de sesión, no claves de configuración por canal.

## Anulaciones por sesión

- Envía `/queue <steer|followup|collect|interrupt>` como comando independiente para almacenar el modo de cola de la sesión actual.
- Las opciones se pueden combinar: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` o `/queue reset` borra la anulación de sesión.

## Cancelación de turnos en cola

Mientras un prompt permanece en la cola de seguimiento/recopilación (por ejemplo, un `chat.send` de TUI o chat web que llega mientras otro turno está activo), Gateway mantiene una **identidad de cancelación propiedad de Gateway** para ese `runId` de cliente hasta que el contenido en cola se ejecute o se descarte. La identidad sigue al contenido plegado en un resumen de desbordamiento.

- `chat.abort` con un `runId` específico cancela ese turno mientras todavía está
  en cola, si el solicitante está autorizado (las mismas reglas de propiedad que en las ejecuciones activas).
- `chat.abort` para una sesión sin `runId` cancela **primero los turnos en cola autorizados**, luego aborta las ejecuciones activas autorizadas. Ese orden evita que el vaciado de la cola promueva trabajo a una sesión parcialmente detenida.
- Borrar toda la cola de la sesión sin comprobaciones por solicitante no es la
  ruta de detención para sesiones con varios propietarios.
- Las esperas en cola no se proyectan como ejecuciones activas de agente para `sessions.list` y no poseen semántica de tiempo de espera de ejecución activa; solo la fase activa la posee.

Los clientes (incluido TUI) reenvían prompts durante una ejecución y dejan que Gateway aplique el modo de cola. Esc/`/stop` usa una cancelación con alcance de sesión para que la pérdida de identificadores locales no pueda dejar ejecutándose un prompt que aún esté en cola.

## Alcance y garantías

- Se aplica a ejecuciones de agente de respuesta automática en todos los canales entrantes que usan el flujo de respuesta de Gateway (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, chat web, etc.).
- El carril predeterminado (`main`) es de todo el proceso para entradas + heartbeats principales; establece `agents.defaults.maxConcurrent` para permitir varias sesiones en paralelo.
- Pueden existir carriles adicionales (por ejemplo, `cron`, `cron-nested`, `nested`, `subagent`) para que los trabajos en segundo plano puedan ejecutarse en paralelo sin bloquear las respuestas entrantes. Los turnos de agente cron aislados ocupan un espacio `cron` mientras su ejecución interna de agente usa `cron-nested`; ambos usan `cron.maxConcurrentRuns`. Los flujos `nested` compartidos que no son cron conservan su propio comportamiento de carril. Estas ejecuciones desacopladas se rastrean como [tareas en segundo plano](/es/automation/tasks).
- Los carriles por sesión garantizan que solo una ejecución de agente toque una sesión determinada a la vez.
- Sin dependencias externas ni hilos de worker en segundo plano; solo TypeScript + promesas.

## Solución de problemas

- Si los comandos parecen atascados, habilita los registros detallados y busca líneas "queued for ...ms" para confirmar que la cola se está vaciando.
- Las ejecuciones del servidor de aplicación de Codex que aceptan un turno y luego dejan de emitir progreso son interrumpidas por el adaptador de Codex para que el carril de sesión activo pueda liberarse en lugar de esperar al tiempo de espera de la ejecución externa.
- Cuando los diagnósticos están habilitados, las sesiones que permanecen en `processing` después de `diagnostics.stuckSessionWarnMs` sin respuesta, herramienta, estado, bloque ni progreso de ACP observados se clasifican según la actividad actual:
  - El trabajo activo con registros de progreso recientes como `session.long_running`. Las llamadas a modelos silenciosas con propietario también permanecen como `session.long_running` hasta `diagnostics.stuckSessionAbortMs` para que los proveedores lentos o sin streaming no se informen como detenidos demasiado pronto.
  - El trabajo activo sin registros de progreso recientes como `session.stalled`; las llamadas a modelos con propietario, las llamadas a herramientas bloqueadas y las ejecuciones incrustadas detenidas cambian a `session.stalled` al alcanzar o superar el umbral de aborto. La actividad obsoleta de modelos/herramientas sin propietario no se oculta como de larga duración.
  - `session.stuck` se reserva para contabilidad de sesiones obsoleta recuperable, incluidas sesiones en cola inactivas con actividad obsoleta de modelos/herramientas sin propietario.
  - `session.stuck` siempre activa una recuperación que puede liberar el carril de sesión afectado. Una clasificación `session.stalled` después de `diagnostics.stuckSessionAbortMs` (llamada a herramienta bloqueada, llamada a modelo detenida o ejecución incrustada detenida) también puede activar recuperación con aborto activo, por lo que ambas clasificaciones pueden destrabar una cola, no solo `session.stuck`.
  - Las líneas de registro de advertencia repetidas de `session.stuck` y `session.long_running` retroceden exponencialmente mientras la sesión permanece sin cambios; los intentos de recuperación siguen ejecutándose en cada tick de heartbeat independientemente de ese retroceso.

## Relacionado

- [Gestión de sesiones](/es/concepts/session)
- [Cola de direccionamiento](/es/concepts/queue-steering)
- [Direccionar](/es/tools/steer)
- [Política de reintentos](/es/concepts/retry)
