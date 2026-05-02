---
read_when:
    - Verhalten bei OpenClaw-Updates, doctor, Paketabnahme oder Plugin-Installation ändern
    - Einen Release Candidate vorbereiten oder genehmigen
    - Fehlersuche bei Paketaktualisierungen, der Bereinigung von Plugin-Abhängigkeiten oder Regressionen bei der Plugin-Installation
sidebarTitle: Update and plugin tests
summary: Wie OpenClaw Aktualisierungspfade, Paketmigrationen und Plugin-Installations-/Aktualisierungsverhalten validiert
title: 'Tests: Updates und Plugins'
x-i18n:
    generated_at: "2026-05-02T06:37:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: b1999106b52d2539a6ee0fd7cd88ebb3515c8726e080d4031d7bf421fb99de36
    source_path: help/testing-updates-plugins.md
    workflow: 16
---

Dies ist die dedizierte Checkliste für Update- und Plugin-Validierung. Das Ziel ist
einfach: nachweisen, dass das installierbare Paket echten Benutzerzustand aktualisieren,
veralteten Legacy-Zustand über `doctor` reparieren und Plugins aus den unterstützten
Quellen weiterhin installieren, laden, aktualisieren und deinstallieren kann.

Die umfassendere Test-Runner-Übersicht finden Sie unter [Testing](/de/help/testing). Für Live-Provider-
Schlüssel und Suiten mit Netzwerkzugriff siehe [Testing live](/de/help/testing-live).

## Was wir schützen

Update- und Plugin-Tests schützen diese Verträge:

- Ein Paket-Tarball ist vollständig, enthält eine gültige `dist/postinstall-inventory.json`
  und hängt nicht von entpackten Repo-Dateien ab.
- Ein Benutzer kann von einem älteren veröffentlichten Paket zum Kandidatenpaket
  wechseln, ohne Konfiguration, Agents, Sitzungen, Workspaces, Plugin-Allowlisten oder
  Kanalkonfiguration zu verlieren.
- `openclaw doctor --fix --non-interactive` ist für Legacy-Bereinigung und Reparaturpfade
  zuständig. Der Start sollte keine versteckten Kompatibilitätsmigrationen für veralteten
  Plugin-Zustand bekommen.
- Plugin-Installationen funktionieren aus lokalen Verzeichnissen, Git-Repos, npm-Paketen und dem
  ClawHub-Registrierungspfad.
- Plugin-npm-Abhängigkeiten werden im verwalteten npm-Root installiert, vor dem
  Vertrauen gescannt und bei der Deinstallation über npm entfernt, damit gehoistete Abhängigkeiten
  nicht zurückbleiben.
- Plugin-Updates sind stabil, wenn sich nichts geändert hat: Installationsdatensätze, aufgelöste
  Quelle, installiertes Abhängigkeitslayout und aktivierter Zustand bleiben intakt.

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

`release:check` führt Drift-Prüfungen für Konfiguration/Dokumentation/API aus, schreibt das Paket-Dist-
Inventar, führt `npm pack --dry-run` aus, weist verbotene gepackte Dateien zurück, installiert
den Tarball in ein temporäres Präfix, führt postinstall aus und prüft gebündelte Kanal-
Entrypoints mit Smoke-Tests.

## Docker-Lanes

Die Docker-Lanes sind der Nachweis auf Produktebene. Sie installieren oder aktualisieren ein echtes
Paket in Linux-Containern und prüfen das Verhalten über CLI-Befehle,
Gateway-Start, HTTP-Probes, RPC-Status und Dateisystemzustand.

Verwenden Sie während der Iteration fokussierte Lanes:

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-migration
```

Wichtige Lanes:

- `test:docker:plugins` validiert Plugin-Installations-Smoke, Installationen aus lokalen Ordnern,
  das Überspringverhalten bei Updates lokaler Ordner, lokale Ordner mit vorinstallierten
  Abhängigkeiten, `file:`-Paketinstallationen, Git-Installationen mit CLI-Ausführung, Git-
  Moving-Ref-Updates, npm-Registrierungsinstallationen mit gehoisteten transitiven
  Abhängigkeiten, npm-Update-No-Ops, lokale ClawHub-Fixture-Installationen und Update-
  No-Ops, Marketplace-Update-Verhalten sowie Claude-Bundle-Aktivierung/-Inspektion. Setzen Sie
  `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, um den ClawHub-Block hermetisch/offline zu halten.
- `test:docker:plugin-update` validiert, dass ein unverändertes installiertes Plugin während
  `openclaw plugins update` nicht neu installiert wird und keine Installationsmetadaten verliert.
- `test:docker:upgrade-survivor` installiert den Kandidaten-Tarball über eine verschmutzte
  Altbenutzer-Fixture, führt Paket-Update plus nicht interaktiven doctor aus, startet anschließend
  ein Loopback-Gateway und prüft die Zustandserhaltung.
- `test:docker:published-upgrade-survivor` installiert zuerst eine veröffentlichte Baseline,
  konfiguriert sie über ein eingebautes `openclaw config set`-Rezept, aktualisiert sie auf den
  Kandidaten-Tarball, führt doctor aus, prüft Legacy-Bereinigung, startet den Gateway und
  probt `/healthz`, `/readyz` sowie den RPC-Status.
- `test:docker:update-migration` ist die bereinigungsintensive Lane für veröffentlichte Updates. Sie
  startet aus einem konfigurierten Discord/Telegram-artigen Benutzerzustand, führt Baseline-
  doctor aus, damit konfigurierte Plugin-Abhängigkeiten die Chance haben, materialisiert zu werden, legt
  Legacy-Plugin-Abhängigkeitsreste für ein konfiguriertes paketiertes Plugin an, aktualisiert auf
  den Kandidaten-Tarball und verlangt, dass post-update doctor die Legacy-
  Abhängigkeitsroots entfernt.

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
`plugin-deps-cleanup`, `tilde-log-path` und `versioned-runtime-deps`. In aggregierten Läufen
wird `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` auf alle gemeldeten
Issue-förmigen Szenarien erweitert.

Die vollständige Update-Migration ist absichtlich von Full Release CI getrennt. Verwenden Sie den
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

## Package Acceptance

Package Acceptance ist das GitHub-native Paket-Gate. Es löst ein Kandidaten-
Paket in einen `package-under-test`-Tarball auf, zeichnet Version und SHA-256 auf und
führt anschließend wiederverwendbare Docker-E2E-Lanes gegen genau diesen Tarball aus. Die Workflow-Harness-
Ref ist von der Paketquellen-Ref getrennt, sodass aktuelle Testlogik
ältere vertrauenswürdige Releases validieren kann.

Kandidatenquellen:

- `source=npm`: validiert `openclaw@beta`, `openclaw@latest` oder eine exakte
  veröffentlichte Version.
- `source=ref`: packt einen vertrauenswürdigen Branch, Tag oder Commit mit dem ausgewählten aktuellen
  Harness.
- `source=url`: validiert einen HTTPS-Tarball mit erforderlichem `package_sha256`.
- `source=artifact`: verwendet einen von einem anderen Actions-Lauf hochgeladenen Tarball erneut.

Release-Prüfungen rufen Package Acceptance mit dem Paket-/Update-/Plugin-Set auf:

```text
doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update
```

Sie übergeben außerdem:

```text
published_upgrade_survivor_baselines=release-history
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

Dadurch bleiben Paketmigration, Wechsel des Update-Kanals, Bereinigung veralteter Plugin-Abhängigkeiten,
Offline-Plugin-Abdeckung, Plugin-Update-Verhalten und Telegram-Paket-QA auf demselben
aufgelösten Artefakt.

`release-history` ist ein begrenztes Release-Check-Beispiel: die neuesten sechs stabilen Releases,
`2026.4.23` und ein älterer Anker vor diesem Datum. Für vollständige Abdeckung der Migration
veröffentlichter Updates verwenden Sie `all-since-2026.4.23` im separaten Update Migration-
Workflow statt Full Release CI.

Führen Sie ein Paketprofil manuell aus, wenn Sie einen Kandidaten vor dem Release validieren:

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=package \
  -f published_upgrade_survivor_baselines=release-history \
  -f published_upgrade_survivor_scenarios=reported-issues \
  -f telegram_mode=mock-openai
```

Verwenden Sie `suite_profile=product`, wenn die Release-Frage MCP-Kanäle,
Cron-/Subagent-Bereinigung, OpenAI-Websuche oder OpenWebUI umfasst. Verwenden Sie `suite_profile=full`
nur, wenn Sie die vollständige Docker-Abdeckung des Release-Pfads benötigen.

## Release-Standard

Für Release-Kandidaten ist der Standard-Nachweis-Stack:

1. `pnpm check:changed` und `pnpm test:changed` für Regressionen auf Quellcodeebene.
2. `pnpm release:check` für die Integrität des Paketartefakts.
3. Package Acceptance mit `package`-Profil oder die benutzerdefinierten Package-
   Lanes der Release-Prüfung für Installations-/Update-/Plugin-Verträge.
4. Cross-OS-Release-Prüfungen für OS-spezifische Installer-, Onboarding- und Plattform-
   Verhalten.
5. Live-Suiten nur dann, wenn die geänderte Oberfläche Provider- oder Hosted-Service-
   Verhalten berührt.

Auf Maintainer-Maschinen sollten breite Gates und Docker-/Paket-Produktnachweise in
Testbox laufen, sofern nicht ausdrücklich ein lokaler Nachweis erfolgt.

## Legacy-Kompatibilität

Kompatibilitätsnachsicht ist eng begrenzt und zeitlich befristet:

- Pakete bis einschließlich `2026.4.25`, einschließlich `2026.4.25-beta.*`, dürfen
  bereits ausgelieferte Paketmetadatenlücken in Package Acceptance tolerieren.
- Das veröffentlichte Paket `2026.4.26` darf für bereits ausgelieferte lokale Build-Metadaten-
  Stempeldateien warnen.
- Spätere Pakete müssen moderne Verträge erfüllen. Dieselben Lücken führen zu Fehlern statt
  zu Warnungen oder Überspringen.

Fügen Sie keine neuen Startmigrationen für diese alten Formen hinzu. Fügen Sie eine doctor-
Reparatur hinzu oder erweitern Sie sie und weisen Sie sie anschließend mit `upgrade-survivor` oder `published-upgrade-survivor` nach.

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
- Abhängigkeitslayout oder Bereinigungsverhalten: prüfen Sie sowohl die Runtime-Ausführung als auch die
  Dateisystemgrenze. npm-Abhängigkeiten können unter dem verwalteten npm-
  Root gehoistet werden, daher sollten Tests nachweisen, dass der Root gescannt/bereinigt wird, statt einen
  paketlokalen `node_modules`-Baum anzunehmen.

Halten Sie neue Docker-Fixtures standardmäßig hermetisch. Verwenden Sie lokale Fixture-Registries und
Fake-Pakete, sofern nicht Live-Registrierungsverhalten der Zweck des Tests ist.

## Fehlersuche

Beginnen Sie mit der Artefaktidentität:

- Package Acceptance `resolve_package`-Zusammenfassung: Quelle, Version, SHA-256 und
  Artefaktname.
- Docker-Artefakte: `.artifacts/docker-tests/**/summary.json`,
  `failures.json`, Lane-Logs und Befehle zur erneuten Ausführung.
- Upgrade-survivor-Zusammenfassung: `.artifacts/upgrade-survivor/summary.json`,
  einschließlich Baseline-Version, Kandidatenversion, Szenario, Phasenzeiten und
  Rezeptschritten.

Bevorzugen Sie das erneute Ausführen der exakt fehlgeschlagenen Lane mit demselben Paketartefakt gegenüber
dem erneuten Ausführen des gesamten Release-Dachs.
