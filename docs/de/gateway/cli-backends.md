---
read_when:
    - Sie möchten ein zuverlässiges Fallback, wenn API-Provider ausfallen.
    - Sie führen Codex CLI oder andere lokale AI-CLIs aus und möchten sie wiederverwenden.
    - Sie möchten die MCP-loopback-Bridge für den Tool-Zugriff des CLI-Backends verstehen.
summary: 'CLI-Backends: lokales AI-CLI-Fallback mit optionaler MCP-Tool-Bridge'
title: CLI-Backends
x-i18n:
    generated_at: "2026-04-23T06:28:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: d36aea09a97b980e6938e12ea3bb5c01aa5f6c4275879d51879e48d5a2225fb2
    source_path: gateway/cli-backends.md
    workflow: 15
---

# CLI-Backends (Fallback-Laufzeit)

OpenClaw kann **lokale AI-CLIs** als **reines Text-Fallback** ausführen, wenn API-Provider ausfallen,
ratelimitiert sind oder sich vorübergehend fehlerhaft verhalten. Dies ist absichtlich konservativ:

- **OpenClaw-Tools werden nicht direkt injiziert**, aber Backends mit `bundleMcp: true`
  können Gateway-Tools über eine loopback-MCP-Bridge erhalten.
- **JSONL-Streaming** für CLIs, die es unterstützen.
- **Sessions werden unterstützt** (damit Folge-Turns kohärent bleiben).
- **Bilder können durchgereicht werden**, wenn die CLI Bildpfade akzeptiert.

Dies ist als **Sicherheitsnetz** statt als primärer Pfad gedacht. Verwenden Sie es, wenn Sie
„funktioniert immer“-Textantworten möchten, ohne sich auf externe APIs zu verlassen.

Wenn Sie eine vollständige Harness-Laufzeit mit ACP-Session-Steuerung, Hintergrundaufgaben,
Thread-/Konversationsbindung und persistenten externen Coding-Sessions möchten, verwenden Sie
stattdessen [ACP Agents](/de/tools/acp-agents). CLI-Backends sind nicht ACP.

## Einsteigerfreundlicher Schnellstart

Sie können Codex CLI **ohne Konfiguration** verwenden (das gebündelte OpenAI-Plugin
registriert ein Standard-Backend):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.4
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

Das ist alles. Keine Schlüssel, keine zusätzliche Auth-Konfiguration außer der CLI selbst erforderlich.

Wenn Sie ein gebündeltes CLI-Backend als **primären Nachrichten-Provider** auf einem
Gateway-Host verwenden, lädt OpenClaw jetzt automatisch das zuständige gebündelte Plugin, wenn Ihre Konfiguration
dieses Backend explizit in einer Modellreferenz oder unter
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

- Wenn Sie `agents.defaults.models` (Zulassungsliste) verwenden, müssen Sie dort auch Ihre CLI-Backend-Modelle aufnehmen.
- Wenn der primäre Provider fehlschlägt (Authentifizierung, Ratelimits, Timeouts), versucht OpenClaw
  als Nächstes das CLI-Backend.

## Konfigurationsübersicht

Alle CLI-Backends befinden sich unter:

```
agents.defaults.cliBackends
```

Jeder Eintrag wird über eine **Provider-ID** verschlüsselt (z. B. `codex-cli`, `my-cli`).
Die Provider-ID wird zur linken Seite Ihrer Modellreferenz:

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
          // Codex-artige CLIs können stattdessen auf eine Prompt-Datei zeigen:
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

1. **Wählt ein Backend aus** anhand des Provider-Präfixes (`codex-cli/...`).
2. **Erstellt einen System-Prompt** mit demselben OpenClaw-Prompt + Workspace-Kontext.
3. **Führt die CLI aus** mit einer Session-ID (falls unterstützt), damit der Verlauf konsistent bleibt.
   Das gebündelte Backend `claude-cli` hält pro
   OpenClaw-Session einen Claude-stdio-Prozess am Leben und sendet Folge-Turns über stream-json-stdin.
4. **Parst die Ausgabe** (JSON oder Klartext) und gibt den finalen Text zurück.
5. **Persistiert Session-IDs** pro Backend, sodass Folgenachrichten dieselbe CLI-Session wiederverwenden.

<Note>
Das gebündelte Anthropic-Backend `claude-cli` wird wieder unterstützt. Anthropic-Mitarbeitende
haben uns mitgeteilt, dass die OpenClaw-artige Claude-CLI-Nutzung wieder erlaubt ist, daher behandelt OpenClaw
die Nutzung von `claude -p` für diese Integration als genehmigt, sofern Anthropic keine
neue Richtlinie veröffentlicht.
</Note>

Das gebündelte OpenAI-Backend `codex-cli` übergibt den System-Prompt von OpenClaw über
die Konfigurationsüberschreibung `model_instructions_file` von Codex (`-c
model_instructions_file="..."`). Codex stellt kein Flag im Stil von Claude wie
`--append-system-prompt` bereit, daher schreibt OpenClaw den zusammengesetzten Prompt für jede frische Codex-CLI-Session in eine
temporäre Datei.

Das gebündelte Anthropic-Backend `claude-cli` erhält den OpenClaw-Skills-Schnappschuss
auf zwei Wegen: den kompakten OpenClaw-Skills-Katalog im angehängten System-Prompt und
ein temporäres Claude-Code-Plugin, das mit `--plugin-dir` übergeben wird. Das Plugin enthält
nur die für diesen Agent/diese Session zulässigen Skills, sodass der native Skill-Resolver von Claude Code
dieselbe gefilterte Menge sieht, die OpenClaw sonst im Prompt bewerben würde. Skill-Umgebungs-/API-Schlüssel-Überschreibungen werden von OpenClaw weiterhin auf die
Kindprozessumgebung für den Lauf angewendet.

## Sessions

- Wenn die CLI Sessions unterstützt, setzen Sie `sessionArg` (z. B. `--session-id`) oder
  `sessionArgs` (Platzhalter `{sessionId}`), wenn die ID in mehrere Flags eingefügt werden muss.
- Wenn die CLI einen **resume-Unterbefehl** mit anderen Flags verwendet, setzen Sie
  `resumeArgs` (ersetzt `args` beim Fortsetzen) und optional `resumeOutput`
  (für nicht JSON-Resumes).
- `sessionMode`:
  - `always`: immer eine Session-ID senden (neue UUID, wenn keine gespeichert ist).
  - `existing`: eine Session-ID nur senden, wenn zuvor eine gespeichert wurde.
  - `none`: niemals eine Session-ID senden.
- `claude-cli` verwendet standardmäßig `liveSession: "claude-stdio"`, `output: "jsonl"`
  und `input: "stdin"`, sodass Folge-Turns den laufenden Claude-Prozess wiederverwenden, solange
  er aktiv ist. Wenn das Gateway neu startet oder der inaktive Prozess beendet wird, setzt OpenClaw
  die Sitzung mit der gespeicherten Claude-Session-ID fort.
- Gespeicherte CLI-Sessions sind provider-eigene Kontinuität. Der implizite tägliche Session-
  Reset unterbricht sie nicht; `/reset` und explizite `session.reset`-Richtlinien hingegen schon.

Hinweise zur Serialisierung:

- `serialize: true` hält Ausführungen auf derselben Lane geordnet.
- Die meisten CLIs serialisieren auf einer Provider-Lane.
- OpenClaw verwirft die Wiederverwendung gespeicherter CLI-Sessions, wenn sich die ausgewählte Auth-Identität ändert,
  einschließlich einer geänderten Auth-Profil-ID, eines statischen API-Schlüssels, eines statischen Tokens oder der OAuth-
  Kontoidentität, wenn die CLI eine solche bereitstellt. Rotation von OAuth-Access- und Refresh-Tokens unterbricht die gespeicherte CLI-Session nicht. Wenn eine CLI keine stabile OAuth-Konto-ID bereitstellt, lässt OpenClaw diese CLI Berechtigungen für das Fortsetzen selbst durchsetzen.

## Bilder (Durchreichen)

Wenn Ihre CLI Bildpfade akzeptiert, setzen Sie `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw schreibt Base64-Bilder in temporäre Dateien. Wenn `imageArg` gesetzt ist, werden diese
Pfade als CLI-Argumente übergeben. Wenn `imageArg` fehlt, hängt OpenClaw die
Dateipfade an den Prompt an (Pfad-Injektion), was für CLIs ausreicht, die lokale
Dateien automatisch aus reinen Pfaden laden.

## Eingaben / Ausgaben

- `output: "json"` (Standard) versucht, JSON zu parsen und Text + Session-ID zu extrahieren.
- Für Gemini-CLI-JSON-Ausgabe liest OpenClaw Antworttext aus `response` und
  Nutzung aus `stats`, wenn `usage` fehlt oder leer ist.
- `output: "jsonl"` parst JSONL-Streams (zum Beispiel Codex CLI `--json`) und extrahiert die finale Agent-Nachricht sowie Session-
  Kennungen, wenn vorhanden.
- `output: "text"` behandelt stdout als finale Antwort.

Eingabemodi:

- `input: "arg"` (Standard) übergibt den Prompt als letztes CLI-Argument.
- `input: "stdin"` sendet den Prompt über stdin.
- Wenn der Prompt sehr lang ist und `maxPromptArgChars` gesetzt ist, wird stdin verwendet.

## Standardwerte (Plugin-eigen)

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

Voraussetzung: Die lokale Gemini CLI muss installiert und als
`gemini` auf `PATH` verfügbar sein (`brew install gemini-cli` oder
`npm install -g @google/gemini-cli`).

Hinweise zu Gemini-CLI-JSON:

- Antworttext wird aus dem JSON-Feld `response` gelesen.
- Nutzung fällt auf `stats` zurück, wenn `usage` fehlt oder leer ist.
- `stats.cached` wird in OpenClaw `cacheRead` normalisiert.
- Wenn `stats.input` fehlt, leitet OpenClaw Eingabetokens aus
  `stats.input_tokens - stats.cached` ab.

Nur bei Bedarf überschreiben (üblich: absoluter `command`-Pfad).

## Plugin-eigene Standardwerte

Standardwerte für CLI-Backends sind jetzt Teil der Plugin-Oberfläche:

- Plugins registrieren sie mit `api.registerCliBackend(...)`.
- Die Backend-`id` wird zum Provider-Präfix in Modellreferenzen.
- Benutzerkonfiguration unter `agents.defaults.cliBackends.<id>` überschreibt weiterhin den Plugin-Standardwert.
- Backend-spezifische Konfigurationsbereinigung bleibt über den optionalen
  Hook `normalizeConfig` Plugin-eigen.

Plugins, die kleine Prompt-/Nachrichten-Kompatibilitäts-Shims benötigen, können
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
schreibt gestreamte Assistant-Deltas und geparsten finalen Text um, bevor OpenClaw
seine eigenen Steuermarker und die Kanalauslieferung verarbeitet.

Für CLIs, die mit Claude Code stream-json kompatibles JSONL ausgeben, setzen Sie
`jsonlDialect: "claude-stream-json"` in der Konfiguration dieses Backends.

## Bundle-MCP-Overlays

CLI-Backends erhalten **keine** OpenClaw-Tool-Aufrufe direkt, aber ein Backend kann
sich mit `bundleMcp: true` für ein generiertes MCP-Konfigurations-Overlay anmelden.

Aktuelles gebündeltes Verhalten:

- `claude-cli`: generierte strikte MCP-Konfigurationsdatei
- `codex-cli`: Inline-Konfigurationsüberschreibungen für `mcp_servers`
- `google-gemini-cli`: generierte Gemini-Systemeinstellungsdatei

Wenn Bundle-MCP aktiviert ist, führt OpenClaw Folgendes aus:

- startet einen loopback-HTTP-MCP-Server, der Gateway-Tools für den CLI-Prozess bereitstellt
- authentifiziert die Bridge mit einem Token pro Session (`OPENCLAW_MCP_TOKEN`)
- begrenzt den Tool-Zugriff auf die aktuelle Session, das aktuelle Konto und den aktuellen Kanalkontext
- lädt aktivierte Bundle-MCP-Server für den aktuellen Workspace
- führt sie mit vorhandenen MCP-Konfigurationen/Einstellungsformen des Backends zusammen
- schreibt die Startkonfiguration mithilfe des backend-eigenen Integrationsmodus aus der zuständigen Erweiterung um

Wenn keine MCP-Server aktiviert sind, injiziert OpenClaw dennoch eine strikte Konfiguration, wenn sich ein
Backend für Bundle-MCP anmeldet, damit Hintergrundläufe isoliert bleiben.

## Einschränkungen

- **Keine direkten OpenClaw-Tool-Aufrufe.** OpenClaw injiziert keine Tool-Aufrufe in
  das CLI-Backend-Protokoll. Backends sehen Gateway-Tools nur, wenn sie sich für
  `bundleMcp: true` anmelden.
- **Streaming ist backend-spezifisch.** Einige Backends streamen JSONL; andere puffern
  bis zum Beenden.
- **Strukturierte Ausgaben** hängen vom JSON-Format der CLI ab.
- **Codex-CLI-Sessions** werden über Textausgabe fortgesetzt (kein JSONL), was weniger
  strukturiert ist als der anfängliche `--json`-Lauf. OpenClaw-Sessions funktionieren dennoch normal.

## Fehlerbehebung

- **CLI nicht gefunden**: Setzen Sie `command` auf einen vollständigen Pfad.
- **Falscher Modellname**: Verwenden Sie `modelAliases`, um `provider/model` → CLI-Modell zuzuordnen.
- **Keine Session-Kontinuität**: Stellen Sie sicher, dass `sessionArg` gesetzt ist und `sessionMode` nicht
  `none` ist (Codex CLI kann derzeit nicht mit JSON-Ausgabe fortsetzen).
- **Bilder werden ignoriert**: Setzen Sie `imageArg` (und prüfen Sie, ob die CLI Dateipfade unterstützt).
