---
read_when:
    - Sie möchten verstehen, was „Kontext“ in OpenClaw bedeutet
    - Sie untersuchen, warum das Modell etwas „weiß“ (oder es vergessen hat)
    - Sie möchten den Kontext-Overhead reduzieren (/context, /status, /compact)
summary: 'Kontext: was das Modell sieht, wie er aufgebaut wird und wie Sie ihn prüfen'
title: Kontext
x-i18n:
    generated_at: "2026-05-10T19:30:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: dc2dae290e63f82111d865ae066567ef58ec3f48eb62b409b76ee9e6ff65d696
    source_path: concepts/context.md
    workflow: 16
---

„Kontext“ ist **alles, was OpenClaw für einen Lauf an das Modell sendet**. Er wird durch das **Kontextfenster** des Modells begrenzt (Token-Limit).

Einsteiger-Mentalmodell:

- **System-Prompt** (von OpenClaw erstellt): Regeln, Tools, Skills-Liste, Zeit/Laufzeit und injizierte Arbeitsbereichsdateien.
- **Konversationsverlauf**: Ihre Nachrichten + die Nachrichten des Assistenten für diese Sitzung.
- **Tool-Aufrufe/Ergebnisse + Anhänge**: Befehlsausgabe, Dateilesevorgänge, Bilder/Audio usw.

Kontext ist _nicht dasselbe_ wie „Memory“: Memory kann auf der Festplatte gespeichert und später neu geladen werden; Kontext ist das, was sich im aktuellen Fenster des Modells befindet.

## Schnellstart (Kontext prüfen)

- `/status` → schnelle Ansicht „Wie voll ist mein Fenster?“ + Sitzungseinstellungen.
- `/context list` → was injiziert wurde + ungefähre Größen (pro Datei + Summen).
- `/context detail` → detailliertere Aufschlüsselung: Größen pro Datei, pro Tool-Schema, pro Skill-Eintrag sowie System-Prompt-Größe.
- `/context map` → WinDirStat-artiges Treemap-Bild der aktuell nachverfolgten Kontextbeiträge der Sitzung.
- `/usage tokens` → Nutzungsfußzeile pro Antwort an normale Antworten anhängen.
- `/compact` → ältere Historie zu einem kompakten Eintrag zusammenfassen, um Platz im Fenster freizugeben.

Siehe auch: [Slash-Befehle](/de/tools/slash-commands), [Token-Nutzung & Kosten](/de/reference/token-use), [Compaction](/de/concepts/compaction).

## Beispielausgabe

Werte variieren je nach Modell, Provider, Tool-Richtlinie und Inhalt Ihres Arbeitsbereichs.

### `/context list`

```
🧠 Context breakdown
Workspace: <workspaceDir>
Bootstrap max/file: 12,000 chars
Sandbox: mode=non-main sandboxed=false
System prompt (run): 38,412 chars (~9,603 tok) (Project Context 23,901 chars (~5,976 tok))

Injected workspace files:
- AGENTS.md: OK | raw 1,742 chars (~436 tok) | injected 1,742 chars (~436 tok)
- SOUL.md: OK | raw 912 chars (~228 tok) | injected 912 chars (~228 tok)
- TOOLS.md: TRUNCATED | raw 54,210 chars (~13,553 tok) | injected 20,962 chars (~5,241 tok)
- IDENTITY.md: OK | raw 211 chars (~53 tok) | injected 211 chars (~53 tok)
- USER.md: OK | raw 388 chars (~97 tok) | injected 388 chars (~97 tok)
- HEARTBEAT.md: MISSING | raw 0 | injected 0
- BOOTSTRAP.md: OK | raw 0 chars (~0 tok) | injected 0 chars (~0 tok)

Skills list (system prompt text): 2,184 chars (~546 tok) (12 skills)
Tools: read, edit, write, exec, process, browser, message, sessions_send, …
Tool list (system prompt text): 1,032 chars (~258 tok)
Tool schemas (JSON): 31,988 chars (~7,997 tok) (counts toward context; not shown as text)
Tools: (same as above)

Session tokens (cached): 14,250 total / ctx=32,000
```

### `/context detail`

```
🧠 Context breakdown (detailed)
…
Top skills (prompt entry size):
- frontend-design: 412 chars (~103 tok)
- oracle: 401 chars (~101 tok)
… (+10 more skills)

Top tools (schema size):
- browser: 9,812 chars (~2,453 tok)
- exec: 6,240 chars (~1,560 tok)
… (+N more tools)
```

### `/context map`

Sendet ein Bild, das aus dem zuletzt zwischengespeicherten Laufbericht erzeugt wurde. Bevor eine normale Nachricht in der Sitzung einen Laufbericht erzeugt hat, gibt `/context map` eine Nicht-verfügbar-Meldung zurück, statt eine Schätzung zu rendern. Die Rechtecksfläche ist proportional zu den nachverfolgten Prompt-Zeichen:

- injizierte Arbeitsbereichsdateien
- Basistext des System-Prompts
- Skill-Prompt-Einträge
- Tool-JSON-Schemas

`/context list`, `/context detail` und `/context json` können weiterhin eine On-Demand-Schätzung prüfen, wenn kein Laufbericht zwischengespeichert ist.

## Was zum Kontextfenster zählt

Alles, was das Modell erhält, zählt, einschließlich:

- System-Prompt (alle Abschnitte).
- Konversationsverlauf.
- Tool-Aufrufe + Tool-Ergebnisse.
- Anhänge/Transkripte (Bilder/Audio/Dateien).
- Compaction-Zusammenfassungen und Pruning-Artefakte.
- Provider-„Wrapper“ oder versteckte Header (nicht sichtbar, zählen dennoch).

## Wie OpenClaw den System-Prompt erstellt

Der System-Prompt gehört **OpenClaw** und wird bei jedem Lauf neu erstellt. Er enthält:

- Tool-Liste + kurze Beschreibungen.
- Skills-Liste (nur Metadaten; siehe unten).
- Arbeitsbereichsspeicherort.
- Zeit (UTC + umgerechnete Benutzerzeit, falls konfiguriert).
- Laufzeitmetadaten (Host/OS/Modell/Thinking).
- Injizierte Arbeitsbereichs-Bootstrap-Dateien unter **Projektkontext**.

Vollständige Aufschlüsselung: [System-Prompt](/de/concepts/system-prompt).

## Injizierte Arbeitsbereichsdateien (Projektkontext)

Standardmäßig injiziert OpenClaw einen festen Satz von Arbeitsbereichsdateien (falls vorhanden):

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (nur beim ersten Lauf)

Große Dateien werden pro Datei mit `agents.defaults.bootstrapMaxChars` gekürzt (Standard `12000` Zeichen). OpenClaw erzwingt außerdem eine Gesamtobergrenze für die Bootstrap-Injektion über alle Dateien hinweg mit `agents.defaults.bootstrapTotalMaxChars` (Standard `60000` Zeichen). `/context` zeigt Größen für **Rohdaten vs. injiziert** und ob eine Kürzung erfolgt ist.

Wenn eine Kürzung erfolgt, kann die Laufzeit unter Projektkontext einen Warnblock im Prompt injizieren. Konfigurieren Sie dies mit `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`; Standard `once`).

## Skills: injiziert vs. bei Bedarf geladen

Der System-Prompt enthält eine kompakte **Skills-Liste** (Name + Beschreibung + Speicherort). Diese Liste hat echten Overhead.

Skill-Anweisungen sind standardmäßig _nicht_ enthalten. Es wird erwartet, dass das Modell die `SKILL.md` des Skills **nur bei Bedarf** `read`.

## Tools: Es gibt zwei Kostenarten

Tools beeinflussen den Kontext auf zwei Arten:

1. **Tool-Listentext** im System-Prompt (was Sie als „Tooling“ sehen).
2. **Tool-Schemas** (JSON). Diese werden an das Modell gesendet, damit es Tools aufrufen kann. Sie zählen zum Kontext, auch wenn Sie sie nicht als Klartext sehen.

`/context detail` schlüsselt die größten Tool-Schemas auf, damit Sie sehen können, was dominiert.

## Befehle, Direktiven und „Inline-Shortcuts“

Slash-Befehle werden vom Gateway verarbeitet. Es gibt einige unterschiedliche Verhaltensweisen:

- **Eigenständige Befehle**: Eine Nachricht, die nur `/...` enthält, wird als Befehl ausgeführt.
- **Direktiven**: `/think`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/model`, `/queue` werden entfernt, bevor das Modell die Nachricht sieht.
  - Nachrichten, die nur Direktiven enthalten, speichern Sitzungseinstellungen dauerhaft.
  - Inline-Direktiven in einer normalen Nachricht wirken als Hinweise für diese einzelne Nachricht.
- **Inline-Shortcuts** (nur für erlaubte Absender): Bestimmte `/...`-Tokens innerhalb einer normalen Nachricht können sofort ausgeführt werden (Beispiel: „hey /status“) und werden entfernt, bevor das Modell den verbleibenden Text sieht.

Details: [Slash-Befehle](/de/tools/slash-commands).

## Sitzungen, Compaction und Pruning (was erhalten bleibt)

Was über Nachrichten hinweg erhalten bleibt, hängt vom Mechanismus ab:

- **Normaler Verlauf** bleibt im Sitzungstranskript erhalten, bis er per Richtlinie kompaktiert/bereinigt wird.
- **Compaction** speichert eine Zusammenfassung im Transkript und lässt aktuelle Nachrichten intakt.
- **Pruning** entfernt alte Tool-Ergebnisse aus dem _im Arbeitsspeicher befindlichen_ Prompt, um Platz im Kontextfenster freizugeben, schreibt das Sitzungstranskript jedoch nicht um - die vollständige Historie bleibt weiterhin auf der Festplatte einsehbar.

Dokumentation: [Sitzung](/de/concepts/session), [Compaction](/de/concepts/compaction), [Sitzungs-Pruning](/de/concepts/session-pruning).

Standardmäßig verwendet OpenClaw die integrierte `legacy`-Kontext-Engine für Assembly und
Compaction. Wenn Sie ein Plugin installieren, das `kind: "context-engine"` bereitstellt, und
es mit `plugins.slots.contextEngine` auswählen, delegiert OpenClaw stattdessen Kontext-
Assembly, `/compact` und zugehörige Lebenszyklus-Hooks für Subagent-Kontext an diese
Engine. `ownsCompaction: false` führt nicht automatisch zu einem Fallback auf die Legacy-
Engine; die aktive Engine muss `compact()` weiterhin korrekt implementieren. Siehe
[Kontext-Engine](/de/concepts/context-engine) für die vollständige
steckbare Schnittstelle, Lebenszyklus-Hooks und Konfiguration.

## Was `/context` tatsächlich meldet

`/context` bevorzugt den neuesten **laufgebauten** System-Prompt-Bericht, wenn verfügbar:

- `System prompt (run)` = aus dem letzten eingebetteten (toolfähigen) Lauf erfasst und im Sitzungsspeicher persistiert.
- `System prompt (estimate)` = ad hoc berechnet, wenn kein Laufbericht vorhanden ist (oder wenn die Ausführung über ein CLI-Backend erfolgt, das den Bericht nicht erzeugt).

In beiden Fällen werden Größen und wichtigste Beiträge gemeldet; der vollständige System-Prompt oder die Tool-Schemas werden **nicht** ausgegeben.

## Verwandt

<CardGroup cols={2}>
  <Card title="Kontext-Engine" href="/de/concepts/context-engine" icon="puzzle-piece">
    Benutzerdefinierte Kontextinjektion über Plugins.
  </Card>
  <Card title="Compaction" href="/de/concepts/compaction" icon="compress">
    Lange Konversationen zusammenfassen, damit sie innerhalb des Modellfensters bleiben.
  </Card>
  <Card title="System-Prompt" href="/de/concepts/system-prompt" icon="message-lines">
    Wie der System-Prompt erstellt wird und was er bei jedem Zug injiziert.
  </Card>
  <Card title="Agent-Schleife" href="/de/concepts/agent-loop" icon="arrows-rotate">
    Der vollständige Agent-Ausführungszyklus von der eingehenden Nachricht bis zur endgültigen Antwort.
  </Card>
</CardGroup>
