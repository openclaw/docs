---
read_when:
    - Sie möchten verstehen, was „Kontext“ in OpenClaw bedeutet
    - Sie untersuchen, warum das Modell etwas „weiß“ (oder vergessen hat)
    - Sie möchten den Kontext-Overhead reduzieren (/context, /status, /compact)
summary: 'Kontext: Was das Modell sieht, wie er aufgebaut wird und wie er überprüft werden kann'
title: Kontext
x-i18n:
    generated_at: "2026-07-24T04:52:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1eb3d342a601a447487640587f746cc80a133ede338a880741f53c3e01f20ed1
    source_path: concepts/context.md
    workflow: 16
---

„Kontext“ ist **alles, was OpenClaw für einen Durchlauf an das Modell sendet**. Er wird durch das **Kontextfenster** des Modells (Token-Limit) begrenzt.

Einfaches mentales Modell:

- **System-Prompt** (von OpenClaw erstellt): Regeln, Tools, Skills-Liste, Zeit/Laufzeit und injizierte Workspace-Dateien.
- **Konversationsverlauf**: Ihre Nachrichten + die Nachrichten des Assistenten für diese Sitzung.
- **Tool-Aufrufe/-Ergebnisse + Anhänge**: Befehlsausgaben, gelesene Dateien, Bilder/Audio usw.

Kontext ist _nicht dasselbe_ wie „Speicher“: Speicher kann auf der Festplatte abgelegt und später erneut geladen werden; Kontext ist das, was sich im aktuellen Fenster des Modells befindet.

## Schnellstart (Kontext untersuchen)

- `/status` → schnelle Ansicht „Wie voll ist mein Fenster?“ + Sitzungseinstellungen.
- `/context list` → was injiziert wird + ungefähre Größen (pro Datei + Gesamtwerte).
- `/context detail` → detailliertere Aufschlüsselung: Größen pro Datei, pro Tool-Schema und pro Skill-Eintrag, Größe des System-Prompts sowie Anzahl der komprimierbaren Transkriptnachrichten.
- `/context map` → WinDirStat-artige Treemap-Grafik der erfassten Kontextbeiträge der aktuellen Sitzung.
- `/usage tokens` → Fußzeile zur Nutzung pro Antwort an normale Antworten anhängen.
- `/compact` → älteren Verlauf zu einem kompakten Eintrag zusammenfassen, um Platz im Fenster freizugeben.

Siehe auch: [Slash-Befehle](/de/tools/slash-commands), [Token-Nutzung und Kosten](/de/reference/token-use), [Compaction](/de/concepts/compaction).

## Beispielausgabe

Die Werte variieren je nach Modell, Provider, Tool-Richtlinie und Inhalt Ihres Workspace.

### `/context list`

```text
🧠 Kontextaufschlüsselung
Workspace: <workspaceDir>
Bootstrap-Maximum/Datei: 12,000 Zeichen
Sandbox: mode=non-main sandboxed=false
System-Prompt (Durchlauf): 38,412 Zeichen (~9,603 tok) (Projektkontext 23,901 Zeichen (~5,976 tok))

Injizierte Workspace-Dateien:
- AGENTS.md: OK | roh 1,742 Zeichen (~436 tok) | injiziert 1,742 Zeichen (~436 tok)
- SOUL.md: OK | roh 912 Zeichen (~228 tok) | injiziert 912 Zeichen (~228 tok)
- TOOLS.md: GEKÜRZT | roh 54,210 Zeichen (~13,553 tok) | injiziert 20,962 Zeichen (~5,241 tok)
- IDENTITY.md: OK | roh 211 Zeichen (~53 tok) | injiziert 211 Zeichen (~53 tok)
- USER.md: OK | roh 388 Zeichen (~97 tok) | injiziert 388 Zeichen (~97 tok)
- HEARTBEAT.md: FEHLT | roh 0 | injiziert 0
- BOOTSTRAP.md: OK | roh 0 Zeichen (~0 tok) | injiziert 0 Zeichen (~0 tok)

Skills-Liste (System-Prompt-Text): 2,184 Zeichen (~546 tok) (12 Skills)
Tools: read, edit, write, exec, process, browser, message, sessions_send, …
Tool-Liste (System-Prompt-Text): 1,032 Zeichen (~258 tok)
Tool-Schemas (JSON): 31,988 Zeichen (~7,997 tok) (zählen zum Kontext; werden nicht als Text angezeigt)
Tools: (wie oben)

Sitzungs-Token (zwischengespeichert): insgesamt 14,250 / ctx=32,000
```

### `/context detail`

```text
🧠 Kontextaufschlüsselung (detailliert)
…
Größte Skills (Größe des Prompt-Eintrags):
- frontend-design: 412 Zeichen (~103 tok)
- oracle: 401 Zeichen (~101 tok)
… (+10 weitere Skills)

Größte Tools (Schema-Größe):
- browser: 9,812 Zeichen (~2,453 tok)
- exec: 6,240 Zeichen (~1,560 tok)
… (+N weitere Tools)
```

### `/context map`

Sendet ein Bild, das aus dem neuesten zwischengespeicherten Durchlaufbericht und dem Sitzungstranskript generiert wurde. Bevor eine normale Nachricht einen Durchlaufbericht in der Sitzung erzeugt hat, gibt `/context map` eine Meldung über die Nichtverfügbarkeit zurück, statt eine Schätzung darzustellen. Die Rechteckfläche ist proportional zur Anzahl der erfassten Prompt-Zeichen:

- Konversationstranskript (Benutzernachrichten, Antworten des Assistenten, Tool-Ergebnisse, Compaction-Zusammenfassungen) sowie Laufzeitkontext pro Durchlauf und Ergänzungen durch Hook-Prompts, die nur das Modell erreichen
- injizierte Workspace-Dateien
- Text des grundlegenden System-Prompts
- Skill-Prompt-Einträge
- JSON-Schemas der Tools

Die Konversationsgruppe wächst mit der Sitzung, daher ändert sich die Darstellung von Durchlauf zu Durchlauf; nach der Compaction schrumpft sie zu einer Zusammenfassungskachel zusammen.

`/context list`, `/context detail` und `/context json` können weiterhin bei Bedarf eine Schätzung untersuchen, wenn kein Durchlaufbericht zwischengespeichert ist.

## Was zum Kontextfenster zählt

Alles, was das Modell erhält, zählt dazu, einschließlich:

- System-Prompt (alle Abschnitte).
- Konversationsverlauf.
- Tool-Aufrufe + Tool-Ergebnisse.
- Anhänge/Transkripte (Bilder/Audio/Dateien).
- Compaction-Zusammenfassungen und Bereinigungsartefakte.
- „Wrapper“ oder verborgene Header des Providers (nicht sichtbar, zählen dennoch).

## So erstellt OpenClaw den System-Prompt

Der System-Prompt wird von **OpenClaw verwaltet** und bei jedem Durchlauf neu erstellt. Er enthält:

- Tool-Liste + kurze Beschreibungen.
- Skills-Liste (nur Metadaten; siehe unten).
- Workspace-Speicherort.
- Zeit (UTC + umgerechnete Benutzerzeit, falls konfiguriert).
- Laufzeitmetadaten (Host/Betriebssystem/Modell/Denkmodus).
- Unter **Projektkontext** injizierte Workspace-Bootstrap-Dateien.

Vollständige Aufschlüsselung: [System-Prompt](/de/concepts/system-prompt).

## Injizierte Workspace-Dateien (Projektkontext)

Standardmäßig injiziert OpenClaw einen festen Satz von Workspace-Dateien (sofern vorhanden):

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (nur beim ersten Durchlauf)

Große Dateien werden mithilfe von `agents.defaults.bootstrapMaxChars` pro Datei gekürzt (Standardwert: `20000` Zeichen). OpenClaw erzwingt mit `agents.defaults.bootstrapTotalMaxChars` außerdem ein Gesamtlimit für die Bootstrap-Injektion über alle Dateien hinweg (Standardwert: `60000` Zeichen). `/context` zeigt die Größen **roh im Vergleich zu injiziert** und ob eine Kürzung stattgefunden hat.

Bei einer Kürzung kann die Laufzeit unter „Projektkontext“ einen Warnblock in den Prompt injizieren. Konfigurieren Sie dies mit `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`; Standardwert: `always`).

## Skills: injiziert oder bei Bedarf geladen

Der System-Prompt enthält eine kompakte **Skills-Liste** (Name + Beschreibung + Speicherort). Diese Liste verursacht einen tatsächlichen Overhead.

Skill-Anweisungen sind standardmäßig _nicht_ enthalten. Das Modell soll die Datei `SKILL.md` des Skills `read`, **nur wenn sie benötigt wird**.

## Tools: Es gibt zwei Kostenfaktoren

Tools beeinflussen den Kontext auf zwei Arten:

1. **Text der Tool-Liste** im System-Prompt (das, was Sie als „Tooling“ sehen).
2. **Tool-Schemas** (JSON). Diese werden an das Modell gesendet, damit es Tools aufrufen kann. Sie zählen zum Kontext, obwohl Sie sie nicht als Klartext sehen.

`/context detail` schlüsselt die größten Tool-Schemas auf, damit Sie sehen können, welche den meisten Platz beanspruchen.

## Befehle, Direktiven und „Inline-Kurzbefehle“

Slash-Befehle werden vom Gateway verarbeitet. Dabei gibt es verschiedene Verhaltensweisen:

- **Eigenständige Befehle**: Eine Nachricht, die nur aus `/...` besteht, wird als Befehl ausgeführt.
- **Direktiven**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue` werden entfernt, bevor das Modell die Nachricht sieht.
  - Nachrichten, die nur aus Direktiven bestehen, speichern die Sitzungseinstellungen dauerhaft.
  - Inline-Direktiven in einer normalen Nachricht dienen als Hinweise für die jeweilige Nachricht.
- **Inline-Kurzbefehle** (nur für Absender auf der Zulassungsliste): Bestimmte `/...`-Token innerhalb einer normalen Nachricht können sofort ausgeführt werden (Beispiel: „hey /status“) und werden entfernt, bevor das Modell den verbleibenden Text sieht.

Details: [Slash-Befehle](/de/tools/slash-commands).

## Sitzungen, Compaction und Bereinigung (was erhalten bleibt)

Was über mehrere Nachrichten hinweg erhalten bleibt, hängt vom Mechanismus ab:

- Der **normale Verlauf** bleibt im Sitzungstranskript erhalten, bis er gemäß der Richtlinie komprimiert oder bereinigt wird.
- **Compaction** speichert eine Zusammenfassung im Transkript und lässt aktuelle Nachrichten unverändert.
- Die **Bereinigung** entfernt alte Tool-Ergebnisse aus dem _speicherinternen_ Prompt, um Platz im Kontextfenster freizugeben, schreibt das Sitzungstranskript jedoch nicht neu – der vollständige Verlauf bleibt auf der Festplatte einsehbar.

Dokumentation: [Sitzung](/de/concepts/session), [Compaction](/de/concepts/compaction), [Sitzungsbereinigung](/de/concepts/session-pruning).

Standardmäßig verwendet OpenClaw die integrierte Kontext-Engine `legacy` für Zusammenstellung und
Compaction. Wenn Sie ein Plugin installieren, das `kind: "context-engine"` bereitstellt, und
es mit `plugins.slots.contextEngine` auswählen, delegiert OpenClaw die Kontext-
zusammenstellung, `/compact` und zugehörige Lebenszyklus-Hooks für den Subagent-Kontext an diese
Engine. `ownsCompaction: false` greift nicht automatisch auf die Legacy-
Engine zurück; die aktive Engine muss `compact()` weiterhin korrekt implementieren. Unter
[Kontext-Engine](/de/concepts/context-engine) finden Sie die vollständige
austauschbare Schnittstelle, die Lebenszyklus-Hooks und die Konfiguration.

## Was `/context` tatsächlich meldet

`/context` bevorzugt den neuesten **während eines Durchlaufs erstellten** Bericht zum System-Prompt, sofern verfügbar:

- `System prompt (run)` = wurde beim letzten eingebetteten (Tool-fähigen) Durchlauf erfasst und im Sitzungsspeicher gespeichert.
- `System prompt (estimate)` = wird spontan berechnet, wenn kein Durchlaufbericht vorhanden ist (oder wenn die Ausführung über ein CLI-Backend erfolgt, das den Bericht nicht generiert).

In beiden Fällen werden Größen und die größten Beiträge gemeldet; der vollständige System-Prompt oder die Tool-Schemas werden **nicht** ausgegeben. Im detaillierten Modus wird außerdem das Sitzungstranskript mit demselben Prädikat für echte Konversationsnachrichten verglichen, das auch von der Compaction verwendet wird. Dadurch lässt sich eine hohe Prompt-/Cache-Nutzung leichter von einem komprimierbaren Konversationsverlauf unterscheiden.

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Kontext-Engine" href="/de/concepts/context-engine" icon="puzzle-piece">
    Benutzerdefinierte Kontextinjektion über Plugins.
  </Card>
  <Card title="Compaction" href="/de/concepts/compaction" icon="compress">
    Zusammenfassung langer Konversationen, damit sie innerhalb des Modellfensters bleiben.
  </Card>
  <Card title="System-Prompt" href="/de/concepts/system-prompt" icon="message-lines">
    Wie der System-Prompt erstellt wird und was er bei jedem Durchlauf injiziert.
  </Card>
  <Card title="Agentenschleife" href="/de/concepts/agent-loop" icon="arrows-rotate">
    Der vollständige Ausführungszyklus des Agenten von der eingehenden Nachricht bis zur endgültigen Antwort.
  </Card>
</CardGroup>
