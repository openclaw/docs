---
read_when:
    - Cambiar el comportamiento del chat grupal o el control por menciones
sidebarTitle: Groups
summary: Comportamiento del chat grupal en las distintas superficies (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Grupos
x-i18n:
    generated_at: "2026-05-04T02:21:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: dea506c011a5d8f6155b2f56aacb236482cb8c5b7457001cb2171fd45932443d
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw trata los chats de grupo de forma coherente en todas las superficies: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Introducción para principiantes (2 minutos)

OpenClaw "vive" en tus propias cuentas de mensajería. No hay un usuario de bot separado de WhatsApp. Si **tú** estás en un grupo, OpenClaw puede ver ese grupo y responder allí.

Comportamiento predeterminado:

- Los grupos están restringidos (`groupPolicy: "allowlist"`).
- Las respuestas requieren una mención, a menos que desactives explícitamente el control por menciones.
- Las respuestas finales normales en grupos/canales son privadas de forma predeterminada. La salida visible en la sala usa la herramienta `message`.

Traducción: los remitentes en la lista de permitidos pueden activar OpenClaw mencionándolo.

<Note>
**TL;DR**

- **El acceso por DM** se controla con `*.allowFrom`.
- **El acceso a grupos** se controla con `*.groupPolicy` + listas de permitidos (`*.groups`, `*.groupAllowFrom`).
- **La activación de respuestas** se controla con el control por menciones (`requireMention`, `/activation`).

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
Esto significa que el agente aún procesa el turno y puede actualizar el estado de memoria/sesión, pero su respuesta final normal no se publica automáticamente de vuelta en la sala. Para hablar de forma visible, el agente usa `message(action=send)`.

Este valor predeterminado depende de un modelo/runtime que llame herramientas de forma fiable. Si los registros muestran
texto del asistente pero `didSendViaMessagingTool: false`, el modelo respondió
en privado en lugar de llamar la herramienta de mensajes. Eso no es un fallo de envío de
Discord/Slack/Telegram. Usa un modelo fiable para llamadas a herramientas en
sesiones de grupo/canal, o establece
`messages.groupChat.visibleReplies: "automatic"` para restaurar las respuestas finales
visibles heredadas.

Si la herramienta de mensajes no está disponible bajo la política de herramientas activa, OpenClaw vuelve
a respuestas visibles automáticas en lugar de suprimir la respuesta silenciosamente.
`openclaw doctor` advierte sobre esta discrepancia.

Para chats directos y cualquier otro turno de origen, usa `messages.visibleReplies: "message_tool"` para aplicar globalmente el mismo comportamiento de respuesta visible solo mediante herramientas. Los harnesses también pueden elegir esto como su valor predeterminado cuando no está configurado; el harness de Codex lo hace para chats directos en modo Codex. `messages.groupChat.visibleReplies` sigue siendo la anulación más específica para salas de grupo/canal.

Esto reemplaza el patrón anterior de forzar al modelo a responder `NO_REPLY` en la mayoría de los turnos en modo observación. En modo solo herramientas, no hacer nada visible simplemente significa no llamar la herramienta de mensajes.

Los indicadores de escritura se siguen enviando mientras el agente trabaja en modo solo herramientas. El modo de escritura predeterminado para grupos se actualiza de "message" a "instant" en estos turnos porque puede que nunca haya texto normal de mensaje del asistente antes de que el agente decida si llamar la herramienta de mensajes. La configuración explícita del modo de escritura sigue teniendo prioridad.

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

El Gateway recarga en caliente la configuración de `messages` después de guardar el archivo. Reinicia solo
cuando la observación de archivos o la recarga de configuración esté desactivada en el despliegue.

Para exigir que la salida visible pase por la herramienta de mensajes en cada chat de origen:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

Los comandos slash nativos (Discord, Telegram y otras superficies con soporte nativo de comandos) omiten `visibleReplies: "message_tool"` y siempre responden de forma visible para que la interfaz nativa de comandos del canal reciba la respuesta que espera. Esto se aplica solo a turnos de comandos nativos validados; los comandos `/...` escritos como texto y los turnos de chat ordinarios siguen usando el valor predeterminado de grupo configurado.

## Visibilidad de contexto y listas de permitidos

Hay dos controles distintos implicados en la seguridad de grupos:

- **Autorización de activación**: quién puede activar al agente (`groupPolicy`, `groups`, `groupAllowFrom`, listas de permitidos específicas del canal).
- **Visibilidad de contexto**: qué contexto complementario se inyecta en el modelo (texto de respuesta, citas, historial de hilos, metadatos reenviados).

De forma predeterminada, OpenClaw prioriza el comportamiento normal de chat y mantiene el contexto casi como se recibió. Esto significa que las listas de permitidos deciden principalmente quién puede activar acciones, no un límite universal de censura para cada fragmento citado o histórico.

<AccordionGroup>
  <Accordion title="El comportamiento actual es específico del canal">
    - Algunos canales ya aplican filtrado basado en remitente para contexto complementario en rutas específicas (por ejemplo, siembra de hilos de Slack, búsquedas de respuesta/hilo de Matrix).
    - Otros canales aún pasan contexto de cita/respuesta/reenvío tal como se recibe.

  </Accordion>
  <Accordion title="Dirección de endurecimiento (planificada)">
    - `contextVisibility: "all"` (predeterminado) mantiene el comportamiento actual tal como se recibe.
    - `contextVisibility: "allowlist"` filtra el contexto complementario a remitentes en la lista de permitidos.
    - `contextVisibility: "allowlist_quote"` es `allowlist` más una excepción explícita de cita/respuesta.

    Hasta que este modelo de endurecimiento se implemente de forma coherente en todos los canales, espera diferencias según la superficie.

  </Accordion>
</AccordionGroup>

![Flujo de mensajes de grupo](/images/groups-flow.svg)

Si quieres...

| Objetivo                                     | Qué configurar                                             |
| -------------------------------------------- | ---------------------------------------------------------- |
| Permitir todos los grupos, pero responder solo a @menciones | `groups: { "*": { requireMention: true } }`                |
| Desactivar todas las respuestas de grupo     | `groupPolicy: "disabled"`                                  |
| Solo grupos específicos                      | `groups: { "<group-id>": { ... } }` (sin clave `"*"` )     |
| Solo tú puedes activar en grupos             | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |
| Reutilizar un conjunto de remitentes de confianza entre canales | `groupAllowFrom: ["accessGroup:operators"]`                |

Para listas reutilizables de remitentes permitidos, consulta [Grupos de acceso](/es/channels/access-groups).

## Claves de sesión

- Las sesiones de grupo usan claves de sesión `agent:<agentId>:<channel>:group:<id>` (las salas/canales usan `agent:<agentId>:<channel>:channel:<id>`).
- Los temas de foros de Telegram agregan `:topic:<threadId>` al id del grupo para que cada tema tenga su propia sesión.
- Los chats directos usan la sesión principal (o una por remitente si está configurado).
- Los Heartbeats se omiten en las sesiones de grupo.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Patrón: DM personales + grupos públicos (un solo agente)

Sí: esto funciona bien si tu tráfico "personal" son **DMs** y tu tráfico "público" son **grupos**.

Por qué: en modo de un solo agente, los DMs suelen llegar a la clave de sesión **principal** (`agent:main:main`), mientras que los grupos siempre usan claves de sesión **no principales** (`agent:main:<channel>:group:<id>`). Si activas el aislamiento con `mode: "non-main"`, esas sesiones de grupo se ejecutan en el backend de sandbox configurado mientras tu sesión principal de DM permanece en el host. Docker es el backend predeterminado si no eliges uno.

Esto te da un "cerebro" de agente (espacio de trabajo + memoria compartidos), pero dos posturas de ejecución:

- **DMs**: herramientas completas (host)
- **Grupos**: sandbox + herramientas restringidas

<Note>
Si necesitas espacios de trabajo/personas realmente separados ("personal" y "público" nunca deben mezclarse), usa un segundo agente + bindings. Consulta [Enrutamiento multiagente](/es/concepts/multi-agent).
</Note>

<Tabs>
  <Tab title="DMs en el host, grupos en sandbox">
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
  <Tab title="Los grupos solo ven una carpeta en lista de permitidos">
    ¿Quieres que "los grupos solo puedan ver la carpeta X" en lugar de "sin acceso al host"? Mantén `workspaceAccess: "none"` y monta solo rutas en lista de permitidos dentro del sandbox:

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

- Las etiquetas de la UI usan `displayName` cuando está disponible, con formato `<channel>:<token>`.
- `#room` está reservado para salas/canales; los chats de grupo usan `g-<slug>` (minúsculas, espacios -> `-`, conserva `#@+._-`).

## Política de grupos

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

| Política      | Comportamiento                                              |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | Los grupos omiten las listas de permitidos; el control por menciones sigue aplicándose. |
| `"disabled"`  | Bloquea por completo todos los mensajes de grupo.            |
| `"allowlist"` | Solo permite grupos/salas que coincidan con la lista de permitidos configurada. |

<AccordionGroup>
  <Accordion title="Notas por canal">
    - `groupPolicy` está separado del control por menciones (que requiere @menciones).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: usa `groupAllowFrom` (alternativa: `allowFrom` explícito).
    - Signal: `groupAllowFrom` puede coincidir con el id de grupo entrante de Signal o con el teléfono/UUID del remitente.
    - Las aprobaciones de emparejamiento por MD (entradas de almacén `*-allowFrom`) se aplican solo al acceso por MD; la autorización de remitentes de grupo sigue siendo explícita mediante listas de permitidos de grupo.
    - Discord: la lista de permitidos usa `channels.discord.guilds.<id>.channels`.
    - Slack: la lista de permitidos usa `channels.slack.channels`.
    - Matrix: la lista de permitidos usa `channels.matrix.groups`. Prefiere IDs de sala o alias; la búsqueda de nombres de salas unidas se realiza en la medida de lo posible, y los nombres sin resolver se ignoran en tiempo de ejecución. Usa `channels.matrix.groupAllowFrom` para restringir remitentes; también se admiten listas de permitidos `users` por sala.
    - Los MD de grupo se controlan por separado (`channels.discord.dm.*`, `channels.slack.dm.*`).
    - La lista de permitidos de Telegram puede coincidir con IDs de usuario (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) o nombres de usuario (`"@alice"` o `"alice"`); los prefijos no distinguen mayúsculas de minúsculas.
    - El valor predeterminado es `groupPolicy: "allowlist"`; si tu lista de permitidos de grupo está vacía, los mensajes de grupo se bloquean.
    - Seguridad en tiempo de ejecución: cuando falta por completo un bloque de proveedor (`channels.<provider>` ausente), la política de grupo recurre a un modo de cierre por defecto (normalmente `allowlist`) en lugar de heredar `channels.defaults.groupPolicy`.

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

Los mensajes de grupo requieren una mención salvo que se anule por grupo. Los valores predeterminados viven por subsistema en `*.groups."*"`.

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
  <Accordion title="Notas del control por menciones">
    - `mentionPatterns` son patrones regex seguros que no distinguen mayúsculas de minúsculas; los patrones no válidos y las formas inseguras de repetición anidada se ignoran.
    - Las superficies que proporcionan menciones explícitas siguen pasando; los patrones son una alternativa.
    - Anulación por agente: `agents.list[].groupChat.mentionPatterns` (útil cuando varios agentes comparten un grupo).
    - El control por menciones solo se aplica cuando la detección de menciones es posible (menciones nativas o `mentionPatterns` configurados).
    - Incluir un grupo o remitente en la lista de permitidos no desactiva el control por menciones; establece `requireMention` de ese grupo en `false` cuando todos los mensajes deban activar una respuesta.
    - El contexto de prompt de chat grupal incluye en cada turno la instrucción resuelta de respuesta silenciosa; los archivos del espacio de trabajo no deben duplicar la mecánica de `NO_REPLY`.
    - Los grupos donde se permiten respuestas silenciosas tratan los turnos de modelo limpios vacíos o solo de razonamiento como silenciosos, equivalentes a `NO_REPLY`. Los chats directos hacen lo mismo solo cuando las respuestas silenciosas directas están permitidas explícitamente; de lo contrario, las respuestas vacías siguen siendo turnos fallidos del agente.
    - Los valores predeterminados de Discord viven en `channels.discord.guilds."*"` (anulables por guild/canal).
    - El contexto del historial de grupo se envuelve de forma uniforme entre canales y es **solo pendiente** (mensajes omitidos por el control por menciones); usa `messages.groupChat.historyLimit` para el valor predeterminado global y `channels.<channel>.historyLimit` (o `channels.<channel>.accounts.*.historyLimit`) para anulaciones. Establece `0` para desactivarlo.

  </Accordion>
</AccordionGroup>

## Restricciones de herramientas por grupo/canal (opcional)

Algunas configuraciones de canal permiten restringir qué herramientas están disponibles **dentro de un grupo/sala/canal específico**.

- `tools`: permite/deniega herramientas para todo el grupo.
- `toolsBySender`: anulaciones por remitente dentro del grupo. Usa prefijos de clave explícitos: `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` y el comodín `"*"`. Las claves heredadas sin prefijo todavía se aceptan y se comparan solo como `id:`.

Orden de resolución (gana el más específico):

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
Las restricciones de herramientas por grupo/canal se aplican además de la política global/de agente para herramientas (la denegación sigue ganando). Algunos canales usan un anidamiento distinto para salas/canales (por ejemplo, Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Listas de permitidos de grupo

Cuando se configura `channels.whatsapp.groups`, `channels.telegram.groups` o `channels.imessage.groups`, las claves actúan como una lista de permitidos de grupo. Usa `"*"` para permitir todos los grupos sin dejar de establecer el comportamiento predeterminado de menciones.

<Warning>
Confusión habitual: la aprobación de emparejamiento por MD no es lo mismo que la autorización de grupo. En los canales que admiten emparejamiento por MD, el almacén de emparejamiento desbloquea solo los MD. Los comandos de grupo siguen requiriendo autorización explícita del remitente del grupo mediante listas de permitidos de configuración como `groupAllowFrom` o la alternativa de configuración documentada para ese canal.
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
  <Tab title="Activadores solo para propietarios (WhatsApp)">
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

## Activación (solo propietarios)

Los propietarios de grupo pueden alternar la activación por grupo:

- `/activation mention`
- `/activation always`

El propietario se determina mediante `channels.whatsapp.allowFrom` (o el E.164 propio del bot cuando no está configurado). Envía el comando como un mensaje independiente. Actualmente, otras superficies ignoran `/activation`.

## Campos de contexto

Las cargas útiles entrantes de grupo establecen:

- `ChatType=group`
- `GroupSubject` (si se conoce)
- `GroupMembers` (si se conocen)
- `WasMentioned` (resultado del control por menciones)
- Los temas de foro de Telegram también incluyen `MessageThreadId` e `IsForum`.

Notas específicas del canal:

- BlueBubbles puede enriquecer opcionalmente los participantes de grupos macOS sin nombre desde la base de datos local de Contactos antes de rellenar `GroupMembers`. Esto está desactivado de forma predeterminada y solo se ejecuta después de que pase el control normal de grupo.

El prompt del sistema del agente incluye una introducción de grupo en el primer turno de una nueva sesión de grupo. Le recuerda al modelo responder como una persona, evitar tablas Markdown, minimizar las líneas vacías y seguir el espaciado normal de chat, y evitar escribir secuencias literales `\n`. Los nombres de grupo y las etiquetas de participantes provenientes del canal se renderizan como metadatos no confiables delimitados por vallas, no como instrucciones del sistema en línea.

## Aspectos específicos de iMessage

- Prefiere `chat_id:<id>` al enrutar o incluir en listas de permitidos.
- Listar chats: `imsg chats --limit 20`.
- Las respuestas de grupo siempre vuelven al mismo `chat_id`.

## Prompts del sistema de WhatsApp

Consulta [WhatsApp](/es/channels/whatsapp#system-prompts) para ver las reglas canónicas de prompts del sistema de WhatsApp, incluida la resolución de prompts de grupo y directos, el comportamiento de comodines y la semántica de anulaciones de cuenta.

## Aspectos específicos de WhatsApp

Consulta [Mensajes de grupo](/es/channels/group-messages) para ver el comportamiento exclusivo de WhatsApp (inyección de historial, detalles del manejo de menciones).

## Relacionado

- [Grupos de difusión](/es/channels/broadcast-groups)
- [Enrutamiento de canales](/es/channels/channel-routing)
- [Mensajes de grupo](/es/channels/group-messages)
- [Emparejamiento](/es/channels/pairing)
