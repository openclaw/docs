---
read_when:
    - ACP-basierte IDE-Integrationen einrichten
    - Debugging der ACP-Sitzungsweiterleitung an das Gateway
summary: ACP-Bridge für IDE-Integrationen ausführen
title: ACP
x-i18n:
    generated_at: "2026-07-12T01:27:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: becdcfdd1cc62b206cc92e9b8248c79a2ff63cfc3779d8a124b9713e779ad33c
    source_path: cli/acp.md
    workflow: 16
---

Führen Sie die Brücke für das [Agent Client Protocol (ACP)](https://agentclientprotocol.com/) aus, die mit einem OpenClaw Gateway kommuniziert.

`openclaw acp` verwendet ACP über stdio für IDEs und leitet Prompts über WebSocket an den Gateway weiter, wobei ACP-Sitzungen Gateway-Sitzungsschlüsseln zugeordnet bleiben. Es handelt sich um eine Gateway-gestützte ACP-Brücke und nicht um eine vollständig ACP-native Editor-Laufzeit: Der Schwerpunkt liegt auf Sitzungsrouting, Prompt-Übermittlung und Streaming-Aktualisierungen.

Wenn ein externer MCP-Client direkt mit OpenClaw-Kanalunterhaltungen kommunizieren soll, anstatt eine ACP-Harness-Sitzung bereitzustellen, verwenden Sie stattdessen [`openclaw mcp serve`](/de/cli/mcp).

## Was dies nicht ist

`openclaw acp` bedeutet, dass OpenClaw als ACP-Server fungiert: Eine IDE oder ein ACP-Client verbindet sich mit OpenClaw, und OpenClaw leitet die Arbeit an eine Gateway-Sitzung weiter.

Dies unterscheidet sich von [ACP-Agenten](/de/tools/acp-agents), bei denen OpenClaw über `acpx` ein externes Harness wie Codex oder Claude Code ausführt.

Kurzregel:

- Editor/Client möchte über ACP mit OpenClaw kommunizieren: Verwenden Sie `openclaw acp`
- OpenClaw soll Codex/Claude/Gemini als ACP-Harness starten: Verwenden Sie `/acp spawn` und [ACP-Agenten](/de/tools/acp-agents)

## Kompatibilitätsmatrix

| ACP-Bereich                                                            | Status                | Hinweise                                                                                                                                                                                                                                      |
| ---------------------------------------------------------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `initialize`, `newSession`, `prompt`, `cancel`                         | Implementiert         | Kernablauf der Brücke über stdio zu Gateway-Chat/Senden und Abbruch.                                                                                                                                                                           |
| `listSessions`, Slash-Befehle                                          | Implementiert         | Die Sitzungsliste arbeitet mit dem Gateway-Sitzungsstatus, begrenzter Cursor-Paginierung und `cwd`-Filterung, wenn Gateway-Sitzungszeilen Arbeitsbereichsmetadaten enthalten; Befehle werden über `available_commands_update` angekündigt.        |
| Metadaten zur Sitzungshierarchie                                       | Implementiert         | Sitzungslisten und Momentaufnahmen der Sitzungsinformationen enthalten die über- und untergeordneten OpenClaw-Beziehungen in `_meta`, sodass ACP-Clients Subagent-Diagramme ohne private Gateway-Seitenkanäle darstellen können.                |
| `resumeSession`, `closeSession`                                        | Implementiert         | Beim Fortsetzen wird eine ACP-Sitzung ohne erneute Wiedergabe des Verlaufs an eine vorhandene Gateway-Sitzung gebunden. Das Schließen bricht aktive Brückenarbeit ab, löst ausstehende Prompts als abgebrochen auf und gibt den Sitzungsstatus der Brücke frei. |
| `loadSession`                                                          | Teilweise unterstützt | Bindet die ACP-Sitzung erneut an einen Gateway-Sitzungsschlüssel und gibt den ACP-Ereignisprotokollverlauf für von der Brücke erstellte Sitzungen wieder. Ältere Sitzungen oder Sitzungen ohne Protokoll greifen auf gespeicherten Benutzer-/Assistententext zurück. |
| Prompt-Inhalt (`text`, eingebettete `resource`, Bilder)                | Teilweise unterstützt | Text und Ressourcen werden zu Chat-Eingaben zusammengeführt; Bilder werden zu Gateway-Anhängen.                                                                                                                                               |
| Sitzungsmodi                                                           | Teilweise unterstützt | `session/set_mode` wird unterstützt; die Brücke stellt Gateway-gestützte Sitzungssteuerungen für Gedankentiefe, Werkzeugausführlichkeit, Schlussfolgerungen, Nutzungsdetails und privilegierte Aktionen bereit. Umfassendere ACP-native Modus-/Konfigurationsoberflächen liegen weiterhin außerhalb des Umfangs. |
| Gedanken-Streaming                                                     | Implementiert         | Denkinhalte des Modells werden als `agent_thought_chunk`-Sitzungsaktualisierungen gestreamt. ACP-native Sitzungspläne werden nicht ausgegeben.                                                                                                 |
| Sitzungsinformationen und Nutzungsaktualisierungen                     | Teilweise unterstützt | Die Brücke sendet `session_info_update`- und nach bestem Bemühen `usage_update`-Benachrichtigungen aus zwischengespeicherten Gateway-Sitzungsmomentaufnahmen. Die Nutzung ist näherungsweise und wird nur gesendet, wenn die Gateway-Token-Gesamtwerte als aktuell markiert sind. |
| Werkzeug-Streaming                                                     | Teilweise unterstützt | `tool_call`-/`tool_call_update`-Ereignisse enthalten rohe Ein-/Ausgaben, Textinhalte und nach bestem Bemühen Dateispeicherorte, wenn diese aus Gateway-Werkzeugargumenten/-ergebnissen hervorgehen. Eingebettete Terminals und umfangreichere Diff-native Ausgaben werden nicht bereitgestellt. |
| Ausführungsgenehmigungen                                               | Teilweise unterstützt | Aufforderungen des Gateway zur Genehmigung von Ausführungen während aktiver ACP-Prompt-Durchläufe werden mit `session/request_permission` an den ACP-Client weitergeleitet.                                                                    |
| Sitzungsbezogene MCP-Server (`mcpServers`)                             | Nicht unterstützt     | Der Brückenmodus lehnt Anfragen für sitzungsbezogene MCP-Server ab. Konfigurieren Sie MCP stattdessen auf dem OpenClaw Gateway oder Agenten.                                                                                                   |
| Client-Dateisystemmethoden (`fs/read_text_file`, `fs/write_text_file`) | Nicht unterstützt     | Die Brücke ruft keine Dateisystemmethoden des ACP-Clients auf.                                                                                                                                                                                 |
| Client-Terminalmethoden (`terminal/*`)                                 | Nicht unterstützt     | Die Brücke erstellt keine Terminals des ACP-Clients und streamt keine Terminal-IDs über Werkzeugaufrufe.                                                                                                                                       |

## Bekannte Einschränkungen

- `loadSession` gibt den vollständigen ACP-Ereignisprotokollverlauf nur für von der Brücke erstellte Sitzungen wieder. Ältere Sitzungen oder Sitzungen ohne Protokoll verwenden den Transkript-Rückgriff und rekonstruieren keine früheren Werkzeugaufrufe oder Systemhinweise.
- Wenn mehrere ACP-Clients denselben Gateway-Sitzungsschlüssel verwenden, erfolgt das Routing von Ereignissen und Abbrüchen nach bestem Bemühen und nicht streng isoliert pro Client. Bevorzugen Sie die standardmäßig isolierten `acp-bridge:<uuid>`-Sitzungen, wenn Sie sauber getrennte editorlokale Durchläufe benötigen.
- Gateway-Stoppzustände werden in ACP-Stoppgründe übersetzt, diese Zuordnung ist jedoch weniger ausdrucksstark als bei einer vollständig ACP-nativen Laufzeit.
- Die Sitzungssteuerungen stellen eine gezielte Teilmenge der Gateway-Optionen bereit: Gedankentiefe, Werkzeugausführlichkeit, Schlussfolgerungen, Nutzungsdetails und privilegierte Aktionen. Modellauswahl und Steuerungen des Ausführungshosts werden nicht als ACP-Konfigurationsoptionen bereitgestellt.
- `session_info_update` und `usage_update` werden aus Gateway-Sitzungsmomentaufnahmen abgeleitet und nicht aus einer laufenden ACP-nativen Laufzeitabrechnung. Die Nutzung ist näherungsweise, enthält keine Kostendaten und wird nur ausgegeben, wenn der Gateway die Gesamt-Token-Daten als aktuell markiert.
- Begleitdaten zu Werkzeugen werden nach bestem Bemühen bereitgestellt: Die Brücke gibt Dateipfade aus, die in bekannten Werkzeugargumenten/-ergebnissen vorkommen, erzeugt jedoch keine ACP-Terminals oder strukturierten Datei-Diffs.
- Die Weiterleitung von Ausführungsgenehmigungen ist auf den aktiven ACP-Prompt-Durchlauf beschränkt; Genehmigungen aus anderen Gateway-Sitzungen werden ignoriert.

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

## ACP-Client (Debugging)

Verwenden Sie den integrierten ACP-Client, um die Brücke ohne IDE einer Plausibilitätsprüfung zu unterziehen. Er startet die ACP-Brücke und ermöglicht Ihnen die interaktive Eingabe von Prompts.

```bash
openclaw acp client

# Point the spawned bridge at a remote Gateway
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Override the server command (default: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

Berechtigungsmodell (Client-Debugmodus):

- Die automatische Genehmigung basiert auf einer Positivliste und gilt nur für vertrauenswürdige Kern-Werkzeug-IDs.
- Die automatische Genehmigung von `read` ist auf das aktuelle Arbeitsverzeichnis beschränkt (`--cwd`, sofern festgelegt).
- ACP genehmigt nur eng begrenzte schreibgeschützte Klassen automatisch: begrenzte `read`-Aufrufe unterhalb des aktiven Arbeitsverzeichnisses sowie schreibgeschützte Suchwerkzeuge (`search`, `web_search`, `memory_search`). Unbekannte oder nicht zum Kern gehörende Werkzeuge, Lesezugriffe außerhalb des Geltungsbereichs, ausführungsfähige Werkzeuge, Steuerungsebenenwerkzeuge, verändernde Werkzeuge und interaktive Abläufe erfordern immer eine ausdrückliche Prompt-Genehmigung.
- Das vom Server bereitgestellte `toolCall.kind` wird als nicht vertrauenswürdiges Metadatum und nicht als Autorisierungsquelle behandelt.
- Diese Richtlinie der ACP-Brücke ist von den Berechtigungen des ACPX-Harness getrennt. Wenn Sie OpenClaw über das `acpx`-Backend ausführen, ist `plugins.entries.acpx.config.permissionMode=approve-all` der Notfallschalter „yolo“ für diese Harness-Sitzung.

## Protokoll-Smoke-Test

Starten Sie für das Debugging auf Protokollebene einen Gateway mit isoliertem Status und steuern Sie `openclaw acp` über stdio mit einem ACP-JSON-RPC-Client. Decken Sie `initialize`, `session/new`, `session/list` mit einem absoluten `cwd`, `session/resume`, `session/close`, doppeltes Schließen und fehlendes Fortsetzen ab.

Der Nachweis sollte die angekündigten Lebenszyklusfähigkeiten, eine Gateway-gestützte Sitzungszeile, Aktualisierungsbenachrichtigungen und das Gateway-Protokoll `sessions.list` enthalten:

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

Verwenden Sie nicht ausschließlich `openclaw gateway call sessions.list` als ACP-Nachweis. Dieser CLI-Pfad kann eine Operator-Bereichserweiterung mit einem neuen Token anfordern; die Korrektheit der ACP-Brücke wird durch ACP-stdio-Frames zusammen mit dem Gateway-Protokoll `sessions.list` nachgewiesen.

## Verwendungsmöglichkeiten

Verwenden Sie ACP, wenn eine IDE oder ein anderer Client das Agent Client Protocol verwendet und damit eine OpenClaw-Gateway-Sitzung steuern soll.

1. Stellen Sie sicher, dass der Gateway ausgeführt wird (lokal oder remote).
2. Konfigurieren Sie das Gateway-Ziel (Konfiguration oder Flags).
3. Konfigurieren Sie Ihre IDE so, dass sie `openclaw acp` über stdio ausführt.

Beispielkonfiguration (dauerhaft gespeichert):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

Beispiel für direkte Ausführung (ohne Schreiben der Konfiguration):

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# preferred for local process safety
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## Agenten auswählen

ACP wählt Agenten nicht direkt aus. Das Routing erfolgt anhand des Gateway-Sitzungsschlüssels. Verwenden Sie agentenspezifische Sitzungsschlüssel, um einen bestimmten Agenten anzusprechen:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

Jede ACP-Sitzung wird einem einzelnen Gateway-Sitzungsschlüssel zugeordnet. Ein Agent kann über viele Sitzungen verfügen; ACP verwendet standardmäßig eine isolierte `acp-bridge:<uuid>`-Sitzung, sofern Sie den Schlüssel oder die Bezeichnung nicht überschreiben.

`mcpServers` pro Sitzung werden im Bridge-Modus nicht unterstützt. Wenn ein ACP-Client sie während `newSession` oder `loadSession` sendet, gibt die Bridge einen eindeutigen Fehler zurück, anstatt sie stillschweigend zu ignorieren.

Wenn ACPX-gestützte Sitzungen auf OpenClaw-Plugin-Tools oder ausgewählte integrierte Tools wie `cron` zugreifen sollen, aktivieren Sie die Gateway-seitigen ACPX-MCP-Bridges, anstatt zu versuchen, `mcpServers` pro Sitzung zu übergeben. Siehe [ACP-Agenten](/de/tools/acp-agents-setup#plugin-tools-mcp-bridge) und [MCP-Bridge für OpenClaw-Tools](/de/tools/acp-agents-setup#openclaw-tools-mcp-bridge).

## Verwendung über `acpx` (Codex, Claude und andere ACP-Clients)

Wenn ein Coding-Agent wie Codex oder Claude Code über ACP mit Ihrem OpenClaw-Bot kommunizieren soll, verwenden Sie `acpx` mit dem integrierten Ziel `openclaw`.

Typischer Ablauf:

1. Starten Sie das Gateway und stellen Sie sicher, dass die ACP-Bridge es erreichen kann.
2. Richten Sie `acpx openclaw` auf `openclaw acp`.
3. Geben Sie den OpenClaw-Sitzungsschlüssel an, den der Coding-Agent verwenden soll.

Beispiele:

```bash
# One-shot request into your default OpenClaw ACP session
acpx openclaw exec "Summarize the active OpenClaw session state."

# Persistent named session for follow-up turns
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

Wenn `acpx openclaw` jedes Mal ein bestimmtes Gateway und einen bestimmten Sitzungsschlüssel verwenden soll, überschreiben Sie den Agentenbefehl `openclaw` in `~/.acpx/config.json`:

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

Verwenden Sie für einen repository-lokalen OpenClaw-Checkout den direkten CLI-Einstiegspunkt anstelle des Entwicklungs-Runners, damit der ACP-Stream unverfälscht bleibt:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

Dies ist die einfachste Möglichkeit, Codex, Claude Code oder einem anderen ACP-fähigen Client zu erlauben, Kontextinformationen von einem OpenClaw-Agenten abzurufen, ohne ein Terminal auszulesen.

## Einrichtung im Zed-Editor

Fügen Sie in `~/.config/zed/settings.json` einen benutzerdefinierten ACP-Agenten hinzu (oder verwenden Sie die Einstellungsoberfläche von Zed):

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

So verwenden Sie ein bestimmtes Gateway oder einen bestimmten Agenten:

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

Öffnen Sie in Zed den Agentenbereich und wählen Sie "OpenClaw ACP" aus, um einen Thread zu starten.

## Sitzungszuordnung

Standardmäßig erhalten ACP-Bridge-Sitzungen einen isolierten Gateway-Sitzungsschlüssel mit dem Präfix `acp-bridge:`. Diese Bridge-Sitzungen für normale Modelle sind synthetisch und temporär: Sie unterliegen der Bereinigung veralteter Einträge und werden nicht als geschützte Oberflächen für menschliche Unterhaltungen behandelt. Um eine bekannte Sitzung wiederzuverwenden, übergeben Sie einen Sitzungsschlüssel oder eine Bezeichnung:

- `--session <key>`: einen bestimmten Gateway-Sitzungsschlüssel verwenden.
- `--session-label <label>`: eine vorhandene Sitzung anhand ihrer Bezeichnung auflösen.
- `--reset-session`: eine neue Sitzungs-ID für diesen Schlüssel erzeugen (gleicher Schlüssel, neues Transkript).

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

Weitere Informationen zu Sitzungsschlüsseln finden Sie unter [/concepts/session](/de/concepts/session).

## Optionen

- `--url <url>`: Gateway-WebSocket-URL (standardmäßig `gateway.remote.url`, sofern konfiguriert).
- `--token <token>`: Authentifizierungstoken des Gateways.
- `--token-file <path>`: Authentifizierungstoken des Gateways aus einer Datei lesen.
- `--password <password>`: Authentifizierungspasswort des Gateways.
- `--password-file <path>`: Authentifizierungspasswort des Gateways aus einer Datei lesen.
- `--session <key>`: standardmäßiger Sitzungsschlüssel.
- `--session-label <label>`: standardmäßig aufzulösende Sitzungsbezeichnung.
- `--require-existing`: mit einem Fehler abbrechen, wenn der Sitzungsschlüssel oder die Sitzungsbezeichnung nicht vorhanden ist.
- `--reset-session`: den Sitzungsschlüssel vor der ersten Verwendung zurücksetzen.
- `--no-prefix-cwd`: Prompts nicht das Arbeitsverzeichnis voranstellen.
- `--provenance <off|meta|meta+receipt>`: ACP-Herkunftsmetadaten oder -Belege einbeziehen.
- `--verbose, -v`: ausführliche Protokollierung nach stderr.

Sicherheitshinweis:

- `--token` und `--password` können auf einigen Systemen in lokalen Prozesslisten sichtbar sein. Verwenden Sie vorzugsweise `--token-file`/`--password-file` oder Umgebungsvariablen (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`).
- Die Auflösung der Gateway-Authentifizierung folgt dem gemeinsamen Vertrag, den auch andere Gateway-Clients verwenden:
  - lokaler Modus: zuerst Umgebungsvariablen (`OPENCLAW_GATEWAY_*`), dann `gateway.auth.*`; nur wenn `gateway.auth.*` nicht gesetzt ist, wird auf `gateway.remote.*` zurückgegriffen (eine konfigurierte, aber nicht auflösbare lokale SecretRef führt zu einem sicheren Abbruch, anstatt stillschweigend auf eine Alternative zurückzugreifen)
  - Remote-Modus: `gateway.remote.*` mit Rückgriff auf Umgebungsvariablen oder Konfiguration gemäß den Prioritätsregeln für Remote-Verbindungen
  - `--url` kann sicher überschrieben werden und verwendet keine impliziten Anmeldedaten aus Konfiguration oder Umgebung erneut; übergeben Sie explizit `--token`/`--password` (oder die Dateivarianten)

### Optionen für `acp client`

- `--cwd <dir>`: Arbeitsverzeichnis für die ACP-Sitzung.
- `--server <command>`: ACP-Serverbefehl (Standard: `openclaw`).
- `--server-args <args...>`: zusätzliche Argumente, die an den ACP-Server übergeben werden.
- `--server-verbose`: ausführliche Protokollierung auf dem ACP-Server aktivieren.
- `--verbose, -v`: ausführliche Client-Protokollierung.
- `openclaw acp client` setzt im gestarteten Bridge-Prozess `OPENCLAW_SHELL=acp-client`, was für kontextspezifische Shell-/Profilregeln verwendet werden kann.

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [ACP-Agenten](/de/tools/acp-agents)
