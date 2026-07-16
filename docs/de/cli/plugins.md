---
read_when:
    - Sie möchten Gateway-Plugins oder kompatible Bundles installieren oder verwalten
    - Sie möchten ein einfaches Tool-Plugin erstellen oder validieren
    - Sie möchten Fehler beim Laden von Plugins beheben
sidebarTitle: Plugins
summary: CLI-Referenz für `openclaw plugins` (initialisieren, erstellen, validieren, auflisten, installieren, Marketplace, deinstallieren, aktivieren/deaktivieren, Diagnose)
title: Plugins
x-i18n:
    generated_at: "2026-07-16T12:54:22Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: dadc182cd931672d98c3d1c6ddc1f1defdf0384b25feff7bd4b5324a7fc2e26c
    source_path: cli/plugins.md
    workflow: 16
---

Verwalten Sie Gateway-Plugins, Hook-Pakete und kompatible Bundles.

<CardGroup cols={2}>
  <Card title="Plugin-System" href="/de/tools/plugin">
    Benutzerhandbuch zum Installieren, Aktivieren und Beheben von Problemen mit Plugins.
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

Führen Sie zur Untersuchung langsamer Installations-, Prüf-, Deinstallations- oder Registry-Aktualisierungsvorgänge den
Befehl mit `OPENCLAW_PLUGIN_LIFECYCLE_TRACE=1` aus. Der Trace schreibt die Zeitmessungen der Phasen
nach stderr und hält die JSON-Ausgabe parsierbar. Siehe [Debugging](/de/help/debugging#plugin-lifecycle-trace).

<Note>
Im Nix-Modus (`OPENCLAW_NIX_MODE=1`) ist `openclaw.json` unveränderlich. `install`, `update`, `uninstall`, `enable` und `disable` verweigern allesamt die Ausführung. Bearbeiten Sie stattdessen die Nix-Quelle für diese Installation (`programs.openclaw.config` oder `instances.<name>.config` für nix-openclaw) und erstellen Sie sie anschließend neu. Siehe den agentenorientierten [Schnellstart](https://github.com/openclaw/nix-openclaw#quick-start).
</Note>

<Note>
Gebündelte Plugins werden mit OpenClaw ausgeliefert. Einige sind standardmäßig aktiviert (zum Beispiel gebündelte Modell-Provider, gebündelte Sprachausgabe-Provider und das gebündelte Browser-Plugin); andere erfordern `plugins enable`.

Native OpenClaw-Plugins liefern `openclaw.plugin.json` mit einem eingebetteten JSON-Schema (`configSchema`, auch wenn es leer ist) aus. Kompatible Bundles verwenden stattdessen ihre eigenen Bundle-Manifeste.

`plugins list` zeigt `Format: openclaw` oder `Format: bundle`. Die ausführliche Listen-/Infoausgabe zeigt außerdem den Bundle-Untertyp (`codex`, `claude` oder `cursor`) sowie die erkannten Bundle-Funktionen.
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
`defineToolPlugin` und erzeugen die `package.json`-Skripte `plugin:build` und
`plugin:validate`, die zunächst den Build ausführen und anschließend `openclaw plugins build`/`validate` aufrufen.

`plugins build` importiert den erstellten Einstiegspunkt, liest dessen statische Tool-Metadaten, schreibt
`openclaw.plugin.json` und hält `openclaw.extensions` von `package.json` synchron.
`plugins validate` prüft, ob das generierte Manifest, die Paketmetadaten und
der aktuelle Export des Einstiegspunkts weiterhin übereinstimmen. Den vollständigen
Entwicklungsablauf finden Sie unter [Tool-Plugins](/de/plugins/tool-plugins).

Das Gerüst schreibt TypeScript-Quellcode, generiert die Metadaten jedoch aus dem erstellten
`./dist/index.js`-Einstiegspunkt, sodass der Ablauf auch mit der veröffentlichten CLI funktioniert. Verwenden Sie
`--entry <path>`, wenn der Einstiegspunkt nicht dem standardmäßigen Paketeinstiegspunkt entspricht. Verwenden Sie
`plugins build --check` in CI, damit veraltete generierte Metadaten zu einem Fehler führen, ohne
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
mit API-Schlüssel-Authentifizierung, einem `npm run validate`-Skript, das
`clawhub package validate` ausführt, ClawHub-Paketmetadaten und einem manuell
ausgelösten GitHub-Actions-Workflow für eine zukünftige vertrauenswürdige Veröffentlichung über GitHub
OIDC. Provider-Gerüste erzeugen keine Skills und verwenden nicht
`openclaw plugins build`/`validate`; diese Befehle sind für den Pfad der generierten Metadaten
des Tool-Gerüsts vorgesehen.

Ersetzen Sie vor der Veröffentlichung die Platzhalter für die API-Basis-URL, den Modellkatalog, die Dokumentationsroute,
den Anmeldedatentext und den README-Inhalt durch echte Provider-Angaben. Verwenden Sie die
generierte README für die erstmalige Veröffentlichung auf ClawHub und die Einrichtung eines vertrauenswürdigen Herausgebers.

## Installation

```bash
openclaw plugins search "calendar"                      # ClawHub-Plugins durchsuchen
openclaw plugins install @openclaw/<package>            # vertrauenswürdiger offizieller Katalog
openclaw plugins install <package>                       # beliebiges npm-Paket
openclaw plugins install clawhub:<package>                # nur ClawHub
openclaw plugins install npm:<package>                    # nur npm
openclaw plugins install npm-pack:<path.tgz>               # lokales npm-pack-Tarball
openclaw plugins install git:github.com/<owner>/<repo>     # Git-Repository
openclaw plugins install git:github.com/<owner>/<repo>@<ref>
openclaw plugins install <path>                            # lokaler Pfad oder Archiv
openclaw plugins install -l <path>                         # verknüpfen statt kopieren
openclaw plugins install <plugin>@<marketplace>             # Marketplace-Kurzform
openclaw plugins install <plugin> --marketplace <name>      # Marketplace (explizit)
openclaw plugins install <package> --force                  # Quelle bestätigen / vorhandene Installation überschreiben
openclaw plugins install <package> --pin                    # aufgelöste npm-Version fixieren
openclaw plugins install clawhub:<package> --acknowledge-clawhub-risk
openclaw plugins install <package> --dangerously-force-unsafe-install
```

Maintainer, die Installationen während der Einrichtung testen, können automatische Quellen für die Plugin-Installation
mit geschützten Umgebungsvariablen überschreiben. Siehe
[Überschreibungen für Plugin-Installationen](/de/plugins/install-overrides).

<Warning>
Während der Umstellung bei der Einführung werden einfache Paketnamen standardmäßig von npm installiert, sofern sie nicht mit einer gebündelten oder offiziellen Plugin-ID übereinstimmen. In diesem Fall verwendet OpenClaw diese lokale/offizielle Kopie, statt auf die npm-Registry zuzugreifen. Verwenden Sie stattdessen `npm:<package>`, wenn Sie bewusst ein externes npm-Paket installieren möchten. Verwenden Sie `clawhub:<package>` für ClawHub. Behandeln Sie Plugin-Installationen wie die Ausführung von Code; bevorzugen Sie fixierte Versionen.
</Warning>

<Warning>
ClawHub-Pakete sowie der gebündelte/offizielle Katalog von OpenClaw sind vertrauenswürdige Installationsquellen. Bei einer neuen beliebigen npm-, `npm-pack:`-, Git-, lokalen Pfad-/Archiv- oder
Marketplace-Quelle wird eine Warnung angezeigt und vor dem Fortfahren eine Bestätigung angefordert. Nicht interaktive beliebige
Installationen müssen `--force` übergeben, nachdem Sie die Quelle geprüft haben und ihr vertrauen. Dasselbe
Flag überschreibt bei Bedarf ein vorhandenes Installationsziel. Normale Aktualisierungen einer
bereits erfassten Installation erfordern es nicht. Diese Bestätigung ist von
`--acknowledge-clawhub-risk` getrennt, das nur für Risikowarnungen bezüglich des Vertrauens in ClawHub-Releases
gilt. `--force` umgeht weder `security.installPolicy` noch die übrigen
Sicherheitsprüfungen der Installation.
</Warning>

`plugins search` fragt ClawHub nach installierbaren `code-plugin`- und
`bundle-plugin`-Paketen ab (nicht nach Skills; verwenden Sie dafür `openclaw skills search`).
Der Standardwert von `--limit` ist 20 und auf 100 begrenzt. Dabei wird nur der entfernte Katalog gelesen: keine
Prüfung des lokalen Zustands, Änderung der Konfiguration, Paketinstallation oder
Ladung der Plugin-Laufzeit. Die Ergebnisse enthalten den ClawHub-Paketnamen, die Familie, den Kanal, die Version,
eine Zusammenfassung und einen Installationshinweis wie `openclaw plugins install clawhub:<package>`.

<Note>
ClawHub ist für die meisten Plugins die primäre Plattform für Verteilung und Auffindbarkeit. Npm
bleibt ein unterstützter Fallback und direkter Installationsweg. OpenClaw-eigene
`@openclaw/*`-Plugin-Pakete werden wieder auf npm veröffentlicht; die aktuelle Liste finden Sie
auf [npmjs.com/org/openclaw](https://www.npmjs.com/org/openclaw) oder in der
[Plugin-Bestandsübersicht](/de/plugins/plugin-inventory). Stabile Installationen verwenden `latest`.
Installationen und Aktualisierungen im Beta-Kanal bevorzugen das npm-dist-tag `beta`, sofern es verfügbar ist,
und greifen andernfalls auf `latest` zurück. Im Extended-Stable-Kanal werden offizielle npm-Plugins
mit einfacher/standardmäßiger oder `latest`-Vorgabe auf die exakt installierte Core-Version
aufgelöst. Exakte Fixierungen und explizite Tags, die nicht `latest` entsprechen, Drittanbieterpakete und
Nicht-npm-Quellen werden nicht umgeschrieben.
</Note>

<AccordionGroup>
  <Accordion title="Konfigurationseinbindungen und Reparatur ungültiger Konfigurationen">
    Wenn Ihr Abschnitt `plugins` durch eine Einzeldatei-`$include` bereitgestellt wird, schreibt `plugins install/update/enable/disable/uninstall` direkt in diese eingebundene Datei und lässt `openclaw.json` unverändert. Einbindungen auf Root-Ebene, Einbindungsarrays und Einbindungen mit gleichgeordneten Überschreibungen schlagen sicher fehl, statt die Struktur abzuflachen. Die unterstützten Formen finden Sie unter [Konfigurationseinbindungen](/de/gateway/configuration).

    Wenn die Konfiguration während der Installation ungültig ist, schlägt `plugins install` normalerweise sicher fehl und weist Sie an, zuerst `openclaw doctor --fix` auszuführen. Während des Gateway-Starts und des Hot Reload schlägt eine ungültige Plugin-Konfiguration wie jede andere ungültige Konfiguration sicher fehl; `openclaw doctor --fix` kann den ungültigen Plugin-Eintrag unter Quarantäne stellen. Die einzige dokumentierte Ausnahme während der Installation ist ein eng begrenzter Wiederherstellungspfad für gebündelte Plugins, die sich ausdrücklich für `openclaw.install.allowInvalidConfigRecovery` entscheiden.

  </Accordion>
  <Accordion title="--force-Bestätigung und Neuinstallation im Vergleich zur Aktualisierung">
    `--force` bestätigt eine Nicht-ClawHub-Quelle ohne Rückfrage. Es umgeht weder `security.installPolicy` noch die übrigen Sicherheitsprüfungen der Installation. Wenn das Plugin oder Hook-Paket bereits installiert ist, verwendet es außerdem das vorhandene Ziel erneut und überschreibt es direkt. Verwenden Sie es nach der Prüfung einer beliebigen npm-, lokalen, Archiv-, Git- oder Marketplace-Quelle oder wenn Sie dieselbe ID absichtlich neu installieren. Für routinemäßige Upgrades eines bereits erfassten npm-Plugins ist `openclaw plugins update <id-or-npm-spec>` vorzuziehen.

    Wenn Sie `plugins install` für eine bereits installierte Plugin-ID ausführen, bricht OpenClaw ab und verweist Sie für ein normales Upgrade auf `plugins update <id-or-npm-spec>` oder auf `plugins install <package> --force`, wenn Sie die aktuelle Installation tatsächlich aus einer anderen Quelle überschreiben möchten. Bei beliebigen Quellen wird weiterhin die interaktive Herkunftswarnung angezeigt; nicht interaktive Installationen müssen nach der Prüfung `--force` übergeben. Vertrauenswürdige Quellen von ClawHub und aus dem OpenClaw-Katalog benötigen dies nicht. Mit `--link` bestätigt `--force` die Quelle, ändert jedoch nicht den Installationsmodus mit verknüpftem Pfad.

  </Accordion>
  <Accordion title="Geltungsbereich von --pin">
    `--pin` gilt nur für npm-Installationen und zeichnet die exakt aufgelöste `<name>@<version>` auf. Es wird nicht mit `git:`-Installationen unterstützt (fixieren Sie stattdessen die Referenz in der Spezifikation, z. B. `git:github.com/acme/plugin@v1.2.3`) oder mit `--marketplace` (Marketplace-Installationen speichern Marketplace-Quellmetadaten statt einer npm-Spezifikation).
  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install">
    `--dangerously-force-unsafe-install` ist veraltet und bewirkt jetzt nichts mehr. OpenClaw führt für Plugin-Installationen keine integrierte Blockierung gefährlichen Codes während der Installation mehr aus.

    Verwenden Sie die betreibereigene Oberfläche `security.installPolicy`, wenn hostspezifische Installationsrichtlinien erforderlich sind. Plugin-Hooks vom Typ `before_install` sind Lebenszyklus-Hooks der Plugin-Laufzeit und nicht die primäre Richtliniengrenze für CLI-Installationen.

    Wenn ein von Ihnen auf ClawHub veröffentlichtes Plugin durch einen Registry-Scan ausgeblendet oder blockiert wird, führen Sie die Schritte für Herausgeber unter [Veröffentlichen auf ClawHub](/de/clawhub/publishing) aus. `--dangerously-force-unsafe-install` fordert ClawHub nicht dazu auf, das Plugin erneut zu scannen oder eine blockierte Veröffentlichung öffentlich zugänglich zu machen.

  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk">
    Bei Installationen aus der ClawHub-Community wird vor dem Herunterladen der Vertrauensdatensatz der ausgewählten Veröffentlichung geprüft. Wenn ClawHub den Download für die Veröffentlichung deaktiviert, schädliche Scanbefunde meldet oder die Veröffentlichung in einen blockierenden Moderationsstatus versetzt (unter Quarantäne gestellt, widerrufen), lehnt OpenClaw sie unabhängig von diesem Flag vollständig ab. Bei nicht blockierenden riskanten Scan- oder Moderationsstatus zeigt OpenClaw die Vertrauensdetails an und fordert vor dem Fortfahren eine Bestätigung an.

    Verwenden Sie `--acknowledge-clawhub-risk` nur, nachdem Sie die ClawHub-Warnung geprüft und entschieden haben, ohne interaktive Eingabeaufforderung fortzufahren. Ausstehende oder veraltete (noch nicht als unbedenklich eingestufte) Scanergebnisse lösen eine Warnung aus, erfordern jedoch keine Bestätigung. Offizielle ClawHub-Pakete und gebündelte OpenClaw-Plugin-Quellen umgehen diese Vertrauensprüfung für Veröffentlichungen vollständig.

  </Accordion>
  <Accordion title="Hook-Pakete und npm-Spezifikationen">
    `plugins install` ist außerdem die Installationsoberfläche für Hook-Pakete, die `openclaw.hooks` in `package.json` bereitstellen. Verwenden Sie `openclaw hooks` für die gefilterte Sichtbarkeit von Hooks und deren individuelle Aktivierung, nicht für die Paketinstallation.

    Npm-Spezifikationen gelten **ausschließlich für Registrys** (Paketname plus optionale **exakte Version** oder optionales **dist-tag**). Git-/URL-/Dateispezifikationen und Semver-Bereiche werden abgelehnt. Zur Sicherheit werden Abhängigkeitsinstallationen in einem verwalteten npm-Projekt pro Plugin mit `--ignore-scripts` ausgeführt, selbst wenn Ihre Shell globale npm-Installationseinstellungen verwendet. Verwaltete npm-Projekte für Plugins übernehmen die npm-Einstellung `overrides` auf Paketebene von OpenClaw, sodass Sicherheits-Pins des Hosts auch für hochgezogene Plugin-Abhängigkeiten gelten.

    Verwenden Sie `npm:<package>`, um die npm-Auflösung explizit festzulegen. Reine Paketspezifikationen werden während der Umstellung beim Start ebenfalls direkt von npm installiert, sofern sie nicht mit einer offiziellen Plugin-ID übereinstimmen.

    Unverarbeitete `@openclaw/*`-Spezifikationen, die gebündelten Plugins entsprechen, werden vor dem npm-Fallback zur im Image enthaltenen gebündelten Kopie aufgelöst. Beispielsweise verwendet `openclaw plugins install @openclaw/discord@2026.5.20 --pin` das gebündelte Discord-Plugin aus dem aktuellen OpenClaw-Build, statt eine verwaltete npm-Überschreibung zu erstellen. Um die Installation des externen npm-Pakets zu erzwingen, verwenden Sie `openclaw plugins install npm:@openclaw/discord@2026.5.20 --pin`.

    Reine Spezifikationen und `@latest` bleiben im stabilen Kanal. Mit einem Datum versehene Korrekturversionen von OpenClaw wie `2026.5.3-1` gelten bei dieser Prüfung als stabil. Wenn npm eine der beiden Formen zu einer Vorabversion auflöst, hält OpenClaw an und fordert Sie auf, sich explizit mit einem Vorabversions-Tag (`@beta`/`@rc`) oder einer exakten Vorabversion (`@1.2.3-beta.4`) dafür zu entscheiden.

    Bei npm-Installationen ohne exakte Version (`npm:<package>` oder `npm:<package>@latest`) prüft OpenClaw vor der Installation die Metadaten des aufgelösten Pakets. Wenn das neueste stabile Paket eine neuere OpenClaw-Plugin-API oder eine höhere Mindestversion des Hosts erfordert, prüft OpenClaw ältere stabile Versionen und installiert stattdessen die neueste kompatible Veröffentlichung. Exakte Versionen und explizite dist-tags werden weiterhin strikt behandelt: Eine inkompatible Auswahl schlägt fehl und fordert Sie auf, OpenClaw zu aktualisieren oder eine kompatible Version auszuwählen.

    Wenn eine reine Installationsspezifikation mit einer offiziellen Plugin-ID übereinstimmt (beispielsweise `diffs`), installiert OpenClaw direkt den Katalogeintrag. Um ein npm-Paket mit demselben Namen zu installieren, verwenden Sie eine explizite bereichsbezogene Spezifikation (beispielsweise `@scope/diffs`).

  </Accordion>
  <Accordion title="Git-Repositorys">
    Verwenden Sie `git:<repo>`, um direkt aus einem Git-Repository zu installieren. Unterstützte Formen: `git:github.com/owner/repo`, `git:owner/repo`, vollständige `https://`-, `ssh://`-, `git://`-, `file://`- und `git@host:owner/repo.git`-Klon-URLs. Fügen Sie `@<ref>` oder `#<ref>` hinzu, um vor der Installation einen Branch, ein Tag oder einen Commit auszuchecken.

    Git-Installationen klonen in ein temporäres Verzeichnis, checken, sofern vorhanden, die angeforderte Referenz aus und verwenden anschließend das normale Installationsprogramm für Plugin-Verzeichnisse. Dadurch verhalten sich Manifestvalidierung, betreiberseitige Installationsrichtlinien, Installationsvorgänge des Paketmanagers und Installationsdatensätze wie bei npm-Installationen. Aufgezeichnete Git-Installationen enthalten die Quell-URL/-Referenz sowie den aufgelösten Commit, sodass `openclaw plugins update` die Quelle später erneut auflösen kann.

    Verwenden Sie nach der Installation aus Git `openclaw plugins inspect <id> --runtime --json`, um Laufzeitregistrierungen wie Gateway-Methoden und CLI-Befehle zu überprüfen. Wenn das Plugin mit `api.registerCli` einen CLI-Stammbefehl registriert hat, führen Sie diesen Befehl direkt über die OpenClaw-Stamm-CLI aus, beispielsweise `openclaw demo-plugin ping`.

  </Accordion>
  <Accordion title="Archive">
    Unterstützte Archive: `.zip`, `.tgz`, `.tar.gz`, `.tar`. Native OpenClaw-Plugin-Archive müssen im Stammverzeichnis des extrahierten Plugins eine gültige `openclaw.plugin.json` enthalten. Archive, die nur `package.json` enthalten, werden abgelehnt, bevor OpenClaw Installationsdatensätze schreibt.

    Verwenden Sie `npm-pack:<path.tgz>`, wenn es sich bei der Datei um einen mit npm pack erstellten Tarball handelt und Sie
    denselben verwalteten npm-Projektpfad pro Plugin verwenden möchten wie bei Registry-Installationen,
    einschließlich der Überprüfung von `package-lock.json`, des Scannens hochgezogener Abhängigkeiten
    und der npm-Installationsdatensätze. Einfache Archivpfade werden weiterhin als lokale
    Archive unter dem Stammverzeichnis der Plugin-Erweiterungen installiert.

    Installationen aus Claude-Marketplaces werden ebenfalls unterstützt.

  </Accordion>
</AccordionGroup>

ClawHub-Installationen verwenden einen expliziten `clawhub:<package>`-Locator:

```bash
openclaw plugins install clawhub:openclaw-codex-app-server
openclaw plugins install clawhub:openclaw-codex-app-server@1.2.3
```

Reine npm-kompatible Plugin-Spezifikationen werden während der Umstellung beim Start standardmäßig von npm installiert, sofern sie nicht mit einer offiziellen Plugin-ID übereinstimmen:

```bash
openclaw plugins install openclaw-codex-app-server
```

Verwenden Sie `npm:`, um die ausschließliche npm-Auflösung explizit festzulegen:

```bash
openclaw plugins install npm:openclaw-codex-app-server
openclaw plugins install npm:@openclaw/discord@2026.5.20
openclaw plugins install npm:@scope/plugin-name@1.0.1
```

OpenClaw prüft vor der Installation die angegebene Kompatibilität mit der Plugin-API beziehungsweise die Mindestkompatibilität mit dem Gateway. Wenn die ausgewählte ClawHub-Version ein ClawPack-Artefakt veröffentlicht, lädt OpenClaw das versionierte npm-pack `.tgz` herunter, überprüft den ClawHub-Digest-Header sowie den Artefakt-Digest und installiert es anschließend über den normalen Archivpfad. Ältere ClawHub-Versionen ohne ClawPack-Metadaten werden weiterhin über den bisherigen Prüfpfad für Paketarchive installiert. Aufgezeichnete Installationen behalten ihre ClawHub-Quellmetadaten, die Artefaktart, npm-Integrität, npm-Prüfsumme, den Tarball-Namen und die ClawPack-Digest-Daten für spätere Aktualisierungen bei.
Nicht versionierte ClawHub-Installationen behalten eine nicht versionierte aufgezeichnete Spezifikation bei, damit `openclaw plugins update` neueren ClawHub-Veröffentlichungen folgen kann. Explizite Versions- oder Tag-Selektoren wie `clawhub:pkg@1.2.3` und `clawhub:pkg@beta` bleiben an diesen Selektor gebunden.

### Marketplace-Kurzform

Verwenden Sie die Kurzform `plugin@marketplace`, wenn der Marketplace-Name im lokalen Registry-Cache von Claude unter `~/.claude/plugins/known_marketplaces.json` vorhanden ist:

```bash
openclaw plugins marketplace list <marketplace-name>
openclaw plugins install <plugin-name>@<marketplace-name>
```

Verwenden Sie `--marketplace`, um die Marketplace-Quelle explizit anzugeben:

```bash
openclaw plugins install <plugin-name> --marketplace <marketplace-name>
openclaw plugins install <plugin-name> --marketplace <owner/repo>
openclaw plugins install <plugin-name> --marketplace https://github.com/<owner>/<repo>
openclaw plugins install <plugin-name> --marketplace ./my-marketplace
```

<Tabs>
  <Tab title="Marketplace-Quellen">
    - ein Claude-Name für einen bekannten Marketplace aus `~/.claude/plugins/known_marketplaces.json`
    - ein lokales Marketplace-Stammverzeichnis oder ein `marketplace.json`-Pfad
    - eine GitHub-Repository-Kurzform wie `owner/repo`
    - eine GitHub-Repository-URL wie `https://github.com/owner/repo`
    - eine Git-URL

  </Tab>
  <Tab title="Regeln für Remote-Marketplaces">
    Bei Remote-Marketplaces, die von GitHub oder Git geladen werden, müssen Plugin-Einträge innerhalb des geklonten Marketplace-Repositorys verbleiben. OpenClaw akzeptiert relative Pfadquellen aus diesem Repository und lehnt HTTP(S)-, absolute Pfad-, Git-, GitHub- und andere Nicht-Pfad-Plugin-Quellen aus Remote-Manifesten ab.
  </Tab>
</Tabs>

Bei lokalen Pfaden und Archiven erkennt OpenClaw automatisch:

- native OpenClaw-Plugins (`openclaw.plugin.json`)
- Codex-kompatible Bundles (`.codex-plugin/plugin.json`)
- Claude-kompatible Bundles (`.claude-plugin/plugin.json` oder das standardmäßige Claude-Komponentenlayout, wenn diese Manifestdatei fehlt)
- Cursor-kompatible Bundles (`.cursor-plugin/plugin.json`)

Verwaltete lokale Installationen müssen Plugin-Verzeichnisse oder Archive sein. Eigenständige Plugin-Dateien vom Typ `.js`,
`.mjs`, `.cjs` und `.ts` werden von `plugins install` nicht in das verwaltete Plugin-
Stammverzeichnis kopiert und auch nicht geladen, wenn sie direkt unter
`~/.openclaw/extensions` oder `<workspace>/.openclaw/extensions` abgelegt werden. Diese
automatisch erkannten Stammverzeichnisse laden Plugin-Paket- oder Bundle-Verzeichnisse und überspringen
Skriptdateien der obersten Ebene als lokale Hilfsdateien. Führen Sie eigenständige Dateien stattdessen explizit in
`plugins.load.paths` auf.

<Note>
Kompatible Bundles werden im normalen Plugin-Stammverzeichnis installiert und nehmen am selben Ablauf zum Auflisten, Anzeigen von Informationen, Aktivieren und Deaktivieren teil. Derzeit werden Bundle-Skills, Claude-Befehls-Skills, Claude-Standardwerte für `settings.json`, Claude-Standardwerte für `.lsp.json` beziehungsweise durch das Manifest deklarierte Standardwerte für `lspServers`, Cursor-Befehls-Skills und kompatible Codex-Hook-Verzeichnisse unterstützt. Andere erkannte Bundle-Funktionen werden in Diagnosen und Informationen angezeigt, sind jedoch noch nicht mit der Laufzeitausführung verbunden.
</Note>

Verwenden Sie `-l`/`--link`, um auf ein lokales Plugin-Verzeichnis zu verweisen, ohne es zu kopieren (wird
zu `plugins.load.paths` hinzugefügt):

```bash
openclaw plugins install -l ./my-plugin
```

`--link` wird bei Installationen mit `--marketplace` oder `git:` nicht unterstützt und
erfordert einen bereits vorhandenen lokalen Pfad. Übergeben Sie für eine nicht interaktive lokale Verknüpfung
nach Prüfung der Quelle `--force`. Dies bestätigt die Herkunft, kopiert oder überschreibt das verknüpfte
Verzeichnis jedoch nicht.

<Note>
Aus dem Workspace stammende Plugins, die in einem Workspace-Stammverzeichnis für Erweiterungen erkannt werden, werden weder
importiert noch ausgeführt, bis sie explizit aktiviert wurden. Führen Sie für die lokale Entwicklung
`openclaw plugins enable <plugin-id>` aus oder setzen Sie
`plugins.entries.<plugin-id>.enabled: true`. Wenn Ihre Konfiguration
`plugins.allow` verwendet, nehmen Sie dort ebenfalls dieselbe Plugin-ID auf. Diese Fail-Closed-Regel
gilt auch, wenn die Kanaleinrichtung explizit ein aus dem Workspace stammendes Plugin zum
ausschließlichen Laden für die Einrichtung auswählt. Daher wird der Einrichtungscode eines lokalen Kanal-Plugins nicht ausgeführt, solange dieses
Workspace-Plugin deaktiviert oder von der Zulassungsliste ausgeschlossen bleibt. Verknüpfte Installationen
und explizite `plugins.load.paths`-Einträge folgen der normalen Richtlinie für ihren
aufgelösten Plugin-Ursprung. Siehe
[Plugin-Richtlinie konfigurieren](/de/tools/plugin#configure-plugin-policy)
und [Konfigurationsreferenz](/de/gateway/configuration-reference#plugins).

Verwenden Sie `--pin` bei npm-Installationen, um die aufgelöste exakte Spezifikation (`name@version`) im verwalteten Plugin-Index zu speichern, während das Standardverhalten weiterhin nicht gebunden bleibt.
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
  Von der Tabellenansicht zu Detailzeilen pro Plugin mit Metadaten zu Format, Quelle, Ursprung, Version und Aktivierung wechseln.
</ParamField>
<ParamField path="--json" type="boolean">
  Maschinenlesbares Inventar sowie Registry-Diagnosen und Installationsstatus der Paketabhängigkeiten.
</ParamField>

<Note>
`plugins list` liest zuerst die persistierte lokale Plugin-Registry und verwendet eine ausschließlich aus dem Manifest abgeleitete Ausweichlösung, wenn die Registry fehlt oder ungültig ist. Dies ist nützlich, um zu prüfen, ob ein Plugin installiert und aktiviert ist und bei der Planung eines Kaltstarts berücksichtigt wird, stellt jedoch keine Live-Laufzeitprüfung eines bereits ausgeführten Gateway-Prozesses dar. Starten Sie nach Änderungen am Plugin-Code, an der Aktivierung, der Hook-Richtlinie oder an `plugins.load.paths` das Gateway neu, das den Kanal bedient, bevor Sie erwarten, dass neuer `register(api)`-Code oder neue Hooks ausgeführt werden. Stellen Sie bei Remote-/Container-Bereitstellungen sicher, dass Sie den tatsächlichen untergeordneten `openclaw gateway run`-Prozess neu starten und nicht nur einen Wrapper-Prozess.

`plugins list --json` enthält die `dependencyStatus` jedes Plugins aus `package.json`,
`dependencies` und `optionalDependencies`. OpenClaw prüft, ob diese Paketnamen
im normalen Node-`node_modules`-Suchpfad des Plugins vorhanden sind; dabei
wird weder Plugin-Laufzeitcode importiert noch ein Paketmanager ausgeführt oder
es werden fehlende Abhängigkeiten repariert.
</Note>

Wenn beim Start `plugins.allow is empty; discovered non-bundled plugins may auto-load: ...` protokolliert wird,
führen Sie `openclaw plugins list --enabled --verbose` oder
`openclaw plugins inspect <id>` mit einer aufgeführten Plugin-ID aus, um die Plugin-
IDs zu bestätigen, und kopieren Sie vertrauenswürdige IDs in `plugins.allow` in `openclaw.json`. Wenn die
Warnung alle erkannten Plugins auflisten kann, gibt sie ein direkt einfügbares
`plugins.allow`-Snippet aus, das diese IDs bereits enthält. Wenn ein Plugin
ohne Herkunftsnachweis für Installation/Ladepfad geladen wird, prüfen Sie diese Plugin-ID und hinterlegen
Sie dann entweder die vertrauenswürdige ID in `plugins.allow` oder installieren Sie das Plugin aus einer vertrauenswürdigen Quelle neu,
damit OpenClaw den Herkunftsnachweis der Installation erfasst.

Für Arbeiten an gebündelten Plugins innerhalb eines paketierten Docker-Images binden Sie das
Plugin-Quellverzeichnis über dem entsprechenden paketierten Quellpfad ein, beispielsweise
`/app/extensions/synology-chat`. OpenClaw erkennt dieses eingebundene Quell-Overlay
vor `/app/dist/extensions/synology-chat`; ein lediglich kopiertes Quellverzeichnis
bleibt inaktiv, sodass normale paketierte Installationen weiterhin das kompilierte dist verwenden.

Zur Fehlerbehebung bei Laufzeit-Hooks:

- `openclaw plugins inspect <id> --runtime --json` zeigt registrierte Hooks und Diagnosen aus einem Prüfungsdurchlauf mit geladenem Modul. Die Laufzeitprüfung installiert niemals Abhängigkeiten; verwenden Sie `openclaw doctor --fix`, um veralteten Abhängigkeitsstatus zu bereinigen oder fehlende herunterladbare Plugins wiederherzustellen, auf die in der Konfiguration verwiesen wird.
- `openclaw gateway status --deep --require-rpc` bestätigt die erreichbare Gateway-URL bzw. das Profil, Dienst-/Prozesshinweise, den Konfigurationspfad und den RPC-Zustand.
- Nicht gebündelte Konversations-Hooks (`llm_input`, `llm_output`, `before_model_resolve`, `before_agent_reply`, `before_agent_run`, `before_agent_finalize`, `agent_end`) erfordern `plugins.entries.<id>.hooks.allowConversationAccess=true`.

### Plugin-Index

Plugin-Installationsmetadaten sind maschinell verwalteter Status und keine Benutzerkonfiguration. Installationen und Aktualisierungen schreiben sie in die gemeinsame SQLite-Statusdatenbank im aktiven OpenClaw-Statusverzeichnis. Die Zeile `installed_plugin_index` speichert dauerhafte `installRecords`-Metadaten, einschließlich Datensätzen für defekte oder fehlende Plugin-Manifeste, sowie einen aus Manifesten abgeleiteten Cache der Kaltstart-Registry, der von `openclaw plugins update`, der Deinstallation, der Diagnose und der Plugin-Kaltstart-Registry verwendet wird.

Wenn OpenClaw ausgelieferte veraltete `plugins.installs`-Datensätze in der Konfiguration erkennt, behandeln Laufzeit-Lesevorgänge sie als Kompatibilitätseingabe, ohne `openclaw.json` neu zu schreiben. Explizite Plugin-Schreibvorgänge und `openclaw doctor --fix` verschieben diese Datensätze in den Plugin-Index und entfernen den Konfigurationsschlüssel, sofern Konfigurationsschreibvorgänge zulässig sind; schlägt einer der Schreibvorgänge fehl, bleiben die Konfigurationsdatensätze erhalten, damit die Installationsmetadaten nicht verloren gehen.

## Deinstallation

```bash
openclaw plugins uninstall <id>
openclaw plugins uninstall <id> --dry-run
openclaw plugins uninstall <id> --keep-files
openclaw plugins uninstall <id> --force
```

`uninstall` entfernt Plugin-Datensätze aus `plugins.entries`, dem persistierten Plugin-Index, Einträge in Plugin-Zulassungs-/Sperrlisten sowie gegebenenfalls verknüpfte `plugins.load.paths`-Einträge. Sofern `--keep-files` nicht gesetzt ist, entfernt die Deinstallation außerdem das nachverfolgte verwaltete Installationsverzeichnis, jedoch nur, wenn dessen aufgelöster Pfad innerhalb des Plugin-Erweiterungsstammverzeichnisses von OpenClaw liegt. Wenn das Plugin derzeit den Slot `memory` oder `contextEngine` belegt, wird dieser Slot auf seinen Standardwert zurückgesetzt (`memory-core` für den Speicher, `legacy` für die Kontext-Engine).

`uninstall` zeigt eine Vorschau der zu entfernenden Elemente an und fragt anschließend mit `Uninstall plugin "<id>"?` nach einer Bestätigung, bevor Änderungen vorgenommen werden. Übergeben Sie `--force`, um die Bestätigungsabfrage zu überspringen (nützlich für Skripte und nicht interaktive Ausführungen); ohne diese Option erfordert die Deinstallation ein interaktives TTY. `--dry-run` zeigt dieselbe Vorschau an und wird beendet, ohne eine Bestätigung abzufragen oder Änderungen vorzunehmen.

<Note>
`--keep-config` wird als veralteter Alias für `--keep-files` unterstützt.
</Note>

## Aktualisierung

```bash
openclaw plugins update <id-or-npm-spec>
openclaw plugins update --all
openclaw plugins update <id-or-npm-spec> --dry-run
openclaw plugins update @openclaw/voice-call
openclaw plugins update @acme/demo
openclaw plugins update openclaw-codex-app-server --acknowledge-clawhub-risk
openclaw plugins update openclaw-codex-app-server --dangerously-force-unsafe-install
```

Aktualisierungen gelten für nachverfolgte Plugin-Installationen im verwalteten Plugin-Index und für nachverfolgte Hook-Paket-Installationen in `hooks.internal.installs`. Sie verwenden erneut die Quelle, die der Benutzer bereits bei der Installation des Plugins gewählt hat, sodass keine zweite Bestätigung der Quelle erforderlich ist.

<AccordionGroup>
  <Accordion title="Auflösen von Plugin-ID und npm-Spezifikation">
    Wenn Sie eine Plugin-ID übergeben, verwendet OpenClaw erneut die für dieses Plugin gespeicherte Installationsspezifikation. Das bedeutet, dass zuvor gespeicherte dist-Tags wie `@beta` und exakt festgelegte Versionen bei späteren `update <id>`-Ausführungen weiterhin verwendet werden.

    Während `update <id> --dry-run` bleiben exakt festgelegte npm-Installationen fixiert. Wenn OpenClaw außerdem die Standardversionslinie der Registry für das Paket auflösen kann und diese Standardlinie neuer als die installierte festgelegte Version ist, meldet der Probelauf die Versionsfixierung und gibt den expliziten `@latest`-Paketaktualisierungsbefehl aus, um der Standardversionslinie der Registry zu folgen.

    Diese Regel für gezielte Aktualisierungen unterscheidet sich vom gebündelten `openclaw plugins update --all`-Wartungspfad. Massenaktualisierungen berücksichtigen weiterhin gewöhnliche nachverfolgte Installationsspezifikationen, aber vertrauenswürdige offizielle OpenClaw-Plugin-Datensätze können mit dem aktuellen Ziel des offiziellen Katalogs synchronisiert werden, statt bei einem veralteten exakten offiziellen Paket zu verbleiben. Verwenden Sie eine gezielte `update <id>`-Aktualisierung, wenn Sie eine exakte oder mit einem Tag versehene offizielle Spezifikation bewusst unverändert beibehalten möchten.

    Bei npm-Installationen können Sie außerdem eine explizite npm-Paketspezifikation mit einem dist-Tag oder einer exakten Version übergeben. OpenClaw ordnet diesen Paketnamen wieder dem nachverfolgten Plugin-Datensatz zu, aktualisiert das installierte Plugin und speichert die neue npm-Spezifikation für zukünftige ID-basierte Aktualisierungen.

    Wenn Sie den npm-Paketnamen ohne Version oder Tag übergeben, wird er ebenfalls wieder dem nachverfolgten Plugin-Datensatz zugeordnet. Verwenden Sie dies, wenn ein Plugin auf eine exakte Version festgelegt wurde und Sie es wieder auf die Standardveröffentlichungslinie der Registry umstellen möchten.

  </Accordion>
  <Accordion title="Aktualisierungen des Beta-Kanals">
    Eine gezielte `openclaw plugins update <id-or-npm-spec>`-Aktualisierung verwendet die nachverfolgte Plugin-Spezifikation erneut, sofern Sie keine neue Spezifikation übergeben. Die Massenaktualisierung `openclaw plugins update --all` verwendet das konfigurierte `update.channel`, wenn sie vertrauenswürdige offizielle Plugin-Datensätze mit dem Ziel des offiziellen Katalogs synchronisiert, sodass Installationen des Beta-Kanals auf der Beta-Veröffentlichungslinie bleiben können, statt unbemerkt auf stable/latest normalisiert zu werden.

    `openclaw update` kennt außerdem den aktiven OpenClaw-Aktualisierungskanal: Im Beta-Kanal versuchen npm- und ClawHub-Plugin-Datensätze der Standardlinie zuerst `@beta`. Sie greifen auf die gespeicherte default/latest-Spezifikation zurück, wenn keine Beta-Veröffentlichung des Plugins vorhanden ist; npm-Plugins greifen außerdem darauf zurück, wenn das Beta-Paket vorhanden ist, aber die Installationsvalidierung fehlschlägt. Dieser Rückgriff wird als Warnung gemeldet und führt nicht zum Fehlschlagen der Kernaktualisierung. Exakte Versionen und explizite Tags bleiben bei gezielten Aktualisierungen auf diesen Selektor festgelegt.

  </Accordion>
  <Accordion title="Versionsprüfungen und Integritätsabweichungen">
    Vor einer tatsächlichen npm-Aktualisierung prüft OpenClaw die installierte Paketversion anhand der Metadaten der npm-Registry. Wenn die installierte Version und die gespeicherte Artefaktidentität bereits mit dem aufgelösten Ziel übereinstimmen, wird die Aktualisierung übersprungen, ohne `openclaw.json` herunterzuladen, neu zu installieren oder neu zu schreiben.

    Wenn ein gespeicherter Integritäts-Hash vorhanden ist und sich der Hash des abgerufenen Artefakts ändert, behandelt OpenClaw dies als npm-Artefaktabweichung. Der interaktive Befehl `openclaw plugins update` zeigt die erwarteten und tatsächlichen Hashes an und fordert vor dem Fortfahren eine Bestätigung an. Nicht interaktive Aktualisierungshilfen brechen sicher ab, sofern der Aufrufer keine explizite Richtlinie zum Fortfahren angibt.

  </Accordion>
  <Accordion title="--dangerously-force-unsafe-install bei der Aktualisierung">
    `--dangerously-force-unsafe-install` wird aus Kompatibilitätsgründen auch für `plugins update` akzeptiert, ist jedoch veraltet und ändert das Verhalten bei Plugin-Aktualisierungen nicht mehr. Operator-`security.installPolicy` können Aktualisierungen weiterhin blockieren; Plugin-`before_install`-Hooks gelten nur in Prozessen, in denen Plugin-Hooks geladen sind.
  </Accordion>
  <Accordion title="--acknowledge-clawhub-risk bei der Aktualisierung">
    Aktualisierungen von Community-Plugins mit ClawHub-Quelle führen vor dem Herunterladen des Ersatzpakets dieselbe Vertrauensprüfung der exakten Veröffentlichung wie Installationen aus. Verwenden Sie `--acknowledge-clawhub-risk` für geprüfte Automatisierungen, die fortgesetzt werden sollen, wenn die ausgewählte ClawHub-Veröffentlichung eine riskante Vertrauenswarnung aufweist. Offizielle ClawHub-Pakete und gebündelte OpenClaw-Plugin-Quellen umgehen diese Vertrauensabfrage für Veröffentlichungen.
  </Accordion>
</AccordionGroup>

## Prüfen

```bash
openclaw plugins inspect <id>
openclaw plugins inspect <id> --runtime
openclaw plugins inspect <id> --json
openclaw plugins inspect --all
```

Die Prüfung zeigt Identität, Ladestatus, Quelle, Manifest-Fähigkeiten, Richtlinien-Flags, Diagnosen, Installationsmetadaten, Bundle-Fähigkeiten und jede erkannte Unterstützung für MCP- oder LSP-Server an, ohne standardmäßig Plugin-Laufzeitcode zu importieren. Die JSON-Ausgabe enthält die Verträge des Plugin-Manifests, beispielsweise `contracts.agentToolResultMiddleware` und `contracts.trustedToolPolicies`, sodass Betreiber Deklarationen vertrauenswürdiger Oberflächen prüfen können, bevor sie ein Plugin aktivieren oder neu starten. Fügen Sie `--runtime` hinzu, um das Plugin-Modul zu laden und registrierte Hooks, Tools, Befehle, Dienste, Gateway-Methoden und HTTP-Routen einzubeziehen. Die Laufzeitprüfung meldet fehlende Plugin-Abhängigkeiten direkt; Installationen und Reparaturen verbleiben in `openclaw plugins install`, `openclaw plugins update` und `openclaw doctor --fix`.

Plugin-eigene CLI-Befehle werden normalerweise als `openclaw`-Befehlsgruppen auf der obersten Ebene installiert, Plugins können jedoch auch verschachtelte Befehle unter einem Kern-Elternelement wie `openclaw nodes` registrieren. Nachdem `inspect --runtime` einen Befehl unter `cliCommands` anzeigt, führen Sie ihn am aufgeführten Pfad aus; ein Plugin, das beispielsweise `demo-git` registriert, kann mit `openclaw demo-git ping` überprüft werden.

Jedes Plugin wird danach klassifiziert, was es tatsächlich zur Laufzeit registriert:

| Form                | Bedeutung                                                                    |
| ------------------- | ---------------------------------------------------------------------------- |
| `plain-capability`  | genau ein Fähigkeitstyp (z. B. ein reines Provider-Plugin)                   |
| `hybrid-capability` | mehr als ein Fähigkeitstyp (z. B. Text + Sprache + Bilder)                   |
| `hook-only`         | nur Hooks, keine Fähigkeiten, Tools, Befehle, Dienste oder Routen            |
| `non-capability`    | Tools/Befehle/Dienste, aber keine Fähigkeiten                                |

Weitere Informationen zum Fähigkeitsmodell finden Sie unter [Plugin-Formen](/de/plugins/architecture#plugin-shapes).

<Note>
Das Flag `--json` gibt einen maschinenlesbaren Bericht aus, der sich für Skripte und Prüfungen eignet. `inspect --all` stellt eine flottenweite Tabelle mit Spalten für Form, Fähigkeitstypen, Kompatibilitätshinweise, Bundle-Fähigkeiten und Hook-Zusammenfassung dar. `info` ist ein Alias für `inspect`.
</Note>

## Diagnose

```bash
openclaw plugins doctor
```

`doctor` meldet Fehler beim Laden von Plugins, Manifest-/Discovery-Diagnosen, Kompatibilitätshinweise und veraltete Plugin-Konfigurationsreferenzen wie fehlende Plugin-Slots. Wenn der Installationsbaum und die Plugin-Konfiguration bereinigt sind, gibt es `No plugin issues detected.` aus. Wenn eine veraltete Konfiguration verbleibt, der Installationsbaum aber ansonsten intakt ist, weist die Zusammenfassung darauf hin, statt eine vollständige Funktionsfähigkeit der Plugins zu suggerieren.

Wenn ein konfiguriertes Plugin auf dem Datenträger vorhanden ist, aber durch die Pfadsicherheitsprüfungen des Loaders blockiert wird, behält die Konfigurationsvalidierung den Plugin-Eintrag bei und meldet ihn als `present but blocked`. Beheben Sie die vorangehende Diagnose zum blockierten Plugin, etwa zur Pfadeigentümerschaft oder zu weltweit beschreibbaren Berechtigungen, statt die Konfiguration `plugins.entries.<id>` oder `plugins.allow` zu entfernen.

Bei Fehlern der Modulstruktur, etwa fehlenden Exporten `register`/`activate`, führen Sie den Befehl erneut mit `OPENCLAW_PLUGIN_LOAD_DEBUG=1` aus, um eine kompakte Zusammenfassung der Exportstruktur in die Diagnoseausgabe aufzunehmen.

## Registry

```bash
openclaw plugins registry
openclaw plugins registry --refresh
openclaw plugins registry --json
```

Die lokale Plugin-Registry ist das persistierte Cold-Read-Modell von OpenClaw für die Identität installierter Plugins, deren Aktivierungsstatus, Quellmetadaten und die Zuständigkeit für Beiträge. Der normale Startvorgang, die Suche nach dem zuständigen Provider, die Klassifizierung der Kanaleinrichtung und die Plugin-Bestandsaufnahme können daraus lesen, ohne Plugin-Laufzeitmodule zu importieren.

Verwenden Sie `plugins registry`, um zu prüfen, ob die persistierte Registry vorhanden, aktuell oder veraltet ist. Verwenden Sie `--refresh`, um sie anhand des persistierten Plugin-Index, der Konfigurationsrichtlinie und der Manifest-/Paketmetadaten neu zu erstellen. Dies ist ein Reparaturpfad, kein Pfad zur Laufzeitaktivierung.

`openclaw doctor --fix` behebt außerdem Abweichungen bei Registry-nahen verwalteten npm-Paketen: Wenn ein verwaistes oder wiederhergestelltes `@openclaw/*`-Paket in einem verwalteten npm-Projekt für Plugins oder im veralteten flachen verwalteten npm-Stammverzeichnis ein gebündeltes Plugin überlagert, entfernt Doctor dieses veraltete Paket und erstellt die Registry neu, sodass der Startvorgang gegen das gebündelte Manifest validiert. Doctor verknüpft außerdem das Host-Paket `openclaw` erneut mit verwalteten npm-Plugins, die `peerDependencies.openclaw` deklarieren, damit paketlokale Laufzeitimporte wie `openclaw/plugin-sdk/*` nach Aktualisierungen oder npm-Reparaturen aufgelöst werden.

<Warning>
`OPENCLAW_DISABLE_PERSISTED_PLUGIN_REGISTRY=1` ist ein veralteter Break-Glass-Kompatibilitätsschalter für Lesefehler der Registry. Bevorzugen Sie `plugins registry --refresh` oder `openclaw doctor --fix`; der Fallback über die Umgebungsvariable ist nur für die Wiederherstellung des Startvorgangs in Notfällen vorgesehen, während die Migration eingeführt wird.
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

`plugins marketplace entries` listet Einträge aus dem konfigurierten OpenClaw-Marketplace-Feed auf. Standardmäßig versucht es, den gehosteten Feed abzurufen, und greift ersatzweise auf den zuletzt akzeptierten Snapshot oder die gebündelten Daten zurück. Verwenden Sie `--feed-profile <name>`, um ein bestimmtes konfiguriertes Profil zu lesen, `--feed-url <url>`, um eine explizite URL eines gehosteten Feeds zu lesen, und `--offline`, um den zuletzt akzeptierten Snapshot zu lesen, ohne den Feed abzurufen.

`plugins marketplace refresh` aktualisiert den konfigurierten Snapshot des gehosteten Feeds und meldet, ob OpenClaw gehostete Daten, einen gehosteten Snapshot oder gebündelte Fallback-Daten akzeptiert hat. Verwenden Sie `--expected-sha256`, wenn der Befehl für einen Aufrufer fehlschlagen soll, sofern keine aktuelle gehostete Nutzlast mit einer festgelegten Prüfsumme übereinstimmt.

Marketplace `list` akzeptiert einen lokalen Marketplace-Pfad, einen `marketplace.json`-Pfad, eine GitHub-Kurzschreibweise wie `owner/repo`, eine GitHub-Repository-URL oder eine Git-URL. `--json` gibt die aufgelöste Quellenbezeichnung sowie das geparste Marketplace-Manifest und die Plugin-Einträge aus.

Die Marketplace-Aktualisierung lädt einen gehosteten OpenClaw-Marketplace-Feed und persistiert die
validierte Antwort als lokalen Snapshot des gehosteten Feeds. Ohne Optionen verwendet sie
das konfigurierte Standard-Feed-Profil. Verwenden Sie `--feed-profile <name>`, um ein
bestimmtes konfiguriertes Profil zu aktualisieren, `--feed-url <url>`, um eine explizite URL eines gehosteten
Feeds zu aktualisieren, `--expected-sha256 <sha256>`, um eine übereinstimmende Nutzlast-Prüfsumme zu verlangen
(`sha256:<hex>` oder einen reinen 64-stelligen Hexadezimal-Digest), und `--json` für
maschinenlesbare Ausgaben. Explizite URLs gehosteter Feeds dürfen keine
Anmeldedaten, Abfragezeichenfolgen oder Fragmente enthalten. Aktualisierungen ohne festgelegte Prüfsumme können ein
Ergebnis mit einem gehosteten Snapshot oder gebündelten Fallback melden, ohne dass der Befehl fehlschlägt. Aktualisierungen
mit festgelegter Prüfsumme schlagen fehl, sofern sie keine aktuelle gehostete Nutzlast akzeptieren, und erfolgreiche gehostete
Aktualisierungen schlagen fehl, wenn OpenClaw den validierten Snapshot nicht persistieren kann.

## Verwandte Themen

- [Plugins erstellen](/de/plugins/building-plugins)
- [CLI-Referenz](/de/cli)
- [ClawHub](/clawhub)
