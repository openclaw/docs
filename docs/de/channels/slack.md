---
read_when:
    - Einrichten von Slack oder Fehlerbehebung beim Slack-Socket-/HTTP-Modus
summary: Slack-Einrichtung und Laufzeitverhalten (Socket Mode + HTTP-Request-URLs)
title: Slack
x-i18n:
    generated_at: "2026-04-22T04:20:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: e80b1ff7dfe3124916f9a4334badc9a742a0d0843b37c77838ede9f830920ff7
    source_path: channels/slack.md
    workflow: 15
---

# Slack

Status: produktionsreif für DMs + Kanäle über Slack-App-Integrationen. Der Standardmodus ist Socket Mode; HTTP-Request-URLs werden ebenfalls unterstützt.

<CardGroup cols={3}>
  <Card title="Kopplung" icon="link" href="/de/channels/pairing">
    Slack-DMs verwenden standardmäßig den Kopplungsmodus.
  </Card>
  <Card title="Slash-Befehle" icon="terminal" href="/de/tools/slash-commands">
    Natives Befehlsverhalten und Befehlskatalog.
  </Card>
  <Card title="Fehlerbehebung für Kanäle" icon="wrench" href="/de/channels/troubleshooting">
    Kanalübergreifende Diagnose- und Reparaturleitfäden.
  </Card>
</CardGroup>

## Schnelleinrichtung

<Tabs>
  <Tab title="Socket Mode (Standard)">
    <Steps>
      <Step title="Eine neue Slack-App erstellen">
        Klicken Sie in den Slack-App-Einstellungen auf die Schaltfläche **[Create New App](https://api.slack.com/apps/new)**:

        - wählen Sie **from a manifest** und dann einen Workspace für Ihre App aus
        - fügen Sie das [Beispiel-Manifest](#manifest-and-scope-checklist) unten ein und fahren Sie mit der Erstellung fort
        - erzeugen Sie ein **App-Level Token** (`xapp-...`) mit `connections:write`
        - installieren Sie die App und kopieren Sie das angezeigte **Bot Token** (`xoxb-...`)
      </Step>

      <Step title="OpenClaw konfigurieren">

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      appToken: "xapp-...",
      botToken: "xoxb-...",
    },
  },
}
```

        Env-Fallback (nur Standardkonto):

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

  <Tab title="HTTP-Request-URLs">
    <Steps>
      <Step title="Eine neue Slack-App erstellen">
        Klicken Sie in den Slack-App-Einstellungen auf die Schaltfläche **[Create New App](https://api.slack.com/apps/new)**:

        - wählen Sie **from a manifest** und dann einen Workspace für Ihre App aus
        - fügen Sie das [Beispiel-Manifest](#manifest-and-scope-checklist) ein und aktualisieren Sie die URLs vor der Erstellung
        - speichern Sie das **Signing Secret** zur Verifizierung von Requests
        - installieren Sie die App und kopieren Sie das angezeigte **Bot Token** (`xoxb-...`)

      </Step>

      <Step title="OpenClaw konfigurieren">

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      botToken: "xoxb-...",
      signingSecret: "your-signing-secret",
      webhookPath: "/slack/events",
    },
  },
}
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

## Manifest- und Scope-Checkliste

<Tabs>
  <Tab title="Socket Mode (Standard)">

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack-Connector für OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw",
      "always_online": true
    },
    "app_home": {
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Eine Nachricht an OpenClaw senden",
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

  </Tab>

  <Tab title="HTTP-Request-URLs">

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack-Connector für OpenClaw"
  },
  "features": {
    "bot_user": {
      "display_name": "OpenClaw",
      "always_online": true
    },
    "app_home": {
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Eine Nachricht an OpenClaw senden",
        "should_escape": false,
        "url": "https://gateway-host.example.com/slack/events"
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
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
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
    },
    "interactivity": {
      "is_enabled": true,
      "request_url": "https://gateway-host.example.com/slack/events",
      "message_menu_options_url": "https://gateway-host.example.com/slack/events"
    }
  }
}
```

  </Tab>
</Tabs>

### Zusätzliche Manifest-Einstellungen

Stellen Sie verschiedene Funktionen bereit, die die obigen Standardeinstellungen erweitern.

<AccordionGroup>
  <Accordion title="Optionale native Slash-Befehle">

    Mehrere [native Slash-Befehle](#commands-and-slash-behavior) können anstelle eines einzelnen konfigurierten Befehls mit einigen Besonderheiten verwendet werden:

    - Verwenden Sie `/agentstatus` statt `/status`, weil der Befehl `/status` reserviert ist.
    - Es können nicht mehr als 25 Slash-Befehle gleichzeitig verfügbar gemacht werden.

    Ersetzen Sie Ihren bestehenden Abschnitt `features.slash_commands` durch eine Teilmenge der [verfügbaren Befehle](/de/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Socket Mode (Standard)">

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "Eine neue Sitzung starten",
        "usage_hint": "[model]"
      },
      {
        "command": "/reset",
        "description": "Die aktuelle Sitzung zurücksetzen"
      },
      {
        "command": "/compact",
        "description": "Den Sitzungskontext komprimieren",
        "usage_hint": "[instructions]"
      },
      {
        "command": "/stop",
        "description": "Den aktuellen Lauf stoppen"
      },
      {
        "command": "/session",
        "description": "Ablauf der Thread-Bindung verwalten",
        "usage_hint": "idle <duration|off> oder max-age <duration|off>"
      },
      {
        "command": "/think",
        "description": "Das Denk-Niveau festlegen",
        "usage_hint": "<level>"
      },
      {
        "command": "/verbose",
        "description": "Ausführliche Ausgabe umschalten",
        "usage_hint": "on|off|full"
      },
      {
        "command": "/fast",
        "description": "Fast-Modus anzeigen oder festlegen",
        "usage_hint": "[status|on|off]"
      },
      {
        "command": "/reasoning",
        "description": "Sichtbarkeit der Begründung umschalten",
        "usage_hint": "[on|off|stream]"
      },
      {
        "command": "/elevated",
        "description": "Erweiterten Modus umschalten",
        "usage_hint": "[on|off|ask|full]"
      },
      {
        "command": "/exec",
        "description": "Exec-Standardeinstellungen anzeigen oder festlegen",
        "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>"
      },
      {
        "command": "/model",
        "description": "Das Modell anzeigen oder festlegen",
        "usage_hint": "[name|#|status]"
      },
      {
        "command": "/models",
        "description": "Provider oder Modelle für einen Provider auflisten",
        "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]"
      },
      {
        "command": "/help",
        "description": "Die kurze Hilfezusammenfassung anzeigen"
      },
      {
        "command": "/commands",
        "description": "Den generierten Befehlskatalog anzeigen"
      },
      {
        "command": "/tools",
        "description": "Anzeigen, was der aktuelle Agent gerade verwenden kann",
        "usage_hint": "[compact|verbose]"
      },
      {
        "command": "/agentstatus",
        "description": "Laufzeitstatus anzeigen, einschließlich Provider-Nutzung/Kontingent, wenn verfügbar"
      },
      {
        "command": "/tasks",
        "description": "Aktive/neuere Hintergrundaufgaben für die aktuelle Sitzung auflisten"
      },
      {
        "command": "/context",
        "description": "Erklären, wie der Kontext zusammengesetzt wird",
        "usage_hint": "[list|detail|json]"
      },
      {
        "command": "/whoami",
        "description": "Ihre Absenderidentität anzeigen"
      },
      {
        "command": "/skill",
        "description": "Eine Skills nach Namen ausführen",
        "usage_hint": "<name> [input]"
      },
      {
        "command": "/btw",
        "description": "Eine Nebenfrage stellen, ohne den Sitzungskontext zu ändern",
        "usage_hint": "<question>"
      },
      {
        "command": "/usage",
        "description": "Die Nutzungs-Fußzeile steuern oder die Kostenzusammenfassung anzeigen",
        "usage_hint": "off|tokens|full|cost"
      }
    ]
```

      </Tab>
      <Tab title="HTTP-Request-URLs">

```json
    "slash_commands": [
      {
        "command": "/new",
        "description": "Eine neue Sitzung starten",
        "usage_hint": "[model]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/reset",
        "description": "Die aktuelle Sitzung zurücksetzen",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/compact",
        "description": "Den Sitzungskontext komprimieren",
        "usage_hint": "[instructions]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/stop",
        "description": "Den aktuellen Lauf stoppen",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/session",
        "description": "Ablauf der Thread-Bindung verwalten",
        "usage_hint": "idle <duration|off> oder max-age <duration|off>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/think",
        "description": "Das Denk-Niveau festlegen",
        "usage_hint": "<level>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/verbose",
        "description": "Ausführliche Ausgabe umschalten",
        "usage_hint": "on|off|full",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/fast",
        "description": "Fast-Modus anzeigen oder festlegen",
        "usage_hint": "[status|on|off]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/reasoning",
        "description": "Sichtbarkeit der Begründung umschalten",
        "usage_hint": "[on|off|stream]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/elevated",
        "description": "Erweiterten Modus umschalten",
        "usage_hint": "[on|off|ask|full]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/exec",
        "description": "Exec-Standardeinstellungen anzeigen oder festlegen",
        "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/model",
        "description": "Das Modell anzeigen oder festlegen",
        "usage_hint": "[name|#|status]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/models",
        "description": "Provider oder Modelle für einen Provider auflisten",
        "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/help",
        "description": "Die kurze Hilfezusammenfassung anzeigen",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/commands",
        "description": "Den generierten Befehlskatalog anzeigen",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/tools",
        "description": "Anzeigen, was der aktuelle Agent gerade verwenden kann",
        "usage_hint": "[compact|verbose]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/agentstatus",
        "description": "Laufzeitstatus anzeigen, einschließlich Provider-Nutzung/Kontingent, wenn verfügbar",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/tasks",
        "description": "Aktive/neuere Hintergrundaufgaben für die aktuelle Sitzung auflisten",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/context",
        "description": "Erklären, wie der Kontext zusammengesetzt wird",
        "usage_hint": "[list|detail|json]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/whoami",
        "description": "Ihre Absenderidentität anzeigen",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/skill",
        "description": "Eine Skills nach Namen ausführen",
        "usage_hint": "<name> [input]",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/btw",
        "description": "Eine Nebenfrage stellen, ohne den Sitzungskontext zu ändern",
        "usage_hint": "<question>",
        "url": "https://gateway-host.example.com/slack/events"
      },
      {
        "command": "/usage",
        "description": "Die Nutzungs-Fußzeile steuern oder die Kostenzusammenfassung anzeigen",
        "usage_hint": "off|tokens|full|cost",
        "url": "https://gateway-host.example.com/slack/events"
      }
    ]
```

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="Optionale Autorschafts-Scopes (Schreiboperationen)">
    Fügen Sie den Bot-Scope `chat:write.customize` hinzu, wenn ausgehende Nachrichten die Identität des aktiven Agenten (benutzerdefinierter Benutzername und Icon) statt der Standardidentität der Slack-App verwenden sollen.

    Wenn Sie ein Emoji-Icon verwenden, erwartet Slack die Syntax `:emoji_name:`.

  </Accordion>
  <Accordion title="Optionale User-Token-Scopes (Leseoperationen)">
    Wenn Sie `channels.slack.userToken` konfigurieren, sind typische Lese-Scopes:

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

- `botToken` + `appToken` sind für Socket Mode erforderlich.
- HTTP-Modus erfordert `botToken` + `signingSecret`.
- `botToken`, `appToken`, `signingSecret` und `userToken` akzeptieren Klartext-Strings oder SecretRef-Objekte.
- Konfigurations-Token überschreiben den Env-Fallback.
- Der Env-Fallback `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` gilt nur für das Standardkonto.
- `userToken` (`xoxp-...`) ist nur über die Konfiguration verfügbar (kein Env-Fallback) und verwendet standardmäßig schreibgeschütztes Verhalten (`userTokenReadOnly: true`).

Verhalten des Status-Snapshots:

- Die Slack-Kontoinspektion erfasst pro Anmeldedaten `*Source`- und `*Status`-Felder (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Der Status ist `available`, `configured_unavailable` oder `missing`.
- `configured_unavailable` bedeutet, dass das Konto über SecretRef oder eine andere nicht-inline Secret-Quelle konfiguriert ist, der aktuelle Befehls-/Laufzeitpfad den tatsächlichen Wert aber nicht auflösen konnte.
- Im HTTP-Modus ist `signingSecretStatus` enthalten; im Socket Mode ist das erforderliche Paar `botTokenStatus` + `appTokenStatus`.

<Tip>
Für Aktionen/Verzeichnis-Lesevorgänge kann das User-Token bevorzugt werden, wenn es konfiguriert ist. Für Schreibvorgänge bleibt das Bot-Token bevorzugt; Schreibvorgänge mit User-Token sind nur erlaubt, wenn `userTokenReadOnly: false` und das Bot-Token nicht verfügbar ist.
</Tip>

## Aktionen und Gates

Slack-Aktionen werden über `channels.slack.actions.*` gesteuert.

Verfügbare Aktionsgruppen in den aktuellen Slack-Tools:

| Gruppe     | Standard |
| ---------- | -------- |
| messages   | aktiviert |
| reactions  | aktiviert |
| pins       | aktiviert |
| memberInfo | aktiviert |
| emojiList  | aktiviert |

Aktuelle Slack-Nachrichtenaktionen umfassen `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` und `emoji-list`.

## Zugriffskontrolle und Routing

<Tabs>
  <Tab title="DM-Richtlinie">
    `channels.slack.dmPolicy` steuert den DM-Zugriff (Legacy: `channels.slack.dm.policy`):

    - `pairing` (Standard)
    - `allowlist`
    - `open` (erfordert, dass `channels.slack.allowFrom` `"*"` enthält; Legacy: `channels.slack.dm.allowFrom`)
    - `disabled`

    DM-Flags:

    - `dm.enabled` (Standard true)
    - `channels.slack.allowFrom` (bevorzugt)
    - `dm.allowFrom` (Legacy)
    - `dm.groupEnabled` (Gruppen-DMs standardmäßig false)
    - `dm.groupChannels` (optionale MPIM-Allowlist)

    Priorität bei mehreren Konten:

    - `channels.slack.accounts.default.allowFrom` gilt nur für das Konto `default`.
    - Benannte Konten übernehmen `channels.slack.allowFrom`, wenn ihr eigenes `allowFrom` nicht gesetzt ist.
    - Benannte Konten übernehmen nicht `channels.slack.accounts.default.allowFrom`.

    Die Kopplung in DMs verwendet `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Kanalrichtlinie">
    `channels.slack.groupPolicy` steuert die Behandlung von Kanälen:

    - `open`
    - `allowlist`
    - `disabled`

    Die Kanal-Allowlist befindet sich unter `channels.slack.channels` und sollte stabile Kanal-IDs verwenden.

    Laufzeit-Hinweis: Wenn `channels.slack` vollständig fehlt (nur Env-Setup), fällt die Laufzeit auf `groupPolicy="allowlist"` zurück und protokolliert eine Warnung (auch wenn `channels.defaults.groupPolicy` gesetzt ist).

    Auflösung von Namen/IDs:

    - Einträge in Kanal-Allowlist und DM-Allowlist werden beim Start aufgelöst, wenn der Token-Zugriff dies erlaubt
    - nicht aufgelöste Kanalnamen-Einträge bleiben wie konfiguriert erhalten, werden aber standardmäßig für das Routing ignoriert
    - eingehende Autorisierung und Kanalrouting sind standardmäßig ID-first; direktes Matching von Benutzernamen/Slugs erfordert `channels.slack.dangerouslyAllowNameMatching: true`

  </Tab>

  <Tab title="Erwähnungen und Kanalbenutzer">
    Kanalnachrichten sind standardmäßig durch Erwähnungs-Gating geschützt.

    Erwähnungsquellen:

    - explizite App-Erwähnung (`<@botId>`)
    - Erwähnungs-Regex-Muster (`agents.list[].groupChat.mentionPatterns`, Fallback `messages.groupChat.mentionPatterns`)
    - implizites Antwort-auf-Bot-Thread-Verhalten (deaktiviert, wenn `thread.requireExplicitMention` `true` ist)

    Steuerungen pro Kanal (`channels.slack.channels.<id>`; Namen nur über Startauflösung oder `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (Allowlist)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - Schlüsselformat für `toolsBySender`: `id:`, `e164:`, `username:`, `name:` oder Wildcard `"*"`
      (Legacy-Schlüssel ohne Präfix werden weiterhin nur auf `id:` abgebildet)

  </Tab>
</Tabs>

## Threading, Sitzungen und Antwort-Tags

- DMs werden als `direct` geroutet; Kanäle als `channel`; MPIMs als `group`.
- Mit dem Standardwert `session.dmScope=main` werden Slack-DMs in die Hauptsitzung des Agenten zusammengeführt.
- Kanalsitzungen: `agent:<agentId>:slack:channel:<channelId>`.
- Thread-Antworten können bei Bedarf Thread-Sitzungssuffixe (`:thread:<threadTs>`) erzeugen.
- Der Standardwert von `channels.slack.thread.historyScope` ist `thread`; der Standardwert von `thread.inheritParent` ist `false`.
- `channels.slack.thread.initialHistoryLimit` steuert, wie viele vorhandene Thread-Nachrichten abgerufen werden, wenn eine neue Thread-Sitzung beginnt (Standard `20`; setzen Sie `0`, um dies zu deaktivieren).
- `channels.slack.thread.requireExplicitMention` (Standard `false`): Wenn `true`, werden implizite Thread-Erwähnungen unterdrückt, sodass der Bot in Threads nur auf explizite `@bot`-Erwähnungen antwortet, selbst wenn der Bot bereits am Thread teilgenommen hat. Ohne dies umgehen Antworten in einem Thread mit Bot-Beteiligung das `requireMention`-Gating.

Steuerungen für Antwort-Threading:

- `channels.slack.replyToMode`: `off|first|all|batched` (Standard `off`)
- `channels.slack.replyToModeByChatType`: pro `direct|group|channel`
- Legacy-Fallback für direkte Chats: `channels.slack.dm.replyToMode`

Manuelle Antwort-Tags werden unterstützt:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Hinweis: `replyToMode="off"` deaktiviert **jegliches** Antwort-Threading in Slack, einschließlich expliziter `[[reply_to_*]]`-Tags. Dies unterscheidet sich von Telegram, wo explizite Tags auch im Modus `"off"` weiterhin berücksichtigt werden. Der Unterschied spiegelt die Threading-Modelle der Plattformen wider: Slack-Threads blenden Nachrichten aus dem Kanal aus, während Telegram-Antworten im Haupt-Chatverlauf sichtbar bleiben.

## Bestätigungsreaktionen

`ackReaction` sendet ein Bestätigungs-Emoji, während OpenClaw eine eingehende Nachricht verarbeitet.

Reihenfolge der Auflösung:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- Emoji-Fallback der Agentenidentität (`agents.list[].identity.emoji`, sonst "👀")

Hinweise:

- Slack erwartet Shortcodes (zum Beispiel `"eyes"`).
- Verwenden Sie `""`, um die Reaktion für das Slack-Konto oder global zu deaktivieren.

## Text-Streaming

`channels.slack.streaming` steuert das Verhalten der Live-Vorschau:

- `off`: Live-Vorschau-Streaming deaktivieren.
- `partial` (Standard): Vorschautext durch die neueste Teilausgabe ersetzen.
- `block`: Vorschauaktualisierungen in Chunks anhängen.
- `progress`: Fortschrittsstatustext während der Generierung anzeigen und danach den endgültigen Text senden.
- `streaming.preview.toolProgress`: Wenn die Entwurfsvorschau aktiv ist, Tool-/Fortschrittsaktualisierungen in dieselbe bearbeitete Vorschau-Nachricht leiten (Standard: `true`). Auf `false` setzen, um separate Tool-/Fortschrittsnachrichten beizubehalten.

`channels.slack.streaming.nativeTransport` steuert natives Slack-Text-Streaming, wenn `channels.slack.streaming.mode` auf `partial` gesetzt ist (Standard: `true`).

- Für natives Text-Streaming und damit der Slack-Assistenten-Thread-Status erscheint, muss ein Antwort-Thread verfügbar sein. Die Thread-Auswahl folgt weiterhin `replyToMode`.
- Kanal- und Gruppenchat-Wurzeln können weiterhin die normale Entwurfsvorschau verwenden, wenn natives Streaming nicht verfügbar ist.
- Top-Level-Slack-DMs bleiben standardmäßig außerhalb von Threads, daher zeigen sie keine Vorschau im Thread-Stil; verwenden Sie Thread-Antworten oder `typingReaction`, wenn Sie dort sichtbaren Fortschritt möchten.
- Medien und Nicht-Text-Nutzlasten greifen auf normale Zustellung zurück.
- Abschließende Medien-/Fehlerantworten brechen ausstehende Vorschau-Bearbeitungen ab, ohne einen temporären Entwurf zu flushen; geeignete endgültige Text-/Blockantworten werden nur dann geflusht, wenn sie die Vorschau direkt bearbeiten können.
- Wenn Streaming mitten in einer Antwort fehlschlägt, greift OpenClaw für verbleibende Nutzlasten auf normale Zustellung zurück.

Entwurfsvorschau anstelle von nativem Slack-Text-Streaming verwenden:

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
- boolesches `channels.slack.streaming` wird automatisch zu `channels.slack.streaming.mode` und `channels.slack.streaming.nativeTransport` migriert.
- Legacy-`channels.slack.nativeStreaming` wird automatisch zu `channels.slack.streaming.nativeTransport` migriert.

## Typing-Reaction-Fallback

`typingReaction` fügt der eingehenden Slack-Nachricht eine temporäre Reaktion hinzu, während OpenClaw eine Antwort verarbeitet, und entfernt sie dann, wenn der Lauf abgeschlossen ist. Das ist besonders nützlich außerhalb von Thread-Antworten, die standardmäßig einen Statusindikator „is typing...“ verwenden.

Reihenfolge der Auflösung:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Hinweise:

- Slack erwartet Shortcodes (zum Beispiel `"hourglass_flowing_sand"`).
- Die Reaktion erfolgt nach Best Effort, und nach Abschluss der Antwort oder des Fehlerpfads wird automatisch versucht, sie zu bereinigen.

## Medien, Chunking und Zustellung

<AccordionGroup>
  <Accordion title="Eingehende Anhänge">
    Slack-Dateianhänge werden von privat gehosteten Slack-URLs heruntergeladen (token-authentifizierter Request-Ablauf) und in den Media Store geschrieben, wenn der Abruf erfolgreich ist und Größenlimits dies zulassen.

    Die Größenobergrenze für eingehende Daten zur Laufzeit beträgt standardmäßig `20MB`, sofern sie nicht durch `channels.slack.mediaMaxMb` überschrieben wird.

  </Accordion>

  <Accordion title="Ausgehender Text und Dateien">
    - Text-Chunks verwenden `channels.slack.textChunkLimit` (Standard 4000)
    - `channels.slack.chunkMode="newline"` aktiviert absatzorientierte Aufteilung zuerst
    - Dateisendungen verwenden Slack-Upload-APIs und können Thread-Antworten (`thread_ts`) einschließen
    - die Obergrenze für ausgehende Medien folgt bei Konfiguration `channels.slack.mediaMaxMb`; andernfalls verwenden Kanalsendungen die MIME-Typ-Standards aus der Medienpipeline
  </Accordion>

  <Accordion title="Zustellziele">
    Bevorzugte explizite Ziele:

    - `user:<id>` für DMs
    - `channel:<id>` für Kanäle

    Slack-DMs werden über die Slack-Konversations-APIs geöffnet, wenn an Benutzerziele gesendet wird.

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

- Der native Befehls-Automodus ist für Slack **deaktiviert**, daher aktiviert `commands.native: "auto"` keine nativen Slack-Befehle.

```txt
/help
```

Native Argumentmenüs verwenden eine adaptive Rendering-Strategie, die vor dem Absenden eines ausgewählten Optionswerts ein Bestätigungsmodal anzeigt:

- bis zu 5 Optionen: Button-Blöcke
- 6–100 Optionen: statisches Auswahlmenü
- mehr als 100 Optionen: externe Auswahl mit asynchroner Optionsfilterung, wenn Interaktivitäts-Option-Handler verfügbar sind
- bei Überschreitung der Slack-Limits: kodierte Optionswerte greifen auf Buttons zurück

```txt
/think
```

Slash-Sitzungen verwenden isolierte Schlüssel wie `agent:<agentId>:slack:slash:<userId>` und leiten Befehlsausführungen weiterhin mit `CommandTargetSessionKey` an die Ziel-Konversationssitzung weiter.

## Interaktive Antworten

Slack kann vom Agenten verfasste interaktive Antwortsteuerungen rendern, aber diese Funktion ist standardmäßig deaktiviert.

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

- Dies ist eine Slack-spezifische UI. Andere Kanäle übersetzen Slack-Block-Kit-Direktiven nicht in ihre eigenen Button-Systeme.
- Die interaktiven Callback-Werte sind von OpenClaw erzeugte opake Tokens, nicht rohe vom Agenten verfasste Werte.
- Wenn erzeugte interaktive Blöcke die Limits von Slack Block Kit überschreiten würden, greift OpenClaw auf die ursprüngliche Textantwort zurück, anstatt eine ungültige Blocks-Nutzlast zu senden.

## Exec-Genehmigungen in Slack

Slack kann als nativer Genehmigungs-Client mit interaktiven Buttons und Interaktionen fungieren, statt auf die Web-UI oder das Terminal zurückzufallen.

- Exec-Genehmigungen verwenden `channels.slack.execApprovals.*` für natives DM-/Kanal-Routing.
- Plugin-Genehmigungen können weiterhin über dieselbe Slack-native Button-Oberfläche aufgelöst werden, wenn die Anfrage bereits in Slack landet und die Genehmigungs-ID-Art `plugin:` ist.
- Die Autorisierung der Genehmigenden wird weiterhin erzwungen: Nur Benutzer, die als Genehmigende identifiziert sind, können Anfragen über Slack genehmigen oder ablehnen.

Dies verwendet dieselbe gemeinsame Oberfläche für Genehmigungs-Buttons wie andere Kanäle. Wenn `interactivity` in Ihren Slack-App-Einstellungen aktiviert ist, werden Genehmigungsabfragen als Block-Kit-Buttons direkt in der Konversation gerendert.
Wenn diese Buttons vorhanden sind, sind sie die primäre UX für Genehmigungen; OpenClaw
sollte einen manuellen `/approve`-Befehl nur dann einschließen, wenn das Tool-Ergebnis sagt, dass Chat-Genehmigungen nicht verfügbar sind oder manuelle Genehmigung der einzige Weg ist.

Konfigurationspfad:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (optional; greift wenn möglich auf `commands.ownerAllowFrom` zurück)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, Standard: `dm`)
- `agentFilter`, `sessionFilter`

Slack aktiviert native Exec-Genehmigungen automatisch, wenn `enabled` nicht gesetzt oder `"auto"` ist und mindestens ein
Genehmigender aufgelöst wird. Setzen Sie `enabled: false`, um Slack ausdrücklich als nativen Genehmigungs-Client zu deaktivieren.
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
die Zustellung in den Ursprungschat aktivieren möchten:

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

Gemeinsame Weiterleitung `approvals.exec` ist separat. Verwenden Sie sie nur, wenn Exec-Genehmigungsabfragen zusätzlich
an andere Chats oder explizite Out-of-Band-Ziele geleitet werden müssen. Gemeinsame Weiterleitung `approvals.plugin` ist ebenfalls
separat; Slack-native Buttons können Plugin-Genehmigungen weiterhin auflösen, wenn diese Anfragen bereits
in Slack landen.

`/approve` im selben Chat funktioniert ebenfalls in Slack-Kanälen und DMs, die bereits Befehle unterstützen. Siehe [Exec approvals](/de/tools/exec-approvals) für das vollständige Modell der Genehmigungsweiterleitung.

## Ereignisse und Betriebsverhalten

- Nachrichtenbearbeitungen/-löschungen/Thread-Broadcasts werden in Systemereignisse abgebildet.
- Hinzugefügte/entfernte Reaktionen werden in Systemereignisse abgebildet.
- Mitglied beigetreten/verlassen, Kanal erstellt/umbenannt und Pin hinzugefügt/entfernt werden in Systemereignisse abgebildet.
- `channel_id_changed` kann Kanal-Konfigurationsschlüssel migrieren, wenn `configWrites` aktiviert ist.
- Kanal-Topic-/Purpose-Metadaten werden als nicht vertrauenswürdiger Kontext behandelt und können in den Routing-Kontext injiziert werden.
- Thread-Starter und anfängliche Kontextinitialisierung aus der Thread-Historie werden, wenn anwendbar, anhand konfigurierter Absender-Allowlists gefiltert.
- Block-Aktionen und Modal-Interaktionen erzeugen strukturierte Systemereignisse `Slack interaction: ...` mit umfangreichen Nutzlastfeldern:
  - Block-Aktionen: ausgewählte Werte, Labels, Picker-Werte und `workflow_*`-Metadaten
  - Modal-Ereignisse `view_submission` und `view_closed` mit gerouteten Kanalmetadaten und Formulareingaben

## Verweise auf die Konfigurationsreferenz

Primäre Referenz:

- [Konfigurationsreferenz - Slack](/de/gateway/configuration-reference#slack)

  Wichtige Slack-Felder:
  - Modus/Auth: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
  - DM-Zugriff: `dm.enabled`, `dmPolicy`, `allowFrom` (Legacy: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
  - Kompatibilitätsschalter: `dangerouslyAllowNameMatching` (Break-Glass; deaktiviert lassen, sofern nicht nötig)
  - Kanalzugriff: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
  - Threading/Verlauf: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
  - Zustellung: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
  - Betrieb/Funktionen: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Keine Antworten in Kanälen">
    Prüfen Sie in dieser Reihenfolge:

    - `groupPolicy`
    - Kanal-Allowlist (`channels.slack.channels`)
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
    - Kopplungsgenehmigungen / Allowlist-Einträge

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket Mode verbindet nicht">
    Validieren Sie Bot- + App-Token sowie die Aktivierung von Socket Mode in den Slack-App-Einstellungen.

    Wenn `openclaw channels status --probe --json` `botTokenStatus` oder
    `appTokenStatus: "configured_unavailable"` anzeigt, ist das Slack-Konto
    konfiguriert, aber die aktuelle Laufzeit konnte den durch SecretRef gestützten
    Wert nicht auflösen.

  </Accordion>

  <Accordion title="HTTP-Modus empfängt keine Ereignisse">
    Validieren Sie:

    - Signing Secret
    - Webhook-Pfad
    - Slack-Request-URLs (Events + Interaktivität + Slash-Befehle)
    - eindeutiger `webhookPath` pro HTTP-Konto

    Wenn `signingSecretStatus: "configured_unavailable"` in Konto-Snapshots
    erscheint, ist das HTTP-Konto konfiguriert, aber die aktuelle Laufzeit konnte das
    durch SecretRef gestützte Signing Secret nicht auflösen.

  </Accordion>

  <Accordion title="Native/Slash-Befehle werden nicht ausgelöst">
    Überprüfen Sie, ob Sie Folgendes beabsichtigt haben:

    - nativer Befehlsmodus (`channels.slack.commands.native: true`) mit passenden in Slack registrierten Slash-Befehlen
    - oder einzelner Slash-Befehlsmodus (`channels.slack.slashCommand.enabled: true`)

    Prüfen Sie außerdem `commands.useAccessGroups` sowie Kanal-/Benutzer-Allowlists.

  </Accordion>
</AccordionGroup>

## Verwandt

- [Kopplung](/de/channels/pairing)
- [Gruppen](/de/channels/groups)
- [Sicherheit](/de/gateway/security)
- [Kanal-Routing](/de/channels/channel-routing)
- [Fehlerbehebung](/de/channels/troubleshooting)
- [Konfiguration](/de/gateway/configuration)
- [Slash-Befehle](/de/tools/slash-commands)
