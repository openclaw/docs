---
read_when:
    - Slack einrichten oder den Slack-Socket-, HTTP- oder Relay-Modus debuggen
summary: Slack-Einrichtung und Laufzeitverhalten (Socket Mode, HTTP Request URLs und Relay-Modus)
title: Slack
x-i18n:
    generated_at: "2026-07-16T12:28:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b0b3c4ddcd4ea46448bf4fcba4713a92cd487a3ab69077f6b808fbcc65608c7f
    source_path: channels/slack.md
    workflow: 16
---

Slack-Unterstützung umfasst Direktnachrichten und Kanäle über Slack-App-Integrationen. Der Standardtransport ist Socket Mode; HTTP Request URLs werden ebenfalls unterstützt. Der Relay-Modus ist für verwaltete Bereitstellungen vorgesehen, bei denen ein vertrauenswürdiger Router den Slack-Eingang verwaltet.

<CardGroup cols={3}>
  <Card title="Kopplung" icon="link" href="/de/channels/pairing">
    Slack-Direktnachrichten verwenden standardmäßig den Kopplungsmodus.
  </Card>
  <Card title="Slash-Befehle" icon="terminal" href="/de/tools/slash-commands">
    Natives Befehlsverhalten und Befehlskatalog.
  </Card>
  <Card title="Fehlerbehebung für Kanäle" icon="wrench" href="/de/channels/troubleshooting">
    Kanalübergreifende Diagnose- und Reparaturleitfäden.
  </Card>
</CardGroup>

## Transport auswählen

Socket Mode und HTTP Request URLs bieten für Nachrichten, Slash-Befehle, App Home und Interaktivität denselben Funktionsumfang. Treffen Sie die Auswahl anhand der Bereitstellungsstruktur, nicht anhand der Funktionen.

| Aspekt                       | Socket Mode (Standard)                                                                                                                               | HTTP Request URLs                                                                                              |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Öffentliche Gateway-URL      | Nicht erforderlich                                                                                                                                   | Erforderlich (DNS, TLS, Reverse-Proxy oder Tunnel)                                                             |
| Ausgehendes Netzwerk         | Ausgehendes WSS zu `wss-primary.slack.com` muss erreichbar sein                                                                                           | Kein ausgehendes WS; nur eingehendes HTTPS                                                                     |
| Benötigte Token              | Bot-Token + App-Level Token mit `connections:write`                                                                                                   | Bot-Token + Signing Secret                                                                                     |
| Entwicklungs-Laptop / hinter Firewall | Funktioniert ohne weitere Anpassungen                                                                                                      | Erfordert einen öffentlichen Tunnel (ngrok, Cloudflare Tunnel, Tailscale Funnel) oder ein Staging-Gateway      |
| Horizontale Skalierung       | Eine Socket-Mode-Sitzung pro App und Host; mehrere Gateways benötigen separate Slack-Apps                                                            | Zustandsloser POST-Handler; mehrere Gateway-Replikate können hinter einem Load-Balancer eine App gemeinsam nutzen |
| Mehrere Konten auf einem Gateway | Unterstützt; jedes Konto öffnet ein eigenes WS                                                                                                  | Unterstützt; jedes Konto benötigt einen eindeutigen `webhookPath` (Standard: `/slack/events`), damit Registrierungen nicht kollidieren |
| Transport für Slash-Befehle | Zustellung über die WS-Verbindung; `slash_commands[].url` wird ignoriert                                                                                  | Slack sendet POST-Anfragen an `slash_commands[].url`; das Feld ist für die Befehlsweiterleitung erforderlich       |
| Anfragesignierung            | Nicht verwendet (Authentifizierung erfolgt über das App-Level Token)                                                                                 | Slack signiert jede Anfrage; OpenClaw verifiziert sie mit `signingSecret`                                   |
| Wiederherstellung bei Verbindungsabbruch | Die automatische Wiederverbindung des Slack SDK ist aktiviert; OpenClaw startet fehlgeschlagene Socket-Mode-Sitzungen außerdem mit begrenztem Backoff neu. Die Transportoptimierung für Pong-Zeitüberschreitungen gilt. | Keine dauerhafte Verbindung, die abbrechen könnte; Wiederholungen erfolgen pro Anfrage durch Slack |

<Note>
  **Wählen Sie Socket Mode** für Hosts mit einem einzelnen Gateway, Entwicklungs-Laptops und lokale Netzwerke, die `*.slack.com` ausgehend erreichen können, aber kein eingehendes HTTPS akzeptieren können.

**Wählen Sie HTTP Request URLs**, wenn mehrere Gateway-Replikate hinter einem Load-Balancer ausgeführt werden, ausgehendes WSS blockiert ist, aber eingehendes HTTPS erlaubt ist, oder wenn Slack-Webhooks bereits an einem Reverse-Proxy terminiert werden.
</Note>

<Warning>
  Slack kann mehrere Socket-Mode-Verbindungen für eine App aufrechterhalten und jede Nutzlast an eine beliebige Verbindung zustellen. Separate OpenClaw-Gateways, die dieselbe Slack-App verwenden, benötigen daher eine gleichwertige Routing- und Autorisierungskonfiguration. Verwenden Sie andernfalls eine separate Slack-App pro Gateway, einen einzelnen Relay-Eingang oder HTTP Request URLs hinter einem Load-Balancer. Siehe [Socket Mode verwenden](https://docs.slack.dev/apis/events-api/using-socket-mode#using-multiple-connections).
</Warning>

### Relay-Modus

Der Relay-Modus trennt den Slack-Eingang vom OpenClaw-Gateway. Ein vertrauenswürdiger Router verwaltet die einzelne Slack-Socket-Mode-Verbindung, wählt ein Ziel-Gateway aus und leitet ein typisiertes Ereignis über einen authentifizierten WebSocket weiter. Das Gateway verwendet weiterhin sein eigenes Bot-Token für ausgehende Aufrufe der Slack Web API.

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

Die Relay-URL muss `wss://` verwenden, sofern sie nicht auf localhost verweist. Behandeln Sie das Bearer-Token und die Routentabelle des Routers als Teil der Slack-Autorisierungsgrenze: Weitergeleitete Ereignisse gelangen als autorisierte Aktivierungen in den normalen Slack-Nachrichtenhandler. Ein vom Router bereitgestellter `slack_identity` im WebSocket-Frame `hello` kann den standardmäßigen ausgehenden Benutzernamen und das Symbol festlegen; eine vom Aufrufer explizit bereitgestellte Identität hat weiterhin Vorrang. Die Relay-Verbindung stellt mit demselben begrenzten Backoff-Timing wie Socket Mode erneut eine Verbindung her und löscht die vom Router bereitgestellte Identität bei jeder Trennung.

### Organisationsweite Enterprise-Grid-Installationen

Ein Slack-Konto kann Nachrichten aus jedem Workspace empfangen, der von einer
organisationsweiten Enterprise-Grid-Installation abgedeckt wird. Wählen Sie
direkten Socket Mode oder HTTP Request URLs; der Relay-Modus wird für
Enterprise-Konten nicht unterstützt. Beide nachfolgenden Manifeste mit
minimalen Berechtigungen aktivieren nur den V1-Ereignispfad
`message` und `app_mention`, unmittelbare Antworten und
listener-eigene Statusreaktionen.

#### Socket Mode

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack-Konnektor für OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "channels:history",
        "channels:read",
        "chat:write",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "mpim:history",
        "mpim:read",
        "reactions:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "org_deploy_enabled": true,
    "socket_mode_enabled": true,
    "event_subscriptions": {
      "bot_events": [
        "app_mention",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim"
      ]
    }
  }
}
```

Lassen Sie die App von einem Enterprise Grid Org Admin oder Org Owner
genehmigen, installieren Sie sie auf Organisationsebene und wählen Sie die
Workspaces aus, die von der Installation abgedeckt werden. Vergewissern Sie
sich vor dem Start von OpenClaw, dass die App in jedem vorgesehenen Workspace
verfügbar ist. Generieren Sie für Socket Mode ein App-Level Token mit
`connections:write` und kopieren Sie anschließend das Bot-Token aus der
Organisationsinstallation. Konfigurieren Sie das Konto, das das
organisationsweit installierte Bot-Token verwendet:

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "socket",
      enterpriseOrgInstall: true,
      appToken: { source: "env", provider: "default", id: "SLACK_APP_TOKEN" },
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      dmPolicy: "open",
      allowFrom: ["*"],
      groupPolicy: "allowlist",
      channels: {
        C0123456789: { requireMention: true },
      },
    },
  },
}
```

#### HTTP Request URLs

Verwenden Sie den HTTP-Modus, wenn das Gateway über einen öffentlichen
HTTPS-Endpunkt verfügt und keine Socket-Mode-Verbindung öffnet. Ersetzen Sie
die Beispiel-URL durch die öffentliche `webhookPath`-URL des Gateways
(Standard: `/slack/events`):

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack-Konnektor für OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true }
  },
  "oauth_config": {
    "scopes": {
      "bot": [
        "app_mentions:read",
        "channels:history",
        "channels:read",
        "chat:write",
        "files:read",
        "files:write",
        "groups:history",
        "groups:read",
        "im:history",
        "im:read",
        "mpim:history",
        "mpim:read",
        "reactions:write",
        "users:read"
      ]
    }
  },
  "settings": {
    "org_deploy_enabled": true,
    "event_subscriptions": {
      "request_url": "https://gateway-host.example.com/slack/events",
      "bot_events": [
        "app_mention",
        "message.channels",
        "message.groups",
        "message.im",
        "message.mpim"
      ]
    }
  }
}
```

Lassen Sie die App von einem Enterprise Grid Org Admin oder Org Owner
genehmigen, installieren Sie sie auf Organisationsebene und wählen Sie die
Workspaces aus, die von der Installation abgedeckt werden. Nachdem Slack die
Request URL verifiziert hat, kopieren Sie das Bot-Token der
Organisationsinstallation und den Wert unter
**Basic Information -> App Credentials -> Signing Secret** der App.
Konfigurieren Sie das Enterprise-Konto mit demselben Request-URL-Pfad:

```json5
{
  channels: {
    slack: {
      enabled: true,
      mode: "http",
      enterpriseOrgInstall: true,
      botToken: { source: "env", provider: "default", id: "SLACK_BOT_TOKEN" },
      signingSecret: {
        source: "env",
        provider: "default",
        id: "SLACK_SIGNING_SECRET",
      },
      webhookPath: "/slack/events",
      dmPolicy: "open",
      allowFrom: ["*"],
      groupPolicy: "allowlist",
      channels: {
        C0123456789: { requireMention: true },
      },
    },
  },
}
```

Beim Start verifiziert OpenClaw `enterpriseOrgInstall` mit Slack
`auth.test`. Ein organisationsweit installiertes Token ohne das Flag
oder ein Workspace-Token mit dem Flag führt zu einem Startfehler. Slack bleibt
die maßgebliche Quelle dafür, welche Workspaces die Installation genehmigt
haben; OpenClaw wendet anschließend die konfigurierten Kanal-, Benutzer-,
Direktnachrichten- und Erwähnungsrichtlinien auf jedes zugestellte Ereignis
an. Enterprise V1 verwirft vor der Weiterleitung alle von Bots erstellten
Ereignisse `message` und `app_mention`, unabhängig von
`allowBots`, da organisationsweite Installationen keine stabile,
Workspace-qualifizierte Bot-Identität zur Schleifenvermeidung bereitstellen.

Die Enterprise-Unterstützung ist bewusst auf direkten Socket Mode oder die
HTTP-Ereignisse `message` und `app_mention` sowie deren
unmittelbare Antworten beschränkt. Relay-Modus, Slash-Befehle, Interaktionen,
App Home, Listener für Reaktionsereignisse, angeheftete Elemente,
Slack-Aktionswerkzeuge, Slack-native Genehmigungen, Bindungen, Zustellungen in
Warteschlangen oder nach Zeitplan sowie proaktive Sendungen sind für ein
Enterprise-Konto nicht verfügbar. Ausgehende Bestätigungs-, Tipp- und
Statusreaktionen werden über den listener-eigenen Slack-Client unterstützt und
erfordern `reactions:write`; eingehende Reaktionsbenachrichtigungen und
Reaktionsaktionswerkzeuge bleiben nicht verfügbar.

Sofortige Antworten verwenden das standardmäßige Slack-Zustellverhalten für Blöcke,
Medien, Metadaten, Identitäts-Fallbacks, Unfurls und Empfangsbestätigungen erneut, jedoch nur solange der
validierte, dem Listener zugeordnete Client im aktiven Ereignisdurchlauf verbleibt. Die
In-Memory-Sendewarteschlange und die Datensätze zur Thread-Teilnahme werden nach dem Workspace
dieses Ereignisses partitioniert; der Client selbst wird niemals serialisiert oder persistent gespeichert.

Channel-Richtlinienschlüssel und `dm.groupChannels`-Einträge müssen unverarbeitete, stabile Slack-Channel-IDs oder die
Form `channel:<id>` verwenden. OpenClaw normalisiert beide Formen für den
Laufzeitabgleich auf die unverarbeitete Channel-ID; die Präfixe `slack:`, `group:` und `mpim:` verhindern den Start.
Einträge in Benutzerrichtlinien müssen stabile Slack-Benutzer-IDs verwenden; Namen, Slugs, Anzeigenamen
und E-Mail-Adressen verhindern den Start. IDs müssen das kanonische Slack-Präfix in Großbuchstaben
und den kanonischen Hauptteil verwenden (zum Beispiel `C0123456789` oder `U0123456789`); kleingeschriebene und
verkürzte, ähnlich aussehende Varianten verhindern den Start. Enterprise-Konten können
`dangerouslyAllowNameMatching` nicht aktivieren. Enterprise-Konten können den globalen Wert
`mentionPatterns.mode` festlegen, aber `mentionPatterns.allowIn` und
`mentionPatterns.denyIn` verhindern den Start, da reine Slack-Channel-IDs nicht
Workspace-qualifiziert sind und in mehreren Workspaces wiederverwendet werden können. Workspace-Installationen
behalten das bestehende Verhalten für bereichsgebundene Erwähnungsmuster bei. Jeder akzeptierte Workspace
erhält separate Identitäten für Routing, Sitzung, Transkript, Deduplizierung, Verlauf und Cache,
selbst wenn sich Slack-IDs überschneiden. Innerhalb des `message`-Streams werden gewöhnliche Benutzernachrichten
und von Benutzern erstellte `file_share`-Ereignisse unterstützt; andere Nachrichtenuntertypen werden
vor der Autorisierung oder der Verarbeitung von Systemereignissen abgelehnt.

Enterprise-Direktnachrichten müssen entweder deaktiviert sein (`dm.enabled=false` oder
`dmPolicy="disabled"`) oder mit `dmPolicy="open"` explizit geöffnet werden und
eine wirksame Konto-`allowFrom` enthalten, die den Literalwert `"*"` umfasst. Eine leere
Zulassungsliste oder benutzerspezifische IDs ohne `"*"` verhindern den Start. Kopplung und
benutzerspezifische Zulassungslisten für Direktnachrichten werden abgelehnt, da Slack-Benutzer-IDs in diesen
Autorisierungsspeichern nicht Workspace-qualifiziert sind. Channel- und Absenderrichtlinien
gelten weiterhin für Channel-Nachrichten.

## Installation

```bash
openclaw plugins install @openclaw/slack
```

`plugins install` registriert und aktiviert das Plugin. Es bewirkt nichts, bis Sie die Slack-App und die nachstehenden Channel-Einstellungen konfigurieren. Allgemeine Regeln zur Plugin-Installation finden Sie unter [Plugins](/de/tools/plugin).

## Schnelleinrichtung

Die Manifeste in diesem Abschnitt erstellen eine Workspace-bezogene Installation. Verwenden Sie für eine
organisationsweite Installation in einer Enterprise-Grid-Organisation stattdessen das dedizierte
[organisationsweite Manifest und den entsprechenden Ablauf](#enterprise-grid-org-wide-installs).

<Tabs>
  <Tab title="Socket-Modus (Standard)">
    <Steps>
      <Step title="Neue Slack-App erstellen">
        Öffnen Sie [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → wählen Sie Ihren Workspace aus → fügen Sie eines der nachstehenden Manifeste ein → **Next** → **Create**.

        <CodeGroup>

```json Recommended
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack-Connector für OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw verbindet Slack-Assistenten-Threads mit OpenClaw-Agenten.",
      "suggested_prompts": [
        { "title": "Was können Sie tun?", "message": "Wobei können Sie mir helfen?" },
        {
          "title": "Diesen Channel zusammenfassen",
          "message": "Fassen Sie die jüngsten Aktivitäten in diesem Channel zusammen."
        },
        { "title": "Antwort entwerfen", "message": "Helfen Sie mir, eine Antwort zu entwerfen." }
      ]
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
    "description": "Slack-Connector für OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw verbindet Slack-Assistenten-Threads mit OpenClaw-Agenten.",
      "suggested_prompts": [
        { "title": "Was können Sie tun?", "message": "Wobei können Sie mir helfen?" },
        {
          "title": "Diesen Channel zusammenfassen",
          "message": "Fassen Sie die jüngsten Aktivitäten in diesem Channel zusammen."
        },
        { "title": "Antwort entwerfen", "message": "Helfen Sie mir, eine Antwort zu entwerfen." }
      ]
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
          **Empfohlen** entspricht dem vollständigen Funktionsumfang des Slack-Plugins: App Home, Slash-Befehle, Dateien, Reaktionen, Pins, Gruppen-Direktnachrichten sowie Lesezugriff auf Emojis und Benutzergruppen. Wählen Sie **Minimal**, wenn die Workspace-Richtlinie Scopes einschränkt – diese Variante deckt Direktnachrichten, den Channel-/Gruppenverlauf, Erwähnungen und Slash-Befehle ab, lässt jedoch Dateien, Reaktionen, Pins, Gruppen-Direktnachrichten (`mpim:*`), `emoji:read` und `usergroups:read` weg. Die Begründung für die einzelnen Scopes und additive Optionen wie zusätzliche Slash-Befehle finden Sie in der [Checkliste für Manifest und Scopes](#manifest-and-scope-checklist).
        </Note>

        Nachdem Slack die App erstellt hat:

        - **Basic Information -> App-Level Tokens -> Generate Token and Scopes**: Fügen Sie `connections:write` hinzu, speichern Sie und kopieren Sie das App-Level-Token.
        - **Install App -> Install to Workspace**: Kopieren Sie das Bot User OAuth Token.

      </Step>

      <Step title="OpenClaw konfigurieren">

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

        Umgebungsvariablen-Fallback (nur Standardkonto):

```bash
SLACK_APP_TOKEN=slack-app-token-example
SLACK_BOT_TOKEN=slack-bot-token-example
```

      </Step>

      <Step title="Gateway starten">

```bash
openclaw gateway
```

      </Step>
    </Steps>

  </Tab>

  <Tab title="HTTP-Anfrage-URLs">
    <Steps>
      <Step title="Neue Slack-App erstellen">
        Öffnen Sie [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → wählen Sie Ihren Workspace aus → fügen Sie eines der nachstehenden Manifeste ein → ersetzen Sie `https://gateway-host.example.com/slack/events` durch Ihre öffentliche Gateway-URL → **Next** → **Create**.

        <CodeGroup>

```json Recommended
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack-Connector für OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw verbindet Slack-Assistenten-Threads mit OpenClaw-Agenten.",
      "suggested_prompts": [
        { "title": "Was können Sie tun?", "message": "Wobei können Sie mir helfen?" },
        {
          "title": "Diesen Channel zusammenfassen",
          "message": "Fassen Sie die jüngsten Aktivitäten in diesem Channel zusammen."
        },
        { "title": "Antwort entwerfen", "message": "Helfen Sie mir, eine Antwort zu entwerfen." }
      ]
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
    "description": "Slack-Konnektor für OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw verbindet Slack-Assistenten-Threads mit OpenClaw-Agenten.",
      "suggested_prompts": [
        { "title": "Was können Sie tun?", "message": "Wobei können Sie mir helfen?" },
        {
          "title": "Diesen Kanal zusammenfassen",
          "message": "Fassen Sie die jüngsten Aktivitäten in diesem Kanal zusammen."
        },
        { "title": "Antwort entwerfen", "message": "Helfen Sie mir, eine Antwort zu entwerfen." }
      ]
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
          **Empfohlen** entspricht dem vollständigen Funktionsumfang des Slack-Plugins; **Minimal** verzichtet für restriktive Workspaces auf Dateien, Reaktionen, angeheftete Elemente, Gruppen-DMs (`mpim:*`), `emoji:read` und `usergroups:read`. Die Begründung für die einzelnen Berechtigungsbereiche finden Sie unter [Checkliste für Manifest und Berechtigungsbereiche](#manifest-and-scope-checklist).
        </Note>

        <Info>
          Die drei URL-Felder (`slash_commands[].url`, `event_subscriptions.request_url` und `interactivity.request_url` / `message_menu_options_url`) verweisen alle auf denselben OpenClaw-Endpunkt. Das Manifestschema von Slack erfordert, dass sie separat benannt werden, OpenClaw leitet jedoch anhand des Payload-Typs weiter, sodass ein einzelner `webhookPath` (Standard: `/slack/events`) ausreicht. Slash-Befehle ohne `slash_commands[].url` bleiben im HTTP-Modus ohne Meldung wirkungslos.
        </Info>

        Nachdem Slack die App erstellt hat:

        - **Basic Information → App Credentials**: Kopieren Sie das **Signing Secret** zur Verifizierung von Anfragen.
        - **Install App -> Install to Workspace**: Kopieren Sie das Bot User OAuth Token.

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
        Verwenden Sie für HTTP mit mehreren Konten eindeutige Webhook-Pfade

        Weisen Sie jedem Konto einen eigenen `webhookPath` (Standard: `/slack/events`) zu, damit sich die Registrierungen nicht überschneiden.
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

## Transportoptimierung für den Socket Mode

OpenClaw setzt das Pong-Timeout des Slack-SDK-Clients für den Socket Mode standardmäßig auf 15 Sekunden. Überschreiben Sie die Transporteinstellungen nur, wenn eine Workspace- oder hostspezifische Anpassung erforderlich ist:

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

Verwenden Sie dies nur für Workspaces im Socket Mode, die Slack-WebSocket-Pong- oder Server-Ping-Timeouts protokollieren, oder die auf Hosts mit bekannter Überlastung der Ereignisschleife ausgeführt werden. `clientPingTimeout` ist die Wartezeit auf den Pong, nachdem das SDK einen Client-Ping gesendet hat; `serverPingTimeout` ist die Wartezeit auf Server-Pings von Slack. App-Nachrichten und Ereignisse bleiben Anwendungszustand und sind keine Signale für die Funktionsfähigkeit des Transports.

Hinweise:

- `socketMode` wird im Modus für HTTP Request URLs ignoriert.
- Die grundlegenden `channels.slack.socketMode`-Einstellungen gelten für alle Slack-Konten, sofern sie nicht überschrieben werden. Kontospezifische Überschreibungen verwenden `channels.slack.accounts.<accountId>.socketMode`; da es sich hierbei um eine Objektüberschreibung handelt, müssen Sie jedes Socket-Optimierungsfeld angeben, das für dieses Konto gelten soll.
- Nur `clientPingTimeout` hat einen OpenClaw-Standardwert (`15000`). `serverPingTimeout` und `pingPongLoggingEnabled` werden nur dann an das Slack SDK übergeben, wenn sie konfiguriert sind.
- Der Backoff für Neustarts im Socket Mode beginnt bei etwa 2 Sekunden und ist auf etwa 30 Sekunden begrenzt. Behebbare Fehler beim Start, beim Warten auf den Start und bei Verbindungsabbrüchen werden erneut versucht, bis der Kanal beendet wird. Dauerhafte Konto- und Anmeldedatenfehler wie ungültige Authentifizierung, widerrufene Token oder fehlende Berechtigungsbereiche schlagen sofort fehl, anstatt unbegrenzt erneut versucht zu werden.

## Checkliste für Manifest und Berechtigungsbereiche

Das grundlegende Slack-App-Manifest ist für den Socket Mode und HTTP Request URLs identisch. Nur der Block `settings` (und `url` des Slash-Befehls) unterscheidet sich.

Grundlegendes Manifest (Standard für den Socket Mode):

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack-Konnektor für OpenClaw"
  },
  "features": {
    "bot_user": { "display_name": "OpenClaw", "always_online": true },
    "app_home": {
      "home_tab_enabled": true,
      "messages_tab_enabled": true,
      "messages_tab_read_only_enabled": false
    },
    "assistant_view": {
      "assistant_description": "OpenClaw verbindet Slack-Assistenten-Threads mit OpenClaw-Agenten.",
      "suggested_prompts": [
        { "title": "Was können Sie tun?", "message": "Wobei können Sie mir helfen?" },
        {
          "title": "Diesen Kanal zusammenfassen",
          "message": "Fassen Sie die jüngsten Aktivitäten in diesem Kanal zusammen."
        },
        { "title": "Antwort entwerfen", "message": "Helfen Sie mir, eine Antwort zu entwerfen." }
      ]
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

Ersetzen Sie für den Modus **HTTP Request URLs** `settings` durch die HTTP-Variante und fügen Sie jedem Slash-Befehl `url` hinzu. Eine öffentliche URL ist erforderlich:

```json
{
  "features": {
    "slash_commands": [
      {
        "command": "/openclaw",
        "description": "Eine Nachricht an OpenClaw senden",
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

### Zusätzliche Manifesteinstellungen

Stellen Sie verschiedene Funktionen bereit, welche die obigen Standardwerte erweitern.

Das Standardmanifest aktiviert in Slack App Home den Tab **Home** und abonniert `app_home_opened`. Wenn ein Workspace-Mitglied den Tab Home öffnet, veröffentlicht OpenClaw eine sichere standardmäßige Home-Ansicht mit `views.publish`; sie enthält weder Konversations-Payloads noch private Konfigurationen. Wenn der Modus mit einem einzelnen Slash-Befehl aktiviert ist, verwendet der Befehlshinweis `channels.slack.slashCommand.name`; bei Installationen mit nativen Befehlen oder ohne Slash-Befehle wird dieser Hinweis ausgelassen. Der Tab **Messages** bleibt für Slack-DMs aktiviert. Das Manifest aktiviert außerdem Slack-Assistenten-Threads mit `features.assistant_view`, `assistant:write`, `assistant_thread_started` und `assistant_thread_context_changed`; Assistenten-Threads werden an eigene OpenClaw-Thread-Sitzungen weitergeleitet und halten den von Slack bereitgestellten Thread-Kontext für den Agenten verfügbar.

<AccordionGroup>
  <Accordion title="Optionale native Slash-Befehle">

    Anstelle eines einzelnen konfigurierten Befehls können mehrere [native Slash-Befehle](#commands-and-slash-behavior) verwendet werden, wobei Folgendes zu beachten ist:

    - Verwenden Sie `/agentstatus` anstelle von `/status`, da der Befehl `/status` reserviert ist.
    - In einer Slack-App können gleichzeitig höchstens 25 Slash-Befehle registriert werden (Limit der Slack-Plattform).

    Ersetzen Sie Ihren vorhandenen Abschnitt `features.slash_commands` durch eine Teilmenge der [verfügbaren Befehle](/de/tools/slash-commands#command-list):

    <Tabs>
      <Tab title="Socket Mode (Standard)">

```json
{
  "slash_commands": [
    {
      "command": "/new",
      "description": "Neue Sitzung starten",
      "usage_hint": "[model]"
    },
    {
      "command": "/reset",
      "description": "Aktuelle Sitzung zurücksetzen"
    },
    {
      "command": "/compact",
      "description": "Sitzungskontext komprimieren",
      "usage_hint": "[instructions]"
    },
    {
      "command": "/stop",
      "description": "Aktuellen Lauf stoppen"
    },
    {
      "command": "/session",
      "description": "Ablauf der Thread-Bindung verwalten",
      "usage_hint": "inaktiv <duration|off> oder maximales Alter <duration|off>"
    },
    {
      "command": "/think",
      "description": "Denkstufe festlegen",
      "usage_hint": "<level>"
    },
    {
      "command": "/verbose",
      "description": "Ausführliche Ausgabe umschalten",
      "usage_hint": "on|off|full"
    },
    {
      "command": "/fast",
      "description": "Schnellmodus anzeigen oder festlegen",
      "usage_hint": "[status|on|off]"
    },
    {
      "command": "/reasoning",
      "description": "Sichtbarkeit der Schlussfolgerungen umschalten",
      "usage_hint": "[on|off|stream]"
    },
    {
      "command": "/elevated",
      "description": "Modus mit erhöhten Berechtigungen umschalten",
      "usage_hint": "[on|off|ask|full]"
    },
    {
      "command": "/exec",
      "description": "Exec-Standardwerte anzeigen oder festlegen",
      "usage_hint": "host=<auto|sandbox|gateway|node> security=<deny|allowlist|full> ask=<off|on-miss|always> node=<id>"
    },
    {
      "command": "/approve",
      "description": "Ausstehende Genehmigungsanfragen genehmigen oder ablehnen",
      "usage_hint": "<id> <decision>"
    },
    {
      "command": "/model",
      "description": "Modell anzeigen oder festlegen",
      "usage_hint": "[name|#|status]"
    },
    {
      "command": "/models",
      "description": "Provider/Modelle auflisten",
      "usage_hint": "[provider] [page] [limit=<n>|size=<n>|all]"
    },
    {
      "command": "/help",
      "description": "Kurze Hilfeübersicht anzeigen"
    },
    {
      "command": "/commands",
      "description": "Generierten Befehlskatalog anzeigen"
    },
    {
      "command": "/tools",
      "description": "Anzeigen, was der aktuelle Agent derzeit verwenden kann",
      "usage_hint": "[compact|verbose]"
    },
    {
      "command": "/agentstatus",
      "description": "Laufzeitstatus anzeigen, einschließlich Provider-Nutzung/Kontingent, sofern verfügbar"
    },
    {
      "command": "/tasks",
      "description": "Aktive/kürzlich ausgeführte Hintergrundaufgaben für die aktuelle Sitzung auflisten"
    },
    {
      "command": "/context",
      "description": "Erläutern, wie der Kontext zusammengestellt wird",
      "usage_hint": "[list|detail|json]"
    },
    {
      "command": "/whoami",
      "description": "Ihre Absenderidentität anzeigen"
    },
    {
      "command": "/skill",
      "description": "Skill anhand des Namens ausführen",
      "usage_hint": "<name> [input]"
    },
    {
      "command": "/btw",
      "description": "Nebenfrage stellen, ohne den Sitzungskontext zu ändern",
      "usage_hint": "<question>"
    },
    {
      "command": "/side",
      "description": "Nebenfrage stellen, ohne den Sitzungskontext zu ändern",
      "usage_hint": "<question>"
    },
    {
      "command": "/usage",
      "description": "Nutzungsfußzeile steuern oder Kostenzusammenfassung anzeigen",
      "usage_hint": "off|tokens|full|cost"
    }
  ]
}
```

      </Tab>
      <Tab title="HTTP-Anfrage-URLs">
        Verwenden Sie dieselbe `slash_commands`-Liste wie oben für den Socket Mode und fügen Sie jedem Eintrag `"url": "https://gateway-host.example.com/slack/events"` hinzu. Beispiel:

```json
{
  "slash_commands": [
    {
      "command": "/new",
      "description": "Neue Sitzung starten",
      "usage_hint": "[model]",
      "url": "https://gateway-host.example.com/slack/events"
    },
    {
      "command": "/help",
      "description": "Kurze Hilfeübersicht anzeigen",
      "url": "https://gateway-host.example.com/slack/events"
    }
  ]
}
```

        Wiederholen Sie diesen `url`-Wert für jeden Befehl in der Liste.

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="Optionale Bereiche für Urheberschaft (Schreibvorgänge)">
    Fügen Sie den Bot-Bereich `chat:write.customize` hinzu, wenn ausgehende Nachrichten die Identität des aktiven Agenten (benutzerdefinierter Benutzername und benutzerdefiniertes Symbol) anstelle der standardmäßigen Slack-App-Identität verwenden sollen.

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
    - `search:read` (wenn Sie auf Lesezugriffe der Slack-Suche angewiesen sind)

  </Accordion>
</AccordionGroup>

## Token-Modell

- `botToken` + `appToken` sind für den Socket Mode erforderlich.
- Der HTTP-Modus erfordert `botToken` + `signingSecret`.
- Der Relay-Modus erfordert `botToken` sowie `relay.url`, `relay.authToken` und `relay.gatewayId`; er verwendet weder ein App-Token noch ein Signaturgeheimnis.
- `botToken`, `appToken`, `signingSecret`, `relay.authToken` und `userToken` akzeptieren Klartext-
  Zeichenfolgen oder SecretRef-Objekte.
- Konfigurations-Token überschreiben den Fallback auf Umgebungsvariablen.
- Der Fallback auf die Umgebungsvariablen `SLACK_BOT_TOKEN`, `SLACK_APP_TOKEN` und `SLACK_USER_TOKEN` gilt jeweils nur für das Standardkonto.
- `userToken` verwendet standardmäßig schreibgeschütztes Verhalten (`userTokenReadOnly: true`).

Verhalten der Statusmomentaufnahme:

- Die Prüfung des Slack-Kontos verfolgt pro Anmeldedaten `*Source`- und `*Status`-
  Felder (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Der Status ist `available`, `configured_unavailable` oder `missing`.
- `configured_unavailable` bedeutet, dass das Konto über SecretRef
  oder eine andere nicht eingebettete Geheimnisquelle konfiguriert ist, der aktuelle Befehls-/Laufzeitpfad
  den tatsächlichen Wert jedoch nicht auflösen konnte.
- Im HTTP-Modus ist `signingSecretStatus` enthalten; im Socket Mode besteht das
  erforderliche Paar aus `botTokenStatus` + `appTokenStatus`.

<Tip>
Für Aktionen/Verzeichnislesevorgänge kann das Benutzer-Token bevorzugt werden, wenn es konfiguriert ist. Für Schreibvorgänge wird weiterhin das Bot-Token bevorzugt; Schreibvorgänge mit Benutzer-Token sind nur zulässig, wenn `userTokenReadOnly: false` und das Bot-Token nicht verfügbar ist.
</Tip>

## Aktionen und Zugriffsschranken

Slack-Aktionen werden durch `channels.slack.actions.*` gesteuert.

Verfügbare Aktionsgruppen in den aktuellen Slack-Werkzeugen:

| Gruppe     | Standard     |
| ---------- | ------------ |
| messages   | aktiviert    |
| reactions  | aktiviert    |
| pins       | aktiviert    |
| memberInfo | aktiviert    |
| emojiList  | aktiviert    |

Zu den aktuellen Slack-Nachrichtenaktionen gehören `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` und `emoji-list`. `download-file` akzeptiert Slack-Datei-IDs, die in Platzhaltern für eingehende Dateien angezeigt werden, und gibt für Bilder Bildvorschauen oder für andere Dateitypen lokale Dateimetadaten zurück.

## Zugriffskontrolle und Routing

<Tabs>
  <Tab title="DM-Richtlinie">
    `channels.slack.dmPolicy` steuert den DM-Zugriff. `channels.slack.allowFrom` ist die kanonische DM-Zulassungsliste.

    - `pairing` (Standard)
    - `allowlist`
    - `open` (erfordert, dass `channels.slack.allowFrom` den Wert `"*"` enthält)
    - `disabled`

    DM-Flags:

    - `dm.enabled` (standardmäßig true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (veraltet)
    - `dm.groupEnabled` (Gruppen-DMs standardmäßig false)
    - `dm.groupChannels` (optionale MPIM-Zulassungsliste)

    Rangfolge bei mehreren Konten:

    - `channels.slack.accounts.default.allowFrom` gilt nur für das Konto `default`.
    - Benannte Konten erben `channels.slack.allowFrom`, wenn ihr eigenes `allowFrom` nicht festgelegt ist.
    - Benannte Konten erben `channels.slack.accounts.default.allowFrom` nicht.

    Die veralteten `channels.slack.dm.policy` und `channels.slack.dm.allowFrom` werden aus Kompatibilitätsgründen weiterhin gelesen. `openclaw doctor --fix` migriert sie zu `dmPolicy` und `allowFrom`, wenn dies ohne Änderung des Zugriffs möglich ist.

    Die Kopplung in DMs verwendet `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Kanalrichtlinie">
    `channels.slack.groupPolicy` steuert die Kanalverarbeitung:

    - `open`
    - `allowlist`
    - `disabled`

    Die Kanal-Zulassungsliste befindet sich unter `channels.slack.channels` und **muss stabile Slack-Kanal-IDs** (zum Beispiel `C12345678`) als Konfigurationsschlüssel verwenden.

    Laufzeithinweis: Wenn `channels.slack` vollständig fehlt (Einrichtung nur über Umgebungsvariablen), fällt die Laufzeit auf `groupPolicy="allowlist"` zurück und protokolliert eine Warnung (selbst wenn `channels.defaults.groupPolicy` festgelegt ist).

    Namens-/ID-Auflösung:

    - Einträge der Kanal-Zulassungsliste und der DM-Zulassungsliste werden beim Start aufgelöst, sofern der Token-Zugriff dies erlaubt
    - Nicht aufgelöste Einträge mit Kanalnamen bleiben wie konfiguriert erhalten, werden aber standardmäßig beim Routing ignoriert
    - Eingehende Autorisierung und Kanal-Routing verwenden standardmäßig zuerst IDs; direkte Übereinstimmung mit Benutzernamen/Slugs erfordert `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Namensbasierte Schlüssel (`#channel-name` oder `channel-name`) stimmen unter `groupPolicy: "allowlist"` **nicht** überein. Die Kanalsuche verwendet standardmäßig zuerst IDs, sodass ein namensbasierter Schlüssel nie erfolgreich weitergeleitet wird und alle Nachrichten in diesem Kanal ohne Meldung blockiert werden. Dies unterscheidet sich von `groupPolicy: "open"`, wo der Kanalschlüssel für das Routing nicht erforderlich ist und ein namensbasierter Schlüssel zu funktionieren scheint.

    Verwenden Sie stets die Slack-Kanal-ID als Schlüssel. So finden Sie sie: Klicken Sie in Slack mit der rechten Maustaste auf den Kanal → **Copy link** — die ID (`C...`) steht am Ende der URL.

    Richtig:

    ```json5
    {
      channels: {
        slack: {
          groupPolicy: "allowlist",
          channels: {
            C12345678: { enabled: true, requireMention: true },
          },
        },
      },
    }
    ```

    Falsch (unter `groupPolicy: "allowlist"` ohne Meldung blockiert):

    ```json5
    {
      channels: {
        slack: {
          groupPolicy: "allowlist",
          channels: {
            "#eng-my-channel": { enabled: true, requireMention: true },
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
    - Erwähnung einer Slack-Benutzergruppe (`<!subteam^S...>`), wenn der Bot-Benutzer Mitglied dieser Benutzergruppe ist; erfordert `usergroups:read`
    - Regex-Muster für Erwähnungen (`agents.list[].groupChat.mentionPatterns`, Fallback `messages.groupChat.mentionPatterns`)
    - implizites Verhalten bei Antworten auf Bot-Threads (deaktiviert, wenn `thread.requireExplicitMention` auf `true` gesetzt ist)

    Kanalbezogene Steuerelemente (`channels.slack.channels.<id>`; Namen nur über die Auflösung beim Start oder `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `ignoreOtherMentions`
    - `replyToMode` (`off|first|all|batched`; überschreibt den Antwortmodus des Kontos/Chattyps für diesen Kanal)
    - `users` (Zulassungsliste)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - Schlüsselformat für `toolsBySender`: `channel:`, `id:`, `e164:`, `username:`, `name:` oder Platzhalter `"*"`
      (veraltete Schlüssel ohne Präfix werden weiterhin nur `id:` zugeordnet)

    `ignoreOtherMentions` (Standardwert `false`) verwirft Kanalnachrichten, die einen anderen Benutzer oder eine andere Benutzergruppe erwähnen, aber nicht diesen Bot. DMs und Gruppen-DMs (MPIMs) sind davon nicht betroffen. Der Filter erfordert eine aufgelöste Bot-Benutzer-ID aus `auth.test`; wenn diese Identität nicht verfügbar ist (beispielsweise bei einer Identität, die nur über ein Benutzer-Token verfügt), bleibt die Schranke offen und Nachrichten werden unverändert durchgelassen.

    `allowBots` ist bei Kanälen und privaten Kanälen restriktiv: Von Bots verfasste Raumnachrichten werden nur akzeptiert, wenn der sendende Bot ausdrücklich in der `users`-Positivliste dieses Raums aufgeführt ist oder wenn mindestens eine explizite Slack-Eigentümer-ID aus `channels.slack.allowFrom` derzeit Mitglied des Raums ist. Platzhalter und Eigentümereinträge mit Anzeigenamen erfüllen die Voraussetzung der Eigentümeranwesenheit nicht. Die Eigentümeranwesenheit verwendet Slack `conversations.members`; stellen Sie sicher, dass die App über den passenden Leseberechtigungsumfang für den Raumtyp verfügt (`channels:read` für öffentliche Kanäle, `groups:read` für private Kanäle). Wenn die Mitgliederabfrage fehlschlägt, verwirft OpenClaw die vom Bot verfasste Raumnachricht.

    Akzeptierte, von Bots verfasste Slack-Nachrichten verwenden den gemeinsamen [Schutz vor Bot-Schleifen](/de/channels/bot-loop-protection). Konfigurieren Sie `channels.defaults.botLoopProtection` für das Standardbudget und überschreiben Sie es anschließend mit `channels.slack.botLoopProtection` oder `channels.slack.channels.<id>.botLoopProtection`, wenn ein Workspace oder Kanal einen anderen Grenzwert benötigt.

  </Tab>
</Tabs>

## Threads, Sitzungen und Antwort-Tags

- DMs werden als `direct` weitergeleitet, Kanäle als `channel` und MPIMs als `group`.
- Slack-Routenbindungen akzeptieren unverarbeitete Peer-IDs sowie Slack-Zielformen wie `channel:C12345678`, `user:U12345678` und `<@U12345678>`.
- Mit dem Standardwert `session.dmScope=main` werden Slack-DMs in der Hauptsitzung des Agenten zusammengeführt.
- Kanalsitzungen: `agent:<agentId>:slack:channel:<channelId>`.
- Gewöhnliche Kanalnachrichten auf oberster Ebene verbleiben in der jeweiligen Kanalsitzung, selbst wenn `replyToMode` nicht `off` ist.
- Slack-Thread-Antworten verwenden das übergeordnete Slack-`thread_ts` für Sitzungssuffixe (`:thread:<threadTs>`), selbst wenn Antwort-Threads für ausgehende Nachrichten mit `replyToMode="off"` deaktiviert sind.
- OpenClaw übernimmt einen geeigneten Stamm einer Kanalnachricht auf oberster Ebene in `agent:<agentId>:slack:channel:<channelId>:thread:<rootTs>`, wenn erwartet wird, dass dieser Stamm einen sichtbaren Slack-Thread startet, sodass der Stamm und spätere Thread-Antworten dieselbe OpenClaw-Sitzung verwenden. Dies gilt für `app_mention`-Ereignisse, explizite Bot-Erwähnungen oder Treffer konfigurierter Erwähnungsmuster sowie für `requireMention: false`-Kanäle mit einem von `off` abweichenden `replyToMode`.
- Der Standardwert für `channels.slack.thread.historyScope` ist `thread`; der Standardwert für `thread.inheritParent` ist `false`.
- `channels.slack.thread.initialHistoryLimit` steuert, wie viele vorhandene Thread-Nachrichten beim Start einer neuen Thread-Sitzung abgerufen werden (Standardwert `20`; zum Deaktivieren auf `0` setzen).
- `channels.slack.thread.requireExplicitMention` (Standardwert `false`): Wenn `true`, werden implizite Thread-Erwähnungen unterdrückt, sodass der Bot innerhalb von Threads nur auf explizite `@bot`-Erwähnungen antwortet, selbst wenn er bereits am Thread teilgenommen hat. Andernfalls umgehen Antworten in einem Thread mit Bot-Beteiligung die `requireMention`-Schranke.

Steuerung der Antwort-Threads:

- `channels.slack.channels.<id>.replyToMode`: kanalspezifische Überschreibung für Nachrichten in Slack-Kanälen und privaten Kanälen
- `channels.slack.replyToMode`: `off|first|all|batched` (Standardwert `off`)
- `channels.slack.replyToModeByChatType`: je `direct|group|channel`
- veralteter Rückgriff für direkte Chats: `channels.slack.dm.replyToMode`

Manuelle Antwort-Tags werden unterstützt:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Für explizite Slack-Thread-Antworten aus dem Werkzeug `message` setzen Sie `replyBroadcast: true` zusammen mit `action: "send"` und `threadId` oder `replyTo`, damit Slack die Thread-Antwort zusätzlich im übergeordneten Kanal veröffentlicht. Dies entspricht Slacks `chat.postMessage`-Flag `reply_broadcast` und wird nur für Text- oder Block-Kit-Sendungen unterstützt, nicht für Medien-Uploads.

Wenn ein Aufruf des Werkzeugs `message` innerhalb eines Slack-Threads ausgeführt wird und denselben Kanal als Ziel verwendet, übernimmt OpenClaw normalerweise den aktuellen Slack-Thread entsprechend dem wirksamen `replyToMode` für das Konto, den Chattyp oder den jeweiligen Kanal. Automatische Antworten und Aufrufe von `send` oder `upload-file` im selben Kanal verwenden dieselbe kanalspezifische Überschreibung. Setzen Sie `topLevel: true` bei `action: "send"` oder `action: "upload-file"`, um stattdessen eine neue Nachricht im übergeordneten Kanal zu erzwingen. `threadId: null` wird als gleichwertige Abwahl auf oberster Ebene akzeptiert.

<Note>
`replyToMode="off"` deaktiviert Antwort-Threads für ausgehende Slack-Nachrichten, einschließlich expliziter `[[reply_to_*]]`-Tags. Eingehende Slack-Thread-Sitzungen werden dadurch nicht abgeflacht: Nachrichten, die bereits innerhalb eines Slack-Threads veröffentlicht wurden, werden weiterhin an die `:thread:<threadTs>`-Sitzung weitergeleitet. Dies unterscheidet sich von Telegram, wo explizite Tags im Modus `"off"` weiterhin berücksichtigt werden. Slack-Threads verbergen Nachrichten im Kanal, während Telegram-Antworten weiterhin direkt im Verlauf sichtbar bleiben.
</Note>

## Bestätigungsreaktionen

`ackReaction` sendet ein Bestätigungs-Emoji, während OpenClaw eine eingehende Nachricht verarbeitet. `ackReactionScope` bestimmt, _wann_ dieses Emoji tatsächlich gesendet wird.

Standardmäßig bleibt die Bestätigung unverändert, während Slacks nativer Assistenten-Thread-Status den Fortschritt mit wechselnden Lademeldungen anzeigt. Setzen Sie `messages.statusReactions.enabled: true`, um stattdessen den Reaktionslebenszyklus für Warteschlange/Denken/Werkzeug/Abgeschlossen/Fehler zu aktivieren.

### Emoji (`ackReaction`)

Auflösungsreihenfolge:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- Emoji-Rückgriff der Agentenidentität (`agents.list[].identity.emoji`, andernfalls `"eyes"` / 👀)

Hinweise:

- Slack erwartet Kurzcodes (beispielsweise `"eyes"`).
- Verwenden Sie `""`, um die Reaktion für das Slack-Konto oder global zu deaktivieren.

### Geltungsbereich (`messages.ackReactionScope`)

Der Slack-Provider liest den Geltungsbereich aus `messages.ackReactionScope` (Standardwert `"group-mentions"`). Derzeit gibt es keine Überschreibung auf Slack-Konto- oder Slack-Kanalebene; der Wert gilt global für das Gateway.

Werte:

- `"all"`: in DMs und Gruppen reagieren, einschließlich beiläufiger Raumereignisse.
- `"direct"`: nur in DMs reagieren.
- `"group-all"`: auf jede Gruppennachricht außer beiläufigen Raumereignissen reagieren (keine DMs).
- `"group-mentions"` (Standardwert): in Gruppen reagieren, jedoch nur, wenn der Bot erwähnt wird (oder in erwähnbaren Gruppen, die dies aktiviert haben). **DMs sind ausgeschlossen.**
- `"off"` / `"none"`: niemals reagieren.

<Note>
Der Standardgeltungsbereich (`"group-mentions"`) löst in Direktnachrichten oder bei beiläufigen Raumereignissen keine Bestätigungsreaktionen aus. Um das konfigurierte `ackReaction` (beispielsweise `"eyes"`) bei eingehenden Slack-DMs und stillen Raumereignissen zu sehen, setzen Sie `messages.ackReactionScope` auf `"all"`. `messages.ackReactionScope` wird beim Start des Slack-Providers gelesen, daher ist ein Neustart des Gateways erforderlich, damit die Änderung wirksam wird.
</Note>

```json5
{
  messages: {
    ackReaction: "eyes",
    ackReactionScope: "all", // in DMs und Gruppen reagieren
  },
}
```

## Text-Streaming

`channels.slack.streaming` steuert das Verhalten der Live-Vorschau:

- `off`: Streaming der Live-Vorschau deaktivieren.
- `partial` (Standardwert): Vorschautext durch die neueste Teilausgabe ersetzen.
- `block`: gestückelte Vorschauaktualisierungen anhängen.
- `progress`: während der Generierung einen Fortschrittsstatustext anzeigen und anschließend den endgültigen Text senden.
- `streaming.preview.toolProgress`: Wenn die Entwurfsvorschau aktiv ist, werden Werkzeug- und Fortschrittsaktualisierungen in dieselbe bearbeitete Vorschaunachricht geleitet (Standardwert: `true`). Setzen Sie `false`, um separate Werkzeug- und Fortschrittsnachrichten beizubehalten.
- `streaming.preview.commandText` / `streaming.progress.commandText`: auf `status` setzen, um kompakte Werkzeugfortschrittszeilen beizubehalten und gleichzeitig unverarbeiteten Befehls-/Ausführungstext auszublenden (Standardwert: `raw`).

Unverarbeiteten Befehls-/Ausführungstext ausblenden und kompakte Fortschrittszeilen beibehalten:

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

`channels.slack.streaming.nativeTransport` steuert das native Slack-Text-Streaming, wenn `channels.slack.streaming.mode` den Wert `partial` hat (Standardwert: `true`).

Native Slack-Fortschrittsaufgabenkarten müssen für den Fortschrittsmodus ausdrücklich aktiviert werden. Setzen Sie `channels.slack.streaming.progress.nativeTaskCards` mit `channels.slack.streaming.mode="progress"` auf `true`, um während der laufenden Arbeit eine native Slack-Plan-/Aufgabenkarte zu senden und dieselbe Aufgabenkarte nach Abschluss zu aktualisieren. Ohne dieses Flag behält der Fortschrittsmodus das portable Verhalten der Entwurfsvorschau bei.

- Damit natives Text-Streaming und der Slack-Assistenten-Thread-Status angezeigt werden können, muss ein Antwort-Thread verfügbar sein. Die Thread-Auswahl richtet sich weiterhin nach `replyToMode`.
- Kanal-, Gruppenchat- und DM-Stämme auf oberster Ebene können weiterhin die normale Entwurfsvorschau verwenden, wenn natives Streaming nicht verfügbar ist oder kein Antwort-Thread existiert.
- Slack-DMs auf oberster Ebene bleiben standardmäßig außerhalb von Threads und zeigen daher nicht Slacks threadartige native Streaming-/Statusvorschau an; OpenClaw veröffentlicht und bearbeitet stattdessen eine Entwurfsvorschau in der DM.
- Medien und Nicht-Text-Nutzlasten greifen auf die normale Zustellung zurück.
- Endgültige Medien-/Fehlerausgaben brechen ausstehende Vorschaubearbeitungen ab; geeignete endgültige Text-/Blockausgaben werden nur abgeschlossen, wenn sie die Vorschau direkt bearbeiten können.
- Wenn das Streaming während einer Antwort fehlschlägt, greift OpenClaw für die verbleibenden Nutzlasten auf die normale Zustellung zurück.

Entwurfsvorschau anstelle des nativen Slack-Text-Streamings verwenden:

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

Native Slack-Fortschrittsaufgabenkarten aktivieren:

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

Veraltete Schlüssel:

- `channels.slack.streamMode` (`replace | status_final | append`) ist ein veralteter Alias für `channels.slack.streaming.mode`.
- Der boolesche Wert `channels.slack.streaming` ist ein veralteter Alias für `channels.slack.streaming.mode` und `channels.slack.streaming.nativeTransport`.
- `channels.slack.chunkMode` und `channels.slack.nativeStreaming` auf oberster Ebene sind veraltete Aliasse für `channels.slack.streaming.chunkMode` und `channels.slack.streaming.nativeTransport`.
- Veraltete Aliasse werden zur Laufzeit nicht gelesen; führen Sie `openclaw doctor --fix` aus, um die persistierte Slack-Streaming-Konfiguration auf die kanonischen Schlüssel umzuschreiben.

## Rückgriff auf Tippreaktion

`typingReaction` fügt der eingehenden Slack-Nachricht vorübergehend eine Reaktion hinzu, während OpenClaw eine Antwort verarbeitet, und entfernt sie nach Abschluss des Durchlaufs wieder. Dies ist besonders außerhalb von Thread-Antworten nützlich, die standardmäßig eine „is typing...“-Statusanzeige verwenden.

Auflösungsreihenfolge:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Hinweise:

- Slack erwartet Kurzcodes (beispielsweise `"hourglass_flowing_sand"`).
- Die Reaktion erfolgt nach bestem Bemühen, und nach Abschluss des Antwort- oder Fehlerpfads wird automatisch versucht, sie zu entfernen.

## Spracheingabe

Um heute in Slack mit OpenClaw zu sprechen, senden Sie einen Slack-Audioclip an die OpenClaw-App. Das Diktiermikrofon von Slackbot ist eine separate, Slack-eigene Funktion und keine App-API.

- **[Slackbot-Sprachdiktat](https://slack.com/help/articles/202026038-How-to-use-Slackbot)** findet innerhalb der privaten Slackbot-Unterhaltung des Benutzers statt. Slack wandelt die Aufnahme in einen Slackbot-Prompt um, stellt Drittanbieter-Slack-Apps jedoch weder eine Audiodatei noch ein Diktatereignis, einen Prompt oder eine Markierung der Eingabequelle über die Events API bereit. Das OpenClaw-Slack-Plugin kann diese Funktion weder aktivieren noch empfangen.
- **[Slack-Audioclips](https://slack.com/help/articles/4406235165587-Record-audio-and-video-clips-in-Slack)** sind gespeicherte Slack-Dateien, die in einer OpenClaw-DM, einem Kanal oder einem Thread veröffentlicht werden können. OpenClaw lädt einen zugänglichen Clip mit dem Bot-Token herunter, normalisiert die MIME-Metadaten des Slack-Clips und leitet ihn durch die gemeinsame [Pipeline zur Audiotranskription](/de/nodes/audio). Das empfohlene App-Manifest enthält den erforderlichen `files:read`-Scope.

Audioclips und Slackbot-Diktate haben unterschiedliche Datenschutzmerkmale: Clips unterliegen der Slack-Richtlinie zur Dateiaufbewahrung und OpenClaw lädt sie zur Transkription herunter, während Slack angibt, dass Diktataudio nicht gespeichert wird.

In einem Kanal mit `requireMention: true` kann ein Audioclip ohne Beschriftung die Zugangsbedingung erfüllen, indem ein konfiguriertes Erwähnungsmuster gesprochen wird (`agents.list[].groupChat.mentionPatterns`, mit Rückgriff auf `messages.groupChat.mentionPatterns`). OpenClaw autorisiert den Absender, bevor der Clip heruntergeladen oder transkribiert wird, und lässt ihn anschließend nur zu, wenn das Transkript übereinstimmt. Ein fehlgeschlagenes oder nicht übereinstimmendes spekulatives Transkript wird zusammen mit dem heruntergeladenen Clip verworfen und nicht im Kanalverlauf gespeichert. Die native Slack-Identität `@bot` kann nicht aus der Sprache abgeleitet werden; konfigurieren Sie daher ein Muster für gesprochene Namen oder fügen Sie eine eingegebene Erwähnung hinzu. Wenn die Ausgabe des Transkripts aktiviert ist, wird sie erst nach der Zulassung gesendet.

## Medien, Aufteilung und Zustellung

<AccordionGroup>
  <Accordion title="Eingehende Anhänge">
    Slack-Dateianhänge werden von privaten, bei Slack gehosteten URLs heruntergeladen (tokenauthentifizierter Anfrageablauf) und bei erfolgreichem Abruf und Einhaltung der Größenbeschränkungen im Medienspeicher abgelegt. Dateiplatzhalter enthalten die Slack-`fileId`, damit Agenten die Originaldatei mit `download-file` abrufen können.

    Downloads verwenden begrenzte Leerlauf- und Gesamtzeitüberschreitungen. Wenn der Abruf einer Slack-Datei hängen bleibt oder fehlschlägt, verarbeitet OpenClaw die Nachricht weiter und greift auf den Dateiplatzhalter zurück.

    Die Laufzeit-Größenobergrenze für eingehende Dateien beträgt standardmäßig `20MB`, sofern sie nicht durch `channels.slack.mediaMaxMb` überschrieben wird.

  </Accordion>

  <Accordion title="Ausgehender Text und Dateien">
    - Textabschnitte verwenden `channels.slack.textChunkLimit` (standardmäßig `8000`, begrenzt auf Slacks eigene maximale Nachrichtenlänge)
    - `channels.slack.streaming.chunkMode="newline"` aktiviert die absatzweise Aufteilung
    - Dateisendungen verwenden die Slack-Upload-APIs und können Thread-Antworten enthalten (`thread_ts`)
    - Bei langen Dateibeschriftungen wird der erste Slack-kompatible Textabschnitt als Upload-Kommentar verwendet; die übrigen Abschnitte werden als Folgenachrichten gesendet
    - Die Obergrenze für ausgehende Medien richtet sich nach `channels.slack.mediaMaxMb`, wenn dies konfiguriert ist; andernfalls verwenden Kanalsendungen die Standardwerte der Medien-Pipeline für den jeweiligen MIME-Typ

  </Accordion>

  <Accordion title="Zustellungsziele">
    Bevorzugte explizite Ziele:

    - `user:<id>` für DMs
    - `channel:<id>` für Kanäle

    Slack-DMs, die nur Text oder Blöcke enthalten, können direkt an Benutzer-IDs gesendet werden; Datei-Uploads und Sendungen in Threads öffnen die DM zunächst über die Slack-Unterhaltungs-APIs, da diese Pfade eine konkrete Unterhaltungs-ID erfordern.

  </Accordion>
</AccordionGroup>

## Befehle und Slash-Verhalten

Slash-Befehle erscheinen in Slack entweder als einzelner konfigurierter Befehl oder als mehrere native Befehle. Konfigurieren Sie `channels.slack.slashCommand`, um die Befehlsstandardwerte zu ändern:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Native Befehle erfordern [zusätzliche Manifest-Einstellungen](#additional-manifest-settings) in Ihrer Slack-App und werden stattdessen mit `channels.slack.commands.native: true` oder `commands.native: true` in globalen Konfigurationen aktiviert.

- Der automatische Modus für native Befehle ist für Slack **deaktiviert**, sodass `commands.native: "auto"` keine nativen Slack-Befehle aktiviert.

```txt
/help
```

Menüs für native Argumente werden in der folgenden Prioritätsreihenfolge dargestellt:

- 3–5 ausreichend kurze Optionen: ein Überlaufmenü („...“)
- mehr als 100 Optionen bei verfügbarer asynchroner Optionsfilterung: externe Auswahl
- 1–2 Optionen oder eine Option, deren codierter Wert für eine Auswahl zu lang ist: Schaltflächenblöcke
- andernfalls (6–100 Optionen oder mehr als 100 ohne asynchrone Filterung): statisches Auswahlmenü, aufgeteilt in 100 Optionen pro Menü

```txt
/think
```

Slash-Sitzungen verwenden isolierte Schlüssel wie `agent:<agentId>:slack:slash:<userId>` und leiten Befehlsausführungen weiterhin mithilfe von `CommandTargetSessionKey` an die Sitzung der Zielunterhaltung weiter.

## Native Diagramme

Slacks öffentlicher [`data_visualization`-Block von Block Kit](https://docs.slack.dev/reference/block-kit/blocks/data-visualization-block/)
stellt Linien-, Balken-, Flächen- und Kreisdiagramme in Nachrichten dar. OpenClaw ordnet den portablen
`presentation`-`chart`-Block dieser nativen Form zu; über den normalen
Nachrichtenzugriff `chat:write` hinaus sind weder ein zusätzlicher OAuth-Scope
noch ein Datei-Upload, ein Bild-Renderer oder eine Slack-Konfiguration erforderlich.

```json
{
  "blocks": [
    {
      "type": "chart",
      "chartType": "bar",
      "title": "Quartalsumsatz",
      "categories": ["Q1", "Q2"],
      "series": [{ "name": "Umsatz", "values": [120, 145] }],
      "xLabel": "Quartal"
    }
  ]
}
```

Slacks Beschränkungen werden vor der nativen Darstellung durchgesetzt:

- Titel und optionale Achsenbeschriftungen: 50 Zeichen
- Kreisdiagramm: 1–12 positive Segmente
- Linien-/Balken-/Flächendiagramm: 1–12 eindeutig benannte Datenreihen und 1–20 gemeinsame Kategorien
- Segment-, Kategorie- und Datenreihenbeschriftungen: 20 Zeichen
- Jede Datenreihe muss für jede Kategorie einen endlichen Wert enthalten; Werte außerhalb von Kreisdiagrammen
  dürfen negativ sein

Jedes native Diagramm enthält außerdem eine übergeordnete Textdarstellung für Screenreader,
Benachrichtigungen, die Sitzungsspiegelung und Clients, die den Block nicht darstellen können.
Standardmäßige Präsentationssendungen an andere OpenClaw-Kanäle erhalten dieselben
deterministischen Diagrammdaten als Text, sofern sie keine native Diagrammunterstützung angeben. Wenn
Slack das Diagramm während einer schrittweisen Einführung mit `invalid_blocks` ablehnt, entfernt OpenClaw
die abgelehnten nativen Datenblöcke, behält etwaige gleichgeordnete Steuerelemente bei und sendet
die vollständige Diagrammdarstellung als sichtbaren Text.

Slack akzeptiert derzeit bis zu zwei `data_visualization`-Blöcke pro Nachricht. Wenn
eine Präsentation mehr als zwei gültige Diagramme enthält, behält OpenClaw deren Reihenfolge bei
und setzt die native Darstellung in Folgenachrichten fort, wobei jede Nachricht höchstens zwei
Diagramme enthält.

Slacks [Entwicklerankündigung](https://docs.slack.dev/changelog/2026/06/16/block-kit-data-visualization-block/)
dokumentiert den Block als App-seitige Block-Kit-Funktion und nennt keine Einschränkung
auf kostenpflichtige Tarife. Die Angaben zur Berechtigung für Business+/Enterprise gelten für
Slackbots automatische KI-Diagrammerstellung, die von einer App, die ein bereits strukturiertes
Block-Kit-Diagramm sendet, unabhängig ist. Diagramme sind reine Nachrichtenblöcke und keine Inhalte
für App Home, Modalfenster oder Canvas.

## Native Tabellen

Slacks aktueller [`data_table`-Block von Block Kit](https://docs.slack.dev/reference/block-kit/blocks/data-table-block/)
stellt strukturierte Zeilen und Spalten in Nachrichten dar. OpenClaw ordnet einen expliziten
portablen `presentation`-`table`-Block `data_table` zu; Slacks
veralteter [`table`-Block](https://docs.slack.dev/reference/block-kit/blocks/table-block/) wird nicht verwendet.
Über den normalen Nachrichtenzugriff `chat:write` hinaus ist kein zusätzlicher OAuth-Scope und
keine Slack-Konfiguration erforderlich.

```json
{
  "blocks": [
    {
      "type": "table",
      "caption": "Offene Pipeline",
      "headers": ["Konto", "Phase", "ARR"],
      "rows": [
        ["Acme", "Gewonnen", 125000],
        ["Globex", "Prüfung", 82000]
      ],
      "rowHeaderColumnIndex": 0
    }
  ]
}
```

OpenClaw ordnet Kopfzeilen- und Zeichenkettenzellen Slack-`raw_text`-Zellen zu. Numerische Zellen
werden `raw_number` zugeordnet, wobei der endliche numerische Wert für die native Sortierung
und Filterung erhalten bleibt. `rowHeaderColumnIndex` kennzeichnet, sofern vorhanden, diese nullbasierte
Spalte als Slack-Zeilenüberschriften.

Slacks veröffentlichte Grenzwerte für `data_table` werden vor der nativen Darstellung durchgesetzt:

- 1–20 Spalten
- 1–100 Datenzeilen zuzüglich der Kopfzeile
- dieselbe Anzahl von Zellen in jeder Zeile
- höchstens insgesamt 10.000 Zeichen in allen Tabellenzellen einer Nachricht

Mehrere gültige Tabellenblöcke können nativ dargestellt werden, solange die Nachricht
innerhalb der Gesamtzeichenbegrenzung bleibt. Eine Tabelle, die nicht innerhalb der
nativen Vorgaben dargestellt werden kann, wird stattdessen als vollständiger deterministischer Text ausgegeben,
ohne Zeilen oder Zellen zu verlieren. Wenn dieser Text eine Slack-Nachricht überschreitet, verwenden
Sendungen und Slash-Antworten geordnete Textabschnitte. Tabellenbearbeitungen schlagen mit einem expliziten
Größenfehler fehl, anstatt Zeilen einer vorhandenen Nachricht stillschweigend abzuschneiden.

Jede aus einer portablen Präsentation erzeugte native Tabelle enthält außerdem eine übergeordnete
Textdarstellung für Screenreader, Benachrichtigungen, die Sitzungsspiegelung und
Clients, die den Block nicht darstellen können. Unverarbeitete Diagramm- und Tabellenwerte bleiben
in der Ersatzdarstellung unverändert, sodass Zellendaten wie `<@U123>` nicht zu einer Slack-Erwähnung werden.
Wenn Slack native Diagramm- oder Tabellenblöcke mit `invalid_blocks` ablehnt, entfernt OpenClaw
in einem einzigen begrenzten Wiederherstellungsschritt alle nativen Datenblöcke, behält gültige
gleichgeordnete Blöcke wie Schaltflächen und Auswahlfelder bei und sendet den vollständigen sichtbaren Diagramm-
und Tabellentext mit deaktivierter Slack-Formatierung. Die Zustellung von Slash-Befehlen
verfolgt Slacks Budget von fünf `response_url`-Aufrufen über den gesamten Befehl hinweg. Vor jedem
Antwortstapel wird ein vollständiger Plan ausgewählt, der in die verbleibenden Aufrufe passt, oder der Vorgang schlägt
vor dem Veröffentlichen dieses Stapels fehl.

Nur explizite `presentation`-Tabellenblöcke werden zu nativen Tabellen hochgestuft.
Markdown-Pipe-Tabellen bleiben verfasster Text; OpenClaw versucht nicht, die Tabellenstruktur
oder Zelltypen zu erraten. Vorhandene vertrauenswürdige Produzenten nativer Slack-Inhalte können weiterhin
unverarbeitete Blöcke über `channelData.slack.blocks` übergeben; OpenClaw leitet Ersatztext
aus gültigen unverarbeiteten `data_table`-Zellen ab, während fehlerhafte benutzerdefinierte Blöcke
auf ihre Beschriftung oder die allgemeine Block-Kit-Ersatzdarstellung zurückfallen können. Portable Ausgaben von Agenten,
CLI und Plugins sollten `presentation` verwenden.

## Interaktive Antworten

Slack kann von Agenten erstellte interaktive Antwortsteuerelemente darstellen, diese Funktion ist jedoch standardmäßig deaktiviert.
Für neue Ausgaben von Agenten, CLI und Plugins sind die gemeinsamen
`presentation`-Schaltflächen oder Auswahlblöcke vorzuziehen. Sie verwenden denselben Slack-Interaktionspfad
und können zugleich auf anderen Kanälen vereinfacht dargestellt werden.

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

Wenn die Funktion aktiviert ist, können Agenten weiterhin veraltete, ausschließlich für Slack bestimmte Antwortdirektiven ausgeben:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Diese Direktiven werden in Slack Block Kit kompiliert und leiten Klicks oder Auswahlen
über den vorhandenen Slack-Pfad für Interaktionsereignisse zurück. Behalten Sie sie für alte
Prompts und Slack-spezifische Ausweichmöglichkeiten bei; verwenden Sie für neue
portable Steuerelemente die gemeinsame Präsentation.

Die APIs des Direktiven-Compilers sind für neuen Produzentencode ebenfalls veraltet:

- `compileSlackInteractiveReplies(...)`
- `parseSlackOptionsLine(...)`
- `isSlackInteractiveRepliesEnabled(...)`
- `buildSlackInteractiveBlocks(...)`

Verwenden Sie `presentation`-Payloads und `buildSlackPresentationBlocks(...)` für neue,
von Slack dargestellte Steuerelemente.

Hinweise:

- Dies ist eine Slack-spezifische Legacy-Benutzeroberfläche. Andere Kanäle übersetzen Slack-Block-
  Kit-Direktiven nicht in ihre eigenen Schaltflächensysteme.
- Die interaktiven Callback-Werte sind von OpenClaw generierte undurchsichtige Tokens, keine unbearbeiteten, vom Agenten erstellten Werte.
- Wenn generierte interaktive Blöcke die Limits von Slack Block Kit überschreiten würden, greift OpenClaw auf die ursprüngliche Textantwort zurück, anstatt eine ungültige Block-Nutzlast zu senden.

### Plugin-eigene Modalübermittlungen

Slack-Plugins, die einen interaktiven Handler registrieren, können außerdem die Lebenszyklusereignisse
`view_submission` und `view_closed` empfangen, bevor OpenClaw
die Nutzlast für das für den Agenten sichtbare Systemereignis komprimiert. Verwenden Sie beim Öffnen
eines Slack-Modals eines dieser Routing-Muster:

- Setzen Sie `callback_id` auf `openclaw:<namespace>:<payload>`.
- Oder behalten Sie ein vorhandenes `callback_id` bei und fügen Sie `pluginInteractiveData:
"<namespace>:<payload>"` in das `private_metadata` des Modals ein.

Der Handler empfängt `ctx.interaction.kind` als `view_submission` oder
`view_closed`, normalisiertes `inputs` und das vollständige unbearbeitete `stateValues`-Objekt von
Slack. Für den Aufruf des Plugin-Handlers genügt Routing ausschließlich anhand der Callback-ID; schließen Sie
die vorhandenen Benutzer-/Sitzungs-Routingfelder `private_metadata` des Modals ein, wenn das
Modal zusätzlich ein für den Agenten sichtbares Systemereignis erzeugen soll. Der Agent empfängt ein
kompaktes, redigiertes `Slack interaction: ...`-Systemereignis. Wenn der Handler
`systemEvent.summary`, `systemEvent.reference` oder `systemEvent.data` zurückgibt, werden diese
Felder in dieses kompakte Ereignis aufgenommen, damit der Agent auf
Plugin-eigenen Speicher verweisen kann, ohne die vollständige Formularnutzlast zu sehen.

## Native Genehmigungen in Slack

Slack kann mit interaktiven Schaltflächen und Interaktionen als nativer Genehmigungsclient fungieren, statt auf die Web-Benutzeroberfläche oder das Terminal zurückzugreifen.

- Exec- und Plugin-Genehmigungen können als Slack-native Block-Kit-Aufforderungen dargestellt werden.
- `channels.slack.execApprovals.*` bleibt die Konfiguration zum Aktivieren des nativen Exec-Genehmigungsclients und zum Routing per DM/Kanal.
- DMs für Exec-Genehmigungen verwenden `channels.slack.execApprovals.approvers` oder `commands.ownerAllowFrom`.
- Plugin-Genehmigungen verwenden Slack-native Schaltflächen, wenn Slack als nativer Genehmigungsclient für die Ursprungssitzung aktiviert ist oder wenn `approvals.plugin` zur ursprünglichen Slack-Sitzung oder zu einem Slack-Ziel routet.
- DMs für Plugin-Genehmigungen verwenden Slack-Plugin-Genehmiger aus `channels.slack.allowFrom`, dem benannten Konto `allowFrom` oder der Standardroute des Kontos.
- Die Autorisierung der Genehmiger wird weiterhin durchgesetzt: Genehmiger, die ausschließlich für Exec zuständig sind, können Plugin-Anfragen nur genehmigen, wenn sie zugleich Plugin-Genehmiger sind.

Dies verwendet dieselbe gemeinsame Oberfläche für Genehmigungsschaltflächen wie andere Kanäle. Wenn `interactivity` in den Einstellungen Ihrer Slack-App aktiviert ist, werden Genehmigungsaufforderungen direkt in der Unterhaltung als Block-Kit-Schaltflächen dargestellt.
Wenn diese Schaltflächen vorhanden sind, bilden sie die primäre Benutzerführung für Genehmigungen; OpenClaw
sollte einen manuellen `/approve`-Befehl nur einfügen, wenn das Tool-Ergebnis angibt, dass
Chat-Genehmigungen nicht verfügbar sind oder die manuelle Genehmigung der einzige Weg ist.

Konfigurationspfad:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (optional; greift nach Möglichkeit auf `commands.ownerAllowFrom` zurück)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, Standard: `dm`)
- `agentFilter`, `sessionFilter`

Slack aktiviert native Exec-Genehmigungen automatisch, wenn `enabled` nicht gesetzt oder `"auto"` ist und mindestens
ein Exec-Genehmiger aufgelöst wird. Slack kann über diesen Pfad des nativen Clients auch native Plugin-Genehmigungen
verarbeiten, wenn Slack-Plugin-Genehmiger aufgelöst werden und die Anfrage den Filtern des nativen Clients entspricht. Setzen Sie
`enabled: false`, um Slack ausdrücklich als nativen Genehmigungsclient zu deaktivieren. Setzen Sie `enabled: true`, um
native Genehmigungen zu erzwingen, wenn Genehmiger aufgelöst werden. Das Deaktivieren von Slack-Exec-Genehmigungen deaktiviert nicht
die native Zustellung von Slack-Plugin-Genehmigungen, die über `approvals.plugin` aktiviert ist; für die Zustellung von Plugin-Genehmigungen
werden stattdessen Slack-Plugin-Genehmiger verwendet.

Standardverhalten ohne explizite Slack-Exec-Genehmigungskonfiguration:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Eine explizite Slack-native Konfiguration ist nur erforderlich, wenn Sie Genehmiger überschreiben, Filter hinzufügen oder
die Zustellung im Ursprungs-Chat aktivieren möchten:

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

Die gemeinsame `approvals.exec`-Weiterleitung ist davon getrennt. Verwenden Sie sie nur, wenn Aufforderungen zur Exec-Genehmigung zusätzlich
an andere Chats oder explizite Out-of-Band-Ziele geroutet werden müssen. Die gemeinsame `approvals.plugin`-Weiterleitung ist ebenfalls
separat; die native Slack-Zustellung unterdrückt diesen Rückgriff nur, wenn Slack die Plugin-
Genehmigungsanfrage nativ verarbeiten kann.

`/approve` im selben Chat funktioniert auch in Slack-Kanälen und DMs, die bereits Befehle unterstützen. Das vollständige Weiterleitungsmodell für Genehmigungen finden Sie unter [Exec-Genehmigungen](/de/tools/exec-approvals).

## Ereignisse und Betriebsverhalten

- Bearbeitungen und Löschungen von Nachrichten werden Systemereignissen zugeordnet.
- Thread-Broadcasts (Thread-Antworten mit „Also send to channel“) werden als normale Benutzernachrichten verarbeitet.
- Ereignisse zum Hinzufügen und Entfernen von Reaktionen werden Systemereignissen zugeordnet.
- Beitritte und Austritte von Mitgliedern, Erstellen und Umbenennen von Kanälen sowie Hinzufügen und Entfernen von Pins werden Systemereignissen zugeordnet.
- Optionales Anwesenheits-Polling kann einen beobachteten Übergang eines menschlichen Teilnehmers von `away` zu `active` der zuletzt aktiven geeigneten Slack-Sitzung des Teilnehmers zuordnen. Standardmäßig ist dies deaktiviert.
- `channel_id_changed` kann Kanalkonfigurationsschlüssel migrieren, wenn `configWrites` aktiviert ist.
- Metadaten zu Thema und Zweck eines Kanals werden als nicht vertrauenswürdiger Kontext behandelt und können in den Routingkontext eingefügt werden.
- Der Thread-Starter und die anfängliche Kontextbefüllung aus dem Thread-Verlauf werden gegebenenfalls anhand konfigurierter Absender-Zulassungslisten gefiltert.
- Blockaktionen, Kurzbefehle und Modalinteraktionen geben strukturierte `Slack interaction: ...`-Systemereignisse mit umfangreichen Nutzlastfeldern aus:
  - Blockaktionen: ausgewählte Werte, Beschriftungen, Auswahlwerte und `workflow_*`-Metadaten
  - globale Kurzbefehle: Callback- und Akteursmetadaten, an die direkte Sitzung des Akteurs geroutet
  - Nachrichtenkurzbefehle: Callback-, Akteurs-, Kanal-, Thread- und Kontextdaten der ausgewählten Nachricht
  - Modalereignisse `view_submission` und `view_closed` mit gerouteten Kanalmetadaten und Formulareingaben

Definieren Sie globale oder Nachrichtenkurzbefehle in der Konfiguration Ihrer Slack-App und verwenden Sie eine beliebige nicht leere Callback-ID. OpenClaw bestätigt passende Kurzbefehl-Nutzlasten, wendet dieselben Absenderrichtlinien für DMs und Kanäle wie bei anderen Slack-Interaktionen an und stellt das bereinigte Ereignis für die geroutete Agentensitzung in die Warteschlange. Trigger-IDs und Antwort-URLs werden aus dem Agentenkontext entfernt.

### Anwesenheitsereignisse

Slack sendet Anwesenheitsänderungen weder über die Events API noch über Socket Mode. OpenClaw kann stattdessen [`users.getPresence`](https://docs.slack.dev/reference/methods/users.getPresence/) für menschliche Teilnehmer abfragen, deren Nachrichten die normalen Slack-Zugriffs- und Routingprüfungen bestanden haben.

```json5
{
  channels: {
    slack: {
      presenceEvents: { mode: "auto" },
      channels: {
        C0123456789: { presenceEvents: { mode: "on" } },
        C0987654321: { presenceEvents: { mode: "off" } },
      },
    },
  },
}
```

- `off` (Standard): kein Anwesenheits-Timer und keine Slack-API-Aufrufe.
- `auto`: Überwacht DMs, MPIMs und Slack-Threads, die in den letzten 24 Stunden aktiv waren, mit höchstens 8 beobachteten menschlichen Teilnehmern. Kanalsitzungen auf oberster Ebene sind ausgeschlossen.
- `on`: Überwacht dieselben Unterhaltungen ohne Teilnehmerbegrenzung und schließt Kanalsitzungen auf oberster Ebene ein. Verwenden Sie eine kanalspezifische Überschreibung, um einen Kanal zu erzwingen oder zu unterdrücken.

OpenClaw fragt pro Slack-Konto höchstens 45 eindeutige Benutzer pro Minute ab, übernimmt das erste Ergebnis, ohne den Agenten zu wecken, und weckt ihn nur bei einem beobachteten Übergang von `away` zu `active`. Pro Slack-Konto und Benutzer gilt eine dauerhafte Abklingzeit von 8 Stunden, selbst wenn diese Person an mehreren Threads teilnimmt. Das Ereignis wird nur an die zuletzt aktive geeignete Unterhaltung dieser Person geroutet und weist den Agenten an, Speicher/Wiki sowie bekannten Zeitzonenkontext zu berücksichtigen, bevor er entscheidet, ob er eine kurze Begrüßung sendet. Der Agent kann schweigen.

Das Bot-Token benötigt `users:read`, das bereits im empfohlenen Manifest enthalten ist. Anwesenheitsereignisse sind für organisationsweite Installationen in Enterprise Grid nicht verfügbar.

## Konfigurationsreferenz

Primäre Referenz: [Konfigurationsreferenz – Slack](/de/gateway/config-channels#slack).

<Accordion title="Wichtige Slack-Felder">

- Modus/Authentifizierung: `mode`, `enterpriseOrgInstall`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- DM-Zugriff: `dm.enabled`, `dmPolicy`, `allowFrom` (Legacy: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- Kompatibilitätsschalter: `dangerouslyAllowNameMatching` (Notfalloption; deaktiviert lassen, sofern nicht erforderlich)
- Kanalzugriff: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- Threads/Verlauf: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- Wecken bei Anwesenheit: `presenceEvents.mode`, `channels.*.presenceEvents.mode` (`off|auto|on`; Standard `off`)
- Zustellung: `textChunkLimit`, `streaming.chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- Vorschauen: `unfurlLinks` (Standard: `false`), `unfurlMedia` zur Steuerung der Link-/Medienvorschau für `chat.postMessage`; setzen Sie `unfurlLinks: true`, um Linkvorschauen wieder zu aktivieren
- Betrieb/Funktionen: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Keine Antworten in Kanälen">
    Prüfen Sie der Reihe nach:

    - `groupPolicy`
    - Kanal-Zulassungsliste (`channels.slack.channels`) – **Schlüssel müssen Kanal-IDs sein** (`C12345678`), keine Namen (`#channel-name`). Namensbasierte Schlüssel schlagen unter `groupPolicy: "allowlist"` unbemerkt fehl, da das Kanal-Routing standardmäßig zuerst anhand der ID erfolgt. So finden Sie eine ID: Klicken Sie in Slack mit der rechten Maustaste auf den Kanal → **Copy link** – der Wert `C...` am Ende der URL ist die Kanal-ID.
    - `requireMention`
    - kanalspezifische `users`-Zulassungsliste
    - `messages.groupChat.visibleReplies`: Normale Gruppen-/Kanalanfragen verwenden standardmäßig `"automatic"`. Wenn Sie `"message_tool"` aktiviert haben und die Protokolle Assistententext ohne Aufruf von `message(action=send)` zeigen, hat das Modell den sichtbaren Pfad des Nachrichtentools nicht verwendet. Der endgültige Text bleibt in diesem Modus privat; prüfen Sie das ausführliche Gateway-Protokoll auf unterdrückte Nutzlastmetadaten oder setzen Sie die Option auf `"automatic"`, wenn jede normale abschließende Antwort des Assistenten über den Legacy-Pfad veröffentlicht werden soll.
    - `messages.groupChat.unmentionedInbound`: Wenn dies `"room_event"` ist, dient nicht erwähnte zulässige Kanalunterhaltung als Umgebungskontext und bleibt stumm, sofern der Agent nicht das Tool `message` aufruft. Siehe [Umgebungsraumereignisse](/de/channels/ambient-room-events).

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

  <Accordion title="DM-Nachrichten werden ignoriert">
    Prüfen Sie:

    - `channels.slack.dm.enabled`
    - `channels.slack.dmPolicy` (oder veraltet `channels.slack.dm.policy`)
    - Kopplungsgenehmigungen / Einträge in der Zulassungsliste (`dmPolicy: "open"` erfordert weiterhin `channels.slack.allowFrom: ["*"]`)
    - Gruppen-DMs verwenden die MPIM-Verarbeitung; aktivieren Sie `channels.slack.dm.groupEnabled` und nehmen Sie, falls konfiguriert, das MPIM in `channels.slack.dm.groupChannels` auf
    - Slack-Assistant-DM-Ereignisse: Ausführliche Protokolle mit `drop message_changed`
      bedeuten normalerweise, dass Slack ein bearbeitetes Assistant-Thread-Ereignis ohne einen
      aus den Nachrichtenmetadaten ermittelbaren menschlichen Absender gesendet hat

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket Mode stellt keine Verbindung her">
    Überprüfen Sie Bot- und App-Token sowie die Aktivierung von Socket Mode in den Slack-App-Einstellungen.
    Das App-Level Token benötigt `connections:write`, und das Bot User OAuth Token
    muss zu derselben Slack-App und demselben Workspace wie das App-Token gehören.

    Wenn `openclaw channels status --probe --json` den Wert `botTokenStatus` oder
    `appTokenStatus: "configured_unavailable"` anzeigt, ist das Slack-Konto
    konfiguriert, aber die aktuelle Laufzeit konnte den durch SecretRef bereitgestellten
    Wert nicht auflösen.

    Protokolle wie `slack socket mode failed to start; retry ...` weisen auf behebbare
    Startfehler hin. Fehlende Berechtigungsbereiche, widerrufene Token und ungültige Authentifizierung führen
    stattdessen zu einem sofortigen Fehler. Ein `slack token mismatch ...`-Protokoll bedeutet, dass das Bot-Token und das App-Token
    offenbar zu unterschiedlichen Slack-Apps gehören; korrigieren Sie die Zugangsdaten der Slack-App.

  </Accordion>

  <Accordion title="HTTP Mode empfängt keine Ereignisse">
    Überprüfen Sie:

    - Signatur-Secret
    - Webhook-Pfad
    - Slack Request URLs (Events + Interactivity + Slash Commands)
    - eindeutiges `webhookPath` pro HTTP-Konto
    - die öffentliche URL terminiert TLS und leitet Anfragen an den Gateway-Pfad weiter
    - der Pfad `request_url` der Slack-App stimmt exakt mit `channels.slack.webhookPath` überein (Standard: `/slack/events`)

    Wenn `signingSecretStatus: "configured_unavailable"` in Konto-Snapshots
    erscheint, ist das HTTP-Konto konfiguriert, aber die aktuelle Laufzeit konnte das durch
    SecretRef bereitgestellte Signatur-Secret nicht auflösen.

    Ein wiederholtes `slack: webhook path ... already registered`-Protokoll bedeutet, dass zwei HTTP-
    Konten dasselbe `webhookPath` verwenden; weisen Sie jedem Konto einen eigenen Pfad zu.

  </Accordion>

  <Accordion title="Native Befehle/Slash-Befehle werden nicht ausgelöst">
    Überprüfen Sie, welche Variante Sie verwenden wollten:

    - nativer Befehlsmodus (`channels.slack.commands.native: true`) mit entsprechenden in Slack registrierten Slash-Befehlen
    - oder Einzel-Slash-Befehlsmodus (`channels.slack.slashCommand.enabled: true`)

    Slack erstellt oder entfernt Slash-Befehle nicht automatisch. `commands.native: "auto"` aktiviert keine nativen Slack-Befehle; verwenden Sie `true` und erstellen Sie die entsprechenden Befehle in der Slack-App. Im HTTP Mode muss jeder Slack-Slash-Befehl die Gateway-URL enthalten. Im Socket Mode werden Befehlsnutzdaten über den WebSocket empfangen und Slack ignoriert `slash_commands[].url`.

    Überprüfen Sie außerdem `commands.useAccessGroups`, die DM-Autorisierung, Kanal-Zulassungslisten
    und kanalspezifische `users`-Zulassungslisten. Slack gibt kurzlebige Fehler für
    blockierte Absender von Slash-Befehlen zurück, darunter:

    - `This channel is not allowed.`
    - `You are not authorized to use this command here.`

  </Accordion>
</AccordionGroup>

## Medienreferenz für Anhänge

Slack kann heruntergeladene Medien an den Agentendurchlauf anhängen, wenn das Herunterladen von Slack-Dateien erfolgreich ist und die Größenbeschränkungen eingehalten werden. Audioclips können transkribiert werden, Bilddateien können den Pfad zur Medienerkennung durchlaufen oder direkt an ein visionsfähiges Antwortmodell übergeben werden, und andere Dateien bleiben als herunterladbarer Dateikontext verfügbar.

### Unterstützte Medientypen

| Medientyp                      | Quelle               | Aktuelles Verhalten                                                               | Hinweise                                                                  |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Slack-Audioclips               | Slack-Datei-URL      | Heruntergeladen und über die gemeinsame Audiotranskription verarbeitet            | Erfordert `files:read` und ein funktionierendes `tools.media.audio`-Modell oder eine CLI |
| JPEG-/PNG-/GIF-/WebP-Bilder    | Slack-Datei-URL      | Heruntergeladen und zur visionsfähigen Verarbeitung an den Durchlauf angehängt    | Limit pro Datei: `channels.slack.mediaMaxMb` (Standard: 20 MB)                     |
| PDF-Dateien                    | Slack-Datei-URL      | Heruntergeladen und als Dateikontext für Tools wie `download-file` oder `pdf` bereitgestellt | Eingehende Slack-Daten konvertieren PDFs nicht automatisch in Bild-Vision-Eingaben |
| Andere Dateien                 | Slack-Datei-URL      | Wenn möglich heruntergeladen und als Dateikontext bereitgestellt                  | Binärdateien werden nicht als Bildeingabe behandelt                       |
| Thread-Antworten               | Dateien der Thread-Ausgangsnachricht | Dateien der Ausgangsnachricht können als Kontext geladen werden, wenn die Antwort keine direkten Medien enthält | Bei Ausgangsnachrichten, die nur Dateien enthalten, wird ein Anhangsplatzhalter verwendet |
| Nachrichten mit mehreren Dateien | Mehrere Slack-Dateien | Jede Datei wird unabhängig ausgewertet                                           | Die Slack-Verarbeitung ist auf acht Dateien pro Nachricht begrenzt        |

### Eingehende Verarbeitungspipeline

Wenn eine Slack-Nachricht mit Dateianhängen eingeht:

1. OpenClaw lädt die Datei mit dem Bot-Token von der privaten Slack-URL herunter.
2. Nach erfolgreichem Download wird die Datei in den Medienspeicher geschrieben.
3. Die Pfade und Inhaltstypen der heruntergeladenen Medien werden dem eingehenden Kontext hinzugefügt.
4. Audioclips werden an die gemeinsame Transkriptionspipeline weitergeleitet; bildfähige Modell-/Tool-Pfade können Bildanhänge aus demselben Kontext verwenden.
5. Andere Dateien bleiben als Dateimetadaten oder Medienreferenzen für Tools verfügbar, die sie verarbeiten können.

### Vererbung von Anhängen der Thread-Ausgangsnachricht

Wenn eine Nachricht in einem Thread eingeht (also ein übergeordnetes `thread_ts` besitzt):

- Wenn die Antwort selbst keine direkten Medien enthält und die einbezogene Ausgangsnachricht Dateien enthält, kann Slack die Dateien der Ausgangsnachricht als Kontext der Thread-Ausgangsnachricht laden.
- Dateien der Ausgangsnachricht werden nur beim Initialisieren einer neuen oder zurückgesetzten Thread-Sitzung geladen. Spätere reine Textantworten verwenden den vorhandenen Sitzungskontext erneut und hängen die Dateien der Ausgangsnachricht nicht erneut als neue Medien an.
- Direkte Antwortanhänge haben Vorrang vor Anhängen der Ausgangsnachricht.
- Eine Ausgangsnachricht, die nur Dateien und keinen Text enthält, wird mit einem Anhangsplatzhalter dargestellt, damit die Ausweichlösung ihre Dateien dennoch einbeziehen kann.

### Verarbeitung mehrerer Anhänge

Wenn eine einzelne Slack-Nachricht mehrere Dateianhänge enthält:

- Jeder Anhang wird unabhängig über die Medienpipeline verarbeitet.
- Referenzen auf heruntergeladene Medien werden im Nachrichtenkontext zusammengefasst.
- Die Verarbeitungsreihenfolge entspricht der Dateireihenfolge von Slack in den Ereignisnutzdaten.
- Ein Fehler beim Herunterladen eines Anhangs blockiert die anderen nicht.

### Größen-, Download- und Modelllimits

- **Größenlimit**: Standardmäßig 20 MB pro Datei. Konfigurierbar über `channels.slack.mediaMaxMb`.
- **Limit für Audiotranskription**: `tools.media.audio.maxBytes` gilt auch, wenn die heruntergeladene Datei an einen Transkriptions-Provider oder eine CLI gesendet wird.
- **Downloadfehler**: Dateien, die Slack nicht bereitstellen kann, abgelaufene URLs, nicht zugängliche Dateien, zu große Dateien und HTML-Antworten zur Slack-Authentifizierung/-Anmeldung werden übersprungen, statt als nicht unterstützte Formate gemeldet zu werden.
- **Vision-Modell**: Die Bildanalyse verwendet das aktive Antwortmodell, wenn es Vision unterstützt, oder das unter `agents.defaults.imageModel` konfigurierte Bildmodell.

### Bekannte Einschränkungen

| Szenario                                      | Aktuelles Verhalten                                                               | Problemumgehung                                                              |
| --------------------------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Abgelaufene Slack-Datei-URL                   | Datei wird übersprungen; es wird kein Fehler angezeigt                            | Laden Sie die Datei erneut in Slack hoch                                      |
| Audiotranskription nicht verfügbar            | Der Clip bleibt angehängt, es wird jedoch kein Transkript erstellt                | Konfigurieren Sie `tools.media.audio` oder installieren Sie eine unterstützte lokale Transkriptions-CLI |
| Clip ohne Bildunterschrift passiert die Erwähnungsprüfung nicht | Wird nach privater spekulativer Transkription verworfen; Transkript und Download werden gelöscht | Konfigurieren Sie ein Erwähnungsmuster für gesprochene Namen, fügen Sie eine eingegebene Bot-Erwähnung hinzu oder verwenden Sie eine DM |
| Vision-Modell nicht konfiguriert              | Bildanhänge werden als Medienreferenzen gespeichert, aber nicht als Bilder analysiert | Konfigurieren Sie `agents.defaults.imageModel` oder verwenden Sie ein visionsfähiges Antwortmodell |
| Sehr große Bilder (> 20 MB standardmäßig)     | Werden gemäß Größenlimit übersprungen                                              | Erhöhen Sie `channels.slack.mediaMaxMb`, sofern Slack dies zulässt                     |
| Weitergeleitete/geteilte Anhänge              | Text und von Slack gehostete Bild-/Dateimedien werden nach Möglichkeit verarbeitet | Teilen Sie sie direkt erneut im OpenClaw-Thread                               |
| PDF-Anhänge                                   | Werden als Datei-/Medienkontext gespeichert und nicht automatisch über Bild-Vision verarbeitet | Verwenden Sie `download-file` für Dateimetadaten oder das Tool `pdf` für die PDF-Analyse |

### Zugehörige Dokumentation

- [Pipeline zur Medienerkennung](/de/nodes/media-understanding)
- [Audio- und Sprachnotizen](/de/nodes/audio)
- [PDF-Tool](/de/tools/pdf)

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Kopplung" icon="link" href="/de/channels/pairing">
    Koppeln Sie einen Slack-Benutzer mit dem Gateway.
  </Card>
  <Card title="Gruppen" icon="users" href="/de/channels/groups">
    Verhalten von Kanälen und Gruppen-DMs.
  </Card>
  <Card title="Kanal-Routing" icon="route" href="/de/channels/channel-routing">
    Leiten Sie eingehende Nachrichten an Agenten weiter.
  </Card>
  <Card title="Sicherheit" icon="shield" href="/de/gateway/security">
    Bedrohungsmodell und Härtung.
  </Card>
  <Card title="Konfiguration" icon="sliders" href="/de/gateway/configuration">
    Konfigurationsstruktur und Rangfolge.
  </Card>
  <Card title="Slash-Befehle" icon="terminal" href="/de/tools/slash-commands">
    Befehlskatalog und Verhalten.
  </Card>
</CardGroup>
