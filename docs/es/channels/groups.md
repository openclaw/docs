---
read_when:
    - Cambiar el comportamiento de los chats grupales o el control por menciones
sidebarTitle: Groups
summary: Comportamiento de los chats grupales en las distintas superficies (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Grupos
x-i18n:
    generated_at: "2026-05-11T20:20:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19297ef9c3043b00c4785567a7c02266bd08fe5228c8275c3233e87e917dd09f
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw trata los chats grupales de forma coherente en todas las superficies: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Introducción para principiantes (2 minutos)

OpenClaw "vive" en tus propias cuentas de mensajería. No hay un usuario de bot de WhatsApp separado. Si **tú** estás en un grupo, OpenClaw puede ver ese grupo y responder allí.

Comportamiento predeterminado:

- Los grupos están restringidos (`groupPolicy: "allowlist"`).
- Las respuestas requieren una mención salvo que desactives explícitamente la barrera de menciones.
- Las respuestas finales normales en grupos/canales son privadas de forma predeterminada. La salida visible en la sala usa la herramienta `message`.

Traducción: los remitentes en la lista de permitidos pueden activar OpenClaw mencionándolo.

<Note>
**TL;DR**

- El **acceso a mensajes directos** se controla mediante `*.allowFrom`.
- El **acceso a grupos** se controla mediante `*.groupPolicy` + listas de permitidos (`*.groups`, `*.groupAllowFrom`).
- La **activación de respuestas** se controla mediante la barrera de menciones (`requireMention`, `/activation`).

</Note>

Flujo rápido (qué ocurre con un mensaje grupal):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## Respuestas visibles

Para salas de grupos/canales, OpenClaw usa de forma predeterminada `messages.groupChat.visibleReplies: "message_tool"`.
`openclaw doctor --fix` escribe este valor predeterminado en las configuraciones de canales configurados que lo omiten.
Esto significa que el agente aún procesa el turno y puede actualizar el estado de memoria/sesión, pero su respuesta final normal no se publica automáticamente en la sala. Para hablar de forma visible, el agente usa `message(action=send)`.

Este valor predeterminado depende de un modelo/runtime que invoque herramientas de forma fiable. Si los registros muestran
texto del asistente pero `didSendViaMessagingTool: false`, el modelo respondió
en privado en lugar de llamar a la herramienta de mensajes. Eso no es un
fallo de envío de Discord/Slack/Telegram. Usa un modelo fiable en llamadas a herramientas para
sesiones de grupos/canales, o establece
`messages.groupChat.visibleReplies: "automatic"` para restaurar las respuestas finales visibles
heredadas.

Si la herramienta de mensajes no está disponible bajo la política de herramientas activa, OpenClaw recurre
a respuestas visibles automáticas en lugar de suprimir silenciosamente la respuesta.
`openclaw doctor` advierte sobre esta discrepancia.

Para chats directos y cualquier otro turno de origen, usa `messages.visibleReplies: "message_tool"` para aplicar globalmente el mismo comportamiento de respuesta visible solo mediante herramienta. Los arneses también pueden elegir esto como su valor predeterminado no establecido; el arnés de Codex hace esto para chats directos en modo Codex. `messages.groupChat.visibleReplies` sigue siendo la anulación más específica para salas de grupos/canales.

Esto reemplaza el patrón antiguo de obligar al modelo a responder `NO_REPLY` para la mayoría de los turnos en modo de observación. En el modo solo herramienta, no hacer nada visible simplemente significa no llamar a la herramienta de mensajes.

Los indicadores de escritura se siguen enviando mientras el agente trabaja en modo solo herramienta. El modo de escritura grupal predeterminado se actualiza de "message" a "instant" para estos turnos porque puede que nunca haya texto normal de mensaje del asistente antes de que el agente decida si llamar a la herramienta de mensajes. La configuración explícita del modo de escritura sigue teniendo prioridad.

Para restaurar las respuestas finales automáticas heredadas para salas de grupos/canales:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

El Gateway recarga en caliente la configuración de `messages` después de guardar el archivo. Reinicia solo
cuando la observación de archivos o la recarga de configuración estén desactivadas en el despliegue.

Para exigir que la salida visible pase por la herramienta de mensajes para cada chat de origen:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

Los comandos slash nativos (Discord, Telegram y otras superficies con soporte nativo de comandos) omiten `visibleReplies: "message_tool"` y siempre responden de forma visible para que la interfaz de comandos nativa del canal reciba la respuesta que espera. Esto solo se aplica a turnos de comandos nativos validados; los comandos `/...` escritos como texto y los turnos de chat ordinarios siguen el valor predeterminado grupal configurado.

## Visibilidad del contexto y listas de permitidos

Hay dos controles diferentes implicados en la seguridad de grupos:

- **Autorización de activación**: quién puede activar el agente (`groupPolicy`, `groups`, `groupAllowFrom`, listas de permitidos específicas del canal).
- **Visibilidad del contexto**: qué contexto complementario se inyecta en el modelo (texto de respuesta, citas, historial de hilo, metadatos reenviados).

De forma predeterminada, OpenClaw prioriza el comportamiento normal de chat y mantiene el contexto mayormente como se recibió. Esto significa que las listas de permitidos deciden principalmente quién puede activar acciones, no una frontera universal de censura para cada fragmento citado o histórico.

<AccordionGroup>
  <Accordion title="El comportamiento actual es específico del canal">
    - Algunos canales ya aplican filtrado basado en remitente para contexto complementario en rutas específicas (por ejemplo, inicialización de hilos de Slack, búsquedas de respuestas/hilos de Matrix).
    - Otros canales siguen pasando el contexto de citas/respuestas/reenvíos tal como se recibió.

  </Accordion>
  <Accordion title="Dirección de endurecimiento (planificada)">
    - `contextVisibility: "all"` (predeterminado) mantiene el comportamiento actual tal como se recibió.
    - `contextVisibility: "allowlist"` filtra el contexto complementario a remitentes en la lista de permitidos.
    - `contextVisibility: "allowlist_quote"` es `allowlist` más una excepción explícita de cita/respuesta.

    Hasta que este modelo de endurecimiento se implemente de forma coherente en todos los canales, espera diferencias según la superficie.

  </Accordion>
</AccordionGroup>

![Flujo de mensajes grupales](/images/groups-flow.svg)

Si quieres...

| Objetivo                                     | Qué configurar                                             |
| -------------------------------------------- | ---------------------------------------------------------- |
| Permitir todos los grupos pero responder solo en @menciones | `groups: { "*": { requireMention: true } }`                |
| Desactivar todas las respuestas grupales     | `groupPolicy: "disabled"`                                  |
| Solo grupos específicos                      | `groups: { "<group-id>": { ... } }` (sin clave `"*"` )     |
| Solo tú puedes activar en grupos             | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| Reutilizar un conjunto de remitentes de confianza entre canales | `groupAllowFrom: ["accessGroup:operators"]`                |

Para listas de remitentes permitidos reutilizables, consulta [Grupos de acceso](/es/channels/access-groups).

## Claves de sesión

- Las sesiones grupales usan claves de sesión `agent:<agentId>:<channel>:group:<id>` (las salas/canales usan `agent:<agentId>:<channel>:channel:<id>`).
- Los temas de foros de Telegram agregan `:topic:<threadId>` al identificador del grupo para que cada tema tenga su propia sesión.
- Los chats directos usan la sesión principal (o por remitente si está configurado).
- Los Heartbeats se omiten para sesiones grupales.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Patrón: mensajes directos personales + grupos públicos (un solo agente)

Sí, esto funciona bien si tu tráfico "personal" son **mensajes directos** y tu tráfico "público" son **grupos**.

Motivo: en modo de agente único, los mensajes directos normalmente llegan a la clave de sesión **principal** (`agent:main:main`), mientras que los grupos siempre usan claves de sesión **no principales** (`agent:main:<channel>:group:<id>`). Si activas el aislamiento con `mode: "non-main"`, esas sesiones grupales se ejecutan en el backend de aislamiento configurado, mientras que tu sesión principal de mensajes directos permanece en el host. Docker es el backend predeterminado si no eliges uno.

Esto te da un solo "cerebro" de agente (workspace + memoria compartidos), pero dos posturas de ejecución:

- **Mensajes directos**: herramientas completas (host)
- **Grupos**: aislamiento + herramientas restringidas

<Note>
Si necesitas workspaces/personas realmente separados ("personal" y "público" nunca deben mezclarse), usa un segundo agente + vinculaciones. Consulta [Enrutamiento multiagente](/es/concepts/multi-agent).
</Note>

<Tabs>
  <Tab title="Mensajes directos en host, grupos aislados">
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
    ¿Quieres que "los grupos solo puedan ver la carpeta X" en lugar de "sin acceso al host"? Mantén `workspaceAccess: "none"` y monta solo rutas permitidas dentro del aislamiento:

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
- Depurar por qué una herramienta está bloqueada: [Aislamiento frente a política de herramientas frente a elevado](/es/gateway/sandbox-vs-tool-policy-vs-elevated)
- Detalles de montajes vinculados: [Aislamiento](/es/gateway/sandboxing#custom-bind-mounts)

## Etiquetas de visualización

- Las etiquetas de la UI usan `displayName` cuando está disponible, con formato `<channel>:<token>`.
- `#room` está reservado para salas/canales; los chats grupales usan `g-<slug>` (minúsculas, espacios -> `-`, conservar `#@+._-`).

## Política de grupos

Controla cómo se manejan los mensajes de grupos/salas por canal:

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

| Política     | Comportamiento                                             |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | Los grupos omiten las listas de permitidos; la barrera de menciones sigue aplicándose. |
| `"disabled"`  | Bloquea por completo todos los mensajes grupales.          |
| `"allowlist"` | Solo permite grupos/salas que coincidan con la lista de permitidos configurada. |

<AccordionGroup>
  <Accordion title="Per-channel notes">
    - `groupPolicy` está separado del control por menciones (que requiere @menciones).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: usa `groupAllowFrom` (alternativa: `allowFrom` explícito).
    - Signal: `groupAllowFrom` puede coincidir con el id de grupo entrante de Signal o con el teléfono/UUID del remitente.
    - Las aprobaciones de emparejamiento de MD (entradas del almacén `*-allowFrom`) se aplican solo al acceso por MD; la autorización del remitente en grupos sigue siendo explícita mediante listas de permitidos de grupo.
    - Discord: la lista de permitidos usa `channels.discord.guilds.<id>.channels`.
    - Slack: la lista de permitidos usa `channels.slack.channels`.
    - Matrix: la lista de permitidos usa `channels.matrix.groups`. Prefiere IDs de sala o alias; la búsqueda de nombres de salas unidas se hace con el mejor esfuerzo, y los nombres no resueltos se ignoran en tiempo de ejecución. Usa `channels.matrix.groupAllowFrom` para restringir remitentes; también se admiten listas de permitidos `users` por sala.
    - Los MD de grupo se controlan por separado (`channels.discord.dm.*`, `channels.slack.dm.*`).
    - La lista de permitidos de Telegram puede coincidir con IDs de usuario (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) o nombres de usuario (`"@alice"` o `"alice"`); los prefijos no distinguen mayúsculas de minúsculas.
    - El valor predeterminado es `groupPolicy: "allowlist"`; si tu lista de permitidos de grupo está vacía, los mensajes de grupo se bloquean.
    - Seguridad en tiempo de ejecución: cuando falta por completo un bloque de proveedor (`channels.<provider>` ausente), la política de grupo usa como alternativa un modo cerrado ante fallos (normalmente `allowlist`) en lugar de heredar `channels.defaults.groupPolicy`.

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

Los mensajes de grupo requieren una mención salvo que se sobrescriba por grupo. Los valores predeterminados viven por subsistema bajo `*.groups."*"`.

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

<AccordionGroup>
  <Accordion title="Mention gating notes">
    - `mentionPatterns` son patrones regex seguros que no distinguen mayúsculas de minúsculas; los patrones no válidos y las formas de repetición anidada inseguras se ignoran.
    - Las superficies que proporcionan menciones explícitas siguen pasando; los patrones son una alternativa.
    - Sobrescritura por agente: `agents.list[].groupChat.mentionPatterns` (útil cuando varios agentes comparten un grupo).
    - El control por menciones solo se aplica cuando la detección de menciones es posible (menciones nativas o `mentionPatterns` configurados).
    - Permitir un grupo o remitente no desactiva el control por menciones; establece el `requireMention` de ese grupo en `false` cuando todos los mensajes deban activarse.
    - El contexto del prompt de chat de grupo lleva la instrucción de respuesta silenciosa resuelta en cada turno; los archivos del espacio de trabajo no deberían duplicar la mecánica de `NO_REPLY`.
    - Los grupos donde se permiten respuestas silenciosas tratan los turnos limpios vacíos o solo de razonamiento del modelo como silenciosos, equivalente a `NO_REPLY`. Los chats directos hacen lo mismo solo cuando las respuestas silenciosas directas están permitidas explícitamente; de lo contrario, las respuestas vacías siguen siendo turnos de agente fallidos.
    - Los valores predeterminados de Discord viven en `channels.discord.guilds."*"` (sobrescribibles por gremio/canal).
    - El contexto del historial de grupo se envuelve de forma uniforme entre canales. Los grupos controlados por menciones conservan mensajes omitidos pendientes; los grupos siempre activos también pueden conservar mensajes recientes procesados de la sala cuando el canal lo admite. Usa `messages.groupChat.historyLimit` para el valor predeterminado global y `channels.<channel>.historyLimit` (o `channels.<channel>.accounts.*.historyLimit`) para sobrescrituras. Establece `0` para desactivar.

  </Accordion>
</AccordionGroup>

## Restricciones de herramientas por grupo/canal (opcional)

Algunas configuraciones de canal admiten restringir qué herramientas están disponibles **dentro de un grupo/sala/canal específico**.

- `tools`: permite/deniega herramientas para todo el grupo.
- `toolsBySender`: sobrescrituras por remitente dentro del grupo. Usa prefijos de clave explícitos: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` y el comodín `"*"`. Los ids de canal usan ids de canal canónicos de OpenClaw; alias como `teams` se normalizan a `msteams`. Las claves heredadas sin prefijo siguen aceptándose y se comparan solo como `id:`.

Orden de resolución (gana lo más específico):

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
Las restricciones de herramientas por grupo/canal se aplican además de la política global/de agente de herramientas (la denegación sigue ganando). Algunos canales usan anidamiento diferente para salas/canales (por ejemplo, Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Listas de permitidos de grupo

Cuando se configura `channels.whatsapp.groups`, `channels.telegram.groups` o `channels.imessage.groups`, las claves actúan como una lista de permitidos de grupo. Usa `"*"` para permitir todos los grupos sin dejar de definir el comportamiento predeterminado de menciones.

<Warning>
Confusión común: la aprobación de emparejamiento de MD no es lo mismo que la autorización de grupo. Para canales que admiten emparejamiento de MD, el almacén de emparejamiento solo desbloquea MD. Los comandos de grupo siguen requiriendo autorización explícita del remitente del grupo desde listas de permitidos de configuración como `groupAllowFrom` o la alternativa de configuración documentada para ese canal.
</Warning>

Intenciones comunes (copiar/pegar):

<Tabs>
  <Tab title="Disable all group replies">
    ```json5
    {
      channels: { whatsapp: { groupPolicy: "disabled" } },
    }
    ```
  </Tab>
  <Tab title="Allow only specific groups (WhatsApp)">
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
  <Tab title="Allow all groups but require mention">
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
  <Tab title="Owner-only triggers (WhatsApp)">
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

El propietario se determina mediante `channels.whatsapp.allowFrom` (o el E.164 propio del bot cuando no está establecido). Envía el comando como mensaje independiente. Otras superficies actualmente ignoran `/activation`.

## Campos de contexto

Las cargas útiles entrantes de grupo establecen:

- `ChatType=group`
- `GroupSubject` (si se conoce)
- `GroupMembers` (si se conoce)
- `WasMentioned` (resultado del control por menciones)
- Los temas de foro de Telegram también incluyen `MessageThreadId` e `IsForum`.

El prompt de sistema del agente incluye una introducción de grupo en el primer turno de una nueva sesión de grupo. Recuerda al modelo que responda como una persona, evite tablas de Markdown, minimice las líneas vacías y siga el espaciado normal de chat, y evite escribir secuencias literales `\n`. Los nombres de grupo y etiquetas de participantes procedentes del canal se representan como metadatos no confiables delimitados, no como instrucciones de sistema en línea.

## Detalles de iMessage

- Prefiere `chat_id:<id>` al enrutar o configurar listas de permitidos.
- Lista chats: `imsg chats --limit 20`.
- Las respuestas de grupo siempre vuelven al mismo `chat_id`.

## Prompts de sistema de WhatsApp

Consulta [WhatsApp](/es/channels/whatsapp#system-prompts) para las reglas canónicas del prompt de sistema de WhatsApp, incluida la resolución de prompts de grupo y directos, el comportamiento de comodines y la semántica de sobrescritura de cuenta.

## Detalles de WhatsApp

Consulta [Mensajes de grupo](/es/channels/group-messages) para el comportamiento exclusivo de WhatsApp (inyección de historial, detalles del manejo de menciones).

## Relacionado

- [Grupos de difusión](/es/channels/broadcast-groups)
- [Enrutamiento de canales](/es/channels/channel-routing)
- [Mensajes de grupo](/es/channels/group-messages)
- [Emparejamiento](/es/channels/pairing)
