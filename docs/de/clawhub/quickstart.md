---
read_when:
    - ClawHub zum ersten Mal verwenden
    - Installieren eines Skills oder Plugins aus der Registry
    - Veröffentlichen auf ClawHub
summary: 'Erste Schritte mit ClawHub: Skills oder Plugins finden, installieren, aktualisieren und veröffentlichen.'
x-i18n:
    generated_at: "2026-05-10T19:25:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7345a51a6b4fc2348505cacdd687dbf789114efa06c92b8a27306da1c94557b
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Schnellstart

ClawHub ist ein Register für OpenClaw-Skills und -Plugins.

Verwenden Sie OpenClaw, wenn Sie Dinge in OpenClaw installieren. Verwenden Sie die `clawhub`-CLI,
wenn Sie sich anmelden, veröffentlichen, Ihre eigenen Einträge verwalten oder
registerspezifische Workflows verwenden.

## Skill suchen und installieren

Aus OpenClaw heraus suchen:

```bash
openclaw skills search "calendar"
```

Einen Skill installieren:

```bash
openclaw skills install <skill-slug>
```

Installierte Skills aktualisieren:

```bash
openclaw skills update --all
```

OpenClaw zeichnet auf, woher der Skill stammt, damit spätere Updates weiterhin
über ClawHub aufgelöst werden können.

## Plugin suchen und installieren

Aus OpenClaw heraus suchen:

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

## Für das Veröffentlichen anmelden

Installieren Sie die ClawHub-CLI:

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

## Skill veröffentlichen

Ein Skill ist ein Ordner mit einer erforderlichen Datei `SKILL.md` und optionalen unterstützenden
Dateien.

```bash
clawhub skill publish ./my-skill \
  --slug my-skill \
  --name "My Skill" \
  --version 1.0.0 \
  --changelog "Initial release"
```

Prüfen Sie vor dem Veröffentlichen die Metadaten in `SKILL.md`. Deklarieren Sie erforderliche
Umgebungsvariablen, Tools und Berechtigungen, damit Benutzer verstehen können, was der
Skill benötigt, bevor sie ihn installieren. Siehe [Skill-Format](/de/clawhub/skill-format).

## Plugin veröffentlichen

Veröffentlichen Sie ein Plugin aus einem lokalen Ordner, einem GitHub-Repository, einer GitHub-Ref oder einem
vorhandenen Archiv:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Verwenden Sie zuerst `--dry-run`, um die aufgelösten Paketmetadaten, Kompatibilitätsfelder,
Quellenangaben und den Upload-Plan vorab zu prüfen, ohne zu veröffentlichen.

Code-Plugins müssen OpenClaw-Kompatibilitätsmetadaten in `package.json` enthalten,
einschließlich `openclaw.compat.pluginApi` und `openclaw.build.openclawVersion`.

## Von Ihnen verwaltete Skills synchronisieren

`sync` durchsucht Skill-Ordner und veröffentlicht neue oder geänderte Skills, die noch nicht
synchronisiert sind.

```bash
clawhub sync --all --dry-run
clawhub sync --all
```

Wenn Sie angemeldet sind, kann `sync` außerdem einen minimalen Installations-Snapshot für
aggregierte Installationszahlen senden. Siehe [Telemetrie](/de/clawhub/telemetry), um zu erfahren, was gemeldet wird
und wie Sie sich abmelden können.

## Vor der Installation prüfen

Verwenden Sie vor der Installation die ClawHub-Webseite oder die Detailbefehle der CLI, um
Metadaten, Quelllinks, Versionen, Changelogs und Scan-Status zu prüfen:

```bash
clawhub inspect <skill-slug>
clawhub package inspect <package>
```

Öffentliche Einträge zeigen den neuesten Scan-Status. Releases, die von der
Moderation zurückgehalten oder blockiert werden, können bis zur Klärung in Such- und Installationsoberflächen verborgen bleiben.
