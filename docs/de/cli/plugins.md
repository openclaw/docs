---
read_when:
    - Sie möchten Gateway-Plugins oder kompatible Bundles installieren oder verwalten
    - Sie möchten ein einfaches Tool-Plugin scaffolden oder validieren
    - Sie möchten Fehler beim Laden von Plugins debuggen
sidebarTitle: Plugins
summary: CLI-Referenz für `openclaw plugins` (init, build, validate, list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-06-27T17:20:15Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: b4366a862f6a8996b38b624760eef407969f35a7451e3b2a1d5e82746d73b678
    source_path: cli/plugins.md
    workflow: 16
---

Verwalten Sie Gateway-Plugins, Hook-Pakete und kompatible Bundles.

<CardGroup cols={2}>
  <Card title="Plugin-System" href="/de/tools/plugin">
    Endbenutzerleitfaden zum Installieren, Aktivieren und Beheben von Problemen mit Plugins.
  </Card>
  <Card title="Plugins verwalten" href="/de/plugins/manage-plugins">
    Kurze Beispiele für Installation, Auflisten, Aktualisieren, Deinstallation und Veröffentlichung.
  </Card>
  <Card title="Plugin-Bundles" href="/de/plugins/bundles">
    Bundle-Kompatibilitätsmodell.
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
openclaw plugins init my-tool --name "My Tool"
openclaw plugins init my-provider --name "My Provider" --type provider
openclaw plugins init my-provider --name "My Provider" --type provider --directory ./my-provider
openclaw plugins build --entry ./dist/index.js
openclaw plugins build --entry ./dist/index.js --check
openclaw plugins validate --entry ./dist/index.js
```

Für die Untersuchung langsamer Installations-, Inspektions-, Deinstallations- oder Registry-Aktualisierungsvorgänge führen Sie den
Befehl mit `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` aus. Der Trace schreibt Phasen-Timings
nach stderr und hält die JSON-Ausgabe parsebar. Siehe [Debugging](/de/help/debugging#plugin-lifecycle-trace).

<Note>
Im Nix-Modus (`OPENCLAW_NIX_MODE=1`) sind Mutatoren für den Plugin-Lebenszyklus deaktiviert. Verwenden Sie stattdessen die Nix-Quelle für diese Installation anstelle von `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable` oder `plugins disable`; für nix-openclaw verwenden Sie den agentenorientierten [Quick Start](https://github.com/openclaw/nix-openclaw#quick-start).
</Note>

<Note>
Gebündelte Plugins werden mit OpenClaw ausgeliefert. Einige sind standardmäßig aktiviert (zum Beispiel gebündelte Modell-Provider, gebündelte Sprach-Provider und das gebündelte Browser-Plugin); andere erfordern `plugins enable`.

Native OpenClaw-Plugins müssen `openclaw.plugin.json` mit einem eingebetteten JSON-Schema (`configSchema`, auch wenn leer) ausliefern. Kompatible Bundles verwenden stattdessen ihre eigenen Bundle-Manifeste.

`plugins list` zeigt `Format: openclaw` oder `Format: bundle`. Ausführliche list/info-Ausgaben zeigen außerdem den Bundle-Untertyp (`codex`, `claude` oder `cursor`) sowie erkannte Bundle-Fähigkeiten.
</Note>

### Autor

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

`plugins init` erstellt standardmäßig ein minimales TypeScript-Tool-Plugin. Das erste
Argument ist die Plugin-ID; übergeben Sie `--name` für den Anzeigenamen. OpenClaw verwendet die
ID für das standardmäßige Ausgabeverzeichnis und die Paketbenennung. Tool-Gerüste verwenden
`defineToolPlugin`.
`plugins build` importiert den gebauten Einstiegspunkt, liest dessen statische Tool-Metadaten, schreibt
`openclaw.plugin.json` und hält `package.json` `openclaw.extensions` synchron.
`plugins validate` prüft, ob das generierte Manifest, die Paketmetadaten und der
aktuelle Einstiegspunkt-Export weiterhin übereinstimmen. Siehe [Tool-Plugins](/de/plugins/tool-plugins) für
den vollständigen Workflow zur Tool-Erstellung.

Das Gerüst schreibt TypeScript-Quellcode, generiert Metadaten jedoch aus dem gebauten
Einstiegspunkt `./dist/index.js`, sodass der Workflow auch mit der veröffentlichten CLI funktioniert. Verwenden Sie
`--entry <path>`, wenn der Einstiegspunkt nicht der standardmäßige Paketeinstieg ist. Verwenden Sie
`plugins build --check` in CI, damit der Vorgang fehlschlägt, wenn generierte Metadaten veraltet sind, ohne
Dateien neu zu schreiben.

### Provider-Gerüst

```bash
openclaw plugins init acme-models --name "Acme Models" --type provider
cd acme-models
npm install
npm run build
npm test
npm run validate
```

Provider-Gerüste erstellen ein generisches Text-/Modell-Provider-Plugin mit OpenAI-kompatibler
API-Schlüssel-Verkabelung, einem integrierten `npm run validate`-Skript für `clawhub package
validate`, ClawHub-Paketmetadaten und einem manuell ausgelösten GitHub-Workflow
für zukünftiges vertrauenswürdiges Veröffentlichen über GitHub Actions OIDC. Provider-Gerüste
generieren keine Skills und verwenden nicht `openclaw plugins build` oder
`openclaw plugins validate`; diese Befehle sind für den Pfad generierter Metadaten des Tool-Gerüsts
gedacht.

Ersetzen Sie vor der Veröffentlichung die Platzhalter für API-Basis-URL, Modellkatalog, Dokumentationsroute,
Anmeldedatentext und README-Text durch echte Provider-Details. Verwenden Sie die
generierte README für die erstmalige ClawHub-Veröffentlichung und die Einrichtung des vertrauenswürdigen Publishers.

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

Maintainer, die Installationen zur Einrichtungszeit testen, können automatische Plugin-Installationsquellen
mit geschützten Umgebungsvariablen überschreiben. Siehe
[Plugin-Installationsüberschreibungen](/de/plugins/install-overrides).

<Warning>
Reine Paketnamen installieren während der Launch-Umstellung standardmäßig von npm, sofern sie nicht mit einer offiziellen Plugin-ID übereinstimmen. Rohe `@openclaw/*`-Paketspezifikationen, die mit gebündelten Plugins übereinstimmen, verwenden die gebündelte Kopie, die mit dem aktuellen OpenClaw-Build ausgeliefert wurde. Verwenden Sie `npm:<package>`, wenn Sie bewusst stattdessen ein externes npm-Paket verwenden möchten. Verwenden Sie `clawhub:<package>` für ClawHub. Behandeln Sie Plugin-Installationen wie das Ausführen von Code. Bevorzugen Sie fixierte Versionen.
</Warning>

`plugins search` fragt ClawHub nach installierbaren Plugin-Paketen ab und gibt
installationsbereite Paketnamen aus. Es durchsucht Code-Plugin- und Bundle-Plugin-Pakete,
nicht Skills. Verwenden Sie `openclaw skills search` für ClawHub-Skills.

<Note>
ClawHub ist die primäre Distributions- und Auffindungsoberfläche für die meisten Plugins. Npm
bleibt ein unterstützter Fallback und direkter Installationspfad. OpenClaw-eigene
`@openclaw/*`-Plugin-Pakete werden wieder auf npm veröffentlicht; die aktuelle Liste finden Sie
auf [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) oder im
[Plugin-Inventar](/de/plugins/plugin-inventory). Stabile Installationen verwenden `latest`.
Beta-Channel-Installationen und -Updates bevorzugen das npm-`beta`-dist-tag, wenn dieses Tag
verfügbar ist, und fallen dann auf `latest` zurück.
</Note>

<AccordionGroup>
  <Accordion title="Config-Includes und Reparatur ungültiger Konfiguration">
    Wenn Ihr Abschnitt `plugins` durch ein Ein-Datei-`$include` hinterlegt ist, schreiben `plugins install/update/enable/disable/uninstall` in diese eingebundene Datei durch und lassen `openclaw.json` unverändert. Root-Includes, Include-Arrays und Includes mit überschreibenden Geschwisterwerten schlagen geschlossen fehl, statt abgeflacht zu werden. Siehe [Config-Includes](/de/gateway/configuration) für die unterstützten Formen.

    Wenn die Konfiguration während der Installation ungültig ist, schlägt `plugins install` normalerweise geschlossen fehl und weist Sie an, zuerst `openclaw doctor --fix` auszuführen. Während des Gateway-Starts und Hot Reloads schlägt ungültige Plugin-Konfiguration wie jede andere ungültige Konfiguration geschlossen fehl; `openclaw doctor --fix` kann den ungültigen Plugin-Eintrag unter Quarantäne stellen. Die einzige dokumentierte Ausnahme zur Installationszeit ist ein enger Wiederherstellungspfad für gebündelte Plugins für Plugins, die explizit `openclaw.install.allowInvalidConfigRecovery` aktivieren.

  </Accordion>
  <Accordion title="--force und Neuinstallation gegenüber Update">
    `--force` verwendet das vorhandene Installationsziel erneut und überschreibt ein bereits installiertes Plugin oder Hook-Paket an Ort und Stelle. Verwenden Sie es, wenn Sie absichtlich dieselbe ID aus einem neuen lokalen Pfad, Archiv, ClawHub-Paket oder npm-Artefakt erneut installieren. Für routinemäßige Upgrades eines bereits verfolgten npm-Plugins bevorzugen Sie `openclaw plugins update <id-or-npm-spec>`.

    Wenn Sie `plugins install` für eine Plugin-ID ausführen, die bereits installiert ist, stoppt OpenClaw und verweist Sie für ein normales Upgrade auf `plugins update <id-or-npm-spec>` oder auf `plugins install <package> --force`, wenn Sie die aktuelle Installation wirklich aus einer anderen Quelle überschreiben möchten.

  </Accordion>
  <Accordion title="Geltungsbereich von --pin">
    `--pin` gilt nur für npm-Installationen. Es wird bei `git:`-Installationen nicht unterstützt; verwenden Sie eine explizite Git-Referenz wie `git:github.com/acme/plugin@v1.2.3`, wenn Sie eine fixierte Quelle möchten. Es wird nicht mit `--marketplace` unterstützt, da Marketplace-Installationen Marketplace-Quellmetadaten anstelle einer npm-Spezifikation speichern.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` ist veraltet und ist jetzt ein No-op. OpenClaw führt keine integrierte Blockierung gefährlichen Codes zur Installationszeit für Plugin-Installationen mehr aus.

    Verwenden Sie die gemeinsam genutzte, vom Operator verwaltete Oberfläche `security.installPolicy`, wenn hostspezifische Installationsrichtlinien erforderlich sind. Plugin-`before_install`-Hooks sind Lebenszyklus-Hooks der Plugin-Laufzeit und nicht die primäre Richtliniengrenze für CLI-Installationen.

    Wenn ein von Ihnen auf ClawHub veröffentlichtes Plugin durch einen Registry-Scan ausgeblendet oder blockiert wird, verwenden Sie die Publisher-Schritte in [ClawHub-Veröffentlichung](/de/clawhub/publishing). `--dangerously-force-unsafe-install` fordert ClawHub nicht auf, das Plugin erneut zu scannen oder eine blockierte Veröffentlichung öffentlich zu machen.

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    Community-ClawHub-Installationen prüfen vor dem Herunterladen des Pakets den Vertrauensdatensatz der ausgewählten Veröffentlichung. Wenn ClawHub den Download für die Veröffentlichung deaktiviert, bösartige Scan-Ergebnisse meldet oder die Veröffentlichung in einen blockierenden Moderationszustand wie Quarantäne versetzt, verweigert OpenClaw die Veröffentlichung. Bei nicht blockierenden riskanten Scan-Status, riskanten Moderationszuständen oder Registry-Gründen zeigt OpenClaw die Vertrauensdetails an und bittet um Bestätigung, bevor fortgefahren wird.

    Verwenden Sie `--acknowledge-clawhub-risk` nur, nachdem Sie die ClawHub-Warnung geprüft und entschieden haben, ohne interaktive Eingabeaufforderung fortzufahren. Ausstehende oder veraltete saubere Vertrauensdatensätze warnen, erfordern aber keine Bestätigung. Offizielle ClawHub-Pakete und gebündelte OpenClaw-Plugin-Quellen umgehen diese Veröffentlichungsvertrauensabfrage.

  </Accordion>
  <Accordion title="Hook-Pakete und npm-Spezifikationen">
    `plugins install` ist auch die Installationsoberfläche für Hook-Pakete, die `openclaw.hooks` in `package.json` bereitstellen. Verwenden Sie `openclaw hooks` für gefilterte Hook-Sichtbarkeit und Aktivierung einzelner Hooks, nicht für die Paketinstallation.

    Npm-Spezifikationen sind **nur Registry** (Paketname plus optionale **exakte Version** oder **dist-tag**). Git-/URL-/Dateispezifikationen und Semver-Bereiche werden abgelehnt. Abhängigkeitsinstallationen laufen aus Sicherheitsgründen in einem verwalteten npm-Projekt pro Plugin mit `--ignore-scripts`, selbst wenn Ihre Shell globale npm-Installationseinstellungen hat. Verwaltete Plugin-npm-Projekte erben OpenClaws paketweite npm-`overrides`, sodass Host-Sicherheitspins auch für gehoistete Plugin-Abhängigkeiten gelten.

    Verwenden Sie `npm:<package>`, wenn Sie die npm-Auflösung explizit machen möchten. Reine Paketspezifikationen installieren während der Launch-Umstellung ebenfalls direkt von npm, sofern sie nicht mit einer offiziellen Plugin-ID übereinstimmen.

    Raw-`@openclaw/*`-Paketspezifikationen, die gebündelten Plugins entsprechen, werden vor dem npm-Fallback zur zum Image gehörenden gebündelten Kopie aufgelöst. Zum Beispiel verwendet `openclaw plugins install @openclaw/discord@2026.5.20 --pin` das gebündelte Discord-Plugin aus dem aktuellen OpenClaw-Build, statt eine verwaltete npm-Überschreibung zu erstellen. Um das externe npm-Paket zu erzwingen, verwenden Sie `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin`.

    Bloße Spezifikationen und `@latest` bleiben auf dem stabilen Track. Datumsbasierte OpenClaw-Korrekturversionen wie `2026.5.3-1` sind für diese Prüfung stabile Releases. Wenn npm eine dieser Varianten zu einem Prerelease auflöst, stoppt OpenClaw und fordert Sie auf, sich ausdrücklich mit einem Prerelease-Tag wie `@beta`/`@rc` oder einer exakten Prerelease-Version wie `@1.2.3-beta.4` dafür zu entscheiden.

    Bei npm-Installationen ohne exakte Version (`npm:<package>` oder `npm:<package>@latest`) prüft OpenClaw die aufgelösten Paketmetadaten vor der Installation. Wenn das neueste stabile Paket eine neuere OpenClaw-Plugin-API oder eine neuere Mindestversion des Hosts erfordert, prüft OpenClaw ältere stabile Versionen und installiert stattdessen das neueste kompatible Release. Exakte Versionen und explizite Dist-Tags wie `@beta` bleiben strikt: Wenn das ausgewählte Paket inkompatibel ist, schlägt der Befehl fehl und fordert Sie auf, OpenClaw zu aktualisieren oder eine kompatible Version auszuwählen.

    Wenn eine bloße Installationsspezifikation einer offiziellen Plugin-ID entspricht (zum Beispiel `diffs`), installiert OpenClaw den Katalogeintrag direkt. Um ein npm-Paket mit demselben Namen zu installieren, verwenden Sie eine explizite bereichsbezogene Spezifikation (zum Beispiel `@scope/diffs`).

  </Accordion>
  <Accordion title="Git repositories">
    Verwenden Sie `git:<repo>`, um direkt aus einem git-Repository zu installieren. Unterstützte Formen umfassen `git:github.com/owner/repo`, `git:owner/repo`, vollständige `https://`-, `ssh://`-, `git://`-, `file://`- und `git@host:owner/repo.git`-Clone-URLs. Fügen Sie `@<ref>` oder `#<ref>` hinzu, um vor der Installation einen Branch, Tag oder Commit auszuchecken.

    Git-Installationen klonen in ein temporäres Verzeichnis, checken die angeforderte Ref aus, wenn vorhanden, und verwenden dann den normalen Plugin-Verzeichnisinstaller. Das bedeutet, dass Manifestvalidierung, Installationsrichtlinien für Operatoren, Paketmanager-Installationsarbeiten und Installationsdatensätze sich wie bei npm-Installationen verhalten. Aufgezeichnete git-Installationen enthalten die Quell-URL/Ref sowie den aufgelösten Commit, damit `openclaw plugins update` die Quelle später erneut auflösen kann.

    Nach der Installation aus git verwenden Sie `openclaw plugins inspect <id> --runtime --json`, um Laufzeitregistrierungen wie Gateway-Methoden und CLI-Befehle zu verifizieren. Wenn das Plugin mit `api.registerCli` eine CLI-Wurzel registriert hat, führen Sie diesen Befehl direkt über die OpenClaw-Root-CLI aus, zum Beispiel `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archives">
    Unterstützte Archive: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Native OpenClaw-Plugin-Archive müssen ein gültiges `openclaw.plugin.json` in der extrahierten Plugin-Wurzel enthalten; Archive, die nur `package.json` enthalten, werden abgelehnt, bevor OpenClaw Installationsdatensätze schreibt.

    Verwenden Sie `npm-pack:<path.tgz>`, wenn die Datei ein npm-pack-Tarball ist und Sie
    denselben pro Plugin verwalteten npm-Projektpfad testen möchten, der von Registry-
    Installationen verwendet wird, einschließlich `package-lock.json`-Verifizierung,
    Prüfung gehobener Abhängigkeiten und npm-Installationsdatensätzen. Einfache Archivpfade installieren weiterhin als lokale
    Archive unter der Plugin-Erweiterungswurzel.

    Claude-Marketplace-Installationen werden ebenfalls unterstützt.

  </Accordion>
</AccordionGroup>

ClawHub-Installationen verwenden einen expliziten `clawhub:<package>`-Locator:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Bloße npm-sichere Plugin-Spezifikationen installieren während der Launch-Umstellung standardmäßig von npm, sofern sie keiner offiziellen Plugin-ID entsprechen:

```bash
openclaw plugins install openclaw-codex-app-server
```

Verwenden Sie `npm:`, um eine ausschließlich auf npm bezogene Auflösung explizit zu machen:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw prüft vor der Installation die beworbene Plugin-API-/Mindest-Gateway-Kompatibilität. Wenn die ausgewählte ClawHub-Version ein ClawPack-Artefakt veröffentlicht, lädt OpenClaw das versionierte npm-pack-`.tgz` herunter, verifiziert den ClawHub-Digest-Header und den Artefakt-Digest und installiert es dann über den normalen Archivpfad. Ältere ClawHub-Versionen ohne ClawPack-Metadaten werden weiterhin über den Legacy-Paketarchiv-Verifizierungspfad installiert. Aufgezeichnete Installationen behalten ihre ClawHub-Quellmetadaten, Artefaktart, npm-Integrität, npm-shasum, Tarball-Namen und ClawPack-Digest-Fakten für spätere Updates.
Unversionierte ClawHub-Installationen behalten eine unversionierte aufgezeichnete Spezifikation, damit `openclaw plugins update` neueren ClawHub-Releases folgen kann; explizite Versions- oder Tag-Selektoren wie `clawhub:pkg@1.2.3` und `clawhub:pkg@beta` bleiben an diesen Selektor gepinnt.

#### Marketplace-Kurzform

Verwenden Sie die Kurzform `plugin@marketplace`, wenn der Marketplace-Name in Claudes lokalem Registry-Cache unter `~/.claude/plugins/known_marketplaces.json` existiert:

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

<Tabs>
  <Tab title="Marketplace sources">
    - ein Claude-Name für einen bekannten Marketplace aus `~/.claude/plugins/known_marketplaces.json`
    - eine lokale Marketplace-Wurzel oder ein `marketplace.json`-Pfad
    - eine GitHub-Repo-Kurzform wie `owner/repo`
    - eine GitHub-Repo-URL wie `https://github.com/owner/repo`
    - eine git-URL

  </Tab>
  <Tab title="Remote marketplace rules">
    Bei Remote-Marketplaces, die von GitHub oder git geladen werden, müssen Plugin-Einträge innerhalb des geklonten Marketplace-Repos bleiben. OpenClaw akzeptiert relative Pfadquellen aus diesem Repo und lehnt HTTP(S)-, absolute Pfad-, git-, GitHub- und andere Nicht-Pfad-Plugin-Quellen aus Remote-Manifesten ab.
  </Tab>
</Tabs>

Für lokale Pfade und Archive erkennt OpenClaw automatisch:

- native OpenClaw-Plugins (`openclaw.plugin.json`)
- Codex-kompatible Bundles (`.codex-plugin/plugin.json`)
- Claude-kompatible Bundles (`.claude-plugin/plugin.json` oder das Standardlayout für Claude-Komponenten)
- Cursor-kompatible Bundles (`.cursor-plugin/plugin.json`)

Verwaltete lokale Installationen müssen Plugin-Verzeichnisse oder Archive sein. Eigenständige `.js`-,
`.mjs`-, `.cjs`- und `.ts`-Plugin-Dateien werden von `plugins install` nicht in die verwaltete Plugin-
Wurzel kopiert; listen Sie sie stattdessen explizit in `plugins.load.paths` auf.

<Note>
Kompatible Bundles werden in die normale Plugin-Wurzel installiert und nehmen am selben List-/Info-/Aktivieren-/Deaktivieren-Ablauf teil. Derzeit werden Bundle-Skills, Claude-Befehl-Skills, Claude-`settings.json`-Defaults, Claude-`.lsp.json`-/im Manifest deklarierte `lspServers`-Defaults, Cursor-Befehl-Skills und kompatible Codex-Hook-Verzeichnisse unterstützt; andere erkannte Bundle-Funktionen werden in Diagnose/Info angezeigt, sind aber noch nicht in die Laufzeitausführung eingebunden.
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
  Von der Tabellenansicht zu Detailzeilen pro Plugin mit Quell-/Ursprungs-/Versions-/Aktivierungsmetadaten wechseln.
</ParamField>
<ParamField path="--json" type="boolean">
  Maschinenlesbares Inventar plus Registry-Diagnosen und Installationsstatus der Paketabhängigkeiten.
</ParamField>

<Note>
`plugins list` liest zuerst die persistierte lokale Plugin-Registry, mit einem nur aus Manifesten abgeleiteten Fallback, wenn die Registry fehlt oder ungültig ist. Dies ist nützlich, um zu prüfen, ob ein Plugin installiert, aktiviert und für die Planung eines Kaltstarts sichtbar ist, aber es ist keine Live-Laufzeitprüfung eines bereits laufenden Gateway-Prozesses. Nachdem Sie Plugin-Code, Aktivierung, Hook-Richtlinie oder `plugins.load.paths` geändert haben, starten Sie das Gateway neu, das den Channel bedient, bevor Sie erwarten, dass neuer `register(api)`-Code oder Hooks ausgeführt werden. Bei Remote-/Container-Deployments verifizieren Sie, dass Sie den tatsächlichen `openclaw gateway run`-Child-Prozess neu starten, nicht nur einen Wrapper-Prozess.

`plugins list --json` enthält den `dependencyStatus` jedes Plugins aus den `package.json`-
`dependencies` und `optionalDependencies`. OpenClaw prüft, ob diese Paket-
namen entlang des normalen Node-`node_modules`-Lookup-Pfads des Plugins vorhanden sind; es
importiert keinen Plugin-Laufzeitcode, führt keinen Paketmanager aus und repariert keine fehlenden
Abhängigkeiten.
</Note>

Wenn das Startprotokoll `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...` ausgibt,
führen Sie `openclaw plugins list --enabled --verbose` oder
`openclaw plugins inspect <id>` mit einer aufgelisteten Plugin-ID aus, um die Plugin-
IDs zu bestätigen und vertrauenswürdige IDs in `plugins.allow` in `openclaw.json` zu kopieren. Wenn die
Warnung jedes gefundene Plugin auflisten kann, gibt sie ein direkt einfügbares
`plugins.allow`-Snippet aus, das diese IDs bereits enthält. Wenn ein Plugin
ohne Installations-/Load-Path-Provenienz geladen wird, inspizieren Sie diese Plugin-ID und pinnen Sie dann entweder
die vertrauenswürdige ID in `plugins.allow` oder installieren Sie das Plugin aus einer vertrauenswürdigen Quelle neu,
damit OpenClaw die Installationsprovenienz aufzeichnet.

`plugins search` ist eine Remote-ClawHub-Katalogsuche. Sie prüft keinen lokalen
Status, ändert keine Konfiguration, installiert keine Pakete und lädt keinen Plugin-Laufzeitcode. Such-
ergebnisse enthalten den ClawHub-Paketnamen, die Familie, den Channel, die Version, die Zusammenfassung und
einen Installationshinweis wie `openclaw plugins install clawhub:<package>`.

Für Arbeiten an gebündelten Plugins innerhalb eines paketierten Docker-Images binden Sie das Plugin-
Quellverzeichnis über den passenden paketierten Quellpfad ein, zum Beispiel
`/app/extensions/synology-chat`. OpenClaw erkennt dieses gemountete Quell-
Overlay vor `/app/dist/extensions/synology-chat`; ein einfach kopiertes Quell-
verzeichnis bleibt inaktiv, sodass normale paketierte Installationen weiterhin die kompilierte Dist verwenden.

Für das Debugging von Laufzeit-Hooks:

- `openclaw plugins inspect <id> --runtime --json` zeigt registrierte Hooks und Diagnosen aus einem Inspektionsdurchlauf mit geladenem Modul. Laufzeitinspektion installiert niemals Abhängigkeiten; verwenden Sie `openclaw doctor --fix`, um Legacy-Abhängigkeitsstatus zu bereinigen oder fehlende herunterladbare Plugins wiederherzustellen, die von der Konfiguration referenziert werden.
- `openclaw gateway status --deep --require-rpc` bestätigt die erreichbare Gateway-URL/das erreichbare Profil, Service-/Prozesshinweise, den Konfigurationspfad und die RPC-Gesundheit.
- Nicht gebündelte Konversations-Hooks (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) erfordern `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Verwenden Sie `--link`, um das Kopieren eines lokalen Plugin-Verzeichnisses zu vermeiden (fügt es zu `plugins.load.paths` hinzu):

```bash
openclaw plugins install -l ./my-plugin
```

Eigenständige Plugin-Dateien müssen in `plugins.load.paths` aufgeführt werden, statt
mit `plugins install` installiert oder direkt in `~/.openclaw/extensions`
oder `<workspace>/.openclaw/extensions` abgelegt zu werden. Diese automatisch erkannten Wurzeln laden Plugin-
Paket- oder Bundle-Verzeichnisse, während Skriptdateien auf oberster Ebene als lokale
Hilfsdateien behandelt und übersprungen werden.

<Note>
Plugins mit Workspace-Ursprung, die aus einem Workspace-`extensions`-Root erkannt werden, werden nicht
importiert oder ausgeführt, bis sie ausdrücklich aktiviert sind. Führen Sie für die lokale Entwicklung
`openclaw plugins enable <plugin-id>` aus oder setzen Sie
`plugins.entries.<plugin-id>.enabled: true`; wenn Ihre Konfiguration
`plugins.allow` verwendet, nehmen Sie dieselbe Plugin-ID auch dort auf. Diese Fail-Closed-Regel
gilt auch, wenn die Channel-Einrichtung ausdrücklich auf ein Plugin mit Workspace-Ursprung für
reines Setup-Laden zielt; lokaler Channel-Plugin-Setup-Code wird daher nicht ausgeführt, solange dieses
Workspace-Plugin deaktiviert bleibt oder von der Allowlist ausgeschlossen ist. Verlinkte Installationen
und explizite `plugins.load.paths`-Einträge folgen der normalen Richtlinie für ihren
aufgelösten Plugin-Ursprung. Siehe
[Plugin-Richtlinie konfigurieren](/de/tools/plugin#configure-plugin-policy)
und [Konfigurationsreferenz](/de/gateway/configuration-reference#plugins).

`--force` wird mit `--link` nicht unterstützt, weil verlinkte Installationen den Quellpfad wiederverwenden, statt ein verwaltetes Installationsziel zu überschreiben.

Verwenden Sie `--pin` bei npm-Installationen, um die aufgelöste exakte Spezifikation (`name@version`) im verwalteten Plugin-Index zu speichern, während das Standardverhalten ungepinnt bleibt.
</Note>

### Plugin-Index

Plugin-Installationsmetadaten sind maschinenverwalteter Zustand, keine Benutzerkonfiguration. Installationen und Updates schreiben sie in die gemeinsame SQLite-Zustandsdatenbank unter dem aktiven OpenClaw-Zustandsverzeichnis. Die Zeile `installed_plugin_index` speichert dauerhafte `installRecords`-Metadaten, einschließlich Datensätzen für defekte oder fehlende Plugin-Manifeste, sowie einen aus dem Manifest abgeleiteten Cold-Registry-Cache, der von `openclaw plugins update`, Deinstallation, Diagnose und der kalten Plugin-Registry verwendet wird.

Wenn OpenClaw ausgelieferte Legacy-`plugins.installs`-Datensätze in der Konfiguration findet, behandelt die Laufzeit sie als Kompatibilitätseingabe, ohne `openclaw.json` umzuschreiben. Explizite Plugin-Schreibvorgänge und `openclaw doctor --fix` verschieben diese Datensätze in den Plugin-Index und entfernen den Konfigurationsschlüssel, wenn Konfigurationsschreibvorgänge zulässig sind; schlägt einer der Schreibvorgänge fehl, bleiben die Konfigurationsdatensätze erhalten, damit die Installationsmetadaten nicht verloren gehen.

### Deinstallieren

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` entfernt Plugin-Datensätze aus `plugins.entries`, dem persistierten Plugin-Index, Plugin-Allow-/Denylist-Einträgen und gegebenenfalls verlinkten `plugins.load.paths`-Einträgen. Sofern `--keep-files` nicht gesetzt ist, entfernt die Deinstallation auch das nachverfolgte verwaltete Installationsverzeichnis, wenn es sich innerhalb des Plugin-`extensions`-Roots von OpenClaw befindet. Bei Active-Memory-Plugins wird der Speicher-Slot auf `memory-core` zurückgesetzt.

<Note>
`--keep-config` wird als veralteter Alias für `--keep-files` unterstützt.
</Note>

### Aktualisieren

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --acknowledge-clawhub-risk
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Updates gelten für nachverfolgte Plugin-Installationen im verwalteten Plugin-Index und nachverfolgte Hook-Pack-Installationen in `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Plugin-ID gegenüber npm-Spezifikation auflösen">
    Wenn Sie eine Plugin-ID übergeben, verwendet OpenClaw die aufgezeichnete Installationsspezifikation für dieses Plugin wieder. Das bedeutet, dass zuvor gespeicherte Dist-Tags wie `@beta` und exakt gepinnte Versionen auch bei späteren `update <id>`-Läufen weiter verwendet werden.

    Diese Regel für gezielte Updates unterscheidet sich vom Wartungspfad für Massenupdates `openclaw plugins update --all`. Massenupdates berücksichtigen weiterhin gewöhnliche nachverfolgte Installationsspezifikationen, aber vertrauenswürdige offizielle OpenClaw-Plugin-Datensätze können mit dem aktuellen offiziellen Katalogziel synchronisiert werden, statt auf einem veralteten exakten offiziellen Paket zu bleiben. Verwenden Sie gezielt `update <id>`, wenn Sie eine exakte oder getaggte offizielle Spezifikation absichtlich unverändert lassen möchten.

    Für npm-Installationen können Sie auch eine explizite npm-Paketspezifikation mit Dist-Tag oder exakter Version übergeben. OpenClaw löst diesen Paketnamen auf den nachverfolgten Plugin-Datensatz zurück, aktualisiert dieses installierte Plugin und zeichnet die neue npm-Spezifikation für künftige ID-basierte Updates auf.

    Auch die Übergabe des npm-Paketnamens ohne Version oder Tag wird auf den nachverfolgten Plugin-Datensatz zurück aufgelöst. Verwenden Sie dies, wenn ein Plugin auf eine exakte Version gepinnt war und Sie es zurück auf die Standard-Release-Linie der Registry verschieben möchten.

  </Accordion>
  <Accordion title="Updates im Beta-Channel">
    Gezieltes `openclaw plugins update <id-or-npm-spec>` verwendet die nachverfolgte Plugin-Spezifikation wieder, sofern Sie keine neue Spezifikation übergeben. Massenupdates mit `openclaw plugins update --all` verwenden den konfigurierten `update.channel`, wenn sie vertrauenswürdige offizielle Plugin-Datensätze mit dem offiziellen Katalogziel synchronisieren, sodass Installationen im Beta-Channel auf der Beta-Release-Linie bleiben können, statt stillschweigend auf stable/latest normalisiert zu werden.

    `openclaw update` kennt außerdem den aktiven OpenClaw-Update-Channel: Im Beta-Channel versuchen npm- und ClawHub-Plugin-Datensätze der Standardlinie zuerst `@beta`. Sie fallen auf die aufgezeichnete default/latest-Spezifikation zurück, wenn kein Plugin-Beta-Release existiert; npm-Plugins fallen außerdem zurück, wenn das Beta-Paket existiert, aber bei der Installationsvalidierung fehlschlägt. Dieser Fallback wird als Warnung gemeldet und lässt das Core-Update nicht fehlschlagen. Exakte Versionen und explizite Tags bleiben für gezielte Updates an diesen Selektor gepinnt.

  </Accordion>
  <Accordion title="Versionsprüfungen und Integritätsdrift">
    Vor einem Live-npm-Update prüft OpenClaw die installierte Paketversion gegen die npm-Registry-Metadaten. Wenn die installierte Version und die aufgezeichnete Artefaktidentität bereits mit dem aufgelösten Ziel übereinstimmen, wird das Update übersprungen, ohne herunterzuladen, neu zu installieren oder `openclaw.json` umzuschreiben.

    Wenn ein gespeicherter Integritäts-Hash vorhanden ist und sich der abgerufene Artefakt-Hash ändert, behandelt OpenClaw dies als npm-Artefaktdrift. Der interaktive Befehl `openclaw plugins update` gibt die erwarteten und tatsächlichen Hashes aus und fragt vor dem Fortfahren nach Bestätigung. Nicht interaktive Update-Helfer schlagen fail-closed fehl, sofern der Aufrufer keine explizite Fortsetzungsrichtlinie bereitstellt.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install bei update">
    `--dangerously-force-unsafe-install` wird aus Kompatibilitätsgründen auch bei `plugins update` akzeptiert, ist jedoch veraltet und ändert das Verhalten von Plugin-Updates nicht mehr. Die Operator-`security.installPolicy` kann Updates weiterhin blockieren; Plugin-`before_install`-Hooks gelten nur in Prozessen, in denen Plugin-Hooks geladen sind.
  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk bei update">
    Community-Plugin-Updates, die auf ClawHub basieren, führen vor dem Herunterladen des Ersatzpakets dieselbe Vertrauensprüfung für exakte Releases aus wie Installationen. Verwenden Sie `--acknowledge-clawhub-risk` für geprüfte Automatisierung, die fortfahren soll, wenn das ausgewählte ClawHub-Release eine riskante Vertrauenswarnung hat. Offizielle ClawHub-Pakete und gebündelte OpenClaw-Plugin-Quellen umgehen diese Release-Vertrauensabfrage.
  </Accordion>
</AccordionGroup>

### Prüfen

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect zeigt standardmäßig Identität, Ladestatus, Quelle, Manifest-Fähigkeiten, Richtlinienflags, Diagnosen, Installationsmetadaten, Bundle-Fähigkeiten und erkannte Unterstützung für MCP- oder LSP-Server, ohne die Plugin-Laufzeit zu importieren. JSON-Ausgabe enthält die Plugin-Manifest-Verträge, etwa `contracts.agentToolResultMiddleware` und `contracts.trustedToolPolicies`, sodass Operatoren vertrauenswürdige Surface-Deklarationen vor dem Aktivieren oder Neustarten eines Plugins prüfen können. Fügen Sie `--runtime` hinzu, um das Plugin-Modul zu laden und registrierte Hooks, Tools, Befehle, Dienste, Gateway-Methoden und HTTP-Routen einzubeziehen. Die Laufzeitprüfung meldet fehlende Plugin-Abhängigkeiten direkt; Installationen und Reparaturen verbleiben in `openclaw plugins install`, `openclaw plugins update` und `openclaw doctor --fix`.

Plugin-eigene CLI-Befehle werden normalerweise als Root-`openclaw`-Befehlsgruppen installiert, aber Plugins können auch verschachtelte Befehle unter einem Core-Elternbefehl wie `openclaw nodes` registrieren. Nachdem `inspect --runtime` einen Befehl unter `cliCommands` anzeigt, führen Sie ihn unter dem aufgeführten Pfad aus; ein Plugin, das `demo-git` registriert, kann beispielsweise mit `openclaw demo-git ping` verifiziert werden.

Jedes Plugin wird danach klassifiziert, was es zur Laufzeit tatsächlich registriert:

- **plain-capability** — ein Fähigkeitstyp (z. B. ein reines Provider-Plugin)
- **hybrid-capability** — mehrere Fähigkeitstypen (z. B. Text + Sprache + Bilder)
- **hook-only** — nur Hooks, keine Fähigkeiten oder Surfaces
- **non-capability** — Tools/Befehle/Dienste, aber keine Fähigkeiten

Weitere Informationen zum Fähigkeitsmodell finden Sie unter [Plugin-Formen](/de/plugins/architecture#plugin-shapes).

<Note>
Das Flag `--json` gibt einen maschinenlesbaren Bericht aus, der für Skripting und Audits geeignet ist. `inspect --all` rendert eine flottenweite Tabelle mit Spalten für Form, Fähigkeitsarten, Kompatibilitätshinweise, Bundle-Fähigkeiten und Hook-Zusammenfassung. `info` ist ein Alias für `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` meldet Plugin-Ladefehler, Manifest-/Discovery-Diagnosen, Kompatibilitätshinweise und veraltete Plugin-Konfigurationsreferenzen wie fehlende Plugin-Slots. Wenn der Installationsbaum und die Plugin-Konfiguration sauber sind, wird `No plugin issues detected.` ausgegeben. Wenn veraltete Konfiguration verbleibt, der Installationsbaum aber ansonsten gesund ist, sagt die Zusammenfassung dies, statt vollständige Plugin-Gesundheit zu implizieren.

Wenn ein konfiguriertes Plugin auf der Festplatte vorhanden ist, aber durch die Pfadsicherheitsprüfungen des Loaders blockiert wird, behält die Konfigurationsvalidierung den Plugin-Eintrag bei und meldet ihn als `present but blocked`. Beheben Sie die vorherige Diagnose für blockierte Plugins, etwa Pfadeigentümerschaft oder weltbeschreibbare Berechtigungen, statt die Konfiguration `plugins.entries.<id>` oder `plugins.allow` zu entfernen.

Bei Modulform-Fehlern wie fehlenden `register`-/`activate`-Exporten führen Sie den Befehl erneut mit `OPENCLAW_PLUGIN_LOAD_DEBUG=1` aus, um eine kompakte Exportform-Zusammenfassung in die Diagnoseausgabe aufzunehmen.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Die lokale Plugin-Registry ist das persistierte Cold-Read-Modell von OpenClaw für installierte Plugin-Identität, Aktivierung, Quellmetadaten und Beitragsverantwortung. Normaler Start, Provider-Eigentümer-Lookup, Channel-Setup-Klassifizierung und Plugin-Inventar können daraus lesen, ohne Plugin-Laufzeitmodule zu importieren.

Verwenden Sie `plugins registry`, um zu prüfen, ob die persistierte Registry vorhanden, aktuell oder veraltet ist. Verwenden Sie `--refresh`, um sie aus dem persistierten Plugin-Index, der Konfigurationsrichtlinie und Manifest-/Paketmetadaten neu aufzubauen. Dies ist ein Reparaturpfad, kein Laufzeit-Aktivierungspfad.

`openclaw doctor --fix` repariert außerdem Registry-nahe verwaltete npm-Drift: Wenn ein verwaistes oder wiederhergestelltes `@openclaw/*`-Paket unter einem verwalteten Plugin-npm-Projekt oder dem alten flachen verwalteten npm-Root ein gebündeltes Plugin überschattet, entfernt Doctor dieses veraltete Paket und baut die Registry neu auf, damit der Start gegen das gebündelte Manifest validiert. Doctor verlinkt außerdem das Host-Paket `openclaw` erneut in verwaltete npm-Plugins, die `peerDependencies.openclaw` deklarieren, sodass paketlokale Laufzeitimporte wie `openclaw/plugin-sdk/*` nach Updates oder npm-Reparaturen aufgelöst werden.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` ist ein veralteter Break-Glass-Kompatibilitätsschalter für Registry-Lesefehler. Bevorzugen Sie `plugins registry --refresh` oder `openclaw doctor --fix`; der Env-Fallback dient nur zur Notfallwiederherstellung des Starts, während die Migration ausgerollt wird.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
```

Marketplace list akzeptiert einen lokalen Marketplace-Pfad, einen `marketplace.json`-Pfad, eine GitHub-Kurzform wie `owner/repo`, eine GitHub-Repo-URL oder eine git-URL. `--json` gibt das aufgelöste Quelllabel sowie das geparste Marketplace-Manifest und die Plugin-Einträge aus.

## Verwandt

- [Plugins erstellen](/de/plugins/building-plugins)
- [CLI-Referenz](/de/cli)
- [ClawHub](/de/clawhub)
