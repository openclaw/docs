---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
status: active
summary: 'Enrutamiento de múltiples agentes: agentes aislados, cuentas de canal y bindings'
title: Enrutamiento de múltiples agentes
x-i18n:
    generated_at: "2026-04-24T05:25:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: ef6f91c53a14bf92427f08243930e4aab50ac7853c9b22b0dbdbb853ea1a93d2
    source_path: concepts/multi-agent.md
    workflow: 15
---

Ejecuta varios agentes _aislados_ — cada uno con su propio espacio de trabajo, directorio de estado (`agentDir`) e historial de sesiones — además de varias cuentas de canal (por ejemplo, dos WhatsApps) en un único Gateway en ejecución. Los mensajes entrantes se enrutan al agente correcto mediante bindings.

Un **agente** aquí es el alcance completo por persona: archivos del espacio de trabajo, perfiles de autenticación, registro de modelos y almacén de sesiones. `agentDir` es el directorio de estado en disco que contiene esta configuración por agente en `~/.openclaw/agents/<agentId>/`. Un **binding** asigna una cuenta de canal (por ejemplo, un espacio de trabajo de Slack o un número de WhatsApp) a uno de esos agentes.

## ¿Qué es “un agente”?

Un **agente** es un cerebro con alcance completo y con sus propios:

- **Espacio de trabajo** (archivos, AGENTS.md/SOUL.md/USER.md, notas locales, reglas de personalidad).
- **Directorio de estado** (`agentDir`) para perfiles de autenticación, registro de modelos y configuración por agente.
- **Almacén de sesiones** (historial de chat + estado de enrutamiento) en `~/.openclaw/agents/<agentId>/sessions`.

Los perfiles de autenticación son **por agente**. Cada agente lee desde su propio:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

`sessions_history` también es aquí la ruta más segura para recuperación entre sesiones: devuelve
una vista limitada y saneada, no un volcado sin procesar de la transcripción. La recuperación del asistente elimina
etiquetas de pensamiento, andamiaje `<relevant-memories>`, cargas útiles XML de llamadas a herramientas en texto plano
(incluyendo `<tool_call>...</tool_call>`,
`<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`,
`<function_calls>...</function_calls>` y bloques truncados de llamadas a herramientas),
andamiaje degradado de llamadas a herramientas, tokens filtrados de control del modelo ASCII/de ancho completo,
y XML malformado de llamadas a herramientas de MiniMax antes de la redacción/truncado.

Las credenciales del agente principal **no** se comparten automáticamente. Nunca reutilices `agentDir`
entre agentes (provoca colisiones de autenticación/sesión). Si quieres compartir credenciales,
copia `auth-profiles.json` en el `agentDir` del otro agente.

Las Skills se cargan desde el espacio de trabajo de cada agente más raíces compartidas como
`~/.openclaw/skills`, luego se filtran por la lista permitida efectiva de Skills del agente cuando
está configurada. Usa `agents.defaults.skills` para una base compartida y
`agents.list[].skills` para reemplazo por agente. Consulta
[Skills: per-agent vs shared](/es/tools/skills#per-agent-vs-shared-skills) y
[Skills: agent skill allowlists](/es/tools/skills#agent-skill-allowlists).

Gateway puede alojar **un agente** (predeterminado) o **muchos agentes** en paralelo.

**Nota sobre el espacio de trabajo:** el espacio de trabajo de cada agente es el **cwd predeterminado**, no un
sandbox rígido. Las rutas relativas se resuelven dentro del espacio de trabajo, pero las rutas absolutas pueden
alcanzar otras ubicaciones del host a menos que el sandboxing esté habilitado. Consulta
[Sandboxing](/es/gateway/sandboxing).

## Rutas (mapa rápido)

- Configuración: `~/.openclaw/openclaw.json` (o `OPENCLAW_CONFIG_PATH`)
- Directorio de estado: `~/.openclaw` (o `OPENCLAW_STATE_DIR`)
- Espacio de trabajo: `~/.openclaw/workspace` (o `~/.openclaw/workspace-<agentId>`)
- Directorio del agente: `~/.openclaw/agents/<agentId>/agent` (o `agents.list[].agentDir`)
- Sesiones: `~/.openclaw/agents/<agentId>/sessions`

### Modo de agente único (predeterminado)

Si no haces nada, OpenClaw ejecuta un único agente:

- `agentId` toma el valor predeterminado **`main`**.
- Las sesiones usan claves `agent:main:<mainKey>`.
- El espacio de trabajo toma el valor predeterminado `~/.openclaw/workspace` (o `~/.openclaw/workspace-<profile>` cuando `OPENCLAW_PROFILE` está configurado).
- El estado toma el valor predeterminado `~/.openclaw/agents/main/agent`.

## Asistente de agentes

Usa el asistente de agentes para agregar un nuevo agente aislado:

```bash
openclaw agents add work
```

Luego agrega `bindings` (o deja que el asistente lo haga) para enrutar los mensajes entrantes.

Verifica con:

```bash
openclaw agents list --bindings
```

## Inicio rápido

<Steps>
  <Step title="Crear el espacio de trabajo de cada agente">

Usa el asistente o crea los espacios de trabajo manualmente:

```bash
openclaw agents add coding
openclaw agents add social
```

Cada agente obtiene su propio espacio de trabajo con `SOUL.md`, `AGENTS.md` y `USER.md` opcional, además de un `agentDir` dedicado y un almacén de sesiones en `~/.openclaw/agents/<agentId>`.

  </Step>

  <Step title="Crear cuentas de canal">

Crea una cuenta por agente en tus canales preferidos:

- Discord: un bot por agente, habilita Message Content Intent y copia cada token.
- Telegram: un bot por agente a través de BotFather, copia cada token.
- WhatsApp: vincula cada número de teléfono por cuenta.

```bash
openclaw channels login --channel whatsapp --account work
```

Consulta las guías de canales: [Discord](/es/channels/discord), [Telegram](/es/channels/telegram), [WhatsApp](/es/channels/whatsapp).

  </Step>

  <Step title="Agregar agentes, cuentas y bindings">

Agrega agentes en `agents.list`, cuentas de canal en `channels.<channel>.accounts` y conéctalos con `bindings` (ejemplos abajo).

  </Step>

  <Step title="Reiniciar y verificar">

```bash
openclaw gateway restart
openclaw agents list --bindings
openclaw channels status --probe
```

  </Step>
</Steps>

## Varios agentes = varias personas, varias personalidades

Con **varios agentes**, cada `agentId` se convierte en una **personalidad totalmente aislada**:

- **Diferentes números de teléfono/cuentas** (por `accountId` de canal).
- **Diferentes personalidades** (mediante archivos por agente del espacio de trabajo como `AGENTS.md` y `SOUL.md`).
- **Autenticación + sesiones separadas** (sin interferencias cruzadas salvo que se habiliten explícitamente).

Esto permite que **varias personas** compartan un servidor Gateway mientras mantienen aislados sus “cerebros” de IA y sus datos.

## Búsqueda de memoria QMD entre agentes

Si un agente debe buscar en las transcripciones de sesiones QMD de otro agente, agrega
colecciones adicionales en `agents.list[].memorySearch.qmd.extraCollections`.
Usa `agents.defaults.memorySearch.qmd.extraCollections` solo cuando todos los agentes
deban heredar las mismas colecciones compartidas de transcripciones.

```json5
{
  agents: {
    defaults: {
      workspace: "~/workspaces/main",
      memorySearch: {
        qmd: {
          extraCollections: [{ path: "~/agents/family/sessions", name: "family-sessions" }],
        },
      },
    },
    list: [
      {
        id: "main",
        workspace: "~/workspaces/main",
        memorySearch: {
          qmd: {
            extraCollections: [{ path: "notes" }], // resolves inside workspace -> collection named "notes-main"
          },
        },
      },
      { id: "family", workspace: "~/workspaces/family" },
    ],
  },
  memory: {
    backend: "qmd",
    qmd: { includeDefaultMemory: false },
  },
}
```

La ruta de colección adicional puede compartirse entre agentes, pero el nombre de la colección
permanece explícito cuando la ruta está fuera del espacio de trabajo del agente. Las rutas dentro del
espacio de trabajo siguen estando limitadas al agente para que cada uno conserve su propio conjunto de búsqueda de transcripciones.

## Un número de WhatsApp, varias personas (división de DM)

Puedes enrutar **distintos DMs de WhatsApp** a diferentes agentes mientras permaneces en **una sola cuenta de WhatsApp**. Haz la coincidencia por E.164 del remitente (como `+15551234567`) con `peer.kind: "direct"`. Las respuestas seguirán saliendo desde el mismo número de WhatsApp (sin identidad de remitente por agente).

Detalle importante: los chats directos se agrupan en la **clave de sesión principal** del agente, así que el verdadero aislamiento requiere **un agente por persona**.

Ejemplo:

```json5
{
  agents: {
    list: [
      { id: "alex", workspace: "~/.openclaw/workspace-alex" },
      { id: "mia", workspace: "~/.openclaw/workspace-mia" },
    ],
  },
  bindings: [
    {
      agentId: "alex",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551230001" } },
    },
    {
      agentId: "mia",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551230002" } },
    },
  ],
  channels: {
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551230001", "+15551230002"],
    },
  },
}
```

Notas:

- El control de acceso a DM es **global por cuenta de WhatsApp** (emparejamiento/lista permitida), no por agente.
- Para grupos compartidos, vincula el grupo a un agente o usa [Broadcast groups](/es/channels/broadcast-groups).

## Reglas de enrutamiento (cómo los mensajes eligen un agente)

Los bindings son **deterministas** y **gana el más específico**:

1. coincidencia de `peer` (id exacto de DM/grupo/canal)
2. coincidencia de `parentPeer` (herencia de hilo)
3. `guildId + roles` (enrutamiento por rol de Discord)
4. `guildId` (Discord)
5. `teamId` (Slack)
6. coincidencia de `accountId` para un canal
7. coincidencia a nivel de canal (`accountId: "*"`)
8. fallback al agente predeterminado (`agents.list[].default`, o si no, la primera entrada de la lista; predeterminado: `main`)

Si varios bindings coinciden en el mismo nivel, gana el primero en el orden de la configuración.
Si un binding establece varios campos de coincidencia (por ejemplo `peer` + `guildId`), todos los campos especificados son obligatorios (semántica `AND`).

Detalle importante sobre el alcance de la cuenta:

- Un binding que omite `accountId` coincide solo con la cuenta predeterminada.
- Usa `accountId: "*"` para un fallback de todo el canal en todas las cuentas.
- Si más adelante agregas el mismo binding para el mismo agente con un id de cuenta explícito, OpenClaw actualiza el binding existente solo de canal a uno con alcance de cuenta en lugar de duplicarlo.

## Varias cuentas / varios números de teléfono

Los canales que admiten **varias cuentas** (por ejemplo, WhatsApp) usan `accountId` para identificar
cada inicio de sesión. Cada `accountId` puede enrutarse a un agente diferente, por lo que un servidor puede alojar
varios números de teléfono sin mezclar sesiones.

Si quieres una cuenta predeterminada de todo el canal cuando `accountId` se omite, establece
`channels.<channel>.defaultAccount` (opcional). Si no está configurado, OpenClaw usa
`default` si existe; de lo contrario, el primer id de cuenta configurado (ordenado).

Entre los canales habituales que admiten este patrón están:

- `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`
- `irc`, `line`, `googlechat`, `mattermost`, `matrix`, `nextcloud-talk`
- `bluebubbles`, `zalo`, `zalouser`, `nostr`, `feishu`

## Conceptos

- `agentId`: un “cerebro” (espacio de trabajo, autenticación por agente, almacén de sesiones por agente).
- `accountId`: una instancia de cuenta de canal (por ejemplo, cuenta de WhatsApp `"personal"` frente a `"biz"`).
- `binding`: enruta mensajes entrantes a un `agentId` mediante `(channel, accountId, peer)` y opcionalmente ids de servidor/equipo.
- Los chats directos se agrupan en `agent:<agentId>:<mainKey>` (el “main” por agente; `session.mainKey`).

## Ejemplos de plataformas

### Bots de Discord por agente

Cada cuenta de bot de Discord se asigna a un `accountId` único. Vincula cada cuenta a un agente y mantén listas permitidas por bot.

```json5
{
  agents: {
    list: [
      { id: "main", workspace: "~/.openclaw/workspace-main" },
      { id: "coding", workspace: "~/.openclaw/workspace-coding" },
    ],
  },
  bindings: [
    { agentId: "main", match: { channel: "discord", accountId: "default" } },
    { agentId: "coding", match: { channel: "discord", accountId: "coding" } },
  ],
  channels: {
    discord: {
      groupPolicy: "allowlist",
      accounts: {
        default: {
          token: "DISCORD_BOT_TOKEN_MAIN",
          guilds: {
            "123456789012345678": {
              channels: {
                "222222222222222222": { allow: true, requireMention: false },
              },
            },
          },
        },
        coding: {
          token: "DISCORD_BOT_TOKEN_CODING",
          guilds: {
            "123456789012345678": {
              channels: {
                "333333333333333333": { allow: true, requireMention: false },
              },
            },
          },
        },
      },
    },
  },
}
```

Notas:

- Invita a cada bot al servidor y habilita Message Content Intent.
- Los tokens viven en `channels.discord.accounts.<id>.token` (la cuenta predeterminada puede usar `DISCORD_BOT_TOKEN`).

### Bots de Telegram por agente

```json5
{
  agents: {
    list: [
      { id: "main", workspace: "~/.openclaw/workspace-main" },
      { id: "alerts", workspace: "~/.openclaw/workspace-alerts" },
    ],
  },
  bindings: [
    { agentId: "main", match: { channel: "telegram", accountId: "default" } },
    { agentId: "alerts", match: { channel: "telegram", accountId: "alerts" } },
  ],
  channels: {
    telegram: {
      accounts: {
        default: {
          botToken: "123456:ABC...",
          dmPolicy: "pairing",
        },
        alerts: {
          botToken: "987654:XYZ...",
          dmPolicy: "allowlist",
          allowFrom: ["tg:123456789"],
        },
      },
    },
  },
}
```

Notas:

- Crea un bot por agente con BotFather y copia cada token.
- Los tokens viven en `channels.telegram.accounts.<id>.botToken` (la cuenta predeterminada puede usar `TELEGRAM_BOT_TOKEN`).

### Números de WhatsApp por agente

Vincula cada cuenta antes de iniciar Gateway:

```bash
openclaw channels login --channel whatsapp --account personal
openclaw channels login --channel whatsapp --account biz
```

`~/.openclaw/openclaw.json` (JSON5):

```js
{
  agents: {
    list: [
      {
        id: "home",
        default: true,
        name: "Home",
        workspace: "~/.openclaw/workspace-home",
        agentDir: "~/.openclaw/agents/home/agent",
      },
      {
        id: "work",
        name: "Work",
        workspace: "~/.openclaw/workspace-work",
        agentDir: "~/.openclaw/agents/work/agent",
      },
    ],
  },

  // Enrutamiento determinista: gana la primera coincidencia (la más específica primero).
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

    // Anulación opcional por peer (ejemplo: enviar un grupo específico al agente work).
    {
      agentId: "work",
      match: {
        channel: "whatsapp",
        accountId: "personal",
        peer: { kind: "group", id: "1203630...@g.us" },
      },
    },
  ],

  // Desactivado de forma predeterminada: la mensajería entre agentes debe habilitarse explícitamente + incluirse en la lista permitida.
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },

  channels: {
    whatsapp: {
      accounts: {
        personal: {
          // Anulación opcional. Predeterminado: ~/.openclaw/credentials/whatsapp/personal
          // authDir: "~/.openclaw/credentials/whatsapp/personal",
        },
        biz: {
          // Anulación opcional. Predeterminado: ~/.openclaw/credentials/whatsapp/biz
          // authDir: "~/.openclaw/credentials/whatsapp/biz",
        },
      },
    },
  },
}
```

## Ejemplo: chat diario de WhatsApp + trabajo profundo en Telegram

Divide por canal: enruta WhatsApp a un agente rápido del día a día y Telegram a un agente Opus.

```json5
{
  agents: {
    list: [
      {
        id: "chat",
        name: "Everyday",
        workspace: "~/.openclaw/workspace-chat",
        model: "anthropic/claude-sonnet-4-6",
      },
      {
        id: "opus",
        name: "Deep Work",
        workspace: "~/.openclaw/workspace-opus",
        model: "anthropic/claude-opus-4-6",
      },
    ],
  },
  bindings: [
    { agentId: "chat", match: { channel: "whatsapp" } },
    { agentId: "opus", match: { channel: "telegram" } },
  ],
}
```

Notas:

- Si tienes varias cuentas para un canal, agrega `accountId` al binding (por ejemplo `{ channel: "whatsapp", accountId: "personal" }`).
- Para enrutar un único DM/grupo a Opus mientras mantienes el resto en chat, agrega un binding `match.peer` para ese peer; las coincidencias de peer siempre prevalecen sobre las reglas de todo el canal.

## Ejemplo: mismo canal, un peer a Opus

Mantén WhatsApp en el agente rápido, pero enruta un DM a Opus:

```json5
{
  agents: {
    list: [
      {
        id: "chat",
        name: "Everyday",
        workspace: "~/.openclaw/workspace-chat",
        model: "anthropic/claude-sonnet-4-6",
      },
      {
        id: "opus",
        name: "Deep Work",
        workspace: "~/.openclaw/workspace-opus",
        model: "anthropic/claude-opus-4-6",
      },
    ],
  },
  bindings: [
    {
      agentId: "opus",
      match: { channel: "whatsapp", peer: { kind: "direct", id: "+15551234567" } },
    },
    { agentId: "chat", match: { channel: "whatsapp" } },
  ],
}
```

Los bindings de peer siempre prevalecen, así que mantenlos por encima de la regla de todo el canal.

## Agente familiar vinculado a un grupo de WhatsApp

Vincula un agente familiar dedicado a un único grupo de WhatsApp, con restricción por menciones
y una política de herramientas más estricta:

```json5
{
  agents: {
    list: [
      {
        id: "family",
        name: "Family",
        workspace: "~/.openclaw/workspace-family",
        identity: { name: "Family Bot" },
        groupChat: {
          mentionPatterns: ["@family", "@familybot", "@Family Bot"],
        },
        sandbox: {
          mode: "all",
          scope: "agent",
        },
        tools: {
          allow: [
            "exec",
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "browser", "canvas", "nodes", "cron"],
        },
      },
    ],
  },
  bindings: [
    {
      agentId: "family",
      match: {
        channel: "whatsapp",
        peer: { kind: "group", id: "120363999999999999@g.us" },
      },
    },
  ],
}
```

Notas:

- Las listas allow/deny de herramientas son **tools**, no Skills. Si una Skill necesita ejecutar un
  binario, asegúrate de que `exec` esté permitido y de que el binario exista en el sandbox.
- Para una restricción más estricta, establece `agents.list[].groupChat.mentionPatterns` y mantén
  habilitadas las listas permitidas de grupos para el canal.

## Configuración de sandbox y herramientas por agente

Cada agente puede tener sus propias restricciones de sandbox y herramientas:

```js
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: {
          mode: "off",  // Sin sandbox para el agente personal
        },
        // Sin restricciones de herramientas: todas las herramientas disponibles
      },
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",     // Siempre en sandbox
          scope: "agent",  // Un contenedor por agente
          docker: {
            // Configuración opcional de una sola vez después de crear el contenedor
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],                    // Solo la herramienta read
          deny: ["exec", "write", "edit", "apply_patch"],    // Denegar otras
        },
      },
    ],
  },
}
```

Nota: `setupCommand` vive en `sandbox.docker` y se ejecuta una vez al crear el contenedor.
Las anulaciones por agente de `sandbox.docker.*` se ignoran cuando el alcance resuelto es `"shared"`.

**Beneficios:**

- **Aislamiento de seguridad**: restringe herramientas para agentes no confiables
- **Control de recursos**: aplica sandbox a agentes específicos mientras mantienes otros en el host
- **Políticas flexibles**: distintos permisos por agente

Nota: `tools.elevated` es **global** y se basa en el remitente; no se puede configurar por agente.
Si necesitas límites por agente, usa `agents.list[].tools` para denegar `exec`.
Para el direccionamiento en grupos, usa `agents.list[].groupChat.mentionPatterns` para que las @mentions se asignen limpiamente al agente previsto.

Consulta [Multi-Agent Sandbox & Tools](/es/tools/multi-agent-sandbox-tools) para ver ejemplos detallados.

## Relacionado

- [Enrutamiento de canales](/es/channels/channel-routing) — cómo los mensajes se enrutan a los agentes
- [Subagentes](/es/tools/subagents) — generar ejecuciones de agentes en segundo plano
- [Agentes ACP](/es/tools/acp-agents) — ejecutar arneses externos de programación
- [Presence](/es/concepts/presence) — presencia y disponibilidad del agente
- [Session](/es/concepts/session) — aislamiento y enrutamiento de sesiones
