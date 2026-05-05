---
read_when:
    - Slack einrichten oder den Slack-Socket-/HTTP-Modus debuggen
summary: Slack-Einrichtung und Laufzeitverhalten (Socket Mode + HTTP-Anfrage-URLs)
title: Slack
x-i18n:
    generated_at: "2026-05-05T01:44:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a8e1cbfd3d99bfc24d79b56ee762d1ab399402391b241ff40698249b0828008
    source_path: channels/slack.md
    workflow: 16
---

Produktionsreif für DMs und Channels über Slack-App-Integrationen. Der Standardmodus ist Socket Mode; HTTP Request URLs werden ebenfalls unterstützt.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/de/channels/pairing">
    Slack-DMs verwenden standardmäßig den Pairing-Modus.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/de/tools/slash-commands">
    Natives Befehlsverhalten und Befehlskatalog.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/de/channels/troubleshooting">
    Channel-übergreifende Diagnose- und Reparatur-Playbooks.
  </Card>
</CardGroup>

## Socket Mode oder HTTP Request URLs wählen

Beide Transporte sind produktionsreif und erreichen Funktionsparität für Messaging, Slash-Befehle, App Home und Interaktivität. Wählen Sie nach Bereitstellungsform, nicht nach Funktionen.

| Aspekt                       | Socket Mode (Standard)                                                               | HTTP Request URLs                                                                                                  |
| ---------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| Öffentliche Gateway-URL      | Nicht erforderlich                                                                   | Erforderlich (DNS, TLS, Reverse Proxy oder Tunnel)                                                                 |
| Ausgehendes Netzwerk         | Ausgehendes WSS zu `wss-primary.slack.com` muss erreichbar sein                      | Kein ausgehendes WS; nur eingehendes HTTPS                                                                         |
| Benötigte Token              | Bot-Token (`xoxb-...`) + App-Level Token (`xapp-...`) mit `connections:write`        | Bot-Token (`xoxb-...`) + Signing Secret                                                                            |
| Dev-Laptop / hinter Firewall | Funktioniert direkt                                                                  | Benötigt einen öffentlichen Tunnel (ngrok, Cloudflare Tunnel, Tailscale Funnel) oder ein Staging-Gateway           |
| Horizontale Skalierung       | Eine Socket-Mode-Sitzung pro App und Host; mehrere Gateways benötigen separate Slack-Apps | Zustandsloser POST-Handler; mehrere Gateway-Replikate können eine App hinter einem Load Balancer gemeinsam nutzen |
| Mehrere Accounts auf einem Gateway | Unterstützt; jeder Account öffnet sein eigenes WS                               | Unterstützt; jeder Account benötigt einen eindeutigen `webhookPath` (Standard `/slack/events`), damit Registrierungen nicht kollidieren |
| Transport für Slash-Befehle  | Wird über die WS-Verbindung zugestellt; `slash_commands[].url` wird ignoriert         | Slack sendet POSTs an `slash_commands[].url`; das Feld ist erforderlich, damit der Befehl ausgelöst wird           |
| Request-Signatur             | Nicht verwendet (Authentifizierung ist das App-Level Token)                          | Slack signiert jede Anfrage; OpenClaw verifiziert mit `signingSecret`                                              |
| Wiederherstellung bei Verbindungsabbruch | Slack SDK verbindet automatisch neu; das Pong-Timeout-Transport-Tuning des Gateways gilt | Keine persistente Verbindung, die abbrechen kann; Wiederholungen erfolgen pro Anfrage von Slack                   |

<Note>
  **Wählen Sie Socket Mode** für Hosts mit einem einzelnen Gateway, Dev-Laptops und On-Prem-Netzwerke, die `*.slack.com` ausgehend erreichen können, aber kein eingehendes HTTPS akzeptieren können.

**Wählen Sie HTTP Request URLs**, wenn Sie mehrere Gateway-Replikate hinter einem Load Balancer ausführen, ausgehendes WSS blockiert ist, aber eingehendes HTTPS erlaubt ist, oder wenn Sie Slack-Webhooks bereits an einem Reverse Proxy terminieren.
</Note>

## Schnelle Einrichtung

<Tabs>
  <Tab title="Socket Mode (default)">
    <Steps>
      <Step title="Create a new Slack app">
        Öffnen Sie [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → wählen Sie Ihren Workspace aus → fügen Sie eines der folgenden Manifeste ein → **Next** → **Create**.

        <CodeGroup>

```json Recommended
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

```json Minimal
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
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
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
        "message.channels",
        "message.groups",
        "message.im"
      ]
    }
  }
}
```

        </CodeGroup>

        <Note>
          **Recommended** entspricht dem vollständigen Funktionsumfang des gebündelten Slack-Plugins: App Home, Slash-Befehle, Dateien, Reaktionen, Pins, Gruppen-DMs und Lesezugriffe auf Emoji/Benutzergruppen. Wählen Sie **Minimal**, wenn Workspace-Richtlinien Scopes einschränken — dies deckt DMs, Channel-/Gruppenverlauf, Erwähnungen und Slash-Befehle ab, verzichtet aber auf Dateien, Reaktionen, Pins, Gruppen-DM (`mpim:*`), `emoji:read` und `usergroups:read`. Siehe [Manifest- und Scope-Checkliste](#manifest-and-scope-checklist) für Begründungen pro Scope und additive Optionen wie zusätzliche Slash-Befehle.
        </Note>

        Nachdem Slack die App erstellt hat:

        - **Basic Information → App-Level Tokens → Generate Token and Scopes**: Fügen Sie `connections:write` hinzu, speichern Sie und kopieren Sie den Wert `xapp-...`.
        - **Install App → Install to Workspace**: Kopieren Sie das Bot User OAuth Token `xoxb-...`.

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

        Env-Fallback (nur Standard-Account):

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
        Öffnen Sie [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → wählen Sie Ihren Workspace aus → fügen Sie eines der folgenden Manifeste ein → ersetzen Sie `https://gateway-host.example.com/slack/events` durch Ihre öffentliche Gateway-URL → **Next** → **Create**.

        <CodeGroup>

```json Recommended
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
        "usergroups:read",
        "users:read"
      ]
    }
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
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
    },
    "interactivity": {
      "is_enabled": true,
      "request_url": "https://gateway-host.example.com/slack/events",
      "message_menu_options_url": "https://gateway-host.example.com/slack/events"
    }
  }
}
```

```json Minimal
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
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "im:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_home_opened",
        "app_mention",
        "message.channels",
        "message.groups",
        "message.im"
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

        </CodeGroup>

        <Note>
          **Empfohlen** entspricht dem vollen Funktionsumfang des gebündelten Slack-Plugins; **Minimal** entfernt Dateien, Reaktionen, Pins, Gruppen-DMs (`mpim:*`), `emoji:read` und `usergroups:read` für restriktive Workspaces. Siehe [Manifest- und Scope-Checkliste](#manifest-and-scope-checklist) für die Begründung je Scope.
        </Note>

        <Info>
          Die drei URL-Felder (`slash_commands[].url`, `event_subscriptions.request_url` und `interactivity.request_url` / `message_menu_options_url`) verweisen alle auf denselben OpenClaw-Endpunkt. Das Manifest-Schema von Slack verlangt, dass sie separat benannt werden, aber OpenClaw routet nach Payload-Typ, sodass ein einzelner `webhookPath` (Standard `/slack/events`) ausreicht. Slash-Befehle ohne `slash_commands[].url` führen im HTTP-Modus stillschweigend keine Aktion aus.
        </Info>

        Nachdem Slack die App erstellt hat:

        - **Basic Information → App Credentials**: Kopieren Sie das **Signing Secret** für die Anfrageverifizierung.
        - **Install App → Install to Workspace**: Kopieren Sie das `xoxb-...` Bot User OAuth Token.

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

## Transport-Tuning für Socket Mode

OpenClaw setzt das Pong-Timeout des Slack-SDK-Clients für Socket Mode standardmäßig auf 15 Sekunden. Überschreiben Sie die Transporteinstellungen nur, wenn Sie Workspace- oder Host-spezifisches Tuning benötigen:

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

Verwenden Sie dies nur für Socket-Mode-Workspaces, die Slack-Websocket-Pong- oder Server-Ping-Timeouts protokollieren oder auf Hosts mit bekannter Event-Loop-Überlastung laufen. `clientPingTimeout` ist die Wartezeit auf Pong, nachdem das SDK einen Client-Ping gesendet hat; `serverPingTimeout` ist die Wartezeit auf Slack-Server-Pings. App-Nachrichten und Ereignisse bleiben Anwendungszustand, keine Transport-Liveness-Signale.

## Manifest- und Scope-Checkliste

Das Basismanifest der Slack-App ist für Socket Mode und HTTP Request URLs identisch. Nur der Block `settings` (und die Slash-Befehls-`url`) unterscheidet sich.

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

Für den Modus **HTTP Request URLs** ersetzen Sie `settings` durch die HTTP-Variante und fügen jedem Slash-Befehl `url` hinzu. Öffentliche URL erforderlich:

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

Stellen Sie unterschiedliche Funktionen bereit, die die obigen Standardwerte erweitern.

Das Standardmanifest aktiviert den Slack App Home-Tab **Home** und abonniert `app_home_opened`. Wenn ein Workspace-Mitglied den Home-Tab öffnet, veröffentlicht OpenClaw mit `views.publish` eine sichere Standard-Home-Ansicht; es sind keine Konversations-Payloads oder privaten Konfigurationen enthalten. Der Tab **Messages** bleibt für Slack-DMs aktiviert.

<AccordionGroup>
  <Accordion title="Optional native slash commands">

    Mehrere [native Slash-Befehle](#commands-and-slash-behavior) können mit Nuancen anstelle eines einzelnen konfigurierten Befehls verwendet werden:

    - Verwenden Sie `/agentstatus` statt `/status`, weil der Befehl `/status` reserviert ist.
    - Es können nicht mehr als 25 Slash-Befehle gleichzeitig verfügbar gemacht werden.

    Ersetzen Sie Ihren vorhandenen Abschnitt `features.slash_commands` durch eine Teilmenge der [verfügbaren Befehle](/de/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Socket Mode (default)">

```json
{
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
      "command": "/side",
      "description": "Ask a side question without changing session context",
      "usage_hint": "<question>"
    },
    {
      "command": "/usage",
      "description": "Control the usage footer or show cost summary",
      "usage_hint": "off|tokens|full|cost"
    }
  ]
}
```

      </Tab>
      <Tab title="HTTP Request URLs">
        Verwenden Sie dieselbe `slash_commands`-Liste wie oben für Socket Mode und fügen Sie jedem Eintrag `"url": "https://gateway-host.example.com/slack/events"` hinzu. Beispiel:

```json
{
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
  ]
}
```

        Wiederholen Sie diesen `url`-Wert bei jedem Befehl in der Liste.

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="Optionale Autorenschafts-Scopes (Schreibvorgänge)">
    Fügen Sie den Bot-Scope `chat:write.customize` hinzu, wenn ausgehende Nachrichten die aktive Agent-Identität (benutzerdefinierter Benutzername und Symbol) statt der standardmäßigen Slack-App-Identität verwenden sollen.

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
    - `search:read` (wenn Sie auf Slack-Such-Lesevorgänge angewiesen sind)

  </Accordion>
</AccordionGroup>

## Token-Modell

- `botToken` + `appToken` sind für Socket Mode erforderlich.
- Der HTTP-Modus erfordert `botToken` + `signingSecret`.
- `botToken`, `appToken`, `signingSecret` und `userToken` akzeptieren Klartext-
  Zeichenfolgen oder SecretRef-Objekte.
- Config-Tokens überschreiben den Env-Fallback.
- Der Env-Fallback `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` gilt nur für das Standardkonto.
- `userToken` (`xoxp-...`) ist nur über die Config verfügbar (kein Env-Fallback) und verwendet standardmäßig schreibgeschütztes Verhalten (`userTokenReadOnly: true`).

Status-Snapshot-Verhalten:

- Die Slack-Kontoprüfung verfolgt pro Zugangsdaten `*Source`- und `*Status`-
  Felder (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Der Status ist `available`, `configured_unavailable` oder `missing`.
- `configured_unavailable` bedeutet, dass das Konto über SecretRef
  oder eine andere nicht-inline Secret-Quelle konfiguriert ist, der aktuelle Befehls-/Laufzeitpfad
  den tatsächlichen Wert aber nicht auflösen konnte.
- Im HTTP-Modus ist `signingSecretStatus` enthalten; im Socket Mode ist das
  erforderliche Paar `botTokenStatus` + `appTokenStatus`.

<Tip>
Für Aktionen/Verzeichnis-Lesevorgänge kann das Benutzer-Token bevorzugt werden, wenn es konfiguriert ist. Für Schreibvorgänge bleibt das Bot-Token bevorzugt; Schreibvorgänge mit Benutzer-Token sind nur erlaubt, wenn `userTokenReadOnly: false` und das Bot-Token nicht verfügbar ist.
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

Aktuelle Slack-Nachrichtenaktionen umfassen `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` und `emoji-list`. `download-file` akzeptiert Slack-Datei-IDs, die in eingehenden Datei-Platzhaltern angezeigt werden, und gibt für Bilder Bildvorschauen oder für andere Dateitypen lokale Dateimetadaten zurück.

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
    - `dm.allowFrom` (legacy)
    - `dm.groupEnabled` (Gruppen-DMs standardmäßig false)
    - `dm.groupChannels` (optionale MPIM-Allowlist)

    Vorrang bei mehreren Konten:

    - `channels.slack.accounts.default.allowFrom` gilt nur für das Konto `default`.
    - Benannte Konten erben `channels.slack.allowFrom`, wenn ihr eigenes `allowFrom` nicht gesetzt ist.
    - Benannte Konten erben `channels.slack.accounts.default.allowFrom` nicht.

    Legacy `channels.slack.dm.policy` und `channels.slack.dm.allowFrom` werden aus Kompatibilitätsgründen weiterhin gelesen. `openclaw doctor --fix` migriert sie zu `dmPolicy` und `allowFrom`, wenn dies ohne Änderung des Zugriffs möglich ist.

    Pairing in DMs verwendet `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Channel-Richtlinie">
    `channels.slack.groupPolicy` steuert die Channel-Behandlung:

    - `open`
    - `allowlist`
    - `disabled`

    Die Channel-Allowlist liegt unter `channels.slack.channels` und **muss stabile Slack-Channel-IDs** (zum Beispiel `C12345678`) als Config-Schlüssel verwenden.

    Laufzeithinweis: Wenn `channels.slack` vollständig fehlt (nur Env-Setup), fällt die Laufzeit auf `groupPolicy="allowlist"` zurück und protokolliert eine Warnung (auch wenn `channels.defaults.groupPolicy` gesetzt ist).

    Namens-/ID-Auflösung:

    - Einträge in der Channel-Allowlist und in der DM-Allowlist werden beim Start aufgelöst, wenn der Token-Zugriff dies erlaubt
    - nicht aufgelöste Channel-Namenseinträge bleiben wie konfiguriert erhalten, werden aber standardmäßig für das Routing ignoriert
    - eingehende Autorisierung und Channel-Routing sind standardmäßig ID-first; direktes Benutzername-/Slug-Matching erfordert `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Namensbasierte Schlüssel (`#channel-name` oder `channel-name`) passen unter `groupPolicy: "allowlist"` **nicht**. Die Channel-Suche ist standardmäßig ID-first, sodass ein namensbasierter Schlüssel nie erfolgreich routet und alle Nachrichten in diesem Channel stillschweigend blockiert werden. Dies unterscheidet sich von `groupPolicy: "open"`, wo der Channel-Schlüssel für das Routing nicht erforderlich ist und ein namensbasierter Schlüssel zu funktionieren scheint.

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

    Falsch (unter `groupPolicy: "allowlist"` still blockiert):

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
    Channel-Nachrichten sind standardmäßig durch Erwähnungen geschützt.

    Quellen für Erwähnungen:

    - explizite App-Erwähnung (`<@botId>`)
    - Slack-Benutzergruppen-Erwähnung (`<!subteam^S...>`), wenn der Bot-Benutzer Mitglied dieser Benutzergruppe ist; erfordert `usergroups:read`
    - Regex-Muster für Erwähnungen (`agents.list[].groupChat.mentionPatterns`, Fallback `messages.groupChat.mentionPatterns`)
    - implizites Antwortverhalten in Threads an den Bot (deaktiviert, wenn `thread.requireExplicitMention` `true` ist)

    Kanalbezogene Steuerelemente (`channels.slack.channels.<id>`; Namen nur über Startauflösung oder `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (Zulassungsliste)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - Schlüsselformat von `toolsBySender`: `id:`, `e164:`, `username:`, `name:` oder `"*"`-Wildcard
      (veraltete Schlüssel ohne Präfix werden weiterhin nur `id:` zugeordnet)

    `allowBots` ist für Kanäle und private Kanäle konservativ: Von Bots verfasste Raumnachrichten werden nur akzeptiert, wenn der sendende Bot explizit in der `users`-Zulassungsliste dieses Raums aufgeführt ist oder wenn mindestens eine explizite Slack-Besitzer-ID aus `channels.slack.allowFrom` aktuell Mitglied des Raums ist. Wildcards und Besitzereinträge mit Anzeigenamen erfüllen die Besitzeranwesenheit nicht. Die Besitzeranwesenheit verwendet Slack `conversations.members`; stellen Sie sicher, dass die App den passenden Lesebereich für den Raumtyp hat (`channels:read` für öffentliche Kanäle, `groups:read` für private Kanäle). Wenn die Mitgliedersuche fehlschlägt, verwirft OpenClaw die von einem Bot verfasste Raumnachricht.

  </Tab>
</Tabs>

## Threads, Sitzungen und Antwort-Tags

- DMs werden als `direct` weitergeleitet; Kanäle als `channel`; MPIMs als `group`.
- Slack-Routenbindungen akzeptieren rohe Peer-IDs sowie Slack-Zielformen wie `channel:C12345678`, `user:U12345678` und `<@U12345678>`.
- Mit dem Standard `session.dmScope=main` werden Slack-DMs in der Hauptsitzung des Agenten zusammengeführt.
- Kanalsitzungen: `agent:<agentId>:slack:channel:<channelId>`.
- Thread-Antworten können, sofern anwendbar, Thread-Sitzungssuffixe erstellen (`:thread:<threadTs>`).
- Der Standard für `channels.slack.thread.historyScope` ist `thread`; der Standard für `thread.inheritParent` ist `false`.
- `channels.slack.thread.initialHistoryLimit` steuert, wie viele vorhandene Thread-Nachrichten abgerufen werden, wenn eine neue Thread-Sitzung startet (Standard `20`; setzen Sie `0`, um dies zu deaktivieren).
- `channels.slack.thread.requireExplicitMention` (Standard `false`): Wenn `true`, werden implizite Thread-Erwähnungen unterdrückt, sodass der Bot innerhalb von Threads nur auf explizite `@bot`-Erwähnungen antwortet, selbst wenn der Bot bereits am Thread beteiligt war. Ohne dies umgehen Antworten in einem Thread, an dem der Bot beteiligt war, die `requireMention`-Prüfung.

Steuerelemente für Antwort-Threads:

- `channels.slack.replyToMode`: `off|first|all|batched` (Standard `off`)
- `channels.slack.replyToModeByChatType`: je `direct|group|channel`
- veralteter Fallback für direkte Chats: `channels.slack.dm.replyToMode`

Manuelle Antwort-Tags werden unterstützt:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` deaktiviert **alle** Antwort-Threads in Slack, einschließlich expliziter `[[reply_to_*]]`-Tags. Das unterscheidet sich von Telegram, wo explizite Tags im Modus `"off"` weiterhin berücksichtigt werden. Slack-Threads blenden Nachrichten im Kanal aus, während Telegram-Antworten inline sichtbar bleiben.
</Note>

## Bestätigungsreaktionen

`ackReaction` sendet ein Bestätigungs-Emoji, während OpenClaw eine eingehende Nachricht verarbeitet.

Auflösungsreihenfolge:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- Fallback auf das Emoji der Agentenidentität (`agents.list[].identity.emoji`, sonst "👀")

Hinweise:

- Slack erwartet Shortcodes (zum Beispiel `"eyes"`).
- Verwenden Sie `""`, um die Reaktion für das Slack-Konto oder global zu deaktivieren.

## Text-Streaming

`channels.slack.streaming` steuert das Verhalten der Live-Vorschau:

- `off`: Live-Vorschau-Streaming deaktivieren.
- `partial` (Standard): Vorschautext durch die neueste Teilausgabe ersetzen.
- `block`: Vorschauaktualisierungen in Blöcken anhängen.
- `progress`: Fortschrittsstatustext während der Generierung anzeigen und anschließend den finalen Text senden.
- `streaming.preview.toolProgress`: Wenn die Entwurfsvorschau aktiv ist, Tool-/Fortschrittsaktualisierungen in dieselbe bearbeitete Vorschaunachricht leiten (Standard: `true`). Setzen Sie `false`, um separate Tool-/Fortschrittsnachrichten beizubehalten.
- `streaming.preview.commandText` / `streaming.progress.commandText`: Auf `status` setzen, um kompakte Tool-Fortschrittszeilen beizubehalten und rohen Befehls-/Ausführungstext auszublenden (Standard: `raw`).

Rohen Befehls-/Ausführungstext ausblenden und kompakte Fortschrittszeilen beibehalten:

```json
{
  "channels": {
    "slack": {
      "streaming": {
        "mode": "progress",
        "progress": {
          "toolProgress": true,
          "commandText": "status"
        }
      }
    }
  }
}
```

`channels.slack.streaming.nativeTransport` steuert natives Slack-Text-Streaming, wenn `channels.slack.streaming.mode` `partial` ist (Standard: `true`).

- Ein Antwort-Thread muss verfügbar sein, damit natives Text-Streaming und der Slack-Assistenten-Threadstatus angezeigt werden. Die Thread-Auswahl folgt weiterhin `replyToMode`.
- Kanal-, Gruppenchat- und oberste DM-Roots können weiterhin die normale Entwurfsvorschau verwenden, wenn natives Streaming nicht verfügbar ist oder kein Antwort-Thread existiert.
- Oberste Slack-DMs bleiben standardmäßig außerhalb von Threads, daher zeigen sie Slacks native Stream-/Statusvorschau im Thread-Stil nicht an; OpenClaw veröffentlicht und bearbeitet stattdessen eine Entwurfsvorschau in der DM.
- Medien und Nicht-Text-Payloads fallen auf die normale Zustellung zurück.
- Finale Medien-/Fehlerausgaben brechen ausstehende Vorschau-Bearbeitungen ab; geeignete finale Text-/Blockausgaben werden nur übertragen, wenn sie die Vorschau direkt bearbeiten können.
- Wenn Streaming mitten in einer Antwort fehlschlägt, fällt OpenClaw für verbleibende Payloads auf die normale Zustellung zurück.

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

Veraltete Schlüssel:

- `channels.slack.streamMode` (`replace | status_final | append`) wird automatisch zu `channels.slack.streaming.mode` migriert.
- Der boolesche Wert `channels.slack.streaming` wird automatisch zu `channels.slack.streaming.mode` und `channels.slack.streaming.nativeTransport` migriert.
- Das veraltete `channels.slack.nativeStreaming` wird automatisch zu `channels.slack.streaming.nativeTransport` migriert.

## Fallback für Tippreaktion

`typingReaction` fügt der eingehenden Slack-Nachricht eine temporäre Reaktion hinzu, während OpenClaw eine Antwort verarbeitet, und entfernt sie anschließend, wenn der Lauf abgeschlossen ist. Dies ist vor allem außerhalb von Thread-Antworten nützlich, die eine standardmäßige Statusanzeige „tippt gerade ...“ verwenden.

Auflösungsreihenfolge:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Hinweise:

- Slack erwartet Shortcodes (zum Beispiel `"hourglass_flowing_sand"`).
- Die Reaktion erfolgt nach Best-Effort-Prinzip, und die Bereinigung wird automatisch versucht, nachdem der Antwort- oder Fehlerpfad abgeschlossen ist.

## Medien, Chunking und Zustellung

<AccordionGroup>
  <Accordion title="Eingehende Anhänge">
    Slack-Dateianhänge werden von Slack-gehosteten privaten URLs heruntergeladen (tokenauthentifizierter Anfragefluss) und bei erfolgreichem Abruf sowie innerhalb zulässiger Größenlimits in den Medienspeicher geschrieben. Dateiplatzhalter enthalten die Slack-`fileId`, damit Agents die Originaldatei mit `download-file` abrufen können.

    Downloads verwenden begrenzte Leerlauf- und Gesamt-Timeouts. Wenn der Slack-Dateiabruf hängen bleibt oder fehlschlägt, verarbeitet OpenClaw die Nachricht weiter und fällt auf den Dateiplatzhalter zurück.

    Die Laufzeit-Obergrenze für eingehende Größen ist standardmäßig `20MB`, sofern sie nicht durch `channels.slack.mediaMaxMb` überschrieben wird.

  </Accordion>

  <Accordion title="Ausgehender Text und Dateien">
    - Text-Chunks verwenden `channels.slack.textChunkLimit` (Standard 4000)
    - `channels.slack.chunkMode="newline"` aktiviert absatzpriorisiertes Aufteilen
    - Dateisendungen verwenden Slack-Upload-APIs und können Thread-Antworten (`thread_ts`) enthalten
    - Die Obergrenze für ausgehende Medien folgt `channels.slack.mediaMaxMb`, wenn konfiguriert; andernfalls verwenden Kanalsendungen MIME-Art-Standards aus der Medienpipeline

  </Accordion>

  <Accordion title="Zustellungsziele">
    Bevorzugte explizite Ziele:

    - `user:<id>` für DMs
    - `channel:<id>` für Kanäle

    Nur-Text/-Block-Slack-DMs können direkt an Benutzer-IDs posten; Datei-Uploads und Thread-Sendungen öffnen zuerst die DM über Slack-Konversations-APIs, da diese Pfade eine konkrete Konversations-ID erfordern.

  </Accordion>
</AccordionGroup>

## Commands und Slash-Verhalten

Slash-Commands erscheinen in Slack entweder als einzelner konfigurierter Command oder als mehrere native Commands. Konfigurieren Sie `channels.slack.slashCommand`, um Command-Standards zu ändern:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Native Commands erfordern [zusätzliche Manifest-Einstellungen](#additional-manifest-settings) in Ihrer Slack-App und werden stattdessen mit `channels.slack.commands.native: true` oder `commands.native: true` in globalen Konfigurationen aktiviert.

- Der automatische Modus für native Commands ist für Slack **deaktiviert**, sodass `commands.native: "auto"` keine nativen Slack-Commands aktiviert.

```txt
/help
```

Native Argumentmenüs verwenden eine adaptive Renderstrategie, die vor dem Dispatch eines ausgewählten Optionswerts ein Bestätigungsmodal anzeigt:

- bis zu 5 Optionen: Button-Blöcke
- 6-100 Optionen: statisches Auswahlmenü
- mehr als 100 Optionen: externe Auswahl mit asynchroner Optionsfilterung, wenn Interaktivitäts-Optionshandler verfügbar sind
- überschrittene Slack-Limits: codierte Optionswerte fallen auf Buttons zurück

```txt
/think
```

Slash-Sitzungen verwenden isolierte Schlüssel wie `agent:<agentId>:slack:slash:<userId>` und leiten Command-Ausführungen weiterhin mit `CommandTargetSessionKey` an die Zielkonversationssitzung weiter.

## Interaktive Antworten

Slack kann von Agents erstellte interaktive Antwortsteuerelemente rendern, diese Funktion ist jedoch standardmäßig deaktiviert.

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

Wenn aktiviert, können Agents reine Slack-Antwortdirektiven ausgeben:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Diese Direktiven werden in Slack Block Kit kompiliert und leiten Klicks oder Auswahlen über den vorhandenen Slack-Interaktionsereignispfad zurück.

Hinweise:

- Dies ist Slack-spezifische UI. Andere Kanäle übersetzen Slack-Block-Kit-Direktiven nicht in ihre eigenen Button-Systeme.
- Die interaktiven Callback-Werte sind von OpenClaw generierte opake Tokens, nicht rohe von Agents erstellte Werte.
- Wenn generierte interaktive Blöcke Slack-Block-Kit-Limits überschreiten würden, fällt OpenClaw auf die ursprüngliche Textantwort zurück, statt eine ungültige Blocks-Payload zu senden.

## Exec-Genehmigungen in Slack

Slack kann als nativer Genehmigungsclient mit interaktiven Buttons und Interaktionen dienen, statt auf die Web-UI oder das Terminal zurückzufallen.

- Exec-Genehmigungen verwenden `channels.slack.execApprovals.*` für natives DM-/Kanal-Routing.
- Plugin-Genehmigungen können weiterhin über dieselbe Slack-native Button-Oberfläche aufgelöst werden, wenn die Anfrage bereits in Slack landet und die Genehmigungs-ID-Art `plugin:` ist.
- Die Autorisierung der Genehmigenden wird weiterhin erzwungen: Nur als Genehmigende identifizierte Benutzer können Anfragen über Slack genehmigen oder ablehnen.

Dies verwendet dieselbe gemeinsame Genehmigungsbutton-Oberfläche wie andere Kanäle. Wenn `interactivity` in Ihren Slack-App-Einstellungen aktiviert ist, werden Genehmigungsaufforderungen direkt in der Konversation als Block-Kit-Buttons gerendert.
Wenn diese Buttons vorhanden sind, sind sie die primäre Genehmigungs-UX; OpenClaw
sollte nur dann einen manuellen `/approve`-Command einschließen, wenn das Tool-Ergebnis besagt, dass Chat-
Genehmigungen nicht verfügbar sind oder die manuelle Genehmigung der einzige Pfad ist.

Konfigurationspfad:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (optional; fällt nach Möglichkeit auf `commands.ownerAllowFrom` zurück)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, Standard: `dm`)
- `agentFilter`, `sessionFilter`

Slack aktiviert native Exec-Genehmigungen automatisch, wenn `enabled` nicht gesetzt oder `"auto"` ist und mindestens ein
Genehmigender aufgelöst wird. Setzen Sie `enabled: false`, um Slack explizit als nativen Genehmigungsclient zu deaktivieren.
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
die Zustellung an den Ursprungschat aktivieren möchten:

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

Gleicher-Chat-`/approve` funktioniert auch in Slack-Kanälen und DMs, die bereits Commands unterstützen. Siehe [Exec-Genehmigungen](/de/tools/exec-approvals) für das vollständige Genehmigungsweiterleitungsmodell.

## Ereignisse und Betriebsverhalten

- Nachrichtenbearbeitungen/-löschungen werden Systemereignissen zugeordnet.
- Thread-Broadcasts („Auch an Kanal senden“-Thread-Antworten) werden als normale Benutzernachrichten verarbeitet.
- Ereignisse zum Hinzufügen/Entfernen von Reaktionen werden Systemereignissen zugeordnet.
- Ereignisse zu Mitgliedsbeitritt/-austritt, erstellten/umbenannten Kanälen und hinzugefügten/entfernten Pins werden Systemereignissen zugeordnet.
- `channel_id_changed` kann Kanalkonfigurationsschlüssel migrieren, wenn `configWrites` aktiviert ist.
- Metadaten zu Kanalthema/-zweck werden als nicht vertrauenswürdiger Kontext behandelt und können in den Routing-Kontext injiziert werden.
- Thread-Starter und initiales Seeding des Thread-History-Kontexts werden gegebenenfalls nach konfigurierten Sender-Allowlists gefiltert.
- Blockaktionen und Modalinteraktionen geben strukturierte `Slack interaction: ...`-Systemereignisse mit umfangreichen Payload-Feldern aus:
  - Blockaktionen: ausgewählte Werte, Labels, Picker-Werte und `workflow_*`-Metadaten
  - modale `view_submission`- und `view_closed`-Ereignisse mit gerouteten Kanalmetadaten und Formulareingaben

## Konfigurationsreferenz

Primärreferenz: [Konfigurationsreferenz - Slack](/de/gateway/config-channels#slack).

<Accordion title="Wichtige Slack-Felder">

- Modus/Auth: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- DM-Zugriff: `dm.enabled`, `dmPolicy`, `allowFrom` (Legacy: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- Kompatibilitätsschalter: `dangerouslyAllowNameMatching` (Break-Glass; deaktiviert lassen, sofern nicht erforderlich)
- Kanalzugriff: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- Threading/History: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- Zustellung: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- Betrieb/Funktionen: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Keine Antworten in Kanälen">
    Prüfen Sie der Reihe nach:

    - `groupPolicy`
    - Kanal-Allowlist (`channels.slack.channels`) — **Schlüssel müssen Kanal-IDs sein** (`C12345678`), keine Namen (`#channel-name`). Namensbasierte Schlüssel schlagen unter `groupPolicy: "allowlist"` still fehl, da Kanalrouting standardmäßig ID-priorisiert ist. So finden Sie eine ID: Rechtsklick auf den Kanal in Slack → **Link kopieren** — der `C...`-Wert am Ende der URL ist die Kanal-ID.
    - `requireMention`
    - kanalspezifische `users`-Allowlist

    Nützliche Commands:

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
    - Slack-Assistant-DM-Ereignisse: ausführliche Logs mit Erwähnung von `drop message_changed`
      bedeuten üblicherweise, dass Slack ein bearbeitetes Assistant-Thread-Ereignis ohne einen
      wiederherstellbaren menschlichen Sender in den Nachrichtenmetadaten gesendet hat

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket-Modus verbindet sich nicht">
    Validieren Sie Bot- und App-Tokens sowie die Aktivierung des Socket-Modus in den Slack-App-Einstellungen.

    Wenn `openclaw channels status --probe --json` `botTokenStatus` oder
    `appTokenStatus: "configured_unavailable"` zeigt, ist das Slack-Konto
    konfiguriert, aber die aktuelle Laufzeit konnte den SecretRef-gestützten
    Wert nicht auflösen.

  </Accordion>

  <Accordion title="HTTP-Modus empfängt keine Ereignisse">
    Validieren Sie:

    - Signing Secret
    - Webhook-Pfad
    - Slack-Request-URLs (Events + Interactivity + Slash Commands)
    - eindeutiger `webhookPath` pro HTTP-Konto

    Wenn `signingSecretStatus: "configured_unavailable"` in Konto-
    Snapshots erscheint, ist das HTTP-Konto konfiguriert, aber die aktuelle Laufzeit konnte das SecretRef-gestützte Signing Secret nicht
    auflösen.

  </Accordion>

  <Accordion title="Native/Slash-Commands werden nicht ausgelöst">
    Prüfen Sie, ob Sie Folgendes beabsichtigt haben:

    - nativer Command-Modus (`channels.slack.commands.native: true`) mit passenden in Slack registrierten Slash-Commands
    - oder einzelner Slash-Command-Modus (`channels.slack.slashCommand.enabled: true`)

    Prüfen Sie außerdem `commands.useAccessGroups` sowie Kanal-/Benutzer-Allowlists.

  </Accordion>
</AccordionGroup>

## Referenz zu Attachment-Vision

Slack kann heruntergeladene Medien an den Agent-Turn anhängen, wenn Slack-Dateidownloads erfolgreich sind und Größenlimits dies erlauben. Bilddateien können über den Medienverständnispfad oder direkt an ein antwortendes vision-fähiges Modell übergeben werden; andere Dateien bleiben als herunterladbarer Dateikontext erhalten, statt als Bildeingabe behandelt zu werden.

### Unterstützte Medientypen

| Medientyp                      | Quelle               | Aktuelles Verhalten                                                                  | Hinweise                                                                   |
| ------------------------------ | -------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| JPEG-/PNG-/GIF-/WebP-Bilder    | Slack-Datei-URL      | Heruntergeladen und für vision-fähige Verarbeitung an den Turn angehängt             | Limit pro Datei: `channels.slack.mediaMaxMb` (Standard: 20 MB)             |
| PDF-Dateien                    | Slack-Datei-URL      | Heruntergeladen und als Dateikontext für Tools wie `download-file` oder `pdf` bereitgestellt | Eingehende Slack-Nachrichten wandeln PDFs nicht automatisch in Eingaben für Bild-Vision um |
| Andere Dateien                 | Slack-Datei-URL      | Wenn möglich heruntergeladen und als Dateikontext bereitgestellt                     | Binärdateien werden nicht als Bildeingabe behandelt                        |
| Thread-Antworten               | Thread-Startdateien  | Dateien der Root-Nachricht können als Kontext hydratisiert werden, wenn die Antwort keine direkten Medien enthält | Starter, die nur Dateien enthalten, verwenden einen Anhangsplatzhalter      |
| Nachrichten mit mehreren Bildern | Mehrere Slack-Dateien | Jede Datei wird unabhängig ausgewertet                                               | Slack-Verarbeitung ist auf acht Dateien pro Nachricht begrenzt             |

### Eingehende Pipeline

Wenn eine Slack-Nachricht mit Dateianhängen eintrifft:

1. OpenClaw lädt die Datei über die private URL von Slack mit dem Bot-Token (`xoxb-...`) herunter.
2. Die Datei wird bei Erfolg in den Medienspeicher geschrieben.
3. Heruntergeladene Medienpfade und Inhaltstypen werden dem eingehenden Kontext hinzugefügt.
4. Bildfähige Modell-/Tool-Pfade können Bildanhänge aus diesem Kontext verwenden.
5. Nicht-Bilddateien bleiben als Dateimetadaten oder Medienreferenzen für Tools verfügbar, die sie verarbeiten können.

### Vererbung von Anhängen der Thread-Root-Nachricht

Wenn eine Nachricht in einem Thread eintrifft (mit einem übergeordneten `thread_ts`):

- Wenn die Antwort selbst keine direkten Medien enthält und die enthaltene Root-Nachricht Dateien hat, kann Slack die Root-Dateien als Thread-Starter-Kontext hydratisieren.
- Direkte Antwortanhänge haben Vorrang vor Anhängen der Root-Nachricht.
- Eine Root-Nachricht, die nur Dateien und keinen Text enthält, wird mit einem Anhangsplatzhalter dargestellt, damit der Fallback ihre Dateien weiterhin einbeziehen kann.

### Verarbeitung mehrerer Anhänge

Wenn eine einzelne Slack-Nachricht mehrere Dateianhänge enthält:

- Jeder Anhang wird unabhängig durch die Medienpipeline verarbeitet.
- Heruntergeladene Medienreferenzen werden im Nachrichtenkontext zusammengeführt.
- Die Verarbeitungsreihenfolge folgt der Slack-Dateireihenfolge im Event-Payload.
- Ein Fehler beim Herunterladen eines Anhangs blockiert die anderen nicht.

### Größen-, Download- und Modelllimits

- **Größenlimit**: Standardmäßig 20 MB pro Datei. Konfigurierbar über `channels.slack.mediaMaxMb`.
- **Downloadfehler**: Dateien, die Slack nicht bereitstellen kann, abgelaufene URLs, nicht zugängliche Dateien, übergroße Dateien und Slack-Auth-/Login-HTML-Antworten werden übersprungen, statt als nicht unterstützte Formate gemeldet zu werden.
- **Vision-Modell**: Die Bildanalyse verwendet das aktive Antwortmodell, wenn es Vision unterstützt, oder das unter `agents.defaults.imageModel` konfigurierte Bildmodell.

### Bekannte Limits

| Szenario                               | Aktuelles Verhalten                                                            | Workaround                                                                  |
| -------------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| Abgelaufene Slack-Datei-URL            | Datei übersprungen; kein Fehler angezeigt                                      | Laden Sie die Datei erneut in Slack hoch                                    |
| Vision-Modell nicht konfiguriert       | Bildanhänge werden als Medienreferenzen gespeichert, aber nicht als Bilder analysiert | Konfigurieren Sie `agents.defaults.imageModel` oder verwenden Sie ein vision-fähiges Antwortmodell |
| Sehr große Bilder (> 20 MB standardmäßig) | Gemäß Größenlimit übersprungen                                                | Erhöhen Sie `channels.slack.mediaMaxMb`, sofern Slack dies zulässt          |
| Weitergeleitete/geteilte Anhänge       | Text und von Slack gehostete Bild-/Dateimedien werden nach bestem Aufwand verarbeitet | Teilen Sie sie direkt erneut im OpenClaw-Thread                             |
| PDF-Anhänge                            | Als Datei-/Medienkontext gespeichert, nicht automatisch durch Bild-Vision geleitet | Verwenden Sie `download-file` für Dateimetadaten oder das `pdf`-Tool für die PDF-Analyse |

### Zugehörige Dokumentation

- [Pipeline zum Medienverständnis](/de/nodes/media-understanding)
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
    Konfigurationslayout und Priorität.
  </Card>
  <Card title="Slash-Befehle" icon="terminal" href="/de/tools/slash-commands">
    Befehlskatalog und Verhalten.
  </Card>
</CardGroup>
