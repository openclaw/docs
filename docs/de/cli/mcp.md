---
read_when:
    - Codex, Claude Code oder einen anderen MCP-Client mit OpenClaw-gestützten Kanälen verbinden
    - '`openclaw mcp serve` wird ausgeführt'
    - Verwalten der von OpenClaw gespeicherten MCP-Serverdefinitionen
sidebarTitle: MCP
summary: OpenClaw-Kanalunterhaltungen über MCP bereitstellen und gespeicherte MCP-Serverdefinitionen verwalten
title: MCP
x-i18n:
    generated_at: "2026-07-24T03:43:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ee6146bbc0181d10997336094d1bd693d0afb0985f1febef8e8c6b0d6e656cf9
    source_path: cli/mcp.md
    workflow: 16
---

`openclaw mcp` hat zwei Aufgaben:

- OpenClaw mit `openclaw mcp serve` als MCP-Server ausführen
- von OpenClaw verwaltete Definitionen ausgehender MCP-Server mit `list`, `show`, `status`, `doctor`, `probe`, `add`, `set`, `configure`, `tools`, `login`, `logout`, `reload` und `unset` verwalten

Bei `serve` fungiert OpenClaw als MCP-Server. Bei den anderen Unterbefehlen fungiert OpenClaw als clientseitige MCP-Registry für Server, die seine eigenen Runtimes später verwenden können.

<Note>
  `list`, `show`, `set` und `unset` lesen und schreiben ausschließlich von OpenClaw verwaltete `mcp.servers`-Einträge in der OpenClaw-Konfiguration. Sie enthalten keine mcporter-Server aus `config/mcporter.json`; verwenden Sie für diese Registry `mcporter list`.
</Note>

Verwenden Sie [`openclaw acp`](/de/cli/acp), wenn OpenClaw selbst eine Coding-Harness-Sitzung hosten und diese Runtime über ACP leiten soll.

## Den richtigen MCP-Pfad wählen

| Ziel                                                                | Verwenden                                                              | Warum                                                                                                             |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Einem externen MCP-Client das Lesen/Senden von OpenClaw-Kanalunterhaltungen ermöglichen | `openclaw mcp serve`                                                 | OpenClaw ist der MCP-Server und stellt Gateway-gestützte Unterhaltungen über stdio bereit.                         |
| MCP-Server von Drittanbietern für von OpenClaw verwaltete Agent-Ausführungen speichern | `openclaw mcp add`, `set`, `configure`, `tools`, `login`             | OpenClaw ist die clientseitige MCP-Registry und projiziert diese Server später in geeignete Runtimes.              |
| Einen gespeicherten Server prüfen, ohne einen Agent-Durchlauf auszuführen | `openclaw mcp status`, `doctor`, `probe`                             | `status` und `doctor` prüfen die Konfiguration; `probe` öffnet eine aktive MCP-Verbindung und listet Fähigkeiten auf. |
| MCP-Konfiguration in einem Browser bearbeiten                       | Control UI `/settings/mcp` (Alias `/mcp`)                            | Die Seite zeigt Bestand, Aktivierungsstatus, OAuth-/Filterzusammenfassungen, Befehlshinweise und einen bereichsgebundenen `mcp`-Editor. |
| Codex app-server einen bereichsgebundenen nativen MCP-Server bereitstellen | `mcp.servers.<name>.codex`                                           | Der `codex`-Block wirkt sich nur auf die Thread-Projektion von Codex app-server aus und wird vor der Übergabe der nativen Konfiguration entfernt. |
| ACP-gehostete Harness-Sitzungen ausführen                            | [`openclaw acp`](/de/cli/acp) und [ACP-Agents](/de/tools/acp-agents-setup) | Der ACP-Bridge-Modus akzeptiert keine sitzungsbezogene MCP-Server-Injektion; konfigurieren Sie stattdessen Gateway-/Plugin-Bridges. |

<Tip>
Wenn Sie nicht sicher sind, welchen Pfad Sie benötigen, beginnen Sie mit `openclaw mcp status --verbose`. Es zeigt, was OpenClaw gespeichert hat, ohne MCP-Server zu starten.
</Tip>

## OpenClaw als MCP-Server

Dies ist der `openclaw mcp serve`-Pfad.

### Wann serve verwendet werden sollte

Verwenden Sie `openclaw mcp serve`, wenn:

- Codex, Claude Code oder ein anderer MCP-Client direkt mit OpenClaw-gestützten Kanalunterhaltungen kommunizieren soll
- bereits ein lokales oder entferntes OpenClaw Gateway mit weitergeleiteten Sitzungen vorhanden ist
- Sie einen MCP-Server wünschen, der über die Kanal-Backends von OpenClaw hinweg funktioniert, anstatt separate Bridges pro Kanal auszuführen

Verwenden Sie stattdessen [`openclaw acp`](/de/cli/acp), wenn OpenClaw die Coding-Runtime selbst hosten und die Agent-Sitzung innerhalb von OpenClaw halten soll.

### Funktionsweise

`openclaw mcp serve` startet einen stdio-MCP-Server. Der MCP-Client ist Eigentümer dieses Prozesses. Solange der Client die stdio-Sitzung offen hält, verbindet sich die Bridge über WebSocket mit einem lokalen oder entfernten OpenClaw Gateway und stellt weitergeleitete Kanalunterhaltungen über MCP bereit.

<Steps>
  <Step title="Client startet die Bridge">
    Der MCP-Client startet `openclaw mcp serve`.
  </Step>
  <Step title="Bridge stellt Verbindung zum Gateway her">
    Die Bridge stellt über WebSocket eine Verbindung zum OpenClaw Gateway her.
  </Step>
  <Step title="Sitzungen werden zu MCP-Unterhaltungen">
    Weitergeleitete Sitzungen werden zu MCP-Unterhaltungen und Werkzeugen für Transkripte/Verläufe.
  </Step>
  <Step title="Live-Ereignisse werden eingereiht">
    Live-Ereignisse werden im Arbeitsspeicher eingereiht, solange die Bridge verbunden ist.
  </Step>
  <Step title="Optionaler Claude-Push">
    Wenn der Claude-Kanalmodus aktiviert ist, kann dieselbe Sitzung auch Claude-spezifische Push-Benachrichtigungen empfangen.
  </Step>
</Steps>

<AccordionGroup>
  <Accordion title="Wichtiges Verhalten">
    - der Zustand der Live-Warteschlange beginnt mit dem Verbindungsaufbau der Bridge
    - älterer Transkriptverlauf wird mit `messages_read` gelesen
    - Claude-Push-Benachrichtigungen existieren nur, solange die MCP-Sitzung aktiv ist
    - wenn der Client die Verbindung trennt, wird die Bridge beendet und die Live-Warteschlange geht verloren
    - einmalige Agent-Einstiegspunkte wie `openclaw agent` und `openclaw infer model run` beenden alle von ihnen geöffneten gebündelten MCP-Runtimes, sobald die Antwort abgeschlossen ist, sodass sich bei wiederholten skriptgesteuerten Ausführungen keine untergeordneten stdio-MCP-Prozesse ansammeln
    - von OpenClaw gestartete stdio-MCP-Server (gebündelt oder benutzerkonfiguriert) werden beim Herunterfahren als Prozessbaum beendet, sodass vom Server gestartete Unterprozesse nach dem Beenden des übergeordneten stdio-Clients nicht weiterlaufen
    - das Löschen oder Zurücksetzen einer Sitzung beendet die MCP-Clients dieser Sitzung über den gemeinsamen Runtime-Bereinigungspfad, sodass keine mit einer entfernten Sitzung verknüpften stdio-Verbindungen bestehen bleiben

  </Accordion>
</AccordionGroup>

### Einen Clientmodus wählen

<Tabs>
  <Tab title="Generische MCP-Clients">
    Nur standardmäßige MCP-Werkzeuge. Verwenden Sie `conversations_list`, `messages_read`, `events_poll`, `events_wait`, `messages_send` und die Genehmigungswerkzeuge.
  </Tab>
  <Tab title="Claude Code">
    Standardmäßige MCP-Werkzeuge plus den Claude-spezifischen Kanaladapter. Aktivieren Sie `--claude-channel-mode on` oder behalten Sie die Standardeinstellung `auto` bei.
  </Tab>
</Tabs>

<Note>
Derzeit verhält sich `auto` genauso wie `on`. Eine Erkennung der Clientfähigkeiten ist noch nicht vorhanden.
</Note>

### Was serve bereitstellt

Die Bridge verwendet vorhandene Gateway-Sitzungsroutenmetadaten, um kanalgestützte Unterhaltungen bereitzustellen. Eine Unterhaltung erscheint, wenn OpenClaw bereits über einen Sitzungszustand mit einer bekannten Route verfügt, etwa:

- `channel`
- Empfänger- oder Zielmetadaten
- optional `accountId`
- optional `threadId`

Damit haben MCP-Clients eine zentrale Stelle, um:

- die letzten weitergeleiteten Unterhaltungen aufzulisten
- den letzten Transkriptverlauf zu lesen
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
  <Tab title="Ausführlich / Claude deaktiviert">
    ```bash
    openclaw mcp serve --verbose
    openclaw mcp serve --claude-channel-mode off
    ```
  </Tab>
</Tabs>

### Bridge-Werkzeuge

<AccordionGroup>
  <Accordion title="conversations_list">
    Listet die letzten sitzungsbasierten Unterhaltungen auf, die bereits Routenmetadaten im Gateway-Sitzungszustand besitzen.

    Filter: `limit` (max. 500), `search`, `channel`, `includeDerivedTitles`, `includeLastMessage`.

  </Accordion>
  <Accordion title="conversation_get">
    Gibt eine Unterhaltung anhand von `session_key` über eine direkte Gateway-Sitzungssuche zurück.
  </Accordion>
  <Accordion title="messages_read">
    Liest die letzten Transkriptnachrichten für eine sitzungsbasierte Unterhaltung. `limit` ist standardmäßig 20, maximal 200.
  </Accordion>
  <Accordion title="attachments_fetch">
    Extrahiert Nicht-Text-Inhaltsblöcke einer Nachricht aus einer Transkriptnachricht. Dies ist eine Metadatenansicht des Transkriptinhalts und kein eigenständiger dauerhafter Speicher für Anhangsblobs.
  </Accordion>
  <Accordion title="events_poll">
    Liest eingereihte Live-Ereignisse seit einem numerischen Cursor. `limit` maximal 200.
  </Accordion>
  <Accordion title="events_wait">
    Führt eine lange Abfrage aus, bis das nächste passende eingereihte Ereignis eintrifft oder eine Zeitüberschreitung abläuft (standardmäßig 30s, maximal 300s).

    Verwenden Sie dies, wenn ein generischer MCP-Client eine nahezu in Echtzeit erfolgende Zustellung ohne Claude-spezifisches Push-Protokoll benötigt.

  </Accordion>
  <Accordion title="messages_send">
    Sendet Text über dieselbe Route zurück, die bereits für die Sitzung aufgezeichnet wurde.

    Aktuelles Verhalten:

    - erfordert eine vorhandene Unterhaltungsroute
    - verwendet den Kanal, den Empfänger, die Konto-ID und die Thread-ID der Sitzung
    - sendet ausschließlich Text

  </Accordion>
  <Accordion title="permissions_list_open">
    Listet ausstehende Genehmigungsanfragen für Ausführungen/Plugins auf, die die Bridge seit dem Verbindungsaufbau zum Gateway beobachtet hat.
  </Accordion>
  <Accordion title="permissions_respond">
    Bearbeitet eine ausstehende Genehmigungsanfrage für Ausführungen/Plugins mit:

    - `allow-once`
    - `allow-always`
    - `deny`

  </Accordion>
</AccordionGroup>

### Ereignismodell

Die Bridge verwaltet eine Ereigniswarteschlange im Arbeitsspeicher, solange sie verbunden ist.

Aktuelle Ereignistypen:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

<Warning>
- die Warteschlange enthält ausschließlich Live-Daten; sie beginnt beim Start der MCP-Bridge
- `events_poll` und `events_wait` spielen älteren Gateway-Verlauf nicht selbstständig erneut ab
- ein dauerhafter Rückstand sollte mit `messages_read` gelesen werden

</Warning>

### Claude-Kanalbenachrichtigungen

Die Bridge kann außerdem Claude-spezifische Kanalbenachrichtigungen bereitstellen. Dies ist das OpenClaw-Äquivalent eines Claude-Code-Kanaladapters: Standardmäßige MCP-Werkzeuge bleiben verfügbar, aber eingehende Live-Nachrichten können auch als Claude-spezifische MCP-Benachrichtigungen eintreffen.

<Tabs>
  <Tab title="deaktiviert">
    `--claude-channel-mode off`: nur standardmäßige MCP-Werkzeuge.
  </Tab>
  <Tab title="aktiviert">
    `--claude-channel-mode on`: Claude-Kanalbenachrichtigungen aktivieren.
  </Tab>
  <Tab title="automatisch (Standard)">
    `--claude-channel-mode auto`: aktueller Standard; dasselbe Bridge-Verhalten wie `on`.
  </Tab>
</Tabs>

Wenn der Claude-Kanalmodus aktiviert ist, kündigt der Server experimentelle Claude-Fähigkeiten an und kann Folgendes ausgeben:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Aktuelles Bridge-Verhalten:

- eingehende `user`-Transkriptnachrichten werden als `notifications/claude/channel` weitergeleitet
- über MCP empfangene Claude-Berechtigungsanfragen werden im Arbeitsspeicher nachverfolgt
- wenn der Befehlseigentümer in der verknüpften Unterhaltung später `yes <id>` oder `no <id>` sendet (`<id>` ist die aus 5 Zeichen bestehende Anfrage-ID ohne `l`), wandelt die Bridge dies in `notifications/claude/channel/permission` um
- diese Benachrichtigungen gelten nur für die aktive Sitzung; wenn der MCP-Client die Verbindung trennt, ist kein Push-Ziel vorhanden

Dies ist absichtlich clientspezifisch. Generische MCP-Clients sollten die standardmäßigen Abfragewerkzeuge verwenden.

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

Beginnen Sie bei den meisten generischen MCP-Clients mit der standardmäßigen Tool-Oberfläche und ignorieren Sie den Claude-Modus. Aktivieren Sie den Claude-Modus nur für Clients, die die Claude-spezifischen Benachrichtigungsmethoden tatsächlich verstehen.

### Optionen

`openclaw mcp serve` unterstützt:

<ParamField path="--url" type="string">
  Gateway-WebSocket-URL. Standardmäßig `gateway.remote.url`, wenn konfiguriert.
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
Verwenden Sie nach Möglichkeit `--token-file` oder `--password-file` statt eingebetteter Geheimnisse.
</Tip>

### Sicherheits- und Vertrauensgrenze

Die Bridge erfindet kein Routing. Sie stellt nur Konversationen bereit, für die das Gateway bereits Routing unterstützt.

Das bedeutet:

- Absender-Zulassungslisten, Kopplung und Vertrauen auf Kanalebene gehören weiterhin zur zugrunde liegenden OpenClaw-Kanalkonfiguration
- `messages_send` kann nur über eine vorhandene gespeicherte Route antworten
- der Genehmigungsstatus ist nur live und im Arbeitsspeicher für die aktuelle Bridge-Sitzung vorhanden
- die Bridge-Authentifizierung sollte dieselben Gateway-Token- oder Passwortkontrollen verwenden, denen Sie auch bei jedem anderen entfernten Gateway-Client vertrauen würden

Wenn eine Konversation in `conversations_list` fehlt, liegt die Ursache normalerweise nicht in der MCP-Konfiguration. Es fehlen Routenmetadaten in der zugrunde liegenden Gateway-Sitzung oder diese sind unvollständig.

### Tests

OpenClaw enthält einen deterministischen Docker-Smoke-Test für diese Bridge:

```bash
pnpm test:docker:mcp-channels
```

Dieser Smoke-Test führt einen einzelnen Container aus: Er initialisiert den Konversationsstatus, startet das Gateway, erzeugt dann `openclaw mcp serve` als stdio-Kindprozess und steuert ihn als MCP-Client. Er überprüft die Erkennung von Konversationen, das Lesen von Transkripten, das Lesen von Anhangsmetadaten, das Verhalten der Live-Ereigniswarteschlange sowie Kanal- und Berechtigungsbenachrichtigungen im Claude-Stil über die echte stdio-MCP-Bridge. Das Routing ausgehender Nachrichten (`messages_send` unter Wiederverwendung der gespeicherten Konversationsroute) wird separat durch Unit-Tests in `src/mcp/channel-server.test.ts` abgedeckt.

Dies ist der schnellste Weg, die Funktion der Bridge nachzuweisen, ohne ein echtes Telegram-, Discord- oder iMessage-Konto in den Testlauf einzubinden.

Einen umfassenderen Testkontext finden Sie unter [Tests](/de/help/testing).

### Fehlerbehebung

<AccordionGroup>
  <Accordion title="Keine Konversationen zurückgegeben">
    Bedeutet normalerweise, dass für die Gateway-Sitzung noch kein Routing möglich ist. Prüfen Sie, ob die zugrunde liegende Sitzung gespeicherte Routenmetadaten für Kanal/Provider, Empfänger sowie optional Konto/Thread enthält.
  </Accordion>
  <Accordion title="events_poll oder events_wait übersieht ältere Nachrichten">
    Erwartetes Verhalten. Die Live-Warteschlange beginnt, wenn die Bridge die Verbindung herstellt. Lesen Sie den älteren Transkriptverlauf mit `messages_read`.
  </Accordion>
  <Accordion title="Claude-Benachrichtigungen werden nicht angezeigt">
    Prüfen Sie alle folgenden Punkte:

    - der Client hat die stdio-MCP-Sitzung offen gehalten
    - `--claude-channel-mode` ist `on` oder `auto`
    - der Client versteht die Claude-spezifischen Benachrichtigungsmethoden tatsächlich
    - die eingehende Nachricht ist nach dem Verbindungsaufbau der Bridge eingetroffen

  </Accordion>
  <Accordion title="Genehmigungen fehlen">
    `permissions_list_open` zeigt nur Genehmigungsanfragen an, die beobachtet wurden, während die Bridge verbunden war. Es handelt sich nicht um eine API für einen dauerhaften Genehmigungsverlauf.
  </Accordion>
</AccordionGroup>

## OpenClaw als MCP-Client-Registry

Dies ist der Pfad für `openclaw mcp list`, `show`, `status`, `doctor`, `probe`, `add`, `set`,
`configure`, `tools`, `login`, `logout`, `reload` und `unset`.

Diese Befehle stellen OpenClaw nicht über MCP bereit. Sie verwalten von OpenClaw verwaltete MCP-Serverdefinitionen unter `mcp.servers` in der OpenClaw-Konfiguration. Sie lesen keine mcporter-Server aus `config/mcporter.json`.

Diese gespeicherten Definitionen sind für Laufzeitumgebungen vorgesehen, die OpenClaw später startet oder konfiguriert, etwa eingebettetes OpenClaw und andere Laufzeitadapter. OpenClaw speichert die Definitionen zentral, damit diese Laufzeitumgebungen keine eigenen doppelten MCP-Serverlisten führen müssen.

<AccordionGroup>
  <Accordion title="Wichtiges Verhalten">
    - diese Befehle lesen oder schreiben ausschließlich die OpenClaw-Konfiguration
    - `status`, `list`, `show`, `doctor` ohne `--probe`, `set`, `configure`, `tools`, `logout`, `reload` und `unset` stellen keine Verbindung zum MCP-Zielserver her
    - `login` führt den MCP-OAuth-Netzwerkablauf für den konfigurierten HTTP-Server aus und speichert die resultierenden lokalen Anmeldedaten
    - `status --verbose` gibt Hinweise zu aufgelöstem Transport, Authentifizierung, Zeitüberschreitung, Filter und parallelen Tool-Aufrufen aus, ohne eine Verbindung herzustellen
    - `doctor` prüft gespeicherte Definitionen auf lokale Einrichtungsprobleme wie fehlende stdio-Befehle, ungültige Arbeitsverzeichnisse, fehlende TLS-Dateien, deaktivierte Server, im Klartext angegebene sensible Header-/Umgebungswerte und unvollständige OAuth-Autorisierung
    - `doctor --probe` ergänzt nach erfolgreichen statischen Prüfungen denselben Live-Verbindungsnachweis wie `probe`
    - `probe` stellt eine Verbindung zum ausgewählten Server oder zu allen konfigurierten Servern her, listet Tools auf und meldet Fähigkeiten/Diagnosen
    - `add` erstellt eine Definition aus Flags und prüft sie vor dem Speichern, sofern nicht `--no-probe` gesetzt ist oder zuerst eine OAuth-Autorisierung erforderlich ist
    - Laufzeitadapter entscheiden zur Ausführungszeit, welche Transportformen sie tatsächlich unterstützen
    - `enabled: false` lässt einen Server gespeichert, schließt ihn jedoch von der Erkennung durch eingebettete Laufzeitumgebungen aus
    - `requestTimeoutMs` und `connectionTimeoutMs` legen Anfrage- und Verbindungszeitüberschreitungen pro Server in Millisekunden fest
    - `supportsParallelToolCalls: true` kennzeichnet Server, die Adapter gleichzeitig aufrufen können
    - HTTP-Server können statische Header, OAuth-Anmeldung, Steuerung der TLS-Verifizierung sowie mTLS-Zertifikat-/Schlüsselpfade verwenden
    - eingebettetes OpenClaw stellt konfigurierte MCP-Tools in den normalen Tool-Profilen `coding` und `messaging` bereit; `minimal` blendet sie weiterhin aus und `tools.deny: ["bundle-mcp"]` deaktiviert sie ausdrücklich
    - `toolFilter.include` und `toolFilter.exclude` pro Server filtern erkannte MCP-Tools, bevor sie zu OpenClaw-Tools werden
    - Server, die Ressourcen oder Prompts anbieten, stellen außerdem Hilfstools zum Auflisten/Lesen von Ressourcen und zum Auflisten/Abrufen von Prompts bereit; diese generierten Hilfsnamen (`resources_list`, `resources_read`, `prompts_list`, `prompts_get`) verwenden denselben Einschluss-/Ausschlussfilter
    - dynamische Änderungen an der MCP-Tool-Liste machen den zwischengespeicherten Katalog für diese Sitzung ungültig; bei der nächsten Erkennung/Verwendung wird er vom Server aktualisiert
    - wiederholte Fehler bei MCP-Tool-Anfragen oder im Protokoll pausieren diesen Server kurzzeitig, damit ein defekter Server nicht den gesamten Durchlauf beansprucht
    - sitzungsgebundene gebündelte MCP-Laufzeitumgebungen werden nach 10 Minuten Inaktivität beendet, und einmalige eingebettete Ausführungen bereinigen sie am Ende der Ausführung

  </Accordion>
</AccordionGroup>

Laufzeitadapter können diese gemeinsame Registry in die von ihrem nachgelagerten Client erwartete Form normalisieren. Eingebettetes OpenClaw verwendet beispielsweise OpenClaw-Werte vom Typ `transport` direkt, während Claude Code und Gemini CLI-native Werte vom Typ `type` wie `http`, `sse` oder `stdio` erhalten.

Codex app-server berücksichtigt außerdem einen optionalen `codex`-Block auf jedem Server. Dabei handelt es sich
nur um OpenClaw-Projektionsmetadaten für Codex-app-server-Threads; sie ändern weder
ACP-Sitzungen noch die generische Codex-Harness-Konfiguration oder andere Laufzeitadapter.
Verwenden Sie ein nicht leeres `codex.agents`, um einen Server nur in bestimmte OpenClaw-
Agenten-IDs zu projizieren. Leere, ausschließlich aus Leerzeichen bestehende oder ungültige Agentenlisten werden von der Konfigurations-
validierung abgelehnt und vom Projektionspfad der Laufzeit ausgelassen, statt
global zu werden. Verwenden Sie `codex.defaultToolsApprovalMode` (`auto`, `prompt` oder `approve`),
um das native `default_tools_approval_mode` von Codex für einen vertrauenswürdigen Server auszugeben.
OpenClaw entfernt die `codex`-Metadaten, bevor es die native `mcp_servers`-
Konfiguration an Codex übergibt.

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
- `show` ohne Namen gibt das vollständige konfigurierte MCP-Serverobjekt aus.
- `status` klassifiziert konfigurierte Transporte, ohne eine Verbindung herzustellen. `--verbose` enthält aufgelöste Details zu Start, Zeitüberschreitung, OAuth, Filter und parallelen Aufrufen, einschließlich Fällen, in denen gespeicherte OAuth-Token eine zusätzliche Autorisierung erfordern. Anmeldedaten enthaltende stdio-Argumente werden in Text- und JSON-Ausgaben geschwärzt.
- `doctor` führt statische Prüfungen durch, ohne eine Verbindung herzustellen. Fügen Sie `--probe` hinzu, wenn der Befehl zusätzlich prüfen soll, ob aktivierte Server eine Verbindung herstellen können.
- `probe` stellt eine Verbindung her und meldet die Anzahl der Tools, die Unterstützung für Ressourcen/Prompts und Listenänderungen sowie Diagnosen.
- `add` akzeptiert stdio-Flags wie `--command`, `--arg`, `--env` und `--cwd` oder HTTP-Flags wie `--url`, `--transport`, `--header`, `--auth oauth` sowie Flags für TLS, Zeitüberschreitung und Tool-Auswahl.
- `set` erwartet einen einzelnen JSON-Objektwert in der Befehlszeile.
- `configure` aktualisiert Aktivierung, Tool-Filter, Zeitüberschreitungen, OAuth, TLS und Hinweise zu parallelen Tool-Aufrufen, ohne die gesamte Serverdefinition zu ersetzen. Fügen Sie `--probe` hinzu, um den aktualisierten Server vor dem Speichern zu prüfen.
- `tools` aktualisiert Tool-Filter pro Server. Ein- und Ausschlusseinträge sind MCP-Tool-Namen und einfache `*`-Globs.
- `login` führt den OAuth-Ablauf für HTTP-Server aus, die mit `auth: "oauth"` konfiguriert sind. Der erste Lauf gibt eine Autorisierungs-URL aus; führen Sie den Befehl nach der Genehmigung erneut mit `--code` aus.
- `logout` löscht gespeicherte OAuth-Anmeldedaten für den benannten Server, ohne die gespeicherte Serverdefinition zu entfernen.
- `reload` verwirft zwischengespeicherte prozessinterne MCP-Laufzeitumgebungen ausschließlich für den aktuellen CLI-Prozess. Gateway- oder Agentenprozesse in einem anderen Prozess benötigen weiterhin einen eigenen Neu-Lade- oder Neustartpfad.
- Verwenden Sie `transport: "streamable-http"` für streamfähige HTTP-MCP-Server. `openclaw mcp set` normalisiert aus Kompatibilitätsgründen außerdem das CLI-native `type: "http"` auf dieselbe kanonische Konfigurationsform.
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

    Verwenden Sie OAuth, wenn der Remote-Server es unterstützt. Wenn der Server statische Header erfordert, sollten Sie keine literalen Bearer-Token committen.

  </Tab>
  <Tab title="Desktop/CUA">
    ```bash
    openclaw mcp set cua-driver '{"command":"cua-driver","args":["mcp"]}'
    openclaw mcp tools cua-driver --include 'list_apps,get_window_state,click,type_text'
    openclaw mcp doctor cua-driver --probe
    ```

    Server zur direkten Desktop-Steuerung übernehmen die Berechtigungen des von ihnen gestarteten Prozesses. Verwenden Sie eng gefasste Toolfilter und Berechtigungsabfragen auf Betriebssystemebene.

  </Tab>
</Tabs>

### JSON-Ausgabeformate

Verwenden Sie `--json` für Skripte und Dashboards. Feldgruppen können im Laufe der Zeit erweitert werden, daher sollten Verbraucher unbekannte Schlüssel ignorieren.

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
            "requiresAuthorization": false,
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

    `doctor --json` wird mit einem von null verschiedenen Status beendet, wenn ein aktivierter und geprüfter Server ein Problem der Stufe `error` aufweist. Probleme der Stufen `warning` und `info` werden gemeldet, führen für sich allein jedoch nicht zum Fehlschlagen des Befehls.

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

    `probe --json` öffnet eine aktive MCP-Clientsitzung und gibt ihr Ergebnis direkt aus. Anders als bei `status`/`doctor` enthält die Ausgabe kein übergeordnetes Feld `path`. Die Schlüssel `resources` und `prompts` sind nur vorhanden, wenn der Server diese Fähigkeit tatsächlich ankündigt (ein Server ohne Prompts lässt den Schlüssel `prompts` weg, statt `false` zu melden). Verwenden Sie `probe` als Nachweis für Erreichbarkeit und Fähigkeiten, nicht für statische Konfigurationsprüfungen.

  </Accordion>
</AccordionGroup>

Beispielhafte Konfigurationsstruktur:

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
        "requestTimeoutMs": 20000,
        "connectionTimeoutMs": 5000,
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
| `command`         | Zu startende ausführbare Datei (erforderlich) |
| `args`         | Array von Befehlszeilenargumenten         |
| `env`         | Zusätzliche Umgebungsvariablen            |
| `cwd` / `workingDirectory` | Arbeitsverzeichnis für den Prozess |

<Warning>
**Sicherheitsfilter für die Stdio-Umgebung**

OpenClaw lehnt vor dem Start eines Stdio-MCP-Servers Umgebungsschlüssel für den Interpreterstart, das Kapern von Loadern und die Shell-Initialisierung ab, selbst wenn sie im `env`-Block eines Servers erscheinen. Dabei gilt dieselbe Sicherheitsrichtlinie für die Hostumgebung wie für andere von OpenClaw gestartete Prozesse: Sie blockiert bekannte Hooks für den Interpreterstart (zum Beispiel `NODE_OPTIONS`, `PYTHONSTARTUP`, `PERL5OPT`, `RUBYOPT`, `BASHOPTS`, `KSH_ENV`), Präfixe für die Einschleusung gemeinsam genutzter Bibliotheken und Funktionen (`DYLD_*`, `LD_*`, `BASH_FUNC_*`) sowie ähnliche Variablen zur Laufzeitsteuerung. Beim Start werden diese stillschweigend entfernt und eine Warnung wird protokolliert, damit sie keine implizite Präambel einschleusen, den Interpreter austauschen, einen Debugger aktivieren oder den dynamischen Linker des Stdio-Prozesses kapern können. Eine explizite Positivliste sorgt dafür, dass gewöhnliche MCP-Umgebungsvariablen für Anmeldedaten verwendbar bleiben (`GITHUB_TOKEN`, `GH_TOKEN`, `GITLAB_TOKEN`, `NPM_TOKEN`, `NODE_AUTH_TOKEN`, `DATABASE_URL`, `MONGODB_URI`, `REDIS_URL`, `AMQP_URL`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`, `AZURE_CLIENT_ID`, `AZURE_CLIENT_SECRET`), ebenso wie gewöhnliche Proxy- und serverspezifische Umgebungsvariablen (`HTTP_PROXY`, benutzerdefinierte `*_API_KEY` usw.). Andere `AWS_*`-Schlüssel wie `AWS_CONFIG_FILE` und `AWS_SHARED_CREDENTIALS_FILE` bleiben blockiert, weil sie auf Dateien mit Anmeldedaten verweisen, statt einen Anmeldedatenwert direkt zu enthalten.

Wenn Ihr MCP-Server tatsächlich eine der blockierten Variablen benötigt, legen Sie sie für den Gateway-Hostprozess fest und nicht unter `env` des Stdio-Servers.
</Warning>

### SSE-/HTTP-Transport

Stellt über HTTP Server-Sent Events eine Verbindung zu einem Remote-MCP-Server her.

| Feld                       | Beschreibung                                                      |
| --------------------------- | ---------------------------------------------------------------- |
| `url`          | HTTP- oder HTTPS-URL des Remote-Servers (erforderlich)            |
| `headers`          | Optionale Schlüssel-Wert-Zuordnung von HTTP-Headern (zum Beispiel Authentifizierungstoken) |
| `connectionTimeoutMs`          | Verbindungstimeout pro Server in ms (optional)                    |
| `requestTimeoutMs`          | MCP-Anfragetimeout pro Server in Millisekunden                    |
| `auth: "oauth"`          | Von `openclaw mcp login` gespeicherte MCP-OAuth-Anmeldedaten verwenden |
| `sslVerify`          | Nur für ausdrücklich vertrauenswürdige private HTTPS-Endpunkte auf false setzen |
| `clientCert` / `clientKey` | Pfade zu mTLS-Clientzertifikat und -Schlüssel          |
| `supportsParallelToolCalls`          | Hinweis, dass gleichzeitige Aufrufe für diesen Server sicher sind |

Beispiel:

```json
{
  "mcp": {
    "servers": {
      "remote-tools": {
        "url": "https://mcp.example.com",
        "auth": "oauth",
        "requestTimeoutMs": 20000,
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

Native MCP-OAuth-Sitzungen befinden sich in der nur für den Eigentümer zugänglichen, gemeinsam genutzten SQLite-Datenbank unter `<state-dir>/state/openclaw.sqlite` (`mcp_oauth_stores`). Die Zeile kann Zugriffs- und Aktualisierungstoken, Geheimnisse der dynamischen Clientregistrierung, Erkennungsmetadaten und den temporären PKCE-Verifizierer enthalten. Aktualisierung, Anmeldung und Abmeldung verwenden dieselbe SQLite-Lease, sodass parallele OpenClaw-Prozesse weder ein einzelnes Aktualisierungstoken verbrauchen noch eine abgemeldete Sitzung wiederherstellen können.

Upgrades vom eingestellten `<state-dir>/mcp-oauth/*.json`-Speicher werden ausschließlich von `openclaw doctor --fix` verarbeitet. Laufzeitcode liest oder schreibt diese Dateien niemals und greift auch nicht als Fallback darauf zurück.

Bis Anmeldedaten verfügbar sind, lässt OpenClaw nur diesen MCP-Server aus der Agentenlaufzeit aus, statt den Agentendurchlauf fehlschlagen zu lassen. Der Betreiber oder ein Agent mit Shell-Zugriff kann anschließend `openclaw mcp login <name>` ausführen und den Server in einem späteren Durchlauf verwenden.

Wenn ein Server ein Token mit `insufficient_scope` ablehnt, behält OpenClaw den angeforderten Geltungsbereich bei und fordert `openclaw mcp login <name>` an, statt eine Aktualisierung zu wiederholen, die keinen neuen Geltungsbereich gewähren kann. Diese Anmeldung startet eine neue Autorisierungsanfrage, während das vorherige Token beibehalten wird, bis die Ersatzanmeldedaten gespeichert sind.

Wenn ein Remote-MCP-Dienst bereits durch ein separates, aktualisierungsfähiges OpenClaw-Authentifizierungsprofil gestützt wird, können Sie optional `oauth.authProfileId` festlegen. OpenClaw aktualisiert vor der Laufzeitprojektion eine der beiden Anmeldedatenquellen und übergibt nur das aktuelle Zugriffstoken an den nachgelagerten MCP-Client.

<Steps>
  <Step title="Server speichern">
    Fügen Sie den Server mit `auth: "oauth"` und optionalen OAuth-Metadaten hinzu oder aktualisieren Sie ihn.

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"scope":"docs.read"}}'
    ```

    Speichern Sie für einen durch ein Authentifizierungsprofil gestützten Bearer die Profilbindung:

    ```bash
    openclaw mcp set docs '{"url":"https://mcp.example.com/mcp","transport":"streamable-http","auth":"oauth","oauth":{"authProfileId":"docs:mcp"}}'
    ```

  </Step>
  <Step title="Anmeldung starten">
    Führen Sie die Anmeldung aus, um die Autorisierungsanfrage zu erstellen.

    ```bash
    openclaw mcp login docs
    ```

    OpenClaw gibt die Autorisierungs-URL aus und speichert den temporären OAuth-Verifizierungsstatus im gemeinsam genutzten SQLite.

  </Step>
  <Step title="Mit dem Code abschließen">
    Nachdem Sie die Anfrage im Browser genehmigt haben, übergeben Sie den zurückgegebenen Code an OpenClaw.

    ```bash
    openclaw mcp login docs --code abc123
    ```

  </Step>
  <Step title="Autorisierung prüfen">
    Bestätigen Sie mit dem Status- oder Doctor-Befehl, dass Token vorhanden sind und keine zusätzliche Autorisierung erforderlich ist. Wenn der Status `authorization-required` meldet oder Doctor eine zusätzliche Autorisierung anfordert, führen Sie `openclaw mcp login <name>` erneut aus.

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

Wenn der Provider Token rotiert oder der Autorisierungsstatus hängen bleibt, führen Sie `openclaw mcp logout <name>` aus und wiederholen Sie anschließend `login`. `logout` kann die Anmeldedaten eines gespeicherten HTTP-Servers auch dann löschen, wenn `auth: "oauth"` bereits aus der Konfiguration entfernt wurde, solange Servername und URL den Eintrag im Anmeldedatenspeicher weiterhin identifizieren.

### Streamable-HTTP-Transport

`streamable-http` ist neben `sse` und `stdio` eine zusätzliche Transportoption. Sie verwendet HTTP-Streaming für die bidirektionale Kommunikation mit entfernten MCP-Servern.

| Feld                        | Beschreibung                                                                           |
| --------------------------- | -------------------------------------------------------------------------------------- |
| `url`                       | HTTP- oder HTTPS-URL des entfernten Servers (erforderlich)                             |
| `transport`                 | Auf `"streamable-http"` setzen, um diesen Transport auszuwählen; falls nicht angegeben, verwendet OpenClaw `sse` |
| `headers`                   | Optionale Schlüssel-Wert-Zuordnung von HTTP-Headern (beispielsweise Authentifizierungstoken) |
| `connectionTimeoutMs`       | Verbindungszeitlimit pro Server in ms (optional)                                       |
| `requestTimeoutMs`          | MCP-Anfragezeitlimit pro Server in Millisekunden                                       |
| `auth: "oauth"`             | Von `openclaw mcp login` gespeicherte MCP-OAuth-Anmeldedaten verwenden                 |
| `sslVerify`                 | Nur für ausdrücklich vertrauenswürdige private HTTPS-Endpunkte auf false setzen        |
| `clientCert` / `clientKey`  | Pfade zum mTLS-Clientzertifikat und -schlüssel                                          |
| `supportsParallelToolCalls` | Hinweis, dass gleichzeitige Aufrufe für diesen Server sicher sind                      |

Die OpenClaw-Konfiguration verwendet `transport: "streamable-http"` als kanonische Schreibweise. CLI-native MCP-Werte für `type: "http"` werden akzeptiert, wenn sie über `openclaw mcp set` gespeichert werden, und in bestehenden Konfigurationen durch `openclaw doctor --fix` repariert; `transport` wird jedoch direkt vom eingebetteten OpenClaw verwendet.

Beispiel:

```json
{
  "mcp": {
    "servers": {
      "streaming-tools": {
        "url": "https://mcp.example.com/stream",
        "transport": "streamable-http",
        "connectionTimeoutMs": 10000,
        "requestTimeoutMs": 30000,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

<Note>
Registry-Befehle starten die Channel-Bridge nicht. Nur `probe` und `doctor --probe` öffnen eine aktive MCP-Client-Sitzung, um nachzuweisen, dass der Zielserver erreichbar ist.
</Note>

## Control UI

Die browserbasierte Control UI enthält unter `/settings/mcp` eine eigene MCP-Einstellungsseite; der bisherige Pfad `/mcp` bleibt als Alias erhalten. Die Seite zeigt die Anzahl konfigurierter Server, Zusammenfassungen zu Aktivierung, OAuth und Filtern, Transportzeilen für jeden Server, Steuerelemente zum Aktivieren und Deaktivieren, gängige CLI-Befehle sowie einen auf den Konfigurationsabschnitt `mcp` begrenzten Editor.

Verwenden Sie die Seite für Änderungen durch Bediener und eine schnelle Bestandsübersicht. Verwenden Sie `openclaw mcp doctor --probe` oder `openclaw mcp probe`, wenn Sie einen Live-Nachweis für den Server benötigen.

Arbeitsablauf für Bediener:

1. Öffnen Sie die Control UI und wählen Sie **MCP**.
2. Prüfen Sie die Übersichtskarten für alle, aktivierte, OAuth- und gefilterte Server.
3. Nutzen Sie jede Serverzeile für Hinweise zu Transport, Authentifizierung, Filter, Zeitlimit und Befehlen.
4. Schalten Sie die Aktivierung um, wenn Sie eine Definition beibehalten, sie jedoch von der Laufzeiterkennung ausschließen möchten.
5. Bearbeiten Sie den begrenzten Konfigurationsabschnitt `mcp` für strukturelle Änderungen wie neue Server, Header, TLS, OAuth-Metadaten oder Werkzeugfilter.
6. Wählen Sie **Speichern**, um nur die Konfiguration dauerhaft zu speichern, oder **Speichern und veröffentlichen**, um sie über den Gateway-Konfigurationspfad anzuwenden.
7. Führen Sie `openclaw mcp doctor --probe` aus, wenn Sie einen Live-Nachweis benötigen, dass der bearbeitete Server startet und Werkzeuge auflistet.

Hinweise:

- Befehlsausschnitte setzen Servernamen in Anführungszeichen, damit auch ungewöhnliche Namen in einer Shell kopierbar bleiben
- angezeigte URL-ähnliche Werte werden vor dem Rendern redigiert, wenn sie eingebettete Anmeldedaten enthalten
- die Seite startet MCP-Transporte nicht selbst
- aktive Laufzeitumgebungen benötigen je nach Prozess, dem die MCP-Clients gehören, möglicherweise `openclaw mcp reload`, eine Veröffentlichung der Gateway-Konfiguration oder einen Prozessneustart

## MCP Apps

OpenClaw kann Werkzeuge rendern, die die stabile [MCP-Apps-Erweiterung](https://modelcontextprotocol.io/extensions/apps) implementieren. Apps müssen ausdrücklich aktiviert werden, da ihr HTML vom konfigurierten MCP-Server stammt und App-sichtbare Werkzeuge oder Ressourcen von demselben Server anfordern kann.

Aktivieren Sie die Host-Bridge:

```bash
openclaw config set mcp.apps.enabled true --strict-json
```

Starten Sie das Gateway nach einer Änderung dieser Einstellung neu. Wenn die Einstellung aktiviert ist, startet OpenClaw einen ausschließlich für die Sandbox vorgesehenen HTTP(S)-Listener auf dem Gateway-Port plus eins (beim standardmäßigen Gateway `18790`). Die Control UI lädt Apps von diesem separaten Ursprung; der Listener stellt niemals die Control UI, authentifizierte Gateway-Routen oder Benutzerdaten bereit.

Direkte Gateway-Verbindungen benötigen Zugriff auf beide Ports. Wenn ein Reverse-Proxy oder TLS-Terminator die Control UI bereitstellt, weisen Sie Apps einen eigenen öffentlichen Ursprung zu und leiten Sie ausschließlich diesen Ursprung an den Sandbox-Listener weiter:

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

Die offizielle einfache React-Demo kann beispielsweise wie folgt konfiguriert werden:

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
- Nur Ressourcen des Typs `ui://` mit exakt dem MIME-Typ `text/html;profile=mcp-app` werden gerendert.
- UI-Ressourcen sind auf 2 MiB begrenzt, werden hinter einem Doppel-iframe-Proxy auf einem eigenen äußeren Ursprung platziert, in einen undurchsichtigen inneren App-Ursprung geladen und durch eine aus den Ressourcenmetadaten abgeleitete CSP beschränkt.
- Ausschließlich für Apps vorgesehene Werkzeuge (`_meta.ui.visibility: ["app"]`) bleiben aus den Werkzeuglisten des Modells ausgeschlossen. Apps können nur App-sichtbare Werkzeuge auf ihrem eigenen Server aufrufen, die außerdem die für den Lauf, der die Ansicht erstellt hat, wirksame OpenClaw-Werkzeugrichtlinie erfüllen.
- An den Ursprung gebundene App-Berechtigungen wie Kamera, Mikrofon und Geolokalisierung werden nicht gewährt, solange innere App-Dokumente zur App-übergreifenden Isolation undurchsichtige Ursprünge verwenden.
- App-HTML, vollständige Werkzeugargumente und Rohergebnisse verbleiben in einer begrenzten, zehnminütigen In-Memory-Ansichtslease und werden weder auf den Datenträger geschrieben noch in die Metadaten der Transkriptvorschau kopiert. Das Transkript speichert nur einen begrenzten Server-, Werkzeug- und Ressourcen-Deskriptor, der an die ursprüngliche Werkzeugaufruf-ID gebunden ist. Nach einem Gateway-Neustart kann die Control UI diesen Deskriptor anhand des authentifizierten Sitzungstranskripts verifizieren und die Ressource `ui://` erneut abrufen; rekonstruierte Ansichten sind schreibgeschützt, bis ein neuer Lauf aktuelle Werkzeugberechtigungen festlegt.
- In Channel-Unterhaltungen fügt die neueste erfolgreiche App-Ansicht eines Durchlaufs der abschließenden Assistentenantwort eine Aktion im Stil von **App öffnen** hinzu. Telegram-Direktnachrichten verwenden eine native Mini-App-Schaltfläche; Slack und Discord rendern dieselbe portable Aktion als Link. Andere Channels behalten den ursprünglichen Antworttext bei und hängen einen verständlichen HTTPS-Link an.
- Channel-Startlinks sind nur verfügbar, wenn die Tailscale-Bereitstellung des Gateways einen veröffentlichten HTTPS-Ursprung vorbereitet hat. `gateway.tailscale.mode: "serve"` ist nur aus dem Tailnet erreichbar; `"funnel"` ist aus dem öffentlichen Internet erreichbar. Ein extern verwalteter Funnel, der durch `gateway.tailscale.preserveFunnel` beibehalten wird, gilt ebenfalls als über das Internet erreichbar. Siehe [Tailscale](/de/gateway/tailscale).
- Starttickets sind undurchsichtig, werden nur beim Erzeugen der abschließenden Channel-Antwort ausgestellt und laufen nach höchstens zwei Minuten oder beim Ablauf der zugrunde liegenden Ansichtslease ab, je nachdem, was zuerst eintritt. Die URL enthält keine Gateway-Bearer-Anmeldedaten, Sitzungsschlüssel, Ansichtsmetadaten, App-HTML, Werkzeugeingaben oder Werkzeugergebnisse.
- Wenn kein veröffentlichter Ursprung oder keine Ticketkapazität verfügbar ist, die Ansicht oder das Ticket abgelaufen ist oder der Transport keine nativen Steuerelemente rendern kann, bleibt der ursprüngliche Assistententext verfügbar. Die Control UI behält ihre bestehende eingebettete App-Zeichenfläche und erhält keine doppelte Startaktion.
- `openclaw security audit` warnt, solange die Bridge aktiviert ist. Deaktivieren Sie sie mit `openclaw config set mcp.apps.enabled false --strict-json`, wenn sie nicht benötigt wird.

## Aktuelle Einschränkungen

Diese Seite dokumentiert die Bridge in ihrem heutigen Auslieferungszustand.

Aktuelle Einschränkungen:

- die Unterhaltungserkennung hängt von vorhandenen Metadaten der Gateway-Sitzungsroute ab
- kein generisches Push-Protokoll über den Claude-spezifischen Adapter hinaus
- noch keine Werkzeuge zum Bearbeiten von Nachrichten oder für Reaktionen
- der HTTP-/SSE-/Streamable-HTTP-Transport stellt eine Verbindung zu einem einzelnen entfernten Server her; noch kein multiplexierter Upstream
- `permissions_list_open` enthält nur Genehmigungen, die beobachtet wurden, während die Bridge verbunden war

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [Plugins](/de/cli/plugins)
