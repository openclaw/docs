---
read_when: You want multiple isolated agents (workspaces + auth) in one gateway process.
sidebarTitle: Multi-agent routing
status: active
summary: 'Multi-Agent-Routing: isolierte Agenten, Kanalkonten und Bindungen'
title: Multi-Agent-Routing
x-i18n:
    generated_at: "2026-04-30T06:49:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 67adea74d5f97feff3f816cc4c34c9429e7659289013e5a7c7623bd185a50a31
    source_path: concepts/multi-agent.md
    workflow: 16
---

Führen Sie mehrere _isolierte_ Agenten aus – jeweils mit eigenem Workspace, Zustandsverzeichnis (`agentDir`) und Sitzungsverlauf – sowie mehrere Channel-Konten (z. B. zwei WhatsApp-Konten) in einem laufenden Gateway. Eingehende Nachrichten werden über Bindings an den richtigen Agenten weitergeleitet.

Ein **Agent** ist hier der vollständige Pro-Persona-Bereich: Workspace-Dateien, Authentifizierungsprofile, Modell-Registry und Sitzungsspeicher. `agentDir` ist das Zustandsverzeichnis auf der Festplatte, das diese agentenspezifische Konfiguration unter `~/.openclaw/agents/<agentId>/` enthält. Ein **Binding** ordnet ein Channel-Konto (z. B. einen Slack-Workspace oder eine WhatsApp-Nummer) einem dieser Agenten zu.

## Was ist „ein Agent“?

Ein **Agent** ist ein vollständig abgegrenztes Gehirn mit eigenem:

- **Workspace** (Dateien, AGENTS.md/SOUL.md/USER.md, lokale Notizen, Persona-Regeln).
- **Zustandsverzeichnis** (`agentDir`) für Authentifizierungsprofile, Modell-Registry und agentenspezifische Konfiguration.
- **Sitzungsspeicher** (Chatverlauf + Routing-Zustand) unter `~/.openclaw/agents/<agentId>/sessions`.

Authentifizierungsprofile sind **agentenspezifisch**. Jeder Agent liest aus seinem eigenen:

```text
~/.openclaw/agents/<agentId>/agent/auth-profiles.json
```

<Note>
`sessions_history` ist auch hier der sicherere Pfad für sitzungsübergreifenden Abruf: Es gibt eine begrenzte, bereinigte Ansicht zurück, keinen Rohdump des Transkripts. Der Abruf von Assistant-Inhalten entfernt Thinking-Tags, `<relevant-memories>`-Gerüst, reine Text-XML-Nutzdaten von Tool-Aufrufen (einschließlich `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` und abgeschnittene Tool-Aufrufblöcke), herabgestuftes Tool-Aufrufgerüst, durchgesickerte ASCII-/Full-Width-Modellsteuerungstoken und fehlerhaftes MiniMax-Tool-Aufruf-XML vor Schwärzung/Kürzung.
</Note>

<Warning>
Verwenden Sie `agentDir` niemals für mehrere Agenten wieder (das verursacht Authentifizierungs-/Sitzungskollisionen). Agenten können auf die Authentifizierungsprofile des Standard-/Hauptagenten zugreifen, wenn sie kein lokales Profil haben, aber OpenClaw klont keine OAuth-Refresh-Tokens in den sekundären Agentenspeicher. Wenn Sie ein unabhängiges OAuth-Konto möchten, melden Sie sich von diesem Agenten aus an; wenn Sie Anmeldeinformationen manuell kopieren, kopieren Sie nur portable statische Profile vom Typ `api_key` oder `token`.
</Warning>

Skills werden aus jedem Agent-Workspace sowie aus gemeinsamen Roots wie `~/.openclaw/skills` geladen und anschließend, falls konfiguriert, nach der effektiven Skill-Allowlist des Agenten gefiltert. Verwenden Sie `agents.defaults.skills` für eine gemeinsame Basis und `agents.list[].skills` für agentenspezifischen Ersatz. Siehe [Skills: agentenspezifisch vs. gemeinsam](/de/tools/skills#per-agent-vs-shared-skills) und [Skills: Agent-Skill-Allowlists](/de/tools/skills#agent-skill-allowlists).

Das Gateway kann **einen Agenten** (Standard) oder **viele Agenten** parallel hosten.

<Note>
**Workspace-Hinweis:** Der Workspace jedes Agenten ist das **Standard-cwd**, keine harte Sandbox. Relative Pfade werden innerhalb des Workspace aufgelöst, aber absolute Pfade können andere Host-Speicherorte erreichen, sofern Sandboxing nicht aktiviert ist. Siehe [Sandboxing](/de/gateway/sandboxing).
</Note>

## Pfade (Kurzüberblick)

- Konfiguration: `~/.openclaw/openclaw.json` (oder `OPENCLAW_CONFIG_PATH`)
- Zustandsverzeichnis: `~/.openclaw` (oder `OPENCLAW_STATE_DIR`)
- Workspace: `~/.openclaw/workspace` (oder `~/.openclaw/workspace-<agentId>`)
- Agentenverzeichnis: `~/.openclaw/agents/<agentId>/agent` (oder `agents.list[].agentDir`)
- Sitzungen: `~/.openclaw/agents/<agentId>/sessions`

### Einzelagentenmodus (Standard)

Wenn Sie nichts tun, führt OpenClaw einen einzelnen Agenten aus:

- `agentId` ist standardmäßig **`main`**.
- Sitzungen werden als `agent:main:<mainKey>` geschlüsselt.
- Der Workspace ist standardmäßig `~/.openclaw/workspace` (oder `~/.openclaw/workspace-<profile>`, wenn `OPENCLAW_PROFILE` gesetzt ist).
- Der Zustand ist standardmäßig `~/.openclaw/agents/main/agent`.

## Agentenhelfer

Verwenden Sie den Agentenassistenten, um einen neuen isolierten Agenten hinzuzufügen:

```bash
openclaw agents add work
```

Fügen Sie anschließend `bindings` hinzu (oder lassen Sie den Assistenten dies erledigen), um eingehende Nachrichten weiterzuleiten.

Überprüfen Sie mit:

```bash
openclaw agents list --bindings
```

## Schnellstart

<Steps>
  <Step title="Jeden Agent-Workspace erstellen">
    Verwenden Sie den Assistenten oder erstellen Sie Workspaces manuell:

    ```bash
    openclaw agents add coding
    openclaw agents add social
    ```

    Jeder Agent erhält seinen eigenen Workspace mit `SOUL.md`, `AGENTS.md` und optional `USER.md` sowie ein dediziertes `agentDir` und einen Sitzungsspeicher unter `~/.openclaw/agents/<agentId>`.

  </Step>
  <Step title="Channel-Konten erstellen">
    Erstellen Sie pro Agent ein Konto in Ihren bevorzugten Channels:

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
  <Step title="Neu starten und überprüfen">
    ```bash
    openclaw gateway restart
    openclaw agents list --bindings
    openclaw channels status --probe
    ```
  </Step>
</Steps>

## Mehrere Agenten = mehrere Personen, mehrere Persönlichkeiten

Mit **mehreren Agenten** wird jede `agentId` zu einer **vollständig isolierten Persona**:

- **Unterschiedliche Telefonnummern/Konten** (pro Channel `accountId`).
- **Unterschiedliche Persönlichkeiten** (agentenspezifische Workspace-Dateien wie `AGENTS.md` und `SOUL.md`).
- **Getrennte Authentifizierung + Sitzungen** (keine gegenseitige Beeinflussung, sofern nicht ausdrücklich aktiviert).

So können **mehrere Personen** einen Gateway-Server gemeinsam nutzen, während ihre KI-„Gehirne“ und Daten isoliert bleiben.

## Agentenübergreifende QMD-Speichersuche

Wenn ein Agent die QMD-Sitzungstranskripte eines anderen Agenten durchsuchen soll, fügen Sie zusätzliche Sammlungen unter `agents.list[].memorySearch.qmd.extraCollections` hinzu. Verwenden Sie `agents.defaults.memorySearch.qmd.extraCollections` nur, wenn jeder Agent dieselben gemeinsamen Transkriptsammlungen erben soll.

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

Der zusätzliche Sammlungspfad kann zwischen Agenten geteilt werden, aber der Sammlungsname bleibt explizit, wenn der Pfad außerhalb des Agent-Workspace liegt. Pfade innerhalb des Workspace bleiben agentengebunden, sodass jeder Agent seinen eigenen Transkriptsuchbestand behält.

## Eine WhatsApp-Nummer, mehrere Personen (DM-Aufteilung)

Sie können **verschiedene WhatsApp-DMs** an verschiedene Agenten weiterleiten und dabei bei **einem WhatsApp-Konto** bleiben. Vergleichen Sie anhand der E.164 des Absenders (wie `+15551234567`) mit `peer.kind: "direct"`. Antworten kommen weiterhin von derselben WhatsApp-Nummer (keine agentenspezifische Absenderidentität).

<Note>
Direktchats werden auf den **Hauptsitzungsschlüssel** des Agenten reduziert, daher erfordert echte Isolation **einen Agenten pro Person**.
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

- Die DM-Zugriffssteuerung ist **global pro WhatsApp-Konto** (Kopplung/Allowlist), nicht pro Agent.
- Für gemeinsame Gruppen binden Sie die Gruppe an einen Agenten oder verwenden Sie [Broadcast-Gruppen](/de/channels/broadcast-groups).

## Routing-Regeln (wie Nachrichten einen Agenten auswählen)

Bindings sind **deterministisch** und **die spezifischste Übereinstimmung gewinnt**:

<Steps>
  <Step title="peer-Übereinstimmung">
    Exakte DM-/Gruppen-/Channel-ID.
  </Step>
  <Step title="parentPeer-Übereinstimmung">
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
  <Step title="accountId-Übereinstimmung für einen Channel">
    Fallback pro Konto.
  </Step>
  <Step title="Channel-Level-Übereinstimmung">
    `accountId: "*"`.
  </Step>
  <Step title="Standardagent">
    Fallback auf `agents.list[].default`, sonst erster Listeneintrag, Standard: `main`.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Konfliktauflösung und AND-Semantik">
    - Wenn mehrere Bindings in derselben Stufe übereinstimmen, gewinnt das erste in der Konfigurationsreihenfolge.
    - Wenn ein Binding mehrere Übereinstimmungsfelder setzt (zum Beispiel `peer` + `guildId`), sind alle angegebenen Felder erforderlich (`AND`-Semantik).

  </Accordion>
  <Accordion title="Details zum Kontobereich">
    - Ein Binding ohne `accountId` passt nur auf das Standardkonto.
    - Verwenden Sie `accountId: "*"`, um einen channelweiten Fallback über alle Konten hinweg festzulegen.
    - Wenn Sie später dasselbe Binding für denselben Agenten mit einer expliziten Konto-ID hinzufügen, stuft OpenClaw das vorhandene channelweite Binding auf kontobezogen hoch, statt es zu duplizieren.

  </Accordion>
</AccordionGroup>

## Mehrere Konten / Telefonnummern

Channels, die **mehrere Konten** unterstützen (z. B. WhatsApp), verwenden `accountId`, um jede Anmeldung zu identifizieren. Jede `accountId` kann an einen anderen Agenten weitergeleitet werden, sodass ein Server mehrere Telefonnummern hosten kann, ohne Sitzungen zu vermischen.

Wenn Sie ein channelweites Standardkonto möchten, wenn `accountId` ausgelassen wird, setzen Sie `channels.<channel>.defaultAccount` (optional). Wenn nicht gesetzt, fällt OpenClaw auf `default` zurück, falls vorhanden, andernfalls auf die erste konfigurierte Konto-ID (sortiert).

Häufige Channels, die dieses Muster unterstützen, sind:

- `whatsapp`, `telegram`, `discord`, `slack`, `signal`, `imessage`
- `irc`, `line`, `googlechat`, `mattermost`, `matrix`, `nextcloud-talk`
- `bluebubbles`, `zalo`, `zalouser`, `nostr`, `feishu`

## Konzepte

- `agentId`: ein „Gehirn“ (Workspace, agentenspezifische Authentifizierung, agentenspezifischer Sitzungsspeicher).
- `accountId`: eine Channel-Kontoinstanz (z. B. WhatsApp-Konto `"personal"` vs. `"biz"`).
- `binding`: leitet eingehende Nachrichten anhand von `(channel, accountId, peer)` und optional Guild-/Team-IDs an eine `agentId` weiter.
- Direktchats werden auf `agent:<agentId>:<mainKey>` reduziert (agentenspezifisches „main“; `session.mainKey`).

## Plattformbeispiele

<AccordionGroup>
  <Accordion title="Discord-Bots pro Agent">
    Jedes Discord-Bot-Konto wird einer eindeutigen `accountId` zugeordnet. Binden Sie jedes Konto an einen Agenten und verwalten Sie Allowlists pro Bot.

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
    - Tokens befinden sich in `channels.discord.accounts.<id>.token` (das Standardkonto kann `DISCORD_BOT_TOKEN` verwenden).

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
    - Tokens befinden sich in `channels.telegram.accounts.<id>.botToken` (das Standardkonto kann `TELEGRAM_BOT_TOKEN` verwenden).

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

## Häufige Muster

<Tabs>
  <Tab title="WhatsApp täglich + Telegram Deep Work">
    Nach Kanal aufteilen: Leiten Sie WhatsApp an einen schnellen Alltags-Agent und Telegram an einen Opus-Agent weiter.

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

    - Wenn Sie mehrere Konten für einen Kanal haben, fügen Sie der Bindung `accountId` hinzu (zum Beispiel `{ channel: "whatsapp", accountId: "personal" }`).
    - Um eine einzelne DM/Gruppe an Opus weiterzuleiten, während der Rest im Chat bleibt, fügen Sie für diesen Peer eine `match.peer`-Bindung hinzu; Peer-Treffer haben immer Vorrang vor kanalweiten Regeln.

  </Tab>
  <Tab title="Gleicher Kanal, ein Peer zu Opus">
    Belassen Sie WhatsApp auf dem schnellen Agent, leiten Sie aber eine DM an Opus weiter:

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

    Peer-Bindungen haben immer Vorrang, platzieren Sie sie daher oberhalb der kanalweiten Regel.

  </Tab>
  <Tab title="Familien-Agent an eine WhatsApp-Gruppe gebunden">
    Binden Sie einen dedizierten Familien-Agent an eine einzelne WhatsApp-Gruppe, mit Mention-Gating und einer strengeren Tool-Richtlinie:

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

    - Tool-Allow-/Deny-Listen sind **Tools**, keine Skills. Wenn ein Skill ein Binary ausführen muss, stellen Sie sicher, dass `exec` erlaubt ist und das Binary in der Sandbox vorhanden ist.
    - Für strengeres Gating legen Sie `agents.list[].groupChat.mentionPatterns` fest und lassen Gruppen-Allowlists für den Kanal aktiviert.

  </Tab>
</Tabs>

## Sandbox- und Tool-Konfiguration pro Agent

Jeder Agent kann eigene Sandbox- und Tool-Einschränkungen haben:

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
`setupCommand` befindet sich unter `sandbox.docker` und wird einmal bei der Container-Erstellung ausgeführt. `sandbox.docker.*`-Überschreibungen pro Agent werden ignoriert, wenn der aufgelöste Scope `"shared"` ist.
</Note>

**Vorteile:**

- **Sicherheitsisolation**: Tools für nicht vertrauenswürdige Agenten einschränken.
- **Ressourcenkontrolle**: Bestimmte Agenten in einer Sandbox ausführen, während andere auf dem Host bleiben.
- **Flexible Richtlinien**: unterschiedliche Berechtigungen pro Agent.

<Note>
`tools.elevated` ist **global** und senderbasiert; es ist nicht pro Agent konfigurierbar. Wenn Sie agentenspezifische Grenzen benötigen, verwenden Sie `agents.list[].tools`, um `exec` zu verweigern. Für Gruppen-Targeting verwenden Sie `agents.list[].groupChat.mentionPatterns`, damit @mentions eindeutig dem vorgesehenen Agent zugeordnet werden.
</Note>

Ausführliche Beispiele finden Sie unter [Multi-Agent-Sandbox und Tools](/de/tools/multi-agent-sandbox-tools).

## Verwandt

- [ACP-Agenten](/de/tools/acp-agents) — externe Coding-Harnesses ausführen
- [Kanal-Routing](/de/channels/channel-routing) — wie Nachrichten an Agenten weitergeleitet werden
- [Presence](/de/concepts/presence) — Agent-Presence und Verfügbarkeit
- [Session](/de/concepts/session) — Session-Isolation und Routing
- [Sub-Agenten](/de/tools/subagents) — Agent-Läufe im Hintergrund starten
