---
read_when:
    - Konfigurieren eines Kanal-Plugins (Authentifizierung, Zugriffskontrolle, Multi-Account)
    - Fehlerbehebung für kanalspezifische Konfigurationsschlüssel
    - Überprüfung der DM-Richtlinie, der Gruppenrichtlinie oder der Erwähnungssteuerung
summary: 'Kanalkonfiguration: Zugriffskontrolle, Pairing, kanalspezifische Schlüssel für Slack, Discord, Telegram, WhatsApp, Matrix, iMessage und mehr'
title: Konfiguration — Kanäle
x-i18n:
    generated_at: "2026-04-30T16:28:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: aba14cb43e1fe914cc7c03f41bed1b5915cc6b2ad8e0f1d47f58b7e98c1b3915
    source_path: gateway/config-channels.md
    workflow: 16
---

Kanalspezifische Konfigurationsschlüssel unter `channels.*`. Behandelt DM- und Gruppenzugriff,
Multi-Account-Setups, Mention-Gating und kanalspezifische Schlüssel für Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage und die anderen gebündelten Kanal-Plugins.

Für Agenten, Tools, Gateway Runtime und andere Top-Level-Schlüssel siehe
[Konfigurationsreferenz](/de/gateway/configuration-reference).

## Kanäle

Jeder Kanal startet automatisch, wenn sein Konfigurationsabschnitt vorhanden ist (außer bei `enabled: false`).

### DM- und Gruppenzugriff

Alle Kanäle unterstützen DM-Richtlinien und Gruppenrichtlinien:

| DM-Richtlinie      | Verhalten                                                     |
| ------------------ | ------------------------------------------------------------- |
| `pairing` (Standard) | Unbekannte Absender erhalten einen einmaligen Kopplungscode; der Besitzer muss ihn genehmigen |
| `allowlist`        | Nur Absender in `allowFrom` (oder im gekoppelten Allow-Store) |
| `open`             | Alle eingehenden DMs zulassen (erfordert `allowFrom: ["*"]`)  |
| `disabled`         | Alle eingehenden DMs ignorieren                               |

| Gruppenrichtlinie       | Verhalten                                                   |
| ----------------------- | ----------------------------------------------------------- |
| `allowlist` (Standard)  | Nur Gruppen, die der konfigurierten Allowlist entsprechen   |
| `open`                  | Gruppen-Allowlists umgehen (Mention-Gating gilt weiterhin) |
| `disabled`              | Alle Gruppen-/Raumnachrichten blockieren                    |

<Note>
`channels.defaults.groupPolicy` legt den Standard fest, wenn `groupPolicy` eines Providers nicht gesetzt ist.
Kopplungscodes laufen nach 1 Stunde ab. Ausstehende DM-Kopplungsanfragen sind auf **3 pro Kanal** begrenzt.
Wenn ein Provider-Block vollständig fehlt (`channels.<provider>` nicht vorhanden), fällt die Runtime-Gruppenrichtlinie mit einer Startwarnung auf `allowlist` zurück (fail-closed).
</Note>

### Kanal-Modellüberschreibungen

Verwenden Sie `channels.modelByChannel`, um bestimmte Kanal-IDs an ein Modell zu binden. Werte akzeptieren `provider/model` oder konfigurierte Modellaliase. Die Kanalzuordnung gilt, wenn eine Sitzung nicht bereits eine Modellüberschreibung hat (zum Beispiel über `/model` gesetzt).

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

Verwenden Sie `channels.defaults` für gemeinsame Gruppenrichtlinien- und Heartbeat-Verhalten über Provider hinweg:

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

- `channels.defaults.groupPolicy`: Fallback-Gruppenrichtlinie, wenn `groupPolicy` auf Provider-Ebene nicht gesetzt ist.
- `channels.defaults.contextVisibility`: Standardmodus für die Sichtbarkeit von ergänzendem Kontext für alle Kanäle. Werte: `all` (Standard, allen zitierten/Thread-/Verlaufskontext einschließen), `allowlist` (nur Kontext von Absendern in der Allowlist einschließen), `allowlist_quote` (wie Allowlist, aber expliziten Zitat-/Antwortkontext beibehalten). Kanalspezifische Überschreibung: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: Gesunde Kanalstatus in die Heartbeat-Ausgabe einschließen.
- `channels.defaults.heartbeat.showAlerts`: Beeinträchtigte/Fehlerstatus in die Heartbeat-Ausgabe einschließen.
- `channels.defaults.heartbeat.useIndicator`: Kompakte Heartbeat-Ausgabe im Indikatorstil rendern.

### WhatsApp

WhatsApp läuft über den Web-Kanal des Gateways (Baileys Web). Es startet automatisch, wenn eine verknüpfte Sitzung vorhanden ist.

```json5
{
  web: {
    whatsapp: {
      keepAliveIntervalMs: 25000,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
    },
  },
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // blue ticks (false in self-chat mode)
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

<Accordion title="Multi-account WhatsApp">

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
- Optionales `channels.whatsapp.defaultAccount` überschreibt diese Fallback-Auswahl des Standardkontos, wenn es einer konfigurierten Konto-ID entspricht.
- Das alte Baileys-Authentifizierungsverzeichnis für Einzelkonten wird durch `openclaw doctor` nach `whatsapp/default` migriert.
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
      apiRoot: "https://api.telegram.org",
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```

- Bot-Token: `channels.telegram.botToken` oder `channels.telegram.tokenFile` (nur reguläre Datei; Symlinks werden abgelehnt), mit `TELEGRAM_BOT_TOKEN` als Fallback für das Standardkonto.
- `apiRoot` ist ausschließlich der Root der Telegram Bot API. Verwenden Sie `https://api.telegram.org` oder Ihren selbst gehosteten/Proxy-Root, nicht `https://api.telegram.org/bot<TOKEN>`; `openclaw doctor --fix` entfernt ein versehentlich angehängtes Suffix `/bot<TOKEN>`.
- Optionales `channels.telegram.defaultAccount` überschreibt die Standardkontoauswahl, wenn es einer konfigurierten Konto-ID entspricht.
- Setzen Sie in Multi-Account-Setups (2+ Konto-IDs) einen expliziten Standard (`channels.telegram.defaultAccount` oder `channels.telegram.accounts.default`), um Fallback-Routing zu vermeiden; `openclaw doctor` warnt, wenn dies fehlt oder ungültig ist.
- `configWrites: false` blockiert von Telegram initiierte Konfigurationsschreibvorgänge (Supergroup-ID-Migrationen, `/config set|unset`).
- Top-Level-Einträge in `bindings[]` mit `type: "acp"` konfigurieren persistente ACP-Bindings für Forumsthemen (verwenden Sie die kanonische Form `chatId:topic:topicId` in `match.peer.id`). Die Feldsemantik wird in [ACP-Agenten](/de/tools/acp-agents#channel-specific-settings) gemeinsam beschrieben.
- Telegram-Stream-Vorschauen verwenden `sendMessage` + `editMessageText` (funktioniert in Direkt- und Gruppenchats).
- Wiederholungsrichtlinie: siehe [Wiederholungsrichtlinie](/de/concepts/retry).

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
- Direkte ausgehende Aufrufe, die ein explizites Discord-`token` bereitstellen, verwenden dieses Token für den Aufruf; Einstellungen für Kontowiederholung/Richtlinien stammen weiterhin aus dem ausgewählten Konto im aktiven Runtime-Snapshot.
- Optionales `channels.discord.defaultAccount` überschreibt die Standardkontoauswahl, wenn es mit einer konfigurierten Konto-ID übereinstimmt.
- Verwenden Sie `user:<id>` (DM) oder `channel:<id>` (Gildenkanal) als Zustellziele; reine numerische IDs werden abgelehnt.
- Gilden-Slugs sind kleingeschrieben und Leerzeichen werden durch `-` ersetzt; Kanalschlüssel verwenden den Namen als Slug (kein `#`). Bevorzugen Sie Gilden-IDs.
- Vom Bot verfasste Nachrichten werden standardmäßig ignoriert. `allowBots: true` aktiviert sie; verwenden Sie `allowBots: "mentions"`, um nur Bot-Nachrichten zu akzeptieren, die den Bot erwähnen (eigene Nachrichten werden weiterhin gefiltert).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (und Kanalüberschreibungen) verwirft Nachrichten, die einen anderen Benutzer oder eine Rolle, aber nicht den Bot erwähnen (ausgenommen @everyone/@here).
- `maxLinesPerMessage` (Standard 17) teilt hohe Nachrichten auch dann auf, wenn sie unter 2000 Zeichen liegen.
- `channels.discord.threadBindings` steuert Discord-Thread-gebundenes Routing:
  - `enabled`: Discord-Überschreibung für Thread-gebundene Sitzungsfunktionen (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` und gebundene Zustellung/Routing)
  - `idleHours`: Discord-Überschreibung für automatisches Unfocus bei Inaktivität in Stunden (`0` deaktiviert)
  - `maxAgeHours`: Discord-Überschreibung für hartes Höchstalter in Stunden (`0` deaktiviert)
  - `spawnSubagentSessions`: Opt-in-Schalter für automatische Thread-Erstellung/-Bindung durch `sessions_spawn({ thread: true })`
- Einträge der obersten Ebene in `bindings[]` mit `type: "acp"` konfigurieren persistente ACP-Bindungen für Kanäle und Threads (verwenden Sie Kanal-/Thread-ID in `match.peer.id`). Feldsemantiken werden in [ACP-Agenten](/de/tools/acp-agents#channel-specific-settings) gemeinsam beschrieben.
- `channels.discord.ui.components.accentColor` legt die Akzentfarbe für Discord-Komponenten-v2-Container fest.
- `channels.discord.voice` aktiviert Discord-Sprachkanalunterhaltungen und optionale Überschreibungen für automatisches Beitreten + LLM + TTS.
- `channels.discord.voice.model` überschreibt optional das LLM-Modell, das für Antworten in Discord-Sprachkanälen verwendet wird.
- `channels.discord.voice.daveEncryption` und `channels.discord.voice.decryptionFailureTolerance` werden an die DAVE-Optionen von `@discordjs/voice` durchgereicht (standardmäßig `true` und `24`).
- OpenClaw versucht zusätzlich, den Sprachempfang wiederherzustellen, indem es nach wiederholten Entschlüsselungsfehlern eine Sprachsitzung verlässt und erneut beitritt.
- `channels.discord.streaming` ist der kanonische Schlüssel für den Stream-Modus. Legacy-Werte `streamMode` und boolesche `streaming`-Werte werden automatisch migriert.
- `channels.discord.autoPresence` ordnet Runtime-Verfügbarkeit der Bot-Präsenz zu (healthy => online, degraded => idle, exhausted => dnd) und erlaubt optionale Überschreibungen des Statustexts.
- `channels.discord.dangerouslyAllowNameMatching` aktiviert veränderliches Namens-/Tag-Matching erneut (Break-Glass-Kompatibilitätsmodus).
- `channels.discord.execApprovals`: Discord-native Zustellung von Exec-Genehmigungen und Autorisierung von Genehmigern.
  - `enabled`: `true`, `false` oder `"auto"` (Standard). Im Automodus werden Exec-Genehmigungen aktiviert, wenn Genehmiger aus `approvers` oder `commands.ownerAllowFrom` aufgelöst werden können.
  - `approvers`: Discord-Benutzer-IDs, die Exec-Anfragen genehmigen dürfen. Fällt auf `commands.ownerAllowFrom` zurück, wenn ausgelassen.
  - `agentFilter`: optionale Allowlist für Agent-IDs. Auslassen, um Genehmigungen für alle Agenten weiterzuleiten.
  - `sessionFilter`: optionale Sitzungs-Schlüsselmuster (Teilzeichenfolge oder Regex).
  - `target`: wohin Genehmigungsaufforderungen gesendet werden. `"dm"` (Standard) sendet an Genehmiger-DMs, `"channel"` sendet an den Ursprungskanal, `"both"` sendet an beide. Wenn das Ziel `"channel"` enthält, sind Schaltflächen nur für aufgelöste Genehmiger nutzbar.
  - `cleanupAfterResolve`: löscht bei `true` Genehmigungs-DMs nach Genehmigung, Ablehnung oder Timeout.

**Reaktionsbenachrichtigungsmodi:** `off` (keine), `own` (Nachrichten des Bots, Standard), `all` (alle Nachrichten), `allowlist` (aus `guilds.<id>.users` für alle Nachrichten).

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

- Dienstkonto-JSON: inline (`serviceAccount`) oder dateibasiert (`serviceAccountFile`).
- Dienstkonto-SecretRef wird ebenfalls unterstützt (`serviceAccountRef`).
- Env-Fallbacks: `GOOGLE_CHAT_SERVICE_ACCOUNT` oder `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Verwenden Sie `spaces/<spaceId>` oder `users/<userId>` als Zustellziele.
- `channels.googlechat.dangerouslyAllowNameMatching` aktiviert veränderliches E-Mail-Principal-Matching erneut (Break-Glass-Kompatibilitätsmodus).

### Slack

```json5
{
  channels: {
    slack: {
      enabled: true,
      botToken: "xoxb-...",
      appToken: "xapp-...",
      socketMode: {
        clientPingTimeout: 15000,
        serverPingTimeout: 30000,
        pingPongLoggingEnabled: false,
      },
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

- **Socket-Modus** erfordert sowohl `botToken` als auch `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` für den Env-Fallback des Standardkontos).
- **HTTP-Modus** erfordert `botToken` plus `signingSecret` (im Root oder pro Konto).
- `socketMode` reicht Slack-SDK-Socket-Mode-Transport-Tuning an die öffentliche Bolt-Receiver-API durch. Verwenden Sie es nur, wenn Sie Ping/Pong-Timeouts oder veraltetes Websocket-Verhalten untersuchen.
- `botToken`, `appToken`, `signingSecret` und `userToken` akzeptieren Klartextzeichenfolgen
  oder SecretRef-Objekte.
- Slack-Konto-Snapshots stellen Quellen-/Statusfelder pro Anmeldedaten bereit, wie
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` und im HTTP-Modus
  `signingSecretStatus`. `configured_unavailable` bedeutet, dass das Konto
  über SecretRef konfiguriert ist, der aktuelle Befehls-/Runtime-Pfad aber den
  geheimen Wert nicht auflösen konnte.
- `configWrites: false` blockiert von Slack initiierte Konfigurationsschreibvorgänge.
- Optionales `channels.slack.defaultAccount` überschreibt die Standardkontoauswahl, wenn es mit einer konfigurierten Konto-ID übereinstimmt.
- `channels.slack.streaming.mode` ist der kanonische Slack-Schlüssel für den Stream-Modus. `channels.slack.streaming.nativeTransport` steuert Slacks nativen Streaming-Transport. Legacy-Werte `streamMode`, boolesche `streaming`-Werte und `nativeStreaming`-Werte werden automatisch migriert.
- Verwenden Sie `user:<id>` (DM) oder `channel:<id>` als Zustellziele.

**Reaktionsbenachrichtigungsmodi:** `off`, `own` (Standard), `all`, `allowlist` (aus `reactionAllowlist`).

**Thread-Sitzungsisolation:** `thread.historyScope` ist pro Thread (Standard) oder über den Kanal hinweg geteilt. `thread.inheritParent` kopiert das Transkript des übergeordneten Kanals in neue Threads.

- Slack-natives Streaming plus der Slack-Assistentenstil-Threadstatus „tippt gerade ...“ erfordern ein Antwort-Thread-Ziel. Top-Level-DMs bleiben standardmäßig außerhalb von Threads, daher verwenden sie `typingReaction` oder normale Zustellung statt der Thread-Stil-Vorschau.
- `typingReaction` fügt der eingehenden Slack-Nachricht eine temporäre Reaktion hinzu, während eine Antwort läuft, und entfernt sie nach Abschluss. Verwenden Sie einen Slack-Emoji-Shortcode wie `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: Slack-native Zustellung von Exec-Genehmigungen und Autorisierung von Genehmigern. Gleiches Schema wie Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (Slack-Benutzer-IDs), `agentFilter`, `sessionFilter` und `target` (`"dm"`, `"channel"` oder `"both"`).

| Aktionsgruppe | Standard  | Hinweise                         |
| ------------ | --------- | -------------------------------- |
| reactions    | aktiviert | Reagieren + Reaktionen auflisten |
| messages     | aktiviert | Lesen/senden/bearbeiten/löschen  |
| pins         | aktiviert | Anheften/lösen/auflisten         |
| memberInfo   | aktiviert | Mitgliedsinformationen           |
| emojiList    | aktiviert | Benutzerdefinierte Emoji-Liste   |

### Mattermost

Mattermost wird in aktuellen OpenClaw-Versionen als gebündeltes Plugin ausgeliefert. Ältere oder
benutzerdefinierte Builds können ein aktuelles npm-Paket mit
`openclaw plugins install @openclaw/mattermost` installieren; wenn npm das
OpenClaw-eigene Paket als veraltet meldet, verwenden Sie das gebündelte Plugin oder einen lokalen Checkout,
bis ein neueres npm-Paket veröffentlicht wird.

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

Chat-Modi: `oncall` (antwortet bei @-Erwähnung, Standard), `onmessage` (jede Nachricht), `onchar` (Nachrichten, die mit einem Auslösepräfix beginnen).

Wenn Mattermost-native Befehle aktiviert sind:

- `commands.callbackPath` muss ein Pfad sein (zum Beispiel `/api/channels/mattermost/command`), keine vollständige URL.
- `commands.callbackUrl` muss zum OpenClaw-Gateway-Endpunkt auflösen und vom Mattermost-Server erreichbar sein.
- Native Slash-Callbacks werden mit den pro Befehl zurückgegebenen Tokens authentifiziert,
  die Mattermost während der Slash-Command-Registrierung zurückgibt. Wenn die Registrierung fehlschlägt oder keine
  Befehle aktiviert werden, lehnt OpenClaw Callbacks mit
  `Unauthorized: invalid command token.`
- Für private/Tailnet/interne Callback-Hosts kann Mattermost verlangen,
  dass `ServiceSettings.AllowedUntrustedInternalConnections` den Callback-Host/die Callback-Domain enthält.
  Verwenden Sie Host-/Domain-Werte, keine vollständigen URLs.
- `channels.mattermost.configWrites`: erlaubt oder verweigert von Mattermost initiierte Konfigurationsschreibvorgänge.
- `channels.mattermost.requireMention`: erfordert `@mention`, bevor in Kanälen geantwortet wird.
- `channels.mattermost.groups.<channelId>.requireMention`: kanalbezogene Überschreibung des Erwähnungs-Gatings (`"*"` als Standard).
- Optionales `channels.mattermost.defaultAccount` überschreibt die Standardkontoauswahl, wenn es mit einer konfigurierten Konto-ID übereinstimmt.

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // optional account binding
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

**Reaktionsbenachrichtigungsmodi:** `off`, `own` (Standard), `all`, `allowlist` (aus `reactionAllowlist`).

- `channels.signal.account`: Bindet den Kanalstart an eine bestimmte Signal-Kontoidentität.
- `channels.signal.configWrites`: Erlaubt oder verweigert durch Signal initiierte Konfigurationsschreibvorgänge.
- Optionales `channels.signal.defaultAccount` überschreibt die Standardkontoauswahl, wenn es mit einer konfigurierten Konto-ID übereinstimmt.

### BlueBubbles

BlueBubbles ist der empfohlene iMessage-Pfad (Plugin-gestützt, konfiguriert unter `channels.bluebubbles`).

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

- Hier abgedeckte zentrale Schlüsselpfade: `channels.bluebubbles`, `channels.bluebubbles.dmPolicy`.
- Optionales `channels.bluebubbles.defaultAccount` überschreibt die Standardkontoauswahl, wenn es mit einer konfigurierten Konto-ID übereinstimmt.
- Einträge in `bindings[]` auf oberster Ebene mit `type: "acp"` können BlueBubbles-Unterhaltungen an persistente ACP-Sitzungen binden. Verwenden Sie in `match.peer.id` ein BlueBubbles-Handle oder eine Zielzeichenfolge (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`). Semantik gemeinsamer Felder: [ACP-Agenten](/de/tools/acp-agents#channel-specific-settings).
- Die vollständige BlueBubbles-Kanalkonfiguration ist in [BlueBubbles](/de/channels/bluebubbles) dokumentiert.

### iMessage

OpenClaw startet `imsg rpc` (JSON-RPC über stdio). Es ist kein Daemon und kein Port erforderlich.

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

- Optionales `channels.imessage.defaultAccount` überschreibt die Standardkontoauswahl, wenn es mit einer konfigurierten Konto-ID übereinstimmt.

- Erfordert vollständigen Festplattenzugriff auf die Nachrichten-DB.
- Bevorzugen Sie `chat_id:<id>`-Ziele. Verwenden Sie `imsg chats --limit 20`, um Chats aufzulisten.
- `cliPath` kann auf einen SSH-Wrapper verweisen; setzen Sie `remoteHost` (`host` oder `user@host`) für das Abrufen von Anhängen per SCP.
- `attachmentRoots` und `remoteAttachmentRoots` beschränken eingehende Anhangspfade (Standard: `/Users/*/Library/Messages/Attachments`).
- SCP verwendet eine strikte Hostschlüsselprüfung. Stellen Sie daher sicher, dass der Relay-Hostschlüssel bereits in `~/.ssh/known_hosts` vorhanden ist.
- `channels.imessage.configWrites`: Erlaubt oder verweigert durch iMessage initiierte Konfigurationsschreibvorgänge.
- Einträge in `bindings[]` auf oberster Ebene mit `type: "acp"` können iMessage-Unterhaltungen an persistente ACP-Sitzungen binden. Verwenden Sie in `match.peer.id` ein normalisiertes Handle oder ein explizites Chat-Ziel (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`). Semantik gemeinsamer Felder: [ACP-Agenten](/de/tools/acp-agents#channel-specific-settings).

<Accordion title="iMessage-SSH-Wrapper-Beispiel">

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

- Token-Authentifizierung verwendet `accessToken`; Passwortauthentifizierung verwendet `userId` + `password`.
- `channels.matrix.proxy` leitet Matrix-HTTP-Datenverkehr über einen expliziten HTTP(S)-Proxy. Benannte Konten können dies mit `channels.matrix.accounts.<id>.proxy` überschreiben.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` erlaubt private/interne Homeserver. `proxy` und diese Netzwerk-Opt-in-Einstellung sind unabhängige Steuerungen.
- `channels.matrix.defaultAccount` wählt das bevorzugte Konto in Setups mit mehreren Konten aus.
- `channels.matrix.autoJoin` ist standardmäßig `off`, sodass eingeladene Räume und neue DM-artige Einladungen ignoriert werden, bis Sie `autoJoin: "allowlist"` mit `autoJoinAllowlist` oder `autoJoin: "always"` setzen.
- `channels.matrix.execApprovals`: Matrix-native Zustellung von Exec-Genehmigungen und Autorisierung von Genehmigenden.
  - `enabled`: `true`, `false` oder `"auto"` (Standard). Im Automatikmodus werden Exec-Genehmigungen aktiviert, wenn Genehmigende aus `approvers` oder `commands.ownerAllowFrom` aufgelöst werden können.
  - `approvers`: Matrix-Benutzer-IDs (z. B. `@owner:example.org`), die Exec-Anfragen genehmigen dürfen.
  - `agentFilter`: optionale Agent-ID-Allowlist. Weglassen, um Genehmigungen für alle Agenten weiterzuleiten.
  - `sessionFilter`: optionale Sitzungsschlüsselmuster (Teilzeichenfolge oder Regex).
  - `target`: Ziel für Genehmigungsaufforderungen. `"dm"` (Standard), `"channel"` (Ursprungsraum) oder `"both"`.
  - Überschreibungen pro Konto: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` steuert, wie Matrix-DMs zu Sitzungen gruppiert werden: `per-user` (Standard) teilt nach geroutetem Peer, während `per-room` jeden DM-Raum isoliert.
- Matrix-Statusprüfungen und Live-Verzeichnisabfragen verwenden dieselbe Proxy-Richtlinie wie der Laufzeitdatenverkehr.
- Die vollständige Matrix-Konfiguration, Zielregeln und Einrichtungsbeispiele sind in [Matrix](/de/channels/matrix) dokumentiert.

### Microsoft Teams

Microsoft Teams ist Plugin-gestützt und wird unter `channels.msteams` konfiguriert.

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

- Hier abgedeckte zentrale Schlüsselpfade: `channels.msteams`, `channels.msteams.configWrites`.
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

- Hier abgedeckte zentrale Schlüsselpfade: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`.
- Optionales `channels.irc.defaultAccount` überschreibt die Standardkontoauswahl, wenn es mit einer konfigurierten Konto-ID übereinstimmt.
- Die vollständige IRC-Kanalkonfiguration (Host/Port/TLS/Kanäle/Allowlists/Erwähnungs-Gating) ist in [IRC](/de/channels/irc) dokumentiert.

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
- Env-Token gelten nur für das **Standardkonto**.
- Basiskanaleinstellungen gelten für alle Konten, sofern sie nicht pro Konto überschrieben werden.
- Verwenden Sie `bindings[].match.accountId`, um jedes Konto an einen anderen Agenten zu routen.
- Wenn Sie über `openclaw channels add` (oder Kanal-Onboarding) ein Nicht-Standardkonto hinzufügen, während Sie noch eine Top-Level-Kanalkonfiguration für ein einzelnes Konto verwenden, verschiebt OpenClaw zuerst kontospezifische Top-Level-Werte für einzelne Konten in die Konto-Map des Kanals, sodass das ursprüngliche Konto weiter funktioniert. Die meisten Kanäle verschieben sie nach `channels.<channel>.accounts.default`; Matrix kann stattdessen ein vorhandenes passendes benanntes/Standardziel beibehalten.
- Vorhandene Nur-Kanal-Bindings (ohne `accountId`) passen weiterhin auf das Standardkonto; kontospezifische Bindings bleiben optional.
- `openclaw doctor --fix` repariert auch gemischte Formen, indem kontospezifische Top-Level-Werte für einzelne Konten in das für diesen Kanal ausgewählte hochgestufte Konto verschoben werden. Die meisten Kanäle verwenden `accounts.default`; Matrix kann stattdessen ein vorhandenes passendes benanntes/Standardziel beibehalten.

### Andere Plugin-Kanäle

Viele Plugin-Kanäle werden als `channels.<id>` konfiguriert und auf ihren dedizierten Kanalseiten dokumentiert (zum Beispiel Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat und Twitch).
Siehe den vollständigen Kanalindex: [Kanäle](/de/channels).

### Erwähnungs-Gating in Gruppenchats

Gruppennachrichten erfordern standardmäßig eine **Erwähnung** (Metadatenerwähnung oder sichere Regex-Muster). Gilt für WhatsApp, Telegram, Discord, Google Chat und iMessage-Gruppenchats.

Sichtbare Antworten werden separat gesteuert. Gruppen-/Kanalräume verwenden standardmäßig `messages.groupChat.visibleReplies: "message_tool"`: OpenClaw verarbeitet den Turn weiterhin, aber normale finale Antworten bleiben privat, und sichtbare Raumausgabe erfordert `message(action=send)`. Setzen Sie `"automatic"` nur, wenn Sie das Legacy-Verhalten wünschen, bei dem normale Antworten wieder in den Raum gepostet werden. Um dasselbe nur-Tool-Verhalten für sichtbare Antworten auch auf direkte Chats anzuwenden, setzen Sie `messages.visibleReplies: "message_tool"`.

Der Gateway lädt die `messages`-Konfiguration nach dem Speichern der Datei per Hot-Reload neu. Starten Sie nur neu, wenn Dateiüberwachung oder Konfigurationsneuladen in der Bereitstellung deaktiviert ist.

**Erwähnungstypen:**

- **Metadatenerwähnungen**: Native @-Erwähnungen der Plattform. Im WhatsApp-Self-Chat-Modus ignoriert.
- **Textmuster**: Sichere Regex-Muster in `agents.list[].groupChat.mentionPatterns`. Ungültige Muster und unsichere verschachtelte Wiederholungen werden ignoriert.
- Erwähnungs-Gating wird nur erzwungen, wenn Erkennung möglich ist (native Erwähnungen oder mindestens ein Muster).

```json5
{
  messages: {
    visibleReplies: "automatic", // global default for direct/source chats
    groupChat: {
      historyLimit: 50,
      visibleReplies: "message_tool", // default; use "automatic" for legacy final replies
    },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` legt den globalen Standard fest. Kanäle können dies mit `channels.<channel>.historyLimit` (oder pro Konto) überschreiben. Setzen Sie `0`, um es zu deaktivieren.

`messages.visibleReplies` ist der globale Standard für Quell-Turns; `messages.groupChat.visibleReplies` überschreibt ihn für Gruppen-/Kanal-Quell-Turns. Kanal-Allowlists und Erwähnungs-Gating entscheiden weiterhin, ob ein Turn verarbeitet wird.

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

Auflösung: Überschreibung pro DM → Provider-Standard → kein Limit (alles bleibt erhalten).

Unterstützt: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### Self-Chat-Modus

Nehmen Sie Ihre eigene Nummer in `allowFrom` auf, um den Self-Chat-Modus zu aktivieren (ignoriert native @-Erwähnungen, reagiert nur auf Textmuster):

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
    native: "auto", // register native commands when supported
    nativeSkills: "auto", // register native skill commands when supported
    text: true, // parse /commands in chat messages
    bash: false, // allow ! (alias: /bash)
    bashForegroundMs: 2000,
    config: false, // allow /config
    mcp: false, // allow /mcp
    plugins: false, // allow /plugins
    debug: false, // allow /debug
    restart: true, // allow /restart + gateway restart tool
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

<Accordion title="Command details">

- Dieser Block konfiguriert Befehlsoberflächen. Den aktuellen integrierten und gebündelten Befehlskatalog finden Sie unter [Slash-Befehle](/de/tools/slash-commands).
- Diese Seite ist eine **Referenz für Konfigurationsschlüssel**, nicht der vollständige Befehlskatalog. Kanal-/Plugin-eigene Befehle wie QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, Gerätekopplung `/pair`, Speicher `/dreaming`, Telefonsteuerung `/phone` und Talk `/voice` sind auf den jeweiligen Kanal-/Plugin-Seiten sowie unter [Slash-Befehle](/de/tools/slash-commands) dokumentiert.
- Textbefehle müssen **eigenständige** Nachrichten mit führendem `/` sein.
- `native: "auto"` aktiviert native Befehle für Discord/Telegram und lässt Slack deaktiviert.
- `nativeSkills: "auto"` aktiviert native Skill-Befehle für Discord/Telegram und lässt Slack deaktiviert.
- Pro Kanal überschreiben: `channels.discord.commands.native` (boolescher Wert oder `"auto"`). `false` löscht zuvor registrierte Befehle.
- Überschreiben Sie die Registrierung nativer Skill-Befehle pro Kanal mit `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` fügt zusätzliche Einträge im Telegram-Bot-Menü hinzu.
- `bash: true` aktiviert `! <cmd>` für die Host-Shell. Erfordert `tools.elevated.enabled` und einen Absender in `tools.elevated.allowFrom.<channel>`.
- `config: true` aktiviert `/config` (liest/schreibt `openclaw.json`). Für Gateway-`chat.send`-Clients erfordern persistente `/config set|unset`-Schreibvorgänge zusätzlich `operator.admin`; das schreibgeschützte `/config show` bleibt für normale Operator-Clients mit Schreibbereich verfügbar.
- `mcp: true` aktiviert `/mcp` für die von OpenClaw verwaltete MCP-Serverkonfiguration unter `mcp.servers`.
- `plugins: true` aktiviert `/plugins` für Plugin-Erkennung, Installation und Aktivierungs-/Deaktivierungssteuerungen.
- `channels.<provider>.configWrites` steuert Konfigurationsänderungen pro Kanal (Standard: true).
- Bei Kanälen mit mehreren Konten steuert `channels.<provider>.accounts.<id>.configWrites` auch Schreibvorgänge, die auf dieses Konto abzielen (zum Beispiel `/allowlist --config --account <id>` oder `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` deaktiviert `/restart` und Aktionen des Gateway-Neustarttools. Standard: `true`.
- `ownerAllowFrom` ist die explizite Owner-Zulassungsliste für Owner-only-Befehle/-Tools. Sie ist von `allowFrom` getrennt.
- `ownerDisplay: "hash"` hasht Owner-IDs im System-Prompt. Legen Sie `ownerDisplaySecret` fest, um das Hashing zu steuern.
- `allowFrom` gilt pro Provider. Wenn gesetzt, ist es die **einzige** Autorisierungsquelle (Kanal-Zulassungslisten/Kopplung und `useAccessGroups` werden ignoriert).
- `useAccessGroups: false` erlaubt Befehlen, Access-Group-Richtlinien zu umgehen, wenn `allowFrom` nicht gesetzt ist.
- Zuordnung der Befehlsdokumentation:
  - integrierter und gebündelter Katalog: [Slash-Befehle](/de/tools/slash-commands)
  - kanalspezifische Befehlsoberflächen: [Kanäle](/de/channels)
  - QQ Bot-Befehle: [QQ Bot](/de/channels/qqbot)
  - Kopplungsbefehle: [Kopplung](/de/channels/pairing)
  - LINE-Kartenbefehl: [LINE](/de/channels/line)
  - Speicher-Dreaming: [Dreaming](/de/concepts/dreaming)

</Accordion>

---

## Verwandt

- [Konfigurationsreferenz](/de/gateway/configuration-reference) — Schlüssel der obersten Ebene
- [Konfiguration — Agents](/de/gateway/config-agents)
- [Kanalübersicht](/de/channels)
