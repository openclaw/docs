---
read_when:
    - Konzeption der Codex-Flottenüberwachung
    - OpenClaw-Tools erstellen, die Codex-Sitzungen lesen, steuern oder starten
    - Auswahl zwischen lokaler, Cloudflare- und VPS-Bereitstellung für beaufsichtigten Codex
summary: Plan zur Flottenüberwachung für Codex-App-Server-Sitzungen, die von OpenClaw gesteuert werden.
title: Claw-Supervisor
x-i18n:
    generated_at: "2026-06-27T18:13:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ecdd58730011c94796c6df1d757606aad7112d2f36f30921541ac7f5d46ad91f
    source_path: specs/claw-supervisor.md
    workflow: 16
---

# Claw Supervisor

## Ziel

Claw Supervisor ermöglicht es einer dauerhaft laufenden OpenClaw-Instanz, eine Flotte von Codex-Sitzungen zu überwachen und zu steuern, ohne die normale Codex-Nutzererfahrung zu verändern. Ein Nutzer kann per SSH auf einen Host zugreifen, Codex starten, in der TUI arbeiten und dennoch kann der Supervisor die Sitzung lesen, steuern, unterbrechen, zugehörige Sitzungen starten und Übergaben annehmen. Codex-Sitzungen können außerdem über MCP in OpenClaw zurückrufen.

## Produktmodell

Codex bleibt die primäre Arbeitsoberfläche. OpenClaw überwacht Codex, statt Codex in einem undurchsichtigen OpenClaw-Subagent zu verstecken.

Das OpenClaw-Plugin heißt `codex-supervisor`. `crabfleet` bleibt das Bereitstellungs-
und Host-Flottenprofil für CRAB-Maschinen und ist nicht der wiederverwendbare Plugin-Name.

Das Modell hat drei Rollen:

- Menschlich angebundenes Codex: eine normale interaktive Codex-TUI, die über einen gemeinsamen App-Server gestartet wird.
- Autonomes Codex: ein vom Supervisor gestarteter Codex-App-Server-Thread, an den sich ein Mensch später anhängen kann.
- Supervisor-Claw: ein dauerhaft laufender OpenClaw-Agent mit Werkzeugen für Flottenzustand, Transkriptlesung, Steuerung, Unterbrechung, Starten und Übergabe.

OpenClaw kann intern seine vorhandene Subagent-Mechanik verwenden, aber der externe Vertrag ist eine anhängbare Codex-Sitzung mit einer Codex-Thread-ID.

## Architektur

```text
user SSH session
  -> codex --remote unix://... or ws://...
      -> local codex app-server daemon
          <-> host sidecar / supervisor connector
              <-> OpenClaw fleet supervisor
                  <-> supervisor MCP exposed back to Codex
```

Jeder Codex-fähige Host führt Folgendes aus:

- Codex-App-Server-Daemon.
- Einen Launcher, der interaktives Codex immer mit `--remote` startet.
- Einen Connector, der App-Server-Endpunkte und Live-Threads beim Supervisor registriert.

Der Supervisor führt Folgendes aus:

- Endpunkt-Registry.
- Sitzungs-Registry.
- Codex-App-Server-JSON-RPC-Client-Pool.
- MCP-Server für Codex-zu-Claw-Aufrufe.
- OpenClaw-Werkzeuge für Claw-zu-Codex-Steuerung.
- Policy Engine für autonome Aktionen, Genehmigungen und Schleifenvermeidung.

## Codex-App-Server-Vertrag

Verwenden Sie Codex-App-Server-APIs als kanonische Steuerungsebene:

- `initialize`, `initialized`
- `thread/loaded/list`
- `thread/list`
- `thread/read`
- `thread/resume`
- `thread/start`
- `turn/start`
- `turn/steer`
- `turn/interrupt`
- `model/list`

Interaktives Codex muss mit `codex --remote <endpoint>` gestartet werden, damit die TUI und der Supervisor mit demselben App-Server verbunden sind. Eigenständiges `codex exec` ist heute keine live geteilte Sitzung; verwenden Sie App-Server-APIs für autonome Arbeit, bis Codex `exec --remote` unterstützt.

## Sitzungs-Registry

Der Supervisor speichert einen Datensatz pro beobachtetem Codex-Thread:

```json
{
  "sessionId": "codex-thread-id",
  "endpointId": "host-a",
  "host": "host-a.example",
  "workspace": "/workspace/repo",
  "repo": "owner/repo",
  "branch": "feature/example",
  "source": "vscode",
  "status": "idle",
  "humanAttached": true,
  "lastSeenAt": "2026-05-28T10:00:00.000Z",
  "summary": "Short working-state summary"
}
```

Die lokale Implementierung kann die meisten Felder aus den Codex-Thread-Metadaten ableiten. Die Flottenbereitstellung sollte Datensätze um Host-Identität, Nutzer-Anbindungszustand, Git-Zustand und Sidecar-Zustand anreichern.

## MCP-Oberfläche für Codex

Jedes überwachte Codex erhält einen MCP-Server namens `openclaw-codex-supervisor`.

Werkzeuge:

- `codex_sessions_list`: sichtbare Codex-Sitzungen auflisten.
- `codex_session_read`: ein Transkript lesen.
- `codex_session_send`: eine Nachricht an einen inaktiven Thread senden oder einen aktiven Thread steuern.
- `codex_session_interrupt`: den aktiven Turn unterbrechen.
- `codex_endpoint_probe`: Endpunktverbindung prüfen.
- `claw_report_progress`: aktuellen Aufgabenstatus beim Supervisor veröffentlichen.
- `claw_ask`: den Supervisor um Hilfe oder Delegation bitten.
- `codex_spawn`: eine neue autonome Codex-Sitzung erstellen.
- `codex_handoff`: menschliche oder Peer-Übernahme anfordern.

Ressourcen:

- `codex://sessions`
- `codex://sessions/{sessionId}`
- `codex://sessions/{sessionId}/transcript`

## Claw-Steuerungsoberfläche

Der dauerhaft laufende Claw erhält dieselben Primitive wie interne Werkzeuge:

- Sitzungen und Endpunkte auflisten
- Transkripte lesen
- Text senden/steuern
- aktive Arbeit unterbrechen
- neue Sitzungen starten
- Sitzungen zusammenfassen und zuweisen
- Anweisungen an eine gefilterte Gruppe übertragen
- Sitzungen als blockiert, erledigt oder aufgegeben markieren

Werkzeugverhalten:

- Wenn ein Ziel-Thread inaktiv ist, wird `codex_session_send` auf `turn/start` abgebildet.
- Wenn ein Ziel-Thread aktiv ist und eine laufende Turn-ID sichtbar ist, wird es auf `turn/steer` abgebildet.
- Wenn der aktive Turn nicht identifiziert werden kann, schlägt das Werkzeug geschlossen fehl, statt einen unabhängigen Turn zu erstellen.
- Über Codex offengelegte MCP-Schreibsteuerungen bleiben deaktiviert, sofern sie nicht durch eine vertrauenswürdige, nur für den Supervisor geltende Policy aktiviert werden.
- Rohes Transkriptlesen bleibt deaktiviert, sofern es nicht durch eine vertrauenswürdige, nur für den Supervisor geltende Policy aktiviert wird.
- Autonome Genehmigungs-Defaults verweigern Werkzeug-/Dateigenehmigungen, sofern keine explizite Policy etwas anderes festlegt.

## Startablauf

Interaktive Host-Anmeldung:

1. Nutzer stellt per SSH eine Verbindung zu einem CRAB-Host her.
2. Der SSH-Dienst startet oder verifiziert `codex app-server daemon start`.
3. Der Login-Wrapper startet `codex --remote unix:// --cd <workspace>`.
4. Der Host-Connector registriert Endpunkt und geladenen Thread.
5. Der Supervisor sendet ein Flottenereignis mit hoher Priorität aus: neue Codex-Sitzung, Workspace, menschlich angebundener Zustand, aktuelle Aufgabenvorschau.
6. Supervisor-Claw kann sofort lesen und steuern.

Autonomer Start:

1. Supervisor wählt Host und Workspace aus.
2. Host-Connector öffnet oder setzt einen Codex-App-Server-Thread fort.
3. Supervisor startet den ersten Turn mit Aufgabentext und MCP-Konfiguration.
4. Die Sitzungs-Registry markiert ihn als autonom und anhängbar.
5. Ein Mensch kann später mit `codex --remote <endpoint> resume <threadId>` anhängen, sobald Codex diese genaue UX unterstützt, oder über den aktuellen Fortsetzungsablauf auf demselben App-Server.

## Bereitstellung

Bevorzugte Steuerungsebene:

- Host-Connectors halten ausgehende WebSocket-Verbindungen zum Supervisor.
- Supervisor-Zustand liegt im OpenClaw-Gateway-Speicher.
- Der Codex-App-Server bleibt lokal auf jedem Host; legen Sie niemals einen rohen, nicht authentifizierten App-Server im öffentlichen Internet offen.

Cloudflare-Eignung:

- Gut für Registry, Durable Objects, WebSocket-Fan-in, leichtgewichtiges Ereignis-Routing und öffentliche MCP-/Gateway-Endpunkte.
- Allein nicht ausreichend für direkte private Host-Steuerung, weil Workers keine beliebigen privaten Unix-Sockets oder local loopback-App-Server anwählen können.
- Verwenden Sie Cloudflare, wenn jeder Host-Connector per ausgehendem WebSocket nach Hause telefoniert.

VPS-Fallback:

- Verwenden Sie einen Hetzner-Dienst, wenn langlebige Prozesssteuerung, SSH-Tunnel, privates Netzwerk-Routing oder lokaler Dateisystemzugriff erforderlich ist.
- Behalten Sie dasselbe Protokoll bei: Host-Connectors ausgehend, Supervisor-Registry zentral, Codex-App-Server lokal.

## Sicherheit

- Standardbindung ist ein lokaler Unix-Socket.
- Remote-App-Server verwendet Token- oder signierte Bearer-Authentifizierung.
- Host-Connector authentifiziert sich beim Supervisor mit einem bereichsgebundenen Host-Token.
- Supervisor-Werkzeuge erzwingen sitzungsbezogene Policy: Lesen, Steuern, Unterbrechen, Starten, Genehmigung.
- Cross-Agent-Nachrichten enthalten `originSessionId`; Selbst-Echos werden verworfen.
- Broadcast erfordert einen expliziten Filter und eine begrenzte Zielanzahl.
- Transkriptlesungen schwärzen Secrets an der OpenClaw-Grenze.
- Genehmigungsanforderungen werden für vom Supervisor ausgehende Turns standardmäßig verweigert, sofern die Policy sie nicht erlaubt.

## Implementierungsplan

Phase 1: Lokaler Supervisor-MVP

- Codex-App-Server-JSON-RPC-Client für stdio-Proxy- und WebSocket-Endpunkte hinzufügen.
- Supervisor-Endpunkt-/Sitzungs-Registry hinzufügen.
- MCP-Werkzeuge hinzufügen: Auflisten, Lesen, Senden, Unterbrechen, Prüfen.
- Lokale Env-Konfiguration für Endpunkte hinzufügen.
- Tests mit Fake-App-Server und einen Live-Smoke-Test mit lokalem App-Server hinzufügen.

Phase 2: OpenClaw-Integration

- Supervisor-Werkzeuge im `codex-supervisor`-Plugin registrieren.
- Supervisor-MCP in die Codex-Thread-Konfiguration injizieren.
- Sitzungszusammenfassungen zum Agent-Kontext hinzufügen.
- Ereignisbenachrichtigungen hinzufügen, wenn neue Codex-Threads erscheinen.
- Policy-Konfiguration für autonomes Senden/Unterbrechen/Starten hinzufügen.

Phase 3: Flotten-Connector

- Host-Sidecar registriert App-Server-Endpunkt, Host-Metadaten, Git-/Workspace-Metadaten und menschlichen Anbindungszustand.
- Ausgehenden WebSocket-Connector für Cloudflare- oder VPS-Steuerungsebene hinzufügen.
- Wiederverbindung, Heartbeat und Bereinigung veralteter Sitzungen hinzufügen.
- CRAB-SSH-Launcher-Wrapper hinzufügen.

Phase 4: Autonomer Betrieb

- Start-/Fortsetzungs-/Übernahmeabläufe hinzufügen.
- Broadcast und Delegation hinzufügen.
- Fortschrittsberichte und Aufgabenstatus-Zusammenfassungen hinzufügen.
- Schleifenvermeidung und Ratenbegrenzungen hinzufügen.
- Dashboard-Ansichten hinzufügen.

Phase 5: Multi-Claw

- Sitzungen nach Gruppe sharden.
- Leadership/Lease für jede Sitzung hinzufügen.
- Audit-Log und Replay hinzufügen.
- Eskalation zwischen Claw-Gruppen hinzufügen.

## Abnahmetests

- Ein Mensch startet die Codex-TUI über einen gemeinsamen App-Server.
- Supervisor listet den Live-Thread über `thread/loaded/list` auf.
- Supervisor liest das Transkript über `thread/read`.
- Supervisor sendet Text über `turn/start` an einen inaktiven Thread.
- Supervisor steuert einen aktiven Thread über `turn/steer`.
- Supervisor-Unterbrechung stoppt einen aktiven Turn über `turn/interrupt`.
- Codex ruft Supervisor-MCP auf und listet Peer-Sitzungen.
- Ein autonomes Codex wird gestartet und später menschlich angebunden.
- Verlorener Host-Connector markiert Sitzungen als veraltet, ohne den Verlauf zu löschen.

## Offene Fragen

- Genaue Codex-TUI-Anhänge-UX für einen App-Server-Thread, der ohne TUI gestartet wurde.
- Ob Codex `exec --remote` für headless live geteilte Läufe hinzufügen sollte.
- Eigentümer für dauerhaften Zustand: OpenClaw-Gateway-DB, Cloudflare Durable Object oder VPS-Datenbank.
- Granularität der Genehmigungs-Policy für vom Supervisor ausgehende Turns.
- Wie viel Transkriptzusammenfassung in den dauerhaft laufenden Claw-Kontext injiziert werden sollte, statt als Werkzeug/Ressource vorgehalten zu werden.
