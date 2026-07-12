---
read_when:
    - Configuración de salas de grupo o canal siempre activas
    - Quieres que el agente supervise la conversación de la sala sin publicar automáticamente el texto final
    - Depuración del indicador de escritura y del uso de tokens sin mensajes visibles en la sala
sidebarTitle: Ambient room events
summary: Permitir que las salas de grupo compatibles proporcionen contexto silencioso, a menos que el agente envíe mediante la herramienta de mensajes
title: Eventos ambientales de la sala
x-i18n:
    generated_at: "2026-07-12T14:17:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 3f144b44c8ae0a78e756d741c7b4685632862c0eb15531185ddeb0c2ba801e1a
    source_path: channels/ambient-room-events.md
    workflow: 16
---

Los eventos ambientales de sala permiten que OpenClaw procese como contexto discreto la conversación de grupos o canales que no lo menciona. El agente puede actualizar la memoria y el estado de la sesión, pero la sala permanece en silencio a menos que el agente llame explícitamente a la herramienta `message`.

Para chats grupales siempre activos, combine `messages.groupChat.unmentionedInbound: "room_event"` con `messages.groupChat.visibleReplies: "message_tool"`. El agente escucha, decide cuándo resulta útil responder y ya no necesita el antiguo patrón de prompt de responder `NO_REPLY`.

Compatibles actualmente: canales de servidor de Discord, canales públicos y privados de Slack, mensajes directos de Slack con varias personas y grupos o supergrupos de Telegram. Los demás canales grupales conservan su comportamiento existente, a menos que la página del canal indique que admiten eventos ambientales de sala.

## Configuración recomendada

Establezca el comportamiento global de los chats grupales:

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

Después, haga que la sala esté siempre activa deshabilitando para ella el requisito de mención. La sala aún debe cumplir su `groupPolicy` normal, la lista de permitidos de salas y la lista de remitentes permitidos.

Después de guardar la configuración, el Gateway aplica en caliente los ajustes de `messages`. Reinicie solo cuando la observación de archivos o la recarga de configuración estén deshabilitadas (`gateway.reload.mode: "off"`).

## Qué cambia

Con `messages.groupChat.unmentionedInbound: "room_event"`:

- los mensajes permitidos de grupos o canales sin mención se convierten en eventos de sala discretos
- los mensajes con mención siguen siendo solicitudes del usuario
- los comandos de control de texto y los comandos nativos siguen siendo solicitudes del usuario
- las solicitudes de cancelación o detención siguen siendo solicitudes del usuario
- los mensajes directos siguen siendo solicitudes del usuario

Los eventos de sala usan una entrega visible estricta. El texto final del asistente es privado. El agente debe llamar a `message(action=send)` para publicar en la sala.

Las reacciones de estado de escritura y del ciclo de vida permanecen suprimidas para los eventos de sala. La única excepción explícita de confirmación de recepción es `messages.ackReactionScope: "all"`, que envía la reacción de confirmación configurada; use un ámbito más restringido u `"off"` cuando la sala deba permanecer completamente en silencio.

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

Use la configuración por canal de Discord cuando solo un canal deba ser ambiental. Con `groupPolicy: "allowlist"`, incluir el canal es lo que lo permite (`enabled: false` deshabilita una entrada):

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

Las listas de canales permitidos de Slack priorizan los ID. Use ID de canal como `C12345678`, no `#channel-name`. Incluir el canal en `channels.slack.channels` es lo que lo permite (`enabled: false` deshabilita una entrada):

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

En los grupos de Telegram, el bot debe poder ver los mensajes grupales normales. Si `requireMention: false`, deshabilite el modo de privacidad de BotFather o use otra configuración de Telegram que entregue al bot todo el tráfico del grupo.

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

Los ID de grupos de Telegram suelen ser números negativos como `-1001234567890`. Lea `chat.id` en `openclaw logs --follow`, reenvíe un mensaje del grupo a un bot auxiliar para obtener ID o inspeccione `getUpdates` de la API de bots.

## Política específica del agente

Use una anulación por agente cuando varios agentes compartan la misma sala, pero solo uno deba tratar la conversación sin menciones como contexto ambiental:

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

El valor predeterminado de `messages.groupChat.visibleReplies` es `"automatic"` para las solicitudes normales de usuarios en grupos o canales. Mantenga ese valor predeterminado cuando el texto final del asistente deba publicarse de forma visible sin una llamada explícita a la herramienta de mensajería.

Para las salas ambientales siempre activas, se sigue recomendando `messages.groupChat.visibleReplies: "message_tool"`, especialmente con modelos de última generación que usan herramientas de forma fiable, como GPT-5.6 Sol. Permite que el agente decida cuándo hablar llamando a la herramienta de mensajería. Si el modelo devuelve texto final sin llamar a la herramienta, OpenClaw mantiene ese texto final privado y registra metadatos de entrega suprimida.

Los eventos de sala mantienen el modo estricto incluso cuando otras solicitudes grupales usan respuestas automáticas. Los eventos ambientales de sala sin mención siempre requieren `message(action=send)` para producir una salida visible.

## Historial

`messages.groupChat.historyLimit` establece el valor global predeterminado del historial grupal (50 si no se configura; debe ser un entero positivo). Los canales pueden anularlo mediante `channels.<channel>.historyLimit`, y algunos canales también admiten límites de historial por cuenta. Establezca `historyLimit: 0` en el nivel del canal para deshabilitar el contexto del historial grupal de ese canal.

Los canales compatibles con eventos de sala conservan como contexto los mensajes ambientales recientes de la sala. Telegram mantiene una ventana continua siempre activa por grupo, limitada por `historyLimit`; los turnos de solicitudes del usuario seleccionan las entradas posteriores a la última respuesta registrada del bot, mientras que los turnos de eventos de sala reciben la ventana reciente completa para que el modelo pueda ver sus propias publicaciones recientes. `openclaw doctor --fix` elimina la clave de modo obsoleta de Telegram `includeGroupHistoryContext`.

## Solución de problemas

Si la sala muestra actividad de escritura o uso de tokens, pero ningún mensaje visible:

1. Confirme que la sala esté permitida por la lista de canales permitidos y la lista de remitentes permitidos.
2. Confirme que `requireMention: false` esté configurado en el nivel de sala esperado.
3. Compruebe si `messages.groupChat.unmentionedInbound` o la anulación del agente es `"room_event"`.
4. Inspeccione los registros para buscar metadatos de carga final suprimida o `didSendViaMessagingTool: false`.
5. Para solicitudes grupales normales, mantenga o restaure `messages.groupChat.visibleReplies: "automatic"` si desea que las respuestas finales se publiquen automáticamente. Para salas ambientales que usan `message_tool`, use un modelo o entorno de ejecución que llame a las herramientas de forma fiable.

Si las salas ambientales de Telegram no se activan en absoluto, compruebe el modo de privacidad de BotFather y verifique que el Gateway esté recibiendo mensajes grupales normales.

Si las salas ambientales de Slack no se activan, verifique que la clave del canal sea el ID de canal de Slack y que la aplicación tenga el ámbito de historial correspondiente a ese tipo de sala: `channels:history` (pública), `groups:history` (privada) o `mpim:history` (mensajes directos con varias personas).

## Recursos relacionados

- [Grupos](/es/channels/groups)
- [Discord](/es/channels/discord)
- [Slack](/es/channels/slack)
- [Telegram](/es/channels/telegram)
- [Solución de problemas de canales](/es/channels/troubleshooting)
- [Referencia de configuración de canales](/es/gateway/config-channels)
