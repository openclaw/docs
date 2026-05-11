---
read_when:
    - ACP-basierte IDE-Integrationen einrichten
    - ACP-Sitzungsrouting zum Gateway debuggen
summary: Die ACP-Bridge für IDE-Integrationen ausführen
title: ACP
x-i18n:
    generated_at: "2026-05-11T20:25:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0c94877b97cf6fb8deb6f16ec3f7225dfe931b78b25ad966d4350bdb20e25d9a
    source_path: cli/acp.md
    workflow: 16
---

Führen Sie die [Agent Client Protocol (ACP)](https://agentclientprotocol.com/)-Bridge aus, die mit einem OpenClaw Gateway kommuniziert.

Dieser Befehl spricht ACP über stdio für IDEs und leitet Prompts über WebSocket
an das Gateway weiter. Er hält ACP-Sitzungen auf Gateway-Sitzungsschlüssel abgebildet.

`openclaw acp` ist eine Gateway-gestützte ACP-Bridge, keine vollständige ACP-native Editor-
Runtime. Der Fokus liegt auf Sitzungsrouting, Prompt-Zustellung und einfachen Streaming-
Updates.

Wenn ein externer MCP-Client direkt mit OpenClaw-Kanal-
Konversationen sprechen soll, statt eine ACP-Harness-Sitzung zu hosten, verwenden Sie
stattdessen [`openclaw mcp serve`](/de/cli/mcp).

## Was dies nicht ist

Diese Seite wird häufig mit ACP-Harness-Sitzungen verwechselt.

`openclaw acp` bedeutet:

- OpenClaw agiert als ACP-Server
- eine IDE oder ein ACP-Client verbindet sich mit OpenClaw
- OpenClaw leitet diese Arbeit in eine Gateway-Sitzung weiter

Dies unterscheidet sich von [ACP Agents](/de/tools/acp-agents), bei denen OpenClaw ein
externes Harness wie Codex oder Claude Code über `acpx` ausführt.

Kurzregel:

- Editor/Client möchte über ACP mit OpenClaw sprechen: Verwenden Sie `openclaw acp`
- OpenClaw soll Codex/Claude/Gemini als ACP-Harness starten: Verwenden Sie `/acp spawn` und [ACP Agents](/de/tools/acp-agents)

## Kompatibilitätsmatrix

| ACP-Bereich                                                           | Status      | Hinweise                                                                                                                                                                                                                                        |
| --------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `initialize`, `newSession`, `prompt`, `cancel`                        | Implementiert | Kern-Bridge-Ablauf über stdio zu Gateway chat/send + abort.                                                                                                                                                                                     |
| `listSessions`, Slash-Befehle                                         | Implementiert | Sitzungsauflistung funktioniert gegen den Gateway-Sitzungszustand mit begrenzter Cursor-Paginierung und `cwd`-Filterung, wenn Gateway-Sitzungszeilen Workspace-Metadaten tragen; Befehle werden über `available_commands_update` angekündigt. |
| Sitzungsabstammungsmetadaten                                          | Implementiert | Sitzungsauflistungen und Sitzungsinformations-Snapshots enthalten OpenClaw-Eltern- und Kind-Abstammung in `_meta`, damit ACP-Clients Subagent-Graphen ohne private Gateway-Seitenkanäle darstellen können.                                      |
| `resumeSession`, `closeSession`                                       | Implementiert | Resume bindet eine ACP-Sitzung erneut an eine vorhandene Gateway-Sitzung, ohne den Verlauf erneut abzuspielen. Close bricht aktive Bridge-Arbeit ab, löst ausstehende Prompts als abgebrochen auf und gibt den Bridge-Sitzungszustand frei.       |
| `loadSession`                                                         | Teilweise   | Bindet die ACP-Sitzung erneut an einen Gateway-Sitzungsschlüssel und spielt den ACP-Ereignis-Ledger-Verlauf für von der Bridge erstellte Sitzungen erneut ab. Ältere Sitzungen oder Sitzungen ohne Ledger fallen auf gespeicherten Benutzer-/Assistententext zurück. |
| Prompt-Inhalt (`text`, eingebettete `resource`, Bilder)               | Teilweise   | Text/Ressourcen werden in Chat-Eingaben abgeflacht; Bilder werden zu Gateway-Anhängen.                                                                                                                                                          |
| Sitzungsmodi                                                          | Teilweise   | `session/set_mode` wird unterstützt, und die Bridge stellt anfängliche Gateway-gestützte Sitzungssteuerungen für Denkstufe, Tool-Ausführlichkeit, Reasoning, Nutzungsdetail und erhöhte Aktionen bereit. Breitere ACP-native Modus-/Konfigurationsoberflächen liegen weiterhin außerhalb des Umfangs. |
| Sitzungsinformationen und Nutzungsupdates                             | Teilweise   | Die Bridge sendet `session_info_update`- und Best-Effort-`usage_update`-Benachrichtigungen aus zwischengespeicherten Gateway-Sitzungs-Snapshots. Die Nutzung ist näherungsweise und wird nur gesendet, wenn Gateway-Token-Gesamtsummen als aktuell markiert sind. |
| Tool-Streaming                                                        | Teilweise   | `tool_call`-/`tool_call_update`-Ereignisse enthalten rohe E/A, Textinhalt und Best-Effort-Dateipositionen, wenn Gateway-Tool-Argumente/-Ergebnisse diese offenlegen. Eingebettete Terminals und umfangreichere diff-native Ausgabe werden weiterhin nicht offengelegt. |
| Exec-Genehmigungen                                                    | Teilweise   | Gateway-Exec-Genehmigungs-Prompts während aktiver ACP-Prompt-Durchläufe werden mit `session/request_permission` an den ACP-Client weitergeleitet.                                                                                                |
| MCP-Server pro Sitzung (`mcpServers`)                                 | Nicht unterstützt | Der Bridge-Modus lehnt MCP-Serveranforderungen pro Sitzung ab. Konfigurieren Sie MCP stattdessen am OpenClaw Gateway oder Agent.                                                                                                                  |
| Client-Dateisystemmethoden (`fs/read_text_file`, `fs/write_text_file`) | Nicht unterstützt | Die Bridge ruft keine Dateisystemmethoden des ACP-Clients auf.                                                                                                                                                                                   |
| Client-Terminalmethoden (`terminal/*`)                                | Nicht unterstützt | Die Bridge erstellt keine ACP-Client-Terminals und streamt keine Terminal-IDs über Tool-Aufrufe.                                                                                                                                                 |
| Sitzungspläne / Gedanken-Streaming                                    | Nicht unterstützt | Die Bridge gibt derzeit Ausgabetext und Tool-Status aus, keine ACP-Plan- oder Gedankenupdates.                                                                                                                                                   |

## Bekannte Einschränkungen

- `loadSession` kann den vollständigen ACP-Ereignis-Ledger-Verlauf nur für
  von der Bridge erstellte Sitzungen erneut abspielen. Ältere Sitzungen oder Sitzungen ohne Ledger verwenden weiterhin den Transkript-
  Fallback und rekonstruieren keine historischen Tool-Aufrufe oder Systemhinweise.
- Wenn mehrere ACP-Clients denselben Gateway-Sitzungsschlüssel teilen, sind Ereignis- und Abbruch-
  Routing eher Best-Effort als strikt pro Client isoliert. Bevorzugen Sie die
  standardmäßig isolierten `acp:<uuid>`-Sitzungen, wenn Sie saubere editorlokale
  Durchläufe benötigen.
- Gateway-Stoppzustände werden in ACP-Stoppgründe übersetzt, aber diese Zuordnung ist
  weniger ausdrucksstark als eine vollständig ACP-native Runtime.
- Anfängliche Sitzungssteuerungen stellen derzeit eine fokussierte Teilmenge von Gateway-Reglern bereit:
  Denkstufe, Tool-Ausführlichkeit, Reasoning, Nutzungsdetail und erhöhte
  Aktionen. Modellauswahl und Exec-Host-Steuerungen sind noch nicht als ACP-
  Konfigurationsoptionen verfügbar.
- `session_info_update` und `usage_update` werden aus Gateway-Sitzungs-
  Snapshots abgeleitet, nicht aus live ACP-nativer Runtime-Abrechnung. Die Nutzung ist näherungsweise,
  enthält keine Kostendaten und wird nur ausgegeben, wenn das Gateway die gesamten Token-
  Daten als aktuell markiert.
- Tool-Begleitdaten sind Best-Effort. Die Bridge kann Dateipfade anzeigen, die
  in bekannten Tool-Argumenten/-Ergebnissen erscheinen, gibt aber noch keine ACP-Terminals oder
  strukturierten Datei-Diffs aus.
- Die Exec-Genehmigungsweiterleitung ist auf den aktiven ACP-Prompt-Durchlauf beschränkt; Genehmigungen aus
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

Verwenden Sie den integrierten ACP-Client, um die Bridge ohne IDE auf Plausibilität zu prüfen.
Er startet die ACP-Bridge und lässt Sie Prompts interaktiv eingeben.

```bash
openclaw acp client

# Point the spawned bridge at a remote Gateway
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Override the server command (default: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

Berechtigungsmodell (Client-Debug-Modus):

- Auto-Genehmigung basiert auf einer Allowlist und gilt nur für vertrauenswürdige Kern-Tool-IDs.
- `read`-Auto-Genehmigung ist auf das aktuelle Arbeitsverzeichnis beschränkt (`--cwd`, wenn gesetzt).
- ACP genehmigt nur enge schreibgeschützte Klassen automatisch: bereichsgebundene `read`-Aufrufe unterhalb des aktiven cwd plus schreibgeschützte Suchtools (`search`, `web_search`, `memory_search`). Unbekannte/nicht zum Kern gehörende Tools, Reads außerhalb des Geltungsbereichs, exec-fähige Tools, Control-Plane-Tools, mutierende Tools und interaktive Abläufe erfordern immer eine ausdrückliche Prompt-Genehmigung.
- Vom Server bereitgestelltes `toolCall.kind` wird als nicht vertrauenswürdige Metadaten behandelt (nicht als Autorisierungsquelle).
- Diese ACP-Bridge-Richtlinie ist von ACPX-Harness-Berechtigungen getrennt. Wenn Sie OpenClaw über das `acpx`-Backend ausführen, ist `plugins.entries.acpx.config.permissionMode=approve-all` der Break-Glass-"yolo"-Schalter für diese Harness-Sitzung.

## Protokoll-Smoke-Testing

Für Debugging auf Protokollebene starten Sie ein Gateway mit isoliertem Zustand und steuern
`openclaw acp` über stdio mit einem ACP-JSON-RPC-Client. Decken Sie `initialize`,
`session/new`, `session/list` mit einem absoluten `cwd`, `session/resume`,
`session/close`, doppeltes Schließen und fehlendes Resume ab.

Der Nachweis sollte die angekündigten Lebenszyklusfähigkeiten, eine Gateway-gestützte
Sitzungszeile, Update-Benachrichtigungen und das Gateway-Log `sessions.list` enthalten:

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
CLI-Pfad kann ein Operator-Scope-Upgrade mit frischem Token anfordern; die Korrektheit der ACP-Bridge
wird durch ACP-stdio-Frames plus das Gateway-Log `sessions.list` nachgewiesen.

## So verwenden Sie dies

Verwenden Sie ACP, wenn eine IDE (oder ein anderer Client) Agent Client Protocol spricht und Sie möchten,
dass sie eine OpenClaw Gateway-Sitzung steuert.

1. Stellen Sie sicher, dass das Gateway läuft (lokal oder remote).
2. Konfigurieren Sie das Gateway-Ziel (Konfiguration oder Flags).
3. Richten Sie Ihre IDE darauf ein, `openclaw acp` über stdio auszuführen.

Beispielkonfiguration (persistiert):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

Direkter Beispielaufruf (kein Schreiben der Konfiguration):

```bash
openclaw acp --url wss://gateway-host:18789 --token <token>
# preferred for local process safety
openclaw acp --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token
```

## Agents auswählen

ACP wählt Agents nicht direkt aus. Es routet über den Gateway-Sitzungsschlüssel.

Verwenden Sie agent-bezogene Sitzungsschlüssel, um einen bestimmten Agent anzusteuern:

```bash
openclaw acp --session agent:main:main
openclaw acp --session agent:design:main
openclaw acp --session agent:qa:bug-123
```

Jede ACP-Sitzung wird einem einzelnen Gateway-Sitzungsschlüssel zugeordnet. Ein Agent kann viele
Sitzungen haben; ACP verwendet standardmäßig eine isolierte `acp:<uuid>`-Sitzung, sofern Sie den
Schlüssel oder das Label nicht überschreiben.

Sitzungsspezifische `mcpServers` werden im Bridge-Modus nicht unterstützt. Wenn ein ACP-Client
sie während `newSession` oder `loadSession` sendet, gibt die Bridge einen klaren
Fehler zurück, statt sie stillschweigend zu ignorieren.

Wenn ACPX-gestützte Sitzungen OpenClaw-Plugin-Tools oder ausgewählte
integrierte Tools wie `cron` sehen sollen, aktivieren Sie stattdessen die Gateway-seitigen ACPX-MCP-Bridges,
anstatt zu versuchen, sitzungsspezifische `mcpServers` zu übergeben. Siehe
[ACP-Agenten](/de/tools/acp-agents-setup#plugin-tools-mcp-bridge) und
[OpenClaw-Tools-MCP-Bridge](/de/tools/acp-agents-setup#openclaw-tools-mcp-bridge).

## Verwendung über `acpx` (Codex, Claude, andere ACP-Clients)

Wenn ein Coding-Agent wie Codex oder Claude Code mit Ihrem
OpenClaw-Bot über ACP kommunizieren soll, verwenden Sie `acpx` mit dem integrierten Ziel `openclaw`.

Typischer Ablauf:

1. Führen Sie das Gateway aus und stellen Sie sicher, dass die ACP-Bridge es erreichen kann.
2. Richten Sie `acpx openclaw` auf `openclaw acp`.
3. Wählen Sie den OpenClaw-Sitzungsschlüssel, den der Coding-Agent verwenden soll.

Beispiele:

```bash
# One-shot request into your default OpenClaw ACP session
acpx openclaw exec "Summarize the active OpenClaw session state."

# Persistent named session for follow-up turns
acpx openclaw sessions ensure --name codex-bridge
acpx openclaw -s codex-bridge --cwd /path/to/repo \
  "Ask my OpenClaw work agent for recent context relevant to this repo."
```

Wenn `acpx openclaw` jedes Mal ein bestimmtes Gateway und einen bestimmten Sitzungsschlüssel
verwenden soll, überschreiben Sie den Agent-Befehl `openclaw` in `~/.acpx/config.json`:

```json
{
  "agents": {
    "openclaw": {
      "command": "env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 openclaw acp --url ws://127.0.0.1:18789 --token-file ~/.openclaw/gateway.token --session agent:main:main"
    }
  }
}
```

Für einen repo-lokalen OpenClaw-Checkout verwenden Sie den direkten CLI-Einstiegspunkt statt des
Dev-Runners, damit der ACP-Stream sauber bleibt. Beispiel:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

Dies ist der einfachste Weg, Codex, Claude Code oder einem anderen ACP-fähigen Client zu ermöglichen,
Kontextinformationen von einem OpenClaw-Agent abzurufen, ohne ein Terminal auszulesen.

## Zed-Editor einrichten

Fügen Sie einen benutzerdefinierten ACP-Agent in `~/.config/zed/settings.json` hinzu (oder verwenden Sie die Einstellungen-Oberfläche von Zed):

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

- `--session <key>`: verwendet einen bestimmten Gateway-Sitzungsschlüssel.
- `--session-label <label>`: löst eine vorhandene Sitzung anhand des Labels auf.
- `--reset-session`: erzeugt eine neue Sitzungs-ID für diesen Schlüssel (gleicher Schlüssel, neues Transkript).

Wenn Ihr ACP-Client Metadaten unterstützt, können Sie sie pro Sitzung überschreiben:

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
- `--session-label <label>`: Standard-Sitzungslabel, das aufgelöst werden soll.
- `--require-existing`: fehlschlagen, wenn der Sitzungsschlüssel bzw. das Label nicht existiert.
- `--reset-session`: den Sitzungsschlüssel vor der ersten Verwendung zurücksetzen.
- `--no-prefix-cwd`: Prompts nicht mit dem Arbeitsverzeichnis präfixieren.
- `--provenance <off|meta|meta+receipt>`: ACP-Herkunftsmetadaten oder Belege einschließen.
- `--verbose, -v`: ausführliches Logging auf stderr.

Sicherheitshinweis:

- `--token` und `--password` können auf manchen Systemen in lokalen Prozesslisten sichtbar sein.
- Bevorzugen Sie `--token-file`/`--password-file` oder Umgebungsvariablen (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`).
- Die Gateway-Authentifizierungsauflösung folgt dem gemeinsamen Vertrag, der von anderen Gateway-Clients verwendet wird:
  - lokaler Modus: env (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> `gateway.remote.*`-Fallback nur, wenn `gateway.auth.*` nicht gesetzt ist (konfigurierte, aber nicht aufgelöste lokale SecretRefs schlagen geschlossen fehl)
  - Remote-Modus: `gateway.remote.*` mit env-/config-Fallback gemäß den Remote-Prioritätsregeln
  - `--url` ist überschreibungssicher und verwendet keine impliziten config-/env-Anmeldedaten wieder; übergeben Sie explizit `--token`/`--password` (oder Dateivarianten)
- Kindprozesse des ACP-Laufzeit-Backends erhalten `OPENCLAW_SHELL=acp`, was für kontextspezifische Shell-/Profilregeln verwendet werden kann.
- `openclaw acp client` setzt `OPENCLAW_SHELL=acp-client` für den erzeugten Bridge-Prozess.

### Optionen für `acp client`

- `--cwd <dir>`: Arbeitsverzeichnis für die ACP-Sitzung.
- `--server <command>`: ACP-Serverbefehl (Standard: `openclaw`).
- `--server-args <args...>`: zusätzliche Argumente, die an den ACP-Server übergeben werden.
- `--server-verbose`: ausführliches Logging auf dem ACP-Server aktivieren.
- `--verbose, -v`: ausführliches Client-Logging.

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [ACP-Agenten](/de/tools/acp-agents)
