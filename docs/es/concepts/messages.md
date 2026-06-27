---
read_when:
    - Explicar cómo los mensajes entrantes se convierten en respuestas
    - Aclaración de sesiones, modos de cola o comportamiento de streaming
    - Documentar la visibilidad del razonamiento y sus implicaciones de uso
summary: Flujo de mensajes, sesiones, colas y visibilidad del razonamiento
title: Mensajes
x-i18n:
    generated_at: "2026-06-27T11:14:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d5585ae95fc65cb64240e4bf5d0bbe2eb54f55461b9fa4ee331d4d703d62e76f
    source_path: concepts/messages.md
    workflow: 16
---

OpenClaw gestiona los mensajes entrantes mediante una canalización de resolución de sesiones, puesta en cola, streaming, ejecución de herramientas y visibilidad del razonamiento. Esta página mapea la ruta desde el mensaje entrante hasta la respuesta.

## Flujo de mensajes (alto nivel)

```
Inbound message
  -> routing/bindings -> session key
  -> queue (if a run is active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

Los ajustes clave están en la configuración:

- `messages.*` para prefijos, puesta en cola y comportamiento de grupos.
- `agents.defaults.*` para valores predeterminados de streaming de bloques y segmentación.
- Sobrescrituras de canal (`channels.whatsapp.*`, `channels.telegram.*`, etc.) para límites y conmutadores de streaming.

Consulta [Configuración](/es/gateway/configuration) para ver el esquema completo.

## Desduplicación entrante

Los canales pueden volver a entregar el mismo mensaje después de reconexiones. OpenClaw mantiene una
caché de corta duración con clave por canal/cuenta/par/sesión/id de mensaje para que las entregas
duplicadas no activen otra ejecución del agente.

## Debouncing entrante

Los mensajes consecutivos rápidos del **mismo remitente** pueden agruparse en un solo
turno del agente mediante `messages.inbound`. El debouncing se delimita por canal + conversación
y usa el mensaje más reciente para el encadenamiento/los IDs de respuesta.

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

- El debounce se aplica a mensajes **solo de texto**; los medios/adjuntos se vacían inmediatamente.
- Los comandos de control omiten el debouncing para mantenerse independientes. Los canales que optan explícitamente por fusionar mensajes directos del mismo remitente pueden mantener los comandos de DM dentro de la ventana de debounce para que una carga enviada en partes pueda unirse al mismo turno del agente.

## Sesiones y dispositivos

Las sesiones pertenecen al Gateway, no a los clientes.

- Los chats directos se condensan en la clave de sesión principal del agente.
- Los grupos/canales obtienen sus propias claves de sesión.
- El almacén de sesiones y las transcripciones viven en el host del Gateway.

Varios dispositivos/canales pueden mapearse a la misma sesión, pero el historial no se
sincroniza por completo de vuelta a cada cliente. Recomendación: usa un dispositivo principal para conversaciones
largas a fin de evitar contexto divergente. La Control UI y la TUI siempre muestran la
transcripción de sesión respaldada por el Gateway, por lo que son la fuente de verdad.

Detalles: [Gestión de sesiones](/es/concepts/session).

## Metadatos de resultados de herramientas

El `content` del resultado de herramienta es el resultado visible para el modelo. `details` del resultado de herramienta son
metadatos de runtime para renderizado de UI, diagnósticos, entrega de medios y plugins.

OpenClaw mantiene explícito ese límite:

- `toolResult.details` se elimina antes de la reproducción del proveedor y la entrada de Compaction.
- Las transcripciones de sesión persistidas conservan solo `details` acotados; los metadatos demasiado grandes
  se reemplazan por un resumen compacto marcado como `persistedDetailsTruncated: true`.
- Los plugins y las herramientas deben poner el texto que el modelo debe leer en `content`, no solo
  en `details`.

## Cuerpos entrantes y contexto de historial

OpenClaw separa el **cuerpo del prompt** del **cuerpo del comando**:

- `BodyForAgent`: texto principal orientado al modelo para el mensaje actual. Los plugins de canal
  deben mantenerlo centrado en el texto actual del remitente que contiene el prompt.
- `Body`: fallback de prompt heredado. Puede incluir envoltorios de canal y
  wrappers opcionales de historial, pero los canales actuales no deben depender de él como
  entrada principal del modelo cuando `BodyForAgent` está disponible.
- `CommandBody`: texto sin procesar del usuario para el análisis de directivas/comandos.
- `RawBody`: alias heredado de `CommandBody` (conservado por compatibilidad).

Cuando un canal proporciona historial, usa un wrapper compartido:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Para **chats no directos** (grupos/canales/salas), el **cuerpo del mensaje actual** lleva como prefijo la
etiqueta del remitente (el mismo estilo usado para las entradas del historial). Esto mantiene coherentes los mensajes
en tiempo real y en cola/historial dentro del prompt del agente.

Los búferes de historial son **solo pendientes**: incluyen mensajes de grupo que _no_
activaron una ejecución (por ejemplo, mensajes filtrados por mención) y **excluyen** mensajes
ya presentes en la transcripción de la sesión.

La eliminación de directivas solo se aplica a la sección del **mensaje actual** para que el historial
permanezca intacto. Los canales que envuelven historial deben establecer `CommandBody` (o
`RawBody`) en el texto original del mensaje y mantener `Body` como el prompt combinado.
El historial estructurado, las respuestas, los mensajes reenviados y los metadatos de canal se renderizan como
bloques de contexto no confiables de rol de usuario durante el ensamblado del prompt.
Los búferes de historial se configuran mediante `messages.groupChat.historyLimit` (valor
predeterminado global) y sobrescrituras por canal como `channels.slack.historyLimit` o
`channels.telegram.accounts.<id>.historyLimit` (establece `0` para desactivar).

## Puesta en cola y seguimientos

Si una ejecución ya está activa, los mensajes entrantes se dirigen a la ejecución actual de forma
predeterminada. `messages.queue` selecciona si los mensajes durante una ejecución activa se dirigen, se ponen en cola para
después, se recopilan en un turno posterior o interrumpen la ejecución activa.

- Configura mediante `messages.queue` (y `messages.queue.byChannel`).
- El modo predeterminado es `steer`, con un debounce de 500 ms para lotes de dirección de Codex y
  colas de followup/collect.
- Modos: `steer`, `followup`, `collect` e `interrupt`.

Detalles: [Cola de comandos](/es/concepts/queue) y [Cola de dirección](/es/concepts/queue-steering).

## Propiedad de ejecución del canal

Los plugins de canal pueden preservar el orden, aplicar debounce a la entrada y aplicar contrapresión de transporte
antes de que un mensaje entre en la cola de sesión. No deben imponer un
tiempo de espera separado alrededor del propio turno del agente. Una vez que un mensaje se enruta a una
sesión, el trabajo de larga duración se gobierna por el ciclo de vida de la sesión, la herramienta y el runtime
para que todos los canales informen y se recuperen de turnos lentos de forma coherente.

## Streaming, segmentación y agrupación

El streaming de bloques envía respuestas parciales a medida que el modelo produce bloques de texto.
La segmentación respeta los límites de texto del canal y evita dividir código delimitado.

Ajustes clave:

- `agents.defaults.blockStreamingDefault` (`on|off`, desactivado de forma predeterminada)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (agrupación basada en inactividad)
- `agents.defaults.humanDelay` (pausa similar a la humana entre respuestas por bloques)
- Sobrescrituras de canal: `*.blockStreaming` y `*.blockStreamingCoalesce` (los canales que no son Telegram requieren `*.blockStreaming: true` explícito)

Detalles: [Streaming + segmentación](/es/concepts/streaming).

## Visibilidad del razonamiento y tokens

OpenClaw puede mostrar u ocultar el razonamiento del modelo:

- `/reasoning on|off|stream` controla la visibilidad.
- El contenido de razonamiento sigue contando para el uso de tokens cuando lo produce el modelo.
- Telegram admite streaming de razonamiento en una burbuja de borrador transitoria que se elimina después de la entrega final; usa `/reasoning on` para salida de razonamiento persistente.

Detalles: [Directivas de pensamiento + razonamiento](/es/tools/thinking) y [Uso de tokens](/es/reference/token-use).

## Prefijos, encadenamiento y respuestas

El formato de mensajes salientes está centralizado en `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` y `channels.<channel>.accounts.<id>.responsePrefix` (cascada de prefijos salientes), además de `channels.whatsapp.messagePrefix` (prefijo entrante de WhatsApp)
- Encadenamiento de respuestas mediante `replyToMode` y valores predeterminados por canal

Detalles: [Configuración](/es/gateway/config-agents#messages) y documentación de canales.

## Respuestas silenciosas

El token silencioso exacto `NO_REPLY` / `no_reply` significa "no entregar una respuesta visible para el usuario".
Cuando un turno también tiene medios de herramienta pendientes, como audio TTS generado, OpenClaw
elimina el texto silencioso pero aun así entrega el adjunto multimedia.
OpenClaw resuelve ese comportamiento por tipo de conversación:

- Las conversaciones directas nunca reciben guía de prompt `NO_REPLY`. Si una ejecución directa
  devuelve accidentalmente un token silencioso desnudo, OpenClaw lo suprime en lugar
  de reescribirlo o entregarlo.
- Los grupos/canales permiten silencio de forma predeterminada solo para respuestas automáticas de grupo.
  En modo de respuesta visible `message_tool`, el silencio significa que el modelo no llama a
  `message(action=send)`.
- La orquestación interna permite silencio de forma predeterminada.

OpenClaw también usa respuestas silenciosas para fallos genéricos del ejecutor interno en
chats no directos, de modo que los grupos/canales no vean texto repetitivo de error del Gateway.
Los fallos clasificados con texto de recuperación orientado al usuario, como falta de autenticación,
límite de tasa o avisos de sobrecarga, aún pueden entregarse. Los chats directos muestran
texto compacto de fallo de forma predeterminada; los detalles sin procesar del ejecutor solo se muestran cuando
`/verbose full` está activado.

Los valores predeterminados viven bajo `agents.defaults.silentReply`; `surfaces.<id>.silentReply`
puede sobrescribir la política de grupo/interna por superficie.

Las respuestas silenciosas desnudas se descartan en todas las superficies, por lo que las sesiones padre permanecen en silencio
en lugar de reescribir texto centinela como charla de fallback.

## Relacionado

- [Refactorización del ciclo de vida de mensajes](/es/concepts/message-lifecycle-refactor) - diseño objetivo duradero de envío y recepción
- [Streaming](/es/concepts/streaming) — entrega de mensajes en tiempo real
- [Reintento](/es/concepts/retry) — comportamiento de reintento de entrega de mensajes
- [Cola](/es/concepts/queue) — cola de procesamiento de mensajes
- [Canales](/es/channels) — integraciones con plataformas de mensajería
