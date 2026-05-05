---
read_when:
    - Ändern des Verhaltens von OpenClaw-Update, doctor, Paketakzeptanz oder Plugin-Installation
    - Release Candidate vorbereiten oder genehmigen
    - Fehlerbehebung bei Paketaktualisierung, Plugin-Abhängigkeitsbereinigung oder Regressionen bei der Plugin-Installation
sidebarTitle: Update and plugin tests
summary: Wie OpenClaw Update-Pfade, Paketmigrationen und das Installations-/Update-Verhalten von Plugins validiert
title: 'Testen: Updates und Plugins'
x-i18n:
    generated_at: "2026-05-05T06:18:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: 19ae526d3daa8a1b67cb2f74225138b3e1fa192c9f956c9dd6d0e407581b9ed9
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Dies ist die dedizierte Checkliste für Update- und Plugin-Validierung. Das Ziel ist
einfach: nachweisen, dass das installierbare Paket echten Benutzerzustand aktualisieren,
veralteten Legacy-Zustand über `doctor` reparieren und weiterhin Plugins aus den
unterstützten Quellen installieren, laden, aktualisieren und deinstallieren kann.

Die breitere Übersicht der Test-Runner finden Sie unter [Testing](/de/help/testing). Für Live-Provider-
Schlüssel und Suites mit Netzwerkzugriff siehe [Testing live](/de/help/testing-live).

## Was wir schützen

Update- und Plugin-Tests schützen diese Verträge:

- Ein Paket-Tarball ist vollständig, enthält eine gültige `dist/postinstall-inventory.json`
  und hängt nicht von entpackten Repo-Dateien ab.
- Ein Benutzer kann von einem älteren veröffentlichten Paket zum Kandidatenpaket
  wechseln, ohne Config, Agents, Sessions, Workspaces, Plugin-Allowlists oder
  Channel-Config zu verlieren.
- `openclaw doctor --fix --non-interactive` besitzt Legacy-Bereinigungs- und Reparaturpfade.
  Der Start sollte keine versteckten Kompatibilitätsmigrationen für veralteten
  Plugin-Zustand aufbauen.
- Plugin-Installationen funktionieren aus lokalen Verzeichnissen, Git-Repos, npm-Paketen und dem
  ClawHub-Registry-Pfad.
- Plugin-npm-Abhängigkeiten werden im verwalteten npm-Root installiert, vor dem
  Vertrauen gescannt und bei der Deinstallation über npm entfernt, damit gehobene
  Abhängigkeiten nicht zurückbleiben.
- Plugin-Updates sind stabil, wenn sich nichts geändert hat: Installationsdatensätze, aufgelöste
  Quelle, installierte Abhängigkeitsstruktur und aktivierter Zustand bleiben intakt.

## Lokaler Nachweis während der Entwicklung

Beginnen Sie eng fokussiert:

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

Bevor eine Paket-Docker-Lane einen Tarball verwendet, weisen Sie das Paketartefakt nach:

```bash
pnpm release:check
```

`release:check` führt Drift-Prüfungen für Config/Dokumentation/API aus, schreibt das Paket-Dist-
Inventar, führt `npm pack --dry-run` aus, lehnt verbotene gepackte Dateien ab, installiert
den Tarball in ein temporäres Prefix, führt postinstall aus und prüft gebündelte Channel-
Einstiegspunkte per Smoke-Test.

## Docker-Lanes

Die Docker-Lanes sind der produktweite Nachweis. Sie installieren oder aktualisieren ein echtes
Paket in Linux-Containern und prüfen das Verhalten über CLI-Befehle,
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

- `test:docker:plugins` validiert Plugin-Installations-Smoke, lokale Ordnerinstallationen,
  das Skip-Verhalten für Updates lokaler Ordner, lokale Ordner mit vorinstallierten
  Abhängigkeiten, `file:`-Paketinstallationen, Git-Installationen mit CLI-Ausführung, Git-
  Moving-Ref-Updates, npm-Registry-Installationen mit gehobenen transitiven
  Abhängigkeiten, npm-Update-No-Ops, lokale ClawHub-Fixture-Installationen und Update-
  No-Ops, Marketplace-Update-Verhalten sowie Claude-Bundle-Aktivierung/Inspektion. Setzen Sie
  `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, um den ClawHub-Block hermetisch/offline zu halten.
- `test:docker:plugin-lifecycle-matrix` installiert das Kandidatenpaket in einem leeren
  Container, führt ein npm-Plugin durch Installation, Inspektion, Deaktivierung, Aktivierung,
  explizites Upgrade, explizites Downgrade und Deinstallation nach dem Löschen des Plugin-
  Codes. Es protokolliert RSS- und CPU-Metriken für jede Phase.
- `test:docker:plugin-update` validiert, dass ein unverändertes installiertes Plugin
  während `openclaw plugins update` nicht neu installiert wird und keine Installationsmetadaten verliert.
- `test:docker:upgrade-survivor` installiert den Kandidaten-Tarball über eine schmutzige
  Altbenutzer-Fixture, führt Paket-Update plus nicht-interaktiven Doctor aus, startet dann
  ein local loopback Gateway und prüft die Zustandserhaltung.
- `test:docker:published-upgrade-survivor` installiert zuerst eine veröffentlichte Baseline,
  konfiguriert sie über ein eingebackenes `openclaw config set`-Rezept, aktualisiert sie auf den
  Kandidaten-Tarball, führt Doctor aus, prüft Legacy-Bereinigung, startet das Gateway und
  prüft `/healthz`, `/readyz` und RPC-Status.
- `test:docker:update-restart-auth` installiert das Kandidatenpaket, startet ein
  verwaltetes Token-Auth-Gateway, entfernt die Gateway-Auth-Env des Aufrufers für
  `openclaw update --yes --json` und verlangt, dass der Kandidaten-Update-Befehl das
  Gateway vor den normalen Probes neu startet.
- `test:docker:update-migration` ist die bereinigungsintensive Published-Update-Lane. Sie
  startet aus einem konfigurierten Discord/Telegram-artigen Benutzerzustand, führt Baseline-
  Doctor aus, damit konfigurierte Plugin-Abhängigkeiten materialisiert werden können, erzeugt
  Legacy-Plugin-Abhängigkeitsreste für ein konfiguriertes paketiertes Plugin, aktualisiert auf
  den Kandidaten-Tarball und verlangt, dass der Post-Update-Doctor die Legacy-
  Abhängigkeitsroots entfernt.

Nützliche Varianten für Published-Upgrade-Survivor:

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
expandiert `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` auf alle gemeldeten
Issue-förmigen Szenarien, einschließlich der Migration für konfigurierte Plugin-Installationen.

Die vollständige Update-Migration ist absichtlich von Full Release CI getrennt. Verwenden Sie den
manuellen Workflow `Update Migration`, wenn die Release-Frage lautet: „Kann jedes
veröffentlichte stabile Release ab 2026.4.23 auf diesen Kandidaten aktualisieren und
Plugin-Abhängigkeitsreste bereinigen?“:

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## Paketakzeptanz

Paketakzeptanz ist das GitHub-native Paket-Gate. Es löst ein Kandidatenpaket
in einen `package-under-test`-Tarball auf, zeichnet Version und SHA-256 auf und
führt dann wiederverwendbare Docker-E2E-Lanes gegen genau diesen Tarball aus. Die Workflow-Harness-
Ref ist von der Paketquell-Ref getrennt, sodass aktuelle Testlogik ältere
vertrauenswürdige Releases validieren kann.

Kandidatenquellen:

- `source=npm`: `openclaw@beta`, `openclaw@latest` oder eine exakte
  veröffentlichte Version validieren.
- `source=ref`: einen vertrauenswürdigen Branch, Tag oder Commit mit dem ausgewählten aktuellen
  Harness packen.
- `source=url`: einen HTTPS-Tarball mit erforderlichem `package_sha256` validieren.
- `source=artifact`: einen von einem anderen Actions-Lauf hochgeladenen Tarball wiederverwenden.

Full Release Validation verwendet standardmäßig `source=artifact`, gebaut aus der
aufgelösten Release-SHA. Für den Nachweis nach der Veröffentlichung übergeben Sie
`package_acceptance_package_spec=openclaw@YYYY.M.D`, damit dieselbe Upgrade-Matrix
stattdessen auf das ausgelieferte npm-Paket zielt.

Release-Prüfungen rufen die Paketakzeptanz mit dem Paket-/Update-/Neustart-/Plugin-Set auf:

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update
```

Wenn Release-Soak aktiviert ist, übergeben sie außerdem:

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Dadurch bleiben Paketmigration, Update-Channel-Umschaltung, Bereinigung veralteter Plugin-Abhängigkeiten,
Offline-Plugin-Abdeckung, Plugin-Update-Verhalten und Telegram-Paket-QA auf demselben
aufgelösten Artefakt, ohne dass das standardmäßige Release-Paket-Gate jedes
veröffentlichte Release durchläuft.

`last-stable-4` wird zu den vier neuesten stabilen npm-veröffentlichten OpenClaw-
Releases aufgelöst. Release-Paketakzeptanz pinnt `2026.4.23` als erste Plugin-Update-
Kompatibilitätsgrenze, `2026.5.2` als Plugin-Architektur-Churn-Grenze und
`2026.4.15` als ältere 2026.4.1x-Published-Update-Baseline; der Resolver
dedupliziert Pins, die bereits in den neuesten vier enthalten sind. Für vollständige
Published-Update-Migrationsabdeckung verwenden Sie `all-since-2026.4.23` im separaten Update-
Migration-Workflow statt Full Release CI. `release-history` bleibt für manuelles breiteres
Sampling verfügbar, wenn Sie auch den älteren Vor-Datum-Anker möchten.

Wenn mehrere Published-Upgrade-Survivor-Baselines ausgewählt sind, shardet der wiederverwendbare
Docker-Workflow jede Baseline in ihren eigenen zielgerichteten Runner-Job. Jeder
Baseline-Shard führt weiterhin das ausgewählte Szenarioset aus, aber Logs und Artefakte bleiben
pro Baseline getrennt und die Laufzeit wird durch den langsamsten Shard statt durch einen großen
seriellen Job begrenzt.

Führen Sie manuell ein Paketprofil aus, wenn Sie einen Kandidaten vor dem Release validieren:

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
nur, wenn Sie vollständige Docker-Release-Pfad-Abdeckung benötigen.

## Release-Standard

Für Release-Kandidaten ist der Standard-Nachweisstapel:

1. `pnpm check:changed` und `pnpm test:changed` für Regressionen auf Quellcodeebene.
2. `pnpm release:check` für die Integrität des Paketartefakts.
3. Paketakzeptanz-Profil `package` oder die benutzerdefinierten Release-Check-Paket-
   Lanes für Installations-/Update-/Neustart-/Plugin-Verträge.
4. Cross-OS-Release-Prüfungen für OS-spezifische Installer-, Onboarding- und Plattform-
   Verhaltensweisen.
5. Live-Suites nur, wenn die geänderte Oberfläche Provider- oder Hosted-Service-
   Verhalten betrifft.

Auf Maintainer-Maschinen sollten breite Gates und Docker-/Paket-Produktnachweise in
Testbox laufen, außer Sie führen ausdrücklich lokale Nachweise aus.

## Legacy-Kompatibilität

Kompatibilitätsnachsicht ist eng und zeitlich begrenzt:

- Pakete bis einschließlich `2026.4.25`, einschließlich `2026.4.25-beta.*`, dürfen
  bereits ausgelieferte Paketmetadatenlücken in der Paketakzeptanz tolerieren.
- Das veröffentlichte Paket `2026.4.26` darf bei bereits ausgelieferten lokalen Build-Metadaten-
  Stamp-Dateien warnen.
- Spätere Pakete müssen moderne Verträge erfüllen. Dieselben Lücken schlagen fehl, statt
  zu warnen oder übersprungen zu werden.

Fügen Sie für diese alten Formen keine neuen Startup-Migrationen hinzu. Fügen Sie eine Doctor-
Reparatur hinzu oder erweitern Sie eine bestehende, und weisen Sie sie dann mit `upgrade-survivor`,
`published-upgrade-survivor` oder `update-restart-auth` nach, wenn der Update-Befehl den
Neustart besitzt.

## Abdeckung hinzufügen

Wenn Sie Update- oder Plugin-Verhalten ändern, fügen Sie Abdeckung auf der niedrigsten Ebene hinzu, die
aus dem richtigen Grund fehlschlagen kann:

- Reine Pfad- oder Metadatenlogik: Unit-Test neben der Quelle.
- Paketinventar- oder Packed-File-Verhalten: `package-dist-inventory` oder Tarball-
  Checker-Test.
- CLI-Installations-/Update-Verhalten: Docker-Lane-Assertion oder Fixture.
- Published-Release-Migrationsverhalten: `published-upgrade-survivor`-Szenario.
- Update-eigener Neustart: `update-restart-auth`.
- Registry-/Paketquellenverhalten: `test:docker:plugins`-Fixture oder ClawHub-
  Fixture-Server.
- Abhängigkeitslayout- oder Bereinigungsverhalten: sowohl Runtime-Ausführung als auch die
  Dateisystemgrenze prüfen. npm-Abhängigkeiten können unter den verwalteten npm-
  Root gehoben werden, daher sollten Tests nachweisen, dass der Root gescannt/bereinigt wird, statt einen
  paketlokalen `node_modules`-Baum anzunehmen.

Halten Sie neue Docker-Fixtures standardmäßig hermetisch. Verwenden Sie lokale Fixture-Registries und
Fake-Pakete, außer der Zweck des Tests ist Live-Registry-Verhalten.

## Fehlertriage

Beginnen Sie mit der Artefaktidentität:

- Zusammenfassung von Package Acceptance `resolve_package`: Quelle, Version, SHA-256 und
  Artefaktname.
- Docker-Artefakte: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, Lane-Protokolle und Befehle für erneute Ausführungen.
- Zusammenfassung der Upgrade-Überlebensprüfung: `.artifacts/upgrade-survivor/summary.json`,
  einschließlich Baseline-Version, Kandidatenversion, Szenario, Phasen-Timings und
  Rezeptschritten.

Ziehen Sie es vor, die fehlgeschlagene exakte Lane mit demselben Paketartefakt erneut auszuführen, statt
die gesamte Release-Überstruktur erneut auszuführen.
