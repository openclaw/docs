---
read_when:
    - Konfigurieren eines Kanal-Plugins (Authentifizierung, Zugriffskontrolle, Mehrfachkonten)
    - Fehlerbehebung für kanalspezifische Konfigurationsschlüssel
    - Auditieren von DM-Richtlinie, Gruppenrichtlinie oder Mention-Gating
summary: 'Kanalkonfiguration: Zugriffskontrolle, Kopplung, kanalspezifische Schlüssel für Slack, Discord, Telegram, WhatsApp, Matrix, iMessage und weitere'
title: Konfiguration — Kanäle
x-i18n:
    generated_at: "2026-05-07T01:52:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: f94d41a347ade8b9447e9f31e48d46830b2faac2202823480a68b7986107176e
    source_path: gateway/config-channels.md
    workflow: 16
---

Konfigurationsschlüssel pro Kanal unter `channels.*`. Deckt DM- und Gruppenzugriff,
Multi-Account-Setups, Mention-Gating und kanalspezifische Schlüssel für Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage und die anderen mitgelieferten Kanal-Plugins ab.

Für Agents, Tools, Gateway-Laufzeit und andere Top-Level-Schlüssel siehe
[Konfigurationsreferenz](/de/gateway/configuration-reference).

## Kanäle

Jeder Kanal startet automatisch, wenn sein Konfigurationsabschnitt vorhanden ist (außer bei `enabled: false`).

### DM- und Gruppenzugriff

Alle Kanäle unterstützen DM-Richtlinien und Gruppenrichtlinien:

| DM-Richtlinie      | Verhalten                                                                    |
| ------------------ | ---------------------------------------------------------------------------- |
| `pairing` (Standard) | Unbekannte Absender erhalten einen einmaligen Pairing-Code; Owner muss genehmigen |
| `allowlist`        | Nur Absender in `allowFrom` (oder im gekoppelten Allow-Speicher)              |
| `open`             | Alle eingehenden DMs zulassen (erfordert `allowFrom: ["*"]`)                 |
| `disabled`         | Alle eingehenden DMs ignorieren                                              |

| Gruppenrichtlinie     | Verhalten                                                        |
| --------------------- | ---------------------------------------------------------------- |
| `allowlist` (Standard) | Nur Gruppen, die zur konfigurierten Allowlist passen             |
| `open`                | Gruppen-Allowlists umgehen (Mention-Gating gilt weiterhin)       |
| `disabled`            | Alle Gruppen-/Raumnachrichten blockieren                         |

<Note>
`channels.defaults.groupPolicy` legt den Standard fest, wenn `groupPolicy` eines Providers nicht gesetzt ist.
Pairing-Codes laufen nach 1 Stunde ab. Ausstehende DM-Pairing-Anfragen sind auf **3 pro Kanal** begrenzt.
Wenn ein Provider-Block vollständig fehlt (`channels.<provider>` nicht vorhanden), fällt die Gruppenrichtlinie zur Laufzeit auf `allowlist` zurück (geschlossenes Verhalten) und gibt beim Start eine Warnung aus.
</Note>

### Kanalmodell-Overrides

Verwenden Sie `channels.modelByChannel`, um bestimmte Kanal-IDs an ein Modell zu binden. Werte akzeptieren `provider/model` oder konfigurierte Modell-Aliasse. Die Kanalzuordnung gilt, wenn eine Sitzung nicht bereits einen Modell-Override hat (zum Beispiel über `/model` gesetzt).

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

Verwenden Sie `channels.defaults` für gemeinsame Gruppenrichtlinien- und Heartbeat-Verhaltensweisen über Provider hinweg:

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
- `channels.defaults.contextVisibility`: Standardmodus für die Sichtbarkeit von ergänzendem Kontext für alle Kanäle. Werte: `all` (Standard, gesamten Zitat-/Thread-/Verlaufskontext einbeziehen), `allowlist` (nur Kontext von Absendern auf der Allowlist einbeziehen), `allowlist_quote` (wie Allowlist, aber expliziten Zitat-/Antwortkontext beibehalten). Override pro Kanal: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: fehlerfreie Kanalstatus in die Heartbeat-Ausgabe aufnehmen.
- `channels.defaults.heartbeat.showAlerts`: eingeschränkte/fehlerhafte Status in die Heartbeat-Ausgabe aufnehmen.
- `channels.defaults.heartbeat.useIndicator`: kompakte Heartbeat-Ausgabe im Indikatorstil rendern.

### WhatsApp

WhatsApp läuft über den Web-Kanal des Gateways (Baileys Web). Es startet automatisch, wenn eine verknüpfte Sitzung vorhanden ist.

```json5
{
  web: {
    enabled: true,
    heartbeatSeconds: 60,
    whatsapp: {
      keepAliveIntervalMs: 25000,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
    },
    reconnect: {
      initialMs: 2000,
      maxMs: 120000,
      factor: 1.4,
      jitter: 0.2,
      maxAttempts: 0,
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

- Ausgehende Befehle verwenden standardmäßig Account `default`, falls vorhanden; andernfalls die erste konfigurierte Account-ID (sortiert).
- Optionales `channels.whatsapp.defaultAccount` überschreibt diese Fallback-Auswahl des Standard-Accounts, wenn es zu einer konfigurierten Account-ID passt.
- Das alte Baileys-Auth-Verzeichnis für Einzel-Accounts wird durch `openclaw doctor` nach `whatsapp/default` migriert.
- Overrides pro Account: `channels.whatsapp.accounts.<id>.sendReadReceipts`, `channels.whatsapp.accounts.<id>.dmPolicy`, `channels.whatsapp.accounts.<id>.allowFrom`.

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

- Bot-Token: `channels.telegram.botToken` oder `channels.telegram.tokenFile` (nur reguläre Datei; Symlinks werden abgelehnt), mit `TELEGRAM_BOT_TOKEN` als Fallback für den Standard-Account.
- `apiRoot` ist ausschließlich der Telegram Bot API-Root. Verwenden Sie `https://api.telegram.org` oder Ihren selbst gehosteten/Proxy-Root, nicht `https://api.telegram.org/bot<TOKEN>`; `openclaw doctor --fix` entfernt ein versehentliches angehängtes Suffix `/bot<TOKEN>`.
- Optionales `channels.telegram.defaultAccount` überschreibt die Standard-Account-Auswahl, wenn es zu einer konfigurierten Account-ID passt.
- Legen Sie in Multi-Account-Setups (2+ Account-IDs) einen expliziten Standard fest (`channels.telegram.defaultAccount` oder `channels.telegram.accounts.default`), um Fallback-Routing zu vermeiden; `openclaw doctor` warnt, wenn dies fehlt oder ungültig ist.
- `configWrites: false` blockiert von Telegram ausgelöste Konfigurationsschreibvorgänge (Supergroup-ID-Migrationen, `/config set|unset`).
- Top-Level-Einträge in `bindings[]` mit `type: "acp"` konfigurieren persistente ACP-Bindings für Forenthemen (verwenden Sie das kanonische `chatId:topic:topicId` in `match.peer.id`). Die Feldsemantik wird in [ACP-Agents](/de/tools/acp-agents#persistent-channel-bindings) gemeinsam beschrieben.
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
      streaming: {
        mode: "progress", // off | partial | block | progress (Discord default: progress)
        progress: {
          label: "auto",
          maxLines: 8,
          toolProgress: true,
        },
      },
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
        spawnSessions: true,
        defaultSpawnContext: "fork",
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
        connectTimeoutMs: 30000,
        reconnectGraceMs: 15000,
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
- Direkte ausgehende Aufrufe, die ein explizites Discord-`token` bereitstellen, verwenden dieses Token für den Aufruf; Einstellungen für Kontowiederholung/-richtlinien stammen weiterhin aus dem ausgewählten Konto im aktiven Laufzeit-Snapshot.
- Optionales `channels.discord.defaultAccount` überschreibt die Auswahl des Standardkontos, wenn es mit einer konfigurierten Konto-ID übereinstimmt.
- Verwenden Sie `user:<id>` (DM) oder `channel:<id>` (Guild-Kanal) für Zustellziele; reine numerische IDs werden abgelehnt.
- Guild-Slugs sind kleingeschrieben, wobei Leerzeichen durch `-` ersetzt werden; Kanal-Schlüssel verwenden den Namen als Slug (ohne `#`). Bevorzugen Sie Guild-IDs.
- Von Bots erstellte Nachrichten werden standardmäßig ignoriert. `allowBots: true` aktiviert sie; verwenden Sie `allowBots: "mentions"`, um nur Bot-Nachrichten zu akzeptieren, die den Bot erwähnen (eigene Nachrichten werden weiterhin gefiltert).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (und Kanal-Overrides) verwirft Nachrichten, die einen anderen Benutzer oder eine Rolle erwähnen, aber nicht den Bot (außer @everyone/@here).
- `channels.discord.mentionAliases` ordnet stabilen ausgehenden `@handle`-Text vor dem Senden Discord-Benutzer-IDs zu, sodass bekannte Teammitglieder deterministisch erwähnt werden können, selbst wenn der flüchtige Verzeichnis-Cache leer ist. Konto-Overrides befinden sich unter `channels.discord.accounts.<accountId>.mentionAliases`.
- `maxLinesPerMessage` (Standard 17) teilt hohe Nachrichten auch dann auf, wenn sie unter 2000 Zeichen liegen.
- `channels.discord.threadBindings` steuert Discord-threadgebundenes Routing:
  - `enabled`: Discord-Override für threadgebundene Sitzungsfunktionen (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` und gebundene Zustellung/Routing)
  - `idleHours`: Discord-Override für automatisches Unfocus bei Inaktivität in Stunden (`0` deaktiviert)
  - `maxAgeHours`: Discord-Override für harte maximale Lebensdauer in Stunden (`0` deaktiviert)
  - `spawnSessions`: Schalter für `sessions_spawn({ thread: true })` und automatische Thread-Erstellung/-Bindung beim ACP-Thread-Spawn (Standard: `true`)
  - `defaultSpawnContext`: nativer Subagent-Kontext für threadgebundene Spawns (standardmäßig `"fork"`)
- Top-Level-Einträge in `bindings[]` mit `type: "acp"` konfigurieren persistente ACP-Bindungen für Kanäle und Threads (Kanal-/Thread-ID in `match.peer.id` verwenden). Die Feldsemantik wird in [ACP-Agenten](/de/tools/acp-agents#persistent-channel-bindings) gemeinsam beschrieben.
- `channels.discord.ui.components.accentColor` legt die Akzentfarbe für Discord-Komponenten-v2-Container fest.
- `channels.discord.voice` aktiviert Discord-Sprachkanal-Unterhaltungen und optionale Auto-Join- sowie LLM- und TTS-Overrides. Reine Text-Discord-Konfigurationen lassen Sprache standardmäßig deaktiviert; setzen Sie `channels.discord.voice.enabled=true`, um sie zu aktivieren.
- `channels.discord.voice.model` überschreibt optional das LLM-Modell, das für Discord-Sprachkanalantworten verwendet wird.
- `channels.discord.voice.daveEncryption` und `channels.discord.voice.decryptionFailureTolerance` werden an die DAVE-Optionen von `@discordjs/voice` durchgereicht (standardmäßig `true` und `24`).
- `channels.discord.voice.connectTimeoutMs` steuert die anfängliche Ready-Wartezeit von `@discordjs/voice` für `/vc join` und Auto-Join-Versuche (standardmäßig `30000`).
- `channels.discord.voice.reconnectGraceMs` steuert, wie lange eine getrennte Sprachsitzung Zeit hat, in die Reconnect-Signalisierung zu wechseln, bevor OpenClaw sie beendet (standardmäßig `15000`).
- OpenClaw versucht zusätzlich, den Sprachempfang wiederherzustellen, indem eine Sprachsitzung nach wiederholten Entschlüsselungsfehlern verlassen und erneut betreten wird.
- `channels.discord.streaming` ist der kanonische Schlüssel für den Stream-Modus. Discord verwendet standardmäßig `streaming.mode: "progress"`, sodass Tool-/Arbeitsfortschritt in einer bearbeiteten Vorschaunachricht erscheint; setzen Sie `streaming.mode: "off"`, um dies zu deaktivieren. Legacy-Werte `streamMode` und boolesche `streaming`-Werte bleiben Laufzeit-Aliasse; führen Sie `openclaw doctor --fix` aus, um persistierte Konfiguration neu zu schreiben.
- `channels.discord.autoPresence` bildet Laufzeitverfügbarkeit auf Bot-Präsenz ab (healthy => online, degraded => idle, exhausted => dnd) und erlaubt optionale Statustext-Overrides.
- `channels.discord.dangerouslyAllowNameMatching` aktiviert veränderliches Namens-/Tag-Matching erneut (Break-Glass-Kompatibilitätsmodus).
- `channels.discord.execApprovals`: Discord-native Zustellung von Exec-Genehmigungen und Autorisierung von Genehmigern.
  - `enabled`: `true`, `false` oder `"auto"` (Standard). Im Auto-Modus werden Exec-Genehmigungen aktiviert, wenn Genehmiger aus `approvers` oder `commands.ownerAllowFrom` aufgelöst werden können.
  - `approvers`: Discord-Benutzer-IDs, die Exec-Anfragen genehmigen dürfen. Fällt auf `commands.ownerAllowFrom` zurück, wenn ausgelassen.
  - `agentFilter`: optionale Allowlist für Agenten-IDs. Auslassen, um Genehmigungen für alle Agenten weiterzuleiten.
  - `sessionFilter`: optionale Sitzungsschlüssel-Muster (Teilzeichenfolge oder Regex).
  - `target`: wohin Genehmigungsaufforderungen gesendet werden. `"dm"` (Standard) sendet an Genehmiger-DMs, `"channel"` sendet an den Ursprungskanal, `"both"` sendet an beide. Wenn das Ziel `"channel"` enthält, können Buttons nur von aufgelösten Genehmigern verwendet werden.
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
- **HTTP-Modus** erfordert `botToken` plus `signingSecret` (auf Root-Ebene oder pro Konto).
- `socketMode` reicht Slack-SDK-Socket-Mode-Transport-Tuning an die öffentliche Bolt-Receiver-API durch. Verwenden Sie es nur, wenn Sie Ping/Pong-Timeouts oder veraltetes Websocket-Verhalten untersuchen.
- `botToken`, `appToken`, `signingSecret` und `userToken` akzeptieren Klartext-
  Zeichenfolgen oder SecretRef-Objekte.
- Slack-Konto-Snapshots stellen Quell-/Statusfelder pro Anmeldeinformation bereit, etwa
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` und im HTTP-Modus
  `signingSecretStatus`. `configured_unavailable` bedeutet, dass das Konto
  über SecretRef konfiguriert ist, der aktuelle Befehls-/Laufzeitpfad den geheimen Wert aber
  nicht auflösen konnte.
- `configWrites: false` blockiert von Slack initiierte Konfigurationsschreibvorgänge.
- Optionales `channels.slack.defaultAccount` überschreibt die Auswahl des Standardkontos, wenn es mit einer konfigurierten Konto-ID übereinstimmt.
- `channels.slack.streaming.mode` ist der kanonische Slack-Stream-Modus-Schlüssel. `channels.slack.streaming.nativeTransport` steuert den nativen Streaming-Transport von Slack. Legacy-Werte `streamMode`, boolesche `streaming`-Werte und `nativeStreaming` bleiben Laufzeit-Aliasse; führen Sie `openclaw doctor --fix` aus, um persistierte Konfiguration neu zu schreiben.
- Verwenden Sie `user:<id>` (DM) oder `channel:<id>` für Zustellziele.

**Reaktionsbenachrichtigungsmodi:** `off`, `own` (Standard), `all`, `allowlist` (aus `reactionAllowlist`).

**Thread-Sitzungsisolation:** `thread.historyScope` ist pro Thread (Standard) oder über den Kanal gemeinsam genutzt. `thread.inheritParent` kopiert das Transkript des übergeordneten Kanals in neue Threads.

- Slack-natives Streaming plus der Slack-Assistant-artige Thread-Status „is typing...“ erfordern ein Antwort-Thread-Ziel. Top-Level-DMs bleiben standardmäßig außerhalb von Threads, sodass sie weiterhin über Slack-Entwurfs-Post-and-Edit-Vorschauen streamen können, statt die native Stream-/Statusvorschau im Thread-Stil anzuzeigen.
- `typingReaction` fügt der eingehenden Slack-Nachricht vorübergehend eine Reaktion hinzu, während eine Antwort läuft, und entfernt sie nach Abschluss. Verwenden Sie einen Slack-Emoji-Shortcode wie `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: Slack-native Zustellung von Exec-Genehmigungen und Autorisierung von Genehmigern. Gleiches Schema wie Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (Slack-Benutzer-IDs), `agentFilter`, `sessionFilter` und `target` (`"dm"`, `"channel"` oder `"both"`).

| Aktionsgruppe | Standard  | Hinweise                  |
| ------------ | ------- | ---------------------- |
| reactions    | aktiviert | Reagieren + Reaktionen auflisten |
| messages     | aktiviert | Lesen/senden/bearbeiten/löschen  |
| pins         | aktiviert | Anheften/lösen/auflisten         |
| memberInfo   | aktiviert | Mitgliederinformationen            |
| emojiList    | aktiviert | Benutzerdefinierte Emoji-Liste      |

### Mattermost

Mattermost wird in aktuellen OpenClaw-Releases als gebündeltes Plugin ausgeliefert. Ältere oder
benutzerdefinierte Builds können ein aktuelles npm-Paket mit
`openclaw plugins install @openclaw/mattermost` installieren. Prüfen Sie
[npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost)
auf die aktuellen Dist-Tags, bevor Sie eine Version pinnen.

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

Chatmodi: `oncall` (auf @-Mention antworten, Standard), `onmessage` (jede Nachricht), `onchar` (Nachrichten, die mit dem Trigger-Präfix beginnen).

Wenn native Mattermost-Befehle aktiviert sind:

- `commands.callbackPath` muss ein Pfad sein (zum Beispiel `/api/channels/mattermost/command`), keine vollständige URL.
- `commands.callbackUrl` muss zum OpenClaw-Gateway-Endpunkt auflösen und vom Mattermost-Server erreichbar sein.
- Native Slash-Callbacks werden mit den befehlsspezifischen Token authentifiziert, die Mattermost während der Registrierung von Slash-Befehlen zurückgibt. Wenn die Registrierung fehlschlägt oder keine Befehle aktiviert werden, lehnt OpenClaw Callbacks mit `Unauthorized: invalid command token.` ab.
- Für private/Tailnet/interne Callback-Hosts muss Mattermost möglicherweise `ServiceSettings.AllowedUntrustedInternalConnections` so konfigurieren, dass der Callback-Host bzw. die Callback-Domain enthalten ist. Verwenden Sie Host-/Domain-Werte, keine vollständigen URLs.
- `channels.mattermost.configWrites`: Von Mattermost initiierte Konfigurationsschreibvorgänge erlauben oder verweigern.
- `channels.mattermost.requireMention`: Vor dem Antworten in Kanälen `@mention` verlangen.
- `channels.mattermost.groups.<channelId>.requireMention`: Kanalspezifische Überschreibung für Mention-Gating (`"*"` für Standard).
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

**Modi für Reaktionsbenachrichtigungen:** `off`, `own` (Standard), `all`, `allowlist` (aus `reactionAllowlist`).

- `channels.signal.account`: Kanalstart an eine bestimmte Signal-Kontoidentität binden.
- `channels.signal.configWrites`: Von Signal initiierte Konfigurationsschreibvorgänge erlauben oder verweigern.
- Optionales `channels.signal.defaultAccount` überschreibt die Standardkontoauswahl, wenn es mit einer konfigurierten Konto-ID übereinstimmt.

### BlueBubbles

BlueBubbles ist die ältere iMessage-Bridge (Plugin-basiert, unter `channels.bluebubbles` konfiguriert). Bestehende Setups werden weiterhin unterstützt, aber neue OpenClaw-iMessage-Bereitstellungen sollten `channels.imessage` bevorzugen, wenn `imsg` auf dem Messages-Host ausgeführt werden kann.

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

- Hier abgedeckte Kern-Schlüsselpfade: `channels.bluebubbles`, `channels.bluebubbles.dmPolicy`.
- Optionales `channels.bluebubbles.defaultAccount` überschreibt die Standardkontoauswahl, wenn es mit einer konfigurierten Konto-ID übereinstimmt.
- Top-Level-`bindings[]`-Einträge mit `type: "acp"` können BlueBubbles-Unterhaltungen an persistente ACP-Sitzungen binden. Verwenden Sie ein BlueBubbles-Handle oder eine Zielzeichenfolge (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) in `match.peer.id`. Gemeinsame Feldsemantik: [ACP-Agenten](/de/tools/acp-agents#persistent-channel-bindings).
- Die vollständige BlueBubbles-Kanalkonfiguration und die Begründung für die Abkündigung sind in [BlueBubbles](/de/channels/bluebubbles) dokumentiert.

### iMessage

OpenClaw startet `imsg rpc` (JSON-RPC über stdio). Es ist kein Daemon und kein Port erforderlich. Dies ist der bevorzugte Pfad für neue OpenClaw-iMessage-Setups, wenn der Host Berechtigungen für die Messages-Datenbank und Automation erteilen kann.

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

- Erfordert vollständigen Festplattenzugriff auf die Messages-Datenbank.
- Bevorzugen Sie `chat_id:<id>`-Ziele. Verwenden Sie `imsg chats --limit 20`, um Chats aufzulisten.
- `cliPath` kann auf einen SSH-Wrapper verweisen; legen Sie `remoteHost` (`host` oder `user@host`) für das Abrufen von Anhängen per SCP fest.
- `attachmentRoots` und `remoteAttachmentRoots` beschränken eingehende Anhangspfade (Standard: `/Users/*/Library/Messages/Attachments`).
- SCP verwendet strikte Host-Key-Prüfung. Stellen Sie daher sicher, dass der Schlüssel des Relay-Hosts bereits in `~/.ssh/known_hosts` vorhanden ist.
- `channels.imessage.configWrites`: Von iMessage initiierte Konfigurationsschreibvorgänge erlauben oder verweigern.
- Top-Level-`bindings[]`-Einträge mit `type: "acp"` können iMessage-Unterhaltungen an persistente ACP-Sitzungen binden. Verwenden Sie ein normalisiertes Handle oder ein explizites Chat-Ziel (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) in `match.peer.id`. Gemeinsame Feldsemantik: [ACP-Agenten](/de/tools/acp-agents#persistent-channel-bindings).

<Accordion title="Beispiel für einen iMessage-SSH-Wrapper">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix ist Plugin-basiert und unter `channels.matrix` konfiguriert.

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
- `channels.matrix.defaultAccount` wählt das bevorzugte Konto in Multi-Account-Setups aus.
- `channels.matrix.autoJoin` ist standardmäßig `off`, daher werden eingeladene Räume und neue DM-artige Einladungen ignoriert, bis Sie `autoJoin: "allowlist"` mit `autoJoinAllowlist` oder `autoJoin: "always"` festlegen.
- `channels.matrix.execApprovals`: Matrix-native Zustellung von Exec-Genehmigungen und Autorisierung der Genehmigenden.
  - `enabled`: `true`, `false` oder `"auto"` (Standard). Im Automatikmodus werden Exec-Genehmigungen aktiviert, wenn Genehmigende aus `approvers` oder `commands.ownerAllowFrom` aufgelöst werden können.
  - `approvers`: Matrix-Benutzer-IDs (z. B. `@owner:example.org`), die Exec-Anfragen genehmigen dürfen.
  - `agentFilter`: optionale Agent-ID-Allowlist. Weglassen, um Genehmigungen für alle Agenten weiterzuleiten.
  - `sessionFilter`: optionale Sitzungsschlüsselmuster (Teilzeichenfolge oder Regex).
  - `target`: wohin Genehmigungsaufforderungen gesendet werden. `"dm"` (Standard), `"channel"` (ursprünglicher Raum) oder `"both"`.
  - Kontospezifische Überschreibungen: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` steuert, wie Matrix-DMs in Sitzungen gruppiert werden: `per-user` (Standard) teilt nach geroutetem Peer, während `per-room` jeden DM-Raum isoliert.
- Matrix-Statusprobes und Live-Verzeichnisabfragen verwenden dieselbe Proxy-Richtlinie wie der Laufzeitdatenverkehr.
- Die vollständige Matrix-Konfiguration, Targeting-Regeln und Setup-Beispiele sind in [Matrix](/de/channels/matrix) dokumentiert.

### Microsoft Teams

Microsoft Teams ist Plugin-basiert und unter `channels.msteams` konfiguriert.

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

- Hier abgedeckte Kern-Schlüsselpfade: `channels.msteams`, `channels.msteams.configWrites`.
- Die vollständige Teams-Konfiguration (Anmeldedaten, Webhook, DM-/Gruppenrichtlinie, team- und kanalspezifische Überschreibungen) ist in [Microsoft Teams](/de/channels/msteams) dokumentiert.

### IRC

IRC ist Plugin-basiert und unter `channels.irc` konfiguriert.

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

- Hier abgedeckte Kern-Schlüsselpfade: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`.
- Optionales `channels.irc.defaultAccount` überschreibt die Standardkontoauswahl, wenn es mit einer konfigurierten Konto-ID übereinstimmt.
- Die vollständige IRC-Kanalkonfiguration (Host/Port/TLS/Kanäle/Allowlists/Mention-Gating) ist in [IRC](/de/channels/irc) dokumentiert.

### Multi-Account (alle Kanäle)

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

- `default` wird verwendet, wenn `accountId` ausgelassen wird (CLI + Routing).
- Env-Token gelten nur für das **Standardkonto**.
- Basis-Kanaleinstellungen gelten für alle Konten, sofern sie nicht pro Konto überschrieben werden.
- Verwenden Sie `bindings[].match.accountId`, um jedes Konto an einen anderen Agenten zu routen.
- Wenn Sie über `openclaw channels add` (oder Kanal-Onboarding) ein Nicht-Standardkonto hinzufügen, während noch eine Top-Level-Kanalkonfiguration für ein einzelnes Konto vorhanden ist, verschiebt OpenClaw kontobezogene Top-Level-Einzelkontowerte zuerst in die Konto-Map des Kanals, damit das ursprüngliche Konto weiter funktioniert. Die meisten Kanäle verschieben sie nach `channels.<channel>.accounts.default`; Matrix kann stattdessen ein vorhandenes passendes benanntes/Standardziel beibehalten.
- Bestehende kanalbezogene Bindings (ohne `accountId`) matchen weiterhin das Standardkonto; kontobezogene Bindings bleiben optional.
- `openclaw doctor --fix` repariert auch gemischte Formen, indem kontobezogene Top-Level-Einzelkontowerte in das für diesen Kanal ausgewählte hochgestufte Konto verschoben werden. Die meisten Kanäle verwenden `accounts.default`; Matrix kann stattdessen ein vorhandenes passendes benanntes/Standardziel beibehalten.

### Andere Plugin-Kanäle

Viele Plugin-Kanäle werden als `channels.<id>` konfiguriert und auf ihren jeweiligen Kanalseiten dokumentiert (zum Beispiel Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat und Twitch).
Siehe den vollständigen Kanalindex: [Kanäle](/de/channels).

### Mention-Gating für Gruppenchats

Gruppennachrichten erfordern standardmäßig eine **Mention** (Metadaten-Mention oder sichere Regex-Muster). Gilt für WhatsApp-, Telegram-, Discord-, Google Chat- und iMessage-Gruppenchats.

Sichtbare Antworten werden separat gesteuert. Gruppen-/Kanalräume verwenden standardmäßig `messages.groupChat.visibleReplies: "message_tool"`: OpenClaw verarbeitet den Turn weiterhin, aber normale finale Antworten bleiben privat, und sichtbare Raumausgabe erfordert `message(action=send)`. Legen Sie `"automatic"` nur fest, wenn Sie das Legacy-Verhalten wünschen, bei dem normale Antworten zurück in den Raum gepostet werden. Um dasselbe Tool-only-Verhalten für sichtbare Antworten auch auf direkte Chats anzuwenden, legen Sie `messages.visibleReplies: "message_tool"` fest; der Codex-Harness verwendet dieses Tool-only-Verhalten ebenfalls als nicht gesetzten Standard für direkte Chats.

Tool-only-sichtbare Antworten erfordern ein Modell/eine Runtime, das bzw. die zuverlässig Tools aufruft. Wenn das Sitzungslog Assistententext mit `didSendViaMessagingTool: false` zeigt, hat das Modell eine private finale Antwort erzeugt, anstatt das Nachrichtentool aufzurufen. Wechseln Sie für diesen Kanal zu einem stärkeren Tool-Calling-Modell, oder setzen Sie `messages.groupChat.visibleReplies: "automatic"`, um sichtbare finale Antworten im Legacy-Stil wiederherzustellen.

Wenn das Message-Tool unter der aktiven Tool-Richtlinie nicht verfügbar ist, fällt OpenClaw auf automatische sichtbare Antworten zurück, statt die Antwort stillschweigend zu unterdrücken. `openclaw doctor` warnt vor dieser Abweichung.

Das Gateway lädt die `messages`-Konfiguration nach dem Speichern der Datei per Hot-Reload neu. Starten Sie nur neu, wenn Dateiüberwachung oder Konfigurations-Reload im Deployment deaktiviert ist.

**Mention-Typen:**

- **Metadaten-Mentions**: Native @-Mentions der Plattform. Werden im WhatsApp-Selbstchat-Modus ignoriert.
- **Textmuster**: Sichere Regex-Muster in `agents.list[].groupChat.mentionPatterns`. Ungültige Muster und unsichere verschachtelte Wiederholungen werden ignoriert.
- Mention-Gating wird nur erzwungen, wenn die Erkennung möglich ist (native Mentions oder mindestens ein Muster).

```json5
{
  messages: {
    visibleReplies: "automatic", // global default for direct/source chats; Codex harness defaults unset direct chats to message_tool
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

`messages.groupChat.historyLimit` legt den globalen Standardwert fest. Channels können ihn mit `channels.<channel>.historyLimit` (oder pro Account) überschreiben. Setzen Sie `0`, um ihn zu deaktivieren.

`messages.visibleReplies` ist der globale Standardwert für Source-Turns; `messages.groupChat.visibleReplies` überschreibt ihn für Source-Turns in Gruppen/Channels. Wenn `messages.visibleReplies` nicht gesetzt ist, kann ein Harness seinen eigenen Standardwert für Direkt-/Source-Turns bereitstellen; der Codex-Harness verwendet standardmäßig `message_tool`. Channel-Allowlists und Mention-Gating entscheiden weiterhin, ob ein Turn verarbeitet wird.

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

Auflösung: DM-spezifische Überschreibung → Provider-Standardwert → kein Limit (alles wird beibehalten).

Unterstützt: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### Selbstchat-Modus

Nehmen Sie Ihre eigene Nummer in `allowFrom` auf, um den Selbstchat-Modus zu aktivieren (ignoriert native @-Mentions und reagiert nur auf Textmuster):

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

<Accordion title="Befehlsdetails">

- Dieser Block konfiguriert Befehlsoberflächen. Den aktuellen integrierten und gebündelten Befehlskatalog finden Sie unter [Slash-Befehle](/de/tools/slash-commands).
- Diese Seite ist eine **Referenz für Konfigurationsschlüssel**, nicht der vollständige Befehlskatalog. Channel-/Plugin-eigene Befehle wie QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, Geräte-Pairing `/pair`, Memory `/dreaming`, Telefonsteuerung `/phone` und Talk `/voice` sind auf ihren Channel-/Plugin-Seiten sowie unter [Slash-Befehle](/de/tools/slash-commands) dokumentiert.
- Textbefehle müssen **eigenständige** Nachrichten mit führendem `/` sein.
- `native: "auto"` aktiviert native Befehle für Discord/Telegram und lässt Slack deaktiviert.
- `nativeSkills: "auto"` aktiviert native Skill-Befehle für Discord/Telegram und lässt Slack deaktiviert.
- Pro Channel überschreiben: `channels.discord.commands.native` (Boolescher Wert oder `"auto"`). Bei Discord überspringt `false` die Registrierung und Bereinigung nativer Befehle beim Start.
- Überschreiben Sie die Registrierung nativer Skill-Befehle pro Channel mit `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` fügt zusätzliche Telegram-Bot-Menüeinträge hinzu.
- `bash: true` aktiviert `! <cmd>` für die Host-Shell. Erfordert `tools.elevated.enabled` und den Sender in `tools.elevated.allowFrom.<channel>`.
- `config: true` aktiviert `/config` (liest/schreibt `openclaw.json`). Für Gateway-`chat.send`-Clients erfordern persistente `/config set|unset`-Schreibvorgänge außerdem `operator.admin`; schreibgeschütztes `/config show` bleibt für normale Operator-Clients mit Schreibbereich verfügbar.
- `mcp: true` aktiviert `/mcp` für von OpenClaw verwaltete MCP-Server-Konfiguration unter `mcp.servers`.
- `plugins: true` aktiviert `/plugins` für Plugin-Erkennung, Installation und Steuerelemente zum Aktivieren/Deaktivieren.
- `channels.<provider>.configWrites` steuert Konfigurationsänderungen pro Channel (Standard: true).
- Bei Channels mit mehreren Accounts steuert `channels.<provider>.accounts.<id>.configWrites` auch Schreibvorgänge, die auf diesen Account zielen (zum Beispiel `/allowlist --config --account <id>` oder `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` deaktiviert `/restart` und Gateway-Neustartaktionen über Tools. Standard: `true`.
- `ownerAllowFrom` ist die explizite Owner-Allowlist für Owner-only-Befehle/-Tools. Sie ist von `allowFrom` getrennt.
- `ownerDisplay: "hash"` hasht Owner-IDs im System-Prompt. Setzen Sie `ownerDisplaySecret`, um das Hashing zu steuern.
- `allowFrom` gilt pro Provider. Wenn gesetzt, ist es die **einzige** Autorisierungsquelle (Channel-Allowlists/Pairing und `useAccessGroups` werden ignoriert).
- `useAccessGroups: false` erlaubt Befehlen, Access-Group-Richtlinien zu umgehen, wenn `allowFrom` nicht gesetzt ist.
- Zuordnung der Befehlsdokumentation:
  - integrierter und gebündelter Katalog: [Slash-Befehle](/de/tools/slash-commands)
  - Channel-spezifische Befehlsoberflächen: [Channels](/de/channels)
  - QQ Bot-Befehle: [QQ Bot](/de/channels/qqbot)
  - Pairing-Befehle: [Pairing](/de/channels/pairing)
  - LINE-Kartenbefehl: [LINE](/de/channels/line)
  - Memory-Dreaming: [Dreaming](/de/concepts/dreaming)

</Accordion>

---

## Verwandt

- [Konfigurationsreferenz](/de/gateway/configuration-reference) — Schlüssel der obersten Ebene
- [Konfiguration — Agenten](/de/gateway/config-agents)
- [Channels-Übersicht](/de/channels)
