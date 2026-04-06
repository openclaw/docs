---
read_when:
    - Sie möchten verstehen, was „Kontext“ in OpenClaw bedeutet
    - Sie debuggen, warum das Modell etwas „weiß“ (oder vergessen hat)
    - Sie möchten den Kontext-Overhead reduzieren (`/context`, `/status`, `/compact`)
summary: 'Kontext: was das Modell sieht, wie er aufgebaut ist und wie man ihn untersucht'
title: Kontext
x-i18n:
    generated_at: "2026-04-06T03:06:20Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe7dfe52cb1a64df229c8622feed1804df6c483a6243e0d2f309f6ff5c9fe521
    source_path: concepts/context.md
    workflow: 15
---

# Kontext

„Kontext“ ist **alles, was OpenClaw für einen Lauf an das Modell sendet**. Er ist durch das **Kontextfenster** des Modells (Token-Limit) begrenzt.

Ein einfaches Einstiegsmodell:

- **System-Prompt** (von OpenClaw aufgebaut): Regeln, Tools, Skills-Liste, Zeit/Laufzeit und injizierte Workspace-Dateien.
- **Konversationsverlauf**: Ihre Nachrichten + die Nachrichten des Assistenten für diese Sitzung.
- **Tool-Aufrufe/-Ergebnisse + Anhänge**: Befehlsausgabe, Datei-Lesevorgänge, Bilder/Audio usw.

Kontext ist _nicht dasselbe_ wie „Speicher“: Speicher kann auf der Festplatte gespeichert und später erneut geladen werden; Kontext ist das, was sich im aktuellen Fenster des Modells befindet.

## Schnellstart (Kontext untersuchen)

- `/status` → schnelle Ansicht „Wie voll ist mein Fenster?“ + Sitzungseinstellungen.
- `/context list` → was injiziert wird + grobe Größen (pro Datei + Gesamtwerte).
- `/context detail` → detailliertere Aufschlüsselung: pro Datei, Größen pro Tool-Schema, Größen pro Skill-Eintrag und Größe des System-Prompts.
- `/usage tokens` → normalen Antworten eine Nutzungsfußzeile pro Antwort anhängen.
- `/compact` → älteren Verlauf zu einem kompakten Eintrag zusammenfassen, um Fensterplatz freizugeben.

Siehe auch: [Slash-Befehle](/de/tools/slash-commands), [Tokennutzung und Kosten](/de/reference/token-use), [Kompaktierung](/de/concepts/compaction).

## Beispielausgabe

Die Werte variieren je nach Modell, Anbieter, Tool-Richtlinie und dem, was sich in Ihrem Workspace befindet.

### `/context list`

```
🧠 Kontextaufschlüsselung
Workspace: <workspaceDir>
Bootstrap-Maximum/Datei: 20.000 Zeichen
Sandbox: mode=non-main sandboxed=false
System-Prompt (Lauf): 38.412 Zeichen (~9.603 Token) (Project Context 23.901 Zeichen (~5.976 Token))

Injizierte Workspace-Dateien:
- AGENTS.md: OK | roh 1.742 Zeichen (~436 Token) | injiziert 1.742 Zeichen (~436 Token)
- SOUL.md: OK | roh 912 Zeichen (~228 Token) | injiziert 912 Zeichen (~228 Token)
- TOOLS.md: TRUNCATED | roh 54.210 Zeichen (~13.553 Token) | injiziert 20.962 Zeichen (~5.241 Token)
- IDENTITY.md: OK | roh 211 Zeichen (~53 Token) | injiziert 211 Zeichen (~53 Token)
- USER.md: OK | roh 388 Zeichen (~97 Token) | injiziert 388 Zeichen (~97 Token)
- HEARTBEAT.md: MISSING | roh 0 | injiziert 0
- BOOTSTRAP.md: OK | roh 0 Zeichen (~0 Token) | injiziert 0 Zeichen (~0 Token)

Skills-Liste (System-Prompt-Text): 2.184 Zeichen (~546 Token) (12 Skills)
Tools: read, edit, write, exec, process, browser, message, sessions_send, …
Tool-Liste (System-Prompt-Text): 1.032 Zeichen (~258 Token)
Tool-Schemas (JSON): 31.988 Zeichen (~7.997 Token) (zählt zum Kontext; nicht als Text angezeigt)
Tools: (wie oben)

Sitzungs-Token (zwischengespeichert): 14.250 gesamt / ctx=32.000
```

### `/context detail`

```
🧠 Kontextaufschlüsselung (detailliert)
…
Größte Skills (Größe des Prompt-Eintrags):
- frontend-design: 412 Zeichen (~103 Token)
- oracle: 401 Zeichen (~101 Token)
… (+10 weitere Skills)

Größte Tools (Schema-Größe):
- browser: 9.812 Zeichen (~2.453 Token)
- exec: 6.240 Zeichen (~1.560 Token)
… (+N weitere Tools)
```

## Was auf das Kontextfenster angerechnet wird

Alles, was das Modell erhält, wird angerechnet, einschließlich:

- System-Prompt (alle Abschnitte).
- Konversationsverlauf.
- Tool-Aufrufe + Tool-Ergebnisse.
- Anhänge/Transkripte (Bilder/Audio/Dateien).
- Kompaktierungszusammenfassungen und Pruning-Artefakte.
- Anbieter-„Wrapper“ oder versteckte Header (nicht sichtbar, werden trotzdem angerechnet).

## Wie OpenClaw den System-Prompt erstellt

Der System-Prompt wird **von OpenClaw verwaltet** und bei jedem Lauf neu aufgebaut. Er enthält:

- Tool-Liste + kurze Beschreibungen.
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

Große Dateien werden pro Datei mit `agents.defaults.bootstrapMaxChars` abgeschnitten (Standard: `20000` Zeichen). OpenClaw erzwingt außerdem über alle Dateien hinweg eine Obergrenze für die gesamte Bootstrap-Injektion mit `agents.defaults.bootstrapTotalMaxChars` (Standard: `150000` Zeichen). `/context` zeigt **Roh- vs. injizierte** Größen und ob eine Abschneidung stattgefunden hat.

Wenn eine Abschneidung auftritt, kann die Laufzeit einen Warnblock direkt im Prompt unter Project Context injizieren. Konfigurieren Sie dies mit `agents.defaults.bootstrapPromptTruncationWarning` (`off`, `once`, `always`; Standard: `once`).

## Skills: injiziert vs. bei Bedarf geladen

Der System-Prompt enthält eine kompakte **Skills-Liste** (Name + Beschreibung + Speicherort). Diese Liste verursacht echten Overhead.

Skill-Anweisungen sind standardmäßig _nicht_ enthalten. Vom Modell wird erwartet, dass es die `SKILL.md` des Skills **nur bei Bedarf** mit `read` liest.

## Tools: es gibt zwei Arten von Kosten

Tools wirken sich auf zwei Arten auf den Kontext aus:

1. **Tool-Listentext** im System-Prompt (das, was Sie als „Tooling“ sehen).
2. **Tool-Schemas** (JSON). Diese werden an das Modell gesendet, damit es Tools aufrufen kann. Sie zählen zum Kontext, auch wenn Sie sie nicht als Klartext sehen.

`/context detail` schlüsselt die größten Tool-Schemas auf, damit Sie sehen können, was den größten Anteil ausmacht.

## Befehle, Direktiven und „Inline-Kurzbefehle“

Slash-Befehle werden vom Gateway verarbeitet. Es gibt einige unterschiedliche Verhaltensweisen:

- **Eigenständige Befehle**: Eine Nachricht, die nur aus `/...` besteht, wird als Befehl ausgeführt.
- **Direktiven**: `/think`, `/verbose`, `/reasoning`, `/elevated`, `/model`, `/queue` werden entfernt, bevor das Modell die Nachricht sieht.
  - Nachrichten, die nur aus Direktiven bestehen, speichern Sitzungseinstellungen dauerhaft.
  - Inline-Direktiven in einer normalen Nachricht wirken als Hinweise pro Nachricht.
- **Inline-Kurzbefehle** (nur für Sender auf der Allowlist): Bestimmte `/...`-Token innerhalb einer normalen Nachricht können sofort ausgeführt werden (Beispiel: „hey /status“) und werden entfernt, bevor das Modell den restlichen Text sieht.

Details: [Slash-Befehle](/de/tools/slash-commands).

## Sitzungen, Kompaktierung und Pruning (was bestehen bleibt)

Was über Nachrichten hinweg bestehen bleibt, hängt vom Mechanismus ab:

- **Normaler Verlauf** bleibt im Sitzungsprotokoll erhalten, bis er gemäß Richtlinie kompaktifiziert/geprunt wird.
- **Kompaktierung** speichert eine Zusammenfassung im Protokoll und lässt aktuelle Nachrichten intakt.
- **Pruning** entfernt alte Tool-Ergebnisse aus dem _im Speicher befindlichen_ Prompt für einen Lauf, schreibt das Protokoll aber nicht um.

Dokumentation: [Sitzung](/de/concepts/session), [Kompaktierung](/de/concepts/compaction), [Session-Pruning](/de/concepts/session-pruning).

Standardmäßig verwendet OpenClaw die integrierte `legacy`-Kontext-Engine für Zusammenstellung und
Kompaktierung. Wenn Sie ein Plugin installieren, das `kind: "context-engine"` bereitstellt, und
es mit `plugins.slots.contextEngine` auswählen, delegiert OpenClaw die Kontextzusammenstellung,
`/compact` und zugehörige Lifecycle-Hooks für den Subagent-Kontext stattdessen an diese
Engine. `ownsCompaction: false` führt nicht automatisch zu einem Fallback auf die `legacy`-Engine;
die aktive Engine muss `compact()` weiterhin korrekt implementieren. Siehe
[Context Engine](/de/concepts/context-engine) für die vollständige
pluggbare Schnittstelle, Lifecycle-Hooks und Konfiguration.

## Was `/context` tatsächlich meldet

`/context` bevorzugt, wenn verfügbar, den neuesten **laufbasiert aufgebauten** System-Prompt-Bericht:

- `System prompt (run)` = aus dem letzten eingebetteten Lauf (mit Tool-Unterstützung) erfasst und im Sitzungsspeicher persistiert.
- `System prompt (estimate)` = bei Bedarf berechnet, wenn noch kein Laufbericht vorhanden ist.

In beiden Fällen werden Größen und die größten Beitragsfaktoren gemeldet; der vollständige System-Prompt oder die Tool-Schemas werden **nicht** ausgegeben.

## Verwandt

- [Context Engine](/de/concepts/context-engine) — benutzerdefinierte Kontextinjektion über Plugins
- [Kompaktierung](/de/concepts/compaction) — Zusammenfassung langer Unterhaltungen
- [System-Prompt](/de/concepts/system-prompt) — wie der System-Prompt aufgebaut wird
- [Agent Loop](/de/concepts/agent-loop) — der vollständige Ausführungszyklus des Agenten
