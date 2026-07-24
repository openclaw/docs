---
read_when:
    - Sie möchten ein einzelnes untergeordnetes Element in einer Workspace-Datei über das Terminal prüfen oder bearbeiten
    - Sie erstellen Skripte für den Workspace-Status und benötigen ein stabiles, typunabhängiges Adressierungsschema
    - Sie entscheiden, ob Sie das optionale Plugin `oc-path` auf einem selbst gehosteten Gateway aktivieren möchten
summary: 'Mitgeliefertes `oc-path`-Plugin: enthält die `openclaw path`-CLI für das Adressierungsschema für `oc://`-Workspace-Dateien'
title: OC-Path-Plugin
x-i18n:
    generated_at: "2026-07-24T05:05:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: eb7bb1aacd37e5cc9c391372b871dc519f4048232d93a0016138ae00a6985a59
    source_path: plugins/oc-path.md
    workflow: 16
---

Das gebündelte Plugin `oc-path` fügt die CLI [`openclaw path`](/de/cli/path) für das
Adressierungsschema `oc://` für Workspace-Dateien hinzu. Es wird im OpenClaw-Repository unter
`extensions/oc-path/` ausgeliefert, ist jedoch optional: Nach der Installation bzw. dem Build bleibt es inaktiv, bis Sie
es aktivieren.

`oc://`-Adressen verweisen auf ein einzelnes Blatt (oder eine durch Platzhalter definierte Menge von Blättern) innerhalb
einer Workspace-Datei. Das Plugin unterstützt vier Dateitypen:

- **Markdown** (`.md`): Frontmatter, Abschnitte, Elemente, Felder
- **JSONC** (`.jsonc`, `.json`): Kommentare und Formatierung bleiben erhalten
- **JSONL** (`.jsonl`, `.ndjson`): zeilenorientierte Datensätze
- **YAML** (`.yaml`, `.yml`, `.lobster`): Zuordnungs-, Sequenz- und Skalarknoten über die
  `Document`-API des Pakets `yaml`

Selbsthoster und Editor-Erweiterungen verwenden die CLI, um ein einzelnes Blatt zu lesen oder zu schreiben,
ohne direkt Skripte für das SDK erstellen zu müssen; Agenten und Hooks behandeln sie als
deterministische Grundlage, sodass bytegetreue Roundtrips und der Schutz durch den
Schwärzungs-Sentinel einheitlich für alle Typen gelten. Die vollständige Grammatik, eine nach Verben gegliederte Liste der Flags und
ausgearbeitete Beispiele für jeden Dateityp finden Sie in der
[CLI-Referenz](/de/cli/path). Diese Seite erläutert, warum und wie das
Plugin aktiviert wird.

## Gründe für die Aktivierung

Aktivieren Sie `oc-path`, wenn Skripte, Hooks oder lokale Agentenwerkzeuge auf
einen präzisen Teil des Workspace-Zustands verweisen müssen, ohne für jede Dateistruktur einen eigenen Parser zu benötigen. Eine
einzelne `oc://`-Adresse kann einen Markdown-Frontmatter-Schlüssel, ein Element eines Abschnitts, ein
JSONC-Konfigurationsblatt, ein JSONL-Ereignisfeld oder einen YAML-Workflow-Schritt bezeichnen.

Dies ist für Maintainer-Workflows wichtig, bei denen die Änderung klein,
prüfbar und wiederholbar bleiben soll: einen Wert untersuchen, passende Datensätze finden, einen Schreibvorgang
probeweise ausführen und anschließend nur dieses Blatt anwenden, während Kommentare, Zeilenenden und
die umgebende Formatierung unverändert bleiben.

Häufige Gründe für die Aktivierung:

- **Lokale Automatisierung**: Shell-Skripte lösen mit `openclaw path … --json` einen einzelnen Workspace-Wert auf oder aktualisieren ihn,
  anstatt separaten Parsing-Code für Markdown, JSONC,
  JSONL und YAML mitzuführen.
- **Für Agenten sichtbare Änderungen**: Ein Agent zeigt vor dem Schreiben einen Probelauf-Diff für ein adressiertes
  Blatt an, der leichter zu prüfen ist als das freie
  Neuschreiben einer Datei.
- **Editor-Integrationen**: Ein Editor ordnet `oc://AGENTS.md/tools/gh` dem
  exakten Markdown-Knoten und der Zeilennummer zu, ohne anhand des Überschriftentexts raten zu müssen.
- **Diagnose**: `emit` führt eine Datei durch Parser und Emitter und wieder zurück,
  sodass Sie prüfen können, ob ein Dateityp bytegenau stabil ist, bevor Sie sich auf
  automatisierte Änderungen verlassen.

```bash
# Ist das GitHub-Plugin in dieser Konfiguration aktiviert?
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled' --json

# Welche Tool-Aufrufnamen kommen in diesem Sitzungsprotokoll vor?
openclaw path find 'oc://session.jsonl/[event=tool_call]/name' --json

# Welche Bytes würde diese kleine Konfigurationsänderung schreiben?
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

`oc-path` ist bewusst nicht für übergeordnete Semantik verantwortlich. Speicher-
Plugins sind weiterhin für Schreibvorgänge in den Speicher zuständig, Konfigurationsbefehle weiterhin für die vollständige
Konfigurationsverwaltung und die Wiederherstellung der letzten als funktionsfähig bekannten Konfiguration (LKG) weiterhin für
Wiederherstellung und Übernahme. `oc-path` ist die schmale Schicht für Adressierung und
byteerhaltende Dateioperationen, auf der diese übergeordneten Werkzeuge aufbauen können.

## Ausführungsort

Das Plugin wird **prozessintern in der CLI `openclaw`** auf dem Host ausgeführt, auf dem Sie
den Befehl aufrufen. Es benötigt keinen laufenden Gateway und öffnet keine
Netzwerk-Sockets; jedes Verb ist eine reine Transformation einer Datei, auf die Sie verweisen.

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

`onStartup: false` hält das Plugin aus dem Startpfad des Gateways heraus.
`commandAliases` und `activation.onCommands` weisen die CLI an, das Plugin
beim ersten Ausführen von `openclaw path …` verzögert zu laden, sodass für Installationen, die
das Verb nie verwenden, keine Kosten entstehen.

## Aktivieren

```bash
openclaw plugins enable oc-path
```

Starten Sie den Gateway neu (sofern Sie einen ausführen), damit der Manifest-Snapshot den neuen
Zustand übernimmt. Direkte Aufrufe von `openclaw path` funktionieren auf demselben Host sofort;
die CLI lädt das Plugin bei Bedarf.

Deaktivieren mit:

```bash
openclaw plugins disable oc-path
```

## Abhängigkeiten

Alle Parser-Abhängigkeiten sind lokal im Plugin enthalten; durch die Aktivierung von `oc-path` werden keine
neuen Pakete in die Core-Laufzeit aufgenommen:

| Abhängigkeit     | Zweck                                                                |
| -------------- | ---------------------------------------------------------------------- |
| `commander`    | Einbindung der Unterbefehle für `resolve`, `find`, `set`, `validate`, `emit`.    |
| `jsonc-parser` | JSONC-Parsing und Bearbeitung einzelner Blätter unter Beibehaltung von Kommentaren und nachgestellten Kommas.     |
| `markdown-it`  | Markdown-Tokenisierung für das Abschnitts-, Element- und Feldmodell.            |
| `yaml`         | Parsen, Ausgeben und Bearbeiten von YAML-`Document` unter Beibehaltung von Kommentaren und Flussstil. |

JSONL bleibt handgeschrieben: Zeilenorientiertes Parsing ist einfacher als jede
Abhängigkeit, und das zeilenweise Parsing läuft bereits über `jsonc-parser`.

## Bereitgestellte Funktionen

| Oberfläche                        | Bereitgestellt durch                                             |
| ------------------------------ | ------------------------------------------------------- |
| CLI `openclaw path`            | `extensions/oc-path/cli-registration.ts`                |
| Parser/Formatierer `oc://`     | `extensions/oc-path/src/oc-path/oc-path.ts`             |
| Typspezifisches Parsen/Ausgeben/Bearbeiten   | `extensions/oc-path/src/oc-path/{md,jsonc,jsonl,yaml}`  |
| Universelles Auflösen/Suchen/Setzen | `extensions/oc-path/src/oc-path/{resolve,find,edit}.ts` |
| Schutz durch Schwärzungs-Sentinel       | `extensions/oc-path/src/oc-path/sentinel.ts`            |

Die CLI ist derzeit die einzige öffentliche Oberfläche. Die zugrunde liegenden Verben sind
privat für das Plugin; Nutzer verwenden die CLI (oder erstellen ein eigenes Plugin auf Grundlage des
SDK).

## Beziehung zu anderen Plugins

- **`memory-*`**: Schreibvorgänge in den Speicher erfolgen über die Speicher-Plugins, nicht über
  `oc-path`. `oc-path` ist eine generische Dateigrundlage; Speicher-Plugins legen
  ihre eigene Semantik darüber.
- **LKG**: `path` kennt die Wiederherstellung der letzten als funktionsfähig bekannten Konfiguration nicht. Wenn eine
  über `path` bearbeitete Datei auch von LKG verfolgt wird, entscheidet der nächste Beobachtungszyklus der Konfiguration,
  ob sie übernommen oder wiederhergestellt wird; behandeln Sie eine Änderung mit `path`
  genauso wie jeden anderen direkten Schreibvorgang in diese Datei.

## Sicherheit

`set` schreibt rohe Bytes über den Ausgabepfad der Grundlage, der automatisch den
Schutz durch den Schwärzungs-Sentinel anwendet. Ein Blatt, das
`__OPENCLAW_REDACTED__` enthält (wörtlich oder als Teilzeichenfolge), wird beim Schreiben
mit `OC_EMIT_SENTINEL` abgelehnt. Die CLI entfernt außerdem den literalen Sentinel aus allen
von ihr ausgegebenen menschenlesbaren oder JSON-Ausgaben und ersetzt ihn durch `[REDACTED]`, damit
Terminalaufzeichnungen und Pipelines die Markierung niemals offenlegen.

## Verwandte Themen

- [CLI-Referenz zu `openclaw path`](/de/cli/path)
- [Plugins verwalten](/de/plugins/manage-plugins)
- [Plugins erstellen](/de/plugins/building-plugins)
