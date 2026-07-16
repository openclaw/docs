---
read_when:
    - Sie möchten einen zuverlässigen Fallback, wenn API-Provider ausfallen.
    - Sie führen lokale KI-CLIs aus und möchten sie wiederverwenden
    - Sie möchten die MCP-Loopback-Bridge für den Toolzugriff auf das CLI-Backend verstehen
summary: 'CLI-Backends: lokaler KI-CLI-Fallback mit optionaler MCP-Tool-Bridge'
title: CLI-Backends
x-i18n:
    generated_at: "2026-07-16T12:59:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ffeb19e582819f511212326da83381ba2c52e9f5743263f1ef9e0dc0fbbaf08e
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw kann eine lokale KI-CLI als reine Text-Ausweichlösung ausführen, wenn API-Provider ausgefallen, ratenbegrenzt oder fehlerhaft sind. Diese Funktion ist bewusst konservativ ausgelegt:

- OpenClaw-Tools werden nicht direkt eingebunden, aber ein Backend mit `bundleMcp: true` kann Gateway-Tools über eine Loopback-MCP-Bridge empfangen.
- JSONL-Streaming für CLIs, die es unterstützen.
- Sitzungen werden unterstützt, sodass nachfolgende Interaktionen zusammenhängend bleiben.
- Bilder werden weitergereicht, wenn die CLI Bildpfade akzeptiert.

Verwenden Sie diese Funktion als Sicherheitsnetz für Textantworten, die „immer funktionieren“ sollen, nicht als primären Pfad. Verwenden Sie stattdessen [ACP-Agenten](/de/tools/acp-agents), wenn Sie eine vollständige Harness-Laufzeit mit ACP-Sitzungssteuerung, Hintergrundaufgaben, Thread-/Konversationsbindung und dauerhaften externen Coding-Sitzungen benötigen; CLI-Backends sind kein ACP.

<Tip>
  Sie entwickeln ein neues Backend-Plugin? Weitere Informationen finden Sie unter [CLI-Backend-Plugins](/de/plugins/cli-backend-plugins). Diese Seite behandelt die Konfiguration und den Betrieb eines bereits registrierten Backends.
</Tip>

## Schnellstart

Das gebündelte Anthropic-Plugin registriert ein standardmäßiges `claude-cli`-Backend. Daher funktioniert es ohne weitere Konfiguration, sofern Claude Code installiert und angemeldet ist:

```bash
openclaw agent --agent main --message "hi" --model claude-cli/claude-sonnet-4-6
```

`main` ist die standardmäßige Agenten-ID, wenn keine explizite Agentenliste konfiguriert ist; verwenden Sie andernfalls Ihre eigene Agenten-ID.

Wenn das Gateway unter launchd/systemd mit einem minimalen `PATH` ausgeführt wird, geben Sie das Binärprogramm explizit an:

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

## Verwendung als Ausweichlösung

Fügen Sie das CLI-Backend Ihrer Ausweichliste hinzu, damit es nur ausgeführt wird, wenn die primären Modelle fehlschlagen:

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

Wenn Sie `agents.defaults.models` als Zulassungsliste verwenden, nehmen Sie dort auch Ihre CLI-Backend-Modelle auf. Wenn der primäre Provider fehlschlägt (Authentifizierung, Ratenbegrenzungen, Zeitüberschreitungen), versucht OpenClaw als Nächstes das CLI-Backend.

## Konfiguration

Alle CLI-Backends befinden sich unter `agents.defaults.cliBackends` und sind nach Provider-ID verschlüsselt (z. B. `claude-cli`, `my-cli`). Die Provider-ID bildet die linke Seite der Modellreferenz: `<provider>/<model>`.

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
          // der Compaction aus dem begrenzten OpenClaw-Rohtranskript neu initialisieren darf.
          reseedFromRawTranscriptWhenUncompacted: true,
          serialize: true,
        },
      },
    },
  },
}
```

## Funktionsweise

1. Wählt ein Backend anhand des Provider-Präfixes aus (`claude-cli/...`).
2. Erstellt einen System-Prompt unter Verwendung desselben OpenClaw-Prompts und Workspace-Kontexts.
3. Führt die CLI mit einer Sitzungs-ID aus (sofern unterstützt), damit der Verlauf konsistent bleibt. Das gebündelte `claude-cli`-Backend hält für jede OpenClaw-Sitzung einen Claude-stdio-Prozess aktiv und sendet nachfolgende Interaktionen über stream-json-stdin.
4. Analysiert die Ausgabe (JSON oder Klartext) und gibt den endgültigen Text zurück.
5. Speichert Sitzungs-IDs pro Backend, damit nachfolgende Interaktionen dieselbe CLI-Sitzung wiederverwenden.

### Besonderheiten der Claude CLI

Das gebündelte `claude-cli`-Backend bevorzugt die native Skill-Auflösung von Claude Code. Wenn der aktuelle Skills-Snapshot mindestens einen ausgewählten Skill mit einem materialisierten Pfad enthält, übergibt OpenClaw über `--plugin-dir` ein temporäres Claude-Code-Plugin und lässt den doppelten OpenClaw-Skills-Katalog im angehängten System-Prompt weg. Ohne materialisierten Plugin-Skill behält OpenClaw den Prompt-Katalog als Ausweichlösung bei. Überschreibungen von Skill-Umgebungsvariablen/API-Schlüsseln gelten weiterhin für die Umgebung des untergeordneten Prozesses während der Ausführung.

Claude CLI verfügt über einen eigenen nicht interaktiven Berechtigungsmodus; OpenClaw ordnet diesen der vorhandenen Ausführungsrichtlinie zu, statt eine Claude-spezifische Konfiguration hinzuzufügen. Für von OpenClaw verwaltete aktive Claude-Sitzungen ist die effektive Ausführungsrichtlinie maßgeblich: YOLO (`tools.exec.security: "full"` und `tools.exec.ask: "off"`) startet Claude normalerweise mit `--permission-mode bypassPermissions`, während eine restriktive Richtlinie es mit `--permission-mode default` startet. Als Root ausgeführte Gateways verwenden ebenfalls `default`, da Claude Code den Umgehungsmodus für Root ablehnt; OpenClaw beantwortet Claudes stdio-Anfragen zur Tool-Steuerung weiterhin gemäß der konfigurierten Ausführungsrichtlinie. Agentenspezifische `agents.list[].tools.exec`-Einstellungen überschreiben die globalen `tools.exec`-Einstellungen für den jeweiligen Agenten. Rohe Backend-Argumente können weiterhin `--permission-mode` enthalten, aber aktive Claude-Starts normalisieren dieses Flag entsprechend der effektiven Richtlinie und Host-Einschränkung.

Das Backend ordnet außerdem die OpenClaw-`/think`-Stufen dem nativen `--effort`-Flag von Claude Code zu: `minimal`/`low` -> `low`, `medium` -> `medium`, und `high`/`xhigh`/`max` werden direkt weitergereicht. Dadurch bleiben die unterstützten Fable-5-Aufwandsstufen für abonnementgestützte Claude-CLI- und API-Schlüssel-Routen identisch. `adaptive` entfernt konfigurierte `--effort`-Flags und stellt keinen Ersatz bereit, sodass Claude Code den effektiven Aufwand anhand seiner eigenen Umgebung, Einstellungen und Modellstandardwerte bestimmt. Bei anderen CLI-Backends muss das jeweils zuständige Plugin eine entsprechende Zuordnung der argv-Argumente deklarieren, bevor sich `/think` auf die gestartete CLI auswirkt.

Bevor OpenClaw `claude-cli` verwenden kann, muss Claude Code selbst auf demselben Host angemeldet sein:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Bei Docker-Installationen muss Claude Code im persistenten Home-Verzeichnis des Containers installiert und angemeldet sein, nicht nur auf dem Host; siehe [Claude-CLI-Backend in Docker](/de/install/docker#claude-cli-backend-in-docker).

Legen Sie `agents.defaults.cliBackends.claude-cli.command` nur fest, wenn sich das Binärprogramm `claude` nicht bereits in `PATH` befindet.

## Sitzungen

- Wenn die CLI Sitzungen unterstützt, legen Sie `sessionArg` (z. B. `--session-id`) oder `sessionArgs` (Platzhalter `{sessionId}`) fest, wenn die ID in mehreren Flags angegeben werden muss.
- Wenn die CLI einen Wiederaufnahme-Unterbefehl mit anderen Flags verwendet, legen Sie `resumeArgs` (ersetzt bei der Wiederaufnahme `args`) und optional `resumeOutput` für Nicht-JSON-Wiederaufnahmen fest.
- `sessionMode`:
  - `always`: Sendet immer eine Sitzungs-ID (eine neue UUID, falls keine gespeichert ist).
  - `existing`: Sendet eine Sitzungs-ID nur, wenn zuvor eine gespeichert wurde.
  - `none`: Sendet niemals eine Sitzungs-ID.
- `claude-cli` verwendet standardmäßig `liveSession: "claude-stdio"`, `output: "jsonl"` und `input: "stdin"`, sodass nachfolgende Interaktionen den aktiven Claude-Prozess wiederverwenden, solange er aktiv ist. Dies gilt auch für benutzerdefinierte Konfigurationen, in denen Transportfelder fehlen. Wenn das Gateway neu gestartet wird oder der inaktive Prozess beendet wird, setzt OpenClaw die Sitzung anhand der gespeicherten Claude-Sitzungs-ID fort. Gespeicherte Sitzungs-IDs werden vor der Wiederaufnahme anhand eines lesbaren Projekttranskripts überprüft; bei einem fehlenden Transkript wird die Bindung aufgehoben (protokolliert als `reason=transcript-missing`), statt unbemerkt eine neue Sitzung unter `--resume` zu starten.
- Aktive Claude-Sitzungen behalten begrenzte Schutzmechanismen für JSONL-Ausgaben bei: standardmäßig 8 MiB und 20,000 JSONL-Rohzeilen pro Interaktion. Erhöhen Sie diese Werte je Backend mit `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars` und `maxTurnLines`; OpenClaw begrenzt diese Einstellungen auf 64 MiB und 100,000 Zeilen.
- Gespeicherte CLI-Sitzungen stellen eine Provider-eigene Kontinuität dar. Die implizite tägliche Sitzungszurücksetzung unterbricht sie nicht; `/reset` und explizite `session.reset`-Richtlinien tun dies weiterhin.
- Neue CLI-Sitzungen werden normalerweise nur anhand der Compaction-Zusammenfassung von OpenClaw und des Abschnitts nach der Compaction neu initialisiert. Zur Wiederherstellung kurzer Sitzungen, die vor der Compaction ungültig wurden, kann ein Backend dies mit `reseedFromRawTranscriptWhenUncompacted: true` aktivieren. Die Neuinitialisierung aus dem Rohtranskript bleibt begrenzt und auf sichere Ungültigkeitsfälle beschränkt, etwa ein fehlendes CLI-Transkript, ein verwaister Tool-Nutzungsabschnitt, Änderungen an Nachrichtenrichtlinie/System-Prompt/cwd/MCP oder ein Wiederholungsversuch nach Sitzungsablauf; Änderungen am Authentifizierungsprofil oder an der Anmeldedaten-Epoche führen niemals zu einer Neuinitialisierung aus dem Rohtranskriptverlauf.

Serialisierung: `serialize: true` hält Ausführungen in derselben Lane geordnet (die meisten CLIs serialisieren auf einer Provider-Lane). OpenClaw verwirft außerdem die Wiederverwendung gespeicherter CLI-Sitzungen, wenn sich die ausgewählte Authentifizierungsidentität ändert. Dies umfasst eine geänderte Authentifizierungsprofil-ID, einen statischen API-Schlüssel, ein statisches Token oder die OAuth-Kontoidentität, sofern die CLI eine solche bereitstellt; die alleinige Rotation von OAuth-Zugriffs-/Aktualisierungstokens unterbricht die Sitzung nicht. Wenn eine CLI keine stabile OAuth-Konto-ID besitzt, überlässt OpenClaw dieser CLI die Durchsetzung ihrer eigenen Berechtigungen zur Wiederaufnahme.

## Ausweichpräambel aus claude-cli-Sitzungen

Wenn ein `claude-cli`-Versuch auf einen Nicht-CLI-Kandidaten in [`agents.defaults.model.fallbacks`](/de/concepts/model-failover) ausweicht, initialisiert OpenClaw den nächsten Versuch mit einer Kontextpräambel, die aus dem lokalen JSONL-Transkript von Claude Code gewonnen wurde (unter `~/.claude/projects/`, nach Workspace verschlüsselt). Ohne diese Initialisierung beginnt der Ausweich-Provider ohne Kontext, da das OpenClaw-eigene Sitzungstranskript für `claude-cli`-Ausführungen leer ist.

- Die Präambel bevorzugt die neueste `/compact`-Zusammenfassung oder `compact_boundary`-Markierung und hängt anschließend die neuesten Interaktionen nach der Begrenzung bis zu einem Zeichenbudget an. Interaktionen vor der Begrenzung werden verworfen, da die Zusammenfassung sie bereits repräsentiert.
- Tool-Blöcke werden zu kompakten `(tool call: name)`- und `(tool result: …)`-Hinweisen zusammengeführt, um das Prompt-Budget korrekt abzubilden; eine zu große Zusammenfassung wird gekürzt und mit `(truncated)` gekennzeichnet.
- Provider-interne Ausweichvorgänge von `claude-cli` zu `claude-cli` verwenden Claudes eigenes `--resume` und überspringen die Präambel.
- Die Initialisierung verwendet die vorhandene Validierung des Claude-Sitzungsdateipfads erneut, sodass keine beliebigen Pfade gelesen werden können.

## Bilder

Wenn Ihre CLI Bildpfade akzeptiert, legen Sie `imageArg` fest:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw schreibt Base64-Bilder in temporäre Dateien. Wenn `imageArg` festgelegt ist, werden diese Pfade als CLI-Argumente übergeben; andernfalls hängt OpenClaw die Dateipfade an den Prompt an (Pfadinjektion). Dies funktioniert bei CLIs, die lokale Dateien automatisch über Klartextpfade laden.

## Ein- und Ausgaben

- `output: "text"` (Standard) behandelt stdout als endgültige Antwort.
- `output: "json"` versucht, JSON zu analysieren und Text sowie eine Sitzungs-ID zu extrahieren.
- `output: "jsonl"` analysiert einen JSONL-Stream und extrahiert die endgültige Agentennachricht sowie vorhandene Sitzungskennungen.
- Bei der JSON-Ausgabe der Gemini CLI liest OpenClaw den Antworttext aus `response` und die Nutzung aus `stats`, wenn `usage` fehlt oder leer ist. Der gebündelte Standard der Gemini CLI verwendet `stream-json`; alte `--output-format json`-Überschreibungen verwenden weiterhin den JSON-Parser.

Eingabemodi:

- `input: "arg"` (Standard) übergibt den Prompt als letztes CLI-Argument.
- `input: "stdin"` sendet den Prompt über stdin.
- Wenn der Prompt sehr lang und `maxPromptArgChars` festgelegt ist, wird stattdessen stdin verwendet.

## Plugin-eigene Standardwerte

Die Standardwerte des CLI-Backends sind Teil der Plugin-Oberfläche:

- Plugins registrieren sie mit `api.registerCliBackend(...)`.
- Die Backend-`id` wird zum Provider-Präfix in Modellreferenzen.
- Die Benutzerkonfiguration in `agents.defaults.cliBackends.<id>` überschreibt weiterhin den Plugin-Standardwert.
- Die Backend-spezifische Konfigurationsbereinigung bleibt über den optionalen Hook `normalizeConfig` in der Verantwortung des Plugins.

Anthropic ist für `claude-cli` zuständig und Google für `google-gemini-cli`. OpenAI-Codex-Agentenläufe verwenden über `openai/*` das Codex-App-Server-Harness; OpenClaw registriert kein gebündeltes `codex-cli`-Backend mehr.

Das gebündelte Anthropic-Plugin registriert für `claude-cli`:

| Schlüssel              | Wert                                                                                                                                                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
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

Das gebündelte Google-Plugin registriert für `google-gemini-cli`:

| Schlüssel                  | Wert                                                                                   |
| -------------------------- | -------------------------------------------------------------------------------------- |
| `command`                 | `gemini`                                                                               |
| `args`                    | `--skip-trust --approval-mode auto_edit --output-format stream-json --prompt {prompt}` |
| `resumeArgs`              | identisch, mit `--resume {sessionId}`                                               |
| `output` / `resumeOutput` | `jsonl`                                                                                |
| `jsonlDialect`            | `gemini-stream-json`                                                                   |
| `imageArg`                | `@`                                                                                    |
| `imagePathScope`          | `workspace`                                                                            |
| `modelArg`                | `--model`                                                                              |
| `sessionMode`             | `existing`                                                                             |
| `sessionIdFields`         | `["session_id", "sessionId"]`                                                          |

Voraussetzung: Die lokale Gemini CLI muss installiert und unter `PATH` als `gemini` verfügbar sein (`brew install gemini-cli` oder `npm install -g @google/gemini-cli`).

Hinweise zur Ausgabe der Gemini CLI:

- Der standardmäßige `stream-json`-Parser liest `message`-Ereignisse des Assistenten, Werkzeugereignisse, die abschließende `result`-Nutzung und schwerwiegende Gemini-Fehlerereignisse.
- Wenn Sie die Gemini-Argumente mit `--output-format json` überschreiben, normalisiert OpenClaw dieses Backend zurück auf `output: "json"` und liest den Antworttext aus dem JSON-Feld `response`.
- Die Nutzung greift auf `stats` zurück, wenn `usage` fehlt oder leer ist; `stats.cached` wird in OpenClaw-`cacheRead` normalisiert, und wenn `stats.input` fehlt, werden die Eingabe-Token aus `stats.input_tokens - stats.cached` abgeleitet.

Überschreiben Sie Standardwerte nur bei Bedarf (meistens einen absoluten `command`-Pfad).

## Overlays für Texttransformationen

Plugins, die kleine Kompatibilitäts-Shims für Prompts oder Nachrichten benötigen, können bidirektionale Texttransformationen deklarieren, ohne einen Provider oder ein CLI-Backend zu ersetzen:

```typescript
api.registerTextTransforms({
  input: [{ from: /red basket/g, to: "blue basket" }],
  output: [{ from: /blue basket/g, to: "red basket" }],
});
```

`input` schreibt den System-Prompt und den an die CLI übergebenen Benutzer-Prompt um. `output` schreibt gestreamten Assistententext und geparsten Abschlusstext um, bevor OpenClaw seine eigenen Steuerungsmarkierungen und die Kanalauslieferung verarbeitet; bei Provider-gestützten Modellaufrufen stellt es außerdem Zeichenkettenwerte innerhalb strukturierter Werkzeugaufrufargumente nach der Stream-Reparatur und vor der Werkzeugausführung wieder her. Unverarbeitete Provider-JSON-Fragmente bleiben unverändert; Verbraucher sollten die strukturierte Teil-, Abschluss- oder Ergebnisnutzlast verwenden.

Legen Sie für CLIs, die Provider-spezifische JSONL-Ereignisse ausgeben, `jsonlDialect` in der Konfiguration dieses Backends fest: `claude-stream-json` für Claude-Code-kompatible Streams, `gemini-stream-json` für Gemini-CLI-`stream-json`-Ereignisse.

## Verantwortung für native Compaction

Einige CLI-Backends führen einen Agenten aus, der sein eigenes Transkript komprimiert. Daher darf OpenClaw seinen Schutz-Zusammenfasser nicht auf sie anwenden – andernfalls gerät dieser mit der Backend-eigenen Compaction in Konflikt und kann den Durchlauf mit einem harten Fehler abbrechen.

`claude-cli` verfügt über keinen Harness-Endpunkt (Claude Code führt Compaction intern aus), daher deklariert es `ownsNativeCompaction: true`, und der Compaction-Pfad von OpenClaw gibt den Sitzungseintrag unverändert zurück. OpenClaw übergibt das effektive Kontextbudget des Laufs über die dokumentierte [`CLAUDE_CODE_AUTO_COMPACT_WINDOW`](https://code.claude.com/docs/en/env-vars) von Claude Code, sodass die native automatische Compaction mit den konfigurierten Anthropic-`contextTokens`-Grenzwerten übereinstimmt. Sitzungen mit nativem Harness wie Codex werden stattdessen weiterhin an den Compaction-Endpunkt ihres Harness weitergeleitet.

```typescript
api.registerCliBackend({ id: "my-cli", ownsNativeCompaction: true /* ... */ });
```

Deklarieren Sie `ownsNativeCompaction` nur für ein Backend, das tatsächlich für Compaction zuständig ist: Es muss sein eigenes Transkript zuverlässig in der Nähe des Kontextfensters begrenzen und eine fortsetzbare Sitzung beibehalten (z. B. `--resume` / `--session-id`); andernfalls kann eine zurückgestellte Sitzung das Budget weiterhin überschreiten.

## Overlays für gebündeltes MCP

CLI-Backends empfangen OpenClaw-Werkzeugaufrufe nicht direkt, ein Backend kann sich jedoch mit `bundleMcp: true` für ein generiertes MCP-Konfigurations-Overlay entscheiden. Aktuelles gebündeltes Verhalten:

- `claude-cli`: generierte strikte MCP-Konfigurationsdatei.
- `google-gemini-cli`: generierte Gemini-Systemeinstellungsdatei.

Wenn gebündeltes MCP aktiviert ist, führt OpenClaw Folgendes aus:

- startet einen Loopback-HTTP-MCP-Server, der der CLI Tools des Gateways bereitstellt und mit einer nur für den aktuellen Ausführungsversuch aktiven, laufbezogenen Kontextberechtigung (`OPENCLAW_MCP_TOKEN`) authentifiziert wird;
- bindet den Werkzeugzugriff an die vom Gateway ausgewählte Sitzung sowie den Konto- und Kanalkontext, statt den Headern des untergeordneten Prozesses zu vertrauen;
- lädt aktivierte Bundle-MCP-Server für den aktuellen Arbeitsbereich und führt sie mit einer vorhandenen MCP-Konfigurations- oder Einstellungsstruktur des Backends zusammen;
- schreibt die Startkonfiguration entsprechend dem Backend-eigenen Integrationsmodus des verantwortlichen Plugins um.

Wenn keine MCP-Server aktiviert sind, fügt OpenClaw dennoch eine strikte Konfiguration ein, sofern ein Backend gebündeltes MCP aktiviert hat, damit Hintergrundläufe isoliert bleiben.

Sitzungsgebundene gebündelte MCP-Laufzeitumgebungen werden zur Wiederverwendung innerhalb einer Sitzung zwischengespeichert und anschließend nach `mcp.sessionIdleTtlMs` Millisekunden Inaktivität beendet (standardmäßig 10 Minuten; zum Deaktivieren `0` festlegen). Einmalige eingebettete Läufe wie Authentifizierungsprüfungen, Slug-Erzeugung und Active-Memory-Abrufe fordern am Laufende eine Bereinigung an, damit stdio-Unterprozesse und streamfähige HTTP-/SSE-Streams den Lauf nicht überdauern.

## Obergrenze für den Verlauf beim erneuten Initialisieren

Wenn eine neue CLI-Sitzung aus einem vorherigen OpenClaw-Transkript initialisiert wird (beispielsweise nach einem `session_expired`-Wiederholungsversuch), wird der gerenderte `<conversation_history>`-Block begrenzt, damit Prompts zur erneuten Initialisierung nicht ausufern. Der Standardwert beträgt 12,288 Zeichen (etwa 3,000 Token).

Claude-CLI-Backends skalieren diese Obergrenze stattdessen anhand des aufgelösten Claude-Kontextfensters: Größere Kontextfenster erhalten bis zu einer festen Obergrenze einen größeren Ausschnitt des vorherigen Verlaufs; andere CLI-Backends behalten den konservativen Standardwert bei. Diese Obergrenze gilt nur für den Block mit dem vorherigen Verlauf im Prompt zur erneuten Initialisierung – die Ausgabelimits aktiver Sitzungen werden separat unter `reliability.outputLimits` abgestimmt (siehe [Sitzungen](#sessions)).

## Einschränkungen

- Keine direkten OpenClaw-Werkzeugaufrufe: OpenClaw fügt keine Werkzeugaufrufe in das CLI-Backend-Protokoll ein. Backends sehen Gateway-Tools nur, wenn sie `bundleMcp: true` aktivieren.
- Das Streaming ist Backend-spezifisch: Einige Backends streamen JSONL, andere puffern bis zum Beenden.
- Strukturierte Ausgaben hängen vom eigenen JSON-Format der CLI ab.

## Fehlerbehebung

| Symptom                   | Lösung                                                                                   |
| ------------------------- | ---------------------------------------------------------------------------------------- |
| CLI nicht gefunden        | Legen Sie `command` auf einen vollständigen Pfad fest.                          |
| Falscher Modellname       | Verwenden Sie `modelAliases`, um `provider/model` der Modell-ID der CLI zuzuordnen. |
| Keine Sitzungskontinuität | Stellen Sie sicher, dass `sessionArg` festgelegt und `sessionMode` nicht `none` ist. |
| Bilder werden ignoriert   | Legen Sie `imageArg` fest und prüfen Sie, ob die CLI Dateipfade unterstützt.      |

## Verwandte Themen

- [Gateway-Betriebshandbuch](/de/gateway)
- [Lokale Modelle](/de/gateway/local-models)
