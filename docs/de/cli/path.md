---
read_when:
    - Sie möchten über das Terminal einen Blattwert in einer Workspace-Datei lesen oder schreiben
    - Sie erstellen Skripte für den Workspace-Status und benötigen ein stabiles, typunabhängiges Adressierungsschema.
    - Sie debuggen einen `oc://`-Pfad (validieren Sie die Syntax und prüfen Sie, worauf er aufgelöst wird)
summary: CLI-Referenz für `openclaw path` (Arbeitsbereichsdateien über das Adressierungsschema `oc://` prüfen und bearbeiten)
title: Pfad
x-i18n:
    generated_at: "2026-07-24T04:50:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7afe5bd1c3a5fca8dd22c7d807e390e751ae7e895c54bf0e10e2734f3889436c
    source_path: cli/path.md
    workflow: 16
---

# `openclaw path`

Shell-Zugriff auf das Adressierungsschema `oc://`: eine nach Art weitergeleitete Pfadsyntax
zum Prüfen und Bearbeiten adressierbarer Workspace-Dateien (Markdown, JSONC,
JSONL, YAML/YML/Lobster). Selbsthoster, Plugin-Autoren und Editor-Erweiterungen
verwenden sie, um einen eng begrenzten Speicherort zu lesen, zu finden oder zu aktualisieren, ohne
für jeden Dateityp einen eigenen Parser zu erstellen.

`path` wird vom gebündelten optionalen Plugin `oc-path` bereitgestellt. Aktivieren Sie es vor
der ersten Verwendung:

```bash
openclaw plugins enable oc-path
```

Die CLI-Verben entsprechen dem Adressierungsmodell:

- `resolve` ist konkret und liefert genau einen Treffer.
- `find` ist das Verb für mehrere Treffer bei Platzhaltern, Vereinigungen, Prädikaten und
  positionsbezogener Expansion.
- `set` akzeptiert nur konkrete Pfade oder Einfügemarkierungen; Platzhaltermuster
  werden vor dem Schreiben abgewiesen.
- `validate` parst einen Pfad ohne Dateisystemzugriff.
- `emit` führt eine Datei durch Parsen und Ausgeben im Rundlauf zurück (Diagnose der Bytetreue).

## Gründe für die Verwendung

Der OpenClaw-Zustand verteilt sich auf manuell bearbeitetes Markdown, kommentierte JSONC-
Konfigurationen, nur erweiterbare JSONL-Protokolle und YAML-Workflow-/Spezifikationsdateien. Skripte, Hooks
und Agenten benötigen aus diesen Dateien häufig nur einen kleinen Wert: einen Frontmatter-Schlüssel, eine
Plugin-Einstellung, ein Feld eines Protokolldatensatzes, einen YAML-Schritt oder einen Aufzählungspunkt unter einem
benannten Abschnitt.

`openclaw path` gibt diesen Aufrufern eine stabile Adresse statt eines einmaligen
grep-, Regex- oder Parser-Ansatzes für jeden Dateityp. Derselbe Pfad `oc://` kann vom Terminal aus validiert,
aufgelöst, durchsucht, im Probelauf ausgeführt und geschrieben werden, wodurch eng begrenzte
Automatisierungen überprüfbar und wiederholbar bleiben. Der übrige Dateiinhalt bleibt erhalten, sodass
das Schreiben eines einzelnen Blattwerts weder Kommentare noch Zeilenenden oder die benachbarte
Formatierung verändert.

Verwenden Sie es, wenn das gewünschte Element eine logische Adresse besitzt, die Dateistruktur
jedoch variiert:

- Ein Hook liest eine Einstellung aus kommentiertem JSONC, ohne Kommentare zu verlieren, wenn
  er den Wert zurückschreibt.
- Ein Wartungsskript findet jedes übereinstimmende Ereignisfeld in einem JSONL-Protokoll,
  ohne das gesamte Protokoll in einen eigenen Parser zu laden.
- Ein Editor springt anhand des Slugs zu einem Markdown-Abschnitt oder Aufzählungspunkt und rendert anschließend
  die exakt aufgelöste Zeile.
- Ein Agent führt eine kleine Workspace-Bearbeitung vor dem Anwenden probeweise aus, wobei die
  geänderten Bytes bei der Überprüfung sichtbar sind.

Verzichten Sie bei gewöhnlichen Bearbeitungen ganzer Dateien, umfangreichen Konfigurationsmigrationen oder
speicherspezifischen Schreibvorgängen auf `openclaw path`; dafür sollte der zuständige Befehl oder das zuständige Plugin verwendet werden. `path`
ist für kleine, adressierbare Dateioperationen vorgesehen, bei denen ein wiederholbarer Terminalbefehl
einem weiteren maßgeschneiderten Parser vorzuziehen ist.

## Verwendung

Einen Wert aus einer manuell bearbeiteten Konfigurationsdatei lesen:

```bash
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled'
```

Einen Schreibvorgang in der Vorschau anzeigen, ohne den Datenträger zu verändern:

```bash
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

Übereinstimmende Datensätze in einem nur erweiterbaren JSONL-Protokoll finden:

```bash
openclaw path find 'oc://session.jsonl/[event=tool_call]/name'
```

Eine Anweisung in Markdown über Abschnitt und Element statt über die Zeilennummer
adressieren:

```bash
openclaw path resolve 'oc://AGENTS.md/runtime-safety/openclaw-gateway'
```

Einen Pfad in CI oder einem Vorprüfungsskript validieren, bevor das Skript liest oder
schreibt:

```bash
openclaw path validate 'oc://AGENTS.md/tools/$last/risk'
```

Diese Befehle sind so konzipiert, dass sie in Shell-Skripte kopiert werden können. Verwenden Sie `--json`, wenn
ein Aufrufer eine strukturierte Ausgabe benötigt, und `--human`, wenn eine Person das Ergebnis
prüft.

## Funktionsweise

1. Parst die Adresse `oc://` in Positionen: Datei, Abschnitt, Element, Feld und eine
   optionale Sitzungsabfrage.
2. Wählt anhand der Zielerweiterung den Adapter für den Dateityp aus (`.md`, `.jsonc`,
   `.json`, `.jsonl`, `.ndjson`, `.yaml`, `.yml`, `.lobster`).
3. Löst die Positionen anhand der Struktur dieses Dateityps auf: Markdown-
   Überschriften/-Elemente, JSONC-Objektschlüssel/-Arrayindizes, JSONL-Zeilendatensätze oder
   YAML-Zuordnungs-/Sequenzknoten.
4. Gibt bei `set` bearbeitete Bytes über denselben Adapter aus, sodass unveränderte Teile
   der Datei ihre Kommentare, Zeilenenden und benachbarte Formatierung behalten, sofern
   der Dateityp dies unterstützt.

`resolve` und `set` erfordern ein konkretes Ziel. `find` ist das explorative
Verb: Es expandiert Platzhalter, Vereinigungen, Prädikate und Ordnungszahlen zu den konkreten
Treffern, die Sie prüfen können, bevor Sie einen zum Schreiben auswählen.

## Unterbefehle

| Unterbefehl              | Zweck                                                                     |
| ----------------------- | --------------------------------------------------------------------------- |
| `resolve <oc-path>`     | Den konkreten Treffer am Pfad ausgeben (oder „nicht gefunden“).                      |
| `find <pattern>`        | Treffer für einen Platzhalter-/Vereinigungs-/Prädikatpfad aufzählen.                  |
| `set <oc-path> <value>` | Einen Blattwert oder ein Einfügeziel an einem konkreten Pfad schreiben. Unterstützt `--dry-run`.  |
| `validate <oc-path>`    | Nur parsen; die strukturelle Aufschlüsselung ausgeben (Datei/Abschnitt/Element/Feld). |
| `emit <file>`           | Eine Datei durch Parsen und Ausgeben im Rundlauf zurückführen (Diagnose der Bytetreue).          |

## Globale Flags

| Flag            | Gilt für                       | Zweck                                                                  |
| --------------- | -------------------------------- | ------------------------------------------------------------------------ |
| `--cwd <dir>`   | `resolve`, `find`, `set`, `emit` | Die Dateiposition relativ zu diesem Verzeichnis auflösen (Standard: `process.cwd()`). |
| `--file <path>` | `resolve`, `find`, `set`, `emit` | Den aufgelösten Pfad der Dateiposition überschreiben (absoluter Zugriff).                |
| `--json`        | alle                              | JSON-Ausgabe erzwingen (Standard, wenn stdout kein TTY ist).                    |
| `--human`       | alle                              | Für Menschen lesbare Ausgabe erzwingen (Standard, wenn stdout ein TTY ist).                       |
| `--value-json`  | `set`                            | `<value>` als JSON für die Ersetzung eines JSON-/JSONC-/JSONL-Blattwerts parsen.           |
| `--dry-run`     | `set`                            | Die Bytes ausgeben, die geschrieben würden, ohne zu schreiben.                   |
| `--diff`        | `set` (erfordert `--dry-run`)     | Einen einheitlichen Diff statt der vollständigen Bytes ausgeben.                          |

`validate` akzeptiert nur `--json` / `--human`; es greift nicht auf das Dateisystem zu, daher
gelten `--cwd` und `--file` nicht.

## Syntax von `oc://`

```text
oc://FILE/SECTION/ITEM/FIELD?session=SCOPE
```

Positionsregeln: `field` erfordert `item`, und `item` erfordert `section`. Für
alle vier Positionen gilt:

- **Segmente in Anführungszeichen** — `"a/b.c"` übersteht die Trennzeichen `/` und `.`. Der Inhalt ist
  bytegenau; `"` und `\` sind innerhalb von Anführungszeichen nicht zulässig. Auch die Dateiposition
  berücksichtigt Anführungszeichen: `oc://"skills/email-drafter"/Tools/$last` behandelt
  `skills/email-drafter` als einzelnen Dateipfad.
- **Prädikate** — `[k=v]`, `[k!=v]`, `[k<v]`, `[k<=v]`, `[k>v]`, `[k>=v]`.
  Numerische Operatoren erfordern, dass beide Seiten in endliche Zahlen umgewandelt werden können.
- **Vereinigungen** — `{a,b,c}` stimmt mit jeder der Alternativen überein.
- **Platzhalter** — `*` (einzelnes Untersegment) und `**` (null oder mehr,
  rekursiv). `find` akzeptiert diese; `resolve` und `set` lehnen sie als
  mehrdeutig ab.
- **Positionsbezogen** — `$first` / `$last` werden zum ersten/letzten Index oder
  deklarierten Schlüssel aufgelöst.
- **Ordnungszahl** — `#N` für den N-ten Treffer gemäß Dokumentreihenfolge.
- **Einfügemarkierungen** — `+`, `+key`, `+nnn` für schlüssel-/indexbasierte Einfügung
  (mit `set` verwenden).
- **Sitzungsbereich** — `?session=cron-daily` usw. Unabhängig von der Verschachtelung der Positionen.
  Sitzungswerte sind Rohwerte und werden nicht prozentdekodiert; sie dürfen weder Steuerzeichen
  noch reservierte Abfrage-Trennzeichen enthalten (`?`, `&`, `%`).

Reservierte Zeichen (`?`, `&`, `%`) außerhalb von Segmenten in Anführungszeichen, Prädikaten oder Vereinigungen
werden abgewiesen. Steuerzeichen (U+0000-U+001F, U+007F) werden
überall abgewiesen, einschließlich des Abfragewerts `session`.

`formatOcPath(parseOcPath(path)) === path` wird für kanonische Pfade garantiert.
Nicht kanonische Abfrageparameter werden mit Ausnahme des ersten nicht leeren
Werts `session=` ignoriert.

Feste Grenzwerte: Ein Pfad ist auf 4096 Bytes, höchstens 4 Positionen (Datei/Abschnitt/Element/
Feld), höchstens 64 durch Punkte getrennte Untersegmente pro Position und höchstens 256 verschachtelte
Traversal-Ebenen für tiefe JSON-Pfade begrenzt. Unabhängig davon wird jede JSONC-/JSON-Dateieingabe
über 16 MiB für jedes Verb, das diese Datei lädt, mit einer Parsediagnose abgewiesen,
statt geparst zu werden.

## Adressierung nach Dateityp

| Typ          | Dateierweiterungen             | Adressierungsmodell                                                                                    |
| ------------- | --------------------------- | --------------------------------------------------------------------------------------------------- |
| Markdown      | `.md`                       | H2-Abschnitte nach Slug, Aufzählungspunkte nach Slug oder `#N`, Frontmatter über `[frontmatter]`.                 |
| JSONC/JSON    | `.jsonc`, `.json`           | Objektschlüssel und Arrayindizes; Punkte trennen verschachtelte Untersegmente, sofern sie nicht in Anführungszeichen stehen.                        |
| JSONL         | `.jsonl`, `.ndjson`         | Zeilenadressen der obersten Ebene (`L1`, `L2`, `$first`, `$last`), anschließend Abstieg im JSONC-Stil innerhalb der Zeile. |
| YAML/.lobster | `.yaml`, `.yml`, `.lobster` | Zuordnungsschlüssel und Sequenzindizes; Kommentare und der Flow-Stil werden von der YAML-Dokument-API verarbeitet.        |

`resolve` gibt einen strukturierten Treffer zurück: `root`, `node`, `leaf` oder
`insertion-point`, mit einer 1-basierten Zeilennummer. Blattwerte werden als
Text zusammen mit einem `leafType` bereitgestellt, sodass Plugin-Autoren Vorschauen rendern können, ohne
von der AST-Struktur des jeweiligen Dateityps abhängig zu sein.

## Mutationsvertrag

`set` schreibt ein konkretes Ziel:

- Markdown-Frontmatter-Werte und `- key: value`-Elementfelder sind Zeichenfolgen-
  blätter. Markdown-Einfügungen hängen Abschnitte, Frontmatter-Schlüssel oder Abschnitts-
  elemente an und rendern eine kanonische Markdown-Struktur für die geänderte Datei. Abschnitts-
  körper können nicht als Ganzes über `set` geschrieben werden.
- Beim Schreiben von JSONC-Blättern wird der Zeichenfolgenwert in den vorhandenen Blatttyp
  umgewandelt (`string`, endlicher `number`, `true`/`false` oder `null`). Verwenden Sie `--value-json`,
  wenn beim Ersetzen eines JSONC-/JSON-/JSONL-Blatts `<value>` als JSON geparst werden soll und
  sich die Struktur ändern darf, beispielsweise beim Ersetzen einer Zeichenfolgen-Kurzschreibweise für eine Secret-Referenz durch ein
  Objekt. Bei Einfügungen in JSONC-Objekte und -Arrays wird `<value>` als JSON geparst und
  für gewöhnliche Schreibvorgänge an Blättern der Bearbeitungspfad `jsonc-parser` verwendet, wobei Kommentare
  und die Formatierung in der Umgebung erhalten bleiben.
- Beim Schreiben von JSONL-Blättern erfolgt die Umwandlung innerhalb einer Zeile wie bei JSONC. Beim Ersetzen
  und Anhängen ganzer Zeilen wird `<value>` als JSON geparst. Gerendertes JSONL behält die in der Datei
  vorherrschende LF-/CRLF-Zeilenendekonvention bei (Mehrheitsentscheidung über alle
  Zeilenumbrüche der Datei, sodass eine überwiegend CRLF-basierte Datei auch bei einigen vereinzelten LFs CRLF beibehält).
- Beim Schreiben von YAML-Blättern erfolgt die Umwandlung in den vorhandenen Skalartyp (`string`, endlicher
  `number`, `true`/`false` oder `null`). YAML-Einfügungen verwenden die Dokument-API des mitgelieferten
  Pakets `yaml` für Aktualisierungen von Zuordnungen und Sequenzen. Fehlerhafte YAML-
  Dokumente mit Parserfehlern werden vor der Mutation mit
  `parse-error` abgelehnt.

Verwenden Sie `--dry-run` vor benutzersichtbaren Schreibvorgängen, wenn die exakten Bytes wichtig sind. JSONC-
und YAML-Bearbeitungen patchen das vorhandene Dokument (über `jsonc-parser` oder die Dokument-API von `yaml`),
sodass unveränderte Bytes normalerweise erhalten bleiben; Markdown erstellt die Datei bei jeder Bearbeitung
aus ihrer geparsten Struktur neu, wodurch beiläufige Formatierungen außerhalb
des geänderten Blatts normalisiert werden können. Fügen Sie `--diff` hinzu, wenn Sie die Vorschau
als fokussierten Vorher-/Nachher-Patch statt als vollständig gerenderte Datei anzeigen möchten.

## Beispiele

```bash
# Einen Pfad validieren (kein Dateisystemzugriff)
openclaw path validate 'oc://AGENTS.md/Tools/$last/risk'

# Ein Blatt lesen
openclaw path resolve 'oc://gateway.jsonc/version'

# Platzhaltersuche
openclaw path find 'oc://session.jsonl/*/event' --file ./logs/session.jsonl

# Einen Schreibvorgang testweise ausführen
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run

# Einen Schreibvorgang testweise als Unified Diff ausführen
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff

# Den Schreibvorgang anwenden
openclaw path set 'oc://gateway.jsonc/version' '2.0'

# Bytegetreuer Roundtrip (Diagnose)
openclaw path emit ./AGENTS.md
```

Weitere Grammatikbeispiele:

```bash
# Schlüssel in Anführungszeichen setzen, die / oder . enthalten
openclaw path resolve 'oc://config.jsonc/agents.defaults.models/"anthropic/claude-opus-4-7"/alias'

# Tiefe JSON-/JSONC-Pfade können Schrägstrichsegmente verwenden; sie werden zu punktgetrennten Untersegmenten normalisiert
openclaw path set 'oc://openclaw.json/agents/list/0/tools/exec/security' 'allowlist' --dry-run

# Ein JSONC-Blatt durch ein geparstes Objekt ersetzen
openclaw path set 'oc://openclaw.json/gateway/auth/token' '{"source":"file","provider":"secrets","id":"/test"}' --value-json --dry-run

# Prädikatssuche über untergeordnete JSONC-Elemente
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
openclaw path set 'oc://AGENTS.md/[frontmatter]/+description' 'Agent instructions' --dry-run

# Markdown-Elementfelder suchen
openclaw path find 'oc://SKILL.md/Tools/*/send_email'

# Einen sitzungsbezogenen Pfad validieren
openclaw path validate 'oc://AGENTS.md/Tools/$last/risk?session=cron-daily'
```

## Rezepte nach Dateiart

Dieselben fünf Verben funktionieren für alle Arten; das Adressierungsschema wählt anhand
der Dateierweiterung die passende Verarbeitung aus.

### Markdown

```text
<!-- frontmatter.md -->
---
name: Entwurfsagent
description: Agent zum Verfassen von E-Mail-Entwürfen
tier: Kern
---
## Werkzeuge
- gh: GitHub CLI
- curl: HTTP-Client
- send_email: aktiviert
```

```bash
$ openclaw path resolve 'oc://x.md/[frontmatter]/tier' --file frontmatter.md --human
Blatt @ L4: "core" (Zeichenfolge)

$ openclaw path resolve 'oc://x.md/tools/gh/gh' --file frontmatter.md --human
Blatt @ L9: "GitHub CLI" (Zeichenfolge)

$ openclaw path find 'oc://x.md/tools/*' --file frontmatter.md --human
3 Treffer für oc://x.md/tools/*:
  oc://x.md/tools/gh           →  Knoten @ L9 [md-item]
  oc://x.md/tools/curl         →  Knoten @ L10 [md-item]
  oc://x.md/tools/send-email   →  Knoten @ L11 [md-item]
```

Das Prädikat `[frontmatter]` adressiert den YAML-Frontmatter-Block; `tools`
entspricht der Überschrift `## Tools` über ihren Slug, und Elementblätter behalten ihre Slug-Form bei,
selbst wenn die Quelle Unterstriche verwendet (`send_email` wird zu `send-email`).

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
Blatt @ L4: "true" (boolesch)

$ openclaw path set 'oc://config.jsonc/plugins/slack/enabled' 'true' --file config.jsonc --dry-run
--dry-run: würde 142 Bytes nach /…/config.jsonc schreiben
{
  "plugins": {
    "github": {"enabled": true, "role": "vcs"},
    "slack":  {"enabled": true, "role": "chat"}
  }
}
```

JSONC-Bearbeitungen laufen über `jsonc-parser`, sodass Kommentare und Leerraum einen
`set` überstehen. Führen Sie den Befehl zunächst mit `--dry-run` aus, um die Bytes vor dem Übernehmen zu prüfen.
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
  oc://session.jsonl/L2/userId  →  Blatt @ L2: "u1" (Zeichenfolge)

$ openclaw path resolve 'oc://session.jsonl/L2/ts' --file session.jsonl --human
Blatt @ L2: "2" (Zahl)
```

Jede Zeile ist ein Datensatz. Adressieren Sie ihn über ein Prädikat (`[event=action]`), wenn Sie
die Zeilennummer nicht kennen, oder andernfalls über das kanonische Segment `LN`.
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
Blatt @ L3: "fetch" (Zeichenfolge)

$ openclaw path set 'oc://workflow.yaml/steps/$last/id' 'classify-renamed' --file workflow.yaml --dry-run
--dry-run: würde 99 Bytes nach /…/workflow.yaml schreiben
name: inbox-triage
steps:
  - id: fetch
    command: gmail.search
  - id: classify-renamed
    command: openclaw.invoke
```

YAML verwendet die `Document`-API des Pakets `yaml` statt eines selbst entwickelten
Parsers, sodass gewöhnliche Parse-/Ausgabe-Roundtrips Kommentare und die vom Autor erstellte
Struktur erhalten, während aufgelöste Pfade dasselbe Modell aus Zuordnungsschlüsseln und Sequenzindizes wie
JSONC verwenden. Derselbe Adapter verarbeitet `.yaml`-, `.yml`- und `.lobster`-Dateien.

## Unterbefehlsreferenz

### `resolve <oc-path>`

Ein einzelnes Blatt oder einen einzelnen Knoten lesen. Platzhalter werden abgelehnt – verwenden Sie dafür `find`.
Beendet sich bei einem Treffer mit `0`, bei einem regulären Fehltreffer mit `1` und bei einem Parserfehler oder abgelehnten
Muster mit `2`.

```bash
openclaw path resolve 'oc://AGENTS.md/tools/gh/risk' --human
openclaw path resolve 'oc://gateway.jsonc/server/port' --json
```

### `find <pattern>`

Alle Treffer für ein Platzhalter-, Prädikats- oder Vereinigungsmuster aufzählen. Beendet sich mit `0`,
wenn mindestens ein Treffer vorliegt, andernfalls mit `1`. Platzhalter im Dateifeld werden mit
`OC_PATH_FILE_WILDCARD_UNSUPPORTED` abgelehnt – übergeben Sie eine konkrete Datei (Globbing
über mehrere Dateien ist eine spätere Funktion).

```bash
openclaw path find 'oc://AGENTS.md/tools/**/risk'
openclaw path find 'oc://session.jsonl/[event=action]/userId'
openclaw path find 'oc://config.jsonc/plugins/{github,slack}/enabled'
```

### `set <oc-path> <value>`

Ein Blatt schreiben. Kombinieren Sie den Befehl mit `--dry-run`, um eine Vorschau der zu schreibenden Bytes anzuzeigen,
ohne die Datei zu verändern. Fügen Sie `--diff` für eine Vorschau als Unified Diff hinzu.
Beendet sich nach einem erfolgreichen Schreibvorgang mit `0`, mit `1`, wenn das Substrat den Vorgang ablehnt (beispielsweise
wenn ein Sentinel-Schutz ausgelöst wird), und bei Parserfehlern mit `2`.

```bash
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff
openclaw path set 'oc://gateway.jsonc/version' '2.0'
openclaw path set 'oc://AGENTS.md/Tools/+gh/risk' 'low'
```

Die Einfügungsmarkierung `+key` erstellt das benannte untergeordnete Element, sofern es noch nicht
vorhanden ist; `+nnn` und das alleinstehende `+` dienen entsprechend zur indexbasierten Einfügung und zum Anhängen.

### `validate <oc-path>`

Reine Parse-Prüfung. Kein Dateisystemzugriff. Nützlich, wenn Sie vor dem Ersetzen von Variablen
bestätigen möchten, dass ein Vorlagenpfad wohlgeformt ist, oder wenn Sie
die strukturelle Aufschlüsselung zur Fehlersuche benötigen:

```bash
$ openclaw path validate 'oc://AGENTS.md/tools/gh' --human
gültig: oc://AGENTS.md/tools/gh
  Datei:     AGENTS.md
  Abschnitt: tools
  Element:   gh
```

Beendet sich bei einem gültigen Pfad mit `0`, bei einem ungültigen Pfad mit `1` (mit einem strukturierten `code` und
`message`) und bei Argumentfehlern mit `2`.

### `emit <file>`

Eine Datei durch den Parser und Emitter der jeweiligen Art schleusen. Bei einer fehlerfreien Datei sollte die Ausgabe
byteidentisch mit der Eingabe sein; eine Abweichung weist auf einen
Parserfehler oder das Auslösen eines Sentinels hin. Nützlich zur Fehlersuche im Verhalten des Substrats bei
realen Eingaben.

```bash
openclaw path emit ./AGENTS.md
openclaw path emit ./gateway.jsonc --json
```

## Exitcodes

| Code | Bedeutung                                                                  |
| ---- | -------------------------------------------------------------------------- |
| `0`  | Erfolg. (`resolve` / `find`: mindestens ein Treffer. `set`: Schreibvorgang erfolgreich.) |
| `1`  | Kein Treffer oder `set` wurde vom Substrat abgelehnt (kein Fehler auf Systemebene). |
| `2`  | Argument- oder Parserfehler.                                                |

## Ausgabemodus

`openclaw path` berücksichtigt TTY: menschenlesbare Ausgabe in einem Terminal, JSON, wenn
stdout über eine Pipe weitergeleitet oder umgeleitet wird. `--json` und `--human` überschreiben die
automatische Erkennung.

## Hinweise

- `set` schreibt Bytes über den Emit-Pfad des Substrats, der den
  Schutz durch den Schwärzungs-Sentinel automatisch anwendet. Ein Blatt, das
  `__OPENCLAW_REDACTED__` enthält (wortgetreu oder als Teilzeichenfolge), wird zum
  Schreibzeitpunkt abgelehnt.
- Das JSONC-Parsing und Blattänderungen verwenden die Plugin-lokale Abhängigkeit `jsonc-parser`,
  sodass Kommentare und Formatierung bei gewöhnlichen Schreibvorgängen auf Blattebene erhalten bleiben,
  anstatt einen manuell erstellten Parser-/Neurendering-Pfad zu durchlaufen.
- `path` berücksichtigt weder die Verfolgung noch die Wiederherstellung der letzten
  als funktionsfähig bekannten Konfiguration (LKG); dieser Lebenszyklus wird an anderer Stelle verwaltet.
  Wenn eine über `path` bearbeitete Datei ebenfalls per LKG verfolgt wird,
  entscheidet der nächste Konfigurationslesevorgang, ob sie übernommen oder
  wiederhergestellt wird; behandeln Sie eine Änderung mit `path` wie jeden anderen direkten
  Schreibvorgang in diese Datei.

## Verwandte Themen

- [CLI-Referenz](/de/cli)
