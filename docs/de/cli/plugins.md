---
read_when:
    - Sie möchten Gateway-Plugins oder kompatible Bundles installieren oder verwalten.
    - Sie möchten Fehler beim Laden von Plugins debuggen.
summary: CLI-Referenz für `openclaw plugins` (`list`, `install`, `marketplace`, `uninstall`, `enable/disable`, `doctor`)
title: Plugins
x-i18n:
    generated_at: "2026-04-25T18:18:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2ae8f71873fb90dc7acde2ac522228cc60603ba34322e5b6d031e8de7545684e
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

Gateway-Plugins, Hook-Pakete und kompatible Bundles verwalten.

Verwandt:

- Plugin-System: [Plugins](/de/tools/plugin)
- Bundle-Kompatibilität: [Plugin-Bundles](/de/plugins/bundles)
- Plugin-Manifest + Schema: [Plugin-Manifest](/de/plugins/manifest)
- Sicherheits-Härtung: [Sicherheit](/de/gateway/security)

## Befehle

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins install <path-or-spec>
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
openclaw plugins info <id>
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins uninstall <id>
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

Mitgelieferte Plugins werden mit OpenClaw ausgeliefert. Einige sind standardmäßig aktiviert (zum Beispiel
mitgelieferte Modell-Provider, mitgelieferte Sprach-Provider und das mitgelieferte Browser-
Plugin); andere erfordern `plugins enable`.

Native OpenClaw-Plugins müssen `openclaw.plugin.json` mit einem eingebetteten JSON-
Schema (`configSchema`, auch wenn es leer ist) ausliefern. Kompatible Bundles verwenden stattdessen
ihre eigenen Bundle-Manifeste.

`plugins list` zeigt `Format: openclaw` oder `Format: bundle`. Die ausführliche list/info-
Ausgabe zeigt außerdem den Bundle-Subtyp (`codex`, `claude` oder `cursor`) sowie erkannte Bundle-
Fähigkeiten.

### Installation

```bash
openclaw plugins install <package>                      # zuerst ClawHub, dann npm
openclaw plugins install clawhub:<package>              # nur ClawHub
openclaw plugins install <package> --force              # vorhandene Installation überschreiben
openclaw plugins install <package> --pin                # Version anheften
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # lokaler Pfad
openclaw plugins install <plugin>@<marketplace>         # Marketplace
openclaw plugins install <plugin> --marketplace <name>  # Marketplace (explizit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

Unqualifizierte Paketnamen werden zuerst mit ClawHub abgeglichen, dann mit npm. Sicherheitshinweis:
Behandeln Sie Plugin-Installationen so, als würden Sie Code ausführen. Bevorzugen Sie angeheftete Versionen.

Wenn Ihr Abschnitt `plugins` durch ein einzelnes Datei-`$include` gestützt wird, schreiben
`plugins install/update/enable/disable/uninstall` in diese eingebundene Datei und lassen `openclaw.json`
unverändert. Root-Includes, Include-Arrays und Includes mit benachbarten Überschreibungen schlagen
fail-closed fehl, statt abgeflacht zu werden. Siehe [Config-Includes](/de/gateway/configuration) für die unterstützten Formen.

Wenn die Konfiguration ungültig ist, schlägt `plugins install` normalerweise fail-closed fehl und weist Sie an,
zuerst `openclaw doctor --fix` auszuführen. Die einzige dokumentierte Ausnahme ist ein enger
Wiederherstellungspfad für mitgelieferte Plugins für Plugins, die sich explizit für
`openclaw.install.allowInvalidConfigRecovery` anmelden.

`--force` verwendet das vorhandene Installationsziel erneut und überschreibt ein bereits installiertes
Plugin oder Hook-Paket direkt vor Ort. Verwenden Sie dies, wenn Sie absichtlich dieselbe ID aus einem neuen
lokalen Pfad, Archiv, ClawHub-Paket oder npm-Artefakt neu installieren.
Für routinemäßige Upgrades eines bereits verfolgten npm-Plugins sollten Sie
`openclaw plugins update <id-or-npm-spec>` bevorzugen.

Wenn Sie `plugins install` für eine Plugin-ID ausführen, die bereits installiert ist, stoppt OpenClaw
und verweist Sie für ein normales Upgrade auf `plugins update <id-or-npm-spec>`
oder auf `plugins install <package> --force`, wenn Sie die aktuelle Installation wirklich aus einer anderen Quelle
überschreiben möchten.

`--pin` gilt nur für npm-Installationen. Es wird mit `--marketplace` nicht unterstützt,
weil Marketplace-Installationen Marketplace-Quellmetadaten statt einer
npm-Spezifikation speichern.

`--dangerously-force-unsafe-install` ist eine Break-Glass-Option für False Positives
im integrierten Scanner für gefährlichen Code. Sie erlaubt es, die Installation fortzusetzen, selbst
wenn der integrierte Scanner Befunde vom Typ `critical` meldet, aber sie umgeht **nicht**
Policy-Blocks für Plugin-`before_install`-Hooks und umgeht **nicht** Scan-
Fehlschläge.

Dieses CLI-Flag gilt für Plugin-Installations-/Update-Abläufe. Gateway-gestützte Skill-
Abhängigkeitsinstallationen verwenden die passende Request-Überschreibung `dangerouslyForceUnsafeInstall`, während
`openclaw skills install` ein separater ClawHub-Skill-Download-/Installationsablauf bleibt.

`plugins install` ist auch die Installationsoberfläche für Hook-Pakete, die
`openclaw.hooks` in `package.json` bereitstellen. Verwenden Sie `openclaw hooks` für gefilterte Hook-
Sichtbarkeit und das Aktivieren einzelner Hooks, nicht für die Paketinstallation.

Npm-Spezifikationen sind **nur Registry** (Paketname + optional **exakte Version** oder
**Dist-Tag**). Git-/URL-/Datei-Spezifikationen und Semver-Bereiche werden abgelehnt. Abhängigkeits-
Installationen laufen aus Sicherheitsgründen mit `--ignore-scripts`.

Unqualifizierte Spezifikationen und `@latest` bleiben auf dem Stable-Track. Wenn npm eine dieser
Optionen zu einer Vorabversion auflöst, stoppt OpenClaw und fordert Sie auf, sich explizit mit einem
Vorabversions-Tag wie `@beta`/`@rc` oder einer exakten Vorabversionsversion wie
`@1.2.3-beta.4` dafür zu entscheiden.

Wenn eine unqualifizierte Installationsspezifikation einer ID eines mitgelieferten Plugins entspricht (zum Beispiel `diffs`), installiert OpenClaw
das mitgelieferte Plugin direkt. Um ein npm-Paket mit demselben Namen zu installieren,
verwenden Sie eine explizite Scoped-Spezifikation (zum Beispiel `@scope/diffs`).

Unterstützte Archive: `.zip`, `.tgz`, `.tar.gz`, `.tar`.

Installationen aus dem Claude-Marketplace werden ebenfalls unterstützt.

ClawHub-Installationen verwenden einen expliziten Locator `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw bevorzugt jetzt auch ClawHub für unqualifizierte npm-sichere Plugin-Spezifikationen. Es greift nur dann auf
npm zurück, wenn ClawHub dieses Paket oder diese Version nicht hat:

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw lädt das Paketarchiv von ClawHub herunter, prüft die beworbene
Plugin-API-/Mindest-Gateway-Kompatibilität und installiert es dann über den normalen
Archivpfad. Aufgezeichnete Installationen behalten ihre ClawHub-Quellmetadaten für spätere
Updates.

Verwenden Sie die Kurzform `plugin@marketplace`, wenn der Marketplace-Name im lokalen
Registry-Cache von Claude unter `~/.claude/plugins/known_marketplaces.json` vorhanden ist:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Verwenden Sie `--marketplace`, wenn Sie die Marketplace-Quelle explizit angeben möchten:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

Marketplace-Quellen können sein:

- ein Claude-Known-Marketplace-Name aus `~/.claude/plugins/known_marketplaces.json`
- ein lokaler Marketplace-Root oder `marketplace.json`-Pfad
- eine GitHub-Repo-Kurzform wie `owner/repo`
- eine GitHub-Repo-URL wie `https://github.com/owner/repo`
- eine Git-URL

Bei Remote-Marketplaces, die von GitHub oder Git geladen werden, müssen Plugin-Einträge
innerhalb des geklonten Marketplace-Repos bleiben. OpenClaw akzeptiert relative Pfadquellen aus
diesem Repo und lehnt HTTP(S)-, Absolute-Path-, Git-, GitHub- und andere Nicht-Pfad-
Plugin-Quellen aus Remote-Manifesten ab.

Für lokale Pfade und Archive erkennt OpenClaw automatisch:

- native OpenClaw-Plugins (`openclaw.plugin.json`)
- Codex-kompatible Bundles (`.codex-plugin/plugin.json`)
- Claude-kompatible Bundles (`.claude-plugin/plugin.json` oder das Standard-Layout für Claude-
  Komponenten)
- Cursor-kompatible Bundles (`.cursor-plugin/plugin.json`)

Kompatible Bundles werden in den normalen Plugin-Root installiert und nehmen am
gleichen list/info/enable/disable-Ablauf teil. Derzeit werden Bundle-Skills, Claude
command-skills, Claude-`settings.json`-Standardeinstellungen, Claude-`.lsp.json` /
in Manifesten deklarierte `lspServers`-Standardeinstellungen, Cursor-command-skills und kompatible
Codex-Hook-Verzeichnisse unterstützt; andere erkannte Bundle-Fähigkeiten werden in Diagnosen/Info angezeigt,
sind aber noch nicht an die Laufzeitausführung angebunden.

### Liste

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Verwenden Sie `--enabled`, um nur aktivierte Plugins anzuzeigen. Verwenden Sie `--verbose`, um von der
Tabellenansicht zu Detailzeilen pro Plugin mit Quelle/Ursprung/Version/Aktivierungs-
Metadaten zu wechseln. Verwenden Sie `--json` für maschinenlesbares Inventar plus Registry-
Diagnosen.

`plugins list` liest zuerst die persistierte lokale Plugin-Registry mit einem
abgeleiteten Fallback nur aus dem Manifest, wenn die Registry fehlt oder ungültig ist. Dies ist
nützlich, um zu prüfen, ob ein Plugin installiert, aktiviert und für die Planung beim Kaltstart
sichtbar ist, aber es ist keine Live-Laufzeitprüfung eines bereits laufenden
Gateway-Prozesses. Nach Änderungen am Plugin-Code, an der Aktivierung, an der Hook-Policy oder an
`plugins.load.paths` starten Sie das Gateway neu, das den Kanal bedient, bevor Sie erwarten,
dass neuer `register(api)`-Code oder Hooks ausgeführt werden. Bei Remote-/Container-
Deployments vergewissern Sie sich, dass Sie den tatsächlichen Child-Prozess `openclaw gateway run`
neu starten und nicht nur einen Wrapper-Prozess.

Für das Debugging von Laufzeit-Hooks:

- `openclaw plugins inspect <id> --json` zeigt registrierte Hooks und Diagnosen
  aus einem modulgeladenen Inspektionsdurchlauf.
- `openclaw gateway status --deep --require-rpc` bestätigt das erreichbare Gateway,
  Service-/Prozesshinweise, den Konfigurationspfad und den RPC-Zustand.
- Nicht mitgelieferte Konversations-Hooks (`llm_input`, `llm_output`, `agent_end`) erfordern
  `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Verwenden Sie `--link`, um das Kopieren eines lokalen Verzeichnisses zu vermeiden (fügt zu `plugins.load.paths` hinzu):

```bash
openclaw plugins install -l ./my-plugin
```

`--force` wird mit `--link` nicht unterstützt, weil verlinkte Installationen den
Quellpfad wiederverwenden, statt über ein verwaltetes Installationsziel zu kopieren.

Verwenden Sie `--pin` bei npm-Installationen, um die aufgelöste exakte Spezifikation (`name@version`) in
`plugins.installs` zu speichern, während das Standardverhalten ungepinnt bleibt.

### Deinstallation

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` entfernt Plugin-Einträge aus `plugins.entries`, `plugins.installs`,
der Plugin-Allowlist und gegebenenfalls verlinkte `plugins.load.paths`-Einträge.
Bei Active Memory-Plugins wird der Memory-Slot auf `memory-core` zurückgesetzt.

Standardmäßig entfernt die Deinstallation auch das Plugin-Installationsverzeichnis unter dem aktiven
Plugin-Root des State-Dirs. Verwenden Sie
`--keep-files`, um die Dateien auf dem Datenträger zu behalten.

`--keep-config` wird als veralteter Alias für `--keep-files` unterstützt.

### Update

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Updates gelten für nachverfolgte Installationen in `plugins.installs` und nachverfolgte Hook-Paket-
Installationen in `hooks.internal.installs`.

Wenn Sie eine Plugin-ID übergeben, verwendet OpenClaw die aufgezeichnete Installationsspezifikation für dieses
Plugin wieder. Das bedeutet, dass zuvor gespeicherte Dist-Tags wie `@beta` und exakt angeheftete
Versionen auch bei späteren `update <id>`-Ausführungen weiter verwendet werden.

Bei npm-Installationen können Sie außerdem eine explizite npm-Paketspezifikation mit einem Dist-Tag
oder einer exakten Version übergeben. OpenClaw löst diesen Paketnamen zurück auf den nachverfolgten Plugin-
Eintrag auf, aktualisiert dieses installierte Plugin und zeichnet die neue npm-Spezifikation für zukünftige
ID-basierte Updates auf.

Die Übergabe des npm-Paketnamens ohne Version oder Tag löst ebenfalls zurück auf den
nachverfolgten Plugin-Eintrag auf. Verwenden Sie dies, wenn ein Plugin auf eine exakte Version angeheftet war und
Sie es zurück auf die Standard-Release-Linie der Registry bewegen möchten.

Vor einem Live-npm-Update prüft OpenClaw die installierte Paketversion anhand der npm-Registry-Metadaten. Wenn die installierte Version und die aufgezeichnete Artefakt-
Identität bereits mit dem aufgelösten Ziel übereinstimmen, wird das Update übersprungen, ohne
herunterzuladen, neu zu installieren oder `openclaw.json` neu zu schreiben.

Wenn ein gespeicherter Integritäts-Hash vorhanden ist und sich der Hash des abgerufenen Artefakts ändert,
behandelt OpenClaw dies als npm-Artefakt-Drift. Der interaktive
Befehl `openclaw plugins update` gibt die erwarteten und tatsächlichen Hashes aus und fragt
vor dem Fortfahren nach einer Bestätigung. Nicht interaktive Update-Helfer schlagen fail-closed
fehl, sofern der Aufrufer keine explizite Fortsetzungsrichtlinie angibt.

`--dangerously-force-unsafe-install` ist auch bei `plugins update` als
Break-Glass-Override für False Positives des integrierten gefährlichen-Code-Scans während
Plugin-Updates verfügbar. Es umgeht weiterhin keine Policy-Blocks für Plugin-`before_install`
und keine Blockierung bei Scan-Fehlschlägen, und es gilt nur für Plugin-Updates, nicht für Hook-Paket-Updates.

### Inspizieren

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Tiefgehende Inspektion für ein einzelnes Plugin. Zeigt Identität, Ladestatus, Quelle,
registrierte Fähigkeiten, Hooks, Tools, Befehle, Services, Gateway-Methoden,
HTTP-Routen, Policy-Flags, Diagnosen, Installationsmetadaten, Bundle-Fähigkeiten
sowie erkannte MCP- oder LSP-Server-Unterstützung.

Jedes Plugin wird danach klassifiziert, was es zur Laufzeit tatsächlich registriert:

- **plain-capability** — ein Fähigkeitstyp (z. B. ein Plugin nur für Provider)
- **hybrid-capability** — mehrere Fähigkeitstypen (z. B. Text + Sprache + Bilder)
- **hook-only** — nur Hooks, keine Fähigkeiten oder Oberflächen
- **non-capability** — Tools/Befehle/Services, aber keine Fähigkeiten

Siehe [Plugin-Formen](/de/plugins/architecture#plugin-shapes) für mehr zum Fähigkeitsmodell.

Das Flag `--json` gibt einen maschinenlesbaren Bericht aus, der sich für Skripting und
Auditing eignet.

`inspect --all` rendert eine Tabelle für die gesamte Flotte mit Spalten für Form, Fähigkeitstypen,
Kompatibilitätshinweise, Bundle-Fähigkeiten und Hook-Zusammenfassung.

`info` ist ein Alias für `inspect`.

### Doctor

```bash
openclaw plugins doctor
```

`doctor` meldet Fehler beim Laden von Plugins, Manifest-/Discovery-Diagnosen und
Kompatibilitätshinweise. Wenn alles sauber ist, wird `No plugin issues
detected.` ausgegeben.

Bei Modulform-Fehlern wie fehlenden Exporten `register`/`activate` führen Sie den Befehl erneut
mit `OPENCLAW_PLUGIN_LOAD_DEBUG=1` aus, um eine kompakte Zusammenfassung der Exportform in
die Diagnoseausgabe aufzunehmen.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Die lokale Plugin-Registry ist OpenClaws persistiertes Kaltlesemodell für installierte
Plugin-Identität, Aktivierungsstatus, Quellmetadaten und Eigentümerschaft von Beiträgen.
Normaler Start, Lookup des Provider-Besitzers, Klassifizierung der Kanal-Einrichtung und Plugin-
Inventar können sie lesen, ohne Laufzeitmodule von Plugins zu importieren.

Verwenden Sie `plugins registry`, um zu prüfen, ob die persistierte Registry vorhanden,
aktuell oder veraltet ist. Verwenden Sie `--refresh`, um sie aus dem dauerhaften Installations-
Ledger, der Config-Policy und Manifest-/Paketmetadaten neu zu erstellen. Dies ist ein Reparaturpfad, kein
Laufzeit-Aktivierungspfad.

`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` ist ein veralteter Break-Glass-
Kompatibilitätsschalter für Registry-Lesefehler. Bevorzugen Sie `plugins registry
--refresh` oder `openclaw doctor --fix`; der Env-Fallback ist nur für die Notfall-
Startwiederherstellung gedacht, während die Migration ausgerollt wird.

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace list akzeptiert einen lokalen Marketplace-Pfad, einen `marketplace.json`-Pfad, eine
GitHub-Kurzform wie `owner/repo`, eine GitHub-Repo-URL oder eine Git-URL. `--json`
gibt das aufgelöste Quelllabel sowie das geparste Marketplace-Manifest und die
Plugin-Einträge aus.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Plugins erstellen](/de/plugins/building-plugins)
- [Community-Plugins](/de/plugins/community)
