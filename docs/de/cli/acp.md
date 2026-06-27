---
read_when:
    - ACP-basierte IDE-Integrationen einrichten
    - Debugging des ACP-Sitzungsroutings zum Gateway
summary: ACP-Bridge für IDE-Integrationen ausführen
title: ACP
x-i18n:
    generated_at: "2026-06-27T17:17:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 79fa816811f78c3fa59577342e568868ef63e88f5262fd954e346ed46b02afc3
    source_path: cli/acp.md
    workflow: 16
---

Führen Sie die [Agent Client Protocol (ACP)](https://agentclientprotocol.com/)-Bridge aus, die mit einem OpenClaw Gateway kommuniziert.

Dieser Befehl spricht ACP über stdio für IDEs und leitet Prompts über WebSocket
an den Gateway weiter. Er ordnet ACP-Sitzungen Gateway-Sitzungsschlüsseln zu.

`openclaw acp` ist eine Gateway-gestützte ACP-Bridge, keine vollständige
ACP-native Editor-Laufzeitumgebung. Der Fokus liegt auf Sitzungsrouting,
Prompt-Zustellung und einfachen Streaming-Aktualisierungen.

Wenn ein externer MCP-Client direkt mit OpenClaw-Kanalunterhaltungen
kommunizieren soll, statt eine ACP-Harness-Sitzung zu hosten, verwenden Sie
stattdessen [`openclaw mcp serve`](/de/cli/mcp).

## Was dies nicht ist

Diese Seite wird häufig mit ACP-Harness-Sitzungen verwechselt.

`openclaw acp` bedeutet:

- OpenClaw agiert als ACP-Server
- eine IDE oder ein ACP-Client verbindet sich mit OpenClaw
- OpenClaw leitet diese Arbeit in eine Gateway-Sitzung weiter

Dies unterscheidet sich von [ACP-Agenten](/de/tools/acp-agents), bei denen OpenClaw
ein externes Harness wie Codex oder Claude Code über `acpx` ausführt.

Kurzregel:

- Editor/Client möchte per ACP mit OpenClaw sprechen: Verwenden Sie `openclaw acp`
- OpenClaw soll Codex/Claude/Gemini als ACP-Harness starten: Verwenden Sie `/acp spawn` und [ACP-Agenten](/de/tools/acp-agents)

## Kompatibilitätsmatrix

| ACP-Bereich                                                          | Status                | Hinweise                                                                                                                                                                                                                                             |
| -------------------------------------------------------------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `initialize`, `newSession`, `prompt`, `cancel`                       | Implementiert         | Kern-Bridge-Fluss über stdio zu Gateway chat/send + abort.                                                                                                                                                                                           |
| `listSessions`, Slash-Befehle                                        | Implementiert         | Die Sitzungsliste arbeitet mit dem Gateway-Sitzungsstatus, begrenzter cursorbasierter Paginierung und `cwd`-Filterung, wenn Gateway-Sitzungszeilen Workspace-Metadaten enthalten; Befehle werden über `available_commands_update` angekündigt.      |
| Metadaten zur Sitzungslinie                                          | Implementiert         | Sitzungslisten und Sitzungsinfo-Snapshots enthalten OpenClaw-Eltern- und Kind-Linien in `_meta`, damit ACP-Clients Subagent-Graphen ohne private Gateway-Seitenkanäle darstellen können.                                                             |
| `resumeSession`, `closeSession`                                      | Implementiert         | Resume bindet eine ACP-Sitzung erneut an eine vorhandene Gateway-Sitzung, ohne den Verlauf erneut abzuspielen. Close bricht aktive Bridge-Arbeit ab, löst ausstehende Prompts als abgebrochen auf und gibt den Bridge-Sitzungsstatus frei.          |
| `loadSession`                                                        | Teilweise             | Bindet die ACP-Sitzung erneut an einen Gateway-Sitzungsschlüssel und spielt die ACP-Ereignis-Ledger-Historie für von der Bridge erstellte Sitzungen erneut ab. Ältere Sitzungen oder Sitzungen ohne Ledger fallen auf gespeicherten Benutzer-/Assistententext zurück. |
| Prompt-Inhalt (`text`, eingebettete `resource`, Bilder)              | Teilweise             | Text/Ressourcen werden zu Chat-Eingaben abgeflacht; Bilder werden zu Gateway-Anhängen.                                                                                                                                                              |
| Sitzungsmodi                                                         | Teilweise             | `session/set_mode` wird unterstützt, und die Bridge stellt anfängliche Gateway-gestützte Sitzungssteuerungen für Denkstufe, Tool-Ausführlichkeit, Reasoning, Nutzungsdetails und erhöhte Aktionen bereit. Breitere ACP-native Modus-/Konfigurationsoberflächen sind weiterhin außerhalb des Umfangs. |
| Sitzungsinformationen und Nutzungsaktualisierungen                   | Teilweise             | Die Bridge gibt `session_info_update`- und Best-Effort-`usage_update`-Benachrichtigungen aus zwischengespeicherten Gateway-Sitzungs-Snapshots aus. Die Nutzung ist näherungsweise und wird nur gesendet, wenn Gateway-Token-Gesamtsummen als frisch markiert sind. |
| Tool-Streaming                                                       | Teilweise             | `tool_call`- / `tool_call_update`-Ereignisse enthalten rohe Ein-/Ausgaben, Textinhalte und Best-Effort-Dateispeicherorte, wenn Gateway-Tool-Argumente/-Ergebnisse sie offenlegen. Eingebettete Terminals und umfangreichere diff-native Ausgaben werden noch nicht bereitgestellt. |
| Exec-Genehmigungen                                                   | Teilweise             | Gateway-Exec-Genehmigungsaufforderungen während aktiver ACP-Prompt-Runden werden mit `session/request_permission` an den ACP-Client weitergeleitet.                                                                                                  |
| MCP-Server pro Sitzung (`mcpServers`)                                | Nicht unterstützt     | Der Bridge-Modus weist MCP-Server-Anfragen pro Sitzung zurück. Konfigurieren Sie MCP stattdessen auf dem OpenClaw-Gateway oder -Agenten.                                                                                                             |
| Client-Dateisystemmethoden (`fs/read_text_file`, `fs/write_text_file`) | Nicht unterstützt   | Die Bridge ruft keine ACP-Client-Dateisystemmethoden auf.                                                                                                                                                                                            |
| Client-Terminalmethoden (`terminal/*`)                               | Nicht unterstützt     | Die Bridge erstellt keine ACP-Client-Terminals und streamt keine Terminal-IDs durch Tool-Aufrufe.                                                                                                                                                    |
| Sitzungspläne / Gedanken-Streaming                                   | Nicht unterstützt     | Die Bridge gibt derzeit Ausgabetext und Tool-Status aus, keine ACP-Plan- oder Gedankenaktualisierungen.                                                                                                                                             |

## Bekannte Einschränkungen

- `loadSession` kann die vollständige ACP-Ereignis-Ledger-Historie nur für
  von der Bridge erstellte Sitzungen erneut abspielen. Ältere Sitzungen oder
  Sitzungen ohne Ledger verwenden weiterhin den Transcript-Fallback und
  rekonstruieren keine historischen Tool-Aufrufe oder Systemhinweise.
- Wenn mehrere ACP-Clients denselben Gateway-Sitzungsschlüssel teilen, erfolgen
  Ereignis- und Abbruchrouting nach Best Effort statt strikt pro Client
  isoliert. Bevorzugen Sie die standardmäßig isolierten
  `acp-bridge:<uuid>`-Sitzungen, wenn Sie saubere editorlokale Runden benötigen.
- Gateway-Stoppzustände werden in ACP-Stoppgründe übersetzt, aber diese
  Zuordnung ist weniger ausdrucksstark als bei einer vollständig ACP-nativen
  Laufzeitumgebung.
- Anfängliche Sitzungssteuerungen stellen derzeit eine fokussierte Teilmenge der
  Gateway-Regler bereit: Denkstufe, Tool-Ausführlichkeit, Reasoning,
  Nutzungsdetails und erhöhte Aktionen. Modellauswahl und Exec-Host-Steuerungen
  werden noch nicht als ACP-Konfigurationsoptionen bereitgestellt.
- `session_info_update` und `usage_update` werden aus Gateway-Sitzungs-Snapshots
  abgeleitet, nicht aus Live-ACP-nativer Laufzeitabrechnung. Die Nutzung ist
  näherungsweise, enthält keine Kostendaten und wird nur ausgegeben, wenn der
  Gateway die Gesamt-Token-Daten als frisch markiert.
- Tool-Begleitdaten sind Best Effort. Die Bridge kann Dateipfade anzeigen, die
  in bekannten Tool-Argumenten/-Ergebnissen vorkommen, gibt aber noch keine
  ACP-Terminals oder strukturierten Datei-Diffs aus.
- Die Weiterleitung von Exec-Genehmigungen ist auf die aktive ACP-Prompt-Runde
  beschränkt; Genehmigungen aus anderen Gateway-Sitzungen werden ignoriert.

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

Verwenden Sie den integrierten ACP-Client, um die Bridge ohne IDE grob zu prüfen.
Er startet die ACP-Bridge und lässt Sie Prompts interaktiv eingeben.

```bash
openclaw acp client

# Point the spawned bridge at a remote Gateway
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Override the server command (default: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

Berechtigungsmodell (Client-Debug-Modus):

- Automatische Genehmigung basiert auf einer Allowlist und gilt nur für vertrauenswürdige Core-Tool-IDs.
- Die automatische Genehmigung für `read` ist auf das aktuelle Arbeitsverzeichnis beschränkt (`--cwd`, wenn gesetzt).
- ACP genehmigt nur enge schreibgeschützte Klassen automatisch: begrenzte `read`-Aufrufe unterhalb des aktiven cwd sowie schreibgeschützte Such-Tools (`search`, `web_search`, `memory_search`). Unbekannte/Nicht-Core-Tools, Lesevorgänge außerhalb des Gültigkeitsbereichs, exec-fähige Tools, Control-Plane-Tools, mutierende Tools und interaktive Flows erfordern immer eine explizite Prompt-Genehmigung.
- Vom Server bereitgestelltes `toolCall.kind` wird als nicht vertrauenswürdige Metadaten behandelt (nicht als Autorisierungsquelle).
- Diese ACP-Bridge-Richtlinie ist getrennt von ACPX-Harness-Berechtigungen. Wenn Sie OpenClaw über das `acpx`-Backend ausführen, ist `plugins.entries.acpx.config.permissionMode=approve-all` der Break-Glass-„Yolo“-Schalter für diese Harness-Sitzung.

## Protokoll-Smoke-Test

Für Debugging auf Protokollebene starten Sie einen Gateway mit isoliertem Status
und steuern `openclaw acp` über stdio mit einem ACP-JSON-RPC-Client. Decken Sie
`initialize`, `session/new`, `session/list` mit einem absoluten `cwd`,
`session/resume`, `session/close`, doppeltes Schließen und fehlendes Resume ab.

Der Nachweis sollte die angekündigten Lebenszyklusfähigkeiten, eine
Gateway-gestützte Sitzungszeile, Aktualisierungsbenachrichtigungen und das
Gateway-`sessions.list`-Log enthalten:

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

Verwenden Sie nicht `openclaw gateway call sessions.list` als einzigen
ACP-Nachweis. Dieser CLI-Pfad kann ein Operator-Scope-Upgrade mit frischem Token
anfordern; die Korrektheit der ACP-Bridge wird durch ACP-stdio-Frames plus das
Gateway-`sessions.list`-Log nachgewiesen.

## So verwenden Sie dies

Verwenden Sie ACP, wenn eine IDE (oder ein anderer Client) das Agent Client
Protocol spricht und damit eine OpenClaw-Gateway-Sitzung steuern soll.

1. Stellen Sie sicher, dass der Gateway läuft (lokal oder remote).
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

ACP wählt Agenten nicht direkt aus. Es routet anhand des Gateway-Sitzungsschlüssels.

Verwenden Sie agentenspezifische Sitzungsschlüssel, um einen bestimmten Agenten anzusteuern:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

Jede ACP-Sitzung wird einem einzelnen Gateway-Sitzungsschlüssel zugeordnet. Ein Agent kann viele
Sitzungen haben; ACP verwendet standardmäßig eine isolierte Sitzung `acp-bridge:<uuid>`, sofern Sie den
Schlüssel oder das Label nicht überschreiben.

Sitzungsspezifische `mcpServers` werden im Bridge-Modus nicht unterstützt. Wenn ein ACP-Client
sie während `newSession` oder `loadSession` sendet, gibt die Bridge einen klaren
Fehler zurück, statt sie stillschweigend zu ignorieren.

Wenn ACPX-gestützte Sitzungen OpenClaw-Plugin-Tools oder ausgewählte
integrierte Tools wie `cron` sehen sollen, aktivieren Sie stattdessen die Gateway-seitigen ACPX-MCP-Bridges,
anstatt zu versuchen, sitzungsspezifische `mcpServers` zu übergeben. Siehe
[ACP-Agenten](/de/tools/acp-agents-setup#plugin-tools-mcp-bridge) und
[OpenClaw-Tools-MCP-Bridge](/de/tools/acp-agents-setup#openclaw-tools-mcp-bridge).

## Verwendung aus `acpx` (Codex, Claude, andere ACP-Clients)

Wenn ein Coding-Agent wie Codex oder Claude Code über ACP mit Ihrem
OpenClaw-Bot kommunizieren soll, verwenden Sie `acpx` mit seinem integrierten Ziel `openclaw`.

Typischer Ablauf:

1. Führen Sie den Gateway aus und stellen Sie sicher, dass die ACP-Bridge ihn erreichen kann.
2. Richten Sie `acpx openclaw` auf `openclaw acp`.
3. Wählen Sie den OpenClaw-Sitzungsschlüssel aus, den der Coding-Agent verwenden soll.

Beispiele:

```bash
# One-shot request into your default OpenClaw ACP session
acpx openclaw exec "Summarize the active OpenClaw session state."

# Persistent named session for follow-up turns
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

Wenn `acpx openclaw` jedes Mal einen bestimmten Gateway und Sitzungsschlüssel verwenden soll,
überschreiben Sie den Agent-Befehl `openclaw` in `~/.acpx/config.json`:

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

Für einen repo-lokalen OpenClaw-Checkout verwenden Sie den direkten CLI-Einstiegspunkt anstelle des
Dev-Runners, damit der ACP-Stream sauber bleibt. Zum Beispiel:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

Dies ist der einfachste Weg, Codex, Claude Code oder einem anderen ACP-fähigen Client zu ermöglichen,
Kontextinformationen aus einem OpenClaw-Agenten abzurufen, ohne ein Terminal auszulesen.

## Zed-Editor-Einrichtung

Fügen Sie einen benutzerdefinierten ACP-Agenten in `~/.config/zed/settings.json` hinzu (oder verwenden Sie die Settings UI von Zed):

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

Öffnen Sie in Zed das Agent-Panel und wählen Sie „OpenClaw ACP“ aus, um einen Thread zu starten.

## Sitzungszuordnung

Standardmäßig erhalten ACP-Bridge-Sitzungen einen isolierten Gateway-Sitzungsschlüssel mit einem
Präfix `acp-bridge:`. Diese Bridge-Sitzungen mit normalem Modell sind synthetisch und
unterliegen dem Entfernen veralteter Einträge sowie Obergrenzen für die Eintragsanzahl. Um eine bekannte Sitzung wiederzuverwenden,
übergeben Sie einen Sitzungsschlüssel oder ein Label:

- `--session <key>`: Einen bestimmten Gateway-Sitzungsschlüssel verwenden.
- `--session-label <label>`: Eine vorhandene Sitzung nach Label auflösen.
- `--reset-session`: Eine neue Sitzungs-ID für diesen Schlüssel erzeugen (gleicher Schlüssel, neues Transkript).

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

- `--url <url>`: Gateway-WebSocket-URL (standardmäßig gateway.remote.url, wenn konfiguriert).
- `--token <token>`: Gateway-Authentifizierungstoken.
- `--token-file <path>`: Gateway-Authentifizierungstoken aus Datei lesen.
- `--password <password>`: Gateway-Authentifizierungspasswort.
- `--password-file <path>`: Gateway-Authentifizierungspasswort aus Datei lesen.
- `--session <key>`: Standardsitzungsschlüssel.
- `--session-label <label>`: Aufzulösendes Standardsitzungslabel.
- `--require-existing`: Fehlschlagen, wenn der Sitzungsschlüssel bzw. das Label nicht existiert.
- `--reset-session`: Den Sitzungsschlüssel vor der ersten Verwendung zurücksetzen.
- `--no-prefix-cwd`: Prompts nicht mit dem Arbeitsverzeichnis präfixen.
- `--provenance <off|meta|meta+receipt>`: ACP-Provenienzmetadaten oder Belege einschließen.
- `--verbose, -v`: Ausführliche Protokollierung nach stderr.

Sicherheitshinweis:

- `--token` und `--password` können auf manchen Systemen in lokalen Prozesslisten sichtbar sein.
- Bevorzugen Sie `--token-file`/`--password-file` oder Umgebungsvariablen (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`).
- Die Gateway-Authentifizierungsauflösung folgt dem gemeinsamen Vertrag, der von anderen Gateway-Clients verwendet wird:
  - lokaler Modus: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> `gateway.remote.*`-Fallback nur, wenn `gateway.auth.*` nicht gesetzt ist (konfigurierte, aber nicht aufgelöste lokale SecretRefs schlagen geschlossen fehl)
  - Remote-Modus: `gateway.remote.*` mit env/config-Fallback gemäß Remote-Prioritätsregeln
  - `--url` ist überschreibungssicher und verwendet keine impliziten config/env-Anmeldedaten erneut; übergeben Sie explizit `--token`/`--password` (oder Dateivarianten)
- Unterprozesse des ACP-Runtime-Backends erhalten `OPENCLAW_SHELL=acp`, was für kontextspezifische Shell-/Profilregeln verwendet werden kann.
- `openclaw acp client` setzt `OPENCLAW_SHELL=acp-client` für den gestarteten Bridge-Prozess.

### Optionen für `acp client`

- `--cwd <dir>`: Arbeitsverzeichnis für die ACP-Sitzung.
- `--server <command>`: ACP-Serverbefehl (Standard: `openclaw`).
- `--server-args <args...>`: Zusätzliche Argumente, die an den ACP-Server übergeben werden.
- `--server-verbose`: Ausführliche Protokollierung auf dem ACP-Server aktivieren.
- `--verbose, -v`: Ausführliche Client-Protokollierung.

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [ACP-Agenten](/de/tools/acp-agents)
