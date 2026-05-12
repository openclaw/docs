---
read_when:
    - Verwenden der ClawHub CLI
    - Installation, Aktualisierung, Veröffentlichung oder Synchronisierung debuggen
summary: 'CLI-Referenz: Befehle, Flags, Konfiguration, Lockfile, Synchronisierungsverhalten.'
x-i18n:
    generated_at: "2026-05-12T12:53:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 541fb8367e70fab6aaa9fd622a0c2753170d7cd2afa5e4e02681d606bb45ea8c
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

CLI-Paket: `clawhub`, bin: `clawhub`.

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

- `--workdir <dir>`: Arbeitsverzeichnis (Standard: cwd; fällt auf den Clawdbot-Arbeitsbereich zurück, falls konfiguriert)
- `--dir <dir>`: Installationsverzeichnis unter workdir (Standard: `skills`)
- `--site <url>`: Basis-URL für die Browser-Anmeldung (Standard: `https://clawhub.ai`)
- `--registry <url>`: API-Basis-URL (Standard: automatisch ermittelt, andernfalls `https://clawhub.ai`)
- `--no-input`: Eingabeaufforderungen deaktivieren

Entsprechende Umgebungsvariablen:

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
(z. B. Docker-Container, Hetzner-VPS mit ausschließlich Proxy-Internet, Unternehmens-
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
- Legacy-Fallback: Wenn `clawhub/config.json` noch nicht existiert, aber `clawdhub/config.json` vorhanden ist, verwendet die CLI den Legacy-Pfad weiter
- Überschreiben: `CLAWHUB_CONFIG_PATH` (Legacy `CLAWDHUB_CONFIG_PATH`)

## Befehle

### `login` / `auth login`

- Standard: öffnet den Browser unter `<site>/cli/auth` und schließt die Anmeldung über einen Loopback-Callback ab.
- Headless: `clawhub login --token clh_...`
- Remote/headless interaktiv: `clawhub login --device` gibt einen Code aus und wartet, während Sie ihn unter `<site>/cli/device` autorisieren.

### `whoami`

- Prüft das gespeicherte Token über `/api/v1/whoami`.

### `star <slug>` / `unstar <slug>`

- Fügt einen Skill zu Ihren Highlights hinzu oder entfernt ihn daraus.
- Ruft `POST /api/v1/stars/<slug>` und `DELETE /api/v1/stars/<slug>` auf.
- `--yes` überspringt die Bestätigung.

### `search <query...>`

- Ruft `/api/v1/search?q=...` auf.
- Die Suche bevorzugt exakte Token-Übereinstimmungen bei Slug/Name vor der Download-Popularität. Ein eigenständiger Slug-Token wie `map` stimmt stärker mit `personal-map` überein als mit der Teilzeichenfolge in `amap`.
- Downloads sind nur ein kleiner Popularitäts-Prior, keine Garantie für eine Spitzenplatzierung.
- Wenn ein Skill erscheinen sollte, dies aber nicht tut, führen Sie angemeldet `clawhub inspect <slug>` aus, um owner-sichtbare Moderationsdiagnosen zu prüfen, bevor Sie Metadaten umbenennen.

### `explore`

- Listet die neuesten Skills über `/api/v1/skills?limit=...&sort=createdAt` auf (absteigend nach `createdAt` sortiert).
- Flags:
  - `--limit <n>` (1-200, Standard: 25)
  - `--sort newest|updated|downloads|rating|installs|installsAllTime|trending` (Standard: newest)
  - `--json` (maschinenlesbare Ausgabe)
- Ausgabe: `<slug>  v<version>  <age>  <summary>` (Zusammenfassung auf 50 Zeichen gekürzt).

### `inspect <slug>`

- Ruft Skill-Metadaten und Versionsdateien ab, ohne zu installieren.
- `--version <version>`: eine bestimmte Version prüfen (Standard: neueste).
- `--tag <tag>`: eine getaggte Version prüfen (z. B. `latest`).
- `--versions`: Versionsverlauf auflisten (erste Seite).
- `--limit <n>`: maximale Anzahl der aufzulistenden Versionen (1-200).
- `--files`: Dateien für die ausgewählte Version auflisten.
- `--file <path>`: Rohdateiinhalt abrufen (nur Textdateien; 200-KB-Limit).
- `--json`: maschinenlesbare Ausgabe.

### `install <slug>`

- Löst die neueste Version über `/api/v1/skills/<slug>` auf.
- Lädt die ZIP-Datei über `/api/v1/download` herunter.
- Entpackt nach `<workdir>/<dir>/<slug>`.
- Verweigert das Überschreiben gepinnter Skills; führen Sie zuerst `clawhub unpin <slug>` aus.
- Schreibt:
  - `<workdir>/.clawhub/lock.json` (Legacy `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (Legacy `.clawdhub`)

### `uninstall <slug>`

- Entfernt `<workdir>/<dir>/<slug>` und löscht den Lockfile-Eintrag.
- Interaktiv: fragt nach Bestätigung.
- Nicht interaktiv (`--no-input`): erfordert `--yes`.

### `list`

- Liest `<workdir>/.clawhub/lock.json` (Legacy-`.clawdhub`).
- Zeigt `pinned` neben Skills an, die mit `clawhub pin` eingefroren wurden, einschließlich des optionalen Grunds.

### `pin <slug>`

- Markiert einen installierten Skill im Lockfile als angeheftet.
- `--reason <text>` zeichnet auf, warum der Skill eingefroren ist.
- Angeheftete Skills werden von `update --all` übersprungen und bei direktem `update <slug>` abgelehnt.
- Angeheftete Skills lehnen außerdem `install --force` ab, damit die lokalen Bytes nicht versehentlich ersetzt werden können.

### `unpin <slug>`

- Entfernt die Lockfile-Anheftung von einem installierten Skill, sodass künftige Updates ihn ändern können.

### `update [slug]` / `update --all`

- Berechnet den Fingerabdruck aus lokalen Dateien.
- Wenn der Fingerabdruck mit einer bekannten Version übereinstimmt: keine Eingabeaufforderung.
- Wenn der Fingerabdruck nicht übereinstimmt:
  - lehnt standardmäßig ab
  - überschreibt mit `--force` (oder per Eingabeaufforderung, falls interaktiv)
- Angeheftete Skills werden nie durch `--force` aktualisiert.
- `update <slug>` schlägt bei angehefteten Slugs sofort fehl und weist Sie an, zuerst `clawhub unpin <slug>` auszuführen.
- `update --all` überspringt angeheftete Slugs und gibt eine Zusammenfassung dessen aus, was eingefroren blieb.

### `skill publish <path>`

- Veröffentlicht über `POST /api/v1/skills` (multipart).
- Erfordert Semver: `--version 1.2.3`.
- `--owner <handle>` veröffentlicht unter einem Org-/Benutzer-Publisher-Handle, wenn der
  Akteur Publisher-Zugriff hat.
- `--migrate-owner` verschiebt einen vorhandenen Skill zu `--owner`, während eine neue
  Version veröffentlicht wird. Erfordert Admin-/Owner-Zugriff bei beiden Publishern.
- Owner- und Review-Verhalten wird in `docs/publishing.md` erklärt.
- Das Veröffentlichen eines Skills bedeutet, dass er unter `MIT-0` auf ClawHub veröffentlicht wird.
- Veröffentlichte Skills dürfen ohne Namensnennung frei verwendet, geändert und weiterverteilt werden.
- ClawHub unterstützt keine kostenpflichtigen Skills oder Preise pro Skill.
- `--clawscan-note <text>` fügt eine ClawScan-Notiz hinzu. Diese Notiz gibt ClawScan
  Kontext zu Verhalten, das andernfalls ungewöhnlich wirken kann, etwa Netzwerkzugriff,
  Zugriff auf native Hosts oder Provider-spezifische Anmeldedaten. Die Notiz wird auf
  der veröffentlichten Version gespeichert.
- Legacy-Alias: `publish <path>`.

```bash
clawhub skill publish ./my-skill --clawscan-note "Uses network access only to call the user-configured Weather API."
```

### `delete <slug>`

- Löscht einen Skill vorläufig (Owner, Moderator oder Admin).
- Ruft `DELETE /api/v1/skills/{slug}` auf.
- Vom Owner initiierte vorläufige Löschungen reservieren den Slug 30 Tage lang; der Befehl gibt den Ablaufzeitpunkt aus.
- `--reason <text>` zeichnet eine Moderationsnotiz zum Skill und im Audit-Log auf.
- `--note <text>` ist ein Alias für `--reason`.
- `--yes` überspringt die Bestätigung.

### `undelete <slug>`

- Stellt einen ausgeblendeten Skill wieder her (Owner, Moderator oder Admin).
- Ruft `POST /api/v1/skills/{slug}/undelete` auf.
- `--reason <text>` zeichnet eine Moderationsnotiz zum Skill und im Audit-Log auf.
- `--note <text>` ist ein Alias für `--reason`.
- `--yes` überspringt die Bestätigung.

### `hide <slug>`

- Blendet einen Skill aus (Owner, Moderator oder Admin).
- Alias für `delete`.

### `unhide <slug>`

- Macht einen Skill wieder sichtbar (Owner, Moderator oder Admin).
- Alias für `undelete`.

### `skill rename <slug> <new-slug>`

- Benennt einen eigenen Skill um und behält den vorherigen Slug als Weiterleitungsalias bei.
- Ruft `POST /api/v1/skills/{slug}/rename` auf.
- `--yes` überspringt die Bestätigung.

### `skill merge <source-slug> <target-slug>`

- Führt einen eigenen Skill mit einem anderen eigenen Skill zusammen.
- Der Quell-Slug wird nicht mehr öffentlich gelistet und wird zu einem Weiterleitungsalias auf das Ziel.
- Ruft `POST /api/v1/skills/{sourceSlug}/merge` auf.
- `--yes` überspringt die Bestätigung.

### `transfer`

- Workflow zur Ownership-Übertragung.
- Übertragungen an Benutzer-Handles erstellen eine ausstehende Anfrage, die der Empfänger annimmt.
- Übertragungen an Org-/Publisher-Handles werden nur dann sofort angewendet, wenn der Akteur
  Admin-Zugriff sowohl auf den aktuellen Owner als auch auf den Ziel-Publisher hat.
- Unterbefehle:
  - `transfer request <slug> <handle> [--message "..."] [--yes]`
  - `transfer list [--outgoing]`
  - `transfer accept <slug> [--yes]`
  - `transfer reject <slug> [--yes]`
  - `transfer cancel <slug> [--yes]`
- Endpunkte:
  - `POST /api/v1/skills/{slug}/transfer`
  - `POST /api/v1/skills/{slug}/transfer/accept`
  - `POST /api/v1/skills/{slug}/transfer/reject`
  - `POST /api/v1/skills/{slug}/transfer/cancel`
  - `GET /api/v1/transfers/incoming`
  - `GET /api/v1/transfers/outgoing`

### `package explore [query...]`

- Durchsucht oder browsed den einheitlichen Paketkatalog über `GET /api/v1/packages` und `GET /api/v1/packages/search`.
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
- Verwenden Sie dies für Plugin-Metadaten, Kompatibilität, Verifizierung, Quelle und Versions-/Dateiinspektion.
- `--version <version>`: eine bestimmte Version inspizieren (Standard: neueste).
- `--tag <tag>`: eine getaggte Version inspizieren (z. B. `latest`).
- `--versions`: Versionsverlauf auflisten (erste Seite).
- `--limit <n>`: maximale Anzahl der aufzulistenden Versionen (1-100).
- `--files`: Dateien für die ausgewählte Version auflisten.
- `--file <path>`: Rohdateiinhalt abrufen (nur Textdateien; Limit 200 KB).
- `--json`: maschinenlesbare Ausgabe.

### `package download <name>`

- Löst eine Paketversion über
  `GET /api/v1/packages/{name}/versions/{version}/artifact` auf.
- Lädt das Artefakt von der `downloadUrl` des Resolvers herunter.
- Verifiziert ClawHub SHA-256 für alle Artefakte.
- Für ClawPack-npm-pack-Artefakte werden außerdem npm-`sha512`-Integrität,
  npm-Shasum und Name/Version der `package.json` des Tarballs verifiziert.
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

- Berechnet ClawHub SHA-256, npm-`sha512`-Integrität und npm-Shasum für ein lokales
  Artefakt.
- Mit `--package` löst es erwartete Metadaten von ClawHub auf und vergleicht die
  lokale Datei mit den veröffentlichten Artefaktmetadaten.
- Mit direkten Digest-Flags verifiziert es ohne Netzwerk-Lookup.
- Flags:
  - `--package <name>`: Paketname zum Auflösen erwarteter Artefaktmetadaten.
  - `--version <version>` oder `--tag <tag>`: erwartete Paketversion.
  - `--sha256 <hex>`: erwartetes ClawHub SHA-256.
  - `--npm-integrity <sri>`: erwartete npm-Integrität.
  - `--npm-shasum <sha1>`: erwartetes npm-Shasum.
  - `--json`: maschinenlesbare Ausgabe.

Beispiele:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package delete <name>`

- Löscht ein Paket und alle Releases vorläufig.
- Erfordert den Paket-Owner, einen Owner/Admin des Organisations-Herausgebers, einen Plattformmoderator
  oder einen Plattformadmin.
- Flags:
  - `--yes`: Bestätigung überspringen.
  - `--json`: maschinenlesbare Ausgabe.

Beispiel:

```bash
clawhub package delete @openclaw/example-plugin --yes
```

### `package undelete <name>`

- Stellt ein vorläufig gelöschtes Paket und seine Releases wieder her.
- Erfordert den Paket-Owner, einen Owner/Admin des Organisations-Herausgebers, einen Plattformmoderator
  oder einen Plattformadmin.
- Ruft `POST /api/v1/packages/{name}/undelete` auf.
- Flags:
  - `--yes`: Bestätigung überspringen.
  - `--json`: maschinenlesbare Ausgabe.

Beispiel:

```bash
clawhub package undelete @openclaw/example-plugin --yes
```

### `package transfer <name>`

- Überträgt ein Paket an einen anderen Herausgeber.
- Erfordert Adminzugriff sowohl auf den aktuellen Paket-Owner als auch auf den Ziel-
  Herausgeber, sofern die Aktion nicht von einem Plattformadmin durchgeführt wird.
- Namen von Paketen mit Scope müssen an den passenden Scope-Owner übertragen werden.
- Ruft `POST /api/v1/packages/{name}/transfer` auf.
- Flags:
  - `--to <owner>`: Handle des Ziel-Herausgebers.
  - `--reason <text>`: optionaler Prüfgrund.
  - `--json`: maschinenlesbare Ausgabe.

Beispiel:

```bash
clawhub package transfer @openclaw/example-plugin --to openclaw
```

### `package report`

- Authentifizierter Befehl zum Melden eines Pakets an Moderatoren.
- Ruft `POST /api/v1/packages/{name}/report` auf.
- Meldungen gelten auf Paketebene, können optional mit einer Version verknüpft sein und werden
  für Moderatoren zur Prüfung sichtbar.
- Meldungen blenden Pakete nicht automatisch aus und blockieren Downloads nicht selbstständig.
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
- Zeigt den aktuellen Paket-Scanstatus, die Anzahl offener Meldungen, den manuellen
  Moderationsstatus des neuesten Releases, den Download-Blockierungsstatus und Moderationsgründe.
- Flags:
  - `--json`: maschinenlesbare Ausgabe.

Beispiel:

```bash
clawhub package moderation-status @openclaw/example-plugin
```

### `package readiness <name>`

- Prüft, ob ein Paket für die zukünftige Nutzung durch OpenClaw bereit ist.
- Ruft `GET /api/v1/packages/{name}/readiness` auf.
- Meldet Blocker für den offiziellen Status, ClawPack-Verfügbarkeit, Artefakt-Digest,
  Quellherkunft, OpenClaw-Kompatibilität, Host-Ziele, Umgebungsmetadaten
  und Scanstatus.
- Flags:
  - `--json`: maschinenlesbare Ausgabe.

Beispiel:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- Zeigt einen betreiberorientierten Migrationsstatus für ein Paket, das ein
  gebündeltes OpenClaw Plugin ersetzen kann.
- Ruft denselben berechneten Bereitschafts-Endpunkt wie `package readiness` auf, gibt aber
  migrationsbezogenen Status, neueste Version, offiziellen Paketstatus, Prüfungen und
  Blocker aus.
- Flags:
  - `--json`: maschinenlesbare Ausgabe.

Beispiel:

```bash
clawhub package migration-status @openclaw/example-plugin
```

### `package publish <source>`

- Veröffentlicht ein Code-Plugin oder Bundle-Plugin über `POST /api/v1/packages`.
- `<source>` akzeptiert:
  - Lokaler Ordnerpfad: `./my-plugin`
  - Lokaler ClawPack-npm-pack-Tarball: `./my-plugin-1.2.3.tgz`
  - GitHub-Repo: `owner/repo` oder `owner/repo@ref`
  - GitHub-URL: `https://github.com/owner/repo`
- Metadaten werden automatisch aus `package.json`, `openclaw.plugin.json` und
  echten OpenClaw Bundle-Markern wie `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json` und `.cursor-plugin/plugin.json` erkannt.
- `.tgz`-Quellen werden als ClawPack behandelt. Die CLI lädt die exakten npm-pack-
  Bytes hoch und verwendet die extrahierten `package/`-Inhalte nur für Validierung und
  Vorbefüllung von Metadaten.
- Code-Plugin-Ordner werden vor dem Upload in einen ClawPack-npm-Tarball gepackt, damit
  OpenClaw-Installationen das exakte Artefakt verifizieren können. Bundle-Plugin-Ordner verwenden weiterhin
  den Veröffentlichungsweg über extrahierte Dateien.
- Für GitHub-Quellen wird die Quellenzuordnung automatisch aus dem Repo, dem aufgelösten Commit, der Ref und dem Unterpfad befüllt.
- Für lokale Ordner wird die Quellenzuordnung automatisch aus lokalem git erkannt, wenn das origin-Remote auf GitHub verweist.
- Externe Code-Plugins müssen `openclaw.compat.pluginApi` und
  `openclaw.build.openclawVersion` ausdrücklich deklarieren.
  `package.json.version` auf oberster Ebene wird nicht als Fallback für die Veröffentlichungsvalidierung verwendet.
- `--dry-run` zeigt eine Vorschau der aufgelösten Veröffentlichungs-Payload an, ohne hochzuladen.
- `--json` gibt maschinenlesbare Ausgabe für CI aus.
- `--owner <handle>` veröffentlicht unter einem Benutzer- oder Organisations-Herausgeber-Handle, wenn der Akteur Herausgeberzugriff hat.
- `--clawscan-note <text>` fügt eine ClawScan-Notiz hinzu. Diese Notiz gibt ClawScan
  Kontext zu Verhalten, das andernfalls ungewöhnlich wirken könnte, etwa Netzwerkzugriff,
  nativer Host-Zugriff oder Provider-spezifische Zugangsdaten. Die Notiz wird auf
  dem veröffentlichten Release gespeichert.
- Namen von Paketen mit Scope müssen zum ausgewählten Owner passen. Siehe `docs/publishing.md`.
- Vorhandene Flags (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) funktionieren weiterhin als Overrides.
- Private GitHub-Repos erfordern `GITHUB_TOKEN`.

```bash
clawhub package publish ./plugin.tgz --clawscan-note "Native host access is limited to the local OpenClaw bridge."
```

#### Empfohlener lokaler Ablauf

Verwenden Sie zuerst `--dry-run`, damit Sie die aufgelösten Paketmetadaten und
die Quellenzuordnung bestätigen können, bevor Sie ein Live-Release erstellen:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### Ablauf für lokale Ordner

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
  ClawHub kann sie anzeigen, wenn sie vorhanden sind, sie sind für die Veröffentlichung aber nicht erforderlich.
- `openclaw.compat.minGatewayVersion` und
  `openclaw.build.pluginSdkVersion` sind optionale Extras, wenn Sie
  detailliertere Kompatibilitätsmetadaten veröffentlichen möchten.
- Wenn Sie eine ältere `clawhub`-CLI-Version verwenden, aktualisieren Sie vor der Veröffentlichung, damit
  die lokalen Vorabprüfungen vor dem Upload ausgeführt werden.

#### GitHub Actions

ClawHub liefert außerdem einen offiziellen wiederverwendbaren Workflow unter
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/be77f0626d9e4b52c465670ba411882be1ac3a2d/.github/workflows/package-publish.yml)
für Plugin-Repos aus.

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

- Der wiederverwendbare Workflow setzt `source` standardmäßig auf das Caller-Repo.
- Übergeben Sie für Monorepos `source_path`, damit der Workflow den Plugin-
  Paketordner veröffentlicht, zum Beispiel `source_path: extensions/codex`.
- Pinnen Sie den wiederverwendbaren Workflow auf ein stabiles Tag oder eine vollständige Commit-SHA. Führen Sie Release-Veröffentlichungen nicht von `@main` aus.
- `pull_request` sollte `dry_run: true` verwenden, damit CI keine bleibenden Änderungen erzeugt.
- Echte Veröffentlichungen sollten auf vertrauenswürdige Ereignisse wie `workflow_dispatch` oder Tag-Pushes beschränkt werden.
- Vertrauenswürdige Veröffentlichung ohne Secret funktioniert nur bei `workflow_dispatch`; Tag-Pushes benötigen weiterhin `clawhub_token`.
- Halten Sie `clawhub_token` für die erste Veröffentlichung, nicht vertrauenswürdige Pakete oder Notfallveröffentlichungen verfügbar.
- Der Workflow lädt das JSON-Ergebnis als Artefakt hoch und stellt es als Workflow-Ausgaben bereit.

### `sync`

- Sucht nach lokalen Skill-Ordnern und veröffentlicht neue/geänderte.
- Roots können beliebige Ordner sein: ein Skills-Verzeichnis oder ein einzelner Skill-Ordner mit `SKILL.md`.
- Fügt Clawdbot-Skill-Roots automatisch hinzu, wenn `~/.clawdbot/clawdbot.json` vorhanden ist:
  - `agent.workspace/skills` (Haupt-Agent)
  - `routing.agents.*.workspace/skills` (pro Agent)
  - `~/.clawdbot/skills` (gemeinsam)
  - `skills.load.extraDirs` (gemeinsame Packs)
- Beachtet `CLAWDBOT_CONFIG_PATH` / `CLAWDBOT_STATE_DIR` und `OPENCLAW_CONFIG_PATH` / `OPENCLAW_STATE_DIR`.
- Flags:
  - `--root <dir...>` zusätzliche Scan-Roots
  - `--all` ohne Nachfrage hochladen
  - `--dry-run` nur Plan anzeigen
  - `--bump patch|minor|major` (Standard: patch)
  - `--changelog <text>` (nicht interaktiv)
  - `--tags a,b,c` (Standard: latest)
  - `--concurrency <n>` (Standard: 4)

Telemetrie:

- Wird während `sync` gesendet, wenn Sie angemeldet sind, sofern nicht `CLAWHUB_DISABLE_TELEMETRY=1` gesetzt ist (Legacy: `CLAWDHUB_DISABLE_TELEMETRY=1`).
- Details: `docs/telemetry.md`.
