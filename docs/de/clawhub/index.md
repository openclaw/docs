---
read_when:
    - Erklärung, was ClawHub ist
    - Skills oder Plugins suchen, installieren oder aktualisieren
    - Veröffentlichen von Skills oder Plugins in der Registry
    - Auswahl zwischen den CLI-Abläufen von openclaw und clawhub
sidebarTitle: ClawHub
summary: Öffentliche ClawHub-Übersicht zum Entdecken, Installieren und Veröffentlichen sowie zu Sicherheit und der clawhub-CLI.
title: ClawHub
x-i18n:
    generated_at: "2026-05-10T19:26:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 023fec4cd9d6fce2f2da79d1f975ebda37b79c21a73c17aa1804f425527f3e40
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub ist die öffentliche Registry für OpenClaw Skills und Plugins.

- Verwenden Sie native `openclaw`-Befehle, um Skills zu suchen, zu installieren und zu aktualisieren sowie Plugins aus ClawHub zu installieren.
- Verwenden Sie die separate `clawhub`-CLI für Registry-Authentifizierung, Veröffentlichung, Löschen/Wiederherstellen, erneute Scans und Sync-Workflows.

Website: [clawhub.ai](https://clawhub.ai)

## Schnellstart

Skills mit OpenClaw suchen und installieren:

```bash
openclaw skills search "calendar"
openclaw skills install <skill-slug>
openclaw skills update --all
```

Plugins mit OpenClaw suchen und installieren:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Installieren Sie die ClawHub-CLI, wenn Sie Registry-authentifizierte Workflows wie
Veröffentlichen, Synchronisieren, Löschen/Wiederherstellen oder vom Owner angeforderte erneute Scans benötigen:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## Was ClawHub hostet

| Oberfläche     | Was sie speichert                                         | Typischer Befehl                             |
| -------------- | --------------------------------------------------------- | -------------------------------------------- |
| Skills         | Versionierte Text-Bundles mit `SKILL.md` und Zusatzdateien | `openclaw skills install <slug>`             |
| Code-Plugins   | OpenClaw-Plugin-Pakete mit Kompatibilitätsmetadaten        | `openclaw plugins install clawhub:<package>` |
| Bundle-Plugins | Paketierte Plugin-Bundles für die OpenClaw-Distribution    | `clawhub package publish <source>`           |
| Souls          | `SOUL.md`-Bundles, die auf onlycrabs.ai angezeigt werden   | Veröffentlichungsabläufe über Web und API    |

ClawHub verfolgt Semver-Versionen, Tags wie `latest`, Changelogs, Dateien,
Downloads, Sterne und Zusammenfassungen von Sicherheitsscans. Öffentliche Seiten zeigen den aktuellen Registry-
Status, damit Benutzer einen Skill oder ein Plugin vor der Installation prüfen können.

## Native OpenClaw-Abläufe

Native OpenClaw-Befehle installieren in den aktiven OpenClaw-Arbeitsbereich und speichern
Quellmetadaten, damit spätere Aktualisierungsbefehle bei ClawHub bleiben können.

Verwenden Sie `clawhub:<package>`, wenn eine Plugin-Installation über ClawHub aufgelöst werden soll.
Bloße npm-sichere Plugin-Spezifikationen können während Launch-Umstellungen über npm aufgelöst werden, und
`npm:<package>` bleibt ausschließlich npm-basiert, wenn eine Quelle explizit sein muss.

Plugin-Installationen prüfen die angekündigte Kompatibilität von `pluginApi` und `minGatewayVersion`,
bevor die Archivinstallation ausgeführt wird. Wenn eine Paketversion ein
ClawPack-Artefakt veröffentlicht, bevorzugt OpenClaw das exakt hochgeladene npm-pack-`.tgz`, prüft
den ClawHub-Digest-Header und die heruntergeladenen Bytes und zeichnet Artefaktmetadaten für
spätere Aktualisierungen auf.

## ClawHub-CLI

Die ClawHub-CLI ist für Registry-authentifizierte Arbeit gedacht:

```bash
clawhub login
clawhub whoami
clawhub search "postgres backups"
clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0
clawhub package explore --family code-plugin
clawhub package inspect episodic-claw
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub sync --all
```

Die CLI bietet außerdem Skill-Installations- und Aktualisierungsbefehle für direkte Registry-Workflows:

```bash
clawhub install <slug>
clawhub update <slug>
clawhub update --all
clawhub list
```

Diese Befehle installieren Skills in `./skills` unterhalb des aktuellen Arbeitsverzeichnisses
und zeichnen installierte Versionen in `.clawhub/lock.json` auf.

## Veröffentlichen

Veröffentlichen Sie Skills aus einem lokalen Ordner, der `SKILL.md` enthält:

```bash
clawhub skill publish <path>
```

Häufige Veröffentlichungsoptionen:

- `--slug <slug>`: Skill-Slug.
- `--name <name>`: Anzeigename.
- `--version <version>`: Semver-Version.
- `--changelog <text>`: Changelog-Text.
- `--tags <tags>`: Durch Kommas getrennte Tags, standardmäßig `latest`.

Veröffentlichen Sie Plugins aus einem lokalen Ordner, `owner/repo`, `owner/repo@ref` oder einer GitHub-
URL:

```bash
clawhub package publish <source>
```

Verwenden Sie `--dry-run`, um den genauen Veröffentlichungsplan ohne Upload zu erstellen, und `--json`
für CI-freundliche Ausgabe.

Code-Plugins müssen die erforderlichen OpenClaw-Kompatibilitätsmetadaten in
`package.json` enthalten, darunter `openclaw.compat.pluginApi` und
`openclaw.build.openclawVersion`. Siehe [CLI](/de/clawhub/cli) für die vollständige Befehlsreferenz
und [Skill-Format](/de/clawhub/skill-format) für Skill-Metadaten.

## Sicherheit und Moderation

ClawHub ist standardmäßig offen: Jeder kann hochladen, aber das Veröffentlichen erfordert ein GitHub-
Konto, das alt genug ist, um das Upload-Gate zu passieren. Öffentliche Detailseiten fassen den
aktuellen Scan-Status vor der Installation oder dem Download zusammen.

ClawHub führt automatisierte Prüfungen für veröffentlichte Skills und Plugin-Releases aus. Von Scans zurückgehaltene
oder blockierte Releases können aus dem öffentlichen Katalog und von Installationsoberflächen verschwinden, bleiben
für ihren Owner aber in `/dashboard` sichtbar.

Owner können begrenzte erneute Scans zur Wiederherstellung bei False Positives anfordern. Plattform-
Moderatoren und Administratoren können bei der Bearbeitung von Support-Meldungen erneute Scans für jeden Skill oder jedes Paket anfordern:

```bash
clawhub skill rescan <slug>
clawhub package rescan <name>
```

Angemeldete Benutzer können Skills und Pakete melden. Moderatoren können Meldungen prüfen,
Inhalte ausblenden oder wiederherstellen, Einsprüche klären und missbräuchliche Konten sperren. Siehe
[Zulässige Nutzung](/de/clawhub/acceptable-usage) und
[Sicherheit + Moderation](/de/clawhub/security) für Details zu Richtlinien und Durchsetzung.

## Telemetrie und Umgebung

Wenn Sie `clawhub sync` ausführen, während Sie angemeldet sind, sendet die CLI einen minimalen Snapshot, damit
ClawHub Installationszahlen berechnen kann. Deaktivieren Sie dies mit:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Nützliche Umgebungs-Overrides:

| Variable                      | Wirkung                                                       |
| ----------------------------- | ------------------------------------------------------------- |
| `CLAWHUB_SITE`                | Überschreibt die für die Browser-Anmeldung verwendete Website-URL. |
| `CLAWHUB_REGISTRY`            | Überschreibt die Registry-API-URL.                            |
| `CLAWHUB_CONFIG_PATH`         | Überschreibt, wo die CLI Token-/Konfigurationsstatus speichert. |
| `CLAWHUB_WORKDIR`             | Überschreibt das standardmäßige Arbeitsverzeichnis.           |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Deaktiviert Telemetrie bei `sync`.                            |

Siehe [Telemetrie](/de/clawhub/telemetry), [HTTP API](/de/clawhub/http-api) und
[Fehlerbehebung](/de/clawhub/troubleshooting) für ausführlicheres Referenzmaterial.
