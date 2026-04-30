---
read_when:
    - Cambiar el comportamiento del chat grupal o el control de menciones
sidebarTitle: Groups
summary: Comportamiento del chat grupal en todas las superficies (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Grupos
x-i18n:
    generated_at: "2026-04-30T16:27:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: ed9cba03cf4546a20d473e8095a54858530869b27f8934f2680e8dbe987dbf5e
    source_path: channels/groups.md
    workflow: 16
---

OpenClaw trata los chats grupales de forma coherente en todas las superficies: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Introducción para principiantes (2 minutos)

OpenClaw "vive" en tus propias cuentas de mensajería. No hay un usuario de bot de WhatsApp separado. Si **tú** estás en un grupo, OpenClaw puede ver ese grupo y responder allí.

Comportamiento predeterminado:

- Los grupos están restringidos (`groupPolicy: "allowlist"`).
- Las respuestas requieren una mención, a menos que desactives explícitamente la compuerta por mención.
- Las respuestas finales normales en grupos/canales son privadas de forma predeterminada. La salida visible en la sala usa la herramienta `message`.

Traducción: los remitentes en la lista de permitidos pueden activar OpenClaw mencionándolo.

<Note>
**Resumen rápido**

- **El acceso por DM** se controla con `*.allowFrom`.
- **El acceso a grupos** se controla con `*.groupPolicy` + listas de permitidos (`*.groups`, `*.groupAllowFrom`).
- **La activación de respuestas** se controla con la compuerta por mención (`requireMention`, `/activation`).

</Note>

Flujo rápido (qué ocurre con un mensaje de grupo):

```
groupPolicy? disabled -> descartar
groupPolicy? allowlist -> ¿grupo permitido? no -> descartar
requireMention? yes -> ¿mencionado? no -> almacenar solo como contexto
en caso contrario -> responder
```

## Respuestas visibles

Para salas de grupo/canal, OpenClaw usa de forma predeterminada `messages.groupChat.visibleReplies: "message_tool"`.
Esto significa que el agente sigue procesando el turno y puede actualizar la memoria o el estado de la sesión, pero su respuesta final normal no se publica automáticamente de vuelta en la sala. Para hablar de forma visible, el agente usa `message(action=send)`.

Para chats directos y cualquier otro turno de origen, usa `messages.visibleReplies: "message_tool"` para aplicar globalmente el mismo comportamiento de respuesta visible solo mediante herramienta. `messages.groupChat.visibleReplies` sigue siendo la anulación más específica para salas de grupo/canal.

Esto reemplaza el patrón anterior de forzar al modelo a responder `NO_REPLY` para la mayoría de los turnos en modo observación. En el modo solo mediante herramienta, no hacer nada visible simplemente significa no llamar a la herramienta de mensajes.

Los indicadores de escritura se siguen enviando mientras el agente trabaja en modo solo mediante herramienta. El modo de escritura grupal predeterminado se actualiza de "message" a "instant" para estos turnos porque puede que nunca haya texto normal de mensaje del asistente antes de que el agente decida si llamar a la herramienta de mensajes. La configuración explícita del modo de escritura sigue teniendo prioridad.

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
cuando la observación de archivos o la recarga de configuración estén desactivadas en el despliegue.

Para exigir que la salida visible pase por la herramienta de mensajes en todos los chats de origen:

```json5
{
  messages: {
    visibleReplies: "message_tool",
  },
}
```

Los comandos slash nativos (Discord, Telegram y otras superficies con soporte nativo de comandos) omiten `visibleReplies: "message_tool"` y siempre responden de forma visible para que la interfaz de comandos nativa del canal reciba la respuesta que espera. Esto se aplica solo a turnos de comandos nativos validados; los comandos `/...` escritos como texto y los turnos de chat ordinarios siguen el valor predeterminado grupal configurado.

## Visibilidad del contexto y listas de permitidos

Hay dos controles distintos implicados en la seguridad de grupos:

- **Autorización de activación**: quién puede activar el agente (`groupPolicy`, `groups`, `groupAllowFrom`, listas de permitidos específicas del canal).
- **Visibilidad del contexto**: qué contexto suplementario se inyecta en el modelo (texto de respuesta, citas, historial del hilo, metadatos reenviados).

De forma predeterminada, OpenClaw prioriza el comportamiento normal del chat y conserva el contexto casi tal como se recibe. Esto significa que las listas de permitidos deciden principalmente quién puede activar acciones, no un límite universal de redacción para cada fragmento citado o histórico.

<AccordionGroup>
  <Accordion title="El comportamiento actual es específico del canal">
    - Algunos canales ya aplican filtrado basado en remitente para contexto suplementario en rutas específicas (por ejemplo, inicialización de hilos de Slack, búsquedas de respuestas/hilos de Matrix).
    - Otros canales aún pasan el contexto de cita/respuesta/reenvío tal como se recibe.

  </Accordion>
  <Accordion title="Dirección de endurecimiento (planificada)">
    - `contextVisibility: "all"` (predeterminado) mantiene el comportamiento actual tal como se recibe.
    - `contextVisibility: "allowlist"` filtra el contexto suplementario a remitentes en la lista de permitidos.
    - `contextVisibility: "allowlist_quote"` es `allowlist` más una excepción explícita de cita/respuesta.

    Hasta que este modelo de endurecimiento se implemente de forma coherente en todos los canales, espera diferencias según la superficie.

  </Accordion>
</AccordionGroup>

![Flujo de mensajes grupales](/images/groups-flow.svg)

Si quieres...

| Objetivo                                     | Qué configurar                                             |
| -------------------------------------------- | ---------------------------------------------------------- |
| Permitir todos los grupos pero responder solo con @menciones | `groups: { "*": { requireMention: true } }`                |
| Desactivar todas las respuestas grupales     | `groupPolicy: "disabled"`                                  |
| Solo grupos específicos                      | `groups: { "<group-id>": { ... } }` (sin clave `"*"`)      |
| Solo tú puedes activar en grupos             | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## Claves de sesión

- Las sesiones de grupo usan claves de sesión `agent:<agentId>:<channel>:group:<id>` (las salas/canales usan `agent:<agentId>:<channel>:channel:<id>`).
- Los temas de foros de Telegram agregan `:topic:<threadId>` al id de grupo para que cada tema tenga su propia sesión.
- Los chats directos usan la sesión principal (o por remitente, si está configurado).
- Los Heartbeats se omiten en las sesiones de grupo.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Patrón: DM personales + grupos públicos (un solo agente)

Sí: esto funciona bien si tu tráfico "personal" son **DM** y tu tráfico "público" son **grupos**.

Por qué: en el modo de un solo agente, los DM normalmente llegan a la clave de sesión **principal** (`agent:main:main`), mientras que los grupos siempre usan claves de sesión **no principales** (`agent:main:<channel>:group:<id>`). Si activas el aislamiento con `mode: "non-main"`, esas sesiones de grupo se ejecutan en el backend de aislamiento configurado, mientras tu sesión principal de DM permanece en el host. Docker es el backend predeterminado si no eliges uno.

Esto te da un único "cerebro" de agente (espacio de trabajo + memoria compartidos), pero dos posturas de ejecución:

- **DM**: herramientas completas (host)
- **Grupos**: aislamiento + herramientas restringidas

<Note>
Si necesitas espacios de trabajo/personas realmente separados ("personal" y "público" no deben mezclarse nunca), usa un segundo agente + enlaces. Consulta [Enrutamiento multiagente](/es/concepts/multi-agent).
</Note>

<Tabs>
  <Tab title="DM en host, grupos aislados">
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
    ¿Quieres que "los grupos solo puedan ver la carpeta X" en lugar de "sin acceso al host"? Mantén `workspaceAccess: "none"` y monta solo rutas en la lista de permitidos dentro del aislamiento:

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
- Depurar por qué una herramienta está bloqueada: [Aislamiento frente a política de herramientas frente a privilegios elevados](/es/gateway/sandbox-vs-tool-policy-vs-elevated)
- Detalles de montajes bind: [Aislamiento](/es/gateway/sandboxing#custom-bind-mounts)

## Etiquetas de visualización

- Las etiquetas de UI usan `displayName` cuando está disponible, con formato `<channel>:<token>`.
- `#room` está reservado para salas/canales; los chats grupales usan `g-<slug>` (minúsculas, espacios -> `-`, conservar `#@+._-`).

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

| Política     | Comportamiento                                             |
| ------------- | ------------------------------------------------------------ |
| `"open"`      | Los grupos omiten las listas de permitidos; la compuerta por mención sigue aplicándose. |
| `"disabled"`  | Bloquea por completo todos los mensajes grupales.           |
| `"allowlist"` | Permite solo grupos/salas que coincidan con la lista de permitidos configurada. |

<AccordionGroup>
  <Accordion title="Notas por canal">
    - `groupPolicy` es independiente de la compuerta por mención (que requiere @menciones).
    - WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: usa `groupAllowFrom` (alternativa: `allowFrom` explícito).
    - Signal: `groupAllowFrom` puede coincidir con el id de grupo entrante de Signal o con el teléfono/UUID del remitente.
    - Las aprobaciones de emparejamiento por DM (entradas de almacenamiento `*-allowFrom`) se aplican solo al acceso por DM; la autorización de remitentes de grupo sigue siendo explícita para las listas de permitidos de grupo.
    - Discord: la lista de permitidos usa `channels.discord.guilds.<id>.channels`.
    - Slack: la lista de permitidos usa `channels.slack.channels`.
    - Matrix: la lista de permitidos usa `channels.matrix.groups`. Prefiere IDs o alias de sala; la búsqueda de nombres de salas unidas es de mejor esfuerzo, y los nombres no resueltos se ignoran en tiempo de ejecución. Usa `channels.matrix.groupAllowFrom` para restringir remitentes; también se admiten listas de permitidos `users` por sala.
    - Los DM grupales se controlan por separado (`channels.discord.dm.*`, `channels.slack.dm.*`).
    - La lista de permitidos de Telegram puede coincidir con IDs de usuario (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) o nombres de usuario (`"@alice"` o `"alice"`); los prefijos no distinguen mayúsculas y minúsculas.
    - El valor predeterminado es `groupPolicy: "allowlist"`; si la lista de permitidos de grupos está vacía, los mensajes grupales se bloquean.
    - Seguridad en tiempo de ejecución: cuando falta por completo un bloque de proveedor (`channels.<provider>` ausente), la política de grupos recurre a un modo cerrado ante fallos (normalmente `allowlist`) en lugar de heredar `channels.defaults.groupPolicy`.

  </Accordion>
</AccordionGroup>

Modelo mental rápido (orden de evaluación para mensajes grupales):

<Steps>
  <Step title="groupPolicy">
    `groupPolicy` (open/disabled/allowlist).
  </Step>
  <Step title="Listas de permitidos de grupos">
    Listas de permitidos de grupos (`*.groups`, `*.groupAllowFrom`, lista de permitidos específica del canal).
  </Step>
  <Step title="Compuerta por mención">
    Compuerta por mención (`requireMention`, `/activation`).
  </Step>
</Steps>

## Compuerta por mención (predeterminada)

Los mensajes grupales requieren una mención, a menos que se anule por grupo. Los valores predeterminados viven por subsistema en `*.groups."*"`.

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
  <Accordion title="Notas sobre el control por mención">
    - `mentionPatterns` son patrones regex seguros sin distinción entre mayúsculas y minúsculas; los patrones no válidos y las formas inseguras de repetición anidada se ignoran.
    - Las superficies que proporcionan menciones explícitas siguen pasando; los patrones son una alternativa de reserva.
    - Anulación por agente: `agents.list[].groupChat.mentionPatterns` (útil cuando varios agentes comparten un grupo).
    - El control por mención solo se aplica cuando la detección de menciones es posible (menciones nativas o `mentionPatterns` configurados).
    - Incluir un grupo o remitente en la lista de permitidos no desactiva el control por mención; establece `requireMention` de ese grupo en `false` cuando todos los mensajes deban activar una respuesta.
    - El contexto de prompt de chat grupal incluye la instrucción resuelta de respuesta silenciosa en cada turno; los archivos del espacio de trabajo no deben duplicar la mecánica de `NO_REPLY`.
    - Los grupos donde se permiten respuestas silenciosas tratan los turnos limpios vacíos o solo de razonamiento del modelo como silenciosos, equivalentes a `NO_REPLY`. Los chats directos hacen lo mismo solo cuando las respuestas silenciosas directas están permitidas explícitamente; de lo contrario, las respuestas vacías siguen siendo turnos de agente fallidos.
    - Los valores predeterminados de Discord viven en `channels.discord.guilds."*"` (anulables por servidor/canal).
    - El contexto de historial de grupo se envuelve uniformemente en todos los canales y es **solo pendiente** (mensajes omitidos por el control por mención); usa `messages.groupChat.historyLimit` para el valor predeterminado global y `channels.<channel>.historyLimit` (o `channels.<channel>.accounts.*.historyLimit`) para anulaciones. Establece `0` para desactivarlo.

  </Accordion>
</AccordionGroup>

## Restricciones de herramientas de grupo/canal (opcional)

Algunas configuraciones de canal admiten restringir qué herramientas están disponibles **dentro de un grupo/sala/canal específico**.

- `tools`: permite/deniega herramientas para todo el grupo.
- `toolsBySender`: anulaciones por remitente dentro del grupo. Usa prefijos de clave explícitos: `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` y el comodín `"*"`. Las claves heredadas sin prefijo se siguen aceptando y solo coinciden como `id:`.

Orden de resolución (gana el más específico):

<Steps>
  <Step title="toolsBySender de grupo">
    Coincidencia de `toolsBySender` de grupo/canal.
  </Step>
  <Step title="Herramientas de grupo">
    `tools` de grupo/canal.
  </Step>
  <Step title="toolsBySender predeterminado">
    Coincidencia de `toolsBySender` predeterminado (`"*"`).
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
Las restricciones de herramientas de grupo/canal se aplican además de la política global/de agente de herramientas (la denegación sigue ganando). Algunos canales usan una anidación diferente para salas/canales (por ejemplo, Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).
</Note>

## Listas de grupos permitidos

Cuando `channels.whatsapp.groups`, `channels.telegram.groups` o `channels.imessage.groups` están configurados, las claves actúan como una lista de grupos permitidos. Usa `"*"` para permitir todos los grupos y seguir estableciendo el comportamiento predeterminado de mención.

<Warning>
Confusión común: la aprobación de emparejamiento por DM no es lo mismo que la autorización de grupo. Para los canales que admiten emparejamiento por DM, el almacén de emparejamiento desbloquea solo los DM. Los comandos de grupo siguen requiriendo autorización explícita del remitente del grupo mediante listas de permitidos de configuración como `groupAllowFrom` o la alternativa documentada de configuración para ese canal.
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

Los propietarios de grupo pueden alternar la activación por grupo:

- `/activation mention`
- `/activation always`

El propietario se determina mediante `channels.whatsapp.allowFrom` (o el E.164 propio del bot cuando no está definido). Envía el comando como un mensaje independiente. Otras superficies actualmente ignoran `/activation`.

## Campos de contexto

Las cargas entrantes de grupo establecen:

- `ChatType=group`
- `GroupSubject` (si se conoce)
- `GroupMembers` (si se conocen)
- `WasMentioned` (resultado del control por mención)
- Los temas de foro de Telegram también incluyen `MessageThreadId` e `IsForum`.

Notas específicas por canal:

- BlueBubbles puede enriquecer opcionalmente los participantes de grupos de macOS sin nombre desde la base de datos local de Contactos antes de completar `GroupMembers`. Esto está desactivado de forma predeterminada y solo se ejecuta después de que pase el control normal de grupo.

El prompt de sistema del agente incluye una introducción de grupo en el primer turno de una nueva sesión de grupo. Recuerda al modelo que responda como una persona, evite tablas Markdown, minimice las líneas vacías y siga el espaciado normal de chat, y evite escribir secuencias literales `\n`. Los nombres de grupo y las etiquetas de participantes procedentes del canal se representan como metadatos no confiables en bloques delimitados, no como instrucciones de sistema en línea.

## Detalles específicos de iMessage

- Prefiere `chat_id:<id>` al enrutar o incluir en la lista de permitidos.
- Lista chats: `imsg chats --limit 20`.
- Las respuestas de grupo siempre vuelven al mismo `chat_id`.

## Prompts de sistema de WhatsApp

Consulta [WhatsApp](/es/channels/whatsapp#system-prompts) para ver las reglas canónicas de prompts de sistema de WhatsApp, incluida la resolución de prompts de grupo y directos, el comportamiento de comodines y la semántica de anulaciones de cuenta.

## Detalles específicos de WhatsApp

Consulta [Mensajes de grupo](/es/channels/group-messages) para ver el comportamiento exclusivo de WhatsApp (inyección de historial, detalles de manejo de menciones).

## Relacionado

- [Grupos de difusión](/es/channels/broadcast-groups)
- [Enrutamiento de canales](/es/channels/channel-routing)
- [Mensajes de grupo](/es/channels/group-messages)
- [Emparejamiento](/es/channels/pairing)
