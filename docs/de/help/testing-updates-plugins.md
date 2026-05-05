---
read_when:
    - OpenClaw-Verhalten für Updates, doctor, Paketabnahme oder Plugin-Installationen ändern
    - Release Candidate vorbereiten oder genehmigen
    - Debugging von Regressionen bei Paketaktualisierungen, der Bereinigung von Plugin-Abhängigkeiten oder der Plugin-Installation
sidebarTitle: Update and plugin tests
summary: Wie OpenClaw Aktualisierungspfade, Paketmigrationen und das Plugin-Installations-/Aktualisierungsverhalten validiert
title: 'Tests: Updates und Plugins'
x-i18n:
    generated_at: "2026-05-05T01:47:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: e83a847c76f424199b5fccbd9a2b30d0bf01e4f466c4f9822bf7693d1c2ad286
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Dies ist die dedizierte Checkliste für Update- und Plugin-Validierung. Das Ziel ist
einfach: nachweisen, dass das installierbare Paket realen Benutzerzustand aktualisieren,
veralteten Legacy-Zustand über `doctor` reparieren und weiterhin Plugins aus den
unterstützten Quellen installieren, laden, aktualisieren und deinstallieren kann.

Für die breitere Test-Runner-Übersicht siehe [Testen](/de/help/testing). Für Live-Provider-
Schlüssel und Suites mit Netzwerkzugriff siehe [Live testen](/de/help/testing-live).

## Was wir schützen

Update- und Plugin-Tests schützen diese Verträge:

- Ein Paket-Tarball ist vollständig, hat eine gültige `dist/postinstall-inventory.json`
  und hängt nicht von entpackten Repo-Dateien ab.
- Ein Benutzer kann von einem älteren veröffentlichten Paket zum Kandidatenpaket
  wechseln, ohne Konfiguration, Agents, Sitzungen, Arbeitsbereiche, Plugin-Allowlists oder
  Kanalkonfiguration zu verlieren.
- `openclaw doctor --fix --non-interactive` besitzt Legacy-Bereinigungs- und Reparaturpfade.
  Beim Start sollten keine versteckten Kompatibilitätsmigrationen für veralteten
  Plugin-Zustand entstehen.
- Plugin-Installationen funktionieren aus lokalen Verzeichnissen, Git-Repos, npm-Paketen und dem
  ClawHub-Registrierungspfad.
- Plugin-npm-Abhängigkeiten werden im verwalteten npm-Root installiert, vor
  Vertrauen gescannt und bei der Deinstallation über npm entfernt, damit hoisted
  Abhängigkeiten nicht zurückbleiben.
- Plugin-Update ist stabil, wenn sich nichts geändert hat: Installationsdatensätze, aufgelöste
  Quelle, Layout der installierten Abhängigkeiten und aktivierter Zustand bleiben intakt.

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
den Tarball in ein temporäres Präfix, führt postinstall aus und smoke-testet gebündelte Kanal-
Einstiegspunkte.

## Docker-Lanes

Die Docker-Lanes sind der Nachweis auf Produktebene. Sie installieren oder aktualisieren ein echtes
Paket in Linux-Containern und prüfen das Verhalten über CLI-Befehle,
Gateway-Start, HTTP-Probes, RPC-Status und Dateisystemzustand.

Verwenden Sie beim Iterieren fokussierte Lanes:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-migration
```

Wichtige Lanes:

- `test:docker:plugins` validiert Plugin-Installations-Smoke, Installationen aus lokalen Ordnern,
  das Überspringverhalten bei Updates lokaler Ordner, lokale Ordner mit vorinstallierten
  Abhängigkeiten, `file:`-Paketinstallationen, Git-Installationen mit CLI-Ausführung, Git-
  Moving-Ref-Updates, npm-Registrierungsinstallationen mit hoisted transitiven
  Abhängigkeiten, npm-Update-No-Ops, lokale ClawHub-Fixture-Installationen und Update-
  No-Ops, Marketplace-Update-Verhalten sowie Claude-Bundle-Aktivieren/Inspect. Setzen Sie
  `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, um den ClawHub-Block hermetisch/offline zu halten.
- `test:docker:plugin-lifecycle-matrix` installiert das Kandidatenpaket in einem leeren
  Container, führt ein npm-Plugin durch Installation, Inspect, Deaktivieren, Aktivieren,
  explizites Upgrade, explizites Downgrade und Deinstallation nach Löschen des Plugin-
  Codes. Es protokolliert RSS- und CPU-Metriken für jede Phase.
- `test:docker:plugin-update` validiert, dass ein unverändertes installiertes Plugin während
  `openclaw plugins update` nicht neu installiert wird und keine Installationsmetadaten verliert.
- `test:docker:upgrade-survivor` installiert den Kandidaten-Tarball über eine verschmutzte
  Altbenutzer-Fixture, führt Paket-Update plus nicht-interaktiven doctor aus, startet dann
  ein Loopback-Gateway und prüft die Zustandserhaltung.
- `test:docker:published-upgrade-survivor` installiert zuerst eine veröffentlichte Baseline,
  konfiguriert sie über ein eingebettetes `openclaw config set`-Rezept, aktualisiert sie auf den
  Kandidaten-Tarball, führt doctor aus, prüft Legacy-Bereinigung, startet den Gateway und
  probt `/healthz`, `/readyz` und den RPC-Status.
- `test:docker:update-migration` ist die bereinigungsintensive Lane für veröffentlichte Updates. Sie
  startet mit einem konfigurierten Discord/Telegram-artigen Benutzerzustand, führt Baseline-
  doctor aus, damit konfigurierte Plugin-Abhängigkeiten materialisiert werden können, erzeugt
  Legacy-Plugin-Abhängigkeitsreste für ein konfiguriertes paketiertes Plugin, aktualisiert auf
  den Kandidaten-Tarball und verlangt, dass post-update doctor die Legacy-
  Abhängigkeits-Roots entfernt.

Nützliche Varianten für published-upgrade survivor:

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
issue-artigen Szenarien erweitert, einschließlich der konfigurierten Plugin-Installationsmigration.

Die vollständige Update-Migration ist absichtlich von Full Release CI getrennt. Verwenden Sie den
manuellen `Update Migration`-Workflow, wenn die Release-Frage lautet: „Kann jedes
veröffentlichte stabile Release ab 2026.4.23 auf diesen Kandidaten aktualisiert werden und
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
führt anschließend wiederverwendbare Docker-E2E-Lanes gegen genau diesen Tarball aus. Die Workflow-Harness-
Ref ist von der Paketquellen-Ref getrennt, sodass aktuelle Testlogik ältere
vertrauenswürdige Releases validieren kann.

Kandidatenquellen:

- `source=npm`: validiert `openclaw@beta`, `openclaw@latest` oder eine exakte
  veröffentlichte Version.
- `source=ref`: packt einen vertrauenswürdigen Branch, Tag oder Commit mit dem ausgewählten aktuellen
  Harness.
- `source=url`: validiert einen HTTPS-Tarball mit erforderlichem `package_sha256`.
- `source=artifact`: verwendet einen von einem anderen Actions-Lauf hochgeladenen Tarball erneut.

Full Release Validation verwendet standardmäßig `source=artifact`, gebaut aus dem
aufgelösten Release-SHA. Für den Nachweis nach der Veröffentlichung übergeben Sie
`package_acceptance_package_spec=openclaw@YYYY.M.D`, damit dieselbe Upgrade-Matrix
stattdessen auf das ausgelieferte npm-Paket zielt.

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

Dadurch bleiben Paketmigration, Update-Channel-Wechsel, Bereinigung veralteter Plugin-Abhängigkeiten,
Offline-Plugin-Abdeckung, Plugin-Update-Verhalten und Telegram-Paket-
QA auf demselben aufgelösten Artefakt.

`all-since-2026.4.23` ist die Upgrade-Stichprobe von Full Release CI: jedes stabile, auf npm veröffentlichte Release von `2026.4.23` bis `latest`. Für exhaustive Abdeckung veröffentlichter
Update-Migrationen verwenden Sie `all-since-2026.4.23` im separaten Update-
Migration-Workflow statt in Full Release CI. `release-history` bleibt
für manuelle breitere Stichproben verfügbar, wenn Sie auch den älteren
Vor-Datums-Anker möchten.

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

Für Release-Kandidaten ist der standardmäßige Nachweis-Stack:

1. `pnpm check:changed` und `pnpm test:changed` für Regressionen auf Quellcodeebene.
2. `pnpm release:check` für die Integrität des Paket-Artefakts.
3. Package Acceptance-`package`-Profil oder die benutzerdefinierten Paket-
   Lanes der Release-Prüfung für Installations-/Update-/Plugin-Verträge.
4. Plattformübergreifende Release-Prüfungen für OS-spezifisches Installationsprogramm, Onboarding und Plattform-
   Verhalten.
5. Live-Suites nur, wenn die geänderte Oberfläche Provider- oder gehostetes Service-
   Verhalten berührt.

Auf Maintainer-Maschinen sollten breite Gates und Docker-/Paket-Produktnachweise in
Testbox laufen, sofern nicht ausdrücklich lokaler Nachweis durchgeführt wird.

## Legacy-Kompatibilität

Kompatibilitätsnachsicht ist eng gefasst und zeitlich begrenzt:

- Pakete bis einschließlich `2026.4.25`, einschließlich `2026.4.25-beta.*`, dürfen
  bereits ausgelieferte Paketmetadaten-Lücken in Package Acceptance tolerieren.
- Das veröffentlichte Paket `2026.4.26` darf für bereits ausgelieferte lokale Build-Metadatenstempel-
  Dateien warnen.
- Spätere Pakete müssen moderne Verträge erfüllen. Dieselben Lücken schlagen fehl, statt
  zu warnen oder zu überspringen.

Fügen Sie für diese alten Formen keine neuen Startmigrationen hinzu. Fügen Sie eine doctor-
Reparatur hinzu oder erweitern Sie sie und weisen Sie sie dann mit `upgrade-survivor` oder `published-upgrade-survivor` nach.

## Abdeckung hinzufügen

Wenn Sie Update- oder Plugin-Verhalten ändern, fügen Sie Abdeckung auf der niedrigsten Ebene hinzu, die
aus dem richtigen Grund fehlschlagen kann:

- Reine Pfad- oder Metadatenlogik: Unit-Test neben der Quelle.
- Paket-Inventar oder Verhalten gepackter Dateien: `package-dist-inventory` oder Tarball-
  Checker-Test.
- CLI-Installations-/Update-Verhalten: Docker-Lane-Assertion oder Fixture.
- Migrationsverhalten veröffentlichter Releases: `published-upgrade-survivor`-Szenario.
- Registrierungs-/Paketquellenverhalten: `test:docker:plugins`-Fixture oder ClawHub-
  Fixture-Server.
- Verhalten von Abhängigkeitslayout oder Bereinigung: prüfen Sie sowohl Runtime-Ausführung als auch die
  Dateisystemgrenze. npm-Abhängigkeiten können unter dem verwalteten npm-
  Root gehoistet werden, daher sollten Tests nachweisen, dass der Root gescannt/bereinigt wird, statt von einem
  paketlokalen `node_modules`-Baum auszugehen.

Halten Sie neue Docker-Fixtures standardmäßig hermetisch. Verwenden Sie lokale Fixture-Registries und
Fake-Pakete, sofern nicht Live-Registrierungsverhalten der Zweck des Tests ist.

## Fehlertriage

Beginnen Sie mit der Artefaktidentität:

- Package Acceptance-`resolve_package`-Zusammenfassung: Quelle, Version, SHA-256 und
  Artefaktname.
- Docker-Artefakte: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, Lane-Logs und Rerun-Befehle.
- Upgrade-Survivor-Zusammenfassung: `.artifacts/upgrade-survivor/summary.json`,
  einschließlich Baseline-Version, Kandidatenversion, Szenario, Phasen-Timings und
  Rezeptschritten.

Ziehen Sie es vor, die exakt fehlgeschlagene Lane mit demselben Paket-Artefakt erneut auszuführen, statt
den gesamten Release-Umbrella erneut auszuführen.
