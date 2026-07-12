---
read_when:
    - Erklärung, was ClawHub ist
    - Skills oder Plugins suchen, installieren oder aktualisieren
    - Skills oder Plugins in der Registry veröffentlichen
    - Auswahl zwischen den CLI-Abläufen von OpenClaw und ClawHub
sidebarTitle: ClawHub
summary: Öffentliche ClawHub-Übersicht für Suche, Installation, Veröffentlichung, Sicherheit und die clawhub-CLI.
title: ClawHub
x-i18n:
    generated_at: "2026-07-12T15:09:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub ist die öffentliche Registry für OpenClaw-Skills und -Plugins.

- Verwenden Sie native `openclaw`-Befehle, um Skills zu suchen, zu installieren und zu aktualisieren sowie Plugins aus ClawHub zu installieren.
- Verwenden Sie die separate `clawhub`-CLI für die Registry-Authentifizierung, die Veröffentlichung sowie Abläufe zum Löschen und Wiederherstellen.

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

Installieren Sie die ClawHub-CLI, wenn Sie Registry-authentifizierte Abläufe wie das Veröffentlichen oder Löschen/Wiederherstellen verwenden möchten:

```bash
npm i -g clawhub
# oder
pnpm add -g clawhub
```

## Was ClawHub bereitstellt

| Oberfläche     | Gespeicherte Inhalte                                           | Typischer Befehl                             |
| -------------- | -------------------------------------------------------------- | -------------------------------------------- |
| Skills         | Versionierte Textpakete mit `SKILL.md` und unterstützenden Dateien | `openclaw skills install @openclaw/demo`     |
| Code-Plugins   | OpenClaw-Plugin-Pakete mit Kompatibilitätsmetadaten            | `openclaw plugins install clawhub:<package>` |
| Bundle-Plugins | Paketierte Plugin-Bundles für die OpenClaw-Distribution        | `clawhub package publish <source>`           |

ClawHub erfasst SemVer-Versionen, Tags wie `latest`, Änderungsprotokolle, Dateien, Downloads, Sterne und Zusammenfassungen von Sicherheitsscans. Öffentliche Seiten zeigen den aktuellen Registry-Status, damit Benutzer einen Skill oder ein Plugin vor der Installation prüfen können.

## Native OpenClaw-Abläufe

Native OpenClaw-Befehle installieren in den aktiven OpenClaw-Arbeitsbereich und speichern Quellmetadaten dauerhaft, sodass spätere Aktualisierungsbefehle weiterhin ClawHub verwenden können.

Verwenden Sie `clawhub:<package>`, wenn die Installation eines Plugins über ClawHub aufgelöst werden soll. Reine npm-kompatible Plugin-Spezifikationen können während Umstellungsphasen bei der Einführung über npm aufgelöst werden, und `npm:<package>` bleibt ausschließlich npm vorbehalten, wenn die Quelle ausdrücklich angegeben werden muss.

Bei Plugin-Installationen wird die angegebene Kompatibilität von `pluginApi` und `minGatewayVersion` geprüft, bevor die Archivinstallation ausgeführt wird. Wenn für eine Paketversion ein ClawPack-Artefakt veröffentlicht wurde, bevorzugt OpenClaw die exakt hochgeladene, mit npm gepackte `.tgz`-Datei, überprüft den ClawHub-Digest-Header und die heruntergeladenen Bytes und speichert Artefaktmetadaten für spätere Aktualisierungen.

## ClawHub-CLI

Die ClawHub-CLI dient Registry-authentifizierten Vorgängen:

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

Die CLI bietet außerdem Befehle zum Installieren und Aktualisieren von Skills für direkte Registry-Abläufe:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

Diese Befehle installieren Skills unter `./skills` im aktuellen Arbeitsverzeichnis und verzeichnen die installierten Versionen in `.clawhub/lock.json`.

## Veröffentlichen

Veröffentlichen Sie Skills aus einem lokalen Ordner, der `SKILL.md` enthält:

```bash
clawhub skill publish <path>
```

Häufig verwendete Veröffentlichungsoptionen:

- `--slug <slug>`: URL-Name des veröffentlichten Skills.
- `--name <name>`: Anzeigename.
- `--version <version>`: SemVer-Version.
- `--changelog <text>`: Text des Änderungsprotokolls.
- `--tags <tags>`: Durch Kommas getrennte Tags; Standardwert ist `latest`.

Veröffentlichen Sie Plugins aus einem lokalen Ordner, über `owner/repo`, `owner/repo@ref` oder eine GitHub-URL:

```bash
clawhub package publish <source>
```

Verwenden Sie `--dry-run`, um den exakten Veröffentlichungsplan ohne Upload zu erstellen, und `--json` für eine CI-freundliche Ausgabe.

Code-Plugins müssen die erforderlichen OpenClaw-Kompatibilitätsmetadaten in `package.json` enthalten, darunter `openclaw.compat.pluginApi` und `openclaw.build.openclawVersion`. Die vollständige Befehlsreferenz finden Sie unter [CLI](/de/clawhub/cli), die Metadaten für Skills unter [Skill-Format](/clawhub/skill-format).

## Sicherheit und Moderation

ClawHub ist standardmäßig offen: Jeder kann Inhalte hochladen, für die Veröffentlichung ist jedoch ein GitHub-Konto erforderlich, das alt genug ist, um die Upload-Prüfung zu bestehen. Öffentliche Detailseiten fassen vor der Installation oder dem Download den aktuellen Scanstatus zusammen.

ClawHub führt automatisierte Prüfungen für veröffentlichte Skills und Plugin-Versionen durch. Wegen einer Scanprüfung zurückgehaltene oder blockierte Versionen können aus dem öffentlichen Katalog und den Installationsoberflächen verschwinden, bleiben für ihre Eigentümer jedoch unter `/dashboard` sichtbar.

Angemeldete Benutzer können Skills und Pakete melden. Moderatoren können Meldungen prüfen, Inhalte ausblenden oder wiederherstellen und missbräuchliche Konten sperren. Einzelheiten zu Richtlinien und deren Durchsetzung finden Sie unter [Sicherheit](/de/clawhub/security), [Sicherheitsaudits](/clawhub/security-audits), [Moderation und Kontosicherheit](/clawhub/moderation) und [Zulässige Nutzung](/clawhub/acceptable-usage).

## Telemetrie und Umgebung

Wenn Sie `clawhub install` im angemeldeten Zustand ausführen, kann die CLI nach bestem Bemühen ein Installationsereignis senden, damit ClawHub aggregierte Installationszahlen berechnen kann. Deaktivieren Sie dies mit:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Nützliche Umgebungsüberschreibungen:

| Variable                      | Wirkung                                                        |
| ----------------------------- | -------------------------------------------------------------- |
| `CLAWHUB_SITE`                | Überschreibt die für die Browser-Anmeldung verwendete Website-URL. |
| `CLAWHUB_REGISTRY`            | Überschreibt die URL der Registry-API.                          |
| `CLAWHUB_CONFIG_PATH`         | Überschreibt den Speicherort für den Token-/Konfigurationsstatus der CLI. |
| `CLAWHUB_WORKDIR`             | Überschreibt das standardmäßige Arbeitsverzeichnis.             |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Deaktiviert die Installationstelemetrie.                        |

Ausführlichere Referenzinformationen finden Sie unter [Telemetrie](/clawhub/telemetry), [HTTP-API](/clawhub/http-api) und [Fehlerbehebung](/de/clawhub/troubleshooting).
