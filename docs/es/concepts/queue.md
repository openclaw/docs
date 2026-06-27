---
read_when:
    - Cambiar la ejecución o concurrencia de la respuesta automática
    - Explicación de los modos de /queue o del comportamiento de direccionamiento de mensajes
summary: Modos de cola de respuesta automática, valores predeterminados y anulaciones por sesión
title: Cola de comandos
x-i18n:
    generated_at: "2026-06-27T11:19:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6e518b018a85ddbc7afa3925180cc2329eb1d249316d81907ba51cfb3c692375
    source_path: concepts/queue.md
    workflow: 16
---

Serializamos las ejecuciones entrantes de respuesta automática (todos los canales) mediante una pequeña cola en proceso para evitar que varias ejecuciones de agentes colisionen, sin dejar de permitir paralelismo seguro entre sesiones.

## Por qué

- Las ejecuciones de respuesta automática pueden ser costosas (llamadas a LLM) y pueden colisionar cuando llegan varios mensajes entrantes con poca separación.
- La serialización evita la competencia por recursos compartidos (archivos de sesión, registros, stdin de la CLI) y reduce la probabilidad de límites de tasa del servicio ascendente.

## Cómo funciona

- Una cola FIFO consciente de carriles vacía cada carril con un límite de concurrencia configurable (valor predeterminado 1 para carriles no configurados; `main` usa 4 de forma predeterminada, `subagent` usa 8).
- `runEmbeddedAgent` encola por **clave de sesión** (carril `session:<key>`) para garantizar que solo haya una ejecución activa por sesión.
- Cada ejecución de sesión se encola después en un **carril global** (`main` de forma predeterminada), por lo que el paralelismo general queda limitado por `agents.defaults.maxConcurrent`.
- Cuando el registro detallado está habilitado, las ejecuciones en cola emiten un aviso breve si esperaron más de ~2 s antes de empezar.
- Los indicadores de escritura se activan igualmente de inmediato al encolar (cuando el canal lo admite), por lo que la experiencia de usuario no cambia mientras esperamos nuestro turno.

## Valores predeterminados

Cuando no se configuran, todas las superficies de canales entrantes usan:

- `mode: "steer"`
- `debounceMs: 500`
- `cap: 20`
- `drop: "summarize"`

La dirección en el mismo turno es el valor predeterminado. Una instrucción que llega a mitad de una ejecución se inyecta
en el runtime activo cuando la ejecución puede aceptar dirección, por lo que no se inicia una segunda
ejecución de sesión. Si la ejecución activa no puede aceptar dirección, OpenClaw espera a que la
ejecución activa termine antes de iniciar la instrucción.

## Modos de cola

`/queue` controla qué hacen los mensajes entrantes normales cuando una sesión ya tiene
una ejecución activa:

- `steer`: inyecta mensajes en el runtime activo. OpenClaw entrega todos los mensajes de dirección pendientes **después de que el turno actual del asistente termine de ejecutar sus llamadas a herramientas**, antes de la siguiente llamada al LLM; el servidor de aplicaciones de Codex recibe un único `turn/steer` por lotes. Si la ejecución no está transmitiendo activamente o la dirección no está disponible, OpenClaw espera hasta que termine la ejecución activa antes de iniciar la instrucción.
- `followup`: no dirige. Encola cada mensaje para un turno posterior del agente después de que termine la ejecución actual.
- `collect`: no dirige. Fusiona los mensajes en cola en un **único** turno de seguimiento después de la ventana de silencio. Si los mensajes apuntan a canales/hilos distintos, se vacían individualmente para preservar el enrutamiento.
- `interrupt`: aborta la ejecución activa para esa sesión y luego ejecuta el mensaje más reciente.

Para conocer el comportamiento de temporización y dependencias específico del runtime, consulta
[Cola de dirección](/es/concepts/queue-steering). Para el comando explícito `/steer <message>`,
consulta [Dirigir](/es/tools/steer).

Configúralo globalmente o por canal mediante `messages.queue`:

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

Las opciones se aplican a la entrega en cola. `debounceMs` también establece la
ventana de silencio de dirección de Codex en modo `steer`:

- `debounceMs`: ventana de silencio antes de vaciar seguimientos en cola o lotes de recopilación; en modo `steer` de Codex, ventana de silencio antes de enviar `turn/steer` por lotes. Los números sin unidad son milisegundos; las opciones de `/queue` aceptan las unidades `ms`, `s`, `m`, `h` y `d`.
- `cap`: máximo de mensajes en cola por sesión. Los valores inferiores a `1` se ignoran.
- `drop: "summarize"`: predeterminado. Descarta las entradas en cola más antiguas según sea necesario, conserva resúmenes compactos y los inyecta como una instrucción sintética de seguimiento.
- `drop: "old"`: descarta las entradas en cola más antiguas según sea necesario, sin conservar resúmenes.
- `drop: "new"`: rechaza el mensaje más reciente cuando la cola ya está llena.

Valores predeterminados: `debounceMs: 500`, `cap: 20`, `drop: summarize`.

## Dirección y transmisión

Cuando la transmisión del canal es `partial` o `block`, la dirección puede verse como varias
respuestas visibles breves mientras la ejecución activa alcanza límites del runtime:

- `partial`: la vista previa puede finalizar pronto y luego se inicia una nueva vista previa después de
  aceptar la dirección.
- `block`: los bloques del tamaño de borrador pueden crear la misma apariencia secuencial.
- Sin transmisión, la dirección recurre a un seguimiento después de la ejecución activa cuando
  el runtime no puede aceptar dirección en el mismo turno.

`steer` no aborta herramientas en curso. Usa `/queue interrupt` cuando el mensaje
más reciente deba abortar la ejecución actual.

## Precedencia

Para seleccionar el modo, OpenClaw resuelve:

1. Anulación de `/queue` en línea o almacenada por sesión.
2. `messages.queue.byChannel.<channel>`.
3. `messages.queue.mode`.
4. Valor predeterminado `steer`.

Para las opciones, las opciones de `/queue` en línea o almacenadas prevalecen sobre la configuración. Después
se aplican el debounce específico del canal (`messages.queue.debounceMsByChannel`), los valores predeterminados
de debounce del plugin, las opciones globales de `messages.queue` y los valores predeterminados integrados. `cap` y `drop` son opciones globales/de sesión, no claves
de configuración por canal.

## Anulaciones por sesión

- Envía `/queue <steer|followup|collect|interrupt>` como comando independiente para almacenar el modo de cola de la sesión actual.
- Las opciones pueden combinarse: `/queue collect debounce:0.5s cap:25 drop:summarize`
- `/queue default` o `/queue reset` borra la anulación de sesión.

## Alcance y garantías

- Se aplica a ejecuciones de agentes de respuesta automática en todos los canales entrantes que usan la canalización de respuesta del Gateway (WhatsApp web, Telegram, Slack, Discord, Signal, iMessage, webchat, etc.).
- El carril predeterminado (`main`) es de todo el proceso para entradas + heartbeats principales; configura `agents.defaults.maxConcurrent` para permitir varias sesiones en paralelo.
- Pueden existir carriles adicionales (por ejemplo, `cron`, `cron-nested`, `nested`, `subagent`) para que los trabajos en segundo plano puedan ejecutarse en paralelo sin bloquear las respuestas entrantes. Los turnos aislados de agente de cron mantienen una plaza `cron` mientras su ejecución interna de agente usa `cron-nested`; ambos usan `cron.maxConcurrentRuns`. Los flujos `nested` compartidos no cron mantienen su propio comportamiento de carril. Estas ejecuciones desacopladas se rastrean como [tareas en segundo plano](/es/automation/tasks).
- Los carriles por sesión garantizan que solo una ejecución de agente toque una sesión determinada a la vez.
- Sin dependencias externas ni hilos de trabajo en segundo plano; TypeScript puro + promesas.

## Solución de problemas

- Si los comandos parecen bloqueados, habilita los registros detallados y busca líneas "queued for ...ms" para confirmar que la cola se está vaciando.
- Si necesitas la profundidad de la cola, habilita los registros detallados y observa las líneas de temporización de la cola.
- Las ejecuciones del servidor de aplicaciones de Codex que aceptan un turno y luego dejan de emitir progreso son interrumpidas por el adaptador de Codex para que el carril de sesión activo pueda liberarse en lugar de esperar al tiempo de espera de la ejecución externa.
- Cuando los diagnósticos están habilitados, las sesiones que permanecen en `processing` más allá de `diagnostics.stuckSessionWarnMs` sin respuesta, herramienta, estado, bloque ni progreso de ACP observado se clasifican según la actividad actual. El trabajo activo se registra como `session.long_running`; las llamadas de modelo silenciosas con propietario también permanecen en `session.long_running` hasta `diagnostics.stuckSessionAbortMs`, para que los proveedores lentos o sin transmisión no se notifiquen como atascados demasiado pronto. El trabajo activo sin progreso reciente se registra como `session.stalled`; las llamadas de modelo con propietario cambian a `session.stalled` en el umbral de aborto o después, y la actividad obsoleta de modelo/herramienta sin propietario no se oculta como de larga duración. `session.stuck` se reserva para contabilidad recuperable de sesiones obsoletas, incluidas las sesiones inactivas en cola con actividad obsoleta de modelo/herramienta sin propietario, y solo esa ruta puede liberar el carril de sesión afectado para que el trabajo en cola se vacíe. Los diagnósticos `session.stuck` repetidos aplican retroceso mientras la sesión permanece sin cambios.

## Relacionado

- [Gestión de sesiones](/es/concepts/session)
- [Cola de dirección](/es/concepts/queue-steering)
- [Dirigir](/es/tools/steer)
- [Política de reintentos](/es/concepts/retry)
