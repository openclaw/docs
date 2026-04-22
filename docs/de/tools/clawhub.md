---
read_when:
    - ClawHub neuen Nutzerinnen und Nutzern vorstellen
    - Skills oder Plugins installieren, suchen oder veröffentlichen
    - CLI-Flags und Sync-Verhalten von ClawHub erklären
summary: 'ClawHub-Leitfaden: öffentliches Registry, native OpenClaw-Installationsabläufe und ClawHub-CLI-Workflows'
title: ClawHub
x-i18n:
    generated_at: "2026-04-22T04:27:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: 88980eb2f48c5298aec5b697e8e50762c3df5a4114f567e69424a1cb36e5102e
    source_path: tools/clawhub.md
    workflow: 15
---

# ClawHub

ClawHub ist das öffentliche Register für **OpenClaw-Skills und -Plugins**.

- Verwenden Sie native `openclaw`-Befehle, um Skills zu suchen/zu installieren/zu aktualisieren und
  Plugins aus ClawHub zu installieren.
- Verwenden Sie die separate `clawhub`-CLI, wenn Sie Registry-Authentifizierung, Veröffentlichen, Löschen,
  Wiederherstellen oder Sync-Workflows benötigen.

Website: [clawhub.ai](https://clawhub.ai)

## Native OpenClaw-Abläufe

Skills:

```bash
openclaw skills search "calendar"
openclaw skills install <skill-slug>
openclaw skills update --all
```

Plugins:

```bash
openclaw plugins install clawhub:<package>
openclaw plugins update --all
```

Bare npm-safe Plugin-Specs werden ebenfalls zuerst gegen ClawHub versucht und erst danach gegen npm:

```bash
openclaw plugins install openclaw-codex-app-server
```

Native `openclaw`-Befehle installieren in Ihren aktiven Workspace und speichern Quell-
Metadaten, sodass spätere `update`-Aufrufe auf ClawHub bleiben können.

Plugin-Installationen validieren die beworbene Kompatibilität von `pluginApi` und `minGatewayVersion`,
bevor die Archivinstallation ausgeführt wird, sodass inkompatible Hosts früh fail-closed fehlschlagen,
anstatt das Paket teilweise zu installieren.

`openclaw plugins install clawhub:...` akzeptiert nur installierbare Plugin-Familien.
Wenn ein ClawHub-Paket tatsächlich ein Skill ist, stoppt OpenClaw und verweist Sie stattdessen auf
`openclaw skills install <slug>`.

## Was ClawHub ist

- Ein öffentliches Register für OpenClaw-Skills und -Plugins.
- Ein versionierter Speicher für Skill-Bundles und Metadaten.
- Eine Discovery-Oberfläche für Suche, Tags und Nutzungssignale.

## So funktioniert es

1. Ein Benutzer veröffentlicht ein Skill-Bundle (Dateien + Metadaten).
2. ClawHub speichert das Bundle, parst die Metadaten und weist eine Version zu.
3. Das Register indiziert den Skill für Suche und Discovery.
4. Benutzer durchsuchen, laden herunter und installieren Skills in OpenClaw.

## Was Sie tun können

- Neue Skills und neue Versionen bestehender Skills veröffentlichen.
- Skills nach Name, Tags oder Suche entdecken.
- Skill-Bundles herunterladen und ihre Dateien prüfen.
- Skills melden, die missbräuchlich oder unsicher sind.
- Falls Sie Moderator sind, ausblenden, wieder einblenden, löschen oder sperren.

## Für wen das gedacht ist (einsteigerfreundlich)

Wenn Sie Ihrem OpenClaw-Agenten neue Fähigkeiten hinzufügen möchten, ist ClawHub der einfachste Weg, Skills zu finden und zu installieren. Sie müssen nicht wissen, wie das Backend funktioniert. Sie können:

- Skills in natürlicher Sprache suchen.
- Einen Skill in Ihren Workspace installieren.
- Skills später mit einem Befehl aktualisieren.
- Ihre eigenen Skills sichern, indem Sie sie veröffentlichen.

## Schnellstart (nicht technisch)

1. Suchen Sie nach etwas, das Sie benötigen:
   - `openclaw skills search "calendar"`
2. Installieren Sie einen Skill:
   - `openclaw skills install <skill-slug>`
3. Starten Sie eine neue OpenClaw-Sitzung, damit der neue Skill übernommen wird.
4. Wenn Sie veröffentlichen oder Registry-Auth verwalten möchten, installieren Sie zusätzlich die separate
   `clawhub`-CLI.

## Die ClawHub-CLI installieren

Sie benötigen diese nur für registry-authentifizierte Workflows wie Publish/Sync:

```bash
npm i -g clawhub
```

```bash
pnpm add -g clawhub
```

## Wie es in OpenClaw passt

Native `openclaw skills install` installiert in das aktive Workspace-Verzeichnis `skills/`.
`openclaw plugins install clawhub:...` zeichnet eine normale verwaltete
Plugin-Installation plus ClawHub-Quellmetadaten für Updates auf.

Anonyme ClawHub-Plugin-Installationen schlagen für private Pakete ebenfalls fail-closed fehl.
Community- oder andere nicht offizielle Channels können weiterhin installiert werden, aber OpenClaw warnt,
damit Operatoren Quelle und Verifizierung vor dem Aktivieren prüfen können.

Die separate `clawhub`-CLI installiert Skills auch in `./skills` unter Ihrem
aktuellen Arbeitsverzeichnis. Wenn ein OpenClaw-Workspace konfiguriert ist, fällt `clawhub`
auf diesen Workspace zurück, sofern Sie nicht `--workdir` (oder
`CLAWHUB_WORKDIR`) überschreiben. OpenClaw lädt Workspace-Skills aus `<workspace>/skills`
und übernimmt sie in der **nächsten** Sitzung. Wenn Sie bereits
`~/.openclaw/skills` oder gebündelte Skills verwenden, haben Workspace-Skills Vorrang.

Weitere Details dazu, wie Skills geladen, geteilt und gegated werden, finden Sie unter
[Skills](/de/tools/skills).

## Überblick über das Skill-System

Ein Skill ist ein versioniertes Bundle aus Dateien, das OpenClaw beibringt, wie eine
bestimmte Aufgabe ausgeführt wird. Jede Veröffentlichung erzeugt eine neue Version, und das Register führt eine
Versionshistorie, sodass Benutzer Änderungen prüfen können.

Ein typischer Skill enthält:

- Eine Datei `SKILL.md` mit der primären Beschreibung und Verwendung.
- Optionale Konfigurationen, Skripte oder unterstützende Dateien, die vom Skill verwendet werden.
- Metadaten wie Tags, Zusammenfassung und Installationsanforderungen.

ClawHub verwendet Metadaten, um Discovery zu ermöglichen und Skill-Fähigkeiten sicher bereitzustellen.
Das Register verfolgt außerdem Nutzungssignale (wie Sterne und Downloads), um
Ranking und Sichtbarkeit zu verbessern.

## Was der Dienst bereitstellt (Funktionen)

- **Öffentliches Browsing** von Skills und ihrem `SKILL.md`-Inhalt.
- **Suche** auf Basis von Embeddings (Vektorsuche), nicht nur Schlüsselwörtern.
- **Versionierung** mit Semver, Changelogs und Tags (einschließlich `latest`).
- **Downloads** als ZIP pro Version.
- **Sterne und Kommentare** für Community-Feedback.
- **Moderations**-Hooks für Genehmigungen und Audits.
- **CLI-freundliche API** für Automatisierung und Skripting.

## Sicherheit und Moderation

ClawHub ist standardmäßig offen. Jeder kann Skills hochladen, aber ein GitHub-Konto muss
mindestens eine Woche alt sein, um veröffentlichen zu können. Das hilft, Missbrauch zu verlangsamen, ohne
legitime Mitwirkende zu blockieren.

Melden und Moderation:

- Jeder angemeldete Benutzer kann einen Skill melden.
- Meldegründe sind erforderlich und werden protokolliert.
- Jeder Benutzer kann maximal 20 aktive Meldungen gleichzeitig haben.
- Skills mit mehr als 3 eindeutigen Meldungen werden standardmäßig automatisch ausgeblendet.
- Moderatoren können ausgeblendete Skills sehen, wieder einblenden, löschen oder Benutzer sperren.
- Missbrauch der Meldefunktion kann zu Kontosperrungen führen.

Interessiert daran, Moderator zu werden? Fragen Sie im OpenClaw-Discord nach und wenden Sie sich an einen
Moderator oder Maintainer.

## CLI-Befehle und Parameter

Globale Optionen (gelten für alle Befehle):

- `--workdir <dir>`: Arbeitsverzeichnis (Standard: aktuelles Verzeichnis; fällt auf OpenClaw-Workspace zurück).
- `--dir <dir>`: Skills-Verzeichnis, relativ zu `workdir` (Standard: `skills`).
- `--site <url>`: Basis-URL der Website (Browser-Login).
- `--registry <url>`: Basis-URL der Registry-API.
- `--no-input`: Prompts deaktivieren (nicht interaktiv).
- `-V, --cli-version`: CLI-Version ausgeben.

Authentifizierung:

- `clawhub login` (Browser-Ablauf) oder `clawhub login --token <token>`
- `clawhub logout`
- `clawhub whoami`

Optionen:

- `--token <token>`: API-Token einfügen.
- `--label <label>`: Gespeichertes Label für Browser-Login-Tokens (Standard: `CLI token`).
- `--no-browser`: Keinen Browser öffnen (erfordert `--token`).

Suche:

- `clawhub search "query"`
- `--limit <n>`: Maximale Ergebnisse.

Installieren:

- `clawhub install <slug>`
- `--version <version>`: Eine bestimmte Version installieren.
- `--force`: Überschreiben, wenn der Ordner bereits existiert.

Aktualisieren:

- `clawhub update <slug>`
- `clawhub update --all`
- `--version <version>`: Auf eine bestimmte Version aktualisieren (nur einzelner Slug).
- `--force`: Überschreiben, wenn lokale Dateien keiner veröffentlichten Version entsprechen.

Auflisten:

- `clawhub list` (liest `.clawhub/lock.json`)

Skills veröffentlichen:

- `clawhub skill publish <path>`
- `--slug <slug>`: Skill-Slug.
- `--name <name>`: Anzeigename.
- `--version <version>`: Semver-Version.
- `--changelog <text>`: Changelog-Text (kann leer sein).
- `--tags <tags>`: Kommagetrennte Tags (Standard: `latest`).

Plugins veröffentlichen:

- `clawhub package publish <source>`
- `<source>` kann ein lokaler Ordner, `owner/repo`, `owner/repo@ref` oder eine GitHub-URL sein.
- `--dry-run`: Den exakten Publish-Plan erstellen, ohne etwas hochzuladen.
- `--json`: Maschinenlesbare Ausgabe für CI erzeugen.
- `--source-repo`, `--source-commit`, `--source-ref`: Optionale Overrides, wenn die automatische Erkennung nicht ausreicht.

Löschen/Wiederherstellen (nur Owner/Admin):

- `clawhub delete <slug> --yes`
- `clawhub undelete <slug> --yes`

Sync (lokale Skills scannen + neue/aktualisierte veröffentlichen):

- `clawhub sync`
- `--root <dir...>`: Zusätzliche Scan-Wurzeln.
- `--all`: Alles ohne Prompts hochladen.
- `--dry-run`: Anzeigen, was hochgeladen würde.
- `--bump <type>`: `patch|minor|major` für Updates (Standard: `patch`).
- `--changelog <text>`: Changelog für nicht interaktive Updates.
- `--tags <tags>`: Kommagetrennte Tags (Standard: `latest`).
- `--concurrency <n>`: Registry-Prüfungen (Standard: 4).

## Häufige Workflows für Agenten

### Nach Skills suchen

```bash
clawhub search "postgres backups"
```

### Neue Skills herunterladen

```bash
clawhub install my-skill-pack
```

### Installierte Skills aktualisieren

```bash
clawhub update --all
```

### Ihre Skills sichern (veröffentlichen oder synchronisieren)

Für einen einzelnen Skill-Ordner:

```bash
clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
```

Um viele Skills auf einmal zu scannen und zu sichern:

```bash
clawhub sync --all
```

### Ein Plugin von GitHub veröffentlichen

```bash
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
clawhub package publish https://github.com/your-org/your-plugin
```

Code-Plugins müssen die erforderlichen OpenClaw-Metadaten in `package.json` enthalten:

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

Veröffentlichte Pakete sollten gebautes JavaScript ausliefern und `runtimeExtensions`
auf diese Ausgabe verweisen lassen. Installationen aus Git-Checkouts können weiterhin auf TypeScript-Quellcode zurückfallen,
wenn keine gebauten Dateien existieren, aber gebaute Runtime-Einträge vermeiden Runtime-TypeScript-
Kompilierung in Startup-, Doctor- und Plugin-Ladepfaden.

## Erweiterte Details (technisch)

### Versionierung und Tags

- Jede Veröffentlichung erzeugt eine neue **Semver**-`SkillVersion`.
- Tags (wie `latest`) verweisen auf eine Version; durch Verschieben von Tags können Sie Rollbacks durchführen.
- Changelogs werden pro Version angehängt und können beim Synchronisieren oder Veröffentlichen von Updates leer sein.

### Lokale Änderungen vs. Registry-Versionen

Updates vergleichen die lokalen Skill-Inhalte mithilfe eines Content-Hashs mit Registry-Versionen. Wenn lokale Dateien keiner veröffentlichten Version entsprechen, fragt die CLI vor dem Überschreiben nach (oder erfordert `--force` in nicht interaktiven Läufen).

### Sync-Scanning und Fallback-Wurzeln

`clawhub sync` scannt zuerst Ihr aktuelles Arbeitsverzeichnis. Wenn keine Skills gefunden werden, fällt es auf bekannte Legacy-Speicherorte zurück (zum Beispiel `~/openclaw/skills` und `~/.openclaw/skills`). Das soll ältere Skill-Installationen ohne zusätzliche Flags finden.

### Speicher und Lockfile

- Installierte Skills werden in `.clawhub/lock.json` unter Ihrem Arbeitsverzeichnis aufgezeichnet.
- Auth-Tokens werden in der Konfigurationsdatei der ClawHub-CLI gespeichert (Override über `CLAWHUB_CONFIG_PATH`).

### Telemetrie (Installationszahlen)

Wenn Sie `clawhub sync` im angemeldeten Zustand ausführen, sendet die CLI einen minimalen Snapshot, um Installationszahlen zu berechnen. Sie können dies vollständig deaktivieren:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

## Umgebungsvariablen

- `CLAWHUB_SITE`: Die Website-URL überschreiben.
- `CLAWHUB_REGISTRY`: Die URL der Registry-API überschreiben.
- `CLAWHUB_CONFIG_PATH`: Überschreiben, wo die CLI Token/Konfiguration speichert.
- `CLAWHUB_WORKDIR`: Das Standard-Arbeitsverzeichnis überschreiben.
- `CLAWHUB_DISABLE_TELEMETRY=1`: Telemetrie bei `sync` deaktivieren.
