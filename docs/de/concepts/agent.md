---
read_when:
    - Ändern der Agent-Runtime, des Workspace-Bootstraps oder des Sitzungsverhaltens
summary: Agentenlaufzeit, Workspace-Vertrag und Sitzungs-Bootstrap
title: Agentenlaufzeit
x-i18n:
    generated_at: "2026-07-24T04:58:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 4d3dd9c0c65e4ccd791a2a6131f1b7457c8cfee6da71502d93c355280e094390
    source_path: concepts/agent.md
    workflow: 16
---

OpenClaw enthält eine **eingebettete Agent-Runtime**: eine integrierte Agent-Schleife, Tool-
Anbindung und Prompt-Zusammenstellung, unabhängig davon, Ausführungsrunden an einen externen
Harness-Prozess zu delegieren. Jeder konfigurierte Agent (Informationen zur parallelen Ausführung
mehrerer Agenten finden Sie unter [Multi-Agent-Routing](/de/concepts/multi-agent))
verfügt über einen eigenen Workspace, eigene Bootstrap-Dateien und einen eigenen
Sitzungsspeicher. Diese Seite beschreibt den Vertrag dieser Runtime: was der Workspace
enthalten muss, welche Dateien eingefügt werden und wie Sitzungen anhand dieser Dateien initialisiert werden.

## Workspace (erforderlich)

Jeder Agent verwendet ein einzelnes Workspace-Verzeichnis (`agents.defaults.workspace` oder
`agents.entries.*.workspace` je Agent) als sein **einziges** Arbeitsverzeichnis (`cwd`)
für Tools und Kontext.

Empfehlung: Verwenden Sie `openclaw setup`, um `~/.openclaw/openclaw.json` bei Bedarf zu erstellen und die Workspace-Dateien zu initialisieren.

Vollständige Workspace-Struktur und Anleitung zur Sicherung: [Agent-Workspace](/de/concepts/agent-workspace)

Wenn `agents.defaults.sandbox` aktiviert ist, können Sitzungen außerhalb der Hauptsitzung dies mit
sitzungsspezifischen Workspaces unter `agents.defaults.sandbox.workspaceRoot` überschreiben (siehe
[Gateway-Konfiguration](/de/gateway/configuration)).

## Bootstrap-Dateien (eingefügt)

Im Workspace erwartet OpenClaw die folgenden vom Benutzer bearbeitbaren Dateien:

| Datei          | Zweck                                                |
| -------------- | ---------------------------------------------------- |
| `AGENTS.md`    | Betriebsanweisungen und „Gedächtnis“                  |
| `SOUL.md`      | Persona, Grenzen, Tonfall                              |
| `TOOLS.md`     | Vom Benutzer gepflegte Tool-Hinweise und Konventionen |
| `IDENTITY.md`  | Name/Stimmung/Emoji des Agenten                       |
| `USER.md`      | Benutzerprofil und bevorzugte Anrede                  |
| `HEARTBEAT.md` | Heartbeat-spezifische Anweisungen                     |
| `BOOTSTRAP.md` | Einmaliges Erstritual (wird nach Abschluss gelöscht)  |
| `MEMORY.md`    | Übergeordnete Datei für das Langzeitgedächtnis, sofern vorhanden |

In der ersten Ausführungsrunde einer neuen Sitzung fügt OpenClaw den Inhalt dieser Dateien in den Projektkontext des System-Prompts ein. `MEMORY.md` wird nur eingefügt, wenn die Datei im Stammverzeichnis des Workspace vorhanden ist.

Leere Dateien werden übersprungen. Große Dateien werden gekürzt und mit einer Markierung abgeschnitten, damit Prompts kompakt bleiben (lesen Sie die Datei, um den vollständigen Inhalt zu erhalten). Für eine fehlende Datei (außer `MEMORY.md`) wird stattdessen eine einzelne Markierungszeile „Datei fehlt“ eingefügt; `openclaw setup` erstellt dafür eine sichere Standardvorlage.

`BOOTSTRAP.md` wird nur für einen **völlig neuen Workspace** erstellt (wenn keine anderen Bootstrap-Dateien vorhanden sind). Solange die Datei aussteht, behält OpenClaw sie im Projektkontext und ergänzt den System-Prompt um Bootstrap-Anweisungen für das Erstritual, anstatt sie in die Benutzernachricht zu kopieren. Wenn Sie die Datei nach Abschluss des Rituals löschen, wird sie bei späteren Neustarts nicht erneut erstellt.

Nachdem ein Workspace erkannt wurde, speichert OpenClaw dessen Einrichtungsstatus und
Bestätigung in der gemeinsam genutzten SQLite-Datenbank unter
`~/.openclaw/state/openclaw.sqlite`. Wenn ein kürzlich bestätigter Workspace
verschwindet oder gelöscht wird, verweigert der Start die unbemerkte erneute Erzeugung von `BOOTSTRAP.md`;
stellen Sie den Workspace wieder her oder führen Sie eine vollständige Zurücksetzung des Onboardings durch, damit der Workspace und sein
Datenbankstatus gemeinsam gelöscht werden.

Ältere Versionen verwendeten Workspace-JSON-Dateien und `.attested`-Sidecar-Dateien. Die Runtime liest
diese Dateien nicht. Führen Sie `openclaw doctor --fix` aus, um sie zu validieren, ihren
Status in SQLite zu importieren und jede Quelldatei zu entfernen, nachdem die importierten Zeilen überprüft wurden.

Um die Erstellung von Bootstrap-Dateien vollständig zu deaktivieren (für vorab befüllte Workspaces), legen Sie Folgendes fest:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Integrierte Tools

Die Core-Tools (Lesen/Ausführen/Bearbeiten/Schreiben und zugehörige System-Tools) sind,
vorbehaltlich der Tool-Richtlinie, immer verfügbar. `apply_patch` ist für OpenAI-Modelle standardmäßig aktiviert und wird durch
`tools.exec.applyPatch` (`enabled`, `workspaceOnly`, `allowModels`) gesteuert. `TOOLS.md` bestimmt **nicht**, welche Tools vorhanden sind; es dient
als Vorgabe dafür, wie diese nach Ihren Vorstellungen verwendet werden sollen.

## Skills

OpenClaw lädt Skills aus den folgenden Speicherorten (mit absteigender Priorität):

- Workspace: `<workspace>/skills`
- Projektbezogene Agent-Skills: `<workspace>/.agents/skills`
- Persönliche Agent-Skills: `~/.agents/skills`
- Verwaltet/lokal: `~/.openclaw/skills`
- Integriert (im Lieferumfang der Installation enthalten)
- Zusätzliche Skill-Ordner: `skills.load.extraDirs`

Skill-Stammverzeichnisse können gruppierte Ordner wie
`<workspace>/skills/personal/foo/SKILL.md` enthalten; der Skill wird dennoch unter seinem
flachen Frontmatter-Namen bereitgestellt, zum Beispiel `foo`.

Skills können durch Konfiguration/Umgebungsvariablen eingeschränkt werden (siehe `skills` unter [Gateway-Konfiguration](/de/gateway/configuration)).

## Runtime-Grenzen

Die eingebettete Agent-Runtime gehört zu OpenClaw: Modellerkennung, Tool-Anbindung,
Prompt-Zusammenstellung, Sitzungsverwaltung und Kanalauslieferung nutzen eine gemeinsame integrierte
Runtime-Oberfläche.

## Sitzungen

Sitzungszeilen werden in der agentenspezifischen SQLite-Datenbank gespeichert:

- `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`

Transkript-JSONL-Dateien können weiterhin unter
`~/.openclaw/agents/<agentId>/sessions/` als Eingaben für Legacy-Migrationen, gelöschte oder
zurückgesetzte Archive, Importe, Exporte und Support-Artefakte vorhanden sein. Der aktive Agentenverlauf wird
zusammen mit den Sitzungszeilen in SQLite gespeichert. Die Sitzungs-ID ist stabil und wird von
OpenClaw festgelegt. OpenClaw liest keine Sitzungsordner anderer Tools.

## Steuerung während des Streamings

Eingehende Prompts, die während einer laufenden Ausführung eintreffen, werden standardmäßig in die aktuelle Ausführung eingespeist.
Die Steuerung erfolgt, **nachdem die aktuelle Assistentenrunde die Ausführung ihrer
Tool-Aufrufe abgeschlossen hat**, jedoch vor dem nächsten LLM-Aufruf. Verbleibende Tool-Aufrufe
der aktuellen Assistentennachricht werden nicht mehr übersprungen.

`/queue steer` ist das Standardverhalten für aktive Ausführungen. Mit `/queue followup` und
`/queue collect` warten Nachrichten auf eine spätere Ausführungsrunde, anstatt zur Steuerung verwendet zu werden.
`/queue interrupt` bricht stattdessen die aktive Ausführung ab. Informationen zum Verhalten von Warteschlangen und Grenzen finden Sie unter [Warteschlange](/de/concepts/queue)
und [Steuerungswarteschlange](/de/concepts/queue-steering).

Beim Block-Streaming werden abgeschlossene Assistentenblöcke gesendet, sobald sie fertiggestellt sind; diese Funktion ist
**standardmäßig deaktiviert** (`agents.defaults.blockStreamingDefault: "off"`).
Passen Sie die Grenze über `agents.defaults.blockStreamingBreak` an (`text_end` gegenüber `message_end`; Standardwert ist `text_end`).
Steuern Sie die weiche Blockaufteilung mit `agents.defaults.blockStreamingChunk` (standardmäßig
800–1200 Zeichen; bevorzugt Absatzumbrüche, dann Zeilenumbrüche und zuletzt Satzgrenzen).
Fassen Sie gestreamte Abschnitte mit `agents.defaults.blockStreamingCoalesce` zusammen, um
einzeilige Nachrichtenfluten zu reduzieren (inaktivitätsbasiertes Zusammenführen vor dem Senden). Bei Kanälen außer Telegram muss
`*.streaming.block.enabled: true` explizit aktiviert werden, um Blockantworten zu verwenden (QQ Bot
streamt Blockantworten hingegen, sofern `channels.qqbot.streaming.mode` nicht `"off"` ist).
Ausführliche Tool-Zusammenfassungen werden beim Start des Tools ausgegeben (ohne Entprellung); die Control UI
streamt die Tool-Ausgabe über Agentenereignisse, sofern verfügbar.
Weitere Einzelheiten: [Streaming und Aufteilung](/de/concepts/streaming).

## Modellreferenzen

Modellreferenzen in der Konfiguration (zum Beispiel `agents.defaults.model` und `agents.defaults.models`) werden am **ersten** `/` getrennt.

- Verwenden Sie beim Konfigurieren von Modellen `provider/model`.
- Wenn die Modell-ID selbst `/` enthält (im OpenRouter-Stil), geben Sie das Provider-Präfix an (Beispiel: `openrouter/moonshotai/kimi-k2`).
- Wenn Sie den Provider weglassen, versucht OpenClaw zunächst, einen Alias aufzulösen, dann eine eindeutige
  Übereinstimmung bei den konfigurierten Providern für genau diese Modell-ID zu finden, und greift erst anschließend
  auf den konfigurierten Standard-Provider zurück. Wenn dieser Provider das
  konfigurierte Standardmodell nicht mehr bereitstellt, greift OpenClaw auf den ersten konfigurierten
  Provider und dessen Modell zurück, anstatt einen veralteten Standardwert eines entfernten Providers auszugeben.

## Konfiguration (minimal)

Legen Sie mindestens Folgendes fest:

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (dringend empfohlen)

## Verwandte Themen

- [Agent-Workspace](/de/concepts/agent-workspace)
- [Multi-Agent-Routing](/de/concepts/multi-agent)
- [Sitzungsverwaltung](/de/concepts/session)
- [Gruppenchats](/de/channels/group-messages)
