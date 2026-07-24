---
read_when:
    - ClawHub-CLI verwenden
    - Installation, Aktualisierung oder Veröffentlichung debuggen
summary: 'CLI-Referenz: Befehle, Flags, Konfiguration und Lockfile-Verhalten.'
x-i18n:
    generated_at: "2026-07-24T04:26:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 64440863a3b9f905c3e00cb84895ea5e2640ce41da02c82532e27ae91259dbca
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

CLI-Paket: `clawhub`, Binärdatei: `clawhub`.

Installieren Sie es global mit npm oder pnpm:

```bash
npm i -g clawhub
# oder
pnpm add -g clawhub
```

Überprüfen Sie es anschließend:

```bash
clawhub --help
clawhub login
clawhub whoami
```

## Globale Flags

- `--workdir <dir>`: Arbeitsverzeichnis (Standard: cwd; fällt auf den Clawdbot-Workspace zurück, falls konfiguriert)
- `--dir <dir>`: Installationsverzeichnis unter workdir (Standard: `skills`)
- `--site <url>`: Basis-URL für die Browser-Anmeldung (Standard: `https://clawhub.ai`)
- `--registry <url>`: API-Basis-URL (Standard: automatisch ermittelt, andernfalls `https://clawhub.ai`)
- `--no-input`: Eingabeaufforderungen deaktivieren

Entsprechende Umgebungsvariablen:

- `CLAWHUB_SITE` (veraltet: `CLAWDHUB_SITE`)
- `CLAWHUB_REGISTRY` (veraltet: `CLAWDHUB_REGISTRY`)
- `CLAWHUB_WORKDIR` (veraltet: `CLAWDHUB_WORKDIR`)

### HTTP-Proxy

Die CLI berücksichtigt standardmäßige HTTP-Proxy-Umgebungsvariablen für Systeme hinter
Unternehmens-Proxys oder in eingeschränkten Netzwerken:

- `HTTPS_PROXY` / `https_proxy`
- `HTTP_PROXY` / `http_proxy`
- `NO_PROXY` / `no_proxy`

Wenn eine dieser Variablen gesetzt ist, leitet die CLI ausgehende Anfragen über
den angegebenen Proxy. `HTTPS_PROXY` wird für HTTPS-Anfragen verwendet, `HTTP_PROXY`
für unverschlüsseltes HTTP. `NO_PROXY` / `no_proxy` wird berücksichtigt, um den Proxy für
bestimmte Hosts oder Domains zu umgehen.

Dies ist auf Systemen erforderlich, auf denen direkte ausgehende Verbindungen blockiert sind
(z. B. Docker-Container, Hetzner-VPS mit ausschließlich über Proxy verfügbarem Internet, Unternehmens-
Firewalls).

Beispiel:

```bash
export HTTPS_PROXY=http://proxy.example.com:3128
export NO_PROXY=localhost,127.0.0.1
clawhub search "meine Suchanfrage"
```

Wenn keine Proxy-Variable gesetzt ist, bleibt das Verhalten unverändert (direkte Verbindungen).

## Konfigurationsdatei

Speichert Ihr API-Token und die zwischengespeicherte Registry-URL.

- macOS: `~/Library/Application Support/clawhub/config.json`
- Linux/XDG: `$XDG_CONFIG_HOME/clawhub/config.json` oder `~/.config/clawhub/config.json`
- Windows: `%APPDATA%\\clawhub\\config.json`
- Veralteter Rückfallpfad: Wenn `clawhub/config.json` noch nicht existiert, aber `clawdhub/config.json` vorhanden ist, verwendet die CLI den veralteten Pfad erneut
- Überschreibung: `CLAWHUB_CONFIG_PATH` (veraltet: `CLAWDHUB_CONFIG_PATH`)

## Befehle

### `login` / `auth login`

- Standard: Öffnet den Browser unter `<site>/cli/auth` und schließt den Vorgang über einen Loopback-Callback ab.
- Headless: `clawhub login --token clh_...`
- Interaktiv auf Remote-/Headless-Systemen: `clawhub login --device` gibt einen Code aus und wartet, während Sie ihn unter `<site>/cli/device` autorisieren.

### `whoami`

- Überprüft das gespeicherte Token über `/api/v1/whoami`.

### `token`

- Gibt das gespeicherte API-Token auf stdout aus.
- Nützlich, um ein lokales Anmelde-Token über eine Pipe an Befehle zum Einrichten von CI-Secrets zu übergeben.

### `star <skill>` / `unstar <skill>`

- Fügt Ihren Hervorhebungen einen Skill hinzu oder entfernt ihn daraus.
- Ruft `POST /api/v1/stars/<slug>` und `DELETE /api/v1/stars/<slug>` auf.
- `--yes` überspringt die Bestätigung.

### `search <query...>`

- Ruft `/api/v1/search?q=...` auf.
- Die Ausgabe enthält den Skill-Slug, das Handle des Eigentümers, den Anzeigenamen und die Relevanzbewertung.
- Die Suche bevorzugt exakte Übereinstimmungen mit Slug-/Namenstokens vor der Download-Popularität. Ein eigenständiges Slug-Token wie `map` stimmt stärker mit `personal-map` überein als mit der Zeichenfolge innerhalb von `amap`.
- Die Popularität ist nur ein kleiner vorheriger Rankingfaktor und keine Garantie für die oberste Platzierung.
- Wenn ein Skill erscheinen sollte, aber nicht erscheint, führen Sie angemeldet `clawhub inspect @owner/slug` aus, um für Eigentümer sichtbare Moderationsdiagnosen zu prüfen, bevor Sie Metadaten umbenennen.

### `explore`

- Listet die neuesten Skills über `/api/v1/skills?limit=...&sort=createdAt` auf (absteigend nach `createdAt` sortiert).
- Flags:
  - `--limit <n>` (1-200, Standard: 25)
  - `--sort newest|updated|rating|downloads|trending` (Standard: neueste). Veraltete Aliasse für die Installationssortierung funktionieren aus Kompatibilitätsgründen weiterhin.
  - `--json` (maschinenlesbare Ausgabe)
- Ausgabe: `<slug>  v<version>  <age>  <summary>` (Zusammenfassung auf 50 Zeichen gekürzt).

### `inspect @owner/slug`

- Ruft Skill-Metadaten und Versionsdateien ab, ohne sie zu installieren.
- `--version <version>`: Eine bestimmte Version untersuchen (Standard: neueste).
- `--tag <tag>`: Eine mit einem Tag versehene Version untersuchen (z. B. `latest`).
- `--versions`: Versionsverlauf auflisten (erste Seite).
- `--limit <n>`: Maximale Anzahl aufzulistender Versionen (1-200).
- `--files`: Dateien für die ausgewählte Version auflisten.
- `--file <path>`: Unverarbeitete Dateibytes abrufen (Limit: 10MB).
- `--json`: Maschinenlesbare Ausgabe; `--file` enthält die exakten Bytes als Base64 sowie UTF-8-Text, sofern verfügbar.

### `install @owner/slug`

- Ermittelt die neueste Version für den angegebenen Eigentümer und Skill.
- Lädt das ZIP-Archiv über `/api/v1/download` herunter.
- Extrahiert es nach `<workdir>/<dir>/<slug>`.
- Verweigert das Überschreiben angehefteter Skills; führen Sie zuerst `clawhub unpin <skill>` aus.
- Schreibt:
  - `<workdir>/.clawhub/lock.json` (veraltet: `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (veraltet: `.clawdhub`)

### `uninstall <skill>`

- Entfernt `<workdir>/<dir>/<slug>` und löscht den Eintrag in der Sperrdatei.
- Sendet im angemeldeten Zustand nach bestem Bemühen Telemetriedaten, damit aktuelle Installationszahlen
  deaktiviert werden können.
- Interaktiv: Fragt nach einer Bestätigung.
- Nicht interaktiv (`--no-input`): Erfordert `--yes`.

### `list`

- Liest `<workdir>/.clawhub/lock.json` (veraltet: `.clawdhub`).
- Zeigt `pinned` neben Skills an, die mit `clawhub pin` eingefroren wurden, einschließlich des optionalen Grundes.

### `pin <skill>`

- Markiert einen installierten Skill in der Sperrdatei als angeheftet.
- `--reason <text>` zeichnet auf, warum der Skill eingefroren ist.
- Angeheftete Skills werden von `update --all` übersprungen und von einem direkten `update <skill>` abgelehnt.
- Angeheftete Skills lehnen außerdem `install --force` ab, damit die lokalen Bytes nicht versehentlich ersetzt werden können.

### `unpin <skill>`

- Entfernt die Anheftung aus der Sperrdatei eines installierten Skills, sodass zukünftige Aktualisierungen ihn ändern können.

### `update [@owner/slug]` / `update --all`

- Berechnet den Fingerabdruck aus lokalen Dateien.
- Wenn der Fingerabdruck mit einer bekannten Version übereinstimmt: keine Eingabeaufforderung.
- Wenn der Fingerabdruck nicht übereinstimmt:
  - wird der Vorgang standardmäßig verweigert
  - wird mit `--force` überschrieben (oder nachgefragt, falls interaktiv)
- Angeheftete Skills werden von `--force` nie aktualisiert.
- `update <skill>` schlägt bei angehefteten Skills sofort fehl und weist Sie an, zuerst `clawhub unpin <skill>` auszuführen.
- `update --all` überspringt angeheftete Slugs und gibt eine Zusammenfassung darüber aus, was eingefroren blieb.

### `skill publish <path>`

- Vergleicht den Fingerabdruck des lokalen Bundles mit ClawHub und wird erfolgreich beendet, wenn
  der Inhalt bereits veröffentlicht ist.
- Neue Skills verwenden standardmäßig `1.0.0`; geänderte Skills verwenden standardmäßig die nächste Patch-
  Version.
- `--version <version>` wählt ausdrücklich eine Version aus und veröffentlicht selbst dann, wenn der
  Inhalt mit einer vorhandenen Version übereinstimmt.
- `--dry-run` ermittelt die Veröffentlichung, ohne etwas hochzuladen; `--json` gibt ein
  maschinenlesbares Ergebnis aus.
- `--owner <handle>` veröffentlicht unter dem Publisher-Handle einer Organisation/eines Benutzers, wenn der
  Akteur Publisher-Zugriff besitzt.
- `--migrate-owner` verschiebt einen vorhandenen Skill nach `--owner`, während eine neue
  Version veröffentlicht wird. Erfordert Administrator-/Eigentümerzugriff auf beide Publisher.
- Das Verhalten für Eigentümer und Reviews wird in `docs/publishing.md` erläutert.
- Die Veröffentlichung eines Skills bedeutet, dass er auf ClawHub unter `MIT-0` freigegeben wird.
- Veröffentlichte Skills dürfen ohne Namensnennung kostenlos verwendet, geändert und weitergegeben werden.
- ClawHub unterstützt keine kostenpflichtigen Skills oder Preise pro Skill.
- Veralteter Alias: `publish <path>`.

```bash
clawhub skill publish ./my-skill --dry-run
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 2.0.0
```

#### GitHub Actions

Der wiederverwendbare
[`skill-publish.yml`](https://github.com/openclaw/clawhub/blob/main/.github/workflows/skill-publish.yml)-Workflow
von ClawHub ruft `skill publish` für einen `skill_path` oder für jeden unmittelbaren Skill-
Ordner unter `root` (Standard: `skills`) auf. Er überspringt unveränderte Skills und verwendet
dasselbe automatische Verhalten für Patch-Versionen.

Setzen Sie `dry_run: true`, um ohne Token eine Vorschau anzuzeigen. Tatsächliche Veröffentlichungen erfordern das
Secret `clawhub_token`.

### `sync`

- Durchsucht das aktuelle workdir, das konfigurierte Skills-Verzeichnis und alle
  `--root <dir>`-Ordner nach lokalen Skill-Ordnern, die `SKILL.md` oder
  `skill.md` enthalten.
- Vergleicht den Fingerabdruck jedes lokalen Skills mit ClawHub und veröffentlicht nur neue oder
  geänderte Skills.
- Neue Skills werden standardmäßig als `1.0.0` veröffentlicht; geänderte Skills werden standardmäßig mit der nächsten Patch-Version
  veröffentlicht. Verwenden Sie `--bump minor|major` für Aktualisierungsstapel, die um einen
  größeren SemVer-Schritt erhöht werden sollen.
- `--dry-run` zeigt den Veröffentlichungsplan an, ohne etwas hochzuladen; `--json` gibt einen
  maschinenlesbaren Plan aus.
- `--all` veröffentlicht jeden neuen oder geänderten Skill ohne Nachfrage. Ohne
  `--all` können Sie in interaktiven Terminals die zu veröffentlichenden Skills auswählen.
- `--owner <handle>` veröffentlicht unter dem Publisher-Handle einer Organisation/eines Benutzers, wenn der
  Akteur Publisher-Zugriff besitzt.
- `sync` dient ausschließlich der einseitigen Veröffentlichung. Es installiert, aktualisiert oder lädt nichts herunter und
  meldet keine Installations-/Download-Telemetrie.

```bash
clawhub sync --all --dry-run
clawhub sync --all
clawhub sync --root ./skills --owner openclaw --bump minor
```

### `scan --slug <slug>`

- Erfordert `clawhub login`.
- Führt ClawHub ClawScan über `POST /api/v1/skills/-/scan` aus und fragt anschließend den Status ab, bis der Scan einen Endzustand erreicht.
- Scans sind asynchron und können einige Zeit bis zum Abschluss benötigen. Während sie sich in der Warteschlange befinden, zeigt der Terminal-Spinner die aktuelle priorisierte Scanposition und die Anzahl der davor liegenden Scans an.
- Veröffentlichte Scans erfordern Eigentümerschaft oder Publisher-Verwaltungszugriff. Moderatoren/Administratoren können dasselbe Backend über `clawhub-admin` verwenden.
- `--update` ist nur zusammen mit `--slug` gültig; erfolgreiche Ergebnisse veröffentlichter Scans werden damit in die ausgewählte Version zurückgeschrieben.
- `--output <file.zip>` lädt das vollständige Berichtsarchiv mit `manifest.json`, `clawscan.json`, `skillspector.json`, `static-analysis.json`, `virustotal.json` und `README.md` herunter.
- `--json` gibt die vollständige Statusabfrage-Antwort für die Automatisierung aus.
- Scans lokaler Pfade werden nicht mehr unterstützt. Laden Sie eine neue Version hoch und verwenden Sie anschließend `scan download`, um die gespeicherten Scanergebnisse für diese eingereichte Version abzurufen.

```bash
clawhub scan --slug gifgrep
clawhub scan --slug gifgrep --version 1.2.3
clawhub scan --slug gifgrep --update --output report.zip
```

### `scan download <name>`

- Erfordert `clawhub login`.
- Lädt die gespeicherte ZIP-Datei des Scanberichts für eine eingereichte Skill- oder Plugin-Version herunter, einschließlich Versionen, die durch ClawHub-Sicherheitsprüfungen blockiert oder ausgeblendet wurden.
- Skill-Downloads verwenden den Skill-Slug und nutzen standardmäßig `--kind skill`.
- Plugin-Downloads verwenden den Paketnamen und erfordern `--kind plugin`.
- `--version` ist erforderlich, damit Autoren genau die eingereichte Version prüfen, die ClawHub blockiert hat.
- `--output <file.zip>` legt den Zielpfad fest.

```bash
clawhub scan download gifgrep --version 1.2.3
clawhub scan download @scope/demo --version 2.0.0 --kind plugin --output report.zip
```

#### GitHub Actions

ClawHub stellt einen offiziellen wiederverwendbaren Workflow unter
[`/.github/workflows/skill-publish.yml`](https://github.com/openclaw/clawhub/blob/306035cad779533e212a1fafd4c9938ea4c0b70e/.github/workflows/skill-publish.yml)
für Skill-Repositories und Katalog-Repositories bereit.

Typische Katalogkonfiguration:

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

- `root` verwendet für Katalog-Repositories standardmäßig `skills`.
- Übergeben Sie `skill_path: skills/review-helper`, um einen einzelnen Skill-Ordner zu verarbeiten.
- `owner` entspricht dem CLI-Flag `--owner`; lassen Sie es weg, um als authentifizierter Benutzer zu veröffentlichen.
- Die V1-Skill-Veröffentlichung verwendet `clawhub_token`; die vertrauenswürdige Veröffentlichung mit GitHub OIDC ist derzeit nur für Pakete verfügbar.

### `delete <skill>`

- Ohne `--version` wird ein Skill vorläufig gelöscht (Eigentümer, Moderator oder Administrator).
- Ruft `DELETE /api/v1/skills/{slug}` auf.
- Vom Eigentümer veranlasste vorläufige Löschungen reservieren den Slug für 30 Tage; der Befehl gibt den Ablaufzeitpunkt aus.
- `--version <version>` zieht eine eigene, nicht neueste Version über eine ausfallsicher geschlossene,
  versionsspezifische Route zurück. Die Versionsnummer bleibt reserviert und kann nicht mit
  anderen Inhalten erneut veröffentlicht werden. Veröffentlichen Sie einen Ersatz, bevor Sie die aktuell neueste Version löschen. Plattformmitarbeiter
  umgehen bei diesem ausschließlich versionsbezogenen Ablauf die Eigentümerschaft nicht.
- `--reason <text>` erfasst eine Moderationsnotiz zur vorläufigen Löschung des gesamten Skills und im Auditprotokoll.
- `--note <text>` ist ein Alias für `--reason`.
- `--yes` überspringt die Bestätigung.

### `undelete <skill>`

- Stellt einen ausgeblendeten Skill wieder her (Eigentümer, Moderator oder Administrator).
- Ruft `POST /api/v1/skills/{slug}/undelete` auf.
- `--version <version>` stellt nur genau das beibehaltene Artefakt wieder her, das zuvor von demselben
  Eigentümerakteur zurückgezogen wurde. Die wiederhergestellte Version wird dadurch weder zur neuesten Version noch werden entfernte Tags neu erstellt.
- Die Versionswiederherstellung ruft `POST /api/v1/skills/{slug}/versions/{version}/restore` auf.
- `--reason <text>` erfasst eine Moderationsnotiz zum Skill und im Auditprotokoll.
- `--note <text>` ist ein Alias für `--reason`.
- `--yes` überspringt die Bestätigung.

### `hide <skill>`

- Blendet einen Skill aus (Eigentümer, Moderator oder Administrator).
- Alias für `delete`.

### `unhide <skill>`

- Blendet einen Skill wieder ein (Eigentümer, Moderator oder Administrator).
- Alias für `undelete`.

### `skill rename <skill> <new-name>`

- Benennt einen eigenen Skill um und behält den vorherigen Slug als Weiterleitungsalias bei.
- Ruft `POST /api/v1/skills/{slug}/rename` auf.
- `--yes` überspringt die Bestätigung.

### `skill merge <source> <target>`

- Führt einen eigenen Skill mit einem anderen eigenen Skill zusammen.
- Der Quell-Slug wird nicht mehr öffentlich aufgeführt und wird zu einem Weiterleitungsalias auf das Ziel.
- Ruft `POST /api/v1/skills/{sourceSlug}/merge` auf.
- `--yes` überspringt die Bestätigung.

### `transfer`

- Workflow zur Übertragung der Eigentümerschaft.
- Übertragungen an Benutzer-Handles erstellen eine ausstehende Anfrage, die der Empfänger annimmt.
- Übertragungen an Organisations-/Publisher-Handles werden nur dann sofort angewendet, wenn der Akteur
  Administratorzugriff sowohl auf den aktuellen Eigentümer als auch auf den Ziel-Publisher hat.
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

- Durchsucht den einheitlichen Paketkatalog über `GET /api/v1/packages` und `GET /api/v1/packages/search` oder ermöglicht dessen Durchsicht.
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
  - `--limit <n>` (1-100, Standardwert: 25)
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

- Ruft Paketmetadaten ab, ohne das Paket zu installieren.
- Verwenden Sie dies für Plugin-Metadaten, Kompatibilität, Verifizierung, Quelle sowie die Prüfung von Versionen und Dateien.
- `--version <version>`: Prüft eine bestimmte Version (Standardwert: neueste).
- `--tag <tag>`: Prüft eine mit einem Tag versehene Version (z. B. `latest`).
- `--versions`: Listet den Versionsverlauf auf (erste Seite).
- `--limit <n>`: Maximale Anzahl aufzulistender Versionen (1-100).
- `--files`: Listet die Dateien der ausgewählten Version auf.
- `--file <path>`: Ruft eine begrenzte UTF-8-Textvorschau ab (Limit: 200KB).
- `--json`: Maschinenlesbare Ausgabe.

### `package download <name>`

- Löst eine Paketversion über
  `GET /api/v1/packages/{name}/versions/{version}/artifact` auf.
- Lädt das Artefakt von `downloadUrl` des Resolvers herunter.
- Überprüft für alle Artefakte den ClawHub-SHA-256.
- Bei ClawPack-npm-pack-Artefakten werden außerdem die npm-Integrität gemäß `sha512`,
  die npm-Prüfsumme und der Name/die Version von `package.json` im Tarball überprüft.
- Ältere ZIP-Versionen werden über die veraltete ZIP-Route heruntergeladen.
- Flags:
  - `--version <version>`: Lädt eine bestimmte Version herunter.
  - `--tag <tag>`: Lädt eine mit einem Tag versehene Version herunter (Standardwert: `latest`).
  - `-o, --output <path>`: Ausgabedatei oder -verzeichnis.
  - `--force`: Überschreibt eine vorhandene Ausgabedatei.
  - `--json`: Maschinenlesbare Ausgabe.

Beispiele:

```bash
clawhub package download @openclaw/example-plugin --tag latest
clawhub package download @openclaw/example-plugin --version 1.2.3 -o artifacts/
```

### `package verify <file>`

- Berechnet den ClawHub-SHA-256, die npm-Integrität gemäß `sha512` und die npm-Prüfsumme für ein lokales
  Artefakt.
- Mit `--package` werden die erwarteten Metadaten von ClawHub aufgelöst und die
  lokale Datei mit den veröffentlichten Artefaktmetadaten verglichen.
- Mit direkten Digest-Flags erfolgt die Überprüfung ohne Netzwerksuche.
- Flags:
  - `--package <name>`: Paketname zum Auflösen der erwarteten Artefaktmetadaten.
  - `--version <version>` oder `--tag <tag>`: Erwartete Paketversion.
  - `--sha256 <hex>`: Erwarteter ClawHub-SHA-256.
  - `--npm-integrity <sri>`: Erwartete npm-Integrität.
  - `--npm-shasum <sha1>`: Erwartete npm-Prüfsumme.
  - `--json`: Maschinenlesbare Ausgabe.

Beispiele:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package validate <source>`

- Führt den in der ClawHub-CLI enthaltenen Plugin Inspector für einen lokalen Plugin-Paketordner
  aus.
- Verwendet standardmäßig eine Offline-/statische Validierung, ohne einen lokalen
  OpenClaw-Checkout zu suchen oder zu importieren.
- Schwerwiegende Kompatibilitätsfehler führen zu einem Beendigungscode ungleich null. Ergebnisse, die nur Warnungen enthalten, werden ausgegeben, führen jedoch
  zu einem Beendigungscode von null.
- Flags:
  - `--out <dir>`: Schreibt Plugin-Inspector-Berichte in dieses Verzeichnis.
  - `--openclaw <path>`: Prüft anhand eines explizit angegebenen lokalen OpenClaw-Checkouts.
  - `--runtime`: Aktiviert die Laufzeiterfassung; importiert Plugin-Code.
  - `--allow-execute`: Erlaubt die Laufzeiterfassung in einem isolierten Arbeitsbereich.
  - `--no-mock-sdk`: Deaktiviert das simulierte OpenClaw SDK während der Laufzeiterfassung.
  - `--json`: Maschinenlesbare Ausgabe.

Beispiel:

```bash
clawhub package validate ./example-plugin
```

Wenn die Validierung einen Befund zum Paket, Manifest, SDK-Import oder Artefakt meldet, lesen Sie
[Behebung von Plugin-Validierungsfehlern](/de/clawhub/plugin-validation-fixes) und führen Sie den Befehl anschließend erneut aus.

### `package delete <name>`

- Ohne `--version` werden ein Paket und alle Releases vorläufig gelöscht.
- `--version <version>` zieht ein eigenes, nicht neuestes Release über eine ausfallsicher geschlossene,
  versionsspezifische Route zurück. Die Versionsnummer bleibt reserviert und kann nicht mit
  anderen Inhalten erneut veröffentlicht werden. Veröffentlichen Sie einen Ersatz, bevor Sie das aktuell neueste Release löschen. Dieser
  ausschließlich versionsbezogene Ablauf erfordert den Paketeigentümer oder einen Administrator des Organisations-Publishers; Plattformmitarbeiter
  umgehen die Paketeigentümerschaft nicht.
- Die vorläufige Löschung des gesamten Pakets erfordert den Paketeigentümer, einen Eigentümer/Administrator des Organisations-Publishers, einen Plattformmoderator
  oder einen Plattformadministrator.
- Flags:
  - `--version <version>`: Zieht eine nicht neueste Version zurück.
  - `--yes`: Überspringt die Bestätigung.
  - `--json`: Maschinenlesbare Ausgabe.

Beispiel:

```bash
clawhub package delete @openclaw/example-plugin --yes
clawhub package delete @openclaw/example-plugin --version 1.2.3 --yes
```

### `package undelete <name>`

- Stellt ein vorläufig gelöschtes Paket und dessen Releases wieder her.
- Erfordert den Paketeigentümer, einen Eigentümer/Administrator des Organisations-Publishers, einen Plattformmoderator
  oder einen Plattformadministrator.
- Ruft `POST /api/v1/packages/{name}/undelete` auf.
- `--version <version>` stellt nur genau das beibehaltene Release wieder her, das zuvor von demselben
  Eigentümerakteur zurückgezogen wurde. Das Release wird dadurch weder zum neuesten Release noch werden entfernte Paket-Tags/Dist-Tags neu erstellt.
- Die Versionswiederherstellung ruft `POST /api/v1/packages/{name}/versions/{version}/restore` auf.
- Flags:
  - `--version <version>`: Stellt ein vom Eigentümer zurückgezogenes Release wieder her.
  - `--yes`: Überspringt die Bestätigung.
  - `--json`: Maschinenlesbare Ausgabe.

Beispiel:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- Überträgt ein Paket an einen anderen Herausgeber.
- Erfordert Administratorzugriff sowohl auf den aktuellen Paketeigentümer als auch auf den Zielherausgeber,
  sofern die Übertragung nicht durch einen Plattformadministrator erfolgt.
- Paketnamen mit Gültigkeitsbereich müssen an den Eigentümer des entsprechenden Gültigkeitsbereichs übertragen werden.
- Ruft `POST /api/v1/packages/{name}/transfer` auf.
- Flags:
  - `--to <owner>`: Handle des Zielherausgebers.
  - `--reason <text>`: optionaler Audit-Grund.
  - `--json`: maschinenlesbare Ausgabe.

Beispiel:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- Authentifizierter Befehl zum Melden eines Pakets an Moderatoren.
- Ruft `POST /api/v1/packages/{name}/report` auf.
- Meldungen gelten auf Paketebene, können optional mit einer Version verknüpft werden und werden
  für Moderatoren zur Überprüfung sichtbar.
- Meldungen blenden Pakete nicht automatisch aus und blockieren von sich aus keine Downloads.
- Flags:
  - `--version <version>`: optionale Paketversion, die der Meldung zugeordnet wird.
  - `--reason <text>`: erforderlicher Grund für die Meldung.
  - `--json`: maschinenlesbare Ausgabe.

Beispiel:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "verdächtige native Nutzlast"
```

### `package moderation-status`

- Befehl für Eigentümer zum Prüfen der Moderationssichtbarkeit eines Pakets.
- Ruft `GET /api/v1/packages/{name}/moderation` auf.
- Zeigt den aktuellen Scanstatus des Pakets, die Anzahl offener Meldungen, den manuellen
  Moderationsstatus der neuesten Version, den Download-Sperrstatus und die Moderationsgründe an.
- Flags:
  - `--json`: maschinenlesbare Ausgabe.

Beispiel:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- Prüft, ob ein Paket für die zukünftige Verwendung durch OpenClaw bereit ist.
- Ruft `GET /api/v1/packages/{name}/readiness` auf.
- Meldet Hindernisse bezüglich offiziellem Status, ClawPack-Verfügbarkeit, Artefakt-Digest,
  Quellherkunft, OpenClaw-Kompatibilität, Host-Zielen, Umgebungsmetadaten
  und Scanstatus.
- Flags:
  - `--json`: maschinenlesbare Ausgabe.

Beispiel:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- Zeigt den auf Betreiber ausgerichteten Migrationsstatus für ein Paket an, das möglicherweise ein
  gebündeltes OpenClaw-Plugin ersetzt.
- Ruft denselben berechneten Bereitschaftsendpunkt wie `package readiness` auf, gibt jedoch
  den migrationsbezogenen Status, die neueste Version, den Status als offizielles Paket, Prüfungen und
  Hindernisse aus.
- Flags:
  - `--json`: maschinenlesbare Ausgabe.

Beispiel:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `publisher create <handle>`

- Erstellt einen Organisationsherausgeber, dessen Eigentümer der authentifizierte Benutzer ist.
- Das Handle wird in Kleinbuchstaben normalisiert und kann mit oder ohne `@` übergeben werden.
- Neu erstellte Organisationsherausgeber sind standardmäßig weder vertrauenswürdig noch offiziell.
- Schlägt fehl, wenn das Handle bereits von einem vorhandenen Herausgeber, Benutzer oder einer reservierten Route verwendet wird.

```bash
clawhub publisher create opik --display-name "Opik"
```

### `package publish <source>`

- Veröffentlicht über `POST /api/v1/packages` ein Code-Plugin oder Bundle-Plugin.
- `<source>` akzeptiert:
  - Lokaler Ordnerpfad: `./my-plugin`
  - Lokales ClawPack-npm-pack-Tarball: `./my-plugin-1.2.3.tgz`
  - GitHub-Repository: `owner/repo` oder `owner/repo@ref`
  - GitHub-URL: `https://github.com/owner/repo`
- Metadaten werden automatisch aus `package.json`, `openclaw.plugin.json` und
  echten OpenClaw-Bundle-Markierungen wie `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json` und `.cursor-plugin/plugin.json` erkannt.
- `.tgz`-Quellen werden als ClawPack behandelt. Die CLI lädt die exakten npm-pack-
  Bytes hoch und verwendet den extrahierten Inhalt von `package/` nur zur Validierung und
  zum Vorbelegen der Metadaten.
- Ordner mit Code-Plugins werden vor dem Hochladen in ein ClawPack-npm-Tarball gepackt, damit
  OpenClaw-Installationen das exakte Artefakt überprüfen können. Ordner mit Bundle-Plugins
  verwenden weiterhin den Veröffentlichungsweg für extrahierte Dateien.
- Bei GitHub-Quellen wird die Quellenzuordnung automatisch aus dem Repository, dem aufgelösten Commit, der Referenz und dem Unterpfad eingetragen.
- Bei lokalen Ordnern wird die Quellenzuordnung automatisch aus dem lokalen Git erkannt, wenn das Origin-Remote auf GitHub verweist.
- Externe Code-Plugins müssen `openclaw.compat.pluginApi` und
  `openclaw.build.openclawVersion` explizit deklarieren.
  `package.json.version` auf oberster Ebene wird nicht als Fallback für die Veröffentlichungsvalidierung verwendet.
- `--dry-run` zeigt eine Vorschau der aufgelösten Veröffentlichungsnutzlast an, ohne sie hochzuladen.
- `--json` erzeugt eine maschinenlesbare Ausgabe für die CI.
- `--owner <handle>` veröffentlicht unter dem Handle eines Benutzer- oder Organisationsherausgebers, wenn der Akteur Herausgeberzugriff hat.
- Paketnamen mit Gültigkeitsbereich müssen dem ausgewählten Eigentümer entsprechen. Siehe `docs/publishing.md`.
- Vorhandene Flags (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) funktionieren weiterhin als Überschreibungen.
- Private GitHub-Repositorys erfordern `GITHUB_TOKEN`.

```bash
clawhub package publish ./plugin.tgz --owner openclaw
```

#### Empfohlener lokaler Ablauf

Verwenden Sie zuerst `--dry-run`, damit Sie die aufgelösten Paketmetadaten und
die Quellenzuordnung bestätigen können, bevor Sie eine Live-Version erstellen:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### Ablauf für lokale Ordner

Bei Code-Plugins erstellt die Veröffentlichung aus einem Ordner ein ClawPack-Artefakt aus
dem Paketordner und lädt es hoch:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### Minimales `package.json` für `--family code-plugin`

Externe Code-Plugins benötigen eine kleine Menge an OpenClaw-Metadaten in
`package.json`. Dieses minimale Manifest genügt für eine erfolgreiche Veröffentlichung:

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

- `package.json.version` ist die Veröffentlichungsversion Ihres Pakets, wird jedoch nicht als
  Fallback für die Validierung der OpenClaw-Kompatibilität oder des Builds verwendet.
- `openclaw.hostTargets` und `openclaw.environment` sind optionale Metadaten.
  ClawHub kann sie anzeigen, wenn sie vorhanden sind, sie sind für die Veröffentlichung jedoch nicht erforderlich.
- `openclaw.compat.minGatewayVersion` und
  `openclaw.build.pluginSdkVersion` sind optionale Ergänzungen, wenn Sie
  detailliertere Kompatibilitätsmetadaten veröffentlichen möchten.
- Wenn Sie eine ältere Version der `clawhub`-CLI verwenden, führen Sie vor der Veröffentlichung ein Upgrade durch, damit
  die lokalen Vorabprüfungen vor dem Hochladen ausgeführt werden.
- Wenn die Validierung einen Behebungscode meldet, lesen Sie
  [Behebungen für die Plugin-Validierung](/de/clawhub/plugin-validation-fixes).

#### GitHub Actions

ClawHub stellt außerdem unter
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/306035cad779533e212a1fafd4c9938ea4c0b70e/.github/workflows/package-publish.yml)
einen offiziellen wiederverwendbaren Workflow für Plugin-Repositorys bereit.

Typische Einrichtung des Aufrufers:

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

- Der wiederverwendbare Workflow setzt `source` standardmäßig auf das Repository des Aufrufers.
- Übergeben Sie bei Monorepositorys `source_path`, damit der Workflow den
  Plugin-Paketordner veröffentlicht, beispielsweise `source_path: extensions/codex`.
- Fixieren Sie den wiederverwendbaren Workflow auf ein stabiles Tag oder den vollständigen Commit-SHA. Führen Sie die Versionsveröffentlichung nicht von `@main` aus.
- `pull_request` sollte `dry_run: true` verwenden, damit die CI keine dauerhaften Änderungen verursacht.
- Echte Veröffentlichungen sollten auf vertrauenswürdige Ereignisse wie `workflow_dispatch` oder Tag-Pushes beschränkt sein.
- Eine vertrauenswürdige Veröffentlichung ohne Secret funktioniert nur bei `workflow_dispatch`; Tag-Pushes benötigen weiterhin `clawhub_token`.
- Halten Sie `clawhub_token` für die erste Veröffentlichung, nicht vertrauenswürdige Pakete oder Notfallveröffentlichungen verfügbar.
- Der Workflow lädt das JSON-Ergebnis als Artefakt hoch und stellt es als Workflow-Ausgaben bereit.

### `package trusted-publisher get <name>`

- Zeigt die Konfiguration des vertrauenswürdigen GitHub-Actions-Herausgebers für ein Paket an.
- Verwenden Sie dies nach dem Festlegen der Konfiguration, um das Repository, den Workflow-Dateinamen
  und die optionale Umgebungsfixierung zu bestätigen.
- Flags:
  - `--json`: maschinenlesbare Ausgabe.

Beispiel:

```bash
clawhub package trusted-publisher get @openclaw/example-plugin
```

### `package trusted-publisher set <name>`

- Fügt einem vorhandenen Paket die Konfiguration eines vertrauenswürdigen GitHub-Actions-Herausgebers hinzu
  oder ersetzt sie.
- Das Paket muss zuerst durch eine normale manuelle oder tokenauthentifizierte
  Ausführung von `clawhub package publish` erstellt werden.
- Nach dem Festlegen der Konfiguration können zukünftige unterstützte Veröffentlichungen über GitHub Actions
  OIDC bzw. vertrauenswürdiges Veröffentlichen ohne langlebiges ClawHub-Token verwenden.
- `--repository <repo>` muss `owner/repo` sein.
- `--workflow-filename <file>` muss dem Namen der Workflow-Datei in
  `.github/workflows/` entsprechen.
- `--environment <name>` ist optional. Wenn dies konfiguriert ist, muss die GitHub-Actions-
  Umgebung im OIDC-Anspruch exakt übereinstimmen.
- ClawHub überprüft das konfigurierte GitHub-Repository, wenn dieser Befehl ausgeführt wird.
  Öffentliche Repositorys können anhand öffentlicher GitHub-Metadaten überprüft werden. Bei privaten
  Repositorys muss ClawHub Zugriff auf das betreffende GitHub-Repository haben,
  beispielsweise über eine zukünftige Installation der ClawHub GitHub App oder eine andere autorisierte
  GitHub-Integration.
- Flags:
  - `--repository <repo>`: GitHub-Repository, beispielsweise `openclaw/example-plugin`.
  - `--workflow-filename <file>`: Workflow-Dateiname, beispielsweise `package-publish.yml`.
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

- Entfernt die Konfiguration des vertrauenswürdigen Herausgebers von einem Paket.
- Verwenden Sie dies als Rollback, wenn die Workflow-, Repository- oder Umgebungsfixierung
  deaktiviert oder neu erstellt werden muss.
- Zukünftige echte Veröffentlichungen müssen die normale authentifizierte Veröffentlichung verwenden, bis die Konfiguration
  erneut festgelegt wird.
- Flags:
  - `--json`: maschinenlesbare Ausgabe.

Beispiel:

```bash
clawhub package trusted-publisher delete @openclaw/example-plugin
```

### Installationstelemetrie

- Wird nach `clawhub install <slug>` gesendet, wenn Sie angemeldet sind, sofern
  `CLAWHUB_DISABLE_TELEMETRY=1` nicht gesetzt ist.
- Die Meldung erfolgt nach bestem Bemühen. Installationsbefehle schlagen nicht fehl, wenn die Telemetrie
  nicht verfügbar ist.
- Details: `docs/telemetry.md`.
