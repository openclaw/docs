---
read_when:
    - Explicación de cómo los mensajes entrantes se convierten en respuestas
    - Aclaración de las sesiones, los modos de encolado o el comportamiento de transmisión en tiempo real
    - Documentación de la visibilidad del razonamiento y sus implicaciones de uso
summary: Flujo de mensajes, sesiones, encolado y visibilidad del razonamiento
title: Mensajes
x-i18n:
    generated_at: "2026-04-21T13:35:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4f535d01872e7fcf0f3d99a5c5ac01feddbf7fb562ff61d9ccdf18f109f9922f
    source_path: concepts/messages.md
    workflow: 15
---

# Mensajes

Esta página reúne cómo OpenClaw maneja los mensajes entrantes, las sesiones, el encolado,
la transmisión en tiempo real y la visibilidad del razonamiento.

## Flujo de mensajes (visión general)

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

Los controles principales están en la configuración:

- `messages.*` para prefijos, encolado y comportamiento en grupos.
- `agents.defaults.*` para los valores predeterminados de transmisión por bloques y fragmentación.
- Sustituciones por canal (`channels.whatsapp.*`, `channels.telegram.*`, etc.) para límites y opciones de transmisión.

Consulta [Configuration](/es/gateway/configuration) para ver el esquema completo.

## Eliminación de duplicados entrantes

Los canales pueden volver a entregar el mismo mensaje después de reconexiones. OpenClaw mantiene una
caché de corta duración con claves de canal/cuenta/par/sesión/id de mensaje para que las entregas duplicadas
no desencadenen otra ejecución del agente.

## Antirrebote de entrada

Los mensajes consecutivos rápidos del **mismo remitente** pueden agruparse en un único
turno del agente mediante `messages.inbound`. El antirrebote se aplica por canal + conversación
y usa el mensaje más reciente para el encadenamiento de respuestas/IDs.

Configuración (valor global predeterminado + sustituciones por canal):

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

- El antirrebote se aplica a mensajes de **solo texto**; los medios/adjuntos se vacían de inmediato.
- Los comandos de control omiten el antirrebote para que sigan siendo independientes — **excepto** cuando un canal habilita explícitamente la coalescencia de MD del mismo remitente (por ejemplo, [BlueBubbles `coalesceSameSenderDms`](/es/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)), donde los comandos de MD esperan dentro de la ventana de antirrebote para que una carga útil de envío dividido pueda unirse al mismo turno del agente.

## Sesiones y dispositivos

Las sesiones pertenecen al Gateway, no a los clientes.

- Los chats directos se consolidan en la clave de sesión principal del agente.
- Los grupos/canales obtienen sus propias claves de sesión.
- El almacén de sesiones y las transcripciones residen en el host del Gateway.

Varios dispositivos/canales pueden asignarse a la misma sesión, pero el historial no se
sincroniza por completo con todos los clientes. Recomendación: usa un dispositivo principal para conversaciones
largas para evitar contexto divergente. La interfaz Control UI y la TUI siempre muestran la
transcripción de la sesión respaldada por el Gateway, por lo que son la fuente de verdad.

Detalles: [Session management](/es/concepts/session).

## Cuerpos entrantes y contexto del historial

OpenClaw separa el **cuerpo del prompt** del **cuerpo del comando**:

- `Body`: texto del prompt enviado al agente. Puede incluir envolturas del canal y
  envolturas opcionales del historial.
- `CommandBody`: texto bruto del usuario para el análisis de directivas/comandos.
- `RawBody`: alias heredado de `CommandBody` (se mantiene por compatibilidad).

Cuando un canal proporciona historial, usa una envoltura compartida:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

En los **chats no directos** (grupos/canales/salas), el **cuerpo del mensaje actual** lleva como prefijo la
etiqueta del remitente (el mismo estilo usado para las entradas del historial). Esto mantiene coherentes
los mensajes en tiempo real y los mensajes encolados/con historial dentro del prompt del agente.

Los búferes de historial son **solo pendientes**: incluyen mensajes de grupo que _no_
desencadenaron una ejecución (por ejemplo, mensajes condicionados por menciones) y **excluyen** los mensajes
ya presentes en la transcripción de la sesión.

La eliminación de directivas solo se aplica a la sección del **mensaje actual** para que el historial
permanezca intacto. Los canales que envuelven historial deben establecer `CommandBody` (o
`RawBody`) en el texto original del mensaje y mantener `Body` como el prompt combinado.
Los búferes de historial se configuran mediante `messages.groupChat.historyLimit` (valor global
predeterminado) y sustituciones por canal como `channels.slack.historyLimit` o
`channels.telegram.accounts.<id>.historyLimit` (establece `0` para deshabilitarlo).

## Encolado y seguimientos

Si ya hay una ejecución activa, los mensajes entrantes pueden ponerse en cola, dirigirse a la
ejecución actual o recopilarse para un turno de seguimiento.

- Configura esto mediante `messages.queue` (y `messages.queue.byChannel`).
- Modos: `interrupt`, `steer`, `followup`, `collect`, además de variantes de backlog.

Detalles: [Queueing](/es/concepts/queue).

## Transmisión en tiempo real, fragmentación y agrupación

La transmisión por bloques envía respuestas parciales a medida que el modelo produce bloques de texto.
La fragmentación respeta los límites de texto del canal y evita dividir bloques de código con delimitadores.

Configuraciones principales:

- `agents.defaults.blockStreamingDefault` (`on|off`, desactivado de forma predeterminada)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (agrupación basada en inactividad)
- `agents.defaults.humanDelay` (pausa de estilo humano entre respuestas por bloques)
- Sustituciones por canal: `*.blockStreaming` y `*.blockStreamingCoalesce` (los canales que no son Telegram requieren `*.blockStreaming: true` explícito)

Detalles: [Streaming + chunking](/es/concepts/streaming).

## Visibilidad del razonamiento y tokens

OpenClaw puede exponer u ocultar el razonamiento del modelo:

- `/reasoning on|off|stream` controla la visibilidad.
- El contenido del razonamiento sigue contando para el uso de tokens cuando el modelo lo produce.
- Telegram admite la transmisión del razonamiento en la burbuja de borrador.

Detalles: [Thinking + reasoning directives](/es/tools/thinking) y [Token use](/es/reference/token-use).

## Prefijos, encadenamiento y respuestas

El formato de los mensajes salientes está centralizado en `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` y `channels.<channel>.accounts.<id>.responsePrefix` (cascada de prefijos salientes), además de `channels.whatsapp.messagePrefix` (prefijo entrante de WhatsApp)
- Encadenamiento de respuestas mediante `replyToMode` y valores predeterminados por canal

Detalles: [Configuration](/es/gateway/configuration-reference#messages) y la documentación de canales.

## Respuestas silenciosas

El token silencioso exacto `NO_REPLY` / `no_reply` significa “no entregar una respuesta visible para el usuario”.
OpenClaw resuelve ese comportamiento según el tipo de conversación:

- Las conversaciones directas no permiten silencio de forma predeterminada y reescriben una respuesta silenciosa simple
  a una breve alternativa visible.
- Los grupos/canales permiten silencio de forma predeterminada.
- La orquestación interna permite silencio de forma predeterminada.

Los valores predeterminados están en `agents.defaults.silentReply` y
`agents.defaults.silentReplyRewrite`; `surfaces.<id>.silentReply` y
`surfaces.<id>.silentReplyRewrite` pueden sustituirlos por superficie.

## Relacionado

- [Streaming](/es/concepts/streaming) — entrega de mensajes en tiempo real
- [Retry](/es/concepts/retry) — comportamiento de reintento de entrega de mensajes
- [Queue](/es/concepts/queue) — cola de procesamiento de mensajes
- [Channels](/es/channels) — integraciones con plataformas de mensajería
