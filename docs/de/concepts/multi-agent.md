---
read_when: You want multiple agents with separate workspaces, auth, and sessions in one Gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: 'Multi-Agent-Routing: Agentengrenzen, Kanalkonten und Bindungen'
title: Multi-Agenten-Routing
x-i18n:
    generated_at: "2026-07-12T15:13:10Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 265a1f3d9d9b4957c99c71f391ce4f5abba6b70561570f8bbe8cb9964ece1cfc
    source_path: concepts/multi-agent.md
    workflow: 16
---

Führen Sie mehrere _isolierte_ Agenten in einem Gateway-Prozess aus, jeweils mit eigenem Workspace, Zustandsverzeichnis (`agentDir`) und SQLite-gestütztem Sitzungsverlauf sowie mehreren Kanalkonten (z. B. zwei WhatsApp-Nummern). Eingehende Nachrichten werden über **Bindungen** an den richtigen Agenten weitergeleitet.

Ein **Agent** umfasst den vollständigen Bereich einer Persona: Workspace-Dateien, Authentifizierungsprofile, Modellregister und Sitzungsspeicher. Eine **Bindung** ordnet ein Kanalkonto (einen Slack-Workspace, eine WhatsApp-Nummer usw.) einem dieser Agenten zu.

## Was ist ein Agent?

Jeder Agent verfügt über einen eigenen:

- **Workspace**: Dateien, `AGENTS.md`/`SOUL.md`/`USER.md`, lokale Notizen, Persona-Regeln.
- **Zustandsverzeichnis** (`agentDir`): Authentifizierungsprofile, Modellregister, agentenspezifische Konfiguration.
- **Sitzungsspeicher**: Chatverlauf und Routing-Zustand in `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`.

Authentifizierungsprofile gelten jeweils pro Agent und werden aus folgendem Pfad gelesen:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

<Note>
`sessions_history` ist der sicherere Weg zum sitzungsübergreifenden Abruf: Es gibt eine begrenzte, redigierte Ansicht zurück und keinen Rohdump des Transkripts. Signaturen von Denkblöcken, Nutzdaten-Details aus Tool-Ergebnissen, das Gerüst `<relevant-memories>`, XML-Tags für Tool-Aufrufe (`<tool_call>`, `<function_call>` und deren Plural-/herabgestufte Formen) sowie MiniMax-XML für Tool-Aufrufe werden entfernt; anschließend wird die Ausgabe gekürzt und anhand ihrer Byte-Größe begrenzt.
</Note>

<Warning>
Verwenden Sie `agentDir` niemals für mehrere Agenten — dies führt zu Kollisionen beim Authentifizierungs- und Sitzungszustand. Wenn die lokale OAuth-Anmeldeinformation eines sekundären Agenten abgelaufen ist oder ihre Aktualisierung fehlschlägt, greift OpenClaw auf die Anmeldeinformation des Standard-/Hauptagenten mit derselben Profil-ID zurück und übernimmt das jeweils aktuellste Token, ohne das Aktualisierungstoken in den Speicher des sekundären Agenten zu kopieren. Wenn Sie ein vollständig unabhängiges OAuth-Konto verwenden möchten, melden Sie sich über diesen Agenten an. Wenn Sie Anmeldeinformationen manuell kopieren, kopieren Sie ausschließlich portable statische Profile vom Typ `api_key` oder `token` — OAuth-Aktualisierungsmaterial ist standardmäßig nicht portabel (`copyToAgents` kann ein Profil ausdrücklich dafür freigeben).
</Warning>

Skills werden aus dem Workspace jedes Agenten sowie aus gemeinsam genutzten Stammverzeichnissen wie `~/.openclaw/skills` geladen und anschließend anhand der effektiven Skill-Zulassungsliste des Agenten gefiltert. Verwenden Sie `agents.defaults.skills` für eine gemeinsame Grundlage und `agents.list[].skills` als agentenspezifischen Ersatz (explizite Einträge ersetzen den Standard, sie werden nicht zusammengeführt). Siehe [Skills: agentenspezifisch oder gemeinsam genutzt](/de/tools/skills#per-agent-vs-shared-skills) und [Skills: Zulassungslisten für Agenten](/de/tools/skills#agent-allowlists).

Der Plugin-eigene Speicher folgt der Konfiguration des jeweiligen Plugins; durch das Hinzufügen eines zweiten Agenten wird nicht automatisch jeder globale Plugin-Speicher aufgeteilt. Konfigurieren Sie beispielsweise [agentenspezifische Memory-Wiki-Vaults](/de/concepts/multi-agent#per-agent-memory-wiki-vaults), wenn Personas zusammengestelltes Wiki-Wissen nicht gemeinsam nutzen dürfen.

<Note>
**Hinweis zum Workspace:** Der Workspace jedes Agenten ist das **standardmäßige cwd**, keine harte Sandbox. Relative Pfade werden innerhalb des Workspace aufgelöst, absolute Pfade können jedoch auf andere Speicherorte des Hosts zugreifen, sofern Sandboxing nicht aktiviert ist. Siehe [Sandboxing](/de/gateway/sandboxing).
</Note>

## Pfade

| Element                          | Standard                                                                               | Überschreibung                                                                           |
| -------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Konfiguration                    | `~/.openclaw/openclaw.json`                                                            | `OPENCLAW_CONFIG_PATH`                                                                   |
| Zustandsverzeichnis              | `~/.openclaw`                                                                          | `OPENCLAW_STATE_DIR`                                                                     |
| Workspace des Standardagenten    | `~/.openclaw/workspace` (oder `workspace-<profile>`, wenn `OPENCLAW_PROFILE` gesetzt ist) | `agents.list[].workspace`, dann `agents.defaults.workspace` oder `OPENCLAW_WORKSPACE_DIR` |
| Workspace anderer Agenten        | `<stateDir>/workspace-<agentId>` (oder `<agents.defaults.workspace>/<agentId>`, wenn gesetzt) | `agents.list[].workspace`                                                                |
| Agentenverzeichnis               | `~/.openclaw/agents/<agentId>/agent`                                                   | `agents.list[].agentDir`                                                                 |
| Sitzungen und Transkripte        | `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`                             | —                                                                                        |
| Veraltete/archivierte Sitzungsartefakte | `~/.openclaw/agents/<agentId>/sessions`                                         | —                                                                                        |

### Einzelagentenmodus (Standard)

Wenn Sie nichts konfigurieren, führt OpenClaw einen Agenten aus:

- `agentId` ist standardmäßig `main`.
- Sitzungsschlüssel haben die Form `agent:main:<mainKey>` (der Standardwert von `mainKey` ist `main`).
- Der Workspace ist standardmäßig `~/.openclaw/workspace` (oder `workspace-<profile>`, wenn `OPENCLAW_PROFILE` auf einen anderen Wert als `default` gesetzt ist).
- Der Zustand befindet sich standardmäßig unter `~/.openclaw/agents/main/agent`.

## Agenten-Hilfsfunktion

Fügen Sie einen neuen isolierten Agenten hinzu:

```bash
openclaw agents add work
```

Flags: `--workspace <dir>`, `--model <id>`, `--agent-dir <dir>`, `--bind <channel[:accountId]>` (wiederholbar), `--non-interactive` (erfordert `--workspace`).

Fügen Sie `bindings` hinzu, um eingehende Nachrichten weiterzuleiten (der Assistent bietet Ihnen dies an), und überprüfen Sie anschließend die Konfiguration:

```bash
openclaw agents list --bindings
```

## Schnellstart

<Steps>
  <Step title="Workspace für jeden Agenten erstellen">
    ```bash
    openclaw agents add coding
    openclaw agents add social
    ```

    Jeder Agent erhält einen eigenen Workspace mit `SOUL.md`, `AGENTS.md` und optional `USER.md` sowie ein dediziertes `agentDir` und einen Sitzungsspeicher unter `~/.openclaw/agents/<agentId>`.

  </Step>
  <Step title="Kanalkonten erstellen">
    Erstellen Sie auf Ihren bevorzugten Kanälen jeweils ein Konto pro Agent:

    - Discord: ein Bot pro Agent; aktivieren Sie Message Content Intent und kopieren Sie jedes Token.
    - Telegram: ein Bot pro Agent über BotFather; kopieren Sie jedes Token.
    - WhatsApp: Verknüpfen Sie für jedes Konto jeweils eine Telefonnummer.

    ```bash
    openclaw channels login --channel whatsapp --account work
    ```

    Siehe Kanalanleitungen: [Discord](/de/channels/discord), [Telegram](/de/channels/telegram), [WhatsApp](/de/channels/whatsapp).

  </Step>
  <Step title="Agenten, Konten und Bindungen hinzufügen">
    Fügen Sie Agenten unter `agents.list` und Kanalkonten unter `channels.<channel>.accounts` hinzu und verbinden Sie sie mit `bindings` (Beispiele folgen).
  </Step>
  <Step title="Neu starten und überprüfen">
    ```bash
    openclaw gateway restart
    openclaw agents list --bindings
    openclaw channels status --probe
    ```
  </Step>
</Steps>

## Mehrere Agenten, mehrere Personas

Jede konfigurierte `agentId` bildet eine eigenständige Persona-Grenze für den zentralen Agentenzustand:

- Unterschiedliche Konten pro Kanal (je `accountId`).
- Unterschiedliche Persönlichkeiten (agentenspezifische `AGENTS.md`/`SOUL.md`).
- Getrennte Authentifizierung und Sitzungen; agentenübergreifender Zugriff wird ausschließlich über explizite Funktionen oder die Plugin-Konfiguration aktiviert.

Dadurch können sich mehrere Personen ein Gateway teilen, während der zentrale Zustand der Agenten getrennt bleibt.

## Agentenspezifische Memory-Wiki-Vaults

Memory Wiki verwendet standardmäßig ein globales Vault. Um das zusammengestellte Wissen eines Support-Agenten vom Wissen eines Marketing-Agenten zu trennen, setzen Sie `plugins.entries.memory-wiki.config.vault.scope` auf `agent`:

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

Der konfigurierte Pfad ist das übergeordnete Verzeichnis. OpenClaw hängt die normalisierte Agenten-ID an und erzeugt dadurch Pfade wie `~/.openclaw/wiki/support` und `~/.openclaw/wiki/marketing`. Agentenspezifische CLI- und Gateway-Vorgänge erfordern einen expliziten Agenten, wenn mehrere Agenten konfiguriert sind. Weitere Informationen zu Bridge-Filterung, Migration und Vertrauensgrenzen finden Sie unter [Agentenspezifische Memory-Wiki-Vaults](/de/plugins/memory-wiki#per-agent-vaults).

## Agentenübergreifende QMD-Speichersuche

Damit ein Agent die QMD-Sitzungstranskripte eines anderen Agenten durchsuchen kann, fügen Sie unter `agents.list[].memorySearch.qmd.extraCollections` zusätzliche Sammlungen hinzu. Verwenden Sie `agents.defaults.memorySearch.qmd.extraCollections`, wenn jeder Agent dieselben Sammlungen gemeinsam nutzen soll.

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
            extraCollections: [{ path: "notes" }], // wird innerhalb des Workspace aufgelöst -> Sammlung mit dem Namen "notes-main"
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

Der Pfad einer zusätzlichen Sammlung kann von mehreren Agenten gemeinsam genutzt werden, sein `name` bleibt jedoch explizit, wenn sich der Pfad außerhalb des Agenten-Workspace befindet. Pfade innerhalb des Workspace bleiben agentenspezifisch, sodass jeder Agent seinen eigenen Satz für die Transkriptsuche behält.

## Eine WhatsApp-Nummer, mehrere Personen (DM-Aufteilung)

Leiten Sie unterschiedliche WhatsApp-Direktnachrichten auf **einem** WhatsApp-Konto an unterschiedliche Agenten weiter, indem Sie die E.164-Nummer des Absenders (`+15551234567`) mit `peer.kind: "direct"` abgleichen. Antworten werden weiterhin von derselben WhatsApp-Nummer gesendet — es gibt keine agentenspezifische Absenderidentität.

<Note>
Direktchats werden standardmäßig im Hauptsitzungsschlüssel des Agenten zusammengeführt; eine echte Isolation erfordert daher einen Agenten pro Person.
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

Die Zugriffskontrolle für Direktnachrichten (Kopplung/Zulassungsliste) gilt global pro WhatsApp-Konto, nicht pro Agent. Binden Sie gemeinsam genutzte Gruppen an einen Agenten oder verwenden Sie [Broadcast-Gruppen](/de/channels/broadcast-groups).

## Routing-Regeln

Bindungen sind deterministisch, und die spezifischste Bindung gewinnt. Die vollständige Rangfolge (exakter Peer, übergeordneter Peer, Peer-Platzhalter, Guild+Rollen, Guild, Team, Konto, Kanal, Standardagent) finden Sie unter [Kanal-Routing](/de/channels/channel-routing#routing-rules-how-an-agent-is-chosen). Einige hier besonders erwähnenswerte Regeln:

- Wenn innerhalb derselben Rangstufe mehrere Bindungen übereinstimmen, gewinnt die erste in der Konfigurationsreihenfolge.
- Wenn eine Bindung mehrere Abgleichsfelder festlegt (beispielsweise `peer` + `guildId`), müssen alle angegebenen Felder übereinstimmen (`AND`-Semantik).
- Eine Bindung ohne `accountId` stimmt ausschließlich mit dem Standardkonto überein, nicht mit jedem Konto. Verwenden Sie `accountId: "*"` als kanalweiten Fallback oder `accountId: "<name>"` für ein bestimmtes Konto. Wenn dieselbe Bindung erneut mit einer expliziten Konto-ID hinzugefügt wird, wird die vorhandene reine Kanalbindung aktualisiert, statt sie zu duplizieren.

## Mehrere Konten/Telefonnummern

Kanäle, die mehrere Konten unterstützen (z. B. WhatsApp), verwenden `accountId`, um jede Anmeldung zu identifizieren. Jede `accountId` wird an einen eigenen Agenten weitergeleitet, sodass ein Server mehrere Telefonnummern hosten kann, ohne Sitzungen zu vermischen.

Legen Sie mit `channels.<channel>.defaultAccount` das Konto fest, das verwendet wird, wenn `accountId` fehlt. Wenn dieser Wert nicht gesetzt ist, greift OpenClaw auf `default` zurück, sofern vorhanden, andernfalls auf die erste konfigurierte Konto-ID (sortiert).

Kanäle mit Unterstützung für mehrere Konten: `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `mattermost`, `matrix`, `nextcloud-talk`, `nostr`, `signal`, `slack`, `telegram`, `whatsapp`, `zalo`, `zalouser`.

## Konzepte

- `agentId`: ein „Gehirn“ (Workspace, agentenspezifische Authentifizierung, agentenspezifischer Sitzungsspeicher).
- `accountId`: eine Instanz eines Kanalkontos (z. B. WhatsApp-Konto `personal` gegenüber `biz`).
- `binding`: leitet eingehende Nachrichten anhand von `(channel, accountId, peer)` und optional Gilden-/Team-IDs an eine `agentId` weiter.
- Direktchats werden zu `agent:<agentId>:<mainKey>` zusammengeführt (agentenspezifischer „Hauptkanal“; siehe `session.mainKey`).

## Plattformbeispiele

<AccordionGroup>
  <Accordion title="Discord-Bots pro Agent">
    Jedes Discord-Bot-Konto wird einer eindeutigen `accountId` zugeordnet. Binden Sie jedes Konto an einen Agenten und verwalten Sie die Zulassungslisten pro Bot.

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

    - Laden Sie jeden Bot in die Gilde ein und aktivieren Sie Message Content Intent.
    - Tokens befinden sich unter `channels.discord.accounts.<id>.token` (das Standardkonto kann `DISCORD_BOT_TOKEN` verwenden).

  </Accordion>
  <Accordion title="Telegram-Bots pro Agent">
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

    - Erstellen Sie mit BotFather einen Bot pro Agent und kopieren Sie jedes Token.
    - Tokens befinden sich unter `channels.telegram.accounts.<id>.botToken` (das Standardkonto kann `TELEGRAM_BOT_TOKEN` verwenden).
    - Laden Sie bei mehreren Bots in derselben Telegram-Gruppe jeden Bot ein und erwähnen Sie denjenigen, der antworten soll.
    - Deaktivieren Sie den BotFather Privacy Mode für jeden Gruppen-Bot (`/setprivacy` -> Disable). Entfernen Sie den Bot anschließend und fügen Sie ihn erneut hinzu, damit Telegram die Einstellung übernimmt.
    - Lassen Sie Gruppen mit `channels.telegram.groups` zu, oder verwenden Sie `groupPolicy: "open"` nur für vertrauenswürdige Gruppenbereitstellungen.
    - Tragen Sie Benutzer-IDs von Absendern in `groupAllowFrom` ein. Gruppen- und Supergruppen-IDs gehören in `channels.telegram.groups`, nicht in `groupAllowFrom`.
    - Binden Sie anhand der `accountId`, damit jeder Bot an seinen eigenen Agenten weiterleitet.

  </Accordion>
  <Accordion title="WhatsApp-Nummern pro Agent">
    Verknüpfen Sie jedes Konto, bevor Sie den Gateway starten:

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

      // Deterministisches Routing: Der erste Treffer gewinnt (spezifischster zuerst).
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

        // Optionale Überschreibung pro Peer (Beispiel: eine bestimmte Gruppe an den Arbeitsagenten senden).
        {
          agentId: "work",
          match: {
            channel: "whatsapp",
            accountId: "personal",
            peer: { kind: "group", id: "1203630...@g.us" },
          },
        },
      ],

      // Standardmäßig deaktiviert: Agent-zu-Agent-Nachrichten müssen ausdrücklich aktiviert und zugelassen werden.
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
              // Optionale Überschreibung. Standard: ~/.openclaw/credentials/whatsapp/personal
              // authDir: "~/.openclaw/credentials/whatsapp/personal",
            },
            biz: {
              // Optionale Überschreibung. Standard: ~/.openclaw/credentials/whatsapp/biz
              // authDir: "~/.openclaw/credentials/whatsapp/biz",
            },
          },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## Gängige Muster

<Tabs>
  <Tab title="WhatsApp im Alltag + konzentrierte Arbeit mit Telegram">
    Teilen Sie nach Kanal auf: Leiten Sie WhatsApp an einen schnellen Alltagsagenten und Telegram an einen Opus-Agenten weiter.

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

    Diese Beispiele verwenden `accountId: "*"`, damit die Bindungen weiterhin funktionieren, wenn Sie später Konten hinzufügen. Um einen einzelnen Direktchat oder eine einzelne Gruppe an Opus weiterzuleiten und den Rest beim Chat-Agenten zu belassen, fügen Sie für diesen Peer eine `match.peer`-Bindung hinzu — Peer-Treffer haben immer Vorrang vor kanalweiten Regeln.

  </Tab>
  <Tab title="Derselbe Kanal, ein Peer an Opus">
    Belassen Sie WhatsApp beim schnellen Agenten, leiten Sie jedoch einen Direktchat an Opus weiter:

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

    Peer-Bindungen haben immer Vorrang. Platzieren Sie sie daher oberhalb der kanalweiten Regel.

  </Tab>
  <Tab title="An eine WhatsApp-Gruppe gebundener Familienagent">
    Binden Sie einen dedizierten Familienagenten an eine einzelne WhatsApp-Gruppe, mit Erwähnungspflicht und einer restriktiveren Tool-Richtlinie:

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

    Tool-Zulassungs-/Sperrlisten beziehen sich auf **Tools**, nicht auf Skills. Wenn eine Skill eine Binärdatei ausführen muss, stellen Sie sicher, dass `exec` zugelassen ist und die Binärdatei in der Sandbox vorhanden ist. Für eine strengere Zugriffskontrolle legen Sie `agents.list[].groupChat.mentionPatterns` fest und lassen Sie die Gruppenzulassungslisten für den Kanal aktiviert.

  </Tab>
</Tabs>

## Agentenspezifische Sandbox- und Tool-Konfiguration

Jeder Agent kann über eigene Sandbox- und Tool-Beschränkungen verfügen:

```js
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: {
          mode: "off",  // Keine Sandbox für den persönlichen Agenten
        },
        // Keine Tool-Beschränkungen – alle Tools sind verfügbar
      },
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",     // Immer in einer Sandbox
          scope: "agent",  // Ein Container pro Agent
          docker: {
            // Optionale einmalige Einrichtung nach der Container-Erstellung
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],                    // Nur das Lese-Tool
          deny: ["exec", "write", "edit", "apply_patch"],    // Andere sperren
        },
      },
    ],
  },
}
```

<Note>
`setupCommand` befindet sich unter `sandbox.docker` und wird bei der Container-Erstellung einmal ausgeführt. Agentenspezifische Überschreibungen unter `sandbox.docker.*` werden ignoriert, wenn der aufgelöste Geltungsbereich `"shared"` ist.
</Note>

Dies bietet Ihnen:

- **Sicherheitsisolierung**: Beschränken Sie Tools für nicht vertrauenswürdige Agenten.
- **Ressourcenkontrolle**: Führen Sie bestimmte Agenten in einer Sandbox aus, während andere auf dem Host verbleiben.
- **Flexible Richtlinien**: unterschiedliche Berechtigungen pro Agent.

<Note>
`tools.elevated` besitzt sowohl eine globale Zugriffsschranke (`tools.elevated.enabled`/`allowFrom`) als auch eine agentenspezifische Zugriffsschranke (`agents.list[].tools.elevated.enabled`/`allowFrom`). Die agentenspezifische Zugriffsschranke kann die globale nur weiter einschränken — beide müssen einen Absender zulassen, damit privilegierte Befehle ausgeführt werden. Verwenden Sie für die Gruppenzuordnung `agents.list[].groupChat.mentionPatterns`, damit @Erwähnungen eindeutig dem vorgesehenen Agenten zugeordnet werden.
</Note>

Ausführliche Beispiele finden Sie unter [Sandbox und Tools für mehrere Agenten](/de/tools/multi-agent-sandbox-tools).

## Verwandte Themen

- [ACP-Agenten](/de/tools/acp-agents) — externe Coding-Harnesses ausführen
- [Kanal-Routing](/de/channels/channel-routing) — wie Nachrichten an Agenten weitergeleitet werden
- [Präsenz](/de/concepts/presence) — Präsenz und Verfügbarkeit von Agenten
- [Sitzung](/de/concepts/session) — Sitzungsisolierung und Routing
- [Unteragenten](/de/tools/subagents) — Agentenläufe im Hintergrund starten
