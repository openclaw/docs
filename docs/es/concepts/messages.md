---
read_when:
    - Explicar cómo los mensajes entrantes se convierten en respuestas
    - Aclarar las sesiones, los modos de cola o el comportamiento de la transmisión
    - Documentar la visibilidad del razonamiento y las implicaciones de uso
summary: Flujo de mensajes, sesiones, cola y visibilidad del razonamiento
title: Mensajes
x-i18n:
    generated_at: "2026-04-26T11:27:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7b77d344ed0cab80566582f43127c91ec987e892eeed788aeb9988b377a96e06
    source_path: concepts/messages.md
    workflow: 15
---

Esta página reúne cómo OpenClaw maneja mensajes entrantes, sesiones, cola,
transmisión y visibilidad del razonamiento.

## Flujo de mensajes (alto nivel)

```
Mensaje entrante
  -> enrutamiento/vinculaciones -> clave de sesión
  -> cola (si hay una ejecución activa)
  -> ejecución del agente (transmisión + herramientas)
  -> respuestas salientes (límites del canal + fragmentación)
```

Las opciones clave viven en la configuración:

- `messages.*` para prefijos, cola y comportamiento de grupos.
- `agents.defaults.*` para valores predeterminados de transmisión por bloques y fragmentación.
- Sobrescrituras por canal (`channels.whatsapp.*`, `channels.telegram.*`, etc.) para límites y activación/desactivación de transmisión.

Consulta [Configuración](/es/gateway/configuration) para ver el esquema completo.

## Dedupe entrante

Los canales pueden volver a entregar el mismo mensaje después de reconexiones. OpenClaw mantiene una
caché de corta duración indexada por canal/cuenta/par/sesión/id de mensaje para que las entregas duplicadas
no activen otra ejecución del agente.

## Debounce entrante

Los mensajes rápidos consecutivos del **mismo remitente** pueden agruparse en un único
turno del agente mediante `messages.inbound`. El debounce tiene alcance por canal + conversación
y usa el mensaje más reciente para el encadenamiento de respuestas/ID.

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
- Los comandos de control omiten el debounce para seguir siendo independientes, **excepto** cuando un canal activa explícitamente la coalescencia de DM del mismo remitente (por ejemplo [BlueBubbles `coalesceSameSenderDms`](/es/channels/bluebubbles#coalescing-split-send-dms-command--url-in-one-composition)), donde los comandos de DM esperan dentro de la ventana de debounce para que una carga útil enviada en partes pueda unirse al mismo turno del agente.

## Sesiones y dispositivos

Las sesiones son propiedad del gateway, no de los clientes.

- Los chats directos colapsan en la clave de sesión principal del agente.
- Los grupos/canales obtienen sus propias claves de sesión.
- El almacén de sesiones y las transcripciones viven en el host del gateway.

Varios dispositivos/canales pueden mapearse a la misma sesión, pero el historial no se
sincroniza completamente de vuelta a todos los clientes. Recomendación: usa un dispositivo principal para
conversaciones largas para evitar contexto divergente. La UI de control y la TUI siempre muestran la
transcripción de sesión respaldada por el gateway, por lo que son la fuente de verdad.

Detalles: [Gestión de sesiones](/es/concepts/session).

## Metadatos del resultado de herramientas

El `content` del resultado de herramientas es el resultado visible para el modelo. `details` del resultado de herramientas es
metadatos de entorno de ejecución para renderizado de UI, diagnósticos, entrega de medios y plugins.

OpenClaw mantiene ese límite explícito:

- `toolResult.details` se elimina antes de la repetición al proveedor y de la entrada de Compaction.
- Las transcripciones de sesión persistidas conservan solo `details` acotados; los metadatos sobredimensionados
  se reemplazan por un resumen compacto marcado con `persistedDetailsTruncated: true`.
- Los plugins y herramientas deben poner en `content` el texto que el modelo debe leer, no solo
  en `details`.

## Cuerpos entrantes y contexto de historial

OpenClaw separa el **cuerpo del prompt** del **cuerpo del comando**:

- `Body`: texto del prompt enviado al agente. Puede incluir sobres de canal y
  envoltorios opcionales de historial.
- `CommandBody`: texto sin procesar del usuario para el análisis de directivas/comandos.
- `RawBody`: alias heredado de `CommandBody` (se mantiene por compatibilidad).

Cuando un canal proporciona historial, usa un envoltorio compartido:

- `[Chat messages since your last reply - for context]`
- `[Current message - respond to this]`

Para **chats no directos** (grupos/canales/salas), el **cuerpo del mensaje actual** lleva como prefijo la
etiqueta del remitente (el mismo estilo usado para entradas del historial). Esto mantiene consistentes
los mensajes en tiempo real y los mensajes en cola/historial en el prompt del agente.

Los búferes de historial son **solo pendientes**: incluyen mensajes de grupo que _no_
activaron una ejecución (por ejemplo, mensajes protegidos por mención) y **excluyen** mensajes
ya presentes en la transcripción de la sesión.

La eliminación de directivas solo se aplica a la sección del **mensaje actual** para que el historial
permanezca intacto. Los canales que envuelven historial deben establecer `CommandBody` (o
`RawBody`) con el texto original del mensaje y mantener `Body` como prompt combinado.
Los búferes de historial se configuran mediante `messages.groupChat.historyLimit` (valor
predeterminado global) y sobrescrituras por canal como `channels.slack.historyLimit` o
`channels.telegram.accounts.<id>.historyLimit` (establece `0` para deshabilitar).

## Cola y seguimientos

Si ya hay una ejecución activa, los mensajes entrantes pueden ponerse en cola, dirigirse a la
ejecución actual o recopilarse para un turno de seguimiento.

- Configura mediante `messages.queue` (y `messages.queue.byChannel`).
- Modos: `interrupt`, `steer`, `followup`, `collect`, más variantes de acumulación.

Detalles: [Cola](/es/concepts/queue).

## Transmisión, fragmentación y agrupación

La transmisión por bloques envía respuestas parciales a medida que el modelo produce bloques de texto.
La fragmentación respeta los límites de texto del canal y evita partir código delimitado.

Configuraciones clave:

- `agents.defaults.blockStreamingDefault` (`on|off`, predeterminado off)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (agrupación basada en inactividad)
- `agents.defaults.humanDelay` (pausa similar a la humana entre respuestas por bloques)
- Sobrescrituras por canal: `*.blockStreaming` y `*.blockStreamingCoalesce` (los canales que no son Telegram requieren `*.blockStreaming: true` explícito)

Detalles: [Transmisión + fragmentación](/es/concepts/streaming).

## Visibilidad del razonamiento y tokens

OpenClaw puede exponer u ocultar el razonamiento del modelo:

- `/reasoning on|off|stream` controla la visibilidad.
- El contenido de razonamiento sigue contando para el uso de tokens cuando lo produce el modelo.
- Telegram admite transmisión del razonamiento en la burbuja de borrador.

Detalles: [Thinking + directivas de razonamiento](/es/tools/thinking) y [Uso de tokens](/es/reference/token-use).

## Prefijos, encadenamiento y respuestas

El formato de mensajes salientes está centralizado en `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` y `channels.<channel>.accounts.<id>.responsePrefix` (cascada de prefijo saliente), además de `channels.whatsapp.messagePrefix` (prefijo entrante de WhatsApp)
- Encadenamiento de respuestas mediante `replyToMode` y valores predeterminados por canal

Detalles: [Configuración](/es/gateway/config-agents#messages) y documentación de canales.

## Respuestas silenciosas

El token silencioso exacto `NO_REPLY` / `no_reply` significa “no entregar una respuesta visible para el usuario”.
Cuando un turno también tiene medios de herramienta pendientes, como audio TTS generado, OpenClaw
elimina el texto silencioso pero sigue entregando el archivo adjunto de medios.
OpenClaw resuelve ese comportamiento por tipo de conversación:

- Las conversaciones directas no permiten silencio de forma predeterminada y reescriben una
  respuesta silenciosa desnuda a una alternativa visible breve.
- Los grupos/canales permiten silencio de forma predeterminada.
- La orquestación interna permite silencio de forma predeterminada.

OpenClaw también usa respuestas silenciosas para fallos internos del ejecutor que ocurren
antes de cualquier respuesta del asistente en chats no directos, para que los grupos/canales no vean
texto estándar de error del gateway. Los chats directos muestran una copia compacta del fallo de forma predeterminada;
los detalles sin procesar del ejecutor solo se muestran cuando `/verbose` está `on` o `full`.

Los valores predeterminados viven en `agents.defaults.silentReply` y
`agents.defaults.silentReplyRewrite`; `surfaces.<id>.silentReply` y
`surfaces.<id>.silentReplyRewrite` pueden sobrescribirlos por superficie.

Cuando la sesión padre tiene una o más ejecuciones pendientes de subagentes generados, las
respuestas silenciosas desnudas se descartan en todas las superficies en lugar de reescribirse, para que la
sesión padre permanezca en silencio hasta que el evento de finalización del hijo entregue la respuesta real.

## Relacionado

- [Transmisión](/es/concepts/streaming) — entrega de mensajes en tiempo real
- [Reintento](/es/concepts/retry) — comportamiento de reintento de entrega de mensajes
- [Cola](/es/concepts/queue) — cola de procesamiento de mensajes
- [Canales](/es/channels) — integraciones de plataformas de mensajería
