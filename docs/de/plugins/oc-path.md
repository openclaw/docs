---
read_when:
    - Sie möchten ein einzelnes Blattelement in einer Workspace-Datei vom Terminal aus prüfen oder bearbeiten
    - Sie schreiben Skripte gegen den Workspace-Zustand und benötigen ein stabiles, artunabhängiges Adressierungsschema
    - Sie entscheiden, ob Sie das optionale `oc-path` Plugin auf einem selbst gehosteten Gateway aktivieren
summary: 'Gebündeltes `oc-path`-Plugin: liefert die `openclaw path`-CLI für das Adressierungsschema `oc://` für Workspace-Dateien aus'
title: OC Path-Plugin
x-i18n:
    generated_at: "2026-06-27T17:50:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: afb8ab86d04ef783986d05203f2c06b9cb718ad44ec31c797159ed49d9e1d5e3
    source_path: plugins/oc-path.md
    workflow: 16
---

Das gebündelte `oc-path`-Plugin fügt die [`openclaw path`](/de/cli/path)-CLI für das
`oc://`-Adressierungsschema für Workspace-Dateien hinzu. Es wird im OpenClaw-Repo unter
`extensions/oc-path/` ausgeliefert, ist aber optional: Installation/Build lassen es inaktiv, bis Sie
es aktivieren.

`oc://`-Adressen verweisen auf ein einzelnes Blatt (oder eine Wildcard-Menge von Blättern) innerhalb
einer Workspace-Datei. Das Plugin versteht heute vier Dateiarten:

- **markdown** (`.md`, `.mdx`): Frontmatter, Abschnitte, Elemente, Felder
- **jsonc** (`.jsonc`, `.json5`, `.json`): Kommentare und Formatierung bleiben erhalten
- **jsonl** (`.jsonl`, `.ndjson`): zeilenorientierte Datensätze
- **yaml** (`.yaml`, `.yml`, `.lobster`): Map-/Sequence-/Scalar-Knoten über die
  YAML-Dokument-API

Self-Hoster und Editor-Erweiterungen verwenden die CLI, um ein einzelnes Blatt zu lesen
oder zu schreiben, ohne direkt gegen das SDK zu skripten; Agenten und Hooks behandeln sie als
deterministisches Substrat, sodass bytetreue Roundtrips und der
Schwärzungs-Sentinel-Schutz einheitlich über alle Arten hinweg gelten.

## Warum Sie es aktivieren sollten

Aktivieren Sie `oc-path`, wenn Skripte, Hooks oder lokale Agentenwerkzeuge auf
ein präzises Stück Workspace-Zustand zeigen sollen, ohne für jede Dateiform
einen eigenen Parser zu erfinden. Eine einzelne `oc://`-Adresse kann einen
Markdown-Frontmatter-Schlüssel, ein Abschnittselement, ein JSONC-Konfigurationsblatt,
ein JSONL-Ereignisfeld oder einen YAML-Workflow-Schritt benennen.

Das ist wichtig für Maintainer-Workflows, bei denen die Änderung klein,
prüfbar und wiederholbar sein soll: einen Wert inspizieren, passende Datensätze finden,
einen Schreibvorgang trocken ausführen und dann nur dieses Blatt anwenden, während Kommentare,
Zeilenenden und nahe Formatierung unverändert bleiben. Dies als optionales Plugin zu halten,
gibt Power-Usern das Adressierungssubstrat, ohne Parser-Abhängigkeiten oder CLI-Oberfläche
in den Kern für Installationen aufzunehmen, die es nie benötigen.

Häufige Gründe für die Aktivierung:

- **Lokale Automatisierung**: Shell-Skripte können mit `openclaw path … --json` einen
  Workspace-Wert auflösen oder aktualisieren, statt separaten Parsing-Code für Markdown,
  JSONC, JSONL und YAML mitzuführen.
- **Für Agenten sichtbare Bearbeitungen**: Ein Agent kann vor dem Schreiben ein Dry-Run-Diff
  für ein adressiertes Blatt anzeigen, was leichter zu prüfen ist als eine freie
  Dateineufassung.
- **Editor-Integrationen**: Ein Editor kann `oc://AGENTS.md/tools/gh` dem exakten
  Markdown-Knoten und der Zeilennummer zuordnen, ohne aus Überschriftentext zu raten.
- **Diagnose**: `emit` führt eine Datei durch Parser und Emitter zurück, sodass
  Sie prüfen können, ob eine Dateiart byte-stabil ist, bevor Sie sich auf automatisierte
  Bearbeitungen verlassen.

Konkrete Beispiele:

```bash
# Is the GitHub plugin enabled in this config?
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled' --json

# Which tool-call names appear in this session log?
openclaw path find 'oc://session.jsonl/[event=tool_call]/name' --json

# What bytes would this tiny config edit write?
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

Das Plugin ist absichtlich nicht Eigentümer höherstufiger Semantik. Memory-Plugins
besitzen weiterhin Memory-Schreibvorgänge, Konfigurationsbefehle besitzen weiterhin die vollständige
Konfigurationsverwaltung, und LKG-Logik besitzt weiterhin Wiederherstellung/Promotion. `oc-path`
ist die schmale Adressierungs- und byterhaltende Dateioperationsschicht, um die diese
höherstufigen Werkzeuge herum bauen können.

## Wo es läuft

Das Plugin läuft **prozessintern innerhalb der `openclaw`-CLI** auf dem Host, auf dem Sie
den Befehl aufrufen. Es benötigt keinen laufenden Gateway und öffnet keine
Netzwerk-Sockets: Jedes Verb ist eine reine Transformation über eine Datei, auf die Sie zeigen.

Die Plugin-Metadaten liegen in `extensions/oc-path/openclaw.plugin.json`:

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
`openclaw path …` lazy zu laden, sodass Installationen, die das Verb nie verwenden,
keine Kosten tragen.

## Aktivieren

```bash
openclaw plugins enable oc-path
```

Starten Sie den Gateway neu (falls Sie einen betreiben), damit der Manifest-Snapshot den neuen
Zustand übernimmt. Direkte `openclaw path`-Aufrufe funktionieren sofort auf demselben Host:
Die CLI lädt das Plugin bei Bedarf.

Deaktivieren mit:

```bash
openclaw plugins disable oc-path
```

## Abhängigkeiten

Alle Parser-Abhängigkeiten sind Plugin-lokal: Das Aktivieren von `oc-path` zieht
keine neuen Pakete in die Kern-Laufzeitumgebung:

| Abhängigkeit   | Zweck                                                                  |
| -------------- | ---------------------------------------------------------------------- |
| `commander`    | Subcommand-Verdrahtung für `resolve`, `find`, `set`, `validate`, `emit`. |
| `jsonc-parser` | JSONC-Parsing und Blattbearbeitungen mit erhaltenen Kommentaren und nachgestellten Kommas. |
| `markdown-it`  | Markdown-Tokenisierung für das Abschnitts-/Element-/Feldmodell.        |
| `yaml`         | YAML-`Document`-Parsing / -Emission / -Bearbeitung mit erhaltenen Kommentaren und Flow-Stil. |

JSONL bleibt handgeschrieben: zeilenorientiertes Parsing ist einfacher als jede
Abhängigkeit, und das JSONC-Parsing pro Zeile läuft bereits über `jsonc-parser`.

## Was es bereitstellt

| Oberfläche                     | Bereitgestellt durch                                   |
| ------------------------------ | ------------------------------------------------------- |
| `openclaw path`-CLI            | `extensions/oc-path/cli-registration.ts`                |
| `oc://`-Parser / -Formatter    | `extensions/oc-path/src/oc-path/oc-path.ts`             |
| Parsing / Emission / Bearbeitung pro Art | `extensions/oc-path/src/oc-path/{md,jsonc,jsonl,yaml}`  |
| Universelles Resolve / Find / Set | `extensions/oc-path/src/oc-path/{resolve,find,edit}.ts` |
| Schwärzungs-Sentinel-Schutz    | `extensions/oc-path/src/oc-path/sentinel.ts`            |

Die CLI ist heute die einzige öffentliche Oberfläche. Die Substrat-Verben sind privat für
das Plugin; Verbraucher verwenden die CLI (oder bauen ihr eigenes Plugin gegen das SDK).

## Beziehung zu anderen Plugins

- **`memory-*`**: Memory-Schreibvorgänge laufen durch die Memory-Plugins, nicht durch `oc-path`.
  `oc-path` ist ein generisches Dateisubstrat; Memory-Plugins legen ihre eigene
  Semantik darüber.
- **LKG**: `path` kennt keine Last-Known-Good-Konfigurationswiederherstellung. Wenn eine
  Datei LKG-verfolgt ist, entscheidet der nächste `observe`-Aufruf, ob sie promotet oder
  wiederhergestellt wird; `set --batch` für atomare Mehrfach-Set-Vorgänge durch den
  LKG-Promote-/Recover-Lebenszyklus ist zusammen mit dem LKG-Recovery-Substrat geplant.

## Sicherheit

`set` schreibt Rohbytes durch den Emit-Pfad des Substrats, der den
Schwärzungs-Sentinel-Schutz automatisch anwendet. Ein Blatt, das
`__OPENCLAW_REDACTED__` enthält (verbatim oder als Teilzeichenkette), wird zur Schreibzeit
mit `OC_EMIT_SENTINEL` abgelehnt. Die CLI bereinigt außerdem den literalen Sentinel aus jeder
menschlichen oder JSON-Ausgabe, die sie ausgibt, und ersetzt ihn durch `[REDACTED]`, damit
Terminal-Mitschnitte und Pipelines die Markierung nie preisgeben.

## Verwandte Themen

- [`openclaw path`-CLI-Referenz](/de/cli/path)
- [Plugins verwalten](/de/plugins/manage-plugins)
- [Plugins erstellen](/de/plugins/building-plugins)
