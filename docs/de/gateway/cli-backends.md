---
read_when:
    - Sie möchten einen zuverlässigen Fallback, wenn API-Provider ausfallen
    - Sie verwenden Codex CLI oder andere lokale KI-CLIs und möchten diese wiederverwenden
    - Sie möchten die MCP-Loopback-Bridge für den Tool-Zugriff des CLI-Backends verstehen
summary: 'CLI-Backends: lokaler KI-CLI-Fallback mit optionaler MCP-Tool-Bridge'
title: CLI-Backends
x-i18n:
    generated_at: "2026-05-10T19:33:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: e6fbbca3bc7e9c0b87147b91d419c03ea0b112494fa54c1ac041e80e76c7b186
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw kann **lokale KI-CLIs** als **reine Text-Ausweichlösung** ausführen, wenn API-Provider ausgefallen,
ratenbegrenzt oder vorübergehend fehlerhaft sind. Dies ist bewusst konservativ:

- **OpenClaw-Tools werden nicht direkt injiziert**, aber Backends mit `bundleMcp: true`
  können Gateway-Tools über eine local loopback-MCP-Bridge empfangen.
- **JSONL-Streaming** für CLIs, die es unterstützen.
- **Sitzungen werden unterstützt** (damit Folgeturns kohärent bleiben).
- **Bilder können durchgereicht werden**, wenn die CLI Bildpfade akzeptiert.

Dies ist als **Sicherheitsnetz** und nicht als primärer Pfad konzipiert. Verwenden Sie es, wenn Sie
„funktioniert immer“-Textantworten wünschen, ohne sich auf externe APIs zu verlassen.

Wenn Sie eine vollständige Harness-Laufzeit mit ACP-Sitzungssteuerung, Hintergrundaufgaben,
Thread-/Konversationsbindung und persistenten externen Codingsitzungen wünschen, verwenden Sie stattdessen
[ACP-Agents](/de/tools/acp-agents). CLI-Backends sind nicht ACP.

<Tip>
  Erstellen Sie ein neues Backend-Plugin? Verwenden Sie
  [CLI-Backend-Plugins](/de/plugins/cli-backend-plugins). Diese Seite richtet sich an Benutzer,
  die ein bereits registriertes Backend konfigurieren und betreiben.
</Tip>

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

Das war’s. Keine Schlüssel, keine zusätzliche Authentifizierungskonfiguration über die CLI selbst hinaus erforderlich.

Wenn Sie ein gebündeltes CLI-Backend als **primären Nachrichten-Provider** auf einem
Gateway-Host verwenden, lädt OpenClaw jetzt automatisch das besitzende gebündelte Plugin, wenn Ihre Konfiguration
dieses Backend ausdrücklich in einer Modellreferenz oder unter
`agents.defaults.cliBackends` referenziert.

## Verwendung als Ausweichlösung

Fügen Sie Ihrer Ausweichliste ein CLI-Backend hinzu, damit es nur ausgeführt wird, wenn primäre Modelle fehlschlagen:

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

- Wenn Sie `agents.defaults.models` (Zulassungsliste) verwenden, müssen Sie dort auch Ihre CLI-Backend-Modelle einschließen.
- Wenn der primäre Provider fehlschlägt (Authentifizierung, Ratenbegrenzungen, Zeitüberschreitungen), versucht OpenClaw
  als Nächstes das CLI-Backend.

## Konfigurationsübersicht

Alle CLI-Backends befinden sich unter:

```
agents.defaults.cliBackends
```

Jeder Eintrag wird über eine **Provider-ID** geschlüsselt (z. B. `codex-cli`, `my-cli`).
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
          // Opt in only if this backend may reseed safe invalidated sessions
          // from bounded raw OpenClaw transcript history before compaction.
          reseedFromRawTranscriptWhenUncompacted: true,
          serialize: true,
        },
      },
    },
  },
}
```

## Funktionsweise

1. **Wählt ein Backend aus** basierend auf dem Provider-Präfix (`codex-cli/...`).
2. **Erstellt einen System-Prompt** mit demselben OpenClaw-Prompt und Workspace-Kontext.
3. **Führt die CLI aus** mit einer Sitzungs-ID (falls unterstützt), damit der Verlauf konsistent bleibt.
   Das gebündelte `claude-cli`-Backend hält pro OpenClaw-Sitzung einen Claude-stdio-Prozess aktiv
   und sendet Folgeturns über stream-json-stdin.
4. **Parst die Ausgabe** (JSON oder Klartext) und gibt den finalen Text zurück.
5. **Persistiert Sitzungs-IDs** pro Backend, damit Folgeturns dieselbe CLI-Sitzung wiederverwenden.

<Note>
Das gebündelte Anthropic-`claude-cli`-Backend wird wieder unterstützt. Anthropic-Mitarbeiter
haben uns mitgeteilt, dass Claude CLI-Nutzung im OpenClaw-Stil wieder erlaubt ist, daher behandelt OpenClaw
die Verwendung von `claude -p` für diese Integration als genehmigt, sofern Anthropic keine
neue Richtlinie veröffentlicht.
</Note>

Das gebündelte OpenAI-`codex-cli`-Backend übergibt den System-Prompt von OpenClaw über
Codex’ `model_instructions_file`-Konfigurationsüberschreibung (`-c
model_instructions_file="..."`). Codex stellt kein Claude-ähnliches
`--append-system-prompt`-Flag bereit, daher schreibt OpenClaw den zusammengesetzten Prompt für jede
neue Codex CLI-Sitzung in eine temporäre Datei.

Das gebündelte Anthropic-`claude-cli`-Backend erhält den OpenClaw-Skills-Snapshot
auf zwei Arten: den kompakten OpenClaw-Skills-Katalog im angehängten System-Prompt und
ein temporäres Claude Code-Plugin, das mit `--plugin-dir` übergeben wird. Das Plugin enthält
nur die berechtigten Skills für diesen Agenten/diese Sitzung, sodass Claude Codes nativer Skill-Resolver
denselben gefilterten Satz sieht, den OpenClaw andernfalls im Prompt bekanntgeben würde.
Skill-Umgebungs-/API-Schlüsselüberschreibungen werden weiterhin von OpenClaw auf die
Kindprozessumgebung für den Lauf angewendet.

Claude CLI verfügt außerdem über einen eigenen nichtinteraktiven Berechtigungsmodus. OpenClaw ordnet diesen
der vorhandenen Ausführungsrichtlinie zu, statt Claude-spezifische Konfiguration hinzuzufügen: Wenn die
effektiv angeforderte Ausführungsrichtlinie YOLO ist (`tools.exec.security: "full"` und
`tools.exec.ask: "off"`), fügt OpenClaw `--permission-mode bypassPermissions` hinzu.
Pro-Agent-Einstellungen unter `agents.list[].tools.exec` überschreiben globale `tools.exec` für
diesen Agenten. Um einen anderen Claude-Modus zu erzwingen, setzen Sie explizite rohe Backend-Argumente
wie `--permission-mode default` oder `--permission-mode acceptEdits` unter
`agents.defaults.cliBackends.claude-cli.args` und passende `resumeArgs`.

Das gebündelte Anthropic-`claude-cli`-Backend ordnet außerdem OpenClaw-`/think`-Stufen
für Nicht-Aus-Stufen Claudes nativem `--effort`-Flag zu. `minimal` und
`low` werden `low` zugeordnet, `adaptive` und `medium` werden `medium` zugeordnet, und `high`,
`xhigh` und `max` werden direkt zugeordnet. Andere CLI-Backends benötigen ihr besitzendes Plugin,
um einen äquivalenten argv-Mapper zu deklarieren, bevor `/think` die erzeugte CLI beeinflussen kann.

Bevor OpenClaw das gebündelte `claude-cli`-Backend verwenden kann, muss Claude Code selbst
bereits auf demselben Host angemeldet sein:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Verwenden Sie `agents.defaults.cliBackends.claude-cli.command` nur, wenn die `claude`-
Binärdatei noch nicht in `PATH` vorhanden ist.

## Sitzungen

- Wenn die CLI Sitzungen unterstützt, setzen Sie `sessionArg` (z. B. `--session-id`) oder
  `sessionArgs` (Platzhalter `{sessionId}`), wenn die ID in mehrere Flags eingefügt werden muss.
- Wenn die CLI einen **resume-Unterbefehl** mit anderen Flags verwendet, setzen Sie
  `resumeArgs` (ersetzt `args` beim Fortsetzen) und optional `resumeOutput`
  (für Nicht-JSON-Fortsetzungen).
- `sessionMode`:
  - `always`: immer eine Sitzungs-ID senden (neue UUID, wenn keine gespeichert ist).
  - `existing`: nur eine Sitzungs-ID senden, wenn zuvor eine gespeichert wurde.
  - `none`: nie eine Sitzungs-ID senden.
- `claude-cli` ist standardmäßig auf `liveSession: "claude-stdio"`, `output: "jsonl"`,
  und `input: "stdin"` gesetzt, sodass Folgeturns den laufenden Claude-Prozess wiederverwenden, solange
  er aktiv ist. Warmes stdio ist jetzt der Standard, auch für benutzerdefinierte Konfigurationen,
  die Transportfelder auslassen. Wenn das Gateway neu startet oder der untätige Prozess
  beendet wird, setzt OpenClaw anhand der gespeicherten Claude-Sitzungs-ID fort. Gespeicherte Sitzungs-
  IDs werden vor dem Fortsetzen gegen ein vorhandenes lesbares Projekttranskript geprüft,
  sodass Phantom-Bindungen mit `reason=transcript-missing` bereinigt werden,
  statt stillschweigend eine neue Claude CLI-Sitzung unter `--resume` zu starten.
- Claude-Live-Sitzungen behalten begrenzte JSONL-Ausgabeschutzmechanismen. Standardwerte erlauben bis zu
  8 MiB und 20.000 rohe JSONL-Zeilen pro Turn. Tool-lastige Claude-Turns können
  sie pro Backend mit
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  und `maxTurnLines` erhöhen; OpenClaw begrenzt diese Einstellungen auf 64 MiB und 100.000
  Zeilen.
- Gespeicherte CLI-Sitzungen sind Provider-eigene Kontinuität. Der implizite tägliche Sitzungs-
  Reset unterbricht sie nicht; `/reset` und explizite `session.reset`-Richtlinien tun dies weiterhin.
- Neue CLI-Sitzungen werden normalerweise nur aus OpenClaws Compaction-Zusammenfassung
  plus dem Nach-Compaction-Endstück neu befüllt. Um kurze Sitzungen wiederherzustellen, die
  vor der Compaction ungültig werden, kann ein Backend sich mit
  `reseedFromRawTranscriptWhenUncompacted: true` dafür anmelden. OpenClaw hält das rohe
  Transkript-Neubefüllen weiterhin begrenzt und beschränkt es auf sichere Ungültigkeiten wie fehlende
  CLI-Transkripte, System-Prompt-/MCP-Änderungen oder eine Sitzung-abgelaufen-Wiederholung; Änderungen
  an Authentifizierungsprofil oder Anmeldedaten-Epoche befüllen den rohen Transkriptverlauf nie neu.

Serialisierungshinweise:

- `serialize: true` hält Läufe derselben Lane in Reihenfolge.
- Die meisten CLIs serialisieren auf einer Provider-Lane.
- OpenClaw verwirft die Wiederverwendung gespeicherter CLI-Sitzungen, wenn sich die ausgewählte Authentifizierungsidentität ändert,
  einschließlich geänderter Authentifizierungsprofil-ID, statischem API-Schlüssel, statischem Token oder OAuth-
  Kontoidentität, wenn die CLI eine offenlegt. OAuth-Zugriffs- und Aktualisierungstoken-
  Rotation unterbricht die gespeicherte CLI-Sitzung nicht. Wenn eine CLI keine
  stabile OAuth-Konto-ID offenlegt, lässt OpenClaw diese CLI die Fortsetzungsberechtigungen erzwingen.

## Ausweich-Präludium aus claude-cli-Sitzungen

Wenn ein `claude-cli`-Versuch zu einem Nicht-CLI-Kandidaten in
[`agents.defaults.model.fallbacks`](/de/concepts/model-failover) übergeht, versieht OpenClaw
den nächsten Versuch mit einem Kontextpräludium, das aus Claude Codes lokalem
JSONL-Transkript unter `~/.claude/projects/` gewonnen wurde. Ohne diese Befüllung würde der Ausweich-
Provider kalt starten, weil OpenClaws eigenes Sitzungstranskript für `claude-cli`-Läufe leer ist.

- Das Präludium bevorzugt die neueste `/compact`-Zusammenfassung oder den `compact_boundary`-
  Marker und hängt dann die neuesten Nach-Grenze-Turns bis zu einem Zeichen-
  Budget an. Vor-Grenze-Turns werden verworfen, weil die Zusammenfassung sie bereits repräsentiert.
- Tool-Blöcke werden zu kompakten Hinweisen `(tool call: name)` und
  `(tool result: …)` zusammengeführt, um das Prompt-Budget ehrlich zu halten. Die Zusammenfassung wird
  mit `(truncated)` gekennzeichnet, wenn sie überläuft.
- `claude-cli`-zu-`claude-cli`-Ausweichpfade desselben Providers verlassen sich auf Claudes eigenes
  `--resume` und überspringen das Präludium.
- Die Befüllung verwendet die vorhandene Claude-Sitzungsdateipfad-Validierung wieder, sodass
  keine beliebigen Pfade gelesen werden können.

## Bilder (Durchreichen)

Wenn Ihre CLI Bildpfade akzeptiert, setzen Sie `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw schreibt base64-Bilder in temporäre Dateien. Wenn `imageArg` gesetzt ist, werden diese
Pfade als CLI-Argumente übergeben. Wenn `imageArg` fehlt, hängt OpenClaw die
Dateipfade an den Prompt an (Pfadinjektion), was für CLIs ausreicht, die lokale Dateien
automatisch aus Klartextpfaden laden.

## Eingaben / Ausgaben

- `output: "json"` (Standard) versucht, JSON zu parsen und Text + Sitzungs-ID zu extrahieren.
- Für Gemini CLI-JSON-Ausgabe liest OpenClaw Antworttext aus `response` und
  Nutzung aus `stats`, wenn `usage` fehlt oder leer ist.
- `output: "jsonl"` parst JSONL-Streams (zum Beispiel Codex CLI `--json`) und extrahiert die finale Agentennachricht plus Sitzungs-
  Kennungen, sofern vorhanden.
- `output: "text"` behandelt stdout als finale Antwort.

Eingabemodi:

- `input: "arg"` (Standard) übergibt den Prompt als letztes CLI-Argument.
- `input: "stdin"` sendet den Prompt über stdin.
- Wenn der Prompt sehr lang ist und `maxPromptArgChars` gesetzt ist, wird stdin verwendet.

## Standardwerte (Plugin-eigen)

Das gebündelte OpenAI-Plugin registriert außerdem einen Standardwert für `codex-cli`:

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
`gemini` auf dem `PATH` verfügbar sein (`brew install gemini-cli` oder
`npm install -g @google/gemini-cli`).

JSON-Hinweise zur Gemini CLI:

- Antworttext wird aus dem JSON-Feld `response` gelesen.
- Die Nutzung fällt auf `stats` zurück, wenn `usage` fehlt oder leer ist.
- `stats.cached` wird in OpenClaw `cacheRead` normalisiert.
- Wenn `stats.input` fehlt, leitet OpenClaw Eingabe-Token aus
  `stats.input_tokens - stats.cached` ab.

Nur bei Bedarf überschreiben (häufig: absoluter `command`-Pfad).

## Plugin-eigene Standardeinstellungen

CLI-Backend-Standardeinstellungen sind jetzt Teil der Plugin-Oberfläche:

- Plugins registrieren sie mit `api.registerCliBackend(...)`.
- Die Backend-`id` wird zum Provider-Präfix in Modellreferenzen.
- Benutzerkonfiguration in `agents.defaults.cliBackends.<id>` überschreibt weiterhin den Plugin-Standard.
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

`input` schreibt den System-Prompt und den an die CLI übergebenen Benutzer-Prompt um. `output`
schreibt gestreamte Assistant-Deltas und geparsten finalen Text um, bevor OpenClaw
seine eigenen Kontrollmarker und die Kanalzustellung verarbeitet.

Für CLIs, die mit Claude Code stream-json kompatibles JSONL ausgeben, setzen Sie
`jsonlDialect: "claude-stream-json"` in der Konfiguration dieses Backends.

## Bundle-MCP-Overlays

CLI-Backends erhalten OpenClaw-Tool-Aufrufe **nicht** direkt, aber ein Backend kann
sich mit `bundleMcp: true` für ein generiertes MCP-Konfigurations-Overlay entscheiden.

Aktuelles gebündeltes Verhalten:

- `claude-cli`: generierte strikte MCP-Konfigurationsdatei
- `codex-cli`: Inline-Konfigurationsüberschreibungen für `mcp_servers`; der generierte
  OpenClaw-Loopback-Server wird mit dem Tool-Genehmigungsmodus pro Server von Codex markiert,
  sodass MCP-Aufrufe nicht durch lokale Genehmigungsaufforderungen blockiert werden können
- `google-gemini-cli`: generierte Gemini-Systemeinstellungsdatei

Wenn Bundle-MCP aktiviert ist, führt OpenClaw Folgendes aus:

- startet einen Loopback-HTTP-MCP-Server, der Gateway-Tools für den CLI-Prozess bereitstellt
- authentifiziert die Bridge mit einem Token pro Sitzung (`OPENCLAW_MCP_TOKEN`)
- beschränkt den Tool-Zugriff auf die aktuelle Sitzung, das Konto und den Kanalkontext
- lädt aktivierte Bundle-MCP-Server für den aktuellen Workspace
- führt sie mit jeder bestehenden Backend-MCP-Konfigurations-/Einstellungsstruktur zusammen
- schreibt die Startkonfiguration mit dem Backend-eigenen Integrationsmodus der besitzenden Erweiterung um

Wenn keine MCP-Server aktiviert sind, injiziert OpenClaw weiterhin eine strikte Konfiguration, wenn ein
Backend Bundle-MCP aktiviert, damit Hintergrundausführungen isoliert bleiben.

Sitzungsgebundene gebündelte MCP-Runtimes werden zur Wiederverwendung innerhalb einer Sitzung zwischengespeichert und anschließend
nach `mcp.sessionIdleTtlMs` Millisekunden Leerlaufzeit bereinigt (Standard 10
Minuten; zum Deaktivieren `0` setzen). Einmalige eingebettete Ausführungen wie Auth-Probes,
Slug-Generierung und Active-Memory-Recall fordern die Bereinigung am Ausführungsende an, damit stdio-
Child-Prozesse und Streamable HTTP/SSE-Streams die Ausführung nicht überdauern.

## Einschränkungen

- **Keine direkten OpenClaw-Tool-Aufrufe.** OpenClaw injiziert keine Tool-Aufrufe in
  das CLI-Backend-Protokoll. Backends sehen Gateway-Tools nur, wenn sie
  `bundleMcp: true` aktivieren.
- **Streaming ist Backend-spezifisch.** Einige Backends streamen JSONL; andere puffern
  bis zum Beenden.
- **Strukturierte Ausgaben** hängen vom JSON-Format der CLI ab.
- **Codex CLI-Sitzungen** werden über Textausgabe fortgesetzt (kein JSONL), was weniger
  strukturiert ist als die anfängliche `--json`-Ausführung. OpenClaw-Sitzungen funktionieren weiterhin
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
