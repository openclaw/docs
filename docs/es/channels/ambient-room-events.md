---
read_when:
    - Configurar salas de grupo o canal siempre activas
    - Quieres que el agente observe la charla de la sala sin publicar automáticamente el texto final
    - Depuración de escritura y uso de tokens sin mensaje visible en la sala
sidebarTitle: Ambient room events
summary: Permite que las salas de grupo compatibles proporcionen contexto silencioso a menos que el agente envíe mediante la herramienta de mensajes.
title: Eventos ambientales de la sala
x-i18n:
    generated_at: "2026-06-27T10:35:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6423bea8aa1371fe53b610ae1ca794fc6d7866ecd767eee7b837a75004eebf83
    source_path: channels/ambient-room-events.md
    workflow: 16
---

Los eventos de sala ambiente permiten que OpenClaw procese conversaciones de grupos o canales sin mención como contexto silencioso. El agente puede actualizar la memoria y el estado de la sesión, pero la sala permanece en silencio a menos que el agente llame explícitamente a la herramienta `message`.

Para chats grupales siempre activos, este es el modo recomendado: combina `messages.groupChat.unmentionedInbound: "room_event"` con `messages.groupChat.visibleReplies: "message_tool"`. Úsalo cuando el agente deba escuchar, decidir cuándo una respuesta es útil y evitar el antiguo patrón de prompt de responder `NO_REPLY`.

Compatible actualmente: canales de servidores de Discord, canales y canales privados de Slack, DM de varias personas en Slack, y grupos o supergrupos de Telegram. Otros canales grupales conservan su comportamiento grupal existente a menos que su página de canal indique que admiten eventos de sala ambiente.

## Configuración recomendada

Define el comportamiento global del chat grupal:

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

Luego configura la sala en sí como siempre activa deshabilitando el control por menciones para esa sala. El canal aún debe estar permitido por su `groupPolicy` normal, la lista de permitidos de salas y la lista de permitidos de remitentes.

Después de guardar la configuración, el Gateway recarga en caliente la configuración de `messages`. Reinicia solo cuando la vigilancia de archivos o la recarga de configuración estén deshabilitadas.

## Qué cambia

Con `messages.groupChat.unmentionedInbound: "room_event"`:

- los mensajes grupales o de canal permitidos y sin mención se convierten en eventos de sala silenciosos
- los mensajes con mención siguen siendo solicitudes de usuario
- los comandos de texto y comandos nativos siguen siendo solicitudes de usuario
- las solicitudes de abortar o detener siguen siendo solicitudes de usuario
- los mensajes directos siguen siendo solicitudes de usuario

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

Usa la configuración de Discord por canal cuando solo un canal deba ser ambiente:

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

Las listas de permitidos de canales de Slack priorizan los ID. Usa ID de canal como `C12345678`, no `#channel-name`.

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

Para grupos de Telegram, el bot debe poder ver los mensajes grupales normales. Si `requireMention: false`, deshabilita el modo de privacidad de BotFather o usa otra configuración de Telegram que entregue todo el tráfico del grupo al bot.

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

Los ID de grupos de Telegram suelen ser números negativos como `-1001234567890`. Lee `chat.id` desde `openclaw logs --follow`, reenvía un mensaje grupal a un bot auxiliar de ID o inspecciona `getUpdates` de la Bot API.

## Política específica del agente

Usa una anulación de agente cuando varios agentes compartan la misma sala, pero solo uno deba tratar la conversación sin mención como contexto ambiente:

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

El valor de `agents.list[].groupChat.unmentionedInbound` específico del agente anula `messages.groupChat.unmentionedInbound` para ese agente.

## Modos de respuesta visible

`messages.groupChat.visibleReplies` usa `"automatic"` de forma predeterminada para solicitudes normales de usuario en grupos o canales. Mantén ese valor predeterminado cuando quieras que el texto final del asistente se publique visiblemente sin requerir una llamada explícita a la herramienta de mensajes.

Para salas ambiente siempre activas, `messages.groupChat.visibleReplies: "message_tool"` sigue siendo recomendado, especialmente con modelos de última generación y fiables con herramientas, como GPT 5.5. Permite que el agente decida cuándo hablar llamando a la herramienta de mensajes. Si el modelo devuelve texto final sin llamar a la herramienta, OpenClaw mantiene ese texto final privado y registra metadatos de entrega suprimida.

Los eventos de sala siguen siendo estrictos incluso cuando otras solicitudes grupales usan respuestas automáticas. Los eventos de sala ambiente sin mención aún requieren `message(action=send)` para producir una salida visible.

## Historial

`messages.groupChat.historyLimit` controla el valor predeterminado global del historial grupal. Los canales pueden anularlo con `channels.<channel>.historyLimit`, y algunos canales también admiten límites de historial por cuenta.

Define `historyLimit: 0` para deshabilitar el contexto del historial grupal.

Los canales compatibles con eventos de sala conservan los mensajes ambiente recientes de la sala como contexto. Discord conserva el historial de eventos de sala hasta que un envío visible de Discord tenga éxito, de modo que el contexto silencioso no se pierda antes de la entrega mediante la herramienta de mensajes.

## Solución de problemas

Si la sala muestra escritura o uso de tokens pero ningún mensaje visible:

1. Confirma que la sala esté permitida por la lista de permitidos del canal y la lista de permitidos de remitentes.
2. Confirma que `requireMention: false` esté definido en el nivel de sala que esperas.
3. Comprueba si `messages.groupChat.unmentionedInbound` o la anulación del agente es `"room_event"`.
4. Inspecciona los registros en busca de metadatos de carga final suprimida o `didSendViaMessagingTool: false`.
5. Para solicitudes grupales normales, conserva o restaura `messages.groupChat.visibleReplies: "automatic"` si quieres que las respuestas finales se publiquen automáticamente. Para salas ambiente que usan `message_tool`, usa un modelo o runtime que llame a herramientas de forma fiable.

Si las salas ambiente de Telegram no se activan en absoluto, revisa el modo de privacidad de BotFather y verifica que el Gateway esté recibiendo mensajes grupales normales.

Si las salas ambiente de Slack no se activan, verifica que la clave del canal sea el ID de canal de Slack y que la app tenga el alcance `channels:history` o `groups:history` requerido para ese tipo de sala.

## Relacionado

- [Grupos](/es/channels/groups)
- [Discord](/es/channels/discord)
- [Slack](/es/channels/slack)
- [Telegram](/es/channels/telegram)
- [Solución de problemas de canales](/es/channels/troubleshooting)
- [Referencia de configuración de canales](/es/gateway/config-channels)
