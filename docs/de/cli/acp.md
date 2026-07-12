---
read_when:
    - ACP-basierte IDE-Integrationen einrichten
    - Debugging des ACP-Sitzungsroutings zum Gateway
summary: ACP-Bridge für IDE-Integrationen ausführen
title: ACP
x-i18n:
    generated_at: "2026-07-12T15:04:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: becdcfdd1cc62b206cc92e9b8248c79a2ff63cfc3779d8a124b9713e779ad33c
    source_path: cli/acp.md
    workflow: 16
---

Führen Sie die [Agent Client Protocol (ACP)](https://agentclientprotocol.com/)-Bridge aus, die mit einem OpenClaw Gateway kommuniziert.

`openclaw acp` spricht ACP über stdio für IDEs und leitet Prompts über WebSocket an das Gateway weiter, wobei ACP-Sitzungen Gateway-Sitzungsschlüsseln zugeordnet bleiben. Es handelt sich um eine Gateway-gestützte ACP-Bridge und nicht um eine vollständige ACP-native Editor-Laufzeit: Der Schwerpunkt liegt auf Sitzungsrouting, Prompt-Übermittlung und Streaming-Aktualisierungen.

Wenn ein externer MCP-Client direkt mit OpenClaw-Kanalunterhaltungen kommunizieren soll, anstatt eine ACP-Harness-Sitzung zu hosten, verwenden Sie stattdessen [`openclaw mcp serve`](/de/cli/mcp).

## Was dies nicht ist

`openclaw acp` bedeutet, dass OpenClaw als ACP-Server fungiert: Eine IDE oder ein ACP-Client stellt eine Verbindung zu OpenClaw her, und OpenClaw leitet die Arbeit an eine Gateway-Sitzung weiter.

Dies unterscheidet sich von [ACP-Agenten](/de/tools/acp-agents), bei denen OpenClaw über `acpx` ein externes Harness wie Codex oder Claude Code ausführt.

Faustregel:

- Editor/Client möchte über ACP mit OpenClaw kommunizieren: Verwenden Sie `openclaw acp`
- OpenClaw soll Codex/Claude/Gemini als ACP-Harness starten: Verwenden Sie `/acp spawn` und [ACP-Agenten](/de/tools/acp-agents)

## Kompatibilitätsmatrix

| ACP-Bereich                                                            | Status              | Hinweise                                                                                                                                                                                                                                                                            |
| ----------------------------------------------------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `initialize`, `newSession`, `prompt`, `cancel`                          | Implementiert       | Zentraler Bridge-Ablauf über stdio zu Gateway-Chat/Senden + Abbruch.                                                                                                                                                                                                                 |
| `listSessions`, Slash-Befehle                                           | Implementiert       | Die Sitzungsliste arbeitet mit dem Gateway-Sitzungsstatus und verwendet begrenzte Cursor-Paginierung sowie `cwd`-Filterung, wenn Gateway-Sitzungszeilen Arbeitsbereichsmetadaten enthalten; Befehle werden über `available_commands_update` angekündigt.                                |
| Metadaten zur Sitzungshierarchie                                        | Implementiert       | Sitzungslisten und Momentaufnahmen der Sitzungsinformationen enthalten die OpenClaw-Eltern-Kind-Hierarchie in `_meta`, sodass ACP-Clients Subagentendiagramme ohne private Gateway-Seitenkanäle darstellen können.                                                                    |
| `resumeSession`, `closeSession`                                         | Implementiert       | Beim Fortsetzen wird eine ACP-Sitzung ohne erneute Wiedergabe des Verlaufs an eine vorhandene Gateway-Sitzung gebunden. Beim Schließen werden aktive Bridge-Vorgänge abgebrochen, ausstehende Prompts als abgebrochen aufgelöst und der Bridge-Sitzungsstatus freigegeben.              |
| `loadSession`                                                           | Teilweise unterstützt | Bindet die ACP-Sitzung erneut an einen Gateway-Sitzungsschlüssel und gibt den Verlauf des ACP-Ereignisjournals für von der Bridge erstellte Sitzungen wieder. Ältere Sitzungen oder Sitzungen ohne Journal greifen auf gespeicherten Benutzer-/Assistententext zurück.                 |
| Prompt-Inhalt (`text`, eingebettete `resource`, Bilder)                 | Teilweise unterstützt | Text/Ressourcen werden zu Chat-Eingaben zusammengeführt; Bilder werden zu Gateway-Anhängen.                                                                                                                                                                                          |
| Sitzungsmodi                                                            | Teilweise unterstützt | `session/set_mode` wird unterstützt; die Bridge stellt Gateway-gestützte Sitzungssteuerungen für Denkstufe, Tool-Ausführlichkeit, Schlussfolgerung, Nutzungsdetails und Aktionen mit erhöhten Berechtigungen bereit. Weitergehende ACP-native Modus-/Konfigurationsoberflächen bleiben außerhalb des Umfangs. |
| Streaming von Gedankengängen                                            | Implementiert       | Denkinhalte des Modells werden als `agent_thought_chunk`-Sitzungsaktualisierungen gestreamt. ACP-native Sitzungspläne werden nicht ausgegeben.                                                                                                                                       |
| Sitzungsinformationen und Nutzungsaktualisierungen                      | Teilweise unterstützt | Die Bridge sendet `session_info_update`- und nach bestem Bemühen `usage_update`-Benachrichtigungen aus zwischengespeicherten Gateway-Sitzungsmomentaufnahmen. Die Nutzung ist ungefähr und wird nur gesendet, wenn die Gateway-Token-Gesamtwerte als aktuell markiert sind.             |
| Tool-Streaming                                                          | Teilweise unterstützt | `tool_call`-/`tool_call_update`-Ereignisse enthalten rohe Ein-/Ausgaben, Textinhalte und nach bestem Bemühen Dateipositionen, wenn Gateway-Tool-Argumente/-Ergebnisse diese bereitstellen. Eingebettete Terminals und umfangreichere diff-native Ausgaben werden nicht bereitgestellt.    |
| Ausführungsgenehmigungen                                                | Teilweise unterstützt | Aufforderungen des Gateways zur Genehmigung von Ausführungen während aktiver ACP-Prompt-Durchläufe werden mit `session/request_permission` an den ACP-Client weitergeleitet.                                                                                                          |
| MCP-Server pro Sitzung (`mcpServers`)                                   | Nicht unterstützt   | Der Bridge-Modus lehnt MCP-Server-Anforderungen pro Sitzung ab. Konfigurieren Sie MCP stattdessen auf dem OpenClaw Gateway oder Agenten.                                                                                                                                             |
| Client-Dateisystemmethoden (`fs/read_text_file`, `fs/write_text_file`)  | Nicht unterstützt   | Die Bridge ruft keine Dateisystemmethoden des ACP-Clients auf.                                                                                                                                                                                                                       |
| Client-Terminalmethoden (`terminal/*`)                                  | Nicht unterstützt   | Die Bridge erstellt keine ACP-Client-Terminals und streamt keine Terminal-IDs über Tool-Aufrufe.                                                                                                                                                                                     |

## Bekannte Einschränkungen

- `loadSession` gibt den vollständigen Verlauf des ACP-Ereignisjournals nur für von der Bridge erstellte Sitzungen wieder. Ältere Sitzungen oder Sitzungen ohne Journal verwenden einen Transkript-Fallback und rekonstruieren keine historischen Tool-Aufrufe oder Systemhinweise.
- Wenn mehrere ACP-Clients denselben Gateway-Sitzungsschlüssel verwenden, erfolgen Ereignis- und Abbruchrouting nach bestem Bemühen und sind nicht strikt pro Client isoliert. Verwenden Sie vorzugsweise die standardmäßigen isolierten `acp-bridge:<uuid>`-Sitzungen, wenn Sie klar getrennte editorlokale Durchläufe benötigen.
- Gateway-Stoppzustände werden in ACP-Stoppgründe übersetzt, diese Zuordnung ist jedoch weniger ausdrucksstark als bei einer vollständig ACP-nativen Laufzeit.
- Die Sitzungssteuerung stellt eine gezielte Teilmenge der Gateway-Optionen bereit: Denkstufe, Tool-Ausführlichkeit, Schlussfolgerung, Nutzungsdetails und Aktionen mit erhöhten Berechtigungen. Modellauswahl und Steuerung des Ausführungshosts werden nicht als ACP-Konfigurationsoptionen bereitgestellt.
- `session_info_update` und `usage_update` werden aus Gateway-Sitzungsmomentaufnahmen und nicht aus einer laufenden ACP-nativen Laufzeitabrechnung abgeleitet. Die Nutzung ist ungefähr, enthält keine Kostendaten und wird nur ausgegeben, wenn das Gateway die Gesamt-Token-Daten als aktuell markiert.
- Begleitdaten zu Tools werden nach bestem Bemühen bereitgestellt: Die Bridge stellt Dateipfade bereit, die in bekannten Tool-Argumenten/-Ergebnissen vorkommen, gibt jedoch keine ACP-Terminals oder strukturierten Datei-Diffs aus.
- Die Weiterleitung von Ausführungsgenehmigungen ist auf den aktiven ACP-Prompt-Durchlauf beschränkt; Genehmigungen aus anderen Gateway-Sitzungen werden ignoriert.

## Verwendung

```bash
openclaw acp

# Entferntes Gateway
openclaw acp --url wss://gateway-host:18789 --token <token>

# Entferntes Gateway (Token aus Datei)
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# An einen vorhandenen Sitzungsschlüssel anhängen
openclaw acp --session agent:main:main

# Über Bezeichnung anhängen (muss bereits vorhanden sein)
openclaw acp --session-label "support inbox"

# Sitzungsschlüssel vor dem ersten Prompt zurücksetzen
openclaw acp --session agent:main:main --reset-session
```

## ACP-Client (Debugging)

Verwenden Sie den integrierten ACP-Client, um die Bridge ohne IDE einer Plausibilitätsprüfung zu unterziehen. Er startet die ACP-Bridge und ermöglicht Ihnen, Prompts interaktiv einzugeben.

```bash
openclaw acp client

# Die gestartete Bridge auf ein entferntes Gateway ausrichten
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Serverbefehl überschreiben (Standard: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

Berechtigungsmodell (Client-Debug-Modus):

- Die automatische Genehmigung basiert auf einer Positivliste und gilt nur für vertrauenswürdige zentrale Tool-IDs.
- Die automatische Genehmigung von `read` ist auf das aktuelle Arbeitsverzeichnis beschränkt (`--cwd`, falls gesetzt).
- ACP genehmigt nur eng begrenzte schreibgeschützte Klassen automatisch: begrenzte `read`-Aufrufe unter dem aktiven cwd sowie schreibgeschützte Such-Tools (`search`, `web_search`, `memory_search`). Unbekannte/nicht zentrale Tools, Lesezugriffe außerhalb des Geltungsbereichs, ausführungsfähige Tools, Steuerungsebenen-Tools, verändernde Tools und interaktive Abläufe erfordern immer eine ausdrückliche Prompt-Genehmigung.
- Das vom Server bereitgestellte `toolCall.kind` wird als nicht vertrauenswürdiges Metadatum und nicht als Autorisierungsquelle behandelt.
- Diese ACP-Bridge-Richtlinie ist von den ACPX-Harness-Berechtigungen getrennt. Wenn Sie OpenClaw über das `acpx`-Backend ausführen, ist `plugins.entries.acpx.config.permissionMode=approve-all` der Notfall-Schalter „yolo“ für diese Harness-Sitzung.

## Smoke-Test des Protokolls

Starten Sie für das Debugging auf Protokollebene ein Gateway mit isoliertem Status und steuern Sie `openclaw acp` über stdio mit einem ACP-JSON-RPC-Client. Decken Sie `initialize`, `session/new`, `session/list` mit einem absoluten `cwd`, `session/resume`, `session/close`, doppeltes Schließen und Fortsetzen einer fehlenden Sitzung ab.

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
  "gatewayLogTail": ["[gateway] bereit", "[ws] ⇄ res ✓ sessions.list 305ms"]
}
```

Verwenden Sie nicht ausschließlich `openclaw gateway call sessions.list` als ACP-Nachweis. Dieser CLI-Pfad kann eine Operator-Bereichserweiterung mit einem neuen Token anfordern; die Korrektheit der ACP-Bridge wird durch ACP-stdio-Frames zusammen mit dem Gateway-Protokoll `sessions.list` nachgewiesen.

## So verwenden Sie dies

Verwenden Sie ACP, wenn eine IDE (oder ein anderer Client) das Agent Client Protocol spricht und damit eine OpenClaw Gateway-Sitzung steuern soll.

1. Stellen Sie sicher, dass das Gateway ausgeführt wird (lokal oder entfernt).
2. Konfigurieren Sie das Gateway-Ziel (Konfiguration oder Flags).
3. Richten Sie Ihre IDE so ein, dass sie `openclaw acp` über stdio ausführt.

Beispielkonfiguration (dauerhaft gespeichert):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

Beispiel für direkte Ausführung (ohne Schreiben der Konfiguration):

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# aus Sicherheitsgründen für lokale Prozesse bevorzugt
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## Agenten auswählen

ACP wählt Agenten nicht direkt aus. Das Routing erfolgt anhand des Gateway-Sitzungsschlüssels. Verwenden Sie agentenspezifische Sitzungsschlüssel, um einen bestimmten Agenten anzusprechen:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

Jede ACP-Sitzung wird einem einzelnen Gateway-Sitzungsschlüssel zugeordnet. Ein Agent kann viele Sitzungen haben; ACP verwendet standardmäßig eine isolierte `acp-bridge:<uuid>`-Sitzung, sofern Sie den Schlüssel oder die Bezeichnung nicht überschreiben.

Sitzungsspezifische `mcpServers` werden im Bridge-Modus nicht unterstützt. Wenn ein ACP-Client sie während `newSession` oder `loadSession` sendet, gibt die Bridge einen eindeutigen Fehler zurück, statt sie stillschweigend zu ignorieren.

Wenn ACPX-gestützte Sitzungen auf OpenClaw-Plugin-Tools oder ausgewählte integrierte Tools wie `cron` zugreifen sollen, aktivieren Sie die Gateway-seitigen ACPX-MCP-Bridges, statt zu versuchen, sitzungsspezifische `mcpServers` zu übergeben. Siehe [ACP-Agenten](/de/tools/acp-agents-setup#plugin-tools-mcp-bridge) und [MCP-Bridge für OpenClaw-Tools](/de/tools/acp-agents-setup#openclaw-tools-mcp-bridge).

## Verwendung mit `acpx` (Codex, Claude und andere ACP-Clients)

Wenn ein Coding-Agent wie Codex oder Claude Code über ACP mit Ihrem OpenClaw-Bot kommunizieren soll, verwenden Sie `acpx` mit dem integrierten Ziel `openclaw`.

Typischer Ablauf:

1. Starten Sie den Gateway und stellen Sie sicher, dass die ACP-Bridge ihn erreichen kann.
2. Richten Sie `acpx openclaw` auf `openclaw acp`.
3. Geben Sie den OpenClaw-Sitzungsschlüssel an, den der Coding-Agent verwenden soll.

Beispiele:

```bash
# Einmalige Anfrage an Ihre standardmäßige OpenClaw-ACP-Sitzung
acpx openclaw exec "Fasse den aktiven OpenClaw-Sitzungsstatus zusammen."

# Dauerhafte benannte Sitzung für Folgeanfragen
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Bitte meinen OpenClaw-Arbeitsagenten um aktuellen, für dieses Repository relevanten Kontext."
```

Wenn `acpx openclaw` jedes Mal einen bestimmten Gateway und Sitzungsschlüssel verwenden soll, überschreiben Sie den Agentenbefehl `openclaw` in `~/.acpx/config.json`:

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

Verwenden Sie für einen Repository-lokalen OpenClaw-Checkout den direkten CLI-Einstiegspunkt statt des Entwicklungs-Runners, damit der ACP-Datenstrom unverfälscht bleibt:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

Dies ist die einfachste Möglichkeit, Codex, Claude Code oder einem anderen ACP-fähigen Client zu erlauben, Kontextinformationen von einem OpenClaw-Agenten abzurufen, ohne ein Terminal auszulesen.

## Einrichtung des Zed-Editors

Fügen Sie in `~/.config/zed/settings.json` einen benutzerdefinierten ACP-Agenten hinzu (oder verwenden Sie die Settings-Benutzeroberfläche von Zed):

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

So geben Sie einen bestimmten Gateway oder Agenten an:

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

Öffnen Sie in Zed den Bereich Agent und wählen Sie "OpenClaw ACP", um einen Thread zu starten.

## Sitzungszuordnung

Standardmäßig erhalten ACP-Bridge-Sitzungen einen isolierten Gateway-Sitzungsschlüssel mit dem Präfix `acp-bridge:`. Diese Bridge-Sitzungen mit normalen Modellen sind synthetisch und temporär: Sie unterliegen der Bereinigung veralteter Einträge und werden nicht als geschützte menschliche Konversationsoberflächen behandelt. Um eine bekannte Sitzung wiederzuverwenden, übergeben Sie einen Sitzungsschlüssel oder eine Bezeichnung:

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
- `--token <token>`: Gateway-Authentifizierungstoken.
- `--token-file <path>`: Gateway-Authentifizierungstoken aus einer Datei lesen.
- `--password <password>`: Gateway-Authentifizierungspasswort.
- `--password-file <path>`: Gateway-Authentifizierungspasswort aus einer Datei lesen.
- `--session <key>`: standardmäßiger Sitzungsschlüssel.
- `--session-label <label>`: standardmäßig aufzulösende Sitzungsbezeichnung.
- `--require-existing`: mit einem Fehler abbrechen, wenn der Sitzungsschlüssel oder die Sitzungsbezeichnung nicht vorhanden ist.
- `--reset-session`: den Sitzungsschlüssel vor der ersten Verwendung zurücksetzen.
- `--no-prefix-cwd`: Prompts nicht das Arbeitsverzeichnis voranstellen.
- `--provenance <off|meta|meta+receipt>`: ACP-Herkunftsmetadaten oder -Belege einschließen.
- `--verbose, -v`: ausführliche Protokollierung nach stderr.

Sicherheitshinweis:

- `--token` und `--password` können auf manchen Systemen in lokalen Prozesslisten sichtbar sein. Verwenden Sie vorzugsweise `--token-file`/`--password-file` oder Umgebungsvariablen (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`).
- Die Auflösung der Gateway-Authentifizierung folgt dem gemeinsamen Vertrag, den auch andere Gateway-Clients verwenden:
  - lokaler Modus: zuerst Umgebungsvariablen (`OPENCLAW_GATEWAY_*`), dann `gateway.auth.*`; Rückgriff auf `gateway.remote.*` nur, wenn `gateway.auth.*` nicht gesetzt ist (eine konfigurierte, aber nicht auflösbare lokale SecretRef schlägt sicher fehl, statt stillschweigend auf eine Alternative zurückzugreifen)
  - Remote-Modus: `gateway.remote.*` mit Rückgriff auf Umgebungsvariablen/Konfiguration gemäß den Prioritätsregeln für Remote-Verbindungen
  - `--url` kann sicher überschrieben werden und verwendet keine impliziten Anmeldedaten aus Konfiguration oder Umgebung erneut; übergeben Sie `--token`/`--password` (oder die Dateivarianten) explizit

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
