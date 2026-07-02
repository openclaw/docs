---
read_when:
    - Configurar salas de grupo o canal siempre activas
    - Quieres que el agente observe la conversación de la sala sin publicar automáticamente el texto final
    - Depurar la escritura y el uso de tokens sin mensaje de sala visible
sidebarTitle: Ambient room events
summary: Permitir que las salas de grupo compatibles proporcionen contexto silencioso a menos que el agente envíe con la herramienta de mensajes
title: Eventos ambientales de la sala
x-i18n:
    generated_at: "2026-07-02T17:30:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8e3dcf5abab58d9bfd75b7cef6c8a55b98f6688a895774b8ba4a1ffc5723e0a6
    source_path: channels/ambient-room-events.md
    workflow: 16
---

Los eventos ambientales de sala permiten que OpenClaw procese la charla de grupos o canales sin mención como contexto silencioso. El agente puede actualizar la memoria y el estado de la sesión, pero la sala permanece en silencio a menos que el agente llame explícitamente a la herramienta `message`.

Para chats grupales siempre activos, este es el modo recomendado: combina `messages.groupChat.unmentionedInbound: "room_event"` con `messages.groupChat.visibleReplies: "message_tool"`. Úsalo cuando el agente deba escuchar, decidir cuándo es útil responder y evitar el patrón antiguo de prompt de responder `NO_REPLY`.

Compatible actualmente: canales de servidor Discord, canales y canales privados de Slack, mensajes directos de varias personas de Slack, y grupos o supergrupos de Telegram. Otros canales grupales conservan su comportamiento grupal existente a menos que su página de canal indique que admiten eventos ambientales de sala.

## Configuración recomendada

Establece el comportamiento global de chats grupales:

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

Luego configura la sala como siempre activa deshabilitando la compuerta por mención para esa sala. El canal aún debe estar permitido por su `groupPolicy` normal, la lista de permitidos de la sala y la lista de permitidos de remitentes.

Después de guardar la configuración, el Gateway recarga en caliente la configuración de `messages`. Reinicia solo cuando la observación de archivos o la recarga de configuración esté deshabilitada.

## Qué cambia

Con `messages.groupChat.unmentionedInbound: "room_event"`:

- los mensajes grupales o de canal permitidos sin mención se convierten en eventos de sala silenciosos
- los mensajes con mención permanecen como solicitudes de usuario
- los comandos de texto y comandos nativos permanecen como solicitudes de usuario
- las solicitudes de abortar o detener permanecen como solicitudes de usuario
- los mensajes directos permanecen como solicitudes de usuario

Los eventos de sala usan entrega visible estricta. El texto final del asistente es privado. El agente debe llamar a `message(action=send)` para publicar en la sala.

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

Usa la configuración de Discord por canal cuando solo un canal deba ser ambiental:

```json5
{
  channels: {
    discord: {
      guilds: {
        "<DISCORD_SERVER_ID>": {
          channels: {
            "<DISCORD_CHANNEL_ID_OR_NAME>": {
              allow: true,
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

Las listas de permitidos de canales de Slack priorizan el ID. Usa ID de canal como `C12345678`, no `#channel-name`.

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
          allow: true,
          requireMention: false,
        },
      },
    },
  },
}
```

## Ejemplo de Telegram

Para grupos de Telegram, el bot debe poder ver mensajes grupales normales. Si `requireMention: false`, deshabilita el modo de privacidad de BotFather o usa otra configuración de Telegram que entregue todo el tráfico grupal al bot.

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

Los ID de grupos de Telegram suelen ser números negativos como `-1001234567890`. Lee `chat.id` desde `openclaw logs --follow`, reenvía un mensaje grupal a un bot auxiliar de ID o inspecciona `getUpdates` de Bot API.

## Política específica del agente

Usa una anulación de agente cuando varios agentes comparten la misma sala, pero solo uno debe tratar la charla sin mención como contexto ambiental:

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

El valor específico del agente `agents.list[].groupChat.unmentionedInbound` anula `messages.groupChat.unmentionedInbound` para ese agente.

## Modos de respuesta visible

`messages.groupChat.visibleReplies` usa de forma predeterminada `"automatic"` para solicitudes de usuario normales en grupos o canales. Mantén ese valor predeterminado cuando quieras que el texto final del asistente se publique de forma visible sin requerir una llamada explícita a la herramienta de mensajes.

Para salas ambientales siempre activas, `messages.groupChat.visibleReplies: "message_tool"` sigue siendo recomendado, especialmente con modelos de última generación y fiables con herramientas, como GPT 5.5. Permite que el agente decida cuándo hablar llamando a la herramienta de mensajes. Si el modelo devuelve texto final sin llamar a la herramienta, OpenClaw mantiene ese texto final privado y registra metadatos de entrega suprimida.

Los eventos de sala siguen siendo estrictos incluso cuando otras solicitudes grupales usan respuestas automáticas. Los eventos ambientales de sala sin mención siguen requiriendo `message(action=send)` para producir salida visible.

## Historial

`messages.groupChat.historyLimit` controla el valor predeterminado global del historial grupal. Los canales pueden anularlo con `channels.<channel>.historyLimit`, y algunos canales también admiten límites de historial por cuenta.

Establece `historyLimit: 0` para deshabilitar el contexto del historial grupal.

Los canales compatibles con eventos de sala conservan los mensajes ambientales recientes de la sala como contexto. Telegram mantiene una ventana continua siempre activa por grupo limitada por `historyLimit`; los turnos de solicitud de usuario seleccionan entradas después de la última respuesta registrada del bot, mientras que los turnos de eventos de sala reciben la ventana reciente completa para que el modelo pueda ver sus propias publicaciones recientes. La clave de modo retirada de Telegram `includeGroupHistoryContext` se elimina mediante `openclaw doctor --fix`.

## Solución de problemas

Si la sala muestra escritura o uso de tokens, pero no hay mensaje visible:

1. Confirma que la sala esté permitida por la lista de permitidos del canal y la lista de permitidos de remitentes.
2. Confirma que `requireMention: false` esté establecido en el nivel de sala que esperas.
3. Comprueba si `messages.groupChat.unmentionedInbound` o la anulación del agente es `"room_event"`.
4. Inspecciona los registros en busca de metadatos de carga final suprimida o `didSendViaMessagingTool: false`.
5. Para solicitudes grupales normales, mantén o restaura `messages.groupChat.visibleReplies: "automatic"` si quieres que las respuestas finales se publiquen automáticamente. Para salas ambientales que usan `message_tool`, usa un modelo o runtime que llame a herramientas de forma fiable.

Si las salas ambientales de Telegram no se activan en absoluto, comprueba el modo de privacidad de BotFather y verifica que el Gateway esté recibiendo mensajes grupales normales.

Si las salas ambientales de Slack no se activan, verifica que la clave del canal sea el ID de canal de Slack y que la aplicación tenga el alcance `channels:history` o `groups:history` requerido para ese tipo de sala.

## Relacionado

- [Grupos](/es/channels/groups)
- [Discord](/es/channels/discord)
- [Slack](/es/channels/slack)
- [Telegram](/es/channels/telegram)
- [Solución de problemas de canales](/es/channels/troubleshooting)
- [Referencia de configuración de canales](/es/gateway/config-channels)
