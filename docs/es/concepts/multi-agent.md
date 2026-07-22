---
read_when: You want multiple agents with separate workspaces, auth, and sessions in one Gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: 'Enrutamiento multiagente: límites de los agentes, cuentas de canales y vinculaciones'
title: Enrutamiento multiagente
x-i18n:
    generated_at: "2026-07-22T10:31:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 46df162388205e46d5a4ea3567c8c8f7016117d2ecafe1184a35b4c95798fd80
    source_path: concepts/multi-agent.md
    workflow: 16
---

Ejecute varios agentes _aislados_ en un solo proceso de Gateway, cada uno con su propio espacio de trabajo, directorio de estado (`agentDir`) e historial de sesiones respaldado por SQLite, además de varias cuentas de canales (por ejemplo, dos números de WhatsApp). Los mensajes entrantes se dirigen al agente correcto mediante **vinculaciones**.

Un **agente** es el ámbito completo de cada persona: archivos del espacio de trabajo, perfiles de autenticación, registro de modelos y almacén de sesiones. Una **vinculación** asigna una cuenta de canal (un espacio de trabajo de Slack, un número de WhatsApp, etc.) a uno de esos agentes.

## Qué es un agente

Cada agente tiene sus propios elementos:

- **Espacio de trabajo**: archivos, `AGENTS.md`/`SOUL.md`/`USER.md`, notas locales, reglas de la persona.
- **Directorio de estado** (`agentDir`): perfiles de autenticación, registro de modelos, configuración por agente.
- **Almacén de sesiones**: historial de chat y estado de enrutamiento en `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`.

Los perfiles de autenticación son específicos de cada agente y se leen desde:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

<Note>
`sessions_history` es la vía más segura para recuperar información entre sesiones: devuelve una vista limitada y censurada, no un volcado del registro sin procesar. Elimina las firmas de bloques de razonamiento, los detalles de las cargas útiles de resultados de herramientas, la estructura auxiliar de `<relevant-memories>`, las etiquetas XML de llamadas a herramientas (`<tool_call>`, `<function_call>` y sus formas plurales o degradadas) y el XML de llamadas a herramientas de MiniMax; después, trunca y limita la salida por tamaño en bytes.
</Note>

<Warning>
Nunca reutilice `agentDir` entre agentes, ya que provoca colisiones en el estado de autenticación y de las sesiones. Cuando la credencial OAuth local de un agente secundario ha caducado o falla su actualización, OpenClaw consulta la credencial del agente predeterminado/principal para el mismo id de perfil y adopta el token que esté más actualizado, sin copiar el token de actualización al almacén del agente secundario. Si desea una cuenta OAuth completamente independiente, inicie sesión desde ese agente. Si copia credenciales manualmente, copie únicamente perfiles estáticos y portables de `api_key` o `token`; el material de actualización de OAuth no es portable de forma predeterminada (`copyToAgents` puede habilitarlo explícitamente para un perfil).
</Warning>

Las Skills se cargan desde el espacio de trabajo de cada agente y desde raíces compartidas como `~/.openclaw/skills`, y después se filtran según la lista de Skills permitidas efectiva del agente. Use `agents.defaults.skills` para una base compartida y `agents.entries.*.skills` para reemplazarla por agente (las entradas explícitas sustituyen el valor predeterminado, no se combinan con él). Consulte [Skills: por agente frente a compartidas](/es/tools/skills#per-agent-vs-shared-skills) y [Skills: listas de permitidas por agente](/es/tools/skills#agent-allowlists).

El almacenamiento propiedad de un plugin sigue la configuración de ese plugin; añadir un segundo agente
no divide automáticamente todos los almacenes globales de plugins. Por ejemplo, configure
[bóvedas de Memory Wiki por agente](/es/concepts/multi-agent#per-agent-memory-wiki-vaults)
cuando las personas no deban compartir el conocimiento compilado de la wiki.

<Note>
**Nota sobre el espacio de trabajo:** el espacio de trabajo de cada agente es el **directorio de trabajo actual predeterminado**, no un entorno aislado estricto. Las rutas relativas se resuelven dentro del espacio de trabajo, pero las rutas absolutas pueden acceder a otras ubicaciones del host, salvo que se habilite el aislamiento. Consulte [Aislamiento](/es/gateway/sandboxing).
</Note>

## Rutas

| Elemento                         | Valor predeterminado                                                                    | Sustitución                                                                                 |
| -------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Configuración                    | `~/.openclaw/openclaw.json`                                                            | `OPENCLAW_CONFIG_PATH`                                                                      |
| Directorio de estado             | `~/.openclaw`                                                                          | `OPENCLAW_STATE_DIR`                                                                        |
| Espacio de trabajo del agente predeterminado | `~/.openclaw/workspace` (o `workspace-<profile>` cuando se establece `OPENCLAW_PROFILE`)      | `agents.entries.*.workspace`, después `agents.defaults.workspace`, o `OPENCLAW_WORKSPACE_DIR` |
| Espacio de trabajo de otros agentes | `<stateDir>/workspace-<agentId>` (o `<agents.defaults.workspace>/<agentId>` cuando se establece) | `agents.entries.*.workspace`                                                                |
| Directorio del agente            | `~/.openclaw/agents/<agentId>/agent`                                                   | `agents.entries.*.agentDir`                                                                 |
| Sesiones y registros             | `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`                             | —                                                                                           |
| Artefactos de sesiones heredados/archivados | `~/.openclaw/agents/<agentId>/sessions`                                                | —                                                                                           |

### Modo de agente único (predeterminado)

Si no configura nada, OpenClaw ejecuta un agente:

- `agentId` tiene como valor predeterminado `main`.
- Las claves de sesión tienen el formato `agent:main:<mainKey>` (el valor predeterminado de `mainKey` es `main`).
- El espacio de trabajo tiene como valor predeterminado `~/.openclaw/workspace` (o `workspace-<profile>` cuando `OPENCLAW_PROFILE` se establece en un valor distinto de `default`).
- El estado tiene como valor predeterminado `~/.openclaw/agents/main/agent`.

## Asistente de agentes

Añada un nuevo agente aislado:

```bash
openclaw agents add work
```

Opciones: `--workspace <dir>`, `--model <id>`, `--agent-dir <dir>`, `--bind <channel[:accountId]>` (repetible), `--non-interactive` (requiere `--workspace`).

Añada `bindings` para dirigir los mensajes entrantes (el asistente ofrece hacerlo) y, a continuación, verifique:

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

    Cada agente obtiene su propio espacio de trabajo con `SOUL.md`, `AGENTS.md` y el elemento opcional `USER.md`, además de un `agentDir` dedicado y un almacén de sesiones en `~/.openclaw/agents/<agentId>`.

  </Step>
  <Step title="Crear cuentas de canales">
    Cree una cuenta por agente en los canales que prefiera:

    - Discord: un bot por agente; habilite Message Content Intent y copie cada token.
    - Telegram: un bot por agente mediante BotFather; copie cada token.
    - WhatsApp: vincule cada número de teléfono por cuenta.

    ```bash
    openclaw channels login --channel whatsapp --account work
    ```

    Consulte las guías de canales: [Discord](/es/channels/discord), [Telegram](/es/channels/telegram), [WhatsApp](/es/channels/whatsapp).

  </Step>
  <Step title="Añadir agentes, cuentas y vinculaciones">
    Añada agentes en `agents.entries`, cuentas de canales en `channels.<channel>.accounts` y conéctelos mediante `bindings` (consulte los ejemplos siguientes).
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

Cada `agentId` configurado constituye un límite de persona distinto para el estado principal del agente:

- Cuentas diferentes por canal (por `accountId`).
- Personalidades diferentes (`AGENTS.md`/`SOUL.md` por agente).
- Autenticación y sesiones separadas, con acceso entre agentes habilitado únicamente mediante funciones explícitas o la configuración de plugins.

Esto permite que varias personas compartan un Gateway mientras se mantiene separado el estado principal de cada agente.

## Bóvedas de Memory Wiki por agente

Memory Wiki utiliza una única bóveda global de forma predeterminada. Para mantener separado el
conocimiento compilado de un agente de soporte del de un agente de marketing, establezca
`plugins.entries.memory-wiki.config.vault.scope` en `agent`:

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
un agente explícito cuando se configuran varios agentes. Consulte
[Bóvedas de Memory Wiki por agente](/es/plugins/memory-wiki#per-agent-vaults) para obtener detalles sobre el
filtrado del puente, la migración y los límites de confianza.

## Búsqueda de memoria QMD entre agentes

Para permitir que un agente busque en los registros de sesiones QMD de otro agente, añada colecciones adicionales en `agents.entries.*.memory.search.qmd.extraCollections`. Use `memory.search.qmd.extraCollections` cuando todos los agentes deban compartir las mismas colecciones.

```json5
{
  agents: {
    defaults: {
      workspace: "~/workspaces/main",
    },
    entries: {
      main: {
        workspace: "~/workspaces/main",
        memory: {
          search: {
            qmd: {
              extraCollections: [{ path: "notes" }], // se resuelve dentro del espacio de trabajo -> colección denominada "notes-main"
            },
          },
        },
      },
      family: { workspace: "~/workspaces/family" },
    },
  },
  memory: {
    backend: "qmd",
    search: {
      qmd: {
        extraCollections: [{ path: "~/agents/family/sessions", name: "family-sessions" }],
      },
    },
    qmd: { includeDefaultMemory: false },
  },
}
```

La ruta de una colección adicional puede compartirse entre agentes, pero su `name` permanece explícito cuando la ruta se encuentra fuera del espacio de trabajo del agente. Las rutas situadas dentro del espacio de trabajo mantienen el ámbito del agente, de modo que cada agente conserva su propio conjunto de búsqueda de registros.

## Un número de WhatsApp, varias personas (división de mensajes directos)

Dirija distintos mensajes directos de WhatsApp a diferentes agentes en **una** cuenta de WhatsApp haciendo coincidir el remitente E.164 (`+15551234567`) con `peer.kind: "direct"`. Las respuestas siguen procediendo del mismo número de WhatsApp; no existe una identidad de remitente por agente.

<Note>
Los chats directos se agrupan de forma predeterminada en la clave de sesión principal del agente, por lo que un aislamiento real requiere un agente por persona.
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

El control de acceso a los mensajes directos (emparejamiento/lista de permitidos) es global para cada cuenta de WhatsApp, no para cada agente. Para grupos compartidos, vincule el grupo a un agente o use [Grupos de difusión](/es/channels/broadcast-groups).

## Reglas de enrutamiento

Las vinculaciones son deterministas y gana la más específica. Consulte [Enrutamiento de canales](/es/channels/channel-routing#routing-rules-how-an-agent-is-chosen) para ver el orden completo de niveles (interlocutor exacto, interlocutor principal, comodín de interlocutor, gremio+roles, gremio, equipo, cuenta, canal, agente predeterminado). Conviene destacar aquí algunas reglas:

- Si varias vinculaciones coinciden dentro del mismo nivel, gana la primera según el orden de la configuración.
- Si una vinculación establece varios campos de coincidencia (por ejemplo, `peer` + `guildId`), todos los campos especificados deben coincidir (semántica de `AND`).
- Una vinculación que omite `accountId` solo coincide con la cuenta predeterminada, no con todas las cuentas. Use `accountId: "*"` como alternativa para todo el canal o `accountId: "<name>"` para una sola cuenta. Si se vuelve a añadir la misma vinculación con un id de cuenta explícito, se actualiza la vinculación existente exclusiva del canal en lugar de duplicarla.

## Varias cuentas/números de teléfono

Los canales que admiten varias cuentas (por ejemplo, WhatsApp) usan `accountId` para identificar cada inicio de sesión. Cada `accountId` se dirige a su propio agente, por lo que un servidor puede alojar varios números de teléfono sin mezclar sesiones.

Establece `channels.<channel>.defaultAccount` para elegir la cuenta utilizada cuando se omite `accountId`. Si no se establece, OpenClaw recurre a `default` si está presente; de lo contrario, usa el primer id de cuenta configurado (ordenado).

Canales compatibles con varias cuentas: `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `mattermost`, `matrix`, `nextcloud-talk`, `nostr`, `signal`, `slack`, `telegram`, `whatsapp`, `zalo`, `zalouser`.

## Conceptos

- `agentId`: un «cerebro» (espacio de trabajo, autenticación por agente y almacén de sesiones por agente).
- `accountId`: una instancia de cuenta de canal (p. ej., la cuenta de WhatsApp `personal` frente a `biz`).
- `binding`: enruta los mensajes entrantes a un `agentId` según `(channel, accountId, peer)` y, opcionalmente, los ids de gremio/equipo.
- Los chats directos se agrupan en `agent:<agentId>:<mainKey>` (el «principal» por agente; consulta `session.mainKey`).

## Ejemplos de plataformas

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

    - Invita a cada bot al gremio y habilita Message Content Intent.
    - Los tokens se encuentran en `channels.discord.accounts.<id>.token` (la cuenta predeterminada puede usar `DISCORD_BOT_TOKEN`).

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
    - Los tokens se encuentran en `channels.telegram.accounts.<id>.botToken` (la cuenta predeterminada puede usar `TELEGRAM_BOT_TOKEN`).
    - Para usar varios bots en el mismo grupo de Telegram, invita a cada bot y menciona al que debe responder.
    - Deshabilita Privacy Mode de BotFather para cada bot de grupo (`/setprivacy` -> Disable) y, a continuación, elimina y vuelve a añadir el bot para que Telegram aplique la configuración.
    - Permite grupos con `channels.telegram.groups` o usa `groupPolicy: "open"` solo en implementaciones de grupos de confianza.
    - Incluye los ids de usuario de los remitentes en `groupAllowFrom`. Los ids de grupos y supergrupos deben incluirse en `channels.telegram.groups`, no en `groupAllowFrom`.
    - Vincula según `accountId` para que cada bot enrute los mensajes a su propio agente.

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

      // Enrutamiento determinista: gana la primera coincidencia (primero la más específica).
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

        // Anulación opcional por interlocutor (ejemplo: enviar un grupo específico al agente de trabajo).
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
              // Anulación opcional. Valor predeterminado: ~/.openclaw/credentials/whatsapp/personal
              // authDir: "~/.openclaw/credentials/whatsapp/personal",
            },
            biz: {
              // Anulación opcional. Valor predeterminado: ~/.openclaw/credentials/whatsapp/biz
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
  <Tab title="WhatsApp para el día a día y Telegram para trabajo profundo">
    Divide por canal: enruta WhatsApp a un agente rápido para el día a día y Telegram a un agente Opus.

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

    Estos ejemplos usan `accountId: "*"` para que las vinculaciones sigan funcionando si se añaden cuentas más adelante. Para enrutar un único mensaje directo/grupo a Opus y mantener el resto en el chat, añade una vinculación `match.peer` para ese interlocutor; las coincidencias de interlocutor siempre tienen prioridad sobre las reglas para todo el canal.

  </Tab>
  <Tab title="Mismo canal, un interlocutor para Opus">
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

    Las vinculaciones de interlocutores siempre tienen prioridad, así que mantenlas por encima de la regla para todo el canal.

  </Tab>
  <Tab title="Agente familiar vinculado a un grupo de WhatsApp">
    Vincula un agente familiar dedicado a un único grupo de WhatsApp, con requisito de mención y una política de herramientas más restrictiva:

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

    Las listas de herramientas permitidas/denegadas son **herramientas**, no Skills. Si una habilidad necesita ejecutar un binario, asegúrate de que `exec` esté permitido y de que el binario exista en el entorno aislado. Para aplicar un control más estricto, establece `agents.entries.*.groupChat.mentionPatterns` y mantén habilitadas las listas de grupos permitidos para el canal.

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
        // Sin restricciones de herramientas: todas están disponibles
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
`setupCommand` se encuentra en `sandbox.docker` y se ejecuta una vez al crear el contenedor. Las anulaciones de `sandbox.docker.*` por agente se ignoran cuando el ámbito resuelto es `"shared"`.
</Note>

Esto proporciona:

- **Aislamiento de seguridad**: restringe las herramientas para agentes que no sean de confianza.
- **Control de recursos**: ejecuta agentes específicos en un entorno aislado mientras mantienes los demás en el host.
- **Políticas flexibles**: permisos diferentes para cada agente.

<Note>
`tools.elevated` tiene tanto un control global (`tools.elevated.enabled`/`allowFrom`) como uno por agente (`agents.entries.*.tools.elevated.enabled`/`allowFrom`). El control por agente solo puede restringir aún más el global: ambos deben permitir al remitente para que se ejecuten comandos con privilegios elevados. Para dirigirse a grupos, usa `agents.entries.*.groupChat.mentionPatterns` para que las @menciones se asignen correctamente al agente previsto.
</Note>

Consulta [Entorno aislado y herramientas multiagente](/es/tools/multi-agent-sandbox-tools) para ver ejemplos detallados.

## Contenido relacionado

- [Agentes ACP](/es/tools/acp-agents) — ejecución de entornos externos de programación
- [Enrutamiento de canales](/es/channels/channel-routing) — cómo se enrutan los mensajes a los agentes
- [Presencia](/es/concepts/presence) — presencia y disponibilidad de los agentes
- [Sesión](/es/concepts/session) — aislamiento y enrutamiento de sesiones
- [Subagentes](/es/tools/subagents) — inicio de ejecuciones de agentes en segundo plano
