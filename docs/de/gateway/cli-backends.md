---
read_when:
    - Sie wünschen eine zuverlässige Ausweichlösung, wenn API-Provider ausfallen
    - Sie führen lokale KI-CLIs aus und möchten sie wiederverwenden
    - Sie möchten die MCP-Loopback-Bridge für den Tool-Zugriff auf das CLI-Backend verstehen
summary: 'CLI-Backends: lokaler KI-CLI-Fallback mit optionaler MCP-Tool-Bridge'
title: CLI-Backends
x-i18n:
    generated_at: "2026-07-24T03:48:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: de685518b63aed107b2741d466e0e0eb0590c316b8ed0e1f204c54d0847f017d
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw kann eine lokale KI-CLI als reine Text-Ausweichlösung ausführen, wenn API-Provider ausgefallen oder ratenbegrenzt sind oder sich fehlerhaft verhalten. Dies ist bewusst konservativ ausgelegt:

- OpenClaw-Tools werden nicht direkt injiziert, aber ein Backend mit `bundleMcp: true` kann Gateway-Tools über eine Loopback-MCP-Bridge empfangen.
- JSONL-Streaming für CLIs, die es unterstützen.
- Sitzungen werden unterstützt, sodass aufeinanderfolgende Interaktionen kohärent bleiben.
- Bilder werden durchgereicht, wenn die CLI Bildpfade akzeptiert.

Verwenden Sie dies als Sicherheitsnetz für Textantworten, die „immer funktionieren“ sollen, nicht als primären Pfad. Für eine vollständige Harness-Laufzeit mit ACP-Sitzungssteuerung, Hintergrundaufgaben, Thread-/Konversationsbindung und dauerhaften externen Coding-Sitzungen verwenden Sie stattdessen [ACP-Agenten](/de/tools/acp-agents); CLI-Backends sind kein ACP.

<Tip>
  Sie entwickeln ein neues Backend-Plugin? Siehe [CLI-Backend-Plugins](/de/plugins/cli-backend-plugins). Diese Seite behandelt die Konfiguration und den Betrieb eines bereits registrierten Backends.
</Tip>

## Schnellstart

Das gebündelte Anthropic-Plugin registriert ein standardmäßiges `claude-cli`-Backend. Daher funktioniert es ohne weitere Konfiguration, sofern Claude Code installiert ist und eine Anmeldung besteht:

```bash
openclaw agent --agent main --message "hi" --model claude-cli/claude-sonnet-4-6
```

`main` ist die standardmäßige Agenten-ID, wenn keine explizite Agentenliste konfiguriert ist; verwenden Sie andernfalls Ihre eigene Agenten-ID.

Der Gateway-Dienst muss die CLI in seinem `PATH` haben. Wenn eine Bereitstellung einen
nicht standardmäßigen Pfad zur ausführbaren Datei oder nicht standardmäßige Argumente benötigt, registrieren Sie diesen Adapter stattdessen in einem
[CLI-Backend-Plugin](/de/plugins/cli-backend-plugins), anstatt die Startlogik
in `openclaw.json` abzulegen.

OpenClaw lädt automatisch das zuständige gebündelte Plugin, wenn die Modellauswahl oder eine
modellspezifische `agentRuntime.id` auf dessen Backend verweist.

## Verwendung als Fallback

Fügen Sie das CLI-Backend Ihrer Fallback-Liste hinzu, damit es nur ausgeführt wird, wenn die primären Modelle fehlschlagen:

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

Konfigurierte Fallbacks bleiben verfügbar, wenn der primäre Provider fehlschlägt (Authentifizierung, Ratenbegrenzungen, Zeitüberschreitungen), selbst wenn sie nicht in `agents.defaults.modelPolicy.allow` enthalten sind. Fügen Sie dieser Richtlinie ein CLI-Backend-Modell nur hinzu, wenn Benutzer es auch direkt über `/model`, eine Sitzungsüberschreibung oder `--model` auswählen können sollen. `agents.defaults.models` verwaltet lediglich modellspezifische Aliasse, Parameter und Metadaten.

## Konfiguration

Benutzer wählen ein registriertes Backend über die Modell- und Laufzeitrichtlinie aus. Behalten Sie
die kanonische Modellreferenz bei und wählen Sie die CLI-Laufzeit pro Modell aus:

```json5
{
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-8",
      models: {
        "anthropic/claude-opus-4-8": {
          agentRuntime: { id: "claude-cli" },
        },
      },
    },
  },
}
```

Anmeldedaten verbleiben in den OpenClaw-Authentifizierungsprofilen oder in der Konfiguration des zuständigen Plugins.
Befehl, Argumentvektor, Umgebung, Parsing, Sitzung, Bilder und Watchdog-Mechanismen sind
Plugin-Code, der mit `api.registerCliBackend(...)` registriert wird.

## Funktionsweise

1. Wählt ein Backend anhand des Provider-Präfixes (`claude-cli/...`) aus.
2. Erstellt einen System-Prompt mit demselben OpenClaw-Prompt und Workspace-Kontext.
3. Führt die CLI mit einer Sitzungs-ID aus (sofern unterstützt), damit der Verlauf konsistent bleibt. Das gebündelte `claude-cli`-Backend hält pro OpenClaw-Sitzung einen Claude-stdio-Prozess aktiv und sendet Folgeinteraktionen über stream-json-stdin.
4. Parst die Ausgabe (JSON oder Klartext) und gibt den endgültigen Text zurück.
5. Speichert Sitzungs-IDs pro Backend dauerhaft, damit Folgeinteraktionen dieselbe CLI-Sitzung wiederverwenden.

## Zeitüberschreitungen und lang laufende Arbeiten

CLI-Backends haben zwei unabhängige Begrenzungen:

- `agents.defaults.timeoutSeconds` begrenzt die gesamte Agenteninteraktion. Normale Gateway-Interaktionen übernehmen den Standardwert von 48 Stunden; `0` hebt die zeitliche Begrenzung der Interaktion auf. Eine gespeicherte Überschreibung wie `600` ersetzt diesen Standardwert.
- Der Watchdog für ausbleibende CLI-Ausgaben beendet einen Unterprozess, der keine Ausgabe erzeugt. Jedes Backend-Plugin verwaltet separate Profile für neue und fortgesetzte Sitzungen, und der Watchdog bleibt auch dann aktiv, wenn die Gesamtzeit der Interaktion unbegrenzt ist.

Entfernen Sie eine kurze Überschreibung der Gesamtzeitüberschreitung, um zum Standardwert von 48 Stunden zurückzukehren, oder legen Sie ein explizites Zeitbudget von beispielsweise 12 Stunden fest:

```bash
# Zum Standardwert von 48 Stunden zurückkehren:
openclaw config unset agents.defaults.timeoutSeconds

# Oder eine explizite Begrenzung von 12 Stunden wählen:
openclaw config set agents.defaults.timeoutSeconds 43200
```

Innerhalb einer CLI gestartete Hintergrundarbeit bleibt Teil dieses CLI-Unterprozesses. Wenn die übergeordnete Interaktion ihre Gesamtzeitbegrenzung erreicht, beendet OpenClaw den Unterprozess und gleichzeitig dessen CLI-interne Hintergrundaufgaben. Verwenden Sie für dauerhafte, lang laufende Arbeiten einen abgetrennten OpenClaw-[Sub-Agenten](/de/tools/subagents) oder [ACP-Agenten](/de/tools/acp-agents); abgetrennte Sub-Agenten haben standardmäßig keine Laufzeitbegrenzung.

Der Befehl `openclaw agent` hat außerdem eine eigene Anfragefrist. Dessen Fallback-Standardwert von 600 Sekunden gilt für diesen Befehlsaufruf, nicht für normale Gateway-Interaktionen; siehe [`openclaw agent`](/de/cli/agent).

### Besonderheiten der Claude-CLI

Das gebündelte `claude-cli`-Backend bevorzugt die native Skill-Auflösung von Claude Code. Wenn der aktuelle Skills-Snapshot mindestens einen ausgewählten Skill mit einem materialisierten Pfad enthält, übergibt OpenClaw über `--plugin-dir` ein temporäres Claude-Code-Plugin und lässt den doppelten OpenClaw-Skills-Katalog im angehängten System-Prompt weg. Ohne einen materialisierten Plugin-Skill behält OpenClaw den Prompt-Katalog als Fallback bei. Überschreibungen von Skill-Umgebungsvariablen und API-Schlüsseln gelten für die Ausführung weiterhin in der Umgebung des Kindprozesses.

Die Claude-CLI verfügt über einen eigenen nicht interaktiven Berechtigungsmodus; OpenClaw ordnet diesen der bestehenden Ausführungsrichtlinie zu, anstatt Claude-spezifische Konfiguration hinzuzufügen. Bei von OpenClaw verwalteten aktiven Claude-Sitzungen ist die effektive Ausführungsrichtlinie maßgeblich: YOLO (`tools.exec.mode: "full"`) startet Claude normalerweise mit `--permission-mode bypassPermissions`, während eine restriktive Richtlinie es mit `--permission-mode default` startet. Als Root ausgeführte Gateways verwenden ebenfalls `default`, da Claude Code den Umgehungsmodus für Root ablehnt. Agentenspezifische Einstellungen unter `agents.entries.*.tools.exec` überschreiben für diesen Agenten die globalen Einstellungen unter `tools.exec`. Das Anthropic-Plugin normalisiert Claudes Berechtigungsflags entsprechend der effektiven Richtlinie und der Hostbeschränkung.

Unter einer restriktiven Richtlinie fragt Claude OpenClaw über stdio um Erlaubnis, bevor es eines seiner nativen oder Erweiterungstools verwendet (seine eigenen Bash-, WebFetch- oder Claude-in-Chrome-Browsertools). Wenn die effektive Rückfrageeinstellung für die Ausführung `on-miss` oder `always` lautet, leitet OpenClaw jede Anfrage als interaktive Genehmigung an den Kanal der Sitzung weiter: **Allow once** erlaubt den einzelnen Aufruf, **Allow always** erlaubt diesen Toolnamen für den Rest der aktiven Claude-Sitzung (nur im Arbeitsspeicher, niemals dauerhaft gespeichert), und **Deny**, eine Zeitüberschreitung oder ein nicht erreichbarer Genehmigungspfad lehnen den Aufruf jeweils ab. Richtlinien, die niemals nachfragen, behalten ihr bisheriges Verhalten bei: `security: "deny"` lehnt jede Anfrage ab, und die Rückfrageeinstellung `off` mit weniger als vollständiger Sicherheit (Ausführungsmodus `allowlist`) lehnt ohne Rückfrage ab.

### Claude-Browsertools und Anmeldung mit 1Password

Claude Code kann über die Erweiterung [Claude in Chrome](https://code.claude.com/docs/en/chrome) einen Chrome-Browser steuern, einschließlich des automatischen Ausfüllens von Anmeldedaten durch [1Password für Claude](/de/gateway/1password#browser-sign-in-with-1password-for-claude). Das gebündelte Backend aktiviert diese Funktion nicht; registrieren Sie ein [CLI-Backend-Plugin](/de/plugins/cli-backend-plugins), das `--chrome` an die Startargumente eines Backends mit `claude-stream-json`-Dialekt anhängt. OpenClaw behält ein konfiguriertes `--chrome` bei normalen Ausführungen bei und erzwingt bei Ausführungen mit einer eingeschränkten Tool-Richtlinie, etwa bei Nebenfragen, stets `--no-chrome`. Das Chrome-Fenster, die Erweiterung und alle Genehmigungsaufforderungen von 1Password befinden sich auf dem Gateway-Host. Daher muss sich jemand an diesem Rechner befinden, um die Verwendung von Anmeldedaten zu genehmigen.

Das Backend ordnet außerdem die OpenClaw-Stufen `/think` dem nativen Claude-Code-Flag `--effort` zu: `minimal`/`low` -> `low`, `medium` -> `medium`, und `high`/`xhigh`/`max` werden direkt durchgereicht. Dadurch bleiben die unterstützten Fable-5-Aufwandsstufen für die abonnementgestützte Claude-CLI und API-Schlüssel-Routen identisch. `adaptive` entfernt konfigurierte `--effort`-Flags und stellt keinen Ersatz bereit, sodass Claude Code den effektiven Aufwand anhand seiner eigenen Umgebung, Einstellungen und Modellstandardwerte bestimmt. Bei anderen CLI-Backends muss das zuständige Plugin einen entsprechenden Argumentvektor-Mapper deklarieren, bevor `/think` die gestartete CLI beeinflusst.

Bevor OpenClaw `claude-cli` verwenden kann, muss Claude Code selbst auf demselben Host angemeldet sein:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Bei Docker-Installationen muss Claude Code innerhalb des persistenten Container-Home-Verzeichnisses installiert und angemeldet sein, nicht nur auf dem Host; siehe [Claude-CLI-Backend in Docker](/de/install/docker#claude-cli-backend-in-docker).

Der Gateway-Dienst muss `claude` über `PATH` auflösen können. Registrieren Sie für einen nicht standardmäßigen Pfad
ein kleines Wrapper-Backend-Plugin.

## Sitzungen

- Wenn die CLI Sitzungen unterstützt, legen Sie `sessionArgs` mit einem `{sessionId}`-Platzhalter fest (zum Beispiel `["--session-id", "{sessionId}"]`).
- Wenn die CLI einen Fortsetzungs-Unterbefehl mit anderen Flags verwendet, legen Sie `resumeArgs` fest (ersetzt beim Fortsetzen `args`) und optional `resumeOutput` für Fortsetzungen ohne JSON.
- `sessionMode`:
  - `always`: Sendet immer eine Sitzungs-ID (eine neue UUID, wenn keine gespeichert ist).
  - `existing`: Sendet eine Sitzungs-ID nur, wenn zuvor eine gespeichert wurde.
  - `none`: Sendet niemals eine Sitzungs-ID.
- `claude-cli` verwendet standardmäßig `liveSession: "claude-stdio"`, `output: "jsonl"` und `input: "stdin"`, sodass Folgeinteraktionen den aktiven Claude-Prozess wiederverwenden, solange er läuft. Dies gilt auch für benutzerdefinierte Konfigurationen, in denen Transportfelder fehlen. Wenn das Gateway neu gestartet wird oder der inaktive Prozess beendet wird, setzt OpenClaw die Sitzung anhand der gespeicherten Claude-Sitzungs-ID fort. Gespeicherte Sitzungs-IDs werden vor dem Fortsetzen anhand eines lesbaren Projekttranskripts überprüft; bei einem fehlenden Transkript wird die Bindung aufgehoben (protokolliert als `reason=transcript-missing`), anstatt unbemerkt eine neue Sitzung unter `--resume` zu starten.
- Aktive Claude-Sitzungen verwenden begrenzte JSONL-Ausgabeschutzwerte: 8 MiB und 20,000 rohe JSONL-Zeilen pro Interaktion.
- Gespeicherte CLI-Sitzungen stellen eine vom Provider verwaltete Kontinuität dar. Das automatische Zurücksetzen ist standardmäßig deaktiviert; `/reset` sowie explizite tägliche oder inaktivitätsbasierte `session.reset`-Richtlinien beenden sie dennoch.
- Neue CLI-Sitzungen werden normalerweise nur anhand der Compaction-Zusammenfassung von OpenClaw und des Abschnitts nach der Compaction neu initialisiert. Um kurze Sitzungen wiederherzustellen, die vor der Compaction ungültig wurden, kann ein Backend dies mit `reseedFromRawTranscriptWhenUncompacted: true` aktivieren. Die Neuinitialisierung anhand des Rohtranskripts bleibt begrenzt und auf sichere Ungültigkeitsfälle beschränkt, etwa ein fehlendes CLI-Transkript, ein verwaistes Ende einer Toolverwendung, Änderungen an Nachrichtenrichtlinie, System-Prompt, Arbeitsverzeichnis oder MCP sowie einen Wiederholungsversuch nach Ablauf einer Sitzung; Änderungen am Authentifizierungsprofil oder an der Anmeldedatenepoche initialisieren den Rohtranskriptverlauf niemals neu.

Serialisierung: `serialize: true` hält Ausführungen auf derselben Lane in der richtigen Reihenfolge (die meisten CLIs serialisieren auf einer einzelnen Provider-Lane). OpenClaw verwirft außerdem die Wiederverwendung gespeicherter CLI-Sitzungen, wenn sich die ausgewählte Authentifizierungsidentität ändert. Dazu gehören eine geänderte Authentifizierungsprofil-ID, ein statischer API-Schlüssel, ein statisches Token oder die OAuth-Kontoidentität, sofern die CLI eine solche bereitstellt; allein die Rotation von OAuth-Zugriffs- oder Aktualisierungstokens beendet die Sitzung nicht. Wenn eine CLI keine stabile OAuth-Konto-ID besitzt, überlässt OpenClaw dieser CLI die Durchsetzung ihrer eigenen Fortsetzungsberechtigungen.

## Fallback-Präludium aus claude-cli-Sitzungen

Wenn ein `claude-cli`-Versuch zu einem Nicht-CLI-Kandidaten in [`agents.defaults.model.fallbacks`](/de/concepts/model-failover) ausweicht, versieht OpenClaw den nächsten Versuch mit einem Kontextvorspann, der aus dem lokalen JSONL-Transkript von Claude Code abgerufen wird (unter `~/.claude/projects/`, je Workspace zugeordnet). Ohne diesen Ausgangskontext startet der Fallback-Provider ohne Kontext, da OpenClaws eigenes Sitzungstranskript bei `claude-cli`-Ausführungen leer ist.

- Der Vorspann bevorzugt die neueste `/compact`-Zusammenfassung oder `compact_boundary`-Markierung und hängt anschließend die neuesten Dialogbeiträge nach der Grenze bis zum Zeichenbudget an. Dialogbeiträge vor der Grenze werden verworfen, da sie bereits in der Zusammenfassung enthalten sind.
- Tool-Blöcke werden zu kompakten `(tool call: name)`- und `(tool result: …)`-Hinweisen zusammengeführt, damit das Prompt-Budget korrekt eingehalten wird; eine übergroße Zusammenfassung wird gekürzt und mit `(truncated)` gekennzeichnet.
- Fallbacks desselben Providers von `claude-cli` zu `claude-cli` verwenden Claudes eigenes `--resume` und überspringen den Vorspann.
- Der Ausgangskontext verwendet die vorhandene Validierung des Claude-Sitzungsdateipfads erneut, sodass keine beliebigen Pfade gelesen werden können.

## Bilder

Plugin-Autoren deklarieren die Unterstützung für Bildpfade mit `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw schreibt Base64-Bilder in temporäre Dateien. Wenn `imageArg` festgelegt ist, werden diese Pfade als CLI-Argumente übergeben; andernfalls hängt OpenClaw die Dateipfade an den Prompt an (Pfadinjektion). Dies funktioniert bei CLIs, die lokale Dateien automatisch aus einfachen Pfadangaben laden.

## Ein- und Ausgaben

- `output: "text"` (Standard) behandelt stdout als endgültige Antwort.
- `output: "json"` versucht, JSON zu parsen und Text sowie eine Sitzungs-ID zu extrahieren.
- `output: "jsonl"` parst einen JSONL-Stream und extrahiert die endgültige Agentennachricht sowie gegebenenfalls Sitzungskennungen.
- Bei der JSON-Ausgabe der Gemini CLI liest OpenClaw den Antworttext aus `response` und die Nutzung aus `stats`, wenn `usage` fehlt oder leer ist. Der mitgelieferte Gemini-CLI-Adapter verwendet `stream-json`.

Eingabemodi:

- `input: "arg"` (Standard) übergibt den Prompt als letztes CLI-Argument.
- `input: "stdin"` sendet den Prompt über stdin.
- Wenn der Prompt sehr lang und `maxPromptArgChars` festgelegt ist, wird stattdessen stdin verwendet.

## Plugin-eigene Standardwerte

Die Standardwerte des CLI-Backends sind Teil der Plugin-Oberfläche:

- Plugins registrieren sie mit `api.registerCliBackend(...)`.
- Die Backend-`id` wird zum Provider-Präfix in Modellreferenzen.
- Das Verhalten von Befehl, argv, Umgebung, Parser, Sitzung und Watchdog verbleibt im Plugin-Code.
- Backend-spezifische Normalisierung verbleibt über den optionalen `normalizeConfig`-Hook im Besitz des Plugins.

Anthropic ist für `claude-cli` und Google für `google-gemini-cli` verantwortlich. OpenAI-Codex-Agentenausführungen verwenden das Codex-App-Server-Harness über `openai/*`; OpenClaw registriert kein mitgeliefertes `codex-cli`-Backend mehr.

Das mitgelieferte Anthropic-Plugin registriert Folgendes für `claude-cli`:

| Schlüssel              | Wert                                                                                                                                                                                                          |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `command`             | `claude`                                                                                                                                                                                                      |
| `args`                | `-p --output-format stream-json --include-partial-messages --verbose --setting-sources user --allowedTools mcp__openclaw__* --disallowedTools ScheduleWakeup,CronCreate,Bash(run_in_background:true),Monitor` |
| `output`              | `jsonl`                                                                                                                                                                                                       |
| `input`               | `stdin`                                                                                                                                                                                                       |
| `modelArg`            | `--model`                                                                                                                                                                                                     |
| `sessionArgs`         | `["--session-id", "{sessionId}"]`                                                                                                                                                                             |
| `sessionMode`         | `always`                                                                                                                                                                                                      |
| `imageArg`            | `@`                                                                                                                                                                                                           |
| `imagePathScope`      | `workspace`                                                                                                                                                                                                   |
| `systemPromptFileArg` | `--append-system-prompt-file`                                                                                                                                                                                 |
| `systemPromptMode`    | `append`                                                                                                                                                                                                      |

Das mitgelieferte Google-Plugin registriert Folgendes für `google-gemini-cli`:

| Schlüssel                  | Wert                                                                                   |
| -------------------------- | -------------------------------------------------------------------------------------- |
| `command`                 | `gemini`                                                                               |
| `args`                    | `--skip-trust --approval-mode auto_edit --output-format stream-json --prompt {prompt}` |
| `resumeArgs`              | identisch, mit `--resume {sessionId}`                                                  |
| `output` / `resumeOutput` | `jsonl`                                                                                |
| `jsonlDialect`            | `gemini-stream-json`                                                                   |
| `imageArg`                | `@`                                                                                    |
| `imagePathScope`          | `workspace`                                                                            |
| `modelArg`                | `--model`                                                                              |
| `sessionMode`             | `existing`                                                                             |
| `sessionIdFields`         | `["session_id", "sessionId"]`                                                          |

Voraussetzung: Die lokale Gemini CLI muss installiert und unter `PATH` als `gemini` verfügbar sein (`brew install gemini-cli` oder `npm install -g @google/gemini-cli`).

Hinweise zur Ausgabe der Gemini CLI:

- Der standardmäßige `stream-json`-Parser liest `message`-Ereignisse des Assistenten, Tool-Ereignisse, die abschließende `result`-Nutzung und Ereignisse mit schwerwiegenden Gemini-Fehlern.
- Die Nutzung greift auf `stats` zurück, wenn `usage` fehlt oder leer ist; `stats.cached` wird in OpenClaw-`cacheRead` normalisiert, und wenn `stats.input` fehlt, werden die Eingabe-Token aus `stats.input_tokens - stats.cached` abgeleitet.

## Overlays für Texttransformationen

Plugins, die kleine Kompatibilitäts-Shims für Prompts oder Nachrichten benötigen, können bidirektionale Texttransformationen deklarieren, ohne einen Provider oder ein CLI-Backend zu ersetzen:

```typescript
api.registerTextTransforms({
  input: [{ from: /red basket/g, to: "blue basket" }],
  output: [{ from: /blue basket/g, to: "red basket" }],
});
```

`input` schreibt den System-Prompt und den an die CLI übergebenen Benutzer-Prompt um. `output` schreibt gestreamten Assistententext und geparsten endgültigen Text um, bevor OpenClaw seine eigenen Kontrollmarkierungen und die Kanalzustellung verarbeitet; bei Provider-gestützten Modellaufrufen stellt es außerdem Zeichenfolgenwerte innerhalb strukturierter Tool-Aufrufargumente nach der Stream-Reparatur und vor der Tool-Ausführung wieder her. Unverarbeitete Provider-JSON-Fragmente bleiben unverändert; Verbraucher sollten die strukturierte partielle, Abschluss- oder Ergebnis-Nutzlast verwenden.

Legen Sie für CLIs, die Provider-spezifische JSONL-Ereignisse ausgeben, `jsonlDialect` in der Konfiguration dieses Backends fest: `claude-stream-json` für Claude-Code-kompatible Streams, `gemini-stream-json` für `stream-json`-Ereignisse der Gemini CLI.

## Zuständigkeit für native Compaction

Einige CLI-Backends führen einen Agenten aus, der sein eigenes Transkript komprimiert. Daher darf OpenClaw seinen absichernden Zusammenfasser nicht auf sie anwenden – andernfalls gerät er mit der Backend-eigenen Compaction in Konflikt und kann den Dialogbeitrag mit einem schwerwiegenden Fehler abbrechen.

`claude-cli` besitzt keinen Harness-Endpunkt (Claude Code führt die Compaction intern durch), daher deklariert es `ownsNativeCompaction: true`, und OpenClaws Compaction-Pfad gibt den Sitzungseintrag unverändert zurück. OpenClaw übergibt das effektive Kontextbudget der Ausführung über die dokumentierte [`CLAUDE_CODE_AUTO_COMPACT_WINDOW`](https://code.claude.com/docs/en/env-vars) von Claude Code, sodass die native automatische Compaction mit den konfigurierten Anthropic-`contextTokens`-Grenzwerten übereinstimmt. Sitzungen mit nativem Harness wie Codex werden stattdessen weiterhin an ihren Harness-Compaction-Endpunkt weitergeleitet.

```typescript
api.registerCliBackend({ id: "my-cli", ownsNativeCompaction: true /* ... */ });
```

Deklarieren Sie `ownsNativeCompaction` nur für ein Backend, das tatsächlich für die Compaction zuständig ist: Es muss sein eigenes Transkript zuverlässig nahe dem Kontextfenster begrenzen und eine fortsetzbare Sitzung speichern (z. B. `--resume` / `--session-id`); andernfalls kann eine zurückgestellte Sitzung das Budget weiterhin überschreiten.

## MCP-Overlays für Bundles

CLI-Backends erhalten OpenClaw-Tool-Aufrufe nicht direkt, ein Backend kann sich jedoch mit `bundleMcp: true` für ein generiertes MCP-Konfigurations-Overlay entscheiden. Aktuelles mitgeliefertes Verhalten:

- `claude-cli`: generierte strikte MCP-Konfigurationsdatei.
- `google-gemini-cli`: generierte Gemini-Systemeinstellungsdatei.

Wenn Bundle-MCP aktiviert ist, führt OpenClaw Folgendes aus:

- startet einen Loopback-HTTP-MCP-Server, der dem CLI-Prozess Gateway-Tools bereitstellt und mit einer nur für den aktuellen Ausführungsversuch aktiven, ausführungsbezogenen Kontextberechtigung (`OPENCLAW_MCP_TOKEN`) authentifiziert wird;
- bindet den Tool-Zugriff an den vom Gateway ausgewählten Sitzungs-, Konto- und Kanalkontext, anstatt den Headern des untergeordneten Prozesses zu vertrauen;
- lädt aktivierte Bundle-MCP-Server für den aktuellen Workspace und führt sie mit einer gegebenenfalls vorhandenen MCP-Konfigurations- oder Einstellungsstruktur des Backends zusammen;
- schreibt die Startkonfiguration mit dem Backend-eigenen Integrationsmodus des zuständigen Plugins um.

Eingeschränkte Ausführungen wie Cron-Aufträge mit `toolsAllow` erfordern eine exakte
Backend-eigene Übersetzung. Das gebündelte `claude-cli`-Backend deaktiviert Claudes
native Tools sowie benutzer-, projekt- und lokale Anpassungen, einschließlich Hooks,
Plugins, Agenten, Skills und `CLAUDE.md`. Anschließend stellt es jedes zulässige
OpenClaw-Tool über den auf die Berechtigung beschränkten MCP-Server bereit. Dadurch verbleiben
Dateisystem-, Prozess-, Ausführungs-, Genehmigungs- und Sandbox-Richtlinien innerhalb von OpenClaw,
anstatt die Befugnisse auf Claudes native Tools oder Anpassungsprozesse auszuweiten. Dieselbe MCP-
Liste wird in Claudes generierter Konfiguration und erneut durch den Gateway bei der Tool-
Auflistung und -Ausführung durchgesetzt. Vor dem Erstellen der Berechtigung lehnt der Kern Backend-
Übersetzungen ab, die MCP-Berechtigungen außerhalb der ursprünglichen Positivliste nennen.
Backends ohne exakte Übersetzung schlagen weiterhin sicher geschlossen fehl.

Wenn keine MCP-Server aktiviert sind, fügt OpenClaw dennoch eine strikte Konfiguration ein, sobald sich ein Backend für gebündeltes MCP entscheidet, sodass Hintergrundausführungen isoliert bleiben.

Sitzungsbezogene gebündelte MCP-Laufzeitumgebungen werden zur Wiederverwendung innerhalb einer Sitzung zwischengespeichert und nach 10 Minuten Inaktivität beendet. Einmalige eingebettete Ausführungen wie Authentifizierungsprüfungen, Slug-Generierung und Active-Memory-Abrufe fordern am Ende der Ausführung eine Bereinigung an, damit stdio-Kindprozesse und Streamable-HTTP-/SSE-Streams die Ausführung nicht überdauern.

Für `claude-cli` wird ein kompatibles ausgewähltes oder geordnetes OpenClaw-OAuth-/Token-Profil
an diesen Claude-Kindprozess weitergeleitet. Dadurch sind agentenspezifische Profile
für den jeweiligen Durchlauf maßgeblich, während Claudes native Host-Anmeldung erhalten bleibt,
wenn kein kompatibles Profil vorhanden ist.

## Obergrenze für den erneuten Verlauf

Wenn eine neue CLI-Sitzung aus einem früheren OpenClaw-Transkript initialisiert wird (beispielsweise nach einem `session_expired`-Wiederholungsversuch), wird der gerenderte `<conversation_history>`-Block begrenzt, damit Prompts zur erneuten Initialisierung nicht ausufern. Der Standardwert beträgt 12.288 Zeichen (etwa 3.000 Token).

Claude-CLI-Backends skalieren diese Obergrenze stattdessen anhand des ermittelten Claude-Kontextfensters: Größere Kontextfenster erhalten einen größeren Ausschnitt des vorherigen Verlaufs bis zu einer festen Obergrenze; andere CLI-Backends behalten den konservativen Standardwert bei. Diese Obergrenze gilt ausschließlich für den Block mit dem vorherigen Verlauf im Prompt zur erneuten Initialisierung.

## Einschränkungen

- OpenClaw fügt keine Tool-Aufrufe in das CLI-Backend-Protokoll ein. Backends sehen Gateway-Tools nur, wenn sie sich für `bundleMcp: true` entscheiden.
- Streaming ist Backend-spezifisch: Einige Backends streamen JSONL, andere puffern bis zum Beenden.
- Strukturierte Ausgaben hängen vom eigenen JSON-Format der CLI ab.

## Fehlerbehebung

| Symptom                         | Lösung                                                                                                              |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| CLI nicht gefunden              | Fügen Sie die CLI zu `PATH` des Gateway-Dienstes hinzu oder aktualisieren Sie den registrierten Befehl des zuständigen Plugins. |
| Falscher Modellname             | Aktualisieren Sie die `modelAliases`-Zuordnung des Plugins.                                                     |
| Keine Sitzungskontinuität       | Prüfen Sie `sessionArgs` und `sessionMode` des Plugins.                                                  |
| Bilder werden ignoriert         | Prüfen Sie `imageArg` des Plugins und die Unterstützung der CLI für Dateipfade.                            |

## Verwandte Themen

- [Gateway-Betriebshandbuch](/de/gateway)
- [Lokale Modelle](/de/gateway/local-models)
