---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: 'Multi-Agent-Routing: isolierte Agenten, Channel-Konten und Bindings'
title: Multi-Agent-Routing
x-i18n:
    generated_at: "2026-04-26T11:27:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 845149ac1076d4746cc5038bd4444c2fc6117710f724b8cabdc31dc9ef6abbe8
    source_path: concepts/multi-agent.md
    workflow: 15
---

Mehrere _isolierte_ Agenten ausführen — jeder mit eigenem Workspace, eigenem Zustandsverzeichnis (`agentDir`) und eigener Sitzungshistorie — plus mehrere Channel-Konten (z. B. zwei WhatsApps) in einem laufenden Gateway. Eingehende Nachrichten werden über Bindings an den richtigen Agenten weitergeleitet.

Ein **Agent** ist hier der vollständige Bereich pro Persona: Workspace-Dateien, Auth-Profile, Modell-Registry und Sitzungsspeicher. `agentDir` ist das Zustandsverzeichnis auf der Festplatte, das diese Konfiguration pro Agent unter `~/.openclaw/agents/<agentId>/` enthält. Ein **Binding** ordnet ein Channel-Konto (z. B. einen Slack-Workspace oder eine WhatsApp-Nummer) einem dieser Agenten zu.

## Was ist „ein Agent“?

Ein **Agent** ist ein vollständig abgegrenztes Gehirn mit eigenem:

- **Workspace** (Dateien, AGENTS.md/SOUL.md/USER.md, lokale Notizen, Persona-Regeln).
- **Zustandsverzeichnis** (`agentDir`) für Auth-Profile, Modell-Registry und Konfiguration pro Agent.
- **Sitzungsspeicher** (Chat-Verlauf + Routing-Zustand) unter `~/.openclaw/agents/<agentId>/sessions`.

Auth-Profile sind **pro Agent**. Jeder Agent liest aus seiner eigenen:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

<Note>
`sessions_history` ist auch hier der sicherere Weg für sitzungsübergreifenden Abruf: Es liefert eine begrenzte, bereinigte Ansicht, keinen rohen Transkript-Dump. Assistenten-Abruf entfernt Thinking-Tags, `<relevant-memories>`-Gerüste, XML-Payloads von Tool-Aufrufen im Klartext (einschließlich `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` und abgeschnittener Tool-Call-Blöcke), herabgestufte Tool-Call-Gerüste, geleakte ASCII-/Full-Width-Modell-Steuerungstokens und fehlerhaftes MiniMax-Tool-Call-XML vor Redaktion/Abschneidung.
</Note>

<Warning>
Anmeldedaten des Haupt-Agenten werden **nicht** automatisch gemeinsam genutzt. Verwenden Sie niemals dasselbe `agentDir` für mehrere Agenten (das verursacht Auth-/Sitzungskollisionen). Wenn Sie Anmeldedaten teilen möchten, kopieren Sie `auth-profiles.json` in das `agentDir` des anderen Agenten.
</Warning>

Skills werden aus dem Workspace jedes Agenten sowie aus gemeinsamen Roots wie `~/.openclaw/skills` geladen und dann anhand der effektiven Agent-Skill-Allowlist gefiltert, sofern konfiguriert. Verwenden Sie `agents.defaults.skills` für eine gemeinsame Basis und `agents.list[].skills` für agentenspezifisches Ersetzen. Siehe [Skills: per-agent vs shared](/de/tools/skills#per-agent-vs-shared-skills) und [Skills: agent skill allowlists](/de/tools/skills#agent-skill-allowlists).

Das Gateway kann **einen Agenten** (Standard) oder **viele Agenten** nebeneinander hosten.

<Note>
**Workspace-Hinweis:** Der Workspace jedes Agenten ist das **Standard-cwd**, keine harte Sandbox. Relative Pfade werden innerhalb des Workspace aufgelöst, aber absolute Pfade können andere Host-Orte erreichen, sofern Sandboxing nicht aktiviert ist. Siehe [Sandboxing](/de/gateway/sandboxing).
</Note>

## Pfade (Kurzübersicht)

- Konfiguration: `~/.openclaw/openclaw.json` (oder `OPENCLAW_CONFIG_PATH`)
- Statusverzeichnis: `~/.openclaw` (oder `OPENCLAW_STATE_DIR`)
- Workspace: `~/.openclaw/workspace` (oder `~/.openclaw/workspace-<agentId>`)
- Agent-Verzeichnis: `~/.openclaw/agents/<agentId>/agent` (oder `agents.list[].agentDir`)
- Sitzungen: `~/.openclaw/agents/<agentId>/sessions`

### Single-Agent-Modus (Standard)

Wenn Sie nichts tun, führt OpenClaw einen einzelnen Agenten aus:

- `agentId` ist standardmäßig **`main`**.
- Sitzungen werden als `agent:main:<mainKey>` verschlüsselt.
- Der Workspace ist standardmäßig `~/.openclaw/workspace` (oder `~/.openclaw/workspace-<profile>`, wenn `OPENCLAW_PROFILE` gesetzt ist).
- Der Status ist standardmäßig `~/.openclaw/agents/main/agent`.

## Agent-Helfer

Verwenden Sie den Agent-Assistenten, um einen neuen isolierten Agenten hinzuzufügen:

```bash
openclaw agents add work
```

Fügen Sie dann `bindings` hinzu (oder lassen Sie das den Assistenten tun), um eingehende Nachrichten weiterzuleiten.

Prüfen Sie mit:

```bash
openclaw agents list --bindings
```

## Schnellstart

<Steps>
  <Step title="Workspace für jeden Agenten erstellen">
    Verwenden Sie den Assistenten oder erstellen Sie Workspaces manuell:

    ```bash
    openclaw agents add coding
    openclaw agents add social
    ```

    Jeder Agent erhält seinen eigenen Workspace mit `SOUL.md`, `AGENTS.md` und optional `USER.md` sowie ein dediziertes `agentDir` und einen Sitzungsspeicher unter `~/.openclaw/agents/<agentId>`.

  </Step>
  <Step title="Channel-Konten erstellen">
    Erstellen Sie auf Ihren bevorzugten Channels ein Konto pro Agent:

    - Discord: ein Bot pro Agent, Message Content Intent aktivieren, jedes Token kopieren.
    - Telegram: ein Bot pro Agent über BotFather, jedes Token kopieren.
    - WhatsApp: jede Telefonnummer pro Konto verknüpfen.

    ```bash
    openclaw channels login --channel whatsapp --account work
    ```

    Siehe Channel-Anleitungen: [Discord](/de/channels/discord), [Telegram](/de/channels/telegram), [WhatsApp](/de/channels/whatsapp).

  </Step>
  <Step title="Agenten, Konten und Bindings hinzufügen">
    Fügen Sie Agenten unter `agents.list`, Channel-Konten unter `channels.<channel>.accounts` hinzu und verbinden Sie sie mit `bindings` (Beispiele unten).
  </Step>
  <Step title="Neu starten und prüfen">
    ```bash
    openclaw gateway restart
    openclaw agents list --bindings
    openclaw channels status --probe
    ```
  </Step>
</Steps>

## Mehrere Agenten = mehrere Personen, mehrere Persönlichkeiten

Mit **mehreren Agenten** wird jede `agentId` zu einer **vollständig isolierten Persona**:

- **Unterschiedliche Telefonnummern/Konten** (pro Channel-`accountId`).
- **Unterschiedliche Persönlichkeiten** (über agentenspezifische Workspace-Dateien wie `AGENTS.md` und `SOUL.md`).
- **Getrennte Authentifizierung + Sitzungen** (kein Cross-Talk, sofern nicht ausdrücklich aktiviert).

Dadurch können **mehrere Personen** einen Gateway-Server gemeinsam nutzen, während ihre KI-„Gehirne“ und Daten isoliert bleiben.

## QMD-Speichersuche über Agenten hinweg

Wenn ein Agent die QMD-Sitzungstranskripte eines anderen Agenten durchsuchen soll, fügen Sie zusätzliche Collections unter `agents.list[].memorySearch.qmd.extraCollections` hinzu. Verwenden Sie `agents.defaults.memorySearch.qmd.extraCollections` nur dann, wenn jeder Agent dieselben gemeinsamen Transkript-Collections erben soll.

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
            extraCollections: [{ path: "notes" }], // wird im Workspace aufgelöst -> Collection namens "notes-main"
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

Der zusätzliche Collection-Pfad kann zwischen Agenten geteilt werden, aber der Collection-Name bleibt explizit, wenn sich der Pfad außerhalb des Agent-Workspace befindet. Pfade innerhalb des Workspace bleiben agentenspezifisch, sodass jeder Agent seinen eigenen Satz für die Transkriptsuche behält.

## Eine WhatsApp-Nummer, mehrere Personen (DM-Aufteilung)

Sie können **verschiedene WhatsApp-DMs** an verschiedene Agenten weiterleiten und dabei **ein WhatsApp-Konto** verwenden. Abgleich nach E.164 des Absenders (wie `+15551234567`) mit `peer.kind: "direct"`. Antworten kommen weiterhin von derselben WhatsApp-Nummer (keine senderbezogene Identität pro Agent).

<Note>
Direktchats kollabieren zum **Haupt-Sitzungsschlüssel** des Agenten, daher erfordert echte Isolation **einen Agenten pro Person**.
</Note>

Beispiel:

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

Hinweise:

- DM-Zugriffskontrolle ist **global pro WhatsApp-Konto** (Pairing/Allowlist), nicht pro Agent.
- Für gemeinsame Gruppen binden Sie die Gruppe an einen Agenten oder verwenden Sie [Broadcast groups](/de/channels/broadcast-groups).

## Routing-Regeln (wie Nachrichten einen Agenten auswählen)

Bindings sind **deterministisch** und **der spezifischste Treffer gewinnt**:

<Steps>
  <Step title="peer-Abgleich">
    Exakte DM-/Gruppen-/Channel-ID.
  </Step>
  <Step title="parentPeer-Abgleich">
    Thread-Vererbung.
  </Step>
  <Step title="guildId + Rollen">
    Discord-Rollenrouting.
  </Step>
  <Step title="guildId">
    Discord.
  </Step>
  <Step title="teamId">
    Slack.
  </Step>
  <Step title="accountId-Abgleich für einen Channel">
    Kontoabhängiger Fallback.
  </Step>
  <Step title="Abgleich auf Channel-Ebene">
    `accountId: "*"`.
  </Step>
  <Step title="Standard-Agent">
    Fallback auf `agents.list[].default`, sonst erster Listeneintrag, Standard: `main`.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Tie-Breaking und AND-Semantik">
    - Wenn mehrere Bindings auf derselben Ebene übereinstimmen, gewinnt das erste in Konfigurationsreihenfolge.
    - Wenn ein Binding mehrere Abgleichsfelder setzt (zum Beispiel `peer` + `guildId`), sind alle angegebenen Felder erforderlich (AND-Semantik).
  </Accordion>
  <Accordion title="Details zum Konto-Scope">
    - Ein Binding ohne `accountId` stimmt nur mit dem Standardkonto überein.
    - Verwenden Sie `accountId: "*"` für einen channelweiten Fallback über alle Konten hinweg.
    - Wenn Sie später dasselbe Binding für denselben Agenten mit einer expliziten Konto-ID hinzufügen, stuft OpenClaw das vorhandene nur-channelweite Binding auf kontoabhängig hoch, statt es zu duplizieren.
  </Accordion>
</AccordionGroup>

## Mehrere Konten / Telefonnummern

Channels, die **mehrere Konten** unterstützen (z. B. WhatsApp), verwenden `accountId`, um jeden Login zu identifizieren. Jede `accountId` kann an einen anderen Agenten weitergeleitet werden, sodass ein Server mehrere Telefonnummern hosten kann, ohne Sitzungen zu vermischen.

Wenn Sie ein channelweites Standardkonto möchten, wenn `accountId` weggelassen wird, setzen Sie optional `channels.<channel>.defaultAccount`. Wenn es nicht gesetzt ist, fällt OpenClaw auf `default` zurück, falls vorhanden, andernfalls auf die erste konfigurierte Konto-ID (sortiert).

Zu den gängigen Channels, die dieses Muster unterstützen, gehören:

- `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`
- `irc`, `line`, `googlechat`, `mattermost`, `matrix`, `nextcloud-talk`
- `bluebubbles`, `zalo`, `zalouser`, `nostr`, `feishu`

## Konzepte

- `agentId`: ein „Gehirn“ (Workspace, agentenspezifische Authentifizierung, agentenspezifischer Sitzungsspeicher).
- `accountId`: eine Channel-Konto-Instanz (z. B. WhatsApp-Konto `"personal"` gegenüber `"biz"`).
- `binding`: leitet eingehende Nachrichten anhand von `(channel, accountId, peer)` und optional Guild-/Team-IDs an eine `agentId` weiter.
- Direktchats kollabieren zu `agent:<agentId>:<mainKey>` (agentenspezifisches „main“; `session.mainKey`).

## Plattformbeispiele

<AccordionGroup>
  <Accordion title="Discord-Bots pro Agent">
    Jedes Discord-Bot-Konto wird auf eine eindeutige `accountId` abgebildet. Binden Sie jedes Konto an einen Agenten und halten Sie Allowlists pro Bot getrennt.

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

    - Laden Sie jeden Bot in die Guild ein und aktivieren Sie Message Content Intent.
    - Tokens liegen in `channels.discord.accounts.<id>.token` (das Standardkonto kann `DISCORD_BOT_TOKEN` verwenden).

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
    - Tokens liegen in `channels.telegram.accounts.<id>.botToken` (das Standardkonto kann `TELEGRAM_BOT_TOKEN` verwenden).

  </Accordion>
  <Accordion title="WhatsApp-Nummern pro Agent">
    Verknüpfen Sie jedes Konto, bevor Sie das Gateway starten:

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

      // Deterministisches Routing: erster Treffer gewinnt (spezifischste zuerst).
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },

        // Optionale peer-spezifische Überschreibung (Beispiel: eine bestimmte Gruppe an den Work-Agenten senden).
        {
          agentId: "work",
          match: {
            channel: "whatsapp",
            accountId: "personal",
            peer: { kind: "group", id: "1203630...@g.us" },
          },
        },
      ],

      // Standardmäßig aus: Agent-zu-Agent-Nachrichten müssen ausdrücklich aktiviert + per Allowlist erlaubt werden.
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

## Häufige Muster

<Tabs>
  <Tab title="WhatsApp täglich + Telegram für Deep Work">
    Nach Channel aufteilen: WhatsApp an einen schnellen Agenten für den Alltag leiten und Telegram an einen Opus-Agenten.

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

    Hinweise:

    - Wenn Sie mehrere Konten für einen Channel haben, fügen Sie dem Binding `accountId` hinzu (zum Beispiel `{ channel: "whatsapp", accountId: "personal" }`).
    - Um eine einzelne DM/Gruppe an Opus zu leiten und den Rest auf chat zu belassen, fügen Sie für diesen Peer ein `match.peer`-Binding hinzu; Peer-Abgleiche haben immer Vorrang vor channelweiten Regeln.

  </Tab>
  <Tab title="Gleicher Channel, ein Peer zu Opus">
    WhatsApp auf dem schnellen Agenten belassen, aber eine DM an Opus leiten:

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

    Peer-Bindings haben immer Vorrang, daher sollten sie über der channelweiten Regel stehen.

  </Tab>
  <Tab title="An eine WhatsApp-Gruppe gebundener Familien-Agent">
    Einen dedizierten Familien-Agenten an eine einzelne WhatsApp-Gruppe binden, mit Erwähnungs-Gating und einer strengeren Tool-Richtlinie:

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

    Hinweise:

    - Tool-Allow-/Deny-Listen sind **Tools**, nicht Skills. Wenn ein Skill eine Binärdatei ausführen muss, stellen Sie sicher, dass `exec` erlaubt ist und die Binärdatei in der Sandbox vorhanden ist.
    - Für strengeres Gating setzen Sie `agents.list[].groupChat.mentionPatterns` und lassen Sie Gruppen-Allowlists für den Channel aktiviert.

  </Tab>
</Tabs>

## Sandbox- und Tool-Konfiguration pro Agent

Jeder Agent kann seine eigene Sandbox und eigene Tool-Beschränkungen haben:

```js
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: {
          mode: "off",  // Keine Sandbox für persönlichen Agenten
        },
        // Keine Tool-Beschränkungen - alle Tools verfügbar
      },
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: {
          mode: "all",     // Immer in Sandbox
          scope: "agent",  // Ein Container pro Agent
          docker: {
            // Optionale einmalige Einrichtung nach der Container-Erstellung
            setupCommand: "apt-get update && apt-get install -y git curl",
          },
        },
        tools: {
          allow: ["read"],                    // Nur read-Tool
          deny: ["exec", "write", "edit", "apply_patch"],    // Andere verweigern
        },
      },
    ],
  },
}
```

<Note>
`setupCommand` liegt unter `sandbox.docker` und wird einmal bei der Container-Erstellung ausgeführt. Überschreibungen von `sandbox.docker.*` pro Agent werden ignoriert, wenn der aufgelöste Scope `"shared"` ist.
</Note>

**Vorteile:**

- **Sicherheitsisolation**: Tools für nicht vertrauenswürdige Agenten einschränken.
- **Ressourcenkontrolle**: bestimmte Agenten in einer Sandbox ausführen und andere auf dem Host belassen.
- **Flexible Richtlinien**: unterschiedliche Berechtigungen pro Agent.

<Note>
`tools.elevated` ist **global** und absenderbasiert; es ist nicht pro Agent konfigurierbar. Wenn Sie Grenzen pro Agent benötigen, verwenden Sie `agents.list[].tools`, um `exec` zu verweigern. Für Gruppenadressierung verwenden Sie `agents.list[].groupChat.mentionPatterns`, damit @Erwähnungen sauber dem vorgesehenen Agenten zugeordnet werden.
</Note>

Siehe [Multi-agent sandbox and tools](/de/tools/multi-agent-sandbox-tools) für ausführliche Beispiele.

## Verwandt

- [ACP agents](/de/tools/acp-agents) — externe Coding-Harnesses ausführen
- [Channel routing](/de/channels/channel-routing) — wie Nachrichten an Agenten weitergeleitet werden
- [Presence](/de/concepts/presence) — Agent-Präsenz und Verfügbarkeit
- [Session](/de/concepts/session) — Sitzungsisolation und Routing
- [Sub-agents](/de/tools/subagents) — Hintergrund-Agent-Läufe starten
