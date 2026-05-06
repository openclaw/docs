---
read_when:
    - OpenClaw-Aktualisierungs-, doctor-, Paketabnahme- oder Plugin-Installationsverhalten ändern
    - Release Candidate vorbereiten oder genehmigen
    - Debugging von Paketaktualisierungen, Bereinigung von Plugin-Abhängigkeiten oder Regressionen bei der Plugin-Installation
sidebarTitle: Update and plugin tests
summary: Wie OpenClaw Aktualisierungspfade, Paketmigrationen und das Installations-/Aktualisierungsverhalten von Plugins validiert
title: 'Tests: Updates und Plugins'
x-i18n:
    generated_at: "2026-05-06T06:51:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: db3790bb8c6b952458342727f3e326f9610b4d8155889dfdadb143e3ef07aa46
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Dies ist die dedizierte Checkliste für Update- und Plugin-Validierung. Das Ziel ist
einfach: Nachweisen, dass das installierbare Paket echten Benutzerzustand aktualisieren,
veralteten Legacy-Zustand über `doctor` reparieren und weiterhin Plugins aus den
unterstützten Quellen installieren, laden, aktualisieren und deinstallieren kann.

Die breitere Übersicht der Test-Runner finden Sie unter [Testen](/de/help/testing). Für Live-Provider-
Schlüssel und Suites mit Netzwerkzugriff siehe [Live testen](/de/help/testing-live).

## Was wir schützen

Update- und Plugin-Tests schützen diese Verträge:

- Ein Paket-Tarball ist vollständig, hat eine gültige `dist/postinstall-inventory.json`
  und hängt nicht von entpackten Repo-Dateien ab.
- Ein Benutzer kann von einem älteren veröffentlichten Paket zum Kandidatenpaket
  wechseln, ohne Konfiguration, Agenten, Sitzungen, Workspaces, Plugin-Allowlists oder
  Channel-Konfiguration zu verlieren.
- `openclaw doctor --fix --non-interactive` besitzt Legacy-Bereinigungs- und Reparaturpfade.
  Der Startvorgang sollte keine versteckten Kompatibilitätsmigrationen für veralteten
  Plugin-Zustand aufbauen.
- Plugin-Installationen funktionieren aus lokalen Verzeichnissen, Git-Repos, npm-Paketen und dem
  ClawHub-Registrypfad.
- Plugin-npm-Abhängigkeiten werden im verwalteten npm-Root installiert, vor
  Vertrauen gescannt und bei der Deinstallation über npm entfernt, damit gehobene
  Abhängigkeiten nicht zurückbleiben.
- Plugin-Update bleibt stabil, wenn sich nichts geändert hat: Installationsdatensätze, aufgelöste
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

Bevor eine Paket-Docker-Lane einen Tarball verwendet, weisen Sie das Paket-Artefakt nach:

```bash
pnpm release:check
```

`release:check` führt Drift-Prüfungen für Konfiguration/Dokumentation/API aus, schreibt das Paket-Dist-
Inventar, führt `npm pack --dry-run` aus, weist verbotene gepackte Dateien zurück, installiert
den Tarball in ein temporäres Präfix, führt postinstall aus und testet gebündelte Channel-
Einstiegspunkte per Smoke-Test.

## Docker-Lanes

Die Docker-Lanes sind der Nachweis auf Produktebene. Sie installieren oder aktualisieren ein echtes
Paket in Linux-Containern und prüfen Verhalten über CLI-Befehle,
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

- `test:docker:plugins` validiert Plugin-Installations-Smoke-Tests, Installationen lokaler Ordner,
  Skip-Verhalten bei Updates lokaler Ordner, lokale Ordner mit vorinstallierten
  Abhängigkeiten, `file:`-Paketinstallationen, Git-Installationen mit CLI-Ausführung, Git-
  Updates für bewegliche Referenzen, npm-Registry-Installationen mit gehobenen transitiven
  Abhängigkeiten, npm-Update-No-Ops, lokale ClawHub-Fixture-Installationen und Update-
  No-Ops, Marketplace-Update-Verhalten sowie Aktivieren/Prüfen des Claude-Bundles. Setzen Sie
  `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, um den ClawHub-Block hermetisch/offline zu halten.
- `test:docker:plugin-lifecycle-matrix` installiert das Kandidatenpaket in einem leeren
  Container, führt ein npm-Plugin durch Installation, Prüfung, Deaktivierung, Aktivierung,
  explizites Upgrade, explizites Downgrade und Deinstallation nach dem Löschen des Plugin-
  Codes. Es protokolliert RSS- und CPU-Metriken für jede Phase.
- `test:docker:plugin-update` validiert, dass ein unverändertes installiertes Plugin
  während `openclaw plugins update` nicht neu installiert wird und keine Installationsmetadaten verliert.
- `test:docker:upgrade-survivor` installiert den Kandidaten-Tarball über eine verschmutzte
  alte Benutzer-Fixture, führt Paket-Update plus nicht interaktiven doctor aus, startet dann
  ein local loopback-Gateway und prüft die Zustandserhaltung.
- `test:docker:published-upgrade-survivor` installiert zuerst eine veröffentlichte Baseline,
  konfiguriert sie über ein eingebettetes `openclaw config set`-Rezept, aktualisiert sie auf den
  Kandidaten-Tarball, führt doctor aus, prüft Legacy-Bereinigung, startet den Gateway und
  prüft `/healthz`, `/readyz` und RPC-Status.
- `test:docker:update-restart-auth` installiert das Kandidatenpaket, startet einen
  verwalteten Token-Auth-Gateway, entfernt Gateway-Auth-Umgebungsvariablen des Aufrufers für
  `openclaw update --yes --json` und verlangt, dass der Update-Befehl des Kandidaten den
  Gateway vor den normalen Probes neu startet.
- `test:docker:update-migration` ist die bereinigungsintensive Published-Update-Lane. Sie
  startet von einem konfigurierten Benutzerzustand im Discord/Telegram-Stil, führt Baseline-
  doctor aus, damit konfigurierte Plugin-Abhängigkeiten eine Chance haben, materialisiert zu werden, sät
  Legacy-Plugin-Abhängigkeitsreste für ein konfiguriertes gepacktes Plugin, aktualisiert auf
  den Kandidaten-Tarball und verlangt, dass post-update doctor die Legacy-
  Abhängigkeits-Roots entfernt.

Nützliche Varianten von Published-Upgrade Survivor:

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
issue-förmigen Szenarien erweitert, einschließlich der Migration für konfigurierte Plugin-Installationen.

Die vollständige Update-Migration ist absichtlich von Full Release CI getrennt. Verwenden Sie den
manuellen `Update Migration`-Workflow, wenn die Release-Frage lautet: „Kann jede
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

## Package Acceptance

Package Acceptance ist das GitHub-native Paket-Gate. Es löst ein Kandidatenpaket
in einen `package-under-test`-Tarball auf, zeichnet Version und SHA-256 auf und
führt dann wiederverwendbare Docker-E2E-Lanes gegen genau diesen Tarball aus. Der Workflow-Harness-
Ref ist vom Paketquellen-Ref getrennt, sodass aktuelle Testlogik ältere vertrauenswürdige
Releases validieren kann.

Kandidatenquellen:

- `source=npm`: validiert `openclaw@beta`, `openclaw@latest` oder eine exakt
  veröffentlichte Version.
- `source=ref`: packt einen vertrauenswürdigen Branch, Tag oder Commit mit dem ausgewählten aktuellen
  Harness.
- `source=url`: validiert einen HTTPS-Tarball mit erforderlichem `package_sha256`.
- `source=artifact`: verwendet einen Tarball wieder, der von einem anderen Actions-Lauf hochgeladen wurde.

Full Release Validation verwendet standardmäßig `source=artifact`, erstellt aus dem
aufgelösten Release-SHA. Für Nachweise nach der Veröffentlichung übergeben Sie
`package_acceptance_package_spec=openclaw@YYYY.M.D`, damit dieselbe Upgrade-Matrix
stattdessen das ausgelieferte npm-Paket adressiert.

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

Dadurch bleiben Paketmigration, Update-Channel-Umschaltung, Toleranz gegenüber beschädigten verwalteten Plugins,
Bereinigung veralteter Plugin-Abhängigkeiten, Offline-Plugin-Abdeckung, Plugin-
Update-Verhalten und Telegram-Paket-QA auf demselben aufgelösten Artefakt, ohne
das Standard-Release-Paket-Gate über jede veröffentlichte Version laufen zu lassen.

`last-stable-4` wird zu den vier neuesten stabilen, auf npm veröffentlichten OpenClaw-
Releases aufgelöst. Release-Package-Acceptance pinnt `2026.4.23` als erste Plugin-Update-
Kompatibilitätsgrenze, `2026.5.2` als Grenze für Plugin-Architektur-Umbrüche und
`2026.4.15` als ältere 2026.4.1x-Published-Update-Baseline; der Resolver
dedupliziert Pins, die bereits in den neuesten vier enthalten sind. Für vollständige Abdeckung der Published-
Update-Migration verwenden Sie `all-since-2026.4.23` im separaten Update-
Migration-Workflow statt Full Release CI. `release-history` bleibt
für manuelles breiteres Sampling verfügbar, wenn Sie auch den älteren Stichtags-
Anker wünschen.

Wenn mehrere Published-Upgrade-Survivor-Baselines ausgewählt sind, shardet der wiederverwendbare
Docker-Workflow jede Baseline in einen eigenen zielgerichteten Runner-Job. Jeder
Baseline-Shard führt weiterhin das ausgewählte Szenario-Set aus, aber Logs und Artefakte bleiben
pro Baseline getrennt, und die Laufzeit wird durch den langsamsten Shard statt durch einen großen
seriellen Job begrenzt.

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
Cron-/Subagent-Bereinigung, OpenAI-Websuche oder OpenWebUI einschließt. Verwenden Sie `suite_profile=full`
nur, wenn Sie vollständige Docker-Abdeckung des Release-Pfads benötigen.

## Release-Standard

Für Release-Kandidaten ist der Standard-Nachweisstapel:

1. `pnpm check:changed` und `pnpm test:changed` für Regressionen auf Quellebene.
2. `pnpm release:check` für Integrität des Paket-Artefakts.
3. Package Acceptance-Profil `package` oder die benutzerdefinierten Paket-
   Lanes der Release-Prüfung für Installations-/Update-/Restart-/Plugin-Verträge.
4. Cross-OS-Release-Prüfungen für OS-spezifische Installer-, Onboarding- und Plattform-
   Verhalten.
5. Live-Suites nur, wenn die geänderte Oberfläche Provider- oder Hosted-Service-
   Verhalten berührt.

Auf Maintainer-Rechnern sollten breite Gates und Docker-/Paket-Produktnachweise
in Testbox laufen, sofern nicht ausdrücklich lokaler Nachweis durchgeführt wird.

## Legacy-Kompatibilität

Kompatibilitätsnachsicht ist eng gefasst und zeitlich begrenzt:

- Pakete bis `2026.4.25`, einschließlich `2026.4.25-beta.*`, dürfen
  bereits ausgelieferte Lücken in Paketmetadaten in Package Acceptance tolerieren.
- Das veröffentlichte Paket `2026.4.26` darf für bereits ausgelieferte lokale Build-Metadaten-
  Stamp-Dateien warnen.
- Spätere Pakete müssen moderne Verträge erfüllen. Dieselben Lücken schlagen fehl, statt
  zu warnen oder übersprungen zu werden.

Fügen Sie keine neuen Startmigrationen für diese alten Formen hinzu. Fügen Sie eine doctor-
Reparatur hinzu oder erweitern Sie sie und weisen Sie sie dann mit `upgrade-survivor`, `published-upgrade-survivor` oder
`update-restart-auth` nach, wenn der Update-Befehl den Restart besitzt.

## Abdeckung hinzufügen

Wenn Sie Update- oder Plugin-Verhalten ändern, fügen Sie Abdeckung auf der niedrigsten Ebene hinzu, die
aus dem richtigen Grund fehlschlagen kann:

- Reine Pfad- oder Metadatenlogik: Unit-Test neben der Quelle.
- Paket-Inventar- oder Packed-File-Verhalten: `package-dist-inventory`- oder Tarball-
  Checker-Test.
- CLI-Installations-/Update-Verhalten: Docker-Lane-Assertion oder Fixture.
- Published-Release-Migrationsverhalten: `published-upgrade-survivor`-Szenario.
- Update-eigenes Restart-Verhalten: `update-restart-auth`.
- Registry-/Paketquellenverhalten: `test:docker:plugins`-Fixture oder ClawHub-
  Fixture-Server.
- Abhängigkeitslayout oder Bereinigungsverhalten: sowohl Laufzeitausführung als auch die
  Dateisystemgrenze prüfen. npm-Abhängigkeiten können unter dem verwalteten npm-
  Root gehoben werden, daher sollten Tests nachweisen, dass der Root gescannt/bereinigt wird, statt einen
  paketlokalen `node_modules`-Baum anzunehmen.

Halten Sie neue Docker-Fixtures standardmäßig hermetisch. Verwenden Sie lokale Fixture-Registries und
Fake-Pakete, sofern nicht Live-Registry-Verhalten der Zweck des Tests ist.

## Fehler-Triage

Beginnen Sie mit der Artefaktidentität:

- Zusammenfassung der Paketakzeptanz `resolve_package`: Quelle, Version, SHA-256 und
  Artefaktname.
- Docker-Artefakte: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, Testspur-Protokolle und Befehle zur erneuten Ausführung.
- Zusammenfassung der Upgrade-Bestandsprüfung: `.artifacts/upgrade-survivor/summary.json`,
  einschließlich Basisversion, Kandidatenversion, Szenario, Phasenlaufzeiten und
  Rezeptschritten.

Führen Sie bevorzugt die genau fehlgeschlagene Testspur mit demselben Paketartefakt
erneut aus, statt den gesamten Release-Gesamtablauf erneut auszuführen.
