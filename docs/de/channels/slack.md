---
read_when:
    - Slack einrichten oder den Socket-, HTTP- oder Relay-Modus von Slack debuggen
summary: Slack-Einrichtung und Laufzeitverhalten (Socket Mode, HTTP Request URLs und Relay-Modus)
title: Slack
x-i18n:
    generated_at: "2026-07-12T15:05:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c29d2dccefc54d3972fd8ff4edccfdc3779c030a8d51f29a750a0057d9f0998e
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

Socket Mode und HTTP Request URLs bieten denselben Funktionsumfang für Nachrichten, Slash-Befehle, App Home und Interaktionen. Wählen Sie anhand der Bereitstellungsarchitektur, nicht anhand der Funktionen.

| Aspekt                       | Socket Mode (Standard)                                                                                                                                | HTTP Request URLs                                                                                              |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Öffentliche Gateway-URL      | Nicht erforderlich                                                                                                                                   | Erforderlich (DNS, TLS, Reverse-Proxy oder Tunnel)                                                             |
| Ausgehendes Netzwerk         | Ausgehendes WSS zu `wss-primary.slack.com` muss erreichbar sein                                                                                       | Kein ausgehendes WS; nur eingehendes HTTPS                                                                     |
| Erforderliche Token          | Bot-Token + App-Level Token mit `connections:write`                                                                                                   | Bot-Token + Signing Secret                                                                                     |
| Entwicklungs-Laptop / hinter Firewall | Funktioniert ohne weitere Anpassungen                                                                                                       | Erfordert einen öffentlichen Tunnel (ngrok, Cloudflare Tunnel, Tailscale Funnel) oder ein Staging-Gateway      |
| Horizontale Skalierung       | Eine Socket-Mode-Sitzung pro App und Host; mehrere Gateways benötigen separate Slack-Apps                                                             | Zustandsloser POST-Handler; mehrere Gateway-Replikate können hinter einem Load-Balancer dieselbe App verwenden |
| Mehrere Konten auf einem Gateway | Unterstützt; jedes Konto öffnet sein eigenes WS                                                                                                  | Unterstützt; jedes Konto benötigt einen eindeutigen `webhookPath` (Standard `/slack/events`), damit Registrierungen nicht kollidieren |
| Transport für Slash-Befehle  | Zustellung über die WS-Verbindung; `slash_commands[].url` wird ignoriert                                                                              | Slack sendet POST-Anfragen an `slash_commands[].url`; das Feld ist für die Weiterleitung des Befehls erforderlich |
| Anfragesignierung            | Wird nicht verwendet (Authentifizierung erfolgt über das App-Level Token)                                                                             | Slack signiert jede Anfrage; OpenClaw verifiziert sie mit `signingSecret`                                      |
| Wiederherstellung bei Verbindungsabbruch | Die automatische Wiederverbindung des Slack SDK ist aktiviert; OpenClaw startet fehlgeschlagene Socket-Mode-Sitzungen außerdem mit begrenztem Backoff neu. Die Transportoptimierung für Pong-Zeitüberschreitungen gilt. | Keine dauerhafte Verbindung, die abbrechen kann; Wiederholungsversuche erfolgen pro Anfrage durch Slack        |

<Note>
  **Wählen Sie Socket Mode** für Hosts mit einem einzelnen Gateway, Entwicklungs-Laptops und lokale Netzwerke, die ausgehend auf `*.slack.com` zugreifen können, aber kein eingehendes HTTPS akzeptieren können.

**Wählen Sie HTTP Request URLs**, wenn Sie mehrere Gateway-Replikate hinter einem Load-Balancer betreiben, ausgehendes WSS blockiert ist, aber eingehendes HTTPS erlaubt ist, oder Sie Slack-Webhooks bereits an einem Reverse-Proxy terminieren.
</Note>

<Warning>
  Slack kann mehrere Socket-Mode-Verbindungen für eine App aufrechterhalten und jede Nutzlast an eine beliebige Verbindung zustellen. Separate OpenClaw-Gateways, die dieselbe Slack-App verwenden, benötigen daher eine gleichwertige Routing- und Autorisierungskonfiguration. Verwenden Sie andernfalls eine separate Slack-App pro Gateway, einen einzelnen Relay-Eingang oder HTTP Request URLs hinter einem Load-Balancer. Siehe [Socket Mode verwenden](https://docs.slack.dev/apis/events-api/using-socket-mode#using-multiple-connections).
</Warning>

### Relay-Modus

Der Relay-Modus trennt den Slack-Eingang vom OpenClaw-Gateway. Ein vertrauenswürdiger Router verwaltet die einzelne Slack-Socket-Mode-Verbindung, wählt ein Ziel-Gateway aus und leitet ein typisiertes Ereignis über ein authentifiziertes WebSocket weiter. Das Gateway verwendet weiterhin sein eigenes Bot-Token für ausgehende Aufrufe der Slack Web API.

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

Die Relay-URL muss `wss://` verwenden, sofern sie nicht auf localhost verweist. Behandeln Sie das Bearer-Token und die Routentabelle des Routers als Teil der Slack-Autorisierungsgrenze: Weitergeleitete Ereignisse gelangen als autorisierte Aktivierungen in den normalen Slack-Nachrichten-Handler. Eine vom Router bereitgestellte `slack_identity` im WebSocket-Frame `hello` kann den standardmäßigen ausgehenden Benutzernamen und das Symbol festlegen; eine explizit vom Aufrufer bereitgestellte Identität hat weiterhin Vorrang. Die Relay-Verbindung stellt die Verbindung mit demselben begrenzten Backoff-Zeitverhalten wie Socket Mode wieder her und löscht die vom Router bereitgestellte Identität bei jeder Trennung.

### Organisationsweite Installationen in Enterprise Grid

Ein Slack-Konto kann Nachrichten aus jedem Workspace empfangen, der von einer
organisationsweiten Enterprise-Grid-Installation abgedeckt wird. Wählen Sie direkten Socket Mode oder HTTP
Request URLs; der Relay-Modus wird für Enterprise-Konten nicht unterstützt. Beide
nachstehenden Manifeste mit minimalen Berechtigungen aktivieren nur den V1-Ereignispfad `message` und `app_mention`,
unmittelbare Antworten und vom Listener verwaltete Statusreaktionen.

#### Socket Mode

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack-Connector für OpenClaw"
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

Lassen Sie die App von einem Enterprise Grid Org Admin oder Org Owner genehmigen, installieren Sie sie auf
Organisationsebene und wählen Sie die Workspaces aus, die von der Installation abgedeckt werden.
Vergewissern Sie sich vor dem Start von OpenClaw, dass die App in jedem vorgesehenen Workspace verfügbar ist.
Generieren Sie für Socket Mode ein App-Level Token mit `connections:write`
und kopieren Sie anschließend das Bot-Token aus der Organisationsinstallation. Konfigurieren Sie das Konto, das
das organisationsweit installierte Bot-Token verwendet:

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

Verwenden Sie den HTTP-Modus, wenn das Gateway über einen öffentlichen HTTPS-Endpunkt verfügt und keine
Socket-Mode-Verbindung öffnet. Ersetzen Sie die Beispiel-URL durch die öffentliche
`webhookPath`-URL des Gateways (Standard `/slack/events`):

```json
{
  "display_information": {
    "name": "OpenClaw",
    "description": "Slack-Connector für OpenClaw"
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

Lassen Sie die App von einem Enterprise Grid Org Admin oder Org Owner genehmigen, installieren Sie sie auf
Organisationsebene und wählen Sie die Workspaces aus, die von der Installation abgedeckt werden.
Nachdem Slack die Request URL verifiziert hat, kopieren Sie das Bot-Token der Organisationsinstallation und
das **Basic Information -> App Credentials -> Signing Secret** der App. Konfigurieren Sie
das Enterprise-Konto mit demselben Pfad der Request URL:

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

Beim Start verifiziert OpenClaw `enterpriseOrgInstall` mit Slack `auth.test`.
Ein organisationsweit installiertes Token ohne das Flag oder ein Workspace-Token mit dem Flag
führt zu einem fehlgeschlagenen Start. Slack bleibt die maßgebliche Quelle dafür, welche Workspaces
die Installation autorisiert haben; OpenClaw wendet anschließend die konfigurierten Richtlinien für Kanäle, Benutzer,
Direktnachrichten und Erwähnungen auf jedes zugestellte Ereignis an. Enterprise V1 verwirft alle
von Bots erstellten `message`- und `app_mention`-Ereignisse vor der Weiterleitung, unabhängig von
`allowBots`, da Organisationsinstallationen keine stabile, Workspace-qualifizierte
Bot-Identität zur Verhinderung von Schleifen bereitstellen.

Die Enterprise-Unterstützung ist bewusst auf direkte Socket-Mode- oder HTTP-
Ereignisse vom Typ `message` und `app_mention` sowie deren unmittelbare Antworten beschränkt. Relay-Modus,
Slash-Befehle, Interaktionen, App Home, Listener für Reaktionsereignisse, Pins, Slack-
Aktionswerkzeuge, Slack-native Genehmigungen, Bindings, Zustellung in Warteschlangen oder nach Zeitplan
und proaktive Sendungen sind für ein Enterprise-Konto nicht verfügbar. Ausgehende
Bestätigungs-, Eingabe- und Statusreaktionen werden über den
vom Listener verwalteten Slack-Client unterstützt und erfordern `reactions:write`; eingehende Reaktions-
benachrichtigungen und Reaktionsaktionswerkzeuge bleiben nicht verfügbar.

Unmittelbare Antworten verwenden das standardmäßige Slack-Zustellungsverhalten für Blöcke,
Medien, Metadaten, Identitäts-Fallback, Unfurls und Empfangsbestätigungen wieder, jedoch nur solange der
validierte, vom Listener verwaltete Client im aktiven Ereignisdurchlauf verbleibt. Die
In-Memory-Sendewarteschlange und Datensätze zur Thread-Teilnahme werden nach dem
Workspace dieses Ereignisses partitioniert; der Client selbst wird niemals serialisiert oder persistent gespeichert.

Channel-Richtlinienschlüssel und `dm.groupChannels`-Einträge müssen unverarbeitete, stabile Slack-Channel-IDs oder die Form
`channel:<id>` verwenden. OpenClaw normalisiert beide Formen für den
Laufzeitabgleich zur unverarbeiteten Channel-ID; die Präfixe `slack:`,
`group:` und `mpim:` verhindern den Start.
Benutzerrichtlinieneinträge müssen stabile Slack-Benutzer-IDs verwenden; Namen, Slugs, Anzeigenamen
und E-Mail-Adressen verhindern den Start. IDs müssen das kanonische großgeschriebene
Präfix und den Textkörper von Slack verwenden (zum Beispiel `C0123456789` oder `U0123456789`); kleingeschriebene und
verkürzte ähnlich aussehende Werte verhindern den Start. Enterprise-Konten können
`dangerouslyAllowNameMatching` nicht aktivieren. Enterprise-Konten können den globalen
`mentionPatterns.mode` festlegen, aber `mentionPatterns.allowIn` und
`mentionPatterns.denyIn` verhindern den Start, da reine Slack-Channel-IDs nicht
Workspace-qualifiziert sind und in verschiedenen Workspaces wiederverwendet werden können. Workspace-Installationen
behalten das bestehende bereichsbezogene Verhalten für Erwähnungsmuster bei. Jeder akzeptierte Workspace
erhält eine separate Identität für Routing, Sitzung, Transkript, Deduplizierung, Verlauf und Cache,
selbst wenn sich Slack-IDs überschneiden. Innerhalb des `message`-Streams werden gewöhnliche Benutzernachrichten
und von Benutzern erstellte `file_share`-Ereignisse unterstützt; andere Nachrichtenuntertypen werden
vor der Autorisierung oder der Verarbeitung von Systemereignissen abgelehnt.

Enterprise-Direktnachrichten müssen entweder deaktiviert sein (`dm.enabled=false` oder
`dmPolicy="disabled"`) oder mit `dmPolicy="open"` und
einem wirksamen Konto-`allowFrom`, das den Literalwert `"*"` enthält, ausdrücklich geöffnet werden. Eine leere
Positivliste oder benutzerspezifische IDs ohne `"*"` verhindern den Start. Kopplung und
benutzerspezifische Positivlisten für Direktnachrichten werden abgelehnt, da Slack-Benutzer-IDs in diesen
Autorisierungsspeichern nicht Workspace-qualifiziert sind. Channel- und Absenderrichtlinien
gelten weiterhin für Channel-Nachrichten.

## Installation

```bash
openclaw plugins install @openclaw/slack
```

`plugins install` registriert und aktiviert das Plugin. Es hat keine Wirkung, bis Sie die Slack-App und die nachfolgenden Channel-Einstellungen konfigurieren. Allgemeine Regeln für die Plugin-Installation finden Sie unter [Plugins](/de/tools/plugin).

## Schnelleinrichtung

Die Manifeste in diesem Abschnitt erstellen eine Workspace-bezogene Installation. Verwenden Sie für eine
organisationsweite Installation in einer Enterprise Grid-Organisation stattdessen das spezielle
[organisationsweite Manifest und den entsprechenden Arbeitsablauf](#enterprise-grid-org-wide-installs).

<Tabs>
  <Tab title="Socket Mode (Standard)">
    <Steps>
      <Step title="Neue Slack-App erstellen">
        Öffnen Sie [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → wählen Sie Ihren Workspace aus → fügen Sie eines der nachfolgenden Manifeste ein → **Next** → **Create**.

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
      "assistant_description": "OpenClaw verbindet Slack-Assistant-Threads mit OpenClaw-Agenten.",
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
      "assistant_description": "OpenClaw verbindet Slack-Assistant-Threads mit OpenClaw-Agenten.",
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
          **Empfohlen** entspricht dem vollständigen Funktionsumfang des Slack-Plugins: App Home, Slash-Befehle, Dateien, Reaktionen, Pins, Gruppen-Direktnachrichten sowie das Lesen von Emojis und Benutzergruppen. Wählen Sie **Minimal**, wenn die Workspace-Richtlinie Scopes einschränkt – diese Variante deckt Direktnachrichten, den Channel-/Gruppenverlauf, Erwähnungen und Slash-Befehle ab, lässt jedoch Dateien, Reaktionen, Pins, Gruppen-Direktnachrichten (`mpim:*`), `emoji:read` und `usergroups:read` weg. Begründungen für die einzelnen Scopes sowie additive Optionen wie zusätzliche Slash-Befehle finden Sie unter [Checkliste für Manifest und Scopes](#manifest-and-scope-checklist).
        </Note>

        Nachdem Slack die App erstellt hat:

        - **Basic Information -> App-Level Tokens -> Generate Token and Scopes**: Fügen Sie `connections:write` hinzu, speichern Sie und kopieren Sie das App-Level Token.
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
        Öffnen Sie [api.slack.com/apps](https://api.slack.com/apps/new) → **Create New App** → **From a manifest** → wählen Sie Ihren Workspace aus → fügen Sie eines der nachfolgenden Manifeste ein → ersetzen Sie `https://gateway-host.example.com/slack/events` durch Ihre öffentliche Gateway-URL → **Next** → **Create**.

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
      "assistant_description": "OpenClaw verbindet Slack-Assistant-Threads mit OpenClaw-Agenten.",
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
      "assistant_description": "OpenClaw verbindet Slack-Assistant-Threads mit OpenClaw-Agenten.",
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
          **Empfohlen** entspricht dem vollständigen Funktionsumfang des Slack-Plugins; **Minimal** verzichtet für restriktive Workspaces auf Dateien, Reaktionen, Pins, Gruppen-DMs (`mpim:*`), `emoji:read` und `usergroups:read`. Die Begründung für die einzelnen Scopes finden Sie unter [Checkliste für Manifest und Scopes](#manifest-and-scope-checklist).
        </Note>

        <Info>
          Die drei URL-Felder (`slash_commands[].url`, `event_subscriptions.request_url` und `interactivity.request_url` / `message_menu_options_url`) verweisen alle auf denselben OpenClaw-Endpunkt. Das Manifestschema von Slack verlangt separate Feldnamen, OpenClaw routet jedoch nach Payload-Typ, sodass ein einzelner `webhookPath` (Standard: `/slack/events`) ausreicht. Slash-Befehle ohne `slash_commands[].url` führen im HTTP-Modus ohne Meldung keine Aktion aus.
        </Info>

        Nachdem Slack die App erstellt hat:

        - **Basic Information → App Credentials**: Kopieren Sie das **Signing Secret** zur Überprüfung von Anfragen.
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

        Weisen Sie jedem Konto einen eigenen `webhookPath` (Standard: `/slack/events`) zu, damit sich Registrierungen nicht überschneiden.
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

## Transportoptimierung für Socket Mode

OpenClaw setzt das Pong-Timeout des Slack-SDK-Clients für Socket Mode standardmäßig auf 15 Sekunden. Überschreiben Sie die Transporteinstellungen nur, wenn Sie eine Workspace- oder Host-spezifische Abstimmung benötigen:

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

Verwenden Sie dies nur für Socket-Mode-Workspaces, die Slack-WebSocket-Pong- oder Server-Ping-Timeouts protokollieren, oder auf Hosts mit bekannter Überlastung der Ereignisschleife ausgeführt werden. `clientPingTimeout` ist die Wartezeit auf den Pong, nachdem das SDK einen Client-Ping gesendet hat; `serverPingTimeout` ist die Wartezeit auf Server-Pings von Slack. App-Nachrichten und Ereignisse bleiben Anwendungszustand und sind keine Signale für die Verfügbarkeit des Transports.

Hinweise:

- `socketMode` wird im HTTP-Request-URL-Modus ignoriert.
- Die Basiseinstellungen unter `channels.slack.socketMode` gelten für alle Slack-Konten, sofern sie nicht überschrieben werden. Kontospezifische Überschreibungen verwenden `channels.slack.accounts.<accountId>.socketMode`; da es sich um eine Objektüberschreibung handelt, müssen Sie alle Socket-Abstimmungsfelder angeben, die für dieses Konto gelten sollen.
- Nur `clientPingTimeout` hat einen OpenClaw-Standardwert (`15000`). `serverPingTimeout` und `pingPongLoggingEnabled` werden nur bei entsprechender Konfiguration an das Slack-SDK übergeben.
- Der Backoff bei einem Neustart von Socket Mode beginnt bei etwa 2 Sekunden und ist auf etwa 30 Sekunden begrenzt. Behebbare Fehler beim Start, beim Warten auf den Start und bei Verbindungsabbrüchen werden erneut versucht, bis der Channel beendet wird. Dauerhafte Konto- und Anmeldedatenfehler wie ungültige Authentifizierung, widerrufene Token oder fehlende Scopes schlagen sofort fehl, statt endlos wiederholt zu werden.

## Checkliste für Manifest und Scopes

Das Basismanifest der Slack-App ist für Socket Mode und HTTP Request URLs identisch. Lediglich der Block `settings` und die `url` des Slash-Befehls unterscheiden sich.

Basismanifest (Standard für Socket Mode):

```json
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
      "assistant_description": "OpenClaw verbindet Slack-Assistant-Threads mit OpenClaw-Agenten.",
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

Ersetzen Sie für den **HTTP-Request-URL-Modus** `settings` durch die HTTP-Variante und fügen Sie jedem Slash-Befehl `url` hinzu. Eine öffentliche URL ist erforderlich:

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

Machen Sie verschiedene Funktionen verfügbar, die die oben genannten Standardeinstellungen erweitern.

Das Standardmanifest aktiviert in Slack App Home den Tab **Home** und abonniert `app_home_opened`. Wenn ein Workspace-Mitglied den Tab Home öffnet, veröffentlicht OpenClaw mit `views.publish` eine sichere Standard-Home-Ansicht; sie enthält weder eine Konversations-Payload noch private Konfigurationsdaten. Wenn der Modus mit einem einzelnen Slash-Befehl aktiviert ist, verwendet der Befehlshinweis `channels.slack.slashCommand.name`; Installationen, die native Befehle oder keine Slash-Befehle verwenden, lassen diesen Hinweis weg. Der Tab **Messages** bleibt für Slack-DMs aktiviert. Das Manifest aktiviert außerdem Slack-Assistant-Threads mit `features.assistant_view`, `assistant:write`, `assistant_thread_started` und `assistant_thread_context_changed`; Assistant-Threads werden an eigene OpenClaw-Thread-Sitzungen weitergeleitet und stellen dem Agenten weiterhin den von Slack bereitgestellten Thread-Kontext zur Verfügung.

<AccordionGroup>
  <Accordion title="Optionale native Slash-Befehle">

    Mehrere [native Slash-Befehle](#commands-and-slash-behavior) können mit folgenden Besonderheiten anstelle eines einzelnen konfigurierten Befehls verwendet werden:

    - Verwenden Sie `/agentstatus` statt `/status`, da der Befehl `/status` reserviert ist.
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
      "usage_hint": "idle <duration|off> oder max-age <duration|off>"
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
      "description": "Erweiterten Modus umschalten",
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
      "description": "Aktive/kürzlich ausgeführte Hintergrundaufgaben der aktuellen Sitzung auflisten"
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
      "description": "Skill nach Namen ausführen",
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
      "description": "Nutzungsfußzeile steuern oder Kostenübersicht anzeigen",
      "usage_hint": "off|tokens|full|cost"
    }
  ]
}
```

      </Tab>
      <Tab title="HTTP-Anfrage-URLs">
        Verwenden Sie dieselbe `slash_commands`-Liste wie oben für Socket Mode und fügen Sie jedem Eintrag `"url": "https://gateway-host.example.com/slack/events"` hinzu. Beispiel:

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

        Wiederholen Sie diesen `url`-Wert bei jedem Befehl in der Liste.

      </Tab>
    </Tabs>

  </Accordion>
  <Accordion title="Optionale Urheberschafts-Scopes (Schreibvorgänge)">
    Fügen Sie den Bot-Scope `chat:write.customize` hinzu, wenn ausgehende Nachrichten anstelle der standardmäßigen Slack-App-Identität die aktive Agentenidentität (benutzerdefinierter Benutzername und benutzerdefiniertes Symbol) verwenden sollen.

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
    - `search:read` (wenn Sie auf Lesezugriffe über die Slack-Suche angewiesen sind)

  </Accordion>
</AccordionGroup>

## Token-Modell

- `botToken` + `appToken` sind für Socket Mode erforderlich.
- Der HTTP-Modus erfordert `botToken` + `signingSecret`.
- Der Relay-Modus erfordert `botToken` sowie `relay.url`, `relay.authToken` und `relay.gatewayId`; er verwendet weder ein App-Token noch ein Signaturgeheimnis.
- `botToken`, `appToken`, `signingSecret`, `relay.authToken` und `userToken` akzeptieren Klartextzeichenfolgen
  oder SecretRef-Objekte.
- Konfigurations-Token überschreiben den Env-Fallback.
- Der Env-Fallback von `SLACK_BOT_TOKEN`, `SLACK_APP_TOKEN` und `SLACK_USER_TOKEN` gilt jeweils nur für das Standardkonto.
- `userToken` verwendet standardmäßig schreibgeschütztes Verhalten (`userTokenReadOnly: true`).

Verhalten der Statusmomentaufnahme:

- Die Slack-Kontoprüfung verfolgt je Anmeldedaten die Felder `*Source` und `*Status`
  (`botToken`, `appToken`, `signingSecret`, `userToken`).
- Der Status ist `available`, `configured_unavailable` oder `missing`.
- `configured_unavailable` bedeutet, dass das Konto über SecretRef
  oder eine andere nicht eingebettete Geheimnisquelle konfiguriert ist, der aktuelle Befehls-/Laufzeitpfad
  den tatsächlichen Wert jedoch nicht auflösen konnte.
- Im HTTP-Modus ist `signingSecretStatus` enthalten; im Socket Mode besteht das
  erforderliche Paar aus `botTokenStatus` + `appTokenStatus`.

<Tip>
Für Aktionen/Verzeichnis-Lesezugriffe kann bei entsprechender Konfiguration das Benutzer-Token bevorzugt werden. Für Schreibvorgänge bleibt das Bot-Token bevorzugt; Schreibvorgänge mit Benutzer-Token sind nur zulässig, wenn `userTokenReadOnly: false` gilt und das Bot-Token nicht verfügbar ist.
</Tip>

## Aktionen und Sperren

Slack-Aktionen werden durch `channels.slack.actions.*` gesteuert.

Verfügbare Aktionsgruppen in den aktuellen Slack-Werkzeugen:

| Gruppe     | Standard     |
| ---------- | ------------ |
| messages   | aktiviert    |
| reactions  | aktiviert    |
| pins       | aktiviert    |
| memberInfo | aktiviert    |
| emojiList  | aktiviert    |

Zu den aktuellen Slack-Nachrichtenaktionen gehören `send`, `upload-file`, `download-file`, `read`, `edit`, `delete`, `pin`, `unpin`, `list-pins`, `member-info` und `emoji-list`. `download-file` akzeptiert Slack-Datei-IDs, die in Platzhaltern eingehender Dateien angezeigt werden, und gibt für Bilder Bildvorschauen oder für andere Dateitypen lokale Dateimetadaten zurück.

## Zugriffskontrolle und Routing

<Tabs>
  <Tab title="DM-Richtlinie">
    `channels.slack.dmPolicy` steuert den DM-Zugriff. `channels.slack.allowFrom` ist die kanonische DM-Zulassungsliste.

    - `pairing` (Standard)
    - `allowlist`
    - `open` (erfordert, dass `channels.slack.allowFrom` `"*"` enthält)
    - `disabled`

    DM-Flags:

    - `dm.enabled` (standardmäßig true)
    - `channels.slack.allowFrom`
    - `dm.allowFrom` (veraltet)
    - `dm.groupEnabled` (Gruppen-DMs standardmäßig false)
    - `dm.groupChannels` (optionale MPIM-Zulassungsliste)

    Rangfolge bei mehreren Konten:

    - `channels.slack.accounts.default.allowFrom` gilt nur für das Konto `default`.
    - Benannte Konten übernehmen `channels.slack.allowFrom`, wenn ihr eigenes `allowFrom` nicht festgelegt ist.
    - Benannte Konten übernehmen `channels.slack.accounts.default.allowFrom` nicht.

    Die veralteten Werte `channels.slack.dm.policy` und `channels.slack.dm.allowFrom` werden aus Kompatibilitätsgründen weiterhin gelesen. `openclaw doctor --fix` migriert sie zu `dmPolicy` und `allowFrom`, wenn dies ohne Änderung des Zugriffs möglich ist.

    Die Kopplung in DMs verwendet `openclaw pairing approve slack <code>`.

  </Tab>

  <Tab title="Kanalrichtlinie">
    `channels.slack.groupPolicy` steuert die Kanalverarbeitung:

    - `open`
    - `allowlist`
    - `disabled`

    Die Kanal-Zulassungsliste befindet sich unter `channels.slack.channels` und **muss stabile Slack-Kanal-IDs** (zum Beispiel `C12345678`) als Konfigurationsschlüssel verwenden.

    Laufzeithinweis: Wenn `channels.slack` vollständig fehlt (reine Env-Einrichtung), greift die Laufzeit auf `groupPolicy="allowlist"` zurück und protokolliert eine Warnung (selbst wenn `channels.defaults.groupPolicy` festgelegt ist).

    Namens-/ID-Auflösung:

    - Einträge der Kanal-Zulassungsliste und der DM-Zulassungsliste werden beim Start aufgelöst, sofern der Token-Zugriff dies erlaubt
    - nicht aufgelöste Einträge mit Kanalnamen bleiben wie konfiguriert erhalten, werden aber standardmäßig beim Routing ignoriert
    - eingehende Autorisierung und Kanal-Routing verwenden standardmäßig zuerst die ID; direkter Abgleich von Benutzernamen/Slugs erfordert `channels.slack.dangerouslyAllowNameMatching: true`

    <Warning>
    Namensbasierte Schlüssel (`#channel-name` oder `channel-name`) stimmen unter `groupPolicy: "allowlist"` **nicht** überein. Die Kanalsuche verwendet standardmäßig zuerst die ID, sodass ein namensbasierter Schlüssel niemals erfolgreich geroutet wird und alle Nachrichten in diesem Kanal stillschweigend blockiert werden. Dies unterscheidet sich von `groupPolicy: "open"`, bei dem der Kanalschlüssel für das Routing nicht erforderlich ist und ein namensbasierter Schlüssel zu funktionieren scheint.

    Verwenden Sie stets die Slack-Kanal-ID als Schlüssel. So finden Sie sie: Klicken Sie in Slack mit der rechten Maustaste auf den Kanal → **Copy link** — die ID (`C...`) befindet sich am Ende der URL.

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

    Falsch (unter `groupPolicy: "allowlist"` stillschweigend blockiert):

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

    Erwähnungsquellen:

    - explizite App-Erwähnung (`<@botId>`)
    - Slack-Benutzergruppenerwähnung (`<!subteam^S...>`), wenn der Bot-Benutzer Mitglied dieser Benutzergruppe ist; erfordert `usergroups:read`
    - reguläre Ausdrucksmuster für Erwähnungen (`agents.list[].groupChat.mentionPatterns`, Fallback `messages.groupChat.mentionPatterns`)
    - implizites Verhalten bei Antworten auf Bot-Threads (deaktiviert, wenn `thread.requireExplicitMention` auf `true` gesetzt ist)

    Steuerelemente pro Kanal (`channels.slack.channels.<id>`; Namen nur über die Auflösung beim Start oder `dangerouslyAllowNameMatching`):

    - `requireMention`
    - `ignoreOtherMentions`
    - `replyToMode` (`off|first|all|batched`; überschreibt den Antwortmodus für Konto/Chattyp in diesem Kanal)
    - `users` (Zulassungsliste)
    - `allowBots`
    - `skills`
    - `systemPrompt`
    - `tools`, `toolsBySender`
    - Schlüsselformat für `toolsBySender`: `channel:`, `id:`, `e164:`, `username:`, `name:` oder Platzhalter `"*"`
      (veraltete Schlüssel ohne Präfix werden weiterhin nur `id:` zugeordnet)

    `ignoreOtherMentions` (Standard `false`) verwirft Kanalnachrichten, die einen anderen Benutzer oder eine andere Benutzergruppe erwähnen, aber nicht diesen Bot. DMs und Gruppen-DMs (MPIMs) sind davon nicht betroffen. Der Filter erfordert eine über `auth.test` aufgelöste Bot-Benutzer-ID; wenn diese Identität nicht verfügbar ist (zum Beispiel bei einer Identität ausschließlich mit Benutzer-Token), bleibt die Sperre offen und Nachrichten werden unverändert weitergeleitet.

    `allowBots` ist für Kanäle und private Kanäle restriktiv: Von Bots verfasste Raumnachrichten werden nur akzeptiert, wenn der sendende Bot ausdrücklich in der `users`-Zulassungsliste dieses Raums aufgeführt ist oder wenn mindestens eine explizite Slack-Eigentümer-ID aus `channels.slack.allowFrom` derzeit Mitglied des Raums ist. Platzhalter und Eigentümereinträge mit Anzeigenamen erfüllen die Anforderung der Eigentümeranwesenheit nicht. Die Eigentümeranwesenheit verwendet Slack `conversations.members`; stellen Sie sicher, dass die App über den passenden Lese-Scope für den Raumtyp verfügt (`channels:read` für öffentliche Kanäle, `groups:read` für private Kanäle). Wenn die Mitgliederabfrage fehlschlägt, verwirft OpenClaw die vom Bot verfasste Raumnachricht.

    Akzeptierte, von Bots verfasste Slack-Nachrichten verwenden den gemeinsamen [Schutz vor Bot-Schleifen](/de/channels/bot-loop-protection). Konfigurieren Sie `channels.defaults.botLoopProtection` für das Standardbudget und überschreiben Sie es anschließend mit `channels.slack.botLoopProtection` oder `channels.slack.channels.<id>.botLoopProtection`, wenn ein Workspace oder Kanal ein anderes Limit benötigt.

  </Tab>
</Tabs>

## Threads, Sitzungen und Antwort-Tags

- DMs werden als `direct`, Kanäle als `channel` und MPIMs als `group` geroutet.
- Slack-Routenbindungen akzeptieren rohe Peer-IDs sowie Slack-Zielformen wie `channel:C12345678`, `user:U12345678` und `<@U12345678>`.
- Mit dem Standardwert `session.dmScope=main` werden Slack-DMs in der Hauptsitzung des Agenten zusammengeführt.
- Kanalsitzungen: `agent:<agentId>:slack:channel:<channelId>`.
- Gewöhnliche Nachrichten auf oberster Kanalebene verbleiben in der jeweiligen Kanalsitzung, selbst wenn `replyToMode` nicht auf `off` gesetzt ist.
- Antworten in Slack-Threads verwenden den übergeordneten Slack-Wert `thread_ts` als Sitzungssuffix (`:thread:<threadTs>`), selbst wenn das Threading ausgehender Antworten mit `replyToMode="off"` deaktiviert ist.
- OpenClaw übernimmt eine geeignete Wurzelnachricht auf oberster Kanalebene in `agent:<agentId>:slack:channel:<channelId>:thread:<rootTs>`, wenn diese Wurzelnachricht voraussichtlich einen sichtbaren Slack-Thread startet, sodass die Wurzelnachricht und spätere Thread-Antworten dieselbe OpenClaw-Sitzung verwenden. Dies gilt für `app_mention`-Ereignisse, explizite Erwähnungen des Bots oder Treffer konfigurierter Erwähnungsmuster sowie für Kanäle mit `requireMention: false` und einem `replyToMode`, das nicht `off` ist.
- Der Standardwert von `channels.slack.thread.historyScope` ist `thread`; der Standardwert von `thread.inheritParent` ist `false`.
- `channels.slack.thread.initialHistoryLimit` steuert, wie viele vorhandene Thread-Nachrichten beim Start einer neuen Thread-Sitzung abgerufen werden (Standard: `20`; mit `0` deaktivieren).
- `channels.slack.thread.requireExplicitMention` (Standard: `false`): Bei `true` werden implizite Thread-Erwähnungen unterdrückt, sodass der Bot innerhalb von Threads nur auf explizite `@bot`-Erwähnungen reagiert, selbst wenn er bereits am Thread beteiligt war. Andernfalls umgehen Antworten in einem Thread mit Bot-Beteiligung die `requireMention`-Prüfung.

Steuerung des Antwort-Threadings:

- `channels.slack.channels.<id>.replyToMode`: kanalspezifische Überschreibung für Nachrichten in öffentlichen und privaten Slack-Kanälen
- `channels.slack.replyToMode`: `off|first|all|batched` (Standard: `off`)
- `channels.slack.replyToModeByChatType`: je `direct|group|channel`
- veralteter Fallback für Direktchats: `channels.slack.dm.replyToMode`

Manuelle Antwort-Tags werden unterstützt:

- `[[reply_to_current]]`
- `[[reply_to:<id>]]`

Für explizite Slack-Thread-Antworten über das `message`-Tool setzen Sie `replyBroadcast: true` zusammen mit `action: "send"` und `threadId` oder `replyTo`, damit Slack die Thread-Antwort zusätzlich im übergeordneten Kanal veröffentlicht. Dies wird dem Slack-Flag `reply_broadcast` von `chat.postMessage` zugeordnet und wird nur beim Senden von Text oder Block Kit unterstützt, nicht beim Hochladen von Medien.

Wenn ein Aufruf des `message`-Tools innerhalb eines Slack-Threads ausgeführt wird und denselben Kanal als Ziel hat, übernimmt OpenClaw normalerweise den aktuellen Slack-Thread gemäß dem wirksamen `replyToMode` für Konto, Chattyp oder Kanal. Automatische Antworten sowie Aufrufe von `send` oder `upload-file` im selben Kanal verwenden dieselbe kanalspezifische Überschreibung. Setzen Sie bei `action: "send"` oder `action: "upload-file"` `topLevel: true`, um stattdessen eine neue Nachricht im übergeordneten Kanal zu erzwingen. `threadId: null` wird als gleichwertige Deaktivierung auf oberster Ebene akzeptiert.

<Note>
`replyToMode="off"` deaktiviert das Threading ausgehender Slack-Antworten einschließlich expliziter `[[reply_to_*]]`-Tags. Eingehende Slack-Thread-Sitzungen werden dadurch nicht abgeflacht: Nachrichten, die bereits innerhalb eines Slack-Threads veröffentlicht wurden, werden weiterhin an die Sitzung `:thread:<threadTs>` geroutet. Dies unterscheidet sich von Telegram, wo explizite Tags auch im Modus `"off"` berücksichtigt werden. Slack-Threads verbergen Nachrichten im Kanal, während Telegram-Antworten inline sichtbar bleiben.
</Note>

## Bestätigungsreaktionen

`ackReaction` sendet ein Bestätigungs-Emoji, während OpenClaw eine eingehende Nachricht verarbeitet. `ackReactionScope` bestimmt, _wann_ dieses Emoji tatsächlich gesendet wird.

Standardmäßig bleibt die Bestätigungsreaktion unverändert, während der native Assistenten-Thread-Status von Slack den Fortschritt mit wechselnden Lademeldungen anzeigt. Setzen Sie `messages.statusReactions.enabled: true`, um stattdessen den Reaktionslebenszyklus für Warteschlange/Denken/Tool/Abschluss/Fehler zu aktivieren.

### Emoji (`ackReaction`)

Auflösungsreihenfolge:

- `channels.slack.accounts.<accountId>.ackReaction`
- `channels.slack.ackReaction`
- `messages.ackReaction`
- Fallback auf das Emoji der Agentenidentität (`agents.list[].identity.emoji`, andernfalls `"eyes"` / 👀)

Hinweise:

- Slack erwartet Kurzcodes (zum Beispiel `"eyes"`).
- Verwenden Sie `""`, um die Reaktion für das Slack-Konto oder global zu deaktivieren.

### Geltungsbereich (`messages.ackReactionScope`)

Der Slack-Provider liest den Geltungsbereich aus `messages.ackReactionScope` (Standard: `"group-mentions"`). Derzeit gibt es keine Überschreibung auf Slack-Konto- oder Slack-Kanalebene; der Wert gilt global für das Gateway.

Werte:

- `"all"`: In DMs und Gruppen reagieren, einschließlich Ereignissen in Räumen ohne direkte Ansprache.
- `"direct"`: Nur in DMs reagieren.
- `"group-all"`: Auf jede Gruppennachricht reagieren, ausgenommen Ereignisse in Räumen ohne direkte Ansprache (keine DMs).
- `"group-mentions"` (Standard): In Gruppen reagieren, jedoch nur, wenn der Bot erwähnt wird (oder in Gruppenkontexten mit möglichen Erwähnungen, für die dies aktiviert wurde). **DMs sind ausgeschlossen.**
- `"off"` / `"none"`: Nie reagieren.

<Note>
Der Standardgeltungsbereich (`"group-mentions"`) löst keine Bestätigungsreaktionen in Direktnachrichten oder bei Ereignissen in Räumen ohne direkte Ansprache aus. Um die konfigurierte `ackReaction` (zum Beispiel `"eyes"`) bei eingehenden Slack-DMs und stillen Raumereignissen zu sehen, setzen Sie `messages.ackReactionScope` auf `"all"`. `messages.ackReactionScope` wird beim Start des Slack-Providers gelesen, daher ist ein Neustart des Gateways erforderlich, damit die Änderung wirksam wird.
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

- `off`: Live-Vorschau-Streaming deaktivieren.
- `partial` (Standard): Vorschautext durch die neueste Teilausgabe ersetzen.
- `block`: Vorschauaktualisierungen blockweise anhängen.
- `progress`: Während der Generierung einen Fortschrittsstatustext anzeigen und anschließend den endgültigen Text senden.
- `streaming.preview.toolProgress`: Wenn die Entwurfsvorschau aktiv ist, Tool- und Fortschrittsaktualisierungen in dieselbe bearbeitete Vorschaunachricht leiten (Standard: `true`). Setzen Sie den Wert auf `false`, um separate Tool- und Fortschrittsnachrichten beizubehalten.
- `streaming.preview.commandText` / `streaming.progress.commandText`: Auf `status` setzen, um kompakte Tool-Fortschrittszeilen beizubehalten und gleichzeitig rohen Befehls-/Ausführungstext auszublenden (Standard: `raw`).

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

`channels.slack.streaming.nativeTransport` steuert das native Slack-Text-Streaming, wenn `channels.slack.streaming.mode` auf `partial` gesetzt ist (Standard: `true`).

Native Slack-Fortschrittsaufgabenkarten müssen für den Fortschrittsmodus ausdrücklich aktiviert werden. Setzen Sie `channels.slack.streaming.progress.nativeTaskCards` zusammen mit `channels.slack.streaming.mode="progress"` auf `true`, um während der Ausführung eine native Slack-Plan-/Aufgabenkarte zu senden und dieselbe Aufgabenkarte nach Abschluss zu aktualisieren. Ohne dieses Flag verwendet der Fortschrittsmodus weiterhin das portable Verhalten der Entwurfsvorschau.

- Für natives Text-Streaming und die Anzeige des Slack-Assistenten-Thread-Status muss ein Antwort-Thread verfügbar sein. Die Thread-Auswahl richtet sich weiterhin nach `replyToMode`.
- Kanäle, Gruppenchats und DMs mit Wurzelnachrichten auf oberster Ebene können weiterhin die normale Entwurfsvorschau verwenden, wenn natives Streaming nicht verfügbar ist oder kein Antwort-Thread existiert.
- Slack-DMs auf oberster Ebene bleiben standardmäßig außerhalb von Threads und zeigen daher keine native Stream-/Statusvorschau im Slack-Thread-Stil an; OpenClaw veröffentlicht und bearbeitet stattdessen eine Entwurfsvorschau in der DM.
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
- Die Schlüssel `channels.slack.chunkMode` und `channels.slack.nativeStreaming` auf oberster Ebene sind veraltete Aliasse für `channels.slack.streaming.chunkMode` und `channels.slack.streaming.nativeTransport`.
- Veraltete Aliasse werden zur Laufzeit nicht gelesen; führen Sie `openclaw doctor --fix` aus, um die gespeicherte Slack-Streaming-Konfiguration auf die kanonischen Schlüssel umzuschreiben.

## Fallback für Tippreaktionen

`typingReaction` fügt der eingehenden Slack-Nachricht vorübergehend eine Reaktion hinzu, während OpenClaw eine Antwort verarbeitet, und entfernt sie nach Abschluss der Ausführung. Dies ist besonders außerhalb von Thread-Antworten nützlich, die standardmäßig eine Statusanzeige „tippt gerade …“ verwenden.

Auflösungsreihenfolge:

- `channels.slack.accounts.<accountId>.typingReaction`
- `channels.slack.typingReaction`

Hinweise:

- Slack erwartet Kurzcodes (zum Beispiel `"hourglass_flowing_sand"`).
- Die Reaktion erfolgt nach bestem Bemühen, und nach Abschluss des Antwort- oder Fehlerpfads wird automatisch versucht, sie zu entfernen.

## Spracheingabe

Um heute in Slack mit OpenClaw zu sprechen, senden Sie einen Slack-Audioclip an die OpenClaw-App. Das Diktiermikrofon von Slackbot ist eine separate, Slack-eigene Funktion und keine App-API.

- **[Sprachdiktat von Slackbot](https://slack.com/help/articles/202026038-How-to-use-Slackbot)** ist innerhalb der privaten Slackbot-Unterhaltung des Benutzers verfügbar. Slack wandelt die Aufnahme in eine Slackbot-Eingabeaufforderung um, stellt Drittanbieter-Slack-Apps über die Events API jedoch weder eine Audiodatei noch ein Diktierereignis, eine Eingabeaufforderung oder eine Markierung der Eingabequelle bereit. Das OpenClaw-Slack-Plugin kann diese Funktion weder aktivieren noch empfangen.
- **[Slack-Audio- und Videoclips](https://slack.com/help/articles/4406235165587-Record-audio-and-video-clips-in-Slack)** werden als Slack-Dateien gespeichert und können in einer OpenClaw-DM, einem Kanal oder einem Thread veröffentlicht werden. OpenClaw lädt einen zugänglichen Clip mit dem Bot-Token herunter, normalisiert die MIME-Metadaten des Slack-Clips und leitet ihn durch die gemeinsame [Pipeline zur Audiotranskription](/de/nodes/audio). Das empfohlene App-Manifest enthält den erforderlichen Geltungsbereich `files:read`.

Audioclips und Slackbot-Diktate haben unterschiedliche Datenschutzmerkmale: Clips unterliegen den Slack-Richtlinien zur Dateiaufbewahrung und werden von OpenClaw zur Transkription heruntergeladen, während Slack angibt, dass Diktataudio nicht gespeichert wird.

In einem Kanal mit `requireMention: true` kann ein Audioclip ohne Beschriftung die Prüfung bestehen, wenn ein konfiguriertes Erwähnungsmuster gesprochen wird (`agents.list[].groupChat.mentionPatterns`, mit Rückgriff auf `messages.groupChat.mentionPatterns`). OpenClaw autorisiert den Absender vor dem Herunterladen oder Transkribieren des Clips und lässt ihn anschließend nur zu, wenn das Transkript übereinstimmt. Ein fehlgeschlagenes oder nicht übereinstimmendes spekulatives Transkript wird zusammen mit dem heruntergeladenen Clip verworfen und nicht im Kanalverlauf gespeichert. Die native Slack-Identität `@bot` kann nicht aus Sprache abgeleitet werden; konfigurieren Sie daher ein Muster für einen gesprochenen Namen oder fügen Sie eine getippte Erwähnung hinzu. Wenn die Transkriptwiedergabe aktiviert ist, wird sie erst nach der Zulassung gesendet.

## Medien, Aufteilung und Zustellung

<AccordionGroup>
  <Accordion title="Eingehende Anhänge">
    Slack-Dateianhänge werden von privaten, bei Slack gehosteten URLs heruntergeladen (tokenauthentifizierter Anfrageablauf) und bei erfolgreichem Abruf sowie eingehaltenen Größenlimits in den Medienspeicher geschrieben. Dateiplatzhalter enthalten die Slack-`fileId`, damit Agenten die Originaldatei mit `download-file` abrufen können.

    Downloads verwenden begrenzte Leerlauf- und Gesamtzeitüberschreitungen. Wenn der Abruf einer Slack-Datei ins Stocken gerät oder fehlschlägt, verarbeitet OpenClaw die Nachricht weiter und greift auf den Dateiplatzhalter zurück.

    Die Größenbeschränkung für eingehende Daten zur Laufzeit beträgt standardmäßig `20MB`, sofern sie nicht durch `channels.slack.mediaMaxMb` überschrieben wird.

  </Accordion>

  <Accordion title="Ausgehender Text und Dateien">
    - Textabschnitte verwenden `channels.slack.textChunkLimit` (Standardwert `8000`, begrenzt durch Slacks eigene Beschränkung der Nachrichtenlänge)
    - `channels.slack.streaming.chunkMode="newline"` aktiviert eine Aufteilung, bei der Absätze Vorrang haben
    - Dateien werden über die Slack-Upload-APIs gesendet und können Antworten in Threads (`thread_ts`) enthalten
    - bei langen Dateibeschriftungen wird der erste Slack-kompatible Textabschnitt als Upload-Kommentar verwendet; die verbleibenden Abschnitte werden als Folgenachrichten gesendet
    - die Größenbeschränkung für ausgehende Medien richtet sich nach `channels.slack.mediaMaxMb`, wenn dies konfiguriert ist; andernfalls verwenden Kanal-Sendevorgänge die Standardwerte für den jeweiligen MIME-Typ aus der Medienpipeline

  </Accordion>

  <Accordion title="Zustellungsziele">
    Bevorzugte explizite Ziele:

    - `user:<id>` für Direktnachrichten
    - `channel:<id>` für Kanäle

    Slack-Direktnachrichten, die nur Text oder Blöcke enthalten, können direkt an Benutzer-IDs gesendet werden. Bei Datei-Uploads und Sendungen in Threads wird die Direktnachricht zunächst über die Slack-Konversations-APIs geöffnet, da diese Pfade eine konkrete Konversations-ID erfordern.

  </Accordion>
</AccordionGroup>

## Befehle und Slash-Verhalten

Slash-Befehle erscheinen in Slack entweder als einzelner konfigurierter Befehl oder als mehrere native Befehle. Konfigurieren Sie `channels.slack.slashCommand`, um die Standardwerte für Befehle zu ändern:

- `enabled: false`
- `name: "openclaw"`
- `sessionPrefix: "slack:slash"`
- `ephemeral: true`

```txt
/openclaw /help
```

Native Befehle erfordern [zusätzliche Manifest-Einstellungen](#additional-manifest-settings) in Ihrer Slack-App und werden stattdessen mit `channels.slack.commands.native: true` oder in globalen Konfigurationen mit `commands.native: true` aktiviert.

- Der automatische Modus für native Befehle ist für Slack **deaktiviert**, sodass `commands.native: "auto"` keine nativen Slack-Befehle aktiviert.

```txt
/help
```

Native Argumentmenüs werden in der folgenden Prioritätsreihenfolge dargestellt:

- 3–5 ausreichend kurze Optionen: ein Überlaufmenü („...“)
- mehr als 100 Optionen bei verfügbarer asynchroner Optionsfilterung: externe Auswahl
- 1–2 Optionen oder eine Option, deren codierter Wert für eine Auswahl zu lang ist: Schaltflächenblöcke
- andernfalls (6–100 Optionen oder mehr als 100 ohne asynchrone Filterung): statisches Auswahlmenü, aufgeteilt in jeweils 100 Optionen pro Menü

```txt
/think
```

Slash-Sitzungen verwenden isolierte Schlüssel wie `agent:<agentId>:slack:slash:<userId>` und leiten Befehlsausführungen weiterhin mithilfe von `CommandTargetSessionKey` an die Sitzung der Zielkonversation weiter.

## Native Diagramme

Slacks öffentlicher [`data_visualization`-Block von Block Kit](https://docs.slack.dev/reference/block-kit/blocks/data-visualization-block/)
stellt Linien-, Balken-, Flächen- und Kreisdiagramme in Nachrichten dar. OpenClaw bildet den portablen
`presentation`-`chart`-Block auf diese native Struktur ab. Über den normalen
Nachrichtenzugriff mit `chat:write` hinaus sind weder ein zusätzlicher OAuth-Berechtigungsumfang
noch ein Datei-Upload, ein Bildrenderer oder eine Slack-Konfiguration erforderlich.

```json
{
  "blocks": [
    {
      "type": "chart",
      "chartType": "bar",
      "title": "Quarterly revenue",
      "categories": ["Q1", "Q2"],
      "series": [{ "name": "Revenue", "values": [120, 145] }],
      "xLabel": "Quarter"
    }
  ]
}
```

Die Beschränkungen von Slack werden vor der nativen Darstellung durchgesetzt:

- Titel und optionale Achsenbeschriftungen: 50 Zeichen
- Kreisdiagramm: 1–12 positive Segmente
- Linien-/Balken-/Flächendiagramm: 1–12 eindeutig benannte Datenreihen und 1–20 gemeinsame Kategorien
- Segment-, Kategorie- und Datenreihenbeschriftungen: 20 Zeichen
- jede Datenreihe muss für jede Kategorie genau einen endlichen Wert enthalten; Werte außerhalb von Kreisdiagrammen
  dürfen negativ sein

Jedes native Diagramm enthält außerdem eine Textdarstellung auf oberster Ebene für Screenreader,
Benachrichtigungen, Sitzungsspiegelung und Clients, die den Block nicht darstellen können.
Standardmäßige Präsentationssendungen an andere OpenClaw-Kanäle erhalten dieselben
deterministischen Diagrammdaten als Text, sofern sie keine native Diagrammunterstützung angeben. Wenn
Slack das Diagramm während einer schrittweisen Einführung mit `invalid_blocks` ablehnt, entfernt OpenClaw
die abgelehnten nativen Datenblöcke, behält gegebenenfalls zugehörige Steuerelemente bei und sendet
die vollständige Diagrammdarstellung als sichtbaren Text.

Slack akzeptiert derzeit bis zu zwei `data_visualization`-Blöcke pro Nachricht. Wenn
eine Präsentation mehr als zwei gültige Diagramme enthält, behält OpenClaw deren Reihenfolge bei
und setzt die native Darstellung in Folgenachrichten fort, wobei jede Nachricht höchstens zwei
Diagramme enthält.

Slacks [Einführung für Entwickler](https://docs.slack.dev/changelog/2026/06/16/block-kit-data-visualization-block/)
dokumentiert den Block als App-bezogene Block-Kit-Funktion und nennt keine Einschränkung
auf kostenpflichtige Tarife. Die Formulierung zur Berechtigung für Business+/Enterprise gilt für
Slackbots automatische KI-Diagrammerstellung, die davon unabhängig ist, dass eine App
ein bereits strukturiertes Block-Kit-Diagramm sendet. Diagramme sind Blöcke ausschließlich für Nachrichten, nicht für App
Home, Modalfenster oder Canvas-Inhalte.

## Native Tabellen

Slacks aktueller [`data_table`-Block-Kit-Block](https://docs.slack.dev/reference/block-kit/blocks/data-table-block/)
stellt strukturierte Zeilen und Spalten in Nachrichten dar. OpenClaw ordnet einen expliziten
portablen `presentation`-`table`-Block `data_table` zu; Slacks
veralteter [`table`-Block](https://docs.slack.dev/reference/block-kit/blocks/table-block/) wird nicht verwendet.
Über den normalen Nachrichtenzugriff per `chat:write` hinaus sind kein zusätzlicher
OAuth-Berechtigungsumfang und keine weitere Slack-Konfiguration erforderlich.

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

OpenClaw ordnet Kopfzeilen- und Zeichenfolgenzellen den Slack-`raw_text`-Zellen zu. Numerische Zellen
werden `raw_number` zugeordnet, wobei der endliche numerische Wert für natives Sortieren
und Filtern erhalten bleibt. Sofern `rowHeaderColumnIndex` vorhanden ist, kennzeichnet es diese nullbasierte
Spalte als Slack-Zeilenüberschriften.

Slacks veröffentlichte `data_table`-Grenzwerte werden vor dem nativen Rendern durchgesetzt:

- 1–20 Spalten
- 1–100 Datenzeilen zuzüglich der Kopfzeile
- dieselbe Anzahl von Zellen in jeder Zeile
- höchstens 10.000 Zeichen insgesamt über alle Tabellenzellen in einer Nachricht hinweg

Mehrere gültige Tabellenblöcke können nativ gerendert werden, solange die Nachricht
innerhalb des Gesamtzeichenlimits bleibt. Eine Tabelle, die nicht innerhalb des
nativen Rahmens gerendert werden kann, wird zu vollständigem deterministischem Text, statt Zeilen oder
Zellen zu verlieren. Wenn dieser Text eine Slack-Nachricht überschreitet, verwenden Sendungen und Slash-Antworten
geordnete Textabschnitte. Tabellenbearbeitungen schlagen mit einem expliziten Größenfehler fehl, statt
Zeilen aus einer vorhandenen Nachricht unbemerkt abzuschneiden.

Jede aus einer portablen Präsentation erzeugte native Tabelle enthält außerdem eine Textdarstellung
auf oberster Ebene für Screenreader, Benachrichtigungen, Sitzungsspiegelung und
Clients, die den Block nicht rendern können. Unverarbeitete Diagramm- und Tabellenwerte bleiben
im Fallback wörtlich erhalten, sodass Zellendaten wie `<@U123>` nicht zu einer Slack-Erwähnung werden.
Wenn Slack native Diagramm- oder Tabellenblöcke mit `invalid_blocks` ablehnt, entfernt OpenClaw
alle nativen Datenblöcke in einem einzigen begrenzten Wiederherstellungsschritt, behält gültige
benachbarte Blöcke wie Schaltflächen und Auswahlelemente bei und sendet vollständigen sichtbaren Diagramm-
und Tabellentext mit deaktivierter Slack-Formatierung. Die Zustellung von Slash-Befehlen
verfolgt Slacks Budget von fünf `response_url`-Aufrufen über den gesamten Befehl hinweg. Vor jedem
Antwortstapel wählt sie einen vollständigen Plan aus, der in die verbleibenden Aufrufe passt, oder schlägt
vor dem Senden dieses Stapels fehl.

Nur explizite `presentation`-Tabellenblöcke werden zu nativen Tabellen hochgestuft.
Markdown-Pipe-Tabellen bleiben verfasster Text; OpenClaw leitet weder Tabellenstruktur
noch Zelltypen durch Vermutungen ab. Bestehende vertrauenswürdige Erzeuger Slack-nativer Inhalte können weiterhin
unverarbeitete Blöcke über `channelData.slack.blocks` übergeben; OpenClaw leitet Fallback-
Text aus gültigen unverarbeiteten `data_table`-Zellen ab, während fehlerhafte benutzerdefinierte Blöcke
auf ihre Beschriftung oder den allgemeinen Block-Kit-Fallback zurückfallen können. Portable Ausgaben von Agenten, CLI
und Plugins sollten `presentation` verwenden.

## Interaktive Antworten

Slack kann von Agenten erstellte interaktive Antwortsteuerelemente rendern, diese Funktion ist jedoch standardmäßig deaktiviert.
Bevorzugen Sie für neue Ausgaben von Agenten, CLI und Plugins die gemeinsamen
`presentation`-Schaltflächen oder Auswahlblöcke. Sie verwenden denselben Slack-Interaktionspfad
und können zugleich auf anderen Kanälen zurückgestuft werden.

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

Wenn diese Option aktiviert ist, können Agenten weiterhin veraltete, ausschließlich für Slack bestimmte Antwortdirektiven ausgeben:

- `[[slack_buttons: Approve:approve, Reject:reject]]`
- `[[slack_select: Choose a target | Canary:canary, Production:production]]`

Diese Direktiven werden in Slack Block Kit kompiliert und leiten Klicks oder Auswahlen
über den vorhandenen Ereignispfad für Slack-Interaktionen zurück. Behalten Sie sie für alte
Prompts und Slack-spezifische Ausweichmöglichkeiten bei; verwenden Sie für neue
portable Steuerelemente die gemeinsame Präsentation.

Die APIs des Direktiven-Compilers sind für neuen Erzeugercode ebenfalls veraltet:

- `compileSlackInteractiveReplies(...)`
- `parseSlackOptionsLine(...)`
- `isSlackInteractiveRepliesEnabled(...)`
- `buildSlackInteractiveBlocks(...)`

Verwenden Sie für neue, in Slack gerenderte Steuerelemente `presentation`-Payloads und
`buildSlackPresentationBlocks(...)`.

Hinweise:

- Dies ist eine Slack-spezifische veraltete Benutzeroberfläche. Andere Kanäle übersetzen Slack-Block-
  Kit-Direktiven nicht in ihre eigenen Schaltflächensysteme.
- Die interaktiven Callback-Werte sind von OpenClaw erzeugte undurchsichtige Tokens, keine unverarbeiteten, vom Agenten verfassten Werte.
- Wenn erzeugte interaktive Blöcke die Slack-Block-Kit-Grenzwerte überschreiten würden, greift OpenClaw auf die ursprüngliche Textantwort zurück, statt eine ungültige Block-Payload zu senden.

### Plugin-eigene Modal-Übermittlungen

Slack-Plugins, die einen interaktiven Handler registrieren, können außerdem modale
`view_submission`- und `view_closed`-Lebenszyklusereignisse empfangen, bevor OpenClaw
die Payload für das für den Agenten sichtbare Systemereignis komprimiert.
Verwenden Sie beim Öffnen eines Slack-Modals eines dieser Routing-Muster:

- Setzen Sie `callback_id` auf `openclaw:<namespace>:<payload>`.
- Oder behalten Sie eine vorhandene `callback_id` bei und setzen Sie `pluginInteractiveData:
"<namespace>:<payload>"` in den modalen `private_metadata`.

Der Handler empfängt `ctx.interaction.kind` als `view_submission` oder
`view_closed`, normalisierte `inputs` und das vollständige unverarbeitete `stateValues`-Objekt von
Slack. Das Routing ausschließlich über die Callback-ID reicht aus, um den Plugin-Handler aufzurufen; fügen Sie
die vorhandenen Benutzer-/Sitzungs-Routingfelder der modalen `private_metadata` hinzu, wenn das
Modal außerdem ein für den Agenten sichtbares Systemereignis erzeugen soll. Der Agent empfängt ein
kompaktes, geschwärztes Systemereignis `Slack interaction: ...`. Wenn der Handler
`systemEvent.summary`, `systemEvent.reference` oder `systemEvent.data` zurückgibt, werden diese
Felder in dieses kompakte Ereignis aufgenommen, sodass der Agent auf
Plugin-eigenen Speicher verweisen kann, ohne die vollständige Formular-Payload zu sehen.

## Native Genehmigungen in Slack

Slack kann als nativer Genehmigungsclient mit interaktiven Schaltflächen und Interaktionen fungieren, statt auf die Web-Benutzeroberfläche oder das Terminal zurückzufallen.

- Ausführungs- und Plugin-Genehmigungen können als Slack-native Block-Kit-Abfragen gerendert werden.
- `channels.slack.execApprovals.*` bleibt die Konfiguration zur Aktivierung des nativen Clients für Ausführungsgenehmigungen und zum Routing über Direktnachrichten/Kanäle.
- Direktnachrichten für Ausführungsgenehmigungen verwenden `channels.slack.execApprovals.approvers` oder `commands.ownerAllowFrom`.
- Plugin-Genehmigungen verwenden Slack-native Schaltflächen, wenn Slack für die ursprüngliche Sitzung als nativer Genehmigungsclient aktiviert ist oder wenn `approvals.plugin` zur ursprünglichen Slack-Sitzung oder zu einem Slack-Ziel routet.
- Direktnachrichten für Plugin-Genehmigungen verwenden Slack-Plugin-Genehmigende aus `channels.slack.allowFrom`, dem `allowFrom` eines benannten Kontos oder der Standardroute des Kontos.
- Die Autorisierung der Genehmigenden wird weiterhin durchgesetzt: Personen, die ausschließlich Ausführungsgenehmigungen erteilen dürfen, können Plugin-Anfragen nur genehmigen, wenn sie zugleich zu den Plugin-Genehmigenden gehören.

Dies verwendet dieselbe gemeinsame Oberfläche für Genehmigungsschaltflächen wie andere Kanäle. Wenn `interactivity` in den Einstellungen Ihrer Slack-App aktiviert ist, werden Genehmigungsaufforderungen direkt in der Unterhaltung als Block-Kit-Schaltflächen dargestellt.
Wenn diese Schaltflächen vorhanden sind, bilden sie die primäre Benutzeroberfläche für Genehmigungen; OpenClaw
sollte einen manuellen `/approve`-Befehl nur einfügen, wenn das Tool-Ergebnis angibt, dass Chat-
Genehmigungen nicht verfügbar sind oder die manuelle Genehmigung der einzige Weg ist.

Konfigurationspfad:

- `channels.slack.execApprovals.enabled`
- `channels.slack.execApprovals.approvers` (optional; greift nach Möglichkeit auf `commands.ownerAllowFrom` zurück)
- `channels.slack.execApprovals.target` (`dm` | `channel` | `both`, Standard: `dm`)
- `agentFilter`, `sessionFilter`

Slack aktiviert native Ausführungsgenehmigungen automatisch, wenn `enabled` nicht gesetzt oder `"auto"` ist und mindestens eine
genehmigende Person für Ausführungen aufgelöst wird. Slack kann über diesen nativen Client-
Pfad auch native Plugin-Genehmigungen verarbeiten, wenn genehmigende Personen für das Slack-Plugin aufgelöst werden und die Anfrage den Filtern des nativen Clients entspricht. Setzen Sie
`enabled: false`, um Slack explizit als nativen Genehmigungsclient zu deaktivieren. Setzen Sie `enabled: true`, um
native Genehmigungen zu erzwingen, wenn genehmigende Personen aufgelöst werden. Das Deaktivieren von Slack-Ausführungsgenehmigungen deaktiviert nicht
die native Zustellung von Slack-Plugin-Genehmigungen, die über `approvals.plugin` aktiviert ist; für die Zustellung von Plugin-Genehmigungen
werden stattdessen die genehmigenden Personen des Slack-Plugins verwendet.

Standardverhalten ohne explizite Konfiguration für Slack-Ausführungsgenehmigungen:

```json5
{
  commands: {
    ownerAllowFrom: ["slack:U12345678"],
  },
}
```

Eine explizite Slack-native Konfiguration ist nur erforderlich, wenn Sie genehmigende Personen überschreiben, Filter hinzufügen oder
die Zustellung an den ursprünglichen Chat aktivieren möchten:

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

Die gemeinsame Weiterleitung über `approvals.exec` ist davon getrennt. Verwenden Sie sie nur, wenn Aufforderungen für Ausführungsgenehmigungen zusätzlich
an andere Chats oder explizite Out-of-Band-Ziele weitergeleitet werden müssen. Die gemeinsame Weiterleitung über `approvals.plugin` ist ebenfalls
davon getrennt; die native Slack-Zustellung unterdrückt diesen Rückfall nur, wenn Slack die Anfrage zur Plugin-
Genehmigung nativ verarbeiten kann.

Der Befehl `/approve` im selben Chat funktioniert auch in Slack-Kanälen und DMs, die bereits Befehle unterstützen. Das vollständige Modell zur Weiterleitung von Genehmigungen finden Sie unter [Ausführungsgenehmigungen](/de/tools/exec-approvals).

## Ereignisse und Betriebsverhalten

- Bearbeitungen und Löschungen von Nachrichten werden Systemereignissen zugeordnet.
- Thread-Übertragungen (Thread-Antworten mit „Also send to channel“) werden als normale Benutzernachrichten verarbeitet.
- Ereignisse zum Hinzufügen und Entfernen von Reaktionen werden Systemereignissen zugeordnet.
- Beitritt und Austritt von Mitgliedern, Erstellung und Umbenennung von Kanälen sowie Hinzufügen und Entfernen von Pins werden Systemereignissen zugeordnet.
- `channel_id_changed` kann Kanalkonfigurationsschlüssel migrieren, wenn `configWrites` aktiviert ist.
- Metadaten zu Thema und Zweck des Kanals werden als nicht vertrauenswürdiger Kontext behandelt und können in den Routing-Kontext eingefügt werden.
- Das Einlesen des Thread-Starters und des anfänglichen Thread-Verlaufskontexts wird gegebenenfalls anhand der konfigurierten Absender-Zulassungslisten gefiltert.
- Blockaktionen, Kurzbefehle und modale Interaktionen geben strukturierte Systemereignisse vom Typ `Slack interaction: ...` mit umfangreichen Nutzlastfeldern aus:
  - Blockaktionen: ausgewählte Werte, Beschriftungen, Auswahlwerte und `workflow_*`-Metadaten
  - globale Kurzbefehle: Callback- und Akteursmetadaten, weitergeleitet an die direkte Sitzung des Akteurs
  - Nachrichtenkurzbefehle: Callback-, Akteurs-, Kanal-, Thread- und Kontextdaten der ausgewählten Nachricht
  - modale Ereignisse `view_submission` und `view_closed` mit weitergeleiteten Kanalmetadaten und Formulareingaben

Definieren Sie globale oder Nachrichtenkurzbefehle in der Konfiguration Ihrer Slack-App und verwenden Sie eine beliebige nicht leere Callback-ID. OpenClaw bestätigt passende Kurzbefehl-Nutzlasten, wendet dieselben Absenderrichtlinien für DMs und Kanäle wie bei anderen Slack-Interaktionen an und stellt das bereinigte Ereignis für die weitergeleitete Agentensitzung in die Warteschlange. Trigger-IDs und Antwort-URLs werden im Agentenkontext unkenntlich gemacht.

## Konfigurationsreferenz

Primäre Referenz: [Konfigurationsreferenz – Slack](/de/gateway/config-channels#slack).

<Accordion title="Wichtige Slack-Felder">

- Modus/Authentifizierung: `mode`, `enterpriseOrgInstall`, `botToken`, `appToken`, `signingSecret`, `webhookPath`, `accounts.*`
- DM-Zugriff: `dm.enabled`, `dmPolicy`, `allowFrom` (veraltet: `dm.policy`, `dm.allowFrom`), `dm.groupEnabled`, `dm.groupChannels`
- Kompatibilitätsschalter: `dangerouslyAllowNameMatching` (Notfalloption; nur bei Bedarf aktivieren)
- Kanalzugriff: `groupPolicy`, `channels.*`, `channels.*.users`, `channels.*.requireMention`
- Threads/Verlauf: `replyToMode`, `replyToModeByChatType`, `thread.*`, `historyLimit`, `dmHistoryLimit`, `dms.*.historyLimit`
- Zustellung: `textChunkLimit`, `streaming.chunkMode`, `mediaMaxMb`, `streaming`, `streaming.nativeTransport`, `streaming.preview.toolProgress`
- Vorschauen: `unfurlLinks` (Standard: `false`), `unfurlMedia` zur Steuerung der Link-/Medienvorschau für `chat.postMessage`; setzen Sie `unfurlLinks: true`, um Linkvorschauen wieder zu aktivieren
- Betrieb/Funktionen: `configWrites`, `commands.native`, `slashCommand.*`, `actions.*`, `userToken`, `userTokenReadOnly`

</Accordion>

## Fehlerbehebung

<AccordionGroup>
  <Accordion title="Keine Antworten in Kanälen">
    Prüfen Sie der Reihe nach:

    - `groupPolicy`
    - Kanal-Zulassungsliste (`channels.slack.channels`) — **Schlüssel müssen Kanal-IDs sein** (`C12345678`), keine Namen (`#channel-name`). Namensbasierte Schlüssel schlagen unter `groupPolicy: "allowlist"` stillschweigend fehl, da das Kanal-Routing standardmäßig primär anhand der ID erfolgt. So finden Sie eine ID: Klicken Sie in Slack mit der rechten Maustaste auf den Kanal → **Copy link** — der Wert `C...` am Ende der URL ist die Kanal-ID.
    - `requireMention`
    - kanalspezifische `users`-Zulassungsliste
    - `messages.groupChat.visibleReplies`: Normale Gruppen-/Kanalanfragen verwenden standardmäßig `"automatic"`. Wenn Sie `"message_tool"` aktiviert haben und die Protokolle Assistententext ohne Aufruf von `message(action=send)` zeigen, hat das Modell den sichtbaren Pfad über das Nachrichten-Tool verfehlt. Der endgültige Text bleibt in diesem Modus privat; prüfen Sie das ausführliche Gateway-Protokoll auf Metadaten zu unterdrückten Nutzlasten oder setzen Sie den Wert auf `"automatic"`, wenn jede normale abschließende Assistentenantwort über den veralteten Pfad veröffentlicht werden soll.
    - `messages.groupChat.unmentionedInbound`: Bei `"room_event"` ist zulässige Kanalunterhaltung ohne Erwähnung Umgebungskontext und bleibt stumm, sofern der Agent nicht das Tool `message` aufruft. Siehe [Umgebungsraumereignisse](/de/channels/ambient-room-events).

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
    - Kopplungsgenehmigungen/Zulassungslisteneinträge (`dmPolicy: "open"` erfordert weiterhin `channels.slack.allowFrom: ["*"]`)
    - Gruppen-DMs verwenden die MPIM-Verarbeitung; aktivieren Sie `channels.slack.dm.groupEnabled` und nehmen Sie die MPIM, sofern konfiguriert, in `channels.slack.dm.groupChannels` auf
    - DM-Ereignisse des Slack Assistant: Ausführliche Protokolle mit `drop message_changed`
      bedeuten üblicherweise, dass Slack ein bearbeitetes Assistant-Thread-Ereignis ohne einen
      aus den Nachrichtenmetadaten wiederherstellbaren menschlichen Absender gesendet hat

```bash
openclaw pairing list slack
```

  </Accordion>

  <Accordion title="Socket Mode stellt keine Verbindung her">
    Überprüfen Sie Bot- und App-Token sowie die Aktivierung von Socket Mode in den Einstellungen der Slack-App.
    Das App-Level Token benötigt `connections:write`, und das Bot User OAuth Token
    muss zur selben Slack-App und demselben Workspace gehören wie das App-Token.

    Wenn `openclaw channels status --probe --json` den Wert `botTokenStatus` oder
    `appTokenStatus: "configured_unavailable"` anzeigt, ist das Slack-Konto
    konfiguriert, aber die aktuelle Laufzeit konnte den durch SecretRef referenzierten
    Wert nicht auflösen.

    Protokolle wie `slack socket mode failed to start; retry ...` weisen auf behebbare
    Startfehler hin. Fehlende Berechtigungsbereiche, widerrufene Token und ungültige Authentifizierung schlagen stattdessen
    sofort fehl. Ein Protokolleintrag `slack token mismatch ...` bedeutet, dass Bot-Token und App-Token
    anscheinend zu unterschiedlichen Slack-Apps gehören; korrigieren Sie die Anmeldedaten der Slack-App.

  </Accordion>

  <Accordion title="HTTP-Modus empfängt keine Ereignisse">
    Überprüfen Sie:

    - Signaturgeheimnis
    - Webhook-Pfad
    - Slack Request URLs (Events + Interactivity + Slash Commands)
    - eindeutiger `webhookPath` je HTTP-Konto
    - die öffentliche URL terminiert TLS und leitet Anfragen an den Gateway-Pfad weiter
    - der `request_url`-Pfad der Slack-App stimmt exakt mit `channels.slack.webhookPath` überein (Standard: `/slack/events`)

    Wenn `signingSecretStatus: "configured_unavailable"` in Konto-
    Snapshots erscheint, ist das HTTP-Konto konfiguriert, aber die aktuelle Laufzeit konnte das durch SecretRef referenzierte
    Signaturgeheimnis nicht auflösen.

    Ein wiederholter Protokolleintrag `slack: webhook path ... already registered` bedeutet, dass zwei HTTP-
    Konten denselben `webhookPath` verwenden; weisen Sie jedem Konto einen eigenen Pfad zu.

  </Accordion>

  <Accordion title="Native/Slash-Befehle werden nicht ausgelöst">
    Prüfen Sie, welche Variante Sie verwenden wollten:

    - nativer Befehlsmodus (`channels.slack.commands.native: true`) mit passenden in Slack registrierten Slash-Befehlen
    - oder Modus mit einem einzelnen Slash-Befehl (`channels.slack.slashCommand.enabled: true`)

    Slack erstellt oder entfernt Slash-Befehle nicht automatisch. `commands.native: "auto"` aktiviert keine nativen Slack-Befehle; verwenden Sie `true` und erstellen Sie die passenden Befehle in der Slack-App. Im HTTP-Modus muss jeder Slack-Slash-Befehl die Gateway-URL enthalten. Im Socket Mode treffen Befehlsnutzlasten über den WebSocket ein und Slack ignoriert `slash_commands[].url`.

    Prüfen Sie außerdem `commands.useAccessGroups`, die DM-Autorisierung, Kanal-Zulassungslisten
    und kanalspezifische `users`-Zulassungslisten. Slack gibt für
    blockierte Absender von Slash-Befehlen kurzlebige Fehler zurück, darunter:

    - `This channel is not allowed.`
    - `You are not authorized to use this command here.`

  </Accordion>
</AccordionGroup>

## Referenz für Anhangsmedien

Slack kann heruntergeladene Medien an den Agentendurchlauf anhängen, wenn Slack-Dateidownloads erfolgreich sind und die Größenbeschränkungen eingehalten werden. Audioclips können transkribiert werden, Bilddateien können den Pfad zur Medienanalyse durchlaufen oder direkt an ein visionsfähiges Antwortmodell übergeben werden, und andere Dateien bleiben als herunterladbarer Dateikontext verfügbar.

### Unterstützte Medientypen

| Medientyp                     | Quelle               | Aktuelles Verhalten                                                                  | Hinweise                                                                     |
| ------------------------------ | -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Slack-Audioclips              | Slack-Datei-URL       | Heruntergeladen und durch die gemeinsame Audiotranskription geleitet                          | Erfordert `files:read` und ein funktionierendes `tools.media.audio`-Modell oder eine CLI      |
| JPEG-/PNG-/GIF-/WebP-Bilder | Slack-Datei-URL       | Heruntergeladen und zur visionsfähigen Verarbeitung an den Durchlauf angehängt                   | Begrenzung je Datei: `channels.slack.mediaMaxMb` (Standard: 20 MB)                 |
| PDF-Dateien                      | Slack-Datei-URL       | Heruntergeladen und als Dateikontext für Tools wie `download-file` oder `pdf` bereitgestellt | Eingehende Slack-Nachrichten konvertieren PDFs nicht automatisch in eine Bildeingabe für Bildverarbeitung |
| Andere Dateien                    | Slack-Datei-URL       | Wenn möglich heruntergeladen und als Dateikontext bereitgestellt                              | Binärdateien werden nicht als Bildeingabe behandelt                               |
| Thread-Antworten                 | Dateien des Thread-Starters | Dateien der Ausgangsnachricht können als Kontext geladen werden, wenn die Antwort keine direkten Medien enthält  | Bei Startern, die nur aus Dateien bestehen, wird ein Anhangsplatzhalter verwendet                          |
| Nachrichten mit mehreren Dateien            | Mehrere Slack-Dateien | Jede Datei wird unabhängig ausgewertet                                              | Die Slack-Verarbeitung ist auf acht Dateien pro Nachricht begrenzt                     |

### Eingehende Verarbeitungspipeline

Wenn eine Slack-Nachricht mit Dateianhängen eintrifft:

1. OpenClaw lädt die Datei über die private URL von Slack mithilfe des Bot-Tokens herunter.
2. Bei Erfolg wird die Datei in den Medienspeicher geschrieben.
3. Die Pfade und Inhaltstypen der heruntergeladenen Medien werden dem eingehenden Kontext hinzugefügt.
4. Audioclips werden an die gemeinsame Transkriptionspipeline weitergeleitet; bildfähige Modell-/Tool-Pfade können Bildanhänge aus demselben Kontext verwenden.
5. Andere Dateien bleiben als Dateimetadaten oder Medienreferenzen für Tools verfügbar, die sie verarbeiten können.

### Vererbung von Anhängen der Thread-Ausgangsnachricht

Wenn eine Nachricht in einem Thread eingeht (also eine übergeordnete Nachricht mit `thread_ts` hat):

- Wenn die Antwort selbst keine direkten Medien enthält und die einbezogene Ausgangsnachricht Dateien enthält, kann Slack die Dateien der Ausgangsnachricht als Kontext des Thread-Starts laden.
- Dateien der Ausgangsnachricht werden nur beim Initialisieren einer neuen oder zurückgesetzten Thread-Sitzung geladen. Spätere Antworten, die nur Text enthalten, verwenden den vorhandenen Sitzungskontext erneut und hängen die Dateien der Ausgangsnachricht nicht erneut als neue Medien an.
- Direkte Antwortanhänge haben Vorrang vor Anhängen der Ausgangsnachricht.
- Eine Ausgangsnachricht, die nur Dateien und keinen Text enthält, wird mit einem Anhangsplatzhalter dargestellt, sodass der Fallback ihre Dateien weiterhin einbeziehen kann.

### Verarbeitung mehrerer Anhänge

Wenn eine einzelne Slack-Nachricht mehrere Dateianhänge enthält:

- Jeder Anhang wird unabhängig über die Medienpipeline verarbeitet.
- Referenzen auf heruntergeladene Medien werden im Nachrichtenkontext zusammengeführt.
- Die Verarbeitungsreihenfolge entspricht der Dateireihenfolge von Slack in der Ereignisnutzlast.
- Ein Fehler beim Herunterladen eines Anhangs blockiert die anderen nicht.

### Größen-, Download- und Modellbeschränkungen

- **Größenlimit**: Standardmäßig 20 MB pro Datei. Konfigurierbar über `channels.slack.mediaMaxMb`.
- **Limit für Audiotranskriptionen**: `tools.media.audio.maxBytes` gilt auch, wenn die heruntergeladene Datei an einen Transkriptions-Provider oder eine CLI gesendet wird.
- **Downloadfehler**: Dateien, die Slack nicht bereitstellen kann, abgelaufene URLs, nicht zugängliche Dateien, zu große Dateien sowie HTML-Antworten der Slack-Authentifizierung oder -Anmeldung werden übersprungen, statt als nicht unterstützte Formate gemeldet zu werden.
- **Vision-Modell**: Für die Bildanalyse wird das aktive Antwortmodell verwendet, wenn es Bildverarbeitung unterstützt, andernfalls das unter `agents.defaults.imageModel` konfigurierte Bildmodell.

### Bekannte Einschränkungen

| Szenario                                      | Aktuelles Verhalten                                                                   | Abhilfe                                                                    |
| --------------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Abgelaufene Slack-Datei-URL                        | Datei wird übersprungen; es wird kein Fehler angezeigt                                                       | Laden Sie die Datei erneut in Slack hoch                                                   |
| Audiotranskription nicht verfügbar               | Der Clip bleibt angehängt, es wird jedoch kein Transkript erstellt                                | Konfigurieren Sie `tools.media.audio` oder installieren Sie eine unterstützte lokale Transkriptions-CLI  |
| Clip ohne Begleittext passiert eine Erwähnungsprüfung nicht | Wird nach privater spekulativer Transkription verworfen; Transkript und Download werden gelöscht | Konfigurieren Sie ein Erwähnungsmuster für einen gesprochenen Namen, fügen Sie eine getippte Bot-Erwähnung hinzu oder verwenden Sie eine Direktnachricht |
| Vision-Modell nicht konfiguriert                   | Bildanhänge werden als Medienreferenzen gespeichert, jedoch nicht als Bilder analysiert       | Konfigurieren Sie `agents.defaults.imageModel` oder verwenden Sie ein bildfähiges Antwortmodell    |
| Sehr große Bilder (standardmäßig > 20 MB)        | Werden gemäß Größenlimit übersprungen                                                               | Erhöhen Sie `channels.slack.mediaMaxMb`, sofern Slack dies zulässt                          |
| Weitergeleitete/geteilte Anhänge                  | Text und von Slack gehostete Bild-/Dateimedien werden nach Möglichkeit verarbeitet                             | Teilen Sie sie direkt im OpenClaw-Thread erneut                                      |
| PDF-Anhänge                               | Werden als Datei-/Medienkontext gespeichert und nicht automatisch an die Bildverarbeitung weitergeleitet        | Verwenden Sie `download-file` für Dateimetadaten oder das Tool `pdf` für die PDF-Analyse      |

### Zugehörige Dokumentation

- [Pipeline zum Medienverständnis](/de/nodes/media-understanding)
- [Audio- und Sprachnotizen](/de/nodes/audio)
- [PDF-Tool](/de/tools/pdf)

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Kopplung" icon="link" href="/de/channels/pairing">
    Koppeln Sie einen Slack-Benutzer mit dem Gateway.
  </Card>
  <Card title="Gruppen" icon="users" href="/de/channels/groups">
    Verhalten von Kanälen und Gruppen-Direktnachrichten.
  </Card>
  <Card title="Kanalrouting" icon="route" href="/de/channels/channel-routing">
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
