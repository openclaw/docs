---
read_when:
    - Explicación de cómo los mensajes entrantes se convierten en respuestas
    - Aclaración de las sesiones, los modos de puesta en cola o el comportamiento de transmisión
    - Documentación de la visibilidad del razonamiento y sus implicaciones de uso
summary: Flujo de mensajes, sesiones, puesta en cola y visibilidad del razonamiento
title: Mensajes
x-i18n:
    generated_at: "2026-07-12T14:28:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 16f0dc387a8825a91568dcd5a44f8bdc54b8d69d78f851760dfc2efa1eb151e7
    source_path: concepts/messages.md
    workflow: 16
---

Los mensajes entrantes pasan por el enrutamiento, la deduplicación/espera antirrebote, una ejecución del agente y la entrega saliente:

```text
Mensaje entrante
  -> enrutamiento/vinculaciones -> clave de sesión
  -> deduplicación + espera antirrebote
  -> cola (si ya hay una ejecución activa)
  -> ejecución del agente (transmisión + herramientas)
  -> respuestas salientes (límites del canal + fragmentación)
```

Principales superficies de configuración:

- `messages.*` para prefijos, gestión de colas, espera antirrebote de mensajes entrantes y comportamiento de grupos.
- `agents.defaults.*` para transmisión por bloques, fragmentación y valores predeterminados de respuestas silenciosas.
- Sustituciones específicas de canal (`channels.telegram.*`, `channels.whatsapp.*`, etc.) para límites por canal y opciones de transmisión.

Consulte [Configuración](/es/gateway/configuration) para ver el esquema completo.

## Deduplicación de mensajes entrantes

Los canales pueden volver a entregar el mismo mensaje después de una reconexión. OpenClaw mantiene una caché en memoria cuya clave se compone del ámbito del agente, la ruta del canal (canal + interlocutor + cuenta + hilo) y el identificador del mensaje, para que un mensaje entregado de nuevo no desencadene una segunda ejecución del agente. La entrada de la caché caduca tras 20 minutos o cuando se registran 5000 entradas, lo que ocurra primero.

## Espera antirrebote de mensajes entrantes

Los mensajes de texto consecutivos enviados rápidamente por el mismo remitente pueden agruparse en un solo turno del agente mediante `messages.inbound`. La espera antirrebote se aplica por canal + conversación y utiliza el mensaje más reciente para el hilo y los identificadores de la respuesta.

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

- La espera antirrebote se aplica únicamente a los mensajes de texto; los elementos multimedia y archivos adjuntos se procesan de inmediato.
- Los comandos de control (detener/abortar/estado, etc.) omiten la espera antirrebote para procesarse de inmediato.
- Está desactivada de forma predeterminada: `messages.inbound.debounceMs` no tiene un valor predeterminado integrado, por lo que la espera antirrebote solo se activa al establecerlo (globalmente o por canal).
- La opción habilitable `coalesceSameSenderDms` de iMessage es la única excepción: retiene el tiempo suficiente todo el texto de mensajes directos del mismo remitente (incluidos los comandos) para que el envío dividido de comando+URL de Apple llegue como un solo turno. Los chats de grupo siempre se procesan al instante, independientemente de esta configuración.

## Sesiones y dispositivos

Las sesiones pertenecen al Gateway, no a los clientes.

- Los chats directos se agrupan bajo la clave de sesión principal del agente.
- Los grupos/canales obtienen sus propias claves de sesión.
- El almacén de sesiones y las transcripciones residen en el host del Gateway.

Varios dispositivos/canales pueden asociarse a la misma sesión, pero el historial no se sincroniza por completo con cada cliente. Use un dispositivo principal para las conversaciones largas a fin de evitar contextos divergentes. La interfaz de control y la TUI siempre muestran la transcripción de la sesión respaldada por el Gateway, por lo que constituyen la fuente de verdad.

Detalles: [Gestión de sesiones](/es/concepts/session).

## Cuerpos de las solicitudes e historial del contexto

Los plugins de canal rellenan varios campos de texto en el contexto entrante, de mayor a menor preferencia:

| Campo             | Propósito                                                                                                                  |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `BodyForAgent`    | Texto dirigido al modelo para el turno actual. Si no se establece, recurre a `CommandBody` / `RawBody` / `Body`.           |
| `BodyForCommands` | Texto limpio utilizado para analizar directivas/comandos. Si no se establece, recurre a `CommandBody` / `RawBody` / `Body`. |
| `CommandBody`     | Cuerpo intermedio heredado; se prefiere `BodyForCommands`.                                                                 |
| `RawBody`         | Alias obsoleto de `CommandBody`.                                                                                            |
| `Body`            | Cuerpo de solicitud heredado; puede incluir envoltorios del canal y del historial.                                         |

Cuando un canal proporciona el historial, lo encapsula con:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Para los chats no directos (grupos/canales/salas), el cuerpo del mensaje actual lleva como prefijo la etiqueta del remitente, siguiendo el estilo utilizado para las entradas del historial. La eliminación de directivas solo se aplica a la sección del mensaje actual, por lo que el historial permanece intacto. Los canales que encapsulan el historial deben establecer `BodyForCommands` (o los campos heredados `CommandBody` / `RawBody`) en el texto original del mensaje y mantener `Body` como el prompt combinado.

Los búferes de historial contienen únicamente mensajes pendientes: incluyen los mensajes de grupo que no activaron una ejecución (por ejemplo, los mensajes sujetos a una mención) y excluyen los mensajes que ya están en la transcripción de la sesión. El historial estructurado y los metadatos de respuestas, reenvíos y canales se representan como bloques de contexto no confiables con rol de usuario durante la preparación del prompt.

Configure el tamaño del historial con `messages.groupChat.historyLimit` (valor predeterminado global) o mediante anulaciones por canal, como `channels.slack.historyLimit` y `channels.telegram.accounts.<id>.historyLimit` (establezca `0` para desactivarlo).

## Metadatos de resultados de herramientas

El `content` del resultado de la herramienta es el resultado visible para el modelo; `details` contiene metadatos de ejecución para la representación en la interfaz de usuario, el diagnóstico, la entrega de contenido multimedia y los plugins.

- `toolResult.details` se elimina antes de la reproducción del proveedor y antes de la entrada de Compaction.
- Las transcripciones de sesión persistentes conservan solo `details` con tamaño limitado; los metadatos sobredimensionados se sustituyen por un resumen compacto marcado con `persistedDetailsTruncated: true`.
- Los Plugins y las herramientas deben colocar el texto que el modelo debe leer en `content`, no solo en `details`.

## Puesta en cola y seguimientos

Cuando ya hay una ejecución activa, los mensajes entrantes se incorporan a ella de forma predeterminada. `messages.queue` controla el modo:

| Modo              | Comportamiento                                                      |
| ----------------- | ------------------------------------------------------------------- |
| `steer` (predeterminado) | Inyecta la nueva instrucción en la ejecución activa.          |
| `followup`        | Ejecuta el mensaje después de que finalice la ejecución activa.     |
| `collect`         | Agrupa los mensajes compatibles en un único turno posterior.        |
| `interrupt`       | Cancela la ejecución activa y, a continuación, inicia la instrucción más reciente. |

Valores predeterminados: `messages.queue.debounceMs` es 500ms (se aplica por igual a la agrupación de steer, followup y collect), `messages.queue.cap` es de 20 mensajes en cola y `messages.queue.drop` es `summarize` (`old` y `new` también están disponibles). Configure las anulaciones por canal mediante `messages.queue.byChannel` y `messages.queue.debounceMsByChannel`.

Detalles: [Cola de comandos](/es/concepts/queue) y [Cola de redirección](/es/concepts/queue-steering).

## Propiedad de las ejecuciones de canal

Los Plugins de canal pueden conservar el orden, aplicar antirrebote a la entrada y ejercer contrapresión de transporte antes de que un mensaje entre en la cola de la sesión. No deben imponer un tiempo de espera independiente en torno al propio turno del agente. Una vez que un mensaje se enruta a una sesión, los ciclos de vida de la sesión, las herramientas y el entorno de ejecución rigen el trabajo de larga duración, de modo que todos los canales informen de los turnos lentos y se recuperen de ellos de manera coherente.

## Transmisión, fragmentación y agrupación

La transmisión por bloques envía respuestas parciales a medida que el modelo produce bloques de texto; la fragmentación respeta los límites de texto del canal y evita dividir el código delimitado.

- `agents.defaults.blockStreamingDefault` (`on|off`, valor predeterminado `off`)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (agrupación basada en la inactividad)
- `agents.defaults.humanDelay` (pausa similar a la humana entre respuestas por bloques)
- Anulaciones por canal: `*.streaming.block.enabled` y `*.streaming.block.coalesce` en canales con transmisión anidada (Telegram, Discord, Slack, iMessage, Microsoft Teams); `*.blockStreaming` / `*.blockStreamingCoalesce` en el nivel superior en canales sin una configuración de transmisión anidada. La transmisión por bloques está desactivada a menos que se habilite explícitamente, en todos los canales, incluido Telegram.

Detalles: [Transmisión y fragmentación](/es/concepts/streaming).

## Visibilidad del razonamiento y tokens

- `/reasoning on|off|stream` controla la visibilidad.
- El contenido de razonamiento sigue contando para el uso de tokens cuando el modelo lo genera.
- Telegram permite transmitir el razonamiento en una burbuja de borrador temporal que se elimina tras la entrega final; use `/reasoning on` para obtener una salida de razonamiento persistente.

Detalles: [Directivas de pensamiento y razonamiento](/es/tools/thinking) y [Uso de tokens](/es/reference/token-use).

## Prefijos, hilos y respuestas

- Cascada de prefijos salientes: `messages.responsePrefix`, `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`. WhatsApp también tiene `channels.whatsapp.messagePrefix` para un prefijo entrante.
- Respuestas en hilos mediante `replyToMode` y valores predeterminados por canal.

Detalles: [Configuración](/es/gateway/config-agents#messages) y documentación de los canales.

## Respuestas silenciosas

El token silencioso `NO_REPLY` (sin distinción entre mayúsculas y minúsculas, por lo que `no_reply` también coincide) significa «no entregar una respuesta visible para el usuario». Cuando un turno también tiene contenido multimedia pendiente de una herramienta, como audio TTS generado, OpenClaw elimina el texto silencioso, pero sigue entregando el archivo multimedia adjunto.

La política de silencio se determina según el tipo de conversación:

- Las conversaciones directas nunca reciben instrucciones de `NO_REPLY` en el prompt. Si una ejecución directa devuelve accidentalmente solo un token silencioso, OpenClaw lo suprime en lugar de reescribirlo o entregarlo.
- Los grupos/canales permiten el silencio de forma predeterminada. En el modo de respuesta visible de `message_tool`, el silencio significa que el modelo no llama a `message(action=send)`.
- La orquestación interna permite el silencio de forma predeterminada.

Los valores predeterminados se encuentran en `agents.defaults.silentReply`; `surfaces.<id>.silentReply` puede reemplazar la política de grupos/interna para cada superficie.

OpenClaw también usa respuestas silenciosas para fallos genéricos del ejecutor interno en chats no directos, para que los grupos/canales no vean texto estándar de errores del Gateway. Los fallos clasificados con texto de recuperación dirigido al usuario, como avisos de autenticación ausente, límite de frecuencia o sobrecarga, aún pueden entregarse. Los chats directos muestran de forma predeterminada un texto de error conciso; los detalles sin procesar del ejecutor solo se muestran cuando `/verbose full` está habilitado.

Las respuestas que contienen únicamente el token silencioso se descartan en todas las superficies, por lo que las sesiones superiores permanecen en silencio en lugar de reescribir el texto centinela como mensajes de relleno.

## Contenido relacionado

- [Refactorización del ciclo de vida de los mensajes](/es/concepts/message-lifecycle-refactor) - diseño objetivo duradero de envío y recepción
- [Transmisión](/es/concepts/streaming) - entrega de mensajes en tiempo real
- [Reintentos](/es/concepts/retry) - comportamiento de reintento de entrega de mensajes
- [Cola](/es/concepts/queue) - cola de procesamiento de mensajes
- [Canales](/es/channels) - integraciones con plataformas de mensajería
