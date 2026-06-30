---
read_when:
    - Codex, Claude Code oder einen anderen MCP-Client mit OpenClaw-gestützten Kanälen verbinden
    - Wird ausgeführt `openclaw mcp serve`
    - OpenClaw-gespeicherte MCP-Serverdefinitionen verwalten
sidebarTitle: MCP
summary: OpenClaw-Kanalunterhaltungen über MCP bereitstellen und gespeicherte MCP-Serverdefinitionen verwalten
title: MCP
x-i18n:
    generated_at: "2026-06-30T22:13:02Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e979654cb17f5cb25b936039f9e4690ecfda41bc58ae073426a9e42978fa85dc
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` hat zwei Aufgaben:

- OpenClaw als MCP-Server mit `openclaw mcp serve` ausführen
- von OpenClaw verwaltete Definitionen ausgehender MCP-Server mit `list`, `show`, `status`, `doctor`, `probe`, `add`, `set`, `configure`, `tools`, `login`, `logout`, `reload` und `unset` verwalten

Anders gesagt:

- `serve` ist OpenClaw, das als MCP-Server agiert
- die anderen Unterbefehle sind OpenClaw, das als clientseitige MCP-Registry für MCP-Server agiert, die seine Laufzeiten später verwenden können

<Note>
  `list`, `show`, `set` und `unset` lesen und schreiben nur von OpenClaw verwaltete `mcp.servers`-Einträge in der OpenClaw-Konfiguration. Sie enthalten keine mcporter-Server aus `config/mcporter.json`; verwenden Sie `mcporter list` für diese Registry.
</Note>

Verwenden Sie [`openclaw acp`](/de/cli/acp), wenn OpenClaw selbst eine Coding-Harness-Sitzung hosten und diese Laufzeit über ACP weiterleiten soll.

## Den richtigen MCP-Pfad wählen

OpenClaw hat mehrere MCP-Oberflächen. Wählen Sie diejenige, die dazu passt, wer die Agent-Laufzeit besitzt und wer die Tools besitzt.

| Ziel                                                                | Verwenden                                                            | Warum                                                                                                           |
| ------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Einem externen MCP-Client das Lesen/Senden von OpenClaw-Kanalunterhaltungen ermöglichen | `openclaw mcp serve`                                                 | OpenClaw ist der MCP-Server und stellt Gateway-gestützte Unterhaltungen über stdio bereit.                      |
| Drittanbieter-MCP-Server für von OpenClaw verwaltete Agent-Läufe speichern | `openclaw mcp add`, `set`, `configure`, `tools`, `login`             | OpenClaw ist die clientseitige MCP-Registry und projiziert diese Server später in geeignete Laufzeiten.         |
| Einen gespeicherten Server prüfen, ohne einen Agent-Turn auszuführen | `openclaw mcp status`, `doctor`, `probe`                             | `status` und `doctor` prüfen die Konfiguration; `probe` öffnet eine Live-MCP-Verbindung und listet Fähigkeiten auf. |
| MCP-Konfiguration im Browser bearbeiten                             | Control UI `/mcp`                                                    | Die Seite zeigt Inventar, Aktivierung, OAuth-/Filterzusammenfassungen, Befehlshinweise und einen bereichsbezogenen `mcp`-Editor. |
| Codex app-server einen bereichsbezogenen nativen MCP-Server geben    | `mcp.servers.<name>.codex`                                           | Der `codex`-Block wirkt sich nur auf die Thread-Projektion des Codex app-server aus und wird vor der nativen Konfigurationsübergabe entfernt. |
| ACP-gehostete Harness-Sitzungen ausführen                           | [`openclaw acp`](/de/cli/acp) und [ACP Agents](/de/tools/acp-agents-setup) | Der ACP-Bridge-Modus akzeptiert keine MCP-Server-Injektion pro Sitzung; konfigurieren Sie stattdessen Gateway-/Plugin-Bridges. |

<Tip>
Wenn Sie nicht sicher sind, welchen Pfad Sie benötigen, beginnen Sie mit `openclaw mcp status --verbose`. Das zeigt, was OpenClaw gespeichert hat, ohne MCP-Server zu starten.
</Tip>

## OpenClaw als MCP-Server

Dies ist der Pfad `openclaw mcp serve`.

### Wann Sie `serve` verwenden sollten

Verwenden Sie `openclaw mcp serve`, wenn:

- Codex, Claude Code oder ein anderer MCP-Client direkt mit OpenClaw-gestützten Kanalunterhaltungen sprechen soll
- Sie bereits ein lokales oder entferntes OpenClaw Gateway mit weitergeleiteten Sitzungen haben
- Sie einen MCP-Server möchten, der über die Kanal-Backends von OpenClaw hinweg funktioniert, statt separate Bridges pro Kanal auszuführen

Verwenden Sie stattdessen [`openclaw acp`](/de/cli/acp), wenn OpenClaw die Coding-Laufzeit selbst hosten und die Agent-Sitzung innerhalb von OpenClaw behalten soll.

### Funktionsweise

`openclaw mcp serve` startet einen stdio-MCP-Server. Der MCP-Client besitzt diesen Prozess. Solange der Client die stdio-Sitzung offen hält, verbindet sich die Bridge über WebSocket mit einem lokalen oder entfernten OpenClaw Gateway und stellt weitergeleitete Kanalunterhaltungen über MCP bereit.

<Steps>
  <Step title="Client spawns the bridge">
    Der MCP-Client startet `openclaw mcp serve`.
  </Step>
  <Step title="Bridge connects to Gateway">
    Die Bridge verbindet sich über WebSocket mit dem OpenClaw Gateway.
  </Step>
  <Step title="Sessions become MCP conversations">
    Weitergeleitete Sitzungen werden zu MCP-Unterhaltungen und Transkript-/Verlaufstools.
  </Step>
  <Step title="Live events queue">
    Live-Ereignisse werden im Speicher in eine Warteschlange gestellt, während die Bridge verbunden ist.
  </Step>
  <Step title="Optional Claude push">
    Wenn der Claude-Kanalmodus aktiviert ist, kann dieselbe Sitzung auch Claude-spezifische Push-Benachrichtigungen empfangen.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Important behavior">
    - der Live-Warteschlangenstatus beginnt, wenn die Bridge eine Verbindung herstellt
    - ältere Transkriptverläufe werden mit `messages_read` gelesen
    - Claude-Push-Benachrichtigungen existieren nur, solange die MCP-Sitzung aktiv ist
    - wenn der Client die Verbindung trennt, beendet sich die Bridge und die Live-Warteschlange ist weg
    - einmalige Agent-Einstiegspunkte wie `openclaw agent` und `openclaw infer model run` beenden alle gebündelten MCP-Laufzeiten, die sie öffnen, sobald die Antwort abgeschlossen ist, sodass wiederholte geskriptete Läufe keine stdio-MCP-Kindprozesse ansammeln
    - von OpenClaw gestartete stdio-MCP-Server (gebündelt oder benutzerkonfiguriert) werden beim Herunterfahren als Prozessbaum beendet, sodass vom Server gestartete Kind-Unterprozesse nach dem Beenden des übergeordneten stdio-Clients nicht weiterlaufen
    - das Löschen oder Zurücksetzen einer Sitzung entsorgt die MCP-Clients dieser Sitzung über den gemeinsamen Laufzeit-Bereinigungspfad, sodass keine verbleibenden stdio-Verbindungen an eine entfernte Sitzung gebunden bleiben

  </Accordion>
</AccordionGroup>

### Einen Client-Modus wählen

Verwenden Sie dieselbe Bridge auf zwei verschiedene Arten:

<Tabs>
  <Tab title="Generic MCP clients">
    Nur Standard-MCP-Tools. Verwenden Sie `conversations_list`, `messages_read`, `events_poll`, `events_wait`, `messages_send` und die Genehmigungstools.
  </Tab>
  <Tab title="Claude Code">
    Standard-MCP-Tools plus der Claude-spezifische Kanaladapter. Aktivieren Sie `--claude-channel-mode on` oder belassen Sie die Standardeinstellung `auto`.
  </Tab>
</Tabs>

<Note>
Heute verhält sich `auto` genauso wie `on`. Es gibt noch keine Client-Fähigkeitserkennung.
</Note>

### Was `serve` bereitstellt

Die Bridge verwendet vorhandene Gateway-Sitzungsroutenmetadaten, um kanalgestützte Unterhaltungen bereitzustellen. Eine Unterhaltung erscheint, wenn OpenClaw bereits Sitzungsstatus mit einer bekannten Route hat, wie etwa:

- `channel`
- Empfänger- oder Zielmetadaten
- optional `accountId`
- optional `threadId`

Dadurch erhalten MCP-Clients einen Ort, um:

- zuletzt weitergeleitete Unterhaltungen aufzulisten
- aktuellen Transkriptverlauf zu lesen
- auf neue eingehende Ereignisse zu warten
- eine Antwort über dieselbe Route zurückzusenden
- Genehmigungsanfragen zu sehen, die eintreffen, während die Bridge verbunden ist

### Verwendung

<Tabs>
  <Tab title="Local Gateway">
    ```bash
    openclaw mcp serve
    ```
  </Tab>
  <Tab title="Remote Gateway (token)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
    ```
  </Tab>
  <Tab title="Remote Gateway (password)">
    ```bash
    openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password
    ```
  </Tab>
  <Tab title="Verbose / Claude off">
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
    Listet aktuelle sitzungsgestützte Unterhaltungen auf, die bereits Routenmetadaten im Gateway-Sitzungsstatus haben.

    Nützliche Filter:

    - `limit`
    - `search`
    - `channel`
    - `includeDerivedTitles`
    - `includeLastMessage`

  </Accordion>
  <Accordion title="conversation_get">
    Gibt eine Unterhaltung anhand von `session_key` über eine direkte Gateway-Sitzungssuche zurück.
  </Accordion>
  <Accordion title="messages_read">
    Liest aktuelle Transkriptnachrichten für eine sitzungsgestützte Unterhaltung.
  </Accordion>
  <Accordion title="attachments_fetch">
    Extrahiert nicht-textuelle Nachrichteninhaltsblöcke aus einer Transkriptnachricht. Dies ist eine Metadatenansicht über Transkriptinhalte, kein eigenständiger dauerhafter Blob-Speicher für Anhänge.
  </Accordion>
  <Accordion title="events_poll">
    Liest seit einem numerischen Cursor eingereihte Live-Ereignisse.
  </Accordion>
  <Accordion title="events_wait">
    Führt Long-Polling aus, bis das nächste passende eingereihte Ereignis eintrifft oder ein Timeout abläuft.

    Verwenden Sie dies, wenn ein generischer MCP-Client nahezu Echtzeit-Zustellung ohne Claude-spezifisches Push-Protokoll benötigt.

  </Accordion>
  <Accordion title="messages_send">
    Sendet Text über dieselbe Route zurück, die bereits in der Sitzung aufgezeichnet ist.

    Aktuelles Verhalten:

    - erfordert eine vorhandene Unterhaltungsroute
    - verwendet Kanal, Empfänger, Konto-ID und Thread-ID der Sitzung
    - sendet nur Text

  </Accordion>
  <Accordion title="permissions_list_open">
    Listet ausstehende exec-/Plugin-Genehmigungsanfragen auf, die die Bridge seit ihrer Verbindung mit dem Gateway beobachtet hat.
  </Accordion>
  <Accordion title="permissions_respond">
    Löst eine ausstehende exec-/Plugin-Genehmigungsanfrage auf mit:

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### Ereignismodell

Die Bridge hält eine Ereigniswarteschlange im Speicher, solange sie verbunden ist.

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
- dauerhafter Rückstand sollte mit `messages_read` gelesen werden

</Warning>

### Claude-Kanalbenachrichtigungen

Die Bridge kann auch Claude-spezifische Kanalbenachrichtigungen bereitstellen. Dies ist das OpenClaw-Äquivalent eines Claude Code-Kanaladapters: Standard-MCP-Tools bleiben verfügbar, aber eingehende Live-Nachrichten können auch als Claude-spezifische MCP-Benachrichtigungen eintreffen.

<Tabs>
  <Tab title="off">
    `--claude-channel-mode off`: nur Standard-MCP-Tools.
  </Tab>
  <Tab title="on">
    `--claude-channel-mode on`: Claude-Kanalbenachrichtigungen aktivieren.
  </Tab>
  <Tab title="auto (default)">
    `--claude-channel-mode auto`: aktuelle Standardeinstellung; dasselbe Bridge-Verhalten wie `on`.
  </Tab>
</Tabs>

Wenn der Claude-Kanalmodus aktiviert ist, kündigt der Server experimentelle Claude-Fähigkeiten an und kann Folgendes ausgeben:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Aktuelles Bridge-Verhalten:

- eingehende `user`-Transkriptnachrichten werden als `notifications/claude/channel` weitergeleitet
- über MCP empfangene Claude-Berechtigungsanfragen werden im Speicher verfolgt
- wenn der Befehlsinhaber in der verknüpften Unterhaltung später `yes abcde` oder `no abcde` sendet, wandelt die Bridge dies in `notifications/claude/channel/permission` um
- diese Benachrichtigungen gelten nur für Live-Sitzungen; wenn der MCP-Client die Verbindung trennt, gibt es kein Push-Ziel

Dies ist absichtlich clientspezifisch. Generische MCP-Clients sollten sich auf die Standard-Polling-Tools verlassen.

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

Für die meisten generischen MCP-Clients beginnen Sie mit der Standard-Tool-Oberfläche und ignorieren den Claude-Modus. Schalten Sie den Claude-Modus nur für Clients ein, die die Claude-spezifischen Benachrichtigungsmethoden tatsächlich verstehen.

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
Bevorzugen Sie nach Möglichkeit `--token-file` oder `--password-file` statt Inline-Secrets.
</Tip>

### Sicherheits- und Vertrauensgrenze

Die Bridge erfindet kein Routing. Sie macht nur Unterhaltungen verfügbar, die Gateway bereits routen kann.

Das bedeutet:

- Sender-Allowlists, Pairing und Vertrauen auf Kanalebene gehören weiterhin zur zugrunde liegenden OpenClaw-Kanalkonfiguration
- `messages_send` kann nur über eine vorhandene gespeicherte Route antworten
- der Genehmigungsstatus ist nur für die aktuelle Bridge-Sitzung live/im Speicher
- Bridge-Authentifizierung sollte dieselben Gateway-Token- oder Passwortkontrollen verwenden, denen Sie auch für jeden anderen Remote-Gateway-Client vertrauen würden

Wenn eine Unterhaltung in `conversations_list` fehlt, liegt die übliche Ursache nicht in der MCP-Konfiguration. Es fehlen Routenmetadaten in der zugrunde liegenden Gateway-Sitzung, oder sie sind unvollständig.

### Testen

OpenClaw liefert einen deterministischen Docker-Smoke-Test für diese Bridge:

```bash
pnpm test:docker:mcp-channels
```

Dieser Smoke-Test:

- startet einen Gateway-Container mit Seed-Daten
- startet einen zweiten Container, der `openclaw mcp serve` erzeugt
- verifiziert Unterhaltungserkennung, Lesen von Transkripten, Lesen von Anhangsmetadaten, Verhalten der Live-Event-Queue und Routing ausgehender Sendungen
- validiert Claude-artige Kanal- und Berechtigungsbenachrichtigungen über die echte stdio-MCP-Bridge

Dies ist der schnellste Weg, um nachzuweisen, dass die Bridge funktioniert, ohne ein echtes Telegram-, Discord- oder iMessage-Konto in den Testlauf einzubinden.

Weiteren Testkontext finden Sie unter [Testen](/de/help/testing).

### Fehlerbehebung

<AccordionGroup>
  <Accordion title="Keine Unterhaltungen zurückgegeben">
    Bedeutet in der Regel, dass die Gateway-Sitzung noch nicht routbar ist. Bestätigen Sie, dass die zugrunde liegende Sitzung gespeicherte Kanal-/Provider-, Empfänger- und optionale Konto-/Thread-Routenmetadaten enthält.
  </Accordion>
  <Accordion title="events_poll oder events_wait verpasst ältere Nachrichten">
    Erwartet. Die Live-Queue beginnt, wenn die Bridge eine Verbindung herstellt. Lesen Sie ältere Transkriptverläufe mit `messages_read`.
  </Accordion>
  <Accordion title="Claude-Benachrichtigungen werden nicht angezeigt">
    Prüfen Sie all dies:

    - der Client hat die stdio-MCP-Sitzung offen gehalten
    - `--claude-channel-mode` ist `on` oder `auto`
    - der Client versteht tatsächlich die Claude-spezifischen Benachrichtigungsmethoden
    - die eingehende Nachricht ist nach dem Verbindungsaufbau der Bridge eingetroffen

  </Accordion>
  <Accordion title="Genehmigungen fehlen">
    `permissions_list_open` zeigt nur Genehmigungsanfragen, die beobachtet wurden, während die Bridge verbunden war. Es ist keine dauerhafte API für Genehmigungsverläufe.
  </Accordion>
</AccordionGroup>

## OpenClaw als MCP-Client-Registry

Dies ist der Pfad für `openclaw mcp list`, `show`, `status`, `doctor`, `probe`, `add`, `set`,
`configure`, `tools`, `login`, `logout`, `reload` und `unset`.

Diese Befehle stellen OpenClaw nicht über MCP bereit. Sie verwalten von OpenClaw verwaltete MCP-Serverdefinitionen unter `mcp.servers` in der OpenClaw-Konfiguration. Sie lesen keine mcporter-Server aus `config/mcporter.json`.

Diese gespeicherten Definitionen sind für Laufzeiten bestimmt, die OpenClaw später startet oder konfiguriert, etwa eingebettetes OpenClaw und andere Laufzeitadapter. OpenClaw speichert die Definitionen zentral, damit diese Laufzeiten keine eigenen doppelten MCP-Serverlisten pflegen müssen.

<AccordionGroup>
  <Accordion title="Wichtiges Verhalten">
    - diese Befehle lesen oder schreiben nur die OpenClaw-Konfiguration
    - `status`, `list`, `show`, `doctor` ohne `--probe`, `set`, `configure`, `tools`, `logout`, `reload` und `unset` verbinden sich nicht mit dem Ziel-MCP-Server
    - `login` führt den MCP-OAuth-Netzwerkfluss für den konfigurierten HTTP-Server aus und speichert die daraus resultierenden lokalen Zugangsdaten
    - `status --verbose` gibt aufgelösten Transport, Authentifizierung, Timeout, Filter und Hinweise zu parallelen Tool-Aufrufen aus, ohne eine Verbindung herzustellen
    - `doctor` prüft gespeicherte Definitionen auf lokale Einrichtungsprobleme wie fehlende stdio-Befehle, ungültige Arbeitsverzeichnisse, fehlende TLS-Dateien, deaktivierte Server, wörtliche sensible Header-/Env-Werte und unvollständige OAuth-Autorisierung
    - `doctor --probe` ergänzt nach bestandenen statischen Prüfungen denselben Live-Verbindungsnachweis wie `probe`
    - `probe` verbindet sich mit dem ausgewählten Server oder allen konfigurierten Servern, listet Tools auf und meldet Fähigkeiten/Diagnosen
    - `add` erstellt eine Definition aus Flags und prüft sie vor dem Speichern, sofern `--no-probe` nicht gesetzt ist oder zuerst eine OAuth-Autorisierung erforderlich ist
    - Laufzeitadapter entscheiden zur Ausführungszeit, welche Transportformen sie tatsächlich unterstützen
    - `enabled: false` hält einen Server gespeichert, schließt ihn aber aus der eingebetteten Laufzeiterkennung aus
    - `timeout` und `connectTimeout` legen pro Server Anfrage- und Verbindungstimeouts in Sekunden fest
    - `supportsParallelToolCalls: true` markiert Server, die Adapter gleichzeitig aufrufen können
    - HTTP-Server können statische Header, OAuth-Login, TLS-Verifikationssteuerung und mTLS-Zertifikat-/Schlüsselpfade verwenden
    - eingebettetes OpenClaw stellt konfigurierte MCP-Tools in den normalen Tool-Profilen `coding` und `messaging` bereit; `minimal` blendet sie weiterhin aus, und `tools.deny: ["bundle-mcp"]` deaktiviert sie explizit
    - `toolFilter.include` und `toolFilter.exclude` pro Server filtern erkannte MCP-Tools, bevor sie zu OpenClaw-Tools werden
    - Server, die Ressourcen oder Prompts ankündigen, stellen auch Hilfstools zum Auflisten/Lesen von Ressourcen und Auflisten/Abrufen von Prompts bereit; diese generierten Hilfsnamen (`resources_list`, `resources_read`, `prompts_list`, `prompts_get`) verwenden denselben Include-/Exclude-Filter
    - dynamische Änderungen der MCP-Tool-Liste invalidieren den zwischengespeicherten Katalog für diese Sitzung; die nächste Erkennung/Nutzung aktualisiert ihn vom Server
    - wiederholte MCP-Tool-Anfrage-/Protokollfehler pausieren diesen Server kurz, damit ein defekter Server nicht den gesamten Turn verbraucht
    - sitzungsbezogene gebündelte MCP-Laufzeiten werden nach `mcp.sessionIdleTtlMs` Millisekunden Leerlaufzeit abgeräumt (Standard 10 Minuten; setzen Sie `0`, um dies zu deaktivieren), und einmalige eingebettete Läufe bereinigen sie am Laufende

  </Accordion>
</AccordionGroup>

Laufzeitadapter können diese gemeinsame Registry in die Form normalisieren, die ihr nachgelagerter Client erwartet. Beispielsweise verwendet eingebettetes OpenClaw OpenClaw-`transport`-Werte direkt, während Claude Code und Gemini CLI-native `type`-Werte wie `http`, `sse` oder `stdio` erhalten.

Codex app-server berücksichtigt außerdem einen optionalen `codex`-Block auf jedem Server. Dies sind
OpenClaw-Projektionsmetadaten nur für Codex app-server-Threads; sie ändern keine
ACP-Sitzungen, generische Codex-Harness-Konfigurationen oder andere Laufzeitadapter.
Verwenden Sie nicht leere `codex.agents`, um einen Server nur in bestimmte OpenClaw-
Agent-IDs zu projizieren. Leere, blanke oder ungültige Agent-Listen werden von der Konfigurationsvalidierung
abgelehnt und vom Laufzeit-Projektionspfad ausgelassen, statt global zu werden.
Verwenden Sie `codex.defaultToolsApprovalMode` (`auto`, `prompt` oder `approve`),
um Codexs natives `default_tools_approval_mode` für einen vertrauenswürdigen Server auszugeben.
OpenClaw entfernt die `codex`-Metadaten, bevor es die native `mcp_servers`-
Konfiguration an Codex übergibt.

### Gespeicherte MCP-Serverdefinitionen

OpenClaw speichert außerdem eine leichtgewichtige MCP-Server-Registry in der Konfiguration für Oberflächen, die von OpenClaw verwaltete MCP-Definitionen verwenden möchten.

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
- `show` ohne Namen gibt das vollständig konfigurierte MCP-Serverobjekt aus.
- `status` klassifiziert konfigurierte Transporte, ohne eine Verbindung herzustellen. `--verbose` enthält aufgelöste Details zu Start, Timeout, OAuth, Filter und parallelen Aufrufen.
- `doctor` führt statische Prüfungen ohne Verbindungsaufbau durch. Fügen Sie `--probe` hinzu, wenn der Befehl auch verifizieren soll, dass aktivierte Server eine Verbindung herstellen.
- `probe` verbindet sich und meldet Tool-Anzahlen, Unterstützung für Ressourcen/Prompts, Unterstützung für Listenänderungen und Diagnosen.
- `add` akzeptiert stdio-Flags wie `--command`, `--arg`, `--env` und `--cwd` oder HTTP-Flags wie `--url`, `--transport`, `--header`, `--auth oauth`, TLS, Timeout und Tool-Auswahl-Flags.
- `set` erwartet einen JSON-Objektwert auf der Befehlszeile.
- `configure` aktualisiert Aktivierung, Tool-Filter, Timeouts, OAuth, TLS und Hinweise zu parallelen Tool-Aufrufen, ohne die gesamte Serverdefinition zu ersetzen.
- `tools` aktualisiert Tool-Filter pro Server. Include-/Exclude-Einträge sind MCP-Tool-Namen und einfache `*`-Globs.
- `login` führt den OAuth-Fluss für HTTP-Server aus, die mit `auth: "oauth"` konfiguriert sind. Der erste Lauf gibt eine Autorisierungs-URL aus; führen Sie ihn nach der Genehmigung erneut mit `--code` aus.
- `logout` löscht gespeicherte OAuth-Zugangsdaten für den benannten Server, ohne die gespeicherte Serverdefinition zu entfernen.
- `reload` verwirft zwischengespeicherte MCP-Laufzeiten im Prozess. Gateway- oder Agent-Prozesse in einem anderen Prozess benötigen weiterhin ihren eigenen Reload- oder Neustartpfad.
- Verwenden Sie `transport: "streamable-http"` für Streamable-HTTP-MCP-Server. `openclaw mcp set` normalisiert außerdem CLI-native `type: "http"` zur Kompatibilität in dieselbe kanonische Konfigurationsform.
- `unset` schlägt fehl, wenn der benannte Server nicht existiert.

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

    Begrenzen Sie Dateisystemserver auf den kleinsten Verzeichnisbaum, den der Agent lesen oder bearbeiten soll.

  </Tab>
  <Tab title="Speicher">
    ```bash
    openclaw mcp add memory \
      --command npx \
      --arg -y \
      --arg @modelcontextprotocol/server-memory
    openclaw mcp probe memory --json
    ```

    Verwenden Sie einen Tool-Filter, wenn der Server Schreibtools bereitstellt, die normalen Agenten nicht zur Verfügung stehen sollten.

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

    `doctor` prüft, dass `cwd` existiert und dass der Befehl aus der konfigurierten Umgebung aufgelöst wird.

  </Tab>
  <Tab title="Remote HTTP">
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

    Verwenden Sie OAuth, wenn der Remote-Server es unterstützt. Wenn der Server statische Header erfordert, vermeiden Sie es, wörtliche Bearer-Tokens zu committen.

  </Tab>
  <Tab title="Desktop/CUA">
    ```bash
    openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
    openclaw mcp tools cua-driver --include 'list_apps,observe,click,type'
    openclaw mcp doctor cua-driver --probe
    ```

    Server für direkte Desktop-Steuerung erben die Berechtigungen des Prozesses, den sie starten. Verwenden Sie enge Tool-Filter und Berechtigungsabfragen auf Betriebssystemebene.

  </Tab>
</Tabs>

### JSON-Ausgabeformen

Verwenden Sie `--json` für Skripte und Dashboards. Feldmengen können im Laufe der Zeit wachsen, daher sollten Verbraucher unbekannte Schlüssel ignorieren.

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
      "ok": false,
      "path": "/home/user/.openclaw/openclaw.json",
      "servers": [
        {
          "name": "docs",
          "ok": false,
          "issues": [
            {
              "level": "error",
              "message": "OAuth credentials are not authorized; run openclaw mcp login docs"
            }
          ]
        }
      ]
    }
    ```

    `doctor --json` wird mit einem Exit-Code ungleich null beendet, wenn ein aktivierter geprüfter Server einen Fehler hat. Warnungen werden gemeldet, lassen den Befehl für sich genommen aber nicht fehlschlagen.

  </Accordion>
  <Accordion title="probe --json">
    ```json
    {
      "path": "/home/user/.openclaw/openclaw.json",
      "generatedAt": "2026-05-31T09:00:00.000Z",
      "servers": {
        "docs": {
          "launch": "streamable-http https://mcp.example.com/mcp",
          "tools": 2,
          "resources": true,
          "prompts": false,
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

    `probe` öffnet eine Live-MCP-Client-Sitzung. Verwenden Sie es für Erreichbarkeits- und Funktionsnachweise, nicht für statische Konfigurationsprüfungen.

  </Accordion>
</AccordionGroup>

Beispiel-Konfigurationsform:

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

| Feld                       | Beschreibung                                    |
| -------------------------- | ----------------------------------------------- |
| `command`                  | Zu startende ausführbare Datei (erforderlich)   |
| `args`                     | Array von Befehlszeilenargumenten               |
| `env`                      | Zusätzliche Umgebungsvariablen                  |
| `cwd` / `workingDirectory` | Arbeitsverzeichnis für den Prozess              |

<Warning>
**Stdio-Env-Sicherheitsfilter**

OpenClaw lehnt Interpreter-Startup-Env-Schlüssel ab, die ändern können, wie ein stdio-MCP-Server vor dem ersten RPC startet, selbst wenn sie im `env`-Block eines Servers erscheinen. Blockierte Schlüssel umfassen `BASHOPTS`, `FPATH`, `KSH_ENV`, `NODE_OPTIONS`, `NODE_REDIRECT_WARNINGS`, `NODE_REPL_EXTERNAL_MODULE`, `NODE_REPL_HISTORY`, `NODE_V8_COVERAGE`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4`, `TCLLIBPATH` und ähnliche Runtime-Control-Variablen. Der Startup lehnt diese mit einem Konfigurationsfehler ab, damit sie kein implizites Prelude einschleusen, den Interpreter austauschen, einen Debugger aktivieren oder Runtime-Ausgaben gegen den stdio-Prozess umleiten können. Gewöhnliche Zugangsdaten-, Proxy- und serverspezifische Env-Variablen (`GITHUB_TOKEN`, `HTTP_PROXY`, benutzerdefinierte `*_API_KEY` usw.) sind nicht betroffen.

Wenn Ihr MCP-Server eine der blockierten Variablen wirklich benötigt, setzen Sie sie auf dem Gateway-Hostprozess statt unter `env` des stdio-Servers.
</Warning>

### SSE-/HTTP-Transport

Stellt über HTTP Server-Sent Events eine Verbindung zu einem Remote-MCP-Server her.

| Feld                           | Beschreibung                                                              |
| ------------------------------ | ------------------------------------------------------------------------- |
| `url`                          | HTTP- oder HTTPS-URL des Remote-Servers (erforderlich)                    |
| `headers`                      | Optionale Schlüssel-Wert-Zuordnung von HTTP-Headern (z. B. Auth-Tokens)   |
| `connectionTimeoutMs`          | Verbindungstimeout pro Server in ms (optional)                            |
| `connectTimeout`               | Verbindungstimeout pro Server in Sekunden (optional)                      |
| `timeout` / `requestTimeoutMs` | MCP-Request-Timeout pro Server in Sekunden oder ms                        |
| `auth: "oauth"`                | MCP-OAuth-Token-Speicherung und `openclaw mcp login` verwenden            |
| `sslVerify`                    | Nur für ausdrücklich vertrauenswürdige private HTTPS-Endpunkte auf false setzen |
| `clientCert` / `clientKey`     | Pfade für mTLS-Clientzertifikat und -Schlüssel                            |
| `supportsParallelToolCalls`    | Hinweis, dass gleichzeitige Aufrufe für diesen Server sicher sind         |

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

Vertrauliche Werte in `url` (userinfo) und `headers` werden in Logs und Statusausgaben geschwärzt. `openclaw mcp doctor` warnt, wenn vertraulich wirkende `headers`- oder `env`-Einträge wörtliche Werte enthalten, damit Operatoren diese Werte aus committeter Konfiguration entfernen können.

### OAuth-Workflow

OAuth ist für HTTP-MCP-Server vorgesehen, die den MCP-OAuth-Flow ankündigen. Statische `Authorization`-Header werden für einen Server ignoriert, solange `auth: "oauth"` aktiviert ist.

<Steps>
  <Step title="Server speichern">
    Fügen Sie den Server mit `auth: "oauth"` und optionalen OAuth-Metadaten hinzu oder aktualisieren Sie ihn.

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"scope":"docs.read"}}'
    ```

  </Step>
  <Step title="Anmeldung starten">
    Führen Sie login aus, um die Autorisierungsanforderung zu erstellen.

    ```bash
    openclaw mcp login docs
    ```

    OpenClaw gibt die Autorisierungs-URL aus und speichert temporären OAuth-Verifier-Zustand im OpenClaw-State-Verzeichnis.

  </Step>
  <Step title="Mit dem Code abschließen">
    Übergeben Sie den zurückgegebenen Code nach der Genehmigung im Browser wieder an OpenClaw.

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
  <Step title="Zugangsdaten löschen">
    Logout entfernt gespeicherte OAuth-Zugangsdaten, behält aber die gespeicherte Serverdefinition bei.

    ```bash
    openclaw mcp logout docs
    ```

  </Step>
</Steps>

Wenn der Provider Tokens rotiert oder der Autorisierungszustand hängen bleibt, führen Sie `openclaw mcp logout <name>` aus und wiederholen Sie dann `login`. `logout` kann Zugangsdaten für einen gespeicherten HTTP-Server löschen, selbst nachdem `auth: "oauth"` aus der Konfiguration entfernt wurde, solange Servername und URL den Eintrag im Zugangsdaten-Speicher weiterhin identifizieren.

### Streamable-HTTP-Transport

`streamable-http` ist eine zusätzliche Transportoption neben `sse` und `stdio`. Sie verwendet HTTP-Streaming für bidirektionale Kommunikation mit Remote-MCP-Servern.

| Feld                           | Beschreibung                                                                                  |
| ------------------------------ | --------------------------------------------------------------------------------------------- |
| `url`                          | HTTP- oder HTTPS-URL des Remote-Servers (erforderlich)                                        |
| `transport`                    | Auf `"streamable-http"` setzen, um diesen Transport auszuwählen; wenn weggelassen, verwendet OpenClaw `sse` |
| `headers`                      | Optionale Schlüssel-Wert-Zuordnung von HTTP-Headern (z. B. Auth-Tokens)                       |
| `connectionTimeoutMs`          | Verbindungstimeout pro Server in ms (optional)                                                |
| `connectTimeout`               | Verbindungstimeout pro Server in Sekunden (optional)                                          |
| `timeout` / `requestTimeoutMs` | MCP-Request-Timeout pro Server in Sekunden oder ms                                            |
| `auth: "oauth"`                | MCP-OAuth-Token-Speicherung und `openclaw mcp login` verwenden                                |
| `sslVerify`                    | Nur für ausdrücklich vertrauenswürdige private HTTPS-Endpunkte auf false setzen                |
| `clientCert` / `clientKey`     | Pfade für mTLS-Clientzertifikat und -Schlüssel                                                |
| `supportsParallelToolCalls`    | Hinweis, dass gleichzeitige Aufrufe für diesen Server sicher sind                             |

Die OpenClaw-Konfiguration verwendet `transport: "streamable-http"` als kanonische Schreibweise. CLI-native MCP-Werte `type: "http"` werden akzeptiert, wenn sie über `openclaw mcp set` gespeichert werden, und in bestehender Konfiguration durch `openclaw doctor --fix` repariert, aber `transport` ist das, was eingebettetes OpenClaw direkt verarbeitet.

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
Registry-Befehle starten die Channel-Bridge nicht. Nur `probe` und `doctor --probe` öffnen eine Live-MCP-Client-Sitzung, um nachzuweisen, dass der Zielserver erreichbar ist.
</Note>

## Control UI

Die Browser-Control-UI enthält eine eigene MCP-Einstellungsseite unter `/mcp`. Sie zeigt die Anzahl konfigurierter Server, Zusammenfassungen zu aktiviert/OAuth/Filtern, Transportzeilen pro Server, Steuerelemente zum Aktivieren/Deaktivieren, gängige CLI-Befehle und einen bereichsbezogenen Editor für den Konfigurationsabschnitt `mcp`.

Verwenden Sie die Seite für Operator-Bearbeitungen und schnelle Inventarisierung. Verwenden Sie `openclaw mcp doctor --probe` oder `openclaw mcp probe`, wenn Sie einen Live-Server-Nachweis benötigen.

Operator-Workflow:

1. Öffnen Sie die Control UI und wählen Sie **MCP**.
2. Prüfen Sie die Übersichtskarten für Gesamtzahl, aktivierte, OAuth- und gefilterte Server.
3. Nutzen Sie jede Serverzeile für Hinweise zu Transport, Auth, Filter, Timeout und Befehlen.
4. Schalten Sie die Aktivierung um, wenn Sie eine Definition behalten, sie aber von der Laufzeiterkennung ausschließen möchten.
5. Bearbeiten Sie den bereichsspezifischen `mcp`-Konfigurationsabschnitt für strukturelle Änderungen wie neue Server, Header, TLS, OAuth-Metadaten oder Tool-Filter.
6. Wählen Sie **Speichern**, um nur die Konfiguration zu speichern, oder **Speichern & Veröffentlichen**, um sie über den Gateway-Konfigurationspfad anzuwenden.
7. Führen Sie `openclaw mcp doctor --probe` aus, wenn Sie Live-Nachweise benötigen, dass der bearbeitete Server startet und Tools auflistet.

Hinweise:

- Befehlssnippets setzen Servernamen in Anführungszeichen, damit ungewöhnliche Namen in einer Shell kopierbar bleiben
- angezeigte URL-ähnliche Werte werden vor dem Rendern redigiert, wenn sie eingebettete Anmeldedaten enthalten
- die Seite startet MCP-Transporte nicht selbst
- aktive Laufzeiten benötigen möglicherweise `openclaw mcp reload`, eine Gateway-Konfigurationsveröffentlichung oder einen Prozessneustart, je nachdem, welcher Prozess die MCP-Clients besitzt

## Aktuelle Grenzen

Diese Seite dokumentiert die Bridge, wie sie heute ausgeliefert wird.

Aktuelle Grenzen:

- die Konversationserkennung hängt von vorhandenen Gateway-Sitzungsrouten-Metadaten ab
- kein generisches Push-Protokoll über den Claude-spezifischen Adapter hinaus
- noch keine Tools zum Bearbeiten von Nachrichten oder zum Reagieren
- HTTP/SSE/streamable-http-Transport verbindet sich mit einem einzelnen Remote-Server; noch kein multiplexter Upstream
- `permissions_list_open` enthält nur Genehmigungen, die beobachtet wurden, während die Bridge verbunden ist

## Verwandt

- [CLI-Referenz](/de/cli)
- [Plugins](/de/cli/plugins)
