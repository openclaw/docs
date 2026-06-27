---
read_when:
    - Sie möchten verstehen, was „Kontext“ in OpenClaw bedeutet
    - Sie debuggen, warum das Modell etwas „weiß“ (oder vergessen hat)
    - Sie möchten Kontext-Overhead reduzieren (/context, /status, /compact)
summary: 'Kontext: was das Modell sieht, wie er erstellt wird und wie Sie ihn prüfen können'
title: Kontext
x-i18n:
    generated_at: "2026-06-27T17:23:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 900b4a72acf43405a6b7718b93c3b5c8543eb2cc90766298889052c7468e39fb
    source_path: concepts/context.md
    workflow: 16
---

„Kontext“ ist **alles, was OpenClaw für einen Lauf an das Modell sendet**. Er wird durch das **Kontextfenster** des Modells begrenzt (Token-Limit).

Einsteiger-Mentalmodell:

- **System-Prompt** (von OpenClaw erstellt): Regeln, Werkzeuge, Skills-Liste, Zeit/Laufzeit und injizierte Workspace-Dateien.
- **Konversationsverlauf**: Ihre Nachrichten + die Nachrichten des Assistenten für diese Sitzung.
- **Werkzeugaufrufe/-ergebnisse + Anhänge**: Befehlsausgabe, gelesene Dateien, Bilder/Audio usw.

Kontext ist _nicht dasselbe_ wie „Memory“: Memory kann auf der Festplatte gespeichert und später erneut geladen werden; Kontext ist das, was sich im aktuellen Fenster des Modells befindet.

## Schnellstart (Kontext prüfen)

- `/status` → schnelle Ansicht „Wie voll ist mein Fenster?“ + Sitzungseinstellungen.
- `/context list` → was injiziert wurde + grobe Größen (pro Datei + Summen).
- `/context detail` → detailliertere Aufschlüsselung: Größen pro Datei, pro Werkzeugschema, pro Skill-Eintrag, System-Prompt-Größe und Anzahl kompaktierbarer Transkriptnachrichten.
- `/context map` → WinDirStat-artige Treemap-Grafik der aktuell nachverfolgten Kontextbeiträge der Sitzung.
- `/usage tokens` → Nutzungsfooter pro Antwort an normale Antworten anhängen.
- `/compact` → älteren Verlauf zu einem kompakten Eintrag zusammenfassen, um Fensterplatz freizugeben.

Siehe auch: [Slash-Befehle](/de/tools/slash-commands), [Token-Nutzung & Kosten](/de/reference/token-use), [Compaction](/de/concepts/compaction).

## Beispielausgabe

Werte variieren je nach Modell, Provider, Werkzeugrichtlinie und Inhalt Ihres Workspaces.

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

Sendet ein Bild, das aus dem neuesten zwischengespeicherten Laufbericht generiert wird. Bevor eine normale Nachricht in der Sitzung einen Laufbericht erzeugt hat, gibt `/context map` statt einer geschätzten Darstellung eine Nicht-verfügbar-Meldung zurück. Die Rechteckfläche ist proportional zu den nachverfolgten Prompt-Zeichen:

- injizierte Workspace-Dateien
- Basistext des System-Prompts
- Skill-Prompt-Einträge
- Werkzeug-JSON-Schemas

`/context list`, `/context detail` und `/context json` können weiterhin eine On-Demand-Schätzung prüfen, wenn kein Laufbericht zwischengespeichert ist.

## Was zum Kontextfenster zählt

Alles, was das Modell erhält, zählt, einschließlich:

- System-Prompt (alle Abschnitte).
- Konversationsverlauf.
- Werkzeugaufrufe + Werkzeugergebnisse.
- Anhänge/Transkripte (Bilder/Audio/Dateien).
- Compaction-Zusammenfassungen und Pruning-Artefakte.
- Provider-„Wrapper“ oder versteckte Header (nicht sichtbar, zählen trotzdem).

## Wie OpenClaw den System-Prompt erstellt

Der System-Prompt ist **OpenClaw-eigen** und wird bei jedem Lauf neu erstellt. Er enthält:

- Werkzeugliste + kurze Beschreibungen.
- Skills-Liste (nur Metadaten; siehe unten).
- Workspace-Speicherort.
- Zeit (UTC + umgerechnete Benutzerzeit, falls konfiguriert).
- Laufzeitmetadaten (Host/OS/Modell/Thinking).
- Injizierte Workspace-Bootstrap-Dateien unter **Project Context**.

Vollständige Aufschlüsselung: [System-Prompt](/de/concepts/system-prompt).

## Injizierte Workspace-Dateien (Project Context)

Standardmäßig injiziert OpenClaw einen festen Satz von Workspace-Dateien (falls vorhanden):

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (nur beim ersten Lauf)

Große Dateien werden pro Datei mit `agents.defaults.bootstrapMaxChars` gekürzt (Standard `20000` Zeichen). OpenClaw erzwingt außerdem eine Gesamtobergrenze für die Bootstrap-Injektion über alle Dateien hinweg mit `agents.defaults.bootstrapTotalMaxChars` (Standard `60000` Zeichen). `/context` zeigt Größen für **roh vs. injiziert** und ob eine Kürzung stattgefunden hat.

Wenn eine Kürzung erfolgt, kann die Laufzeit einen Warnblock im Prompt unter Project Context injizieren. Konfigurieren Sie dies mit `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`; Standard `always`).

## Skills: injiziert vs. bei Bedarf geladen

Der System-Prompt enthält eine kompakte **Skills-Liste** (Name + Beschreibung + Speicherort). Diese Liste hat echten Overhead.

Skill-Anweisungen sind standardmäßig _nicht_ enthalten. Es wird erwartet, dass das Modell die `SKILL.md` des Skills **nur bei Bedarf** per `read` liest.

## Werkzeuge: Es gibt zwei Kosten

Werkzeuge beeinflussen den Kontext auf zwei Arten:

1. **Werkzeuglistentext** im System-Prompt (was Sie als „Tooling“ sehen).
2. **Werkzeugschemas** (JSON). Diese werden an das Modell gesendet, damit es Werkzeuge aufrufen kann. Sie zählen zum Kontext, auch wenn Sie sie nicht als Klartext sehen.

`/context detail` schlüsselt die größten Werkzeugschemas auf, damit Sie sehen können, was dominiert.

## Befehle, Direktiven und „Inline-Kurzbefehle“

Slash-Befehle werden vom Gateway verarbeitet. Es gibt einige unterschiedliche Verhaltensweisen:

- **Eigenständige Befehle**: Eine Nachricht, die nur `/...` enthält, wird als Befehl ausgeführt.
- **Direktiven**: `/think`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/model`, `/queue` werden entfernt, bevor das Modell die Nachricht sieht.
  - Nachrichten, die nur Direktiven enthalten, speichern Sitzungseinstellungen dauerhaft.
  - Inline-Direktiven in einer normalen Nachricht wirken als Hinweise pro Nachricht.
- **Inline-Kurzbefehle** (nur erlaubte Absender): Bestimmte `/...`-Tokens innerhalb einer normalen Nachricht können sofort ausgeführt werden (Beispiel: „hey /status“) und werden entfernt, bevor das Modell den restlichen Text sieht.

Details: [Slash-Befehle](/de/tools/slash-commands).

## Sitzungen, Compaction und Pruning (was erhalten bleibt)

Was über Nachrichten hinweg erhalten bleibt, hängt vom Mechanismus ab:

- **Normaler Verlauf** bleibt im Sitzungstranskript erhalten, bis er durch Richtlinie kompaktiert/gepruned wird.
- **Compaction** speichert eine Zusammenfassung im Transkript und lässt aktuelle Nachrichten unverändert.
- **Pruning** entfernt alte Werkzeugergebnisse aus dem _im Arbeitsspeicher_ befindlichen Prompt, um Platz im Kontextfenster freizugeben, schreibt das Sitzungstranskript aber nicht um - der vollständige Verlauf bleibt weiterhin auf der Festplatte prüfbar.

Dokumentation: [Sitzung](/de/concepts/session), [Compaction](/de/concepts/compaction), [Sitzungs-Pruning](/de/concepts/session-pruning).

Standardmäßig verwendet OpenClaw die integrierte `legacy`-Kontext-Engine für Zusammenstellung und
Compaction. Wenn Sie ein Plugin installieren, das `kind: "context-engine"` bereitstellt, und
es mit `plugins.slots.contextEngine` auswählen, delegiert OpenClaw die Kontext-
Zusammenstellung, `/compact` und zugehörige Subagent-Kontext-Lifecycle-Hooks stattdessen an diese
Engine. `ownsCompaction: false` führt nicht automatisch zu einem Fallback auf die `legacy`-
Engine; die aktive Engine muss `compact()` weiterhin korrekt implementieren. Siehe
[Kontext-Engine](/de/concepts/context-engine) für die vollständige
Plugin-fähige Schnittstelle, Lifecycle-Hooks und Konfiguration.

## Was `/context` tatsächlich meldet

`/context` bevorzugt den neuesten **laufgebauten** System-Prompt-Bericht, wenn verfügbar:

- `System prompt (run)` = aus dem letzten eingebetteten (werkzeugfähigen) Lauf erfasst und im Sitzungsspeicher persistiert.
- `System prompt (estimate)` = spontan berechnet, wenn kein Laufbericht existiert (oder wenn die Ausführung über ein CLI-Backend erfolgt, das den Bericht nicht erzeugt).

In beiden Fällen werden Größen und wichtigste Beiträge gemeldet; der vollständige System-Prompt oder die Werkzeugschemas werden **nicht** ausgegeben. Im Detailmodus vergleicht es außerdem das Sitzungstranskript mit demselben Prädikat für echte Konversationsnachrichten, das von Compaction verwendet wird, sodass hohe Prompt-/Cache-Nutzung leichter von kompaktierbarem Konversationsverlauf zu unterscheiden ist.

## Verwandt

<CardGroup cols={2}>
  <Card title="Kontext-Engine" href="/de/concepts/context-engine" icon="puzzle-piece">
    Benutzerdefinierte Kontextinjektion über Plugins.
  </Card>
  <Card title="Compaction" href="/de/concepts/compaction" icon="compress">
    Lange Konversationen zusammenfassen, damit sie im Modellfenster bleiben.
  </Card>
  <Card title="System-Prompt" href="/de/concepts/system-prompt" icon="message-lines">
    Wie der System-Prompt erstellt wird und was er in jeder Runde injiziert.
  </Card>
  <Card title="Agent-Loop" href="/de/concepts/agent-loop" icon="arrows-rotate">
    Der vollständige Ausführungszyklus des Agenten von der eingehenden Nachricht bis zur finalen Antwort.
  </Card>
</CardGroup>
