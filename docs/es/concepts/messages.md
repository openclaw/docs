---
read_when:
    - Explicación de cómo los mensajes entrantes se convierten en respuestas
    - Aclaración de las sesiones, los modos de encolado o el comportamiento de transmisión en tiempo real
    - Documentación de la visibilidad del razonamiento y las implicaciones de uso
summary: Flujo de mensajes, sesiones, encolado y visibilidad del razonamiento
title: Mensajes
x-i18n:
    generated_at: "2026-04-25T18:17:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1e085e778b10f9fbf3ccc8fb2939667b3c2b2bc88f5dc0be6c5c4fc1fc96e9d0
    source_path: concepts/messages.md
    workflow: 15
---

Esta página reúne cómo OpenClaw maneja los mensajes entrantes, las sesiones, el encolado,
la transmisión en tiempo real y la visibilidad del razonamiento.

## Flujo de mensajes (alto nivel)

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

Los controles clave se encuentran en la configuración:

- `messages.*` para prefijos, encolado y comportamiento de grupos.
- `agents.defaults.*` para los valores predeterminados de block streaming y fragmentación.
- Anulaciones por canal (`channels.whatsapp.*`, `channels.telegram.*`, etc.) para límites y alternadores de transmisión.

Consulta [Configuración](/es/gateway/configuration) para ver el esquema completo.

## Deduplicación de entrada

Los canales pueden volver a entregar el mismo mensaje después de reconexiones. OpenClaw mantiene una
caché de corta duración indexada por canal/cuenta/par/sesión/id de mensaje para que las entregas duplicadas
no activen otra ejecución del agente.

## Antirrebote de entrada

Los mensajes rápidos y consecutivos del **mismo remitente** pueden agruparse en un solo
turno del agente mediante `messages.inbound`. El antirrebote se aplica por canal + conversación
y usa el mensaje más reciente para el encadenamiento de respuestas/IDs.

Configuración (valor predeterminado global + anulaciones por canal):

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
- Los comandos de control omiten el antirrebote para que sigan siendo independientes, **excepto** cuando un canal opta explícitamente por la coalescencia de MD del mismo remitente (por ejemplo, [BlueBubbles `coalesceSameSenderDms`](/es/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)), donde los comandos de MD esperan dentro de la ventana de antirrebote para que una carga útil de envío dividido pueda unirse al mismo turno del agente.

## Sesiones y dispositivos

Las sesiones pertenecen al Gateway, no a los clientes.

- Los chats directos se contraen en la clave de sesión principal del agente.
- Los grupos/canales obtienen sus propias claves de sesión.
- El almacenamiento de sesiones y las transcripciones residen en el host del Gateway.

Varios dispositivos/canales pueden asignarse a la misma sesión, pero el historial no se
sincroniza por completo de vuelta a cada cliente. Recomendación: usa un dispositivo principal para conversaciones largas
para evitar contexto divergente. La interfaz de usuario de Control y la TUI siempre muestran la transcripción de la sesión respaldada por el Gateway, por lo que son la fuente de verdad.

Detalles: [Gestión de sesiones](/es/concepts/session).

## Cuerpos entrantes y contexto del historial

OpenClaw separa el **cuerpo del prompt** del **cuerpo del comando**:

- `Body`: texto del prompt enviado al agente. Esto puede incluir envolturas del canal y
  envolturas opcionales del historial.
- `CommandBody`: texto bruto del usuario para el análisis de directivas/comandos.
- `RawBody`: alias heredado de `CommandBody` (se mantiene por compatibilidad).

Cuando un canal proporciona historial, usa una envoltura compartida:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

En los **chats no directos** (grupos/canales/salas), el **cuerpo del mensaje actual** lleva como prefijo la
etiqueta del remitente (el mismo estilo usado para las entradas del historial). Esto mantiene coherentes en el prompt del agente
los mensajes en tiempo real y los mensajes en cola/con historial.

Los búferes de historial son **solo pendientes**: incluyen mensajes de grupos que _no_
activaron una ejecución (por ejemplo, mensajes condicionados por mención) y **excluyen** los mensajes
que ya están en la transcripción de la sesión.

La eliminación de directivas solo se aplica a la sección del **mensaje actual** para que el historial
permanezca intacto. Los canales que envuelven historial deben establecer `CommandBody` (o
`RawBody`) en el texto original del mensaje y mantener `Body` como el prompt combinado.
Los búferes de historial son configurables mediante `messages.groupChat.historyLimit` (valor
predeterminado global) y anulaciones por canal como `channels.slack.historyLimit` o
`channels.telegram.accounts.<id>.historyLimit` (establece `0` para desactivar).

## Encolado y seguimientos

Si ya hay una ejecución activa, los mensajes entrantes pueden ponerse en cola, dirigirse a la
ejecución actual o recopilarse para un turno de seguimiento.

- Configúralo mediante `messages.queue` (y `messages.queue.byChannel`).
- Modos: `interrupt`, `steer`, `followup`, `collect`, además de variantes de backlog.

Detalles: [Encolado](/es/concepts/queue).

## Transmisión, fragmentación y agrupación

Block streaming envía respuestas parciales a medida que el modelo produce bloques de texto.
La fragmentación respeta los límites de texto del canal y evita dividir bloques de código delimitados.

Configuraciones clave:

- `agents.defaults.blockStreamingDefault` (`on|off`, desactivado de forma predeterminada)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (agrupación basada en inactividad)
- `agents.defaults.humanDelay` (pausa con apariencia humana entre respuestas por bloque)
- Anulaciones por canal: `*.blockStreaming` y `*.blockStreamingCoalesce` (los canales que no son Telegram requieren `*.blockStreaming: true` explícito)

Detalles: [Transmisión + fragmentación](/es/concepts/streaming).

## Visibilidad del razonamiento y tokens

OpenClaw puede exponer u ocultar el razonamiento del modelo:

- `/reasoning on|off|stream` controla la visibilidad.
- El contenido de razonamiento sigue contando para el uso de tokens cuando lo produce el modelo.
- Telegram admite la transmisión del razonamiento dentro de la burbuja de borrador.

Detalles: [Directivas de pensamiento + razonamiento](/es/tools/thinking) y [Uso de tokens](/es/reference/token-use).

## Prefijos, encadenamiento y respuestas

El formato de los mensajes salientes está centralizado en `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` y `channels.<channel>.accounts.<id>.responsePrefix` (cascada de prefijos salientes), además de `channels.whatsapp.messagePrefix` (prefijo entrante de WhatsApp)
- Encadenamiento de respuestas mediante `replyToMode` y valores predeterminados por canal

Detalles: [Configuración](/es/gateway/config-agents#messages) y documentación de canales.

## Respuestas silenciosas

El token silencioso exacto `NO_REPLY` / `no_reply` significa “no entregar una respuesta visible para el usuario”.
Cuando un turno también tiene medios de herramientas pendientes, como audio TTS generado, OpenClaw
elimina el texto silencioso pero aun así entrega el adjunto multimedia.
OpenClaw resuelve ese comportamiento según el tipo de conversación:

- Las conversaciones directas no permiten silencio de forma predeterminada y reescriben una
  respuesta silenciosa aislada a una alternativa visible breve.
- Los grupos/canales permiten silencio de forma predeterminada.
- La orquestación interna permite silencio de forma predeterminada.

Los valores predeterminados se encuentran en `agents.defaults.silentReply` y
`agents.defaults.silentReplyRewrite`; `surfaces.<id>.silentReply` y
`surfaces.<id>.silentReplyRewrite` pueden anularlos por superficie.

Cuando la sesión principal tiene una o más ejecuciones pendientes de subagentes generados, las
respuestas silenciosas aisladas se descartan en todas las superficies en lugar de reescribirse, para que la
sesión principal permanezca en silencio hasta que el evento de finalización del hijo entregue la respuesta real.

## Relacionado

- [Transmisión](/es/concepts/streaming) — entrega de mensajes en tiempo real
- [Reintento](/es/concepts/retry) — comportamiento de reintento en la entrega de mensajes
- [Cola](/es/concepts/queue) — cola de procesamiento de mensajes
- [Canales](/es/channels) — integraciones de plataformas de mensajería
