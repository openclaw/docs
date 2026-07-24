---
read_when:
    - Ändern des Verhaltens von OpenClaw bei Updates, Doctor, Paketakzeptanz oder Plugin-Installationen
    - Vorbereiten oder Genehmigen eines Release-Kandidaten
    - Fehlerbehebung bei Paketaktualisierungen, Bereinigung von Plugin-Abhängigkeiten oder Regressionen bei der Plugin-Installation
sidebarTitle: Update and plugin tests
summary: Wie OpenClaw Aktualisierungspfade, Paketmigrationen und das Installations-/Aktualisierungsverhalten von Plugins validiert
title: 'Tests: Aktualisierungen und Plugins'
x-i18n:
    generated_at: "2026-07-24T04:27:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 96a11fe42472f758d4fd1cc568486e301f7460982fdb547cab8b39de04a8dabe
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Checkliste für Update- und Plugin-Validierung: Weisen Sie nach, dass das installierbare Paket
echte Benutzerdaten aktualisieren, veraltete Legacy-Daten über `doctor` reparieren und weiterhin
Plugins aus jeder unterstützten Quelle installieren, laden, aktualisieren und deinstallieren kann.

Die umfassendere Übersicht der Test-Runner finden Sie unter [Tests](/de/help/testing). Informationen zu Schlüsseln für Live-Provider
und Testsuiten mit Netzwerkzugriff finden Sie unter [Live-Tests](/de/help/testing-live).

## Was wir schützen

- Ein Paket-Tarball ist vollständig, verfügt über eine gültige `dist/postinstall-inventory.json`
  und hängt nicht von entpackten Repository-Dateien ab.
- Benutzer können von einem älteren veröffentlichten Paket zum Kandidatenpaket wechseln,
  ohne Konfiguration, Agenten, Sitzungen, Arbeitsbereiche, Plugin-Zulassungslisten oder
  Kanalkonfiguration zu verlieren.
- `openclaw doctor --fix --non-interactive` ist für die Bereinigungs- und Reparaturpfade
  von Legacy-Daten zuständig. Beim Start sollten keine verborgenen Kompatibilitätsmigrationen für veraltete
  Plugin-Daten hinzukommen.
- Plugin-Installationen funktionieren aus lokalen Verzeichnissen, Git-Repositorys, npm-Paketen und über den
  ClawHub-Registrierungspfad.
- npm-Abhängigkeiten eines Plugins werden in einem verwalteten npm-Projekt pro Plugin installiert,
  vor der Vertrauensfreigabe geprüft und bei der Plugin-Deinstallation über `npm uninstall`
  entfernt, damit hochgezogene Abhängigkeiten nicht zurückbleiben.
- Ein Plugin-Update ist wirkungslos, wenn sich nichts geändert hat: Installationsdatensätze, aufgelöste
  Quelle, Layout der installierten Abhängigkeiten und Aktivierungsstatus bleiben unverändert.

## Lokaler Nachweis während der Entwicklung

Beginnen Sie mit einem eng begrenzten Umfang:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Führen Sie bei Änderungen an Plugin-Installation, -Deinstallation, Abhängigkeiten oder Paketbestand außerdem
die gezielten Tests aus, die die bearbeitete Schnittstelle abdecken:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Bevor ein Docker-Paket-Testlauf einen Tarball verwendet, weisen Sie das Paketartefakt nach:

```bash
pnpm release:check
```

`release:check` führt Prüfungen auf Abweichungen bei Konfiguration, Dokumentation und API durch (Konfigurationsschema, Ausgangsbasis der
Konfigurationsdokumentation, API-Vertragsmanifest und Exporte des Plugin-SDK, Plugin-Versionen/-Bestand),
schreibt den Paket-Distributionsbestand, führt `npm pack --dry-run` aus, weist unzulässige
gepackte Dateien zurück, installiert den Tarball in einem temporären Präfix, führt die Nachinstallation aus und
unterzieht die Einstiegspunkte gebündelter Kanäle einem Kurztest.

## Docker-Testläufe

Die Docker-Testläufe liefern den Nachweis auf Produktebene. Sie installieren oder aktualisieren ein echtes
Paket in Linux-Containern und prüfen das Verhalten über CLI-Befehle,
den Start des Gateway, HTTP-Prüfungen, den RPC-Status und den Dateisystemzustand.

Verwenden Sie während der iterativen Entwicklung gezielte Testläufe:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-restart-auth
pnpm test:docker:update-migration
```

Wichtige Testläufe:

- `test:docker:plugins` deckt einen Kurztest der Plugin-Installation, Installationen aus lokalen Ordnern,
  das Überspringen von Updates für lokale Ordner, lokale Ordner mit vorinstallierten
  Abhängigkeiten, Installationen von `file:`-Paketen, Git-Installationen mit CLI-Ausführung, Git-Updates
  beweglicher Referenzen, Installationen aus der npm-Registry mit hochgezogenen transitiven
  Abhängigkeiten, wirkungslose npm-Updates, die Zurückweisung fehlerhafter npm-Paketmetadaten,
  Installationen aus lokalen ClawHub-Testdaten und wirkungslose Updates, das Aktualisierungsverhalten
  des Marktplatzes sowie Aktivierung und Prüfung des Claude-Bundles ab. Setzen Sie `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`,
  um den ClawHub-Block hermetisch/offline zu halten.
- `test:docker:plugin-lifecycle-matrix` installiert das Kandidatenpaket in einem leeren
  Container und führt ein npm-Plugin durch Installation, Prüfung, Deaktivierung, Aktivierung,
  explizites Upgrade, explizites Downgrade und Deinstallation, nachdem der Plugin-Code
  gelöscht wurde. Dabei werden RSS- und CPU-Metriken für jede Phase protokolliert.
- `test:docker:plugin-update` überprüft, dass ein unverändertes installiertes Plugin während
  `openclaw plugins update` weder neu installiert wird noch Installationsmetadaten verliert.
- `test:docker:upgrade-survivor` installiert den Kandidaten-Tarball über
  verunreinigte Testdaten eines alten Benutzers, führt ein Paket-Update sowie eine nicht interaktive Doctor-Ausführung aus,
  startet anschließend ein Loopback-Gateway und prüft die Erhaltung des Zustands.
- `test:docker:published-upgrade-survivor` installiert zunächst eine veröffentlichte Ausgangsversion,
  konfiguriert sie über ein integriertes `openclaw config set`-Rezept, aktualisiert sie auf den
  Kandidaten-Tarball, führt Doctor aus, prüft die Legacy-Bereinigung, startet das Gateway und
  prüft `/healthz`, `/readyz` sowie den RPC-Status.
- `test:docker:update-restart-auth` installiert das Kandidatenpaket, startet ein
  verwaltetes Gateway mit Token-Authentifizierung, entfernt für
  `openclaw update --yes --json` die Gateway-Authentifizierungsumgebung des Aufrufers und verlangt, dass der Update-Befehl
  des Kandidaten das Gateway vor den regulären Prüfungen neu startet.
- `test:docker:update-migration` ist der bereinigungsintensive Testlauf für veröffentlichte Updates. Er
  beginnt mit einem konfigurierten Benutzerzustand nach Art von Discord/Telegram, führt Doctor für die
  Ausgangsversion aus, damit Abhängigkeiten konfigurierter Plugins angelegt werden können, fügt
  Legacy-Rückstände von Plugin-Abhängigkeiten für ein konfiguriertes paketiertes Plugin hinzu, aktualisiert auf
  den Kandidaten-Tarball und verlangt, dass Doctor nach dem Update die Legacy-Stammverzeichnisse
  der Abhängigkeiten entfernt.

Nützliche Varianten für überlebende veröffentlichte Upgrades:

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

Verfügbare Szenarien: `base`, `acpx-openclaw-tools-bridge`, `feishu-channel`,
`bootstrap-persona`, `channel-post-core-restore`, `plugin-deps-cleanup`,
`configured-plugin-installs`, `stale-source-plugin-shadow`, `tilde-log-path`
und `versioned-runtime-deps`. Bei zusammengefassten Ausführungen wird `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`
(Alias `far-reaching`) auf alle Szenarien erweitert, einschließlich der
Installationsmigration konfigurierter Plugins.

Die vollständige Update-Migration ist bewusst von der vollständigen Release-CI getrennt. Verwenden Sie den
manuellen `Update Migration`-Workflow, wenn die Release-Frage lautet: „Kann jede
seit 2026.4.23 veröffentlichte stabile Version auf diesen Kandidaten aktualisiert werden und
Rückstände von Plugin-Abhängigkeiten bereinigen?“:

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Paketabnahme

Die Paketabnahme ist die GitHub-native Paketprüfung. Sie löst ein Kandidatenpaket
in einen `package-under-test`-Tarball auf, zeichnet Version und SHA-256 auf und
führt anschließend wiederverwendbare Docker-E2E-Testläufe mit genau diesem Tarball aus. Die Referenz des Workflow-Testsystems
ist von der Quellreferenz des Pakets getrennt, sodass die aktuelle Testlogik ältere
vertrauenswürdige Releases validieren kann.

Kandidatenquellen:

- `source=npm`: `openclaw@extended-stable`, `openclaw@beta`,
  `openclaw@latest` oder eine exakte veröffentlichte Version validieren.
- `source=ref`: Einen vertrauenswürdigen Branch, Tag oder Commit mit dem ausgewählten aktuellen
  Testsystem packen.
- `source=url`: Einen öffentlichen HTTPS-Tarball mit erforderlichem `package_sha256` validieren.
  Dieser Pfad weist URL-Anmeldedaten, nicht standardmäßige HTTPS-Ports, private/interne
  Hostnamen oder DNS-/IP-Ergebnisse, IP-Adressbereiche für besondere Zwecke und unsichere Weiterleitungen zurück.
- `source=trusted-url`: Einen HTTPS-Tarball mit erforderlichen
  `package_sha256` und `trusted_source_id` anhand der von den Maintainern verwalteten Richtlinie
  in `.github/package-trusted-sources.json` validieren. Verwenden Sie dies für unternehmensinterne/private
  Spiegelserver, statt `source=url` durch einen eingabebasierten Schalter zum Zulassen privater Quellen
  abzuschwächen. Die Bearer-Authentifizierung verwendet, wenn sie per Richtlinie konfiguriert ist, das feste
  Secret `OPENCLAW_TRUSTED_PACKAGE_TOKEN`.
- `source=artifact`: Einen von einer anderen Actions-Ausführung hochgeladenen Tarball wiederverwenden.

Die vollständige Release-Validierung verwendet standardmäßig `source=artifact`, das aus dem
aufgelösten Release-SHA erstellt wird. Übergeben Sie für den Nachweis nach der Veröffentlichung
`package_acceptance_package_spec=openclaw@YYYY.M.PATCH`, damit dieselbe Upgrade-Matrix
stattdessen auf das ausgelieferte npm-Paket zielt.

Release-Prüfungen rufen die Paketabnahme mit dem Paket-/Update-/Neustart-/Plugin-Satz auf:

```text
doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape
```

Wenn der Release-Dauertest aktiviert ist (für `release_profile=stable` und
`full` zwingend aktiviert), übergeben sie außerdem:

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Dadurch werden Paketmigration, Wechsel des Update-Kanals, Toleranz gegenüber beschädigten verwalteten Plugins,
Bereinigung veralteter Plugin-Abhängigkeiten, Offline-Plugin-Abdeckung, Verhalten bei Plugin-Updates
und Telegram-Paket-QA mit demselben aufgelösten Artefakt geprüft, ohne dass
die standardmäßige Release-Paketprüfung jede veröffentlichte Version durchlaufen muss.

`last-stable-4` wird in die vier neuesten stabilen, auf npm veröffentlichten OpenClaw-
Releases aufgelöst. Die Release-Paketabnahme legt `2026.4.23` als erste Kompatibilitätsgrenze
für Plugin-Updates, `2026.5.2` als Grenze für Änderungen an der Plugin-Architektur und
`2026.4.15` als ältere Ausgangsversion für veröffentlichte Updates aus dem Bereich 2026.4.1x fest; der Resolver
entfernt Pins, die bereits unter den neuesten vier enthalten sind. Verwenden Sie für eine vollständige Abdeckung der Migration
veröffentlichter Updates `all-since-2026.4.23` im separaten Update-
Migration-Workflow statt der vollständigen Release-CI. `release-history` bleibt
für eine manuelle breitere Stichprobe verfügbar, wenn auch der ältere Referenzanker
einbezogen werden soll.

Wenn mehrere Ausgangsversionen für überlebende veröffentlichte Upgrades ausgewählt sind, unterteilt der wiederverwendbare
Docker-Workflow jede Ausgangsversion in einen eigenen gezielten Runner-Job. Jeder
Ausgangsversions-Shard führt weiterhin den ausgewählten Szenariosatz aus, Protokolle und Artefakte bleiben jedoch
nach Ausgangsversion getrennt, und die Gesamtdauer wird durch den langsamsten Shard begrenzt statt durch einen großen
sequenziellen Job.

Führen Sie zur Validierung eines Kandidaten vor dem Release manuell ein Paketprofil aus:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=package \
  -f published_upgrade_survivor_baselines="last-stable-4 2026.4.23 2026.5.2 2026.4.15" \
  -f published_upgrade_survivor_scenarios=reported-issues \
  -f telegram_mode=mock-openai
```

Setzen Sie für einen veröffentlichten Canary der Extended-Stable-Version
`package_spec=openclaw@extended-stable`. Die Paketabnahme löst diesen
Selektor in einen exakten Tarball auf, bevor die Docker-Testläufe ausgeführt werden.

Verwenden Sie `suite_profile=product`, wenn die Release-Frage MCP-Kanäle,
Cron-/Subagent-Bereinigung, OpenAI-Websuche oder OpenWebUI umfasst. Verwenden Sie `suite_profile=full`
nur, wenn Sie die vollständige Docker-Abdeckung des Release-Pfads benötigen.

## Release-Standard

Für Release-Kandidaten besteht der standardmäßige Nachweisstapel aus:

1. `pnpm check:changed` und `pnpm test:changed` für Regressionen auf Quellcodeebene.
2. `pnpm release:check` für die Integrität des Paketartefakts.
3. Das `package`-Profil der Paketabnahme oder die benutzerdefinierten Paket-
   Testläufe der Release-Prüfung für Installations-, Update-, Neustart- und Plugin-Verträge.
4. Betriebssystemübergreifende Release-Prüfungen für betriebssystemspezifisches Installationsprogramm, Onboarding und Plattformverhalten.
5. Live-Testsuiten nur, wenn die geänderte Oberfläche das Verhalten von Providern oder gehosteten Diensten
   betrifft.

Auf Rechnern der Maintainer sollten umfassende Prüfungen und Docker-/Paketnachweise auf Produktebene
in Testbox ausgeführt werden, sofern nicht ausdrücklich ein lokaler Nachweis erfolgt.

## Legacy-Kompatibilität

Die Kompatibilitätstoleranz ist eng begrenzt und zeitlich befristet:

- Pakete bis einschließlich `2026.4.25`, darunter `2026.4.25-beta.*`, dürfen
  in der Paketabnahme bereits ausgelieferte Lücken in den Paketmetadaten tolerieren.
- Das veröffentlichte Paket `2026.4.26` darf bei bereits ausgelieferten lokalen
  Stempeldateien für Build-Metadaten warnen.
- Spätere Pakete müssen moderne Verträge erfüllen. Dieselben Lücken führen zu einem Fehler,
  statt nur eine Warnung auszugeben oder übersprungen zu werden.

Fügen Sie für diese alten Strukturen keine neuen Startmigrationen hinzu. Ergänzen oder erweitern Sie eine Doctor-
Reparatur und weisen Sie diese anschließend mit `upgrade-survivor`, `published-upgrade-survivor` oder
`update-restart-auth` nach, wenn der Update-Befehl für den Neustart zuständig ist.

## Abdeckung hinzufügen

Wenn Sie das Update- oder Plugin-Verhalten ändern, fügen Sie eine Abdeckung auf der niedrigsten Ebene hinzu, die aus dem richtigen Grund fehlschlagen kann:

- Reine Pfad- oder Metadatenlogik: Unit-Test neben dem Quellcode.
- Paketinventar oder Verhalten gepackter Dateien: `package-dist-inventory` oder Tarball-
  Prüftest.
- CLI-Installations-/Update-Verhalten: Assertion oder Fixture im Docker-Lauf.
- Migrationsverhalten veröffentlichter Releases: Szenario `published-upgrade-survivor`.
- Dem Update zugeordnetes Neustartverhalten: `update-restart-auth`.
- Verhalten von Registry/Paketquelle: Fixture `test:docker:plugins` oder ClawHub-
  Fixture-Server.
- Verhalten von Abhängigkeitslayout oder Bereinigung: Prüfen Sie sowohl die Laufzeitausführung als auch die
  Dateisystemgrenze. npm-Abhängigkeiten können innerhalb des verwalteten npm-Projekts des Plugins
  nach oben verschoben werden; daher sollten Tests nachweisen, dass dieses Projekt gescannt/bereinigt wird,
  statt anzunehmen, dass nur der paketlokale `node_modules`-Baum des Plugins berücksichtigt wird.

Halten Sie neue Docker-Fixtures standardmäßig hermetisch. Verwenden Sie lokale Fixture-Registrys und
gefälschte Pakete, sofern nicht das Verhalten einer Live-Registry Gegenstand des Tests ist.

## Fehleranalyse

Beginnen Sie mit der Artefaktidentität:

- Zusammenfassung der Package Acceptance `resolve_package`: Quelle, Version, SHA-256 und
  Artefaktname.
- Docker-Artefakte: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, Laufprotokolle und Befehle zur erneuten Ausführung.
- Zusammenfassung der Upgrade-Überlebenden: `.artifacts/upgrade-survivor/summary.json`,
  einschließlich Ausgangsversion, Kandidatenversion, Szenario, Phasenzeitmessungen und
  Abdeckung der Konfigurationsrezepte.

Führen Sie vorzugsweise genau den fehlgeschlagenen Lauf mit demselben Paketartefakt erneut aus,
anstatt den gesamten übergeordneten Release-Ablauf erneut auszuführen.
