---
read_when:
    - Ändern des Verhaltens von OpenClaw bei Updates, Doctor, Paketakzeptanz oder der Plugin-Installation
    - Vorbereiten oder Freigeben eines Release-Kandidaten
    - Fehlerbehebung bei Paketaktualisierungen, Bereinigung von Plugin-Abhängigkeiten oder Regressionen bei der Plugin-Installation
sidebarTitle: Update and plugin tests
summary: Wie OpenClaw Aktualisierungspfade, Paketmigrationen sowie das Installations- und Aktualisierungsverhalten von Plugins validiert
title: 'Tests: Updates und Plugins'
x-i18n:
    generated_at: "2026-07-12T01:45:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4e930960b5819d2144467476cb473e62f236eca63e1d9941a6bc793b484e731c
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Checkliste für die Validierung von Updates und Plugins: Weisen Sie nach, dass das installierbare Paket
echte Benutzerdaten aktualisieren, veraltete Legacy-Daten über `doctor` reparieren und weiterhin
Plugins aus jeder unterstützten Quelle installieren, laden, aktualisieren und deinstallieren kann.

Eine umfassendere Übersicht der Test-Runner finden Sie unter [Tests](/de/help/testing). Informationen zu Schlüsseln für Live-Provider
und Testsuiten mit Netzwerkzugriff finden Sie unter [Live-Tests](/de/help/testing-live).

## Was wir schützen

- Ein Paket-Tarball ist vollständig, enthält eine gültige `dist/postinstall-inventory.json`
  und ist nicht von entpackten Repository-Dateien abhängig.
- Benutzer können von einem älteren veröffentlichten Paket zum Kandidatenpaket wechseln,
  ohne Konfiguration, Agenten, Sitzungen, Arbeitsbereiche, Plugin-Zulassungslisten oder
  Kanalkonfiguration zu verlieren.
- `openclaw doctor --fix --non-interactive` ist für die Bereinigung und Reparatur von
  Legacy-Daten zuständig. Der Startvorgang sollte nicht um versteckte Kompatibilitätsmigrationen für
  veraltete Plugin-Daten erweitert werden.
- Plugin-Installationen funktionieren aus lokalen Verzeichnissen, Git-Repositorys, npm-Paketen und über den
  ClawHub-Registrierungspfad.
- npm-Abhängigkeiten von Plugins werden in einem verwalteten npm-Projekt pro Plugin installiert,
  vor der Vertrauensfreigabe geprüft und bei der Plugin-Deinstallation mit `npm uninstall` entfernt,
  damit hochgezogene Abhängigkeiten nicht zurückbleiben.
- Ein Plugin-Update führt keine Änderungen aus, wenn sich nichts geändert hat: Installationsdatensätze, aufgelöste
  Quelle, Layout der installierten Abhängigkeiten und Aktivierungsstatus bleiben unverändert.

## Lokaler Nachweis während der Entwicklung

Beginnen Sie mit einem engen Prüfumfang:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Führen Sie bei Änderungen an Plugin-Installation, -Deinstallation, -Abhängigkeiten oder dem Paketbestand außerdem
die fokussierten Tests aus, die die bearbeitete Schnittstelle abdecken:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Weisen Sie das Paketartefakt nach, bevor eine Docker-Paketspur einen Tarball verwendet:

```bash
pnpm release:check
```

`release:check` führt Prüfungen auf Abweichungen bei Konfiguration, Dokumentation und API aus (Konfigurationsschema, Referenzstand der Konfigurationsdokumentation,
Referenzstand und Exporte der Plugin-SDK-API, Plugin-Versionen und -Bestand),
schreibt den Paket-Distributionsbestand, führt `npm pack --dry-run` aus, lehnt unzulässige
gepackte Dateien ab, installiert den Tarball in ein temporäres Präfix, führt die Nachinstallation aus und
unterzieht die Einstiegspunkte gebündelter Kanäle einem Smoke-Test.

## Docker-Spuren

Die Docker-Spuren bilden den Nachweis auf Produktebene. Sie installieren oder aktualisieren ein echtes
Paket in Linux-Containern und prüfen das Verhalten über CLI-Befehle,
Gateway-Start, HTTP-Prüfungen, RPC-Status und Dateisystemzustand.

Verwenden Sie während der iterativen Entwicklung fokussierte Spuren:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-restart-auth
pnpm test:docker:update-migration
```

Wichtige Spuren:

- `test:docker:plugins` deckt den Smoke-Test der Plugin-Installation, Installationen aus lokalen Ordnern,
  das Überspringen von Updates bei unveränderten lokalen Ordnern, lokale Ordner mit vorinstallierten
  Abhängigkeiten, Installationen von `file:`-Paketen, Git-Installationen mit CLI-Ausführung, Aktualisierungen bei
  verschobenen Git-Referenzen, Installationen aus der npm-Registry mit hochgezogenen transitiven
  Abhängigkeiten, wirkungslose npm-Updates, die Ablehnung fehlerhafter npm-Paketmetadaten,
  Installationen aus lokalen ClawHub-Testdaten und wirkungslose Updates, das Aktualisierungsverhalten des Marktplatzes
  sowie die Aktivierung und Inspektion von Claude-Paketen ab. Setzen Sie `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, um
  den ClawHub-Block hermetisch und offline zu halten.
- `test:docker:plugin-lifecycle-matrix` installiert das Kandidatenpaket in einem leeren
  Container und führt ein npm-Plugin durch Installation, Inspektion, Deaktivierung, Aktivierung,
  explizites Upgrade, explizites Downgrade und Deinstallation nach dem Löschen des Plugin-Codes.
  Dabei werden RSS- und CPU-Metriken pro Phase protokolliert.
- `test:docker:plugin-update` prüft, dass ein unverändertes installiertes Plugin
  während `openclaw plugins update` weder neu installiert wird noch Installationsmetadaten verliert.
- `test:docker:upgrade-survivor` installiert den Kandidaten-Tarball über eine verunreinigte
  Testumgebung eines alten Benutzers, führt die Paketaktualisierung sowie den nicht interaktiven Doctor aus, startet anschließend
  ein local-loopback-Gateway und prüft die Erhaltung des Zustands.
- `test:docker:published-upgrade-survivor` installiert zunächst einen veröffentlichten Referenzstand,
  konfiguriert ihn über ein integriertes `openclaw config set`-Rezept, aktualisiert ihn auf den
  Kandidaten-Tarball, führt Doctor aus, prüft die Legacy-Bereinigung, startet das Gateway und
  prüft `/healthz`, `/readyz` sowie den RPC-Status.
- `test:docker:update-restart-auth` installiert das Kandidatenpaket, startet ein
  verwaltetes Gateway mit Token-Authentifizierung, entfernt für
  `openclaw update --yes --json` die Umgebungsvariable für die Gateway-Authentifizierung des Aufrufers und verlangt, dass der Aktualisierungsbefehl des Kandidaten
  das Gateway vor den regulären Prüfungen neu startet.
- `test:docker:update-migration` ist die bereinigungsintensive Spur für Aktualisierungen veröffentlichter Pakete. Sie
  beginnt mit einem konfigurierten Benutzerzustand im Stil von Discord/Telegram, führt den Doctor des Referenzstands aus,
  damit Abhängigkeiten konfigurierter Plugins angelegt werden können, legt
  Legacy-Rückstände von Plugin-Abhängigkeiten für ein konfiguriertes paketiertes Plugin an, aktualisiert auf
  den Kandidaten-Tarball und verlangt, dass der Doctor nach der Aktualisierung die Legacy-
  Abhängigkeitsstammverzeichnisse entfernt.

Nützliche Varianten für den Überlebenstest veröffentlichter Upgrades:

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
und `versioned-runtime-deps`. Bei Gesamtläufen wird `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`
(Alias `far-reaching`) auf alle Szenarien erweitert, einschließlich der
Migration für die Installation konfigurierter Plugins.

Die vollständige Aktualisierungsmigration ist absichtlich von der vollständigen Release-CI getrennt. Verwenden Sie den
manuellen Workflow `Update Migration`, wenn die Release-Frage lautet: „Kann jede
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
führt anschließend wiederverwendbare Docker-E2E-Spuren gegen genau diesen Tarball aus. Die Workflow-Harness-
Referenz ist von der Referenz der Paketquelle getrennt, sodass die aktuelle Testlogik ältere
vertrauenswürdige Releases validieren kann.

Kandidatenquellen:

- `source=npm`: Validiert `openclaw@extended-stable`, `openclaw@beta`,
  `openclaw@latest` oder eine exakt veröffentlichte Version.
- `source=ref`: Packt einen vertrauenswürdigen Branch, ein Tag oder einen Commit mit dem ausgewählten aktuellen
  Harness.
- `source=url`: Validiert einen öffentlichen HTTPS-Tarball mit erforderlichem `package_sha256`.
  Dieser Pfad lehnt URL-Anmeldedaten, vom Standard abweichende HTTPS-Ports, private/interne
  Hostnamen oder DNS-/IP-Ergebnisse, IP-Adressräume für Sonderzwecke und unsichere Weiterleitungen ab.
- `source=trusted-url`: Validiert einen HTTPS-Tarball mit erforderlichem
  `package_sha256` und `trusted_source_id` anhand der von den Maintainern verwalteten Richtlinie
  in `.github/package-trusted-sources.json`. Verwenden Sie dies für Unternehmens-/private
  Spiegelserver, statt `source=url` durch einen Schalter auf Eingabeebene zur Zulassung privater Quellen abzuschwächen.
  Wenn die Richtlinie Bearer-Authentifizierung konfiguriert, wird das festgelegte Secret
  `OPENCLAW_TRUSTED_PACKAGE_TOKEN` verwendet.
- `source=artifact`: Verwendet einen von einem anderen Actions-Lauf hochgeladenen Tarball erneut.

Die vollständige Release-Validierung verwendet standardmäßig `source=artifact`, erstellt aus dem
aufgelösten Release-SHA. Übergeben Sie für den Nachweis nach der Veröffentlichung
`package_acceptance_package_spec=openclaw@YYYY.M.PATCH`, damit dieselbe Upgrade-Matrix
stattdessen das ausgelieferte npm-Paket prüft.

Release-Prüfungen rufen die Paketabnahme mit der folgenden Zusammenstellung für Paket, Aktualisierung, Neustart und Plugins auf:

```text
doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape
```

Wenn die Release-Beobachtungsphase aktiviert ist (für `release_profile=stable` und
`full` erzwungen), übergeben sie außerdem:

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Dadurch werden Paketmigration, Wechsel des Aktualisierungskanals, Toleranz gegenüber beschädigten verwalteten Plugins,
Bereinigung veralteter Plugin-Abhängigkeiten, Offline-Abdeckung für Plugins, Plugin-
Aktualisierungsverhalten und Telegram-Paket-QA anhand desselben aufgelösten Artefakts geprüft, ohne
dass die standardmäßige Release-Paketprüfung jede veröffentlichte Version durchlaufen muss.

`last-stable-4` wird in die vier neuesten stabilen, auf npm veröffentlichten OpenClaw-
Versionen aufgelöst. Die Release-Paketabnahme legt `2026.4.23` als erste
Kompatibilitätsgrenze für Plugin-Aktualisierungen, `2026.5.2` als Grenze für Änderungen an der Plugin-Architektur und
`2026.4.15` als älteren Referenzstand für Aktualisierungen veröffentlichter Versionen aus der Reihe 2026.4.1x fest; der Resolver
entfernt festgelegte Versionen, die bereits unter den neuesten vier enthalten sind. Verwenden Sie für eine vollständige Abdeckung der
Migration veröffentlichter Aktualisierungen `all-since-2026.4.23` im separaten Workflow „Update
Migration“ statt in der vollständigen Release-CI. `release-history` bleibt
für eine manuelle, breitere Stichprobe verfügbar, wenn Sie zusätzlich den Legacy-
Referenzpunkt vor diesem Datum einbeziehen möchten.

Wenn mehrere Referenzstände für Überlebenstests veröffentlichter Upgrades ausgewählt sind, teilt der wiederverwendbare
Docker-Workflow jeden Referenzstand in einen eigenen gezielten Runner-Job auf. Jeder
Referenzstand-Shard führt weiterhin die ausgewählte Szenariengruppe aus, Protokolle und Artefakte bleiben jedoch
nach Referenzstand getrennt, und die Gesamtdauer wird durch den langsamsten Shard statt durch einen großen
seriellen Job begrenzt.

Führen Sie bei der Validierung eines Kandidaten vor der Veröffentlichung manuell ein Paketprofil aus:

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

Setzen Sie für einen veröffentlichten Canary der erweiterten stabilen Version
`package_spec=openclaw@extended-stable`. Die Paketabnahme löst diesen
Selektor in einen exakten Tarball auf, bevor die Docker-Spuren ausgeführt werden.

Verwenden Sie `suite_profile=product`, wenn die Release-Frage MCP-Kanäle,
die Bereinigung von Cron/Subagenten, die OpenAI-Websuche oder OpenWebUI umfasst. Verwenden Sie `suite_profile=full`
nur, wenn Sie eine vollständige Docker-Abdeckung der Release-Pfade benötigen.

## Release-Standard

Für Release-Kandidaten ist dies die standardmäßige Nachweiskette:

1. `pnpm check:changed` und `pnpm test:changed` für Regressionen auf Quellcodeebene.
2. `pnpm release:check` für die Integrität des Paketartefakts.
3. Das Paketprofil der Paketabnahme oder die benutzerdefinierten Paketspuren der Release-Prüfung
   für Installations-, Aktualisierungs-, Neustart- und Plugin-Verträge.
4. Betriebssystemübergreifende Release-Prüfungen für betriebssystemspezifische Installations-, Onboarding- und Plattform-
   Verhaltensweisen.
5. Live-Testsuiten nur, wenn die geänderte Oberfläche das Verhalten von Providern oder gehosteten Diensten
   betrifft.

Auf Rechnern der Maintainer sollten umfassende Prüfungen und Produktnachweise für Docker/Pakete
in Testbox ausgeführt werden, sofern nicht ausdrücklich ein lokaler Nachweis durchgeführt wird.

## Legacy-Kompatibilität

Die Nachsicht bei der Kompatibilität ist eng begrenzt und zeitlich befristet:

- Pakete bis einschließlich `2026.4.25`, einschließlich `2026.4.25-beta.*`, dürfen
  bereits ausgelieferte Lücken in Paketmetadaten bei der Paketabnahme tolerieren.
- Das veröffentlichte Paket `2026.4.26` darf bei bereits ausgelieferten Stempeldateien für lokale
  Build-Metadaten eine Warnung ausgeben.
- Spätere Pakete müssen moderne Verträge erfüllen. Dieselben Lücken führen dann zu einem Fehler,
  statt lediglich eine Warnung auszugeben oder übersprungen zu werden.

Fügen Sie für diese alten Formen keine neuen Startmigrationen hinzu. Fügen Sie eine Doctor-
Reparatur hinzu oder erweitern Sie sie und weisen Sie diese anschließend mit `upgrade-survivor`, `published-upgrade-survivor` oder
`update-restart-auth` nach, wenn der Aktualisierungsbefehl für den Neustart zuständig ist.

## Abdeckung hinzufügen

Wenn Sie das Aktualisierungs- oder Plugin-Verhalten ändern, ergänzen Sie die Abdeckung auf der niedrigsten Ebene, die
aus dem richtigen Grund fehlschlagen kann:

- Reine Pfad- oder Metadatenlogik: Unit-Test neben dem Quellcode.
- Paketbestand oder Verhalten gepackter Dateien: `package-dist-inventory`- oder Tarball-Prüftest.
- CLI-Installations-/Aktualisierungsverhalten: Assertion oder Fixture der Docker-Lane.
- Migrationsverhalten veröffentlichter Releases: Szenario `published-upgrade-survivor`.
- Neustartverhalten im Zuständigkeitsbereich der Aktualisierung: `update-restart-auth`.
- Verhalten von Registry-/Paketquellen: Fixture für `test:docker:plugins` oder ClawHub-Fixture-Server.
- Abhängigkeitslayout oder Bereinigungsverhalten: Prüfen Sie sowohl die Laufzeitausführung als auch die Dateisystemgrenze. npm-Abhängigkeiten können innerhalb des verwalteten npm-Projekts des Plugins nach oben verlagert werden. Tests sollten daher nachweisen, dass dieses Projekt durchsucht/bereinigt wird, statt anzunehmen, dass ausschließlich der paketlokale `node_modules`-Baum des Plugins berücksichtigt wird.

Halten Sie neue Docker-Fixtures standardmäßig hermetisch. Verwenden Sie lokale Fixture-Registrys und Scheinpakete, sofern nicht gerade das Verhalten einer Live-Registry Gegenstand des Tests ist.

## Fehlertriage

Beginnen Sie mit der Artefaktidentität:

- Zusammenfassung von Package Acceptance für `resolve_package`: Quelle, Version, SHA-256 und Artefaktname.
- Docker-Artefakte: `.artifacts/docker-tests/**/summary.json`, `failures.json`, Lane-Protokolle und Befehle zur erneuten Ausführung.
- Zusammenfassung des Upgrade-Survivors: `.artifacts/upgrade-survivor/summary.json`, einschließlich Ausgangsversion, Kandidatenversion, Szenario, Phasenlaufzeiten und Abdeckung der Konfigurationsrezepte.

Führen Sie vorzugsweise exakt die fehlgeschlagene Lane mit demselben Paketartefakt erneut aus, statt den gesamten übergeordneten Release-Testlauf zu wiederholen.
