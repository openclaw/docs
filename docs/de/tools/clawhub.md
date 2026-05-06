---
read_when:
    - Suchen, Installieren oder Aktualisieren von Skills oder Plugins
    - Veröffentlichen von Skills oder Plugins in der Registry
    - Konfigurieren der clawhub-CLI oder ihrer Umgebungsüberschreibungen
sidebarTitle: ClawHub
summary: 'ClawHub: öffentliche Registry für OpenClaw Skills und Plugins, native Installationsabläufe und die clawhub-CLI'
title: ClawHub
x-i18n:
    generated_at: "2026-05-06T07:05:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 78ccf1911344d71b3b1c2c94691e15108305348e09db62aaaf1d03d852984acd
    source_path: tools/clawhub.md
    workflow: 16
---

ClawHub ist das öffentliche Registry für **OpenClaw-Skills und -Plugins**.

- Verwenden Sie native `openclaw`-Befehle, um Skills zu suchen, zu installieren und zu aktualisieren sowie Plugins aus ClawHub zu installieren.
- Verwenden Sie die separate `clawhub`-CLI für Workflows zu Registry-Authentifizierung, Veröffentlichen, Löschen/Wiederherstellen und Synchronisieren.

Website: [clawhub.ai](https://clawhub.ai)

## Schnellstart

<Steps>
  <Step title="Search">
    ```bash
    openclaw skills search "calendar"
    ```
  </Step>
  <Step title="Install">
    ```bash
    openclaw skills install <skill-slug>
    ```
  </Step>
  <Step title="Use">
    Starten Sie eine neue OpenClaw-Sitzung - sie erkennt den neuen Skill.
  </Step>
  <Step title="Publish (optional)">
    Für Registry-authentifizierte Workflows (Veröffentlichen, Synchronisieren, Verwalten) installieren Sie
    die separate `clawhub`-CLI:

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
    speichern Quellmetadaten dauerhaft, sodass spätere `update`-Aufrufe bei ClawHub bleiben können.

  </Tab>
  <Tab title="Plugins">
    ```bash
    openclaw plugins search "calendar"
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    `plugins search` fragt den ClawHub-Plugin-Katalog ab und gibt installationsbereite
    Paketnamen aus. Verwenden Sie `clawhub:<package>`, wenn Sie die ClawHub-Auflösung möchten.
    Reine npm-sichere Plugin-Spezifikationen installieren während der Launch-Umstellung aus npm:

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    `npm:<package>` ist ebenfalls nur npm und ist nützlich, wenn eine Spezifikation andernfalls
    mehrdeutig sein könnte:

    ```bash
    openclaw plugins install npm:openclaw-codex-app-server
    ```

    Plugin-Installationen validieren die beworbene Kompatibilität von `pluginApi` und
    `minGatewayVersion`, bevor die Archivinstallation ausgeführt wird, sodass
    inkompatible Hosts früh geschlossen fehlschlagen, statt das Paket teilweise zu installieren.
    Wenn eine Paketversion ein ClawPack-Artefakt veröffentlicht, bevorzugt
    OpenClaw das exakt hochgeladene npm-Pack-`.tgz`, verifiziert den ClawHub-
    Digest-Header und die heruntergeladenen Bytes und zeichnet Artefakttyp, npm-
    Integrität, npm-shasum, Tarball-Namen und ClawPack-Digest-Metadaten für spätere
    Aktualisierungen auf. Ältere Paketversionen ohne ClawPack-Metadaten verwenden weiterhin den
    bisherigen Verifizierungspfad für Paketarchive.

  </Tab>
</Tabs>

<Note>
`openclaw plugins install clawhub:...` akzeptiert nur installierbare Plugin-
Familien. Wenn ein ClawHub-Paket tatsächlich ein Skill ist, stoppt OpenClaw und
verweist Sie stattdessen auf `openclaw skills install <slug>`.

Anonyme ClawHub-Plugin-Installationen schlagen auch für private Pakete geschlossen fehl.
Community- oder andere nicht offizielle Kanäle können weiterhin installiert werden, aber OpenClaw
warnt, damit Betreiber Quelle und Verifizierung vor der Aktivierung prüfen können.
</Note>

## Was ClawHub ist

- Ein öffentliches Registry für OpenClaw-Skills und -Plugins.
- Ein versionierter Speicher für Skill-Bundles und Metadaten.
- Eine Discovery-Oberfläche für Suche, Tags und Nutzungssignale.

Ein typischer Skill ist ein versioniertes Bundle aus Dateien, das Folgendes enthält:

- Eine `SKILL.md`-Datei mit der primären Beschreibung und Verwendung.
- Optionale Konfigurationen, Skripte oder unterstützende Dateien, die vom Skill verwendet werden.
- Metadaten wie Tags, Zusammenfassung und Installationsanforderungen.

ClawHub verwendet Metadaten, um Discovery zu unterstützen und Skill-
Fähigkeiten sicher offenzulegen. Das Registry verfolgt Nutzungssignale (Sterne, Downloads), um
Ranking und Sichtbarkeit zu verbessern. Jede Veröffentlichung erstellt eine neue semver-
Version, und das Registry behält den Versionsverlauf bei, damit Benutzer
Änderungen prüfen können.

## Workspace und Laden von Skills

Die separate `clawhub`-CLI installiert Skills ebenfalls in `./skills` unter
Ihrem aktuellen Arbeitsverzeichnis. Wenn ein OpenClaw-Workspace konfiguriert ist,
fällt `clawhub` auf diesen Workspace zurück, sofern Sie `--workdir`
(oder `CLAWHUB_WORKDIR`) nicht überschreiben. OpenClaw lädt Workspace-Skills aus
`<workspace>/skills` und erkennt sie in der **nächsten** Sitzung.

Wenn Sie bereits `~/.openclaw/skills` oder gebündelte Skills verwenden, haben Workspace-
Skills Vorrang. Weitere Details dazu, wie Skills geladen,
geteilt und per Gate gesteuert werden, finden Sie unter [Skills](/de/tools/skills).

## Servicefunktionen

| Funktion                 | Hinweise                                                            |
| ------------------------ | ------------------------------------------------------------------- |
| Öffentliches Browsing    | Skills und ihre `SKILL.md`-Inhalte sind öffentlich sichtbar.        |
| Suche                    | Embedding-gestützt (Vektorsuche), nicht nur Schlüsselwörter.        |
| Versionierung            | Semver, Changelogs und Tags (einschließlich `latest`).              |
| Downloads                | ZIP pro Version.                                                    |
| Sterne und Kommentare    | Community-Feedback.                                                 |
| Sicherheits-Scan-Zusammenfassungen | Detailseiten zeigen vor Installation oder Download den neuesten Scan-Status. |
| Scanner-Detailseiten     | VirusTotal-, ClawScan- und statische Analyseergebnisse haben Deep Links. |
| Dashboard zur Owner-Wiederherstellung | Publisher können scan-zurückgehaltene eigene Inhalte unter `/dashboard` sehen. |
| Vom Owner angeforderte erneute Scans | Owner können begrenzte erneute Scans zur Wiederherstellung bei False Positives anfordern. |
| Moderation               | Freigaben und Audits.                                               |
| CLI-freundliche API      | Geeignet für Automatisierung und Skripting.                         |

## Sicherheit und Moderation

ClawHub ist standardmäßig offen - jeder kann Skills hochladen, aber ein GitHub-
Konto muss **mindestens eine Woche alt** sein, um zu veröffentlichen. Das verlangsamt
Missbrauch, ohne legitime Beitragende zu blockieren.

<AccordionGroup>
  <Accordion title="Security scans">
    ClawHub führt automatisierte Sicherheitsprüfungen für veröffentlichte Skills und Plugin-
    Releases aus. Öffentliche Detailseiten fassen das aktuelle Ergebnis zusammen, und Scanner-
    Zeilen verlinken auf eigene Detailseiten für VirusTotal, ClawScan und statische
    Analyse.

    Scan-zurückgehaltene oder blockierte Releases können im öffentlichen Katalog und auf
    Installationsoberflächen nicht verfügbar sein, während sie für ihren Owner in `/dashboard` weiterhin sichtbar sind.

  </Accordion>
  <Accordion title="Reporting">
    - Jeder angemeldete Benutzer kann einen Skill melden.
    - Meldegründe sind erforderlich und werden aufgezeichnet.
    - Jeder Benutzer kann gleichzeitig bis zu 20 aktive Meldungen haben.
    - Skills mit mehr als 3 eindeutigen Meldungen werden standardmäßig automatisch ausgeblendet.

  </Accordion>
  <Accordion title="Moderation">
    - Moderatoren können ausgeblendete Skills anzeigen, wieder einblenden, löschen oder Benutzer sperren.
    - Missbrauch der Meldefunktion kann zu Kontosperren führen.
    - Möchten Sie Moderator werden? Fragen Sie im OpenClaw Discord und kontaktieren Sie einen Moderator oder Maintainer.

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
  Basis-URL der Website (Browser-Anmeldung).
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
  <Accordion title="Auth (login / logout / whoami)">
    ```bash
    clawhub login              # browser flow
    clawhub login --token <token>
    clawhub logout
    clawhub whoami
    ```

    Anmeldeoptionen:

    - `--token <token>` - API-Token einfügen.
    - `--label <label>` - Label, das für Browser-Anmeldetoken gespeichert wird (Standard: `CLI token`).
    - `--no-browser` - keinen Browser öffnen (erfordert `--token`).

  </Accordion>
  <Accordion title="Search">
    ```bash
    clawhub search "query"
    ```

    Durchsucht Skills. Verwenden Sie für Plugin-/Paket-Discovery `clawhub package explore`.

    - `--limit <n>` - maximale Ergebnisse.

  </Accordion>
  <Accordion title="Browse / inspect plugins">
    ```bash
    clawhub package explore --family code-plugin
    clawhub package explore "episodic-claw" --family code-plugin
    clawhub package inspect episodic-claw
    ```

    `package explore` und `package inspect` sind die ClawHub-CLI-Oberflächen für Plugin-/Paket-Discovery und Metadatenprüfung. Native OpenClaw-Installationen verwenden weiterhin `openclaw plugins install clawhub:<package>`.

    Optionen:

    - `--family skill|code-plugin|bundle-plugin` - Paketfamilie filtern.
    - `--official` - nur offizielle Pakete anzeigen.
    - `--executes-code` - nur Pakete anzeigen, die Code ausführen.
    - `--version <version>` / `--tag <tag>` - eine bestimmte Paketversion prüfen.
    - `--versions`, `--files`, `--file <path>` - Paketverlauf und Dateien prüfen.
    - `--json` - maschinenlesbare Ausgabe.

  </Accordion>
  <Accordion title="Install / update / list">
    ```bash
    clawhub install <slug>
    clawhub update <slug>
    clawhub update --all
    clawhub list
    ```

    Optionen:

    - `--version <version>` - eine bestimmte Version installieren oder darauf aktualisieren (bei `update` nur ein einzelner Slug).
    - `--force` - überschreiben, wenn der Ordner bereits vorhanden ist oder wenn lokale Dateien keiner veröffentlichten Version entsprechen.
    - `clawhub list` liest `.clawhub/lock.json`.

  </Accordion>
  <Accordion title="Publish skills">
    ```bash
    clawhub skill publish <path>
    ```

    Optionen:

    - `--slug <slug>` - Skill-Slug.
    - `--name <name>` - Anzeigename.
    - `--version <version>` - semver-Version.
    - `--changelog <text>` - Changelog-Text (kann leer sein).
    - `--tags <tags>` - kommagetrennte Tags (Standard: `latest`).

  </Accordion>
  <Accordion title="Publish plugins">
    ```bash
    clawhub package publish <source>
    ```

    `<source>` kann ein lokaler Ordner, `owner/repo`, `owner/repo@ref` oder eine
    GitHub-URL sein.

    Optionen:

    - `--dry-run` - den exakten Veröffentlichungsplan erstellen, ohne etwas hochzuladen.
    - `--json` - maschinenlesbare Ausgabe für CI ausgeben.
    - `--source-repo`, `--source-commit`, `--source-ref` - optionale Überschreibungen, wenn die automatische Erkennung nicht ausreicht.

  </Accordion>
  <Accordion title="Request rescans">
    ```bash
    clawhub skill rescan <slug>
    clawhub skill rescan <slug> --yes --json

    clawhub package rescan <name>
    clawhub package rescan <name> --yes --json
    ```

    Befehle für erneute Scans erfordern ein angemeldetes Owner-Token und zielen auf die neueste
    veröffentlichte Skill-Version oder das neueste Plugin-Release. Übergeben Sie bei nicht interaktiven Läufen
    `--yes`.

    JSON-Antworten enthalten Zieltyp, Namen, Version, Status des erneuten Scans und
    verbleibende/maximale Anfragezahlen für diese Version oder dieses Release.

  </Accordion>
  <Accordion title="Delete / undelete (owner or admin)">
    ```bash
    clawhub delete <slug> --yes
    clawhub undelete <slug> --yes
    ```
  </Accordion>
  <Accordion title="Sync (scan local + publish new or updated)">
    ```bash
    clawhub sync
    ```

    Optionen:

    - `--root <dir...>` - zusätzliche Scan-Roots.
    - `--all` - alles ohne Eingabeaufforderungen hochladen.
    - `--dry-run` - anzeigen, was hochgeladen würde.
    - `--bump <type>` - `patch|minor|major` für Aktualisierungen (Standard: `patch`).
    - `--changelog <text>` - Changelog für nicht interaktive Aktualisierungen.
    - `--tags <tags>` - kommagetrennte Tags (Standard: `latest`).
    - `--concurrency <n>` - Registry-Prüfungen (Standard: `4`).

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
  <Tab title="Einzelnes Skill veröffentlichen">
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
`runtimeExtensions` auf diese Ausgabe verweisen. Installationen aus Git-Checkouts können weiterhin auf TypeScript-Quellcode zurückfallen, wenn keine gebauten Dateien vorhanden sind, aber gebaute Runtime-Einträge vermeiden die TypeScript-Kompilierung zur Laufzeit in Start-, Doctor- und Plugin-Ladepfaden.

## Versionierung, Lockfile und Telemetrie

<AccordionGroup>
  <Accordion title="Versionierung und Tags">
    - Jede Veröffentlichung erstellt eine neue **semver**-`SkillVersion`.
    - Tags (wie `latest`) zeigen auf eine Version; durch das Verschieben von Tags können Sie zurückrollen.
    - Changelogs werden pro Version angehängt und können beim Synchronisieren oder Veröffentlichen von Updates leer sein.

  </Accordion>
  <Accordion title="Lokale Änderungen gegenüber Registry-Versionen">
    Updates vergleichen die lokalen Skill-Inhalte über einen Inhalts-Hash mit Registry-Versionen. Wenn lokale Dateien keiner veröffentlichten Version entsprechen, fragt die CLI vor dem Überschreiben nach (oder erfordert `--force` in nicht interaktiven Läufen).
  </Accordion>
  <Accordion title="Sync-Scan und Fallback-Stammverzeichnisse">
    `clawhub sync` scannt zuerst Ihr aktuelles Arbeitsverzeichnis. Wenn keine Skills gefunden werden, wird auf bekannte Legacy-Speicherorte zurückgegriffen (zum Beispiel `~/openclaw/skills` und `~/.openclaw/skills`). Dies ist darauf ausgelegt, ältere Skill-Installationen ohne zusätzliche Flags zu finden.
  </Accordion>
  <Accordion title="Speicher und Lockfile">
    - Installierte Skills werden in `.clawhub/lock.json` unter Ihrem Arbeitsverzeichnis erfasst.
    - Authentifizierungstokens werden in der Konfigurationsdatei der ClawHub CLI gespeichert (überschreibbar über `CLAWHUB_CONFIG_PATH`).

  </Accordion>
  <Accordion title="Telemetrie (Installationszahlen)">
    Wenn Sie `clawhub sync` ausführen, während Sie angemeldet sind, sendet die CLI einen minimalen Snapshot, um Installationszahlen zu berechnen. Sie können dies vollständig deaktivieren:

    ```bash
    export CLAWHUB_DISABLE_TELEMETRY=1
    ```

  </Accordion>
</AccordionGroup>

## Umgebungsvariablen

| Variable                      | Wirkung                                                   |
| ----------------------------- | --------------------------------------------------------- |
| `CLAWHUB_SITE`                | Überschreibt die Site-URL.                                |
| `CLAWHUB_REGISTRY`            | Überschreibt die Registry-API-URL.                        |
| `CLAWHUB_CONFIG_PATH`         | Überschreibt, wo die CLI Token/Konfiguration speichert.   |
| `CLAWHUB_WORKDIR`             | Überschreibt das Standardarbeitsverzeichnis.              |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Deaktiviert Telemetrie bei `sync`.                        |

## Verwandt

- [Community-Plugins](/de/plugins/community)
- [Plugins](/de/tools/plugin)
- [Skills](/de/tools/skills)
