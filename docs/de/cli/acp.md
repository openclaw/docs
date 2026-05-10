---
read_when:
    - ACP-basierte IDE-Integrationen einrichten
    - Debuggen des ACP-Sitzungsroutings zum Gateway
summary: ACP-Bridge für IDE-Integrationen ausführen
title: ACP
x-i18n:
    generated_at: "2026-05-10T19:27:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0614b40723ef8374c5bc26d92516ac5725ae2d8ef5e8f4db360b2259879fe320
    source_path: cli/acp.md
    workflow: 16
---

Führen Sie die [Agent Client Protocol (ACP)](https://agentclientprotocol.com/)-Brücke aus, die mit einem OpenClaw Gateway kommuniziert.

Dieser Befehl spricht ACP über stdio für IDEs und leitet Prompts über WebSocket
an das Gateway weiter. Er hält ACP-Sitzungen Gateway-Sitzungsschlüsseln zugeordnet.

`openclaw acp` ist eine Gateway-gestützte ACP-Brücke, keine vollständige ACP-native Editor-Laufzeitumgebung.
Sie konzentriert sich auf Sitzungsrouting, Prompt-Zustellung und grundlegende Streaming-
Updates.

Wenn Sie möchten, dass ein externer MCP-Client direkt mit OpenClaw-Kanal-
Konversationen spricht, statt eine ACP-Harness-Sitzung zu hosten, verwenden Sie
stattdessen [`openclaw mcp serve`](/de/cli/mcp).

## Was dies nicht ist

Diese Seite wird häufig mit ACP-Harness-Sitzungen verwechselt.

`openclaw acp` bedeutet:

- OpenClaw fungiert als ACP-Server
- eine IDE oder ein ACP-Client verbindet sich mit OpenClaw
- OpenClaw leitet diese Arbeit in eine Gateway-Sitzung weiter

Dies unterscheidet sich von [ACP-Agenten](/de/tools/acp-agents), bei denen OpenClaw ein
externes Harness wie Codex oder Claude Code über `acpx` ausführt.

Schnellregel:

- Editor/Client möchte ACP mit OpenClaw sprechen: Verwenden Sie `openclaw acp`
- OpenClaw soll Codex/Claude/Gemini als ACP-Harness starten: Verwenden Sie `/acp spawn` und [ACP-Agenten](/de/tools/acp-agents)

## Kompatibilitätsmatrix

| ACP-Bereich                                                          | Status                 | Hinweise                                                                                                                                                                                                                                            |
| -------------------------------------------------------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `initialize`, `newSession`, `prompt`, `cancel`                       | Implementiert          | Kernablauf der Brücke über stdio zu Gateway-Chat/Senden + Abbrechen.                                                                                                                                                                                |
| `listSessions`, Slash-Befehle                                        | Implementiert          | Die Sitzungsliste arbeitet gegen den Gateway-Sitzungsstatus mit begrenzter Cursor-Paginierung und `cwd`-Filterung, wenn Gateway-Sitzungszeilen Arbeitsbereichsmetadaten enthalten; Befehle werden über `available_commands_update` angekündigt. |
| `resumeSession`, `closeSession`                                      | Implementiert          | Fortsetzen bindet eine ACP-Sitzung ohne Verlaufwiedergabe erneut an eine vorhandene Gateway-Sitzung. Schließen bricht aktive Brückenarbeit ab, löst ausstehende Prompts als abgebrochen auf und gibt den Brückensitzungsstatus frei.              |
| `loadSession`                                                        | Teilweise              | Bindet die ACP-Sitzung erneut an einen Gateway-Sitzungsschlüssel und gibt den ACP-Ereignisprotokollverlauf für von der Brücke erstellte Sitzungen wieder. Ältere Sitzungen/solche ohne Protokoll fallen auf gespeicherten Benutzer-/Assistententext zurück. |
| Prompt-Inhalt (`text`, eingebettete `resource`, Bilder)              | Teilweise              | Text/Ressourcen werden in Chat-Eingaben abgeflacht; Bilder werden zu Gateway-Anhängen.                                                                                                                                                              |
| Sitzungsmodi                                                         | Teilweise              | `session/set_mode` wird unterstützt, und die Brücke stellt erste Gateway-gestützte Sitzungssteuerungen für Denkstufe, Werkzeugausführlichkeit, Schlussfolgern, Nutzungsdetails und erhöhte Aktionen bereit. Breitere ACP-native Modus-/Konfigurationsoberflächen liegen weiterhin außerhalb des Umfangs. |
| Sitzungsinfo- und Nutzungsupdates                                    | Teilweise              | Die Brücke sendet `session_info_update`- und nach bestem Bemühen `usage_update`-Benachrichtigungen aus zwischengespeicherten Gateway-Sitzungs-Snapshots. Die Nutzung ist ungefähr und wird nur gesendet, wenn Gateway-Token-Gesamtsummen als aktuell markiert sind. |
| Werkzeug-Streaming                                                   | Teilweise              | `tool_call`-/`tool_call_update`-Ereignisse enthalten rohe E/A, Textinhalt und nach bestem Bemühen Dateipositionen, wenn Gateway-Werkzeugargumente/-ergebnisse sie offenlegen. Eingebettete Terminals und reichhaltigere diff-native Ausgabe werden noch nicht bereitgestellt. |
| Ausführungsfreigaben                                                 | Teilweise              | Gateway-Ausführungsfreigabe-Prompts während aktiver ACP-Prompt-Durchläufe werden mit `session/request_permission` an den ACP-Client weitergeleitet.                                                                                                |
| MCP-Server pro Sitzung (`mcpServers`)                                | Nicht unterstützt      | Der Brückenmodus lehnt MCP-Serveranfragen pro Sitzung ab. Konfigurieren Sie MCP stattdessen auf dem OpenClaw-Gateway oder -Agenten.                                                                                                                |
| Client-Dateisystemmethoden (`fs/read_text_file`, `fs/write_text_file`) | Nicht unterstützt    | Die Brücke ruft keine Dateisystemmethoden des ACP-Clients auf.                                                                                                                                                                                      |
| Client-Terminalmethoden (`terminal/*`)                               | Nicht unterstützt      | Die Brücke erstellt keine ACP-Client-Terminals und streamt keine Terminal-IDs durch Werkzeugaufrufe.                                                                                                                                                |
| Sitzungspläne / Gedanken-Streaming                                   | Nicht unterstützt      | Die Brücke gibt derzeit Ausgabetext und Werkzeugstatus aus, keine ACP-Plan- oder Gedankenupdates.                                                                                                                                                   |

## Bekannte Einschränkungen

- `loadSession` kann den vollständigen ACP-Ereignisprotokollverlauf nur für
  von der Brücke erstellte Sitzungen wiedergeben. Ältere Sitzungen/solche ohne Protokoll verwenden weiterhin den Transkript-
  Fallback und rekonstruieren keine historischen Werkzeugaufrufe oder Systemhinweise.
- Wenn mehrere ACP-Clients denselben Gateway-Sitzungsschlüssel teilen, sind Ereignis- und Abbruch-
  Routing nach bestem Bemühen statt streng pro Client isoliert. Bevorzugen Sie die
  standardmäßigen isolierten `acp:<uuid>`-Sitzungen, wenn Sie saubere editorlokale
  Durchläufe benötigen.
- Gateway-Stoppzustände werden in ACP-Stoppgründe übersetzt, aber diese Zuordnung ist
  weniger ausdrucksstark als eine vollständig ACP-native Laufzeitumgebung.
- Erste Sitzungssteuerungen zeigen derzeit eine fokussierte Teilmenge von Gateway-Reglern:
  Denkstufe, Werkzeugausführlichkeit, Schlussfolgern, Nutzungsdetails und erhöhte
  Aktionen. Modellauswahl und Exec-Host-Steuerungen werden noch nicht als ACP-
  Konfigurationsoptionen bereitgestellt.
- `session_info_update` und `usage_update` werden aus Gateway-Sitzungs-
  Snapshots abgeleitet, nicht aus live ACP-nativer Laufzeitabrechnung. Die Nutzung ist ungefähr,
  enthält keine Kostendaten und wird nur ausgegeben, wenn das Gateway Gesamt-Token-
  Daten als aktuell markiert.
- Werkzeug-Begleitdaten erfolgen nach bestem Bemühen. Die Brücke kann Dateipfade anzeigen, die
  in bekannten Werkzeugargumenten/-ergebnissen erscheinen, gibt aber noch keine ACP-Terminals oder
  strukturierten Datei-Diffs aus.
- Die Weiterleitung von Ausführungsfreigaben ist auf den aktiven ACP-Prompt-Durchlauf beschränkt; Freigaben aus
  anderen Gateway-Sitzungen werden ignoriert.

## Verwendung

```bash
openclaw acp

# Remote Gateway
openclaw acp --url wss://gateway-host:18789 --token <token>

# Remote Gateway (token from file)
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Attach to an existing session key
openclaw acp --session agent:main:main

# Attach by label (must already exist)
openclaw acp --session-label "support inbox"

# Reset the session key before the first prompt
openclaw acp --session agent:main:main --reset-session
```

## ACP-Client (Debug)

Verwenden Sie den integrierten ACP-Client, um die Brücke ohne IDE auf Plausibilität zu prüfen.
Er startet die ACP-Brücke und lässt Sie interaktiv Prompts eingeben.

```bash
openclaw acp client

# Point the spawned bridge at a remote Gateway
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Override the server command (default: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

Berechtigungsmodell (Client-Debug-Modus):

- Automatische Freigabe basiert auf einer Zulassungsliste und gilt nur für vertrauenswürdige Kern-Werkzeug-IDs.
- Automatische `read`-Freigabe ist auf das aktuelle Arbeitsverzeichnis beschränkt (`--cwd`, wenn gesetzt).
- ACP gibt nur enge schreibgeschützte Klassen automatisch frei: begrenzte `read`-Aufrufe unter dem aktiven cwd sowie schreibgeschützte Suchwerkzeuge (`search`, `web_search`, `memory_search`). Unbekannte/Nicht-Kern-Werkzeuge, Lesezugriffe außerhalb des Umfangs, ausführungsfähige Werkzeuge, Control-Plane-Werkzeuge, verändernde Werkzeuge und interaktive Abläufe erfordern immer eine explizite Prompt-Freigabe.
- Vom Server bereitgestelltes `toolCall.kind` wird als nicht vertrauenswürdige Metadaten behandelt (nicht als Autorisierungsquelle).
- Diese ACP-Brückenrichtlinie ist von ACPX-Harness-Berechtigungen getrennt. Wenn Sie OpenClaw über das `acpx`-Backend ausführen, ist `plugins.entries.acpx.config.permissionMode=approve-all` der Break-Glass-Schalter „yolo“ für diese Harness-Sitzung.

## Protokoll-Smoke-Test

Starten Sie für Debugging auf Protokollebene ein Gateway mit isoliertem Status und steuern Sie
`openclaw acp` über stdio mit einem ACP-JSON-RPC-Client. Decken Sie `initialize`,
`session/new`, `session/list` mit einem absoluten `cwd`, `session/resume`,
`session/close`, doppeltes Schließen und fehlendes Fortsetzen ab.

Der Nachweis sollte die angekündigten Lebenszyklusfähigkeiten, eine Gateway-gestützte
Sitzungszeile, Update-Benachrichtigungen und das Gateway-Protokoll `sessions.list` enthalten:

```json
{
  "initialize": {
    "protocolVersion": 1,
    "agentCapabilities": {
      "sessionCapabilities": {
        "list": {},
        "resume": {},
        "close": {}
      }
    }
  },
  "listSessions": {
    "sessions": [
      {
        "sessionId": "agent:main:acp-smoke",
        "cwd": "/path/to/workspace",
        "_meta": {
          "sessionKey": "agent:main:acp-smoke",
          "kind": "direct"
        }
      }
    ],
    "nextCursor": null
  },
  "notifications": ["session_info_update", "available_commands_update", "usage_update"],
  "gatewayLogTail": ["[gateway] ready", "[ws] ⇄ res ✓ sessions.list 305ms"]
}
```

Verwenden Sie `openclaw gateway call sessions.list` nicht als einzigen ACP-Nachweis. Dieser
CLI-Pfad kann ein Operator-Scope-Upgrade für ein frisches Token anfordern; die Korrektheit der ACP-Brücke
wird durch ACP-stdio-Frames plus das Gateway-Protokoll `sessions.list` nachgewiesen.

## So verwenden Sie dies

Verwenden Sie ACP, wenn eine IDE (oder ein anderer Client) Agent Client Protocol spricht und Sie möchten,
dass sie eine OpenClaw Gateway-Sitzung steuert.

1. Stellen Sie sicher, dass das Gateway läuft (lokal oder remote).
2. Konfigurieren Sie das Gateway-Ziel (Konfiguration oder Flags).
3. Richten Sie Ihre IDE so ein, dass sie `openclaw acp` über stdio ausführt.

Beispielkonfiguration (persistiert):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

Beispiel für direkte Ausführung (kein Konfigurationsschreibvorgang):

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# preferred for local process safety
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## Agenten auswählen

ACP wählt Agenten nicht direkt aus. Es routet über den Gateway-Sitzungsschlüssel.

Verwenden Sie agentenbezogene Sitzungsschlüssel, um einen bestimmten Agenten anzusteuern:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

Jede ACP-Sitzung wird einem einzelnen Gateway-Sitzungsschlüssel zugeordnet. Ein Agent kann viele
Sitzungen haben; ACP verwendet standardmäßig eine isolierte `acp:<uuid>`-Sitzung, sofern Sie
den Schlüssel oder die Bezeichnung nicht überschreiben.

Pro-Sitzung-`mcpServers` werden im Bridge-Modus nicht unterstützt. Wenn ein ACP-Client
sie während `newSession` oder `loadSession` sendet, gibt die Bridge einen klaren
Fehler zurück, statt sie stillschweigend zu ignorieren.

Wenn ACPX-gestützte Sitzungen OpenClaw-Plugin-Tools oder ausgewählte
integrierte Tools wie `cron` sehen sollen, aktivieren Sie stattdessen die
Gateway-seitigen ACPX-MCP-Bridges, anstatt zu versuchen, Pro-Sitzung-`mcpServers`
zu übergeben. Siehe
[ACP-Agenten](/de/tools/acp-agents-setup#plugin-tools-mcp-bridge) und
[OpenClaw-Tools-MCP-Bridge](/de/tools/acp-agents-setup#openclaw-tools-mcp-bridge).

## Verwendung aus `acpx` (Codex, Claude, andere ACP-Clients)

Wenn ein Coding-Agent wie Codex oder Claude Code über ACP mit Ihrem
OpenClaw-Bot kommunizieren soll, verwenden Sie `acpx` mit seinem integrierten
`openclaw`-Ziel.

Typischer Ablauf:

1. Führen Sie den Gateway aus und stellen Sie sicher, dass die ACP-Bridge ihn erreichen kann.
2. Richten Sie `acpx openclaw` auf `openclaw acp` aus.
3. Geben Sie den OpenClaw-Sitzungsschlüssel an, den der Coding-Agent verwenden soll.

Beispiele:

```bash
# Einmalige Anfrage an Ihre standardmäßige OpenClaw-ACP-Sitzung
acpx openclaw exec "Summarize the active OpenClaw session state."

# Dauerhafte benannte Sitzung für Folge-Interaktionen
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

Wenn `acpx openclaw` jedes Mal einen bestimmten Gateway und Sitzungsschlüssel
ansteuern soll, überschreiben Sie den `openclaw`-Agentenbefehl in
`~/.acpx/config.json`:

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

Für einen repo-lokalen OpenClaw-Checkout verwenden Sie den direkten CLI-Einstiegspunkt
statt des Dev-Runners, damit der ACP-Stream sauber bleibt. Zum Beispiel:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

Dies ist die einfachste Möglichkeit, Codex, Claude Code oder einem anderen
ACP-fähigen Client zu ermöglichen, Kontextinformationen von einem OpenClaw-Agenten
abzurufen, ohne ein Terminal auszulesen.

## Einrichtung des Zed-Editors

Fügen Sie einen benutzerdefinierten ACP-Agenten in `~/.config/zed/settings.json` hinzu (oder verwenden Sie Zeds Einstellungsoberfläche):

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": ["acp"],
      "env": {}
    }
  }
}
```

Um einen bestimmten Gateway oder Agenten anzusteuern:

```json
{
  "agent_servers": {
    "OpenClaw ACP": {
      "type": "custom",
      "command": "openclaw",
      "args": [
        "acp",
        "--url",
        "wss://gateway-host:18789",
        "--token",
        "<token>",
        "--session",
        "agent:design:main"
      ],
      "env": {}
    }
  }
}
```

Öffnen Sie in Zed das Agent-Panel und wählen Sie „OpenClaw ACP“, um einen Thread zu starten.

## Sitzungszuordnung

Standardmäßig erhalten ACP-Sitzungen einen isolierten Gateway-Sitzungsschlüssel mit einem `acp:`-Präfix.
Um eine bekannte Sitzung wiederzuverwenden, übergeben Sie einen Sitzungsschlüssel oder ein Label:

- `--session <key>`: einen bestimmten Gateway-Sitzungsschlüssel verwenden.
- `--session-label <label>`: eine bestehende Sitzung anhand des Labels auflösen.
- `--reset-session`: eine frische Sitzungs-ID für diesen Schlüssel erzeugen (gleicher Schlüssel, neues Transcript).

Wenn Ihr ACP-Client Metadaten unterstützt, können Sie dies pro Sitzung überschreiben:

```json
{
  "_meta": {
    "sessionKey": "agent:main:main",
    "sessionLabel": "support inbox",
    "resetSession": true
  }
}
```

Mehr zu Sitzungsschlüsseln erfahren Sie unter [/concepts/session](/de/concepts/session).

## Optionen

- `--url <url>`: Gateway-WebSocket-URL (standardmäßig gateway.remote.url, wenn konfiguriert).
- `--token <token>`: Gateway-Auth-Token.
- `--token-file <path>`: Gateway-Auth-Token aus Datei lesen.
- `--password <password>`: Gateway-Auth-Passwort.
- `--password-file <path>`: Gateway-Auth-Passwort aus Datei lesen.
- `--session <key>`: Standardsitzungsschlüssel.
- `--session-label <label>`: aufzulösendes Standardsitzungslabel.
- `--require-existing`: fehlschlagen, wenn der Sitzungsschlüssel bzw. das Label nicht existiert.
- `--reset-session`: den Sitzungsschlüssel vor der ersten Verwendung zurücksetzen.
- `--no-prefix-cwd`: Prompts nicht mit dem Arbeitsverzeichnis präfixieren.
- `--provenance <off|meta|meta+receipt>`: ACP-Provenienzmetadaten oder Belege einschließen.
- `--verbose, -v`: ausführliches Logging nach stderr.

Sicherheitshinweis:

- `--token` und `--password` können auf manchen Systemen in lokalen Prozesslisten sichtbar sein.
- Bevorzugen Sie `--token-file`/`--password-file` oder Umgebungsvariablen (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`).
- Die Gateway-Auth-Auflösung folgt dem gemeinsamen Vertrag, der auch von anderen Gateway-Clients verwendet wird:
  - lokaler Modus: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> `gateway.remote.*`-Fallback nur, wenn `gateway.auth.*` nicht gesetzt ist (konfigurierte, aber nicht aufgelöste lokale SecretRefs schlagen sicher fehl)
  - Remote-Modus: `gateway.remote.*` mit env/config-Fallback gemäß Remote-Prioritätsregeln
  - `--url` ist überschreibungssicher und verwendet keine impliziten config/env-Anmeldedaten erneut; übergeben Sie explizit `--token`/`--password` (oder Dateivarianten)
- Unterprozesse des ACP-Runtime-Backends erhalten `OPENCLAW_SHELL=acp`, was für kontextspezifische Shell-/Profilregeln verwendet werden kann.
- `openclaw acp client` setzt `OPENCLAW_SHELL=acp-client` für den gestarteten Bridge-Prozess.

### Optionen für `acp client`

- `--cwd <dir>`: Arbeitsverzeichnis für die ACP-Sitzung.
- `--server <command>`: ACP-Serverbefehl (Standard: `openclaw`).
- `--server-args <args...>`: zusätzliche Argumente, die an den ACP-Server übergeben werden.
- `--server-verbose`: ausführliches Logging auf dem ACP-Server aktivieren.
- `--verbose, -v`: ausführliches Client-Logging.

## Verwandt

- [CLI-Referenz](/de/cli)
- [ACP-Agenten](/de/tools/acp-agents)
