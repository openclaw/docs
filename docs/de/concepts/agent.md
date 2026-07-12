---
read_when:
    - Ändern von Agentenlaufzeit, Workspace-Bootstrap oder Sitzungsverhalten
summary: Agentenlaufzeit, Workspace-Vertrag und Sitzungsinitialisierung
title: Agentenlaufzeit
x-i18n:
    generated_at: "2026-07-12T15:16:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: e7b07f6db62c001d43e223eee28911b0515e1528e4b15c6c3748e88eaf405cfc
    source_path: concepts/agent.md
    workflow: 16
---

OpenClaw enthält eine **eingebettete Agent-Runtime**: eine integrierte Agent-Schleife, Tool-Anbindung und Prompt-Zusammenstellung, im Unterschied zur Delegation von Durchläufen an einen externen Harness-Prozess. Jeder konfigurierte Agent (zum Ausführen mehrerer siehe [Multi-Agent-Routing](/de/concepts/multi-agent)) verfügt über einen eigenen Workspace, eigene Bootstrap-Dateien und einen eigenen Sitzungsspeicher. Diese Seite beschreibt den Runtime-Vertrag: was der Workspace enthalten muss, welche Dateien injiziert werden und wie Sitzungen damit initialisiert werden.

## Workspace (erforderlich)

Jeder Agent verwendet ein einzelnes Workspace-Verzeichnis (`agents.defaults.workspace` oder
`agents.list[].workspace` pro Agent) als sein **einziges** Arbeitsverzeichnis (`cwd`)
für Tools und Kontext.

Empfehlung: Verwenden Sie `openclaw setup`, um `~/.openclaw/openclaw.json` zu erstellen, falls die Datei fehlt, und die Workspace-Dateien zu initialisieren.

Vollständige Workspace-Struktur und Sicherungsanleitung: [Agent-Workspace](/de/concepts/agent-workspace)

Wenn `agents.defaults.sandbox` aktiviert ist, können Nicht-Hauptsitzungen dies durch sitzungsspezifische Workspaces unter `agents.defaults.sandbox.workspaceRoot` überschreiben (siehe [Gateway-Konfiguration](/de/gateway/configuration)).

## Bootstrap-Dateien (injiziert)

Im Workspace erwartet OpenClaw diese vom Benutzer bearbeitbaren Dateien:

| Datei          | Zweck                                                |
| -------------- | ---------------------------------------------------- |
| `AGENTS.md`    | Betriebsanweisungen und „Gedächtnis“                 |
| `SOUL.md`      | Persona, Grenzen, Ton                                |
| `TOOLS.md`     | Vom Benutzer gepflegte Tool-Hinweise und Konventionen |
| `IDENTITY.md`  | Name/Stil/Emoji des Agenten                          |
| `USER.md`      | Benutzerprofil und bevorzugte Anrede                 |
| `HEARTBEAT.md` | Heartbeat-spezifische Anweisungen                    |
| `BOOTSTRAP.md` | Einmaliges Erstritual (nach Abschluss gelöscht)      |
| `MEMORY.md`    | Stammdatei für das Langzeitgedächtnis, falls vorhanden |

Beim ersten Durchlauf einer neuen Sitzung injiziert OpenClaw den Inhalt dieser Dateien in den Projektkontext des System-Prompts. `MEMORY.md` wird nur injiziert, wenn die Datei im Stammverzeichnis des Workspace vorhanden ist.

Leere Dateien werden übersprungen. Große Dateien werden gekürzt und mit einer Markierung abgeschnitten, damit Prompts kompakt bleiben (lesen Sie die Datei, um den vollständigen Inhalt zu erhalten). Bei einer fehlenden Datei (außer `MEMORY.md`) wird stattdessen eine einzelne Markierungszeile für eine „fehlende Datei“ injiziert; `openclaw setup` erstellt dafür eine sichere Standardvorlage.

`BOOTSTRAP.md` wird nur für einen **völlig neuen Workspace** erstellt (keine anderen Bootstrap-Dateien vorhanden). Solange die Datei aussteht, behält OpenClaw sie im Projektkontext und fügt dem System-Prompt Bootstrap-Anweisungen für das anfängliche Ritual hinzu, anstatt sie in die Benutzernachricht zu kopieren. Wenn Sie die Datei nach Abschluss des Rituals löschen, wird sie bei späteren Neustarts nicht erneut erstellt.

Nachdem ein Workspace erkannt wurde, verwaltet OpenClaw außerdem eine Bestätigungsmarkierung für den Workspace-Pfad im Zustandsverzeichnis. Wenn ein kürzlich bestätigter Workspace verschwindet oder gelöscht wird, lehnt der Start eine unbemerkte Neuerstellung von `BOOTSTRAP.md` ab; stellen Sie den Workspace wieder her oder führen Sie eine vollständige Onboarding-Zurücksetzung durch, damit Workspace und Markierung gemeinsam gelöscht werden.

Um die Erstellung von Bootstrap-Dateien vollständig zu deaktivieren (für vorab befüllte Workspaces), legen Sie Folgendes fest:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Integrierte Tools

Kern-Tools (Lesen/Ausführen/Bearbeiten/Schreiben und zugehörige System-Tools) sind stets verfügbar, vorbehaltlich der Tool-Richtlinie. `apply_patch` ist für OpenAI-Modelle standardmäßig aktiviert und wird durch `tools.exec.applyPatch` (`enabled`, `workspaceOnly`, `allowModels`) gesteuert. `TOOLS.md` legt **nicht** fest, welche Tools vorhanden sind; die Datei enthält Vorgaben dazu, wie _Sie_ deren Verwendung wünschen.

## Skills

OpenClaw lädt Skills aus diesen Speicherorten (höchste Priorität zuerst):

- Workspace: `<workspace>/skills`
- Projekt-Agent-Skills: `<workspace>/.agents/skills`
- Persönliche Agent-Skills: `~/.agents/skills`
- Verwaltet/lokal: `~/.openclaw/skills`
- Mitgeliefert (in der Installation enthalten)
- Zusätzliche Skill-Ordner: `skills.load.extraDirs`

Skill-Stammverzeichnisse können gruppierte Ordner wie
`<workspace>/skills/personal/foo/SKILL.md` enthalten; der Skill wird weiterhin unter seinem
flachen Frontmatter-Namen bereitgestellt, zum Beispiel `foo`.

Skills können durch Konfiguration/Umgebungsvariablen eingeschränkt werden (siehe `skills` in der [Gateway-Konfiguration](/de/gateway/configuration)).

## Runtime-Grenzen

Die eingebettete Agent-Runtime gehört zu OpenClaw: Modellerkennung, Tool-Anbindung,
Prompt-Zusammenstellung, Sitzungsverwaltung und Kanalauslieferung bilden eine gemeinsame integrierte
Runtime-Oberfläche.

## Sitzungen

Sitzungszeilen werden in der SQLite-Datenbank des jeweiligen Agenten gespeichert:

- `~/.openclaw/agents/<agentId>/agent/openclaw-agent.sqlite`

Transkript-JSONL-Dateien können weiterhin unter
`~/.openclaw/agents/<agentId>/sessions/` als Eingaben für Legacy-Migrationen, gelöschte oder
zurückgesetzte Archive, Importe, Exporte und Support-Artefakte vorhanden sein. Der aktive Agent-Verlauf wird
zusammen mit den Sitzungszeilen in SQLite gespeichert. Die Sitzungs-ID ist stabil und wird von
OpenClaw festgelegt. OpenClaw liest keine Sitzungsordner anderer Tools.

## Steuerung während des Streamings

Eingehende Prompts, die während eines laufenden Durchlaufs eintreffen, werden standardmäßig in den aktuellen Durchlauf eingesteuert.
Die Steuerung erfolgt **nachdem der aktuelle Assistentendurchlauf die Ausführung seiner
Tool-Aufrufe abgeschlossen hat**, vor dem nächsten LLM-Aufruf, und überspringt keine verbleibenden Tool-Aufrufe
der aktuellen Assistentennachricht mehr.

`/queue steer` ist das Standardverhalten für aktive Durchläufe. Mit `/queue followup` und
`/queue collect` warten Nachrichten auf einen späteren Durchlauf, anstatt eingesteuert zu werden.
`/queue interrupt` bricht stattdessen den aktiven Durchlauf ab. Informationen zum Verhalten der Warteschlange und ihrer Grenzen finden Sie unter [Warteschlange](/de/concepts/queue)
und [Steuerungswarteschlange](/de/concepts/queue-steering).

Block-Streaming sendet abgeschlossene Assistentenblöcke, sobald sie fertiggestellt sind; es ist
**standardmäßig deaktiviert** (`agents.defaults.blockStreamingDefault: "off"`).
Passen Sie die Grenze über `agents.defaults.blockStreamingBreak` an (`text_end` gegenüber `message_end`; Standardwert ist `text_end`).
Steuern Sie die weiche Blockaufteilung mit `agents.defaults.blockStreamingChunk` (standardmäßig
800-1200 Zeichen; bevorzugt Absatzumbrüche, dann Zeilenumbrüche und zuletzt Satzgrenzen).
Fassen Sie gestreamte Blöcke mit `agents.defaults.blockStreamingCoalesce` zusammen, um
Einzeilen-Spam zu reduzieren (inaktivitätsbasierte Zusammenführung vor dem Senden). Kanäle außer Telegram erfordern
explizit `*.blockStreaming: true`, um Blockantworten zu aktivieren.
Ausführliche Tool-Zusammenfassungen werden beim Start des Tools ausgegeben (ohne Entprellung); die Control UI
streamt die Tool-Ausgabe über Agent-Ereignisse, sofern verfügbar.
Weitere Einzelheiten: [Streaming und Aufteilung](/de/concepts/streaming).

## Modellreferenzen

Modellreferenzen in der Konfiguration (zum Beispiel `agents.defaults.model` und `agents.defaults.models`) werden am **ersten** `/` getrennt.

- Verwenden Sie beim Konfigurieren von Modellen `provider/model`.
- Wenn die Modell-ID selbst `/` enthält (wie bei OpenRouter), geben Sie das Provider-Präfix an (Beispiel: `openrouter/moonshotai/kimi-k2`).
- Wenn Sie den Provider weglassen, versucht OpenClaw zuerst einen Alias, dann eine eindeutige
  Übereinstimmung eines konfigurierten Providers für genau diese Modell-ID und greift erst danach
  auf den konfigurierten Standard-Provider zurück. Wenn dieser Provider das
  konfigurierte Standardmodell nicht mehr anbietet, greift OpenClaw auf das erste konfigurierte
  Provider-/Modellpaar zurück, anstatt einen veralteten Standardwert eines entfernten Providers auszugeben.

## Konfiguration (minimal)

Legen Sie mindestens Folgendes fest:

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (dringend empfohlen)

## Verwandte Themen

- [Agent-Workspace](/de/concepts/agent-workspace)
- [Multi-Agent-Routing](/de/concepts/multi-agent)
- [Sitzungsverwaltung](/de/concepts/session)
- [Gruppenchats](/de/channels/group-messages)
