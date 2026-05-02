---
read_when:
    - Codex, Claude Code oder einen anderen MCP-Client mit von OpenClaw unterstützten Kanälen verbinden
    - Ausführen von `openclaw mcp serve`
    - Verwalten von in OpenClaw gespeicherten MCP-Serverdefinitionen
sidebarTitle: MCP
summary: OpenClaw-Kanalunterhaltungen über MCP bereitstellen und gespeicherte MCP-Serverdefinitionen verwalten
title: MCP
x-i18n:
    generated_at: "2026-05-02T20:44:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: d1d3b5d7c3a9075c020a35bc9617d6e6902c96b40cc03e76119d01d0d94fd014
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` hat zwei Aufgaben:

- OpenClaw mit `openclaw mcp serve` als MCP-Server ausführen
- von OpenClaw verwaltete Definitionen ausgehender MCP-Server mit `list`, `show`, `set` und `unset` verwalten

Mit anderen Worten:

- `serve` bedeutet, dass OpenClaw als MCP-Server agiert
- `list` / `show` / `set` / `unset` bedeutet, dass OpenClaw als clientseitige MCP-Registry für andere MCP-Server agiert, die seine Runtimes später nutzen können

Verwenden Sie [`openclaw acp`](/de/cli/acp), wenn OpenClaw selbst eine Coding-Harness-Sitzung hosten und diese Runtime über ACP routen soll.

## OpenClaw als MCP-Server

Dies ist der Pfad `openclaw mcp serve`.

### Wann Sie `serve` verwenden sollten

Verwenden Sie `openclaw mcp serve`, wenn:

- Codex, Claude Code oder ein anderer MCP-Client direkt mit kanalbezogenen, von OpenClaw gestützten Konversationen sprechen soll
- Sie bereits ein lokales oder entferntes OpenClaw Gateway mit gerouteten Sitzungen haben
- Sie einen MCP-Server möchten, der über die Kanal-Backends von OpenClaw hinweg funktioniert, statt separate Bridges pro Kanal auszuführen

Verwenden Sie stattdessen [`openclaw acp`](/de/cli/acp), wenn OpenClaw die Coding-Runtime selbst hosten und die Agent-Sitzung innerhalb von OpenClaw halten soll.

### Funktionsweise

`openclaw mcp serve` startet einen stdio-MCP-Server. Der MCP-Client besitzt diesen Prozess. Solange der Client die stdio-Sitzung offen hält, verbindet sich die Bridge per WebSocket mit einem lokalen oder entfernten OpenClaw Gateway und stellt geroutete Kanalkonversationen über MCP bereit.

<Steps>
  <Step title="Client startet die Bridge">
    Der MCP-Client startet `openclaw mcp serve`.
  </Step>
  <Step title="Bridge verbindet sich mit dem Gateway">
    Die Bridge verbindet sich per WebSocket mit dem OpenClaw Gateway.
  </Step>
  <Step title="Sitzungen werden zu MCP-Konversationen">
    Geroutete Sitzungen werden zu MCP-Konversationen und Transkript-/Verlaufstools.
  </Step>
  <Step title="Live-Ereignisse werden eingereiht">
    Live-Ereignisse werden im Arbeitsspeicher eingereiht, während die Bridge verbunden ist.
  </Step>
  <Step title="Optionaler Claude-Push">
    Wenn der Claude-Kanalmodus aktiviert ist, kann dieselbe Sitzung auch Claude-spezifische Push-Benachrichtigungen empfangen.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Wichtiges Verhalten">
    - der Live-Warteschlangenzustand beginnt, wenn die Bridge eine Verbindung herstellt
    - ältere Transkriptverläufe werden mit `messages_read` gelesen
    - Claude-Push-Benachrichtigungen existieren nur, solange die MCP-Sitzung aktiv ist
    - wenn der Client die Verbindung trennt, beendet sich die Bridge und die Live-Warteschlange ist weg
    - einmalige Agent-Einstiegspunkte wie `openclaw agent` und `openclaw infer model run` beenden alle gebündelten MCP-Runtimes, die sie öffnen, sobald die Antwort abgeschlossen ist, sodass wiederholte Skriptläufe keine stdio-MCP-Kindprozesse ansammeln
    - von OpenClaw gestartete stdio-MCP-Server (gebündelt oder benutzerkonfiguriert) werden beim Herunterfahren als Prozessbaum beendet, sodass vom Server gestartete Kind-Subprozesse nach dem Beenden des übergeordneten stdio-Clients nicht weiterlaufen
    - das Löschen oder Zurücksetzen einer Sitzung entsorgt die MCP-Clients dieser Sitzung über den gemeinsamen Runtime-Bereinigungspfad, sodass keine verbleibenden stdio-Verbindungen an eine entfernte Sitzung gebunden bleiben

  </Accordion>
</AccordionGroup>

### Clientmodus auswählen

Verwenden Sie dieselbe Bridge auf zwei verschiedene Arten:

<Tabs>
  <Tab title="Generische MCP-Clients">
    Nur Standard-MCP-Tools. Verwenden Sie `conversations_list`, `messages_read`, `events_poll`, `events_wait`, `messages_send` und die Genehmigungstools.
  </Tab>
  <Tab title="Claude Code">
    Standard-MCP-Tools plus den Claude-spezifischen Kanaladapter. Aktivieren Sie `--claude-channel-mode on` oder lassen Sie die Standardeinstellung `auto`.
  </Tab>
</Tabs>

<Note>
Derzeit verhält sich `auto` genauso wie `on`. Es gibt noch keine Erkennung von Client-Fähigkeiten.
</Note>

### Was `serve` bereitstellt

Die Bridge verwendet vorhandene Routemetadaten der Gateway-Sitzung, um kanalgestützte Konversationen bereitzustellen. Eine Konversation erscheint, wenn OpenClaw bereits Sitzungszustand mit einer bekannten Route hat, zum Beispiel:

- `channel`
- Empfänger- oder Zielmetadaten
- optionales `accountId`
- optionales `threadId`

Damit erhalten MCP-Clients eine zentrale Stelle, um:

- kürzlich geroutete Konversationen aufzulisten
- aktuelle Transkriptverläufe zu lesen
- auf neue eingehende Ereignisse zu warten
- eine Antwort über dieselbe Route zurückzusenden
- Genehmigungsanfragen zu sehen, die eintreffen, während die Bridge verbunden ist

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
  <Tab title="Ausführlich / Claude aus">
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
    Listet aktuelle sitzungsgestützte Konversationen auf, die bereits Routemetadaten im Gateway-Sitzungszustand haben.

    Nützliche Filter:

    - `limit`
    - `search`
    - `channel`
    - `includeDerivedTitles`
    - `includeLastMessage`

  </Accordion>
  <Accordion title="conversation_get">
    Gibt eine Konversation nach `session_key` über eine direkte Gateway-Sitzungssuche zurück.
  </Accordion>
  <Accordion title="messages_read">
    Liest aktuelle Transkriptnachrichten für eine sitzungsgestützte Konversation.
  </Accordion>
  <Accordion title="attachments_fetch">
    Extrahiert nicht textbasierte Inhaltsblöcke aus einer Transkriptnachricht. Dies ist eine Metadatenansicht über Transkriptinhalte, kein eigenständiger dauerhafter Attachment-Blob-Speicher.
  </Accordion>
  <Accordion title="events_poll">
    Liest eingereihte Live-Ereignisse seit einem numerischen Cursor.
  </Accordion>
  <Accordion title="events_wait">
    Führt Long-Polling aus, bis das nächste passende eingereihte Ereignis eintrifft oder ein Timeout abläuft.

    Verwenden Sie dies, wenn ein generischer MCP-Client nahezu Echtzeit-Zustellung ohne Claude-spezifisches Push-Protokoll benötigt.

  </Accordion>
  <Accordion title="messages_send">
    Sendet Text über dieselbe Route zurück, die bereits in der Sitzung aufgezeichnet ist.

    Aktuelles Verhalten:

    - erfordert eine vorhandene Konversationsroute
    - verwendet Kanal, Empfänger, Konto-ID und Thread-ID der Sitzung
    - sendet nur Text

  </Accordion>
  <Accordion title="permissions_list_open">
    Listet ausstehende Exec-/Plugin-Genehmigungsanfragen auf, die die Bridge seit der Verbindung mit dem Gateway beobachtet hat.
  </Accordion>
  <Accordion title="permissions_respond">
    Löst eine ausstehende Exec-/Plugin-Genehmigungsanfrage mit Folgendem auf:

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### Ereignismodell

Die Bridge hält eine In-Memory-Ereigniswarteschlange, während sie verbunden ist.

Aktuelle Ereignistypen:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- die Warteschlange ist nur live; sie startet, wenn die MCP-Bridge startet
- `events_poll` und `events_wait` spielen ältere Gateway-Verläufe nicht selbst erneut ab
- dauerhafte Rückstände sollten mit `messages_read` gelesen werden

</Warning>

### Claude-Kanalbenachrichtigungen

Die Bridge kann auch Claude-spezifische Kanalbenachrichtigungen bereitstellen. Dies ist das OpenClaw-Äquivalent eines Claude-Code-Kanaladapters: Standard-MCP-Tools bleiben verfügbar, aber live eingehende Nachrichten können auch als Claude-spezifische MCP-Benachrichtigungen eintreffen.

<Tabs>
  <Tab title="aus">
    `--claude-channel-mode off`: nur Standard-MCP-Tools.
  </Tab>
  <Tab title="ein">
    `--claude-channel-mode on`: Claude-Kanalbenachrichtigungen aktivieren.
  </Tab>
  <Tab title="auto (Standard)">
    `--claude-channel-mode auto`: aktueller Standard; dasselbe Bridge-Verhalten wie `on`.
  </Tab>
</Tabs>

Wenn der Claude-Kanalmodus aktiviert ist, kündigt der Server experimentelle Claude-Fähigkeiten an und kann Folgendes ausgeben:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Aktuelles Bridge-Verhalten:

- eingehende `user`-Transkriptnachrichten werden als `notifications/claude/channel` weitergeleitet
- über MCP empfangene Claude-Berechtigungsanfragen werden im Arbeitsspeicher nachverfolgt
- wenn die verknüpfte Konversation später `yes abcde` oder `no abcde` sendet, wandelt die Bridge dies in `notifications/claude/channel/permission` um
- diese Benachrichtigungen gelten nur für die Live-Sitzung; wenn der MCP-Client die Verbindung trennt, gibt es kein Push-Ziel

Dies ist absichtlich client-spezifisch. Generische MCP-Clients sollten sich auf die Standard-Polling-Tools verlassen.

### MCP-Clientkonfiguration

Beispiel für eine stdio-Clientkonfiguration:

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

Für die meisten generischen MCP-Clients beginnen Sie mit der Standard-Tool-Oberfläche und ignorieren den Claude-Modus. Aktivieren Sie den Claude-Modus nur für Clients, die die Claude-spezifischen Benachrichtigungsmethoden tatsächlich verstehen.

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
  Ausführliche Protokolle auf stderr.
</ParamField>

<Tip>
Bevorzugen Sie nach Möglichkeit `--token-file` oder `--password-file` gegenüber Inline-Secrets.
</Tip>

### Sicherheits- und Vertrauensgrenze

Die Bridge erfindet kein Routing. Sie stellt nur Konversationen bereit, die das Gateway bereits routen kann.

Das bedeutet:

- Absender-Allowlists, Pairing und Vertrauen auf Kanalebene gehören weiterhin zur zugrunde liegenden OpenClaw-Kanalkonfiguration
- `messages_send` kann nur über eine vorhandene gespeicherte Route antworten
- der Genehmigungszustand ist nur live/im Arbeitsspeicher für die aktuelle Bridge-Sitzung
- die Bridge-Authentifizierung sollte dieselben Gateway-Token- oder Passwortkontrollen verwenden, denen Sie bei jedem anderen entfernten Gateway-Client vertrauen würden

Wenn eine Konversation in `conversations_list` fehlt, liegt die übliche Ursache nicht in der MCP-Konfiguration. Es fehlen Routemetadaten in der zugrunde liegenden Gateway-Sitzung oder diese sind unvollständig.

### Tests

OpenClaw liefert einen deterministischen Docker-Smoke-Test für diese Bridge aus:

```bash
pnpm test:docker:mcp-channels
```

Dieser Smoke-Test:

- startet einen mit Startdaten versehenen Gateway-Container
- startet einen zweiten Container, der `openclaw mcp serve` startet
- verifiziert Konversationserkennung, Transkriptlesevorgänge, Attachment-Metadaten-Lesevorgänge, Verhalten der Live-Ereigniswarteschlange und ausgehendes Senderouting
- validiert Claude-artige Kanal- und Berechtigungsbenachrichtigungen über die echte stdio-MCP-Bridge

Dies ist der schnellste Weg, nachzuweisen, dass die Bridge funktioniert, ohne ein echtes Telegram-, Discord- oder iMessage-Konto in den Testlauf einzubinden.

Weiteren Testkontext finden Sie unter [Testen](/de/help/testing).

### Fehlerbehebung

<AccordionGroup>
  <Accordion title="Keine Konversationen zurückgegeben">
    Bedeutet normalerweise, dass die Gateway-Sitzung noch nicht routbar ist. Bestätigen Sie, dass die zugrunde liegende Sitzung gespeicherte Kanal-/Provider-, Empfänger- und optionale Konto-/Thread-Routemetadaten hat.
  </Accordion>
  <Accordion title="events_poll oder events_wait verpasst ältere Nachrichten">
    Erwartet. Die Live-Warteschlange startet, wenn die Bridge eine Verbindung herstellt. Lesen Sie ältere Transkriptverläufe mit `messages_read`.
  </Accordion>
  <Accordion title="Claude-Benachrichtigungen werden nicht angezeigt">
    Prüfen Sie alle folgenden Punkte:

    - der Client hat die stdio-MCP-Sitzung offen gehalten
    - `--claude-channel-mode` ist `on` oder `auto`
    - der Client versteht die Claude-spezifischen Benachrichtigungsmethoden tatsächlich
    - die eingehende Nachricht ist nach dem Verbindungsaufbau der Bridge eingetroffen

  </Accordion>
  <Accordion title="Genehmigungen fehlen">
    `permissions_list_open` zeigt nur Genehmigungsanfragen an, die beobachtet wurden, während die Bridge verbunden war. Es ist keine API für dauerhafte Genehmigungsverläufe.
  </Accordion>
</AccordionGroup>

## OpenClaw als MCP-Clientregistry

Dies ist der Pfad für `openclaw mcp list`, `show`, `set` und `unset`.

Diese Befehle stellen OpenClaw nicht über MCP bereit. Sie verwalten OpenClaw-eigene MCP-Serverdefinitionen unter `mcp.servers` in der OpenClaw-Konfiguration.

Diese gespeicherten Definitionen sind für Laufzeiten gedacht, die OpenClaw später startet oder konfiguriert, wie eingebettetes Pi und andere Laufzeitadapter. OpenClaw speichert die Definitionen zentral, damit diese Laufzeiten keine eigenen doppelten MCP-Serverlisten pflegen müssen.

<AccordionGroup>
  <Accordion title="Wichtiges Verhalten">
    - diese Befehle lesen oder schreiben nur die OpenClaw-Konfiguration
    - sie verbinden sich nicht mit dem Ziel-MCP-Server
    - sie validieren nicht, ob der Befehl, die URL oder der Remote-Transport aktuell erreichbar ist
    - Laufzeitadapter entscheiden zur Ausführungszeit, welche Transportformen sie tatsächlich unterstützen
    - eingebettetes Pi stellt konfigurierte MCP-Tools in den normalen Tool-Profilen `coding` und `messaging` bereit; `minimal` blendet sie weiterhin aus, und `tools.deny: ["bundle-mcp"]` deaktiviert sie explizit
    - sitzungsbezogene gebündelte MCP-Laufzeiten werden nach `mcp.sessionIdleTtlMs` Millisekunden Leerlaufzeit beendet (Standardwert 10 Minuten; setzen Sie `0`, um dies zu deaktivieren), und einmalige eingebettete Ausführungen räumen sie am Ende der Ausführung auf

  </Accordion>
</AccordionGroup>

Laufzeitadapter können diese gemeinsame Registry in die Form normalisieren, die ihr nachgelagerter Client erwartet. Zum Beispiel nutzt eingebettetes Pi die OpenClaw-`transport`-Werte direkt, während Claude Code und Gemini CLI-native `type`-Werte wie `http`, `sse` oder `stdio` erhalten.

### Gespeicherte MCP-Serverdefinitionen

OpenClaw speichert außerdem eine schlanke MCP-Server-Registry in der Konfiguration für Oberflächen, die von OpenClaw verwaltete MCP-Definitionen verwenden möchten.

Befehle:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

Hinweise:

- `list` sortiert Servernamen.
- `show` ohne Namen gibt das vollständig konfigurierte MCP-Serverobjekt aus.
- `set` erwartet einen JSON-Objektwert auf der Befehlszeile.
- Verwenden Sie `transport: "streamable-http"` für Streamable-HTTP-MCP-Server. `openclaw mcp set` normalisiert außerdem CLI-native `type: "http"`-Werte aus Kompatibilitätsgründen in dieselbe kanonische Konfigurationsform.
- `unset` schlägt fehl, wenn der benannte Server nicht existiert.

Beispiele:

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp set docs '{"url":"https://mcp.example.com","transport":"streamable-http"}'
openclaw mcp unset context7
```

Beispielhafte Konfigurationsform:

```json
{
  "mcp": {
    "servers": {
      "context7": {
        "command": "uvx",
        "args": ["context7-mcp"]
      },
      "docs": {
        "url": "https://mcp.example.com",
        "transport": "streamable-http"
      }
    }
  }
}
```

### Stdio-Transport

Startet einen lokalen Kindprozess und kommuniziert über stdin/stdout.

| Feld                       | Beschreibung                                   |
| -------------------------- | ---------------------------------------------- |
| `command`                  | Zu startende ausführbare Datei (erforderlich)  |
| `args`                     | Array von Befehlszeilenargumenten              |
| `env`                      | Zusätzliche Umgebungsvariablen                 |
| `cwd` / `workingDirectory` | Arbeitsverzeichnis für den Prozess             |

<Warning>
**Stdio-Sicherheitsfilter für env**

OpenClaw lehnt env-Schlüssel für den Interpreter-Start ab, die beeinflussen können, wie ein stdio-MCP-Server vor dem ersten RPC startet, selbst wenn sie im `env`-Block eines Servers erscheinen. Blockierte Schlüssel umfassen `NODE_OPTIONS`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4` und ähnliche Variablen zur Laufzeitsteuerung. Der Start lehnt diese mit einem Konfigurationsfehler ab, damit sie kein implizites Prelude injizieren, den Interpreter austauschen oder einen Debugger gegen den stdio-Prozess aktivieren können. Normale Zugangsdaten-, Proxy- und serverspezifische env-Variablen (`GITHUB_TOKEN`, `HTTP_PROXY`, benutzerdefinierte `*_API_KEY` usw.) sind nicht betroffen.

Wenn Ihr MCP-Server wirklich eine der blockierten Variablen benötigt, setzen Sie sie auf dem Gateway-Hostprozess statt im `env` des stdio-Servers.
</Warning>

### SSE-/HTTP-Transport

Verbindet sich über HTTP Server-Sent Events mit einem Remote-MCP-Server.

| Feld                  | Beschreibung                                                        |
| --------------------- | ------------------------------------------------------------------- |
| `url`                 | HTTP- oder HTTPS-URL des Remote-Servers (erforderlich)              |
| `headers`             | Optionale Schlüssel-Wert-Zuordnung von HTTP-Headern (z. B. Auth-Token) |
| `connectionTimeoutMs` | Verbindungs-Timeout pro Server in ms (optional)                     |

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

Vertrauliche Werte in `url` (userinfo) und `headers` werden in Logs und Statusausgaben redigiert.

### Streamable-HTTP-Transport

`streamable-http` ist eine zusätzliche Transportoption neben `sse` und `stdio`. Sie verwendet HTTP-Streaming für bidirektionale Kommunikation mit Remote-MCP-Servern.

| Feld                  | Beschreibung                                                                                               |
| --------------------- | ---------------------------------------------------------------------------------------------------------- |
| `url`                 | HTTP- oder HTTPS-URL des Remote-Servers (erforderlich)                                                     |
| `transport`           | Auf `"streamable-http"` setzen, um diesen Transport auszuwählen; wenn weggelassen, verwendet OpenClaw `sse` |
| `headers`             | Optionale Schlüssel-Wert-Zuordnung von HTTP-Headern (z. B. Auth-Token)                                      |
| `connectionTimeoutMs` | Verbindungs-Timeout pro Server in ms (optional)                                                            |

Die OpenClaw-Konfiguration verwendet `transport: "streamable-http"` als kanonische Schreibweise. CLI-native MCP-`type: "http"`-Werte werden akzeptiert, wenn sie über `openclaw mcp set` gespeichert werden, und in bestehenden Konfigurationen durch `openclaw doctor --fix` repariert, aber `transport` ist das, was eingebettetes Pi direkt nutzt.

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
Diese Befehle verwalten nur gespeicherte Konfiguration. Sie starten nicht die Kanal-Bridge, öffnen keine Live-MCP-Client-Sitzung und weisen nicht nach, dass der Zielserver erreichbar ist.
</Note>

## Aktuelle Grenzen

Diese Seite dokumentiert die Bridge so, wie sie heute ausgeliefert wird.

Aktuelle Grenzen:

- Konversationserkennung hängt von vorhandenen Gateway-Sitzungsroutenmetadaten ab
- kein generisches Push-Protokoll über den Claude-spezifischen Adapter hinaus
- noch keine Tools zum Bearbeiten von Nachrichten oder zum Reagieren
- HTTP-/SSE-/streamable-http-Transport verbindet sich mit einem einzelnen Remote-Server; noch kein multiplexter Upstream
- `permissions_list_open` enthält nur Genehmigungen, die beobachtet wurden, während die Bridge verbunden ist

## Verwandt

- [CLI-Referenz](/de/cli)
- [Plugins](/de/cli/plugins)
