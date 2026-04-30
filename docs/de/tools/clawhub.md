---
read_when:
    - Suchen, Installieren oder Aktualisieren von Skills oder Plugins
    - Skills oder Plugins in der Registry veröffentlichen
    - Konfigurieren der clawhub-CLI oder ihrer Umgebungs-Overrides
sidebarTitle: ClawHub
summary: 'ClawHub: öffentliche Registry für OpenClaw Skills und Plugins, native Installationsabläufe und die clawhub CLI'
title: ClawHub
x-i18n:
    generated_at: "2026-04-30T07:17:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9ec09a3c76820137eb1f7ca829a184fc1ed6392d3b32a327ecbda4d2cad7a78d
    source_path: tools/clawhub.md
    workflow: 16
---

ClawHub ist die öffentliche Registry für **OpenClaw-Skills und -Plugins**.

- Verwenden Sie native `openclaw`-Befehle, um Skills zu suchen, zu installieren und zu aktualisieren sowie Plugins aus ClawHub zu installieren.
- Verwenden Sie die separate `clawhub`-CLI für Registry-Authentifizierung, Veröffentlichen, Löschen/Wiederherstellen und Sync-Workflows.

Site: [clawhub.ai](https://clawhub.ai)

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
    Für Registry-authentifizierte Workflows (Veröffentlichen, Synchronisieren, Verwalten) installieren Sie
    die separate `clawhub`-CLI:

    ```bash
    npm i -g clawhub
    # or
    pnpm add -g clawhub
    ```

  </Step>
</Steps>

## Native OpenClaw-Flows

<Tabs>
  <Tab title="Skills">
    ```bash
    openclaw skills search "calendar"
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    Native `openclaw`-Befehle installieren in Ihren aktiven Workspace und
    speichern Quellmetadaten dauerhaft, damit spätere `update`-Aufrufe auf ClawHub bleiben können.

  </Tab>
  <Tab title="Plugins">
    ```bash
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    Bloße npm-sichere Plugin-Spezifikationen werden ebenfalls vor npm gegen ClawHub geprüft:

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    Verwenden Sie `npm:<package>`, wenn Sie eine reine npm-Auflösung ohne
    ClawHub-Lookup möchten:

    ```bash
    openclaw plugins install npm:openclaw-codex-app-server
    ```

    Plugin-Installationen validieren die angekündigte `pluginApi`- und
    `minGatewayVersion`-Kompatibilität, bevor die Archivinstallation ausgeführt wird, sodass
    inkompatible Hosts früh geschlossen fehlschlagen, statt das Paket teilweise zu installieren.

  </Tab>
</Tabs>

<Note>
`openclaw plugins install clawhub:...` akzeptiert nur installierbare Plugin-
Familien. Wenn ein ClawHub-Paket tatsächlich ein Skill ist, hält OpenClaw an und
verweist Sie stattdessen auf `openclaw skills install <slug>`.

Anonyme ClawHub-Plugin-Installationen schlagen bei privaten Paketen ebenfalls geschlossen fehl.
Community- oder andere nicht offizielle Kanäle können weiterhin installiert werden, aber OpenClaw
warnt, damit Betreiber Quelle und Verifizierung prüfen können, bevor sie
sie aktivieren.
</Note>

## Was ClawHub ist

- Eine öffentliche Registry für OpenClaw-Skills und -Plugins.
- Ein versionierter Speicher für Skill-Bundles und Metadaten.
- Eine Discovery-Oberfläche für Suche, Tags und Nutzungssignale.

Ein typischer Skill ist ein versioniertes Bundle aus Dateien, das Folgendes enthält:

- Eine `SKILL.md`-Datei mit der primären Beschreibung und Verwendung.
- Optionale Konfigurationen, Skripte oder unterstützende Dateien, die vom Skill verwendet werden.
- Metadaten wie Tags, Zusammenfassung und Installationsanforderungen.

ClawHub verwendet Metadaten, um Discovery zu ermöglichen und Skill-
Funktionen sicher offenzulegen. Die Registry verfolgt Nutzungssignale (Sterne, Downloads), um
Ranking und Sichtbarkeit zu verbessern. Jede Veröffentlichung erstellt eine neue Semver-
Version, und die Registry bewahrt den Versionsverlauf auf, damit Benutzer
Änderungen prüfen können.

## Workspace und Laden von Skills

Die separate `clawhub`-CLI installiert Skills auch in `./skills` unter
Ihrem aktuellen Arbeitsverzeichnis. Wenn ein OpenClaw-Workspace konfiguriert ist,
fällt `clawhub` auf diesen Workspace zurück, sofern Sie `--workdir`
(oder `CLAWHUB_WORKDIR`) nicht überschreiben. OpenClaw lädt Workspace-Skills aus
`<workspace>/skills` und übernimmt sie in der **nächsten** Sitzung.

Wenn Sie bereits `~/.openclaw/skills` oder gebündelte Skills verwenden, haben Workspace-
Skills Vorrang. Weitere Details dazu, wie Skills geladen,
geteilt und mit Gates versehen werden, finden Sie unter [Skills](/de/tools/skills).

## Servicefunktionen

| Funktion                 | Hinweise                                                            |
| ------------------------ | ------------------------------------------------------------------- |
| Öffentliches Browsing    | Skills und deren `SKILL.md`-Inhalt sind öffentlich einsehbar.       |
| Suche                    | Embedding-gestützt (Vektorsuche), nicht nur Schlüsselwörter.        |
| Versionierung            | Semver, Changelogs und Tags (einschließlich `latest`).              |
| Downloads                | Zip pro Version.                                                    |
| Sterne und Kommentare    | Community-Feedback.                                                 |
| Sicherheits-Scan-Zusammenfassungen | Detailseiten zeigen den neuesten Scan-Status vor Installation oder Download. |
| Scanner-Detailseiten     | VirusTotal-, ClawScan- und statische Analyseergebnisse haben Deeplinks. |
| Dashboard zur Wiederherstellung durch Besitzer | Publisher können per Scan zurückgehaltene eigene Inhalte in `/dashboard` sehen. |
| Vom Besitzer angeforderte erneute Scans | Besitzer können begrenzte erneute Scans zur Wiederherstellung bei Fehlalarmen anfordern. |
| Moderation               | Freigaben und Audits.                                               |
| CLI-freundliche API      | Geeignet für Automatisierung und Scripting.                         |

## Sicherheit und Moderation

ClawHub ist standardmäßig offen — jeder kann Skills hochladen, aber ein GitHub-
Konto muss **mindestens eine Woche alt** sein, um zu veröffentlichen. Das verlangsamt
Missbrauch, ohne legitime Mitwirkende zu blockieren.

<AccordionGroup>
  <Accordion title="Sicherheits-Scans">
    ClawHub führt automatisierte Sicherheitsprüfungen für veröffentlichte Skills und Plugin-
    Releases aus. Öffentliche Detailseiten fassen das aktuelle Ergebnis zusammen, und Scanner-
    Zeilen verlinken auf eigene Detailseiten für VirusTotal, ClawScan und statische
    Analyse.

    Per Scan zurückgehaltene oder blockierte Releases können im öffentlichen Katalog und auf
    Installationsoberflächen nicht verfügbar sein, bleiben ihrem Besitzer aber in `/dashboard` sichtbar.

  </Accordion>
  <Accordion title="Melden">
    - Jeder angemeldete Benutzer kann einen Skill melden.
    - Meldegründe sind erforderlich und werden erfasst.
    - Jeder Benutzer kann gleichzeitig bis zu 20 aktive Meldungen haben.
    - Skills mit mehr als 3 eindeutigen Meldungen werden standardmäßig automatisch ausgeblendet.

  </Accordion>
  <Accordion title="Moderation">
    - Moderatoren können ausgeblendete Skills anzeigen, wieder einblenden, löschen oder Benutzer sperren.
    - Missbrauch der Meldefunktion kann zu Kontosperren führen.
    - Interesse daran, Moderator zu werden? Fragen Sie im OpenClaw Discord und kontaktieren Sie einen Moderator oder Maintainer.

  </Accordion>
</AccordionGroup>

## ClawHub-CLI

Sie benötigen dies nur für Registry-authentifizierte Workflows wie
Veröffentlichen/Synchronisieren.

### Globale Optionen

<ParamField path="--workdir <dir>" type="string">
  Arbeitsverzeichnis. Standard: aktuelles Verzeichnis; fällt auf den OpenClaw-Workspace zurück.
</ParamField>
<ParamField path="--dir <dir>" type="string" default="skills">
  Skills-Verzeichnis, relativ zu workdir.
</ParamField>
<ParamField path="--site <url>" type="string">
  Basis-URL der Site (Browser-Login).
</ParamField>
<ParamField path="--registry <url>" type="string">
  Basis-URL der Registry-API.
</ParamField>
<ParamField path="--no-input" type="boolean">
  Prompts deaktivieren (nicht interaktiv).
</ParamField>
<ParamField path="-V, --cli-version" type="boolean">
  CLI-Version ausgeben.
</ParamField>

### Befehle

<AccordionGroup>
  <Accordion title="Auth (login / logout / whoami)">
    ```bash
    clawhub login              # browser flow
    clawhub login --token <token>
    clawhub logout
    clawhub whoami
    ```

    Login-Optionen:

    - `--token <token>` — ein API-Token einfügen.
    - `--label <label>` — für Browser-Login-Tokens gespeichertes Label (Standard: `CLI token`).
    - `--no-browser` — keinen Browser öffnen (erfordert `--token`).

  </Accordion>
  <Accordion title="Suche">
    ```bash
    clawhub search "query"
    ```

    Durchsucht Skills. Verwenden Sie für Plugin-/Paket-Discovery `clawhub package explore`.

    - `--limit <n>` — maximale Ergebnisse.

  </Accordion>
  <Accordion title="Plugins durchsuchen / prüfen">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "episodic-claw" --family code-plugin
    clawhub package inspect episodic-claw
    ```

    `package explore` und `package inspect` sind die ClawHub-CLI-Oberflächen für Plugin-/Paket-Discovery und Metadatenprüfung. Native OpenClaw-Installationen verwenden weiterhin `openclaw plugins install clawhub:<package>`.

    Optionen:

    - `--family skill|code-plugin|bundle-plugin` — Paketfamilie filtern.
    - `--official` — nur offizielle Pakete anzeigen.
    - `--executes-code` — nur Pakete anzeigen, die Code ausführen.
    - `--version <version>` / `--tag <tag>` — eine bestimmte Paketversion prüfen.
    - `--versions`, `--files`, `--file <path>` — Paketverlauf und Dateien prüfen.
    - `--json` — maschinenlesbare Ausgabe.

  </Accordion>
  <Accordion title="Installieren / aktualisieren / auflisten">
    ```bash
    clawhub install <slug>
    clawhub update <slug>
    clawhub update --all
    clawhub list
    ```

    Optionen:

    - `--version <version>` — eine bestimmte Version installieren oder darauf aktualisieren (bei `update` nur ein einzelner Slug).
    - `--force` — überschreiben, wenn der Ordner bereits vorhanden ist oder wenn lokale Dateien keiner veröffentlichten Version entsprechen.
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
    - `--tags <tags>` — kommagetrennte Tags (Standard: `latest`).

  </Accordion>
  <Accordion title="Plugins veröffentlichen">
    ```bash
    clawhub package publish <source>
    ```

    `<source>` kann ein lokaler Ordner, `owner/repo`, `owner/repo@ref` oder eine
    GitHub-URL sein.

    Optionen:

    - `--dry-run` — den exakten Veröffentlichungsplan erstellen, ohne etwas hochzuladen.
    - `--json` — maschinenlesbare Ausgabe für CI ausgeben.
    - `--source-repo`, `--source-commit`, `--source-ref` — optionale Überschreibungen, wenn die automatische Erkennung nicht ausreicht.

  </Accordion>
  <Accordion title="Erneute Scans anfordern">
    ```bash
    clawhub skill rescan <slug>
    clawhub skill rescan <slug> --yes --json

    clawhub package rescan <name>
    clawhub package rescan <name> --yes --json
    ```

    Rescan-Befehle erfordern ein angemeldetes Besitzer-Token und zielen auf die neueste
    veröffentlichte Skill-Version oder das neueste Plugin-Release. Übergeben Sie in nicht interaktiven Läufen
    `--yes`.

    JSON-Antworten enthalten Zielart, Namen, Version, Rescan-Status sowie
    verbleibende/maximale Anforderungszahlen für diese Version oder dieses Release.

  </Accordion>
  <Accordion title="Löschen / wiederherstellen (Besitzer oder Administrator)">
    ```bash
    clawhub delete <slug> --yes
    clawhub undelete <slug> --yes
    ```
  </Accordion>
  <Accordion title="Synchronisieren (lokal scannen + neu oder aktualisiert veröffentlichen)">
    ```bash
    clawhub sync
    ```

    Optionen:

    - `--root <dir...>` — zusätzliche Scan-Roots.
    - `--all` — alles ohne Prompts hochladen.
    - `--dry-run` — zeigen, was hochgeladen würde.
    - `--bump <type>` — `patch|minor|major` für Aktualisierungen (Standard: `patch`).
    - `--changelog <text>` — Changelog für nicht interaktive Aktualisierungen.
    - `--tags <tags>` — kommagetrennte Tags (Standard: `latest`).
    - `--concurrency <n>` — Registry-Prüfungen (Standard: `4`).

  </Accordion>
</AccordionGroup>

## Häufige Workflows

<Tabs>
  <Tab title="Suche">
    ```bash
    clawhub search "postgres backups"
    ```
  </Tab>
  <Tab title="Plugin finden">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "memory" --family code-plugin
    clawhub package inspect episodic-claw
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
  <Tab title="Einzelnen Skill veröffentlichen">
    ```bash
    clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
    ```
  </Tab>
  <Tab title="Viele Skills synchronisieren">
    ```bash
    clawhub sync --all
    ```
  </Tab>
  <Tab title="Plugin von GitHub veröffentlichen">
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
`runtimeExtensions` auf diese Ausgabe verweisen lassen. Installationen per Git-Checkout können weiterhin auf TypeScript-Quellcode zurückfallen, wenn keine gebauten Dateien vorhanden sind, aber gebaute Laufzeiteinträge vermeiden die TypeScript-Kompilierung zur Laufzeit in Startup-, doctor- und Plugin-Ladepfaden.

## Versionierung, Lockfile und Telemetrie

<AccordionGroup>
  <Accordion title="Versionierung und Tags">
    - Jede Veröffentlichung erstellt eine neue **semver**-`SkillVersion`.
    - Tags (wie `latest`) verweisen auf eine Version; durch das Verschieben von Tags können Sie ein Rollback durchführen.
    - Changelogs werden pro Version angehängt und können beim Synchronisieren oder Veröffentlichen von Updates leer sein.

  </Accordion>
  <Accordion title="Lokale Änderungen im Vergleich zu Registry-Versionen">
    Updates vergleichen die lokalen Skill-Inhalte über einen
    Inhalts-Hash mit Registry-Versionen. Wenn lokale Dateien mit keiner
    veröffentlichten Version übereinstimmen, fragt die CLI vor dem Überschreiben nach (oder erfordert `--force` bei
    nicht interaktiven Läufen).
  </Accordion>
  <Accordion title="Sync-Scanning und Fallback-Roots">
    `clawhub sync` scannt zuerst Ihr aktuelles Arbeitsverzeichnis. Wenn keine Skills
    gefunden werden, fällt es auf bekannte Legacy-Speicherorte zurück (zum Beispiel
    `~/openclaw/skills` und `~/.openclaw/skills`). Dies ist darauf ausgelegt,
    ältere Skill-Installationen ohne zusätzliche Flags zu finden.
  </Accordion>
  <Accordion title="Speicher und Lockfile">
    - Installierte Skills werden in `.clawhub/lock.json` unter Ihrem Arbeitsverzeichnis erfasst.
    - Authentifizierungstokens werden in der ClawHub-CLI-Konfigurationsdatei gespeichert (Überschreibung über `CLAWHUB_CONFIG_PATH`).

  </Accordion>
  <Accordion title="Telemetrie (Installationszahlen)">
    Wenn Sie `clawhub sync` ausführen, während Sie angemeldet sind, sendet die CLI einen minimalen
    Snapshot zur Berechnung der Installationszahlen. Sie können dies vollständig deaktivieren:

    ```bash
    export CLAWHUB_DISABLE_TELEMETRY=1
    ```

  </Accordion>
</AccordionGroup>

## Umgebungsvariablen

| Variable                      | Wirkung                                                |
| ----------------------------- | ------------------------------------------------------ |
| `CLAWHUB_SITE`                | Überschreibt die Website-URL.                          |
| `CLAWHUB_REGISTRY`            | Überschreibt die Registry-API-URL.                     |
| `CLAWHUB_CONFIG_PATH`         | Überschreibt, wo die CLI Token/Konfiguration speichert. |
| `CLAWHUB_WORKDIR`             | Überschreibt das Standardarbeitsverzeichnis.           |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Deaktiviert Telemetrie bei `sync`.                     |

## Verwandt

- [Community-Plugins](/de/plugins/community)
- [Plugins](/de/tools/plugin)
- [Skills](/de/tools/skills)
