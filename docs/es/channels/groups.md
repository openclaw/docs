---
read_when:
    - Cambiar el comportamiento de los chats grupales o el control por menciones
sidebarTitle: Groups
summary: Comportamiento de los chats grupales en todas las superficies (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Grupos
x-i18n:
    generated_at: "2026-04-30T05:28:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 743dc1ce1a0e5dc5c6d66091854cdcbb8d2b8f7e06b5c1d13c272142265fc998
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw trata los chats de grupo de forma coherente en todas las superficies: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Introducción para principiantes (2 minutos)

OpenClaw "vive" en tus propias cuentas de mensajería. No hay un usuario de bot de WhatsApp separado. Si **tú** estás en un grupo, OpenClaw puede ver ese grupo y responder allí.

Comportamiento predeterminado:

- Los grupos están restringidos (`groupPolicy: "allowlist"`).
- Las respuestas requieren una mención salvo que desactives explícitamente el control por mención.
- Las respuestas finales normales en grupos/canales son privadas de forma predeterminada. La salida visible en la sala usa la herramienta `message`.

Traducción: los remitentes incluidos en la lista de permitidos pueden activar OpenClaw mencionándolo.

<Note>
**Resumen**

- **El acceso por mensaje directo** se controla con `*.allowFrom`.
- **El acceso de grupos** se controla con `*.groupPolicy` + listas de permitidos (`*.groups`, `*.groupAllowFrom`).
- **La activación de respuestas** se controla con el control por mención (`requireMention`, `/activation`).

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
Eso significa que el agente sigue procesando el turno y puede actualizar el estado de memoria/sesión, pero su respuesta final normal no se publica automáticamente de vuelta en la sala. Para hablar de forma visible, el agente usa `message(action=send)`.

Para chats directos y cualquier otro turno de origen, usa `messages.visibleReplies: "message_tool"` para aplicar globalmente el mismo comportamiento de respuesta visible solo mediante herramienta. `messages.groupChat.visibleReplies` sigue siendo la anulación más específica para salas de grupo/canal.

Esto reemplaza el patrón anterior de forzar al modelo a responder `NO_REPLY` en la mayoría de turnos en modo observador. En el modo solo con herramienta, no hacer nada visible simplemente significa no llamar a la herramienta de mensaje.

Los indicadores de escritura se siguen enviando mientras el agente trabaja en modo solo con herramienta. El modo de escritura predeterminado del grupo se actualiza de "message" a "instant" para estos turnos porque puede que nunca haya texto normal de mensaje del asistente antes de que el agente decida si llama a la herramienta de mensaje. La configuración explícita del modo de escritura sigue teniendo prioridad.

Para restaurar las respuestas finales automáticas heredadas para salas de grupo/canal:

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

Para exigir que la salida visible pase por la herramienta de mensaje para cada chat de origen:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

Los comandos slash nativos (Discord, Telegram y otras superficies con compatibilidad nativa con comandos) omiten `visibleReplies: "message_tool"` y siempre responden de forma visible para que la interfaz de comandos nativa del canal reciba la respuesta que espera. Esto se aplica solo a turnos de comando nativo validados; los comandos `/...` escritos como texto y los turnos de chat ordinarios siguen el valor predeterminado de grupo configurado.

## Visibilidad de contexto y listas de permitidos

Hay dos controles distintos implicados en la seguridad de grupos:

- **Autorización de activación**: quién puede activar el agente (`groupPolicy`, `groups`, `groupAllowFrom`, listas de permitidos específicas del canal).
- **Visibilidad de contexto**: qué contexto suplementario se inyecta en el modelo (texto de respuesta, citas, historial de hilos, metadatos reenviados).

De forma predeterminada, OpenClaw prioriza el comportamiento normal del chat y mantiene el contexto mayormente como se recibió. Esto significa que las listas de permitidos deciden principalmente quién puede activar acciones, no una frontera universal de censura para cada fragmento citado o histórico.

<AccordionGroup>
  <Accordion title="El comportamiento actual es específico del canal">
    - Algunos canales ya aplican filtrado basado en remitente para contexto suplementario en rutas específicas (por ejemplo, inicialización de hilos de Slack, búsquedas de respuestas/hilos de Matrix).
    - Otros canales todavía pasan el contexto de cita/respuesta/reenvío tal como se recibió.

  </Accordion>
  <Accordion title="Dirección de endurecimiento (planificada)">
    - `contextVisibility: "all"` (predeterminado) mantiene el comportamiento actual tal como se recibió.
    - `contextVisibility: "allowlist"` filtra el contexto suplementario a remitentes incluidos en la lista de permitidos.
    - `contextVisibility: "allowlist_quote"` es `allowlist` más una excepción explícita para cita/respuesta.

    Hasta que este modelo de endurecimiento se implemente de forma coherente en todos los canales, espera diferencias según la superficie.

  </Accordion>
</AccordionGroup>

![Flujo de mensajes de grupo](/images/groups-flow.svg)

Si quieres...

| Objetivo                                     | Qué configurar                                             |
| -------------------------------------------- | ---------------------------------------------------------- |
| Permitir todos los grupos, pero responder solo con @menciones | `groups: { "*": { requireMention: true } }`                |
| Desactivar todas las respuestas de grupo     | `groupPolicy: "disabled"`                                  |
| Solo grupos específicos                      | `groups: { "<group-id>": { ... } }` (sin clave `"*"` )     |
| Solo tú puedes activar en grupos             | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## Claves de sesión

- Las sesiones de grupo usan claves de sesión `agent:<agentId>:<channel>:group:<id>` (las salas/canales usan `agent:<agentId>:<channel>:channel:<id>`).
- Los temas de foro de Telegram añaden `:topic:<threadId>` al id de grupo para que cada tema tenga su propia sesión.
- Los chats directos usan la sesión principal (o por remitente si está configurado).
- Los Heartbeats se omiten para las sesiones de grupo.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Patrón: mensajes directos personales + grupos públicos (un solo agente)

Sí: esto funciona bien si tu tráfico "personal" son **mensajes directos** y tu tráfico "público" son **grupos**.

Por qué: en modo de agente único, los mensajes directos normalmente llegan a la clave de sesión **principal** (`agent:main:main`), mientras que los grupos siempre usan claves de sesión **no principales** (`agent:main:<channel>:group:<id>`). Si activas el aislamiento con `mode: "non-main"`, esas sesiones de grupo se ejecutan en el backend de sandbox configurado, mientras que tu sesión principal de mensajes directos permanece en el host. Docker es el backend predeterminado si no eliges uno.

Esto te da un "cerebro" de agente (espacio de trabajo + memoria compartidos), pero dos posturas de ejecución:

- **Mensajes directos**: herramientas completas (host)
- **Grupos**: sandbox + herramientas restringidas

<Note>
Si necesitas espacios de trabajo/personas realmente separados ("personal" y "público" nunca deben mezclarse), usa un segundo agente + vinculaciones. Consulta [Enrutamiento multiagente](/es/concepts/multi-agent).
</Note>

<Tabs>
  <Tab title="Mensajes directos en el host, grupos en sandbox">
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

- Claves de configuración y valores predeterminados: [Configuración de Gateway](/es/gateway/config-agents#agentsdefaultssandbox)
- Depurar por qué una herramienta está bloqueada: [Sandbox frente a política de herramientas frente a elevado](/es/gateway/sandbox-vs-tool-policy-vs-elevated)
- Detalles de montajes bind: [Sandboxing](/es/gateway/sandboxing#custom-bind-mounts)

## Etiquetas de visualización

- Las etiquetas de UI usan `displayName` cuando está disponible, con formato `<channel>:<token>`.
- `#room` está reservado para salas/canales; los chats de grupo usan `g-<slug>` (minúsculas, espacios -> `-`, conserva `#@+._-`).

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

| Política      | Comportamiento                                              |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | Los grupos omiten las listas de permitidos; el control por mención sigue aplicándose. |
| `"disabled"`  | Bloquea por completo todos los mensajes de grupo.            |
| `"allowlist"` | Permite solo grupos/salas que coinciden con la lista de permitidos configurada. |

<AccordionGroup>
  <Accordion title="Notas por canal">
    - `groupPolicy` es independiente del control por mención (que requiere @menciones).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: usa `groupAllowFrom` (alternativa: `allowFrom` explícito).
    - Las aprobaciones de emparejamiento por mensaje directo (entradas de almacén `*-allowFrom`) se aplican solo al acceso por mensaje directo; la autorización de remitentes de grupo sigue siendo explícita en las listas de permitidos de grupo.
    - Discord: la lista de permitidos usa `channels.discord.guilds.<id>.channels`.
    - Slack: la lista de permitidos usa `channels.slack.channels`.
    - Matrix: la lista de permitidos usa `channels.matrix.groups`. Prefiere IDs de sala o alias; la búsqueda de nombres de salas unidas es de mejor esfuerzo, y los nombres no resueltos se ignoran en tiempo de ejecución. Usa `channels.matrix.groupAllowFrom` para restringir remitentes; también se admiten listas de permitidos `users` por sala.
    - Los mensajes directos de grupo se controlan por separado (`channels.discord.dm.*`, `channels.slack.dm.*`).
    - La lista de permitidos de Telegram puede coincidir con IDs de usuario (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) o nombres de usuario (`"@alice"` o `"alice"`); los prefijos no distinguen mayúsculas y minúsculas.
    - El valor predeterminado es `groupPolicy: "allowlist"`; si tu lista de permitidos de grupo está vacía, los mensajes de grupo se bloquean.
    - Seguridad en tiempo de ejecución: cuando falta por completo un bloque de proveedor (`channels.<provider>` ausente), la política de grupo recurre a un modo cerrado ante fallos (normalmente `allowlist`) en lugar de heredar `channels.defaults.groupPolicy`.

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
  <Step title="Control por mención">
    Control por mención (`requireMention`, `/activation`).
  </Step>
</Steps>

## Control por mención (predeterminado)

Los mensajes de grupo requieren una mención salvo que se anule por grupo. Los valores predeterminados residen por subsistema en `*.groups."*"`.

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
  <Accordion title="Notas sobre la restricción por mención">
    - `mentionPatterns` son patrones regex seguros que no distinguen mayúsculas y minúsculas; los patrones no válidos y las formas inseguras de repetición anidada se ignoran.
    - Las superficies que proporcionan menciones explícitas siguen pasando; los patrones son una alternativa de respaldo.
    - Anulación por agente: `agents.list[].groupChat.mentionPatterns` (útil cuando varios agentes comparten un grupo).
    - La restricción por mención solo se aplica cuando la detección de menciones es posible (menciones nativas o `mentionPatterns` configurados).
    - El contexto de instrucción de chat grupal lleva la instrucción resuelta de respuesta silenciosa en cada turno; los archivos del espacio de trabajo no deberían duplicar la mecánica de `NO_REPLY`.
    - Los grupos donde se permiten respuestas silenciosas tratan los turnos del modelo vacíos limpios o solo de razonamiento como silenciosos, equivalentes a `NO_REPLY`. Los chats directos hacen lo mismo solo cuando las respuestas silenciosas directas están permitidas explícitamente; de lo contrario, las respuestas vacías siguen siendo turnos fallidos del agente.
    - Los valores predeterminados de Discord viven en `channels.discord.guilds."*"` (se pueden anular por gremio/canal).
    - El contexto de historial de grupo se envuelve de forma uniforme en todos los canales y es **solo pendiente** (mensajes omitidos por la restricción por mención); usa `messages.groupChat.historyLimit` para el valor predeterminado global y `channels.<channel>.historyLimit` (o `channels.<channel>.accounts.*.historyLimit`) para anulaciones. Configura `0` para desactivar.

  </Accordion>
</AccordionGroup>

## Restricciones de herramientas de grupo/canal (opcional)

Algunas configuraciones de canal admiten restringir qué herramientas están disponibles **dentro de un grupo/sala/canal específico**.

- `tools`: permite/deniega herramientas para todo el grupo.
- `toolsBySender`: anulaciones por remitente dentro del grupo. Usa prefijos de clave explícitos: `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` y el comodín `"*"`. Las claves heredadas sin prefijo aún se aceptan y se comparan solo como `id:`.

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
Las restricciones de herramientas de grupo/canal se aplican además de la política global/de agente para herramientas (la denegación sigue prevaleciendo). Algunos canales usan una anidación diferente para salas/canales (por ejemplo, Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Listas de permitidos de grupo

Cuando `channels.whatsapp.groups`, `channels.telegram.groups` o `channels.imessage.groups` están configurados, las claves actúan como una lista de permitidos de grupos. Usa `"*"` para permitir todos los grupos sin dejar de configurar el comportamiento predeterminado de menciones.

<Warning>
Confusión habitual: la aprobación de emparejamiento de mensajes directos no es lo mismo que la autorización de grupo. Para los canales que admiten emparejamiento de mensajes directos, el almacén de emparejamiento solo desbloquea mensajes directos. Los comandos de grupo siguen requiriendo autorización explícita del remitente de grupo mediante listas de permitidos de configuración como `groupAllowFrom` o la alternativa de configuración documentada para ese canal.
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

## Activación (solo propietario)

Los propietarios de grupos pueden alternar la activación por grupo:

- `/activation mention`
- `/activation always`

El propietario se determina mediante `channels.whatsapp.allowFrom` (o el E.164 propio del bot cuando no está configurado). Envía el comando como un mensaje independiente. Otras superficies actualmente ignoran `/activation`.

## Campos de contexto

Las cargas entrantes de grupo establecen:

- `ChatType=group`
- `GroupSubject` (si se conoce)
- `GroupMembers` (si se conoce)
- `WasMentioned` (resultado de la restricción por mención)
- Los temas de foro de Telegram también incluyen `MessageThreadId` e `IsForum`.

Notas específicas del canal:

- BlueBubbles puede enriquecer opcionalmente los participantes sin nombre de grupos de macOS desde la base de datos local de Contactos antes de poblar `GroupMembers`. Esto está desactivado de forma predeterminada y solo se ejecuta después de que pasa la restricción normal de grupo.

La instrucción del sistema del agente incluye una introducción de grupo en el primer turno de una nueva sesión de grupo. Le recuerda al modelo responder como una persona, evitar tablas de Markdown, minimizar las líneas vacías y seguir el espaciado normal del chat, además de evitar escribir secuencias literales `\n`. Los nombres de grupo y las etiquetas de participantes procedentes del canal se representan como metadatos no confiables en bloques cercados, no como instrucciones del sistema en línea.

## Particularidades de iMessage

- Prefiere `chat_id:<id>` al enrutar o incluir en listas de permitidos.
- Listar chats: `imsg chats --limit 20`.
- Las respuestas de grupo siempre vuelven al mismo `chat_id`.

## Instrucciones del sistema de WhatsApp

Consulta [WhatsApp](/es/channels/whatsapp#system-prompts) para ver las reglas canónicas de instrucciones del sistema de WhatsApp, incluida la resolución de instrucciones de grupo y directas, el comportamiento de comodines y la semántica de anulación de cuenta.

## Particularidades de WhatsApp

Consulta [Mensajes de grupo](/es/channels/group-messages) para ver el comportamiento exclusivo de WhatsApp (inyección de historial, detalles de gestión de menciones).

## Relacionado

- [Grupos de difusión](/es/channels/broadcast-groups)
- [Enrutamiento de canales](/es/channels/channel-routing)
- [Mensajes de grupo](/es/channels/group-messages)
- [Emparejamiento](/es/channels/pairing)
