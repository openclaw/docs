---
read_when:
    - Sie möchten einen zuverlässigen Fallback, wenn API-Provider ausfallen
    - Sie führen die Codex CLI oder andere lokale KI-CLIs aus und möchten sie wiederverwenden
    - Sie möchten die MCP-Loopback-Bridge für den Zugriff auf CLI-Backend-Tools verstehen
summary: 'CLI-Backends: lokaler KI-CLI-Fallback mit optionaler MCP-Tool-Bridge'
title: CLI-Backends
x-i18n:
    generated_at: "2026-05-04T18:23:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 55534c48c5e226857b9320fd369416583e5c2efc80eabd4746f939afdd027dc1
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw kann **lokale AI CLIs** als **rein textbasierten Fallback** ausführen, wenn API-Provider ausfallen,
rate-limitiert sind oder sich vorübergehend fehlerhaft verhalten. Dies ist bewusst konservativ:

- **OpenClaw-Tools werden nicht direkt injiziert**, aber Backends mit `bundleMcp: true`
  können Gateway-Tools über eine Loopback-MCP-Bridge erhalten.
- **JSONL-Streaming** für CLIs, die es unterstützen.
- **Sitzungen werden unterstützt** (damit Folge-Turns kohärent bleiben).
- **Bilder können durchgereicht werden**, wenn die CLI Bildpfade akzeptiert.

Dies ist als **Sicherheitsnetz** statt als primärer Pfad gedacht. Nutzen Sie es, wenn Sie
Textantworten wünschen, die „immer funktionieren“, ohne von externen APIs abhängig zu sein.

Wenn Sie eine vollständige Harness-Laufzeit mit ACP-Sitzungssteuerung, Hintergrundaufgaben,
Thread-/Konversationsbindung und persistenten externen Coding-Sitzungen möchten, verwenden Sie stattdessen
[ACP Agents](/de/tools/acp-agents). CLI-Backends sind kein ACP.

## Einsteigerfreundlicher Schnellstart

Sie können Codex CLI **ohne jegliche Konfiguration** verwenden (das gebündelte OpenAI-Plugin
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
Gateway-Host verwenden, lädt OpenClaw jetzt automatisch das zugehörige gebündelte Plugin, wenn Ihre Konfiguration
dieses Backend explizit in einer Modellreferenz oder unter
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
- Wenn der primäre Provider fehlschlägt (Auth, Rate Limits, Timeouts), versucht OpenClaw
  als Nächstes das CLI-Backend.

## Konfigurationsübersicht

Alle CLI-Backends befinden sich unter:

```
agents.defaults.cliBackends
```

Jeder Eintrag wird durch eine **Provider-ID** (z. B. `codex-cli`, `my-cli`) geschlüsselt.
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
          // For CLIs with a dedicated prompt-file flag:
          // systemPromptFileArg: "--system-file",
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

1. **Wählt ein Backend** basierend auf dem Provider-Präfix (`codex-cli/...`) aus.
2. **Erstellt einen System-Prompt** mit demselben OpenClaw-Prompt und Workspace-Kontext.
3. **Führt die CLI aus** mit einer Sitzungs-ID (falls unterstützt), damit der Verlauf konsistent bleibt.
   Das gebündelte `claude-cli`-Backend hält pro OpenClaw-Sitzung einen Claude-stdio-Prozess am Leben
   und sendet Folge-Turns über stream-json-stdin.
4. **Parst die Ausgabe** (JSON oder Klartext) und gibt den finalen Text zurück.
5. **Persistiert Sitzungs-IDs** pro Backend, sodass Folge-Turns dieselbe CLI-Sitzung wiederverwenden.

<Note>
Das gebündelte Anthropic-Backend `claude-cli` wird wieder unterstützt. Anthropic-Mitarbeiter
teilten uns mit, dass eine Claude-CLI-Nutzung im OpenClaw-Stil wieder erlaubt ist, daher behandelt OpenClaw
die Nutzung von `claude -p` für diese Integration als genehmigt, solange Anthropic keine
neue Richtlinie veröffentlicht.
</Note>

Das gebündelte OpenAI-Backend `codex-cli` übergibt den System-Prompt von OpenClaw über
Codex' Konfigurationsüberschreibung `model_instructions_file` (`-c
model_instructions_file="..."`). Codex stellt kein Claude-artiges
`--append-system-prompt`-Flag bereit, daher schreibt OpenClaw den zusammengesetzten Prompt für jede neue Codex-CLI-Sitzung
in eine temporäre Datei.

Das gebündelte Anthropic-Backend `claude-cli` erhält den OpenClaw-Skills-Snapshot
auf zwei Wegen: den kompakten OpenClaw-Skills-Katalog im angehängten System-Prompt und
ein temporäres Claude Code-Plugin, das mit `--plugin-dir` übergeben wird. Das Plugin enthält
nur die zulässigen Skills für diesen Agent/diese Sitzung, sodass der native Skill-Resolver von Claude Code
dieselbe gefilterte Menge sieht, die OpenClaw sonst im Prompt bewerben würde.
Skill-Env-/API-Schlüssel-Overrides werden weiterhin von OpenClaw auf die
Kindprozessumgebung für den Lauf angewendet.

Claude CLI verfügt außerdem über einen eigenen nicht interaktiven Berechtigungsmodus. OpenClaw bildet diesen
auf die bestehende Exec-Policy ab, statt Claude-spezifische Konfiguration hinzuzufügen: Wenn die
effektiv angeforderte Exec-Policy YOLO ist (`tools.exec.security: "full"` und
`tools.exec.ask: "off"`), fügt OpenClaw `--permission-mode bypassPermissions` hinzu.
Agent-spezifische Einstellungen unter `agents.list[].tools.exec` überschreiben globale `tools.exec`-Einstellungen für
diesen Agent. Um einen anderen Claude-Modus zu erzwingen, setzen Sie explizite rohe Backend-Argumente
wie `--permission-mode default` oder `--permission-mode acceptEdits` unter
`agents.defaults.cliBackends.claude-cli.args` sowie passende `resumeArgs`.

Das gebündelte Anthropic-Backend `claude-cli` bildet außerdem OpenClaw-`/think`-Stufen
auf das native `--effort`-Flag von Claude Code für nicht deaktivierte Stufen ab. `minimal` und
`low` werden auf `low` abgebildet, `adaptive` und `medium` auf `medium`, und `high`,
`xhigh` sowie `max` direkt. Andere CLI-Backends benötigen ihr zugehöriges Plugin, um
einen äquivalenten argv-Mapper zu deklarieren, bevor `/think` die gestartete CLI beeinflussen kann.

Bevor OpenClaw das gebündelte Backend `claude-cli` verwenden kann, muss Claude Code selbst
bereits auf demselben Host angemeldet sein:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Verwenden Sie `agents.defaults.cliBackends.claude-cli.command` nur, wenn das `claude`-Binary
nicht bereits auf `PATH` liegt.

## Sitzungen

- Wenn die CLI Sitzungen unterstützt, setzen Sie `sessionArg` (z. B. `--session-id`) oder
  `sessionArgs` (Platzhalter `{sessionId}`), wenn die ID in mehrere Flags eingefügt werden muss.
- Wenn die CLI einen **Resume-Unterbefehl** mit anderen Flags verwendet, setzen Sie
  `resumeArgs` (ersetzt `args` beim Fortsetzen) und optional `resumeOutput`
  (für Nicht-JSON-Fortsetzungen).
- `sessionMode`:
  - `always`: Immer eine Sitzungs-ID senden (neue UUID, falls keine gespeichert ist).
  - `existing`: Nur dann eine Sitzungs-ID senden, wenn zuvor eine gespeichert wurde.
  - `none`: Nie eine Sitzungs-ID senden.
- `claude-cli` verwendet standardmäßig `liveSession: "claude-stdio"`, `output: "jsonl"`
  und `input: "stdin"`, sodass Folge-Turns den laufenden Claude-Prozess wiederverwenden, solange
  er aktiv ist. Warmes stdio ist jetzt der Standard, auch für benutzerdefinierte Konfigurationen,
  die Transportfelder auslassen. Wenn das Gateway neu startet oder der inaktive Prozess
  beendet wird, setzt OpenClaw von der gespeicherten Claude-Sitzungs-ID fort. Gespeicherte Sitzungs-
  IDs werden vor dem Fortsetzen gegen ein vorhandenes lesbares Projekttranskript geprüft,
  sodass Phantom-Bindungen mit `reason=transcript-missing` gelöscht werden, statt stillschweigend
  eine neue Claude-CLI-Sitzung unter `--resume` zu starten.
- Claude-Live-Sitzungen behalten begrenzte JSONL-Ausgabeschutzmechanismen bei. Standardwerte erlauben bis zu
  8 MiB und 20.000 rohe JSONL-Zeilen pro Turn. Tool-intensive Claude-Turns können
  diese pro Backend erhöhen mit
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  und `maxTurnLines`; OpenClaw begrenzt diese Einstellungen auf 64 MiB und 100.000
  Zeilen.
- Gespeicherte CLI-Sitzungen sind Provider-eigene Kontinuität. Das implizite tägliche Sitzungs-
  Zurücksetzen unterbricht sie nicht; `/reset` und explizite `session.reset`-Policies tun dies weiterhin.

Hinweise zur Serialisierung:

- `serialize: true` hält Läufe auf derselben Lane geordnet.
- Die meisten CLIs serialisieren auf einer Provider-Lane.
- OpenClaw verwirft die Wiederverwendung gespeicherter CLI-Sitzungen, wenn sich die ausgewählte Auth-Identität ändert,
  einschließlich einer geänderten Auth-Profil-ID, eines statischen API-Schlüssels, statischen Tokens oder einer OAuth-
  Kontoidentität, sofern die CLI eine offenlegt. Die Rotation von OAuth-Zugriffs- und Refresh-Tokens
  unterbricht die gespeicherte CLI-Sitzung nicht. Wenn eine CLI keine
  stabile OAuth-Konto-ID offenlegt, lässt OpenClaw diese CLI die Fortsetzungsberechtigungen durchsetzen.

## Fallback-Präludium aus claude-cli-Sitzungen

Wenn ein `claude-cli`-Versuch auf einen Nicht-CLI-Kandidaten in
[`agents.defaults.model.fallbacks`](/de/concepts/model-failover) failovert, versieht OpenClaw
den nächsten Versuch mit einem Kontext-Präludium, das aus dem lokalen JSONL-Transkript von Claude Code unter
`~/.claude/projects/` gewonnen wird. Ohne diesen Seed würde der Fallback-
Provider kalt starten, da OpenClaws eigenes Sitzungstranskript für `claude-cli`-Läufe leer ist.

- Das Präludium bevorzugt die neueste `/compact`-Zusammenfassung oder den Marker `compact_boundary`
  und hängt dann die neuesten Turns nach der Boundary bis zu einem Zeichen-
  Budget an. Turns vor der Boundary werden verworfen, da die Zusammenfassung sie bereits repräsentiert.
- Tool-Blöcke werden zu kompakten Hinweisen `(tool call: name)` und
  `(tool result: …)` zusammengeführt, um das Prompt-Budget ehrlich zu halten. Die Zusammenfassung wird
  als `(truncated)` gekennzeichnet, wenn sie überläuft.
- Same-Provider-Fallbacks von `claude-cli` zu `claude-cli` verlassen sich auf Claudes eigenes
  `--resume` und überspringen das Präludium.
- Der Seed verwendet dieselbe Validierung des Claude-Sitzungsdateipfads erneut, sodass
  beliebige Pfade nicht gelesen werden können.

## Bilder (Durchreichen)

Wenn Ihre CLI Bildpfade akzeptiert, setzen Sie `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw schreibt base64-Bilder in temporäre Dateien. Wenn `imageArg` gesetzt ist, werden diese
Pfade als CLI-Argumente übergeben. Wenn `imageArg` fehlt, hängt OpenClaw die
Dateipfade an den Prompt an (Pfadinjektion), was für CLIs ausreicht, die lokale Dateien automatisch
aus einfachen Pfaden laden.

## Eingaben / Ausgaben

- `output: "json"` (Standard) versucht, JSON zu parsen und Text sowie Sitzungs-ID zu extrahieren.
- Für Gemini-CLI-JSON-Ausgaben liest OpenClaw Antworttext aus `response` und
  Nutzung aus `stats`, wenn `usage` fehlt oder leer ist.
- `output: "jsonl"` parst JSONL-Streams (zum Beispiel Codex CLI `--json`) und extrahiert die finale Agent-Nachricht sowie Sitzungs-
  Identifikatoren, sofern vorhanden.
- `output: "text"` behandelt stdout als finale Antwort.

Eingabemodi:

- `input: "arg"` (Standard) übergibt den Prompt als letztes CLI-Argument.
- `input: "stdin"` sendet den Prompt über stdin.
- Wenn der Prompt sehr lang ist und `maxPromptArgChars` gesetzt ist, wird stdin verwendet.

## Standardwerte (Plugin-eigen)

Das gebündelte OpenAI-Plugin registriert außerdem einen Standard für `codex-cli`:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
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

Gemini-CLI-JSON-Hinweise:

- Antworttext wird aus dem JSON-Feld `response` gelesen.
- Die Nutzung fällt auf `stats` zurück, wenn `usage` fehlt oder leer ist.
- `stats.cached` wird in OpenClaw `cacheRead` normalisiert.
- Wenn `stats.input` fehlt, leitet OpenClaw Eingabe-Token aus
  `stats.input_tokens - stats.cached` ab.

Überschreiben Sie dies nur bei Bedarf (häufig: absoluter `command`-Pfad).

## Plugin-eigene Standardwerte

CLI-Backend-Standardwerte sind jetzt Teil der Plugin-Oberfläche:

- Plugins registrieren sie mit `api.registerCliBackend(...)`.
- Die Backend-`id` wird zum Provider-Präfix in Modellreferenzen.
- Benutzerkonfiguration in `agents.defaults.cliBackends.<id>` überschreibt weiterhin den Plugin-Standardwert.
- Backend-spezifische Konfigurationsbereinigung bleibt über den optionalen
  `normalizeConfig`-Hook Plugin-eigen.

Plugins, die kleine Kompatibilitäts-Shims für Prompts/Nachrichten benötigen, können
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
seine eigenen Steuerungsmarker und die Kanalzustellung verarbeitet.

Für CLIs, die mit Claude Code stream-json kompatibles JSONL ausgeben, setzen Sie
`jsonlDialect: "claude-stream-json"` in der Konfiguration dieses Backends.

## Gebündelte MCP-Overlays

CLI-Backends erhalten **keine** OpenClaw-Toolaufrufe direkt, aber ein Backend kann
sich mit `bundleMcp: true` für ein generiertes MCP-Konfigurations-Overlay entscheiden.

Aktuelles gebündeltes Verhalten:

- `claude-cli`: generierte strikte MCP-Konfigurationsdatei
- `codex-cli`: Inline-Konfigurationsüberschreibungen für `mcp_servers`; der generierte
  OpenClaw-loopback-Server wird mit Codex' Tool-Genehmigungsmodus pro Server markiert,
  sodass MCP-Aufrufe nicht durch lokale Genehmigungsaufforderungen blockieren können
- `google-gemini-cli`: generierte Gemini-Systemeinstellungsdatei

Wenn gebündeltes MCP aktiviert ist, führt OpenClaw Folgendes aus:

- startet einen loopback-HTTP-MCP-Server, der Gateway-Tools für den CLI-Prozess bereitstellt
- authentifiziert die Bridge mit einem Token pro Sitzung (`OPENCLAW_MCP_TOKEN`)
- beschränkt Tool-Zugriff auf den aktuellen Sitzungs-, Konto- und Kanalkontext
- lädt aktivierte Bundle-MCP-Server für den aktuellen Arbeitsbereich
- führt sie mit jeder vorhandenen MCP-Konfigurations-/Einstellungsstruktur des Backends zusammen
- schreibt die Startkonfiguration mithilfe des Backend-eigenen Integrationsmodus aus der besitzenden Erweiterung um

Wenn keine MCP-Server aktiviert sind, injiziert OpenClaw weiterhin eine strikte Konfiguration, wenn ein
Backend gebündeltes MCP aktiviert, damit Hintergrundläufe isoliert bleiben.

Sitzungsgebundene gebündelte MCP-Runtimes werden zur Wiederverwendung innerhalb einer Sitzung zwischengespeichert und dann
nach `mcp.sessionIdleTtlMs` Millisekunden Leerlaufzeit entfernt (Standard: 10
Minuten; setzen Sie `0`, um dies zu deaktivieren). Einmalige eingebettete Läufe wie Auth-Prüfungen,
Slug-Generierung und Active-Memory-Abruf fordern beim Laufende eine Bereinigung an, damit stdio-
Kindprozesse und Streamable-HTTP/SSE-Streams den Lauf nicht überdauern.

## Einschränkungen

- **Keine direkten OpenClaw-Toolaufrufe.** OpenClaw injiziert keine Toolaufrufe in
  das CLI-Backend-Protokoll. Backends sehen Gateway-Tools nur, wenn sie
  `bundleMcp: true` aktivieren.
- **Streaming ist Backend-spezifisch.** Einige Backends streamen JSONL; andere puffern
  bis zum Beenden.
- **Strukturierte Ausgaben** hängen vom JSON-Format der CLI ab.
- **Codex-CLI-Sitzungen** werden über Textausgabe fortgesetzt (kein JSONL), was weniger
  strukturiert ist als der anfängliche `--json`-Lauf. OpenClaw-Sitzungen funktionieren dennoch
  normal.

## Fehlerbehebung

- **CLI nicht gefunden**: Setzen Sie `command` auf einen vollständigen Pfad.
- **Falscher Modellname**: Verwenden Sie `modelAliases`, um `provider/model` → CLI-Modell zuzuordnen.
- **Keine Sitzungskontinuität**: Stellen Sie sicher, dass `sessionArg` gesetzt ist und `sessionMode` nicht
  `none` ist (Codex CLI kann derzeit nicht mit JSON-Ausgabe fortgesetzt werden).
- **Bilder ignoriert**: Setzen Sie `imageArg` (und prüfen Sie, ob die CLI Dateipfade unterstützt).

## Verwandt

- [Gateway-Runbook](/de/gateway)
- [Lokale Modelle](/de/gateway/local-models)
