---
read_when:
    - Sie möchten ein einzelnes untergeordnetes Element in einer Workspace-Datei über das Terminal prüfen oder bearbeiten
    - Sie schreiben ein Skript für den Workspace-Status und benötigen ein stabiles, typunabhängiges Adressierungsschema
    - Sie entscheiden, ob Sie das optionale Plugin `oc-path` auf einem selbst gehosteten Gateway aktivieren möchten.
summary: 'Gebündeltes `oc-path`-Plugin: enthält die `openclaw path`-CLI für das Adressierungsschema von `oc://`-Workspace-Dateien'
title: OC-Path-Plugin
x-i18n:
    generated_at: "2026-07-12T15:43:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: eb7bb1aacd37e5cc9c391372b871dc519f4048232d93a0016138ae00a6985a59
    source_path: plugins/oc-path.md
    workflow: 16
---

Das gebündelte Plugin `oc-path` fügt die CLI [`openclaw path`](/de/cli/path) für das
Adressierungsschema `oc://` für Workspace-Dateien hinzu. Es ist im OpenClaw-Repository unter
`extensions/oc-path/` enthalten, muss jedoch explizit aktiviert werden: Nach der Installation bzw. dem Build bleibt es inaktiv, bis Sie
es aktivieren.

`oc://`-Adressen verweisen auf ein einzelnes Blatt (oder eine per Platzhalter definierte Menge von Blättern) innerhalb
einer Workspace-Datei. Das Plugin unterstützt vier Dateiarten:

- **Markdown** (`.md`): Frontmatter, Abschnitte, Elemente, Felder
- **JSONC** (`.jsonc`, `.json`): Kommentare und Formatierung bleiben erhalten
- **JSONL** (`.jsonl`, `.ndjson`): zeilenorientierte Datensätze
- **YAML** (`.yaml`, `.yml`, `.lobster`): Mapping-, Sequenz- und Skalarknoten über die
  `Document`-API des Pakets `yaml`

Self-Hoster und Editor-Erweiterungen verwenden die CLI, um ein einzelnes Blatt zu lesen oder zu schreiben,
ohne direkt gegen das SDK zu skripten; Agenten und Hooks behandeln sie als
deterministische Grundlage, sodass Byte-genaue Roundtrips und der Schutz durch den Schwärzungs-
Sentinel einheitlich für alle Dateiarten gelten. Die vollständige Grammatik, die nach Verben gegliederte Liste der Flags und
ausgearbeitete Beispiele für jede Dateiart finden Sie in der
[CLI-Referenz](/de/cli/path). Diese Seite erläutert, warum und wie Sie das
Plugin aktivieren.

## Warum Sie es aktivieren sollten

Aktivieren Sie `oc-path`, wenn Skripte, Hooks oder lokale Agentenwerkzeuge auf
einen präzisen Teil des Workspace-Zustands verweisen müssen, ohne für jedes Dateiformat einen eigenen Parser zu benötigen. Eine
einzelne `oc://`-Adresse kann einen Markdown-Frontmatter-Schlüssel, ein Abschnittselement, ein
JSONC-Konfigurationsblatt, ein JSONL-Ereignisfeld oder einen YAML-Workflow-Schritt bezeichnen.

Das ist für Maintainer-Workflows wichtig, bei denen die Änderung klein,
überprüfbar und wiederholbar bleiben soll: einen Wert prüfen, übereinstimmende Datensätze finden, einen
Schreibvorgang probeweise ausführen und anschließend nur dieses Blatt anwenden, während Kommentare, Zeilenenden und
die umgebende Formatierung unverändert bleiben.

Häufige Gründe für die Aktivierung:

- **Lokale Automatisierung**: Shell-Skripte lösen einen einzelnen Workspace-Wert auf oder aktualisieren ihn
  mit `openclaw path … --json`, statt separaten Parsing-Code für Markdown, JSONC,
  JSONL und YAML mitzuführen.
- **Für Agenten sichtbare Änderungen**: Ein Agent zeigt vor dem Schreiben einen Probelauf-Diff für ein
  adressiertes Blatt an, der leichter zu prüfen ist als das freie
  Neuschreiben einer Datei.
- **Editor-Integrationen**: Ein Editor ordnet `oc://AGENTS.md/tools/gh` dem
  exakten Markdown-Knoten und der Zeilennummer zu, ohne anhand des Überschriftentexts zu raten.
- **Diagnose**: `emit` führt eine Datei durch Parser und Emitter und wieder zurück,
  sodass Sie prüfen können, ob eine Dateiart Byte-stabil ist, bevor Sie sich auf
  automatisierte Änderungen verlassen.

```bash
# Ist das GitHub-Plugin in dieser Konfiguration aktiviert?
openclaw path resolve 'oc://config.jsonc/plugins/github/enabled' --json

# Welche Tool-Aufrufnamen kommen in diesem Sitzungsprotokoll vor?
openclaw path find 'oc://session.jsonl/[event=tool_call]/name' --json

# Welche Bytes würde diese kleine Konfigurationsänderung schreiben?
openclaw path set 'oc://config.jsonc/plugins/github/enabled' 'true' --dry-run
```

`oc-path` ist bewusst nicht für übergeordnete Semantik zuständig. Speicher-
Plugins bleiben für Speicherschreibvorgänge zuständig, Konfigurationsbefehle weiterhin für die vollständige
Konfigurationsverwaltung und die Wiederherstellung der zuletzt als funktionsfähig bekannten Konfiguration (Last Known Good, LKG) weiterhin für
Wiederherstellung und Übernahme. `oc-path` ist die schmale Adressierungs- und Byte-erhaltende
Dateioperationsschicht, auf der diese übergeordneten Werkzeuge aufbauen können.

## Wo es ausgeführt wird

Das Plugin wird **prozessintern innerhalb der CLI `openclaw`** auf dem Host ausgeführt, auf dem Sie
den Befehl aufrufen. Es benötigt keinen laufenden Gateway und öffnet keine
Netzwerk-Sockets; jedes Verb ist eine reine Transformation der Datei, auf die Sie verweisen.

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

`onStartup: false` hält das Plugin aus dem Startpfad des Gateway heraus.
`commandAliases` und `activation.onCommands` weisen die CLI an, das Plugin
beim ersten Ausführen von `openclaw path …` verzögert zu laden, sodass bei Installationen, die
das Verb nie verwenden, keine Kosten entstehen.

## Aktivieren

```bash
openclaw plugins enable oc-path
```

Starten Sie den Gateway neu (falls Sie einen ausführen), damit der Manifest-Snapshot den neuen
Status übernimmt. Direkte Aufrufe von `openclaw path` funktionieren auf demselben Host sofort;
die CLI lädt das Plugin bei Bedarf.

Deaktivieren Sie es mit:

```bash
openclaw plugins disable oc-path
```

## Abhängigkeiten

Alle Parser-Abhängigkeiten sind lokal im Plugin enthalten; durch das Aktivieren von `oc-path` werden
keine neuen Pakete in die Core-Laufzeitumgebung aufgenommen:

| Abhängigkeit   | Zweck                                                                  |
| -------------- | ---------------------------------------------------------------------- |
| `commander`    | Verdrahtung der Unterbefehle `resolve`, `find`, `set`, `validate`, `emit`. |
| `jsonc-parser` | JSONC-Parsing und Blattänderungen unter Beibehaltung von Kommentaren und abschließenden Kommas. |
| `markdown-it`  | Markdown-Tokenisierung für das Abschnitts-, Element- und Feldmodell.    |
| `yaml`         | Parsen, Ausgeben und Bearbeiten von YAML-`Document` unter Beibehaltung von Kommentaren und Flow-Stil. |

JSONL bleibt eigenständig implementiert: Zeilenorientiertes Parsing ist einfacher als jede
Abhängigkeit, und das zeilenweise Parsing läuft bereits über `jsonc-parser`.

## Bereitgestellte Funktionen

| Oberfläche                     | Bereitgestellt durch                                     |
| ------------------------------ | -------------------------------------------------------- |
| CLI `openclaw path`            | `extensions/oc-path/cli-registration.ts`                 |
| `oc://`-Parser/-Formatierer    | `extensions/oc-path/src/oc-path/oc-path.ts`              |
| Parsen/Ausgeben/Bearbeiten je Dateiart | `extensions/oc-path/src/oc-path/{md,jsonc,jsonl,yaml}` |
| Universelles Auflösen/Suchen/Setzen | `extensions/oc-path/src/oc-path/{resolve,find,edit}.ts` |
| Schutz durch Schwärzungs-Sentinel | `extensions/oc-path/src/oc-path/sentinel.ts`          |

Die CLI ist derzeit die einzige öffentliche Oberfläche. Die Substrat-Verben sind innerhalb
des Plugins privat; Nutzer verwenden die CLI (oder erstellen ihr eigenes Plugin auf Basis des
SDK).

## Beziehung zu anderen Plugins

- **`memory-*`**: Speicherschreibvorgänge laufen über die Speicher-Plugins, nicht über
  `oc-path`. `oc-path` ist ein generisches Dateisubstrat; Speicher-Plugins legen
  ihre eigene Semantik darüber.
- **LKG**: `path` kennt die Wiederherstellung der zuletzt als funktionsfähig bekannten Konfiguration nicht. Wenn eine
  Datei, die Sie über `path` bearbeiten, auch von LKG verfolgt wird, entscheidet der nächste Beobachtungszyklus der Konfiguration,
  ob sie übernommen oder wiederhergestellt wird; behandeln Sie eine `path`-Änderung
  genauso wie jeden anderen direkten Schreibvorgang in diese Datei.

## Sicherheit

`set` schreibt Rohbytes über den Ausgabepfad des Substrats, der den Schutz durch den
Schwärzungs-Sentinel automatisch anwendet. Ein Blatt, das
`__OPENCLAW_REDACTED__` enthält (wortgetreu oder als Teilzeichenfolge), wird beim Schreiben
mit `OC_EMIT_SENTINEL` abgelehnt. Die CLI entfernt außerdem den wörtlichen Sentinel aus jeder
von ihr ausgegebenen menschenlesbaren oder JSON-Ausgabe und ersetzt ihn durch `[REDACTED]`, sodass
Terminalaufzeichnungen und Pipelines den Marker niemals offenlegen.

## Verwandte Themen

- [CLI-Referenz für `openclaw path`](/de/cli/path)
- [Plugins verwalten](/de/plugins/manage-plugins)
- [Plugins erstellen](/de/plugins/building-plugins)
