---
read_when:
    - Explicar cómo los mensajes entrantes se convierten en respuestas
    - Aclarar sesiones, modos de encolado o comportamiento de streaming
    - Documentar la visibilidad del razonamiento y sus implicaciones de uso
summary: Flujo de mensajes, sesiones, encolado y visibilidad del razonamiento
title: Mensajes
x-i18n:
    generated_at: "2026-04-24T05:25:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 22a154246f47b5841dc9d4b9f8e3c5698e5e56bc0b2dbafe19fec45799dbbba9
    source_path: concepts/messages.md
    workflow: 15
---

Esta página reúne cómo OpenClaw maneja los mensajes entrantes, las sesiones, el encolado,
el streaming y la visibilidad del razonamiento.

## Flujo de mensajes (nivel alto)

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

Los controles clave viven en la configuración:

- `messages.*` para prefijos, encolado y comportamiento de grupo.
- `agents.defaults.*` para valores predeterminados de streaming por bloques y fragmentación.
- Sobrescrituras por canal (`channels.whatsapp.*`, `channels.telegram.*`, etc.) para límites y toggles de streaming.

Consulta [Configuración](/es/gateway/configuration) para ver el esquema completo.

## Dedupe de entrada

Los canales pueden volver a entregar el mismo mensaje después de reconexiones. OpenClaw mantiene una
caché de corta duración indexada por canal/cuenta/peer/sesión/id de mensaje para que las entregas duplicadas
no activen otra ejecución del agente.

## Debounce de entrada

Los mensajes rápidos consecutivos del **mismo remitente** pueden agruparse en un solo
turno del agente mediante `messages.inbound`. El debounce se limita por canal + conversación
y usa el mensaje más reciente para el hilo/IDs de respuesta.

Configuración (valor predeterminado global + sobrescrituras por canal):

```json5
{
  messages: {
    inbound: {
      debounceMs: 2000,
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
        discord: 1500,
      },
    },
  },
}
```

Notas:

- El debounce se aplica a mensajes **solo de texto**; medios/adjuntos se vacían inmediatamente.
- Los comandos de control omiten el debounce para mantenerse independientes, **excepto** cuando un canal habilita explícitamente la coalescencia de DM del mismo remitente (por ejemplo, [BlueBubbles `coalesceSameSenderDms`](/es/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)), donde los comandos DM esperan dentro de la ventana de debounce para que una carga útil enviada en partes pueda unirse al mismo turno del agente.

## Sesiones y dispositivos

Las sesiones pertenecen al gateway, no a los clientes.

- Los chats directos se colapsan en la clave de sesión principal del agente.
- Los grupos/canales obtienen sus propias claves de sesión.
- El almacén de sesiones y las transcripciones viven en el host del gateway.

Varios dispositivos/canales pueden asignarse a la misma sesión, pero el historial no se
sincroniza completamente de vuelta a todos los clientes. Recomendación: usa un dispositivo principal para conversaciones largas
para evitar contexto divergente. La IU de Control y la TUI siempre muestran la
transcripción de la sesión respaldada por el gateway, por lo que son la fuente de verdad.

Detalles: [Gestión de sesiones](/es/concepts/session).

## Cuerpos entrantes y contexto del historial

OpenClaw separa el **cuerpo del prompt** del **cuerpo del comando**:

- `Body`: texto del prompt enviado al agente. Puede incluir sobres de canal y
  envoltorios opcionales de historial.
- `CommandBody`: texto sin procesar del usuario para análisis de directivas/comandos.
- `RawBody`: alias heredado de `CommandBody` (se conserva por compatibilidad).

Cuando un canal proporciona historial, usa un envoltorio compartido:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Para los **chats no directos** (grupos/canales/salas), el **cuerpo del mensaje actual** lleva como prefijo la
etiqueta del remitente (el mismo estilo usado para las entradas del historial). Esto mantiene consistentes
los mensajes en tiempo real y los mensajes en cola/de historial en el prompt del agente.

Los búferes de historial son **solo pendientes**: incluyen mensajes de grupo que _no_
activaron una ejecución (por ejemplo, mensajes restringidos por mención) y **excluyen** mensajes
ya presentes en la transcripción de la sesión.

La eliminación de directivas solo se aplica a la sección del **mensaje actual** para que el historial
permanezca intacto. Los canales que envuelven historial deben establecer `CommandBody` (o
`RawBody`) con el texto original del mensaje y mantener `Body` como prompt combinado.
Los búferes de historial se configuran mediante `messages.groupChat.historyLimit` (valor
predeterminado global) y sobrescrituras por canal como `channels.slack.historyLimit` o
`channels.telegram.accounts.<id>.historyLimit` (establece `0` para deshabilitar).

## Encolado y seguimientos

Si ya hay una ejecución activa, los mensajes entrantes pueden encolarse, dirigirse a la
ejecución actual o recopilarse para un turno de seguimiento.

- Configura esto mediante `messages.queue` (y `messages.queue.byChannel`).
- Modos: `interrupt`, `steer`, `followup`, `collect`, además de variantes de backlog.

Detalles: [Encolado](/es/concepts/queue).

## Streaming, fragmentación y agrupación

El streaming por bloques envía respuestas parciales a medida que el modelo produce bloques de texto.
La fragmentación respeta los límites de texto del canal y evita dividir bloques de código delimitados.

Configuraciones clave:

- `agents.defaults.blockStreamingDefault` (`on|off`, predeterminado off)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (agrupación basada en inactividad)
- `agents.defaults.humanDelay` (pausa similar a la humana entre respuestas por bloques)
- Sobrescrituras por canal: `*.blockStreaming` y `*.blockStreamingCoalesce` (los canales que no son Telegram requieren `*.blockStreaming: true` explícito)

Detalles: [Streaming + fragmentación](/es/concepts/streaming).

## Visibilidad del razonamiento y tokens

OpenClaw puede exponer u ocultar el razonamiento del modelo:

- `/reasoning on|off|stream` controla la visibilidad.
- El contenido del razonamiento sigue contando para el uso de tokens cuando el modelo lo produce.
- Telegram admite stream de razonamiento dentro de la burbuja de borrador.

Detalles: [Thinking + directivas de razonamiento](/es/tools/thinking) y [Uso de tokens](/es/reference/token-use).

## Prefijos, hilos y respuestas

El formato de mensajes salientes está centralizado en `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` y `channels.<channel>.accounts.<id>.responsePrefix` (cascada de prefijo saliente), más `channels.whatsapp.messagePrefix` (prefijo entrante de WhatsApp)
- Hilo de respuesta mediante `replyToMode` y valores predeterminados por canal

Detalles: [Configuración](/es/gateway/config-agents#messages) y la documentación de cada canal.

## Respuestas silenciosas

El token silencioso exacto `NO_REPLY` / `no_reply` significa “no entregar una respuesta visible para el usuario”.
OpenClaw resuelve ese comportamiento según el tipo de conversación:

- Las conversaciones directas no permiten silencio por defecto y reescriben una respuesta
  silenciosa sin contenido a una alternativa visible breve.
- Los grupos/canales permiten silencio por defecto.
- La orquestación interna permite silencio por defecto.

Los valores predeterminados viven en `agents.defaults.silentReply` y
`agents.defaults.silentReplyRewrite`; `surfaces.<id>.silentReply` y
`surfaces.<id>.silentReplyRewrite` pueden sobrescribirlos por superficie.

Cuando la sesión padre tiene una o más ejecuciones pendientes de subagentes generados, las
respuestas silenciosas sin contenido se descartan en todas las superficies en lugar de reescribirse, para que la
sesión padre permanezca en silencio hasta que el evento de finalización del hijo entregue la respuesta real.

## Relacionado

- [Streaming](/es/concepts/streaming) — entrega de mensajes en tiempo real
- [Retry](/es/concepts/retry) — comportamiento de reintento de entrega de mensajes
- [Queue](/es/concepts/queue) — cola de procesamiento de mensajes
- [Channels](/es/channels) — integraciones con plataformas de mensajería
