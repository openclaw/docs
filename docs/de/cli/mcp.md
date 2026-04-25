---
read_when:
    - Codex, Claude Code oder einen anderen MCP-Client mit von OpenClaw unterstützten Kanälen verbinden
    - '`openclaw mcp serve` ausführen'
    - Von OpenClaw gespeicherte MCP-Serverdefinitionen verwalten
summary: OpenClaw-Kanalunterhaltungen über MCP bereitstellen und gespeicherte MCP-Serverdefinitionen verwalten
title: MCP
x-i18n:
    generated_at: "2026-04-25T13:43:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: ca2a76d1dbca71b4048659c21ac7ff98a01cc6095f6baad67df5347f45cd32e6
    source_path: cli/mcp.md
    workflow: 15
---

`openclaw mcp` hat zwei Aufgaben:

- OpenClaw mit `openclaw mcp serve` als MCP-Server ausführen
- von OpenClaw verwaltete ausgehende MCP-Serverdefinitionen mit `list`, `show`,
  `set` und `unset` verwalten

Mit anderen Worten:

- `serve` bedeutet, dass OpenClaw als MCP-Server agiert
- `list` / `show` / `set` / `unset` bedeutet, dass OpenClaw als clientseitige
  Registry für andere MCP-Server agiert, die seine Laufzeiten später verwenden könnten

Verwenden Sie [`openclaw acp`](/de/cli/acp), wenn OpenClaw selbst eine Coding-Harness-
Sitzung hosten und diese Laufzeit über ACP routen soll.

## OpenClaw als MCP-Server

Dies ist der Pfad `openclaw mcp serve`.

## Wann `serve` verwendet werden sollte

Verwenden Sie `openclaw mcp serve`, wenn:

- Codex, Claude Code oder ein anderer MCP-Client direkt mit
  von OpenClaw unterstützten Kanalunterhaltungen sprechen soll
- Sie bereits ein lokales oder entferntes OpenClaw Gateway mit gerouteten Sitzungen haben
- Sie einen MCP-Server möchten, der über die Kanal-Backends von OpenClaw hinweg funktioniert,
  statt separate Bridges pro Kanal auszuführen

Verwenden Sie stattdessen [`openclaw acp`](/de/cli/acp), wenn OpenClaw die Coding-
Laufzeit selbst hosten und die Agentensitzung innerhalb von OpenClaw halten soll.

## Wie es funktioniert

`openclaw mcp serve` startet einen stdio-MCP-Server. Der MCP-Client besitzt diesen
Prozess. Solange der Client die stdio-Sitzung offen hält, verbindet sich die Bridge über
WebSocket mit einem lokalen oder entfernten OpenClaw Gateway und stellt geroutete
Kanalunterhaltungen über MCP bereit.

Lebenszyklus:

1. der MCP-Client startet `openclaw mcp serve`
2. die Bridge verbindet sich mit dem Gateway
3. geroutete Sitzungen werden zu MCP-Unterhaltungen und Transcript-/History-Tools
4. Live-Ereignisse werden im Speicher in eine Warteschlange gestellt, solange die Bridge verbunden ist
5. wenn der Claude-Kanalmodus aktiviert ist, kann dieselbe Sitzung zusätzlich
   Claude-spezifische Push-Benachrichtigungen empfangen

Wichtiges Verhalten:

- der Zustand der Live-Warteschlange beginnt, wenn die Bridge sich verbindet
- älterer Transcript-Verlauf wird mit `messages_read` gelesen
- Claude-Push-Benachrichtigungen existieren nur, solange die MCP-Sitzung aktiv ist
- wenn der Client die Verbindung trennt, beendet sich die Bridge und die Live-Warteschlange geht verloren
- einmalige Agenten-Einstiegspunkte wie `openclaw agent` und
  `openclaw infer model run` beenden alle gebündelten MCP-Laufzeiten, die sie öffnen, wenn
  die Antwort abgeschlossen ist, sodass wiederholte skriptgesteuerte Läufe keine stdio-MCP-Kindprozesse ansammeln
- von OpenClaw gestartete stdio-MCP-Server (gebündelt oder benutzerkonfiguriert) werden beim Herunterfahren
  als Prozessbaum beendet, sodass vom Server gestartete Kind-Unterprozesse nach dem Beenden
  des übergeordneten stdio-Clients nicht weiterlaufen
- das Löschen oder Zurücksetzen einer Sitzung verwirft die MCP-Clients dieser Sitzung über
  den gemeinsamen Laufzeit-Bereinigungspfad, sodass keine verbleibenden stdio-Verbindungen
  an eine entfernte Sitzung gebunden bleiben

## Einen Client-Modus wählen

Verwenden Sie dieselbe Bridge auf zwei verschiedene Arten:

- Generische MCP-Clients: nur standardmäßige MCP-Tools. Verwenden Sie `conversations_list`,
  `messages_read`, `events_poll`, `events_wait`, `messages_send` und die
  Genehmigungs-Tools.
- Claude Code: standardmäßige MCP-Tools plus den Claude-spezifischen Kanaladapter.
  Aktivieren Sie `--claude-channel-mode on` oder belassen Sie den Standard `auto`.

Derzeit verhält sich `auto` genauso wie `on`. Es gibt noch keine Erkennung von Client-Fähigkeiten.

## Was `serve` bereitstellt

Die Bridge verwendet vorhandene Sitzungs-Routenmetadaten des Gateway, um kanalgestützte
Unterhaltungen bereitzustellen. Eine Unterhaltung erscheint, wenn OpenClaw bereits
einen Sitzungsstatus mit einer bekannten Route hat, etwa:

- `channel`
- Empfänger- oder Zielmetadaten
- optional `accountId`
- optional `threadId`

Dadurch erhalten MCP-Clients einen zentralen Ort, um:

- aktuelle geroutete Unterhaltungen aufzulisten
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

Listet aktuelle sitzungsgestützte Unterhaltungen auf, die bereits Routenmetadaten
im Gateway-Sitzungsstatus haben.

Nützliche Filter:

- `limit`
- `search`
- `channel`
- `includeDerivedTitles`
- `includeLastMessage`

### `conversation_get`

Gibt eine Unterhaltung anhand von `session_key` zurück.

### `messages_read`

Liest aktuelle Transcript-Nachrichten für eine sitzungsgestützte Unterhaltung.

### `attachments_fetch`

Extrahiert nicht textuelle Inhaltsblöcke einer Nachricht aus dem Transcript. Dies ist eine
Metadatenansicht über Transcript-Inhalte, kein eigenständiger dauerhafter Blob-Store für Anhänge.

### `events_poll`

Liest in die Warteschlange gestellte Live-Ereignisse ab einem numerischen Cursor.

### `events_wait`

Führt Long-Polling aus, bis das nächste passende in die Warteschlange gestellte Ereignis eintrifft
oder ein Timeout abläuft.

Verwenden Sie dies, wenn ein generischer MCP-Client eine nahezu Echtzeit-Zustellung ohne
Claude-spezifisches Push-Protokoll benötigt.

### `messages_send`

Sendet Text über dieselbe Route zurück, die bereits in der Sitzung gespeichert ist.

Aktuelles Verhalten:

- erfordert eine vorhandene Unterhaltungsroute
- verwendet Kanal, Empfänger, Konto-ID und Thread-ID der Sitzung
- sendet nur Text

### `permissions_list_open`

Listet ausstehende Genehmigungsanfragen für Exec/Plugin auf, die die Bridge seit
ihrer Verbindung zum Gateway beobachtet hat.

### `permissions_respond`

Löst eine ausstehende Genehmigungsanfrage für Exec/Plugin mit folgenden Werten auf:

- `allow-once`
- `allow-always`
- `deny`

## Ereignismodell

Die Bridge hält eine In-Memory-Ereigniswarteschlange, solange sie verbunden ist.

Aktuelle Ereignistypen:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

Wichtige Grenzen:

- die Warteschlange ist nur live; sie beginnt, wenn die MCP-Bridge startet
- `events_poll` und `events_wait` spielen keinen älteren Gateway-Verlauf
  von selbst erneut ab
- dauerhafter Rückstau sollte mit `messages_read` gelesen werden

## Claude-Kanalbenachrichtigungen

Die Bridge kann auch Claude-spezifische Kanalbenachrichtigungen bereitstellen. Dies ist das
OpenClaw-Äquivalent eines Claude-Code-Kanaladapters: standardmäßige MCP-Tools bleiben
verfügbar, aber eingehende Live-Nachrichten können zusätzlich als Claude-spezifische
MCP-Benachrichtigungen eintreffen.

Flags:

- `--claude-channel-mode off`: nur standardmäßige MCP-Tools
- `--claude-channel-mode on`: Claude-Kanalbenachrichtigungen aktivieren
- `--claude-channel-mode auto`: aktueller Standard; gleiches Bridge-Verhalten wie `on`

Wenn der Claude-Kanalmodus aktiviert ist, kündigt der Server experimentelle Claude-
Fähigkeiten an und kann Folgendes ausgeben:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Aktuelles Bridge-Verhalten:

- eingehende Transcript-Nachrichten vom Typ `user` werden weitergeleitet als
  `notifications/claude/channel`
- über MCP empfangene Claude-Genehmigungsanfragen werden im Speicher verfolgt
- wenn die verknüpfte Unterhaltung später `yes abcde` oder `no abcde` sendet, wandelt die Bridge
  dies in `notifications/claude/channel/permission` um
- diese Benachrichtigungen gelten nur für die Live-Sitzung; wenn der MCP-Client die Verbindung trennt,
  gibt es kein Push-Ziel

Dies ist absichtlich clientspezifisch. Generische MCP-Clients sollten sich auf die
standardmäßigen Polling-Tools verlassen.

## MCP-Client-Konfiguration

Beispiel für eine stdio-Client-Konfiguration:

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

Für die meisten generischen MCP-Clients sollten Sie mit der standardmäßigen Tool-Oberfläche beginnen
und den Claude-Modus ignorieren. Aktivieren Sie den Claude-Modus nur für Clients,
die die Claude-spezifischen Benachrichtigungsmethoden tatsächlich verstehen.

## Optionen

`openclaw mcp serve` unterstützt:

- `--url <url>`: Gateway-WebSocket-URL
- `--token <token>`: Gateway-Token
- `--token-file <path>`: Token aus Datei lesen
- `--password <password>`: Gateway-Passwort
- `--password-file <path>`: Passwort aus Datei lesen
- `--claude-channel-mode <auto|on|off>`: Claude-Benachrichtigungsmodus
- `-v`, `--verbose`: ausführliche Logs auf stderr

Bevorzugen Sie nach Möglichkeit `--token-file` oder `--password-file` gegenüber eingebetteten Geheimnissen.

## Sicherheit und Vertrauensgrenze

Die Bridge erfindet kein Routing. Sie stellt nur Unterhaltungen bereit, von denen das Gateway
bereits weiß, wie sie geroutet werden.

Das bedeutet:

- Allowlists für Absender, Pairing und Vertrauen auf Kanalebene gehören weiterhin zur
  zugrunde liegenden OpenClaw-Kanalkonfiguration
- `messages_send` kann nur über eine vorhandene gespeicherte Route antworten
- der Genehmigungsstatus ist nur live/im Speicher für die aktuelle Bridge-Sitzung vorhanden
- die Bridge-Authentifizierung sollte dieselben Gateway-Token- oder Passwortkontrollen verwenden,
  denen Sie auch für jeden anderen entfernten Gateway-Client vertrauen würden

Wenn eine Unterhaltung in `conversations_list` fehlt, liegt die übliche Ursache nicht an der
MCP-Konfiguration. Es fehlen dann Routenmetadaten in der zugrunde liegenden
Gateway-Sitzung oder sie sind unvollständig.

## Testen

OpenClaw liefert für diese Bridge einen deterministischen Docker-Smoke-Test mit:

```bash
pnpm test:docker:mcp-channels
```

Dieser Smoke-Test:

- startet einen Gateway-Container mit Seed-Daten
- startet einen zweiten Container, der `openclaw mcp serve` ausführt
- verifiziert Unterhaltungserkennung, Transcript-Lesevorgänge, Metadaten-Lesevorgänge für Anhänge,
  das Verhalten der Live-Ereigniswarteschlange und das Routing ausgehender Sendungen
- validiert Claude-artige Kanal- und Genehmigungsbenachrichtigungen über die echte
  stdio-MCP-Bridge

Dies ist der schnellste Weg nachzuweisen, dass die Bridge funktioniert, ohne ein echtes
Telegram-, Discord- oder iMessage-Konto in den Testlauf einzubinden.

Für weiteren Testkontext siehe [Testing](/de/help/testing).

## Fehlerbehebung

### Keine Unterhaltungen zurückgegeben

Bedeutet in der Regel, dass die Gateway-Sitzung noch nicht routbar ist. Bestätigen Sie, dass die
zugrunde liegende Sitzung gespeicherte Kanal-/Provider-, Empfänger- und optionale
Konto-/Thread-Routenmetadaten hat.

### `events_poll` oder `events_wait` verpasst ältere Nachrichten

Erwartetes Verhalten. Die Live-Warteschlange beginnt, wenn die Bridge sich verbindet. Lesen Sie älteren
Transcript-Verlauf mit `messages_read`.

### Claude-Benachrichtigungen erscheinen nicht

Prüfen Sie alle folgenden Punkte:

- der Client hat die stdio-MCP-Sitzung offen gehalten
- `--claude-channel-mode` ist `on` oder `auto`
- der Client versteht die Claude-spezifischen Benachrichtigungsmethoden tatsächlich
- die eingehende Nachricht ist nach dem Verbinden der Bridge eingetroffen

### Genehmigungen fehlen

`permissions_list_open` zeigt nur Genehmigungsanfragen an, die beobachtet wurden, während die Bridge
verbunden war. Es ist keine API für dauerhaften Genehmigungsverlauf.

## OpenClaw als MCP-Client-Registry

Dies ist der Pfad `openclaw mcp list`, `show`, `set` und `unset`.

Diese Befehle stellen OpenClaw nicht über MCP bereit. Sie verwalten von OpenClaw verwaltete MCP-
Serverdefinitionen unter `mcp.servers` in der OpenClaw-Konfiguration.

Diese gespeicherten Definitionen sind für Laufzeiten, die OpenClaw später startet oder konfiguriert,
etwa eingebettetes Pi und andere Laufzeitadapter. OpenClaw speichert die
Definitionen zentral, damit diese Laufzeiten keine eigenen doppelten
MCP-Serverlisten vorhalten müssen.

Wichtiges Verhalten:

- diese Befehle lesen oder schreiben nur die OpenClaw-Konfiguration
- sie verbinden sich nicht mit dem Ziel-MCP-Server
- sie validieren nicht, ob Befehl, URL oder entfernter Transport aktuell erreichbar sind
- Laufzeitadapter entscheiden zur Ausführungszeit, welche Transportformen sie tatsächlich unterstützen
- eingebettetes Pi stellt konfigurierte MCP-Tools in normalen Tool-Profilen `coding` und `messaging` bereit;
  `minimal` blendet sie weiterhin aus, und `tools.deny: ["bundle-mcp"]` deaktiviert sie explizit
- sitzungsbezogene gebündelte MCP-Laufzeiten werden nach `mcp.sessionIdleTtlMs`
  Millisekunden Leerlauf beendet (Standard 10 Minuten; setzen Sie `0`, um dies zu deaktivieren), und
  einmalige eingebettete Läufe bereinigen sie am Ende des Laufs

## Gespeicherte MCP-Serverdefinitionen

OpenClaw speichert außerdem eine leichtgewichtige MCP-Server-Registry in der Konfiguration für
Oberflächen, die von OpenClaw verwaltete MCP-Definitionen verwenden möchten.

Befehle:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

Hinweise:

- `list` sortiert Servernamen.
- `show` ohne Namen gibt das vollständig konfigurierte MCP-Serverobjekt aus.
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

Startet einen lokalen Kindprozess und kommuniziert über stdin/stdout.

| Feld                       | Beschreibung                         |
| -------------------------- | ------------------------------------ |
| `command`                  | Auszuführendes Programm (erforderlich) |
| `args`                     | Array von Befehlszeilenargumenten    |
| `env`                      | Zusätzliche Umgebungsvariablen       |
| `cwd` / `workingDirectory` | Arbeitsverzeichnis für den Prozess   |

#### Stdio-`env`-Sicherheitsfilter

OpenClaw weist Umgebungsvariablenschlüssel für den Interpreter-Start zurück, die beeinflussen können, wie ein stdio-MCP-Server vor dem ersten RPC startet, selbst wenn sie im `env`-Block eines Servers erscheinen. Blockierte Schlüssel umfassen `NODE_OPTIONS`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4` und ähnliche Variablen zur Laufzeitsteuerung. Der Start weist diese mit einem Konfigurationsfehler zurück, sodass sie weder ein implizites Vorspiel einschleusen, noch den Interpreter austauschen oder einen Debugger für den stdio-Prozess aktivieren können. Normale Umgebungsvariablen für Anmeldedaten, Proxys und serverspezifische Werte (`GITHUB_TOKEN`, `HTTP_PROXY`, benutzerdefinierte `*_API_KEY` usw.) sind davon nicht betroffen.

Wenn Ihr MCP-Server tatsächlich eine der blockierten Variablen benötigt, setzen Sie sie auf dem Gateway-Hostprozess statt unter `env` des stdio-Servers.

### SSE-/HTTP-Transport

Verbindet sich über HTTP Server-Sent Events mit einem entfernten MCP-Server.

| Feld                  | Beschreibung                                                          |
| --------------------- | --------------------------------------------------------------------- |
| `url`                 | HTTP- oder HTTPS-URL des entfernten Servers (erforderlich)            |
| `headers`             | Optionale Schlüssel-Wert-Map von HTTP-Headern (zum Beispiel Auth-Tokens) |
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

Sensible Werte in `url` (userinfo) und `headers` werden in Logs und
Statusausgaben unkenntlich gemacht.

### Streamable-HTTP-Transport

`streamable-http` ist neben `sse` und `stdio` eine zusätzliche Transportoption. Sie verwendet HTTP-Streaming für bidirektionale Kommunikation mit entfernten MCP-Servern.

| Feld                  | Beschreibung                                                                                 |
| --------------------- | -------------------------------------------------------------------------------------------- |
| `url`                 | HTTP- oder HTTPS-URL des entfernten Servers (erforderlich)                                   |
| `transport`           | Auf `"streamable-http"` setzen, um diesen Transport auszuwählen; wenn weggelassen, verwendet OpenClaw `sse` |
| `headers`             | Optionale Schlüssel-Wert-Map von HTTP-Headern (zum Beispiel Auth-Tokens)                    |
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

Diese Befehle verwalten nur die gespeicherte Konfiguration. Sie starten nicht die Kanal-Bridge,
öffnen keine aktive MCP-Client-Sitzung und beweisen nicht, dass der Zielserver erreichbar ist.

## Aktuelle Einschränkungen

Diese Seite dokumentiert die Bridge in ihrem heute ausgelieferten Zustand.

Aktuelle Einschränkungen:

- Die Erkennung von Unterhaltungen hängt von vorhandenen Routenmetadaten der Gateway-Sitzung ab
- kein generisches Push-Protokoll über den Claude-spezifischen Adapter hinaus
- noch keine Tools zum Bearbeiten oder Reagieren auf Nachrichten
- der Transport über HTTP/SSE/streamable-http verbindet sich mit einem einzelnen entfernten Server; noch kein multiplexter Upstream
- `permissions_list_open` enthält nur Genehmigungen, die beobachtet wurden, während die Bridge
  verbunden ist

## Verwandt

- [CLI reference](/de/cli)
- [Plugins](/de/cli/plugins)
