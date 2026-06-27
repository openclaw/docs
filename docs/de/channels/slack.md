---
read_when:
    - Slack einrichten oder Slack-Socket-, HTTP- oder Relay-Modus debuggen
summary: Slack-Einrichtung und Laufzeitverhalten (Socket Mode, HTTP Request URLs und Relay-Modus)
title: Slack
x-i18n:
    generated_at: "2026-06-27T17:12:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 95acddb569b1ddc184609f0918336a7465d409351a0406f48fd5dd92a79ca9d6
    source_path: channels/slack.md
    workflow: 16
---

Produktionsreif für DMs und Kanäle über Slack-App-Integrationen. Der Standardmodus ist Socket Mode; HTTP Request URLs werden ebenfalls unterstützt. Der Relay-Modus ist für verwaltete Bereitstellungen vorgesehen, bei denen ein vertrauenswürdiger Router den Slack-Eingang besitzt.

<CardGroup cols={3}>
  <Card title="Pairing" icon="link" href="/de/channels/pairing">
    Slack-DMs verwenden standardmäßig den Kopplungsmodus.
  </Card>
  <Card title="Slash commands" icon="terminal" href="/de/tools/slash-commands">
    Natives Befehlsverhalten und Befehlskatalog.
  </Card>
  <Card title="Channel troubleshooting" icon="wrench" href="/de/channels/troubleshooting">
    Kanalübergreifende Diagnose- und Reparatur-Playbooks.
  </Card>
</CardGroup>

## Socket Mode oder HTTP Request URLs auswählen

Beide Transporte sind produktionsreif und erreichen Funktionsparität für Messaging, Slash-Befehle, App Home und Interaktivität. Wählen Sie nach Bereitstellungsform, nicht nach Funktionen.

| Aspekt                       | Socket Mode (Standard)                                                                                                                               | HTTP Request URLs                                                                                              |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Öffentliche Gateway-URL      | Nicht erforderlich                                                                                                                                    | Erforderlich (DNS, TLS, Reverse-Proxy oder Tunnel)                                                             |
| Ausgehendes Netzwerk         | Ausgehendes WSS zu `wss-primary.slack.com` muss erreichbar sein                                                                                       | Kein ausgehendes WS; nur eingehendes HTTPS                                                                     |
| Benötigte Token              | Bot-Token + App-Level Token mit `connections:write`                                                                                                   | Bot-Token + Signing Secret                                                                                     |
| Entwickler-Laptop / hinter Firewall | Funktioniert unverändert                                                                                                                       | Benötigt einen öffentlichen Tunnel (ngrok, Cloudflare Tunnel, Tailscale Funnel) oder ein Staging-Gateway       |
| Horizontale Skalierung       | Eine Socket-Mode-Sitzung pro App und Host; mehrere Gateways benötigen separate Slack-Apps                                                             | Zustandsloser POST-Handler; mehrere Gateway-Replikate können eine App hinter einem Load Balancer teilen        |
| Mehrere Konten auf einem Gateway | Unterstützt; jedes Konto öffnet eigenes WS                                                                                                      | Unterstützt; jedes Konto benötigt einen eindeutigen `webhookPath` (Standard `/slack/events`), damit Registrierungen nicht kollidieren |
| Transport für Slash-Befehl   | Wird über die WS-Verbindung zugestellt; `slash_commands[].url` wird ignoriert                                                                         | Slack sendet POSTs an `slash_commands[].url`; das Feld ist erforderlich, damit der Befehl ausgelöst wird       |
| Request-Signierung           | Nicht verwendet (Authentifizierung ist das App-Level Token)                                                                                           | Slack signiert jede Anfrage; OpenClaw prüft mit `signingSecret`                                                |
| Wiederherstellung nach Verbindungsabbruch | Automatische Wiederverbindung des Slack SDK ist aktiviert; OpenClaw startet fehlgeschlagene Socket-Mode-Sitzungen zusätzlich mit begrenztem Backoff neu. Pong-Timeout-Transportabstimmung gilt. | Keine persistente Verbindung, die abbrechen kann; Wiederholungen erfolgen pro Anfrage durch Slack              |

<Note>
  **Wählen Sie Socket Mode** für Hosts mit einzelnem Gateway, Entwickler-Laptops und On-Prem-Netzwerke, die `*.slack.com` ausgehend erreichen können, aber kein eingehendes HTTPS akzeptieren können.

**Wählen Sie HTTP Request URLs**, wenn Sie mehrere Gateway-Replikate hinter einem Load Balancer ausführen, wenn ausgehendes WSS blockiert ist, eingehendes HTTPS aber erlaubt ist, oder wenn Sie Slack-Webhooks bereits an einem Reverse-Proxy terminieren.
</Note>

### Relay-Modus

Der Relay-Modus trennt den Slack-Eingang vom OpenClaw-Gateway. Ein vertrauenswürdiger Router besitzt die
einzelne Slack-Socket-Mode-Verbindung, wählt ein Ziel-Gateway aus und leitet ein typisiertes
Ereignis über einen authentifizierten Websocket weiter. Das Gateway verwendet weiterhin sein Bot-Token für
ausgehende Slack-Web-API-Aufrufe.

```json5
{
  channels: {
    slack: {
      mode: "relay",
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      relay: {
        url: "wss://router.example.com/gateway/ws",
        authToken: { source: "env", provider: "default", id: "SLACK_RELAY_AUTH_TOKEN" },
        gatewayId: "team-gateway",
      },
    },
  },
}
```

Die Relay-URL muss `wss://` verwenden, außer sie zielt auf localhost. Behandeln Sie das Bearer-Token und
die Routing-Tabelle des Routers als Teil der Slack-Autorisierungsgrenze: Weitergeleitete Ereignisse gelangen als autorisierte Aktivierungen in den
normalen Slack-Nachrichtenhandler. Eine vom Router bereitgestellte `slack_identity`
im Websocket-`hello`-Frame kann den standardmäßigen ausgehenden Benutzernamen und das Symbol festlegen; eine explizit
vom Aufrufer bereitgestellte Identität hat weiterhin Vorrang. Die Relay-Verbindung stellt die Verbindung mit demselben
begrenzten Backoff-Timing wieder her, das von Socket Mode verwendet wird, und löscht die vom Router bereitgestellte Identität immer dann,
wenn die Verbindung getrennt wird.

## Installation

Installieren Sie Slack, bevor Sie den Kanal konfigurieren:

```bash
openclaw plugins install @openclaw/slack
```

`plugins install` registriert und aktiviert das Plugin. Das Plugin tut dennoch nichts, bis Sie die Slack-App und die Kanaleinstellungen unten konfigurieren. Allgemeines Plugin-Verhalten und Installationsregeln finden Sie unter [Plugins](/de/tools/plugin).

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
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
        "assistant_thread_context_changed",
        "assistant_thread_started",
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
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
        "assistant_thread_context_changed",
        "assistant_thread_started",
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
          **Recommended** entspricht dem vollen Funktionsumfang des Slack-Plugins: App Home, Slash-Befehle, Dateien, Reaktionen, Pins, Gruppen-DMs und Emoji-/Benutzergruppen-Lesezugriffe. Wählen Sie **Minimal**, wenn Workspace-Richtlinien Scopes einschränken — es deckt DMs, Kanal-/Gruppenverlauf, Erwähnungen und Slash-Befehle ab, lässt aber Dateien, Reaktionen, Pins, Gruppen-DM (`mpim:*`), `emoji:read` und `usergroups:read` weg. Die Begründung pro Scope und additive Optionen wie zusätzliche Slash-Befehle finden Sie in der [Manifest- und Scope-Checkliste](#manifest-and-scope-checklist).
        </Note>

        Nachdem Slack die App erstellt hat:

        - **Basic Information -> App-Level Tokens -> Generate Token and Scopes**: Fügen Sie `connections:write` hinzu, speichern Sie und kopieren Sie das App-Level Token.
        - **Install App -> Install to Workspace**: Kopieren Sie das Bot User OAuth Token.

      </Step>

      <Step title="Configure OpenClaw">

        Empfohlene SecretRef-Einrichtung:

```bash
export SLACK_APP_TOKEN=slack-app-token-example
export SLACK_BOT_TOKEN=slack-bot-token-example
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
SLACK_APP_TOKEN=slack-app-token-example
SLACK_BOT_TOKEN=slack-bot-token-example
```

      </Step>

      <Step title="Start gateway">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP-Anfrage-URLs">
    <Steps>
      <Step title="Neue Slack-App erstellen">
        Öffnen Sie [api.slack.com/apps](https://api.slack.com/apps/new) → **Neue App erstellen** → **Aus einem Manifest** → wählen Sie Ihren Workspace aus → fügen Sie eines der unten stehenden Manifeste ein → ersetzen Sie `https://gateway-host.example.com/slack/events` durch Ihre öffentliche Gateway-URL → **Weiter** → **Erstellen**.

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
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
        "assistant_thread_context_changed",
        "assistant_thread_started",
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
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
        "assistant_thread_context_changed",
        "assistant_thread_started",
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
          **Empfohlen** entspricht dem vollständigen Funktionsumfang des Slack-Plugins; **Minimal** lässt Dateien, Reaktionen, Pins, Gruppen-DMs (`mpim:*`), `emoji:read` und `usergroups:read` für restriktive Workspaces weg. Siehe [Manifest- und Scope-Checkliste](#manifest-and-scope-checklist) für die Begründung pro Scope.
        </Note>

        <Info>
          Die drei URL-Felder (`slash_commands[].url`, `event_subscriptions.request_url` und `interactivity.request_url` / `message_menu_options_url`) zeigen alle auf denselben OpenClaw-Endpunkt. Das Manifest-Schema von Slack verlangt separate Namen, aber OpenClaw routet nach Payload-Typ, sodass ein einzelner `webhookPath` (Standard `/slack/events`) ausreicht. Slash-Befehle ohne `slash_commands[].url` führen im HTTP-Modus stillschweigend keine Aktion aus.
        </Info>

        Nachdem Slack die App erstellt hat:

        - **Grundinformationen → App-Anmeldedaten**: Kopieren Sie das **Signing Secret** zur Anfrageverifizierung.
        - **App installieren -> In Workspace installieren**: Kopieren Sie das Bot User OAuth Token.

      </Step>

      <Step title="OpenClaw konfigurieren">

        Empfohlene SecretRef-Einrichtung:

```bash
export SLACK_BOT_TOKEN=slack-bot-token-example
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

OpenClaw setzt das Pong-Timeout des Slack-SDK-Clients im Socket Mode standardmäßig auf 15 Sekunden. Überschreiben Sie die Transporteinstellungen nur, wenn Sie Workspace- oder host-spezifische Abstimmung benötigen:

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

Verwenden Sie dies nur für Socket-Mode-Workspaces, die Slack-WebSocket-Pong-/Server-Ping-Timeouts protokollieren oder auf Hosts mit bekannter Event-Loop-Überlastung laufen. `clientPingTimeout` ist die Wartezeit auf Pong, nachdem das SDK einen Client-Ping sendet; `serverPingTimeout` ist die Wartezeit auf Slack-Server-Pings. App-Nachrichten und Events bleiben Anwendungszustand, keine Liveness-Signale des Transports.

Hinweise:

- `socketMode` wird im HTTP Request URL-Modus ignoriert.
- Basis-Einstellungen unter `channels.slack.socketMode` gelten für alle Slack-Konten, sofern sie nicht überschrieben werden. Kontospezifische Überschreibungen verwenden `channels.slack.accounts.<accountId>.socketMode`; da dies eine Objektüberschreibung ist, müssen Sie jedes Socket-Abstimmungsfeld angeben, das Sie für dieses Konto verwenden möchten.
- Nur `clientPingTimeout` hat einen OpenClaw-Standardwert (`15000`). `serverPingTimeout` und `pingPongLoggingEnabled` werden nur bei Konfiguration an das Slack-SDK übergeben.
- Der Neustart-Backoff für Socket Mode beginnt bei etwa 2 Sekunden und ist bei etwa 30 Sekunden gedeckelt. Wiederherstellbare Start-, Start-Warte- und Verbindungsabbruchfehler werden erneut versucht, bis der Channel stoppt. Permanente Konto- und Anmeldedatenfehler wie ungültige Authentifizierung, widerrufene Tokens oder fehlende Scopes schlagen schnell fehl, statt unbegrenzt wiederholt zu werden.

## Manifest- und Scope-Checkliste

Das Basismanifest der Slack-App ist für Socket Mode und HTTP-Anfrage-URLs identisch. Nur der Block `settings` (und die Slash-Befehl-`url`) unterscheidet sich.

Basismanifest (Socket-Mode-Standard):

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
    "assistant_view": {
      "assistant_description": "OpenClaw connects Slack assistant threads to OpenClaw agents.",
      "suggested_prompts": [
        { "title": "What can you do?", "message": "What can you help me with?" },
        {
          "title": "Summarize this channel",
          "message": "Summarize the recent activity in this channel."
        },
        { "title": "Draft a reply", "message": "Help me draft a reply." }
      ]
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
        "assistant_thread_context_changed",
        "assistant_thread_started",
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
        "app_home_opened",
        "app_mention",
        "assistant_thread_context_changed",
        "assistant_thread_started",
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

Zeigen Sie andere Funktionen an, die die oben genannten Standardwerte erweitern.

Das Standardmanifest aktiviert den Slack App Home-Tab **Home** und abonniert `app_home_opened`. Wenn ein Workspace-Mitglied den Home-Tab öffnet, veröffentlicht OpenClaw mit `views.publish` eine sichere Standard-Home-Ansicht; es werden keine Konversations-Payloads oder privaten Konfigurationen einbezogen. Der Tab **Messages** bleibt für Slack-DMs aktiviert. Das Manifest aktiviert außerdem Slack-Assistant-Threads mit `features.assistant_view`, `assistant:write`, `assistant_thread_started` und `assistant_thread_context_changed`; Assistant-Threads werden an eigene OpenClaw-Thread-Sessions weitergeleitet und halten den von Slack bereitgestellten Thread-Kontext für den Agent verfügbar.

<AccordionGroup>
  <Accordion title="Optional native slash commands">

    Mehrere [native Slash-Befehle](#commands-and-slash-behavior) können mit entsprechenden Nuancen anstelle eines einzelnen konfigurierten Befehls verwendet werden:

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
      "command": "/approve",
      "description": "Approve or deny pending approval requests",
      "usage_hint": "<id> <decision>"
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

        Wiederholen Sie diesen `url`-Wert für jeden Befehl in der Liste.

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="Optional authorship scopes (write operations)">
    Fügen Sie den Bot-Scope `chat:write.customize` hinzu, wenn ausgehende Nachrichten die aktive Agent-Identität (benutzerdefinierter Benutzername und Icon) statt der standardmäßigen Slack-App-Identität verwenden sollen.

    Wenn Sie ein Emoji-Icon verwenden, erwartet Slack die Syntax `:emoji_name:`.

  </Accordion>
  <Accordion title="Optional user-token scopes (read operations)">
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
- Der HTTP-Modus erfordert `botToken` + `signingSecret`.
- Der Relay-Modus erfordert `botToken` sowie `relay.url`, `relay.authToken` und `relay.gatewayId`; er verwendet kein App-Token und kein Signing Secret.
- `botToken`, `appToken`, `signingSecret`, `relay.authToken` und `userToken` akzeptieren Klartext-
  Zeichenfolgen oder SecretRef-Objekte.
- Konfigurations-Token überschreiben Env-Fallbacks.
- Der Env-Fallback `SLACK_BOT_TOKEN` / `SLACK_APP_TOKEN` gilt nur für das Standardkonto.
- `userToken` ist ausschließlich konfigurationsbasiert (kein Env-Fallback) und ist standardmäßig auf schreibgeschütztes Verhalten eingestellt (`userTokenReadOnly: true`).

Verhalten von Status-Snapshots:

- Die Slack-Kontoinspektion verfolgt pro Zugangsdaten die Felder `*Source` und `*Status`
  (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Der Status ist `available`, `configured_unavailable` oder `missing`.
- `configured_unavailable` bedeutet, dass das Konto über SecretRef
  oder eine andere nicht inline angegebene Secret-Quelle konfiguriert ist, der aktuelle Befehls-/Runtime-Pfad
  den tatsächlichen Wert jedoch nicht auflösen konnte.
- Im HTTP-Modus ist `signingSecretStatus` enthalten; in Socket Mode ist das
  erforderliche Paar `botTokenStatus` + `appTokenStatus`.

<Tip>
Für Aktionen/Verzeichnislesevorgänge kann ein Benutzer-Token bevorzugt werden, wenn es konfiguriert ist. Für Schreibvorgänge bleibt das Bot-Token bevorzugt; Schreibvorgänge mit Benutzer-Token sind nur zulässig, wenn `userTokenReadOnly: false` gesetzt ist und kein Bot-Token verfügbar ist.
</Tip>

## Aktionen und Gates

Slack-Aktionen werden über `channels.slack.actions.*` gesteuert.

Verfügbare Aktionsgruppen im aktuellen Slack-Tooling:

| Gruppe     | Standard |
| ---------- | -------- |
| messages   | enabled |
| reactions  | enabled |
| pins       | enabled |
| memberInfo | enabled |
| emojiList  | enabled |

Aktuelle Slack-Nachrichtenaktionen umfassen `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` und `emoji-list`. `download-file` akzeptiert Slack-Datei-IDs, die in Platzhaltern für eingehende Dateien angezeigt werden, und gibt für Bilder Bildvorschauen oder für andere Dateitypen lokale Dateimetadaten zurück.

## Zugriffssteuerung und Routing

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

    Die Legacy-Werte `channels.slack.dm.policy` und `channels.slack.dm.allowFrom` werden aus Kompatibilitätsgründen weiterhin gelesen. `openclaw doctor --fix` migriert sie zu `dmPolicy` und `allowFrom`, wenn dies ohne Änderung des Zugriffs möglich ist.

    Pairing in DMs verwendet `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Channel policy">
    `channels.slack.groupPolicy` steuert die Kanalverarbeitung:

    - `open`
    - `allowlist`
    - `disabled`

    Die Kanal-Allowlist befindet sich unter `channels.slack.channels` und **muss stabile Slack-Kanal-IDs** (zum Beispiel `C12345678`) als Konfigurationsschlüssel verwenden.

    Laufzeithinweis: Wenn `channels.slack` vollständig fehlt (reine Env-Einrichtung), fällt die Laufzeit auf `groupPolicy="allowlist"` zurück und protokolliert eine Warnung (auch wenn `channels.defaults.groupPolicy` gesetzt ist).

    Namens-/ID-Auflösung:

    - Kanal-Allowlist-Einträge und DM-Allowlist-Einträge werden beim Start aufgelöst, wenn der Token-Zugriff dies erlaubt
    - nicht aufgelöste Kanalnamens-Einträge bleiben wie konfiguriert erhalten, werden standardmäßig aber beim Routing ignoriert
    - eingehende Autorisierung und Kanal-Routing sind standardmäßig ID-first; direkter Abgleich von Benutzernamen/Slugs erfordert `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Namensbasierte Schlüssel (`#channel-name` oder `channel-name`) stimmen unter `groupPolicy: "allowlist"` **nicht** überein. Die Kanalsuche ist standardmäßig ID-first, daher wird ein namensbasierter Schlüssel nie erfolgreich geroutet, und alle Nachrichten in diesem Kanal werden stillschweigend blockiert. Das unterscheidet sich von `groupPolicy: "open"`, wo der Kanalschlüssel für das Routing nicht erforderlich ist und ein namensbasierter Schlüssel scheinbar funktioniert.

    Verwenden Sie immer die Slack-Kanal-ID als Schlüssel. So finden Sie sie: Rechtsklick auf den Kanal in Slack → **Copy link** — die ID (`C...`) steht am Ende der URL.

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
    Kanalnachrichten sind standardmäßig durch Erwähnungen geschützt.

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
    - Schlüsselformat für `toolsBySender`: `channel:`, `id:`, `e164:`, `username:`, `name:` oder `"*"`-Wildcard
      (Legacy-Schlüssel ohne Präfix werden weiterhin nur `id:` zugeordnet)

    `allowBots` ist für Kanäle und private Kanäle konservativ: Von Bots verfasste Raumnachrichten werden nur akzeptiert, wenn der sendende Bot ausdrücklich in der `users`-Allowlist dieses Raums aufgeführt ist oder wenn mindestens eine explizite Slack-Owner-ID aus `channels.slack.allowFrom` derzeit Mitglied des Raums ist. Wildcards und Owner-Einträge mit Anzeigenamen erfüllen die Owner-Präsenz nicht. Die Owner-Präsenz verwendet Slack `conversations.members`; stellen Sie sicher, dass die App den passenden Lesebereich für den Raumtyp hat (`channels:read` für öffentliche Kanäle, `groups:read` für private Kanäle). Wenn die Mitgliedersuche fehlschlägt, verwirft OpenClaw die vom Bot verfasste Raumnachricht.

    Akzeptierte, von Bots verfasste Slack-Nachrichten verwenden den gemeinsamen [Bot-Loop-Schutz](/de/channels/bot-loop-protection). Konfigurieren Sie `channels.defaults.botLoopProtection` für das Standardbudget und überschreiben Sie es dann mit `channels.slack.botLoopProtection` oder `channels.slack.channels.<id>.botLoopProtection`, wenn ein Workspace oder Kanal ein anderes Limit benötigt.

  </Tab>
</Tabs>

## Threading, Sitzungen und Antwort-Tags

- DMs werden als `direct` geroutet; Kanäle als `channel`; MPIMs als `group`.
- Slack-Routenbindungen akzeptieren rohe Peer-IDs sowie Slack-Zielformen wie `channel:C12345678`, `user:U12345678` und `<@U12345678>`.
- Mit dem Standard `session.dmScope=main` werden Slack-DMs auf die Hauptsitzung des Agenten reduziert.
- Kanalsitzungen: `agent:<agentId>:slack:channel:<channelId>`.
- Gewöhnliche Top-Level-Kanalnachrichten bleiben in der Sitzung pro Kanal, selbst wenn `replyToMode` nicht `off` ist.
- Slack-Thread-Antworten verwenden das übergeordnete Slack-`thread_ts` für Sitzungssuffixe (`:thread:<threadTs>`), selbst wenn ausgehendes Antwort-Threading mit `replyToMode="off"` deaktiviert ist.
- OpenClaw setzt einen geeigneten Top-Level-Kanal-Root in `agent:<agentId>:slack:channel:<channelId>:thread:<rootTs>` ein, wenn dieser Root voraussichtlich einen sichtbaren Slack-Thread startet, sodass der Root und spätere Thread-Antworten dieselbe OpenClaw-Sitzung teilen. Dies gilt für `app_mention`-Ereignisse, explizite Bot- oder konfigurierte Erwähnungsmuster-Treffer und Kanäle mit `requireMention: false` und nicht-`off` `replyToMode`.
- Der Standard für `channels.slack.thread.historyScope` ist `thread`; der Standard für `thread.inheritParent` ist `false`.
- `channels.slack.thread.initialHistoryLimit` steuert, wie viele vorhandene Thread-Nachrichten abgerufen werden, wenn eine neue Thread-Sitzung startet (Standard `20`; auf `0` setzen, um dies zu deaktivieren).
- `channels.slack.thread.requireExplicitMention` (Standard `false`): Wenn `true`, werden implizite Thread-Erwähnungen unterdrückt, sodass der Bot nur auf explizite `@bot`-Erwähnungen innerhalb von Threads reagiert, selbst wenn der Bot bereits am Thread beteiligt war. Ohne dies umgehen Antworten in einem Thread mit Bot-Beteiligung das `requireMention`-Gating.

Steuerung des Antwort-Threadings:

- `channels.slack.replyToMode`: `off|first|all|batched` (Standard `off`)
- `channels.slack.replyToModeByChatType`: pro `direct|group|channel`
- Legacy-Fallback für direkte Chats: `channels.slack.dm.replyToMode`

Manuelle Antwort-Tags werden unterstützt:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Für explizite Slack-Thread-Antworten aus dem `message`-Tool setzen Sie `replyBroadcast: true` mit `action: "send"` und `threadId` oder `replyTo`, um Slack aufzufordern, die Thread-Antwort auch im übergeordneten Kanal zu veröffentlichen. Dies wird auf Slacks `chat.postMessage`-Flag `reply_broadcast` abgebildet und wird nur für Text- oder Block-Kit-Sendungen unterstützt, nicht für Medien-Uploads.

Wenn ein `message`-Tool-Aufruf innerhalb eines Slack-Threads läuft und denselben Kanal adressiert, übernimmt OpenClaw normalerweise den aktuellen Slack-Thread gemäß `replyToMode`. Setzen Sie `topLevel: true` bei `action: "send"` oder `action: "upload-file"`, um stattdessen eine neue Nachricht im übergeordneten Kanal zu erzwingen. `threadId: null` wird als dieselbe Top-Level-Abwahl akzeptiert.

<Note>
`replyToMode="off"` deaktiviert ausgehendes Slack-Antwort-Threading, einschließlich expliziter `[[reply_to_*]]`-Tags. Es flacht eingehende Slack-Thread-Sitzungen nicht ab: Nachrichten, die bereits innerhalb eines Slack-Threads gepostet wurden, werden weiterhin an die `:thread:<threadTs>`-Sitzung geroutet. Dies unterscheidet sich von Telegram, wo explizite Tags im Modus `"off"` weiterhin beachtet werden. Slack-Threads verbergen Nachrichten im Kanal, während Telegram-Antworten inline sichtbar bleiben.
</Note>

## Ack-Reaktionen

`ackReaction` sendet ein Bestätigungs-Emoji, während OpenClaw eine eingehende Nachricht verarbeitet. `ackReactionScope` entscheidet, _wann_ dieses Emoji tatsächlich gesendet wird.

### Emoji (`ackReaction`)

Auflösungsreihenfolge:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- Fallback auf Emoji der Agentenidentität (`agents.list[].identity.emoji`, sonst `"eyes"` / 👀)

Hinweise:

- Slack erwartet Shortcodes (zum Beispiel `"eyes"`).
- Verwenden Sie `""`, um die Reaktion für das Slack-Konto oder global zu deaktivieren.

### Scope (`messages.ackReactionScope`)

Der Slack-Provider liest den Scope aus `messages.ackReactionScope` (Standard `"group-mentions"`). Es gibt heute keine Überschreibung auf Slack-Konto- oder Slack-Kanalebene; der Wert gilt global für den Gateway.

Werte:

- `"all"`: in DMs und Gruppen reagieren.
- `"direct"`: nur in DMs reagieren.
- `"group-all"`: auf jede Gruppennachricht reagieren (keine DMs).
- `"group-mentions"` (Standard): in Gruppen reagieren, aber nur wenn der Bot erwähnt wird (oder in Gruppenerwähnungen, die sich dafür entschieden haben). **DMs sind ausgeschlossen.**
- `"off"` / `"none"`: nie reagieren.

<Note>
Der Standard-Scope (`"group-mentions"`) löst in Direktnachrichten keine Ack-Reaktionen aus. Um die konfigurierte `ackReaction` (zum Beispiel `"eyes"`) bei eingehenden Slack-DMs zu sehen, setzen Sie `messages.ackReactionScope` auf `"direct"` oder `"all"`. `messages.ackReactionScope` wird beim Start des Slack-Providers gelesen, daher ist ein Gateway-Neustart erforderlich, damit die Änderung wirksam wird.
</Note>

```json5
{
  messages: {
    ackReaction: "eyes",
    ackReactionScope: "all", // react in DMs and groups
  },
}
```

## Text-Streaming

`channels.slack.streaming` steuert das Live-Vorschauverhalten:

- `off`: Live-Vorschau-Streaming deaktivieren.
- `partial` (Standard): Vorschautext durch die neueste Teilausgabe ersetzen.
- `block`: gestückelte Vorschau-Updates anhängen.
- `progress`: Fortschrittsstatus-Text während der Generierung anzeigen und anschließend finalen Text senden.
- `streaming.preview.toolProgress`: Wenn die Entwurfsvorschau aktiv ist, Tool-/Fortschrittsupdates in dieselbe bearbeitete Vorschaunachricht routen (Standard: `true`). Auf `false` setzen, um separate Tool-/Fortschrittsnachrichten beizubehalten.
- `streaming.preview.commandText` / `streaming.progress.commandText`: auf `status` setzen, um kompakte Tool-Fortschrittszeilen beizubehalten und rohen Befehls-/Ausführungstext auszublenden (Standard: `raw`).

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

`channels.slack.streaming.nativeTransport` steuert Slack-natives Text-Streaming, wenn `channels.slack.streaming.mode` `partial` ist (Standard: `true`).

Slack-native Fortschritts-Aufgabenkarten sind für den Fortschrittsmodus opt-in. Setzen Sie `channels.slack.streaming.progress.nativeTaskCards` auf `true` mit `channels.slack.streaming.mode="progress"`, um eine Slack-native Plan-/Aufgabenkarte zu senden, während die Arbeit läuft, und dieselbe Aufgabenkarte bei Abschluss zu aktualisieren. Ohne dieses Flag behält der Fortschrittsmodus das portable Entwurfsvorschauverhalten bei.

- Für natives Text-Streaming und die Anzeige des Slack-Assistenten-Threadstatus muss ein Antwort-Thread verfügbar sein. Die Thread-Auswahl folgt weiterhin `replyToMode`.
- Kanal-, Gruppenchat- und Top-Level-DM-Roots können weiterhin die normale Entwurfsvorschau verwenden, wenn natives Streaming nicht verfügbar ist oder kein Antwort-Thread existiert.
- Top-Level-Slack-DMs bleiben standardmäßig außerhalb von Threads, daher zeigen sie Slacks threadartige native Stream-/Statusvorschau nicht an; OpenClaw postet und bearbeitet stattdessen eine Entwurfsvorschau in der DM.
- Medien und Nicht-Text-Payloads fallen auf normale Zustellung zurück.
- Medien-/Fehler-Endausgaben brechen ausstehende Vorschau-Bearbeitungen ab; geeignete Text-/Block-Endausgaben werden nur geflusht, wenn sie die Vorschau an Ort und Stelle bearbeiten können.
- Wenn Streaming mitten in einer Antwort fehlschlägt, fällt OpenClaw für verbleibende Payloads auf normale Zustellung zurück.

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

Slack-native Fortschritts-Aufgabenkarten aktivieren:

```json5
{
  channels: {
    slack: {
      streaming: {
        mode: "progress",
        progress: {
          nativeTaskCards: true,
          render: "rich",
        },
      },
    },
  },
}
```

Legacy-Schlüssel:

- `channels.slack.streamMode` (`replace | status_final | append`) ist ein Legacy-Runtime-Alias für `channels.slack.streaming.mode`.
- Boolesches `channels.slack.streaming` ist ein Legacy-Runtime-Alias für `channels.slack.streaming.mode` und `channels.slack.streaming.nativeTransport`.
- Legacy-`channels.slack.nativeStreaming` ist ein Runtime-Alias für `channels.slack.streaming.nativeTransport`.
- Führen Sie `openclaw doctor --fix` aus, um persistierte Slack-Streaming-Konfiguration in die kanonischen Schlüssel umzuschreiben.

## Fallback für Tippreaktion

`typingReaction` fügt der eingehenden Slack-Nachricht eine temporäre Reaktion hinzu, während OpenClaw eine Antwort verarbeitet, und entfernt sie, wenn der Lauf abgeschlossen ist. Dies ist am nützlichsten außerhalb von Thread-Antworten, die einen standardmäßigen Statusindikator „is typing...“ verwenden.

Auflösungsreihenfolge:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Hinweise:

- Slack erwartet Shortcodes (zum Beispiel `"hourglass_flowing_sand"`).
- Die Reaktion erfolgt nach bestem Bemühen, und die Bereinigung wird nach Abschluss des Antwort- oder Fehlerpfads automatisch versucht.

## Medien, Chunking und Zustellung

<AccordionGroup>
  <Accordion title="Inbound attachments">
    Slack-Dateianhänge werden von Slack-gehosteten privaten URLs heruntergeladen (tokenauthentifizierter Anfragefluss) und bei erfolgreichem Abruf sowie zulässigen Größenlimits in den Medienspeicher geschrieben. Dateiplatzhalter enthalten die Slack-`fileId`, damit Agenten die Originaldatei mit `download-file` abrufen können.

    Downloads verwenden begrenzte Idle- und Gesamt-Timeouts. Wenn der Abruf einer Slack-Datei hängen bleibt oder fehlschlägt, verarbeitet OpenClaw die Nachricht weiter und fällt auf den Dateiplatzhalter zurück.

    Die Laufzeit-Obergrenze für eingehende Größen ist standardmäßig `20MB`, sofern sie nicht durch `channels.slack.mediaMaxMb` überschrieben wird.

  </Accordion>

  <Accordion title="Outbound text and files">
    - Text-Chunks verwenden `channels.slack.textChunkLimit` (Standard 4000)
    - `channels.slack.chunkMode="newline"` aktiviert absatzorientierte Aufteilung
    - Dateisendungen verwenden Slack-Upload-APIs und können Thread-Antworten enthalten (`thread_ts`)
    - Die Obergrenze für ausgehende Medien folgt `channels.slack.mediaMaxMb`, wenn konfiguriert; andernfalls verwenden Kanalsendungen MIME-Art-Standards aus der Medienpipeline

  </Accordion>

  <Accordion title="Delivery targets">
    Bevorzugte explizite Ziele:

    - `user:<id>` für DMs
    - `channel:<id>` für Kanäle

    Nur-Text-/Nur-Block-Slack-DMs können direkt an Benutzer-IDs posten; Datei-Uploads und Thread-Sendungen öffnen die DM zuerst über Slack-Konversations-APIs, da diese Pfade eine konkrete Konversations-ID benötigen.

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

Native Befehle erfordern [zusätzliche Manifest-Einstellungen](#additional-manifest-settings) in Ihrer Slack-App und werden stattdessen mit `channels.slack.commands.native: true` oder `commands.native: true` in globalen Konfigurationen aktiviert.

- Der automatische Modus für native Befehle ist für Slack **aus**, sodass `commands.native: "auto"` Slack-native Befehle nicht aktiviert.

```txt
/help
```

Native Argumentmenüs verwenden eine adaptive Rendering-Strategie, die vor dem Dispatch eines ausgewählten Optionswerts ein Bestätigungsmodal anzeigt:

- bis zu 5 Optionen: Button-Blöcke
- 6-100 Optionen: statisches Auswahlmenü
- mehr als 100 Optionen: externe Auswahl mit asynchroner Optionsfilterung, wenn Interaktivitäts-Optionshandler verfügbar sind
- überschrittene Slack-Limits: codierte Optionswerte fallen auf Buttons zurück

```txt
/think
```

Slash-Sitzungen verwenden isolierte Schlüssel wie `agent:<agentId>:slack:slash:<userId>` und leiten Befehlsausführungen weiterhin mit `CommandTargetSessionKey` an die Ziel-Konversationssitzung weiter.

## Interaktive Antworten

Slack kann von Agenten erstellte interaktive Antwortsteuerelemente darstellen, aber diese Funktion ist standardmäßig deaktiviert.
Für neue Agenten-, CLI- und Plugin-Ausgaben sollten Sie die gemeinsamen
`presentation`-Buttons oder Auswahlblöcke bevorzugen. Sie verwenden denselben Slack-Interaktionspfad
und werden zugleich auf anderen Kanälen herabgestuft.

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

Wenn aktiviert, können Agenten weiterhin veraltete, nur für Slack geltende Antwortdirektiven ausgeben:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Diese Direktiven werden in Slack Block Kit kompiliert und leiten Klicks oder Auswahlen
über den bestehenden Slack-Interaktionsereignispfad zurück. Behalten Sie sie für alte
Prompts und Slack-spezifische Ausweichmöglichkeiten bei; verwenden Sie gemeinsame Präsentation für neue
portable Steuerelemente.

Die Direktiven-Compiler-APIs sind für neuen Producer-Code ebenfalls veraltet:

- `compileSlackInteractiveReplies(...)`
- `parseSlackOptionsLine(...)`
- `isSlackInteractiveRepliesEnabled(...)`
- `buildSlackInteractiveBlocks(...)`

Verwenden Sie `presentation`-Payloads und `buildSlackPresentationBlocks(...)` für neue
in Slack gerenderte Steuerelemente.

Hinweise:

- Dies ist eine Slack-spezifische Legacy-UI. Andere Kanäle übersetzen Slack Block
  Kit-Direktiven nicht in ihre eigenen Button-Systeme.
- Die interaktiven Callback-Werte sind von OpenClaw erzeugte undurchsichtige Tokens, keine rohen, vom Agenten erstellten Werte.
- Wenn generierte interaktive Blöcke die Slack Block Kit-Grenzwerte überschreiten würden, fällt OpenClaw auf die ursprüngliche Textantwort zurück, statt eine ungültige Blocks-Payload zu senden.

### Plugin-eigene Modal-Übermittlungen

Slack-Plugins, die einen interaktiven Handler registrieren, können auch Modal-
`view_submission`- und `view_closed`-Lebenszyklusereignisse empfangen, bevor OpenClaw
die Payload für das agentensichtbare Systemereignis komprimiert. Verwenden Sie eines dieser Routing-
Muster, wenn Sie ein Slack-Modal öffnen:

- Setzen Sie `callback_id` auf `openclaw:<namespace>:<payload>`.
- Oder behalten Sie eine bestehende `callback_id` bei und legen Sie `pluginInteractiveData:
"<namespace>:<payload>"` in `private_metadata` des Modals ab.

Der Handler erhält `ctx.interaction.kind` als `view_submission` oder
`view_closed`, normalisierte `inputs` und das vollständige rohe `stateValues`-Objekt von
Slack. Routing nur über die Callback-ID reicht aus, um den Plugin-Handler aufzurufen; fügen Sie
die bestehenden `private_metadata`-Benutzer-/Sitzungs-Routingfelder des Modals ein, wenn das
Modal auch ein agentensichtbares Systemereignis erzeugen soll. Der Agent erhält ein
kompaktes, redigiertes Systemereignis `Slack interaction: ...`. Wenn der Handler
`systemEvent.summary`, `systemEvent.reference` oder `systemEvent.data` zurückgibt, werden diese
Felder in dieses kompakte Ereignis aufgenommen, damit der Agent auf
Plugin-eigenen Speicher verweisen kann, ohne die vollständige Formular-Payload zu sehen.

## Native Genehmigungen in Slack

Slack kann als nativer Genehmigungsclient mit interaktiven Buttons und Interaktionen dienen, statt auf die Web-UI oder das Terminal zurückzufallen.

- Exec- und Plugin-Genehmigungen können als Slack-native Block Kit-Prompts gerendert werden.
- `channels.slack.execApprovals.*` bleibt die Aktivierungs- und DM-/Kanal-Routing-Konfiguration für den nativen Exec-Genehmigungsclient.
- Exec-Genehmigungs-DMs verwenden `channels.slack.execApprovals.approvers` oder `commands.ownerAllowFrom`.
- Plugin-Genehmigungen verwenden Slack-native Buttons, wenn Slack als nativer Genehmigungsclient für die Ursprungssitzung aktiviert ist oder wenn `approvals.plugin` an die ursprüngliche Slack-Sitzung oder ein Slack-Ziel weiterleitet.
- Plugin-Genehmigungs-DMs verwenden Slack-Plugin-Genehmigende aus `channels.slack.allowFrom`, benannte Konto-`allowFrom`-Einträge oder die Standardroute des Kontos.
- Die Autorisierung von Genehmigenden wird weiterhin erzwungen: Nur-Exec-Genehmigende können Plugin-Anfragen nicht genehmigen, es sei denn, sie sind auch Plugin-Genehmigende.

Dies verwendet dieselbe gemeinsame Genehmigungs-Button-Oberfläche wie andere Kanäle. Wenn `interactivity` in Ihren Slack-App-Einstellungen aktiviert ist, werden Genehmigungs-Prompts direkt in der Konversation als Block Kit-Buttons gerendert.
Wenn diese Buttons vorhanden sind, sind sie die primäre Genehmigungs-UX; OpenClaw
sollte nur dann einen manuellen `/approve`-Befehl einschließen, wenn das Tool-Ergebnis besagt, dass Chat-
Genehmigungen nicht verfügbar sind oder manuelle Genehmigung der einzige Weg ist.

Konfigurationspfad:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (optional; fällt nach Möglichkeit auf `commands.ownerAllowFrom` zurück)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, Standard: `dm`)
- `agentFilter`, `sessionFilter`

Slack aktiviert native Exec-Genehmigungen automatisch, wenn `enabled` nicht gesetzt oder `"auto"` ist und mindestens ein
Exec-Genehmigender aufgelöst wird. Slack kann über diesen nativen Client-Pfad auch native Plugin-Genehmigungen verarbeiten,
wenn Slack-Plugin-Genehmigende aufgelöst werden und die Anfrage den nativen Client-Filtern entspricht. Setzen Sie
`enabled: false`, um Slack als nativen Genehmigungsclient explizit zu deaktivieren. Setzen Sie `enabled: true`, um
native Genehmigungen zu erzwingen, wenn Genehmigende aufgelöst werden. Das Deaktivieren von Slack-Exec-Genehmigungen deaktiviert nicht
die native Slack-Plugin-Genehmigungszustellung, die über `approvals.plugin` aktiviert ist; die Plugin-Genehmigungszustellung
verwendet stattdessen Slack-Plugin-Genehmigende.

Standardverhalten ohne explizite Slack-Exec-Genehmigungskonfiguration:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Explizite Slack-native Konfiguration ist nur erforderlich, wenn Sie Genehmigende überschreiben, Filter hinzufügen oder
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

Gemeinsame `approvals.exec`-Weiterleitung ist separat. Verwenden Sie sie nur, wenn Exec-Genehmigungs-Prompts zusätzlich
an andere Chats oder explizite Out-of-Band-Ziele weitergeleitet werden müssen. Gemeinsame `approvals.plugin`-Weiterleitung ist ebenfalls
separat; Slack-native Zustellung unterdrückt diesen Fallback nur, wenn Slack die Plugin-
Genehmigungsanfrage nativ verarbeiten kann.

`/approve` im selben Chat funktioniert auch in Slack-Kanälen und DMs, die bereits Befehle unterstützen. Siehe [Exec-Genehmigungen](/de/tools/exec-approvals) für das vollständige Modell der Genehmigungsweiterleitung.

## Ereignisse und Betriebsverhalten

- Nachrichtenbearbeitungen/-löschungen werden in Systemereignisse abgebildet.
- Thread-Broadcasts (Thread-Antworten mit „Also send to channel“) werden als normale Benutzernachrichten verarbeitet.
- Hinzufügen/Entfernen von Reaktionen wird in Systemereignisse abgebildet.
- Beitritt/Austritt von Mitgliedern, erstellte/umbenannte Kanäle und Hinzufügen/Entfernen von Pins werden in Systemereignisse abgebildet.
- `channel_id_changed` kann Kanal-Konfigurationsschlüssel migrieren, wenn `configWrites` aktiviert ist.
- Kanalthema/-zweck-Metadaten werden als nicht vertrauenswürdiger Kontext behandelt und können in den Routing-Kontext injiziert werden.
- Thread-Starter und anfängliches Seed-Setzen des Thread-Verlaufskontexts werden, sofern anwendbar, nach konfigurierten Sender-Allowlists gefiltert.
- Block-Aktionen, Shortcuts und Modal-Interaktionen geben strukturierte Systemereignisse `Slack interaction: ...` mit umfangreichen Payload-Feldern aus:
  - Block-Aktionen: ausgewählte Werte, Labels, Picker-Werte und `workflow_*`-Metadaten
  - Globale Shortcuts: Callback- und Akteur-Metadaten, an die direkte Sitzung des Akteurs weitergeleitet
  - Nachrichten-Shortcuts: Callback, Akteur, Kanal, Thread und Kontext der ausgewählten Nachricht
  - Modal-`view_submission`- und `view_closed`-Ereignisse mit weitergeleiteten Kanal-Metadaten und Formulareingaben

Definieren Sie globale oder Nachrichten-Shortcuts in Ihrer Slack-App-Konfiguration und verwenden Sie eine beliebige nicht leere Callback-ID. OpenClaw bestätigt passende Shortcut-Payloads, wendet dieselbe DM-/Kanal-Sender-Richtlinie wie bei anderen Slack-Interaktionen an und stellt das bereinigte Ereignis für die weitergeleitete Agentensitzung in die Warteschlange. Trigger-IDs und Antwort-URLs werden aus dem Agentenkontext redigiert.

## Konfigurationsreferenz

Primäre Referenz: [Konfigurationsreferenz - Slack](/de/gateway/config-channels#slack).

<Accordion title="Wichtige Slack-Felder">

- Modus/Auth: `mode`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- DM-Zugriff: `dm.enabled`, `dmPolicy`, `allowFrom` (Legacy: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- Kompatibilitäts-Umschalter: `dangerouslyAllowNameMatching` (Notfalloption; ausgeschaltet lassen, sofern nicht erforderlich)
- Kanalzugriff: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- Threading/Verlauf: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- Zustellung: `textChunkLimit`, `chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- Unfurls: `unfurlLinks` (Standard: `false`), `unfurlMedia` für die Steuerung von Link-/Medienvorschauen in `chat.postMessage`; setzen Sie `unfurlLinks: true`, um Linkvorschauen wieder zu aktivieren
- Betrieb/Funktionen: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Keine Antworten in Kanälen">
    Prüfen Sie der Reihe nach:

    - `groupPolicy`
    - Kanal-Allowlist (`channels.slack.channels`) — **Schlüssel müssen Kanal-IDs sein** (`C12345678`), keine Namen (`#channel-name`). Namensbasierte Schlüssel schlagen unter `groupPolicy: "allowlist"` still fehl, weil Kanal-Routing standardmäßig ID-zuerst erfolgt. So finden Sie eine ID: Rechtsklick auf den Kanal in Slack → **Link kopieren** — der Wert `C...` am Ende der URL ist die Kanal-ID.
    - `requireMention`
    - kanalbezogene `users`-Allowlist
    - `messages.groupChat.visibleReplies`: Normale Gruppen-/Kanal-Anfragen verwenden standardmäßig `"automatic"`. Wenn Sie `"message_tool"` aktiviert haben und Logs Assistententext ohne `message(action=send)`-Aufruf zeigen, hat das Modell den sichtbaren Message-Tool-Pfad verfehlt. Abschlusstext bleibt in diesem Modus privat; prüfen Sie das ausführliche Gateway-Log auf unterdrückte Payload-Metadaten oder setzen Sie den Wert auf `"automatic"`, wenn Sie möchten, dass jede normale abschließende Assistentenantwort über den Legacy-Pfad gepostet wird.
    - `messages.groupChat.unmentionedInbound`: Wenn der Wert `"room_event"` ist, ist nicht erwähnter, erlaubter Kanal-Chat Umgebungskontext und bleibt stumm, sofern der Agent nicht das `message`-Tool aufruft. Siehe [Umgebungs-Raumereignisse](/de/channels/ambient-room-events).

```json5
{
  messages: {
    groupChat: {
      visibleReplies: "automatic",
    },
  },
}
```

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
    - Pairing-Genehmigungen / Allowlist-Einträge (`dmPolicy: "open"` erfordert weiterhin `channels.slack.allowFrom: ["*"]`)
    - Gruppen-DMs verwenden MPIM-Verarbeitung; aktivieren Sie `channels.slack.dm.groupEnabled` und nehmen Sie, falls konfiguriert, die MPIM in `channels.slack.dm.groupChannels` auf
    - Slack Assistant-DM-Ereignisse: Ausführliche Logs mit `drop message_changed`
      bedeuten in der Regel, dass Slack ein bearbeitetes Assistant-Thread-Ereignis ohne
      wiederherstellbaren menschlichen Sender in den Nachrichtenmetadaten gesendet hat

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket Mode verbindet nicht">
    Validieren Sie Bot- und App-Tokens sowie die Aktivierung von Socket Mode in den Slack-App-Einstellungen.
    Das App-Level Token benötigt `connections:write`, und das Bot User OAuth Token
    muss zur gleichen Slack-App bzw. zum gleichen Workspace gehören wie das App-Token.

    Wenn `openclaw channels status --probe --json` `botTokenStatus` oder
    `appTokenStatus: "configured_unavailable"` zeigt, ist das Slack-Konto
    konfiguriert, aber die aktuelle Laufzeit konnte den SecretRef-gestützten
    Wert nicht auflösen.

    Logs wie `slack socket mode failed to start; retry ...` sind behebbare
    Startfehler. Fehlende Scopes, widerrufene Tokens und ungültige Authentifizierung schlagen
    stattdessen schnell fehl. Ein Log `slack token mismatch ...` bedeutet, dass Bot-Token und App-Token
    offenbar zu unterschiedlichen Slack-Apps gehören; korrigieren Sie die Zugangsdaten der Slack-App.

  </Accordion>

  <Accordion title="HTTP-Modus empfängt keine Ereignisse">
    Prüfen Sie:

    - Signing Secret
    - Webhook-Pfad
    - Slack Request URLs (Events + Interactivity + Slash Commands)
    - eindeutiger `webhookPath` pro HTTP-Konto
    - die öffentliche URL terminiert TLS und leitet Anfragen an den Gateway-Pfad weiter
    - der Slack-App-Pfad `request_url` entspricht exakt `channels.slack.webhookPath` (Standard `/slack/events`)

    Wenn `signingSecretStatus: "configured_unavailable"` in Konto-Snapshots
    erscheint, ist das HTTP-Konto konfiguriert, aber die aktuelle Runtime konnte
    das SecretRef-basierte Signing Secret nicht auflösen.

    Ein wiederholtes Log `slack: webhook path ... already registered` bedeutet, dass zwei HTTP-
    Konten denselben `webhookPath` verwenden; geben Sie jedem Konto einen eigenen Pfad.

  </Accordion>

  <Accordion title="Native Befehle/Slash-Befehle werden nicht ausgelöst">
    Prüfen Sie, was Sie beabsichtigt haben:

    - nativer Befehlsmodus (`channels.slack.commands.native: true`) mit passenden in Slack registrierten Slash-Befehlen
    - oder einzelner Slash-Befehlsmodus (`channels.slack.slashCommand.enabled: true`)

    Slack erstellt oder entfernt Slash-Befehle nicht automatisch. `commands.native: "auto"` aktiviert keine nativen Slack-Befehle; verwenden Sie `true` und erstellen Sie die passenden Befehle in der Slack-App. Im HTTP-Modus muss jeder Slack-Slash-Befehl die Gateway-URL enthalten. Im Socket Mode kommen Befehls-Payloads über den WebSocket an, und Slack ignoriert `slash_commands[].url`.

    Prüfen Sie außerdem `commands.useAccessGroups`, DM-Autorisierung, Kanal-Allowlists
    und kanalbezogene `users`-Allowlists. Slack gibt kurzlebige Fehler für
    blockierte Absender von Slash-Befehlen zurück, darunter:

    - `This channel is not allowed.`
    - `You are not authorized to use this command here.`

  </Accordion>
</AccordionGroup>

## Referenz zu Vision für Anhänge

Slack kann heruntergeladene Medien an den Agent-Turn anhängen, wenn Slack-Dateidownloads erfolgreich sind und Größenbeschränkungen es zulassen. Bilddateien können durch den Pfad für Medienverständnis oder direkt an ein antwortendes Modell mit Vision-Fähigkeit übergeben werden; andere Dateien bleiben als herunterladbarer Dateikontext erhalten, statt als Bildeingabe behandelt zu werden.

### Unterstützte Medientypen

| Medientyp                     | Quelle               | Aktuelles Verhalten                                                                  | Hinweise                                                                     |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| JPEG-/PNG-/GIF-/WebP-Bilder | Slack-Datei-URL       | Heruntergeladen und für Vision-fähige Verarbeitung an den Turn angehängt                   | Begrenzung pro Datei: `channels.slack.mediaMaxMb` (Standard 20 MB)                 |
| PDF-Dateien                      | Slack-Datei-URL       | Heruntergeladen und als Dateikontext für Tools wie `download-file` oder `pdf` bereitgestellt | Slack-Inbound konvertiert PDFs nicht automatisch in Bild-Vision-Eingaben |
| Andere Dateien                    | Slack-Datei-URL       | Wenn möglich heruntergeladen und als Dateikontext bereitgestellt                              | Binärdateien werden nicht als Bildeingabe behandelt                               |
| Thread-Antworten                 | Dateien des Thread-Starters | Dateien der Root-Nachricht können als Kontext hydriert werden, wenn die Antwort keine direkten Medien hat  | Starter nur mit Dateien verwenden einen Anhang-Platzhalter                          |
| Nachrichten mit mehreren Bildern           | Mehrere Slack-Dateien | Jede Datei wird unabhängig ausgewertet                                              | Die Slack-Verarbeitung ist auf acht Dateien pro Nachricht begrenzt                     |

### Inbound-Pipeline

Wenn eine Slack-Nachricht mit Dateianhängen eintrifft:

1. OpenClaw lädt die Datei mit dem Bot-Token von der privaten Slack-URL herunter.
2. Die Datei wird bei Erfolg in den Medienspeicher geschrieben.
3. Heruntergeladene Medienpfade und Inhaltstypen werden dem Inbound-Kontext hinzugefügt.
4. Bildfähige Modell-/Tool-Pfade können Bildanhänge aus diesem Kontext verwenden.
5. Nicht-Bilddateien bleiben als Dateimetadaten oder Medienreferenzen für Tools verfügbar, die damit umgehen können.

### Vererbung von Anhängen aus der Thread-Root

Wenn eine Nachricht in einem Thread eintrifft (mit einem `thread_ts`-Parent):

- Wenn die Antwort selbst keine direkten Medien hat und die enthaltene Root-Nachricht Dateien enthält, kann Slack die Root-Dateien als Thread-Starter-Kontext hydrieren.
- Direkte Antwortanhänge haben Vorrang vor Anhängen der Root-Nachricht.
- Eine Root-Nachricht, die nur Dateien und keinen Text enthält, wird mit einem Anhang-Platzhalter dargestellt, damit der Fallback ihre Dateien weiterhin einbeziehen kann.

### Umgang mit mehreren Anhängen

Wenn eine einzelne Slack-Nachricht mehrere Dateianhänge enthält:

- Jeder Anhang wird unabhängig durch die Medien-Pipeline verarbeitet.
- Heruntergeladene Medienreferenzen werden im Nachrichtenkontext zusammengeführt.
- Die Verarbeitungsreihenfolge folgt der Dateireihenfolge von Slack im Ereignis-Payload.
- Ein Fehler beim Download eines Anhangs blockiert die anderen nicht.

### Größen-, Download- und Modelllimits

- **Größenbegrenzung**: Standardmäßig 20 MB pro Datei. Konfigurierbar über `channels.slack.mediaMaxMb`.
- **Downloadfehler**: Dateien, die Slack nicht bereitstellen kann, abgelaufene URLs, unzugängliche Dateien, zu große Dateien und Slack-Auth-/Login-HTML-Antworten werden übersprungen, statt als nicht unterstützte Formate gemeldet zu werden.
- **Vision-Modell**: Die Bildanalyse verwendet das aktive Antwortmodell, wenn es Vision unterstützt, oder das unter `agents.defaults.imageModel` konfigurierte Bildmodell.

### Bekannte Grenzen

| Szenario                               | Aktuelles Verhalten                                                             | Workaround                                                                 |
| -------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Abgelaufene Slack-Datei-URL                 | Datei übersprungen; kein Fehler angezeigt                                                 | Laden Sie die Datei erneut in Slack hoch                                                |
| Vision-Modell nicht konfiguriert            | Bildanhänge werden als Medienreferenzen gespeichert, aber nicht als Bilder analysiert | Konfigurieren Sie `agents.defaults.imageModel` oder verwenden Sie ein antwortendes Modell mit Vision-Fähigkeit |
| Sehr große Bilder (> 20 MB standardmäßig) | Gemäß Größenbegrenzung übersprungen                                                         | Erhöhen Sie `channels.slack.mediaMaxMb`, wenn Slack dies zulässt                       |
| Weitergeleitete/geteilte Anhänge           | Text und von Slack gehostete Bild-/Dateimedien werden nach bestem Aufwand verarbeitet                       | Teilen Sie sie direkt im OpenClaw-Thread erneut                                   |
| PDF-Anhänge                        | Als Datei-/Medienkontext gespeichert, nicht automatisch durch Image Vision geleitet  | Verwenden Sie `download-file` für Dateimetadaten oder das Tool `pdf` für PDF-Analysen   |

### Verwandte Dokumentation

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
    Verhalten von Kanälen und Gruppen-DMs.
  </Card>
  <Card title="Kanal-Routing" icon="route" href="/de/channels/channel-routing">
    Leiten Sie Inbound-Nachrichten an Agenten weiter.
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
