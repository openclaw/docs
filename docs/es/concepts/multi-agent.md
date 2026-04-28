---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: 'Enrutamiento de varios agentes: agentes aislados, cuentas de canal y bindings'
title: Enrutamiento de varios agentes
x-i18n:
    generated_at: "2026-04-26T11:27:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: 845149ac1076d4746cc5038bd4444c2fc6117710f724b8cabdc31dc9ef6abbe8
    source_path: concepts/multi-agent.md
    workflow: 15
---

Ejecuta varios agentes _aislados_ — cada uno con su propio workspace, directorio de estado (`agentDir`) e historial de sesiones — además de varias cuentas de canal (por ejemplo, dos cuentas de WhatsApp) en un único Gateway en ejecución. Los mensajes entrantes se enrutan al agente correcto mediante bindings.

Un **agente** aquí es el alcance completo por persona: archivos del workspace, perfiles de autenticación, registro de modelos y almacén de sesiones. `agentDir` es el directorio de estado en disco que contiene esta configuración por agente en `~/.openclaw/agents/<agentId>/`. Un **binding** asigna una cuenta de canal (por ejemplo, un workspace de Slack o un número de WhatsApp) a uno de esos agentes.

## ¿Qué es “un agente”?

Un **agente** es un cerebro completamente delimitado con su propio:

- **Workspace** (archivos, `AGENTS.md`/`SOUL.md`/`USER.md`, notas locales, reglas de personalidad).
- **Directorio de estado** (`agentDir`) para perfiles de autenticación, registro de modelos y configuración por agente.
- **Almacén de sesiones** (historial de chat + estado de enrutamiento) en `~/.openclaw/agents/<agentId>/sessions`.

Los perfiles de autenticación son **por agente**. Cada agente lee desde su propio:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

<Note>
`sessions_history` también es aquí la ruta más segura para recuperación entre sesiones: devuelve una vista acotada y saneada, no un volcado en bruto de transcripciones. La recuperación del asistente elimina etiquetas de razonamiento, andamiaje de `<relevant-memories>`, cargas XML de llamadas a herramientas en texto plano (incluidos `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` y bloques truncados de llamadas a herramientas), andamiaje degradado de llamadas a herramientas, tokens filtrados de control del modelo en ASCII/de ancho completo y XML malformado de llamadas a herramientas de MiniMax antes de redactar/truncar.
</Note>

<Warning>
Las credenciales del agente principal **no** se comparten automáticamente. Nunca reutilices `agentDir` entre agentes (causa colisiones de autenticación/sesión). Si quieres compartir credenciales, copia `auth-profiles.json` en el `agentDir` del otro agente.
</Warning>

Las Skills se cargan desde el workspace de cada agente y desde raíces compartidas como `~/.openclaw/skills`, y luego se filtran por la lista efectiva de permitidos de Skills del agente cuando está configurada. Usa `agents.defaults.skills` para una base compartida y `agents.list[].skills` para una sustitución por agente. Consulta [Skills: por agente vs compartidas](/es/tools/skills#per-agent-vs-shared-skills) y [Skills: listas de permitidos de Skills por agente](/es/tools/skills#agent-skill-allowlists).

El Gateway puede alojar **un agente** (predeterminado) o **muchos agentes** uno junto a otro.

<Note>
**Nota sobre el workspace:** el workspace de cada agente es el **cwd predeterminado**, no un sandbox estricto. Las rutas relativas se resuelven dentro del workspace, pero las rutas absolutas pueden alcanzar otras ubicaciones del host a menos que el sandboxing esté habilitado. Consulta [Sandboxing](/es/gateway/sandboxing).
</Note>

## Rutas (mapa rápido)

- Configuración: `~/.openclaw/openclaw.json` (o `OPENCLAW_CONFIG_PATH`)
- Directorio de estado: `~/.openclaw` (o `OPENCLAW_STATE_DIR`)
- Workspace: `~/.openclaw/workspace` (o `~/.openclaw/workspace-<agentId>`)
- Directorio del agente: `~/.openclaw/agents/<agentId>/agent` (o `agents.list[].agentDir`)
- Sesiones: `~/.openclaw/agents/<agentId>/sessions`

### Modo de agente único (predeterminado)

Si no haces nada, OpenClaw ejecuta un solo agente:

- `agentId` usa por defecto **`main`**.
- Las sesiones se identifican como `agent:main:<mainKey>`.
- El workspace usa por defecto `~/.openclaw/workspace` (o `~/.openclaw/workspace-<profile>` cuando `OPENCLAW_PROFILE` está configurado).
- El estado usa por defecto `~/.openclaw/agents/main/agent`.

## Asistente de agentes

Usa el asistente de agentes para añadir un nuevo agente aislado:

```bash
openclaw agents add work
```

Después añade `bindings` (o deja que el asistente lo haga) para enrutar mensajes entrantes.

Verifica con:

```bash
openclaw agents list --bindings
```

## Inicio rápido

<Steps>
  <Step title="Crea el workspace de cada agente">
    Usa el asistente o crea workspaces manualmente:

    ```bash
    openclaw agents add coding
    openclaw agents add social
    ```

    Cada agente obtiene su propio workspace con `SOUL.md`, `AGENTS.md` y `USER.md` opcional, además de un `agentDir` dedicado y un almacén de sesiones en `~/.openclaw/agents/<agentId>`.

  </Step>
  <Step title="Crea cuentas de canal">
    Crea una cuenta por agente en tus canales preferidos:

    - Discord: un bot por agente, habilita Message Content Intent y copia cada token.
    - Telegram: un bot por agente mediante BotFather, copia cada token.
    - WhatsApp: vincula cada número de teléfono por cuenta.

    ```bash
    openclaw channels login --channel whatsapp --account work
    ```

    Consulta las guías de canales: [Discord](/es/channels/discord), [Telegram](/es/channels/telegram), [WhatsApp](/es/channels/whatsapp).

  </Step>
  <Step title="Añade agentes, cuentas y bindings">
    Añade agentes en `agents.list`, cuentas de canal en `channels.<channel>.accounts` y conéctalos con `bindings` (ejemplos abajo).
  </Step>
  <Step title="Reinicia y verifica">
    ```bash
    openclaw gateway restart
    openclaw agents list --bindings
    openclaw channels status --probe
    ```
  </Step>
</Steps>

## Varios agentes = varias personas, varias personalidades

Con **varios agentes**, cada `agentId` se convierte en una **personalidad completamente aislada**:

- **Diferentes números de teléfono/cuentas** (por `accountId` de canal).
- **Diferentes personalidades** (por archivos del workspace del agente, como `AGENTS.md` y `SOUL.md`).
- **Autenticación + sesiones separadas** (sin interferencia entre ellas salvo que se habilite explícitamente).

Esto permite que **varias personas** compartan un servidor Gateway mientras mantienen aislados sus “cerebros” de IA y sus datos.

## Búsqueda de memoria QMD entre agentes

Si un agente debe buscar en las transcripciones de sesiones QMD de otro agente, añade colecciones extra en `agents.list[].memorySearch.qmd.extraCollections`. Usa `agents.defaults.memorySearch.qmd.extraCollections` solo cuando todos los agentes deban heredar las mismas colecciones de transcripciones compartidas.

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
            extraCollections: [{ path: "notes" }], // se resuelve dentro del workspace -> colección llamada "notes-main"
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

La ruta de la colección extra puede compartirse entre agentes, pero el nombre de la colección se mantiene explícito cuando la ruta está fuera del workspace del agente. Las rutas dentro del workspace siguen estando delimitadas por agente para que cada agente mantenga su propio conjunto de búsqueda de transcripciones.

## Un número de WhatsApp, varias personas (división de DM)

Puedes enrutar **distintos DMs de WhatsApp** a distintos agentes manteniéndote en **una sola cuenta de WhatsApp**. Haz coincidir por E.164 del remitente (como `+15551234567`) con `peer.kind: "direct"`. Las respuestas seguirán saliendo del mismo número de WhatsApp (sin identidad de remitente por agente).

<Note>
Los chats directos colapsan en la **clave de sesión principal** del agente, por lo que el aislamiento real requiere **un agente por persona**.
</Note>

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

- El control de acceso de DM es **global por cuenta de WhatsApp** (`pairing`/`allowlist`), no por agente.
- Para grupos compartidos, vincula el grupo a un solo agente o usa [Grupos de difusión](/es/channels/broadcast-groups).

## Reglas de enrutamiento (cómo los mensajes eligen un agente)

Los bindings son **deterministas** y **gana el más específico**:

<Steps>
  <Step title="coincidencia de peer">
    ID exacto de DM/grupo/canal.
  </Step>
  <Step title="coincidencia de parentPeer">
    Herencia de hilo.
  </Step>
  <Step title="guildId + roles">
    Enrutamiento por roles de Discord.
  </Step>
  <Step title="guildId">
    Discord.
  </Step>
  <Step title="teamId">
    Slack.
  </Step>
  <Step title="coincidencia de accountId para un canal">
    Alternativa por cuenta.
  </Step>
  <Step title="Coincidencia a nivel de canal">
    `accountId: "*"`.
  </Step>
  <Step title="Agente predeterminado">
    Recurre a `agents.list[].default`; si no, a la primera entrada de la lista; predeterminado: `main`.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Desempate y semántica AND">
    - Si varios bindings coinciden en el mismo nivel, gana el primero en el orden de la configuración.
    - Si un binding establece varios campos de coincidencia (por ejemplo `peer` + `guildId`), todos los campos especificados son obligatorios (semántica `AND`).

  </Accordion>
  <Accordion title="Detalle del alcance de cuenta">
    - Un binding que omite `accountId` coincide solo con la cuenta predeterminada.
    - Usa `accountId: "*"` para una alternativa a nivel de canal en todas las cuentas.
    - Si luego añades el mismo binding para el mismo agente con un ID de cuenta explícito, OpenClaw actualiza el binding existente solo de canal a uno con alcance de cuenta en lugar de duplicarlo.

  </Accordion>
</AccordionGroup>

## Varias cuentas / números de teléfono

Los canales que admiten **varias cuentas** (por ejemplo, WhatsApp) usan `accountId` para identificar cada inicio de sesión. Cada `accountId` puede enrutarse a un agente distinto, de modo que un servidor puede alojar varios números de teléfono sin mezclar sesiones.

Si quieres una cuenta predeterminada a nivel de canal cuando se omite `accountId`, establece `channels.<channel>.defaultAccount` (opcional). Si no se establece, OpenClaw recurre a `default` si existe; de lo contrario, al primer ID de cuenta configurado (ordenado).

Los canales habituales compatibles con este patrón incluyen:

- `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`
- `irc`, `line`, `googlechat`, `mattermost`, `matrix`, `nextcloud-talk`
- `bluebubbles`, `zalo`, `zalouser`, `nostr`, `feishu`

## Conceptos

- `agentId`: un “cerebro” (workspace, autenticación por agente, almacén de sesiones por agente).
- `accountId`: una instancia de cuenta de canal (por ejemplo, cuenta de WhatsApp `"personal"` frente a `"biz"`).
- `binding`: enruta mensajes entrantes a un `agentId` por `(channel, accountId, peer)` y opcionalmente IDs de guild/team.
- Los chats directos colapsan a `agent:<agentId>:<mainKey>` (`main` por agente; `session.mainKey`).

## Ejemplos por plataforma

<AccordionGroup>
  <Accordion title="Bots de Discord por agente">
    Cada cuenta de bot de Discord se asigna a un `accountId` único. Vincula cada cuenta a un agente y mantén listas de permitidos por bot.

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

    - Invita cada bot al guild y habilita Message Content Intent.
    - Los tokens se guardan en `channels.discord.accounts.<id>.token` (la cuenta predeterminada puede usar `DISCORD_BOT_TOKEN`).

  </Accordion>
  <Accordion title="Bots de Telegram por agente">
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

    - Crea un bot por agente con BotFather y copia cada token.
    - Los tokens se guardan en `channels.telegram.accounts.<id>.botToken` (la cuenta predeterminada puede usar `TELEGRAM_BOT_TOKEN`).

  </Accordion>
  <Accordion title="Números de WhatsApp por agente">
    Vincula cada cuenta antes de iniciar el Gateway:

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

        // Sustitución opcional por peer (ejemplo: enviar un grupo específico al agente de trabajo).
        {
          agentId: "work",
          match: {
            channel: "whatsapp",
            accountId: "personal",
            peer: { kind: "group", id: "1203630...@g.us" },
          },
        },
      ],

      // Desactivado por defecto: la mensajería entre agentes debe habilitarse explícitamente + incluirse en allowlist.
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
              // Sustitución opcional. Predeterminado: ~/.openclaw/credentials/whatsapp/personal
              // authDir: "~/.openclaw/credentials/whatsapp/personal",
            },
            biz: {
              // Sustitución opcional. Predeterminado: ~/.openclaw/credentials/whatsapp/biz
              // authDir: "~/.openclaw/credentials/whatsapp/biz",
            },
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## Patrones habituales

<Tabs>
  <Tab title="WhatsApp diario + Telegram para trabajo profundo">
    Divide por canal: enruta WhatsApp a un agente rápido para el día a día y Telegram a un agente Opus.

    ```json5
    {
      agents: {
        list: [
          {
            id: "chat",
            name: "Diario",
            workspace: "~/.openclaw/workspace-chat",
            model: "anthropic/claude-sonnet-4-6",
          },
          {
            id: "opus",
            name: "Trabajo profundo",
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

    - Si tienes varias cuentas para un canal, añade `accountId` al binding (por ejemplo `{ channel: "whatsapp", accountId: "personal" }`).
    - Para enrutar un solo DM/grupo a Opus mientras mantienes el resto en chat, añade un binding `match.peer` para ese peer; las coincidencias de peer siempre tienen prioridad sobre las reglas a nivel de canal.

  </Tab>
  <Tab title="Mismo canal, un peer para Opus">
    Mantén WhatsApp en el agente rápido, pero enruta un DM a Opus:

    ```json5
    {
      agents: {
        list: [
          {
            id: "chat",
            name: "Diario",
            workspace: "~/.openclaw/workspace-chat",
            model: "anthropic/claude-sonnet-4-6",
          },
          {
            id: "opus",
            name: "Trabajo profundo",
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

    Los bindings de peer siempre tienen prioridad, así que colócalos por encima de la regla a nivel de canal.

  </Tab>
  <Tab title="Agente familiar vinculado a un grupo de WhatsApp">
    Vincula un agente familiar dedicado a un único grupo de WhatsApp, con control por mención y una política de herramientas más estricta:

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

    - Las listas `allow`/`deny` de herramientas son **herramientas**, no Skills. Si una skill necesita ejecutar un binario, asegúrate de que `exec` esté permitido y de que el binario exista en el sandbox.
    - Para un control más estricto, establece `agents.list[].groupChat.mentionPatterns` y mantén habilitadas las listas de permitidos de grupos para el canal.

  </Tab>
</Tabs>

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
            // Configuración opcional que se ejecuta una vez tras crear el contenedor
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],                    // Solo herramienta read
          deny: ["exec", "write", "edit", "apply_patch"],    // Denegar otras
        },
      },
    ],
  },
}
```

<Note>
`setupCommand` vive en `sandbox.docker` y se ejecuta una vez al crear el contenedor. Las sustituciones por agente de `sandbox.docker.*` se ignoran cuando el alcance resuelto es `"shared"`.
</Note>

**Ventajas:**

- **Aislamiento de seguridad**: restringe herramientas para agentes no confiables.
- **Control de recursos**: usa sandbox para agentes específicos mientras mantienes otros en el host.
- **Políticas flexibles**: permisos distintos por agente.

<Note>
`tools.elevated` es **global** y se basa en el remitente; no se puede configurar por agente. Si necesitas límites por agente, usa `agents.list[].tools` para denegar `exec`. Para la orientación de grupos, usa `agents.list[].groupChat.mentionPatterns` para que las @menciones se asignen claramente al agente previsto.
</Note>

Consulta [Sandbox y herramientas para varios agentes](/es/tools/multi-agent-sandbox-tools) para ver ejemplos detallados.

## Relacionado

- [Agentes ACP](/es/tools/acp-agents) — ejecutar arneses de codificación externos
- [Enrutamiento de canales](/es/channels/channel-routing) — cómo se enrutan los mensajes a los agentes
- [Presencia](/es/concepts/presence) — presencia y disponibilidad del agente
- [Sesión](/es/concepts/session) — aislamiento y enrutamiento de sesiones
- [Subagentes](/es/tools/subagents) — iniciar ejecuciones de agentes en segundo plano
