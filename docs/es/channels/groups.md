---
read_when:
    - Cambiar el comportamiento del chat grupal o el control por menciones
sidebarTitle: Groups
summary: Comportamiento de los chats grupales en distintas superficies (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Grupos
x-i18n:
    generated_at: "2026-05-03T21:27:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6fd4fcaa8335f1dc4b4b1a719d6654ab0c10530f74284269ed6205dd5f87c116
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw trata los chats grupales de forma coherente en todas las superficies: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Introducción para principiantes (2 minutos)

OpenClaw "vive" en tus propias cuentas de mensajería. No hay un usuario de bot de WhatsApp separado. Si **tú** estás en un grupo, OpenClaw puede ver ese grupo y responder allí.

Comportamiento predeterminado:

- Los grupos están restringidos (`groupPolicy: "allowlist"`).
- Las respuestas requieren una mención, salvo que desactives explícitamente la compuerta por mención.
- Las respuestas finales normales en grupos/canales son privadas de forma predeterminada. La salida visible en la sala usa la herramienta `message`.

Traducción: los remitentes incluidos en la lista de permitidos pueden activar OpenClaw mencionándolo.

<Note>
**TL;DR**

- **El acceso por mensajes directos** se controla mediante `*.allowFrom`.
- **El acceso a grupos** se controla mediante `*.groupPolicy` + listas de permitidos (`*.groups`, `*.groupAllowFrom`).
- **La activación de respuestas** se controla mediante la compuerta por mención (`requireMention`, `/activation`).

</Note>

Flujo rápido (qué ocurre con un mensaje de grupo):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## Respuestas visibles

Para salas de grupo/canal, OpenClaw usa de forma predeterminada `messages.groupChat.visibleReplies: "message_tool"`.
`openclaw doctor --fix` escribe este valor predeterminado en las configuraciones de canales configurados que lo omiten.
Eso significa que el agente sigue procesando el turno y puede actualizar el estado de memoria/sesión, pero su respuesta final normal no se publica automáticamente de vuelta en la sala. Para hablar de forma visible, el agente usa `message(action=send)`.

Si la herramienta de mensajes no está disponible con la política de herramientas activa, OpenClaw recurre a respuestas visibles automáticas en lugar de suprimir la respuesta en silencio.
`openclaw doctor` advierte sobre esta discrepancia.

Para chats directos y cualquier otro turno de origen, usa `messages.visibleReplies: "message_tool"` para aplicar globalmente el mismo comportamiento de respuesta visible solo mediante herramienta. Los arneses también pueden elegir esto como su valor predeterminado no definido; el arnés de Codex lo hace para chats directos en modo Codex. `messages.groupChat.visibleReplies` sigue siendo la anulación más específica para salas de grupo/canal.

Esto reemplaza el patrón anterior de obligar al modelo a responder `NO_REPLY` para la mayoría de los turnos en modo escucha. En modo solo herramienta, no hacer nada visible simplemente significa no llamar a la herramienta de mensajes.

Los indicadores de escritura todavía se envían mientras el agente trabaja en modo solo herramienta. El modo de escritura grupal predeterminado se actualiza de "message" a "instant" para estos turnos porque puede que nunca haya texto normal de mensaje del asistente antes de que el agente decida si llamar a la herramienta de mensajes. La configuración explícita del modo de escritura sigue teniendo prioridad.

Para restaurar las respuestas finales automáticas heredadas en salas de grupo/canal:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

El Gateway recarga en caliente la configuración de `messages` después de guardar el archivo. Reinicia solo cuando la observación de archivos o la recarga de configuración esté desactivada en el despliegue.

Para exigir que la salida visible pase por la herramienta de mensajes en cada chat de origen:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

Los comandos de barra nativos (Discord, Telegram y otras superficies con soporte de comandos nativos) omiten `visibleReplies: "message_tool"` y siempre responden de forma visible para que la interfaz de comandos nativa del canal reciba la respuesta que espera. Esto se aplica solo a turnos de comandos nativos validados; los comandos `/...` escritos como texto y los turnos de chat ordinarios siguen usando el valor predeterminado de grupo configurado.

## Visibilidad del contexto y listas de permitidos

En la seguridad de grupos intervienen dos controles diferentes:

- **Autorización de activación**: quién puede activar el agente (`groupPolicy`, `groups`, `groupAllowFrom`, listas de permitidos específicas del canal).
- **Visibilidad del contexto**: qué contexto suplementario se inyecta en el modelo (texto de respuesta, citas, historial de hilos, metadatos reenviados).

De forma predeterminada, OpenClaw prioriza el comportamiento normal del chat y mantiene el contexto mayormente tal como se recibió. Esto significa que las listas de permitidos deciden principalmente quién puede activar acciones, no son un límite universal de censura para cada fragmento citado o histórico.

<AccordionGroup>
  <Accordion title="El comportamiento actual es específico del canal">
    - Algunos canales ya aplican filtrado basado en el remitente para contexto suplementario en rutas específicas (por ejemplo, inicialización de hilos de Slack, búsquedas de respuestas/hilos de Matrix).
    - Otros canales todavía pasan el contexto de cita/respuesta/reenvío tal como se recibió.

  </Accordion>
  <Accordion title="Dirección de endurecimiento (planificada)">
    - `contextVisibility: "all"` (predeterminado) mantiene el comportamiento actual de tal como se recibió.
    - `contextVisibility: "allowlist"` filtra el contexto suplementario a remitentes incluidos en la lista de permitidos.
    - `contextVisibility: "allowlist_quote"` es `allowlist` más una excepción explícita de cita/respuesta.

    Hasta que este modelo de endurecimiento se implemente de forma coherente en todos los canales, espera diferencias según la superficie.

  </Accordion>
</AccordionGroup>

![Flujo de mensajes de grupo](/images/groups-flow.svg)

Si quieres...

| Objetivo                                      | Qué configurar                                             |
| --------------------------------------------- | ---------------------------------------------------------- |
| Permitir todos los grupos, pero responder solo con @menciones | `groups: { "*": { requireMention: true } }`                |
| Desactivar todas las respuestas de grupo      | `groupPolicy: "disabled"`                                  |
| Solo grupos específicos                       | `groups: { "<group-id>": { ... } }` (sin clave `"*"`)      |
| Solo tú puedes activar en grupos              | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| Reutilizar un conjunto de remitentes de confianza entre canales | `groupAllowFrom: ["accessGroup:operators"]`                |

Para listas de remitentes permitidos reutilizables, consulta [Grupos de acceso](/es/channels/access-groups).

## Claves de sesión

- Las sesiones de grupo usan claves de sesión `agent:<agentId>:<channel>:group:<id>` (las salas/canales usan `agent:<agentId>:<channel>:channel:<id>`).
- Los temas de foros de Telegram agregan `:topic:<threadId>` al id del grupo para que cada tema tenga su propia sesión.
- Los chats directos usan la sesión principal (o por remitente si está configurado).
- Los Heartbeats se omiten para las sesiones de grupo.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Patrón: mensajes directos personales + grupos públicos (un solo agente)

Sí — esto funciona bien si tu tráfico "personal" son **mensajes directos** y tu tráfico "público" son **grupos**.

Por qué: en modo de agente único, los mensajes directos suelen llegar a la clave de sesión **principal** (`agent:main:main`), mientras que los grupos siempre usan claves de sesión **no principales** (`agent:main:<channel>:group:<id>`). Si activas el aislamiento con `mode: "non-main"`, esas sesiones de grupo se ejecutan en el backend de aislamiento configurado mientras tu sesión principal de mensajes directos permanece en el host. Docker es el backend predeterminado si no eliges uno.

Esto te da un solo "cerebro" de agente (espacio de trabajo + memoria compartidos), pero dos posturas de ejecución:

- **Mensajes directos**: herramientas completas (host)
- **Grupos**: aislamiento + herramientas restringidas

<Note>
Si necesitas espacios de trabajo/personas realmente separados ("personal" y "público" no deben mezclarse nunca), usa un segundo agente + vinculaciones. Consulta [Enrutamiento multiagente](/es/concepts/multi-agent).
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
  <Tab title="Los grupos ven solo una carpeta en lista de permitidos">
    ¿Quieres que "los grupos solo puedan ver la carpeta X" en lugar de "sin acceso al host"? Mantén `workspaceAccess: "none"` y monta solo rutas en lista de permitidos dentro del entorno aislado:

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
- Depurar por qué una herramienta está bloqueada: [Aislamiento vs. política de herramientas vs. elevado](/es/gateway/sandbox-vs-tool-policy-vs-elevated)
- Detalles de montajes vinculados: [Aislamiento](/es/gateway/sandboxing#custom-bind-mounts)

## Etiquetas de visualización

- Las etiquetas de interfaz usan `displayName` cuando está disponible, con formato `<channel>:<token>`.
- `#room` está reservado para salas/canales; los chats grupales usan `g-<slug>` (minúsculas, espacios -> `-`, conservar `#@+._-`).

## Política de grupos

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

| Política     | Comportamiento                                               |
| ------------ | ------------------------------------------------------------ |
| `"open"`     | Los grupos omiten las listas de permitidos; la compuerta por mención sigue aplicándose. |
| `"disabled"` | Bloquea por completo todos los mensajes de grupo.            |
| `"allowlist"` | Permite solo grupos/salas que coincidan con la lista de permitidos configurada. |

<AccordionGroup>
  <Accordion title="Notas por canal">
    - `groupPolicy` es independiente de la compuerta por mención (que requiere @menciones).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: usa `groupAllowFrom` (respaldo: `allowFrom` explícito).
    - Signal: `groupAllowFrom` puede coincidir con el id de grupo de Signal entrante o con el teléfono/UUID del remitente.
    - Las aprobaciones de emparejamiento de mensajes directos (entradas de almacén `*-allowFrom`) se aplican solo al acceso por mensajes directos; la autorización de remitentes de grupo sigue siendo explícita para las listas de permitidos de grupo.
    - Discord: la lista de permitidos usa `channels.discord.guilds.<id>.channels`.
    - Slack: la lista de permitidos usa `channels.slack.channels`.
    - Matrix: la lista de permitidos usa `channels.matrix.groups`. Prefiere IDs o alias de sala; la búsqueda por nombre de sala unida es de mejor esfuerzo, y los nombres no resueltos se ignoran en tiempo de ejecución. Usa `channels.matrix.groupAllowFrom` para restringir remitentes; también se admiten listas de permitidos `users` por sala.
    - Los mensajes directos grupales se controlan por separado (`channels.discord.dm.*`, `channels.slack.dm.*`).
    - La lista de permitidos de Telegram puede coincidir con IDs de usuario (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) o nombres de usuario (`"@alice"` o `"alice"`); los prefijos no distinguen mayúsculas de minúsculas.
    - El valor predeterminado es `groupPolicy: "allowlist"`; si tu lista de permitidos de grupo está vacía, los mensajes de grupo se bloquean.
    - Seguridad en tiempo de ejecución: cuando falta por completo un bloque de proveedor (`channels.<provider>` ausente), la política de grupo recurre a un modo cerrado ante fallos (normalmente `allowlist`) en lugar de heredar `channels.defaults.groupPolicy`.

  </Accordion>
</AccordionGroup>

Modelo mental rápido (orden de evaluación para mensajes de grupo):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (abierta/deshabilitada/lista de permitidos).
  </Step>
  <Step title="Group allowlists">
    Listas de permitidos de grupos (`*.groups`, `*.groupAllowFrom`, lista de permitidos específica del canal).
  </Step>
  <Step title="Mention gating">
    Control por mención (`requireMention`, `/activation`).
  </Step>
</Steps>

## Control por mención (predeterminado)

Los mensajes de grupo requieren una mención salvo que se sobrescriba por grupo. Los valores predeterminados viven por subsistema en `*.groups."*"`.

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
    - `mentionPatterns` son patrones regex seguros que no distinguen mayúsculas de minúsculas; se ignoran los patrones no válidos y las formas inseguras con repetición anidada.
    - Las superficies que proporcionan menciones explícitas siguen pasando; los patrones son una alternativa de respaldo.
    - Sobrescritura por agente: `agents.list[].groupChat.mentionPatterns` (útil cuando varios agentes comparten un grupo).
    - El control por mención solo se aplica cuando la detección de menciones es posible (menciones nativas o `mentionPatterns` configurados).
    - Incluir un grupo o remitente en una lista de permitidos no deshabilita el control por mención; establece `requireMention` de ese grupo en `false` cuando todos los mensajes deban activar una respuesta.
    - El contexto del prompt de chat grupal lleva la instrucción resuelta de respuesta silenciosa en cada turno; los archivos del workspace no deben duplicar la mecánica de `NO_REPLY`.
    - Los grupos donde se permiten respuestas silenciosas tratan los turnos limpios vacíos o solo de razonamiento del modelo como silenciosos, equivalente a `NO_REPLY`. Los chats directos hacen lo mismo solo cuando las respuestas silenciosas directas están explícitamente permitidas; de lo contrario, las respuestas vacías siguen siendo turnos de agente fallidos.
    - Los valores predeterminados de Discord viven en `channels.discord.guilds."*"` (sobrescribibles por guild/canal).
    - El contexto de historial de grupo se envuelve de forma uniforme en todos los canales y es **solo pendiente** (mensajes omitidos por el control por mención); usa `messages.groupChat.historyLimit` para el valor predeterminado global y `channels.<channel>.historyLimit` (o `channels.<channel>.accounts.*.historyLimit`) para sobrescrituras. Establécelo en `0` para deshabilitarlo.

  </Accordion>
</AccordionGroup>

## Restricciones de herramientas por grupo/canal (opcional)

Algunas configuraciones de canal admiten restringir qué herramientas están disponibles **dentro de un grupo/sala/canal específico**.

- `tools`: permite/deniega herramientas para todo el grupo.
- `toolsBySender`: sobrescrituras por remitente dentro del grupo. Usa prefijos de clave explícitos: `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` y el comodín `"*"`. Las claves heredadas sin prefijo todavía se aceptan y se emparejan solo como `id:`.

Orden de resolución (gana lo más específico):

<Steps>
  <Step title="Group toolsBySender">
    Coincidencia de `toolsBySender` de grupo/canal.
  </Step>
  <Step title="Group tools">
    `tools` de grupo/canal.
  </Step>
  <Step title="Default toolsBySender">
    Coincidencia de `toolsBySender` predeterminado (`"*"`).
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
Las restricciones de herramientas por grupo/canal se aplican además de la política global/de agente de herramientas (denegar sigue ganando). Algunos canales usan anidamiento distinto para salas/canales (por ejemplo, Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Listas de permitidos de grupos

Cuando se configura `channels.whatsapp.groups`, `channels.telegram.groups` o `channels.imessage.groups`, las claves actúan como una lista de permitidos de grupos. Usa `"*"` para permitir todos los grupos sin dejar de establecer el comportamiento predeterminado de menciones.

<Warning>
Confusión común: la aprobación de emparejamiento de DM no es lo mismo que la autorización de grupo. Para los canales que admiten emparejamiento de DM, el almacén de emparejamiento desbloquea solo los DM. Los comandos de grupo siguen requiriendo autorización explícita del remitente de grupo desde listas de permitidos de configuración como `groupAllowFrom` o la alternativa de configuración documentada para ese canal.
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
- `GroupMembers` (si se conocen)
- `WasMentioned` (resultado del control por mención)
- Los temas de foro de Telegram también incluyen `MessageThreadId` e `IsForum`.

Notas específicas del canal:

- BlueBubbles puede enriquecer opcionalmente los participantes sin nombre de grupos de macOS desde la base de datos local de Contactos antes de rellenar `GroupMembers`. Esto está desactivado de forma predeterminada y solo se ejecuta después de que pase el control normal de grupo.

El prompt del sistema del agente incluye una introducción de grupo en el primer turno de una nueva sesión de grupo. Recuerda al modelo que responda como una persona, evite las tablas Markdown, minimice las líneas vacías y siga el espaciado normal de chat, y evite escribir secuencias literales `\n`. Los nombres de grupo y etiquetas de participantes procedentes del canal se renderizan como metadatos no confiables delimitados, no como instrucciones de sistema en línea.

## Específicos de iMessage

- Prefiere `chat_id:<id>` al enrutar o incluir en listas de permitidos.
- Lista chats: `imsg chats --limit 20`.
- Las respuestas de grupo siempre vuelven al mismo `chat_id`.

## Prompts del sistema de WhatsApp

Consulta [WhatsApp](/es/channels/whatsapp#system-prompts) para ver las reglas canónicas de prompts del sistema de WhatsApp, incluida la resolución de prompts de grupo y directos, el comportamiento de comodines y la semántica de sobrescritura de cuenta.

## Específicos de WhatsApp

Consulta [Mensajes de grupo](/es/channels/group-messages) para el comportamiento exclusivo de WhatsApp (inyección de historial, detalles de manejo de menciones).

## Relacionado

- [Grupos de difusión](/es/channels/broadcast-groups)
- [Enrutamiento de canales](/es/channels/channel-routing)
- [Mensajes de grupo](/es/channels/group-messages)
- [Emparejamiento](/es/channels/pairing)
