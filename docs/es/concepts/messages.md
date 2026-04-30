---
read_when:
    - Explicación de cómo los mensajes entrantes se convierten en respuestas
    - Aclaración de sesiones, modos de puesta en cola o comportamiento de transmisión
    - Documentación de la visibilidad del razonamiento y las implicaciones de uso
summary: Flujo de mensajes, sesiones, puesta en cola y visibilidad del razonamiento
title: Mensajes
x-i18n:
    generated_at: "2026-04-30T16:27:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: fdeee014d92767a725501691fbe0c4ee6b631acc9a2ab5cbbcf321bfee9679b9
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

Los controles clave están en la configuración:

- `messages.*` para prefijos, puesta en cola y comportamiento de grupos.
- `agents.defaults.*` para valores predeterminados de streaming por bloques y fragmentación.
- Sobrescrituras de canales (`channels.whatsapp.*`, `channels.telegram.*`, etc.) para límites y conmutadores de streaming.

Consulta [Configuración](/es/gateway/configuration) para ver el esquema completo.

## Deduplicación entrante

Los canales pueden volver a entregar el mismo mensaje después de reconexiones. OpenClaw mantiene una caché de corta duración basada en canal/cuenta/par/sesión/id de mensaje para que las entregas duplicadas no activen otra ejecución del agente.

## Antirrebote entrante

Los mensajes consecutivos rápidos del **mismo remitente** pueden agruparse en un único turno del agente mediante `messages.inbound`. El antirrebote tiene alcance por canal + conversación y usa el mensaje más reciente para el hilado/los ID de respuesta.

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

- El antirrebote se aplica a mensajes **solo de texto**; los medios/adjuntos se despachan inmediatamente.
- Los comandos de control omiten el antirrebote para permanecer independientes, **excepto** cuando un canal opta explícitamente por la coalescencia de DM del mismo remitente (por ejemplo, [BlueBubbles `coalesceSameSenderDms`](/es/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)), donde los comandos de DM esperan dentro de la ventana de antirrebote para que una carga útil enviada en partes pueda unirse al mismo turno del agente.

## Sesiones y dispositivos

Las sesiones pertenecen al Gateway, no a los clientes.

- Los chats directos se colapsan en la clave de sesión principal del agente.
- Los grupos/canales obtienen sus propias claves de sesión.
- El almacén de sesiones y las transcripciones viven en el host del Gateway.

Varios dispositivos/canales pueden asignarse a la misma sesión, pero el historial no se sincroniza completamente de vuelta a todos los clientes. Recomendación: usa un dispositivo principal para conversaciones largas a fin de evitar contexto divergente. La interfaz de control y la TUI siempre muestran la transcripción de sesión respaldada por el Gateway, por lo que son la fuente de la verdad.

Detalles: [Gestión de sesiones](/es/concepts/session).

## Metadatos de resultados de herramientas

El `content` del resultado de una herramienta es el resultado visible para el modelo. Los `details` del resultado de una herramienta son metadatos de runtime para renderizado de la interfaz, diagnósticos, entrega de medios y plugins.

OpenClaw mantiene explícito ese límite:

- `toolResult.details` se elimina antes de la repetición del proveedor y la entrada de Compaction.
- Las transcripciones de sesión persistidas conservan solo `details` acotados; los metadatos sobredimensionados se reemplazan por un resumen compacto marcado con `persistedDetailsTruncated: true`.
- Los plugins y las herramientas deben poner el texto que el modelo debe leer en `content`, no solo en `details`.

## Cuerpos entrantes y contexto de historial

OpenClaw separa el **cuerpo del prompt** del **cuerpo del comando**:

- `BodyForAgent`: texto principal orientado al modelo para el mensaje actual. Los plugins de canal deben mantenerlo centrado en el texto actual del remitente que contiene el prompt.
- `Body`: alternativa heredada para el prompt. Puede incluir envoltorios de canal y envoltorios opcionales de historial, pero los canales actuales no deben depender de él como entrada principal del modelo cuando `BodyForAgent` está disponible.
- `CommandBody`: texto bruto del usuario para análisis de directivas/comandos.
- `RawBody`: alias heredado de `CommandBody` (conservado por compatibilidad).

Cuando un canal proporciona historial, usa un envoltorio compartido:

- `[Mensajes de chat desde tu última respuesta - para contexto]`
- `[Mensaje actual - responde a esto]`

Para **chats no directos** (grupos/canales/salas), el **cuerpo del mensaje actual** tiene como prefijo la etiqueta del remitente (el mismo estilo usado para entradas de historial). Esto mantiene coherentes los mensajes en tiempo real y los mensajes en cola/historial en el prompt del agente.

Los búferes de historial son **solo pendientes**: incluyen mensajes de grupo que _no_ activaron una ejecución (por ejemplo, mensajes filtrados por mención) y **excluyen** mensajes que ya están en la transcripción de sesión.

La eliminación de directivas solo se aplica a la sección del **mensaje actual** para que el historial permanezca intacto. Los canales que envuelven historial deben establecer `CommandBody` (o `RawBody`) en el texto original del mensaje y mantener `Body` como el prompt combinado. El historial estructurado, las respuestas, los mensajes reenviados y los metadatos de canal se renderizan como bloques de contexto no confiable con rol de usuario durante el ensamblado del prompt.
Los búferes de historial se pueden configurar mediante `messages.groupChat.historyLimit` (valor predeterminado global) y sobrescrituras por canal como `channels.slack.historyLimit` o `channels.telegram.accounts.<id>.historyLimit` (establece `0` para deshabilitar).

## Puesta en cola y seguimientos

Si ya hay una ejecución activa, los mensajes entrantes pueden ponerse en cola, dirigirse a la ejecución actual o recopilarse para un turno de seguimiento.

- Configura mediante `messages.queue` (y `messages.queue.byChannel`).
- El modo predeterminado es `steer`, con un antirrebote de seguimiento de 500 ms cuando el direccionamiento recurre a la entrega de seguimiento en cola.
- Modos: `steer`, `followup`, `collect`, `steer-backlog`, `interrupt` y el modo heredado de uno a la vez `queue`.

Detalles: [Cola de comandos](/es/concepts/queue) y [Cola de direccionamiento](/es/concepts/queue-steering).

## Propiedad de ejecución del canal

Los plugins de canal pueden preservar el orden, aplicar antirrebote a la entrada y aplicar contrapresión de transporte antes de que un mensaje entre en la cola de sesión. No deben imponer un tiempo de espera independiente alrededor del turno del agente en sí. Una vez que un mensaje se enruta a una sesión, el trabajo de larga duración se rige por el ciclo de vida de la sesión, la herramienta y el runtime para que todos los canales informen y se recuperen de turnos lentos de forma coherente.

## Streaming, fragmentación y agrupación por lotes

El streaming por bloques envía respuestas parciales a medida que el modelo produce bloques de texto. La fragmentación respeta los límites de texto del canal y evita dividir código delimitado.

Configuraciones clave:

- `agents.defaults.blockStreamingDefault` (`on|off`, desactivado de forma predeterminada)
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
- Telegram admite streaming de razonamiento en la burbuja de borrador.

Detalles: [Directivas de pensamiento + razonamiento](/es/tools/thinking) y [Uso de tokens](/es/reference/token-use).

## Prefijos, hilado y respuestas

El formato de mensajes salientes se centraliza en `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` y `channels.<channel>.accounts.<id>.responsePrefix` (cascada de prefijos salientes), además de `channels.whatsapp.messagePrefix` (prefijo entrante de WhatsApp)
- Hilado de respuestas mediante `replyToMode` y valores predeterminados por canal

Detalles: [Configuración](/es/gateway/config-agents#messages) y documentación de canales.

## Respuestas silenciosas

El token silencioso exacto `NO_REPLY` / `no_reply` significa “no entregues una respuesta visible para el usuario”.
Cuando un turno también tiene medios de herramienta pendientes, como audio TTS generado, OpenClaw elimina el texto silencioso pero aun así entrega el adjunto multimedia.
OpenClaw resuelve ese comportamiento por tipo de conversación:

- Las conversaciones directas no permiten silencio de forma predeterminada y reescriben una respuesta silenciosa desnuda como una alternativa visible breve.
- Los grupos/canales permiten silencio de forma predeterminada.
- La orquestación interna permite silencio de forma predeterminada.

OpenClaw también usa respuestas silenciosas para fallos internos del ejecutor que ocurren antes de cualquier respuesta del asistente en chats no directos, para que los grupos/canales no vean texto genérico de error del Gateway. Los chats directos muestran texto de fallo compacto de forma predeterminada; los detalles brutos del ejecutor se muestran solo cuando `/verbose` está `on` o `full`.

Los valores predeterminados viven bajo `agents.defaults.silentReply` y `agents.defaults.silentReplyRewrite`; `surfaces.<id>.silentReply` y `surfaces.<id>.silentReplyRewrite` pueden sobrescribirlos por superficie.

Cuando la sesión padre tiene una o más ejecuciones pendientes de subagentes generados, las respuestas silenciosas desnudas se descartan en todas las superficies en lugar de reescribirse, por lo que el padre permanece en silencio hasta que el evento de finalización del hijo entrega la respuesta real.

## Relacionado

- [Streaming](/es/concepts/streaming) — entrega de mensajes en tiempo real
- [Reintento](/es/concepts/retry) — comportamiento de reintento de entrega de mensajes
- [Cola](/es/concepts/queue) — cola de procesamiento de mensajes
- [Canales](/es/channels) — integraciones con plataformas de mensajería
