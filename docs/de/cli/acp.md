---
read_when:
    - ACP-basierte IDE-Integrationen einrichten
    - Fehlerbehebung beim ACP-Sitzungsrouting an das Gateway
summary: ACP-Brücke für IDE-Integrationen ausführen
title: ACP
x-i18n:
    generated_at: "2026-05-06T06:41:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: c91de534078b4d49b2776d7a85264d2ba8d7bdd7a3cd715ce615b4b4b26c6528
    source_path: cli/acp.md
    workflow: 16
---

Führen Sie die [Agent Client Protocol (ACP)](https://agentclientprotocol.com/)-Bridge aus, die mit einem OpenClaw Gateway kommuniziert.

Dieser Befehl spricht ACP über stdio für IDEs und leitet Prompts über WebSocket
an das Gateway weiter. Er hält ACP-Sitzungen Gateway-Sitzungsschlüsseln zugeordnet.

`openclaw acp` ist eine Gateway-gestützte ACP-Bridge, keine vollständige ACP-native Editor-
Laufzeitumgebung. Der Fokus liegt auf Sitzungsrouting, Prompt-Zustellung und einfachen Streaming-
Aktualisierungen.

Wenn Sie möchten, dass ein externer MCP-Client direkt mit OpenClaw-Kanal-
Konversationen kommuniziert, anstatt eine ACP-Harness-Sitzung zu hosten, verwenden Sie
stattdessen [`openclaw mcp serve`](/de/cli/mcp).

## Was dies nicht ist

Diese Seite wird häufig mit ACP-Harness-Sitzungen verwechselt.

`openclaw acp` bedeutet:

- OpenClaw agiert als ACP-Server
- eine IDE oder ein ACP-Client verbindet sich mit OpenClaw
- OpenClaw leitet diese Arbeit in eine Gateway-Sitzung weiter

Dies unterscheidet sich von [ACP-Agenten](/de/tools/acp-agents), bei denen OpenClaw ein
externes Harness wie Codex oder Claude Code über `acpx` ausführt.

Kurzregel:

- Editor/Client möchte per ACP mit OpenClaw sprechen: Verwenden Sie `openclaw acp`
- OpenClaw soll Codex/Claude/Gemini als ACP-Harness starten: Verwenden Sie `/acp spawn` und [ACP-Agenten](/de/tools/acp-agents)

## Kompatibilitätsmatrix

| ACP-Bereich                                                          | Status             | Hinweise                                                                                                                                                                                                                                           |
| --------------------------------------------------------------------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `initialize`, `newSession`, `prompt`, `cancel`                        | Implementiert      | Kern-Bridge-Ablauf über stdio zu Gateway chat/send + abort.                                                                                                                                                                                       |
| `listSessions`, Slash-Befehle                                        | Implementiert      | Die Sitzungsliste arbeitet mit dem Gateway-Sitzungsstatus; Befehle werden über `available_commands_update` angekündigt.                                                                                                                           |
| `loadSession`                                                         | Teilweise          | Bindet die ACP-Sitzung erneut an einen Gateway-Sitzungsschlüssel und spielt gespeicherte Benutzer-/Assistenten-Textverläufe wieder ab. Tool-/Systemverlauf wird noch nicht rekonstruiert.                                                         |
| Prompt-Inhalt (`text`, eingebettete `resource`, Bilder)               | Teilweise          | Text/Ressourcen werden in Chat-Eingaben abgeflacht; Bilder werden zu Gateway-Anhängen.                                                                                                                                                            |
| Sitzungsmodi                                                          | Teilweise          | `session/set_mode` wird unterstützt, und die Bridge stellt anfängliche Gateway-gestützte Sitzungssteuerungen für Denkstufe, Tool-Ausführlichkeit, Reasoning, Nutzungsdetails und erhöhte Aktionen bereit. Breitere ACP-native Modus-/Konfigurationsoberflächen liegen weiterhin außerhalb des Umfangs. |
| Sitzungsinformationen und Nutzungsaktualisierungen                    | Teilweise          | Die Bridge gibt `session_info_update`- und Best-Effort-`usage_update`-Benachrichtigungen aus zwischengespeicherten Gateway-Sitzungs-Snapshots aus. Die Nutzung ist näherungsweise und wird nur gesendet, wenn Gateway-Token-Gesamtsummen als aktuell markiert sind. |
| Tool-Streaming                                                        | Teilweise          | `tool_call`- / `tool_call_update`-Ereignisse enthalten rohes I/O, Textinhalt und Best-Effort-Dateispeicherorte, wenn Gateway-Tool-Argumente/-Ergebnisse diese bereitstellen. Eingebettete Terminals und umfangreichere diff-native Ausgabe werden noch nicht offengelegt. |
| MCP-Server pro Sitzung (`mcpServers`)                                 | Nicht unterstützt  | Der Bridge-Modus lehnt MCP-Server-Anfragen pro Sitzung ab. Konfigurieren Sie MCP stattdessen auf dem OpenClaw-Gateway oder -Agenten.                                                                                                               |
| Client-Dateisystemmethoden (`fs/read_text_file`, `fs/write_text_file`) | Nicht unterstützt  | Die Bridge ruft keine ACP-Client-Dateisystemmethoden auf.                                                                                                                                                                                         |
| Client-Terminalmethoden (`terminal/*`)                                | Nicht unterstützt  | Die Bridge erstellt keine ACP-Client-Terminals und streamt keine Terminal-IDs über Tool-Aufrufe.                                                                                                                                                  |
| Sitzungspläne / Denk-Streaming                                        | Nicht unterstützt  | Die Bridge gibt derzeit Ausgabetext und Tool-Status aus, keine ACP-Plan- oder Denk-Aktualisierungen.                                                                                                                                              |

## Bekannte Einschränkungen

- `loadSession` spielt gespeicherte Benutzer- und Assistenten-Textverläufe wieder ab, rekonstruiert aber keine
  historischen Tool-Aufrufe, Systemhinweise oder umfangreicheren ACP-nativen Ereignis-
  typen.
- Wenn mehrere ACP-Clients denselben Gateway-Sitzungsschlüssel teilen, erfolgt das Ereignis- und Abbruch-
  Routing nach Best-Effort statt strikt isoliert pro Client. Bevorzugen Sie die
  standardmäßig isolierten `acp:<uuid>`-Sitzungen, wenn Sie saubere editorlokale
  Durchläufe benötigen.
- Gateway-Stoppzustände werden in ACP-Stoppgründe übersetzt, aber diese Zuordnung ist
  weniger ausdrucksstark als eine vollständig ACP-native Laufzeitumgebung.
- Anfängliche Sitzungssteuerungen zeigen derzeit eine fokussierte Teilmenge von Gateway-Reglern:
  Denkstufe, Tool-Ausführlichkeit, Reasoning, Nutzungsdetails und erhöhte
  Aktionen. Modellauswahl und Exec-Host-Steuerungen werden noch nicht als ACP-
  Konfigurationsoptionen offengelegt.
- `session_info_update` und `usage_update` werden aus Gateway-Sitzungs-
  Snapshots abgeleitet, nicht aus live ACP-nativer Laufzeitabrechnung. Die Nutzung ist näherungsweise,
  enthält keine Kostendaten und wird nur ausgegeben, wenn das Gateway die Gesamttoken-
  daten als aktuell markiert.
- Tool-Begleitdaten sind Best-Effort. Die Bridge kann Dateipfade anzeigen, die
  in bekannten Tool-Argumenten/-Ergebnissen vorkommen, gibt aber noch keine ACP-Terminals oder
  strukturierten Datei-Diffs aus.

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
Er startet die ACP-Bridge und ermöglicht Ihnen, Prompts interaktiv einzugeben.

```bash
openclaw acp client

# Point the spawned bridge at a remote Gateway
openclaw acp client --server-args --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Override the server command (default: openclaw)
openclaw acp client --server "node" --server-args openclaw.mjs acp --url ws://127.0.0.1:19001
```

Berechtigungsmodell (Client-Debug-Modus):

- Automatische Genehmigung basiert auf einer Allowlist und gilt nur für vertrauenswürdige Kern-Tool-IDs.
- Automatische Genehmigung für `read` ist auf das aktuelle Arbeitsverzeichnis beschränkt (`--cwd`, wenn gesetzt).
- ACP genehmigt nur eng gefasste schreibgeschützte Klassen automatisch: bereichsbeschränkte `read`-Aufrufe unter dem aktiven cwd plus schreibgeschützte Such-Tools (`search`, `web_search`, `memory_search`). Unbekannte/nicht zentrale Tools, Lesezugriffe außerhalb des Geltungsbereichs, exec-fähige Tools, Control-Plane-Tools, verändernde Tools und interaktive Abläufe erfordern immer eine ausdrückliche Prompt-Genehmigung.
- Vom Server bereitgestelltes `toolCall.kind` wird als nicht vertrauenswürdige Metadaten behandelt (nicht als Autorisierungsquelle).
- Diese ACP-Bridge-Richtlinie ist von ACPX-Harness-Berechtigungen getrennt. Wenn Sie OpenClaw über das `acpx`-Backend ausführen, ist `plugins.entries.acpx.config.permissionMode=approve-all` der Notfall-Schalter „yolo“ für diese Harness-Sitzung.

## Verwendung

Verwenden Sie ACP, wenn eine IDE (oder ein anderer Client) das Agent Client Protocol spricht und Sie möchten,
dass sie eine OpenClaw Gateway-Sitzung steuert.

1. Stellen Sie sicher, dass das Gateway läuft (lokal oder remote).
2. Konfigurieren Sie das Gateway-Ziel (Konfiguration oder Flags).
3. Verweisen Sie Ihre IDE darauf, `openclaw acp` über stdio auszuführen.

Beispielkonfiguration (persistiert):

```bash
openclaw config set gateway.remote.url wss://gateway-host:18789
openclaw config set gateway.remote.token <token>
```

Beispiel für direkte Ausführung (kein Konfigurationsschreiben):

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
Sitzungen haben; ACP verwendet standardmäßig eine isolierte `acp:<uuid>`-Sitzung, sofern Sie den
Schlüssel oder das Label nicht überschreiben.

`mcpServers` pro Sitzung werden im Bridge-Modus nicht unterstützt. Wenn ein ACP-Client
sie während `newSession` oder `loadSession` sendet, gibt die Bridge einen klaren
Fehler zurück, statt sie stillschweigend zu ignorieren.

Wenn ACPX-gestützte Sitzungen OpenClaw-Plugin-Tools oder ausgewählte
integrierte Tools wie `cron` sehen sollen, aktivieren Sie die Gateway-seitigen ACPX-MCP-Bridges, statt
zu versuchen, `mcpServers` pro Sitzung zu übergeben. Siehe
[ACP-Agenten](/de/tools/acp-agents-setup#plugin-tools-mcp-bridge) und
[OpenClaw-Tools-MCP-Bridge](/de/tools/acp-agents-setup#openclaw-tools-mcp-bridge).

## Verwendung aus `acpx` (Codex, Claude, andere ACP-Clients)

Wenn Sie möchten, dass ein Coding-Agent wie Codex oder Claude Code über ACP mit Ihrem
OpenClaw-Bot spricht, verwenden Sie `acpx` mit seinem integrierten Ziel `openclaw`.

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
verwenden soll, überschreiben Sie den Agentenbefehl `openclaw` in `~/.acpx/config.json`:

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
Dev-Runners, damit der ACP-Stream sauber bleibt. Zum Beispiel:

```bash
env OPENCLAW_HIDE_BANNER=1 OPENCLAW_SUPPRESS_NOTES=1 node openclaw.mjs acp ...
```

Dies ist der einfachste Weg, Codex, Claude Code oder einem anderen ACP-fähigen Client zu ermöglichen,
Kontextinformationen von einem OpenClaw-Agenten abzurufen, ohne ein Terminal auszulesen.

## Zed-Editor-Einrichtung

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

Um ein bestimmtes Gateway oder einen bestimmten Agenten anzusprechen:

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

Öffnen Sie in Zed den Agent-Bereich und wählen Sie „OpenClaw ACP“ aus, um einen Thread zu starten.

## Sitzungszuordnung

Standardmäßig erhalten ACP-Sitzungen einen isolierten Gateway-Sitzungsschlüssel mit dem Präfix `acp:`.
Um eine bekannte Sitzung wiederzuverwenden, übergeben Sie einen Sitzungsschlüssel oder ein Label:

- `--session <key>`: Einen bestimmten Gateway-Sitzungsschlüssel verwenden.
- `--session-label <label>`: Eine vorhandene Sitzung anhand des Labels auflösen.
- `--reset-session`: Eine frische Sitzungs-ID für diesen Schlüssel erzeugen (gleicher Schlüssel, neues Transkript).

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
- `--require-existing`: Fehlschlagen, wenn der Sitzungsschlüssel/das Label nicht vorhanden ist.
- `--reset-session`: Den Sitzungsschlüssel vor der ersten Verwendung zurücksetzen.
- `--no-prefix-cwd`: Prompts kein Arbeitsverzeichnis voranstellen.
- `--provenance <off|meta|meta+receipt>`: ACP-Herkunftsmetadaten oder Belege einschließen.
- `--verbose, -v`: Ausführliche Protokollierung nach stderr.

Sicherheitshinweis:

- `--token` und `--password` können auf manchen Systemen in lokalen Prozesslisten sichtbar sein.
- Bevorzugen Sie `--token-file`/`--password-file` oder Umgebungsvariablen (`OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PASSWORD`).
- Die Gateway-Authentifizierungsauflösung folgt dem gemeinsam genutzten Vertrag, der von anderen Gateway-Clients verwendet wird:
  - lokaler Modus: Umgebung (`OPENCLAW_GATEWAY_*`) -> `gateway.auth.*` -> `gateway.remote.*`-Fallback nur, wenn `gateway.auth.*` nicht gesetzt ist (konfigurierte, aber nicht aufgelöste lokale SecretRefs schlagen sicher fehl)
  - Remote-Modus: `gateway.remote.*` mit Fallback auf Umgebung/Konfiguration gemäß den Remote-Prioritätsregeln
  - `--url` ist überschreibungssicher und verwendet keine impliziten Konfigurations-/Umgebungsanmeldedaten erneut; übergeben Sie explizit `--token`/`--password` (oder Dateivarianten)
- Unterprozesse des ACP-Runtime-Backends erhalten `OPENCLAW_SHELL=acp`, was für kontextspezifische Shell-/Profilregeln verwendet werden kann.
- `openclaw acp client` setzt `OPENCLAW_SHELL=acp-client` im gestarteten Bridge-Prozess.

### Optionen für `acp client`

- `--cwd <dir>`: Arbeitsverzeichnis für die ACP-Sitzung.
- `--server <command>`: ACP-Serverbefehl (Standard: `openclaw`).
- `--server-args <args...>`: Zusätzliche Argumente, die an den ACP-Server übergeben werden.
- `--server-verbose`: Ausführliche Protokollierung auf dem ACP-Server aktivieren.
- `--verbose, -v`: Ausführliche Client-Protokollierung.

## Verwandte Themen

- [CLI-Referenz](/de/cli)
- [ACP-Agenten](/de/tools/acp-agents)
