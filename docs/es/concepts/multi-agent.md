---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: 'Enrutamiento multiagente: agentes aislados, cuentas de canal y vinculaciones'
title: Enrutamiento multiagente
x-i18n:
    generated_at: "2026-05-11T20:30:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7fd194cbe0938cc6ef6dd9b9803d2b1fe6f3e0777f4df7c407c692fd9f743c59
    source_path: concepts/multi-agent.md
    workflow: 16
---

Ejecuta varios agentes _aislados_ — cada uno con su propio espacio de trabajo, directorio de estado (`agentDir`) e historial de sesiones — además de varias cuentas de canal (por ejemplo, dos WhatsApp) en un único Gateway en ejecución. Los mensajes entrantes se enrutan al agente correcto mediante vinculaciones.

Un **agente** aquí es el ámbito completo por persona: archivos del espacio de trabajo, perfiles de autenticación, registro de modelos y almacén de sesiones. `agentDir` es el directorio de estado en disco que contiene esta configuración por agente en `~/.openclaw/agents/<agentId>/`. Una **vinculación** asigna una cuenta de canal (por ejemplo, un espacio de trabajo de Slack o un número de WhatsApp) a uno de esos agentes.

## ¿Qué es "un agente"?

Un **agente** es un cerebro completamente acotado con su propio:

- **Espacio de trabajo** (archivos, AGENTS.md/SOUL.md/USER.md, notas locales, reglas de persona).
- **Directorio de estado** (`agentDir`) para perfiles de autenticación, registro de modelos y configuración por agente.
- **Almacén de sesiones** (historial de chat + estado de enrutamiento) en `~/.openclaw/agents/<agentId>/sessions`.

Los perfiles de autenticación son **por agente**. Cada agente lee desde su propio:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

<Note>
`sessions_history` también es aquí la ruta más segura de recuperación entre sesiones: devuelve una vista acotada y saneada, no un volcado bruto de la transcripción. La recuperación del asistente elimina etiquetas de pensamiento, andamiaje `<relevant-memories>`, cargas XML de llamadas a herramientas en texto plano (incluidos `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` y bloques truncados de llamadas a herramientas), andamiaje degradado de llamadas a herramientas, tokens filtrados de control de modelo ASCII/de ancho completo y XML de llamadas a herramientas de MiniMax mal formado antes de la redacción/truncamiento.
</Note>

<Warning>
Nunca reutilices `agentDir` entre agentes (causa colisiones de autenticación/sesión). Los agentes
pueden leer los perfiles de autenticación del agente predeterminado/principal cuando no tienen
un perfil local, pero OpenClaw no clona tokens de actualización OAuth en el
almacén del agente secundario. Si quieres una cuenta OAuth independiente, inicia sesión desde
ese agente; si copias credenciales manualmente, copia solo perfiles estáticos portátiles
`api_key` o `token`.
</Warning>

Skills se cargan desde cada espacio de trabajo de agente más raíces compartidas como `~/.openclaw/skills`, y luego se filtran por la lista efectiva de Skills permitidas del agente cuando está configurada. Usa `agents.defaults.skills` para una línea base compartida y `agents.list[].skills` para reemplazo por agente. Consulta [Skills: por agente frente a compartidas](/es/tools/skills#per-agent-vs-shared-skills) y [Skills: listas de Skills permitidas por agente](/es/tools/skills#agent-skill-allowlists).

El Gateway puede alojar **un agente** (predeterminado) o **muchos agentes** en paralelo.

<Note>
**Nota sobre el espacio de trabajo:** el espacio de trabajo de cada agente es el **cwd predeterminado**, no un sandbox estricto. Las rutas relativas se resuelven dentro del espacio de trabajo, pero las rutas absolutas pueden alcanzar otras ubicaciones del host salvo que el sandboxing esté habilitado. Consulta [Sandboxing](/es/gateway/sandboxing).
</Note>

## Rutas (mapa rápido)

- Configuración: `~/.openclaw/openclaw.json` (o `OPENCLAW_CONFIG_PATH`)
- Directorio de estado: `~/.openclaw` (o `OPENCLAW_STATE_DIR`)
- Espacio de trabajo: `~/.openclaw/workspace` (o `~/.openclaw/workspace-<agentId>`)
- Directorio del agente: `~/.openclaw/agents/<agentId>/agent` (o `agents.list[].agentDir`)
- Sesiones: `~/.openclaw/agents/<agentId>/sessions`

### Modo de agente único (predeterminado)

Si no haces nada, OpenClaw ejecuta un solo agente:

- `agentId` usa **`main`** de forma predeterminada.
- Las sesiones se identifican como `agent:main:<mainKey>`.
- El espacio de trabajo usa `~/.openclaw/workspace` de forma predeterminada (o `~/.openclaw/workspace-<profile>` cuando `OPENCLAW_PROFILE` está configurado).
- El estado usa `~/.openclaw/agents/main/agent` de forma predeterminada.

## Ayudante de agentes

Usa el asistente de agentes para añadir un nuevo agente aislado:

```bash
openclaw agents add work
```

Luego añade `bindings` (o deja que el asistente lo haga) para enrutar los mensajes entrantes.

Verifica con:

```bash
openclaw agents list --bindings
```

## Inicio rápido

<Steps>
  <Step title="Crear cada espacio de trabajo de agente">
    Usa el asistente o crea espacios de trabajo manualmente:

    ```bash
    openclaw agents add coding
    openclaw agents add social
    ```

    Cada agente obtiene su propio espacio de trabajo con `SOUL.md`, `AGENTS.md` y `USER.md` opcional, además de un `agentDir` dedicado y un almacén de sesiones en `~/.openclaw/agents/<agentId>`.

  </Step>
  <Step title="Crear cuentas de canal">
    Crea una cuenta por agente en tus canales preferidos:

    - Discord: un bot por agente, habilita Message Content Intent, copia cada token.
    - Telegram: un bot por agente mediante BotFather, copia cada token.
    - WhatsApp: vincula cada número de teléfono por cuenta.

    ```bash
    openclaw channels login --channel whatsapp --account work
    ```

    Consulta las guías de canales: [Discord](/es/channels/discord), [Telegram](/es/channels/telegram), [WhatsApp](/es/channels/whatsapp).

  </Step>
  <Step title="Añadir agentes, cuentas y vinculaciones">
    Añade agentes en `agents.list`, cuentas de canal en `channels.<channel>.accounts` y conéctalos con `bindings` (ejemplos más abajo).
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

Con **varios agentes**, cada `agentId` se convierte en una **persona completamente aislada**:

- **Números de teléfono/cuentas diferentes** (por canal `accountId`).
- **Personalidades diferentes** (archivos de espacio de trabajo por agente como `AGENTS.md` y `SOUL.md`).
- **Autenticación + sesiones separadas** (sin comunicación cruzada salvo que se habilite explícitamente).

Esto permite que **varias personas** compartan un servidor Gateway mientras mantienen aislados sus "cerebros" de IA y sus datos.

## Búsqueda de memoria QMD entre agentes

Si un agente debe buscar en las transcripciones de sesiones QMD de otro agente, añade colecciones adicionales en `agents.list[].memorySearch.qmd.extraCollections`. Usa `agents.defaults.memorySearch.qmd.extraCollections` solo cuando todos los agentes deban heredar las mismas colecciones compartidas de transcripciones.

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

La ruta de la colección adicional puede compartirse entre agentes, pero el nombre de la colección sigue siendo explícito cuando la ruta está fuera del espacio de trabajo del agente. Las rutas dentro del espacio de trabajo permanecen acotadas al agente para que cada agente conserve su propio conjunto de búsqueda de transcripciones.

## Un número de WhatsApp, varias personas (división de DM)

Puedes enrutar **distintos DM de WhatsApp** a agentes diferentes mientras permaneces en **una sola cuenta de WhatsApp**. Coincide por remitente E.164 (como `+15551234567`) con `peer.kind: "direct"`. Las respuestas siguen saliendo del mismo número de WhatsApp (sin identidad de remitente por agente).

<Note>
Los chats directos se colapsan en la **clave de sesión principal** del agente, por lo que el aislamiento real requiere **un agente por persona**.
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

- El control de acceso de DM es **global por cuenta de WhatsApp** (emparejamiento/lista de permitidos), no por agente.
- Para grupos compartidos, vincula el grupo a un agente o usa [Grupos de difusión](/es/channels/broadcast-groups).

## Reglas de enrutamiento (cómo los mensajes eligen un agente)

Las vinculaciones son **deterministas** y **gana la más específica**:

<Steps>
  <Step title="coincidencia de peer">
    ID exacto de DM/grupo/canal.
  </Step>
  <Step title="coincidencia de parentPeer">
    Herencia de hilo.
  </Step>
  <Step title="guildId + roles">
    Enrutamiento por rol de Discord.
  </Step>
  <Step title="guildId">
    Discord.
  </Step>
  <Step title="teamId">
    Slack.
  </Step>
  <Step title="coincidencia de accountId para un canal">
    Respaldo por cuenta.
  </Step>
  <Step title="Coincidencia a nivel de canal">
    `accountId: "*"`.
  </Step>
  <Step title="Agente predeterminado">
    Respaldo a `agents.list[].default`; si no existe, primera entrada de la lista; predeterminado: `main`.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Desempate y semántica AND">
    - Si varias vinculaciones coinciden en el mismo nivel, gana la primera en el orden de configuración.
    - Si una vinculación define varios campos de coincidencia (por ejemplo `peer` + `guildId`), todos los campos especificados son obligatorios (semántica `AND`).

  </Accordion>
  <Accordion title="Detalle de ámbito de cuenta">
    - Una vinculación que omite `accountId` coincide solo con la cuenta predeterminada.
    - Usa `accountId: "*"` para un respaldo de todo el canal en todas las cuentas.
    - Si más adelante añades la misma vinculación para el mismo agente con un ID de cuenta explícito, OpenClaw actualiza la vinculación existente de solo canal a ámbito de cuenta en lugar de duplicarla.

  </Accordion>
</AccordionGroup>

## Varias cuentas / números de teléfono

Los canales que admiten **varias cuentas** (por ejemplo, WhatsApp) usan `accountId` para identificar cada inicio de sesión. Cada `accountId` puede enrutarse a un agente diferente, por lo que un servidor puede alojar varios números de teléfono sin mezclar sesiones.

Si quieres una cuenta predeterminada para todo el canal cuando se omite `accountId`, configura `channels.<channel>.defaultAccount` (opcional). Cuando no está configurado, OpenClaw recurre a `default` si está presente; de lo contrario, al primer ID de cuenta configurado (ordenado).

Los canales comunes que admiten este patrón incluyen:

- `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`
- `irc`, `line`, `googlechat`, `mattermost`, `matrix`, `nextcloud-talk`
- `zalo`, `zalouser`, `nostr`, `feishu`

## Conceptos

- `agentId`: un "cerebro" (espacio de trabajo, autenticación por agente, almacén de sesiones por agente).
- `accountId`: una instancia de cuenta de canal (por ejemplo, cuenta de WhatsApp `"personal"` frente a `"biz"`).
- `binding`: enruta mensajes entrantes a un `agentId` por `(channel, accountId, peer)` y opcionalmente IDs de guild/equipo.
- Los chats directos se colapsan en `agent:<agentId>:<mainKey>` ("main" por agente; `session.mainKey`).

## Ejemplos de plataforma

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

    - Invita a cada bot al servidor y habilita Message Content Intent.
    - Los tokens viven en `channels.discord.accounts.<id>.token` (la cuenta predeterminada puede usar `DISCORD_BOT_TOKEN`).

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
    - Los tokens viven en `channels.telegram.accounts.<id>.botToken` (la cuenta predeterminada puede usar `TELEGRAM_BOT_TOKEN`).

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

      // Deterministic routing: first match wins (most-specific first).
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

        // Optional per-peer override (example: send a specific group to work agent).
        {
          agentId: "work",
          match: {
            channel: "whatsapp",
            accountId: "personal",
            peer: { kind: "group", id: "1203630...@g.us" },
          },
        },
      ],

      // Off by default: agent-to-agent messaging must be explicitly enabled + allowlisted.
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
              // Optional override. Default: ~/.openclaw/credentials/whatsapp/personal
              // authDir: "~/.openclaw/credentials/whatsapp/personal",
            },
            biz: {
              // Optional override. Default: ~/.openclaw/credentials/whatsapp/biz
              // authDir: "~/.openclaw/credentials/whatsapp/biz",
            },
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## Patrones comunes

<Tabs>
  <Tab title="WhatsApp diario + trabajo profundo en Telegram">
    Divide por canal: enruta WhatsApp a un agente rápido de uso diario y Telegram a un agente Opus.

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

    - Si tienes varias cuentas para un canal, añade `accountId` al enlace (por ejemplo, `{ channel: "whatsapp", accountId: "personal" }`).
    - Para enrutar un solo DM/grupo a Opus mientras mantienes el resto en chat, añade un enlace `match.peer` para ese par; las coincidencias de pares siempre prevalecen sobre las reglas de todo el canal.

  </Tab>
  <Tab title="Mismo canal, un par a Opus">
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

    Los enlaces de pares siempre prevalecen, así que mantenlos encima de la regla de todo el canal.

  </Tab>
  <Tab title="Agente familiar vinculado a un grupo de WhatsApp">
    Vincula un agente familiar dedicado a un solo grupo de WhatsApp, con control por menciones y una política de herramientas más estricta:

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

    - Las listas de permitidos/denegados de herramientas son **herramientas**, no Skills. Si una Skill necesita ejecutar un binario, asegúrate de que `exec` esté permitido y de que el binario exista en el sandbox.
    - Para un control más estricto, define `agents.list[].groupChat.mentionPatterns` y mantén habilitadas las listas de permitidos de grupos para el canal.

  </Tab>
</Tabs>

## Configuración de sandbox y herramientas por agente

Cada agente puede tener su propio sandbox y restricciones de herramientas:

```js
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: {
          mode: "off",  // No sandbox for personal agent
        },
        // No tool restrictions - all tools available
      },
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",     // Always sandboxed
          scope: "agent",  // One container per agent
          docker: {
            // Optional one-time setup after container creation
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],                    // Only read tool
          deny: ["exec", "write", "edit", "apply_patch"],    // Deny others
        },
      },
    ],
  },
}
```

<Note>
`setupCommand` vive bajo `sandbox.docker` y se ejecuta una vez al crear el contenedor. Las anulaciones `sandbox.docker.*` por agente se ignoran cuando el ámbito resuelto es `"shared"`.
</Note>

**Beneficios:**

- **Aislamiento de seguridad**: restringe herramientas para agentes no confiables.
- **Control de recursos**: ejecuta agentes específicos en sandbox mientras mantienes otros en el host.
- **Políticas flexibles**: permisos diferentes por agente.

<Note>
`tools.elevated` es **global** y se basa en el remitente; no es configurable por agente. Si necesitas límites por agente, usa `agents.list[].tools` para denegar `exec`. Para dirigir grupos, usa `agents.list[].groupChat.mentionPatterns` para que las @menciones se asignen claramente al agente previsto.
</Note>

Consulta [Sandbox y herramientas multiagente](/es/tools/multi-agent-sandbox-tools) para ver ejemplos detallados.

## Relacionado

- [Agentes ACP](/es/tools/acp-agents) — ejecución de arneses de programación externos
- [Enrutamiento de canales](/es/channels/channel-routing) — cómo se enrutan los mensajes a los agentes
- [Presencia](/es/concepts/presence) — presencia y disponibilidad del agente
- [Sesión](/es/concepts/session) — aislamiento y enrutamiento de sesiones
- [Subagentes](/es/tools/subagents) — inicio de ejecuciones de agentes en segundo plano
