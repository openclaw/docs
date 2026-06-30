---
read_when:
    - ClawHub zum ersten Mal verwenden
    - Installieren eines Skills oder Plugins aus der Registry
    - Veröffentlichen in ClawHub
summary: 'ClawHub nutzen: Skills oder Plugins finden, installieren, aktualisieren und veröffentlichen.'
x-i18n:
    generated_at: "2026-06-30T22:10:31Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f6d61bd32a359a843e68140cc90b4ff4bcc64645ea425ea4654c668d6d3d04ec
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Schnellstart

ClawHub ist ein Registry für OpenClaw Skills und Plugins.

Verwenden Sie OpenClaw, wenn Sie Dinge in OpenClaw installieren. Verwenden Sie die `clawhub` CLI,
wenn Sie sich anmelden, veröffentlichen, Ihre eigenen Einträge verwalten oder
Registry-spezifische Workflows nutzen.

## Einen Skill finden und installieren

Suchen über OpenClaw:

```bash
openclaw skills search "calendar"
```

Einen Skill installieren:

```bash
openclaw skills install @openclaw/demo
```

Installierte Skills aktualisieren:

```bash
openclaw skills update --all
```

OpenClaw speichert, woher der Skill stammt, damit spätere Aktualisierungen weiterhin
über ClawHub aufgelöst werden können.

## Ein Plugin finden und installieren

Suchen über OpenClaw:

```bash
openclaw plugins search "calendar"
```

Ein von ClawHub gehostetes Plugin mit einer expliziten ClawHub-Quelle installieren:

```bash
openclaw plugins install clawhub:<package>
```

Installierte Plugins aktualisieren:

```bash
openclaw plugins update --all
```

Verwenden Sie das Präfix `clawhub:`, wenn OpenClaw das Paket über
ClawHub statt über npm oder eine andere Quelle auflösen soll.

## Für die Veröffentlichung anmelden

Installieren Sie die ClawHub CLI:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

Mit GitHub anmelden:

```bash
clawhub login
clawhub whoami
```

Headless-Umgebungen können ein API-Token aus der ClawHub-Weboberfläche verwenden:

```bash
clawhub login --token clh_...
```

## Einen Skill veröffentlichen

Ein Skill ist ein Ordner mit einer erforderlichen Datei `SKILL.md` und optionalen unterstützenden
Dateien.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --changelog "Initial release"
```

Der Befehl überspringt unveränderte Inhalte. Neue Skills beginnen bei `1.0.0`; spätere Änderungen
veröffentlichen automatisch die nächste Patch-Version. Verwenden Sie `--dry-run` für eine Vorschau oder
`--version`, um eine explizite Version auszuwählen.

Prüfen Sie vor der Veröffentlichung die Metadaten in `SKILL.md`. Deklarieren Sie erforderliche
Umgebungsvariablen, Tools und Berechtigungen, damit Benutzer verstehen, was der
Skill benötigt, bevor sie ihn installieren. Siehe [Skill-Format](/de/clawhub/skill-format).

Für Repositories mit mehreren Skills ruft der wiederverwendbare GitHub-Workflow
`skill publish` für jeden unmittelbaren Skill-Ordner unter `skills/` auf:

```yaml
jobs:
  preview:
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@main
    with:
      dry_run: true
```

## Ein Plugin veröffentlichen

Veröffentlichen Sie ein Plugin aus einem lokalen Ordner, einem GitHub-Repository, einer GitHub-Ref oder einem
vorhandenen Archiv:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Verwenden Sie zuerst `--dry-run`, um die aufgelösten Paketmetadaten, Kompatibilitätsfelder,
Quellenzuordnung und den Upload-Plan ohne Veröffentlichung in der Vorschau zu prüfen.

Code-Plugins müssen OpenClaw-Kompatibilitätsmetadaten in `package.json` enthalten,
einschließlich `openclaw.compat.pluginApi` und `openclaw.build.openclawVersion`.

## Vor der Installation prüfen

Verwenden Sie vor der Installation die ClawHub-Webseite oder CLI-Detailbefehle, um
Metadaten, Quelllinks, Versionen, Changelogs und Scan-Status zu prüfen:

```bash
clawhub inspect @openclaw/demo
clawhub package inspect <package>
```

Öffentliche Einträge zeigen den neuesten Scan-Status. Releases, die von der
Moderation zurückgehalten oder blockiert werden, können bis zur Klärung in Such- und Installationsoberflächen ausgeblendet sein.
