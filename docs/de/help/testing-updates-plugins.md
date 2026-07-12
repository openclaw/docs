---
read_when:
    - Ändern des Verhaltens von OpenClaw bei Updates, Doctor, Paketakzeptanz oder Plugin-Installationen
    - Vorbereiten oder Genehmigen eines Release-Kandidaten
    - Fehlerbehebung bei Paketaktualisierungen, der Bereinigung von Plugin-Abhängigkeiten oder Regressionen bei der Plugin-Installation
sidebarTitle: Update and plugin tests
summary: Wie OpenClaw Aktualisierungspfade, Paketmigrationen und das Installations-/Aktualisierungsverhalten von Plugins validiert
title: 'Tests: Updates und Plugins'
x-i18n:
    generated_at: "2026-07-12T15:32:12Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 4e930960b5819d2144467476cb473e62f236eca63e1d9941a6bc793b484e731c
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Checkliste für die Validierung von Updates und Plugins: Weisen Sie nach, dass das installierbare Paket
echte Benutzerdaten aktualisieren, veraltete Legacy-Daten über `doctor` reparieren und weiterhin
Plugins aus jeder unterstützten Quelle installieren, laden, aktualisieren und deinstallieren kann.

Die umfassendere Übersicht der Test-Runner finden Sie unter [Tests](/de/help/testing). Informationen zu Schlüsseln für Live-Provider
und Testsuiten mit Netzwerkzugriff finden Sie unter [Live-Tests](/de/help/testing-live).

## Was wir schützen

- Ein Paket-Tarball ist vollständig, enthält eine gültige `dist/postinstall-inventory.json`
  und ist nicht von entpackten Repository-Dateien abhängig.
- Benutzer können von einem älteren veröffentlichten Paket zum Kandidatenpaket wechseln,
  ohne Konfiguration, Agenten, Sitzungen, Arbeitsbereiche, Plugin-Zulassungslisten oder
  Kanalkonfigurationen zu verlieren.
- `openclaw doctor --fix --non-interactive` ist für die Bereinigung und Reparatur
  von Legacy-Daten zuständig. Beim Start sollten keine verborgenen Kompatibilitätsmigrationen für veraltete
  Plugin-Daten hinzukommen.
- Plugin-Installationen funktionieren aus lokalen Verzeichnissen, Git-Repositorys, npm-Paketen und über den
  ClawHub-Registrierungspfad.
- npm-Abhängigkeiten von Plugins werden in einem verwalteten npm-Projekt pro Plugin installiert,
  vor der Vertrauensfreigabe geprüft und bei der Plugin-Deinstallation über `npm uninstall`
  entfernt, damit hochgezogene Abhängigkeiten nicht zurückbleiben.
- Ein Plugin-Update ist ein No-op, wenn sich nichts geändert hat: Installationsdatensätze, aufgelöste
  Quelle, Layout der installierten Abhängigkeiten und Aktivierungsstatus bleiben unverändert.

## Lokaler Nachweis während der Entwicklung

Beginnen Sie mit einem engen Umfang:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Führen Sie bei Änderungen an Plugin-Installation, -Deinstallation, Abhängigkeiten oder
Paketinventar zusätzlich die fokussierten Tests aus, die die bearbeitete Schnittstelle abdecken:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Bevor ein Paket-Docker-Testlauf einen Tarball verwendet, weisen Sie das Paketartefakt nach:

```bash
pnpm release:check
```

`release:check` führt Prüfungen auf Abweichungen bei Konfiguration, Dokumentation und API aus (Konfigurationsschema, Baseline der
Konfigurationsdokumentation, API-Baseline und Exporte des Plugin SDK, Plugin-Versionen/-Inventar),
schreibt das Distributionsinventar des Pakets, führt `npm pack --dry-run` aus, lehnt unzulässige
gepackte Dateien ab, installiert den Tarball in ein temporäres Präfix, führt die Nachinstallation aus und
unterzieht die Einstiegspunkte gebündelter Kanäle einem Smoke-Test.

## Docker-Testläufe

Die Docker-Testläufe bilden den Nachweis auf Produktebene. Sie installieren oder aktualisieren ein echtes
Paket in Linux-Containern und prüfen das Verhalten über CLI-Befehle,
den Start des Gateway, HTTP-Prüfungen, den RPC-Status und den Dateisystemzustand.

Verwenden Sie während der Iteration fokussierte Testläufe:

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

- `test:docker:plugins` deckt Smoke-Tests für Plugin-Installationen, Installationen aus lokalen Ordnern,
  das Überspringen von Updates lokaler Ordner, lokale Ordner mit vorinstallierten
  Abhängigkeiten, Installationen von `file:`-Paketen, Git-Installationen mit CLI-Ausführung, Updates
  beweglicher Git-Referenzen, Installationen aus der npm-Registry mit hochgezogenen transitiven
  Abhängigkeiten, No-ops bei npm-Updates, die Ablehnung fehlerhafter npm-Paketmetadaten,
  Installationen aus lokalen ClawHub-Fixtures und Update-No-ops, das Update-Verhalten des Marktplatzes
  sowie Aktivierung/Inspektion des Claude-Bundles ab. Setzen Sie `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, um
  den ClawHub-Block hermetisch/offline zu halten.
- `test:docker:plugin-lifecycle-matrix` installiert das Kandidatenpaket in einem leeren
  Container und führt für ein npm-Plugin Installation, Inspektion, Deaktivierung, Aktivierung,
  explizites Upgrade, explizites Downgrade und Deinstallation nach dem Löschen des Plugin-Codes
  aus. Dabei werden RSS- und CPU-Metriken pro Phase protokolliert.
- `test:docker:plugin-update` validiert, dass ein unverändertes installiertes Plugin
  während `openclaw plugins update` nicht neu installiert wird und keine Installationsmetadaten verliert.
- `test:docker:upgrade-survivor` installiert den Kandidaten-Tarball über ein verunreinigtes
  Fixture mit alten Benutzerdaten, führt das Paket-Update und anschließend den nicht interaktiven Doctor aus, startet dann
  ein Loopback-Gateway und prüft die Erhaltung der Daten.
- `test:docker:published-upgrade-survivor` installiert zunächst eine veröffentlichte Baseline,
  konfiguriert sie über ein integriertes `openclaw config set`-Rezept, aktualisiert sie auf den
  Kandidaten-Tarball, führt Doctor aus, prüft die Legacy-Bereinigung, startet das Gateway und
  prüft `/healthz`, `/readyz` sowie den RPC-Status.
- `test:docker:update-restart-auth` installiert das Kandidatenpaket, startet ein
  verwaltetes Gateway mit Token-Authentifizierung, entfernt für
  `openclaw update --yes --json` die Gateway-Authentifizierungsumgebungsvariable des Aufrufers und verlangt, dass der Update-Befehl des Kandidaten
  das Gateway vor den regulären Prüfungen neu startet.
- `test:docker:update-migration` ist der bereinigungsintensive Testlauf für veröffentlichte Updates. Er
  beginnt mit einem konfigurierten Benutzerzustand im Stil von Discord/Telegram, führt den Baseline-
  Doctor aus, damit die Abhängigkeiten konfigurierter Plugins materialisiert werden können, legt
  Legacy-Rückstände von Plugin-Abhängigkeiten für ein konfiguriertes paketiertes Plugin an, aktualisiert auf
  den Kandidaten-Tarball und verlangt, dass der Doctor nach dem Update die alten
  Abhängigkeitsstammverzeichnisse entfernt.

Nützliche Varianten des Überlebenstests für veröffentlichte Upgrades:

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
und `versioned-runtime-deps`. Bei aggregierten Läufen wird `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues`
(Alias `far-reaching`) auf alle Szenarien erweitert, einschließlich der
Installationsmigration für konfigurierte Plugins.

Die vollständige Update-Migration ist absichtlich von Full Release CI getrennt. Verwenden Sie den
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

## Paketakzeptanz

Package Acceptance ist das GitHub-native Paket-Gate. Es löst ein einzelnes Kandidatenpaket
in einen `package-under-test`-Tarball auf, zeichnet Version und SHA-256 auf und
führt anschließend wiederverwendbare Docker-E2E-Lanes gegen genau diesen Tarball aus. Die
Harness-Referenz des Workflows ist von der Quellreferenz des Pakets getrennt, sodass die aktuelle
Testlogik ältere vertrauenswürdige Releases validieren kann.

Kandidatenquellen:

- `source=npm`: Validiert `openclaw@extended-stable`, `openclaw@beta`,
  `openclaw@latest` oder eine exakte veröffentlichte Version.
- `source=ref`: Packt einen vertrauenswürdigen Branch, Tag oder Commit mit dem
  ausgewählten aktuellen Harness.
- `source=url`: Validiert einen öffentlichen HTTPS-Tarball mit erforderlichem `package_sha256`.
  Dieser Pfad lehnt URL-Anmeldedaten, nicht standardmäßige HTTPS-Ports, private/interne
  Hostnamen oder DNS-/IP-Ergebnisse, IP-Adressbereiche für besondere Zwecke und unsichere
  Weiterleitungen ab.
- `source=trusted-url`: Validiert einen HTTPS-Tarball mit erforderlichem
  `package_sha256` und `trusted_source_id` anhand der von den Maintainern verwalteten Richtlinie
  in `.github/package-trusted-sources.json`. Verwenden Sie dies für unternehmensinterne/private
  Mirrors, statt `source=url` durch einen Allow-Private-Schalter auf Eingabeebene
  abzuschwächen. Die Bearer-Authentifizierung verwendet, sofern durch die Richtlinie konfiguriert, das feste
  Secret `OPENCLAW_TRUSTED_PACKAGE_TOKEN`.
- `source=artifact`: Verwendet einen von einem anderen Actions-Lauf hochgeladenen Tarball erneut.

Full Release Validation verwendet standardmäßig `source=artifact`, erstellt aus dem
aufgelösten Release-SHA. Übergeben Sie für einen Nachweis nach der Veröffentlichung
`package_acceptance_package_spec=openclaw@YYYY.M.PATCH`, damit dieselbe Upgrade-Matrix
stattdessen auf das ausgelieferte npm-Paket abzielt.

Release-Prüfungen rufen Package Acceptance mit dem Paket-/Update-/Neustart-/Plugin-Satz auf:

```text
doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor root-managed-vps-upgrade update-restart-auth plugins-offline plugin-update plugin-binding-command-escape
```

Wenn der Release-Soak aktiviert ist (für `release_profile=stable` und
`full` erzwungen), übergeben sie außerdem:

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Dadurch bleiben Paketmigration, Wechsel des Update-Kanals, Toleranz gegenüber beschädigten
verwalteten Plugins, Bereinigung veralteter Plugin-Abhängigkeiten, Offline-Plugin-Abdeckung,
Plugin-Update-Verhalten und Telegram-Paket-QA auf demselben aufgelösten Artefakt, ohne
dass das standardmäßige Release-Paket-Gate jedes veröffentlichte Release durchlaufen muss.

`last-stable-4` wird in die vier neuesten stabilen, über npm veröffentlichten OpenClaw-
Releases aufgelöst. Die Release-Paketabnahme fixiert `2026.4.23` als erste
Kompatibilitätsgrenze für Plugin-Updates, `2026.5.2` als Grenze für Umbrüche in der
Plugin-Architektur und `2026.4.15` als ältere veröffentlichte Update-Baseline aus
2026.4.1x; der Resolver entfernt Fixierungen, die bereits unter den neuesten vier
enthalten sind. Verwenden Sie für eine vollständige Abdeckung veröffentlichter
Update-Migrationen `all-since-2026.4.23` im separaten Update-Migration-Workflow
anstelle von Full Release CI. `release-history` bleibt für eine manuelle breitere
Stichprobe verfügbar, wenn Sie zusätzlich den älteren Anker vor diesem Datum
einbeziehen möchten.

Wenn mehrere Baselines für veröffentlichte Upgrade-Survivor ausgewählt sind, teilt der
wiederverwendbare Docker-Workflow jede Baseline in einen eigenen zielgerichteten Runner-Job
auf. Jeder Baseline-Shard führt weiterhin den ausgewählten Szenariosatz aus, Protokolle und
Artefakte bleiben jedoch pro Baseline getrennt, und die Gesamtdauer wird durch den langsamsten
Shard begrenzt statt durch einen großen seriellen Job.

Führen Sie bei der Validierung eines Kandidaten vor dem Release manuell ein Paketprofil aus:

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

Setzen Sie für einen veröffentlichten Extended-Stable-Canary
`package_spec=openclaw@extended-stable`. Package Acceptance löst diesen
Selektor in einen exakten Tarball auf, bevor die Docker-Lanes ausgeführt werden.

Verwenden Sie `suite_profile=product`, wenn die Release-Fragestellung MCP-Kanäle,
Cron-/Subagent-Bereinigung, OpenAI-Websuche oder OpenWebUI umfasst. Verwenden Sie
`suite_profile=full` nur, wenn Sie eine vollständige Docker-Abdeckung des Release-Pfads benötigen.

## Release-Standard

Für Release-Kandidaten ist der standardmäßige Nachweis-Stack:

1. `pnpm check:changed` und `pnpm test:changed` für Regressionen auf Quellcodeebene.
2. `pnpm release:check` für die Integrität des Paketartefakts.
3. Das Package-Acceptance-Profil `package` oder die benutzerdefinierten Paket-Lanes der
   Release-Prüfung für Installations-/Update-/Neustart-/Plugin-Verträge.
4. Betriebssystemübergreifende Release-Prüfungen für betriebssystemspezifisches Installations-,
   Onboarding- und Plattformverhalten.
5. Live-Suites nur, wenn die geänderte Oberfläche das Verhalten eines Providers oder
   gehosteten Dienstes betrifft.

Auf Maintainer-Rechnern sollten umfassende Gates und Docker-/Paket-Produktnachweise
in Testbox ausgeführt werden, sofern nicht ausdrücklich ein lokaler Nachweis erfolgt.

## Legacy-Kompatibilität

Die Kompatibilitätstoleranz ist eng begrenzt und zeitlich befristet:

- Pakete bis einschließlich `2026.4.25`, darunter `2026.4.25-beta.*`, dürfen in
  Package Acceptance bereits ausgelieferte Lücken in den Paketmetadaten tolerieren.
- Das veröffentlichte Paket `2026.4.26` darf vor bereits ausgelieferten lokalen
  Stempeldateien für Build-Metadaten warnen.
- Spätere Pakete müssen moderne Verträge erfüllen. Dieselben Lücken führen dann zu
  einem Fehler, statt nur eine Warnung auszugeben oder übersprungen zu werden.

Fügen Sie für diese alten Formen keine neuen Startmigrationen hinzu. Fügen Sie eine
Doctor-Reparatur hinzu oder erweitern Sie sie und weisen Sie sie anschließend mit
`upgrade-survivor`, `published-upgrade-survivor` oder `update-restart-auth` nach,
wenn der Update-Befehl für den Neustart zuständig ist.

## Abdeckung hinzufügen

Wenn Sie das Update- oder Plugin-Verhalten ändern, fügen Sie die Abdeckung auf der
niedrigsten Ebene hinzu, die aus dem richtigen Grund fehlschlagen kann:

- Reine Pfad- oder Metadatenlogik: Unit-Test neben dem Quellcode.
- Paketbestand oder Verhalten gepackter Dateien: `package-dist-inventory`- oder Tarball-
  Prüftest.
- CLI-Installations-/Aktualisierungsverhalten: Assertion oder Fixture im Docker-Lauf.
- Migrationsverhalten veröffentlichter Releases: Szenario `published-upgrade-survivor`.
- Neustartverhalten im Verantwortungsbereich der Aktualisierung: `update-restart-auth`.
- Verhalten von Registry-/Paketquellen: Fixture für `test:docker:plugins` oder ClawHub-
  Fixture-Server.
- Verhalten von Abhängigkeitslayout oder Bereinigung: Prüfen Sie sowohl die Ausführung zur Laufzeit als auch die
  Dateisystemgrenze. npm-Abhängigkeiten können innerhalb des verwalteten npm-Projekts
  des Plugins nach oben verschoben werden. Daher sollten Tests nachweisen, dass dieses Projekt durchsucht/bereinigt
  wird, statt anzunehmen, dass nur der paketlokale `node_modules`-Baum des Plugins relevant ist.

Halten Sie neue Docker-Fixtures standardmäßig hermetisch. Verwenden Sie lokale Fixture-Registries und
gefälschte Pakete, sofern nicht das Live-Registry-Verhalten Gegenstand des Tests ist.

## Fehleranalyse

Beginnen Sie mit der Identität des Artefakts:

- Zusammenfassung `resolve_package` von Package Acceptance: Quelle, Version, SHA-256 und
  Artefaktname.
- Docker-Artefakte: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, Laufprotokolle und Befehle zur erneuten Ausführung.
- Zusammenfassung des Upgrade-Survivor-Tests: `.artifacts/upgrade-survivor/summary.json`,
  einschließlich Basisversion, Kandidatenversion, Szenario, Phasenzeiten und
  Abdeckung der Konfigurationsrezepte.

Führen Sie vorzugsweise den exakt fehlgeschlagenen Lauf mit demselben Paketartefakt erneut aus,
anstatt die gesamte übergeordnete Release-Testsuite erneut auszuführen.
