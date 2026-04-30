---
read_when:
    - Explicando cómo los mensajes entrantes se convierten en respuestas
    - Aclaración de sesiones, modos de puesta en cola o comportamiento de transmisión
    - Documentación de la visibilidad del razonamiento y las implicaciones de uso
summary: Flujo de mensajes, sesiones, puesta en cola y visibilidad del razonamiento
title: Mensajes
x-i18n:
    generated_at: "2026-04-30T05:37:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: dcfcc995995516b627993755b255a779c681b4976d2d724c0c11e87875e37b1e
    source_path: concepts/messages.md
    workflow: 16
---

OpenClaw gestiona los mensajes entrantes mediante una canalización de resolución de sesiones, puesta en cola, streaming, ejecución de herramientas y visibilidad del razonamiento. Esta página traza la ruta desde el mensaje entrante hasta la respuesta.

## Flujo de mensajes (alto nivel)

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

Los parámetros clave están en la configuración:

- `messages.*` para prefijos, puesta en cola y comportamiento de grupos.
- `agents.defaults.*` para valores predeterminados de streaming por bloques y fragmentación.
- Sobrescrituras de canal (`channels.whatsapp.*`, `channels.telegram.*`, etc.) para límites y conmutadores de streaming.

Consulta [Configuración](/es/gateway/configuration) para ver el esquema completo.

## Deduplicación entrante

Los canales pueden volver a entregar el mismo mensaje después de reconexiones. OpenClaw mantiene una caché de corta duración con clave por canal/cuenta/par/sesión/id de mensaje para que las entregas duplicadas no disparen otra ejecución del agente.

## Antirrebote entrante

Los mensajes consecutivos rápidos del **mismo remitente** pueden agruparse en un solo turno del agente mediante `messages.inbound`. El antirrebote se limita por canal + conversación y usa el mensaje más reciente para el hilado/IDs de respuesta.

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

- El antirrebote se aplica a mensajes **solo de texto**; los medios/adjuntos se envían inmediatamente.
- Los comandos de control omiten el antirrebote para permanecer independientes, **excepto** cuando un canal opta explícitamente por fusionar MD del mismo remitente (por ejemplo, [BlueBubbles `coalesceSameSenderDms`](/es/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)), donde los comandos de MD esperan dentro de la ventana de antirrebote para que una carga enviada por partes pueda unirse al mismo turno del agente.

## Sesiones y dispositivos

Las sesiones pertenecen al Gateway, no a los clientes.

- Los chats directos se colapsan en la clave de sesión principal del agente.
- Los grupos/canales obtienen sus propias claves de sesión.
- El almacén de sesiones y las transcripciones viven en el host del Gateway.

Varios dispositivos/canales pueden asignarse a la misma sesión, pero el historial no se sincroniza por completo de vuelta a cada cliente. Recomendación: usa un dispositivo principal para conversaciones largas a fin de evitar contexto divergente. La UI de Control y la TUI siempre muestran la transcripción de sesión respaldada por el Gateway, por lo que son la fuente de verdad.

Detalles: [Gestión de sesiones](/es/concepts/session).

## Metadatos de resultados de herramientas

El `content` del resultado de una herramienta es el resultado visible para el modelo. Los `details` del resultado de una herramienta son metadatos de tiempo de ejecución para renderizado de UI, diagnóstico, entrega de medios y plugins.

OpenClaw mantiene ese límite explícito:

- `toolResult.details` se elimina antes de la reproducción del proveedor y de la entrada de Compaction.
- Las transcripciones de sesión persistidas conservan solo `details` acotados; los metadatos sobredimensionados se sustituyen por un resumen compacto marcado como `persistedDetailsTruncated: true`.
- Los plugins y herramientas deben poner el texto que el modelo debe leer en `content`, no solo en `details`.

## Cuerpos entrantes y contexto del historial

OpenClaw separa el **cuerpo del prompt** del **cuerpo del comando**:

- `Body`: texto de prompt enviado al agente. Esto puede incluir envoltorios de canal y envoltorios opcionales de historial.
- `CommandBody`: texto sin procesar del usuario para análisis de directivas/comandos.
- `RawBody`: alias heredado de `CommandBody` (conservado por compatibilidad).

Cuando un canal suministra historial, usa un envoltorio compartido:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Para **chats no directos** (grupos/canales/salas), el **cuerpo del mensaje actual** se prefija con la etiqueta del remitente (el mismo estilo usado para entradas de historial). Esto mantiene consistentes los mensajes en tiempo real y los mensajes en cola/historial en el prompt del agente.

Los búferes de historial son **solo pendientes**: incluyen mensajes de grupo que _no_ dispararon una ejecución (por ejemplo, mensajes filtrados por mención) y **excluyen** mensajes que ya están en la transcripción de sesión.

La eliminación de directivas solo se aplica a la sección del **mensaje actual**, por lo que el historial permanece intacto. Los canales que envuelven historial deben definir `CommandBody` (o `RawBody`) como el texto original del mensaje y mantener `Body` como el prompt combinado. Los búferes de historial son configurables mediante `messages.groupChat.historyLimit` (valor predeterminado global) y sobrescrituras por canal como `channels.slack.historyLimit` o `channels.telegram.accounts.<id>.historyLimit` (define `0` para deshabilitar).

## Puesta en cola y seguimientos

Si ya hay una ejecución activa, los mensajes entrantes pueden ponerse en cola, dirigirse a la ejecución actual o recopilarse para un turno de seguimiento.

- Configura mediante `messages.queue` (y `messages.queue.byChannel`).
- El modo predeterminado es `steer`, con un antirrebote de seguimiento de 500 ms cuando el direccionamiento recurre a la entrega de seguimiento en cola.
- Modos: `steer`, `followup`, `collect`, `steer-backlog`, `interrupt` y el modo heredado de uno a la vez `queue`.

Detalles: [Cola de comandos](/es/concepts/queue) y [Cola de direccionamiento](/es/concepts/queue-steering).

## Propiedad de ejecución del canal

Los plugins de canal pueden conservar el orden, aplicar antirrebote a la entrada y aplicar contrapresión de transporte antes de que un mensaje entre en la cola de sesión. No deben imponer un tiempo de espera separado alrededor del propio turno del agente. Una vez que un mensaje se enruta a una sesión, el trabajo de larga duración se rige por el ciclo de vida de la sesión, la herramienta y el tiempo de ejecución para que todos los canales informen y se recuperen de turnos lentos de forma coherente.

## Streaming, fragmentación y agrupación

El streaming por bloques envía respuestas parciales a medida que el modelo produce bloques de texto. La fragmentación respeta los límites de texto del canal y evita dividir bloques de código cercados.

Configuración clave:

- `agents.defaults.blockStreamingDefault` (`on|off`, predeterminado desactivado)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (agrupación basada en inactividad)
- `agents.defaults.humanDelay` (pausa similar a la humana entre respuestas por bloques)
- Sobrescrituras de canal: `*.blockStreaming` y `*.blockStreamingCoalesce` (los canales que no son Telegram requieren `*.blockStreaming: true` explícito)

Detalles: [Streaming + fragmentación](/es/concepts/streaming).

## Visibilidad del razonamiento y tokens

OpenClaw puede exponer u ocultar el razonamiento del modelo:

- `/reasoning on|off|stream` controla la visibilidad.
- El contenido de razonamiento sigue contando para el uso de tokens cuando lo produce el modelo.
- Telegram admite el stream de razonamiento en la burbuja de borrador.

Detalles: [Directivas de pensamiento + razonamiento](/es/tools/thinking) y [Uso de tokens](/es/reference/token-use).

## Prefijos, hilado y respuestas

El formato de mensajes salientes se centraliza en `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` y `channels.<channel>.accounts.<id>.responsePrefix` (cascada de prefijos salientes), además de `channels.whatsapp.messagePrefix` (prefijo entrante de WhatsApp)
- Hilado de respuestas mediante `replyToMode` y valores predeterminados por canal

Detalles: [Configuración](/es/gateway/config-agents#messages) y la documentación de canales.

## Respuestas silenciosas

El token silencioso exacto `NO_REPLY` / `no_reply` significa “no entregar una respuesta visible para el usuario”.
Cuando un turno también tiene medios pendientes de herramientas, como audio TTS generado, OpenClaw elimina el texto silencioso pero sigue entregando el adjunto multimedia.
OpenClaw resuelve ese comportamiento por tipo de conversación:

- Las conversaciones directas no permiten silencio de forma predeterminada y reescriben una respuesta silenciosa sola a una alternativa visible breve.
- Los grupos/canales permiten silencio de forma predeterminada.
- La orquestación interna permite silencio de forma predeterminada.

OpenClaw también usa respuestas silenciosas para fallos internos del ejecutor que ocurren antes de cualquier respuesta del asistente en chats no directos, para que los grupos/canales no vean texto repetitivo de error del Gateway. Los chats directos muestran una copia de fallo compacta de forma predeterminada; los detalles sin procesar del ejecutor solo se muestran cuando `/verbose` está `on` o `full`.

Los valores predeterminados viven bajo `agents.defaults.silentReply` y `agents.defaults.silentReplyRewrite`; `surfaces.<id>.silentReply` y `surfaces.<id>.silentReplyRewrite` pueden sobrescribirlos por superficie.

Cuando la sesión principal tiene una o más ejecuciones de subagente generadas pendientes, las respuestas silenciosas solas se descartan en todas las superficies en lugar de reescribirse, de modo que la sesión principal permanezca en silencio hasta que el evento de finalización del hijo entregue la respuesta real.

## Relacionado

- [Streaming](/es/concepts/streaming) — entrega de mensajes en tiempo real
- [Reintento](/es/concepts/retry) — comportamiento de reintento de entrega de mensajes
- [Cola](/es/concepts/queue) — cola de procesamiento de mensajes
- [Canales](/es/channels) — integraciones de plataformas de mensajería
