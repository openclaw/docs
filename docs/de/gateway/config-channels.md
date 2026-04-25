---
read_when:
    - Ein Plugin für einen Kanal konfigurieren (Authentifizierung, Zugriffskontrolle, mehrere Konten)
    - Kanalbezogene Konfigurationsschlüssel debuggen
    - DM-Richtlinie, Gruppenrichtlinie oder Erwähnungsbedingung prüfen
summary: 'Kanalkonfiguration: Zugriffskontrolle, Pairing, kanalbezogene Schlüssel für Slack, Discord, Telegram, WhatsApp, Matrix, iMessage und mehr'
title: Konfiguration — Kanäle
x-i18n:
    generated_at: "2026-04-25T13:45:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8b7071f7cda3f7f71b464e64c2abb8e0b88326606234f0cf7778c80a7ef4b3e0
    source_path: gateway/config-channels.md
    workflow: 15
---

Kanalbezogene Konfigurationsschlüssel unter `channels.*`. Behandelt DM- und Gruppenzugriff,
Setups mit mehreren Konten, Erwähnungsbedingungen und kanalbezogene Schlüssel für Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage und die anderen gebündelten Kanal-Plugins.

Für Agenten, Tools, Gateway-Laufzeit und andere Schlüssel der obersten Ebene siehe
[Configuration reference](/de/gateway/configuration-reference).

## Kanäle

Jeder Kanal startet automatisch, wenn sein Konfigurationsabschnitt vorhanden ist (außer bei `enabled: false`).

### DM- und Gruppenzugriff

Alle Kanäle unterstützen DM-Richtlinien und Gruppenrichtlinien:

| DM-Richtlinie        | Verhalten                                                      |
| -------------------- | -------------------------------------------------------------- |
| `pairing` (Standard) | Unbekannte Absender erhalten einen einmaligen Pairing-Code; der Eigentümer muss genehmigen |
| `allowlist`          | Nur Absender in `allowFrom` (oder im Pairing-Allow-Store)      |
| `open`               | Alle eingehenden DMs zulassen (erfordert `allowFrom: ["*"]`)   |
| `disabled`           | Alle eingehenden DMs ignorieren                                |

| Gruppenrichtlinie      | Verhalten                                              |
| ---------------------- | ------------------------------------------------------ |
| `allowlist` (Standard) | Nur Gruppen zulassen, die mit der konfigurierten Allowlist übereinstimmen |
| `open`                 | Gruppen-Allowlists umgehen (Erwähnungsbedingung gilt weiterhin) |
| `disabled`             | Alle Gruppen-/Raumnachrichten blockieren               |

<Note>
`channels.defaults.groupPolicy` setzt den Standard, wenn `groupPolicy` eines Providers nicht gesetzt ist.
Pairing-Codes laufen nach 1 Stunde ab. Ausstehende DM-Pairing-Anfragen sind auf **3 pro Kanal** begrenzt.
Wenn ein Provider-Block vollständig fehlt (`channels.<provider>` fehlt), fällt die Gruppenrichtlinie zur Laufzeit mit einer Startwarnung auf `allowlist` zurück (fail-closed).
</Note>

### Kanalbezogene Modell-Überschreibungen

Verwenden Sie `channels.modelByChannel`, um bestimmte Kanal-IDs an ein Modell zu binden. Werte akzeptieren `provider/model` oder konfigurierte Modell-Aliasse. Die Kanalzuordnung wird angewendet, wenn eine Sitzung noch keine Modell-Überschreibung hat (zum Beispiel gesetzt über `/model`).

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

- `channels.defaults.groupPolicy`: Fallback-Gruppenrichtlinie, wenn `groupPolicy` auf Provider-Ebene nicht gesetzt ist.
- `channels.defaults.contextVisibility`: Standardmodus für die Sichtbarkeit ergänzenden Kontexts für alle Kanäle. Werte: `all` (Standard, gesamten zitierten/Thread-/Verlaufskontext einschließen), `allowlist` (nur Kontext von Absendern auf der Allowlist einschließen), `allowlist_quote` (wie allowlist, aber expliziten Zitat-/Antwortkontext beibehalten). Überschreibung pro Kanal: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: gesunde Kanalstatus in die Heartbeat-Ausgabe einschließen.
- `channels.defaults.heartbeat.showAlerts`: beeinträchtigte/fehlerhafte Status in die Heartbeat-Ausgabe einschließen.
- `channels.defaults.heartbeat.useIndicator`: kompakte Heartbeat-Ausgabe im Stil eines Indikators rendern.

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
      sendReadReceipts: true, // blaue Haken (false im Selbstchatmodus)
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
- Das veraltete Baileys-Authentifizierungsverzeichnis für ein einzelnes Konto wird von `openclaw doctor` nach `whatsapp/default` migriert.
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
      streaming: "partial", // off | partial | block | progress (Standard: off; explizit aktivieren, um Rate-Limits für Vorschau-Bearbeitungen zu vermeiden)
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

- Bot-Token: `channels.telegram.botToken` oder `channels.telegram.tokenFile` (nur reguläre Datei; Symlinks werden abgewiesen), mit `TELEGRAM_BOT_TOKEN` als Fallback für das Standardkonto.
- Optional überschreibt `channels.telegram.defaultAccount` die Standardkontenauswahl, wenn es mit einer konfigurierten Konto-ID übereinstimmt.
- In Setups mit mehreren Konten (2+ Konto-IDs) setzen Sie einen expliziten Standard (`channels.telegram.defaultAccount` oder `channels.telegram.accounts.default`), um Fallback-Routing zu vermeiden; `openclaw doctor` warnt, wenn dies fehlt oder ungültig ist.
- `configWrites: false` blockiert von Telegram initiierte Konfigurationsschreibvorgänge (Supergroup-ID-Migrationen, `/config set|unset`).
- Top-Level-Einträge `bindings[]` mit `type: "acp"` konfigurieren persistente ACP-Bindings für Forenthemen (verwenden Sie das kanonische `chatId:topic:topicId` in `match.peer.id`). Die Feldsemantik ist gemeinsam beschrieben in [ACP Agents](/de/tools/acp-agents#channel-specific-settings).
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
              systemPrompt: "Short answers only.",
            },
          },
        },
      },
      historyLimit: 20,
      textChunkLimit: 2000,
      chunkMode: "length", // length | newline
      streaming: "off", // off | partial | block | progress (progress wird auf Discord auf partial abgebildet)
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
- Direkte ausgehende Aufrufe, die ein explizites Discord-`token` bereitstellen, verwenden dieses Token für den Aufruf; Wiederholungs-/Richtlinieneinstellungen des Kontos stammen weiterhin aus dem ausgewählten Konto im aktiven Laufzeit-Snapshot.
- Optional überschreibt `channels.discord.defaultAccount` die Standardkontenauswahl, wenn es mit einer konfigurierten Konto-ID übereinstimmt.
- Verwenden Sie `user:<id>` (DM) oder `channel:<id>` (Guild-Kanal) für Zustellziele; bloße numerische IDs werden abgewiesen.
- Guild-Slugs sind kleingeschrieben, wobei Leerzeichen durch `-` ersetzt werden; Kanalschlüssel verwenden den Slug-Namen (ohne `#`). Bevorzugen Sie Guild-IDs.
- Von Bots verfasste Nachrichten werden standardmäßig ignoriert. `allowBots: true` aktiviert sie; verwenden Sie `allowBots: "mentions"`, um nur Bot-Nachrichten zu akzeptieren, die den Bot erwähnen (eigene Nachrichten werden weiterhin gefiltert).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (und Kanalüberschreibungen) verwirft Nachrichten, die einen anderen Benutzer oder eine andere Rolle erwähnen, aber nicht den Bot (ausgenommen @everyone/@here).
- `maxLinesPerMessage` (Standard 17) teilt hohe Nachrichten auf, auch wenn sie unter 2000 Zeichen liegen.
- `channels.discord.threadBindings` steuert an Discord-Threads gebundenes Routing:
  - `enabled`: Discord-Überschreibung für an Threads gebundene Sitzungsfunktionen (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` sowie gebundene Zustellung/gebundenes Routing)
  - `idleHours`: Discord-Überschreibung für automatisches Entfokussieren nach Inaktivität in Stunden (`0` deaktiviert)
  - `maxAgeHours`: Discord-Überschreibung für harte maximale Laufzeit in Stunden (`0` deaktiviert)
  - `spawnSubagentSessions`: Opt-in-Schalter für automatische Thread-Erstellung/-Bindung bei `sessions_spawn({ thread: true })`
- Top-Level-Einträge `bindings[]` mit `type: "acp"` konfigurieren persistente ACP-Bindings für Kanäle und Threads (verwenden Sie die Kanal-/Thread-ID in `match.peer.id`). Die Feldsemantik ist gemeinsam beschrieben in [ACP Agents](/de/tools/acp-agents#channel-specific-settings).
- `channels.discord.ui.components.accentColor` setzt die Akzentfarbe für Discord-Container von Components v2.
- `channels.discord.voice` aktiviert Discord-Sprachkanalunterhaltungen und optionale Überschreibungen für automatischen Beitritt + LLM + TTS.
- `channels.discord.voice.model` überschreibt optional das für Antworten in Discord-Sprachkanälen verwendete LLM-Modell.
- `channels.discord.voice.daveEncryption` und `channels.discord.voice.decryptionFailureTolerance` werden an DAVE-Optionen von `@discordjs/voice` durchgereicht (standardmäßig `true` und `24`).
- OpenClaw versucht zusätzlich, den Empfang von Sprache wiederherzustellen, indem eine Sprachsitzung nach wiederholten Entschlüsselungsfehlern verlassen und erneut betreten wird.
- `channels.discord.streaming` ist der kanonische Schlüssel für den Stream-Modus. Veraltete Werte `streamMode` und boolesche `streaming`-Werte werden automatisch migriert.
- `channels.discord.autoPresence` bildet die Verfügbarkeit der Laufzeit auf die Bot-Präsenz ab (healthy => online, degraded => idle, exhausted => dnd) und erlaubt optionale Überschreibungen des Statustexts.
- `channels.discord.dangerouslyAllowNameMatching` aktiviert veränderliches Namens-/Tag-Matching erneut (Break-Glass-Kompatibilitätsmodus).
- `channels.discord.execApprovals`: native Discord-Zustellung von Exec-Genehmigungen und Autorisierung von Genehmigenden.
  - `enabled`: `true`, `false` oder `"auto"` (Standard). Im Auto-Modus werden Exec-Genehmigungen aktiviert, wenn Genehmigende aus `approvers` oder `commands.ownerAllowFrom` aufgelöst werden können.
  - `approvers`: Discord-Benutzer-IDs, die Exec-Anfragen genehmigen dürfen. Fällt auf `commands.ownerAllowFrom` zurück, wenn nicht gesetzt.
  - `agentFilter`: optionale Allowlist für Agenten-IDs. Weglassen, um Genehmigungen für alle Agenten weiterzuleiten.
  - `sessionFilter`: optionale Muster für Sitzungsschlüssel (Teilzeichenfolge oder Regex).
  - `target`: wohin Genehmigungsaufforderungen gesendet werden. `"dm"` (Standard) sendet an DMs der Genehmigenden, `"channel"` sendet an den Ursprungskanal, `"both"` sendet an beide. Wenn das Ziel `"channel"` enthält, sind Buttons nur für aufgelöste Genehmigende nutzbar.
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

- JSON für Servicekonto: inline (`serviceAccount`) oder dateibasiert (`serviceAccountFile`).
- SecretRef für Servicekonto wird ebenfalls unterstützt (`serviceAccountRef`).
- Umgebungs-Fallbacks: `GOOGLE_CHAT_SERVICE_ACCOUNT` oder `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
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
        nativeTransport: true, // native Streaming-API von Slack verwenden, wenn mode=partial
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

- **Socket-Modus** erfordert sowohl `botToken` als auch `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` als Umgebungs-Fallback für das Standardkonto).
- **HTTP-Modus** erfordert `botToken` plus `signingSecret` (auf Root-Ebene oder pro Konto).
- `botToken`, `appToken`, `signingSecret` und `userToken` akzeptieren Klartext-
  Zeichenfolgen oder SecretRef-Objekte.
- Slack-Konto-Snapshots stellen pro Anmeldedatenquelle/Feld Statusfelder bereit wie
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` und im HTTP-Modus
  `signingSecretStatus`. `configured_unavailable` bedeutet, dass das Konto
  über SecretRef konfiguriert ist, der aktuelle Befehls-/Laufzeitpfad den
  Secret-Wert aber nicht auflösen konnte.
- `configWrites: false` blockiert von Slack initiierte Konfigurationsschreibvorgänge.
- Optional überschreibt `channels.slack.defaultAccount` die Standardkontenauswahl, wenn es mit einer konfigurierten Konto-ID übereinstimmt.
- `channels.slack.streaming.mode` ist der kanonische Schlüssel für den Slack-Stream-Modus. `channels.slack.streaming.nativeTransport` steuert den nativen Streaming-Transport von Slack. Veraltete Werte `streamMode`, boolesche `streaming`-Werte und `nativeStreaming` werden automatisch migriert.
- Verwenden Sie `user:<id>` (DM) oder `channel:<id>` für Zustellziele.

**Modi für Reaktionsbenachrichtigungen:** `off`, `own` (Standard), `all`, `allowlist` (aus `reactionAllowlist`).

**Isolierung von Thread-Sitzungen:** `thread.historyScope` ist pro Thread (Standard) oder wird über den Kanal geteilt. `thread.inheritParent` kopiert das Transcript des übergeordneten Kanals in neue Threads.

- Natives Slack-Streaming plus der assistant-artige Thread-Status „is typing...“ von Slack erfordern ein Antwortziel im Thread. DMs auf oberster Ebene bleiben standardmäßig außerhalb von Threads, daher verwenden sie `typingReaction` oder normale Zustellung statt der Vorschau im Thread-Stil.
- `typingReaction` fügt der eingehenden Slack-Nachricht vorübergehend eine Reaktion hinzu, während eine Antwort läuft, und entfernt sie nach Abschluss. Verwenden Sie einen Slack-Emoji-Shortcode wie `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: native Slack-Zustellung von Exec-Genehmigungen und Autorisierung von Genehmigenden. Dasselbe Schema wie bei Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (Slack-Benutzer-IDs), `agentFilter`, `sessionFilter` und `target` (`"dm"`, `"channel"` oder `"both"`).

| Aktionsgruppe | Standard | Hinweise                   |
| ------------- | -------- | -------------------------- |
| reactions     | aktiviert | Reagieren + Reaktionen auflisten |
| messages      | aktiviert | Lesen/senden/bearbeiten/löschen  |
| pins          | aktiviert | Anheften/lösen/auflisten   |
| memberInfo    | aktiviert | Mitgliedsinformationen     |
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

Wenn native Mattermost-Befehle aktiviert sind:

- `commands.callbackPath` muss ein Pfad sein (zum Beispiel `/api/channels/mattermost/command`), keine vollständige URL.
- `commands.callbackUrl` muss zum Gateway-Endpunkt von OpenClaw auflösen und vom Mattermost-Server aus erreichbar sein.
- Native Slash-Callbacks werden mit den pro Befehl zurückgegebenen Tokens authentifiziert,
  die Mattermost während der Registrierung von Slash-Befehlen zurückgibt. Wenn die Registrierung fehlschlägt oder keine
  Befehle aktiviert sind, weist OpenClaw Callbacks mit
  `Unauthorized: invalid command token.` zurück.
- Für private/tailnet/interne Callback-Hosts kann Mattermost verlangen, dass
  `ServiceSettings.AllowedUntrustedInternalConnections` den Callback-Host/die Callback-Domain einschließt.
  Verwenden Sie Host-/Domain-Werte, keine vollständigen URLs.
- `channels.mattermost.configWrites`: von Mattermost initiierte Konfigurationsschreibvorgänge zulassen oder verweigern.
- `channels.mattermost.requireMention`: `@mention` vor Antworten in Kanälen verlangen.
- `channels.mattermost.groups.<channelId>.requireMention`: Überschreibung der Erwähnungsbedingung pro Kanal (`"*"` für Standard).
- Optional überschreibt `channels.mattermost.defaultAccount` die Standardkontenauswahl, wenn es mit einer konfigurierten Konto-ID übereinstimmt.

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
- Optional überschreibt `channels.signal.defaultAccount` die Standardkontenauswahl, wenn es mit einer konfigurierten Konto-ID übereinstimmt.

### BlueBubbles

BlueBubbles ist der empfohlene iMessage-Pfad (plugin-gestützt, konfiguriert unter `channels.bluebubbles`).

```json5
{
  channels: {
    bluebubbles: {
      enabled: true,
      dmPolicy: "pairing",
      // serverUrl, password, webhookPath, group controls und erweiterte Aktionen:
      // siehe /channels/bluebubbles
    },
  },
}
```

- Hier abgedeckte zentrale Schlüsselpfade: `channels.bluebubbles`, `channels.bluebubbles.dmPolicy`.
- Optional überschreibt `channels.bluebubbles.defaultAccount` die Standardkontenauswahl, wenn es mit einer konfigurierten Konto-ID übereinstimmt.
- Top-Level-Einträge `bindings[]` mit `type: "acp"` können BlueBubbles-Unterhaltungen an persistente ACP-Sitzungen binden. Verwenden Sie einen BlueBubbles-Handle oder Zielstring (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) in `match.peer.id`. Gemeinsame Feldsemantik: [ACP Agents](/de/tools/acp-agents#channel-specific-settings).
- Die vollständige Konfiguration des BlueBubbles-Kanals ist dokumentiert in [BlueBubbles](/de/channels/bluebubbles).

### iMessage

OpenClaw startet `imsg rpc` (JSON-RPC über stdio). Kein Daemon und kein Port erforderlich.

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

- Optional überschreibt `channels.imessage.defaultAccount` die Standardkontenauswahl, wenn es mit einer konfigurierten Konto-ID übereinstimmt.

- Erfordert Full Disk Access für die Messages-Datenbank.
- Bevorzugen Sie Ziele vom Typ `chat_id:<id>`. Verwenden Sie `imsg chats --limit 20`, um Chats aufzulisten.
- `cliPath` kann auf einen SSH-Wrapper zeigen; setzen Sie `remoteHost` (`host` oder `user@host`) für das Abrufen von Anhängen per SCP.
- `attachmentRoots` und `remoteAttachmentRoots` beschränken Pfade für eingehende Anhänge (Standard: `/Users/*/Library/Messages/Attachments`).
- SCP verwendet strikte Host-Key-Prüfung, daher stellen Sie sicher, dass der Host-Key des Relays bereits in `~/.ssh/known_hosts` vorhanden ist.
- `channels.imessage.configWrites`: von iMessage initiierte Konfigurationsschreibvorgänge zulassen oder verweigern.
- Top-Level-Einträge `bindings[]` mit `type: "acp"` können iMessage-Unterhaltungen an persistente ACP-Sitzungen binden. Verwenden Sie einen normalisierten Handle oder ein explizites Chat-Ziel (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) in `match.peer.id`. Gemeinsame Feldsemantik: [ACP Agents](/de/tools/acp-agents#channel-specific-settings).

<Accordion title="Beispiel für einen iMessage-SSH-Wrapper">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix ist plugin-gestützt und wird unter `channels.matrix` konfiguriert.

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
- `channels.matrix.proxy` leitet den HTTP-Verkehr von Matrix über einen expliziten HTTP(S)-Proxy. Benannte Konten können dies mit `channels.matrix.accounts.<id>.proxy` überschreiben.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` erlaubt private/interne Homeserver. `proxy` und dieses Netzwerk-Opt-in sind unabhängige Steuerungen.
- `channels.matrix.defaultAccount` wählt in Setups mit mehreren Konten das bevorzugte Konto aus.
- `channels.matrix.autoJoin` ist standardmäßig `off`, daher werden eingeladene Räume und neue DM-artige Einladungen ignoriert, bis Sie `autoJoin: "allowlist"` mit `autoJoinAllowlist` oder `autoJoin: "always"` setzen.
- `channels.matrix.execApprovals`: native Matrix-Zustellung von Exec-Genehmigungen und Autorisierung von Genehmigenden.
  - `enabled`: `true`, `false` oder `"auto"` (Standard). Im Auto-Modus werden Exec-Genehmigungen aktiviert, wenn Genehmigende aus `approvers` oder `commands.ownerAllowFrom` aufgelöst werden können.
  - `approvers`: Matrix-Benutzer-IDs (z. B. `@owner:example.org`), die Exec-Anfragen genehmigen dürfen.
  - `agentFilter`: optionale Allowlist für Agenten-IDs. Weglassen, um Genehmigungen für alle Agenten weiterzuleiten.
  - `sessionFilter`: optionale Muster für Sitzungsschlüssel (Teilzeichenfolge oder Regex).
  - `target`: wohin Genehmigungsaufforderungen gesendet werden. `"dm"` (Standard), `"channel"` (Ursprungsraum) oder `"both"`.
  - Überschreibungen pro Konto: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` steuert, wie Matrix-DMs in Sitzungen gruppiert werden: `per-user` (Standard) teilt nach geroutetem Peer, während `per-room` jeden DM-Raum isoliert.
- Status-Probes und Live-Verzeichnissuchen von Matrix verwenden dieselbe Proxy-Richtlinie wie der Laufzeitverkehr.
- Die vollständige Matrix-Konfiguration, Zielregeln und Einrichtungsbeispiele sind dokumentiert in [Matrix](/de/channels/matrix).

### Microsoft Teams

Microsoft Teams ist plugin-gestützt und wird unter `channels.msteams` konfiguriert.

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, Team-/Kanalrichtlinien:
      // siehe /channels/msteams
    },
  },
}
```

- Hier abgedeckte zentrale Schlüsselpfade: `channels.msteams`, `channels.msteams.configWrites`.
- Die vollständige Teams-Konfiguration (Anmeldedaten, Webhook, DM-/Gruppenrichtlinie, Überschreibungen pro Team/pro Kanal) ist dokumentiert in [Microsoft Teams](/de/channels/msteams).

### IRC

IRC ist plugin-gestützt und wird unter `channels.irc` konfiguriert.

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
- Optional überschreibt `channels.irc.defaultAccount` die Standardkontenauswahl, wenn es mit einer konfigurierten Konto-ID übereinstimmt.
- Die vollständige IRC-Kanalkonfiguration (Host/Port/TLS/Kanäle/Allowlists/Erwähnungsbedingung) ist dokumentiert in [IRC](/de/channels/irc).

### Mehrere Konten (alle Kanäle)

Führen Sie mehrere Konten pro Kanal aus (jedes mit eigener `accountId`):

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
- Umgebungs-Token gelten nur für das **Standardkonto**.
- Basis-Kanaleinstellungen gelten für alle Konten, sofern sie nicht pro Konto überschrieben werden.
- Verwenden Sie `bindings[].match.accountId`, um jedes Konto an einen anderen Agenten zu routen.
- Wenn Sie über `openclaw channels add` (oder Kanal-Onboarding) ein nicht standardmäßiges Konto hinzufügen, während Sie noch eine Top-Level-Kanalkonfiguration für ein einzelnes Konto verwenden, verschiebt OpenClaw zuerst kontobezogene Top-Level-Werte für Einzelkonten in die Kontomap des Kanals, damit das ursprüngliche Konto weiterhin funktioniert. Die meisten Kanäle verschieben sie nach `channels.<channel>.accounts.default`; Matrix kann stattdessen ein vorhandenes passendes benanntes/Standardziel beibehalten.
- Vorhandene nur kanalbezogene Bindings (ohne `accountId`) bleiben dem Standardkonto zugeordnet; kontoabhängige Bindings bleiben optional.
- `openclaw doctor --fix` repariert auch gemischte Strukturen, indem es kontobezogene Top-Level-Werte für Einzelkonten in das hochgestufte Konto verschiebt, das für diesen Kanal ausgewählt wurde. Die meisten Kanäle verwenden `accounts.default`; Matrix kann stattdessen ein vorhandenes passendes benanntes/Standardziel beibehalten.

### Andere Plugin-Kanäle

Viele Plugin-Kanäle werden als `channels.<id>` konfiguriert und in ihren eigenen Kanalseiten dokumentiert (zum Beispiel Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat und Twitch).
Siehe den vollständigen Kanalindex: [Channels](/de/channels).

### Erwähnungsbedingung in Gruppenchats

Gruppennachrichten erfordern standardmäßig eine **Erwähnung** (Metadaten-Erwähnung oder sichere Regex-Muster). Gilt für Gruppenchats in WhatsApp, Telegram, Discord, Google Chat und iMessage.

**Arten von Erwähnungen:**

- **Metadaten-Erwähnungen**: Native @-Erwähnungen der Plattform. Im Selbstchatmodus von WhatsApp ignoriert.
- **Textmuster**: Sichere Regex-Muster in `agents.list[].groupChat.mentionPatterns`. Ungültige Muster und unsichere verschachtelte Wiederholungen werden ignoriert.
- Die Erwähnungsbedingung wird nur durchgesetzt, wenn Erkennung möglich ist (native Erwähnungen oder mindestens ein Muster).

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

`messages.groupChat.historyLimit` setzt den globalen Standard. Kanäle können dies mit `channels.<channel>.historyLimit` überschreiben (oder pro Konto). Setzen Sie `0`, um es zu deaktivieren.

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

#### Selbstchatmodus

Nehmen Sie Ihre eigene Nummer in `allowFrom` auf, um den Selbstchatmodus zu aktivieren (ignoriert native @-Erwähnungen, reagiert nur auf Textmuster):

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

### Befehle (Verarbeitung von Chat-Befehlen)

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
    restart: true, // /restart + Gateway-Neustart-Tool erlauben
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

- Dieser Block konfiguriert Befehlsoberflächen. Für den aktuellen Katalog integrierter und gebündelter Befehle siehe [Slash Commands](/de/tools/slash-commands).
- Diese Seite ist eine **Referenz für Konfigurationsschlüssel**, nicht der vollständige Befehlskatalog. Kanal-/pluginbezogene Befehle wie QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, Device-Pair `/pair`, Memory `/dreaming`, Phone-Control `/phone` und Talk `/voice` sind in ihren Kanal-/Plugin-Seiten sowie unter [Slash Commands](/de/tools/slash-commands) dokumentiert.
- Textbefehle müssen **eigenständige** Nachrichten sein und mit `/` beginnen.
- `native: "auto"` aktiviert native Befehle für Discord/Telegram und lässt Slack deaktiviert.
- `nativeSkills: "auto"` aktiviert native Skills-Befehle für Discord/Telegram und lässt Slack deaktiviert.
- Überschreibung pro Kanal: `channels.discord.commands.native` (bool oder `"auto"`). `false` löscht zuvor registrierte Befehle.
- Überschreiben Sie die Registrierung nativer Skills pro Kanal mit `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` fügt zusätzliche Telegram-Bot-Menüeinträge hinzu.
- `bash: true` aktiviert `! <cmd>` für die Host-Shell. Erfordert `tools.elevated.enabled` und einen Absender in `tools.elevated.allowFrom.<channel>`.
- `config: true` aktiviert `/config` (liest/schreibt `openclaw.json`). Für Gateway-Clients mit `chat.send` erfordern persistente Schreibvorgänge per `/config set|unset` außerdem `operator.admin`; das schreibgeschützte `/config show` bleibt für normale Operator-Clients mit Schreibbereich verfügbar.
- `mcp: true` aktiviert `/mcp` für von OpenClaw verwaltete MCP-Serverkonfiguration unter `mcp.servers`.
- `plugins: true` aktiviert `/plugins` für Plugin-Erkennung, Installation sowie Aktivieren-/Deaktivieren-Steuerung.
- `channels.<provider>.configWrites` steuert Konfigurationsänderungen pro Kanal (Standard: true).
- Für Kanäle mit mehreren Konten steuert `channels.<provider>.accounts.<id>.configWrites` außerdem Schreibvorgänge, die dieses Konto betreffen (zum Beispiel `/allowlist --config --account <id>` oder `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` deaktiviert `/restart` und Tool-Aktionen zum Neustart des Gateway. Standard: `true`.
- `ownerAllowFrom` ist die explizite Eigentümer-Allowlist für Befehle/Tools nur für Eigentümer. Sie ist getrennt von `allowFrom`.
- `ownerDisplay: "hash"` hasht Eigentümer-IDs im Systemprompt. Setzen Sie `ownerDisplaySecret`, um das Hashing zu steuern.
- `allowFrom` gilt pro Provider. Wenn gesetzt, ist es die **einzige** Autorisierungsquelle (Kanal-Allowlists/Pairing und `useAccessGroups` werden ignoriert).
- `useAccessGroups: false` erlaubt es Befehlen, Richtlinien von Zugriffsgruppen zu umgehen, wenn `allowFrom` nicht gesetzt ist.
- Zuordnung der Befehlsdokumentation:
  - integrierter + gebündelter Katalog: [Slash Commands](/de/tools/slash-commands)
  - kanalspezifische Befehlsoberflächen: [Channels](/de/channels)
  - QQ-Bot-Befehle: [QQ Bot](/de/channels/qqbot)
  - Pairing-Befehle: [Pairing](/de/channels/pairing)
  - LINE-Kartenbefehl: [LINE](/de/channels/line)
  - Memory Dreaming: [Dreaming](/de/concepts/dreaming)

</Accordion>

---

## Verwandt

- [Configuration reference](/de/gateway/configuration-reference) — Schlüssel der obersten Ebene
- [Configuration — agents](/de/gateway/config-agents)
- [Channels overview](/de/channels)
