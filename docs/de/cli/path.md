---
read_when:
    - Sie möchten im Terminal einen Blattknoten innerhalb einer Workspace-Datei lesen oder schreiben
    - Sie schreiben Skripte für den Workspace-Status und benötigen ein stabiles, vom Typ unabhängiges Adressierungsschema.
    - Sie debuggen einen `oc://`-Pfad (validieren Sie die Syntax und prüfen Sie, wohin er aufgelöst wird)
summary: CLI-Referenz für `openclaw path` (Arbeitsbereichsdateien über das Adressierungsschema `oc://` prüfen und bearbeiten)
title: Pfad
x-i18n:
    generated_at: "2026-07-12T15:10:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 7afe5bd1c3a5fca8dd22c7d807e390e751ae7e895c54bf0e10e2734f3889436c
    source_path: cli/path.md
    workflow: 16
---

# `openclaw path`

Shell-Zugriff auf das Adressierungsschema `oc://`: eine Syntax für nach Typ weitergeleitete Pfade
zum Prüfen und Bearbeiten adressierbarer Workspace-Dateien (Markdown, JSONC,
JSONL, YAML/YML/Lobster). Betreiber selbst gehosteter Instanzen, Plugin-Autoren und Editor-Erweiterungen
verwenden sie, um einen eng begrenzten Speicherort zu lesen, zu finden oder zu aktualisieren, ohne
für jeden Dateityp einen eigenen Parser zu erstellen.

`path` wird vom mitgelieferten optionalen Plugin `oc-path` bereitgestellt. Aktivieren Sie es vor
der ersten Verwendung:

```bash
openclaw plugins enable oc-path
```

Die CLI-Verben entsprechen dem Adressierungsmodell:

- `resolve` ist konkret und liefert genau einen Treffer.
- `find` ist das Verb für mehrere Treffer bei Platzhaltern, Vereinigungen, Prädikaten und
  positioneller Expansion.
- `set` akzeptiert nur konkrete Pfade oder Einfügemarkierungen; Platzhaltermuster
  werden vor dem Schreiben abgelehnt.
- `validate` parst einen Pfad ohne Dateisystemzugriff.
- `emit` führt eine Datei durch Parsen + Ausgeben im Rundlauf (Diagnose der Byte-Treue).

## Gründe für die Verwendung

Der OpenClaw-Zustand ist über manuell bearbeitetes Markdown, kommentierte JSONC-
Konfigurationen, ausschließlich angehängte JSONL-Protokolle und YAML-Workflow-/Spezifikationsdateien verteilt. Skripte, Hooks
und Agenten benötigen aus diesen Dateien häufig nur einen kleinen Wert: einen Frontmatter-Schlüssel, eine
Plugin-Einstellung, ein Feld eines Protokolldatensatzes, einen YAML-Schritt oder einen Aufzählungspunkt unter einem
benannten Abschnitt.

`openclaw path` stellt diesen Aufrufern eine stabile Adresse bereit, statt für jeden Dateityp
einen einmaligen grep-Befehl, regulären Ausdruck oder Parser zu benötigen. Derselbe `oc://`-Pfad kann
im Terminal validiert, aufgelöst, durchsucht, als Probelauf ausgeführt und geschrieben werden. Dadurch bleibt eng begrenzte
Automatisierung überprüfbar und wiederholbar. Der Rest der Datei bleibt erhalten, sodass
das Schreiben eines einzelnen Blatts weder Kommentare noch Zeilenenden oder die Formatierung
in der Nähe beeinträchtigt.

Verwenden Sie den Befehl, wenn das gewünschte Element eine logische Adresse besitzt, die Dateistruktur
jedoch variiert:

- Ein Hook liest eine einzelne Einstellung aus kommentiertem JSONC, ohne Kommentare zu verlieren, wenn
  er den Wert zurückschreibt.
- Ein Wartungsskript findet jedes übereinstimmende Ereignisfeld in einem JSONL-Protokoll,
  ohne das gesamte Protokoll in einen benutzerdefinierten Parser zu laden.
- Ein Editor springt anhand des Slugs zu einem Markdown-Abschnitt oder Aufzählungspunkt und zeigt anschließend
  genau die aufgelöste Zeile an.
- Ein Agent führt vor der Anwendung eine kleine Workspace-Änderung als Probelauf aus, wobei die
  geänderten Bytes in der Überprüfung sichtbar sind.

Verwenden Sie `openclaw path` nicht für gewöhnliche Änderungen an vollständigen Dateien, umfangreiche Konfigurationsmigrationen oder
speicherspezifische Schreibvorgänge; dafür sollte der zuständige Befehl oder das zuständige Plugin verwendet werden. `path`
ist für kleine, adressierbare Dateioperationen vorgesehen, bei denen ein wiederholbarer Terminalbefehl
einem weiteren speziell angefertigten Parser überlegen ist.

## Verwendung

Lesen Sie einen einzelnen Wert aus einer manuell bearbeiteten Konfigurationsdatei:

```bash
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled'
```

Zeigen Sie eine Vorschau eines Schreibvorgangs an, ohne den Datenträger zu verändern:

```bash
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

Finden Sie übereinstimmende Datensätze in einem ausschließlich angehängten JSONL-Protokoll:

```bash
openclaw path find 'oc://session.jsonl/[event=tool_call]/name'
```

Adressieren Sie eine Anweisung in Markdown anhand von Abschnitt und Element statt anhand der
Zeilennummer:

```bash
openclaw path resolve 'oc://AGENTS.md/runtime-safety/openclaw-gateway'
```

Validieren Sie einen Pfad in CI oder einem vorbereitenden Skript, bevor das Skript liest oder
schreibt:

```bash
openclaw path validate 'oc://AGENTS.md/tools/$last/risk'
```

Diese Befehle sind so ausgelegt, dass sie in Shell-Skripte kopiert werden können. Verwenden Sie `--json`, wenn
ein Aufrufer eine strukturierte Ausgabe benötigt, und `--human`, wenn eine Person
das Ergebnis prüft.

## Funktionsweise

1. Parst die `oc://`-Adresse in Slots: Datei, Abschnitt, Element, Feld und eine
   optionale Sitzungsabfrage.
2. Wählt den Adapter für den Dateityp anhand der Zielerweiterung (`.md`, `.jsonc`,
   `.json`, `.jsonl`, `.ndjson`, `.yaml`, `.yml`, `.lobster`).
3. Löst die Slots anhand der Struktur des jeweiligen Dateityps auf: Markdown-
   Überschriften/-Elemente, JSONC-Objektschlüssel/-Array-Indizes, JSONL-Zeilendatensätze oder
   YAML-Zuordnungs-/Sequenzknoten.
4. Gibt bei `set` die bearbeiteten Bytes über denselben Adapter aus, sodass unberührte Teile
   der Datei ihre Kommentare, Zeilenenden und Formatierung in der Nähe behalten, sofern
   der Dateityp dies unterstützt.

`resolve` und `set` erfordern genau ein konkretes Ziel. `find` ist das explorative
Verb: Es expandiert Platzhalter, Vereinigungen, Prädikate und Ordinalzahlen zu den konkreten
Treffern, die Sie prüfen können, bevor Sie einen zum Schreiben auswählen.

## Unterbefehle

| Unterbefehl              | Zweck                                                                     |
| ----------------------- | --------------------------------------------------------------------------- |
| `resolve <oc-path>`     | Gibt den konkreten Treffer am Pfad aus (oder „nicht gefunden“).                      |
| `find <pattern>`        | Listet Treffer für einen Pfad mit Platzhaltern, Vereinigungen oder Prädikaten auf.                  |
| `set <oc-path> <value>` | Schreibt ein Blatt oder Einfügeziel an einem konkreten Pfad. Unterstützt `--dry-run`.  |
| `validate <oc-path>`    | Nur parsen; gibt die strukturelle Aufschlüsselung aus (Datei / Abschnitt / Element / Feld). |
| `emit <file>`           | Führt eine Datei durch Parsen + Ausgeben im Rundlauf (Diagnose der Byte-Treue).          |

## Globale Optionen

| Option            | Gilt für                       | Zweck                                                                  |
| --------------- | -------------------------------- | ------------------------------------------------------------------------ |
| `--cwd <dir>`   | `resolve`, `find`, `set`, `emit` | Löst den Datei-Slot relativ zu diesem Verzeichnis auf (Standard: `process.cwd()`). |
| `--file <path>` | `resolve`, `find`, `set`, `emit` | Überschreibt den aufgelösten Pfad des Datei-Slots (absoluter Zugriff).                |
| `--json`        | alle                              | Erzwingt die JSON-Ausgabe (Standard, wenn stdout kein TTY ist).                    |
| `--human`       | alle                              | Erzwingt die menschenlesbare Ausgabe (Standard, wenn stdout ein TTY ist).                       |
| `--value-json`  | `set`                            | Parst `<value>` als JSON zum Ersetzen eines JSON-/JSONC-/JSONL-Blatts.           |
| `--dry-run`     | `set`                            | Gibt die Bytes aus, die geschrieben würden, ohne zu schreiben.                   |
| `--diff`        | `set` (erfordert `--dry-run`)     | Gibt statt der vollständigen Bytes einen einheitlichen Diff aus.                          |

`validate` akzeptiert nur `--json` / `--human`; es greift nicht auf das Dateisystem zu, daher
gelten `--cwd` und `--file` nicht.

## `oc://`-Syntax

```text
oc://FILE/SECTION/ITEM/FIELD?session=SCOPE
```

Slot-Regeln: `field` erfordert `item`, und `item` erfordert `section`. Für
alle vier Slots gilt:

- **Segmente in Anführungszeichen** — `"a/b.c"` übersteht die Trennzeichen `/` und `.`. Der Inhalt ist
  bytegetreu; `"` und `\` sind innerhalb der Anführungszeichen nicht zulässig. Auch der Datei-Slot
  berücksichtigt Anführungszeichen: `oc://"skills/email-drafter"/Tools/$last` behandelt
  `skills/email-drafter` als einen einzelnen Dateipfad.
- **Prädikate** — `[k=v]`, `[k!=v]`, `[k<v]`, `[k<=v]`, `[k>v]`, `[k>=v]`.
  Numerische Operatoren setzen voraus, dass beide Seiten in endliche Zahlen konvertiert werden können.
- **Vereinigungen** — `{a,b,c}` stimmt mit jeder der Alternativen überein.
- **Platzhalter** — `*` (ein einzelnes Untersegment) und `**` (null oder mehr,
  rekursiv). `find` akzeptiert sie; `resolve` und `set` lehnen sie als
  mehrdeutig ab.
- **Positionell** — `$first` / `$last` werden zum ersten / letzten Index oder
  deklarierten Schlüssel aufgelöst.
- **Ordinal** — `#N` für den N-ten Treffer in Dokumentreihenfolge.
- **Einfügemarkierungen** — `+`, `+key`, `+nnn` für schlüsselbasierte / indizierte Einfügungen
  (mit `set` verwenden).
- **Sitzungsbereich** — `?session=cron-daily` usw. Unabhängig von der Slot-Verschachtelung.
  Sitzungswerte sind Rohwerte und werden nicht prozentdekodiert; sie dürfen keine Steuerzeichen
  oder reservierten Abfragetrennzeichen (`?`, `&`, `%`) enthalten.

Reservierte Zeichen (`?`, `&`, `%`) außerhalb von Segmenten in Anführungszeichen, Prädikaten oder Vereinigungen
werden abgelehnt. Steuerzeichen (U+0000-U+001F, U+007F) werden
überall abgelehnt, einschließlich des Werts der `session`-Abfrage.

`formatOcPath(parseOcPath(path)) === path` wird für kanonische Pfade garantiert.
Nicht kanonische Abfrageparameter werden mit Ausnahme des ersten nicht leeren
`session=`-Werts ignoriert.

Feste Grenzen: Ein Pfad ist auf 4096 Bytes, höchstens 4 Slots (Datei/Abschnitt/Element/
Feld), höchstens 64 durch Punkte getrennte Untersegmente pro Slot und höchstens 256 verschachtelte
Traversal-Ebenen für tiefe JSON-Pfade begrenzt. Unabhängig davon wird jede JSONC-/JSON-Eingabedatei
über 16 MiB mit einer Parsediagnose abgelehnt, statt geparst zu werden, und zwar
für jedes Verb, das diese Datei lädt.

## Adressierung nach Dateityp

| Typ          | Dateierweiterungen             | Adressierungsmodell                                                                                    |
| ------------- | --------------------------- | --------------------------------------------------------------------------------------------------- |
| Markdown      | `.md`                       | H2-Abschnitte nach Slug, Aufzählungspunkte nach Slug oder `#N`, Frontmatter über `[frontmatter]`.                 |
| JSONC/JSON    | `.jsonc`, `.json`           | Objektschlüssel und Array-Indizes; Punkte trennen verschachtelte Untersegmente, sofern sie nicht in Anführungszeichen stehen.                        |
| JSONL         | `.jsonl`, `.ndjson`         | Zeilenadressen auf oberster Ebene (`L1`, `L2`, `$first`, `$last`), danach Abstieg im JSONC-Stil innerhalb der Zeile. |
| YAML/.lobster | `.yaml`, `.yml`, `.lobster` | Zuordnungsschlüssel und Sequenzindizes; Kommentare und Flussstil werden von der YAML-Dokument-API verarbeitet.        |

`resolve` gibt einen strukturierten Treffer zurück: `root`, `node`, `leaf` oder
`insertion-point`, mit einer 1-basierten Zeilennummer. Blattwerte werden als
Text plus `leafType` bereitgestellt, sodass Plugin-Autoren Vorschauen anzeigen können, ohne
von der AST-Struktur des jeweiligen Dateityps abhängig zu sein.

## Mutationsvertrag

`set` schreibt genau ein konkretes Ziel:

- Markdown-Frontmatter-Werte und Elementfelder im Format `- key: value` sind String-
  Blätter. Markdown-Einfügungen hängen Abschnitte, Frontmatter-Schlüssel oder Abschnittselemente
  an und erzeugen eine kanonische Markdown-Struktur für die geänderte Datei. Abschnittsinhalte
  können nicht als Ganzes über `set` geschrieben werden.
- JSONC-Blattschreibvorgänge konvertieren den String-Wert in den Typ des bestehenden Blatts
  (`string`, endliche `number`, `true`/`false` oder `null`). Verwenden Sie `--value-json`,
  wenn beim Ersetzen eines JSONC-/JSON-/JSONL-Blatts `<value>` als JSON geparst werden und
  die Struktur ändern darf, etwa wenn eine Kurzschreibweise für eine String-Geheimnisreferenz durch ein
  Objekt ersetzt wird. JSONC-Objekt- und Array-Einfügungen parsen `<value>` als JSON und verwenden
  den Bearbeitungspfad von `jsonc-parser` für gewöhnliche Blattschreibvorgänge, wobei Kommentare
  und die Formatierung in der Nähe erhalten bleiben.
- JSONL-Blattschreibvorgänge konvertieren innerhalb einer Zeile wie JSONC. Ersetzungen vollständiger Zeilen
  und Anhängeoperationen parsen `<value>` als JSON. Gerendertes JSONL behält die vorherrschende
  LF-/CRLF-Zeilenendenkonvention der Datei bei (Mehrheitsentscheidung über die
  Zeilenumbrüche der Datei, sodass eine Datei mit überwiegend CRLF auch bei einigen vereinzelten LFs CRLF beibehält).
- YAML-Blattschreibvorgänge konvertieren in den bestehenden Skalartyp (`string`, endliche
  `number`, `true`/`false` oder `null`). YAML-Einfügungen verwenden die Dokument-API des mitgelieferten
  Pakets `yaml` für Zuordnungs-/Sequenzaktualisierungen. Fehlerhafte YAML-
  Dokumente mit Parserfehlern werden vor einer Mutation mit
  `parse-error` abgelehnt.

Verwenden Sie `--dry-run` vor für Benutzer sichtbaren Schreibvorgängen, wenn die exakten Bytes wichtig sind. JSONC-
und YAML-Bearbeitungen patchen das bestehende Dokument (über `jsonc-parser` oder die Dokument-API von `yaml`),
sodass unberührte Bytes normalerweise erhalten bleiben; Markdown erstellt die Datei
bei jeder Bearbeitung aus ihrer geparsten Struktur neu, wodurch beiläufige
Formatierungen außerhalb des geänderten Blatts normalisiert werden können. Fügen Sie `--diff` hinzu, wenn Sie die Vorschau
als fokussierten Vorher-/Nachher-Patch statt als vollständige gerenderte Datei anzeigen möchten.

## Beispiele

```bash
# Einen Pfad validieren (kein Dateisystemzugriff)
openclaw path validate 'oc://AGENTS.md/Tools/$last/risk'

# Ein Blatt lesen
openclaw path resolve 'oc://gateway.jsonc/version'

# Platzhaltersuche
openclaw path find 'oc://session.jsonl/*/event' --file ./logs/session.jsonl

# Einen Schreibvorgang als Probelauf ausführen
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run

# Einen Schreibvorgang als einheitlichen Diff im Probelauf ausführen
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff

# Den Schreibvorgang anwenden
openclaw path set 'oc://gateway.jsonc/version' '2.0'

# Bytegetreuer Rundlauf (Diagnose)
openclaw path emit ./AGENTS.md
```

Weitere Grammatikbeispiele:

```bash
# Schlüssel, die / oder . enthalten, in Anführungszeichen setzen
openclaw path resolve 'oc://config.jsonc/agents.defaults.models/"anthropic/claude-opus-4-7"/alias'

# Tiefe JSON/JSONC-Pfade können Schrägstrichsegmente verwenden; diese werden in durch Punkte getrennte Untersegmente normalisiert
openclaw path set 'oc://openclaw.json/agents/list/0/tools/exec/security' 'allowlist' --dry-run

# Einen JSONC-Blattwert durch ein geparstes Objekt ersetzen
openclaw path set 'oc://openclaw.json/gateway/auth/token' '{"source":"file","provider":"secrets","id":"/test"}' --value-json --dry-run

# Prädikatssuche in untergeordneten JSONC-Elementen
openclaw path find 'oc://config.jsonc/plugins/[enabled=true]/id'

# In ein JSONC-Array einfügen
openclaw path set 'oc://config.jsonc/items/+1' '{"id":"new","enabled":true}' --dry-run

# Einen JSONC-Objektschlüssel einfügen
openclaw path set 'oc://config.jsonc/plugins/+github' '{"enabled":true}' --dry-run

# Ein JSONL-Ereignis anhängen
openclaw path set 'oc://session.jsonl/+' '{"event":"checkpoint","ok":true}' --file ./logs/session.jsonl

# Die letzte JSONL-Wertzeile auflösen
openclaw path resolve 'oc://session.jsonl/$last/event' --file ./logs/session.jsonl

# Einen YAML-Workflow-Schritt auflösen
openclaw path resolve 'oc://workflow.yaml/steps/0/id'

# Einen YAML-Skalar aktualisieren
openclaw path set 'oc://workflow.yaml/steps/$last/id' 'classify-renamed' --dry-run

# Markdown-Frontmatter adressieren
openclaw path resolve 'oc://AGENTS.md/[frontmatter]/name'

# Markdown-Frontmatter einfügen
openclaw path set 'oc://AGENTS.md/[frontmatter]/+description' 'Agent-Anweisungen' --dry-run

# Felder von Markdown-Elementen suchen
openclaw path find 'oc://SKILL.md/Tools/*/send_email'

# Einen sitzungsbezogenen Pfad validieren
openclaw path validate 'oc://AGENTS.md/Tools/$last/risk?session=cron-daily'
```

## Rezepte nach Dateityp

Dieselben fünf Verben funktionieren für alle Typen; das Adressierungsschema wählt
anhand der Dateierweiterung die passende Verarbeitung aus.

### Markdown

```text
<!-- frontmatter.md -->
---
name: Entwurfsersteller
description: Agent zum Verfassen von E-Mail-Entwürfen
tier: Kern
---
## Werkzeuge
- gh: GitHub-CLI
- curl: HTTP-Client
- send_email: aktiviert
```

```bash
$ openclaw path resolve 'oc://x.md/[frontmatter]/tier' --file frontmatter.md --human
Blatt @ Z4: "Kern" (Zeichenfolge)

$ openclaw path resolve 'oc://x.md/tools/gh/gh' --file frontmatter.md --human
Blatt @ Z9: "GitHub-CLI" (Zeichenfolge)

$ openclaw path find 'oc://x.md/tools/*' --file frontmatter.md --human
3 Treffer für oc://x.md/tools/*:
  oc://x.md/tools/gh           →  Knoten @ Z9 [md-item]
  oc://x.md/tools/curl         →  Knoten @ Z10 [md-item]
  oc://x.md/tools/send-email   →  Knoten @ Z11 [md-item]
```

Das Prädikat `[frontmatter]` adressiert den YAML-Frontmatter-Block; `tools`
entspricht der Überschrift `## Tools` über deren Slug, und die Blätter der Elemente behalten
ihre Slug-Form bei, selbst wenn die Quelle Unterstriche verwendet (`send_email` wird zu `send-email`).

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
Blatt @ Z4: "true" (boolescher Wert)

$ openclaw path set 'oc://config.jsonc/plugins/slack/enabled' 'true' --file config.jsonc --dry-run
--dry-run: würde 142 Byte nach /…/config.jsonc schreiben
{
  "plugins": {
    "github": {"enabled": true, "role": "vcs"},
    "slack":  {"enabled": true, "role": "chat"}
  }
}
```

JSONC-Bearbeitungen erfolgen über `jsonc-parser`, sodass Kommentare und Leerraum einen
`set`-Vorgang überstehen. Führen Sie den Befehl zuerst mit `--dry-run` aus, um die Bytefolge vor dem Übernehmen zu prüfen.
`.json`-Dateien verwenden denselben Adapter und Bearbeitungspfad wie `.jsonc`.

### JSONL

```text
{"event":"start","userId":"u1","ts":1}
{"event":"action","userId":"u1","ts":2}
{"event":"end","userId":"u1","ts":3}
```

```bash
$ openclaw path find 'oc://session.jsonl/[event=action]/userId' --file session.jsonl --human
1 Treffer für oc://session.jsonl/[event=action]/userId:
  oc://session.jsonl/L2/userId  →  Blatt @ Z2: "u1" (Zeichenfolge)

$ openclaw path resolve 'oc://session.jsonl/L2/ts' --file session.jsonl --human
Blatt @ Z2: "2" (Zahl)
```

Jede Zeile ist ein Datensatz. Adressieren Sie ihn über ein Prädikat (`[event=action]`), wenn Sie
die Zeilennummer nicht kennen, oder über das kanonische `LN`-Segment, wenn sie bekannt ist.
`.ndjson`-Dateien verwenden denselben Adapter wie `.jsonl`.

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
Blatt @ Z3: "fetch" (Zeichenfolge)

$ openclaw path set 'oc://workflow.yaml/steps/$last/id' 'classify-renamed' --file workflow.yaml --dry-run
--dry-run: würde 99 Byte nach /…/workflow.yaml schreiben
name: inbox-triage
steps:
  - id: fetch
    command: gmail.search
  - id: classify-renamed
    command: openclaw.invoke
```

YAML verwendet die `Document`-API des Pakets `yaml` statt eines selbst entwickelten
Parsers. Dadurch bleiben Kommentare und die Autorenstruktur bei gewöhnlichen Parse-/Ausgabe-Rundläufen
erhalten, während aufgelöste Pfade dasselbe Modell aus Zuordnungsschlüsseln und Sequenzindizes wie
JSONC verwenden. Derselbe Adapter verarbeitet `.yaml`-, `.yml`- und `.lobster`-Dateien.

## Unterbefehlsreferenz

### `resolve <oc-path>`

Liest ein einzelnes Blatt oder einen einzelnen Knoten. Platzhalter werden abgelehnt – verwenden Sie dafür `find`.
Beendet sich bei einem Treffer mit `0`, bei einem regulären Fehltreffer mit `1` und bei einem Parsefehler oder abgelehnten
Muster mit `2`.

```bash
openclaw path resolve 'oc://AGENTS.md/tools/gh/risk' --human
openclaw path resolve 'oc://gateway.jsonc/server/port' --json
```

### `find <pattern>`

Listet alle Treffer für ein Platzhalter-, Prädikat- oder Vereinigungsmuster auf. Beendet sich
bei mindestens einem Treffer mit `0`, bei keinem Treffer mit `1`. Platzhalter im Dateifeld werden mit
`OC_PATH_FILE_WILDCARD_UNSUPPORTED` abgelehnt – übergeben Sie eine konkrete Datei (Globbing über
mehrere Dateien ist eine geplante Folgefunktion).

```bash
openclaw path find 'oc://AGENTS.md/tools/**/risk'
openclaw path find 'oc://session.jsonl/[event=action]/userId'
openclaw path find 'oc://config.jsonc/plugins/{github,slack}/enabled'
```

### `set <oc-path> <value>`

Schreibt ein Blatt. Verwenden Sie zusätzlich `--dry-run`, um die zu schreibende Bytefolge
vorab anzuzeigen, ohne die Datei zu verändern. Fügen Sie `--diff` für eine Vorschau als einheitliches Diff hinzu.
Beendet sich bei einem erfolgreichen Schreibvorgang mit `0`, mit `1`, wenn die zugrunde liegende Schicht den Vorgang ablehnt (zum Beispiel
bei Auslösung einer Sentinel-Schutzprüfung), und bei Parsefehlern mit `2`.

```bash
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff
openclaw path set 'oc://gateway.jsonc/version' '2.0'
openclaw path set 'oc://AGENTS.md/Tools/+gh/risk' 'low'
```

Die Einfügemarkierung `+key` erstellt das benannte untergeordnete Element, falls es noch nicht
vorhanden ist; `+nnn` und ein alleinstehendes `+` dienen entsprechend zum indexierten Einfügen und Anhängen.

### `validate <oc-path>`

Reine Parseprüfung. Kein Dateisystemzugriff. Nützlich, wenn Sie bestätigen möchten, dass ein
Vorlagenpfad wohlgeformt ist, bevor Sie Variablen ersetzen, oder wenn Sie
die strukturelle Aufschlüsselung zur Fehlerdiagnose benötigen:

```bash
$ openclaw path validate 'oc://AGENTS.md/tools/gh' --human
gültig: oc://AGENTS.md/tools/gh
  Datei:     AGENTS.md
  Abschnitt: tools
  Element:   gh
```

Beendet sich bei Gültigkeit mit `0`, bei Ungültigkeit mit `1` (mit strukturiertem `code` und
`message`) und bei Argumentfehlern mit `2`.

### `emit <file>`

Führt eine Datei durch den dateitypspezifischen Parser und Emitter. Die Ausgabe sollte
bei einer fehlerfreien Datei bytegenau mit der Eingabe übereinstimmen; Abweichungen weisen auf einen
Parserfehler oder die Auslösung eines Sentinels hin. Nützlich zur Fehlerdiagnose des Verhaltens der zugrunde liegenden Schicht bei
realen Eingaben.

```bash
openclaw path emit ./AGENTS.md
openclaw path emit ./gateway.jsonc --json
```

## Exitcodes

| Code | Bedeutung                                                                                             |
| ---- | ----------------------------------------------------------------------------------------------------- |
| `0`  | Erfolg. (`resolve` / `find`: mindestens ein Treffer. `set`: Schreibvorgang erfolgreich.)              |
| `1`  | Kein Treffer oder `set` wurde von der zugrunde liegenden Schicht abgelehnt (kein Fehler auf Systemebene). |
| `2`  | Argument- oder Parsefehler.                                                                           |

## Ausgabemodus

`openclaw path` erkennt TTYs: menschenlesbare Ausgabe in einem Terminal, JSON, wenn
stdout weitergeleitet oder umgeleitet wird. `--json` und `--human` überschreiben die
automatische Erkennung.

## Hinweise

- `set` schreibt Bytefolgen über den Ausgabepfad der zugrunde liegenden Schicht, der die
  Schutzprüfung für Schwärzungs-Sentinels automatisch anwendet. Ein Blatt, das
  `__OPENCLAW_REDACTED__` enthält (wörtlich oder als Teilzeichenfolge), wird beim
  Schreiben abgelehnt.
- JSONC-Parsing und Bearbeitungen von Blättern verwenden die Plugin-lokale Abhängigkeit `jsonc-parser`,
  sodass Kommentare und Formatierung bei gewöhnlichen Schreibvorgängen an Blättern erhalten
  bleiben, statt einen selbst entwickelten Parser-/Neuformatierungspfad zu durchlaufen.
- `path` berücksichtigt weder die Nachverfolgung noch die Wiederherstellung der letzten als funktionierend bekannten Konfiguration (LKG);
  dieser Lebenszyklus wird an anderer Stelle verwaltet. Wenn eine über `path` bearbeitete Datei
  auch per LKG nachverfolgt wird, entscheidet der nächste Konfigurationslesevorgang, ob sie übernommen oder
  wiederhergestellt wird; behandeln Sie eine `path`-Bearbeitung wie jeden anderen direkten Schreibvorgang in
  diese Datei.

## Verwandte Themen

- [CLI-Referenz](/de/cli)
