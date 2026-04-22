---
read_when:
    - Sie benötigen exakte feldspezifische Konfigurationssemantik oder Standardwerte
    - Sie validieren Konfigurationsblöcke für Kanal, Modell, Gateway oder Tool
summary: Gateway-Konfigurationsreferenz für zentrale OpenClaw-Schlüssel, Standardwerte und Links zu dedizierten Subsystemreferenzen
title: Konfigurationsreferenz
x-i18n:
    generated_at: "2026-04-22T06:23:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: f0d6fc076f54e84bef5beefbcc42d8f172cc79792c716f76103894303e3042ac
    source_path: gateway/configuration-reference.md
    workflow: 15
---

# Konfigurationsreferenz

Referenz der zentralen Konfiguration für `~/.openclaw/openclaw.json`. Eine aufgabenorientierte Übersicht finden Sie unter [Configuration](/de/gateway/configuration).

Diese Seite behandelt die wichtigsten OpenClaw-Konfigurationsbereiche und verweist weiter, wenn ein Subsystem eine eigene ausführlichere Referenz hat. Sie versucht **nicht**, jeden kanal-/Plugin-eigenen Befehlskatalog oder jeden tiefen Speicher-/QMD-Regler auf einer Seite inline darzustellen.

Code-Quelle der Wahrheit:

- `openclaw config schema` gibt das Live-JSON-Schema aus, das für Validierung und Control UI verwendet wird, wobei gebündelte/Plugin-/Kanal-Metadaten zusammengeführt werden, wenn verfügbar
- `config.schema.lookup` gibt einen pfadbezogenen einzelnen Schema-Knoten für Drill-down-Tools zurück
- `pnpm config:docs:check` / `pnpm config:docs:gen` validieren den Baseline-Hash der Konfigurationsdokumentation gegen die aktuelle Schemaschnittstelle

Dedizierte ausführliche Referenzen:

- [Speicherkonfigurationsreferenz](/de/reference/memory-config) für `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` und Dreaming-Konfiguration unter `plugins.entries.memory-core.config.dreaming`
- [Slash Commands](/de/tools/slash-commands) für den aktuellen integrierten + gebündelten Befehlskatalog
- zuständige Kanal-/Plugin-Seiten für kanalspezifische Befehlsoberflächen

Das Konfigurationsformat ist **JSON5** (Kommentare + nachgestellte Kommata erlaubt). Alle Felder sind optional — OpenClaw verwendet sichere Standardwerte, wenn sie weggelassen werden.

---

## Kanäle

Jeder Kanal startet automatisch, wenn sein Konfigurationsabschnitt vorhanden ist (außer bei `enabled: false`).

### DM- und Gruppenzugriff

Alle Kanäle unterstützen DM-Richtlinien und Gruppenrichtlinien:

| DM-Richtlinie       | Verhalten                                                     |
| ------------------- | ------------------------------------------------------------- |
| `pairing` (Standard) | Unbekannte Absender erhalten einen einmaligen Pairing-Code; der Besitzer muss genehmigen |
| `allowlist`         | Nur Absender in `allowFrom` (oder gepaartem Allow-Store)      |
| `open`              | Alle eingehenden DMs zulassen (erfordert `allowFrom: ["*"]`)  |
| `disabled`          | Alle eingehenden DMs ignorieren                               |

| Gruppenrichtlinie     | Verhalten                                             |
| --------------------- | ----------------------------------------------------- |
| `allowlist` (Standard) | Nur Gruppen zulassen, die der konfigurierten Allowlist entsprechen |
| `open`                | Gruppen-Allowlists umgehen (Mention-Gating gilt weiterhin) |
| `disabled`            | Alle Gruppen-/Raumnachrichten blockieren              |

<Note>
`channels.defaults.groupPolicy` setzt den Standard, wenn `groupPolicy` eines Providers nicht gesetzt ist.
Pairing-Codes laufen nach 1 Stunde ab. Ausstehende DM-Pairing-Anfragen sind auf **3 pro Kanal** begrenzt.
Fehlt ein Provider-Block vollständig (`channels.<provider>` fehlt), fällt die Laufzeit-Gruppenrichtlinie auf `allowlist` zurück (fail-closed) mit einer Startwarnung.
</Note>

### Kanal-Modellüberschreibungen

Verwenden Sie `channels.modelByChannel`, um bestimmte Kanal-IDs an ein Modell zu binden. Werte akzeptieren `provider/model` oder konfigurierte Modellaliase. Die Kanalzuordnung wird angewendet, wenn eine Sitzung nicht bereits eine Modellüberschreibung hat (zum Beispiel gesetzt über `/model`).

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

### Kanal-Standards und Heartbeat

Verwenden Sie `channels.defaults` für gemeinsames Gruppenrichtlinien- und Heartbeat-Verhalten über Provider hinweg:

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

- `channels.defaults.groupPolicy`: Fallback-Gruppenrichtlinie, wenn ein providerbezogenes `groupPolicy` nicht gesetzt ist.
- `channels.defaults.contextVisibility`: Standardmodus für die Sichtbarkeit ergänzenden Kontexts für alle Kanäle. Werte: `all` (Standard, allen zitierten/Thread-/Verlaufs-Kontext einbeziehen), `allowlist` (nur Kontext von Absendern auf der Allowlist einbeziehen), `allowlist_quote` (wie allowlist, aber expliziten Zitat-/Antwortkontext beibehalten). Pro-Kanal-Überschreibung: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: Gesunde Kanalstatus in die Heartbeat-Ausgabe aufnehmen.
- `channels.defaults.heartbeat.showAlerts`: Degradierte/Fehlerstatus in die Heartbeat-Ausgabe aufnehmen.
- `channels.defaults.heartbeat.useIndicator`: Kompakte Heartbeat-Ausgabe im Indikatorstil rendern.

### WhatsApp

WhatsApp läuft über den Web-Kanal des Gateway (Baileys Web). Es startet automatisch, wenn eine verknüpfte Sitzung vorhanden ist.

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // blaue Häkchen (false im Self-Chat-Modus)
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
- Optional überschreibt `channels.whatsapp.defaultAccount` diese Fallback-Standardkontoauswahl, wenn sie einer konfigurierten Konto-ID entspricht.
- Das Legacy-Baileys-Authentifizierungsverzeichnis für ein Einzelkonto wird durch `openclaw doctor` nach `whatsapp/default` migriert.
- Pro-Konto-Überschreibungen: `channels.whatsapp.accounts.<id>.sendReadReceipts`, `channels.whatsapp.accounts.<id>.dmPolicy`, `channels.whatsapp.accounts.<id>.allowFrom`.

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
          systemPrompt: "Antworten Sie kurz.",
          topics: {
            "99": {
              requireMention: false,
              skills: ["search"],
              systemPrompt: "Bleiben Sie beim Thema.",
            },
          },
        },
      },
      customCommands: [
        { command: "backup", description: "Git-Backup" },
        { command: "generate", description: "Ein Bild erstellen" },
      ],
      historyLimit: 50,
      replyToMode: "first", // off | first | all | batched
      linkPreview: true,
      streaming: "partial", // off | partial | block | progress (Standard: off; explizit aktivieren, um Ratenbegrenzungen für Vorschau-Bearbeitungen zu vermeiden)
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
- Optional überschreibt `channels.telegram.defaultAccount` die Standardkontoauswahl, wenn sie einer konfigurierten Konto-ID entspricht.
- In Setups mit mehreren Konten (2+ Konto-IDs) setzen Sie einen expliziten Standard (`channels.telegram.defaultAccount` oder `channels.telegram.accounts.default`), um Fallback-Routing zu vermeiden; `openclaw doctor` warnt, wenn dies fehlt oder ungültig ist.
- `configWrites: false` blockiert von Telegram initiierte Konfigurationsschreibvorgänge (Supergroup-ID-Migrationen, `/config set|unset`).
- Top-Level-Einträge in `bindings[]` mit `type: "acp"` konfigurieren persistente ACP-Bindungen für Forenthemen (verwenden Sie das kanonische `chatId:topic:topicId` in `match.peer.id`). Die Feldsemantik ist gemeinsam beschrieben unter [ACP Agents](/de/tools/acp-agents#channel-specific-settings).
- Telegram-Stream-Vorschauen verwenden `sendMessage` + `editMessageText` (funktioniert in Direkt- und Gruppenchats).
- Retry-Richtlinie: siehe [Retry policy](/de/concepts/retry).

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
              systemPrompt: "Nur kurze Antworten.",
            },
          },
        },
      },
      historyLimit: 20,
      textChunkLimit: 2000,
      chunkMode: "length", // length | newline
      streaming: "off", // off | partial | block | progress (progress wird auf Discord zu partial zugeordnet)
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
        spawnSubagentSessions: false, // Opt-in für sessions_spawn({ thread: true })
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
- Direkte ausgehende Aufrufe, die ein explizites Discord-`token` angeben, verwenden dieses Token für den Aufruf; Konto-Retry-/Richtlinieneinstellungen kommen weiterhin vom ausgewählten Konto im aktiven Laufzeit-Snapshot.
- Optional überschreibt `channels.discord.defaultAccount` die Standardkontoauswahl, wenn sie einer konfigurierten Konto-ID entspricht.
- Verwenden Sie `user:<id>` (DM) oder `channel:<id>` (Guild-Kanal) für Zustellziele; reine numerische IDs werden abgelehnt.
- Guild-Slugs sind kleingeschrieben, wobei Leerzeichen durch `-` ersetzt werden; Kanalschlüssel verwenden den Slug-Namen (ohne `#`). Bevorzugen Sie Guild-IDs.
- Von Bots verfasste Nachrichten werden standardmäßig ignoriert. `allowBots: true` aktiviert sie; verwenden Sie `allowBots: "mentions"`, um nur Bot-Nachrichten zu akzeptieren, die den Bot erwähnen (eigene Nachrichten werden weiterhin gefiltert).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (und Kanal-Überschreibungen) verwirft Nachrichten, die einen anderen Benutzer oder eine andere Rolle erwähnen, aber nicht den Bot (ausgenommen @everyone/@here).
- `maxLinesPerMessage` (Standard 17) teilt hohe Nachrichten auf, auch wenn sie unter 2000 Zeichen liegen.
- `channels.discord.threadBindings` steuert Discord-Thread-gebundenes Routing:
  - `enabled`: Discord-Überschreibung für threadgebundene Sitzungsfunktionen (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` und gebundene Zustellung/Routing)
  - `idleHours`: Discord-Überschreibung für automatische Entfokussierung bei Inaktivität in Stunden (`0` deaktiviert)
  - `maxAgeHours`: Discord-Überschreibung für harte maximale Lebensdauer in Stunden (`0` deaktiviert)
  - `spawnSubagentSessions`: Opt-in-Schalter für die automatische Thread-Erstellung/-Bindung von `sessions_spawn({ thread: true })`
- Top-Level-Einträge in `bindings[]` mit `type: "acp"` konfigurieren persistente ACP-Bindungen für Kanäle und Threads (verwenden Sie die Kanal-/Thread-ID in `match.peer.id`). Die Feldsemantik ist gemeinsam beschrieben unter [ACP Agents](/de/tools/acp-agents#channel-specific-settings).
- `channels.discord.ui.components.accentColor` setzt die Akzentfarbe für Discord-Komponenten-v2-Container.
- `channels.discord.voice` aktiviert Discord-Sprachkanalunterhaltungen und optionale Auto-Join- + TTS-Überschreibungen.
- `channels.discord.voice.daveEncryption` und `channels.discord.voice.decryptionFailureTolerance` werden an die DAVE-Optionen von `@discordjs/voice` durchgereicht (`true` bzw. `24` standardmäßig).
- OpenClaw versucht zusätzlich, den Sprach-Empfang wiederherzustellen, indem eine Sprachsitzung nach wiederholten Entschlüsselungsfehlern verlassen und erneut betreten wird.
- `channels.discord.streaming` ist der kanonische Schlüssel für den Stream-Modus. Legacy-`streamMode`- und boolesche `streaming`-Werte werden automatisch migriert.
- `channels.discord.autoPresence` ordnet die Laufzeitverfügbarkeit der Bot-Präsenz zu (healthy => online, degraded => idle, exhausted => dnd) und erlaubt optionale Überschreibungen des Statustexts.
- `channels.discord.dangerouslyAllowNameMatching` aktiviert veränderliches Namens-/Tag-Matching erneut (Break-Glass-Kompatibilitätsmodus).
- `channels.discord.execApprovals`: Discord-native Zustellung von Exec-Genehmigungen und Autorisierung von Genehmigern.
  - `enabled`: `true`, `false` oder `"auto"` (Standard). Im Auto-Modus werden Exec-Genehmigungen aktiviert, wenn Genehmiger aus `approvers` oder `commands.ownerAllowFrom` aufgelöst werden können.
  - `approvers`: Discord-Benutzer-IDs, die Exec-Anfragen genehmigen dürfen. Fällt auf `commands.ownerAllowFrom` zurück, wenn nicht angegeben.
  - `agentFilter`: optionale Agent-ID-Allowlist. Weglassen, um Genehmigungen für alle Agenten weiterzuleiten.
  - `sessionFilter`: optionale Sitzungs-Schlüsselmuster (Teilzeichenfolge oder Regex).
  - `target`: wohin Genehmigungsaufforderungen gesendet werden. `"dm"` (Standard) sendet an DMs der Genehmiger, `"channel"` sendet an den Ursprungskanal, `"both"` sendet an beide. Wenn das Ziel `"channel"` enthält, sind Schaltflächen nur für aufgelöste Genehmiger nutzbar.
  - `cleanupAfterResolve`: wenn `true`, löscht Genehmigungs-DMs nach Genehmigung, Ablehnung oder Timeout.

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
- `channels.googlechat.dangerouslyAllowNameMatching` aktiviert veränderliches E-Mail-Principal-Matching erneut (Break-Glass-Kompatibilitätsmodus).

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
          systemPrompt: "Nur kurze Antworten.",
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
        nativeTransport: true, // Slack-native Streaming-API verwenden, wenn mode=partial
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
- **HTTP-Modus** erfordert `botToken` plus `signingSecret` (am Root oder pro Konto).
- `botToken`, `appToken`, `signingSecret` und `userToken` akzeptieren Klartextzeichenfolgen oder SecretRef-Objekte.
- Slack-Konto-Snapshots stellen pro Anmeldedaten Quelle-/Statusfelder bereit, etwa `botTokenSource`, `botTokenStatus`, `appTokenStatus` und im HTTP-Modus `signingSecretStatus`. `configured_unavailable` bedeutet, dass das Konto über SecretRef konfiguriert ist, aber der aktuelle Befehls-/Laufzeitpfad den Secret-Wert nicht auflösen konnte.
- `configWrites: false` blockiert von Slack initiierte Konfigurationsschreibvorgänge.
- Optional überschreibt `channels.slack.defaultAccount` die Standardkontoauswahl, wenn sie einer konfigurierten Konto-ID entspricht.
- `channels.slack.streaming.mode` ist der kanonische Schlüssel für den Slack-Stream-Modus. `channels.slack.streaming.nativeTransport` steuert den nativen Streaming-Transport von Slack. Legacy-`streamMode`, boolesche `streaming`- und `nativeStreaming`-Werte werden automatisch migriert.
- Verwenden Sie `user:<id>` (DM) oder `channel:<id>` für Zustellziele.

**Modi für Reaktionsbenachrichtigungen:** `off`, `own` (Standard), `all`, `allowlist` (aus `reactionAllowlist`).

**Thread-Sitzungsisolierung:** `thread.historyScope` ist pro Thread (Standard) oder über den Kanal geteilt. `thread.inheritParent` kopiert das Transkript des übergeordneten Kanals in neue Threads.

- Slack-natives Streaming plus der Slack-assistant-artige Thread-Status „is typing...“ erfordern ein Antwort-Thread-Ziel. DMs auf Top-Level bleiben standardmäßig ohne Thread, daher verwenden sie `typingReaction` oder normale Zustellung anstelle der Thread-Vorschau.
- `typingReaction` fügt der eingehenden Slack-Nachricht vorübergehend eine Reaktion hinzu, während eine Antwort läuft, und entfernt sie nach Abschluss. Verwenden Sie einen Slack-Emoji-Shortcode wie `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: Slack-native Zustellung von Exec-Genehmigungen und Autorisierung von Genehmigern. Gleiches Schema wie bei Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (Slack-Benutzer-IDs), `agentFilter`, `sessionFilter` und `target` (`"dm"`, `"channel"` oder `"both"`).

| Aktionsgruppe | Standard | Hinweise                |
| ------------- | -------- | ----------------------- |
| reactions     | aktiviert | Reagieren + Reaktionen auflisten |
| messages      | aktiviert | Lesen/senden/bearbeiten/löschen |
| pins          | aktiviert | Anheften/lösen/auflisten |
| memberInfo    | aktiviert | Mitgliedsinformationen  |
| emojiList     | aktiviert | Benutzerdefinierte Emoji-Liste |

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
        native: true, // Opt-in
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Optionale explizite URL für Reverse-Proxy-/öffentliche Deployments
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

Chat-Modi: `oncall` (bei @-Erwähnung antworten, Standard), `onmessage` (jede Nachricht), `onchar` (Nachrichten, die mit einem Trigger-Präfix beginnen).

Wenn Mattermost-native Befehle aktiviert sind:

- `commands.callbackPath` muss ein Pfad sein (zum Beispiel `/api/channels/mattermost/command`), keine vollständige URL.
- `commands.callbackUrl` muss auf den OpenClaw-Gateway-Endpunkt auflösen und vom Mattermost-Server erreichbar sein.
- Native Slash-Callbacks werden mit den pro Befehl bereitgestellten Tokens authentifiziert, die Mattermost bei der Registrierung von Slash-Befehlen zurückgibt. Wenn die Registrierung fehlschlägt oder keine Befehle aktiviert werden, lehnt OpenClaw Callbacks mit `Unauthorized: invalid command token.` ab.
- Für private/tailnet/interne Callback-Hosts kann Mattermost verlangen, dass `ServiceSettings.AllowedUntrustedInternalConnections` den Callback-Host bzw. die Domain enthält. Verwenden Sie Host-/Domain-Werte, keine vollständigen URLs.
- `channels.mattermost.configWrites`: von Mattermost initiierte Konfigurationsschreibvorgänge erlauben oder verweigern.
- `channels.mattermost.requireMention`: `@mention` vor dem Antworten in Kanälen verlangen.
- `channels.mattermost.groups.<channelId>.requireMention`: pro-Kanal-Überschreibung für Mention-Gating (`"*"` für den Standard).
- Optional überschreibt `channels.mattermost.defaultAccount` die Standardkontoauswahl, wenn sie einer konfigurierten Konto-ID entspricht.

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

- `channels.signal.account`: Kanalstart an eine bestimmte Signal-Kontoidentität binden.
- `channels.signal.configWrites`: von Signal initiierte Konfigurationsschreibvorgänge erlauben oder verweigern.
- Optional überschreibt `channels.signal.defaultAccount` die Standardkontoauswahl, wenn sie einer konfigurierten Konto-ID entspricht.

### BlueBubbles

BlueBubbles ist der empfohlene iMessage-Pfad (Plugin-gestützt, konfiguriert unter `channels.bluebubbles`).

```json5
{
  channels: {
    bluebubbles: {
      enabled: true,
      dmPolicy: "pairing",
      // serverUrl, password, webhookPath, Gruppensteuerung und erweiterte Aktionen:
      // siehe /channels/bluebubbles
    },
  },
}
```

- Hier behandelte zentrale Schlüsselpfade: `channels.bluebubbles`, `channels.bluebubbles.dmPolicy`.
- Optional überschreibt `channels.bluebubbles.defaultAccount` die Standardkontoauswahl, wenn sie einer konfigurierten Konto-ID entspricht.
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

- Optional überschreibt `channels.imessage.defaultAccount` die Standardkontoauswahl, wenn sie einer konfigurierten Konto-ID entspricht.

- Erfordert Vollzugriff auf die Messages-Datenbank.
- Bevorzugen Sie `chat_id:<id>`-Ziele. Verwenden Sie `imsg chats --limit 20`, um Chats aufzulisten.
- `cliPath` kann auf einen SSH-Wrapper zeigen; setzen Sie `remoteHost` (`host` oder `user@host`) für das Abrufen von Anhängen per SCP.
- `attachmentRoots` und `remoteAttachmentRoots` beschränken eingehende Anhangspfade (Standard: `/Users/*/Library/Messages/Attachments`).
- SCP verwendet strikte Host-Key-Prüfung, stellen Sie daher sicher, dass der Key des Relay-Hosts bereits in `~/.ssh/known_hosts` vorhanden ist.
- `channels.imessage.configWrites`: von iMessage initiierte Konfigurationsschreibvorgänge erlauben oder verweigern.
- Top-Level-Einträge in `bindings[]` mit `type: "acp"` können iMessage-Konversationen an persistente ACP-Sitzungen binden. Verwenden Sie einen normalisierten Handle oder ein explizites Chat-Ziel (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) in `match.peer.id`. Gemeinsame Feldsemantik: [ACP Agents](/de/tools/acp-agents#channel-specific-settings).

<Accordion title="Beispiel für iMessage-SSH-Wrapper">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix ist Plugin-gestützt und wird unter `channels.matrix` konfiguriert.

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
- `channels.matrix.proxy` leitet Matrix-HTTP-Datenverkehr über einen expliziten HTTP(S)-Proxy. Benannte Konten können ihn mit `channels.matrix.accounts.<id>.proxy` überschreiben.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` erlaubt private/interne Homeserver. `proxy` und dieses Netzwerk-Opt-in sind unabhängige Steuerungen.
- `channels.matrix.defaultAccount` wählt das bevorzugte Konto in Setups mit mehreren Konten aus.
- `channels.matrix.autoJoin` ist standardmäßig `off`, daher werden eingeladene Räume und neue DM-artige Einladungen ignoriert, bis Sie `autoJoin: "allowlist"` mit `autoJoinAllowlist` oder `autoJoin: "always"` setzen.
- `channels.matrix.execApprovals`: Matrix-native Zustellung von Exec-Genehmigungen und Autorisierung von Genehmigern.
  - `enabled`: `true`, `false` oder `"auto"` (Standard). Im Auto-Modus werden Exec-Genehmigungen aktiviert, wenn Genehmiger aus `approvers` oder `commands.ownerAllowFrom` aufgelöst werden können.
  - `approvers`: Matrix-Benutzer-IDs (z. B. `@owner:example.org`), die Exec-Anfragen genehmigen dürfen.
  - `agentFilter`: optionale Agent-ID-Allowlist. Weglassen, um Genehmigungen für alle Agenten weiterzuleiten.
  - `sessionFilter`: optionale Sitzungs-Schlüsselmuster (Teilzeichenfolge oder Regex).
  - `target`: wohin Genehmigungsaufforderungen gesendet werden. `"dm"` (Standard), `"channel"` (Ursprungsraum) oder `"both"`.
  - Pro-Konto-Überschreibungen: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` steuert, wie Matrix-DMs in Sitzungen gruppiert werden: `per-user` (Standard) teilt nach geroutetem Peer, während `per-room` jeden DM-Raum isoliert.
- Matrix-Statusprüfungen und Live-Verzeichnis-Lookups verwenden dieselbe Proxy-Richtlinie wie der Laufzeitdatenverkehr.
- Vollständige Matrix-Konfiguration, Zielregeln und Einrichtungsbeispiele sind in [Matrix](/de/channels/matrix) dokumentiert.

### Microsoft Teams

Microsoft Teams ist Plugin-gestützt und wird unter `channels.msteams` konfiguriert.

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, Webhook, Team-/Kanalrichtlinien:
      // siehe /channels/msteams
    },
  },
}
```

- Hier behandelte zentrale Schlüsselpfade: `channels.msteams`, `channels.msteams.configWrites`.
- Die vollständige Teams-Konfiguration (Anmeldedaten, Webhook, DM-/Gruppenrichtlinie, Überschreibungen pro Team/pro Kanal) ist in [Microsoft Teams](/de/channels/msteams) dokumentiert.

### IRC

IRC ist Plugin-gestützt und wird unter `channels.irc` konfiguriert.

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
- Optional überschreibt `channels.irc.defaultAccount` die Standardkontoauswahl, wenn sie einer konfigurierten Konto-ID entspricht.
- Die vollständige IRC-Kanalkonfiguration (Host/Port/TLS/Kanäle/Allowlists/Mention-Gating) ist in [IRC](/de/channels/irc) dokumentiert.

### Mehrere Konten (alle Kanäle)

Führen Sie mehrere Konten pro Kanal aus (jeweils mit eigener `accountId`):

```json5
{
  channels: {
    telegram: {
      accounts: {
        default: {
          name: "Primärer Bot",
          botToken: "123456:ABC...",
        },
        alerts: {
          name: "Alerts-Bot",
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
- Wenn Sie ein Nicht-Standardkonto über `openclaw channels add` (oder Kanal-Onboarding) hinzufügen, während Sie sich noch in einer Top-Level-Kanalkonfiguration für ein Einzelkonto befinden, überführt OpenClaw zuerst kontobezogene Top-Level-Werte des Einzelkontos in die Kontozuordnung des Kanals, damit das ursprüngliche Konto weiter funktioniert. Die meisten Kanäle verschieben sie nach `channels.<channel>.accounts.default`; Matrix kann stattdessen ein vorhandenes passendes benanntes/Standardziel beibehalten.
- Vorhandene nur-kanalbezogene Bindungen (ohne `accountId`) passen weiterhin auf das Standardkonto; kontobezogene Bindungen bleiben optional.
- `openclaw doctor --fix` repariert auch gemischte Strukturen, indem kontobezogene Top-Level-Werte des Einzelkontos in das für diesen Kanal ausgewählte überführte Konto verschoben werden. Die meisten Kanäle verwenden `accounts.default`; Matrix kann stattdessen ein vorhandenes passendes benanntes/Standardziel beibehalten.

### Andere Plugin-Kanäle

Viele Plugin-Kanäle werden als `channels.<id>` konfiguriert und in ihren jeweiligen Kanalseiten dokumentiert (zum Beispiel Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat und Twitch).
Siehe den vollständigen Kanalindex: [Channels](/de/channels).

### Mention-Gating in Gruppenchats

Gruppennachrichten erfordern standardmäßig eine **Erwähnung** (Metadaten-Erwähnung oder sichere Regex-Muster). Gilt für WhatsApp-, Telegram-, Discord-, Google Chat- und iMessage-Gruppenchats.

**Erwähnungstypen:**

- **Metadaten-Erwähnungen**: Native Plattform-@-Erwähnungen. Im WhatsApp-Self-Chat-Modus ignoriert.
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

`messages.groupChat.historyLimit` setzt den globalen Standard. Kanäle können mit `channels.<channel>.historyLimit` (oder pro Konto) überschreiben. Setzen Sie `0`, um es zu deaktivieren.

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

Auflösung: Überschreibung pro DM → Provider-Standard → kein Limit (alles wird beibehalten).

Unterstützt: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### Self-Chat-Modus

Fügen Sie Ihre eigene Nummer in `allowFrom` ein, um den Self-Chat-Modus zu aktivieren (ignoriert native @-Erwähnungen, antwortet nur auf Textmuster):

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

### Befehle (Chat-Befehlsverarbeitung)

```json5
{
  commands: {
    native: "auto", // native Befehle registrieren, wenn unterstützt
    nativeSkills: "auto", // native Skills-Befehle registrieren, wenn unterstützt
    text: true, // /commands in Chat-Nachrichten parsen
    bash: false, // ! erlauben (Alias: /bash)
    bashForegroundMs: 2000,
    config: false, // /config erlauben
    mcp: false, // /mcp erlauben
    plugins: false, // /plugins erlauben
    debug: false, // /debug erlauben
    restart: true, // /restart + gateway restart tool erlauben
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

- Dieser Block konfiguriert Befehlsoberflächen. Den aktuellen integrierten + gebündelten Befehlskatalog finden Sie unter [Slash Commands](/de/tools/slash-commands).
- Diese Seite ist eine **Referenz für Konfigurationsschlüssel**, nicht der vollständige Befehlskatalog. Kanal-/Plugin-eigene Befehle wie QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, device-pair `/pair`, Speicher `/dreaming`, phone-control `/phone` und Talk `/voice` sind in ihren Kanal-/Plugin-Seiten sowie unter [Slash Commands](/de/tools/slash-commands) dokumentiert.
- Textbefehle müssen **eigenständige** Nachrichten mit führendem `/` sein.
- `native: "auto"` aktiviert native Befehle für Discord/Telegram, lässt Slack deaktiviert.
- `nativeSkills: "auto"` aktiviert native Skills-Befehle für Discord/Telegram, lässt Slack deaktiviert.
- Überschreibung pro Kanal: `channels.discord.commands.native` (bool oder `"auto"`). `false` löscht zuvor registrierte Befehle.
- Überschreiben Sie die native Skills-Registrierung pro Kanal mit `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` fügt zusätzliche Telegram-Bot-Menüeinträge hinzu.
- `bash: true` aktiviert `! <cmd>` für die Host-Shell. Erfordert `tools.elevated.enabled` und den Absender in `tools.elevated.allowFrom.<channel>`.
- `config: true` aktiviert `/config` (liest/schreibt `openclaw.json`). Für Gateway-`chat.send`-Clients erfordern persistente `/config set|unset`-Schreibvorgänge zusätzlich `operator.admin`; schreibgeschütztes `/config show` bleibt für normale Operator-Clients mit Schreibbereich verfügbar.
- `mcp: true` aktiviert `/mcp` für von OpenClaw verwaltete MCP-Serverkonfiguration unter `mcp.servers`.
- `plugins: true` aktiviert `/plugins` für Plugin-Erkennung, Installation und Steuerung zum Aktivieren/Deaktivieren.
- `channels.<provider>.configWrites` steuert Konfigurationsmutationen pro Kanal (Standard: true).
- Für Kanäle mit mehreren Konten steuert `channels.<provider>.accounts.<id>.configWrites` auch Schreibvorgänge, die dieses Konto betreffen (zum Beispiel `/allowlist --config --account <id>` oder `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` deaktiviert `/restart` und Aktionen des gateway restart tool. Standard: `true`.
- `ownerAllowFrom` ist die explizite Owner-Allowlist für Befehle/Tools nur für den Owner. Sie ist getrennt von `allowFrom`.
- `ownerDisplay: "hash"` hasht Owner-IDs im System-Prompt. Setzen Sie `ownerDisplaySecret`, um das Hashing zu steuern.
- `allowFrom` ist pro Provider. Wenn gesetzt, ist es die **einzige** Autorisierungsquelle (Kanal-Allowlists/Pairing und `useAccessGroups` werden ignoriert).
- `useAccessGroups: false` erlaubt Befehlen, Zugriffgruppenrichtlinien zu umgehen, wenn `allowFrom` nicht gesetzt ist.
- Zuordnung der Befehlsdokumentation:
  - integrierter + gebündelter Katalog: [Slash Commands](/de/tools/slash-commands)
  - kanalspezifische Befehlsoberflächen: [Channels](/de/channels)
  - QQ Bot-Befehle: [QQ Bot](/de/channels/qqbot)
  - Pairing-Befehle: [Pairing](/de/channels/pairing)
  - LINE-Card-Befehl: [LINE](/de/channels/line)
  - Speicher-Dreaming: [Dreaming](/de/concepts/dreaming)

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

Optionales Repository-Root, das in der Runtime-Zeile des System-Prompts angezeigt wird. Wenn nicht gesetzt, erkennt OpenClaw es automatisch, indem vom Workspace aus nach oben gelaufen wird.

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
      { id: "writer" }, // erbt github, weather
      { id: "docs", skills: ["docs-search"] }, // ersetzt Standards
      { id: "locked-down", skills: [] }, // keine Skills
    ],
  },
}
```

- Lassen Sie `agents.defaults.skills` weg, um standardmäßig uneingeschränkte Skills zu haben.
- Lassen Sie `agents.list[].skills` weg, um die Standards zu erben.
- Setzen Sie `agents.list[].skills: []` für keine Skills.
- Eine nicht leere Liste in `agents.list[].skills` ist die endgültige Menge für diesen Agenten; sie wird nicht mit den Standards zusammengeführt.

### `agents.defaults.skipBootstrap`

Deaktiviert die automatische Erstellung von Workspace-Bootstrap-Dateien (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

Steuert, wann Workspace-Bootstrap-Dateien in den System-Prompt injiziert werden. Standard: `"always"`.

- `"continuation-skip"`: Sichere Fortsetzungs-Turns (nach einer abgeschlossenen Assistant-Antwort) überspringen die erneute Injektion des Workspace-Bootstraps und verringern so die Prompt-Größe. Heartbeat-Läufe und Wiederholungen nach Compaction bauen den Kontext weiterhin neu auf.

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

Maximale Zeichenanzahl pro Workspace-Bootstrap-Datei vor dem Kürzen. Standard: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Maximale Gesamtanzahl der injizierten Zeichen über alle Workspace-Bootstrap-Dateien hinweg. Standard: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Steuert den für den Agenten sichtbaren Warntext, wenn Bootstrap-Kontext gekürzt wird.
Standard: `"once"`.

- `"off"`: Niemals Warntext in den System-Prompt injizieren.
- `"once"`: Warnung einmal pro eindeutiger Kürzungssignatur injizieren (empfohlen).
- `"always"`: Warnung bei jedem Lauf injizieren, wenn eine Kürzung vorliegt.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### Zuordnung der Kontextbudget-Verantwortung

OpenClaw hat mehrere Prompt-/Kontextbudgets mit hohem Volumen, und sie sind
absichtlich nach Subsystem aufgeteilt, statt alle über einen generischen
Schalter laufen zu lassen.

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  normale Workspace-Bootstrap-Injektion.
- `agents.defaults.startupContext.*`:
  einmaliges Startup-Präludium für `/new` und `/reset`, einschließlich aktueller täglicher
  `memory/*.md`-Dateien.
- `skills.limits.*`:
  die kompakte Skills-Liste, die in den System-Prompt injiziert wird.
- `agents.defaults.contextLimits.*`:
  begrenzte Laufzeitauszüge und injizierte, der Laufzeit gehörende Blöcke.
- `memory.qmd.limits.*`:
  Größe von indexierten Speicher-Snippets und deren Injektion.

Verwenden Sie die passende Überschreibung pro Agent nur dann, wenn ein Agent ein anderes
Budget benötigt:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

Steuert das Startup-Präludium des ersten Turns, das bei bloßen `/new`- und `/reset`-Läufen injiziert wird.

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

- `memoryGetMaxChars`: Standardobergrenze für `memory_get`-Auszüge, bevor Metadaten zur Kürzung und ein Fortsetzungshinweis hinzugefügt werden.
- `memoryGetDefaultLines`: Standard-Zeilenfenster für `memory_get`, wenn `lines` weggelassen wird.
- `toolResultMaxChars`: Laufende Obergrenze für Tool-Ergebnisse, die für persistierte Ergebnisse und Overflow-Recovery verwendet wird.
- `postCompactionMaxChars`: Obergrenze für `AGENTS.md`-Auszüge, die bei der Aktualisierungsinjektion nach Compaction verwendet wird.

#### `agents.list[].contextLimits`

Überschreibung pro Agent für die gemeinsamen `contextLimits`-Schalter. Weggelassene Felder erben
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

Globale Obergrenze für die kompakte Skills-Liste, die in den System-Prompt injiziert wird. Dies
hat keinen Einfluss auf das Lesen von `SKILL.md`-Dateien bei Bedarf.

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

Niedrigere Werte reduzieren normalerweise die Nutzung von Vision-Token und die Größe der Request-Payload bei screenshotlastigen Läufen.
Höhere Werte bewahren mehr visuelle Details.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Zeitzone für den Kontext im System-Prompt (nicht für Nachrichten-Zeitstempel). Fällt auf die Host-Zeitzone zurück.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

Zeitformat im System-Prompt. Standard: `auto` (OS-Präferenz).

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
        primary: "openai/gpt-image-2",
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
  - Wird vom `image`-Toolpfad als dessen Vision-Modellkonfiguration verwendet.
  - Wird auch als Fallback-Routing verwendet, wenn das ausgewählte/Standardmodell keine Bildeingabe akzeptieren kann.
- `imageGenerationModel`: akzeptiert entweder einen String (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Wird von der gemeinsamen Bildgenerierungsfunktion und jeder zukünftigen Tool-/Plugin-Oberfläche verwendet, die Bilder erzeugt.
  - Typische Werte: `google/gemini-3.1-flash-image-preview` für native Gemini-Bildgenerierung, `fal/fal-ai/flux/dev` für fal oder `openai/gpt-image-2` für OpenAI Images.
  - Wenn Sie direkt einen Provider/ein Modell auswählen, konfigurieren Sie auch die passende Provider-Authentifizierung/API-Key dazu (zum Beispiel `GEMINI_API_KEY` oder `GOOGLE_API_KEY` für `google/*`, `OPENAI_API_KEY` für `openai/*`, `FAL_KEY` für `fal/*`).
  - Wenn nicht gesetzt, kann `image_generate` weiterhin einen authentifizierungsbasierten Provider-Standard ableiten. Es versucht zuerst den aktuellen Standard-Provider, dann die verbleibenden registrierten Bildgenerierungs-Provider in der Reihenfolge ihrer Provider-IDs.
- `musicGenerationModel`: akzeptiert entweder einen String (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Wird von der gemeinsamen Musikgenerierungsfunktion und dem integrierten Tool `music_generate` verwendet.
  - Typische Werte: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` oder `minimax/music-2.5+`.
  - Wenn nicht gesetzt, kann `music_generate` weiterhin einen authentifizierungsbasierten Provider-Standard ableiten. Es versucht zuerst den aktuellen Standard-Provider, dann die verbleibenden registrierten Musikgenerierungs-Provider in der Reihenfolge ihrer Provider-IDs.
  - Wenn Sie direkt einen Provider/ein Modell auswählen, konfigurieren Sie auch die passende Provider-Authentifizierung/API-Key dazu.
- `videoGenerationModel`: akzeptiert entweder einen String (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Wird von der gemeinsamen Videogenerierungsfunktion und dem integrierten Tool `video_generate` verwendet.
  - Typische Werte: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` oder `qwen/wan2.7-r2v`.
  - Wenn nicht gesetzt, kann `video_generate` weiterhin einen authentifizierungsbasierten Provider-Standard ableiten. Es versucht zuerst den aktuellen Standard-Provider, dann die verbleibenden registrierten Videogenerierungs-Provider in der Reihenfolge ihrer Provider-IDs.
  - Wenn Sie direkt einen Provider/ein Modell auswählen, konfigurieren Sie auch die passende Provider-Authentifizierung/API-Key dazu.
  - Der gebündelte Qwen-Videogenerierungs-Provider unterstützt bis zu 1 Ausgabevideo, 1 Eingabebild, 4 Eingabevideos, 10 Sekunden Dauer sowie Provider-Level-Optionen für `size`, `aspectRatio`, `resolution`, `audio` und `watermark`.
- `pdfModel`: akzeptiert entweder einen String (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Wird vom `pdf`-Tool für Modell-Routing verwendet.
  - Wenn nicht gesetzt, fällt das PDF-Tool auf `imageModel` und dann auf das aufgelöste Sitzungs-/Standardmodell zurück.
- `pdfMaxBytesMb`: Standard-PDF-Größenlimit für das `pdf`-Tool, wenn `maxBytesMb` beim Aufruf nicht übergeben wird.
- `pdfMaxPages`: Standardmäßige maximale Seitenzahl, die vom Extraktions-Fallback-Modus im `pdf`-Tool berücksichtigt wird.
- `verboseDefault`: Standard-Verbose-Stufe für Agenten. Werte: `"off"`, `"on"`, `"full"`. Standard: `"off"`.
- `elevatedDefault`: Standardstufe für erhöhte Ausgabe für Agenten. Werte: `"off"`, `"on"`, `"ask"`, `"full"`. Standard: `"on"`.
- `model.primary`: Format `provider/model` (z. B. `openai/gpt-5.4`). Wenn Sie den Provider weglassen, versucht OpenClaw zuerst einen Alias, dann eine eindeutige configured-provider-Übereinstimmung für genau diese Modell-ID und greift erst dann auf den konfigurierten Standard-Provider zurück (veraltetes Kompatibilitätsverhalten, daher bevorzugt explizit `provider/model`). Wenn dieser Provider das konfigurierte Standardmodell nicht mehr bereitstellt, fällt OpenClaw stattdessen auf das erste konfigurierte Provider-/Modell zurück, statt einen veralteten entfernten Provider-Standard anzuzeigen.
- `models`: der konfigurierte Modellkatalog und die Allowlist für `/model`. Jeder Eintrag kann `alias` (Abkürzung) und `params` (Provider-spezifisch, zum Beispiel `temperature`, `maxTokens`, `cacheRetention`, `context1m`) enthalten.
- `params`: globale Standard-Provider-Parameter, die auf alle Modelle angewendet werden. Setzen Sie sie unter `agents.defaults.params` (z. B. `{ cacheRetention: "long" }`).
- Merge-Priorität von `params` (Konfiguration): `agents.defaults.params` (globale Basis) wird durch `agents.defaults.models["provider/model"].params` (pro Modell) überschrieben, dann überschreibt `agents.list[].params` (passende Agent-ID) schlüsselweise. Details finden Sie unter [Prompt Caching](/de/reference/prompt-caching).
- `embeddedHarness`: Standardrichtlinie für die Low-Level-Laufzeit eingebetteter Agenten. Verwenden Sie `runtime: "auto"`, damit registrierte Plugin-Harnesses unterstützte Modelle beanspruchen können, `runtime: "pi"`, um die integrierte PI-Harness zu erzwingen, oder eine registrierte Harness-ID wie `runtime: "codex"`. Setzen Sie `fallback: "none"`, um den automatischen PI-Fallback zu deaktivieren.
- Konfigurationsschreiber, die diese Felder verändern (zum Beispiel `/models set`, `/models set-image` und Befehle zum Hinzufügen/Entfernen von Fallbacks), speichern die kanonische Objektform und bewahren bestehende Fallback-Listen nach Möglichkeit.
- `maxConcurrent`: maximale parallele Agent-Läufe über Sitzungen hinweg (jede Sitzung bleibt weiterhin serialisiert). Standard: 4.

### `agents.defaults.embeddedHarness`

`embeddedHarness` steuert, welcher Low-Level-Executor eingebettete Agent-Turns ausführt.
Die meisten Deployments sollten den Standard `{ runtime: "auto", fallback: "pi" }` beibehalten.
Verwenden Sie dies, wenn ein vertrauenswürdiges Plugin eine native Harness bereitstellt, wie etwa die gebündelte
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
- `fallback`: `"pi"` oder `"none"`. `"pi"` behält die integrierte PI-Harness als Kompatibilitäts-Fallback bei, wenn keine Plugin-Harness ausgewählt ist. `"none"` führt dazu, dass eine fehlende oder nicht unterstützte Plugin-Harness-Auswahl fehlschlägt, statt stillschweigend PI zu verwenden. Fehler der ausgewählten Plugin-Harness werden immer direkt angezeigt.
- Umgebungsüberschreibungen: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` überschreibt `runtime`; `OPENCLAW_AGENT_HARNESS_FALLBACK=none` deaktiviert den PI-Fallback für diesen Prozess.
- Für reine Codex-Deployments setzen Sie `model: "codex/gpt-5.4"`, `embeddedHarness.runtime: "codex"` und `embeddedHarness.fallback: "none"`.
- Dies steuert nur die eingebettete Chat-Harness. Mediengenerierung, Vision, PDF, Musik, Video und TTS verwenden weiterhin ihre Provider-/Modelleinstellungen.

**Integrierte Alias-Kurzformen** (gelten nur, wenn das Modell in `agents.defaults.models` enthalten ist):

| Alias               | Modell                                 |
| ------------------- | -------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`            |
| `sonnet`            | `anthropic/claude-sonnet-4-6`          |
| `gpt`               | `openai/gpt-5.4`                       |
| `gpt-mini`          | `openai/gpt-5.4-mini`                  |
| `gpt-nano`          | `openai/gpt-5.4-nano`                  |
| `gemini`            | `google/gemini-3.1-pro-preview`        |
| `gemini-flash`      | `google/gemini-3-flash-preview`        |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview` |

Ihre konfigurierten Aliasse haben immer Vorrang vor den Standardwerten.

Z.AI-GLM-4.x-Modelle aktivieren den Thinking-Modus automatisch, sofern Sie nicht `--thinking off` setzen oder `agents.defaults.models["zai/<model>"].params.thinking` selbst definieren.
Z.AI-Modelle aktivieren standardmäßig `tool_stream` für Tool-Call-Streaming. Setzen Sie `agents.defaults.models["zai/<model>"].params.tool_stream` auf `false`, um dies zu deaktivieren.
Anthropic-Claude-4.6-Modelle verwenden standardmäßig `adaptive` Thinking, wenn keine explizite Thinking-Stufe gesetzt ist.

### `agents.defaults.cliBackends`

Optionale CLI-Backends für reine Text-Fallback-Läufe (ohne Tool-Aufrufe). Nützlich als Backup, wenn API-Provider ausfallen.

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
- Bild-Durchreichung wird unterstützt, wenn `imageArg` Dateipfade akzeptiert.

### `agents.defaults.systemPromptOverride`

Ersetzt den gesamten von OpenClaw zusammengestellten System-Prompt durch einen festen String. Setzen Sie ihn auf Standardebene (`agents.defaults.systemPromptOverride`) oder pro Agent (`agents.list[].systemPromptOverride`). Werte pro Agent haben Vorrang; ein leerer oder nur aus Leerraum bestehender Wert wird ignoriert. Nützlich für kontrollierte Prompt-Experimente.

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

- `every`: Dauer-String (ms/s/m/h). Standard: `30m` (API-Key-Auth) oder `1h` (OAuth-Auth). Setzen Sie `0m`, um zu deaktivieren.
- `includeSystemPromptSection`: Wenn false, wird der Heartbeat-Abschnitt im System-Prompt weggelassen und die Injektion von `HEARTBEAT.md` in den Bootstrap-Kontext übersprungen. Standard: `true`.
- `suppressToolErrorWarnings`: Wenn true, werden Warn-Payloads für Tool-Fehler während Heartbeat-Läufen unterdrückt.
- `timeoutSeconds`: maximale Zeit in Sekunden, die einem Heartbeat-Agent-Turn erlaubt ist, bevor er abgebrochen wird. Nicht gesetzt verwendet `agents.defaults.timeoutSeconds`.
- `directPolicy`: Richtlinie für direkte/DM-Zustellung. `allow` (Standard) erlaubt direkte Zielzustellung. `block` unterdrückt direkte Zielzustellung und erzeugt `reason=dm-blocked`.
- `lightContext`: Wenn true, verwenden Heartbeat-Läufe einen leichtgewichtigen Bootstrap-Kontext und behalten nur `HEARTBEAT.md` aus den Workspace-Bootstrap-Dateien.
- `isolatedSession`: Wenn true, wird jeder Heartbeat in einer frischen Sitzung ohne vorherigen Gesprächsverlauf ausgeführt. Dasselbe Isolationsmuster wie bei Cron `sessionTarget: "isolated"`. Reduziert die Token-Kosten pro Heartbeat von etwa 100K auf etwa 2–5K Token.
- Pro Agent: setzen Sie `agents.list[].heartbeat`. Wenn irgendein Agent `heartbeat` definiert, führen **nur diese Agenten** Heartbeats aus.
- Heartbeats führen vollständige Agent-Turns aus — kürzere Intervalle verbrauchen mehr Token.

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
        postCompactionSections: ["Session Startup", "Red Lines"], // [] deaktiviert erneute Injektion
        model: "openrouter/anthropic/claude-sonnet-4-6", // optionale nur für Compaction geltende Modellüberschreibung
        notifyUser: true, // kurze Hinweise senden, wenn Compaction startet und abgeschlossen wird (Standard: false)
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "Sitzung nähert sich Compaction. Dauerhafte Erinnerungen jetzt speichern.",
          prompt: "Schreiben Sie alle dauerhaften Notizen in memory/YYYY-MM-DD.md; antworten Sie mit dem exakten stillen Token NO_REPLY, wenn nichts zu speichern ist.",
        },
      },
    },
  },
}
```

- `mode`: `default` oder `safeguard` (chunkweise Zusammenfassung für lange Verläufe). Siehe [Compaction](/de/concepts/compaction).
- `provider`: ID eines registrierten Compaction-Provider-Plugins. Wenn gesetzt, wird `summarize()` des Providers anstelle der integrierten LLM-Zusammenfassung aufgerufen. Fällt bei Fehlern auf die integrierte Variante zurück. Das Setzen eines Providers erzwingt `mode: "safeguard"`. Siehe [Compaction](/de/concepts/compaction).
- `timeoutSeconds`: maximale Anzahl an Sekunden, die eine einzelne Compaction-Operation dauern darf, bevor OpenClaw sie abbricht. Standard: `900`.
- `identifierPolicy`: `strict` (Standard), `off` oder `custom`. `strict` stellt bei der Compaction-Zusammenfassung integrierte Hinweise zum Beibehalten opaker Bezeichner voran.
- `identifierInstructions`: optionaler benutzerdefinierter Text zur Beibehaltung von Bezeichnern, verwendet wenn `identifierPolicy=custom`.
- `postCompactionSections`: optionale H2/H3-Abschnittsnamen aus `AGENTS.md`, die nach Compaction erneut injiziert werden. Standard ist `["Session Startup", "Red Lines"]`; setzen Sie `[]`, um die erneute Injektion zu deaktivieren. Wenn nicht gesetzt oder explizit auf dieses Standardpaar gesetzt, werden ältere Überschriften `Every Session`/`Safety` zusätzlich als Legacy-Fallback akzeptiert.
- `model`: optionale `provider/model-id`-Überschreibung nur für die Compaction-Zusammenfassung. Verwenden Sie dies, wenn die Hauptsitzung ein Modell behalten soll, Compaction-Zusammenfassungen aber mit einem anderen Modell laufen sollen; wenn nicht gesetzt, verwendet Compaction das primäre Modell der Sitzung.
- `notifyUser`: wenn `true`, sendet kurze Hinweise an den Benutzer, wenn Compaction startet und abgeschlossen ist (zum Beispiel „Kontext wird komprimiert...“ und „Compaction abgeschlossen“). Standardmäßig deaktiviert, damit Compaction still bleibt.
- `memoryFlush`: stiller agentischer Turn vor automatischer Compaction, um dauerhafte Erinnerungen zu speichern. Wird übersprungen, wenn der Workspace schreibgeschützt ist.

### `agents.defaults.contextPruning`

Beschneidet **alte Tool-Ergebnisse** aus dem In-Memory-Kontext, bevor er an das LLM gesendet wird. Ändert **nicht** den Sitzungsverlauf auf der Festplatte.

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
        hardClear: { enabled: true, placeholder: "[Alter Tool-Ergebnisinhalt entfernt]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="Verhalten des cache-ttl-Modus">

- `mode: "cache-ttl"` aktiviert Beschneidungsdurchläufe.
- `ttl` steuert, wie oft die Beschneidung erneut laufen kann (nach der letzten Cache-Berührung).
- Die Beschneidung kürzt zuerst übergroße Tool-Ergebnisse weich und löscht dann bei Bedarf ältere Tool-Ergebnisse hart.

**Soft-Trim** behält Anfang + Ende und fügt in der Mitte `...` ein.

**Hard-Clear** ersetzt das gesamte Tool-Ergebnis durch den Platzhalter.

Hinweise:

- Bildblöcke werden nie gekürzt/gelöscht.
- Verhältnisse basieren auf Zeichen (näherungsweise), nicht auf exakten Token-Anzahlen.
- Wenn weniger als `keepLastAssistants` Assistant-Nachrichten vorhanden sind, wird die Beschneidung übersprungen.

</Accordion>

Details zum Verhalten finden Sie unter [Session Pruning](/de/concepts/session-pruning).

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
- Kanal-Überschreibungen: `channels.<channel>.blockStreamingCoalesce` (und Varianten pro Konto). Signal/Slack/Discord/Google Chat verwenden standardmäßig `minChars: 1500`.
- `humanDelay`: zufällige Pause zwischen Block-Antworten. `natural` = 800–2500ms. Überschreibung pro Agent: `agents.list[].humanDelay`.

Details zu Verhalten + Chunking finden Sie unter [Streaming](/de/concepts/streaming).

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

Siehe [Typing Indicators](/de/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Optionale Sandbox-Isolierung für den eingebetteten Agenten. Die vollständige Anleitung finden Sie unter [Sandboxing](/de/gateway/sandboxing).

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
- `strictHostKeyChecking` / `updateHostKeys`: OpenSSH-Schalter für die Host-Key-Richtlinie

**Priorität der SSH-Authentifizierung:**

- `identityData` hat Vorrang vor `identityFile`
- `certificateData` hat Vorrang vor `certificateFile`
- `knownHostsData` hat Vorrang vor `knownHostsFile`
- SecretRef-gestützte `*Data`-Werte werden aus dem aktiven Laufzeit-Snapshot der Secrets aufgelöst, bevor die Sandbox-Sitzung startet

**Verhalten des SSH-Backends:**

- initialisiert den Remote-Workspace einmal nach Erstellen oder Neuerstellen
- behält danach den Remote-SSH-Workspace als kanonisch bei
- leitet `exec`, Datei-Tools und Medienpfade über SSH
- synchronisiert Remote-Änderungen nicht automatisch zurück auf den Host
- unterstützt keine Sandbox-Browser-Container

**Workspace-Zugriff:**

- `none`: Workspace der Sandbox pro Scope unter `~/.openclaw/sandboxes`
- `ro`: Sandbox-Workspace unter `/workspace`, Agent-Workspace schreibgeschützt unter `/agent` eingehängt
- `rw`: Agent-Workspace schreib-/lesbar unter `/workspace` eingehängt

**Scope:**

- `session`: Container + Workspace pro Sitzung
- `agent`: ein Container + Workspace pro Agent (Standard)
- `shared`: gemeinsamer Container und Workspace (keine sitzungsübergreifende Isolierung)

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
          policy: "strict", // optionale OpenShell-Policy-ID
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

- `mirror`: Remote vor `exec` aus lokalem Stand initialisieren, nach `exec` zurücksynchronisieren; lokaler Workspace bleibt kanonisch
- `remote`: Remote einmal initialisieren, wenn die Sandbox erstellt wird, danach den Remote-Workspace als kanonisch beibehalten

Im `remote`-Modus werden Host-lokale Änderungen, die außerhalb von OpenClaw vorgenommen werden, nach dem Initialisierungsschritt nicht automatisch in die Sandbox synchronisiert.
Der Transport erfolgt per SSH in die OpenShell-Sandbox, aber das Plugin besitzt den Sandbox-Lebenszyklus und die optionale Spiegel-Synchronisierung.

**`setupCommand`** wird einmal nach der Container-Erstellung ausgeführt (über `sh -lc`). Benötigt Netzwerk-Egress, beschreibbares Root, Root-Benutzer.

**Container verwenden standardmäßig `network: "none"`** — setzen Sie es auf `"bridge"` (oder ein benutzerdefiniertes Bridge-Netzwerk), wenn der Agent ausgehenden Zugriff benötigt.
`"host"` ist blockiert. `"container:<id>"` ist standardmäßig blockiert, es sei denn, Sie setzen explizit
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (Break-Glass).

**Eingehende Anhänge** werden in `media/inbound/*` im aktiven Workspace abgelegt.

**`docker.binds`** hängt zusätzliche Host-Verzeichnisse ein; globale und agentbezogene Binds werden zusammengeführt.

**Sandboxed browser** (`sandbox.browser.enabled`): Chromium + CDP in einem Container. Die noVNC-URL wird in den System-Prompt injiziert. Erfordert kein `browser.enabled` in `openclaw.json`.
noVNC-Beobachterzugriff verwendet standardmäßig VNC-Authentifizierung, und OpenClaw gibt eine URL mit kurzlebigem Token aus (statt das Passwort in der gemeinsam genutzten URL offenzulegen).

- `allowHostControl: false` (Standard) blockiert, dass Sandbox-Sitzungen den Host-Browser ansprechen.
- `network` ist standardmäßig `openclaw-sandbox-browser` (dediziertes Bridge-Netzwerk). Setzen Sie es nur dann auf `bridge`, wenn Sie ausdrücklich globale Bridge-Konnektivität wünschen.
- `cdpSourceRange` beschränkt optional den CDP-Ingress am Container-Rand auf einen CIDR-Bereich (zum Beispiel `172.21.0.1/32`).
- `sandbox.browser.binds` hängt zusätzliche Host-Verzeichnisse nur in den Sandbox-Browser-Container ein. Wenn gesetzt (einschließlich `[]`), ersetzt es `docker.binds` für den Browser-Container.
- Start-Standardwerte sind in `scripts/sandbox-browser-entrypoint.sh` definiert und für Container-Hosts abgestimmt:
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<abgeleitet aus OPENCLAW_BROWSER_CDP_PORT>`
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
    davon abhängt.
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
        name: "Hauptagent",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // oder { primary, fallbacks }
        thinkingDefault: "high", // Überschreibung der Standard-Thinking-Stufe pro Agent
        reasoningDefault: "on", // Überschreibung der Standard-Sichtbarkeit von Reasoning pro Agent
        fastModeDefault: false, // Überschreibung des Standard-Schnellmodus pro Agent
        embeddedHarness: { runtime: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // überschreibt passende defaults.models-Parameter schlüsselweise
        skills: ["docs-search"], // ersetzt agents.defaults.skills, wenn gesetzt
        identity: {
          name: "Samantha",
          theme: "hilfsames Faultier",
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
- `default`: wenn mehrere gesetzt sind, gewinnt der erste (Warnung wird protokolliert). Wenn keiner gesetzt ist, ist der erste Listeneintrag der Standard.
- `model`: Die String-Form überschreibt nur `primary`; die Objekt-Form `{ primary, fallbacks }` überschreibt beides (`[]` deaktiviert globale Fallbacks). Cron-Jobs, die nur `primary` überschreiben, erben weiterhin die Standard-Fallbacks, sofern Sie nicht `fallbacks: []` setzen.
- `params`: Stream-Parameter pro Agent, die über den ausgewählten Modelleintrag in `agents.defaults.models` zusammengeführt werden. Verwenden Sie dies für agentenspezifische Überschreibungen wie `cacheRetention`, `temperature` oder `maxTokens`, ohne den gesamten Modellkatalog zu duplizieren.
- `skills`: optionale Skills-Allowlist pro Agent. Wenn weggelassen, erbt der Agent `agents.defaults.skills`, falls gesetzt; eine explizite Liste ersetzt die Standards, statt mit ihnen zusammengeführt zu werden, und `[]` bedeutet keine Skills.
- `thinkingDefault`: optionale Standard-Thinking-Stufe pro Agent (`off | minimal | low | medium | high | xhigh | adaptive | max`). Überschreibt `agents.defaults.thinkingDefault` für diesen Agenten, wenn keine Überschreibung pro Nachricht oder Sitzung gesetzt ist.
- `reasoningDefault`: optionale Standard-Sichtbarkeit von Reasoning pro Agent (`on | off | stream`). Gilt, wenn keine Reasoning-Überschreibung pro Nachricht oder Sitzung gesetzt ist.
- `fastModeDefault`: optionale Standardeinstellung pro Agent für den Schnellmodus (`true | false`). Gilt, wenn keine Überschreibung des Schnellmodus pro Nachricht oder Sitzung gesetzt ist.
- `embeddedHarness`: optionale Überschreibung der Low-Level-Harness-Richtlinie pro Agent. Verwenden Sie `{ runtime: "codex", fallback: "none" }`, um einen Agenten nur mit Codex zu betreiben, während andere Agenten den Standard-PI-Fallback behalten.
- `runtime`: optionaler Runtime-Deskriptor pro Agent. Verwenden Sie `type: "acp"` mit `runtime.acp`-Standards (`agent`, `backend`, `mode`, `cwd`), wenn der Agent standardmäßig ACP-Harness-Sitzungen verwenden soll.
- `identity.avatar`: relativ zum Workspace angegebener Pfad, `http(s)`-URL oder `data:`-URI.
- `identity` leitet Standardwerte ab: `ackReaction` aus `emoji`, `mentionPatterns` aus `name`/`emoji`.
- `subagents.allowAgents`: Allowlist von Agent-IDs für `sessions_spawn` (`["*"]` = beliebig; Standard: nur derselbe Agent).
- Schutzregel für Sandbox-Vererbung: Wenn die anfragende Sitzung in einer Sandbox läuft, lehnt `sessions_spawn` Ziele ab, die unsandboxed laufen würden.
- `subagents.requireAgentId`: wenn true, blockiert `sessions_spawn`-Aufrufe, die `agentId` weglassen (erzwingt explizite Profilauswahl; Standard: false).

---

## Routing für mehrere Agenten

Führen Sie mehrere isolierte Agenten in einem Gateway aus. Siehe [Multi-Agent](/de/concepts/multi-agent).

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

### `match`-Felder für Bindungen

- `type` (optional): `route` für normales Routing (fehlender Typ verwendet standardmäßig `route`), `acp` für persistente ACP-Konversationsbindungen.
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

Innerhalb jeder Stufe gewinnt der erste passende `bindings`-Eintrag.

Für Einträge mit `type: "acp"` löst OpenClaw anhand der exakten Konversationsidentität auf (`match.channel` + Konto + `match.peer.id`) und verwendet nicht die oben angegebene Stufenreihenfolge für Routing-Bindungen.

### Zugriffsprofile pro Agent

<Accordion title="Vollzugriff (keine Sandbox)">

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

Details zur Priorität finden Sie unter [Multi-Agent Sandbox & Tools](/de/tools/multi-agent-sandbox-tools).

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
      highWaterBytes: "400mb", // optionales Cleanup-Ziel
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // Standard für automatische Entfokussierung bei Inaktivität in Stunden (`0` deaktiviert)
      maxAgeHours: 0, // Standard für harte maximale Lebensdauer in Stunden (`0` deaktiviert)
    },
    mainKey: "main", // Legacy (Laufzeit verwendet immer "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="Details zu Sitzungsfeldern">

- **`scope`**: grundlegende Strategie zur Sitzungsgruppierung für Gruppenchats.
  - `per-sender` (Standard): Jeder Absender erhält eine isolierte Sitzung innerhalb eines Kanalkontexts.
  - `global`: Alle Teilnehmer in einem Kanalkontext teilen eine einzelne Sitzung (nur verwenden, wenn gemeinsamer Kontext beabsichtigt ist).
- **`dmScope`**: wie DMs gruppiert werden.
  - `main`: Alle DMs teilen die Hauptsitzung.
  - `per-peer`: Isolierung nach Absender-ID kanalübergreifend.
  - `per-channel-peer`: Isolierung pro Kanal + Absender (empfohlen für Multi-User-Inboxen).
  - `per-account-channel-peer`: Isolierung pro Konto + Kanal + Absender (empfohlen für mehrere Konten).
- **`identityLinks`**: Zuordnung kanonischer IDs zu mit Provider-Präfix versehenen Peers für sitzungsübergreifende Freigabe zwischen Kanälen.
- **`reset`**: primäre Reset-Richtlinie. `daily` setzt zur lokalen Zeit `atHour` zurück; `idle` setzt nach `idleMinutes` zurück. Wenn beides konfiguriert ist, gewinnt das zuerst ablaufende.
- **`resetByType`**: Überschreibungen pro Typ (`direct`, `group`, `thread`). Legacy-`dm` wird als Alias für `direct` akzeptiert.
- **`parentForkMaxTokens`**: maximale `totalTokens` der Elternsitzung, die beim Erstellen einer verzweigten Thread-Sitzung erlaubt sind (Standard `100000`).
  - Liegt `totalTokens` der Elternsitzung über diesem Wert, startet OpenClaw eine neue Thread-Sitzung, statt den Verlauf des übergeordneten Transkripts zu erben.
  - Setzen Sie `0`, um diese Schutzregel zu deaktivieren und Parent-Forking immer zu erlauben.
- **`mainKey`**: Legacy-Feld. Die Laufzeit verwendet immer `"main"` für den Haupt-Bucket direkter Chats.
- **`agentToAgent.maxPingPongTurns`**: maximale Antwort-zurück-Turns zwischen Agenten bei Agent-zu-Agent-Austausch (Ganzzahl, Bereich: `0`–`5`). `0` deaktiviert Ping-Pong-Verkettung.
- **`sendPolicy`**: Match anhand von `channel`, `chatType` (`direct|group|channel`, mit Legacy-Alias `dm`), `keyPrefix` oder `rawKeyPrefix`. Das erste Deny gewinnt.
- **`maintenance`**: Cleanup- + Aufbewahrungssteuerung für den Sitzungsspeicher.
  - `mode`: `warn` gibt nur Warnungen aus; `enforce` wendet Cleanup an.
  - `pruneAfter`: Altersgrenze für veraltete Einträge (Standard `30d`).
  - `maxEntries`: maximale Anzahl von Einträgen in `sessions.json` (Standard `500`).
  - `rotateBytes`: rotiert `sessions.json`, wenn diese Größe überschritten wird (Standard `10mb`).
  - `resetArchiveRetention`: Aufbewahrung für `*.reset.<timestamp>`-Transkriptarchive. Standardmäßig wie `pruneAfter`; setzen Sie `false`, um zu deaktivieren.
  - `maxDiskBytes`: optionales Festplattenbudget für das Sitzungsverzeichnis. Im Modus `warn` werden Warnungen protokolliert; im Modus `enforce` werden zuerst die ältesten Artefakte/Sitzungen entfernt.
  - `highWaterBytes`: optionales Ziel nach Budget-Cleanup. Standardmäßig `80%` von `maxDiskBytes`.
- **`threadBindings`**: globale Standardwerte für threadgebundene Sitzungsfunktionen.
  - `enabled`: globaler Standardschalter (Provider können überschreiben; Discord verwendet `channels.discord.threadBindings.enabled`)
  - `idleHours`: Standard für automatische Entfokussierung bei Inaktivität in Stunden (`0` deaktiviert; Provider können überschreiben)
  - `maxAgeHours`: Standard für harte maximale Lebensdauer in Stunden (`0` deaktiviert; Provider können überschreiben)

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

### Antwortpräfix

Überschreibungen pro Kanal/Konto: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Auflösung (spezifischster Wert gewinnt): Konto → Kanal → global. `""` deaktiviert und stoppt die Kaskade. `"auto"` leitet `[{identity.name}]` ab.

**Template-Variablen:**

| Variable          | Beschreibung           | Beispiel                    |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | Kurzer Modellname      | `claude-opus-4-6`           |
| `{modelFull}`     | Vollständige Modellkennung | `anthropic/claude-opus-4-6` |
| `{provider}`      | Provider-Name          | `anthropic`                 |
| `{thinkingLevel}` | Aktuelle Thinking-Stufe | `high`, `low`, `off`       |
| `{identity.name}` | Name der Agentenidentität | (gleich wie `"auto"`)     |

Variablen sind nicht case-sensitiv. `{think}` ist ein Alias für `{thinkingLevel}`.

### Bestätigungsreaktion

- Standardmäßig das `identity.emoji` des aktiven Agenten, andernfalls `"👀"`. Setzen Sie `""`, um zu deaktivieren.
- Überschreibungen pro Kanal: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Auflösungsreihenfolge: Konto → Kanal → `messages.ackReaction` → Identity-Fallback.
- Scope: `group-mentions` (Standard), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: entfernt die Bestätigungsreaktion nach der Antwort auf Slack, Discord und Telegram.
- `messages.statusReactions.enabled`: aktiviert Lifecycle-Statusreaktionen auf Slack, Discord und Telegram.
  Auf Slack und Discord bleiben Statusreaktionen ohne gesetzten Wert aktiviert, wenn Bestätigungsreaktionen aktiv sind.
  Auf Telegram müssen Sie es explizit auf `true` setzen, um Lifecycle-Statusreaktionen zu aktivieren.

### Inbound-Debounce

Bündelt schnelle reine Textnachrichten desselben Absenders zu einem einzigen Agent-Turn. Medien/Anhänge werden sofort geleert. Steuerbefehle umgehen Debouncing.

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

- `auto` steuert den Standardmodus für Auto-TTS: `off`, `always`, `inbound` oder `tagged`. `/tts on|off` kann lokale Präferenzen überschreiben, und `/tts status` zeigt den effektiven Status.
- `summaryModel` überschreibt `agents.defaults.model.primary` für die automatische Zusammenfassung.
- `modelOverrides` ist standardmäßig aktiviert; `modelOverrides.allowProvider` ist standardmäßig `false` (Opt-in).
- API-Keys greifen auf `ELEVENLABS_API_KEY`/`XI_API_KEY` und `OPENAI_API_KEY` als Fallback zurück.
- `openai.baseUrl` überschreibt den OpenAI-TTS-Endpunkt. Auflösungsreihenfolge: Konfiguration, dann `OPENAI_TTS_BASE_URL`, dann `https://api.openai.com/v1`.
- Wenn `openai.baseUrl` auf einen Nicht-OpenAI-Endpunkt zeigt, behandelt OpenClaw ihn als OpenAI-kompatiblen TTS-Server und lockert die Modell-/Stimmenvalidierung.

---

## Talk

Standardwerte für den Talk-Modus (macOS/iOS/Android).

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

- `talk.provider` muss einem Schlüssel in `talk.providers` entsprechen, wenn mehrere Talk-Provider konfiguriert sind.
- Legacy-flache Talk-Schlüssel (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) dienen nur der Kompatibilität und werden automatisch nach `talk.providers.<provider>` migriert.
- Voice-IDs greifen auf `ELEVENLABS_VOICE_ID` oder `SAG_VOICE_ID` als Fallback zurück.
- `providers.*.apiKey` akzeptiert Klartextzeichenfolgen oder SecretRef-Objekte.
- Der Fallback `ELEVENLABS_API_KEY` gilt nur, wenn kein Talk-API-Key konfiguriert ist.
- `providers.*.voiceAliases` erlaubt die Verwendung freundlicher Namen in Talk-Direktiven.
- `silenceTimeoutMs` steuert, wie lange der Talk-Modus nach der Stille des Benutzers wartet, bevor er das Transkript sendet. Wenn nicht gesetzt, bleibt das plattformspezifische Standard-Pausenfenster erhalten (`700 ms auf macOS und Android, 900 ms auf iOS`).

---

## Tools

### Tool-Profile

`tools.profile` setzt eine Basis-Allowlist vor `tools.allow`/`tools.deny`:

Lokales Onboarding setzt neue lokale Konfigurationen standardmäßig auf `tools.profile: "coding"`, wenn nichts gesetzt ist (bestehende explizite Profile bleiben erhalten).

| Profil      | Enthält                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | nur `session_status`                                                                                                           |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                      |
| `full`      | Keine Einschränkung (wie nicht gesetzt)                                                                                        |

### Tool-Gruppen

| Gruppe             | Tools                                                                                                                  |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` wird als Alias für `exec` akzeptiert)                                     |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                 |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                          |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                  |
| `group:ui`         | `browser`, `canvas`                                                                                                    |
| `group:automation` | `cron`, `gateway`                                                                                                      |
| `group:messaging`  | `message`                                                                                                              |
| `group:nodes`      | `nodes`                                                                                                                |
| `group:agents`     | `agents_list`                                                                                                          |
| `group:media`      | `image`, `image_generate`, `video_generate`, `tts`                                                                     |
| `group:openclaw`   | Alle integrierten Tools (Provider-Plugins ausgeschlossen)                                                              |

### `tools.allow` / `tools.deny`

Globale Tool-Allow-/Deny-Richtlinie (Deny gewinnt). Nicht case-sensitiv, unterstützt `*`-Wildcards. Wird auch angewendet, wenn die Docker-Sandbox deaktiviert ist.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

Schränkt Tools für bestimmte Provider oder Modelle weiter ein. Reihenfolge: Basisprofil → Provider-Profil → Allow/Deny.

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

Steuert erhöhten `exec`-Zugriff außerhalb der Sandbox:

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

- Die Überschreibung pro Agent (`agents.list[].tools.elevated`) kann nur weiter einschränken.
- `/elevated on|off|ask|full` speichert den Zustand pro Sitzung; Inline-Direktiven gelten nur für die einzelne Nachricht.
- Erhöhtes `exec` umgeht die Sandbox-Isolierung und verwendet den konfigurierten Escape-Pfad (`gateway` standardmäßig oder `node`, wenn das `exec`-Ziel `node` ist).

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

Sicherheitsprüfungen für Tool-Schleifen sind standardmäßig **deaktiviert**. Setzen Sie `enabled: true`, um die Erkennung zu aktivieren.
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
- `warningThreshold`: Schwellenwert für Warnungen bei wiederholten Mustern ohne Fortschritt.
- `criticalThreshold`: höherer Wiederholungsschwellenwert zum Blockieren kritischer Schleifen.
- `globalCircuitBreakerThreshold`: harte Stoppschwelle für jeden Lauf ohne Fortschritt.
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
        provider: "firecrawl", // optional; für automatische Erkennung weglassen
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

Konfiguriert das Verstehen eingehender Medien (Bild/Audio/Video):

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // Opt-in: abgeschlossene asynchrone Musik/Videos direkt an den Kanal senden
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
- `profile` / `preferredProfile`: Profilauswahl aus `auth-profiles.json`

**CLI-Eintrag** (`type: "cli"`):

- `command`: auszuführende ausführbare Datei
- `args`: Template-Argumente (unterstützt `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` usw.)

**Gemeinsame Felder:**

- `capabilities`: optionale Liste (`image`, `audio`, `video`). Standardwerte: `openai`/`anthropic`/`minimax` → Bild, `google` → Bild+Audio+Video, `groq` → Audio.
- `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: Überschreibungen pro Eintrag.
- Bei Fehlern wird auf den nächsten Eintrag zurückgegriffen.

Die Provider-Authentifizierung folgt der Standardreihenfolge: `auth-profiles.json` → Env-Variablen → `models.providers.*.apiKey`.

**Felder für asynchronen Abschluss:**

- `asyncCompletion.directSend`: wenn `true`, versuchen abgeschlossene asynchrone Aufgaben von `music_generate`
  und `video_generate` zuerst die direkte Zustellung an den Kanal. Standard: `false`
  (Legacy-Pfad über Aktivierung der anfragenden Sitzung/Modellzustellung).

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

Steuert, welche Sitzungen von den Sitzungs-Tools (`sessions_list`, `sessions_history`, `sessions_send`) adressiert werden können.

Standard: `tree` (aktuelle Sitzung + von ihr erzeugte Sitzungen, wie Unteragenten).

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
- `tree`: aktuelle Sitzung + von der aktuellen Sitzung erzeugte Sitzungen (Unteragenten).
- `agent`: jede Sitzung, die zur aktuellen Agent-ID gehört (kann auch andere Benutzer einschließen, wenn Sie Sitzungen pro Absender unter derselben Agent-ID ausführen).
- `all`: jede Sitzung. Agentübergreifendes Targeting erfordert weiterhin `tools.agentToAgent`.
- Sandbox-Begrenzung: Wenn die aktuelle Sitzung in einer Sandbox läuft und `agents.defaults.sandbox.sessionToolsVisibility="spawned"` gesetzt ist, wird die Sichtbarkeit auf `tree` erzwungen, selbst wenn `tools.sessions.visibility="all"` gesetzt ist.

### `tools.sessions_spawn`

Steuert die Unterstützung von Inline-Anhängen für `sessions_spawn`.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // Opt-in: auf true setzen, um Inline-Dateianhänge zu erlauben
        maxTotalBytes: 5242880, // insgesamt 5 MB über alle Dateien
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB pro Datei
        retainOnSessionKeep: false, // Anhänge behalten, wenn cleanup="keep"
      },
    },
  },
}
```

Hinweise:

- Anhänge werden nur für `runtime: "subagent"` unterstützt. ACP-Runtime lehnt sie ab.
- Dateien werden im Child-Workspace unter `.openclaw/attachments/<uuid>/` mit einer `.manifest.json` materialisiert.
- Anhangsinhalte werden automatisch aus der Transkriptpersistenz redigiert.
- Base64-Eingaben werden mit strengen Alphabet-/Padding-Prüfungen und einer Größenkontrolle vor dem Dekodieren validiert.
- Dateiberechtigungen sind `0700` für Verzeichnisse und `0600` für Dateien.
- Cleanup folgt der Richtlinie `cleanup`: `delete` entfernt Anhänge immer; `keep` behält sie nur, wenn `retainOnSessionKeep: true` gesetzt ist.

### `tools.experimental`

Experimentelle integrierte Tool-Flags. Standardmäßig aus, sofern keine Auto-Aktivierungsregel für strict-agentic GPT-5 greift.

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

- `planTool`: aktiviert das strukturierte Tool `update_plan` für die Verfolgung nicht-trivialer mehrstufiger Arbeit.
- Standard: `false`, es sei denn, `agents.defaults.embeddedPi.executionContract` (oder eine Überschreibung pro Agent) ist für einen OpenAI- oder OpenAI-Codex-Lauf der GPT-5-Familie auf `"strict-agentic"` gesetzt. Setzen Sie `true`, um das Tool außerhalb dieses Bereichs zu erzwingen, oder `false`, um es auch bei strict-agentic GPT-5-Läufen deaktiviert zu lassen.
- Wenn aktiviert, fügt der System-Prompt auch Nutzungshinweise hinzu, damit das Modell es nur für wesentliche Arbeit verwendet und höchstens einen Schritt `in_progress` hält.

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

- `model`: Standardmodell für gestartete Unteragenten. Wenn weggelassen, erben Unteragenten das Modell des Aufrufers.
- `allowAgents`: Standard-Allowlist für Ziel-Agent-IDs von `sessions_spawn`, wenn der anfragende Agent nicht seine eigene `subagents.allowAgents` setzt (`["*"]` = beliebig; Standard: nur derselbe Agent).
- `runTimeoutSeconds`: Standard-Timeout (Sekunden) für `sessions_spawn`, wenn der Tool-Aufruf `runTimeoutSeconds` weglässt. `0` bedeutet kein Timeout.
- Tool-Richtlinie pro Unteragent: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Benutzerdefinierte Provider und Basis-URLs

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
- Überschreiben Sie das Root der Agent-Konfiguration mit `OPENCLAW_AGENT_DIR` (oder `PI_CODING_AGENT_DIR`, einem Legacy-Alias für Umgebungsvariablen).
- Merge-Priorität für passende Provider-IDs:
  - Nicht leere `baseUrl`-Werte aus der Agent-`models.json` haben Vorrang.
  - Nicht leere `apiKey`-Werte des Agenten haben nur dann Vorrang, wenn dieser Provider im aktuellen Konfigurations-/Auth-Profile-Kontext nicht durch SecretRef verwaltet wird.
  - Durch SecretRef verwaltete `apiKey`-Werte von Providern werden aus Quellmarkern aktualisiert (`ENV_VAR_NAME` für Env-Referenzen, `secretref-managed` für Datei-/Exec-Referenzen), statt aufgelöste Secrets zu persistieren.
  - Durch SecretRef verwaltete Provider-Headerwerte werden aus Quellmarkern aktualisiert (`secretref-env:ENV_VAR_NAME` für Env-Referenzen, `secretref-managed` für Datei-/Exec-Referenzen).
  - Leere oder fehlende `apiKey`/`baseUrl` des Agenten greifen auf `models.providers` in der Konfiguration zurück.
  - Passende `contextWindow`/`maxTokens` eines Modells verwenden den höheren Wert aus expliziter Konfiguration und impliziten Katalogwerten.
  - Passende `contextTokens` eines Modells bewahren eine explizite Laufzeitbegrenzung, wenn vorhanden; verwenden Sie sie, um den effektiven Kontext zu begrenzen, ohne native Modellmetadaten zu ändern.
  - Verwenden Sie `models.mode: "replace"`, wenn die Konfiguration `models.json` vollständig neu schreiben soll.
  - Marker-Persistenz ist quellenautoritativ: Marker werden aus dem aktiven Snapshot der Quellkonfiguration (vor der Auflösung) geschrieben, nicht aus aufgelösten Laufzeit-Secret-Werten.

### Details zu Provider-Feldern

- `models.mode`: Verhalten des Provider-Katalogs (`merge` oder `replace`).
- `models.providers`: benutzerdefinierte Provider-Zuordnung, indiziert nach Provider-ID.
- `models.providers.*.api`: Request-Adapter (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai` usw.).
- `models.providers.*.apiKey`: Provider-Anmeldedaten (bevorzugt SecretRef/Env-Substitution verwenden).
- `models.providers.*.auth`: Authentifizierungsstrategie (`api-key`, `token`, `oauth`, `aws-sdk`).
- `models.providers.*.injectNumCtxForOpenAICompat`: für Ollama + `openai-completions`, injiziert `options.num_ctx` in Requests (Standard: `true`).
- `models.providers.*.authHeader`: erzwingt den Transport von Anmeldedaten im Header `Authorization`, wenn erforderlich.
- `models.providers.*.baseUrl`: Basis-URL der Upstream-API.
- `models.providers.*.headers`: zusätzliche statische Header für Proxy-/Tenant-Routing.
- `models.providers.*.request`: Transport-Überschreibungen für HTTP-Requests von Modell-Providern.
  - `request.headers`: zusätzliche Header (mit den Provider-Standards zusammengeführt). Werte akzeptieren SecretRef.
  - `request.auth`: Überschreibung der Authentifizierungsstrategie. Modi: `"provider-default"` (integrierte Auth des Providers verwenden), `"authorization-bearer"` (mit `token`), `"header"` (mit `headerName`, `value`, optional `prefix`).
  - `request.proxy`: Überschreibung des HTTP-Proxys. Modi: `"env-proxy"` (Env-Variablen `HTTP_PROXY`/`HTTPS_PROXY` verwenden), `"explicit-proxy"` (mit `url`). Beide Modi akzeptieren optional ein Unterobjekt `tls`.
  - `request.tls`: TLS-Überschreibung für direkte Verbindungen. Felder: `ca`, `cert`, `key`, `passphrase` (alle akzeptieren SecretRef), `serverName`, `insecureSkipVerify`.
  - `request.allowPrivateNetwork`: wenn `true`, erlaubt HTTPS zu `baseUrl`, wenn DNS auf private, CGNAT- oder ähnliche Bereiche auflöst, über die Fetch-SSRF-Schutzregel des Provider-HTTP-Fetch (Opt-in für Operatoren bei vertrauenswürdigen selbst gehosteten OpenAI-kompatiblen Endpunkten). WebSocket verwendet denselben `request` für Header/TLS, aber nicht diese Fetch-SSRF-Schutzregel. Standard `false`.
- `models.providers.*.models`: explizite Modellkatalogeinträge des Providers.
- `models.providers.*.models.*.contextWindow`: native Metadaten des Kontextfensters des Modells.
- `models.providers.*.models.*.contextTokens`: optionale Laufzeit-Obergrenze für den Kontext. Verwenden Sie dies, wenn Sie ein kleineres effektives Kontextbudget als das native `contextWindow` des Modells wünschen.
- `models.providers.*.models.*.compat.supportsDeveloperRole`: optionaler Kompatibilitätshinweis. Für `api: "openai-completions"` mit einer nicht leeren nicht nativen `baseUrl` (Host nicht `api.openai.com`) erzwingt OpenClaw dies zur Laufzeit auf `false`. Leere/weggelassene `baseUrl` behält das Standardverhalten von OpenAI bei.
- `models.providers.*.models.*.compat.requiresStringContent`: optionaler Kompatibilitätshinweis für OpenAI-kompatible Chat-Endpunkte, die nur Strings unterstützen. Wenn `true`, flacht OpenClaw reine Text-Arrays in `messages[].content` vor dem Senden des Requests zu einfachen Strings ab.
- `plugins.entries.amazon-bedrock.config.discovery`: Root der Bedrock-Auto-Discovery-Einstellungen.
- `plugins.entries.amazon-bedrock.config.discovery.enabled`: implizite Discovery ein-/ausschalten.
- `plugins.entries.amazon-bedrock.config.discovery.region`: AWS-Region für Discovery.
- `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: optionaler Provider-ID-Filter für gezielte Discovery.
- `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: Polling-Intervall für Discovery-Aktualisierung.
- `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: Fallback-Kontextfenster für erkannte Modelle.
- `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: Fallback für maximale Ausgabetoken erkannter Modelle.

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

Verwenden Sie `cerebras/zai-glm-4.7` für Cerebras; `zai/glm-4.7` für direktes Z.AI.

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

Setzen Sie `OPENCODE_API_KEY` (oder `OPENCODE_ZEN_API_KEY`). Verwenden Sie `opencode/...`-Referenzen für den Zen-Katalog oder `opencode-go/...`-Referenzen für den Go-Katalog. Abkürzung: `openclaw onboard --auth-choice opencode-zen` oder `openclaw onboard --auth-choice opencode-go`.

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

Setzen Sie `ZAI_API_KEY`. `z.ai/*` und `z-ai/*` werden als Aliasse akzeptiert. Abkürzung: `openclaw onboard --auth-choice zai-api-key`.

- Allgemeiner Endpunkt: `https://api.z.ai/api/paas/v4`
- Coding-Endpunkt (Standard): `https://api.z.ai/api/coding/paas/v4`
- Für den allgemeinen Endpunkt definieren Sie einen benutzerdefinierten Provider mit Überschreibung der Basis-URL.

</Accordion>

<Accordion title="Moonshot AI (Kimi)">

```json5
{
  env: { MOONSHOT_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "moonshot/kimi-k2.6" },
      models: { "moonshot/kimi-k2.6": { alias: "Kimi K2.6" } },
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
            id: "kimi-k2.6",
            name: "Kimi K2.6",
            reasoning: false,
            input: ["text", "image"],
            cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
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

Native Moonshot-Endpunkte werben Streaming-Nutzungskompatibilität auf dem gemeinsamen
`openai-completions`-Transport an, und OpenClaw richtet sich dabei nach den Fähigkeiten des Endpunkts
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

Anthropic-kompatibel, integrierter Provider. Abkürzung: `openclaw onboard --auth-choice kimi-code-api-key`.

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

Die Basis-URL sollte `/v1` weglassen (der Anthropic-Client hängt es an). Abkürzung: `openclaw onboard --auth-choice synthetic-api-key`.

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

Setzen Sie `MINIMAX_API_KEY`. Abkürzungen:
`openclaw onboard --auth-choice minimax-global-api` oder
`openclaw onboard --auth-choice minimax-cn-api`.
Der Modellkatalog verwendet standardmäßig nur M2.7.
Auf dem Anthropic-kompatiblen Streaming-Pfad deaktiviert OpenClaw standardmäßig MiniMax-Thinking,
es sei denn, Sie setzen `thinking` selbst explizit. `/fast on` oder
`params.fastMode: true` schreibt `MiniMax-M2.7` nach
`MiniMax-M2.7-highspeed` um.

</Accordion>

<Accordion title="Lokale Modelle (LM Studio)">

Siehe [Local Models](/de/gateway/local-models). Kurzfassung: Führen Sie ein großes lokales Modell über die LM Studio Responses API auf leistungsfähiger Hardware aus; behalten Sie gehostete Modelle für den Fallback zusammengeführt.

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
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // oder Klartextzeichenfolge
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
  verfügbar ist, bevor auf andere Installer-Typen zurückgegriffen wird.
- `install.nodeManager`: Präferenz für Node-Installer bei `metadata.openclaw.install`
  Spezifikationen (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` deaktiviert einen Skill, auch wenn er gebündelt/installiert ist.
- `entries.<skillKey>.apiKey`: Komfortfeld für Skills, die eine primäre Env-Variable deklarieren (Klartextzeichenfolge oder SecretRef-Objekt).

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
- `plugins.entries.<id>.apiKey`: Komfortfeld für API-Keys auf Plugin-Ebene (wenn vom Plugin unterstützt).
- `plugins.entries.<id>.env`: Plugin-spezifische Env-Variablenzuordnung.
- `plugins.entries.<id>.hooks.allowPromptInjection`: wenn `false`, blockiert der Core `before_prompt_build` und ignoriert prompt-mutierende Felder aus Legacy-`before_agent_start`, während Legacy-`modelOverride` und `providerOverride` erhalten bleiben. Gilt für native Plugin-Hooks und unterstützte von Bundles bereitgestellte Hook-Verzeichnisse.
- `plugins.entries.<id>.subagent.allowModelOverride`: diesem Plugin explizit vertrauen, pro Lauf `provider`- und `model`-Überschreibungen für Hintergrundläufe von Unteragenten anzufordern.
- `plugins.entries.<id>.subagent.allowedModels`: optionale Allowlist kanonischer `provider/model`-Ziele für vertrauenswürdige Überschreibungen von Unteragenten. Verwenden Sie `"*"` nur, wenn Sie bewusst jedes Modell zulassen möchten.
- `plugins.entries.<id>.config`: plugin-definiertes Konfigurationsobjekt (validiert durch das native OpenClaw-Plugin-Schema, wenn verfügbar).
- `plugins.entries.firecrawl.config.webFetch`: Firecrawl-Einstellungen für den Web-Fetch-Provider.
  - `apiKey`: Firecrawl-API-Key (akzeptiert SecretRef). Fällt auf `plugins.entries.firecrawl.config.webSearch.apiKey`, Legacy-`tools.web.fetch.firecrawl.apiKey` oder die Env-Variable `FIRECRAWL_API_KEY` zurück.
  - `baseUrl`: Firecrawl-API-Basis-URL (Standard: `https://api.firecrawl.dev`).
  - `onlyMainContent`: nur den Hauptinhalt von Seiten extrahieren (Standard: `true`).
  - `maxAgeMs`: maximales Cache-Alter in Millisekunden (Standard: `172800000` / 2 Tage).
  - `timeoutSeconds`: Timeout für Scrape-Requests in Sekunden (Standard: `60`).
- `plugins.entries.xai.config.xSearch`: Einstellungen für xAI X Search (Grok-Websuche).
  - `enabled`: den X Search-Provider aktivieren.
  - `model`: Grok-Modell, das für die Suche verwendet werden soll (z. B. `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: Einstellungen für Memory Dreaming. Siehe [Dreaming](/de/concepts/dreaming) für Phasen und Schwellenwerte.
  - `enabled`: globaler Dreaming-Schalter (Standard `false`).
  - `frequency`: Cron-Taktung für jeden vollständigen Dreaming-Durchlauf (standardmäßig `"0 3 * * *"`).
  - Phasenrichtlinie und Schwellenwerte sind Implementierungsdetails (keine benutzerseitigen Konfigurationsschlüssel).
- Die vollständige Speicherkonfiguration befindet sich in der [Speicherkonfigurationsreferenz](/de/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Aktivierte Claude-Bundle-Plugins können auch eingebettete Pi-Standards aus `settings.json` beisteuern; OpenClaw wendet diese als bereinigte Agent-Einstellungen an, nicht als rohe OpenClaw-Konfigurations-Patches.
- `plugins.slots.memory`: aktive Memory-Plugin-ID auswählen oder `"none"` zum Deaktivieren von Memory-Plugins.
- `plugins.slots.contextEngine`: aktive Context-Engine-Plugin-ID auswählen; standardmäßig `"legacy"`, sofern Sie keine andere Engine installieren und auswählen.
- `plugins.installs`: von der CLI verwaltete Installationsmetadaten, die von `openclaw plugins update` verwendet werden.
  - Enthält `source`, `spec`, `sourcePath`, `installPath`, `version`, `resolvedName`, `resolvedVersion`, `resolvedSpec`, `integrity`, `shasum`, `resolvedAt`, `installedAt`.
  - Behandeln Sie `plugins.installs.*` als verwalteten Zustand; bevorzugen Sie CLI-Befehle statt manueller Änderungen.

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
- Im strikten Modus unterliegen Remote-CDP-Profilendpunkte (`profiles.*.cdpUrl`) bei Erreichbarkeits-/Discovery-Prüfungen derselben Sperre für private Netzwerke.
- `ssrfPolicy.allowPrivateNetwork` bleibt als Legacy-Alias unterstützt.
- Verwenden Sie im strikten Modus `ssrfPolicy.hostnameAllowlist` und `ssrfPolicy.allowedHostnames` für explizite Ausnahmen.
- Remote-Profile sind nur zum Anhängen geeignet (Start/Stopp/Reset deaktiviert).
- `profiles.*.cdpUrl` akzeptiert `http://`, `https://`, `ws://` und `wss://`.
  Verwenden Sie HTTP(S), wenn OpenClaw `/json/version` erkennen soll; verwenden Sie WS(S),
  wenn Ihr Provider Ihnen eine direkte DevTools-WebSocket-URL bereitstellt.
- `existing-session`-Profile verwenden Chrome MCP statt CDP und können sich auf
  dem ausgewählten Host oder über einen verbundenen Browser-Node anhängen.
- `existing-session`-Profile können `userDataDir` setzen, um ein bestimmtes
  Chromium-basiertes Browserprofil wie Brave oder Edge anzusprechen.
- `existing-session`-Profile behalten die aktuellen Routenbeschränkungen von Chrome MCP:
  snapshot-/ref-gesteuerte Aktionen statt CSS-Selektor-Targeting, Hooks für Einzeldatei-Uploads,
  keine Dialog-Timeout-Überschreibungen, kein `wait --load networkidle` und kein
  `responsebody`, PDF-Export, Download-Interception oder Batch-Aktionen.
- Lokal verwaltete `openclaw`-Profile weisen `cdpPort` und `cdpUrl` automatisch zu; setzen Sie
  `cdpUrl` nur explizit für Remote-CDP.
- Reihenfolge der automatischen Erkennung: Standardbrowser, wenn Chromium-basiert → Chrome → Brave → Edge → Chromium → Chrome Canary.
- Control-Service: nur loopback (Port abgeleitet von `gateway.port`, Standard `18791`).
- `extraArgs` hängt zusätzliche Start-Flags an den lokalen Chromium-Start an (zum Beispiel
  `--disable-gpu`, Fenstergrößen oder Debug-Flags).

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

- `seamColor`: Akzentfarbe für natives App-UI-Chrome (Talk-Mode-Bubble-Tönung usw.).
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
      // allowExternalEmbedUrls: false, // gefährlich: absolute externe http(s)-Embed-URLs erlauben
      // allowedOrigins: ["https://control.example.com"], // erforderlich für nicht-loopback Control UI
      // dangerouslyAllowHostHeaderOriginFallback: false, // gefährlicher Host-Header-Origin-Fallback-Modus
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

- `mode`: `local` (Gateway ausführen) oder `remote` (mit entferntem Gateway verbinden). Das Gateway verweigert den Start, wenn nicht `local`.
- `port`: einzelner multiplexter Port für WS + HTTP. Priorität: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (Standard), `lan` (`0.0.0.0`), `tailnet` (nur Tailscale-IP) oder `custom`.
- **Legacy-Bind-Aliasse**: Verwenden Sie Bind-Modus-Werte in `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), nicht Host-Aliasse (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Docker-Hinweis**: Das Standard-Binding `loopback` lauscht im Container auf `127.0.0.1`. Mit Docker-Bridge-Netzwerk (`-p 18789:18789`) trifft der Verkehr auf `eth0` ein, daher ist das Gateway nicht erreichbar. Verwenden Sie `--network host` oder setzen Sie `bind: "lan"` (oder `bind: "custom"` mit `customBindHost: "0.0.0.0"`), um auf allen Interfaces zu lauschen.
- **Authentifizierung**: standardmäßig erforderlich. Nicht-Loopback-Bindings erfordern Gateway-Authentifizierung. In der Praxis bedeutet das ein gemeinsames Token/Passwort oder einen identitätsbewussten Reverse-Proxy mit `gateway.auth.mode: "trusted-proxy"`. Der Onboarding-Assistent erzeugt standardmäßig ein Token.
- Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind (einschließlich SecretRefs), setzen Sie `gateway.auth.mode` explizit auf `token` oder `password`. Start- sowie Service-Installations-/Reparaturabläufe schlagen fehl, wenn beide konfiguriert sind und `mode` nicht gesetzt ist.
- `gateway.auth.mode: "none"`: expliziter Modus ohne Authentifizierung. Nur für vertrauenswürdige lokale loopback-Setups verwenden; dies wird bewusst nicht in Onboarding-Prompts angeboten.
- `gateway.auth.mode: "trusted-proxy"`: Authentifizierung an einen identitätsbewussten Reverse-Proxy delegieren und Identitäts-Header von `gateway.trustedProxies` vertrauen (siehe [Trusted Proxy Auth](/de/gateway/trusted-proxy-auth)). Dieser Modus erwartet eine **nicht-loopback** Proxy-Quelle; Loopback-Reverse-Proxys auf demselben Host erfüllen die Trusted-Proxy-Authentifizierung nicht.
- `gateway.auth.allowTailscale`: wenn `true`, können Tailscale-Serve-Identitäts-Header die Authentifizierung für Control UI/WebSocket erfüllen (verifiziert über `tailscale whois`). HTTP-API-Endpunkte verwenden **nicht** diese Tailscale-Header-Authentifizierung; sie folgen stattdessen dem normalen HTTP-Auth-Modus des Gateway. Dieser tokenlose Ablauf setzt voraus, dass dem Gateway-Host vertraut wird. Standardmäßig `true`, wenn `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: optionaler Limiter für fehlgeschlagene Authentifizierungen. Gilt pro Client-IP und pro Auth-Bereich (Shared Secret und Device-Token werden unabhängig verfolgt). Blockierte Versuche geben `429` + `Retry-After` zurück.
  - Auf dem asynchronen Tailscale-Serve-Control-UI-Pfad werden fehlgeschlagene Versuche für dasselbe `{scope, clientIp}` vor dem Schreiben des Fehlers serialisiert. Gleichzeitige fehlerhafte Versuche desselben Clients können den Limiter daher beim zweiten Request auslösen, statt dass beide als normale Nichtübereinstimmungen durchlaufen.
  - `gateway.auth.rateLimit.exemptLoopback` ist standardmäßig `true`; setzen Sie `false`, wenn Sie bewusst möchten, dass auch Localhost-Traffic ratenbegrenzt wird (für Test-Setups oder strikte Proxy-Deployments).
- Authentifizierungsversuche von Browser-Origins auf WS werden immer mit deaktivierter Loopback-Ausnahme gedrosselt (Defense-in-Depth gegen browserbasierte Brute-Force-Angriffe auf localhost).
- Auf loopback sind diese Lockouts für Browser-Origins pro normalisiertem `Origin`-
  Wert isoliert, sodass wiederholte Fehler von einem localhost-Origin nicht automatisch
  einen anderen Origin aussperren.
- `tailscale.mode`: `serve` (nur Tailnet, loopback-Bind) oder `funnel` (öffentlich, erfordert Authentifizierung).
- `controlUi.allowedOrigins`: explizite Browser-Origin-Allowlist für Gateway-WebSocket-Verbindungen. Erforderlich, wenn Browser-Clients von Nicht-Loopback-Origins erwartet werden.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: gefährlicher Modus, der Host-Header-Origin-Fallback für Deployments aktiviert, die absichtlich auf einer Host-Header-Origin-Richtlinie basieren.
- `remote.transport`: `ssh` (Standard) oder `direct` (ws/wss). Für `direct` muss `remote.url` `ws://` oder `wss://` sein.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: clientseitige Break-Glass-Überschreibung, die Klartext-`ws://` zu vertrauenswürdigen Private-Network-IPs erlaubt; Standard bleibt bei Klartext auf nur loopback beschränkt.
- `gateway.remote.token` / `.password` sind Anmeldedatenfelder für den Remote-Client. Sie konfigurieren die Gateway-Authentifizierung nicht von selbst.
- `gateway.push.apns.relay.baseUrl`: Basis-HTTPS-URL für das externe APNs-Relay, das offizielle/TestFlight-iOS-Builds verwenden, nachdem sie Relay-gestützte Registrierungen an das Gateway veröffentlicht haben. Diese URL muss mit der im iOS-Build einkompilierten Relay-URL übereinstimmen.
- `gateway.push.apns.relay.timeoutMs`: Timeout in Millisekunden für das Senden vom Gateway an das Relay. Standardmäßig `10000`.
- Relay-gestützte Registrierungen werden an eine bestimmte Gateway-Identität delegiert. Die gekoppelte iOS-App ruft `gateway.identity.get` ab, schließt diese Identität in die Relay-Registrierung ein und leitet eine registrierungsbezogene Sendeberechtigung an das Gateway weiter. Ein anderes Gateway kann diese gespeicherte Registrierung nicht wiederverwenden.
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: temporäre Env-Überschreibungen für die obige Relay-Konfiguration.
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: nur für Entwicklung gedachter Escape-Hatch für loopback-HTTP-Relay-URLs. Produktions-Relay-URLs sollten bei HTTPS bleiben.
- `gateway.channelHealthCheckMinutes`: Intervall des Kanal-Health-Monitors in Minuten. Setzen Sie `0`, um Neustarts durch den Health-Monitor global zu deaktivieren. Standard: `5`.
- `gateway.channelStaleEventThresholdMinutes`: Schwellenwert für veraltete Sockets in Minuten. Halten Sie diesen größer oder gleich `gateway.channelHealthCheckMinutes`. Standard: `30`.
- `gateway.channelMaxRestartsPerHour`: maximale Anzahl von Neustarts pro Kanal/Konto durch den Health-Monitor innerhalb einer gleitenden Stunde. Standard: `10`.
- `channels.<provider>.healthMonitor.enabled`: Opt-out pro Kanal für Neustarts durch den Health-Monitor, während der globale Monitor aktiviert bleibt.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: Überschreibung pro Konto für Kanäle mit mehreren Konten. Wenn gesetzt, hat sie Vorrang vor der Überschreibung auf Kanalebene.
- Lokale Gateway-Aufrufpfade können `gateway.remote.*` nur dann als Fallback verwenden, wenn `gateway.auth.*` nicht gesetzt ist.
- Wenn `gateway.auth.token` / `gateway.auth.password` explizit über SecretRef konfiguriert und nicht aufgelöst ist, schlägt die Auflösung fail-closed fehl (keine Maskierung durch Remote-Fallback).
- `trustedProxies`: IPs von Reverse-Proxys, die TLS terminieren oder weitergeleitete Client-Header injizieren. Listen Sie nur Proxys auf, die Sie kontrollieren. Loopback-Einträge sind weiterhin für Setups mit Proxy auf demselben Host/lokaler Erkennung gültig (zum Beispiel Tailscale Serve oder ein lokaler Reverse-Proxy), machen Loopback-Requests jedoch **nicht** für `gateway.auth.mode: "trusted-proxy"` geeignet.
- `allowRealIpFallback`: wenn `true`, akzeptiert das Gateway `X-Real-IP`, wenn `X-Forwarded-For` fehlt. Standard `false` für fail-closed-Verhalten.
- `gateway.tools.deny`: zusätzliche Tool-Namen, die für HTTP `POST /tools/invoke` blockiert sind (erweitert die Standard-Deny-Liste).
- `gateway.tools.allow`: Tool-Namen aus der Standard-HTTP-Deny-Liste entfernen.

</Accordion>

### OpenAI-kompatible Endpunkte

- Chat Completions: standardmäßig deaktiviert. Aktivieren mit `gateway.http.endpoints.chatCompletions.enabled: true`.
- Responses API: `gateway.http.endpoints.responses.enabled`.
- Härtung von Responses-URL-Eingaben:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    Leere Allowlists werden wie nicht gesetzt behandelt; verwenden Sie `gateway.http.endpoints.responses.files.allowUrl=false`
    und/oder `gateway.http.endpoints.responses.images.allowUrl=false`, um URL-Fetching zu deaktivieren.
- Optionaler Härtungs-Header für Responses:
  - `gateway.http.securityHeaders.strictTransportSecurity` (nur für HTTPS-Origins setzen, die Sie kontrollieren; siehe [Trusted Proxy Auth](/de/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### Isolierung mehrerer Instanzen

Mehrere Gateways auf einem Host mit eindeutigen Ports und State-Verzeichnissen ausführen:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

Komfort-Flags: `--dev` (verwendet `~/.openclaw-dev` + Port `19001`), `--profile <name>` (verwendet `~/.openclaw-<name>`).

Siehe [Multiple Gateways](/de/gateway/multiple-gateways).

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
- `autoGenerate`: generiert automatisch ein lokales selbstsigniertes Zertifikat/Schlüsselpaar, wenn keine expliziten Dateien konfiguriert sind; nur für lokale/dev-Nutzung.
- `certPath`: Dateisystempfad zur TLS-Zertifikatsdatei.
- `keyPath`: Dateisystempfad zum privaten TLS-Schlüssel; halten Sie die Berechtigungen eingeschränkt.
- `caPath`: optionaler Pfad zum CA-Bundle für Client-Verifikation oder benutzerdefinierte Vertrauenskette.

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
  - `"restart"`: den Gateway-Prozess bei Konfigurationsänderungen immer neu starten.
  - `"hot"`: Änderungen im Prozess anwenden, ohne neu zu starten.
  - `"hybrid"` (Standard): zuerst Hot-Reload versuchen; falls erforderlich auf Neustart zurückfallen.
- `debounceMs`: Debounce-Fenster in ms, bevor Konfigurationsänderungen angewendet werden (nichtnegative Ganzzahl).
- `deferralTimeoutMs`: maximale Wartezeit in ms auf laufende Operationen, bevor ein Neustart erzwungen wird (Standard: `300000` = 5 Minuten).

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
    allowRequestSessionKey: true,
    allowedSessionKeyPrefixes: ["hook:", "hook:gmail:"],
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

Authentifizierung: `Authorization: Bearer <token>` oder `x-openclaw-token: <token>`.
Hook-Tokens in der Query-String werden abgelehnt.

Hinweise zu Validierung und Sicherheit:

- `hooks.enabled=true` erfordert ein nicht leeres `hooks.token`.
- `hooks.token` muss sich **von** `gateway.auth.token` unterscheiden; die Wiederverwendung des Gateway-Tokens wird abgelehnt.
- `hooks.path` darf nicht `/` sein; verwenden Sie einen dedizierten Unterpfad wie `/hooks`.
- Wenn `hooks.allowRequestSessionKey=true`, schränken Sie `hooks.allowedSessionKeyPrefixes` ein (zum Beispiel `["hook:"]`).
- Wenn eine Zuordnung oder ein Preset einen templatisierten `sessionKey` verwendet, setzen Sie `hooks.allowedSessionKeyPrefixes` und `hooks.allowRequestSessionKey=true`. Statische Zuordnungsschlüssel erfordern dieses Opt-in nicht.

**Endpunkte:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` aus dem Request-Payload wird nur akzeptiert, wenn `hooks.allowRequestSessionKey=true` (Standard: `false`).
- `POST /hooks/<name>` → aufgelöst über `hooks.mappings`
  - Template-gerenderte `sessionKey`-Werte in Zuordnungen werden als extern geliefert behandelt und erfordern ebenfalls `hooks.allowRequestSessionKey=true`.

<Accordion title="Details zu Zuordnungen">

- `match.path` gleicht den Unterpfad nach `/hooks` ab (z. B. `/hooks/gmail` → `gmail`).
- `match.source` gleicht ein Payload-Feld für generische Pfade ab.
- Templates wie `{{messages[0].subject}}` lesen aus dem Payload.
- `transform` kann auf ein JS/TS-Modul zeigen, das eine Hook-Aktion zurückgibt.
  - `transform.module` muss ein relativer Pfad sein und innerhalb von `hooks.transformsDir` bleiben (absolute Pfade und Traversal werden abgelehnt).
- `agentId` routet an einen bestimmten Agenten; unbekannte IDs fallen auf den Standard zurück.
- `allowedAgentIds`: beschränkt explizites Routing (`*` oder weggelassen = alle erlauben, `[]` = alle verweigern).
- `defaultSessionKey`: optionaler fester Sitzungsschlüssel für Hook-Agent-Läufe ohne expliziten `sessionKey`.
- `allowRequestSessionKey`: erlaubt `sessionKey` für Aufrufer von `/hooks/agent` und templategesteuerte Sitzungsschlüssel in Zuordnungen (Standard: `false`).
- `allowedSessionKeyPrefixes`: optionale Präfix-Allowlist für explizite `sessionKey`-Werte (Request + Zuordnung), z. B. `["hook:"]`. Sie wird erforderlich, wenn irgendeine Zuordnung oder ein Preset einen templatisierten `sessionKey` verwendet.
- `deliver: true` sendet die endgültige Antwort an einen Kanal; `channel` ist standardmäßig `last`.
- `model` überschreibt das LLM für diesen Hook-Lauf (muss erlaubt sein, wenn ein Modellkatalog gesetzt ist).

</Accordion>

### Gmail-Integration

- Das integrierte Gmail-Preset verwendet `sessionKey: "hook:gmail:{{messages[0].id}}"`.
- Wenn Sie dieses Routing pro Nachricht beibehalten, setzen Sie `hooks.allowRequestSessionKey: true` und beschränken Sie `hooks.allowedSessionKeyPrefixes` so, dass sie zum Gmail-Namespace passen, zum Beispiel `["hook:", "hook:gmail:"]`.
- Wenn Sie `hooks.allowRequestSessionKey: false` benötigen, überschreiben Sie das Preset mit einem statischen `sessionKey` statt mit dem templatisierten Standard.

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

- Das Gateway startet `gog gmail watch serve` beim Boot automatisch, wenn es konfiguriert ist. Setzen Sie `OPENCLAW_SKIP_GMAIL_WATCHER=1`, um dies zu deaktivieren.
- Führen Sie nicht parallel ein separates `gog gmail watch serve` neben dem Gateway aus.

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
- Nur lokal: behalten Sie `gateway.bind: "loopback"` (Standard) bei.
- Nicht-Loopback-Bindings: Canvas-Routen erfordern Gateway-Authentifizierung (Token/Passwort/trusted-proxy), wie andere HTTP-Oberflächen des Gateway auch.
- Node-WebViews senden typischerweise keine Auth-Header; nachdem ein Node gekoppelt und verbunden ist, kündigt das Gateway nodebezogene Capability-URLs für den Zugriff auf Canvas/A2UI an.
- Capability-URLs sind an die aktive Node-WS-Sitzung gebunden und laufen schnell ab. IP-basierter Fallback wird nicht verwendet.
- Injiziert den Live-Reload-Client in ausgeliefertes HTML.
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

- `minimal` (Standard): `cliPath` + `sshPort` aus TXT-Records weglassen.
- `full`: `cliPath` + `sshPort` einschließen.
- Hostname ist standardmäßig `openclaw`. Überschreiben mit `OPENCLAW_MDNS_HOSTNAME`.

### Weitbereich (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

Schreibt eine Unicast-DNS-SD-Zone unter `~/.openclaw/dns/`. Für netzwerkübergreifende Discovery mit einem DNS-Server (CoreDNS empfohlen) + Tailscale Split DNS kombinieren.

Einrichtung: `openclaw dns setup --apply`.

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

- Inline-Env-Variablen werden nur angewendet, wenn die Prozessumgebung den Schlüssel nicht enthält.
- `.env`-Dateien: CWD `.env` + `~/.openclaw/.env` (keine von beiden überschreibt bestehende Variablen).
- `shellEnv`: importiert fehlende erwartete Schlüssel aus Ihrem Login-Shell-Profil.
- Vollständige Priorität siehe [Environment](/de/help/environment).

### Env-Variablen-Substitution

Verweisen Sie in beliebigen Konfigurations-Strings mit `${VAR_NAME}` auf Env-Variablen:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- Es werden nur Großbuchstabennamen gematcht: `[A-Z_][A-Z0-9_]*`.
- Fehlende/leere Variablen lösen beim Laden der Konfiguration einen Fehler aus.
- Escapen mit `$${VAR}` für ein literales `${VAR}`.
- Funktioniert mit `$include`.

---

## Secrets

Secret-Refs sind additiv: Klartextwerte funktionieren weiterhin.

### `SecretRef`

Verwenden Sie eine Objektform:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

Validierung:

- `provider`-Muster: `^[a-z][a-z0-9_-]{0,63}$`
- `source: "env"`-`id`-Muster: `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"`-`id`: absoluter JSON-Pointer (zum Beispiel `"/providers/openai/apiKey"`)
- `source: "exec"`-`id`-Muster: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- `source: "exec"`-IDs dürfen keine durch `/` getrennten Pfadsegmente `.` oder `..` enthalten (zum Beispiel wird `a/../b` abgelehnt)

### Unterstützte Anmeldedatenoberfläche

- Kanonische Matrix: [SecretRef Credential Surface](/de/reference/secretref-credential-surface)
- `secrets apply` zielt auf unterstützte Anmeldedatenpfade in `openclaw.json`.
- `auth-profiles.json`-Refs sind in der Laufzeitauflösung und Audit-Abdeckung enthalten.

### Konfiguration von Secret-Providern

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

- Der `file`-Provider unterstützt `mode: "json"` und `mode: "singleValue"` (`id` muss im SingleValue-Modus `"value"` sein).
- Der `exec`-Provider erfordert einen absoluten `command`-Pfad und verwendet Protokoll-Payloads auf stdin/stdout.
- Standardmäßig werden Symlink-Befehlspfade abgelehnt. Setzen Sie `allowSymlinkCommand: true`, um Symlink-Pfade zu erlauben und dabei den aufgelösten Zielpfad zu validieren.
- Wenn `trustedDirs` konfiguriert ist, gilt die Trusted-Dir-Prüfung für den aufgelösten Zielpfad.
- Die Child-Umgebung von `exec` ist standardmäßig minimal; reichen Sie erforderliche Variablen explizit mit `passEnv` durch.
- Secret-Refs werden zur Aktivierungszeit in einen In-Memory-Snapshot aufgelöst, danach lesen Request-Pfade nur noch aus dem Snapshot.
- Beim Aktivieren wird Active-Surface-Filterung angewendet: nicht aufgelöste Refs auf aktiven Oberflächen führen zu einem fehlgeschlagenen Startup/Reload, während inaktive Oberflächen mit Diagnosen übersprungen werden.

---

## Auth-Speicher

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
- `auth-profiles.json` unterstützt Refs auf Wertebene (`keyRef` für `api_key`, `tokenRef` für `token`) für statische Anmeldedatenmodi.
- Profile im OAuth-Modus (`auth.profiles.<id>.mode = "oauth"`) unterstützen keine SecretRef-gestützten Anmeldedaten für Auth-Profile.
- Statische Laufzeit-Anmeldedaten stammen aus aufgelösten In-Memory-Snapshots; Legacy-statische `auth.json`-Einträge werden bereinigt, wenn sie gefunden werden.
- Legacy-OAuth-Importe aus `~/.openclaw/credentials/oauth.json`.
- Siehe [OAuth](/de/concepts/oauth).
- Laufzeitverhalten von Secrets und `audit/configure/apply`-Tools: [Secrets Management](/de/gateway/secrets).

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

- `billingBackoffHours`: Basis-Backoff in Stunden, wenn ein Profil aufgrund echter
  Abrechnungs-/unzureichender-Guthaben-Fehler fehlschlägt (Standard: `5`). Expliziter Abrechnungstext kann
  auch bei Antworten `401`/`403` weiterhin hier landen, provider-spezifische Text-
  Matcher bleiben jedoch auf den Provider beschränkt, zu dem sie gehören (zum Beispiel OpenRouter
  `Key limit exceeded`). Wiederholbare HTTP-`402`-Nutzungsfenster- oder
  Organisations-/Workspace-Ausgabenlimit-Meldungen bleiben stattdessen im Pfad `rate_limit`.
- `billingBackoffHoursByProvider`: optionale Überschreibungen pro Provider für Billing-Backoff in Stunden.
- `billingMaxHours`: Obergrenze in Stunden für exponentielles Wachstum des Billing-Backoffs (Standard: `24`).
- `authPermanentBackoffMinutes`: Basis-Backoff in Minuten für hochvertrauenswürdige `auth_permanent`-Fehler (Standard: `10`).
- `authPermanentMaxMinutes`: Obergrenze in Minuten für das Wachstum des `auth_permanent`-Backoffs (Standard: `60`).
- `failureWindowHours`: gleitendes Fenster in Stunden, das für Backoff-Zähler verwendet wird (Standard: `24`).
- `overloadedProfileRotations`: maximale Anzahl an Rotationen von Auth-Profilen desselben Providers bei Überlastungsfehlern, bevor auf Modell-Fallback umgeschaltet wird (Standard: `1`). Formen mit Provider-Busy wie `ModelNotReadyException` landen hier.
- `overloadedBackoffMs`: feste Verzögerung vor dem erneuten Versuch einer überlasteten Provider-/Profilrotation (Standard: `0`).
- `rateLimitedProfileRotations`: maximale Anzahl an Rotationen von Auth-Profilen desselben Providers bei Rate-Limit-Fehlern, bevor auf Modell-Fallback umgeschaltet wird (Standard: `1`). Dieser Rate-Limit-Bucket umfasst providergeprägten Text wie `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` und `resource exhausted`.

---

## Protokollierung

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
- `consoleLevel` wird mit `--verbose` auf `debug` erhöht.
- `maxFileBytes`: maximale Größe der Logdatei in Bytes, bevor Schreibvorgänge unterdrückt werden (positive Ganzzahl; Standard: `524288000` = 500 MB). Verwenden Sie für Produktions-Deployments externe Log-Rotation.

---

## Diagnose

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

- `enabled`: globaler Schalter für Instrumentierungsausgabe (Standard: `true`).
- `flags`: Array von Flag-Strings, die gezielte Logausgabe aktivieren (unterstützt Wildcards wie `"telegram.*"` oder `"*"`).
- `stuckSessionWarnMs`: Altersschwellenwert in ms, ab dem Warnungen zu festhängenden Sitzungen ausgegeben werden, während eine Sitzung im Verarbeitungszustand bleibt.
- `otel.enabled`: aktiviert die OpenTelemetry-Exportpipeline (Standard: `false`).
- `otel.endpoint`: Collector-URL für den OTel-Export.
- `otel.protocol`: `"http/protobuf"` (Standard) oder `"grpc"`.
- `otel.headers`: zusätzliche HTTP-/gRPC-Metadaten-Header, die mit OTel-Export-Requests gesendet werden.
- `otel.serviceName`: Dienstname für Ressourcenattribute.
- `otel.traces` / `otel.metrics` / `otel.logs`: Export von Traces, Metriken oder Logs aktivieren.
- `otel.sampleRate`: Trace-Sampling-Rate `0`–`1`.
- `otel.flushIntervalMs`: periodisches Flush-Intervall für Telemetrie in ms.
- `cacheTrace.enabled`: protokolliert Cache-Trace-Snapshots für eingebettete Läufe (Standard: `false`).
- `cacheTrace.filePath`: Ausgabepfad für Cache-Trace-JSONL (Standard: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`).
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: steuern, was in der Cache-Trace-Ausgabe enthalten ist (alle standardmäßig `true`).

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

- `channel`: Release-Kanal für npm-/Git-Installationen — `"stable"`, `"beta"` oder `"dev"`.
- `checkOnStart`: beim Start des Gateway nach npm-Updates suchen (Standard: `true`).
- `auto.enabled`: Hintergrund-Auto-Update für Paketinstallationen aktivieren (Standard: `false`).
- `auto.stableDelayHours`: minimale Verzögerung in Stunden vor automatischer Anwendung im Stable-Kanal (Standard: `6`; max: `168`).
- `auto.stableJitterHours`: zusätzliches Streufenster für den Rollout im Stable-Kanal in Stunden (Standard: `12`; max: `168`).
- `auto.betaCheckIntervalHours`: wie oft Prüfungen für den Beta-Kanal in Stunden ausgeführt werden (Standard: `1`; max: `24`).

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
- `dispatch.enabled`: unabhängiges Gate für die Turn-Dispatch von ACP-Sitzungen (Standard: `true`). Setzen Sie `false`, um ACP-Befehle verfügbar zu halten, während die Ausführung blockiert wird.
- `backend`: Standard-ACP-Runtime-Backend-ID (muss einem registrierten ACP-Runtime-Plugin entsprechen).
- `defaultAgent`: Fallback-Ziel-Agent-ID für ACP, wenn Spawns kein explizites Ziel angeben.
- `allowedAgents`: Allowlist von Agent-IDs, die für ACP-Runtime-Sitzungen erlaubt sind; leer bedeutet keine zusätzliche Einschränkung.
- `maxConcurrentSessions`: maximale Anzahl gleichzeitig aktiver ACP-Sitzungen.
- `stream.coalesceIdleMs`: Idle-Flush-Fenster in ms für gestreamten Text.
- `stream.maxChunkChars`: maximale Chunk-Größe vor dem Aufteilen der Projektion gestreamter Blöcke.
- `stream.repeatSuppression`: unterdrückt wiederholte Status-/Tool-Zeilen pro Turn (Standard: `true`).
- `stream.deliveryMode`: `"live"` streamt inkrementell; `"final_only"` puffert bis zu terminalen Turn-Ereignissen.
- `stream.hiddenBoundarySeparator`: Trenner vor sichtbarem Text nach verborgenen Tool-Ereignissen (Standard: `"paragraph"`).
- `stream.maxOutputChars`: maximale Anzahl von Assistant-Ausgabezeichen, die pro ACP-Turn projiziert werden.
- `stream.maxSessionUpdateChars`: maximale Anzahl Zeichen für projizierte ACP-Status-/Update-Zeilen.
- `stream.tagVisibility`: Aufzeichnung von Tag-Namen auf boolesche Sichtbarkeitsüberschreibungen für gestreamte Ereignisse.
- `runtime.ttlMinutes`: Idle-TTL in Minuten für ACP-Sitzungs-Worker, bevor sie für Cleanup infrage kommen.
- `runtime.installCommand`: optionaler Installationsbefehl, der beim Bootstrap einer ACP-Runtime-Umgebung ausgeführt wird.

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

- `cli.banner.taglineMode` steuert den Stil der Banner-Tagline:
  - `"random"` (Standard): rotierende witzige/saisonale Taglines.
  - `"default"`: feste neutrale Tagline (`All your chats, one OpenClaw.`).
  - `"off"`: kein Tagline-Text (Banner-Titel/Version werden weiterhin angezeigt).
- Um das gesamte Banner auszublenden (nicht nur Taglines), setzen Sie die Env-Variable `OPENCLAW_HIDE_BANNER=1`.

---

## Wizard

Metadaten, die von CLI-geführten Setup-Abläufen (`onboard`, `configure`, `doctor`) geschrieben werden:

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

## Identity

Siehe die Identity-Felder in `agents.list` unter [Agent-Standards](#agent-defaults).

---

## Bridge (Legacy, entfernt)

Aktuelle Builds enthalten die TCP-Bridge nicht mehr. Nodes verbinden sich über den Gateway-WebSocket. `bridge.*`-Schlüssel sind nicht mehr Teil des Konfigurationsschemas (die Validierung schlägt fehl, bis sie entfernt werden; `openclaw doctor --fix` kann unbekannte Schlüssel entfernen).

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
    webhookToken: "replace-with-dedicated-token", // optionales Bearer-Token für ausgehende Webhook-Authentifizierung
    sessionRetention: "24h", // Dauer-String oder false
    runLog: {
      maxBytes: "2mb", // Standard 2_000_000 Bytes
      keepLines: 2000, // Standard 2000
    },
  },
}
```

- `sessionRetention`: wie lange abgeschlossene isolierte Cron-Laufsitzungen in `sessions.json` aufbewahrt werden, bevor sie entfernt werden. Steuert auch das Cleanup archivierter gelöschter Cron-Transkripte. Standard: `24h`; setzen Sie `false`, um zu deaktivieren.
- `runLog.maxBytes`: maximale Größe pro Run-Log-Datei (`cron/runs/<jobId>.jsonl`) vor dem Beschneiden. Standard: `2_000_000` Bytes.
- `runLog.keepLines`: neueste Zeilen, die beibehalten werden, wenn das Beschneiden des Run-Logs ausgelöst wird. Standard: `2000`.
- `webhookToken`: Bearer-Token, das für die POST-Zustellung an Cron-Webhooks (`delivery.mode = "webhook"`) verwendet wird; wenn weggelassen, wird kein Auth-Header gesendet.
- `webhook`: veraltete Legacy-Fallback-Webhook-URL (http/https), die nur für gespeicherte Jobs verwendet wird, die noch `notify: true` haben.

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

- `maxAttempts`: maximale Anzahl Wiederholungen für One-Shot-Jobs bei transienten Fehlern (Standard: `3`; Bereich: `0`–`10`).
- `backoffMs`: Array von Backoff-Verzögerungen in ms für jeden Wiederholungsversuch (Standard: `[30000, 60000, 300000]`; 1–10 Einträge).
- `retryOn`: Fehlertypen, die Wiederholungen auslösen — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"`. Weglassen, um alle transienten Typen zu wiederholen.

Gilt nur für One-Shot-Cron-Jobs. Wiederkehrende Jobs verwenden eine separate Fehlerbehandlung.

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
- `mode`: Zustellmodus — `"announce"` sendet über eine Kanalnachricht; `"webhook"` sendet an den konfigurierten Webhook.
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

- Standardziel für Fehlerbenachrichtigungen von Cron-Jobs über alle Jobs hinweg.
- `mode`: `"announce"` oder `"webhook"`; standardmäßig `"announce"`, wenn genügend Zieldaten vorhanden sind.
- `channel`: Kanal-Überschreibung für `announce`-Zustellung. `"last"` verwendet den zuletzt bekannten Zustellkanal erneut.
- `to`: explizites Ziel für `announce` oder Webhook-URL. Für den Webhook-Modus erforderlich.
- `accountId`: optionale Konto-Überschreibung für die Zustellung.
- `delivery.failureDestination` pro Job überschreibt diesen globalen Standard.
- Wenn weder ein globales noch ein jobspezifisches Fehlerziel gesetzt ist, fallen Jobs, die bereits per `announce` zustellen, im Fehlerfall auf dieses primäre `announce`-Ziel zurück.
- `delivery.failureDestination` wird nur für Jobs mit `sessionTarget="isolated"` unterstützt, es sei denn, `delivery.mode` des primären Jobs ist `"webhook"`.

Siehe [Cron Jobs](/de/automation/cron-jobs). Isolierte Cron-Ausführungen werden als [Hintergrundaufgaben](/de/automation/tasks) verfolgt.

---

## Template-Variablen für Medienmodelle

Template-Platzhalter, die in `tools.media.models[].args` erweitert werden:

| Variable           | Beschreibung                                     |
| ------------------ | ------------------------------------------------ |
| `{{Body}}`         | Vollständiger eingehender Nachrichtentext        |
| `{{RawBody}}`      | Roher Textkörper (ohne Verlaufs-/Absender-Wrapper) |
| `{{BodyStripped}}` | Textkörper mit entfernten Gruppenerwähnungen     |
| `{{From}}`         | Absenderkennung                                  |
| `{{To}}`           | Zielkennung                                      |
| `{{MessageSid}}`   | Kanal-Nachrichten-ID                             |
| `{{SessionId}}`    | Aktuelle Sitzungs-UUID                           |
| `{{IsNewSession}}` | `"true"`, wenn eine neue Sitzung erstellt wurde  |
| `{{MediaUrl}}`     | Pseudo-URL eingehender Medien                    |
| `{{MediaPath}}`    | Lokaler Medienpfad                               |
| `{{MediaType}}`    | Medientyp (Bild/Audio/Dokument/…)                |
| `{{Transcript}}`   | Audio-Transkript                                 |
| `{{Prompt}}`       | Aufgelöster Medien-Prompt für CLI-Einträge       |
| `{{MaxChars}}`     | Aufgelöste maximale Ausgabezeichen für CLI-Einträge |
| `{{ChatType}}`     | `"direct"` oder `"group"`                        |
| `{{GroupSubject}}` | Gruppenbetreff (nach bestem Bemühen)             |
| `{{GroupMembers}}` | Vorschau von Gruppenmitgliedern (nach bestem Bemühen) |
| `{{SenderName}}`   | Anzeigename des Absenders (nach bestem Bemühen)  |
| `{{SenderE164}}`   | Telefonnummer des Absenders (nach bestem Bemühen) |
| `{{Provider}}`     | Provider-Hinweis (whatsapp, telegram, discord usw.) |

---

## Config-Includes (`$include`)

Konfiguration in mehrere Dateien aufteilen:

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
- Geschwisterschlüssel: werden nach Includes zusammengeführt (überschreiben inkludierte Werte).
- Verschachtelte Includes: bis zu 10 Ebenen tief.
- Pfade: werden relativ zur inkludierenden Datei aufgelöst, müssen aber innerhalb des Top-Level-Konfigurationsverzeichnisses bleiben (`dirname` von `openclaw.json`). Absolute/`../`-Formen sind nur erlaubt, wenn sie sich dennoch innerhalb dieser Grenze auflösen.
- Fehler: klare Meldungen für fehlende Dateien, Parse-Fehler und zirkuläre Includes.

---

_Zugehörig: [Configuration](/de/gateway/configuration) · [Configuration Examples](/de/gateway/configuration-examples) · [Doctor](/de/gateway/doctor)_
