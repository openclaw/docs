---
read_when:
    - OpenClaw-Update-, Diagnose-, Paketakzeptanz- oder Plugin-Installationsverhalten ändern
    - Einen Release Candidate vorbereiten oder freigeben
    - Fehlerbehebung bei Paketaktualisierungs-, Plugin-Abhängigkeitsbereinigungs- oder Plugin-Installationsregressionen
sidebarTitle: Update and plugin tests
summary: Wie OpenClaw Update-Pfade, Paketmigrationen und das Installations-/Update-Verhalten von Plugins validiert
title: 'Testen: Updates und Plugins'
x-i18n:
    generated_at: "2026-05-03T21:34:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 309ac7785a8d49db241989d28580887d3f6739982108af7148b624082c5f23dd
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Dies ist die dedizierte Checkliste für Update- und Plugin-Validierung. Das Ziel ist
einfach: nachweisen, dass das installierbare Paket echten Benutzerzustand aktualisieren,
veralteten Legacy-Zustand über `doctor` reparieren und Plugins aus den unterstützten
Quellen weiterhin installieren, laden, aktualisieren und deinstallieren kann.

Für die breitere Übersicht der Test-Runner siehe [Testen](/de/help/testing). Für Live-Provider-
Schlüssel und Suites mit Netzwerkzugriff siehe [Live testen](/de/help/testing-live).

## Was wir schützen

Update- und Plugin-Tests schützen diese Verträge:

- Ein Paket-Tarball ist vollständig, enthält eine gültige `dist/postinstall-inventory.json`
  und hängt nicht von entpackten Repository-Dateien ab.
- Ein Benutzer kann von einem älteren veröffentlichten Paket zum Kandidatenpaket wechseln,
  ohne Konfiguration, Agents, Sitzungen, Workspaces, Plugin-Allowlists oder
  Kanalkonfiguration zu verlieren.
- `openclaw doctor --fix --non-interactive` besitzt Legacy-Bereinigungs- und Reparaturpfade.
  Der Startvorgang sollte keine versteckten Kompatibilitätsmigrationen für veralteten
  Plugin-Zustand bekommen.
- Plugin-Installationen funktionieren aus lokalen Verzeichnissen, Git-Repositories,
  npm-Paketen und dem ClawHub-Registrypfad.
- npm-Abhängigkeiten von Plugins werden im verwalteten npm-Root installiert, vor dem
  Vertrauen gescannt und bei der Deinstallation über npm entfernt, damit hochgezogene
  Abhängigkeiten nicht zurückbleiben.
- Plugin-Updates sind stabil, wenn sich nichts geändert hat: Installationsdatensätze,
  aufgelöste Quelle, Layout installierter Abhängigkeiten und aktivierter Zustand bleiben
  intakt.

## Lokaler Nachweis während der Entwicklung

Beginnen Sie eng fokussiert:

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

Führen Sie bei Änderungen an Plugin-Installation, Deinstallation, Abhängigkeiten oder
Paketinventar außerdem die fokussierten Tests aus, die die bearbeitete Schnittstelle
abdecken:

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

Bevor eine Paket-Docker-Lane einen Tarball verwendet, weisen Sie das Paketartefakt nach:

```bash
pnpm release:check
```

`release:check` führt Prüfungen auf Konfigurations-/Dokumentations-/API-Drift aus,
schreibt das Paket-Dist-Inventar, führt `npm pack --dry-run` aus, weist unzulässige
gepackte Dateien zurück, installiert den Tarball in ein temporäres Präfix, führt
postinstall aus und smoke-testet gebündelte Kanal-Einstiegspunkte.

## Docker-Lanes

Die Docker-Lanes sind der Nachweis auf Produktebene. Sie installieren oder aktualisieren
ein echtes Paket innerhalb von Linux-Containern und prüfen das Verhalten über CLI-Befehle,
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

- `test:docker:plugins` validiert den Smoke-Test für Plugin-Installation, Installationen
  aus lokalen Ordnern, Überspringverhalten bei Updates lokaler Ordner, lokale Ordner mit
  vorinstallierten Abhängigkeiten, `file:`-Paketinstallationen, Git-Installationen mit
  CLI-Ausführung, Updates von beweglichen Git-Refs, npm-Registry-Installationen mit
  hochgezogenen transitiven Abhängigkeiten, npm-Update-No-Ops, lokale ClawHub-Fixture-
  Installationen und Update-No-Ops, Marketplace-Update-Verhalten sowie Aktivieren/Prüfen
  des Claude-Bundles. Setzen Sie `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, um den ClawHub-Block
  hermetisch/offline zu halten.
- `test:docker:plugin-lifecycle-matrix` installiert das Kandidatenpaket in einem leeren
  Container, führt ein npm-Plugin durch Installation, Prüfung, Deaktivierung, Aktivierung,
  explizites Upgrade, explizites Downgrade und Deinstallation nach dem Löschen des
  Plugin-Codes. Für jede Phase werden RSS- und CPU-Metriken protokolliert.
- `test:docker:plugin-update` validiert, dass ein unverändertes installiertes Plugin
  während `openclaw plugins update` nicht neu installiert wird und keine
  Installationsmetadaten verliert.
- `test:docker:upgrade-survivor` installiert den Kandidaten-Tarball über eine verschmutzte
  alte Benutzer-Fixture, führt Paketupdate plus nicht interaktiven doctor aus, startet
  anschließend ein local loopback Gateway und prüft die Zustandserhaltung.
- `test:docker:published-upgrade-survivor` installiert zuerst eine veröffentlichte
  Basisversion, konfiguriert sie über ein eingebettetes `openclaw config set`-Rezept,
  aktualisiert sie auf den Kandidaten-Tarball, führt doctor aus, prüft die
  Legacy-Bereinigung, startet das Gateway und probt `/healthz`, `/readyz` und den
  RPC-Status.
- `test:docker:update-migration` ist die bereinigungsintensive Lane für veröffentlichte
  Updates. Sie startet mit einem konfigurierten Benutzerzustand im Discord/Telegram-Stil,
  führt den Basis-doctor aus, damit konfigurierte Plugin-Abhängigkeiten materialisiert
  werden können, legt Legacy-Plugin-Abhängigkeitsreste für ein konfiguriertes paketiertes
  Plugin an, aktualisiert auf den Kandidaten-Tarball und verlangt, dass post-update doctor
  die Legacy-Abhängigkeitsroots entfernt.

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
`plugin-deps-cleanup`, `configured-plugin-installs`, `tilde-log-path` und
`versioned-runtime-deps`. In aggregierten Läufen wird
`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` auf alle gemeldeten,
issue-förmigen Szenarien erweitert, einschließlich der Migration installierter
konfigurierter Plugins.

Die vollständige Update-Migration ist absichtlich von Full Release CI getrennt. Verwenden
Sie den manuellen Workflow `Update Migration`, wenn die Release-Frage lautet: „Kann jede
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

Package Acceptance ist das GitHub-native Paket-Gate. Es löst ein Kandidatenpaket in einen
`package-under-test`-Tarball auf, zeichnet Version und SHA-256 auf und führt anschließend
wiederverwendbare Docker-E2E-Lanes gegen genau diesen Tarball aus. Der Workflow-Harness-Ref
ist vom Paketquellen-Ref getrennt, sodass aktuelle Testlogik ältere vertrauenswürdige
Releases validieren kann.

Kandidatenquellen:

- `source=npm`: `openclaw@beta`, `openclaw@latest` oder eine exakte veröffentlichte
  Version validieren.
- `source=ref`: einen vertrauenswürdigen Branch, Tag oder Commit mit dem ausgewählten
  aktuellen Harness packen.
- `source=url`: einen HTTPS-Tarball mit erforderlichem `package_sha256` validieren.
- `source=artifact`: einen von einem anderen Actions-Lauf hochgeladenen Tarball
  wiederverwenden.

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

Dadurch bleiben Paketmigration, Update-Channel-Umschaltung, Bereinigung veralteter
Plugin-Abhängigkeiten, Offline-Plugin-Abdeckung, Plugin-Update-Verhalten und Telegram-
Paket-QA auf demselben aufgelösten Artefakt.

`all-since-2026.4.23` ist die Full Release CI-Upgrade-Stichprobe: jede stabile,
auf npm veröffentlichte Version von `2026.4.23` bis `latest`. Verwenden Sie für
vollständige Abdeckung der Migration veröffentlichter Updates `all-since-2026.4.23`
im separaten Update-Migration-Workflow statt in Full Release CI. `release-history`
bleibt für breitere manuelle Stichproben verfügbar, wenn Sie auch den älteren
Anker vor diesem Datum einbeziehen möchten.

Führen Sie ein Paketprofil manuell aus, wenn Sie einen Kandidaten vor dem Release
validieren:

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
Cron-/Subagent-Bereinigung, OpenAI-Websuche oder OpenWebUI umfasst. Verwenden Sie
`suite_profile=full` nur, wenn Sie vollständige Docker-Abdeckung des Release-Pfads
benötigen.

## Release-Standard

Für Release-Kandidaten ist der Standard-Nachweisstapel:

1. `pnpm check:changed` und `pnpm test:changed` für Regressionen auf Source-Ebene.
2. `pnpm release:check` für die Integrität des Paketartefakts.
3. Package Acceptance-Profil `package` oder die benutzerdefinierten Paket-Lanes der
   Release-Prüfung für Installations-/Update-/Plugin-Verträge.
4. Cross-OS-Release-Prüfungen für OS-spezifisches Installer-, Onboarding- und
   Plattformverhalten.
5. Live-Suites nur, wenn die geänderte Oberfläche Provider- oder Hosted-Service-Verhalten
   betrifft.

Auf Maintainer-Maschinen sollten breite Gates und Docker-/Paket-Produktnachweise in
Testbox laufen, sofern nicht ausdrücklich ein lokaler Nachweis durchgeführt wird.

## Legacy-Kompatibilität

Kompatibilitätsnachsicht ist eng und zeitlich begrenzt:

- Pakete bis einschließlich `2026.4.25`, einschließlich `2026.4.25-beta.*`, dürfen
  bereits ausgelieferte Lücken in Paketmetadaten in Package Acceptance tolerieren.
- Das veröffentlichte Paket `2026.4.26` darf für bereits ausgelieferte lokale
  Build-Metadatenstempeldateien warnen.
- Spätere Pakete müssen moderne Verträge erfüllen. Dieselben Lücken schlagen fehl,
  statt zu warnen oder übersprungen zu werden.

Fügen Sie keine neuen Startmigrationen für diese alten Formen hinzu. Fügen Sie eine
doctor-Reparatur hinzu oder erweitern Sie eine, und weisen Sie sie anschließend mit
`upgrade-survivor` oder `published-upgrade-survivor` nach.

## Abdeckung hinzufügen

Wenn Sie Update- oder Plugin-Verhalten ändern, fügen Sie Abdeckung auf der niedrigsten
Ebene hinzu, die aus dem richtigen Grund fehlschlagen kann:

- Reine Pfad- oder Metadatenlogik: Unit-Test neben der Quelle.
- Paketinventar- oder Packed-File-Verhalten: `package-dist-inventory`- oder Tarball-
  Checker-Test.
- CLI-Installations-/Update-Verhalten: Docker-Lane-Assertion oder Fixture.
- Migrationsverhalten veröffentlichter Releases: `published-upgrade-survivor`-Szenario.
- Registry-/Paketquellenverhalten: `test:docker:plugins`-Fixture oder ClawHub-
  Fixture-Server.
- Abhängigkeitslayout- oder Bereinigungsverhalten: sowohl Laufzeitausführung als auch
  die Dateisystemgrenze prüfen. npm-Abhängigkeiten können unter den verwalteten npm-Root
  hochgezogen werden, daher sollten Tests nachweisen, dass der Root gescannt/bereinigt
  wird, statt von einem paketlokalen `node_modules`-Baum auszugehen.

Halten Sie neue Docker-Fixtures standardmäßig hermetisch. Verwenden Sie lokale
Fixture-Registries und Fake-Pakete, außer der Zweck des Tests ist Live-Registry-Verhalten.

## Fehlertriage

Beginnen Sie mit der Artefaktidentität:

- Package Acceptance-`resolve_package`-Zusammenfassung: Quelle, Version, SHA-256 und
  Artefaktname.
- Docker-Artefakte: `.artifacts/docker-tests/**/summary.json`, `failures.json`,
  Lane-Logs und Befehle zum erneuten Ausführen.
- Upgrade-Survivor-Zusammenfassung: `.artifacts/upgrade-survivor/summary.json`,
  einschließlich Basisversion, Kandidatenversion, Szenario, Phasen-Timings und
  Rezeptschritten.

Bevorzugen Sie das erneute Ausführen der exakt fehlgeschlagenen Lane mit demselben
Paketartefakt gegenüber dem erneuten Ausführen des gesamten Release-Umbrellas.
