---
read_when:
    - Cambiar el comportamiento del chat grupal o la restricción por mención
    - Limitar mentionPatterns a conversaciones de grupo específicas
sidebarTitle: Groups
summary: Comportamiento del chat grupal en todas las superficies (Discord/iMessage/Matrix/Microsoft Teams/QQBot/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Grupos
x-i18n:
    generated_at: "2026-07-05T11:02:28Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 28df65cd1b9b682ae72ea8697597a6481b85ee2689479237a2d1896483386907
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw aplica las mismas reglas de grupo en todos los canales con capacidad de grupos, incluidos Discord, iMessage, Matrix, Microsoft Teams, QQBot, Signal, Slack, Telegram, WhatsApp y Zalo.

Para salas siempre activas que deben proporcionar contexto silencioso salvo que el agente envíe explícitamente un mensaje visible, consulta [Eventos de sala ambientales](/es/channels/ambient-room-events).

## Introducción para principiantes (2 minutos)

OpenClaw "vive" en tus propias cuentas de mensajería. No hay un usuario de bot de WhatsApp separado: si **tú** estás en un grupo, OpenClaw puede ver ese grupo y responder allí.

Comportamiento predeterminado:

- Los grupos están restringidos (`groupPolicy: "allowlist"`); los remitentes de grupo se bloquean hasta que se agregan a la lista de permitidos.
- Las respuestas requieren una mención salvo que desactives la compuerta por mención para un grupo.
- El texto de respuesta final se publica automáticamente en la sala (`visibleReplies: "automatic"`).

En otras palabras: los remitentes permitidos pueden activar OpenClaw mencionándolo.

<Note>
**TL;DR**

- El **acceso por MD** se controla con `*.allowFrom`.
- El **acceso de grupo** se controla con `*.groupPolicy` + listas de permitidos (`*.groups`, `*.groupAllowFrom`).
- La **activación de respuestas** se controla con la compuerta por mención (`requireMention`, `/activation`).

</Note>

Flujo rápido (qué ocurre con un mensaje de grupo):

```text
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
mention/reply/command/DM -> user request
always-on group chatter -> user request, or room event when configured
```

## Respuestas visibles

Para solicitudes normales de grupo/canal, OpenClaw usa de forma predeterminada `messages.groupChat.visibleReplies: "automatic"`: el texto final del asistente se publica en la sala como respuesta visible.

Usa `messages.groupChat.visibleReplies: "message_tool"` cuando una sala compartida deba permitir que el agente decida cuándo hablar llamando a `message(action=send)`. Esto funciona mejor con modelos fiables en el uso de herramientas (por ejemplo, GPT 5.5). Si el modelo no usa la herramienta y devuelve texto final sustantivo, OpenClaw mantiene ese texto privado en lugar de publicarlo en la sala.

Usa `"automatic"` para modelos o runtimes que no siguen de forma fiable la entrega solo mediante herramientas: los finales de texto normales se publican directamente en la sala, y el agente aún puede llamar a `message(action=send)` para archivos, imágenes u otros adjuntos que no puedan viajar junto con el texto final.

Si la herramienta de mensajes no está disponible bajo la política de herramientas activa, OpenClaw vuelve a respuestas visibles automáticas en lugar de suprimir silenciosamente la respuesta. `openclaw doctor` advierte sobre esta discrepancia.

Para chats directos y cualquier otro evento de origen, `messages.visibleReplies: "message_tool"` aplica el mismo comportamiento solo mediante herramientas de forma global; `messages.groupChat.visibleReplies` sigue siendo la anulación más específica para salas de grupo/canal. Los turnos directos internos de WebChat usan de forma predeterminada entrega automática de respuesta final para que Pi y Codex reciban el mismo contrato de respuesta visible.

El modo solo herramienta reemplaza el patrón anterior de forzar al modelo a responder `NO_REPLY` para la mayoría de los turnos en modo de escucha. En el modo solo herramienta, el prompt no define un contrato `NO_REPLY`; no hacer nada visible simplemente significa no llamar a la herramienta de mensajes.

Las vinculaciones de conversación propiedad de un Plugin son la excepción. Una vez que un Plugin vincula un hilo y reclama el turno entrante, la respuesta devuelta por el Plugin es la respuesta de vinculación visible; no necesita `message(action=send)`. Esa respuesta es salida del runtime del Plugin, no texto final privado del modelo.

Los indicadores de escritura siguen enviándose para solicitudes directas de grupo. Los eventos de sala siempre activa ambientales, cuando están habilitados, permanecen estrictos y silenciosos salvo que el agente llame a la herramienta de mensajes.

Las sesiones suprimen de forma predeterminada los resúmenes detallados de herramientas/progreso. Usa `/verbose on` (o `/verbose full`) para mostrarlos en la sesión actual mientras depuras, y `/verbose off` para volver al comportamiento de solo respuesta final. El estado detallado es por sesión y funciona igual en chats directos, grupos, canales y temas de foro.

Para enviar conversaciones de grupo siempre activas sin mención como contexto silencioso de sala en lugar de solicitudes de usuario, usa [Eventos de sala ambientales](/es/channels/ambient-room-events):

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
    },
  },
}
```

El valor predeterminado es `unmentionedInbound: "user_request"`. Los mensajes mencionados, comandos, solicitudes de cancelación y MD siguen siendo solicitudes de usuario.

Para exigir que la salida visible pase por la herramienta de mensajes en solicitudes de grupo/canal:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "message_tool",
    },
  },
}
```

Para exigirlo en cada chat de origen:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

El Gateway recoge los cambios de configuración de `messages` sin reiniciar después de guardar el archivo. Reinicia solo cuando la recarga de configuración esté desactivada (`gateway.reload.mode: "off"`).

Los turnos de comando omiten `visibleReplies: "message_tool"` y siempre responden de forma visible: los comandos de barra nativos (Discord, Telegram y otras superficies con soporte de comandos nativos) y los comandos de texto `/...` autorizados publican su respuesta en el chat de origen. Los turnos de texto `/...` no autorizados en grupos siguen siendo solo mediante herramienta de mensajes; los turnos de chat ordinarios siguen el valor predeterminado configurado.

## Visibilidad de contexto y listas de permitidos

Hay dos controles distintos implicados en la seguridad de grupos:

- **Autorización de activación**: quién puede activar el agente (`groupPolicy`, `groups`, `groupAllowFrom`, listas de permitidos específicas del canal).
- **Visibilidad de contexto**: qué contexto suplementario se inyecta en el modelo (texto de respuesta/cita, historial del hilo, metadatos reenviados).

De forma predeterminada, OpenClaw mantiene el contexto tal como se recibe: las listas de permitidos deciden quién puede activar acciones, no qué fragmentos citados o históricos ve el modelo. Para filtrar también el contexto suplementario, configura `contextVisibility`:

| Modo                | Comportamiento                                                                  |
| ------------------- | -------------------------------------------------------------------------------- |
| `"all"` (predeterminado) | Mantiene el contexto suplementario tal como se recibe.                       |
| `"allowlist"`       | Solo inyecta contexto de historial/hilo/cita/reenviado de remitentes permitidos. |
| `"allowlist_quote"` | `allowlist`, además mantiene el mensaje citado/respondido explícitamente de cualquier remitente. |

Configúralo por canal (`channels.<channel>.contextVisibility`), por cuenta (`channels.<channel>.accounts.<accountId>.contextVisibility`) o globalmente (`channels.defaults.contextVisibility`). Los canales que obtienen contexto suplementario (Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp) aplican la política al construir el contexto entrante; las combinaciones de políticas desconocidas fallan de forma cerrada y omiten el contexto.

![Flujo de mensajes de grupo](/images/groups-flow.svg)

Si quieres...

| Objetivo                                      | Qué configurar                                             |
| --------------------------------------------- | ---------------------------------------------------------- |
| Permitir todos los grupos pero responder solo en @menciones | `groups: { "*": { requireMention: true } }`                |
| Desactivar todas las respuestas de grupo      | `groupPolicy: "disabled"`                                  |
| Solo grupos específicos                       | `groups: { "<group-id>": { ... } }` (sin clave `"*"`)      |
| Solo tú puedes activar en grupos              | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| Reutilizar un conjunto de remitentes de confianza entre canales | `groupAllowFrom: ["accessGroup:operators"]`                |

Para listas de permitidos de remitentes reutilizables, consulta [Grupos de acceso](/es/channels/access-groups).

## Claves de sesión

- Las sesiones de grupo usan claves de sesión `agent:<agentId>:<channel>:group:<id>` (las salas/canales usan `agent:<agentId>:<channel>:channel:<id>`).
- Los temas de foro de Telegram agregan `:topic:<threadId>` al id de grupo para que cada tema tenga su propia sesión.
- Los chats directos usan la sesión principal (o sesiones por remitente si `session.dmScope` está configurado).
- Los Heartbeats se ejecutan en la sesión de Heartbeat configurada (valor predeterminado: la sesión principal del agente); las sesiones de grupo no ejecutan sus propios Heartbeats.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Patrón: MD personales + grupos públicos (un solo agente)

Sí, esto funciona bien si tu tráfico "personal" son **MD** y tu tráfico "público" son **grupos**.

Por qué: en modo de un solo agente, los MD normalmente llegan a la clave de sesión **principal** (`agent:main:main`), mientras que los grupos siempre usan claves de sesión **no principales** (`agent:main:<channel>:group:<id>`). Si habilitas el aislamiento con `mode: "non-main"`, esas sesiones de grupo se ejecutan en el backend de sandbox configurado mientras tu sesión principal de MD permanece en el host. Docker es el backend predeterminado si no eliges uno.

Esto te da un "cerebro" de agente (espacio de trabajo + memoria compartidos), pero dos posturas de ejecución:

- **MD**: herramientas completas (host)
- **Grupos**: sandbox + herramientas restringidas

<Note>
Si necesitas espacios de trabajo/personas realmente separados ("personal" y "público" nunca deben mezclarse), usa un segundo agente + vinculaciones. Consulta [Enrutamiento multiagente](/es/concepts/multi-agent).
</Note>

<Tabs>
  <Tab title="DMs on host, groups sandboxed">
    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main", // groups/channels are non-main -> sandboxed
            scope: "session", // strongest isolation (one container per group/channel)
            workspaceAccess: "none",
          },
        },
      },
      tools: {
        sandbox: {
          tools: {
            // If allow is non-empty, everything else is blocked (deny still wins).
            allow: ["group:messaging", "group:sessions"],
            deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Groups see only an allowlisted folder">
    ¿Quieres que "los grupos solo puedan ver la carpeta X" en lugar de "sin acceso al host"? Mantén `workspaceAccess: "none"` y monta solo rutas permitidas en el sandbox:

    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main",
            scope: "session",
            workspaceAccess: "none",
            docker: {
              binds: [
                // hostPath:containerPath:mode
                "/home/user/FriendsShared:/data:ro",
              ],
            },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

Relacionado:

- Claves de configuración y valores predeterminados: [Configuración del Gateway](/es/gateway/config-agents#agentsdefaultssandbox)
- Depurar por qué una herramienta está bloqueada: [Sandbox frente a política de herramientas frente a elevado](/es/gateway/sandbox-vs-tool-policy-vs-elevated)
- Detalles de montajes bind: [Aislamiento](/es/gateway/sandboxing#custom-bind-mounts)

## Etiquetas de visualización

- Las etiquetas de UI usan `displayName` cuando está disponible, con formato `<channel>:<token>`.
- `#room` está reservado para salas/canales; los chats de grupo usan `g-<slug>` (minúsculas, espacios -> `-`, conserva `#@+._-`). Los ids opacos muy largos se acortan a un token estable en lugar de filtrar ids de ruta completos en la UI.

## Política de grupo

Controla cómo se gestionan los mensajes de grupo/sala por canal:

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // numeric Telegram user id (setup resolves @username)
    },
    signal: {
      groupPolicy: "disabled",
      groupAllowFrom: ["+15551234567"],
    },
    imessage: {
      groupPolicy: "disabled",
      groupAllowFrom: ["chat_id:123"],
    },
    msteams: {
      groupPolicy: "disabled",
      groupAllowFrom: ["user@org.com"],
    },
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        GUILD_ID: { channels: { help: { enabled: true } } },
      },
    },
    slack: {
      groupPolicy: "allowlist",
      channels: { "#general": { enabled: true } },
    },
    matrix: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["@owner:example.org"],
      groups: {
        "!roomId:example.org": { enabled: true },
        "#alias:example.org": { enabled: true },
      },
    },
  },
}
```

| Política      | Comportamiento                                                        |
| ------------- | --------------------------------------------------------------------- |
| `"open"`      | Los grupos omiten las listas de permitidos; el control por menciones sigue aplicándose. |
| `"disabled"`  | Bloquea por completo todos los mensajes de grupo.                     |
| `"allowlist"` | Solo permite grupos/salas que coincidan con la lista de permitidos configurada. |

<AccordionGroup>
  <Accordion title="Per-channel notes">
    - `groupPolicy` es independiente del control por menciones (que requiere @menciones).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: usa `groupAllowFrom` (alternativa: `allowFrom` explícito).
    - Signal: `groupAllowFrom` puede coincidir con el id de grupo entrante de Signal o con el teléfono/UUID del remitente.
    - Las aprobaciones de emparejamiento de DM (entradas almacenadas `*-allowFrom`) se aplican solo al acceso por DM; la autorización de remitentes de grupo sigue siendo explícita mediante listas de permitidos de grupo.
    - Discord: la lista de permitidos usa `channels.discord.guilds.<id>.channels`.
    - Slack: la lista de permitidos usa `channels.slack.channels`.
    - Matrix: la lista de permitidos usa `channels.matrix.groups`. Usa IDs de sala (`!room:server`) o alias (`#alias:server`); las claves de nombre de sala solo coinciden con `channels.matrix.dangerouslyAllowNameMatching: true`, y las entradas no resueltas se ignoran en tiempo de ejecución. Usa `channels.matrix.groupAllowFrom` para restringir remitentes; también se admiten listas de permitidos `users` por sala.
    - Los DM de grupo se controlan por separado (`channels.discord.dm.*`, `channels.slack.dm.*`: `groupEnabled`, `groupChannels`).
    - Telegram: las listas de permitidos de remitentes solo aceptan IDs numéricos de usuario (`"123456789"`; los prefijos `telegram:`/`tg:` se eliminan sin distinguir mayúsculas y minúsculas). Las entradas `@username` no coinciden en tiempo de ejecución y registran una advertencia; la configuración resuelve `@username` a IDs. Los IDs de chat negativos deben estar en `channels.telegram.groups`, no en listas de permitidos de remitentes.
    - El valor predeterminado es `groupPolicy: "allowlist"`; si tu lista de permitidos de grupo está vacía, los mensajes de grupo se bloquean.
    - Seguridad en tiempo de ejecución: cuando falta por completo un bloque de proveedor (`channels.<provider>` ausente), la política de grupo falla cerrada a `allowlist` en lugar de heredar `channels.defaults.groupPolicy`, y el Gateway registra la alternativa una vez por cuenta.

  </Accordion>
</AccordionGroup>

Modelo mental rápido (orden de evaluación para mensajes de grupo):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (open/disabled/allowlist).
  </Step>
  <Step title="Group allowlists">
    Listas de permitidos de grupo (`*.groups`, `*.groupAllowFrom`, lista de permitidos específica del canal).
  </Step>
  <Step title="Mention gating">
    Control por menciones (`requireMention`, `/activation`).
  </Step>
</Steps>

## Control por menciones (predeterminado)

Los mensajes de grupo requieren una mención salvo que se anule por grupo. Los valores predeterminados viven por subsistema en `*.groups."*"`.

Responder a un mensaje del bot cuenta como una mención implícita cuando el canal expone metadatos de respuesta; citar un mensaje del bot también puede contar en canales que exponen metadatos de cita. Casos integrados actuales: Discord, Microsoft Teams, QQBot, Slack, Telegram, WhatsApp y Zalo personal.

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
        "123@g.us": { requireMention: false },
      },
    },
    telegram: {
      groups: {
        "*": { requireMention: true },
        "123456789": { requireMention: false },
      },
    },
    imessage: {
      groups: {
        "*": { requireMention: true },
        "123": { requireMention: false },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          mentionPatterns: ["@openclaw", "openclaw", "\\+15555550123"],
          historyLimit: 50,
        },
      },
    ],
  },
}
```

## Delimitar patrones de mención configurados

Los `mentionPatterns` configurados son activadores alternativos regex. Úsalos cuando la plataforma no expone una mención nativa del bot, o cuando texto sin formato como `openclaw:` debe contar como mención. Las menciones nativas de la plataforma son independientes: cuando Discord, Slack, Telegram, Matrix u otro canal puede demostrar que el mensaje mencionó explícitamente al bot, esa mención nativa sigue activándose incluso donde se deniegan los patrones regex configurados.

De forma predeterminada, los patrones de mención configurados se aplican en todas partes donde el canal pasa datos del proveedor y de la conversación a la detección de menciones. Para evitar que patrones amplios despierten al agente en cada grupo, delimítalos por canal con `channels.<channel>.mentionPatterns`.

Usa `mode: "deny"` cuando los patrones de mención regex deban estar desactivados de forma predeterminada para un canal, y luego habilita salas específicas con `allowIn`:

```json5
{
  messages: {
    groupChat: {
      mentionPatterns: ["\\bopenclaw\\b", "\\bops bot\\b"],
    },
  },
  channels: {
    slack: {
      mentionPatterns: {
        mode: "deny",
        allowIn: ["C0123OPS"],
      },
    },
  },
}
```

Usa el `mode: "allow"` predeterminado (u omite `mode`) cuando los patrones de mención regex deban aplicarse ampliamente, y luego desactívalos en salas ruidosas con `denyIn`:

```json5
{
  messages: {
    groupChat: {
      mentionPatterns: ["\\bopenclaw\\b"],
    },
  },
  channels: {
    telegram: {
      mentionPatterns: {
        denyIn: ["-1001234567890", "-1001234567890:topic:42"],
      },
    },
  },
}
```

Resolución de políticas:

| Campo           | Efecto                                                                                                                |
| --------------- | --------------------------------------------------------------------------------------------------------------------- |
| `mode: "allow"` | Los patrones de mención regex están habilitados salvo que el ID de conversación esté en `denyIn`. Este es el valor predeterminado. |
| `mode: "deny"`  | Los patrones de mención regex están deshabilitados salvo que el ID de conversación esté en `allowIn`.                  |
| `allowIn`       | IDs de conversación donde los patrones de mención regex están habilitados en modo de denegación.                      |
| `denyIn`        | IDs de conversación donde los patrones de mención regex están deshabilitados. `denyIn` prevalece sobre `allowIn` si ambos incluyen el mismo ID. |

Política regex delimitada admitida hoy:

| Canal    | IDs usados en `allowIn` / `denyIn`                              |
| -------- | --------------------------------------------------------------- |
| Discord  | IDs de canal de Discord.                                        |
| Matrix   | IDs de sala de Matrix.                                          |
| Slack    | IDs de canal de Slack.                                          |
| Telegram | IDs de chat de grupo, o `chatId:topic:threadId` para temas de foro. |
| WhatsApp | IDs de conversación de WhatsApp como `123@g.us`.                |

Las configuraciones de canal a nivel de cuenta pueden definir la misma política en `channels.<channel>.accounts.<accountId>.mentionPatterns` cuando ese canal admite varias cuentas. La política de cuenta tiene prioridad sobre la política de canal de nivel superior para esa cuenta.

<AccordionGroup>
  <Accordion title="Mention gating notes">
    - `mentionPatterns` son patrones regex seguros que no distinguen mayúsculas y minúsculas; los patrones no válidos y las formas inseguras de repetición anidada se ignoran (con una advertencia).
    - Precedencia de patrones: `agents.list[].groupChat.mentionPatterns` (útil cuando varios agentes comparten un grupo) anula `messages.groupChat.mentionPatterns`; cuando no se define ninguno, los patrones se derivan del nombre/emoji de identidad del agente.
    - El control por menciones solo se aplica cuando la detección de menciones es posible (menciones nativas o `mentionPatterns` configurados).
    - Incluir un grupo o remitente en una lista de permitidos no desactiva el control por menciones; establece `requireMention` de ese grupo en `false` cuando todos los mensajes deban activarse.
    - El contexto automático del prompt de chat de grupo incluye la instrucción resuelta de respuesta silenciosa en cada turno; los archivos del espacio de trabajo no deben duplicar la mecánica de `NO_REPLY`.
    - Los grupos donde se permiten respuestas silenciosas automáticas tratan los turnos limpios vacíos o solo de razonamiento del modelo como silenciosos, equivalentes a `NO_REPLY`. Los chats directos nunca reciben orientación `NO_REPLY`, y las respuestas de grupo solo con herramienta de mensajes permanecen silenciosas al no llamar a `message(action=send)`.
    - La conversación ambiental siempre activa de grupo usa semántica de solicitud de usuario de forma predeterminada. Establece `messages.groupChat.unmentionedInbound: "room_event"` para enviarla como contexto silencioso en su lugar. Consulta [Eventos ambientales de sala](/es/channels/ambient-room-events) para ver ejemplos de configuración.
    - Los eventos de sala no se almacenan como solicitudes de usuario falsas, y el texto privado del asistente de eventos de sala sin herramienta de mensajes no se reproduce como historial de chat.
    - Los valores predeterminados de Discord viven en `channels.discord.guilds."*"` (se pueden anular por gremio/canal).
    - El contexto de historial de grupo se envuelve uniformemente entre canales. Los grupos con control por menciones conservan los mensajes omitidos pendientes; los grupos siempre activos también pueden retener mensajes de sala procesados recientes cuando el canal lo admite. Usa `messages.groupChat.historyLimit` para el valor predeterminado global y `channels.<channel>.historyLimit` (o `channels.<channel>.accounts.*.historyLimit`) para anulaciones. Establece `0` para deshabilitar.

  </Accordion>
</AccordionGroup>

## Restricciones de herramientas de grupo/canal (opcional)

Algunas configuraciones de canal admiten restringir qué herramientas están disponibles **dentro de un grupo/sala/canal específico**.

- `tools`: permite/deniega herramientas para todo el grupo (`allow`, `alsoAllow`, `deny`; la denegación prevalece).
- `toolsBySender`: anulaciones por remitente dentro del grupo. Usa prefijos de clave explícitos: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` y el comodín `"*"`. Los ids de canal usan ids canónicos de canal de OpenClaw; los alias como `teams` se normalizan a `msteams`. Las claves heredadas sin prefijo aún se aceptan, coinciden solo como `id:` y registran una advertencia de obsolescencia.

Orden de resolución (gana el más específico):

<Steps>
  <Step title="Group toolsBySender">
    Coincidencia de `toolsBySender` de grupo/canal.
  </Step>
  <Step title="Group tools">
    `tools` de grupo/canal.
  </Step>
  <Step title="Default toolsBySender">
    Coincidencia de `toolsBySender` predeterminada (`"*"`).
  </Step>
  <Step title="Default tools">
    `tools` predeterminado (`"*"`).
  </Step>
</Steps>

Ejemplo (Telegram):

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { tools: { deny: ["exec"] } },
        "-1001234567890": {
          tools: { deny: ["exec", "read", "write"] },
          toolsBySender: {
            "id:123456789": { alsoAllow: ["exec"] },
          },
        },
      },
    },
  },
}
```

<Note>
Las restricciones de herramientas de grupo/canal se aplican además de la política global/de agente de herramientas (la denegación sigue prevaleciendo). Algunos canales usan una anidación diferente para salas/canales (por ejemplo, Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Listas de permitidos de grupo

Cuando `channels.whatsapp.groups`, `channels.telegram.groups` o `channels.imessage.groups` está configurado, las claves actúan como una lista de permitidos de grupo. Usa `"*"` para permitir todos los grupos y seguir definiendo el comportamiento predeterminado de menciones.

<Warning>
Confusión común: la aprobación de emparejamiento por DM no es lo mismo que la autorización de grupo. Para los canales que admiten emparejamiento por DM, el almacén de emparejamiento desbloquea solo los DM. Los comandos de grupo siguen requiriendo una autorización explícita del remitente del grupo desde listas de permitidos de configuración como `groupAllowFrom` o el respaldo de configuración documentado para ese canal.
</Warning>

Intenciones comunes (copiar/pegar):

<Tabs>
  <Tab title="Desactivar todas las respuestas de grupo">
    ```json5
    {
      channels: { whatsapp: { groupPolicy: "disabled" } },
    }
    ```
  </Tab>
  <Tab title="Permitir solo grupos específicos (WhatsApp)">
    ```json5
    {
      channels: {
        whatsapp: {
          groups: {
            "123@g.us": { requireMention: true },
            "456@g.us": { requireMention: false },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Permitir todos los grupos pero requerir mención">
    ```json5
    {
      channels: {
        whatsapp: {
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Activadores solo para el propietario (WhatsApp)">
    ```json5
    {
      channels: {
        whatsapp: {
          groupPolicy: "allowlist",
          groupAllowFrom: ["+15551234567"],
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```
  </Tab>
</Tabs>

## Activación (solo propietario)

Los propietarios de grupos pueden alternar la activación por grupo con un mensaje independiente:

- `/activation mention`
- `/activation always`

`/activation` es un comando del núcleo restringido al propietario y solo se aplica en chats grupales. Propietario significa que el remitente coincide con `allowFrom` / `commands.ownerAllowFrom` del canal (cuando no hay ninguna lista de permitidos configurada, el id propio de la cuenta cuenta como propietario). El modo almacenado anula el `requireMention` de ese grupo en los canales que lo consultan (Google Chat, QQBot, Telegram, WhatsApp), y la introducción del prompt del sistema del grupo refleja el modo activo en todas partes.

## Campos de contexto

Las cargas de entrada de grupo establecen:

- `ChatType=group`
- `GroupSubject` (si se conoce)
- `GroupMembers` (si se conoce)
- `WasMentioned` (resultado de la compuerta por mención)
- Los temas de foro de Telegram también incluyen `MessageThreadId` e `IsForum`.

El prompt del sistema del agente incluye una introducción de grupo en el primer turno de una nueva sesión de grupo (y después de cambios de `/activation`). Le recuerda al modelo que responda como una persona, minimice las líneas vacías y siga el espaciado normal de chat, y evite escribir secuencias literales `\n`. Los grupos que no son de Telegram también desaconsejan las tablas de Markdown; la guía de texto enriquecido de Telegram proviene del prompt del canal Telegram. Los nombres de grupo y las etiquetas de participantes provenientes del canal se representan como metadatos no confiables en bloques delimitados, no como instrucciones del sistema en línea.

## Especificidades de iMessage

- Prefiere `chat_id:<id>` al enrutar o incluir en listas de permitidos.
- Listar chats: `imsg chats --limit 20`.
- Las respuestas de grupo siempre vuelven al mismo `chat_id`.

## Prompts del sistema de WhatsApp

Consulta [WhatsApp](/es/channels/whatsapp#system-prompts) para ver las reglas canónicas del prompt del sistema de WhatsApp, incluida la resolución de prompts grupales y directos, el comportamiento de comodines y la semántica de anulación de cuenta.

## Especificidades de WhatsApp

Consulta [Mensajes de grupo](/es/channels/group-messages) para el comportamiento exclusivo de WhatsApp (inyección de historial, detalles de manejo de menciones).

## Relacionado

- [Grupos de difusión](/es/channels/broadcast-groups)
- [Enrutamiento de canales](/es/channels/channel-routing)
- [Mensajes de grupo](/es/channels/group-messages)
- [Emparejamiento](/es/channels/pairing)
