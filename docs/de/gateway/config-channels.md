---
read_when:
    - Konfigurieren eines Kanal-Plugins (Authentifizierung, Zugriffskontrolle, Mehrkontenbetrieb)
    - Fehlerbehebung für kanalspezifische Konfigurationsschlüssel
    - Auditieren von DM-Richtlinien, Gruppenrichtlinien oder Erwähnungs-Gating
summary: 'Kanalkonfiguration: Zugriffskontrolle, Kopplung und Schlüssel pro Kanal für Slack, Discord, Telegram, WhatsApp, Matrix, iMessage und weitere'
title: Konfiguration — Kanäle
x-i18n:
    generated_at: "2026-05-01T06:41:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: ce1571d51e026182d49b935780a986780a90b05afc0acca027b2541b80a1aac2
    source_path: gateway/config-channels.md
    workflow: 16
---

Konfigurationsschlüssel pro Kanal unter `channels.*`. Deckt DM- und Gruppenzugriff,
Multi-Account-Setups, Mention-Gating und kanalbezogene Schlüssel für Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage und die anderen gebündelten Kanal-Plugins ab.

Für Agents, Tools, Gateway-Laufzeit und andere Schlüssel auf oberster Ebene siehe
[Konfigurationsreferenz](/de/gateway/configuration-reference).

## Kanäle

Jeder Kanal startet automatisch, wenn sein Konfigurationsabschnitt existiert, außer `enabled: false` ist gesetzt.

### DM- und Gruppenzugriff

Alle Kanäle unterstützen DM-Richtlinien und Gruppenrichtlinien:

| DM-Richtlinie      | Verhalten                                                                    |
| ------------------ | ---------------------------------------------------------------------------- |
| `pairing` (Standard) | Unbekannte Absender erhalten einen einmaligen Pairing-Code; der Owner muss zustimmen |
| `allowlist`        | Nur Absender in `allowFrom` oder im gekoppelten Allow-Store                  |
| `open`             | Alle eingehenden DMs erlauben; erfordert `allowFrom: ["*"]`                  |
| `disabled`         | Alle eingehenden DMs ignorieren                                              |

| Gruppenrichtlinie    | Verhalten                                                  |
| -------------------- | ---------------------------------------------------------- |
| `allowlist` (Standard) | Nur Gruppen, die der konfigurierten Allowlist entsprechen |
| `open`               | Gruppen-Allowlists umgehen; Mention-Gating gilt weiterhin |
| `disabled`           | Alle Gruppen-/Raumnachrichten blockieren                  |

<Note>
`channels.defaults.groupPolicy` legt den Standard fest, wenn `groupPolicy` eines Providers nicht gesetzt ist.
Pairing-Codes laufen nach 1 Stunde ab. Ausstehende DM-Pairing-Anfragen sind auf **3 pro Kanal** begrenzt.
Wenn ein Provider-Block vollständig fehlt (`channels.<provider>` fehlt), fällt die Gruppenrichtlinie zur Laufzeit mit einer Startwarnung auf `allowlist` (fail-closed) zurück.
</Note>

### Modellüberschreibungen pro Kanal

Verwenden Sie `channels.modelByChannel`, um bestimmte Kanal-IDs an ein Modell zu binden. Werte akzeptieren `provider/model` oder konfigurierte Modellaliase. Die Kanalzuordnung greift, wenn eine Sitzung nicht bereits eine Modellüberschreibung hat, zum Beispiel über `/model` gesetzt.

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

Verwenden Sie `channels.defaults` für gemeinsame Gruppenrichtlinien- und Heartbeat-Einstellungen über Provider hinweg:

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
- `channels.defaults.contextVisibility`: Standardmodus für die Sichtbarkeit von zusätzlichem Kontext für alle Kanäle. Werte: `all` (Standard, gesamten Kontext aus Zitaten/Threads/Verlauf einbeziehen), `allowlist` (nur Kontext von Absendern aus der Allowlist einbeziehen), `allowlist_quote` (wie Allowlist, aber expliziten Zitat-/Antwortkontext beibehalten). Überschreibung pro Kanal: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: Gesunde Kanalstatus in die Heartbeat-Ausgabe einbeziehen.
- `channels.defaults.heartbeat.showAlerts`: Herabgestufte/fehlerhafte Status in die Heartbeat-Ausgabe einbeziehen.
- `channels.defaults.heartbeat.useIndicator`: Kompakte Heartbeat-Ausgabe im Indikatorstil rendern.

### WhatsApp

WhatsApp läuft über den Webkanal des Gateways (Baileys Web). Es startet automatisch, wenn eine verknüpfte Sitzung existiert.

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
- Das optionale `channels.whatsapp.defaultAccount` überschreibt diese Fallback-Auswahl des Standardkontos, wenn es mit einer konfigurierten Konto-ID übereinstimmt.
- Das alte Baileys-Auth-Verzeichnis für Einzelkonten wird von `openclaw doctor` nach `whatsapp/default` migriert.
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
- `apiRoot` ist nur der Root der Telegram Bot API. Verwenden Sie `https://api.telegram.org` oder Ihren selbst gehosteten/Proxy-Root, nicht `https://api.telegram.org/bot<TOKEN>`; `openclaw doctor --fix` entfernt ein versehentlich angehängtes Suffix `/bot<TOKEN>`.
- Das optionale `channels.telegram.defaultAccount` überschreibt die Auswahl des Standardkontos, wenn es mit einer konfigurierten Konto-ID übereinstimmt.
- In Multi-Account-Setups (2+ Konto-IDs) setzen Sie einen expliziten Standard (`channels.telegram.defaultAccount` oder `channels.telegram.accounts.default`), um Fallback-Routing zu vermeiden; `openclaw doctor` warnt, wenn dies fehlt oder ungültig ist.
- `configWrites: false` blockiert von Telegram ausgelöste Konfigurationsschreibvorgänge (Supergroup-ID-Migrationen, `/config set|unset`).
- Einträge auf oberster Ebene in `bindings[]` mit `type: "acp"` konfigurieren persistente ACP-Bindings für Forenthemen (verwenden Sie das kanonische `chatId:topic:topicId` in `match.peer.id`). Die Feldsemantik wird in [ACP-Agents](/de/tools/acp-agents#channel-specific-settings) gemeinsam beschrieben.
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

- Token: `channels.discord.token`, mit `DISCORD_BOT_TOKEN` als Fallback fuer das Standardkonto.
- Direkte ausgehende Aufrufe, die ein explizites Discord-`token` bereitstellen, verwenden dieses Token fuer den Aufruf; Einstellungen fuer Kontowiederholung und Richtlinien stammen weiterhin aus dem ausgewaehlten Konto im aktiven Runtime-Snapshot.
- Optionales `channels.discord.defaultAccount` ueberschreibt die Auswahl des Standardkontos, wenn es mit einer konfigurierten Konto-ID uebereinstimmt.
- Verwenden Sie `user:<id>` (DM) oder `channel:<id>` (Guild-Kanal) fuer Zustellziele; reine numerische IDs werden abgelehnt.
- Guild-Slugs sind kleingeschrieben und Leerzeichen werden durch `-` ersetzt; Kanalschluessel verwenden den gesluggten Namen (ohne `#`). Bevorzugen Sie Guild-IDs.
- Von Bots verfasste Nachrichten werden standardmaessig ignoriert. `allowBots: true` aktiviert sie; verwenden Sie `allowBots: "mentions"`, um nur Bot-Nachrichten zu akzeptieren, die den Bot erwaehnen (eigene Nachrichten werden weiterhin gefiltert).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (und Kanal-Ueberschreibungen) verwirft Nachrichten, die einen anderen Benutzer oder eine Rolle erwaehnen, aber nicht den Bot (ausgenommen @everyone/@here).
- `maxLinesPerMessage` (Standard 17) teilt hohe Nachrichten auch dann auf, wenn sie unter 2000 Zeichen liegen.
- `channels.discord.threadBindings` steuert Discord-threadgebundenes Routing:
  - `enabled`: Discord-Ueberschreibung fuer threadgebundene Sitzungsfunktionen (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` sowie gebundene Zustellung/Routing)
  - `idleHours`: Discord-Ueberschreibung fuer automatisches Unfocus bei Inaktivitaet in Stunden (`0` deaktiviert)
  - `maxAgeHours`: Discord-Ueberschreibung fuer das harte Hoechstalter in Stunden (`0` deaktiviert)
  - `spawnSubagentSessions`: Opt-in-Schalter fuer automatische Thread-Erstellung/-Bindung durch `sessions_spawn({ thread: true })`
- Eintraege in `bindings[]` auf oberster Ebene mit `type: "acp"` konfigurieren persistente ACP-Bindungen fuer Kanaele und Threads (Kanal-/Thread-ID in `match.peer.id` verwenden). Feldsemantik wird in [ACP-Agenten](/de/tools/acp-agents#channel-specific-settings) gemeinsam genutzt.
- `channels.discord.ui.components.accentColor` legt die Akzentfarbe fuer Discord-Komponenten-v2-Container fest.
- `channels.discord.voice` aktiviert Discord-Sprachkanal-Unterhaltungen und optionale Ueberschreibungen fuer automatischen Beitritt, LLM und TTS.
- `channels.discord.voice.model` ueberschreibt optional das LLM-Modell, das fuer Discord-Sprachkanal-Antworten verwendet wird.
- `channels.discord.voice.daveEncryption` und `channels.discord.voice.decryptionFailureTolerance` werden an die DAVE-Optionen von `@discordjs/voice` durchgereicht (standardmaessig `true` und `24`).
- OpenClaw versucht zusaetzlich eine Wiederherstellung des Sprachempfangs, indem eine Sprachsitzung nach wiederholten Entschluesselungsfehlern verlassen und erneut betreten wird.
- `channels.discord.streaming` ist der kanonische Schluessel fuer den Stream-Modus. Alte `streamMode`- und boolesche `streaming`-Werte werden automatisch migriert.
- `channels.discord.autoPresence` ordnet Runtime-Verfuegbarkeit der Bot-Praesenz zu (healthy => online, degraded => idle, exhausted => dnd) und erlaubt optionale Ueberschreibungen des Statustexts.
- `channels.discord.dangerouslyAllowNameMatching` aktiviert veraenderliches Namens-/Tag-Matching wieder (Break-Glass-Kompatibilitaetsmodus).
- `channels.discord.execApprovals`: Discord-native Zustellung von Exec-Genehmigungen und Autorisierung von Genehmigern.
  - `enabled`: `true`, `false` oder `"auto"` (Standard). Im Auto-Modus werden Exec-Genehmigungen aktiviert, wenn Genehmiger aus `approvers` oder `commands.ownerAllowFrom` aufgeloest werden koennen.
  - `approvers`: Discord-Benutzer-IDs, die Exec-Anfragen genehmigen duerfen. Faellt bei Auslassung auf `commands.ownerAllowFrom` zurueck.
  - `agentFilter`: optionale Allowlist fuer Agent-IDs. Auslassen, um Genehmigungen fuer alle Agenten weiterzuleiten.
  - `sessionFilter`: optionale Sitzungsschluesselmuster (Teilzeichenfolge oder Regex).
  - `target`: wohin Genehmigungsaufforderungen gesendet werden. `"dm"` (Standard) sendet an DMs der Genehmiger, `"channel"` sendet an den Ursprungskanal, `"both"` sendet an beide. Wenn das Ziel `"channel"` enthaelt, koennen Buttons nur von aufgeloesten Genehmigern verwendet werden.
  - `cleanupAfterResolve`: loescht bei `true` Genehmigungs-DMs nach Genehmigung, Ablehnung oder Timeout.

**Reaktionsbenachrichtigungsmodi:** `off` (keine), `own` (Nachrichten des Bots, Standard), `all` (alle Nachrichten), `allowlist` (aus `guilds.<id>.users` fuer alle Nachrichten).

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
- Dienstkonto-SecretRef wird ebenfalls unterstuetzt (`serviceAccountRef`).
- Env-Fallbacks: `GOOGLE_CHAT_SERVICE_ACCOUNT` oder `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- Verwenden Sie `spaces/<spaceId>` oder `users/<userId>` fuer Zustellziele.
- `channels.googlechat.dangerouslyAllowNameMatching` aktiviert veraenderliches E-Mail-Principal-Matching wieder (Break-Glass-Kompatibilitaetsmodus).

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

- **Socket-Modus** erfordert sowohl `botToken` als auch `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` als Env-Fallback fuer das Standardkonto).
- **HTTP-Modus** erfordert `botToken` plus `signingSecret` (auf Root-Ebene oder pro Konto).
- `socketMode` reicht die Transportabstimmung des Slack-SDK-Socket-Modus an die oeffentliche Bolt-Receiver-API durch. Verwenden Sie dies nur, wenn Sie Ping/Pong-Timeouts oder veraltetes Websocket-Verhalten untersuchen.
- `botToken`, `appToken`, `signingSecret` und `userToken` akzeptieren Klartextzeichenfolgen oder SecretRef-Objekte.
- Slack-Konto-Snapshots stellen quell-/statusbezogene Felder pro Anmeldedaten bereit, etwa `botTokenSource`, `botTokenStatus`, `appTokenStatus` und im HTTP-Modus `signingSecretStatus`. `configured_unavailable` bedeutet, dass das Konto ueber SecretRef konfiguriert ist, der aktuelle Befehls-/Runtime-Pfad den Secret-Wert jedoch nicht aufloesen konnte.
- `configWrites: false` blockiert von Slack initiierte Konfigurationsschreibvorgaenge.
- Optionales `channels.slack.defaultAccount` ueberschreibt die Auswahl des Standardkontos, wenn es mit einer konfigurierten Konto-ID uebereinstimmt.
- `channels.slack.streaming.mode` ist der kanonische Schluessel fuer den Slack-Stream-Modus. `channels.slack.streaming.nativeTransport` steuert Slacks nativen Streaming-Transport. Alte `streamMode`-, boolesche `streaming`- und `nativeStreaming`-Werte werden automatisch migriert.
- Verwenden Sie `user:<id>` (DM) oder `channel:<id>` fuer Zustellziele.

**Reaktionsbenachrichtigungsmodi:** `off`, `own` (Standard), `all`, `allowlist` (aus `reactionAllowlist`).

**Thread-Sitzungsisolation:** `thread.historyScope` ist pro Thread (Standard) oder kanalweit geteilt. `thread.inheritParent` kopiert das Transkript des uebergeordneten Kanals in neue Threads.

- Slack-natives Streaming plus der Slack-Assistenten-artige Thread-Status „is typing...“ erfordern ein Antwort-Thread-Ziel. DMs auf oberster Ebene bleiben standardmaessig ausserhalb von Threads, daher verwenden sie stattdessen `typingReaction` oder normale Zustellung anstelle der threadartigen Vorschau.
- `typingReaction` fuegt der eingehenden Slack-Nachricht voruebergehend eine Reaktion hinzu, waehrend eine Antwort laeuft, und entfernt sie nach Abschluss. Verwenden Sie einen Slack-Emoji-Shortcode wie `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: Slack-native Zustellung von Exec-Genehmigungen und Autorisierung von Genehmigern. Gleiches Schema wie Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (Slack-Benutzer-IDs), `agentFilter`, `sessionFilter` und `target` (`"dm"`, `"channel"` oder `"both"`).

| Aktionsgruppe | Standard  | Hinweise                    |
| ------------- | --------- | --------------------------- |
| reactions     | aktiviert | Reaktionen + Reaktionen auflisten |
| messages      | aktiviert | Lesen/senden/bearbeiten/loeschen |
| pins          | aktiviert | Anheften/loesen/auflisten   |
| memberInfo    | aktiviert | Mitgliedsinformationen      |
| emojiList     | aktiviert | Benutzerdefinierte Emoji-Liste |

### Mattermost

Mattermost wird in aktuellen OpenClaw-Releases als gebuendeltes Plugin ausgeliefert. Aeltere oder benutzerdefinierte Builds koennen ein aktuelles npm-Paket mit `openclaw plugins install @openclaw/mattermost` installieren; wenn npm meldet, dass das OpenClaw-eigene Paket veraltet ist, verwenden Sie das gebuendelte Plugin oder einen lokalen Checkout, bis ein neueres npm-Paket veroeffentlicht wird.

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

Chat-Modi: `oncall` (Antwort auf @-Erwaehnung, Standard), `onmessage` (jede Nachricht), `onchar` (Nachrichten, die mit einem Ausloesepraefix beginnen).

Wenn native Mattermost-Befehle aktiviert sind:

- `commands.callbackPath` muss ein Pfad sein (zum Beispiel `/api/channels/mattermost/command`), keine vollstaendige URL.
- `commands.callbackUrl` muss zum OpenClaw-Gateway-Endpunkt aufloesen und vom Mattermost-Server erreichbar sein.
- Native Slash-Callbacks werden mit den befehlsspezifischen Tokens authentifiziert, die Mattermost waehrend der Registrierung von Slash-Befehlen zurueckgibt. Wenn die Registrierung fehlschlaegt oder keine Befehle aktiviert werden, lehnt OpenClaw Callbacks mit `Unauthorized: invalid command token.` ab.
- Fuer private/Tailnet-/interne Callback-Hosts kann Mattermost erfordern, dass `ServiceSettings.AllowedUntrustedInternalConnections` den Callback-Host/die Callback-Domain enthaelt. Verwenden Sie Host-/Domain-Werte, keine vollstaendigen URLs.
- `channels.mattermost.configWrites`: von Mattermost initiierte Konfigurationsschreibvorgaenge erlauben oder verweigern.
- `channels.mattermost.requireMention`: `@mention` vor Antworten in Kanaelen verlangen.
- `channels.mattermost.groups.<channelId>.requireMention`: Ueberschreibung der Erwaehnungssteuerung pro Kanal (`"*"` fuer Standard).
- Optionales `channels.mattermost.defaultAccount` ueberschreibt die Auswahl des Standardkontos, wenn es mit einer konfigurierten Konto-ID uebereinstimmt.

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
- Optionales `channels.signal.defaultAccount` überschreibt die standardmäßige Kontoauswahl, wenn es mit einer konfigurierten Konto-ID übereinstimmt.

### BlueBubbles

BlueBubbles ist der empfohlene iMessage-Pfad (Plugin-gestützt, unter `channels.bluebubbles` konfiguriert).

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
- Optionales `channels.bluebubbles.defaultAccount` überschreibt die standardmäßige Kontoauswahl, wenn es mit einer konfigurierten Konto-ID übereinstimmt.
- Einträge in `bindings[]` auf oberster Ebene mit `type: "acp"` können BlueBubbles-Unterhaltungen an persistente ACP-Sitzungen binden. Verwenden Sie ein BlueBubbles-Handle oder eine Zielzeichenfolge (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) in `match.peer.id`. Semantik gemeinsamer Felder: [ACP-Agenten](/de/tools/acp-agents#channel-specific-settings).
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

- Optionales `channels.imessage.defaultAccount` überschreibt die standardmäßige Kontoauswahl, wenn es mit einer konfigurierten Konto-ID übereinstimmt.

- Erfordert vollständigen Festplattenzugriff auf die Messages-Datenbank.
- Bevorzugen Sie `chat_id:<id>`-Ziele. Verwenden Sie `imsg chats --limit 20`, um Chats aufzulisten.
- `cliPath` kann auf einen SSH-Wrapper verweisen; setzen Sie `remoteHost` (`host` oder `user@host`) für den SCP-Abruf von Anhängen.
- `attachmentRoots` und `remoteAttachmentRoots` beschränken eingehende Anhangspfade (Standard: `/Users/*/Library/Messages/Attachments`).
- SCP verwendet strikte Host-Key-Prüfung; stellen Sie daher sicher, dass der Relay-Host-Key bereits in `~/.ssh/known_hosts` vorhanden ist.
- `channels.imessage.configWrites`: von iMessage initiierte Konfigurationsschreibvorgänge erlauben oder verweigern.
- Einträge in `bindings[]` auf oberster Ebene mit `type: "acp"` können iMessage-Unterhaltungen an persistente ACP-Sitzungen binden. Verwenden Sie ein normalisiertes Handle oder ein explizites Chat-Ziel (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) in `match.peer.id`. Semantik gemeinsamer Felder: [ACP-Agenten](/de/tools/acp-agents#channel-specific-settings).

<Accordion title="Beispiel für iMessage-SSH-Wrapper">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix ist Plugin-gestützt und unter `channels.matrix` konfiguriert.

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
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` erlaubt private/interne Homeserver. `proxy` und diese Netzwerk-Opt-in-Einstellung sind unabhängige Steuerungen.
- `channels.matrix.defaultAccount` wählt das bevorzugte Konto in Multi-Konto-Setups aus.
- `channels.matrix.autoJoin` ist standardmäßig `off`, sodass eingeladene Räume und neue DM-artige Einladungen ignoriert werden, bis Sie `autoJoin: "allowlist"` mit `autoJoinAllowlist` oder `autoJoin: "always"` setzen.
- `channels.matrix.execApprovals`: Matrix-native Zustellung von Ausführungsgenehmigungen und Autorisierung von Genehmigenden.
  - `enabled`: `true`, `false` oder `"auto"` (Standard). Im Auto-Modus werden Ausführungsgenehmigungen aktiviert, wenn Genehmigende aus `approvers` oder `commands.ownerAllowFrom` aufgelöst werden können.
  - `approvers`: Matrix-Benutzer-IDs (z. B. `@owner:example.org`), die Ausführungsanforderungen genehmigen dürfen.
  - `agentFilter`: optionale Agent-ID-Allowlist. Weglassen, um Genehmigungen für alle Agenten weiterzuleiten.
  - `sessionFilter`: optionale Sitzungsschlüsselmuster (Teilzeichenfolge oder Regex).
  - `target`: wohin Genehmigungsaufforderungen gesendet werden. `"dm"` (Standard), `"channel"` (ursprünglicher Raum) oder `"both"`.
  - Überschreibungen pro Konto: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` steuert, wie Matrix-DMs in Sitzungen gruppiert werden: `per-user` (Standard) teilt nach geroutetem Peer, während `per-room` jeden DM-Raum isoliert.
- Matrix-Statusprüfungen und Live-Verzeichnissuchen verwenden dieselbe Proxy-Richtlinie wie Laufzeit-Traffic.
- Die vollständige Matrix-Konfiguration, Zielregeln und Einrichtungsbeispiele sind in [Matrix](/de/channels/matrix) dokumentiert.

### Microsoft Teams

Microsoft Teams ist Plugin-gestützt und unter `channels.msteams` konfiguriert.

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
- Die vollständige Teams-Konfiguration (Anmeldedaten, Webhook, DM-/Gruppenrichtlinie, Überschreibungen pro Team/pro Kanal) ist in [Microsoft Teams](/de/channels/msteams) dokumentiert.

### IRC

IRC ist Plugin-gestützt und unter `channels.irc` konfiguriert.

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
- Optionales `channels.irc.defaultAccount` überschreibt die standardmäßige Kontoauswahl, wenn es mit einer konfigurierten Konto-ID übereinstimmt.
- Die vollständige IRC-Kanalkonfiguration (Host/Port/TLS/Kanäle/Allowlists/Erwähnungsgating) ist in [IRC](/de/channels/irc) dokumentiert.

### Multi-Konto (alle Kanäle)

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
- Env-Token gelten nur für das **standardmäßige** Konto.
- Basis-Kanaleinstellungen gelten für alle Konten, sofern sie nicht pro Konto überschrieben werden.
- Verwenden Sie `bindings[].match.accountId`, um jedes Konto an einen anderen Agenten zu routen.
- Wenn Sie ein nicht standardmäßiges Konto über `openclaw channels add` (oder Kanal-Onboarding) hinzufügen, während noch eine Einzelkonto-Kanalkonfiguration auf oberster Ebene verwendet wird, verschiebt OpenClaw zuerst kontobezogene Einzelkonto-Werte auf oberster Ebene in die Kontozuordnung des Kanals, damit das ursprüngliche Konto weiterhin funktioniert. Die meisten Kanäle verschieben sie nach `channels.<channel>.accounts.default`; Matrix kann stattdessen ein vorhandenes passendes benanntes/standardmäßiges Ziel beibehalten.
- Vorhandene kanalbezogene Bindings (ohne `accountId`) entsprechen weiterhin dem standardmäßigen Konto; kontobezogene Bindings bleiben optional.
- `openclaw doctor --fix` repariert außerdem gemischte Formen, indem kontobezogene Einzelkonto-Werte auf oberster Ebene in das für diesen Kanal gewählte hochgestufte Konto verschoben werden. Die meisten Kanäle verwenden `accounts.default`; Matrix kann stattdessen ein vorhandenes passendes benanntes/standardmäßiges Ziel beibehalten.

### Andere Plugin-Kanäle

Viele Plugin-Kanäle werden als `channels.<id>` konfiguriert und auf ihren eigenen Kanalseiten dokumentiert (zum Beispiel Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat und Twitch).
Siehe den vollständigen Kanalindex: [Kanäle](/de/channels).

### Erwähnungsgating in Gruppenchats

Gruppennachrichten erfordern standardmäßig eine **Erwähnung** (Metadaten-Erwähnung oder sichere Regex-Muster). Gilt für WhatsApp, Telegram, Discord, Google Chat und iMessage-Gruppenchats.

Sichtbare Antworten werden separat gesteuert. Gruppen-/Kanalräume verwenden standardmäßig `messages.groupChat.visibleReplies: "message_tool"`: OpenClaw verarbeitet die Anfrage weiterhin, aber normale finale Antworten bleiben privat und sichtbare Raumausgabe erfordert `message(action=send)`. Setzen Sie `"automatic"` nur, wenn Sie das Legacy-Verhalten wünschen, bei dem normale Antworten zurück in den Raum gepostet werden. Um dasselbe nur-toolbasierte Verhalten für sichtbare Antworten auch auf Direktchats anzuwenden, setzen Sie `messages.visibleReplies: "message_tool"`.

Wenn das Nachrichtentool unter der aktiven Tool-Richtlinie nicht verfügbar ist, fällt OpenClaw auf automatische sichtbare Antworten zurück, anstatt die Antwort stillschweigend zu unterdrücken. `openclaw doctor` warnt vor dieser Nichtübereinstimmung.

Das Gateway lädt die `messages`-Konfiguration nach dem Speichern der Datei per Hot-Reload neu. Starten Sie nur neu, wenn Dateiüberwachung oder Konfigurationsneuladen in der Bereitstellung deaktiviert ist.

**Erwähnungstypen:**

- **Metadaten-Erwähnungen**: Native Plattform-@-Erwähnungen. Wird im WhatsApp-Self-Chat-Modus ignoriert.
- **Textmuster**: Sichere Regex-Muster in `agents.list[].groupChat.mentionPatterns`. Ungültige Muster und unsichere verschachtelte Wiederholungen werden ignoriert.
- Erwähnungsgating wird nur erzwungen, wenn Erkennung möglich ist (native Erwähnungen oder mindestens ein Muster).

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

`messages.visibleReplies` ist der globale Standard für Quell-Turns; `messages.groupChat.visibleReplies` überschreibt ihn für Gruppen-/Kanal-Quell-Turns. Kanal-Allowlists und Erwähnungsgating entscheiden weiterhin, ob ein Turn verarbeitet wird.

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

Auflösung: pro-DM-Überschreibung → Provider-Standard → kein Limit (alles beibehalten).

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

<Accordion title="Befehlsdetails">

- Dieser Block konfiguriert Befehlsoberflächen. Den aktuellen integrierten und gebündelten Befehlskatalog finden Sie unter [Slash-Befehle](/de/tools/slash-commands).
- Diese Seite ist eine **Referenz für Konfigurationsschlüssel**, nicht der vollständige Befehlskatalog. Channel-/Plugin-eigene Befehle wie QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, Geräte-Pairing `/pair`, Speicher `/dreaming`, Telefonsteuerung `/phone` und Talk `/voice` sind auf ihren Channel-/Plugin-Seiten sowie unter [Slash-Befehle](/de/tools/slash-commands) dokumentiert.
- Textbefehle müssen **eigenständige** Nachrichten mit führendem `/` sein.
- `native: "auto"` aktiviert native Befehle für Discord/Telegram und lässt Slack deaktiviert.
- `nativeSkills: "auto"` aktiviert native Skill-Befehle für Discord/Telegram und lässt Slack deaktiviert.
- Pro Channel überschreiben: `channels.discord.commands.native` (bool oder `"auto"`). `false` entfernt zuvor registrierte Befehle.
- Überschreiben Sie die native Skill-Registrierung pro Channel mit `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` fügt zusätzliche Menüeinträge für den Telegram-Bot hinzu.
- `bash: true` aktiviert `! <cmd>` für die Host-Shell. Erfordert `tools.elevated.enabled` und einen Absender in `tools.elevated.allowFrom.<channel>`.
- `config: true` aktiviert `/config` (liest/schreibt `openclaw.json`). Für Gateway-`chat.send`-Clients erfordern persistente `/config set|unset`-Schreibvorgänge außerdem `operator.admin`; das schreibgeschützte `/config show` bleibt für normale Operator-Clients mit Schreibbereich verfügbar.
- `mcp: true` aktiviert `/mcp` für von OpenClaw verwaltete MCP-Serverkonfiguration unter `mcp.servers`.
- `plugins: true` aktiviert `/plugins` für Plugin-Erkennung, Installation sowie Aktivieren/Deaktivieren.
- `channels.<provider>.configWrites` steuert Konfigurationsänderungen pro Channel (Standard: true).
- Bei Multi-Account-Channels steuert `channels.<provider>.accounts.<id>.configWrites` außerdem Schreibvorgänge, die auf dieses Konto abzielen (zum Beispiel `/allowlist --config --account <id>` oder `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` deaktiviert `/restart` und Gateway-Neustart-Toolaktionen. Standard: `true`.
- `ownerAllowFrom` ist die explizite Owner-Allowlist für Owner-only-Befehle/-Tools. Sie ist von `allowFrom` getrennt.
- `ownerDisplay: "hash"` hasht Owner-IDs im System-Prompt. Setzen Sie `ownerDisplaySecret`, um das Hashing zu steuern.
- `allowFrom` ist pro Provider. Wenn gesetzt, ist es die **einzige** Autorisierungsquelle (Channel-Allowlists/Pairing und `useAccessGroups` werden ignoriert).
- `useAccessGroups: false` erlaubt Befehlen, Access-Group-Richtlinien zu umgehen, wenn `allowFrom` nicht gesetzt ist.
- Zuordnung der Befehlsdokumentation:
  - integrierter und gebündelter Katalog: [Slash-Befehle](/de/tools/slash-commands)
  - Channel-spezifische Befehlsoberflächen: [Channels](/de/channels)
  - QQ Bot-Befehle: [QQ Bot](/de/channels/qqbot)
  - Pairing-Befehle: [Pairing](/de/channels/pairing)
  - LINE-Kartenbefehl: [LINE](/de/channels/line)
  - Speicher-Dreaming: [Dreaming](/de/concepts/dreaming)

</Accordion>

---

## Verwandt

- [Konfigurationsreferenz](/de/gateway/configuration-reference) — Schlüssel der obersten Ebene
- [Konfiguration – Agents](/de/gateway/config-agents)
- [Channels-Übersicht](/de/channels)
