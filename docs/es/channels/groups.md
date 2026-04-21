---
read_when:
    - Cambiar el comportamiento de los chats grupales o la restricción por menciones
summary: Comportamiento de los chats grupales en las distintas superficies (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Grupos
x-i18n:
    generated_at: "2026-04-21T05:12:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: bbcdebd340a2ebb5898fe1eaf52258f65ba434bcf3be010d81b0e74af728aad4
    source_path: channels/groups.md
    workflow: 15
---

# Grupos

OpenClaw trata los chats grupales de forma coherente en las distintas superficies: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Introducción para principiantes (2 minutos)

OpenClaw “vive” en tus propias cuentas de mensajería. No existe un usuario de bot de WhatsApp independiente.
Si **tú** estás en un grupo, OpenClaw puede ver ese grupo y responder allí.

Comportamiento predeterminado:

- Los grupos están restringidos (`groupPolicy: "allowlist"`).
- Las respuestas requieren una mención, a menos que desactives explícitamente la restricción por menciones.

Traducción: los remitentes en la lista de permitidos pueden activar OpenClaw mencionándolo.

> En resumen
>
> - El **acceso por DM** se controla con `*.allowFrom`.
> - El **acceso a grupos** se controla con `*.groupPolicy` + listas de permitidos (`*.groups`, `*.groupAllowFrom`).
> - La **activación de respuestas** se controla con la restricción por menciones (`requireMention`, `/activation`).

Flujo rápido (qué ocurre con un mensaje de grupo):

```
¿groupPolicy? disabled -> descartar
¿groupPolicy? allowlist -> ¿grupo permitido? no -> descartar
¿requireMention? sí -> ¿mencionado? no -> almacenar solo para contexto
en otro caso -> responder
```

## Visibilidad del contexto y listas de permitidos

En la seguridad de grupos intervienen dos controles distintos:

- **Autorización de activación**: quién puede activar el agente (`groupPolicy`, `groups`, `groupAllowFrom`, listas de permitidos específicas del canal).
- **Visibilidad del contexto**: qué contexto complementario se inyecta en el modelo (texto de respuesta, citas, historial del hilo, metadatos reenviados).

De forma predeterminada, OpenClaw prioriza el comportamiento normal del chat y mantiene el contexto, en su mayor parte, tal como se recibe. Esto significa que las listas de permitidos deciden principalmente quién puede activar acciones, no un límite universal de redacción para cada fragmento citado o histórico.

El comportamiento actual depende del canal:

- Algunos canales ya aplican filtrado por remitente al contexto complementario en rutas concretas (por ejemplo, siembra de hilos en Slack, búsquedas de respuestas/hilos en Matrix).
- Otros canales todavía pasan el contexto de citas/respuestas/reenvíos tal como se recibe.

Dirección de endurecimiento (planificada):

- `contextVisibility: "all"` (predeterminado) mantiene el comportamiento actual tal como se recibe.
- `contextVisibility: "allowlist"` filtra el contexto complementario a remitentes en la lista de permitidos.
- `contextVisibility: "allowlist_quote"` es `allowlist` más una excepción explícita para una cita/respuesta.

Hasta que este modelo de endurecimiento se implemente de forma coherente en todos los canales, espera diferencias según la superficie.

![Flujo de mensajes grupales](/images/groups-flow.svg)

Si quieres...

| Objetivo                                     | Qué configurar                                             |
| -------------------------------------------- | ---------------------------------------------------------- |
| Permitir todos los grupos pero responder solo a @mentions | `groups: { "*": { requireMention: true } }`                |
| Desactivar todas las respuestas en grupos    | `groupPolicy: "disabled"`                                  |
| Solo grupos específicos                      | `groups: { "<group-id>": { ... } }` (sin clave `"*"`)      |
| Solo tú puedes activar en grupos             | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## Claves de sesión

- Las sesiones de grupo usan claves de sesión `agent:<agentId>:<channel>:group:<id>` (las salas/canales usan `agent:<agentId>:<channel>:channel:<id>`).
- Los temas de foros de Telegram añaden `:topic:<threadId>` al id del grupo para que cada tema tenga su propia sesión.
- Los chats directos usan la sesión principal (o una por remitente si está configurado).
- Los Heartbeats se omiten para las sesiones de grupo.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Patrón: DMs personales + grupos públicos (un solo agente)

Sí: esto funciona bien si tu tráfico “personal” son los **DMs** y tu tráfico “público” son los **grupos**.

Por qué: en el modo de un solo agente, los DMs normalmente llegan a la clave de sesión **principal** (`agent:main:main`), mientras que los grupos siempre usan claves de sesión **no principales** (`agent:main:<channel>:group:<id>`). Si activas el aislamiento con `mode: "non-main"`, esas sesiones de grupo se ejecutan en el backend aislado configurado, mientras que tu sesión principal de DM permanece en el host. Docker es el backend predeterminado si no eliges uno.

Esto te da un único “cerebro” de agente (espacio de trabajo + memoria compartidos), pero dos posturas de ejecución:

- **DMs**: herramientas completas (host)
- **Grupos**: sandbox + herramientas restringidas

> Si necesitas espacios de trabajo/personas realmente separados (“personal” y “público” nunca deben mezclarse), usa un segundo agente + bindings. Consulta [Enrutamiento de múltiples agentes](/es/concepts/multi-agent).

Ejemplo (DMs en host, grupos en sandbox + herramientas solo de mensajería):

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

¿Quieres que “los grupos solo puedan ver la carpeta X” en lugar de “sin acceso al host”? Mantén `workspaceAccess: "none"` y monta solo rutas en la lista de permitidos dentro del sandbox:

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

Relacionado:

- Claves de configuración y valores predeterminados: [Configuración del Gateway](/es/gateway/configuration-reference#agentsdefaultssandbox)
- Depuración de por qué una herramienta está bloqueada: [Sandbox vs Política de herramientas vs Elevado](/es/gateway/sandbox-vs-tool-policy-vs-elevated)
- Detalles de los bind mounts: [Sandboxing](/es/gateway/sandboxing#custom-bind-mounts)

## Etiquetas de visualización

- Las etiquetas de la UI usan `displayName` cuando está disponible, con el formato `<channel>:<token>`.
- `#room` se reserva para salas/canales; los chats grupales usan `g-<slug>` (minúsculas, espacios -> `-`, conservar `#@+._-`).

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

| Política      | Comportamiento                                              |
| ------------- | ----------------------------------------------------------- |
| `"open"`      | Los grupos omiten las listas de permitidos; la restricción por menciones sigue aplicándose. |
| `"disabled"`  | Bloquea por completo todos los mensajes de grupo.           |
| `"allowlist"` | Solo permite grupos/salas que coincidan con la lista de permitidos configurada. |

Notas:

- `groupPolicy` es independiente de la restricción por menciones (que requiere @mentions).
- WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: usan `groupAllowFrom` (respaldo: `allowFrom` explícito).
- Las aprobaciones de emparejamiento de DM (entradas del almacén `*-allowFrom`) se aplican solo al acceso por DM; la autorización de remitentes en grupos sigue siendo explícita mediante listas de permitidos de grupos.
- Discord: la lista de permitidos usa `channels.discord.guilds.<id>.channels`.
- Slack: la lista de permitidos usa `channels.slack.channels`.
- Matrix: la lista de permitidos usa `channels.matrix.groups`. Prefiere IDs o alias de salas; la resolución de nombres de salas unidas se hace con el mejor esfuerzo, y los nombres no resueltos se ignoran en tiempo de ejecución. Usa `channels.matrix.groupAllowFrom` para restringir remitentes; también se admiten listas de permitidos `users` por sala.
- Los DMs de grupo se controlan por separado (`channels.discord.dm.*`, `channels.slack.dm.*`).
- La lista de permitidos de Telegram puede coincidir con IDs de usuario (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) o nombres de usuario (`"@alice"` o `"alice"`); los prefijos no distinguen mayúsculas de minúsculas.
- El valor predeterminado es `groupPolicy: "allowlist"`; si tu lista de permitidos de grupos está vacía, los mensajes de grupo se bloquean.
- Seguridad en tiempo de ejecución: cuando falta por completo un bloque de proveedor (`channels.<provider>` ausente), la política de grupos recurre a un modo de cierre por defecto seguro (normalmente `allowlist`) en lugar de heredar `channels.defaults.groupPolicy`.

Modelo mental rápido (orden de evaluación para mensajes de grupo):

1. `groupPolicy` (open/disabled/allowlist)
2. listas de permitidos de grupo (`*.groups`, `*.groupAllowFrom`, lista de permitidos específica del canal)
3. restricción por menciones (`requireMention`, `/activation`)

## Restricción por menciones (predeterminado)

Los mensajes de grupo requieren una mención, a menos que se reemplace por grupo. Los valores predeterminados viven por subsistema en `*.groups."*"`.

Responder a un mensaje del bot cuenta como una mención implícita cuando el canal
admite metadatos de respuesta. Citar un mensaje del bot también puede contar como una mención implícita en los canales que exponen metadatos de cita. Los casos integrados actuales incluyen
Telegram, WhatsApp, Slack, Discord, Microsoft Teams y ZaloUser.

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

Notas:

- `mentionPatterns` son patrones regex seguros que no distinguen mayúsculas de minúsculas; los patrones no válidos y las formas inseguras de repetición anidada se ignoran.
- Las superficies que proporcionan menciones explícitas siguen pasando; los patrones son un respaldo.
- Reemplazo por agente: `agents.list[].groupChat.mentionPatterns` (útil cuando varios agentes comparten un grupo).
- La restricción por menciones solo se aplica cuando la detección de menciones es posible (menciones nativas o `mentionPatterns` configurados).
- Los valores predeterminados de Discord viven en `channels.discord.guilds."*"` (reemplazables por guild/channel).
- El contexto del historial de grupo se encapsula de forma uniforme en todos los canales y es **solo de pendientes** (mensajes omitidos por la restricción por menciones); usa `messages.groupChat.historyLimit` para el valor predeterminado global y `channels.<channel>.historyLimit` (o `channels.<channel>.accounts.*.historyLimit`) para reemplazos. Establece `0` para desactivarlo.

## Restricciones de herramientas por grupo/canal (opcional)

Algunas configuraciones de canal admiten restringir qué herramientas están disponibles **dentro de un grupo/sala/canal específico**.

- `tools`: permite/deniega herramientas para todo el grupo.
- `toolsBySender`: reemplazos por remitente dentro del grupo.
  Usa prefijos de clave explícitos:
  `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` y comodín `"*"`.
  Las claves heredadas sin prefijo siguen aceptándose y solo coinciden como `id:`.

Orden de resolución (gana el más específico):

1. coincidencia de `toolsBySender` del grupo/canal
2. `tools` del grupo/canal
3. coincidencia predeterminada (`"*"`) de `toolsBySender`
4. `tools` predeterminado (`"*"`)

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

Notas:

- Las restricciones de herramientas por grupo/canal se aplican además de la política global/de agente de herramientas (la denegación sigue prevaleciendo).
- Algunos canales usan un anidamiento distinto para salas/canales (por ejemplo, Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).

## Listas de permitidos de grupos

Cuando se configura `channels.whatsapp.groups`, `channels.telegram.groups` o `channels.imessage.groups`, las claves actúan como una lista de permitidos de grupos. Usa `"*"` para permitir todos los grupos y seguir definiendo el comportamiento predeterminado de menciones.

Confusión común: la aprobación de emparejamiento de DM no es lo mismo que la autorización de grupo.
En los canales que admiten emparejamiento de DM, el almacén de emparejamientos desbloquea solo los DMs. Los comandos de grupo siguen requiriendo autorización explícita del remitente del grupo desde listas de permitidos de configuración como `groupAllowFrom` o el respaldo de configuración documentado para ese canal.

Intenciones comunes (copiar/pegar):

1. Desactivar todas las respuestas en grupos

```json5
{
  channels: { whatsapp: { groupPolicy: "disabled" } },
}
```

2. Permitir solo grupos específicos (WhatsApp)

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

3. Permitir todos los grupos pero requerir mención (explícito)

```json5
{
  channels: {
    whatsapp: {
      groups: { "*": { requireMention: true } },
    },
  },
}
```

4. Solo el propietario puede activar en grupos (WhatsApp)

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

## Activación (solo propietario)

Los propietarios de grupos pueden alternar la activación por grupo:

- `/activation mention`
- `/activation always`

El propietario se determina por `channels.whatsapp.allowFrom` (o el E.164 propio del bot si no está configurado). Envía el comando como un mensaje independiente. Otras superficies actualmente ignoran `/activation`.

## Campos de contexto

Las cargas útiles entrantes de grupos establecen:

- `ChatType=group`
- `GroupSubject` (si se conoce)
- `GroupMembers` (si se conoce)
- `WasMentioned` (resultado de la restricción por menciones)
- Los temas de foros de Telegram también incluyen `MessageThreadId` e `IsForum`.

Notas específicas del canal:

- BlueBubbles puede enriquecer opcionalmente a participantes sin nombre de grupos de macOS desde la base de datos local de Contactos antes de completar `GroupMembers`. Esto está desactivado de forma predeterminada y solo se ejecuta después de que pase la restricción normal de grupos.

El prompt del sistema del agente incluye una introducción de grupo en el primer turno de una nueva sesión de grupo. Le recuerda al modelo que responda como un humano, evite tablas Markdown, minimice las líneas vacías y siga el espaciado normal del chat, y que evite escribir secuencias literales `\n`.

## Detalles específicos de iMessage

- Prefiere `chat_id:<id>` al enrutar o incluir en listas de permitidos.
- Listar chats: `imsg chats --limit 20`.
- Las respuestas en grupos siempre vuelven al mismo `chat_id`.

## Detalles específicos de WhatsApp

Consulta [Mensajes de grupo](/es/channels/group-messages) para el comportamiento exclusivo de WhatsApp (inyección de historial, detalles del manejo de menciones).
