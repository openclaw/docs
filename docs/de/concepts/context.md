---
read_when:
    - Sie möchten verstehen, was „Kontext“ in OpenClaw bedeutet
    - Sie untersuchen, warum das Modell etwas „weiß“ (oder es vergessen hat)
    - Sie möchten den Kontext-Overhead reduzieren (/context, /status, /compact)
summary: 'Kontext: was das Modell sieht, wie er aufgebaut wird und wie Sie ihn prüfen können'
title: Kontext
x-i18n:
    generated_at: "2026-05-06T06:43:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1bd23094ef23928ee277c1b84ee17b9324aaea963d72a0c4c73da359409a5de9
    source_path: concepts/context.md
    workflow: 16
---

„Context“ ist **alles, was OpenClaw für einen Lauf an das Modell sendet**. Er wird durch das **Context Window** des Modells begrenzt (Token-Limit).

Ein mentales Modell für Einsteiger:

- **System-Prompt** (von OpenClaw erstellt): Regeln, Tools, Skills-Liste, Zeit/Laufzeit und injizierte Workspace-Dateien.
- **Konversationsverlauf**: Ihre Nachrichten + die Nachrichten des Assistenten für diese Sitzung.
- **Tool-Aufrufe/Ergebnisse + Anhänge**: Befehlsausgabe, Dateilesevorgänge, Bilder/Audio usw.

Context ist _nicht dasselbe_ wie „Memory“: Memory kann auf dem Datenträger gespeichert und später erneut geladen werden; Context ist das, was sich im aktuellen Fenster des Modells befindet.

## Schnellstart (Context prüfen)

- `/status` → schnelle Ansicht „Wie voll ist mein Fenster?“ + Sitzungseinstellungen.
- `/context list` → was injiziert wurde + grobe Größen (pro Datei + Summen).
- `/context detail` → tiefere Aufschlüsselung: Größen pro Datei, pro Tool-Schema, pro Skill-Eintrag und Größe des System-Prompts.
- `/usage tokens` → Nutzungs-Footer pro Antwort an normale Antworten anhängen.
- `/compact` → älteren Verlauf zu einem kompakten Eintrag zusammenfassen, um Platz im Fenster freizugeben.

Siehe auch: [Slash-Befehle](/de/tools/slash-commands), [Token-Nutzung & Kosten](/de/reference/token-use), [Compaction](/de/concepts/compaction).

## Beispielausgabe

Werte variieren je nach Modell, Provider, Tool-Policy und Inhalt Ihres Workspace.

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

## Was zum Context Window zählt

Alles, was das Modell erhält, zählt dazu, einschließlich:

- System-Prompt (alle Abschnitte).
- Konversationsverlauf.
- Tool-Aufrufe + Tool-Ergebnisse.
- Anhänge/Transkripte (Bilder/Audio/Dateien).
- Compaction-Zusammenfassungen und Pruning-Artefakte.
- Provider-„Wrapper“ oder versteckte Header (nicht sichtbar, zählen dennoch).

## Wie OpenClaw den System-Prompt erstellt

Der System-Prompt ist **OpenClaw-eigen** und wird bei jedem Lauf neu erstellt. Er enthält:

- Tool-Liste + kurze Beschreibungen.
- Skills-Liste (nur Metadaten; siehe unten).
- Workspace-Speicherort.
- Zeit (UTC + konvertierte Benutzerzeit, falls konfiguriert).
- Laufzeit-Metadaten (Host/OS/Modell/Denken).
- Injizierte Workspace-Bootstrap-Dateien unter **Projekt-Context**.

Vollständige Aufschlüsselung: [System-Prompt](/de/concepts/system-prompt).

## Injizierte Workspace-Dateien (Projekt-Context)

Standardmäßig injiziert OpenClaw einen festen Satz von Workspace-Dateien (falls vorhanden):

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (nur beim ersten Lauf)

Große Dateien werden pro Datei mit `agents.defaults.bootstrapMaxChars` gekürzt (Standard `12000` Zeichen). OpenClaw erzwingt außerdem eine Gesamtobergrenze für Bootstrap-Injektionen über alle Dateien hinweg mit `agents.defaults.bootstrapTotalMaxChars` (Standard `60000` Zeichen). `/context` zeigt **Rohgrößen vs. injizierte** Größen und ob eine Kürzung stattgefunden hat.

Wenn eine Kürzung erfolgt, kann die Laufzeit einen Warnblock im Prompt unter Projekt-Context injizieren. Konfigurieren Sie dies mit `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`; Standard `once`).

## Skills: injiziert vs. bei Bedarf geladen

Der System-Prompt enthält eine kompakte **Skills-Liste** (Name + Beschreibung + Speicherort). Diese Liste verursacht echten Overhead.

Skill-Anweisungen sind standardmäßig _nicht_ enthalten. Es wird erwartet, dass das Modell die `SKILL.md` des Skills **nur bei Bedarf** per `read` liest.

## Tools: Es gibt zwei Kosten

Tools beeinflussen den Context auf zwei Arten:

1. **Tool-Listentext** im System-Prompt (was Sie als „Tooling“ sehen).
2. **Tool-Schemas** (JSON). Diese werden an das Modell gesendet, damit es Tools aufrufen kann. Sie zählen zum Context, obwohl Sie sie nicht als Klartext sehen.

`/context detail` schlüsselt die größten Tool-Schemas auf, damit Sie sehen können, was dominiert.

## Befehle, Direktiven und „Inline-Kurzbefehle“

Slash-Befehle werden vom Gateway verarbeitet. Es gibt einige unterschiedliche Verhaltensweisen:

- **Eigenständige Befehle**: Eine Nachricht, die nur `/...` enthält, wird als Befehl ausgeführt.
- **Direktiven**: `/think`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/model`, `/queue` werden entfernt, bevor das Modell die Nachricht sieht.
  - Nachrichten, die nur Direktiven enthalten, speichern Sitzungseinstellungen dauerhaft.
  - Inline-Direktiven in einer normalen Nachricht wirken als Hinweise pro Nachricht.
- **Inline-Kurzbefehle** (nur allowgelistete Absender): Bestimmte `/...`-Tokens innerhalb einer normalen Nachricht können sofort ausgeführt werden (Beispiel: „hey /status“) und werden entfernt, bevor das Modell den verbleibenden Text sieht.

Details: [Slash-Befehle](/de/tools/slash-commands).

## Sitzungen, Compaction und Pruning (was bestehen bleibt)

Was über Nachrichten hinweg bestehen bleibt, hängt vom Mechanismus ab:

- **Normaler Verlauf** bleibt im Sitzungstranskript erhalten, bis er per Policy compacted/gepruned wird.
- **Compaction** speichert eine Zusammenfassung im Transkript und lässt aktuelle Nachrichten intakt.
- **Pruning** entfernt alte Tool-Ergebnisse aus dem _im Arbeitsspeicher gehaltenen_ Prompt, um Platz im Context Window freizugeben, schreibt das Sitzungstranskript jedoch nicht um - der vollständige Verlauf bleibt weiterhin auf dem Datenträger einsehbar.

Dokumentation: [Sitzung](/de/concepts/session), [Compaction](/de/concepts/compaction), [Sitzungs-Pruning](/de/concepts/session-pruning).

Standardmäßig verwendet OpenClaw die eingebaute `legacy`-Context-Engine für Assembly und
Compaction. Wenn Sie ein Plugin installieren, das `kind: "context-engine"` bereitstellt, und
es mit `plugins.slots.contextEngine` auswählen, delegiert OpenClaw die Context-
Assembly, `/compact` und zugehörige Subagent-Context-Lifecycle-Hooks stattdessen an diese
Engine. `ownsCompaction: false` führt nicht automatisch zu einem Fallback auf die legacy-
Engine; die aktive Engine muss `compact()` weiterhin korrekt implementieren. Siehe
[Context Engine](/de/concepts/context-engine) für die vollständige
steckbare Schnittstelle, Lifecycle-Hooks und Konfiguration.

## Was `/context` tatsächlich meldet

`/context` bevorzugt den neuesten **laufgebauten** System-Prompt-Bericht, sofern verfügbar:

- `System prompt (run)` = aus dem letzten eingebetteten (Tool-fähigen) Lauf erfasst und im Sitzungsspeicher persistiert.
- `System prompt (estimate)` = wird spontan berechnet, wenn kein Laufbericht vorhanden ist (oder wenn über ein CLI-Backend ausgeführt wird, das den Bericht nicht generiert).

In beiden Fällen werden Größen und wichtigste Beiträger gemeldet; es gibt **nicht** den vollständigen System-Prompt oder Tool-Schemas aus.

## Verwandt

<CardGroup cols={2}>
  <Card title="Context-Engine" href="/de/concepts/context-engine" icon="puzzle-piece">
    Benutzerdefinierte Context-Injektion über Plugins.
  </Card>
  <Card title="Compaction" href="/de/concepts/compaction" icon="compress">
    Zusammenfassung langer Konversationen, damit sie im Modellfenster bleiben.
  </Card>
  <Card title="System-Prompt" href="/de/concepts/system-prompt" icon="message-lines">
    Wie der System-Prompt erstellt wird und was er in jeder Runde injiziert.
  </Card>
  <Card title="Agenten-Loop" href="/de/concepts/agent-loop" icon="arrows-rotate">
    Der vollständige Agenten-Ausführungszyklus von der eingehenden Nachricht bis zur finalen Antwort.
  </Card>
</CardGroup>
