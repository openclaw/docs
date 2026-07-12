---
read_when:
    - Einen Kanal-Plugin konfigurieren (Authentifizierung, Zugriffskontrolle, mehrere Konten)
    - Fehlerbehebung bei kanalspezifischen Konfigurationsschlüsseln
    - DM-Richtlinie, Gruppenrichtlinie oder Erwähnungsbeschränkung prüfen
summary: 'Kanalkonfiguration: Zugriffskontrolle, Kopplung und kanalspezifische Schlüssel für Slack, Discord, Telegram, WhatsApp, Matrix, iMessage und weitere Dienste'
title: Konfiguration — Kanäle
x-i18n:
    generated_at: "2026-07-12T15:16:57Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: af161d396b2dc40e3ccb5f00ca4815fc1ad782f96f98dc4a74d65be958530da6
    source_path: gateway/config-channels.md
    workflow: 16
---

Kanalspezifische Konfigurationsschlüssel unter `channels.*`: Zugriff auf Direktnachrichten und Gruppen, Setups mit mehreren Konten, Erwähnungsbeschränkung sowie kanalspezifische Schlüssel für Slack, Discord, Telegram, WhatsApp, Matrix, iMessage und andere Kanal-Plugins.

Informationen zu Agenten, Tools, der Gateway-Laufzeit und anderen Schlüsseln der obersten Ebene finden Sie in der [Konfigurationsreferenz](/de/gateway/configuration-reference).

## Kanäle

Jeder Kanal wird automatisch gestartet, sobald sein Konfigurationsabschnitt vorhanden ist (sofern nicht `enabled: false` festgelegt ist). Telegram und iMessage sind im zentralen `openclaw`-Paket enthalten. Andere offizielle Kanäle (Discord, Slack, WhatsApp, Matrix, Microsoft Teams, IRC, Google Chat, Signal, Mattermost und weitere) werden mit `openclaw plugins install <spec>` als separate Plugins installiert; die vollständige Liste und die Installationsspezifikationen finden Sie unter [Kanäle](/de/channels).

### Zugriff auf Direktnachrichten und Gruppen

Alle Kanäle unterstützen Richtlinien für Direktnachrichten und Gruppen:

| Direktnachrichtenrichtlinie | Verhalten                                                                                          |
| --------------------------- | -------------------------------------------------------------------------------------------------- |
| `pairing` (Standard)        | Unbekannte Absender erhalten einen einmaligen Kopplungscode; der Eigentümer muss ihn genehmigen    |
| `allowlist`                 | Nur Absender in `allowFrom` (oder im Speicher für gekoppelte zulässige Absender)                    |
| `open`                      | Alle eingehenden Direktnachrichten zulassen (erfordert `allowFrom: ["*"]`)                          |
| `disabled`                  | Alle eingehenden Direktnachrichten ignorieren                                                      |

| Gruppenrichtlinie      | Verhalten                                                                          |
| ---------------------- | ---------------------------------------------------------------------------------- |
| `allowlist` (Standard) | Nur Gruppen, die der konfigurierten Zulassungsliste entsprechen                    |
| `open`                 | Gruppenzulassungslisten umgehen (die Erwähnungsbeschränkung gilt weiterhin)        |
| `disabled`             | Alle Gruppen-/Raumnachrichten blockieren                                           |

<Note>
`channels.defaults.groupPolicy` legt den Standardwert fest, wenn `groupPolicy` eines Providers nicht gesetzt ist.
Kopplungscodes laufen nach 1 Stunde ab. Ausstehende Kopplungsanfragen sind auf **3 pro Konto** begrenzt (nach Kanal und Konto-ID getrennt).
Wenn ein Provider-Block vollständig fehlt (`channels.<provider>` ist nicht vorhanden), fällt die Gruppenrichtlinie der Laufzeit auf `allowlist` zurück (Fail-Closed) und gibt beim Start eine Warnung aus.
</Note>

### Kanalspezifische Modellüberschreibungen

Verwenden Sie `channels.modelByChannel`, um bestimmte Kanal-IDs oder Kommunikationspartner in Direktnachrichten an ein Modell zu binden. Als Werte werden `provider/model` oder konfigurierte Modellaliase akzeptiert. Die Kanalzuordnung gilt nur, wenn für eine Sitzung noch keine aktive Modellüberschreibung vorhanden ist (beispielsweise eine über `/model` festgelegte).

Bei Gruppen-/Thread-Unterhaltungen sind die Schlüssel kanalspezifische Gruppen-IDs, Themen-IDs oder Kanalnamen. Bei Direktnachrichten-Unterhaltungen sind die Schlüssel Kennungen der Kommunikationspartner, die aus der Absenderidentität des Kanals abgeleitet werden (`nativeDirectUserId`, `origin.from`, `origin.to`, `OriginatingTo`, `From` oder `SenderId`). Die genaue Form des Schlüssels hängt vom Kanal ab:

| Kanal    | Form des Direktnachrichtenschlüssels | Beispiel                                     |
| -------- | ------------------------------------ | -------------------------------------------- |
| Discord  | unverarbeitete Benutzer-ID           | `987654321`                                  |
| Feishu   | `feishu:ou_...`                      | `feishu:ou_a8b6cab7e945387de5f253775d9b4d85` |
| Matrix   | Matrix-Benutzer-ID                   | `@user:matrix.org`                           |
| Slack    | `user:U...`                          | `user:U12345`                                |
| Telegram | unverarbeitete Benutzer-ID           | `123456789`                                  |
| WhatsApp | Telefonnummer oder JID               | `15551234567`                                |

```json5
{
  channels: {
    modelByChannel: {
      discord: {
        "123456789012345678": "anthropic/claude-opus-4-6",
      },
      slack: {
        C1234567890: "openai/gpt-5.6-sol",
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

Direktnachrichtenspezifische Schlüssel stimmen nur in Direktnachrichten-Unterhaltungen überein; sie wirken sich nicht auf das Routing von Gruppen oder Threads aus.

### Kanalstandardwerte und Heartbeat

Verwenden Sie `channels.defaults` für gemeinsame Gruppenrichtlinien und das Heartbeat-Verhalten über Provider hinweg:

```json5
{
  channels: {
    defaults: {
      groupPolicy: "allowlist", // offen | Zulassungsliste | deaktiviert
      contextVisibility: "all", // alle | Zulassungsliste | Zulassungsliste_Zitat
      heartbeat: {
        showOk: false,
        showAlerts: true,
        useIndicator: true,
      },
    },
  },
}
```

- `channels.defaults.groupPolicy`: Ersatz-Gruppenrichtlinie, wenn `groupPolicy` auf Provider-Ebene nicht festgelegt ist.
- `channels.defaults.contextVisibility`: Standardmodus für die Sichtbarkeit ergänzenden Kontexts für alle Kanäle. Werte: `all` (Standard, sämtlichen Kontext aus Zitaten, Threads und Verlauf einbeziehen), `allowlist` (nur Kontext von Absendern auf der Zulassungsliste einbeziehen), `allowlist_quote` (wie Zulassungsliste, aber expliziten Zitat-/Antwortkontext beibehalten). Kanalspezifische Überschreibung: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: Status fehlerfrei funktionierender Kanäle in die Heartbeat-Ausgabe einbeziehen (Standard: `false`).
- `channels.defaults.heartbeat.showAlerts`: Status beeinträchtigter/fehlerhafter Kanäle in die Heartbeat-Ausgabe einbeziehen (Standard: `true`).
- `channels.defaults.heartbeat.useIndicator`: kompakte Heartbeat-Ausgabe im Indikatorstil darstellen (Standard: `true`).

### WhatsApp

WhatsApp wird über den Webkanal des Gateways (Baileys Web) ausgeführt. Er startet automatisch, wenn eine verknüpfte Sitzung vorhanden ist.

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
      maxMs: 30000,
      factor: 1.8,
      jitter: 0.25,
      maxAttempts: 12, // 0 = unbegrenzt erneut versuchen
    },
  },
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // Kopplung | Zulassungsliste | offen | deaktiviert
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // Länge | Zeilenumbruch
      mediaMaxMb: 50,
      sendReadReceipts: true, // blaue Häkchen (im Selbstchat-Modus false)
      groups: {
        "*": { requireMention: true },
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
}
```

- `web.whatsapp.keepAliveIntervalMs` (Standard: `25000`), `connectTimeoutMs` (Standard: `60000`) und `defaultQueryTimeoutMs` (Standard: `60000`) passen den Baileys-Socket an.
- Standardwerte für `web.reconnect`: `initialMs: 2000`, `maxMs: 30000`, `factor: 1.8`, `jitter: 0.25`, `maxAttempts: 12`. Mit `maxAttempts: 0` werden Verbindungsversuche unbegrenzt fortgesetzt, statt aufzugeben.
- Einträge in `bindings[]` auf oberster Ebene mit `type: "acp"` konfigurieren persistente ACP-Bindungen für WhatsApp-Direktnachrichten und -Gruppen. Verwenden Sie in `match.peer.id` eine direkte Nummer im E.164-Format oder eine WhatsApp-Gruppen-JID. Die Feldsemantik wird unter [ACP-Agenten](/de/tools/acp-agents#persistent-channel-bindings) gemeinsam beschrieben.

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

- Ausgehende Befehle verwenden standardmäßig das Konto `default`, sofern vorhanden; andernfalls die erste konfigurierte Konto-ID (sortiert).
- Optional überschreibt `channels.whatsapp.defaultAccount` diese standardmäßige Auswahl des Ausweichkontos, wenn der Wert einer konfigurierten Konto-ID entspricht.
- Das veraltete Baileys-Authentifizierungsverzeichnis für ein einzelnes Konto wird durch `openclaw doctor` nach `whatsapp/default` migriert.
- Kontospezifische Überschreibungen: `channels.whatsapp.accounts.<id>.sendReadReceipts`, `channels.whatsapp.accounts.<id>.dmPolicy`, `channels.whatsapp.accounts.<id>.allowFrom`.

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
        { command: "backup", description: "Git-Sicherung" },
        { command: "generate", description: "Ein Bild erstellen" },
      ],
      historyLimit: 50,
      replyToMode: "first", // aus | erste | alle | gebündelt
      linkPreview: true,
      streaming: "partial", // aus | teilweise | Block | Fortschritt (Standard: teilweise)
      actions: { reactions: true, sendMessage: true },
      reactionNotifications: "own", // aus | eigene | alle
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
      trustedLocalFileRoots: ["/srv/telegram-bot-api-data"],
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```

- Bot-Token: `channels.telegram.botToken` oder `channels.telegram.tokenFile` (nur reguläre Dateien; symbolische Links werden abgelehnt), mit `TELEGRAM_BOT_TOKEN` als Ausweichoption für das Standardkonto.
- `apiRoot` ist ausschließlich der Telegram-Bot-API-Stammpfad. Verwenden Sie `https://api.telegram.org` oder den Stammpfad Ihrer selbst gehosteten Instanz bzw. Ihres Proxys, nicht `https://api.telegram.org/bot<TOKEN>`; `openclaw doctor --fix` entfernt ein versehentlich angehängtes Suffix `/bot<TOKEN>`.
- Bei einem selbst gehosteten Bot-API-Server im Modus `--local` führt `trustedLocalFileRoots` die Hostpfade auf, die OpenClaw lesen darf. Binden Sie das Datenvolume des Servers auf dem OpenClaw-Host ein und konfigurieren Sie entweder dessen Datenstammpfad oder das tokenspezifische Verzeichnis; Containerpfade unter `/var/lib/telegram-bot-api` werden diesen Stammpfaden zugeordnet. Andere absolute Pfade werden weiterhin abgelehnt.
- Optional überschreibt `channels.telegram.defaultAccount` die Auswahl des Standardkontos, wenn der Wert einer konfigurierten Konto-ID entspricht.
- Legen Sie bei Konfigurationen mit mehreren Konten (2+ Konto-IDs) explizit ein Standardkonto fest (`channels.telegram.defaultAccount` oder `channels.telegram.accounts.default`), um eine Ausweichweiterleitung zu vermeiden; `openclaw doctor` warnt, wenn diese Angabe fehlt oder ungültig ist.
- `configWrites: false` blockiert von Telegram ausgelöste Konfigurationsänderungen (Migrationen von Supergruppen-IDs, `/config set|unset`).
- Einträge der obersten Ebene in `bindings[]` mit `type: "acp"` konfigurieren persistente ACP-Bindungen für Forenthemen (verwenden Sie die kanonische Form `chatId:topic:topicId` in `match.peer.id`). Die Feldsemantik wird unter [ACP-Agenten](/de/tools/acp-agents#persistent-channel-bindings) gemeinsam beschrieben.
- Telegram-Streamvorschauen verwenden `sendMessage` + `editMessageText` (funktioniert in Direkt- und Gruppenchats).
- `network.dnsResultOrder` ist standardmäßig auf `"ipv4first"` gesetzt, um häufige IPv6-Abruffehler zu vermeiden.
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
              systemPrompt: "Nur kurze Antworten.",
            },
          },
        },
      },
      historyLimit: 20,
      textChunkLimit: 2000,
      suppressEmbeds: true,
      streaming: {
        mode: "progress", // off | partial | block | progress (Discord-Standard: progress)
        chunkMode: "length", // length | newline
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

- Token: `channels.discord.token`, mit `DISCORD_BOT_TOKEN` als Rückfalloption für das Standardkonto.
- Direkte ausgehende Aufrufe, die ein explizites Discord-`token` angeben, verwenden dieses Token für den Aufruf; die Wiederholungs- und Richtlinieneinstellungen des Kontos stammen weiterhin aus dem ausgewählten Konto im aktiven Runtime-Snapshot.
- Optional überschreibt `channels.discord.defaultAccount` die Auswahl des Standardkontos, wenn der Wert mit einer konfigurierten Konto-ID übereinstimmt.
- Verwenden Sie `user:<id>` (DM) oder `channel:<id>` (Guild-Kanal) als Zustellziele; reine numerische IDs werden abgelehnt.
- Guild-Slugs sind kleingeschrieben, wobei Leerzeichen durch `-` ersetzt werden; Kanalschlüssel verwenden den als Slug formatierten Namen (ohne `#`). Bevorzugen Sie Guild-IDs.
- Von Bots verfasste Nachrichten werden standardmäßig ignoriert. `allowBots: true` aktiviert sie; verwenden Sie `allowBots: "mentions"`, um nur Bot-Nachrichten zu akzeptieren, die den Bot erwähnen (eigene Nachrichten werden weiterhin herausgefiltert).
- Kanäle, die eingehende, von Bots verfasste Nachrichten unterstützen, können den gemeinsamen [Bot-Schleifenschutz](/de/channels/bot-loop-protection) verwenden. Legen Sie `channels.defaults.botLoopProtection` für grundlegende Paarbudgets fest und überschreiben Sie anschließend den Kanal oder das Konto nur, wenn eine Oberfläche andere Grenzwerte benötigt.
- `channels.discord.guilds.<id>.ignoreOtherMentions` (und Kanalüberschreibungen) verwirft Nachrichten, die einen anderen Benutzer oder eine andere Rolle, aber nicht den Bot erwähnen (ausgenommen @everyone/@here).
- `channels.discord.mentionAliases` ordnet stabilen ausgehenden `@handle`-Text vor dem Senden Discord-Benutzer-IDs zu, sodass bekannte Teammitglieder auch dann deterministisch erwähnt werden können, wenn der temporäre Verzeichnis-Cache leer ist. Kontospezifische Überschreibungen befinden sich unter `channels.discord.accounts.<accountId>.mentionAliases`.
- `maxLinesPerMessage` (Standardwert `17`) teilt hohe Nachrichten auch dann auf, wenn sie weniger als 2000 Zeichen enthalten.
- `channels.discord.suppressEmbeds` ist standardmäßig `true`, sodass ausgehende URLs nicht als Discord-Linkvorschauen erweitert werden, sofern dies nicht deaktiviert wird. Explizite `embeds`-Payloads werden weiterhin normal gesendet; Tool-Aufrufe pro Nachricht können dies mit `suppressEmbeds` überschreiben.
- `channels.discord.threadBindings` steuert das an Discord-Threads gebundene Routing:
  - `enabled`: Discord-Überschreibung für Funktionen Thread-gebundener Sitzungen (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` sowie gebundene Zustellung und gebundenes Routing)
  - `idleHours`: Discord-Überschreibung für das automatische Aufheben des Fokus nach Inaktivität in Stunden (`0` deaktiviert die Funktion)
  - `maxAgeHours`: Discord-Überschreibung für das feste Höchstalter in Stunden (`0` deaktiviert die Funktion)
  - `spawnSessions`: Schalter für `sessions_spawn({ thread: true })` und die automatische Thread-Erstellung und -Bindung beim ACP-Thread-Spawn (Standardwert: `true`)
  - `defaultSpawnContext`: nativer Subagent-Kontext für Thread-gebundene Spawns (standardmäßig `"fork"`)
- Einträge der obersten Ebene in `bindings[]` mit `type: "acp"` konfigurieren persistente ACP-Bindungen für Kanäle und Threads (verwenden Sie die Kanal-/Thread-ID in `match.peer.id`). Die Feldsemantik wird unter [ACP-Agenten](/de/tools/acp-agents#persistent-channel-bindings) gemeinsam beschrieben.
- `channels.discord.ui.components.accentColor` legt die Akzentfarbe für Discord-Komponenten-v2-Container fest.
- `channels.discord.agentComponents.ttlMs` steuert, wie lange Callbacks gesendeter Discord-Komponenten registriert bleiben. Standardwert `1800000` (30 Minuten), maximal `86400000` (24 Stunden). Kontospezifische Überschreibungen befinden sich unter `channels.discord.accounts.<accountId>.agentComponents.ttlMs`. Bevorzugen Sie die kürzeste TTL, die für den Workflow ausreicht.
- `channels.discord.voice` aktiviert Unterhaltungen in Discord-Sprachkanälen sowie optionale Überschreibungen für automatischen Beitritt, LLM und TTS. Reine Textkonfigurationen für Discord lassen Sprache standardmäßig deaktiviert; legen Sie `channels.discord.voice.enabled=true` fest, um sie zu aktivieren.
- `channels.discord.voice.model` überschreibt optional das LLM-Modell, das für Antworten in Discord-Sprachkanälen verwendet wird.
- `channels.discord.voice.daveEncryption` (Standardwert `true`) und `channels.discord.voice.decryptionFailureTolerance` (Standardwert `24`) werden an die DAVE-Optionen von `@discordjs/voice` weitergegeben.
- `channels.discord.voice.connectTimeoutMs` steuert die anfängliche Wartezeit auf den Status Ready von `@discordjs/voice` für `/vc join` und Versuche des automatischen Beitritts (Standardwert `30000`).
- `channels.discord.voice.reconnectGraceMs` steuert, wie lange eine getrennte Sprachsitzung benötigen darf, um in die Signalisierung für die erneute Verbindung einzutreten, bevor OpenClaw sie beendet (Standardwert `15000`).
- Die Discord-Sprachwiedergabe wird nicht durch das Ereignis unterbrochen, dass ein anderer Benutzer zu sprechen beginnt. Um Rückkopplungsschleifen zu vermeiden, ignoriert OpenClaw neue Sprachaufnahmen, während TTS wiedergegeben wird.
- OpenClaw versucht außerdem, den Sprachempfang wiederherzustellen, indem es nach wiederholten Entschlüsselungsfehlern eine Sprachsitzung verlässt und ihr erneut beitritt.
- `channels.discord.streaming` ist der kanonische Schlüssel für den Streaming-Modus. Discord verwendet standardmäßig `streaming.mode: "progress"`, sodass der Fortschritt von Tools und Arbeit in einer einzigen bearbeiteten Vorschaunachricht erscheint; legen Sie `streaming.mode: "off"` fest, um dies zu deaktivieren. Veraltete flache Schlüssel (`streamMode`, `chunkMode`, `blockStreaming`, `draftChunk`, `blockStreamingCoalesce`) werden zur Laufzeit nicht mehr gelesen; führen Sie `openclaw doctor --fix` aus, um persistierte Konfigurationen zu migrieren.
- `channels.discord.autoPresence` ordnet die Runtime-Verfügbarkeit der Bot-Präsenz zu (fehlerfrei => online, beeinträchtigt => idle, erschöpft => dnd) und ermöglicht optionale Überschreibungen des Statustexts.
- `channels.discord.dangerouslyAllowNameMatching` aktiviert den Abgleich veränderlicher Namen/Tags erneut (Notfall-Kompatibilitätsmodus).
- `channels.discord.execApprovals`: Discord-native Zustellung von Ausführungsgenehmigungen und Autorisierung der Genehmigenden.
  - `enabled`: `true`, `false` oder `"auto"` (Standardwert). Im automatischen Modus werden Ausführungsgenehmigungen aktiviert, wenn Genehmigende aus `approvers` oder `commands.ownerAllowFrom` aufgelöst werden können.
  - `approvers`: Discord-Benutzer-IDs, die Ausführungsanfragen genehmigen dürfen. Fällt auf `commands.ownerAllowFrom` zurück, wenn nicht angegeben.
  - `agentFilter`: optionale Zulassungsliste für Agenten-IDs. Lassen Sie den Wert weg, um Genehmigungen für alle Agenten weiterzuleiten.
  - `sessionFilter`: optionale Muster für Sitzungsschlüssel (Teilzeichenfolge oder regulärer Ausdruck).
  - `target`: Ziel für Genehmigungsaufforderungen. `"dm"` (Standardwert) sendet sie an die DMs der Genehmigenden, `"channel"` an den ursprünglichen Kanal und `"both"` an beide. Wenn das Ziel `"channel"` umfasst, können die Schaltflächen nur von aufgelösten Genehmigenden verwendet werden.
  - `cleanupAfterResolve`: Wenn `true`, werden Genehmigungs-DMs nach Genehmigung, Ablehnung oder Zeitüberschreitung gelöscht.

**Modi für Reaktionsbenachrichtigungen:** `off` (keine), `own` (Nachrichten des Bots, Standardwert), `all` (alle Nachrichten), `allowlist` (von `guilds.<id>.users` bei allen Nachrichten).

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
- SecretRef für das Dienstkonto wird ebenfalls unterstützt (`serviceAccountRef`).
- Rückfalloptionen für Umgebungsvariablen: `GOOGLE_CHAT_SERVICE_ACCOUNT` oder `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE` (nur Standardkonto).
- Verwenden Sie `spaces/<spaceId>` oder `users/<userId>` als Zustellziele.
- `channels.googlechat.dangerouslyAllowNameMatching` aktiviert den Abgleich veränderlicher E-Mail-Prinzipale erneut (Notfall-Kompatibilitätsmodus).

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
        C123: { enabled: true, requireMention: true, allowBots: false },
        "#general": {
          enabled: true,
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
        initialHistoryLimit: 20,
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
      streaming: {
        mode: "partial", // off | partial | block | progress
        chunkMode: "length", // length | newline
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

- **Socket-Modus** erfordert sowohl `botToken` als auch `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` für den Umgebungsvariablen-Fallback des Standardkontos).
- **HTTP-Modus** erfordert `botToken` sowie `signingSecret` (auf Stammebene oder pro Konto).
- `enterpriseOrgInstall: true` bindet ein Konto in den organisationsweiten
  Ereignispfad von Slack Enterprise Grid ein. Beim Start wird das Bot-Token mit
  `auth.test` überprüft; der Start schlägt fehl, wenn der konfigurierte Modus
  nicht mit der Installationsidentität von Slack übereinstimmt.
  Enterprise-DMs müssen deaktiviert sein oder `dmPolicy: "open"` mit einem
  effektiven `allowFrom: ["*"]` verwenden. Kanal- und Benutzerrichtlinien müssen
  stabile Slack-IDs verwenden; veränderliche Namen und nicht unterstützte
  Kanalpräfixe führen dazu, dass der Start fehlschlägt. V1 verarbeitet nur
  direkte Socket-Mode- oder HTTP-Ereignisse vom Typ `message` und `app_mention`
  mit unmittelbaren Antworten; Relay, Befehle, Interaktionen, App Home,
  Listener für Reaktionsereignisse, Pins, Aktionswerkzeuge, native
  Genehmigungen, Bindungen, verzögerte Zustellung und proaktive Sendungen sind
  nicht verfügbar. Listener-eigene Bestätigungen, Tippanzeigen und
  Statusreaktionen bleiben mit `reactions:write` verfügbar; Benachrichtigungen
  über eingehende Reaktionen und Reaktionsaktionswerkzeuge sind nicht verfügbar.
  Unter [Organisationsweite Installationen für Enterprise Grid](/de/channels/slack#enterprise-grid-org-wide-installs)
  finden Sie das Manifest mit den geringsten Berechtigungen, den Einrichtungsablauf
  und die vollständigen Einschränkungen.
- `socketMode` übergibt die Transporteinstellungen des Slack-SDK-Socket-Modus an die öffentliche Bolt-Receiver-API. Verwenden Sie dies nur zur Untersuchung von Ping-/Pong-Zeitüberschreitungen oder veraltetem WebSocket-Verhalten. `clientPingTimeout` ist standardmäßig `15000`; `serverPingTimeout` und `pingPongLoggingEnabled` werden nur übergeben, wenn sie konfiguriert sind.
- `botToken`, `appToken`, `signingSecret` und `userToken` akzeptieren
  Klartextzeichenfolgen oder SecretRef-Objekte.
- Slack-Kontomomentaufnahmen stellen quell- und statusbezogene Felder pro
  Anmeldedatenwert bereit, beispielsweise `botTokenSource`, `botTokenStatus`,
  `appTokenStatus` und im HTTP-Modus `signingSecretStatus`.
  `configured_unavailable` bedeutet, dass das Konto über SecretRef konfiguriert
  ist, der aktuelle Befehls-/Laufzeitpfad den Geheimniswert jedoch nicht
  auflösen konnte.
- `configWrites: false` blockiert von Slack initiierte Konfigurationsschreibvorgänge.
- Das optionale `channels.slack.defaultAccount` überschreibt die Auswahl des Standardkontos, wenn es mit einer konfigurierten Konto-ID übereinstimmt.
- `channels.slack.streaming.mode` ist der kanonische Schlüssel für den Slack-Stream-Modus (Standard: `"partial"`). `channels.slack.streaming.nativeTransport` steuert den nativen Streaming-Transport von Slack (Standard: `true`). Veraltete Werte für `streamMode`, den booleschen Wert `streaming`, `chunkMode`, `blockStreaming`, `blockStreamingCoalesce` und `nativeStreaming` werden zur Laufzeit nicht mehr gelesen; führen Sie `openclaw doctor --fix` aus, um persistierte Konfigurationen zu `streaming.{mode,chunkMode,block.enabled,block.coalesce,nativeTransport}` zu migrieren.
- `unfurlLinks` und `unfurlMedia` übergeben die booleschen Slack-Werte von `chat.postMessage` zum Aufklappen von Links und Medien für Bot-Antworten. `unfurlLinks` ist standardmäßig `false`, sodass ausgehende Bot-Links nur bei Aktivierung inline aufgeklappt werden; `unfurlMedia` wird ausgelassen, sofern es nicht konfiguriert ist. Legen Sie einen der Werte unter `channels.slack.accounts.<accountId>` fest, um den Wert auf oberster Ebene für ein Konto zu überschreiben.
- Verwenden Sie `user:<id>` (DM) oder `channel:<id>` als Zustellungsziele.

**Modi für Reaktionsbenachrichtigungen:** `off`, `own` (Standard), `all`, `allowlist` (aus `reactionAllowlist`).

**Isolation von Thread-Sitzungen:** `thread.historyScope` gilt pro Thread (Standard) oder wird kanalübergreifend geteilt. `thread.inheritParent` kopiert das Transkript des übergeordneten Kanals in neue Threads. `thread.initialHistoryLimit` (Standard: `20`) begrenzt die Anzahl vorhandener Thread-Nachrichten, die beim Start einer neuen Thread-Sitzung abgerufen werden; `0` deaktiviert den Abruf des Thread-Verlaufs.

- Natives Slack-Streaming und der Slack-Assistentenstatus „is typing...“ für Threads erfordern einen Antwort-Thread als Ziel. DMs auf oberster Ebene bleiben standardmäßig außerhalb von Threads, sodass sie weiterhin über Slack-Entwurfsvorschauen mit Veröffentlichen und Bearbeiten streamen können, anstatt die native Stream-/Statusvorschau im Thread-Stil anzuzeigen.
- `typingReaction` fügt der eingehenden Slack-Nachricht vorübergehend eine Reaktion hinzu, während eine Antwort ausgeführt wird, und entfernt sie nach Abschluss. Verwenden Sie einen Slack-Emoji-Kurzcode wie `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: Slack-native Zustellung an Genehmigungsclients und Autorisierung von Ausführungsgenehmigern. Dasselbe Schema wie bei Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (Slack-Benutzer-IDs), `agentFilter`, `sessionFilter` und `target` (`"dm"`, `"channel"` oder `"both"`). Plugin-Genehmigungen können diesen nativen Clientpfad für von Slack stammende Anfragen verwenden, wenn Slack-Plugin-Genehmiger aufgelöst werden; die Slack-native Zustellung von Plugin-Genehmigungen kann außerdem über `approvals.plugin` für von Slack stammende Sitzungen oder Slack-Ziele aktiviert werden. Plugin-Genehmigungen verwenden Slack-Plugin-Genehmiger aus `allowFrom` und das Standardrouting, nicht die Ausführungsgenehmiger.

| Aktionsgruppe | Standard   | Hinweise                         |
| ------------- | ---------- | -------------------------------- |
| reactions     | aktiviert  | Reagieren + Reaktionen auflisten |
| messages      | aktiviert  | Lesen/senden/bearbeiten/löschen  |
| pins          | aktiviert  | Anheften/lösen/auflisten         |
| memberInfo    | aktiviert  | Mitgliedsinformationen           |
| emojiList     | aktiviert  | Liste benutzerdefinierter Emojis |

### Mattermost

Mattermost wird auf dieselbe Weise wie Discord, Slack und WhatsApp als separates Plugin installiert:

```bash
openclaw plugins install @openclaw/mattermost
```

Prüfen Sie vor dem Festlegen einer Version die aktuellen Dist-Tags unter [npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost).

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
        native: true, // freiwillige Aktivierung
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Optionale explizite URL für Reverse-Proxy-/öffentliche Bereitstellungen
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

Chat-Modi: `oncall` (bei @-Erwähnung antworten, Standard), `onmessage` (jede Nachricht), `onchar` (Nachrichten, die mit einem Auslösepräfix beginnen).

Wenn native Mattermost-Befehle aktiviert sind:

- `commands.callbackPath` muss ein Pfad sein (beispielsweise `/api/channels/mattermost/command`), keine vollständige URL.
- `commands.callbackUrl` muss zum OpenClaw-Gateway-Endpunkt aufgelöst werden und vom Mattermost-Server aus erreichbar sein.
- Native Slash-Callbacks werden mit den befehlsspezifischen Tokens authentifiziert,
  die Mattermost bei der Registrierung von Slash-Befehlen zurückgibt. Wenn die
  Registrierung fehlschlägt oder keine Befehle aktiviert werden, lehnt OpenClaw
  Callbacks mit `Unauthorized: invalid command token.` ab.
- Bei privaten/Tailnet-/internen Callback-Hosts kann Mattermost verlangen, dass
  `ServiceSettings.AllowedUntrustedInternalConnections` den Callback-Host bzw. die Callback-Domain enthält.
  Verwenden Sie Host-/Domainwerte, keine vollständigen URLs.
- `channels.mattermost.configWrites`: Von Mattermost initiierte Konfigurationsschreibvorgänge zulassen oder verweigern.
- `channels.mattermost.requireMention`: Vor Antworten in Kanälen eine `@mention` verlangen.
- `channels.mattermost.groups.<channelId>.requireMention`: Kanalspezifische Überschreibung der Erwähnungsanforderung (`"*"` als Standard).
- Das optionale `channels.mattermost.defaultAccount` überschreibt die Auswahl des Standardkontos, wenn es mit einer konfigurierten Konto-ID übereinstimmt.

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

- `channels.signal.account`: Den Kanalstart an eine bestimmte Signal-Kontoidentität binden.
- `channels.signal.configWrites`: Von Signal initiierte Konfigurationsschreibvorgänge zulassen oder verweigern.
- Das optionale `channels.signal.defaultAccount` überschreibt die Auswahl des Standardkontos, wenn es mit einer konfigurierten Konto-ID übereinstimmt.

### iMessage

OpenClaw startet `imsg rpc` (JSON-RPC über stdio). Es ist kein Daemon oder Port erforderlich. Dies ist der bevorzugte Pfad für neue OpenClaw-iMessage-Einrichtungen, wenn der Host Berechtigungen für die Messages-Datenbank und Automation erteilen kann.

Die Unterstützung für BlueBubbles wurde entfernt. `channels.bluebubbles` ist in der aktuellen OpenClaw-Version keine unterstützte Laufzeitkonfigurationsoberfläche. Migrieren Sie alte Konfigurationen zu `channels.imessage`; eine Kurzfassung finden Sie unter [Entfernung von BlueBubbles und der imsg-iMessage-Pfad](/de/announcements/bluebubbles-imessage), die vollständige Übersetzungstabelle unter [Umstieg von BlueBubbles](/de/channels/imessage-from-bluebubbles).

Wenn der Gateway nicht auf dem bei Messages angemeldeten Mac ausgeführt wird, behalten Sie `channels.imessage.enabled=true` bei und setzen Sie `channels.imessage.cliPath` auf einen SSH-Wrapper, der `imsg "$@"` auf diesem Mac ausführt. Der lokale Standardpfad für `imsg` ist ausschließlich unter macOS verfügbar.

Bevor Sie sich für produktive Sendungen auf einen SSH-Wrapper verlassen, überprüfen Sie einen ausgehenden `imsg send` über genau diesen Wrapper. In einigen macOS-TCC-Zuständen wird die Messages-Automatisierung `/usr/libexec/sshd-keygen-wrapper` zugewiesen, wodurch Lesevorgänge und Prüfungen funktionieren können, während Sendungen mit dem AppleEvents-Fehler `-1743` fehlschlagen; lesen Sie dazu den Abschnitt zur Fehlerbehebung für SSH-Wrapper unter [iMessage](/de/channels/imessage).

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

- Das optionale `channels.imessage.defaultAccount` überschreibt die standardmäßige Kontoauswahl, wenn es mit einer konfigurierten Konto-ID übereinstimmt.
- Erfordert vollständigen Festplattenzugriff auf die Messages-Datenbank.
- Bevorzugen Sie Ziele im Format `chat_id:<id>`. Verwenden Sie `imsg chats --limit 20`, um Chats aufzulisten.
- `cliPath` kann auf einen SSH-Wrapper verweisen; legen Sie `remoteHost` (`host` oder `user@host`) für den Abruf von Anhängen per SCP fest.
- `attachmentRoots` und `remoteAttachmentRoots` beschränken die Pfade eingehender Anhänge (Standard: `/Users/*/Library/Messages/Attachments`).
- SCP verwendet eine strikte Hostschlüsselprüfung. Stellen Sie daher sicher, dass der Hostschlüssel des Relay-Hosts bereits in `~/.ssh/known_hosts` vorhanden ist.
- `channels.imessage.configWrites`: durch iMessage initiierte Konfigurationsänderungen zulassen oder verweigern.
- `channels.imessage.sendTransport`: bevorzugter `imsg`-RPC-Sendetransport für normale ausgehende Antworten. `auto` (Standard) verwendet für bestehende Chats die IMCore-Bridge, wenn sie ausgeführt wird, und greift anschließend auf AppleScript zurück; `bridge` erfordert die Zustellung über eine private API; `applescript` erzwingt den öffentlichen Messages-Automatisierungspfad.
- `channels.imessage.actions.*`: aktiviert Aktionen der privaten API, die zusätzlich durch `imsg status` / `openclaw channels status --probe` eingeschränkt werden.
- `channels.imessage.includeAttachments` ist standardmäßig deaktiviert; setzen Sie es auf `true`, bevor Sie eingehende Medien in Agent-Durchläufen erwarten.
- Die Wiederherstellung eingehender Nachrichten nach einem Neustart der Bridge/des Gateways erfolgt automatisch (GUID-Deduplizierung sowie eine Altersgrenze für veraltete Rückstände). Bestehende Konfigurationen mit `channels.imessage.catchup.enabled: true` werden weiterhin als veraltetes Kompatibilitätsprofil berücksichtigt; `catchup` ist standardmäßig deaktiviert.
- `channels.imessage.groups`: Gruppenregister und gruppenspezifische Einstellungen. Konfigurieren Sie bei `groupPolicy: "allowlist"` entweder explizite `chat_id`-Schlüssel oder einen Platzhaltereintrag `"*"`, damit Gruppennachrichten die Registerprüfung passieren können.
- Einträge der obersten Ebene in `bindings[]` mit `type: "acp"` können iMessage-Unterhaltungen an persistente ACP-Sitzungen binden. Verwenden Sie in `match.peer.id` ein normalisiertes Handle oder ein explizites Chat-Ziel (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`). Gemeinsame Feldsemantik: [ACP-Agenten](/de/tools/acp-agents#persistent-channel-bindings).

<Accordion title="Beispiel für einen iMessage-SSH-Wrapper">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix wird durch ein Plugin bereitgestellt und unter `channels.matrix` konfiguriert.

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

- Die Token-Authentifizierung verwendet `accessToken`; die Passwortauthentifizierung verwendet `userId` + `password`.
- `channels.matrix.proxy` leitet den Matrix-HTTP-Datenverkehr über einen expliziten HTTP(S)-Proxy. Benannte Konten können dies mit `channels.matrix.accounts.<id>.proxy` überschreiben.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` erlaubt private/interne Homeserver. `proxy` und diese Netzwerkfreigabe sind voneinander unabhängige Steuerelemente.
- `channels.matrix.defaultAccount` wählt das bevorzugte Konto in Konfigurationen mit mehreren Konten aus.
- `channels.matrix.autoJoin` ist standardmäßig `"off"`. Daher werden Einladungen zu Räumen und neue DM-ähnliche Einladungen ignoriert, bis Sie `autoJoin: "allowlist"` mit `autoJoinAllowlist` oder `autoJoin: "always"` festlegen.
- `channels.matrix.execApprovals`: Matrix-native Zustellung von Ausführungsgenehmigungen und Autorisierung der Genehmigenden.
  - `enabled`: `true`, `false` oder `"auto"` (Standard). Im automatischen Modus werden Ausführungsgenehmigungen aktiviert, wenn Genehmigende über `approvers` oder `commands.ownerAllowFrom` ermittelt werden können.
  - `approvers`: Matrix-Benutzer-IDs (z. B. `@owner:example.org`), die Ausführungsanfragen genehmigen dürfen.
  - `agentFilter`: optionale Zulassungsliste für Agent-IDs. Lassen Sie diese Option weg, um Genehmigungen für alle Agenten weiterzuleiten.
  - `sessionFilter`: optionale Muster für Sitzungsschlüssel (Teilzeichenfolge oder regulärer Ausdruck).
  - `target`: Ziel für Genehmigungsaufforderungen. `"dm"` (Standard), `"channel"` (ursprünglicher Raum) oder `"both"`.
  - Kontospezifische Überschreibungen: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` steuert, wie Matrix-Direktnachrichten zu Sitzungen gruppiert werden: `per-user` (Standard) verwendet eine gemeinsame Sitzung pro weitergeleitetem Kommunikationspartner, während `per-room` jeden Direktnachrichtenraum isoliert.
- Matrix-Statusprüfungen und Live-Verzeichnissuchen verwenden dieselbe Proxy-Richtlinie wie der Laufzeitdatenverkehr.
- Die vollständige Matrix-Konfiguration, Zieladressierungsregeln und Einrichtungsbeispiele sind unter [Matrix](/de/channels/matrix) dokumentiert.

### Microsoft Teams

Microsoft Teams wird durch ein Plugin bereitgestellt und unter `channels.msteams` konfiguriert.

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, team/channel policies:
      // siehe /channels/msteams
    },
  },
}
```

- Hier behandelte zentrale Schlüsselpfade: `channels.msteams`, `channels.msteams.configWrites`.
- Die vollständige Teams-Konfiguration (Anmeldedaten, Webhook, Direktnachrichten-/Gruppenrichtlinie sowie team- und kanalspezifische Überschreibungen) ist unter [Microsoft Teams](/de/channels/msteams) dokumentiert.

### IRC

IRC wird durch ein Plugin bereitgestellt und unter `channels.irc` konfiguriert.

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
- Das optionale `channels.irc.defaultAccount` überschreibt die standardmäßige Kontoauswahl, wenn es mit einer konfigurierten Konto-ID übereinstimmt.
- Die vollständige IRC-Kanalkonfiguration (Host/Port/TLS/Kanäle/Zulassungslisten/Erwähnungsprüfung) ist unter [IRC](/de/channels/irc) dokumentiert.

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
- Umgebungsvariablen-Token gelten nur für das **Standardkonto**.
- Die Basiseinstellungen des Kanals gelten für alle Konten, sofern sie nicht pro Konto überschrieben werden.
- Verwenden Sie `bindings[].match.accountId`, um jedes Konto an einen anderen Agenten weiterzuleiten.
- Wenn Sie über `openclaw channels add` (oder die Kanaleinrichtung) ein Konto hinzufügen, das nicht das Standardkonto ist, während weiterhin eine Kanalkonfiguration der obersten Ebene mit nur einem Konto verwendet wird, verschiebt OpenClaw zunächst die kontospezifischen Einzelkontowerte der obersten Ebene in die Kontozuordnung des Kanals, damit das ursprüngliche Konto weiterhin funktioniert. Die meisten Kanäle verschieben sie nach `channels.<channel>.accounts.default`; Matrix kann stattdessen ein vorhandenes übereinstimmendes benanntes/standardmäßiges Ziel beibehalten.
- Bestehende kanalweite Bindungen (ohne `accountId`) stimmen weiterhin mit dem Standardkonto überein; kontospezifische Bindungen bleiben optional.
- `openclaw doctor --fix` repariert auch gemischte Strukturen, indem kontospezifische Einzelkontowerte der obersten Ebene in das für diesen Kanal ausgewählte hochgestufte Konto verschoben werden. Die meisten Kanäle verwenden `accounts.default`; Matrix kann stattdessen ein vorhandenes übereinstimmendes benanntes/standardmäßiges Ziel beibehalten.

### Weitere Plugin-Kanäle

Viele Plugin-Kanäle werden als `channels.<id>` konfiguriert und auf ihren jeweiligen Kanalseiten dokumentiert (beispielsweise Feishu, LINE, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Twitch und Zalo).
Den vollständigen Kanalindex finden Sie unter: [Kanäle](/de/channels).

### Erwähnungsprüfung in Gruppenchats

Gruppennachrichten **erfordern standardmäßig eine Erwähnung** (Metadaten-Erwähnung oder sichere Regex-Muster). Dies gilt für Gruppenchats in WhatsApp, Telegram, Discord, Google Chat und iMessage.

Sichtbare Antworten werden separat gesteuert. Normale direkte Anfragen in Gruppen, Kanälen und dem internen WebChat verwenden standardmäßig die automatische endgültige Zustellung: Der endgültige Assistententext wird über den bisherigen Pfad für sichtbare Antworten veröffentlicht. Aktivieren Sie `messages.visibleReplies: "message_tool"` oder `messages.groupChat.visibleReplies: "message_tool"`, wenn sichtbare Ausgaben erst veröffentlicht werden sollen, nachdem der Agent `message(action=send)` aufgerufen hat. Wenn das Modell in einem aktivierten Nur-Tool-Modus eine inhaltlich gehaltvolle endgültige Antwort zurückgibt, ohne das Nachrichtenwerkzeug aufzurufen, bleibt dieser endgültige Text privat, das ausführliche Gateway-Protokoll zeichnet Metadaten zur unterdrückten Nutzlast auf und OpenClaw stellt einen Wiederherstellungsversuch in die Warteschlange, der das Modell auffordert, dieselbe Antwort über `message(action=send)` zuzustellen.

Nur über Tools sichtbare Antworten erfordern ein Modell/eine Laufzeit, das bzw. die Tools zuverlässig aufruft, und werden für gemeinsam genutzte Umgebungsräume auf Modellen der neuesten Generation wie GPT-5.6 Sol empfohlen. Einige schwächere Modelle können endgültigen Text ausgeben, verstehen jedoch nicht, dass für die Quelle sichtbare Ausgaben mit `message(action=send)` gesendet werden müssen. OpenClaw stellt den häufigen Fall einer nicht zugestellten endgültigen Antwort standardmäßig nur dann wieder her, wenn die endgültige Antwort inhaltlich gehaltvoll ist, der Quelldurchlauf kein Raumereignis war, die Senderichtlinie die Zustellung nicht verweigert hat und noch keine Antwort an die Quelle gesendet wurde. Die Wiederherstellung ist auf einen Versuch begrenzt; sie unterdrückt die Persistierung der synthetischen Wiederholungsaufforderung und schließt diesen Versuch von der Sammelverarbeitung aus, sodass er nicht mit unabhängigen Aufforderungen in der Warteschlange zusammengeführt werden kann. Wenn auch der Wiederholungsversuch nicht zugestellt oder nicht in die Warteschlange aufgenommen werden kann, liefert OpenClaw nur eine bereinigte Diagnose wie „Ich habe eine Antwort erstellt, konnte sie aber nicht an diesen Chat zustellen. Bitte versuchen Sie es erneut.“ Der ursprüngliche private endgültige Text wird niemals für eine automatische Zustellung an die Quelle markiert. Verwenden Sie für Modelle, bei denen Antworten wiederholt nicht zugestellt werden, `"automatic"`, damit der endgültige Assistentendurchlauf als Pfad für sichtbare Antworten dient, wechseln Sie zu einem leistungsfähigeren Modell mit Tool-Aufrufen, prüfen Sie das ausführliche Gateway-Protokoll auf die Zusammenfassung der unterdrückten Nutzlast oder legen Sie `messages.groupChat.visibleReplies: "automatic"` fest, um für jede Gruppen-/Kanalanfrage sichtbare endgültige Antworten zu verwenden.

Wenn das Nachrichtenwerkzeug gemäß der aktiven Tool-Richtlinie nicht verfügbar ist, greift OpenClaw auf automatische sichtbare Antworten zurück, anstatt die Antwort stillschweigend zu unterdrücken. `openclaw doctor` warnt vor dieser Abweichung.

Diese Regel gilt für den normalen endgültigen Text des Agenten. Plugin-eigene Unterhaltungsbindungen verwenden bei beanspruchten Durchläufen gebundener Threads die vom zuständigen Plugin zurückgegebene Antwort als sichtbare Antwort; das Plugin muss für diese Bindungsantworten nicht `message(action=send)` aufrufen.

**Fehlerbehebung: Eine @Erwähnung in einer Gruppe löst die Tippanzeige aus, danach folgt Stille (kein Fehler)**

Symptom: Eine @Erwähnung in einer Gruppe/einem Kanal zeigt die Tippanzeige an und das Gateway-Protokoll meldet `dispatch complete (queuedFinal=false, replies=0)`, aber im Raum erscheint keine Nachricht. Direktnachrichten an denselben Agenten werden normal beantwortet.

Ursache: Der Modus für sichtbare Antworten der Gruppe/des Kanals wird als `"message_tool"` aufgelöst. OpenClaw führt den Durchlauf daher aus, unterdrückt jedoch den endgültigen Assistententext, sofern der Agent nicht `message(action=send)` aufruft. In diesem Modus gibt es keinen `NO_REPLY`-Vertrag; ohne Aufruf des Nachrichtenwerkzeugs bleibt der ursprüngliche endgültige Text privat. Für inhaltlich gehaltvolle Quelldurchläufe versucht OpenClaw nun einen abgesicherten Wiederherstellungsversuch; kurze Hinweise, ausdrücklich gewünschtes Schweigen, Raumereignisse, durch die Senderichtlinie verweigerte Durchläufe und bereits zugestellte Durchläufe werden nicht erneut versucht. Normale Gruppen- und Kanaldurchläufe verwenden standardmäßig `"automatic"`. Dieses Symptom tritt daher nur auf, wenn `messages.groupChat.visibleReplies` (oder das globale `messages.visibleReplies`) explizit auf `"message_tool"` gesetzt ist. `defaultVisibleReplies` des Testsystems gilt hier nicht — die Gruppen-/Kanalauflösung ignoriert diese Einstellung; sie wirkt sich nur auf direkte/Quellchats aus (das Codex-Testsystem unterdrückt auf diese Weise endgültige Antworten in direkten Chats).

Fehlerbehebung: Wählen Sie entweder ein leistungsfähigeres Modell für Tool-Aufrufe, entfernen Sie die explizite Überschreibung `"message_tool"`, um auf den Standardwert `"automatic"` zurückzufallen, oder setzen Sie `messages.groupChat.visibleReplies: "automatic"`, um sichtbare Antworten für jede Gruppen-/Kanalanfrage zu erzwingen. Ein inhaltlich relevantes, nicht zugestelltes Endergebnis sollte nicht mehr als stiller Erfolg enden; stattdessen sollte entweder eine Wiederherstellung durch einen erneuten `message(action=send)`-Versuch erfolgen oder die bereinigte Diagnose des Zustellungsfehlers angezeigt werden. Der Gateway lädt die `messages`-Konfiguration nach dem Speichern der Datei zur Laufzeit neu; starten Sie den Gateway nur neu, wenn die Dateiüberwachung oder das Neuladen der Konfiguration in der Bereitstellung deaktiviert ist.

**Erwähnungstypen:**

- **Metadaten-Erwähnungen**: Native @-Erwähnungen der Plattform. Werden im WhatsApp-Selbstchat-Modus ignoriert.
- **Textmuster**: Sichere reguläre Ausdrücke in `agents.list[].groupChat.mentionPatterns`. Ungültige Muster und unsichere verschachtelte Wiederholungen werden ignoriert.
- Die Erwähnungsbeschränkung wird nur durchgesetzt, wenn eine Erkennung möglich ist (native Erwähnungen oder mindestens ein Muster).

```json5
{
  messages: {
    visibleReplies: "automatic", // alte automatische Endantworten für Direkt-/Quellchats erzwingen
    groupChat: {
      historyLimit: 50,
      unmentionedInbound: "room_event", // dauerhaft aktives, nicht erwähnendes Raumgespräch wird zu stillem Kontext
      visibleReplies: "message_tool", // Opt-in; message(action=send) für sichtbare Raumantworten voraussetzen
    },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` legt den globalen Standardwert fest. Kanäle können ihn mit `channels.<channel>.historyLimit` (oder pro Konto) überschreiben. Setzen Sie ihn zum Deaktivieren auf `0`.

`messages.groupChat.unmentionedInbound: "room_event"` übermittelt nicht erwähnende Nachrichten aus dauerhaft aktiven Gruppen/Kanälen auf unterstützten Kanälen als stillen Raumkontext. Nachrichten mit Erwähnungen, Befehle und Direktnachrichten bleiben Benutzeranfragen. Vollständige Beispiele für Discord, Slack und Telegram finden Sie unter [Umgebungsbezogene Raumereignisse](/de/channels/ambient-room-events).

`messages.visibleReplies` ist der globale Standardwert für Quellereignisse; `messages.groupChat.visibleReplies` überschreibt ihn für Quellereignisse aus Gruppen/Kanälen. Wenn `messages.visibleReplies` nicht gesetzt ist, verwenden Direkt-/Quellchats den Standardwert der ausgewählten Laufzeit oder Testumgebung, interne direkte WebChat-Interaktionen verwenden jedoch die automatische Zustellung der Endantwort, um die Prompt-Parität zwischen Pi und Codex sicherzustellen. Setzen Sie `messages.visibleReplies: "message_tool"`, um für sichtbare Ausgaben ausdrücklich `message(action=send)` vorauszusetzen. Kanal-Zulassungslisten und die Erwähnungsbeschränkung bestimmen weiterhin, ob ein Ereignis verarbeitet wird.

#### Verlaufsgrenzen für Direktnachrichten

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

Auflösung: Außerkraftsetzung pro Direktnachricht → Provider-Standardwert → keine Begrenzung (alle werden beibehalten).

Dieser Resolver liest `channels.<provider>.dmHistoryLimit` und `channels.<provider>.dms.<id>.historyLimit` für jeden Kanal, dessen Sitzungsschlüssel der Standardform `provider:direct:<id>` (oder der veralteten Form `provider:dm:<id>`) entspricht. Daher funktioniert er sowohl für gebündelte als auch für Plugin-Kanäle und nicht nur für eine feste Liste.

#### Selbstchat-Modus

Nehmen Sie Ihre eigene Nummer in `allowFrom` auf, um den Selbstchat-Modus zu aktivieren (native @-Erwähnungen werden ignoriert, es wird nur auf Textmuster reagiert):

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

### Befehle (Verarbeitung von Chatbefehlen)

```json5
{
  commands: {
    native: "auto", // native Befehle registrieren, wenn unterstützt
    nativeSkills: "auto", // native Skills-Befehle registrieren, wenn unterstützt
    text: true, // /Befehle in Chatnachrichten parsen
    bash: false, // ! zulassen (Alias: /bash)
    bashForegroundMs: 2000,
    config: false, // /config zulassen
    mcp: false, // /mcp zulassen
    plugins: false, // /plugins zulassen
    debug: false, // /debug zulassen
    restart: true, // /restart und das Tool zum Neustart des Gateways zulassen
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

- Dieser Block konfiguriert die Befehlsoberflächen. Den aktuellen Katalog integrierter und gebündelter Befehle finden Sie unter [Slash-Befehle](/de/tools/slash-commands).
- Diese Seite ist eine **Referenz für Konfigurationsschlüssel**, nicht der vollständige Befehlskatalog. Kanal-/Plugin-eigene Befehle wie QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, Gerätekopplung `/pair`, Speicher `/dreaming`, Telefonsteuerung `/phone` und Talk `/voice` sind auf den jeweiligen Kanal-/Plugin-Seiten sowie unter [Slash-Befehle](/de/tools/slash-commands) dokumentiert.
- Textbefehle müssen **eigenständige** Nachrichten mit vorangestelltem `/` sein.
- `native: "auto"` aktiviert native Befehle für Discord/Telegram und lässt sie für Slack deaktiviert.
- `nativeSkills: "auto"` aktiviert native Skills-Befehle für Discord/Telegram und lässt sie für Slack deaktiviert.
- Außerkraftsetzung pro Kanal: `channels.discord.commands.native` (boolescher Wert oder `"auto"`). Bei Discord überspringt `false` die Registrierung und Bereinigung nativer Befehle beim Start.
- Überschreiben Sie die Registrierung nativer Skills pro Kanal mit `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` fügt zusätzliche Einträge zum Telegram-Bot-Menü hinzu.
- `bash: true` aktiviert `! <cmd>` für die Host-Shell. Erfordert `tools.elevated.enabled` und den Absender in `tools.elevated.allowFrom.<channel>`.
- `config: true` aktiviert `/config` (liest/schreibt `openclaw.json`). Für Gateway-Clients von `chat.send` erfordern dauerhafte Schreibvorgänge mit `/config set|unset` zusätzlich `operator.admin`; das schreibgeschützte `/config show` bleibt für reguläre Operator-Clients mit Schreibberechtigung verfügbar.
- `mcp: true` aktiviert `/mcp` für die von OpenClaw verwaltete MCP-Serverkonfiguration unter `mcp.servers`.
- `plugins: true` aktiviert `/plugins` für die Plugin-Suche, Installation sowie Steuerelemente zum Aktivieren/Deaktivieren.
- `channels.<provider>.configWrites` steuert Konfigurationsänderungen pro Kanal (Standardwert: true).
- Bei Kanälen mit mehreren Konten steuert `channels.<provider>.accounts.<id>.configWrites` außerdem Schreibvorgänge, die auf dieses Konto abzielen (zum Beispiel `/allowlist --config --account <id>` oder `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` deaktiviert `/restart` und Aktionen des Tools zum Neustart des Gateways. Standardwert: `true`.
- `ownerAllowFrom` ist die explizite Eigentümer-Zulassungsliste für ausschließlich Eigentümern vorbehaltene Befehle und eigentümerbeschränkte Kanalaktionen. Sie ist von `allowFrom` getrennt.
- `ownerDisplay: "hash"` hasht Eigentümer-IDs im System-Prompt. Legen Sie mit `ownerDisplaySecret` die Hash-Bildung fest.
- `allowFrom` gilt pro Provider. Wenn es gesetzt ist, ist es die **einzige** Autorisierungsquelle (Kanal-Zulassungslisten/Kopplung und `useAccessGroups` werden ignoriert).
- `useAccessGroups: false` ermöglicht Befehlen, Zugriffsgruppenrichtlinien zu umgehen, wenn `allowFrom` nicht gesetzt ist.
- Übersicht der Befehlsdokumentation:
  - integrierter und gebündelter Katalog: [Slash-Befehle](/de/tools/slash-commands)
  - kanalspezifische Befehlsoberflächen: [Kanäle](/de/channels)
  - QQ-Bot-Befehle: [QQ Bot](/de/channels/qqbot)
  - Kopplungsbefehle: [Kopplung](/de/channels/pairing)
  - LINE-Kartenbefehl: [LINE](/de/channels/line)
  - Speicher-Dreaming: [Dreaming](/de/concepts/dreaming)

</Accordion>

---

## Verwandte Themen

- [Konfigurationsreferenz](/de/gateway/configuration-reference) — Schlüssel der obersten Ebene
- [Konfiguration — Agenten](/de/gateway/config-agents)
- [Kanalübersicht](/de/channels)
