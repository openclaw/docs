---
read_when:
    - Explicación de cómo los mensajes entrantes se convierten en respuestas
    - Aclaración de sesiones, modos de cola o comportamiento de streaming
    - Documentar la visibilidad del razonamiento y sus implicaciones de uso
summary: Flujo de mensajes, sesiones, puesta en cola y visibilidad del razonamiento
title: Mensajes
x-i18n:
    generated_at: "2026-07-05T11:14:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 92146d8fe08aedfea3ae01b653a303da626651b33b39d6beb22ef867e13eef2f
    source_path: concepts/messages.md
    workflow: 16
---

Los mensajes entrantes pasan por enrutamiento, deduplicación/debounce, una ejecución del agente y entrega saliente:

```text
Inbound message
  -> routing/bindings -> session key
  -> dedupe + debounce
  -> queue (if a run is already active)
  -> agent run (streaming + tools)
  -> outbound replies (channel limits + chunking)
```

Superficies de configuración clave:

- `messages.*` para prefijos, colas, debounce entrante y comportamiento de grupos.
- `agents.defaults.*` para streaming por bloques, fragmentación y valores predeterminados de respuestas silenciosas.
- Sobrescrituras de canal (`channels.telegram.*`, `channels.whatsapp.*`, etc.) para límites por canal y conmutadores de streaming.

Consulta [Configuración](/es/gateway/configuration) para ver el esquema completo.

## Deduplicación entrante

Los canales pueden volver a entregar el mismo mensaje después de una reconexión. OpenClaw mantiene una caché en memoria indexada por alcance del agente, ruta del canal (canal + par + cuenta + hilo) e id del mensaje, de modo que un mensaje vuelto a entregar no dispara una segunda ejecución del agente. La entrada de caché vence después de 20 minutos o cuando se rastrean 5000 entradas, lo que ocurra primero.

## Debounce entrante

Los mensajes de texto consecutivos y rápidos del mismo remitente se pueden agrupar en un solo turno del agente mediante `messages.inbound`. El debounce tiene alcance por canal + conversación y usa el mensaje más reciente para el enhebrado/los IDs de respuesta.

```json5
{
  messages: {
    inbound: {
      debounceMs: 2000,
      byChannel: {
        discord: 1500,
        slack: 1500,
        whatsapp: 5000,
      },
    },
  },
}
```

- El debounce se aplica a mensajes solo de texto; los medios/adjuntos se vacían inmediatamente.
- Los comandos de control (stop/abort/status, etc.) omiten el debounce para que se despachen de inmediato.
- Deshabilitado de forma predeterminada: `messages.inbound.debounceMs` no tiene ningún valor predeterminado integrado, por lo que el debounce solo se activa cuando lo configuras (globalmente o por canal).
- La opción explícita `coalesceSameSenderDms` de iMessage es la única excepción: retiene todo el texto de DM del mismo remitente (comandos incluidos) el tiempo suficiente para que el envío dividido de comando+URL de Apple llegue como un solo turno. Los chats grupales siempre se despachan al instante independientemente de esta configuración.

## Sesiones y dispositivos

Las sesiones son propiedad del Gateway, no de los clientes.

- Los chats directos se condensan en la clave de sesión principal del agente.
- Los grupos/canales obtienen sus propias claves de sesión.
- El almacén de sesiones y las transcripciones residen en el host del Gateway.

Varios dispositivos/canales pueden mapearse a la misma sesión, pero el historial no se sincroniza completamente de vuelta a cada cliente. Usa un dispositivo principal para conversaciones largas a fin de evitar contexto divergente. La Control UI y la TUI siempre muestran la transcripción de la sesión respaldada por el Gateway, por lo que son la fuente de verdad.

Detalles: [Gestión de sesiones](/es/concepts/session).

## Cuerpos de prompt y contexto del historial

Los plugins de canal rellenan varios campos de texto en el contexto entrante, de mayor a menor preferencia:

| Campo             | Propósito                                                                                                     |
| ----------------- | ----------------------------------------------------------------------------------------------------------- |
| `BodyForAgent`    | Texto orientado al modelo para el turno actual. Recurre a `CommandBody` / `RawBody` / `Body` cuando no está establecido.        |
| `BodyForCommands` | Texto limpio usado para analizar directivas/comandos. Recurre a `CommandBody` / `RawBody` / `Body` cuando no está establecido. |
| `CommandBody`     | Cuerpo intermedio heredado; prefiere `BodyForCommands`.                                                         |
| `RawBody`         | Alias obsoleto de `CommandBody`.                                                                         |
| `Body`            | Cuerpo de prompt heredado; puede incluir envoltorios de canal y de historial.                                     |

Cuando un canal proporciona historial, lo envuelve con:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Para chats no directos (grupos/canales/salas), el cuerpo del mensaje actual lleva como prefijo la etiqueta del remitente, coincidiendo con el estilo usado para las entradas del historial. La eliminación de directivas solo se aplica a la sección del mensaje actual, por lo que el historial permanece intacto. Los canales que envuelven historial deben establecer `BodyForCommands` (o el `CommandBody` / `RawBody` heredado) en el texto original del mensaje y mantener `Body` como el prompt combinado.

Los búferes de historial son solo pendientes: incluyen mensajes de grupo que no dispararon una ejecución (por ejemplo, mensajes sujetos a mención) y excluyen mensajes que ya están en la transcripción de la sesión. El historial estructurado, las respuestas, los mensajes reenviados y los metadatos de canal se renderizan como bloques de contexto no confiables con rol de usuario durante el ensamblaje del prompt.

Configura el tamaño del historial con `messages.groupChat.historyLimit` (valor predeterminado global) o sobrescrituras por canal como `channels.slack.historyLimit` y `channels.telegram.accounts.<id>.historyLimit` (establece `0` para deshabilitarlo).

## Metadatos de resultados de herramientas

El `content` del resultado de herramienta es el resultado visible para el modelo; `details` son metadatos de runtime para renderizado de UI, diagnósticos, entrega de medios y plugins.

- `toolResult.details` se elimina antes de la reproducción del proveedor y antes de la entrada de Compaction.
- Las transcripciones de sesión persistidas conservan solo `details` acotados; los metadatos sobredimensionados se reemplazan por un resumen compacto marcado como `persistedDetailsTruncated: true`.
- Los plugins y las herramientas deben poner en `content` el texto que el modelo debe leer, no solo en `details`.

## Colas y seguimientos

Cuando una ejecución ya está activa, los mensajes entrantes la dirigen de forma predeterminada. `messages.queue` controla el modo:

| Modo              | Comportamiento                                            |
| ----------------- | --------------------------------------------------- |
| `steer` (predeterminado) | Inyecta el nuevo prompt en la ejecución activa.          |
| `followup`        | Ejecuta el mensaje después de que termine la ejecución activa.      |
| `collect`         | Agrupa mensajes compatibles en un turno posterior.      |
| `interrupt`       | Aborta la ejecución activa y luego inicia el prompt más reciente. |

Valores predeterminados: `messages.queue.debounceMs` es 500 ms (se aplica por igual a steer, followup y agrupación collect), `messages.queue.cap` es 20 mensajes en cola, y `messages.queue.drop` es `summarize` (`old` y `new` también están disponibles). Configura sobrescrituras por canal mediante `messages.queue.byChannel` y `messages.queue.debounceMsByChannel`.

Detalles: [Cola de comandos](/es/concepts/queue) y [Cola de direccionamiento](/es/concepts/queue-steering).

## Propiedad de ejecuciones de canal

Los plugins de canal pueden preservar el orden, aplicar debounce a la entrada y aplicar contrapresión de transporte antes de que un mensaje entre en la cola de sesión. No deben imponer un timeout separado alrededor del turno del agente en sí. Una vez que un mensaje se enruta a una sesión, el ciclo de vida de la sesión, las herramientas y el runtime gobierna el trabajo de larga duración para que todos los canales informen y se recuperen de turnos lentos de forma coherente.

## Streaming, fragmentación y agrupación

El streaming por bloques envía respuestas parciales a medida que el modelo produce bloques de texto; la fragmentación respeta los límites de texto del canal y evita dividir código delimitado.

- `agents.defaults.blockStreamingDefault` (`on|off`, predeterminado `off`)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (agrupación basada en inactividad)
- `agents.defaults.humanDelay` (pausa similar a la humana entre respuestas por bloque)
- Sobrescrituras de canal: `*.blockStreaming` y `*.blockStreamingCoalesce` (el streaming por bloques está desactivado salvo que `*.blockStreaming` se establezca explícitamente en `true`, en todos los canales, incluido Telegram).

Detalles: [Streaming + fragmentación](/es/concepts/streaming).

## Visibilidad del razonamiento y tokens

- `/reasoning on|off|stream` controla la visibilidad.
- El contenido de razonamiento sigue contando para el uso de tokens cuando el modelo lo produce.
- Telegram admite streaming de razonamiento en una burbuja de borrador transitoria que se elimina después de la entrega final; usa `/reasoning on` para una salida de razonamiento persistente.

Detalles: [Directivas de pensamiento + razonamiento](/es/tools/thinking) y [Uso de tokens](/es/reference/token-use).

## Prefijos, enhebrado y respuestas

- Cascada de prefijos salientes: `messages.responsePrefix`, `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`. WhatsApp también tiene `channels.whatsapp.messagePrefix` para un prefijo entrante.
- Enhebrado de respuestas mediante `replyToMode` y valores predeterminados por canal.

Detalles: [Configuración](/es/gateway/config-agents#messages) y documentación de canales.

## Respuestas silenciosas

El token silencioso `NO_REPLY` (insensible a mayúsculas/minúsculas, por lo que `no_reply` también coincide) significa "no entregar una respuesta visible para el usuario". Cuando un turno también tiene medios de herramienta pendientes, como audio TTS generado, OpenClaw elimina el texto silencioso pero sigue entregando el adjunto multimedia.

La política de silencio se resuelve por tipo de conversación:

- Las conversaciones directas nunca reciben guía de prompt `NO_REPLY`. Si una ejecución directa devuelve accidentalmente un token silencioso aislado, OpenClaw lo suprime en lugar de reescribirlo o entregarlo.
- Los grupos/canales permiten silencio de forma predeterminada. En modo de respuesta visible `message_tool`, silencio significa que el modelo no llama a `message(action=send)`.
- La orquestación interna permite silencio de forma predeterminada.

Los valores predeterminados viven bajo `agents.defaults.silentReply`; `surfaces.<id>.silentReply` puede sobrescribir la política de grupo/interna por superficie.

OpenClaw también usa respuestas silenciosas para fallos genéricos del ejecutor interno en chats no directos, de modo que los grupos/canales no vean texto repetitivo de error del Gateway. Los fallos clasificados con texto de recuperación orientado al usuario, como autenticación faltante, límite de tasa o avisos de sobrecarga, aún pueden entregarse. Los chats directos muestran texto de fallo compacto de forma predeterminada; los detalles sin procesar del ejecutor solo se muestran cuando `/verbose full` está habilitado.

Las respuestas silenciosas aisladas se descartan en todas las superficies, por lo que las sesiones padre permanecen silenciosas en lugar de reescribir texto centinela en charla de reserva.

## Relacionado

- [Refactor del ciclo de vida de mensajes](/es/concepts/message-lifecycle-refactor) - diseño objetivo duradero de envío y recepción
- [Streaming](/es/concepts/streaming) - entrega de mensajes en tiempo real
- [Reintento](/es/concepts/retry) - comportamiento de reintento de entrega de mensajes
- [Cola](/es/concepts/queue) - cola de procesamiento de mensajes
- [Canales](/es/channels) - integraciones con plataformas de mensajería
