---
read_when:
    - Sie möchten einen zuverlässigen Fallback, wenn API-Provider ausfallen
    - Sie führen lokale KI-CLIs aus und möchten sie wiederverwenden
    - Sie möchten die MCP-Loopback-Bridge für den Zugriff auf CLI-Backend-Tools verstehen
summary: 'CLI-Backends: lokales AI-CLI-Fallback mit optionaler MCP-Tool-Bridge'
title: CLI-Backends
x-i18n:
    generated_at: "2026-06-27T17:27:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dfcfbe821887dd5c46fdcca6dbd089bbf5f61d5b2ac9ad59980b156933bb3d54
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw kann **lokale KI-CLIs** als **reinen Text-Fallback** ausführen, wenn API-Provider ausgefallen,
rate-limitiert oder vorübergehend fehlerhaft sind. Dies ist bewusst konservativ:

- **OpenClaw-Tools werden nicht direkt injiziert**, aber Backends mit `bundleMcp: true`
  können Gateway-Tools über eine local loopback MCP-Bridge erhalten.
- **JSONL-Streaming** für CLIs, die es unterstützen.
- **Sitzungen werden unterstützt** (damit Folgeturns kohärent bleiben).
- **Bilder können durchgereicht werden**, wenn die CLI Bildpfade akzeptiert.

Dies ist als **Sicherheitsnetz** statt als primärer Pfad gedacht. Verwenden Sie es, wenn Sie
Textantworten wünschen, die „immer funktionieren“, ohne sich auf externe APIs zu verlassen.

Wenn Sie eine vollständige Harness-Runtime mit ACP-Sitzungssteuerung, Hintergrundaufgaben,
Thread-/Konversationsbindung und persistenten externen Coding-Sitzungen möchten, verwenden Sie
stattdessen [ACP-Agenten](/de/tools/acp-agents). CLI-Backends sind nicht ACP.

<Tip>
  Erstellen Sie ein neues Backend-Plugin? Verwenden Sie
  [CLI-Backend-Plugins](/de/plugins/cli-backend-plugins). Diese Seite richtet sich an Benutzer,
  die ein bereits registriertes Backend konfigurieren und betreiben.
</Tip>

## Einsteigerfreundlicher Schnellstart

Sie können Claude Code CLI **ohne Konfiguration** verwenden (das gebündelte Anthropic-Plugin
registriert ein Standard-Backend):

```bash
openclaw agent --agent main --message "hi" --model claude-cli/claude-sonnet-4-6
```

`main` ist die Standard-Agent-ID, wenn keine explizite Agentenliste konfiguriert ist. Wenn
Sie mehrere Agenten verwenden, ersetzen Sie sie durch die Agent-ID, die Sie ausführen möchten.

Wenn Ihr Gateway unter launchd/systemd läuft und PATH minimal ist, fügen Sie nur den
Befehlspfad hinzu:

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
      },
    },
  },
}
```

Das war es. Keine Schlüssel, keine zusätzliche Authentifizierungskonfiguration über die CLI selbst hinaus erforderlich.

Wenn Sie ein gebündeltes CLI-Backend als **primären Nachrichten-Provider** auf einem
Gateway-Host verwenden, lädt OpenClaw jetzt automatisch das besitzende gebündelte Plugin, wenn Ihre Konfiguration
dieses Backend explizit in einer Modellreferenz oder unter
`agents.defaults.cliBackends` referenziert.

## Als Fallback verwenden

Fügen Sie ein CLI-Backend zu Ihrer Fallback-Liste hinzu, damit es nur ausgeführt wird, wenn primäre Modelle fehlschlagen:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["claude-cli/claude-sonnet-4-6"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "claude-cli/claude-sonnet-4-6": {},
      },
    },
  },
}
```

Hinweise:

- Wenn Sie `agents.defaults.models` (Allowlist) verwenden, müssen Sie dort auch Ihre CLI-Backend-Modelle einschließen.
- Wenn der primäre Provider fehlschlägt (Authentifizierung, Rate Limits, Timeouts), versucht OpenClaw
  als Nächstes das CLI-Backend.

## Konfigurationsübersicht

Alle CLI-Backends befinden sich unter:

```
agents.defaults.cliBackends
```

Jeder Eintrag ist durch eine **Provider-ID** (z. B. `claude-cli`, `my-cli`) geschlüsselt.
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

1. **Wählt ein Backend aus** basierend auf dem Provider-Präfix (`claude-cli/...`).
2. **Erstellt einen System-Prompt** mit demselben OpenClaw-Prompt und Workspace-Kontext.
3. **Führt die CLI aus** mit einer Sitzungs-ID (falls unterstützt), damit der Verlauf konsistent bleibt.
   Das gebündelte `claude-cli`-Backend hält pro OpenClaw-Sitzung einen Claude-stdio-Prozess am Leben
   und sendet Folgeturns über stream-json stdin.
4. **Parst die Ausgabe** (JSON oder Klartext) und gibt den finalen Text zurück.
5. **Persistiert Sitzungs-IDs** pro Backend, damit Folgeturns dieselbe CLI-Sitzung wiederverwenden.

<Note>
Das gebündelte Anthropic-Backend `claude-cli` wird wieder unterstützt. Anthropic-Mitarbeiter
haben uns mitgeteilt, dass OpenClaw-artige Claude-CLI-Nutzung wieder erlaubt ist, daher behandelt OpenClaw die
Nutzung von `claude -p` für diese Integration als autorisiert, sofern Anthropic keine
neue Richtlinie veröffentlicht.
</Note>

Das gebündelte Anthropic-Backend `claude-cli` bevorzugt Claude Codes nativen Skill-
Resolver für OpenClaw-Skills. Wenn der aktuelle Skills-Snapshot mindestens
einen ausgewählten Skill mit materialisiertem Pfad enthält, übergibt OpenClaw ein temporäres Claude
Code-Plugin mit `--plugin-dir` und lässt den doppelten OpenClaw-Skills-Katalog
aus dem angehängten System-Prompt weg. Wenn der Snapshot keinen materialisierten Plugin-
Skill enthält, behält OpenClaw den Prompt-Katalog als Fallback bei. Skill-env/API-Schlüssel-
Überschreibungen werden weiterhin von OpenClaw auf die Kindprozessumgebung für den
Lauf angewendet.

Claude CLI hat auch einen eigenen nicht interaktiven Berechtigungsmodus. OpenClaw bildet diesen
auf die bestehende Ausführungsrichtlinie ab, anstatt Claude-spezifische Richtlinienkonfiguration hinzuzufügen.
Für von OpenClaw verwaltete Claude-Live-Sitzungen ist die effektive OpenClaw-Ausführungsrichtlinie
maßgeblich: YOLO (`tools.exec.security: "full"` und
`tools.exec.ask: "off"`) startet Claude mit
`--permission-mode bypassPermissions`, während restriktive effektive Ausführungsrichtlinie
Claude mit `--permission-mode default` startet. Agentenspezifische
`agents.list[].tools.exec`-Einstellungen überschreiben globale `tools.exec` für diesen
Agenten. Rohargumente des Claude-Backends dürfen weiterhin `--permission-mode` enthalten, aber Live-
Claude-Starts normalisieren dieses Flag, damit es der effektiven OpenClaw-Ausführungsrichtlinie entspricht.

Das gebündelte Anthropic-Backend `claude-cli` bildet außerdem OpenClaw-`/think`-Stufen
für Nicht-Off-Stufen auf Claude Codes natives `--effort`-Flag ab. `minimal` und
`low` werden auf `low` abgebildet, `adaptive` und `medium` auf `medium`, und `high`,
`xhigh` und `max` werden direkt abgebildet. Andere CLI-Backends benötigen ihr besitzendes Plugin, um
einen äquivalenten argv-Mapper zu deklarieren, bevor `/think` die erzeugte CLI beeinflussen kann.

Bevor OpenClaw das gebündelte Backend `claude-cli` verwenden kann, muss Claude Code selbst
bereits auf demselben Host angemeldet sein:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Docker-Installationen benötigen Claude Code installiert und angemeldet im persistierten
Container-Home, nicht nur auf dem Host. Siehe
[Claude-CLI-Backend in Docker](/de/install/docker#claude-cli-backend-in-docker).

Verwenden Sie `agents.defaults.cliBackends.claude-cli.command` nur, wenn die `claude`-
Binärdatei nicht bereits auf `PATH` liegt.

## Sitzungen

- Wenn die CLI Sitzungen unterstützt, setzen Sie `sessionArg` (z. B. `--session-id`) oder
  `sessionArgs` (Platzhalter `{sessionId}`), wenn die ID in mehrere Flags eingefügt werden muss.
- Wenn die CLI einen **Resume-Unterbefehl** mit anderen Flags verwendet, setzen Sie
  `resumeArgs` (ersetzt `args` beim Fortsetzen) und optional `resumeOutput`
  (für Nicht-JSON-Fortsetzungen).
- `sessionMode`:
  - `always`: immer eine Sitzungs-ID senden (neue UUID, wenn keine gespeichert ist).
  - `existing`: nur eine Sitzungs-ID senden, wenn zuvor eine gespeichert wurde.
  - `none`: nie eine Sitzungs-ID senden.
- `claude-cli` ist standardmäßig auf `liveSession: "claude-stdio"`, `output: "jsonl"`,
  und `input: "stdin"` gesetzt, sodass Folgeturns den aktiven Live-Claude-Prozess wiederverwenden.
  Warmes stdio ist jetzt der Standard, auch für benutzerdefinierte Konfigurationen,
  die Transportfelder auslassen. Wenn der Gateway neu startet oder der Leerlaufprozess
  beendet wird, setzt OpenClaw von der gespeicherten Claude-Sitzungs-ID fort. Gespeicherte Sitzungs-
  IDs werden vor dem Fortsetzen gegen ein vorhandenes lesbares Projekttranskript geprüft,
  sodass Phantom-Bindungen mit `reason=transcript-missing` gelöscht werden,
  statt stillschweigend eine frische Claude-CLI-Sitzung unter `--resume` zu starten.
- Claude-Live-Sitzungen behalten begrenzte JSONL-Ausgabeschutzmechanismen. Standardwerte erlauben bis zu
  8 MiB und 20.000 rohe JSONL-Zeilen pro Turn. Tool-intensive Claude-Turns können
  sie pro Backend mit
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  und `maxTurnLines` erhöhen; OpenClaw begrenzt diese Einstellungen auf 64 MiB und 100.000
  Zeilen.
- Gespeicherte CLI-Sitzungen sind Provider-eigene Kontinuität. Der implizite tägliche Sitzungs-
  Reset trennt sie nicht; `/reset` und explizite `session.reset`-Richtlinien tun dies weiterhin.
- Frische CLI-Sitzungen werden normalerweise nur aus OpenClaws Compaction-Zusammenfassung
  plus Nach-Compaction-Endstück neu befüllt. Um kurze Sitzungen wiederherzustellen, die
  vor der Compaction ungültig werden, kann sich ein Backend mit
  `reseedFromRawTranscriptWhenUncompacted: true` dafür entscheiden. OpenClaw hält das rohe
  Transkript-Re-Seeding weiterhin begrenzt und beschränkt es auf sichere Invalidierungen wie fehlende
  CLI-Transkripte, System-Prompt-/MCP-Änderungen oder einen session-expired-Wiederholungsversuch; Änderungen am Auth-
  Profil oder an der Credential-Epoche reseeden niemals den rohen Transkriptverlauf.

Serialisierungshinweise:

- `serialize: true` hält Läufe derselben Lane geordnet.
- Die meisten CLIs serialisieren auf einer Provider-Lane.
- OpenClaw verwirft die Wiederverwendung gespeicherter CLI-Sitzungen, wenn sich die ausgewählte Authentifizierungsidentität ändert,
  einschließlich einer geänderten Auth-Profil-ID, eines statischen API-Schlüssels, eines statischen Tokens oder einer OAuth-
  Kontenidentität, wenn die CLI eine offenlegt. Die Rotation von OAuth-Zugriffs- und Aktualisierungstoken
  trennt die gespeicherte CLI-Sitzung nicht. Wenn eine CLI keine
  stabile OAuth-Konto-ID offenlegt, lässt OpenClaw diese CLI Fortsetzungsberechtigungen durchsetzen.

## Fallback-Präludium aus claude-cli-Sitzungen

Wenn ein `claude-cli`-Versuch auf einen Nicht-CLI-Kandidaten in
[`agents.defaults.model.fallbacks`](/de/concepts/model-failover) ausweicht, seedet OpenClaw
den nächsten Versuch mit einem Kontext-Präludium, das aus Claude Codes lokalem
JSONL-Transkript unter `~/.claude/projects/` geerntet wurde. Ohne diesen Seed würde der Fallback-
Provider kalt starten, weil OpenClaws eigenes Sitzungstranskript für
`claude-cli`-Läufe leer ist.

- Das Präludium bevorzugt die neueste `/compact`-Zusammenfassung oder den `compact_boundary`-
  Marker und hängt dann die neuesten Post-Boundary-Turns bis zu einem Zeichen-
  Budget an. Pre-Boundary-Turns werden verworfen, weil die Zusammenfassung sie bereits repräsentiert.
- Tool-Blöcke werden zu kompakten Hinweisen `(tool call: name)` und
  `(tool result: …)` zusammengeführt, um das Prompt-Budget realistisch zu halten. Die Zusammenfassung wird
  mit `(truncated)` gekennzeichnet, wenn sie überläuft.
- Same-Provider-`claude-cli`-zu-`claude-cli`-Fallbacks verlassen sich auf Claudes eigenes
  `--resume` und überspringen das Präludium.
- Der Seed verwendet die bestehende Validierung des Claude-Sitzungsdateipfads wieder, sodass
  beliebige Pfade nicht gelesen werden können.

## Bilder (Durchreichen)

Wenn Ihre CLI Bildpfade akzeptiert, setzen Sie `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw schreibt Base64-Bilder in temporäre Dateien. Wenn `imageArg` gesetzt ist, werden diese
Pfade als CLI-Argumente übergeben. Wenn `imageArg` fehlt, hängt OpenClaw die
Dateipfade an den Prompt an (Pfadinjektion), was für CLIs ausreicht, die lokale Dateien automatisch
aus Klartextpfaden laden.

## Eingaben / Ausgaben

- `output: "json"` (Standard) versucht, JSON zu parsen und Text + Sitzungs-ID zu extrahieren.
- Für Gemini-CLI-JSON-Ausgabe liest OpenClaw Antworttext aus `response` und Nutzung
  aus `stats`, wenn `usage` fehlt oder leer ist. Der gebündelte Gemini-CLI-Standard
  verwendet `stream-json`, aber alte `--output-format json`-Überschreibungen verwenden weiterhin den
  JSON-Parser.
- `output: "jsonl"` parst JSONL-Streams und extrahiert die finale Agentennachricht plus Sitzungs-
  IDs, falls vorhanden.
- `output: "text"` behandelt stdout als finale Antwort.

Eingabemodi:

- `input: "arg"` (Standard) übergibt den Prompt als letztes CLI-Argument.
- `input: "stdin"` sendet den Prompt über stdin.
- Wenn der Prompt sehr lang ist und `maxPromptArgChars` gesetzt ist, wird stdin verwendet.

## Standardwerte (Plugin-eigen)

Gebündelte CLI-Backend-Standardwerte liegen bei ihrem besitzenden Plugin. Zum Beispiel
besitzt Anthropic `claude-cli` und Google besitzt `google-gemini-cli`. OpenAI Codex-
Agent-Ausführungen verwenden den Codex-App-Server-Harness über `openai/*`; OpenClaw
registriert kein gebündeltes `codex-cli`-Backend mehr.

Das gebündelte Anthropic-Plugin registriert einen Standardwert für `claude-cli`:

- `command: "claude"`
- `args: ["-p","--output-format","stream-json","--include-partial-messages","--verbose", ...]`
- `output: "jsonl"`
- `input: "stdin"`
- `modelArg: "--model"`
- `sessionMode: "always"`

Das gebündelte Google-Plugin registriert außerdem einen Standardwert für `google-gemini-cli`:

- `command: "gemini"`
- `args: ["--skip-trust", "--approval-mode", "auto_edit", "--output-format", "stream-json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--skip-trust", "--approval-mode", "auto_edit", "--resume", "{sessionId}", "--output-format", "stream-json", "--prompt", "{prompt}"]`
- `output: "jsonl"`
- `resumeOutput: "jsonl"`
- `jsonlDialect: "gemini-stream-json"`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

Voraussetzung: Die lokale Gemini CLI muss installiert und als
`gemini` in `PATH` verfügbar sein (`brew install gemini-cli` oder
`npm install -g @google/gemini-cli`).

Hinweise zur Gemini-CLI-Ausgabe:

- Der standardmäßige `stream-json`-Parser liest Assistant-`message`-Ereignisse, Tool-Ereignisse,
  die abschließende `result`-Nutzung und fatale Gemini-Fehlerereignisse.
- Wenn Sie Gemini-Argumente auf `--output-format json` überschreiben, normalisiert OpenClaw dieses
  Backend zurück auf `output: "json"` und liest Antworttext aus dem JSON-Feld `response`.
- Die Nutzung fällt auf `stats` zurück, wenn `usage` fehlt oder leer ist.
- `stats.cached` wird in OpenClaw `cacheRead` normalisiert.
- Wenn `stats.input` fehlt, leitet OpenClaw Eingabetoken aus
  `stats.input_tokens - stats.cached` ab.

Nur bei Bedarf überschreiben (häufig: absoluter `command`-Pfad).

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
seine eigenen Kontrollmarker und die Kanalzustellung verarbeitet.

Für CLIs, die Provider-spezifische JSONL-Ereignisse ausgeben, setzen Sie `jsonlDialect` in der
Konfiguration dieses Backends. Unterstützte Dialekte sind `claude-stream-json` für Claude
Code-kompatible Streams und `gemini-stream-json` für Gemini-CLI-`stream-json`-
Ereignisse.

## Besitz nativer Compaction

Einige CLI-Backends führen einen Agent aus, der sein **eigenes** Transkript kompaktiert, daher darf OpenClaw
seinen Schutz-Summarizer nicht gegen sie ausführen - das würde gegen die eigene
Compaction des Backends arbeiten und kann den Turn hart fehlschlagen lassen.

`claude-cli` hat keinen Harness-Endpunkt - Claude Code kompaktiert intern - daher deklariert es
`ownsNativeCompaction: true`, und OpenClaw gibt aus dem Compaction-Pfad eine No-op zurück.
Native Harness-Sitzungen wie Codex werden stattdessen weiterhin an ihren Harness-Compaction-Endpunkt
weitergeleitet.

Da das Backend die Compaction besitzt, ist die alte Zwischenlösung, 
`contextTokens: 1_000_000` nur zu setzen, um zu verhindern, dass OpenClaws Schutzmechanismus in einer
claude-cli-Sitzung auslöst, **nicht mehr nötig** - der Opt-out ersetzt sie.

```typescript
api.registerCliBackend({ id: "my-cli", ownsNativeCompaction: true /* ... */ });
```

Deklarieren Sie `ownsNativeCompaction` nur für ein Backend, das seine Compaction tatsächlich besitzt: Es
muss sein eigenes Transkript zuverlässig begrenzen, wenn es sich seinem Kontextfenster nähert, und eine
fortsetzbare Sitzung persistieren (z. B. `--resume` / `--session-id`); andernfalls kann eine zurückgestellte Sitzung
über dem Budget bleiben. Passende `agentHarnessId`-Sitzungen werden weiterhin an den Harness-Endpunkt weitergeleitet.

## Bundle-MCP-Overlays

CLI-Backends erhalten OpenClaw-Tool-Aufrufe **nicht** direkt, aber ein Backend kann
sich mit `bundleMcp: true` für ein generiertes MCP-Konfigurations-Overlay anmelden.

Aktuelles gebündeltes Verhalten:

- `claude-cli`: generierte strikte MCP-Konfigurationsdatei
- `google-gemini-cli`: generierte Gemini-Systemeinstellungsdatei

Wenn Bundle MCP aktiviert ist, führt OpenClaw Folgendes aus:

- startet einen local loopback-HTTP-MCP-Server, der Gateway-Tools für den CLI-Prozess verfügbar macht
- authentifiziert die Bridge mit einem sitzungsspezifischen Token (`OPENCLAW_MCP_TOKEN`)
- beschränkt den Tool-Zugriff auf den aktuellen Sitzungs-, Konto- und Kanalkontext
- lädt aktivierte Bundle-MCP-Server für den aktuellen Workspace
- führt sie mit vorhandenen MCP-Konfigurations-/Einstellungsformen des Backends zusammen
- schreibt die Startkonfiguration mithilfe des Backend-eigenen Integrationsmodus aus der besitzenden Erweiterung um

Wenn keine MCP-Server aktiviert sind, injiziert OpenClaw dennoch eine strikte Konfiguration, wenn ein
Backend sich für Bundle MCP anmeldet, damit Hintergrundausführungen isoliert bleiben.

Sitzungsbezogene gebündelte MCP-Runtimes werden zur Wiederverwendung innerhalb einer Sitzung gecacht und dann
nach `mcp.sessionIdleTtlMs` Millisekunden Leerlaufzeit bereinigt (Standard 10
Minuten; setzen Sie `0`, um dies zu deaktivieren). Einmalige eingebettete Ausführungen wie Auth-Prüfungen,
Slug-Generierung und Active-Memory-Abruf fordern eine Bereinigung am Ende der Ausführung an, damit stdio-
Unterprozesse und Streamable-HTTP/SSE-Streams die Ausführung nicht überdauern.

## Verlaufslimit für erneute Initialisierung

Wenn eine frische CLI-Sitzung aus einem vorherigen OpenClaw-Transkript initialisiert wird (zum
Beispiel nach einem `session_expired`-Wiederholungsversuch), wird der gerenderte
`<conversation_history>`-Block begrenzt, damit Prompts zur erneuten Initialisierung nicht
explodieren. Der Standardwert ist `12288` Zeichen (etwa 3000 Token).

Claude-CLI-Backends verwenden automatisch ein größeres Limit, das aus der aufgelösten
Claude-Kontextstufe abgeleitet wird. Standardmäßige Claude-Ausführungen mit 200K Token behalten einen größeren Transkript-
Ausschnitt, und Claude-Ausführungen mit 1M Token behalten erneut einen größeren Ausschnitt, während andere CLI-
Backends den konservativen Standardwert beibehalten.

- Das Limit steuert nur den Vorverlaufsblock des Prompts zur erneuten Initialisierung. Ausgabelimits für Live-Sitzungen
  werden separat unter `reliability.outputLimits`
  abgestimmt (siehe [Sitzungen](#sessions)).

## Einschränkungen

- **Keine direkten OpenClaw-Tool-Aufrufe.** OpenClaw injiziert keine Tool-Aufrufe in
  das CLI-Backend-Protokoll. Backends sehen Gateway-Tools nur, wenn sie sich für
  `bundleMcp: true` anmelden.
- **Streaming ist Backend-spezifisch.** Einige Backends streamen JSONL; andere puffern
  bis zum Beenden.
- **Strukturierte Ausgaben** hängen vom JSON-Format der CLI ab.

## Fehlerbehebung

- **CLI nicht gefunden**: Setzen Sie `command` auf einen vollständigen Pfad.
- **Falscher Modellname**: Verwenden Sie `modelAliases`, um `provider/model` → CLI-Modell zuzuordnen.
- **Keine Sitzungskontinuität**: Stellen Sie sicher, dass `sessionArg` gesetzt ist und `sessionMode` nicht
  `none` ist.
- **Bilder ignoriert**: Setzen Sie `imageArg` (und verifizieren Sie, dass die CLI Dateipfade unterstützt).

## Verwandt

- [Gateway-Runbook](/de/gateway)
- [Lokale Modelle](/de/gateway/local-models)
