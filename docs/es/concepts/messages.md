---
read_when:
    - Explicación de cómo los mensajes entrantes se convierten en respuestas
    - Aclaración sobre las sesiones, los modos de cola o el comportamiento de transmisión en tiempo real
    - Documentación de la visibilidad del razonamiento y sus implicaciones de uso
summary: Flujo de mensajes, sesiones, puesta en cola y visibilidad del razonamiento
title: Mensajes
x-i18n:
    generated_at: "2026-07-20T00:47:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 843b9defdd56f55b8cb43c366f247a740cf851fb86bbef66a422cf8efdebe059
    source_path: concepts/messages.md
    workflow: 16
---

Los mensajes entrantes pasan por el enrutamiento, la desduplicación/espera antirrebote, una ejecución del agente y la entrega saliente:

```text
Mensaje entrante
  -> enrutamiento/vinculaciones -> clave de sesión
  -> desduplicación + espera antirrebote
  -> cola (si ya hay una ejecución activa)
  -> ejecución del agente (streaming + herramientas)
  -> respuestas salientes (límites del canal + división en fragmentos)
```

Superficies de configuración principales:

- `messages.*` para prefijos, gestión de colas, espera antirrebote de mensajes entrantes y comportamiento de grupos.
- `agents.defaults.*` para streaming por bloques, división en fragmentos y valores predeterminados de respuestas silenciosas.
- Opciones específicas del canal (`channels.telegram.*`, `channels.whatsapp.*`, etc.) para límites por canal y controles de streaming.

Consulte [Configuración](/es/gateway/configuration) para ver el esquema completo.

## Desduplicación de mensajes entrantes

Los canales pueden volver a entregar el mismo mensaje tras una reconexión. OpenClaw mantiene una caché en memoria cuya clave se compone del ámbito del agente, la ruta del canal (canal + interlocutor + cuenta + hilo) y el identificador del mensaje, de modo que un mensaje entregado de nuevo no active una segunda ejecución del agente. La entrada de caché caduca después de 20 minutos o cuando se alcanzan 5000 entradas registradas, lo que ocurra primero.

## Espera antirrebote de mensajes entrantes

Los mensajes de texto consecutivos enviados rápidamente por el mismo remitente pueden agruparse en un único turno del agente mediante `messages.inbound`. La espera antirrebote se aplica por canal + conversación y utiliza el mensaje más reciente para el hilo y los identificadores de la respuesta.

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

- La espera antirrebote se aplica únicamente a los mensajes de texto; los archivos multimedia y adjuntos se procesan inmediatamente.
- Los comandos de control (detener/abortar/estado, etc.) omiten la espera antirrebote para enviarse inmediatamente.
- Desactivada de forma predeterminada: `messages.inbound.debounceMs` no tiene ningún valor predeterminado integrado, por lo que la espera antirrebote solo se activa cuando se configura (globalmente o por canal).
- La activación opcional de `coalesceSameSenderDms` en iMessage es la única excepción: retiene todos los mensajes de texto directos del mismo remitente (incluidos los comandos) el tiempo suficiente para que el envío dividido de comando+URL de Apple llegue como un solo turno. Los chats grupales siempre se envían al instante, independientemente de esta configuración.

## Sesiones y dispositivos

Las sesiones pertenecen al Gateway, no a los clientes.

- Los chats directos se agrupan en la clave de sesión principal del agente.
- Los grupos/canales reciben sus propias claves de sesión.
- El almacén de sesiones y las transcripciones se encuentran en el host del Gateway.

Varios dispositivos/canales pueden asignarse a la misma sesión, pero el historial no se sincroniza por completo con todos los clientes. Utilice un dispositivo principal para las conversaciones largas a fin de evitar contextos divergentes. La interfaz de control y la TUI siempre muestran la transcripción de sesión respaldada por el Gateway, por lo que constituyen la fuente de verdad.

Detalles: [Gestión de sesiones](/es/concepts/session).

## Cuerpos de las solicitudes y contexto del historial

Los plugins de canal rellenan varios campos de texto en el contexto entrante, del más al menos recomendado:

| Campo             | Finalidad                                                                                                     |
| ----------------- | ----------------------------------------------------------------------------------------------------------- |
| `BodyForAgent`    | Texto para el modelo durante el turno actual. Si no está definido, recurre a `CommandBody` / `RawBody` / `Body`.        |
| `BodyForCommands` | Texto limpio utilizado para analizar directivas/comandos. Si no está definido, recurre a `CommandBody` / `RawBody` / `Body`. |
| `CommandBody`     | Cuerpo intermedio heredado; se recomienda `BodyForCommands`.                                                         |
| `RawBody`         | Alias obsoleto de `CommandBody`.                                                                         |
| `Body`            | Cuerpo de solicitud heredado; puede incluir envoltorios del canal y del historial.                                     |

Cuando un canal proporciona historial, lo envuelve con:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

En los chats no directos (grupos/canales/salas), el cuerpo del mensaje actual lleva como prefijo la etiqueta del remitente, siguiendo el estilo utilizado para las entradas del historial. La eliminación de directivas solo se aplica a la sección del mensaje actual, por lo que el historial permanece intacto. Los canales que envuelven el historial deben establecer `BodyForCommands` (o los valores heredados `CommandBody` / `RawBody`) con el texto original del mensaje y conservar `Body` como solicitud combinada.

Los búferes del historial solo contienen elementos pendientes: incluyen mensajes grupales que no activaron ninguna ejecución (por ejemplo, mensajes sujetos a menciones) y excluyen los mensajes que ya están en la transcripción de la sesión. Durante el ensamblado de la solicitud, el historial estructurado y los metadatos de respuestas, reenvíos y canales se representan como bloques de contexto no confiables con rol de usuario.

Configure el tamaño del historial mediante `messages.groupChat.historyLimit` (valor predeterminado global) o mediante opciones específicas del canal, como `channels.slack.historyLimit` y `channels.telegram.accounts.<id>.historyLimit` (establezca `0` para desactivarlo).

## Metadatos de resultados de herramientas

El `content` del resultado de la herramienta es el resultado visible para el modelo; `details` contiene metadatos de ejecución para la representación en la interfaz, el diagnóstico, la entrega multimedia y los plugins.

- `toolResult.details` se elimina antes de volver a reproducir el contenido para el proveedor y antes de usarlo como entrada para Compaction.
- Las transcripciones de sesión persistentes solo conservan `details` con un tamaño limitado; los metadatos demasiado grandes se sustituyen por un resumen compacto marcado como `persistedDetailsTruncated: true`.
- Los plugins y las herramientas deben colocar el texto que el modelo deba leer en `content`, no únicamente en `details`.

## Gestión de colas y seguimientos

Cuando ya hay una ejecución activa, los mensajes entrantes se incorporan a ella de forma predeterminada. `messages.queue` controla el modo:

| Modo              | Comportamiento                                            |
| ----------------- | --------------------------------------------------- |
| `steer` (predeterminado) | Inyecta la nueva solicitud en la ejecución activa.          |
| `followup`        | Ejecuta el mensaje cuando finaliza la ejecución activa.      |
| `collect`         | Agrupa los mensajes compatibles en un turno posterior.      |
| `interrupt`       | Aborta la ejecución activa y, a continuación, inicia la solicitud más reciente. |

La cola utiliza una espera antirrebote integrada de 500ms para agrupar las incorporaciones, los seguimientos y las recopilaciones. El valor predeterminado de `messages.queue.cap` es 20 mensajes en cola y el de `messages.queue.drop` es `summarize` (`old` y `new` también están disponibles). Configure las opciones específicas del canal mediante `messages.queue.byChannel` y `messages.queue.debounceMsByChannel`.

Detalles: [Cola de comandos](/es/concepts/queue) y [Cola de redirección](/es/concepts/queue-steering).

## Propiedad de la ejecución del canal

Los plugins de canal pueden conservar el orden, aplicar espera antirrebote a la entrada y ejercer contrapresión de transporte antes de que un mensaje entre en la cola de la sesión. No deben imponer un tiempo de espera independiente al propio turno del agente. Una vez que un mensaje se dirige a una sesión, los ciclos de vida de la sesión, las herramientas y la ejecución rigen el trabajo prolongado para que todos los canales informen sobre los turnos lentos y se recuperen de ellos de forma coherente.

## Streaming, división en fragmentos y agrupación

El streaming por bloques envía respuestas parciales a medida que el modelo produce bloques de texto; la división en fragmentos respeta los límites de texto del canal y evita dividir bloques de código delimitados.

- `agents.defaults.blockStreamingDefault` (`on|off`, valor predeterminado `off`)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (agrupación basada en inactividad)
- `agents.defaults.humanDelay` (pausa similar a la humana entre respuestas por bloques)
- Opciones específicas del canal: `*.streaming.block.enabled` y `*.streaming.block.coalesce` en los canales incluidos; `openclaw doctor --fix` migra las claves planas obsoletas. El streaming por bloques está desactivado salvo que se habilite explícitamente en todos los canales, incluido Telegram. QQ Bot es la excepción: no tiene claves `streaming.block` y transmite las respuestas por bloques, salvo que `channels.qqbot.streaming.mode` sea `"off"`.

Detalles: [Streaming + división en fragmentos](/es/concepts/streaming).

## Visibilidad del razonamiento y tokens

- `/reasoning on|off|stream` controla la visibilidad.
- El contenido del razonamiento sigue contabilizándose en el uso de tokens cuando el modelo lo produce.
- Telegram admite el streaming del razonamiento en una burbuja de borrador transitoria que se elimina después de la entrega final; utilice `/reasoning on` para obtener una salida de razonamiento persistente.

Detalles: [Directivas de pensamiento + razonamiento](/es/tools/thinking) y [Uso de tokens](/es/reference/token-use).

## Prefijos, hilos y respuestas

- Cascada de prefijos salientes: `messages.responsePrefix`, `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`. WhatsApp también dispone de `channels.whatsapp.messagePrefix` para un prefijo entrante.
- Respuestas en hilos mediante `replyToMode` y valores predeterminados por canal.

Detalles: [Configuración](/es/gateway/config-agents#messages) y documentación de los canales.

## Respuestas silenciosas

El token silencioso `NO_REPLY` (sin distinción entre mayúsculas y minúsculas, por lo que `no_reply` también coincide) significa «no entregar una respuesta visible para el usuario». Cuando un turno también tiene contenido multimedia pendiente de una herramienta, como audio TTS generado, OpenClaw elimina el texto silencioso, pero entrega el archivo multimedia adjunto.

La política de silencio se determina según el tipo de conversación:

- Las conversaciones directas nunca reciben instrucciones de solicitud `NO_REPLY`. Si una ejecución directa devuelve accidentalmente solo un token silencioso, OpenClaw lo suprime en lugar de reescribirlo o entregarlo.
- Los grupos/canales permiten el silencio de forma predeterminada. En el modo de respuesta visible `message_tool`, el silencio significa que el modelo no llama a `message(action=send)`.
- La orquestación interna permite el silencio de forma predeterminada.

Los valores predeterminados se encuentran en `agents.defaults.silentReply`; `surfaces.<id>.silentReply` puede sustituir la política grupal/interna en cada superficie.

OpenClaw también utiliza respuestas silenciosas para los fallos internos genéricos del ejecutor en chats no directos, de modo que los grupos/canales no vean el texto estándar de errores del Gateway. Los fallos clasificados que incluyen texto de recuperación dirigido al usuario, como avisos de autenticación ausente, límite de frecuencia o sobrecarga, aún pueden entregarse. Los chats directos muestran de forma predeterminada un texto de fallo compacto; los detalles sin procesar del ejecutor solo se muestran cuando `/verbose full` está habilitado.

Las respuestas que solo contienen el token silencioso se descartan en todas las superficies, por lo que las sesiones principales permanecen en silencio en lugar de reescribir el texto centinela como conversación alternativa.

## Contenido relacionado

- [Refactorización del ciclo de vida de los mensajes](/es/concepts/message-lifecycle-refactor) - diseño objetivo duradero para el envío y la recepción
- [Streaming](/es/concepts/streaming) - entrega de mensajes en tiempo real
- [Reintentos](/es/concepts/retry) - comportamiento de reintento de la entrega de mensajes
- [Cola](/es/concepts/queue) - cola de procesamiento de mensajes
- [Canales](/es/channels) - integraciones con plataformas de mensajería
