---
read_when:
    - Sie möchten Gateway-Plugins oder kompatible Bundles installieren oder verwalten
    - Sie möchten ein einfaches Tool-Plugin erstellen oder validieren
    - Sie möchten Fehler beim Laden von Plugins beheben
sidebarTitle: Plugins
summary: CLI-Referenz für `openclaw plugins` (initialisieren, erstellen, validieren, auflisten, installieren, Marketplace, deinstallieren, aktivieren/deaktivieren, Doctor)
title: Plugins
x-i18n:
    generated_at: "2026-07-12T15:14:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 729e74103a302936dc45da3be31306803b16e9dae182e78b3742783b892a9027
    source_path: cli/plugins.md
    workflow: 16
---

Verwalten Sie Gateway-Plugins, Hook-Pakete und kompatible Bundles.

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
    Sicherheitshärtung für Plugin-Installationen.
  </Card>
</CardGroup>

## Befehle

```bash
openclaw plugins list [--enabled] [--verbose] [--json]
openclaw plugins search <query> [--limit <n>] [--json]
openclaw plugins install <path-or-spec> [--link] [--force] [--pin] [--marketplace <source>]
openclaw plugins inspect <id> [--runtime] [--json]
openclaw plugins inspect --all [--runtime] [--json]
openclaw plugins info <id>                    # Alias für inspect
openclaw plugins enable <id>
openclaw plugins disable <id>
openclaw plugins uninstall <id> [--dry-run] [--keep-files] [--force]
openclaw plugins update <id-or-npm-spec> | --all [--dry-run]
openclaw plugins registry [--refresh] [--json]
openclaw plugins doctor
openclaw plugins init <id> [--name <name>] [--type tool|provider] [--directory <path>]
openclaw plugins build [--entry <path>] [--check]
openclaw plugins validate [--entry <path>]
openclaw plugins marketplace entries [--offline] [--feed-profile <name>] [--json]
openclaw plugins marketplace list <source> [--json]
openclaw plugins marketplace refresh [--feed-profile <name>] [--expected-sha256 <sha256>] [--json]
```

Führen Sie zur Untersuchung langsamer Installations-, Inspektions-, Deinstallations- oder Registry-Aktualisierungsvorgänge den
Befehl mit `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` aus. Der Trace schreibt die Phasenlaufzeiten
nach stderr und hält die JSON-Ausgabe analysierbar. Weitere Informationen finden Sie unter [Debugging](/de/help/debugging#plugin-lifecycle-trace).

<Note>
Im Nix-Modus (`OPENCLAW_NIX_MODE=1`) ist `openclaw.json` unveränderlich. `install`, `update`, `uninstall`, `enable` und `disable` verweigern allesamt die Ausführung. Bearbeiten Sie stattdessen die Nix-Quelle für diese Installation (`programs.openclaw.config` oder `instances.<name>.config` für nix-openclaw) und erstellen Sie sie anschließend neu. Weitere Informationen finden Sie im agentenorientierten [Schnellstart](https://github.com/openclaw/nix-openclaw#quick-start).
</Note>

<Note>
Mitgelieferte Plugins werden zusammen mit OpenClaw ausgeliefert. Einige sind standardmäßig aktiviert (beispielsweise mitgelieferte Modell-Provider, mitgelieferte Sprachanbieter und das mitgelieferte Browser-Plugin); andere müssen mit `plugins enable` aktiviert werden.

Native OpenClaw-Plugins liefern `openclaw.plugin.json` mit einem eingebetteten JSON-Schema (`configSchema`, auch wenn es leer ist) aus. Kompatible Bundles verwenden stattdessen ihre eigenen Bundle-Manifeste.

`plugins list` zeigt `Format: openclaw` oder `Format: bundle` an. Die ausführliche Ausgabe von list/info zeigt außerdem den Bundle-Untertyp (`codex`, `claude` oder `cursor`) sowie die erkannten Bundle-Funktionen an.
</Note>

## Entwicklung

```bash
openclaw plugins init stock-quotes --name "Stock Quotes"
cd stock-quotes
npm run plugin:build
npm run plugin:validate
```

`plugins init` erstellt standardmäßig ein minimales TypeScript-Tool-Plugin. Das erste
Argument ist die Plugin-ID; `--name` legt den Anzeigenamen fest. OpenClaw verwendet die
ID für das standardmäßige Ausgabeverzeichnis und die Paketbenennung. Tool-Gerüste verwenden
`defineToolPlugin` und erzeugen in `package.json` die Skripte `plugin:build` und
`plugin:validate`, die zunächst den Build ausführen und anschließend `openclaw plugins build`/`validate`
aufrufen.

`plugins build` importiert den erstellten Einstiegspunkt, liest dessen statische Tool-Metadaten, schreibt
`openclaw.plugin.json` und hält `openclaw.extensions` in `package.json` synchron.
`plugins validate` prüft, ob das erzeugte Manifest, die Paketmetadaten und
der aktuelle Export des Einstiegspunkts weiterhin übereinstimmen. Den vollständigen
Entwicklungsablauf finden Sie unter [Tool-Plugins](/de/plugins/tool-plugins).

Das Gerüst schreibt TypeScript-Quellcode, erzeugt die Metadaten jedoch aus dem erstellten
Einstiegspunkt `./dist/index.js`, sodass der Ablauf auch mit der veröffentlichten CLI funktioniert. Verwenden Sie
`--entry <path>`, wenn der Einstiegspunkt nicht dem standardmäßigen Paketeinstiegspunkt entspricht. Verwenden Sie
`plugins build --check` in CI, damit der Vorgang bei veralteten erzeugten Metadaten fehlschlägt, ohne
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

Provider-Gerüste erstellen ein generisches, OpenAI-kompatibles Modell-Provider-Plugin
mit API-Schlüssel-Authentifizierungslogik, einem Skript `npm run validate`, das
`clawhub package validate` ausführt, ClawHub-Paketmetadaten sowie einem manuell
ausgelösten GitHub-Actions-Workflow für eine spätere vertrauenswürdige Veröffentlichung über GitHub
OIDC. Provider-Gerüste erzeugen keine Skills und verwenden nicht
`openclaw plugins build`/`validate`; diese Befehle sind für den Pfad mit erzeugten Metadaten
des Tool-Gerüsts vorgesehen.

Ersetzen Sie vor der Veröffentlichung die Platzhalter für die API-Basis-URL, den Modellkatalog, die Dokumentationsroute,
den Anmeldedatentext und den README-Inhalt durch tatsächliche Provider-Details. Verwenden Sie die
erzeugte README für die erstmalige Veröffentlichung auf ClawHub und die Einrichtung eines vertrauenswürdigen Herausgebers.

## Installation

```bash
openclaw plugins search "calendar"                      # ClawHub-Plugins durchsuchen
openclaw plugins install <package>                       # automatische Quellenerkennung
openclaw plugins install clawhub:<package>                # nur ClawHub
openclaw plugins install npm:<package>                    # nur npm
openclaw plugins install npm-pack:<path.tgz>               # lokales npm-pack-Tarball
openclaw plugins install git:github.com/<owner>/<repo>     # Git-Repository
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <path>                            # lokaler Pfad oder Archiv
openclaw plugins install -l <path>                         # verknüpfen statt kopieren
openclaw plugins install <plugin>@<marketplace>             # Marketplace-Kurzform
openclaw plugins install <plugin> --marketplace <name>      # Marketplace (explizit)
openclaw plugins install <package> --force                  # vorhandene Installation überschreiben
openclaw plugins install <package> --pin                    # aufgelöste npm-Version fixieren
openclaw plugins install clawhub:<package> --acknowledge-clawhub-risk
openclaw plugins install <package> --dangerously-force-unsafe-install
```

Maintainer, die Installationen während der Einrichtung testen, können die automatischen Quellen für die
Plugin-Installation mithilfe geschützter Umgebungsvariablen überschreiben. Weitere Informationen finden Sie unter
[Überschreibungen für Plugin-Installationen](/de/plugins/install-overrides).

<Warning>
Während der Umstellung beim Start werden einfache Paketnamen standardmäßig von npm installiert, sofern sie nicht mit der ID eines mitgelieferten oder offiziellen Plugins übereinstimmen. In diesem Fall verwendet OpenClaw die lokale beziehungsweise offizielle Kopie, statt auf die npm-Registry zuzugreifen. Verwenden Sie `npm:<package>`, wenn Sie bewusst ein externes npm-Paket verwenden möchten. Verwenden Sie `clawhub:<package>` für ClawHub. Behandeln Sie Plugin-Installationen wie die Ausführung von Code; bevorzugen Sie fixierte Versionen.
</Warning>

`plugins search` fragt ClawHub nach installierbaren Paketen der Typen `code-plugin` und
`bundle-plugin` ab (nicht nach Skills; verwenden Sie dafür `openclaw skills search`).
Der Standardwert für `--limit` beträgt 20 und ist auf 100 begrenzt. Der Befehl liest ausschließlich den Remote-Katalog:
Es erfolgen weder eine Prüfung des lokalen Zustands noch eine Änderung der Konfiguration, eine Paketinstallation oder das
Laden der Plugin-Laufzeit. Die Ergebnisse enthalten den ClawHub-Paketnamen, die Familie, den Kanal, die Version,
eine Zusammenfassung und einen Installationshinweis wie `openclaw plugins install clawhub:<package>`.

<Note>
ClawHub ist für die meisten Plugins die primäre Oberfläche für Verteilung und Auffindbarkeit. Npm
bleibt ein unterstützter Rückfall- und Direktinstallationspfad. OpenClaw-eigene
Plugin-Pakete unter `@openclaw/*` werden wieder auf npm veröffentlicht; die aktuelle Liste finden Sie
unter [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) oder im
[Plugin-Inventar](/de/plugins/plugin-inventory). Stabile Installationen verwenden `latest`.
Installationen und Aktualisierungen im Beta-Kanal bevorzugen, sofern verfügbar, das npm-Dist-Tag `beta`
und greifen andernfalls auf `latest` zurück. Im Extended-Stable-Kanal werden offizielle npm-Plugins
mit einfacher/standardmäßiger oder `latest`-Absicht auf exakt die installierte Core-Version
aufgelöst. Exakte Fixierungen und explizite Tags außer `latest`, Drittanbieterpakete sowie
Quellen außerhalb von npm werden nicht umgeschrieben.
</Note>

<AccordionGroup>
  <Accordion title="Konfigurationseinbindungen und Reparatur ungültiger Konfigurationen">
    Wenn Ihr Abschnitt `plugins` durch ein `$include` mit einer einzelnen Datei bereitgestellt wird, schreiben `plugins install/update/enable/disable/uninstall` direkt in diese eingebundene Datei und lassen `openclaw.json` unverändert. Root-Einbindungen, Einbindungs-Arrays und Einbindungen mit gleichgeordneten Überschreibungen schlagen sicher fehl, statt die Struktur zu verflachen. Informationen zu den unterstützten Formen finden Sie unter [Konfigurationseinbindungen](/de/gateway/configuration).

    Wenn die Konfiguration während der Installation ungültig ist, schlägt `plugins install` normalerweise sicher fehl und fordert Sie auf, zuerst `openclaw doctor --fix` auszuführen. Beim Start und Hot Reload des Gateways führt eine ungültige Plugin-Konfiguration wie jede andere ungültige Konfiguration zu einem sicheren Fehler; `openclaw doctor --fix` kann den ungültigen Plugin-Eintrag isolieren. Die einzige dokumentierte Ausnahme während der Installation ist ein eng begrenzter Wiederherstellungspfad für mitgelieferte Plugins, die sich ausdrücklich für `openclaw.install.allowInvalidConfigRecovery` registrieren.

  </Accordion>
  <Accordion title="--force und Neuinstallation im Vergleich zur Aktualisierung">
    `--force` verwendet das vorhandene Installationsziel erneut und überschreibt ein bereits installiertes Plugin oder Hook-Paket direkt. Verwenden Sie diese Option, wenn Sie dieselbe ID bewusst von einem neuen lokalen Pfad, Archiv, ClawHub-Paket oder npm-Artefakt neu installieren. Für routinemäßige Upgrades eines bereits nachverfolgten npm-Plugins sollten Sie `openclaw plugins update <id-or-npm-spec>` bevorzugen.

    Wenn Sie `plugins install` für eine bereits installierte Plugin-ID ausführen, bricht OpenClaw ab und verweist Sie für ein normales Upgrade auf `plugins update <id-or-npm-spec>` oder auf `plugins install <package> --force`, wenn Sie die aktuelle Installation tatsächlich aus einer anderen Quelle überschreiben möchten. `--force` wird zusammen mit `--link` nicht unterstützt.

  </Accordion>
  <Accordion title="Geltungsbereich von --pin">
    `--pin` gilt ausschließlich für npm-Installationen und zeichnet den exakt aufgelösten Wert `<name>@<version>` auf. Die Option wird nicht mit `git:`-Installationen unterstützt (fixieren Sie stattdessen die Referenz in der Spezifikation, z. B. `git:github.com/acme/plugin@v1.2.3`) und auch nicht mit `--marketplace` (Marketplace-Installationen speichern Marketplace-Quellmetadaten statt einer npm-Spezifikation).
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` ist veraltet und hat jetzt keine Wirkung mehr. OpenClaw führt für Plugin-Installationen keine integrierte Blockierung gefährlichen Codes während der Installation mehr aus.

    Verwenden Sie die vom Betreiber verwaltete Oberfläche `security.installPolicy`, wenn eine hostspezifische Installationsrichtlinie erforderlich ist. Plugin-Hooks vom Typ `before_install` sind Lebenszyklus-Hooks der Plugin-Laufzeit und nicht die primäre Richtliniengrenze für CLI-Installationen.

    Wenn ein von Ihnen auf ClawHub veröffentlichtes Plugin aufgrund eines Registry-Scans ausgeblendet oder blockiert wird, verwenden Sie die Schritte für Herausgeber unter [Veröffentlichung auf ClawHub](/de/clawhub/publishing). `--dangerously-force-unsafe-install` fordert ClawHub nicht dazu auf, das Plugin erneut zu scannen oder eine blockierte Version öffentlich zugänglich zu machen.

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    Bei Community-Installationen von ClawHub wird vor dem Herunterladen der Vertrauensdatensatz der ausgewählten Version geprüft. Wenn ClawHub den Download für die Version deaktiviert, schädliche Scanergebnisse meldet oder die Version in einen blockierenden Moderationsstatus versetzt (unter Quarantäne gestellt, widerrufen), lehnt OpenClaw sie unabhängig von diesem Flag vollständig ab. Bei nicht blockierenden riskanten Scan- oder Moderationsstatus zeigt OpenClaw die Vertrauensdetails an und fordert vor dem Fortfahren eine Bestätigung an.

    Verwenden Sie `--acknowledge-clawhub-risk` nur, nachdem Sie die ClawHub-Warnung geprüft und entschieden haben, ohne interaktive Eingabeaufforderung fortzufahren. Ausstehende oder veraltete (noch nicht als unbedenklich eingestufte) Scanergebnisse lösen eine Warnung aus, erfordern jedoch keine Bestätigung. Offizielle ClawHub-Pakete und mitgelieferte OpenClaw-Plugin-Quellen umgehen diese Vertrauensprüfung der Version vollständig.

  </Accordion>
  <Accordion title="Hook-Pakete und npm-Spezifikationen">
    `plugins install` dient auch als Installationsoberfläche für Hook-Pakete, die `openclaw.hooks` in `package.json` bereitstellen. Verwenden Sie `openclaw hooks` für eine gefilterte Anzeige von Hooks und die Aktivierung einzelner Hooks, nicht für die Paketinstallation.

    Npm-Spezifikationen sind **ausschließlich für die Registry** vorgesehen (Paketname plus optionale **exakte Version** oder **dist-tag**). Git-/URL-/Datei-Spezifikationen und Semver-Bereiche werden abgelehnt. Abhängigkeiten werden aus Sicherheitsgründen pro Plugin in einem verwalteten npm-Projekt mit `--ignore-scripts` installiert, selbst wenn Ihre Shell globale npm-Installationseinstellungen enthält. Verwaltete Plugin-npm-Projekte übernehmen die npm-`overrides` von OpenClaw auf Paketebene, sodass Sicherheits-Pins des Hosts auch für hochgezogene Plugin-Abhängigkeiten gelten.

    Verwenden Sie `npm:<package>`, um die npm-Auflösung explizit festzulegen. Reine Paketspezifikationen werden während der Umstellung beim Start ebenfalls direkt aus npm installiert, sofern sie nicht mit einer offiziellen Plugin-ID übereinstimmen.

    Unverarbeitete `@openclaw/*`-Spezifikationen, die mit gebündelten Plugins übereinstimmen, werden vor dem npm-Fallback auf die im Image enthaltene gebündelte Kopie aufgelöst. Beispielsweise verwendet `openclaw plugins install @openclaw/discord@2026.5.20 --pin` das gebündelte Discord-Plugin aus dem aktuellen OpenClaw-Build, anstatt eine verwaltete npm-Überschreibung zu erstellen. Um die Verwendung des externen npm-Pakets zu erzwingen, verwenden Sie `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin`.

    Reine Spezifikationen und `@latest` bleiben auf dem stabilen Kanal. Datumsbasierte OpenClaw-Korrekturversionen wie `2026.5.3-1` gelten bei dieser Prüfung als stabil. Wenn npm eine der beiden Formen auf eine Vorabversion auflöst, bricht OpenClaw ab und fordert Sie auf, sich ausdrücklich mit einem Vorabversions-Tag (`@beta`/`@rc`) oder einer exakten Vorabversion (`@1.2.3-beta.4`) dafür zu entscheiden.

    Bei npm-Installationen ohne exakte Version (`npm:<package>` oder `npm:<package>@latest`) prüft OpenClaw vor der Installation die Metadaten des aufgelösten Pakets. Wenn das neueste stabile Paket eine neuere OpenClaw-Plugin-API oder eine höhere Mindestversion des Hosts erfordert, prüft OpenClaw ältere stabile Versionen und installiert stattdessen die neueste kompatible Version. Exakte Versionen und explizite dist-tags bleiben strikt: Eine inkompatible Auswahl schlägt fehl und fordert Sie auf, OpenClaw zu aktualisieren oder eine kompatible Version auszuwählen.

    Wenn eine reine Installationsspezifikation mit einer offiziellen Plugin-ID übereinstimmt (zum Beispiel `diffs`), installiert OpenClaw den Katalogeintrag direkt. Um ein gleichnamiges npm-Paket zu installieren, verwenden Sie eine explizite bereichsbezogene Spezifikation (zum Beispiel `@scope/diffs`).

  </Accordion>
  <Accordion title="Git-Repositorys">
    Verwenden Sie `git:<repo>`, um direkt aus einem Git-Repository zu installieren. Unterstützte Formen: `git:github.com/owner/repo`, `git:owner/repo`, vollständige `https://`-, `ssh://`-, `git://`- und `file://`-URLs sowie Klon-URLs im Format `git@host:owner/repo.git`. Fügen Sie `@<ref>` oder `#<ref>` hinzu, um vor der Installation einen Branch, ein Tag oder einen Commit auszuchecken.

    Bei Git-Installationen wird das Repository in ein temporäres Verzeichnis geklont, gegebenenfalls die angeforderte Referenz ausgecheckt und anschließend das normale Installationsprogramm für Plugin-Verzeichnisse verwendet. Dadurch verhalten sich Manifestvalidierung, Installationsrichtlinie des Betreibers, Installationsvorgänge des Paketmanagers und Installationsdatensätze wie bei npm-Installationen. Aufgezeichnete Git-Installationen enthalten die Quell-URL/-Referenz sowie den aufgelösten Commit, damit `openclaw plugins update` die Quelle später erneut auflösen kann.

    Verwenden Sie nach der Installation aus Git `openclaw plugins inspect <id> --runtime --json`, um Laufzeitregistrierungen wie Gateway-Methoden und CLI-Befehle zu überprüfen. Wenn das Plugin mit `api.registerCli` einen CLI-Stammbefehl registriert hat, führen Sie diesen Befehl direkt über die OpenClaw-Stamm-CLI aus, zum Beispiel `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archive">
    Unterstützte Archive: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Native OpenClaw-Plugin-Archive müssen im Stammverzeichnis des entpackten Plugins eine gültige `openclaw.plugin.json` enthalten; Archive, die nur eine `package.json` enthalten, werden abgelehnt, bevor OpenClaw Installationsdatensätze schreibt.

    Verwenden Sie `npm-pack:<path.tgz>`, wenn die Datei ein npm-pack-Tarball ist und Sie
    denselben Pfad eines pro Plugin verwalteten npm-Projekts verwenden möchten, den Registry-Installationen nutzen,
    einschließlich der Überprüfung von `package-lock.json`, der Prüfung hochgezogener Abhängigkeiten
    und npm-Installationsdatensätzen. Einfache Archivpfade werden weiterhin als lokale
    Archive unter dem Stammverzeichnis der Plugin-Erweiterungen installiert.

    Installationen aus dem Claude Marketplace werden ebenfalls unterstützt.

  </Accordion>
</AccordionGroup>

ClawHub-Installationen verwenden einen expliziten `clawhub:<package>`-Locator:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Reine npm-kompatible Plugin-Spezifikationen werden während der Umstellung beim Start standardmäßig aus npm installiert, sofern sie nicht mit einer offiziellen Plugin-ID übereinstimmen:

```bash
openclaw plugins install openclaw-codex-app-server
```

Verwenden Sie `npm:`, um eine ausschließliche npm-Auflösung explizit festzulegen:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw prüft vor der Installation die angegebene Plugin-API-/Mindestkompatibilität mit dem Gateway. Wenn die ausgewählte ClawHub-Version ein ClawPack-Artefakt veröffentlicht, lädt OpenClaw die versionierte npm-pack-Datei `.tgz` herunter, überprüft den ClawHub-Digest-Header und den Artefakt-Digest und installiert sie anschließend über den normalen Archivpfad. Ältere ClawHub-Versionen ohne ClawPack-Metadaten werden weiterhin über den bisherigen Prüfpfad für Paketarchive installiert. Aufgezeichnete Installationen behalten ihre ClawHub-Quellmetadaten, die Artefaktart, die npm-Integrität, die npm-Prüfsumme, den Tarball-Namen und die ClawPack-Digest-Daten für spätere Aktualisierungen bei.
ClawHub-Installationen ohne Versionsangabe behalten eine nicht versionierte aufgezeichnete Spezifikation bei, damit `openclaw plugins update` neueren ClawHub-Versionen folgen kann; explizite Versions- oder Tag-Selektoren wie `clawhub:pkg@1.2.3` und `clawhub:pkg@beta` bleiben an diesen Selektor gebunden.

### Marketplace-Kurzschreibweise

Verwenden Sie die Kurzschreibweise `plugin@marketplace`, wenn der Marketplace-Name im lokalen Registry-Cache von Claude unter `~/.claude/plugins/known_marketplaces.json` vorhanden ist:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Verwenden Sie `--marketplace`, um die Marketplace-Quelle explizit zu übergeben:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Marketplace-Quellen">
    - ein bekannter Claude-Marketplace-Name aus `~/.claude/plugins/known_marketplaces.json`
    - ein lokales Marketplace-Stammverzeichnis oder ein Pfad zu `marketplace.json`
    - eine GitHub-Repository-Kurzschreibweise wie `owner/repo`
    - eine GitHub-Repository-URL wie `https://github.com/owner/repo`
    - eine Git-URL

  </Tab>
  <Tab title="Regeln für Remote-Marketplaces">
    Bei Remote-Marketplaces, die von GitHub oder über Git geladen werden, müssen Plugin-Einträge innerhalb des geklonten Marketplace-Repositorys verbleiben. OpenClaw akzeptiert relative Pfadquellen aus diesem Repository und lehnt HTTP(S)-, absolute Pfad-, Git-, GitHub- und andere Plugin-Quellen aus Remote-Manifesten ab, die keine Pfade sind.
  </Tab>
</Tabs>

Für lokale Pfade und Archive erkennt OpenClaw automatisch:

- native OpenClaw-Plugins (`openclaw.plugin.json`)
- Codex-kompatible Bundles (`.codex-plugin/plugin.json`)
- Claude-kompatible Bundles (`.claude-plugin/plugin.json` oder das standardmäßige Claude-Komponentenlayout, wenn diese Manifestdatei fehlt)
- Cursor-kompatible Bundles (`.cursor-plugin/plugin.json`)

Verwaltete lokale Installationen müssen Plugin-Verzeichnisse oder Archive sein. Eigenständige Plugin-Dateien mit den Endungen `.js`,
`.mjs`, `.cjs` und `.ts` werden von `plugins install` weder in das verwaltete Plugin-
Stammverzeichnis kopiert noch geladen, wenn sie direkt in
`~/.openclaw/extensions` oder `<workspace>/.openclaw/extensions` abgelegt werden; diese
automatisch erkannten Stammverzeichnisse laden Plugin-Paket- oder Bundle-Verzeichnisse und überspringen
Skriptdateien auf oberster Ebene als lokale Hilfsdateien. Führen Sie eigenständige Dateien stattdessen
explizit in `plugins.load.paths` auf.

<Note>
Kompatible Bundles werden im normalen Plugin-Stammverzeichnis installiert und nehmen am selben Ablauf zum Auflisten/Anzeigen/Aktivieren/Deaktivieren teil. Derzeit werden Bundle-Skills, Claude-Befehls-Skills, Claude-Standardwerte aus `settings.json`, Claude-Standardwerte aus `.lsp.json` bzw. den im Manifest deklarierten `lspServers`, Cursor-Befehls-Skills und kompatible Codex-Hook-Verzeichnisse unterstützt; andere erkannte Bundle-Funktionen werden in Diagnosen/Informationen angezeigt, sind jedoch noch nicht mit der Laufzeitausführung verbunden.
</Note>

Verwenden Sie `-l`/`--link`, um auf ein lokales Plugin-Verzeichnis zu verweisen, ohne es zu kopieren (wird
zu `plugins.load.paths` hinzugefügt):

```bash
openclaw plugins install -l ./my-plugin
```

`--link` wird nicht zusammen mit `--force` unterstützt (verknüpfte Plugins verweisen direkt auf den Quell-
pfad, sodass vor Ort nichts überschrieben werden kann), ebenso wenig mit `--marketplace` oder
`git:`-Installationen; außerdem ist ein bereits vorhandener lokaler Pfad erforderlich.

<Note>
Aus einem Workspace stammende Plugins, die in einem Erweiterungsstammverzeichnis des Workspace erkannt werden, werden erst
importiert oder ausgeführt, nachdem sie ausdrücklich aktiviert wurden. Führen Sie für die lokale Entwicklung
`openclaw plugins enable <plugin-id>` aus oder setzen Sie
`plugins.entries.<plugin-id>.enabled: true`; wenn Ihre Konfiguration
`plugins.allow` verwendet, nehmen Sie dort ebenfalls dieselbe Plugin-ID auf. Diese Fail-Closed-Regel
gilt auch, wenn die Kanaleinrichtung ausdrücklich ein aus einem Workspace stammendes Plugin zum
ausschließlichen Laden für die Einrichtung auswählt. Der Einrichtungscode des lokalen Kanal-Plugins wird daher nicht ausgeführt, solange dieses
Workspace-Plugin deaktiviert bleibt oder von der Zulassungsliste ausgeschlossen ist. Verknüpfte Installationen
und explizite Einträge in `plugins.load.paths` folgen der normalen Richtlinie für ihren
aufgelösten Plugin-Ursprung. Siehe
[Plugin-Richtlinie konfigurieren](/de/tools/plugin#configure-plugin-policy)
und [Konfigurationsreferenz](/de/gateway/configuration-reference#plugins).

Verwenden Sie `--pin` bei npm-Installationen, um die aufgelöste exakte Spezifikation (`name@version`) im verwalteten Plugin-Index zu speichern, während das Standardverhalten nicht angeheftet bleibt.
</Note>

## Auflisten

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

<ParamField path="--enabled" type="boolean">
  Nur aktivierte Plugins anzeigen.
</ParamField>
<ParamField path="--verbose" type="boolean">
  Von der Tabellenansicht zu Detailzeilen pro Plugin mit Format-/Quell-/Ursprungs-/Versions-/Aktivierungsmetadaten wechseln.
</ParamField>
<ParamField path="--json" type="boolean">
  Maschinenlesbares Inventar einschließlich Registry-Diagnosen und Installationsstatus der Paketabhängigkeiten.
</ParamField>

<Note>
`plugins list` liest zuerst die persistierte lokale Plugin-Registry und verwendet eine ausschließlich aus dem Manifest abgeleitete Rückfallebene, wenn die Registry fehlt oder ungültig ist. Der Befehl eignet sich zur Prüfung, ob ein Plugin installiert, aktiviert und für die Planung eines Kaltstarts sichtbar ist, ist jedoch keine Live-Laufzeitprüfung eines bereits ausgeführten Gateway-Prozesses. Starten Sie nach Änderungen am Plugin-Code, an der Aktivierung, an der Hook-Richtlinie oder an `plugins.load.paths` den Gateway neu, der den Kanal bedient, bevor Sie erwarten, dass neuer `register(api)`-Code oder neue Hooks ausgeführt werden. Stellen Sie bei Remote-/Container-Bereitstellungen sicher, dass Sie den tatsächlichen untergeordneten Prozess `openclaw gateway run` neu starten und nicht nur einen Wrapper-Prozess.

`plugins list --json` enthält für jedes Plugin dessen `dependencyStatus` aus den
`dependencies` und `optionalDependencies` in `package.json`. OpenClaw prüft, ob diese Paket-
namen entlang des normalen Node-`node_modules`-Suchpfads des Plugins vorhanden sind; es
importiert weder Plugin-Laufzeitcode noch führt es einen Paketmanager aus oder repariert fehlende
Abhängigkeiten.
</Note>

Wenn beim Start `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...` protokolliert wird,
führen Sie `openclaw plugins list --enabled --verbose` oder
`openclaw plugins inspect <id>` mit einer aufgeführten Plugin-ID aus, um die Plugin-
IDs zu bestätigen, und kopieren Sie vertrauenswürdige IDs in `plugins.allow` in `openclaw.json`. Wenn die
Warnung alle erkannten Plugins auflisten kann, gibt sie ein direkt einfügbares
`plugins.allow`-Snippet aus, das diese IDs bereits enthält. Wenn ein Plugin
ohne Installations-/Ladepfad-Herkunft geladen wird, prüfen Sie diese Plugin-ID und heften Sie anschließend entweder
die vertrauenswürdige ID in `plugins.allow` an oder installieren Sie das Plugin erneut aus einer vertrauenswürdigen Quelle,
damit OpenClaw die Installationsherkunft aufzeichnet.

Binden Sie bei Arbeiten an gebündelten Plugins innerhalb eines paketierten Docker-Images das Plugin-
Quellverzeichnis über dem entsprechenden paketierten Quellpfad ein, beispielsweise
`/app/extensions/synology-chat`. OpenClaw erkennt diese eingebundene Quellüberlagerung
vor `/app/dist/extensions/synology-chat`; ein einfach kopiertes Quellverzeichnis
bleibt inaktiv, sodass normale paketierte Installationen weiterhin das kompilierte dist verwenden.

Zur Fehlerdiagnose von Laufzeit-Hooks:

- `openclaw plugins inspect <id> --runtime --json` zeigt registrierte Hooks und Diagnosen aus einem Inspektionsdurchlauf mit geladenem Modul. Die Laufzeitinspektion installiert niemals Abhängigkeiten; verwenden Sie `openclaw doctor --fix`, um veraltete Abhängigkeitszustände zu bereinigen oder fehlende herunterladbare Plugins wiederherzustellen, auf die in der Konfiguration verwiesen wird.
- `openclaw gateway status --deep --require-rpc` bestätigt die erreichbare Gateway-URL bzw. das erreichbare Gateway-Profil, Dienst-/Prozesshinweise, den Konfigurationspfad und den RPC-Zustand.
- Nicht gebündelte Konversations-Hooks (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) erfordern `plugins.entries.<id>.hooks.allowConversationAccess=true`.

### Plugin-Index

Plugin-Installationsmetadaten sind maschinell verwalteter Zustand, keine Benutzerkonfiguration. Installationen und Aktualisierungen schreiben sie in die gemeinsame SQLite-Zustandsdatenbank unter dem aktiven OpenClaw-Zustandsverzeichnis. Die Zeile `installed_plugin_index` speichert dauerhafte `installRecords`-Metadaten, einschließlich Datensätzen für fehlerhafte oder fehlende Plugin-Manifeste, sowie einen aus Manifesten abgeleiteten kalten Registry-Cache, der von `openclaw plugins update`, der Deinstallation, der Diagnose und der kalten Plugin-Registry verwendet wird.

Wenn OpenClaw ausgelieferte veraltete `plugins.installs`-Datensätze in der Konfiguration erkennt, behandelt die Laufzeit sie als Kompatibilitätseingabe, ohne `openclaw.json` neu zu schreiben. Explizite Plugin-Schreibvorgänge und `openclaw doctor --fix` verschieben diese Datensätze in den Plugin-Index und entfernen den Konfigurationsschlüssel, sofern Schreibvorgänge in der Konfiguration zulässig sind; schlägt einer der Schreibvorgänge fehl, bleiben die Konfigurationsdatensätze erhalten, damit die Installationsmetadaten nicht verloren gehen.

## Deinstallation

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
openclaw plugins uninstall <id> --force
```

`uninstall` entfernt Plugin-Datensätze aus `plugins.entries`, dem persistenten Plugin-Index, den Einträgen der Plugin-Zulassungs-/Sperrliste und gegebenenfalls verknüpften Einträgen in `plugins.load.paths`. Sofern `--keep-files` nicht gesetzt ist, entfernt die Deinstallation außerdem das nachverfolgte verwaltete Installationsverzeichnis, jedoch nur, wenn es innerhalb des Stammverzeichnisses für Plugin-Erweiterungen von OpenClaw aufgelöst wird. Wenn das Plugin derzeit den Slot `memory` oder `contextEngine` belegt, wird dieser Slot auf seinen Standardwert zurückgesetzt (`memory-core` für den Speicher, `legacy` für die Kontext-Engine).

`uninstall` zeigt eine Vorschau der zu entfernenden Elemente an und fragt anschließend mit `Uninstall plugin "<id>"?` nach, bevor Änderungen vorgenommen werden. Übergeben Sie `--force`, um die Bestätigungsabfrage zu überspringen (nützlich für Skripte und nicht interaktive Ausführungen); ohne diese Option erfordert die Deinstallation ein interaktives TTY. `--dry-run` zeigt dieselbe Vorschau an und wird beendet, ohne nachzufragen oder Änderungen vorzunehmen.

<Note>
`--keep-config` wird als veralteter Alias für `--keep-files` unterstützt.
</Note>

## Aktualisierung

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update openclaw-codex-app-server --acknowledge-clawhub-risk
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Aktualisierungen gelten für nachverfolgte Plugin-Installationen im verwalteten Plugin-Index und nachverfolgte Hook-Paket-Installationen in `hooks.internal.installs`.

<AccordionGroup>
  <Accordion title="Auflösen von Plugin-ID und npm-Spezifikation">
    Wenn Sie eine Plugin-ID übergeben, verwendet OpenClaw die für dieses Plugin gespeicherte Installationsspezifikation erneut. Das bedeutet, dass zuvor gespeicherte Dist-Tags wie `@beta` und exakt fixierte Versionen bei späteren Ausführungen von `update <id>` weiterhin verwendet werden.

    Während `update <id> --dry-run` bleiben exakt fixierte npm-Installationen fixiert. Wenn OpenClaw auch die Standardlinie der Registry für das Paket auflösen kann und diese Standardlinie neuer als die installierte fixierte Version ist, meldet der Probelauf die Fixierung und zeigt den expliziten Paketaktualisierungsbefehl mit `@latest` an, mit dem Sie der Standardlinie der Registry folgen können.

    Diese Regel für gezielte Aktualisierungen unterscheidet sich vom Massenwartungspfad `openclaw plugins update --all`. Massenaktualisierungen berücksichtigen weiterhin gewöhnliche nachverfolgte Installationsspezifikationen, aber Datensätze vertrauenswürdiger offizieller OpenClaw-Plugins können mit dem aktuellen Ziel des offiziellen Katalogs synchronisiert werden, statt bei einem veralteten exakten offiziellen Paket zu verbleiben. Verwenden Sie die gezielte Variante `update <id>`, wenn Sie eine exakte oder mit einem Tag versehene offizielle Spezifikation bewusst unverändert beibehalten möchten.

    Bei npm-Installationen können Sie außerdem eine explizite npm-Paketspezifikation mit einem Dist-Tag oder einer exakten Version übergeben. OpenClaw löst diesen Paketnamen wieder zum nachverfolgten Plugin-Datensatz auf, aktualisiert das installierte Plugin und speichert die neue npm-Spezifikation für zukünftige ID-basierte Aktualisierungen.

    Wenn Sie den npm-Paketnamen ohne Version oder Tag übergeben, wird er ebenfalls wieder zum nachverfolgten Plugin-Datensatz aufgelöst. Verwenden Sie dies, wenn ein Plugin auf eine exakte Version fixiert wurde und Sie es wieder auf die Standard-Veröffentlichungslinie der Registry umstellen möchten.

  </Accordion>
  <Accordion title="Aktualisierungen im Beta-Kanal">
    Die gezielte Variante `openclaw plugins update <id-or-npm-spec>` verwendet die nachverfolgte Plugin-Spezifikation erneut, sofern Sie keine neue Spezifikation übergeben. Bei der Synchronisierung vertrauenswürdiger offizieller Plugin-Datensätze mit dem Ziel des offiziellen Katalogs verwendet die Massenversion `openclaw plugins update --all` den konfigurierten Wert `update.channel`, sodass Installationen aus dem Beta-Kanal auf der Beta-Veröffentlichungslinie verbleiben können, statt unbemerkt auf stable/latest normalisiert zu werden.

    `openclaw update` kennt außerdem den aktiven OpenClaw-Aktualisierungskanal: Im Beta-Kanal versuchen npm- und ClawHub-Plugin-Datensätze der Standardlinie zuerst `@beta`. Sie greifen auf die gespeicherte default/latest-Spezifikation zurück, wenn keine Beta-Veröffentlichung des Plugins vorhanden ist; npm-Plugins greifen auch dann darauf zurück, wenn das Beta-Paket vorhanden ist, aber die Installationsvalidierung fehlschlägt. Dieser Rückgriff wird als Warnung gemeldet und führt nicht zum Fehlschlagen der Kernaktualisierung. Exakte Versionen und explizite Tags bleiben bei gezielten Aktualisierungen auf diesen Selektor fixiert.

  </Accordion>
  <Accordion title="Versionsprüfungen und Integritätsabweichungen">
    Vor einer tatsächlichen npm-Aktualisierung prüft OpenClaw die installierte Paketversion anhand der Metadaten der npm-Registry. Wenn die installierte Version und die gespeicherte Artefaktidentität bereits mit dem aufgelösten Ziel übereinstimmen, wird die Aktualisierung übersprungen, ohne etwas herunterzuladen, neu zu installieren oder `openclaw.json` neu zu schreiben.

    Wenn ein gespeicherter Integritäts-Hash vorhanden ist und sich der Hash des abgerufenen Artefakts ändert, behandelt OpenClaw dies als Abweichung des npm-Artefakts. Der interaktive Befehl `openclaw plugins update` zeigt die erwarteten und tatsächlichen Hashes an und bittet vor dem Fortfahren um Bestätigung. Nicht interaktive Aktualisierungshilfen verweigern standardmäßig die Fortsetzung, sofern der Aufrufer keine explizite Fortsetzungsrichtlinie angibt.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install bei der Aktualisierung">
    `--dangerously-force-unsafe-install` wird aus Kompatibilitätsgründen auch von `plugins update` akzeptiert, ist jedoch veraltet und verändert das Verhalten von Plugin-Aktualisierungen nicht mehr. Die Betreiberkonfiguration `security.installPolicy` kann Aktualisierungen weiterhin blockieren; Plugin-Hooks vom Typ `before_install` gelten nur in Prozessen, in denen Plugin-Hooks geladen sind.
  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk bei der Aktualisierung">
    Aktualisierungen von Community-Plugins auf ClawHub-Basis führen vor dem Herunterladen des Ersatzpakets dieselbe Vertrauensprüfung für die exakte Veröffentlichung wie Installationen durch. Verwenden Sie `--acknowledge-clawhub-risk` für geprüfte Automatisierungen, die fortgesetzt werden sollen, wenn die ausgewählte ClawHub-Veröffentlichung eine riskante Vertrauenswarnung aufweist. Offizielle ClawHub-Pakete und gebündelte OpenClaw-Plugin-Quellen umgehen diese Vertrauensabfrage für Veröffentlichungen.
  </Accordion>
</AccordionGroup>

## Inspektion

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
```

Die Inspektion zeigt Identität, Ladestatus, Quelle, Manifestfähigkeiten, Richtlinienkennzeichen, Diagnosen, Installationsmetadaten, Paketfähigkeiten sowie jegliche erkannte Unterstützung für MCP- oder LSP-Server an, ohne standardmäßig die Plugin-Laufzeit zu importieren. Die JSON-Ausgabe enthält die Verträge des Plugin-Manifests, etwa `contracts.agentToolResultMiddleware` und `contracts.trustedToolPolicies`, sodass Betreiber Deklarationen vertrauenswürdiger Oberflächen prüfen können, bevor sie ein Plugin aktivieren oder neu starten. Fügen Sie `--runtime` hinzu, um das Plugin-Modul zu laden und registrierte Hooks, Werkzeuge, Befehle, Dienste, Gateway-Methoden und HTTP-Routen einzubeziehen. Die Laufzeitinspektion meldet fehlende Plugin-Abhängigkeiten direkt; Installationen und Reparaturen verbleiben in `openclaw plugins install`, `openclaw plugins update` und `openclaw doctor --fix`.

Plugin-eigene CLI-Befehle werden normalerweise als oberste `openclaw`-Befehlsgruppen installiert, Plugins können jedoch auch verschachtelte Befehle unter einem Kern-Elternbefehl wie `openclaw nodes` registrieren. Nachdem `inspect --runtime` einen Befehl unter `cliCommands` angezeigt hat, führen Sie ihn unter dem aufgeführten Pfad aus; beispielsweise kann ein Plugin, das `demo-git` registriert, mit `openclaw demo-git ping` überprüft werden.

Jedes Plugin wird danach klassifiziert, was es tatsächlich zur Laufzeit registriert:

| Form                | Bedeutung                                                                    |
| ------------------- | ---------------------------------------------------------------------------- |
| `plain-capability`  | genau ein Fähigkeitstyp (z. B. ein reines Provider-Plugin)                   |
| `hybrid-capability` | mehr als ein Fähigkeitstyp (z. B. Text + Sprache + Bilder)                   |
| `hook-only`         | nur Hooks, keine Fähigkeiten, Werkzeuge, Befehle, Dienste oder Routen        |
| `non-capability`    | Werkzeuge/Befehle/Dienste, aber keine Fähigkeiten                            |

Weitere Informationen zum Fähigkeitsmodell finden Sie unter [Plugin-Formen](/de/plugins/architecture#plugin-shapes).

<Note>
Das Flag `--json` gibt einen maschinenlesbaren Bericht aus, der für Skripte und Prüfungen geeignet ist. `inspect --all` stellt eine systemweite Tabelle mit Spalten für Form, Fähigkeitsarten, Kompatibilitätshinweise, Paketfähigkeiten und Hook-Zusammenfassung dar. `info` ist ein Alias für `inspect`.
</Note>

## Doctor

```bash
openclaw plugins doctor
```

`doctor` meldet Fehler beim Laden von Plugins, Manifest-/Erkennungsdiagnosen, Kompatibilitätshinweise und veraltete Plugin-Konfigurationsverweise wie fehlende Plugin-Slots. Wenn der Installationsbaum und die Plugin-Konfiguration bereinigt sind, wird `No plugin issues detected.` ausgegeben. Wenn veraltete Konfigurationen verbleiben, der Installationsbaum ansonsten jedoch fehlerfrei ist, weist die Zusammenfassung darauf hin, statt einen vollständig fehlerfreien Plugin-Zustand zu suggerieren.

Wenn ein konfiguriertes Plugin auf dem Datenträger vorhanden ist, aber durch die Pfadsicherheitsprüfungen des Laders blockiert wird, behält die Konfigurationsvalidierung den Plugin-Eintrag bei und meldet ihn als `present but blocked`. Beheben Sie die vorangehende Diagnose zum blockierten Plugin, beispielsweise den Pfadbesitz oder global beschreibbare Berechtigungen, statt die Konfiguration `plugins.entries.<id>` oder `plugins.allow` zu entfernen.

Bei Fehlern der Modulform, etwa fehlenden `register`-/`activate`-Exporten, führen Sie den Befehl erneut mit `OPENCLAW_PLUGIN_LOAD_DEBUG=1` aus, um eine kompakte Zusammenfassung der Exportform in die Diagnoseausgabe aufzunehmen.

## Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Die lokale Plugin-Registry ist das persistente kalte Lesemodell von OpenClaw für die Identität installierter Plugins, deren Aktivierung, Quellmetadaten und die Eigentümerschaft von Beiträgen. Der normale Startvorgang, die Ermittlung des zuständigen Providers, die Klassifizierung der Kanaleinrichtung und die Plugin-Bestandsaufnahme können darauf zugreifen, ohne Plugin-Laufzeitmodule zu importieren.

Verwenden Sie `plugins registry`, um zu prüfen, ob die persistente Registry vorhanden, aktuell oder veraltet ist. Verwenden Sie `--refresh`, um sie aus dem persistenten Plugin-Index, der Konfigurationsrichtlinie und den Manifest-/Paketmetadaten neu aufzubauen. Dies ist ein Reparaturpfad, kein Pfad zur Laufzeitaktivierung.

`openclaw doctor --fix` repariert außerdem Registry-nahe Abweichungen bei verwaltetem npm: Wenn ein verwaistes oder wiederhergestelltes `@openclaw/*`-Paket unter einem verwalteten Plugin-npm-Projekt oder im veralteten flachen verwalteten npm-Stammverzeichnis ein gebündeltes Plugin überschattet, entfernt Doctor dieses veraltete Paket und baut die Registry neu auf, sodass der Startvorgang anhand des gebündelten Manifests validiert. Doctor verknüpft außerdem das Host-Paket `openclaw` erneut mit verwalteten npm-Plugins, die `peerDependencies.openclaw` deklarieren, sodass paketlokale Laufzeitimporte wie `openclaw/plugin-sdk/*` nach Aktualisierungen oder npm-Reparaturen aufgelöst werden.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` ist ein veralteter Notfall-Kompatibilitätsschalter für Lesefehler der Registry. Bevorzugen Sie `plugins registry --refresh` oder `openclaw doctor --fix`; der Rückgriff auf die Umgebungsvariable dient nur der Notfallwiederherstellung beim Start, während die Migration eingeführt wird.
</Warning>

## Marketplace

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

`plugins marketplace entries` listet Einträge aus dem konfigurierten OpenClaw-Marketplace-Feed auf. Standardmäßig versucht der Befehl, den gehosteten Feed abzurufen, und greift ersatzweise auf den zuletzt akzeptierten Snapshot oder die gebündelten Daten zurück. Verwenden Sie `--feed-profile <name>`, um ein bestimmtes konfiguriertes Profil zu lesen, `--feed-url <url>`, um eine explizite URL eines gehosteten Feeds zu lesen, und `--offline`, um den zuletzt akzeptierten Snapshot zu lesen, ohne den Feed abzurufen.

`plugins marketplace refresh` aktualisiert den konfigurierten Snapshot des gehosteten Feeds und meldet, ob OpenClaw gehostete Daten, einen gehosteten Snapshot oder gebündelte Fallback-Daten akzeptiert hat. Verwenden Sie `--expected-sha256`, wenn der Befehl für einen Aufrufer fehlschlagen soll, sofern eine neue gehostete Nutzlast nicht mit einer festgelegten Prüfsumme übereinstimmt.

Marketplace `list` akzeptiert einen lokalen Marketplace-Pfad, einen `marketplace.json`-Pfad, eine GitHub-Kurzschreibweise wie `owner/repo`, eine GitHub-Repository-URL oder eine Git-URL. `--json` gibt die Bezeichnung der aufgelösten Quelle sowie das geparste Marketplace-Manifest und die Plugin-Einträge aus.

Die Marketplace-Aktualisierung lädt einen gehosteten OpenClaw-Marketplace-Feed und speichert die
validierte Antwort als lokalen Snapshot des gehosteten Feeds. Ohne Optionen verwendet sie
das konfigurierte Standard-Feedprofil. Verwenden Sie `--feed-profile <name>`, um ein
bestimmtes konfiguriertes Profil zu aktualisieren, `--feed-url <url>`, um eine explizite URL
eines gehosteten Feeds zu aktualisieren, `--expected-sha256 <sha256>`, um eine übereinstimmende
Nutzlast-Prüfsumme zu verlangen (`sha256:<hex>` oder einen reinen 64-stelligen Hex-Digest),
und `--json` für eine maschinenlesbare Ausgabe. Explizite URLs gehosteter Feeds dürfen keine
Anmeldedaten, Abfragezeichenfolgen oder Fragmente enthalten. Aktualisierungen ohne festgelegte
Prüfsumme können einen gehosteten Snapshot oder ein Ergebnis mit gebündelten Fallback-Daten
melden, ohne dass der Befehl fehlschlägt. Aktualisierungen mit festgelegter Prüfsumme schlagen
fehl, sofern sie keine neue gehostete Nutzlast akzeptieren, und erfolgreiche gehostete
Aktualisierungen schlagen fehl, wenn OpenClaw den validierten Snapshot nicht speichern kann.

## Verwandte Themen

- [Plugins erstellen](/de/plugins/building-plugins)
- [CLI-Referenz](/de/cli)
- [ClawHub](/de/clawhub)
