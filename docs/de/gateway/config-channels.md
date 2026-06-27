---
read_when:
    - Konfiguration eines Kanal-Plugins (Authentifizierung, Zugriffskontrolle, mehrere Konten)
    - Fehlerbehebung bei kanalspezifischen Konfigurationsschlüsseln
    - Auditieren von DM-Richtlinien, Gruppenrichtlinien oder Erwähnungs-Gating
summary: 'Kanalkonfiguration: Zugriffskontrolle, Kopplung und kanalspezifische Schlüssel für Slack, Discord, Telegram, WhatsApp, Matrix, iMessage und mehr'
title: Konfiguration — Kanäle
x-i18n:
    generated_at: "2026-06-27T17:28:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9bdc9c0b3c55f2ad6a7d6874022cdac6abbe8d0219feda3c8c9710c08e4d8fb7
    source_path: gateway/config-channels.md
    workflow: 16
---

Konfigurationsschlüssel pro Kanal unter `channels.*`. Deckt DM- und Gruppenzugriff,
Setups mit mehreren Konten, Mention-Gating und kanalspezifische Schlüssel für Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage und die anderen gebündelten Kanal-Plugins ab.

Für Agenten, Tools, Gateway-Laufzeit und andere Top-Level-Schlüssel siehe
[Konfigurationsreferenz](/de/gateway/configuration-reference).

## Kanäle

Jeder Kanal startet automatisch, wenn sein Konfigurationsabschnitt vorhanden ist (außer `enabled: false`).

### DM- und Gruppenzugriff

Alle Kanäle unterstützen DM-Richtlinien und Gruppenrichtlinien:

| DM-Richtlinie       | Verhalten                                                       |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (Standard) | Unbekannte Absender erhalten einen einmaligen Kopplungscode; der Owner muss genehmigen |
| `allowlist`         | Nur Absender in `allowFrom` (oder im gekoppelten Allow-Store)   |
| `open`              | Alle eingehenden DMs zulassen (erfordert `allowFrom: ["*"]`)    |
| `disabled`          | Alle eingehenden DMs ignorieren                                 |

| Gruppenrichtlinie     | Verhalten                                             |
| --------------------- | ----------------------------------------------------- |
| `allowlist` (Standard) | Nur Gruppen, die der konfigurierten Allowlist entsprechen |
| `open`                | Gruppen-Allowlists umgehen (Mention-Gating gilt weiterhin) |
| `disabled`            | Alle Gruppen-/Raumnachrichten blockieren              |

<Note>
`channels.defaults.groupPolicy` legt den Standard fest, wenn `groupPolicy` eines Providers nicht gesetzt ist.
Kopplungscodes laufen nach 1 Stunde ab. Ausstehende DM-Kopplungsanfragen sind auf **3 pro Kanal** begrenzt.
Wenn ein Provider-Block vollständig fehlt (`channels.<provider>` fehlt), fällt die Gruppenrichtlinie zur Laufzeit mit einer Startwarnung auf `allowlist` zurück (fail-closed).
</Note>

### Kanal-Modellüberschreibungen

Verwenden Sie `channels.modelByChannel`, um bestimmte Kanal-IDs oder Direct-Message-Peers an ein Modell zu binden. Werte akzeptieren `provider/model` oder konfigurierte Modell-Aliase. Die Kanalzuordnung greift, wenn eine Sitzung noch keine Modellüberschreibung hat (zum Beispiel gesetzt über `/model`).

Für Gruppen-/Thread-Unterhaltungen sind Schlüssel kanalspezifische Gruppen-IDs, Topic-IDs oder Kanalnamen. Für Direct-Message-(DM-)Unterhaltungen sind Schlüssel Peer-Identifikatoren, die aus der Absenderidentität des Kanals abgeleitet werden (`nativeDirectUserId`, `origin.from`, `origin.to`, `OriginatingTo`, `From` oder `SenderId`). Die genaue Schlüsselform hängt vom Kanal ab:

| Kanal    | DM-Schlüsselform   | Beispiel                                     |
| -------- | ------------------ | -------------------------------------------- |
| Slack    | `user:U...`        | `user:U12345`                                |
| Telegram | rohe Benutzer-ID   | `123456789`                                  |
| Discord  | rohe Benutzer-ID   | `987654321`                                  |
| WhatsApp | Telefonnummer oder JID | `15551234567`                            |
| Matrix   | Matrix-Benutzer-ID | `@user:matrix.org`                           |
| Feishu   | `feishu:ou_...`    | `feishu:ou_a8b6cab7e945387de5f253775d9b4d85` |

```json5
{
  channels: {
    modelByChannel: {
      discord: {
        "123456789012345678": "anthropic/claude-opus-4-6",
      },
      slack: {
        C1234567890: "openai/gpt-5.5",
        "user:U12345": "openai/gpt-5.4-mini",
      },
      telegram: {
        "-1001234567890": "openai/gpt-5.4-mini",
        "-1001234567890:topic:99": "anthropic/claude-sonnet-4-6",
        "123456789": "openai/gpt-4.1",
      },
    },
  },
}
```

DM-spezifische Schlüssel passen nur in Direct-Message-Unterhaltungen; sie beeinflussen das Routing von Gruppen/Threads nicht.

### Kanal-Standards und Heartbeat

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
- `channels.defaults.contextVisibility`: Standardmodus für die Sichtbarkeit von ergänzendem Kontext für alle Kanäle. Werte: `all` (Standard, gesamten Zitat-/Thread-/Verlaufskontext einbeziehen), `allowlist` (nur Kontext von Absendern auf der Allowlist einbeziehen), `allowlist_quote` (wie Allowlist, aber expliziten Zitat-/Antwortkontext beibehalten). Überschreibung pro Kanal: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: Gesunde Kanalstatus in die Heartbeat-Ausgabe aufnehmen.
- `channels.defaults.heartbeat.showAlerts`: Beeinträchtigte/Fehlerstatus in die Heartbeat-Ausgabe aufnehmen.
- `channels.defaults.heartbeat.useIndicator`: Kompakte Heartbeat-Ausgabe im Indikatorstil rendern.

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

- Top-Level-Einträge in `bindings[]` mit `type: "acp"` konfigurieren persistente ACP-Bindings für WhatsApp-DMs und Gruppen. Verwenden Sie eine direkte E.164-Nummer oder eine WhatsApp-Gruppen-JID in `match.peer.id`. Feldsemantiken werden gemeinsam in [ACP-Agenten](/de/tools/acp-agents#persistent-channel-bindings) beschrieben.

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
- Optionales `channels.whatsapp.defaultAccount` überschreibt diese Fallback-Auswahl des Standardkontos, wenn es einer konfigurierten Konto-ID entspricht.
- Das alte Baileys-Auth-Verzeichnis für ein einzelnes Konto wird von `openclaw doctor` nach `whatsapp/default` migriert.
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
- `apiRoot` ist ausschließlich der Root der Telegram Bot API. Verwenden Sie `https://api.telegram.org` oder Ihren selbst gehosteten/Proxy-Root, nicht `https://api.telegram.org/bot<TOKEN>`; `openclaw doctor --fix` entfernt ein versehentliches angehängtes Suffix `/bot<TOKEN>`.
- Optionales `channels.telegram.defaultAccount` überschreibt die Auswahl des Standardkontos, wenn es einer konfigurierten Konto-ID entspricht.
- Setzen Sie in Setups mit mehreren Konten (2+ Konto-IDs) einen expliziten Standard (`channels.telegram.defaultAccount` oder `channels.telegram.accounts.default`), um Fallback-Routing zu vermeiden; `openclaw doctor` warnt, wenn dies fehlt oder ungültig ist.
- `configWrites: false` blockiert von Telegram initiierte Konfigurationsschreibvorgänge (Supergruppen-ID-Migrationen, `/config set|unset`).
- Top-Level-Einträge in `bindings[]` mit `type: "acp"` konfigurieren persistente ACP-Bindings für Forum-Topics (verwenden Sie das kanonische `chatId:topic:topicId` in `match.peer.id`). Feldsemantiken werden gemeinsam in [ACP-Agenten](/de/tools/acp-agents#persistent-channel-bindings) beschrieben.
- Telegram-Stream-Vorschauen verwenden `sendMessage` + `editMessageText` (funktioniert in direkten und Gruppen-Chats).
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
      suppressEmbeds: true,
      chunkMode: "length", // length | newline
      streaming: {
        mode: "progress", // off | partial | block | progress (Discord default: progress)
        progress: {
          label: "auto",
          maxLines: 8,
          maxLineChars: 120,
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
- Direkte ausgehende Aufrufe, die ein explizites Discord-`token` bereitstellen, verwenden dieses Token für den Aufruf; Einstellungen für Kontowiederholung und -richtlinien stammen weiterhin aus dem ausgewählten Konto im aktiven Runtime-Snapshot.
- Optionales `channels.discord.defaultAccount` überschreibt die Auswahl des Standardkontos, wenn es mit einer konfigurierten Konto-ID übereinstimmt.
- Verwenden Sie `user:<id>` (DM) oder `channel:<id>` (Guild-Kanal) für Zustellungsziele; reine numerische IDs werden abgelehnt.
- Guild-Slugs sind kleingeschrieben, wobei Leerzeichen durch `-` ersetzt werden; Kanal-Schlüssel verwenden den gesluggten Namen (ohne `#`). Bevorzugen Sie Guild-IDs.
- Von Bots verfasste Nachrichten werden standardmäßig ignoriert. `allowBots: true` aktiviert sie; verwenden Sie `allowBots: "mentions"`, um nur Bot-Nachrichten zu akzeptieren, die den Bot erwähnen (eigene Nachrichten werden weiterhin gefiltert).
- Kanäle, die von Bots verfasste eingehende Nachrichten unterstützen, können den gemeinsamen [Bot-Loop-Schutz](/de/channels/bot-loop-protection) verwenden. Legen Sie `channels.defaults.botLoopProtection` für grundlegende Pair-Budgets fest und überschreiben Sie dann Kanal oder Konto nur, wenn eine Oberfläche andere Limits benötigt.
- `channels.discord.guilds.<id>.ignoreOtherMentions` (und Kanal-Overrides) verwirft Nachrichten, die einen anderen Benutzer oder eine Rolle, aber nicht den Bot erwähnen (ausgenommen @everyone/@here).
- `channels.discord.mentionAliases` ordnet stabilen ausgehenden `@handle`-Text vor dem Senden Discord-Benutzer-IDs zu, sodass bekannte Teammitglieder deterministisch erwähnt werden können, auch wenn der flüchtige Verzeichnis-Cache leer ist. Konto-spezifische Overrides liegen unter `channels.discord.accounts.<accountId>.mentionAliases`.
- `maxLinesPerMessage` (Standard 17) teilt hohe Nachrichten auch dann auf, wenn sie unter 2000 Zeichen liegen.
- `channels.discord.suppressEmbeds` ist standardmäßig `true`, sodass ausgehende URLs nicht zu Discord-Linkvorschauen erweitert werden, sofern dies nicht deaktiviert ist. Explizite `embeds`-Payloads werden weiterhin normal gesendet; Tool-Aufrufe pro Nachricht können dies mit `suppressEmbeds` überschreiben.
- `channels.discord.threadBindings` steuert Discord-Thread-gebundenes Routing:
  - `enabled`: Discord-Override für Thread-gebundene Sitzungsfunktionen (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` sowie gebundene Zustellung/Routing)
  - `idleHours`: Discord-Override für automatische Inaktivitäts-Entfokussierung in Stunden (`0` deaktiviert)
  - `maxAgeHours`: Discord-Override für hartes Maximalalter in Stunden (`0` deaktiviert)
  - `spawnSessions`: Schalter für `sessions_spawn({ thread: true })` und automatische ACP-Thread-Erstellung/-Bindung beim Thread-Spawn (Standard: `true`)
  - `defaultSpawnContext`: nativer Subagent-Kontext für Thread-gebundene Spawns (standardmäßig `"fork"`)
- Einträge auf oberster Ebene in `bindings[]` mit `type: "acp"` konfigurieren persistente ACP-Bindungen für Kanäle und Threads (verwenden Sie die Kanal-/Thread-ID in `match.peer.id`). Die Feldsemantik wird in [ACP Agents](/de/tools/acp-agents#persistent-channel-bindings) gemeinsam verwendet.
- `channels.discord.ui.components.accentColor` legt die Akzentfarbe für Discord-Komponenten-v2-Container fest.
- `channels.discord.agentComponents.ttlMs` steuert, wie lange gesendete Discord-Komponenten-Callbacks registriert bleiben. Der Standard ist `1800000` (30 Minuten), das Maximum ist `86400000` (24 Stunden), und Konto-spezifische Overrides liegen unter `channels.discord.accounts.<accountId>.agentComponents.ttlMs`. Längere Werte halten alte Buttons/Selects/Formulare länger nutzbar; bevorzugen Sie daher die kürzeste TTL, die zum Workflow passt.
- `channels.discord.voice` aktiviert Discord-Sprachkanal-Unterhaltungen und optionale Auto-Join- sowie LLM- und TTS-Overrides. Reine Text-Discord-Konfigurationen lassen Sprache standardmäßig deaktiviert; setzen Sie `channels.discord.voice.enabled=true`, um sie zu aktivieren.
- `channels.discord.voice.model` überschreibt optional das LLM-Modell, das für Discord-Sprachkanal-Antworten verwendet wird.
- `channels.discord.voice.daveEncryption` und `channels.discord.voice.decryptionFailureTolerance` werden an die DAVE-Optionen von `@discordjs/voice` durchgereicht (standardmäßig `true` und `24`).
- `channels.discord.voice.connectTimeoutMs` steuert das anfängliche Warten von `@discordjs/voice` auf Ready für `/vc join` und Auto-Join-Versuche (standardmäßig `30000`).
- `channels.discord.voice.reconnectGraceMs` steuert, wie lange eine getrennte Sprachsitzung Zeit hat, in die Wiederverbindungs-Signalisierung einzutreten, bevor OpenClaw sie zerstört (standardmäßig `15000`).
- Die Discord-Sprachwiedergabe wird nicht durch ein Speaking-Start-Ereignis eines anderen Benutzers unterbrochen. Um Feedback-Schleifen zu vermeiden, ignoriert OpenClaw neue Sprachaufnahmen, während TTS abgespielt wird.
- OpenClaw versucht zusätzlich eine Wiederherstellung des Sprachempfangs, indem es eine Sprachsitzung nach wiederholten Entschlüsselungsfehlern verlässt und erneut beitritt.
- `channels.discord.streaming` ist der kanonische Schlüssel für den Stream-Modus. Discord verwendet standardmäßig `streaming.mode: "progress"`, sodass Tool-/Arbeitsfortschritt in einer bearbeiteten Vorschaunachricht erscheint; setzen Sie `streaming.mode: "off"`, um dies zu deaktivieren. Legacy-Werte `streamMode` und boolesche `streaming`-Werte bleiben Runtime-Aliase; führen Sie `openclaw doctor --fix` aus, um persistierte Konfiguration neu zu schreiben.
- `channels.discord.autoPresence` ordnet Runtime-Verfügbarkeit der Bot-Präsenz zu (healthy => online, degraded => idle, exhausted => dnd) und erlaubt optionale Status-Text-Overrides.
- `channels.discord.dangerouslyAllowNameMatching` reaktiviert mutable Namens-/Tag-Abgleiche (Break-Glass-Kompatibilitätsmodus).
- `channels.discord.execApprovals`: Discord-native Zustellung von Exec-Genehmigungen und Autorisierung von Genehmigenden.
  - `enabled`: `true`, `false` oder `"auto"` (Standard). Im Auto-Modus werden Exec-Genehmigungen aktiviert, wenn Genehmigende aus `approvers` oder `commands.ownerAllowFrom` aufgelöst werden können.
  - `approvers`: Discord-Benutzer-IDs, die Exec-Anfragen genehmigen dürfen. Fällt bei Auslassung auf `commands.ownerAllowFrom` zurück.
  - `agentFilter`: optionale Allowlist für Agent-IDs. Weglassen, um Genehmigungen für alle Agents weiterzuleiten.
  - `sessionFilter`: optionale Sitzungsschlüssel-Muster (Teilstring oder Regex).
  - `target`: wohin Genehmigungsaufforderungen gesendet werden. `"dm"` (Standard) sendet an DMs der Genehmigenden, `"channel"` sendet an den Ursprungskanal, `"both"` sendet an beide. Wenn das Ziel `"channel"` enthält, können Buttons nur von aufgelösten Genehmigenden verwendet werden.
  - `cleanupAfterResolve`: löscht bei `true` Genehmigungs-DMs nach Genehmigung, Ablehnung oder Timeout.

**Reaktionsbenachrichtigungsmodi:** `off` (keine), `own` (Nachrichten des Bots, Standard), `all` (alle Nachrichten), `allowlist` (aus `guilds.<id>.users` bei allen Nachrichten).

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
- Verwenden Sie `spaces/<spaceId>` oder `users/<userId>` für Zustellungsziele.
- `channels.googlechat.dangerouslyAllowNameMatching` reaktiviert mutable E-Mail-Principal-Abgleiche (Break-Glass-Kompatibilitätsmodus).

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
      unfurlLinks: false,
      unfurlMedia: false,
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
- **HTTP-Modus** erfordert `botToken` plus `signingSecret` (auf Root-Ebene oder pro Konto).
- `socketMode` reicht das Socket-Mode-Transport-Tuning des Slack SDK an die öffentliche Bolt-Receiver-API durch. Verwenden Sie es nur, wenn Sie Ping/Pong-Timeouts oder veraltetes Websocket-Verhalten untersuchen. `clientPingTimeout` ist standardmäßig `15000`; `serverPingTimeout` und `pingPongLoggingEnabled` werden nur durchgereicht, wenn sie konfiguriert sind.
- `botToken`, `appToken`, `signingSecret` und `userToken` akzeptieren Klartext-
  Strings oder SecretRef-Objekte.
- Slack-Konto-Snapshots stellen quell- und statusbezogene Felder pro Anmeldeinformation bereit, etwa
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` und im HTTP-Modus
  `signingSecretStatus`. `configured_unavailable` bedeutet, dass das Konto über
  SecretRef konfiguriert ist, der aktuelle Befehls-/Runtime-Pfad den Secret-Wert aber nicht
  auflösen konnte.
- `configWrites: false` blockiert von Slack initiierte Konfigurationsschreibvorgänge.
- Das optionale `channels.slack.defaultAccount` überschreibt die Standardkontoauswahl, wenn es mit einer konfigurierten Konto-ID übereinstimmt.
- `channels.slack.streaming.mode` ist der kanonische Schlüssel für den Slack-Stream-Modus. `channels.slack.streaming.nativeTransport` steuert Slacks nativen Streaming-Transport. Legacy-Werte `streamMode`, boolesches `streaming` und `nativeStreaming` bleiben Runtime-Aliasse; führen Sie `openclaw doctor --fix` aus, um persistierte Konfiguration umzuschreiben.
- `unfurlLinks` und `unfurlMedia` reichen Slacks `chat.postMessage`-Booleans für Link- und Medien-Unfurls bei Bot-Antworten durch. `unfurlLinks` ist standardmäßig `false`, damit ausgehende Bot-Links nicht inline expandieren, sofern dies nicht aktiviert ist; `unfurlMedia` wird ausgelassen, sofern es nicht konfiguriert ist. Setzen Sie einen der Werte unter `channels.slack.accounts.<accountId>`, um den Top-Level-Wert für ein Konto zu überschreiben.
- Verwenden Sie `user:<id>` (DM) oder `channel:<id>` für Zustellziele.

**Reaktionsbenachrichtigungsmodi:** `off`, `own` (Standard), `all`, `allowlist` (aus `reactionAllowlist`).

**Thread-Sitzungsisolation:** `thread.historyScope` gilt pro Thread (Standard) oder wird kanalweit geteilt. `thread.inheritParent` kopiert das Transkript des übergeordneten Kanals in neue Threads.

- Slack-natives Streaming plus der Slack-assistantartige Thread-Status „is typing...“ erfordern ein Antwort-Thread-Ziel. Top-Level-DMs bleiben standardmäßig außerhalb von Threads, sodass sie weiterhin über Slacks Entwurfs-Post-and-Edit-Vorschauen streamen können, statt die threadartige native Stream-/Statusvorschau anzuzeigen.
- `typingReaction` fügt der eingehenden Slack-Nachricht eine temporäre Reaktion hinzu, während eine Antwort läuft, und entfernt sie nach Abschluss. Verwenden Sie einen Slack-Emoji-Shortcode wie `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: Slack-native Zustellung über den Approval-Client und Autorisierung von Exec-Genehmigenden. Gleiches Schema wie Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (Slack-Benutzer-IDs), `agentFilter`, `sessionFilter` und `target` (`"dm"`, `"channel"` oder `"both"`). Plugin-Genehmigungen können diesen nativen Client-Pfad für aus Slack stammende Anfragen verwenden, wenn Slack-Plugin-Genehmigende aufgelöst werden; Slack-native Zustellung von Plugin-Genehmigungen kann auch über `approvals.plugin` für aus Slack stammende Sitzungen oder Slack-Ziele aktiviert werden. Plugin-Genehmigungen verwenden Slack-Plugin-Genehmigende aus `allowFrom` und Standard-Routing, nicht Exec-Genehmigende.

| Aktionsgruppe | Standard  | Hinweise                       |
| -------------- | --------- | ------------------------------ |
| reactions      | aktiviert | Reaktionen setzen + auflisten  |
| messages       | aktiviert | Lesen/senden/bearbeiten/löschen |
| pins           | aktiviert | Anheften/lösen/auflisten       |
| memberInfo     | aktiviert | Mitgliederinformationen        |
| emojiList      | aktiviert | Benutzerdefinierte Emoji-Liste |

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

Chat-Modi: `oncall` (Antwort bei @-Mention, Standard), `onmessage` (jede Nachricht), `onchar` (Nachrichten, die mit Trigger-Präfix beginnen).

Wenn native Mattermost-Befehle aktiviert sind:

- `commands.callbackPath` muss ein Pfad sein (zum Beispiel `/api/channels/mattermost/command`), keine vollständige URL.
- `commands.callbackUrl` muss zum OpenClaw-Gateway-Endpunkt auflösen und vom Mattermost-Server erreichbar sein.
- Native Slash-Callbacks werden mit den pro Befehl zurückgegebenen Tokens authentifiziert,
  die Mattermost während der Registrierung von Slash-Befehlen zurückgibt. Wenn die Registrierung fehlschlägt oder keine
  Befehle aktiviert werden, weist OpenClaw Callbacks mit
  `Unauthorized: invalid command token.`
  zurück.
- Für private/Tailnet/interne Callback-Hosts kann Mattermost verlangen, dass
  `ServiceSettings.AllowedUntrustedInternalConnections` den Callback-Host bzw. die Callback-Domain enthält.
  Verwenden Sie Host-/Domain-Werte, keine vollständigen URLs.
- `channels.mattermost.configWrites`: von Mattermost initiierte Konfigurationsschreibvorgänge erlauben oder verweigern.
- `channels.mattermost.requireMention`: `@mention` vor Antworten in Kanälen verlangen.
- `channels.mattermost.groups.<channelId>.requireMention`: kanalbezogener Override für Mention-Gating (`"*"` als Standard).
- Das optionale `channels.mattermost.defaultAccount` überschreibt die Standardkontoauswahl, wenn es mit einer konfigurierten Konto-ID übereinstimmt.

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

- `channels.signal.account`: Kanalstart an eine bestimmte Signal-Kontoidentität binden.
- `channels.signal.configWrites`: von Signal initiierte Konfigurationsschreibvorgänge erlauben oder verweigern.
- Das optionale `channels.signal.defaultAccount` überschreibt die Standardkontoauswahl, wenn es mit einer konfigurierten Konto-ID übereinstimmt.

### iMessage

OpenClaw startet `imsg rpc` (JSON-RPC über stdio). Kein Daemon und kein Port erforderlich. Dies ist der bevorzugte Pfad für neue OpenClaw-iMessage-Setups, wenn der Host Berechtigungen für die Messages-Datenbank und Automation gewähren kann.

BlueBubbles-Unterstützung wurde entfernt. `channels.bluebubbles` ist in aktuellem OpenClaw keine unterstützte Runtime-Konfigurationsoberfläche. Migrieren Sie alte Konfigurationen zu `channels.imessage`; verwenden Sie [Entfernung von BlueBubbles und der imsg-iMessage-Pfad](/de/announcements/bluebubbles-imessage) für die Kurzfassung und [Von BlueBubbles kommend](/de/channels/imessage-from-bluebubbles) für die vollständige Übersetzungstabelle.

Wenn das Gateway nicht auf dem angemeldeten Messages-Mac läuft, behalten Sie `channels.imessage.enabled=true` bei und setzen Sie `channels.imessage.cliPath` auf einen SSH-Wrapper, der `imsg "$@"` auf diesem Mac ausführt. Der standardmäßige lokale `imsg`-Pfad ist nur für macOS.

Bevor Sie sich bei Produktionssendungen auf einen SSH-Wrapper verlassen, verifizieren Sie ein ausgehendes `imsg send` über genau diesen Wrapper. Einige macOS-TCC-Zustände weisen Messages Automation `/usr/libexec/sshd-keygen-wrapper` zu, wodurch Lesevorgänge und Probes funktionieren können, während Sendungen mit AppleEvents `-1743` fehlschlagen; siehe [SSH-Wrapper-Sendungen schlagen mit AppleEvents -1743 fehl](/de/channels/imessage#ssh-wrapper-sends-fail-with-appleevents-1743).

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
      sendTransport: "auto",
      region: "US",
      actions: {
        reactions: true,
        edit: true,
        unsend: true,
        reply: true,
        sendWithEffect: true,
        sendAttachment: true,
      },
    },
  },
}
```

- Das optionale `channels.imessage.defaultAccount` überschreibt die Standardkontoauswahl, wenn es mit einer konfigurierten Konto-ID übereinstimmt.

- Erfordert Full Disk Access für die Messages-DB.
- Bevorzugen Sie `chat_id:<id>`-Ziele. Verwenden Sie `imsg chats --limit 20`, um Chats aufzulisten.
- `cliPath` kann auf einen SSH-Wrapper verweisen; setzen Sie `remoteHost` (`host` oder `user@host`) für das Abrufen von Anhängen per SCP.
- `attachmentRoots` und `remoteAttachmentRoots` beschränken eingehende Anhangspfade (Standard: `/Users/*/Library/Messages/Attachments`).
- SCP verwendet strikte Host-Key-Prüfung; stellen Sie daher sicher, dass der Relay-Host-Key bereits in `~/.ssh/known_hosts` vorhanden ist.
- `channels.imessage.configWrites`: von iMessage initiierte Konfigurationsschreibvorgänge erlauben oder verweigern.
- `channels.imessage.sendTransport`: bevorzugter `imsg`-RPC-Sendetransport für normale ausgehende Antworten. `auto` (Standard) verwendet die IMCore-Bridge für vorhandene Chats, wenn sie läuft, und fällt dann auf AppleScript zurück; `bridge` erfordert Private-API-Zustellung; `applescript` erzwingt den öffentlichen Messages-Automation-Pfad.
- `channels.imessage.actions.*`: Private-API-Aktionen aktivieren, die zusätzlich durch `imsg status` / `openclaw channels status --probe` geschützt sind.
- `channels.imessage.includeAttachments` ist standardmäßig aus; setzen Sie es auf `true`, bevor Sie eingehende Medien in Agent-Turns erwarten.
- Die eingehende Wiederherstellung nach einem Bridge-/Gateway-Neustart erfolgt automatisch (GUID-Dedupe plus Altersgrenze für veralteten Backlog). Vorhandene Konfigurationen mit `channels.imessage.catchup.enabled: true` werden weiterhin als veraltetes Kompatibilitätsprofil berücksichtigt.
- `channels.imessage.groups`: Gruppenregistrierung und Einstellungen pro Gruppe. Konfigurieren Sie bei `groupPolicy: "allowlist"` entweder explizite `chat_id`-Schlüssel oder einen `"*"`-Wildcard-Eintrag, damit Gruppennachrichten das Registry-Gate passieren können.
- Top-Level-`bindings[]`-Einträge mit `type: "acp"` können iMessage-Unterhaltungen an persistente ACP-Sitzungen binden. Verwenden Sie einen normalisierten Handle oder ein explizites Chat-Ziel (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) in `match.peer.id`. Gemeinsame Feldsemantik: [ACP-Agenten](/de/tools/acp-agents#persistent-channel-bindings).

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

- Token-Authentifizierung verwendet `accessToken`; Passwort-Authentifizierung verwendet `userId` + `password`.
- `channels.matrix.proxy` leitet Matrix-HTTP-Traffic über einen expliziten HTTP(S)-Proxy. Benannte Konten können dies mit `channels.matrix.accounts.<id>.proxy` überschreiben.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` erlaubt private/interne Homeserver. `proxy` und diese Netzwerk-Opt-in-Einstellung sind unabhängige Steuerelemente.
- `channels.matrix.defaultAccount` wählt das bevorzugte Konto in Multi-Account-Setups aus.
- `channels.matrix.autoJoin` ist standardmäßig `off`, sodass eingeladene Räume und neue DM-artige Einladungen ignoriert werden, bis Sie `autoJoin: "allowlist"` mit `autoJoinAllowlist` oder `autoJoin: "always"` festlegen.
- `channels.matrix.execApprovals`: Matrix-native Zustellung von Ausführungsgenehmigungen und Autorisierung von Genehmigern.
  - `enabled`: `true`, `false` oder `"auto"` (Standard). Im Auto-Modus werden Ausführungsgenehmigungen aktiviert, wenn Genehmiger aus `approvers` oder `commands.ownerAllowFrom` aufgelöst werden können.
  - `approvers`: Matrix-Benutzer-IDs (z. B. `@owner:example.org`), die Ausführungsanfragen genehmigen dürfen.
  - `agentFilter`: optionale Agent-ID-Allowlist. Weglassen, um Genehmigungen für alle Agents weiterzuleiten.
  - `sessionFilter`: optionale Sitzungsschlüssel-Muster (Teilzeichenfolge oder Regex).
  - `target`: wohin Genehmigungsaufforderungen gesendet werden. `"dm"` (Standard), `"channel"` (Ursprungsraum) oder `"both"`.
  - Überschreibungen pro Konto: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` steuert, wie Matrix-DMs zu Sitzungen gruppiert werden: `per-user` (Standard) teilt nach geroutetem Peer, während `per-room` jeden DM-Raum isoliert.
- Matrix-Statusprüfungen und Live-Verzeichnisabfragen verwenden dieselbe Proxy-Richtlinie wie Runtime-Traffic.
- Die vollständige Matrix-Konfiguration, Zielregeln und Setup-Beispiele sind in [Matrix](/de/channels/matrix) dokumentiert.

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
- Optionales `channels.irc.defaultAccount` überschreibt die Standard-Kontoauswahl, wenn es mit einer konfigurierten Konto-ID übereinstimmt.
- Die vollständige IRC-Kanalkonfiguration (Host/Port/TLS/Kanäle/Allowlists/Mention-Gating) ist in [IRC](/de/channels/irc) dokumentiert.

### Multi-Account (alle Kanäle)

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

- `default` wird verwendet, wenn `accountId` ausgelassen wird (CLI + Routing).
- Env-Tokens gelten nur für das **Standard**-Konto.
- Basis-Kanaleinstellungen gelten für alle Konten, sofern sie nicht pro Konto überschrieben werden.
- Verwenden Sie `bindings[].match.accountId`, um jedes Konto an einen anderen Agent zu routen.
- Wenn Sie über `openclaw channels add` (oder Kanal-Onboarding) ein Nicht-Standard-Konto hinzufügen, während noch eine Single-Account-Kanalkonfiguration auf oberster Ebene verwendet wird, verschiebt OpenClaw zuerst kontospezifische Single-Account-Werte der obersten Ebene in die Konto-Map des Kanals, damit das ursprüngliche Konto weiter funktioniert. Die meisten Kanäle verschieben sie nach `channels.<channel>.accounts.default`; Matrix kann stattdessen ein vorhandenes passendes benanntes/Standard-Ziel beibehalten.
- Vorhandene kanalbezogene Bindings (ohne `accountId`) passen weiterhin zum Standardkonto; kontospezifische Bindings bleiben optional.
- `openclaw doctor --fix` repariert auch gemischte Formen, indem kontospezifische Single-Account-Werte der obersten Ebene in das für diesen Kanal ausgewählte hochgestufte Konto verschoben werden. Die meisten Kanäle verwenden `accounts.default`; Matrix kann stattdessen ein vorhandenes passendes benanntes/Standard-Ziel beibehalten.

### Andere Plugin-Kanäle

Viele Plugin-Kanäle werden als `channels.<id>` konfiguriert und auf ihren jeweiligen Kanalseiten dokumentiert (zum Beispiel Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat und Twitch).
Siehe den vollständigen Kanalindex: [Kanäle](/de/channels).

### Mention-Gating für Gruppenchats

Gruppennachrichten erfordern standardmäßig eine **Mention** (Metadaten-Mention oder sichere Regex-Muster). Gilt für WhatsApp-, Telegram-, Discord-, Google Chat- und iMessage-Gruppenchats.

Sichtbare Antworten werden separat gesteuert. Normale Gruppen-, Kanal- und interne WebChat-Direktanfragen verwenden standardmäßig automatische finale Zustellung: Finaler Assistant-Text wird über den bisherigen sichtbaren Antwortpfad gepostet. Aktivieren Sie `messages.visibleReplies: "message_tool"` oder `messages.groupChat.visibleReplies: "message_tool"`, wenn sichtbare Ausgabe nur gepostet werden soll, nachdem der Agent `message(action=send)` aufgerufen hat. Wenn das Modell finalen Text zurückgibt, ohne das Nachrichten-Tool in einem aktivierten Nur-Tool-Modus aufzurufen, bleibt dieser finale Text privat und das ausführliche Gateway-Log zeichnet unterdrückte Payload-Metadaten auf.

Nur-Tool-sichtbare Antworten erfordern ein Modell/eine Runtime, das bzw. die zuverlässig Tools aufruft, und werden für gemeinsam genutzte Umgebungsräume auf Modellen der neuesten Generation wie GPT 5.5 empfohlen. Einige schwächere Modelle können finalen Text beantworten, verstehen aber nicht, dass quellensichtbare Ausgabe mit `message(action=send)` gesendet werden muss. Verwenden Sie für diese Modelle `"automatic"`, damit der finale Assistant-Turn der sichtbare Antwortpfad ist. Wenn das Sitzungslog Assistant-Text mit `didSendViaMessagingTool: false` zeigt, hat das Modell privaten finalen Text erzeugt, statt das Nachrichten-Tool aufzurufen. Wechseln Sie für diesen Kanal zu einem stärkeren Tool-aufrufenden Modell, prüfen Sie das ausführliche Gateway-Log auf die Zusammenfassung der unterdrückten Payload oder setzen Sie `messages.groupChat.visibleReplies: "automatic"`, um sichtbare finale Antworten für jede Gruppen-/Kanalanfrage zu verwenden.

Wenn das Nachrichten-Tool unter der aktiven Tool-Richtlinie nicht verfügbar ist, fällt OpenClaw auf automatische sichtbare Antworten zurück, statt die Antwort stillschweigend zu unterdrücken. `openclaw doctor` warnt vor dieser Diskrepanz.

Diese Regel gilt für normalen finalen Agent-Text. Plugin-eigene Konversations-Bindings verwenden die vom besitzenden Plugin zurückgegebene Antwort als sichtbare Antwort für beanspruchte Turns gebundener Threads; das Plugin muss für diese Binding-Antworten nicht `message(action=send)` aufrufen.

**Fehlerbehebung: Gruppen-@Mention löst Tippen aus, dann Stille (kein Fehler)**

Symptom: Eine Gruppen-/Kanal-@Mention zeigt den Tippindikator und das Gateway-Log meldet `dispatch complete (queuedFinal=false, replies=0)`, aber im Raum kommt keine Nachricht an. DMs an denselben Agent antworten normal.

Ursache: Der sichtbare Antwortmodus für Gruppe/Kanal wird zu `"message_tool"` aufgelöst, sodass OpenClaw den Turn ausführt, den finalen Assistant-Text aber unterdrückt, sofern der Agent nicht `message(action=send)` aufruft. In diesem Modus gibt es keinen `NO_REPLY`-Vertrag; kein Nachrichten-Tool-Aufruf bedeutet keine Quellenantwort. Es gibt keinen Fehler, weil die Unterdrückung das konfigurierte Verhalten ist. Normale Gruppen- und Kanal-Turns verwenden standardmäßig `"automatic"`, daher tritt dieses Symptom nur auf, wenn `messages.groupChat.visibleReplies` (oder global `messages.visibleReplies`) explizit auf `"message_tool"` gesetzt ist. Harness `defaultVisibleReplies` gilt hier nicht — der Gruppen-/Kanal-Resolver ignoriert es; es betrifft nur Direkt-/Quellchats (das Codex-Harness unterdrückt finale Direktchat-Antworten auf diese Weise).

Behebung: Wählen Sie entweder ein stärkeres Tool-aufrufendes Modell, entfernen Sie die explizite `"message_tool"`-Überschreibung, um auf den Standard `"automatic"` zurückzufallen, oder setzen Sie `messages.groupChat.visibleReplies: "automatic"`, um sichtbare Antworten für jede Gruppen-/Kanalanfrage zu erzwingen. Das Gateway lädt die `messages`-Konfiguration per Hot-Reload neu, nachdem die Datei gespeichert wurde; starten Sie das Gateway nur neu, wenn Dateiüberwachung oder Konfigurationsneuladen in der Bereitstellung deaktiviert ist.

**Mention-Typen:**

- **Metadaten-Mentions**: Native Plattform-@Mentions. Im WhatsApp-Self-Chat-Modus ignoriert.
- **Textmuster**: Sichere Regex-Muster in `agents.list[].groupChat.mentionPatterns`. Ungültige Muster und unsichere verschachtelte Wiederholungen werden ignoriert.
- Mention-Gating wird nur erzwungen, wenn Erkennung möglich ist (native Mentions oder mindestens ein Muster).

```json5
{
  messages: {
    visibleReplies: "automatic", // force old automatic final replies for direct/source chats
    groupChat: {
      historyLimit: 50,
      unmentionedInbound: "room_event", // always-on unmentioned room chatter becomes quiet context
      visibleReplies: "message_tool", // opt-in; require message(action=send) for visible room replies
    },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` legt den globalen Standard fest. Kanäle können dies mit `channels.<channel>.historyLimit` (oder pro Konto) überschreiben. Setzen Sie `0`, um es zu deaktivieren.

`messages.groupChat.unmentionedInbound: "room_event"` übermittelt nicht erwähnte, dauerhaft aktive Gruppen-/Kanalnachrichten auf unterstützten Kanälen als stillen Raumkontext. Erwähnte Nachrichten, Befehle und Direktnachrichten bleiben Benutzeranfragen. Siehe [Umgebungs-Raumereignisse](/de/channels/ambient-room-events) für vollständige Beispiele zu Discord, Slack und Telegram.

`messages.visibleReplies` ist der globale Standard für Quellereignisse; `messages.groupChat.visibleReplies` überschreibt ihn für Gruppen-/Kanal-Quellereignisse. Wenn `messages.visibleReplies` nicht gesetzt ist, verwenden Direkt-/Quellchats den ausgewählten Runtime- oder Harness-Standard, aber interne WebChat-Direkt-Turns verwenden automatische finale Zustellung für Pi-/Codex-Prompt-Parität. Setzen Sie `messages.visibleReplies: "message_tool"`, um absichtlich `message(action=send)` für sichtbare Ausgabe zu verlangen. Kanal-Allowlists und Mention-Gating entscheiden weiterhin, ob ein Ereignis verarbeitet wird.

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

Auflösung: Überschreibung pro DM → Provider-Standard → kein Limit (alles beibehalten).

Unterstützt: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### Self-Chat-Modus

Fügen Sie Ihre eigene Nummer in `allowFrom` ein, um den Self-Chat-Modus zu aktivieren (ignoriert native @Mentions, antwortet nur auf Textmuster):

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

- Dieser Block konfiguriert Befehlsoberflächen. Den aktuellen integrierten + gebündelten Befehlskatalog finden Sie unter [Slash-Befehle](/de/tools/slash-commands).
- Diese Seite ist eine **Referenz für Konfigurationsschlüssel**, nicht der vollständige Befehlskatalog. Von Kanälen/Plugins verwaltete Befehle wie QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, Gerätekopplung `/pair`, Memory `/dreaming`, Telefonsteuerung `/phone` und Talk `/voice` sind auf ihren Kanal-/Plugin-Seiten sowie unter [Slash-Befehle](/de/tools/slash-commands) dokumentiert.
- Textbefehle müssen **eigenständige** Nachrichten mit führendem `/` sein.
- `native: "auto"` aktiviert native Befehle für Discord/Telegram und lässt Slack deaktiviert.
- `nativeSkills: "auto"` aktiviert native Skills-Befehle für Discord/Telegram und lässt Slack deaktiviert.
- Pro Kanal überschreiben: `channels.discord.commands.native` (bool oder `"auto"`). Für Discord überspringt `false` die Registrierung und Bereinigung nativer Befehle während des Starts.
- Überschreiben Sie die Registrierung nativer Skills pro Kanal mit `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` fügt zusätzliche Telegram-Bot-Menüeinträge hinzu.
- `bash: true` aktiviert `! <cmd>` für die Host-Shell. Erfordert `tools.elevated.enabled` und Absender in `tools.elevated.allowFrom.<channel>`.
- `config: true` aktiviert `/config` (liest/schreibt `openclaw.json`). Für Gateway-`chat.send`-Clients erfordern persistente `/config set|unset`-Schreibvorgänge außerdem `operator.admin`; schreibgeschütztes `/config show` bleibt für normale Operator-Clients mit Schreibbereich verfügbar.
- `mcp: true` aktiviert `/mcp` für von OpenClaw verwaltete MCP-Serverkonfiguration unter `mcp.servers`.
- `plugins: true` aktiviert `/plugins` für Plugin-Erkennung, Installation und Aktivieren/Deaktivieren-Steuerungen.
- `channels.<provider>.configWrites` steuert Konfigurationsänderungen pro Kanal (Standard: true).
- Bei Multi-Account-Kanälen steuert `channels.<provider>.accounts.<id>.configWrites` auch Schreibvorgänge, die auf dieses Konto zielen (zum Beispiel `/allowlist --config --account <id>` oder `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` deaktiviert `/restart` und Gateway-Neustart-Toolaktionen. Standard: `true`.
- `ownerAllowFrom` ist die explizite Owner-Allowlist für nur Ownern vorbehaltene Befehle und Owner-gesteuerte Kanalaktionen. Sie ist von `allowFrom` getrennt.
- `ownerDisplay: "hash"` hasht Owner-IDs im System-Prompt. Legen Sie `ownerDisplaySecret` fest, um das Hashing zu steuern.
- `allowFrom` ist pro Provider. Wenn gesetzt, ist es die **einzige** Autorisierungsquelle (Kanal-Allowlists/Kopplung und `useAccessGroups` werden ignoriert).
- `useAccessGroups: false` erlaubt Befehlen, Access-Group-Richtlinien zu umgehen, wenn `allowFrom` nicht gesetzt ist.
- Zuordnung der Befehlsdokumentation:
  - integrierter + gebündelter Katalog: [Slash-Befehle](/de/tools/slash-commands)
  - kanalspezifische Befehlsoberflächen: [Kanäle](/de/channels)
  - QQ Bot-Befehle: [QQ Bot](/de/channels/qqbot)
  - Kopplungsbefehle: [Kopplung](/de/channels/pairing)
  - LINE-Kartenbefehl: [LINE](/de/channels/line)
  - Memory-Dreaming: [Dreaming](/de/concepts/dreaming)

</Accordion>

---

## Verwandt

- [Konfigurationsreferenz](/de/gateway/configuration-reference) — Schlüssel der obersten Ebene
- [Konfiguration — Agenten](/de/gateway/config-agents)
- [Kanalübersicht](/de/channels)
