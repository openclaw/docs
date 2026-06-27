---
read_when:
    - Ändern des OpenClaw-Update-, Diagnose-, Paketabnahme- oder Plugin-Installationsverhaltens
    - Release Candidate vorbereiten oder genehmigen
    - Debugging von Paketaktualisierungen, Bereinigung von Plugin-Abhängigkeiten oder Regressionen bei der Plugin-Installation
sidebarTitle: Update and plugin tests
summary: Wie OpenClaw Update-Pfade, Paketmigrationen und das Installations-/Update-Verhalten von Plugins validiert
title: 'Testen: Updates und Plugins'
x-i18n:
    generated_at: "2026-06-27T17:36:01Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9be94eab4be97c53022bdac3110da74a61cfa23db989964c803497305e5415db
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Dies ist die dedizierte Checkliste für Update- und Plugin-Validierung. Das Ziel ist
einfach: Beweisen, dass das installierbare Paket echten Benutzerzustand aktualisieren,
veralteten Legacy-Zustand über `doctor` reparieren und weiterhin Plugins aus den
unterstützten Quellen installieren, laden, aktualisieren und deinstallieren kann.

Die breitere Übersicht zum Test-Runner finden Sie unter [Tests](/de/help/testing). Für Live-Provider-
Schlüssel und Suites, die das Netzwerk berühren, siehe [Live testen](/de/help/testing-live).

## Was wir schützen

Update- und Plugin-Tests schützen diese Verträge:

- Ein Paket-Tarball ist vollständig, hat eine gültige `dist/postinstall-inventory.json`
  und hängt nicht von entpackten Repo-Dateien ab.
- Ein Benutzer kann von einem älteren veröffentlichten Paket zum Kandidatenpaket
  wechseln, ohne Konfiguration, Agenten, Sitzungen, Arbeitsbereiche, Plugin-Zulassungslisten oder
  Channel-Konfiguration zu verlieren.
- `openclaw doctor --fix --non-interactive` besitzt Legacy-Bereinigungs- und
  Reparaturpfade. Der Start sollte keine versteckten Kompatibilitätsmigrationen für veralteten
  Plugin-Zustand erweitern.
- Plugin-Installationen funktionieren aus lokalen Verzeichnissen, Git-Repos, npm-Paketen und dem
  ClawHub-Registry-Pfad.
- npm-Abhängigkeiten von Plugins werden in einem verwalteten npm-Projekt pro Plugin installiert,
  vor dem Vertrauen gescannt und während der Deinstallation über npm entfernt, damit gehobene
  Abhängigkeiten nicht zurückbleiben.
- Plugin-Updates sind stabil, wenn sich nichts geändert hat: Installationsdatensätze, aufgelöste
  Quelle, installiertes Abhängigkeitslayout und aktivierter Zustand bleiben intakt.

## Lokaler Nachweis während der Entwicklung

Beginnen Sie eng gefasst:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Führen Sie bei Änderungen an Plugin-Installation, Deinstallation, Abhängigkeiten oder Paket-Inventar außerdem
die fokussierten Tests aus, die die bearbeitete Schnittstelle abdecken:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Bevor eine Paket-Docker-Lane einen Tarball verwendet, beweisen Sie das Paket-Artefakt:

```bash
pnpm release:check
```

`release:check` führt Drift-Prüfungen für Konfiguration/Dokumentation/API aus, schreibt das Paket-Dist-
Inventar, führt `npm pack --dry-run` aus, weist verbotene gepackte Dateien zurück, installiert
den Tarball in ein temporäres Präfix, führt postinstall aus und smoke-testet gebündelte Channel-
Einstiegspunkte.

## Docker-Lanes

Die Docker-Lanes sind der Nachweis auf Produktebene. Sie installieren oder aktualisieren ein echtes
Paket innerhalb von Linux-Containern und prüfen Verhalten über CLI-Befehle,
Gateway-Start, HTTP-Probes, RPC-Status und Dateisystemzustand.

Verwenden Sie beim Iterieren fokussierte Lanes:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-restart-auth
pnpm test:docker:update-migration
```

Wichtige Lanes:

- `test:docker:plugins` validiert Plugin-Installations-Smoke, Installationen lokaler Ordner,
  Skip-Verhalten bei Updates lokaler Ordner, lokale Ordner mit vorinstallierten
  Abhängigkeiten, `file:`-Paketinstallationen, Git-Installationen mit CLI-Ausführung, Git-
  Moving-Ref-Updates, npm-Registry-Installationen mit gehobenen transitiven
  Abhängigkeiten, npm-Update-No-Ops, Zurückweisung fehlerhafter npm-Paketmetadaten,
  lokale ClawHub-Fixture-Installationen und Update-No-Ops, Marketplace-Update-Verhalten
  und Claude-Bundle-Aktivierung/Inspektion. Setzen Sie `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, um
  den ClawHub-Block hermetisch/offline zu halten.
- `test:docker:plugin-lifecycle-matrix` installiert das Kandidatenpaket in einem leeren
  Container, führt ein npm-Plugin durch Installation, Inspektion, Deaktivierung, Aktivierung,
  explizites Upgrade, explizites Downgrade und Deinstallation nach dem Löschen des Plugin-
  Codes. Es protokolliert RSS- und CPU-Metriken für jede Phase.
- `test:docker:plugin-update` validiert, dass ein unverändertes installiertes Plugin während
  `openclaw plugins update` nicht neu installiert wird und keine Installationsmetadaten verliert.
- `test:docker:upgrade-survivor` installiert den Kandidaten-Tarball über eine schmutzige
  Altbenutzer-Fixture, führt Paket-Update plus nicht interaktiven doctor aus, startet dann
  einen Loopback-Gateway und prüft die Zustandserhaltung.
- `test:docker:published-upgrade-survivor` installiert zuerst eine veröffentlichte Baseline,
  konfiguriert sie über ein eingebettetes `openclaw config set`-Rezept, aktualisiert sie auf den
  Kandidaten-Tarball, führt doctor aus, prüft Legacy-Bereinigung, startet den Gateway und
  probt `/healthz`, `/readyz` und RPC-Status.
- `test:docker:update-restart-auth` installiert das Kandidatenpaket, startet einen
  verwalteten Token-Auth-Gateway, entfernt Gateway-Auth-Umgebungsvariablen des Aufrufers für
  `openclaw update --yes --json` und verlangt, dass der Update-Befehl des Kandidaten
  den Gateway vor den normalen Probes neu startet.
- `test:docker:update-migration` ist die bereinigungsintensive Published-Update-Lane. Sie
  startet aus einem konfigurierten Discord/Telegram-artigen Benutzerzustand, führt Baseline-
  doctor aus, damit konfigurierte Plugin-Abhängigkeiten materialisiert werden können, seetet
  Legacy-Plugin-Abhängigkeitsreste für ein konfiguriertes paketiertes Plugin, aktualisiert auf
  den Kandidaten-Tarball und verlangt, dass post-update doctor die Legacy-
  Abhängigkeitswurzeln entfernt.

Nützliche Published-Upgrade-Survivor-Varianten:

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

Verfügbare Szenarien sind `base`, `feishu-channel`, `bootstrap-persona`,
`plugin-deps-cleanup`, `configured-plugin-installs`,
`stale-source-plugin-shadow`, `tilde-log-path` und `versioned-runtime-deps`. In aggregierten Läufen
wird `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` auf alle gemeldeten
Issue-förmigen Szenarien erweitert, einschließlich der Migration für konfigurierte Plugin-Installation.

Die vollständige Update-Migration ist bewusst von Full Release CI getrennt. Verwenden Sie den
manuellen Workflow `Update Migration`, wenn die Release-Frage lautet: „Kann jede
veröffentlichte stabile Version ab 2026.4.23 auf diesen Kandidaten aktualisieren und
Plugin-Abhängigkeitsreste bereinigen?“:

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Paketabnahme

Package Acceptance ist das GitHub-native Paket-Gate. Es löst ein Kandidatenpaket
in einen `package-under-test`-Tarball auf, zeichnet Version und SHA-256 auf und
führt dann wiederverwendbare Docker-E2E-Lanes gegen genau diesen Tarball aus. Die Workflow-Harness-
Ref ist von der Paketquellen-Ref getrennt, sodass aktuelle Testlogik ältere vertrauenswürdige
Releases validieren kann.

Kandidatenquellen:

- `source=npm`: validiert `openclaw@beta`, `openclaw@latest` oder eine exakte
  veröffentlichte Version.
- `source=ref`: packt einen vertrauenswürdigen Branch, Tag oder Commit mit dem ausgewählten aktuellen
  Harness.
- `source=url`: validiert einen öffentlichen HTTPS-Tarball mit erforderlichem `package_sha256`.
  Dieser Pfad weist URL-Zugangsdaten, nicht standardmäßige HTTPS-Ports, private/interne
  Hostnamen oder DNS/IP-Ergebnisse, Special-Use-IP-Bereiche und unsichere Redirects zurück.
- `source=trusted-url`: validiert einen HTTPS-Tarball mit erforderlichem
  `package_sha256` und `trusted_source_id` gegen die von Maintainern kontrollierte Richtlinie
  in `.github/package-trusted-sources.json`. Verwenden Sie dies für Enterprise-/private
  Spiegel statt `source=url` mit einem eingabeseitigen Allow-Private-Schalter abzuschwächen.
  Bearer-Auth verwendet, wenn per Richtlinie konfiguriert, das feste
  `OPENCLAW_TRUSTED_PACKAGE_TOKEN`-Secret.
- `source=artifact`: verwendet einen von einem anderen Actions-Lauf hochgeladenen Tarball erneut.

Full Release Validation verwendet standardmäßig `source=artifact`, gebaut aus dem
aufgelösten Release-SHA. Für Nachweise nach der Veröffentlichung übergeben Sie
`package_acceptance_package_spec=openclaw@YYYY.M.PATCH`, damit dieselbe Upgrade-Matrix
stattdessen das ausgelieferte npm-Paket anvisiert.

Release-Prüfungen rufen Package Acceptance mit dem Paket-/Update-/Restart-/Plugin-Set auf:

```text
doctor-switch update-channel-switch update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update
```

Wenn Release-Soak aktiviert ist, übergeben sie außerdem:

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Dies hält Paketmigration, Update-Channel-Umschaltung, Toleranz für korrupte verwaltete Plugins,
Bereinigung veralteter Plugin-Abhängigkeiten, Offline-Plugin-Abdeckung, Plugin-
Update-Verhalten und Telegram-Paket-QA auf demselben aufgelösten Artefakt, ohne
das Standard-Release-Paket-Gate über jede veröffentlichte Version laufen zu lassen.

`last-stable-4` wird zu den vier neuesten stabilen, per npm veröffentlichten OpenClaw-
Releases aufgelöst. Release Package Acceptance pinnt `2026.4.23` als erste Plugin-Update-
Kompatibilitätsgrenze, `2026.5.2` als Grenze für Plugin-Architekturänderungen und
`2026.4.15` als ältere Published-Update-Baseline aus 2026.4.1x; der Resolver
dedupliziert Pins, die bereits in den neuesten vier enthalten sind. Für exhaustive Published-
Update-Migrationsabdeckung verwenden Sie `all-since-2026.4.23` im separaten Update-
Migration-Workflow statt Full Release CI. `release-history` bleibt
für manuelles breiteres Sampling verfügbar, wenn Sie auch den Legacy-Anker vor diesem Datum
wünschen.

Wenn mehrere Published-Upgrade-Survivor-Baselines ausgewählt sind, shardet der wiederverwendbare
Docker-Workflow jede Baseline in einen eigenen gezielten Runner-Job. Jeder
Baseline-Shard führt weiterhin das ausgewählte Szenario-Set aus, aber Logs und Artefakte bleiben
pro Baseline getrennt und die Laufzeit wird durch den langsamsten Shard begrenzt statt durch einen großen
seriellen Job.

Führen Sie ein Paketprofil manuell aus, wenn Sie einen Kandidaten vor dem Release validieren:

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

Verwenden Sie `suite_profile=product`, wenn die Release-Frage MCP-Channels,
Cron-/Subagent-Bereinigung, OpenAI-Websuche oder OpenWebUI umfasst. Verwenden Sie `suite_profile=full`
nur, wenn Sie vollständige Docker-Release-Pfad-Abdeckung benötigen.

## Release-Standard

Für Release-Kandidaten ist der Standard-Nachweisstapel:

1. `pnpm check:changed` und `pnpm test:changed` für Regressionen auf Quellcodeebene.
2. `pnpm release:check` für Integrität des Paket-Artefakts.
3. Package Acceptance `package`-Profil oder die benutzerdefinierten Paket-Lanes der Release-Prüfung
   für Installations-/Update-/Restart-/Plugin-Verträge.
4. Cross-OS-Release-Prüfungen für OS-spezifischen Installer, Onboarding und Plattform-
   Verhalten.
5. Live-Suites nur, wenn die geänderte Oberfläche Provider- oder Hosted-Service-
   Verhalten berührt.

Auf Maintainer-Maschinen sollten breite Gates und Docker-/Paket-Produktnachweise in
Testbox laufen, sofern nicht ausdrücklich ein lokaler Nachweis durchgeführt wird.

## Legacy-Kompatibilität

Kompatibilitätsnachsicht ist eng gefasst und zeitlich begrenzt:

- Pakete bis einschließlich `2026.4.25`, einschließlich `2026.4.25-beta.*`, dürfen
  bereits ausgelieferte Lücken in Paketmetadaten in Package Acceptance tolerieren.
- Das veröffentlichte Paket `2026.4.26` darf bei bereits ausgelieferten lokalen Build-Metadaten-
  Stamp-Dateien warnen.
- Spätere Pakete müssen moderne Verträge erfüllen. Dieselben Lücken führen zum Fehlschlag, statt
  zu warnen oder zu überspringen.

Fügen Sie für diese alten Formen keine neuen Startmigrationen hinzu. Fügen Sie eine doctor-
Reparatur hinzu oder erweitern Sie sie und beweisen Sie sie dann mit `upgrade-survivor`, `published-upgrade-survivor` oder
`update-restart-auth`, wenn der Update-Befehl den Neustart besitzt.

## Abdeckung hinzufügen

Wenn Sie Update- oder Plugin-Verhalten ändern, fügen Sie Abdeckung auf der niedrigsten Ebene hinzu, die
aus dem richtigen Grund fehlschlagen kann:

- Reine Pfad- oder Metadatenlogik: Unit-Test neben der Quelle.
- Paketbestand oder Verhalten gepackter Dateien: `package-dist-inventory`- oder Tarball-
  Prüftest.
- CLI-Installations-/Updateverhalten: Docker-Lane-Assertion oder Fixture.
- Migrationsverhalten veröffentlichter Releases: `published-upgrade-survivor`-Szenario.
- Update-eigenes Neustartverhalten: `update-restart-auth`.
- Registry-/Paketquellenverhalten: `test:docker:plugins`-Fixture oder ClawHub-
  Fixture-Server.
- Abhängigkeitslayout oder Bereinigungsverhalten: Sowohl die Laufzeitausführung als auch die
  Dateisystemgrenze prüfen. npm-Abhängigkeiten können innerhalb des vom Plugin
  verwalteten npm-Projekts hoisted werden. Tests sollten daher nachweisen, dass dieses Projekt gescannt/bereinigt wird,
  anstatt anzunehmen, dass nur der paketlokale `node_modules`-Baum des Plugins verwendet wird.

Halten Sie neue Docker-Fixtures standardmäßig hermetisch. Verwenden Sie lokale Fixture-Registries und
Fake-Pakete, es sei denn, der Zweck des Tests ist Live-Registry-Verhalten.

## Fehlersuche

Beginnen Sie mit der Artefaktidentität:

- Package-Acceptance-`resolve_package`-Zusammenfassung: Quelle, Version, SHA-256 und
  Artefaktname.
- Docker-Artefakte: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, Lane-Logs und Befehle zum erneuten Ausführen.
- Upgrade-Survivor-Zusammenfassung: `.artifacts/upgrade-survivor/summary.json`,
  einschließlich Baseline-Version, Kandidatenversion, Szenario, Phasen-Timings und
  Rezeptschritte.

Führen Sie vorzugsweise die exakt fehlgeschlagene Lane mit demselben Paketartefakt erneut aus,
anstatt den gesamten Release-Umbrella erneut auszuführen.
