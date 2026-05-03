---
read_when:
    - Slack einrichten oder Fehler im Slack-Socket-/HTTP-Modus beheben
summary: Slack-Einrichtung und Laufzeitverhalten (Socket Mode + HTTP-Anforderungs-URLs)
title: Slack
x-i18n:
    generated_at: "2026-05-03T06:36:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 85473159dcbd395144e5c37da140164023ac117406ba517d557fcf0989042448
    source_path: channels/slack.md
    workflow: 16
---

Produktionsreif für Direktnachrichten und Channels über Slack-App-Integrationen. Der Standardmodus ist Socket Mode; HTTP Request URLs werden ebenfalls unterstützt.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/de/channels/pairing">
    Slack-Direktnachrichten verwenden standardmäßig den Pairing-Modus.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/de/tools/slash-commands">
    Natives Befehlsverhalten und Befehlskatalog.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/de/channels/troubleshooting">
    Channel-übergreifende Diagnose- und Reparatur-Playbooks.
  </Card>
</CardGroup>

## Schnelle Einrichtung

<Tabs>
  <Tab title="Socket Mode (default)">
    <Steps>
      <Step title="Create a new Slack app">
        Drücken Sie in den Slack-App-Einstellungen die Schaltfläche **[Create New App](https://api.slack.com/apps/new)**:

        - wählen Sie **from a manifest** und wählen Sie einen Workspace für Ihre App aus
        - fügen Sie das [Beispielmanifest](#manifest-and-scope-checklist) unten ein und fahren Sie mit der Erstellung fort
        - generieren Sie ein **App-Level Token** (`xapp-...`) mit `connections:write`
        - installieren Sie die App und kopieren Sie das angezeigte **Bot Token** (`xoxb-...`)

      </Step>

      <Step title="Configure OpenClaw">

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

        Env-Fallback (nur Standardkonto):

```bash
SLACK_APP_TOKEN=xapp-...
SLACK_BOT_TOKEN=xoxb-...
```

      </Step>

      <Step title="Start gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP Request URLs">
    <Steps>
      <Step title="Create a new Slack app">
        Drücken Sie in den Slack-App-Einstellungen die Schaltfläche **[Create New App](https://api.slack.com/apps/new)**:

        - wählen Sie **from a manifest** und wählen Sie einen Workspace für Ihre App aus
        - fügen Sie das [Beispielmanifest](#manifest-and-scope-checklist) ein und aktualisieren Sie die URLs vor der Erstellung
        - speichern Sie das **Signing Secret** für die Anfrageverifizierung
        - installieren Sie die App und kopieren Sie das angezeigte **Bot Token** (`xoxb-...`)

      </Step>

      <Step title="Configure OpenClaw">

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

      <Step title="Start gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>
</Tabs>

## Transport-Feinabstimmung für Socket Mode

OpenClaw setzt das Pong-Timeout des Slack-SDK-Clients für Socket Mode standardmäßig auf 15 Sekunden. Überschreiben Sie die Transporteinstellungen nur, wenn Sie Workspace- oder Host-spezifische Feinabstimmung benötigen:

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

Verwenden Sie dies nur für Socket-Mode-Workspaces, die Slack-WebSocket-Pong- oder Server-Ping-Timeouts protokollieren, oder für Hosts mit bekannter Event-Loop-Überlastung. `clientPingTimeout` ist die Wartezeit auf Pong, nachdem das SDK einen Client-Ping gesendet hat; `serverPingTimeout` ist die Wartezeit auf Slack-Server-Pings. App-Nachrichten und Ereignisse bleiben Anwendungszustand, keine Signale für Transport-Liveness.

## Manifest- und Scope-Checkliste

Das Basismanifest der Slack-App ist für Socket Mode und HTTP Request URLs identisch. Nur der Block `settings` (und die Slash-Command-`url`) unterscheidet sich.

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
      "home_tab_enabled": true,
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
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_home_opened",
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

Ersetzen Sie für den **HTTP Request URLs-Modus** `settings` durch die HTTP-Variante und fügen Sie jedem Slash-Befehl `url` hinzu. Öffentliche URL erforderlich:

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

Zeigen Sie verschiedene Funktionen an, die die obigen Standardwerte erweitern.

Das Standardmanifest aktiviert den Slack App Home-Tab **Home** und abonniert `app_home_opened`. Wenn ein Workspace-Mitglied den Home-Tab öffnet, veröffentlicht OpenClaw mit `views.publish` eine sichere Standard-Home-Ansicht; es werden keine Konversationsdaten oder private Konfigurationen einbezogen. Der Tab **Messages** bleibt für Slack-Direktnachrichten aktiviert.

<AccordionGroup>
  <Accordion title="Optional native slash commands">

    Mehrere [native Slash-Befehle](#commands-and-slash-behavior) können statt eines einzelnen konfigurierten Befehls mit mehr Nuance verwendet werden:

    - Verwenden Sie `/agentstatus` statt `/status`, da der Befehl `/status` reserviert ist.
    - Es können höchstens 25 Slash-Befehle gleichzeitig verfügbar gemacht werden.

    Ersetzen Sie Ihren vorhandenen Abschnitt `features.slash_commands` durch eine Teilmenge der [verfügbaren Befehle](/de/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Socket Mode (default)">

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
        Verwenden Sie dieselbe Liste `slash_commands` wie oben für Socket Mode und fügen Sie jedem Eintrag `"url": "https://gateway-host.example.com/slack/events"` hinzu. Beispiel:

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
  <Accordion title="Optional authorship scopes (write operations)">
    Fügen Sie den Bot-Scope `chat:write.customize` hinzu, wenn ausgehende Nachrichten die Identität des aktiven Agenten (benutzerdefinierter Benutzername und Symbol) statt der Standardidentität der Slack-App verwenden sollen.

    Wenn Sie ein Emoji-Symbol verwenden, erwartet Slack die Syntax `:emoji_name:`.

  </Accordion>
  <Accordion title="Optionale Benutzer-Token-Bereiche (Lesevorgänge)">
    Wenn Sie `channels.slack.userToken` konfigurieren, sind typische Lesebereiche:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (wenn Sie von Slack-Suchlesevorgängen abhängen)

  </Accordion>
</AccordionGroup>

## Token-Modell

- `botToken` + `appToken` sind für den Socket-Modus erforderlich.
- Der HTTP-Modus erfordert `botToken` + `signingSecret`.
- `botToken`, `appToken`, `signingSecret` und `userToken` akzeptieren Klartext-
  Zeichenfolgen oder SecretRef-Objekte.
- Konfigurations-Tokens überschreiben den Env-Fallback.
- Der Env-Fallback `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` gilt nur für das Standardkonto.
- `userToken` (`xoxp-...`) ist ausschließlich konfigurierbar (kein Env-Fallback) und verwendet standardmäßig schreibgeschütztes Verhalten (`userTokenReadOnly: true`).

Verhalten des Status-Snapshots:

- Die Slack-Kontoinspektion verfolgt pro Anmeldedaten `*Source`- und `*Status`-
  Felder (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Der Status ist `available`, `configured_unavailable` oder `missing`.
- `configured_unavailable` bedeutet, dass das Konto über SecretRef
  oder eine andere nicht inline angegebene Secret-Quelle konfiguriert ist, der aktuelle Befehls-/Laufzeitpfad
  den tatsächlichen Wert jedoch nicht auflösen konnte.
- Im HTTP-Modus ist `signingSecretStatus` enthalten; im Socket-Modus ist das
  erforderliche Paar `botTokenStatus` + `appTokenStatus`.

<Tip>
Für Aktionen/Verzeichnislesevorgänge kann das Benutzer-Token bevorzugt werden, wenn es konfiguriert ist. Für Schreibvorgänge bleibt das Bot-Token bevorzugt; Schreibvorgänge mit Benutzer-Token sind nur erlaubt, wenn `userTokenReadOnly: false` gilt und das Bot-Token nicht verfügbar ist.
</Tip>

## Aktionen und Gates

Slack-Aktionen werden über `channels.slack.actions.*` gesteuert.

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
  <Tab title="DM-Richtlinie">
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

    Vorrang bei mehreren Konten:

    - `channels.slack.accounts.default.allowFrom` gilt nur für das Konto `default`.
    - Benannte Konten übernehmen `channels.slack.allowFrom`, wenn ihr eigenes `allowFrom` nicht festgelegt ist.
    - Benannte Konten übernehmen `channels.slack.accounts.default.allowFrom` nicht.

    Legacy-`channels.slack.dm.policy` und `channels.slack.dm.allowFrom` werden aus Kompatibilitätsgründen weiterhin gelesen. `openclaw doctor --fix` migriert sie zu `dmPolicy` und `allowFrom`, wenn dies ohne Änderung des Zugriffs möglich ist.

    Pairing in DMs verwendet `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Kanalrichtlinie">
    `channels.slack.groupPolicy` steuert die Kanalbehandlung:

    - `open`
    - `allowlist`
    - `disabled`

    Die Kanal-Allowlist befindet sich unter `channels.slack.channels` und **muss stabile Slack-Kanal-IDs** (zum Beispiel `C12345678`) als Konfigurationsschlüssel verwenden.

    Laufzeithinweis: Wenn `channels.slack` vollständig fehlt (reines Env-Setup), fällt die Laufzeit auf `groupPolicy="allowlist"` zurück und protokolliert eine Warnung (auch wenn `channels.defaults.groupPolicy` festgelegt ist).

    Namens-/ID-Auflösung:

    - Einträge der Kanal-Allowlist und DM-Allowlist werden beim Start aufgelöst, wenn der Token-Zugriff dies erlaubt
    - nicht aufgelöste Kanalnamenseinträge bleiben wie konfiguriert erhalten, werden für das Routing aber standardmäßig ignoriert
    - eingehende Autorisierung und Kanal-Routing sind standardmäßig ID-first; direkte Übereinstimmung mit Benutzernamen/Slug erfordert `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Namensbasierte Schlüssel (`#channel-name` oder `channel-name`) stimmen unter `groupPolicy: "allowlist"` **nicht** überein. Die Kanalsuche ist standardmäßig ID-first, daher wird ein namensbasierter Schlüssel nie erfolgreich routen und alle Nachrichten in diesem Kanal werden stillschweigend blockiert. Dies unterscheidet sich von `groupPolicy: "open"`, wobei der Kanalschlüssel für das Routing nicht erforderlich ist und ein namensbasierter Schlüssel scheinbar funktioniert.

    Verwenden Sie immer die Slack-Kanal-ID als Schlüssel. So finden Sie sie: Klicken Sie in Slack mit der rechten Maustaste auf den Kanal → **Link kopieren** — die ID (`C...`) steht am Ende der URL.

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

  <Tab title="Erwähnungen und Kanalbenutzer">
    Kanalnachrichten sind standardmäßig erwähnungsgeschützt.

    Erwähnungsquellen:

    - explizite App-Erwähnung (`<@botId>`)
    - Slack-Benutzergruppen-Erwähnung (`<!subteam^S...>`), wenn der Bot-Benutzer Mitglied dieser Benutzergruppe ist; erfordert `usergroups:read`
    - Erwähnungs-Regex-Muster (`agents.list[].groupChat.mentionPatterns`, Fallback `messages.groupChat.mentionPatterns`)
    - implizites Antwort-an-Bot-Thread-Verhalten (deaktiviert, wenn `thread.requireExplicitMention` `true` ist)

    Pro-Kanal-Steuerungen (`channels.slack.channels.<id>`; Namen nur über Startauflösung oder `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (Allowlist)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - Schlüsselformat für `toolsBySender`: `id:`, `e164:`, `username:`, `name:` oder `"*"`-Wildcard
      (Legacy-Schlüssel ohne Präfix werden weiterhin nur `id:` zugeordnet)

    `allowBots` ist für Kanäle und private Kanäle konservativ: Von Bots verfasste Raumnachrichten werden nur akzeptiert, wenn der sendende Bot ausdrücklich in der `users`-Allowlist dieses Raums aufgeführt ist oder wenn mindestens eine explizite Slack-Owner-ID aus `channels.slack.allowFrom` derzeit ein Raummitglied ist. Wildcards und Owner-Einträge mit Anzeigenamen erfüllen die Owner-Anwesenheit nicht. Owner-Anwesenheit verwendet Slack `conversations.members`; stellen Sie sicher, dass die App den passenden Lesebereich für den Raumtyp hat (`channels:read` für öffentliche Kanäle, `groups:read` für private Kanäle). Wenn die Mitgliedersuche fehlschlägt, verwirft OpenClaw die von einem Bot verfasste Raumnachricht.

  </Tab>
</Tabs>

## Threads, Sitzungen und Antwort-Tags

- DMs werden als `direct` geroutet; Kanäle als `channel`; MPIMs als `group`.
- Slack-Routenbindungen akzeptieren rohe Peer-IDs sowie Slack-Zielformen wie `channel:C12345678`, `user:U12345678` und `<@U12345678>`.
- Mit dem Standard `session.dmScope=main` werden Slack-DMs auf die Hauptsitzung des Agenten zusammengeführt.
- Kanalsitzungen: `agent:<agentId>:slack:channel:<channelId>`.
- Thread-Antworten können gegebenenfalls Thread-Sitzungssuffixe (`:thread:<threadTs>`) erstellen.
- Der Standard für `channels.slack.thread.historyScope` ist `thread`; der Standard für `thread.inheritParent` ist `false`.
- `channels.slack.thread.initialHistoryLimit` steuert, wie viele vorhandene Thread-Nachrichten abgerufen werden, wenn eine neue Thread-Sitzung startet (Standard `20`; auf `0` setzen, um dies zu deaktivieren).
- `channels.slack.thread.requireExplicitMention` (Standard `false`): Wenn `true`, werden implizite Thread-Erwähnungen unterdrückt, sodass der Bot nur auf explizite `@bot`-Erwähnungen innerhalb von Threads antwortet, selbst wenn der Bot bereits am Thread beteiligt war. Ohne dies umgehen Antworten in einem Thread, an dem der Bot beteiligt war, das `requireMention`-Gate.

Steuerungen für Antwort-Threads:

- `channels.slack.replyToMode`: `off|first|all|batched` (Standard `off`)
- `channels.slack.replyToModeByChatType`: pro `direct|group|channel`
- Legacy-Fallback für direkte Chats: `channels.slack.dm.replyToMode`

Manuelle Antwort-Tags werden unterstützt:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` deaktiviert **alle** Antwort-Threads in Slack, einschließlich expliziter `[[reply_to_*]]`-Tags. Dies unterscheidet sich von Telegram, wo explizite Tags im Modus `"off"` weiterhin berücksichtigt werden. Slack-Threads blenden Nachrichten im Kanal aus, während Telegram-Antworten inline sichtbar bleiben.
</Note>

## Bestätigungsreaktionen

`ackReaction` sendet ein Bestätigungs-Emoji, während OpenClaw eine eingehende Nachricht verarbeitet.

Auflösungsreihenfolge:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- Fallback auf Emoji der Agentenidentität (`agents.list[].identity.emoji`, sonst "👀")

Hinweise:

- Slack erwartet Shortcodes (zum Beispiel `"eyes"`).
- Verwenden Sie `""`, um die Reaktion für das Slack-Konto oder global zu deaktivieren.

## Text-Streaming

`channels.slack.streaming` steuert das Live-Vorschauverhalten:

- `off`: Live-Vorschau-Streaming deaktivieren.
- `partial` (Standard): Vorschautext durch die neueste Teilausgabe ersetzen.
- `block`: Vorschauaktualisierungen in Chunks anhängen.
- `progress`: Fortschrittsstatustext während der Generierung anzeigen, dann den finalen Text senden.
- `streaming.preview.toolProgress`: Wenn die Entwurfsvorschau aktiv ist, Tool-/Fortschrittsaktualisierungen in dieselbe bearbeitete Vorschaunachricht routen (Standard: `true`). Setzen Sie dies auf `false`, um separate Tool-/Fortschrittsnachrichten beizubehalten.

`channels.slack.streaming.nativeTransport` steuert Slack-natives Text-Streaming, wenn `channels.slack.streaming.mode` `partial` ist (Standard: `true`).

- Ein Antwort-Thread muss verfügbar sein, damit natives Text-Streaming und der Slack-Assistenten-Thread-Status erscheinen. Die Thread-Auswahl folgt weiterhin `replyToMode`.
- Kanal-, Gruppenchat- und Top-Level-DM-Roots können weiterhin die normale Entwurfsvorschau verwenden, wenn natives Streaming nicht verfügbar ist oder kein Antwort-Thread existiert.
- Top-Level-Slack-DMs bleiben standardmäßig außerhalb von Threads, daher zeigen sie Slacks native Stream-/Statusvorschau im Thread-Stil nicht an; OpenClaw veröffentlicht und bearbeitet stattdessen eine Entwurfsvorschau in der DM.
- Medien und Nicht-Text-Payloads fallen auf normale Zustellung zurück.
- Medien-/Fehler-Finals brechen ausstehende Vorschau-Bearbeitungen ab; geeignete Text-/Block-Finals werden nur geflusht, wenn sie die Vorschau direkt bearbeiten können.
- Wenn Streaming mitten in der Antwort fehlschlägt, fällt OpenClaw für verbleibende Payloads auf normale Zustellung zurück.

Entwurfsvorschau statt Slack-nativem Text-Streaming verwenden:

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

## Fallback für Tippreaktion

`typingReaction` fügt der eingehenden Slack-Nachricht eine temporäre Reaktion hinzu, während OpenClaw eine Antwort verarbeitet, und entfernt sie, wenn der Lauf abgeschlossen ist. Dies ist besonders außerhalb von Thread-Antworten nützlich, die eine standardmäßige Statusanzeige „is typing...“ verwenden.

Auflösungsreihenfolge:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Hinweise:

- Slack erwartet Shortcodes (zum Beispiel `"hourglass_flowing_sand"`).
- Die Reaktion erfolgt nach Best-Effort-Prinzip, und die Bereinigung wird automatisch versucht, nachdem die Antwort oder der Fehlerpfad abgeschlossen ist.

## Medien, Chunking und Zustellung

<AccordionGroup>
  <Accordion title="Eingehende Anhänge">
    Slack-Dateianhänge werden von privaten, bei Slack gehosteten URLs heruntergeladen (tokenauthentifizierter Request-Flow) und in den Medienspeicher geschrieben, wenn der Abruf erfolgreich ist und die Größenlimits es zulassen. Datei-Platzhalter enthalten die Slack-`fileId`, damit Agenten die Originaldatei mit `download-file` abrufen können.

    Downloads verwenden begrenzte Leerlauf- und Gesamt-Timeouts. Wenn der Abruf von Slack-Dateien stockt oder fehlschlägt, verarbeitet OpenClaw die Nachricht weiter und fällt auf den Datei-Platzhalter zurück.

    Das Laufzeit-Größenlimit für eingehende Dateien ist standardmäßig `20MB`, sofern es nicht durch `channels.slack.mediaMaxMb` überschrieben wird.

  </Accordion>

  <Accordion title="Ausgehender Text und Dateien">
    - Textabschnitte verwenden `channels.slack.textChunkLimit` (Standard 4000)
    - `channels.slack.chunkMode="newline"` aktiviert absatzpriorisiertes Aufteilen
    - Dateiversand verwendet Slack-Upload-APIs und kann Thread-Antworten (`thread_ts`) enthalten
    - Das Größenlimit für ausgehende Medien folgt `channels.slack.mediaMaxMb`, wenn konfiguriert; andernfalls verwenden Kanal-Sends die MIME-Art-Standardwerte aus der Medien-Pipeline

  </Accordion>

  <Accordion title="Zustellungsziele">
    Bevorzugte explizite Ziele:

    - `user:<id>` für DMs
    - `channel:<id>` für Kanäle

    Slack-DMs, die nur Text/Blöcke enthalten, können direkt an Benutzer-IDs posten; Datei-Uploads und Thread-Sends öffnen die DM zuerst über die Slack-Konversations-APIs, weil diese Pfade eine konkrete Konversations-ID benötigen.

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

- Der Auto-Modus für native Befehle ist für Slack **aus**, daher aktiviert `commands.native: "auto"` keine nativen Slack-Befehle.

```txt
/help
```

Native Argumentmenüs verwenden eine adaptive Rendering-Strategie, die vor dem Dispatch eines ausgewählten Optionswerts ein Bestätigungsmodal anzeigt:

- bis zu 5 Optionen: Button-Blöcke
- 6-100 Optionen: statisches Auswahlmenü
- mehr als 100 Optionen: externe Auswahl mit asynchroner Optionsfilterung, wenn Handler für Interaktivitätsoptionen verfügbar sind
- überschrittene Slack-Limits: codierte Optionswerte fallen auf Buttons zurück

```txt
/think
```

Slash-Sitzungen verwenden isolierte Schlüssel wie `agent:<agentId>:slack:slash:<userId>` und leiten Befehlsausführungen weiterhin mit `CommandTargetSessionKey` an die Ziel-Konversationssitzung weiter.

## Interaktive Antworten

Slack kann von Agenten verfasste interaktive Antwortsteuerelemente rendern, diese Funktion ist jedoch standardmäßig deaktiviert.

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

Diese Direktiven werden zu Slack Block Kit kompiliert und leiten Klicks oder Auswahlen über den bestehenden Slack-Interaktionsereignispfad zurück.

Hinweise:

- Dies ist Slack-spezifische UI. Andere Kanäle übersetzen Slack Block Kit-Direktiven nicht in ihre eigenen Button-Systeme.
- Die interaktiven Callback-Werte sind von OpenClaw generierte undurchsichtige Tokens, nicht rohe von Agenten verfasste Werte.
- Wenn generierte interaktive Blöcke die Slack Block Kit-Limits überschreiten würden, fällt OpenClaw auf die ursprüngliche Textantwort zurück, statt eine ungültige Blocks-Payload zu senden.

## Exec-Genehmigungen in Slack

Slack kann als nativer Genehmigungsclient mit interaktiven Buttons und Interaktionen fungieren, statt auf die Web-UI oder das Terminal zurückzufallen.

- Exec-Genehmigungen verwenden `channels.slack.execApprovals.*` für natives DM-/Kanal-Routing.
- Plugin-Genehmigungen können weiterhin über dieselbe Slack-native Button-Oberfläche aufgelöst werden, wenn die Anfrage bereits in Slack landet und die Art der Genehmigungs-ID `plugin:` ist.
- Die Autorisierung von genehmigenden Personen wird weiterhin erzwungen: Nur Benutzer, die als genehmigungsberechtigt identifiziert sind, können Anfragen über Slack genehmigen oder ablehnen.

Dies verwendet dieselbe gemeinsame Genehmigungs-Button-Oberfläche wie andere Kanäle. Wenn `interactivity` in Ihren Slack-App-Einstellungen aktiviert ist, werden Genehmigungsaufforderungen direkt in der Konversation als Block Kit-Buttons gerendert.
Wenn diese Buttons vorhanden sind, sind sie die primäre Genehmigungs-UX; OpenClaw
sollte nur dann einen manuellen `/approve`-Befehl einschließen, wenn das Tool-Ergebnis besagt, dass Chat-
Genehmigungen nicht verfügbar sind oder manuelle Genehmigung der einzige Weg ist.

Konfigurationspfad:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (optional; fällt wenn möglich auf `commands.ownerAllowFrom` zurück)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, Standard: `dm`)
- `agentFilter`, `sessionFilter`

Slack aktiviert native Exec-Genehmigungen automatisch, wenn `enabled` nicht gesetzt oder `"auto"` ist und mindestens eine
genehmigungsberechtigte Person aufgelöst wird. Setzen Sie `enabled: false`, um Slack als nativen Genehmigungsclient explizit zu deaktivieren.
Setzen Sie `enabled: true`, um native Genehmigungen zu erzwingen, wenn genehmigungsberechtigte Personen aufgelöst werden.

Standardverhalten ohne explizite Slack-Exec-Genehmigungskonfiguration:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Eine explizite Slack-native Konfiguration wird nur benötigt, wenn Sie genehmigungsberechtigte Personen überschreiben, Filter hinzufügen oder
Zustellung im Ursprungs-Chat aktivieren möchten:

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
an andere Chats oder explizite Out-of-band-Ziele geroutet werden müssen. Gemeinsame `approvals.plugin`-Weiterleitung ist ebenfalls
separat; Slack-native Buttons können Plugin-Genehmigungen weiterhin auflösen, wenn diese Anfragen bereits
in Slack landen.

Same-Chat-`/approve` funktioniert auch in Slack-Kanälen und DMs, die bereits Befehle unterstützen. Siehe [Exec-Genehmigungen](/de/tools/exec-approvals) für das vollständige Modell zur Genehmigungsweiterleitung.

## Ereignisse und Betriebsverhalten

- Nachrichtenbearbeitungen/-löschungen werden Systemereignissen zugeordnet.
- Thread-Broadcasts (Thread-Antworten mit „Also send to channel“) werden als normale Benutzernachrichten verarbeitet.
- Ereignisse zum Hinzufügen/Entfernen von Reaktionen werden Systemereignissen zugeordnet.
- Ereignisse zu Beitritt/Austritt von Mitgliedern, erstellten/umbenannten Kanälen und hinzugefügten/entfernten Pins werden Systemereignissen zugeordnet.
- `channel_id_changed` kann Kanal-Konfigurationsschlüssel migrieren, wenn `configWrites` aktiviert ist.
- Metadaten zu Kanalthema/-zweck werden als nicht vertrauenswürdiger Kontext behandelt und können in den Routing-Kontext eingefügt werden.
- Thread-Starter und initiales Seeding des Thread-Verlaufskontexts werden, sofern zutreffend, durch konfigurierte Sender-Allowlists gefiltert.
- Blockaktionen und modale Interaktionen geben strukturierte `Slack interaction: ...`-Systemereignisse mit umfangreichen Payload-Feldern aus:
  - Blockaktionen: ausgewählte Werte, Labels, Picker-Werte und `workflow_*`-Metadaten
  - modale `view_submission`- und `view_closed`-Ereignisse mit gerouteten Kanalmetadaten und Formulareingaben

## Konfigurationsreferenz

Primäre Referenz: [Konfigurationsreferenz - Slack](/de/gateway/config-channels#slack).

<Accordion title="Wichtige Slack-Felder">

- Modus/Auth: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- DM-Zugriff: `dm.enabled`, `dmPolicy`, `allowFrom` (Legacy: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- Kompatibilitäts-Schalter: `dangerouslyAllowNameMatching` (Notfalloption; ausgeschaltet lassen, sofern nicht erforderlich)
- Kanalzugriff: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- Threading/Verlauf: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- Zustellung: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- Betrieb/Funktionen: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Keine Antworten in Kanälen">
    Prüfen Sie der Reihe nach:

    - `groupPolicy`
    - Kanal-Allowlist (`channels.slack.channels`) — **Schlüssel müssen Kanal-IDs sein** (`C12345678`), keine Namen (`#channel-name`). Namensbasierte Schlüssel schlagen unter `groupPolicy: "allowlist"` stillschweigend fehl, weil Kanal-Routing standardmäßig ID-first ist. So finden Sie eine ID: Klicken Sie in Slack mit der rechten Maustaste auf den Kanal → **Copy link** — der `C...`-Wert am Ende der URL ist die Kanal-ID.
    - `requireMention`
    - kanalbezogene `users`-Allowlist

    Nützliche Befehle:

```bash
openclaw channels status --probe
openclaw logs --follow
openclaw doctor
```

  </Accordion>

  <Accordion title="DM-Nachrichten werden ignoriert">
    Prüfen Sie:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (oder Legacy `channels.slack.dm.policy`)
    - Pairing-Genehmigungen / Allowlist-Einträge
    - Slack Assistant-DM-Ereignisse: ausführliche Logs mit `drop message_changed`
      bedeuten üblicherweise, dass Slack ein bearbeitetes Assistant-Thread-Ereignis ohne einen
      wiederherstellbaren menschlichen Sender in den Nachrichtenmetadaten gesendet hat

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket Mode verbindet sich nicht">
    Validieren Sie Bot- und App-Tokens sowie die Aktivierung von Socket Mode in den Slack-App-Einstellungen.

    Wenn `openclaw channels status --probe --json` `botTokenStatus` oder
    `appTokenStatus: "configured_unavailable"` zeigt, ist das Slack-Konto
    konfiguriert, aber die aktuelle Laufzeit konnte den durch SecretRef gestützten
    Wert nicht auflösen.

  </Accordion>

  <Accordion title="HTTP-Modus empfängt keine Ereignisse">
    Validieren Sie:

    - Signing Secret
    - Webhook-Pfad
    - Slack Request URLs (Ereignisse + Interaktivität + Slash Commands)
    - eindeutiger `webhookPath` pro HTTP-Konto

    Wenn `signingSecretStatus: "configured_unavailable"` in Konto-
    Snapshots erscheint, ist das HTTP-Konto konfiguriert, aber die aktuelle Laufzeit konnte das durch SecretRef gestützte Signing Secret nicht
    auflösen.

  </Accordion>

  <Accordion title="Native/Slash-Befehle werden nicht ausgelöst">
    Prüfen Sie, ob Sie Folgendes beabsichtigt haben:

    - nativer Befehlsmodus (`channels.slack.commands.native: true`) mit passenden in Slack registrierten Slash-Befehlen
    - oder Einzel-Slash-Befehlsmodus (`channels.slack.slashCommand.enabled: true`)

    Prüfen Sie außerdem `commands.useAccessGroups` sowie Kanal-/Benutzer-Allowlists.

  </Accordion>
</AccordionGroup>

## Referenz für Attachment Vision

Slack kann heruntergeladene Medien an den Agenten-Turn anhängen, wenn Slack-Dateidownloads erfolgreich sind und Größenlimits es zulassen. Bilddateien können durch den Pfad für Medienverständnis oder direkt an ein antwortendes Modell mit Vision-Fähigkeiten übergeben werden; andere Dateien werden als herunterladbarer Dateikontext beibehalten, statt als Bildeingabe behandelt zu werden.

### Unterstützte Medientypen

| Medientyp                     | Quelle               | Aktuelles Verhalten                                                                  | Hinweise                                                                     |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| JPEG-/PNG-/GIF-/WebP-Bilder | Slack-Datei-URL       | Heruntergeladen und dem Turn für bildfähige Verarbeitung angehängt                   | Begrenzung pro Datei: `channels.slack.mediaMaxMb` (Standard 20 MB)                 |
| PDF-Dateien                      | Slack-Datei-URL       | Heruntergeladen und als Dateikontext für Tools wie `download-file` oder `pdf` bereitgestellt | Eingehende Slack-Nachrichten konvertieren PDFs nicht automatisch in Bild-Vision-Eingaben |
| Andere Dateien                    | Slack-Datei-URL       | Wenn möglich heruntergeladen und als Dateikontext bereitgestellt                              | Binärdateien werden nicht als Bildeingabe behandelt                               |
| Thread-Antworten                 | Dateien des Thread-Startbeitrags | Dateien der Root-Nachricht können als Kontext hydratisiert werden, wenn die Antwort keine direkten Medien enthält  | Reine Datei-Startbeiträge verwenden einen Anhang-Platzhalter                          |
| Nachrichten mit mehreren Bildern           | Mehrere Slack-Dateien | Jede Datei wird unabhängig ausgewertet                                              | Die Slack-Verarbeitung ist auf acht Dateien pro Nachricht begrenzt                     |

### Eingehende Pipeline

Wenn eine Slack-Nachricht mit Dateianhängen eintrifft:

1. OpenClaw lädt die Datei über die private URL von Slack mit dem Bot-Token (`xoxb-...`) herunter.
2. Die Datei wird bei Erfolg in den Medienspeicher geschrieben.
3. Heruntergeladene Medienpfade und Inhaltstypen werden dem eingehenden Kontext hinzugefügt.
4. Bildfähige Modell-/Tool-Pfade können Bildanhänge aus diesem Kontext verwenden.
5. Nicht-Bilddateien bleiben als Dateimetadaten oder Medienreferenzen für Tools verfügbar, die sie verarbeiten können.

### Vererbung von Anhängen des Thread-Roots

Wenn eine Nachricht in einem Thread eintrifft (mit einem übergeordneten `thread_ts`):

- Wenn die Antwort selbst keine direkten Medien enthält und die enthaltene Root-Nachricht Dateien hat, kann Slack die Root-Dateien als Kontext des Thread-Startbeitrags hydratisieren.
- Direkte Antwortanhänge haben Vorrang vor Anhängen der Root-Nachricht.
- Eine Root-Nachricht, die nur Dateien und keinen Text enthält, wird mit einem Anhang-Platzhalter dargestellt, damit der Fallback ihre Dateien weiterhin einschließen kann.

### Verarbeitung mehrerer Anhänge

Wenn eine einzelne Slack-Nachricht mehrere Dateianhänge enthält:

- Jeder Anhang wird unabhängig durch die Medien-Pipeline verarbeitet.
- Heruntergeladene Medienreferenzen werden im Nachrichtenkontext zusammengeführt.
- Die Verarbeitungsreihenfolge folgt der Dateireihenfolge von Slack in der Event-Nutzlast.
- Ein Fehler beim Download eines Anhangs blockiert die anderen nicht.

### Größen-, Download- und Modellgrenzen

- **Größenbegrenzung**: Standardmäßig 20 MB pro Datei. Konfigurierbar über `channels.slack.mediaMaxMb`.
- **Download-Fehler**: Dateien, die Slack nicht bereitstellen kann, abgelaufene URLs, nicht zugängliche Dateien, zu große Dateien und Slack-Authentifizierungs-/Login-HTML-Antworten werden übersprungen, statt als nicht unterstützte Formate gemeldet zu werden.
- **Vision-Modell**: Die Bildanalyse verwendet das aktive Antwortmodell, wenn es Vision unterstützt, oder das unter `agents.defaults.imageModel` konfigurierte Bildmodell.

### Bekannte Einschränkungen

| Szenario                               | Aktuelles Verhalten                                                             | Abhilfe                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Abgelaufene Slack-Datei-URL                 | Datei wird übersprungen; es wird kein Fehler angezeigt                                                 | Laden Sie die Datei erneut in Slack hoch                                                |
| Vision-Modell nicht konfiguriert            | Bildanhänge werden als Medienreferenzen gespeichert, aber nicht als Bilder analysiert | Konfigurieren Sie `agents.defaults.imageModel` oder verwenden Sie ein bildfähiges Antwortmodell |
| Sehr große Bilder (> 20 MB standardmäßig) | Wird gemäß Größenbegrenzung übersprungen                                                         | Erhöhen Sie `channels.slack.mediaMaxMb`, wenn Slack dies zulässt                       |
| Weitergeleitete/geteilte Anhänge           | Text und von Slack gehostete Bild-/Dateimedien werden nach bestem Aufwand verarbeitet                       | Teilen Sie sie direkt erneut im OpenClaw-Thread                                   |
| PDF-Anhänge                        | Als Datei-/Medienkontext gespeichert, nicht automatisch durch Bild-Vision geleitet  | Verwenden Sie `download-file` für Dateimetadaten oder das Tool `pdf` für die PDF-Analyse   |

### Zugehörige Dokumentation

- [Pipeline für Medienverständnis](/de/nodes/media-understanding)
- [PDF-Tool](/de/tools/pdf)
- Epic: [#51349](https://github.com/openclaw/openclaw/issues/51349) — Aktivierung von Slack-Anhang-Vision
- Regressionstests: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- Live-Verifizierung: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## Verwandt

<CardGroup cols={2}>
  <Card title="Pairing" icon="link" href="/de/channels/pairing">
    Koppeln Sie einen Slack-Benutzer mit dem Gateway.
  </Card>
  <Card title="Groups" icon="users" href="/de/channels/groups">
    Verhalten von Channels und Gruppen-DMs.
  </Card>
  <Card title="Channel routing" icon="route" href="/de/channels/channel-routing">
    Leiten Sie eingehende Nachrichten an Agenten weiter.
  </Card>
  <Card title="Security" icon="shield" href="/de/gateway/security">
    Bedrohungsmodell und Härtung.
  </Card>
  <Card title="Configuration" icon="sliders" href="/de/gateway/configuration">
    Konfigurationslayout und Rangfolge.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/de/tools/slash-commands">
    Befehlskatalog und Verhalten.
  </Card>
</CardGroup>
