---
read_when:
    - Sie möchten verstehen, was „Kontext“ in OpenClaw bedeutet
    - Sie untersuchen, warum das Modell etwas „weiß“ (oder vergessen hat)
    - Sie möchten den Kontextaufwand reduzieren (/context, /status, /compact)
summary: 'Kontext: Was das Modell sieht, wie er aufgebaut wird und wie Sie ihn prüfen können'
title: Kontext
x-i18n:
    generated_at: "2026-07-12T15:16:53Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 1eb3d342a601a447487640587f746cc80a133ede338a880741f53c3e01f20ed1
    source_path: concepts/context.md
    workflow: 16
---

„Kontext“ ist **alles, was OpenClaw für einen Lauf an das Modell sendet**. Er wird durch das **Kontextfenster** des Modells (Token-Limit) begrenzt.

Einfaches mentales Modell für Einsteiger:

- **System-Prompt** (von OpenClaw erstellt): Regeln, Tools, Skills-Liste, Zeit/Laufzeit und eingebundene Workspace-Dateien.
- **Konversationsverlauf**: Ihre Nachrichten + die Nachrichten des Assistenten für diese Sitzung.
- **Tool-Aufrufe/-Ergebnisse + Anhänge**: Befehlsausgaben, gelesene Dateien, Bilder/Audio usw.

Kontext ist _nicht dasselbe_ wie „Speicher“: Speicher kann auf dem Datenträger abgelegt und später erneut geladen werden; Kontext ist das, was sich im aktuellen Fenster des Modells befindet.

## Schnellstart (Kontext prüfen)

- `/status` → schnelle Ansicht „Wie voll ist mein Fenster?“ + Sitzungseinstellungen.
- `/context list` → was eingebunden ist + ungefähre Größen (pro Datei + Gesamtwerte).
- `/context detail` → detailliertere Aufschlüsselung: Größen pro Datei, pro Tool-Schema und pro Skills-Eintrag, Größe des System-Prompts sowie Anzahl der kompaktierbaren Transkriptnachrichten.
- `/context map` → WinDirStat-artiges Treemap-Bild der erfassten Kontextbeiträge der aktuellen Sitzung.
- `/usage tokens` → jeder normalen Antwort eine Fußzeile zur Nutzung hinzufügen.
- `/compact` → älteren Verlauf zu einem kompakten Eintrag zusammenfassen, um Platz im Fenster freizugeben.

Siehe auch: [Slash-Befehle](/de/tools/slash-commands), [Token-Nutzung und -Kosten](/de/reference/token-use), [Compaction](/de/concepts/compaction).

## Beispielausgabe

Die Werte variieren je nach Modell, Provider, Tool-Richtlinie und Inhalt Ihres Workspace.

### `/context list`

```text
🧠 Kontextaufschlüsselung
Workspace: <workspaceDir>
Bootstrap-Maximum/Datei: 12,000 Zeichen
Sandbox: Modus=non-main sandboxed=false
System-Prompt (Lauf): 38,412 Zeichen (~9,603 Tok.) (Projektkontext 23,901 Zeichen (~5,976 Tok.))

Eingebundene Workspace-Dateien:
- AGENTS.md: OK | Rohdaten 1,742 Zeichen (~436 Tok.) | eingebunden 1,742 Zeichen (~436 Tok.)
- SOUL.md: OK | Rohdaten 912 Zeichen (~228 Tok.) | eingebunden 912 Zeichen (~228 Tok.)
- TOOLS.md: GEKÜRZT | Rohdaten 54,210 Zeichen (~13,553 Tok.) | eingebunden 20,962 Zeichen (~5,241 Tok.)
- IDENTITY.md: OK | Rohdaten 211 Zeichen (~53 Tok.) | eingebunden 211 Zeichen (~53 Tok.)
- USER.md: OK | Rohdaten 388 Zeichen (~97 Tok.) | eingebunden 388 Zeichen (~97 Tok.)
- HEARTBEAT.md: FEHLT | Rohdaten 0 | eingebunden 0
- BOOTSTRAP.md: OK | Rohdaten 0 Zeichen (~0 Tok.) | eingebunden 0 Zeichen (~0 Tok.)

Skills-Liste (System-Prompt-Text): 2,184 Zeichen (~546 Tok.) (12 Skills)
Tools: read, edit, write, exec, process, browser, message, sessions_send, …
Tool-Liste (System-Prompt-Text): 1,032 Zeichen (~258 Tok.)
Tool-Schemas (JSON): 31,988 Zeichen (~7,997 Tok.) (zählen zum Kontext; werden nicht als Text angezeigt)
Tools: (wie oben)

Sitzungs-Token (zwischengespeichert): 14,250 gesamt / ctx=32,000
```

### `/context detail`

```text
🧠 Kontextaufschlüsselung (detailliert)
…
Größte Skills (Größe des Prompt-Eintrags):
- frontend-design: 412 Zeichen (~103 Tok.)
- oracle: 401 Zeichen (~101 Tok.)
… (+10 weitere Skills)

Größte Tools (Schemagröße):
- browser: 9,812 Zeichen (~2,453 Tok.)
- exec: 6,240 Zeichen (~1,560 Tok.)
… (+N weitere Tools)
```

### `/context map`

Sendet ein Bild, das aus dem neuesten zwischengespeicherten Laufbericht und dem Sitzungstranskript generiert wird. Bevor eine normale Nachricht in der Sitzung einen Laufbericht erzeugt hat, gibt `/context map` eine Meldung zur Nichtverfügbarkeit zurück, anstatt eine Schätzung darzustellen. Die Fläche der Rechtecke ist proportional zur Anzahl der erfassten Prompt-Zeichen:

- Konversationstranskript (Benutzernachrichten, Antworten des Assistenten, Tool-Ergebnisse, Compaction-Zusammenfassungen) sowie Laufzeitkontext pro Runde und Prompt-Ergänzungen durch Hooks, die nur das Modell erreichen
- eingebundene Workspace-Dateien
- Text des grundlegenden System-Prompts
- Skills-Prompt-Einträge
- JSON-Schemas der Tools

Die Konversationsgruppe wächst mit der Sitzung, daher ändert sich die Karte von Runde zu Runde; nach der Compaction schrumpft sie zu einer Kachel mit Zusammenfassungen.

`/context list`, `/context detail` und `/context json` können weiterhin eine bei Bedarf erstellte Schätzung anzeigen, wenn kein Laufbericht zwischengespeichert ist.

## Was zum Kontextfenster zählt

Alles, was das Modell empfängt, zählt dazu, einschließlich:

- System-Prompt (alle Abschnitte).
- Konversationsverlauf.
- Tool-Aufrufe + Tool-Ergebnisse.
- Anhänge/Transkripte (Bilder/Audio/Dateien).
- Compaction-Zusammenfassungen und Bereinigungsartefakte.
- „Wrapper“ des Providers oder verborgene Header (nicht sichtbar, werden dennoch gezählt).

## So erstellt OpenClaw den System-Prompt

Der System-Prompt wird von **OpenClaw verwaltet** und bei jedem Lauf neu erstellt. Er umfasst:

- Tool-Liste + kurze Beschreibungen.
- Skills-Liste (nur Metadaten; siehe unten).
- Workspace-Speicherort.
- Zeit (UTC + umgerechnete Benutzerzeit, falls konfiguriert).
- Laufzeitmetadaten (Host/Betriebssystem/Modell/Denkmodus).
- Eingebundene Workspace-Bootstrap-Dateien unter **Projektkontext**.

Vollständige Aufschlüsselung: [System-Prompt](/de/concepts/system-prompt).

## Eingebundene Workspace-Dateien (Projektkontext)

Standardmäßig injiziert OpenClaw eine festgelegte Gruppe von Workspace-Dateien (sofern vorhanden):

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (nur beim ersten Start)

Große Dateien werden einzeln gemäß `agents.defaults.bootstrapMaxChars` gekürzt (Standardwert: `20000` Zeichen). OpenClaw erzwingt außerdem mit `agents.defaults.bootstrapTotalMaxChars` eine Gesamtobergrenze für die Bootstrap-Injektion über alle Dateien hinweg (Standardwert: `60000` Zeichen). `/context` zeigt die Größen **im Rohzustand und nach der Injektion** sowie, ob eine Kürzung erfolgt ist.

Wenn eine Kürzung erfolgt, kann die Laufzeitumgebung unter „Project Context“ einen Warnblock in den Prompt einfügen. Konfigurieren Sie dies mit `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`; Standardwert: `always`).

## Skills: injiziert oder bei Bedarf geladen

Der System-Prompt enthält eine kompakte **Skills-Liste** (Name + Beschreibung + Speicherort). Diese Liste verursacht einen tatsächlichen Mehraufwand.

Skill-Anweisungen werden standardmäßig _nicht_ einbezogen. Vom Modell wird erwartet, die `SKILL.md` des Skills **nur bei Bedarf** mit `read` einzulesen.

## Tools: Es entstehen zwei Kostenarten

Tools wirken sich auf zwei Arten auf den Kontext aus:

1. **Text der Tool-Liste** im System-Prompt (das, was Sie als „Tooling“ sehen).
2. **Tool-Schemas** (JSON). Diese werden an das Modell gesendet, damit es Tools aufrufen kann. Sie werden auf den Kontext angerechnet, obwohl Sie sie nicht als Klartext sehen.

`/context detail` schlüsselt die größten Tool-Schemas auf, damit Sie erkennen können, welche den Kontext am stärksten beanspruchen.

## Befehle, Direktiven und „Inline-Kurzbefehle“

Slash-Befehle werden vom Gateway verarbeitet. Dabei gibt es verschiedene Verhaltensweisen:

- **Eigenständige Befehle**: Eine Nachricht, die nur aus `/...` besteht, wird als Befehl ausgeführt.
- **Direktiven**: `/think`, `/fast`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/exec`, `/model`, `/queue` werden entfernt, bevor das Modell die Nachricht sieht.
  - Nachrichten, die nur aus Direktiven bestehen, speichern die Sitzungseinstellungen dauerhaft.
  - Inline-Direktiven in einer normalen Nachricht dienen als Hinweise für die jeweilige Nachricht.
- **Inline-Kurzbefehle** (nur für Absender auf der Zulassungsliste): Bestimmte `/...`-Tokens innerhalb einer normalen Nachricht können sofort ausgeführt werden (Beispiel: „hey /status“) und werden entfernt, bevor das Modell den verbleibenden Text sieht.

Details: [Slash-Befehle](/de/tools/slash-commands).

## Sitzungen, Compaction und Bereinigung (was bestehen bleibt)

Was über mehrere Nachrichten hinweg bestehen bleibt, hängt vom jeweiligen Mechanismus ab:

- **Normaler Verlauf** bleibt im Sitzungstranskript erhalten, bis er gemäß den Richtlinien komprimiert oder bereinigt wird.
- **Compaction** speichert eine Zusammenfassung im Transkript und lässt die neuesten Nachrichten unverändert.
- **Bereinigung** entfernt alte Tool-Ergebnisse aus dem Prompt _im Arbeitsspeicher_, um Platz im Kontextfenster freizugeben, schreibt das Sitzungstranskript jedoch nicht um – der vollständige Verlauf kann weiterhin auf dem Datenträger eingesehen werden.

Dokumentation: [Sitzung](/de/concepts/session), [Compaction](/de/concepts/compaction), [Sitzungsbereinigung](/de/concepts/session-pruning).

Standardmäßig verwendet OpenClaw die integrierte Kontext-Engine `legacy` für die Zusammenstellung und
Compaction. Wenn Sie ein Plugin installieren, das `kind: "context-engine"` bereitstellt, und
es mit `plugins.slots.contextEngine` auswählen, delegiert OpenClaw stattdessen die Kontextzusammenstellung,
`/compact` und zugehörige Lebenszyklus-Hooks für den Subagent-Kontext an diese
Engine. `ownsCompaction: false` greift nicht automatisch auf die Legacy-Engine
zurück; die aktive Engine muss `compact()` weiterhin korrekt implementieren. Unter
[Kontext-Engine](/de/concepts/context-engine) finden Sie die vollständige
austauschbare Schnittstelle, die Lebenszyklus-Hooks und die Konfiguration.

## Was `/context` tatsächlich meldet

`/context` verwendet bevorzugt den neuesten **für den Lauf erstellten** System-Prompt-Bericht, sofern verfügbar:

- `System prompt (run)` = aus dem letzten eingebetteten (toolfähigen) Lauf erfasst und im Sitzungsspeicher persistiert.
- `System prompt (estimate)` = wird dynamisch berechnet, wenn kein Laufbericht vorhanden ist (oder wenn die Ausführung über ein CLI-Backend erfolgt, das diesen Bericht nicht erzeugt).

In beiden Fällen werden Größen und die wichtigsten Beitragsquellen gemeldet; der vollständige System-Prompt oder die Tool-Schemas werden **nicht** ausgegeben. Im detaillierten Modus wird außerdem das Sitzungsprotokoll mit demselben Prädikat für Nachrichten aus realen Unterhaltungen verglichen, das auch von Compaction verwendet wird. Dadurch lässt sich eine hohe Prompt-/Cache-Nutzung leichter von einem komprimierbaren Unterhaltungsverlauf unterscheiden.

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Kontext-Engine" href="/de/concepts/context-engine" icon="puzzle-piece">
    Benutzerdefinierte Kontextinjektion über Plugins.
  </Card>
  <Card title="Compaction" href="/de/concepts/compaction" icon="compress">
    Zusammenfassung langer Unterhaltungen, damit sie innerhalb des Modellfensters bleiben.
  </Card>
  <Card title="System-Prompt" href="/de/concepts/system-prompt" icon="message-lines">
    Wie der System-Prompt erstellt wird und was er bei jedem Durchlauf einfügt.
  </Card>
  <Card title="Agentenschleife" href="/de/concepts/agent-loop" icon="arrows-rotate">
    Der vollständige Ausführungszyklus des Agenten von der eingehenden Nachricht bis zur endgültigen Antwort.
  </Card>
</CardGroup>
