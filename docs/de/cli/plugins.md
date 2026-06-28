---
read_when:
    - Sie möchten Gateway-Plugins oder kompatible Bundles installieren oder verwalten
    - Sie möchten ein einfaches Tool-Plugin erstellen oder validieren
    - Sie möchten Plugin-Ladefehler debuggen
sidebarTitle: Plugins
summary: CLI-Referenz für `openclaw plugins` (init, build, validate, list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-06-28T20:42:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a703adb93af2490282f73b25cbbd95c7bc1d54c9c9c656fdb9b75465683f4ec8
    source_path: cli/plugins.md
    workflow: 16
---

Gateway-Plugins, Hook-Packs und kompatible Bundles verwalten.

<CardGroup cols={2}>
  <Card title="Plugin-System" href="/de/tools/plugin">
    Endbenutzerleitfaden zum Installieren, Aktivieren und Beheben von Problemen mit Plugins.
  </Card>
  <Card title="Plugins verwalten" href="/de/plugins/manage-plugins">
    Kurze Beispiele für Installation, Auflisten, Aktualisieren, Deinstallieren und Veröffentlichen.
  </Card>
  <Card title="Plugin-Bundles" href="/de/plugins/bundles">
    Kompatibilitätsmodell für Bundles.
  </Card>
  <Card title="Plugin-Manifest" href="/de/plugins/manifest">
    Manifestfelder und Konfigurationsschema.
  </Card>
  <Card title="Sicherheit" href="/de/gateway/security">
    Sicherheitshärtung für Plugin-Installationen.
  </Card>
</CardGroup>

## Befehle

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search <query>
openclaw plugins search <query> --limit 20
openclaw plugins search <query> --json
openclaw plugins install <path-or-spec>
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
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
openclaw plugins marketplace refresh
openclaw plugins marketplace refresh --feed-profile clawhub-public --json
openclaw plugins marketplace refresh --feed-url https://clawhub.ai/v1/feeds/plugins --expected-sha256 <sha256>
openclaw plugins init my-tool --name "My Tool"
openclaw plugins init my-provider --name "My Provider" --type provider
openclaw plugins init my-provider --name "My Provider" --type provider --directory ./my-provider
openclaw plugins build --entry ./dist/index.js
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
```

Führen Sie den Befehl bei der Untersuchung langsamer Installationen, Inspektionen, Deinstallationen oder Registry-Aktualisierungen mit `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` aus. Der Trace schreibt Phasenzeiten nach stderr und hält die JSON-Ausgabe parsebar. Siehe [Debugging](/de/help/debugging#plugin-lifecycle-trace).

<Note>
Im Nix-Modus (`OPENCLAW_NIX_MODE=1`) sind Mutatoren des Plugin-Lebenszyklus deaktiviert. Verwenden Sie für diese Installation die Nix-Quelle statt `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable` oder `plugins disable`; für nix-openclaw verwenden Sie den agent-first-[Quick Start](https://github.com/openclaw/nix-openclaw#quick-start).
</Note>

<Note>
Gebündelte Plugins werden mit OpenClaw ausgeliefert. Einige sind standardmäßig aktiviert (zum Beispiel gebündelte Modell-Provider, gebündelte Sprach-Provider und das gebündelte Browser-Plugin); andere erfordern `plugins enable`.

Native OpenClaw-Plugins müssen `openclaw.plugin.json` mit einem Inline-JSON-Schema (`configSchema`, auch wenn leer) ausliefern. Kompatible Bundles verwenden stattdessen ihre eigenen Bundle-Manifeste.

`plugins list` zeigt `Format: openclaw` oder `Format: bundle`. Ausführliche list/info-Ausgaben zeigen außerdem den Bundle-Untertyp (`codex`, `claude` oder `cursor`) sowie erkannte Bundle-Fähigkeiten.
</Note>

### Autor

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

`plugins init` erstellt standardmäßig ein minimales TypeScript-Tool-Plugin. Das erste Argument ist die Plugin-ID; übergeben Sie `--name` für den Anzeigenamen. OpenClaw verwendet die ID für das Standard-Ausgabeverzeichnis und die Paketbenennung. Tool-Scaffolds verwenden `defineToolPlugin`.
`plugins build` importiert den gebauten Einstiegspunkt, liest dessen statische Tool-Metadaten, schreibt `openclaw.plugin.json` und hält `package.json` `openclaw.extensions` synchron.
`plugins validate` prüft, dass das generierte Manifest, die Paketmetadaten und der aktuelle Einstiegspunkt-Export weiterhin übereinstimmen. Siehe [Tool-Plugins](/de/plugins/tool-plugins) für den vollständigen Workflow zur Tool-Erstellung.

Das Scaffold schreibt TypeScript-Quellcode, generiert Metadaten aber aus dem gebauten Einstiegspunkt `./dist/index.js`, sodass der Workflow auch mit der veröffentlichten CLI funktioniert. Verwenden Sie `--entry <path>`, wenn der Einstiegspunkt nicht der Standard-Paketeinstieg ist. Verwenden Sie `plugins build --check` in CI, um fehlzuschlagen, wenn generierte Metadaten veraltet sind, ohne Dateien neu zu schreiben.

### Provider-Scaffold

```bash
openclaw plugins init acme-models --name "Acme Models" --type provider
cd acme-models
npm install
npm run build
npm test
npm run validate
```

Provider-Scaffolds erstellen ein generisches Text-/Modell-Provider-Plugin mit OpenAI-kompatibler API-Schlüssel-Anbindung, einem integrierten `npm run validate`-Skript für `clawhub package validate`, ClawHub-Paketmetadaten und einem manuell ausgelösten GitHub-Workflow für zukünftiges vertrauenswürdiges Veröffentlichen über GitHub Actions OIDC. Provider-Scaffolds generieren keine Skills und verwenden weder `openclaw plugins build` noch `openclaw plugins validate`; diese Befehle sind für den Pfad der generierten Metadaten des Tool-Scaffolds vorgesehen.

Ersetzen Sie vor der Veröffentlichung die Platzhalter für API-Basis-URL, Modellkatalog, Docs-Route, Anmeldedatentext und README-Text durch echte Provider-Details. Verwenden Sie die generierte README für die erstmalige ClawHub-Veröffentlichung und die Einrichtung vertrauenswürdiger Publisher.

### Installation

```bash
openclaw plugins search "calendar"                   # search ClawHub plugins
openclaw plugins install <package>                      # source auto-detection
openclaw plugins install clawhub:<package>              # ClawHub only
openclaw plugins install npm:<package>                  # npm only
openclaw plugins install npm-pack:<path.tgz>            # local npm pack through npm install semantics
openclaw plugins install git:github.com/<owner>/<repo>  # git repo
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <package> --force              # overwrite existing install
openclaw plugins install <package> --pin                # pin version
openclaw plugins install clawhub:<package> --acknowledge-clawhub-risk
openclaw plugins install <package> --dangerously-force-unsafe-install
openclaw plugins install <path>                         # local path
openclaw plugins install <plugin>@<marketplace>         # marketplace
openclaw plugins install <plugin> --marketplace <name>  # marketplace (explicit)
openclaw plugins install <plugin> --marketplace https://github.com/<owner>/<repo>
```

Maintainer, die Installationen während der Einrichtung testen, können automatische Plugin-Installationsquellen mit geschützten Umgebungsvariablen überschreiben. Siehe [Überschreibungen für Plugin-Installationen](/de/plugins/install-overrides).

<Warning>
Bloße Paketnamen installieren während der Launch-Umstellung standardmäßig von npm, sofern sie nicht einer offiziellen Plugin-ID entsprechen. Unverarbeitete `@openclaw/*`-Paketspezifikationen, die gebündelten Plugins entsprechen, verwenden die gebündelte Kopie, die mit dem aktuellen OpenClaw-Build ausgeliefert wurde. Verwenden Sie `npm:<package>`, wenn Sie bewusst ein externes npm-Paket verwenden möchten. Verwenden Sie `clawhub:<package>` für ClawHub. Behandeln Sie Plugin-Installationen wie das Ausführen von Code. Bevorzugen Sie gepinnte Versionen.
</Warning>

`plugins search` fragt ClawHub nach installierbaren Plugin-Paketen ab und gibt installierbare Paketnamen aus. Es durchsucht Code-Plugin- und Bundle-Plugin-Pakete, nicht Skills. Verwenden Sie `openclaw skills search` für ClawHub-Skills.

<Note>
ClawHub ist für die meisten Plugins die primäre Oberfläche für Verteilung und Auffindbarkeit. Npm bleibt ein unterstützter Fallback- und Direktinstallationspfad. OpenClaw-eigene `@openclaw/*`-Plugin-Pakete werden wieder auf npm veröffentlicht; die aktuelle Liste finden Sie auf [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) oder im [Plugin-Inventar](/de/plugins/plugin-inventory). Stabile Installationen verwenden `latest`. Installationen und Updates im Beta-Kanal bevorzugen den npm-Dist-Tag `beta`, wenn dieser Tag verfügbar ist, und fallen dann auf `latest` zurück.
</Note>

<AccordionGroup>
  <Accordion title="Konfigurations-Includes und Reparatur ungültiger Konfiguration">
    Wenn Ihr Abschnitt `plugins` durch ein Single-File-`$include` gestützt wird, schreiben `plugins install/update/enable/disable/uninstall` in diese eingebundene Datei durch und lassen `openclaw.json` unverändert. Root-Includes, Include-Arrays und Includes mit überschreibenden Geschwisterwerten schlagen geschlossen fehl, statt abgeflacht zu werden. Siehe [Konfigurations-Includes](/de/gateway/configuration) für die unterstützten Formen.

    Wenn die Konfiguration während der Installation ungültig ist, schlägt `plugins install` normalerweise geschlossen fehl und weist Sie an, zuerst `openclaw doctor --fix` auszuführen. Beim Gateway-Start und Hot Reload schlägt eine ungültige Plugin-Konfiguration wie jede andere ungültige Konfiguration geschlossen fehl; `openclaw doctor --fix` kann den ungültigen Plugin-Eintrag quarantänisieren. Die einzige dokumentierte Ausnahme zur Installationszeit ist ein enger Wiederherstellungspfad für gebündelte Plugins, die sich explizit für `openclaw.install.allowInvalidConfigRecovery` entscheiden.

  </Accordion>
  <Accordion title="--force und Neuinstallation im Vergleich zu Update">
    `--force` verwendet das vorhandene Installationsziel wieder und überschreibt ein bereits installiertes Plugin oder einen Hook-Pack direkt. Verwenden Sie es, wenn Sie dieselbe ID absichtlich von einem neuen lokalen Pfad, Archiv, ClawHub-Paket oder npm-Artefakt neu installieren. Für routinemäßige Upgrades eines bereits nachverfolgten npm-Plugins bevorzugen Sie `openclaw plugins update <id-or-npm-spec>`.

    Wenn Sie `plugins install` für eine Plugin-ID ausführen, die bereits installiert ist, stoppt OpenClaw und verweist Sie für ein normales Upgrade auf `plugins update <id-or-npm-spec>` oder auf `plugins install <package> --force`, wenn Sie die aktuelle Installation wirklich aus einer anderen Quelle überschreiben möchten.

  </Accordion>
  <Accordion title="Geltungsbereich von --pin">
    `--pin` gilt nur für npm-Installationen. Es wird bei `git:`-Installationen nicht unterstützt; verwenden Sie eine explizite Git-Referenz wie `git:github.com/acme/plugin@v1.2.3`, wenn Sie eine gepinnte Quelle möchten. Es wird mit `--marketplace` nicht unterstützt, da Marketplace-Installationen Marketplace-Quellmetadaten statt einer npm-Spezifikation speichern.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` ist veraltet und ist jetzt ein No-op. OpenClaw führt für Plugin-Installationen keine integrierte Blockierung gefährlichen Codes zur Installationszeit mehr aus.

    Verwenden Sie die gemeinsame, operator-eigene Oberfläche `security.installPolicy`, wenn hostspezifische Installationsrichtlinien erforderlich sind. Plugin-`before_install`-Hooks sind Lebenszyklus-Hooks der Plugin-Runtime und nicht die primäre Richtliniengrenze für CLI-Installationen.

    Wenn ein von Ihnen auf ClawHub veröffentlichtes Plugin durch einen Registry-Scan ausgeblendet oder blockiert wird, verwenden Sie die Publisher-Schritte in [ClawHub-Veröffentlichung](/de/clawhub/publishing). `--dangerously-force-unsafe-install` fordert ClawHub nicht auf, das Plugin erneut zu scannen oder ein blockiertes Release öffentlich zu machen.

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    Community-ClawHub-Installationen prüfen vor dem Herunterladen des Pakets den Vertrauenseintrag des ausgewählten Releases. Wenn ClawHub den Download für das Release deaktiviert, bösartige Scan-Funde meldet oder das Release in einen blockierenden Moderationszustand wie Quarantäne versetzt, lehnt OpenClaw das Release ab. Bei nicht blockierenden riskanten Scan-Status, riskanten Moderationszuständen oder Registry-Gründen zeigt OpenClaw die Vertrauensdetails an und bittet vor dem Fortfahren um Bestätigung.

    Verwenden Sie `--acknowledge-clawhub-risk` nur, nachdem Sie die ClawHub-Warnung geprüft und entschieden haben, ohne interaktive Eingabeaufforderung fortzufahren. Ausstehende oder veraltete saubere Vertrauenseinträge warnen, erfordern aber keine Bestätigung. Offizielle ClawHub-Pakete und gebündelte OpenClaw-Plugin-Quellen umgehen diese Release-Vertrauensabfrage.

  </Accordion>
  <Accordion title="Hook-Packs und npm-Spezifikationen">
    `plugins install` ist auch die Installationsoberfläche für Hook-Packs, die `openclaw.hooks` in `package.json` bereitstellen. Verwenden Sie `openclaw hooks` für gefilterte Hook-Sichtbarkeit und Aktivierung einzelner Hooks, nicht für die Paketinstallation.

    Npm-Spezifikationen sind **nur Registry** (Paketname + optionale **exakte Version** oder **dist-tag**). Git-/URL-/Datei-Spezifikationen und Semver-Bereiche werden abgelehnt. Abhängigkeitsinstallationen laufen aus Sicherheitsgründen in einem verwalteten npm-Projekt pro Plugin mit `--ignore-scripts`, selbst wenn Ihre Shell globale npm-Installationseinstellungen hat. Verwaltete Plugin-npm-Projekte übernehmen OpenClaws npm-`overrides` auf Paketebene, sodass Host-Sicherheits-Pins auch für gehostete Plugin-Abhängigkeiten gelten.

    Verwenden Sie `npm:<package>`, wenn Sie die npm-Auflösung explizit machen möchten. Unqualifizierte Paketspezifikationen installieren während der Launch-Umstellung ebenfalls direkt von npm, sofern sie keiner offiziellen Plugin-ID entsprechen.

    Rohe `@openclaw/*`-Paketspezifikationen, die gebündelten Plugins entsprechen, werden vor dem npm-Fallback auf die image-eigene gebündelte Kopie aufgelöst. Zum Beispiel verwendet `openclaw plugins install @openclaw/discord@2026.5.20 --pin` das gebündelte Discord-Plugin aus dem aktuellen OpenClaw-Build, statt einen verwalteten npm-Override zu erstellen. Um das externe npm-Paket zu erzwingen, verwenden Sie `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin`.

    Unqualifizierte Spezifikationen und `@latest` bleiben auf dem Stable-Track. OpenClaw-Korrekturversionen mit Datumsstempel wie `2026.5.3-1` gelten für diese Prüfung als stabile Releases. Wenn npm eine dieser Angaben auf ein Prerelease auflöst, stoppt OpenClaw und fordert Sie auf, sich explizit mit einem Prerelease-Tag wie `@beta`/`@rc` oder einer exakten Prerelease-Version wie `@1.2.3-beta.4` dafür zu entscheiden.

    Bei npm-Installationen ohne exakte Version (`npm:<package>` oder `npm:<package>@latest`) prüft OpenClaw vor der Installation die aufgelösten Paketmetadaten. Wenn das neueste stabile Paket eine neuere OpenClaw-Plugin-API oder eine höhere minimale Host-Version benötigt, prüft OpenClaw ältere stabile Versionen und installiert stattdessen das neueste kompatible Release. Exakte Versionen und explizite dist-tags wie `@beta` bleiben strikt: Wenn das ausgewählte Paket inkompatibel ist, schlägt der Befehl fehl und fordert Sie auf, OpenClaw zu aktualisieren oder eine kompatible Version zu wählen.

    Wenn eine unqualifizierte Installationsspezifikation einer offiziellen Plugin-ID entspricht (zum Beispiel `diffs`), installiert OpenClaw den Katalogeintrag direkt. Um ein npm-Paket mit demselben Namen zu installieren, verwenden Sie eine explizite scoped Spezifikation (zum Beispiel `@scope/diffs`).

  </Accordion>
  <Accordion title="Git-Repositorys">
    Verwenden Sie `git:<repo>`, um direkt aus einem Git-Repository zu installieren. Unterstützte Formen umfassen `git:github.com/owner/repo`, `git:owner/repo`, vollständige `https://`-, `ssh://`-, `git://`-, `file://`- und `git@host:owner/repo.git`-Clone-URLs. Fügen Sie `@<ref>` oder `#<ref>` hinzu, um vor der Installation einen Branch, ein Tag oder einen Commit auszuchecken.

    Git-Installationen klonen in ein temporäres Verzeichnis, checken den angeforderten Ref aus, falls vorhanden, und verwenden dann den normalen Plugin-Verzeichnis-Installer. Das bedeutet, dass Manifestvalidierung, Betreiber-Installationsrichtlinie, Paketmanager-Installationsarbeit und Installationsdatensätze sich wie bei npm-Installationen verhalten. Aufgezeichnete Git-Installationen enthalten die Quell-URL/den Ref sowie den aufgelösten Commit, damit `openclaw plugins update` die Quelle später erneut auflösen kann.

    Verwenden Sie nach der Installation aus Git `openclaw plugins inspect <id> --runtime --json`, um Laufzeitregistrierungen wie Gateway-Methoden und CLI-Befehle zu verifizieren. Wenn das Plugin mit `api.registerCli` eine CLI-Root registriert hat, führen Sie diesen Befehl direkt über die OpenClaw-Root-CLI aus, zum Beispiel `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archive">
    Unterstützte Archive: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Native OpenClaw-Plugin-Archive müssen ein gültiges `openclaw.plugin.json` im extrahierten Plugin-Root enthalten; Archive, die nur `package.json` enthalten, werden abgelehnt, bevor OpenClaw Installationsdatensätze schreibt.

    Verwenden Sie `npm-pack:<path.tgz>`, wenn die Datei ein npm-pack-Tarball ist und Sie
    denselben verwalteten npm-Projektpfad pro Plugin testen möchten, der von Registry-
    Installationen verwendet wird, einschließlich `package-lock.json`-Verifizierung, Scannen
    gehosteter Abhängigkeiten und npm-Installationsdatensätzen. Einfache Archivpfade
    installieren weiterhin als lokale Archive unter dem Plugin-Extensions-Root.

    Claude-Marktplatzinstallationen werden ebenfalls unterstützt.

  </Accordion>
</AccordionGroup>

ClawHub-Installationen verwenden einen expliziten `clawhub:<package>`-Locator:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Unqualifizierte npm-sichere Plugin-Spezifikationen installieren während der Launch-Umstellung standardmäßig von npm, sofern sie keiner offiziellen Plugin-ID entsprechen:

```bash
openclaw plugins install openclaw-codex-app-server
```

Verwenden Sie `npm:`, um eine reine npm-Auflösung explizit zu machen:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw prüft vor der Installation die beworbene Plugin-API-/minimale Gateway-Kompatibilität. Wenn die ausgewählte ClawHub-Version ein ClawPack-Artefakt veröffentlicht, lädt OpenClaw das versionierte npm-pack-`.tgz` herunter, verifiziert den ClawHub-Digest-Header und den Artefakt-Digest und installiert es dann über den normalen Archivpfad. Ältere ClawHub-Versionen ohne ClawPack-Metadaten installieren weiterhin über den Legacy-Paketarchiv-Verifizierungspfad. Aufgezeichnete Installationen behalten ihre ClawHub-Quellmetadaten, Artefaktart, npm-Integrität, npm-shasum, Tarball-Namen und ClawPack-Digest-Fakten für spätere Aktualisierungen.
Unversionierte ClawHub-Installationen behalten eine unversionierte aufgezeichnete Spezifikation, damit `openclaw plugins update` neueren ClawHub-Releases folgen kann; explizite Versions- oder Tag-Selektoren wie `clawhub:pkg@1.2.3` und `clawhub:pkg@beta` bleiben an diesen Selektor gepinnt.

#### Marktplatz-Kurzform

Verwenden Sie die Kurzform `plugin@marketplace`, wenn der Marktplatzname in Claudes lokalem Registry-Cache unter `~/.claude/plugins/known_marketplaces.json` vorhanden ist:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Verwenden Sie `--marketplace`, wenn Sie die Marktplatzquelle explizit übergeben möchten:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Marktplatzquellen">
    - ein Claude-Name für einen bekannten Marktplatz aus `~/.claude/plugins/known_marketplaces.json`
    - ein lokaler Marktplatz-Root oder `marketplace.json`-Pfad
    - eine GitHub-Repo-Kurzform wie `owner/repo`
    - eine GitHub-Repo-URL wie `https://github.com/owner/repo`
    - eine Git-URL

  </Tab>
  <Tab title="Regeln für Remote-Marktplätze">
    Bei Remote-Marktplätzen, die von GitHub oder Git geladen werden, müssen Plugin-Einträge innerhalb des geklonten Marktplatz-Repos bleiben. OpenClaw akzeptiert relative Pfadquellen aus diesem Repo und lehnt HTTP(S)-, absolute Pfad-, Git-, GitHub- und andere Nicht-Pfad-Plugin-Quellen aus Remote-Manifesten ab.
  </Tab>
</Tabs>

Für lokale Pfade und Archive erkennt OpenClaw automatisch:

- native OpenClaw-Plugins (`openclaw.plugin.json`)
- Codex-kompatible Bundles (`.codex-plugin/plugin.json`)
- Claude-kompatible Bundles (`.claude-plugin/plugin.json` oder das Standardlayout für Claude-Komponenten)
- Cursor-kompatible Bundles (`.cursor-plugin/plugin.json`)

Verwaltete lokale Installationen müssen Plugin-Verzeichnisse oder Archive sein. Eigenständige `.js`-,
`.mjs`-, `.cjs`- und `.ts`-Plugin-Dateien werden von `plugins install` nicht in den verwalteten Plugin-
Root kopiert; listen Sie sie stattdessen explizit in `plugins.load.paths` auf.

<Note>
Kompatible Bundles werden in den normalen Plugin-Root installiert und nehmen am selben list/info/enable/disable-Ablauf teil. Derzeit werden Bundle-Skills, Claude-Befehls-Skills, Claude-`settings.json`-Defaults, Claude-`.lsp.json`-/manifestdeklarierte `lspServers`-Defaults, Cursor-Befehls-Skills und kompatible Codex-Hook-Verzeichnisse unterstützt; andere erkannte Bundle-Funktionen werden in diagnostics/info angezeigt, sind aber noch nicht in die Laufzeitausführung eingebunden.
</Note>

### Auflisten

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
openclaw plugins search <query>
openclaw plugins search <query> --limit 20
openclaw plugins search <query> --json
```

<ParamField path="--enabled" type="boolean">
  Nur aktivierte Plugins anzeigen.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Von der Tabellenansicht zu Detailzeilen pro Plugin mit Source-/Origin-/Versions-/Aktivierungsmetadaten wechseln.
</ParamField>
<ParamField path="--json" type="boolean">
  Maschinenlesbares Inventar plus Registry-Diagnosen und Installationsstatus der Paketabhängigkeiten.
</ParamField>

<Note>
`plugins list` liest zuerst die persistierte lokale Plugin-Registry, mit einem nur aus Manifesten abgeleiteten Fallback, wenn die Registry fehlt oder ungültig ist. Das ist nützlich, um zu prüfen, ob ein Plugin installiert, aktiviert und für die Kaltstartplanung sichtbar ist, aber es ist keine Live-Laufzeitprüfung eines bereits laufenden Gateway-Prozesses. Nach Änderungen an Plugin-Code, Aktivierung, Hook-Richtlinie oder `plugins.load.paths` starten Sie das Gateway neu, das den Channel bedient, bevor Sie erwarten, dass neuer `register(api)`-Code oder Hooks ausgeführt werden. Bei Remote-/Container-Deployments verifizieren Sie, dass Sie den tatsächlichen `openclaw gateway run`-Child neu starten, nicht nur einen Wrapper-Prozess.

`plugins list --json` enthält den `dependencyStatus` jedes Plugins aus `package.json`-
`dependencies` und `optionalDependencies`. OpenClaw prüft, ob diese Paketnamen
entlang des normalen Node-`node_modules`-Lookup-Pfads des Plugins vorhanden sind; es
importiert keinen Plugin-Laufzeitcode, führt keinen Paketmanager aus und repariert
fehlende Abhängigkeiten nicht.
</Note>

Wenn die Startlogs `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...` ausgeben,
führen Sie `openclaw plugins list --enabled --verbose` oder
`openclaw plugins inspect <id>` mit einer aufgelisteten Plugin-ID aus, um die Plugin-
IDs zu bestätigen und vertrauenswürdige IDs in `plugins.allow` in `openclaw.json` zu kopieren. Wenn die
Warnung jedes gefundene Plugin auflisten kann, gibt sie ein direkt einfügbares
`plugins.allow`-Snippet aus, das diese IDs bereits enthält. Wenn ein Plugin
ohne Installations-/Load-Path-Provenienz geladen wird, inspizieren Sie diese Plugin-ID und pinnen Sie dann entweder
die vertrauenswürdige ID in `plugins.allow` oder installieren Sie das Plugin erneut aus einer vertrauenswürdigen Quelle,
damit OpenClaw die Installationsprovenienz aufzeichnet.

`plugins search` ist eine Remote-ClawHub-Katalogsuche. Sie inspiziert keinen lokalen
State, mutiert keine Konfiguration, installiert keine Pakete und lädt keinen Plugin-Laufzeitcode. Suchergebnisse
enthalten den ClawHub-Paketnamen, die Familie, den Channel, die Version, Zusammenfassung und
einen Installationshinweis wie `openclaw plugins install clawhub:<package>`.

Für Arbeiten an gebündelten Plugins innerhalb eines paketierten Docker-Images binden Sie das Plugin-
Quellverzeichnis über den entsprechenden paketierten Quellpfad ein, zum Beispiel
`/app/extensions/synology-chat`. OpenClaw findet dieses gemountete Source-
Overlay vor `/app/dist/extensions/synology-chat`; ein einfach kopiertes Quell-
verzeichnis bleibt inaktiv, sodass normale paketierte Installationen weiterhin das kompilierte dist verwenden.

Für das Debugging von Laufzeit-Hooks:

- `openclaw plugins inspect <id> --runtime --json` zeigt registrierte Hooks und Diagnosen aus einem modulgeladenen Inspektionsdurchlauf. Laufzeitinspektion installiert niemals Abhängigkeiten; verwenden Sie `openclaw doctor --fix`, um Legacy-Abhängigkeitsstate zu bereinigen oder fehlende herunterladbare Plugins wiederherzustellen, auf die in der Konfiguration verwiesen wird.
- `openclaw gateway status --deep --require-rpc` bestätigt die erreichbare Gateway-URL/das Profil, Service-/Prozesshinweise, den Konfigurationspfad und die RPC-Gesundheit.
- Nicht gebündelte Conversation-Hooks (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) erfordern `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Verwenden Sie `--link`, um das Kopieren eines lokalen Plugin-Verzeichnisses zu vermeiden (fügt es zu `plugins.load.paths` hinzu):

```bash
openclaw plugins install -l ./my-plugin
```

Eigenständige Plugin-Dateien müssen in `plugins.load.paths` aufgelistet werden, statt
mit `plugins install` installiert oder direkt in `~/.openclaw/extensions`
oder `<workspace>/.openclaw/extensions` abgelegt zu werden. Diese automatisch gefundenen Roots laden Plugin-
Paket- oder Bundle-Verzeichnisse, während Skriptdateien auf oberster Ebene als lokale
Hilfsdateien behandelt und übersprungen werden.

<Note>
Aus einem Workspace-Extensions-Stammverzeichnis entdeckte Plugins mit Workspace-Ursprung werden erst importiert oder ausgeführt, wenn sie explizit aktiviert sind. Führen Sie für die lokale Entwicklung `openclaw plugins enable <plugin-id>` aus oder setzen Sie `plugins.entries.<plugin-id>.enabled: true`; wenn Ihre Konfiguration `plugins.allow` verwendet, nehmen Sie dieselbe Plugin-ID auch dort auf. Diese Fail-closed-Regel gilt auch, wenn die Channel-Einrichtung explizit ein Plugin mit Workspace-Ursprung für reines Setup-Laden ansteuert. Daher wird lokaler Channel-Plugin-Setup-Code nicht ausgeführt, solange dieses Workspace-Plugin deaktiviert bleibt oder von der Allowlist ausgeschlossen ist. Verknüpfte Installationen und explizite `plugins.load.paths`-Einträge folgen der normalen Richtlinie für ihren aufgelösten Plugin-Ursprung. Siehe [Plugin-Richtlinie konfigurieren](/de/tools/plugin#configure-plugin-policy) und [Konfigurationsreferenz](/de/gateway/configuration-reference#plugins).

`--force` wird mit `--link` nicht unterstützt, weil verknüpfte Installationen den Quellpfad wiederverwenden, statt ein verwaltetes Installationsziel zu überschreiben.

Verwenden Sie `--pin` bei npm-Installationen, um die aufgelöste exakte Spezifikation (`name@version`) im verwalteten Plugin-Index zu speichern, während das Standardverhalten ungepinnt bleibt.
</Note>

### Plugin-Index

Plugin-Installationsmetadaten sind maschinenverwalteter Zustand, keine Benutzerkonfiguration. Installationen und Aktualisierungen schreiben sie in die gemeinsame SQLite-Zustandsdatenbank unter dem aktiven OpenClaw-Zustandsverzeichnis. Die Zeile `installed_plugin_index` speichert dauerhafte `installRecords`-Metadaten, einschließlich Datensätzen für defekte oder fehlende Plugin-Manifeste, sowie einen aus dem Manifest abgeleiteten Cold-Registry-Cache, der von `openclaw plugins update`, Deinstallation, Diagnosen und der Cold-Plugin-Registry verwendet wird.

Wenn OpenClaw ausgelieferte Legacy-`plugins.installs`-Datensätze in der Konfiguration erkennt, behandelt die Runtime sie beim Lesen als Kompatibilitätseingabe, ohne `openclaw.json` neu zu schreiben. Explizite Plugin-Schreibvorgänge und `openclaw doctor --fix` verschieben diese Datensätze in den Plugin-Index und entfernen den Konfigurationsschlüssel, wenn Konfigurationsschreibvorgänge erlaubt sind; schlägt einer der Schreibvorgänge fehl, werden die Konfigurationsdatensätze beibehalten, damit die Installationsmetadaten nicht verloren gehen.

### Deinstallation

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` entfernt Plugin-Datensätze aus `plugins.entries`, dem persistierten Plugin-Index, Plugin-Allow-/Deny-List-Einträgen und, falls zutreffend, verknüpften `plugins.load.paths`-Einträgen. Sofern `--keep-files` nicht gesetzt ist, entfernt die Deinstallation außerdem das nachverfolgte verwaltete Installationsverzeichnis, wenn es sich innerhalb des Plugin-Extensions-Stammverzeichnisses von OpenClaw befindet. Bei Active Memory-Plugins wird der Speicher-Slot auf `memory-core` zurückgesetzt.

<Note>
`--keep-config` wird als veralteter Alias für `--keep-files` unterstützt.
</Note>

### Aktualisierung

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --acknowledge-clawhub-risk
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Aktualisierungen gelten für nachverfolgte Plugin-Installationen im verwalteten Plugin-Index und nachverfolgte Hook-Pack-Installationen in `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Plugin-ID gegenüber npm-Spezifikation auflösen">
    Wenn Sie eine Plugin-ID übergeben, verwendet OpenClaw die aufgezeichnete Installationsspezifikation für dieses Plugin erneut. Das bedeutet, dass zuvor gespeicherte Dist-Tags wie `@beta` und exakte gepinnte Versionen auch bei späteren `update <id>`-Läufen weiter verwendet werden.

    Während `update <id> --dry-run` bleiben exakt gepinnte npm-Installationen gepinnt. Wenn OpenClaw auch die Standardlinie der Package-Registry auflösen kann und diese Standardlinie neuer ist als die installierte gepinnte Version, meldet der Probelauf den Pin und gibt den expliziten `@latest`-Package-Aktualisierungsbefehl aus, um der Standardlinie der Registry zu folgen.

    Diese Regel für gezielte Aktualisierungen unterscheidet sich vom Wartungspfad für die Sammelaktualisierung `openclaw plugins update --all`. Sammelaktualisierungen respektieren weiterhin gewöhnliche nachverfolgte Installationsspezifikationen, aber vertrauenswürdige offizielle OpenClaw-Plugin-Datensätze können mit dem aktuellen offiziellen Katalogziel synchronisiert werden, statt auf einem veralteten exakten offiziellen Package zu bleiben. Verwenden Sie gezielt `update <id>`, wenn Sie eine exakte oder getaggte offizielle Spezifikation absichtlich unverändert lassen möchten.

    Bei npm-Installationen können Sie auch eine explizite npm-Package-Spezifikation mit Dist-Tag oder exakter Version übergeben. OpenClaw löst diesen Package-Namen zurück zum nachverfolgten Plugin-Datensatz auf, aktualisiert dieses installierte Plugin und zeichnet die neue npm-Spezifikation für zukünftige ID-basierte Aktualisierungen auf.

    Das Übergeben des npm-Package-Namens ohne Version oder Tag wird ebenfalls zurück zum nachverfolgten Plugin-Datensatz aufgelöst. Verwenden Sie dies, wenn ein Plugin auf eine exakte Version gepinnt war und Sie es zurück auf die Standard-Release-Linie der Registry verschieben möchten.

  </Accordion>
  <Accordion title="Aktualisierungen im Beta-Channel">
    Gezieltes `openclaw plugins update <id-or-npm-spec>` verwendet die nachverfolgte Plugin-Spezifikation erneut, sofern Sie keine neue Spezifikation übergeben. Die Sammelaktualisierung `openclaw plugins update --all` verwendet den konfigurierten `update.channel`, wenn vertrauenswürdige offizielle Plugin-Datensätze mit dem offiziellen Katalogziel synchronisiert werden. Dadurch können Installationen im Beta-Channel auf der Beta-Release-Linie bleiben, statt stillschweigend auf stable/latest normalisiert zu werden.

    `openclaw update` kennt außerdem den aktiven OpenClaw-Aktualisierungs-Channel: Im Beta-Channel versuchen npm- und ClawHub-Plugin-Datensätze auf der Standardlinie zuerst `@beta`. Sie fallen auf die aufgezeichnete default/latest-Spezifikation zurück, wenn kein Plugin-Beta-Release existiert; npm-Plugins fallen auch zurück, wenn das Beta-Package existiert, aber die Installationsvalidierung fehlschlägt. Dieser Fallback wird als Warnung gemeldet und lässt die Core-Aktualisierung nicht fehlschlagen. Exakte Versionen und explizite Tags bleiben für gezielte Aktualisierungen an diesen Selektor gepinnt.

  </Accordion>
  <Accordion title="Versionsprüfungen und Integritätsdrift">
    Vor einer Live-npm-Aktualisierung prüft OpenClaw die installierte Package-Version gegen die npm-Registry-Metadaten. Wenn die installierte Version und die aufgezeichnete Artefaktidentität bereits mit dem aufgelösten Ziel übereinstimmen, wird die Aktualisierung übersprungen, ohne herunterzuladen, neu zu installieren oder `openclaw.json` neu zu schreiben.

    Wenn ein gespeicherter Integritäts-Hash existiert und sich der Hash des abgerufenen Artefakts ändert, behandelt OpenClaw dies als npm-Artefaktdrift. Der interaktive Befehl `openclaw plugins update` gibt die erwarteten und tatsächlichen Hashes aus und fragt vor dem Fortfahren nach Bestätigung. Nicht interaktive Aktualisierungshelfer schlagen fail-closed fehl, sofern der Aufrufer keine explizite Fortsetzungsrichtlinie bereitstellt.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install bei der Aktualisierung">
    `--dangerously-force-unsafe-install` wird aus Kompatibilitätsgründen auch bei `plugins update` akzeptiert, ist jedoch veraltet und ändert das Verhalten von Plugin-Aktualisierungen nicht mehr. Die Betreiberoption `security.installPolicy` kann Aktualisierungen weiterhin blockieren; Plugin-`before_install`-Hooks gelten nur in Prozessen, in denen Plugin-Hooks geladen sind.
  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk bei der Aktualisierung">
    Community-Plugin-Aktualisierungen, die auf ClawHub basieren, führen vor dem Herunterladen des Ersatz-Packages dieselbe Vertrauensprüfung für exakte Releases aus wie Installationen. Verwenden Sie `--acknowledge-clawhub-risk` für geprüfte Automatisierung, die fortfahren soll, wenn das ausgewählte ClawHub-Release eine riskante Vertrauenswarnung hat. Offizielle ClawHub-Packages und gebündelte OpenClaw-Plugin-Quellen umgehen diese Release-Vertrauensabfrage.
  </Accordion>
</AccordionGroup>

### Prüfen

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect zeigt standardmäßig Identität, Ladestatus, Quelle, Manifest-Fähigkeiten, Richtlinien-Flags, Diagnosen, Installationsmetadaten, Bundle-Fähigkeiten sowie jede erkannte MCP- oder LSP-Server-Unterstützung, ohne die Plugin-Runtime zu importieren. JSON-Ausgabe enthält die Plugin-Manifest-Verträge, etwa `contracts.agentToolResultMiddleware` und `contracts.trustedToolPolicies`, damit Betreiber Erklärungen zu vertrauenswürdigen Oberflächen prüfen können, bevor sie ein Plugin aktivieren oder neu starten. Fügen Sie `--runtime` hinzu, um das Plugin-Modul zu laden und registrierte Hooks, Tools, Befehle, Dienste, Gateway-Methoden und HTTP-Routen einzubeziehen. Runtime-Inspektion meldet fehlende Plugin-Abhängigkeiten direkt; Installationen und Reparaturen bleiben in `openclaw plugins install`, `openclaw plugins update` und `openclaw doctor --fix`.

Plugin-eigene CLI-Befehle werden üblicherweise als Root-Befehlsgruppen von `openclaw` installiert, Plugins können aber auch verschachtelte Befehle unter einem Core-Elternbefehl wie `openclaw nodes` registrieren. Nachdem `inspect --runtime` einen Befehl unter `cliCommands` angezeigt hat, führen Sie ihn unter dem aufgeführten Pfad aus; zum Beispiel kann ein Plugin, das `demo-git` registriert, mit `openclaw demo-git ping` geprüft werden.

Jedes Plugin wird danach klassifiziert, was es zur Laufzeit tatsächlich registriert:

- **plain-capability** — ein Fähigkeitstyp (z. B. ein reines Provider-Plugin)
- **hybrid-capability** — mehrere Fähigkeitstypen (z. B. Text + Sprache + Bilder)
- **hook-only** — nur Hooks, keine Fähigkeiten oder Oberflächen
- **non-capability** — Tools/Befehle/Dienste, aber keine Fähigkeiten

Weitere Informationen zum Fähigkeitsmodell finden Sie unter [Plugin-Formen](/de/plugins/architecture#plugin-shapes).

<Note>
Das Flag `--json` gibt einen maschinenlesbaren Bericht aus, der sich für Skripting und Audits eignet. `inspect --all` rendert eine flottenweite Tabelle mit Spalten für Form, Fähigkeitstypen, Kompatibilitätshinweise, Bundle-Fähigkeiten und Hook-Zusammenfassung. `info` ist ein Alias für `inspect`.
</Note>

### Diagnose

```bash
openclaw plugins doctor
```

`doctor` meldet Plugin-Ladefehler, Manifest-/Discovery-Diagnosen, Kompatibilitätshinweise und veraltete Plugin-Konfigurationsreferenzen wie fehlende Plugin-Slots. Wenn der Installationsbaum und die Plugin-Konfiguration sauber sind, wird `No plugin issues detected.` ausgegeben. Wenn veraltete Konfiguration verbleibt, der Installationsbaum aber ansonsten fehlerfrei ist, sagt die Zusammenfassung dies, statt vollständige Plugin-Gesundheit zu implizieren.

Wenn ein konfiguriertes Plugin auf dem Datenträger vorhanden ist, aber durch die Pfadsicherheitsprüfungen des Loaders blockiert wird, behält die Konfigurationsvalidierung den Plugin-Eintrag bei und meldet ihn als `present but blocked`. Beheben Sie die vorherige Diagnose zum blockierten Plugin, etwa Pfadbesitz oder weltbeschreibbare Berechtigungen, statt die Konfiguration `plugins.entries.<id>` oder `plugins.allow` zu entfernen.

Führen Sie bei Modulform-Fehlern wie fehlenden `register`-/`activate`-Exporten erneut mit `OPENCLAW_PLUGIN_LOAD_DEBUG=1` aus, um eine kompakte Zusammenfassung der Exportform in die Diagnoseausgabe aufzunehmen.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Die lokale Plugin-Registry ist OpenClaws persistiertes Cold-Read-Modell für installierte Plugin-Identität, Aktivierung, Quellenmetadaten und Besitz von Beiträgen. Normaler Start, Provider-Owner-Lookup, Channel-Setup-Klassifizierung und Plugin-Inventar können sie lesen, ohne Plugin-Runtime-Module zu importieren.

Verwenden Sie `plugins registry`, um zu prüfen, ob die persistierte Registry vorhanden, aktuell oder veraltet ist. Verwenden Sie `--refresh`, um sie aus dem persistierten Plugin-Index, der Konfigurationsrichtlinie und Manifest-/Package-Metadaten neu zu erstellen. Dies ist ein Reparaturpfad, kein Runtime-Aktivierungspfad.

`openclaw doctor --fix` repariert außerdem verwaltete npm-Drift neben der Registry: Wenn ein verwaistes oder wiederhergestelltes `@openclaw/*`-Package unter einem verwalteten Plugin-npm-Projekt oder dem alten flachen verwalteten npm-Stamm ein gebündeltes Plugin überschattet, entfernt doctor dieses veraltete Package und erstellt die Registry neu, sodass der Start gegen das gebündelte Manifest validiert. Doctor verknüpft außerdem das Host-Package `openclaw` erneut in verwaltete npm-Plugins, die `peerDependencies.openclaw` deklarieren, damit package-lokale Runtime-Importe wie `openclaw/plugin-sdk/*` nach Aktualisierungen oder npm-Reparaturen aufgelöst werden.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` ist ein veralteter Break-glass-Kompatibilitätsschalter für Registry-Lesefehler. Bevorzugen Sie `plugins registry --refresh` oder `openclaw doctor --fix`; der Env-Fallback ist nur für die Notfallwiederherstellung beim Start gedacht, während die Migration ausgerollt wird.
</Warning>

### Marktplatz

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
openclaw plugins marketplace refresh
openclaw plugins marketplace refresh --feed-profile <name>
openclaw plugins marketplace refresh --feed-url <url>
openclaw plugins marketplace refresh --expected-sha256 <sha256> --json
```

Marketplace List akzeptiert einen lokalen Marketplace-Pfad, einen `marketplace.json`-Pfad, eine GitHub-Kurzform wie `owner/repo`, eine GitHub-Repo-URL oder eine Git-URL. `--json` gibt das aufgelöste Quelllabel sowie das geparste Marketplace-Manifest und die Plugin-Einträge aus.

Marketplace Refresh lädt einen gehosteten OpenClaw-Marketplace-Feed und speichert die
validierte Antwort als lokalen Snapshot des gehosteten Feeds. Ohne Optionen verwendet er
das konfigurierte Standard-Feed-Profil. Verwenden Sie `--feed-profile <name>`, um ein
bestimmtes konfiguriertes Profil zu aktualisieren, `--feed-url <url>`, um eine explizite URL eines
gehosteten Feeds zu aktualisieren, `--expected-sha256 <sha256>`, um eine passende Nutzlast-Prüfsumme zu verlangen
(`sha256:<hex>` oder einen reinen 64-stelligen Hex-Digest), und `--json` für
maschinenlesbare Ausgabe. Explizite URLs gehosteter Feeds dürfen keine
Anmeldedaten, Query-Strings oder Fragmente enthalten. Nicht fixierte Aktualisierungen können ein
gehostetes Snapshot- oder mitgeliefertes Fallback-Ergebnis melden, ohne dass der Befehl fehlschlägt. Fixierte
Aktualisierungen schlagen fehl, sofern sie keine frische gehostete Nutzlast akzeptieren, und erfolgreiche gehostete
Aktualisierungen schlagen fehl, wenn OpenClaw den validierten Snapshot nicht speichern kann.

## Verwandte Themen

- [Plugins erstellen](/de/plugins/building-plugins)
- [CLI-Referenz](/de/cli)
- [ClawHub](/de/clawhub)
