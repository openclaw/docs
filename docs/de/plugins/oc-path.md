---
read_when:
    - Sie möchten vom Terminal aus einen einzelnen Blattknoten in einer Workspace-Datei prüfen oder bearbeiten
    - Sie schreiben Skripte gegen den Workspace-Zustand und benötigen ein stabiles, typunabhängiges Adressierungsschema.
    - Sie entscheiden, ob Sie das optionale `oc-path`-Plugin auf einem selbst gehosteten Gateway aktivieren sollten
summary: 'Mitgeliefertes `oc-path` Plugin: liefert die `openclaw path` CLI für das `oc://` Workspace-Datei-Adressierungsschema mit'
title: OC Path-Plugin
x-i18n:
    generated_at: "2026-05-10T19:44:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: f4d9d34094ebfa5850266b33d6a4f443e631fb207e519c1cf5fccfb735c200a0
    source_path: plugins/oc-path.md
    workflow: 16
---

Das mitgelieferte `oc-path`-Plugin fügt die [`openclaw path`](/de/cli/path)-CLI für das
`oc://`-Adressierungsschema von Workspace-Dateien hinzu. Es wird im OpenClaw-Repo unter
`extensions/oc-path/` ausgeliefert, ist aber optional aktivierbar: Installation/Build lassen es inaktiv, bis Sie
es aktivieren.

`oc://`-Adressen zeigen auf ein einzelnes Blatt (oder eine Wildcard-Menge von Blättern) innerhalb
einer Workspace-Datei. Das Plugin versteht derzeit drei Dateitypen:

- **markdown** (`.md`, `.mdx`): Frontmatter, Abschnitte, Elemente, Felder
- **jsonc** (`.jsonc`, `.json5`, `.json`): Kommentare und Formatierung bleiben erhalten
- **jsonl** (`.jsonl`, `.ndjson`): zeilenorientierte Datensätze

Selbsthoster und Editor-Erweiterungen verwenden die CLI, um ein einzelnes Blatt zu lesen oder zu schreiben,
ohne direkt gegen das SDK zu skripten; Agenten und Hooks behandeln sie als
deterministisches Substrat, sodass bytegetreue Roundtrips und der
Redaction-Sentinel-Schutz einheitlich für alle Typen gelten.

## Warum Sie es aktivieren sollten

Aktivieren Sie `oc-path`, wenn Skripte, Hooks oder lokale Agent-Tools auf
einen präzisen Teil des Workspace-Zustands zeigen sollen, ohne für jede
Dateiform einen Parser zu erfinden. Eine einzelne `oc://`-Adresse kann einen Markdown-Frontmatter-Schlüssel, ein Abschnittselement, ein JSONC-Konfigurationsblatt oder ein JSONL-Ereignisfeld benennen.

Das ist wichtig für Maintainer-Workflows, bei denen die Änderung klein,
prüfbar und wiederholbar sein soll: einen Wert prüfen, passende Datensätze finden, einen Schreibvorgang als Dry-Run testen und dann nur dieses Blatt anwenden, während Kommentare, Zeilenenden und
nahe Formatierung unverändert bleiben. Dass dies als optional aktivierbares Plugin bereitsteht, gibt Power-Usern das
Adressierungssubstrat, ohne Parser-Abhängigkeiten oder CLI-Oberfläche in
den Core für Installationen zu bringen, die es nie benötigen.

Häufige Gründe für die Aktivierung:

- **Lokale Automatisierung**: Shell-Skripte können einen Workspace-Wert
  mit `openclaw path … --json` auflösen oder aktualisieren, statt separaten Markdown-, JSONC-
  und JSONL-Parsing-Code mitzuführen.
- **Für Agenten sichtbare Änderungen**: Ein Agent kann vor dem Schreiben einen Dry-Run-Diff für ein adressiertes
  Blatt anzeigen, was leichter zu prüfen ist als ein freies Umschreiben der Datei.
- **Editor-Integrationen**: Ein Editor kann `oc://AGENTS.md/tools/gh` dem
  exakten Markdown-Node und der Zeilennummer zuordnen, ohne anhand von Überschriftentext zu raten.
- **Diagnosen**: `emit` führt einen Roundtrip einer Datei durch Parser und Emitter aus, sodass
  Sie prüfen können, ob ein Dateityp byte-stabil ist, bevor Sie sich auf automatisierte
  Änderungen verlassen.

Konkrete Beispiele:

```bash
# Is the GitHub plugin enabled in this config?
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled' --json

# Which tool-call names appear in this session log?
openclaw path find 'oc://session.jsonl/[event=tool_call]/name' --json

# What bytes would this tiny config edit write?
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

Das Plugin ist bewusst nicht der Eigentümer höherstufiger Semantik. Memory-
Plugins besitzen weiterhin Memory-Schreibvorgänge, Konfigurationsbefehle besitzen weiterhin die vollständige
Konfigurationsverwaltung, und LKG-Logik besitzt weiterhin Wiederherstellung/Promotion. `oc-path` ist die schmale
Adressierungs- und byteerhaltende Dateioperationsschicht, um die diese höherstufigen Tools
herum bauen können.

## Wo es läuft

Das Plugin läuft **prozessintern innerhalb der `openclaw`-CLI** auf dem Host, auf dem Sie
den Befehl ausführen. Es benötigt keinen laufenden Gateway und öffnet keine
Netzwerk-Sockets: Jedes Verb ist eine reine Transformation über eine Datei, auf die Sie zeigen.

Die Plugin-Metadaten befinden sich in `extensions/oc-path/openclaw.plugin.json`:

```json
{
  "id": "oc-path",
  "name": "OC Path",
  "activation": {
    "onStartup": false,
    "onCommands": ["path"]
  },
  "commandAliases": [{ "name": "path", "kind": "cli" }]
}
```

`onStartup: false` hält das Plugin aus dem Gateway-Hot-Path heraus. `onCommands:
["path"]` weist die CLI an, das Plugin beim ersten Ausführen von
`openclaw path …` verzögert zu laden, sodass Installationen, die das Verb nie verwenden, keine Kosten tragen.

## Aktivieren

```bash
openclaw plugins enable oc-path
```

Starten Sie den Gateway neu (falls Sie einen ausführen), damit der Manifest-Snapshot den neuen
Status aufnimmt. Reine `openclaw path`-Aufrufe funktionieren sofort auf demselben Host:
Die CLI lädt das Plugin bei Bedarf.

Deaktivieren mit:

```bash
openclaw plugins disable oc-path
```

## Abhängigkeiten

Alle Parser-Abhängigkeiten sind Plugin-lokal: Das Aktivieren von `oc-path` zieht keine
neuen Pakete in die Core-Laufzeitumgebung:

| Abhängigkeit   | Zweck                                                               |
| -------------- | ------------------------------------------------------------------- |
| `commander`    | Subcommand-Verdrahtung für `resolve`, `find`, `set`, `validate`, `emit`. |
| `jsonc-parser` | JSONC-Parsing + Blattänderungen mit beibehaltenen Kommentaren und nachgestellten Kommas. |
| `markdown-it`  | Markdown-Tokenisierung für das Abschnitts-/Element-/Feldmodell.     |

JSONL bleibt handgeschrieben: Zeilenorientiertes Parsing ist einfacher als jede
Abhängigkeit, und das JSONC-Parsing pro Zeile läuft ohnehin über `jsonc-parser`.

## Was es bereitstellt

| Oberfläche                     | Bereitgestellt von                                      |
| ------------------------------ | ------------------------------------------------------- |
| `openclaw path`-CLI            | `extensions/oc-path/cli-registration.ts`                |
| `oc://`-Parser / -Formatter    | `extensions/oc-path/src/oc-path/oc-path.ts`             |
| Typbezogenes Parsen / Emit / Bearbeiten | `extensions/oc-path/src/oc-path/{md,jsonc,jsonl}`       |
| Universelles Resolve / Find / Set | `extensions/oc-path/src/oc-path/{resolve,find,edit}.ts` |
| Redaction-Sentinel-Schutz      | `extensions/oc-path/src/oc-path/sentinel.ts`            |

Die CLI ist derzeit die einzige öffentliche Oberfläche. Die Substrat-Verben sind privat für
das Plugin; Konsumenten verwenden die CLI (oder bauen ihr eigenes Plugin gegen das SDK).

## Beziehung zu anderen Plugins

- **`memory-*`**: Memory-Schreibvorgänge laufen über die Memory-Plugins, nicht über `oc-path`.
  `oc-path` ist ein generisches Dateisubstrat; Memory-Plugins legen ihre eigene
  Semantik darüber.
- **LKG**: `path` weiß nichts über die Last-Known-Good-Wiederherstellung von Konfigurationen. Wenn eine
  Datei durch LKG verfolgt wird, entscheidet der nächste `observe`-Aufruf, ob sie promotet oder
  wiederhergestellt wird; `set --batch` für atomare Multi-Sets durch den LKG-Promote/Recover-
  Lebenszyklus ist zusammen mit dem LKG-Recovery-Substrat geplant.

## Sicherheit

`set` schreibt Rohbytes über den Emit-Pfad des Substrats, der den
Redaction-Sentinel-Schutz automatisch anwendet. Ein Blatt, das
`__OPENCLAW_REDACTED__` enthält (wörtlich oder als Teilzeichenfolge), wird zur Schreibzeit
mit `OC_EMIT_SENTINEL` abgelehnt. Die CLI bereinigt außerdem den wörtlichen Sentinel aus jeder
menschenlesbaren oder JSON-Ausgabe, die sie ausgibt, und ersetzt ihn durch `[REDACTED]`, sodass Terminal-
Mitschnitte und Pipelines den Marker nie preisgeben.

## Verwandt

- [`openclaw path`-CLI-Referenz](/de/cli/path)
- [Plugins verwalten](/de/plugins/manage-plugins)
- [Plugins bauen](/de/plugins/building-plugins)
