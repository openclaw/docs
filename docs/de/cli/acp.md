---
read_when:
    - Einrichten von ACP-basierten IDE-Integrationen
    - Debuggen des ACP-Sitzungsroutings zum Gateway
summary: Führen Sie die ACP-Bridge für IDE-Integrationen aus
title: acp
x-i18n:
    generated_at: "2026-04-23T06:25:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: b098c59e24cac23d533ea3b3828c95bd43d85ebf6e1361377122018777678720
    source_path: cli/acp.md
    workflow: 15
---

# acp

Führen Sie die [Agent Client Protocol (ACP)](https://agentclientprotocol.com/)-Bridge aus, die mit einem OpenClaw Gateway kommuniziert.

Dieser Befehl spricht ACP über stdio für IDEs und leitet Prompts über WebSocket an das Gateway weiter. Er hält ACP-Sitzungen den Gateway-Sitzungsschlüsseln zugeordnet.

`openclaw acp` ist eine Gateway-gestützte ACP-Bridge, keine vollständige ACP-native Editor-Laufzeitumgebung. Der Fokus liegt auf Sitzungsrouting, Prompt-Zustellung und grundlegenden Streaming-Aktualisierungen.

Wenn ein externer MCP-Client direkt mit OpenClaw-Kanalunterhaltungen sprechen soll, anstatt eine ACP-Harness-Sitzung zu hosten, verwenden Sie stattdessen [`openclaw mcp serve`](/de/cli/mcp).

## Was das nicht ist

Diese Seite wird häufig mit ACP-Harness-Sitzungen verwechselt.

`openclaw acp` bedeutet:

- OpenClaw fungiert als ACP-Server
- eine IDE oder ein ACP-Client verbindet sich mit OpenClaw
- OpenClaw leitet diese Arbeit in eine Gateway-Sitzung weiter

Das unterscheidet sich von [ACP Agents](/de/tools/acp-agents), bei denen OpenClaw eine externe Harness wie Codex oder Claude Code über `acpx` ausführt.

Kurzregel:

- Editor/Client möchte per ACP mit OpenClaw sprechen: Verwenden Sie `openclaw acp`
- OpenClaw soll Codex/Claude/Gemini als ACP-Harness starten: Verwenden Sie `/acp spawn` und [ACP Agents](/de/tools/acp-agents)

## Kompatibilitätsmatrix

| ACP-Bereich                                                          | Status        | Hinweise                                                                                                                                                                                                                                              |
| -------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialize`, `newSession`, `prompt`, `cancel`                       | Implementiert | Kern-Bridge-Ablauf über stdio zu Gateway chat/send + abort.                                                                                                                                                                                           |
| `listSessions`, Slash-Befehle                                        | Implementiert | Die Sitzungsliste arbeitet gegen den Gateway-Sitzungsstatus; Befehle werden über `available_commands_update` angekündigt.                                                                                                                             |
| `loadSession`                                                        | Teilweise     | Bindet die ACP-Sitzung erneut an einen Gateway-Sitzungsschlüssel und spielt den gespeicherten Textverlauf von Benutzer und Assistent erneut ab. Tool-/Systemverlauf wird noch nicht rekonstruiert.                                                  |
| Prompt-Inhalt (`text`, eingebettete `resource`, Bilder)              | Teilweise     | Text/Ressourcen werden in die Chat-Eingabe abgeflacht; Bilder werden zu Gateway-Anhängen.                                                                                                                                                            |
| Sitzungsmodi                                                         | Teilweise     | `session/set_mode` wird unterstützt, und die Bridge stellt anfängliche Gateway-gestützte Sitzungssteuerungen für thought level, Tool-Ausführlichkeit, reasoning, usage detail und elevated actions bereit. Umfangreichere ACP-native Modus-/Konfigurationsflächen sind weiterhin nicht im Umfang enthalten. |
| Sitzungsinfos und Nutzungsaktualisierungen                           | Teilweise     | Die Bridge sendet `session_info_update`- und Best-Effort-`usage_update`-Benachrichtigungen aus zwischengespeicherten Gateway-Sitzungs-Snapshots. Nutzungsdaten sind näherungsweise und werden nur gesendet, wenn Gateway-Token-Gesamtsummen als aktuell markiert sind. |
| Tool-Streaming                                                       | Teilweise     | `tool_call`- / `tool_call_update`-Ereignisse enthalten rohe I/O-Daten, Textinhalte und Best-Effort-Dateipfade, wenn Gateway-Tool-Argumente/-Ergebnisse diese bereitstellen. Eingebettete Terminals und umfangreichere diff-native Ausgabe werden weiterhin nicht bereitgestellt. |
| MCP-Server pro Sitzung (`mcpServers`)                                | Nicht unterstützt | Der Bridge-Modus lehnt MCP-Server-Anfragen pro Sitzung ab. Konfigurieren Sie MCP stattdessen auf dem OpenClaw-Gateway oder Agent.                                                                                                                 |
| Dateisystemmethoden des Clients (`fs/read_text_file`, `fs/write_text_file`) | Nicht unterstützt | Die Bridge ruft keine ACP-Client-Dateisystemmethoden auf.                                                                                                                                                                                        |
| Terminalmethoden des Clients (`terminal/*`)                          | Nicht unterstützt | Die Bridge erstellt keine ACP-Client-Terminals und streamt keine Terminal-IDs durch Tool-Aufrufe.                                                                                                                                               |
| Sitzungspläne / thought streaming                                    | Nicht unterstützt | Die Bridge sendet derzeit Ausgabetext und Tool-Status, keine ACP-Plan- oder thought-Aktualisierungen.                                                                                                                                          |

## Bekannte Einschränkungen

- `loadSession` spielt den gespeicherten Textverlauf von Benutzer und Assistent erneut ab, rekonstruiert aber keine historischen Tool-Aufrufe, Systemhinweise oder umfangreicheren ACP-nativen Ereignistypen.
- Wenn mehrere ACP-Clients denselben Gateway-Sitzungsschlüssel gemeinsam nutzen, erfolgen Ereignis- und Abbruchrouting nur nach Best Effort statt strikt pro Client isoliert. Bevorzugen Sie die standardmäßig isolierten `acp:<uuid>`-Sitzungen, wenn Sie saubere, editorlokale Turns benötigen.
- Gateway-Stop-Zustände werden in ACP-Stop-Gründe übersetzt, aber diese Zuordnung ist weniger ausdrucksstark als eine vollständig ACP-native Laufzeitumgebung.
- Die anfänglichen Sitzungssteuerungen zeigen derzeit einen fokussierten Teil der Gateway-Optionen an: thought level, Tool-Ausführlichkeit, reasoning, usage detail und elevated actions. Modellauswahl und Exec-Host-Steuerungen sind noch nicht als ACP-Konfigurationsoptionen verfügbar.
- `session_info_update` und `usage_update` werden aus Gateway-Sitzungs-Snapshots abgeleitet, nicht aus live berechneten ACP-nativen Laufzeitdaten. Nutzungsdaten sind näherungsweise, enthalten keine Kostendaten und werden nur gesendet, wenn das Gateway Gesamttokendaten als aktuell markiert.
- Tool-Follow-along-Daten erfolgen nach Best Effort. Die Bridge kann Dateipfade anzeigen, die in bekannten Tool-Argumenten/-Ergebnissen erscheinen, sendet aber noch keine ACP-Terminals oder strukturierte Dateidiffs.

## Verwendung

```bash
openclaw acp

# Remote-Gateway
openclaw acp --url wss://gateway-host:18789 --token <token>

# Remote-Gateway (Token aus Datei)
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# An einen vorhandenen Sitzungsschlüssel anhängen
openclaw acp --session agent:main:main

# Nach Label anhängen (muss bereits existieren)
openclaw acp --session-label "support inbox"

# Den Sitzungsschlüssel vor dem ersten Prompt zurücksetzen
openclaw acp --session agent:main:main --reset-session
```

## ACP-Client (Debug)

Verwenden Sie den integrierten ACP-Client, um die Bridge ohne IDE auf Plausibilität zu prüfen.
Er startet die ACP-Bridge und lässt Sie Prompts interaktiv eingeben.

```bash
openclaw acp client

# Die gestartete Bridge auf ein Remote-Gateway zeigen lassen
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Den Server-Befehl überschreiben (Standard: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

Berechtigungsmodell (Client-Debug-Modus):

- Auto-Genehmigung basiert auf einer Allowlist und gilt nur für vertrauenswürdige Core-Tool-IDs.
- Die Auto-Genehmigung für `read` ist auf das aktuelle Arbeitsverzeichnis beschränkt (`--cwd`, wenn gesetzt).
- ACP genehmigt automatisch nur enge, schreibgeschützte Klassen: eingegrenzte `read`-Aufrufe unter dem aktiven cwd plus schreibgeschützte Such-Tools (`search`, `web_search`, `memory_search`). Unbekannte/Nicht-Core-Tools, Lesezugriffe außerhalb des Geltungsbereichs, Tools mit Ausführungsfähigkeit, Control-Plane-Tools, verändernde Tools und interaktive Abläufe erfordern immer eine ausdrückliche Prompt-Genehmigung.
- Das vom Server bereitgestellte `toolCall.kind` wird als nicht vertrauenswürdige Metadaten behandelt (nicht als Autorisierungsquelle).
- Diese ACP-Bridge-Richtlinie ist getrennt von ACPX-Harness-Berechtigungen. Wenn Sie OpenClaw über das `acpx`-Backend ausführen, ist `plugins.entries.acpx.config.permissionMode=approve-all` der Break-Glass-„yolo“-Schalter für diese Harness-Sitzung.

## So verwenden Sie das

Verwenden Sie ACP, wenn eine IDE (oder ein anderer Client) Agent Client Protocol spricht und Sie möchten, dass sie eine OpenClaw-Gateway-Sitzung steuert.

1. Stellen Sie sicher, dass das Gateway ausgeführt wird (lokal oder remote).
2. Konfigurieren Sie das Gateway-Ziel (Konfiguration oder Flags).
3. Konfigurieren Sie Ihre IDE so, dass sie `openclaw acp` über stdio ausführt.

Beispielkonfiguration (persistent):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

Beispiel für direkten Aufruf (ohne Konfiguration zu schreiben):

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# bevorzugt für lokale Prozesssicherheit
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## Agents auswählen

ACP wählt Agents nicht direkt aus. Es routet über den Gateway-Sitzungsschlüssel.

Verwenden Sie agent-spezifische Sitzungsschlüssel, um einen bestimmten Agent anzusprechen:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

Jede ACP-Sitzung wird einem einzelnen Gateway-Sitzungsschlüssel zugeordnet. Ein Agent kann viele Sitzungen haben; ACP verwendet standardmäßig eine isolierte `acp:<uuid>`-Sitzung, sofern Sie den Schlüssel oder das Label nicht überschreiben.

`mcpServers` pro Sitzung werden im Bridge-Modus nicht unterstützt. Wenn ein ACP-Client sie während `newSession` oder `loadSession` sendet, gibt die Bridge einen klaren Fehler zurück, statt sie stillschweigend zu ignorieren.

Wenn ACPX-gestützte Sitzungen OpenClaw-Plugin-Tools oder ausgewählte integrierte Tools wie `cron` sehen sollen, aktivieren Sie stattdessen die Gateway-seitigen ACPX-MCP-Bridges, anstatt zu versuchen, `mcpServers` pro Sitzung zu übergeben. Siehe [ACP Agents](/de/tools/acp-agents#plugin-tools-mcp-bridge) und [OpenClaw tools MCP bridge](/de/tools/acp-agents#openclaw-tools-mcp-bridge).

## Verwendung aus `acpx` heraus (Codex, Claude, andere ACP-Clients)

Wenn ein Coding-Agent wie Codex oder Claude Code über ACP mit Ihrem OpenClaw-Bot sprechen soll, verwenden Sie `acpx` mit seinem integrierten `openclaw`-Ziel.

Typischer Ablauf:

1. Starten Sie das Gateway und stellen Sie sicher, dass die ACP-Bridge es erreichen kann.
2. Lassen Sie `acpx openclaw` auf `openclaw acp` zeigen.
3. Geben Sie den OpenClaw-Sitzungsschlüssel an, den der Coding-Agent verwenden soll.

Beispiele:

```bash
# Einmalige Anfrage in Ihre standardmäßige OpenClaw-ACP-Sitzung
acpx openclaw exec "Summarize the active OpenClaw session state."

# Persistente benannte Sitzung für Folge-Turns
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

Wenn `acpx openclaw` jedes Mal ein bestimmtes Gateway und einen bestimmten Sitzungsschlüssel ansteuern soll, überschreiben Sie den `openclaw`-Agent-Befehl in `~/.acpx/config.json`:

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

Für ein repo-lokales OpenClaw-Checkout verwenden Sie den direkten CLI-Einstiegspunkt statt des Dev-Runners, damit der ACP-Stream sauber bleibt. Zum Beispiel:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

Das ist der einfachste Weg, Codex, Claude Code oder einem anderen ACP-fähigen Client zu ermöglichen, kontextbezogene Informationen aus einem OpenClaw-Agent abzurufen, ohne ein Terminal zu scrapen.

## Einrichtung des Zed-Editors

Fügen Sie einen benutzerdefinierten ACP-Agenten in `~/.config/zed/settings.json` hinzu (oder verwenden Sie die Einstellungsoberfläche von Zed):

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

Um ein bestimmtes Gateway oder einen bestimmten Agent anzusteuern:

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

Standardmäßig erhalten ACP-Sitzungen einen isolierten Gateway-Sitzungsschlüssel mit dem Präfix `acp:`.
Um eine bekannte Sitzung wiederzuverwenden, übergeben Sie einen Sitzungsschlüssel oder ein Label:

- `--session <key>`: einen bestimmten Gateway-Sitzungsschlüssel verwenden.
- `--session-label <label>`: eine vorhandene Sitzung anhand des Labels auflösen.
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

- `--url <url>`: Gateway-WebSocket-URL (verwendet standardmäßig `gateway.remote.url`, wenn konfiguriert).
- `--token <token>`: Gateway-Authentifizierungstoken.
- `--token-file <path>`: Gateway-Authentifizierungstoken aus Datei lesen.
- `--password <password>`: Gateway-Authentifizierungspasswort.
- `--password-file <path>`: Gateway-Authentifizierungspasswort aus Datei lesen.
- `--session <key>`: Standardsitzungsschlüssel.
- `--session-label <label>`: Standard-Sitzungslabel zum Auflösen.
- `--require-existing`: fehlschlagen, wenn der Sitzungsschlüssel bzw. das Label nicht existiert.
- `--reset-session`: den Sitzungsschlüssel vor der ersten Verwendung zurücksetzen.
- `--no-prefix-cwd`: Prompts nicht mit dem Arbeitsverzeichnis präfixen.
- `--provenance <off|meta|meta+receipt>`: ACP-Provenance-Metadaten oder Belege einschließen.
- `--verbose, -v`: ausführliches Logging nach stderr.

Sicherheitshinweis:

- `--token` und `--password` können auf manchen Systemen in lokalen Prozesslisten sichtbar sein.
- Bevorzugen Sie `--token-file`/`--password-file` oder Umgebungsvariablen (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`).
- Die Auflösung der Gateway-Authentifizierung folgt dem gemeinsamen Vertrag, der von anderen Gateway-Clients verwendet wird:
  - lokaler Modus: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> `gateway.remote.*` nur als Fallback, wenn `gateway.auth.*` nicht gesetzt ist (konfigurierte, aber nicht auflösbare lokale SecretRefs schlagen fail-closed fehl)
  - Remote-Modus: `gateway.remote.*` mit env-/Konfigurations-Fallback gemäß den Vorrangregeln für Remote
  - `--url` ist override-sicher und verwendet keine impliziten Konfigurations-/env-Anmeldedaten wieder; übergeben Sie explizit `--token`/`--password` (oder die Dateivarianten)
- Child-Prozesse des ACP-Laufzeit-Backends erhalten `OPENCLAW_SHELL=acp`, was für kontextspezifische Shell-/Profilregeln verwendet werden kann.
- `openclaw acp client` setzt `OPENCLAW_SHELL=acp-client` auf dem gestarteten Bridge-Prozess.

### Optionen für `acp client`

- `--cwd <dir>`: Arbeitsverzeichnis für die ACP-Sitzung.
- `--server <command>`: ACP-Server-Befehl (Standard: `openclaw`).
- `--server-args <args...>`: zusätzliche Argumente, die an den ACP-Server übergeben werden.
- `--server-verbose`: ausführliches Logging auf dem ACP-Server aktivieren.
- `--verbose, -v`: ausführliches Client-Logging.
