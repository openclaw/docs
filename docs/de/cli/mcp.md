---
read_when:
    - Codex, Claude Code oder einen anderen MCP-Client mit OpenClaw-gestützten Kanälen verbinden
    - '`openclaw mcp serve` wird ausgeführt'
    - Von OpenClaw gespeicherte MCP-Serverdefinitionen verwalten
sidebarTitle: MCP
summary: OpenClaw-Kanalunterhaltungen über MCP bereitstellen und gespeicherte MCP-Serverdefinitionen verwalten
title: MCP
x-i18n:
    generated_at: "2026-07-12T15:09:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 5753ffb716794edcdfa2c3cdd370bd33173b6d30785f135e84933dcd628bbe54
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` hat zwei Aufgaben:

- OpenClaw mit `openclaw mcp serve` als MCP-Server ausführen
- Von OpenClaw verwaltete Definitionen ausgehender MCP-Server mit `list`, `show`, `status`, `doctor`, `probe`, `add`, `set`, `configure`, `tools`, `login`, `logout`, `reload` und `unset` verwalten

Bei `serve` fungiert OpenClaw als MCP-Server. Bei den anderen Unterbefehlen fungiert OpenClaw als clientseitige MCP-Registrierung für Server, die seine eigenen Runtimes später verwenden können.

<Note>
  `list`, `show`, `set` und `unset` lesen und schreiben nur von OpenClaw verwaltete `mcp.servers`-Einträge in der OpenClaw-Konfiguration. Sie enthalten keine mcporter-Server aus `config/mcporter.json`; verwenden Sie für diese Registrierung `mcporter list`.
</Note>

Verwenden Sie [`openclaw acp`](/de/cli/acp), wenn OpenClaw selbst eine Coding-Harness-Sitzung hosten und diese Runtime über ACP leiten soll.

## Den richtigen MCP-Pfad wählen

| Ziel                                                                | Verwenden                                                             | Grund                                                                                                                              |
| ------------------------------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Einem externen MCP-Client das Lesen/Senden von OpenClaw-Kanalunterhaltungen ermöglichen | `openclaw mcp serve`                                      | OpenClaw ist der MCP-Server und stellt Gateway-gestützte Unterhaltungen über stdio bereit.                                         |
| MCP-Server von Drittanbietern für von OpenClaw verwaltete Agent-Ausführungen speichern | `openclaw mcp add`, `set`, `configure`, `tools`, `login` | OpenClaw ist die clientseitige MCP-Registrierung und projiziert diese Server später in geeignete Runtimes.                         |
| Einen gespeicherten Server prüfen, ohne einen Agent-Durchlauf auszuführen | `openclaw mcp status`, `doctor`, `probe`                         | `status` und `doctor` prüfen die Konfiguration; `probe` öffnet eine aktive MCP-Verbindung und listet Funktionen auf.                |
| MCP-Konfiguration in einem Browser bearbeiten                      | Control UI `/settings/mcp` (`/mcp`-Alias)                            | Die Seite zeigt Bestand, Aktivierungsstatus, OAuth-/Filterzusammenfassungen, Befehlshinweise und einen auf `mcp` begrenzten Editor. |
| Codex app-server einen abgegrenzten nativen MCP-Server bereitstellen | `mcp.servers.<name>.codex`                                           | Der `codex`-Block betrifft nur die Thread-Projektion von Codex app-server und wird vor der Übergabe der nativen Konfiguration entfernt. |
| ACP-gehostete Harness-Sitzungen ausführen                           | [`openclaw acp`](/de/cli/acp) und [ACP-Agents](/de/tools/acp-agents-setup) | Der ACP-Bridge-Modus akzeptiert keine sitzungsspezifische MCP-Server-Injektion; konfigurieren Sie stattdessen Gateway-/Plugin-Bridges. |

<Tip>
Wenn Sie nicht sicher sind, welchen Pfad Sie benötigen, beginnen Sie mit `openclaw mcp status --verbose`. Der Befehl zeigt, was OpenClaw gespeichert hat, ohne MCP-Server zu starten.
</Tip>

## OpenClaw als MCP-Server

Dies ist der Pfad `openclaw mcp serve`.

### Wann serve verwendet werden sollte

Verwenden Sie `openclaw mcp serve`, wenn:

- Codex, Claude Code oder ein anderer MCP-Client direkt mit OpenClaw-gestützten Kanalunterhaltungen kommunizieren soll
- Sie bereits über ein lokales oder entferntes OpenClaw-Gateway mit weitergeleiteten Sitzungen verfügen
- Sie einen MCP-Server wünschen, der mit allen Kanal-Backends von OpenClaw funktioniert, statt separate Bridges für jeden Kanal auszuführen

Verwenden Sie stattdessen [`openclaw acp`](/de/cli/acp), wenn OpenClaw die Coding-Runtime selbst hosten und die Agent-Sitzung innerhalb von OpenClaw halten soll.

### Funktionsweise

`openclaw mcp serve` startet einen stdio-MCP-Server. Der MCP-Client ist für diesen Prozess verantwortlich. Solange der Client die stdio-Sitzung geöffnet hält, stellt die Bridge über WebSocket eine Verbindung zu einem lokalen oder entfernten OpenClaw-Gateway her und stellt weitergeleitete Kanalunterhaltungen über MCP bereit.

<Steps>
  <Step title="Client startet die Bridge">
    Der MCP-Client startet `openclaw mcp serve`.
  </Step>
  <Step title="Bridge verbindet sich mit dem Gateway">
    Die Bridge stellt über WebSocket eine Verbindung zum OpenClaw-Gateway her.
  </Step>
  <Step title="Sitzungen werden zu MCP-Unterhaltungen">
    Weitergeleitete Sitzungen werden zu MCP-Unterhaltungen und Transkript-/Verlaufswerkzeugen.
  </Step>
  <Step title="Live-Ereignisse werden eingereiht">
    Live-Ereignisse werden im Speicher in eine Warteschlange gestellt, solange die Bridge verbunden ist.
  </Step>
  <Step title="Optionaler Claude-Push">
    Wenn der Claude-Kanalmodus aktiviert ist, kann dieselbe Sitzung auch Claude-spezifische Push-Benachrichtigungen empfangen.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Wichtiges Verhalten">
    - Der Status der Live-Warteschlange beginnt, wenn die Bridge die Verbindung herstellt
    - Älterer Transkriptverlauf wird mit `messages_read` gelesen
    - Claude-Push-Benachrichtigungen bestehen nur, solange die MCP-Sitzung aktiv ist
    - Wenn der Client die Verbindung trennt, wird die Bridge beendet und die Live-Warteschlange geht verloren
    - Einmalige Agent-Einstiegspunkte wie `openclaw agent` und `openclaw infer model run` beenden alle gebündelten MCP-Runtimes, die sie öffnen, sobald die Antwort abgeschlossen ist, sodass sich bei wiederholten skriptgesteuerten Ausführungen keine untergeordneten stdio-MCP-Prozesse ansammeln
    - Von OpenClaw gestartete stdio-MCP-Server (gebündelt oder benutzerkonfiguriert) werden beim Herunterfahren als Prozessbaum beendet, sodass vom Server gestartete Unterprozesse nach dem Beenden des übergeordneten stdio-Clients nicht weiterlaufen
    - Beim Löschen oder Zurücksetzen einer Sitzung werden die MCP-Clients dieser Sitzung über den gemeinsamen Runtime-Bereinigungspfad freigegeben, sodass keine verbleibenden stdio-Verbindungen an eine entfernte Sitzung gebunden bleiben

  </Accordion>
</AccordionGroup>

### Einen Client-Modus wählen

<Tabs>
  <Tab title="Generische MCP-Clients">
    Nur Standard-MCP-Werkzeuge. Verwenden Sie `conversations_list`, `messages_read`, `events_poll`, `events_wait`, `messages_send` und die Genehmigungswerkzeuge.
  </Tab>
  <Tab title="Claude Code">
    Standard-MCP-Werkzeuge sowie der Claude-spezifische Kanaladapter. Aktivieren Sie `--claude-channel-mode on` oder behalten Sie die Standardeinstellung `auto` bei.
  </Tab>
</Tabs>

<Note>
Derzeit verhält sich `auto` genauso wie `on`. Eine Erkennung der Client-Funktionen gibt es noch nicht.
</Note>

### Was serve bereitstellt

Die Bridge verwendet vorhandene Routenmetadaten von Gateway-Sitzungen, um kanalgestützte Unterhaltungen bereitzustellen. Eine Unterhaltung erscheint, wenn OpenClaw bereits einen Sitzungsstatus mit einer bekannten Route besitzt, beispielsweise:

- `channel`
- Empfänger- oder Zielmetadaten
- optional `accountId`
- optional `threadId`

Dadurch erhalten MCP-Clients eine zentrale Stelle, um:

- kürzlich weitergeleitete Unterhaltungen aufzulisten
- den aktuellen Transkriptverlauf zu lesen
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

### Bridge-Werkzeuge

<AccordionGroup>
  <Accordion title="conversations_list">
    Listet kürzlich verwendete sitzungsgestützte Unterhaltungen auf, die bereits über Routenmetadaten im Gateway-Sitzungsstatus verfügen.

    Filter: `limit` (max. 500), `search`, `channel`, `includeDerivedTitles`, `includeLastMessage`.

  </Accordion>
  <Accordion title="conversation_get">
    Gibt mithilfe einer direkten Gateway-Sitzungssuche eine Unterhaltung anhand von `session_key` zurück.
  </Accordion>
  <Accordion title="messages_read">
    Liest aktuelle Transkriptnachrichten für eine sitzungsgestützte Unterhaltung. `limit` ist standardmäßig 20, maximal 200.
  </Accordion>
  <Accordion title="attachments_fetch">
    Extrahiert Nicht-Text-Inhaltsblöcke einer Nachricht aus einer Transkriptnachricht. Dies ist eine Metadatenansicht des Transkriptinhalts und kein eigenständiger dauerhafter Blob-Speicher für Anhänge.
  </Accordion>
  <Accordion title="events_poll">
    Liest eingereihte Live-Ereignisse ab einem numerischen Cursor. `limit` maximal 200.
  </Accordion>
  <Accordion title="events_wait">
    Führt Long-Polling durch, bis das nächste passende eingereihte Ereignis eintrifft oder eine Zeitüberschreitung abläuft (standardmäßig 30s, maximal 300s).

    Verwenden Sie dies, wenn ein generischer MCP-Client eine nahezu in Echtzeit erfolgende Zustellung ohne Claude-spezifisches Push-Protokoll benötigt.

  </Accordion>
  <Accordion title="messages_send">
    Sendet Text über dieselbe Route zurück, die bereits für die Sitzung aufgezeichnet wurde.

    Aktuelles Verhalten:

    - Erfordert eine vorhandene Unterhaltungsroute
    - Verwendet Kanal, Empfänger, Konto-ID und Thread-ID der Sitzung
    - Sendet nur Text

  </Accordion>
  <Accordion title="permissions_list_open">
    Listet ausstehende Genehmigungsanfragen für Ausführungen/Plugins auf, die die Bridge seit dem Herstellen der Verbindung zum Gateway beobachtet hat.
  </Accordion>
  <Accordion title="permissions_respond">
    Beantwortet eine ausstehende Genehmigungsanfrage für eine Ausführung/ein Plugin mit:

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### Ereignismodell

Die Bridge verwaltet eine Ereigniswarteschlange im Speicher, solange sie verbunden ist.

Aktuelle Ereignistypen:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- Die Warteschlange enthält nur Live-Ereignisse; sie beginnt beim Start der MCP-Bridge
- `events_poll` und `events_wait` geben älteren Gateway-Verlauf nicht selbstständig wieder
- Ein dauerhafter Rückstand sollte mit `messages_read` gelesen werden

</Warning>

### Claude-Kanalbenachrichtigungen

Die Bridge kann außerdem Claude-spezifische Kanalbenachrichtigungen bereitstellen. Dies ist das OpenClaw-Äquivalent eines Claude-Code-Kanaladapters: Standard-MCP-Werkzeuge bleiben verfügbar, aber eingehende Live-Nachrichten können zusätzlich als Claude-spezifische MCP-Benachrichtigungen eintreffen.

<Tabs>
  <Tab title="aus">
    `--claude-channel-mode off`: nur Standard-MCP-Werkzeuge.
  </Tab>
  <Tab title="ein">
    `--claude-channel-mode on`: Claude-Kanalbenachrichtigungen aktivieren.
  </Tab>
  <Tab title="auto (Standard)">
    `--claude-channel-mode auto`: aktuelle Standardeinstellung; dasselbe Bridge-Verhalten wie `on`.
  </Tab>
</Tabs>

Wenn der Claude-Kanalmodus aktiviert ist, kündigt der Server experimentelle Claude-Funktionen an und kann Folgendes ausgeben:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Aktuelles Bridge-Verhalten:

- Eingehende `user`-Transkriptnachrichten werden als `notifications/claude/channel` weitergeleitet
- Über MCP empfangene Claude-Berechtigungsanfragen werden im Speicher nachverfolgt
- Wenn der Befehlseigentümer in der verknüpften Unterhaltung später `yes <id>` oder `no <id>` sendet (`<id>` ist die 5-stellige Anfrage-ID ohne `l`), wandelt die Bridge dies in `notifications/claude/channel/permission` um
- Diese Benachrichtigungen sind nur während der Live-Sitzung verfügbar; wenn der MCP-Client die Verbindung trennt, gibt es kein Push-Ziel

Dies ist absichtlich clientspezifisch. Generische MCP-Clients sollten die Standard-Polling-Werkzeuge verwenden.

### MCP-Client-Konfiguration

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

Beginnen Sie bei den meisten generischen MCP-Clients mit der Standard-Werkzeugoberfläche und ignorieren Sie den Claude-Modus. Aktivieren Sie den Claude-Modus nur für Clients, die die Claude-spezifischen Benachrichtigungsmethoden tatsächlich verstehen.

### Optionen

`openclaw mcp serve` unterstützt:

<ParamField path="--url" type="string">
  Gateway-WebSocket-URL. Verwendet standardmäßig `gateway.remote.url`, sofern konfiguriert.
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
  Claude-Benachrichtigungsmodus. Standardwert: `auto`.
</ParamField>
<ParamField path="-v, --verbose" type="boolean">
  Ausführliche Protokolle auf stderr.
</ParamField>

<Tip>
Bevorzugen Sie nach Möglichkeit `--token-file` oder `--password-file` gegenüber direkt angegebenen Geheimnissen.
</Tip>

### Sicherheits- und Vertrauensgrenze

Die Bridge erfindet kein Routing. Sie stellt nur Konversationen bereit, für die das Gateway bereits Routing unterstützt.

Das bedeutet:

- Positivlisten für Absender, Kopplung und Vertrauen auf Kanalebene gehören weiterhin zur zugrunde liegenden OpenClaw-Kanalkonfiguration
- `messages_send` kann nur über eine bereits gespeicherte Route antworten
- der Genehmigungsstatus ist nur live/im Arbeitsspeicher und gilt ausschließlich für die aktuelle Bridge-Sitzung
- die Bridge-Authentifizierung sollte dieselben Gateway-Token- oder Passwortkontrollen verwenden, denen Sie auch bei jedem anderen entfernten Gateway-Client vertrauen würden

Wenn eine Konversation in `conversations_list` fehlt, liegt die Ursache normalerweise nicht an der MCP-Konfiguration. Vielmehr fehlen die Routing-Metadaten in der zugrunde liegenden Gateway-Sitzung oder sind unvollständig.

### Tests

OpenClaw enthält einen deterministischen Docker-Smoke-Test für diese Bridge:

```bash
pnpm test:docker:mcp-channels
```

Dieser Smoke-Test führt einen einzelnen Container aus: Er legt den Konversationsstatus an, startet das Gateway, erzeugt anschließend `openclaw mcp serve` als untergeordneten stdio-Prozess und steuert ihn als MCP-Client. Er überprüft die Konversationserkennung, das Lesen von Transkripten, das Lesen von Anhangsmetadaten, das Verhalten der Live-Ereigniswarteschlange sowie kanal- und berechtigungsbezogene Benachrichtigungen im Claude-Stil über die echte stdio-MCP-Bridge. Das Routing ausgehender Sendungen (`messages_send` verwendet die gespeicherte Konversationsroute erneut) wird separat durch Unit-Tests in `src/mcp/channel-server.test.ts` abgedeckt.

Dies ist die schnellste Möglichkeit, die Funktion der Bridge nachzuweisen, ohne ein echtes Telegram-, Discord- oder iMessage-Konto in den Testlauf einzubinden.

Einen umfassenderen Testkontext finden Sie unter [Tests](/de/help/testing).

### Fehlerbehebung

<AccordionGroup>
  <Accordion title="Keine Konversationen zurückgegeben">
    Bedeutet normalerweise, dass für die Gateway-Sitzung noch kein Routing möglich ist. Stellen Sie sicher, dass in der zugrunde liegenden Sitzung Kanal/Provider, Empfänger sowie optionale Routing-Metadaten für Konto/Thread gespeichert sind.
  </Accordion>
  <Accordion title="events_poll oder events_wait verpasst ältere Nachrichten">
    Erwartetes Verhalten. Die Live-Warteschlange beginnt, wenn die Bridge die Verbindung herstellt. Lesen Sie den älteren Transkriptverlauf mit `messages_read`.
  </Accordion>
  <Accordion title="Claude-Benachrichtigungen werden nicht angezeigt">
    Prüfen Sie alle folgenden Punkte:

    - der Client hat die stdio-MCP-Sitzung geöffnet gehalten
    - `--claude-channel-mode` ist `on` oder `auto`
    - der Client versteht tatsächlich die Claude-spezifischen Benachrichtigungsmethoden
    - die eingehende Nachricht ist nach dem Verbindungsaufbau der Bridge eingegangen

  </Accordion>
  <Accordion title="Genehmigungen fehlen">
    `permissions_list_open` zeigt nur Genehmigungsanfragen an, die beobachtet wurden, während die Bridge verbunden war. Es handelt sich nicht um eine dauerhafte API für den Genehmigungsverlauf.
  </Accordion>
</AccordionGroup>

## OpenClaw als MCP-Client-Registry

Dies ist der Pfad für `openclaw mcp list`, `show`, `status`, `doctor`, `probe`, `add`, `set`,
`configure`, `tools`, `login`, `logout`, `reload` und `unset`.

Diese Befehle stellen OpenClaw nicht über MCP bereit. Sie verwalten von OpenClaw verwaltete MCP-Serverdefinitionen unter `mcp.servers` in der OpenClaw-Konfiguration. Sie lesen keine mcporter-Server aus `config/mcporter.json`.

Diese gespeicherten Definitionen sind für Laufzeitumgebungen vorgesehen, die OpenClaw später startet oder konfiguriert, beispielsweise eingebettetes OpenClaw und andere Laufzeitadapter. OpenClaw speichert die Definitionen zentral, damit diese Laufzeitumgebungen keine eigenen doppelten MCP-Serverlisten verwalten müssen.

<AccordionGroup>
  <Accordion title="Wichtiges Verhalten">
    - diese Befehle lesen oder schreiben ausschließlich die OpenClaw-Konfiguration
    - `status`, `list`, `show`, `doctor` ohne `--probe`, `set`, `configure`, `tools`, `logout`, `reload` und `unset` stellen keine Verbindung zum Ziel-MCP-Server her
    - `login` führt den MCP-OAuth-Netzwerkablauf für den konfigurierten HTTP-Server aus und speichert die resultierenden lokalen Anmeldedaten
    - `status --verbose` gibt den aufgelösten Transport, die Authentifizierung, Zeitüberschreitungen, Filter und Hinweise zu parallelen Werkzeugaufrufen aus, ohne eine Verbindung herzustellen
    - `doctor` prüft gespeicherte Definitionen auf lokale Einrichtungsprobleme wie fehlende stdio-Befehle, ungültige Arbeitsverzeichnisse, fehlende TLS-Dateien, deaktivierte Server, direkt angegebene vertrauliche Header-/Umgebungswerte und unvollständige OAuth-Autorisierung
    - `doctor --probe` fügt nach erfolgreichen statischen Prüfungen denselben Live-Verbindungsnachweis wie `probe` hinzu
    - `probe` stellt eine Verbindung zum ausgewählten Server oder zu allen konfigurierten Servern her, listet Werkzeuge auf und meldet Fähigkeiten/Diagnosen
    - `add` erstellt anhand von Flags eine Definition und prüft sie vor dem Speichern, sofern nicht `--no-probe` gesetzt ist oder zunächst eine OAuth-Autorisierung erforderlich ist
    - Laufzeitadapter entscheiden zur Ausführungszeit, welche Transportformen sie tatsächlich unterstützen
    - `enabled: false` lässt einen Server gespeichert, schließt ihn jedoch von der Erkennung durch eingebettete Laufzeitumgebungen aus
    - `timeout` und `connectTimeout` legen die Zeitüberschreitungen für Anfragen bzw. Verbindungen pro Server in Sekunden fest
    - `supportsParallelToolCalls: true` kennzeichnet Server, die Adapter gleichzeitig aufrufen können
    - HTTP-Server können statische Header, OAuth-Anmeldung, Steuerung der TLS-Verifizierung sowie mTLS-Zertifikat-/Schlüsselpfade verwenden
    - eingebettetes OpenClaw stellt konfigurierte MCP-Werkzeuge in den normalen Werkzeugprofilen `coding` und `messaging` bereit; `minimal` blendet sie weiterhin aus, und `tools.deny: ["bundle-mcp"]` deaktiviert sie ausdrücklich
    - `toolFilter.include` und `toolFilter.exclude` pro Server filtern erkannte MCP-Werkzeuge, bevor sie zu OpenClaw-Werkzeugen werden
    - Server, die Ressourcen oder Prompts ankündigen, stellen außerdem Hilfswerkzeuge zum Auflisten/Lesen von Ressourcen und zum Auflisten/Abrufen von Prompts bereit; diese generierten Hilfsnamen (`resources_list`, `resources_read`, `prompts_list`, `prompts_get`) verwenden denselben Einschluss-/Ausschlussfilter
    - dynamische Änderungen an der MCP-Werkzeugliste invalidieren den zwischengespeicherten Katalog für diese Sitzung; bei der nächsten Erkennung/Verwendung wird er vom Server aktualisiert
    - wiederholte Fehler bei MCP-Werkzeuganfragen oder im Protokoll pausieren diesen Server kurzzeitig, damit ein defekter Server nicht den gesamten Durchlauf beansprucht
    - sitzungsbezogene gebündelte MCP-Laufzeitumgebungen werden nach `mcp.sessionIdleTtlMs` Millisekunden Inaktivität beendet (Standardwert 10 Minuten; setzen Sie `0`, um dies zu deaktivieren), und einmalige eingebettete Ausführungen bereinigen sie am Ende des Durchlaufs

  </Accordion>
</AccordionGroup>

Laufzeitadapter können diese gemeinsame Registry in die Form normalisieren, die ihr nachgelagerter Client erwartet. Beispielsweise verarbeitet eingebettetes OpenClaw die OpenClaw-Werte für `transport` direkt, während Claude Code und Gemini CLI-native `type`-Werte wie `http`, `sse` oder `stdio` erhalten.

Codex app-server berücksichtigt außerdem einen optionalen `codex`-Block auf jedem Server. Dabei handelt es sich
ausschließlich um OpenClaw-Projektionsmetadaten für Codex app-server-Threads; sie ändern weder
ACP-Sitzungen noch die generische Codex-Harness-Konfiguration oder andere Laufzeitadapter.
Verwenden Sie eine nicht leere Liste in `codex.agents`, um einen Server nur in bestimmte OpenClaw-
Agenten-IDs zu projizieren. Leere, ausschließlich aus Leerzeichen bestehende oder ungültige Agentenlisten werden von der Konfigurations-
validierung abgelehnt und vom Laufzeit-Projektionspfad ausgelassen, anstatt
global zu werden. Verwenden Sie `codex.defaultToolsApprovalMode` (`auto`, `prompt` oder `approve`),
um den nativen Codex-Wert `default_tools_approval_mode` für einen vertrauenswürdigen Server auszugeben.
OpenClaw entfernt die `codex`-Metadaten, bevor die native `mcp_servers`-
Konfiguration an Codex übergeben wird.

### Gespeicherte MCP-Serverdefinitionen

Befehle:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp status [--verbose]`
- `openclaw mcp doctor [name] [--probe]`
- `openclaw mcp probe [name]`
- `openclaw mcp add <name> [flags]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp configure <name> [flags]`
- `openclaw mcp tools <name> [--include csv] [--exclude csv] [--clear]`
- `openclaw mcp login <name> [--code code]`
- `openclaw mcp logout <name>`
- `openclaw mcp reload`
- `openclaw mcp unset <name>`

Hinweise:

- `list` sortiert die Servernamen.
- `show` ohne Namen gibt das vollständige konfigurierte MCP-Serverobjekt aus.
- `status` klassifiziert konfigurierte Transportarten, ohne eine Verbindung herzustellen. `--verbose` enthält Details zu aufgelöstem Start, Zeitüberschreitungen, OAuth, Filtern und parallelen Aufrufen.
- `doctor` führt statische Prüfungen durch, ohne eine Verbindung herzustellen. Fügen Sie `--probe` hinzu, wenn der Befehl außerdem überprüfen soll, ob aktivierte Server eine Verbindung herstellen können.
- `probe` stellt eine Verbindung her und meldet die Anzahl der Werkzeuge, Unterstützung für Ressourcen/Prompts und Listenänderungen sowie Diagnosen.
- `add` akzeptiert stdio-Flags wie `--command`, `--arg`, `--env` und `--cwd` oder HTTP-Flags wie `--url`, `--transport`, `--header`, `--auth oauth`, TLS, Zeitüberschreitungs- und Werkzeugauswahl-Flags.
- `set` erwartet einen einzelnen JSON-Objektwert in der Befehlszeile.
- `configure` aktualisiert Aktivierung, Werkzeugfilter, Zeitüberschreitungen, OAuth, TLS und Hinweise zu parallelen Werkzeugaufrufen, ohne die gesamte Serverdefinition zu ersetzen. Fügen Sie `--probe` hinzu, um den aktualisierten Server vor dem Speichern zu überprüfen.
- `tools` aktualisiert Werkzeugfilter pro Server. Ein-/Ausschlusseinträge sind MCP-Werkzeugnamen und einfache `*`-Globs.
- `login` führt den OAuth-Ablauf für HTTP-Server aus, die mit `auth: "oauth"` konfiguriert sind. Der erste Durchlauf gibt eine Autorisierungs-URL aus; führen Sie den Befehl nach der Genehmigung erneut mit `--code` aus.
- `logout` löscht gespeicherte OAuth-Anmeldedaten für den angegebenen Server, ohne die gespeicherte Serverdefinition zu entfernen.
- `reload` beendet zwischengespeicherte prozessinterne MCP-Laufzeitumgebungen nur für den aktuellen CLI-Prozess. Gateway- oder Agentenprozesse in einem anderen Prozess benötigen weiterhin einen eigenen Pfad zum Neuladen oder Neustarten.
- Verwenden Sie `transport: "streamable-http"` für Streamable-HTTP-MCP-Server. `openclaw mcp set` normalisiert zur Kompatibilität außerdem den CLI-nativen Wert `type: "http"` in dieselbe kanonische Konfigurationsform.
- `unset` schlägt fehl, wenn der angegebene Server nicht vorhanden ist.

Beispiele:

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp status --verbose
openclaw mcp doctor --probe
openclaw mcp probe context7 --json
openclaw mcp add memory --command npx --arg -y --arg @modelcontextprotocol/server-memory
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp tools context7 --include 'resolve-library-id,get-library-docs'
openclaw mcp set docs '{"url":"https://mcp.example.com","transport":"streamable-http"}'
openclaw mcp configure docs --timeout 20 --connect-timeout 5 --include 'search,read_*'
openclaw mcp configure docs --auth oauth --oauth-scope 'docs.read'
openclaw mcp login docs
openclaw mcp logout docs
openclaw mcp unset context7
```

### Übliche Serverkonfigurationen

Diese Beispiele speichern nur Serverdefinitionen. Führen Sie anschließend `openclaw mcp doctor --probe` aus, um nachzuweisen, dass der Server startet und Werkzeuge bereitstellt.

<Tabs>
  <Tab title="Dateisystem">
    ```bash
    openclaw mcp add files \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-filesystem \
      --arg "$HOME/Documents" \
      --include 'read_file,list_directory,search_files'
    openclaw mcp doctor files --probe
    ```

    Beschränken Sie Dateisystemserver auf den kleinstmöglichen Verzeichnisbaum, den der Agent lesen oder bearbeiten soll.

  </Tab>
  <Tab title="Speicher">
    ```bash
    openclaw mcp add memory \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-memory
    openclaw mcp probe memory --json
    ```

    Verwenden Sie einen Werkzeugfilter, wenn der Server Schreibwerkzeuge bereitstellt, die normalen Agenten nicht zur Verfügung stehen sollen.

  </Tab>
  <Tab title="Lokales Skript">
    ```bash
    openclaw mcp add local-tools \
      --command node \
      --arg ./dist/mcp-server.js \
      --cwd /srv/openclaw-tools \
      --env API_BASE=https://internal.example
    openclaw mcp status --verbose
    ```

    `doctor` prüft, ob `cwd` vorhanden ist und ob der Befehl in der konfigurierten Umgebung aufgelöst werden kann.

  </Tab>
  <Tab title="Remote-HTTP">
    ```bash
    openclaw mcp add docs \
      --url https://mcp.example.com/mcp \
      --transport streamable-http \
      --auth oauth \
      --oauth-scope docs.read \
      --timeout 20 \
      --connect-timeout 5 \
      --include 'search,read_*'
    openclaw mcp doctor docs --probe
    ```

    Verwenden Sie OAuth, wenn der Remote-Server dies unterstützt. Wenn der Server statische Header erfordert, vermeiden Sie es, Bearer-Token als Literalwerte zu committen.

  </Tab>
  <Tab title="Desktop/CUA">
    ```bash
    openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
    openclaw mcp tools cua-driver --include 'list_apps,observe,click,type'
    openclaw mcp doctor cua-driver --probe
    ```

    Direkte Server zur Desktop-Steuerung übernehmen die Berechtigungen des Prozesses, den sie starten. Verwenden Sie eng gefasste Tool-Filter und Berechtigungsabfragen auf Betriebssystemebene.

  </Tab>
</Tabs>

### JSON-Ausgabeformate

Verwenden Sie `--json` für Skripte und Dashboards. Feldmengen können mit der Zeit erweitert werden, daher sollten Verbraucher unbekannte Schlüssel ignorieren.

<AccordionGroup>
  <Accordion title="status --json">
    ```json
    {
      "path": "/home/user/.openclaw/openclaw.json",
      "servers": [
        {
          "name": "docs",
          "configured": true,
          "enabled": true,
          "ok": true,
          "transport": "streamable-http",
          "launch": "streamable-http https://mcp.example.com/mcp",
          "auth": "oauth",
          "authStatus": {
            "hasTokens": true,
            "hasClientInformation": true,
            "hasCodeVerifier": false,
            "hasDiscoveryState": true,
            "hasLastAuthorizationUrl": false
          },
          "requestTimeoutMs": 20000,
          "connectionTimeoutMs": 5000,
          "toolFilter": {
            "include": ["search", "read_*"],
            "exclude": []
          },
          "supportsParallelToolCalls": true
        }
      ]
    }
    ```
  </Accordion>
  <Accordion title="doctor --json">
    ```json
    {
      "ok": true,
      "path": "/home/user/.openclaw/openclaw.json",
      "servers": [
        {
          "name": "docs",
          "ok": true,
          "issues": [
            {
              "level": "warning",
              "message": "OAuth-Anmeldedaten sind nicht autorisiert; führen Sie openclaw mcp login docs aus"
            }
          ]
        }
      ]
    }
    ```

    `doctor --json` wird mit einem von null verschiedenen Status beendet, wenn ein aktivierter, geprüfter Server ein Problem der Ebene `error` aufweist. Probleme der Ebenen `warning` und `info` werden gemeldet, führen für sich allein jedoch nicht zum Fehlschlagen des Befehls.

  </Accordion>
  <Accordion title="probe --json">
    ```json
    {
      "generatedAt": "2026-05-31T09:00:00.000Z",
      "servers": {
        "docs": {
          "launch": "streamable-http https://mcp.example.com/mcp",
          "tools": 2,
          "resources": true,
          "listChanged": {
            "tools": true,
            "resources": false,
            "prompts": false
          }
        }
      },
      "tools": ["docs__read_page", "docs__search"],
      "diagnostics": []
    }
    ```

    `probe --json` öffnet eine aktive MCP-Clientsitzung und gibt ihr Ergebnis direkt aus; anders als bei `status`/`doctor` enthält die Ausgabe kein `path`-Feld auf oberster Ebene. Die Schlüssel `resources` und `prompts` sind nur vorhanden, wenn der Server die jeweilige Fähigkeit tatsächlich bekannt gibt (ein Server ohne Prompts lässt den Schlüssel `prompts` aus, statt `false` zu melden). Verwenden Sie `probe` als Nachweis für Erreichbarkeit und Fähigkeiten, nicht für statische Konfigurationsprüfungen.

  </Accordion>
</AccordionGroup>

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
        "url": "https://mcp.example.com",
        "transport": "streamable-http",
        "timeout": 20,
        "connectTimeout": 5,
        "supportsParallelToolCalls": true,
        "auth": "oauth",
        "oauth": {
          "scope": "docs.read"
        },
        "sslVerify": true,
        "clientCert": "/path/to/client.crt",
        "clientKey": "/path/to/client.key",
        "toolFilter": {
          "include": ["search_*"],
          "exclude": ["admin_*"]
        }
      }
    }
  }
}
```

### Stdio-Transport

Startet einen lokalen Kindprozess und kommuniziert über stdin/stdout.

| Feld                       | Beschreibung                              |
| -------------------------- | ----------------------------------------- |
| `command`                  | Zu startende ausführbare Datei (erforderlich) |
| `args`                     | Array mit Befehlszeilenargumenten         |
| `env`                      | Zusätzliche Umgebungsvariablen            |
| `cwd` / `workingDirectory` | Arbeitsverzeichnis für den Prozess        |

<Warning>
**Stdio-Sicherheitsfilter für Umgebungsvariablen**

OpenClaw weist Umgebungsvariablenschlüssel für Interpreter-Start, Loader-Manipulation und Shell-Initialisierung zurück, bevor ein Stdio-MCP-Server gestartet wird, selbst wenn sie im `env`-Block eines Servers enthalten sind. Dabei wird dieselbe Sicherheitsrichtlinie für die Hostumgebung verwendet wie bei anderen von OpenClaw gestarteten Prozessen: Bekannte Hooks für den Interpreter-Start (beispielsweise `NODE_OPTIONS`, `PYTHONSTARTUP`, `PERL5OPT`, `RUBYOPT`, `BASHOPTS`, `KSH_ENV`), Präfixe für die Einschleusung gemeinsam genutzter Bibliotheken und Funktionen (`DYLD_*`, `LD_*`, `BASH_FUNC_*`) sowie ähnliche Variablen zur Laufzeitsteuerung werden blockiert. Beim Start werden diese stillschweigend entfernt und eine Warnung wird protokolliert, damit sie kein implizites Präambel-Skript einschleusen, den Interpreter austauschen, einen Debugger aktivieren oder den dynamischen Linker des Stdio-Prozesses manipulieren können. Eine explizite Zulassungsliste sorgt dafür, dass gewöhnliche MCP-Umgebungsvariablen für Anmeldedaten weiterhin verwendet werden können (`GITHUB_TOKEN`, `GH_TOKEN`, `GITLAB_TOKEN`, `NPM_TOKEN`, `NODE_AUTH_TOKEN`, `DATABASE_URL`, `MONGODB_URI`, `REDIS_URL`, `AMQP_URL`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`), ebenso wie gewöhnliche Proxy- und serverspezifische Umgebungsvariablen (`HTTP_PROXY`, benutzerdefinierte `*_API_KEY` usw.). Andere `AWS_*`-Schlüssel wie `AWS_CONFIG_FILE` und `AWS_SHARED_CREDENTIALS_FILE` bleiben blockiert, da sie auf Anmeldedatendateien verweisen, statt direkt einen Anmeldedatenwert zu enthalten.

Wenn Ihr MCP-Server tatsächlich eine der blockierten Variablen benötigt, legen Sie sie für den Gateway-Hostprozess fest, statt sie unter `env` des Stdio-Servers zu konfigurieren.
</Warning>

### SSE-/HTTP-Transport

Stellt über HTTP Server-Sent Events eine Verbindung zu einem Remote-MCP-Server her.

| Feld                           | Beschreibung                                                               |
| ------------------------------ | -------------------------------------------------------------------------- |
| `url`                          | HTTP- oder HTTPS-URL des Remote-Servers (erforderlich)                     |
| `headers`                      | Optionale Schlüssel-Wert-Zuordnung von HTTP-Headern (beispielsweise Authentifizierungstoken) |
| `connectionTimeoutMs`          | Verbindungs-Timeout pro Server in ms (optional)                            |
| `connectTimeout`               | Verbindungs-Timeout pro Server in Sekunden (optional)                      |
| `timeout` / `requestTimeoutMs` | MCP-Anfrage-Timeout pro Server in Sekunden oder ms                         |
| `auth: "oauth"`                | Von `openclaw mcp login` gespeicherte MCP-OAuth-Anmeldedaten verwenden     |
| `sslVerify`                    | Nur für ausdrücklich vertrauenswürdige private HTTPS-Endpunkte auf false setzen |
| `clientCert` / `clientKey`     | Pfade zu mTLS-Clientzertifikat und -schlüssel                              |
| `supportsParallelToolCalls`    | Hinweis, dass gleichzeitige Aufrufe für diesen Server sicher sind          |

Beispiel:

```json
{
  "mcp": {
    "servers": {
      "remote-tools": {
        "url": "https://mcp.example.com",
        "auth": "oauth",
        "timeout": 20,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

Sensible Werte in `url` (Benutzerinformationen) und `headers` werden in Protokollen und Statusausgaben redigiert. `openclaw mcp doctor` warnt, wenn sensibel wirkende Einträge in `headers` oder `env` Literalwerte enthalten, damit Betreiber diese Werte aus committeter Konfiguration entfernen können.

### OAuth-Ablauf

OAuth ist für HTTP-MCP-Server vorgesehen, die den MCP-OAuth-Ablauf bekannt geben. Statische `Authorization`-Header werden für einen Server ignoriert, solange `auth: "oauth"` aktiviert ist. Von `openclaw mcp login` gespeicherte Anmeldedaten funktionieren mit eingebettetem MCP, CLI-Runnern und dem lokalen Codex-App-Server.

Bis Anmeldedaten verfügbar sind, lässt OpenClaw nur diesen MCP-Server aus der Agent-Laufzeit aus, statt den Agent-Turn fehlschlagen zu lassen. Der Betreiber oder ein Agent mit Shell-Zugriff kann anschließend `openclaw mcp login <name>` ausführen und den Server in einem späteren Turn verwenden.

Wenn ein Remote-MCP-Dienst bereits durch ein separates OpenClaw-Authentifizierungsprofil mit Aktualisierungsfunktion unterstützt wird, können Sie optional `oauth.authProfileId` festlegen. OpenClaw aktualisiert vor der Laufzeitprojektion eine der beiden Anmeldedatenquellen und übergibt nur das aktuelle Zugriffstoken an den nachgelagerten MCP-Client.

<Steps>
  <Step title="Server speichern">
    Fügen Sie den Server mit `auth: "oauth"` und optionalen OAuth-Metadaten hinzu oder aktualisieren Sie ihn entsprechend.

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"scope":"docs.read"}}'
    ```

    Speichern Sie für ein an ein Authentifizierungsprofil gebundenes Bearer-Token die Profilbindung:

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"authProfileId":"docs:mcp"}}'
    ```

  </Step>
  <Step title="Anmeldung starten">
    Führen Sie die Anmeldung aus, um die Autorisierungsanfrage zu erstellen.

    ```bash
    openclaw mcp login docs
    ```

    OpenClaw gibt die Autorisierungs-URL aus und speichert den temporären OAuth-Verifizierungsstatus im OpenClaw-Statusverzeichnis.

  </Step>
  <Step title="Mit dem Code abschließen">
    Übergeben Sie nach der Genehmigung im Browser den zurückgegebenen Code an OpenClaw.

    ```bash
    openclaw mcp login docs --code abc123
    ```

  </Step>
  <Step title="Autorisierung prüfen">
    Verwenden Sie den Status oder Doctor, um zu bestätigen, dass Token vorhanden sind.

    ```bash
    openclaw mcp status --verbose
    openclaw mcp doctor docs --probe
    ```

  </Step>
  <Step title="Anmeldedaten löschen">
    Die Abmeldung entfernt gespeicherte OAuth-Anmeldedaten, behält jedoch die gespeicherte Serverdefinition bei.

    ```bash
    openclaw mcp logout docs
    ```

  </Step>
</Steps>

Wenn der Provider Token rotiert oder der Autorisierungsstatus hängen bleibt, führen Sie `openclaw mcp logout <name>` aus und wiederholen Sie anschließend `login`. `logout` kann Anmeldedaten für einen gespeicherten HTTP-Server auch dann löschen, wenn `auth: "oauth"` bereits aus der Konfiguration entfernt wurde, solange Servername und URL den Eintrag im Anmeldedatenspeicher weiterhin identifizieren.

### Streamable-HTTP-Transport

`streamable-http` ist neben `sse` und `stdio` eine zusätzliche Transportoption. Sie verwendet HTTP-Streaming für die bidirektionale Kommunikation mit Remote-MCP-Servern.

| Feld                           | Beschreibung                                                                                                                              |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `url`                          | HTTP- oder HTTPS-URL des Remote-Servers (erforderlich)                                                                                    |
| `transport`                    | Auf `"streamable-http"` setzen, um diesen Transport auszuwählen; wenn nicht angegeben, verwendet OpenClaw `sse`                           |
| `headers`                      | Optionale Schlüssel-Wert-Zuordnung von HTTP-Headern (zum Beispiel Authentifizierungstoken)                                                |
| `connectionTimeoutMs`          | Verbindungs-Timeout pro Server in ms (optional)                                                                                           |
| `connectTimeout`               | Verbindungs-Timeout pro Server in Sekunden (optional)                                                                                     |
| `timeout` / `requestTimeoutMs` | MCP-Anfrage-Timeout pro Server in Sekunden oder ms                                                                                        |
| `auth: "oauth"`                | Durch `openclaw mcp login` gespeicherte MCP-OAuth-Anmeldedaten verwenden                                                                  |
| `sslVerify`                    | Nur für ausdrücklich vertrauenswürdige private HTTPS-Endpunkte auf „false“ setzen                                                         |
| `clientCert` / `clientKey`     | Pfade für mTLS-Clientzertifikat und -Schlüssel                                                                                            |
| `supportsParallelToolCalls`    | Hinweis, dass gleichzeitige Aufrufe für diesen Server sicher sind                                                                         |

Die OpenClaw-Konfiguration verwendet `transport: "streamable-http"` als kanonische Schreibweise. CLI-native MCP-Werte vom Typ `type: "http"` werden akzeptiert, wenn sie über `openclaw mcp set` gespeichert werden, und in vorhandenen Konfigurationen durch `openclaw doctor --fix` korrigiert. Eingebettetes OpenClaw verwendet jedoch direkt `transport`.

Beispiel:

```json
{
  "mcp": {
    "servers": {
      "streaming-tools": {
        "url": "https://mcp.example.com/stream",
        "transport": "streamable-http",
        "connectTimeout": 10,
        "timeout": 30,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

<Note>
Registrierungsbefehle starten die Channel-Bridge nicht. Nur `probe` und `doctor --probe` öffnen eine aktive MCP-Clientsitzung, um nachzuweisen, dass der Zielserver erreichbar ist.
</Note>

## Control UI

Die browserbasierte Control UI enthält unter `/settings/mcp` eine eigene MCP-Einstellungsseite; der bisherige Pfad `/mcp` bleibt als Alias erhalten. Die Seite zeigt die Anzahl konfigurierter Server, Zusammenfassungen zu aktivierten Servern, OAuth und Filtern, Transportzeilen pro Server, Steuerelemente zum Aktivieren und Deaktivieren, häufig verwendete CLI-Befehle sowie einen bereichsspezifischen Editor für den Konfigurationsabschnitt `mcp`.

Verwenden Sie die Seite für Änderungen durch Betreiber und für einen schnellen Überblick. Verwenden Sie `openclaw mcp doctor --probe` oder `openclaw mcp probe`, wenn Sie einen Live-Nachweis für den Server benötigen.

Arbeitsablauf für Betreiber:

1. Öffnen Sie die Control UI und wählen Sie **MCP**.
2. Prüfen Sie die Übersichtskarten für alle, aktivierte, OAuth- und gefilterte Server.
3. Verwenden Sie jede Serverzeile für Hinweise zu Transport, Authentifizierung, Filtern, Timeout und Befehlen.
4. Schalten Sie die Aktivierung um, wenn Sie eine Definition beibehalten, sie aber von der Laufzeiterkennung ausschließen möchten.
5. Bearbeiten Sie den bereichsspezifischen Konfigurationsabschnitt `mcp`, um strukturelle Änderungen wie neue Server, Header, TLS, OAuth-Metadaten oder Tool-Filter vorzunehmen.
6. Wählen Sie **Save**, um nur die Konfiguration dauerhaft zu speichern, oder **Save & Publish**, um sie über den Gateway-Konfigurationspfad anzuwenden.
7. Führen Sie `openclaw mcp doctor --probe` aus, wenn Sie einen Live-Nachweis benötigen, dass der bearbeitete Server startet und Tools auflistet.

Hinweise:

- Befehlsausschnitte setzen Servernamen in Anführungszeichen, damit ungewöhnliche Namen in einer Shell weiterhin kopiert werden können
- angezeigte URL-ähnliche Werte werden vor der Darstellung geschwärzt, wenn sie eingebettete Anmeldedaten enthalten
- die Seite startet selbst keine MCP-Transporte
- aktive Laufzeitumgebungen erfordern möglicherweise `openclaw mcp reload`, die Veröffentlichung der Gateway-Konfiguration oder einen Prozessneustart, je nachdem, welcher Prozess die MCP-Clients verwaltet

## MCP Apps

OpenClaw kann Tools darstellen, die die stabile [MCP-Apps-Erweiterung](https://modelcontextprotocol.io/extensions/apps) implementieren. Apps müssen explizit aktiviert werden, da ihr HTML vom konfigurierten MCP-Server stammt und sie für Apps sichtbare Tools oder Ressourcen von demselben Server anfordern können.

Aktivieren Sie die Host-Bridge:

```bash
openclaw config set mcp.apps.enabled true --strict-json
```

Starten Sie den Gateway neu, nachdem Sie diese Einstellung geändert haben. Wenn sie aktiviert ist, startet OpenClaw einen ausschließlich für die Sandbox bestimmten HTTP(S)-Listener auf dem Gateway-Port plus eins (beim standardmäßigen Gateway `18790`). Die Control UI lädt Apps von diesem separaten Ursprung; der Listener stellt niemals die Control UI, authentifizierte Gateway-Routen oder Benutzerdaten bereit.

Direkte Gateway-Verbindungen benötigen Zugriff auf beide Ports. Wenn ein Reverse-Proxy oder TLS-Terminator die Control UI bereitstellt, weisen Sie Apps einen eigenen öffentlichen Ursprung zu und leiten Sie nur diesen Ursprung an den Sandbox-Listener weiter:

```json5
{
  mcp: {
    apps: {
      enabled: true,
      sandboxOrigin: "https://mcp-apps.example.com",
      sandboxPort: 18790,
    },
  },
}
```

Der Sandbox-Ursprung muss sich vom Ursprung der Control UI unterscheiden. Stellen Sie darauf keine anderen authentifizierten oder sensiblen Inhalte bereit.

Das offizielle einfache React-Demo kann beispielsweise wie folgt konfiguriert werden:

```json5
{
  mcp: {
    apps: { enabled: true },
    servers: {
      "basic-react": {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-basic-react", "--stdio"],
      },
    },
  },
}
```

Verhaltens- und Sicherheitsgrenzen:

- OpenClaw kündigt die Erweiterung `io.modelcontextprotocol/ui` nur an, wenn Apps aktiviert sind.
- Nur `ui://`-Ressourcen mit dem exakten MIME-Typ `text/html;profile=mcp-app` werden dargestellt.
- UI-Ressourcen sind auf 2 MiB begrenzt, werden hinter einem Doppel-Iframe-Proxy auf einem dedizierten äußeren Ursprung platziert, in einen opaken inneren App-Ursprung geladen und durch eine aus den Ressourcenmetadaten abgeleitete CSP eingeschränkt.
- Ausschließlich für Apps bestimmte Tools (`_meta.ui.visibility: ["app"]`) erscheinen nicht in den Tool-Listen des Modells. Apps können nur für Apps sichtbare Tools auf ihrem zugehörigen Server aufrufen.
- Ursprungsgebundene App-Berechtigungen wie Kamera, Mikrofon und Geolokalisierung werden nicht gewährt, solange innere App-Dokumente zur Isolation zwischen Apps opake Ursprünge verwenden.
- App-HTML, vollständige Tool-Argumente und Rohergebnisse verbleiben in einer begrenzten, zehnminütigen In-Memory-Ansichtslease. Sie werden weder auf den Datenträger geschrieben noch in die Vorschau-Metadaten des Transkripts kopiert, und eine abgelaufene Ansicht startet ihre MCP-Laufzeitumgebung nicht neu.
- `openclaw security audit` gibt eine Warnung aus, solange die Bridge aktiviert ist. Deaktivieren Sie sie mit `openclaw config set mcp.apps.enabled false --strict-json`, wenn sie nicht benötigt wird.

## Aktuelle Einschränkungen

Diese Seite dokumentiert die Bridge in ihrem heutigen Auslieferungsstand.

Aktuelle Einschränkungen:

- die Konversationserkennung hängt von vorhandenen Metadaten der Gateway-Sitzungsroute ab
- kein generisches Push-Protokoll über den Claude-spezifischen Adapter hinaus
- noch keine Tools zum Bearbeiten von Nachrichten oder für Reaktionen
- der HTTP-/SSE-/streamable-http-Transport stellt eine Verbindung zu einem einzelnen Remote-Server her; noch kein Multiplexing für Upstream-Server
- `permissions_list_open` enthält nur Genehmigungen, die beobachtet wurden, während die Bridge verbunden ist

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Plugins](/de/cli/plugins)
