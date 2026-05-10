---
read_when:
    - Verwenden der ClawHub CLI
    - Fehlerbehebung bei Installation, Aktualisierung, Veröffentlichung oder Synchronisierung
summary: 'CLI-Referenz: Befehle, Flags, Konfiguration, Lockfile, Synchronisierungsverhalten.'
x-i18n:
    generated_at: "2026-05-10T19:25:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: af8e43780c82c9d540bf99e677788df8913532adb3d237d20d96f575f621eae3
    source_path: clawhub/cli.md
    workflow: 16
---

# CLI

CLI-Paket: `clawhub`, Binärprogramm: `clawhub`.

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

- `--workdir <dir>`: Arbeitsverzeichnis (Standard: cwd; fällt auf den Clawdbot-Workspace zurück, falls konfiguriert)
- `--dir <dir>`: Installationsverzeichnis unterhalb von workdir (Standard: `skills`)
- `--site <url>`: Basis-URL für Browser-Login (Standard: `https://clawhub.ai`)
- `--registry <url>`: API-Basis-URL (Standard: erkannt, andernfalls `https://clawhub.ai`)
- `--no-input`: Prompts deaktivieren

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
(z. B. Docker-Container, Hetzner-VPS mit reinem Proxy-Internet, Unternehmens-
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
- Überschreibung: `CLAWHUB_CONFIG_PATH` (Legacy `CLAWDHUB_CONFIG_PATH`)

## Befehle

### `login` / `auth login`

- Standard: Öffnet den Browser unter `<site>/cli/auth` und schließt den Vorgang über einen Loopback-Callback ab.
- Headless: `clawhub login --token clh_...`
- Remote/headless interaktiv: `clawhub login --device` gibt einen Code aus und wartet, während Sie ihn unter `<site>/cli/device` autorisieren.

### `whoami`

- Überprüft das gespeicherte Token über `/api/v1/whoami`.

### `star <slug>` / `unstar <slug>`

- Fügt einen Skill zu Ihren Highlights hinzu oder entfernt ihn daraus.
- Ruft `POST /api/v1/stars/<slug>` und `DELETE /api/v1/stars/<slug>` auf.
- `--yes` überspringt die Bestätigung.

### `search <query...>`

- Ruft `/api/v1/search?q=...` auf.
- Die Suche bevorzugt exakte Übereinstimmungen mit Slug-/Namens-Tokens vor Download-Popularität. Ein eigenständiger Slug-Token wie `map` passt stärker zu `personal-map` als zur Teilzeichenfolge in `amap`.
- Downloads sind ein kleiner Popularitäts-Prior, keine Garantie für eine Spitzenplatzierung.
- Wenn ein Skill erscheinen sollte, aber nicht erscheint, führen Sie im angemeldeten Zustand `clawhub inspect <slug>` aus, um für den Owner sichtbare Moderationsdiagnosen zu prüfen, bevor Sie Metadaten umbenennen.

### `explore`

- Listet die neuesten Skills über `/api/v1/skills?limit=...&sort=createdAt` auf (absteigend nach `createdAt` sortiert).
- Flags:
  - `--limit <n>` (1-200, Standard: 25)
  - `--sort newest|updated|downloads|rating|installs|installsAllTime|trending` (Standard: newest)
  - `--json` (maschinenlesbare Ausgabe)
- Ausgabe: `<slug>  v<version>  <age>  <summary>` (summary auf 50 Zeichen gekürzt).

### `inspect <slug>`

- Ruft Skill-Metadaten und Versionsdateien ab, ohne zu installieren.
- `--version <version>`: eine bestimmte Version prüfen (Standard: latest).
- `--tag <tag>`: eine getaggte Version prüfen (z. B. `latest`).
- `--versions`: Versionsverlauf auflisten (erste Seite).
- `--limit <n>`: maximale Anzahl der aufzulistenden Versionen (1-200).
- `--files`: Dateien für die ausgewählte Version auflisten.
- `--file <path>`: rohen Dateiinhalt abrufen (nur Textdateien; 200-KB-Limit).
- `--json`: maschinenlesbare Ausgabe.

### `install <slug>`

- Löst die neueste Version über `/api/v1/skills/<slug>` auf.
- Lädt ZIP über `/api/v1/download` herunter.
- Extrahiert nach `<workdir>/<dir>/<slug>`.
- Verweigert das Überschreiben gepinnter Skills; führen Sie zuerst `clawhub unpin <slug>` aus.
- Schreibt:
  - `<workdir>/.clawhub/lock.json` (Legacy `.clawdhub`)
  - `<skill>/.clawhub/origin.json` (Legacy `.clawdhub`)

### `uninstall <slug>`

- Entfernt `<workdir>/<dir>/<slug>` und löscht den Lockfile-Eintrag.
- Interaktiv: fragt nach Bestätigung.
- Nicht interaktiv (`--no-input`): erfordert `--yes`.

### `list`

- Liest `<workdir>/.clawhub/lock.json` (Legacy `.clawdhub`).
- Zeigt `pinned` neben Skills an, die mit `clawhub pin` eingefroren wurden, einschließlich des optionalen Grunds.

### `pin <slug>`

- Markiert einen installierten Skill im Lockfile als angeheftet.
- `--reason <text>` zeichnet auf, warum der Skill eingefroren ist.
- Angeheftete Skills werden von `update --all` übersprungen und bei direktem `update <slug>` abgelehnt.
- Angeheftete Skills lehnen auch `install --force` ab, damit die lokalen Bytes nicht versehentlich ersetzt werden können.

### `unpin <slug>`

- Entfernt die Lockfile-Anheftung von einem installierten Skill, damit zukünftige Updates ihn ändern können.

### `update [slug]` / `update --all`

- Berechnet den Fingerprint aus lokalen Dateien.
- Wenn der Fingerprint einer bekannten Version entspricht: keine Nachfrage.
- Wenn der Fingerprint nicht übereinstimmt:
  - lehnt standardmäßig ab
  - überschreibt mit `--force` (oder nach Nachfrage, falls interaktiv)
- Angeheftete Skills werden durch `--force` nie aktualisiert.
- `update <slug>` schlägt bei angehefteten Slugs schnell fehl und weist Sie an, zuerst `clawhub unpin <slug>` auszuführen.
- `update --all` überspringt angeheftete Slugs und gibt eine Zusammenfassung dessen aus, was eingefroren blieb.

### `skill publish <path>`

- Veröffentlicht über `POST /api/v1/skills` (multipart).
- Erfordert semver: `--version 1.2.3`.
- `--owner <handle>` veröffentlicht unter einem Publisher-Handle einer Organisation/eines Benutzers, wenn der
  Akteur Publisher-Zugriff hat.
- `--migrate-owner` verschiebt einen vorhandenen Skill zu `--owner`, während eine neue
  Version veröffentlicht wird. Erfordert Admin-/Owner-Zugriff bei beiden Publishern.
- Owner- und Review-Verhalten wird in `docs/publishing.md` erklärt.
- Einen Skill zu veröffentlichen bedeutet, dass er unter `MIT-0` auf ClawHub veröffentlicht wird.
- Veröffentlichte Skills dürfen ohne Namensnennung frei verwendet, geändert und weiterverbreitet werden.
- ClawHub unterstützt keine bezahlten Skills oder Preise pro Skill.
- Legacy-Alias: `publish <path>`.

### `delete <slug>`

- Löscht einen Skill vorläufig (Owner, Moderator oder Admin).
- Ruft `DELETE /api/v1/skills/{slug}` auf.
- Durch Owner angestoßene vorläufige Löschungen reservieren den Slug für 30 Tage; der Befehl gibt den Ablaufzeitpunkt aus.
- `--reason <text>` zeichnet eine Moderationsnotiz beim Skill und im Audit-Log auf.
- `--note <text>` ist ein Alias für `--reason`.
- `--yes` überspringt die Bestätigung.

### `undelete <slug>`

- Stellt einen ausgeblendeten Skill wieder her (Owner, Moderator oder Admin).
- Ruft `POST /api/v1/skills/{slug}/undelete` auf.
- `--reason <text>` zeichnet eine Moderationsnotiz beim Skill und im Audit-Log auf.
- `--note <text>` ist ein Alias für `--reason`.
- `--yes` überspringt die Bestätigung.

### `hide <slug>`

- Blendet einen Skill aus (Owner, Moderator oder Admin).
- Alias für `delete`.

### `unhide <slug>`

- Blendet einen Skill wieder ein (Owner, Moderator oder Admin).
- Alias für `undelete`.

### `skill rename <slug> <new-slug>`

- Benennt einen eigenen Skill um und behält den vorherigen Slug als Weiterleitungsalias.
- Ruft `POST /api/v1/skills/{slug}/rename` auf.
- `--yes` überspringt die Bestätigung.

### `skill merge <source-slug> <target-slug>`

- Führt einen eigenen Skill in einen anderen eigenen Skill zusammen.
- Der Quell-Slug wird nicht mehr öffentlich gelistet und wird zu einem Weiterleitungsalias auf das Ziel.
- Ruft `POST /api/v1/skills/{sourceSlug}/merge` auf.
- `--yes` überspringt die Bestätigung.

### `skill rescan <slug>`

- Fordert einen Sicherheitsscan für die neueste veröffentlichte Skill-Version an.
- Owner und Publisher-Admins können ihre eigenen Skills bis zum Wiederherstellungslimit
  pro Version erneut scannen.
- Plattformmoderatoren und Admins können jeden Skill erneut scannen und werden nicht durch das
  Owner-Wiederherstellungslimit blockiert, allerdings kann pro Version jeweils nur ein erneuter Scan laufen.
- Ruft `POST /api/v1/skills/{slug}/rescan` auf.
- Optionen:
  - `--yes`: Bestätigung überspringen.
  - `--json`: maschinenlesbare Ausgabe.

Beispiel:

```bash
clawhub skill rescan suspicious-skill --yes
```

### `transfer`

- Workflow zur Übertragung der Eigentümerschaft.
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

- Durchsucht oder durchsieht den vereinheitlichten Paketkatalog über `GET /api/v1/packages` und `GET /api/v1/packages/search`.
- Verwenden Sie dies für Plugins und andere Einträge aus Paketfamilien; das `search` auf oberster Ebene bleibt die Suchoberfläche für Skills.
- Optionen:
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
- `--version <version>`: eine bestimmte Version inspizieren (Standard: neueste).
- `--tag <tag>`: eine getaggte Version inspizieren (z. B. `latest`).
- `--versions`: Versionsverlauf auflisten (erste Seite).
- `--limit <n>`: maximale Anzahl der aufzulistenden Versionen (1-100).
- `--files`: Dateien für die ausgewählte Version auflisten.
- `--file <path>`: Rohdateiinhalt abrufen (nur Textdateien; Limit 200KB).
- `--json`: maschinenlesbare Ausgabe.

### `package download <name>`

- Löst eine Paketversion über
  `GET /api/v1/packages/{name}/versions/{version}/artifact` auf.
- Lädt das Artefakt von der `downloadUrl` des Resolvers herunter.
- Verifiziert ClawHub SHA-256 für alle Artefakte.
- Für ClawPack-npm-pack-Artefakte werden zusätzlich npm-`sha512`-Integrität,
  npm-Shasum und Name/Version aus `package.json` des Tarballs verifiziert.
- Legacy-ZIP-Versionen werden über die Legacy-ZIP-Route heruntergeladen.
- Optionen:
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
- Mit `--package` werden erwartete Metadaten von ClawHub aufgelöst und die
  lokale Datei mit den veröffentlichten Artefaktmetadaten verglichen.
- Mit direkten Digest-Flags wird ohne Netzwerkabfrage verifiziert.
- Optionen:
  - `--package <name>`: Paketname zum Auflösen der erwarteten Artefaktmetadaten.
  - `--version <version>` oder `--tag <tag>`: erwartete Paketversion.
  - `--sha256 <hex>`: erwartetes ClawHub SHA-256.
  - `--npm-integrity <sri>`: erwartete npm-Integrität.
  - `--npm-shasum <sha1>`: erwarteter npm-Shasum.
  - `--json`: maschinenlesbare Ausgabe.

Beispiele:

```bash
clawhub package verify ./example-plugin-1.2.3.tgz --package @openclaw/example-plugin --version 1.2.3
clawhub package verify ./example-plugin-1.2.3.tgz --sha256 <hex>
```

### `package delete <name>`

- Löscht ein Paket und alle Releases per Soft Delete.
- Erfordert den Paketeigentümer, einen Eigentümer/Admin des Org-Publishers, einen Plattformmoderator
  oder einen Plattformadmin.
- Flags:
  - `--yes`: Bestätigung überspringen.
  - `--json`: maschinenlesbare Ausgabe.

Beispiel:

```bash
clawhub package delete @openclaw/example-plugin --yes
```

### `package rescan <name>`

- Fordert einen erneuten Sicherheitsscan für das zuletzt veröffentlichte Paket-Release an.
- Eigentümer und Publisher-Admins können ihre eigenen Pakete bis zum Recovery-Limit
  pro Release erneut scannen.
- Plattformmoderatoren und Admins können jedes Paket erneut scannen und werden nicht durch
  das Recovery-Limit des Eigentümers blockiert, allerdings kann pro Release immer nur ein erneuter Scan gleichzeitig laufen.
- Ruft `POST /api/v1/packages/{name}/rescan` auf.
- Flags:
  - `--yes`: Bestätigung überspringen.
  - `--json`: maschinenlesbare Ausgabe.

Beispiel:

```bash
clawhub package rescan @openclaw/example-plugin --yes
```

### `package report`

- Authentifizierter Befehl zum Melden eines Pakets an Moderatoren.
- Ruft `POST /api/v1/packages/{name}/report` auf.
- Meldungen gelten auf Paketebene, können optional an eine Version gebunden sein und werden
  für Moderatoren zur Prüfung sichtbar.
- Meldungen blenden Pakete nicht automatisch aus und blockieren Downloads nicht von selbst.
- Flags:
  - `--version <version>`: optionale Paketversion, die der Meldung zugeordnet wird.
  - `--reason <text>`: erforderlicher Meldegrund.
  - `--json`: maschinenlesbare Ausgabe.

Beispiel:

```bash
clawhub package report @openclaw/example-plugin --version 1.2.3 --reason "suspicious native payload"
```

### `package appeal`

- Befehl für Eigentümer/Publisher zum Anfechten der Release-Moderation.
- Ruft `POST /api/v1/packages/{name}/appeal` auf.
- Einsprüche werden für unter Quarantäne gestellte, widerrufene, verdächtige oder bösartige
  Releases akzeptiert.
- Flags:
  - `--version <version>`: erforderliche Paketversion.
  - `--message <text>`: erforderliche Einspruchsnachricht.
  - `--json`: maschinenlesbare Ausgabe.

Beispiel:

```bash
clawhub package appeal @openclaw/example-plugin --version 1.2.3 --message "linked source release explains the native binary"
```

### `package moderation-status`

- Eigentümerbefehl zum Prüfen der Sichtbarkeit der Paketmoderation.
- Ruft `GET /api/v1/packages/{name}/moderation` auf.
- Zeigt den aktuellen Scanstatus des Pakets, die Anzahl offener Meldungen, den manuellen
  Moderationsstatus des neuesten Releases, den Download-Blockierungsstatus und Moderationsgründe an.
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
  Quellprovenienz, OpenClaw-Kompatibilität, Host-Ziele, Umgebungsmetadaten
  und Scanstatus.
- Flags:
  - `--json`: maschinenlesbare Ausgabe.

Beispiel:

```bash
clawhub package readiness @openclaw/example-plugin
```

### `package migration-status <name>`

- Zeigt den operatororientierten Migrationsstatus für ein Paket, das ein
  gebündeltes OpenClaw-Plugin ersetzen kann.
- Ruft denselben berechneten Readiness-Endpunkt wie `package readiness` auf, gibt jedoch
  migrationsbezogenen Status, neueste Version, Status als offizielles Paket, Prüfungen und
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
  - GitHub-Repository: `owner/repo` oder `owner/repo@ref`
  - GitHub-URL: `https://github.com/owner/repo`
- Metadaten werden automatisch aus `package.json`, `openclaw.plugin.json` und
  echten OpenClaw-Bundle-Markern wie `.codex-plugin/plugin.json`,
  `.claude-plugin/plugin.json` und `.cursor-plugin/plugin.json` erkannt.
- `.tgz`-Quellen werden als ClawPack behandelt. Die CLI lädt die exakten npm-pack-Bytes hoch
  und verwendet die extrahierten `package/`-Inhalte nur für Validierung und
  Vorbefüllung von Metadaten.
- Code-Plugin-Ordner werden vor dem Upload in einen ClawPack-npm-Tarball gepackt, damit
  OpenClaw-Installationen das exakte Artefakt verifizieren können. Bundle-Plugin-Ordner verwenden weiterhin
  den Veröffentlichungsweg mit extrahierten Dateien.
- Für GitHub-Quellen wird die Quellzuordnung automatisch aus Repository, aufgelöstem Commit, Ref und Unterpfad befüllt.
- Für lokale Ordner wird die Quellzuordnung automatisch aus lokalem Git erkannt, wenn der Origin-Remote auf GitHub verweist.
- Externe Code-Plugins müssen `openclaw.compat.pluginApi` und
  `openclaw.build.openclawVersion` ausdrücklich deklarieren.
  `package.json.version` auf oberster Ebene wird nicht als Fallback für die Veröffentlichungsvalidierung verwendet.
- `--dry-run` zeigt eine Vorschau der aufgelösten Veröffentlichungs-Payload ohne Upload.
- `--json` gibt maschinenlesbare Ausgabe für CI aus.
- `--owner <handle>` veröffentlicht unter einem Benutzer- oder Org-Publisher-Handle, wenn der Akteur Publisher-Zugriff hat.
- Namen von Scoped Packages müssen zum ausgewählten Eigentümer passen. Siehe `docs/publishing.md`.
- Vorhandene Flags (`--family`, `--name`, `--version`, `--source-repo`, `--source-commit`, `--source-ref`, `--source-path`) funktionieren weiterhin als Überschreibungen.
- Private GitHub-Repositorys erfordern `GITHUB_TOKEN`.

#### Empfohlener lokaler Ablauf

Verwenden Sie zuerst `--dry-run`, damit Sie die aufgelösten Paketmetadaten und
die Quellzuordnung bestätigen können, bevor Sie ein Live-Release erstellen:

```bash
npm pack
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin --dry-run
clawhub package publish ./my-plugin-1.2.3.tgz --family code-plugin
```

#### Ablauf für lokale Ordner

Bei Code-Plugins erstellt die Ordnerveröffentlichung ein ClawPack-Artefakt aus
dem Paketordner und lädt es hoch:

```bash
clawhub package publish ./my-plugin --family code-plugin --dry-run
clawhub package publish ./my-plugin --family code-plugin
```

#### Minimale `package.json` für `--family code-plugin`

Externe Code-Plugins benötigen eine kleine Menge an OpenClaw-Metadaten in
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
  ClawHub kann sie anzeigen, wenn sie vorhanden sind, sie sind jedoch für die Veröffentlichung nicht erforderlich.
- `openclaw.compat.minGatewayVersion` und
  `openclaw.build.pluginSdkVersion` sind optionale Extras, wenn Sie
  detailliertere Kompatibilitätsmetadaten veröffentlichen möchten.
- Wenn Sie ein älteres `clawhub`-CLI-Release verwenden, führen Sie vor der Veröffentlichung ein Upgrade durch, damit
  die lokalen Preflight-Prüfungen vor dem Upload ausgeführt werden.

#### GitHub Actions

ClawHub liefert außerdem einen offiziellen wiederverwendbaren Workflow unter
[`/.github/workflows/package-publish.yml`](https://github.com/openclaw/clawhub/blob/2dcaf25d23c4e19b9c14f705c2ce1fd1dc2949c1/.github/workflows/package-publish.yml)
für Plugin-Repositorys aus.

Typische Caller-Konfiguration:

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
- Pinnen Sie den wiederverwendbaren Workflow auf einen stabilen Tag oder eine vollständige Commit-SHA. Führen Sie Release-Veröffentlichungen nicht von `@main` aus.
- `pull_request` sollte `dry_run: true` verwenden, damit CI keine verschmutzenden Änderungen erzeugt.
- Echte Veröffentlichungen sollten auf vertrauenswürdige Events wie `workflow_dispatch` oder Tag-Pushes beschränkt sein.
- Vertrauenswürdige Veröffentlichung ohne Secret funktioniert nur bei `workflow_dispatch`; Tag-Pushes benötigen weiterhin `clawhub_token`.
- Halten Sie `clawhub_token` für die erste Veröffentlichung, nicht vertrauenswürdige Pakete oder Break-Glass-Veröffentlichungen verfügbar.
- Der Workflow lädt das JSON-Ergebnis als Artefakt hoch und stellt es als Workflow-Ausgaben bereit.

### `sync`

- Scannt nach lokalen Skill-Ordnern und veröffentlicht neue/geänderte.
- Roots können beliebige Ordner sein: ein Skills-Verzeichnis oder ein einzelner Skill-Ordner mit `SKILL.md`.
- Fügt Clawdbot-Skill-Roots automatisch hinzu, wenn `~/.clawdbot/clawdbot.json` vorhanden ist:
  - `agent.workspace/skills` (Haupt-Agent)
  - `routing.agents.*.workspace/skills` (pro Agent)
  - `~/.clawdbot/skills` (geteilt)
  - `skills.load.extraDirs` (geteilte Packs)
- Berücksichtigt `CLAWDBOT_CONFIG_PATH` / `CLAWDBOT_STATE_DIR` und `OPENCLAW_CONFIG_PATH` / `OPENCLAW_STATE_DIR`.
- Flags:
  - `--root <dir...>` zusätzliche Scan-Roots
  - `--all` ohne Nachfrage hochladen
  - `--dry-run` nur Plan anzeigen
  - `--bump patch|minor|major` (Standard: patch)
  - `--changelog <text>` (nicht interaktiv)
  - `--tags a,b,c` (Standard: latest)
  - `--concurrency <n>` (Standard: 4)

Telemetrie:

- Wird während `sync` gesendet, wenn Sie angemeldet sind, außer `CLAWHUB_DISABLE_TELEMETRY=1` (Legacy `CLAWDHUB_DISABLE_TELEMETRY=1`) ist gesetzt.
- Details: `docs/telemetry.md`.
