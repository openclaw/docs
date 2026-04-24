---
read_when:
    - Sie möchten Gateway-Plugins oder kompatible Bundles installieren oder verwalten.
    - Sie möchten Fehler beim Laden von Plugins debuggen.
summary: CLI-Referenz für `openclaw plugins` (list, install, marketplace, uninstall, aktivieren/deaktivieren, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-04-24T15:21:28Z"
    model: gpt-5.4
    provider: openai
    source_hash: bc693d5e3bc49057e1a108ba65a4dcb3bb662c00229e6fa38a0335afba8240e5
    source_path: cli/plugins.md
    workflow: 15
---

# `openclaw plugins`

Verwalten Sie Gateway-Plugins, Hook-Pakete und kompatible Bundles.

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
openclaw plugins uninstall <id>
openclaw plugins doctor
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins marketplace list <marketplace>
openclaw plugins marketplace list <marketplace> --json
```

Mit OpenClaw mitgelieferte Plugins werden zusammen mit OpenClaw ausgeliefert. Einige sind standardmäßig aktiviert (zum Beispiel mitgelieferte Modell-Provider, mitgelieferte Sprach-Provider und das mitgelieferte Browser-Plugin); andere erfordern `plugins enable`.

Native OpenClaw-Plugins müssen `openclaw.plugin.json` mit einem eingebetteten JSON-Schema (`configSchema`, auch wenn es leer ist) ausliefern. Kompatible Bundles verwenden stattdessen ihre eigenen Bundle-Manifeste.

`plugins list` zeigt `Format: openclaw` oder `Format: bundle`. Die ausführliche Ausgabe von list/info zeigt außerdem den Bundle-Subtyp (`codex`, `claude` oder `cursor`) sowie erkannte Bundle-Fähigkeiten.

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

Reine Paketnamen werden zuerst in ClawHub und dann in npm geprüft. Sicherheitshinweis: Behandeln Sie Plugin-Installationen so, als würden Sie Code ausführen. Bevorzugen Sie angeheftete Versionen.

Wenn Ihr Abschnitt `plugins` durch ein einteiliges `$include` unterstützt wird, schreiben `plugins install/update/enable/disable/uninstall` in diese eingebundene Datei und lassen `openclaw.json` unverändert. Root-Includes, Include-Arrays und Includes mit benachbarten Überschreibungen schlagen fehlgeschlossen fehl, statt abgeflacht zu werden. Siehe [Config includes](/de/gateway/configuration) für die unterstützten Formen.

Wenn die Konfiguration ungültig ist, schlägt `plugins install` normalerweise fehlgeschlossen fehl und weist Sie an, zuerst `openclaw doctor --fix` auszuführen. Die einzige dokumentierte Ausnahme ist ein enger Wiederherstellungspfad für mitgelieferte Plugins für Plugins, die sich ausdrücklich für `openclaw.install.allowInvalidConfigRecovery` anmelden.

`--force` verwendet das bestehende Installationsziel erneut und überschreibt ein bereits installiertes Plugin oder Hook-Paket direkt. Verwenden Sie es, wenn Sie dieselbe id absichtlich aus einem neuen lokalen Pfad, Archiv, ClawHub-Paket oder npm-Artefakt neu installieren. Für routinemäßige Upgrades eines bereits verfolgten npm-Plugins bevorzugen Sie `openclaw plugins update <id-or-npm-spec>`.

Wenn Sie `plugins install` für eine Plugin-id ausführen, die bereits installiert ist, stoppt OpenClaw und verweist Sie für ein normales Upgrade auf `plugins update <id-or-npm-spec>` oder auf `plugins install <package> --force`, wenn Sie die aktuelle Installation wirklich aus einer anderen Quelle überschreiben möchten.

`--pin` gilt nur für npm-Installationen. Es wird nicht mit `--marketplace` unterstützt, weil Marketplace-Installationen statt einer npm-Spezifikation Marketplace-Quellmetadaten speichern.

`--dangerously-force-unsafe-install` ist eine Notfalloption für False Positives im integrierten Scanner für gefährlichen Code. Sie erlaubt es, die Installation fortzusetzen, selbst wenn der integrierte Scanner Ergebnisse vom Typ `critical` meldet, aber sie umgeht **nicht** Policy-Sperren von Plugin-`before_install`-Hooks und umgeht **nicht** Scan-Fehler.

Dieses CLI-Flag gilt für Plugin-Installations-/Update-Abläufe. Gateway-gestützte Skill-Abhängigkeitsinstallationen verwenden die entsprechende Request-Überschreibung `dangerouslyForceUnsafeInstall`, während `openclaw skills install` ein separater ClawHub-Skill-Download-/Installationsablauf bleibt.

`plugins install` ist auch die Installationsoberfläche für Hook-Pakete, die `openclaw.hooks` in `package.json` verfügbar machen. Verwenden Sie `openclaw hooks` für gefilterte Hook-Sichtbarkeit und die Aktivierung pro Hook, nicht für die Paketinstallation.

Npm-Spezifikationen sind **nur Registry-Spezifikationen** (Paketname + optional **exakte Version** oder **dist-tag**). Git-/URL-/Datei-Spezifikationen und Semver-Bereiche werden abgelehnt. Abhängigkeitsinstallationen werden zur Sicherheit mit `--ignore-scripts` ausgeführt.

Reine Spezifikationen und `@latest` bleiben auf dem stabilen Track. Wenn npm eine dieser Angaben auf eine Vorabversion auflöst, stoppt OpenClaw und fordert Sie auf, sich explizit mit einem Vorabversions-Tag wie `@beta`/`@rc` oder einer exakten Vorabversionsnummer wie `@1.2.3-beta.4` anzumelden.

Wenn eine reine Installationsspezifikation mit einer id eines mitgelieferten Plugins übereinstimmt (zum Beispiel `diffs`), installiert OpenClaw das mitgelieferte Plugin direkt. Um ein npm-Paket mit demselben Namen zu installieren, verwenden Sie eine explizite Scoped-Spezifikation (zum Beispiel `@scope/diffs`).

Unterstützte Archive: `.zip`, `.tgz`, `.tar.gz`, `.tar`.

Claude-Marketplace-Installationen werden ebenfalls unterstützt.

ClawHub-Installationen verwenden einen expliziten Locator `clawhub:<package>`:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

OpenClaw bevorzugt jetzt auch ClawHub für reine npm-sichere Plugin-Spezifikationen. Es greift nur dann auf npm zurück, wenn ClawHub dieses Paket oder diese Version nicht hat:

```bash
openclaw plugins install openclaw-codex-app-server
```

OpenClaw lädt das Paketarchiv von ClawHub herunter, prüft die beworbene Plugin-API-/minimale Gateway-Kompatibilität und installiert es dann über den normalen Archivpfad. Erfasste Installationen behalten ihre ClawHub-Quellmetadaten für spätere Updates.

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
- ein lokales Marketplace-Root oder ein `marketplace.json`-Pfad
- eine GitHub-Repo-Kurzform wie `owner/repo`
- eine GitHub-Repo-URL wie `https://github.com/owner/repo`
- eine git-URL

Bei Remote-Marketplaces, die von GitHub oder git geladen werden, müssen Plugin-Einträge innerhalb des geklonten Marketplace-Repos bleiben. OpenClaw akzeptiert relative Pfadquellen aus diesem Repo und lehnt HTTP(S)-, absolute Pfad-, git-, GitHub- und andere Nicht-Pfad-Plugin-Quellen aus Remote-Manifesten ab.

Für lokale Pfade und Archive erkennt OpenClaw automatisch:

- native OpenClaw-Plugins (`openclaw.plugin.json`)
- Codex-kompatible Bundles (`.codex-plugin/plugin.json`)
- Claude-kompatible Bundles (`.claude-plugin/plugin.json` oder das standardmäßige Claude-Komponentenlayout)
- Cursor-kompatible Bundles (`.cursor-plugin/plugin.json`)

Kompatible Bundles werden im normalen Plugin-Root installiert und nehmen am selben list/info/enable/disable-Ablauf teil. Derzeit werden Bundle-Skills, Claude-Befehls-Skills, Claude-`settings.json`-Standardeinstellungen, Claude-`.lsp.json`-/manifestdeklarierte `lspServers`-Standardeinstellungen, Cursor-Befehls-Skills und kompatible Codex-Hook-Verzeichnisse unterstützt; andere erkannte Bundle-Fähigkeiten werden in Diagnosen/info angezeigt, sind aber noch nicht in die Laufzeitausführung eingebunden.

### Auflisten

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Verwenden Sie `--enabled`, um nur geladene Plugins anzuzeigen. Verwenden Sie `--verbose`, um von der Tabellenansicht zu Detailzeilen pro Plugin mit Quell-/Herkunfts-/Versions-/Aktivierungsmetadaten zu wechseln. Verwenden Sie `--json` für maschinenlesbares Inventar plus Registry-Diagnosen.

`plugins list` führt die Erkennung aus der aktuellen CLI-Umgebung und Konfiguration aus. Es ist nützlich, um zu prüfen, ob ein Plugin aktiviert/ladefähig ist, aber es ist keine Live-Laufzeitprüfung eines bereits laufenden Gateway-Prozesses. Nach Änderungen an Plugin-Code, Aktivierung, Hook-Policy oder `plugins.load.paths` starten Sie das Gateway, das den Kanal bedient, neu, bevor Sie erwarten, dass neuer `register(api)`-Code oder Hooks ausgeführt werden. Bei Remote-/Container-Deployments vergewissern Sie sich, dass Sie den tatsächlichen Child-Prozess `openclaw gateway run` neu starten und nicht nur einen Wrapper-Prozess.

Für das Debuggen von Runtime-Hooks:

- `openclaw plugins inspect <id> --json` zeigt registrierte Hooks und Diagnosen aus einem modulgeladenen Inspektionsdurchlauf.
- `openclaw gateway status --deep --require-rpc` bestätigt das erreichbare Gateway, Service-/Prozesshinweise, den Konfigurationspfad und die RPC-Gesundheit.
- Nicht mitgelieferte Konversations-Hooks (`llm_input`, `llm_output`, `agent_end`) erfordern `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Verwenden Sie `--link`, um das Kopieren eines lokalen Verzeichnisses zu vermeiden (fügt es zu `plugins.load.paths` hinzu):

```bash
openclaw plugins install -l ./my-plugin
```

`--force` wird mit `--link` nicht unterstützt, weil verknüpfte Installationen den Quellpfad wiederverwenden, statt in ein verwaltetes Installationsziel zu kopieren.

Verwenden Sie `--pin` bei npm-Installationen, um die aufgelöste exakte Spezifikation (`name@version`) in `plugins.installs` zu speichern, während das Standardverhalten ohne Anheftung beibehalten wird.

### Deinstallieren

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` entfernt Plugin-Einträge aus `plugins.entries`, `plugins.installs`, der Plugin-Allowlist und verknüpfte Einträge in `plugins.load.paths`, falls zutreffend. Bei Active Memory-Plugins wird der Speicher-Slot auf `memory-core` zurückgesetzt.

Standardmäßig entfernt uninstall auch das Plugin-Installationsverzeichnis unter dem aktiven State-Dir-Plugin-Root. Verwenden Sie `--keep-files`, um Dateien auf dem Datenträger zu behalten.

`--keep-config` wird als veralteter Alias für `--keep-files` unterstützt.

### Aktualisieren

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call@beta
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Aktualisierungen gelten für verfolgte Installationen in `plugins.installs` und verfolgte Hook-Paket-Installationen in `hooks.internal.installs`.

Wenn Sie eine Plugin-id übergeben, verwendet OpenClaw die für dieses Plugin gespeicherte Installationsspezifikation erneut. Das bedeutet, dass zuvor gespeicherte dist-tags wie `@beta` und exakt angeheftete Versionen auch bei späteren `update <id>`-Ausführungen weiterverwendet werden.

Bei npm-Installationen können Sie auch eine explizite npm-Paketspezifikation mit einem dist-tag oder einer exakten Version übergeben. OpenClaw löst diesen Paketnamen zurück auf den verfolgten Plugin-Eintrag auf, aktualisiert dieses installierte Plugin und speichert die neue npm-Spezifikation für zukünftige id-basierte Aktualisierungen.

Die Übergabe des npm-Paketnamens ohne Version oder Tag wird ebenfalls auf den verfolgten Plugin-Eintrag zurück aufgelöst. Verwenden Sie dies, wenn ein Plugin an eine exakte Version angeheftet war und Sie es zurück auf die Standard-Release-Linie der Registry verschieben möchten.

Vor einem Live-npm-Update prüft OpenClaw die installierte Paketversion anhand der npm-Registry-Metadaten. Wenn die installierte Version und die gespeicherte Artefaktidentität bereits dem aufgelösten Ziel entsprechen, wird das Update übersprungen, ohne herunterzuladen, neu zu installieren oder `openclaw.json` neu zu schreiben.

Wenn ein gespeicherter Integritäts-Hash vorhanden ist und sich der Hash des abgerufenen Artefakts ändert, behandelt OpenClaw dies als npm-Artefakt-Drift. Der interaktive Befehl `openclaw plugins update` gibt die erwarteten und tatsächlichen Hashes aus und fragt vor dem Fortfahren nach einer Bestätigung. Nicht interaktive Update-Helfer schlagen fehlgeschlossen fehl, es sei denn, der Aufrufer liefert eine explizite Fortsetzungs-Policy.

`--dangerously-force-unsafe-install` ist auf `plugins update` ebenfalls als Notfall-Überschreibung für False Positives bei der integrierten Prüfung auf gefährlichen Code während Plugin-Aktualisierungen verfügbar. Es umgeht weiterhin weder Policy-Sperren von Plugin-`before_install` noch die Sperrung bei Scan-Fehlern, und es gilt nur für Plugin-Aktualisierungen, nicht für Hook-Paket-Aktualisierungen.

### Untersuchen

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --json
```

Detaillierte Introspektion für ein einzelnes Plugin. Zeigt Identität, Ladestatus, Quelle, registrierte Fähigkeiten, Hooks, Tools, Befehle, Dienste, Gateway-Methoden, HTTP-Routen, Policy-Flags, Diagnosen, Installationsmetadaten, Bundle-Fähigkeiten und jede erkannte Unterstützung für MCP- oder LSP-Server.

Jedes Plugin wird danach klassifiziert, was es zur Laufzeit tatsächlich registriert:

- **plain-capability** — ein Fähigkeitstyp (z. B. ein reines Provider-Plugin)
- **hybrid-capability** — mehrere Fähigkeitstypen (z. B. Text + Sprache + Bilder)
- **hook-only** — nur Hooks, keine Fähigkeiten oder Oberflächen
- **non-capability** — Tools/Befehle/Dienste, aber keine Fähigkeiten

Siehe [Plugin shapes](/de/plugins/architecture#plugin-shapes) für weitere Informationen zum Fähigkeitsmodell.

Das Flag `--json` gibt einen maschinenlesbaren Bericht aus, der sich für Skripting und Audits eignet.

`inspect --all` rendert eine flottenweite Tabelle mit Spalten für Form, Fähigkeitsarten, Kompatibilitätshinweise, Bundle-Fähigkeiten und Hook-Zusammenfassung.

`info` ist ein Alias für `inspect`.

### Doctor

```bash
openclaw plugins doctor
```

`doctor` meldet Plugin-Ladefehler, Manifest-/Erkennungsdiagnosen und Kompatibilitätshinweise. Wenn alles sauber ist, gibt es `No plugin issues detected.` aus.

Bei Modulform-Fehlern wie fehlenden Exporten `register`/`activate` führen Sie den Befehl erneut mit `OPENCLAW_PLUGIN_LOAD_DEBUG=1` aus, um eine kompakte Zusammenfassung der Exportform in die Diagnoseausgabe aufzunehmen.

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace list akzeptiert einen lokalen Marketplace-Pfad, einen `marketplace.json`-Pfad, eine GitHub-Kurzform wie `owner/repo`, eine GitHub-Repo-URL oder eine git-URL. `--json` gibt das aufgelöste Quellenlabel sowie das geparste Marketplace-Manifest und die Plugin-Einträge aus.

## Verwandt

- [CLI-Referenz](/de/cli)
- [Plugins erstellen](/de/plugins/building-plugins)
- [Community-Plugins](/de/plugins/community)
