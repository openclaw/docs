---
read_when:
    - Erklärung, was ClawHub ist
    - Skills oder Plugins suchen, installieren oder aktualisieren
    - Veröffentlichen von Skills oder Plugins in der Registry
    - Auswahl zwischen den CLI-Abläufen von openclaw und clawhub
sidebarTitle: ClawHub
summary: Öffentliche ClawHub-Übersicht für Auffinden, Installation, Veröffentlichung, Sicherheit und die clawhub CLI.
title: ClawHub
x-i18n:
    generated_at: "2026-05-12T12:53:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0543f0565d2768e9fd77270851eb1043d252071572ff5cd5c70a5e7e38abf149
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub ist das öffentliche Registry für OpenClaw Skills und Plugins.

- Verwenden Sie native `openclaw`-Befehle, um Skills zu suchen, zu installieren und zu aktualisieren sowie Plugins aus ClawHub zu installieren.
- Verwenden Sie die separate `clawhub` CLI für Registry-Authentifizierung, Veröffentlichung, Löschen/Wiederherstellen und Synchronisierungs-Workflows.

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

Installieren Sie die ClawHub CLI, wenn Sie Registry-authentifizierte Workflows wie
Veröffentlichen, Synchronisieren oder Löschen/Wiederherstellen verwenden möchten:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## Was ClawHub hostet

| Oberfläche     | Was sie speichert                                         | Typischer Befehl                             |
| -------------- | --------------------------------------------------------- | -------------------------------------------- |
| Skills         | Versionierte Text-Bundles mit `SKILL.md` plus Begleitdateien | `openclaw skills install <slug>`             |
| Code-Plugins   | OpenClaw Plugin-Pakete mit Kompatibilitätsmetadaten       | `openclaw plugins install clawhub:<package>` |
| Bundle-Plugins | Gepackte Plugin-Bundles für die OpenClaw-Distribution     | `clawhub package publish <source>`           |
| Souls          | `SOUL.md`-Bundles, die auf onlycrabs.ai angezeigt werden  | Veröffentlichungsabläufe über Web und API    |

ClawHub verfolgt semver-Versionen, Tags wie `latest`, Changelogs, Dateien,
Downloads, Sterne und Zusammenfassungen von Sicherheitsscans. Öffentliche Seiten zeigen den aktuellen Registry-
Status, damit Benutzer einen Skill oder ein Plugin prüfen können, bevor sie es installieren.

## Native OpenClaw-Abläufe

Native OpenClaw-Befehle installieren in den aktiven OpenClaw-Arbeitsbereich und speichern
Quellmetadaten, damit spätere Aktualisierungsbefehle bei ClawHub bleiben können.

Verwenden Sie `clawhub:<package>`, wenn eine Plugin-Installation über ClawHub aufgelöst werden soll.
Einfache npm-sichere Plugin-Spezifikationen können während Launch-Umstellungen über npm aufgelöst werden, und
`npm:<package>` bleibt npm-only, wenn eine Quelle explizit sein muss.

Plugin-Installationen validieren die angegebene Kompatibilität von `pluginApi` und `minGatewayVersion`,
bevor die Archivinstallation ausgeführt wird. Wenn eine Paketversion ein
ClawPack-Artefakt veröffentlicht, bevorzugt OpenClaw das exakt hochgeladene npm-pack-`.tgz`, verifiziert
den ClawHub-Digest-Header und die heruntergeladenen Bytes und zeichnet Artefaktmetadaten für
spätere Aktualisierungen auf.

## ClawHub CLI

Die ClawHub CLI ist für Registry-authentifizierte Arbeit vorgesehen:

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

Die CLI hat außerdem Befehle zum Installieren/Aktualisieren von Skills für direkte Registry-Workflows:

```bash
clawhub install <slug>
clawhub update <slug>
clawhub update --all
clawhub list
```

Diese Befehle installieren Skills in `./skills` unter dem aktuellen Arbeitsverzeichnis
und zeichnen installierte Versionen in `.clawhub/lock.json` auf.

## Veröffentlichung

Veröffentlichen Sie Skills aus einem lokalen Ordner, der `SKILL.md` enthält:

```bash
clawhub skill publish <path>
```

Häufige Veröffentlichungsoptionen:

- `--slug <slug>`: Skill-Slug.
- `--name <name>`: Anzeigename.
- `--version <version>`: semver-Version.
- `--changelog <text>`: Changelog-Text.
- `--tags <tags>`: kommagetrennte Tags, standardmäßig `latest`.

Veröffentlichen Sie Plugins aus einem lokalen Ordner, `owner/repo`, `owner/repo@ref` oder einer GitHub-
URL:

```bash
clawhub package publish <source>
```

Verwenden Sie `--dry-run`, um den exakten Veröffentlichungsplan ohne Upload zu erstellen, und `--json`
für CI-freundliche Ausgabe.

Code-Plugins müssen die erforderlichen OpenClaw-Kompatibilitätsmetadaten in
`package.json` enthalten, darunter `openclaw.compat.pluginApi` und
`openclaw.build.openclawVersion`. Siehe [CLI](/de/clawhub/cli) für die vollständige Befehlsreferenz
und [Skill-Format](/de/clawhub/skill-format) für Skill-Metadaten.

## Sicherheit und Moderation

ClawHub ist standardmäßig offen: Jeder kann etwas hochladen, aber die Veröffentlichung erfordert ein GitHub-
Konto, das alt genug ist, um die Upload-Schranke zu passieren. Öffentliche Detailseiten fassen den
neuesten Scanstatus vor der Installation oder dem Download zusammen.

ClawHub führt automatisierte Prüfungen für veröffentlichte Skills und Plugin-Releases aus. Durch Scans zurückgehaltene
oder blockierte Releases können aus dem öffentlichen Katalog und den Installationsoberflächen verschwinden, während
sie für ihren Besitzer in `/dashboard` sichtbar bleiben.

Angemeldete Benutzer können Skills und Pakete melden. Moderatoren können Meldungen prüfen,
Inhalte ausblenden oder wiederherstellen und missbräuchliche Konten sperren. Siehe
[Zulässige Nutzung](/de/clawhub/acceptable-usage) und
[Sicherheit + Moderation](/de/clawhub/security) für Details zu Richtlinien und Durchsetzung.

## Telemetrie und Umgebung

Wenn Sie `clawhub sync` ausführen, während Sie angemeldet sind, sendet die CLI einen minimalen Snapshot, damit
ClawHub Installationszahlen berechnen kann. Deaktivieren Sie dies mit:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Nützliche Umgebungs-Overrides:

| Variable                      | Wirkung                                             |
| ----------------------------- | --------------------------------------------------- |
| `CLAWHUB_SITE`                | Überschreibt die Website-URL für die Browser-Anmeldung. |
| `CLAWHUB_REGISTRY`            | Überschreibt die URL der Registry-API.              |
| `CLAWHUB_CONFIG_PATH`         | Überschreibt, wo die CLI Token-/Konfigurationsstatus speichert. |
| `CLAWHUB_WORKDIR`             | Überschreibt das Standardarbeitsverzeichnis.        |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Deaktiviert Telemetrie bei `sync`.                  |

Siehe [Telemetrie](/de/clawhub/telemetry), [HTTP API](/de/clawhub/http-api) und
[Fehlerbehebung](/de/clawhub/troubleshooting) für ausführlicheres Referenzmaterial.
