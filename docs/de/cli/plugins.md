---
read_when:
    - Sie möchten Gateway-Plugins oder kompatible Bundles installieren oder verwalten.
    - Sie möchten Plugin-Ladefehler debuggen.
summary: CLI-Referenz für `openclaw plugins` (auflisten, installieren, Marketplace, deinstallieren, aktivieren/deaktivieren, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-04-23T06:27:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: ad76a8068054d145db578ed01f1fb0726fff884c48d256ad8c0b708a516cd727
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

Gateway-Plugins, Hook-Pakete und kompatible Bundles verwalten.

Verwandt:

- Plugin-System: [Plugins](/de/tools/plugin)
- Bundle-Kompatibilität: [Plugin-Bundles](/de/plugins/bundles)
- Plugin-Manifest + Schema: [Plugin-Manifest](/de/plugins/manifest)
- Sicherheitshärtung: [Sicherheit](/de/gateway/security)

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
openclaw plugins uninstall <id>
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

Mit OpenClaw werden gebündelte Plugins ausgeliefert. Einige sind standardmäßig
aktiviert (zum Beispiel gebündelte Modell-Provider, gebündelte Sprach-Provider und das gebündelte Browser-
Plugin); andere erfordern `plugins enable`.

Native OpenClaw-Plugins müssen `openclaw.plugin.json` mit einem eingebetteten JSON-
Schema (`configSchema`, auch wenn leer) ausliefern. Kompatible Bundles verwenden stattdessen ihre
eigenen Bundle-Manifeste.

`plugins list` zeigt `Format: openclaw` oder `Format: bundle`. Ausführliche List-/Info-
Ausgabe zeigt außerdem den Bundle-Untertyp (`codex`, `claude` oder `cursor`) sowie erkannte Bundle-
Fähigkeiten.

### Installieren

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

Reine Paketnamen werden zuerst gegen ClawHub geprüft, dann gegen npm. Sicherheitshinweis:
Behandeln Sie Plugin-Installationen wie das Ausführen von Code. Bevorzugen Sie angeheftete Versionen.

Wenn die Konfiguration ungültig ist, schlägt `plugins install` normalerweise fail-closed fehl und fordert Sie auf,
zuerst `openclaw doctor --fix` auszuführen. Die einzige dokumentierte Ausnahme ist ein enger
Wiederherstellungspfad für gebündelte Plugins für Plugins, die sich ausdrücklich für
`openclaw.install.allowInvalidConfigRecovery` anmelden.

`--force` verwendet das vorhandene Installationsziel erneut und überschreibt ein bereits installiertes
Plugin oder Hook-Paket direkt an Ort und Stelle. Verwenden Sie dies, wenn Sie absichtlich dieselbe
ID aus einem neuen lokalen Pfad, Archiv, ClawHub-Paket oder npm-Artefakt neu installieren.
Für routinemäßige Upgrades eines bereits verfolgten npm-Plugins bevorzugen Sie
`openclaw plugins update <id-or-npm-spec>`.

`--pin` gilt nur für npm-Installationen. Es wird mit `--marketplace` nicht unterstützt,
weil Marketplace-Installationen Marketplace-Quellmetadaten statt einer
npm-Spezifikation persistieren.

`--dangerously-force-unsafe-install` ist eine Break-Glass-Option für Fehlalarme
im integrierten Scanner für gefährlichen Code. Sie erlaubt, dass die Installation fortgesetzt wird, selbst
wenn der integrierte Scanner Befunde der Stufe `critical` meldet, umgeht aber **nicht**
Richtlinienblockierungen durch Plugin-`before_install`-Hooks und umgeht **nicht** Scan-
Fehlschläge.

Dieses CLI-Flag gilt für Plugin-Installations-/Update-Abläufe. Gateway-gestützte Installationen von Skill-
Abhängigkeiten verwenden die entsprechende Request-Überschreibung `dangerouslyForceUnsafeInstall`, während `openclaw skills install` ein separater ClawHub-Skill-
Download-/Installationsablauf bleibt.

`plugins install` ist auch die Installationsoberfläche für Hook-Pakete, die
`openclaw.hooks` in `package.json` verfügbar machen. Verwenden Sie `openclaw hooks` für gefilterte Hook-
Sichtbarkeit und Hook-Aktivierung pro Hook, nicht für Paketinstallation.

Npm-Spezifikationen sind **nur Registry** (Paketname + optional **exakte Version** oder
**dist-tag**). Git-/URL-/Datei-Spezifikationen und Semver-Bereiche werden abgelehnt. Abhängigkeitsinstallationen laufen aus Sicherheitsgründen mit `--ignore-scripts`.

Reine Spezifikationen und `@latest` bleiben auf dem stabilen Pfad. Wenn npm beides auf
ein Prerelease auflöst, stoppt OpenClaw und fordert Sie auf, sich explizit mit einem
Prerelease-Tag wie `@beta`/`@rc` oder einer exakten Prerelease-Version wie
`@1.2.3-beta.4` dafür anzumelden.

Wenn eine reine Installationsspezifikation mit einer gebündelten Plugin-ID übereinstimmt (zum Beispiel `diffs`), installiert OpenClaw
das gebündelte Plugin direkt. Um ein npm-Paket mit demselben
Namen zu installieren, verwenden Sie eine explizite Scoped-Spezifikation (zum Beispiel `@scope/diffs`).

Unterstützte Archive: `.zip`, `.tgz`, `.tar.gz`, `.tar`.

Claude-Marketplace-Installationen werden ebenfalls unterstützt.

ClawHub-Installationen verwenden einen expliziten Locator `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw bevorzugt jetzt auch ClawHub für reine npm-sichere Plugin-Spezifikationen. Es fällt nur
auf npm zurück, wenn ClawHub dieses Paket oder diese Version nicht hat:

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw lädt das Paketarchiv von ClawHub herunter, prüft die beworbene
Plugin-API-/minimale Gateway-Kompatibilität und installiert es dann über den normalen
Archivpfad. Aufgezeichnete Installationen behalten ihre ClawHub-Quellmetadaten für spätere
Updates.

Verwenden Sie die Kurzform `plugin@marketplace`, wenn der Marketplace-Name im lokalen Registry-Cache von Claude unter `~/.claude/plugins/known_marketplaces.json` existiert:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Verwenden Sie `--marketplace`, wenn Sie die Marketplace-Quelle explizit übergeben möchten:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

Marketplace-Quellen können sein:

- ein Claude-Name für einen bekannten Marketplace aus `~/.claude/plugins/known_marketplaces.json`
- ein lokaler Marketplace-Root oder `marketplace.json`-Pfad
- eine GitHub-Repo-Kurzform wie `owner/repo`
- eine GitHub-Repo-URL wie `https://github.com/owner/repo`
- eine Git-URL

Bei Remote-Marketplaces, die von GitHub oder Git geladen werden, müssen Plugin-Einträge
innerhalb des geklonten Marketplace-Repos bleiben. OpenClaw akzeptiert relative Pfadquellen aus
diesem Repo und lehnt HTTP(S)-, Absolutpfad-, Git-, GitHub- und andere Nicht-Pfad-
Plugin-Quellen aus Remote-Manifesten ab.

Für lokale Pfade und Archive erkennt OpenClaw automatisch:

- native OpenClaw-Plugins (`openclaw.plugin.json`)
- Codex-kompatible Bundles (`.codex-plugin/plugin.json`)
- Claude-kompatible Bundles (`.claude-plugin/plugin.json` oder das Standard-Claude-
  Komponentenlayout)
- Cursor-kompatible Bundles (`.cursor-plugin/plugin.json`)

Kompatible Bundles werden im normalen Erweiterungs-Root installiert und nehmen
am selben List-/Info-/Aktivieren-/Deaktivieren-Ablauf teil. Heute werden Bundle-Skills, Claude
command-skills, Claude-`settings.json`-Standardwerte, Claude-`.lsp.json` /
manifestdeklarierte `lspServers`-Standardwerte, Cursor-command-skills und kompatible
Codex-Hook-Verzeichnisse unterstützt; andere erkannte Bundle-Fähigkeiten werden
in Diagnose/Info angezeigt, sind aber noch nicht in die Laufzeitausführung eingebunden.

### Auflisten

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Verwenden Sie `--enabled`, um nur geladene Plugins anzuzeigen. Verwenden Sie `--verbose`, um von der
Tabellenansicht zu Detailzeilen pro Plugin mit Quellen-/Ursprungs-/Versions-/Aktivierungs-
Metadaten zu wechseln. Verwenden Sie `--json` für maschinenlesbares Inventar plus Registry-
Diagnose.

Verwenden Sie `--link`, um das Kopieren eines lokalen Verzeichnisses zu vermeiden (fügt zu `plugins.load.paths` hinzu):

```bash
openclaw plugins install -l ./my-plugin
```

`--force` wird mit `--link` nicht unterstützt, weil verlinkte Installationen den
Quellpfad wiederverwenden, statt ein verwaltetes Installationsziel zu überschreiben.

Verwenden Sie `--pin` bei npm-Installationen, um die aufgelöste exakte Spezifikation (`name@version`) in
`plugins.installs` zu speichern, während das Standardverhalten unangepinnt bleibt.

### Deinstallieren

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` entfernt Plugin-Einträge aus `plugins.entries`, `plugins.installs`,
der Plugin-Zulassungsliste und verlinkten `plugins.load.paths`-Einträgen, sofern zutreffend.
Bei Active Memory-Plugins wird der Speicher-Slot auf `memory-core` zurückgesetzt.

Standardmäßig entfernt deinstallieren außerdem das Plugin-Installationsverzeichnis unter dem aktiven
Plugin-Root des Statusverzeichnisses. Verwenden Sie
`--keep-files`, um Dateien auf dem Datenträger zu behalten.

`--keep-config` wird als veralteter Alias für `--keep-files` unterstützt.

### Aktualisieren

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Updates gelten für verfolgte Installationen in `plugins.installs` und verfolgte Hook-Paket-
Installationen in `hooks.internal.installs`.

Wenn Sie eine Plugin-ID übergeben, verwendet OpenClaw die aufgezeichnete Installationsspezifikation für dieses
Plugin erneut. Das bedeutet, dass zuvor gespeicherte dist-tags wie `@beta` und exakte angeheftete
Versionen auch bei späteren `update <id>`-Läufen weiterverwendet werden.

Bei npm-Installationen können Sie außerdem eine explizite npm-Paketspezifikation mit einem dist-tag
oder einer exakten Version übergeben. OpenClaw löst diesen Paketnamen zurück auf den verfolgten Plugin-
Eintrag auf, aktualisiert dieses installierte Plugin und zeichnet die neue npm-Spezifikation für zukünftige
ID-basierte Updates auf.

Das Übergeben des npm-Paketnamens ohne Version oder Tag wird ebenfalls zurück auf den
verfolgten Plugin-Eintrag aufgelöst. Verwenden Sie dies, wenn ein Plugin auf eine exakte Version angeheftet war und
Sie es wieder auf die Standard-Release-Linie der Registry zurückführen möchten.

Vor einem Live-npm-Update prüft OpenClaw die installierte Paketversion gegen
die npm-Registry-Metadaten. Wenn installierte Version und aufgezeichnete Artefakt-
Identität bereits dem aufgelösten Ziel entsprechen, wird das Update übersprungen, ohne
herunterzuladen, neu zu installieren oder `openclaw.json` neu zu schreiben.

Wenn ein gespeicherter Integrity-Hash existiert und sich der Hash des abgerufenen Artefakts ändert,
behandelt OpenClaw dies als npm-Artefakt-Drift. Der interaktive
Befehl `openclaw plugins update` gibt die erwarteten und tatsächlichen Hashes aus und fragt
vor dem Fortfahren nach Bestätigung. Nicht interaktive Update-Helfer schlagen fail-closed fehl,
es sei denn, der Aufrufer liefert eine explizite Fortsetzungsrichtlinie.

`--dangerously-force-unsafe-install` ist auch bei `plugins update` als
Break-Glass-Überschreibung für Fehlalarme des integrierten gefährlicher-Code-Scans während
Plugin-Updates verfügbar. Es umgeht weiterhin keine Plugin-`before_install`-Richtlinienblockierungen
oder Blockierungen wegen Scan-Fehlschlägen, und es gilt nur für Plugin-Updates, nicht für Hook-Paket-
Updates.

### Prüfen

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Tiefe Introspektion für ein einzelnes Plugin. Zeigt Identität, Ladestatus, Quelle,
registrierte Fähigkeiten, Hooks, Tools, Befehle, Dienste, Gateway-Methoden,
HTTP-Routen, Richtlinien-Flags, Diagnose, Installationsmetadaten, Bundle-Fähigkeiten
und erkannte MCP- oder LSP-Server-Unterstützung.

Jedes Plugin wird danach klassifiziert, was es zur Laufzeit tatsächlich registriert:

- **plain-capability** — ein Fähigkeitstyp (z. B. ein reines Provider-Plugin)
- **hybrid-capability** — mehrere Fähigkeitstypen (z. B. Text + Sprache + Bilder)
- **hook-only** — nur Hooks, keine Fähigkeiten oder Oberflächen
- **non-capability** — Tools/Befehle/Dienste, aber keine Fähigkeiten

Siehe [Plugin-Formen](/de/plugins/architecture#plugin-shapes) für mehr zum Fähigkeitsmodell.

Das Flag `--json` gibt einen maschinenlesbaren Bericht aus, der für Skripting und
Auditing geeignet ist.

`inspect --all` rendert eine tabellarische Übersicht über die gesamte Flotte mit Spalten für Form, Fähigkeitstypen,
Kompatibilitätshinweise, Bundle-Fähigkeiten und Hook-Zusammenfassung.

`info` ist ein Alias für `inspect`.

### Doctor

```bash
openclaw plugins doctor
```

`doctor` meldet Plugin-Ladefehler, Manifest-/Discovery-Diagnosen und
Kompatibilitätshinweise. Wenn alles in Ordnung ist, wird `No plugin issues
detected.` ausgegeben.

Bei Modulform-Fehlern wie fehlenden `register`-/`activate`-Exports führen Sie den Befehl
erneut mit `OPENCLAW_PLUGIN_LOAD_DEBUG=1` aus, um eine kompakte Zusammenfassung der Exportform in
die Diagnoseausgabe aufzunehmen.

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace list akzeptiert einen lokalen Marketplace-Pfad, einen `marketplace.json`-Pfad, eine
GitHub-Kurzform wie `owner/repo`, eine GitHub-Repo-URL oder eine Git-URL. `--json`
gibt das aufgelöste Quellenlabel sowie das geparste Marketplace-Manifest und
Plugin-Einträge aus.
