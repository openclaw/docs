---
read_when:
    - Sie möchten Gateway-Plugins oder kompatible Bundles installieren oder verwalten
    - Sie möchten ein einfaches Tool-Plugin erstellen oder validieren
    - Sie möchten Fehler beim Laden von Plugins debuggen
sidebarTitle: Plugins
summary: CLI-Referenz für `openclaw plugins` (init, build, validate, list, install, marketplace, uninstall, enable/disable, doctor)
title: Plugins
x-i18n:
    generated_at: "2026-06-28T22:33:40Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 528a7ead224eab330bc0a83314d205a68c7f814ad336441aee7b19170c105e43
    source_path: cli/plugins.md
    workflow: 16
---

Gateway-Plugins, Hook-Packs und kompatible Bundles verwalten.

<CardGroup cols={2}>
  <Card title="Plugin-System" href="/de/tools/plugin">
    Leitfaden für Endbenutzer zum Installieren, Aktivieren und Beheben von Problemen mit Plugins.
  </Card>
  <Card title="Plugins verwalten" href="/de/plugins/manage-plugins">
    Kurze Beispiele für Installation, Auflistung, Aktualisierung, Deinstallation und Veröffentlichung.
  </Card>
  <Card title="Plugin-Bundles" href="/de/plugins/bundles">
    Kompatibilitätsmodell für Bundles.
  </Card>
  <Card title="Plugin-Manifest" href="/de/plugins/manifest">
    Manifestfelder und Konfigurationsschema.
  </Card>
  <Card title="Sicherheit" href="/de/gateway/security">
    Sicherheits-Härtung für Plugin-Installationen.
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
openclaw plugins marketplace entries
openclaw plugins marketplace entries --offline
openclaw plugins marketplace entries --json
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

Für Untersuchungen langsamer Installationen, Inspektionen, Deinstallationen oder Registry-Aktualisierungen führen Sie den
Befehl mit `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` aus. Der Trace schreibt Phasen-Timings
nach stderr und hält JSON-Ausgaben parsebar. Siehe [Debugging](/de/help/debugging#plugin-lifecycle-trace).

<Note>
Im Nix-Modus (`OPENCLAW_NIX_MODE=1`) sind Mutatoren für den Plugin-Lebenszyklus deaktiviert. Verwenden Sie für diese Installation die Nix-Quelle statt `plugins install`, `plugins update`, `plugins uninstall`, `plugins enable` oder `plugins disable`; für nix-openclaw verwenden Sie den agentenzentrierten [Schnellstart](https://github.com/openclaw/nix-openclaw#quick-start).
</Note>

<Note>
Gebündelte Plugins werden mit OpenClaw ausgeliefert. Einige sind standardmäßig aktiviert (zum Beispiel gebündelte Modell-Provider, gebündelte Sprach-Provider und das gebündelte Browser-Plugin); andere erfordern `plugins enable`.

Native OpenClaw-Plugins müssen `openclaw.plugin.json` mit einem eingebetteten JSON-Schema (`configSchema`, auch wenn leer) ausliefern. Kompatible Bundles verwenden stattdessen ihre eigenen Bundle-Manifeste.

`plugins list` zeigt `Format: openclaw` oder `Format: bundle`. Ausführliche Listen-/Info-Ausgaben zeigen außerdem den Bundle-Untertyp (`codex`, `claude` oder `cursor`) sowie erkannte Bundle-Funktionen.
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
den vollständigen Workflow zum Erstellen von Tools.

Das Gerüst schreibt TypeScript-Quellcode, generiert Metadaten aber aus dem gebauten
Einstiegspunkt `./dist/index.js`, sodass der Workflow auch mit der veröffentlichten CLI funktioniert. Verwenden Sie
`--entry <path>`, wenn der Einstiegspunkt nicht der standardmäßige Paketeinstiegspunkt ist. Verwenden Sie
`plugins build --check` in CI, damit bei veralteten generierten Metadaten ein Fehler ausgelöst wird, ohne
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
API-Schlüssel-Infrastruktur, einem integrierten `npm run validate`-Skript für `clawhub package
validate`, ClawHub-Paketmetadaten und einem manuell ausgelösten GitHub-Workflow
für künftige vertrauenswürdige Veröffentlichungen über GitHub Actions OIDC. Provider-Gerüste
generieren keine Skills und verwenden weder `openclaw plugins build` noch
`openclaw plugins validate`; diese Befehle sind für den Pfad generierter Metadaten des Tool-Gerüsts
bestimmt.

Ersetzen Sie vor der Veröffentlichung die Platzhalter für API-Basis-URL, Modellkatalog, Docs-
Route, Anmeldedatentext und README-Text durch echte Provider-Details. Verwenden Sie die
generierte README für die erste ClawHub-Veröffentlichung und die Einrichtung als vertrauenswürdiger Publisher.

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
mit abgesicherten Umgebungsvariablen überschreiben. Siehe
[Überschreibungen für Plugin-Installationen](/de/plugins/install-overrides).

<Warning>
Nackte Paketnamen installieren während der Launch-Umstellung standardmäßig von npm, sofern sie keiner offiziellen Plugin-ID entsprechen. Rohe `@openclaw/*`-Paketspezifikationen, die gebündelten Plugins entsprechen, verwenden die gebündelte Kopie, die mit dem aktuellen OpenClaw-Build ausgeliefert wurde. Verwenden Sie `npm:<package>`, wenn Sie bewusst stattdessen ein externes npm-Paket nutzen möchten. Verwenden Sie `clawhub:<package>` für ClawHub. Behandeln Sie Plugin-Installationen wie das Ausführen von Code. Bevorzugen Sie gepinnte Versionen.
</Warning>

`plugins search` fragt ClawHub nach installierbaren Plugin-Paketen ab und gibt
installationsbereite Paketnamen aus. Es durchsucht Code-Plugin- und Bundle-Plugin-Pakete,
nicht Skills. Verwenden Sie `openclaw skills search` für ClawHub-Skills.

<Note>
ClawHub ist die primäre Distributions- und Entdeckungsfläche für die meisten Plugins. Npm
bleibt ein unterstützter Fallback- und Direktinstallationspfad. OpenClaw-eigene
`@openclaw/*`-Plugin-Pakete werden wieder auf npm veröffentlicht; siehe die aktuelle Liste
auf [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) oder im
[Plugin-Inventar](/de/plugins/plugin-inventory). Stabile Installationen verwenden `latest`.
Installationen und Aktualisierungen im Beta-Channel bevorzugen den npm-Dist-Tag `beta`, wenn dieser Tag
verfügbar ist, und fallen dann auf `latest` zurück.
</Note>

<AccordionGroup>
  <Accordion title="Config-Includes und Reparatur ungültiger Konfiguration">
    Wenn Ihr Abschnitt `plugins` durch ein Single-File-`$include` gestützt wird, schreiben `plugins install/update/enable/disable/uninstall` in diese eingebundene Datei durch und lassen `openclaw.json` unverändert. Root-Includes, Include-Arrays und Includes mit benachbarten Überschreibungen schlagen geschlossen fehl, statt flach zusammengeführt zu werden. Siehe [Config-Includes](/de/gateway/configuration) für die unterstützten Formen.

    Wenn die Konfiguration während der Installation ungültig ist, schlägt `plugins install` normalerweise geschlossen fehl und weist Sie an, zuerst `openclaw doctor --fix` auszuführen. Beim Gateway-Start und Hot Reload schlägt ungültige Plugin-Konfiguration wie jede andere ungültige Konfiguration geschlossen fehl; `openclaw doctor --fix` kann den ungültigen Plugin-Eintrag quarantänisieren. Die einzige dokumentierte Ausnahme zur Installationszeit ist ein enger Wiederherstellungspfad für gebündelte Plugins, die explizit `openclaw.install.allowInvalidConfigRecovery` aktivieren.

  </Accordion>
  <Accordion title="--force und Neuinstallation vs. Aktualisierung">
    `--force` verwendet das vorhandene Installationsziel wieder und überschreibt ein bereits installiertes Plugin oder einen Hook-Pack an Ort und Stelle. Verwenden Sie es, wenn Sie absichtlich dieselbe ID aus einem neuen lokalen Pfad, Archiv, ClawHub-Paket oder npm-Artefakt neu installieren. Für routinemäßige Upgrades eines bereits nachverfolgten npm-Plugins bevorzugen Sie `openclaw plugins update <id-or-npm-spec>`.

    Wenn Sie `plugins install` für eine bereits installierte Plugin-ID ausführen, hält OpenClaw an und verweist Sie für ein normales Upgrade auf `plugins update <id-or-npm-spec>` oder auf `plugins install <package> --force`, wenn Sie die aktuelle Installation wirklich aus einer anderen Quelle überschreiben möchten.

  </Accordion>
  <Accordion title="Geltungsbereich von --pin">
    `--pin` gilt nur für npm-Installationen. Es wird mit `git:`-Installationen nicht unterstützt; verwenden Sie eine explizite Git-Ref wie `git:github.com/acme/plugin@v1.2.3`, wenn Sie eine gepinnte Quelle wünschen. Es wird mit `--marketplace` nicht unterstützt, weil Marketplace-Installationen Marketplace-Quellenmetadaten statt einer npm-Spezifikation dauerhaft speichern.
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` ist veraltet und jetzt wirkungslos. OpenClaw führt keine integrierte Blockierung gefährlichen Codes zur Installationszeit für Plugin-Installationen mehr aus.

    Verwenden Sie die gemeinsame, betreiberverwaltete Oberfläche `security.installPolicy`, wenn hostspezifische Installationsrichtlinien erforderlich sind. Plugin-`before_install`-Hooks sind Lebenszyklus-Hooks der Plugin-Runtime und nicht die primäre Richtliniengrenze für CLI-Installationen.

    Wenn ein von Ihnen auf ClawHub veröffentlichtes Plugin durch einen Registry-Scan ausgeblendet oder blockiert wird, verwenden Sie die Publisher-Schritte unter [ClawHub-Veröffentlichung](/de/clawhub/publishing). `--dangerously-force-unsafe-install` fordert ClawHub nicht auf, das Plugin erneut zu scannen oder eine blockierte Veröffentlichung öffentlich zu machen.

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    Community-ClawHub-Installationen prüfen den Vertrauensdatensatz der ausgewählten Veröffentlichung, bevor das Paket heruntergeladen wird. Wenn ClawHub den Download für die Veröffentlichung deaktiviert, bösartige Scan-Funde meldet oder die Veröffentlichung in einen blockierenden Moderationszustand wie Quarantäne versetzt, verweigert OpenClaw die Veröffentlichung. Bei nicht blockierenden riskanten Scan-Status, riskanten Moderationszuständen oder Registry-Gründen zeigt OpenClaw die Vertrauensdetails an und fragt vor dem Fortfahren nach Bestätigung.

    Verwenden Sie `--acknowledge-clawhub-risk` nur, nachdem Sie die ClawHub-Warnung geprüft und entschieden haben, ohne interaktive Eingabeaufforderung fortzufahren. Ausstehende oder veraltete saubere Vertrauensdatensätze warnen, erfordern aber keine Bestätigung. Offizielle ClawHub-Pakete und gebündelte OpenClaw-Plugin-Quellen umgehen diese Vertrauensabfrage für Veröffentlichungen.

  </Accordion>
  <Accordion title="Hook-Packs und npm-Spezifikationen">
    `plugins install` ist auch die Installationsfläche für Hook-Packs, die `openclaw.hooks` in `package.json` bereitstellen. Verwenden Sie `openclaw hooks` für gefilterte Hook-Sichtbarkeit und Aktivierung pro Hook, nicht für die Paketinstallation.

    Npm-Spezifikationen sind **nur Registry-basiert** (Paketname + optional **exakte Version** oder **dist-tag**). Git-/URL-/Datei-Spezifikationen und Semver-Bereiche werden abgelehnt. Dependency-Installationen laufen aus Sicherheitsgründen in einem verwalteten npm-Projekt pro Plugin mit `--ignore-scripts`, selbst wenn Ihre Shell globale npm-Installationseinstellungen hat. Verwaltete Plugin-npm-Projekte erben OpenClaws npm-`overrides` auf Paketebene, sodass Security-Pins des Hosts auch für hoisted Plugin-Dependencies gelten.

    Verwenden Sie `npm:<package>`, wenn Sie die npm-Auflösung explizit machen möchten. Bloße Paketspezifikationen installieren während der Launch-Umstellung ebenfalls direkt aus npm, sofern sie nicht einer offiziellen Plugin-ID entsprechen.

    Rohe `@openclaw/*`-Paketspezifikationen, die gebündelten Plugins entsprechen, werden vor dem npm-Fallback auf die image-eigene gebündelte Kopie aufgelöst. Zum Beispiel verwendet `openclaw plugins install @openclaw/discord@2026.5.20 --pin` das gebündelte Discord-Plugin aus dem aktuellen OpenClaw-Build, statt einen verwalteten npm-Override zu erstellen. Um das externe npm-Paket zu erzwingen, verwenden Sie `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin`.

    Bloße Spezifikationen und `@latest` bleiben auf dem Stable-Track. Datumsbasierte OpenClaw-Korrekturversionen wie `2026.5.3-1` sind für diese Prüfung stabile Releases. Wenn npm eine davon zu einem Prerelease auflöst, stoppt OpenClaw und fordert Sie auf, sich explizit mit einem Prerelease-Tag wie `@beta`/`@rc` oder einer exakten Prerelease-Version wie `@1.2.3-beta.4` dafür zu entscheiden.

    Bei npm-Installationen ohne exakte Version (`npm:<package>` oder `npm:<package>@latest`) prüft OpenClaw die aufgelösten Paketmetadaten vor der Installation. Wenn das neueste stabile Paket eine neuere OpenClaw-Plugin-API oder Mindest-Hostversion erfordert, prüft OpenClaw ältere stabile Versionen und installiert stattdessen das neueste kompatible Release. Exakte Versionen und explizite dist-tags wie `@beta` bleiben strikt: Wenn das ausgewählte Paket inkompatibel ist, schlägt der Befehl fehl und fordert Sie auf, OpenClaw zu aktualisieren oder eine kompatible Version zu wählen.

    Wenn eine bloße Installationsspezifikation einer offiziellen Plugin-ID entspricht (zum Beispiel `diffs`), installiert OpenClaw den Katalogeintrag direkt. Um ein gleichnamiges npm-Paket zu installieren, verwenden Sie eine explizite scoped Spezifikation (zum Beispiel `@scope/diffs`).

  </Accordion>
  <Accordion title="Git repositories">
    Verwenden Sie `git:<repo>`, um direkt aus einem Git-Repository zu installieren. Unterstützte Formen umfassen `git:github.com/owner/repo`, `git:owner/repo`, vollständige `https://`-, `ssh://`-, `git://`-, `file://`- und `git@host:owner/repo.git`-Clone-URLs. Fügen Sie `@<ref>` oder `#<ref>` hinzu, um vor der Installation einen Branch, Tag oder Commit auszuchecken.

    Git-Installationen klonen in ein temporäres Verzeichnis, checken die angeforderte Ref aus, falls vorhanden, und verwenden dann den normalen Installer für Plugin-Verzeichnisse. Das bedeutet, dass Manifestvalidierung, Operator-Installationsrichtlinie, Installationsarbeit des Paketmanagers und Installationsdatensätze sich wie bei npm-Installationen verhalten. Aufgezeichnete Git-Installationen enthalten die Quell-URL/Ref plus den aufgelösten Commit, sodass `openclaw plugins update` die Quelle später erneut auflösen kann.

    Nach der Installation aus Git verwenden Sie `openclaw plugins inspect <id> --runtime --json`, um Runtime-Registrierungen wie Gateway-Methoden und CLI-Befehle zu verifizieren. Wenn das Plugin mit `api.registerCli` eine CLI-Root registriert hat, führen Sie diesen Befehl direkt über die OpenClaw-Root-CLI aus, zum Beispiel `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archives">
    Unterstützte Archive: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Native OpenClaw-Plugin-Archive müssen ein gültiges `openclaw.plugin.json` im extrahierten Plugin-Root enthalten; Archive, die nur `package.json` enthalten, werden abgelehnt, bevor OpenClaw Installationsdatensätze schreibt.

    Verwenden Sie `npm-pack:<path.tgz>`, wenn die Datei ein npm-pack-Tarball ist und Sie
    denselben verwalteten npm-Projektpfad pro Plugin testen möchten, der von Registry-
    Installationen verwendet wird, einschließlich `package-lock.json`-Verifizierung, hoisted Dependency-
    Scanning und npm-Installationsdatensätzen. Einfache Archivpfade werden weiterhin als lokale
    Archive unter dem Plugin-Extensions-Root installiert.

    Claude-Marketplace-Installationen werden ebenfalls unterstützt.

  </Accordion>
</AccordionGroup>

ClawHub-Installationen verwenden einen expliziten `clawhub:<package>`-Locator:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Bloße npm-sichere Plugin-Spezifikationen installieren während der Launch-Umstellung standardmäßig aus npm, sofern sie nicht einer offiziellen Plugin-ID entsprechen:

```bash
openclaw plugins install openclaw-codex-app-server
```

Verwenden Sie `npm:`, um eine reine npm-Auflösung explizit zu machen:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw prüft die angekündigte Plugin-API-/Mindest-Gateway-Kompatibilität vor der Installation. Wenn die ausgewählte ClawHub-Version ein ClawPack-Artefakt veröffentlicht, lädt OpenClaw das versionierte npm-pack-`.tgz` herunter, verifiziert den ClawHub-Digest-Header und den Artefakt-Digest und installiert es dann über den normalen Archivpfad. Ältere ClawHub-Versionen ohne ClawPack-Metadaten installieren weiterhin über den Legacy-Paketarchiv-Verifizierungspfad. Aufgezeichnete Installationen behalten ihre ClawHub-Quellmetadaten, Artefaktart, npm-Integrität, npm-shasum, Tarball-Namen und ClawPack-Digest-Fakten für spätere Updates.
Unversionierte ClawHub-Installationen behalten eine unversionierte aufgezeichnete Spezifikation, sodass `openclaw plugins update` neueren ClawHub-Releases folgen kann; explizite Versions- oder Tag-Selektoren wie `clawhub:pkg@1.2.3` und `clawhub:pkg@beta` bleiben an diesen Selektor gepinnt.

#### Marketplace-Kurzschreibweise

Verwenden Sie die `plugin@marketplace`-Kurzschreibweise, wenn der Marketplace-Name in Claudes lokalem Registry-Cache unter `~/.claude/plugins/known_marketplaces.json` vorhanden ist:

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
    - ein lokaler Marketplace-Root oder `marketplace.json`-Pfad
    - eine GitHub-Repository-Kurzschreibweise wie `owner/repo`
    - eine GitHub-Repository-URL wie `https://github.com/owner/repo`
    - eine Git-URL

  </Tab>
  <Tab title="Remote marketplace rules">
    Für Remote-Marketplaces, die aus GitHub oder Git geladen werden, müssen Plugin-Einträge innerhalb des geklonten Marketplace-Repositorys bleiben. OpenClaw akzeptiert relative Pfadquellen aus diesem Repository und lehnt HTTP(S)-, absolute Pfad-, Git-, GitHub- und andere Nicht-Pfad-Plugin-Quellen aus Remote-Manifesten ab.
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
Kompatible Bundles werden im normalen Plugin-Root installiert und nehmen am gleichen List-/Info-/Enable-/Disable-Ablauf teil. Derzeit werden Bundle-Skills, Claude-Befehls-Skills, Claude-Standardwerte für `settings.json`, Claude-Standardwerte für `.lsp.json` / per Manifest deklarierte `lspServers`, Cursor-Befehls-Skills und kompatible Codex-Hook-Verzeichnisse unterstützt; andere erkannte Bundle-Fähigkeiten werden in Diagnosen/Info angezeigt, sind aber noch nicht mit der Runtime-Ausführung verdrahtet.
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
  Maschinenlesbares Inventar plus Registry-Diagnosen und Installationsstatus von Paket-Dependencies.
</ParamField>

<Note>
`plugins list` liest zuerst die persistierte lokale Plugin-Registry, mit einem nur aus Manifesten abgeleiteten Fallback, wenn die Registry fehlt oder ungültig ist. Das ist nützlich, um zu prüfen, ob ein Plugin installiert, aktiviert und für die Planung eines Kaltstarts sichtbar ist, aber es ist keine Live-Runtime-Prüfung eines bereits laufenden Gateway-Prozesses. Nach Änderungen an Plugin-Code, Aktivierung, Hook-Richtlinie oder `plugins.load.paths` starten Sie das Gateway neu, das den Kanal bedient, bevor Sie erwarten, dass neuer `register(api)`-Code oder Hooks ausgeführt werden. Verifizieren Sie bei Remote-/Container-Deployments, dass Sie den tatsächlichen `openclaw gateway run`-Child neu starten, nicht nur einen Wrapper-Prozess.

`plugins list --json` enthält den `dependencyStatus` jedes Plugins aus `package.json`
`dependencies` und `optionalDependencies`. OpenClaw prüft, ob diese Paket-
namen entlang des normalen Node-`node_modules`-Lookup-Pfads des Plugins vorhanden sind; es
importiert keinen Plugin-Runtime-Code, führt keinen Paketmanager aus und repariert keine fehlenden
Dependencies.
</Note>

Wenn Startup `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...` protokolliert,
führen Sie `openclaw plugins list --enabled --verbose` oder
`openclaw plugins inspect <id>` mit einer gelisteten Plugin-ID aus, um die Plugin-
IDs zu bestätigen, und kopieren Sie vertrauenswürdige IDs in `plugins.allow` in `openclaw.json`. Wenn die
Warnung jedes entdeckte Plugin listen kann, gibt sie ein direkt einfügbares
`plugins.allow`-Snippet aus, das diese IDs bereits enthält. Wenn ein Plugin
ohne Installations-/Load-Path-Provenienz lädt, prüfen Sie diese Plugin-ID und pinnen Sie dann entweder
die vertrauenswürdige ID in `plugins.allow` oder installieren Sie das Plugin aus einer vertrauenswürdigen Quelle neu,
damit OpenClaw die Installationsprovenienz aufzeichnet.

`plugins search` ist eine Remote-ClawHub-Katalogsuche. Sie prüft keinen lokalen
Status, ändert keine Konfiguration, installiert keine Pakete und lädt keinen Plugin-Runtime-Code. Such-
ergebnisse enthalten den ClawHub-Paketnamen, die Familie, den Kanal, die Version, die Zusammenfassung und
einen Installationshinweis wie `openclaw plugins install clawhub:<package>`.

Für gebündelte Plugin-Arbeit innerhalb eines paketierten Docker-Images binden Sie das Plugin-
Quellverzeichnis über den passenden paketierten Quellpfad, wie
`/app/extensions/synology-chat`. OpenClaw entdeckt dieses gemountete Quell-
Overlay vor `/app/dist/extensions/synology-chat`; ein einfach kopiertes Quell-
verzeichnis bleibt inaktiv, sodass normale paketierte Installationen weiterhin die kompilierte Distribution verwenden.

Für Runtime-Hook-Debugging:

- `openclaw plugins inspect <id> --runtime --json` zeigt registrierte Hooks und Diagnosen aus einem modulgeladenen Inspektionsdurchlauf. Runtime-Inspektion installiert niemals Dependencies; verwenden Sie `openclaw doctor --fix`, um Legacy-Dependency-Status zu bereinigen oder fehlende herunterladbare Plugins wiederherzustellen, die von der Konfiguration referenziert werden.
- `openclaw gateway status --deep --require-rpc` bestätigt die erreichbare Gateway-URL/das Profil, Service-/Prozesshinweise, den Konfigurationspfad und die RPC-Integrität.
- Nicht gebündelte Conversation-Hooks (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) erfordern `plugins.entries.<id>.hooks.allowConversationAccess=true`.

Verwenden Sie `--link`, um das Kopieren eines lokalen Plugin-Verzeichnisses zu vermeiden (fügt zu `plugins.load.paths` hinzu):

```bash
openclaw plugins install -l ./my-plugin
```

Eigenständige Plugin-Dateien müssen in `plugins.load.paths` aufgeführt werden, statt
mit `plugins install` installiert oder direkt in `~/.openclaw/extensions`
oder `<workspace>/.openclaw/extensions` abgelegt zu werden. Diese automatisch entdeckten Roots laden Plugin-
Paket- oder Bundle-Verzeichnisse, während Skriptdateien auf oberster Ebene als lokale
Hilfsdateien behandelt und übersprungen werden.

<Note>
Workspace-Ursprungs-Plugins, die aus einem Workspace-Erweiterungsstamm erkannt werden, werden erst
importiert oder ausgeführt, wenn sie ausdrücklich aktiviert sind. Führen Sie für die lokale Entwicklung
`openclaw plugins enable <plugin-id>` aus oder setzen Sie
`plugins.entries.<plugin-id>.enabled: true`; wenn Ihre Konfiguration
`plugins.allow` verwendet, nehmen Sie dieselbe Plugin-ID dort ebenfalls auf. Diese Fail-Closed-Regel
gilt auch, wenn die Kanaleinrichtung ausdrücklich ein Workspace-Ursprungs-Plugin für
reines Setup-Laden auswählt; lokaler Kanal-Plugin-Setup-Code wird daher nicht ausgeführt, solange dieses
Workspace-Plugin deaktiviert bleibt oder von der Allowlist ausgeschlossen ist. Verknüpfte Installationen
und explizite `plugins.load.paths`-Einträge folgen der normalen Richtlinie für ihren
aufgelösten Plugin-Ursprung. Siehe
[Plugin-Richtlinie konfigurieren](/de/tools/plugin#configure-plugin-policy)
und [Konfigurationsreferenz](/de/gateway/configuration-reference#plugins).

`--force` wird mit `--link` nicht unterstützt, weil verknüpfte Installationen den Quellpfad wiederverwenden, statt ein verwaltetes Installationsziel zu überschreiben.

Verwenden Sie `--pin` bei npm-Installationen, um die aufgelöste exakte Spezifikation (`name@version`) im verwalteten Plugin-Index zu speichern, während das Standardverhalten ungepinnt bleibt.
</Note>

### Plugin-Index

Plugin-Installationsmetadaten sind maschinenverwalteter Zustand, keine Benutzerkonfiguration. Installationen und Updates schreiben sie in die gemeinsame SQLite-Zustandsdatenbank unter dem aktiven OpenClaw-Zustandsverzeichnis. Die Zeile `installed_plugin_index` speichert dauerhafte `installRecords`-Metadaten, einschließlich Einträgen für beschädigte oder fehlende Plugin-Manifeste, sowie einen aus dem Manifest abgeleiteten kalten Registry-Cache, der von `openclaw plugins update`, Deinstallation, Diagnose und der kalten Plugin-Registry verwendet wird.

Wenn OpenClaw ausgelieferte Legacy-`plugins.installs`-Einträge in der Konfiguration sieht, behandelt die Laufzeit sie beim Lesen als Kompatibilitätseingabe, ohne `openclaw.json` neu zu schreiben. Explizite Plugin-Schreibvorgänge und `openclaw doctor --fix` verschieben diese Einträge in den Plugin-Index und entfernen den Konfigurationsschlüssel, wenn Konfigurationsschreibvorgänge erlaubt sind; schlägt einer der Schreibvorgänge fehl, bleiben die Konfigurationseinträge erhalten, damit die Installationsmetadaten nicht verloren gehen.

### Deinstallieren

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
```

`uninstall` entfernt Plugin-Einträge aus `plugins.entries`, dem persistierten Plugin-Index, Plugin-Allow-/Denylist-Einträgen und, falls zutreffend, verknüpften `plugins.load.paths`-Einträgen. Sofern `--keep-files` nicht gesetzt ist, entfernt die Deinstallation außerdem das nachverfolgte verwaltete Installationsverzeichnis, wenn es sich im Plugin-Erweiterungsstamm von OpenClaw befindet. Bei Active Memory-Plugins wird der Speicher-Slot auf `memory-core` zurückgesetzt.

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
  <Accordion title="Resolving plugin id vs npm spec">
    Wenn Sie eine Plugin-ID übergeben, verwendet OpenClaw die aufgezeichnete Installationsspezifikation für dieses Plugin wieder. Das bedeutet, dass zuvor gespeicherte Dist-Tags wie `@beta` und exakt gepinnte Versionen auch bei späteren `update <id>`-Läufen weiter verwendet werden.

    Während `update <id> --dry-run` bleiben exakt gepinnte npm-Installationen gepinnt. Wenn OpenClaw außerdem die Standardlinie der Package-Registry auflösen kann und diese Standardlinie neuer ist als die installierte gepinnte Version, meldet der Trockenlauf den Pin und gibt den expliziten `@latest`-Package-Update-Befehl aus, um der Standardlinie der Registry zu folgen.

    Diese Regel für gezielte Updates unterscheidet sich vom Wartungspfad für das gebündelte `openclaw plugins update --all`. Gebündelte Updates respektieren weiterhin gewöhnliche nachverfolgte Installationsspezifikationen, aber vertrauenswürdige offizielle OpenClaw-Plugin-Einträge können mit dem aktuellen Ziel des offiziellen Katalogs synchronisiert werden, statt auf einem veralteten exakten offiziellen Package zu bleiben. Verwenden Sie gezielt `update <id>`, wenn Sie eine exakte oder getaggte offizielle Spezifikation absichtlich unverändert lassen möchten.

    Für npm-Installationen können Sie auch eine explizite npm-Package-Spezifikation mit Dist-Tag oder exakter Version übergeben. OpenClaw löst diesen Package-Namen zurück auf den nachverfolgten Plugin-Eintrag auf, aktualisiert dieses installierte Plugin und zeichnet die neue npm-Spezifikation für künftige ID-basierte Updates auf.

    Wenn Sie den npm-Package-Namen ohne Version oder Tag übergeben, wird er ebenfalls zurück auf den nachverfolgten Plugin-Eintrag aufgelöst. Verwenden Sie dies, wenn ein Plugin auf eine exakte Version gepinnt war und Sie es zurück auf die Standard-Release-Linie der Registry verschieben möchten.

  </Accordion>
  <Accordion title="Beta channel updates">
    Gezieltes `openclaw plugins update <id-or-npm-spec>` verwendet die nachverfolgte Plugin-Spezifikation wieder, sofern Sie keine neue Spezifikation übergeben. Gebündeltes `openclaw plugins update --all` verwendet den konfigurierten `update.channel`, wenn es vertrauenswürdige offizielle Plugin-Einträge mit dem offiziellen Katalogziel synchronisiert, sodass Beta-Kanal-Installationen auf der Beta-Release-Linie bleiben können, statt stillschweigend auf Stable/Latest normalisiert zu werden.

    `openclaw update` kennt auch den aktiven OpenClaw-Update-Kanal: Auf dem Beta-Kanal versuchen npm-Standardlinien- und ClawHub-Plugin-Einträge zuerst `@beta`. Sie fallen auf die aufgezeichnete Standard-/Latest-Spezifikation zurück, wenn keine Plugin-Beta-Release existiert; npm-Plugins fallen auch zurück, wenn das Beta-Package existiert, aber die Installationsvalidierung fehlschlägt. Dieser Fallback wird als Warnung gemeldet und lässt das Kern-Update nicht fehlschlagen. Exakte Versionen und explizite Tags bleiben für gezielte Updates auf diesen Selektor gepinnt.

  </Accordion>
  <Accordion title="Version checks and integrity drift">
    Vor einem Live-npm-Update prüft OpenClaw die installierte Package-Version gegen die npm-Registry-Metadaten. Wenn die installierte Version und die aufgezeichnete Artefaktidentität bereits dem aufgelösten Ziel entsprechen, wird das Update übersprungen, ohne herunterzuladen, neu zu installieren oder `openclaw.json` neu zu schreiben.

    Wenn ein gespeicherter Integritäts-Hash vorhanden ist und sich der Hash des abgerufenen Artefakts ändert, behandelt OpenClaw dies als npm-Artefakt-Drift. Der interaktive Befehl `openclaw plugins update` gibt die erwarteten und tatsächlichen Hashes aus und fragt vor dem Fortfahren nach Bestätigung. Nicht interaktive Update-Helfer schlagen geschlossen fehl, sofern der Aufrufer keine explizite Fortsetzungsrichtlinie bereitstellt.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install on update">
    `--dangerously-force-unsafe-install` wird aus Kompatibilitätsgründen auch bei `plugins update` akzeptiert, ist jedoch veraltet und ändert das Verhalten von Plugin-Updates nicht mehr. Die Betreiberoption `security.installPolicy` kann Updates weiterhin blockieren; Plugin-`before_install`-Hooks gelten nur in Prozessen, in denen Plugin-Hooks geladen sind.
  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk on update">
    Community-Plugin-Updates, die von ClawHub gestützt werden, führen vor dem Herunterladen des Ersatz-Packages dieselbe Vertrauensprüfung für exakte Releases aus wie Installationen. Verwenden Sie `--acknowledge-clawhub-risk` für geprüfte Automatisierung, die fortfahren soll, wenn die ausgewählte ClawHub-Release eine riskante Vertrauenswarnung hat. Offizielle ClawHub-Packages und gebündelte OpenClaw-Plugin-Quellen umgehen diese Release-Vertrauensabfrage.
  </Accordion>
</AccordionGroup>

### Inspizieren

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
```

Inspect zeigt Identität, Ladestatus, Quelle, Manifest-Fähigkeiten, Richtlinien-Flags, Diagnose, Installationsmetadaten, Bundle-Fähigkeiten und jede erkannte MCP- oder LSP-Serverunterstützung, ohne standardmäßig die Plugin-Laufzeit zu importieren. Die JSON-Ausgabe enthält die Plugin-Manifestverträge, etwa `contracts.agentToolResultMiddleware` und `contracts.trustedToolPolicies`, damit Betreiber Trusted-Surface-Deklarationen prüfen können, bevor sie ein Plugin aktivieren oder neu starten. Fügen Sie `--runtime` hinzu, um das Plugin-Modul zu laden und registrierte Hooks, Tools, Befehle, Dienste, Gateway-Methoden und HTTP-Routen einzubeziehen. Die Laufzeitinspektion meldet fehlende Plugin-Abhängigkeiten direkt; Installationen und Reparaturen bleiben in `openclaw plugins install`, `openclaw plugins update` und `openclaw doctor --fix`.

Plugin-eigene CLI-Befehle werden normalerweise als Root-Befehlsgruppen von `openclaw` installiert, Plugins können aber auch verschachtelte Befehle unter einem Kern-Elternbefehl wie `openclaw nodes` registrieren. Nachdem `inspect --runtime` einen Befehl unter `cliCommands` angezeigt hat, führen Sie ihn am aufgelisteten Pfad aus; ein Plugin, das `demo-git` registriert, kann zum Beispiel mit `openclaw demo-git ping` verifiziert werden.

Jedes Plugin wird danach klassifiziert, was es zur Laufzeit tatsächlich registriert:

- **plain-capability** — ein Fähigkeitstyp (z. B. ein reines Provider-Plugin)
- **hybrid-capability** — mehrere Fähigkeitstypen (z. B. Text + Sprache + Bilder)
- **hook-only** — nur Hooks, keine Fähigkeiten oder Oberflächen
- **non-capability** — Tools/Befehle/Dienste, aber keine Fähigkeiten

Weitere Informationen zum Fähigkeitsmodell finden Sie unter [Plugin-Formen](/de/plugins/architecture#plugin-shapes).

<Note>
Das Flag `--json` gibt einen maschinenlesbaren Bericht aus, der sich für Skripting und Auditing eignet. `inspect --all` rendert eine fleetweite Tabelle mit Spalten für Form, Fähigkeitsarten, Kompatibilitätshinweise, Bundle-Fähigkeiten und Hook-Zusammenfassung. `info` ist ein Alias für `inspect`.
</Note>

### Doctor

```bash
openclaw plugins doctor
```

`doctor` meldet Plugin-Ladefehler, Manifest-/Discovery-Diagnosen, Kompatibilitätshinweise und veraltete Plugin-Konfigurationsreferenzen wie fehlende Plugin-Slots. Wenn der Installationsbaum und die Plugin-Konfiguration sauber sind, gibt er `No plugin issues detected.` aus. Wenn veraltete Konfiguration verbleibt, der Installationsbaum aber ansonsten fehlerfrei ist, sagt die Zusammenfassung dies, statt vollständige Plugin-Gesundheit zu implizieren.

Wenn ein konfiguriertes Plugin auf dem Datenträger vorhanden ist, aber durch die Pfadsicherheitsprüfungen des Loaders blockiert wird, behält die Konfigurationsvalidierung den Plugin-Eintrag bei und meldet ihn als `present but blocked`. Beheben Sie die vorherige Diagnose zum blockierten Plugin, etwa Pfadeigentümerschaft oder weltbeschreibbare Berechtigungen, statt die Konfiguration `plugins.entries.<id>` oder `plugins.allow` zu entfernen.

Bei Modulform-Fehlern wie fehlenden `register`-/`activate`-Exports führen Sie den Befehl erneut mit `OPENCLAW_PLUGIN_LOAD_DEBUG=1` aus, um eine kompakte Exportform-Zusammenfassung in die Diagnoseausgabe aufzunehmen.

### Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Die lokale Plugin-Registry ist das persistierte kalte Lesemodell von OpenClaw für installierte Plugin-Identität, Aktivierung, Quellmetadaten und Eigentümerschaft von Beiträgen. Normaler Start, Provider-Owner-Lookup, Klassifizierung der Kanaleinrichtung und Plugin-Inventar können sie lesen, ohne Plugin-Laufzeitmodule zu importieren.

Verwenden Sie `plugins registry`, um zu prüfen, ob die persistierte Registry vorhanden, aktuell oder veraltet ist. Verwenden Sie `--refresh`, um sie aus dem persistierten Plugin-Index, der Konfigurationsrichtlinie und Manifest-/Package-Metadaten neu aufzubauen. Dies ist ein Reparaturpfad, kein Laufzeitaktivierungspfad.

`openclaw doctor --fix` repariert außerdem verwalteten npm-Drift neben der Registry: Wenn ein verwaistes oder wiederhergestelltes `@openclaw/*`-Package unter einem verwalteten Plugin-npm-Projekt oder dem alten flachen verwalteten npm-Stamm ein gebündeltes Plugin überschattet, entfernt Doctor dieses veraltete Package und baut die Registry neu auf, damit der Start gegen das gebündelte Manifest validiert. Doctor verknüpft außerdem das Host-`openclaw`-Package erneut in verwaltete npm-Plugins, die `peerDependencies.openclaw` deklarieren, sodass package-lokale Laufzeitimporte wie `openclaw/plugin-sdk/*` nach Updates oder npm-Reparaturen aufgelöst werden.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` ist ein veralteter Break-Glass-Kompatibilitätsschalter für Registry-Lesefehler. Bevorzugen Sie `plugins registry --refresh` oder `openclaw doctor --fix`; der Env-Fallback ist nur für Notfall-Startwiederherstellung gedacht, während die Migration ausgerollt wird.
</Warning>

### Marketplace

```bash
openclaw plugins marketplace entries
openclaw plugins marketplace entries --offline
openclaw plugins marketplace entries --json
openclaw plugins marketplace entries --feed-profile <name>
openclaw plugins marketplace entries --feed-url <url>
openclaw plugins marketplace list <source>
openclaw plugins marketplace list <source> --json
openclaw plugins marketplace refresh
openclaw plugins marketplace refresh --feed-profile <name>
openclaw plugins marketplace refresh --feed-url <url>
openclaw plugins marketplace refresh --expected-sha256 <sha256> --json
```

`plugins marketplace entries` listet Einträge aus dem konfigurierten OpenClaw-Marktplatz-Feed auf. Standardmäßig versucht es den gehosteten Feed und fällt auf den neuesten akzeptierten Snapshot oder gebündelte Daten zurück. Verwenden Sie `--feed-profile <name>`, um ein bestimmtes konfiguriertes Profil zu lesen, `--feed-url <url>`, um eine explizite gehostete Feed-URL zu lesen, und `--offline`, um den neuesten akzeptierten Snapshot zu lesen, ohne den Feed abzurufen.

`plugins marketplace refresh` aktualisiert den konfigurierten gehosteten Feed-Snapshot und meldet, ob OpenClaw gehostete Daten, einen gehosteten Snapshot oder gebündelte Fallback-Daten akzeptiert hat. Verwenden Sie `--expected-sha256`, wenn ein Aufrufer benötigt, dass der Befehl fehlschlägt, sofern eine frische gehostete Payload nicht mit einer festgelegten Prüfsumme übereinstimmt.

Marketplace `list` akzeptiert einen lokalen Marketplace-Pfad, einen `marketplace.json`-Pfad, eine GitHub-Kurzschreibweise wie `owner/repo`, eine GitHub-Repository-URL oder eine Git-URL. `--json` gibt die aufgelöste Quellbezeichnung sowie das geparste Marketplace-Manifest und die Plugin-Einträge aus.

Marketplace-Aktualisierung lädt einen gehosteten OpenClaw-Marketplace-Feed und speichert die
validierte Antwort als lokalen Snapshot des gehosteten Feeds. Ohne Optionen verwendet sie
das konfigurierte Standard-Feed-Profil. Verwenden Sie `--feed-profile <name>`, um ein
bestimmtes konfiguriertes Profil zu aktualisieren, `--feed-url <url>`, um eine explizite URL
eines gehosteten Feeds zu aktualisieren, `--expected-sha256 <sha256>`, um eine passende Payload-Prüfsumme
(`sha256:<hex>` oder einen einfachen 64-stelligen Hex-Digest) zu verlangen, und `--json` für
maschinenlesbare Ausgabe. Explizite URLs gehosteter Feeds dürfen keine
Anmeldedaten, Query-Strings oder Fragmente enthalten. Nicht gepinnte Aktualisierungen können ein
gehostetes Snapshot- oder gebündeltes Fallback-Ergebnis melden, ohne dass der Befehl fehlschlägt. Gepinnte
Aktualisierungen schlagen fehl, sofern sie keine frische gehostete Payload akzeptieren, und erfolgreiche gehostete
Aktualisierungen schlagen fehl, wenn OpenClaw den validierten Snapshot nicht speichern kann.

## Verwandt

- [Plugins erstellen](/de/plugins/building-plugins)
- [CLI-Referenz](/de/cli)
- [ClawHub](/de/clawhub)
