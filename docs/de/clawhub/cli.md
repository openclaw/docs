---
read_when:
    - ClawHub-CLI verwenden
    - Installation, Aktualisierung oder Veröffentlichung debuggen
summary: 'CLI-Referenz: Befehle, Flags, Konfiguration und Lockfile-Verhalten.'
x-i18n:
    generated_at: "2026-07-02T17:33:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 57fee67174cf491721e8479a48a11b66e23260ce4899d2ee5437add05880748e
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

## Globale Optionen

- `--workdir <dir>`: Arbeitsverzeichnis (Standard: cwd; fällt auf den Clawdbot-Arbeitsbereich zurück, falls konfiguriert)
- `--dir <dir>`: Installationsverzeichnis unter workdir (Standard: `skills`)
- `--site <url>`: Basis-URL für Browser-Login (Standard: `https://clawhub.ai`)
- `--registry <url>`: API-Basis-URL (Standard: erkannt, andernfalls `https://clawhub.ai`)
- `--no-input`: Eingabeaufforderungen deaktivieren

Entsprechende Umgebungsvariablen:

- `CLAWHUB_SITE` (Legacy `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (Legacy `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (Legacy `CLAWDHUB_WORKDIR`)

### HTTP-Proxy

Die CLI berücksichtigt die standardmäßigen HTTP-Proxy-Umgebungsvariablen für Systeme hinter Unternehmensproxys oder eingeschränkten Netzwerken:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

Wenn eine dieser Variablen gesetzt ist, leitet die CLI ausgehende Anfragen über den angegebenen Proxy. `HTTPS_PROXY` wird für HTTPS-Anfragen verwendet, `HTTP_PROXY` für normales HTTP. `NO_PROXY` / `no_proxy` wird berücksichtigt, um den Proxy für bestimmte Hosts oder Domains zu umgehen.

Dies ist auf Systemen erforderlich, auf denen direkte ausgehende Verbindungen blockiert sind (z. B. Docker-Container, Hetzner VPS mit ausschließlich Proxy-Internet, Unternehmens-Firewalls).

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
- Überschreiben: `CLAWHUB_CONFIG_PATH` (Legacy `CLAWDHUB_CONFIG_PATH`)

## Befehle

### `login` / `auth login`

- Standard: öffnet den Browser unter `<site>/cli/auth` und schließt den Vorgang über einen local loopback-Callback ab.
- Headless: `clawhub login --token clh_...`
- Remote/headless interaktiv: `clawhub login --device` gibt einen Code aus und wartet, während Sie ihn unter `<site>/cli/device` autorisieren.

### `whoami`

- Prüft das gespeicherte Token über `/api/v1/whoami`.

### `token`

- Gibt das gespeicherte API-Token auf der Standardausgabe aus.
- Nützlich, um ein lokales Login-Token per Pipe in Befehle zur Einrichtung von CI-Secrets zu übergeben.

### `star <skill>` / `unstar <skill>`

- Fügt einen Skill zu Ihren Highlights hinzu oder entfernt ihn daraus.
- Ruft `POST /api/v1/stars/<slug>` und `DELETE /api/v1/stars/<slug>` auf.
- `--yes` überspringt die Bestätigung.

### `search <query...>`

- Ruft `/api/v1/search?q=...` auf.
- Die Ausgabe enthält den Skill-Slug, den Owner-Handle, den Anzeigenamen und den Relevanzwert.
- Die Suche bevorzugt exakte Slug-/Namen-Token-Treffer vor Download-Popularität. Ein eigenständiges Slug-Token wie `map` passt stärker zu `personal-map` als zur Teilzeichenfolge in `amap`.
- Popularität ist nur ein kleiner Ranking-Prior, keine Garantie für eine Spitzenplatzierung.
- Wenn ein Skill erscheinen sollte, dies aber nicht tut, führen Sie angemeldet `clawhub inspect @owner/slug` aus, um Owner-sichtbare Moderationsdiagnosen zu prüfen, bevor Sie Metadaten umbenennen.

### `explore`

- Listet die neuesten Skills über `/api/v1/skills?limit=...&sort=createdAt` auf (absteigend nach `createdAt` sortiert).
- Optionen:
  - `--limit <n>` (1-200, Standard: 25)
  - `--sort newest|updated|rating|downloads|trending` (Standard: newest). Legacy-Installationssortier-Aliasse funktionieren aus Kompatibilitätsgründen weiterhin.
  - `--json` (maschinenlesbare Ausgabe)
- Ausgabe: `<slug>  v<version>  <age>  <summary>` (Zusammenfassung auf 50 Zeichen gekürzt).

### `inspect @owner/slug`

- Ruft Skill-Metadaten und Versionsdateien ab, ohne zu installieren.
- `--version <version>`: eine bestimmte Version prüfen (Standard: neueste).
- `--tag <tag>`: eine getaggte Version prüfen (z. B. `latest`).
- `--versions`: Versionshistorie auflisten (erste Seite).
- `--limit <n>`: maximale Anzahl aufzulistender Versionen (1-200).
- `--files`: Dateien für die ausgewählte Version auflisten.
- `--file <path>`: rohen Dateiinhalt abrufen (nur Textdateien; 200-KB-Limit).
- `--json`: maschinenlesbare Ausgabe.

### `install @owner/slug`

- Ermittelt die neueste Version für den benannten Owner und Skill.
- Lädt ZIP über `/api/v1/download` herunter.
- Entpackt nach `<workdir>/<dir>/<slug>`.
- Verweigert das Überschreiben gepinnter Skills; führen Sie zuerst `clawhub unpin <skill>` aus.
- Schreibt:
  - `<workdir>/.clawhub/lock.json` (Legacy `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (Legacy `.clawdhub`)

### `uninstall <skill>`

- Entfernt `<workdir>/<dir>/<slug>` und löscht den Lockfile-Eintrag.
- Sendet bei angemeldetem Zustand Best-Effort-Telemetrie, damit aktuelle Installationszahlen deaktiviert werden können.
- Interaktiv: fragt nach Bestätigung.
- Nicht interaktiv (`--no-input`): erfordert `--yes`.

### `list`

- Liest `<workdir>/.clawhub/lock.json` (Legacy `.clawdhub`).
- Zeigt `pinned` neben Skills an, die mit `clawhub pin` eingefroren wurden, einschließlich des optionalen Grunds.

### `pin <skill>`

- Markiert einen installierten Skill im Lockfile als gepinnt.
- `--reason <text>` erfasst, warum der Skill eingefroren ist.
- Gepinnte Skills werden von `update --all` übersprungen und von direktem `update <skill>` abgelehnt.
- Gepinnte Skills lehnen außerdem `install --force` ab, damit die lokalen Bytes nicht versehentlich ersetzt werden können.

### `unpin <skill>`

- Entfernt den Lockfile-Pin von einem installierten Skill, damit zukünftige Updates ihn ändern können.

### `update [@owner/slug]` / `update --all`

- Berechnet den Fingerabdruck aus lokalen Dateien.
- Wenn der Fingerabdruck mit einer bekannten Version übereinstimmt: keine Eingabeaufforderung.
- Wenn der Fingerabdruck nicht übereinstimmt:
  - verweigert standardmäßig
  - überschreibt mit `--force` (oder nach Eingabeaufforderung, falls interaktiv)
- Gepinnte Skills werden nie durch `--force` aktualisiert.
- `update <skill>` schlägt bei gepinnten Skills schnell fehl und weist Sie an, zuerst `clawhub unpin <skill>` auszuführen.
- `update --all` überspringt gepinnte Slugs und gibt eine Zusammenfassung aus, was eingefroren blieb.

### `skill publish <path>`

- Vergleicht den lokalen Bundle-Fingerabdruck mit ClawHub und beendet sich erfolgreich, wenn der Inhalt bereits veröffentlicht ist.
- Neue Skills verwenden standardmäßig `1.0.0`; geänderte Skills verwenden standardmäßig die nächste Patch-Version.
- `--version <version>` wählt explizit eine Version aus und veröffentlicht auch dann, wenn der Inhalt mit einer bestehenden Version übereinstimmt.
- `--dry-run` löst die Veröffentlichung auf, ohne hochzuladen; `--json` gibt ein maschinenlesbares Ergebnis aus.
- `--owner <handle>` veröffentlicht unter einem Publisher-Handle einer Organisation oder eines Benutzers, wenn der Akteur Publisher-Zugriff hat.
- `--migrate-owner` verschiebt einen bestehenden Skill zu `--owner`, während eine neue Version veröffentlicht wird. Erfordert Admin-/Owner-Zugriff auf beide Publisher.
- Owner- und Review-Verhalten wird in `docs/publishing.md` erklärt.
- Die Veröffentlichung eines Skills bedeutet, dass er auf ClawHub unter `MIT-0` freigegeben wird.
- Veröffentlichte Skills dürfen ohne Namensnennung frei verwendet, geändert und weiterverbreitet werden.
- ClawHub unterstützt keine kostenpflichtigen Skills oder Preise pro Skill.
- Legacy-Alias: `publish <path>`.

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

Der wiederverwendbare ClawHub-Workflow
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)
ruft `skill publish` für einen `skill_path` oder für jeden direkten Skill-Ordner unter `root` auf (Standard: `skills`). Er überspringt unveränderte Skills und verwendet dasselbe automatische Patch-Version-Verhalten.

Setzen Sie `dry_run: true`, um eine Vorschau ohne Token zu erhalten. Echte Veröffentlichungen erfordern das Secret `clawhub_token`.

### `sync`

- Durchsucht das aktuelle Arbeitsverzeichnis, das konfigurierte Skills-Verzeichnis und alle `--root <dir>`-Ordner nach lokalen Skill-Ordnern, die `SKILL.md` oder `skill.md` enthalten.
- Vergleicht jeden lokalen Skill-Fingerabdruck mit ClawHub und veröffentlicht nur neue oder geänderte Skills.
- Neue Skills werden als `1.0.0` veröffentlicht; geänderte Skills veröffentlichen standardmäßig die nächste Patch-Version. Verwenden Sie `--bump minor|major` für Update-Batches, die um einen größeren Semver-Schritt erhöht werden sollen.
- `--dry-run` zeigt den Veröffentlichungsplan ohne Upload; `--json` gibt einen maschinenlesbaren Plan aus.
- `--all` veröffentlicht jeden neuen oder geänderten Skill ohne Eingabeaufforderung. Ohne `--all` können Sie in interaktiven Terminals die zu veröffentlichenden Skills auswählen.
- `--owner <handle>` veröffentlicht unter einem Publisher-Handle einer Organisation oder eines Benutzers, wenn der Akteur Publisher-Zugriff hat.
- `sync` ist nur eine einseitige Veröffentlichung. Es installiert, aktualisiert, lädt nichts herunter und meldet keine Installations-/Download-Telemetrie.

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- Erfordert `clawhub login`.
- Führt ClawHub ClawScan über `POST /api/v1/skills/-/scan` aus und pollt anschließend, bis der Scan terminal ist.
- Scans sind asynchron und können einige Zeit dauern. Während sie in der Warteschlange stehen, zeigt der Terminal-Spinner die aktuelle priorisierte Scan-Position und wie viele Scans davor liegen.
- Veröffentlichte Scans erfordern Ownership oder Publisher-Verwaltungszugriff. Moderatoren/Admins können dasselbe Backend über `clawhub-admin` verwenden.
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
- Lädt das gespeicherte Scan-Report-ZIP für eine eingereichte Skill- oder Plugin-Version herunter, einschließlich Versionen, die durch ClawHub-Sicherheitsprüfungen blockiert oder ausgeblendet wurden.
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
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/a89bfaf61d1bb5e0bfa7a92cf35b76c7e404e1ca/.github/workflows/skill-publish.yml)
für Skill-Repos und Katalog-Repos aus.

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
- `owner` entspricht der CLI-Option `--owner`; lassen Sie es weg, um als authentifizierter Benutzer zu veröffentlichen.
- V1-Skill-Veröffentlichung verwendet `clawhub_token`; vertrauenswürdige Veröffentlichung über GitHub OIDC ist derzeit nur für Pakete verfügbar.

### `delete <skill>`

- Ohne `--version` wird ein Skill vorläufig gelöscht (Owner, Moderator oder Admin).
- Ruft `DELETE /api/v1/skills/{slug}` auf.
- Vom Owner initiierte vorläufige Löschungen reservieren den Slug für 30 Tage; der Befehl gibt den Ablaufzeitpunkt aus.
- `--version <version>` löscht über eine fail-closed,
  versionsspezifische Route dauerhaft eine eigene Version, die nicht die neueste ist.
  Gelöschte Versionen können nicht wiederhergestellt oder erneut veröffentlicht werden. Veröffentlichen Sie einen Ersatz, bevor Sie die
  aktuelle neueste Version löschen. Plattformmitarbeitende umgehen die Ownership für diesen nur versionsbezogenen Ablauf nicht.
- `--reason <text>` zeichnet eine Moderationsnotiz zu einer vorläufigen Löschung des gesamten Skills und im Audit-Log auf.
- `--note <text>` ist ein Alias für `--reason`.
- `--yes` überspringt die Bestätigung.

### `undelete <skill>`

- Stellt einen ausgeblendeten Skill wieder her (Owner, Moderator oder Admin).
- Es gibt kein Wiederherstellen von Versionen; dauerhaft gelöschte Versionen können nicht wiederhergestellt werden.
- Ruft `POST /api/v1/skills/{slug}/undelete` auf.
- `--reason <text>` zeichnet eine Moderationsnotiz zum Skill und im Audit-Log auf.
- `--note <text>` ist ein Alias für `--reason`.
- `--yes` überspringt die Bestätigung.

### `hide <skill>`

- Blendet einen Skill aus (Owner, Moderator oder Admin).
- Alias für `delete`.

### `unhide <skill>`

- Blendet einen Skill wieder ein (Owner, Moderator oder Admin).
- Alias für `undelete`.

### `skill rename <skill> <new-name>`

- Benennt einen eigenen Skill um und behält den vorherigen Slug als Weiterleitungsalias bei.
- Ruft `POST /api/v1/skills/{slug}/rename` auf.
- `--yes` überspringt die Bestätigung.

### `skill merge <source> <target>`

- Führt einen eigenen Skill mit einem anderen eigenen Skill zusammen.
- Der Quell-Slug wird nicht mehr öffentlich gelistet und wird zu einem Weiterleitungsalias auf das Ziel.
- Ruft `POST /api/v1/skills/{sourceSlug}/merge` auf.
- `--yes` überspringt die Bestätigung.

### `transfer`

- Workflow für die Ownership-Übertragung.
- Übertragungen an Benutzer-Handles erstellen eine ausstehende Anfrage, die der Empfänger annimmt.
- Übertragungen an Org-/Publisher-Handles werden nur sofort angewendet, wenn der Akteur
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

- Durchsucht den vereinheitlichten Paketkatalog per `GET /api/v1/packages` und `GET /api/v1/packages/search` oder zeigt ihn an.
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
- Verwenden Sie dies für Plugin-Metadaten, Kompatibilität, Verifizierung, Quelle und Versions-/Dateiprüfung.
- `--version <version>`: eine bestimmte Version prüfen (Standard: neueste).
- `--tag <tag>`: eine getaggte Version prüfen (z. B. `latest`).
- `--versions`: Versionshistorie auflisten (erste Seite).
- `--limit <n>`: maximale Anzahl aufzulistender Versionen (1-100).
- `--files`: Dateien für die ausgewählte Version auflisten.
- `--file <path>`: Rohinhalt einer Datei abrufen (nur Textdateien; Limit 200 KB).
- `--json`: maschinenlesbare Ausgabe.

### `package download <name>`

- Löst eine Paketversion über
  `GET /api/v1/packages/{name}/versions/{version}/artifact` auf.
- Lädt das Artefakt von der `downloadUrl` des Resolvers herunter.
- Verifiziert ClawHub SHA-256 für alle Artefakte.
- Für ClawPack-npm-pack-Artefakte werden außerdem npm-`sha512`-Integrität,
  npm-shasum und Name/Version der `package.json` des Tarballs verifiziert.
- Legacy-ZIP-Versionen werden über die Legacy-ZIP-Route heruntergeladen.
- Flags:
  - `--version <version>`: eine bestimmte Version herunterladen.
  - `--tag <tag>`: eine getaggte Version herunterladen (Standard: `latest`).
  - `-o, --output <path>`: Ausgabedatei oder -verzeichnis.
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
- Mit `--package` werden erwartete Metadaten aus ClawHub aufgelöst und die
  lokale Datei mit den veröffentlichten Artefaktmetadaten verglichen.
- Mit direkten Digest-Flags wird ohne Netzwerkanfrage verifiziert.
- Flags:
  - `--package <name>`: Paketname zum Auflösen der erwarteten Artefaktmetadaten.
  - `--version <version>` oder `--tag <tag>`: erwartete Paketversion.
  - `--sha256 <hex>`: erwarteter ClawHub SHA-256.
  - `--npm-integrity <sri>`: erwartete npm-Integrität.
  - `--npm-shasum <sha1>`: erwarteter npm-shasum.
  - `--json`: maschinenlesbare Ausgabe.

Beispiele:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package validate <source>`

- Führt den in der ClawHub CLI gebündelten Plugin Inspector gegen einen lokalen Plugin-Paketordner
  aus.
- Standardmäßig wird eine Offline-/statische Validierung durchgeführt, ohne einen lokalen
  OpenClaw-Checkout zu finden oder zu importieren.
- Harte Kompatibilitätsfehler beenden mit einem Exitcode ungleich null. Nur warnende Findings werden ausgegeben, beenden aber
  mit null.
- Flags:
  - `--out <dir>`: Plugin-Inspector-Berichte in dieses Verzeichnis schreiben.
  - `--openclaw <path>`: gegen einen expliziten lokalen OpenClaw-Checkout prüfen.
  - `--runtime`: Laufzeiterfassung aktivieren; importiert Plugin-Code.
  - `--allow-execute`: Laufzeiterfassung in einem isolierten Workspace erlauben.
  - `--no-mock-sdk`: gemocktes OpenClaw SDK während der Laufzeiterfassung deaktivieren.
  - `--json`: maschinenlesbare Ausgabe.

Beispiel:

```bash
clawhub package validate ./example-plugin
```

Wenn die Validierung ein Finding zu Paket, Manifest, SDK-Import oder Artefakt meldet, siehe
[Plugin-Validierungsfixes](/clawhub/plugin-validation-fixes), und führen Sie den Befehl anschließend erneut aus.

### `package delete <name>`

- Ohne `--version` wird ein Paket und alle Releases vorläufig gelöscht.
- `--version <version>` löscht über eine fail-closed,
  versionsspezifische Route dauerhaft ein eigenes Release, das nicht das neueste ist.
  Gelöschte Versionen können nicht wiederhergestellt oder erneut veröffentlicht werden. Veröffentlichen Sie einen Ersatz, bevor Sie die
  aktuelle neueste Version löschen. Dieser nur versionsbezogene Ablauf erfordert den Paket-Owner oder einen
  Admin des Org-Publishers; Plattformmitarbeitende umgehen die Paket-Ownership nicht.
- Das vorläufige Löschen eines gesamten Pakets erfordert den Paket-Owner, einen Owner/Admin des Org-Publishers, einen
  Plattformmoderator oder Plattformadmin.
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

- Stellt ein vorläufig gelöschtes Paket und dessen Releases wieder her.
- Es gibt kein Wiederherstellen von Versionen; dauerhaft gelöschte Versionen können nicht wiederhergestellt werden.
- Erfordert den Paket-Owner, einen Owner/Admin des Org-Publishers, einen Plattformmoderator
  oder Plattformadmin.
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
  Publisher, außer die Aktion wird von einem Plattformadmin ausgeführt.
- Scoped-Paketnamen müssen an den passenden Scope-Owner übertragen werden.
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
- Meldungen gelten auf Paketebene, können optional an eine Version gebunden sein und werden
  für Moderatoren zur Prüfung sichtbar.
- Meldungen blenden Pakete nicht automatisch aus und blockieren Downloads nicht von selbst.
- Flags:
  - `--version <version>`: optionale Paketversion, die an die Meldung angehängt wird.
  - `--reason <text>`: erforderlicher Meldegrund.
  - `--json`: maschinenlesbare Ausgabe.

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
  - `--json`: maschinenlesbare Ausgabe.

Beispiel:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- Prüft, ob ein Paket für die künftige Nutzung durch OpenClaw bereit ist.
- Ruft `GET /api/v1/packages/{name}/readiness` auf.
- Meldet Blocker für offiziellen Status, ClawPack-Verfügbarkeit, Artefakt-Digest,
  Quellenherkunft, OpenClaw-Kompatibilität, Host-Ziele, Umgebungsmetadaten
  und Scanstatus.
- Flags:
  - `--json`: maschinenlesbare Ausgabe.

Beispiel:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- Zeigt den betreiberorientierten Migrationsstatus für ein Paket, das ein
  gebündeltes OpenClaw Plugin ersetzen kann.
- Ruft denselben berechneten Readiness-Endpunkt wie `package readiness` auf, gibt aber
  migrationsfokussierten Status, neueste Version, Status als offizielles Paket, Prüfungen und
  Blocker aus.
- Flags:
  - `--json`: maschinenlesbare Ausgabe.

Beispiel:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- Erstellt einen Org-Publisher, dessen Owner der authentifizierte Benutzer ist.
- Das Handle wird in Kleinbuchstaben normalisiert und kann mit oder ohne `@` übergeben werden.
- Neu erstellte Org-Publisher sind standardmäßig nicht vertrauenswürdig/offiziell.
- Schlägt fehl, wenn das Handle bereits von einem vorhandenen Publisher, Benutzer oder reservierten Route verwendet wird.

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- Veröffentlicht ein Code-Plugin oder Bundle-Plugin über `POST /api/v1/packages`.
- `<source>` akzeptiert:
  - Lokaler Ordnerpfad: `./my-plugin`
  - Lokaler ClawPack-npm-Pack-Tarball: `./my-plugin-1.2.3.tgz`
  - GitHub-Repository: `owner/repo` oder `owner/repo@ref`
  - GitHub-URL: `https://github.com/owner/repo`
- Metadaten werden automatisch aus `package.json`, `openclaw.plugin.json` und
  echten OpenClaw-Bundle-Markern wie `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json` und `.cursor-plugin/plugin.json` erkannt.
- `.tgz`-Quellen werden als ClawPack behandelt. Die CLI lädt die exakten npm-Pack-
  Bytes hoch und verwendet die extrahierten `package/`-Inhalte nur für Validierung
  und Metadaten-Vorbefüllung.
- Code-Plugin-Ordner werden vor dem Upload in einen ClawPack-npm-Tarball gepackt, damit
  OpenClaw-Installationen das exakte Artefakt verifizieren können. Bundle-Plugin-Ordner verwenden weiterhin
  den Veröffentlichungsweg für extrahierte Dateien.
- Für GitHub-Quellen wird die Quellenzuordnung automatisch aus Repository, aufgelöstem Commit, Ref und Unterpfad befüllt.
- Für lokale Ordner wird die Quellenzuordnung automatisch aus lokalem Git erkannt, wenn der Origin-Remote auf GitHub zeigt.
- Externe Code-Plugins müssen `openclaw.compat.pluginApi` und
  `openclaw.build.openclawVersion` explizit deklarieren.
  `package.json.version` auf oberster Ebene wird nicht als Fallback für die Veröffentlichungsvalidierung verwendet.
- `--dry-run` zeigt die aufgelöste Veröffentlichungs-Payload ohne Upload an.
- `--json` gibt maschinenlesbare Ausgabe für CI aus.
- `--owner <handle>` veröffentlicht unter einem Benutzer- oder Organisations-Publisher-Handle, wenn der Akteur Publisher-Zugriff hat.
- Scoped-Paketnamen müssen zum ausgewählten Owner passen. Siehe `docs/publishing.md`.
- Vorhandene Flags (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) funktionieren weiterhin als Overrides.
- Private GitHub-Repositorys erfordern `GITHUB_TOKEN`.

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### Empfohlener lokaler Ablauf

Verwenden Sie zuerst `--dry-run`, damit Sie die aufgelösten Paketmetadaten und
die Quellenzuordnung bestätigen können, bevor Sie ein echtes Release erstellen:

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

Pflichtfelder:

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
- Wenn Sie ein älteres `clawhub`-CLI-Release verwenden, aktualisieren Sie vor der Veröffentlichung, damit
  die lokalen Preflight-Prüfungen vor dem Upload ausgeführt werden.
- Wenn die Validierung einen Abhilfecode meldet, siehe
  [Korrekturen für die Plugin-Validierung](/clawhub/plugin-validation-fixes).

#### GitHub Actions

ClawHub liefert außerdem einen offiziellen wiederverwendbaren Workflow unter
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/a89bfaf61d1bb5e0bfa7a92cf35b76c7e404e1ca/.github/workflows/package-publish.yml)
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
- Übergeben Sie bei Monorepos `source_path`, damit der Workflow den Plugin-
  Paketordner veröffentlicht, zum Beispiel `source_path: extensions/codex`.
- Pinnen Sie den wiederverwendbaren Workflow auf einen stabilen Tag oder vollständigen Commit-SHA. Führen Sie Release-Veröffentlichungen nicht von `@main` aus.
- `pull_request` sollte `dry_run: true` verwenden, damit CI nicht verschmutzt wird.
- Echte Veröffentlichungen sollten auf vertrauenswürdige Ereignisse wie `workflow_dispatch` oder Tag-Pushes beschränkt werden.
- Vertrauenswürdiges Veröffentlichen ohne Secret funktioniert nur bei `workflow_dispatch`; Tag-Pushes benötigen weiterhin `clawhub_token`.
- Halten Sie `clawhub_token` für die erste Veröffentlichung, nicht vertrauenswürdige Pakete oder Break-Glass-Veröffentlichungen verfügbar.
- Der Workflow lädt das JSON-Ergebnis als Artefakt hoch und stellt es als Workflow-Ausgaben bereit.

### `package trusted-publisher get <name>`

- Zeigt die GitHub-Actions-Konfiguration für vertrauenswürdige Publisher für ein Paket an.
- Verwenden Sie dies nach dem Setzen der Konfiguration, um Repository, Workflow-Dateinamen
  und optionalen Environment-Pin zu bestätigen.
- Flags:
  - `--json`: maschinenlesbare Ausgabe.

Beispiel:

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- Hängt die GitHub-Actions-Konfiguration für vertrauenswürdige Publisher an ein vorhandenes
  Paket an oder ersetzt sie.
- Das Paket muss zuerst durch normales manuelles oder token-authentifiziertes
  `clawhub package publish` erstellt werden.
- Nachdem die Konfiguration gesetzt ist, können zukünftige unterstützte GitHub-Actions-Veröffentlichungen
  OIDC/vertrauenswürdiges Veröffentlichen ohne langlebiges ClawHub-Token verwenden.
- `--repository <repo>` muss `owner/repo` sein.
- `--workflow-filename <file>` muss mit dem Workflow-Dateinamen in
  `.github/workflows/` übereinstimmen.
- `--environment <name>` ist optional. Wenn konfiguriert, muss die GitHub-Actions-
  Environment im OIDC-Claim exakt übereinstimmen.
- ClawHub verifiziert das konfigurierte GitHub-Repository, wenn dieser Befehl ausgeführt wird.
  Öffentliche Repositorys können über öffentliche GitHub-Metadaten verifiziert werden. Private
  Repositorys erfordern, dass ClawHub GitHub-Zugriff auf dieses Repository hat, zum
  Beispiel über eine zukünftige ClawHub-GitHub-App-Installation oder eine andere autorisierte
  GitHub-Integration.
- Flags:
  - `--repository <repo>`: GitHub-Repository, zum Beispiel `openclaw/example-plugin`.
  - `--workflow-filename <file>`: Workflow-Dateiname, zum Beispiel `package-publish.yml`.
  - `--environment <name>`: optionale GitHub-Actions-Environment mit exakter Übereinstimmung.
  - `--json`: maschinenlesbare Ausgabe.

Beispiel:

```bash
clawhub package trusted-publisher set @openclaw/example-plugin \
  --repository openclaw/example-plugin \
  --workflow-filename package-publish.yml \
  --environment release
```

### `package trusted-publisher delete <name>`

- Entfernt die Konfiguration für vertrauenswürdige Publisher von einem Paket.
- Verwenden Sie dies als Rollback, wenn Workflow, Repository oder Environment-Pin
  deaktiviert oder neu erstellt werden müssen.
- Zukünftige echte Veröffentlichungen müssen normales authentifiziertes Veröffentlichen verwenden, bis die Konfiguration
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
- Reporting erfolgt nach Best-Effort. Installationsbefehle schlagen nicht fehl, wenn Telemetrie
  nicht verfügbar ist.
- Details: `docs/telemetry.md`.
