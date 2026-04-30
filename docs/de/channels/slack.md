---
read_when:
    - Slack einrichten oder den Slack-Socket-/HTTP-Modus debuggen
summary: Slack-Einrichtung und Laufzeitverhalten (Socket-Modus + HTTP-Anfrage-URLs)
title: Slack
x-i18n:
    generated_at: "2026-04-30T06:41:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 08024bd947ddeb00a1ab3aaa3864cf31817303bbc0523902acdc539fc662e127
    source_path: channels/slack.md
    workflow: 16
---

Produktionsreif für DMs und Kanäle über Slack-App-Integrationen. Der Standardmodus ist Socket Mode; HTTP Request URLs werden ebenfalls unterstützt.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/de/channels/pairing">
    Slack-DMs verwenden standardmäßig den Pairing-Modus.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/de/tools/slash-commands">
    Natives Befehlsverhalten und Befehlskatalog.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/de/channels/troubleshooting">
    Kanalübergreifende Diagnose- und Reparatur-Playbooks.
  </Card>
</CardGroup>

## Schnelle Einrichtung

<Tabs>
  <Tab title="Socket Mode (default)">
    <Steps>
      <Step title="Create a new Slack app">
        Drücken Sie in den Slack-App-Einstellungen die Schaltfläche **[Create New App](https://api.slack.com/apps/new)**:

        - wählen Sie **from a manifest** aus und wählen Sie einen Workspace für Ihre App
        - fügen Sie das unten stehende [Beispielmanifest](#manifest-and-scope-checklist) ein und fahren Sie mit der Erstellung fort
        - erstellen Sie ein **App-Level Token** (`xapp-...`) mit `connections:write`
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

        - wählen Sie **from a manifest** aus und wählen Sie einen Workspace für Ihre App
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
        Verwenden Sie eindeutige Webhook-Pfade für Multi-Account-HTTP

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

## Transport-Tuning für Socket Mode

OpenClaw setzt das Pong-Timeout des Slack-SDK-Clients für Socket Mode standardmäßig auf 15 Sekunden. Überschreiben Sie die Transporteinstellungen nur, wenn Sie Workspace- oder host-spezifisches Tuning benötigen:

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

Verwenden Sie dies nur für Socket-Mode-Workspaces, die Slack-WebSocket-Pong- oder Server-Ping-Timeouts protokollieren oder auf Hosts mit bekannter Event-Loop-Starvation ausgeführt werden. `clientPingTimeout` ist die Pong-Wartezeit, nachdem das SDK einen Client-Ping gesendet hat; `serverPingTimeout` ist die Wartezeit auf Slack-Server-Pings. App-Nachrichten und Ereignisse bleiben Anwendungszustand, keine Signale für Transport-Liveness.

## Manifest- und Scope-Checkliste

Das Basismanifest der Slack-App ist für Socket Mode und HTTP Request URLs gleich. Nur der Block `settings` (und die Slash-Command-`url`) unterscheidet sich.

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

Für den **Modus HTTP Request URLs** ersetzen Sie `settings` durch die HTTP-Variante und fügen Sie jedem Slash Command `url` hinzu. Öffentliche URL erforderlich:

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

Aktivieren Sie verschiedene Funktionen, die die oben genannten Standards erweitern.

<AccordionGroup>
  <Accordion title="Optional native slash commands">

    Mehrere [native Slash Commands](#commands-and-slash-behavior) können statt eines einzelnen konfigurierten Befehls mit Nuance verwendet werden:

    - Verwenden Sie `/agentstatus` statt `/status`, da der Befehl `/status` reserviert ist.
    - Es können nicht mehr als 25 Slash Commands gleichzeitig verfügbar gemacht werden.

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
  <Accordion title="Optional authorship scopes (write operations)">
    Fügen Sie den Bot-Scope `chat:write.customize` hinzu, wenn ausgehende Nachrichten die Identität des aktiven Agents (benutzerdefinierter Benutzername und benutzerdefiniertes Symbol) statt der Standardidentität der Slack-App verwenden sollen.

    Wenn Sie ein Emoji-Symbol verwenden, erwartet Slack die Syntax `:emoji_name:`.

  </Accordion>
  <Accordion title="Optional user-token scopes (read operations)">
    Wenn Sie `channels.slack.userToken` konfigurieren, sind typische Lese-Scopes:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (wenn Sie auf Slack-Suchlesevorgänge angewiesen sind)

  </Accordion>
</AccordionGroup>

## Token-Modell

- `botToken` + `appToken` sind für Socket Mode erforderlich.
- HTTP-Modus erfordert `botToken` + `signingSecret`.
- `botToken`, `appToken`, `signingSecret` und `userToken` akzeptieren Klartextzeichenfolgen oder SecretRef-Objekte.
- Konfigurationstokens überschreiben den Env-Fallback.
- Der Env-Fallback `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` gilt nur für das Standardkonto.
- `userToken` (`xoxp-...`) ist nur per Konfiguration verfügbar (kein Env-Fallback) und verwendet standardmäßig ein schreibgeschütztes Verhalten (`userTokenReadOnly: true`).

Status-Snapshot-Verhalten:

- Die Slack-Kontoprüfung verfolgt pro Zugangsdaten die Felder `*Source` und `*Status` (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Der Status ist `available`, `configured_unavailable` oder `missing`.
- `configured_unavailable` bedeutet, dass das Konto über SecretRef oder eine andere nicht inline angegebene Secret-Quelle konfiguriert ist, der aktuelle Befehls- oder Laufzeitpfad den tatsächlichen Wert aber nicht auflösen konnte.
- Im HTTP-Modus ist `signingSecretStatus` enthalten; im Socket Mode ist das erforderliche Paar `botTokenStatus` + `appTokenStatus`.

<Tip>
Für Aktionen und Verzeichnis-Lesevorgänge kann das Benutzer-Token bevorzugt werden, wenn es konfiguriert ist. Für Schreibvorgänge bleibt das Bot-Token bevorzugt; Schreibvorgänge mit Benutzer-Token sind nur erlaubt, wenn `userTokenReadOnly: false` gesetzt ist und kein Bot-Token verfügbar ist.
</Tip>

## Aktionen und Gates

Slack-Aktionen werden über `channels.slack.actions.*` gesteuert.

Verfügbare Aktionsgruppen in den aktuellen Slack-Tools:

| Gruppe     | Standard  |
| ---------- | --------- |
| messages   | aktiviert |
| reactions  | aktiviert |
| pins       | aktiviert |
| memberInfo | aktiviert |
| emojiList  | aktiviert |

Aktuelle Slack-Nachrichtenaktionen umfassen `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` und `emoji-list`. `download-file` akzeptiert Slack-Datei-IDs, die in Platzhaltern für eingehende Dateien angezeigt werden, und gibt Bildvorschauen für Bilder oder lokale Dateimetadaten für andere Dateitypen zurück.

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

    Priorität bei mehreren Konten:

    - `channels.slack.accounts.default.allowFrom` gilt nur für das Konto `default`.
    - Benannte Konten erben `channels.slack.allowFrom`, wenn ihr eigenes `allowFrom` nicht gesetzt ist.
    - Benannte Konten erben `channels.slack.accounts.default.allowFrom` nicht.

    Legacy-`channels.slack.dm.policy` und `channels.slack.dm.allowFrom` werden aus Kompatibilitätsgründen weiterhin gelesen. `openclaw doctor --fix` migriert sie zu `dmPolicy` und `allowFrom`, wenn dies ohne Änderung des Zugriffs möglich ist.

    Pairing in DMs verwendet `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Kanalrichtlinie">
    `channels.slack.groupPolicy` steuert die Kanalbehandlung:

    - `open`
    - `allowlist`
    - `disabled`

    Die Kanal-Allowlist befindet sich unter `channels.slack.channels` und **muss stabile Slack-Kanal-IDs** (zum Beispiel `C12345678`) als Konfigurationsschlüssel verwenden.

    Laufzeithinweis: Wenn `channels.slack` vollständig fehlt (nur Env-Einrichtung), fällt die Laufzeit auf `groupPolicy="allowlist"` zurück und protokolliert eine Warnung (auch wenn `channels.defaults.groupPolicy` gesetzt ist).

    Namens-/ID-Auflösung:

    - Kanal-Allowlist-Einträge und DM-Allowlist-Einträge werden beim Start aufgelöst, wenn der Token-Zugriff dies erlaubt
    - nicht aufgelöste Kanalnamenseinträge bleiben wie konfiguriert erhalten, werden aber standardmäßig beim Routing ignoriert
    - eingehende Autorisierung und Kanal-Routing sind standardmäßig ID-zuerst; direkte Übereinstimmung mit Benutzernamen/Slugs erfordert `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Namensbasierte Schlüssel (`#channel-name` oder `channel-name`) stimmen unter `groupPolicy: "allowlist"` **nicht** überein. Die Kanalsuche ist standardmäßig ID-zuerst, daher wird ein namensbasierter Schlüssel niemals erfolgreich geroutet und alle Nachrichten in diesem Kanal werden stillschweigend blockiert. Dies unterscheidet sich von `groupPolicy: "open"`, bei dem der Kanalschlüssel für das Routing nicht erforderlich ist und ein namensbasierter Schlüssel scheinbar funktioniert.

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
    Kanalnachrichten erfordern standardmäßig eine Erwähnung.

    Quellen für Erwähnungen:

    - explizite App-Erwähnung (`<@botId>`)
    - Regex-Muster für Erwähnungen (`agents.list[].groupChat.mentionPatterns`, Fallback `messages.groupChat.mentionPatterns`)
    - implizites Thread-Verhalten bei Antwort an den Bot (deaktiviert, wenn `thread.requireExplicitMention` `true` ist)

    Steuerungen pro Kanal (`channels.slack.channels.<id>`; Namen nur über Auflösung beim Start oder `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (Allowlist)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - Schlüsselformat für `toolsBySender`: Platzhalter `id:`, `e164:`, `username:`, `name:` oder `"*"`
      (Legacy-Schlüssel ohne Präfix werden weiterhin nur `id:` zugeordnet)

  </Tab>
</Tabs>

## Threads, Sitzungen und Antwort-Tags

- DMs werden als `direct` geroutet; Kanäle als `channel`; MPIMs als `group`.
- Mit dem Standard `session.dmScope=main` werden Slack-DMs auf die Hauptsitzung des Agenten zusammengeführt.
- Kanalsitzungen: `agent:<agentId>:slack:channel:<channelId>`.
- Thread-Antworten können, sofern zutreffend, Thread-Sitzungssuffixe (`:thread:<threadTs>`) erstellen.
- Der Standard für `channels.slack.thread.historyScope` ist `thread`; der Standard für `thread.inheritParent` ist `false`.
- `channels.slack.thread.initialHistoryLimit` steuert, wie viele vorhandene Thread-Nachrichten abgerufen werden, wenn eine neue Thread-Sitzung startet (Standard `20`; setzen Sie `0`, um dies zu deaktivieren).
- `channels.slack.thread.requireExplicitMention` (Standard `false`): Wenn `true`, werden implizite Thread-Erwähnungen unterdrückt, sodass der Bot innerhalb von Threads nur auf explizite `@bot`-Erwähnungen antwortet, selbst wenn der Bot bereits am Thread beteiligt war. Ohne dies umgehen Antworten in einem Thread mit Bot-Beteiligung das `requireMention`-Gate.

Steuerungen für Antwort-Threads:

- `channels.slack.replyToMode`: `off|first|all|batched` (Standard `off`)
- `channels.slack.replyToModeByChatType`: pro `direct|group|channel`
- Legacy-Fallback für Direktchats: `channels.slack.dm.replyToMode`

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
- Fallback auf Agent-Identitäts-Emoji (`agents.list[].identity.emoji`, andernfalls "👀")

Hinweise:

- Slack erwartet Shortcodes (zum Beispiel `"eyes"`).
- Verwenden Sie `""`, um die Reaktion für das Slack-Konto oder global zu deaktivieren.

## Text-Streaming

`channels.slack.streaming` steuert das Live-Vorschauverhalten:

- `off`: Live-Vorschau-Streaming deaktivieren.
- `partial` (Standard): Vorschautext durch die neueste Teilausgabe ersetzen.
- `block`: Vorschauaktualisierungen in Chunks anhängen.
- `progress`: Fortschrittsstatustext während der Generierung anzeigen und anschließend den endgültigen Text senden.
- `streaming.preview.toolProgress`: Wenn die Entwurfsvorschau aktiv ist, Tool-/Fortschrittsaktualisierungen in dieselbe bearbeitete Vorschaunachricht routen (Standard: `true`). Setzen Sie `false`, um separate Tool-/Fortschrittsnachrichten beizubehalten.

`channels.slack.streaming.nativeTransport` steuert natives Slack-Text-Streaming, wenn `channels.slack.streaming.mode` `partial` ist (Standard: `true`).

- Ein Antwort-Thread muss verfügbar sein, damit natives Text-Streaming und der Slack-Assistenten-Thread-Status angezeigt werden. Die Thread-Auswahl folgt weiterhin `replyToMode`.
- Kanal- und Gruppenchat-Roots können weiterhin die normale Entwurfsvorschau verwenden, wenn natives Streaming nicht verfügbar ist.
- Top-Level-Slack-DMs bleiben standardmäßig außerhalb von Threads, daher zeigen sie nicht die Thread-artige Vorschau; verwenden Sie Thread-Antworten oder `typingReaction`, wenn dort sichtbarer Fortschritt gewünscht ist.
- Medien und Nicht-Text-Nutzdaten fallen auf die normale Zustellung zurück.
- Medien-/Fehler-Endausgaben brechen ausstehende Vorschau-Bearbeitungen ab; geeignete Text-/Block-Endausgaben werden nur geflusht, wenn sie die Vorschau direkt bearbeiten können.
- Wenn Streaming mitten in der Antwort fehlschlägt, fällt OpenClaw für verbleibende Nutzdaten auf normale Zustellung zurück.

Entwurfsvorschau statt nativem Slack-Text-Streaming verwenden:

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

## Fallback für Eingabe-Reaktion

`typingReaction` fügt der eingehenden Slack-Nachricht eine temporäre Reaktion hinzu, während OpenClaw eine Antwort verarbeitet, und entfernt sie, wenn der Lauf abgeschlossen ist. Dies ist außerhalb von Thread-Antworten am nützlichsten, da diese eine standardmäßige Statusanzeige „is typing...“ verwenden.

Auflösungsreihenfolge:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Hinweise:

- Slack erwartet Shortcodes (zum Beispiel `"hourglass_flowing_sand"`).
- Die Reaktion erfolgt nach bestem Bemühen, und die Bereinigung wird nach Abschluss des Antwort- oder Fehlerpfads automatisch versucht.

## Medien, Chunking und Zustellung

<AccordionGroup>
  <Accordion title="Eingehende Anhänge">
    Slack-Dateianhänge werden von Slack-gehosteten privaten URLs heruntergeladen (tokenauthentifizierter Anfragefluss) und in den Medienspeicher geschrieben, wenn der Abruf erfolgreich ist und Größenbeschränkungen dies erlauben. Dateiplatzhalter enthalten die Slack-`fileId`, sodass Agenten die Originaldatei mit `download-file` abrufen können.

    Downloads verwenden begrenzte Leerlauf- und Gesamtzeitüberschreitungen. Wenn der Abruf einer Slack-Datei stockt oder fehlschlägt, verarbeitet OpenClaw die Nachricht weiter und fällt auf den Dateiplatzhalter zurück.

    Die Laufzeit-Obergrenze für eingehende Dateien beträgt standardmäßig `20MB`, sofern sie nicht durch `channels.slack.mediaMaxMb` überschrieben wird.

  </Accordion>

  <Accordion title="Ausgehender Text und Dateien">
    - Text-Chunks verwenden `channels.slack.textChunkLimit` (Standard 4000)
    - `channels.slack.chunkMode="newline"` aktiviert absatzorientiertes Aufteilen
    - Dateisendungen verwenden Slack-Upload-APIs und können Thread-Antworten (`thread_ts`) enthalten
    - Die Obergrenze für ausgehende Medien folgt `channels.slack.mediaMaxMb`, wenn konfiguriert; andernfalls verwenden Kanalsendungen MIME-Art-Standards aus der Medienpipeline

  </Accordion>

  <Accordion title="Zustellungsziele">
    Bevorzugte explizite Ziele:

    - `user:<id>` für DMs
    - `channel:<id>` für Kanäle

    Slack-DMs werden beim Senden an Benutzerziele über Slack-Konversations-APIs geöffnet.

  </Accordion>
</AccordionGroup>

## Befehle und Slash-Verhalten

Slash-Befehle erscheinen in Slack entweder als einzelner konfigurierter Befehl oder als mehrere native Befehle. Konfigurieren Sie `channels.slack.slashCommand`, um Befehlsstandards zu ändern:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Native Befehle erfordern [zusätzliche Manifest-Einstellungen](#additional-manifest-settings) in Ihrer Slack-App und werden stattdessen mit `channels.slack.commands.native: true` oder `commands.native: true` in globalen Konfigurationen aktiviert.

- Der Automodus für native Befehle ist für Slack **deaktiviert**, daher aktiviert `commands.native: "auto"` keine nativen Slack-Befehle.

```txt
/help
```

Native Argumentmenüs verwenden eine adaptive Rendering-Strategie, die vor dem Ausführen eines ausgewählten Optionswerts ein Bestätigungsmodal anzeigt:

- bis zu 5 Optionen: Button-Blöcke
- 6-100 Optionen: statisches Auswahlmenü
- mehr als 100 Optionen: externes Auswahlmenü mit asynchroner Optionsfilterung, wenn Handler für Interaktivitätsoptionen verfügbar sind
- überschrittene Slack-Grenzwerte: codierte Optionswerte fallen auf Buttons zurück

```txt
/think
```

Slash-Sitzungen verwenden isolierte Schlüssel wie `agent:<agentId>:slack:slash:<userId>` und leiten Befehlsausführungen weiterhin mit `CommandTargetSessionKey` an die Ziel-Konversationssitzung weiter.

## Interaktive Antworten

Slack kann vom Agenten erstellte interaktive Antwortsteuerelemente rendern, diese Funktion ist jedoch standardmäßig deaktiviert.

Aktivieren Sie sie global:

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

Oder aktivieren Sie sie nur für ein Slack-Konto:

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

Diese Direktiven werden in Slack Block Kit kompiliert und leiten Klicks oder Auswahlen über den vorhandenen Ereignispfad für Slack-Interaktionen zurück.

Hinweise:

- Dies ist Slack-spezifische UI. Andere Kanäle übersetzen Slack Block Kit-Direktiven nicht in ihre eigenen Button-Systeme.
- Die interaktiven Callback-Werte sind von OpenClaw generierte undurchsichtige Tokens, keine rohen vom Agenten erstellten Werte.
- Wenn generierte interaktive Blöcke die Slack Block Kit-Grenzwerte überschreiten würden, fällt OpenClaw auf die ursprüngliche Textantwort zurück, statt eine ungültige Blocks-Nutzlast zu senden.

## Exec-Genehmigungen in Slack

Slack kann als nativer Genehmigungsclient mit interaktiven Buttons und Interaktionen dienen, statt auf die Web-UI oder das Terminal zurückzufallen.

- Exec-Genehmigungen verwenden `channels.slack.execApprovals.*` für natives DM-/Kanal-Routing.
- Plugin-Genehmigungen können weiterhin über dieselbe Slack-native Button-Oberfläche aufgelöst werden, wenn die Anfrage bereits in Slack ankommt und die Art der Genehmigungs-ID `plugin:` ist.
- Die Autorisierung der Genehmigenden wird weiterhin erzwungen: Nur Benutzer, die als Genehmigende identifiziert sind, können Anfragen über Slack genehmigen oder ablehnen.

Dies verwendet dieselbe gemeinsame Genehmigungs-Button-Oberfläche wie andere Kanäle. Wenn `interactivity` in den Einstellungen Ihrer Slack-App aktiviert ist, werden Genehmigungsaufforderungen direkt in der Konversation als Block Kit-Buttons gerendert.
Wenn diese Buttons vorhanden sind, sind sie die primäre Genehmigungs-UX; OpenClaw
sollte nur dann einen manuellen `/approve`-Befehl einfügen, wenn das Tool-Ergebnis besagt, dass Chat-
Genehmigungen nicht verfügbar sind oder die manuelle Genehmigung der einzige Weg ist.

Konfigurationspfad:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (optional; fällt nach Möglichkeit auf `commands.ownerAllowFrom` zurück)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, Standard: `dm`)
- `agentFilter`, `sessionFilter`

Slack aktiviert native Exec-Genehmigungen automatisch, wenn `enabled` nicht gesetzt oder `"auto"` ist und mindestens ein
Genehmigender aufgelöst wird. Setzen Sie `enabled: false`, um Slack ausdrücklich als nativen Genehmigungsclient zu deaktivieren.
Setzen Sie `enabled: true`, um native Genehmigungen zu erzwingen, wenn Genehmigende aufgelöst werden.

Standardverhalten ohne explizite Slack-Exec-Genehmigungskonfiguration:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Eine explizite Slack-native Konfiguration ist nur erforderlich, wenn Sie Genehmigende überschreiben, Filter hinzufügen oder
sich für die Zustellung in den Ursprungs-Chat entscheiden möchten:

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

Gemeinsame `approvals.exec`-Weiterleitung ist separat. Verwenden Sie sie nur, wenn Aufforderungen zur Exec-Genehmigung zusätzlich
an andere Chats oder explizite Out-of-Band-Ziele weitergeleitet werden müssen. Gemeinsame `approvals.plugin`-Weiterleitung ist ebenfalls
separat; Slack-native Buttons können Plugin-Genehmigungen weiterhin auflösen, wenn diese Anfragen bereits
in Slack ankommen.

Same-Chat-`/approve` funktioniert auch in Slack-Kanälen und DMs, die bereits Befehle unterstützen. Siehe [Exec-Genehmigungen](/de/tools/exec-approvals) für das vollständige Modell der Genehmigungsweiterleitung.

## Ereignisse und Betriebsverhalten

- Nachrichtenbearbeitungen/-löschungen werden Systemereignissen zugeordnet.
- Thread-Broadcasts („Auch an Kanal senden“-Thread-Antworten) werden als normale Benutzernachrichten verarbeitet.
- Ereignisse zum Hinzufügen/Entfernen von Reaktionen werden Systemereignissen zugeordnet.
- Ereignisse zu Beitritt/Austritt von Mitgliedern, erstellten/umbenannten Kanälen und Hinzufügen/Entfernen von Pins werden Systemereignissen zugeordnet.
- `channel_id_changed` kann Kanalkonfigurationsschlüssel migrieren, wenn `configWrites` aktiviert ist.
- Metadaten zu Kanalthema/-zweck werden als nicht vertrauenswürdiger Kontext behandelt und können in den Routing-Kontext eingefügt werden.
- Kontextinitialisierung für Thread-Starter und anfänglichen Thread-Verlauf wird, sofern zutreffend, nach konfigurierten Sender-Allowlists gefiltert.
- Block-Aktionen und Modal-Interaktionen geben strukturierte Systemereignisse `Slack interaction: ...` mit umfangreichen Nutzlastfeldern aus:
  - Block-Aktionen: ausgewählte Werte, Labels, Picker-Werte und `workflow_*`-Metadaten
  - Modal-Ereignisse `view_submission` und `view_closed` mit gerouteten Kanalmetadaten und Formulareingaben

## Konfigurationsreferenz

Primäre Referenz: [Konfigurationsreferenz - Slack](/de/gateway/config-channels#slack).

<Accordion title="Wichtige Slack-Felder">

- Modus/Auth: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- DM-Zugriff: `dm.enabled`, `dmPolicy`, `allowFrom` (Legacy: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- Kompatibilitätsschalter: `dangerouslyAllowNameMatching` (Notfalloption; nur bei Bedarf aktiviert lassen)
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
    - Kanal-Allowlist (`channels.slack.channels`) — **Schlüssel müssen Kanal-IDs sein** (`C12345678`), keine Namen (`#channel-name`). Namensbasierte Schlüssel schlagen unter `groupPolicy: "allowlist"` still fehl, weil Kanal-Routing standardmäßig ID-first ist. So finden Sie eine ID: Klicken Sie in Slack mit der rechten Maustaste auf den Kanal → **Link kopieren** — der `C...`-Wert am Ende der URL ist die Kanal-ID.
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
      bedeuten normalerweise, dass Slack ein bearbeitetes Assistant-Thread-Ereignis ohne
      wiederherstellbaren menschlichen Sender in den Nachrichtenmetadaten gesendet hat

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket-Modus stellt keine Verbindung her">
    Validieren Sie Bot- und App-Tokens sowie die Aktivierung des Socket Mode in den Einstellungen der Slack-App.

    Wenn `openclaw channels status --probe --json` `botTokenStatus` oder
    `appTokenStatus: "configured_unavailable"` anzeigt, ist das Slack-Konto
    konfiguriert, aber die aktuelle Laufzeit konnte den SecretRef-gestützten
    Wert nicht auflösen.

  </Accordion>

  <Accordion title="HTTP-Modus empfängt keine Ereignisse">
    Validieren Sie:

    - Signing Secret
    - Webhook-Pfad
    - Slack Request URLs (Ereignisse + Interaktivität + Slash-Befehle)
    - eindeutiger `webhookPath` pro HTTP-Konto

    Wenn `signingSecretStatus: "configured_unavailable"` in Konto-
    Snapshots erscheint, ist das HTTP-Konto konfiguriert, aber die aktuelle Laufzeit konnte das SecretRef-gestützte Signing Secret nicht
    auflösen.

  </Accordion>

  <Accordion title="Native/Slash-Befehle werden nicht ausgelöst">
    Prüfen Sie, was Sie beabsichtigt haben:

    - nativer Befehlsmodus (`channels.slack.commands.native: true`) mit passenden in Slack registrierten Slash-Befehlen
    - oder Einzel-Slash-Befehlsmodus (`channels.slack.slashCommand.enabled: true`)

    Prüfen Sie außerdem `commands.useAccessGroups` und Kanal-/Benutzer-Allowlists.

  </Accordion>
</AccordionGroup>

## Referenz zu Attachment-Vision

Slack kann heruntergeladene Medien an den Agenten-Turn anhängen, wenn Slack-Dateidownloads erfolgreich sind und Größenlimits dies zulassen. Bilddateien können über den Pfad für Medienverständnis oder direkt an ein vision-fähiges Antwortmodell übergeben werden; andere Dateien werden als herunterladbarer Dateikontext beibehalten, statt als Bildeingabe behandelt zu werden.

### Unterstützte Medientypen

| Medientyp                      | Quelle               | Aktuelles Verhalten                                                              | Hinweise                                                                  |
| ------------------------------ | -------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| JPEG-/PNG-/GIF-/WebP-Bilder    | Slack-Datei-URL      | Heruntergeladen und für vision-fähige Verarbeitung an den Turn angehängt         | Pro-Datei-Limit: `channels.slack.mediaMaxMb` (Standard 20 MB)             |
| PDF-Dateien                    | Slack-Datei-URL      | Heruntergeladen und als Dateikontext für Tools wie `download-file` oder `pdf` verfügbar gemacht | Slack-Inbound konvertiert PDFs nicht automatisch in Bild-Vision-Eingaben |
| Andere Dateien                 | Slack-Datei-URL      | Wenn möglich heruntergeladen und als Dateikontext verfügbar gemacht              | Binärdateien werden nicht als Bildeingabe behandelt                       |
| Thread-Antworten               | Thread-Starter-Dateien | Dateien der Root-Nachricht können als Kontext hydriert werden, wenn die Antwort keine direkten Medien enthält | Nur-Datei-Starter verwenden einen Attachment-Platzhalter                  |
| Mehrbild-Nachrichten           | Mehrere Slack-Dateien | Jede Datei wird unabhängig bewertet                                              | Slack-Verarbeitung ist auf acht Dateien pro Nachricht begrenzt            |

### Inbound-Pipeline

Wenn eine Slack-Nachricht mit Dateianhängen eintrifft:

1. OpenClaw lädt die Datei von Slacks privater URL mit dem Bot-Token (`xoxb-...`) herunter.
2. Die Datei wird bei Erfolg in den Medienspeicher geschrieben.
3. Heruntergeladene Medienpfade und Inhaltstypen werden dem Inbound-Kontext hinzugefügt.
4. Bildfähige Modell-/Tool-Pfade können Bildanhänge aus diesem Kontext verwenden.
5. Nicht-Bilddateien bleiben als Dateimetadaten oder Medienreferenzen für Tools verfügbar, die damit umgehen können.

### Vererbung von Thread-Root-Anhängen

Wenn eine Nachricht in einem Thread eintrifft (mit einem übergeordneten `thread_ts`):

- Wenn die Antwort selbst keine direkten Medien hat und die eingeschlossene Root-Nachricht Dateien enthält, kann Slack die Root-Dateien als Thread-Starter-Kontext hydrieren.
- Direkte Antwortanhänge haben Vorrang vor Root-Nachrichtenanhängen.
- Eine Root-Nachricht, die nur Dateien und keinen Text enthält, wird mit einem Attachment-Platzhalter dargestellt, sodass der Fallback ihre Dateien weiterhin einschließen kann.

### Umgang mit mehreren Attachments

Wenn eine einzelne Slack-Nachricht mehrere Dateianhänge enthält:

- Jeder Anhang wird unabhängig durch die Medienpipeline verarbeitet.
- Heruntergeladene Medienreferenzen werden im Nachrichtenkontext zusammengeführt.
- Die Verarbeitungsreihenfolge folgt Slacks Dateireihenfolge im Ereignis-Payload.
- Ein Fehler beim Download eines Anhangs blockiert die anderen nicht.

### Größen-, Download- und Modelllimits

- **Größenlimit**: Standardmäßig 20 MB pro Datei. Konfigurierbar über `channels.slack.mediaMaxMb`.
- **Downloadfehler**: Dateien, die Slack nicht bereitstellen kann, abgelaufene URLs, nicht zugängliche Dateien, übergroße Dateien und Slack-Authentifizierungs-/Login-HTML-Antworten werden übersprungen, statt als nicht unterstützte Formate gemeldet zu werden.
- **Vision-Modell**: Die Bildanalyse verwendet das aktive Antwortmodell, wenn es Vision unterstützt, oder das unter `agents.defaults.imageModel` konfigurierte Bildmodell.

### Bekannte Einschränkungen

| Szenario                               | Aktuelles Verhalten                                                               | Umgehungslösung                                                                  |
| -------------------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Abgelaufene Slack-Datei-URL            | Datei wird übersprungen; kein Fehler wird angezeigt                                | Laden Sie die Datei erneut in Slack hoch                                         |
| Vision-Modell nicht konfiguriert       | Bildanhänge werden als Medienreferenzen gespeichert, aber nicht als Bilder analysiert | Konfigurieren Sie `agents.defaults.imageModel` oder verwenden Sie ein Vision-fähiges Antwortmodell |
| Sehr große Bilder (> 20 MB standardmäßig) | Wird gemäß Größenlimit übersprungen                                                | Erhöhen Sie `channels.slack.mediaMaxMb`, falls Slack dies zulässt                |
| Weitergeleitete/geteilte Anhänge       | Text sowie von Slack gehostete Bild-/Dateimedien werden bestmöglich verarbeitet    | Teilen Sie sie direkt erneut im OpenClaw-Thread                                  |
| PDF-Anhänge                            | Werden als Datei-/Medienkontext gespeichert, nicht automatisch durch Image Vision geleitet | Verwenden Sie `download-file` für Dateimetadaten oder das `pdf`-Tool für die PDF-Analyse |

### Zugehörige Dokumentation

- [Pipeline für Medienverständnis](/de/nodes/media-understanding)
- [PDF-Tool](/de/tools/pdf)
- Epic: [#51349](https://github.com/openclaw/openclaw/issues/51349) — Aktivierung von Vision für Slack-Anhänge
- Regressionstests: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- Live-Verifizierung: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## Verwandt

<CardGroup cols={2}>
  <Card title="Kopplung" icon="link" href="/de/channels/pairing">
    Koppeln Sie einen Slack-Benutzer mit dem Gateway.
  </Card>
  <Card title="Gruppen" icon="users" href="/de/channels/groups">
    Verhalten von Channels und Gruppen-DMs.
  </Card>
  <Card title="Channel-Routing" icon="route" href="/de/channels/channel-routing">
    Leiten Sie eingehende Nachrichten an Agents weiter.
  </Card>
  <Card title="Sicherheit" icon="shield" href="/de/gateway/security">
    Bedrohungsmodell und Härtung.
  </Card>
  <Card title="Konfiguration" icon="sliders" href="/de/gateway/configuration">
    Konfigurationslayout und Vorrangregeln.
  </Card>
  <Card title="Slash-Befehle" icon="terminal" href="/de/tools/slash-commands">
    Befehlskatalog und Verhalten.
  </Card>
</CardGroup>
