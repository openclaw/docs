---
read_when:
    - Sie möchten über das Terminal ein Blatt in einer Workspace-Datei lesen oder schreiben
    - Sie schreiben Skripte, die mit dem Workspace-Zustand arbeiten, und möchten ein stabiles, typunabhängiges Adressierungsschema
    - Sie debuggen einen `oc://`-Pfad (validieren Sie die Syntax und prüfen Sie, worauf er aufgelöst wird)
summary: CLI-Referenz für `openclaw path` (Arbeitsbereichsdateien über das `oc://`-Adressierungsschema prüfen und bearbeiten)
title: Pfad
x-i18n:
    generated_at: "2026-06-27T17:20:17Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 88e560c19cf34851b0237986e15b48ad7d0e32699e2c12c559dfeecf6fcf761b
    source_path: cli/path.md
    workflow: 16
---

# `openclaw path`

Vom Plugin bereitgestellter Shell-Zugriff auf das `oc://`-Adressierungssubstrat: ein nach Art dispatchtes Pfadschema zum Prüfen und Bearbeiten adressierbarer Workspace-Dateien (markdown, jsonc, jsonl, yaml/yml/lobster). Self-Hoster, Plugin-Autoren und Editor-Erweiterungen verwenden es, um einen eng umrissenen Speicherort zu lesen, zu finden oder zu aktualisieren, ohne pro Dateityp eigene Parser zu schreiben.

Die CLI spiegelt die öffentlichen Verben des Substrats:

- `resolve` ist konkret und liefert genau einen Treffer.
- `find` ist das Mehrfachtreffer-Verb für Platzhalter, Vereinigungen, Prädikate und positionale Erweiterung.
- `set` akzeptiert nur konkrete Pfade oder Einfügemarker; Platzhaltermuster werden vor dem Schreiben abgelehnt.

`path` wird vom gebündelten optionalen `oc-path`-Plugin bereitgestellt. Aktivieren Sie es vor der ersten Verwendung:

```bash
openclaw plugins enable oc-path
```

## Warum Sie es verwenden sollten

OpenClaw-Zustand ist über von Menschen bearbeitetes Markdown, kommentierte JSONC-Konfiguration, nur angehängte JSONL-Logs und YAML-Workflow-/Spezifikationsdateien verteilt. Shell-Skripte, Hooks und Agenten benötigen aus diesen Dateien häufig einen einzelnen kleinen Wert: einen Frontmatter-Schlüssel, eine Plugin-Einstellung, ein Log-Datensatzfeld, einen YAML-Schritt oder einen Aufzählungspunkt unter einem benannten Abschnitt.

`openclaw path` gibt diesen Aufrufern eine stabile Adresse statt eines einmaligen grep, Regex oder Parsers für jeden Dateityp. Derselbe `oc://`-Pfad kann im Terminal validiert, aufgelöst, gesucht, als Trockenlauf ausgeführt und geschrieben werden. Dadurch wird eng umrissene Automatisierung leichter zu prüfen und sicherer erneut auszuführen. Besonders nützlich ist es, wenn Sie ein einzelnes Blatt aktualisieren möchten, während die übrigen Kommentare, Zeilenenden und umgebende Formatierung der Datei erhalten bleiben.

Verwenden Sie es, wenn das gewünschte Objekt eine logische Adresse hat, die physische Dateiform aber variiert:

- Ein Hook möchte eine Einstellung aus kommentiertem JSONC lesen, ohne beim Zurückschreiben des Werts Kommentare zu verlieren.
- Ein Wartungsskript möchte jedes passende Ereignisfeld in einem JSONL-Log finden, ohne das gesamte Log in einen eigenen Parser zu laden.
- Eine Editor-Erweiterung möchte per Slug zu einem Markdown-Abschnitt oder Aufzählungspunkt springen und dann die exakt aufgelöste Zeile rendern.
- Ein Agent möchte eine kleine Workspace-Bearbeitung vor der Anwendung als Trockenlauf ausführen, wobei die geänderten Bytes in der Prüfung sichtbar sind.

Für gewöhnliche Bearbeitungen ganzer Dateien, umfangreiche Konfigurationsmigrationen oder speicherspezifische Schreibvorgänge benötigen Sie `openclaw path` wahrscheinlich nicht. Diese sollten den zuständigen Befehl oder das zuständige Plugin verwenden. `path` ist für kleine, adressierbare Dateioperationen gedacht, bei denen ein wiederholbarer Terminalbefehl klarer ist als ein weiterer spezieller Parser.

## Verwendung

Einen Wert aus einer von Menschen bearbeiteten Konfigurationsdatei lesen:

```bash
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled'
```

Einen Schreibvorgang vorschauen, ohne den Datenträger zu berühren:

```bash
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

Passende Datensätze in einem nur angehängten JSONL-Log finden:

```bash
openclaw path find 'oc://session.jsonl/[event=tool_call]/name'
```

Eine Anweisung in Markdown nach Abschnitt und Element adressieren statt nach Zeilennummer:

```bash
openclaw path resolve 'oc://AGENTS.md/runtime-safety/openclaw-gateway'
```

Einen Pfad in CI oder einem Preflight-Skript validieren, bevor das Skript liest oder schreibt:

```bash
openclaw path validate 'oc://AGENTS.md/tools/$last/risk'
```

Diese Befehle sind dafür gedacht, in Shell-Skripte kopiert zu werden. Verwenden Sie `--json`, wenn ein Aufrufer strukturierte Ausgabe benötigt, und `--human`, wenn eine Person das Ergebnis prüft.

## Funktionsweise

`openclaw path` erledigt vier Dinge:

1. Es parst die `oc://`-Adresse in Slots: Datei, Abschnitt, Element, Feld und optionale Sitzung.
2. Es wählt den Dateityp-Adapter anhand der Zielerweiterung (`.md`, `.jsonc`, `.jsonl`, `.yaml`, `.yml`, `.lobster` und zugehörige Aliase).
3. Es löst die Slots gegen den AST dieses Dateityps auf: Markdown-Überschriften/-Elemente, JSONC-Objektschlüssel/-Array-Indizes, JSONL-Zeilendatensätze oder YAML-Map-/Sequenzknoten.
4. Für `set` gibt es bearbeitete Bytes über denselben Adapter aus, sodass unveränderte Teile der Datei ihre Kommentare, Zeilenenden und nahe Formatierung behalten, sofern der Typ dies unterstützt.

`resolve` und `set` erfordern ein konkretes Ziel. `find` ist das erkundende Verb: Es erweitert Platzhalter, Vereinigungen, Prädikate und Ordinale zu konkreten Treffern, die Sie prüfen können, bevor Sie einen zum Schreiben auswählen.

## Unterbefehle

| Unterbefehl             | Zweck                                                                        |
| ----------------------- | ---------------------------------------------------------------------------- |
| `resolve <oc-path>`     | Den konkreten Treffer am Pfad ausgeben (oder „nicht gefunden“).              |
| `find <pattern>`        | Treffer für einen Platzhalter-/Vereinigungs-/Prädikatpfad aufzählen.         |
| `set <oc-path> <value>` | Ein Blatt oder Einfügeziel an einem konkreten Pfad schreiben. Unterstützt `--dry-run`. |
| `validate <oc-path>`    | Nur parsen; strukturelle Aufschlüsselung ausgeben (Datei / Abschnitt / Element / Feld). |
| `emit <file>`           | Eine Datei durch `parseXxx` + `emitXxx` roundtrippen (Byte-Treue-Diagnose).  |

## Globale Flags

| Flag            | Zweck                                                                    |
| --------------- | ------------------------------------------------------------------------ |
| `--cwd <dir>`   | Den Datei-Slot relativ zu diesem Verzeichnis auflösen (Standard: `process.cwd()`). |
| `--file <path>` | Den aufgelösten Pfad des Datei-Slots überschreiben (absoluter Zugriff).  |
| `--json`        | JSON-Ausgabe erzwingen (Standard, wenn stdout kein TTY ist).             |
| `--human`       | Menschlich lesbare Ausgabe erzwingen (Standard, wenn stdout ein TTY ist). |
| `--dry-run`     | (nur bei `set`) die Bytes ausgeben, die geschrieben würden, ohne zu schreiben. |
| `--diff`        | (mit `set --dry-run`) einen Unified Diff statt der vollständigen Bytes ausgeben. |

## `oc://`-Syntax

```
oc://FILE/SECTION/ITEM/FIELD?session=SCOPE
```

Slot-Regeln: `field` erfordert `item`, und `item` erfordert `section`. Über alle vier Slots hinweg:

- **Quoted segments** — `"a/b.c"` übersteht `/`- und `.`-Trennzeichen.
  Inhalt ist byte-literal; `"` und `\` sind innerhalb von Anführungszeichen nicht erlaubt.
  Auch der Datei-Slot beachtet Anführungszeichen: `oc://"skills/email-drafter"/Tools/$last`
  behandelt `skills/email-drafter` als einzelnen Dateipfad.
- **Prädikate** — `[k=v]`, `[k!=v]`, `[k<v]`, `[k<=v]`, `[k>v]`,
  `[k>=v]`. Numerische Operationen erfordern, dass beide Seiten in endliche Zahlen umwandelbar sind.
- **Vereinigungen** — `{a,b,c}` passt auf jede der Alternativen.
- **Platzhalter** — `*` (einzelnes Untersegment) und `**` (null oder mehr,
  rekursiv). `find` akzeptiert diese; `resolve` und `set` lehnen sie als
  mehrdeutig ab.
- **Positional** — `$first` / `$last` lösen zum ersten / letzten Index oder
  deklarierten Schlüssel auf.
- **Ordinal** — `#N` für den N-ten Treffer nach Dokumentreihenfolge.
- **Einfügemarker** — `+`, `+key`, `+nnn` für schlüsselbasierte / indexbasierte
  Einfügung (mit `set` verwenden).
- **Sitzungsbereich** — `?session=cron-daily` usw. Orthogonal zur Slot-
  Verschachtelung. Sitzungswerte sind roh, nicht prozent-dekodiert; sie dürfen
  keine Steuerzeichen oder reservierten Query-Trennzeichen enthalten (`?`, `&`, `%`).

Reservierte Zeichen (`?`, `&`, `%`) außerhalb von zitierten, Prädikat- oder Vereinigungssegmenten werden abgelehnt. Steuerzeichen (U+0000-U+001F, U+007F) werden überall abgelehnt, einschließlich des `session`-Query-Werts.

`formatOcPath(parseOcPath(path)) === path` ist für kanonische Pfade garantiert. Nicht-kanonische Query-Parameter werden ignoriert, außer dem ersten nicht leeren `session=`-Wert.

## Adressierung nach Dateityp

| Typ               | Adressierungsmodell                                                                                |
| ----------------- | --------------------------------------------------------------------------------------------------- |
| Markdown          | H2-Abschnitte nach Slug, Aufzählungspunkte nach Slug oder `#N`, Frontmatter über `[frontmatter]`.   |
| JSONC/JSON        | Objektschlüssel und Array-Indizes; Punkte teilen verschachtelte Untersegmente, sofern nicht zitiert. |
| JSONL             | Top-Level-Zeilenadressen (`L1`, `L2`, `$first`, `$last`), dann JSONC-artiger Abstieg innerhalb der Zeile. |
| YAML/YML/.lobster | Map-Schlüssel und Sequenzindizes; Kommentare und Flow-Style werden von der YAML-Dokument-API verarbeitet. |

`resolve` gibt einen strukturierten Treffer zurück: `root`, `node`, `leaf` oder
`insertion-point`, mit einer 1-basierten Zeilennummer. Blattwerte werden als Text
plus `leafType` bereitgestellt, damit Plugin-Autoren Vorschauen rendern können, ohne von der AST-Form des jeweiligen Typs abhängig zu sein.

## Mutationsvertrag

`set` schreibt ein konkretes Ziel:

- Markdown-Frontmatter-Werte und `- key: value`-Elementfelder sind String-Blätter.
  Markdown-Einfügungen hängen Abschnitte, Frontmatter-Schlüssel oder Abschnittselemente an und rendern eine kanonische Markdown-Form für die geänderte Datei.
- JSONC-Blattschreibvorgänge wandeln den String-Wert in den bestehenden Blatttyp um
  (`string`, endliche `number`, `true`/`false` oder `null`). Verwenden Sie `--value-json`,
  wenn ein JSONC/JSON/JSONL-Blattersatz `<value>` als JSON parsen soll und die Form ändern darf, etwa beim Ersetzen einer String-SecretRef-Kurzform durch ein
  Objekt. JSONC-Objekt- und Array-Einfügungen parsen `<value>` als JSON und verwenden den
  `jsonc-parser`-Bearbeitungspfad für gewöhnliche Blattschreibvorgänge, wobei Kommentare und nahe Formatierung erhalten bleiben.
- JSONL-Blattschreibvorgänge wandeln wie JSONC innerhalb einer Zeile um. Ganzzeilenersatz und
  Anhängen parsen `<value>` als JSON. Gerendertes JSONL bewahrt die dominierende
  LF/CRLF-Zeilenende-Konvention der Datei.
- YAML-Blattschreibvorgänge wandeln in den bestehenden Skalartyp um (`string`, endliche
  `number`, `true`/`false` oder `null`). YAML-Einfügungen verwenden die Dokument-API des gebündelten
  `yaml`-Pakets für Map-/Sequenzaktualisierungen. Fehlerhafte YAML-Dokumente mit Parserfehlern werden vor der Mutation mit `parse-error` abgelehnt.

Verwenden Sie `--dry-run` vor benutzersichtbaren Schreibvorgängen, wenn die exakten Bytes wichtig sind. Das Substrat bewahrt byte-identische Ausgabe für Parse-/Emit-Roundtrips, aber eine Mutation kann je nach Typ die bearbeitete Region oder Datei kanonisieren.
Fügen Sie `--diff` hinzu, wenn Sie die Vorschau als fokussierten Vorher/Nachher-Patch statt als vollständig gerenderte Datei wünschen.

## Beispiele

```bash
# Validate a path (no filesystem access)
openclaw path validate 'oc://AGENTS.md/Tools/$last/risk'

# Read a leaf
openclaw path resolve 'oc://gateway.jsonc/version'

# Wildcard search
openclaw path find 'oc://session.jsonl/*/event' --file ./logs/session.jsonl

# Dry-run a write
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run

# Dry-run a write as a unified diff
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff

# Apply the write
openclaw path set 'oc://gateway.jsonc/version' '2.0'

# Byte-fidelity round-trip (diagnostic)
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

## Rezepte nach Dateiart

Dieselben fünf Verben funktionieren dateiartübergreifend; das Adressierungsschema leitet anhand der Dateiendung weiter. Die folgenden Beispiele verwenden die Fixtures aus der PR-Beschreibung.

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

Das Prädikat `[frontmatter]` adressiert den YAML-Frontmatter-Block; `tools` entspricht der Überschrift `## Tools` über den Slug, und Item-Blätter behalten ihre Slug-Form auch dann, wenn die Quelle Unterstriche verwendet (`send_email` → `send-email`).

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

JSONC-Bearbeitungen laufen über `jsonc-parser`, sodass Kommentare und Leerraum ein `set` überstehen. Führen Sie zuerst mit `--dry-run` aus, um die Bytes vor dem Übernehmen zu prüfen.

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

Jede Zeile ist ein Datensatz. Adressieren Sie per Prädikat (`[event=action]`), wenn Sie die Zeilennummer nicht kennen, oder über das kanonische Segment `LN`, wenn Sie sie kennen.

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

YAML verwendet die `Document`-API des Pakets `yaml` statt eines selbstgebauten Parsers, sodass gewöhnliche Parse/Emit-Roundtrips Kommentare und Autorenstruktur bewahren, während aufgelöste Pfade dasselbe Map-Key-/Sequence-Index-Modell wie JSONC verwenden. Derselbe Adapter verarbeitet Dateien mit `.yaml`, `.yml` und `.lobster`.

## Subcommand-Referenz

### `resolve <oc-path>`

Liest ein einzelnes Blatt oder einen einzelnen Knoten. Wildcards werden abgelehnt — verwenden Sie dafür `find`. Beendet mit `0` bei einem Treffer, `1` bei einem sauberen Fehltreffer, `2` bei einem Parse-Fehler oder verweigerten Muster.

```bash
openclaw path resolve 'oc://AGENTS.md/tools/gh/risk' --human
openclaw path resolve 'oc://gateway.jsonc/server/port' --json
```

### `find <pattern>`

Listet jeden Treffer für ein Wildcard-/Prädikat-/Union-Muster auf. Beendet mit `0` bei mindestens einem Treffer, `1` bei null Treffern. Datei-Slot-Wildcards werden mit `OC_PATH_FILE_WILDCARD_UNSUPPORTED` abgelehnt — übergeben Sie eine konkrete Datei (Multi-File-Globbing ist ein Folge-Feature).

```bash
openclaw path find 'oc://AGENTS.md/tools/**/risk'
openclaw path find 'oc://session.jsonl/[event=action]/userId'
openclaw path find 'oc://config.jsonc/plugins/{github,slack}/enabled'
```

### `set <oc-path> <value>`

Schreibt ein Blatt. Kombinieren Sie dies mit `--dry-run`, um die Bytes vorzuschauen, die geschrieben würden, ohne die Datei zu berühren. Fügen Sie `--diff` für eine Vorschau als Unified Diff hinzu. Beendet mit `0` bei erfolgreichem Schreiben, `1`, wenn das Substrat verweigert (zum Beispiel bei ausgelöstem Sentinel-Schutz), `2` bei Parse-Fehlern.

```bash
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run
openclaw path set 'oc://gateway.jsonc/version' '2.0' --dry-run --diff
openclaw path set 'oc://gateway.jsonc/version' '2.0'
openclaw path set 'oc://AGENTS.md/Tools/+gh/risk' 'low'
```

Der Einfügemarker `+key` erstellt das benannte Kind, wenn es noch nicht existiert; `+nnn` und das bloße `+` funktionieren für indexiertes beziehungsweise anhängendes Einfügen.

### `validate <oc-path>`

Nur-Parse-Prüfung. Kein Dateisystemzugriff. Nützlich, wenn Sie bestätigen möchten, dass ein Template-Pfad wohlgeformt ist, bevor Variablen eingesetzt werden, oder wenn Sie die strukturelle Zerlegung zum Debuggen benötigen:

```bash
$ openclaw path validate 'oc://AGENTS.md/tools/gh' --human
valid: oc://AGENTS.md/tools/gh
  file:    AGENTS.md
  section: tools
  item:    gh
```

Beendet mit `0`, wenn gültig, `1`, wenn ungültig (mit strukturiertem `code` und `message`), `2` bei Argumentfehlern.

### `emit <file>`

Führt eine Datei durch den Parser und Emitter der jeweiligen Art als Roundtrip. Die Ausgabe sollte bei einer intakten Datei byteidentisch mit der Eingabe sein — Abweichungen deuten auf einen Parser-Bug oder einen Sentinel-Treffer hin. Nützlich zum Debuggen des Substratverhaltens bei realen Eingaben.

```bash
openclaw path emit ./AGENTS.md
openclaw path emit ./gateway.jsonc --json
```

## Exit-Codes

| Code | Bedeutung                                                                  |
| ---- | -------------------------------------------------------------------------- |
| `0`  | Erfolg. (`resolve` / `find`: mindestens ein Treffer. `set`: Schreiben erfolgreich.) |
| `1`  | Kein Treffer, oder `set` wurde vom Substrat abgelehnt (kein Fehler auf Systemebene). |
| `2`  | Argument- oder Parse-Fehler.                                               |

## Ausgabemodus

`openclaw path` ist TTY-bewusst: menschenlesbare Ausgabe in einem Terminal, JSON, wenn stdout gepiped oder umgeleitet wird. `--json` und `--human` überschreiben die automatische Erkennung.

## Hinweise

- `set` schreibt Bytes über den Emit-Pfad des Substrats, der den Redaction-Sentinel-Schutz automatisch anwendet. Ein Blatt, das `__OPENCLAW_REDACTED__` trägt (wörtlich oder als Teilzeichenfolge), wird beim Schreiben verweigert.
- JSONC-Parsing und Blatt-Bearbeitungen verwenden die Plugin-lokale Abhängigkeit `jsonc-parser`, sodass Kommentare und Formatierung bei gewöhnlichen Blatt-Schreibvorgängen erhalten bleiben, statt über einen selbstgebauten Parser/Re-Render-Pfad zu laufen.
- `path` kennt LKG nicht. Wenn die Datei per LKG verfolgt wird, entscheidet der nächste Observe-Aufruf, ob promote / recover ausgeführt wird. `set --batch` für atomare Multi-Set-Vorgänge durch den LKG-promote/recover-Lebenszyklus ist zusammen mit dem LKG-Recovery-Substrat geplant.

## Verwandt

- [CLI-Referenz](/de/cli)
