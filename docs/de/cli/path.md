---
read_when:
    - Sie möchten im Terminal einen Blattknoten innerhalb einer Workspace-Datei lesen oder schreiben.
    - Sie erstellen Skripte für den Arbeitsbereichsstatus und benötigen ein stabiles, typunabhängiges Adressierungsschema
    - Sie debuggen einen `oc://`-Pfad (validieren Sie die Syntax und prüfen Sie, wohin er aufgelöst wird)
summary: CLI-Referenz für `openclaw path` (Arbeitsbereichsdateien über das Adressierungsschema `oc://` prüfen und bearbeiten)
title: Pfad
x-i18n:
    generated_at: "2026-07-12T01:33:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7afe5bd1c3a5fca8dd22c7d807e390e751ae7e895c54bf0e10e2734f3889436c
    source_path: cli/path.md
    workflow: 16
---

# `openclaw path`

Shell-Zugriff auf das `oc://`-Adressierungsschema: eine nach Art weitergeleitete Pfadsyntax
zum Prüfen und Bearbeiten adressierbarer Arbeitsbereichsdateien (Markdown, JSONC,
JSONL, YAML/YML/Lobster). Selbsthoster, Plugin-Autoren und Editor-Erweiterungen
verwenden sie, um einen eng begrenzten Bereich zu lesen, zu finden oder zu aktualisieren,
ohne für jeden Dateityp einen eigenen Parser erstellen zu müssen.

`path` wird vom mitgelieferten optionalen Plugin `oc-path` bereitgestellt. Aktivieren Sie
es vor der ersten Verwendung:

```bash
openclaw plugins enable oc-path
```

Die CLI-Verben entsprechen dem Adressierungsmodell:

- `resolve` ist konkret und liefert genau einen Treffer.
- `find` ist das Verb für mehrere Treffer bei Platzhaltern, Vereinigungen, Prädikaten und
  positioneller Erweiterung.
- `set` akzeptiert nur konkrete Pfade oder Einfügemarkierungen; Platzhaltermuster
  werden vor dem Schreiben abgelehnt.
- `validate` analysiert einen Pfad ohne Dateisystemzugriff.
- `emit` durchläuft für eine Datei den Zyklus aus Parsen und Ausgeben (Diagnose der Byte-Treue).

## Warum Sie es verwenden sollten

Der OpenClaw-Zustand ist über manuell bearbeitetes Markdown, kommentierte JSONC-
Konfigurationen, nur angehängte JSONL-Protokolle und YAML-Workflow-/Spezifikationsdateien
verteilt. Skripte, Hooks und Agenten benötigen aus diesen Dateien oft nur einen kleinen
Wert: einen Frontmatter-Schlüssel, eine Plugin-Einstellung, ein Feld eines Protokolleintrags,
einen YAML-Schritt oder einen Aufzählungspunkt unter einem benannten Abschnitt.

`openclaw path` stellt diesen Aufrufern eine stabile Adresse statt eines einmaligen
grep-Ausdrucks, regulären Ausdrucks oder Parsers für jeden Dateityp bereit. Derselbe
`oc://`-Pfad kann im Terminal validiert, aufgelöst, durchsucht, als Probelauf ausgeführt
und geschrieben werden. Dadurch bleibt eng begrenzte Automatisierung überprüfbar und
wiederholbar. Der restliche Dateiinhalt bleibt erhalten, sodass das Schreiben eines
einzelnen Blattwerts weder Kommentare und Zeilenenden noch die benachbarte Formatierung
beeinträchtigt.

Verwenden Sie den Befehl, wenn das gewünschte Element eine logische Adresse besitzt,
die Dateistruktur jedoch variiert:

- Ein Hook liest eine einzelne Einstellung aus einer kommentierten JSONC-Datei, ohne
  beim Zurückschreiben des Werts Kommentare zu verlieren.
- Ein Wartungsskript findet jedes passende Ereignisfeld in einem JSONL-Protokoll,
  ohne das gesamte Protokoll in einen eigenen Parser laden zu müssen.
- Ein Editor springt anhand des Slugs zu einem Markdown-Abschnitt oder Aufzählungspunkt
  und zeigt anschließend genau die aufgelöste Zeile an.
- Ein Agent führt vor dem Anwenden eine kleine Arbeitsbereichsänderung als Probelauf
  aus, wobei die geänderten Bytes bei der Überprüfung sichtbar sind.

Verwenden Sie `openclaw path` nicht für gewöhnliche Bearbeitungen ganzer Dateien,
umfangreiche Konfigurationsmigrationen oder speicherspezifische Schreibvorgänge;
dafür sollte der zuständige Befehl oder das zuständige Plugin verwendet werden. `path`
ist für kleine, adressierbare Dateioperationen vorgesehen, bei denen ein wiederholbarer
Terminalbefehl einem weiteren maßgeschneiderten Parser vorzuziehen ist.

## Verwendung

Lesen Sie einen einzelnen Wert aus einer manuell bearbeiteten Konfigurationsdatei:

```bash
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled'
```

Zeigen Sie einen Schreibvorgang in der Vorschau an, ohne auf den Datenträger zu schreiben:

```bash
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

Suchen Sie passende Datensätze in einem nur angehängten JSONL-Protokoll:

```bash
openclaw path find 'oc://session.jsonl/[event=tool_call]/name'
```

Adressieren Sie eine Anweisung in Markdown anhand von Abschnitt und Element statt anhand
der Zeilennummer:

```bash
openclaw path resolve 'oc://AGENTS.md/runtime-safety/openclaw-gateway'
```

Validieren Sie einen Pfad in CI oder einem Vorprüfungsskript, bevor das Skript liest oder
schreibt:

```bash
openclaw path validate 'oc://AGENTS.md/tools/$last/risk'
```

Diese Befehle sind dafür vorgesehen, in Shell-Skripte übernommen zu werden. Verwenden Sie
`--json`, wenn ein Aufrufer strukturierte Ausgabe benötigt, und `--human`, wenn eine Person
das Ergebnis prüft.

## Funktionsweise

1. Analysiert die `oc://`-Adresse in Felder: Datei, Abschnitt, Element, Feld und eine
   optionale Sitzungsabfrage.
2. Wählt anhand der Zielerweiterung den Adapter für den Dateityp (`.md`, `.jsonc`,
   `.json`, `.jsonl`, `.ndjson`, `.yaml`, `.yml`, `.lobster`).
3. Löst die Felder anhand der Struktur des jeweiligen Dateityps auf: Markdown-
   Überschriften/-Elemente, JSONC-Objektschlüssel/-Arrayindizes, JSONL-Zeilendatensätze
   oder YAML-Zuordnungs-/Sequenzknoten.
4. Gibt bei `set` die bearbeiteten Bytes über denselben Adapter aus, damit unveränderte
   Dateibereiche ihre Kommentare, Zeilenenden und benachbarte Formatierung behalten,
   sofern der Dateityp dies unterstützt.

`resolve` und `set` erfordern ein einzelnes konkretes Ziel. `find` ist das explorative
Verb: Es erweitert Platzhalter, Vereinigungen, Prädikate und Ordinalzahlen zu konkreten
Treffern, die Sie prüfen können, bevor Sie einen davon zum Schreiben auswählen.

## Unterbefehle

| Unterbefehl              | Zweck                                                                                      |
| ------------------------ | ------------------------------------------------------------------------------------------ |
| `resolve <oc-path>`      | Gibt den konkreten Treffer am Pfad aus (oder „nicht gefunden“).                             |
| `find <pattern>`         | Listet Treffer für einen Pfad mit Platzhalter, Vereinigung oder Prädikat auf.               |
| `set <oc-path> <value>`  | Schreibt ein Blatt oder Einfügeziel an einem konkreten Pfad. Unterstützt `--dry-run`.       |
| `validate <oc-path>`     | Nur Analyse; gibt die strukturelle Aufschlüsselung aus (Datei/Abschnitt/Element/Feld).      |
| `emit <file>`            | Durchläuft für eine Datei den Zyklus aus Parsen und Ausgeben (Diagnose der Byte-Treue).     |

## Globale Optionen

| Option          | Gilt für                         | Zweck                                                                                     |
| --------------- | -------------------------------- | ----------------------------------------------------------------------------------------- |
| `--cwd <dir>`   | `resolve`, `find`, `set`, `emit` | Löst das Dateifeld relativ zu diesem Verzeichnis auf (Standard: `process.cwd()`).          |
| `--file <path>` | `resolve`, `find`, `set`, `emit` | Überschreibt den aufgelösten Pfad des Dateifelds (absoluter Zugriff).                      |
| `--json`        | alle                             | Erzwingt JSON-Ausgabe (Standard, wenn stdout kein TTY ist).                                |
| `--human`       | alle                             | Erzwingt menschenlesbare Ausgabe (Standard, wenn stdout ein TTY ist).                     |
| `--value-json`  | `set`                            | Analysiert `<value>` als JSON für den Ersatz eines JSON-/JSONC-/JSONL-Blattwerts.          |
| `--dry-run`     | `set`                            | Gibt die zu schreibenden Bytes aus, ohne sie zu schreiben.                                |
| `--diff`        | `set` (erfordert `--dry-run`)    | Gibt statt der vollständigen Bytes einen vereinheitlichten Diff aus.                      |

`validate` akzeptiert nur `--json`/`--human`; da kein Dateisystemzugriff erfolgt,
gelten `--cwd` und `--file` nicht.

## `oc://`-Syntax

```text
oc://FILE/SECTION/ITEM/FIELD?session=SCOPE
```

Feldregeln: `field` erfordert `item`, und `item` erfordert `section`. Für alle vier
Felder gilt:

- **Segmente in Anführungszeichen** — `"a/b.c"` bleibt trotz der Trennzeichen `/` und `.`
  erhalten. Der Inhalt wird bytegetreu interpretiert; `"` und `\` sind innerhalb der
  Anführungszeichen nicht zulässig. Auch das Dateifeld berücksichtigt Anführungszeichen:
  `oc://"skills/email-drafter"/Tools/$last` behandelt `skills/email-drafter` als einen
  einzelnen Dateipfad.
- **Prädikate** — `[k=v]`, `[k!=v]`, `[k<v]`, `[k<=v]`, `[k>v]`, `[k>=v]`.
  Numerische Operatoren erfordern, dass beide Seiten in endliche Zahlen umgewandelt
  werden können.
- **Vereinigungen** — `{a,b,c}` entspricht jeder der Alternativen.
- **Platzhalter** — `*` (ein einzelnes Untersegment) und `**` (null oder mehr,
  rekursiv). `find` akzeptiert sie; `resolve` und `set` lehnen sie als mehrdeutig ab.
- **Positionell** — `$first`/`$last` werden zum ersten/letzten Index oder deklarierten
  Schlüssel aufgelöst.
- **Ordinal** — `#N` für den N-ten Treffer in Dokumentreihenfolge.
- **Einfügemarkierungen** — `+`, `+key`, `+nnn` für schlüsselbasierte/indexbasierte
  Einfügungen (mit `set` verwenden).
- **Sitzungsbereich** — `?session=cron-daily` usw. Unabhängig von der Verschachtelung
  der Felder. Sitzungswerte sind Rohwerte und werden nicht prozentdekodiert; sie dürfen
  weder Steuerzeichen noch reservierte Abfragetrennzeichen (`?`, `&`, `%`) enthalten.

Reservierte Zeichen (`?`, `&`, `%`) außerhalb von Segmenten in Anführungszeichen,
Prädikaten oder Vereinigungen werden abgelehnt. Steuerzeichen (U+0000–U+001F, U+007F)
werden überall abgelehnt, einschließlich des Werts der `session`-Abfrage.

`formatOcPath(parseOcPath(path)) === path` wird für kanonische Pfade garantiert.
Nicht kanonische Abfrageparameter werden ignoriert, mit Ausnahme des ersten nicht leeren
`session=`-Werts.

Feste Grenzwerte: Ein Pfad ist auf 4096 Bytes, höchstens 4 Felder (Datei/Abschnitt/Element/
Feld), höchstens 64 durch Punkte getrennte Untersegmente je Feld und höchstens 256
verschachtelte Traversierungsebenen für tiefe JSON-Pfade begrenzt. Unabhängig davon wird
jede JSONC-/JSON-Eingabedatei über 16 MiB bei jedem Verb, das die Datei lädt, mit einer
Analysediagnose abgelehnt, statt analysiert zu werden.

## Adressierung nach Dateityp

| Typ           | Dateierweiterungen            | Adressierungsmodell                                                                                             |
| ------------- | ----------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Markdown      | `.md`                         | H2-Abschnitte nach Slug, Aufzählungspunkte nach Slug oder `#N`, Frontmatter über `[frontmatter]`.                |
| JSONC/JSON    | `.jsonc`, `.json`             | Objektschlüssel und Arrayindizes; Punkte trennen verschachtelte Untersegmente, sofern sie nicht zitiert sind.    |
| JSONL         | `.jsonl`, `.ndjson`           | Zeilenadressen auf oberster Ebene (`L1`, `L2`, `$first`, `$last`), danach JSONC-artige Navigation in der Zeile. |
| YAML/.lobster | `.yaml`, `.yml`, `.lobster`   | Zuordnungsschlüssel und Sequenzindizes; Kommentare und Flussstil werden von der YAML-Dokument-API verarbeitet.  |

`resolve` gibt einen strukturierten Treffer zurück: `root`, `node`, `leaf` oder
`insertion-point`, jeweils mit einer 1-basierten Zeilennummer. Blattwerte werden als
Text zusammen mit einem `leafType` bereitgestellt, damit Plugin-Autoren Vorschauen
darstellen können, ohne von der AST-Struktur des jeweiligen Dateityps abhängig zu sein.

## Änderungsvertrag

`set` schreibt ein einzelnes konkretes Ziel:

- Markdown-Frontmatter-Werte und Elementfelder im Format `- key: value` sind
  Zeichenfolgen-Blattwerte. Markdown-Einfügungen hängen Abschnitte, Frontmatter-Schlüssel
  oder Abschnittselemente an und erzeugen für die geänderte Datei eine kanonische
  Markdown-Struktur. Abschnittsinhalte können nicht als Ganzes über `set` geschrieben
  werden.
- Bei JSONC-Blattschreibvorgängen wird der Zeichenfolgenwert in den bestehenden
  Blattwerttyp umgewandelt (`string`, endliche `number`, `true`/`false` oder `null`).
  Verwenden Sie `--value-json`, wenn ein JSONC-/JSON-/JSONL-Blattwert-Ersatz `<value>`
  als JSON analysieren und seine Struktur ändern können soll, etwa beim Ersetzen einer
  Kurzschreibweise für eine geheime Referenz durch ein Objekt. Bei JSONC-Objekt- und
  Array-Einfügungen wird `<value>` als JSON analysiert; gewöhnliche Blattschreibvorgänge
  verwenden den Bearbeitungspfad von `jsonc-parser`, wodurch Kommentare und benachbarte
  Formatierung erhalten bleiben.
- JSONL-Blattschreibvorgänge führen innerhalb einer Zeile dieselbe Typumwandlung wie
  JSONC durch. Beim Ersetzen oder Anhängen ganzer Zeilen wird `<value>` als JSON
  analysiert. Ausgegebenes JSONL behält die vorherrschende LF-/CRLF-Zeilenendenkonvention
  der Datei bei (Mehrheitsentscheidung über alle Zeilenumbrüche der Datei, sodass eine
  überwiegend CRLF-formatierte Datei auch bei einigen vereinzelten LF-Zeilenumbrüchen
  CRLF behält).
- YAML-Blattschreibvorgänge führen eine Typumwandlung in den bestehenden Skalartyp durch
  (`string`, endliche `number`, `true`/`false` oder `null`). YAML-Einfügungen verwenden
  die Dokument-API des mitgelieferten Pakets `yaml` für Aktualisierungen von Zuordnungen
  und Sequenzen. Fehlerhafte YAML-Dokumente mit Parserfehlern werden vor der Änderung
  mit `parse-error` abgelehnt.

Verwenden Sie vor benutzersichtbaren Schreibvorgängen `--dry-run`, wenn die genauen Bytes
wichtig sind. JSONC- und YAML-Bearbeitungen ändern das bestehende Dokument punktuell
(über `jsonc-parser` beziehungsweise die Dokument-API von `yaml`), sodass unveränderte
Bytes normalerweise erhalten bleiben. Markdown erstellt die Datei bei jeder Bearbeitung
aus ihrer analysierten Struktur neu, wodurch nebensächliche Formatierung außerhalb des
geänderten Blattwerts normalisiert werden kann. Fügen Sie `--diff` hinzu, wenn Sie die
Vorschau als gezielten Vorher-/Nachher-Patch statt als vollständige ausgegebene Datei
anzeigen möchten.

## Beispiele

```bash
# Einen Pfad validieren (kein Dateisystemzugriff)
openclaw path validate 'oc://AGENTS.md/Tools/$last/risk'

# Einen Blattwert lesen
openclaw path resolve 'oc://gateway.jsonc/version'

# Platzhaltersuche
openclaw path find 'oc://session.jsonl/*/event' --file ./logs/session.jsonl

# Einen Schreibvorgang als Probelauf ausführen
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run

# Einen Schreibvorgang als vereinheitlichten Diff im Probelauf ausführen
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff

# Den Schreibvorgang anwenden
openclaw path set 'oc://gateway.jsonc/version' '2.0'

# Bytegetreuer Durchlauf (Diagnose)
openclaw path emit ./AGENTS.md
```

Weitere Grammatikbeispiele:

```bash
# Quote keys containing / or .
openclaw path resolve 'oc://config.jsonc/agents.defaults.models/"anthropic/claude-opus-4-7"/alias'

# Deep JSON/JSONC paths can use slash segments; they normalize to dotted subsegments
openclaw path set 'oc://openclaw.json/agents/list/0/tools/exec/security' 'allowlist' --dry-run

# Replace a JSONC leaf with a parsed object
openclaw path set 'oc://openclaw.json/gateway/auth/token' '{"source":"file","provider":"secrets","id":"/test"}' --value-json --dry-run

# Predicate search over JSONC children
openclaw path find 'oc://config.jsonc/plugins/[enabled=true]/id'

# Insert into a JSONC array
openclaw path set 'oc://config.jsonc/items/+1' '{"id":"new","enabled":true}' --dry-run

# Insert a JSONC object key
openclaw path set 'oc://config.jsonc/plugins/+github' '{"enabled":true}' --dry-run

# Append a JSONL event
openclaw path set 'oc://session.jsonl/+' '{"event":"checkpoint","ok":true}' --file ./logs/session.jsonl

# Resolve the last JSONL value line
openclaw path resolve 'oc://session.jsonl/$last/event' --file ./logs/session.jsonl

# Resolve a YAML workflow step
openclaw path resolve 'oc://workflow.yaml/steps/0/id'

# Update a YAML scalar
openclaw path set 'oc://workflow.yaml/steps/$last/id' 'classify-renamed' --dry-run

# Address markdown frontmatter
openclaw path resolve 'oc://AGENTS.md/[frontmatter]/name'

# Insert markdown frontmatter
openclaw path set 'oc://AGENTS.md/[frontmatter]/+description' 'Agent instructions' --dry-run

# Find markdown item fields
openclaw path find 'oc://SKILL.md/Tools/*/send_email'

# Validate a session-scoped path
openclaw path validate 'oc://AGENTS.md/Tools/$last/risk?session=cron-daily'
```

## Rezepte nach Dateityp

Dieselben fünf Verben funktionieren für alle Dateitypen; das Adressierungsschema
wählt anhand der Dateierweiterung die passende Verarbeitung aus.

### Markdown

```text
<!-- frontmatter.md -->
---
name: drafter
description: email drafting agent
tier: core
---
## Tools
- gh: GitHub CLI
- curl: HTTP client
- send_email: enabled
```

```bash
$ openclaw path resolve 'oc://x.md/[frontmatter]/tier' --file frontmatter.md --human
leaf @ L4: "core" (string)

$ openclaw path resolve 'oc://x.md/tools/gh/gh' --file frontmatter.md --human
leaf @ L9: "GitHub CLI" (string)

$ openclaw path find 'oc://x.md/tools/*' --file frontmatter.md --human
3 matches for oc://x.md/tools/*:
  oc://x.md/tools/gh           →  node @ L9 [md-item]
  oc://x.md/tools/curl         →  node @ L10 [md-item]
  oc://x.md/tools/send-email   →  node @ L11 [md-item]
```

Das Prädikat `[frontmatter]` adressiert den YAML-Frontmatter-Block; `tools`
entspricht über den Slug der Überschrift `## Tools`, und die Blätter der
Einträge behalten ihre Slug-Form bei, selbst wenn die Quelle Unterstriche
verwendet (`send_email` wird zu `send-email`).

### JSONC

```text
// config.jsonc
{
  "plugins": {
    "github": {"enabled": true, "role": "vcs"},
    "slack":  {"enabled": false, "role": "chat"}
  }
}
```

```bash
$ openclaw path resolve 'oc://config.jsonc/plugins/github/enabled' --file config.jsonc --human
leaf @ L4: "true" (boolean)

$ openclaw path set 'oc://config.jsonc/plugins/slack/enabled' 'true' --file config.jsonc --dry-run
--dry-run: would write 142 bytes to /…/config.jsonc
{
  "plugins": {
    "github": {"enabled": true, "role": "vcs"},
    "slack":  {"enabled": true, "role": "chat"}
  }
}
```

JSONC-Änderungen werden über `jsonc-parser` ausgeführt, sodass Kommentare und
Leerraum bei einem `set` erhalten bleiben. Führen Sie den Befehl zuerst mit
`--dry-run` aus, um die Bytes vor dem Schreiben zu prüfen. `.json`-Dateien
verwenden denselben Adapter und denselben Änderungspfad wie `.jsonc`.

### JSONL

```text
{"event":"start","userId":"u1","ts":1}
{"event":"action","userId":"u1","ts":2}
{"event":"end","userId":"u1","ts":3}
```

```bash
$ openclaw path find 'oc://session.jsonl/[event=action]/userId' --file session.jsonl --human
1 match for oc://session.jsonl/[event=action]/userId:
  oc://session.jsonl/L2/userId  →  leaf @ L2: "u1" (string)

$ openclaw path resolve 'oc://session.jsonl/L2/ts' --file session.jsonl --human
leaf @ L2: "2" (number)
```

Jede Zeile ist ein Datensatz. Adressieren Sie ihn über ein Prädikat
(`[event=action]`), wenn Sie die Zeilennummer nicht kennen, oder andernfalls
über das kanonische Segment `LN`. `.ndjson`-Dateien verwenden denselben
Adapter wie `.jsonl`.

### YAML

```text
# workflow.yaml
name: inbox-triage
steps:
  - id: fetch
    command: gmail.search
  - id: classify
    command: openclaw.invoke
```

```bash
$ openclaw path resolve 'oc://workflow.yaml/steps/0/id' --file workflow.yaml --human
leaf @ L3: "fetch" (string)

$ openclaw path set 'oc://workflow.yaml/steps/$last/id' 'classify-renamed' --file workflow.yaml --dry-run
--dry-run: would write 99 bytes to /…/workflow.yaml
name: inbox-triage
steps:
  - id: fetch
    command: gmail.search
  - id: classify-renamed
    command: openclaw.invoke
```

YAML verwendet die `Document`-API des Pakets `yaml` statt eines selbst
entwickelten Parsers. Dadurch bleiben bei gewöhnlichen Parse-/Ausgabezyklen
Kommentare und die ursprüngliche Form erhalten, während aufgelöste Pfade
dasselbe Modell aus Zuordnungsschlüsseln und Sequenzindizes wie JSONC
verwenden. Derselbe Adapter verarbeitet `.yaml`-, `.yml`- und
`.lobster`-Dateien.

## Unterbefehlsreferenz

### `resolve <oc-path>`

Liest ein einzelnes Blatt oder einen einzelnen Knoten. Platzhalter werden
abgelehnt – verwenden Sie dafür `find`. Der Befehl wird bei einem Treffer mit
`0`, bei einem regulären Fehlschlag mit `1` und bei einem Parsefehler oder
abgelehnten Muster mit `2` beendet.

```bash
openclaw path resolve 'oc://AGENTS.md/tools/gh/risk' --human
openclaw path resolve 'oc://gateway.jsonc/server/port' --json
```

### `find <pattern>`

Listet jeden Treffer für ein Platzhalter-, Prädikat- oder Vereinigungsmuster
auf. Der Befehl wird bei mindestens einem Treffer mit `0`, bei keinem Treffer
mit `1` beendet. Platzhalter im Dateisegment werden mit
`OC_PATH_FILE_WILDCARD_UNSUPPORTED` abgelehnt – geben Sie eine konkrete Datei
an (Globbing über mehrere Dateien ist eine geplante Folgefunktion).

```bash
openclaw path find 'oc://AGENTS.md/tools/**/risk'
openclaw path find 'oc://session.jsonl/[event=action]/userId'
openclaw path find 'oc://config.jsonc/plugins/{github,slack}/enabled'
```

### `set <oc-path> <value>`

Schreibt ein Blatt. Verwenden Sie zusätzlich `--dry-run`, um die zu
schreibenden Bytes in einer Vorschau anzuzeigen, ohne die Datei zu verändern.
Fügen Sie `--diff` hinzu, um eine Vorschau als vereinheitlichte
Differenzdarstellung zu erhalten. Der Befehl wird nach erfolgreichem Schreiben
mit `0`, bei einer Ablehnung durch die zugrunde liegende Verarbeitung
(beispielsweise beim Auslösen einer Wächterprüfung für Sentinel-Werte) mit `1`
und bei Parsefehlern mit `2` beendet.

```bash
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff
openclaw path set 'oc://gateway.jsonc/version' '2.0'
openclaw path set 'oc://AGENTS.md/Tools/+gh/risk' 'low'
```

Die Einfügemarkierung `+key` erstellt das benannte untergeordnete Element,
sofern es noch nicht vorhanden ist; `+nnn` und ein einzelnes `+` dienen
entsprechend zum indizierten Einfügen und zum Anhängen.

### `validate <oc-path>`

Prüfung ausschließlich durch Parsen. Kein Dateisystemzugriff. Dies ist
nützlich, wenn Sie vor dem Ersetzen von Variablen bestätigen möchten, dass ein
Vorlagenpfad korrekt aufgebaut ist, oder wenn Sie zur Fehlerdiagnose die
strukturelle Aufschlüsselung benötigen:

```bash
$ openclaw path validate 'oc://AGENTS.md/tools/gh' --human
valid: oc://AGENTS.md/tools/gh
  file:    AGENTS.md
  section: tools
  item:    gh
```

Der Befehl wird bei einem gültigen Pfad mit `0`, bei einem ungültigen Pfad
(mit strukturiertem `code` und `message`) mit `1` und bei Argumentfehlern mit
`2` beendet.

### `emit <file>`

Verarbeitet eine Datei mit dem Parser und der Ausgabeimplementierung des
jeweiligen Dateityps. Bei einer fehlerfreien Datei sollte die Ausgabe
bytegenau mit der Eingabe übereinstimmen; Abweichungen weisen auf einen
Parserfehler oder das Auslösen einer Sentinel-Prüfung hin. Dies ist nützlich,
um das Verhalten der zugrunde liegenden Verarbeitung anhand realer Eingaben
zu diagnostizieren.

```bash
openclaw path emit ./AGENTS.md
openclaw path emit ./gateway.jsonc --json
```

## Beendigungscodes

| Code | Bedeutung                                                                                       |
| ---- | ----------------------------------------------------------------------------------------------- |
| `0`  | Erfolg. (`resolve` / `find`: mindestens ein Treffer. `set`: Schreiben erfolgreich.)             |
| `1`  | Kein Treffer oder `set` wurde von der zugrunde liegenden Verarbeitung abgelehnt (kein Systemfehler). |
| `2`  | Argument- oder Parsefehler.                                                                     |

## Ausgabemodus

`openclaw path` erkennt TTYs: Auf einem Terminal erfolgt eine
menschenlesbare Ausgabe, bei weitergeleiteter oder umgeleiteter
Standardausgabe wird JSON verwendet. `--json` und `--human` überschreiben die
automatische Erkennung.

## Hinweise

- `set` schreibt Bytes über den Ausgabepfad der zugrunde liegenden
  Verarbeitung, der automatisch die Wächterprüfung für
  Schwärzungs-Sentinel-Werte anwendet. Ein Blatt, das
  `__OPENCLAW_REDACTED__` enthält (wortwörtlich oder als Teilzeichenfolge),
  wird beim Schreiben abgelehnt.
- Das Parsen von JSONC und Änderungen an Blättern verwenden die lokale
  Plugin-Abhängigkeit `jsonc-parser`. Dadurch bleiben Kommentare und
  Formatierung bei gewöhnlichen Schreibvorgängen an Blättern erhalten, statt
  einen selbst entwickelten Parser- und Neudarstellungspfad zu durchlaufen.
- `path` berücksichtigt weder die Nachverfolgung noch die Wiederherstellung
  der letzten als funktionsfähig bekannten Konfiguration (LKG); dieser
  Lebenszyklus wird an anderer Stelle verwaltet. Wenn eine über `path`
  bearbeitete Datei auch per LKG nachverfolgt wird, entscheidet der nächste
  Konfigurationslesevorgang, ob sie übernommen oder wiederhergestellt wird.
  Behandeln Sie eine Änderung über `path` wie jeden anderen direkten
  Schreibvorgang in diese Datei.

## Verwandte Themen

- [CLI-Referenz](/de/cli)
