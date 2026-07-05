---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: 'Enrutamiento multiagente: agentes aislados, cuentas de canal y vinculaciones'
title: Enrutamiento multiagente
x-i18n:
    generated_at: "2026-07-05T11:13:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 48e32d9e8ac2b68fdceb9a84d95bae2a73ab10f9c5fd177b72e8e452954329e9
    source_path: concepts/multi-agent.md
    workflow: 16
---

Ejecuta varios agentes _aislados_ en un proceso Gateway, cada uno con su propio espacio de trabajo, directorio de estado (`agentDir`) y almacén de sesiones, además de varias cuentas de canal (por ejemplo, dos números de WhatsApp). Los mensajes entrantes se enrutan al agente correcto mediante **vinculaciones**.

Un **agente** es el ámbito completo por persona: archivos del espacio de trabajo, perfiles de autenticación, registro de modelos y almacén de sesiones. Una **vinculación** asigna una cuenta de canal (un espacio de trabajo de Slack, un número de WhatsApp, etc.) a uno de esos agentes.

## Qué es un agente

Cada agente tiene su propio:

- **Espacio de trabajo**: archivos, `AGENTS.md`/`SOUL.md`/`USER.md`, notas locales, reglas de persona.
- **Directorio de estado** (`agentDir`): perfiles de autenticación, registro de modelos, configuración por agente.
- **Almacén de sesiones**: historial de chat y estado de enrutamiento en `~/.openclaw/agents/<agentId>/sessions`.

Los perfiles de autenticación son por agente y se leen desde:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

<Note>
`sessions_history` es la ruta más segura para recuperación entre sesiones: devuelve una vista limitada y redactada, no un volcado de transcripción sin procesar. Elimina firmas de bloques de razonamiento, detalles de cargas de resultados de herramientas, andamiaje de `<relevant-memories>`, etiquetas XML de llamadas a herramientas (`<tool_call>`, `<function_call>` y sus formas plurales/degradadas), y XML de llamadas a herramientas de MiniMax; luego trunca y limita la salida por tamaño en bytes.
</Note>

<Warning>
Nunca reutilices `agentDir` entre agentes: provoca colisiones de estado de autenticación/sesión. Cuando la credencial OAuth local de un agente secundario caduca o falla su actualización, OpenClaw lee la credencial del agente predeterminado/principal para el mismo id de perfil y adopta el token más reciente, sin copiar el token de actualización en el almacén del agente secundario. Si quieres una cuenta OAuth completamente independiente, inicia sesión desde ese agente. Si copias credenciales manualmente, copia solo perfiles estáticos portátiles `api_key` o `token`: el material de actualización OAuth no es portátil de forma predeterminada (`copyToAgents` puede incluir explícitamente un perfil).
</Warning>

Skills se cargan desde cada espacio de trabajo de agente más raíces compartidas como `~/.openclaw/skills`, y luego se filtran por la lista efectiva de Skills permitidas del agente. Usa `agents.defaults.skills` para una línea base compartida y `agents.list[].skills` para un reemplazo por agente (las entradas explícitas reemplazan el valor predeterminado, no se fusionan). Consulta [Skills: por agente frente a compartidas](/es/tools/skills#per-agent-vs-shared-skills) y [Skills: listas permitidas de agentes](/es/tools/skills#agent-allowlists).

<Note>
**Nota sobre el espacio de trabajo:** el espacio de trabajo de cada agente es el **cwd predeterminado**, no un sandbox rígido. Las rutas relativas se resuelven dentro del espacio de trabajo, pero las rutas absolutas pueden llegar a otras ubicaciones del host a menos que el sandboxing esté habilitado. Consulta [Sandboxing](/es/gateway/sandboxing).
</Note>

## Rutas

| Qué                       | Predeterminado                                                                        | Anulación                                                                                |
| ------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Configuración             | `~/.openclaw/openclaw.json`                                                            | `OPENCLAW_CONFIG_PATH`                                                                   |
| Directorio de estado      | `~/.openclaw`                                                                          | `OPENCLAW_STATE_DIR`                                                                     |
| Espacio de trabajo del agente predeterminado | `~/.openclaw/workspace` (o `workspace-<profile>` cuando `OPENCLAW_PROFILE` está definido) | `agents.list[].workspace`, luego `agents.defaults.workspace`, o `OPENCLAW_WORKSPACE_DIR` |
| Espacio de trabajo de otros agentes | `<stateDir>/workspace-<agentId>` (o `<agents.defaults.workspace>/<agentId>` cuando está definido) | `agents.list[].workspace`                                                                |
| Directorio del agente     | `~/.openclaw/agents/<agentId>/agent`                                                   | `agents.list[].agentDir`                                                                 |
| Sesiones                  | `~/.openclaw/agents/<agentId>/sessions`                                                | —                                                                                        |

### Modo de agente único (predeterminado)

Si no configuras nada, OpenClaw ejecuta un agente:

- `agentId` usa `main` de forma predeterminada.
- Las sesiones se indexan como `agent:main:<mainKey>` (el `mainKey` predeterminado es `main`).
- El espacio de trabajo usa `~/.openclaw/workspace` de forma predeterminada (o `workspace-<profile>` cuando `OPENCLAW_PROFILE` se define con algo distinto de `default`).
- El estado usa `~/.openclaw/agents/main/agent` de forma predeterminada.

## Ayudante de agentes

Añade un nuevo agente aislado:

```bash
openclaw agents add work
```

Flags: `--workspace <dir>`, `--model <id>`, `--agent-dir <dir>`, `--bind <channel[:accountId]>` (repetible), `--non-interactive` (requiere `--workspace`).

Añade `bindings` para enrutar mensajes entrantes (el asistente ofrece hacerlo por ti) y luego verifica:

```bash
openclaw agents list --bindings
```

## Inicio rápido

<Steps>
  <Step title="Crea cada espacio de trabajo de agente">
    ```bash
    openclaw agents add coding
    openclaw agents add social
    ```

    Cada agente obtiene su propio espacio de trabajo con `SOUL.md`, `AGENTS.md` y `USER.md` opcional, además de un `agentDir` dedicado y un almacén de sesiones en `~/.openclaw/agents/<agentId>`.

  </Step>
  <Step title="Crea cuentas de canal">
    Crea una cuenta por agente en tus canales preferidos:

    - Discord: un bot por agente, habilita la intención de contenido de mensajes, copia cada token.
    - Telegram: un bot por agente mediante BotFather, copia cada token.
    - WhatsApp: vincula cada número de teléfono por cuenta.

    ```bash
    openclaw channels login --channel whatsapp --account work
    ```

    Consulta las guías de canales: [Discord](/es/channels/discord), [Telegram](/es/channels/telegram), [WhatsApp](/es/channels/whatsapp).

  </Step>
  <Step title="Añade agentes, cuentas y vinculaciones">
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

## Varios agentes, varias personas

Cada `agentId` configurado es una persona completamente aislada:

- Cuentas distintas por canal (por `accountId`).
- Personalidades distintas (`AGENTS.md`/`SOUL.md` por agente).
- Autenticación y sesiones separadas, sin comunicación cruzada a menos que se habilite explícitamente.

Esto permite que varias personas compartan un Gateway mientras mantienen aislado el estado de su agente.

## Búsqueda de memoria QMD entre agentes

Para permitir que un agente busque transcripciones de sesiones QMD de otro agente, añade colecciones adicionales en `agents.list[].memorySearch.qmd.extraCollections`. Usa `agents.defaults.memorySearch.qmd.extraCollections` cuando todos los agentes deban compartir las mismas colecciones.

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

Una ruta de colección adicional puede compartirse entre agentes, pero su `name` permanece explícito cuando la ruta está fuera del espacio de trabajo del agente. Las rutas dentro del espacio de trabajo permanecen acotadas al agente para que cada agente mantenga su propio conjunto de búsqueda de transcripciones.

## Un número de WhatsApp, varias personas (división por DM)

Enruta distintos DM de WhatsApp a distintos agentes en **una** cuenta de WhatsApp haciendo coincidir el remitente E.164 (`+15551234567`) con `peer.kind: "direct"`. Las respuestas siguen saliendo del mismo número de WhatsApp: no hay identidad de remitente por agente.

<Note>
Los chats directos se reducen a la clave de sesión principal del agente de forma predeterminada, por lo que el aislamiento real requiere un agente por persona.
</Note>

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

El control de acceso a DM (emparejamiento/lista de permitidos) es global por cuenta de WhatsApp, no por agente. Para grupos compartidos, vincula el grupo a un agente o usa [Grupos de difusión](/es/channels/broadcast-groups).

## Reglas de enrutamiento

Las vinculaciones son deterministas y gana la más específica. Consulta [Enrutamiento de canales](/es/channels/channel-routing#routing-rules-how-an-agent-is-chosen) para ver el orden completo de niveles (par exacto, par padre, comodín de par, guild+roles, guild, equipo, cuenta, canal, agente predeterminado). Algunas reglas que vale la pena destacar aquí:

- Si varias vinculaciones coinciden dentro del mismo nivel, gana la primera en el orden de configuración.
- Si una vinculación define varios campos de coincidencia (por ejemplo `peer` + `guildId`), todos los campos especificados deben coincidir (semántica `AND`).
- Una vinculación que omite `accountId` coincide solo con la cuenta predeterminada, no con todas las cuentas. Usa `accountId: "*"` para un respaldo de todo el canal, o `accountId: "<name>"` para una cuenta. Añadir de nuevo la misma vinculación con un id de cuenta explícito actualiza la vinculación existente solo de canal en lugar de duplicarla.

## Varias cuentas / números de teléfono

Los canales que admiten varias cuentas (por ejemplo, WhatsApp) usan `accountId` para identificar cada inicio de sesión. Cada `accountId` se enruta a su propio agente, por lo que un servidor puede alojar varios números de teléfono sin mezclar sesiones.

Define `channels.<channel>.defaultAccount` para elegir la cuenta usada cuando se omite `accountId`. Cuando no está definido, OpenClaw recurre a `default` si está presente; de lo contrario, al primer id de cuenta configurado (ordenado).

Canales que admiten varias cuentas: `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `mattermost`, `matrix`, `nextcloud-talk`, `nostr`, `signal`, `slack`, `telegram`, `whatsapp`, `zalo`, `zalouser`.

## Conceptos

- `agentId`: un "cerebro" (espacio de trabajo, autenticación por agente, almacén de sesiones por agente).
- `accountId`: una instancia de cuenta de canal (por ejemplo, cuenta de WhatsApp `personal` frente a `biz`).
- `binding`: enruta mensajes entrantes a un `agentId` por `(channel, accountId, peer)` y, opcionalmente, ids de guild/equipo.
- Los chats directos se reducen a `agent:<agentId>:<mainKey>` ("main" por agente; consulta `session.mainKey`).

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

    - Invita cada bot al servidor y habilita Message Content Intent.
    - Los tokens se ubican en `channels.discord.accounts.<id>.token` (la cuenta predeterminada puede usar `DISCORD_BOT_TOKEN`).

  </Accordion>
  <Accordion title="Telegram bots per agent">
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
    - Los tokens se ubican en `channels.telegram.accounts.<id>.botToken` (la cuenta predeterminada puede usar `TELEGRAM_BOT_TOKEN`).
    - Para varios bots en el mismo grupo de Telegram, invita cada bot y menciona el que debe responder.
    - Deshabilita el modo de privacidad de BotFather para cada bot de grupo (`/setprivacy` -> Disable), luego elimina y vuelve a añadir el bot para que Telegram aplique la configuración.
    - Permite grupos con `channels.telegram.groups`, o usa `groupPolicy: "open"` solo para despliegues de grupos de confianza.
    - Coloca los ID de usuario de remitentes en `groupAllowFrom`. Los ID de grupos y supergrupos pertenecen a `channels.telegram.groups`, no a `groupAllowFrom`.
    - Enlaza por `accountId` para que cada bot se enrute a su propio agente.

  </Accordion>
  <Accordion title="WhatsApp numbers per agent">
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
  <Tab title="WhatsApp daily + Telegram deep work">
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
        { agentId: "chat", match: { channel: "whatsapp", accountId: "*" } },
        { agentId: "opus", match: { channel: "telegram", accountId: "*" } },
      ],
    }
    ```

    Estos ejemplos usan `accountId: "*"` para que los enlaces sigan funcionando si añades cuentas más adelante. Para enrutar un solo mensaje directo o grupo a Opus mientras mantienes el resto en chat, añade un enlace `match.peer` para ese par; las coincidencias de par siempre tienen prioridad sobre las reglas de todo el canal.

  </Tab>
  <Tab title="Same channel, one peer to Opus">
    Mantén WhatsApp en el agente rápido, pero enruta un mensaje directo a Opus:

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
          match: { channel: "whatsapp", accountId: "*", peer: { kind: "direct", id: "+15551234567" } },
        },
        { agentId: "chat", match: { channel: "whatsapp", accountId: "*" } },
      ],
    }
    ```

    Los enlaces de par siempre tienen prioridad, así que mantenlos encima de la regla de todo el canal.

  </Tab>
  <Tab title="Family agent bound to a WhatsApp group">
    Enlaza un agente familiar dedicado a un solo grupo de WhatsApp, con control por mención y una política de herramientas más estricta:

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

    Las listas de permitir/denegar herramientas son **herramientas**, no Skills. Si una Skill necesita ejecutar un binario, asegúrate de que `exec` esté permitido y de que el binario exista en el entorno de pruebas. Para un control más estricto, configura `agents.list[].groupChat.mentionPatterns` y mantén habilitadas las listas de permitidos de grupo para el canal.

  </Tab>
</Tabs>

## Configuración de entorno de pruebas y herramientas por agente

Cada agente puede tener sus propias restricciones de entorno de pruebas y herramientas:

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
`setupCommand` se ubica bajo `sandbox.docker` y se ejecuta una vez al crear el contenedor. Las anulaciones `sandbox.docker.*` por agente se ignoran cuando el ámbito resuelto es `"shared"`.
</Note>

Esto te da:

- **Aislamiento de seguridad**: restringe herramientas para agentes no confiables.
- **Control de recursos**: ejecuta agentes específicos en entorno de pruebas mientras mantienes otros en el host.
- **Políticas flexibles**: permisos diferentes por agente.

<Note>
`tools.elevated` tiene una puerta global (`tools.elevated.enabled`/`allowFrom`) y una puerta por agente (`agents.list[].tools.elevated.enabled`/`allowFrom`). La puerta por agente solo puede restringir aún más la global: ambas deben permitir a un remitente para que se ejecuten comandos elevados. Para dirigir grupos, usa `agents.list[].groupChat.mentionPatterns` para que las @menciones se asignen claramente al agente previsto.
</Note>

Consulta [Entorno de pruebas y herramientas multiagente](/es/tools/multi-agent-sandbox-tools) para ver ejemplos detallados.

## Relacionado

- [Agentes ACP](/es/tools/acp-agents) — ejecutar arneses de programación externos
- [Enrutamiento de canales](/es/channels/channel-routing) — cómo se enrutan los mensajes a los agentes
- [Presencia](/es/concepts/presence) — presencia y disponibilidad del agente
- [Sesión](/es/concepts/session) — aislamiento y enrutamiento de sesiones
- [Subagentes](/es/tools/subagents) — generar ejecuciones de agentes en segundo plano
