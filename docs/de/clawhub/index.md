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
    generated_at: "2026-07-12T01:29:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fde96ccb410b84dc4d3a48d42bbdbc0a80ac11dfb053afac2ee9e7e9d1605a5b
    source_path: clawhub/index.md
    workflow: 16
---

# ClawHub

ClawHub ist das öffentliche Verzeichnis für OpenClaw-Skills und -Plugins.

- Verwenden Sie die nativen `openclaw`-Befehle, um Skills zu suchen, zu installieren und zu aktualisieren sowie Plugins von ClawHub zu installieren.
- Verwenden Sie die separate `clawhub`-CLI für die Verzeichnisauthentifizierung, die Veröffentlichung sowie Abläufe zum Löschen und Wiederherstellen.

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

Installieren Sie die ClawHub-CLI, wenn Sie im Verzeichnis authentifizierte Abläufe wie das Veröffentlichen oder Löschen/Wiederherstellen verwenden möchten:

```bash
npm i -g clawhub
# oder
pnpm add -g clawhub
```

## Von ClawHub bereitgestellte Inhalte

| Oberfläche     | Gespeicherte Inhalte                                          | Typischer Befehl                              |
| -------------- | ------------------------------------------------------------- | --------------------------------------------- |
| Skills         | Versionierte Textpakete mit `SKILL.md` und ergänzenden Dateien | `openclaw skills install @openclaw/demo`      |
| Code-Plugins   | OpenClaw-Plugin-Pakete mit Kompatibilitätsmetadaten           | `openclaw plugins install clawhub:<package>`  |
| Bundle-Plugins | Paketierte Plugin-Bundles für die OpenClaw-Distribution       | `clawhub package publish <source>`            |

ClawHub erfasst SemVer-Versionen, Tags wie `latest`, Änderungsprotokolle, Dateien, Downloads, Sterne und Zusammenfassungen von Sicherheitsscans. Öffentliche Seiten zeigen den aktuellen Verzeichnisstatus, damit Benutzer einen Skill oder ein Plugin vor der Installation prüfen können.

## Native OpenClaw-Abläufe

Native OpenClaw-Befehle installieren in den aktiven OpenClaw-Arbeitsbereich und speichern Quellmetadaten, damit spätere Aktualisierungsbefehle weiterhin ClawHub verwenden können.

Verwenden Sie `clawhub:<package>`, wenn eine Plugin-Installation über ClawHub aufgelöst werden soll. Reine npm-kompatible Plugin-Spezifikationen können während Umstellungsphasen einer Veröffentlichung über npm aufgelöst werden; `npm:<package>` bleibt ausschließlich npm vorbehalten, wenn die Quelle explizit angegeben werden muss.

Bei Plugin-Installationen wird die angegebene Kompatibilität von `pluginApi` und `minGatewayVersion` geprüft, bevor die Archivinstallation ausgeführt wird. Wenn für eine Paketversion ein ClawPack-Artefakt veröffentlicht wird, bevorzugt OpenClaw die exakt hochgeladene npm-pack-Datei `.tgz`, überprüft den ClawHub-Digest-Header und die heruntergeladenen Bytes und speichert Artefaktmetadaten für spätere Aktualisierungen.

## ClawHub-CLI

Die ClawHub-CLI dient der authentifizierten Arbeit mit dem Verzeichnis:

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

Die CLI bietet außerdem Befehle zum Installieren und Aktualisieren von Skills für direkte Verzeichnisabläufe:

```bash
clawhub install @openclaw/demo
clawhub update @openclaw/demo
clawhub update --all
clawhub list
```

Diese Befehle installieren Skills unter `./skills` im aktuellen Arbeitsverzeichnis und erfassen die installierten Versionen in `.clawhub/lock.json`.

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
- `--tags <tags>`: Durch Kommas getrennte Tags; standardmäßig `latest`.

Veröffentlichen Sie Plugins aus einem lokalen Ordner, über `owner/repo`, `owner/repo@ref` oder eine GitHub-URL:

```bash
clawhub package publish <source>
```

Verwenden Sie `--dry-run`, um den exakten Veröffentlichungsplan ohne Hochladen zu erstellen, und `--json` für eine CI-freundliche Ausgabe.

Code-Plugins müssen die erforderlichen OpenClaw-Kompatibilitätsmetadaten in `package.json` enthalten, darunter `openclaw.compat.pluginApi` und `openclaw.build.openclawVersion`. Die vollständige Befehlsreferenz finden Sie unter [CLI](/de/clawhub/cli), Informationen zu Skill-Metadaten unter [Skill-Format](/clawhub/skill-format).

## Sicherheit und Moderation

ClawHub ist standardmäßig offen: Jeder kann Inhalte hochladen, für die Veröffentlichung ist jedoch ein GitHub-Konto erforderlich, das alt genug ist, um die Upload-Prüfung zu bestehen. Öffentliche Detailseiten fassen vor der Installation oder dem Herunterladen den aktuellen Scanstatus zusammen.

ClawHub führt automatisierte Prüfungen veröffentlichter Skills und Plugin-Versionen durch. Zur Prüfung zurückgehaltene oder gesperrte Versionen werden möglicherweise nicht mehr im öffentlichen Katalog und auf Installationsoberflächen angezeigt, bleiben für ihre Eigentümer jedoch unter `/dashboard` sichtbar.

Angemeldete Benutzer können Skills und Pakete melden. Moderatoren können Meldungen prüfen, Inhalte ausblenden oder wiederherstellen und missbräuchliche Konten sperren. Einzelheiten zu Richtlinien und deren Durchsetzung finden Sie unter [Sicherheit](/clawhub/security), [Sicherheitsaudits](/de/clawhub/security-audits), [Moderation und Kontosicherheit](/clawhub/moderation) und [Zulässige Nutzung](/clawhub/acceptable-usage).

## Telemetrie und Umgebung

Wenn Sie angemeldet `clawhub install` ausführen, kann die CLI nach dem Best-Effort-Prinzip ein Installationsereignis senden, damit ClawHub aggregierte Installationszahlen berechnen kann. Deaktivieren Sie dies mit:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Nützliche Umgebungsüberschreibungen:

| Variable                      | Auswirkung                                                        |
| ----------------------------- | ----------------------------------------------------------------- |
| `CLAWHUB_SITE`                | Überschreibt die für die Browseranmeldung verwendete Website-URL. |
| `CLAWHUB_REGISTRY`            | Überschreibt die API-URL des Verzeichnisses.                      |
| `CLAWHUB_CONFIG_PATH`         | Überschreibt den Speicherort für Token- und Konfigurationsdaten.  |
| `CLAWHUB_WORKDIR`             | Überschreibt das standardmäßige Arbeitsverzeichnis.               |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Deaktiviert die Installationstelemetrie.                          |

Weiterführende Referenzinformationen finden Sie unter [Telemetrie](/de/clawhub/telemetry), [HTTP-API](/clawhub/http-api) und [Fehlerbehebung](/clawhub/troubleshooting).
