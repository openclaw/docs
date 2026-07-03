---
read_when:
    - Verwendung der ClawHub-CLI
    - Installieren, Aktualisieren oder Veröffentlichen debuggen
summary: 'CLI-Referenz: Befehle, Flags, Konfiguration und Lockfile-Verhalten.'
x-i18n:
    generated_at: "2026-07-03T09:28:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b5bc3d499e78ba3c9861c2faf6a01cf8afd92d6b35c42658c5b702692b5c8746
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

CLI-Paket: `clawhub`, Binärdatei: `clawhub`.

Installieren Sie es global mit npm oder pnpm:

```bash
npm i -g clawhub
# or
pnpm add -g clawhub
```

Prüfen Sie es anschließend:

```bash
clawhub --help
clawhub login
clawhub whoami
```

## Globale Flags

- `--workdir <dir>`: Arbeitsverzeichnis (Standard: cwd; fällt auf den Clawdbot-Workspace zurück, falls konfiguriert)
- `--dir <dir>`: Installationsverzeichnis unterhalb von workdir (Standard: `skills`)
- `--site <url>`: Basis-URL für Browser-Login (Standard: `https://clawhub.ai`)
- `--registry <url>`: API-Basis-URL (Standard: ermittelt, andernfalls `https://clawhub.ai`)
- `--no-input`: Eingabeaufforderungen deaktivieren

Env-Entsprechungen:

- `CLAWHUB_SITE` (Legacy `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (Legacy `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (Legacy `CLAWDHUB_WORKDIR`)

### HTTP-Proxy

Die CLI berücksichtigt standardmäßige HTTP-Proxy-Umgebungsvariablen für Systeme hinter
Unternehmens-Proxys oder eingeschränkten Netzwerken:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

Wenn eine dieser Variablen gesetzt ist, leitet die CLI ausgehende Anfragen über
den angegebenen Proxy. `HTTPS_PROXY` wird für HTTPS-Anfragen verwendet, `HTTP_PROXY`
für einfaches HTTP. `NO_PROXY` / `no_proxy` wird berücksichtigt, um den Proxy für
bestimmte Hosts oder Domains zu umgehen.

Dies ist auf Systemen erforderlich, auf denen direkte ausgehende Verbindungen blockiert sind
(z. B. Docker-Container, Hetzner-VPS mit Proxy-only-Internet, Unternehmens-
Firewalls).

Beispiel:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "my query"
```

Wenn keine Proxy-Variable gesetzt ist, bleibt das Verhalten unverändert (direkte Verbindungen).

## Konfigurationsdatei

Speichert Ihr API-Token und die zwischengespeicherte Registry-URL.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` oder `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- Legacy-Fallback: Wenn `clawhub/config.json` noch nicht existiert, aber `clawdhub/config.json` existiert, verwendet die CLI den Legacy-Pfad weiter
- Überschreibung: `CLAWHUB_CONFIG_PATH` (Legacy `CLAWDHUB_CONFIG_PATH`)

## Befehle

### `login` / `auth login`

- Standard: öffnet den Browser unter `<site>/cli/auth` und schließt über einen loopback callback ab.
- Headless: `clawhub login --token clh_...`
- Remote/headless interaktiv: `clawhub login --device` gibt einen Code aus und wartet, während Sie ihn unter `<site>/cli/device` autorisieren.

### `whoami`

- Prüft das gespeicherte Token über `/api/v1/whoami`.

### `token`

- Gibt das gespeicherte API-Token auf stdout aus.
- Nützlich, um ein lokales Login-Token per Pipe in CI-Secret-Einrichtungsbefehle zu übergeben.

### `star <skill>` / `unstar <skill>`

- Fügt einen Skill zu Ihren Highlights hinzu oder entfernt ihn daraus.
- Ruft `POST /api/v1/stars/<slug>` und `DELETE /api/v1/stars/<slug>` auf.
- `--yes` überspringt die Bestätigung.

### `search <query...>`

- Ruft `/api/v1/search?q=...` auf.
- Die Ausgabe enthält den Skill-Slug, das Owner-Handle, den Anzeigenamen und den Relevanzwert.
- Die Suche bevorzugt exakte Slug-/Namens-Token-Treffer vor Download-Popularität. Ein eigenständiges Slug-Token wie `map` entspricht `personal-map` stärker als der Teilstring in `amap`.
- Popularität ist ein kleiner Ranking-Prior, keine Garantie für eine Spitzenplatzierung.
- Wenn ein Skill erscheinen sollte, dies aber nicht tut, führen Sie angemeldet `clawhub inspect @owner/slug` aus, um owner-sichtbare Moderationsdiagnosen zu prüfen, bevor Sie Metadaten umbenennen.

### `explore`

- Listet neueste Skills über `/api/v1/skills?limit=...&sort=createdAt` auf (absteigend nach `createdAt` sortiert).
- Flags:
  - `--limit <n>` (1-200, Standard: 25)
  - `--sort newest|updated|rating|downloads|trending` (Standard: newest). Legacy-Installationssortierungs-Aliase funktionieren aus Kompatibilitätsgründen weiterhin.
  - `--json` (maschinenlesbare Ausgabe)
- Ausgabe: `<slug>  v<version>  <age>  <summary>` (Zusammenfassung auf 50 Zeichen gekürzt).

### `inspect @owner/slug`

- Ruft Skill-Metadaten und Versionsdateien ab, ohne zu installieren.
- `--version <version>`: eine bestimmte Version prüfen (Standard: latest).
- `--tag <tag>`: eine getaggte Version prüfen (z. B. `latest`).
- `--versions`: Versionsverlauf auflisten (erste Seite).
- `--limit <n>`: maximale Anzahl der aufzulistenden Versionen (1-200).
- `--files`: Dateien für die ausgewählte Version auflisten.
- `--file <path>`: Rohdateiinhalt abrufen (nur Textdateien; 200-KB-Grenze).
- `--json`: maschinenlesbare Ausgabe.

### `install @owner/slug`

- Ermittelt die neueste Version für den genannten Owner und Skill.
- Lädt ZIP über `/api/v1/download` herunter.
- Extrahiert nach `<workdir>/<dir>/<slug>`.
- Verweigert das Überschreiben gepinnter Skills; führen Sie zuerst `clawhub unpin <skill>` aus.
- Schreibt:
  - `<workdir>/.clawhub/lock.json` (Legacy `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (Legacy `.clawdhub`)

### `uninstall <skill>`

- Entfernt `<workdir>/<dir>/<slug>` und löscht den Lockfile-Eintrag.
- Sendet angemeldet Best-Effort-Telemetrie, damit aktuelle Installationszahlen
  deaktiviert werden können.
- Interaktiv: fragt nach Bestätigung.
- Nicht interaktiv (`--no-input`): erfordert `--yes`.

### `list`

- Liest `<workdir>/.clawhub/lock.json` (Legacy `.clawdhub`).
- Zeigt `pinned` neben Skills an, die mit `clawhub pin` eingefroren wurden, einschließlich des optionalen Grunds.

### `pin <skill>`

- Markiert einen installierten Skill im Lockfile als gepinnt.
- `--reason <text>` speichert, warum der Skill eingefroren ist.
- Gepinnte Skills werden von `update --all` übersprungen und von direktem `update <skill>` abgelehnt.
- Gepinnte Skills lehnen außerdem `install --force` ab, damit die lokalen Bytes nicht versehentlich ersetzt werden können.

### `unpin <skill>`

- Entfernt den Lockfile-Pin von einem installierten Skill, damit zukünftige Updates ihn ändern können.

### `update [@owner/slug]` / `update --all`

- Berechnet den Fingerprint aus lokalen Dateien.
- Wenn der Fingerprint einer bekannten Version entspricht: keine Eingabeaufforderung.
- Wenn der Fingerprint nicht entspricht:
  - standardmäßig ablehnen
  - mit `--force` überschreiben (oder per Eingabeaufforderung, falls interaktiv)
- Gepinnte Skills werden nie durch `--force` aktualisiert.
- `update <skill>` schlägt bei gepinnten Skills schnell fehl und weist Sie an, zuerst `clawhub unpin <skill>` auszuführen.
- `update --all` überspringt gepinnte Slugs und gibt eine Zusammenfassung aus, was eingefroren blieb.

### `skill publish <path>`

- Vergleicht den lokalen Bundle-Fingerprint mit ClawHub und beendet erfolgreich, wenn
  der Inhalt bereits veröffentlicht ist.
- Neue Skills verwenden standardmäßig `1.0.0`; geänderte Skills verwenden standardmäßig die nächste Patch-
  Version.
- `--version <version>` wählt explizit eine Version aus und veröffentlicht auch dann, wenn der
  Inhalt einer bestehenden Version entspricht.
- `--dry-run` löst die Veröffentlichung ohne Upload auf; `--json` gibt ein
  maschinenlesbares Ergebnis aus.
- `--owner <handle>` veröffentlicht unter einem Org-/User-Publisher-Handle, wenn der
  Akteur Publisher-Zugriff hat.
- `--migrate-owner` verschiebt einen bestehenden Skill zu `--owner`, während eine neue
  Version veröffentlicht wird. Erfordert Admin-/Owner-Zugriff auf beide Publisher.
- Owner- und Review-Verhalten wird in `docs/publishing.md` erklärt.
- Einen Skill zu veröffentlichen bedeutet, dass er auf ClawHub unter `MIT-0` freigegeben wird.
- Veröffentlichte Skills dürfen ohne Namensnennung kostenlos verwendet, geändert und weiterverteilt werden.
- ClawHub unterstützt keine kostenpflichtigen Skills oder Preise pro Skill.
- Legacy-Alias: `publish <path>`.

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

Der wiederverwendbare ClawHub-
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)-
Workflow ruft `skill publish` für einen `skill_path` auf oder für jeden direkten Skill-
Ordner unter `root` (Standard: `skills`). Er überspringt unveränderte Skills und verwendet dasselbe
automatische Patch-Version-Verhalten.

Setzen Sie `dry_run: true`, um ohne Token eine Vorschau zu erhalten. Echte Veröffentlichungen erfordern das
Secret `clawhub_token`.

### `sync`

- Durchsucht das aktuelle workdir, das konfigurierte Skills-Verzeichnis und alle
  `--root <dir>`-Ordner nach lokalen Skill-Ordnern, die `SKILL.md` oder
  `skill.md` enthalten.
- Vergleicht jeden lokalen Skill-Fingerprint mit ClawHub und veröffentlicht nur neue oder
  geänderte Skills.
- Neue Skills werden als `1.0.0` veröffentlicht; geänderte Skills veröffentlichen standardmäßig
  die nächste Patch-Version. Verwenden Sie `--bump minor|major` für Update-Batches, die sich um einen
  größeren Semver-Schritt bewegen sollen.
- `--dry-run` zeigt den Veröffentlichungsplan ohne Upload; `--json` gibt einen
  maschinenlesbaren Plan aus.
- `--all` veröffentlicht jeden neuen oder geänderten Skill ohne Eingabeaufforderung. Ohne
  `--all` können Sie in interaktiven Terminals die zu veröffentlichenden Skills auswählen.
- `--owner <handle>` veröffentlicht unter einem Org-/User-Publisher-Handle, wenn der
  Akteur Publisher-Zugriff hat.
- `sync` ist nur eine einseitige Veröffentlichung. Es installiert, aktualisiert, lädt nicht herunter und
  meldet keine Installations-/Download-Telemetrie.

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- Erfordert `clawhub login`.
- Führt ClawHub ClawScan über `POST /api/v1/skills/-/scan` aus und pollt dann, bis der Scan terminal ist.
- Scans sind asynchron und können einige Zeit bis zum Abschluss benötigen. Während sie eingereiht sind, zeigt der Terminal-Spinner die aktuelle priorisierte Scan-Position und wie viele Scans davor liegen.
- Veröffentlichte Scans erfordern Ownership- oder Publisher-Management-Zugriff. Moderatoren/Admins können dasselbe Backend über `clawhub-admin` verwenden.
- `--update` ist nur mit `--slug` gültig; es schreibt erfolgreiche veröffentlichte Scan-Ergebnisse in die ausgewählte Version zurück.
- `--output <file.zip>` lädt das vollständige Report-Archiv mit `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` und `README.md` herunter.
- `--json` gibt die vollständige Poll-Antwort für Automatisierung aus.
- Lokale Pfad-Scans werden nicht mehr unterstützt. Laden Sie eine neue Version hoch und verwenden Sie dann `scan download`, um die gespeicherten Scan-Ergebnisse für diese eingereichte Version abzurufen.

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- Erfordert `clawhub login`.
- Lädt das gespeicherte Scan-Report-ZIP für eine eingereichte Skill- oder Plugin-Version herunter, einschließlich Versionen, die von ClawHub-Sicherheitsprüfungen blockiert oder ausgeblendet wurden.
- Skill-Downloads verwenden den Skill-Slug und standardmäßig `--kind skill`.
- Plugin-Downloads verwenden den Paketnamen und erfordern `--kind plugin`.
- `--version` ist erforderlich, damit Autoren genau die eingereichte Version prüfen, die ClawHub blockiert hat.
- `--output <file.zip>` wählt den Zielpfad aus.

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

ClawHub liefert einen offiziellen wiederverwendbaren Workflow unter
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/a95f470a588ea9fe4c4b4c258c8c4ca5f02c2836/.github/workflows/skill-publish.yml)
für Skill-Repos und Katalog-Repos.

Typische Katalogeinrichtung:

```yaml
name: Skill Publish

on:
  pull_request:
  workflow_dispatch:

jobs:
  dry-run:
    if: github.event_name == 'pull_request'
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@v1
    with:
      owner: nvidia
      dry_run: true

  publish:
    if: github.event_name == 'workflow_dispatch'
    uses: openclaw/clawhub/.github/workflows/skill-publish.yml@v1
    with:
      owner: nvidia
      dry_run: false
    secrets:
      clawhub_token: ${{ secrets.CLAWHUB_TOKEN }}
```

Hinweise:

- `root` ist für Katalog-Repos standardmäßig `skills`.
- Übergeben Sie `skill_path: skills/review-helper`, um einen Skill-Ordner zu verarbeiten.
- `owner` entspricht dem CLI-Flag `--owner`; lassen Sie es weg, um als authentifizierter Benutzer zu veröffentlichen.
- V1-Skill-Veröffentlichung verwendet `clawhub_token`; GitHub-OIDC-Trusted-Publishing ist vorerst nur für Pakete verfügbar.

### `delete <skill>`

- Ohne `--version` einen Skill per Soft Delete löschen (Owner, Moderator oder Admin).
- Ruft `DELETE /api/v1/skills/{slug}` auf.
- Vom Owner ausgelöste Soft Deletes reservieren den Slug 30 Tage lang; der Befehl gibt die Ablaufzeit aus.
- `--version <version>` löscht eine eigene, nicht neueste Version dauerhaft über eine fail-closed,
  versionsspezifische Route.
  Gelöschte Versionen können nicht wiederhergestellt oder erneut veröffentlicht werden. Veröffentlichen Sie einen Ersatz, bevor Sie die
  derzeit neueste Version löschen. Plattformmitarbeiter umgehen die Ownership für diesen reinen Versionsablauf nicht.
- `--reason <text>` zeichnet eine Moderationsnotiz für einen Soft Delete des gesamten Skills und im Audit-Log auf.
- `--note <text>` ist ein Alias für `--reason`.
- `--yes` überspringt die Bestätigung.

### `undelete <skill>`

- Einen ausgeblendeten Skill wiederherstellen (Owner, Moderator oder Admin).
- Es gibt kein Undelete für Versionen; dauerhaft gelöschte Versionen können nicht wiederhergestellt werden.
- Ruft `POST /api/v1/skills/{slug}/undelete` auf.
- `--reason <text>` zeichnet eine Moderationsnotiz für den Skill und im Audit-Log auf.
- `--note <text>` ist ein Alias für `--reason`.
- `--yes` überspringt die Bestätigung.

### `hide <skill>`

- Einen Skill ausblenden (Owner, Moderator oder Admin).
- Alias für `delete`.

### `unhide <skill>`

- Einen Skill wieder einblenden (Owner, Moderator oder Admin).
- Alias für `undelete`.

### `skill rename <skill> <new-name>`

- Einen eigenen Skill umbenennen und den vorherigen Slug als Weiterleitungsalias behalten.
- Ruft `POST /api/v1/skills/{slug}/rename` auf.
- `--yes` überspringt die Bestätigung.

### `skill merge <source> <target>`

- Einen eigenen Skill in einen anderen eigenen Skill zusammenführen.
- Der Quell-Slug wird nicht mehr öffentlich gelistet und wird zu einem Weiterleitungsalias auf das Ziel.
- Ruft `POST /api/v1/skills/{sourceSlug}/merge` auf.
- `--yes` überspringt die Bestätigung.

### `transfer`

- Workflow zur Übertragung der Ownership.
- Übertragungen an Benutzer-Handles erstellen eine ausstehende Anfrage, die der Empfänger annimmt.
- Übertragungen an Organisations-/Publisher-Handles werden nur dann sofort angewendet, wenn der Akteur
  Admin-Zugriff sowohl auf den aktuellen Owner als auch auf den Ziel-Publisher hat.
- Unterbefehle:
  - `transfer request <skill> <handle> [--message "..."] [--yes]`
  - `transfer list [--outgoing]`
  - `transfer accept <skill> [--yes]`
  - `transfer reject <skill> [--yes]`
  - `transfer cancel <skill> [--yes]`
- Endpunkte:
  - `POST /api/v1/skills/{slug}/transfer`
  - `POST /api/v1/skills/{slug}/transfer/accept`
  - `POST /api/v1/skills/{slug}/transfer/reject`
  - `POST /api/v1/skills/{slug}/transfer/cancel`
  - `GET /api/v1/transfers/incoming`
  - `GET /api/v1/transfers/outgoing`

### `package explore [query...]`

- Durchsucht oder durchsieht den vereinheitlichten Paketkatalog über `GET /api/v1/packages` und `GET /api/v1/packages/search`.
- Verwenden Sie dies für Plugins und andere Einträge aus Paketfamilien; `search` auf oberster Ebene bleibt die Suchoberfläche für Skills.
- Flags:
  - `--family skill|code-plugin|bundle-plugin`
  - `--official`
  - `--executes-code`
  - `--target <target>`, `--os <os>`, `--arch <arch>`, `--libc <libc>`
  - `--requires-browser`, `--requires-desktop`, `--requires-native-deps`
  - `--requires-external-service`, `--external-service <name>`
  - `--binary <name>`, `--os-permission <name>`
  - `--artifact-kind legacy-zip|npm-pack`
  - `--npm-mirror`
  - `--limit <n>` (1-100, Standard: 25)
  - `--json`

Beispiele:

```bash
clawhub package explore --family code-plugin
clawhub package explore --family code-plugin --os darwin --requires-desktop
clawhub package explore --family code-plugin --artifact-kind npm-pack
clawhub package explore --npm-mirror
clawhub package explore episodic-claw --family code-plugin
```

### `package inspect <name>`

- Ruft Paketmetadaten ab, ohne zu installieren.
- Verwenden Sie dies für Plugin-Metadaten, Kompatibilität, Verifizierung, Quelle sowie Versions-/Dateiinspektion.
- `--version <version>`: eine bestimmte Version inspizieren (Standard: neueste).
- `--tag <tag>`: eine getaggte Version inspizieren (z. B. `latest`).
- `--versions`: Versionshistorie auflisten (erste Seite).
- `--limit <n>`: maximale Anzahl aufzulistender Versionen (1-100).
- `--files`: Dateien für die ausgewählte Version auflisten.
- `--file <path>`: Rohdateiinhalt abrufen (nur Textdateien; Limit 200 KB).
- `--json`: maschinenlesbare Ausgabe.

### `package download <name>`

- Löst eine Paketversion über
  `GET /api/v1/packages/{name}/versions/{version}/artifact` auf.
- Lädt das Artefakt von der `downloadUrl` des Resolvers herunter.
- Verifiziert ClawHub SHA-256 für alle Artefakte.
- Für ClawPack-npm-pack-Artefakte verifiziert es außerdem die npm-`sha512`-Integrität,
  die npm-shasum und Name/Version in der `package.json` des Tarballs.
- Legacy-ZIP-Versionen werden über die Legacy-ZIP-Route heruntergeladen.
- Flags:
  - `--version <version>`: eine bestimmte Version herunterladen.
  - `--tag <tag>`: eine getaggte Version herunterladen (Standard: `latest`).
  - `-o, --output <path>`: Ausgabedatei oder Verzeichnis.
  - `--force`: eine vorhandene Ausgabedatei überschreiben.
  - `--json`: maschinenlesbare Ausgabe.

Beispiele:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- Berechnet ClawHub SHA-256, npm-`sha512`-Integrität und npm-shasum für ein lokales
  Artefakt.
- Mit `--package` werden erwartete Metadaten von ClawHub aufgelöst und die
  lokale Datei mit den veröffentlichten Artefaktmetadaten verglichen.
- Mit direkten Digest-Flags wird ohne Netzwerk-Lookup verifiziert.
- Flags:
  - `--package <name>`: Paketname zum Auflösen der erwarteten Artefaktmetadaten.
  - `--version <version>` oder `--tag <tag>`: erwartete Paketversion.
  - `--sha256 <hex>`: erwarteter ClawHub SHA-256.
  - `--npm-integrity <sri>`: erwartete npm-Integrität.
  - `--npm-shasum <sha1>`: erwartete npm-shasum.
  - `--json`: maschinenlesbare Ausgabe.

Beispiele:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package validate <source>`

- Führt den gebündelten Plugin Inspector der ClawHub CLI gegen einen lokalen
  Plugin-Paketordner aus.
- Standardmäßig Offline-/statische Validierung, ohne einen lokalen
  OpenClaw-Checkout zu lokalisieren oder zu importieren.
- Harte Kompatibilitätsfehler beenden mit einem Nicht-Null-Code. Reine Warnhinweise werden ausgegeben, aber
  beenden mit null.
- Flags:
  - `--out <dir>`: Plugin-Inspector-Berichte in dieses Verzeichnis schreiben.
  - `--openclaw <path>`: gegen einen expliziten lokalen OpenClaw-Checkout inspizieren.
  - `--runtime`: Runtime-Erfassung aktivieren; importiert Plugin-Code.
  - `--allow-execute`: Runtime-Erfassung in einem isolierten Workspace erlauben.
  - `--no-mock-sdk`: gemocktes OpenClaw SDK während der Runtime-Erfassung deaktivieren.
  - `--json`: maschinenlesbare Ausgabe.

Beispiel:

```bash
clawhub package validate ./example-plugin
```

Wenn die Validierung einen Paket-, Manifest-, SDK-Import- oder Artefaktbefund meldet, lesen Sie
[Plugin-Validierungskorrekturen](/clawhub/plugin-validation-fixes) und führen Sie den Befehl dann erneut aus.

### `package delete <name>`

- Ohne `--version` wird ein Paket und alle Releases per Soft Delete gelöscht.
- `--version <version>` löscht einen eigenen, nicht neuesten Release dauerhaft über eine fail-closed,
  versionsspezifische Route.
  Gelöschte Versionen können nicht wiederhergestellt oder erneut veröffentlicht werden. Veröffentlichen Sie einen Ersatz, bevor Sie die
  derzeit neueste Version löschen. Dieser reine Versionsablauf erfordert den Paket-Owner oder einen Org-Publisher-
  Admin; Plattformmitarbeiter umgehen die Paket-Ownership nicht.
- Soft Delete des gesamten Pakets erfordert den Paket-Owner, einen Org-Publisher-Owner/-Admin, Plattform-
  Moderator oder Plattform-Admin.
- Flags:
  - `--version <version>`: eine nicht neueste Version dauerhaft löschen.
  - `--yes`: Bestätigung überspringen.
  - `--json`: maschinenlesbare Ausgabe.

Beispiel:

```bash
clawhub package delete @openclaw/example-plugin --yes
clawhub package delete @openclaw/example-plugin --version 1.2.3 --yes
```

### `package undelete <name>`

- Stellt ein per Soft Delete gelöschtes Paket und seine Releases wieder her.
- Es gibt kein Undelete für Versionen; dauerhaft gelöschte Versionen können nicht wiederhergestellt werden.
- Erfordert den Paket-Owner, einen Org-Publisher-Owner/-Admin, Plattform-Moderator
  oder Plattform-Admin.
- Ruft `POST /api/v1/packages/{name}/undelete` auf.
- Flags:
  - `--yes`: Bestätigung überspringen.
  - `--json`: maschinenlesbare Ausgabe.

Beispiel:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- Überträgt ein Paket an einen anderen Publisher.
- Erfordert Admin-Zugriff sowohl auf den aktuellen Paket-Owner als auch auf den Ziel-
  Publisher, außer wenn dies von einem Plattform-Admin durchgeführt wird.
- Scoped Paketnamen müssen an den passenden Scope-Owner übertragen werden.
- Ruft `POST /api/v1/packages/{name}/transfer` auf.
- Flags:
  - `--to <owner>`: Handle des Ziel-Publishers.
  - `--reason <text>`: optionaler Audit-Grund.
  - `--json`: maschinenlesbare Ausgabe.

Beispiel:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- Authentifizierter Befehl zum Melden eines Pakets an Moderatoren.
- Ruft `POST /api/v1/packages/{name}/report` auf.
- Meldungen gelten auf Paketebene, sind optional an eine Version gebunden und werden
  für Moderatoren zur Prüfung sichtbar.
- Meldungen blenden Pakete nicht automatisch aus und blockieren Downloads nicht von sich aus.
- Flags:
  - `--version <version>`: optionale Paketversion, die der Meldung hinzugefügt wird.
  - `--reason <text>`: erforderlicher Meldegrund.
  - `--json`: maschinenlesbare Ausgabe.

Beispiel:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- Owner-Befehl zum Prüfen der Moderationssichtbarkeit eines Pakets.
- Ruft `GET /api/v1/packages/{name}/moderation` auf.
- Zeigt den aktuellen Paketscan-Status, die Anzahl offener Meldungen, den manuellen
  Moderationsstatus des neuesten Releases, den Download-Blockstatus und Moderationsgründe.
- Flags:
  - `--json`: maschinenlesbare Ausgabe.

Beispiel:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- Prüft, ob ein Paket für die zukünftige Nutzung durch OpenClaw bereit ist.
- Ruft `GET /api/v1/packages/{name}/readiness` auf.
- Meldet Blocker für offiziellen Status, ClawPack-Verfügbarkeit, Artefakt-Digest,
  Quellenherkunft, OpenClaw-Kompatibilität, Host-Ziele, Umgebungsmetadaten
  und Scan-Status.
- Flags:
  - `--json`: maschinenlesbare Ausgabe.

Beispiel:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- Zeigt den operatororientierten Migrationsstatus für ein Paket, das ein
  gebündeltes OpenClaw Plugin ersetzen kann.
- Ruft denselben berechneten Readiness-Endpunkt wie `package readiness` auf, gibt aber
  migrationsorientierten Status, neueste Version, offiziellen Paketstatus, Prüfungen und
  Blocker aus.
- Flags:
  - `--json`: maschinenlesbare Ausgabe.

Beispiel:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- Erstellt einen Org-Publisher, der dem authentifizierten Benutzer gehört.
- Das Handle wird in Kleinbuchstaben normalisiert und kann mit oder ohne `@` übergeben werden.
- Neu erstellte Org-Publisher sind standardmäßig nicht vertrauenswürdig/offiziell.
- Schlägt fehl, wenn das Handle bereits von einem vorhandenen Publisher, Benutzer oder einer reservierten Route verwendet wird.

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- Veröffentlicht ein Code-Plugin oder Bundle-Plugin über `POST /api/v1/packages`.
- `<source>` akzeptiert:
  - Lokaler Ordnerpfad: `./my-plugin`
  - Lokaler ClawPack-npm-pack-Tarball: `./my-plugin-1.2.3.tgz`
  - GitHub-Repository: `owner/repo` oder `owner/repo@ref`
  - GitHub-URL: `https://github.com/owner/repo`
- Metadaten werden automatisch aus `package.json`, `openclaw.plugin.json` und
  echten OpenClaw-Bundle-Markern wie `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json` und `.cursor-plugin/plugin.json` erkannt.
- `.tgz`-Quellen werden als ClawPack behandelt. Die CLI lädt die exakten npm-pack-
  Bytes hoch und verwendet die extrahierten `package/`-Inhalte nur für Validierung und
  vorausgefüllte Metadaten.
- Code-Plugin-Ordner werden vor dem Upload in einen ClawPack-npm-Tarball gepackt, damit
  OpenClaw-Installationen das exakte Artefakt verifizieren können. Bundle-Plugin-Ordner verwenden weiterhin
  den Veröffentlichungsweg für extrahierte Dateien.
- Für GitHub-Quellen wird die Quellenzuordnung automatisch aus dem Repository, dem aufgelösten Commit, Ref und Unterpfad ausgefüllt.
- Für lokale Ordner wird die Quellenzuordnung automatisch aus dem lokalen Git erkannt, wenn das Origin-Remote auf GitHub zeigt.
- Externe Code-Plugins müssen `openclaw.compat.pluginApi` und
  `openclaw.build.openclawVersion` explizit deklarieren.
  `package.json.version` auf oberster Ebene wird nicht als Fallback für die Veröffentlichungsvalidierung verwendet.
- `--dry-run` zeigt eine Vorschau der aufgelösten Veröffentlichungs-Nutzlast ohne Upload an.
- `--json` gibt maschinenlesbare Ausgabe für CI aus.
- `--owner <handle>` veröffentlicht unter einem Benutzer- oder Organisations-Publisher-Handle, wenn der Akteur Publisher-Zugriff hat.
- Scoped Package-Namen müssen mit dem ausgewählten Owner übereinstimmen. Siehe `docs/publishing.md`.
- Bestehende Flags (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) funktionieren weiterhin als Überschreibungen.
- Private GitHub-Repositorys erfordern `GITHUB_TOKEN`.

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### Empfohlener lokaler Ablauf

Verwenden Sie zuerst `--dry-run`, damit Sie die aufgelösten Paketmetadaten und
die Quellenzuordnung prüfen können, bevor Sie ein Live-Release erstellen:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### Lokaler Ordnerablauf

Für Code-Plugins erstellt und lädt die Ordnerveröffentlichung ein ClawPack-Artefakt aus
dem Paketordner hoch:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### Minimales `package.json` für `--family code-plugin`

Externe Code-Plugins benötigen eine kleine Menge OpenClaw-Metadaten in
`package.json`. Dieses minimale Manifest reicht für eine erfolgreiche Veröffentlichung aus:

```json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./index.ts"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2"
    }
  }
}
```

Erforderliche Felder:

- `openclaw.compat.pluginApi`
- `openclaw.build.openclawVersion`

Hinweise:

- `package.json.version` ist Ihre Paket-Release-Version, wird aber nicht als
  Fallback für OpenClaw-Kompatibilitäts-/Build-Validierung verwendet.
- `openclaw.hostTargets` und `openclaw.environment` sind optionale Metadaten.
  ClawHub kann sie anzeigen, wenn sie vorhanden sind, sie sind aber für die Veröffentlichung nicht erforderlich.
- `openclaw.compat.minGatewayVersion` und
  `openclaw.build.pluginSdkVersion` sind optionale Extras, wenn Sie
  detailliertere Kompatibilitätsmetadaten veröffentlichen möchten.
- Wenn Sie ein älteres `clawhub`-CLI-Release verwenden, führen Sie vor der Veröffentlichung ein Upgrade durch, damit
  die lokalen Preflight-Prüfungen vor dem Upload ausgeführt werden.
- Wenn die Validierung einen Behebungscode meldet, siehe
  [Korrekturen für Plugin-Validierung](/clawhub/plugin-validation-fixes).

#### GitHub Actions

ClawHub liefert außerdem einen offiziellen wiederverwendbaren Workflow unter
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/a95f470a588ea9fe4c4b4c258c8c4ca5f02c2836/.github/workflows/package-publish.yml)
für Plugin-Repositorys mit.

Typische Caller-Einrichtung:

```yaml
name: Package Publish

on:
  pull_request:
  workflow_dispatch:
  push:
    tags:
      - "v*"

jobs:
  dry-run:
    if: github.event_name == 'pull_request'
    uses: openclaw/clawhub/.github/workflows/package-publish.yml@v0.12.0
    with:
      dry_run: true

  publish:
    if: github.event_name == 'workflow_dispatch' || startsWith(github.ref, 'refs/tags/')
    permissions:
      contents: read
      id-token: write
    uses: openclaw/clawhub/.github/workflows/package-publish.yml@v0.12.0
    with:
      dry_run: false
    secrets:
      clawhub_token: ${{ secrets.CLAWHUB_TOKEN }}
```

Hinweise:

- Der wiederverwendbare Workflow setzt `source` standardmäßig auf das Caller-Repository.
- Für Monorepos übergeben Sie `source_path`, damit der Workflow den Plugin-
  Paketordner veröffentlicht, zum Beispiel `source_path: extensions/codex`.
- Pinnen Sie den wiederverwendbaren Workflow auf ein stabiles Tag oder eine vollständige Commit-SHA. Führen Sie Release-Veröffentlichungen nicht von `@main` aus.
- `pull_request` sollte `dry_run: true` verwenden, damit CI keine dauerhaften Änderungen erzeugt.
- Echte Veröffentlichungen sollten auf vertrauenswürdige Ereignisse wie `workflow_dispatch` oder Tag-Pushes beschränkt sein.
- Vertrauenswürdiges Publishing ohne Secret funktioniert nur bei `workflow_dispatch`; Tag-Pushes benötigen weiterhin `clawhub_token`.
- Halten Sie `clawhub_token` für die erste Veröffentlichung, nicht vertrauenswürdige Pakete oder Break-Glass-Veröffentlichungen verfügbar.
- Der Workflow lädt das JSON-Ergebnis als Artefakt hoch und stellt es als Workflow-Ausgaben bereit.

### `package trusted-publisher get <name>`

- Zeigt die GitHub-Actions-Konfiguration für vertrauenswürdige Publisher für ein Paket an.
- Verwenden Sie dies nach dem Setzen der Konfiguration, um das Repository, den Workflow-Dateinamen
  und den optionalen Environment-Pin zu bestätigen.
- Flags:
  - `--json`: maschinenlesbare Ausgabe.

Beispiel:

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- Hängt die GitHub-Actions-Konfiguration für vertrauenswürdige Publisher an ein bestehendes
  Paket an oder ersetzt sie.
- Das Paket muss zuerst über normales manuelles oder tokenauthentifiziertes
  `clawhub package publish` erstellt werden.
- Nachdem die Konfiguration gesetzt wurde, können zukünftige unterstützte GitHub-Actions-Veröffentlichungen
  OIDC/vertrauenswürdiges Publishing ohne langlebiges ClawHub-Token verwenden.
- `--repository <repo>` muss `owner/repo` sein.
- `--workflow-filename <file>` muss mit dem Namen der Workflow-Datei in
  `.github/workflows/` übereinstimmen.
- `--environment <name>` ist optional. Wenn konfiguriert, muss die GitHub-Actions-
  Umgebung im OIDC-Claim exakt übereinstimmen.
- ClawHub verifiziert das konfigurierte GitHub-Repository, wenn dieser Befehl ausgeführt wird.
  Öffentliche Repositorys können über öffentliche GitHub-Metadaten verifiziert werden. Private
  Repositorys erfordern, dass ClawHub GitHub-Zugriff auf dieses Repository hat, zum
  Beispiel über eine zukünftige ClawHub-GitHub-App-Installation oder eine andere autorisierte
  GitHub-Integration.
- Flags:
  - `--repository <repo>`: GitHub-Repository, zum Beispiel `openclaw/example-plugin`.
  - `--workflow-filename <file>`: Workflow-Dateiname, zum Beispiel `package-publish.yml`.
  - `--environment <name>`: optionale GitHub-Actions-Umgebung mit exakter Übereinstimmung.
  - `--json`: maschinenlesbare Ausgabe.

Beispiel:

```bash
clawhub package trusted-publisher set @openclaw/example-plugin \
  --repository openclaw/example-plugin \
  --workflow-filename package-publish.yml \
  --environment release
```

### `package trusted-publisher delete <name>`

- Entfernt die Konfiguration für vertrauenswürdige Publisher aus einem Paket.
- Verwenden Sie dies als Rollback, wenn der Workflow, das Repository oder der Environment-Pin
  deaktiviert oder neu erstellt werden muss.
- Zukünftige echte Veröffentlichungen müssen normales authentifiziertes Publishing verwenden, bis die Konfiguration
  erneut gesetzt ist.
- Flags:
  - `--json`: maschinenlesbare Ausgabe.

Beispiel:

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### Installations-Telemetrie

- Wird nach `clawhub install <slug>` gesendet, wenn Sie angemeldet sind, sofern
  `CLAWHUB_DISABLE_TELEMETRY=1` nicht gesetzt ist.
- Reporting erfolgt nach Best Effort. Installationsbefehle schlagen nicht fehl, wenn Telemetrie
  nicht verfügbar ist.
- Details: `docs/telemetry.md`.
