---
read_when:
    - Sie benötigen eine zuverlässige Ausweichlösung, wenn API-Provider ausfallen
    - Sie führen lokale KI-CLIs aus und möchten sie wiederverwenden
    - Sie möchten die MCP-Loopback-Bridge für den Tool-Zugriff über das CLI-Backend verstehen
summary: 'CLI-Backends: lokales KI-CLI-Fallback mit optionaler MCP-Tool-Bridge'
title: CLI-Backends
x-i18n:
    generated_at: "2026-07-12T15:20:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 119b503d3107672c1bd7ccc39b464f253138d0d63d175018e91cbaeb720c462f
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw kann eine lokale KI-CLI als reine Text-Rückfalllösung ausführen, wenn API-Provider ausgefallen oder ratenbegrenzt sind oder sich fehlerhaft verhalten. Diese Lösung ist bewusst konservativ ausgelegt:

- OpenClaw-Tools werden nicht direkt injiziert, aber ein Backend mit `bundleMcp: true` kann Gateway-Tools über eine Loopback-MCP-Bridge empfangen.
- JSONL-Streaming für CLIs, die es unterstützen.
- Sitzungen werden unterstützt, sodass nachfolgende Interaktionen kohärent bleiben.
- Bilder werden durchgereicht, wenn die CLI Bildpfade akzeptiert.

Verwenden Sie dies als Sicherheitsnetz für Textantworten, die „immer funktionieren“ sollen, nicht als primären Pfad. Für eine vollständige Harness-Laufzeit mit ACP-Sitzungssteuerung, Hintergrundaufgaben, Thread-/Konversationsbindung und persistenten externen Programmiersitzungen verwenden Sie stattdessen [ACP-Agenten](/de/tools/acp-agents); CLI-Backends sind kein ACP.

<Tip>
  Erstellen Sie ein neues Backend-Plugin? Weitere Informationen finden Sie unter [CLI-Backend-Plugins](/de/plugins/cli-backend-plugins). Diese Seite behandelt die Konfiguration und den Betrieb eines bereits registrierten Backends.
</Tip>

## Schnellstart

Das gebündelte Anthropic-Plugin registriert ein standardmäßiges `claude-cli`-Backend. Daher funktioniert es ohne weitere Konfiguration, sofern Claude Code installiert und angemeldet ist:

```bash
openclaw agent --agent main --message "hi" --model claude-cli/claude-sonnet-4-6
```

`main` ist die standardmäßige Agenten-ID, wenn keine explizite Agentenliste konfiguriert ist; verwenden Sie andernfalls Ihre eigene Agenten-ID.

Wenn das Gateway unter launchd/systemd mit einem minimalen `PATH` ausgeführt wird, geben Sie die Binärdatei explizit an:

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

Wenn Sie ein gebündeltes CLI-Backend als primären Nachrichten-Provider auf einem Gateway-Host verwenden, lädt OpenClaw das zugehörige gebündelte Plugin automatisch, sobald Ihre Konfiguration dieses Backend in einer Modellreferenz oder unter `agents.defaults.cliBackends` referenziert.

## Verwendung als Rückfalllösung

Fügen Sie das CLI-Backend Ihrer Rückfallliste hinzu, damit es nur ausgeführt wird, wenn die primären Modelle fehlschlagen:

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

Wenn Sie `agents.defaults.models` als Positivliste verwenden, nehmen Sie dort auch Ihre CLI-Backend-Modelle auf. Wenn der primäre Provider fehlschlägt (Authentifizierung, Ratenbegrenzungen, Zeitüberschreitungen), versucht OpenClaw als Nächstes das CLI-Backend.

## Konfiguration

Alle CLI-Backends befinden sich unter `agents.defaults.cliBackends` und sind nach Provider-ID indiziert (z. B. `claude-cli`, `my-cli`). Die Provider-ID wird zur linken Seite der Modellreferenz: `<provider>/<model>`.

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
          // Dediziertes Flag für die Prompt-Datei:
          // systemPromptFileArg: "--system-file",
          // Stattdessen ein Codex-artiges Flag zum Überschreiben der Konfiguration:
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          // Nur aktivieren, wenn dieses Backend ungültig gewordene Sitzungen vor
          // der Compaction aus einem begrenzten rohen OpenClaw-Transkript neu initialisieren darf.
          reseedFromRawTranscriptWhenUncompacted: true,
          serialize: true,
        },
      },
    },
  },
}
```

## Funktionsweise

1. Wählt anhand des Provider-Präfixes (`claude-cli/...`) ein Backend aus.
2. Erstellt einen System-Prompt unter Verwendung desselben OpenClaw-Prompts und Workspace-Kontexts.
3. Führt die CLI mit einer Sitzungs-ID aus (sofern unterstützt), damit der Verlauf konsistent bleibt. Das gebündelte `claude-cli`-Backend hält pro OpenClaw-Sitzung einen Claude-stdio-Prozess aktiv und sendet nachfolgende Interaktionen über stream-json-stdin.
4. Verarbeitet die Ausgabe (JSON oder Klartext) und gibt den endgültigen Text zurück.
5. Speichert Sitzungs-IDs pro Backend, damit nachfolgende Interaktionen dieselbe CLI-Sitzung wiederverwenden.

### Besonderheiten der Claude-CLI

Das gebündelte `claude-cli`-Backend bevorzugt die native Skill-Auflösung von Claude Code. Wenn der aktuelle Skills-Snapshot mindestens einen ausgewählten Skill mit einem materialisierten Pfad enthält, übergibt OpenClaw über `--plugin-dir` ein temporäres Claude-Code-Plugin und lässt den duplizierten OpenClaw-Skills-Katalog im angehängten System-Prompt weg. Ohne einen materialisierten Plugin-Skill behält OpenClaw den Prompt-Katalog als Rückfalllösung bei. Überschreibungen für Skill-Umgebungsvariablen/API-Schlüssel gelten weiterhin für die Umgebung des untergeordneten Prozesses während der Ausführung.

Die Claude-CLI verfügt über einen eigenen nicht interaktiven Berechtigungsmodus; OpenClaw ordnet diesen der bestehenden Ausführungsrichtlinie zu, anstatt Claude-spezifische Konfiguration hinzuzufügen. Für von OpenClaw verwaltete aktive Claude-Sitzungen ist die effektive Ausführungsrichtlinie maßgeblich: YOLO (`tools.exec.security: "full"` und `tools.exec.ask: "off"`) startet Claude mit `--permission-mode bypassPermissions`, während eine restriktive Richtlinie es mit `--permission-mode default` startet. Agentenspezifische Einstellungen unter `agents.list[].tools.exec` überschreiben für diesen Agenten das globale `tools.exec`. Rohe Backend-Argumente können weiterhin `--permission-mode` enthalten, aber aktive Claude-Starts normalisieren dieses Flag entsprechend der effektiven Richtlinie.

Das Backend ordnet außerdem die OpenClaw-`/think`-Stufen dem nativen `--effort`-Flag von Claude Code zu: `minimal`/`low` -> `low`, `medium` -> `medium`, und `high`/`xhigh`/`max` werden direkt durchgereicht. `adaptive` entfernt konfigurierte `--effort`-Flags und stellt keinen Ersatz bereit, sodass Claude Code den effektiven Aufwand anhand seiner eigenen Umgebung, Einstellungen und Modellstandards bestimmt. Bei anderen CLI-Backends muss das zugehörige Plugin einen gleichwertigen argv-Mapper deklarieren, bevor `/think` die gestartete CLI beeinflusst.

Bevor OpenClaw `claude-cli` verwenden kann, muss Claude Code selbst auf demselben Host angemeldet sein:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Bei Docker-Installationen muss Claude Code im persistenten Container-Home installiert und angemeldet sein, nicht nur auf dem Host; siehe [Claude-CLI-Backend in Docker](/de/install/docker#claude-cli-backend-in-docker).

Legen Sie `agents.defaults.cliBackends.claude-cli.command` nur fest, wenn sich die Binärdatei `claude` nicht bereits in `PATH` befindet.

## Sitzungen

- Wenn die CLI Sitzungen unterstützt, legen Sie `sessionArg` (z. B. `--session-id`) oder `sessionArgs` (Platzhalter `{sessionId}`) fest, wenn die ID in mehreren Flags eingesetzt werden muss.
- Wenn die CLI einen Fortsetzungs-Unterbefehl mit anderen Flags verwendet, legen Sie `resumeArgs` fest (ersetzt beim Fortsetzen `args`) und optional `resumeOutput` für Fortsetzungen ohne JSON.
- `sessionMode`:
  - `always`: Sendet immer eine Sitzungs-ID (eine neue UUID, wenn keine gespeichert ist).
  - `existing`: Sendet nur eine Sitzungs-ID, wenn zuvor eine gespeichert wurde.
  - `none`: Sendet niemals eine Sitzungs-ID.
- `claude-cli` verwendet standardmäßig `liveSession: "claude-stdio"`, `output: "jsonl"` und `input: "stdin"`, sodass nachfolgende Interaktionen den aktiven Claude-Prozess wiederverwenden, solange er aktiv ist. Dies gilt auch für benutzerdefinierte Konfigurationen, in denen Transportfelder fehlen. Wenn das Gateway neu gestartet wird oder der inaktive Prozess beendet wird, setzt OpenClaw die Sitzung anhand der gespeicherten Claude-Sitzungs-ID fort. Gespeicherte Sitzungs-IDs werden vor dem Fortsetzen anhand eines lesbaren Projekttranskripts überprüft; fehlt das Transkript, wird die Bindung entfernt (protokolliert als `reason=transcript-missing`), anstatt unter `--resume` stillschweigend eine neue Sitzung zu starten.
- Aktive Claude-Sitzungen behalten begrenzte Schutzgrenzen für die JSONL-Ausgabe bei: standardmäßig 8 MiB und 20,000 rohe JSONL-Zeilen pro Interaktion. Erhöhen Sie diese pro Backend mit `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars` und `maxTurnLines`; OpenClaw begrenzt diese Einstellungen auf 64 MiB und 100,000 Zeilen.
- Gespeicherte CLI-Sitzungen stellen Provider-eigene Kontinuität dar. Das implizite tägliche Zurücksetzen der Sitzung beendet sie nicht; `/reset` und explizite `session.reset`-Richtlinien tun dies weiterhin.
- Neue CLI-Sitzungen werden normalerweise nur aus der Compaction-Zusammenfassung von OpenClaw sowie dem Abschnitt nach der Compaction neu initialisiert. Um kurze Sitzungen wiederherzustellen, die vor der Compaction ungültig wurden, kann ein Backend dies mit `reseedFromRawTranscriptWhenUncompacted: true` aktivieren. Die Neuinitialisierung aus dem rohen Transkript bleibt begrenzt und auf sichere Ungültigkeitsfälle beschränkt, etwa ein fehlendes CLI-Transkript, ein verwaistes Ende einer Tool-Nutzung, Änderungen an Nachrichtenrichtlinie/System-Prompt/cwd/MCP oder ein Wiederholungsversuch nach abgelaufener Sitzung; Änderungen am Authentifizierungsprofil oder an der Anmeldedaten-Epoche initialisieren den Verlauf niemals aus dem rohen Transkript neu.

Serialisierung: `serialize: true` hält Ausführungen auf derselben Verarbeitungsspur in der richtigen Reihenfolge (die meisten CLIs serialisieren auf einer Provider-Spur). OpenClaw verwirft außerdem die Wiederverwendung gespeicherter CLI-Sitzungen, wenn sich die ausgewählte Authentifizierungsidentität ändert, einschließlich einer geänderten Authentifizierungsprofil-ID, eines statischen API-Schlüssels, eines statischen Tokens oder einer OAuth-Kontoidentität, sofern die CLI eine solche bereitstellt; die bloße Rotation von OAuth-Zugriffs-/Aktualisierungstokens beendet die Sitzung nicht. Wenn eine CLI keine stabile OAuth-Konto-ID besitzt, überlässt OpenClaw dieser CLI die Durchsetzung ihrer eigenen Fortsetzungsberechtigungen.

## Rückfallpräambel aus claude-cli-Sitzungen

Wenn ein `claude-cli`-Versuch zu einem Nicht-CLI-Kandidaten in [`agents.defaults.model.fallbacks`](/de/concepts/model-failover) wechselt, initialisiert OpenClaw den nächsten Versuch mit einer Kontextpräambel, die aus dem lokalen JSONL-Transkript von Claude Code gewonnen wird (unter `~/.claude/projects/`, pro Workspace indiziert). Ohne diese Initialisierung startet der Rückfall-Provider ohne Kontext, da das OpenClaw-eigene Sitzungstranskript für `claude-cli`-Ausführungen leer ist.

- Die Präambel bevorzugt die neueste `/compact`-Zusammenfassung oder `compact_boundary`-Markierung und hängt anschließend die neuesten Interaktionen nach der Grenze bis zu einem Zeichenbudget an. Interaktionen vor der Grenze werden verworfen, da die Zusammenfassung sie bereits repräsentiert.
- Tool-Blöcke werden zu kompakten Hinweisen der Form `(tool call: name)` und `(tool result: …)` zusammengeführt, damit das Prompt-Budget korrekt bleibt; eine zu große Zusammenfassung wird gekürzt und mit `(truncated)` gekennzeichnet.
- Rückfälle von `claude-cli` zu `claude-cli` beim selben Provider verwenden Claudes eigenes `--resume` und überspringen die Präambel.
- Die Initialisierung verwendet die bestehende Validierung des Claude-Sitzungsdateipfads erneut, sodass keine beliebigen Pfade gelesen werden können.

## Bilder

Wenn Ihre CLI Bildpfade akzeptiert, legen Sie `imageArg` fest:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw schreibt Base64-Bilder in temporäre Dateien. Wenn `imageArg` festgelegt ist, werden diese Pfade als CLI-Argumente übergeben; andernfalls hängt OpenClaw die Dateipfade an den Prompt an (Pfadinjektion). Dies funktioniert bei CLIs, die lokale Dateien aus einfachen Pfaden automatisch laden.

## Ein- und Ausgaben

- `output: "text"` (Standard) behandelt stdout als endgültige Antwort.
- `output: "json"` versucht, JSON zu verarbeiten und Text sowie eine Sitzungs-ID zu extrahieren.
- `output: "jsonl"` verarbeitet einen JSONL-Stream und extrahiert die endgültige Agentennachricht sowie vorhandene Sitzungskennungen.
- Bei JSON-Ausgaben der Gemini-CLI liest OpenClaw den Antworttext aus `response` und die Nutzungsdaten aus `stats`, wenn `usage` fehlt oder leer ist. Der gebündelte Standard der Gemini-CLI verwendet `stream-json`; alte Überschreibungen mit `--output-format json` verwenden weiterhin den JSON-Parser.

Eingabemodi:

- `input: "arg"` (Standard) übergibt den Prompt als letztes CLI-Argument.
- `input: "stdin"` sendet den Prompt über stdin.
- Wenn der Prompt sehr lang und `maxPromptArgChars` festgelegt ist, wird stattdessen stdin verwendet.

## Plugin-eigene Standardeinstellungen

Die Standardeinstellungen von CLI-Backends sind Teil der Plugin-Oberfläche:

- Plugins registrieren sie mit `api.registerCliBackend(...)`.
- Die Backend-`id` wird zum Provider-Präfix in Modellreferenzen.
- Die Benutzerkonfiguration unter `agents.defaults.cliBackends.<id>` überschreibt weiterhin den Plugin-Standard.
- Die Bereinigung Backend-spezifischer Konfiguration bleibt über den optionalen `normalizeConfig`-Hook im Besitz des Plugins.

Anthropic ist für `claude-cli` zuständig und Google für `google-gemini-cli`. OpenAI-Codex-Agentenausführungen verwenden das Codex-App-Server-Harness über `openai/*`; OpenClaw registriert kein gebündeltes `codex-cli`-Backend mehr.

Das gebündelte Anthropic-Plugin registriert für `claude-cli`:

| Schlüssel             | Wert                                                                                                                                                                                                          |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `command`             | `claude`                                                                                                                                                                                                      |
| `args`                | `-p --output-format stream-json --include-partial-messages --verbose --setting-sources user --allowedTools mcp__openclaw__* --disallowedTools ScheduleWakeup,CronCreate,Bash(run_in_background:true),Monitor` |
| `output`              | `jsonl`                                                                                                                                                                                                       |
| `input`               | `stdin`                                                                                                                                                                                                       |
| `modelArg`            | `--model`                                                                                                                                                                                                     |
| `sessionArg`          | `--session-id`                                                                                                                                                                                                |
| `sessionMode`         | `always`                                                                                                                                                                                                      |
| `imageArg`            | `@`                                                                                                                                                                                                           |
| `imagePathScope`      | `workspace`                                                                                                                                                                                                   |
| `systemPromptFileArg` | `--append-system-prompt-file`                                                                                                                                                                                 |
| `systemPromptMode`    | `append`                                                                                                                                                                                                      |

Das gebündelte Google-Plugin registriert sich für `google-gemini-cli`:

| Schlüssel                  | Wert                                                                                         |
| -------------------------- | -------------------------------------------------------------------------------------------- |
| `command`                  | `gemini`                                                                                     |
| `args`                     | `--skip-trust --approval-mode auto_edit --output-format stream-json --prompt {prompt}`        |
| `resumeArgs`               | identisch, mit `--resume {sessionId}`                                                         |
| `output` / `resumeOutput`  | `jsonl`                                                                                      |
| `jsonlDialect`             | `gemini-stream-json`                                                                         |
| `imageArg`                 | `@`                                                                                          |
| `imagePathScope`           | `workspace`                                                                                  |
| `modelArg`                 | `--model`                                                                                    |
| `sessionMode`              | `existing`                                                                                   |
| `sessionIdFields`          | `["session_id", "sessionId"]`                                                                |

Voraussetzung: Die lokale Gemini CLI muss installiert und im `PATH` als `gemini` verfügbar sein (`brew install gemini-cli` oder `npm install -g @google/gemini-cli`).

Hinweise zur Ausgabe der Gemini CLI:

- Der standardmäßige `stream-json`-Parser liest `message`-Ereignisse des Assistenten, Tool-Ereignisse, Nutzungsdaten im abschließenden `result` sowie schwerwiegende Gemini-Fehlerereignisse.
- Wenn Sie die Gemini-Argumente mit `--output-format json` überschreiben, normalisiert OpenClaw dieses Backend wieder zu `output: "json"` und liest den Antworttext aus dem JSON-Feld `response`.
- Wenn `usage` fehlt oder leer ist, wird auf `stats` zurückgegriffen; `stats.cached` wird in OpenClaw zu `cacheRead` normalisiert, und falls `stats.input` fehlt, werden die Eingabe-Token aus `stats.input_tokens - stats.cached` abgeleitet.

Überschreiben Sie die Standardwerte nur bei Bedarf (am häufigsten für einen absoluten `command`-Pfad).

## Texttransformations-Overlays

Plugins, die kleine Kompatibilitätsanpassungen für Prompts oder Nachrichten benötigen, können bidirektionale Texttransformationen deklarieren, ohne einen Provider oder ein CLI-Backend zu ersetzen:

```typescript
api.registerTextTransforms({
  input: [{ from: /red basket/g, to: "blue basket" }],
  output: [{ from: /blue basket/g, to: "red basket" }],
});
```

`input` schreibt den System-Prompt und den Benutzer-Prompt um, die an die CLI übergeben werden. `output` schreibt den gestreamten Assistententext und den geparsten endgültigen Text um, bevor OpenClaw seine eigenen Steuerungsmarkierungen verarbeitet und die Nachricht an den Kanal übermittelt; bei Provider-gestützten Modellaufrufen werden außerdem Zeichenfolgenwerte in strukturierten Argumenten von Tool-Aufrufen nach der Stream-Reparatur und vor der Tool-Ausführung wiederhergestellt. Rohe JSON-Fragmente des Providers bleiben unverändert; Verbraucher sollten die strukturierte Teil-, End- oder Ergebnisnutzlast verwenden.

Legen Sie für CLIs, die providerspezifische JSONL-Ereignisse ausgeben, in der Konfiguration dieses Backends `jsonlDialect` fest: `claude-stream-json` für mit Claude Code kompatible Streams und `gemini-stream-json` für `stream-json`-Ereignisse der Gemini CLI.

## Zuständigkeit für native Compaction

Einige CLI-Backends führen einen Agenten aus, der sein eigenes Transkript komprimiert. Daher darf OpenClaw bei ihnen nicht seinen Sicherheits-Zusammenfasser ausführen — dies würde der backend-eigenen Compaction entgegenwirken und kann zum vollständigen Fehlschlagen des Durchlaufs führen.

`claude-cli` besitzt keinen Harness-Endpunkt (Claude Code führt Compaction intern durch), daher deklariert es `ownsNativeCompaction: true`, und der Compaction-Pfad von OpenClaw gibt den Sitzungseintrag unverändert zurück. Native Harness-Sitzungen wie Codex werden stattdessen weiterhin an ihren Harness-Compaction-Endpunkt weitergeleitet.

```typescript
api.registerCliBackend({ id: "my-cli", ownsNativeCompaction: true /* ... */ });
```

Deklarieren Sie `ownsNativeCompaction` nur für ein Backend, das tatsächlich für die Compaction zuständig ist: Es muss sein eigenes Transkript zuverlässig in der Nähe des Kontextfensters begrenzen und eine fortsetzbare Sitzung speichern (z. B. `--resume` / `--session-id`), da eine zurückgestellte Sitzung andernfalls das Budget weiterhin überschreiten kann.

## Gebündelte MCP-Overlays

CLI-Backends erhalten OpenClaw-Tool-Aufrufe nicht direkt, ein Backend kann jedoch mit `bundleMcp: true` ein generiertes MCP-Konfigurations-Overlay aktivieren. Aktuelles gebündeltes Verhalten:

- `claude-cli`: generierte strikte MCP-Konfigurationsdatei.
- `google-gemini-cli`: generierte Gemini-Systemeinstellungsdatei.

Wenn gebündeltes MCP aktiviert ist, führt OpenClaw Folgendes aus:

- startet einen Loopback-HTTP-MCP-Server, der der CLI Gateway-Tools bereitstellt und mit einer kontextbezogenen Berechtigung pro Durchlauf (`OPENCLAW_MCP_TOKEN`) authentifiziert wird, die nur für den aktuellen Ausführungsversuch aktiv ist;
- bindet den Tool-Zugriff an den vom Gateway ausgewählten Sitzungs-, Konto- und Kanalkontext, anstatt den Headern des untergeordneten Prozesses zu vertrauen;
- lädt aktivierte Bundle-MCP-Server für den aktuellen Workspace und führt sie mit der vorhandenen MCP-Konfigurations- oder Einstellungsstruktur des Backends zusammen;
- schreibt die Startkonfiguration anhand des Backend-eigenen Integrationsmodus aus dem zuständigen Plugin um.

Wenn keine MCP-Server aktiviert sind, fügt OpenClaw dennoch eine strikte Konfiguration ein, sofern ein Backend gebündeltes MCP aktiviert, damit Hintergrundausführungen isoliert bleiben.

Sitzungsbezogene gebündelte MCP-Laufzeiten werden zur Wiederverwendung innerhalb einer Sitzung zwischengespeichert und anschließend nach `mcp.sessionIdleTtlMs` Millisekunden Inaktivität beendet (Standardwert: 10 Minuten; setzen Sie `0`, um dies zu deaktivieren). Einmalige eingebettete Ausführungen wie Authentifizierungsprüfungen, Slug-Generierung und Active-Memory-Abrufe fordern am Ende des Durchlaufs eine Bereinigung an, damit untergeordnete stdio-Prozesse und streamfähige HTTP-/SSE-Streams den Durchlauf nicht überdauern.

## Obergrenze für die erneute Initialisierung des Verlaufs

Wenn eine neue CLI-Sitzung mit einem vorherigen OpenClaw-Transkript initialisiert wird (beispielsweise nach einem erneuten Versuch aufgrund von `session_expired`), wird der gerenderte `<conversation_history>`-Block begrenzt, damit Prompts zur erneuten Initialisierung nicht übermäßig anwachsen. Der Standardwert beträgt 12,288 Zeichen (etwa 3,000 Token).

Claude-CLI-Backends skalieren diese Obergrenze stattdessen anhand des ermittelten Claude-Kontextfensters: Größere Kontextfenster erhalten einen größeren Ausschnitt des vorherigen Verlaufs, bis zu einer festen Obergrenze; andere CLI-Backends behalten den konservativen Standardwert bei. Diese Obergrenze gilt nur für den Block des vorherigen Verlaufs im Prompt zur erneuten Initialisierung — die Ausgabelimits für aktive Sitzungen werden separat unter `reliability.outputLimits` abgestimmt (siehe [Sitzungen](#sessions)).

## Einschränkungen

- Keine direkten OpenClaw-Tool-Aufrufe: OpenClaw fügt keine Tool-Aufrufe in das CLI-Backend-Protokoll ein. Backends sehen Gateway-Tools nur, wenn sie `bundleMcp: true` aktivieren.
- Das Streaming ist backendabhängig: Einige Backends streamen JSONL, andere puffern bis zum Beenden.
- Strukturierte Ausgaben hängen vom eigenen JSON-Format der CLI ab.

## Fehlerbehebung

| Symptom                    | Lösung                                                                                     |
| -------------------------- | ------------------------------------------------------------------------------------------ |
| CLI nicht gefunden         | Setzen Sie `command` auf einen vollständigen Pfad.                                          |
| Falscher Modellname        | Verwenden Sie `modelAliases`, um `provider/model` der Modell-ID der CLI zuzuordnen.          |
| Keine Sitzungskontinuität  | Stellen Sie sicher, dass `sessionArg` festgelegt und `sessionMode` nicht `none` ist.         |
| Bilder werden ignoriert    | Legen Sie `imageArg` fest und prüfen Sie, ob die CLI Dateipfade unterstützt.                 |

## Verwandte Themen

- [Gateway-Betriebshandbuch](/de/gateway)
- [Lokale Modelle](/de/gateway/local-models)
