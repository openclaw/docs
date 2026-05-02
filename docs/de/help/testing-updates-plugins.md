---
read_when:
    - Ändern des Verhaltens von OpenClaw-Updates, doctor, Paketabnahme oder Plugin-Installation
    - Release Candidate vorbereiten oder freigeben
    - Debugging von Paketaktualisierungen, Bereinigung von Plugin-Abhängigkeiten oder Regressionen bei der Plugin-Installation
sidebarTitle: Update and plugin tests
summary: Wie OpenClaw Aktualisierungspfade, Paketmigrationen und das Installations-/Aktualisierungsverhalten von Plugins validiert
title: 'Testen: Updates und Plugins'
x-i18n:
    generated_at: "2026-05-02T20:48:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1a56e249f565cc23a439142b3332c0a57fd4afe9021b79f644d353946d6d2ffc
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Dies ist die dedizierte Checkliste für Update- und Plugin-Validierung. Das Ziel ist
einfach: nachweisen, dass das installierbare Paket echten Benutzerzustand aktualisieren,
veralteten Legacy-Zustand über `doctor` reparieren und Plugins aus den unterstützten
Quellen weiterhin installieren, laden, aktualisieren und deinstallieren kann.

Die breitere Übersicht zum Test-Runner finden Sie unter [Testing](/de/help/testing). Für Live-Provider-
Schlüssel und Suites mit Netzwerkzugriff siehe [Testing live](/de/help/testing-live).

## Was wir schützen

Update- und Plugin-Tests schützen diese Verträge:

- Ein Paket-Tarball ist vollständig, hat eine gültige `dist/postinstall-inventory.json`
  und hängt nicht von entpackten Repo-Dateien ab.
- Ein Benutzer kann von einem älteren veröffentlichten Paket zum Kandidatenpaket
  wechseln, ohne Konfiguration, Agenten, Sitzungen, Workspaces, Plugin-Allowlisten oder
  Kanal-Konfiguration zu verlieren.
- `openclaw doctor --fix --non-interactive` besitzt Legacy-Bereinigungs- und Reparaturpfade.
  Der Startvorgang sollte keine versteckten Kompatibilitätsmigrationen für veralteten
  Plugin-Zustand ansammeln.
- Plugin-Installationen funktionieren aus lokalen Verzeichnissen, Git-Repos, npm-Paketen und dem
  ClawHub-Registry-Pfad.
- Plugin-npm-Abhängigkeiten werden im verwalteten npm-Root installiert, vor dem Vertrauen
  gescannt und bei der Deinstallation über npm entfernt, damit gehobene Abhängigkeiten nicht
  zurückbleiben.
- Plugin-Updates sind stabil, wenn sich nichts geändert hat: Installationsdatensätze, aufgelöste
  Quelle, Layout der installierten Abhängigkeiten und aktivierter Zustand bleiben intakt.

## Lokaler Nachweis während der Entwicklung

Beginnen Sie eng fokussiert:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Für Änderungen an Plugin-Installation, Deinstallation, Abhängigkeiten oder Paket-Inventar führen Sie
auch die fokussierten Tests aus, die die bearbeitete Nahtstelle abdecken:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Bevor irgendeine Paket-Docker-Lane einen Tarball verwendet, weisen Sie das Paket-Artefakt nach:

```bash
pnpm release:check
```

`release:check` führt Drift-Prüfungen für Konfiguration/Dokumentation/API aus, schreibt das Paket-Dist-
Inventar, führt `npm pack --dry-run` aus, weist verbotene gepackte Dateien zurück, installiert
den Tarball in ein temporäres Präfix, führt postinstall aus und prüft gebündelte Kanal-
Einstiegspunkte per Smoke-Test.

## Docker-Lanes

Die Docker-Lanes sind der Nachweis auf Produktebene. Sie installieren oder aktualisieren ein echtes
Paket in Linux-Containern und prüfen das Verhalten über CLI-Befehle,
Gateway-Start, HTTP-Probes, RPC-Status und Dateisystemzustand.

Verwenden Sie beim Iterieren fokussierte Lanes:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-migration
```

Wichtige Lanes:

- `test:docker:plugins` validiert Plugin-Installations-Smoke, Installationen aus lokalen Ordnern,
  Überspringverhalten bei Updates lokaler Ordner, lokale Ordner mit vorinstallierten
  Abhängigkeiten, `file:`-Paketinstallationen, Git-Installationen mit CLI-Ausführung, Git-
  Updates beweglicher Refs, npm-Registry-Installationen mit gehobenen transitiven
  Abhängigkeiten, npm-Update-No-Ops, Installationen lokaler ClawHub-Fixtures und Update-
  No-Ops, Marketplace-Update-Verhalten sowie Aktivieren/Inspect des Claude-Bundles. Setzen Sie
  `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, um den ClawHub-Block hermetisch/offline zu halten.
- `test:docker:plugin-update` validiert, dass ein unverändertes installiertes Plugin während
  `openclaw plugins update` nicht neu installiert wird und keine Installationsmetadaten verliert.
- `test:docker:upgrade-survivor` installiert den Kandidaten-Tarball über eine schmutzige
  alte Benutzer-Fixture, führt Paket-Update plus nicht interaktiven doctor aus, startet dann
  ein loopback-Gateway und prüft die Zustandserhaltung.
- `test:docker:published-upgrade-survivor` installiert zuerst eine veröffentlichte Baseline,
  konfiguriert sie über ein eingebettetes `openclaw config set`-Rezept, aktualisiert sie auf den
  Kandidaten-Tarball, führt doctor aus, prüft Legacy-Bereinigung, startet den Gateway und
  prüft `/healthz`, `/readyz` und RPC-Status.
- `test:docker:update-migration` ist die bereinigungsintensive Published-Update-Lane. Sie
  startet mit einem konfigurierten Discord/Telegram-artigen Benutzerzustand, führt Baseline-
  doctor aus, damit konfigurierte Plugin-Abhängigkeiten die Chance haben zu entstehen, legt
  Legacy-Plugin-Abhängigkeitsreste für ein konfiguriertes paketiertes Plugin an, aktualisiert auf
  den Kandidaten-Tarball und verlangt, dass post-update doctor die Legacy-
  Abhängigkeits-Roots entfernt.

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
`plugin-deps-cleanup`, `configured-plugin-installs`, `tilde-log-path` und
`versioned-runtime-deps`. In aggregierten Läufen erweitert
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` auf alle gemeldeten
issue-förmigen Szenarien, einschließlich der Migration für konfigurierte Plugin-Installationen.

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
führt anschließend wiederverwendbare Docker-E2E-Lanes gegen genau diesen Tarball aus. Der Workflow-Harness-
Ref ist vom Paket-Quell-Ref getrennt, sodass aktuelle Testlogik ältere vertrauenswürdige Releases
validieren kann.

Kandidatenquellen:

- `source=npm`: `openclaw@beta`, `openclaw@latest` oder eine exakte
  veröffentlichte Version validieren.
- `source=ref`: einen vertrauenswürdigen Branch, Tag oder Commit mit dem ausgewählten aktuellen
  Harness packen.
- `source=url`: einen HTTPS-Tarball mit erforderlichem `package_sha256` validieren.
- `source=artifact`: einen von einem anderen Actions-Lauf hochgeladenen Tarball wiederverwenden.

Full Release Validation verwendet standardmäßig `source=artifact`, gebaut aus dem
aufgelösten Release-SHA. Für den Nachweis nach der Veröffentlichung übergeben Sie
`package_acceptance_package_spec=openclaw@YYYY.M.D`, damit dieselbe Upgrade-Matrix
stattdessen das ausgelieferte npm-Paket anvisiert.

Release-Prüfungen rufen Package Acceptance mit dem Paket-/Update-/Plugin-Set auf:

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update
```

Sie übergeben außerdem:

```text
published_upgrade_survivor_baselines=all-since-2026.4.23
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

So bleiben Paketmigration, Update-Kanal-Wechsel, Bereinigung veralteter Plugin-Abhängigkeiten,
Offline-Plugin-Abdeckung, Plugin-Update-Verhalten und Telegram-Paket-QA auf demselben
aufgelösten Artefakt.

`all-since-2026.4.23` ist das Full-Release-CI-Upgrade-Sample: jedes stabile npm-veröffentlichte Release von `2026.4.23` bis `latest`. Für vollständige
Abdeckung veröffentlichter Update-Migrationen verwenden Sie `all-since-2026.4.23` im separaten Update-
Migration-Workflow statt in Full Release CI. `release-history` bleibt
für manuelle breitere Stichproben verfügbar, wenn Sie auch den Legacy-Anker vor diesem Datum
einbeziehen möchten.

Führen Sie ein Paketprofil manuell aus, wenn Sie einen Kandidaten vor dem Release validieren:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=package \
  -f published_upgrade_survivor_baselines=all-since-2026.4.23 \
  -f published_upgrade_survivor_scenarios=reported-issues \
  -f telegram_mode=mock-openai
```

Verwenden Sie `suite_profile=product`, wenn die Release-Frage MCP-Kanäle,
Cron/Subagent-Bereinigung, OpenAI-Websuche oder OpenWebUI umfasst. Verwenden Sie `suite_profile=full`
nur, wenn Sie vollständige Docker-Abdeckung des Release-Pfads benötigen.

## Release-Standard

Für Release-Kandidaten ist der Standard-Nachweisstapel:

1. `pnpm check:changed` und `pnpm test:changed` für Regressionen auf Quellcodeebene.
2. `pnpm release:check` für Integrität des Paket-Artefakts.
3. Package Acceptance `package`-Profil oder die release-check-spezifischen Paket-
   Lanes für Installations-/Update-/Plugin-Verträge.
4. Cross-OS-Release-Prüfungen für OS-spezifisches Installer-, Onboarding- und Plattform-
   Verhalten.
5. Live-Suites nur, wenn die geänderte Oberfläche Provider- oder gehostetes-Service-
   Verhalten berührt.

Auf Maintainer-Maschinen sollten breite Gates und Docker-/Paket-Produktnachweise in
Testbox laufen, sofern nicht ausdrücklich lokaler Nachweis durchgeführt wird.

## Legacy-Kompatibilität

Kompatibilitätsnachsicht ist eng begrenzt und zeitlich befristet:

- Pakete bis `2026.4.25`, einschließlich `2026.4.25-beta.*`, dürfen
  bereits ausgelieferte Paketmetadaten-Lücken in Package Acceptance tolerieren.
- Das veröffentlichte Paket `2026.4.26` darf für bereits ausgelieferte lokale Build-Metadaten-
  Stempeldateien warnen.
- Spätere Pakete müssen moderne Verträge erfüllen. Dieselben Lücken schlagen fehl, statt
  zu warnen oder zu überspringen.

Fügen Sie keine neuen Startmigrationen für diese alten Formen hinzu. Fügen Sie eine doctor-
Reparatur hinzu oder erweitern Sie sie und weisen Sie sie dann mit `upgrade-survivor` oder
`published-upgrade-survivor` nach.

## Abdeckung hinzufügen

Wenn Sie Update- oder Plugin-Verhalten ändern, fügen Sie Abdeckung auf der niedrigsten Ebene hinzu, die
aus dem richtigen Grund fehlschlagen kann:

- Reine Pfad- oder Metadatenlogik: Unit-Test neben der Quelle.
- Paket-Inventar- oder gepackte-Dateien-Verhalten: `package-dist-inventory`- oder Tarball-
  Checker-Test.
- CLI-Installations-/Update-Verhalten: Docker-Lane-Assertion oder Fixture.
- Migrationsverhalten veröffentlichter Releases: `published-upgrade-survivor`-Szenario.
- Registry-/Paketquellen-Verhalten: `test:docker:plugins`-Fixture oder ClawHub-
  Fixture-Server.
- Abhängigkeitslayout- oder Bereinigungsverhalten: sowohl Laufzeitausführung als auch die
  Dateisystemgrenze prüfen. npm-Abhängigkeiten können unter dem verwalteten npm-
  Root gehoben werden, daher sollten Tests nachweisen, dass der Root gescannt/bereinigt wird, statt einen
  paketlokalen `node_modules`-Baum anzunehmen.

Halten Sie neue Docker-Fixtures standardmäßig hermetisch. Verwenden Sie lokale Fixture-Registries und
Fake-Pakete, es sei denn, der Zweck des Tests ist Live-Registry-Verhalten.

## Fehlertriage

Beginnen Sie mit der Artefaktidentität:

- Package-Acceptance-`resolve_package`-Zusammenfassung: Quelle, Version, SHA-256 und
  Artefaktname.
- Docker-Artefakte: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, Lane-Logs und Befehle zum erneuten Ausführen.
- Upgrade-Survivor-Zusammenfassung: `.artifacts/upgrade-survivor/summary.json`,
  einschließlich Baseline-Version, Kandidatenversion, Szenario, Phasen-Timings und
  Rezeptschritten.

Bevorzugen Sie das erneute Ausführen der exakt fehlgeschlagenen Lane mit demselben Paket-Artefakt gegenüber
dem erneuten Ausführen des gesamten Release-Umbrellas.
