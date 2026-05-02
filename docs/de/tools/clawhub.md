---
read_when:
    - Skills oder Plugins suchen, installieren oder aktualisieren
    - Skills oder Plugins in der Registry veröffentlichen
    - Konfiguration der clawhub-CLI oder ihrer Umgebungsüberschreibungen
sidebarTitle: ClawHub
summary: 'ClawHub: öffentliche Registry für OpenClaw Skills und Plugins, native Installationsabläufe und die clawhub CLI'
title: ClawHub
x-i18n:
    generated_at: "2026-05-02T06:47:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 353b224ccfb8096c270b7896e640e9e419fcb50c265298102a5ce0173566933e
    source_path: tools/clawhub.md
    workflow: 16
---

ClawHub ist die öffentliche Registry für **OpenClaw Skills und Plugins**.

- Verwenden Sie native `openclaw`-Befehle, um Skills zu suchen, zu installieren und zu aktualisieren sowie Plugins von ClawHub zu installieren.
- Verwenden Sie die separate `clawhub`-CLI für Registry-Authentifizierung, Veröffentlichen, Löschen/Wiederherstellen und Sync-Workflows.

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
    Installieren Sie für Registry-authentifizierte Workflows (Veröffentlichen, Sync, Verwaltung)
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

    Native `openclaw`-Befehle installieren in Ihren aktiven Arbeitsbereich und
    speichern Quellmetadaten, damit spätere `update`-Aufrufe bei ClawHub bleiben können.

  </Tab>
  <Tab title="Plugins">
    ```bash
    openclaw plugins search "calendar"
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    `plugins search` fragt den ClawHub-Plugin-Katalog ab und gibt installationsbereite
    Paketnamen aus. Reine npm-sichere Plugin-Spezifikationen werden ebenfalls zuerst
    gegen ClawHub geprüft, bevor npm verwendet wird:

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    Verwenden Sie `npm:<package>`, wenn Sie nur npm-Auflösung ohne eine
    ClawHub-Abfrage wünschen:

    ```bash
    openclaw plugins install npm:openclaw-codex-app-server
    ```

    Plugin-Installationen validieren die beworbene Kompatibilität von `pluginApi` und
    `minGatewayVersion`, bevor die Archivinstallation ausgeführt wird. Dadurch
    schlagen inkompatible Hosts früh geschlossen fehl, statt das Paket teilweise zu
    installieren. Wenn eine Paketversion ein ClawPack-Artefakt veröffentlicht,
    bevorzugt OpenClaw dieses Artefakt, verifiziert den ClawHub-Digest-Header und
    die heruntergeladenen Bytes und speichert die ClawPack-Digest-Metadaten für
    spätere Aktualisierungen. Ältere Paketversionen ohne ClawPack-Metadaten verwenden
    weiterhin den Legacy-Pfad zur Paketarchivverifizierung.

  </Tab>
</Tabs>

<Note>
`openclaw plugins install clawhub:...` akzeptiert nur installierbare Plugin-
Familien. Wenn ein ClawHub-Paket tatsächlich ein Skill ist, stoppt OpenClaw und
verweist Sie stattdessen auf `openclaw skills install <slug>`.

Anonyme ClawHub-Plugin-Installationen schlagen bei privaten Paketen ebenfalls
geschlossen fehl. Community-Kanäle oder andere nicht offizielle Kanäle können
weiterhin installiert werden, aber OpenClaw warnt, damit Betreiber Quelle und
Verifizierung prüfen können, bevor sie diese aktivieren.
</Note>

## Was ClawHub ist

- Eine öffentliche Registry für OpenClaw Skills und Plugins.
- Ein versionierter Speicher für Skill-Bundles und Metadaten.
- Eine Discovery-Oberfläche für Suche, Tags und Nutzungssignale.

Ein typischer Skill ist ein versioniertes Dateibundle, das Folgendes enthält:

- Eine `SKILL.md`-Datei mit der primären Beschreibung und Nutzung.
- Optionale Konfigurationen, Skripte oder unterstützende Dateien, die vom Skill verwendet werden.
- Metadaten wie Tags, Zusammenfassung und Installationsanforderungen.

ClawHub verwendet Metadaten, um Discovery zu ermöglichen und Skill-
Fähigkeiten sicher offenzulegen. Die Registry erfasst Nutzungssignale (Sterne,
Downloads), um Ranking und Sichtbarkeit zu verbessern. Jede Veröffentlichung
erstellt eine neue Semver-Version, und die Registry bewahrt den Versionsverlauf
auf, damit Benutzer Änderungen prüfen können.

## Arbeitsbereich und Laden von Skills

Die separate `clawhub`-CLI installiert Skills ebenfalls in `./skills` unterhalb
Ihres aktuellen Arbeitsverzeichnisses. Wenn ein OpenClaw-Arbeitsbereich
konfiguriert ist, verwendet `clawhub` diesen Arbeitsbereich als Fallback, sofern
Sie `--workdir` (oder `CLAWHUB_WORKDIR`) nicht überschreiben. OpenClaw lädt
Arbeitsbereich-Skills aus `<workspace>/skills` und übernimmt sie in der
**nächsten** Sitzung.

Wenn Sie bereits `~/.openclaw/skills` oder gebündelte Skills verwenden, haben
Arbeitsbereich-Skills Vorrang. Weitere Details dazu, wie Skills geladen,
geteilt und über Gates gesteuert werden, finden Sie unter [Skills](/de/tools/skills).

## Servicefunktionen

| Funktion                 | Hinweise                                                            |
| ------------------------ | ------------------------------------------------------------------- |
| Öffentliches Durchsuchen | Skills und deren `SKILL.md`-Inhalte sind öffentlich sichtbar.       |
| Suche                    | Embedding-gestützt (Vektorsuche), nicht nur Schlüsselwörter.        |
| Versionierung            | Semver, Changelogs und Tags (einschließlich `latest`).              |
| Downloads                | Zip pro Version.                                                    |
| Sterne und Kommentare    | Community-Feedback.                                                 |
| Sicherheits-Scan-Zusammenfassungen | Detailseiten zeigen vor Installation oder Download den neuesten Scan-Status. |
| Scanner-Detailseiten     | VirusTotal-, ClawScan- und statische Analyseergebnisse haben Deeplinks. |
| Owner-Wiederherstellungsdashboard | Publisher können per Scan zurückgehaltene eigene Inhalte unter `/dashboard` sehen. |
| Vom Owner angeforderte erneute Scans | Owner können begrenzte erneute Scans zur Wiederherstellung nach False Positives anfordern. |
| Moderation               | Freigaben und Audits.                                               |
| CLI-freundliche API      | Geeignet für Automatisierung und Scripting.                         |

## Sicherheit und Moderation

ClawHub ist standardmäßig offen — jeder kann Skills hochladen, aber ein GitHub-
Konto muss für die Veröffentlichung **mindestens eine Woche alt** sein. Das
verlangsamt Missbrauch, ohne legitime Beitragende zu blockieren.

<AccordionGroup>
  <Accordion title="Sicherheits-Scans">
    ClawHub führt automatisierte Sicherheitsprüfungen für veröffentlichte Skills und Plugin-
    Releases aus. Öffentliche Detailseiten fassen das aktuelle Ergebnis zusammen, und Scanner-
    Zeilen verlinken auf dedizierte Detailseiten für VirusTotal, ClawScan und statische
    Analyse.

    Durch Scans zurückgehaltene oder blockierte Releases sind möglicherweise auf öffentlichen Katalog- und
    Installationsoberflächen nicht verfügbar, bleiben für ihren Owner in `/dashboard` aber sichtbar.

  </Accordion>
  <Accordion title="Melden">
    - Jeder angemeldete Benutzer kann einen Skill melden.
    - Meldegründe sind erforderlich und werden aufgezeichnet.
    - Jeder Benutzer kann gleichzeitig bis zu 20 aktive Meldungen haben.
    - Skills mit mehr als 3 eindeutigen Meldungen werden standardmäßig automatisch ausgeblendet.

  </Accordion>
  <Accordion title="Moderation">
    - Moderatoren können ausgeblendete Skills ansehen, wieder einblenden, löschen oder Benutzer sperren.
    - Missbrauch der Meldefunktion kann zu Kontosperren führen.
    - Interessiert daran, Moderator zu werden? Fragen Sie im OpenClaw Discord und kontaktieren Sie einen Moderator oder Maintainer.

  </Accordion>
</AccordionGroup>

## ClawHub-CLI

Sie benötigen dies nur für Registry-authentifizierte Workflows wie
Veröffentlichen/Sync.

### Globale Optionen

<ParamField path="--workdir <dir>" type="string">
  Arbeitsverzeichnis. Standard: aktuelles Verzeichnis; fällt auf den OpenClaw-Arbeitsbereich zurück.
</ParamField>
<ParamField path="--dir <dir>" type="string" default="skills">
  Skills-Verzeichnis, relativ zu workdir.
</ParamField>
<ParamField path="--site <url>" type="string">
  Basis-URL der Website (Browser-Login).
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
  <Accordion title="Auth (Login / Logout / whoami)">
    ```bash
    clawhub login              # browser flow
    clawhub login --token <token>
    clawhub logout
    clawhub whoami
    ```

    Login-Optionen:

    - `--token <token>` — API-Token einfügen.
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
    - `--versions`, `--files`, `--file <path>` — Pakethistorie und Dateien prüfen.
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

    - `--version <version>` — eine bestimmte Version installieren oder darauf aktualisieren (bei `update` nur einzelner Slug).
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

    Rescan-Befehle erfordern ein angemeldetes Owner-Token und zielen auf die neueste
    veröffentlichte Skill-Version oder das neueste Plugin-Release. Übergeben Sie in nicht interaktiven Läufen
    `--yes`.

    JSON-Antworten enthalten Zieltyp, Namen, Version, Rescan-Status sowie
    verbleibende/maximale Anzahlen von Anforderungen für diese Version oder dieses Release.

  </Accordion>
  <Accordion title="Löschen / Wiederherstellen (Owner oder Admin)">
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

    - `--root <dir...>` — zusätzliche Scan-Roots.
    - `--all` — alles ohne Prompts hochladen.
    - `--dry-run` — anzeigen, was hochgeladen würde.
    - `--bump <type>` — `patch|minor|major` für Updates (Standard: `patch`).
    - `--changelog <text>` — Changelog für nicht interaktive Updates.
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
  <Tab title="Ein einzelnes Skill veröffentlichen">
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

### Metadaten für Plugin-Pakete

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
`runtimeExtensions` auf diese Ausgabe verweisen lassen. Installationen aus
Git-Checkouts können weiterhin auf TypeScript-Quellcode zurückfallen, wenn
keine gebauten Dateien vorhanden sind, aber gebaute Runtime-Einträge vermeiden
Runtime-TypeScript-Kompilierung in Start-, Doctor- und Plugin-Ladepfaden.

## Versionierung, Lockfile und Telemetrie

<AccordionGroup>
  <Accordion title="Versionierung und Tags">
    - Jede Veröffentlichung erstellt eine neue **semver**-`SkillVersion`.
    - Tags (wie `latest`) verweisen auf eine Version; durch das Verschieben von Tags können Sie zurückrollen.
    - Changelogs werden pro Version angehängt und können beim Synchronisieren oder Veröffentlichen von Updates leer sein.

  </Accordion>
  <Accordion title="Lokale Änderungen gegenüber Registry-Versionen">
    Updates vergleichen die lokalen Skill-Inhalte anhand eines Content-Hashs
    mit Registry-Versionen. Wenn lokale Dateien mit keiner veröffentlichten
    Version übereinstimmen, fragt die CLI vor dem Überschreiben nach (oder
    erfordert `--force` bei nicht interaktiven Läufen).
  </Accordion>
  <Accordion title="Sync-Scan und Fallback-Stammverzeichnisse">
    `clawhub sync` scannt zuerst Ihr aktuelles Arbeitsverzeichnis. Wenn keine
    Skills gefunden werden, fällt es auf bekannte Legacy-Speicherorte zurück
    (zum Beispiel `~/openclaw/skills` und `~/.openclaw/skills`). Dies ist dafür
    gedacht, ältere Skill-Installationen ohne zusätzliche Flags zu finden.
  </Accordion>
  <Accordion title="Speicherung und Lockfile">
    - Installierte Skills werden in `.clawhub/lock.json` unter Ihrem Arbeitsverzeichnis aufgezeichnet.
    - Authentifizierungstokens werden in der ClawHub-CLI-Konfigurationsdatei gespeichert (überschreibbar über `CLAWHUB_CONFIG_PATH`).

  </Accordion>
  <Accordion title="Telemetrie (Installationszahlen)">
    Wenn Sie `clawhub sync` ausführen, während Sie angemeldet sind, sendet die
    CLI einen minimalen Snapshot, um Installationszahlen zu berechnen. Sie
    können dies vollständig deaktivieren:

    ```bash
    export CLAWHUB_DISABLE_TELEMETRY=1
    ```

  </Accordion>
</AccordionGroup>

## Umgebungsvariablen

| Variable                      | Wirkung                                           |
| ----------------------------- | ------------------------------------------------- |
| `CLAWHUB_SITE`                | Überschreibt die Site-URL.                        |
| `CLAWHUB_REGISTRY`            | Überschreibt die Registry-API-URL.                |
| `CLAWHUB_CONFIG_PATH`         | Überschreibt, wo die CLI Token/Konfiguration speichert. |
| `CLAWHUB_WORKDIR`             | Überschreibt das Standardarbeitsverzeichnis.      |
| `CLAWHUB_DISABLE_TELEMETRY=1` | Deaktiviert Telemetrie bei `sync`.                |

## Verwandte Themen

- [Community-Plugins](/de/plugins/community)
- [Plugins](/de/tools/plugin)
- [Skills](/de/tools/skills)
