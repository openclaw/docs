---
read_when:
    - Suchen, Installieren oder Aktualisieren von Skills oder Plugins
    - Veröffentlichen von Skills oder Plugins in der Registry
    - Konfigurieren der ClawHub CLI oder ihrer Umgebungsüberschreibungen
sidebarTitle: ClawHub
summary: 'ClawHub: öffentliche Registry für OpenClaw-Skills und -Plugins, native Installationsabläufe und die ClawHub-CLI'
title: ClawHub
x-i18n:
    generated_at: "2026-04-26T11:40:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9e002bb56b643bfdfb5715ac3632d854df182475be632ebe36c46d04008cf6e5
    source_path: tools/clawhub.md
    workflow: 15
---

ClawHub ist das öffentliche Registry für **OpenClaw Skills und Plugins**.

- Verwenden Sie native `openclaw`-Befehle, um Skills zu suchen, zu installieren und zu aktualisieren sowie Plugins von ClawHub zu installieren.
- Verwenden Sie die separate `clawhub` CLI für Registry-Authentifizierung sowie Publish-, Delete-/Undelete- und Sync-Workflows.

Website: [clawhub.ai](https://clawhub.ai)

## Schnellstart

<Steps>
  <Step title="Suchen">
    ```bash
    openclaw skills search "calendar"
    ```
  </Step>
  <Step title="Installieren">
    ```bash
    openclaw skills install <skill-slug>
    ```
  </Step>
  <Step title="Verwenden">
    Starten Sie eine neue OpenClaw-Sitzung — sie übernimmt den neuen Skill.
  </Step>
  <Step title="Veröffentlichen (optional)">
    Für Registry-authentifizierte Workflows (Publish, Sync, Verwalten) installieren Sie
    die separate `clawhub` CLI:

    ```bash
    npm i -g clawhub
    # or
    pnpm add -g clawhub
    ```

  </Step>
</Steps>

## Native OpenClaw-Abläufe

<Tabs>
  <Tab title="Skills">
    ```bash
    openclaw skills search "calendar"
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Native `openclaw`-Befehle installieren in Ihren aktiven Workspace und
    speichern Quellmetadaten, damit spätere `update`-Aufrufe auf ClawHub bleiben können.

  </Tab>
  <Tab title="Plugins">
    ```bash
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    Reine npm-sichere Plugin-Spezifikationen werden ebenfalls zuerst gegen ClawHub und erst danach gegen npm versucht:

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    Plugin-Installationen validieren die angekündigte Kompatibilität von `pluginApi` und
    `minGatewayVersion`, bevor die Archivinstallation ausgeführt wird, sodass
    inkompatible Hosts frühzeitig sicher fehlschlagen, statt das Paket nur teilweise zu installieren.

  </Tab>
</Tabs>

<Note>
`openclaw plugins install clawhub:...` akzeptiert nur installierbare Plugin-
Familien. Wenn ein ClawHub-Paket tatsächlich ein Skill ist, stoppt OpenClaw und
verweist Sie stattdessen auf `openclaw skills install <slug>`.

Anonyme ClawHub-Plugin-Installationen schlagen bei privaten Paketen ebenfalls sicher fehl.
Community- oder andere nicht offizielle Kanäle können weiterhin installieren, aber OpenClaw
warnt, damit Betreiber Quelle und Verifizierung prüfen können, bevor sie diese aktivieren.
</Note>

## Was ClawHub ist

- Eine öffentliche Registry für OpenClaw Skills und Plugins.
- Ein versionierter Speicher für Skill-Bundles und Metadaten.
- Eine Oberfläche zur Entdeckung für Suche, Tags und Nutzungssignale.

Ein typischer Skill ist ein versioniertes Bundle von Dateien, das Folgendes enthält:

- Eine `SKILL.md`-Datei mit der primären Beschreibung und Verwendung.
- Optionale Konfigurationen, Skripte oder unterstützende Dateien, die vom Skill verwendet werden.
- Metadaten wie Tags, Zusammenfassung und Installationsanforderungen.

ClawHub verwendet Metadaten, um die Auffindbarkeit zu unterstützen und Skill-
Fähigkeiten sicher bereitzustellen. Die Registry verfolgt Nutzungssignale (Sterne, Downloads), um Ranking und Sichtbarkeit zu
verbessern. Jede Veröffentlichung erstellt eine neue Semver-
Version, und die Registry behält den Versionsverlauf bei, damit Benutzer
Änderungen prüfen können.

## Workspace- und Skill-Laden

Die separate `clawhub` CLI installiert Skills auch in `./skills` unter
Ihrem aktuellen Arbeitsverzeichnis. Wenn ein OpenClaw-Workspace konfiguriert ist,
greift `clawhub` auf diesen Workspace zurück, sofern Sie `--workdir`
(oder `CLAWHUB_WORKDIR`) nicht überschreiben. OpenClaw lädt Workspace-Skills aus
`<workspace>/skills` und übernimmt sie in der **nächsten** Sitzung.

Wenn Sie bereits `~/.openclaw/skills` oder gebündelte Skills verwenden,
haben Workspace-Skills Vorrang. Weitere Details dazu, wie Skills geladen,
geteilt und gesteuert werden, finden Sie unter [Skills](/de/tools/skills).

## Service-Funktionen

| Funktion           | Hinweise                                                   |
| ------------------ | ---------------------------------------------------------- |
| Öffentliches Browsen | Skills und ihr `SKILL.md`-Inhalt sind öffentlich einsehbar. |
| Suche              | Embedding-basiert (Vektorsuche), nicht nur Schlüsselwörter. |
| Versionierung      | Semver, Changelogs und Tags (einschließlich `latest`).     |
| Downloads          | Zip pro Version.                                           |
| Sterne und Kommentare | Community-Feedback.                                     |
| Moderation         | Freigaben und Audits.                                      |
| CLI-freundliche API | Geeignet für Automatisierung und Skripting.               |

## Sicherheit und Moderation

ClawHub ist standardmäßig offen — jeder kann Skills hochladen, aber ein GitHub-
Konto muss **mindestens eine Woche alt** sein, um veröffentlichen zu können. Das verlangsamt
Missbrauch, ohne legitime Mitwirkende zu blockieren.

<AccordionGroup>
  <Accordion title="Melden">
    - Jeder angemeldete Benutzer kann einen Skill melden.
    - Meldegründe sind erforderlich und werden protokolliert.
    - Jeder Benutzer kann gleichzeitig bis zu 20 aktive Meldungen haben.
    - Skills mit mehr als 3 eindeutigen Meldungen werden standardmäßig automatisch ausgeblendet.

  </Accordion>
  <Accordion title="Moderation">
    - Moderatoren können ausgeblendete Skills anzeigen, sie wieder einblenden, löschen oder Benutzer sperren.
    - Missbrauch der Meldefunktion kann zu Kontosperrungen führen.
    - Sie möchten Moderator werden? Fragen Sie im OpenClaw Discord und kontaktieren Sie einen Moderator oder Maintainer.

  </Accordion>
</AccordionGroup>

## ClawHub CLI

Sie benötigen diese nur für Registry-authentifizierte Workflows wie
Publish/Sync.

### Globale Optionen

<ParamField path="--workdir <dir>" type="string">
  Arbeitsverzeichnis. Standard: aktuelles Verzeichnis; greift auf den OpenClaw-Workspace zurück.
</ParamField>
<ParamField path="--dir <dir>" type="string" default="skills">
  Skills-Verzeichnis, relativ zum Arbeitsverzeichnis.
</ParamField>
<ParamField path="--site <url>" type="string">
  Basis-URL der Website (Browser-Login).
</ParamField>
<ParamField path="--registry <url>" type="string">
  Basis-URL der Registry-API.
</ParamField>
<ParamField path="--no-input" type="boolean">
  Eingabeaufforderungen deaktivieren (nicht interaktiv).
</ParamField>
<ParamField path="-V, --cli-version" type="boolean">
  CLI-Version ausgeben.
</ParamField>

### Befehle

<AccordionGroup>
  <Accordion title="Authentifizierung (login / logout / whoami)">
    ```bash
    clawhub login              # browser flow
    clawhub login --token <token>
    clawhub logout
    clawhub whoami
    ```

    Login-Optionen:

    - `--token <token>` — ein API-Token einfügen.
    - `--label <label>` — gespeichertes Label für Browser-Login-Token (Standard: `CLI token`).
    - `--no-browser` — keinen Browser öffnen (erfordert `--token`).

  </Accordion>
  <Accordion title="Suchen">
    ```bash
    clawhub search "query"
    ```

    - `--limit <n>` — maximale Ergebnisse.

  </Accordion>
  <Accordion title="Installieren / aktualisieren / auflisten">
    ```bash
    clawhub install <slug>
    clawhub update <slug>
    clawhub update --all
    clawhub list
    ```

    Optionen:

    - `--version <version>` — auf eine bestimmte Version installieren oder aktualisieren (bei `update` nur mit einem einzelnen Slug).
    - `--force` — überschreiben, wenn der Ordner bereits existiert oder lokale Dateien keiner veröffentlichten Version entsprechen.
    - `clawhub list` liest `.clawhub/lock.json`.

  </Accordion>
  <Accordion title="Skills veröffentlichen">
    ```bash
    clawhub skill publish <path>
    ```

    Optionen:

    - `--slug <slug>` — Skill-Slug.
    - `--name <name>` — Anzeigename.
    - `--version <version>` — Semver-Version.
    - `--changelog <text>` — Changelog-Text (kann leer sein).
    - `--tags <tags>` — kommaseparierte Tags (Standard: `latest`).

  </Accordion>
  <Accordion title="Plugins veröffentlichen">
    ```bash
    clawhub package publish <source>
    ```

    `<source>` kann ein lokaler Ordner, `owner/repo`, `owner/repo@ref` oder eine
    GitHub-URL sein.

    Optionen:

    - `--dry-run` — den exakten Veröffentlichungsplan erstellen, ohne etwas hochzuladen.
    - `--json` — maschinenlesbare Ausgabe für CI erzeugen.
    - `--source-repo`, `--source-commit`, `--source-ref` — optionale Überschreibungen, wenn die automatische Erkennung nicht ausreicht.

  </Accordion>
  <Accordion title="Löschen / Wiederherstellen (Eigentümer oder Admin)">
    ```bash
    clawhub delete <slug> --yes
    clawhub undelete <slug> --yes
    ```
  </Accordion>
  <Accordion title="Sync (lokal scannen + neue oder aktualisierte veröffentlichen)">
    ```bash
    clawhub sync
    ```

    Optionen:

    - `--root <dir...>` — zusätzliche Scan-Wurzeln.
    - `--all` — alles ohne Eingabeaufforderungen hochladen.
    - `--dry-run` — zeigen, was hochgeladen würde.
    - `--bump <type>` — `patch|minor|major` für Aktualisierungen (Standard: `patch`).
    - `--changelog <text>` — Changelog für nicht interaktive Aktualisierungen.
    - `--tags <tags>` — kommaseparierte Tags (Standard: `latest`).
    - `--concurrency <n>` — Registry-Prüfungen (Standard: `4`).

  </Accordion>
</AccordionGroup>

## Häufige Workflows

<Tabs>
  <Tab title="Suchen">
    ```bash
    clawhub search "postgres backups"
    ```
  </Tab>
  <Tab title="Installieren">
    ```bash
    clawhub install my-skill-pack
    ```
  </Tab>
  <Tab title="Alle aktualisieren">
    ```bash
    clawhub update --all
    ```
  </Tab>
  <Tab title="Einen einzelnen Skill veröffentlichen">
    ```bash
    clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
    ```
  </Tab>
  <Tab title="Viele Skills synchronisieren">
    ```bash
    clawhub sync --all
    ```
  </Tab>
  <Tab title="Ein Plugin von GitHub veröffentlichen">
    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    clawhub package publish your-org/your-plugin@v1.0.0
    clawhub package publish https://github.com/your-org/your-plugin
    ```
  </Tab>
</Tabs>

### Plugin-Paketmetadaten

Code-Plugins müssen die erforderlichen OpenClaw-Metadaten in
`package.json` enthalten:

```json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2",
      "minGatewayVersion": "2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2",
      "pluginSdkVersion": "2026.3.24-beta.2"
    }
  }
}
```

Veröffentlichte Pakete sollten **gebautes JavaScript** ausliefern und
`runtimeExtensions` auf diese Ausgabe verweisen lassen. Installationen aus Git-Checkouts können weiterhin
auf TypeScript-Quellcode zurückfallen, wenn keine gebauten Dateien vorhanden sind, aber gebaute Runtime-
Einträge vermeiden die TypeScript-Kompilierung zur Laufzeit beim Start, in doctor und
in Plugin-Ladepfaden.

## Versionierung, Lockfile und Telemetrie

<AccordionGroup>
  <Accordion title="Versionierung und Tags">
    - Jede Veröffentlichung erstellt eine neue **Semver**-`SkillVersion`.
    - Tags (wie `latest`) verweisen auf eine Version; durch das Verschieben von Tags können Sie ein Rollback durchführen.
    - Changelogs werden pro Version angehängt und können beim Synchronisieren oder Veröffentlichen von Aktualisierungen leer sein.

  </Accordion>
  <Accordion title="Lokale Änderungen vs. Registry-Versionen">
    Aktualisierungen vergleichen den lokalen Skill-Inhalt mithilfe eines
    Content-Hashs mit Registry-Versionen. Wenn lokale Dateien keiner veröffentlichten Version entsprechen, fragt die
    CLI vor dem Überschreiben nach (oder erfordert `--force` in
    nicht interaktiven Ausführungen).
  </Accordion>
  <Accordion title="Sync-Scans und Fallback-Wurzeln">
    `clawhub sync` scannt zuerst Ihr aktuelles Arbeitsverzeichnis. Wenn keine Skills
    gefunden werden, greift es auf bekannte ältere Speicherorte zurück (zum Beispiel
    `~/openclaw/skills` und `~/.openclaw/skills`). Das ist darauf ausgelegt,
    ältere Skill-Installationen ohne zusätzliche Flags zu finden.
  </Accordion>
  <Accordion title="Speicher und Lockfile">
    - Installierte Skills werden in `.clawhub/lock.json` unter Ihrem Arbeitsverzeichnis erfasst.
    - Auth-Token werden in der Konfigurationsdatei der ClawHub CLI gespeichert (überschreibbar über `CLAWHUB_CONFIG_PATH`).

  </Accordion>
  <Accordion title="Telemetrie (Installationszahlen)">
    Wenn Sie `clawhub sync` im angemeldeten Zustand ausführen, sendet die CLI einen minimalen
    Snapshot zur Berechnung der Installationszahlen. Sie können dies vollständig deaktivieren:

    ```bash
    export CLAWHUB_DISABLE_TELEMETRY=1
    ```

  </Accordion>
</AccordionGroup>

## Umgebungsvariablen

| Variable                      | Wirkung                                          |
| ----------------------------- | ------------------------------------------------ |
| `CLAWHUB_SITE`                | Überschreibt die Website-URL.                    |
| `CLAWHUB_REGISTRY`            | Überschreibt die URL der Registry-API.           |
| `CLAWHUB_CONFIG_PATH`         | Überschreibt den Speicherort für Token/Konfiguration der CLI. |
| `CLAWHUB_WORKDIR`             | Überschreibt das Standard-Arbeitsverzeichnis.    |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Deaktiviert Telemetrie bei `sync`.               |

## Verwandt

- [Community-Plugins](/de/plugins/community)
- [Plugins](/de/tools/plugin)
- [Skills](/de/tools/skills)
