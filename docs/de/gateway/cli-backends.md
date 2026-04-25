---
read_when:
    - Sie möchten einen zuverlässigen Fallback, wenn API-Provider ausfallen.
    - Sie verwenden Codex CLI oder andere lokale KI-CLIs und möchten sie wiederverwenden.
    - Sie möchten die lokale MCP-Loopback-Bridge für den Tool-Zugriff des CLI-Backends verstehen.
summary: 'CLI-Backends: lokaler KI-CLI-Fallback mit optionaler MCP-Tool-Bridge'
title: CLI-Backends
x-i18n:
    generated_at: "2026-04-25T13:45:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07a4651d7faf1ebafc66bda2e3ade6e541d59c9827f314169e1593e07f0bc2f5
    source_path: gateway/cli-backends.md
    workflow: 15
---

OpenClaw kann **lokale KI-CLIs** als **reinen Text-Fallback** ausführen, wenn API-Provider ausgefallen,
rate-limitiert oder vorübergehend fehlerhaft sind. Das ist bewusst konservativ gehalten:

- **OpenClaw-Tools werden nicht direkt injiziert**, aber Backends mit `bundleMcp: true`
  können Gateway-Tools über eine lokale MCP-Loopback-Bridge erhalten.
- **JSONL-Streaming** für CLIs, die es unterstützen.
- **Sitzungen werden unterstützt** (damit Folge-Turns kohärent bleiben).
- **Bilder können durchgereicht werden**, wenn die CLI Bildpfade akzeptiert.

Dies ist als **Sicherheitsnetz** und nicht als primärer Pfad gedacht. Verwenden Sie es, wenn Sie
„funktioniert immer“-Textantworten möchten, ohne sich auf externe APIs zu verlassen.

Wenn Sie eine vollständige Harness-Laufzeit mit ACP-Sitzungssteuerung, Hintergrundaufgaben,
Thread-/Unterhaltungsbindung und persistenten externen Coding-Sitzungen möchten, verwenden Sie
stattdessen [ACP Agents](/de/tools/acp-agents). CLI-Backends sind kein ACP.

## Einsteigerfreundlicher Schnellstart

Sie können Codex CLI **ohne Konfiguration** verwenden (das gebündelte OpenAI-Plugin
registriert ein Standard-Backend):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
```

Wenn Ihr Gateway unter launchd/systemd läuft und PATH minimal ist, fügen Sie nur den
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

Wenn Sie ein gebündeltes CLI-Backend als **primären Nachrichten-Provider** auf einem
Gateway-Host verwenden, lädt OpenClaw nun automatisch das zugehörige gebündelte Plugin, wenn Ihre Konfiguration
dieses Backend explizit in einem Modell-Ref oder unter
`agents.defaults.cliBackends` referenziert.

## Verwendung als Fallback

Fügen Sie Ihrer Fallback-Liste ein CLI-Backend hinzu, damit es nur ausgeführt wird, wenn primäre Modelle fehlschlagen:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["codex-cli/gpt-5.5"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "codex-cli/gpt-5.5": {},
      },
    },
  },
}
```

Hinweise:

- Wenn Sie `agents.defaults.models` (Allowlist) verwenden, müssen Sie dort auch Ihre CLI-Backend-Modelle aufnehmen.
- Wenn der primäre Provider fehlschlägt (Auth, Rate-Limits, Timeouts), versucht OpenClaw
  als Nächstes das CLI-Backend.

## Konfigurationsüberblick

Alle CLI-Backends befinden sich unter:

```
agents.defaults.cliBackends
```

Jeder Eintrag wird durch eine **Provider-ID** verschlüsselt (z. B. `codex-cli`, `my-cli`).
Die Provider-ID wird zur linken Seite Ihres Modell-Refs:

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
          // Für CLIs mit einem dedizierten Prompt-Datei-Flag:
          // systemPromptFileArg: "--system-file",
          // CLIs im Codex-Stil können stattdessen auf eine Prompt-Datei zeigen:
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

## So funktioniert es

1. **Wählt ein Backend aus** basierend auf dem Provider-Präfix (`codex-cli/...`).
2. **Erstellt einen System-Prompt** mit demselben OpenClaw-Prompt + Workspace-Kontext.
3. **Führt die CLI** mit einer Sitzungs-ID aus (falls unterstützt), damit der Verlauf konsistent bleibt.
   Das gebündelte Backend `claude-cli` hält einen Claude-stdio-Prozess pro
   OpenClaw-Sitzung am Leben und sendet Folge-Turns über stream-json-stdin.
4. **Parst die Ausgabe** (JSON oder Klartext) und gibt den finalen Text zurück.
5. **Persistiert Sitzungs-IDs** pro Backend, sodass Folge-Turns dieselbe CLI-Sitzung wiederverwenden.

<Note>
Das gebündelte Anthropic-Backend `claude-cli` wird wieder unterstützt. Anthropic-Mitarbeiter
haben uns mitgeteilt, dass die Nutzung von Claude CLI im OpenClaw-Stil wieder erlaubt ist, daher behandelt OpenClaw
die Nutzung von `claude -p` für diese Integration als zulässig, sofern Anthropic keine
neue Richtlinie veröffentlicht.
</Note>

Das gebündelte OpenAI-Backend `codex-cli` übergibt den System-Prompt von OpenClaw über
den Config-Override `model_instructions_file` von Codex (`-c
model_instructions_file="..."`). Codex stellt kein Flag im Claude-Stil wie
`--append-system-prompt` bereit, daher schreibt OpenClaw den assemblierten Prompt für jede neue Codex-CLI-Sitzung in eine
temporäre Datei.

Das gebündelte Anthropic-Backend `claude-cli` erhält den OpenClaw-Snapshot von Skills
auf zwei Wegen: den kompakten OpenClaw-Skills-Katalog im angehängten System-Prompt und
ein temporäres Claude-Code-Plugin, das mit `--plugin-dir` übergeben wird. Das Plugin enthält
nur die zulässigen Skills für diesen Agenten/diese Sitzung, sodass der native Skill-Resolver von Claude Code
dieselbe gefilterte Menge sieht, die OpenClaw andernfalls im Prompt ankündigen würde. Überschreibungen von Skill-Env/API-Keys
wendet OpenClaw weiterhin auf die Umgebung des Child-Prozesses für den Lauf an.

Claude CLI hat außerdem einen eigenen nicht interaktiven Berechtigungsmodus. OpenClaw bildet diesen
auf die bestehende Exec-Richtlinie ab, statt Claude-spezifische Konfiguration hinzuzufügen: Wenn die
effektiv angeforderte Exec-Richtlinie YOLO ist (`tools.exec.security: "full"` und
`tools.exec.ask: "off"`), fügt OpenClaw `--permission-mode bypassPermissions` hinzu.
Agentenspezifische Einstellungen `agents.list[].tools.exec` überschreiben globale `tools.exec` für
diesen Agenten. Um einen anderen Claude-Modus zu erzwingen, setzen Sie explizite rohe Backend-Args
wie `--permission-mode default` oder `--permission-mode acceptEdits` unter
`agents.defaults.cliBackends.claude-cli.args` und die entsprechenden `resumeArgs`.

Bevor OpenClaw das gebündelte Backend `claude-cli` verwenden kann, muss Claude Code selbst bereits auf demselben Host angemeldet sein:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Verwenden Sie `agents.defaults.cliBackends.claude-cli.command` nur dann, wenn das Binary `claude`
noch nicht in `PATH` vorhanden ist.

## Sitzungen

- Wenn die CLI Sitzungen unterstützt, setzen Sie `sessionArg` (z. B. `--session-id`) oder
  `sessionArgs` (Platzhalter `{sessionId}`), wenn die ID in mehrere Flags eingefügt werden muss.
- Wenn die CLI einen **Resume-Subcommand** mit anderen Flags verwendet, setzen Sie
  `resumeArgs` (ersetzt `args` beim Fortsetzen) und optional `resumeOutput`
  (für nicht JSON-basierte Fortsetzungen).
- `sessionMode`:
  - `always`: immer eine Sitzungs-ID senden (neue UUID, wenn keine gespeichert ist).
  - `existing`: nur dann eine Sitzungs-ID senden, wenn zuvor eine gespeichert wurde.
  - `none`: niemals eine Sitzungs-ID senden.
- `claude-cli` verwendet standardmäßig `liveSession: "claude-stdio"`, `output: "jsonl"`,
  und `input: "stdin"`, sodass Folge-Turns den laufenden Claude-Prozess wiederverwenden,
  solange er aktiv ist. Warm-stdio ist jetzt der Standard, auch für benutzerdefinierte Konfigurationen,
  bei denen Transportfelder fehlen. Wenn das Gateway neu startet oder der inaktive Prozess
  beendet wird, setzt OpenClaw mit der gespeicherten Claude-Sitzungs-ID fort. Gespeicherte Sitzungs-
  IDs werden vor dem Fortsetzen gegen ein vorhandenes lesbares Projekt-Transkript geprüft, sodass
  Phantom-Bindungen mit `reason=transcript-missing` gelöscht werden, statt stillschweigend eine neue Claude-CLI-Sitzung unter `--resume` zu starten.
- Gespeicherte CLI-Sitzungen sind provider-eigene Kontinuität. Das implizite tägliche Zurücksetzen
  trennt sie nicht; `/reset` und explizite Richtlinien `session.reset` hingegen schon.

Hinweise zur Serialisierung:

- `serialize: true` hält Läufe auf derselben Lane in Reihenfolge.
- Die meisten CLIs serialisieren auf einer Provider-Lane.
- OpenClaw verwirft die Wiederverwendung gespeicherter CLI-Sitzungen, wenn sich die ausgewählte Auth-Identität ändert,
  einschließlich geänderter Auth-Profil-ID, statischem API key, statischem Token oder OAuth-
  Kontenidentität, wenn die CLI eine solche offenlegt. Rotation von OAuth-Access- und Refresh-Tokens
  trennt die gespeicherte CLI-Sitzung nicht. Wenn eine CLI keine stabile OAuth-Konto-ID offenlegt,
  lässt OpenClaw diese CLI die Resume-Berechtigungen selbst durchsetzen.

## Bilder (Pass-through)

Wenn Ihre CLI Bildpfade akzeptiert, setzen Sie `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw schreibt Base64-Bilder in temporäre Dateien. Wenn `imageArg` gesetzt ist, werden diese
Pfade als CLI-Args übergeben. Wenn `imageArg` fehlt, hängt OpenClaw die
Dateipfade an den Prompt an (Path Injection), was für CLIs ausreicht, die lokale Dateien automatisch
aus reinen Pfaden laden.

## Ein- / Ausgaben

- `output: "json"` (Standard) versucht, JSON zu parsen und Text + Sitzungs-ID zu extrahieren.
- Für Gemini-CLI-JSON-Ausgabe liest OpenClaw Antworttext aus `response` und
  Nutzungsdaten aus `stats`, wenn `usage` fehlt oder leer ist.
- `output: "jsonl"` parst JSONL-Streams (zum Beispiel Codex CLI `--json`) und extrahiert die finale Agentennachricht sowie Sitzungs-
  Identifikatoren, wenn vorhanden.
- `output: "text"` behandelt stdout als finale Antwort.

Eingabemodi:

- `input: "arg"` (Standard) übergibt den Prompt als letztes CLI-Arg.
- `input: "stdin"` sendet den Prompt über stdin.
- Wenn der Prompt sehr lang ist und `maxPromptArgChars` gesetzt ist, wird stdin verwendet.

## Standardwerte (Plugin-besessen)

Das gebündelte OpenAI-Plugin registriert auch einen Standardwert für `codex-cli`:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Das gebündelte Google-Plugin registriert auch einen Standardwert für `google-gemini-cli`:

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

Voraussetzung: Die lokale Gemini-CLI muss installiert und als
`gemini` in `PATH` verfügbar sein (`brew install gemini-cli` oder
`npm install -g @google/gemini-cli`).

Hinweise zu Gemini-CLI-JSON:

- Antworttext wird aus dem JSON-Feld `response` gelesen.
- Nutzungsdaten greifen auf `stats` zurück, wenn `usage` fehlt oder leer ist.
- `stats.cached` wird in OpenClaw `cacheRead` normalisiert.
- Wenn `stats.input` fehlt, leitet OpenClaw Eingabetokens aus
  `stats.input_tokens - stats.cached` ab.

Überschreiben Sie nur bei Bedarf (häufig: absoluter `command`-Pfad).

## Plugin-besessene Standardwerte

Standardwerte für CLI-Backends sind jetzt Teil der Plugin-Oberfläche:

- Plugins registrieren sie mit `api.registerCliBackend(...)`.
- Die Backend-`id` wird zum Provider-Präfix in Modell-Refs.
- Benutzerkonfiguration in `agents.defaults.cliBackends.<id>` überschreibt weiterhin den Plugin-Standardwert.
- Die Bereinigung backend-spezifischer Konfiguration bleibt über den optionalen
  Hook `normalizeConfig` im Besitz des Plugins.

Plugins, die kleine Kompatibilitäts-Shims für Prompt/Nachrichten benötigen, können
bidirektionale Texttransformationen deklarieren, ohne einen Provider oder ein CLI-Backend zu ersetzen:

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
schreibt gestreamte Assistant-Deltas und geparsten Finaltext um, bevor OpenClaw
seine eigenen Steuerungsmarker und die Kanalzustellung verarbeitet.

Für CLIs, die JSONL im Stil von Claude Code stream-json kompatibel ausgeben, setzen Sie
`jsonlDialect: "claude-stream-json"` in der Konfiguration dieses Backends.

## MCP-Overlays bündeln

CLI-Backends erhalten **keine** direkten OpenClaw-Tool-Aufrufe, aber ein Backend kann
mit `bundleMcp: true` ein generiertes MCP-Config-Overlay aktivieren.

Aktuelles gebündeltes Verhalten:

- `claude-cli`: generierte strikte MCP-Konfigurationsdatei
- `codex-cli`: Inline-Konfigurationsüberschreibungen für `mcp_servers`; der generierte
  lokale OpenClaw-Loopback-Server wird mit dem serverbezogenen Tool-Genehmigungsmodus von Codex markiert,
  sodass MCP-Aufrufe nicht an lokalen Genehmigungsabfragen hängen bleiben können
- `google-gemini-cli`: generierte Gemini-Systemeinstellungsdatei

Wenn Bundle-MCP aktiviert ist, tut OpenClaw Folgendes:

- startet einen lokalen HTTP-MCP-Server, der Gateway-Tools für den CLI-Prozess bereitstellt
- authentifiziert die Bridge mit einem Token pro Sitzung (`OPENCLAW_MCP_TOKEN`)
- beschränkt den Tool-Zugriff auf die aktuelle Sitzung, das Konto und den Kanalkontext
- lädt aktivierte Bundle-MCP-Server für den aktuellen Workspace
- führt sie mit einer eventuell vorhandenen MCP-Konfigurations-/Einstellungsstruktur des Backends zusammen
- schreibt die Startkonfiguration unter Verwendung des backend-eigenen Integrationsmodus aus der besitzenden Erweiterung um

Wenn keine MCP-Server aktiviert sind, injiziert OpenClaw dennoch eine strikte Konfiguration, wenn ein
Backend sich für Bundle-MCP entscheidet, damit Hintergrundläufe isoliert bleiben.

Sitzungsgebundene gebündelte MCP-Laufzeiten werden zur Wiederverwendung innerhalb einer Sitzung gecacht und dann
nach `mcp.sessionIdleTtlMs` Millisekunden Leerlauf bereinigt (Standard: 10
Minuten; setzen Sie `0`, um dies zu deaktivieren). Eingebettete One-Shot-Läufe wie Auth-Probes,
Slug-Generierung und Active Memory Recall fordern das Bereinigen am Laufende an, damit stdio-
Child-Prozesse und Streamable-HTTP-/SSE-Streams den Lauf nicht überleben.

## Einschränkungen

- **Keine direkten OpenClaw-Tool-Aufrufe.** OpenClaw injiziert keine Tool-Aufrufe in
  das CLI-Backend-Protokoll. Backends sehen Gateway-Tools nur, wenn sie sich für
  `bundleMcp: true` entscheiden.
- **Streaming ist backendspezifisch.** Einige Backends streamen JSONL; andere puffern
  bis zum Beenden.
- **Strukturierte Ausgaben** hängen vom JSON-Format der CLI ab.
- **Codex-CLI-Sitzungen** werden über Textausgabe fortgesetzt (kein JSONL), was weniger
  strukturiert ist als der ursprüngliche Lauf mit `--json`. OpenClaw-Sitzungen funktionieren trotzdem normal.

## Fehlerbehebung

- **CLI nicht gefunden**: Setzen Sie `command` auf einen vollständigen Pfad.
- **Falscher Modellname**: Verwenden Sie `modelAliases`, um `provider/model` → CLI-Modell abzubilden.
- **Keine Sitzungsfortsetzung**: Stellen Sie sicher, dass `sessionArg` gesetzt ist und `sessionMode` nicht
  `none` ist (Codex CLI kann derzeit nicht mit JSON-Ausgabe fortsetzen).
- **Bilder werden ignoriert**: Setzen Sie `imageArg` (und prüfen Sie, ob die CLI Dateipfade unterstützt).

## Verwandt

- [Gateway-Runbook](/de/gateway)
- [Lokale Modelle](/de/gateway/local-models)
