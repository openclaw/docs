---
read_when:
    - Cambiar el comportamiento del chat grupal o el filtrado por menciones
    - Limitar mentionPatterns a conversaciones grupales específicas
sidebarTitle: Groups
summary: Comportamiento de los chats grupales en las distintas plataformas (Discord/iMessage/Matrix/Microsoft Teams/QQBot/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Grupos
x-i18n:
    generated_at: "2026-07-11T22:54:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b19356e801e0b44c8409b1eef59a32357977104d46a138934757c4e8a00ed44c
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw aplica las mismas reglas de grupo en todos los canales compatibles con grupos, incluidos Discord, iMessage, Matrix, Microsoft Teams, QQBot, Signal, Slack, Telegram, WhatsApp y Zalo.

Para las salas siempre activas que deban proporcionar contexto silencioso salvo que el agente envíe explícitamente un mensaje visible, consulta [Eventos de salas ambientales](/es/channels/ambient-room-events).

## Introducción para principiantes (2 minutos)

OpenClaw «vive» en tus propias cuentas de mensajería. No existe un usuario de bot de WhatsApp independiente: si **tú** estás en un grupo, OpenClaw puede ver ese grupo y responder allí.

Comportamiento predeterminado:

- Los grupos están restringidos (`groupPolicy: "allowlist"`); los remitentes del grupo se bloquean hasta que se añaden a la lista de permitidos.
- Las respuestas requieren una mención, salvo que desactives el requisito de mención para un grupo.
- El texto de la respuesta final se publica automáticamente en la sala (`visibleReplies: "automatic"`).

En otras palabras: los remitentes incluidos en la lista de permitidos pueden activar OpenClaw mencionándolo.

<Note>
**En resumen**

- **El acceso a mensajes directos** se controla mediante `*.allowFrom`.
- **El acceso a grupos** se controla mediante `*.groupPolicy` y las listas de permitidos (`*.groups`, `*.groupAllowFrom`).
- **La activación de respuestas** se controla mediante el requisito de mención (`requireMention`, `/activation`).

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

Para las solicitudes normales de grupos o canales, OpenClaw usa de forma predeterminada `messages.groupChat.visibleReplies: "automatic"`: el texto final del asistente se publica en la sala como respuesta visible.

Usa `messages.groupChat.visibleReplies: "message_tool"` cuando quieras que, en una sala compartida, el agente decida cuándo intervenir llamando a `message(action=send)`. Esto funciona mejor con modelos que usan herramientas de forma fiable (por ejemplo, GPT-5.6 Sol). Si el modelo no usa la herramienta y devuelve texto final sustancial, OpenClaw mantiene ese texto privado en lugar de publicarlo en la sala.

Usa `"automatic"` con modelos o entornos de ejecución que no sigan de forma fiable la entrega exclusivamente mediante herramientas: los textos finales normales se publican directamente en la sala y el agente aún puede llamar a `message(action=send)` para enviar archivos, imágenes u otros adjuntos que no puedan acompañar al texto final.

Si la herramienta de mensajes no está disponible según la política de herramientas activa, OpenClaw recurre a respuestas visibles automáticas en lugar de suprimir silenciosamente la respuesta. `openclaw doctor` advierte de esta incompatibilidad.

Para los chats directos y cualquier otro evento de origen, `messages.visibleReplies: "message_tool"` aplica globalmente el mismo comportamiento exclusivamente mediante herramientas; `messages.groupChat.visibleReplies` sigue siendo la configuración más específica para las salas de grupos o canales. Los turnos directos del WebChat interno usan de forma predeterminada la entrega automática de la respuesta final, para que Pi y Codex reciban el mismo contrato de respuestas visibles.

El modo exclusivamente mediante herramientas sustituye al patrón anterior de obligar al modelo a responder `NO_REPLY` en la mayoría de los turnos en modo de observación. En este modo, el prompt no define un contrato `NO_REPLY`; no mostrar nada simplemente significa no llamar a la herramienta de mensajes.

Las vinculaciones de conversaciones gestionadas por un Plugin son la excepción. Cuando un Plugin vincula un hilo y asume el turno entrante, la respuesta que devuelve el Plugin es la respuesta visible de la vinculación; no necesita `message(action=send)`. Esa respuesta es la salida del entorno de ejecución del Plugin, no texto final privado del modelo.

Los indicadores de escritura se siguen enviando para las solicitudes directas de grupos. Cuando están habilitados, los eventos ambientales de salas siempre activas permanecen estrictos y silenciosos, salvo que el agente llame a la herramienta de mensajes.

De forma predeterminada, las sesiones suprimen los resúmenes detallados de herramientas y progreso. Usa `/verbose on` (o `/verbose full`) para mostrarlos en la sesión actual durante la depuración y `/verbose off` para volver al comportamiento que solo muestra la respuesta final. El estado detallado es específico de cada sesión y funciona igual en chats directos, grupos, canales y temas de foros.

Para enviar las conversaciones no mencionadas de grupos siempre activos como contexto silencioso de la sala en lugar de solicitudes de usuario, usa [Eventos de salas ambientales](/es/channels/ambient-room-events):

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
    },
  },
}
```

El valor predeterminado es `unmentionedInbound: "user_request"`. Los mensajes con menciones, los comandos, las solicitudes de interrupción y los mensajes directos siguen siendo solicitudes de usuario.

Para exigir que la salida visible de las solicitudes de grupos o canales pase por la herramienta de mensajes:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "message_tool",
    },
  },
}
```

Para exigirlo en todos los chats de origen:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

El Gateway detecta los cambios en la configuración de `messages` sin necesidad de reiniciarse después de guardar el archivo. Reinícialo solo cuando la recarga de configuración esté desactivada (`gateway.reload.mode: "off"`).

Los turnos de comandos omiten `visibleReplies: "message_tool"` y siempre responden de forma visible: tanto los comandos de barra nativos (Discord, Telegram y otras superficies compatibles con comandos nativos) como los comandos de texto `/...` autorizados publican su respuesta en el chat de origen. Los turnos de texto `/...` no autorizados en grupos siguen usando exclusivamente la herramienta de mensajes; los turnos de conversación normales siguen la configuración predeterminada.

## Visibilidad del contexto y listas de permitidos

La seguridad de los grupos implica dos controles diferentes:

- **Autorización de activación**: quién puede activar el agente (`groupPolicy`, `groups`, `groupAllowFrom` y listas de permitidos específicas del canal).
- **Visibilidad del contexto**: qué contexto complementario se introduce en el modelo (texto de respuestas o citas, historial del hilo y metadatos reenviados).

De forma predeterminada, OpenClaw conserva el contexto tal como se recibe: las listas de permitidos deciden quién puede activar acciones, no qué fragmentos citados o históricos ve el modelo. Para filtrar también el contexto complementario, configura `contextVisibility`:

| Modo                | Comportamiento                                                                                       |
| ------------------- | ---------------------------------------------------------------------------------------------------- |
| `"all"` (predeterminado) | Conserva el contexto complementario tal como se recibe.                                         |
| `"allowlist"`       | Solo introduce contexto de historial, hilo, cita o reenvío procedente de remitentes permitidos.      |
| `"allowlist_quote"` | Igual que `allowlist`, pero conserva además el mensaje citado explícitamente o al que se responde, independientemente del remitente. |

Configúralo por canal (`channels.<channel>.contextVisibility`), por cuenta (`channels.<channel>.accounts.<accountId>.contextVisibility`) o globalmente (`channels.defaults.contextVisibility`). Los canales que obtienen contexto complementario (Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram y WhatsApp) aplican la política al crear el contexto entrante; las combinaciones de políticas desconocidas adoptan un comportamiento restrictivo y omiten el contexto.

![Flujo de mensajes de grupo](/images/groups-flow.svg)

Si quieres...

| Objetivo                                               | Configuración                                               |
| ------------------------------------------------------ | ----------------------------------------------------------- |
| Permitir todos los grupos, pero responder solo a menciones con @ | `groups: { "*": { requireMention: true } }`       |
| Desactivar todas las respuestas de grupos              | `groupPolicy: "disabled"`                                   |
| Permitir solo grupos específicos                       | `groups: { "<group-id>": { ... } }` (sin la clave `"*"`)    |
| Que solo tú puedas activar el agente en grupos          | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]`  |
| Reutilizar un conjunto de remitentes de confianza en varios canales | `groupAllowFrom: ["accessGroup:operators"]`       |

Para conocer las listas reutilizables de remitentes permitidos, consulta [Grupos de acceso](/es/channels/access-groups).

## Claves de sesión

- Las sesiones de grupo usan claves de sesión `agent:<agentId>:<channel>:group:<id>` (las salas y los canales usan `agent:<agentId>:<channel>:channel:<id>`).
- Los temas de foros de Telegram añaden `:topic:<threadId>` al identificador del grupo, de modo que cada tema tenga su propia sesión.
- Los chats directos usan la sesión principal (o sesiones por remitente si se configura `session.dmScope`).
- Los Heartbeats se ejecutan en la sesión de Heartbeat configurada (de forma predeterminada, la sesión principal del agente); las sesiones de grupo no ejecutan sus propios Heartbeats.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Patrón: mensajes directos personales y grupos públicos (un solo agente)

Sí: esto funciona bien si el tráfico «personal» son **mensajes directos** y el tráfico «público» son **grupos**.

El motivo es que, en el modo de un solo agente, los mensajes directos suelen llegar a la clave de sesión **principal** (`agent:main:main`), mientras que los grupos siempre usan claves de sesión **no principales** (`agent:main:<channel>:group:<id>`). Si habilitas el aislamiento con `mode: "non-main"`, esas sesiones de grupo se ejecutan en el entorno de aislamiento configurado, mientras que la sesión principal de mensajes directos permanece en el host. Docker es el entorno predeterminado si no eliges otro.

Esto proporciona un único «cerebro» de agente (espacio de trabajo y memoria compartidos), pero dos modalidades de ejecución:

- **Mensajes directos**: herramientas completas (host)
- **Grupos**: entorno aislado y herramientas restringidas

<Note>
Si necesitas espacios de trabajo o perfiles realmente independientes (lo «personal» y lo «público» nunca deben mezclarse), usa un segundo agente y vinculaciones. Consulta [Enrutamiento multiagente](/es/concepts/multi-agent).
</Note>

<Tabs>
  <Tab title="Mensajes directos en el host, grupos aislados">
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
  <Tab title="Los grupos solo ven una carpeta incluida en la lista de permitidos">
    ¿Quieres que «los grupos solo puedan ver la carpeta X» en lugar de que «no tengan acceso al host»? Mantén `workspaceAccess: "none"` y monta en el entorno aislado únicamente las rutas incluidas en la lista de permitidos:

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

Contenido relacionado:

- Claves de configuración y valores predeterminados: [Configuración del Gateway](/es/gateway/config-agents#agentsdefaultssandbox)
- Depuración de los motivos por los que se bloquea una herramienta: [Entorno aislado frente a política de herramientas y acceso elevado](/es/gateway/sandbox-vs-tool-policy-vs-elevated)
- Detalles de los montajes vinculados: [Aislamiento](/es/gateway/sandboxing#custom-bind-mounts)

## Etiquetas de visualización

- Las etiquetas de la interfaz usan `displayName` cuando está disponible, con el formato `<channel>:<token>`.
- `#room` está reservado para salas y canales; los chats de grupo usan `g-<slug>` (minúsculas, espacios -> `-`, se conservan `#@+._-`). Los identificadores opacos muy largos se acortan para formar un token estable, en lugar de exponer identificadores de ruta completos en la interfaz.

## Política de grupos

Controla cómo se gestionan los mensajes de grupos y salas en cada canal:

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

| Política      | Comportamiento                                                            |
| ------------- | ------------------------------------------------------------------------- |
| `"open"`      | Los grupos omiten las listas de permitidos; el control por menciones sigue aplicándose. |
| `"disabled"`  | Bloquea por completo todos los mensajes de grupo.                         |
| `"allowlist"` | Solo permite los grupos o salas que coincidan con la lista de permitidos configurada. |

<AccordionGroup>
  <Accordion title="Notas por canal">
    - `groupPolicy` es independiente del control por menciones (que requiere @menciones).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: usa `groupAllowFrom` (alternativa: `allowFrom` explícito).
    - Signal: `groupAllowFrom` puede coincidir con el id del grupo de Signal entrante o con el teléfono/UUID del remitente.
    - Las aprobaciones de vinculación de mensajes directos (entradas del almacén `*-allowFrom`) solo se aplican al acceso por mensaje directo; la autorización de remitentes en grupos sigue definiéndose explícitamente mediante las listas de permitidos de grupos.
    - Discord: la lista de permitidos usa `channels.discord.guilds.<id>.channels`.
    - Slack: la lista de permitidos usa `channels.slack.channels`.
    - Matrix: la lista de permitidos usa `channels.matrix.groups`. Usa identificadores de sala (`!room:server`) o alias (`#alias:server`); las claves basadas en nombres de sala solo coinciden con `channels.matrix.dangerouslyAllowNameMatching: true`, y las entradas sin resolver se ignoran durante la ejecución. Usa `channels.matrix.groupAllowFrom` para restringir remitentes; también se admiten listas de permitidos `users` por sala.
    - Los mensajes directos grupales se controlan por separado (`channels.discord.dm.*`, `channels.slack.dm.*`: `groupEnabled`, `groupChannels`).
    - Telegram: las listas de remitentes permitidos solo aceptan identificadores numéricos de usuario (`"123456789"`; los prefijos `telegram:`/`tg:` se eliminan sin distinguir mayúsculas de minúsculas). Las entradas `@username` no coinciden durante la ejecución y registran una advertencia; la configuración resuelve `@username` a identificadores. Los identificadores negativos de chat deben incluirse en `channels.telegram.groups`, no en las listas de remitentes permitidos.
    - El valor predeterminado es `groupPolicy: "allowlist"`; si la lista de grupos permitidos está vacía, los mensajes de grupo se bloquean.
    - Seguridad durante la ejecución: cuando falta por completo un bloque de proveedor (`channels.<provider>` no existe), la política de grupos adopta de forma segura `allowlist` en lugar de heredar `channels.defaults.groupPolicy`, y el Gateway registra esta alternativa una vez por cuenta.

  </Accordion>
</AccordionGroup>

Modelo mental rápido (orden de evaluación de los mensajes de grupo):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (abierto/deshabilitado/lista de permitidos).
  </Step>
  <Step title="Listas de grupos permitidos">
    Listas de grupos permitidos (`*.groups`, `*.groupAllowFrom`, lista de permitidos específica del canal).
  </Step>
  <Step title="Control por menciones">
    Control por menciones (`requireMention`, `/activation`).
  </Step>
</Steps>

## Control por menciones (predeterminado)

Los mensajes de grupo requieren una mención, salvo que se sobrescriba este comportamiento para cada grupo. Los valores predeterminados se encuentran en cada subsistema, bajo `*.groups."*"`.

Responder a un mensaje del bot cuenta como una mención implícita cuando el canal proporciona metadatos de respuesta; citar un mensaje del bot también puede contar en los canales que proporcionan metadatos de cita. Casos integrados actuales: Discord, Microsoft Teams, QQBot, Slack, Telegram, WhatsApp y Zalo personal.

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

## Patrones de mención configurados por ámbito

Los `mentionPatterns` configurados son activadores alternativos mediante expresiones regulares. Úsalos cuando la plataforma no proporcione una mención nativa al bot o cuando un texto sin formato como `openclaw:` deba contar como mención. Las menciones nativas de la plataforma son independientes: cuando Discord, Slack, Telegram, Matrix u otro canal puede demostrar que el mensaje mencionó explícitamente al bot, esa mención nativa sigue activándolo incluso donde se rechacen los patrones de expresiones regulares configurados.

De forma predeterminada, los patrones de mención configurados se aplican en todos los lugares donde el canal proporciona datos del proveedor y de la conversación al mecanismo de detección de menciones. Para evitar que patrones amplios activen al agente en todos los grupos, delimítalos por canal mediante `channels.<channel>.mentionPatterns`.

Usa `mode: "deny"` cuando los patrones de mención mediante expresiones regulares deban estar desactivados de forma predeterminada para un canal y, a continuación, habilítalos en salas concretas mediante `allowIn`:

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

Usa el valor predeterminado `mode: "allow"` (u omite `mode`) cuando los patrones de mención mediante expresiones regulares deban aplicarse de forma general y, a continuación, desactívalos en salas ruidosas mediante `denyIn`:

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

| Campo           | Efecto                                                                                                                                    |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `mode: "allow"` | Los patrones de mención mediante expresiones regulares están habilitados salvo que el identificador de la conversación esté en `denyIn`. Este es el valor predeterminado. |
| `mode: "deny"`  | Los patrones de mención mediante expresiones regulares están deshabilitados salvo que el identificador de la conversación esté en `allowIn`. |
| `allowIn`       | Identificadores de conversaciones donde los patrones de mención mediante expresiones regulares están habilitados en el modo de denegación. |
| `denyIn`        | Identificadores de conversaciones donde los patrones de mención mediante expresiones regulares están deshabilitados. `denyIn` prevalece sobre `allowIn` si ambos incluyen el mismo identificador. |

Política de expresiones regulares delimitada que se admite actualmente:

| Canal     | Identificadores usados en `allowIn` / `denyIn`                    |
| --------- | ----------------------------------------------------------------- |
| Discord   | Identificadores de canales de Discord.                            |
| Matrix    | Identificadores de salas de Matrix.                               |
| Slack     | Identificadores de canales de Slack.                              |
| Telegram  | Identificadores de chats grupales o `chatId:topic:threadId` para temas de foros. |
| WhatsApp  | Identificadores de conversaciones de WhatsApp, como `123@g.us`.   |

Las configuraciones de canal a nivel de cuenta pueden definir la misma política en `channels.<channel>.accounts.<accountId>.mentionPatterns` cuando ese canal admita varias cuentas. La política de la cuenta tiene prioridad sobre la política de nivel superior del canal para esa cuenta.

<AccordionGroup>
  <Accordion title="Notas sobre el control por menciones">
    - Los `mentionPatterns` son patrones seguros de expresiones regulares que no distinguen mayúsculas de minúsculas; los patrones no válidos y las formas inseguras con repeticiones anidadas se ignoran (con una advertencia).
    - Prioridad de patrones: `agents.list[].groupChat.mentionPatterns` (útil cuando varios agentes comparten un grupo) sobrescribe `messages.groupChat.mentionPatterns`; cuando no se define ninguno, los patrones se derivan del nombre o emoji de identidad del agente.
    - El control por menciones solo se aplica cuando es posible detectarlas (hay menciones nativas o se han configurado `mentionPatterns`).
    - Incluir un grupo o remitente en una lista de permitidos no desactiva el control por menciones; establece `requireMention` en `false` para ese grupo cuando todos los mensajes deban activar al agente.
    - El contexto automático de la instrucción de chat grupal incluye en cada turno la instrucción resuelta de respuesta silenciosa; los archivos del espacio de trabajo no deben duplicar la mecánica de `NO_REPLY`.
    - Los grupos donde se permiten respuestas silenciosas automáticas tratan los turnos del modelo que estén vacíos o solo contengan razonamiento como silenciosos, de forma equivalente a `NO_REPLY`. Los chats directos nunca reciben instrucciones de `NO_REPLY`, y las respuestas grupales que solo usan la herramienta de mensajes permanecen en silencio al no llamar a `message(action=send)`.
    - La conversación ambiental permanente de un grupo usa de forma predeterminada la semántica de una solicitud del usuario. Establece `messages.groupChat.unmentionedInbound: "room_event"` para enviarla como contexto silencioso. Consulta [Eventos ambientales de sala](/es/channels/ambient-room-events) para ver ejemplos de configuración.
    - Los eventos de sala no se almacenan como solicitudes de usuario falsas, y el texto privado del asistente procedente de eventos de sala sin herramienta de mensajes no se reproduce como historial del chat.
    - Los valores predeterminados de Discord se encuentran en `channels.discord.guilds."*"` (se pueden sobrescribir por servidor/canal).
    - El contexto del historial de grupos se estructura de manera uniforme en todos los canales. Los grupos controlados por menciones conservan los mensajes pendientes omitidos; los grupos siempre activos también pueden conservar mensajes recientes ya procesados de la sala cuando el canal lo permita. Usa `messages.groupChat.historyLimit` como valor predeterminado global y `channels.<channel>.historyLimit` (o `channels.<channel>.accounts.*.historyLimit`) para sobrescribirlo. Establece `0` para deshabilitarlo.

  </Accordion>
</AccordionGroup>

## Restricciones de herramientas por grupo/canal (opcionales)

Algunas configuraciones de canales permiten restringir qué herramientas están disponibles **dentro de un grupo, sala o canal específico**.

- `tools`: permite o deniega herramientas para todo el grupo (`allow`, `alsoAllow`, `deny`; la denegación prevalece).
- `toolsBySender`: sobrescrituras por remitente dentro del grupo. Usa prefijos de clave explícitos: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` y el comodín `"*"`. Los identificadores de canal usan los identificadores canónicos de canales de OpenClaw; los alias como `teams` se normalizan a `msteams`. Las claves heredadas sin prefijo siguen siendo compatibles, solo se comparan como `id:` y registran una advertencia de obsolescencia.

Orden de resolución (prevalece el más específico):

<Steps>
  <Step title="toolsBySender del grupo">
    Coincidencia de `toolsBySender` del grupo/canal.
  </Step>
  <Step title="tools del grupo">
    `tools` del grupo/canal.
  </Step>
  <Step title="toolsBySender predeterminado">
    Coincidencia de `toolsBySender` predeterminado (`"*"`).
  </Step>
  <Step title="tools predeterminado">
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
Las restricciones de herramientas de grupos/canales se aplican además de la política global o del agente para las herramientas (la denegación sigue prevaleciendo). Algunos canales usan una estructura diferente para salas o canales (por ejemplo, Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Listas de grupos permitidos

Cuando se configura `channels.whatsapp.groups`, `channels.telegram.groups` o `channels.imessage.groups`, las claves funcionan como una lista de grupos permitidos. Usa `"*"` para permitir todos los grupos y seguir definiendo el comportamiento predeterminado de las menciones.

<Warning>
Confusión habitual: la aprobación del emparejamiento por MD no equivale a la autorización de grupos. En los canales que admiten emparejamiento por MD, el almacén de emparejamientos solo habilita los MD. Los comandos de grupo siguen requiriendo la autorización explícita del remitente del grupo mediante listas de permitidos de la configuración, como `groupAllowFrom`, o el mecanismo alternativo de configuración documentado para ese canal.
</Warning>

Intenciones habituales (copiar y pegar):

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
  <Tab title="Permitir todos los grupos, pero exigir una mención">
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
  <Tab title="Activadores exclusivos del propietario (WhatsApp)">
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

## Activación (solo para el propietario)

Los propietarios de grupos pueden alternar la activación de cada grupo mediante un mensaje independiente:

- `/activation mention`
- `/activation always`

`/activation` es un comando central restringido al propietario y solo se aplica en chats de grupo. El propietario es el remitente que coincide con `allowFrom` / `commands.ownerAllowFrom` del canal (cuando no se configura ninguna lista de permitidos, el identificador propio de la cuenta cuenta como propietario). El modo almacenado reemplaza el valor de `requireMention` de ese grupo en los canales que lo consultan (Google Chat, QQBot, Telegram y WhatsApp), y la introducción del prompt del sistema del grupo refleja el modo activo en todos los canales.

## Campos de contexto

Las cargas útiles entrantes de grupos establecen:

- `ChatType=group`
- `GroupSubject` (si se conoce)
- `GroupMembers` (si se conocen)
- `WasMentioned` (resultado del control por mención)
- Los temas de foros de Telegram también incluyen `MessageThreadId` e `IsForum`.

El prompt del sistema del agente incluye una introducción para grupos en el primer turno de una nueva sesión de grupo (y después de cambios realizados con `/activation`). Esta recuerda al modelo que debe responder como una persona, reducir al mínimo las líneas vacías, seguir el espaciado habitual de los chats y evitar escribir secuencias literales `\n`. En los grupos que no son de Telegram también se desaconsejan las tablas Markdown; las directrices de texto enriquecido de Telegram proceden del prompt del canal de Telegram. Los nombres de grupos y las etiquetas de participantes procedentes del canal se representan como metadatos no confiables delimitados por bloques, no como instrucciones del sistema insertadas en línea.

## Particularidades de iMessage

- Se recomienda usar `chat_id:<id>` para el enrutamiento o las listas de permitidos.
- Listar chats: `imsg chats --limit 20`.
- Las respuestas de grupo siempre se envían al mismo `chat_id`.

## Prompts del sistema de WhatsApp

Consulta [WhatsApp](/es/channels/whatsapp#system-prompts) para conocer las reglas canónicas de los prompts del sistema de WhatsApp, incluida la resolución de prompts de grupo y directos, el comportamiento de los comodines y la semántica de reemplazo por cuenta.

## Particularidades de WhatsApp

Consulta [Mensajes de grupo](/es/channels/group-messages) para conocer el comportamiento exclusivo de WhatsApp (inyección del historial y detalles del tratamiento de menciones).

## Temas relacionados

- [Grupos de difusión](/es/channels/broadcast-groups)
- [Enrutamiento de canales](/es/channels/channel-routing)
- [Mensajes de grupo](/es/channels/group-messages)
- [Emparejamiento](/es/channels/pairing)
