---
read_when:
    - Erklären, was ClawHub ist
    - Skills oder Plugins suchen, installieren oder aktualisieren
    - Skills oder Plugins in der Registry veröffentlichen
    - Zwischen openclaw- und clawhub-CLI-Abläufen wählen
sidebarTitle: ClawHub
summary: Öffentliche ClawHub-Übersicht für Discovery, Installation, Veröffentlichung, Sicherheit und die clawhub-CLI.
title: ClawHub
x-i18n:
    generated_at: "2026-07-03T00:54:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub ist die öffentliche Registry für OpenClaw Skills und Plugins.

- Verwenden Sie native `openclaw`-Befehle, um Skills zu suchen, zu installieren und zu aktualisieren sowie Plugins aus ClawHub zu installieren.
- Verwenden Sie die separate `clawhub`-CLI für Registry-Authentifizierung, Veröffentlichung und Workflows zum Löschen/Wiederherstellen.

Website: [clawhub.ai](https://clawhub.ai)

## Schnellstart

Suchen und installieren Sie Skills mit OpenClaw:

```bash
openclaw skills search "calendar"
openclaw skills install @openclaw/demo
openclaw skills update --all
```

Suchen und installieren Sie Plugins mit OpenClaw:

```bash
openclaw plugins search "calendar"
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Installieren Sie die ClawHub-CLI, wenn Sie Registry-authentifizierte Workflows wie
Veröffentlichen oder Löschen/Wiederherstellen verwenden möchten:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

## Was ClawHub hostet

| Oberfläche    | Was sie speichert                                           | Typischer Befehl                            |
| ------------- | ----------------------------------------------------------- | ------------------------------------------ |
| Skills        | Versionierte Text-Bundles mit `SKILL.md` plus unterstützende Dateien | `openclaw skills install @openclaw/demo`   |
| Code-Plugins  | OpenClaw-Plugin-Pakete mit Kompatibilitätsmetadaten         | `openclaw plugins install clawhub:<package>` |
| Bundle-Plugins | Paketierte Plugin-Bundles für die OpenClaw-Distribution    | `clawhub package publish <source>`         |

ClawHub verfolgt Semver-Versionen, Tags wie `latest`, Changelogs, Dateien,
Downloads, Sterne und Zusammenfassungen von Sicherheitsscans. Öffentliche Seiten zeigen den aktuellen Registry-
Status, damit Benutzer einen Skill oder ein Plugin vor der Installation prüfen können.

## Native OpenClaw-Flows

Native OpenClaw-Befehle installieren in den aktiven OpenClaw-Arbeitsbereich und speichern
Quellmetadaten dauerhaft, damit spätere Aktualisierungsbefehle auf ClawHub bleiben können.

Verwenden Sie `clawhub:<package>`, wenn eine Plugin-Installation über ClawHub aufgelöst werden soll.
Einfache npm-sichere Plugin-Spezifikationen können während Launch-Umstellungen über npm aufgelöst werden, und
`npm:<package>` bleibt npm-only, wenn eine Quelle explizit sein muss.

Plugin-Installationen validieren die angegebene `pluginApi`- und `minGatewayVersion`-
Kompatibilität, bevor die Archivinstallation ausgeführt wird. Wenn eine Paketversion ein
ClawPack-Artefakt veröffentlicht, bevorzugt OpenClaw das exakt hochgeladene npm-Pack-`.tgz`, verifiziert
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
```

Die CLI verfügt außerdem über Skill-Installations- und Aktualisierungsbefehle für direkte Registry-Workflows:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
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

Gängige Veröffentlichungsoptionen:

- `--slug <slug>`: veröffentlichter Skill-URL-Name.
- `--name <name>`: Anzeigename.
- `--version <version>`: Semver-Version.
- `--changelog <text>`: Changelog-Text.
- `--tags <tags>`: durch Kommas getrennte Tags, standardmäßig `latest`.

Veröffentlichen Sie Plugins aus einem lokalen Ordner, `owner/repo`, `owner/repo@ref` oder einer GitHub-
URL:

```bash
clawhub package publish <source>
```

Verwenden Sie `--dry-run`, um den genauen Veröffentlichungsplan ohne Upload zu erstellen, und `--json`
für CI-freundliche Ausgabe.

Code-Plugins müssen die erforderlichen OpenClaw-Kompatibilitätsmetadaten in
`package.json` enthalten, einschließlich `openclaw.compat.pluginApi` und
`openclaw.build.openclawVersion`. Siehe [CLI](/de/clawhub/cli) für die vollständige Befehls-
referenz und [Skill-Format](/clawhub/skill-format) für Skill-Metadaten.

## Sicherheit und Moderation

ClawHub ist standardmäßig offen: Jeder kann hochladen, aber das Veröffentlichen erfordert ein GitHub-
Konto, das alt genug ist, um die Upload-Prüfung zu bestehen. Öffentliche Detailseiten fassen den
neuesten Scan-Status vor der Installation oder dem Download zusammen.

ClawHub führt automatisierte Prüfungen für veröffentlichte Skills und Plugin-Releases aus. Scan-gehaltene
oder blockierte Releases können aus öffentlichen Katalog- und Installationsoberflächen verschwinden, während
sie für ihren Besitzer in `/dashboard` sichtbar bleiben.

Angemeldete Benutzer können Skills und Pakete melden. Moderatoren können Meldungen prüfen,
Inhalte ausblenden oder wiederherstellen und missbräuchliche Konten sperren. Siehe
[Sicherheit](/de/clawhub/security),
[Sicherheitsaudits](/clawhub/security-audits),
[Moderation und Kontosicherheit](/clawhub/moderation) und
[Zulässige Nutzung](/de/clawhub/acceptable-usage) für Richtlinien- und Durchsetzungsdetails.

## Telemetrie und Umgebung

Wenn Sie `clawhub install` ausführen, während Sie angemeldet sind, kann die CLI nach bestem Bemühen
ein Installationsereignis senden, damit ClawHub aggregierte Installationszahlen berechnen kann. Deaktivieren Sie dies mit:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Nützliche Umgebungs-Overrides:

| Variable                      | Wirkung                                           |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | Überschreibt die für Browser-Login verwendete Website-URL. |
| `CLAWHUB_REGISTRY`            | Überschreibt die Registry-API-URL.                |
| `CLAWHUB_CONFIG_PATH`         | Überschreibt, wo die CLI Token-/Konfigurationszustand speichert. |
| `CLAWHUB_WORKDIR`             | Überschreibt das Standardarbeitsverzeichnis.      |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Deaktiviert Installationstelemetrie.              |

Siehe [Telemetrie](/clawhub/telemetry), [HTTP-API](/clawhub/http-api) und
[Fehlerbehebung](/de/clawhub/troubleshooting) für ausführlicheres Referenzmaterial.
