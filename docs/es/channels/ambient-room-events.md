---
read_when:
    - Configuración de salas de grupo o canal siempre activas
    - Quieres que el agente observe la conversación de la sala sin publicar automáticamente el texto final
    - Depurar escritura y uso de tokens sin mensaje visible en la sala
sidebarTitle: Ambient room events
summary: Permite que las salas de grupo compatibles proporcionen contexto silencioso a menos que el agente envíe con la herramienta de mensajes
title: Eventos ambientales de sala
x-i18n:
    generated_at: "2026-07-06T10:46:27Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 66177ae942c20026b5aaf007ebbd115373f15aceff585952471abb7721115469
    source_path: channels/ambient-room-events.md
    workflow: 16
---

Los eventos ambientales de sala permiten que OpenClaw procese conversaciones de grupo o canal sin menciones como contexto discreto. El agente puede actualizar la memoria y el estado de la sesión, pero la sala permanece en silencio a menos que el agente llame explícitamente a la herramienta `message`.

Para chats de grupo siempre activos, combina `messages.groupChat.unmentionedInbound: "room_event"` con `messages.groupChat.visibleReplies: "message_tool"`. El agente escucha, decide cuándo una respuesta es útil y ya no necesita el antiguo patrón de prompt de responder `NO_REPLY`.

Compatible actualmente: canales de servidor de Discord, canales y canales privados de Slack, DM multipersona de Slack, y grupos o supergrupos de Telegram. Otros canales de grupo conservan su comportamiento de grupo existente a menos que su página de canal indique que admiten eventos ambientales de sala.

## Configuración recomendada

Establece el comportamiento global de chat de grupo:

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
}
```

Luego haz que la sala esté siempre activa deshabilitando la compuerta por mención para esa sala. La sala aún debe pasar su `groupPolicy` normal, la lista de salas permitidas y la lista de remitentes permitidos.

Después de guardar la configuración, el Gateway aplica en caliente los ajustes de `messages`. Reinicia solo cuando la observación de archivos o la recarga de configuración estén deshabilitadas (`gateway.reload.mode: "off"`).

## Qué cambia

Con `messages.groupChat.unmentionedInbound: "room_event"`:

- los mensajes de grupo o canal permitidos sin mención se convierten en eventos de sala discretos
- los mensajes con mención siguen siendo solicitudes de usuario
- los comandos de control de texto y los comandos nativos siguen siendo solicitudes de usuario
- las solicitudes de abortar o detener siguen siendo solicitudes de usuario
- los mensajes directos siguen siendo solicitudes de usuario

Los eventos de sala usan entrega visible estricta. El texto final del asistente es privado. El agente debe llamar a `message(action=send)` para publicar en la sala.

Las reacciones de estado de escritura y ciclo de vida permanecen suprimidas para los eventos de sala. La única excepción de acuse explícito es `messages.ackReactionScope: "all"`, que envía la reacción de acuse configurada; usa cualquier alcance más restringido o `"off"` cuando la sala deba permanecer completamente en silencio.

## Ejemplo de Discord

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "<DISCORD_SERVER_ID>": {
          requireMention: false,
          users: ["<YOUR_DISCORD_USER_ID>"],
        },
      },
    },
  },
}
```

Usa la configuración de Discord por canal cuando solo un canal deba ser ambiental. Bajo `groupPolicy: "allowlist"`, listar el canal es lo que lo permite (`enabled: false` deshabilita una entrada):

```json5
{
  channels: {
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        "<DISCORD_SERVER_ID>": {
          channels: {
            "<DISCORD_CHANNEL_ID_OR_NAME>": {
              requireMention: false,
            },
          },
        },
      },
    },
  },
}
```

## Ejemplo de Slack

Las listas de canales permitidos de Slack priorizan el ID. Usa ID de canal como `C12345678`, no `#channel-name`. Listar el canal bajo `channels.slack.channels` es lo que lo permite (`enabled: false` deshabilita una entrada):

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
  channels: {
    slack: {
      groupPolicy: "allowlist",
      channels: {
        "<SLACK_CHANNEL_ID>": {
          requireMention: false,
        },
      },
    },
  },
}
```

## Ejemplo de Telegram

Para grupos de Telegram, el bot debe poder ver mensajes de grupo normales. Si `requireMention: false`, deshabilita el modo de privacidad de BotFather o usa otra configuración de Telegram que entregue todo el tráfico de grupo al bot.

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
      visibleReplies: "message_tool",
      historyLimit: 50,
    },
  },
  channels: {
    telegram: {
      groups: {
        "<TELEGRAM_GROUP_CHAT_ID>": {
          groupPolicy: "open",
          requireMention: false,
        },
      },
    },
  },
}
```

Los ID de grupo de Telegram suelen ser números negativos como `-1001234567890`. Lee `chat.id` desde `openclaw logs --follow`, reenvía un mensaje de grupo a un bot auxiliar de ID o inspecciona `getUpdates` de la Bot API.

## Política específica del agente

Usa una anulación de agente cuando varios agentes comparten la misma sala, pero solo uno debe tratar la conversación sin menciones como contexto ambiental:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "message_tool",
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          unmentionedInbound: "room_event",
          mentionPatterns: ["@openclaw", "openclaw"],
        },
      },
    ],
  },
}
```

El valor `agents.list[].groupChat.unmentionedInbound` específico del agente anula `messages.groupChat.unmentionedInbound` para ese agente.

## Modos de respuesta visible

`messages.groupChat.visibleReplies` usa `"automatic"` de forma predeterminada para solicitudes normales de usuario en grupos/canales. Conserva ese valor predeterminado cuando el texto final del asistente deba publicarse de forma visible sin una llamada explícita a la herramienta de mensajes.

Para salas ambientales siempre activas, `messages.groupChat.visibleReplies: "message_tool"` sigue siendo lo recomendado, especialmente con modelos de última generación y fiables con herramientas, como GPT 5.5. Permite que el agente decida cuándo hablar llamando a la herramienta de mensajes. Si el modelo devuelve texto final sin llamar a la herramienta, OpenClaw mantiene ese texto final en privado y registra metadatos de entrega suprimida.

Los eventos de sala siguen siendo estrictos incluso cuando otras solicitudes de grupo usan respuestas automáticas. Los eventos ambientales de sala sin mención siempre requieren `message(action=send)` para la salida visible.

## Historial

`messages.groupChat.historyLimit` establece el valor predeterminado global del historial de grupo (50 cuando no se define; debe ser un entero positivo). Los canales pueden anularlo con `channels.<channel>.historyLimit`, y algunos canales también admiten límites de historial por cuenta. Establece `historyLimit: 0` a nivel de canal para deshabilitar el contexto de historial de grupo para ese canal.

Los canales compatibles con eventos de sala conservan mensajes ambientales recientes de la sala como contexto. Telegram mantiene una ventana continua por grupo siempre activa limitada por `historyLimit`; los turnos de solicitud de usuario seleccionan entradas posteriores a la última respuesta registrada del bot, mientras que los turnos de evento de sala reciben la ventana reciente completa para que el modelo pueda ver sus propias publicaciones recientes. La clave de modo retirada de Telegram `includeGroupHistoryContext` se elimina mediante `openclaw doctor --fix`.

## Solución de problemas

Si la sala muestra escritura o uso de tokens, pero ningún mensaje visible:

1. Confirma que la sala esté permitida por la lista de canales permitidos y la lista de remitentes permitidos.
2. Confirma que `requireMention: false` esté definido en el nivel de sala que esperas.
3. Comprueba si `messages.groupChat.unmentionedInbound` o la anulación del agente es `"room_event"`.
4. Inspecciona los registros en busca de metadatos de carga final suprimida o `didSendViaMessagingTool: false`.
5. Para solicitudes normales de grupo, conserva o restaura `messages.groupChat.visibleReplies: "automatic"` si quieres que las respuestas finales se publiquen automáticamente. Para salas ambientales que usan `message_tool`, usa un modelo/runtime que llame a herramientas de forma fiable.

Si las salas ambientales de Telegram no se activan en absoluto, revisa el modo de privacidad de BotFather y verifica que el Gateway esté recibiendo mensajes de grupo normales.

Si las salas ambientales de Slack no se activan, verifica que la clave del canal sea el ID de canal de Slack y que la app tenga el alcance de historial para ese tipo de sala: `channels:history` (público), `groups:history` (privado) o `mpim:history` (DM multipersona).

## Relacionado

- [Grupos](/es/channels/groups)
- [Discord](/es/channels/discord)
- [Slack](/es/channels/slack)
- [Telegram](/es/channels/telegram)
- [Solución de problemas de canales](/es/channels/troubleshooting)
- [Referencia de configuración de canales](/es/gateway/config-channels)
