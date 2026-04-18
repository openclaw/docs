---
read_when:
    - Sie möchten verstehen, was „Kontext“ in OpenClaw bedeutet.
    - Sie debuggen, warum das Modell etwas „weiß“ (oder es vergessen hat).
    - Sie möchten den Kontext-Overhead reduzieren (`/context`, `/status`, `/compact`).
summary: 'Kontext: was das Modell sieht, wie es aufgebaut ist und wie man es untersucht'
title: Kontext
x-i18n:
    generated_at: "2026-04-18T06:12:16Z"
    model: gpt-5.4
    provider: openai
    source_hash: 477ccb1d9654968d0e904b6846b32b8c14db6b6c0d3d2ec2b7409639175629f9
    source_path: concepts/context.md
    workflow: 15
---

# Kontext

„Kontext“ ist **alles, was OpenClaw bei einem Durchlauf an das Modell sendet**. Er ist durch das **Kontextfenster** des Modells (Token-Limit) begrenzt.

Ein mentales Modell für Einsteiger:

- **System Prompt** (von OpenClaw erstellt): Regeln, Tools, Skills-Liste, Zeit/Laufzeit und eingebundene Workspace-Dateien.
- **Unterhaltungsverlauf**: Ihre Nachrichten + die Nachrichten des Assistenten für diese Sitzung.
- **Tool-Aufrufe/-Ergebnisse + Anhänge**: Befehlsausgabe, Dateilesevorgänge, Bilder/Audio usw.

Kontext ist _nicht dasselbe_ wie „Speicher“: Speicher kann auf der Festplatte abgelegt und später erneut geladen werden; Kontext ist das, was sich aktuell im Fenster des Modells befindet.

## Schnellstart (Kontext untersuchen)

- `/status` → schnelle Ansicht „wie voll ist mein Fenster?“ + Sitzungseinstellungen.
- `/context list` → was eingebunden ist + grobe Größen (pro Datei + Summen).
- `/context detail` → tiefere Aufschlüsselung: pro Datei, Größen pro Tool-Schema, Größen pro Skill-Eintrag und Größe des System Prompt.
- `/usage tokens` → hängt normalen Antworten eine Fußzeile mit der Nutzung pro Antwort an.
- `/compact` → fasst älteren Verlauf zu einem kompakten Eintrag zusammen, um Platz im Fenster freizugeben.

Siehe auch: [Slash-Befehle](/de/tools/slash-commands), [Token-Nutzung & Kosten](/de/reference/token-use), [Compaction](/de/concepts/compaction).

## Beispielausgabe

Die Werte variieren je nach Modell, Anbieter, Tool-Richtlinie und dem Inhalt Ihres Workspace.

### `/context list`

```
🧠 Kontextaufschlüsselung
Workspace: <workspaceDir>
Bootstrap-Maximum/Datei: 12.000 Zeichen
Sandbox: mode=non-main sandboxed=false
System Prompt (Durchlauf): 38.412 Zeichen (~9.603 Tok) (Project Context 23.901 Zeichen (~5.976 Tok))

Eingebundene Workspace-Dateien:
- AGENTS.md: OK | roh 1.742 Zeichen (~436 Tok) | eingebunden 1.742 Zeichen (~436 Tok)
- SOUL.md: OK | roh 912 Zeichen (~228 Tok) | eingebunden 912 Zeichen (~228 Tok)
- TOOLS.md: ABGESCHNITTEN | roh 54.210 Zeichen (~13.553 Tok) | eingebunden 20.962 Zeichen (~5.241 Tok)
- IDENTITY.md: OK | roh 211 Zeichen (~53 Tok) | eingebunden 211 Zeichen (~53 Tok)
- USER.md: OK | roh 388 Zeichen (~97 Tok) | eingebunden 388 Zeichen (~97 Tok)
- HEARTBEAT.md: FEHLT | roh 0 | eingebunden 0
- BOOTSTRAP.md: OK | roh 0 Zeichen (~0 Tok) | eingebunden 0 Zeichen (~0 Tok)

Skills-Liste (System-Prompt-Text): 2.184 Zeichen (~546 Tok) (12 Skills)
Tools: read, edit, write, exec, process, browser, message, sessions_send, …
Tool-Liste (System-Prompt-Text): 1.032 Zeichen (~258 Tok)
Tool-Schemas (JSON): 31.988 Zeichen (~7.997 Tok) (zählen zum Kontext; werden nicht als Text angezeigt)
Tools: (wie oben)

Sitzungs-Token (zwischengespeichert): 14.250 gesamt / ctx=32.000
```

### `/context detail`

```
🧠 Kontextaufschlüsselung (detailliert)
…
Größte Skills (Eintragsgröße im Prompt):
- frontend-design: 412 Zeichen (~103 Tok)
- oracle: 401 Zeichen (~101 Tok)
… (+10 weitere Skills)

Größte Tools (Schema-Größe):
- browser: 9.812 Zeichen (~2.453 Tok)
- exec: 6.240 Zeichen (~1.560 Tok)
… (+N weitere Tools)
```

## Was auf das Kontextfenster angerechnet wird

Alles, was das Modell erhält, wird angerechnet, einschließlich:

- System Prompt (alle Abschnitte).
- Unterhaltungsverlauf.
- Tool-Aufrufe + Tool-Ergebnisse.
- Anhänge/Transkripte (Bilder/Audio/Dateien).
- Compaction-Zusammenfassungen und Pruning-Artefakte.
- Anbieter-„Wrapper“ oder versteckte Header (nicht sichtbar, werden trotzdem mitgezählt).

## Wie OpenClaw den System Prompt erstellt

Der System Prompt wird **von OpenClaw verwaltet** und bei jedem Durchlauf neu erstellt. Er enthält:

- Tool-Liste + Kurzbeschreibungen.
- Skills-Liste (nur Metadaten; siehe unten).
- Workspace-Speicherort.
- Zeit (UTC + umgerechnete Benutzerzeit, falls konfiguriert).
- Laufzeit-Metadaten (Host/OS/Modell/Denken).
- Eingebundene Workspace-Bootstrap-Dateien unter **Project Context**.

Vollständige Aufschlüsselung: [System Prompt](/de/concepts/system-prompt).

## Eingebundene Workspace-Dateien (Project Context)

Standardmäßig bindet OpenClaw eine feste Menge von Workspace-Dateien ein (falls vorhanden):

- `AGENTS.md`
- `SOUL.md`
- `TOOLS.md`
- `IDENTITY.md`
- `USER.md`
- `HEARTBEAT.md`
- `BOOTSTRAP.md` (nur beim ersten Durchlauf)

Große Dateien werden pro Datei mit `agents.defaults.bootstrapMaxChars` abgeschnitten (Standard: `12000` Zeichen). OpenClaw erzwingt außerdem über alle Dateien hinweg ein Gesamtlimit für eingebundene Bootstrap-Inhalte mit `agents.defaults.bootstrapTotalMaxChars` (Standard: `60000` Zeichen). `/context` zeigt **Roh- vs. eingebundene** Größen sowie an, ob eine Abschneidung erfolgt ist.

Wenn eine Abschneidung erfolgt, kann die Laufzeit im Prompt einen Warnblock unter Project Context einfügen. Konfigurieren Sie dies mit `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`; Standard: `once`).

## Skills: eingebunden vs. bei Bedarf geladen

Der System Prompt enthält eine kompakte **Skills-Liste** (Name + Beschreibung + Speicherort). Diese Liste verursacht echten Overhead.

Skill-Anweisungen sind standardmäßig _nicht_ enthalten. Vom Modell wird erwartet, dass es `read` für die `SKILL.md` eines Skills **nur bei Bedarf** verwendet.

## Tools: Es gibt zwei Kostenarten

Tools beeinflussen den Kontext auf zwei Arten:

1. **Tool-Listentext** im System Prompt (was Sie als „Tooling“ sehen).
2. **Tool-Schemas** (JSON). Diese werden an das Modell gesendet, damit es Tools aufrufen kann. Sie zählen zum Kontext, auch wenn Sie sie nicht als Klartext sehen.

`/context detail` schlüsselt die größten Tool-Schemas auf, damit Sie sehen können, was dominiert.

## Befehle, Direktiven und „Inline-Verknüpfungen“

Slash-Befehle werden vom Gateway verarbeitet. Es gibt einige unterschiedliche Verhaltensweisen:

- **Eigenständige Befehle**: Eine Nachricht, die nur aus `/...` besteht, wird als Befehl ausgeführt.
- **Direktiven**: `/think`, `/verbose`, `/trace`, `/reasoning`, `/elevated`, `/model`, `/queue` werden entfernt, bevor das Modell die Nachricht sieht.
  - Nachrichten, die nur aus Direktiven bestehen, behalten Sitzungseinstellungen bei.
  - Inline-Direktiven in einer normalen Nachricht wirken als Hinweise pro Nachricht.
- **Inline-Verknüpfungen** (nur für Sender auf der Allowlist): Bestimmte `/...`-Tokens innerhalb einer normalen Nachricht können sofort ausgeführt werden (Beispiel: „hey /status“) und werden entfernt, bevor das Modell den restlichen Text sieht.

Details: [Slash-Befehle](/de/tools/slash-commands).

## Sitzungen, Compaction und Pruning (was bestehen bleibt)

Was über Nachrichten hinweg bestehen bleibt, hängt vom Mechanismus ab:

- **Normaler Verlauf** bleibt im Sitzungsprotokoll erhalten, bis er gemäß Richtlinie kompaktiert oder bereinigt wird.
- **Compaction** speichert eine Zusammenfassung im Protokoll und lässt aktuelle Nachrichten intakt.
- **Pruning** entfernt alte Tool-Ergebnisse aus dem _im Speicher befindlichen_ Prompt für einen Durchlauf, schreibt das Protokoll jedoch nicht um.

Dokumentation: [Sitzung](/de/concepts/session), [Compaction](/de/concepts/compaction), [Sitzungs-Pruning](/de/concepts/session-pruning).

Standardmäßig verwendet OpenClaw für Zusammenstellung und Compaction die integrierte `legacy`-Kontext-Engine. Wenn Sie ein Plugin installieren, das `kind: "context-engine"` bereitstellt, und es mit `plugins.slots.contextEngine` auswählen, delegiert OpenClaw stattdessen die Kontextzusammenstellung, `/compact` und verwandte Kontext-Lebenszyklus-Hooks für Subagents an diese Engine. `ownsCompaction: false` führt nicht automatisch zu einem Fallback auf die Legacy-Engine; die aktive Engine muss `compact()` dennoch korrekt implementieren. Siehe [Context Engine](/de/concepts/context-engine) für die vollständige steckbare Schnittstelle, Lebenszyklus-Hooks und Konfiguration.

## Was `/context` tatsächlich meldet

`/context` bevorzugt, wenn verfügbar, den neuesten **im Durchlauf erstellten** Bericht zum System Prompt:

- `System prompt (run)` = aus dem letzten eingebetteten (Tool-fähigen) Durchlauf erfasst und im Sitzungsspeicher persistent gespeichert.
- `System prompt (estimate)` = spontan berechnet, wenn kein Durchlaufbericht existiert (oder bei Ausführung über ein CLI-Backend, das den Bericht nicht erzeugt).

In beiden Fällen werden Größen und die größten Beiträge gemeldet; der vollständige System Prompt oder Tool-Schemas werden **nicht** ausgegeben.

## Verwandt

- [Context Engine](/de/concepts/context-engine) — benutzerdefinierte Kontexteinbindung über Plugins
- [Compaction](/de/concepts/compaction) — Zusammenfassen langer Unterhaltungen
- [System Prompt](/de/concepts/system-prompt) — wie der System Prompt erstellt wird
- [Agent Loop](/de/concepts/agent-loop) — der vollständige Ausführungszyklus des Agenten
