---
read_when:
    - Sie benötigen exakte feldweise Konfigurationssemantik oder Standardwerte.
    - Sie validieren Kanal-, Modell-, Gateway- oder Tool-Konfigurationsblöcke.
summary: Gateway-Konfigurationsreferenz für zentrale OpenClaw-Schlüssel, Standardwerte und Links zu dedizierten Subsystem-Referenzen
title: Konfigurationsreferenz
x-i18n:
    generated_at: "2026-04-18T06:12:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4b504c9c6b47d7a327a0acf6934561c9b2606c01cc8ebe5526ccde73033d759f
    source_path: gateway/configuration-reference.md
    workflow: 15
---

# Konfigurationsreferenz

Zentrale Konfigurationsreferenz für `~/.openclaw/openclaw.json`. Für einen aufgabenorientierten Überblick siehe [Konfiguration](/de/gateway/configuration).

Diese Seite behandelt die wichtigsten OpenClaw-Konfigurationsoberflächen und verlinkt weiter, wenn ein Subsystem eine eigene ausführlichere Referenz hat. Sie versucht **nicht**, jeden kanal-/plugin-eigenen Befehlskatalog oder jede tiefe Speicher-/QMD-Stellschraube auf einer einzigen Seite einzubetten.

Code-Quelle:

- `openclaw config schema` gibt das Live-JSON-Schema aus, das für Validierung und Control UI verwendet wird, wobei gebündelte/Plugin-/Kanal-Metadaten eingebunden werden, wenn verfügbar
- `config.schema.lookup` gibt einen einzelnen pfadbezogenen Schemaknoten für Drill-down-Tools zurück
- `pnpm config:docs:check` / `pnpm config:docs:gen` validieren den Baseline-Hash der Konfigurationsdokumentation gegen die aktuelle Schemaoberfläche

Dedizierte ausführliche Referenzen:

- [Speicherkonfigurationsreferenz](/de/reference/memory-config) für `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` und Dreaming-Konfiguration unter `plugins.entries.memory-core.config.dreaming`
- [Slash-Befehle](/de/tools/slash-commands) für den aktuellen integrierten + gebündelten Befehlskatalog
- zuständige Kanal-/Plugin-Seiten für kanalspezifische Befehlsoberflächen

Das Konfigurationsformat ist **JSON5** (Kommentare + nachgestellte Kommas sind erlaubt). Alle Felder sind optional — OpenClaw verwendet sichere Standardwerte, wenn sie weggelassen werden.

---

## Kanäle

Jeder Kanal startet automatisch, wenn sein Konfigurationsabschnitt vorhanden ist (außer bei `enabled: false`).

### DM- und Gruppenzugriff

Alle Kanäle unterstützen DM-Richtlinien und Gruppenrichtlinien:

| DM-Richtlinie       | Verhalten                                                     |
| ------------------- | ------------------------------------------------------------- |
| `pairing` (Standard) | Unbekannte Absender erhalten einen einmaligen Pairing-Code; der Eigentümer muss zustimmen |
| `allowlist`         | Nur Absender in `allowFrom` (oder im gekoppelten Allow-Store) |
| `open`              | Alle eingehenden DMs zulassen (erfordert `allowFrom: ["*"]`)  |
| `disabled`          | Alle eingehenden DMs ignorieren                               |

| Gruppenrichtlinie     | Verhalten                                             |
| --------------------- | ----------------------------------------------------- |
| `allowlist` (Standard) | Nur Gruppen, die mit der konfigurierten Allowlist übereinstimmen |
| `open`                | Gruppen-Allowlists umgehen (Mention-Gating gilt weiterhin) |
| `disabled`            | Alle Gruppen-/Raumnachrichten blockieren              |

<Note>
`channels.defaults.groupPolicy` legt den Standard fest, wenn `groupPolicy` eines Anbieters nicht gesetzt ist.
Pairing-Codes laufen nach 1 Stunde ab. Ausstehende DM-Pairing-Anfragen sind auf **3 pro Kanal** begrenzt.
Wenn ein Anbieterblock vollständig fehlt (`channels.<provider>` fehlt), fällt die Laufzeit-Gruppenrichtlinie mit einer Startwarnung auf `allowlist` (fail-closed) zurück.
</Note>

### Kanal-Modellüberschreibungen

Verwenden Sie `channels.modelByChannel`, um bestimmte Kanal-IDs an ein Modell zu binden. Werte akzeptieren `provider/model` oder konfigurierte Modell-Aliasse. Die Kanalzuordnung gilt, wenn eine Sitzung nicht bereits eine Modellüberschreibung hat (zum Beispiel gesetzt über `/model`).

```json5
{
  channels: {
    modelByChannel: {
      discord: {
        "123456789012345678": "anthropic/claude-opus-4-6",
      },
      slack: {
        C1234567890: "openai/gpt-4.1",
      },
      telegram: {
        "-1001234567890": "openai/gpt-4.1-mini",
        "-1001234567890:topic:99": "anthropic/claude-sonnet-4-6",
      },
    },
  },
}
```

### Kanalstandards und Heartbeat

Verwenden Sie `channels.defaults` für gemeinsames Gruppenrichtlinien- und Heartbeat-Verhalten über Anbieter hinweg:

```json5
{
  channels: {
    defaults: {
      groupPolicy: "allowlist", // open | allowlist | disabled
      contextVisibility: "all", // all | allowlist | allowlist_quote
      heartbeat: {
        showOk: false,
        showAlerts: true,
        useIndicator: true,
      },
    },
  },
}
```

- `channels.defaults.groupPolicy`: Fallback-Gruppenrichtlinie, wenn eine Gruppenrichtlinie auf Anbieterebene nicht gesetzt ist.
- `channels.defaults.contextVisibility`: Standardmodus für die Sichtbarkeit ergänzenden Kontexts für alle Kanäle. Werte: `all` (Standard, schließt allen zitierten/Thread-/Verlaufs-Kontext ein), `allowlist` (schließt nur Kontext von Absendern auf der Allowlist ein), `allowlist_quote` (wie allowlist, behält aber expliziten Zitat-/Antwortkontext bei). Überschreibung pro Kanal: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: Gesunde Kanalstatus in der Heartbeat-Ausgabe einschließen.
- `channels.defaults.heartbeat.showAlerts`: Degradierte/Fehler-Status in der Heartbeat-Ausgabe einschließen.
- `channels.defaults.heartbeat.useIndicator`: Kompakte Heartbeat-Ausgabe im Indikatorstil rendern.

### WhatsApp

WhatsApp läuft über den Web-Kanal des Gateways (Baileys Web). Es startet automatisch, wenn eine verknüpfte Sitzung vorhanden ist.

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // blaue Häkchen (false im Selbstchat-Modus)
      groups: {
        "*": { requireMention: true },
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
  web: {
    enabled: true,
    heartbeatSeconds: 60,
    reconnect: {
      initialMs: 2000,
      maxMs: 120000,
      factor: 1.4,
      jitter: 0.2,
      maxAttempts: 0,
    },
  },
}
```

<Accordion title="WhatsApp mit mehreren Konten">

```json5
{
  channels: {
    whatsapp: {
      accounts: {
        default: {},
        personal: {},
        biz: {
          // authDir: "~/.openclaw/credentials/whatsapp/biz",
        },
      },
    },
  },
}
```

- Ausgehende Befehle verwenden standardmäßig das Konto `default`, falls vorhanden; andernfalls die erste konfigurierte Konto-ID (sortiert).
- Optional überschreibt `channels.whatsapp.defaultAccount` diese Fallback-Auswahl des Standardkontos, wenn es mit einer konfigurierten Konto-ID übereinstimmt.
- Das alte Baileys-Authentifizierungsverzeichnis für ein einzelnes Konto wird von `openclaw doctor` nach `whatsapp/default` migriert.
- Überschreibungen pro Konto: `channels.whatsapp.accounts.<id>.sendReadReceipts`, `channels.whatsapp.accounts.<id>.dmPolicy`, `channels.whatsapp.accounts.<id>.allowFrom`.

</Accordion>

### Telegram

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "your-bot-token",
      dmPolicy: "pairing",
      allowFrom: ["tg:123456789"],
      groups: {
        "*": { requireMention: true },
        "-1001234567890": {
          allowFrom: ["@admin"],
          systemPrompt: "Keep answers brief.",
          topics: {
            "99": {
              requireMention: false,
              skills: ["search"],
              systemPrompt: "Stay on topic.",
            },
          },
        },
      },
      customCommands: [
        { command: "backup", description: "Git backup" },
        { command: "generate", description: "Create an image" },
      ],
      historyLimit: 50,
      replyToMode: "first", // off | first | all | batched
      linkPreview: true,
      streaming: "partial", // off | partial | block | progress (default: off; opt in explicitly to avoid preview-edit rate limits)
      actions: { reactions: true, sendMessage: true },
      reactionNotifications: "own", // off | own | all
      mediaMaxMb: 100,
      retry: {
        attempts: 3,
        minDelayMs: 400,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
      network: {
        autoSelectFamily: true,
        dnsResultOrder: "ipv4first",
      },
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```

- Bot-Token: `channels.telegram.botToken` oder `channels.telegram.tokenFile` (nur reguläre Datei; Symlinks werden abgelehnt), mit `TELEGRAM_BOT_TOKEN` als Fallback für das Standardkonto.
- Optional überschreibt `channels.telegram.defaultAccount` die Standardkontoauswahl, wenn es mit einer konfigurierten Konto-ID übereinstimmt.
- In Setups mit mehreren Konten (2+ Konto-IDs) setzen Sie einen expliziten Standard (`channels.telegram.defaultAccount` oder `channels.telegram.accounts.default`), um Fallback-Routing zu vermeiden; `openclaw doctor` warnt, wenn dies fehlt oder ungültig ist.
- `configWrites: false` blockiert von Telegram initiierte Konfigurationsschreibvorgänge (Supergroup-ID-Migrationen, `/config set|unset`).
- Top-Level-Einträge in `bindings[]` mit `type: "acp"` konfigurieren persistente ACP-Bindings für Forenthemen (verwenden Sie das kanonische `chatId:topic:topicId` in `match.peer.id`). Die Feldsemantik wird in [ACP Agents](/de/tools/acp-agents#channel-specific-settings) gemeinsam beschrieben.
- Telegram-Stream-Vorschauen verwenden `sendMessage` + `editMessageText` (funktioniert in Direkt- und Gruppenchats).
- Retry-Richtlinie: siehe [Retry-Richtlinie](/de/concepts/retry).

### Discord

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: "your-bot-token",
      mediaMaxMb: 100,
      allowBots: false,
      actions: {
        reactions: true,
        stickers: true,
        polls: true,
        permissions: true,
        messages: true,
        threads: true,
        pins: true,
        search: true,
        memberInfo: true,
        roleInfo: true,
        roles: false,
        channelInfo: true,
        voiceStatus: true,
        events: true,
        moderation: false,
      },
      replyToMode: "off", // off | first | all | batched
      dmPolicy: "pairing",
      allowFrom: ["1234567890", "123456789012345678"],
      dm: { enabled: true, groupEnabled: false, groupChannels: ["openclaw-dm"] },
      guilds: {
        "123456789012345678": {
          slug: "friends-of-openclaw",
          requireMention: false,
          ignoreOtherMentions: true,
          reactionNotifications: "own",
          users: ["987654321098765432"],
          channels: {
            general: { allow: true },
            help: {
              allow: true,
              requireMention: true,
              users: ["987654321098765432"],
              skills: ["docs"],
              systemPrompt: "Short answers only.",
            },
          },
        },
      },
      historyLimit: 20,
      textChunkLimit: 2000,
      chunkMode: "length", // length | newline
      streaming: "off", // off | partial | block | progress (progress maps to partial on Discord)
      maxLinesPerMessage: 17,
      ui: {
        components: {
          accentColor: "#5865F2",
        },
      },
      threadBindings: {
        enabled: true,
        idleHours: 24,
        maxAgeHours: 0,
        spawnSubagentSessions: false, // opt-in for sessions_spawn({ thread: true })
      },
      voice: {
        enabled: true,
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        tts: {
          provider: "openai",
          openai: { voice: "alloy" },
        },
      },
      execApprovals: {
        enabled: "auto", // true | false | "auto"
        approvers: ["987654321098765432"],
        agentFilter: ["default"],
        sessionFilter: ["discord:"],
        target: "dm", // dm | channel | both
        cleanupAfterResolve: false,
      },
      retry: {
        attempts: 3,
        minDelayMs: 500,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
  },
}
```

- Token: `channels.discord.token`, mit `DISCORD_BOT_TOKEN` als Fallback für das Standardkonto.
- Direkte ausgehende Aufrufe, die ein explizites Discord-`token` angeben, verwenden dieses Token für den Aufruf; Retry-/Richtlinieneinstellungen des Kontos stammen weiterhin aus dem ausgewählten Konto im aktiven Laufzeit-Snapshot.
- Optional überschreibt `channels.discord.defaultAccount` die Standardkontoauswahl, wenn es mit einer konfigurierten Konto-ID übereinstimmt.
- Verwenden Sie `user:<id>` (DM) oder `channel:<id>` (Guild-Kanal) für Zustellziele; reine numerische IDs werden abgelehnt.
- Guild-Slugs sind kleingeschrieben, wobei Leerzeichen durch `-` ersetzt werden; Kanalschlüssel verwenden den slugifizierten Namen (ohne `#`). Bevorzugen Sie Guild-IDs.
- Von Bots verfasste Nachrichten werden standardmäßig ignoriert. `allowBots: true` aktiviert sie; verwenden Sie `allowBots: "mentions"`, um nur Bot-Nachrichten zu akzeptieren, die den Bot erwähnen (eigene Nachrichten werden weiterhin gefiltert).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (und Kanalüberschreibungen) verwirft Nachrichten, die einen anderen Benutzer oder eine andere Rolle erwähnen, aber nicht den Bot (ausgenommen @everyone/@here).
- `maxLinesPerMessage` (Standard 17) teilt lange Nachrichten auch dann auf, wenn sie unter 2000 Zeichen liegen.
- `channels.discord.threadBindings` steuert das an Discord-Threads gebundene Routing:
  - `enabled`: Discord-Überschreibung für an Threads gebundene Sitzungsfunktionen (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` und gebundene Zustellung/Routing)
  - `idleHours`: Discord-Überschreibung für automatische Entfokussierung nach Inaktivität in Stunden (`0` deaktiviert)
  - `maxAgeHours`: Discord-Überschreibung für hartes maximales Alter in Stunden (`0` deaktiviert)
  - `spawnSubagentSessions`: Opt-in-Schalter für automatische Thread-Erstellung/-Bindung durch `sessions_spawn({ thread: true })`
- Top-Level-Einträge in `bindings[]` mit `type: "acp"` konfigurieren persistente ACP-Bindings für Kanäle und Threads (verwenden Sie Kanal-/Thread-ID in `match.peer.id`). Die Feldsemantik wird in [ACP Agents](/de/tools/acp-agents#channel-specific-settings) gemeinsam beschrieben.
- `channels.discord.ui.components.accentColor` setzt die Akzentfarbe für Discord-Komponenten-v2-Container.
- `channels.discord.voice` aktiviert Discord-Sprachkanal-Konversationen und optionale Auto-Join- + TTS-Überschreibungen.
- `channels.discord.voice.daveEncryption` und `channels.discord.voice.decryptionFailureTolerance` werden an DAVE-Optionen von `@discordjs/voice` durchgereicht (`true` bzw. `24` standardmäßig).
- OpenClaw versucht zusätzlich, die Sprachübertragung wiederherzustellen, indem nach wiederholten Entschlüsselungsfehlern eine Sprachsitzung verlassen und erneut beigetreten wird.
- `channels.discord.streaming` ist der kanonische Schlüssel für den Stream-Modus. Veraltete Werte für `streamMode` und boolesches `streaming` werden automatisch migriert.
- `channels.discord.autoPresence` ordnet die Laufzeitverfügbarkeit der Bot-Präsenz zu (healthy => online, degraded => idle, exhausted => dnd) und erlaubt optionale Überschreibungen des Statustexts.
- `channels.discord.dangerouslyAllowNameMatching` aktiviert veränderliches Namens-/Tag-Matching erneut (Break-Glass-Kompatibilitätsmodus).
- `channels.discord.execApprovals`: Discord-native Zustellung von Exec-Genehmigungen und Autorisierung von Genehmigern.
  - `enabled`: `true`, `false` oder `"auto"` (Standard). Im Auto-Modus werden Exec-Genehmigungen aktiviert, wenn Genehmiger aus `approvers` oder `commands.ownerAllowFrom` aufgelöst werden können.
  - `approvers`: Discord-Benutzer-IDs, die Exec-Anfragen genehmigen dürfen. Fällt bei Weglassen auf `commands.ownerAllowFrom` zurück.
  - `agentFilter`: optionale Allowlist für Agent-ID. Weglassen, um Genehmigungen für alle Agenten weiterzuleiten.
  - `sessionFilter`: optionale Sitzungs-Schlüssel-Muster (Teilzeichenfolge oder Regex).
  - `target`: wohin Genehmigungsaufforderungen gesendet werden. `"dm"` (Standard) sendet an die DMs der Genehmiger, `"channel"` sendet an den Ursprungskanal, `"both"` sendet an beides. Wenn das Ziel `"channel"` einschließt, sind Buttons nur für aufgelöste Genehmiger nutzbar.
  - `cleanupAfterResolve`: wenn `true`, werden Genehmigungs-DMs nach Genehmigung, Ablehnung oder Timeout gelöscht.

**Modi für Reaktionsbenachrichtigungen:** `off` (keine), `own` (Nachrichten des Bots, Standard), `all` (alle Nachrichten), `allowlist` (aus `guilds.<id>.users` für alle Nachrichten).

### Google Chat

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      audienceType: "app-url", // app-url | project-number
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890",
      dm: {
        enabled: true,
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": { allow: true, requireMention: true },
      },
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

- Service-Account-JSON: inline (`serviceAccount`) oder dateibasiert (`serviceAccountFile`).
- Service-Account-SecretRef wird ebenfalls unterstützt (`serviceAccountRef`).
- Env-Fallbacks: `GOOGLE_CHAT_SERVICE_ACCOUNT` oder `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Verwenden Sie `spaces/<spaceId>` oder `users/<userId>` für Zustellziele.
- `channels.googlechat.dangerouslyAllowNameMatching` aktiviert veränderliches Matching von E-Mail-Principals erneut (Break-Glass-Kompatibilitätsmodus).

### Slack

```json5
{
  channels: {
    slack: {
      enabled: true,
      botToken: "xoxb-...",
      appToken: "xapp-...",
      dmPolicy: "pairing",
      allowFrom: ["U123", "U456", "*"],
      dm: { enabled: true, groupEnabled: false, groupChannels: ["G123"] },
      channels: {
        C123: { allow: true, requireMention: true, allowBots: false },
        "#general": {
          allow: true,
          requireMention: true,
          allowBots: false,
          users: ["U123"],
          skills: ["docs"],
          systemPrompt: "Short answers only.",
        },
      },
      historyLimit: 50,
      allowBots: false,
      reactionNotifications: "own",
      reactionAllowlist: ["U123"],
      replyToMode: "off", // off | first | all | batched
      thread: {
        historyScope: "thread", // thread | channel
        inheritParent: false,
      },
      actions: {
        reactions: true,
        messages: true,
        pins: true,
        memberInfo: true,
        emojiList: true,
      },
      slashCommand: {
        enabled: true,
        name: "openclaw",
        sessionPrefix: "slack:slash",
        ephemeral: true,
      },
      typingReaction: "hourglass_flowing_sand",
      textChunkLimit: 4000,
      chunkMode: "length",
      streaming: {
        mode: "partial", // off | partial | block | progress
        nativeTransport: true, // use Slack native streaming API when mode=partial
      },
      mediaMaxMb: 20,
      execApprovals: {
        enabled: "auto", // true | false | "auto"
        approvers: ["U123"],
        agentFilter: ["default"],
        sessionFilter: ["slack:"],
        target: "dm", // dm | channel | both
      },
    },
  },
}
```

- **Socket-Modus** erfordert sowohl `botToken` als auch `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` als Env-Fallback für das Standardkonto).
- **HTTP-Modus** erfordert `botToken` plus `signingSecret` (im Root oder pro Konto).
- `botToken`, `appToken`, `signingSecret` und `userToken` akzeptieren Klartext-Strings oder SecretRef-Objekte.
- Slack-Konto-Snapshots stellen pro Zugangsdaten Quelle-/Statusfelder wie `botTokenSource`, `botTokenStatus`, `appTokenStatus` und im HTTP-Modus `signingSecretStatus` bereit. `configured_unavailable` bedeutet, dass das Konto über SecretRef konfiguriert ist, aber der aktuelle Befehls-/Laufzeitpfad den Secret-Wert nicht auflösen konnte.
- `configWrites: false` blockiert von Slack initiierte Konfigurationsschreibvorgänge.
- Optional überschreibt `channels.slack.defaultAccount` die Standardkontoauswahl, wenn es mit einer konfigurierten Konto-ID übereinstimmt.
- `channels.slack.streaming.mode` ist der kanonische Schlüssel für den Slack-Stream-Modus. `channels.slack.streaming.nativeTransport` steuert Slacks nativen Streaming-Transport. Veraltete Werte für `streamMode`, boolesches `streaming` und `nativeStreaming` werden automatisch migriert.
- Verwenden Sie `user:<id>` (DM) oder `channel:<id>` für Zustellziele.

**Modi für Reaktionsbenachrichtigungen:** `off`, `own` (Standard), `all`, `allowlist` (aus `reactionAllowlist`).

**Isolierung von Thread-Sitzungen:** `thread.historyScope` ist pro Thread (Standard) oder über den Kanal geteilt. `thread.inheritParent` kopiert das Transkript des übergeordneten Kanals in neue Threads.

- Slack Native Streaming plus der Slack-Assistentenstil-Thread-Status „is typing...“ erfordern ein Antwort-Thread-Ziel. Top-Level-DMs bleiben standardmäßig außerhalb von Threads und verwenden daher `typingReaction` oder normale Zustellung statt der Thread-Vorschau.
- `typingReaction` fügt der eingehenden Slack-Nachricht vorübergehend eine Reaktion hinzu, während eine Antwort läuft, und entfernt sie nach Abschluss wieder. Verwenden Sie einen Slack-Emoji-Shortcode wie `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: Slack-native Zustellung von Exec-Genehmigungen und Autorisierung von Genehmigern. Gleiches Schema wie bei Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (Slack-Benutzer-IDs), `agentFilter`, `sessionFilter` und `target` (`"dm"`, `"channel"` oder `"both"`).

| Aktionsgruppe | Standard | Hinweise                |
| ------------- | -------- | ----------------------- |
| reactions     | aktiviert | Reagieren + Reaktionen auflisten |
| messages      | aktiviert | Lesen/Senden/Bearbeiten/Löschen |
| pins          | aktiviert | Anheften/Lösen/Auflisten |
| memberInfo    | aktiviert | Mitgliedsinformationen  |
| emojiList     | aktiviert | Liste benutzerdefinierter Emojis |

### Mattermost

Mattermost wird als Plugin ausgeliefert: `openclaw plugins install @openclaw/mattermost`.

```json5
{
  channels: {
    mattermost: {
      enabled: true,
      botToken: "mm-token",
      baseUrl: "https://chat.example.com",
      dmPolicy: "pairing",
      chatmode: "oncall", // oncall | onmessage | onchar
      oncharPrefixes: [">", "!"],
      groups: {
        "*": { requireMention: true },
        "team-channel-id": { requireMention: false },
      },
      commands: {
        native: true, // opt-in
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Optional explicit URL for reverse-proxy/public deployments
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

Chat-Modi: `oncall` (Antwort bei @-Erwähnung, Standard), `onmessage` (jede Nachricht), `onchar` (Nachrichten, die mit dem Trigger-Präfix beginnen).

Wenn native Mattermost-Befehle aktiviert sind:

- `commands.callbackPath` muss ein Pfad sein (zum Beispiel `/api/channels/mattermost/command`), keine vollständige URL.
- `commands.callbackUrl` muss zum OpenClaw-Gateway-Endpunkt aufgelöst werden und vom Mattermost-Server erreichbar sein.
- Native Slash-Callbacks werden mit den pro Befehl ausgegebenen Tokens authentifiziert, die Mattermost bei der Registrierung von Slash-Befehlen zurückgibt. Wenn die Registrierung fehlschlägt oder keine Befehle aktiviert sind, lehnt OpenClaw Callbacks mit `Unauthorized: invalid command token.` ab.
- Für private/Tailnet/interne Callback-Hosts kann Mattermost verlangen, dass `ServiceSettings.AllowedUntrustedInternalConnections` den Callback-Host bzw. die Domain enthält. Verwenden Sie Host-/Domain-Werte, keine vollständigen URLs.
- `channels.mattermost.configWrites`: Mattermost-initiierte Konfigurationsschreibvorgänge zulassen oder verweigern.
- `channels.mattermost.requireMention`: `@mention` vor Antworten in Kanälen verlangen.
- `channels.mattermost.groups.<channelId>.requireMention`: Überschreibung des Mention-Gatings pro Kanal (`"*"` für Standard).
- Optional überschreibt `channels.mattermost.defaultAccount` die Standardkontoauswahl, wenn es mit einer konfigurierten Konto-ID übereinstimmt.

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // optionale Kontobindung
      dmPolicy: "pairing",
      allowFrom: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      configWrites: true,
      reactionNotifications: "own", // off | own | all | allowlist
      reactionAllowlist: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      historyLimit: 50,
    },
  },
}
```

**Modi für Reaktionsbenachrichtigungen:** `off`, `own` (Standard), `all`, `allowlist` (aus `reactionAllowlist`).

- `channels.signal.account`: bindet den Kanalstart an eine bestimmte Signal-Kontoidentität.
- `channels.signal.configWrites`: von Signal initiierte Konfigurationsschreibvorgänge zulassen oder verweigern.
- Optional überschreibt `channels.signal.defaultAccount` die Standardkontoauswahl, wenn es mit einer konfigurierten Konto-ID übereinstimmt.

### BlueBubbles

BlueBubbles ist der empfohlene iMessage-Pfad (Plugin-basiert, konfiguriert unter `channels.bluebubbles`).

```json5
{
  channels: {
    bluebubbles: {
      enabled: true,
      dmPolicy: "pairing",
      // serverUrl, password, webhookPath, group controls, and advanced actions:
      // see /channels/bluebubbles
    },
  },
}
```

- Hier behandelte zentrale Schlüsselpfade: `channels.bluebubbles`, `channels.bluebubbles.dmPolicy`.
- Optional überschreibt `channels.bluebubbles.defaultAccount` die Standardkontoauswahl, wenn es mit einer konfigurierten Konto-ID übereinstimmt.
- Top-Level-Einträge in `bindings[]` mit `type: "acp"` können BlueBubbles-Konversationen an persistente ACP-Sitzungen binden. Verwenden Sie einen BlueBubbles-Handle oder Ziel-String (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) in `match.peer.id`. Gemeinsame Feldsemantik: [ACP Agents](/de/tools/acp-agents#channel-specific-settings).
- Die vollständige BlueBubbles-Kanalkonfiguration ist in [BlueBubbles](/de/channels/bluebubbles) dokumentiert.

### iMessage

OpenClaw startet `imsg rpc` (JSON-RPC über stdio). Kein Daemon oder Port erforderlich.

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "imsg",
      dbPath: "~/Library/Messages/chat.db",
      remoteHost: "user@gateway-host",
      dmPolicy: "pairing",
      allowFrom: ["+15555550123", "user@example.com", "chat_id:123"],
      historyLimit: 50,
      includeAttachments: false,
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      mediaMaxMb: 16,
      service: "auto",
      region: "US",
    },
  },
}
```

- Optional überschreibt `channels.imessage.defaultAccount` die Standardkontoauswahl, wenn es mit einer konfigurierten Konto-ID übereinstimmt.

- Erfordert Full Disk Access auf die Messages-Datenbank.
- Bevorzugen Sie Ziele vom Typ `chat_id:<id>`. Verwenden Sie `imsg chats --limit 20`, um Chats aufzulisten.
- `cliPath` kann auf einen SSH-Wrapper zeigen; setzen Sie `remoteHost` (`host` oder `user@host`) für das Abrufen von Anhängen per SCP.
- `attachmentRoots` und `remoteAttachmentRoots` beschränken eingehende Anhangspfade (Standard: `/Users/*/Library/Messages/Attachments`).
- SCP verwendet strikte Host-Key-Prüfung, daher muss der Schlüssel des Relay-Hosts bereits in `~/.ssh/known_hosts` vorhanden sein.
- `channels.imessage.configWrites`: von iMessage initiierte Konfigurationsschreibvorgänge zulassen oder verweigern.
- Top-Level-Einträge in `bindings[]` mit `type: "acp"` können iMessage-Konversationen an persistente ACP-Sitzungen binden. Verwenden Sie einen normalisierten Handle oder ein explizites Chat-Ziel (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) in `match.peer.id`. Gemeinsame Feldsemantik: [ACP Agents](/de/tools/acp-agents#channel-specific-settings).

<Accordion title="Beispiel für iMessage-SSH-Wrapper">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix ist durch eine Erweiterung unterstützt und wird unter `channels.matrix` konfiguriert.

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_bot_xxx",
      proxy: "http://127.0.0.1:7890",
      encryption: true,
      initialSyncLimit: 20,
      defaultAccount: "ops",
      accounts: {
        ops: {
          name: "Ops",
          userId: "@ops:example.org",
          accessToken: "syt_ops_xxx",
        },
        alerts: {
          userId: "@alerts:example.org",
          password: "secret",
          proxy: "http://127.0.0.1:7891",
        },
      },
    },
  },
}
```

- Token-Authentifizierung verwendet `accessToken`; Passwort-Authentifizierung verwendet `userId` + `password`.
- `channels.matrix.proxy` leitet Matrix-HTTP-Datenverkehr über einen expliziten HTTP(S)-Proxy. Benannte Konten können dies mit `channels.matrix.accounts.<id>.proxy` überschreiben.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` erlaubt private/interne Homeserver. `proxy` und dieses Netzwerk-Opt-in sind unabhängige Steuerungen.
- `channels.matrix.defaultAccount` wählt in Setups mit mehreren Konten das bevorzugte Konto aus.
- `channels.matrix.autoJoin` ist standardmäßig `off`, daher werden eingeladene Räume und neue DM-artige Einladungen ignoriert, bis Sie `autoJoin: "allowlist"` mit `autoJoinAllowlist` oder `autoJoin: "always"` setzen.
- `channels.matrix.execApprovals`: Matrix-native Zustellung von Exec-Genehmigungen und Autorisierung von Genehmigern.
  - `enabled`: `true`, `false` oder `"auto"` (Standard). Im Auto-Modus werden Exec-Genehmigungen aktiviert, wenn Genehmiger aus `approvers` oder `commands.ownerAllowFrom` aufgelöst werden können.
  - `approvers`: Matrix-Benutzer-IDs (z. B. `@owner:example.org`), die Exec-Anfragen genehmigen dürfen.
  - `agentFilter`: optionale Allowlist für Agent-ID. Weglassen, um Genehmigungen für alle Agenten weiterzuleiten.
  - `sessionFilter`: optionale Sitzungs-Schlüssel-Muster (Teilzeichenfolge oder Regex).
  - `target`: wohin Genehmigungsaufforderungen gesendet werden. `"dm"` (Standard), `"channel"` (Ursprungsraum) oder `"both"`.
  - Überschreibungen pro Konto: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` steuert, wie Matrix-DMs in Sitzungen gruppiert werden: `per-user` (Standard) teilt nach geroutetem Peer, während `per-room` jeden DM-Raum isoliert.
- Matrix-Status-Probes und Live-Verzeichnisabfragen verwenden dieselbe Proxy-Richtlinie wie der Laufzeitverkehr.
- Die vollständige Matrix-Konfiguration, Zielregeln und Setup-Beispiele sind in [Matrix](/de/channels/matrix) dokumentiert.

### Microsoft Teams

Microsoft Teams ist durch eine Erweiterung unterstützt und wird unter `channels.msteams` konfiguriert.

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, team/channel policies:
      // see /channels/msteams
    },
  },
}
```

- Hier behandelte zentrale Schlüsselpfade: `channels.msteams`, `channels.msteams.configWrites`.
- Die vollständige Teams-Konfiguration (Anmeldedaten, Webhook, DM-/Gruppenrichtlinie, Überschreibungen pro Team/Kanal) ist in [Microsoft Teams](/de/channels/msteams) dokumentiert.

### IRC

IRC ist durch eine Erweiterung unterstützt und wird unter `channels.irc` konfiguriert.

```json5
{
  channels: {
    irc: {
      enabled: true,
      dmPolicy: "pairing",
      configWrites: true,
      nickserv: {
        enabled: true,
        service: "NickServ",
        password: "${IRC_NICKSERV_PASSWORD}",
        register: false,
        registerEmail: "bot@example.com",
      },
    },
  },
}
```

- Hier behandelte zentrale Schlüsselpfade: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`.
- Optional überschreibt `channels.irc.defaultAccount` die Standardkontoauswahl, wenn es mit einer konfigurierten Konto-ID übereinstimmt.
- Die vollständige IRC-Kanalkonfiguration (Host/Port/TLS/Kanäle/Allowlists/Mention-Gating) ist in [IRC](/de/channels/irc) dokumentiert.

### Mehrere Konten (alle Kanäle)

Führen Sie mehrere Konten pro Kanal aus (jeweils mit eigener `accountId`):

```json5
{
  channels: {
    telegram: {
      accounts: {
        default: {
          name: "Primary bot",
          botToken: "123456:ABC...",
        },
        alerts: {
          name: "Alerts bot",
          botToken: "987654:XYZ...",
        },
      },
    },
  },
}
```

- `default` wird verwendet, wenn `accountId` weggelassen wird (CLI + Routing).
- Env-Tokens gelten nur für das **Standard**konto.
- Basis-Kanaleinstellungen gelten für alle Konten, sofern sie nicht pro Konto überschrieben werden.
- Verwenden Sie `bindings[].match.accountId`, um jedes Konto an einen anderen Agenten zu routen.
- Wenn Sie über `openclaw channels add` (oder Kanal-Onboarding) ein Nicht-Standardkonto hinzufügen, während Sie noch eine Top-Level-Kanalkonfiguration für ein einzelnes Konto haben, überführt OpenClaw zuerst kontobezogene Top-Level-Werte für das einzelne Konto in die Kanal-Kontozuordnung, damit das ursprüngliche Konto weiter funktioniert. Die meisten Kanäle verschieben sie nach `channels.<channel>.accounts.default`; Matrix kann stattdessen ein vorhandenes passendes benanntes/Standardziel beibehalten.
- Vorhandene rein kanalbezogene Bindings (ohne `accountId`) passen weiterhin auf das Standardkonto; kontobezogene Bindings bleiben optional.
- `openclaw doctor --fix` repariert auch gemischte Formen, indem kontobezogene Top-Level-Werte für ein einzelnes Konto in das für diesen Kanal gewählte überführte Konto verschoben werden. Die meisten Kanäle verwenden `accounts.default`; Matrix kann stattdessen ein vorhandenes passendes benanntes/Standardziel beibehalten.

### Andere Erweiterungskanäle

Viele Erweiterungskanäle werden als `channels.<id>` konfiguriert und auf ihren dedizierten Kanalseiten dokumentiert (zum Beispiel Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat und Twitch).
Siehe den vollständigen Kanalindex: [Kanäle](/de/channels).

### Mention-Gating in Gruppenchats

Gruppennachrichten erfordern standardmäßig eine **Erwähnung** (Metadaten-Erwähnung oder sichere Regex-Muster). Gilt für WhatsApp-, Telegram-, Discord-, Google Chat- und iMessage-Gruppenchats.

**Erwähnungstypen:**

- **Metadaten-Erwähnungen**: Native Plattform-@-Erwähnungen. Werden im WhatsApp-Selbstchat-Modus ignoriert.
- **Textmuster**: Sichere Regex-Muster in `agents.list[].groupChat.mentionPatterns`. Ungültige Muster und unsichere verschachtelte Wiederholungen werden ignoriert.
- Mention-Gating wird nur erzwungen, wenn Erkennung möglich ist (native Erwähnungen oder mindestens ein Muster).

```json5
{
  messages: {
    groupChat: { historyLimit: 50 },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` legt den globalen Standard fest. Kanäle können ihn mit `channels.<channel>.historyLimit` (oder pro Konto) überschreiben. Setzen Sie `0`, um ihn zu deaktivieren.

#### DM-Verlaufslimits

```json5
{
  channels: {
    telegram: {
      dmHistoryLimit: 30,
      dms: {
        "123456789": { historyLimit: 50 },
      },
    },
  },
}
```

Auflösung: Überschreibung pro DM → Anbieterstandard → kein Limit (alles bleibt erhalten).

Unterstützt: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### Selbstchat-Modus

Nehmen Sie Ihre eigene Nummer in `allowFrom` auf, um den Selbstchat-Modus zu aktivieren (ignoriert native @-Erwähnungen, antwortet nur auf Textmuster):

```json5
{
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: { "*": { requireMention: true } },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: { mentionPatterns: ["reisponde", "@openclaw"] },
      },
    ],
  },
}
```

### Befehle (Behandlung von Chat-Befehlen)

```json5
{
  commands: {
    native: "auto", // native commands when supported registrieren
    nativeSkills: "auto", // native Skills-Befehle when supported registrieren
    text: true, // /commands in Chat-Nachrichten parsen
    bash: false, // ! zulassen (Alias: /bash)
    bashForegroundMs: 2000,
    config: false, // /config zulassen
    mcp: false, // /mcp zulassen
    plugins: false, // /plugins zulassen
    debug: false, // /debug zulassen
    restart: true, // /restart + gateway restart tool zulassen
    ownerAllowFrom: ["discord:123456789012345678"],
    ownerDisplay: "raw", // raw | hash
    ownerDisplaySecret: "${OWNER_ID_HASH_SECRET}",
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

<Accordion title="Befehlsdetails">

- Dieser Block konfiguriert Befehlsoberflächen. Für den aktuellen integrierten + gebündelten Befehlskatalog siehe [Slash-Befehle](/de/tools/slash-commands).
- Diese Seite ist eine **Referenz für Konfigurationsschlüssel**, nicht der vollständige Befehlskatalog. Kanal-/plugin-eigene Befehle wie QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, device-pair `/pair`, Speicher `/dreaming`, phone-control `/phone` und Talk `/voice` sind auf ihren Kanal-/Plugin-Seiten sowie unter [Slash-Befehle](/de/tools/slash-commands) dokumentiert.
- Textbefehle müssen eigenständige Nachrichten mit führendem `/` sein.
- `native: "auto"` aktiviert native Befehle für Discord/Telegram und lässt Slack deaktiviert.
- `nativeSkills: "auto"` aktiviert native Skills-Befehle für Discord/Telegram und lässt Slack deaktiviert.
- Überschreibung pro Kanal: `channels.discord.commands.native` (boolesch oder `"auto"`). `false` entfernt zuvor registrierte Befehle.
- Überschreiben Sie die Registrierung nativer Skills pro Kanal mit `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` fügt zusätzliche Telegram-Bot-Menüeinträge hinzu.
- `bash: true` aktiviert `! <cmd>` für die Host-Shell. Erfordert `tools.elevated.enabled` und den Absender in `tools.elevated.allowFrom.<channel>`.
- `config: true` aktiviert `/config` (liest/schreibt `openclaw.json`). Für Gateway-`chat.send`-Clients erfordern persistente Schreibvorgänge über `/config set|unset` zusätzlich `operator.admin`; schreibgeschütztes `/config show` bleibt für normale Operator-Clients mit Schreibbereich verfügbar.
- `mcp: true` aktiviert `/mcp` für von OpenClaw verwaltete MCP-Serverkonfiguration unter `mcp.servers`.
- `plugins: true` aktiviert `/plugins` für Plugin-Erkennung sowie Installations- und Aktivieren/Deaktivieren-Steuerung.
- `channels.<provider>.configWrites` steuert Konfigurationsänderungen pro Kanal (Standard: true).
- Für Kanäle mit mehreren Konten steuert `channels.<provider>.accounts.<id>.configWrites` auch Schreibvorgänge, die dieses Konto betreffen (zum Beispiel `/allowlist --config --account <id>` oder `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` deaktiviert `/restart` und Aktionen des gateway restart tool. Standard: `true`.
- `ownerAllowFrom` ist die explizite Eigentümer-Allowlist für Befehle/Tools nur für Eigentümer. Sie ist getrennt von `allowFrom`.
- `ownerDisplay: "hash"` hasht Eigentümer-IDs im System-Prompt. Setzen Sie `ownerDisplaySecret`, um das Hashing zu steuern.
- `allowFrom` ist pro Anbieter. Wenn gesetzt, ist es die **einzige** Autorisierungsquelle (Kanal-Allowlists/Pairing und `useAccessGroups` werden ignoriert).
- `useAccessGroups: false` erlaubt Befehlen, Access-Group-Richtlinien zu umgehen, wenn `allowFrom` nicht gesetzt ist.
- Zuordnung der Befehlsdokumentation:
  - integrierter + gebündelter Katalog: [Slash-Befehle](/de/tools/slash-commands)
  - kanalspezifische Befehlsoberflächen: [Kanäle](/de/channels)
  - QQ Bot-Befehle: [QQ Bot](/de/channels/qqbot)
  - Pairing-Befehle: [Pairing](/de/channels/pairing)
  - LINE-Kartenbefehl: [LINE](/de/channels/line)
  - Memory Dreaming: [Dreaming](/de/concepts/dreaming)

</Accordion>

---

## Agent-Standards

### `agents.defaults.workspace`

Standard: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

Optionales Repository-Root, das in der Runtime-Zeile des System-Prompts angezeigt wird. Falls nicht gesetzt, erkennt OpenClaw es automatisch, indem vom Workspace aus nach oben gelaufen wird.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Optionale Standard-Allowlist für Skills für Agenten, die
`agents.list[].skills` nicht setzen.

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // übernimmt github, weather
      { id: "docs", skills: ["docs-search"] }, // ersetzt Standards
      { id: "locked-down", skills: [] }, // keine Skills
    ],
  },
}
```

- Lassen Sie `agents.defaults.skills` weg, um standardmäßig uneingeschränkte Skills zu erhalten.
- Lassen Sie `agents.list[].skills` weg, um die Standards zu übernehmen.
- Setzen Sie `agents.list[].skills: []` für keine Skills.
- Eine nicht leere Liste in `agents.list[].skills` ist die endgültige Menge für diesen Agenten; sie
  wird nicht mit den Standards zusammengeführt.

### `agents.defaults.skipBootstrap`

Deaktiviert die automatische Erstellung von Workspace-Bootstrap-Dateien (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

Steuert, wann Workspace-Bootstrap-Dateien in den System-Prompt eingefügt werden. Standard: `"always"`.

- `"continuation-skip"`: Sichere Fortsetzungs-Turns (nach einer abgeschlossenen Assistentenantwort) überspringen das erneute Einfügen des Workspace-Bootstraps, wodurch die Prompt-Größe reduziert wird. Heartbeat-Läufe und Wiederholungen nach Compaction bauen den Kontext weiterhin neu auf.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Maximale Zeichenanzahl pro Workspace-Bootstrap-Datei vor der Kürzung. Standard: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Maximale Gesamtanzahl eingefügter Zeichen über alle Workspace-Bootstrap-Dateien hinweg. Standard: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Steuert den für Agenten sichtbaren Warntext, wenn Bootstrap-Kontext gekürzt wird.
Standard: `"once"`.

- `"off"`: Niemals Warntext in den System-Prompt einfügen.
- `"once"`: Warnung einmal pro eindeutiger Kürzungssignatur einfügen (empfohlen).
- `"always"`: Warnung bei jedem Lauf einfügen, wenn eine Kürzung vorliegt.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Zuordnung der Eigentümerschaft von Kontextbudgets

OpenClaw hat mehrere Prompt-/Kontextbudgets mit hohem Volumen, und sie sind
absichtlich nach Subsystemen aufgeteilt, statt alle durch einen einzelnen
generischen Regler zu führen.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  normale Workspace-Bootstrap-Einfügung.
- `agents.defaults.startupContext.*`:
  einmaliges Startup-Präludium für `/new` und `/reset`, einschließlich aktueller täglicher
  `memory/*.md`-Dateien.
- `skills.limits.*`:
  die kompakte Skills-Liste, die in den System-Prompt eingefügt wird.
- `agents.defaults.contextLimits.*`:
  begrenzte Laufzeit-Auszüge und eingefügte laufzeiteigene Blöcke.
- `memory.qmd.limits.*`:
  Snippet- und Einfügungsgrößen für indexierte Speichersuche.

Verwenden Sie die passende Überschreibung pro Agent nur dann, wenn ein Agent ein anderes
Budget benötigt:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Steuert das Startup-Präludium des ersten Turns, das bei einfachen `/new`- und `/reset`-
Läufen eingefügt wird.

```json5
{
  agents: {
    defaults: {
      startupContext: {
        enabled: true,
        applyOn: ["new", "reset"],
        dailyMemoryDays: 2,
        maxFileBytes: 16384,
        maxFileChars: 1200,
        maxTotalChars: 2800,
      },
    },
  },
}
```

#### `agents.defaults.contextLimits`

Gemeinsame Standards für begrenzte Laufzeit-Kontextoberflächen.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        memoryGetDefaultLines: 120,
        toolResultMaxChars: 16000,
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars`: Standardgrenze für `memory_get`-Auszüge, bevor Kürzungsmetadaten
  und Fortsetzungshinweis hinzugefügt werden.
- `memoryGetDefaultLines`: Standard-Zeilenfenster für `memory_get`, wenn `lines`
  weggelassen wird.
- `toolResultMaxChars`: aktive Grenze für Tool-Ergebnisse, die für persistierte Ergebnisse und
  Overflow-Wiederherstellung verwendet wird.
- `postCompactionMaxChars`: Grenze für AGENTS.md-Auszüge, die bei der Aktualisierungseinfügung nach Compaction verwendet wird.

#### `agents.list[].contextLimits`

Überschreibung pro Agent für die gemeinsamen `contextLimits`-Regler. Weggelassene Felder übernehmen
von `agents.defaults.contextLimits`.

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        toolResultMaxChars: 16000,
      },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000,
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

Globale Grenze für die kompakte Skills-Liste, die in den System-Prompt eingefügt wird. Dies
hat keinen Einfluss auf das bedarfsgesteuerte Lesen von `SKILL.md`-Dateien.

```json5
{
  skills: {
    limits: {
      maxSkillsPromptChars: 18000,
    },
  },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

Überschreibung pro Agent für das Skills-Prompt-Budget.

```json5
{
  agents: {
    list: [
      {
        id: "tiny-local",
        skillsLimits: {
          maxSkillsPromptChars: 6000,
        },
      },
    ],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

Maximale Pixelgröße für die längste Bildseite in Transkript-/Tool-Bildblöcken vor Provider-Aufrufen.
Standard: `1200`.

Niedrigere Werte reduzieren normalerweise die Nutzung von Vision-Tokens und die Größe der Request-Payload bei durch Screenshots geprägten Läufen.
Höhere Werte erhalten mehr visuelle Details.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Zeitzone für den Kontext des System-Prompts (nicht für Nachrichten-Zeitstempel). Fällt auf die Host-Zeitzone zurück.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Zeitformat im System-Prompt. Standard: `auto` (OS-Einstellung).

```json5
{
  agents: { defaults: { timeFormat: "auto" } }, // auto | 12 | 24
}
```

### `agents.defaults.model`

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "minimax/MiniMax-M2.7": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.7"],
      },
      imageModel: {
        primary: "openrouter/qwen/qwen-2.5-vl-72b-instruct:free",
        fallbacks: ["openrouter/google/gemini-2.0-flash-vision:free"],
      },
      imageGenerationModel: {
        primary: "openai/gpt-image-1",
        fallbacks: ["google/gemini-3.1-flash-image-preview"],
      },
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-i2v"],
      },
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      params: { cacheRetention: "long" }, // globale Standard-Provider-Parameter
      embeddedHarness: {
        runtime: "auto", // auto | pi | registrierte Harness-ID, z. B. codex
        fallback: "pi", // pi | none
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      elevatedDefault: "on",
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      contextTokens: 200000,
      maxConcurrent: 3,
    },
  },
}
```

- `model`: akzeptiert entweder einen String (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Die String-Form setzt nur das primäre Modell.
  - Die Objekt-Form setzt das primäre Modell plus geordnete Failover-Modelle.
- `imageModel`: akzeptiert entweder einen String (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Wird vom Toolpfad `image` als Vision-Modell-Konfiguration verwendet.
  - Wird auch als Fallback-Routing verwendet, wenn das ausgewählte/Standardmodell keine Bildeingaben akzeptieren kann.
- `imageGenerationModel`: akzeptiert entweder einen String (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Wird von der gemeinsamen Bildgenerierungsfunktion und jeder zukünftigen Tool-/Plugin-Oberfläche verwendet, die Bilder generiert.
  - Typische Werte: `google/gemini-3.1-flash-image-preview` für native Gemini-Bildgenerierung, `fal/fal-ai/flux/dev` für fal oder `openai/gpt-image-1` für OpenAI Images.
  - Wenn Sie direkt ein provider/model auswählen, konfigurieren Sie auch die passende Provider-Authentifizierung bzw. den API-Schlüssel (zum Beispiel `GEMINI_API_KEY` oder `GOOGLE_API_KEY` für `google/*`, `OPENAI_API_KEY` für `openai/*`, `FAL_KEY` für `fal/*`).
  - Wenn weggelassen, kann `image_generate` trotzdem einen auth-gestützten Provider-Standard ableiten. Es versucht zuerst den aktuellen Standard-Provider, dann die übrigen registrierten Bildgenerierungs-Provider in Provider-ID-Reihenfolge.
- `musicGenerationModel`: akzeptiert entweder einen String (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Wird von der gemeinsamen Musikgenerierungsfunktion und dem integrierten Tool `music_generate` verwendet.
  - Typische Werte: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` oder `minimax/music-2.5+`.
  - Wenn weggelassen, kann `music_generate` trotzdem einen auth-gestützten Provider-Standard ableiten. Es versucht zuerst den aktuellen Standard-Provider, dann die übrigen registrierten Musikgenerierungs-Provider in Provider-ID-Reihenfolge.
  - Wenn Sie direkt ein provider/model auswählen, konfigurieren Sie auch die passende Provider-Authentifizierung bzw. den API-Schlüssel.
- `videoGenerationModel`: akzeptiert entweder einen String (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Wird von der gemeinsamen Videogenerierungsfunktion und dem integrierten Tool `video_generate` verwendet.
  - Typische Werte: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` oder `qwen/wan2.7-r2v`.
  - Wenn weggelassen, kann `video_generate` trotzdem einen auth-gestützten Provider-Standard ableiten. Es versucht zuerst den aktuellen Standard-Provider, dann die übrigen registrierten Videogenerierungs-Provider in Provider-ID-Reihenfolge.
  - Wenn Sie direkt ein provider/model auswählen, konfigurieren Sie auch die passende Provider-Authentifizierung bzw. den API-Schlüssel.
  - Der gebündelte Qwen-Videogenerierungs-Provider unterstützt bis zu 1 Ausgabevideo, 1 Eingabebild, 4 Eingabevideos, 10 Sekunden Dauer sowie Provider-Level-Optionen für `size`, `aspectRatio`, `resolution`, `audio` und `watermark`.
- `pdfModel`: akzeptiert entweder einen String (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Wird vom Tool `pdf` für das Modell-Routing verwendet.
  - Wenn weggelassen, fällt das PDF-Tool auf `imageModel` und dann auf das aufgelöste Sitzungs-/Standardmodell zurück.
- `pdfMaxBytesMb`: Standardgrößenlimit für PDFs für das Tool `pdf`, wenn `maxBytesMb` nicht beim Aufruf übergeben wird.
- `pdfMaxPages`: standardmäßige maximale Seitenzahl, die vom Extraction-Fallback-Modus im Tool `pdf` berücksichtigt wird.
- `verboseDefault`: Standard-Verbose-Stufe für Agenten. Werte: `"off"`, `"on"`, `"full"`. Standard: `"off"`.
- `elevatedDefault`: Standardstufe für Elevated-Output für Agenten. Werte: `"off"`, `"on"`, `"ask"`, `"full"`. Standard: `"on"`.
- `model.primary`: Format `provider/model` (z. B. `openai/gpt-5.4`). Wenn Sie den Provider weglassen, versucht OpenClaw zuerst einen Alias, dann eine eindeutige configured-provider-Übereinstimmung für genau diese Modell-ID und fällt erst danach auf den konfigurierten Standard-Provider zurück (veraltetes Kompatibilitätsverhalten, daher bevorzugen Sie explizites `provider/model`). Wenn dieser Provider das konfigurierte Standardmodell nicht mehr anbietet, fällt OpenClaw auf das erste konfigurierte Provider-/Modellpaar zurück, statt einen veralteten entfernten Provider-Standard anzuzeigen.
- `models`: der konfigurierte Modellkatalog und die Allowlist für `/model`. Jeder Eintrag kann `alias` (Shortcut) und `params` (provider-spezifisch, zum Beispiel `temperature`, `maxTokens`, `cacheRetention`, `context1m`) enthalten.
- `params`: globale Standard-Provider-Parameter, die auf alle Modelle angewendet werden. Setzen Sie sie unter `agents.defaults.params` (z. B. `{ cacheRetention: "long" }`).
- Merge-Priorität von `params` (Konfiguration): `agents.defaults.params` (globale Basis) wird von `agents.defaults.models["provider/model"].params` (pro Modell) überschrieben, dann überschreibt `agents.list[].params` (passende Agent-ID) nach Schlüssel. Details finden Sie unter [Prompt Caching](/de/reference/prompt-caching).
- `embeddedHarness`: Standardrichtlinie für die Low-Level-Laufzeit eingebetteter Agenten. Verwenden Sie `runtime: "auto"`, damit registrierte Plugin-Harnesses unterstützte Modelle übernehmen können, `runtime: "pi"`, um das integrierte PI-Harness zu erzwingen, oder eine registrierte Harness-ID wie `runtime: "codex"`. Setzen Sie `fallback: "none"`, um den automatischen PI-Fallback zu deaktivieren.
- Konfigurationsschreiber, die diese Felder ändern (zum Beispiel `/models set`, `/models set-image` und Befehle zum Hinzufügen/Entfernen von Fallbacks), speichern die kanonische Objektform und behalten vorhandene Fallback-Listen nach Möglichkeit bei.
- `maxConcurrent`: maximale Anzahl paralleler Agentenläufe über Sitzungen hinweg (jede Sitzung bleibt weiterhin serialisiert). Standard: 4.

### `agents.defaults.embeddedHarness`

`embeddedHarness` steuert, welcher Low-Level-Executor eingebettete Agenten-Turns ausführt.
Die meisten Deployments sollten den Standard `{ runtime: "auto", fallback: "pi" }` beibehalten.
Verwenden Sie dies, wenn ein vertrauenswürdiges Plugin ein natives Harness bereitstellt, wie das gebündelte
Codex-App-Server-Harness.

```json5
{
  agents: {
    defaults: {
      model: "codex/gpt-5.4",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

- `runtime`: `"auto"`, `"pi"` oder eine registrierte Plugin-Harness-ID. Das gebündelte Codex-Plugin registriert `codex`.
- `fallback`: `"pi"` oder `"none"`. `"pi"` behält das integrierte PI-Harness als Kompatibilitäts-Fallback bei. `"none"` führt dazu, dass eine fehlende oder nicht unterstützte Plugin-Harness-Auswahl fehlschlägt, statt stillschweigend PI zu verwenden.
- Env-Überschreibungen: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` überschreibt `runtime`; `OPENCLAW_AGENT_HARNESS_FALLBACK=none` deaktiviert den PI-Fallback für diesen Prozess.
- Für reine Codex-Deployments setzen Sie `model: "codex/gpt-5.4"`, `embeddedHarness.runtime: "codex"` und `embeddedHarness.fallback: "none"`.
- Dies steuert nur das eingebettete Chat-Harness. Mediengenerierung, Vision, PDF, Musik, Video und TTS verwenden weiterhin ihre Provider-/Modell-Einstellungen.

**Integrierte Alias-Shortcuts** (gelten nur, wenn das Modell in `agents.defaults.models` enthalten ist):

| Alias               | Modell                                |
| ------------------- | ------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`           |
| `sonnet`            | `anthropic/claude-sonnet-4-6`         |
| `gpt`               | `openai/gpt-5.4`                      |
| `gpt-mini`          | `openai/gpt-5.4-mini`                 |
| `gpt-nano`          | `openai/gpt-5.4-nano`                 |
| `gemini`            | `google/gemini-3.1-pro-preview`       |
| `gemini-flash`      | `google/gemini-3-flash-preview`       |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview` |

Ihre konfigurierten Aliasse haben immer Vorrang vor den Standards.

Bei Z.AI-GLM-4.x-Modellen wird der Thinking-Modus automatisch aktiviert, sofern Sie nicht `--thinking off` setzen oder `agents.defaults.models["zai/<model>"].params.thinking` selbst definieren.
Z.AI-Modelle aktivieren standardmäßig `tool_stream` für Tool-Call-Streaming. Setzen Sie `agents.defaults.models["zai/<model>"].params.tool_stream` auf `false`, um es zu deaktivieren.
Anthropic Claude 4.6-Modelle verwenden standardmäßig `adaptive` Thinking, wenn keine explizite Thinking-Stufe gesetzt ist.

### `agents.defaults.cliBackends`

Optionale CLI-Backends für reine Text-Fallback-Läufe (ohne Tool-Calls). Nützlich als Backup, wenn API-Provider ausfallen.

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          systemPromptArg: "--system",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- CLI-Backends sind textorientiert; Tools sind immer deaktiviert.
- Sitzungen werden unterstützt, wenn `sessionArg` gesetzt ist.
- Durchreichen von Bildern wird unterstützt, wenn `imageArg` Dateipfade akzeptiert.

### `agents.defaults.systemPromptOverride`

Ersetzt den gesamten von OpenClaw zusammengesetzten System-Prompt durch einen festen String. Setzbar auf Standardebene (`agents.defaults.systemPromptOverride`) oder pro Agent (`agents.list[].systemPromptOverride`). Werte pro Agent haben Vorrang; ein leerer oder nur aus Whitespace bestehender Wert wird ignoriert. Nützlich für kontrollierte Prompt-Experimente.

```json5
{
  agents: {
    defaults: {
      systemPromptOverride: "You are a helpful assistant.",
    },
  },
}
```

### `agents.defaults.heartbeat`

Periodische Heartbeat-Läufe.

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m deaktiviert
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // Standard: true; false lässt den Heartbeat-Abschnitt im System-Prompt weg
        lightContext: false, // Standard: false; true behält nur HEARTBEAT.md aus den Workspace-Bootstrap-Dateien
        isolatedSession: false, // Standard: false; true führt jeden Heartbeat in einer frischen Sitzung aus (kein Gesprächsverlauf)
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (Standard) | block
        target: "none", // Standard: none | Optionen: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: Dauer-String (ms/s/m/h). Standard: `30m` (API-Key-Authentifizierung) oder `1h` (OAuth-Authentifizierung). Setzen Sie `0m`, um zu deaktivieren.
- `includeSystemPromptSection`: Wenn false, wird der Heartbeat-Abschnitt aus dem System-Prompt ausgelassen und das Einfügen von `HEARTBEAT.md` in den Bootstrap-Kontext übersprungen. Standard: `true`.
- `suppressToolErrorWarnings`: Wenn true, werden Payloads mit Tool-Fehlerwarnungen während Heartbeat-Läufen unterdrückt.
- `timeoutSeconds`: maximal zulässige Zeit in Sekunden für einen Heartbeat-Agenten-Turn, bevor er abgebrochen wird. Wenn nicht gesetzt, wird `agents.defaults.timeoutSeconds` verwendet.
- `directPolicy`: Richtlinie für direkte/DM-Zustellung. `allow` (Standard) erlaubt die Zustellung an direkte Ziele. `block` unterdrückt die Zustellung an direkte Ziele und gibt `reason=dm-blocked` aus.
- `lightContext`: Wenn true, verwenden Heartbeat-Läufe einen leichtgewichtigen Bootstrap-Kontext und behalten nur `HEARTBEAT.md` aus den Workspace-Bootstrap-Dateien.
- `isolatedSession`: Wenn true, wird jeder Heartbeat in einer frischen Sitzung ohne vorherigen Gesprächsverlauf ausgeführt. Gleiches Isolationsmuster wie bei Cron `sessionTarget: "isolated"`. Reduziert die Token-Kosten pro Heartbeat von ca. 100K auf ca. 2–5K Token.
- Pro Agent: setzen Sie `agents.list[].heartbeat`. Wenn ein Agent `heartbeat` definiert, führen **nur diese Agenten** Heartbeats aus.
- Heartbeats führen vollständige Agenten-Turns aus — kürzere Intervalle verbrauchen mehr Token.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // ID eines registrierten Compaction-Provider-Plugins (optional)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Deployment-IDs, Ticket-IDs und Host:Port-Paare exakt beibehalten.", // verwendet, wenn identifierPolicy=custom
        postCompactionSections: ["Session Startup", "Red Lines"], // [] deaktiviert erneutes Einfügen
        model: "openrouter/anthropic/claude-sonnet-4-6", // optionale nur-für-Compaction-Modellüberschreibung
        notifyUser: true, // sendet einen kurzen Hinweis, wenn Compaction startet (Standard: false)
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "Sitzung nähert sich Compaction. Dauerhafte Erinnerungen jetzt speichern.",
          prompt: "Schreiben Sie alle bleibenden Notizen in memory/YYYY-MM-DD.md; antworten Sie mit dem exakten stillen Token NO_REPLY, wenn nichts gespeichert werden soll.",
        },
      },
    },
  },
}
```

- `mode`: `default` oder `safeguard` (Chunk-basierte Zusammenfassung für lange Verläufe). Siehe [Compaction](/de/concepts/compaction).
- `provider`: ID eines registrierten Compaction-Provider-Plugins. Wenn gesetzt, wird `summarize()` des Providers anstelle der integrierten LLM-Zusammenfassung aufgerufen. Bei Fehlern wird auf die integrierte Variante zurückgefallen. Das Setzen eines Providers erzwingt `mode: "safeguard"`. Siehe [Compaction](/de/concepts/compaction).
- `timeoutSeconds`: maximale Anzahl Sekunden, die für einen einzelnen Compaction-Vorgang erlaubt ist, bevor OpenClaw ihn abbricht. Standard: `900`.
- `identifierPolicy`: `strict` (Standard), `off` oder `custom`. `strict` stellt der Compaction-Zusammenfassung integrierte Hinweise zum Beibehalten opaker Kennungen voran.
- `identifierInstructions`: optionaler benutzerdefinierter Text zur Beibehaltung von Kennungen, der verwendet wird, wenn `identifierPolicy=custom`.
- `postCompactionSections`: optionale H2/H3-Abschnittsnamen aus AGENTS.md, die nach der Compaction erneut eingefügt werden. Standard ist `["Session Startup", "Red Lines"]`; setzen Sie `[]`, um das erneute Einfügen zu deaktivieren. Wenn nicht gesetzt oder explizit auf dieses Standardpaar gesetzt, werden ältere Überschriften `Every Session`/`Safety` zusätzlich als Legacy-Fallback akzeptiert.
- `model`: optionale Überschreibung `provider/model-id` nur für die Compaction-Zusammenfassung. Verwenden Sie dies, wenn die Hauptsitzung ein Modell beibehalten soll, Compaction-Zusammenfassungen aber mit einem anderen Modell laufen sollen; wenn nicht gesetzt, verwendet Compaction das primäre Modell der Sitzung.
- `notifyUser`: wenn `true`, wird ein kurzer Hinweis an den Benutzer gesendet, wenn Compaction startet (zum Beispiel „Kontext wird kompaktiert...“). Standardmäßig deaktiviert, damit Compaction still abläuft.
- `memoryFlush`: stiller agentischer Turn vor automatischer Compaction zum Speichern dauerhafter Erinnerungen. Wird übersprungen, wenn der Workspace schreibgeschützt ist.

### `agents.defaults.contextPruning`

Entfernt **alte Tool-Ergebnisse** aus dem In-Memory-Kontext, bevor dieser an das LLM gesendet wird. Ändert **nicht** den Sitzungsverlauf auf der Festplatte.

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // Dauer (ms/s/m/h), Standardeinheit: Minuten
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Inhalt alter Tool-Ergebnisse gelöscht]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="Verhalten des Modus cache-ttl">

- `mode: "cache-ttl"` aktiviert Bereinigungsläufe.
- `ttl` steuert, wie oft die Bereinigung erneut ausgeführt werden kann (nach der letzten Cache-Berührung).
- Die Bereinigung kürzt zuerst übergroße Tool-Ergebnisse weich und löscht dann bei Bedarf ältere Tool-Ergebnisse hart.

**Soft-Trim** behält Anfang + Ende und fügt in der Mitte `...` ein.

**Hard-Clear** ersetzt das gesamte Tool-Ergebnis durch den Platzhalter.

Hinweise:

- Bildblöcke werden niemals gekürzt/gelöscht.
- Verhältnisse basieren auf Zeichen (ungefähr), nicht auf exakten Token-Anzahlen.
- Wenn weniger als `keepLastAssistants` Assistentennachrichten vorhanden sind, wird die Bereinigung übersprungen.

</Accordion>

Siehe [Session Pruning](/de/concepts/session-pruning) für Verhaltensdetails.

### Block-Streaming

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (verwenden Sie minMs/maxMs)
    },
  },
}
```

- Nicht-Telegram-Kanäle erfordern explizit `*.blockStreaming: true`, um Block-Antworten zu aktivieren.
- Kanalüberschreibungen: `channels.<channel>.blockStreamingCoalesce` (und Varianten pro Konto). Signal/Slack/Discord/Google Chat verwenden standardmäßig `minChars: 1500`.
- `humanDelay`: zufällige Pause zwischen Block-Antworten. `natural` = 800–2500ms. Überschreibung pro Agent: `agents.list[].humanDelay`.

Siehe [Streaming](/de/concepts/streaming) für Verhaltens- und Chunking-Details.

### Tippindikatoren

```json5
{
  agents: {
    defaults: {
      typingMode: "instant", // never | instant | thinking | message
      typingIntervalSeconds: 6,
    },
  },
}
```

- Standardwerte: `instant` für Direktchats/Erwähnungen, `message` für Gruppenchats ohne Erwähnung.
- Überschreibungen pro Sitzung: `session.typingMode`, `session.typingIntervalSeconds`.

Siehe [Tippindikatoren](/de/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Optionale Sandbox für den eingebetteten Agenten. Siehe [Sandboxing](/de/gateway/sandboxing) für die vollständige Anleitung.

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        backend: "docker", // docker | ssh | openshell
        scope: "agent", // session | agent | shared
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          containerPrefix: "openclaw-sbx-",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256,
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"],
          binds: ["/home/user/source:/source:rw"],
        },
        ssh: {
          target: "user@gateway-host:22",
          command: "ssh",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // SecretRefs / Inline-Inhalte werden ebenfalls unterstützt:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
        browser: {
          enabled: false,
          image: "openclaw-sandbox-browser:bookworm-slim",
          network: "openclaw-sandbox-browser",
          cdpPort: 9222,
          cdpSourceRange: "172.21.0.1/32",
          vncPort: 5900,
          noVncPort: 6080,
          headless: false,
          enableNoVnc: true,
          allowHostControl: false,
          autoStart: true,
          autoStartTimeoutMs: 12000,
        },
        prune: {
          idleHours: 24,
          maxAgeDays: 7,
        },
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        allow: [
          "exec",
          "process",
          "read",
          "write",
          "edit",
          "apply_patch",
          "sessions_list",
          "sessions_history",
          "sessions_send",
          "sessions_spawn",
          "session_status",
        ],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"],
      },
    },
  },
}
```

<Accordion title="Sandbox-Details">

**Backend:**

- `docker`: lokale Docker-Laufzeit (Standard)
- `ssh`: generische SSH-gestützte Remote-Laufzeit
- `openshell`: OpenShell-Laufzeit

Wenn `backend: "openshell"` ausgewählt ist, werden laufzeitspezifische Einstellungen nach
`plugins.entries.openshell.config` verschoben.

**SSH-Backend-Konfiguration:**

- `target`: SSH-Ziel im Format `user@host[:port]`
- `command`: SSH-Client-Befehl (Standard: `ssh`)
- `workspaceRoot`: absolutes Remote-Root, das für Workspaces pro Scope verwendet wird
- `identityFile` / `certificateFile` / `knownHostsFile`: vorhandene lokale Dateien, die an OpenSSH übergeben werden
- `identityData` / `certificateData` / `knownHostsData`: Inline-Inhalte oder SecretRefs, die OpenClaw zur Laufzeit in temporäre Dateien materialisiert
- `strictHostKeyChecking` / `updateHostKeys`: OpenSSH-Regler für die Host-Key-Richtlinie

**Priorität der SSH-Authentifizierung:**

- `identityData` hat Vorrang vor `identityFile`
- `certificateData` hat Vorrang vor `certificateFile`
- `knownHostsData` hat Vorrang vor `knownHostsFile`
- SecretRef-gestützte `*Data`-Werte werden aus dem aktiven Laufzeit-Snapshot für Secrets aufgelöst, bevor die Sandbox-Sitzung startet

**Verhalten des SSH-Backends:**

- initialisiert den Remote-Workspace einmal nach dem Erstellen oder Neuerstellen
- hält danach den Remote-SSH-Workspace als kanonisch
- leitet `exec`, Dateitools und Medienpfade über SSH
- synchronisiert Remote-Änderungen nicht automatisch zurück auf den Host
- unterstützt keine Sandbox-Browser-Container

**Workspace-Zugriff:**

- `none`: Sandbox-Workspace pro Scope unter `~/.openclaw/sandboxes`
- `ro`: Sandbox-Workspace unter `/workspace`, Agent-Workspace schreibgeschützt unter `/agent` eingehängt
- `rw`: Agent-Workspace schreibend/lesend unter `/workspace` eingehängt

**Scope:**

- `session`: Container + Workspace pro Sitzung
- `agent`: ein Container + Workspace pro Agent (Standard)
- `shared`: geteilter Container und Workspace (keine sitzungsübergreifende Isolation)

**OpenShell-Plugin-Konfiguration:**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // mirror | remote
          from: "openclaw",
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
          gateway: "lab", // optional
          gatewayEndpoint: "https://lab.example", // optional
          policy: "strict", // optionale OpenShell-Richtlinien-ID
          providers: ["openai"], // optional
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**OpenShell-Modus:**

- `mirror`: initialisiert Remote vor `exec` aus lokal, synchronisiert nach `exec` zurück; der lokale Workspace bleibt kanonisch
- `remote`: initialisiert Remote einmal beim Erstellen der Sandbox, danach bleibt der Remote-Workspace kanonisch

Im Modus `remote` werden host-lokale Änderungen, die außerhalb von OpenClaw vorgenommen werden, nach dem Initialisierungsschritt nicht automatisch in die Sandbox synchronisiert.
Der Transport erfolgt per SSH in die OpenShell-Sandbox, aber das Plugin verwaltet den Sandbox-Lebenszyklus und optionale Mirror-Synchronisation.

**`setupCommand`** wird einmal nach der Container-Erstellung ausgeführt (über `sh -lc`). Benötigt Netzwerk-Egress, beschreibbares Root und Root-Benutzer.

**Container verwenden standardmäßig `network: "none"`** — setzen Sie es auf `"bridge"` (oder ein benutzerdefiniertes Bridge-Netzwerk), wenn der Agent ausgehenden Zugriff benötigt.
`"host"` ist blockiert. `"container:<id>"` ist standardmäßig blockiert, außer Sie setzen explizit
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (Break-Glass).

**Eingehende Anhänge** werden unter `media/inbound/*` im aktiven Workspace bereitgestellt.

**`docker.binds`** hängt zusätzliche Host-Verzeichnisse ein; globale und pro Agent definierte Bindings werden zusammengeführt.

**Sandbox-Browser** (`sandbox.browser.enabled`): Chromium + CDP in einem Container. Die noVNC-URL wird in den System-Prompt eingefügt. Erfordert kein `browser.enabled` in `openclaw.json`.
Der noVNC-Beobachterzugriff verwendet standardmäßig VNC-Authentifizierung, und OpenClaw gibt eine kurzlebige Token-URL aus (anstatt das Passwort in der gemeinsamen URL offenzulegen).

- `allowHostControl: false` (Standard) blockiert, dass Sandbox-Sitzungen den Host-Browser ansteuern.
- `network` ist standardmäßig `openclaw-sandbox-browser` (dediziertes Bridge-Netzwerk). Setzen Sie es nur dann auf `bridge`, wenn Sie ausdrücklich globale Bridge-Konnektivität wünschen.
- `cdpSourceRange` beschränkt optional eingehenden CDP-Verkehr am Container-Rand auf einen CIDR-Bereich (zum Beispiel `172.21.0.1/32`).
- `sandbox.browser.binds` hängt zusätzliche Host-Verzeichnisse nur in den Sandbox-Browser-Container ein. Wenn gesetzt (einschließlich `[]`), ersetzt es `docker.binds` für den Browser-Container.
- Startstandards sind in `scripts/sandbox-browser-entrypoint.sh` definiert und für Container-Hosts abgestimmt:
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-3d-apis`
  - `--disable-gpu`
  - `--disable-software-rasterizer`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-features=TranslateUI`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--renderer-process-limit=2`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--disable-extensions` (standardmäßig aktiviert)
  - `--disable-3d-apis`, `--disable-software-rasterizer` und `--disable-gpu` sind
    standardmäßig aktiviert und können mit
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` deaktiviert werden, wenn WebGL-/3D-Nutzung dies erfordert.
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` aktiviert Erweiterungen wieder, wenn Ihr Workflow
    von ihnen abhängt.
  - `--renderer-process-limit=2` kann mit
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` geändert werden; setzen Sie `0`, um das
    Standard-Prozesslimit von Chromium zu verwenden.
  - plus `--no-sandbox` und `--disable-setuid-sandbox`, wenn `noSandbox` aktiviert ist.
  - Die Standardwerte sind die Basis des Container-Images; verwenden Sie ein benutzerdefiniertes Browser-Image mit einem benutzerdefinierten
    Entry-Point, um die Container-Standards zu ändern.

</Accordion>

Browser-Sandboxing und `sandbox.docker.binds` sind nur für Docker verfügbar.

Images bauen:

```bash
scripts/sandbox-setup.sh           # Haupt-Sandbox-Image
scripts/sandbox-browser-setup.sh   # optionales Browser-Image
```

### `agents.list` (Überschreibungen pro Agent)

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Main Agent",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // oder { primary, fallbacks }
        thinkingDefault: "high", // Überschreibung der Thinking-Stufe pro Agent
        reasoningDefault: "on", // Überschreibung der Sichtbarkeit von Reasoning pro Agent
        fastModeDefault: false, // Überschreibung des Fast-Modus pro Agent
        embeddedHarness: { runtime: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // überschreibt passende defaults.models-Parameter schlüsselweise
        skills: ["docs-search"], // ersetzt agents.defaults.skills, wenn gesetzt
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
        groupChat: { mentionPatterns: ["@openclaw"] },
        sandbox: { mode: "off" },
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
        subagents: { allowAgents: ["*"] },
        tools: {
          profile: "coding",
          allow: ["browser"],
          deny: ["canvas"],
          elevated: { enabled: true },
        },
      },
    ],
  },
}
```

- `id`: stabile Agent-ID (erforderlich).
- `default`: wenn mehrere gesetzt sind, gewinnt die erste (Warnung wird protokolliert). Wenn keine gesetzt ist, ist der erste Listeneintrag der Standard.
- `model`: Die String-Form überschreibt nur `primary`; die Objekt-Form `{ primary, fallbacks }` überschreibt beide (`[]` deaktiviert globale Fallbacks). Cron-Jobs, die nur `primary` überschreiben, übernehmen weiterhin die Standard-Fallbacks, sofern Sie nicht `fallbacks: []` setzen.
- `params`: Stream-Parameter pro Agent, die über den ausgewählten Modelleintrag in `agents.defaults.models` zusammengeführt werden. Verwenden Sie dies für agentenspezifische Überschreibungen wie `cacheRetention`, `temperature` oder `maxTokens`, ohne den gesamten Modellkatalog zu duplizieren.
- `skills`: optionale Skills-Allowlist pro Agent. Wenn weggelassen, übernimmt der Agent `agents.defaults.skills`, falls gesetzt; eine explizite Liste ersetzt die Standards, statt mit ihnen zusammengeführt zu werden, und `[]` bedeutet keine Skills.
- `thinkingDefault`: optionale Standard-Thinking-Stufe pro Agent (`off | minimal | low | medium | high | xhigh | adaptive`). Überschreibt `agents.defaults.thinkingDefault` für diesen Agenten, wenn keine Überschreibung pro Nachricht oder Sitzung gesetzt ist.
- `reasoningDefault`: optionale Standardsichtbarkeit für Reasoning pro Agent (`on | off | stream`). Gilt, wenn keine Überschreibung für Reasoning pro Nachricht oder Sitzung gesetzt ist.
- `fastModeDefault`: optionaler Standardwert pro Agent für den Fast-Modus (`true | false`). Gilt, wenn keine Überschreibung für den Fast-Modus pro Nachricht oder Sitzung gesetzt ist.
- `embeddedHarness`: optionale Überschreibung der Low-Level-Harness-Richtlinie pro Agent. Verwenden Sie `{ runtime: "codex", fallback: "none" }`, um einen Agenten auf nur Codex festzulegen, während andere Agenten den Standard-PI-Fallback behalten.
- `runtime`: optionaler Runtime-Deskriptor pro Agent. Verwenden Sie `type: "acp"` mit `runtime.acp`-Standards (`agent`, `backend`, `mode`, `cwd`), wenn der Agent standardmäßig ACP-Harness-Sitzungen verwenden soll.
- `identity.avatar`: workspace-relativer Pfad, `http(s)`-URL oder `data:`-URI.
- `identity` leitet Standardwerte ab: `ackReaction` aus `emoji`, `mentionPatterns` aus `name`/`emoji`.
- `subagents.allowAgents`: Allowlist von Agent-IDs für `sessions_spawn` (`["*"]` = beliebig; Standard: nur derselbe Agent).
- Sandbox-Vererbungsleitplanke: Wenn die anfragende Sitzung in einer Sandbox läuft, lehnt `sessions_spawn` Ziele ab, die unsandboxed laufen würden.
- `subagents.requireAgentId`: wenn true, blockiert `sessions_spawn` Aufrufe ohne `agentId` (erzwingt explizite Profilauswahl; Standard: false).

---

## Multi-Agent-Routing

Führen Sie mehrere isolierte Agenten innerhalb eines Gateway aus. Siehe [Multi-Agent](/de/concepts/multi-agent).

```json5
{
  agents: {
    list: [
      { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
      { id: "work", workspace: "~/.openclaw/workspace-work" },
    ],
  },
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
  ],
}
```

### Felder für Binding-Matches

- `type` (optional): `route` für normales Routing (fehlender Typ entspricht standardmäßig route), `acp` für persistente ACP-Konversations-Bindings.
- `match.channel` (erforderlich)
- `match.accountId` (optional; `*` = beliebiges Konto; weggelassen = Standardkonto)
- `match.peer` (optional; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (optional; kanalspezifisch)
- `acp` (optional; nur für `type: "acp"`): `{ mode, label, cwd, backend }`

**Deterministische Match-Reihenfolge:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (exakt, ohne Peer/Guild/Team)
5. `match.accountId: "*"` (kanalweit)
6. Standard-Agent

Innerhalb jeder Stufe gewinnt der erste passende Eintrag in `bindings`.

Für Einträge vom Typ `type: "acp"` löst OpenClaw über die exakte Konversationsidentität auf (`match.channel` + Konto + `match.peer.id`) und verwendet nicht die obige Stufenreihenfolge für Route-Bindings.

### Zugriffsprofile pro Agent

<Accordion title="Voller Zugriff (keine Sandbox)">

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="Schreibgeschützte Tools + Workspace">

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "ro" },
        tools: {
          allow: [
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="Kein Dateisystemzugriff (nur Messaging)">

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" },
        tools: {
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
            "gateway",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

</Accordion>

Siehe [Multi-Agent Sandbox & Tools](/de/tools/multi-agent-sandbox-tools) für Details zur Priorität.

---

## Sitzung

```json5
{
  session: {
    scope: "per-sender",
    dmScope: "main", // main | per-peer | per-channel-peer | per-account-channel-peer
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      mode: "daily", // daily | idle
      atHour: 4,
      idleMinutes: 60,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      direct: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    parentForkMaxTokens: 100000, // Parent-Thread-Fork oberhalb dieser Token-Anzahl überspringen (0 deaktiviert)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // Dauer oder false
      maxDiskBytes: "500mb", // optionales hartes Budget
      highWaterBytes: "400mb", // optionales Bereinigungsziel
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // Standard für automatische Entfokussierung bei Inaktivität in Stunden (`0` deaktiviert)
      maxAgeHours: 0, // Standard für hartes maximales Alter in Stunden (`0` deaktiviert)
    },
    mainKey: "main", // Legacy (Runtime verwendet immer "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="Details zu Sitzungsfeldern">

- **`scope`**: Basisstrategie zur Sitzungsgruppierung für Gruppenchats.
  - `per-sender` (Standard): Jeder Absender erhält innerhalb eines Kanalkontexts eine isolierte Sitzung.
  - `global`: Alle Teilnehmer in einem Kanalkontext teilen sich eine einzige Sitzung (nur verwenden, wenn gemeinsamer Kontext beabsichtigt ist).
- **`dmScope`**: wie DMs gruppiert werden.
  - `main`: Alle DMs teilen sich die Hauptsitzung.
  - `per-peer`: Isolierung nach Absender-ID über Kanäle hinweg.
  - `per-channel-peer`: Isolierung pro Kanal + Absender (empfohlen für Multi-User-Posteingänge).
  - `per-account-channel-peer`: Isolierung pro Konto + Kanal + Absender (empfohlen für mehrere Konten).
- **`identityLinks`**: ordnet kanonische IDs Provider-präfixierten Peers für kanalübergreifendes Teilen von Sitzungen zu.
- **`reset`**: primäre Reset-Richtlinie. `daily` setzt zur lokalen Zeit `atHour` zurück; `idle` setzt nach `idleMinutes` zurück. Wenn beides konfiguriert ist, gewinnt das zuerst ablaufende.
- **`resetByType`**: Überschreibungen pro Typ (`direct`, `group`, `thread`). Legacy-`dm` wird als Alias für `direct` akzeptiert.
- **`parentForkMaxTokens`**: maximal erlaubte `totalTokens` der Elternsitzung beim Erstellen einer geforkten Thread-Sitzung (Standard `100000`).
  - Wenn `totalTokens` der Elternsitzung über diesem Wert liegt, startet OpenClaw eine frische Thread-Sitzung, statt den Transkriptverlauf der Elternsitzung zu übernehmen.
  - Setzen Sie `0`, um diese Leitplanke zu deaktivieren und das Forken von der Elternsitzung immer zu erlauben.
- **`mainKey`**: Legacy-Feld. Die Runtime verwendet für den Haupt-Bucket für Direktchats immer `"main"`.
- **`agentToAgent.maxPingPongTurns`**: maximale Anzahl Antwort-Turns zwischen Agenten bei Agent-zu-Agent-Austausch (Ganzzahl, Bereich: `0`–`5`). `0` deaktiviert Ping-Pong-Verkettung.
- **`sendPolicy`**: Match über `channel`, `chatType` (`direct|group|channel`, mit Legacy-Alias `dm`), `keyPrefix` oder `rawKeyPrefix`. Das erste Deny gewinnt.
- **`maintenance`**: Bereinigung + Aufbewahrungssteuerung für den Sitzungsspeicher.
  - `mode`: `warn` gibt nur Warnungen aus; `enforce` wendet die Bereinigung an.
  - `pruneAfter`: Altersgrenze für veraltete Einträge (Standard `30d`).
  - `maxEntries`: maximale Anzahl Einträge in `sessions.json` (Standard `500`).
  - `rotateBytes`: rotiert `sessions.json`, wenn diese Größe überschritten wird (Standard `10mb`).
  - `resetArchiveRetention`: Aufbewahrung für `*.reset.<timestamp>`-Transkriptarchive. Standardmäßig `pruneAfter`; auf `false` setzen, um zu deaktivieren.
  - `maxDiskBytes`: optionales Speicherbudget für das Sitzungsverzeichnis. Im Modus `warn` werden Warnungen protokolliert; im Modus `enforce` werden zuerst die ältesten Artefakte/Sitzungen entfernt.
  - `highWaterBytes`: optionales Ziel nach der Budgetbereinigung. Standardmäßig `80%` von `maxDiskBytes`.
- **`threadBindings`**: globale Standards für an Threads gebundene Sitzungsfunktionen.
  - `enabled`: globaler Standardschalter (Provider können überschreiben; Discord verwendet `channels.discord.threadBindings.enabled`)
  - `idleHours`: Standard für automatische Entfokussierung bei Inaktivität in Stunden (`0` deaktiviert; Provider können überschreiben)
  - `maxAgeHours`: Standard für hartes maximales Alter in Stunden (`0` deaktiviert; Provider können überschreiben)

</Accordion>

---

## Nachrichten

```json5
{
  messages: {
    responsePrefix: "🦞", // oder "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "collect", // steer | followup | collect | steer-backlog | steer+backlog | queue | interrupt
      debounceMs: 1000,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "collect",
        telegram: "collect",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 deaktiviert
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### Antwortspräfix

Überschreibungen pro Kanal/Konto: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Auflösung (am spezifischsten gewinnt): Konto → Kanal → global. `""` deaktiviert und stoppt die Kaskade. `"auto"` leitet `[{identity.name}]` ab.

**Template-Variablen:**

| Variable          | Beschreibung          | Beispiel                    |
| ----------------- | --------------------- | --------------------------- |
| `{model}`         | Kurzer Modellname     | `claude-opus-4-6`           |
| `{modelFull}`     | Vollständige Modellkennung | `anthropic/claude-opus-4-6` |
| `{provider}`      | Provider-Name         | `anthropic`                 |
| `{thinkingLevel}` | Aktuelle Thinking-Stufe | `high`, `low`, `off`      |
| `{identity.name}` | Name der Agentenidentität | (gleich wie `"auto"`)   |

Variablen sind nicht case-sensitiv. `{think}` ist ein Alias für `{thinkingLevel}`.

### Bestätigungsreaktion

- Standardmäßig das `identity.emoji` des aktiven Agenten, andernfalls `"👀"`. Setzen Sie `""`, um sie zu deaktivieren.
- Überschreibungen pro Kanal: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Auflösungsreihenfolge: Konto → Kanal → `messages.ackReaction` → Identity-Fallback.
- Scope: `group-mentions` (Standard), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: entfernt die Bestätigungsreaktion nach der Antwort in Slack, Discord und Telegram.
- `messages.statusReactions.enabled`: aktiviert Lifecycle-Statusreaktionen in Slack, Discord und Telegram.
  In Slack und Discord bleiben Statusreaktionen bei nicht gesetztem Wert aktiviert, wenn Bestätigungsreaktionen aktiv sind.
  In Telegram setzen Sie dies explizit auf `true`, um Lifecycle-Statusreaktionen zu aktivieren.

### Debounce für eingehende Nachrichten

Bündelt schnelle reine Textnachrichten desselben Absenders zu einem einzelnen Agenten-Turn. Medien/Anhänge werden sofort geleert. Steuerbefehle umgehen das Debouncing.

### TTS (Text-to-Speech)

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      elevenlabs: {
        apiKey: "elevenlabs_api_key",
        baseUrl: "https://api.elevenlabs.io",
        voiceId: "voice_id",
        modelId: "eleven_multilingual_v2",
        seed: 42,
        applyTextNormalization: "auto",
        languageCode: "en",
        voiceSettings: {
          stability: 0.5,
          similarityBoost: 0.75,
          style: 0.0,
          useSpeakerBoost: true,
          speed: 1.0,
        },
      },
      openai: {
        apiKey: "openai_api_key",
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-4o-mini-tts",
        voice: "alloy",
      },
    },
  },
}
```

- `auto` steuert den Standardmodus für automatisches TTS: `off`, `always`, `inbound` oder `tagged`. `/tts on|off` kann lokale Einstellungen überschreiben, und `/tts status` zeigt den wirksamen Zustand.
- `summaryModel` überschreibt `agents.defaults.model.primary` für die automatische Zusammenfassung.
- `modelOverrides` ist standardmäßig aktiviert; `modelOverrides.allowProvider` ist standardmäßig `false` (Opt-in).
- API-Schlüssel fallen auf `ELEVENLABS_API_KEY`/`XI_API_KEY` und `OPENAI_API_KEY` zurück.
- `openai.baseUrl` überschreibt den OpenAI-TTS-Endpunkt. Auflösungsreihenfolge ist Konfiguration, dann `OPENAI_TTS_BASE_URL`, dann `https://api.openai.com/v1`.
- Wenn `openai.baseUrl` auf einen Nicht-OpenAI-Endpunkt zeigt, behandelt OpenClaw ihn als OpenAI-kompatiblen TTS-Server und lockert die Validierung von Modell/Voice.

---

## Talk

Standards für den Talk-Modus (macOS/iOS/Android).

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        voiceAliases: {
          Clawd: "EXAVITQu4vr4xnSDxMaL",
          Roger: "CwhRBWXzGAHq8TQ4Fs17",
        },
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
    },
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

- `talk.provider` muss mit einem Schlüssel in `talk.providers` übereinstimmen, wenn mehrere Talk-Provider konfiguriert sind.
- Legacy-Talk-Schlüssel in flacher Form (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) sind nur noch aus Kompatibilitätsgründen vorhanden und werden automatisch nach `talk.providers.<provider>` migriert.
- Für Voice-IDs wird auf `ELEVENLABS_VOICE_ID` oder `SAG_VOICE_ID` zurückgefallen.
- `providers.*.apiKey` akzeptiert Klartext-Strings oder SecretRef-Objekte.
- Der Fallback `ELEVENLABS_API_KEY` gilt nur, wenn kein Talk-API-Schlüssel konfiguriert ist.
- `providers.*.voiceAliases` erlaubt, dass Talk-Direktiven benutzerfreundliche Namen verwenden.
- `silenceTimeoutMs` steuert, wie lange der Talk-Modus nach Stille des Benutzers wartet, bevor das Transkript gesendet wird. Wenn nicht gesetzt, bleibt das Standard-Pausenfenster der Plattform erhalten (`700 ms auf macOS und Android, 900 ms auf iOS`).

---

## Tools

### Tool-Profile

`tools.profile` setzt eine Basis-Allowlist vor `tools.allow`/`tools.deny`:

Lokales Onboarding setzt neue lokale Konfigurationen standardmäßig auf `tools.profile: "coding"`, wenn nichts gesetzt ist (vorhandene explizite Profile bleiben erhalten).

| Profil      | Umfasst                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | nur `session_status`                                                                                                            |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                      |
| `full`      | Keine Einschränkung (wie nicht gesetzt)                                                                                         |

### Tool-Gruppen

| Gruppe             | Tools                                                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` wird als Alias für `exec` akzeptiert)                                      |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                  |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                           |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                   |
| `group:ui`         | `browser`, `canvas`                                                                                                     |
| `group:automation` | `cron`, `gateway`                                                                                                       |
| `group:messaging`  | `message`                                                                                                               |
| `group:nodes`      | `nodes`                                                                                                                 |
| `group:agents`     | `agents_list`                                                                                                           |
| `group:media`      | `image`, `image_generate`, `video_generate`, `tts`                                                                      |
| `group:openclaw`   | Alle integrierten Tools (schließt Provider-Plugins aus)                                                                 |

### `tools.allow` / `tools.deny`

Globale Richtlinie zum Zulassen/Verweigern von Tools (Deny gewinnt). Nicht case-sensitiv, unterstützt `*`-Wildcards. Wird auch angewendet, wenn die Docker-Sandbox deaktiviert ist.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

Schränkt Tools für bestimmte Provider oder Modelle weiter ein. Reihenfolge: Basisprofil → Provider-Profil → allow/deny.

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
      "openai/gpt-5.4": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

### `tools.elevated`

Steuert Elevated-Exec-Zugriff außerhalb der Sandbox:

```json5
{
  tools: {
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        discord: ["1234567890123", "987654321098765432"],
      },
    },
  },
}
```

- Überschreibungen pro Agent (`agents.list[].tools.elevated`) können nur weiter einschränken.
- `/elevated on|off|ask|full` speichert den Zustand pro Sitzung; Inline-Direktiven gelten nur für eine einzelne Nachricht.
- Elevated `exec` umgeht die Sandbox und verwendet den konfigurierten Escape-Pfad (`gateway` standardmäßig oder `node`, wenn das Exec-Ziel `node` ist).

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.4"],
      },
    },
  },
}
```

### `tools.loopDetection`

Sicherheitsprüfungen für Tool-Schleifen sind **standardmäßig deaktiviert**. Setzen Sie `enabled: true`, um die Erkennung zu aktivieren.
Einstellungen können global in `tools.loopDetection` definiert und pro Agent unter `agents.list[].tools.loopDetection` überschrieben werden.

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

- `historySize`: maximale Tool-Call-Historie, die für die Schleifenanalyse aufbewahrt wird.
- `warningThreshold`: Schwellenwert für wiederholte Muster ohne Fortschritt, ab dem gewarnt wird.
- `criticalThreshold`: höherer Wiederholungsschwellenwert zum Blockieren kritischer Schleifen.
- `globalCircuitBreakerThreshold`: harter Stoppschwellenwert für jeden Lauf ohne Fortschritt.
- `detectors.genericRepeat`: warnt bei wiederholten Aufrufen desselben Tools mit denselben Argumenten.
- `detectors.knownPollNoProgress`: warnt/blockiert bei bekannten Poll-Tools (`process.poll`, `command_status` usw.).
- `detectors.pingPong`: warnt/blockiert bei alternierenden Paarmustern ohne Fortschritt.
- Wenn `warningThreshold >= criticalThreshold` oder `criticalThreshold >= globalCircuitBreakerThreshold`, schlägt die Validierung fehl.

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // oder BRAVE_API_KEY env
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // optional; weglassen für automatische Erkennung
        maxChars: 50000,
        maxCharsCap: 50000,
        maxResponseBytes: 2000000,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true,
        userAgent: "custom-ua",
      },
    },
  },
}
```

### `tools.media`

Konfiguriert das Verständnis eingehender Medien (Bild/Audio/Video):

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // Opt-in: fertiggestellte asynchrone Musik/Videos direkt an den Kanal senden
      },
      audio: {
        enabled: true,
        maxBytes: 20971520,
        scope: {
          default: "deny",
          rules: [{ action: "allow", match: { chatType: "direct" } }],
        },
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] },
        ],
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },
}
```

<Accordion title="Felder für Medieneinträge von Modellen">

**Provider-Eintrag** (`type: "provider"` oder weggelassen):

- `provider`: API-Provider-ID (`openai`, `anthropic`, `google`/`gemini`, `groq` usw.)
- `model`: Überschreibung der Modell-ID
- `profile` / `preferredProfile`: Auswahl des Profils aus `auth-profiles.json`

**CLI-Eintrag** (`type: "cli"`):

- `command`: auszuführende ausführbare Datei
- `args`: templatisierte Argumente (unterstützt `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` usw.)

**Gemeinsame Felder:**

- `capabilities`: optionale Liste (`image`, `audio`, `video`). Standardwerte: `openai`/`anthropic`/`minimax` → image, `google` → image+audio+video, `groq` → audio.
- `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: Überschreibungen pro Eintrag.
- Bei Fehlern wird auf den nächsten Eintrag zurückgefallen.

Die Provider-Authentifizierung folgt der Standardreihenfolge: `auth-profiles.json` → Env-Variablen → `models.providers.*.apiKey`.

**Felder für asynchronen Abschluss:**

- `asyncCompletion.directSend`: wenn `true`, versuchen abgeschlossene asynchrone Aufgaben von `music_generate`
  und `video_generate` zuerst die direkte Kanalauslieferung. Standard: `false`
  (Legacy-Pfad für das Aufwecken der anfordernden Sitzung/Modellauslieferung).

</Accordion>

### `tools.agentToAgent`

```json5
{
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },
}
```

### `tools.sessions`

Steuert, welche Sitzungen mit den Sitzungstools (`sessions_list`, `sessions_history`, `sessions_send`) angesprochen werden können.

Standard: `tree` (aktuelle Sitzung + von ihr gestartete Sitzungen, wie Subagenten).

```json5
{
  tools: {
    sessions: {
      // "self" | "tree" | "agent" | "all"
      visibility: "tree",
    },
  },
}
```

Hinweise:

- `self`: nur der aktuelle Sitzungsschlüssel.
- `tree`: aktuelle Sitzung + von der aktuellen Sitzung gestartete Sitzungen (Subagenten).
- `agent`: jede Sitzung, die zur aktuellen Agent-ID gehört (kann andere Benutzer einschließen, wenn Sie Per-Sender-Sitzungen unter derselben Agent-ID ausführen).
- `all`: jede Sitzung. Kanalübergreifendes Targeting zwischen Agenten erfordert weiterhin `tools.agentToAgent`.
- Sandbox-Clamp: Wenn die aktuelle Sitzung in einer Sandbox läuft und `agents.defaults.sandbox.sessionToolsVisibility="spawned"` gesetzt ist, wird die Sichtbarkeit auf `tree` erzwungen, selbst wenn `tools.sessions.visibility="all"` ist.

### `tools.sessions_spawn`

Steuert die Unterstützung für Inline-Anhänge bei `sessions_spawn`.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // Opt-in: auf true setzen, um Inline-Dateianhänge zu erlauben
        maxTotalBytes: 5242880, // 5 MB insgesamt über alle Dateien
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB pro Datei
        retainOnSessionKeep: false, // Anhänge beibehalten, wenn cleanup="keep"
      },
    },
  },
}
```

Hinweise:

- Anhänge werden nur für `runtime: "subagent"` unterstützt. Die ACP-Runtime lehnt sie ab.
- Dateien werden im Child-Workspace unter `.openclaw/attachments/<uuid>/` mit einer `.manifest.json` materialisiert.
- Anhangsinhalte werden automatisch aus der Transkriptpersistenz redigiert.
- Base64-Eingaben werden mit strikten Prüfungen von Alphabet/Padding und einer Größenleitplanke vor dem Dekodieren validiert.
- Dateiberechtigungen sind `0700` für Verzeichnisse und `0600` für Dateien.
- Die Bereinigung folgt der Richtlinie `cleanup`: `delete` entfernt Anhänge immer; `keep` behält sie nur bei, wenn `retainOnSessionKeep: true`.

### `tools.experimental`

Experimentelle integrierte Tool-Flags. Standardmäßig deaktiviert, sofern keine Auto-Aktivierungsregel für strict-agentic GPT-5 greift.

```json5
{
  tools: {
    experimental: {
      planTool: true, // experimentelles update_plan aktivieren
    },
  },
}
```

Hinweise:

- `planTool`: aktiviert das strukturierte Tool `update_plan` für die Nachverfolgung nichttrivialer mehrstufiger Arbeit.
- Standard: `false`, außer wenn `agents.defaults.embeddedPi.executionContract` (oder eine Überschreibung pro Agent) für einen OpenAI- oder OpenAI-Codex-GPT-5-Familienlauf auf `"strict-agentic"` gesetzt ist. Setzen Sie `true`, um das Tool außerhalb dieses Bereichs zu erzwingen, oder `false`, um es selbst für strict-agentic-GPT-5-Läufe deaktiviert zu halten.
- Wenn aktiviert, fügt der System-Prompt außerdem Nutzungshinweise hinzu, damit das Modell es nur für umfangreichere Arbeit verwendet und höchstens einen Schritt `in_progress` hält.

### `agents.defaults.subagents`

```json5
{
  agents: {
    defaults: {
      subagents: {
        allowAgents: ["research"],
        model: "minimax/MiniMax-M2.7",
        maxConcurrent: 8,
        runTimeoutSeconds: 900,
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model`: Standardmodell für gestartete Subagenten. Wenn weggelassen, übernehmen Subagenten das Modell des Aufrufers.
- `allowAgents`: Standard-Allowlist von Ziel-Agent-IDs für `sessions_spawn`, wenn der anfordernde Agent keine eigene `subagents.allowAgents` setzt (`["*"]` = beliebig; Standard: nur derselbe Agent).
- `runTimeoutSeconds`: Standard-Timeout (Sekunden) für `sessions_spawn`, wenn der Tool-Aufruf `runTimeoutSeconds` weglässt. `0` bedeutet kein Timeout.
- Tool-Richtlinie pro Subagent: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Benutzerdefinierte Provider und Base-URLs

OpenClaw verwendet den integrierten Modellkatalog. Fügen Sie benutzerdefinierte Provider über `models.providers` in der Konfiguration oder `~/.openclaw/agents/<agentId>/agent/models.json` hinzu.

```json5
{
  models: {
    mode: "merge", // merge (Standard) | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            contextTokens: 96000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

- Verwenden Sie `authHeader: true` + `headers` für benutzerdefinierte Authentifizierungsanforderungen.
- Überschreiben Sie das Agent-Konfigurations-Root mit `OPENCLAW_AGENT_DIR` (oder `PI_CODING_AGENT_DIR`, einem Legacy-Alias für die Umgebungsvariable).
- Merge-Priorität für übereinstimmende Provider-IDs:
  - Nicht leere `baseUrl`-Werte aus der Agent-`models.json` haben Vorrang.
  - Nicht leere Agent-`apiKey`-Werte haben nur dann Vorrang, wenn dieser Provider im aktuellen Kontext von Konfiguration/Auth-Profil nicht SecretRef-verwaltet ist.
  - SecretRef-verwaltete Provider-`apiKey`-Werte werden aus Quellmarkern aktualisiert (`ENV_VAR_NAME` für Env-Referenzen, `secretref-managed` für file/exec-Referenzen), statt aufgelöste Secrets zu persistieren.
  - SecretRef-verwaltete Header-Werte des Providers werden aus Quellmarkern aktualisiert (`secretref-env:ENV_VAR_NAME` für Env-Referenzen, `secretref-managed` für file/exec-Referenzen).
  - Leere oder fehlende Agent-`apiKey`/`baseUrl` fallen auf `models.providers` in der Konfiguration zurück.
  - Übereinstimmende `contextWindow`/`maxTokens` eines Modells verwenden den höheren Wert zwischen expliziter Konfiguration und impliziten Katalogwerten.
  - Übereinstimmende `contextTokens` eines Modells behalten ein explizites Laufzeitlimit bei, wenn vorhanden; verwenden Sie dies, um den effektiven Kontext zu begrenzen, ohne native Modellmetadaten zu ändern.
  - Verwenden Sie `models.mode: "replace"`, wenn die Konfiguration `models.json` vollständig neu schreiben soll.
  - Marker-Persistenz ist quellenautoritativ: Marker werden aus dem aktiven Quellkonfigurations-Snapshot (vor der Auflösung) geschrieben, nicht aus aufgelösten Laufzeit-Secret-Werten.

### Details zu Provider-Feldern

- `models.mode`: Verhalten des Provider-Katalogs (`merge` oder `replace`).
- `models.providers`: benutzerdefinierte Provider-Zuordnung, verschlüsselt nach Provider-ID.
- `models.providers.*.api`: Request-Adapter (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai` usw.).
- `models.providers.*.apiKey`: Provider-Zugangsdaten (bevorzugt SecretRef/Env-Substitution).
- `models.providers.*.auth`: Authentifizierungsstrategie (`api-key`, `token`, `oauth`, `aws-sdk`).
- `models.providers.*.injectNumCtxForOpenAICompat`: für Ollama + `openai-completions`, `options.num_ctx` in Requests einfügen (Standard: `true`).
- `models.providers.*.authHeader`: erzwingt bei Bedarf die Übertragung von Zugangsdaten im Header `Authorization`.
- `models.providers.*.baseUrl`: Base-URL der Upstream-API.
- `models.providers.*.headers`: zusätzliche statische Header für Proxy-/Mandanten-Routing.
- `models.providers.*.request`: Transport-Überschreibungen für HTTP-Requests des Modell-Providers.
  - `request.headers`: zusätzliche Header (werden mit den Standardwerten des Providers zusammengeführt). Werte akzeptieren SecretRef.
  - `request.auth`: Überschreibung der Authentifizierungsstrategie. Modi: `"provider-default"` (integrierte Authentifizierung des Providers verwenden), `"authorization-bearer"` (mit `token`), `"header"` (mit `headerName`, `value`, optional `prefix`).
  - `request.proxy`: Überschreibung des HTTP-Proxys. Modi: `"env-proxy"` (Env-Variablen `HTTP_PROXY`/`HTTPS_PROXY` verwenden), `"explicit-proxy"` (mit `url`). Beide Modi akzeptieren ein optionales Unterobjekt `tls`.
  - `request.tls`: TLS-Überschreibung für direkte Verbindungen. Felder: `ca`, `cert`, `key`, `passphrase` (alle akzeptieren SecretRef), `serverName`, `insecureSkipVerify`.
  - `request.allowPrivateNetwork`: wenn `true`, HTTPS zu `baseUrl` zulassen, wenn DNS auf private, CGNAT- oder ähnliche Bereiche auflöst, über die HTTP-Fetch-Leitplanke des Providers (Operator-Opt-in für vertrauenswürdige selbstgehostete OpenAI-kompatible Endpunkte). WebSocket verwendet denselben `request` für Header/TLS, aber nicht diese Fetch-SSRF-Leitplanke. Standard `false`.
- `models.providers.*.models`: explizite Katalogeinträge für Provider-Modelle.
- `models.providers.*.models.*.contextWindow`: Metadaten zum nativen Kontextfenster des Modells.
- `models.providers.*.models.*.contextTokens`: optionales Laufzeit-Kontextlimit. Verwenden Sie dies, wenn Sie ein kleineres effektives Kontextbudget als das native `contextWindow` des Modells möchten.
- `models.providers.*.models.*.compat.supportsDeveloperRole`: optionaler Kompatibilitätshinweis. Für `api: "openai-completions"` mit einer nicht leeren, nicht nativen `baseUrl` (Host nicht `api.openai.com`) erzwingt OpenClaw dies zur Laufzeit auf `false`. Leere/weggelassene `baseUrl` behält das Standardverhalten von OpenAI bei.
- `models.providers.*.models.*.compat.requiresStringContent`: optionaler Kompatibilitätshinweis für OpenAI-kompatible Chat-Endpunkte, die nur Strings unterstützen. Wenn `true`, glättet OpenClaw reine Text-Arrays in `messages[].content` zu einfachen Strings, bevor der Request gesendet wird.
- `plugins.entries.amazon-bedrock.config.discovery`: Root der Bedrock-Einstellungen für Auto-Discovery.
- `plugins.entries.amazon-bedrock.config.discovery.enabled`: implizite Discovery ein-/ausschalten.
- `plugins.entries.amazon-bedrock.config.discovery.region`: AWS-Region für Discovery.
- `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: optionaler Filter nach Provider-ID für gezielte Discovery.
- `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: Polling-Intervall für die Aktualisierung der Discovery.
- `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: Fallback-Kontextfenster für erkannte Modelle.
- `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: Fallback für maximale Ausgabetoken für erkannte Modelle.

### Provider-Beispiele

<Accordion title="Cerebras (GLM 4.6 / 4.7)">

```json5
{
  env: { CEREBRAS_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: {
        primary: "cerebras/zai-glm-4.7",
        fallbacks: ["cerebras/zai-glm-4.6"],
      },
      models: {
        "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
        "cerebras/zai-glm-4.6": { alias: "GLM 4.6 (Cerebras)" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      cerebras: {
        baseUrl: "https://api.cerebras.ai/v1",
        apiKey: "${CEREBRAS_API_KEY}",
        api: "openai-completions",
        models: [
          { id: "zai-glm-4.7", name: "GLM 4.7 (Cerebras)" },
          { id: "zai-glm-4.6", name: "GLM 4.6 (Cerebras)" },
        ],
      },
    },
  },
}
```

Verwenden Sie `cerebras/zai-glm-4.7` für Cerebras; `zai/glm-4.7` für Z.AI direkt.

</Accordion>

<Accordion title="OpenCode">

```json5
{
  agents: {
    defaults: {
      model: { primary: "opencode/claude-opus-4-6" },
      models: { "opencode/claude-opus-4-6": { alias: "Opus" } },
    },
  },
}
```

Setzen Sie `OPENCODE_API_KEY` (oder `OPENCODE_ZEN_API_KEY`). Verwenden Sie `opencode/...`-Referenzen für den Zen-Katalog oder `opencode-go/...`-Referenzen für den Go-Katalog. Shortcut: `openclaw onboard --auth-choice opencode-zen` oder `openclaw onboard --auth-choice opencode-go`.

</Accordion>

<Accordion title="Z.AI (GLM-4.7)">

```json5
{
  agents: {
    defaults: {
      model: { primary: "zai/glm-4.7" },
      models: { "zai/glm-4.7": {} },
    },
  },
}
```

Setzen Sie `ZAI_API_KEY`. `z.ai/*` und `z-ai/*` sind akzeptierte Aliasse. Shortcut: `openclaw onboard --auth-choice zai-api-key`.

- Allgemeiner Endpunkt: `https://api.z.ai/api/paas/v4`
- Coding-Endpunkt (Standard): `https://api.z.ai/api/coding/paas/v4`
- Für den allgemeinen Endpunkt definieren Sie einen benutzerdefinierten Provider mit Überschreibung der Base-URL.

</Accordion>

<Accordion title="Moonshot AI (Kimi)">

```json5
{
  env: { MOONSHOT_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "moonshot/kimi-k2.5" },
      models: { "moonshot/kimi-k2.5": { alias: "Kimi K2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "kimi-k2.5",
            name: "Kimi K2.5",
            reasoning: false,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 262144,
          },
        ],
      },
    },
  },
}
```

Für den China-Endpunkt: `baseUrl: "https://api.moonshot.cn/v1"` oder `openclaw onboard --auth-choice moonshot-api-key-cn`.

Native Moonshot-Endpunkte geben Streaming-Nutzungskompatibilität für den gemeinsamen
Transport `openai-completions` an, und OpenClaw richtet sich dabei nach den Fähigkeiten des Endpunkts
statt allein nach der integrierten Provider-ID.

</Accordion>

<Accordion title="Kimi Coding">

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "kimi/kimi-code" },
      models: { "kimi/kimi-code": { alias: "Kimi Code" } },
    },
  },
}
```

Anthropic-kompatibel, integrierter Provider. Shortcut: `openclaw onboard --auth-choice kimi-code-api-key`.

</Accordion>

<Accordion title="Synthetic (Anthropic-kompatibel)">

```json5
{
  env: { SYNTHETIC_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
      models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "hf:MiniMaxAI/MiniMax-M2.5",
            name: "MiniMax M2.5",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 192000,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

Die Base-URL sollte `/v1` weglassen (der Anthropic-Client hängt es an). Shortcut: `openclaw onboard --auth-choice synthetic-api-key`.

</Accordion>

<Accordion title="MiniMax M2.7 (direkt)">

```json5
{
  agents: {
    defaults: {
      model: { primary: "minimax/MiniMax-M2.7" },
      models: {
        "minimax/MiniMax-M2.7": { alias: "Minimax" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      minimax: {
        baseUrl: "https://api.minimax.io/anthropic",
        apiKey: "${MINIMAX_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "MiniMax-M2.7",
            name: "MiniMax M2.7",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
            contextWindow: 204800,
            maxTokens: 131072,
          },
        ],
      },
    },
  },
}
```

Setzen Sie `MINIMAX_API_KEY`. Shortcuts:
`openclaw onboard --auth-choice minimax-global-api` oder
`openclaw onboard --auth-choice minimax-cn-api`.
Der Modellkatalog verwendet standardmäßig nur M2.7.
Auf dem Anthropic-kompatiblen Streaming-Pfad deaktiviert OpenClaw MiniMax-Thinking
standardmäßig, sofern Sie `thinking` nicht ausdrücklich selbst setzen. `/fast on` oder
`params.fastMode: true` schreibt `MiniMax-M2.7` zu
`MiniMax-M2.7-highspeed` um.

</Accordion>

<Accordion title="Lokale Modelle (LM Studio)">

Siehe [Lokale Modelle](/de/gateway/local-models). Kurzfassung: Führen Sie auf leistungsfähiger Hardware ein großes lokales Modell über die LM Studio Responses API aus; behalten Sie gehostete Modelle für den Fallback zusammengeführt.

</Accordion>

---

## Skills

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
    },
    entries: {
      "image-lab": {
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // oder Klartext-String
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: optionale Allowlist nur für gebündelte Skills (verwaltete/Workspace-Skills bleiben unberührt).
- `load.extraDirs`: zusätzliche gemeinsame Skill-Roots (niedrigste Priorität).
- `install.preferBrew`: wenn true, Homebrew-Installer bevorzugen, wenn `brew`
  verfügbar ist, bevor auf andere Installer-Arten zurückgefallen wird.
- `install.nodeManager`: Präferenz für den Node-Installer bei `metadata.openclaw.install`-
  Spezifikationen (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` deaktiviert einen Skill auch dann, wenn er gebündelt/installiert ist.
- `entries.<skillKey>.apiKey`: Komfortfeld für Skills, die eine primäre Env-Variable deklarieren (Klartext-String oder SecretRef-Objekt).

---

## Plugins

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-extension"],
    },
    entries: {
      "voice-call": {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
        config: { provider: "twilio" },
      },
    },
  },
}
```

- Geladen aus `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions` sowie `plugins.load.paths`.
- Discovery akzeptiert native OpenClaw-Plugins sowie kompatible Codex-Bundles und Claude-Bundles, einschließlich manifestloser Claude-Bundles im Standardlayout.
- **Konfigurationsänderungen erfordern einen Gateway-Neustart.**
- `allow`: optionale Allowlist (nur aufgelistete Plugins werden geladen). `deny` gewinnt.
- `plugins.entries.<id>.apiKey`: Komfortfeld für API-Schlüssel auf Plugin-Ebene (wenn vom Plugin unterstützt).
- `plugins.entries.<id>.env`: Plugin-spezifische Env-Variablenzuordnung.
- `plugins.entries.<id>.hooks.allowPromptInjection`: wenn `false`, blockiert der Core `before_prompt_build` und ignoriert Prompt-mutierende Felder aus Legacy-`before_agent_start`, während Legacy-`modelOverride` und `providerOverride` erhalten bleiben. Gilt für native Plugin-Hooks und unterstützte von Bundles bereitgestellte Hook-Verzeichnisse.
- `plugins.entries.<id>.subagent.allowModelOverride`: diesem Plugin explizit vertrauen, dass es pro Lauf Überschreibungen für `provider` und `model` für Hintergrund-Subagent-Läufe anfordern darf.
- `plugins.entries.<id>.subagent.allowedModels`: optionale Allowlist kanonischer Ziele vom Typ `provider/model` für vertrauenswürdige Subagent-Überschreibungen. Verwenden Sie `"*"` nur, wenn Sie absichtlich jedes Modell zulassen möchten.
- `plugins.entries.<id>.config`: Plugin-definiertes Konfigurationsobjekt (validiert durch das native OpenClaw-Plugin-Schema, wenn verfügbar).
- `plugins.entries.firecrawl.config.webFetch`: Firecrawl-Einstellungen für den Web-Fetch-Provider.
  - `apiKey`: Firecrawl-API-Schlüssel (akzeptiert SecretRef). Fällt zurück auf `plugins.entries.firecrawl.config.webSearch.apiKey`, Legacy-`tools.web.fetch.firecrawl.apiKey` oder die Env-Variable `FIRECRAWL_API_KEY`.
  - `baseUrl`: Base-URL der Firecrawl-API (Standard: `https://api.firecrawl.dev`).
  - `onlyMainContent`: nur den Hauptinhalt von Seiten extrahieren (Standard: `true`).
  - `maxAgeMs`: maximales Cache-Alter in Millisekunden (Standard: `172800000` / 2 Tage).
  - `timeoutSeconds`: Timeout für Scrape-Requests in Sekunden (Standard: `60`).
- `plugins.entries.xai.config.xSearch`: Einstellungen für xAI X Search (Grok-Websuche).
  - `enabled`: den X-Search-Provider aktivieren.
  - `model`: Grok-Modell, das für die Suche verwendet werden soll (z. B. `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: Einstellungen für Memory Dreaming. Siehe [Dreaming](/de/concepts/dreaming) für Phasen und Schwellenwerte.
  - `enabled`: globaler Schalter für Dreaming (Standard `false`).
  - `frequency`: Cron-Kadenz für jeden vollständigen Dreaming-Durchlauf (standardmäßig `"0 3 * * *"`).
  - Phasenrichtlinie und Schwellenwerte sind Implementierungsdetails (keine benutzerseitigen Konfigurationsschlüssel).
- Die vollständige Speicherkonfiguration befindet sich in der [Speicherkonfigurationsreferenz](/de/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Aktivierte Claude-Bundle-Plugins können auch eingebettete Pi-Standards aus `settings.json` beitragen; OpenClaw wendet diese als bereinigte Agenteneinstellungen an, nicht als rohe OpenClaw-Konfigurations-Patches.
- `plugins.slots.memory`: aktive Memory-Plugin-ID auswählen oder `"none"` setzen, um Memory-Plugins zu deaktivieren.
- `plugins.slots.contextEngine`: aktive Context-Engine-Plugin-ID auswählen; standardmäßig `"legacy"`, sofern Sie keine andere Engine installieren und auswählen.
- `plugins.installs`: von der CLI verwaltete Installationsmetadaten, die von `openclaw plugins update` verwendet werden.
  - Enthält `source`, `spec`, `sourcePath`, `installPath`, `version`, `resolvedName`, `resolvedVersion`, `resolvedSpec`, `integrity`, `shasum`, `resolvedAt`, `installedAt`.
  - Behandeln Sie `plugins.installs.*` als verwalteten Zustand; bevorzugen Sie CLI-Befehle gegenüber manuellen Änderungen.

Siehe [Plugins](/de/tools/plugin).

---

## Browser

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // nur für vertrauenswürdigen Zugriff auf private Netzwerke aktivieren
      // allowPrivateNetwork: true, // Legacy-Alias
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
      user: { driver: "existing-session", attachOnly: true, color: "#00AA00" },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
    color: "#FF4500",
    // headless: false,
    // noSandbox: false,
    // extraArgs: [],
    // executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // attachOnly: false,
  },
}
```

- `evaluateEnabled: false` deaktiviert `act:evaluate` und `wait --fn`.
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` ist deaktiviert, wenn nicht gesetzt, sodass Browser-Navigation standardmäßig strikt bleibt.
- Setzen Sie `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` nur, wenn Sie Browser-Navigation in private Netzwerke bewusst vertrauen.
- Im strikten Modus unterliegen Remote-CDP-Profilendpunkte (`profiles.*.cdpUrl`) bei Erreichbarkeits-/Discovery-Prüfungen derselben Blockierung privater Netzwerke.
- `ssrfPolicy.allowPrivateNetwork` wird weiterhin als Legacy-Alias unterstützt.
- Im strikten Modus verwenden Sie `ssrfPolicy.hostnameAllowlist` und `ssrfPolicy.allowedHostnames` für explizite Ausnahmen.
- Remote-Profile sind nur zum Anhängen gedacht (Start/Stopp/Reset deaktiviert).
- `profiles.*.cdpUrl` akzeptiert `http://`, `https://`, `ws://` und `wss://`.
  Verwenden Sie HTTP(S), wenn OpenClaw `/json/version` erkennen soll; verwenden Sie WS(S),
  wenn Ihr Provider Ihnen eine direkte DevTools-WebSocket-URL gibt.
- `existing-session`-Profile sind nur für den Host und verwenden Chrome MCP statt CDP.
- `existing-session`-Profile können `userDataDir` setzen, um ein bestimmtes
  Profil eines Chromium-basierten Browsers wie Brave oder Edge anzusteuern.
- `existing-session`-Profile behalten die aktuellen Routenbeschränkungen von Chrome MCP bei:
  Snapshot-/Ref-basierte Aktionen statt CSS-Selektor-Targeting, Hooks für Datei-Uploads mit nur einer Datei, keine Dialog-Timeout-Überschreibungen, kein `wait --load networkidle` und kein
  `responsebody`, PDF-Export, Download-Abfangen oder Batch-Aktionen.
- Lokal verwaltete `openclaw`-Profile weisen `cdpPort` und `cdpUrl` automatisch zu; setzen Sie
  `cdpUrl` nur explizit für Remote-CDP.
- Reihenfolge der automatischen Erkennung: Standardbrowser, falls Chromium-basiert → Chrome → Brave → Edge → Chromium → Chrome Canary.
- Control-Service: nur loopback (Port abgeleitet von `gateway.port`, Standard `18791`).
- `extraArgs` hängt zusätzliche Start-Flags an den lokalen Chromium-Start an (zum Beispiel
  `--disable-gpu`, Fenstergröße oder Debug-Flags).

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // Emoji, kurzer Text, Bild-URL oder data-URI
    },
  },
}
```

- `seamColor`: Akzentfarbe für den UI-Chrome der nativen App (Talk-Mode-Blasentönung usw.).
- `assistant`: Überschreibung der Identität in der Control UI. Fällt auf die Identität des aktiven Agenten zurück.

---

## Gateway

```json5
{
  gateway: {
    mode: "local", // local | remote
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // none | token | password | trusted-proxy
      token: "your-token",
      // password: "your-password", // oder OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // für mode=trusted-proxy; siehe /gateway/trusted-proxy-auth
      allowTailscale: true,
      rateLimit: {
        maxAttempts: 10,
        windowMs: 60000,
        lockoutMs: 300000,
        exemptLoopback: true,
      },
    },
    tailscale: {
      mode: "off", // off | serve | funnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // embedSandbox: "scripts", // strict | scripts | trusted
      // allowExternalEmbedUrls: false, // gefährlich: absolute externe http(s)-Embed-URLs zulassen
      // allowedOrigins: ["https://control.example.com"], // erforderlich für nicht-loopback Control UI
      // dangerouslyAllowHostHeaderOriginFallback: false, // gefährlicher Origin-Fallback-Modus über Host-Header
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    remote: {
      url: "ws://gateway.tailnet:18789",
      transport: "ssh", // ssh | direct
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // Optional. Standard false.
    allowRealIpFallback: false,
    tools: {
      // Zusätzliche HTTP-Denies für /tools/invoke
      deny: ["browser"],
      // Tools aus der Standard-HTTP-Deny-Liste entfernen
      allow: ["gateway"],
    },
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
          timeoutMs: 10000,
        },
      },
    },
  },
}
```

<Accordion title="Details zu Gateway-Feldern">

- `mode`: `local` (Gateway ausführen) oder `remote` (mit Remote-Gateway verbinden). Das Gateway verweigert den Start, sofern nicht `local` gesetzt ist.
- `port`: einzelner multiplexter Port für WS + HTTP. Priorität: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (Standard), `lan` (`0.0.0.0`), `tailnet` (nur Tailscale-IP) oder `custom`.
- **Legacy-Bind-Aliasse**: Verwenden Sie Bind-Modus-Werte in `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), nicht Host-Aliasse (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Docker-Hinweis**: Der Standard-Bind `loopback` lauscht innerhalb des Containers auf `127.0.0.1`. Bei Docker-Bridge-Networking (`-p 18789:18789`) trifft der Verkehr auf `eth0` ein, sodass das Gateway nicht erreichbar ist. Verwenden Sie `--network host` oder setzen Sie `bind: "lan"` (oder `bind: "custom"` mit `customBindHost: "0.0.0.0"`), um auf allen Interfaces zu lauschen.
- **Auth**: standardmäßig erforderlich. Nicht-Loopback-Binds erfordern Gateway-Authentifizierung. In der Praxis bedeutet das ein gemeinsames Token/Passwort oder einen identitätsbewussten Reverse-Proxy mit `gateway.auth.mode: "trusted-proxy"`. Der Onboarding-Assistent erzeugt standardmäßig ein Token.
- Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind (einschließlich SecretRefs), setzen Sie `gateway.auth.mode` explizit auf `token` oder `password`. Start- sowie Service-Installations-/Reparaturabläufe schlagen fehl, wenn beide konfiguriert sind und `mode` nicht gesetzt ist.
- `gateway.auth.mode: "none"`: expliziter Modus ohne Authentifizierung. Nur für vertrauenswürdige lokale local loopback-Setups verwenden; dies wird absichtlich nicht in den Onboarding-Prompts angeboten.
- `gateway.auth.mode: "trusted-proxy"`: delegiert die Authentifizierung an einen identitätsbewussten Reverse-Proxy und vertraut Identitäts-Headern aus `gateway.trustedProxies` (siehe [Trusted Proxy Auth](/de/gateway/trusted-proxy-auth)). Dieser Modus erwartet eine **nicht-loopback** Proxy-Quelle; gleichartige Loopback-Reverse-Proxys auf demselben Host erfüllen die trusted-proxy-Authentifizierung nicht.
- `gateway.auth.allowTailscale`: wenn `true`, können Tailscale-Serve-Identitäts-Header die Authentifizierung für Control UI/WebSocket erfüllen (verifiziert über `tailscale whois`). HTTP-API-Endpunkte verwenden **nicht** diese Tailscale-Header-Authentifizierung; sie folgen stattdessen dem normalen HTTP-Authentifizierungsmodus des Gateways. Dieser tokenlose Ablauf setzt voraus, dass dem Gateway-Host vertraut wird. Standardmäßig `true`, wenn `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: optionaler Limiter für fehlgeschlagene Authentifizierung. Gilt pro Client-IP und pro Authentifizierungsbereich (Shared Secret und Device Token werden unabhängig verfolgt). Blockierte Versuche geben `429` + `Retry-After` zurück.
  - Auf dem asynchronen Tailscale-Serve-Control-UI-Pfad werden fehlgeschlagene Versuche für dieselbe `{scope, clientIp}` vor dem Schreiben des Fehlers serialisiert. Gleichzeitige fehlerhafte Versuche desselben Clients können daher den Limiter bereits beim zweiten Request auslösen, statt dass beide als einfache Nichtübereinstimmungen durchrutschen.
  - `gateway.auth.rateLimit.exemptLoopback` ist standardmäßig `true`; setzen Sie `false`, wenn Sie absichtlich auch localhost-Verkehr ratenbegrenzt haben möchten (für Test-Setups oder strikte Proxy-Deployments).
- Browserseitige WS-Authentifizierungsversuche werden immer gedrosselt, wobei die Loopback-Ausnahme deaktiviert ist (Defense-in-Depth gegen browserbasierte Brute-Force-Angriffe auf localhost).
- Auf loopback werden diese Sperren für browserseitige Ursprünge pro normalisiertem `Origin`-
  Wert isoliert, sodass wiederholte Fehlschläge von einem localhost-Origin nicht automatisch
  ein anderes Origin aussperren.
- `tailscale.mode`: `serve` (nur Tailnet, Loopback-Bind) oder `funnel` (öffentlich, erfordert Auth).
- `controlUi.allowedOrigins`: explizite Browser-Origin-Allowlist für Gateway-WebSocket-Verbindungen. Erforderlich, wenn Browser-Clients von Nicht-Loopback-Origins erwartet werden.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: gefährlicher Modus, der Host-Header-Origin-Fallback für Deployments aktiviert, die absichtlich auf einer Host-Header-Origin-Richtlinie beruhen.
- `remote.transport`: `ssh` (Standard) oder `direct` (ws/wss). Für `direct` muss `remote.url` `ws://` oder `wss://` sein.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: clientseitige Break-Glass-Überschreibung, die unverschlüsseltes `ws://` zu vertrauenswürdigen privaten Netzwerk-IPs erlaubt; Standard bleibt unverschlüsseltes Loopback-only.
- `gateway.remote.token` / `.password` sind Zugangsdatenfelder für Remote-Clients. Sie konfigurieren die Gateway-Authentifizierung nicht selbst.
- `gateway.push.apns.relay.baseUrl`: Basis-HTTPS-URL für das externe APNs-Relay, das von offiziellen/TestFlight-iOS-Builds verwendet wird, nachdem diese relay-gestützte Registrierungen an das Gateway veröffentlicht haben. Diese URL muss mit der in den iOS-Build kompilierten Relay-URL übereinstimmen.
- `gateway.push.apns.relay.timeoutMs`: Timeout in Millisekunden für das Senden vom Gateway an das Relay. Standardmäßig `10000`.
- Relay-gestützte Registrierungen werden an eine bestimmte Gateway-Identität delegiert. Die gekoppelte iOS-App ruft `gateway.identity.get` ab, schließt diese Identität in die Relay-Registrierung ein und leitet dem Gateway eine registrierungsbezogene Sendeberechtigung weiter. Ein anderes Gateway kann diese gespeicherte Registrierung nicht wiederverwenden.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: temporäre Env-Überschreibungen für die obige Relay-Konfiguration.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: nur für Entwicklung vorgesehene Escape-Hatch für Loopback-HTTP-Relay-URLs. Produktions-Relay-URLs sollten HTTPS verwenden.
- `gateway.channelHealthCheckMinutes`: Intervall des Kanal-Health-Monitors in Minuten. Setzen Sie `0`, um Neustarts durch den Health-Monitor global zu deaktivieren. Standard: `5`.
- `gateway.channelStaleEventThresholdMinutes`: Schwellenwert für veraltete Sockets in Minuten. Halten Sie diesen Wert größer oder gleich `gateway.channelHealthCheckMinutes`. Standard: `30`.
- `gateway.channelMaxRestartsPerHour`: maximale Anzahl von Health-Monitor-Neustarts pro Kanal/Konto innerhalb einer rollierenden Stunde. Standard: `10`.
- `channels.<provider>.healthMonitor.enabled`: kanalbezogenes Opt-out für Health-Monitor-Neustarts, während der globale Monitor aktiviert bleibt.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: Überschreibung pro Konto für Kanäle mit mehreren Konten. Wenn gesetzt, hat sie Vorrang vor der Überschreibung auf Kanalebene.
- Lokale Gateway-Aufrufpfade können `gateway.remote.*` nur dann als Fallback verwenden, wenn `gateway.auth.*` nicht gesetzt ist.
- Wenn `gateway.auth.token` / `gateway.auth.password` explizit über SecretRef konfiguriert und nicht auflösbar sind, schlägt die Auflösung fail-closed fehl (keine maskierende Remote-Fallback-Logik).
- `trustedProxies`: Reverse-Proxy-IPs, die TLS terminieren oder Header mit weitergeleiteten Client-Informationen einfügen. Listen Sie nur Proxys auf, die Sie kontrollieren. Loopback-Einträge sind weiterhin für Setups mit Proxy auf demselben Host/lokaler Erkennung gültig (zum Beispiel Tailscale Serve oder ein lokaler Reverse-Proxy), aber sie machen Loopback-Requests **nicht** für `gateway.auth.mode: "trusted-proxy"` zulässig.
- `allowRealIpFallback`: wenn `true`, akzeptiert das Gateway `X-Real-IP`, falls `X-Forwarded-For` fehlt. Standard `false` für fail-closed-Verhalten.
- `gateway.tools.deny`: zusätzliche Tool-Namen, die für HTTP `POST /tools/invoke` blockiert werden (erweitert die Standard-Deny-Liste).
- `gateway.tools.allow`: entfernt Tool-Namen aus der Standard-HTTP-Deny-Liste.

</Accordion>

### OpenAI-kompatible Endpunkte

- Chat Completions: standardmäßig deaktiviert. Aktivieren mit `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Härtung von URL-Eingaben für Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Leere Allowlists werden als nicht gesetzt behandelt; verwenden Sie `gateway.http.endpoints.responses.files.allowUrl=false`
    und/oder `gateway.http.endpoints.responses.images.allowUrl=false`, um URL-Fetching zu deaktivieren.
- Optionaler Header zur Härtung von Antworten:
  - `gateway.http.securityHeaders.strictTransportSecurity` (nur für HTTPS-Origins setzen, die Sie kontrollieren; siehe [Trusted Proxy Auth](/de/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Isolierung mehrerer Instanzen

Führen Sie mehrere Gateways auf einem Host mit eindeutigen Ports und Zustandsverzeichnissen aus:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Praktische Flags: `--dev` (verwendet `~/.openclaw-dev` + Port `19001`), `--profile <name>` (verwendet `~/.openclaw-<name>`).

Siehe [Mehrere Gateways](/de/gateway/multiple-gateways).

### `gateway.tls`

```json5
{
  gateway: {
    tls: {
      enabled: false,
      autoGenerate: false,
      certPath: "/etc/openclaw/tls/server.crt",
      keyPath: "/etc/openclaw/tls/server.key",
      caPath: "/etc/openclaw/tls/ca-bundle.crt",
    },
  },
}
```

- `enabled`: aktiviert TLS-Terminierung am Gateway-Listener (HTTPS/WSS) (Standard: `false`).
- `autoGenerate`: erzeugt automatisch ein lokales selbstsigniertes Zertifikats-/Schlüsselpaar, wenn keine expliziten Dateien konfiguriert sind; nur für lokale/dev-Nutzung.
- `certPath`: Dateisystempfad zur TLS-Zertifikatsdatei.
- `keyPath`: Dateisystempfad zum privaten TLS-Schlüssel; mit restriktiven Berechtigungen sichern.
- `caPath`: optionaler Pfad zu einem CA-Bundle für Client-Verifizierung oder benutzerdefinierte Vertrauenskette.

### `gateway.reload`

```json5
{
  gateway: {
    reload: {
      mode: "hybrid", // off | restart | hot | hybrid
      debounceMs: 500,
      deferralTimeoutMs: 300000,
    },
  },
}
```

- `mode`: steuert, wie Konfigurationsänderungen zur Laufzeit angewendet werden.
  - `"off"`: Live-Änderungen ignorieren; Änderungen erfordern einen expliziten Neustart.
  - `"restart"`: Gateway-Prozess bei Konfigurationsänderung immer neu starten.
  - `"hot"`: Änderungen im Prozess anwenden, ohne neu zu starten.
  - `"hybrid"` (Standard): zuerst Hot-Reload versuchen; bei Bedarf auf Neustart zurückfallen.
- `debounceMs`: Debounce-Fenster in ms, bevor Konfigurationsänderungen angewendet werden (nichtnegative Ganzzahl).
- `deferralTimeoutMs`: maximale Zeit in ms, die auf laufende Vorgänge gewartet wird, bevor ein Neustart erzwungen wird (Standard: `300000` = 5 Minuten).

---

## Hooks

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    maxBodyBytes: 262144,
    defaultSessionKey: "hook:ingress",
    allowRequestSessionKey: false,
    allowedSessionKeyPrefixes: ["hook:"],
    allowedAgentIds: ["hooks", "main"],
    presets: ["gmail"],
    transformsDir: "~/.openclaw/hooks/transforms",
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        agentId: "hooks",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "Von: {{messages[0].from}}\nBetreff: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.4-mini",
      },
    ],
  },
}
```

Auth: `Authorization: Bearer <token>` oder `x-openclaw-token: <token>`.
Hook-Token in Query-Strings werden abgelehnt.

Validierungs- und Sicherheitshinweise:

- `hooks.enabled=true` erfordert ein nicht leeres `hooks.token`.
- `hooks.token` muss **unterschiedlich** zu `gateway.auth.token` sein; die Wiederverwendung des Gateway-Tokens wird abgelehnt.
- `hooks.path` darf nicht `/` sein; verwenden Sie einen dedizierten Unterpfad wie `/hooks`.
- Wenn `hooks.allowRequestSessionKey=true`, schränken Sie `hooks.allowedSessionKeyPrefixes` ein (zum Beispiel `["hook:"]`).

**Endpunkte:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` aus dem Request-Payload wird nur akzeptiert, wenn `hooks.allowRequestSessionKey=true` (Standard: `false`).
- `POST /hooks/<name>` → wird über `hooks.mappings` aufgelöst

<Accordion title="Details zu Mappings">

- `match.path` gleicht den Unterpfad nach `/hooks` ab (z. B. `/hooks/gmail` → `gmail`).
- `match.source` gleicht ein Payload-Feld für generische Pfade ab.
- Templates wie `{{messages[0].subject}}` lesen aus dem Payload.
- `transform` kann auf ein JS-/TS-Modul zeigen, das eine Hook-Aktion zurückgibt.
  - `transform.module` muss ein relativer Pfad sein und innerhalb von `hooks.transformsDir` bleiben (absolute Pfade und Traversal werden abgelehnt).
- `agentId` routet an einen bestimmten Agenten; unbekannte IDs fallen auf den Standard zurück.
- `allowedAgentIds`: schränkt explizites Routing ein (`*` oder weggelassen = alle zulassen, `[]` = alle verweigern).
- `defaultSessionKey`: optionaler fester Sitzungsschlüssel für Hook-Agent-Läufe ohne expliziten `sessionKey`.
- `allowRequestSessionKey`: erlaubt Aufrufern von `/hooks/agent`, `sessionKey` zu setzen (Standard: `false`).
- `allowedSessionKeyPrefixes`: optionale Präfix-Allowlist für explizite `sessionKey`-Werte (Request + Mapping), z. B. `["hook:"]`.
- `deliver: true` sendet die endgültige Antwort an einen Kanal; `channel` ist standardmäßig `last`.
- `model` überschreibt das LLM für diesen Hook-Lauf (muss erlaubt sein, wenn ein Modellkatalog gesetzt ist).

</Accordion>

### Gmail-Integration

```json5
{
  hooks: {
    gmail: {
      account: "openclaw@gmail.com",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

- Das Gateway startet bei der Initialisierung automatisch `gog gmail watch serve`, wenn es konfiguriert ist. Setzen Sie `OPENCLAW_SKIP_GMAIL_WATCHER=1`, um dies zu deaktivieren.
- Führen Sie nicht zusätzlich zu Gateway ein separates `gog gmail watch serve` aus.

---

## Canvas-Host

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // oder OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- Stellt agentenbearbeitbares HTML/CSS/JS und A2UI per HTTP unter dem Gateway-Port bereit:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- Nur lokal: Behalten Sie `gateway.bind: "loopback"` bei (Standard).
- Bei Nicht-Loopback-Binds erfordern Canvas-Routen Gateway-Auth (Token/Passwort/trusted-proxy), genau wie andere HTTP-Oberflächen des Gateway.
- Node-WebViews senden typischerweise keine Auth-Header; nachdem ein Node gekoppelt und verbunden ist, veröffentlicht das Gateway Node-spezifische Capability-URLs für den Zugriff auf Canvas/A2UI.
- Capability-URLs sind an die aktive Node-WS-Sitzung gebunden und laufen schnell ab. Ein IP-basierter Fallback wird nicht verwendet.
- Fügt dem ausgelieferten HTML einen Live-Reload-Client ein.
- Erstellt automatisch eine Starter-`index.html`, wenn leer.
- Stellt A2UI auch unter `/__openclaw__/a2ui/` bereit.
- Änderungen erfordern einen Gateway-Neustart.
- Deaktivieren Sie Live Reload bei großen Verzeichnissen oder `EMFILE`-Fehlern.

---

## Discovery

### mDNS (Bonjour)

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
```

- `minimal` (Standard): lässt `cliPath` + `sshPort` aus TXT-Records weg.
- `full`: enthält `cliPath` + `sshPort`.
- Der Hostname ist standardmäßig `openclaw`. Überschreiben mit `OPENCLAW_MDNS_HOSTNAME`.

### Wide-Area (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Schreibt eine Unicast-DNS-SD-Zone unter `~/.openclaw/dns/`. Für netzwerkübergreifende Discovery mit einem DNS-Server (CoreDNS empfohlen) + Tailscale Split DNS kombinieren.

Setup: `openclaw dns setup --apply`.

---

## Umgebung

### `env` (inline Env-Variablen)

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

- Inline-Env-Variablen werden nur angewendet, wenn in der Prozessumgebung der Schlüssel fehlt.
- `.env`-Dateien: CWD `.env` + `~/.openclaw/.env` (keine von beiden überschreibt vorhandene Variablen).
- `shellEnv`: importiert fehlende erwartete Schlüssel aus Ihrem Login-Shell-Profil.
- Siehe [Umgebung](/de/help/environment) für die vollständige Priorität.

### Env-Variablen-Substitution

Referenzieren Sie Env-Variablen in jedem Konfigurations-String mit `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Es werden nur Großbuchstabennamen nach `[A-Z_][A-Z0-9_]*` abgeglichen.
- Fehlende/leere Variablen führen beim Laden der Konfiguration zu einem Fehler.
- Mit `$${VAR}` für ein wörtliches `${VAR}` escapen.
- Funktioniert mit `$include`.

---

## Secrets

SecretRefs sind additiv: Klartextwerte funktionieren weiterhin.

### `SecretRef`

Verwenden Sie eine Objektform:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Validierung:

- `provider`-Muster: `^[a-z][a-z0-9_-]{0,63}$`
- `source: "env"`-ID-Muster: `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"`-ID: absoluter JSON-Pointer (zum Beispiel `"/providers/openai/apiKey"`)
- `source: "exec"`-ID-Muster: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `source: "exec"`-IDs dürfen keine Slash-getrennten Pfadsegmente `.` oder `..` enthalten (zum Beispiel wird `a/../b` abgelehnt)

### Unterstützte Oberfläche für Zugangsdaten

- Kanonische Matrix: [SecretRef Credential Surface](/de/reference/secretref-credential-surface)
- `secrets apply` zielt auf unterstützte Zugangsdatenpfade in `openclaw.json`.
- `auth-profiles.json`-Refs sind in Laufzeitauflösung und Audit-Abdeckung enthalten.

### Secret-Provider-Konfiguration

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // optionaler expliziter Env-Provider
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json",
        timeoutMs: 5000,
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        passEnv: ["PATH", "VAULT_ADDR"],
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
  },
}
```

Hinweise:

- Der Provider `file` unterstützt `mode: "json"` und `mode: "singleValue"` (`id` muss im Modus singleValue `"value"` sein).
- Der Provider `exec` erfordert einen absoluten `command`-Pfad und verwendet Protokoll-Payloads über stdin/stdout.
- Standardmäßig werden symbolische Links für Command-Pfade abgelehnt. Setzen Sie `allowSymlinkCommand: true`, um Symlink-Pfade zuzulassen und dabei den aufgelösten Zielpfad zu validieren.
- Wenn `trustedDirs` konfiguriert ist, gilt die Prüfung vertrauenswürdiger Verzeichnisse für den aufgelösten Zielpfad.
- Die Child-Umgebung von `exec` ist standardmäßig minimal; geben Sie benötigte Variablen explizit mit `passEnv` weiter.
- SecretRefs werden zur Aktivierungszeit in einen In-Memory-Snapshot aufgelöst, danach lesen Request-Pfade nur noch aus dem Snapshot.
- Beim Aktivieren wird eine Filterung aktiver Oberflächen angewendet: nicht auflösbare Refs auf aktivierten Oberflächen lassen Start/Reload fehlschlagen, während inaktive Oberflächen mit Diagnostik übersprungen werden.

---

## Auth-Speicherung

```json5
{
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai-codex:personal": { provider: "openai-codex", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      "openai-codex": ["openai-codex:personal"],
    },
  },
}
```

- Profile pro Agent werden unter `<agentDir>/auth-profiles.json` gespeichert.
- `auth-profiles.json` unterstützt Refs auf Wertebene (`keyRef` für `api_key`, `tokenRef` für `token`) für statische Zugangsdatenmodi.
- Profile im OAuth-Modus (`auth.profiles.<id>.mode = "oauth"`) unterstützen keine SecretRef-gestützten Auth-Profile-Zugangsdaten.
- Statische Laufzeit-Zugangsdaten stammen aus aufgelösten In-Memory-Snapshots; Legacy-statische Einträge in `auth.json` werden bereinigt, wenn sie gefunden werden.
- Legacy-OAuth-Importe aus `~/.openclaw/credentials/oauth.json`.
- Siehe [OAuth](/de/concepts/oauth).
- Secrets-Laufzeitverhalten und Tooling für `audit/configure/apply`: [Secrets Management](/de/gateway/secrets).

### `auth.cooldowns`

```json5
{
  auth: {
    cooldowns: {
      billingBackoffHours: 5,
      billingBackoffHoursByProvider: { anthropic: 3, openai: 8 },
      billingMaxHours: 24,
      authPermanentBackoffMinutes: 10,
      authPermanentMaxMinutes: 60,
      failureWindowHours: 24,
      overloadedProfileRotations: 1,
      overloadedBackoffMs: 0,
      rateLimitedProfileRotations: 1,
    },
  },
}
```

- `billingBackoffHours`: Basis-Backoff in Stunden, wenn ein Profil wegen echter
  Billing-/Insufficient-Credit-Fehler fehlschlägt (Standard: `5`). Expliziter Billing-Text kann
  weiterhin hier landen, selbst bei Antworten `401`/`403`, aber provider-spezifische Text-
  Matcher bleiben auf den Provider beschränkt, dem sie gehören (zum Beispiel OpenRouter
  `Key limit exceeded`). Wiederholbare HTTP-`402`-Usage-Window- oder
  Organization-/Workspace-Spend-Limit-Meldungen bleiben stattdessen im Pfad `rate_limit`.
- `billingBackoffHoursByProvider`: optionale Überschreibungen pro Provider für Billing-Backoff in Stunden.
- `billingMaxHours`: Obergrenze in Stunden für exponentielles Wachstum des Billing-Backoff (Standard: `24`).
- `authPermanentBackoffMinutes`: Basis-Backoff in Minuten für hochsichere Fehler vom Typ `auth_permanent` (Standard: `10`).
- `authPermanentMaxMinutes`: Obergrenze in Minuten für das Wachstum des Backoff bei `auth_permanent` (Standard: `60`).
- `failureWindowHours`: rollierendes Fenster in Stunden, das für Backoff-Zähler verwendet wird (Standard: `24`).
- `overloadedProfileRotations`: maximale Anzahl Rotationen von Auth-Profilen desselben Providers bei Overloaded-Fehlern, bevor auf Modell-Fallback gewechselt wird (Standard: `1`). Provider-busy-Formen wie `ModelNotReadyException` fallen hierunter.
- `overloadedBackoffMs`: feste Verzögerung vor erneutem Versuch einer Rotation bei überlastetem Provider/Profil (Standard: `0`).
- `rateLimitedProfileRotations`: maximale Anzahl Rotationen von Auth-Profilen desselben Providers bei Rate-Limit-Fehlern, bevor auf Modell-Fallback gewechselt wird (Standard: `1`). Dieser Rate-Limit-Bucket umfasst provider-geprägte Texte wie `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` und `resource exhausted`.

---

## Logging

```json5
{
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty", // pretty | compact | json
    redactSensitive: "tools", // off | tools
    redactPatterns: ["\\bTOKEN\\b\\s*[=:]\\s*([\"']?)([^\\s\"']+)\\1"],
  },
}
```

- Standard-Logdatei: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`.
- Setzen Sie `logging.file` für einen stabilen Pfad.
- `consoleLevel` wird mit `--verbose` auf `debug` angehoben.
- `maxFileBytes`: maximale Logdateigröße in Bytes, bevor Schreibvorgänge unterdrückt werden (positive Ganzzahl; Standard: `524288000` = 500 MB). Verwenden Sie für Produktions-Deployments externe Logrotation.

---

## Diagnostik

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,

    otel: {
      enabled: false,
      endpoint: "https://otel-collector.example.com:4318",
      protocol: "http/protobuf", // http/protobuf | grpc
      headers: { "x-tenant-id": "my-org" },
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: false,
      sampleRate: 1.0,
      flushIntervalMs: 5000,
    },

    cacheTrace: {
      enabled: false,
      filePath: "~/.openclaw/logs/cache-trace.jsonl",
      includeMessages: true,
      includePrompt: true,
      includeSystem: true,
    },
  },
}
```

- `enabled`: globaler Schalter für Instrumentierungs-Ausgabe (Standard: `true`).
- `flags`: Array von Flag-Strings zum Aktivieren gezielter Log-Ausgabe (unterstützt Wildcards wie `"telegram.*"` oder `"*"`).
- `stuckSessionWarnMs`: Altersschwelle in ms für die Ausgabe von Warnungen zu hängenden Sitzungen, solange eine Sitzung im Verarbeitungszustand bleibt.
- `otel.enabled`: aktiviert die OpenTelemetry-Export-Pipeline (Standard: `false`).
- `otel.endpoint`: Collector-URL für den OTel-Export.
- `otel.protocol`: `"http/protobuf"` (Standard) oder `"grpc"`.
- `otel.headers`: zusätzliche HTTP-/gRPC-Metadaten-Header, die mit OTel-Export-Requests gesendet werden.
- `otel.serviceName`: Service-Name für Ressourcenattribute.
- `otel.traces` / `otel.metrics` / `otel.logs`: Trace-, Metrik- oder Log-Export aktivieren.
- `otel.sampleRate`: Trace-Sampling-Rate `0`–`1`.
- `otel.flushIntervalMs`: periodisches Flush-Intervall für Telemetrie in ms.
- `cacheTrace.enabled`: protokolliert Cache-Trace-Snapshots für eingebettete Läufe (Standard: `false`).
- `cacheTrace.filePath`: Ausgabepfad für Cache-Trace-JSONL (Standard: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: steuern, was in der Cache-Trace-Ausgabe enthalten ist (alle standardmäßig: `true`).

---

## Update

```json5
{
  update: {
    channel: "stable", // stable | beta | dev
    checkOnStart: true,

    auto: {
      enabled: false,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

- `channel`: Release-Kanal für npm-/git-Installationen — `"stable"`, `"beta"` oder `"dev"`.
- `checkOnStart`: beim Start des Gateway nach npm-Updates suchen (Standard: `true`).
- `auto.enabled`: Hintergrund-Auto-Update für Paketinstallationen aktivieren (Standard: `false`).
- `auto.stableDelayHours`: minimale Verzögerung in Stunden vor automatischer Anwendung im Stable-Kanal (Standard: `6`; max: `168`).
- `auto.stableJitterHours`: zusätzliches Verteilungsfenster in Stunden für Rollouts im Stable-Kanal (Standard: `12`; max: `168`).
- `auto.betaCheckIntervalHours`: wie oft Prüfungen im Beta-Kanal in Stunden ausgeführt werden (Standard: `1`; max: `24`).

---

## ACP

```json5
{
  acp: {
    enabled: false,
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "main",
    allowedAgents: ["main", "ops"],
    maxConcurrentSessions: 10,

    stream: {
      coalesceIdleMs: 50,
      maxChunkChars: 1000,
      repeatSuppression: true,
      deliveryMode: "live", // live | final_only
      hiddenBoundarySeparator: "paragraph", // none | space | newline | paragraph
      maxOutputChars: 50000,
      maxSessionUpdateChars: 500,
    },

    runtime: {
      ttlMinutes: 30,
    },
  },
}
```

- `enabled`: globales ACP-Feature-Gate (Standard: `false`).
- `dispatch.enabled`: unabhängiges Gate für ACP-Sitzungs-Turn-Dispatch (Standard: `true`). Setzen Sie `false`, um ACP-Befehle verfügbar zu halten, aber die Ausführung zu blockieren.
- `backend`: Standard-ID des ACP-Laufzeit-Backends (muss mit einem registrierten ACP-Runtime-Plugin übereinstimmen).
- `defaultAgent`: Fallback-Ziel-Agent-ID für ACP, wenn Spawns kein explizites Ziel angeben.
- `allowedAgents`: Allowlist von Agent-IDs, die für ACP-Laufzeitsitzungen erlaubt sind; leer bedeutet keine zusätzliche Einschränkung.
- `maxConcurrentSessions`: maximale Anzahl gleichzeitig aktiver ACP-Sitzungen.
- `stream.coalesceIdleMs`: Idle-Flush-Fenster in ms für gestreamten Text.
- `stream.maxChunkChars`: maximale Chunk-Größe, bevor die Projektion gestreamter Blöcke geteilt wird.
- `stream.repeatSuppression`: unterdrückt wiederholte Status-/Tool-Zeilen pro Turn (Standard: `true`).
- `stream.deliveryMode`: `"live"` streamt inkrementell; `"final_only"` puffert bis zu terminalen Turn-Ereignissen.
- `stream.hiddenBoundarySeparator`: Trennzeichen vor sichtbarem Text nach versteckten Tool-Ereignissen (Standard: `"paragraph"`).
- `stream.maxOutputChars`: maximale Anzahl projizierter Zeichen der Assistentenausgabe pro ACP-Turn.
- `stream.maxSessionUpdateChars`: maximale Zeichenanzahl für projizierte ACP-Status-/Update-Zeilen.
- `stream.tagVisibility`: Zuordnung von Tagnamen zu booleschen Sichtbarkeits-Überschreibungen für gestreamte Ereignisse.
- `runtime.ttlMinutes`: Idle-TTL in Minuten für ACP-Sitzungs-Worker, bevor sie für Bereinigung infrage kommen.
- `runtime.installCommand`: optionaler Installationsbefehl, der beim Bootstrapping einer ACP-Laufzeitumgebung ausgeführt wird.

---

## CLI

```json5
{
  cli: {
    banner: {
      taglineMode: "off", // random | default | off
    },
  },
}
```

- `cli.banner.taglineMode` steuert den Stil des Banner-Taglines:
  - `"random"` (Standard): rotierende lustige/saisonale Taglines.
  - `"default"`: fester neutraler Tagline (`All your chats, one OpenClaw.`).
  - `"off"`: kein Tagline-Text (Banner-Titel/Version wird weiterhin angezeigt).
- Um das gesamte Banner auszublenden (nicht nur die Taglines), setzen Sie die Env-Variable `OPENCLAW_HIDE_BANNER=1`.

---

## Wizard

Von CLI-geführten Setup-Abläufen (`onboard`, `configure`, `doctor`) geschriebene Metadaten:

```json5
{
  wizard: {
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
  },
}
```

---

## Identität

Siehe `agents.list`-Identitätsfelder unter [Agent-Standards](#agent-defaults).

---

## Bridge (Legacy, entfernt)

Aktuelle Builds enthalten die TCP-Bridge nicht mehr. Nodes verbinden sich über den Gateway-WebSocket. `bridge.*`-Schlüssel sind nicht länger Teil des Konfigurationsschemas (die Validierung schlägt fehl, bis sie entfernt werden; `openclaw doctor --fix` kann unbekannte Schlüssel entfernen).

<Accordion title="Legacy-Bridge-Konfiguration (historische Referenz)">

```json
{
  "bridge": {
    "enabled": true,
    "port": 18790,
    "bind": "tailnet",
    "tls": {
      "enabled": true,
      "autoGenerate": true
    }
  }
}
```

</Accordion>

---

## Cron

```json5
{
  cron: {
    enabled: true,
    maxConcurrentRuns: 2,
    webhook: "https://example.invalid/legacy", // veralteter Fallback für gespeicherte Jobs mit notify:true
    webhookToken: "replace-with-dedicated-token", // optionaler Bearer-Token für ausgehende Webhook-Authentifizierung
    sessionRetention: "24h", // Dauer-String oder false
    runLog: {
      maxBytes: "2mb", // Standard 2_000_000 Byte
      keepLines: 2000, // Standard 2000
    },
  },
}
```

- `sessionRetention`: wie lange abgeschlossene isolierte Cron-Laufsitzungen aufbewahrt werden, bevor sie aus `sessions.json` entfernt werden. Steuert auch die Bereinigung archivierter gelöschter Cron-Transkripte. Standard: `24h`; setzen Sie `false`, um zu deaktivieren.
- `runLog.maxBytes`: maximale Größe pro Run-Log-Datei (`cron/runs/<jobId>.jsonl`) vor der Bereinigung. Standard: `2_000_000` Byte.
- `runLog.keepLines`: neueste Zeilen, die beibehalten werden, wenn die Bereinigung des Run-Logs ausgelöst wird. Standard: `2000`.
- `webhookToken`: Bearer-Token, der für die POST-Zustellung des Cron-Webhooks (`delivery.mode = "webhook"`) verwendet wird; wenn weggelassen, wird kein Auth-Header gesendet.
- `webhook`: veraltete Legacy-Fallback-Webhook-URL (http/https), die nur für gespeicherte Jobs verwendet wird, die weiterhin `notify: true` haben.

### `cron.retry`

```json5
{
  cron: {
    retry: {
      maxAttempts: 3,
      backoffMs: [30000, 60000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "timeout", "server_error"],
    },
  },
}
```

- `maxAttempts`: maximale Anzahl Wiederholungsversuche für einmalige Jobs bei transienten Fehlern (Standard: `3`; Bereich: `0`–`10`).
- `backoffMs`: Array von Backoff-Verzögerungen in ms für jeden Wiederholungsversuch (Standard: `[30000, 60000, 300000]`; 1–10 Einträge).
- `retryOn`: Fehlertypen, die Wiederholungen auslösen — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Weglassen, um alle transienten Typen zu wiederholen.

Gilt nur für einmalige Cron-Jobs. Wiederkehrende Jobs verwenden eine separate Fehlerbehandlung.

### `cron.failureAlert`

```json5
{
  cron: {
    failureAlert: {
      enabled: false,
      after: 3,
      cooldownMs: 3600000,
      mode: "announce",
      accountId: "main",
    },
  },
}
```

- `enabled`: Fehlerwarnungen für Cron-Jobs aktivieren (Standard: `false`).
- `after`: aufeinanderfolgende Fehler, bevor eine Warnung ausgelöst wird (positive Ganzzahl, min: `1`).
- `cooldownMs`: minimale Millisekunden zwischen wiederholten Warnungen für denselben Job (nichtnegative Ganzzahl).
- `mode`: Zustellmodus — `"announce"` sendet über eine Kanalnachricht; `"webhook"` postet an den konfigurierten Webhook.
- `accountId`: optionale Konto- oder Kanal-ID, um die Warnzustellung einzugrenzen.

### `cron.failureDestination`

```json5
{
  cron: {
    failureDestination: {
      mode: "announce",
      channel: "last",
      to: "channel:C1234567890",
      accountId: "main",
    },
  },
}
```

- Standardziel für Cron-Fehlerbenachrichtigungen über alle Jobs hinweg.
- `mode`: `"announce"` oder `"webhook"`; standardmäßig `"announce"`, wenn genügend Zieldaten vorhanden sind.
- `channel`: Kanalüberschreibung für die Zustellung per Announce. `"last"` verwendet den zuletzt bekannten Zustellkanal wieder.
- `to`: explizites Announce-Ziel oder Webhook-URL. Erforderlich für den Webhook-Modus.
- `accountId`: optionale Kontoüberschreibung für die Zustellung.
- `delivery.failureDestination` pro Job überschreibt diesen globalen Standard.
- Wenn weder global noch pro Job ein Fehlerziel gesetzt ist, fallen Jobs, die bereits über `announce` zustellen, bei Fehlern auf dieses primäre Announce-Ziel zurück.
- `delivery.failureDestination` wird nur für Jobs mit `sessionTarget="isolated"` unterstützt, es sei denn, der primäre `delivery.mode` des Jobs ist `"webhook"`.

Siehe [Cron Jobs](/de/automation/cron-jobs). Isolierte Cron-Ausführungen werden als [Hintergrundaufgaben](/de/automation/tasks) verfolgt.

---

## Template-Variablen für Medienmodelle

Template-Platzhalter, die in `tools.media.models[].args` erweitert werden:

| Variable           | Beschreibung                                      |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | Vollständiger eingehender Nachrichtentext         |
| `{{RawBody}}`      | Rohtext (ohne Verlauf-/Absender-Wrapper)          |
| `{{BodyStripped}}` | Text, bei dem Gruppen-Erwähnungen entfernt wurden |
| `{{From}}`         | Absenderkennung                                   |
| `{{To}}`           | Zielkennung                                       |
| `{{MessageSid}}`   | Kanal-Nachrichten-ID                              |
| `{{SessionId}}`    | Aktuelle Sitzungs-UUID                            |
| `{{IsNewSession}}` | `"true"`, wenn eine neue Sitzung erstellt wurde   |
| `{{MediaUrl}}`     | Pseudo-URL eingehender Medien                     |
| `{{MediaPath}}`    | Lokaler Medienpfad                                |
| `{{MediaType}}`    | Medientyp (image/audio/document/…)                |
| `{{Transcript}}`   | Audio-Transkript                                  |
| `{{Prompt}}`       | Aufgelöster Medien-Prompt für CLI-Einträge        |
| `{{MaxChars}}`     | Aufgelöste maximale Ausgabezeichen für CLI-Einträge |
| `{{ChatType}}`     | `"direct"` oder `"group"`                         |
| `{{GroupSubject}}` | Gruppenthema (best effort)                        |
| `{{GroupMembers}}` | Vorschau auf Gruppenmitglieder (best effort)      |
| `{{SenderName}}`   | Anzeigename des Absenders (best effort)           |
| `{{SenderE164}}`   | Telefonnummer des Absenders (best effort)         |
| `{{Provider}}`     | Provider-Hinweis (whatsapp, telegram, discord usw.) |

---

## Konfigurations-Includes (`$include`)

Teilen Sie die Konfiguration in mehrere Dateien auf:

```json5
// ~/.openclaw/openclaw.json
{
  gateway: { port: 18789 },
  agents: { $include: "./agents.json5" },
  broadcast: {
    $include: ["./clients/mueller.json5", "./clients/schmidt.json5"],
  },
}
```

**Merge-Verhalten:**

- Einzelne Datei: ersetzt das enthaltende Objekt.
- Array von Dateien: wird in Reihenfolge tief zusammengeführt (spätere überschreiben frühere).
- Nachbarschlüssel: werden nach Includes zusammengeführt (überschreiben enthaltene Werte).
- Verschachtelte Includes: bis zu 10 Ebenen tief.
- Pfade: werden relativ zur einbindenden Datei aufgelöst, müssen aber innerhalb des Konfigurationsverzeichnisses der obersten Ebene bleiben (`dirname` von `openclaw.json`). Absolute/`../`-Formen sind nur erlaubt, wenn sie weiterhin innerhalb dieser Grenze aufgelöst werden.
- Fehler: klare Meldungen für fehlende Dateien, Parse-Fehler und zirkuläre Includes.

---

_Verwandt: [Konfiguration](/de/gateway/configuration) · [Konfigurationsbeispiele](/de/gateway/configuration-examples) · [Doctor](/de/gateway/doctor)_
