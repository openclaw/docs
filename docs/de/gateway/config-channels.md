---
read_when:
    - Konfiguration eines Kanal-Plugins (Authentifizierung, Zugriffskontrolle, mehrere Konten)
    - Fehlerbehebung bei kanalspezifischen Konfigurationsschlüsseln
    - Prüfung von Direktnachrichtenrichtlinie, Gruppenrichtlinie oder Erwähnungssteuerung
summary: 'Kanalkonfiguration: Zugriffskontrolle, Kopplung und kanalspezifische Schlüssel für Slack, Discord, Telegram, WhatsApp, Matrix, iMessage und weitere Kanäle'
title: Konfiguration — Kanäle
x-i18n:
    generated_at: "2026-07-24T05:02:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e346648287d275d84a9c082a3bb13edaee751d53546d8231dcf1525bf9adafc2
    source_path: gateway/config-channels.md
    workflow: 16
---

Konfigurationsschlüssel pro Kanal unter `channels.*`: DM- und Gruppenzugriff, Konfigurationen mit mehreren Konten, Erwähnungssteuerung sowie kanalspezifische Schlüssel für Slack, Discord, Telegram, WhatsApp, Matrix, iMessage und andere Kanal-Plugins.

Informationen zu Agenten, Tools, Gateway-Laufzeit und anderen Schlüsseln der obersten Ebene finden Sie in der [Konfigurationsreferenz](/de/gateway/configuration-reference).

## Kanäle

Jeder Kanal startet automatisch, sobald sein Konfigurationsabschnitt vorhanden ist (sofern nicht `enabled: false`). Telegram und iMessage sind im Kernpaket `openclaw` enthalten. Andere offizielle Kanäle (Discord, Slack, WhatsApp, Matrix, Microsoft Teams, IRC, Google Chat, Signal, Mattermost und weitere) werden mit `openclaw plugins install <spec>` als separate Plugins installiert; die vollständige Liste und Installationsangaben finden Sie unter [Kanäle](/de/channels).

### DM- und Gruppenzugriff

Alle Kanäle unterstützen Richtlinien für DMs und Gruppen:

| DM-Richtlinie           | Verhalten                                                        |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (Standard) | Unbekannte Absender erhalten einmalig einen Kopplungscode; der Eigentümer muss die Kopplung genehmigen |
| `allowlist`         | Nur Absender in `allowFrom` (oder im Speicher gekoppelter zulässiger Absender)             |
| `open`              | Alle eingehenden DMs zulassen (erfordert `allowFrom: ["*"]`)             |
| `disabled`          | Alle eingehenden DMs ignorieren                                          |

| Gruppenrichtlinie          | Verhalten                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (Standard) | Nur Gruppen, die der konfigurierten Zulassungsliste entsprechen          |
| `open`                | Gruppenzulassungslisten umgehen (Erwähnungssteuerung gilt weiterhin) |
| `disabled`            | Alle Gruppen-/Raumnachrichten blockieren                          |

<Note>
`channels.defaults.groupPolicy` legt den Standard fest, wenn `groupPolicy` eines Providers nicht gesetzt ist.
Kopplungscodes laufen nach 1 Stunde ab. Ausstehende Kopplungsanfragen sind auf **3 pro Konto** begrenzt (je Kanal und Konto-ID).
Fehlt ein Provider-Block vollständig (`channels.<provider>` nicht vorhanden), fällt die Gruppenrichtlinie zur Laufzeit mit einer Startwarnung auf `allowlist` zurück (standardmäßig geschlossen).
</Note>

### Kanalspezifische Modellüberschreibungen

Verwenden Sie `channels.modelByChannel`, um bestimmte Kanal-IDs oder DM-Gesprächspartner einem Modell fest zuzuordnen. Als Werte werden `provider/model` oder konfigurierte Modellaliase akzeptiert. Die Kanalzuordnung gilt nur, wenn für eine Sitzung nicht bereits eine aktive Modellüberschreibung vorhanden ist (beispielsweise eine über `/model` festgelegte).

Bei Gruppen-/Thread-Unterhaltungen sind die Schlüssel kanalspezifische Gruppen-IDs, Themen-IDs oder Kanalnamen. Bei DM-Unterhaltungen sind die Schlüssel Kennungen des Gesprächspartners, die aus der Absenderidentität des Kanals abgeleitet werden (`nativeDirectUserId`, `origin.from`, `origin.to`, `OriginatingTo`, `From` oder `SenderId`). Die genaue Form des Schlüssels hängt vom Kanal ab:

| Kanal  | Form des DM-Schlüssels         | Beispiel                                      |
| -------- | ------------------- | -------------------------------------------- |
| Discord  | unverarbeitete Benutzer-ID         | `987654321`                                  |
| Feishu   | `feishu:ou_...`     | `feishu:ou_a8b6cab7e945387de5f253775d9b4d85` |
| Matrix   | Matrix-Benutzer-ID      | `@user:matrix.org`                           |
| Slack    | `user:U...`         | `user:U12345`                                |
| Telegram | unverarbeitete Benutzer-ID         | `123456789`                                  |
| WhatsApp | Telefonnummer oder JID | `15551234567`                                |

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

DM-spezifische Schlüssel stimmen nur in DM-Unterhaltungen überein; sie wirken sich nicht auf das Routing von Gruppen/Threads aus.

### Kanalstandards und Heartbeat

Verwenden Sie `channels.defaults` für gemeinsame Gruppenrichtlinien, implizite Erwähnungen und das Heartbeat-Verhalten aller Provider:

```json5
{
  channels: {
    defaults: {
      groupPolicy: "allowlist", // open | allowlist | disabled
      contextVisibility: "all", // all | allowlist | allowlist_quote
      implicitMentions: {
        replyToBot: true,
        quotedBot: true,
        threadParticipation: true,
      },
      heartbeat: {
        showOk: false,
        showAlerts: true,
        useIndicator: true,
      },
    },
  },
}
```

- `channels.defaults.groupPolicy`: Ersatz-Gruppenrichtlinie, wenn `groupPolicy` auf Provider-Ebene nicht gesetzt ist.
- `channels.defaults.contextVisibility`: standardmäßiger Modus für die Sichtbarkeit ergänzender Kontexte aller Kanäle. Werte: `all` (Standard, alle zitierten sowie Thread- und Verlaufskontexte einschließen), `allowlist` (nur Kontext von Absendern auf der Zulassungsliste einschließen), `allowlist_quote` (wie die Zulassungsliste, jedoch expliziten Zitat-/Antwortkontext beibehalten). Kanalspezifische Überschreibung: `channels.<channel>.contextVisibility`.
- `channels.defaults.implicitMentions`: steuert, welche unterstützten eingehenden Merkmale als Erwähnungen gelten. `replyToBot`, `quotedBot` und `threadParticipation` verwenden jeweils standardmäßig `true`, wodurch das aktuelle Verhalten beibehalten wird. Überschreiben Sie dies pro Kanal mit `channels.<channel>.implicitMentions` oder pro Konto mit `channels.<channel>.accounts.<id>.implicitMentions`; jedes Flag wird unabhängig in der Reihenfolge Konto -> Kanal -> Standards aufgelöst. Die Namen sind positiv formuliert: Setzen Sie ein Flag auf `false`, damit dieses Merkmal die Erwähnungssteuerung nicht mehr umgeht. Native explizite Erwähnungen sind immer zulässig, und ein Flag hat keine Wirkung, wenn der Kanal das entsprechende Merkmal nicht erzeugt. Die aktuelle Erzeugermatrix finden Sie unter [Erwähnungssteuerung](/de/channels/groups#mention-gating-default). Diese Einstellungen ändern weder ausgehende Antwort-/Thread-Modi noch die Verarbeitung autorisierter Befehle.
- `channels.defaults.heartbeat.showOk`: fehlerfreie Kanalstatus in die Heartbeat-Ausgabe aufnehmen (Standard: `false`).
- `channels.defaults.heartbeat.showAlerts`: beeinträchtigte Status und Fehlerstatus in die Heartbeat-Ausgabe aufnehmen (Standard: `true`).
- `channels.defaults.heartbeat.useIndicator`: kompakte Heartbeat-Ausgabe im Indikatorstil darstellen (Standard: `true`).

### WhatsApp

WhatsApp wird über den Webkanal des Gateways (Baileys Web) ausgeführt. Es startet automatisch, sobald eine verknüpfte Sitzung vorhanden ist.

```json5
{
  web: {
    enabled: true,
  },
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      streaming: { chunkMode: "length" }, // length | newline
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

- Einträge der obersten Ebene in `bindings[]` mit `type: "acp"` konfigurieren dauerhafte ACP-Bindungen für WhatsApp-DMs und -Gruppen. Verwenden Sie in `match.peer.id` eine direkte Nummer im E.164-Format oder eine WhatsApp-Gruppen-JID. Die Feldsemantik wird unter [ACP-Agenten](/de/tools/acp-agents#persistent-channel-bindings) gemeinsam beschrieben.

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

- Ausgehende Befehle verwenden standardmäßig das Konto `default`, sofern es vorhanden ist; andernfalls die erste konfigurierte Konto-ID (sortiert).
- Das optionale `channels.whatsapp.defaultAccount` überschreibt diese ersatzweise Standardkontoauswahl, wenn es einer konfigurierten Konto-ID entspricht.
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
      streaming: { mode: "partial" }, // off | partial | block | progress (default: partial)
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
      trustedLocalFileRoots: ["/srv/telegram-bot-api-data"],
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```

- Bot-Token: `channels.telegram.botToken` oder `channels.telegram.tokenFile` (nur reguläre Datei; symbolische Links werden abgelehnt), mit `TELEGRAM_BOT_TOKEN` als Ersatz für das Standardkonto.
- `apiRoot` ist ausschließlich die Wurzel der Telegram Bot API. Verwenden Sie `https://api.telegram.org` oder die Wurzel Ihres selbst gehosteten Servers/Proxys, nicht `https://api.telegram.org/bot<TOKEN>`; `openclaw doctor --fix` entfernt ein versehentlich angehängtes Suffix `/bot<TOKEN>`.
- Für einen selbst gehosteten Bot-API-Server im Modus `--local` listet `trustedLocalFileRoots` Hostpfade auf, die OpenClaw lesen darf. Binden Sie das Daten-Volume des Servers auf dem OpenClaw-Host ein und konfigurieren Sie entweder dessen Datenstammverzeichnis oder das Verzeichnis pro Token; Containerpfade unter `/var/lib/telegram-bot-api` werden diesen Stammverzeichnissen zugeordnet. Andere absolute Pfade werden weiterhin abgelehnt.
- Das optionale `channels.telegram.defaultAccount` überschreibt die Standardkontoauswahl, wenn es einer konfigurierten Konto-ID entspricht.
- Legen Sie bei Konfigurationen mit mehreren Konten (2+ Konto-IDs) einen expliziten Standard fest (`channels.telegram.defaultAccount` oder `channels.telegram.accounts.default`), um ersatzweises Routing zu vermeiden; `openclaw doctor` warnt, wenn dieser fehlt oder ungültig ist.
- `configWrites: false` blockiert von Telegram initiierte Konfigurationsschreibvorgänge (Migrationen von Supergruppen-IDs, `/config set|unset`).
- Einträge der obersten Ebene in `bindings[]` mit `type: "acp"` konfigurieren dauerhafte ACP-Bindungen für Forenthemen (verwenden Sie das kanonische `chatId:topic:topicId` in `match.peer.id`). Die Feldsemantik wird unter [ACP-Agenten](/de/tools/acp-agents#persistent-channel-bindings) gemeinsam beschrieben.
- Telegram-Streamingvorschauen verwenden `sendMessage` + `editMessageText` (funktioniert in Direkt- und Gruppenchats).
- `network.dnsResultOrder` verwendet standardmäßig `"ipv4first"`, um häufige IPv6-Abruffehler zu vermeiden.
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
      streaming: {
        mode: "progress", // off | partial | block | progress (Discord default: progress)
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

- Token: `channels.discord.token`, mit `DISCORD_BOT_TOKEN` als Fallback für das Standardkonto.
- Direkte ausgehende Aufrufe, die ein explizites Discord-`token` angeben, verwenden dieses Token für den Aufruf; die Wiederholungs-/Richtlinieneinstellungen des Kontos stammen weiterhin aus dem ausgewählten Konto im aktiven Runtime-Snapshot.
- Optional überschreibt `channels.discord.defaultAccount` die Auswahl des Standardkontos, wenn es mit einer konfigurierten Konto-ID übereinstimmt.
- Verwenden Sie `user:<id>` (DM) oder `channel:<id>` (Guild-Kanal) für Zustellungsziele; reine numerische IDs werden abgelehnt.
- Guild-Slugs werden kleingeschrieben, wobei Leerzeichen durch `-` ersetzt werden; Kanalschlüssel verwenden den als Slug formatierten Namen (ohne `#`). Guild-IDs sind vorzuziehen.
- Von Bots verfasste Nachrichten werden standardmäßig ignoriert. `allowBots: true` aktiviert sie; verwenden Sie `allowBots: "mentions"`, um nur Bot-Nachrichten zu akzeptieren, die den Bot erwähnen (eigene Nachrichten werden weiterhin herausgefiltert).
- Kanäle, die eingehende, von Bots verfasste Nachrichten unterstützen, können den gemeinsamen [Bot-Schleifenschutz](/de/channels/bot-loop-protection) verwenden. Legen Sie `channels.defaults.botLoopProtection` für grundlegende Paarbudgets fest und überschreiben Sie anschließend den Kanal oder das Konto nur, wenn eine Oberfläche andere Limits benötigt.
- `channels.discord.guilds.<id>.ignoreOtherMentions` (und Kanalüberschreibungen) verwirft Nachrichten, die einen anderen Benutzer oder eine andere Rolle, aber nicht den Bot erwähnen (ausgenommen @everyone/@here).
- `channels.discord.mentionAliases` ordnet stabilen ausgehenden `@handle`-Text vor dem Senden Discord-Benutzer-IDs zu, sodass bekannte Teammitglieder deterministisch erwähnt werden können, selbst wenn der temporäre Verzeichnis-Cache leer ist. Kontospezifische Überschreibungen befinden sich unter `channels.discord.accounts.<accountId>.mentionAliases`.
- `maxLinesPerMessage` (Standardwert `17`) teilt hohe Nachrichten auch dann auf, wenn sie weniger als 2000 Zeichen enthalten.
- `channels.discord.suppressEmbeds` verwendet standardmäßig `true`, sodass ausgehende URLs nicht als Discord-Linkvorschauen erweitert werden, sofern dies nicht deaktiviert wird. Explizite `embeds`-Payloads werden weiterhin normal gesendet; Tool-Aufrufe pro Nachricht können dies mit `suppressEmbeds` überschreiben.
- `channels.discord.threadBindings` steuert das an Discord-Threads gebundene Routing:
  - `enabled`: Discord-Überschreibung für an Threads gebundene Sitzungsfunktionen (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` sowie gebundene Zustellung/Routing)
  - `idleHours`: Discord-Überschreibung für die automatische Aufhebung des Fokus bei Inaktivität in Stunden (`0` deaktiviert dies)
  - `maxAgeHours`: Discord-Überschreibung für das absolute Höchstalter in Stunden (`0` deaktiviert dies)
  - `spawnSessions`: Schalter für `sessions_spawn({ thread: true })` und die automatische Thread-Erstellung/-Bindung beim Erzeugen von ACP-Threads (Standardwert: `true`)
  - `defaultSpawnContext`: nativer Subagent-Kontext für an Threads gebundene Erzeugungen (standardmäßig `"fork"`)
- Einträge der obersten Ebene unter `bindings[]` mit `type: "acp"` konfigurieren persistente ACP-Bindungen für Kanäle und Threads (verwenden Sie die Kanal-/Thread-ID in `match.peer.id`). Die Feldsemantik wird unter [ACP-Agenten](/de/tools/acp-agents#persistent-channel-bindings) gemeinsam beschrieben.
- `channels.discord.ui.components.accentColor` legt die Akzentfarbe für Discord-Komponenten-v2-Container fest.
- `channels.discord.agentComponents.ttlMs` steuert, wie lange Callbacks gesendeter Discord-Komponenten registriert bleiben. Standardwert `1800000` (30 Minuten), maximal `86400000` (24 Stunden). Kontospezifische Überschreibungen befinden sich unter `channels.discord.accounts.<accountId>.agentComponents.ttlMs`. Verwenden Sie vorzugsweise die kürzeste TTL, die zum Workflow passt.
- `channels.discord.voice` aktiviert Unterhaltungen in Discord-Sprachkanälen sowie optionale Überschreibungen für automatisches Beitreten, LLM und TTS. Reine Textkonfigurationen für Discord lassen Sprache standardmäßig deaktiviert; setzen Sie `channels.discord.voice.enabled=true`, um sie zu aktivieren.
- `channels.discord.voice.model` überschreibt optional das LLM-Modell, das für Antworten in Discord-Sprachkanälen verwendet wird.
- `channels.discord.voice.daveEncryption` (Standardwert `true`) und `channels.discord.voice.decryptionFailureTolerance` (Standardwert `24`) werden an die DAVE-Optionen von `@discordjs/voice` weitergegeben.
- `channels.discord.voice.connectTimeoutMs` steuert die anfängliche Wartezeit auf den `@discordjs/voice`-Ready-Status für `/vc join` und Versuche zum automatischen Beitreten (Standardwert `30000`).
- `channels.discord.voice.reconnectGraceMs` steuert, wie lange eine getrennte Sprachsitzung benötigen darf, um in die Signalisierung für die Wiederverbindung überzugehen, bevor OpenClaw sie beendet (Standardwert `15000`).
- Die Discord-Sprachwiedergabe wird nicht durch das Ereignis für den Sprechbeginn eines anderen Benutzers unterbrochen. Um Rückkopplungsschleifen zu vermeiden, ignoriert OpenClaw neue Sprachaufnahmen, während TTS wiedergegeben wird.
- OpenClaw versucht zusätzlich, den Sprachempfang wiederherzustellen, indem es nach wiederholten Entschlüsselungsfehlern eine Sprachsitzung verlässt und ihr erneut beitritt.
- `channels.discord.streaming` ist der kanonische Schlüssel für den Stream-Modus. Discord verwendet standardmäßig `streaming.mode: "progress"`, sodass der Tool-/Arbeitsfortschritt in einer einzigen bearbeiteten Vorschaunachricht erscheint; setzen Sie `streaming.mode: "off"`, um dies zu deaktivieren. Veraltete flache Schlüssel (`streamMode`, `chunkMode`, `blockStreaming`, `draftChunk`, `blockStreamingCoalesce`) werden zur Laufzeit nicht mehr gelesen; führen Sie `openclaw doctor --fix` aus, um die persistierte Konfiguration zu migrieren.
- `channels.discord.autoPresence` ordnet die Runtime-Verfügbarkeit der Bot-Präsenz zu (fehlerfrei => online, beeinträchtigt => idle, erschöpft => dnd) und ermöglicht optionale Überschreibungen des Statustextes.
- `channels.discord.guilds.<id>.presenceEvents` leitet Verfügbarkeitsereignisse von Personen als Agent-Systemereignisse an einen konfigurierten Discord-Kanal weiter. Berechtigte Mitglieder müssen `channelId` sehen können; öffentliche Threads übernehmen die Sichtbarkeit des übergeordneten Elements, während private Threads zusätzlich eine Mitgliedschaft oder Manage Threads erfordern. `users` kann diese Zielgruppe weiter einschränken. Die Funktion initialisiert aktuell angemeldete Mitglieder anhand vollständiger `GUILD_CREATE`-Snapshots, leitet beobachtete Übergänge von offline zu online weiter und behandelt ein erstes späteres Online-Signal für ein bislang unbekanntes Mitglied als neu verfügbar, ohne zu behaupten, ob die Person online gegangen oder erst nach dem Snapshot beigetreten ist. Guilds oberhalb des Discord-Snapshot-Limits von 75.000 Mitgliedern benötigen zunächst ein explizites Offline-Update. Drosselungsoptionen: `reconnectSuppressSeconds` (Ruhefenster nach einer neuen Gateway-Sitzung, während der Guild-Präsenzstatus neu aufgebaut wird; Standardwert 300, `0` deaktiviert dies) und `burstLimit`/`burstWindowSeconds` (Ratenbegrenzung erfolgreich eingereihter Ereignisse pro Guild; standardmäßig 8 Ereignisse pro gleitendem 60s-Fenster). Fortgesetzte Sitzungen starten das Unterdrückungsfenster für Wiederverbindungen nicht. Die bestehende erneute Begrüßungssperre pro Benutzer bleibt bei acht Stunden. Erforderlich sind `channels.discord.intents.presence=true`, der privilegierte Presence Intent im Developer Portal von Discord sowie ein aktivierter Agent-Heartbeat.
- `channels.discord.dangerouslyAllowNameMatching` aktiviert den veränderlichen Abgleich von Namen/Tags erneut (Notfall-Kompatibilitätsmodus).
- `channels.discord.execApprovals`: Discord-native Zustellung von Ausführungsgenehmigungen und Autorisierung der Genehmigenden.
  - `enabled`: `true`, `false` oder `"auto"` (Standardwert). Im automatischen Modus werden Ausführungsgenehmigungen aktiviert, wenn Genehmigende anhand von `approvers` oder `commands.ownerAllowFrom` aufgelöst werden können.
  - `approvers`: Discord-Benutzer-IDs, die Ausführungsanfragen genehmigen dürfen. Fällt bei Auslassung auf `commands.ownerAllowFrom` zurück.
  - `agentFilter`: optionale Zulassungsliste für Agent-IDs. Lassen Sie sie weg, um Genehmigungen für alle Agenten weiterzuleiten.
  - `sessionFilter`: optionale Muster für Sitzungsschlüssel (Teilzeichenfolge oder regulärer Ausdruck).
  - `target`: wohin Genehmigungsaufforderungen gesendet werden. `"dm"` (Standardwert) sendet sie an die DMs der Genehmigenden, `"channel"` sendet sie an den ursprünglichen Kanal, `"both"` sendet sie an beide. Wenn das Ziel `"channel"` einschließt, können die Schaltflächen nur von aufgelösten Genehmigenden verwendet werden.
  - `cleanupAfterResolve`: Wenn `true`, werden Genehmigungs-DMs nach Genehmigung, Ablehnung oder Zeitüberschreitung gelöscht.

**Benachrichtigungsmodi für Reaktionen:** `off` (keine), `own` (Nachrichten des Bots, Standardwert), `all` (alle Nachrichten), `allowlist` (von `guilds.<id>.users` bei allen Nachrichten).

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
      dmPolicy: "pairing",
      allowFrom: ["users/1234567890"],
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
- `serviceAccount` akzeptiert direkt eine SecretRef.
- Umgebungs-Fallbacks: `GOOGLE_CHAT_SERVICE_ACCOUNT` oder `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE` (nur Standardkonto).
- Verwenden Sie `spaces/<spaceId>` oder `users/<userId>` für Zustellungsziele.
- `channels.googlechat.dangerouslyAllowNameMatching` aktiviert den veränderlichen Abgleich von E-Mail-Principals erneut (Notfall-Kompatibilitätsmodus).

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

- Der **Socket-Modus** erfordert sowohl `botToken` als auch `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` für den Env-Fallback des Standardkontos).
- Der **HTTP-Modus** erfordert `botToken` sowie `signingSecret` (auf Stammebene oder pro Konto).
- Die **Benutzeridentität** (`identity: "user"`) veröffentlicht und liest als autorisierende Person. Sie erfordert `userToken` sowie `appToken` im Socket-Modus oder `userToken` sowie `signingSecret` im HTTP-Modus. Weder ein Bot-Token noch ein Bot-Benutzer ist erforderlich. Unter [Benutzeridentität](/de/channels/slack#user-identity-post-as-a-real-person) finden Sie Benutzerbereiche und Ereignisabonnements.
- `enterpriseOrgInstall: true` aktiviert für ein Konto den organisationsweiten
  Ereignispfad von Slack Enterprise Grid. Beim Start wird das Bot-Token mit `auth.test` überprüft;
  der Start schlägt fehl, wenn der konfigurierte Modus nicht mit der Installationsidentität von Slack übereinstimmt.
  Enterprise-DMs müssen deaktiviert sein oder `dmPolicy: "open"` mit einem wirksamen
  `allowFrom: ["*"]` verwenden. Kanal- und Benutzerrichtlinien müssen stabile Slack-IDs verwenden;
  veränderliche Namen und nicht unterstützte Kanalpräfixe führen zu einem Startfehler. V1 verarbeitet nur
  direkte Socket-Modus- oder HTTP-Ereignisse vom Typ `message` und `app_mention` mit sofortigen
  Antworten; Relay, Befehle, Interaktionen, App Home, Listener für Reaktionsereignisse,
  Pins, Aktionswerkzeuge, native Genehmigungen, Bindungen, verzögerte Zustellung und
  proaktive Sendungen sind nicht verfügbar. Listener-eigene Bestätigungen, Tippanzeigen und
  Statusreaktionen bleiben mit `reactions:write` verfügbar; eingehende
  Reaktionsbenachrichtigungen und Reaktionsaktionswerkzeuge sind nicht verfügbar. Unter
  [Organisationsweite Installationen in Enterprise Grid](/de/channels/slack#enterprise-grid-org-wide-installs)
  finden Sie das Manifest mit den geringsten Berechtigungen, den Einrichtungsablauf und sämtliche Einschränkungen.
- `socketMode` leitet die Transportabstimmung des Slack SDK für den Socket-Modus an die öffentliche Bolt-Receiver-API weiter. Verwenden Sie dies nur zur Untersuchung von Ping-/Pong-Zeitüberschreitungen oder veraltetem WebSocket-Verhalten. `clientPingTimeout` ist standardmäßig `15000`; `serverPingTimeout` und `pingPongLoggingEnabled` werden nur weitergegeben, wenn sie konfiguriert sind.
- `botToken`, `appToken`, `signingSecret` und `userToken` akzeptieren Klartextzeichenfolgen
  oder SecretRef-Objekte.
- Slack-Kontomomentaufnahmen stellen quell- und statusbezogene Felder pro Anmeldedaten bereit, beispielsweise
  `botTokenSource`, `botTokenStatus`, `userTokenSource`, `userTokenStatus`,
  `appTokenStatus` und im HTTP-Modus `signingSecretStatus`.
  `configured_unavailable` bedeutet, dass das Konto
  über SecretRef konfiguriert ist, der aktuelle Befehls- bzw. Laufzeitpfad den
  geheimen Wert jedoch nicht auflösen konnte.
- `configWrites: false` blockiert von Slack initiierte Konfigurationsschreibvorgänge.
- Das optionale `channels.slack.defaultAccount` überschreibt die Auswahl des Standardkontos, wenn es mit der ID eines konfigurierten Kontos übereinstimmt.
- `channels.slack.streaming.mode` ist der kanonische Schlüssel für den Slack-Streamingmodus (Standard: `"partial"`). `channels.slack.streaming.nativeTransport` steuert den nativen Streamingtransport von Slack (Standard: `true`). Veraltete Werte für `streamMode`, den booleschen Wert `streaming`, `chunkMode`, `blockStreaming`, `blockStreamingCoalesce` und `nativeStreaming` werden zur Laufzeit nicht mehr gelesen; führen Sie `openclaw doctor --fix` aus, um die persistierte Konfiguration zu `streaming.{mode,chunkMode,block.enabled,block.coalesce,nativeTransport}` zu migrieren.
- `unfurlLinks` und `unfurlMedia` leiten die booleschen Slack-Werte `chat.postMessage` zum Entfalten von Links und Medien für Bot-Antworten weiter. `unfurlLinks` ist standardmäßig `false`, sodass ausgehende Bot-Links nicht inline aufgeklappt werden, sofern dies nicht aktiviert ist; `unfurlMedia` wird weggelassen, sofern es nicht konfiguriert ist. Legen Sie einen der Werte unter `channels.slack.accounts.<accountId>` fest, um den Wert auf oberster Ebene für ein Konto zu überschreiben.
- Verwenden Sie `user:<id>` (DM) oder `channel:<id>` als Zustellziele.

**Modi für Reaktionsbenachrichtigungen:** `off`, `own` (Standard), `all`, `allowlist` (aus `reactionAllowlist`).

**Isolation von Thread-Sitzungen:** `thread.historyScope` gilt pro Thread (Standard) oder wird kanalübergreifend gemeinsam genutzt. `thread.inheritParent` kopiert das Transkript des übergeordneten Kanals in neue Threads. `thread.initialHistoryLimit` (Standard: `20`) begrenzt, wie viele vorhandene Thread-Nachrichten beim Start einer neuen Thread-Sitzung abgerufen werden; `0` deaktiviert den Abruf des Thread-Verlaufs.

- Das native Slack-Streaming und der Slack-Thread-Status „is typing...“ im Assistentenstil erfordern einen Antwort-Thread als Ziel. DMs auf oberster Ebene bleiben standardmäßig außerhalb von Threads, sodass sie weiterhin über Entwurfs-, Veröffentlichungs- und Bearbeitungsvorschauen von Slack streamen können, anstatt die native Stream-/Statusvorschau im Thread-Stil anzuzeigen.
- `typingReaction` fügt der eingehenden Slack-Nachricht vorübergehend eine Reaktion hinzu, während eine Antwort ausgeführt wird, und entfernt sie nach Abschluss wieder. Verwenden Sie einen Slack-Emoji-Kurzcode wie `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: Slack-native Zustellung an Genehmigungsclients und Autorisierung von Ausführungsgenehmigern. Dasselbe Schema wie bei Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (Slack-Benutzer-IDs), `agentFilter`, `sessionFilter` und `target` (`"dm"`, `"channel"` oder `"both"`). Plugin-Genehmigungen können diesen nativen Clientpfad für von Slack stammende Anfragen verwenden, wenn Slack-Plugin-Genehmiger aufgelöst werden; die Slack-native Zustellung von Plugin-Genehmigungen kann außerdem über `approvals.plugin` für von Slack stammende Sitzungen oder Slack-Ziele aktiviert werden. Plugin-Genehmigungen verwenden Slack-Plugin-Genehmiger aus `allowFrom` und das Standardrouting, nicht die Ausführungsgenehmiger.

| Aktionsgruppe | Standard   | Hinweise                       |
| ------------- | ---------- | ------------------------------ |
| reactions     | aktiviert  | Reagieren + Reaktionen auflisten |
| messages      | aktiviert  | Lesen/senden/bearbeiten/löschen |
| pins          | aktiviert  | Anheften/lösen/auflisten       |
| memberInfo    | aktiviert  | Mitgliederinformationen       |
| emojiList     | aktiviert  | Liste benutzerdefinierter Emojis |

### Mattermost

Mattermost wird als separates Plugin installiert, genauso wie Discord, Slack und WhatsApp:

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
        native: true, // opt-in
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Optional explicit URL for reverse-proxy/public deployments
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      streaming: { chunkMode: "length" },
    },
  },
}
```

Chatmodi: `oncall` (Antwort bei @-Erwähnung, Standard), `onmessage` (jede Nachricht), `onchar` (Nachrichten, die mit einem Auslösepräfix beginnen).

Wenn native Mattermost-Befehle aktiviert sind:

- `commands.callbackPath` muss ein Pfad sein (zum Beispiel `/api/channels/mattermost/command`), keine vollständige URL.
- `commands.callbackUrl` muss zum OpenClaw-Gateway-Endpunkt aufgelöst werden und vom Mattermost-Server erreichbar sein.
- Native Slash-Callbacks werden mit den befehlsspezifischen Token authentifiziert, die
  Mattermost bei der Registrierung des Slash-Befehls zurückgibt. Wenn die Registrierung fehlschlägt oder keine
  Befehle aktiviert werden, weist OpenClaw Callbacks mit
  `Unauthorized: invalid command token.` zurück.
- Für private, Tailnet-interne oder anderweitig interne Callback-Hosts kann Mattermost verlangen,
  dass `ServiceSettings.AllowedUntrustedInternalConnections` den Callback-Host bzw. die Callback-Domain enthält.
  Verwenden Sie Host-/Domainwerte, keine vollständigen URLs.
- `channels.mattermost.configWrites`: Von Mattermost initiierte Konfigurationsschreibvorgänge zulassen oder verweigern.
- `channels.mattermost.requireMention`: `@mention` vor Antworten in Kanälen verlangen.
- `channels.mattermost.groups.<channelId>.requireMention`: Kanalspezifische Überschreibung der Erwähnungsanforderung (`"*"` für den Standard).
- Das optionale `channels.mattermost.defaultAccount` überschreibt die Auswahl des Standardkontos, wenn es mit der ID eines konfigurierten Kontos übereinstimmt.

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

- `channels.signal.account`: Den Kanalstart an eine bestimmte Signal-Kontoidentität binden.
- `channels.signal.configWrites`: Von Signal initiierte Konfigurationsschreibvorgänge zulassen oder verweigern.
- Das optionale `channels.signal.defaultAccount` überschreibt die Auswahl des Standardkontos, wenn es mit der ID eines konfigurierten Kontos übereinstimmt.

### iMessage

OpenClaw startet `imsg rpc` (JSON-RPC über stdio). Es ist weder ein Daemon noch ein Port erforderlich. Dies ist der bevorzugte Pfad für neue OpenClaw-iMessage-Einrichtungen, wenn der Host Berechtigungen für die Messages-Datenbank und die Automatisierung erteilen kann.

Die Unterstützung für BlueBubbles wurde entfernt. `channels.bluebubbles` ist im aktuellen OpenClaw keine unterstützte Laufzeitkonfigurationsoberfläche. Migrieren Sie alte Konfigurationen zu `channels.imessage`; eine Kurzfassung finden Sie unter [Entfernung von BlueBubbles und der imsg-iMessage-Pfad](/de/announcements/bluebubbles-imessage), die vollständige Übersetzungstabelle unter [Umstieg von BlueBubbles](/de/channels/imessage-from-bluebubbles).

Wenn der Gateway nicht auf dem bei Messages angemeldeten Mac ausgeführt wird, behalten Sie `channels.imessage.enabled=true` bei und setzen Sie `channels.imessage.cliPath` auf einen SSH-Wrapper, der `imsg "$@"` auf diesem Mac ausführt. Der standardmäßige lokale Pfad `imsg` ist ausschließlich für macOS vorgesehen.

Bevor Sie sich bei Produktionssendungen auf einen SSH-Wrapper verlassen, überprüfen Sie einen ausgehenden `imsg send` über genau diesen Wrapper. Einige macOS-TCC-Zustände weisen die Nachrichtenautomatisierung `/usr/libexec/sshd-keygen-wrapper` zu, wodurch Lesevorgänge und Prüfungen funktionieren können, während Sendevorgänge mit AppleEvents `-1743` fehlschlagen; siehe den Abschnitt zur Fehlerbehebung für SSH-Wrapper unter [iMessage](/de/channels/imessage).

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

- Optional überschreibt `channels.imessage.defaultAccount` die Standardkontoauswahl, wenn der Wert mit einer konfigurierten Konto-ID übereinstimmt.
- Erfordert vollständigen Festplattenzugriff auf die Nachrichten-DB.
- Bevorzugen Sie `chat_id:<id>`-Ziele. Verwenden Sie `imsg chats --limit 20`, um Chats aufzulisten.
- `cliPath` kann auf einen SSH-Wrapper verweisen; legen Sie `remoteHost` (`host` oder `user@host`) für den Abruf von Anhängen per SCP fest.
- `attachmentRoots` und `remoteAttachmentRoots` beschränken eingehende Anhangspfade (Standard: `/Users/*/Library/Messages/Attachments`).
- SCP verwendet eine strikte Hostschlüsselprüfung. Stellen Sie daher sicher, dass der Hostschlüssel des Relay-Hosts bereits in `~/.ssh/known_hosts` vorhanden ist.
- `channels.imessage.configWrites`: durch iMessage initiierte Konfigurationsschreibvorgänge zulassen oder verweigern.
- `channels.imessage.sendTransport`: bevorzugter `imsg`-RPC-Sendetransport für normale ausgehende Antworten. `auto` (Standard) verwendet für bestehende Chats die IMCore-Bridge, wenn sie ausgeführt wird, und greift anschließend auf AppleScript zurück; `bridge` erfordert eine Zustellung über eine private API; `applescript` erzwingt den öffentlichen Automatisierungspfad von Nachrichten.
- `channels.imessage.actions.*`: Aktionen über private APIs aktivieren, die zusätzlich durch `imsg status` / `openclaw channels status --probe` eingeschränkt werden.
- `channels.imessage.includeAttachments` ist standardmäßig deaktiviert; setzen Sie den Wert auf `true`, bevor Sie eingehende Medien in Agentendurchläufen erwarten.
- Die Wiederherstellung eingehender Nachrichten nach einem Neustart der Bridge/des Gateways erfolgt automatisch (GUID-Deduplizierung plus Altersgrenze für veraltete Rückstände). Bestehende `channels.imessage.catchup.enabled: true`-Konfigurationen werden weiterhin als veraltetes Kompatibilitätsprofil berücksichtigt; `catchup` ist standardmäßig deaktiviert.
- `channels.imessage.groups`: Gruppenregister und gruppenspezifische Einstellungen. Konfigurieren Sie bei `groupPolicy: "allowlist"` entweder explizite `chat_id`-Schlüssel oder einen `"*"`-Platzhaltereintrag, damit Gruppennachrichten die Registerprüfung passieren können.
- Einträge auf oberster Ebene unter `bindings[]` mit `type: "acp"` können iMessage-Unterhaltungen an persistente ACP-Sitzungen binden. Verwenden Sie in `match.peer.id` einen normalisierten Handle oder ein explizites Chat-Ziel (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`). Gemeinsame Feldsemantik: [ACP-Agenten](/de/tools/acp-agents#persistent-channel-bindings).

<Accordion title="Beispiel für einen iMessage-SSH-Wrapper">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix basiert auf einem Plugin und wird unter `channels.matrix` konfiguriert.

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
- `channels.matrix.proxy` leitet Matrix-HTTP-Datenverkehr über einen expliziten HTTP(S)-Proxy. Benannte Konten können dies mit `channels.matrix.accounts.<id>.proxy` überschreiben.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` erlaubt private/interne Homeserver. `proxy` und diese Netzwerkaktivierung sind voneinander unabhängige Steuerungen.
- `channels.matrix.defaultAccount` wählt das bevorzugte Konto in Mehrkontokonfigurationen aus.
- `channels.matrix.autoJoin` ist standardmäßig auf `"off"` gesetzt, sodass Einladungen zu Räumen und neue DM-artige Einladungen ignoriert werden, bis Sie `autoJoin: "allowlist"` mit `autoJoinAllowlist` oder `autoJoin: "always"` festlegen.
- `channels.matrix.execApprovals`: Matrix-native Zustellung von Ausführungsgenehmigungen und Autorisierung der Genehmigenden.
  - `enabled`: `true`, `false` oder `"auto"` (Standard). Im automatischen Modus werden Ausführungsgenehmigungen aktiviert, wenn Genehmigende aus `approvers` oder `commands.ownerAllowFrom` aufgelöst werden können.
  - `approvers`: Matrix-Benutzer-IDs (z. B. `@owner:example.org`), die Ausführungsanfragen genehmigen dürfen.
  - `agentFilter`: optionale Positivliste für Agenten-IDs. Lassen Sie den Wert weg, um Genehmigungen für alle Agenten weiterzuleiten.
  - `sessionFilter`: optionale Muster für Sitzungsschlüssel (Teilzeichenfolge oder regulärer Ausdruck).
  - `target`: Ziel für Genehmigungsaufforderungen. `"dm"` (Standard), `"channel"` (ursprünglicher Raum) oder `"both"`.
  - Kontospezifische Überschreibungen: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` steuert, wie Matrix-DMs in Sitzungen gruppiert werden: `per-user` (Standard) nutzt eine gemeinsame Sitzung je weitergeleitetem Kommunikationspartner, während `per-room` jeden DM-Raum isoliert.
- Matrix-Statusprüfungen und Live-Verzeichnissuchen verwenden dieselbe Proxy-Richtlinie wie der Laufzeitdatenverkehr.
- Die vollständige Matrix-Konfiguration, Zielregeln und Einrichtungsbeispiele sind in [Matrix](/de/channels/matrix) dokumentiert.

### Microsoft Teams

Microsoft Teams basiert auf einem Plugin und wird unter `channels.msteams` konfiguriert.

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
- Die vollständige Teams-Konfiguration (Anmeldedaten, Webhook, DM-/Gruppenrichtlinie sowie team- und kanalspezifische Überschreibungen) ist in [Microsoft Teams](/de/channels/msteams) dokumentiert.

### IRC

IRC basiert auf einem Plugin und wird unter `channels.irc` konfiguriert.

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
- Optional überschreibt `channels.irc.defaultAccount` die Standardkontoauswahl, wenn der Wert mit einer konfigurierten Konto-ID übereinstimmt.
- Die vollständige IRC-Kanalkonfiguration (Host/Port/TLS/Kanäle/Positivlisten/Erwähnungsprüfung) ist unter [IRC](/de/channels/irc) dokumentiert.

### Mehrere Konten (alle Kanäle)

Führen Sie mehrere Konten pro Kanal aus (jeweils mit eigenem `accountId`):

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
- Die grundlegenden Kanaleinstellungen gelten für alle Konten, sofern sie nicht kontospezifisch überschrieben werden.
- Verwenden Sie `bindings[].match.accountId`, um jedes Konto an einen anderen Agenten weiterzuleiten.
- Wenn Sie über `openclaw channels add` (oder das Kanal-Onboarding) ein Nicht-Standardkonto hinzufügen, während weiterhin eine Einkontokonfiguration auf oberster Kanalebene verwendet wird, überführt OpenClaw zunächst die kontospezifischen Einkontowerte der obersten Ebene in die Kontenzuordnung des Kanals, damit das ursprüngliche Konto weiterhin funktioniert. Die meisten Kanäle verschieben sie nach `channels.<channel>.accounts.default`; Matrix kann stattdessen ein bestehendes passendes benanntes oder Standardziel beibehalten.
- Bestehende reine Kanalbindungen (ohne `accountId`) stimmen weiterhin mit dem Standardkonto überein; kontospezifische Bindungen bleiben optional.
- `openclaw doctor --fix` repariert außerdem gemischte Strukturen, indem kontospezifische Einkontowerte der obersten Ebene in das für diesen Kanal ausgewählte hochgestufte Konto verschoben werden. Die meisten Kanäle verwenden `accounts.default`; Matrix kann stattdessen ein bestehendes passendes benanntes oder Standardziel beibehalten.

### Andere Plugin-Kanäle

Viele Plugin-Kanäle werden als `channels.<id>` konfiguriert und auf ihren jeweiligen Kanalseiten dokumentiert (beispielsweise Feishu, LINE, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Twitch und Zalo).
Siehe den vollständigen Kanalindex: [Kanäle](/de/channels).

### Erwähnungsprüfung in Gruppenchats

Für Gruppennachrichten gilt standardmäßig: **Erwähnung erforderlich** (Metadaten-Erwähnung oder sichere Regex-Muster). Dies gilt für Gruppenchats in WhatsApp, Telegram, Discord, Google Chat und iMessage.

Sichtbare Antworten werden separat gesteuert. Normale direkte Anfragen aus Gruppen, Kanälen und dem internen WebChat werden standardmäßig automatisch abschließend zugestellt: Der abschließende Assistententext wird über den bisherigen Pfad für sichtbare Antworten veröffentlicht. Aktivieren Sie `messages.visibleReplies: "message_tool"` oder `messages.groupChat.visibleReplies: "message_tool"`, wenn vom Modell verfasste Quellantworten erst veröffentlicht werden sollen, nachdem der Agent `message(action=send)` aufgerufen hat. Wenn das Modell in einem aktivierten Nur-Tool-Modus eine inhaltlich substanzielle abschließende Antwort zurückgibt, ohne das Nachrichtenwerkzeug aufzurufen, bleibt dieser Abschlusstext privat, das ausführliche Gateway-Protokoll zeichnet Metadaten zur unterdrückten Nutzlast auf und OpenClaw reiht einen Wiederherstellungsversuch ein, der das Modell auffordert, dieselbe Antwort über `message(action=send)` zuzustellen.

Die Nur-Tool-Richtlinie steuert Quellantworten des Assistenten und generische Tool-Medien. Sie unterdrückt keine laufzeiteigenen Terminalausgaben wie Antworten auf autorisierte Befehle, dauerhafte Abschlussbenachrichtigungen oder Provider-native Artefakte, die das zuständige Harness ausdrücklich als Host-eigen klassifiziert. Host-eigene Artefakte werden über den normalen Kanalversandpfad zugestellt und berücksichtigen weiterhin eine ausgehende Verweigerung durch `sendPolicy`. Umgebungsbedingte `room_event`-Durchläufe bleiben still, sofern es sich nicht um explizite Befehle handelt, selbst wenn Laufzeitausgaben als Host-eigen gekennzeichnet sind.

Sichtbare Nur-Tool-Antworten erfordern ein Modell/eine Laufzeit, das bzw. die Tools zuverlässig aufruft, und werden für gemeinsam genutzte Umgebungsräume mit Modellen der neuesten Generation wie GPT-5.6 Sol empfohlen. Einige schwächere Modelle können abschließenden Text liefern, verstehen jedoch nicht, dass in der Quelle sichtbare Ausgaben mit `message(action=send)` gesendet werden müssen. OpenClaw stellt den häufigen Fall einer nicht zugestellten abschließenden Antwort standardmäßig nur wieder her, wenn die Antwort substanziell ist, der Quelldurchlauf kein Raumereignis war, die Senderichtlinie die Zustellung nicht verweigert hat und noch keine Quellantwort gesendet wurde. Die Wiederherstellung ist auf einen Wiederholungsversuch begrenzt; sie unterdrückt die Persistenz der synthetischen Wiederholungsaufforderung und hält diesen Versuch aus der Sammelbündelung heraus, damit er nicht mit nicht zusammenhängenden Aufforderungen in der Warteschlange zusammengeführt werden kann. Wenn auch der Wiederholungsversuch nicht zugestellt oder nicht eingereiht werden kann, liefert OpenClaw lediglich eine bereinigte Diagnose wie „Ich habe eine Antwort erzeugt, konnte sie aber nicht an diesen Chat zustellen. Bitte versuchen Sie es erneut.“ Der ursprüngliche private Abschlusstext wird niemals für eine automatische Zustellung an die Quelle markiert. Verwenden Sie für Modelle, bei denen Antworten wiederholt nicht zugestellt werden, `"automatic"`, sodass der abschließende Assistentendurchlauf als sichtbarer Antwortpfad dient, wechseln Sie zu einem leistungsfähigeren Modell für Tool-Aufrufe, prüfen Sie das ausführliche Gateway-Protokoll auf die Zusammenfassung der unterdrückten Nutzlast oder legen Sie `messages.groupChat.visibleReplies: "automatic"` fest, um für jede Gruppen-/Kanalanfrage sichtbare abschließende Antworten zu verwenden.

Wenn das Nachrichten-Tool gemäß der aktiven Tool-Richtlinie nicht verfügbar ist, greift OpenClaw auf automatische sichtbare Antworten zurück, anstatt die Antwort stillschweigend zu unterdrücken. `openclaw doctor` warnt vor dieser Abweichung.

Diese Regel gilt für den normalen abschließenden Text des Agenten. Plugin-eigene Konversationsbindungen verwenden bei übernommenen Durchläufen gebundener Threads die vom zuständigen Plugin zurückgegebene Antwort als sichtbare Antwort; das Plugin muss für diese Bindungsantworten nicht `message(action=send)` aufrufen.

**Fehlerbehebung: Eine @Erwähnung in einer Gruppe löst die Tippanzeige aus, danach bleibt es still (kein Fehler)**

Symptom: Eine @Erwähnung in einer Gruppe/einem Kanal zeigt die Tippanzeige an und das Gateway-Protokoll meldet `dispatch complete (queuedFinal=false, replies=0)`, aber im Raum kommt keine Nachricht an. Direktnachrichten an denselben Agenten werden normal beantwortet.

Ursache: Der Modus für sichtbare Antworten in der Gruppe/im Kanal wird zu `"message_tool"` aufgelöst. OpenClaw führt den Durchlauf daher aus, unterdrückt jedoch den abschließenden Assistententext, sofern der Agent nicht `message(action=send)` aufruft. In diesem Modus gibt es keinen `NO_REPLY`-Vertrag; ohne Aufruf des Nachrichten-Tools bleibt der ursprüngliche Abschlusstext privat. Bei substanziellen Quelldurchläufen versucht OpenClaw jetzt eine einzelne abgesicherte Wiederholung zur Wiederherstellung; kurze Notizen, ausdrücklich gewünschtes Schweigen, Raumereignisse, aufgrund der Senderichtlinie abgelehnte Durchläufe und bereits zugestellte Durchläufe werden nicht wiederholt. Normale Gruppen- und Kanaldurchläufe verwenden standardmäßig `"automatic"`. Dieses Symptom tritt daher nur auf, wenn `messages.groupChat.visibleReplies` (oder global `messages.visibleReplies`) ausdrücklich auf `"message_tool"` gesetzt ist. Harness-`defaultVisibleReplies` gilt hier nicht — der Resolver für Gruppen/Kanäle ignoriert diese Einstellung; sie wirkt sich nur auf direkte/Quellchats aus (das Codex-Harness unterdrückt auf diese Weise Abschlusstexte in direkten Chats).

Behebung: Wählen Sie entweder ein Modell mit zuverlässigerer Tool-Aufruf-Funktion, entfernen Sie die ausdrückliche `"message_tool"`-Überschreibung, um auf den Standardwert `"automatic"` zurückzufallen, oder setzen Sie `messages.groupChat.visibleReplies: "automatic"`, um sichtbare Antworten für jede Gruppen-/Kanalanfrage zu erzwingen. Ein substanzieller nicht zugestellter Abschlusstext sollte nicht mehr als stillschweigender Erfolg enden; er sollte entweder durch eine einzelne Wiederholung mit `message(action=send)` wiederhergestellt werden oder die bereinigte Diagnose des Zustellungsfehlers anzeigen. Das Gateway lädt die `messages`-Konfiguration nach dem Speichern der Datei dynamisch neu; starten Sie das Gateway nur neu, wenn die Dateiüberwachung oder das erneute Laden der Konfiguration in der Bereitstellung deaktiviert ist.

**Erwähnungstypen:**

- **Metadaten-Erwähnungen**: Native @-Erwähnungen der Plattform. Im WhatsApp-Selbstchat-Modus werden sie ignoriert.
- **Textmuster**: Sichere reguläre Ausdrücke in `agents.entries.*.groupChat.mentionPatterns`. Ungültige Muster und unsichere verschachtelte Wiederholungen werden ignoriert.
- Die Erwähnungsbeschränkung wird nur durchgesetzt, wenn eine Erkennung möglich ist (native Erwähnungen oder mindestens ein Muster).

```json5
{
  messages: {
    visibleReplies: "automatic", // alte automatische Abschlussantworten für direkte/Quellchats erzwingen
    groupChat: {
      historyLimit: 50,
      unmentionedInbound: "room_event", // dauerhaft aktive, nicht erwähnende Raumunterhaltungen werden zu stillem Kontext
      visibleReplies: "message_tool", // optional; message(action=send) für sichtbare Raumantworten erfordern
    },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` legt den globalen Standardwert fest. Kanäle können ihn mit `channels.<channel>.historyLimit` (oder kontospezifisch) überschreiben. Setzen Sie zum Deaktivieren `0`.

`messages.groupChat.unmentionedInbound: "room_event"` übermittelt nicht erwähnende, dauerhaft aktive Gruppen-/Kanalnachrichten auf unterstützten Kanälen als stillen Raumkontext. Nachrichten mit Erwähnungen, Befehle und Direktnachrichten bleiben Benutzeranfragen. Vollständige Beispiele für Discord, Slack und Telegram finden Sie unter [Umgebungsbedingte Raumereignisse](/de/channels/ambient-room-events).

`messages.visibleReplies` ist der globale Standardwert für Quellereignisse; `messages.groupChat.visibleReplies` überschreibt ihn für Gruppen-/Kanal-Quellereignisse. Wenn `messages.visibleReplies` nicht gesetzt ist, verwenden direkte/Quellchats den ausgewählten Laufzeit- oder Harness-Standardwert, interne direkte WebChat-Durchläufe verwenden jedoch die automatische Abschlusszustellung, um die Parität der Prompts von Pi/Codex zu gewährleisten. Setzen Sie `messages.visibleReplies: "message_tool"`, um für sichtbare Ausgaben absichtlich `message(action=send)` zu erfordern. Kanal-Zulassungslisten und die Erwähnungsbeschränkung bestimmen weiterhin, ob ein Ereignis verarbeitet wird.

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

Auflösung: Direktnachrichten-spezifische Überschreibung → Provider-Standardwert → keine Begrenzung (alle werden beibehalten).

Dieser Resolver liest `channels.<provider>.dmHistoryLimit` und `channels.<provider>.dms.<id>.historyLimit` für jeden Kanal, dessen Sitzungsschlüssel der standardmäßigen Form `provider:direct:<id>` (oder der älteren Form `provider:dm:<id>`) entspricht. Dadurch funktioniert er sowohl für gebündelte als auch für Plugin-Kanäle und nicht nur für eine feste Liste.

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
    native: "auto", // native Befehle registrieren, sofern unterstützt
    nativeSkills: "auto", // native Skill-Befehle registrieren, sofern unterstützt
    text: true, // /commands in Chatnachrichten parsen
    bash: false, // ! zulassen (Alias: /bash)
    bashForegroundMs: 2000,
    config: false, // /config zulassen
    mcp: false, // /mcp zulassen
    plugins: false, // /plugins zulassen
    debug: false, // /debug zulassen
    restart: true, // /restart und externe SIGUSR1-Neustartanforderungen zulassen
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

- Dieser Block konfiguriert Befehlsoberflächen. Den aktuellen Katalog integrierter und gebündelter Befehle finden Sie unter [Slash-Befehle](/de/tools/slash-commands).
- Diese Seite ist eine **Referenz für Konfigurationsschlüssel**, nicht der vollständige Befehlskatalog. Kanal-/Plugin-eigene Befehle wie QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, Gerätekopplung `/pair`, Speicher `/dreaming`, Telefonsteuerung `/phone` und Talk `/voice` sind auf den jeweiligen Kanal-/Plugin-Seiten sowie unter [Slash-Befehle](/de/tools/slash-commands) dokumentiert.
- Textbefehle müssen **eigenständige** Nachrichten mit vorangestelltem `/` sein.
- `native: "auto"` aktiviert native Befehle für Discord/Telegram und lässt sie für Slack deaktiviert.
- `nativeSkills: "auto"` aktiviert native Skill-Befehle für Discord/Telegram und lässt sie für Slack deaktiviert.
- Kanalspezifische Überschreibung: `channels.discord.commands.native` (boolescher Wert oder `"auto"`). Bei Discord überspringt `false` die Registrierung und Bereinigung nativer Befehle beim Start.
- Überschreiben Sie die Registrierung nativer Skill-Befehle kanalspezifisch mit `channels.<provider>.commands.nativeSkills`.
- `channels.telegram.customCommands` fügt zusätzliche Menüeinträge für den Telegram-Bot hinzu.
- `bash: true` aktiviert `! <cmd>` für die Host-Shell. Erfordert `tools.elevated.enabled` und einen Absender in `tools.elevated.allowFrom.<channel>`.
- `config: true` aktiviert `/config` (liest/schreibt `openclaw.json`). Für Gateway-`chat.send`-Clients erfordern persistente Schreibvorgänge mit `/config set|unset` außerdem `operator.admin`; der schreibgeschützte Befehl `/config show` bleibt für normale Operator-Clients mit Schreibbereich verfügbar.
- `mcp: true` aktiviert `/mcp` für die von OpenClaw verwaltete MCP-Serverkonfiguration unter `mcp.servers`.
- `plugins: true` aktiviert `/plugins` für Plugin-Erkennung, Installation sowie Steuerelemente zum Aktivieren und Deaktivieren.
- `channels.<provider>.configWrites` steuert Konfigurationsänderungen pro Kanal (Standardwert: true).
- Bei Kanälen mit mehreren Konten steuert `channels.<provider>.accounts.<id>.configWrites` außerdem Schreibvorgänge, die auf dieses Konto abzielen (zum Beispiel `/allowlist --config --account <id>` oder `/config set channels.<provider>.accounts.<id>...`).
- `restart: false` deaktiviert `/restart` und externe Neustartanforderungen mit `SIGUSR1`. Standardwert: `true`.
- `ownerAllowFrom` ist die ausdrückliche Eigentümer-Zulassungsliste für ausschließlich Eigentümern vorbehaltene Befehle und eigentümerbeschränkte Kanalaktionen. Sie ist von `allowFrom` getrennt.
- `ownerDisplay: "hash"` hasht Eigentümer-IDs im System-Prompt. Legen Sie mit `ownerDisplaySecret` das Hashing fest.
- `allowFrom` gilt pro Provider. Wenn diese Einstellung gesetzt ist, ist sie die **einzige** Autorisierungsquelle (Kanal-Zulassungslisten/Kopplung und `useAccessGroups` werden ignoriert).
- `useAccessGroups: false` erlaubt Befehlen, Zugriffsgruppenrichtlinien zu umgehen, wenn `allowFrom` nicht gesetzt ist.
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
