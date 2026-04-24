---
read_when:
    - Cambiar el comportamiento del chat grupal o la restricción por menciones
summary: Comportamiento del chat grupal en todas las superficies (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Grupos
x-i18n:
    generated_at: "2026-04-24T05:19:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: c014d6e08649c8dfd221640435b1d5cf93758bf10b4b6c1a536532e07f622d7b
    source_path: channels/groups.md
    workflow: 15
---

OpenClaw trata los chats grupales de forma coherente en todas las superficies: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Introducción para principiantes (2 minutos)

OpenClaw “vive” en tus propias cuentas de mensajería. No hay un usuario de bot de WhatsApp independiente.
Si **tú** estás en un grupo, OpenClaw puede ver ese grupo y responder allí.

Comportamiento predeterminado:

- Los grupos están restringidos (`groupPolicy: "allowlist"`).
- Las respuestas requieren una mención, a menos que desactives explícitamente la restricción por menciones.

En otras palabras: los remitentes en la lista permitida pueden activar OpenClaw mencionándolo.

> En resumen
>
> - El **acceso por DM** se controla con `*.allowFrom`.
> - El **acceso a grupos** se controla con `*.groupPolicy` + listas permitidas (`*.groups`, `*.groupAllowFrom`).
> - La **activación de respuestas** se controla con la restricción por menciones (`requireMention`, `/activation`).

Flujo rápido (qué ocurre con un mensaje grupal):

```
groupPolicy? disabled -> drop
groupPolicy? allowlist -> group allowed? no -> drop
requireMention? yes -> mentioned? no -> store for context only
otherwise -> reply
```

## Visibilidad del contexto y listas permitidas

Hay dos controles diferentes implicados en la seguridad de grupos:

- **Autorización de activación**: quién puede activar el agente (`groupPolicy`, `groups`, `groupAllowFrom`, listas permitidas específicas del canal).
- **Visibilidad del contexto**: qué contexto complementario se inyecta en el modelo (texto de respuesta, citas, historial del hilo, metadatos reenviados).

De forma predeterminada, OpenClaw prioriza el comportamiento normal del chat y conserva el contexto mayormente tal como se recibe. Esto significa que las listas permitidas deciden principalmente quién puede activar acciones, no un límite universal de redacción para cada fragmento citado o histórico.

El comportamiento actual depende del canal:

- Algunos canales ya aplican filtrado basado en remitente para contexto complementario en rutas específicas (por ejemplo, inicialización de hilos de Slack, búsquedas de respuestas/hilos de Matrix).
- Otros canales todavía pasan el contexto de cita/respuesta/reenvío tal como se recibe.

Dirección de refuerzo (planificada):

- `contextVisibility: "all"` (predeterminado) mantiene el comportamiento actual tal como se recibe.
- `contextVisibility: "allowlist"` filtra el contexto complementario para dejar solo remitentes en la lista permitida.
- `contextVisibility: "allowlist_quote"` es `allowlist` más una excepción explícita de cita/respuesta.

Hasta que este modelo de refuerzo se implemente de forma coherente en todos los canales, espera diferencias según la superficie.

![Flujo de mensajes grupales](/images/groups-flow.svg)

Si quieres...

| Objetivo | Qué configurar |
| -------------------------------------------- | ---------------------------------------------------------- |
| Permitir todos los grupos pero responder solo a @mentions | `groups: { "*": { requireMention: true } }` |
| Desactivar todas las respuestas en grupos | `groupPolicy: "disabled"` |
| Solo grupos específicos | `groups: { "<group-id>": { ... } }` (sin clave `"*"`) |
| Solo tú puedes activar en grupos | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## Claves de sesión

- Las sesiones de grupo usan claves de sesión `agent:<agentId>:<channel>:group:<id>` (las salas/canales usan `agent:<agentId>:<channel>:channel:<id>`).
- Los temas de foros de Telegram agregan `:topic:<threadId>` al id del grupo para que cada tema tenga su propia sesión.
- Los chats directos usan la sesión principal (o por remitente si está configurado).
- Los Heartbeats se omiten para las sesiones de grupo.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Patrón: DMs personales + grupos públicos (agente único)

Sí: esto funciona bien si tu tráfico “personal” son **DMs** y tu tráfico “público” son **grupos**.

Por qué: en el modo de agente único, los DMs normalmente llegan a la clave de sesión **principal** (`agent:main:main`), mientras que los grupos siempre usan claves de sesión **no principales** (`agent:main:<channel>:group:<id>`). Si habilitas el sandbox con `mode: "non-main"`, esas sesiones de grupo se ejecutan en el backend de sandbox configurado, mientras que tu sesión principal de DM se mantiene en el host. Docker es el backend predeterminado si no eliges uno.

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

¿Quieres “los grupos solo pueden ver la carpeta X” en lugar de “sin acceso al host”? Mantén `workspaceAccess: "none"` y monta solo rutas de la lista permitida en el sandbox:

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

- Claves de configuración y valores predeterminados: [Configuración de Gateway](/es/gateway/config-agents#agentsdefaultssandbox)
- Depurar por qué una herramienta está bloqueada: [Sandbox vs Tool Policy vs Elevated](/es/gateway/sandbox-vs-tool-policy-vs-elevated)
- Detalles de bind mounts: [Sandboxing](/es/gateway/sandboxing#custom-bind-mounts)

## Etiquetas de visualización

- Las etiquetas de la UI usan `displayName` cuando está disponible, con el formato `<channel>:<token>`.
- `#room` está reservado para salas/canales; los chats grupales usan `g-<slug>` (minúsculas, espacios -> `-`, conservar `#@+._-`).

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

| Política | Comportamiento |
| ------------- | ------------------------------------------------------------ |
| `"open"` | Los grupos omiten las listas permitidas; la restricción por menciones sigue aplicándose. |
| `"disabled"` | Bloquea por completo todos los mensajes grupales. |
| `"allowlist"` | Solo permite grupos/salas que coinciden con la lista permitida configurada. |

Notas:

- `groupPolicy` es independiente de la restricción por menciones (que requiere @mentions).
- WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: usa `groupAllowFrom` (alternativa: `allowFrom` explícito).
- Las aprobaciones de emparejamiento de DM (entradas almacenadas en `*-allowFrom`) se aplican solo al acceso por DM; la autorización de remitentes en grupos sigue siendo explícita en las listas permitidas de grupo.
- Discord: la lista permitida usa `channels.discord.guilds.<id>.channels`.
- Slack: la lista permitida usa `channels.slack.channels`.
- Matrix: la lista permitida usa `channels.matrix.groups`. Prefiere ids o alias de sala; la búsqueda por nombre de sala unida es de mejor esfuerzo, y los nombres no resueltos se ignoran en tiempo de ejecución. Usa `channels.matrix.groupAllowFrom` para restringir remitentes; también se admiten listas permitidas `users` por sala.
- Los DMs grupales se controlan por separado (`channels.discord.dm.*`, `channels.slack.dm.*`).
- La lista permitida de Telegram puede coincidir con ids de usuario (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) o nombres de usuario (`"@alice"` o `"alice"`); los prefijos no distinguen mayúsculas de minúsculas.
- El valor predeterminado es `groupPolicy: "allowlist"`; si tu lista permitida de grupos está vacía, los mensajes grupales se bloquean.
- Seguridad en tiempo de ejecución: cuando falta por completo un bloque del proveedor (`channels.<provider>` ausente), la política de grupo recurre a un modo cerrado por defecto (normalmente `allowlist`) en lugar de heredar `channels.defaults.groupPolicy`.

Modelo mental rápido (orden de evaluación para mensajes grupales):

1. `groupPolicy` (open/disabled/allowlist)
2. listas permitidas de grupo (`*.groups`, `*.groupAllowFrom`, lista permitida específica del canal)
3. restricción por menciones (`requireMention`, `/activation`)

## Restricción por menciones (predeterminada)

Los mensajes grupales requieren una mención, salvo que se anule por grupo. Los valores predeterminados viven por subsistema en `*.groups."*"`.

Responder a un mensaje del bot cuenta como una mención implícita cuando el canal
admite metadatos de respuesta. Citar un mensaje del bot también puede contar como una mención implícita
en canales que exponen metadatos de cita. Los casos integrados actuales incluyen
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
- Las superficies que proporcionan menciones explícitas siguen funcionando; los patrones son una alternativa.
- Anulación por agente: `agents.list[].groupChat.mentionPatterns` (útil cuando varios agentes comparten un grupo).
- La restricción por menciones solo se aplica cuando es posible detectar menciones (menciones nativas o `mentionPatterns` configurados).
- Los valores predeterminados de Discord viven en `channels.discord.guilds."*"` (se pueden anular por servidor/canal).
- El contexto del historial de grupo se envuelve de manera uniforme entre canales y es **solo pendiente** (mensajes omitidos por la restricción por menciones); usa `messages.groupChat.historyLimit` para el valor predeterminado global y `channels.<channel>.historyLimit` (o `channels.<channel>.accounts.*.historyLimit`) para las anulaciones. Establece `0` para desactivarlo.

## Restricciones de herramientas por grupo/canal (opcional)

Algunas configuraciones de canal permiten restringir qué herramientas están disponibles **dentro de un grupo/sala/canal específico**.

- `tools`: permitir/denegar herramientas para todo el grupo.
- `toolsBySender`: anulaciones por remitente dentro del grupo.
  Usa prefijos de clave explícitos:
  `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` y comodín `"*"`.
  Las claves heredadas sin prefijo siguen aceptándose y se emparejan solo como `id:`.

Orden de resolución (gana el más específico):

1. coincidencia de `toolsBySender` del grupo/canal
2. `tools` del grupo/canal
3. coincidencia de `toolsBySender` predeterminada (`"*"` )
4. `tools` predeterminada (`"*"`)

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

- Las restricciones de herramientas por grupo/canal se aplican además de la política global/de agente de herramientas (deny sigue prevaleciendo).
- Algunos canales usan una anidación diferente para salas/canales (por ejemplo, Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).

## Listas permitidas de grupo

Cuando se configura `channels.whatsapp.groups`, `channels.telegram.groups` o `channels.imessage.groups`, las claves actúan como una lista permitida de grupos. Usa `"*"` para permitir todos los grupos y seguir configurando el comportamiento predeterminado de menciones.

Confusión habitual: la aprobación de emparejamiento por DM no es lo mismo que la autorización de grupo.
En los canales que admiten emparejamiento por DM, el almacenamiento de emparejamiento desbloquea solo los DMs. Los comandos de grupo siguen requiriendo autorización explícita del remitente del grupo desde listas permitidas de configuración como `groupAllowFrom` o la alternativa de configuración documentada para ese canal.

Intenciones habituales (copiar/pegar):

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

3. Permitir todos los grupos pero exigir mención (explícito)

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

El propietario se determina mediante `channels.whatsapp.allowFrom` (o el E.164 propio del bot cuando no está configurado). Envía el comando como un mensaje independiente. Actualmente, otras superficies ignoran `/activation`.

## Campos de contexto

Las cargas útiles entrantes de grupo establecen:

- `ChatType=group`
- `GroupSubject` (si se conoce)
- `GroupMembers` (si se conoce)
- `WasMentioned` (resultado de la restricción por menciones)
- Los temas de foros de Telegram también incluyen `MessageThreadId` e `IsForum`.

Notas específicas del canal:

- BlueBubbles puede enriquecer opcionalmente a los participantes sin nombre de grupos de macOS desde la base de datos local de Contactos antes de completar `GroupMembers`. Esto está desactivado de forma predeterminada y solo se ejecuta después de que pase la restricción normal de grupo.

El prompt del sistema del agente incluye una introducción de grupo en el primer turno de una nueva sesión de grupo. Le recuerda al modelo que responda como una persona, evite tablas Markdown, minimice las líneas vacías, siga el espaciado normal del chat y evite escribir secuencias literales `\n`. Los nombres de grupo y las etiquetas de participantes obtenidos del canal se representan como metadatos no confiables delimitados, no como instrucciones del sistema en línea.

## Aspectos específicos de iMessage

- Prefiere `chat_id:<id>` al enrutar o usar listas permitidas.
- Enumerar chats: `imsg chats --limit 20`.
- Las respuestas de grupo siempre vuelven al mismo `chat_id`.

## Prompts del sistema de WhatsApp

Consulta [WhatsApp](/es/channels/whatsapp#system-prompts) para las reglas canónicas de prompts del sistema de WhatsApp, incluida la resolución de prompts grupales y directos, el comportamiento de comodines y la semántica de anulación por cuenta.

## Aspectos específicos de WhatsApp

Consulta [Mensajes de grupo](/es/channels/group-messages) para el comportamiento exclusivo de WhatsApp (inyección de historial, detalles del manejo de menciones).

## Relacionado

- [Mensajes de grupo](/es/channels/group-messages)
- [Grupos de difusión](/es/channels/broadcast-groups)
- [Enrutamiento de canales](/es/channels/channel-routing)
- [Emparejamiento](/es/channels/pairing)
