---
read_when:
    - Codex, Claude Code oder einen anderen MCP-Client mit von OpenClaw unterstützten Kanälen verbinden
    - '`openclaw mcp serve` wird ausgeführt'
    - Verwalten der von OpenClaw gespeicherten MCP-Serverdefinitionen
sidebarTitle: MCP
summary: OpenClaw-Kanalunterhaltungen über MCP bereitstellen und gespeicherte MCP-Serverdefinitionen verwalten
title: MCP
x-i18n:
    generated_at: "2026-07-16T12:36:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f62657954709e3f25eb7031dafca9c4050f2420443587f76ce2b2db23f187987
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` hat zwei Aufgaben:

- OpenClaw mit `openclaw mcp serve` als MCP-Server ausführen
- von OpenClaw verwaltete Definitionen ausgehender MCP-Server mit `list`, `show`, `status`, `doctor`, `probe`, `add`, `set`, `configure`, `tools`, `login`, `logout`, `reload` und `unset` verwalten

Bei `serve` fungiert OpenClaw als MCP-Server. Bei den anderen Unterbefehlen fungiert OpenClaw als clientseitige MCP-Registry für Server, die seine eigenen Laufzeitumgebungen später verwenden können.

<Note>
  `list`, `show`, `set` und `unset` lesen und schreiben nur von OpenClaw verwaltete `mcp.servers`-Einträge in der OpenClaw-Konfiguration. Sie enthalten keine mcporter-Server aus `config/mcporter.json`; verwenden Sie für diese Registry `mcporter list`.
</Note>

Verwenden Sie [`openclaw acp`](/de/cli/acp), wenn OpenClaw selbst eine Coding-Harness-Sitzung hosten und diese Laufzeitumgebung über ACP leiten soll.

## Den richtigen MCP-Pfad auswählen

| Ziel                                                                | Verwendung                                                            | Begründung                                                                                                      |
| ------------------------------------------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Einem externen MCP-Client das Lesen/Senden von OpenClaw-Kanalunterhaltungen ermöglichen | `openclaw mcp serve`                                                 | OpenClaw ist der MCP-Server und stellt Gateway-gestützte Unterhaltungen über stdio bereit.                       |
| MCP-Server von Drittanbietern für von OpenClaw verwaltete Agentenläufe speichern | `openclaw mcp add`, `set`, `configure`, `tools`, `login`             | OpenClaw ist die clientseitige MCP-Registry und projiziert diese Server später in geeignete Laufzeitumgebungen.  |
| Einen gespeicherten Server prüfen, ohne einen Agentendurchlauf auszuführen | `openclaw mcp status`, `doctor`, `probe`                             | `status` und `doctor` prüfen die Konfiguration; `probe` öffnet eine aktive MCP-Verbindung und listet Fähigkeiten auf. |
| MCP-Konfiguration in einem Browser bearbeiten                       | Control UI `/settings/mcp` (Alias `/mcp`)                            | Die Seite zeigt Bestand, Aktivierung, OAuth-/Filterzusammenfassungen, Befehlshinweise und einen bereichsgebundenen Editor für `mcp`. |
| Codex app-server einen bereichsgebundenen nativen MCP-Server bereitstellen | `mcp.servers.<name>.codex`                                           | Der Block `codex` wirkt sich nur auf die Thread-Projektion von Codex app-server aus und wird vor der Übergabe der nativen Konfiguration entfernt. |
| ACP-gehostete Harness-Sitzungen ausführen                            | [`openclaw acp`](/de/cli/acp) und [ACP-Agenten](/de/tools/acp-agents-setup) | Der ACP-Bridge-Modus akzeptiert keine sitzungsspezifische MCP-Server-Injektion; konfigurieren Sie stattdessen Gateway-/Plugin-Bridges. |

<Tip>
Wenn Sie nicht sicher sind, welchen Pfad Sie benötigen, beginnen Sie mit `openclaw mcp status --verbose`. Dies zeigt, was OpenClaw gespeichert hat, ohne MCP-Server zu starten.
</Tip>

## OpenClaw als MCP-Server

Dies ist der Pfad `openclaw mcp serve`.

### Wann serve verwendet werden sollte

Verwenden Sie `openclaw mcp serve`, wenn:

- Codex, Claude Code oder ein anderer MCP-Client direkt mit OpenClaw-gestützten Kanalunterhaltungen kommunizieren soll
- Sie bereits über ein lokales oder entferntes OpenClaw-Gateway mit weitergeleiteten Sitzungen verfügen
- Sie einen MCP-Server wünschen, der mit allen Kanal-Backends von OpenClaw funktioniert, statt separate Bridges für jeden Kanal auszuführen

Verwenden Sie stattdessen [`openclaw acp`](/de/cli/acp), wenn OpenClaw die Coding-Laufzeitumgebung selbst hosten und die Agentensitzung innerhalb von OpenClaw halten soll.

### Funktionsweise

`openclaw mcp serve` startet einen stdio-MCP-Server. Der MCP-Client ist Eigentümer dieses Prozesses. Solange der Client die stdio-Sitzung offen hält, stellt die Bridge über WebSocket eine Verbindung zu einem lokalen oder entfernten OpenClaw-Gateway her und stellt weitergeleitete Kanalunterhaltungen über MCP bereit.

<Steps>
  <Step title="Client startet die Bridge">
    Der MCP-Client startet `openclaw mcp serve`.
  </Step>
  <Step title="Bridge stellt Verbindung zum Gateway her">
    Die Bridge stellt über WebSocket eine Verbindung zum OpenClaw-Gateway her.
  </Step>
  <Step title="Sitzungen werden zu MCP-Unterhaltungen">
    Weitergeleitete Sitzungen werden zu MCP-Unterhaltungen und Tools für Transkripte/Verläufe.
  </Step>
  <Step title="Live-Ereignisse werden in die Warteschlange gestellt">
    Live-Ereignisse werden im Arbeitsspeicher in eine Warteschlange gestellt, solange die Bridge verbunden ist.
  </Step>
  <Step title="Optionaler Claude-Push">
    Wenn der Claude-Kanalmodus aktiviert ist, kann dieselbe Sitzung auch Claude-spezifische Push-Benachrichtigungen empfangen.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Wichtiges Verhalten">
    - der Zustand der Live-Warteschlange beginnt mit dem Verbindungsaufbau der Bridge
    - ältere Transkriptverläufe werden mit `messages_read` gelesen
    - Claude-Push-Benachrichtigungen sind nur vorhanden, solange die MCP-Sitzung aktiv ist
    - wenn der Client die Verbindung trennt, wird die Bridge beendet und die Live-Warteschlange geht verloren
    - Agenten-Einstiegspunkte für einmalige Ausführungen wie `openclaw agent` und `openclaw infer model run` beenden alle gebündelten MCP-Laufzeitumgebungen, die sie öffnen, sobald die Antwort abgeschlossen ist, sodass sich bei wiederholten skriptgesteuerten Ausführungen keine untergeordneten stdio-MCP-Prozesse ansammeln
    - von OpenClaw gestartete stdio-MCP-Server (gebündelte oder benutzerkonfigurierte) werden beim Herunterfahren als Prozessbaum beendet, sodass vom Server gestartete Unterprozesse nicht weiterlaufen, nachdem der übergeordnete stdio-Client beendet wurde
    - beim Löschen oder Zurücksetzen einer Sitzung werden die MCP-Clients dieser Sitzung über den gemeinsamen Bereinigungspfad der Laufzeitumgebung freigegeben, sodass keine verbleibenden stdio-Verbindungen an eine entfernte Sitzung gebunden sind

  </Accordion>
</AccordionGroup>

### Clientmodus auswählen

<Tabs>
  <Tab title="Generische MCP-Clients">
    Nur standardmäßige MCP-Tools. Verwenden Sie `conversations_list`, `messages_read`, `events_poll`, `events_wait`, `messages_send` und die Genehmigungstools.
  </Tab>
  <Tab title="Claude Code">
    Standardmäßige MCP-Tools sowie der Claude-spezifische Kanaladapter. Aktivieren Sie `--claude-channel-mode on` oder behalten Sie die Standardeinstellung `auto` bei.
  </Tab>
</Tabs>

<Note>
Derzeit verhält sich `auto` genauso wie `on`. Eine Erkennung der Clientfähigkeiten ist noch nicht vorhanden.
</Note>

### Was serve bereitstellt

Die Bridge verwendet vorhandene Routenmetadaten der Gateway-Sitzung, um kanalgestützte Unterhaltungen bereitzustellen. Eine Unterhaltung erscheint, wenn OpenClaw bereits über einen Sitzungszustand mit einer bekannten Route wie der folgenden verfügt:

- `channel`
- Metadaten des Empfängers oder Ziels
- optional `accountId`
- optional `threadId`

Dadurch erhalten MCP-Clients eine zentrale Stelle, um:

- kürzlich weitergeleitete Unterhaltungen aufzulisten
- den letzten Transkriptverlauf zu lesen
- auf neue eingehende Ereignisse zu warten
- eine Antwort über dieselbe Route zurückzusenden
- Genehmigungsanfragen anzuzeigen, die eintreffen, während die Bridge verbunden ist

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

<AccordionGroup>
  <Accordion title="conversations_list">
    Listet kürzlich verwendete sitzungsgestützte Unterhaltungen auf, für die im Gateway-Sitzungszustand bereits Routenmetadaten vorhanden sind.

    Filter: `limit` (max. 500), `search`, `channel`, `includeDerivedTitles`, `includeLastMessage`.

  </Accordion>
  <Accordion title="conversation_get">
    Gibt anhand von `session_key` über eine direkte Gateway-Sitzungssuche eine Unterhaltung zurück.
  </Accordion>
  <Accordion title="messages_read">
    Liest kürzlich aufgezeichnete Transkriptnachrichten für eine sitzungsgestützte Unterhaltung. `limit` ist standardmäßig 20, maximal 200.
  </Accordion>
  <Accordion title="attachments_fetch">
    Extrahiert nicht textbasierte Nachrichteninhaltsblöcke aus einer Transkriptnachricht. Dies ist eine Metadatenansicht des Transkriptinhalts, kein eigenständiger dauerhafter Blob-Speicher für Anhänge.
  </Accordion>
  <Accordion title="events_poll">
    Liest Live-Ereignisse aus der Warteschlange ab einem numerischen Cursor. `limit` maximal 200.
  </Accordion>
  <Accordion title="events_wait">
    Führt eine lange Abfrage aus, bis das nächste passende Ereignis in der Warteschlange eintrifft oder eine Zeitüberschreitung abläuft (Standardwert 30 s, maximal 300 s).

    Verwenden Sie dies, wenn ein generischer MCP-Client eine nahezu in Echtzeit erfolgende Zustellung ohne Claude-spezifisches Push-Protokoll benötigt.

  </Accordion>
  <Accordion title="messages_send">
    Sendet Text über dieselbe Route zurück, die bereits für die Sitzung gespeichert ist.

    Aktuelles Verhalten:

    - erfordert eine bestehende Unterhaltungsroute
    - verwendet Kanal, Empfänger, Konto-ID und Thread-ID der Sitzung
    - sendet nur Text

  </Accordion>
  <Accordion title="permissions_list_open">
    Listet ausstehende Genehmigungsanfragen für Ausführungen/Plugins auf, die die Bridge seit dem Verbindungsaufbau mit dem Gateway beobachtet hat.
  </Accordion>
  <Accordion title="permissions_respond">
    Löst eine ausstehende Genehmigungsanfrage für Ausführungen/Plugins mit einem der folgenden Werte auf:

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### Ereignismodell

Die Bridge führt während der bestehenden Verbindung eine Ereigniswarteschlange im Arbeitsspeicher.

Aktuelle Ereignistypen:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- die Warteschlange enthält nur Live-Daten; sie beginnt mit dem Start der MCP-Bridge
- `events_poll` und `events_wait` geben ältere Gateway-Verläufe nicht selbstständig erneut wieder
- dauerhafte Rückstände sollten mit `messages_read` gelesen werden

</Warning>

### Claude-Kanalbenachrichtigungen

Die Bridge kann auch Claude-spezifische Kanalbenachrichtigungen bereitstellen. Dies ist das OpenClaw-Äquivalent eines Claude-Code-Kanaladapters: Standardmäßige MCP-Tools bleiben verfügbar, aber eingehende Live-Nachrichten können auch als Claude-spezifische MCP-Benachrichtigungen eintreffen.

<Tabs>
  <Tab title="aus">
    `--claude-channel-mode off`: nur standardmäßige MCP-Tools.
  </Tab>
  <Tab title="ein">
    `--claude-channel-mode on`: Claude-Kanalbenachrichtigungen aktivieren.
  </Tab>
  <Tab title="automatisch (Standard)">
    `--claude-channel-mode auto`: aktueller Standardwert; dasselbe Bridge-Verhalten wie `on`.
  </Tab>
</Tabs>

Wenn der Claude-Kanalmodus aktiviert ist, kündigt der Server experimentelle Claude-Fähigkeiten an und kann Folgendes ausgeben:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Aktuelles Bridge-Verhalten:

- eingehende `user`-Transkriptnachrichten werden als `notifications/claude/channel` weitergeleitet
- über MCP empfangene Claude-Berechtigungsanfragen werden im Arbeitsspeicher nachverfolgt
- wenn der Eigentümer des Befehls in der verknüpften Unterhaltung später `yes <id>` oder `no <id>` sendet (`<id>` ist die aus 5 Buchstaben bestehende Anfrage-ID ohne `l`), wandelt die Bridge dies in `notifications/claude/channel/permission` um
- diese Benachrichtigungen sind nur während der Live-Sitzung verfügbar; wenn der MCP-Client die Verbindung trennt, ist kein Push-Ziel vorhanden

Dies ist absichtlich clientspezifisch. Generische MCP-Clients sollten sich auf die standardmäßigen Abfragetools stützen.

### MCP-Clientkonfiguration

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

Beginnen Sie bei den meisten generischen MCP-Clients mit der Standard-Tool-Oberfläche und ignorieren Sie den Claude-Modus. Aktivieren Sie den Claude-Modus nur für Clients, die die Claude-spezifischen Benachrichtigungsmethoden tatsächlich verstehen.

### Optionen

`openclaw mcp serve` unterstützt:

<ParamField path="--url" type="string">
  Gateway-WebSocket-URL. Standardmäßig `gateway.remote.url`, sofern konfiguriert.
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
  Claude-Benachrichtigungsmodus. Standardwert `auto`.
</ParamField>
<ParamField path="-v, --verbose" type="boolean">
  Ausführliche Protokolle auf stderr.
</ParamField>

<Tip>
Verwenden Sie nach Möglichkeit `--token-file` oder `--password-file` anstelle direkt eingebetteter Geheimnisse.
</Tip>

### Sicherheits- und Vertrauensgrenze

Die Bridge erfindet kein Routing. Sie stellt nur Konversationen bereit, für die das Gateway bereits weiß, wie sie weitergeleitet werden.

Das bedeutet:

- Absender-Zulassungslisten, Kopplung und Vertrauen auf Kanalebene gehören weiterhin zur zugrunde liegenden OpenClaw-Kanalkonfiguration
- `messages_send` kann nur über eine vorhandene gespeicherte Route antworten
- der Genehmigungsstatus ist nur live/im Arbeitsspeicher und gilt ausschließlich für die aktuelle Bridge-Sitzung
- die Bridge-Authentifizierung sollte dieselben Gateway-Token- oder Passwortkontrollen verwenden, denen Sie auch bei jedem anderen entfernten Gateway-Client vertrauen würden

Wenn eine Konversation in `conversations_list` fehlt, liegt die Ursache üblicherweise nicht an der MCP-Konfiguration. Stattdessen fehlen Routing-Metadaten in der zugrunde liegenden Gateway-Sitzung oder sind unvollständig.

### Tests

OpenClaw enthält einen deterministischen Docker-Smoke-Test für diese Bridge:

```bash
pnpm test:docker:mcp-channels
```

Dieser Smoke-Test führt einen einzelnen Container aus: Er initialisiert den Konversationsstatus, startet das Gateway, erzeugt anschließend `openclaw mcp serve` als stdio-Kindprozess und steuert ihn als MCP-Client. Er überprüft die Konversationserkennung, das Lesen von Transkripten, das Lesen von Anhangsmetadaten, das Verhalten der Live-Ereigniswarteschlange sowie Kanal- und Berechtigungsbenachrichtigungen im Claude-Stil über die echte stdio-MCP-Bridge. Das ausgehende Senderouting (`messages_send` verwendet die gespeicherte Konversationsroute erneut) wird separat durch Unit-Tests in `src/mcp/channel-server.test.ts` abgedeckt.

Dies ist die schnellste Möglichkeit, die Funktion der Bridge nachzuweisen, ohne ein echtes Telegram-, Discord- oder iMessage-Konto in den Testlauf einzubinden.

Einen umfassenderen Testkontext finden Sie unter [Tests](/de/help/testing).

### Fehlerbehebung

<AccordionGroup>
  <Accordion title="Keine Konversationen zurückgegeben">
    Dies bedeutet üblicherweise, dass die Gateway-Sitzung noch nicht routingfähig ist. Vergewissern Sie sich, dass in der zugrunde liegenden Sitzung Kanal/Provider, Empfänger sowie optionale Routing-Metadaten für Konto/Thread gespeichert sind.
  </Accordion>
  <Accordion title="events_poll oder events_wait übersieht ältere Nachrichten">
    Dies ist zu erwarten. Die Live-Warteschlange beginnt, sobald die Bridge eine Verbindung herstellt. Lesen Sie den älteren Transkriptverlauf mit `messages_read`.
  </Accordion>
  <Accordion title="Claude-Benachrichtigungen werden nicht angezeigt">
    Prüfen Sie alle folgenden Punkte:

    - der Client hat die stdio-MCP-Sitzung offengehalten
    - `--claude-channel-mode` ist `on` oder `auto`
    - der Client versteht die Claude-spezifischen Benachrichtigungsmethoden tatsächlich
    - die eingehende Nachricht ist nach dem Verbindungsaufbau der Bridge eingegangen

  </Accordion>
  <Accordion title="Genehmigungen fehlen">
    `permissions_list_open` zeigt nur Genehmigungsanfragen an, die beobachtet wurden, während die Bridge verbunden war. Es handelt sich nicht um eine API für einen dauerhaften Genehmigungsverlauf.
  </Accordion>
</AccordionGroup>

## OpenClaw als MCP-Client-Registry

Dies ist der Pfad für `openclaw mcp list`, `show`, `status`, `doctor`, `probe`, `add`, `set`,
`configure`, `tools`, `login`, `logout`, `reload` und `unset`.

Diese Befehle stellen OpenClaw nicht über MCP bereit. Sie verwalten von OpenClaw verwaltete MCP-Serverdefinitionen unter `mcp.servers` in der OpenClaw-Konfiguration. Sie lesen keine mcporter-Server aus `config/mcporter.json`.

Diese gespeicherten Definitionen sind für Laufzeitumgebungen bestimmt, die OpenClaw später startet oder konfiguriert, etwa das eingebettete OpenClaw und andere Laufzeitadapter. OpenClaw speichert die Definitionen zentral, damit diese Laufzeitumgebungen keine eigenen doppelten MCP-Serverlisten verwalten müssen.

<AccordionGroup>
  <Accordion title="Wichtiges Verhalten">
    - diese Befehle lesen oder schreiben ausschließlich die OpenClaw-Konfiguration
    - `status`, `list`, `show`, `doctor` ohne `--probe`, `set`, `configure`, `tools`, `logout`, `reload` und `unset` stellen keine Verbindung zum MCP-Zielserver her
    - `login` führt den MCP-OAuth-Netzwerkablauf für den konfigurierten HTTP-Server aus und speichert die daraus resultierenden lokalen Anmeldedaten
    - `status --verbose` gibt Hinweise zum aufgelösten Transport, zur Authentifizierung, zum Zeitlimit, zum Filter und zu parallelen Tool-Aufrufen aus, ohne eine Verbindung herzustellen
    - `doctor` prüft gespeicherte Definitionen auf lokale Einrichtungsprobleme wie fehlende stdio-Befehle, ungültige Arbeitsverzeichnisse, fehlende TLS-Dateien, deaktivierte Server, direkt angegebene sensible Header-/Umgebungswerte und unvollständige OAuth-Autorisierung
    - `doctor --probe` ergänzt nach erfolgreichen statischen Prüfungen denselben Nachweis einer Live-Verbindung wie `probe`
    - `probe` stellt eine Verbindung zum ausgewählten Server oder zu allen konfigurierten Servern her, listet Tools auf und meldet Fähigkeiten/Diagnosen
    - `add` erstellt anhand von Flags eine Definition und prüft sie vor dem Speichern, sofern nicht `--no-probe` gesetzt ist oder zunächst eine OAuth-Autorisierung erforderlich ist
    - Laufzeitadapter entscheiden zur Ausführungszeit, welche Transportformen sie tatsächlich unterstützen
    - `enabled: false` lässt einen Server gespeichert, schließt ihn jedoch von der Erkennung durch die eingebettete Laufzeitumgebung aus
    - `timeout` und `connectTimeout` legen Anforderungs- und Verbindungszeitlimits pro Server in Sekunden fest
    - `supportsParallelToolCalls: true` kennzeichnet Server, die Adapter gleichzeitig aufrufen können
    - HTTP-Server können statische Header, OAuth-Anmeldung, Steuerung der TLS-Verifizierung sowie mTLS-Zertifikat-/Schlüsselpfade verwenden
    - das eingebettete OpenClaw stellt konfigurierte MCP-Tools in den normalen Tool-Profilen `coding` und `messaging` bereit; `minimal` blendet sie weiterhin aus und `tools.deny: ["bundle-mcp"]` deaktiviert sie ausdrücklich
    - serverspezifische `toolFilter.include` und `toolFilter.exclude` filtern erkannte MCP-Tools, bevor sie zu OpenClaw-Tools werden
    - Server, die Ressourcen oder Prompts ankündigen, stellen außerdem Hilfstools zum Auflisten/Lesen von Ressourcen und zum Auflisten/Abrufen von Prompts bereit; diese generierten Hilfsnamen (`resources_list`, `resources_read`, `prompts_list`, `prompts_get`) verwenden denselben Ein-/Ausschlussfilter
    - dynamische Änderungen der MCP-Tool-Liste machen den zwischengespeicherten Katalog für diese Sitzung ungültig; bei der nächsten Erkennung/Verwendung wird er vom Server aktualisiert
    - wiederholte Fehler bei MCP-Tool-Anfragen oder im Protokoll pausieren diesen Server kurzzeitig, damit ein defekter Server nicht den gesamten Durchlauf beansprucht
    - sitzungsbezogene gebündelte MCP-Laufzeitumgebungen werden nach `mcp.sessionIdleTtlMs` Millisekunden Inaktivität beendet (standardmäßig 10 Minuten; zum Deaktivieren `0` festlegen), und einmalige eingebettete Ausführungen bereinigen sie am Ende des Durchlaufs

  </Accordion>
</AccordionGroup>

Laufzeitadapter können diese gemeinsame Registry in die Form normalisieren, die ihr nachgelagerter Client erwartet. Beispielsweise verwendet das eingebettete OpenClaw die OpenClaw-Werte `transport` direkt, während Claude Code und Gemini CLI-native `type`-Werte wie `http`, `sse` oder `stdio` erhalten.

Der Codex-App-Server berücksichtigt außerdem einen optionalen `codex`-Block auf jedem Server. Dabei handelt es sich
ausschließlich um OpenClaw-Projektionsmetadaten für Threads des Codex-App-Servers; sie ändern weder
ACP-Sitzungen noch die generische Konfiguration des Codex-Harness oder andere Laufzeitadapter.
Verwenden Sie nicht leere `codex.agents`, um einen Server nur in bestimmte OpenClaw-
Agent-IDs zu projizieren. Leere, ausschließlich aus Leerzeichen bestehende oder ungültige Agent-Listen werden von der Konfigurations-
validierung abgelehnt und vom Laufzeit-Projektionspfad ausgelassen, statt
global zu werden. Verwenden Sie `codex.defaultToolsApprovalMode` (`auto`, `prompt` oder `approve`),
um Codex' natives `default_tools_approval_mode` für einen vertrauenswürdigen Server auszugeben.
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

- `list` sortiert Servernamen.
- `show` gibt ohne Namen das vollständige konfigurierte MCP-Serverobjekt aus.
- `status` klassifiziert konfigurierte Transporte, ohne eine Verbindung herzustellen. `--verbose` enthält Details zum aufgelösten Start, zu Zeitlimits, OAuth, Filtern und parallelen Aufrufen.
- `doctor` führt statische Prüfungen durch, ohne eine Verbindung herzustellen. Fügen Sie `--probe` hinzu, wenn der Befehl außerdem überprüfen soll, ob aktivierte Server eine Verbindung herstellen können.
- `probe` stellt eine Verbindung her und meldet die Anzahl der Tools, die Unterstützung für Ressourcen/Prompts und Listenänderungen sowie Diagnosen.
- `add` akzeptiert stdio-Flags wie `--command`, `--arg`, `--env` und `--cwd` oder HTTP-Flags wie `--url`, `--transport`, `--header`, `--auth oauth` sowie Flags für TLS, Zeitlimits und die Tool-Auswahl.
- `set` erwartet einen einzelnen JSON-Objektwert in der Befehlszeile.
- `configure` aktualisiert Aktivierung, Tool-Filter, Zeitlimits, OAuth, TLS und Hinweise zu parallelen Tool-Aufrufen, ohne die gesamte Serverdefinition zu ersetzen. Fügen Sie `--probe` hinzu, um den aktualisierten Server vor dem Speichern zu überprüfen.
- `tools` aktualisiert serverspezifische Tool-Filter. Ein-/Ausschlusseinträge sind MCP-Tool-Namen und einfache `*`-Globs.
- `login` führt den OAuth-Ablauf für HTTP-Server aus, die mit `auth: "oauth"` konfiguriert sind. Beim ersten Durchlauf wird eine Autorisierungs-URL ausgegeben; führen Sie den Befehl nach der Genehmigung erneut mit `--code` aus.
- `logout` löscht gespeicherte OAuth-Anmeldedaten für den benannten Server, ohne die gespeicherte Serverdefinition zu entfernen.
- `reload` verwirft zwischengespeicherte prozessinterne MCP-Laufzeitumgebungen ausschließlich für den aktuellen CLI-Prozess. Gateway- oder Agent-Prozesse in einem anderen Prozess benötigen weiterhin ihren eigenen Neulade- oder Neustartpfad.
- Verwenden Sie `transport: "streamable-http"` für Streamable-HTTP-MCP-Server. `openclaw mcp set` normalisiert zur Kompatibilität außerdem das CLI-native `type: "http"` in dieselbe kanonische Konfigurationsform.
- `unset` schlägt fehl, wenn der benannte Server nicht vorhanden ist.

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

### Gängige Serverrezepte

Diese Beispiele speichern nur Serverdefinitionen. Führen Sie anschließend `openclaw mcp doctor --probe` aus, um nachzuweisen, dass der Server startet und Tools bereitstellt.

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

    Beschränken Sie Dateisystemserver auf den kleinsten Verzeichnisbaum, den der Agent lesen oder bearbeiten soll.

  </Tab>
  <Tab title="Speicher">
    ```bash
    openclaw mcp add memory \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-memory
    openclaw mcp probe memory --json
    ```

    Verwenden Sie einen Toolfilter, wenn der Server Schreib-Tools bereitstellt, die normalen Agenten nicht zur Verfügung stehen sollen.

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

    Verwenden Sie OAuth, wenn der Remote-Server es unterstützt. Wenn der Server statische Header benötigt, sollten Sie keine literalen Bearer-Token committen.

  </Tab>
  <Tab title="Desktop/CUA">
    ```bash
    openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
    openclaw mcp tools cua-driver --include 'list_apps,observe,click,type'
    openclaw mcp doctor cua-driver --probe
    ```

    Server zur direkten Desktop-Steuerung übernehmen die Berechtigungen des von ihnen gestarteten Prozesses. Verwenden Sie eng gefasste Toolfilter und Berechtigungsabfragen des Betriebssystems.

  </Tab>
</Tabs>

### JSON-Ausgabeformate

Verwenden Sie `--json` für Skripte und Dashboards. Feldgruppen können mit der Zeit erweitert werden, daher sollten Konsumenten unbekannte Schlüssel ignorieren.

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

    `doctor --json` wird mit einem Exit-Code ungleich null beendet, wenn bei einem aktivierten und geprüften Server ein Problem der Stufe `error` vorliegt. Probleme der Stufen `warning` und `info` werden gemeldet, führen für sich allein jedoch nicht zum Fehlschlagen des Befehls.

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

    `probe --json` öffnet eine aktive MCP-Clientsitzung und gibt ihr Ergebnis direkt aus; anders als bei `status`/`doctor` enthält die Ausgabe kein übergeordnetes Feld `path`. Die Schlüssel `resources` und `prompts` sind nur vorhanden, wenn der Server die jeweilige Fähigkeit tatsächlich ankündigt (ein Server ohne Prompts lässt den Schlüssel `prompts` weg, statt `false` zu melden). Verwenden Sie `probe` zum Nachweis der Erreichbarkeit und Fähigkeiten, nicht für statische Konfigurationsprüfungen.

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

Startet einen lokalen untergeordneten Prozess und kommuniziert über stdin/stdout.

| Feld                       | Beschreibung                              |
| -------------------------- | ----------------------------------------- |
| `command`                  | Zu startende ausführbare Datei (erforderlich) |
| `args`                     | Array mit Befehlszeilenargumenten         |
| `env`                      | Zusätzliche Umgebungsvariablen            |
| `cwd` / `workingDirectory` | Arbeitsverzeichnis für den Prozess        |

<Warning>
**Sicherheitsfilter für Stdio-Umgebungsvariablen**

OpenClaw weist Umgebungsvariablenschlüssel für den Interpreterstart, Loader-Manipulationen und Shell-Initialisierung zurück, bevor ein Stdio-MCP-Server gestartet wird, selbst wenn sie im Block `env` eines Servers vorkommen. Dabei gilt dieselbe Sicherheitsrichtlinie für die Hostumgebung wie für andere von OpenClaw gestartete Prozesse: Bekannte Hooks für den Interpreterstart (zum Beispiel `NODE_OPTIONS`, `PYTHONSTARTUP`, `PERL5OPT`, `RUBYOPT`, `BASHOPTS`, `KSH_ENV`), Präfixe zur Einschleusung gemeinsam genutzter Bibliotheken und Funktionen (`DYLD_*`, `LD_*`, `BASH_FUNC_*`) sowie ähnliche Variablen zur Laufzeitsteuerung werden blockiert. Beim Start werden diese stillschweigend entfernt und eine Warnung wird protokolliert, damit sie weder einen impliziten Vorspann einschleusen noch den Interpreter austauschen, einen Debugger aktivieren oder den dynamischen Linker des Stdio-Prozesses manipulieren können. Eine explizite Positivliste stellt sicher, dass gewöhnliche MCP-Umgebungsvariablen für Anmeldedaten weiterhin verwendet werden können (`GITHUB_TOKEN`, `GH_TOKEN`, `GITLAB_TOKEN`, `NPM_TOKEN`, `NODE_AUTH_TOKEN`, `DATABASE_URL`, `MONGODB_URI`, `REDIS_URL`, `AMQP_URL`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`); dies gilt auch für gewöhnliche Proxy- und serverspezifische Umgebungsvariablen (`HTTP_PROXY`, benutzerdefinierte `*_API_KEY` usw.). Andere Schlüssel in `AWS_*`, etwa `AWS_CONFIG_FILE` und `AWS_SHARED_CREDENTIALS_FILE`, bleiben blockiert, weil sie auf Dateien mit Anmeldedaten verweisen, statt den Wert der Anmeldedaten direkt zu enthalten.

Wenn Ihr MCP-Server tatsächlich eine der blockierten Variablen benötigt, legen Sie sie für den Gateway-Hostprozess fest und nicht unter `env` des Stdio-Servers.
</Warning>

### SSE-/HTTP-Transport

Stellt über HTTP Server-Sent Events eine Verbindung zu einem Remote-MCP-Server her.

| Feld                           | Beschreibung                                                                  |
| ------------------------------ | ----------------------------------------------------------------------------- |
| `url`                          | HTTP- oder HTTPS-URL des Remote-Servers (erforderlich)                        |
| `headers`                      | Optionale Schlüssel-Wert-Zuordnung von HTTP-Headern (zum Beispiel Auth-Token) |
| `connectionTimeoutMs`          | Verbindungstimeout pro Server in ms (optional)                                |
| `connectTimeout`               | Verbindungstimeout pro Server in Sekunden (optional)                          |
| `timeout` / `requestTimeoutMs` | MCP-Anfragetimeout pro Server in Sekunden oder ms                             |
| `auth: "oauth"`                | Von `openclaw mcp login` gespeicherte MCP-OAuth-Anmeldedaten verwenden          |
| `sslVerify`                    | Nur für ausdrücklich vertrauenswürdige private HTTPS-Endpunkte auf false setzen |
| `clientCert` / `clientKey`     | Pfade zu mTLS-Clientzertifikat und -schlüssel                                 |
| `supportsParallelToolCalls`    | Hinweis, dass gleichzeitige Aufrufe für diesen Server sicher sind             |

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

Sensible Werte in `url` (Benutzerinformationen) und `headers` werden in Protokollen und Statusausgaben geschwärzt. `openclaw mcp doctor` warnt, wenn sensibel wirkende Einträge in `headers` oder `env` literale Werte enthalten, damit Betreiber diese Werte aus der committeten Konfiguration entfernen können.

### OAuth-Ablauf

OAuth ist für HTTP-MCP-Server vorgesehen, die den MCP-OAuth-Ablauf ankündigen. Statische `Authorization`-Header werden für einen Server ignoriert, solange `auth: "oauth"` aktiviert ist. Von `openclaw mcp login` gespeicherte Anmeldedaten funktionieren mit eingebettetem MCP, CLI-Runnern und dem lokalen Codex-App-Server.

Bis Anmeldedaten verfügbar sind, lässt OpenClaw nur diesen MCP-Server aus der Agentenlaufzeit weg, anstatt den Agentendurchlauf fehlschlagen zu lassen. Der Betreiber oder ein Agent mit Shell-Zugriff kann anschließend `openclaw mcp login <name>` ausführen und den Server in einem späteren Durchlauf verwenden.

Wenn ein Remote-MCP-Dienst bereits durch ein separates, aktualisierungsfähiges OpenClaw-Authentifizierungsprofil unterstützt wird, können Sie optional `oauth.authProfileId` festlegen. OpenClaw aktualisiert vor der Laufzeitprojektion eine der beiden Anmeldedatenquellen und übergibt nur das aktuelle Zugriffstoken an den nachgelagerten MCP-Client.

<Steps>
  <Step title="Server speichern">
    Fügen Sie den Server mit `auth: "oauth"` hinzu oder aktualisieren Sie ihn und geben Sie gegebenenfalls optionale OAuth-Metadaten an.

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"scope":"docs.read"}}'
    ```

    Speichern Sie für einen durch ein Authentifizierungsprofil bereitgestellten Bearer-Token die Profilbindung:

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"authProfileId":"docs:mcp"}}'
    ```

  </Step>
  <Step title="Anmeldung starten">
    Führen Sie den Anmeldebefehl aus, um die Autorisierungsanfrage zu erstellen.

    ```bash
    openclaw mcp login docs
    ```

    OpenClaw gibt die Autorisierungs-URL aus und speichert den temporären OAuth-Verifizierungsstatus im OpenClaw-Statusverzeichnis.

  </Step>
  <Step title="Mit dem Code abschließen">
    Übergeben Sie nach der Genehmigung im Browser den zurückgegebenen Code wieder an OpenClaw.

    ```bash
    openclaw mcp login docs --code abc123
    ```

  </Step>
  <Step title="Autorisierung prüfen">
    Verwenden Sie status oder doctor, um zu bestätigen, dass Tokens vorhanden sind.

    ```bash
    openclaw mcp status --verbose
    openclaw mcp doctor docs --probe
    ```

  </Step>
  <Step title="Anmeldedaten löschen">
    Logout entfernt gespeicherte OAuth-Anmeldedaten, behält jedoch die gespeicherte Serverdefinition bei.

    ```bash
    openclaw mcp logout docs
    ```

  </Step>
</Steps>

Wenn der Provider Tokens rotiert oder der Autorisierungsstatus hängen bleibt, führen Sie `openclaw mcp logout <name>` aus und wiederholen Sie anschließend `login`. `logout` kann Anmeldedaten für einen gespeicherten HTTP-Server auch dann löschen, nachdem `auth: "oauth"` aus der Konfiguration entfernt wurde, solange Servername und URL den Eintrag im Anmeldedatenspeicher weiterhin identifizieren.

### Streamable-HTTP-Transport

`streamable-http` ist neben `sse` und `stdio` eine zusätzliche Transportoption. Sie verwendet HTTP-Streaming für die bidirektionale Kommunikation mit entfernten MCP-Servern.

| Feld                           | Beschreibung                                                                           |
| ------------------------------ | -------------------------------------------------------------------------------------- |
| `url`                          | HTTP- oder HTTPS-URL des entfernten Servers (erforderlich)                             |
| `transport`                    | Auf `"streamable-http"` setzen, um diesen Transport auszuwählen; wenn nicht angegeben, verwendet OpenClaw `sse` |
| `headers`                      | Optionale Schlüssel-Wert-Zuordnung von HTTP-Headern (zum Beispiel Authentifizierungstokens) |
| `connectionTimeoutMs`          | Verbindungs-Timeout pro Server in ms (optional)                                        |
| `connectTimeout`               | Verbindungs-Timeout pro Server in Sekunden (optional)                                  |
| `timeout` / `requestTimeoutMs` | Timeout für MCP-Anfragen pro Server in Sekunden oder ms                                |
| `auth: "oauth"`                | Von `openclaw mcp login` gespeicherte MCP-OAuth-Anmeldedaten verwenden                 |
| `sslVerify`                    | Nur für ausdrücklich vertrauenswürdige private HTTPS-Endpunkte auf false setzen        |
| `clientCert` / `clientKey`     | Pfade zu mTLS-Clientzertifikat und -schlüssel                                          |
| `supportsParallelToolCalls`    | Hinweis, dass gleichzeitige Aufrufe für diesen Server sicher sind                      |

Die OpenClaw-Konfiguration verwendet `transport: "streamable-http"` als kanonische Schreibweise. CLI-native MCP-Werte für `type: "http"` werden akzeptiert, wenn sie über `openclaw mcp set` gespeichert werden, und in bestehenden Konfigurationen durch `openclaw doctor --fix` korrigiert; direkt vom eingebetteten OpenClaw wird jedoch `transport` verwendet.

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
Registrierungsbefehle starten die Channel-Bridge nicht. Nur `probe` und `doctor --probe` öffnen eine aktive MCP-Client-Sitzung, um nachzuweisen, dass der Zielserver erreichbar ist.
</Note>

## Control UI

Die browserbasierte Control UI enthält unter `/settings/mcp` eine eigene MCP-Einstellungsseite; der bisherige Pfad `/mcp` bleibt als Alias erhalten. Die Seite zeigt die Anzahl konfigurierter Server, Zusammenfassungen zu Aktivierung, OAuth und Filtern, Transportzeilen pro Server, Steuerelemente zum Aktivieren und Deaktivieren, häufig verwendete CLI-Befehle sowie einen auf den Konfigurationsabschnitt `mcp` beschränkten Editor.

Verwenden Sie die Seite für Änderungen durch Betreiber und eine schnelle Bestandsübersicht. Verwenden Sie `openclaw mcp doctor --probe` oder `openclaw mcp probe`, wenn Sie einen Live-Nachweis für den Server benötigen.

Betreiber-Workflow:

1. Öffnen Sie die Control UI und wählen Sie **MCP**.
2. Prüfen Sie die Übersichtskarten für alle, aktivierte, OAuth- und gefilterte Server.
3. Nutzen Sie jede Serverzeile für Hinweise zu Transport, Authentifizierung, Filtern, Timeout und Befehlen.
4. Schalten Sie die Aktivierung um, wenn Sie eine Definition beibehalten, aber von der Laufzeiterkennung ausschließen möchten.
5. Bearbeiten Sie den abgegrenzten Konfigurationsabschnitt `mcp` für strukturelle Änderungen wie neue Server, Header, TLS, OAuth-Metadaten oder Tool-Filter.
6. Wählen Sie **Speichern**, um nur die Konfiguration zu speichern, oder **Speichern und veröffentlichen**, um sie über den Gateway-Konfigurationspfad anzuwenden.
7. Führen Sie `openclaw mcp doctor --probe` aus, wenn Sie einen Live-Nachweis benötigen, dass der bearbeitete Server startet und Tools auflistet.

Hinweise:

- Befehlsausschnitte setzen Servernamen in Anführungszeichen, damit ungewöhnliche Namen in einer Shell kopierbar bleiben
- angezeigte URL-ähnliche Werte werden vor dem Rendern geschwärzt, wenn sie eingebettete Anmeldedaten enthalten
- die Seite startet MCP-Transporte nicht selbst
- aktive Laufzeiten benötigen möglicherweise `openclaw mcp reload`, eine Veröffentlichung der Gateway-Konfiguration oder einen Prozessneustart, je nachdem, welcher Prozess die MCP-Clients besitzt

## MCP Apps

OpenClaw kann Tools rendern, die die stabile [MCP-Apps-Erweiterung](https://modelcontextprotocol.io/extensions/apps) implementieren. Apps müssen explizit aktiviert werden, da ihr HTML vom konfigurierten MCP-Server stammt und für Apps sichtbare Tools oder Ressourcen von demselben Server anfordern kann.

Aktivieren Sie die Host-Bridge:

```bash
openclaw config set mcp.apps.enabled true --strict-json
```

Starten Sie den Gateway nach Änderung dieser Einstellung neu. Wenn die Funktion aktiviert ist, startet OpenClaw einen ausschließlich für die Sandbox bestimmten HTTP(S)-Listener auf dem Gateway-Port plus eins (beim standardmäßigen Gateway `18790`). Die Control UI lädt Apps von diesem separaten Ursprung; der Listener stellt niemals die Control UI, authentifizierte Gateway-Routen oder Benutzerdaten bereit.

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

Der Sandbox-Ursprung muss sich vom Ursprung der Control UI unterscheiden. Stellen Sie dort keine anderen authentifizierten oder sensiblen Inhalte bereit.

Die offizielle einfache React-Demo kann beispielsweise folgendermaßen konfiguriert werden:

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
- Nur Ressourcen vom Typ `ui://` mit dem exakten MIME-Typ `text/html;profile=mcp-app` werden gerendert.
- UI-Ressourcen sind auf 2 MiB begrenzt, werden hinter einem doppelten Iframe-Proxy auf einem dedizierten äußeren Ursprung platziert, in einen undurchsichtigen inneren App-Ursprung geladen und durch eine aus den Ressourcenmetadaten abgeleitete CSP eingeschränkt.
- Ausschließlich für Apps bestimmte Tools (`_meta.ui.visibility: ["app"]`) bleiben aus den Tool-Listen des Modells ausgeschlossen. Apps können nur für Apps sichtbare Tools auf ihrem zugehörigen Server aufrufen, die außerdem die wirksame OpenClaw-Tool-Richtlinie für den Lauf erfüllen, der die Ansicht erstellt hat.
- An den Ursprung gebundene App-Berechtigungen wie Kamera, Mikrofon und Geolokalisierung werden nicht erteilt, solange innere App-Dokumente für die App-übergreifende Isolation undurchsichtige Ursprünge verwenden.
- App-HTML, vollständige Tool-Argumente und Rohergebnisse verbleiben in einer begrenzten zehnminütigen In-Memory-Ansichtslease und werden weder auf die Festplatte geschrieben noch in Vorschau-Metadaten des Transkripts kopiert. Das Transkript speichert nur einen begrenzten Server-, Tool- und Ressourcendeskriptor, der mit der ursprünglichen Tool-Aufruf-ID verknüpft ist. Nach einem Gateway-Neustart kann die Control UI diesen Deskriptor anhand des authentifizierten Sitzungstranskripts überprüfen und die Ressource `ui://` erneut abrufen; rekonstruierte Ansichten sind schreibgeschützt, bis ein neuer Lauf die aktuellen Tool-Berechtigungen festlegt.
- `openclaw security audit` zeigt eine Warnung an, solange die Bridge aktiviert ist. Deaktivieren Sie sie mit `openclaw config set mcp.apps.enabled false --strict-json`, wenn sie nicht benötigt wird.

## Aktuelle Einschränkungen

Diese Seite dokumentiert die Bridge in ihrem heutigen Auslieferungszustand.

Aktuelle Einschränkungen:

- die Konversationserkennung hängt von vorhandenen Routenmetadaten der Gateway-Sitzung ab
- kein generisches Push-Protokoll über den Claude-spezifischen Adapter hinaus
- noch keine Tools zum Bearbeiten von Nachrichten oder für Reaktionen
- der HTTP-/SSE-/Streamable-HTTP-Transport stellt eine Verbindung zu einem einzelnen entfernten Server her; noch kein gemultiplexter Upstream
- `permissions_list_open` enthält nur Genehmigungen, die beobachtet wurden, während die Bridge verbunden war

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Plugins](/de/cli/plugins)
