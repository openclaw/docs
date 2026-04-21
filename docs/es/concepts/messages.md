---
read_when:
    - Explicar cómo los mensajes entrantes se convierten en respuestas
    - Aclarar sesiones, modos de cola o comportamiento de streaming
    - Documentar la visibilidad del razonamiento y sus implicaciones de uso
summary: Flujo de mensajes, sesiones, cola y visibilidad del razonamiento
title: Mensajes
x-i18n:
    generated_at: "2026-04-21T05:13:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: ddf88b91f3489bfdfb4a84f8a287a1ec0b0d71a765dfe27c666c6f43d0145022
    source_path: concepts/messages.md
    workflow: 15
---

# Mensajes

Esta página reúne cómo OpenClaw maneja los mensajes entrantes, las sesiones, la cola,
el streaming y la visibilidad del razonamiento.

## Flujo de mensajes (visión general)

```
Mensaje entrante
  -> enrutamiento/bindings -> clave de sesión
  -> cola (si hay una ejecución activa)
  -> ejecución del agente (streaming + herramientas)
  -> respuestas salientes (límites del canal + fragmentación)
```

Los controles principales viven en la configuración:

- `messages.*` para prefijos, cola y comportamiento de grupos.
- `agents.defaults.*` para valores predeterminados de block streaming y fragmentación.
- Reemplazos por canal (`channels.whatsapp.*`, `channels.telegram.*`, etc.) para límites y activadores de streaming.

Consulta [Configuración](/es/gateway/configuration) para el esquema completo.

## Dedupe de entrada

Los canales pueden reenviar el mismo mensaje después de reconexiones. OpenClaw mantiene una
caché de corta duración indexada por canal/cuenta/par/sesión/id de mensaje para que las entregas
duplicadas no activen otra ejecución del agente.

## Debouncing de entrada

Los mensajes rápidos y consecutivos del **mismo remitente** pueden agruparse en un solo
turno del agente mediante `messages.inbound`. El debouncing se delimita por canal + conversación
y usa el mensaje más reciente para los IDs/hilos de respuesta.

Configuración (valor predeterminado global + reemplazos por canal):

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
- Los comandos de control omiten el debounce para que sigan siendo independientes.

## Sesiones y dispositivos

Las sesiones pertenecen al Gateway, no a los clientes.

- Los chats directos se consolidan en la clave de sesión principal del agente.
- Los grupos/canales obtienen sus propias claves de sesión.
- El almacén de sesiones y las transcripciones viven en el host del Gateway.

Varios dispositivos/canales pueden mapearse a la misma sesión, pero el historial no se
sincroniza completamente de vuelta a todos los clientes. Recomendación: usa un dispositivo principal para las
conversaciones largas para evitar contexto divergente. La UI de control y la TUI siempre muestran la
transcripción de sesión respaldada por el Gateway, por lo que son la fuente de verdad.

Detalles: [Gestión de sesiones](/es/concepts/session).

## Cuerpos entrantes y contexto del historial

OpenClaw separa el **cuerpo del prompt** del **cuerpo del comando**:

- `Body`: texto del prompt enviado al agente. Puede incluir sobres del canal y
  contenedores opcionales de historial.
- `CommandBody`: texto bruto del usuario para el análisis de directivas/comandos.
- `RawBody`: alias heredado de `CommandBody` (se mantiene por compatibilidad).

Cuando un canal proporciona historial, usa un contenedor compartido:

- `[Mensajes del chat desde tu última respuesta - para contexto]`
- `[Mensaje actual - responde a este]`

Para los **chats no directos** (grupos/canales/salas), el **cuerpo del mensaje actual** se antepone con la
etiqueta del remitente (el mismo estilo que se usa para las entradas del historial). Esto mantiene coherentes
los mensajes en tiempo real y los mensajes en cola/con historial en el prompt del agente.

Los búferes de historial son **solo de pendientes**: incluyen mensajes grupales que _no_
activaron una ejecución (por ejemplo, mensajes restringidos por mención) y **excluyen** mensajes
que ya están en la transcripción de la sesión.

La eliminación de directivas solo se aplica a la sección del **mensaje actual** para que el historial
permanezca intacto. Los canales que envuelven historial deben establecer `CommandBody` (o
`RawBody`) con el texto original del mensaje y mantener `Body` como el prompt combinado.
Los búferes de historial se configuran mediante `messages.groupChat.historyLimit` (valor
predeterminado global) y reemplazos por canal como `channels.slack.historyLimit` o
`channels.telegram.accounts.<id>.historyLimit` (establece `0` para desactivarlo).

## Cola y seguimientos

Si ya hay una ejecución activa, los mensajes entrantes pueden ponerse en cola, dirigirse a la
ejecución actual o recopilarse para un turno de seguimiento.

- Configura esto mediante `messages.queue` (y `messages.queue.byChannel`).
- Modos: `interrupt`, `steer`, `followup`, `collect`, más variantes con backlog.

Detalles: [Cola](/es/concepts/queue).

## Streaming, fragmentación y agrupación

El block streaming envía respuestas parciales a medida que el modelo produce bloques de texto.
La fragmentación respeta los límites de texto del canal y evita dividir código con delimitadores.

Configuraciones principales:

- `agents.defaults.blockStreamingDefault` (`on|off`, desactivado de forma predeterminada)
- `agents.defaults.blockStreamingBreak` (`text_end|message_end`)
- `agents.defaults.blockStreamingChunk` (`minChars|maxChars|breakPreference`)
- `agents.defaults.blockStreamingCoalesce` (agrupación basada en inactividad)
- `agents.defaults.humanDelay` (pausa similar a la humana entre respuestas por bloque)
- Reemplazos por canal: `*.blockStreaming` y `*.blockStreamingCoalesce` (los canales que no son Telegram requieren `*.blockStreaming: true` explícito)

Detalles: [Streaming + fragmentación](/es/concepts/streaming).

## Visibilidad del razonamiento y tokens

OpenClaw puede exponer u ocultar el razonamiento del modelo:

- `/reasoning on|off|stream` controla la visibilidad.
- El contenido de razonamiento sigue contando para el uso de tokens cuando lo produce el modelo.
- Telegram admite streaming del razonamiento en la burbuja de borrador.

Detalles: [Thinking + directivas de razonamiento](/es/tools/thinking) y [Uso de tokens](/es/reference/token-use).

## Prefijos, hilos y respuestas

El formato de los mensajes salientes está centralizado en `messages`:

- `messages.responsePrefix`, `channels.<channel>.responsePrefix` y `channels.<channel>.accounts.<id>.responsePrefix` (cascada de prefijos salientes), además de `channels.whatsapp.messagePrefix` (prefijo entrante de WhatsApp)
- Hilos de respuesta mediante `replyToMode` y valores predeterminados por canal

Detalles: [Configuración](/es/gateway/configuration-reference#messages) y la documentación de cada canal.

## Respuestas silenciosas

El token silencioso exacto `NO_REPLY` / `no_reply` significa “no enviar una respuesta visible para el usuario”.
OpenClaw resuelve ese comportamiento según el tipo de conversación:

- Las conversaciones directas no permiten silencio de forma predeterminada y reescriben una
  respuesta silenciosa sola como un breve fallback visible.
- Los grupos/canales permiten silencio de forma predeterminada.
- La orquestación interna permite silencio de forma predeterminada.

Los valores predeterminados viven en `agents.defaults.silentReply` y
`agents.defaults.silentReplyRewrite`; `surfaces.<id>.silentReply` y
`surfaces.<id>.silentReplyRewrite` pueden reemplazarlos por superficie.

## Relacionado

- [Streaming](/es/concepts/streaming) — entrega de mensajes en tiempo real
- [Retry](/es/concepts/retry) — comportamiento de reintento de entrega de mensajes
- [Queue](/es/concepts/queue) — cola de procesamiento de mensajes
- [Channels](/es/channels) — integraciones con plataformas de mensajería
