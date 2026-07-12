---
read_when:
    - Erste Verwendung von ClawHub
    - Installieren eines Skills oder Plugins aus der Registry
    - Veröffentlichung auf ClawHub
summary: 'Erste Schritte mit ClawHub: Skills oder Plugins finden, installieren, aktualisieren und veröffentlichen.'
x-i18n:
    generated_at: "2026-07-12T01:26:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Schnellstart

ClawHub ist ein Verzeichnis für OpenClaw-Skills und -Plugins.

Verwenden Sie OpenClaw, wenn Sie Komponenten in OpenClaw installieren. Verwenden Sie die `clawhub`-CLI, wenn Sie sich anmelden, Inhalte veröffentlichen, Ihre eigenen Einträge verwalten oder verzeichnisspezifische Arbeitsabläufe verwenden.

## Einen Skill suchen und installieren

Suchen Sie über OpenClaw:

```bash
openclaw skills search "calendar"
```

Installieren Sie einen Skill:

```bash
openclaw skills install @openclaw/demo
```

Aktualisieren Sie installierte Skills:

```bash
openclaw skills update --all
```

OpenClaw zeichnet auf, woher der Skill stammt, damit spätere Aktualisierungen weiterhin über ClawHub aufgelöst werden können.

## Ein Plugin suchen und installieren

Suchen Sie über OpenClaw:

```bash
openclaw plugins search "calendar"
```

Installieren Sie ein auf ClawHub gehostetes Plugin mit einer expliziten ClawHub-Quelle:

```bash
openclaw plugins install clawhub:<package>
```

Aktualisieren Sie installierte Plugins:

```bash
openclaw plugins update --all
```

Verwenden Sie das Präfix `clawhub:`, wenn OpenClaw das Paket über ClawHub statt über npm oder eine andere Quelle auflösen soll.

## Zum Veröffentlichen anmelden

Installieren Sie die ClawHub-CLI:

```bash
npm i -g clawhub
# oder
pnpm add -g clawhub
```

Melden Sie sich mit GitHub an:

```bash
clawhub login
clawhub whoami
```

In Umgebungen ohne grafische Benutzeroberfläche kann ein API-Token aus der ClawHub-Weboberfläche verwendet werden:

```bash
clawhub login --token clh_...
```

## Einen Skill veröffentlichen

Ein Skill ist ein Ordner mit einer erforderlichen Datei `SKILL.md` und optionalen unterstützenden Dateien.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

Der Befehl überspringt unveränderte Inhalte. Neue Skills beginnen mit `1.0.0`; spätere Änderungen veröffentlichen automatisch die nächste Patch-Version. Verwenden Sie `--dry-run` für eine Vorschau oder `--version`, um eine bestimmte Version auszuwählen.

Prüfen Sie vor der Veröffentlichung die Metadaten in `SKILL.md`. Deklarieren Sie erforderliche Umgebungsvariablen, Werkzeuge und Berechtigungen, damit Benutzer vor der Installation erkennen können, was der Skill benötigt. Weitere Informationen finden Sie unter [Skill-Format](/de/clawhub/skill-format).

Bei Repositorys mit mehreren Skills ruft der wiederverwendbare GitHub-Arbeitsablauf `skill publish` für jeden direkt unter `skills/` liegenden Skill-Ordner auf:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## Ein Plugin veröffentlichen

Veröffentlichen Sie ein Plugin aus einem lokalen Ordner, einem GitHub-Repository, einer GitHub-Referenz oder einem vorhandenen Archiv:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Verwenden Sie zunächst `--dry-run`, um vor der Veröffentlichung eine Vorschau der aufgelösten Paketmetadaten, Kompatibilitätsfelder, Quellenangabe und des Uploadplans anzuzeigen.

Code-Plugins müssen OpenClaw-Kompatibilitätsmetadaten in `package.json` enthalten, darunter `openclaw.compat.pluginApi` und `openclaw.build.openclawVersion`.

## Vor der Installation prüfen

Verwenden Sie vor der Installation die ClawHub-Webseite oder die Detailbefehle der CLI, um Metadaten, Quelllinks, Versionen, Änderungsprotokolle und den Prüfstatus einzusehen:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

Öffentliche Einträge zeigen den neuesten Prüfstatus. Veröffentlichungen, die von der Moderation zurückgehalten oder blockiert werden, können bis zur Klärung in der Suche und auf Installationsoberflächen ausgeblendet sein.
