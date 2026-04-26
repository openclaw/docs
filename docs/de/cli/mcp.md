---
read_when:
    - Codex, Claude Code oder einen anderen MCP-Client mit OpenClaw-gestützten Kanälen verbinden
    - '`openclaw mcp serve` ausführen'
    - Von OpenClaw gespeicherte MCP-Serverdefinitionen verwalten
sidebarTitle: MCP
summary: OpenClaw-Kanalunterhaltungen über MCP verfügbar machen und gespeicherte MCP-Serverdefinitionen verwalten
title: MCP
x-i18n:
    generated_at: "2026-04-26T11:26:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1e003d974a7ae989f240d7608470ddcf2f37e20ca342cf4569c14677dc6fc1d8
    source_path: cli/mcp.md
    workflow: 15
---

`openclaw mcp` hat zwei Aufgaben:

- OpenClaw mit `openclaw mcp serve` als MCP-Server ausführen
- von OpenClaw verwaltete ausgehende MCP-Serverdefinitionen mit `list`, `show`, `set` und `unset` verwalten

Anders gesagt:

- `serve` bedeutet, dass OpenClaw als MCP-Server fungiert
- `list` / `show` / `set` / `unset` bedeuten, dass OpenClaw als clientseitige Registry für andere MCP-Server fungiert, die seine Laufzeiten später nutzen können

Verwenden Sie [`openclaw acp`](/de/cli/acp), wenn OpenClaw selbst eine Coding-Harness-Sitzung hosten und diese Laufzeit über ACP routen soll.

## OpenClaw als MCP-Server

Dies ist der Pfad `openclaw mcp serve`.

### Wann `serve` verwendet werden sollte

Verwenden Sie `openclaw mcp serve`, wenn:

- Codex, Claude Code oder ein anderer MCP-Client direkt mit von OpenClaw unterstützten Kanalunterhaltungen sprechen soll
- Sie bereits ein lokales oder entferntes OpenClaw Gateway mit gerouteten Sitzungen haben
- Sie einen MCP-Server möchten, der über die Kanal-Backends von OpenClaw hinweg funktioniert, statt separate Bridges pro Kanal zu betreiben

Verwenden Sie stattdessen [`openclaw acp`](/de/cli/acp), wenn OpenClaw die Coding-Laufzeit selbst hosten und die Agentensitzung innerhalb von OpenClaw behalten soll.

### Funktionsweise

`openclaw mcp serve` startet einen stdio-MCP-Server. Der MCP-Client besitzt diesen Prozess. Solange der Client die stdio-Sitzung offen hält, verbindet sich die Bridge über WebSocket mit einem lokalen oder entfernten OpenClaw Gateway und macht geroutete Kanalunterhaltungen über MCP verfügbar.

<Steps>
  <Step title="Client startet die Bridge">
    Der MCP-Client startet `openclaw mcp serve`.
  </Step>
  <Step title="Bridge verbindet sich mit Gateway">
    Die Bridge verbindet sich über WebSocket mit dem OpenClaw Gateway.
  </Step>
  <Step title="Sitzungen werden zu MCP-Unterhaltungen">
    Geroutete Sitzungen werden zu MCP-Unterhaltungen und Transkript-/Verlauf-Tools.
  </Step>
  <Step title="Warteschlange für Live-Ereignisse">
    Live-Ereignisse werden im Speicher in eine Warteschlange gestellt, solange die Bridge verbunden ist.
  </Step>
  <Step title="Optionaler Claude-Push">
    Wenn der Claude-Kanalmodus aktiviert ist, kann dieselbe Sitzung auch Claude-spezifische Push-Benachrichtigungen empfangen.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Wichtiges Verhalten">
    - der Status der Live-Warteschlange beginnt, wenn die Bridge eine Verbindung herstellt
    - älterer Transkriptverlauf wird mit `messages_read` gelesen
    - Claude-Push-Benachrichtigungen existieren nur, solange die MCP-Sitzung aktiv ist
    - wenn die Verbindung des Clients getrennt wird, beendet sich die Bridge und die Live-Warteschlange geht verloren
    - einmalige Agent-Einstiegspunkte wie `openclaw agent` und `openclaw infer model run` beenden alle gebündelten MCP-Laufzeiten, die sie öffnen, sobald die Antwort abgeschlossen ist, sodass wiederholte skriptgesteuerte Läufe keine stdio-MCP-Kindprozesse ansammeln
    - von OpenClaw gestartete stdio-MCP-Server (gebündelt oder benutzerkonfiguriert) werden beim Herunterfahren als Prozessbaum beendet, sodass vom Server gestartete Kind-Subprozesse nach dem Beenden des übergeordneten stdio-Clients nicht weiterlaufen
    - beim Löschen oder Zurücksetzen einer Sitzung werden die MCP-Clients dieser Sitzung über den gemeinsamen Laufzeit-Bereinigungspfad entsorgt, sodass keine verbleibenden stdio-Verbindungen an eine entfernte Sitzung gebunden bleiben
  </Accordion>
</AccordionGroup>

### Einen Client-Modus wählen

Verwenden Sie dieselbe Bridge auf zwei unterschiedliche Arten:

<Tabs>
  <Tab title="Generische MCP-Clients">
    Nur Standard-MCP-Tools. Verwenden Sie `conversations_list`, `messages_read`, `events_poll`, `events_wait`, `messages_send` und die Freigabe-Tools.
  </Tab>
  <Tab title="Claude Code">
    Standard-MCP-Tools plus den Claude-spezifischen Kanaladapter. Aktivieren Sie `--claude-channel-mode on` oder belassen Sie den Standardwert `auto`.
  </Tab>
</Tabs>

<Note>
Derzeit verhält sich `auto` genauso wie `on`. Es gibt noch keine Erkennung von Client-Fähigkeiten.
</Note>

### Was `serve` verfügbar macht

Die Bridge verwendet vorhandene Gateway-Sitzungsrouten-Metadaten, um kanalgestützte Unterhaltungen verfügbar zu machen. Eine Unterhaltung erscheint, wenn OpenClaw bereits einen Sitzungsstatus mit einer bekannten Route hat, z. B.:

- `channel`
- Empfänger- oder Zielmetadaten
- optional `accountId`
- optional `threadId`

Dadurch erhalten MCP-Clients eine zentrale Stelle, um:

- aktuelle geroutete Unterhaltungen aufzulisten
- aktuellen Transkriptverlauf zu lesen
- auf neue eingehende Ereignisse zu warten
- eine Antwort über dieselbe Route zurückzusenden
- Freigabeanfragen zu sehen, die eintreffen, solange die Bridge verbunden ist

### Verwendung

<Tabs>
  <Tab title="Lokales Gateway">
    ```bash
    openclaw mcp serve
    ```
  </Tab>
  <Tab title="Entferntes Gateway (Token)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
    ```
  </Tab>
  <Tab title="Entferntes Gateway (Passwort)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password
    ```
  </Tab>
  <Tab title="Verbose / Claude aus">
    ```bash
    openclaw mcp serve --verbose
    openclaw mcp serve --claude-channel-mode off
    ```
  </Tab>
</Tabs>

### Bridge-Tools

Die aktuelle Bridge stellt diese MCP-Tools bereit:

<AccordionGroup>
  <Accordion title="conversations_list">
    Listet aktuelle sitzungsbasierte Unterhaltungen auf, die bereits Routen-Metadaten im Gateway-Sitzungsstatus haben.

    Nützliche Filter:

    - `limit`
    - `search`
    - `channel`
    - `includeDerivedTitles`
    - `includeLastMessage`

  </Accordion>
  <Accordion title="conversation_get">
    Gibt eine Unterhaltung über `session_key` zurück.
  </Accordion>
  <Accordion title="messages_read">
    Liest aktuelle Transkript-Nachrichten für eine sitzungsbasierte Unterhaltung.
  </Accordion>
  <Accordion title="attachments_fetch">
    Extrahiert Nicht-Text-Inhaltsblöcke aus einer Transkript-Nachricht. Dies ist eine Metadatenansicht über den Transkriptinhalt, kein eigenständiger dauerhafter Attachment-Blob-Speicher.
  </Accordion>
  <Accordion title="events_poll">
    Liest Warteschlangen-Live-Ereignisse ab einem numerischen Cursor.
  </Accordion>
  <Accordion title="events_wait">
    Führt Long-Polling aus, bis das nächste passende Ereignis in der Warteschlange eintrifft oder ein Timeout abläuft.

    Verwenden Sie dies, wenn ein generischer MCP-Client nahezu Echtzeit-Zustellung ohne ein Claude-spezifisches Push-Protokoll benötigt.

  </Accordion>
  <Accordion title="messages_send">
    Sendet Text über dieselbe Route zurück, die bereits in der Sitzung gespeichert ist.

    Aktuelles Verhalten:

    - erfordert eine vorhandene Unterhaltungsroute
    - verwendet Kanal, Empfänger, Konto-ID und Thread-ID der Sitzung
    - sendet nur Text

  </Accordion>
  <Accordion title="permissions_list_open">
    Listet ausstehende Freigabeanfragen für Exec/Plugin auf, die die Bridge seit ihrer Verbindung mit dem Gateway beobachtet hat.
  </Accordion>
  <Accordion title="permissions_respond">
    Löst eine ausstehende Freigabeanfrage für Exec/Plugin auf mit:

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### Ereignismodell

Die Bridge hält eine In-Memory-Ereigniswarteschlange, solange sie verbunden ist.

Aktuelle Ereignistypen:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- die Warteschlange gilt nur für Live-Ereignisse; sie beginnt, wenn die MCP-Bridge startet
- `events_poll` und `events_wait` spielen älteren Gateway-Verlauf nicht selbstständig erneut ab
- dauerhafter Rückstand sollte mit `messages_read` gelesen werden
</Warning>

### Claude-Kanalbenachrichtigungen

Die Bridge kann auch Claude-spezifische Kanalbenachrichtigungen verfügbar machen. Das ist das OpenClaw-Äquivalent zu einem Claude-Code-Kanaladapter: Standard-MCP-Tools bleiben verfügbar, aber eingehende Live-Nachrichten können zusätzlich als Claude-spezifische MCP-Benachrichtigungen eintreffen.

<Tabs>
  <Tab title="off">
    `--claude-channel-mode off`: nur Standard-MCP-Tools.
  </Tab>
  <Tab title="on">
    `--claude-channel-mode on`: Claude-Kanalbenachrichtigungen aktivieren.
  </Tab>
  <Tab title="auto (Standard)">
    `--claude-channel-mode auto`: aktueller Standard; gleiches Bridge-Verhalten wie `on`.
  </Tab>
</Tabs>

Wenn der Claude-Kanalmodus aktiviert ist, kündigt der Server experimentelle Claude-Fähigkeiten an und kann Folgendes senden:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Aktuelles Bridge-Verhalten:

- eingehende `user`-Transkript-Nachrichten werden als `notifications/claude/channel` weitergeleitet
- über MCP empfangene Claude-Berechtigungsanfragen werden im Speicher nachverfolgt
- wenn die verknüpfte Unterhaltung später `yes abcde` oder `no abcde` sendet, wandelt die Bridge dies in `notifications/claude/channel/permission` um
- diese Benachrichtigungen gelten nur für die Live-Sitzung; wenn die Verbindung des MCP-Clients getrennt wird, gibt es kein Push-Ziel

Dies ist absichtlich clientspezifisch. Generische MCP-Clients sollten sich auf die Standard-Polling-Tools verlassen.

### MCP-Client-Konfiguration

Beispiel einer stdio-Client-Konfiguration:

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

Für die meisten generischen MCP-Clients sollten Sie mit der Standard-Tool-Oberfläche beginnen und den Claude-Modus ignorieren. Aktivieren Sie den Claude-Modus nur für Clients, die die Claude-spezifischen Benachrichtigungsmethoden tatsächlich verstehen.

### Optionen

`openclaw mcp serve` unterstützt:

<ParamField path="--url" type="string">
  Gateway-WebSocket-URL.
</ParamField>
<ParamField path="--token" type="string">
  Gateway-Token.
</ParamField>
<ParamField path="--token-file" type="string">
  Token aus Datei lesen.
</ParamField>
<ParamField path="--password" type="string">
  Gateway-Passwort.
</ParamField>
<ParamField path="--password-file" type="string">
  Passwort aus Datei lesen.
</ParamField>
<ParamField path="--claude-channel-mode" type='"auto" | "on" | "off"'>
  Claude-Benachrichtigungsmodus.
</ParamField>
<ParamField path="-v, --verbose" type="boolean">
  Ausführliche Logs auf stderr.
</ParamField>

<Tip>
Bevorzugen Sie nach Möglichkeit `--token-file` oder `--password-file` gegenüber eingebetteten Geheimnissen.
</Tip>

### Sicherheits- und Vertrauensgrenze

Die Bridge erfindet kein Routing. Sie macht nur Unterhaltungen verfügbar, die das Gateway bereits routen kann.

Das bedeutet:

- Sender-Allowlists, Pairing und Vertrauen auf Kanalebene gehören weiterhin zur zugrunde liegenden OpenClaw-Kanalkonfiguration
- `messages_send` kann nur über eine vorhandene gespeicherte Route antworten
- Freigabestatus gilt nur live/im Speicher für die aktuelle Bridge-Sitzung
- die Bridge-Authentifizierung sollte dieselben Gateway-Token- oder Passwortkontrollen verwenden, denen Sie auch für jeden anderen entfernten Gateway-Client vertrauen würden

Wenn eine Unterhaltung in `conversations_list` fehlt, liegt die übliche Ursache nicht in der MCP-Konfiguration. Es fehlen oder unvollständige Routen-Metadaten im zugrunde liegenden Gateway-Sitzungsstatus.

### Testen

OpenClaw liefert einen deterministischen Docker-Smoke-Test für diese Bridge mit:

```bash
pnpm test:docker:mcp-channels
```

Dieser Smoke-Test:

- startet einen geseedeten Gateway-Container
- startet einen zweiten Container, der `openclaw mcp serve` startet
- überprüft Unterhaltungserkennung, Lesen von Transkripten, Lesen von Attachment-Metadaten, Verhalten der Live-Ereigniswarteschlange und ausgehendes Send-Routing
- validiert Claude-artige Kanal- und Berechtigungsbenachrichtigungen über die reale stdio-MCP-Bridge

Dies ist der schnellste Weg, um nachzuweisen, dass die Bridge funktioniert, ohne ein echtes Telegram-, Discord- oder iMessage-Konto in den Testlauf einzubinden.

Für einen breiteren Testkontext siehe [Testing](/de/help/testing).

### Fehlerbehebung

<AccordionGroup>
  <Accordion title="Keine Unterhaltungen zurückgegeben">
    Bedeutet in der Regel, dass die Gateway-Sitzung noch nicht routbar ist. Bestätigen Sie, dass die zugrunde liegende Sitzung gespeicherte Routen-Metadaten für Kanal/Provider, Empfänger und optional Konto/Thread hat.
  </Accordion>
  <Accordion title="events_poll oder events_wait verpasst ältere Nachrichten">
    Erwartetes Verhalten. Die Live-Warteschlange beginnt, wenn die Bridge eine Verbindung herstellt. Lesen Sie älteren Transkriptverlauf mit `messages_read`.
  </Accordion>
  <Accordion title="Claude-Benachrichtigungen werden nicht angezeigt">
    Prüfen Sie all dies:

    - der Client hat die stdio-MCP-Sitzung offen gehalten
    - `--claude-channel-mode` ist `on` oder `auto`
    - der Client versteht tatsächlich die Claude-spezifischen Benachrichtigungsmethoden
    - die eingehende Nachricht ist nach dem Verbinden der Bridge eingetroffen

  </Accordion>
  <Accordion title="Freigaben fehlen">
    `permissions_list_open` zeigt nur Freigabeanfragen, die beobachtet wurden, während die Bridge verbunden war. Es handelt sich nicht um eine API für dauerhaften Freigabeverlauf.
  </Accordion>
</AccordionGroup>

## OpenClaw als MCP-Client-Registry

Dies ist der Pfad `openclaw mcp list`, `show`, `set` und `unset`.

Diese Befehle machen OpenClaw nicht über MCP verfügbar. Sie verwalten von OpenClaw verwaltete MCP-Serverdefinitionen unter `mcp.servers` in der OpenClaw-Konfiguration.

Diese gespeicherten Definitionen sind für Laufzeiten gedacht, die OpenClaw später startet oder konfiguriert, etwa eingebettetes Pi und andere Laufzeitadapter. OpenClaw speichert die Definitionen zentral, damit diese Laufzeiten keine eigenen doppelten MCP-Serverlisten pflegen müssen.

<AccordionGroup>
  <Accordion title="Wichtiges Verhalten">
    - diese Befehle lesen oder schreiben nur die OpenClaw-Konfiguration
    - sie verbinden sich nicht mit dem Ziel-MCP-Server
    - sie validieren nicht, ob der Befehl, die URL oder der entfernte Transport aktuell erreichbar ist
    - Laufzeitadapter entscheiden zur Ausführungszeit, welche Transportformen sie tatsächlich unterstützen
    - eingebettetes Pi stellt konfigurierte MCP-Tools in normalen Tool-Profilen für `coding` und `messaging` bereit; `minimal` blendet sie weiterhin aus, und `tools.deny: ["bundle-mcp"]` deaktiviert sie ausdrücklich
    - gebündelte MCP-Laufzeiten mit Sitzungsbereich werden nach `mcp.sessionIdleTtlMs` Millisekunden Leerlauf beendet (standardmäßig 10 Minuten; setzen Sie `0`, um dies zu deaktivieren), und einmalige eingebettete Läufe bereinigen sie am Ende des Laufs
  </Accordion>
</AccordionGroup>

Laufzeitadapter können diese gemeinsame Registry in die Form normalisieren, die ihr nachgelagerter Client erwartet. Eingebettetes Pi verwendet zum Beispiel die OpenClaw-`transport`-Werte direkt, während Claude Code und Gemini CLI-native `type`-Werte wie `http`, `sse` oder `stdio` erhalten.

### Gespeicherte MCP-Serverdefinitionen

OpenClaw speichert außerdem eine leichtgewichtige MCP-Server-Registry in der Konfiguration für Oberflächen, die von OpenClaw verwaltete MCP-Definitionen verwenden möchten.

Befehle:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

Hinweise:

- `list` sortiert die Servernamen.
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

Startet einen lokalen Kindprozess und kommuniziert über stdin/stdout.

| Feld                       | Beschreibung                      |
| -------------------------- | --------------------------------- |
| `command`                  | Zu startende ausführbare Datei (erforderlich) |
| `args`                     | Array von Befehlszeilenargumenten |
| `env`                      | Zusätzliche Umgebungsvariablen    |
| `cwd` / `workingDirectory` | Arbeitsverzeichnis für den Prozess |

<Warning>
**Stdio-Env-Sicherheitsfilter**

OpenClaw weist Env-Schlüssel für den Interpreterstart zurück, die verändern können, wie ein stdio-MCP-Server vor dem ersten RPC startet, selbst wenn sie im `env`-Block eines Servers erscheinen. Blockierte Schlüssel umfassen `NODE_OPTIONS`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4` und ähnliche Variablen zur Laufzeitsteuerung. Der Start weist diese mit einem Konfigurationsfehler zurück, sodass sie kein implizites Prelude einschleusen, den Interpreter austauschen oder einen Debugger für den stdio-Prozess aktivieren können. Normale Zugangs-, Proxy- und serverspezifische Env-Variablen (`GITHUB_TOKEN`, `HTTP_PROXY`, benutzerdefinierte `*_API_KEY` usw.) sind nicht betroffen.

Wenn Ihr MCP-Server wirklich eine der blockierten Variablen benötigt, setzen Sie sie auf dem Gateway-Hostprozess statt unter `env` des stdio-Servers.
</Warning>

### SSE- / HTTP-Transport

Verbindet sich über HTTP Server-Sent Events mit einem entfernten MCP-Server.

| Feld                  | Beschreibung                                                     |
| --------------------- | ---------------------------------------------------------------- |
| `url`                 | HTTP- oder HTTPS-URL des entfernten Servers (erforderlich)       |
| `headers`             | Optionale Key-Value-Map von HTTP-Headern (zum Beispiel Auth-Tokens) |
| `connectionTimeoutMs` | Serverspezifisches Verbindungs-Timeout in ms (optional)          |

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

Vertrauliche Werte in `url` (userinfo) und `headers` werden in Logs und Statusausgaben geschwärzt.

### Streamable-HTTP-Transport

`streamable-http` ist eine zusätzliche Transportoption neben `sse` und `stdio`. Sie verwendet HTTP-Streaming für bidirektionale Kommunikation mit entfernten MCP-Servern.

| Feld                  | Beschreibung                                                                            |
| --------------------- | --------------------------------------------------------------------------------------- |
| `url`                 | HTTP- oder HTTPS-URL des entfernten Servers (erforderlich)                              |
| `transport`           | Auf `"streamable-http"` setzen, um diesen Transport auszuwählen; wenn weggelassen, verwendet OpenClaw `sse` |
| `headers`             | Optionale Key-Value-Map von HTTP-Headern (zum Beispiel Auth-Tokens)                     |
| `connectionTimeoutMs` | Serverspezifisches Verbindungs-Timeout in ms (optional)                                 |

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

<Note>
Diese Befehle verwalten nur die gespeicherte Konfiguration. Sie starten nicht die Kanal-Bridge, öffnen keine Live-MCP-Client-Sitzung und beweisen nicht, dass der Zielserver erreichbar ist.
</Note>

## Aktuelle Einschränkungen

Diese Seite dokumentiert die Bridge, wie sie heute ausgeliefert wird.

Aktuelle Einschränkungen:

- die Erkennung von Unterhaltungen hängt von vorhandenen Gateway-Sitzungsrouten-Metadaten ab
- es gibt noch kein generisches Push-Protokoll jenseits des Claude-spezifischen Adapters
- es gibt noch keine Tools zum Bearbeiten oder Reagieren auf Nachrichten
- der Transport HTTP/SSE/streamable-http verbindet sich mit einem einzelnen entfernten Server; es gibt noch kein multiplexiertes Upstream
- `permissions_list_open` enthält nur Freigaben, die beobachtet wurden, während die Bridge verbunden ist

## Verwandt

- [CLI reference](/de/cli)
- [Plugins](/de/cli/plugins)
