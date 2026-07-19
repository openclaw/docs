---
read_when:
    - Cambiar el comportamiento del chat grupal o el control de menciones
    - Limitar mentionPatterns a conversaciones de grupo específicas
sidebarTitle: Groups
summary: Comportamiento de los chats grupales en todas las plataformas (Discord/iMessage/Matrix/Microsoft Teams/QQBot/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Grupos
x-i18n:
    generated_at: "2026-07-19T01:46:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f493f5737c147c097c666f1f13fb612232be6dc1ace51e910d437b02e960ec52
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw aplica las mismas reglas de grupo en todos los canales compatibles con grupos, incluidos Discord, iMessage, Matrix, Microsoft Teams, QQBot, Signal, Slack, Telegram, WhatsApp y Zalo.

Para salas siempre activas que deban proporcionar contexto silencioso a menos que el agente envíe explícitamente un mensaje visible, consulte [Eventos de sala ambientales](/es/channels/ambient-room-events).

## Introducción para principiantes (2 minutos)

OpenClaw «reside» en sus propias cuentas de mensajería. No existe un usuario de bot de WhatsApp independiente: si **usted** está en un grupo, OpenClaw puede ver ese grupo y responder allí.

Comportamiento predeterminado:

- Los grupos están restringidos (`groupPolicy: "allowlist"`); los remitentes de los grupos están bloqueados hasta que se añaden a la lista de permitidos.
- Las respuestas requieren una mención, a menos que se desactive el requisito de mención para un grupo.
- El texto de la respuesta final se publica automáticamente en la sala (`visibleReplies: "automatic"`).

En otras palabras: los remitentes incluidos en la lista de permitidos pueden activar OpenClaw mencionándolo.

<Note>
**Resumen**

- El **acceso a mensajes directos** está controlado por `*.allowFrom`.
- El **acceso a grupos** está controlado por `*.groupPolicy` + listas de permitidos (`*.groups`, `*.groupAllowFrom`).
- La **activación de respuestas** está controlada por el requisito de mención (`requireMention`, `/activation`).

</Note>

Flujo rápido (qué ocurre con un mensaje de grupo):

```text
¿groupPolicy? disabled -> descartar
¿groupPolicy? allowlist -> ¿grupo permitido? no -> descartar
¿requireMention? yes -> ¿se mencionó? no -> almacenar solo como contexto
mención/respuesta/comando/mensaje directo -> solicitud del usuario
conversación de grupo siempre activa -> solicitud del usuario o evento de sala cuando está configurado
```

## Respuestas visibles

Para solicitudes normales de grupos o canales, OpenClaw utiliza de forma predeterminada `messages.groupChat.visibleReplies: "automatic"`: el texto final del asistente se publica en la sala como respuesta visible.

Utilice `messages.groupChat.visibleReplies: "message_tool"` cuando una sala compartida deba permitir que el agente decida cuándo intervenir llamando a `message(action=send)`. Esto funciona mejor con modelos que utilizan herramientas de forma fiable (por ejemplo, GPT-5.6 Sol). Si el modelo omite la herramienta y devuelve texto final sustancial, OpenClaw mantiene ese texto privado en lugar de publicarlo en la sala.

Utilice `"automatic"` para modelos o entornos de ejecución que no sigan de forma fiable la entrega exclusiva mediante herramientas: el texto final normal se publica directamente en la sala y el agente aún puede llamar a `message(action=send)` para enviar archivos, imágenes u otros adjuntos que no puedan incluirse junto con el texto final.

Si la herramienta de mensajes no está disponible según la política de herramientas activa, OpenClaw recurre a respuestas visibles automáticas en lugar de suprimir silenciosamente la respuesta. `openclaw doctor` advierte sobre esta incompatibilidad.

Para chats directos y cualquier otro evento de origen, `messages.visibleReplies: "message_tool"` aplica globalmente el mismo comportamiento exclusivo mediante herramientas; `messages.groupChat.visibleReplies` sigue siendo la anulación más específica para salas de grupos o canales. Los turnos directos de WebChat interno utilizan de forma predeterminada la entrega automática de la respuesta final para que Pi y Codex reciban el mismo contrato de respuesta visible.

El modo exclusivo mediante herramientas sustituye el patrón anterior de obligar al modelo a responder `NO_REPLY` en la mayoría de los turnos en modo de observación. En el modo exclusivo mediante herramientas, el prompt no define un contrato `NO_REPLY`; no hacer nada visible simplemente significa no llamar a la herramienta de mensajes.

Las vinculaciones de conversaciones gestionadas por plugins son la excepción. Una vez que un plugin vincula un hilo y reclama el turno entrante, la respuesta devuelta por el plugin es la respuesta visible de la vinculación; no necesita `message(action=send)`. Esa respuesta es una salida del entorno de ejecución del plugin, no texto final privado del modelo.

Los indicadores de escritura siguen enviándose para solicitudes directas de grupos. Los eventos ambientales de salas siempre activas, cuando están habilitados, permanecen estrictos y silenciosos a menos que el agente llame a la herramienta de mensajes.

Las sesiones suprimen de forma predeterminada los resúmenes detallados de herramientas y progreso. Utilice `/verbose on` (o `/verbose full`) para mostrarlos en la sesión actual durante la depuración y `/verbose off` para volver al comportamiento de mostrar solo la respuesta final. El estado detallado es específico de cada sesión y funciona de la misma manera en chats directos, grupos, canales y temas de foros.

Para enviar conversaciones de grupos siempre activos sin menciones como contexto silencioso de la sala en lugar de solicitudes del usuario, utilice [Eventos de sala ambientales](/es/channels/ambient-room-events):

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
    },
  },
}
```

El valor predeterminado es `unmentionedInbound: "user_request"`. Los mensajes con menciones, los comandos, las solicitudes de interrupción y los mensajes directos siguen siendo solicitudes del usuario.

Para exigir que la salida visible pase por la herramienta de mensajes en las solicitudes de grupos o canales:

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

El Gateway detecta los cambios de configuración de `messages` sin reiniciarse después de guardar el archivo. Reinicie únicamente cuando la recarga de configuración esté deshabilitada (`gateway.reload.mode: "off"`).

Los turnos de comandos omiten `visibleReplies: "message_tool"` y siempre responden de forma visible: tanto los comandos de barra diagonales nativos (Discord, Telegram y otras interfaces compatibles con comandos nativos) como los comandos de texto `/...` autorizados publican su respuesta en el chat de origen. Los turnos de texto `/...` no autorizados en grupos siguen siendo exclusivos mediante la herramienta de mensajes; los turnos de chat normales siguen el valor predeterminado configurado.

## Visibilidad del contexto y listas de permitidos

La seguridad de los grupos implica dos controles diferentes:

- **Autorización de activación**: quién puede activar al agente (`groupPolicy`, `groups`, `groupAllowFrom`, listas de permitidos específicas del canal).
- **Visibilidad del contexto**: qué contexto complementario se introduce en el modelo (texto de respuestas/citas, historial del hilo, metadatos reenviados).

De forma predeterminada, OpenClaw conserva el contexto tal como se recibe: las listas de permitidos determinan quién puede activar acciones, no qué fragmentos citados o históricos ve el modelo. Para filtrar también el contexto complementario, configure `contextVisibility`:

| Modo                | Comportamiento                                                                         |
| ------------------- | -------------------------------------------------------------------------------- |
| `"all"` (predeterminado)   | Conserva el contexto complementario tal como se recibe.                                           |
| `"allowlist"`       | Solo introduce contexto de historial/hilo/cita/reenvío procedente de remitentes incluidos en la lista de permitidos.     |
| `"allowlist_quote"` | `allowlist`, y además conserva el mensaje citado explícitamente o al que se responde, independientemente del remitente. |

Configúrelo por canal (`channels.<channel>.contextVisibility`), por cuenta (`channels.<channel>.accounts.<accountId>.contextVisibility`) o globalmente (`channels.defaults.contextVisibility`). Los canales que recuperan contexto complementario (Discord, Feishu, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp) aplican la política al crear el contexto entrante; las combinaciones de políticas desconocidas producen un cierre seguro y omiten el contexto.

![Flujo de mensajes de grupo](/images/groups-flow.svg)

Si desea...

| Objetivo                                         | Qué configurar                                                |
| -------------------------------------------- | ---------------------------------------------------------- |
| Permitir todos los grupos, pero responder solo a @menciones | `groups: { "*": { requireMention: true } }`                |
| Deshabilitar todas las respuestas de grupos                    | `groupPolicy: "disabled"`                                  |
| Permitir solo grupos específicos                         | `groups: { "<group-id>": { ... } }` (sin la clave `"*"`)         |
| Permitir que solo usted pueda activar el agente en grupos               | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| Reutilizar un conjunto de remitentes de confianza entre canales | `groupAllowFrom: ["accessGroup:operators"]`                |

Para obtener información sobre listas de remitentes permitidos reutilizables, consulte [Grupos de acceso](/es/channels/access-groups).

## Claves de sesión

- Las sesiones de grupo utilizan claves de sesión `agent:<agentId>:<channel>:group:<id>` (las salas y los canales utilizan `agent:<agentId>:<channel>:channel:<id>`).
- Los temas de foros de Telegram añaden `:topic:<threadId>` al identificador del grupo para que cada tema tenga su propia sesión.
- Los chats directos utilizan la sesión principal (o sesiones por remitente si se configura `session.dmScope`).
- Los Heartbeats se ejecutan en la sesión de heartbeat configurada (de forma predeterminada, la sesión principal del agente); las sesiones de grupo no ejecutan sus propios heartbeats.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Patrón: mensajes directos personales + grupos públicos (un solo agente)

Sí, esto funciona bien si el tráfico «personal» son **mensajes directos** y el tráfico «público» son **grupos**.

Motivo: en el modo de un solo agente, los mensajes directos suelen llegar a la clave de sesión **principal** (`agent:main:main`), mientras que los grupos siempre utilizan claves de sesión **no principales** (`agent:main:<channel>:group:<id>`). Si se habilita el aislamiento con `mode: "non-main"`, esas sesiones de grupo se ejecutan en el backend de aislamiento configurado, mientras que la sesión principal de mensajes directos permanece en el host. Docker es el backend predeterminado si no se elige otro.

Esto proporciona un solo «cerebro» de agente (espacio de trabajo + memoria compartidos), pero dos modalidades de ejecución:

- **Mensajes directos**: herramientas completas (host)
- **Grupos**: aislamiento + herramientas restringidas

<Note>
Si se necesitan espacios de trabajo o perfiles realmente separados («personal» y «público» nunca deben mezclarse), utilice un segundo agente + vinculaciones. Consulte [Enrutamiento multiagente](/es/concepts/multi-agent).
</Note>

<Tabs>
  <Tab title="Mensajes directos en el host, grupos aislados">
    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main", // los grupos/canales no son principales -> aislados
            scope: "session", // aislamiento más estricto (un contenedor por grupo/canal)
            workspaceAccess: "none",
          },
        },
      },
      tools: {
        sandbox: {
          tools: {
            // Si allow no está vacío, todo lo demás se bloquea (deny sigue prevaleciendo).
            allow: ["group:messaging", "group:sessions"],
            deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Los grupos solo ven una carpeta incluida en la lista de permitidos">
    ¿Se desea que «los grupos solo puedan ver la carpeta X» en lugar de que «no tengan acceso al host»? Mantenga `workspaceAccess: "none"` y monte en el entorno aislado únicamente las rutas incluidas en la lista de permitidos:

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
                // rutaDelHost:rutaDelContenedor:modo
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
- Depuración del motivo por el que una herramienta está bloqueada: [Aislamiento frente a política de herramientas frente a privilegios elevados](/es/gateway/sandbox-vs-tool-policy-vs-elevated)
- Detalles de los montajes enlazados: [Aislamiento](/es/gateway/sandboxing#custom-bind-mounts)

## Etiquetas de visualización

- Las etiquetas de la interfaz de usuario utilizan `displayName` cuando está disponible, con el formato `<channel>:<token>`.
- `#room` está reservado para salas/canales; los chats de grupo utilizan `g-<slug>` (minúsculas, espacios -> `-`, conservar `#@+._-`). Los identificadores opacos muy largos se acortan a un token estable para evitar mostrar los identificadores completos de las rutas en la interfaz de usuario.

## Política de grupos

Controle cómo se gestionan los mensajes de grupos o salas en cada canal:

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // id numérico de usuario de Telegram (la configuración resuelve @username)
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

| Política        | Comportamiento                                                     |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | Los grupos omiten las listas de permitidos; el requisito de mención sigue aplicándose.      |
| `"disabled"`  | Bloquea por completo todos los mensajes de grupo.                           |
| `"allowlist"` | Solo permite los grupos/salas que coincidan con la lista de permitidos configurada. |

<AccordionGroup>
  <Accordion title="Notas por canal">
    - `groupPolicy` es independiente del requisito de mención (que exige @menciones).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: se usa `groupAllowFrom` (alternativa: `allowFrom` explícito).
    - Signal: `groupAllowFrom` puede coincidir con el id del grupo de Signal entrante o con el teléfono/UUID del remitente.
    - Las aprobaciones de vinculación de mensajes directos (entradas del almacén `*-allowFrom`) se aplican únicamente al acceso a mensajes directos; la autorización del remitente en grupos sigue especificándose de forma explícita mediante las listas de permitidos de grupos.
    - Discord: la lista de permitidos usa `channels.discord.guilds.<id>.channels`.
    - Slack: la lista de permitidos usa `channels.slack.channels`.
    - Matrix: la lista de permitidos usa `channels.matrix.groups`. Se usan los ID de sala (`!room:server`) o los alias (`#alias:server`); las claves de nombres de sala solo coinciden con `channels.matrix.dangerouslyAllowNameMatching: true`, y las entradas no resueltas se ignoran durante la ejecución. Se usa `channels.matrix.groupAllowFrom` para restringir remitentes; también se admiten listas de permitidos `users` por sala.
    - Los mensajes directos grupales se controlan por separado (`channels.discord.dm.*`, `channels.slack.dm.*`: `groupEnabled`, `groupChannels`).
    - Telegram: las listas de remitentes permitidos solo aceptan ID numéricos de usuario (`"123456789"`; los prefijos `telegram:`/`tg:` se eliminan sin distinguir entre mayúsculas y minúsculas). Las entradas `@username` no coinciden durante la ejecución y registran una advertencia; la configuración resuelve `@username` a ID. Los ID de chat negativos deben incluirse en `channels.telegram.groups`, no en las listas de remitentes permitidos.
    - El valor predeterminado es `groupPolicy: "allowlist"`; si la lista de grupos permitidos está vacía, se bloquean los mensajes de grupo.
    - Seguridad durante la ejecución: cuando falta por completo un bloque de proveedor (`channels.<provider>` ausente), la política de grupos aplica un cierre seguro mediante `allowlist` en lugar de heredar `channels.defaults.groupPolicy`, y el Gateway registra la alternativa una vez por cuenta.

  </Accordion>
</AccordionGroup>

Modelo mental rápido (orden de evaluación de los mensajes de grupo):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (open/disabled/allowlist).
  </Step>
  <Step title="Listas de grupos permitidos">
    Listas de grupos permitidos (`*.groups`, `*.groupAllowFrom`, lista de permitidos específica del canal).
  </Step>
  <Step title="Requisito de mención">
    Requisito de mención (`requireMention`, `/activation`).
  </Step>
</Steps>

## Requisito de mención (predeterminado)

Los mensajes de grupo requieren una mención, salvo que se anule este requisito para un grupo concreto. Los valores predeterminados se encuentran en cada subsistema bajo `*.groups."*"`.

Los hechos de mención implícita admitidos son específicos de cada canal:

| Hecho                  | Productores integrados actuales                       |
| --------------------- | ------------------------------------------------ |
| Respuesta al bot      | Discord, Microsoft Teams, QQBot, Slack, Telegram |
| Cita del bot      | WhatsApp, Zalo personal                          |
| El bot se unió al hilo | Mattermost, Slack, Tlon                          |

Cada hecho está habilitado de forma predeterminada cuando el canal lo produce. Se establece la marca `implicitMentions` correspondiente en `false` para impedir que ese hecho omita el requisito de mención; las menciones explícitas nativas no se ven afectadas. Una marca no tiene efecto en los canales que no producen ese hecho.

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

## Limitar el alcance de los patrones de mención configurados

Los `mentionPatterns` configurados son activadores alternativos mediante expresiones regulares. Se usan cuando la
plataforma no expone una mención nativa del bot o cuando se desea que texto sin formato como
`openclaw:` cuente como una mención. Las menciones nativas de la plataforma son independientes:
cuando Discord, Slack, Telegram, Matrix, Signal u otro canal puede demostrar que el mensaje
mencionó explícitamente al bot, esa mención nativa sigue activándolo aunque
se denieguen los patrones de expresiones regulares configurados.

De forma predeterminada, los patrones de mención configurados se aplican en todos los lugares donde el canal proporciona los datos del proveedor y de la conversación a la detección de menciones. Para evitar que los patrones amplios activen al agente en todos los grupos, se limita su alcance por canal con `channels.<channel>.mentionPatterns`.

Se usa `mode: "deny"` cuando los patrones de mención mediante expresiones regulares deban estar desactivados de forma predeterminada para un canal y, a continuación, se habilitan en salas específicas con `allowIn`:

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

Se usa el valor predeterminado `mode: "allow"` (o se omite `mode`) cuando los patrones de mención mediante expresiones regulares deban aplicarse de forma generalizada y, a continuación, se desactivan en las salas con mucho tráfico mediante `denyIn`:

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
| `mode: "allow"` | Los patrones de mención mediante expresiones regulares están habilitados salvo que el ID de la conversación esté en `denyIn`. Este es el valor predeterminado.                    |
| `mode: "deny"`  | Los patrones de mención mediante expresiones regulares están deshabilitados salvo que el ID de la conversación esté en `allowIn`.                                       |
| `allowIn`       | ID de conversaciones donde los patrones de mención mediante expresiones regulares están habilitados en modo de denegación.                                               |
| `denyIn`        | ID de conversaciones donde los patrones de mención mediante expresiones regulares están deshabilitados. `denyIn` prevalece sobre `allowIn` si ambos incluyen el mismo ID. |

Política de expresiones regulares con alcance limitado admitida actualmente:

| Canal  | ID usados en `allowIn` / `denyIn`                             |
| -------- | ------------------------------------------------------------ |
| Discord  | ID de canales de Discord.                                         |
| Matrix   | ID de salas de Matrix.                                             |
| Slack    | ID de canales de Slack.                                           |
| Telegram | ID de chats grupales o `chatId:topic:threadId` para temas de foros. |
| WhatsApp | ID de conversaciones de WhatsApp como `123@g.us`.                |

Las configuraciones de canal a nivel de cuenta pueden establecer la misma política en `channels.<channel>.accounts.<accountId>.mentionPatterns` cuando ese canal admite varias cuentas. Para esa cuenta, la política de cuenta prevalece sobre la política de canal de nivel superior.

<AccordionGroup>
  <Accordion title="Notas sobre el requisito de mención">
    - `mentionPatterns` son patrones de expresiones regulares seguros que no distinguen entre mayúsculas y minúsculas; se ignoran los patrones no válidos y las formas inseguras de repetición anidada (con una advertencia).
    - Precedencia de patrones: `agents.list[].groupChat.mentionPatterns` (útil cuando varios agentes comparten un grupo) prevalece sobre `messages.groupChat.mentionPatterns`; cuando no se establece ninguno, los patrones se derivan del nombre/emoji de identidad del agente.
    - El requisito de mención solo se aplica cuando es posible detectar menciones (se configuran menciones nativas o `mentionPatterns`).
    - Incluir un grupo o remitente en una lista de permitidos no desactiva el requisito de mención; se establece `requireMention` de ese grupo en `false` cuando todos los mensajes deban activar al agente.
    - El contexto automático de instrucciones para chats grupales incluye en cada turno la instrucción resuelta de respuesta silenciosa; los archivos del espacio de trabajo no deben duplicar la mecánica de `NO_REPLY`.
    - Los grupos en los que se permiten respuestas silenciosas automáticas tratan como silenciosos los turnos del modelo que estén completamente vacíos o que solo contengan razonamiento, de forma equivalente a `NO_REPLY`. Los chats directos nunca reciben instrucciones de `NO_REPLY`, y las respuestas grupales que solo usan herramientas de mensajes permanecen silenciosas al no llamar a `message(action=send)`.
    - La conversación ambiental de grupo siempre activa utiliza de forma predeterminada la semántica de solicitud del usuario. Se establece `messages.groupChat.unmentionedInbound: "room_event"` para enviarla como contexto silencioso. Consulte [Eventos ambientales de sala](/es/channels/ambient-room-events) para ver ejemplos de configuración.
    - Los eventos de sala no se almacenan como solicitudes de usuario falsas, y el texto privado del asistente procedente de eventos de sala sin herramientas de mensajes no se reproduce como historial del chat.
    - Los valores predeterminados de Discord se encuentran en `channels.discord.guilds."*"` (se pueden anular por servidor/canal).
    - El contexto del historial de grupos se encapsula de manera uniforme en todos los canales. Los grupos con requisito de mención conservan los mensajes omitidos pendientes; los grupos siempre activos también pueden conservar mensajes recientes de sala ya procesados cuando el canal lo admite. Se usa `messages.groupChat.historyLimit` como valor predeterminado global y `channels.<channel>.historyLimit` (o `channels.<channel>.accounts.*.historyLimit`) para las anulaciones. Se establece `0` para deshabilitarlo.

  </Accordion>
</AccordionGroup>

## Restricciones de herramientas de grupos/canales (opcional)

Algunas configuraciones de canales permiten restringir qué herramientas están disponibles **dentro de un grupo/sala/canal específico**.

- `tools`: permite/deniega herramientas para todo el grupo (`allow`, `alsoAllow`, `deny`; la denegación prevalece).
- `toolsBySender`: anulaciones por remitente dentro del grupo. Se usan prefijos de clave explícitos: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` y el comodín `"*"`. Los id de canal usan los id de canal canónicos de OpenClaw; los alias como `teams` se normalizan a `msteams`. Las claves heredadas sin prefijo aún se aceptan, solo se comparan como `id:` y registran una advertencia de obsolescencia.

Orden de resolución (prevalece el más específico):

<Steps>
  <Step title="toolsBySender del grupo">
    Coincidencia de `toolsBySender` del grupo/canal.
  </Step>
  <Step title="Herramientas del grupo">
    `tools` del grupo/canal.
  </Step>
  <Step title="toolsBySender predeterminado">
    Coincidencia de `toolsBySender` predeterminada (`"*"`).
  </Step>
  <Step title="Herramientas predeterminadas">
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
Las restricciones de herramientas de grupos/canales se aplican además de la política global de herramientas y la del agente (la denegación siempre prevalece). Algunos canales usan un anidamiento diferente para las salas o los canales (por ejemplo, Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Listas de permitidos de grupos

Cuando se configura `channels.whatsapp.groups`, `channels.telegram.groups` o `channels.imessage.groups`, las claves actúan como una lista de grupos permitidos. Use `"*"` para permitir todos los grupos y, al mismo tiempo, establecer el comportamiento predeterminado de las menciones.

<Warning>
Confusión habitual: la aprobación del emparejamiento de mensajes directos no equivale a la autorización de grupos. En los canales que admiten el emparejamiento de mensajes directos, el almacén de emparejamientos solo habilita los mensajes directos. Los comandos de grupo siguen requiriendo la autorización explícita del remitente del grupo mediante listas de permitidos de la configuración, como `groupAllowFrom`, o la configuración alternativa documentada para ese canal.
</Warning>

Usos habituales (copiar y pegar):

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

`/activation` es un comando central restringido al propietario y solo se aplica en los chats de grupo. Se considera propietario al remitente que coincide con `commands.ownerAllowFrom`; las listas `allowFrom` del canal solo controlan el acceso ordinario al canal y a los comandos. El modo almacenado sustituye el valor `requireMention` de ese grupo en los canales que lo consultan (Google Chat, QQBot, Telegram, WhatsApp), y la introducción del prompt del sistema del grupo refleja el modo activo en todos ellos.

## Campos de contexto

Las cargas útiles entrantes de grupos establecen:

- `ChatType=group`
- `GroupSubject` (si se conoce)
- `GroupMembers` (si se conoce)
- `WasMentioned` (resultado del control por menciones)
- Los temas de los foros de Telegram también incluyen `MessageThreadId` y `IsForum`.

El prompt del sistema del agente incluye una introducción del grupo en el primer turno de una nueva sesión de grupo (y después de que cambie `/activation`). Esta recuerda al modelo que debe responder como una persona, reducir al mínimo las líneas vacías, respetar el espaciado habitual de los chats y evitar escribir secuencias literales `\n`. Los canales cuyo modo de tablas declarado no conserva tablas nativas ni sin procesar también desaconsejan las tablas de Markdown. Los nombres de grupos y las etiquetas de participantes procedentes del canal se representan como metadatos no confiables dentro de bloques delimitados, no como instrucciones del sistema en línea.

## Particularidades de iMessage

- Se recomienda usar `chat_id:<id>` para el enrutamiento o las listas de permitidos.
- Listar chats: `imsg chats --limit 20`.
- Las respuestas de grupo siempre se devuelven al mismo `chat_id`.

## Prompts del sistema de WhatsApp

Consulte [WhatsApp](/es/channels/whatsapp#system-prompts) para conocer las reglas canónicas de los prompts del sistema de WhatsApp, incluida la resolución de prompts de grupo y directos, el comportamiento de los comodines y la semántica de las sustituciones por cuenta.

## Particularidades de WhatsApp

Consulte [Mensajes de grupo](/es/channels/group-messages) para conocer el comportamiento exclusivo de WhatsApp (inyección del historial y detalles del manejo de menciones).

## Contenido relacionado

- [Grupos de difusión](/es/channels/broadcast-groups)
- [Enrutamiento de canales](/es/channels/channel-routing)
- [Mensajes de grupo](/es/channels/group-messages)
- [Emparejamiento](/es/channels/pairing)
