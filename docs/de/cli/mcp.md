---
read_when:
    - Codex, Claude Code oder einen anderen MCP-Client mit von OpenClaw unterstützten Channels verbinden
    - '`openclaw mcp serve` ausführen'
    - Von OpenClaw gespeicherte MCP-Serverdefinitionen verwalten
summary: OpenClaw-Channel-Konversationen über MCP bereitstellen und gespeicherte MCP-Serverdefinitionen verwalten
title: mcp
x-i18n:
    generated_at: "2026-04-23T06:27:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: bbc528a7490132f4b505f62bdc4556602243a5e27557c4965c2e1d4f80ad00bd
    source_path: cli/mcp.md
    workflow: 15
---

# mcp

`openclaw mcp` hat zwei Aufgaben:

- OpenClaw mit `openclaw mcp serve` als MCP-Server ausführen
- OpenClaw-eigene ausgehende MCP-Serverdefinitionen mit `list`, `show`,
  `set` und `unset` verwalten

Mit anderen Worten:

- `serve` bedeutet, dass OpenClaw als MCP-Server fungiert
- `list` / `show` / `set` / `unset` bedeutet, dass OpenClaw als clientseitige
  Registry für andere MCP-Server fungiert, die seine Laufzeitumgebungen später verwenden können

Verwenden Sie [`openclaw acp`](/de/cli/acp), wenn OpenClaw selbst eine Coding-Harness-
Sitzung hosten und diese Laufzeit über ACP leiten soll.

## OpenClaw als MCP-Server

Dies ist der Pfad `openclaw mcp serve`.

## Wann `serve` verwendet werden sollte

Verwenden Sie `openclaw mcp serve`, wenn:

- Codex, Claude Code oder ein anderer MCP-Client direkt mit von OpenClaw
  unterstützten Channel-Konversationen kommunizieren soll
- Sie bereits ein lokales oder entferntes OpenClaw Gateway mit gerouteten Sitzungen haben
- Sie einen MCP-Server möchten, der kanalübergreifend über OpenClaws Channel-Backends
  funktioniert, statt separate Bridges pro Channel auszuführen

Verwenden Sie stattdessen [`openclaw acp`](/de/cli/acp), wenn OpenClaw die Coding-
Laufzeit selbst hosten und die Agent-Sitzung innerhalb von OpenClaw behalten soll.

## Funktionsweise

`openclaw mcp serve` startet einen stdio-MCP-Server. Der MCP-Client besitzt
diesen Prozess. Solange der Client die stdio-Sitzung offen hält, verbindet sich
die Bridge über WebSocket mit einem lokalen oder entfernten OpenClaw Gateway
und stellt geroutete Channel-Konversationen über MCP bereit.

Lebenszyklus:

1. Der MCP-Client startet `openclaw mcp serve`
2. die Bridge verbindet sich mit dem Gateway
3. geroutete Sitzungen werden zu MCP-Konversationen und Transcript-/Verlauf-Tools
4. Live-Ereignisse werden im Speicher in eine Queue gestellt, solange die Bridge verbunden ist
5. wenn der Claude-Channel-Modus aktiviert ist, kann dieselbe Sitzung auch
   Claude-spezifische Push-Benachrichtigungen empfangen

Wichtiges Verhalten:

- der Zustand der Live-Queue beginnt, wenn die Bridge sich verbindet
- älterer Transcript-Verlauf wird mit `messages_read` gelesen
- Claude-Push-Benachrichtigungen existieren nur, solange die MCP-Sitzung aktiv ist
- wenn der Client die Verbindung trennt, beendet sich die Bridge und die Live-Queue ist weg

## Einen Client-Modus auswählen

Verwenden Sie dieselbe Bridge auf zwei unterschiedliche Arten:

- Generische MCP-Clients: nur Standard-MCP-Tools. Verwenden Sie `conversations_list`,
  `messages_read`, `events_poll`, `events_wait`, `messages_send` und die
  Genehmigungs-Tools.
- Claude Code: Standard-MCP-Tools plus den Claude-spezifischen Channel-Adapter.
  Aktivieren Sie `--claude-channel-mode on` oder lassen Sie den Standardwert `auto`.

Aktuell verhält sich `auto` genauso wie `on`. Eine Erkennung von Client-
Fähigkeiten gibt es noch nicht.

## Was `serve` bereitstellt

Die Bridge verwendet vorhandene Gateway-Metadaten für Sitzungsrouten, um
konversationsgestützte Channel-Routen bereitzustellen. Eine Konversation
erscheint, wenn OpenClaw bereits einen Sitzungszustand mit einer bekannten Route
hat, zum Beispiel:

- `channel`
- Empfänger- oder Zielmetadaten
- optional `accountId`
- optional `threadId`

Dadurch erhalten MCP-Clients einen Ort, um:

- aktuelle geroutete Konversationen aufzulisten
- aktuellen Transcript-Verlauf zu lesen
- auf neue eingehende Ereignisse zu warten
- eine Antwort über dieselbe Route zurückzusenden
- Genehmigungsanfragen zu sehen, die eintreffen, während die Bridge verbunden ist

## Verwendung

```bash
# Lokales Gateway
openclaw mcp serve

# Entferntes Gateway
openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Entferntes Gateway mit Passwortauthentifizierung
openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password

# Ausführliche Bridge-Logs aktivieren
openclaw mcp serve --verbose

# Claude-spezifische Push-Benachrichtigungen deaktivieren
openclaw mcp serve --claude-channel-mode off
```

## Bridge-Tools

Die aktuelle Bridge stellt diese MCP-Tools bereit:

- `conversations_list`
- `conversation_get`
- `messages_read`
- `attachments_fetch`
- `events_poll`
- `events_wait`
- `messages_send`
- `permissions_list_open`
- `permissions_respond`

### `conversations_list`

Listet aktuelle sitzungsgestützte Konversationen auf, die bereits Routenmetadaten
im Gateway-Sitzungszustand haben.

Nützliche Filter:

- `limit`
- `search`
- `channel`
- `includeDerivedTitles`
- `includeLastMessage`

### `conversation_get`

Gibt eine Konversation anhand von `session_key` zurück.

### `messages_read`

Liest aktuelle Transcript-Nachrichten für eine sitzungsgestützte Konversation.

### `attachments_fetch`

Extrahiert Nicht-Text-Inhaltsblöcke aus einer Transcript-Nachricht. Dies ist
eine Metadatenansicht über Transcript-Inhalte, kein eigenständiger dauerhafter
Attachment-Blob-Store.

### `events_poll`

Liest in die Queue gestellte Live-Ereignisse ab einem numerischen Cursor.

### `events_wait`

Long-Polling, bis das nächste passende in die Queue gestellte Ereignis eintrifft
oder ein Timeout abläuft.

Verwenden Sie dies, wenn ein generischer MCP-Client nahezu Echtzeit-Zustellung
ohne ein Claude-spezifisches Push-Protokoll benötigt.

### `messages_send`

Sendet Text über dieselbe Route zurück, die bereits in der Sitzung gespeichert ist.

Aktuelles Verhalten:

- erfordert eine vorhandene Konversationsroute
- verwendet den Channel, den Empfänger, die Account-ID und die Thread-ID der Sitzung
- sendet nur Text

### `permissions_list_open`

Listet ausstehende Genehmigungsanfragen für exec/Plugins auf, die die Bridge seit
ihrer Verbindung mit dem Gateway beobachtet hat.

### `permissions_respond`

Löst eine ausstehende Genehmigungsanfrage für exec/Plugins auf mit:

- `allow-once`
- `allow-always`
- `deny`

## Ereignismodell

Die Bridge hält eine In-Memory-Ereignis-Queue, solange sie verbunden ist.

Aktuelle Ereignistypen:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

Wichtige Einschränkungen:

- die Queue ist nur live; sie beginnt, wenn die MCP-Bridge startet
- `events_poll` und `events_wait` spielen älteren Gateway-Verlauf nicht
  selbstständig erneut ab
- ein dauerhafter Rückstand sollte mit `messages_read` gelesen werden

## Claude-Channel-Benachrichtigungen

Die Bridge kann auch Claude-spezifische Channel-Benachrichtigungen bereitstellen.
Dies ist das OpenClaw-Äquivalent eines Claude-Code-Channel-Adapters: Standard-
MCP-Tools bleiben verfügbar, aber eingehende Live-Nachrichten können zusätzlich
als Claude-spezifische MCP-Benachrichtigungen eintreffen.

Flags:

- `--claude-channel-mode off`: nur Standard-MCP-Tools
- `--claude-channel-mode on`: Claude-Channel-Benachrichtigungen aktivieren
- `--claude-channel-mode auto`: aktueller Standard; gleiches Bridge-Verhalten wie `on`

Wenn der Claude-Channel-Modus aktiviert ist, kündigt der Server experimentelle
Claude-Fähigkeiten an und kann Folgendes ausgeben:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Aktuelles Bridge-Verhalten:

- eingehende Transcript-Nachrichten von `user` werden als
  `notifications/claude/channel` weitergeleitet
- über MCP empfangene Claude-Berechtigungsanfragen werden im Speicher verfolgt
- wenn die verknüpfte Konversation später `yes abcde` oder `no abcde` sendet,
  wandelt die Bridge dies in `notifications/claude/channel/permission` um
- diese Benachrichtigungen gelten nur für die Live-Sitzung; wenn der MCP-Client
  die Verbindung trennt, gibt es kein Push-Ziel

Dies ist absichtlich clientspezifisch. Generische MCP-Clients sollten sich auf
die Standard-Polling-Tools verlassen.

## MCP-Client-Konfiguration

Beispielkonfiguration für einen stdio-Client:

```json
{
  "mcpServers": {
    "openclaw": {
      "command": "openclaw",
      "args": [
        "mcp",
        "serve",
        "--url",
        "wss://gateway-host:18789",
        "--token-file",
        "/path/to/gateway.token"
      ]
    }
  }
}
```

Beginnen Sie bei den meisten generischen MCP-Clients mit der Standard-
Tool-Oberfläche und ignorieren Sie den Claude-Modus. Aktivieren Sie den Claude-
Modus nur für Clients, die die Claude-spezifischen Benachrichtigungsmethoden
tatsächlich verstehen.

## Optionen

`openclaw mcp serve` unterstützt:

- `--url <url>`: Gateway-WebSocket-URL
- `--token <token>`: Gateway-Token
- `--token-file <path>`: Token aus Datei lesen
- `--password <password>`: Gateway-Passwort
- `--password-file <path>`: Passwort aus Datei lesen
- `--claude-channel-mode <auto|on|off>`: Claude-Benachrichtigungsmodus
- `-v`, `--verbose`: ausführliche Logs auf stderr

Bevorzugen Sie nach Möglichkeit `--token-file` oder `--password-file` gegenüber
inline angegebenen Geheimnissen.

## Sicherheit und Vertrauensgrenze

Die Bridge erfindet kein Routing. Sie stellt nur Konversationen bereit, von
denen das Gateway bereits weiß, wie sie geroutet werden.

Das bedeutet:

- Absender-Allowlists, Pairing und Vertrauen auf Channel-Ebene gehören weiterhin
  zur zugrunde liegenden OpenClaw-Channel-Konfiguration
- `messages_send` kann nur über eine vorhandene gespeicherte Route antworten
- der Genehmigungszustand ist nur live/im Speicher für die aktuelle Bridge-Sitzung
- die Bridge-Authentifizierung sollte dieselben Gateway-Token- oder Passwort-
  Kontrollen verwenden, denen Sie auch bei jedem anderen entfernten Gateway-
  Client vertrauen würden

Wenn eine Konversation in `conversations_list` fehlt, ist die übliche Ursache
nicht die MCP-Konfiguration. Es fehlen Routenmetadaten im zugrunde liegenden
Gateway-Sitzungszustand oder sie sind unvollständig.

## Tests

OpenClaw liefert einen deterministischen Docker-Smoke für diese Bridge mit:

```bash
pnpm test:docker:mcp-channels
```

Dieser Smoke:

- startet einen Gateway-Container mit vorbereiteten Daten
- startet einen zweiten Container, der `openclaw mcp serve` ausführt
- verifiziert Konversationserkennung, Transcript-Lesevorgänge, Lesen von
  Attachment-Metadaten, Verhalten der Live-Ereignis-Queue und ausgehendes
  Send-Routing
- validiert Claude-artige Channel- und Berechtigungsbenachrichtigungen über die
  echte stdio-MCP-Bridge

Dies ist der schnellste Weg, um nachzuweisen, dass die Bridge funktioniert, ohne
ein echtes Telegram-, Discord- oder iMessage-Konto in den Testlauf einzubinden.

Für einen breiteren Testkontext siehe [Testing](/de/help/testing).

## Fehlerbehebung

### Keine Konversationen zurückgegeben

Bedeutet normalerweise, dass die Gateway-Sitzung noch nicht geroutet werden
kann. Bestätigen Sie, dass die zugrunde liegende Sitzung gespeicherte
Channel-/Provider-, Empfänger- und optionale Account-/Thread-Routenmetadaten hat.

### `events_poll` oder `events_wait` verpasst ältere Nachrichten

Erwartet. Die Live-Queue beginnt, wenn die Bridge sich verbindet. Lesen Sie
älteren Transcript-Verlauf mit `messages_read`.

### Claude-Benachrichtigungen werden nicht angezeigt

Prüfen Sie all dies:

- der Client hat die stdio-MCP-Sitzung offen gehalten
- `--claude-channel-mode` ist `on` oder `auto`
- der Client versteht die Claude-spezifischen Benachrichtigungsmethoden tatsächlich
- die eingehende Nachricht ist nach dem Verbindungsaufbau der Bridge eingetroffen

### Genehmigungen fehlen

`permissions_list_open` zeigt nur Genehmigungsanfragen an, die beobachtet
wurden, während die Bridge verbunden war. Es ist keine API für dauerhaften
Genehmigungsverlauf.

## OpenClaw als MCP-Client-Registry

Dies ist der Pfad `openclaw mcp list`, `show`, `set` und `unset`.

Diese Befehle stellen OpenClaw nicht über MCP bereit. Sie verwalten OpenClaw-
eigene MCP-Serverdefinitionen unter `mcp.servers` in der OpenClaw-Konfiguration.

Diese gespeicherten Definitionen sind für Laufzeitumgebungen gedacht, die
OpenClaw später startet oder konfiguriert, wie eingebettetes Pi und andere
Laufzeitadapter. OpenClaw speichert die Definitionen zentral, damit diese
Laufzeitumgebungen keine eigenen doppelten MCP-Serverlisten pflegen müssen.

Wichtiges Verhalten:

- diese Befehle lesen oder schreiben nur die OpenClaw-Konfiguration
- sie stellen keine Verbindung zum Ziel-MCP-Server her
- sie validieren nicht, ob der Befehl, die URL oder der entfernte Transport
  aktuell erreichbar ist
- Laufzeitadapter entscheiden zur Ausführungszeit, welche Transportformen sie
  tatsächlich unterstützen
- eingebettetes Pi stellt konfigurierte MCP-Tools in den normalen Tool-Profilen
  `coding` und `messaging` bereit; `minimal` blendet sie weiterhin aus, und
  `tools.deny: ["bundle-mcp"]` deaktiviert sie explizit

## Gespeicherte MCP-Serverdefinitionen

OpenClaw speichert auch eine leichtgewichtige MCP-Server-Registry in der
Konfiguration für Oberflächen, die von OpenClaw verwaltete MCP-Definitionen
verwenden möchten.

Befehle:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

Hinweise:

- `list` sortiert Servernamen.
- `show` ohne Namen gibt das vollständige konfigurierte MCP-Serverobjekt aus.
- `set` erwartet einen JSON-Objektwert in der Befehlszeile.
- `unset` schlägt fehl, wenn der benannte Server nicht existiert.

Beispiele:

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp set docs '{"url":"https://mcp.example.com"}'
openclaw mcp unset context7
```

Beispiel für die Konfigurationsstruktur:

```json
{
  "mcp": {
    "servers": {
      "context7": {
        "command": "uvx",
        "args": ["context7-mcp"]
      },
      "docs": {
        "url": "https://mcp.example.com"
      }
    }
  }
}
```

### Stdio-Transport

Startet einen lokalen Child-Prozess und kommuniziert über stdin/stdout.

| Feld                       | Beschreibung                           |
| -------------------------- | -------------------------------------- |
| `command`                  | Ausführbare Datei, die gestartet wird (erforderlich) |
| `args`                     | Array von Befehlszeilenargumenten      |
| `env`                      | Zusätzliche Umgebungsvariablen         |
| `cwd` / `workingDirectory` | Arbeitsverzeichnis für den Prozess     |

#### Stdio-Umgebungsvariablen-Sicherheitsfilter

OpenClaw lehnt Umgebungsvariablen für den Interpreter-Start ab, die verändern können, wie ein stdio-MCP-Server vor dem ersten RPC startet, selbst wenn sie im `env`-Block eines Servers erscheinen. Zu den blockierten Schlüsseln gehören `NODE_OPTIONS`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4` und ähnliche Laufzeitsteuerungsvariablen. Der Start lehnt diese mit einem Konfigurationsfehler ab, damit sie kein implizites Prelude injizieren, den Interpreter austauschen oder einen Debugger gegen den stdio-Prozess aktivieren können. Normale Anmeldedaten-, Proxy- und serverspezifische Umgebungsvariablen (`GITHUB_TOKEN`, `HTTP_PROXY`, benutzerdefinierte `*_API_KEY` usw.) bleiben unbeeinflusst.

Wenn Ihr MCP-Server tatsächlich eine der blockierten Variablen benötigt, setzen Sie sie auf dem Gateway-Host-Prozess statt unter `env` des stdio-Servers.

### SSE-/HTTP-Transport

Stellt über HTTP Server-Sent Events eine Verbindung zu einem entfernten MCP-Server her.

| Feld                  | Beschreibung                                                          |
| --------------------- | --------------------------------------------------------------------- |
| `url`                 | HTTP- oder HTTPS-URL des entfernten Servers (erforderlich)            |
| `headers`             | Optionale Schlüssel-Wert-Zuordnung von HTTP-Headern (zum Beispiel Auth-Token) |
| `connectionTimeoutMs` | Verbindungs-Timeout pro Server in ms (optional)                       |

Beispiel:

```json
{
  "mcp": {
    "servers": {
      "remote-tools": {
        "url": "https://mcp.example.com",
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

Vertrauliche Werte in `url` (userinfo) und `headers` werden in Logs und in der
Statusausgabe geschwärzt.

### Streamable-HTTP-Transport

`streamable-http` ist eine zusätzliche Transportoption neben `sse` und `stdio`. Es verwendet HTTP-Streaming für bidirektionale Kommunikation mit entfernten MCP-Servern.

| Feld                  | Beschreibung                                                                                 |
| --------------------- | -------------------------------------------------------------------------------------------- |
| `url`                 | HTTP- oder HTTPS-URL des entfernten Servers (erforderlich)                                   |
| `transport`           | Auf `"streamable-http"` setzen, um diesen Transport auszuwählen; wenn weggelassen, verwendet OpenClaw `sse` |
| `headers`             | Optionale Schlüssel-Wert-Zuordnung von HTTP-Headern (zum Beispiel Auth-Token)                |
| `connectionTimeoutMs` | Verbindungs-Timeout pro Server in ms (optional)                                              |

Beispiel:

```json
{
  "mcp": {
    "servers": {
      "streaming-tools": {
        "url": "https://mcp.example.com/stream",
        "transport": "streamable-http",
        "connectionTimeoutMs": 10000,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

Diese Befehle verwalten nur die gespeicherte Konfiguration. Sie starten nicht die
Channel-Bridge, öffnen keine Live-MCP-Client-Sitzung und belegen nicht, dass
der Zielserver erreichbar ist.

## Aktuelle Einschränkungen

Diese Seite dokumentiert die Bridge in ihrem heutigen Stand.

Aktuelle Einschränkungen:

- die Konversationserkennung hängt von vorhandenen Gateway-Metadaten für Sitzungsrouten ab
- es gibt noch kein generisches Push-Protokoll über den Claude-spezifischen Adapter hinaus
- es gibt noch keine Tools zum Bearbeiten oder Reagieren auf Nachrichten
- der HTTP-/SSE-/streamable-http-Transport verbindet zu einem einzelnen entfernten Server; es gibt noch kein multiplexiertes Upstream
- `permissions_list_open` enthält nur Genehmigungen, die beobachtet wurden, während die Bridge verbunden ist
