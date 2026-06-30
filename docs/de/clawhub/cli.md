---
read_when:
    - Verwenden der ClawHub-CLI
    - Installation, Aktualisierung oder Veröffentlichung debuggen
summary: 'CLI-Referenz: Befehle, Flags, Konfiguration und Lockfile-Verhalten.'
x-i18n:
    generated_at: "2026-06-30T22:10:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 119900fddb8c80213eb12060c07026527a1ff851546c632bf1f7a909659b1945
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

Überprüfen Sie es anschließend:

```bash
clawhub --help
clawhub login
clawhub whoami
```

## Globale Flags

- `--workdir <dir>`: Arbeitsverzeichnis (Standard: cwd; fällt auf den Clawdbot-Arbeitsbereich zurück, falls konfiguriert)
- `--dir <dir>`: Installationsverzeichnis unterhalb von workdir (Standard: `skills`)
- `--site <url>`: Basis-URL für Browser-Login (Standard: `https://clawhub.ai`)
- `--registry <url>`: API-Basis-URL (Standard: ermittelt, andernfalls `https://clawhub.ai`)
- `--no-input`: Eingabeaufforderungen deaktivieren

Entsprechungen als Umgebungsvariablen:

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
für normales HTTP. `NO_PROXY` / `no_proxy` wird berücksichtigt, um den Proxy für
bestimmte Hosts oder Domains zu umgehen.

Dies ist auf Systemen erforderlich, bei denen direkte ausgehende Verbindungen blockiert sind
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
- Legacy-Fallback: Wenn `clawhub/config.json` noch nicht existiert, aber `clawdhub/config.json` vorhanden ist, verwendet die CLI den Legacy-Pfad erneut
- Überschreiben: `CLAWHUB_CONFIG_PATH` (Legacy `CLAWDHUB_CONFIG_PATH`)

## Befehle

### `login` / `auth login`

- Standard: Öffnet den Browser unter `<site>/cli/auth` und schließt über einen loopback callback ab.
- Ohne grafische Oberfläche: `clawhub login --token clh_...`
- Remote/interaktiv ohne grafische Oberfläche: `clawhub login --device` gibt einen Code aus und wartet, während Sie ihn unter `<site>/cli/device` autorisieren.

### `whoami`

- Überprüft das gespeicherte Token über `/api/v1/whoami`.

### `token`

- Gibt das gespeicherte API-Token auf stdout aus.
- Nützlich, um ein lokales Login-Token per Pipe an Befehle zur Einrichtung von CI-Secrets weiterzugeben.

### `star <skill>` / `unstar <skill>`

- Fügt einen Skill zu Ihren Hervorhebungen hinzu oder entfernt ihn daraus.
- Ruft `POST /api/v1/stars/<slug>` und `DELETE /api/v1/stars/<slug>` auf.
- `--yes` überspringt die Bestätigung.

### `search <query...>`

- Ruft `/api/v1/search?q=...` auf.
- Die Ausgabe enthält den Skill-Slug, das Owner-Handle, den Anzeigenamen und den Relevanzwert.
- Die Suche bevorzugt exakte Token-Übereinstimmungen bei Slug/Namen vor Download-Popularität. Ein eigenständiges Slug-Token wie `map` passt stärker zu `personal-map` als zur Teilzeichenfolge in `amap`.
- Popularität ist ein kleiner Ranking-Prior, keine Garantie für eine Spitzenplatzierung.
- Wenn ein Skill erscheinen sollte, aber nicht erscheint, führen Sie im angemeldeten Zustand `clawhub inspect @owner/slug` aus, um owner-sichtbare Moderationsdiagnosen zu prüfen, bevor Sie Metadaten umbenennen.

### `explore`

- Listet neueste Skills über `/api/v1/skills?limit=...&sort=createdAt` auf (absteigend nach `createdAt` sortiert).
- Flags:
  - `--limit <n>` (1-200, Standard: 25)
  - `--sort newest|updated|rating|downloads|trending` (Standard: newest). Legacy-Installationssortier-Aliasse funktionieren weiterhin aus Kompatibilitätsgründen.
  - `--json` (maschinenlesbare Ausgabe)
- Ausgabe: `<slug>  v<version>  <age>  <summary>` (Zusammenfassung auf 50 Zeichen gekürzt).

### `inspect @owner/slug`

- Ruft Skill-Metadaten und Versionsdateien ab, ohne zu installieren.
- `--version <version>`: Eine bestimmte Version untersuchen (Standard: neueste).
- `--tag <tag>`: Eine getaggte Version untersuchen (z. B. `latest`).
- `--versions`: Versionsverlauf auflisten (erste Seite).
- `--limit <n>`: Maximale Anzahl aufzulistender Versionen (1-200).
- `--files`: Dateien für die ausgewählte Version auflisten.
- `--file <path>`: Rohdateiinhalte abrufen (nur Textdateien; 200-KB-Limit).
- `--json`: Maschinenlesbare Ausgabe.

### `install @owner/slug`

- Löst die neueste Version für den benannten Owner und Skill auf.
- Lädt ZIP über `/api/v1/download` herunter.
- Entpackt nach `<workdir>/<dir>/<slug>`.
- Verweigert das Überschreiben angehefteter Skills; führen Sie zuerst `clawhub unpin <skill>` aus.
- Schreibt:
  - `<workdir>/.clawhub/lock.json` (Legacy `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (Legacy `.clawdhub`)

### `uninstall <skill>`

- Entfernt `<workdir>/<dir>/<slug>` und löscht den Lockfile-Eintrag.
- Sendet Best-Effort-Telemetrie, während Sie angemeldet sind, damit aktuelle Installationszahlen
  deaktiviert werden können.
- Interaktiv: Fragt nach Bestätigung.
- Nicht interaktiv (`--no-input`): Erfordert `--yes`.

### `list`

- Liest `<workdir>/.clawhub/lock.json` (Legacy `.clawdhub`).
- Zeigt `pinned` neben Skills an, die mit `clawhub pin` eingefroren wurden, einschließlich des optionalen Grunds.

### `pin <skill>`

- Markiert einen installierten Skill im Lockfile als angeheftet.
- `--reason <text>` zeichnet auf, warum der Skill eingefroren ist.
- Angeheftete Skills werden von `update --all` übersprungen und von direktem `update <skill>` abgelehnt.
- Angeheftete Skills lehnen auch `install --force` ab, damit die lokalen Bytes nicht versehentlich ersetzt werden können.

### `unpin <skill>`

- Entfernt die Lockfile-Anheftung von einem installierten Skill, damit zukünftige Updates ihn ändern können.

### `update [@owner/slug]` / `update --all`

- Berechnet einen Fingerprint aus lokalen Dateien.
- Wenn der Fingerprint mit einer bekannten Version übereinstimmt: keine Eingabeaufforderung.
- Wenn der Fingerprint nicht übereinstimmt:
  - verweigert standardmäßig
  - überschreibt mit `--force` (oder nach Eingabeaufforderung, wenn interaktiv)
- Angeheftete Skills werden niemals durch `--force` aktualisiert.
- `update <skill>` schlägt bei angehefteten Skills schnell fehl und weist Sie an, zuerst `clawhub unpin <skill>` auszuführen.
- `update --all` überspringt angeheftete Slugs und gibt eine Zusammenfassung dessen aus, was eingefroren blieb.

### `skill publish <path>`

- Vergleicht den lokalen Bundle-Fingerprint mit ClawHub und beendet erfolgreich, wenn
  der Inhalt bereits veröffentlicht ist.
- Neue Skills verwenden standardmäßig `1.0.0`; geänderte Skills verwenden standardmäßig die nächste Patch-
  Version.
- `--version <version>` wählt explizit eine Version aus und veröffentlicht auch dann, wenn der
  Inhalt mit einer bestehenden Version übereinstimmt.
- `--dry-run` löst die Veröffentlichung ohne Upload auf; `--json` gibt ein
  maschinenlesbares Ergebnis aus.
- `--owner <handle>` veröffentlicht unter einem Organisations-/Benutzer-Publisher-Handle, wenn der
  Akteur Publisher-Zugriff hat.
- `--migrate-owner` verschiebt einen bestehenden Skill zu `--owner`, während eine neue
  Version veröffentlicht wird. Erfordert Admin-/Owner-Zugriff auf beide Publisher.
- Owner- und Review-Verhalten wird in `docs/publishing.md` erklärt.
- Das Veröffentlichen eines Skills bedeutet, dass er unter `MIT-0` auf ClawHub veröffentlicht wird.
- Veröffentlichte Skills können ohne Namensnennung frei verwendet, geändert und weiterverteilt werden.
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
Workflow ruft `skill publish` für einen `skill_path` auf oder für jeden unmittelbaren Skill-
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
- Neue Skills werden als `1.0.0` veröffentlicht; geänderte Skills veröffentlichen standardmäßig die nächste Patch-Version.
  Verwenden Sie `--bump minor|major` für Update-Batches, die um einen
  größeren Semver-Schritt weitergehen sollen.
- `--dry-run` zeigt den Veröffentlichungsplan ohne Upload; `--json` gibt einen
  maschinenlesbaren Plan aus.
- `--all` veröffentlicht jeden neuen oder geänderten Skill ohne Eingabeaufforderung. Ohne
  `--all` können Sie in interaktiven Terminals die zu veröffentlichenden Skills auswählen.
- `--owner <handle>` veröffentlicht unter einem Organisations-/Benutzer-Publisher-Handle, wenn der
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
- Scans sind asynchron und können einige Zeit bis zum Abschluss benötigen. Während sie in der Warteschlange stehen, zeigt der Terminal-Spinner die aktuelle priorisierte Scan-Position und wie viele Scans davor liegen.
- Veröffentlichte Scans erfordern Ownership- oder Publisher-Verwaltungszugriff. Moderatoren/Admins können dasselbe Backend über `clawhub-admin` verwenden.
- `--update` ist nur mit `--slug` gültig; es schreibt erfolgreiche veröffentlichte Scan-Ergebnisse in die ausgewählte Version zurück.
- `--output <file.zip>` lädt das vollständige Berichtsarchiv mit `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` und `README.md` herunter.
- `--json` gibt die vollständige Poll-Antwort für Automatisierung aus.
- Lokale Pfad-Scans werden nicht mehr unterstützt. Laden Sie eine neue Version hoch und verwenden Sie dann `scan download`, um die gespeicherten Scan-Ergebnisse für diese eingereichte Version abzurufen.

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- Erfordert `clawhub login`.
- Lädt die gespeicherte Scan-Berichts-ZIP für eine eingereichte Skill- oder Plugin-Version herunter, einschließlich Versionen, die durch ClawHub-Sicherheitsprüfungen blockiert oder ausgeblendet wurden.
- Skill-Downloads verwenden den Skill-Slug und standardmäßig `--kind skill`.
- Plugin-Downloads verwenden den Paketnamen und erfordern `--kind plugin`.
- `--version` ist erforderlich, damit Autoren die exakte eingereichte Version untersuchen können, die ClawHub blockiert hat.
- `--output <file.zip>` wählt den Zielpfad.

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

ClawHub liefert einen offiziellen wiederverwendbaren Workflow unter
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/d8096dfc039e86ab942ddf9ef117d04849fd84c1/.github/workflows/skill-publish.yml)
für Skill-Repos und Katalog-Repos aus.

Typische Katalog-Einrichtung:

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
- `owner` wird dem CLI-Flag `--owner` zugeordnet; lassen Sie es weg, um als authentifizierter Benutzer zu veröffentlichen.
- V1-Skill-Veröffentlichung verwendet `clawhub_token`; GitHub-OIDC-Trusted-Publishing ist vorerst nur für Pakete verfügbar.

### `delete <skill>`

- Ohne `--version` wird ein Skill weichgelöscht (Owner, Moderator oder Admin).
- Ruft `DELETE /api/v1/skills/{slug}` auf.
- Vom Owner initiierte Weichlöschungen reservieren den Slug 30 Tage lang; der Befehl gibt die Ablaufzeit aus.
- `--version <version>` löscht eine eigene, nicht neueste Version dauerhaft über eine fail-closed,
  versionsspezifische Route.
  Gelöschte Versionen können nicht wiederhergestellt oder erneut veröffentlicht werden. Veröffentlichen Sie einen Ersatz, bevor Sie die
  aktuell neueste Version löschen. Plattformmitarbeiter umgehen die Eigentümerschaft für diesen nur versionsbezogenen Ablauf nicht.
- `--reason <text>` zeichnet eine Moderationsnotiz für eine Weichlöschung des gesamten Skills und im Audit-Log auf.
- `--note <text>` ist ein Alias für `--reason`.
- `--yes` überspringt die Bestätigung.

### `undelete <skill>`

- Stellt einen ausgeblendeten Skill wieder her (Owner, Moderator oder Admin).
- Es gibt keine Wiederherstellung einzelner Versionen; dauerhaft gelöschte Versionen können nicht wiederhergestellt werden.
- Ruft `POST /api/v1/skills/{slug}/undelete` auf.
- `--reason <text>` zeichnet eine Moderationsnotiz für den Skill und im Audit-Log auf.
- `--note <text>` ist ein Alias für `--reason`.
- `--yes` überspringt die Bestätigung.

### `hide <skill>`

- Blendet einen Skill aus (Owner, Moderator oder Admin).
- Alias für `delete`.

### `unhide <skill>`

- Blendet einen Skill wieder ein (Owner, Moderator oder Admin).
- Alias für `undelete`.

### `skill rename <skill> <new-name>`

- Benennt einen eigenen Skill um und behält den vorherigen Slug als Weiterleitungsalias.
- Ruft `POST /api/v1/skills/{slug}/rename` auf.
- `--yes` überspringt die Bestätigung.

### `skill merge <source> <target>`

- Führt einen eigenen Skill mit einem anderen eigenen Skill zusammen.
- Der Quell-Slug wird nicht mehr öffentlich aufgelistet und wird zu einem Weiterleitungsalias auf das Ziel.
- Ruft `POST /api/v1/skills/{sourceSlug}/merge` auf.
- `--yes` überspringt die Bestätigung.

### `transfer`

- Workflow zur Übertragung der Eigentümerschaft.
- Übertragungen an Benutzer-Handles erstellen eine ausstehende Anfrage, die der Empfänger annimmt.
- Übertragungen an Org-/Publisher-Handles werden nur dann sofort angewendet, wenn der Akteur
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

- Durchsucht den einheitlichen Paketkatalog per `GET /api/v1/packages` und `GET /api/v1/packages/search` oder blättert darin.
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
- Verwenden Sie dies für Plugin-Metadaten, Kompatibilität, Verifizierung, Quelle sowie Versions-/Dateiprüfung.
- `--version <version>`: Prüft eine bestimmte Version (Standard: neueste).
- `--tag <tag>`: Prüft eine getaggte Version (z. B. `latest`).
- `--versions`: Listet den Versionsverlauf auf (erste Seite).
- `--limit <n>`: Maximale Anzahl der aufzulistenden Versionen (1-100).
- `--files`: Listet Dateien für die ausgewählte Version auf.
- `--file <path>`: Ruft unverarbeiteten Dateiinhalt ab (nur Textdateien; Limit 200 KB).
- `--json`: Maschinenlesbare Ausgabe.

### `package download <name>`

- Löst eine Paketversion über
  `GET /api/v1/packages/{name}/versions/{version}/artifact` auf.
- Lädt das Artefakt von der `downloadUrl` des Resolvers herunter.
- Verifiziert ClawHub SHA-256 für alle Artefakte.
- Für ClawPack-npm-pack-Artefakte werden außerdem npm-`sha512`-Integrität,
  npm-Shasum und Name/Version in der `package.json` des Tarballs verifiziert.
- Legacy-ZIP-Versionen werden über die Legacy-ZIP-Route heruntergeladen.
- Flags:
  - `--version <version>`: Lädt eine bestimmte Version herunter.
  - `--tag <tag>`: Lädt eine getaggte Version herunter (Standard: `latest`).
  - `-o, --output <path>`: Ausgabedatei oder -verzeichnis.
  - `--force`: Überschreibt eine vorhandene Ausgabedatei.
  - `--json`: Maschinenlesbare Ausgabe.

Beispiele:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- Berechnet ClawHub SHA-256, npm-`sha512`-Integrität und npm-Shasum für ein lokales
  Artefakt.
- Mit `--package` werden die erwarteten Metadaten von ClawHub aufgelöst und die
  lokale Datei mit den veröffentlichten Artefaktmetadaten verglichen.
- Mit direkten Digest-Flags wird ohne Netzwerkabfrage verifiziert.
- Flags:
  - `--package <name>`: Paketname zum Auflösen der erwarteten Artefaktmetadaten.
  - `--version <version>` oder `--tag <tag>`: Erwartete Paketversion.
  - `--sha256 <hex>`: Erwartete ClawHub SHA-256.
  - `--npm-integrity <sri>`: Erwartete npm-Integrität.
  - `--npm-shasum <sha1>`: Erwarteter npm-Shasum.
  - `--json`: Maschinenlesbare Ausgabe.

Beispiele:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package validate <source>`

- Führt den im ClawHub CLI gebündelten Plugin Inspector gegen einen lokalen Plugin-Paketordner
  aus.
- Standardmäßig wird offline/statisch validiert, ohne ein lokales
  OpenClaw-Checkout zu suchen oder zu importieren.
- Harte Kompatibilitätsfehler beenden mit einem Nicht-Null-Code. Nur Warnungen enthaltende Befunde werden ausgegeben, beenden aber
  mit null.
- Flags:
  - `--out <dir>`: Schreibt Plugin-Inspector-Berichte in dieses Verzeichnis.
  - `--openclaw <path>`: Prüft gegen ein explizites lokales OpenClaw-Checkout.
  - `--runtime`: Aktiviert Runtime-Erfassung; importiert Plugin-Code.
  - `--allow-execute`: Erlaubt Runtime-Erfassung in einem isolierten Arbeitsbereich.
  - `--no-mock-sdk`: Deaktiviert das gemockte OpenClaw SDK während der Runtime-Erfassung.
  - `--json`: Maschinenlesbare Ausgabe.

Beispiel:

```bash
clawhub package validate ./example-plugin
```

Wenn die Validierung einen Paket-, Manifest-, SDK-Import- oder Artefaktbefund meldet, lesen Sie
[Plugin-Validierungsfixes](/clawhub/plugin-validation-fixes) und führen Sie den Befehl anschließend erneut aus.

### `package delete <name>`

- Ohne `--version` wird ein Paket und alle Releases weichgelöscht.
- `--version <version>` löscht ein eigenes, nicht neuestes Release dauerhaft über eine fail-closed,
  versionsspezifische Route.
  Gelöschte Versionen können nicht wiederhergestellt oder erneut veröffentlicht werden. Veröffentlichen Sie einen Ersatz, bevor Sie die
  aktuell neueste Version löschen. Dieser nur versionsbezogene Ablauf erfordert den Paket-Owner oder einen Org-Publisher-
  Admin; Plattformmitarbeiter umgehen die Paket-Eigentümerschaft nicht.
- Eine Weichlöschung des gesamten Pakets erfordert den Paket-Owner, einen Org-Publisher-Owner/-Admin, Plattform-
  Moderator oder Plattform-Admin.
- Flags:
  - `--version <version>`: Löscht eine nicht neueste Version dauerhaft.
  - `--yes`: Überspringt die Bestätigung.
  - `--json`: Maschinenlesbare Ausgabe.

Beispiel:

```bash
clawhub package delete @openclaw/example-plugin --yes
clawhub package delete @openclaw/example-plugin --version 1.2.3 --yes
```

### `package undelete <name>`

- Stellt ein weichgelöschtes Paket und Releases wieder her.
- Es gibt keine Wiederherstellung einzelner Versionen; dauerhaft gelöschte Versionen können nicht wiederhergestellt werden.
- Erfordert den Paket-Owner, einen Org-Publisher-Owner/-Admin, Plattform-Moderator
  oder Plattform-Admin.
- Ruft `POST /api/v1/packages/{name}/undelete` auf.
- Flags:
  - `--yes`: Überspringt die Bestätigung.
  - `--json`: Maschinenlesbare Ausgabe.

Beispiel:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- Überträgt ein Paket an einen anderen Publisher.
- Erfordert Admin-Zugriff sowohl auf den aktuellen Paket-Owner als auch auf den Ziel-
  Publisher, sofern die Aktion nicht von einem Plattform-Admin durchgeführt wird.
- Scoped-Paketnamen müssen an den passenden Scope-Owner übertragen werden.
- Ruft `POST /api/v1/packages/{name}/transfer` auf.
- Flags:
  - `--to <owner>`: Handle des Ziel-Publishers.
  - `--reason <text>`: Optionaler Audit-Grund.
  - `--json`: Maschinenlesbare Ausgabe.

Beispiel:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- Authentifizierter Befehl zum Melden eines Pakets an Moderatoren.
- Ruft `POST /api/v1/packages/{name}/report` auf.
- Meldungen gelten auf Paketebene, können optional mit einer Version verknüpft werden und werden
  für Moderatoren zur Prüfung sichtbar.
- Meldungen blenden Pakete nicht automatisch aus und blockieren Downloads nicht von sich aus.
- Flags:
  - `--version <version>`: Optionale Paketversion, die der Meldung zugeordnet wird.
  - `--reason <text>`: Erforderlicher Meldegrund.
  - `--json`: Maschinenlesbare Ausgabe.

Beispiel:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package moderation-status`

- Owner-Befehl zum Prüfen der Moderationssichtbarkeit eines Pakets.
- Ruft `GET /api/v1/packages/{name}/moderation` auf.
- Zeigt den aktuellen Scanstatus des Pakets, die Anzahl offener Meldungen, den manuellen
  Moderationsstatus des neuesten Releases, den Download-Blockierungsstatus und Moderationsgründe.
- Flags:
  - `--json`: Maschinenlesbare Ausgabe.

Beispiel:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- Prüft, ob ein Paket für die künftige Nutzung durch OpenClaw bereit ist.
- Ruft `GET /api/v1/packages/{name}/readiness` auf.
- Meldet Blocker für offiziellen Status, ClawPack-Verfügbarkeit, Artefakt-Digest,
  Quellprovenienz, OpenClaw-Kompatibilität, Host-Ziele, Umgebungsmetadaten
  und Scanstatus.
- Flags:
  - `--json`: Maschinenlesbare Ausgabe.

Beispiel:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- Zeigt den operatororientierten Migrationsstatus für ein Paket, das ein
  gebündeltes OpenClaw Plugin ersetzen kann.
- Ruft denselben berechneten Readiness-Endpunkt wie `package readiness` auf, gibt aber
  migrationsfokussierten Status, neueste Version, Status als offizielles Paket, Prüfungen und
  Blocker aus.
- Flags:
  - `--json`: Maschinenlesbare Ausgabe.

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
  Bytes hoch und verwendet die extrahierten Inhalte von `package/` nur für
  Validierung und Metadaten-Vorbefüllung.
- Code-Plugin-Ordner werden vor dem Upload in einen ClawPack-npm-Tarball gepackt, damit
  OpenClaw-Installationen das exakte Artefakt verifizieren können. Bundle-Plugin-Ordner verwenden weiterhin
  den Veröffentlichungsweg mit extrahierten Dateien.
- Bei GitHub-Quellen wird die Quellzuordnung automatisch aus Repository, aufgelöstem Commit, Ref und Unterpfad befüllt.
- Bei lokalen Ordnern wird die Quellzuordnung automatisch aus lokalem Git erkannt, wenn der Origin-Remote auf GitHub verweist.
- Externe Code-Plugins müssen `openclaw.compat.pluginApi` und
  `openclaw.build.openclawVersion` explizit deklarieren.
  `package.json.version` auf oberster Ebene wird nicht als Fallback für die Veröffentlichungsvalidierung verwendet.
- `--dry-run` zeigt eine Vorschau der aufgelösten Veröffentlichungspayload an, ohne hochzuladen.
- `--json` gibt maschinenlesbare Ausgabe für CI aus.
- `--owner <handle>` veröffentlicht unter einem Benutzer- oder Organisations-Publisher-Handle, wenn der Akteur Publisher-Zugriff hat.
- Scoped Package-Namen müssen mit dem ausgewählten Owner übereinstimmen. Siehe `docs/publishing.md`.
- Vorhandene Flags (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) funktionieren weiterhin als Überschreibungen.
- Private GitHub-Repositorys erfordern `GITHUB_TOKEN`.

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### Empfohlener lokaler Ablauf

Verwenden Sie zuerst `--dry-run`, damit Sie die aufgelösten Paketmetadaten und
die Quellzuordnung bestätigen können, bevor Sie ein Live-Release erstellen:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### Ablauf für lokale Ordner

Bei Code-Plugins erstellt und lädt die Ordnerveröffentlichung ein ClawPack-Artefakt aus
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
  Fallback für die OpenClaw-Kompatibilitäts-/Build-Validierung verwendet.
- `openclaw.hostTargets` und `openclaw.environment` sind optionale Metadaten.
  ClawHub kann sie anzeigen, wenn sie vorhanden sind, sie sind aber für die Veröffentlichung nicht erforderlich.
- `openclaw.compat.minGatewayVersion` und
  `openclaw.build.pluginSdkVersion` sind optionale Extras, wenn Sie
  detailliertere Kompatibilitätsmetadaten veröffentlichen möchten.
- Wenn Sie eine ältere `clawhub`-CLI-Version verwenden, führen Sie vor der Veröffentlichung ein Upgrade durch, damit
  die lokalen Preflight-Prüfungen vor dem Upload ausgeführt werden.
- Wenn die Validierung einen Behebungscode meldet, siehe
  [Korrekturen für Plugin-Validierung](/clawhub/plugin-validation-fixes).

#### GitHub Actions

ClawHub liefert außerdem einen offiziellen wiederverwendbaren Workflow unter
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/d8096dfc039e86ab942ddf9ef117d04849fd84c1/.github/workflows/package-publish.yml)
für Plugin-Repositorys mit.

Typisches Caller-Setup:

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
- Bei Monorepos übergeben Sie `source_path`, damit der Workflow den Plugin-
  Paketordner veröffentlicht, zum Beispiel `source_path: extensions/codex`.
- Pinnen Sie den wiederverwendbaren Workflow auf ein stabiles Tag oder eine vollständige Commit-SHA. Führen Sie Release-Veröffentlichungen nicht von `@main` aus.
- `pull_request` sollte `dry_run: true` verwenden, damit CI nicht verschmutzt wird.
- Echte Veröffentlichungen sollten auf vertrauenswürdige Events wie `workflow_dispatch` oder Tag-Pushes beschränkt sein.
- Vertrauenswürdige Veröffentlichung ohne Secret funktioniert nur bei `workflow_dispatch`; Tag-Pushes benötigen weiterhin `clawhub_token`.
- Halten Sie `clawhub_token` für die erste Veröffentlichung, nicht vertrauenswürdige Pakete oder Break-Glass-Veröffentlichungen verfügbar.
- Der Workflow lädt das JSON-Ergebnis als Artefakt hoch und stellt es als Workflow-Ausgaben bereit.

### `package trusted-publisher get <name>`

- Zeigt die GitHub Actions-Konfiguration für vertrauenswürdige Publisher für ein Paket.
- Verwenden Sie dies nach dem Setzen der Konfiguration, um Repository, Workflow-Dateinamen
  und optionalen Environment-Pin zu bestätigen.
- Flags:
  - `--json`: maschinenlesbare Ausgabe.

Beispiel:

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- Hängt die GitHub Actions-Konfiguration für vertrauenswürdige Publisher an ein vorhandenes
  Paket an oder ersetzt sie.
- Das Paket muss zuerst über normales manuelles oder tokenauthentifiziertes
  `clawhub package publish` erstellt werden.
- Nachdem die Konfiguration gesetzt wurde, können zukünftige unterstützte GitHub Actions-Veröffentlichungen
  OIDC/vertrauenswürdige Veröffentlichung ohne langlebiges ClawHub-Token verwenden.
- `--repository <repo>` muss `owner/repo` sein.
- `--workflow-filename <file>` muss mit dem Workflow-Dateinamen in
  `.github/workflows/` übereinstimmen.
- `--environment <name>` ist optional. Wenn konfiguriert, muss die GitHub Actions-
  Umgebung im OIDC-Claim exakt übereinstimmen.
- ClawHub verifiziert das konfigurierte GitHub-Repository, wenn dieser Befehl ausgeführt wird.
  Öffentliche Repositorys können über öffentliche GitHub-Metadaten verifiziert werden. Private
  Repositorys erfordern, dass ClawHub GitHub-Zugriff auf dieses Repository hat, zum
  Beispiel über eine zukünftige ClawHub-GitHub-App-Installation oder eine andere autorisierte
  GitHub-Integration.
- Flags:
  - `--repository <repo>`: GitHub-Repository, zum Beispiel `openclaw/example-plugin`.
  - `--workflow-filename <file>`: Workflow-Dateiname, zum Beispiel `package-publish.yml`.
  - `--environment <name>`: optionale exakte GitHub Actions-Umgebung.
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
- Verwenden Sie dies als Rollback, wenn Workflow, Repository oder Environment-Pin
  deaktiviert oder neu erstellt werden müssen.
- Zukünftige echte Veröffentlichungen müssen normale authentifizierte Veröffentlichung verwenden, bis die Konfiguration
  wieder gesetzt ist.
- Flags:
  - `--json`: maschinenlesbare Ausgabe.

Beispiel:

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### Install-Telemetrie

- Wird nach `clawhub install <slug>` gesendet, wenn angemeldet, sofern
  `CLAWHUB_DISABLE_TELEMETRY=1` nicht gesetzt ist.
- Reporting erfolgt nach Best Effort. Installationsbefehle schlagen nicht fehl, wenn Telemetrie
  nicht verfügbar ist.
- Details: `docs/telemetry.md`.
