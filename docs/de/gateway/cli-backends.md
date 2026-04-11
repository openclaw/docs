---
read_when:
    - Sie möchten einen zuverlässigen Fallback, wenn API-Anbieter ausfallen
    - Sie verwenden Codex CLI oder andere lokale KI-CLIs und möchten sie wiederverwenden
    - Sie möchten die MCP-Loopback-Bridge für den Tool-Zugriff des CLI-Backends verstehen
summary: 'CLI-Backends: lokaler KI-CLI-Fallback mit optionaler MCP-Tool-Bridge'
title: CLI-Backends
x-i18n:
    generated_at: "2026-04-11T02:44:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: d108dbea043c260a80d15497639298f71a6b4d800f68d7b39bc129f7667ca608
    source_path: gateway/cli-backends.md
    workflow: 15
---

# CLI-Backends (Fallback-Laufzeit)

OpenClaw kann **lokale KI-CLIs** als **reinen Text-Fallback** ausführen, wenn API-Anbieter ausfallen,
rate-limitiert sind oder sich vorübergehend fehlerhaft verhalten. Das ist bewusst konservativ:

- **OpenClaw-Tools werden nicht direkt injiziert**, aber Backends mit `bundleMcp: true`
  können Gateway-Tools über eine Loopback-MCP-Bridge erhalten.
- **JSONL-Streaming** für CLIs, die es unterstützen.
- **Sitzungen werden unterstützt** (damit Folge-Turns kohärent bleiben).
- **Bilder können durchgereicht werden**, wenn die CLI Bildpfade akzeptiert.

Dies ist eher als **Sicherheitsnetz** als als primärer Pfad gedacht. Verwenden Sie es, wenn Sie
„funktioniert immer“-Textantworten möchten, ohne von externen APIs abhängig zu sein.

Wenn Sie stattdessen eine vollständige Harness-Laufzeit mit ACP-Sitzungssteuerung, Hintergrundaufgaben,
Thread-/Konversationsbindung und persistenten externen Coding-Sitzungen möchten, verwenden Sie
[ACP Agents](/de/tools/acp-agents). CLI-Backends sind kein ACP.

## Einsteigerfreundlicher Schnellstart

Sie können Codex CLI **ohne Konfiguration** verwenden (das gebündelte OpenAI-Plugin
registriert ein Standard-Backend):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.4
```

Wenn Ihr Gateway unter launchd/systemd läuft und `PATH` minimal ist, fügen Sie nur den
Befehlspfad hinzu:

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
      },
    },
  },
}
```

Das ist alles. Keine Schlüssel, keine zusätzliche Auth-Konfiguration über die CLI selbst hinaus erforderlich.

Wenn Sie ein gebündeltes CLI-Backend als **primären Nachrichtenanbieter** auf einem
Gateway-Host verwenden, lädt OpenClaw jetzt automatisch das zugehörige gebündelte Plugin, wenn Ihre Konfiguration
dieses Backend explizit in einer Modell-Referenz oder unter
`agents.defaults.cliBackends` referenziert.

## Als Fallback verwenden

Fügen Sie Ihrer Fallback-Liste ein CLI-Backend hinzu, damit es nur ausgeführt wird, wenn primäre Modelle fehlschlagen:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["codex-cli/gpt-5.4"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "codex-cli/gpt-5.4": {},
      },
    },
  },
}
```

Hinweise:

- Wenn Sie `agents.defaults.models` (Allowlist) verwenden, müssen Sie dort auch Ihre CLI-Backend-Modelle aufnehmen.
- Wenn der primäre Anbieter fehlschlägt (Authentifizierung, Ratenlimits, Timeouts), versucht OpenClaw
  als Nächstes das CLI-Backend.

## Konfigurationsüberblick

Alle CLI-Backends befinden sich unter:

```
agents.defaults.cliBackends
```

Jeder Eintrag ist durch eine **Anbieter-ID** gekennzeichnet (z. B. `codex-cli`, `my-cli`).
Die Anbieter-ID wird zur linken Seite Ihrer Modell-Referenz:

```
<provider>/<model>
```

### Beispielkonfiguration

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          input: "arg",
          modelArg: "--model",
          modelAliases: {
            "claude-opus-4-6": "opus",
            "claude-sonnet-4-6": "sonnet",
          },
          sessionArg: "--session",
          sessionMode: "existing",
          sessionIdFields: ["session_id", "conversation_id"],
          systemPromptArg: "--system",
          // Codex-style CLIs can point at a prompt file instead:
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          serialize: true,
        },
      },
    },
  },
}
```

## Funktionsweise

1. **Wählt ein Backend aus** anhand des Anbieterpräfixes (`codex-cli/...`).
2. **Erstellt einen System-Prompt** unter Verwendung desselben OpenClaw-Prompts und Workspace-Kontexts.
3. **Führt die CLI aus** mit einer Sitzungs-ID (falls unterstützt), damit der Verlauf konsistent bleibt.
4. **Parst die Ausgabe** (JSON oder Klartext) und gibt den finalen Text zurück.
5. **Persistiert Sitzungs-IDs** pro Backend, damit Folgeanfragen dieselbe CLI-Sitzung wiederverwenden.

<Note>
Das gebündelte Anthropic-`claude-cli`-Backend wird wieder unterstützt. Anthropic-Mitarbeiter
haben uns mitgeteilt, dass die Nutzung von Claude CLI im OpenClaw-Stil wieder zulässig ist, daher behandelt OpenClaw
die Verwendung von `claude -p` für diese Integration als erlaubt, sofern Anthropic keine
neue Richtlinie veröffentlicht.
</Note>

Das gebündelte OpenAI-`codex-cli`-Backend übergibt den System-Prompt von OpenClaw über
die `model_instructions_file`-Konfigurationsüberschreibung von Codex (`-c
model_instructions_file="..."`). Codex bietet kein Claude-ähnliches
`--append-system-prompt`-Flag, daher schreibt OpenClaw den zusammengesetzten Prompt für jede neue Codex-CLI-Sitzung
in eine temporäre Datei.

Das gebündelte Anthropic-`claude-cli`-Backend erhält den OpenClaw-Skills-Snapshot
auf zwei Arten: den kompakten OpenClaw-Skills-Katalog im angehängten System-Prompt und
ein temporäres Claude-Code-Plugin, das mit `--plugin-dir` übergeben wird. Das Plugin enthält
nur die zulässigen Skills für diese Agent-/Sitzung, sodass der native Skill-Resolver von Claude Code
dieselbe gefilterte Menge sieht, die OpenClaw andernfalls im Prompt bewerben würde.
Skill-Umgebungs-/API-Schlüssel-Überschreibungen werden weiterhin von OpenClaw auf die
Child-Process-Umgebung für den Lauf angewendet.

## Sitzungen

- Wenn die CLI Sitzungen unterstützt, setzen Sie `sessionArg` (z. B. `--session-id`) oder
  `sessionArgs` (Platzhalter `{sessionId}`), wenn die ID in mehrere Flags eingefügt
  werden muss.
- Wenn die CLI einen **Resume-Subcommand** mit anderen Flags verwendet, setzen Sie
  `resumeArgs` (ersetzt `args` beim Fortsetzen) und optional `resumeOutput`
  (für nicht-JSON-Resumes).
- `sessionMode`:
  - `always`: sendet immer eine Sitzungs-ID (neue UUID, falls keine gespeichert ist).
  - `existing`: sendet eine Sitzungs-ID nur, wenn zuvor eine gespeichert wurde.
  - `none`: sendet niemals eine Sitzungs-ID.

Hinweise zur Serialisierung:

- `serialize: true` hält Läufe auf derselben Lane in Reihenfolge.
- Die meisten CLIs serialisieren auf einer Anbieter-Lane.
- OpenClaw verwirft die Wiederverwendung gespeicherter CLI-Sitzungen, wenn sich der Auth-Status des Backends ändert, einschließlich erneuter Anmeldung, Token-Rotation oder geänderter Anmeldedaten eines Auth-Profils.

## Bilder (Durchreichen)

Wenn Ihre CLI Bildpfade akzeptiert, setzen Sie `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw schreibt Base64-Bilder in temporäre Dateien. Wenn `imageArg` gesetzt ist, werden diese
Pfade als CLI-Argumente übergeben. Wenn `imageArg` fehlt, hängt OpenClaw die
Dateipfade an den Prompt an (Path Injection), was für CLIs ausreicht, die lokale
Dateien aus einfachen Pfaden automatisch laden.

## Ein- / Ausgaben

- `output: "json"` (Standard) versucht, JSON zu parsen und Text + Sitzungs-ID zu extrahieren.
- Für die JSON-Ausgabe von Gemini CLI liest OpenClaw den Antworttext aus `response` und
  die Nutzung aus `stats`, wenn `usage` fehlt oder leer ist.
- `output: "jsonl"` parst JSONL-Streams (zum Beispiel Codex CLI `--json`) und extrahiert die finale Agent-Nachricht sowie Sitzungs-
  kennungen, sofern vorhanden.
- `output: "text"` behandelt stdout als finale Antwort.

Eingabemodi:

- `input: "arg"` (Standard) übergibt den Prompt als letztes CLI-Argument.
- `input: "stdin"` sendet den Prompt über stdin.
- Wenn der Prompt sehr lang ist und `maxPromptArgChars` gesetzt ist, wird stdin verwendet.

## Standards (plugin-eigen)

Das gebündelte OpenAI-Plugin registriert außerdem einen Standard für `codex-cli`:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Das gebündelte Google-Plugin registriert außerdem einen Standard für `google-gemini-cli`:

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

Voraussetzung: Die lokale Gemini CLI muss installiert und als
`gemini` auf `PATH` verfügbar sein (`brew install gemini-cli` oder
`npm install -g @google/gemini-cli`).

Hinweise zu Gemini-CLI-JSON:

- Antworttext wird aus dem JSON-Feld `response` gelesen.
- Die Nutzung fällt auf `stats` zurück, wenn `usage` fehlt oder leer ist.
- `stats.cached` wird in OpenClaw-`cacheRead` normalisiert.
- Wenn `stats.input` fehlt, leitet OpenClaw Eingabetoken aus
  `stats.input_tokens - stats.cached` ab.

Überschreiben Sie dies nur bei Bedarf (üblich: absoluter `command`-Pfad).

## Plugin-eigene Standards

CLI-Backend-Standards sind jetzt Teil der Plugin-Oberfläche:

- Plugins registrieren sie mit `api.registerCliBackend(...)`.
- Die `id` des Backends wird zum Anbieterpräfix in Modell-Referenzen.
- Benutzerkonfiguration in `agents.defaults.cliBackends.<id>` überschreibt weiterhin den Plugin-Standard.
- Backend-spezifische Konfigurationsbereinigung bleibt über den optionalen
  Hook `normalizeConfig` plugin-eigen.

Plugins, die kleine Kompatibilitäts-Shims für Prompt/Nachrichten benötigen, können
bidirektionale Texttransformationen deklarieren, ohne einen Anbieter oder ein CLI-Backend zu ersetzen:

```typescript
api.registerTextTransforms({
  input: [
    { from: /red basket/g, to: "blue basket" },
    { from: /paper ticket/g, to: "digital ticket" },
    { from: /left shelf/g, to: "right shelf" },
  ],
  output: [
    { from: /blue basket/g, to: "red basket" },
    { from: /digital ticket/g, to: "paper ticket" },
    { from: /right shelf/g, to: "left shelf" },
  ],
});
```

`input` schreibt den System-Prompt und den Benutzer-Prompt um, die an die CLI übergeben werden. `output`
schreibt gestreamte Assistant-Deltas und geparsten finalen Text um, bevor OpenClaw seine
eigenen Kontrollmarker und die Zustellung an den Kanal verarbeitet.

Für CLIs, die JSONL ausgeben, das mit Claude Code stream-json kompatibel ist, setzen Sie
`jsonlDialect: "claude-stream-json"` in der Konfiguration dieses Backends.

## Bundle-MCP-Overlays

CLI-Backends erhalten **keine** OpenClaw-Tool-Aufrufe direkt, aber ein Backend kann
sich mit `bundleMcp: true` für ein generiertes MCP-Konfigurations-Overlay anmelden.

Aktuelles gebündeltes Verhalten:

- `claude-cli`: generierte strikte MCP-Konfigurationsdatei
- `codex-cli`: Inline-Konfigurationsüberschreibungen für `mcp_servers`
- `google-gemini-cli`: generierte Gemini-Systemeinstellungsdatei

Wenn Bundle MCP aktiviert ist, führt OpenClaw Folgendes aus:

- startet einen Loopback-HTTP-MCP-Server, der Gateway-Tools für den CLI-Prozess bereitstellt
- authentifiziert die Bridge mit einem Sitzungstoken pro Sitzung (`OPENCLAW_MCP_TOKEN`)
- begrenzt den Tool-Zugriff auf die aktuelle Sitzung, das Konto und den Kanalkontext
- lädt aktivierte Bundle-MCP-Server für den aktuellen Workspace
- führt sie mit einer eventuell vorhandenen MCP-Konfigurations-/Einstellungsstruktur des Backends zusammen
- schreibt die Startkonfiguration unter Verwendung des backend-eigenen Integrationsmodus aus der besitzenden Erweiterung um

Wenn keine MCP-Server aktiviert sind, injiziert OpenClaw dennoch eine strikte Konfiguration, wenn ein
Backend sich für Bundle MCP anmeldet, damit Hintergrundläufe isoliert bleiben.

## Einschränkungen

- **Keine direkten OpenClaw-Tool-Aufrufe.** OpenClaw injiziert keine Tool-Aufrufe in
  das CLI-Backend-Protokoll. Backends sehen Gateway-Tools nur, wenn sie sich für
  `bundleMcp: true` anmelden.
- **Streaming ist backend-spezifisch.** Einige Backends streamen JSONL; andere puffern
  bis zum Beenden.
- **Strukturierte Ausgaben** hängen vom JSON-Format der CLI ab.
- **Codex-CLI-Sitzungen** werden per Textausgabe fortgesetzt (kein JSONL), was weniger
  strukturiert ist als der anfängliche `--json`-Lauf. OpenClaw-Sitzungen funktionieren weiterhin
  normal.

## Fehlerbehebung

- **CLI nicht gefunden**: Setzen Sie `command` auf einen vollständigen Pfad.
- **Falscher Modellname**: Verwenden Sie `modelAliases`, um `provider/model` → CLI-Modell abzubilden.
- **Keine Sitzungskontinuität**: Stellen Sie sicher, dass `sessionArg` gesetzt ist und `sessionMode` nicht
  `none` ist (Codex CLI kann derzeit nicht mit JSON-Ausgabe fortsetzen).
- **Bilder werden ignoriert**: Setzen Sie `imageArg` (und prüfen Sie, ob die CLI Dateipfade unterstützt).
