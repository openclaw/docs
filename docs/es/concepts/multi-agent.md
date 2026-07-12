---
read_when: You want multiple agents with separate workspaces, auth, and sessions in one Gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: 'Enrutamiento multiagente: límites de los agentes, cuentas de canales y vinculaciones'
title: Enrutamiento multiagente
x-i18n:
    generated_at: "2026-07-12T14:29:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 265a1f3d9d9b4957c99c71f391ce4f5abba6b70561570f8bbe8cb9964ece1cfc
    source_path: concepts/multi-agent.md
    workflow: 16
---

Ejecute varios agentes _aislados_ en un proceso de Gateway, cada uno con su propio espacio de trabajo, directorio de estado (`agentDir`) e historial de sesiones respaldado por SQLite, además de varias cuentas de canales (por ejemplo, dos números de WhatsApp). Los mensajes entrantes se enrutan al agente correcto mediante **vinculaciones**.

Un **agente** es el ámbito completo de cada persona: archivos del espacio de trabajo, perfiles de autenticación, registro de modelos y almacén de sesiones. Una **vinculación** asigna una cuenta de canal (un espacio de trabajo de Slack, un número de WhatsApp, etc.) a uno de esos agentes.

## Qué es un agente

Cada agente tiene sus propios elementos:

- **Espacio de trabajo**: archivos, `AGENTS.md`/`SOUL.md`/`USER.md`, notas locales y reglas de la persona.
- **Directorio de estado** (`agentDir`): perfiles de autenticación, registro de modelos y configuración por agente.
- **Almacén de sesiones**: historial de chat y estado de enrutamiento en `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`.

Los perfiles de autenticación son específicos de cada agente y se leen desde:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

<Note>
`sessions_history` es la vía más segura para recuperar información entre sesiones: devuelve una vista limitada y censurada, no un volcado de la transcripción sin procesar. Elimina las firmas de los bloques de razonamiento, los detalles de las cargas útiles de los resultados de herramientas, la estructura auxiliar `<relevant-memories>`, las etiquetas XML de llamadas a herramientas (`<tool_call>`, `<function_call>` y sus formas plurales o degradadas) y el XML de llamadas a herramientas de MiniMax; después, trunca y limita la salida por tamaño en bytes.
</Note>

<Warning>
Nunca reutilice `agentDir` entre agentes: provoca colisiones en el estado de autenticación y de las sesiones. Cuando la credencial OAuth local de un agente secundario ha caducado o no se puede actualizar, OpenClaw consulta la credencial del agente predeterminado/principal correspondiente al mismo id de perfil y adopta el token que sea más reciente, sin copiar el token de actualización al almacén del agente secundario. Si desea una cuenta OAuth totalmente independiente, inicie sesión desde ese agente. Si copia las credenciales manualmente, copie únicamente perfiles portátiles estáticos de tipo `api_key` o `token`; el material de actualización de OAuth no es portátil de forma predeterminada (`copyToAgents` puede habilitarlo explícitamente para un perfil).
</Warning>

Las Skills se cargan desde el espacio de trabajo de cada agente y desde raíces compartidas como `~/.openclaw/skills`, y después se filtran mediante la lista efectiva de Skills permitidas para el agente. Use `agents.defaults.skills` como base compartida y `agents.list[].skills` como sustitución por agente (las entradas explícitas sustituyen el valor predeterminado; no se combinan). Consulte [Skills: por agente frente a compartidas](/es/tools/skills#per-agent-vs-shared-skills) y [Skills: listas permitidas de agentes](/es/tools/skills#agent-allowlists).

El almacenamiento propiedad de un Plugin sigue la configuración de ese Plugin; añadir un segundo agente
no divide automáticamente todos los almacenes globales de los Plugins. Por ejemplo, configure
[bóvedas de Memory Wiki por agente](/es/concepts/multi-agent#per-agent-memory-wiki-vaults)
cuando las personas no deban compartir el conocimiento compilado de la wiki.

<Note>
**Nota sobre el espacio de trabajo:** el espacio de trabajo de cada agente es el **cwd predeterminado**, no un entorno aislado estricto. Las rutas relativas se resuelven dentro del espacio de trabajo, pero las rutas absolutas pueden acceder a otras ubicaciones del host, a menos que se habilite el aislamiento. Consulte [Aislamiento](/es/gateway/sandboxing).
</Note>

## Rutas

| Elemento                         | Valor predeterminado                                                                    | Sustitución                                                                               |
| -------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Configuración                    | `~/.openclaw/openclaw.json`                                                            | `OPENCLAW_CONFIG_PATH`                                                                   |
| Directorio de estado             | `~/.openclaw`                                                                          | `OPENCLAW_STATE_DIR`                                                                     |
| Espacio de trabajo del agente predeterminado | `~/.openclaw/workspace` (o `workspace-<profile>` cuando se establece `OPENCLAW_PROFILE`) | `agents.list[].workspace`, después `agents.defaults.workspace`, o `OPENCLAW_WORKSPACE_DIR` |
| Espacio de trabajo de otros agentes | `<stateDir>/workspace-<agentId>` (o `<agents.defaults.workspace>/<agentId>` cuando se establece) | `agents.list[].workspace`                                                                |
| Directorio del agente            | `~/.openclaw/agents/<agentId>/agent`                                                   | `agents.list[].agentDir`                                                                 |
| Sesiones y transcripciones       | `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`                             | —                                                                                        |
| Artefactos de sesión heredados/archivados | `~/.openclaw/agents/<agentId>/sessions`                                                | —                                                                                        |

### Modo de un solo agente (predeterminado)

Si no configura nada, OpenClaw ejecuta un agente:

- El valor predeterminado de `agentId` es `main`.
- Las sesiones usan claves con el formato `agent:main:<mainKey>` (el valor predeterminado de `mainKey` es `main`).
- El espacio de trabajo predeterminado es `~/.openclaw/workspace` (o `workspace-<profile>` cuando `OPENCLAW_PROFILE` se establece en un valor distinto de `default`).
- El estado predeterminado se encuentra en `~/.openclaw/agents/main/agent`.

## Asistente de agentes

Añada un nuevo agente aislado:

```bash
openclaw agents add work
```

Opciones: `--workspace <dir>`, `--model <id>`, `--agent-dir <dir>`, `--bind <channel[:accountId]>` (se puede repetir), `--non-interactive` (requiere `--workspace`).

Añada `bindings` para enrutar los mensajes entrantes (el asistente ofrece hacerlo), y después verifique:

```bash
openclaw agents list --bindings
```

## Inicio rápido

<Steps>
  <Step title="Crear el espacio de trabajo de cada agente">
    ```bash
    openclaw agents add coding
    openclaw agents add social
    ```

    Cada agente obtiene su propio espacio de trabajo con `SOUL.md`, `AGENTS.md` y un archivo `USER.md` opcional, además de un `agentDir` dedicado y un almacén de sesiones en `~/.openclaw/agents/<agentId>`.

  </Step>
  <Step title="Crear cuentas de canales">
    Cree una cuenta por agente en los canales que prefiera:

    - Discord: un bot por agente; habilite Message Content Intent y copie cada token.
    - Telegram: un bot por agente mediante BotFather; copie cada token.
    - WhatsApp: vincule cada número de teléfono por cuenta.

    ```bash
    openclaw channels login --channel whatsapp --account work
    ```

    Consulte las guías de los canales: [Discord](/es/channels/discord), [Telegram](/es/channels/telegram), [WhatsApp](/es/channels/whatsapp).

  </Step>
  <Step title="Añadir agentes, cuentas y vinculaciones">
    Añada los agentes en `agents.list`, las cuentas de canales en `channels.<channel>.accounts` y conéctelos mediante `bindings` (consulte los ejemplos siguientes).
  </Step>
  <Step title="Reiniciar y verificar">
    ```bash
    openclaw gateway restart
    openclaw agents list --bindings
    openclaw channels status --probe
    ```
  </Step>
</Steps>

## Varios agentes, varias personas

Cada `agentId` configurado es un límite de persona distinto para el estado central del agente:

- Cuentas diferentes por canal (por `accountId`).
- Personalidades diferentes (`AGENTS.md`/`SOUL.md` por agente).
- Autenticación y sesiones independientes, con acceso entre agentes habilitado únicamente mediante funciones explícitas o la configuración de Plugins.

Esto permite que varias personas compartan un Gateway mientras se mantiene separado el estado central de los agentes.

## Bóvedas de Memory Wiki por agente

Memory Wiki utiliza una bóveda global de forma predeterminada. Para mantener el
conocimiento compilado de un agente de soporte separado del de un agente de marketing,
establezca `plugins.entries.memory-wiki.config.vault.scope` en `agent`:

```json5
{
  plugins: {
    entries: {
      "memory-wiki": {
        enabled: true,
        config: {
          vault: {
            scope: "agent",
            path: "~/.openclaw/wiki",
          },
        },
      },
    },
  },
}
```

La ruta configurada es el directorio principal. OpenClaw añade el
id normalizado del agente, lo que genera rutas como `~/.openclaw/wiki/support` y
`~/.openclaw/wiki/marketing`. Las operaciones de la CLI y del Gateway con ámbito de agente requieren
que se especifique un agente cuando hay varios agentes configurados. Consulte
[Bóvedas de Memory Wiki por agente](/es/plugins/memory-wiki#per-agent-vaults) para obtener detalles sobre el
filtrado del puente, la migración y los límites de confianza.

## Búsqueda de memoria QMD entre agentes

Para permitir que un agente busque en las transcripciones de sesiones QMD de otro agente, añada colecciones adicionales en `agents.list[].memorySearch.qmd.extraCollections`. Use `agents.defaults.memorySearch.qmd.extraCollections` cuando todos los agentes deban compartir las mismas colecciones.

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
            extraCollections: [{ path: "notes" }], // se resuelve dentro del espacio de trabajo -> colección denominada "notes-main"
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

Una ruta de colección adicional se puede compartir entre agentes, pero su `name` permanece explícito cuando la ruta está fuera del espacio de trabajo del agente. Las rutas dentro del espacio de trabajo conservan el ámbito del agente, de modo que cada agente mantiene su propio conjunto de búsqueda de transcripciones.

## Un número de WhatsApp, varias personas (división de MD)

Enrute distintos MD de WhatsApp a distintos agentes en **una** cuenta de WhatsApp haciendo coincidir el remitente E.164 (`+15551234567`) con `peer.kind: "direct"`. Las respuestas seguirán procediendo del mismo número de WhatsApp: no existe una identidad de remitente por agente.

<Note>
Los chats directos se condensan en la clave de sesión principal del agente de forma predeterminada, por lo que el aislamiento real requiere un agente por persona.
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

El control de acceso a los MD (emparejamiento/lista de permitidos) es global para cada cuenta de WhatsApp, no para cada agente. Para los grupos compartidos, vincule el grupo a un agente o use [Grupos de difusión](/es/channels/broadcast-groups).

## Reglas de enrutamiento

Las vinculaciones son deterministas y gana la más específica. Consulte [Enrutamiento de canales](/es/channels/channel-routing#routing-rules-how-an-agent-is-chosen) para conocer el orden completo de niveles (par exacto, par principal, comodín de par, gremio+roles, gremio, equipo, cuenta, canal, agente predeterminado). Conviene destacar algunas reglas:

- Si varias vinculaciones coinciden dentro del mismo nivel, gana la primera según el orden de la configuración.
- Si una vinculación establece varios campos de coincidencia (por ejemplo, `peer` + `guildId`), todos los campos especificados deben coincidir (semántica `AND`).
- Una vinculación que omite `accountId` solo coincide con la cuenta predeterminada, no con todas las cuentas. Use `accountId: "*"` como alternativa para todo el canal o `accountId: "<name>"` para una cuenta. Si se vuelve a añadir la misma vinculación con un id de cuenta explícito, se actualiza la vinculación existente que solo especificaba el canal, en lugar de duplicarla.

## Varias cuentas/números de teléfono

Los canales que admiten varias cuentas (por ejemplo, WhatsApp) usan `accountId` para identificar cada inicio de sesión. Cada `accountId` se enruta a su propio agente, por lo que un servidor puede alojar varios números de teléfono sin mezclar las sesiones.

Establezca `channels.<channel>.defaultAccount` para elegir la cuenta que se usa cuando se omite `accountId`. Si no se establece, OpenClaw utiliza `default` si está presente; de lo contrario, utiliza el primer id de cuenta configurado (ordenado).

Canales que admiten varias cuentas: `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `mattermost`, `matrix`, `nextcloud-talk`, `nostr`, `signal`, `slack`, `telegram`, `whatsapp`, `zalo`, `zalouser`.

## Conceptos

- `agentId`: un «cerebro» (espacio de trabajo, autenticación por agente, almacén de sesiones por agente).
- `accountId`: una instancia de cuenta de canal (p. ej., la cuenta de WhatsApp `personal` frente a `biz`).
- `binding`: dirige los mensajes entrantes a un `agentId` según `(channel, accountId, peer)` y, opcionalmente, los identificadores de servidor/equipo.
- Los chats directos se agrupan en `agent:<agentId>:<mainKey>` (la sesión «principal» de cada agente; consulte `session.mainKey`).

## Ejemplos de plataformas

<AccordionGroup>
  <Accordion title="Bots de Discord por agente">
    Cada cuenta de bot de Discord se asigna a un `accountId` único. Vincule cada cuenta a un agente y mantenga listas de permitidos independientes para cada bot.

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

    - Invite cada bot al servidor y habilite Message Content Intent.
    - Los tokens se almacenan en `channels.discord.accounts.<id>.token` (la cuenta predeterminada puede usar `DISCORD_BOT_TOKEN`).

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

    - Cree un bot por agente con BotFather y copie cada token.
    - Los tokens se almacenan en `channels.telegram.accounts.<id>.botToken` (la cuenta predeterminada puede usar `TELEGRAM_BOT_TOKEN`).
    - Para usar varios bots en el mismo grupo de Telegram, invite cada bot y mencione el que debe responder.
    - Deshabilite Privacy Mode de BotFather para cada bot de grupo (`/setprivacy` -> Disable) y, a continuación, elimine y vuelva a añadir el bot para que Telegram aplique la configuración.
    - Permita grupos con `channels.telegram.groups`, o use `groupPolicy: "open"` solo en implementaciones de grupos de confianza.
    - Incluya los identificadores de usuario de los remitentes en `groupAllowFrom`. Los identificadores de grupos y supergrupos deben incluirse en `channels.telegram.groups`, no en `groupAllowFrom`.
    - Vincule mediante `accountId` para que cada bot dirija los mensajes a su propio agente.

  </Accordion>
  <Accordion title="Números de WhatsApp por agente">
    Vincule cada cuenta antes de iniciar el Gateway:

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

      // Enrutamiento determinista: gana la primera coincidencia (primero la más específica).
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

        // Sobrescritura opcional por interlocutor (ejemplo: enviar un grupo específico al agente de trabajo).
        {
          agentId: "work",
          match: {
            channel: "whatsapp",
            accountId: "personal",
            peer: { kind: "group", id: "1203630...@g.us" },
          },
        },
      ],

      // Desactivado de forma predeterminada: la mensajería entre agentes debe habilitarse explícitamente y añadirse a la lista de permitidos.
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
              // Sobrescritura opcional. Valor predeterminado: ~/.openclaw/credentials/whatsapp/personal
              // authDir: "~/.openclaw/credentials/whatsapp/personal",
            },
            biz: {
              // Sobrescritura opcional. Valor predeterminado: ~/.openclaw/credentials/whatsapp/biz
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
  <Tab title="WhatsApp diario + trabajo profundo en Telegram">
    Divida por canal: dirija WhatsApp a un agente rápido para el uso diario y Telegram a un agente Opus.

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

    Estos ejemplos usan `accountId: "*"` para que las vinculaciones sigan funcionando si se añaden cuentas más adelante. Para dirigir un único mensaje directo o grupo a Opus y mantener el resto en el agente de chat, añada una vinculación `match.peer` para ese interlocutor; las coincidencias de interlocutor siempre tienen prioridad sobre las reglas que abarcan todo el canal.

  </Tab>
  <Tab title="Mismo canal, un interlocutor dirigido a Opus">
    Mantenga WhatsApp en el agente rápido, pero dirija un mensaje directo a Opus:

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

    Las vinculaciones de interlocutor siempre tienen prioridad, por lo que deben colocarse antes de la regla que abarca todo el canal.

  </Tab>
  <Tab title="Agente familiar vinculado a un grupo de WhatsApp">
    Vincule un agente familiar dedicado a un único grupo de WhatsApp, con la obligación de mencionarlo y una política de herramientas más restrictiva:

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

    Las listas de herramientas permitidas/denegadas corresponden a **herramientas**, no a Skills. Si una skill necesita ejecutar un binario, asegúrese de que `exec` esté permitido y de que el binario exista en el entorno aislado. Para aplicar restricciones más estrictas, establezca `agents.list[].groupChat.mentionPatterns` y mantenga habilitadas las listas de grupos permitidos para el canal.

  </Tab>
</Tabs>

## Configuración del entorno aislado y las herramientas por agente

Cada agente puede tener sus propias restricciones de entorno aislado y herramientas:

```js
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: {
          mode: "off",  // Sin entorno aislado para el agente personal
        },
        // Sin restricciones de herramientas: todas las herramientas están disponibles
      },
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",     // Siempre en un entorno aislado
          scope: "agent",  // Un contenedor por agente
          docker: {
            // Configuración inicial opcional tras crear el contenedor
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],                    // Solo la herramienta de lectura
          deny: ["exec", "write", "edit", "apply_patch"],    // Denegar las demás
        },
      },
    ],
  },
}
```

<Note>
`setupCommand` se encuentra en `sandbox.docker` y se ejecuta una vez al crear el contenedor. Las sobrescrituras `sandbox.docker.*` por agente se ignoran cuando el ámbito resuelto es `"shared"`.
</Note>

Esto proporciona:

- **Aislamiento de seguridad**: restrinja las herramientas de los agentes que no sean de confianza.
- **Control de recursos**: aísle agentes específicos mientras mantiene los demás en el host.
- **Políticas flexibles**: use permisos diferentes para cada agente.

<Note>
`tools.elevated` tiene tanto un control global (`tools.elevated.enabled`/`allowFrom`) como un control por agente (`agents.list[].tools.elevated.enabled`/`allowFrom`). El control por agente solo puede restringir aún más el global: ambos deben permitir a un remitente para que se ejecuten comandos elevados. Para dirigir mensajes de grupos, use `agents.list[].groupChat.mentionPatterns` a fin de que las @menciones se asignen claramente al agente previsto.
</Note>

Consulte [Entorno aislado y herramientas para varios agentes](/es/tools/multi-agent-sandbox-tools) para ver ejemplos detallados.

## Temas relacionados

- [Agentes ACP](/es/tools/acp-agents) — ejecución de entornos externos de programación
- [Enrutamiento de canales](/es/channels/channel-routing) — cómo se dirigen los mensajes a los agentes
- [Presencia](/es/concepts/presence) — presencia y disponibilidad de los agentes
- [Sesión](/es/concepts/session) — aislamiento y enrutamiento de sesiones
- [Subagentes](/es/tools/subagents) — inicio de ejecuciones de agentes en segundo plano
