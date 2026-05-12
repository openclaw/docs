---
read_when:
    - ClawHub zum ersten Mal verwenden
    - Installieren eines Skills oder Plugins aus der Registry
    - Veröffentlichen auf ClawHub
summary: 'Beginnen Sie mit ClawHub: Skills oder Plugins finden, installieren, aktualisieren und veröffentlichen.'
x-i18n:
    generated_at: "2026-05-12T08:44:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7345a51a6b4fc2348505cacdd687dbf789114efa06c92b8a27306da1c94557b
    source_path: clawhub/quickstart.md
    workflow: 16
---

# Schnellstart

ClawHub ist eine Registry für OpenClaw Skills und Plugins.

Verwenden Sie OpenClaw, wenn Sie Dinge in OpenClaw installieren. Verwenden Sie die `clawhub`-CLI,
wenn Sie sich anmelden, veröffentlichen, Ihre eigenen Einträge verwalten oder
Registry-spezifische Workflows nutzen.

## Einen Skill finden und installieren

Suchen Sie über OpenClaw:

```bash
openclaw skills search "calendar"
```

Installieren Sie einen Skill:

```bash
openclaw skills install <skill-slug>
```

Aktualisieren Sie installierte Skills:

```bash
openclaw skills update --all
```

OpenClaw speichert, woher der Skill stammt, damit spätere Updates weiterhin über
ClawHub aufgelöst werden können.

## Ein Plugin finden und installieren

Suchen Sie über OpenClaw:

```bash
openclaw plugins search "calendar"
```

Installieren Sie ein von ClawHub gehostetes Plugin mit einer expliziten ClawHub-Quelle:

```bash
openclaw plugins install clawhub:<package>
```

Aktualisieren Sie installierte Plugins:

```bash
openclaw plugins update --all
```

Verwenden Sie das Präfix `clawhub:`, wenn OpenClaw das Paket über
ClawHub statt über npm oder eine andere Quelle auflösen soll.

## Für die Veröffentlichung anmelden

Installieren Sie die ClawHub-CLI:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

Melden Sie sich mit GitHub an:

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
  --version 1.0.0 \
  --changelog "Initial release"
```

Prüfen Sie vor der Veröffentlichung die Metadaten in `SKILL.md`. Deklarieren Sie erforderliche
Umgebungsvariablen, Tools und Berechtigungen, damit Benutzer verstehen können, was der
Skill benötigt, bevor sie ihn installieren. Siehe [Skill-Format](/de/clawhub/skill-format).

## Ein Plugin veröffentlichen

Veröffentlichen Sie ein Plugin aus einem lokalen Ordner, einem GitHub-Repository, einem GitHub-Ref oder einem
vorhandenen Archiv:

```bash
clawhub package publish <source> --family code-plugin --dry-run
clawhub package publish <source> --family code-plugin
```

Verwenden Sie zuerst `--dry-run`, um die aufgelösten Paketmetadaten, Kompatibilitätsfelder,
Quellenzuordnung und den Upload-Plan vor der Veröffentlichung zu prüfen.

Code-Plugins müssen OpenClaw-Kompatibilitätsmetadaten in `package.json` enthalten,
einschließlich `openclaw.compat.pluginApi` und `openclaw.build.openclawVersion`.

## Von Ihnen verwaltete Skills synchronisieren

`sync` durchsucht Skill-Ordner und veröffentlicht neue oder geänderte Skills, die noch nicht
synchronisiert sind.

```bash
clawhub sync --all --dry-run
clawhub sync --all
```

Wenn Sie angemeldet sind, kann `sync` auch eine minimale Installationsmomentaufnahme für
aggregierte Installationszahlen senden. Unter [Telemetry](/de/clawhub/telemetry) erfahren Sie, was gemeldet wird
und wie Sie sich abmelden können.

## Vor der Installation prüfen

Verwenden Sie vor der Installation die ClawHub-Webseite oder CLI-Detailbefehle, um
Metadaten, Quelllinks, Versionen, Changelogs und Scan-Status zu prüfen:

```bash
clawhub inspect <skill-slug>
clawhub package inspect <package>
```

Öffentliche Einträge zeigen den neuesten Scan-Status. Releases, die durch
Moderation zurückgehalten oder blockiert werden, können aus Such- und Installationsoberflächen ausgeblendet werden, bis das Problem behoben ist.
