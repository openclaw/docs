---
read_when:
    - Slack einrichten oder den Slack-Socket-/HTTP-Modus debuggen
summary: Slack-Einrichtung und Laufzeitverhalten (Socket Mode + HTTP-Anfrage-URLs)
title: Slack
x-i18n:
    generated_at: "2026-04-30T16:27:36Z"
    model: gpt-5.5
    provider: openai
    source_hash: 55beddb43a6b91c6853dcf053eab713322de4da5beced7c107d73e1c066fded6
    source_path: channels/slack.md
    workflow: 16
---

Produktionsreif für DMs und Kanäle über Slack-App-Integrationen. Standardmodus ist Socket Mode; HTTP Request URLs werden ebenfalls unterstützt.

<CardGroup cols={3}>
  <Card title="Koppeln" icon="link" href="/de/channels/pairing">
    Slack-DMs verwenden standardmäßig den Kopplungsmodus.
  </Card>
  <Card title="Slash-Befehle" icon="terminal" href="/de/tools/slash-commands">
    Natives Befehlsverhalten und Befehlskatalog.
  </Card>
  <Card title="Kanal-Fehlerbehebung" icon="wrench" href="/de/channels/troubleshooting">
    Kanalübergreifende Diagnose- und Reparatur-Playbooks.
  </Card>
</CardGroup>

## Schnelle Einrichtung

<Tabs>
  <Tab title="Socket Mode (Standard)">
    <Steps>
      <Step title="Neue Slack-App erstellen">
        Drücken Sie in den Slack-App-Einstellungen die Schaltfläche **[Create New App](https://api.slack.com/apps/new)**:

        - wählen Sie **from a manifest** und wählen Sie einen Workspace für Ihre App aus
        - fügen Sie das unten stehende [Beispielmanifest](#manifest-and-scope-checklist) ein und fahren Sie mit der Erstellung fort
        - generieren Sie ein **App-Level Token** (`xapp-...`) mit `connections:write`
        - installieren Sie die App und kopieren Sie das angezeigte **Bot Token** (`xoxb-...`)

      </Step>

      <Step title="OpenClaw konfigurieren">

        Empfohlene SecretRef-Einrichtung:

```bash
export SLACK_APP_TOKEN=xapp-...
export SLACK_BOT_TOKEN=xoxb-...
cat > slack.socket.patch.json5 <<'JSON5'
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
    },
  },
}
JSON5
openclaw config patch --file ./slack.socket.patch.json5 --dry-run
openclaw config patch --file ./slack.socket.patch.json5
```

        Umgebungsvariablen-Fallback (nur Standardkonto):

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="Gateway starten">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP Request URLs">
    <Steps>
      <Step title="Neue Slack-App erstellen">
        Drücken Sie in den Slack-App-Einstellungen die Schaltfläche **[Create New App](https://api.slack.com/apps/new)**:

        - wählen Sie **from a manifest** und wählen Sie einen Workspace für Ihre App aus
        - fügen Sie das [Beispielmanifest](#manifest-and-scope-checklist) ein und aktualisieren Sie die URLs vor dem Erstellen
        - speichern Sie das **Signing Secret** für die Anfrageverifizierung
        - installieren Sie die App und kopieren Sie das angezeigte **Bot Token** (`xoxb-...`)

      </Step>

      <Step title="OpenClaw konfigurieren">

        Empfohlene SecretRef-Einrichtung:

```bash
export SLACK_BOT_TOKEN=xoxb-...
export SLACK_SIGNING_SECRET=...
cat > slack.http.patch.json5 <<'JSON5'
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      signingSecret: { source: "env", provider: "default", id: "SLACK_SIGNING_SECRET" },
      webhookPath: "/slack/events",
    },
  },
}
JSON5
openclaw config patch --file ./slack.http.patch.json5 --dry-run
openclaw config patch --file ./slack.http.patch.json5
```

        <Note>
        Verwenden Sie eindeutige Webhook-Pfade für HTTP mit mehreren Konten

        Geben Sie jedem Konto einen eigenen `webhookPath` (Standard `/slack/events`), damit Registrierungen nicht kollidieren.
        </Note>

      </Step>

      <Step title="Gateway starten">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Transportabstimmung für Socket Mode

OpenClaw setzt das Pong-Timeout des Slack-SDK-Clients standardmäßig auf 15 Sekunden für Socket Mode. Überschreiben Sie die Transporteinstellungen nur, wenn Sie Workspace- oder Host-spezifische Abstimmung benötigen:

```json5
{
  channels: {
    slack: {
      mode: "socket",
      socketMode: {
        clientPingTimeout: 20000,
        serverPingTimeout: 30000,
        pingPongLoggingEnabled: false,
      },
    },
  },
}
```

Verwenden Sie dies nur für Socket-Mode-Workspaces, die Slack-WebSocket-Pong-/Server-Ping-Zeitüberschreitungen protokollieren oder auf Hosts mit bekannter Event-Loop-Überlastung laufen. `clientPingTimeout` ist die Pong-Wartezeit, nachdem das SDK einen Client-Ping gesendet hat; `serverPingTimeout` ist die Wartezeit auf Slack-Server-Pings. App-Nachrichten und Ereignisse bleiben Anwendungszustand, keine Signale für Transport-Liveness.

## Checkliste für Manifest und Scopes

Das Basismanifest der Slack-App ist für Socket Mode und HTTP Request URLs identisch. Nur der Block `settings` (und die Slash-Befehl-`url`) unterscheidet sich.

Basismanifest (Socket Mode als Standard):

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack connector for OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false
      }
    ]
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "assistant:write",
        "channels:history",
        "channels:read",
        "chat:write",
        "commands",
        "emoji:read",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "mpim:history",
        "mpim:read",
        "mpim:write",
        "pins:read",
        "pins:write",
        "reactions:read",
        "reactions:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_mention",
        "channel_rename",
        "member_joined_channel",
        "member_left_channel",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim",
        "pin_added",
        "pin_removed",
        "reaction_added",
        "reaction_removed"
      ]
    }
  }
}
```

Für den **Modus HTTP Request URLs** ersetzen Sie `settings` durch die HTTP-Variante und fügen Sie jedem Slash-Befehl `url` hinzu. Öffentliche URL erforderlich:

```json
{
  "features": {
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Send a message to OpenClaw",
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        /* same as Socket Mode */
      ]
    },
    "interactivity": {
      "is_enabled": true,
      "request_url": "https://gateway-host.example.com/slack/events",
      "message_menu_options_url": "https://gateway-host.example.com/slack/events"
    }
  }
}
```

### Zusätzliche Manifest-Einstellungen

Stellen Sie verschiedene Funktionen bereit, die die obigen Standardwerte erweitern.

<AccordionGroup>
  <Accordion title="Optionale native Slash-Befehle">

    Mehrere [native Slash-Befehle](#commands-and-slash-behavior) können anstelle eines einzelnen konfigurierten Befehls mit Nuancen verwendet werden:

    - Verwenden Sie `/agentstatus` anstelle von `/status`, da der Befehl `/status` reserviert ist.
    - Es können höchstens 25 Slash-Befehle gleichzeitig verfügbar gemacht werden.

    Ersetzen Sie Ihren vorhandenen Abschnitt `features.slash_commands` durch eine Teilmenge der [verfügbaren Befehle](/de/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Socket Mode (Standard)">

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "Start a new session",
        "usage_hint": "[model]"
      },
      {
        "command": "/reset",
        "description": "Reset the current session"
      },
      {
        "command": "/compact",
        "description": "Compact the session context",
        "usage_hint": "[instructions]"
      },
      {
        "command": "/stop",
        "description": "Stop the current run"
      },
      {
        "command": "/session",
        "description": "Manage thread-binding expiry",
        "usage_hint": "idle <duration|off> or max-age <duration|off>"
      },
      {
        "command": "/think",
        "description": "Set the thinking level",
        "usage_hint": "<level>"
      },
      {
        "command": "/verbose",
        "description": "Toggle verbose output",
        "usage_hint": "on|off|full"
      },
      {
        "command": "/fast",
        "description": "Show or set fast mode",
        "usage_hint": "[status|on|off]"
      },
      {
        "command": "/reasoning",
        "description": "Toggle reasoning visibility",
        "usage_hint": "[on|off|stream]"
      },
      {
        "command": "/elevated",
        "description": "Toggle elevated mode",
        "usage_hint": "[on|off|ask|full]"
      },
      {
        "command": "/exec",
        "description": "Show or set exec defaults",
        "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>"
      },
      {
        "command": "/model",
        "description": "Show or set the model",
        "usage_hint": "[name|#|status]"
      },
      {
        "command": "/models",
        "description": "List providers/models",
        "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]"
      },
      {
        "command": "/help",
        "description": "Show the short help summary"
      },
      {
        "command": "/commands",
        "description": "Show the generated command catalog"
      },
      {
        "command": "/tools",
        "description": "Show what the current agent can use right now",
        "usage_hint": "[compact|verbose]"
      },
      {
        "command": "/agentstatus",
        "description": "Show runtime status, including provider usage/quota when available"
      },
      {
        "command": "/tasks",
        "description": "List active/recent background tasks for the current session"
      },
      {
        "command": "/context",
        "description": "Explain how context is assembled",
        "usage_hint": "[list|detail|json]"
      },
      {
        "command": "/whoami",
        "description": "Show your sender identity"
      },
      {
        "command": "/skill",
        "description": "Run a skill by name",
        "usage_hint": "<name> [input]"
      },
      {
        "command": "/btw",
        "description": "Ask a side question without changing session context",
        "usage_hint": "<question>"
      },
      {
        "command": "/usage",
        "description": "Control the usage footer or show cost summary",
        "usage_hint": "off|tokens|full|cost"
      }
    ]
```

      </Tab>
      <Tab title="HTTP Request URLs">
        Verwenden Sie dieselbe `slash_commands`-Liste wie oben für Socket Mode und fügen Sie jedem Eintrag `"url": "https://gateway-host.example.com/slack/events"` hinzu. Beispiel:

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "Start a new session",
        "usage_hint": "[model]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/help",
        "description": "Show the short help summary",
        "url": "https://gateway-host.example.com/slack/events"
      }
      // ...repeat for every command with the same `url` value
    ]
```

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="Optionale Scopes für Autorenschaft (Schreibvorgänge)">
    Fügen Sie den Bot-Scope `chat:write.customize` hinzu, wenn ausgehende Nachrichten die Identität des aktiven Agenten (benutzerdefinierter Benutzername und benutzerdefiniertes Symbol) anstelle der standardmäßigen Slack-App-Identität verwenden sollen.

    Wenn Sie ein Emoji-Symbol verwenden, erwartet Slack die Syntax `:emoji_name:`.

  </Accordion>
  <Accordion title="Optionale Benutzer-Token-Scopes (Lesevorgänge)">
    Wenn Sie `channels.slack.userToken` konfigurieren, sind typische Lese-Scopes:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (wenn Sie von Slack-Suche-Lesevorgängen abhängig sind)

  </Accordion>
</AccordionGroup>

## Token-Modell

- `botToken` + `appToken` sind für Socket Mode erforderlich.
- Der HTTP-Modus erfordert `botToken` + `signingSecret`.
- `botToken`, `appToken`, `signingSecret` und `userToken` akzeptieren Klartextzeichenfolgen
  oder SecretRef-Objekte.
- Config-Tokens überschreiben den Env-Fallback.
- Der Env-Fallback `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` gilt nur für das Standardkonto.
- `userToken` (`xoxp-...`) ist ausschließlich konfigurierbar (kein Env-Fallback) und verwendet standardmäßig schreibgeschütztes Verhalten (`userTokenReadOnly: true`).

Verhalten des Status-Snapshots:

- Die Slack-Kontoprüfung verfolgt pro Zugangsdaten `*Source`- und `*Status`-
  Felder (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Der Status ist `available`, `configured_unavailable` oder `missing`.
- `configured_unavailable` bedeutet, dass das Konto über SecretRef
  oder eine andere nicht-inline Secret-Quelle konfiguriert ist, der aktuelle Befehls-/Laufzeitpfad
  den tatsächlichen Wert jedoch nicht auflösen konnte.
- Im HTTP-Modus ist `signingSecretStatus` enthalten; im Socket Mode ist das
  erforderliche Paar `botTokenStatus` + `appTokenStatus`.

<Tip>
Für Aktionen/Verzeichnis-Lesevorgänge kann das Benutzer-Token bevorzugt werden, wenn es konfiguriert ist. Für Schreibvorgänge bleibt das Bot-Token bevorzugt; Schreibvorgänge mit Benutzer-Token sind nur erlaubt, wenn `userTokenReadOnly: false` gesetzt ist und das Bot-Token nicht verfügbar ist.
</Tip>

## Aktionen und Gates

Slack-Aktionen werden durch `channels.slack.actions.*` gesteuert.

Verfügbare Aktionsgruppen im aktuellen Slack-Tooling:

| Gruppe     | Standard |
| ---------- | -------- |
| messages   | aktiviert |
| reactions  | aktiviert |
| pins       | aktiviert |
| memberInfo | aktiviert |
| emojiList  | aktiviert |

Aktuelle Slack-Nachrichtenaktionen umfassen `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` und `emoji-list`. `download-file` akzeptiert Slack-Datei-IDs, die in eingehenden Datei-Platzhaltern angezeigt werden, und gibt Bildvorschauen für Bilder oder lokale Dateimetadaten für andere Dateitypen zurück.

## Zugriffskontrolle und Routing

<Tabs>
  <Tab title="DM policy">
    `channels.slack.dmPolicy` steuert den DM-Zugriff. `channels.slack.allowFrom` ist die kanonische DM-Allowlist.

    - `pairing` (Standard)
    - `allowlist`
    - `open` (erfordert, dass `channels.slack.allowFrom` `"*"` enthält)
    - `disabled`

    DM-Flags:

    - `dm.enabled` (standardmäßig true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (Legacy)
    - `dm.groupEnabled` (Gruppen-DMs standardmäßig false)
    - `dm.groupChannels` (optionale MPIM-Allowlist)

    Priorität bei mehreren Konten:

    - `channels.slack.accounts.default.allowFrom` gilt nur für das Konto `default`.
    - Benannte Konten erben `channels.slack.allowFrom`, wenn ihr eigenes `allowFrom` nicht gesetzt ist.
    - Benannte Konten erben `channels.slack.accounts.default.allowFrom` nicht.

    Legacy-`channels.slack.dm.policy` und `channels.slack.dm.allowFrom` werden aus Kompatibilitätsgründen weiterhin gelesen. `openclaw doctor --fix` migriert sie zu `dmPolicy` und `allowFrom`, wenn dies ohne Änderung des Zugriffs möglich ist.

    Pairing in DMs verwendet `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Channel policy">
    `channels.slack.groupPolicy` steuert die Channel-Behandlung:

    - `open`
    - `allowlist`
    - `disabled`

    Die Channel-Allowlist befindet sich unter `channels.slack.channels` und **muss stabile Slack-Channel-IDs** (zum Beispiel `C12345678`) als Konfigurationsschlüssel verwenden.

    Laufzeithinweis: Wenn `channels.slack` vollständig fehlt (reine Env-Einrichtung), fällt die Laufzeit auf `groupPolicy="allowlist"` zurück und protokolliert eine Warnung (auch wenn `channels.defaults.groupPolicy` gesetzt ist).

    Namens-/ID-Auflösung:

    - Channel-Allowlist-Einträge und DM-Allowlist-Einträge werden beim Start aufgelöst, wenn der Token-Zugriff dies erlaubt
    - nicht aufgelöste Channel-Namenseinträge bleiben wie konfiguriert erhalten, werden aber standardmäßig für das Routing ignoriert
    - eingehende Autorisierung und Channel-Routing sind standardmäßig ID-first; direkte Benutzername-/Slug-Übereinstimmung erfordert `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Namensbasierte Schlüssel (`#channel-name` oder `channel-name`) stimmen unter `groupPolicy: "allowlist"` **nicht** überein. Die Channel-Suche ist standardmäßig ID-first, daher wird ein namensbasierter Schlüssel nie erfolgreich routen, und alle Nachrichten in diesem Channel werden stillschweigend blockiert. Dies unterscheidet sich von `groupPolicy: "open"`, wo der Channel-Schlüssel für das Routing nicht erforderlich ist und ein namensbasierter Schlüssel scheinbar funktioniert.

    Verwenden Sie immer die Slack-Channel-ID als Schlüssel. So finden Sie sie: Klicken Sie in Slack mit der rechten Maustaste auf den Channel → **Link kopieren** — die ID (`C...`) erscheint am Ende der URL.

    Richtig:

    ```json5
    {
      channels: {
        slack: {
          groupPolicy: "allowlist",
          channels: {
            C12345678: { allow: true, requireMention: true },
          },
        },
      },
    }
    ```

    Falsch (unter `groupPolicy: "allowlist"` stillschweigend blockiert):

    ```json5
    {
      channels: {
        slack: {
          groupPolicy: "allowlist",
          channels: {
            "#eng-my-channel": { allow: true, requireMention: true },
          },
        },
      },
    }
    ```
    </Warning>

  </Tab>

  <Tab title="Mentions and channel users">
    Channel-Nachrichten sind standardmäßig durch Erwähnungen begrenzt.

    Erwähnungsquellen:

    - explizite App-Erwähnung (`<@botId>`)
    - Erwähnungs-Regex-Muster (`agents.list[].groupChat.mentionPatterns`, Fallback `messages.groupChat.mentionPatterns`)
    - implizites Reply-to-bot-Thread-Verhalten (deaktiviert, wenn `thread.requireExplicitMention` `true` ist)

    Steuerelemente pro Channel (`channels.slack.channels.<id>`; Namen nur über Startauflösung oder `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (Allowlist)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - Schlüsselformat für `toolsBySender`: `id:`, `e164:`, `username:`, `name:` oder `"*"`-Wildcard
      (Legacy-Schlüssel ohne Präfix werden weiterhin nur `id:` zugeordnet)

    `allowBots` ist für Channels und private Channels konservativ: Von Bots verfasste Raumnachrichten werden nur akzeptiert, wenn der sendende Bot explizit in der `users`-Allowlist dieses Raums aufgeführt ist oder wenn mindestens eine explizite Slack-Owner-ID aus `channels.slack.allowFrom` aktuell Raummitglied ist. Wildcards und Owner-Einträge mit Anzeigenamen erfüllen die Owner-Anwesenheit nicht. Die Owner-Anwesenheit verwendet Slack `conversations.members`; stellen Sie sicher, dass die App den passenden Lese-Scope für den Raumtyp hat (`channels:read` für öffentliche Channels, `groups:read` für private Channels). Wenn die Mitgliedersuche fehlschlägt, verwirft OpenClaw die von einem Bot verfasste Raumnachricht.

  </Tab>
</Tabs>

## Threads, Sitzungen und Antwort-Tags

- DMs routen als `direct`; Channels als `channel`; MPIMs als `group`.
- Mit dem Standard `session.dmScope=main` werden Slack-DMs auf die Hauptsitzung des Agents zusammengeführt.
- Channel-Sitzungen: `agent:<agentId>:slack:channel:<channelId>`.
- Thread-Antworten können bei Bedarf Thread-Sitzungssuffixe (`:thread:<threadTs>`) erstellen.
- Der Standard für `channels.slack.thread.historyScope` ist `thread`; der Standard für `thread.inheritParent` ist `false`.
- `channels.slack.thread.initialHistoryLimit` steuert, wie viele vorhandene Thread-Nachrichten abgerufen werden, wenn eine neue Thread-Sitzung startet (Standard `20`; setzen Sie `0`, um dies zu deaktivieren).
- `channels.slack.thread.requireExplicitMention` (Standard `false`): Wenn `true`, werden implizite Thread-Erwähnungen unterdrückt, sodass der Bot innerhalb von Threads nur auf explizite `@bot`-Erwähnungen antwortet, selbst wenn der Bot bereits am Thread teilgenommen hat. Ohne dies umgehen Antworten in einem Thread mit Bot-Beteiligung das `requireMention`-Gating.

Steuerung von Antwort-Threads:

- `channels.slack.replyToMode`: `off|first|all|batched` (Standard `off`)
- `channels.slack.replyToModeByChatType`: pro `direct|group|channel`
- Legacy-Fallback für direkte Chats: `channels.slack.dm.replyToMode`

Manuelle Antwort-Tags werden unterstützt:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` deaktiviert **alle** Antwort-Threads in Slack, einschließlich expliziter `[[reply_to_*]]`-Tags. Dies unterscheidet sich von Telegram, wo explizite Tags im Modus `"off"` weiterhin berücksichtigt werden. Slack-Threads verbergen Nachrichten aus dem Channel, während Telegram-Antworten inline sichtbar bleiben.
</Note>

## Ack-Reaktionen

`ackReaction` sendet ein Bestätigungs-Emoji, während OpenClaw eine eingehende Nachricht verarbeitet.

Auflösungsreihenfolge:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- Agent-Identitäts-Emoji-Fallback (`agents.list[].identity.emoji`, sonst "👀")

Hinweise:

- Slack erwartet Shortcodes (zum Beispiel `"eyes"`).
- Verwenden Sie `""`, um die Reaktion für das Slack-Konto oder global zu deaktivieren.

## Text-Streaming

`channels.slack.streaming` steuert das Live-Vorschauverhalten:

- `off`: Live-Vorschau-Streaming deaktivieren.
- `partial` (Standard): Vorschautext durch die neueste partielle Ausgabe ersetzen.
- `block`: aufgeteilte Vorschau-Updates anhängen.
- `progress`: Fortschrittsstatustext während der Generierung anzeigen und dann den finalen Text senden.
- `streaming.preview.toolProgress`: Wenn die Entwurfsvorschau aktiv ist, Tool-/Fortschrittsupdates in dieselbe bearbeitete Vorschau-Nachricht routen (Standard: `true`). Setzen Sie `false`, um separate Tool-/Fortschrittsnachrichten beizubehalten.

`channels.slack.streaming.nativeTransport` steuert natives Slack-Text-Streaming, wenn `channels.slack.streaming.mode` `partial` ist (Standard: `true`).

- Für natives Text-Streaming und die Anzeige des Slack-Assistenten-Thread-Status muss ein Antwort-Thread verfügbar sein. Die Thread-Auswahl folgt weiterhin `replyToMode`.
- Channel- und Gruppenchat-Wurzeln können weiterhin die normale Entwurfsvorschau verwenden, wenn natives Streaming nicht verfügbar ist.
- Slack-DMs auf oberster Ebene bleiben standardmäßig außerhalb von Threads, daher zeigen sie keine Vorschau im Thread-Stil; verwenden Sie Thread-Antworten oder `typingReaction`, wenn dort sichtbarer Fortschritt gewünscht ist.
- Medien und Nicht-Text-Payloads fallen auf die normale Zustellung zurück.
- Medien-/Fehler-Finals brechen ausstehende Vorschau-Bearbeitungen ab; geeignete Text-/Block-Finals werden nur übertragen, wenn sie die Vorschau direkt bearbeiten können.
- Wenn Streaming mitten in der Antwort fehlschlägt, fällt OpenClaw für verbleibende Payloads auf normale Zustellung zurück.

Verwenden Sie die Entwurfsvorschau statt nativem Slack-Text-Streaming:

```json5
{
  channels: {
    slack: {
      streaming: {
        mode: "partial",
        nativeTransport: false,
      },
    },
  },
}
```

Legacy-Schlüssel:

- `channels.slack.streamMode` (`replace | status_final | append`) wird automatisch zu `channels.slack.streaming.mode` migriert.
- Boolesches `channels.slack.streaming` wird automatisch zu `channels.slack.streaming.mode` und `channels.slack.streaming.nativeTransport` migriert.
- Legacy-`channels.slack.nativeStreaming` wird automatisch zu `channels.slack.streaming.nativeTransport` migriert.

## Fallback für Tipp-Reaktion

`typingReaction` fügt der eingehenden Slack-Nachricht eine temporäre Reaktion hinzu, während OpenClaw eine Antwort verarbeitet, und entfernt sie, wenn der Lauf abgeschlossen ist. Dies ist außerhalb von Thread-Antworten am nützlichsten, die einen standardmäßigen Statusindikator „schreibt gerade ...“ verwenden.

Auflösungsreihenfolge:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Hinweise:

- Slack erwartet Shortcodes (zum Beispiel `"hourglass_flowing_sand"`).
- Die Reaktion erfolgt nach bestem Bemühen, und die Bereinigung wird nach Abschluss des Antwort- oder Fehlerpfads automatisch versucht.

## Medien, Chunking und Zustellung

<AccordionGroup>
  <Accordion title="Inbound attachments">
    Slack-Dateianhänge werden von bei Slack gehosteten privaten URLs heruntergeladen (Token-authentifizierter Anfrageablauf) und in den Medienspeicher geschrieben, wenn der Abruf erfolgreich ist und Größenbeschränkungen dies erlauben. Datei-Platzhalter enthalten die Slack-`fileId`, damit Agents die Originaldatei mit `download-file` abrufen können.

    Downloads verwenden begrenzte Leerlauf- und Gesamt-Timeouts. Wenn der Abruf von Slack-Dateien stockt oder fehlschlägt, verarbeitet OpenClaw die Nachricht weiter und fällt auf den Datei-Platzhalter zurück.

    Die Laufzeit-Größenobergrenze für eingehende Inhalte ist standardmäßig `20MB`, sofern sie nicht durch `channels.slack.mediaMaxMb` überschrieben wird.

  </Accordion>

  <Accordion title="Ausgehender Text und Dateien">
    - Text-Chunks verwenden `channels.slack.textChunkLimit` (Standardwert 4000)
    - `channels.slack.chunkMode="newline"` aktiviert eine absatzpriorisierte Aufteilung
    - Dateiversand verwendet Slack-Upload-APIs und kann Thread-Antworten (`thread_ts`) einschließen
    - Die Obergrenze für ausgehende Medien folgt `channels.slack.mediaMaxMb`, wenn konfiguriert; andernfalls verwenden Kanal-Sends die MIME-Art-Standardwerte aus der Medien-Pipeline

  </Accordion>

  <Accordion title="Zustellungsziele">
    Bevorzugte explizite Ziele:

    - `user:<id>` für DMs
    - `channel:<id>` für Kanäle

    Slack-DMs werden beim Senden an Benutzerziele über Slack-Konversations-APIs geöffnet.

  </Accordion>
</AccordionGroup>

## Befehle und Slash-Verhalten

Slash-Befehle erscheinen in Slack entweder als einzelner konfigurierter Befehl oder als mehrere native Befehle. Konfigurieren Sie `channels.slack.slashCommand`, um Befehlsstandardwerte zu ändern:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Native Befehle erfordern [zusätzliche Manifest-Einstellungen](#additional-manifest-settings) in Ihrer Slack-App und werden stattdessen mit `channels.slack.commands.native: true` oder `commands.native: true` in globalen Konfigurationen aktiviert.

- Der automatische Modus für native Befehle ist für Slack **aus**, sodass `commands.native: "auto"` native Slack-Befehle nicht aktiviert.

```txt
/help
```

Native Argumentmenüs verwenden eine adaptive Rendering-Strategie, die vor dem Dispatch eines ausgewählten Optionswerts ein Bestätigungsmodal anzeigt:

- bis zu 5 Optionen: Button-Blöcke
- 6–100 Optionen: statisches Auswahlmenü
- mehr als 100 Optionen: externe Auswahl mit asynchroner Optionsfilterung, wenn Handler für Interaktivitätsoptionen verfügbar sind
- überschrittene Slack-Grenzwerte: codierte Optionswerte fallen auf Buttons zurück

```txt
/think
```

Slash-Sitzungen verwenden isolierte Schlüssel wie `agent:<agentId>:slack:slash:<userId>` und leiten Befehlsausführungen weiterhin mithilfe von `CommandTargetSessionKey` an die Ziel-Konversationssitzung weiter.

## Interaktive Antworten

Slack kann vom Agenten verfasste interaktive Antwortsteuerelemente rendern, diese Funktion ist jedoch standardmäßig deaktiviert.

Global aktivieren:

```json5
{
  channels: {
    slack: {
      capabilities: {
        interactiveReplies: true,
      },
    },
  },
}
```

Oder nur für ein Slack-Konto aktivieren:

```json5
{
  channels: {
    slack: {
      accounts: {
        ops: {
          capabilities: {
            interactiveReplies: true,
          },
        },
      },
    },
  },
}
```

Wenn aktiviert, können Agenten nur für Slack bestimmte Antwortdirektiven ausgeben:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Diese Direktiven werden in Slack Block Kit kompiliert und leiten Klicks oder Auswahlen über den bestehenden Slack-Interaktionsereignispfad zurück.

Hinweise:

- Dies ist Slack-spezifische UI. Andere Kanäle übersetzen Slack Block Kit-Direktiven nicht in ihre eigenen Button-Systeme.
- Die interaktiven Callback-Werte sind von OpenClaw generierte opake Tokens, keine rohen vom Agenten verfassten Werte.
- Wenn generierte interaktive Blöcke Slack Block Kit-Grenzwerte überschreiten würden, fällt OpenClaw auf die ursprüngliche Textantwort zurück, statt eine ungültige Blocks-Payload zu senden.

## Exec-Genehmigungen in Slack

Slack kann als nativer Genehmigungsclient mit interaktiven Buttons und Interaktionen fungieren, statt auf die Web-UI oder das Terminal zurückzufallen.

- Exec-Genehmigungen verwenden `channels.slack.execApprovals.*` für natives DM-/Kanal-Routing.
- Plugin-Genehmigungen können weiterhin über dieselbe Slack-native Button-Oberfläche aufgelöst werden, wenn die Anfrage bereits in Slack landet und die Art der Genehmigungs-ID `plugin:` ist.
- Die Autorisierung der Genehmiger wird weiterhin erzwungen: Nur als Genehmiger identifizierte Benutzer können Anfragen über Slack genehmigen oder ablehnen.

Dies verwendet dieselbe gemeinsame Genehmigungs-Button-Oberfläche wie andere Kanäle. Wenn `interactivity` in Ihren Slack-App-Einstellungen aktiviert ist, werden Genehmigungsaufforderungen direkt in der Konversation als Block Kit-Buttons gerendert.
Wenn diese Buttons vorhanden sind, sind sie die primäre Genehmigungs-UX; OpenClaw
sollte nur dann einen manuellen `/approve`-Befehl einschließen, wenn das Tool-Ergebnis angibt, dass Chat-
Genehmigungen nicht verfügbar sind oder eine manuelle Genehmigung der einzige Weg ist.

Konfigurationspfad:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (optional; fällt nach Möglichkeit auf `commands.ownerAllowFrom` zurück)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, Standard: `dm`)
- `agentFilter`, `sessionFilter`

Slack aktiviert native Exec-Genehmigungen automatisch, wenn `enabled` nicht gesetzt oder `"auto"` ist und mindestens ein
Genehmiger aufgelöst wird. Setzen Sie `enabled: false`, um Slack explizit als nativen Genehmigungsclient zu deaktivieren.
Setzen Sie `enabled: true`, um native Genehmigungen zu erzwingen, wenn Genehmiger aufgelöst werden.

Standardverhalten ohne explizite Slack-Exec-Genehmigungskonfiguration:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Eine explizite Slack-native Konfiguration ist nur erforderlich, wenn Sie Genehmiger überschreiben, Filter hinzufügen oder
Origin-Chat-Zustellung aktivieren möchten:

```json5
{
  channels: {
    slack: {
      execApprovals: {
        enabled: true,
        approvers: ["U12345678"],
        target: "both",
      },
    },
  },
}
```

Gemeinsame `approvals.exec`-Weiterleitung ist separat. Verwenden Sie sie nur, wenn Exec-Genehmigungsaufforderungen auch
an andere Chats oder explizite Out-of-Band-Ziele geroutet werden müssen. Gemeinsame `approvals.plugin`-Weiterleitung ist ebenfalls
separat; Slack-native Buttons können Plugin-Genehmigungen weiterhin auflösen, wenn diese Anfragen bereits
in Slack landen.

Gleich-Chat-`/approve` funktioniert auch in Slack-Kanälen und DMs, die bereits Befehle unterstützen. Siehe [Exec-Genehmigungen](/de/tools/exec-approvals) für das vollständige Genehmigungsweiterleitungsmodell.

## Ereignisse und Betriebsverhalten

- Nachrichtenbearbeitungen/-löschungen werden Systemereignissen zugeordnet.
- Thread-Broadcasts (Thread-Antworten mit „Auch an Kanal senden“) werden als normale Benutzernachrichten verarbeitet.
- Ereignisse zum Hinzufügen/Entfernen von Reaktionen werden Systemereignissen zugeordnet.
- Ereignisse für Mitgliederbeitritt/-austritt, Kanal erstellt/umbenannt und Pin hinzufügen/entfernen werden Systemereignissen zugeordnet.
- `channel_id_changed` kann Kanalkonfigurationsschlüssel migrieren, wenn `configWrites` aktiviert ist.
- Kanalthema-/Zweck-Metadaten werden als nicht vertrauenswürdiger Kontext behandelt und können in den Routing-Kontext injiziert werden.
- Thread-Starter und initiales Seeding des Thread-Verlaufskontexts werden bei Bedarf nach konfigurierten Sender-Allowlisten gefiltert.
- Block-Aktionen und Modal-Interaktionen geben strukturierte `Slack interaction: ...`-Systemereignisse mit umfangreichen Payload-Feldern aus:
  - Block-Aktionen: ausgewählte Werte, Labels, Picker-Werte und `workflow_*`-Metadaten
  - Modal-`view_submission`- und `view_closed`-Ereignisse mit gerouteten Kanalmetadaten und Formulareingaben

## Konfigurationsreferenz

Primäre Referenz: [Konfigurationsreferenz – Slack](/de/gateway/config-channels#slack).

<Accordion title="Wichtige Slack-Felder">

- Modus/Auth: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- DM-Zugriff: `dm.enabled`, `dmPolicy`, `allowFrom` (Legacy: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- Kompatibilitätsumschalter: `dangerouslyAllowNameMatching` (Notfalloption; deaktiviert lassen, sofern nicht erforderlich)
- Kanalzugriff: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- Threading/Verlauf: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- Zustellung: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- Betrieb/Funktionen: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Keine Antworten in Kanälen">
    Prüfen Sie in dieser Reihenfolge:

    - `groupPolicy`
    - Kanal-Allowlist (`channels.slack.channels`) — **Schlüssel müssen Kanal-IDs sein** (`C12345678`), keine Namen (`#channel-name`). Namensbasierte Schlüssel schlagen unter `groupPolicy: "allowlist"` stillschweigend fehl, da Kanal-Routing standardmäßig ID-priorisiert ist. So finden Sie eine ID: Rechtsklick auf den Kanal in Slack → **Link kopieren** — der `C...`-Wert am Ende der URL ist die Kanal-ID.
    - `requireMention`
    - kanalbezogene `users`-Allowlist

    Nützliche Befehle:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="DM-Nachrichten ignoriert">
    Prüfen Sie:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (oder Legacy `channels.slack.dm.policy`)
    - Pairing-Genehmigungen / Allowlist-Einträge
    - Slack Assistant-DM-Ereignisse: ausführliche Logs mit `drop message_changed`
      bedeuten üblicherweise, dass Slack ein bearbeitetes Assistant-Thread-Ereignis ohne
      wiederherstellbaren menschlichen Sender in den Nachrichtenmetadaten gesendet hat

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket-Modus verbindet nicht">
    Validieren Sie Bot- und App-Tokens sowie die Aktivierung des Socket-Modus in den Slack-App-Einstellungen.

    Wenn `openclaw channels status --probe --json` `botTokenStatus` oder
    `appTokenStatus: "configured_unavailable"` anzeigt, ist das Slack-Konto
    konfiguriert, aber die aktuelle Runtime konnte den SecretRef-gestützten
    Wert nicht auflösen.

  </Accordion>

  <Accordion title="HTTP-Modus empfängt keine Ereignisse">
    Validieren Sie:

    - Signing Secret
    - Webhook-Pfad
    - Slack Request URLs (Events + Interactivity + Slash Commands)
    - eindeutiger `webhookPath` pro HTTP-Konto

    Wenn `signingSecretStatus: "configured_unavailable"` in Konto-
    Snapshots erscheint, ist das HTTP-Konto konfiguriert, aber die aktuelle Runtime konnte
    das SecretRef-gestützte Signing Secret nicht auflösen.

  </Accordion>

  <Accordion title="Native/Slash-Befehle werden nicht ausgelöst">
    Prüfen Sie, was Sie beabsichtigt haben:

    - nativer Befehlsmodus (`channels.slack.commands.native: true`) mit passenden in Slack registrierten Slash-Befehlen
    - oder einzelner Slash-Befehlsmodus (`channels.slack.slashCommand.enabled: true`)

    Prüfen Sie auch `commands.useAccessGroups` und Kanal-/Benutzer-Allowlisten.

  </Accordion>
</AccordionGroup>

## Referenz zu Anhangs-Vision

Slack kann heruntergeladene Medien an den Agenten-Turn anhängen, wenn Slack-Dateidownloads erfolgreich sind und Größenlimits dies zulassen. Bilddateien können durch den Pfad für Medienverständnis geleitet oder direkt an ein visionsfähiges Antwortmodell übergeben werden; andere Dateien bleiben als herunterladbarer Dateikontext erhalten, statt als Bildeingabe behandelt zu werden.

### Unterstützte Medientypen

| Medientyp                      | Quelle               | Aktuelles Verhalten                                                            | Hinweise                                                                  |
| ------------------------------ | -------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| JPEG- / PNG- / GIF- / WebP-Bilder | Slack-Datei-URL     | Heruntergeladen und an den Turn für visionsfähige Verarbeitung angehängt       | Obergrenze pro Datei: `channels.slack.mediaMaxMb` (Standard 20 MB)        |
| PDF-Dateien                    | Slack-Datei-URL      | Heruntergeladen und als Dateikontext für Tools wie `download-file` oder `pdf` verfügbar gemacht | Slack-Inbound wandelt PDFs nicht automatisch in Image-Vision-Eingabe um |
| Andere Dateien                 | Slack-Datei-URL      | Nach Möglichkeit heruntergeladen und als Dateikontext verfügbar gemacht        | Binärdateien werden nicht als Bildeingabe behandelt                       |
| Thread-Antworten               | Thread-Starter-Dateien | Dateien aus der Root-Nachricht können als Kontext hydratisiert werden, wenn die Antwort keine direkten Medien enthält | Nur-Datei-Starter verwenden einen Anhangsplatzhalter                      |
| Nachrichten mit mehreren Bildern | Mehrere Slack-Dateien | Jede Datei wird unabhängig ausgewertet                                         | Die Slack-Verarbeitung ist auf acht Dateien pro Nachricht begrenzt        |

### Inbound-Pipeline

Wenn eine Slack-Nachricht mit Dateianhängen eintrifft:

1. OpenClaw lädt die Datei über die private URL von Slack mit dem Bot-Token (`xoxb-...`) herunter.
2. Bei Erfolg wird die Datei in den Medienspeicher geschrieben.
3. Heruntergeladene Medienpfade und Inhaltstypen werden dem Inbound-Kontext hinzugefügt.
4. Pfade für bildfähige Modelle/Tools können Bildanhänge aus diesem Kontext verwenden.
5. Nicht-Bilddateien bleiben als Dateimetadaten oder Medienreferenzen für Tools verfügbar, die sie verarbeiten können.

### Vererbung von Anhängen des Thread-Stamms

Wenn eine Nachricht in einem Thread eingeht (mit einem übergeordneten `thread_ts`):

- Wenn die Antwort selbst keine direkten Medien enthält und die enthaltene Stammnachricht Dateien hat, kann Slack die Stammdateien als Kontext des Thread-Starters anreichern.
- Direkte Antwortanhänge haben Vorrang vor Anhängen der Stammnachricht.
- Eine Stammnachricht, die nur Dateien und keinen Text enthält, wird mit einem Anhang-Platzhalter dargestellt, damit der Fallback ihre Dateien weiterhin einschließen kann.

### Verarbeitung mehrerer Anhänge

Wenn eine einzelne Slack-Nachricht mehrere Dateianhänge enthält:

- Jeder Anhang wird unabhängig durch die Medienpipeline verarbeitet.
- Heruntergeladene Medienreferenzen werden im Nachrichtenkontext zusammengeführt.
- Die Verarbeitungsreihenfolge folgt der Dateireihenfolge von Slack in der Event-Payload.
- Ein Fehler beim Herunterladen eines Anhangs blockiert die anderen nicht.

### Größen-, Download- und Modellgrenzen

- **Größenlimit**: Standardmäßig 20 MB pro Datei. Konfigurierbar über `channels.slack.mediaMaxMb`.
- **Download-Fehler**: Dateien, die Slack nicht ausliefern kann, abgelaufene URLs, nicht zugängliche Dateien, zu große Dateien und Slack-Auth-/Login-HTML-Antworten werden übersprungen, statt als nicht unterstützte Formate gemeldet zu werden.
- **Vision-Modell**: Die Bildanalyse verwendet das aktive Antwortmodell, wenn es Vision unterstützt, oder das unter `agents.defaults.imageModel` konfigurierte Bildmodell.

### Bekannte Einschränkungen

| Szenario                                  | Aktuelles Verhalten                                                                    | Problemumgehung                                                                    |
| ----------------------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Abgelaufene Slack-Datei-URL               | Datei wird übersprungen; kein Fehler wird angezeigt                                     | Laden Sie die Datei erneut in Slack hoch                                           |
| Vision-Modell nicht konfiguriert          | Bildanhänge werden als Medienreferenzen gespeichert, aber nicht als Bilder analysiert   | Konfigurieren Sie `agents.defaults.imageModel` oder verwenden Sie ein bildfähiges Antwortmodell |
| Sehr große Bilder (> 20 MB standardmäßig) | Wird gemäß Größenlimit übersprungen                                                     | Erhöhen Sie `channels.slack.mediaMaxMb`, wenn Slack dies zulässt                   |
| Weitergeleitete/geteilte Anhänge          | Text und von Slack gehostete Bild-/Dateimedien werden nach bestem Aufwand verarbeitet   | Teilen Sie sie direkt erneut im OpenClaw-Thread                                    |
| PDF-Anhänge                               | Werden als Datei-/Medienkontext gespeichert, nicht automatisch über Image Vision geroutet | Verwenden Sie `download-file` für Dateimetadaten oder das Tool `pdf` für die PDF-Analyse |

### Zugehörige Dokumentation

- [Pipeline für Medienverständnis](/de/nodes/media-understanding)
- [PDF-Tool](/de/tools/pdf)
- Epic: [#51349](https://github.com/openclaw/openclaw/issues/51349) — Aktivierung von Slack-Anhang-Vision
- Regressionstests: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- Live-Verifizierung: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## Verwandt

<CardGroup cols={2}>
  <Card title="Kopplung" icon="link" href="/de/channels/pairing">
    Koppeln Sie einen Slack-Benutzer mit dem Gateway.
  </Card>
  <Card title="Gruppen" icon="users" href="/de/channels/groups">
    Verhalten von Kanälen und Gruppen-DMs.
  </Card>
  <Card title="Kanalrouting" icon="route" href="/de/channels/channel-routing">
    Routen Sie eingehende Nachrichten an Agenten.
  </Card>
  <Card title="Sicherheit" icon="shield" href="/de/gateway/security">
    Bedrohungsmodell und Härtung.
  </Card>
  <Card title="Konfiguration" icon="sliders" href="/de/gateway/configuration">
    Konfigurationslayout und Priorität.
  </Card>
  <Card title="Slash-Befehle" icon="terminal" href="/de/tools/slash-commands">
    Befehlskatalog und Verhalten.
  </Card>
</CardGroup>
