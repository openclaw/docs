---
read_when:
    - Explicación de cómo los mensajes entrantes se convierten en respuestas
    - Aclaración de las sesiones, los modos de puesta en cola o el comportamiento de streaming
    - Documentación de la visibilidad del razonamiento y sus implicaciones de uso
summary: Flujo de mensajes, sesiones, colas y visibilidad del razonamiento
title: Mensajes
x-i18n:
    generated_at: "2026-07-22T10:31:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 21911abcd96a778a491aafb35cee6875b75d0d57d2eb45e122fe8b1552fd75ae
    source_path: concepts/messages.md
    workflow: 16
---

Los mensajes entrantes pasan por el enrutamiento, la deduplicación/agrupación temporal, una ejecución del agente y la entrega saliente:

```text
Mensaje entrante
  -> enrutamiento/vinculaciones -> clave de sesión
  -> deduplicación + agrupación temporal
  -> cola (si ya hay una ejecución activa)
  -> ejecución del agente (streaming + herramientas)
  -> respuestas salientes (límites del canal + fragmentación)
```

Superficies de configuración principales:

- `messages.*` para prefijos, colas, agrupación temporal de mensajes entrantes y comportamiento de grupos.
- `agents.defaults.*` para streaming por bloques, fragmentación y valores predeterminados de respuestas silenciosas.
- Configuraciones específicas de canal (`channels.telegram.*`, `channels.whatsapp.*`, etc.) para límites y controles de streaming por canal.

Consulte [Configuración](/es/gateway/configuration) para ver el esquema completo.

## Deduplicación de mensajes entrantes

Los canales pueden volver a entregar el mismo mensaje después de una reconexión. OpenClaw mantiene una caché en memoria cuya clave se compone del ámbito del agente, la ruta del canal (canal + interlocutor + cuenta + hilo) y el id. del mensaje, por lo que un mensaje entregado de nuevo no activa una segunda ejecución del agente. La entrada de la caché caduca después de 20 minutos o cuando se registran 5000 entradas, lo que ocurra primero.

## Agrupación temporal de mensajes entrantes

Los mensajes de texto consecutivos enviados rápidamente por el mismo remitente pueden agruparse en un único turno del agente mediante `messages.inbound`. La agrupación temporal se limita por canal + conversación y utiliza el mensaje más reciente para los hilos/identificadores de respuesta.

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

- La agrupación temporal se aplica únicamente a los mensajes de texto; los archivos multimedia/adjuntos se procesan de inmediato.
- Los comandos de control (detener/abortar/estado, etc.) omiten la agrupación temporal para procesarse inmediatamente.
- Desactivada de forma predeterminada: `messages.inbound.debounceMs` no tiene un valor predeterminado integrado, por lo que la agrupación temporal solo se activa después de configurarla (globalmente o por canal).
- La opción `coalesceSameSenderDms` de iMessage es la única excepción: retiene todo el texto de mensajes directos del mismo remitente (incluidos los comandos) el tiempo suficiente para que el envío dividido de comando+URL de Apple llegue como un solo turno. Los chats grupales siempre se procesan de inmediato, independientemente de esta configuración.

## Sesiones y dispositivos

Las sesiones pertenecen al Gateway, no a los clientes.

- Los chats directos se consolidan en la clave de sesión principal del agente.
- Los grupos/canales obtienen sus propias claves de sesión.
- El almacén de sesiones y las transcripciones residen en el host del Gateway.

Varios dispositivos/canales pueden asociarse con la misma sesión, pero el historial no se sincroniza por completo con todos los clientes. Utilice un dispositivo principal para las conversaciones largas a fin de evitar contextos divergentes. La interfaz de control y la TUI siempre muestran la transcripción de sesión respaldada por el Gateway, por lo que constituyen la fuente de verdad.

Detalles: [Gestión de sesiones](/es/concepts/session).

## Cuerpos de prompts y contexto del historial

Los plugins de canal rellenan varios campos de texto en el contexto entrante, del más al menos preferido:

| Campo             | Finalidad                                                                                                     |
| ----------------- | ----------------------------------------------------------------------------------------------------------- |
| `BodyForAgent`    | Texto presentado al modelo para el turno actual. Si no está definido, recurre a `CommandBody` / `RawBody` / `Body`.        |
| `BodyForCommands` | Texto limpio utilizado para analizar directivas/comandos. Si no está definido, recurre a `CommandBody` / `RawBody` / `Body`. |
| `CommandBody`     | Cuerpo intermedio heredado; se prefiere `BodyForCommands`.                                                         |
| `RawBody`         | Alias obsoleto de `CommandBody`.                                                                         |
| `Body`            | Cuerpo del prompt heredado; puede incluir envoltorios del canal y del historial.                                     |

Cuando un canal proporciona historial, lo envuelve con:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

En los chats no directos (grupos/canales/salas), el cuerpo del mensaje actual lleva como prefijo la etiqueta del remitente, siguiendo el estilo utilizado para las entradas del historial. La eliminación de directivas solo se aplica a la sección del mensaje actual, por lo que el historial permanece intacto. Los canales que envuelven el historial deben establecer `BodyForCommands` (o los campos heredados `CommandBody` / `RawBody`) con el texto original del mensaje y conservar `Body` como prompt combinado.

Los búferes del historial solo contienen elementos pendientes: incluyen los mensajes grupales que no activaron una ejecución (por ejemplo, mensajes sujetos a una mención) y excluyen los mensajes que ya están en la transcripción de la sesión. Durante el ensamblaje del prompt, el historial estructurado y los metadatos de respuestas, reenvíos y canales se representan como bloques de contexto no fiables con rol de usuario.

Configure el tamaño del historial con `messages.groupChat.historyLimit` (valor global predeterminado) o mediante configuraciones específicas de canal como `channels.slack.historyLimit` y `channels.telegram.accounts.<id>.historyLimit` (establezca `0` para desactivarlo).

## Metadatos de resultados de herramientas

El `content` del resultado de una herramienta es el resultado visible para el modelo; `details` contiene metadatos de ejecución para la representación en la interfaz, el diagnóstico, la entrega de contenido multimedia y los plugins.

- `toolResult.details` se elimina antes de la repetición del proveedor y antes de la entrada de Compaction.
- Las transcripciones de sesión persistentes solo conservan un `details` limitado; los metadatos demasiado grandes se sustituyen por un resumen compacto marcado como `persistedDetailsTruncated: true`.
- Los plugins y las herramientas deben colocar en `content` el texto que el modelo deba leer, no únicamente en `details`.

## Colas y seguimientos

Cuando ya hay una ejecución activa, los mensajes entrantes se dirigen a ella de forma predeterminada. `messages.queue` controla el modo:

| Modo              | Comportamiento                                            |
| ----------------- | --------------------------------------------------- |
| `steer` (predeterminado) | Inyecta el nuevo prompt en la ejecución activa.          |
| `followup`        | Ejecuta el mensaje después de que finalice la ejecución activa.      |
| `collect`         | Agrupa los mensajes compatibles en un turno posterior.      |
| `interrupt`       | Aborta la ejecución activa y, a continuación, inicia el prompt más reciente. |

La cola utiliza una agrupación temporal integrada de 500ms para el direccionamiento, los seguimientos y la agrupación de recopilación. El valor predeterminado de `messages.queue.cap` es 20 mensajes en cola y el de `messages.queue.drop` es `summarize` (`old` y `new` también están disponibles). Configure opciones específicas por canal mediante `messages.queue.byChannel` y `messages.queue.debounceMsByChannel`.

Detalles: [Cola de comandos](/es/concepts/queue) y [Cola de direccionamiento](/es/concepts/queue-steering).

## Propiedad de la ejecución del canal

Los plugins de canal pueden preservar el orden, agrupar temporalmente la entrada y aplicar contrapresión de transporte antes de que un mensaje entre en la cola de la sesión. No deben imponer un tiempo de espera independiente al propio turno del agente. Una vez que un mensaje se enruta a una sesión, los ciclos de vida de la sesión, las herramientas y la ejecución administran el trabajo de larga duración para que todos los canales informen de los turnos lentos y se recuperen de ellos de forma coherente.

## Streaming, fragmentación y agrupación

El streaming por bloques envía respuestas parciales a medida que el modelo produce bloques de texto; la fragmentación respeta los límites de texto del canal y evita dividir bloques de código delimitados.

- `agents.defaults.blockStreamingDefault` (`on|off`, valor predeterminado `off`)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (agrupación basada en inactividad)
- `agents.defaults.humanDelay` (pausa similar a la humana entre respuestas por bloques)
- Configuraciones específicas de canal: `*.streaming.block.enabled` y `*.streaming.block.coalesce` en los canales incluidos; `openclaw doctor --fix` migra las claves planas obsoletas. El streaming por bloques está desactivado a menos que se habilite explícitamente en todos los canales, incluido Telegram. QQ Bot es la excepción: no tiene claves `streaming.block` y transmite respuestas por bloques, salvo que `channels.qqbot.streaming.mode` sea `"off"`.

Detalles: [Streaming + fragmentación](/es/concepts/streaming).

## Visibilidad del razonamiento y tokens

- `/reasoning on|off|stream` controla la visibilidad.
- El contenido del razonamiento sigue contando para el uso de tokens cuando el modelo lo produce.
- Telegram permite transmitir el razonamiento a una burbuja de borrador temporal que se elimina después de la entrega final; utilice `/reasoning on` para obtener una salida de razonamiento persistente.

Detalles: [Directivas de pensamiento + razonamiento](/es/tools/thinking) y [Uso de tokens](/es/reference/token-use).

## Prefijos, hilos y respuestas

- Los prefijos salientes se encuentran en `channels.<channel>.responsePrefix` y `channels.<channel>.accounts.<id>.responsePrefix`. Los valores de la cuenta tienen prioridad. Doctor copia el valor global de reserva en los bloques de canal configurados cuando esos campos canónicos no están definidos; `messages.responsePrefix` permanece como alternativa para canales implícitos y personalizados.
- Hilos de respuestas mediante `replyToMode` y valores predeterminados por canal.

Detalles: [Configuración](/es/gateway/config-agents#messages) y documentación de los canales.

## Respuestas silenciosas

El token silencioso `NO_REPLY` (no distingue entre mayúsculas y minúsculas, por lo que `no_reply` también coincide) significa «no entregar una respuesta visible para el usuario». Cuando un turno también tiene contenido multimedia pendiente de una herramienta, como audio TTS generado, OpenClaw elimina el texto silencioso, pero sigue entregando el archivo multimedia adjunto.

La política de silencio se determina según el tipo de conversación:

- Las conversaciones directas nunca reciben instrucciones de prompt de `NO_REPLY`. Si una ejecución directa devuelve por accidente únicamente un token silencioso, OpenClaw lo suprime en lugar de reescribirlo o entregarlo.
- Los grupos/canales permiten el silencio de forma predeterminada. En el modo de respuesta visible `message_tool`, el silencio significa que el modelo no llama a `message(action=send)`.
- La orquestación interna permite el silencio de forma predeterminada.

Los valores predeterminados se encuentran en `agents.defaults.silentReply`; `surfaces.<id>.silentReply` puede sustituir la política de grupos/interna para cada superficie.

OpenClaw también utiliza respuestas silenciosas para los fallos genéricos del ejecutor interno en chats no directos, de modo que los grupos/canales no vean texto estándar de errores del Gateway. Los fallos clasificados con texto de recuperación orientado al usuario, como los avisos de falta de autenticación, límite de frecuencia o sobrecarga, aún pueden entregarse. Los chats directos muestran de forma predeterminada un texto de error compacto; los detalles sin procesar del ejecutor solo se muestran cuando `/verbose full` está habilitado.

Las respuestas que contienen únicamente el token silencioso se descartan en todas las superficies, por lo que las sesiones principales permanecen en silencio en lugar de reescribir el texto centinela como conversación de reserva.

## Contenido relacionado

- [Refactorización del ciclo de vida de los mensajes](/es/concepts/message-lifecycle-refactor) - diseño objetivo duradero de envío y recepción
- [Streaming](/es/concepts/streaming) - entrega de mensajes en tiempo real
- [Reintentos](/es/concepts/retry) - comportamiento de los reintentos de entrega de mensajes
- [Cola](/es/concepts/queue) - cola de procesamiento de mensajes
- [Canales](/es/channels) - integraciones con plataformas de mensajería
