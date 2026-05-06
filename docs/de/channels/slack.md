---
read_when:
    - Slack einrichten oder den Slack-Socket-/HTTP-Modus debuggen
summary: Slack-Einrichtung und Laufzeitverhalten (Socket Mode + HTTP-Anfrage-URLs)
title: Slack
x-i18n:
    generated_at: "2026-05-06T17:52:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3afcedca5004c18949206eee2b2620d07a02c76ef663bea80f29ec2591f737b
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
    Channel-übergreifende Diagnosen und Reparatur-Playbooks.
  </Card>
</CardGroup>

## Socket Mode oder HTTP Request URLs auswählen

Beide Transporte sind produktionsreif und erreichen Feature-Parität für Messaging, Slash Commands, App Home und Interaktivität. Wählen Sie anhand der Bereitstellungsform, nicht anhand der Funktionen.

| Aspekt                       | Socket Mode (Standard)                                                              | HTTP Request URLs                                                                                               |
| ---------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Öffentliche Gateway-URL      | Nicht erforderlich                                                                   | Erforderlich (DNS, TLS, Reverse Proxy oder Tunnel)                                                             |
| Ausgehendes Netzwerk         | Ausgehendes WSS zu `wss-primary.slack.com` muss erreichbar sein                      | Kein ausgehendes WS; nur eingehendes HTTPS                                                                     |
| Benötigte Tokens             | Bot-Token (`xoxb-...`) + App-Level Token (`xapp-...`) mit `connections:write`        | Bot-Token (`xoxb-...`) + Signing Secret                                                                        |
| Entwickler-Laptop / hinter Firewall | Funktioniert unverändert                                                       | Benötigt einen öffentlichen Tunnel (ngrok, Cloudflare Tunnel, Tailscale Funnel) oder ein Staging-Gateway       |
| Horizontale Skalierung       | Eine Socket-Mode-Sitzung pro App pro Host; mehrere Gateways benötigen separate Slack-Apps | Zustandsloser POST-Handler; mehrere Gateway-Replikate können eine App hinter einem Load Balancer teilen        |
| Mehrere Konten auf einem Gateway | Unterstützt; jedes Konto öffnet seine eigene WS-Verbindung                       | Unterstützt; jedes Konto benötigt einen eindeutigen `webhookPath` (Standard `/slack/events`), damit Registrierungen nicht kollidieren |
| Transport für Slash Commands | Wird über die WS-Verbindung zugestellt; `slash_commands[].url` wird ignoriert        | Slack sendet POSTs an `slash_commands[].url`; das Feld ist erforderlich, damit der Befehl ausgelöst wird       |
| Request-Signierung           | Nicht verwendet (Auth ist der App-Level Token)                                      | Slack signiert jede Anfrage; OpenClaw verifiziert mit `signingSecret`                                          |
| Wiederherstellung bei Verbindungsabbruch | Slack SDK verbindet automatisch neu; die Pong-Timeout-Transportabstimmung des Gateways gilt | Keine dauerhafte Verbindung, die abbrechen kann; Wiederholungen erfolgen pro Anfrage durch Slack               |

<Note>
  **Wählen Sie Socket Mode** für einzelne Gateway-Hosts, Entwickler-Laptops und On-Prem-Netzwerke, die `*.slack.com` ausgehend erreichen können, aber kein eingehendes HTTPS akzeptieren können.

**Wählen Sie HTTP Request URLs**, wenn Sie mehrere Gateway-Replikate hinter einem Load Balancer betreiben, wenn ausgehendes WSS blockiert ist, aber eingehendes HTTPS erlaubt ist, oder wenn Sie Slack-Webhooks bereits an einem Reverse Proxy terminieren.
</Note>

## Schnelleinrichtung

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
          **Recommended** entspricht dem vollständigen Funktionsumfang des gebündelten Slack-Plugins: App Home, Slash Commands, Dateien, Reaktionen, Pins, Gruppen-DMs und Lesezugriffe auf Emojis/Benutzergruppen. Wählen Sie **Minimal**, wenn Workspace-Richtlinien Scopes einschränken – es deckt DMs, Channel-/Gruppenverlauf, Erwähnungen und Slash Commands ab, lässt aber Dateien, Reaktionen, Pins, Gruppen-DM (`mpim:*`), `emoji:read` und `usergroups:read` weg. Siehe [Manifest- und Scope-Checkliste](#manifest-and-scope-checklist) für die Begründung pro Scope und additive Optionen wie zusätzliche Slash Commands.
        </Note>

        Nachdem Slack die App erstellt hat:

        - **Basic Information → App-Level Tokens → Generate Token and Scopes**: Fügen Sie `connections:write` hinzu, speichern Sie und kopieren Sie den Wert `xapp-...`.
        - **Install App → Install to Workspace**: Kopieren Sie das `xoxb-...` Bot User OAuth Token.

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
          **Empfohlen** entspricht dem vollständigen Funktionsumfang des gebündelten Slack-Plugins; **Minimal** entfernt Dateien, Reaktionen, Pins, Gruppen-DMs (`mpim:*`), `emoji:read` und `usergroups:read` für restriktive Workspaces. Siehe [Checkliste für Manifest und Scopes](#manifest-and-scope-checklist) für die Begründung pro Scope.
        </Note>

        <Info>
          Die drei URL-Felder (`slash_commands[].url`, `event_subscriptions.request_url` und `interactivity.request_url` / `message_menu_options_url`) zeigen alle auf denselben OpenClaw-Endpunkt. Das Manifest-Schema von Slack verlangt, dass sie separat benannt werden, aber OpenClaw routet nach Payload-Typ, sodass ein einzelner `webhookPath` (Standard `/slack/events`) ausreicht. Slash-Befehle ohne `slash_commands[].url` führen im HTTP-Modus stillschweigend keine Aktion aus.
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

        Weisen Sie jedem Konto einen eigenen `webhookPath` (Standard `/slack/events`) zu, damit Registrierungen nicht kollidieren.
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

## Transport-Optimierung für Socket Mode

OpenClaw setzt das Pong-Timeout des Slack-SDK-Clients für Socket Mode standardmäßig auf 15 Sekunden. Überschreiben Sie die Transporteinstellungen nur, wenn Sie Workspace- oder Host-spezifische Anpassungen benötigen:

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

Verwenden Sie dies nur für Socket-Mode-Workspaces, die Slack-Websocket-Pong- oder Server-Ping-Timeouts protokollieren, oder für Hosts mit bekannter Event-Loop-Überlastung. `clientPingTimeout` ist die Wartezeit auf Pong, nachdem das SDK einen Client-Ping gesendet hat; `serverPingTimeout` ist die Wartezeit auf Slack-Server-Pings. App-Nachrichten und Events bleiben Anwendungszustand, keine Signale für Transport-Liveness.

## Checkliste für Manifest und Scopes

Das Basis-Manifest der Slack-App ist für Socket Mode und HTTP Request URLs gleich. Nur der `settings`-Block (und die Slash-Befehl-`url`) unterscheidet sich.

Basis-Manifest (Socket Mode Standard):

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

Für den **HTTP Request URLs-Modus** ersetzen Sie `settings` durch die HTTP-Variante und fügen jedem Slash-Befehl `url` hinzu. Öffentliche URL erforderlich:

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

Stellen Sie verschiedene Funktionen bereit, die die obigen Standards erweitern.

Das Standard-Manifest aktiviert den Slack-App-Home-Tab **Home** und abonniert `app_home_opened`. Wenn ein Workspace-Mitglied den Home-Tab öffnet, veröffentlicht OpenClaw mit `views.publish` eine sichere Standard-Home-Ansicht; es sind keine Konversations-Payloads oder privaten Konfigurationen enthalten. Der Tab **Messages** bleibt für Slack-DMs aktiviert.

<AccordionGroup>
  <Accordion title="Optional native slash commands">

    Mehrere [native Slash-Befehle](#commands-and-slash-behavior) können anstelle eines einzelnen konfigurierten Befehls verwendet werden, mit folgenden Feinheiten:

    - Verwenden Sie `/agentstatus` statt `/status`, da der Befehl `/status` reserviert ist.
    - Es können höchstens 25 Slash-Befehle gleichzeitig verfügbar gemacht werden.

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
        Verwenden Sie dieselbe Liste `slash_commands` wie oben für Socket Mode und fügen Sie jedem Eintrag `"url": "https://gateway-host.example.com/slack/events"` hinzu. Beispiel:

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

        Wiederholen Sie diesen `url`-Wert für jeden Befehl in der Liste.

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="Optionale Autorenschafts-Scopes (Schreiboperationen)">
    Fügen Sie den Bot-Scope `chat:write.customize` hinzu, wenn ausgehende Nachrichten die aktive Agentenidentität (benutzerdefinierter Benutzername und Symbol) statt der standardmäßigen Slack-App-Identität verwenden sollen.

    Wenn Sie ein Emoji-Symbol verwenden, erwartet Slack die Syntax `:emoji_name:`.

  </Accordion>
  <Accordion title="Optionale Benutzer-Token-Scopes (Leseoperationen)">
    Wenn Sie `channels.slack.userToken` konfigurieren, sind typische Lese-Scopes:

    - `channels:history`, `groups:history`, `im:history`, `mpim:history`
    - `channels:read`, `groups:read`, `im:read`, `mpim:read`
    - `users:read`
    - `reactions:read`
    - `pins:read`
    - `emoji:read`
    - `search:read` (wenn Sie von Slack-Suchlesevorgängen abhängig sind)

  </Accordion>
</AccordionGroup>

## Token-Modell

- `botToken` + `appToken` sind für den Socket Mode erforderlich.
- Der HTTP-Modus erfordert `botToken` + `signingSecret`.
- `botToken`, `appToken`, `signingSecret` und `userToken` akzeptieren Klartextzeichenfolgen
  oder SecretRef-Objekte.
- Config-Tokens überschreiben den Env-Fallback.
- Der Env-Fallback `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` gilt nur für das Standardkonto.
- `userToken` (`xoxp-...`) ist nur in der Konfiguration verfügbar (kein Env-Fallback) und verwendet standardmäßig ein schreibgeschütztes Verhalten (`userTokenReadOnly: true`).

Verhalten des Status-Snapshots:

- Die Slack-Kontoprüfung verfolgt pro Zugangsdaten `*Source`- und `*Status`-
  Felder (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Der Status ist `available`, `configured_unavailable` oder `missing`.
- `configured_unavailable` bedeutet, dass das Konto über SecretRef
  oder eine andere nicht inline angegebene Geheimnisquelle konfiguriert ist, der aktuelle Befehls-/Runtime-Pfad
  den tatsächlichen Wert jedoch nicht auflösen konnte.
- Im HTTP-Modus ist `signingSecretStatus` enthalten; im Socket Mode ist das
  erforderliche Paar `botTokenStatus` + `appTokenStatus`.

<Tip>
Für Aktionen/Verzeichnis-Lesevorgänge kann das Benutzer-Token bevorzugt werden, wenn es konfiguriert ist. Für Schreibvorgänge bleibt das Bot-Token bevorzugt; Schreibvorgänge mit Benutzer-Token sind nur erlaubt, wenn `userTokenReadOnly: false` ist und das Bot-Token nicht verfügbar ist.
</Tip>

## Aktionen und Gates

Slack-Aktionen werden durch `channels.slack.actions.*` gesteuert.

Verfügbare Aktionsgruppen im aktuellen Slack-Tooling:

| Gruppe     | Standard  |
| ---------- | --------- |
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

    Priorität bei mehreren Konten:

    - `channels.slack.accounts.default.allowFrom` gilt nur für das Konto `default`.
    - Benannte Konten erben `channels.slack.allowFrom`, wenn ihr eigenes `allowFrom` nicht gesetzt ist.
    - Benannte Konten erben `channels.slack.accounts.default.allowFrom` nicht.

    Legacy-`channels.slack.dm.policy` und `channels.slack.dm.allowFrom` werden aus Kompatibilitätsgründen weiterhin gelesen. `openclaw doctor --fix` migriert sie zu `dmPolicy` und `allowFrom`, wenn dies ohne Änderung des Zugriffs möglich ist.

    Pairing in DMs verwendet `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Channel-Richtlinie">
    `channels.slack.groupPolicy` steuert die Channel-Behandlung:

    - `open`
    - `allowlist`
    - `disabled`

    Die Channel-Allowlist befindet sich unter `channels.slack.channels` und **muss stabile Slack-Channel-IDs** (zum Beispiel `C12345678`) als Konfigurationsschlüssel verwenden.

    Runtime-Hinweis: Wenn `channels.slack` vollständig fehlt (reine Env-Einrichtung), fällt die Runtime auf `groupPolicy="allowlist"` zurück und protokolliert eine Warnung (auch wenn `channels.defaults.groupPolicy` gesetzt ist).

    Namens-/ID-Auflösung:

    - Channel-Allowlist-Einträge und DM-Allowlist-Einträge werden beim Start aufgelöst, wenn der Token-Zugriff dies erlaubt
    - Nicht aufgelöste Channel-Namenseinträge bleiben wie konfiguriert erhalten, werden aber standardmäßig für das Routing ignoriert
    - Eingehende Autorisierung und Channel-Routing sind standardmäßig ID-first; direkter Abgleich von Benutzername/Slug erfordert `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Namensbasierte Schlüssel (`#channel-name` oder `channel-name`) passen unter `groupPolicy: "allowlist"` **nicht**. Die Channel-Suche ist standardmäßig ID-first, sodass ein namensbasierter Schlüssel niemals erfolgreich routet und alle Nachrichten in diesem Channel stillschweigend blockiert werden. Dies unterscheidet sich von `groupPolicy: "open"`, bei dem der Channel-Schlüssel für das Routing nicht erforderlich ist und ein namensbasierter Schlüssel zu funktionieren scheint.

    Verwenden Sie immer die Slack-Channel-ID als Schlüssel. So finden Sie sie: Klicken Sie in Slack mit der rechten Maustaste auf den Channel → **Link kopieren** — die ID (`C...`) steht am Ende der URL.

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

  <Tab title="Mentions und Channel-Benutzer">
    Channel-Nachrichten erfordern standardmäßig eine Mention.

    Mention-Quellen:

    - explizite App-Mention (`<@botId>`)
    - Slack-Benutzergruppen-Mention (`<!subteam^S...>`), wenn der Bot-Benutzer Mitglied dieser Benutzergruppe ist; erfordert `usergroups:read`
    - Mention-Regex-Muster (`agents.list[].groupChat.mentionPatterns`, Fallback `messages.groupChat.mentionPatterns`)
    - implizites Antwort-auf-Bot-Thread-Verhalten (deaktiviert, wenn `thread.requireExplicitMention` `true` ist)

    Steuerung pro Channel (`channels.slack.channels.<id>`; Namen nur über Startauflösung oder `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `users` (Allowlist)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - Schlüsselformat für `toolsBySender`: `id:`, `e164:`, `username:`, `name:` oder Platzhalter `"*"`
      (Legacy-Schlüssel ohne Präfix werden weiterhin nur `id:` zugeordnet)

    `allowBots` ist für Channels und private Channels konservativ: Bot-verfasste Raumnachrichten werden nur akzeptiert, wenn der sendende Bot explizit in der `users`-Allowlist dieses Raums aufgeführt ist oder wenn mindestens eine explizite Slack-Besitzer-ID aus `channels.slack.allowFrom` aktuell Raummitglied ist. Platzhalter und Besitzer-Einträge mit Anzeigenamen erfüllen die Besitzerpräsenz nicht. Die Besitzerpräsenz verwendet Slack `conversations.members`; stellen Sie sicher, dass die App den passenden Lese-Scope für den Raumtyp hat (`channels:read` für öffentliche Channels, `groups:read` für private Channels). Wenn die Mitgliederabfrage fehlschlägt, verwirft OpenClaw die bot-verfasste Raumnachricht.

  </Tab>
</Tabs>

## Threading, Sitzungen und Antwort-Tags

- DMs werden als `direct` geroutet; Channels als `channel`; MPIMs als `group`.
- Slack-Routenbindungen akzeptieren rohe Peer-IDs sowie Slack-Zielformen wie `channel:C12345678`, `user:U12345678` und `<@U12345678>`.
- Mit dem Standard `session.dmScope=main` werden Slack-DMs auf die Hauptsitzung des Agenten zusammengeführt.
- Channel-Sitzungen: `agent:<agentId>:slack:channel:<channelId>`.
- Thread-Antworten können gegebenenfalls Thread-Sitzungssuffixe erstellen (`:thread:<threadTs>`).
- Der Standard für `channels.slack.thread.historyScope` ist `thread`; der Standard für `thread.inheritParent` ist `false`.
- `channels.slack.thread.initialHistoryLimit` steuert, wie viele vorhandene Thread-Nachrichten abgerufen werden, wenn eine neue Thread-Sitzung startet (Standard `20`; auf `0` setzen, um dies zu deaktivieren).
- `channels.slack.thread.requireExplicitMention` (Standard `false`): Wenn `true`, werden implizite Thread-Mentions unterdrückt, sodass der Bot innerhalb von Threads nur auf explizite `@bot`-Mentions antwortet, selbst wenn der Bot bereits am Thread beteiligt war. Ohne dies umgehen Antworten in einem Thread, an dem der Bot beteiligt ist, das `requireMention`-Gate.

Steuerung für Antwort-Threading:

- `channels.slack.replyToMode`: `off|first|all|batched` (Standard `off`)
- `channels.slack.replyToModeByChatType`: pro `direct|group|channel`
- Legacy-Fallback für direkte Chats: `channels.slack.dm.replyToMode`

Manuelle Antwort-Tags werden unterstützt:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

<Note>
`replyToMode="off"` deaktiviert **alle** Antwort-Threadings in Slack, einschließlich expliziter `[[reply_to_*]]`-Tags. Dies unterscheidet sich von Telegram, wo explizite Tags im Modus `"off"` weiterhin berücksichtigt werden. Slack-Threads verbergen Nachrichten vor dem Channel, während Telegram-Antworten inline sichtbar bleiben.
</Note>

## Ack-Reaktionen

`ackReaction` sendet ein Bestätigungs-Emoji, während OpenClaw eine eingehende Nachricht verarbeitet.

Auflösungsreihenfolge:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- Agentenidentitäts-Emoji-Fallback (`agents.list[].identity.emoji`, sonst "👀")

Hinweise:

- Slack erwartet Shortcodes (zum Beispiel `"eyes"`).
- Verwenden Sie `""`, um die Reaktion für das Slack-Konto oder global zu deaktivieren.

## Text-Streaming

`channels.slack.streaming` steuert das Live-Vorschau-Verhalten:

- `off`: Live-Vorschau-Streaming deaktivieren.
- `partial` (Standard): Vorschautext durch die neueste Teilausgabe ersetzen.
- `block`: gestückelte Vorschauaktualisierungen anhängen.
- `progress`: Fortschrittsstatustext während der Generierung anzeigen, danach den finalen Text senden.
- `streaming.preview.toolProgress`: Wenn die Entwurfsvorschau aktiv ist, Tool-/Fortschrittsaktualisierungen in dieselbe bearbeitete Vorschaunachricht routen (Standard: `true`). Auf `false` setzen, um separate Tool-/Fortschrittsnachrichten beizubehalten.
- `streaming.preview.commandText` / `streaming.progress.commandText`: auf `status` setzen, um kompakte Tool-Fortschrittszeilen beizubehalten und gleichzeitig rohen Befehls-/Exec-Text auszublenden (Standard: `raw`).

Rohen Befehls-/Exec-Text ausblenden und kompakte Fortschrittszeilen beibehalten:

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

`channels.slack.streaming.nativeTransport` steuert das native Text-Streaming von Slack, wenn `channels.slack.streaming.mode` `partial` ist (Standard: `true`).

- Ein Antwort-Thread muss verfügbar sein, damit natives Text-Streaming und Slack-Assistenten-Threadstatus angezeigt werden. Die Thread-Auswahl folgt weiterhin `replyToMode`.
- Channel-, Gruppenchat- und Top-Level-DM-Wurzeln können weiterhin die normale Entwurfsvorschau verwenden, wenn natives Streaming nicht verfügbar ist oder kein Antwort-Thread existiert.
- Top-Level-Slack-DMs bleiben standardmäßig außerhalb von Threads, daher zeigen sie keine Thread-artige native Stream-/Statusvorschau von Slack; OpenClaw postet und bearbeitet stattdessen eine Entwurfsvorschau in der DM.
- Medien und Nicht-Text-Payloads fallen auf die normale Zustellung zurück.
- Medien-/Fehler-Finalnachrichten brechen ausstehende Vorschau-Bearbeitungen ab; geeignete Text-/Block-Finalnachrichten werden nur ausgegeben, wenn sie die Vorschau an Ort und Stelle bearbeiten können.
- Wenn Streaming mitten in einer Antwort fehlschlägt, fällt OpenClaw für die verbleibenden Payloads auf normale Zustellung zurück.

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

- `channels.slack.streamMode` (`replace | status_final | append`) ist ein veralteter Laufzeit-Alias für `channels.slack.streaming.mode`.
- Der boolesche Wert `channels.slack.streaming` ist ein veralteter Laufzeit-Alias für `channels.slack.streaming.mode` und `channels.slack.streaming.nativeTransport`.
- Das veraltete `channels.slack.nativeStreaming` ist ein Laufzeit-Alias für `channels.slack.streaming.nativeTransport`.
- Führen Sie `openclaw doctor --fix` aus, um die persistierte Slack-Streaming-Konfiguration auf die kanonischen Schlüssel umzuschreiben.

## Fallback für Tippreaktionen

`typingReaction` fügt der eingehenden Slack-Nachricht eine temporäre Reaktion hinzu, während OpenClaw eine Antwort verarbeitet, und entfernt sie wieder, wenn der Lauf beendet ist. Dies ist vor allem außerhalb von Thread-Antworten nützlich, die eine standardmäßige Statusanzeige „schreibt ...“ verwenden.

Auflösungsreihenfolge:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Hinweise:

- Slack erwartet Shortcodes (zum Beispiel `"hourglass_flowing_sand"`).
- Die Reaktion erfolgt nach bestem Aufwand, und die Bereinigung wird nach Abschluss des Antwort- oder Fehlerpfads automatisch versucht.

## Medien, Chunking und Zustellung

<AccordionGroup>
  <Accordion title="Eingehende Anhänge">
    Slack-Dateianhänge werden von Slack-gehosteten privaten URLs heruntergeladen (tokenauthentifizierter Anfragefluss) und in den Medienspeicher geschrieben, wenn der Abruf erfolgreich ist und Größenlimits es erlauben. Dateiplatzhalter enthalten die Slack-`fileId`, damit Agenten die Originaldatei mit `download-file` abrufen können.

    Downloads verwenden begrenzte Leerlauf- und Gesamtzeitüberschreitungen. Wenn der Slack-Dateiabruf hängen bleibt oder fehlschlägt, verarbeitet OpenClaw die Nachricht weiter und fällt auf den Dateiplatzhalter zurück.

    Die Laufzeit-Größenobergrenze für eingehende Inhalte ist standardmäßig `20MB`, sofern sie nicht durch `channels.slack.mediaMaxMb` überschrieben wird.

  </Accordion>

  <Accordion title="Ausgehender Text und Dateien">
    - Text-Chunks verwenden `channels.slack.textChunkLimit` (Standard 4000)
    - `channels.slack.chunkMode="newline"` aktiviert absatzpriorisierte Aufteilung
    - Dateisendungen verwenden Slack-Upload-APIs und können Thread-Antworten (`thread_ts`) enthalten
    - die Obergrenze für ausgehende Medien folgt `channels.slack.mediaMaxMb`, wenn konfiguriert; andernfalls verwenden Kanalsendungen MIME-Art-Standards aus der Medienpipeline

  </Accordion>

  <Accordion title="Zustellungsziele">
    Bevorzugte explizite Ziele:

    - `user:<id>` für DMs
    - `channel:<id>` für Kanäle

    Reine Text-/Block-Slack-DMs können direkt an Benutzer-IDs posten; Datei-Uploads und Thread-Sendungen öffnen die DM zuerst über Slack-Konversations-APIs, weil diese Pfade eine konkrete Konversations-ID erfordern.

  </Accordion>
</AccordionGroup>

## Befehle und Slash-Verhalten

Slash-Befehle erscheinen in Slack entweder als ein einzelner konfigurierter Befehl oder als mehrere native Befehle. Konfigurieren Sie `channels.slack.slashCommand`, um Befehlsstandards zu ändern:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Native Befehle erfordern stattdessen [zusätzliche Manifest-Einstellungen](#additional-manifest-settings) in Ihrer Slack-App und werden mit `channels.slack.commands.native: true` oder `commands.native: true` in globalen Konfigurationen aktiviert.

- Der automatische Modus für native Befehle ist für Slack **aus**, sodass `commands.native: "auto"` native Slack-Befehle nicht aktiviert.

```txt
/help
```

Native Argumentmenüs verwenden eine adaptive Rendering-Strategie, die vor dem Auslösen eines ausgewählten Optionswerts ein Bestätigungsmodal anzeigt:

- bis zu 5 Optionen: Button-Blöcke
- 6-100 Optionen: statisches Auswahlmenü
- mehr als 100 Optionen: externe Auswahl mit asynchroner Optionsfilterung, wenn Interaktivitätsoptions-Handler verfügbar sind
- überschrittene Slack-Limits: codierte Optionswerte fallen auf Buttons zurück

```txt
/think
```

Slash-Sitzungen verwenden isolierte Schlüssel wie `agent:<agentId>:slack:slash:<userId>` und leiten Befehlsausführungen weiterhin mithilfe von `CommandTargetSessionKey` an die Ziel-Konversationssitzung weiter.

## Interaktive Antworten

Slack kann von Agenten erstellte interaktive Antwortsteuerelemente rendern, aber diese Funktion ist standardmäßig deaktiviert.

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

Wenn aktiviert, können Agenten Slack-spezifische Antwortdirektiven ausgeben:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Diese Direktiven werden zu Slack Block Kit kompiliert und leiten Klicks oder Auswahlen über den bestehenden Slack-Interaktionsereignispfad zurück.

Hinweise:

- Dies ist Slack-spezifische UI. Andere Kanäle übersetzen Slack-Block-Kit-Direktiven nicht in ihre eigenen Button-Systeme.
- Die interaktiven Callback-Werte sind von OpenClaw generierte undurchsichtige Token, keine rohen, vom Agenten erstellten Werte.
- Wenn generierte interaktive Blöcke Slack-Block-Kit-Limits überschreiten würden, fällt OpenClaw auf die ursprüngliche Textantwort zurück, anstatt eine ungültige Blocks-Nutzlast zu senden.

## Exec-Genehmigungen in Slack

Slack kann als nativer Genehmigungsclient mit interaktiven Buttons und Interaktionen dienen, anstatt auf die Web-UI oder das Terminal zurückzufallen.

- Exec-Genehmigungen verwenden `channels.slack.execApprovals.*` für natives DM-/Kanal-Routing.
- Plugin-Genehmigungen können weiterhin über dieselbe Slack-native Button-Oberfläche aufgelöst werden, wenn die Anfrage bereits in Slack landet und die Genehmigungs-ID-Art `plugin:` ist.
- Die Autorisierung der genehmigenden Personen wird weiterhin erzwungen: Nur Benutzer, die als genehmigende Personen identifiziert sind, können Anfragen über Slack genehmigen oder ablehnen.

Dies verwendet dieselbe gemeinsame Genehmigungsbutton-Oberfläche wie andere Kanäle. Wenn `interactivity` in Ihren Slack-App-Einstellungen aktiviert ist, werden Genehmigungsaufforderungen direkt in der Konversation als Block-Kit-Buttons gerendert.
Wenn diese Buttons vorhanden sind, sind sie die primäre Genehmigungs-UX; OpenClaw
sollte einen manuellen `/approve`-Befehl nur einschließen, wenn das Tool-Ergebnis sagt, dass Chat-
Genehmigungen nicht verfügbar sind oder die manuelle Genehmigung der einzige Pfad ist.

Konfigurationspfad:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (optional; fällt nach Möglichkeit auf `commands.ownerAllowFrom` zurück)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, Standard: `dm`)
- `agentFilter`, `sessionFilter`

Slack aktiviert native Exec-Genehmigungen automatisch, wenn `enabled` nicht gesetzt oder `"auto"` ist und mindestens eine
genehmigende Person aufgelöst wird. Setzen Sie `enabled: false`, um Slack explizit als nativen Genehmigungsclient zu deaktivieren.
Setzen Sie `enabled: true`, um native Genehmigungen zu erzwingen, wenn genehmigende Personen aufgelöst werden.

Standardverhalten ohne explizite Slack-Exec-Genehmigungskonfiguration:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Eine explizite Slack-native Konfiguration ist nur erforderlich, wenn Sie genehmigende Personen überschreiben, Filter hinzufügen oder
die Zustellung im Ursprungschat aktivieren möchten:

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

Die gemeinsame `approvals.exec`-Weiterleitung ist separat. Verwenden Sie sie nur, wenn Exec-Genehmigungsaufforderungen auch
an andere Chats oder explizite Out-of-Band-Ziele weitergeleitet werden müssen. Die gemeinsame `approvals.plugin`-Weiterleitung ist ebenfalls
separat; Slack-native Buttons können Plugin-Genehmigungen weiterhin auflösen, wenn diese Anfragen bereits
in Slack landen.

Same-Chat-`/approve` funktioniert auch in Slack-Kanälen und DMs, die bereits Befehle unterstützen. Siehe [Exec-Genehmigungen](/de/tools/exec-approvals) für das vollständige Modell der Genehmigungsweiterleitung.

## Ereignisse und Betriebsverhalten

- Nachrichtenbearbeitungen/-löschungen werden Systemereignissen zugeordnet.
- Thread-Broadcasts („Auch an Kanal senden“-Thread-Antworten) werden als normale Benutzernachrichten verarbeitet.
- Ereignisse zum Hinzufügen/Entfernen von Reaktionen werden Systemereignissen zugeordnet.
- Ereignisse zu Mitgliederbeitritt/-austritt, Kanalerstellung/-umbenennung und Pin-Hinzufügung/-Entfernung werden Systemereignissen zugeordnet.
- `channel_id_changed` kann Kanalkonfigurationsschlüssel migrieren, wenn `configWrites` aktiviert ist.
- Metadaten zu Kanalthema/-zweck werden als nicht vertrauenswürdiger Kontext behandelt und können in den Routing-Kontext injiziert werden.
- Thread-Starter und anfängliches Thread-Verlaufskontext-Seeding werden nach konfigurierten Absender-Allowlists gefiltert, wenn zutreffend.
- Blockaktionen und Modalinteraktionen geben strukturierte `Slack interaction: ...`-Systemereignisse mit umfangreichen Nutzlastfeldern aus:
  - Blockaktionen: ausgewählte Werte, Labels, Picker-Werte und `workflow_*`-Metadaten
  - Modalereignisse `view_submission` und `view_closed` mit gerouteten Kanalmetadaten und Formulareingaben

## Konfigurationsreferenz

Primäre Referenz: [Konfigurationsreferenz - Slack](/de/gateway/config-channels#slack).

<Accordion title="Wichtige Slack-Felder">

- Modus/Auth: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- DM-Zugriff: `dm.enabled`, `dmPolicy`, `allowFrom` (veraltet: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- Kompatibilitätsschalter: `dangerouslyAllowNameMatching` (Notfalloption; deaktiviert lassen, sofern nicht erforderlich)
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
    - Kanal-Allowlist (`channels.slack.channels`) — **Schlüssel müssen Kanal-IDs sein** (`C12345678`), keine Namen (`#channel-name`). Namensbasierte Schlüssel schlagen unter `groupPolicy: "allowlist"` still fehl, weil Kanal-Routing standardmäßig ID-priorisiert ist. So finden Sie eine ID: Rechtsklicken Sie in Slack auf den Kanal → **Link kopieren** — der `C...`-Wert am Ende der URL ist die Kanal-ID.
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
    - `channels.slack.dmPolicy` (oder veraltet `channels.slack.dm.policy`)
    - Pairing-Genehmigungen / Allowlist-Einträge
    - Slack-Assistant-DM-Ereignisse: ausführliche Logs mit `drop message_changed`
      bedeuten normalerweise, dass Slack ein bearbeitetes Assistant-Thread-Ereignis ohne
      wiederherstellbaren menschlichen Absender in den Nachrichtenmetadaten gesendet hat

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket-Modus verbindet nicht">
    Validieren Sie Bot- und App-Token sowie die Aktivierung des Socket-Modus in den Slack-App-Einstellungen.

    Wenn `openclaw channels status --probe --json` `botTokenStatus` oder
    `appTokenStatus: "configured_unavailable"` anzeigt, ist das Slack-Konto
    konfiguriert, aber die aktuelle Laufzeit konnte den SecretRef-gestützten
    Wert nicht auflösen.

  </Accordion>

  <Accordion title="HTTP-Modus empfängt keine Ereignisse">
    Validieren Sie:

    - Signierungs-Secret
    - Webhook-Pfad
    - Slack-Anfrage-URLs (Ereignisse + Interaktivität + Slash-Befehle)
    - eindeutiger `webhookPath` pro HTTP-Konto

    Wenn `signingSecretStatus: "configured_unavailable"` in Konto-
    Snapshots erscheint, ist das HTTP-Konto konfiguriert, aber die aktuelle Laufzeit konnte
    das SecretRef-gestützte Signierungs-Secret nicht auflösen.

  </Accordion>

  <Accordion title="Native/Slash-Befehle werden nicht ausgelöst">
    Prüfen Sie, ob Sie Folgendes beabsichtigt haben:

    - nativer Befehlsmodus (`channels.slack.commands.native: true`) mit passenden, in Slack registrierten Slash-Befehlen
    - oder einzelner Slash-Befehlsmodus (`channels.slack.slashCommand.enabled: true`)

    Prüfen Sie außerdem `commands.useAccessGroups` und Kanal-/Benutzer-Allowlists.

  </Accordion>
</AccordionGroup>

## Referenz zu Anhangserkennung mit Vision

Slack kann heruntergeladene Medien an den Agent-Turn anhängen, wenn Slack-Dateidownloads erfolgreich sind und Größenlimits dies zulassen. Bilddateien können über den Pfad für Medienverständnis oder direkt an ein vision-fähiges Antwortmodell weitergegeben werden; andere Dateien bleiben als herunterladbarer Dateikontext erhalten und werden nicht als Bildeingabe behandelt.

### Unterstützte Medientypen

| Medientyp                      | Quelle              | Aktuelles Verhalten                                                               | Hinweise                                                                  |
| ------------------------------ | ------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| JPEG-/PNG-/GIF-/WebP-Bilder    | Slack-Datei-URL     | Heruntergeladen und für vision-fähige Verarbeitung an den Turn angehängt          | Limit pro Datei: `channels.slack.mediaMaxMb` (Standard 20 MB)             |
| PDF-Dateien                    | Slack-Datei-URL     | Heruntergeladen und als Dateikontext für Tools wie `download-file` oder `pdf` bereitgestellt | Slack-Inbound wandelt PDFs nicht automatisch in Eingaben für Bild-Vision um |
| Andere Dateien                 | Slack-Datei-URL     | Nach Möglichkeit heruntergeladen und als Dateikontext bereitgestellt              | Binärdateien werden nicht als Bildeingabe behandelt                       |
| Thread-Antworten               | Dateien der Thread-Startnachricht | Dateien der Root-Nachricht können als Kontext hydriert werden, wenn die Antwort keine direkten Medien enthält | Startnachrichten, die nur Dateien enthalten, verwenden einen Anhang-Platzhalter |
| Nachrichten mit mehreren Bildern | Mehrere Slack-Dateien | Jede Datei wird unabhängig ausgewertet                                            | Die Slack-Verarbeitung ist auf acht Dateien pro Nachricht begrenzt        |

### Inbound-Pipeline

Wenn eine Slack-Nachricht mit Dateianhängen eingeht:

1. OpenClaw lädt die Datei über die private URL von Slack mit dem Bot-Token (`xoxb-...`) herunter.
2. Die Datei wird bei Erfolg in den Medienspeicher geschrieben.
3. Heruntergeladene Medienpfade und Inhaltstypen werden dem Inbound-Kontext hinzugefügt.
4. Bildfähige Modell-/Tool-Pfade können Bildanhänge aus diesem Kontext verwenden.
5. Nicht-Bilddateien bleiben als Dateimetadaten oder Medienreferenzen für Tools verfügbar, die sie verarbeiten können.

### Vererbung von Anhängen der Thread-Root-Nachricht

Wenn eine Nachricht in einem Thread eingeht (mit einem `thread_ts`-Parent):

- Wenn die Antwort selbst keine direkten Medien enthält und die enthaltene Root-Nachricht Dateien hat, kann Slack die Root-Dateien als Kontext der Thread-Startnachricht hydrieren.
- Direkte Antwortanhänge haben Vorrang vor Anhängen der Root-Nachricht.
- Eine Root-Nachricht, die nur Dateien und keinen Text enthält, wird mit einem Anhang-Platzhalter dargestellt, sodass der Fallback ihre Dateien weiterhin einschließen kann.

### Verarbeitung mehrerer Anhänge

Wenn eine einzelne Slack-Nachricht mehrere Dateianhänge enthält:

- Jeder Anhang wird unabhängig durch die Medien-Pipeline verarbeitet.
- Heruntergeladene Medienreferenzen werden im Nachrichtenkontext aggregiert.
- Die Verarbeitungsreihenfolge folgt der Dateireihenfolge von Slack in der Event-Payload.
- Ein Fehler beim Download eines Anhangs blockiert die anderen nicht.

### Größen-, Download- und Modelllimits

- **Größenlimit**: Standardmäßig 20 MB pro Datei. Konfigurierbar über `channels.slack.mediaMaxMb`.
- **Downloadfehler**: Dateien, die Slack nicht bereitstellen kann, abgelaufene URLs, unzugängliche Dateien, übergroße Dateien und Slack-Auth-/Login-HTML-Antworten werden übersprungen, statt als nicht unterstützte Formate gemeldet zu werden.
- **Vision-Modell**: Die Bildanalyse verwendet das aktive Antwortmodell, wenn es Vision unterstützt, oder das unter `agents.defaults.imageModel` konfigurierte Bildmodell.

### Bekannte Einschränkungen

| Szenario                              | Aktuelles Verhalten                                                            | Workaround                                                                  |
| ------------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| Abgelaufene Slack-Datei-URL           | Datei übersprungen; kein Fehler angezeigt                                      | Datei erneut in Slack hochladen                                             |
| Vision-Modell nicht konfiguriert      | Bildanhänge werden als Medienreferenzen gespeichert, aber nicht als Bilder analysiert | `agents.defaults.imageModel` konfigurieren oder ein vision-fähiges Antwortmodell verwenden |
| Sehr große Bilder (> 20 MB standardmäßig) | Gemäß Größenlimit übersprungen                                                 | `channels.slack.mediaMaxMb` erhöhen, wenn Slack dies zulässt                |
| Weitergeleitete/geteilte Anhänge      | Text und von Slack gehostete Bild-/Dateimedien werden nach bestem Aufwand verarbeitet | Direkt im OpenClaw-Thread erneut teilen                                     |
| PDF-Anhänge                           | Als Datei-/Medienkontext gespeichert, nicht automatisch durch Bild-Vision geleitet | `download-file` für Dateimetadaten oder das Tool `pdf` für PDF-Analysen verwenden |

### Verwandte Dokumentation

- [Pipeline für Medienverständnis](/de/nodes/media-understanding)
- [PDF-Tool](/de/tools/pdf)
- Epic: [#51349](https://github.com/openclaw/openclaw/issues/51349) — Aktivierung von Slack-Anhang-Vision
- Regressionstests: [#51353](https://github.com/openclaw/openclaw/issues/51353)
- Live-Verifizierung: [#51354](https://github.com/openclaw/openclaw/issues/51354)

## Verwandt

<CardGroup cols={2}>
  <Card title="Kopplung" icon="link" href="/de/channels/pairing">
    Einen Slack-Benutzer mit dem Gateway koppeln.
  </Card>
  <Card title="Gruppen" icon="users" href="/de/channels/groups">
    Verhalten von Channels und Gruppen-DMs.
  </Card>
  <Card title="Channel-Routing" icon="route" href="/de/channels/channel-routing">
    Eingehende Nachrichten an Agenten weiterleiten.
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
