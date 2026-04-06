---
read_when:
    - Sie benötigen genaue feldspezifische Konfigurationssemantik oder Standardwerte
    - Sie validieren Kanal-, Modell-, Gateway- oder Tool-Konfigurationsblöcke
summary: Vollständige Referenz für jeden OpenClaw-Konfigurationsschlüssel, Standardwerte und Kanaleinstellungen
title: Konfigurationsreferenz
x-i18n:
    generated_at: "2026-04-06T03:12:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6aa6b24b593f6f07118817afabea4cc7842aca6b7c5602b45f479b40c1685230
    source_path: gateway/configuration-reference.md
    workflow: 15
---

# Konfigurationsreferenz

Jedes Feld, das in `~/.openclaw/openclaw.json` verfügbar ist. Eine auf Aufgaben ausgerichtete Übersicht finden Sie unter [Konfiguration](/de/gateway/configuration).

Das Konfigurationsformat ist **JSON5** (Kommentare + nachgestellte Kommas sind erlaubt). Alle Felder sind optional — OpenClaw verwendet sichere Standardwerte, wenn sie weggelassen werden.

---

## Kanäle

Jeder Kanal startet automatisch, sobald sein Konfigurationsabschnitt vorhanden ist (außer bei `enabled: false`).

### DM- und Gruppenzugriff

Alle Kanäle unterstützen DM-Richtlinien und Gruppenrichtlinien:

| DM-Richtlinie      | Verhalten                                                      |
| ------------------ | -------------------------------------------------------------- |
| `pairing` (Standard) | Unbekannte Absender erhalten einen einmaligen Pairing-Code; der Eigentümer muss zustimmen |
| `allowlist`        | Nur Absender in `allowFrom` (oder im gepaarten Allow-Store)    |
| `open`             | Alle eingehenden DMs erlauben (erfordert `allowFrom: ["*"]`)   |
| `disabled`         | Alle eingehenden DMs ignorieren                                |

| Gruppenrichtlinie   | Verhalten                                             |
| ------------------- | ----------------------------------------------------- |
| `allowlist` (Standard) | Nur Gruppen, die der konfigurierten Allowlist entsprechen |
| `open`              | Gruppen-Allowlists umgehen (Mention-Gating gilt weiterhin) |
| `disabled`          | Alle Gruppen-/Raumnachrichten blockieren              |

<Note>
`channels.defaults.groupPolicy` legt den Standard fest, wenn `groupPolicy` eines Anbieters nicht gesetzt ist.
Pairing-Codes laufen nach 1 Stunde ab. Ausstehende DM-Pairing-Anfragen sind auf **3 pro Kanal** begrenzt.
Wenn ein Anbieterblock vollständig fehlt (`channels.<provider>` nicht vorhanden), fällt die Laufzeit-Gruppenrichtlinie auf `allowlist` zurück (fail-closed) und gibt beim Start eine Warnung aus.
</Note>

### Modell-Overrides pro Kanal

Verwenden Sie `channels.modelByChannel`, um bestimmte Kanal-IDs an ein Modell zu binden. Werte akzeptieren `provider/model` oder konfigurierte Modell-Aliasse. Die Kanalzuordnung gilt, wenn eine Sitzung noch keinen Modell-Override hat (zum Beispiel durch `/model` gesetzt).

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

- `channels.defaults.groupPolicy`: Fallback-Gruppenrichtlinie, wenn `groupPolicy` auf Anbieterebene nicht gesetzt ist.
- `channels.defaults.contextVisibility`: Standardmodus für ergänzende Kontextsichbarkeit für alle Kanäle. Werte: `all` (Standard, gesamten zitierten/Thread-/Verlaufs-Kontext einschließen), `allowlist` (nur Kontext von Absendern auf der Allowlist einschließen), `allowlist_quote` (wie allowlist, aber expliziten Zitat-/Antwortkontext beibehalten). Override pro Kanal: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: Gesunde Kanalstatus in der Heartbeat-Ausgabe einschließen.
- `channels.defaults.heartbeat.showAlerts`: Herabgestufte/Fehlerstatus in der Heartbeat-Ausgabe einschließen.
- `channels.defaults.heartbeat.useIndicator`: Kompakte Heartbeat-Ausgabe im Indikatorstil rendern.

### WhatsApp

WhatsApp läuft über den Web-Kanal des Gateways (Baileys Web). Er startet automatisch, wenn eine verknüpfte Sitzung vorhanden ist.

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // blaue Haken (false im Self-Chat-Modus)
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

<Accordion title="Multi-Account-WhatsApp">

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

- Ausgehende Befehle verwenden standardmäßig das Konto `default`, wenn vorhanden; andernfalls die erste konfigurierte Konto-ID (sortiert).
- Optional überschreibt `channels.whatsapp.defaultAccount` diese Fallback-Standardkontenauswahl, wenn es einer konfigurierten Konto-ID entspricht.
- Das Legacy-Authentifizierungsverzeichnis für ein einzelnes Baileys-Konto wird von `openclaw doctor` nach `whatsapp/default` migriert.
- Overrides pro Konto: `channels.whatsapp.accounts.<id>.sendReadReceipts`, `channels.whatsapp.accounts.<id>.dmPolicy`, `channels.whatsapp.accounts.<id>.allowFrom`.

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
          systemPrompt: "Antworten kurz halten.",
          topics: {
            "99": {
              requireMention: false,
              skills: ["search"],
              systemPrompt: "Beim Thema bleiben.",
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
      streaming: "partial", // off | partial | block | progress (Standard: off; explizit aktivieren, um Ratenlimits bei Vorschau-Bearbeitungen zu vermeiden)
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
- Optional überschreibt `channels.telegram.defaultAccount` die Standardkontenauswahl, wenn es einer konfigurierten Konto-ID entspricht.
- In Multi-Account-Setups (2+ Konto-IDs) setzen Sie einen expliziten Standard (`channels.telegram.defaultAccount` oder `channels.telegram.accounts.default`), um Fallback-Routing zu vermeiden; `openclaw doctor` warnt, wenn dies fehlt oder ungültig ist.
- `configWrites: false` blockiert von Telegram ausgelöste Konfigurationsschreibvorgänge (Supergroup-ID-Migrationen, `/config set|unset`).
- Top-Level-Einträge in `bindings[]` mit `type: "acp"` konfigurieren persistente ACP-Bindings für Foren-Topics (verwenden Sie das kanonische `chatId:topic:topicId` in `match.peer.id`). Die Feldsemantik wird in [ACP Agents](/de/tools/acp-agents#channel-specific-settings) gemeinsam beschrieben.
- Telegram-Streaming-Vorschauen verwenden `sendMessage` + `editMessageText` (funktioniert in Direkt- und Gruppenchats).
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
              systemPrompt: "Nur kurze Antworten.",
            },
          },
        },
      },
      historyLimit: 20,
      textChunkLimit: 2000,
      chunkMode: "length", // length | newline
      streaming: "off", // off | partial | block | progress (progress wird in Discord auf partial abgebildet)
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
- Direkte ausgehende Aufrufe, die ein explizites Discord-`token` bereitstellen, verwenden dieses Token für den Aufruf; Kontoretry-/Richtlinieneinstellungen stammen weiterhin vom ausgewählten Konto im aktiven Laufzeit-Snapshot.
- Optional überschreibt `channels.discord.defaultAccount` die Standardkontenauswahl, wenn es einer konfigurierten Konto-ID entspricht.
- Verwenden Sie `user:<id>` (DM) oder `channel:<id>` (Guild-Kanal) für Zustellziele; rohe numerische IDs werden abgelehnt.
- Guild-Slugs sind kleingeschrieben, Leerzeichen werden durch `-` ersetzt; Kanalschlüssel verwenden den Slug-Namen (ohne `#`). Bevorzugen Sie Guild-IDs.
- Vom Bot verfasste Nachrichten werden standardmäßig ignoriert. `allowBots: true` aktiviert sie; verwenden Sie `allowBots: "mentions"`, um nur Bot-Nachrichten zu akzeptieren, die den Bot erwähnen (eigene Nachrichten werden weiterhin gefiltert).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (und Kanal-Overrides) verwirft Nachrichten, die einen anderen Benutzer oder eine Rolle erwähnen, aber nicht den Bot (ausgenommen @everyone/@here).
- `maxLinesPerMessage` (Standard 17) teilt hohe Nachrichten auch dann auf, wenn sie unter 2000 Zeichen liegen.
- `channels.discord.threadBindings` steuert an Discord-Threads gebundenes Routing:
  - `enabled`: Discord-Override für threadgebundene Sitzungsfunktionen (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` und gebundene Zustellung/gebundenes Routing)
  - `idleHours`: Discord-Override für automatisches Unfocus bei Inaktivität in Stunden (`0` deaktiviert)
  - `maxAgeHours`: Discord-Override für harte Maximaldauer in Stunden (`0` deaktiviert)
  - `spawnSubagentSessions`: Opt-in-Schalter für die automatische Thread-Erstellung/-Bindung bei `sessions_spawn({ thread: true })`
- Top-Level-Einträge in `bindings[]` mit `type: "acp"` konfigurieren persistente ACP-Bindings für Kanäle und Threads (verwenden Sie Kanal-/Thread-ID in `match.peer.id`). Die Feldsemantik wird in [ACP Agents](/de/tools/acp-agents#channel-specific-settings) gemeinsam beschrieben.
- `channels.discord.ui.components.accentColor` setzt die Akzentfarbe für Discord-Komponenten-v2-Container.
- `channels.discord.voice` aktiviert Discord-Sprachkanalunterhaltungen und optionale Auto-Join- + TTS-Overrides.
- `channels.discord.voice.daveEncryption` und `channels.discord.voice.decryptionFailureTolerance` werden an die DAVE-Optionen von `@discordjs/voice` durchgereicht (standardmäßig `true` und `24`).
- OpenClaw versucht zusätzlich, die Sprachübertragung wiederherzustellen, indem eine Sprachsitzung nach wiederholten Entschlüsselungsfehlern verlassen und erneut betreten wird.
- `channels.discord.streaming` ist der kanonische Schlüssel für den Streaming-Modus. Legacy-`streamMode`- und boolesche `streaming`-Werte werden automatisch migriert.
- `channels.discord.autoPresence` ordnet die Laufzeitverfügbarkeit der Bot-Präsenz zu (healthy => online, degraded => idle, exhausted => dnd) und erlaubt optionale Overrides für den Statustext.
- `channels.discord.dangerouslyAllowNameMatching` aktiviert veränderliches Namens-/Tag-Matching erneut (Break-Glass-Kompatibilitätsmodus).
- `channels.discord.execApprovals`: Discord-native Zustellung von Exec-Genehmigungen und Autorisierung von Genehmigern.
  - `enabled`: `true`, `false` oder `"auto"` (Standard). Im Auto-Modus werden Exec-Genehmigungen aktiviert, wenn Genehmiger aus `approvers` oder `commands.ownerAllowFrom` aufgelöst werden können.
  - `approvers`: Discord-Benutzer-IDs, die Exec-Anfragen genehmigen dürfen. Fällt bei Auslassung auf `commands.ownerAllowFrom` zurück.
  - `agentFilter`: optionale Allowlist für Agent-IDs. Weglassen, um Genehmigungen für alle Agenten weiterzuleiten.
  - `sessionFilter`: optionale Sitzungsschlüssel-Muster (Substring oder Regex).
  - `target`: wohin Genehmigungsaufforderungen gesendet werden. `"dm"` (Standard) sendet an die DMs der Genehmiger, `"channel"` sendet an den Ursprungskanal, `"both"` sendet an beide. Wenn das Ziel `"channel"` enthält, sind die Schaltflächen nur für aufgelöste Genehmiger nutzbar.
  - `cleanupAfterResolve`: wenn `true`, löscht Genehmigungs-DMs nach Genehmigung, Ablehnung oder Timeout.

**Modi für Reaktionsbenachrichtigungen:** `off` (keine), `own` (Nachrichten des Bots, Standard), `all` (alle Nachrichten), `allowlist` (von `guilds.<id>.users` auf allen Nachrichten).

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
- Umgebungs-Fallbacks: `GOOGLE_CHAT_SERVICE_ACCOUNT` oder `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Verwenden Sie `spaces/<spaceId>` oder `users/<userId>` für Zustellziele.
- `channels.googlechat.dangerouslyAllowNameMatching` aktiviert veränderliches E-Mail-Prinzipal-Matching erneut (Break-Glass-Kompatibilitätsmodus).

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
      streaming: "partial", // off | partial | block | progress (Vorschaumodus)
      nativeStreaming: true, // Slack-native Streaming-API verwenden, wenn streaming=partial
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
- **HTTP-Modus** erfordert `botToken` plus `signingSecret` (am Root oder pro Konto).
- `botToken`, `appToken`, `signingSecret` und `userToken` akzeptieren Klartext-Strings oder SecretRef-Objekte.
- Slack-Konto-Snapshots stellen Felder pro Anmeldedatenquelle/-status bereit, etwa `botTokenSource`, `botTokenStatus`, `appTokenStatus` und im HTTP-Modus `signingSecretStatus`. `configured_unavailable` bedeutet, dass das Konto über SecretRef konfiguriert ist, der aktuelle Befehls-/Laufzeitpfad den Geheimniswert aber nicht auflösen konnte.
- `configWrites: false` blockiert von Slack ausgelöste Konfigurationsschreibvorgänge.
- Optional überschreibt `channels.slack.defaultAccount` die Standardkontenauswahl, wenn es einer konfigurierten Konto-ID entspricht.
- `channels.slack.streaming` ist der kanonische Schlüssel für den Streaming-Modus. Legacy-`streamMode`- und boolesche `streaming`-Werte werden automatisch migriert.
- Verwenden Sie `user:<id>` (DM) oder `channel:<id>` für Zustellziele.

**Modi für Reaktionsbenachrichtigungen:** `off`, `own` (Standard), `all`, `allowlist` (aus `reactionAllowlist`).

**Thread-Sitzungsisolation:** `thread.historyScope` gilt pro Thread (Standard) oder kanalweit gemeinsam. `thread.inheritParent` kopiert das Transkript des übergeordneten Kanals in neue Threads.

- `typingReaction` fügt der eingehenden Slack-Nachricht während einer laufenden Antwort vorübergehend eine Reaktion hinzu und entfernt sie nach Abschluss wieder. Verwenden Sie einen Slack-Emoji-Shortcode wie `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: Slack-native Zustellung von Exec-Genehmigungen und Autorisierung von Genehmigern. Gleiches Schema wie Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (Slack-Benutzer-IDs), `agentFilter`, `sessionFilter` und `target` (`"dm"`, `"channel"` oder `"both"`).

| Aktionsgruppe | Standard | Hinweise               |
| ------------- | -------- | ---------------------- |
| reactions     | aktiviert | Reagieren + Reaktionen auflisten |
| messages      | aktiviert | Lesen/Senden/Bearbeiten/Löschen |
| pins          | aktiviert | Anheften/Lösen/Auflisten |
| memberInfo    | aktiviert | Mitgliederinfos        |
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
        // Optional explizite URL für Reverse-Proxy-/öffentliche Deployments
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

Chat-Modi: `oncall` (auf @-Erwähnung antworten, Standard), `onmessage` (jede Nachricht), `onchar` (Nachrichten, die mit einem Trigger-Präfix beginnen).

Wenn Mattermost-native Befehle aktiviert sind:

- `commands.callbackPath` muss ein Pfad sein (zum Beispiel `/api/channels/mattermost/command`), keine vollständige URL.
- `commands.callbackUrl` muss auf den OpenClaw-Gateway-Endpunkt aufgelöst werden und vom Mattermost-Server aus erreichbar sein.
- Native Slash-Callbacks werden mit den pro Befehl erzeugten Tokens authentifiziert, die Mattermost bei der Registrierung des Slash-Befehls zurückgibt. Wenn die Registrierung fehlschlägt oder keine Befehle aktiviert werden, lehnt OpenClaw Callbacks mit `Unauthorized: invalid command token.` ab.
- Für private/tailnet/interne Callback-Hosts verlangt Mattermost möglicherweise, dass `ServiceSettings.AllowedUntrustedInternalConnections` den Callback-Host/-Domainnamen enthält.
  Verwenden Sie Host-/Domainwerte, keine vollständigen URLs.
- `channels.mattermost.configWrites`: von Mattermost ausgelöste Konfigurationsschreibvorgänge erlauben oder verweigern.
- `channels.mattermost.requireMention`: vor Antworten in Kanälen `@mention` verlangen.
- `channels.mattermost.groups.<channelId>.requireMention`: Override für Mention-Gating pro Kanal (`"*"` für Standard).
- Optional überschreibt `channels.mattermost.defaultAccount` die Standardkontenauswahl, wenn es einer konfigurierten Konto-ID entspricht.

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
- `channels.signal.configWrites`: von Signal ausgelöste Konfigurationsschreibvorgänge erlauben oder verweigern.
- Optional überschreibt `channels.signal.defaultAccount` die Standardkontenauswahl, wenn es einer konfigurierten Konto-ID entspricht.

### BlueBubbles

BlueBubbles ist der empfohlene iMessage-Pfad (plugin-gestützt, konfiguriert unter `channels.bluebubbles`).

```json5
{
  channels: {
    bluebubbles: {
      enabled: true,
      dmPolicy: "pairing",
      // serverUrl, password, webhookPath, Gruppenkontrollen und erweiterte Aktionen:
      // siehe /channels/bluebubbles
    },
  },
}
```

- Hier abgedeckte Kernschlüsselpfade: `channels.bluebubbles`, `channels.bluebubbles.dmPolicy`.
- Optional überschreibt `channels.bluebubbles.defaultAccount` die Standardkontenauswahl, wenn es einer konfigurierten Konto-ID entspricht.
- Top-Level-Einträge in `bindings[]` mit `type: "acp"` können BlueBubbles-Unterhaltungen an persistente ACP-Sitzungen binden. Verwenden Sie einen BlueBubbles-Handle oder Ziel-String (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) in `match.peer.id`. Gemeinsame Feldsemantik: [ACP Agents](/de/tools/acp-agents#channel-specific-settings).
- Die vollständige BlueBubbles-Kanalkonfiguration ist unter [BlueBubbles](/de/channels/bluebubbles) dokumentiert.

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

- Optional überschreibt `channels.imessage.defaultAccount` die Standardkontenauswahl, wenn es einer konfigurierten Konto-ID entspricht.

- Erfordert Vollzugriff auf die Messages-Datenbank.
- Bevorzugen Sie `chat_id:<id>`-Ziele. Verwenden Sie `imsg chats --limit 20`, um Chats aufzulisten.
- `cliPath` kann auf einen SSH-Wrapper verweisen; setzen Sie `remoteHost` (`host` oder `user@host`) für SCP-Anhangsabruf.
- `attachmentRoots` und `remoteAttachmentRoots` beschränken eingehende Anhangspfade (Standard: `/Users/*/Library/Messages/Attachments`).
- SCP verwendet strikte Host-Key-Prüfung, stellen Sie also sicher, dass der Schlüssel des Relay-Hosts bereits in `~/.ssh/known_hosts` vorhanden ist.
- `channels.imessage.configWrites`: von iMessage ausgelöste Konfigurationsschreibvorgänge erlauben oder verweigern.
- Top-Level-Einträge in `bindings[]` mit `type: "acp"` können iMessage-Unterhaltungen an persistente ACP-Sitzungen binden. Verwenden Sie einen normalisierten Handle oder ein explizites Chat-Ziel (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) in `match.peer.id`. Gemeinsame Feldsemantik: [ACP Agents](/de/tools/acp-agents#channel-specific-settings).

<Accordion title="Beispiel für iMessage-SSH-Wrapper">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix ist erweiterungsgestützt und wird unter `channels.matrix` konfiguriert.

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

- Token-Auth verwendet `accessToken`; Passwort-Auth verwendet `userId` + `password`.
- `channels.matrix.proxy` leitet Matrix-HTTP-Traffic über einen expliziten HTTP(S)-Proxy. Benannte Konten können dies mit `channels.matrix.accounts.<id>.proxy` überschreiben.
- `channels.matrix.allowPrivateNetwork` erlaubt private/interne Homeserver. `proxy` und `allowPrivateNetwork` sind unabhängige Steuerungen.
- `channels.matrix.defaultAccount` wählt das bevorzugte Konto in Multi-Account-Setups aus.
- `channels.matrix.execApprovals`: Matrix-native Zustellung von Exec-Genehmigungen und Autorisierung von Genehmigern.
  - `enabled`: `true`, `false` oder `"auto"` (Standard). Im Auto-Modus werden Exec-Genehmigungen aktiviert, wenn Genehmiger aus `approvers` oder `commands.ownerAllowFrom` aufgelöst werden können.
  - `approvers`: Matrix-Benutzer-IDs (z. B. `@owner:example.org`), die Exec-Anfragen genehmigen dürfen.
  - `agentFilter`: optionale Allowlist für Agent-IDs. Weglassen, um Genehmigungen für alle Agenten weiterzuleiten.
  - `sessionFilter`: optionale Sitzungsschlüssel-Muster (Substring oder Regex).
  - `target`: wohin Genehmigungsaufforderungen gesendet werden. `"dm"` (Standard), `"channel"` (Ursprungsraum) oder `"both"`.
  - Overrides pro Konto: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` steuert, wie Matrix-DMs zu Sitzungen gruppiert werden: `per-user` (Standard) teilt nach geroutetem Peer, während `per-room` jeden DM-Raum isoliert.
- Matrix-Statusprüfungen und Live-Verzeichnisabfragen verwenden dieselbe Proxy-Richtlinie wie der Laufzeit-Traffic.
- Die vollständige Matrix-Konfiguration, Zielregeln und Setup-Beispiele sind unter [Matrix](/de/channels/matrix) dokumentiert.

### Microsoft Teams

Microsoft Teams ist erweiterungsgestützt und wird unter `channels.msteams` konfiguriert.

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

- Hier abgedeckte Kernschlüsselpfade: `channels.msteams`, `channels.msteams.configWrites`.
- Die vollständige Teams-Konfiguration (Anmeldedaten, Webhook, DM-/Gruppenrichtlinie, Overrides pro Team/Kanal) ist unter [Microsoft Teams](/de/channels/msteams) dokumentiert.

### IRC

IRC ist erweiterungsgestützt und wird unter `channels.irc` konfiguriert.

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

- Hier abgedeckte Kernschlüsselpfade: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`.
- Optional überschreibt `channels.irc.defaultAccount` die Standardkontenauswahl, wenn es einer konfigurierten Konto-ID entspricht.
- Die vollständige IRC-Kanalkonfiguration (Host/Port/TLS/Kanäle/Allowlists/Mention-Gating) ist unter [IRC](/de/channels/irc) dokumentiert.

### Multi-Account (alle Kanäle)

Führen Sie mehrere Konten pro Kanal aus (jedes mit eigener `accountId`):

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
- Umgebungs-Token gelten nur für das **default**-Konto.
- Basis-Kanaleinstellungen gelten für alle Konten, sofern sie nicht pro Konto überschrieben werden.
- Verwenden Sie `bindings[].match.accountId`, um jedes Konto an einen anderen Agenten zu routen.
- Wenn Sie über `openclaw channels add` (oder Kanal-Onboarding) ein Nicht-Standardkonto hinzufügen, während Sie noch eine Top-Level-Einzelkonto-Kanalkonfiguration haben, überführt OpenClaw zunächst kontoabhängige Top-Level-Einzelkontowerte in die Kanalkonten-Zuordnung, damit das ursprüngliche Konto weiter funktioniert. Die meisten Kanäle verschieben sie nach `channels.<channel>.accounts.default`; Matrix kann stattdessen ein vorhandenes passendes benanntes/default-Ziel beibehalten.
- Vorhandene kanalbezogene Bindings (ohne `accountId`) passen weiterhin zum Standardkonto; kontobezogene Bindings bleiben optional.
- `openclaw doctor --fix` repariert auch gemischte Shapes, indem kontoabhängige Top-Level-Einzelkontowerte in das für diesen Kanal beförderte Konto verschoben werden. Die meisten Kanäle verwenden `accounts.default`; Matrix kann stattdessen ein vorhandenes passendes benanntes/default-Ziel beibehalten.

### Andere Erweiterungskanäle

Viele Erweiterungskanäle werden als `channels.<id>` konfiguriert und auf ihren jeweiligen Kanal-Seiten dokumentiert (zum Beispiel Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat und Twitch).
Siehe den vollständigen Kanalindex: [Kanäle](/de/channels).

### Mention-Gating in Gruppenchats

Gruppennachrichten erfordern standardmäßig **eine Erwähnung** (Metadaten-Erwähnung oder sichere Regex-Muster). Gilt für WhatsApp, Telegram, Discord, Google Chat und iMessage-Gruppenchats.

**Arten von Erwähnungen:**

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

Auflösung: Override pro DM → Anbieterstandard → kein Limit (alles bleibt erhalten).

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

### Befehle (Verarbeitung von Chat-Befehlen)

```json5
{
  commands: {
    native: "auto", // native Befehle registrieren, wenn unterstützt
    text: true, // /commands in Chat-Nachrichten parsen
    bash: false, // ! erlauben (Alias: /bash)
    bashForegroundMs: 2000,
    config: false, // /config erlauben
    debug: false, // /debug erlauben
    restart: false, // /restart + Gateway-Neustart-Tool erlauben
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

<Accordion title="Befehlsdetails">

- Textbefehle müssen **eigenständige** Nachrichten sein, die mit `/` beginnen.
- `native: "auto"` aktiviert native Befehle für Discord/Telegram, lässt Slack deaktiviert.
- Override pro Kanal: `channels.discord.commands.native` (bool oder `"auto"`). `false` löscht zuvor registrierte Befehle.
- `channels.telegram.customCommands` fügt zusätzliche Telegram-Bot-Menüeinträge hinzu.
- `bash: true` aktiviert `! <cmd>` für die Host-Shell. Erfordert `tools.elevated.enabled` und einen Absender in `tools.elevated.allowFrom.<channel>`.
- `config: true` aktiviert `/config` (liest/schreibt `openclaw.json`). Für Gateway-`chat.send`-Clients erfordern persistente Schreibvorgänge mit `/config set|unset` außerdem `operator.admin`; das schreibgeschützte `/config show` bleibt normalen Operator-Clients mit Schreibbereich erhalten.
- `channels.<provider>.configWrites` steuert Konfigurationsmutationen pro Kanal (Standard: true).
- Für Multi-Account-Kanäle steuert `channels.<provider>.accounts.<id>.configWrites` auch Schreibvorgänge, die auf dieses Konto zielen (zum Beispiel `/allowlist --config --account <id>` oder `/config set channels.<provider>.accounts.<id>...`).
- `allowFrom` ist anbieterbezogen. Wenn gesetzt, ist es die **einzige** Autorisierungsquelle (Kanal-Allowlists/Pairing und `useAccessGroups` werden ignoriert).
- `useAccessGroups: false` erlaubt Befehlen, Richtlinien von Zugriffsgruppen zu umgehen, wenn `allowFrom` nicht gesetzt ist.

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

Optionales Repository-Root, das in der Runtime-Zeile des System-Prompts angezeigt wird. Wenn nicht gesetzt, erkennt OpenClaw es automatisch, indem es vom Workspace nach oben läuft.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Optionale Standard-Allowlist für Skills bei Agenten, die `agents.list[].skills` nicht setzen.

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

- Lassen Sie `agents.defaults.skills` weg, um standardmäßig uneingeschränkte Skills zuzulassen.
- Lassen Sie `agents.list[].skills` weg, um die Standards zu erben.
- Setzen Sie `agents.list[].skills: []` für keine Skills.
- Eine nichtleere Liste in `agents.list[].skills` ist die endgültige Menge für diesen Agenten; sie wird nicht mit den Standards zusammengeführt.

### `agents.defaults.skipBootstrap`

Deaktiviert die automatische Erstellung von Workspace-Bootstrap-Dateien (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.bootstrapMaxChars`

Maximale Zeichenzahl pro Workspace-Bootstrap-Datei vor dem Abschneiden. Standard: `20000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

Maximale Gesamtzeichenzahl, die über alle Workspace-Bootstrap-Dateien hinweg injiziert wird. Standard: `150000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 150000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

Steuert den für Agenten sichtbaren Warntext, wenn Bootstrap-Kontext abgeschnitten wird.
Standard: `"once"`.

- `"off"`: niemals Warntext in den System-Prompt injizieren.
- `"once"`: Warnung einmal pro eindeutiger Trunkierungssignatur injizieren (empfohlen).
- `"always"`: bei jedem Lauf mit vorhandener Trunkierung Warnung injizieren.

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### `agents.defaults.imageMaxDimensionPx`

Maximale Pixelgröße der längsten Bildseite in Transkript-/Tool-Bildblöcken vor Anbieteraufrufen.
Standard: `1200`.

Niedrigere Werte reduzieren in der Regel den Verbrauch von Vision-Token und die Größe des Request-Payloads bei screenshotlastigen Läufen.
Höhere Werte erhalten mehr visuelle Details.

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Zeitzone für den Kontext im System-Prompt (nicht für Nachrichtenzeitstempel). Fällt auf die Zeitzone des Hosts zurück.

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
      params: { cacheRetention: "long" }, // globale Standard-Anbieterparameter
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
  - String-Form setzt nur das primäre Modell.
  - Objekt-Form setzt primäres Modell plus geordnete Failover-Modelle.
- `imageModel`: akzeptiert entweder einen String (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Wird vom `image`-Tool-Pfad als Konfiguration des Vision-Modells verwendet.
  - Wird auch als Fallback-Routing verwendet, wenn das ausgewählte/Standardmodell keine Bild-Eingaben akzeptieren kann.
- `imageGenerationModel`: akzeptiert entweder einen String (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Wird von der gemeinsamen Bildgenerierungsfunktion und jeder zukünftigen Tool-/Plugin-Oberfläche verwendet, die Bilder erzeugt.
  - Typische Werte: `google/gemini-3.1-flash-image-preview` für native Gemini-Bildgenerierung, `fal/fal-ai/flux/dev` für fal oder `openai/gpt-image-1` für OpenAI Images.
  - Wenn Sie direkt einen Anbieter/ein Modell auswählen, konfigurieren Sie auch die passende Anbieter-Auth/API key dazu (zum Beispiel `GEMINI_API_KEY` oder `GOOGLE_API_KEY` für `google/*`, `OPENAI_API_KEY` für `openai/*`, `FAL_KEY` für `fal/*`).
  - Wenn weggelassen, kann `image_generate` dennoch einen auth-gestützten Standardanbieter ableiten. Es versucht zuerst den aktuellen Standardanbieter und dann die übrigen registrierten Bildgenerierungsanbieter in Anbieter-ID-Reihenfolge.
- `musicGenerationModel`: akzeptiert entweder einen String (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Wird von der gemeinsamen Musikgenerierungsfunktion und dem eingebauten Tool `music_generate` verwendet.
  - Typische Werte: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` oder `minimax/music-2.5+`.
  - Wenn weggelassen, kann `music_generate` dennoch einen auth-gestützten Standardanbieter ableiten. Es versucht zuerst den aktuellen Standardanbieter und dann die übrigen registrierten Musikgenerierungsanbieter in Anbieter-ID-Reihenfolge.
  - Wenn Sie direkt einen Anbieter/ein Modell auswählen, konfigurieren Sie auch die passende Anbieter-Auth/API key dazu.
- `videoGenerationModel`: akzeptiert entweder einen String (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Wird von der gemeinsamen Videogenerierungsfunktion und dem eingebauten Tool `video_generate` verwendet.
  - Typische Werte: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` oder `qwen/wan2.7-r2v`.
  - Wenn weggelassen, kann `video_generate` dennoch einen auth-gestützten Standardanbieter ableiten. Es versucht zuerst den aktuellen Standardanbieter und dann die übrigen registrierten Videogenerierungsanbieter in Anbieter-ID-Reihenfolge.
  - Wenn Sie direkt einen Anbieter/ein Modell auswählen, konfigurieren Sie auch die passende Anbieter-Auth/API key dazu.
  - Der gebündelte Qwen-Anbieter für Videogenerierung unterstützt derzeit bis zu 1 Ausgabevideo, 1 Eingabebild, 4 Eingabevideos, 10 Sekunden Dauer sowie die anbieterbezogenen Optionen `size`, `aspectRatio`, `resolution`, `audio` und `watermark`.
- `pdfModel`: akzeptiert entweder einen String (`"provider/model"`) oder ein Objekt (`{ primary, fallbacks }`).
  - Wird vom Tool `pdf` für das Modell-Routing verwendet.
  - Wenn weggelassen, fällt das PDF-Tool auf `imageModel` und dann auf das aufgelöste Sitzungs-/Standardmodell zurück.
- `pdfMaxBytesMb`: Standardgrößenlimit für PDFs im `pdf`-Tool, wenn `maxBytesMb` beim Aufruf nicht übergeben wird.
- `pdfMaxPages`: Standardmaximum an Seiten, die im Fallback-Extraktionsmodus des `pdf`-Tools berücksichtigt werden.
- `verboseDefault`: Standard-Verbose-Stufe für Agenten. Werte: `"off"`, `"on"`, `"full"`. Standard: `"off"`.
- `elevatedDefault`: Standardstufe für Elevated-Output für Agenten. Werte: `"off"`, `"on"`, `"ask"`, `"full"`. Standard: `"on"`.
- `model.primary`: Format `provider/model` (z. B. `openai/gpt-5.4`). Wenn Sie den Anbieter weglassen, versucht OpenClaw zuerst einen Alias, dann einen eindeutigen konfigurierten Anbieterabgleich für genau diese Modell-ID und fällt erst dann auf den konfigurierten Standardanbieter zurück (veraltetes Kompatibilitätsverhalten, daher `provider/model` bevorzugen). Wenn dieser Anbieter das konfigurierte Standardmodell nicht mehr anbietet, fällt OpenClaw auf das erste konfigurierte Anbieter-/Modellpaar zurück, statt einen veralteten, entfernten Standardanbieter anzuzeigen.
- `models`: der konfigurierte Modellkatalog und die Allowlist für `/model`. Jeder Eintrag kann `alias` (Kurzform) und `params` (anbieterspezifisch, z. B. `temperature`, `maxTokens`, `cacheRetention`, `context1m`) enthalten.
- `params`: globale Standard-Anbieterparameter, die auf alle Modelle angewendet werden. Setzen Sie sie unter `agents.defaults.params` (z. B. `{ cacheRetention: "long" }`).
- Merge-Priorität für `params` (Konfiguration): `agents.defaults.params` (globale Basis) wird durch `agents.defaults.models["provider/model"].params` (pro Modell) überschrieben, danach überschreibt `agents.list[].params` (passende Agent-ID) nach Schlüssel. Details siehe [Prompt Caching](/de/reference/prompt-caching).
- Konfigurationsschreiber, die diese Felder verändern (zum Beispiel `/models set`, `/models set-image` und Befehle zum Hinzufügen/Entfernen von Fallbacks), speichern die kanonische Objektform und erhalten nach Möglichkeit vorhandene Fallback-Listen.
- `maxConcurrent`: maximale Zahl paralleler Agent-Läufe über Sitzungen hinweg (jede Sitzung bleibt weiterhin serialisiert). Standard: 4.

**Eingebaute Alias-Kurzformen** (gelten nur, wenn das Modell in `agents.defaults.models` steht):

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

Z.AI-GLM-4.x-Modelle aktivieren den Thinking-Modus automatisch, es sei denn, Sie setzen `--thinking off` oder definieren `agents.defaults.models["zai/<model>"].params.thinking` selbst.
Z.AI-Modelle aktivieren `tool_stream` standardmäßig für Tool-Call-Streaming. Setzen Sie `agents.defaults.models["zai/<model>"].params.tool_stream` auf `false`, um dies zu deaktivieren.
Anthropic-Claude-4.6-Modelle verwenden standardmäßig `adaptive` thinking, wenn keine explizite Thinking-Stufe gesetzt ist.

- Sitzungen werden unterstützt, wenn `sessionArg` gesetzt ist.
- Bild-Pass-through wird unterstützt, wenn `imageArg` Dateipfade akzeptiert.

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
        lightContext: false, // Standard: false; true behält nur HEARTBEAT.md aus den Workspace-Bootstrap-Dateien
        isolatedSession: false, // Standard: false; true führt jeden Heartbeat in einer frischen Sitzung aus (kein Konversationsverlauf)
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (Standard) | block
        target: "none", // Standard: none | Optionen: last | whatsapp | telegram | discord | ...
        prompt: "Lesen Sie HEARTBEAT.md, falls vorhanden...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
      },
    },
  },
}
```

- `every`: Dauer-String (ms/s/m/h). Standard: `30m` (API-key-Auth) oder `1h` (OAuth-Auth). Setzen Sie `0m`, um zu deaktivieren.
- `suppressToolErrorWarnings`: unterdrückt bei `true` Tool-Fehlerwarn-Payloads während Heartbeat-Läufen.
- `directPolicy`: Zustellrichtlinie für Direkt-/DM-Ziele. `allow` (Standard) erlaubt Direktziel-Zustellung. `block` unterdrückt Direktziel-Zustellung und gibt `reason=dm-blocked` aus.
- `lightContext`: wenn `true`, verwenden Heartbeat-Läufe leichtgewichtigen Bootstrap-Kontext und behalten aus den Workspace-Bootstrap-Dateien nur `HEARTBEAT.md`.
- `isolatedSession`: wenn `true`, wird jeder Heartbeat-Lauf in einer frischen Sitzung ohne vorherigen Konversationsverlauf ausgeführt. Gleiches Isolationsmuster wie bei Cron `sessionTarget: "isolated"`. Reduziert die Tokenkosten pro Heartbeat von ~100K auf ~2–5K Token.
- Pro Agent: setzen Sie `agents.list[].heartbeat`. Wenn irgendein Agent `heartbeat` definiert, führen **nur diese Agenten** Heartbeats aus.
- Heartbeats führen vollständige Agent-Turns aus — kürzere Intervalle verbrauchen mehr Token.

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Erhalten Sie Deployment-IDs, Ticket-IDs und Host:Port-Paare exakt.", // verwendet bei identifierPolicy=custom
        postCompactionSections: ["Session Startup", "Red Lines"], // [] deaktiviert Re-Injektion
        model: "openrouter/anthropic/claude-sonnet-4-6", // optionaler Override nur für Kompaktierungsmodell
        notifyUser: true, // kurze Nachricht senden, wenn Kompaktierung startet (Standard: false)
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "Sitzung nähert sich der Kompaktierung. Dauerhafte Erinnerungen jetzt speichern.",
          prompt: "Schreiben Sie alle bleibenden Notizen nach memory/YYYY-MM-DD.md; antworten Sie mit dem exakten stillen Token NO_REPLY, wenn nichts zu speichern ist.",
        },
      },
    },
  },
}
```

- `mode`: `default` oder `safeguard` (chunked summarization für lange Verläufe). Siehe [Kompaktierung](/de/concepts/compaction).
- `timeoutSeconds`: maximale Anzahl Sekunden, die OpenClaw für eine einzelne Kompaktierungsoperation zulässt, bevor sie abgebrochen wird. Standard: `900`.
- `identifierPolicy`: `strict` (Standard), `off` oder `custom`. `strict` stellt der Kompaktierungszusammenfassung eingebaute Leitlinien zum Erhalt undurchsichtiger Kennungen voran.
- `identifierInstructions`: optionaler benutzerdefinierter Text zur Kennungserhaltung, der verwendet wird, wenn `identifierPolicy=custom`.
- `postCompactionSections`: optionale H2/H3-Abschnittsnamen aus AGENTS.md, die nach der Kompaktierung erneut injiziert werden. Standard ist `["Session Startup", "Red Lines"]`; setzen Sie `[]`, um die Re-Injektion zu deaktivieren. Wenn nicht gesetzt oder explizit auf dieses Standardpaar gesetzt, werden ältere Überschriften `Every Session`/`Safety` auch als Legacy-Fallback akzeptiert.
- `model`: optionaler Override `provider/model-id` nur für die Kompaktierungszusammenfassung. Verwenden Sie dies, wenn die Hauptsitzung ein Modell beibehalten soll, Kompaktierungszusammenfassungen aber mit einem anderen Modell laufen sollen; wenn nicht gesetzt, verwendet die Kompaktierung das primäre Modell der Sitzung.
- `notifyUser`: wenn `true`, sendet beim Start der Kompaktierung eine kurze Mitteilung an den Benutzer (zum Beispiel „Kontext wird kompaktifiziert...“). Standardmäßig deaktiviert, damit die Kompaktierung still bleibt.
- `memoryFlush`: stiller agentischer Turn vor Auto-Kompaktierung, um dauerhafte Erinnerungen zu speichern. Wird übersprungen, wenn der Workspace schreibgeschützt ist.

### `agents.defaults.contextPruning`

Prunt **alte Tool-Ergebnisse** aus dem In-Memory-Kontext, bevor an das LLM gesendet wird. Ändert den Sitzungsverlauf auf der Festplatte **nicht**.

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
        hardClear: { enabled: true, placeholder: "[Inhalt altes Tool-Ergebnis gelöscht]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="Verhalten im Modus cache-ttl">

- `mode: "cache-ttl"` aktiviert Pruning-Durchläufe.
- `ttl` steuert, wie oft Pruning erneut laufen darf (nach dem letzten Cache-Touch).
- Pruning kürzt zunächst übergroße Tool-Ergebnisse weich und löscht bei Bedarf danach ältere Tool-Ergebnisse hart.

**Soft-trim** behält Anfang + Ende und fügt in der Mitte `...` ein.

**Hard-clear** ersetzt das gesamte Tool-Ergebnis durch den Platzhalter.

Hinweise:

- Bildblöcke werden niemals gekürzt/gelöscht.
- Verhältnisse basieren auf Zeichen (ungefähr), nicht auf exakten Token-Zahlen.
- Wenn weniger als `keepLastAssistants` Assistentennachrichten vorhanden sind, wird Pruning übersprungen.

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
      humanDelay: { mode: "natural" }, // off | natural | custom (mit minMs/maxMs)
    },
  },
}
```

- Nicht-Telegram-Kanäle erfordern explizit `*.blockStreaming: true`, um Blockantworten zu aktivieren.
- Kanal-Overrides: `channels.<channel>.blockStreamingCoalesce` (und Varianten pro Konto). Signal/Slack/Discord/Google Chat verwenden standardmäßig `minChars: 1500`.
- `humanDelay`: zufällige Pause zwischen Blockantworten. `natural` = 800–2500 ms. Override pro Agent: `agents.list[].humanDelay`.

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

- Standards: `instant` für Direktchats/Erwähnungen, `message` für Gruppenchats ohne Erwähnung.
- Overrides pro Sitzung: `session.typingMode`, `session.typingIntervalSeconds`.

Siehe [Typing Indicators](/de/concepts/typing-indicators).

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Optionale Sandboxing-Funktion für den eingebetteten Agenten. Den vollständigen Leitfaden finden Sie unter [Sandboxing](/de/gateway/sandboxing).

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

- `docker`: lokales Docker-Runtime (Standard)
- `ssh`: generisches SSH-gestütztes Remote-Runtime
- `openshell`: OpenShell-Runtime

Wenn `backend: "openshell"` ausgewählt ist, werden laufzeitspezifische Einstellungen nach
`plugins.entries.openshell.config` verschoben.

**SSH-Backend-Konfiguration:**

- `target`: SSH-Ziel in der Form `user@host[:port]`
- `command`: SSH-Client-Befehl (Standard: `ssh`)
- `workspaceRoot`: absolutes Remote-Root, das für Workspaces pro Scope verwendet wird
- `identityFile` / `certificateFile` / `knownHostsFile`: vorhandene lokale Dateien, die an OpenSSH übergeben werden
- `identityData` / `certificateData` / `knownHostsData`: Inline-Inhalte oder SecretRefs, die OpenClaw zur Laufzeit in temporäre Dateien materialisiert
- `strictHostKeyChecking` / `updateHostKeys`: OpenSSH-Regler für die Host-Key-Richtlinie

**SSH-Auth-Priorität:**

- `identityData` hat Vorrang vor `identityFile`
- `certificateData` hat Vorrang vor `certificateFile`
- `knownHostsData` hat Vorrang vor `knownHostsFile`
- SecretRef-gestützte `*Data`-Werte werden aus dem aktiven Geheimnis-Laufzeit-Snapshot aufgelöst, bevor die Sandbox-Sitzung startet

**Verhalten des SSH-Backends:**

- initialisiert den Remote-Workspace einmal nach Erstellung oder Neuerstellung
- hält danach den Remote-SSH-Workspace als kanonisch
- routet `exec`, Dateitools und Medienpfade über SSH
- synchronisiert Remote-Änderungen nicht automatisch zurück auf den Host
- unterstützt keine Browser-Container in der Sandbox

**Workspace-Zugriff:**

- `none`: Sandbox-Workspace pro Scope unter `~/.openclaw/sandboxes`
- `ro`: Sandbox-Workspace unter `/workspace`, Agent-Workspace schreibgeschützt unter `/agent` eingehängt
- `rw`: Agent-Workspace lesend/schreibend unter `/workspace` eingehängt

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

- `mirror`: vor `exec` Remote von lokal initialisieren, nach `exec` zurücksynchronisieren; lokaler Workspace bleibt kanonisch
- `remote`: Remote einmal initialisieren, wenn die Sandbox erstellt wird, dann den Remote-Workspace als kanonisch beibehalten

Im Modus `remote` werden hostlokale Änderungen, die außerhalb von OpenClaw vorgenommen werden, nach dem Initialisierungsschritt nicht automatisch in die Sandbox synchronisiert.
Der Transport erfolgt per SSH in die OpenShell-Sandbox, aber das Plugin besitzt den Sandbox-Lifecycle und die optionale Spiegel-Synchronisation.

**`setupCommand`** läuft einmal nach Erstellung des Containers (via `sh -lc`). Benötigt Netzwerk-Egress, beschreibbares Root und Root-Benutzer.

**Container verwenden standardmäßig `network: "none"`** — setzen Sie auf `"bridge"` (oder ein benutzerdefiniertes Bridge-Netzwerk), wenn der Agent ausgehenden Zugriff benötigt.
`"host"` ist blockiert. `"container:<id>"` ist standardmäßig blockiert, es sei denn, Sie setzen explizit
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (Break-Glass).

**Eingehende Anhänge** werden im aktiven Workspace nach `media/inbound/*` bereitgestellt.

**`docker.binds`** mountet zusätzliche Host-Verzeichnisse; globale und agentenspezifische Binds werden zusammengeführt.

**Sandbox-Browser** (`sandbox.browser.enabled`): Chromium + CDP in einem Container. noVNC-URL wird in den System-Prompt injiziert. Erfordert kein `browser.enabled` in `openclaw.json`.
Der Beobachterzugriff über noVNC verwendet standardmäßig VNC-Authentifizierung, und OpenClaw gibt eine kurzlebige Token-URL aus (anstatt das Passwort in der gemeinsamen URL offenzulegen).

- `allowHostControl: false` (Standard) verhindert, dass auf den Host-Browser aus Sandbox-Sitzungen gezielt zugegriffen wird.
- `network` verwendet standardmäßig `openclaw-sandbox-browser` (dediziertes Bridge-Netzwerk). Setzen Sie nur dann `bridge`, wenn Sie ausdrücklich globale Bridge-Konnektivität wünschen.
- `cdpSourceRange` kann optional CDP-Eingang am Container-Rand auf einen CIDR-Bereich beschränken (zum Beispiel `172.21.0.1/32`).
- `sandbox.browser.binds` mountet zusätzliche Host-Verzeichnisse nur in den Sandbox-Browser-Container. Wenn gesetzt (einschließlich `[]`), ersetzt es `docker.binds` für den Browser-Container.
- Start-Standards sind in `scripts/sandbox-browser-entrypoint.sh` definiert und für Container-Hosts optimiert:
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
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` aktiviert Erweiterungen wieder, wenn Ihr Workflow davon abhängt.
  - `--renderer-process-limit=2` kann mit
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` geändert werden; setzen Sie `0`, um das
    Standard-Prozesslimit von Chromium zu verwenden.
  - plus `--no-sandbox` und `--disable-setuid-sandbox`, wenn `noSandbox` aktiviert ist.
  - Die Standards sind die Basis des Container-Images; verwenden Sie ein benutzerdefiniertes Browser-Image mit benutzerdefiniertem
    Entry-Point, um die Container-Standards zu ändern.

</Accordion>

Browser-Sandboxing und `sandbox.docker.binds` sind derzeit nur für Docker verfügbar.

Images bauen:

```bash
scripts/sandbox-setup.sh           # Haupt-Sandbox-Image
scripts/sandbox-browser-setup.sh   # optionales Browser-Image
```

### `agents.list` (Overrides pro Agent)

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
        thinkingDefault: "high", // Override pro Agent für Thinking-Stufe
        reasoningDefault: "on", // Override pro Agent für Sichtbarkeit von Reasoning
        fastModeDefault: false, // Override pro Agent für Schnellmodus
        params: { cacheRetention: "none" }, // überschreibt passende defaults.models-Parameter nach Schlüssel
        skills: ["docs-search"], // ersetzt agents.defaults.skills, wenn gesetzt
        identity: {
          name: "Samantha",
          theme: "hilfreiches Faultier",
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
- `default`: wenn mehrere gesetzt sind, gewinnt der erste (Warnung wird protokolliert). Wenn keines gesetzt ist, ist der erste Listeneintrag der Standard.
- `model`: String-Form überschreibt nur `primary`; Objekt-Form `{ primary, fallbacks }` überschreibt beides (`[]` deaktiviert globale Fallbacks). Cron-Jobs, die nur `primary` überschreiben, erben weiterhin Standard-Fallbacks, sofern Sie nicht `fallbacks: []` setzen.
- `params`: Stream-Parameter pro Agent, die über den ausgewählten Modelleintrag in `agents.defaults.models` gemergt werden. Verwenden Sie dies für agentenspezifische Overrides wie `cacheRetention`, `temperature` oder `maxTokens`, ohne den gesamten Modellkatalog zu duplizieren.
- `skills`: optionale Skill-Allowlist pro Agent. Wenn weggelassen, erbt der Agent `agents.defaults.skills`, sofern gesetzt; eine explizite Liste ersetzt Standards statt zu mergen, und `[]` bedeutet keine Skills.
- `thinkingDefault`: optionale Standard-Thinking-Stufe pro Agent (`off | minimal | low | medium | high | xhigh | adaptive`). Überschreibt `agents.defaults.thinkingDefault` für diesen Agenten, wenn kein Override pro Nachricht oder Sitzung gesetzt ist.
- `reasoningDefault`: optionale Standardsichtbarkeit von Reasoning pro Agent (`on | off | stream`). Gilt, wenn kein Reasoning-Override pro Nachricht oder Sitzung gesetzt ist.
- `fastModeDefault`: optionaler Standard pro Agent für den Schnellmodus (`true | false`). Gilt, wenn kein Schnellmodus-Override pro Nachricht oder Sitzung gesetzt ist.
- `runtime`: optionaler Runtime-Deskriptor pro Agent. Verwenden Sie `type: "acp"` mit Standardwerten in `runtime.acp` (`agent`, `backend`, `mode`, `cwd`), wenn der Agent standardmäßig ACP-Harness-Sitzungen verwenden soll.
- `identity.avatar`: workspace-relativer Pfad, `http(s)`-URL oder `data:`-URI.
- `identity` leitet Standards ab: `ackReaction` aus `emoji`, `mentionPatterns` aus `name`/`emoji`.
- `subagents.allowAgents`: Allowlist von Agent-IDs für `sessions_spawn` (`["*"]` = beliebig; Standard: nur derselbe Agent).
- Sandbox-Vererbungs-Grenze: Wenn die anfordernde Sitzung in einer Sandbox läuft, lehnt `sessions_spawn` Ziele ab, die unsandboxed laufen würden.
- `subagents.requireAgentId`: wenn true, blockiert `sessions_spawn` Aufrufe ohne `agentId` (erzwingt explizite Profilauswahl; Standard: false).

---

## Multi-Agent-Routing

Führen Sie mehrere isolierte Agenten innerhalb eines Gateways aus. Siehe [Multi-Agent](/de/concepts/multi-agent).

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

### Übereinstimmungsfelder für Bindings

- `type` (optional): `route` für normales Routing (fehlender Typ entspricht route), `acp` für persistente ACP-Unterhaltungs-Bindings.
- `match.channel` (erforderlich)
- `match.accountId` (optional; `*` = beliebiges Konto; weggelassen = Standardkonto)
- `match.peer` (optional; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (optional; kanalspezifisch)
- `acp` (optional; nur für `type: "acp"`): `{ mode, label, cwd, backend }`

**Deterministische Reihenfolge der Übereinstimmung:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (exakt, ohne Peer/Guild/Team)
5. `match.accountId: "*"` (kanalweit)
6. Standard-Agent

Innerhalb jeder Stufe gewinnt der erste passende `bindings`-Eintrag.

Für Einträge mit `type: "acp"` löst OpenClaw über die exakte Unterhaltungsidentität auf (`match.channel` + Konto + `match.peer.id`) und verwendet die obige Stufenreihenfolge für Route-Bindings nicht.

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
      highWaterBytes: "400mb", // optionales Bereinigungsziel
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // Standard für automatisches Unfocus bei Inaktivität in Stunden (`0` deaktiviert)
      maxAgeHours: 0, // Standard für harte Maximaldauer in Stunden (`0` deaktiviert)
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
  - `global`: Alle Teilnehmer in einem Kanalkontext teilen sich eine einzige Sitzung (nur verwenden, wenn gemeinsam genutzter Kontext beabsichtigt ist).
- **`dmScope`**: wie DMs gruppiert werden.
  - `main`: Alle DMs teilen sich die Hauptsitzung.
  - `per-peer`: nach Absender-ID über Kanäle hinweg isolieren.
  - `per-channel-peer`: pro Kanal + Absender isolieren (empfohlen für Multi-User-Inboxes).
  - `per-account-channel-peer`: pro Konto + Kanal + Absender isolieren (empfohlen für Multi-Account).
- **`identityLinks`**: ordnet kanonische IDs anbieterpräfixierten Peers zu, um sitzungsübergreifendes Teilen über Kanäle hinweg zu ermöglichen.
- **`reset`**: primäre Reset-Richtlinie. `daily` setzt um `atHour` lokaler Zeit zurück; `idle` setzt nach `idleMinutes` zurück. Wenn beides konfiguriert ist, gewinnt das zuerst ablaufende.
- **`resetByType`**: Overrides pro Typ (`direct`, `group`, `thread`). Legacy-`dm` wird als Alias für `direct` akzeptiert.
- **`parentForkMaxTokens`**: maximal zulässige `totalTokens` der Parent-Sitzung beim Erstellen einer geforkten Thread-Sitzung (Standard `100000`).
  - Wenn `totalTokens` des Parents über diesem Wert liegt, startet OpenClaw eine frische Thread-Sitzung, statt den Verlauf des Parent-Transkripts zu erben.
  - Setzen Sie `0`, um diese Grenze zu deaktivieren und Parent-Forking immer zuzulassen.
- **`mainKey`**: Legacy-Feld. Die Laufzeit verwendet jetzt immer `"main"` für den Haupt-Bucket für Direktchats.
- **`agentToAgent.maxPingPongTurns`**: maximale Anzahl von Antwort-Zurück-Turns zwischen Agenten bei Agent-zu-Agent-Austausch (Ganzzahl, Bereich: `0`–`5`). `0` deaktiviert Ping-Pong-Ketten.
- **`sendPolicy`**: Abgleich nach `channel`, `chatType` (`direct|group|channel`, mit Legacy-Alias `dm`), `keyPrefix` oder `rawKeyPrefix`. Erstes `deny` gewinnt.
- **`maintenance`**: Aufräum- + Retentionskontrollen für den Sitzungsspeicher.
  - `mode`: `warn` gibt nur Warnungen aus; `enforce` wendet Bereinigung an.
  - `pruneAfter`: Altersgrenze für veraltete Einträge (Standard `30d`).
  - `maxEntries`: maximale Anzahl Einträge in `sessions.json` (Standard `500`).
  - `rotateBytes`: rotiert `sessions.json`, wenn diese Größe überschritten wird (Standard `10mb`).
  - `resetArchiveRetention`: Retention für `*.reset.<timestamp>`-Transkriptarchive. Standardmäßig wie `pruneAfter`; setzen Sie `false`, um zu deaktivieren.
  - `maxDiskBytes`: optionales Speicherbudget für das Sitzungsverzeichnis. Im Modus `warn` werden Warnungen protokolliert; im Modus `enforce` werden zuerst die ältesten Artefakte/Sitzungen entfernt.
  - `highWaterBytes`: optionales Ziel nach Budget-Bereinigung. Standardmäßig `80%` von `maxDiskBytes`.
- **`threadBindings`**: globale Standardwerte für threadgebundene Sitzungsfunktionen.
  - `enabled`: globaler Standardschalter (Anbieter können überschreiben; Discord verwendet `channels.discord.threadBindings.enabled`)
  - `idleHours`: Standard für automatisches Unfocus bei Inaktivität in Stunden (`0` deaktiviert; Anbieter können überschreiben)
  - `maxAgeHours`: Standard für harte Maximaldauer in Stunden (`0` deaktiviert; Anbieter können überschreiben)

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

Overrides pro Kanal/Konto: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

Auflösung (das spezifischste gewinnt): Konto → Kanal → global. `""` deaktiviert und stoppt die Kaskade. `"auto"` leitet `[{identity.name}]` ab.

**Template-Variablen:**

| Variable          | Beschreibung         | Beispiel                    |
| ----------------- | -------------------- | --------------------------- |
| `{model}`         | Kurzer Modellname    | `claude-opus-4-6`           |
| `{modelFull}`     | Vollständige Modellkennung | `anthropic/claude-opus-4-6` |
| `{provider}`      | Anbietername         | `anthropic`                 |
| `{thinkingLevel}` | Aktuelle Thinking-Stufe | `high`, `low`, `off`      |
| `{identity.name}` | Name der Agent-Identität | (wie `"auto"`)          |

Variablen sind ohne Beachtung der Groß-/Kleinschreibung. `{think}` ist ein Alias für `{thinkingLevel}`.

### Bestätigungsreaktion

- Standardmäßig das `identity.emoji` des aktiven Agenten, ansonsten `"👀"`. Setzen Sie `""`, um zu deaktivieren.
- Overrides pro Kanal: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- Auflösungsreihenfolge: Konto → Kanal → `messages.ackReaction` → Identity-Fallback.
- Scope: `group-mentions` (Standard), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: entfernt die Bestätigungsreaktion nach der Antwort auf Slack, Discord und Telegram.
- `messages.statusReactions.enabled`: aktiviert Lifecycle-Statusreaktionen auf Slack, Discord und Telegram.
  Bei Slack und Discord bleiben Statusreaktionen aktiviert, wenn Bestätigungsreaktionen aktiv sind und dieser Wert nicht gesetzt ist.
  Bei Telegram setzen Sie ihn explizit auf `true`, um Lifecycle-Statusreaktionen zu aktivieren.

### Inbound-Debounce

Bündelt schnelle reine Textnachrichten desselben Absenders zu einem einzigen Agent-Turn. Medien/Anhänge flushen sofort. Steuerbefehle umgehen Debouncing.

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

- `auto` steuert Auto-TTS. `/tts off|always|inbound|tagged` überschreibt dies pro Sitzung.
- `summaryModel` überschreibt `agents.defaults.model.primary` für die automatische Zusammenfassung.
- `modelOverrides` ist standardmäßig aktiviert; `modelOverrides.allowProvider` ist standardmäßig `false` (Opt-in).
- API keys fallen auf `ELEVENLABS_API_KEY`/`XI_API_KEY` und `OPENAI_API_KEY` zurück.
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

- `talk.provider` muss einem Schlüssel in `talk.providers` entsprechen, wenn mehrere Talk-Anbieter konfiguriert sind.
- Legacy-flache Talk-Schlüssel (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) sind nur noch kompatibilitätsbedingt vorhanden und werden automatisch nach `talk.providers.<provider>` migriert.
- Voice-IDs fallen auf `ELEVENLABS_VOICE_ID` oder `SAG_VOICE_ID` zurück.
- `providers.*.apiKey` akzeptiert Klartext-Strings oder SecretRef-Objekte.
- Der Fallback `ELEVENLABS_API_KEY` gilt nur, wenn kein Talk-API key konfiguriert ist.
- `providers.*.voiceAliases` erlaubt Talk-Direktiven, freundliche Namen zu verwenden.
- `silenceTimeoutMs` steuert, wie lange der Talk-Modus nach Stille des Benutzers wartet, bevor das Transkript gesendet wird. Wenn nicht gesetzt, bleibt das plattformspezifische Standard-Pausenfenster erhalten (`700 ms auf macOS und Android, 900 ms auf iOS`).

---

## Tools

### Tool-Profile

`tools.profile` setzt eine Basis-Allowlist vor `tools.allow`/`tools.deny`:

Lokales Onboarding setzt neue lokale Konfigurationen standardmäßig auf `tools.profile: "coding"`, wenn nicht gesetzt (vorhandene explizite Profile bleiben erhalten).

| Profil      | Umfasst                                                                                                                       |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | nur `session_status`                                                                                                          |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                    |
| `full`      | Keine Einschränkung (wie nicht gesetzt)                                                                                       |

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
| `group:openclaw`   | Alle eingebauten Tools (ohne Anbieter-Plugins)                                                                         |

### `tools.allow` / `tools.deny`

Globale Allow-/Deny-Richtlinie für Tools (deny gewinnt). Ohne Beachtung der Groß-/Kleinschreibung, unterstützt `*`-Wildcards. Wird auch angewendet, wenn die Docker-Sandbox deaktiviert ist.

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

Schränkt Tools für bestimmte Anbieter oder Modelle weiter ein. Reihenfolge: Basisprofil → Anbieterprofil → allow/deny.

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

Steuert erhöhten Exec-Zugriff außerhalb der Sandbox:

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

- Override pro Agent (`agents.list[].tools.elevated`) kann nur weiter einschränken.
- `/elevated on|off|ask|full` speichert Zustand pro Sitzung; Inline-Direktiven gelten nur für eine einzelne Nachricht.
- Erhöhtes `exec` umgeht Sandboxing und verwendet den konfigurierten Escape-Pfad (`gateway` standardmäßig oder `node`, wenn das Exec-Ziel `node` ist).

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

Sicherheitsprüfungen für Tool-Loops sind standardmäßig **deaktiviert**. Setzen Sie `enabled: true`, um die Erkennung zu aktivieren.
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

- `historySize`: maximale Tool-Call-Historie, die für die Loop-Analyse aufbewahrt wird.
- `warningThreshold`: Schwelle für Warnungen bei sich wiederholenden Mustern ohne Fortschritt.
- `criticalThreshold`: höhere Wiederholungsschwelle zum Blockieren kritischer Loops.
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
        provider: "firecrawl", // optional; für Auto-Erkennung weglassen
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
        directSend: false, // Opt-in: fertiggestellte asynchrone Musik/Videos direkt in den Kanal senden
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

<Accordion title="Felder von Modelleinträgen für Medien">

**Anbietereintrag** (`type: "provider"` oder weggelassen):

- `provider`: API-Anbieter-ID (`openai`, `anthropic`, `google`/`gemini`, `groq` usw.)
- `model`: Override für Modell-ID
- `profile` / `preferredProfile`: Auswahl des Profils in `auth-profiles.json`

**CLI-Eintrag** (`type: "cli"`):

- `command`: auszuführbare Datei
- `args`: templatisierte Argumente (unterstützt `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` usw.)

**Gemeinsame Felder:**

- `capabilities`: optionale Liste (`image`, `audio`, `video`). Standards: `openai`/`anthropic`/`minimax` → image, `google` → image+audio+video, `groq` → audio.
- `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: Overrides pro Eintrag.
- Bei Fehlern wird auf den nächsten Eintrag zurückgegriffen.

Anbieter-Auth folgt der Standardreihenfolge: `auth-profiles.json` → Umgebungsvariablen → `models.providers.*.apiKey`.

**Felder für asynchronen Abschluss:**

- `asyncCompletion.directSend`: wenn `true`, versuchen fertiggestellte asynchrone `music_generate`-
  und `video_generate`-Aufgaben zuerst die direkte Zustellung in den Kanal. Standard: `false`
  (Legacy-Wake-/Modellzustellpfad über die Sitzung des Anfragenden).

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

Steuert, welche Sitzungen von den Sitzungstools (`sessions_list`, `sessions_history`, `sessions_send`) adressiert werden können.

Standard: `tree` (aktuelle Sitzung + von ihr erzeugte Sitzungen, etwa Subagents).

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
- `tree`: aktuelle Sitzung + von der aktuellen Sitzung erzeugte Sitzungen (Subagents).
- `agent`: jede Sitzung, die zur aktuellen Agent-ID gehört (kann andere Benutzer einschließen, wenn Sie Sitzungen pro Absender unter derselben Agent-ID ausführen).
- `all`: jede Sitzung. Agentübergreifendes Targeting erfordert weiterhin `tools.agentToAgent`.
- Sandbox-Klammer: wenn die aktuelle Sitzung in einer Sandbox läuft und `agents.defaults.sandbox.sessionToolsVisibility="spawned"` ist, wird die Sichtbarkeit auf `tree` erzwungen, selbst wenn `tools.sessions.visibility="all"` gilt.

### `tools.sessions_spawn`

Steuert die Unterstützung für Inline-Anhänge bei `sessions_spawn`.

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // Opt-in: auf true setzen, um Inline-Dateianhänge zu erlauben
        maxTotalBytes: 5242880, // 5 MB gesamt über alle Dateien
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB pro Datei
        retainOnSessionKeep: false, // Anhänge beibehalten, wenn cleanup="keep"
      },
    },
  },
}
```

Hinweise:

- Anhänge werden nur für `runtime: "subagent"` unterstützt. ACP-Runtime lehnt sie ab.
- Dateien werden im Child-Workspace unter `.openclaw/attachments/<uuid>/` mit einer `.manifest.json` materialisiert.
- Anhangsinhalte werden automatisch aus der Transkriptpersistenz redigiert.
- Base64-Eingaben werden mit strenger Alphabet-/Padding-Prüfung und einer Größenkontrolle vor der Dekodierung validiert.
- Dateiberechtigungen sind `0700` für Verzeichnisse und `0600` für Dateien.
- Das Aufräumen folgt der `cleanup`-Richtlinie: `delete` entfernt Anhänge immer; `keep` behält sie nur, wenn `retainOnSessionKeep: true`.

### `tools.experimental`

Experimentelle Flags für eingebaute Tools. Standardmäßig aus, außer wenn eine laufzeitspezifische Auto-Aktivierungsregel greift.

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

- `planTool`: aktiviert das strukturierte Tool `update_plan` zur Nachverfolgung nichttrivialer mehrstufiger Arbeit.
- Standard: `false` für Nicht-OpenAI-Anbieter. OpenAI- und OpenAI-Codex-Läufe aktivieren es automatisch.
- Wenn aktiviert, fügt der System-Prompt auch Nutzungshinweise hinzu, sodass das Modell es nur für substanzielle Arbeit verwendet und höchstens einen Schritt als `in_progress` hält.

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

- `model`: Standardmodell für erzeugte Sub-Agents. Wenn weggelassen, erben Sub-Agents das Modell des Aufrufers.
- `allowAgents`: Standard-Allowlist der Ziel-Agent-IDs für `sessions_spawn`, wenn der anfordernde Agent kein eigenes `subagents.allowAgents` setzt (`["*"]` = beliebig; Standard: nur derselbe Agent).
- `runTimeoutSeconds`: Standard-Timeout (Sekunden) für `sessions_spawn`, wenn der Tool-Aufruf `runTimeoutSeconds` weglässt. `0` bedeutet kein Timeout.
- Tool-Richtlinie pro Subagent: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`.

---

## Benutzerdefinierte Anbieter und Base-URLs

OpenClaw verwendet den eingebauten Modellkatalog. Fügen Sie benutzerdefinierte Anbieter über `models.providers` in der Konfiguration oder `~/.openclaw/agents/<agentId>/agent/models.json` hinzu.

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

- Verwenden Sie `authHeader: true` + `headers` für benutzerdefinierte Auth-Anforderungen.
- Überschreiben Sie das Agent-Konfigurations-Root mit `OPENCLAW_AGENT_DIR` (oder `PI_CODING_AGENT_DIR`, einem Legacy-Alias für Umgebungsvariablen).
- Merge-Priorität bei passenden Anbieter-IDs:
  - Nichtleere `baseUrl`-Werte aus `models.json` des Agenten haben Vorrang.
  - Nichtleere `apiKey`-Werte des Agenten haben nur dann Vorrang, wenn dieser Anbieter im aktuellen Konfigurations-/Auth-Profil-Kontext nicht über SecretRef verwaltet wird.
  - SecretRef-verwaltete Anbieter-`apiKey`-Werte werden aus Quellmarkierungen aktualisiert (`ENV_VAR_NAME` für env-Refs, `secretref-managed` für file-/exec-Refs), statt aufgelöste Geheimnisse zu persistieren.
  - SecretRef-verwaltete Header-Werte des Anbieters werden aus Quellmarkierungen aktualisiert (`secretref-env:ENV_VAR_NAME` für env-Refs, `secretref-managed` für file-/exec-Refs).
  - Leere oder fehlende `apiKey`-/`baseUrl`-Werte des Agenten fallen auf `models.providers` in der Konfiguration zurück.
  - Passende Modell-`contextWindow`-/`maxTokens`-Werte verwenden den höheren Wert aus expliziter Konfiguration und impliziten Katalogwerten.
  - Passende Modell-`contextTokens` bewahren ein explizites Runtime-Limit, wenn vorhanden; verwenden Sie dies, um das effektive Kontextbudget zu begrenzen, ohne native Modellmetadaten zu ändern.
  - Verwenden Sie `models.mode: "replace"`, wenn die Konfiguration `models.json` vollständig neu schreiben soll.
  - Marker-Persistenz ist quellautoritatativ: Marker werden aus dem aktiven Quell-Konfigurations-Snapshot (vor der Auflösung) geschrieben, nicht aus aufgelösten Laufzeit-Geheimniswerten.

### Details zu Anbieterfeldern

- `models.mode`: Verhalten des Anbieterkatalogs (`merge` oder `replace`).
- `models.providers`: benutzerdefinierte Anbieter-Zuordnung nach Anbieter-ID.
- `models.providers.*.api`: Request-Adapter (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai` usw.).
- `models.providers.*.apiKey`: Anbieter-Anmeldedaten (SecretRef/env-Substitution bevorzugen).
- `models.providers.*.auth`: Auth-Strategie (`api-key`, `token`, `oauth`, `aws-sdk`).
- `models.providers.*.injectNumCtxForOpenAICompat`: für Ollama + `openai-completions` `options.num_ctx` in Requests injizieren (Standard: `true`).
- `models.providers.*.authHeader`: erzwingt Credential-Transport im Header `Authorization`, wenn erforderlich.
- `models.providers.*.baseUrl`: Base-URL der Upstream-API.
- `models.providers.*.headers`: zusätzliche statische Header für Proxy-/Tenant-Routing.
- `models.providers.*.request`: Transport-Overrides für HTTP-Requests von Modellanbietern.
  - `request.headers`: zusätzliche Header (mit Anbieter-Standards gemergt). Werte akzeptieren SecretRef.
  - `request.auth`: Override für die Auth-Strategie. Modi: `"provider-default"` (eingebaute Auth des Anbieters verwenden), `"authorization-bearer"` (mit `token`), `"header"` (mit `headerName`, `value`, optional `prefix`).
  - `request.proxy`: Override für HTTP-Proxy. Modi: `"env-proxy"` (verwende `HTTP_PROXY`/`HTTPS_PROXY` env vars), `"explicit-proxy"` (mit `url`). Beide Modi akzeptieren optional ein Unterobjekt `tls`.
  - `request.tls`: TLS-Override für direkte Verbindungen. Felder: `ca`, `cert`, `key`, `passphrase` (alle akzeptieren SecretRef), `serverName`, `insecureSkipVerify`.
- `models.providers.*.models`: explizite Katalogeinträge für Anbietermodelle.
- `models.providers.*.models.*.contextWindow`: native Metadaten des Modell-Kontextfensters.
- `models.providers.*.models.*.contextTokens`: optionales Laufzeitlimit für Kontext. Verwenden Sie dies, wenn Sie ein kleineres effektives Kontextbudget als das native `contextWindow` des Modells möchten.
- `models.providers.*.models.*.compat.supportsDeveloperRole`: optionaler Kompatibilitätshinweis. Für `api: "openai-completions"` mit einer nichtleeren, nichtnativen `baseUrl` (Host nicht `api.openai.com`) erzwingt OpenClaw dies zur Laufzeit auf `false`. Leere/fehlende `baseUrl` behält das Standardverhalten von OpenAI bei.
- `plugins.entries.amazon-bedrock.config.discovery`: Root der Bedrock-Auto-Discovery-Einstellungen.
- `plugins.entries.amazon-bedrock.config.discovery.enabled`: implizite Discovery ein-/ausschalten.
- `plugins.entries.amazon-bedrock.config.discovery.region`: AWS-Region für Discovery.
- `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: optionaler Anbieter-ID-Filter für gezielte Discovery.
- `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: Polling-Intervall für Discovery-Refresh.
- `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: Fallback-Kontextfenster für entdeckte Modelle.
- `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: Fallback-Maximalzahl an Ausgabetoken für entdeckte Modelle.

### Anbieterbeispiele

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

Setzen Sie `OPENCODE_API_KEY` (oder `OPENCODE_ZEN_API_KEY`). Verwenden Sie `opencode/...`-Referenzen für den Zen-Katalog oder `opencode-go/...`-Referenzen für den Go-Katalog. Kurzform: `openclaw onboard --auth-choice opencode-zen` oder `openclaw onboard --auth-choice opencode-go`.

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

Setzen Sie `ZAI_API_KEY`. `z.ai/*` und `z-ai/*` werden als Aliasse akzeptiert. Kurzform: `openclaw onboard --auth-choice zai-api-key`.

- Allgemeiner Endpunkt: `https://api.z.ai/api/paas/v4`
- Coding-Endpunkt (Standard): `https://api.z.ai/api/coding/paas/v4`
- Für den allgemeinen Endpunkt definieren Sie einen benutzerdefinierten Anbieter mit Override der Base-URL.

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

Native Moonshot-Endpunkte geben Streaming-Nutzungskompatibilität auf dem gemeinsamen Transport `openai-completions` an, und OpenClaw knüpft dies jetzt an Endpunktfähigkeiten statt nur an die eingebaute Anbieter-ID.

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

Anthropic-kompatibel, eingebauter Anbieter. Kurzform: `openclaw onboard --auth-choice kimi-code-api-key`.

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

Die Base-URL sollte `/v1` weglassen (der Anthropic-Client hängt es an). Kurzform: `openclaw onboard --auth-choice synthetic-api-key`.

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

Setzen Sie `MINIMAX_API_KEY`. Kurzformen:
`openclaw onboard --auth-choice minimax-global-api` oder
`openclaw onboard --auth-choice minimax-cn-api`.
Der Modellkatalog verwendet jetzt standardmäßig nur noch M2.7.
Auf dem Anthropic-kompatiblen Streaming-Pfad deaktiviert OpenClaw MiniMax thinking
standardmäßig, es sei denn, Sie setzen `thinking` explizit selbst. `/fast on` oder
`params.fastMode: true` schreibt `MiniMax-M2.7` nach
`MiniMax-M2.7-highspeed` um.

</Accordion>

<Accordion title="Lokale Modelle (LM Studio)">

Siehe [Lokale Modelle](/de/gateway/local-models). Kurz gesagt: Führen Sie ein großes lokales Modell über die LM Studio Responses API auf leistungsfähiger Hardware aus; lassen Sie gehostete Modelle für Fallbacks gemergt.

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

- `allowBundled`: optionale Allowlist nur für gebündelte Skills (verwaltete/Workspace-Skills sind nicht betroffen).
- `load.extraDirs`: zusätzliche gemeinsame Skill-Roots (niedrigste Priorität).
- `install.preferBrew`: wenn true, werden Homebrew-Installer bevorzugt, wenn `brew` verfügbar ist, bevor auf andere Installer-Arten zurückgefallen wird.
- `install.nodeManager`: Präferenz für Node-Installer bei `metadata.openclaw.install`-Spezifikationen (`npm` | `pnpm` | `yarn` | `bun`).
- `entries.<skillKey>.enabled: false` deaktiviert einen Skill, auch wenn er gebündelt/installiert ist.
- `entries.<skillKey>.apiKey`: Komfortfeld für Skills, die eine primäre env-Variable deklarieren (Klartext-String oder SecretRef-Objekt).

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
- Discovery akzeptiert native OpenClaw-Plugins sowie kompatible Codex- und Claude-Bundles, einschließlich manifestloser Claude-Bundles im Standardlayout.
- **Konfigurationsänderungen erfordern einen Neustart des Gateways.**
- `allow`: optionale Allowlist (nur aufgeführte Plugins werden geladen). `deny` gewinnt.
- `plugins.entries.<id>.apiKey`: Komfortfeld für API key auf Plugin-Ebene (wenn vom Plugin unterstützt).
- `plugins.entries.<id>.env`: Plugin-spezifische env-Variablenzuordnung.
- `plugins.entries.<id>.hooks.allowPromptInjection`: wenn `false`, blockiert der Core `before_prompt_build` und ignoriert prompt-mutierende Felder aus Legacy-`before_agent_start`, während Legacy-`modelOverride` und `providerOverride` erhalten bleiben. Gilt für native Plugin-Hooks und unterstützte hook-Verzeichnisse aus Bundles.
- `plugins.entries.<id>.subagent.allowModelOverride`: diesem Plugin explizit vertrauen, pro Lauf `provider`- und `model`-Overrides für Hintergrund-Subagent-Läufe anzufordern.
- `plugins.entries.<id>.subagent.allowedModels`: optionale Allowlist kanonischer Ziele `provider/model` für vertrauenswürdige Subagent-Overrides. Verwenden Sie `"*"` nur dann, wenn Sie absichtlich jedes Modell zulassen möchten.
- `plugins.entries.<id>.config`: plugindefiniertes Konfigurationsobjekt (wenn verfügbar anhand des nativen OpenClaw-Plugin-Schemas validiert).
- `plugins.entries.firecrawl.config.webFetch`: Firecrawl-Einstellungen für den Web-Fetch-Anbieter.
  - `apiKey`: Firecrawl-API key (akzeptiert SecretRef). Fällt auf `plugins.entries.firecrawl.config.webSearch.apiKey`, Legacy-`tools.web.fetch.firecrawl.apiKey` oder die env-Variable `FIRECRAWL_API_KEY` zurück.
  - `baseUrl`: Firecrawl-API-Base-URL (Standard: `https://api.firecrawl.dev`).
  - `onlyMainContent`: nur Hauptinhalt aus Seiten extrahieren (Standard: `true`).
  - `maxAgeMs`: maximales Cache-Alter in Millisekunden (Standard: `172800000` / 2 Tage).
  - `timeoutSeconds`: Timeout des Scrape-Requests in Sekunden (Standard: `60`).
- `plugins.entries.xai.config.xSearch`: Einstellungen für xAI X Search (Grok-Websuche).
  - `enabled`: den X-Search-Anbieter aktivieren.
  - `model`: Grok-Modell, das für die Suche verwendet wird (z. B. `"grok-4-1-fast"`).
- `plugins.entries.memory-core.config.dreaming`: Einstellungen für Memory-Dreaming (experimentell). Siehe [Dreaming](/concepts/dreaming) für Phasen und Schwellenwerte.
  - `enabled`: Hauptschalter für Dreaming (Standard `false`).
  - `frequency`: Cron-Kadenz für jeden vollständigen Dreaming-Durchlauf (Standardmäßig `"0 3 * * *"`).
  - Phasenrichtlinie und Schwellenwerte sind Implementierungsdetails (keine benutzerorientierten Konfigurationsschlüssel).
- Aktivierte Claude-Bundle-Plugins können auch eingebettete Pi-Standards aus `settings.json` beitragen; OpenClaw wendet diese als bereinigte Agent-Einstellungen an, nicht als rohe OpenClaw-Konfigurations-Patches.
- `plugins.slots.memory`: aktive Memory-Plugin-ID auswählen oder `"none"`, um Memory-Plugins zu deaktivieren.
- `plugins.slots.contextEngine`: aktive Kontext-Engine-Plugin-ID auswählen; Standard ist `"legacy"`, sofern Sie keine andere Engine installieren und auswählen.
- `plugins.installs`: CLI-verwaltete Installationsmetadaten, die von `openclaw plugins update` verwendet werden.
  - Enthält `source`, `spec`, `sourcePath`, `installPath`, `version`, `resolvedName`, `resolvedVersion`, `resolvedSpec`, `integrity`, `shasum`, `resolvedAt`, `installedAt`.
  - Behandeln Sie `plugins.installs.*` als verwalteten Zustand; bevorzugen Sie CLI-Befehle vor manuellen Bearbeitungen.

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
      dangerouslyAllowPrivateNetwork: true, // Standard: Modus für vertrauenswürdige Netzwerke
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
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` ist standardmäßig `true`, wenn nicht gesetzt (Modell für vertrauenswürdige Netzwerke).
- Setzen Sie `ssrfPolicy.dangerouslyAllowPrivateNetwork: false` für strikt öffentliche Browser-Navigation.
- Im strikten Modus unterliegen Remote-CDP-Profilendpunkte (`profiles.*.cdpUrl`) derselben Sperre für private Netzwerke bei Erreichbarkeits-/Discovery-Prüfungen.
- `ssrfPolicy.allowPrivateNetwork` bleibt als Legacy-Alias unterstützt.
- Im strikten Modus verwenden Sie `ssrfPolicy.hostnameAllowlist` und `ssrfPolicy.allowedHostnames` für explizite Ausnahmen.
- Remote-Profile sind nur zum Anhängen (Start/Stopp/Reset deaktiviert).
- `profiles.*.cdpUrl` akzeptiert `http://`, `https://`, `ws://` und `wss://`.
  Verwenden Sie HTTP(S), wenn OpenClaw `/json/version` erkennen soll; verwenden Sie WS(S),
  wenn Ihr Anbieter Ihnen direkt eine DevTools-WebSocket-URL gibt.
- `existing-session`-Profile sind nur hostseitig und verwenden Chrome MCP statt CDP.
- `existing-session`-Profile können `userDataDir` setzen, um auf ein bestimmtes Profil eines Chromium-basierten Browsers zu zielen, etwa Brave oder Edge.
- `existing-session`-Profile behalten die aktuellen Routenlimits von Chrome MCP:
  snapshot-/ref-basierte Aktionen statt CSS-Selector-Targeting, Hooks für einen einzelnen Datei-Upload, keine Dialog-Timeout-Overrides, kein `wait --load networkidle` und kein `responsebody`, PDF-Export, Download-Interception oder Batch-Aktionen.
- Lokal verwaltete `openclaw`-Profile weisen `cdpPort` und `cdpUrl` automatisch zu; setzen Sie `cdpUrl` nur explizit für Remote-CDP.
- Auto-Erkennungsreihenfolge: Standardbrowser, falls Chromium-basiert → Chrome → Brave → Edge → Chromium → Chrome Canary.
- Control-Service: nur loopback (Port wird aus `gateway.port` abgeleitet, Standard `18791`).
- `extraArgs` hängt zusätzliche Start-Flags an den lokalen Chromium-Start an (zum Beispiel `--disable-gpu`, Fenstergröße oder Debug-Flags).

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

- `seamColor`: Akzentfarbe für das Chrome der nativen App-UI (Talk-Mode-Blasenfärbung usw.).
- `assistant`: Override der Identität in der Control UI. Fällt auf die aktive Agent-Identität zurück.

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

- `mode`: `local` (Gateway ausführen) oder `remote` (mit Remote-Gateway verbinden). Gateway verweigert den Start, sofern nicht `local`.
- `port`: einzelner multiplexter Port für WS + HTTP. Priorität: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`.
- `bind`: `auto`, `loopback` (Standard), `lan` (`0.0.0.0`), `tailnet` (nur Tailscale-IP) oder `custom`.
- **Legacy-Bind-Aliasse**: Verwenden Sie Bind-Modus-Werte in `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`), nicht Host-Aliasse (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`).
- **Docker-Hinweis**: Das Standard-Binding `loopback` lauscht innerhalb des Containers auf `127.0.0.1`. Bei Docker-Bridge-Networking (`-p 18789:18789`) kommt der Traffic über `eth0`, sodass das Gateway nicht erreichbar ist. Verwenden Sie `--network host` oder setzen Sie `bind: "lan"` (oder `bind: "custom"` mit `customBindHost: "0.0.0.0"`), um auf allen Schnittstellen zu lauschen.
- **Auth**: standardmäßig erforderlich. Nicht-loopback-Bindings erfordern Gateway-Auth. In der Praxis bedeutet das ein gemeinsames Token/Passwort oder einen identitätsbewussten Reverse-Proxy mit `gateway.auth.mode: "trusted-proxy"`. Der Onboarding-Assistent erzeugt standardmäßig ein Token.
- Wenn sowohl `gateway.auth.token` als auch `gateway.auth.password` konfiguriert sind (einschließlich SecretRefs), setzen Sie `gateway.auth.mode` explizit auf `token` oder `password`. Start- und Service-Installations-/Reparaturabläufe schlagen fehl, wenn beide konfiguriert sind und der Modus nicht gesetzt ist.
- `gateway.auth.mode: "none"`: expliziter Modus ohne Auth. Nur für vertrauenswürdige lokale loopback-Setups verwenden; diese Option wird in Onboarding-Prompts bewusst nicht angeboten.
- `gateway.auth.mode: "trusted-proxy"`: Auth an einen identitätsbewussten Reverse-Proxy delegieren und Identitätsheader von `gateway.trustedProxies` vertrauen (siehe [Trusted Proxy Auth](/de/gateway/trusted-proxy-auth)). Dieser Modus erwartet eine **nicht-loopback** Proxy-Quelle; Reverse-Proxies auf demselben Host über loopback erfüllen trusted-proxy auth nicht.
- `gateway.auth.allowTailscale`: wenn `true`, können Tailscale-Serve-Identitätsheader die Control UI-/WebSocket-Auth erfüllen (verifiziert via `tailscale whois`). HTTP-API-Endpunkte verwenden diese Tailscale-Header-Auth **nicht**; sie folgen stattdessen dem normalen HTTP-Auth-Modus des Gateways. Dieser tokenlose Flow setzt voraus, dass dem Gateway-Host vertraut wird. Standard ist `true`, wenn `tailscale.mode = "serve"`.
- `gateway.auth.rateLimit`: optionaler Limiter für fehlgeschlagene Authentifizierungen. Gilt pro Client-IP und pro Auth-Scope (gemeinsames Geheimnis und Device-Token werden unabhängig verfolgt). Blockierte Versuche geben `429` + `Retry-After` zurück.
  - Auf dem asynchronen Tailscale-Serve-Control-UI-Pfad werden fehlgeschlagene Versuche für dasselbe `{scope, clientIp}` vor dem Schreiben des Fehlers serialisiert. Gleichzeitige fehlerhafte Versuche desselben Clients können daher beim zweiten Request den Limiter auslösen, statt dass beide einfach als Mismatch durchrutschen.
  - `gateway.auth.rateLimit.exemptLoopback` ist standardmäßig `true`; setzen Sie `false`, wenn Sie bewusst möchten, dass auch localhost-Traffic ratenbegrenzt wird (für Test-Setups oder strikte Proxy-Deployments).
- Browser-originierte WS-Auth-Versuche werden immer mit deaktivierter Loopback-Ausnahme gedrosselt (Defense in Depth gegen Browser-basierte Brute-Force-Angriffe auf localhost).
- Auf loopback werden diese browser-originieren Sperren pro normalisiertem `Origin`-Wert isoliert, sodass wiederholte Fehlschläge von einer localhost-Origin nicht automatisch eine andere Origin sperren.
- `tailscale.mode`: `serve` (nur tailnet, loopback-Binding) oder `funnel` (öffentlich, Auth erforderlich).
- `controlUi.allowedOrigins`: explizite Browser-Origin-Allowlist für Gateway-WebSocket-Verbindungen. Erforderlich, wenn Browser-Clients von nicht-loopback Origins erwartet werden.
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: gefährlicher Modus, der Host-Header-Origin-Fallback für Deployments aktiviert, die sich bewusst auf Host-Header-Origin-Richtlinien verlassen.
- `remote.transport`: `ssh` (Standard) oder `direct` (ws/wss). Für `direct` muss `remote.url` `ws://` oder `wss://` sein.
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: clientseitiger Break-Glass-Override, der Klartext-`ws://` zu vertrauenswürdigen privaten Netzwerk-IP-Adressen erlaubt; Standard bleibt loopback-only für Klartext.
- `gateway.remote.token` / `.password` sind Anmeldedatenfelder für den Remote-Client. Sie konfigurieren Gateway-Auth nicht eigenständig.
- `gateway.push.apns.relay.baseUrl`: Basis-HTTPS-URL für das externe APNs-Relay, das von offiziellen/TestFlight-i