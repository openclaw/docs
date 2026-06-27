---
read_when:
    - Cambiar el comportamiento del chat grupal o la restricción por mención
    - Delimitar mentionPatterns a conversaciones grupales específicas
sidebarTitle: Groups
summary: Comportamiento del chat grupal en todas las superficies (Discord/iMessage/Matrix/Microsoft Teams/QQBot/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Grupos
x-i18n:
    generated_at: "2026-06-27T10:37:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 48660e36ac642956842d453fd4caf2cbd7f4193efee9ac864fd7cf700c3c43b6
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw trata los chats grupales de forma coherente en todas las superficies: Discord, iMessage, Matrix, Microsoft Teams, QQBot, Signal, Slack, Telegram, WhatsApp, Zalo.

Para salas siempre activas que deben proporcionar contexto discreto salvo que el agente envíe explícitamente un mensaje visible, consulta [Eventos de sala ambientales](/es/channels/ambient-room-events).

## Introducción para principiantes (2 minutos)

OpenClaw "vive" en tus propias cuentas de mensajería. No hay un usuario de bot de WhatsApp independiente. Si **tú** estás en un grupo, OpenClaw puede ver ese grupo y responder allí.

Comportamiento predeterminado:

- Los grupos están restringidos (`groupPolicy: "allowlist"`).
- Las respuestas requieren una mención salvo que desactives explícitamente el control por menciones.
- Las respuestas visibles en grupos/canales usan la herramienta `message` de forma predeterminada.

Traducción: los remitentes incluidos en la lista de permitidos pueden activar OpenClaw mencionándolo.

<Note>
**TL;DR**

- **El acceso a DM** se controla mediante `*.allowFrom`.
- **El acceso a grupos** se controla mediante `*.groupPolicy` + listas de permitidos (`*.groups`, `*.groupAllowFrom`).
- **La activación de respuestas** se controla mediante el control por menciones (`requireMention`, `/activation`).

</Note>

Flujo rápido (qué ocurre con un mensaje de grupo):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
mention/reply/command/DM -> user request
always-on group chatter -> user request, or room event when configured
```

## Respuestas visibles

Para solicitudes normales de grupo/canal, OpenClaw usa de forma predeterminada `messages.groupChat.visibleReplies: "automatic"`. El texto final del asistente se publica por la ruta heredada de respuesta visible salvo que configures la sala para salida solo mediante la herramienta de mensajes.

Usa `messages.groupChat.visibleReplies: "message_tool"` cuando una sala compartida deba permitir que el agente decida cuándo hablar llamando a `message(action=send)`. Esto funciona mejor para salas grupales respaldadas por modelos de última generación y fiables con herramientas, como GPT 5.5. Si el modelo omite esa herramienta y devuelve texto final sustantivo, OpenClaw mantiene ese texto final privado en lugar de publicarlo en la sala.

Usa `"automatic"` para modelos o runtimes más débiles que no entiendan de forma fiable la entrega solo mediante herramientas. En modo automático, el texto final del asistente del agente es la ruta de respuesta visible de origen, por lo que un modelo que no pueda llamar de forma coherente a `message(action=send)` aún puede responder normalmente.

En modo automático, las respuestas finales de texto normales se publican directamente en la sala. Si la respuesta visible necesita archivos, imágenes u otros adjuntos, el agente aún puede usar `message(action=send)` para ese adjunto en lugar de intentar forzarlo a través de la respuesta final de texto.

Si la herramienta de mensajes no está disponible según la política de herramientas activa, OpenClaw recurre a respuestas visibles automáticas en lugar de suprimir silenciosamente la respuesta.
`openclaw doctor` advierte sobre esta discrepancia.

Para chats directos y cualquier otro evento de origen, usa `messages.visibleReplies: "message_tool"` para aplicar globalmente el mismo comportamiento de respuesta visible solo mediante herramientas. Los turnos directos internos de WebChat usan de forma predeterminada la entrega automática de respuesta final para que Pi y Codex reciban el mismo contrato de respuesta visible. Configura `messages.visibleReplies: "message_tool"` para exigir intencionalmente `message(action=send)` para la salida visible. `messages.groupChat.visibleReplies` sigue siendo la anulación más específica para salas de grupo/canal.

Esto sustituye el patrón anterior de forzar al modelo a responder `NO_REPLY` para la mayoría de los turnos en modo observación. En modo solo herramientas, el prompt no define un contrato `NO_REPLY`. No hacer nada visible simplemente significa no llamar a la herramienta de mensajes.

Los enlaces de conversación propiedad de un Plugin son la excepción. Una vez que un Plugin enlaza un hilo y reclama el turno entrante, la respuesta devuelta por el Plugin es la respuesta visible del enlace; no necesita `message(action=send)`. Esa respuesta es salida del runtime del Plugin, no texto final privado del modelo.

Los indicadores de escritura se siguen enviando para solicitudes directas de grupo. Los eventos ambientales de salas siempre activas, cuando están habilitados, permanecen estrictos y discretos salvo que el agente llame a la herramienta de mensajes.

Las sesiones suprimen de forma predeterminada los resúmenes detallados de herramientas/progreso. Usa `/verbose on` para mostrar esos resúmenes de la sesión actual durante la depuración, y ` /verbose off` para volver al comportamiento solo con respuesta final. El mismo estado detallado se aplica en chats directos, grupos, canales y temas de foro.

Para enviar conversaciones de grupos siempre activos sin mención como contexto de sala discreto en lugar de solicitudes de usuario, usa [Eventos de sala ambientales](/es/channels/ambient-room-events):

```json5
{
  messages: {
    groupChat: {
      unmentionedInbound: "room_event",
    },
  },
}
```

El valor predeterminado es `unmentionedInbound: "user_request"`.

Los mensajes mencionados, comandos, solicitudes de cancelación y DM siguen siendo solicitudes de usuario.

Para exigir que la salida visible pase por la herramienta de mensajes para solicitudes de grupo/canal:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "message_tool",
    },
  },
}
```

El gateway recarga en caliente la configuración de `messages` después de guardar el archivo. Reinicia solo cuando la observación de archivos o la recarga de configuración estén deshabilitadas en el despliegue.

Para exigir que la salida visible pase por la herramienta de mensajes para cada chat de origen:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

Los comandos slash nativos (Discord, Telegram y otras superficies con soporte nativo para comandos) omiten `visibleReplies: "message_tool"` y siempre responden de forma visible para que la interfaz de comandos nativa del canal reciba la respuesta que espera. Esto se aplica solo a turnos de comandos nativos validados; los comandos `/...` escritos como texto y los turnos de chat ordinarios siguen el valor predeterminado de grupo configurado.

## Visibilidad del contexto y listas de permitidos

Hay dos controles distintos involucrados en la seguridad de grupos:

- **Autorización de activación**: quién puede activar el agente (`groupPolicy`, `groups`, `groupAllowFrom`, listas de permitidos específicas del canal).
- **Visibilidad del contexto**: qué contexto suplementario se inyecta en el modelo (texto de respuesta, citas, historial del hilo, metadatos reenviados).

De forma predeterminada, OpenClaw prioriza el comportamiento normal del chat y conserva el contexto mayormente tal como se recibió. Esto significa que las listas de permitidos deciden principalmente quién puede activar acciones, no una frontera universal de censura para cada fragmento citado o histórico.

<AccordionGroup>
  <Accordion title="El comportamiento actual es específico del canal">
    - Algunos canales ya aplican filtrado basado en remitente para contexto suplementario en rutas específicas (por ejemplo, inicialización de hilos de Slack, búsquedas de respuestas/hilos de Matrix).
    - Otros canales todavía pasan contexto de cita/respuesta/reenvío tal como se recibe.

  </Accordion>
  <Accordion title="Dirección de refuerzo (planificada)">
    - `contextVisibility: "all"` (predeterminado) conserva el comportamiento actual tal como se recibe.
    - `contextVisibility: "allowlist"` filtra el contexto suplementario a remitentes incluidos en la lista de permitidos.
    - `contextVisibility: "allowlist_quote"` es `allowlist` más una excepción explícita de cita/respuesta.

    Hasta que este modelo de refuerzo se implemente de forma coherente en todos los canales, espera diferencias según la superficie.

  </Accordion>
</AccordionGroup>

![Flujo de mensajes de grupo](/images/groups-flow.svg)

Si quieres...

| Objetivo                                     | Qué configurar                                             |
| -------------------------------------------- | ---------------------------------------------------------- |
| Permitir todos los grupos, pero responder solo a @menciones | `groups: { "*": { requireMention: true } }`                |
| Deshabilitar todas las respuestas de grupo   | `groupPolicy: "disabled"`                                  |
| Solo grupos específicos                      | `groups: { "<group-id>": { ... } }` (sin clave `"*"`)      |
| Solo tú puedes activar en grupos             | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| Reutilizar un conjunto de remitentes de confianza entre canales | `groupAllowFrom: ["accessGroup:operators"]`                |

Para listas de permitidos reutilizables de remitentes, consulta [Grupos de acceso](/es/channels/access-groups).

## Claves de sesión

- Las sesiones de grupo usan claves de sesión `agent:<agentId>:<channel>:group:<id>` (las salas/canales usan `agent:<agentId>:<channel>:channel:<id>`).
- Los temas de foro de Telegram agregan `:topic:<threadId>` al id de grupo para que cada tema tenga su propia sesión.
- Los chats directos usan la sesión principal (o por remitente si está configurado).
- Los Heartbeats se omiten para las sesiones de grupo.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Patrón: DM personales + grupos públicos (un solo agente)

Sí — esto funciona bien si tu tráfico "personal" son **DM** y tu tráfico "público" son **grupos**.

Por qué: en modo de un solo agente, los DM normalmente llegan a la clave de sesión **principal** (`agent:main:main`), mientras que los grupos siempre usan claves de sesión **no principales** (`agent:main:<channel>:group:<id>`). Si habilitas el sandboxing con `mode: "non-main"`, esas sesiones de grupo se ejecutan en el backend de sandbox configurado mientras tu sesión principal de DM permanece en el host. Docker es el backend predeterminado si no eliges uno.

Esto te da un único "cerebro" de agente (espacio de trabajo + memoria compartidos), pero dos posturas de ejecución:

- **DM**: herramientas completas (host)
- **Grupos**: sandbox + herramientas restringidas

<Note>
Si necesitas espacios de trabajo/personas verdaderamente separados ("personal" y "público" nunca deben mezclarse), usa un segundo agente + enlaces. Consulta [Enrutamiento multiagente](/es/concepts/multi-agent).
</Note>

<Tabs>
  <Tab title="DM en el host, grupos en sandbox">
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
  <Tab title="Los grupos solo ven una carpeta en la lista de permitidos">
    ¿Quieres que "los grupos solo puedan ver la carpeta X" en lugar de "sin acceso al host"? Mantén `workspaceAccess: "none"` y monta solo rutas incluidas en la lista de permitidos dentro del sandbox:

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
- Detalles de montajes bind: [Sandboxing](/es/gateway/sandboxing#custom-bind-mounts)

## Etiquetas de visualización

- Las etiquetas de la interfaz usan `displayName` cuando está disponible, con el formato `<channel>:<token>`.
- `#room` está reservado para salas/canales; los chats grupales usan `g-<slug>` (minúsculas, espacios -> `-`, conserva `#@+._-`).

## Política de grupo

Controla cómo se manejan los mensajes de grupo/sala por canal:

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // numeric Telegram user id (wizard can resolve @username)
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
        GUILD_ID: { channels: { help: { allow: true } } },
      },
    },
    slack: {
      groupPolicy: "allowlist",
      channels: { "#general": { allow: true } },
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

| Política     | Comportamiento                                                     |
| ------------ | ------------------------------------------------------------------ |
| `"open"`     | Los grupos omiten las listas de permitidos; el control por menciones sigue aplicándose. |
| `"disabled"` | Bloquea por completo todos los mensajes de grupo.                  |
| `"allowlist"` | Permite solo los grupos/salas que coinciden con la lista de permitidos configurada. |

<AccordionGroup>
  <Accordion title="Notas por canal">
    - `groupPolicy` está separado del control por menciones (que requiere @menciones).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: usa `groupAllowFrom` (respaldo: `allowFrom` explícito).
    - Signal: `groupAllowFrom` puede coincidir con el id de grupo de Signal entrante o con el teléfono/UUID del remitente.
    - Las aprobaciones de emparejamiento de DM (entradas de almacén `*-allowFrom`) se aplican solo al acceso por DM; la autorización del remitente en grupos sigue siendo explícita mediante listas de permitidos de grupo.
    - Discord: la lista de permitidos usa `channels.discord.guilds.<id>.channels`.
    - Slack: la lista de permitidos usa `channels.slack.channels`.
    - Matrix: la lista de permitidos usa `channels.matrix.groups`. Prefiere IDs o alias de sala; la búsqueda por nombre de sala unida es de mejor esfuerzo, y los nombres no resueltos se ignoran en tiempo de ejecución. Usa `channels.matrix.groupAllowFrom` para restringir remitentes; también se admiten listas de permitidos `users` por sala.
    - Los DM de grupo se controlan por separado (`channels.discord.dm.*`, `channels.slack.dm.*`).
    - La lista de permitidos de Telegram puede coincidir con IDs de usuario (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) o nombres de usuario (`"@alice"` o `"alice"`); los prefijos no distinguen mayúsculas de minúsculas.
    - El valor predeterminado es `groupPolicy: "allowlist"`; si la lista de permitidos de tu grupo está vacía, los mensajes de grupo se bloquean.
    - Seguridad en tiempo de ejecución: cuando falta por completo un bloque de proveedor (`channels.<provider>` ausente), la política de grupo recurre a un modo de cierre seguro (normalmente `allowlist`) en lugar de heredar `channels.defaults.groupPolicy`.

  </Accordion>
</AccordionGroup>

Modelo mental rápido (orden de evaluación para mensajes de grupo):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (open/disabled/allowlist).
  </Step>
  <Step title="Listas de permitidos de grupo">
    Listas de permitidos de grupo (`*.groups`, `*.groupAllowFrom`, lista de permitidos específica del canal).
  </Step>
  <Step title="Control por menciones">
    Control por menciones (`requireMention`, `/activation`).
  </Step>
</Steps>

## Control por menciones (predeterminado)

Los mensajes de grupo requieren una mención a menos que se sobrescriba por grupo. Los valores predeterminados viven por subsistema en `*.groups."*"`.

Responder a un mensaje del bot cuenta como una mención implícita cuando el canal admite metadatos de respuesta. Citar un mensaje del bot también puede contar como una mención implícita en canales que exponen metadatos de cita. Los casos integrados actuales incluyen Telegram, WhatsApp, Slack, Discord, Microsoft Teams y ZaloUser.

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

Los `mentionPatterns` configurados son activadores de respaldo con regex. Úsalos cuando la
plataforma no exponga una mención nativa del bot, o cuando quieras que texto sin formato como
`openclaw:` cuente como una mención. Las menciones nativas de la plataforma son independientes:
cuando Discord, Slack, Telegram, Matrix u otro canal puede demostrar que el mensaje
mencionó explícitamente al bot, esa mención nativa se activa aunque
los patrones regex configurados estén denegados.

De forma predeterminada, los patrones de mención configurados se aplican en todos los lugares donde ese canal pasa
datos del proveedor y de la conversación a la detección de menciones. Para evitar que patrones amplios
despierten al agente en todos los grupos, delimítalos por canal con
`channels.<channel>.mentionPatterns`.

Usa `mode: "deny"` cuando los patrones regex de mención deban estar desactivados de forma predeterminada para un
canal, y luego habilita salas específicas con `allowIn`:

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

Usa el `mode: "allow"` predeterminado (u omite `mode`) cuando los patrones regex de mención
deban aplicarse de forma amplia, y luego desactívalos en salas ruidosas con `denyIn`:

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
| `mode: "allow"` | Los patrones regex de mención están habilitados a menos que el ID de conversación esté en `denyIn`. Este es el valor predeterminado. |
| `mode: "deny"`  | Los patrones regex de mención están deshabilitados a menos que el ID de conversación esté en `allowIn`.                |
| `allowIn`       | IDs de conversación donde los patrones regex de mención están habilitados en modo deny.                               |
| `denyIn`        | IDs de conversación donde los patrones regex de mención están deshabilitados. `denyIn` prevalece sobre `allowIn` si ambos incluyen el mismo ID. |

Política regex delimitada admitida hoy:

| Canal    | IDs usados en `allowIn` / `denyIn`                             |
| -------- | -------------------------------------------------------------- |
| Discord  | IDs de canal de Discord.                                       |
| Matrix   | IDs de sala de Matrix.                                         |
| Slack    | IDs de canal de Slack.                                         |
| Telegram | IDs de chat de grupo, o `chatId:topic:threadId` para temas de foro. |
| WhatsApp | IDs de conversación de WhatsApp como `123@g.us`.               |

Las configuraciones de canal a nivel de cuenta pueden definir la misma política en
`channels.<channel>.accounts.<accountId>.mentionPatterns` cuando ese canal
admite varias cuentas. La política de cuenta tiene prioridad sobre la política de canal
de nivel superior para esa cuenta.

<AccordionGroup>
  <Accordion title="Notas de control por menciones">
    - `mentionPatterns` son patrones regex seguros que no distinguen mayúsculas de minúsculas; los patrones no válidos y las formas inseguras de repetición anidada se ignoran.
    - Las superficies que proporcionan menciones explícitas siguen pasando; los patrones regex configurados son un respaldo.
    - `channels.<channel>.mentionPatterns.mode: "deny"` deshabilita los patrones de mención configurados de forma predeterminada para ese canal; vuelve a habilitar conversaciones seleccionadas con `allowIn`.
    - `channels.<channel>.mentionPatterns.denyIn` deshabilita los patrones de mención configurados para IDs de conversación específicos, mientras que las @menciones nativas de la plataforma siguen pasando.
    - Sobrescritura por agente: `agents.list[].groupChat.mentionPatterns` (útil cuando varios agentes comparten un grupo).
    - El control por menciones solo se aplica cuando la detección de menciones es posible (menciones nativas o `mentionPatterns` configurados).
    - Incluir un grupo o remitente en la lista de permitidos no deshabilita el control por menciones; define `requireMention` de ese grupo como `false` cuando todos los mensajes deban activarlo.
    - El contexto automático de prompt de chat de grupo incluye la instrucción de respuesta silenciosa resuelta en cada turno; los archivos del espacio de trabajo no deben duplicar la mecánica de `NO_REPLY`.
    - Los grupos donde se permiten respuestas silenciosas automáticas tratan los turnos del modelo limpios, vacíos o solo de razonamiento como silenciosos, equivalentes a `NO_REPLY`. Los chats directos nunca reciben guía `NO_REPLY`, y las respuestas de grupo solo con herramienta de mensaje permanecen en silencio al no llamar a `message(action=send)`.
    - La charla de grupo ambiental siempre activa usa semántica de solicitud de usuario de forma predeterminada. Define `messages.groupChat.unmentionedInbound: "room_event"` para enviarla como contexto silencioso en su lugar. Consulta [Eventos de sala ambientales](/es/channels/ambient-room-events) para ver ejemplos de configuración.
    - Los eventos de sala no se almacenan como solicitudes de usuario falsas, y el texto privado del asistente de eventos de sala sin herramienta de mensaje no se reproduce como historial de chat.
    - Los valores predeterminados de Discord viven en `channels.discord.guilds."*"` (sobrescribibles por guild/canal).
    - El contexto de historial de grupo se envuelve de forma uniforme en todos los canales. Los grupos con control por menciones conservan mensajes omitidos pendientes; los grupos siempre activos también pueden conservar mensajes recientes procesados de la sala cuando el canal lo admite. Usa `messages.groupChat.historyLimit` para el valor predeterminado global y `channels.<channel>.historyLimit` (o `channels.<channel>.accounts.*.historyLimit`) para sobrescrituras. Define `0` para deshabilitarlo.

  </Accordion>
</AccordionGroup>

## Restricciones de herramientas de grupo/canal (opcional)

Algunas configuraciones de canal admiten restringir qué herramientas están disponibles **dentro de un grupo/sala/canal específico**.

- `tools`: permite/deniega herramientas para todo el grupo.
- `toolsBySender`: sobrescrituras por remitente dentro del grupo. Usa prefijos de clave explícitos: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` y el comodín `"*"`. Los ids de canal usan ids de canal canónicos de OpenClaw; los alias como `teams` se normalizan a `msteams`. Las claves heredadas sin prefijo aún se aceptan y coinciden solo como `id:`.

Orden de resolución (gana lo más específico):

<Steps>
  <Step title="toolsBySender de grupo">
    Coincidencia de `toolsBySender` de grupo/canal.
  </Step>
  <Step title="tools de grupo">
    `tools` de grupo/canal.
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
Las restricciones de herramientas de grupo/canal se aplican además de la política global/de agente de herramientas (la denegación sigue prevaleciendo). Algunos canales usan una anidación diferente para salas/canales (por ejemplo, Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Listas de permitidos de grupo

Cuando `channels.whatsapp.groups`, `channels.telegram.groups` o `channels.imessage.groups` está configurado, las claves actúan como una lista de permitidos de grupo. Usa `"*"` para permitir todos los grupos sin dejar de definir el comportamiento predeterminado de menciones.

<Warning>
Confusión común: la aprobación del emparejamiento por DM no es lo mismo que la autorización de grupo. En los canales que admiten emparejamiento por DM, el almacén de emparejamiento desbloquea solo los DM. Los comandos de grupo siguen requiriendo autorización explícita del remitente del grupo mediante listas de permitidos de configuración como `groupAllowFrom` o la reserva de configuración documentada para ese canal.
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
  <Tab title="Permitir todos los grupos pero exigir mención">
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
  <Tab title="Activadores solo del propietario (WhatsApp)">
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

Los propietarios de grupo pueden alternar la activación por grupo:

- `/activation mention`
- `/activation always`

El propietario se determina mediante `channels.whatsapp.allowFrom` (o el E.164 propio del bot cuando no está configurado). Envía el comando como un mensaje independiente. Otras superficies actualmente ignoran `/activation`.

## Campos de contexto

Las cargas útiles entrantes de grupo establecen:

- `ChatType=group`
- `GroupSubject` (si se conoce)
- `GroupMembers` (si se conoce)
- `WasMentioned` (resultado del control por mención)
- Los temas de foro de Telegram también incluyen `MessageThreadId` e `IsForum`.

El prompt del sistema del agente incluye una introducción de grupo en el primer turno de una nueva sesión de grupo. Le recuerda al modelo que responda como una persona, minimice las líneas vacías y siga el espaciado normal del chat, y evite escribir secuencias literales `\n`. Los grupos que no son de Telegram también desaconsejan las tablas Markdown; la guía de texto enriquecido de Telegram proviene del prompt del canal de Telegram. Los nombres de grupo y las etiquetas de participantes provenientes del canal se renderizan como metadatos no confiables delimitados, no como instrucciones del sistema en línea.

## Detalles específicos de iMessage

- Prefiere `chat_id:<id>` al enrutar o agregar a listas de permitidos.
- Listar chats: `imsg chats --limit 20`.
- Las respuestas de grupo siempre vuelven al mismo `chat_id`.

## Prompts del sistema de WhatsApp

Consulta [WhatsApp](/es/channels/whatsapp#system-prompts) para ver las reglas canónicas de prompts del sistema de WhatsApp, incluida la resolución de prompts de grupo y directos, el comportamiento de comodines y la semántica de sustitución por cuenta.

## Detalles específicos de WhatsApp

Consulta [Mensajes de grupo](/es/channels/group-messages) para el comportamiento exclusivo de WhatsApp (inyección de historial, detalles del manejo de menciones).

## Relacionado

- [Grupos de difusión](/es/channels/broadcast-groups)
- [Enrutamiento de canales](/es/channels/channel-routing)
- [Mensajes de grupo](/es/channels/group-messages)
- [Emparejamiento](/es/channels/pairing)
