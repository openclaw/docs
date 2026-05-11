---
read_when:
    - Explicación de cómo los mensajes entrantes se convierten en respuestas
    - Aclaración de sesiones, modos de puesta en cola o comportamiento de streaming
    - Documentar la visibilidad del razonamiento y las implicaciones de uso
summary: Flujo de mensajes, sesiones, puesta en cola y visibilidad del razonamiento
title: Mensajes
x-i18n:
    generated_at: "2026-05-11T20:30:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 053ff7b2ecca07e99057aed2f9ba199a6c1a07f15e865915045d25d128db984b
    source_path: concepts/messages.md
    workflow: 16
---

OpenClaw gestiona los mensajes entrantes mediante una canalización de resolución de sesiones, puesta en cola, transmisión, ejecución de herramientas y visibilidad del razonamiento. Esta página mapea la ruta desde el mensaje entrante hasta la respuesta.

## Flujo de mensajes (alto nivel)

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

Los controles principales están en la configuración:

- `messages.*` para prefijos, puesta en cola y comportamiento de grupos.
- `agents.defaults.*` para valores predeterminados de transmisión por bloques y fragmentación.
- Sobrescrituras de canal (`channels.whatsapp.*`, `channels.telegram.*`, etc.) para límites y conmutadores de transmisión.

Consulta [Configuración](/es/gateway/configuration) para ver el esquema completo.

## Deduplicación entrante

Los canales pueden volver a entregar el mismo mensaje después de reconexiones. OpenClaw mantiene una caché de corta duración indexada por canal/cuenta/par/sesión/id de mensaje para que las entregas duplicadas no desencadenen otra ejecución del agente.

## Desduplicación por espera entrante

Los mensajes consecutivos rápidos del **mismo remitente** pueden agruparse en un único turno del agente mediante `messages.inbound`. La espera se aplica por canal + conversación y usa el mensaje más reciente para el enhebrado/los ID de la respuesta.

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

- La espera se aplica a mensajes **solo de texto**; los medios/adjuntos se procesan inmediatamente.
- Los comandos de control omiten la espera para permanecer independientes. Los canales que aceptan explícitamente la fusión de MD del mismo remitente pueden mantener los comandos de MD dentro de la ventana de espera para que una carga enviada por partes pueda unirse al mismo turno del agente.

## Sesiones y dispositivos

Las sesiones pertenecen al Gateway, no a los clientes.

- Los chats directos se colapsan en la clave de sesión principal del agente.
- Los grupos/canales obtienen sus propias claves de sesión.
- El almacén de sesiones y las transcripciones residen en el host del Gateway.

Varios dispositivos/canales pueden mapearse a la misma sesión, pero el historial no se sincroniza completamente de vuelta a todos los clientes. Recomendación: usa un dispositivo principal para conversaciones largas a fin de evitar contextos divergentes. La interfaz de control y la TUI siempre muestran la transcripción de sesión respaldada por el Gateway, por lo que son la fuente de verdad.

Detalles: [Gestión de sesiones](/es/concepts/session).

## Metadatos de resultados de herramientas

El `content` del resultado de una herramienta es el resultado visible para el modelo. Los `details` del resultado de una herramienta son metadatos de ejecución para renderizado de la interfaz, diagnósticos, entrega de medios y plugins.

OpenClaw mantiene explícito ese límite:

- `toolResult.details` se elimina antes de la reproducción del proveedor y la entrada de Compaction.
- Las transcripciones de sesión persistidas conservan solo `details` acotados; los metadatos demasiado grandes se reemplazan por un resumen compacto marcado con `persistedDetailsTruncated: true`.
- Los plugins y herramientas deben colocar el texto que el modelo debe leer en `content`, no solo en `details`.

## Cuerpos entrantes y contexto del historial

OpenClaw separa el **cuerpo del prompt** del **cuerpo del comando**:

- `BodyForAgent`: texto principal orientado al modelo para el mensaje actual. Los plugins de canal deben mantenerlo centrado en el texto actual del remitente que contiene el prompt.
- `Body`: respaldo heredado del prompt. Puede incluir envoltorios del canal y envoltorios opcionales de historial, pero los canales actuales no deben depender de él como entrada principal del modelo cuando `BodyForAgent` está disponible.
- `CommandBody`: texto de usuario sin procesar para el análisis de directivas/comandos.
- `RawBody`: alias heredado de `CommandBody` (mantenido por compatibilidad).

Cuando un canal proporciona historial, usa un envoltorio compartido:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Para **chats no directos** (grupos/canales/salas), el **cuerpo del mensaje actual** se prefija con la etiqueta del remitente (el mismo estilo usado para las entradas de historial). Esto mantiene coherentes los mensajes en tiempo real y en cola/historial dentro del prompt del agente.

Los búferes de historial son **solo pendientes**: incluyen mensajes de grupo que _no_ desencadenaron una ejecución (por ejemplo, mensajes limitados por mención) y **excluyen** mensajes que ya están en la transcripción de la sesión.

La eliminación de directivas solo se aplica a la sección del **mensaje actual** para que el historial permanezca intacto. Los canales que envuelven historial deben establecer `CommandBody` (o `RawBody`) en el texto original del mensaje y mantener `Body` como el prompt combinado. El historial estructurado, las respuestas, los mensajes reenviados y los metadatos de canal se renderizan como bloques de contexto no confiable con rol de usuario durante el ensamblaje del prompt.
Los búferes de historial se configuran mediante `messages.groupChat.historyLimit` (valor predeterminado global) y sobrescrituras por canal como `channels.slack.historyLimit` o `channels.telegram.accounts.<id>.historyLimit` (establece `0` para desactivar).

## Puesta en cola y seguimientos

Si una ejecución ya está activa, los mensajes entrantes pueden ponerse en cola, dirigirse a la ejecución actual o recopilarse para un turno de seguimiento.

- Configura mediante `messages.queue` (y `messages.queue.byChannel`).
- El modo predeterminado es `steer`, con una espera de seguimiento de 500 ms cuando el direccionamiento recurre a la entrega de seguimiento en cola.
- Modos: `steer`, `followup`, `collect`, `steer-backlog`, `interrupt` y el modo heredado de uno a la vez `queue`.

Detalles: [Cola de comandos](/es/concepts/queue) y [Cola de direccionamiento](/es/concepts/queue-steering).

## Propiedad de ejecución del canal

Los plugins de canal pueden preservar el orden, aplicar espera a la entrada y aplicar contrapresión de transporte antes de que un mensaje entre en la cola de la sesión. No deben imponer un tiempo de espera separado alrededor del turno del agente en sí. Una vez que un mensaje se enruta a una sesión, el trabajo de larga duración se rige por el ciclo de vida de sesión, herramienta y entorno de ejecución para que todos los canales informen y se recuperen de turnos lentos de forma coherente.

## Transmisión, fragmentación y agrupación

La transmisión por bloques envía respuestas parciales a medida que el modelo produce bloques de texto. La fragmentación respeta los límites de texto del canal y evita dividir bloques de código delimitados.

Configuraciones clave:

- `agents.defaults.blockStreamingDefault` (`on|off`, desactivado por defecto)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (agrupación basada en inactividad)
- `agents.defaults.humanDelay` (pausa similar a la humana entre respuestas de bloque)
- Sobrescrituras de canal: `*.blockStreaming` y `*.blockStreamingCoalesce` (los canales que no son Telegram requieren `*.blockStreaming: true` explícito)

Detalles: [Transmisión + fragmentación](/es/concepts/streaming).

## Visibilidad del razonamiento y tokens

OpenClaw puede exponer u ocultar el razonamiento del modelo:

- `/reasoning on|off|stream` controla la visibilidad.
- El contenido de razonamiento sigue contando para el uso de tokens cuando lo produce el modelo.
- Telegram admite transmisión de razonamiento en una burbuja de borrador transitoria que se elimina después de la entrega final; usa `/reasoning on` para salida de razonamiento persistente.

Detalles: [Directivas de pensamiento + razonamiento](/es/tools/thinking) y [Uso de tokens](/es/reference/token-use).

## Prefijos, enhebrado y respuestas

El formato de mensajes salientes se centraliza en `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` y `channels.<channel>.accounts.<id>.responsePrefix` (cascada de prefijos salientes), además de `channels.whatsapp.messagePrefix` (prefijo entrante de WhatsApp)
- Enhebrado de respuestas mediante `replyToMode` y valores predeterminados por canal

Detalles: [Configuración](/es/gateway/config-agents#messages) y la documentación de canales.

## Respuestas silenciosas

El token silencioso exacto `NO_REPLY` / `no_reply` significa "no entregar una respuesta visible para el usuario".
Cuando un turno también tiene medios de herramientas pendientes, como audio TTS generado, OpenClaw elimina el texto silencioso pero aun así entrega el adjunto multimedia.
OpenClaw resuelve ese comportamiento según el tipo de conversación:

- Las conversaciones directas no permiten silencio por defecto y reescriben una respuesta silenciosa escueta como un respaldo visible breve.
- Los grupos/canales permiten silencio por defecto.
- La orquestación interna permite silencio por defecto.

OpenClaw también usa respuestas silenciosas para fallos internos del ejecutor que ocurren antes de cualquier respuesta del asistente en chats no directos, para que los grupos/canales no vean texto repetitivo de error del Gateway. Los chats directos muestran una copia compacta del fallo por defecto; los detalles sin procesar del ejecutor solo se muestran cuando `/verbose` está `on` o `full`.

Los valores predeterminados residen en `agents.defaults.silentReply` y `agents.defaults.silentReplyRewrite`; `surfaces.<id>.silentReply` y `surfaces.<id>.silentReplyRewrite` pueden sobrescribirlos por superficie.

Cuando la sesión principal tiene una o más ejecuciones de subagentes generados pendientes, las respuestas silenciosas escuetas se descartan en todas las superficies en lugar de reescribirse, por lo que la sesión principal permanece en silencio hasta que el evento de finalización del hijo entrega la respuesta real.

## Relacionado

- [Refactorización del ciclo de vida de mensajes](/es/concepts/message-lifecycle-refactor) - diseño objetivo duradero de envío y recepción
- [Transmisión](/es/concepts/streaming) — entrega de mensajes en tiempo real
- [Reintento](/es/concepts/retry) — comportamiento de reintento de entrega de mensajes
- [Cola](/es/concepts/queue) — cola de procesamiento de mensajes
- [Canales](/es/channels) — integraciones con plataformas de mensajería
