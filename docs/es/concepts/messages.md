---
read_when:
    - Explicación de cómo los mensajes entrantes se convierten en respuestas
    - Aclaración de las sesiones, los modos de puesta en cola o el comportamiento de transmisión
    - Documentación de la visibilidad del razonamiento y sus implicaciones de uso
summary: Flujo de mensajes, sesiones, colas y visibilidad del razonamiento
title: Mensajes
x-i18n:
    generated_at: "2026-07-16T11:31:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e2982ebb1b82b90368263826ef8f42babab9c8a559cc1409a381893a011a0ad7
    source_path: concepts/messages.md
    workflow: 16
---

Los mensajes entrantes pasan por el enrutamiento, la deduplicación/el rebote, una ejecución del agente y la entrega saliente:

```text
Mensaje entrante
  -> enrutamiento/vinculaciones -> clave de sesión
  -> deduplicación + rebote
  -> cola (si ya hay una ejecución activa)
  -> ejecución del agente (transmisión + herramientas)
  -> respuestas salientes (límites del canal + fragmentación)
```

Superficies de configuración principales:

- `messages.*` para prefijos, colas, rebote de entrada y comportamiento de grupos.
- `agents.defaults.*` para transmisión por bloques, fragmentación y valores predeterminados de respuestas silenciosas.
- Anulaciones de canal (`channels.telegram.*`, `channels.whatsapp.*`, etc.) para límites y opciones de transmisión por canal.

Consulte [Configuración](/es/gateway/configuration) para ver el esquema completo.

## Deduplicación de entrada

Los canales pueden volver a entregar el mismo mensaje después de una reconexión. OpenClaw mantiene una caché en memoria cuya clave se compone del ámbito del agente, la ruta del canal (canal + interlocutor + cuenta + hilo) y el id. del mensaje, de modo que un mensaje vuelto a entregar no activa una segunda ejecución del agente. La entrada de caché caduca después de 20 minutos o cuando se alcanzan 5000 entradas registradas, lo que ocurra primero.

## Rebote de entrada

Los mensajes de texto consecutivos y rápidos del mismo remitente pueden agruparse en un único turno del agente mediante `messages.inbound`. El rebote se aplica por canal + conversación y utiliza el mensaje más reciente para los hilos/ID de respuesta.

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

- El rebote se aplica únicamente a mensajes de texto; los archivos multimedia/adjuntos se procesan de inmediato.
- Los comandos de control (detener/abortar/estado, etc.) omiten el rebote para enviarse de inmediato.
- Desactivado de forma predeterminada: `messages.inbound.debounceMs` no tiene un valor predeterminado integrado, por lo que el rebote solo se activa después de configurarlo (globalmente o por canal).
- La activación opcional de `coalesceSameSenderDms` de iMessage es la única excepción: retiene todos los mensajes de texto de MD del mismo remitente (incluidos los comandos) el tiempo suficiente para que el envío separado de comando+URL de Apple llegue como un solo turno. Los chats grupales siempre se envían de inmediato, independientemente de esta configuración.

## Sesiones y dispositivos

Las sesiones pertenecen al Gateway, no a los clientes.

- Los chats directos se agrupan en la clave de sesión principal del agente.
- Los grupos/canales obtienen sus propias claves de sesión.
- El almacén de sesiones y las transcripciones residen en el host del Gateway.

Varios dispositivos/canales pueden corresponder a la misma sesión, pero el historial no se vuelve a sincronizar por completo con cada cliente. Utilice un dispositivo principal para las conversaciones largas a fin de evitar contextos divergentes. La interfaz de control y la TUI siempre muestran la transcripción de sesión respaldada por el Gateway, por lo que constituyen la fuente de verdad.

Detalles: [Administración de sesiones](/es/concepts/session).

## Cuerpos de instrucciones y contexto del historial

Los plugins de canal rellenan varios campos de texto en el contexto de entrada, del más al menos preferido:

| Campo             | Finalidad                                                                                                     |
| ----------------- | ----------------------------------------------------------------------------------------------------------- |
| `BodyForAgent`    | Texto visible para el modelo en el turno actual. Si no está definido, recurre a `CommandBody` / `RawBody` / `Body`.        |
| `BodyForCommands` | Texto limpio utilizado para analizar directivas/comandos. Si no está definido, recurre a `CommandBody` / `RawBody` / `Body`. |
| `CommandBody`     | Cuerpo intermedio heredado; se prefiere `BodyForCommands`.                                                         |
| `RawBody`         | Alias obsoleto de `CommandBody`.                                                                         |
| `Body`            | Cuerpo de instrucciones heredado; puede incluir envoltorios del canal y del historial.                                     |

Cuando un canal proporciona historial, lo envuelve con:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

En los chats no directos (grupos/canales/salas), el cuerpo del mensaje actual lleva como prefijo la etiqueta del remitente, siguiendo el estilo utilizado para las entradas del historial. La eliminación de directivas solo se aplica a la sección del mensaje actual, por lo que el historial permanece intacto. Los canales que envuelvan el historial deben establecer `BodyForCommands` (o los campos heredados `CommandBody` / `RawBody`) en el texto original del mensaje y mantener `Body` como las instrucciones combinadas.

Los búferes de historial solo contienen elementos pendientes: incluyen mensajes grupales que no activaron una ejecución (por ejemplo, mensajes sujetos a una mención) y excluyen los mensajes que ya están en la transcripción de la sesión. El historial estructurado, las respuestas, los mensajes reenviados y los metadatos del canal se representan como bloques de contexto no confiables con el rol de usuario durante el ensamblaje de las instrucciones.

Configure el tamaño del historial mediante `messages.groupChat.historyLimit` (valor predeterminado global) o anulaciones por canal como `channels.slack.historyLimit` y `channels.telegram.accounts.<id>.historyLimit` (establezca `0` para desactivarlo).

## Metadatos de resultados de herramientas

El `content` del resultado de una herramienta es el resultado visible para el modelo; `details` son metadatos de ejecución para la representación en la interfaz, el diagnóstico, la entrega de archivos multimedia y los plugins.

- `toolResult.details` se elimina antes de volver a reproducir el contenido para el proveedor y antes de la entrada de Compaction.
- Las transcripciones de sesión persistentes solo conservan un `details` limitado; los metadatos demasiado grandes se sustituyen por un resumen compacto marcado como `persistedDetailsTruncated: true`.
- Los plugins y las herramientas deben colocar el texto que el modelo deba leer en `content`, no únicamente en `details`.

## Colas y seguimientos

Cuando ya hay una ejecución activa, los mensajes entrantes se incorporan a ella de forma predeterminada. `messages.queue` controla el modo:

| Modo              | Comportamiento                                            |
| ----------------- | --------------------------------------------------- |
| `steer` (predeterminado) | Inyecta las nuevas instrucciones en la ejecución activa.          |
| `followup`        | Ejecuta el mensaje después de que finalice la ejecución activa.      |
| `collect`         | Agrupa los mensajes compatibles en un único turno posterior.      |
| `interrupt`       | Aborta la ejecución activa y, a continuación, inicia las instrucciones más recientes. |

Valores predeterminados: `messages.queue.debounceMs` es 500ms (se aplica por igual al direccionamiento, seguimiento y agrupamiento), `messages.queue.cap` es 20 mensajes en cola y `messages.queue.drop` es `summarize` (`old` y `new` también están disponibles). Configure anulaciones por canal mediante `messages.queue.byChannel` y `messages.queue.debounceMsByChannel`.

Detalles: [Cola de comandos](/es/concepts/queue) y [Cola de direccionamiento](/es/concepts/queue-steering).

## Propiedad de la ejecución del canal

Los plugins de canal pueden conservar el orden, aplicar rebote a la entrada y aplicar contrapresión del transporte antes de que un mensaje entre en la cola de la sesión. No deben imponer un tiempo de espera independiente en torno al propio turno del agente. Una vez que un mensaje se enruta a una sesión, los ciclos de vida de la sesión, las herramientas y el entorno de ejecución rigen el trabajo prolongado para que todos los canales informen sobre los turnos lentos y se recuperen de ellos de forma coherente.

## Transmisión, fragmentación y agrupamiento

La transmisión por bloques envía respuestas parciales a medida que el modelo produce bloques de texto; la fragmentación respeta los límites de texto del canal y evita dividir bloques de código cercados.

- `agents.defaults.blockStreamingDefault` (`on|off`, valor predeterminado `off`)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (agrupamiento basado en inactividad)
- `agents.defaults.humanDelay` (pausa similar a la humana entre respuestas por bloques)
- Anulaciones de canal: `*.streaming.block.enabled` y `*.streaming.block.coalesce` en los canales incluidos; `openclaw doctor --fix` migra las claves planas obsoletas. La transmisión por bloques está desactivada salvo que se habilite explícitamente, en todos los canales, incluido Telegram. QQ Bot es la excepción: no tiene claves `streaming.block` y transmite respuestas por bloques salvo que `channels.qqbot.streaming.mode` sea `"off"`.

Detalles: [Transmisión + fragmentación](/es/concepts/streaming).

## Visibilidad del razonamiento y tokens

- `/reasoning on|off|stream` controla la visibilidad.
- El contenido del razonamiento sigue contando para el uso de tokens cuando el modelo lo produce.
- Telegram admite la transmisión del razonamiento en una burbuja de borrador transitoria que se elimina después de la entrega final; utilice `/reasoning on` para obtener una salida de razonamiento persistente.

Detalles: [Directivas de pensamiento + razonamiento](/es/tools/thinking) y [Uso de tokens](/es/reference/token-use).

## Prefijos, hilos y respuestas

- Cascada de prefijos salientes: `messages.responsePrefix`, `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`. WhatsApp también dispone de `channels.whatsapp.messagePrefix` para un prefijo de entrada.
- Hilos de respuesta mediante `replyToMode` y valores predeterminados por canal.

Detalles: [Configuración](/es/gateway/config-agents#messages) y documentación de los canales.

## Respuestas silenciosas

El token silencioso `NO_REPLY` (no distingue entre mayúsculas y minúsculas, por lo que `no_reply` también coincide) significa «no entregar una respuesta visible para el usuario». Cuando un turno también tiene archivos multimedia pendientes de herramientas, como audio TTS generado, OpenClaw elimina el texto silencioso, pero entrega el archivo multimedia adjunto.

La política de silencio se resuelve según el tipo de conversación:

- Las conversaciones directas nunca reciben indicaciones de `NO_REPLY` en las instrucciones. Si una ejecución directa devuelve accidentalmente un token silencioso aislado, OpenClaw lo suprime en lugar de reescribirlo o entregarlo.
- Los grupos/canales permiten el silencio de forma predeterminada. En el modo de respuesta visible `message_tool`, el silencio significa que el modelo no llama a `message(action=send)`.
- La orquestación interna permite el silencio de forma predeterminada.

Los valores predeterminados se encuentran en `agents.defaults.silentReply`; `surfaces.<id>.silentReply` puede anular la política de grupos/interna por superficie.

OpenClaw también utiliza respuestas silenciosas para errores genéricos del ejecutor interno en chats no directos, de modo que los grupos/canales no vean texto estándar de errores del Gateway. Los errores clasificados que incluyen texto de recuperación para el usuario, como avisos de autenticación ausente, límites de frecuencia o sobrecarga, aún pueden entregarse. Los chats directos muestran de forma predeterminada un texto de error compacto; los detalles sin procesar del ejecutor solo se muestran cuando `/verbose full` está habilitado.

Las respuestas que solo contienen el token silencioso se descartan en todas las superficies, de modo que las sesiones principales permanezcan silenciosas en lugar de convertir el texto centinela en mensajes de relleno.

## Temas relacionados

- [Refactorización del ciclo de vida de los mensajes](/es/concepts/message-lifecycle-refactor) - diseño duradero previsto para el envío y la recepción
- [Transmisión](/es/concepts/streaming) - entrega de mensajes en tiempo real
- [Reintentos](/es/concepts/retry) - comportamiento de reintento de la entrega de mensajes
- [Cola](/es/concepts/queue) - cola de procesamiento de mensajes
- [Canales](/es/channels) - integraciones con plataformas de mensajería
