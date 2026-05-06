---
read_when:
    - Sie müssen nachvollziehen, warum ein CI-Job ausgeführt wurde oder nicht
    - Sie debuggen eine fehlgeschlagene GitHub Actions-Prüfung
    - Sie koordinieren einen Release-Validierungslauf oder dessen Wiederholung
    - Sie ändern den ClawSweeper-Dispatch oder die Weiterleitung von GitHub-Aktivitäten
summary: CI-Job-Graph, Bereichsprüfungen, Release-Sammelprüfungen und lokale Befehlsäquivalente
title: CI-Pipeline
x-i18n:
    generated_at: "2026-05-06T09:03:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 189f717fac369d6374102612308c73705f19eca9baca81b24f052dbd5357e15f
    source_path: ci.md
    workflow: 16
---

OpenClaw-CI läuft bei jedem Push auf `main` und bei jedem Pull Request. Der `preflight`-Job klassifiziert den Diff und deaktiviert teure Lanes, wenn sich nur nicht zugehörige Bereiche geändert haben. Manuelle `workflow_dispatch`-Läufe umgehen bewusst das intelligente Scoping und fächern für Release-Kandidaten und breite Validierung den vollständigen Graphen auf. Android-Lanes bleiben über `include_android` optional. Release-spezifische Plugin-Abdeckung befindet sich im separaten Workflow [`Plugin-Vorabversion`](#plugin-prerelease) und läuft nur aus [`Vollständige Release-Validierung`](#full-release-validation) heraus oder durch einen expliziten manuellen Dispatch.

## Pipeline-Übersicht

| Job                              | Zweck                                                                                                                  | Wann er läuft                                   |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `preflight`                      | Erkennt reine Docs-Änderungen, geänderte Scopes, geänderte Erweiterungen und erstellt das CI-Manifest                  | Immer bei Nicht-Draft-Pushes und PRs            |
| `security-scm-fast`              | Erkennung privater Schlüssel und Workflow-Audit über `zizmor`                                                         | Immer bei Nicht-Draft-Pushes und PRs            |
| `security-dependency-audit`      | Dependency-freier Audit des Produktions-Lockfiles gegen npm-Advisories                                                | Immer bei Nicht-Draft-Pushes und PRs            |
| `security-fast`                  | Erforderliches Aggregat für die schnellen Sicherheitsjobs                                                              | Immer bei Nicht-Draft-Pushes und PRs            |
| `check-dependencies`             | Reiner Produktions-Knip-Dependency-Durchlauf plus Allowlist-Schutz für ungenutzte Dateien                             | Node-relevante Änderungen                       |
| `build-artifacts`                | Erstellt `dist/`, Control UI, Prüfungen gebauter Artefakte und wiederverwendbare Downstream-Artefakte                 | Node-relevante Änderungen                       |
| `checks-fast-core`               | Schnelle Linux-Korrektheits-Lanes wie gebündelte/Plugin-Contract-/Protokollprüfungen                                  | Node-relevante Änderungen                       |
| `checks-fast-contracts-channels` | Gesplittete Channel-Contract-Prüfungen mit stabilem aggregiertem Prüfergebnis                                         | Node-relevante Änderungen                       |
| `checks-node-core-test`          | Core-Node-Test-Shards, ohne Channel-, gebündelte, Contract- und Erweiterungs-Lanes                                    | Node-relevante Änderungen                       |
| `check`                          | Gesplittetes Äquivalent des lokalen Haupt-Gates: Produktionstypen, Lint, Guards, Testtypen und strikter Smoke-Test    | Node-relevante Änderungen                       |
| `check-additional`               | Architektur, gesplitteter Boundary-/Prompt-Drift, Erweiterungs-Guards, Package-Boundary und Gateway Watch             | Node-relevante Änderungen                       |
| `build-smoke`                    | Smoke-Tests für gebaute CLI und Startup-Memory-Smoke                                                                   | Node-relevante Änderungen                       |
| `checks`                         | Verifier für Channel-Tests mit gebauten Artefakten                                                                     | Node-relevante Änderungen                       |
| `checks-node-compat-node22`      | Node-22-Kompatibilitäts-Build und Smoke-Lane                                                                           | Manueller CI-Dispatch für Releases              |
| `check-docs`                     | Docs-Formatierung, Lint und Broken-Link-Prüfungen                                                                      | Docs geändert                                   |
| `skills-python`                  | Ruff + pytest für Python-gestützte Skills                                                                              | Python-Skill-relevante Änderungen               |
| `checks-windows`                 | Windows-spezifische Prozess-/Pfadtests plus Regressionen bei gemeinsamen Runtime-Import-Spezifizierern                | Windows-relevante Änderungen                    |
| `macos-node`                     | macOS-TypeScript-Test-Lane mit den gemeinsam gebauten Artefakten                                                       | macOS-relevante Änderungen                      |
| `macos-swift`                    | Swift-Lint, Build und Tests für die macOS-App                                                                          | macOS-relevante Änderungen                      |
| `android`                        | Android-Unit-Tests für beide Flavors plus ein Debug-APK-Build                                                         | Android-relevante Änderungen                    |
| `test-performance-agent`         | Tägliche Codex-Optimierung langsamer Tests nach vertrauenswürdiger Aktivität                                          | Erfolgreiche Haupt-CI oder manueller Dispatch   |
| `openclaw-performance`           | Tägliche/bedarfsbasierte Kova-Runtime-Performance-Berichte mit Mock-Provider-, Deep-Profile- und GPT-5.4-Live-Lanes   | Geplanter und manueller Dispatch                |

## Fail-Fast-Reihenfolge

1. `preflight` entscheidet, welche Lanes überhaupt existieren. Die Logik `docs-scope` und `changed-scope` sind Schritte innerhalb dieses Jobs, keine eigenständigen Jobs.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` und `skills-python` schlagen schnell fehl, ohne auf die schwereren Artefakt- und Plattform-Matrix-Jobs zu warten.
3. `build-artifacts` überlappt sich mit den schnellen Linux-Lanes, damit Downstream-Verbraucher starten können, sobald der gemeinsame Build bereit ist.
4. Schwerere Plattform- und Runtime-Lanes fächern danach auf: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` und `android`.

GitHub kann ersetzte Jobs als `cancelled` markieren, wenn ein neuerer Push auf denselben PR- oder `main`-Ref landet. Behandeln Sie das als CI-Rauschen, sofern nicht auch der neueste Lauf für denselben Ref fehlschlägt. Aggregierte Shard-Prüfungen verwenden `!cancelled() && always()`, damit sie normale Shard-Fehler weiterhin melden, aber nicht mehr eingereiht werden, nachdem der gesamte Workflow bereits ersetzt wurde. Der automatische CI-Concurrency-Schlüssel ist versioniert (`CI-v7-*`), sodass ein GitHub-seitiger Zombie in einer alten Queue-Gruppe neuere Main-Läufe nicht unbegrenzt blockieren kann. Manuelle Full-Suite-Läufe verwenden `CI-manual-v1-*` und brechen laufende Läufe nicht ab.

## Scope und Routing

Die Scope-Logik befindet sich in `scripts/ci-changed-scope.mjs` und ist durch Unit-Tests in `src/scripts/ci-changed-scope.test.ts` abgedeckt. Manueller Dispatch überspringt die Changed-Scope-Erkennung und lässt das Preflight-Manifest so handeln, als hätte sich jeder gescopte Bereich geändert.

- **CI-Workflow-Änderungen** validieren den Node-CI-Graphen plus Workflow-Linting, erzwingen aber für sich genommen keine nativen Windows-, Android- oder macOS-Builds; diese Plattform-Lanes bleiben auf Plattform-Quelländerungen gescopet.
- **Reine CI-Routing-Änderungen, ausgewählte günstige Core-Test-Fixture-Änderungen und enge Plugin-Contract-Helper-/Test-Routing-Änderungen** verwenden einen schnellen Node-only-Manifestpfad: `preflight`, Sicherheit und eine einzelne `checks-fast-core`-Aufgabe. Dieser Pfad überspringt Build-Artefakte, Node-22-Kompatibilität, Channel-Contracts, vollständige Core-Shards, gebündelte Plugin-Shards und zusätzliche Guard-Matrizen, wenn die Änderung auf die Routing- oder Helper-Oberflächen beschränkt ist, die die schnelle Aufgabe direkt ausübt.
- **Windows-Node-Prüfungen** sind auf Windows-spezifische Prozess-/Pfad-Wrapper, npm-/pnpm-/UI-Runner-Helper, Package-Manager-Konfiguration und die CI-Workflow-Oberflächen gescopet, die diese Lane ausführen; nicht zugehörige Quell-, Plugin-, Install-Smoke- und reine Teständerungen bleiben auf den Linux-Node-Lanes.

Die langsamsten Node-Testfamilien sind aufgeteilt oder ausbalanciert, damit jeder Job klein bleibt, ohne Runner übermäßig zu reservieren: Channel-Contracts laufen als drei gewichtete Shards, schnelle/supportbezogene Core-Unit-Lanes laufen separat, Core-Runtime-Infrastruktur ist zwischen State- und Process-/Config-Shards aufgeteilt, Auto-Reply läuft als ausbalancierte Worker (wobei der Reply-Subtree in Agent-Runner-, Dispatch- und Commands-/State-Routing-Shards aufgeteilt ist), und agentische Gateway-/Server-Konfigurationen sind über Chat-/Auth-/Model-/HTTP-Plugin-/Runtime-/Startup-Lanes aufgeteilt, statt auf gebaute Artefakte zu warten. Breite Browser-, QA-, Media- und sonstige Plugin-Tests verwenden ihre dedizierten Vitest-Konfigurationen statt des gemeinsamen Plugin-Catch-all. Include-Pattern-Shards zeichnen Timing-Einträge mit dem CI-Shard-Namen auf, sodass `.artifacts/vitest-shard-timings.json` eine vollständige Konfiguration von einem gefilterten Shard unterscheiden kann. `check-additional` hält Package-Boundary-Compile-/Canary-Arbeit zusammen und trennt Runtime-Topologie-Architektur von Gateway-Watch-Abdeckung; die Boundary-Guard-Liste ist über vier Matrix-Shards gestreift, wobei jeder ausgewählte unabhängige Guards parallel ausführt und Timings pro Prüfung ausgibt, einschließlich `pnpm prompt:snapshots:check`, damit Prompt-Drift im Codex-Runtime-Happy-Path an den PR gebunden ist, der ihn verursacht hat. Gateway Watch, Channel-Tests und der Core-Support-Boundary-Shard laufen innerhalb von `build-artifacts` parallel, nachdem `dist/` und `dist-runtime/` bereits gebaut wurden.

Android-CI führt sowohl `testPlayDebugUnitTest` als auch `testThirdPartyDebugUnitTest` aus und baut anschließend das Play-Debug-APK. Der Third-Party-Flavor hat kein separates Source Set oder Manifest; seine Unit-Test-Lane kompiliert den Flavor dennoch mit den SMS-/Call-Log-BuildConfig-Flags, vermeidet aber bei jedem Android-relevanten Push einen doppelten Debug-APK-Packaging-Job.

Der `check-dependencies`-Shard führt `pnpm deadcode:dependencies` (einen reinen Produktions-Knip-Dependency-Durchlauf, der an die neueste Knip-Version gepinnt ist, wobei pnpm's Mindest-Release-Alter für die `dlx`-Installation deaktiviert ist) und `pnpm deadcode:unused-files` aus, das Knips Produktionsfunde ungenutzter Dateien mit `scripts/deadcode-unused-files.allowlist.mjs` vergleicht. Der Unused-File-Guard schlägt fehl, wenn ein PR eine neue, nicht geprüfte ungenutzte Datei hinzufügt oder einen veralteten Allowlist-Eintrag zurücklässt, während absichtliche dynamische Plugin-, generierte, Build-, Live-Test- und Package-Bridge-Oberflächen erhalten bleiben, die Knip nicht statisch auflösen kann.

## Weiterleitung von ClawSweeper-Aktivitäten

`.github/workflows/clawsweeper-dispatch.yml` ist die zielseitige Bridge von OpenClaw-Repository-Aktivität zu ClawSweeper. Sie checkt keinen nicht vertrauenswürdigen Pull-Request-Code aus und führt ihn nicht aus. Der Workflow erstellt aus `CLAWSWEEPER_APP_PRIVATE_KEY` ein GitHub-App-Token und dispatcht dann kompakte `repository_dispatch`-Payloads an `openclaw/clawsweeper`.

Der Workflow hat vier Lanes:

- `clawsweeper_item` für genaue Review-Anfragen zu Issues und Pull Requests;
- `clawsweeper_comment` für explizite ClawSweeper-Befehle in Issue-Kommentaren;
- `clawsweeper_commit_review` für Review-Anfragen auf Commit-Ebene bei `main`-Pushes;
- `github_activity` für allgemeine GitHub-Aktivität, die der ClawSweeper-Agent prüfen kann.

Die `github_activity`-Lane leitet nur normalisierte Metadaten weiter: Ereignistyp, Aktion, Akteur, Repository, Item-Nummer, URL, Titel, Status und kurze Auszüge für Kommentare oder Reviews, sofern vorhanden. Sie vermeidet bewusst die Weiterleitung des vollständigen Webhook-Bodys. Der empfangende Workflow in `openclaw/clawsweeper` ist `.github/workflows/github-activity.yml`, der das normalisierte Ereignis an den OpenClaw-Gateway-Hook für den ClawSweeper-Agent postet.

Allgemeine Aktivität ist Beobachtung, nicht standardmäßige Zustellung. Der ClawSweeper-Agent erhält das Discord-Ziel in seinem Prompt und sollte nur dann in `#clawsweeper` posten, wenn das Ereignis überraschend, handlungsrelevant, riskant oder betrieblich nützlich ist. Routinemäßiges Öffnen, Bearbeitungen, Bot-Fluktuation, doppelte Webhook-Geräusche und normaler Review-Verkehr sollten zu `NO_REPLY` führen.

Behandeln Sie GitHub-Titel, Kommentare, Bodys, Review-Texte, Branch-Namen und Commit-Nachrichten auf diesem gesamten Pfad als nicht vertrauenswürdige Daten. Sie sind Eingaben für Zusammenfassung und Triage, keine Anweisungen für den Workflow oder die Agent-Runtime.

## Manuelle Dispatches

Manuelle CI-Ausführungen verwenden denselben Job-Graphen wie normale CI, erzwingen aber jede nicht auf Android beschränkte Lane: Linux-Node-Shards, gebündelte Plugin-Shards, Channel Contracts, Node-22-Kompatibilität, `check`, `check-additional`, Build-Smoke, Docs-Prüfungen, Python-Skills, Windows, macOS und Control-UI-i18n. Eigenständige manuelle CI-Ausführungen führen Android nur mit `include_android=true` aus; das vollständige Release-Umbrella aktiviert Android durch Übergabe von `include_android=true`. Statische Plugin-Prerelease-Prüfungen, der nur für Releases vorgesehene `agentic-plugins`-Shard, der vollständige Batch-Sweep für Extensions und Plugin-Prerelease-Docker-Lanes sind von der CI ausgeschlossen. Die Docker-Prerelease-Suite läuft nur, wenn `Full Release Validation` den separaten Workflow `Plugin Prerelease` mit aktiviertem Release-Validation-Gate auslöst.

Manuelle Ausführungen verwenden eine eindeutige Concurrency-Gruppe, damit eine vollständige Release-Candidate-Suite nicht durch eine andere Push- oder PR-Ausführung auf demselben Ref abgebrochen wird. Die optionale Eingabe `target_ref` erlaubt einem vertrauenswürdigen Aufrufer, diesen Graphen gegen einen Branch, Tag oder vollständigen Commit-SHA auszuführen, während die Workflow-Datei aus dem ausgewählten Dispatch-Ref verwendet wird.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, schnelle Security-Jobs und Aggregate (`security-scm-fast`, `security-dependency-audit`, `security-fast`), schnelle Protokoll-/Contract-/Bundled-Prüfungen, geshardete Channel-Contract-Prüfungen, `check`-Shards außer Lint, `check-additional`-Aggregate, Node-Test-Aggregatverifizierer, Docs-Prüfungen, Python-Skills, workflow-sanity, labeler, auto-response; install-smoke-Preflight verwendet ebenfalls GitHub-gehostetes Ubuntu, damit die Blacksmith-Matrix früher in die Queue eingereiht werden kann |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, leichtere Extension-Shards, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` und `check-test-types`                                                                                                                                                                                                                                                                                                        |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux-Node-Test-Shards, gebündelte Plugin-Test-Shards, `check-additional`-Shards, `android`                                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (CPU-sensibel genug, dass 8 vCPU mehr kosteten, als sie einsparten); install-smoke-Docker-Builds (32-vCPU-Queue-Zeit kostete mehr, als sie einsparten)                                                                                                                                                                                                                                                                                                          |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` auf `openclaw/openclaw`; Forks fallen auf `macos-latest` zurück                                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` auf `openclaw/openclaw`; Forks fallen auf `macos-latest` zurück                                                                                                                                                                                                                                                                                                                                                                                      |

## Lokale Entsprechungen

```bash
pnpm changed:lanes                            # inspect the local changed-lane classifier for origin/main...HEAD
pnpm check:changed                            # smart local check gate: changed typecheck/lint/guards by boundary lane
pnpm check                                    # fast local gate: prod tsgo + sharded lint + parallel fast guards
pnpm check:test-types
pnpm check:timed                              # same gate with per-stage timings
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test                                     # vitest tests
pnpm test:changed                             # cheap smart changed Vitest targets
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs                               # docs format + lint + broken links
pnpm build                                    # build dist when CI artifact/build-smoke lanes matter
pnpm ci:timings                               # summarize the latest origin/main push CI run
pnpm ci:timings:recent                        # compare recent successful main CI runs
node scripts/ci-run-timings.mjs <run-id>      # summarize wall time, queue time, and slowest jobs
node scripts/ci-run-timings.mjs --latest-main # ignore issue/comment noise and choose origin/main push CI
node scripts/ci-run-timings.mjs --recent 10   # compare recent successful main CI runs
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
pnpm perf:kova:summary --report .artifacts/kova/reports/mock-provider/report.json --output .artifacts/kova/summary.md
```

## OpenClaw-Leistung

`OpenClaw Performance` ist der Produkt-/Runtime-Performance-Workflow. Er läuft täglich auf `main` und kann manuell ausgelöst werden:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Ein manueller Dispatch benchmarked normalerweise den Workflow-Ref. Setzen Sie `target_ref`, um ein Release-Tag oder einen anderen Branch mit der aktuellen Workflow-Implementierung zu benchmarken. Veröffentlichte Berichtspfade und Latest-Pointer werden nach dem getesteten Ref geschlüsselt, und jede `index.md` zeichnet den getesteten Ref/SHA, Workflow-Ref/SHA, Kova-Ref, Profil, Lane-Auth-Modus, Modell, Wiederholungsanzahl und Szenariofilter auf.

Der Workflow installiert OCM aus einem gepinnten Release und Kova aus `openclaw/Kova` mit der gepinnten Eingabe `kova_ref` und führt dann drei Lanes aus:

- `mock-provider`: Kova-Diagnoseszenarien gegen eine Runtime aus lokalem Build mit deterministischer gefälschter OpenAI-kompatibler Authentifizierung.
- `mock-deep-profile`: CPU-/Heap-/Trace-Profiling für Startup-, Gateway- und Agent-Turn-Hotspots.
- `live-gpt54`: ein echter OpenAI-`openai/gpt-5.4`-Agent-Turn, der übersprungen wird, wenn `OPENAI_API_KEY` nicht verfügbar ist.

Die mock-provider-Lane führt nach dem Kova-Durchlauf außerdem OpenClaw-native Source-Probes aus: Gateway-Boot-Timing und Speicher über Standard-, Hook- und 50-Plugin-Startup-Fälle hinweg; wiederholte Mock-OpenAI-`channel-chat-baseline`-Hello-Loops; und CLI-Startup-Befehle gegen das gestartete Gateway. Die Markdown-Zusammenfassung der Source-Probe liegt unter `source/index.md` im Berichtsbundle, mit Roh-JSON daneben.

Jede Lane lädt GitHub-Artefakte hoch. Wenn `CLAWGRIT_REPORTS_TOKEN` konfiguriert ist, committet der Workflow außerdem `report.json`, `report.md`, Bundles, `index.md` und Source-Probe-Artefakte nach `openclaw/clawgrit-reports` unter `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Der aktuelle Pointer für den getesteten Ref wird als `openclaw-performance/<tested-ref>/latest-<lane>.json` geschrieben.

## Vollständige Release-Validierung

`Full Release Validation` ist der manuelle Umbrella-Workflow für „alles vor dem Release ausführen“. Er akzeptiert einen Branch, Tag oder vollständigen Commit-SHA, löst den manuellen Workflow `CI` mit diesem Ziel aus, löst `Plugin Prerelease` für nur releasebezogene Plugin-/Package-/statische/Docker-Nachweise aus und löst `OpenClaw Release Checks` für Install-Smoke, Package Acceptance, Cross-OS-Package-Prüfungen, QA-Lab-Parität, Matrix- und Telegram-Lanes aus. Stabile/standardmäßige Ausführungen halten erschöpfende Live-/E2E- und Docker-Release-Path-Abdeckung hinter `run_release_soak=true`; `release_profile=full` erzwingt diese Soak-Abdeckung, damit breite Advisory-Validierung breit bleibt. Mit `rerun_group=all` und `release_profile=full` führt er außerdem `NPM Telegram Beta E2E` gegen das Artefakt `release-package-under-test` aus den Release-Prüfungen aus. Übergeben Sie nach der Veröffentlichung `npm_telegram_package_spec`, um dieselbe Telegram-Package-Lane gegen das veröffentlichte npm-Package erneut auszuführen.

Siehe [Vollständige Release-Validierung](/de/reference/full-release-validation) für die
Stage-Matrix, exakten Workflow-Job-Namen, Profilunterschiede, Artefakte und
gezielten Rerun-Handles.

`OpenClaw Release Publish` ist der manuelle mutierende Release-Workflow. Lösen Sie ihn
von `release/YYYY.M.D` oder `main` aus, nachdem das Release-Tag existiert und nachdem der
OpenClaw-npm-Preflight erfolgreich war. Er verifiziert `pnpm plugins:sync:check`,
löst `Plugin NPM Release` für alle veröffentlichbaren Plugin-Packages aus, löst
`Plugin ClawHub Release` für denselben Release-SHA aus und löst erst dann
`OpenClaw NPM Release` mit der gespeicherten `preflight_run_id` aus.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Für gepinnten Commit-Nachweis auf einem schnelllebigen Branch verwenden Sie den Helper statt
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub-Workflow-Dispatch-Refs müssen Branches oder Tags sein, keine rohen Commit-SHAs. Der
Helper pusht einen temporären Branch `release-ci/<sha>-...` am Ziel-SHA,
löst `Full Release Validation` von diesem gepinnten Ref aus, verifiziert, dass jeder untergeordnete
Workflow-`headSha` dem Ziel entspricht, und löscht den temporären Branch, wenn die
Ausführung abgeschlossen ist. Der Umbrella-Verifizierer schlägt außerdem fehl, wenn ein untergeordneter Workflow mit einem
anderen SHA ausgeführt wurde.

`release_profile` steuert die Live-/Provider-Breite, die an Release-Prüfungen übergeben wird. Die
manuellen Release-Workflows verwenden standardmäßig `stable`; verwenden Sie `full` nur, wenn Sie
absichtlich die breite, beratende Provider-/Medienmatrix möchten. `run_release_soak`
steuert, ob stabile/standardmäßige Release-Prüfungen den umfassenden Live-/E2E- und
Docker-Dauertest für den Release-Pfad ausführen; `full` erzwingt den Dauertest.

- `minimum` behält die schnellsten OpenAI-/Core-Release-kritischen Lanes bei.
- `stable` fügt das stabile Provider-/Backend-Set hinzu.
- `full` führt die breite, beratende Provider-/Medienmatrix aus.

Der Umbrella zeichnet die IDs der ausgelösten untergeordneten Runs auf, und der abschließende Job `Verify full validation` prüft die aktuellen Ergebnisse der untergeordneten Runs erneut und hängt Tabellen der langsamsten Jobs für jeden untergeordneten Run an. Wenn ein untergeordneter Workflow erneut ausgeführt wird und grün wird, führen Sie nur den übergeordneten Verifier-Job erneut aus, um das Umbrella-Ergebnis und die Timing-Zusammenfassung zu aktualisieren.

Für die Wiederherstellung akzeptieren sowohl `Full Release Validation` als auch `OpenClaw Release Checks` `rerun_group`. Verwenden Sie `all` für einen Release-Kandidaten, `ci` nur für das normale untergeordnete Full-CI, `plugin-prerelease` nur für das untergeordnete Plugin-Prerelease, `release-checks` für jedes untergeordnete Release, oder eine engere Gruppe: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` oder `npm-telegram` auf dem Umbrella. Dadurch bleibt die erneute Ausführung einer fehlgeschlagenen Release-Box nach einem fokussierten Fix begrenzt. Für eine einzelne fehlgeschlagene Cross-OS-Lane kombinieren Sie `rerun_group=cross-os` mit `cross_os_suite_filter`, zum Beispiel `windows/packaged-upgrade`; lange Cross-OS-Befehle geben Heartbeat-Zeilen aus, und Packaged-Upgrade-Zusammenfassungen enthalten Timings pro Phase. QA-Release-Check-Lanes sind beratend, daher warnen reine QA-Fehler, blockieren den Release-Check-Verifier aber nicht.

`OpenClaw Release Checks` verwendet die vertrauenswürdige Workflow-Ref, um die ausgewählte Ref einmal in ein `release-package-under-test`-Tarball aufzulösen, und übergibt dieses Artefakt dann an Cross-OS-Prüfungen und Package Acceptance sowie an den Live-/E2E-Docker-Workflow für den Release-Pfad, wenn die Dauertest-Abdeckung läuft. Dadurch bleiben die Paketbytes über Release-Boxen hinweg konsistent, und derselbe Kandidat muss nicht in mehreren untergeordneten Jobs neu gepackt werden.

Doppelte `Full Release Validation`-Runs für `ref=main` und `rerun_group=all`
ersetzen den älteren Umbrella. Der übergeordnete Monitor bricht jeden untergeordneten Workflow ab, den
er bereits ausgelöst hat, wenn der übergeordnete Run abgebrochen wird, sodass neuere Main-Validierung
nicht hinter einem veralteten zweistündigen Release-Check-Run warten muss. Release-Branch-/Tag-
Validierung und fokussierte Rerun-Gruppen behalten `cancel-in-progress: false` bei.

## Live- und E2E-Shards

Das untergeordnete Release-Live-/E2E behält die breite native `pnpm test:live`-Abdeckung bei, führt sie jedoch als benannte Shards über `scripts/test-live-shard.mjs` aus, statt als einen seriellen Job:

- `native-live-src-agents`
- `native-live-src-gateway-core`
- Provider-gefilterte `native-live-src-gateway-profiles`-Jobs
- `native-live-src-gateway-backends`
- `native-live-test`
- `native-live-extensions-a-k`
- `native-live-extensions-l-n`
- `native-live-extensions-openai`
- `native-live-extensions-o-z-other`
- `native-live-extensions-xai`
- aufgeteilte Medien-Audio-/Video-Shards und Provider-gefilterte Musik-Shards

Dadurch bleibt dieselbe Dateiabdeckung erhalten, während langsame Live-Provider-Fehler leichter erneut ausgeführt und diagnostiziert werden können. Die aggregierten Shard-Namen `native-live-extensions-o-z`, `native-live-extensions-media` und `native-live-extensions-media-music` bleiben für manuelle einmalige Reruns gültig.

Die nativen Live-Medien-Shards laufen in `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, gebaut vom Workflow `Live Media Runner Image`. Dieses Image installiert `ffmpeg` und `ffprobe` vor; Medienjobs prüfen vor dem Setup nur die Binärdateien. Lassen Sie Docker-gestützte Live-Suites auf normalen Blacksmith-Runnern; Container-Jobs sind der falsche Ort, um verschachtelte Docker-Tests zu starten.

Docker-gestützte Live-Modell-/Backend-Shards verwenden pro ausgewähltem Commit ein separates gemeinsames Image `ghcr.io/openclaw/openclaw-live-test:<sha>`. Der Live-Release-Workflow baut und pusht dieses Image einmal, danach laufen die Docker-Live-Modell-, Provider-geshardeten Gateway-, CLI-Backend-, ACP-Bind- und Codex-Harness-Shards mit `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gateway-Docker-Shards tragen explizite Timeout-Obergrenzen auf Skriptebene unterhalb des Workflow-Job-Timeouts, damit ein hängender Container oder Cleanup-Pfad schnell fehlschlägt, statt das gesamte Release-Check-Budget zu verbrauchen. Wenn diese Shards das vollständige Source-Docker-Target unabhängig neu bauen, ist der Release-Run falsch konfiguriert und verschwendet Laufzeit mit doppelten Image-Builds.

## Package Acceptance

Verwenden Sie `Package Acceptance`, wenn die Frage lautet: „Funktioniert dieses installierbare OpenClaw-Paket als Produkt?“ Es unterscheidet sich von normalem CI: Normales CI validiert den Source Tree, während Package Acceptance ein einzelnes Tarball über dasselbe Docker-E2E-Harness validiert, das Nutzer nach Installation oder Update ausführen.

### Jobs

1. `resolve_package` checkt `workflow_ref` aus, löst einen Paketkandidaten auf, schreibt `.artifacts/docker-e2e-package/openclaw-current.tgz`, schreibt `.artifacts/docker-e2e-package/package-candidate.json`, lädt beide als Artefakt `package-under-test` hoch und gibt Quelle, Workflow-Ref, Paket-Ref, Version, SHA-256 und Profil in der GitHub-Schrittzusammenfassung aus.
2. `docker_acceptance` ruft `openclaw-live-and-e2e-checks-reusable.yml` mit `ref=workflow_ref` und `package_artifact_name=package-under-test` auf. Der wiederverwendbare Workflow lädt dieses Artefakt herunter, validiert das Tarball-Inventar, bereitet bei Bedarf Package-Digest-Docker-Images vor und führt die ausgewählten Docker-Lanes gegen dieses Paket aus, statt den Workflow-Checkout zu packen. Wenn ein Profil mehrere gezielte `docker_lanes` auswählt, bereitet der wiederverwendbare Workflow das Paket und gemeinsame Images einmal vor und fächert diese Lanes dann als parallele gezielte Docker-Jobs mit eindeutigen Artefakten auf.
3. `package_telegram` ruft optional `NPM Telegram Beta E2E` auf. Es läuft, wenn `telegram_mode` nicht `none` ist, und installiert dasselbe Artefakt `package-under-test`, wenn Package Acceptance eines aufgelöst hat; ein eigenständiger Telegram-Dispatch kann weiterhin eine veröffentlichte npm-Spezifikation installieren.
4. `summary` lässt den Workflow fehlschlagen, wenn Paketauflösung, Docker Acceptance oder die optionale Telegram-Lane fehlgeschlagen ist.

### Kandidatenquellen

- `source=npm` akzeptiert nur `openclaw@beta`, `openclaw@latest` oder eine exakte OpenClaw-Release-Version wie `openclaw@2026.4.27-beta.2`. Verwenden Sie dies für die Acceptance veröffentlichter Prerelease-/Stable-Versionen.
- `source=ref` packt einen vertrauenswürdigen `package_ref`-Branch, -Tag oder vollständigen Commit-SHA. Der Resolver ruft OpenClaw-Branches/-Tags ab, verifiziert, dass der ausgewählte Commit aus der Repository-Branch-Historie oder einem Release-Tag erreichbar ist, installiert Abhängigkeiten in einem detached Worktree und packt ihn mit `scripts/package-openclaw-for-docker.mjs`.
- `source=url` lädt ein HTTPS-`.tgz` herunter; `package_sha256` ist erforderlich.
- `source=artifact` lädt ein `.tgz` von `artifact_run_id` und `artifact_name` herunter; `package_sha256` ist optional, sollte aber für extern geteilte Artefakte angegeben werden.

Halten Sie `workflow_ref` und `package_ref` getrennt. `workflow_ref` ist der vertrauenswürdige Workflow-/Harness-Code, der den Test ausführt. `package_ref` ist der Source-Commit, der gepackt wird, wenn `source=ref` verwendet wird. Dadurch kann das aktuelle Test-Harness ältere vertrauenswürdige Source-Commits validieren, ohne alte Workflow-Logik auszuführen.

### Suite-Profile

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — vollständige Docker-Release-Pfad-Chunks mit OpenWebUI
- `custom` — exakte `docker_lanes`; erforderlich, wenn `suite_profile=custom`

Das Profil `package` verwendet Offline-Plugin-Abdeckung, sodass die Validierung veröffentlichter Pakete nicht von Live-ClawHub-Verfügbarkeit abhängt. Die optionale Telegram-Lane verwendet das Artefakt `package-under-test` in `NPM Telegram Beta E2E` wieder; der veröffentlichte npm-Spezifikationspfad bleibt für eigenständige Dispatches erhalten.

Die dedizierte Richtlinie für Update- und Plugin-Tests, einschließlich lokaler Befehle,
Docker-Lanes, Package-Acceptance-Eingaben, Release-Standards und Fehlertriage,
finden Sie unter [Updates und Plugins testen](/de/help/testing-updates-plugins).

Release-Prüfungen rufen Package Acceptance mit `source=artifact`, dem vorbereiteten Release-Paketartefakt, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'` und `telegram_mode=mock-openai` auf. Dadurch bleiben Paketmigration, Update, Cleanup veralteter Plugin-Abhängigkeiten, Reparatur konfigurierter Plugin-Installationen, Offline-Plugin, Plugin-Update und Telegram-Nachweis auf demselben aufgelösten Paket-Tarball. Setzen Sie `package_acceptance_package_spec` in Full Release Validation oder OpenClaw Release Checks, um dieselbe Matrix gegen ein ausgeliefertes npm-Paket statt gegen das aus dem SHA gebaute Artefakt auszuführen. Cross-OS-Release-Prüfungen decken weiterhin OS-spezifisches Onboarding, Installer- und Plattformverhalten ab; Produktvalidierung für Paket/Update sollte mit Package Acceptance beginnen. Die Docker-Lane `published-upgrade-survivor` validiert im blockierenden Release-Pfad pro Run eine veröffentlichte Paketbaseline. In Package Acceptance ist das aufgelöste Tarball `package-under-test` immer der Kandidat, und `published_upgrade_survivor_baseline` wählt die veröffentlichte Fallback-Baseline aus, standardmäßig `openclaw@latest`; Befehle zum erneuten Ausführen fehlgeschlagener Lanes behalten diese Baseline bei. Full Release Validation mit `run_release_soak=true` oder `release_profile=full` setzt `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` und `published_upgrade_survivor_scenarios=reported-issues`, um auf die vier neuesten stabilen npm-Releases plus gepinnte Plugin-Kompatibilitätsgrenz-Releases und issue-förmige Fixtures für Feishu-Konfiguration, beibehaltene Bootstrap-/Persona-Dateien, konfigurierte OpenClaw-Plugin-Installationen, Tilde-Logpfade und veraltete Legacy-Plugin-Abhängigkeitswurzeln zu erweitern. Published-Upgrade-Survivor-Auswahlen mit mehreren Baselines werden nach Baseline in separate gezielte Docker-Runner-Jobs geshardet. Der separate Workflow `Update Migration` verwendet die Docker-Lane `update-migration` mit `all-since-2026.4.23` und `plugin-deps-cleanup`, wenn es um umfassendes Cleanup veröffentlichter Updates geht, nicht um normale Full-Release-CI-Breite. Lokale aggregierte Runs können exakte Paketspezifikationen mit `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` übergeben, eine einzelne Lane mit `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` wie `openclaw@2026.4.15` beibehalten oder `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` für die Szenario-Matrix setzen. Die veröffentlichte Lane konfiguriert die Baseline mit einem eingebetteten `openclaw config set`-Befehlsrezept, zeichnet Rezeptschritte in `summary.json` auf und prüft `/healthz`, `/readyz` sowie den RPC-Status nach dem Start des Gateway. Die Windows-Packaged- und Installer-Fresh-Lanes prüfen außerdem, dass ein installiertes Paket einen Browser-Control-Override aus einem rohen absoluten Windows-Pfad importieren kann. Der OpenAI-Cross-OS-Agent-Turn-Smoke verwendet standardmäßig `OPENCLAW_CROSS_OS_OPENAI_MODEL`, wenn gesetzt, andernfalls `openai/gpt-5.4`, sodass der Installations- und Gateway-Nachweis auf einem GPT-5-Testmodell bleibt und GPT-4.x-Standards vermieden werden.

### Legacy-Kompatibilitätsfenster

Package Acceptance hat begrenzte Legacy-Kompatibilitätsfenster für bereits veröffentlichte Pakete. Pakete bis einschließlich `2026.4.25`, einschließlich `2026.4.25-beta.*`, können den Kompatibilitätspfad verwenden:

- bekannte private QA-Einträge in `dist/postinstall-inventory.json` dürfen auf Dateien verweisen, die im Tarball ausgelassen wurden;
- `doctor-switch` darf den Unterfall zur Persistenz von `gateway install --wrapper` überspringen, wenn das Paket dieses Flag nicht verfügbar macht;
- `update-channel-switch` darf fehlende `pnpm.patchedDependencies` aus dem vom Tarball abgeleiteten gefälschten Git-Fixture entfernen und fehlendes persistiertes `update.channel` protokollieren;
- Plugin-Smokes dürfen Legacy-Install-Record-Orte lesen oder fehlende Marketplace-Install-Record-Persistenz akzeptieren;
- `plugin-update` darf die Migration von Konfigurationsmetadaten zulassen, während weiterhin erforderlich ist, dass Install-Record- und No-Reinstall-Verhalten unverändert bleiben.

Das veröffentlichte Paket `2026.4.26` kann auch für lokale Build-Metadaten-Stempeldateien warnen, die bereits ausgeliefert wurden. Spätere Pakete müssen die modernen Verträge erfüllen; dieselben Bedingungen schlagen dann fehl, statt zu warnen oder übersprungen zu werden.

### Beispiele

```bash
# Validate the current beta package with product-level coverage.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai

# Pack and validate a release branch with the current harness.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=ref \
  -f package_ref=release/YYYY.M.D \
  -f suite_profile=package \
  -f telegram_mode=mock-openai

# Validate a tarball URL. SHA-256 is mandatory for source=url.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=url \
  -f package_url=https://example.com/openclaw-current.tgz \
  -f package_sha256=<64-char-sha256> \
  -f suite_profile=smoke

# Reuse a tarball uploaded by another Actions run.
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=package-under-test \
  -f suite_profile=custom \
  -f docker_lanes='install-e2e plugin-update'
```

Wenn Sie einen fehlgeschlagenen Package-Acceptance-Lauf debuggen, beginnen Sie bei der Zusammenfassung `resolve_package`, um Paketquelle, Version und SHA-256 zu bestätigen. Prüfen Sie anschließend den untergeordneten Lauf `docker_acceptance` und seine Docker-Artefakte: `.artifacts/docker-tests/**/summary.json`, `failures.json`, Lane-Logs, Phasen-Timings und Befehle zum erneuten Ausführen. Führen Sie bevorzugt das fehlgeschlagene Paketprofil oder die exakten Docker-Lanes erneut aus, statt die vollständige Release-Validierung erneut zu starten.

## Installations-Smoke

Der separate Workflow `Install Smoke` verwendet dasselbe Scope-Skript über seinen eigenen Job `preflight` wieder. Er teilt die Smoke-Abdeckung in `run_fast_install_smoke` und `run_full_install_smoke` auf.

- **Schneller Pfad** läuft für Pull Requests, die Docker-/Paket-Oberflächen berühren, Änderungen an gebündelten Plugin-Paketen/-Manifesten oder Core-Plugin-/Channel-/Gateway-/Plugin-SDK-Oberflächen, die von den Docker-Smoke-Jobs ausgeübt werden. Reine Quelländerungen an gebündelten Plugins, reine Teständerungen und reine Dokumentationsänderungen reservieren keine Docker-Worker. Der schnelle Pfad baut das Root-Dockerfile-Image einmal, prüft die CLI, führt den CLI-Smoke für das Löschen von Agents in gemeinsam genutzten Workspaces aus, führt den Container-Gateway-Netzwerk-E2E aus, verifiziert ein Build-Argument für gebündelte Erweiterungen und führt das begrenzte Docker-Profil für gebündelte Plugins unter einem aggregierten Befehls-Timeout von 240 Sekunden aus (jeder Docker-Lauf eines Szenarios wird separat begrenzt).
- **Vollständiger Pfad** behält QR-Paketinstallation und Installer-Docker-/Update-Abdeckung für nächtliche geplante Läufe, manuelle Dispatches, Workflow-Call-Release-Prüfungen und Pull Requests bei, die wirklich Installer-/Paket-/Docker-Oberflächen berühren. Im vollständigen Modus bereitet Install-Smoke ein Root-Dockerfile-Smoke-Image für die Ziel-SHA in GHCR vor oder verwendet es wieder. Danach laufen QR-Paketinstallation, Root-Dockerfile-/Gateway-Smokes, Installer-/Update-Smokes und der schnelle Docker-E2E für gebündelte Plugins als separate Jobs, damit Installer-Arbeit nicht hinter den Root-Image-Smokes warten muss.

`main`-Pushes (einschließlich Merge-Commits) erzwingen den vollständigen Pfad nicht; wenn die Changed-Scope-Logik bei einem Push vollständige Abdeckung anfordern würde, behält der Workflow den schnellen Docker-Smoke bei und überlässt den vollständigen Install-Smoke der nächtlichen oder Release-Validierung.

Der langsame Bun-Global-Install-Image-Provider-Smoke wird separat über `run_bun_global_install_smoke` gesteuert. Er läuft im nächtlichen Zeitplan und aus dem Release-Checks-Workflow; manuelle `Install Smoke`-Dispatches können ihn aktivieren, Pull Requests und `main`-Pushes jedoch nicht. QR- und Installer-Docker-Tests behalten ihre eigenen installationsfokussierten Dockerfiles.

## Lokaler Docker-E2E

`pnpm test:docker:all` baut ein gemeinsames Live-Test-Image vor, packt OpenClaw einmal als npm-Tarball und baut zwei gemeinsame `scripts/e2e/Dockerfile`-Images:

- einen schlanken Node/Git-Runner für Installer-/Update-/Plugin-Abhängigkeits-Lanes;
- ein funktionales Image, das denselben Tarball für normale Funktions-Lanes in `/app` installiert.

Docker-Lane-Definitionen liegen in `scripts/lib/docker-e2e-scenarios.mjs`, die Planner-Logik liegt in `scripts/lib/docker-e2e-plan.mjs`, und der Runner führt nur den ausgewählten Plan aus. Der Scheduler wählt das Image pro Lane mit `OPENCLAW_DOCKER_E2E_BARE_IMAGE` und `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` aus und führt Lanes dann mit `OPENCLAW_SKIP_DOCKER_BUILD=1` aus.

### Einstellbare Optionen

| Variable                               | Standard | Zweck                                                                                         |
| -------------------------------------- | -------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10       | Slot-Anzahl des Haupt-Pools für normale Lanes.                                                 |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10       | Slot-Anzahl des Provider-sensitiven Tail-Pools.                                                |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9        | Obergrenze für gleichzeitige Live-Lanes, damit Provider nicht drosseln.                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10       | Obergrenze für gleichzeitige npm-Install-Lanes.                                                |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7        | Obergrenze für gleichzeitige Multi-Service-Lanes.                                             |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000     | Versatz zwischen Lane-Starts, um Docker-Daemon-Create-Stürme zu vermeiden; `0` deaktiviert den Versatz. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000  | Fallback-Timeout pro Lane (120 Minuten); ausgewählte Live-/Tail-Lanes verwenden engere Grenzen. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset    | `1` gibt den Scheduler-Plan aus, ohne Lanes auszuführen.                                      |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset    | Durch Kommas getrennte exakte Lane-Liste; überspringt Cleanup-Smoke, damit Agents eine fehlgeschlagene Lane reproduzieren können. |

Eine Lane, die schwerer als ihre effektive Obergrenze ist, kann dennoch aus einem leeren Pool starten und läuft dann allein, bis sie Kapazität freigibt. Die lokale Aggregation prüft Docker vorab, entfernt veraltete OpenClaw-E2E-Container, gibt den Status aktiver Lanes aus, persistiert Lane-Timings für eine Longest-First-Reihenfolge und plant standardmäßig nach dem ersten Fehler keine neuen gepoolten Lanes mehr ein.

### Wiederverwendbarer Live-/E2E-Workflow

Der wiederverwendbare Live-/E2E-Workflow fragt `scripts/test-docker-all.mjs --plan-json`, welche Paket-, Image-Art-, Live-Image-, Lane- und Credential-Abdeckung erforderlich ist. `scripts/docker-e2e.mjs` wandelt diesen Plan dann in GitHub-Ausgaben und Zusammenfassungen um. Er packt OpenClaw entweder über `scripts/package-openclaw-for-docker.mjs`, lädt ein Paketartefakt aus dem aktuellen Lauf herunter oder lädt ein Paketartefakt aus `package_artifact_run_id` herunter; validiert das Tarball-Inventar; baut und pusht paket-digest-getaggte Bare-/Functional-GHCR-Docker-E2E-Images über Blacksmiths Docker-Layer-Cache, wenn der Plan Lanes mit installiertem Paket benötigt; und verwendet bereitgestellte Eingaben `docker_e2e_bare_image`/`docker_e2e_functional_image` oder vorhandene Paket-Digest-Images wieder, statt neu zu bauen. Docker-Image-Pulls werden mit einem begrenzten Timeout von 180 Sekunden pro Versuch erneut versucht, damit ein hängender Registry-/Cache-Stream schnell neu gestartet wird, statt den Großteil des kritischen CI-Pfads zu verbrauchen.

### Release-Pfad-Chunks

Release-Docker-Abdeckung läuft in kleineren Chunk-Jobs mit `OPENCLAW_SKIP_DOCKER_BUILD=1`, sodass jeder Chunk nur die benötigte Image-Art zieht und mehrere Lanes über denselben gewichteten Scheduler ausführt:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Aktuelle Release-Docker-Chunks sind `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` sowie `plugins-runtime-install-a` bis `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` und `plugins-integrations` bleiben aggregierte Plugin-/Runtime-Aliasse. Der Lane-Alias `install-e2e` bleibt der aggregierte manuelle Alias zum erneuten Ausführen für beide Provider-Installer-Lanes.

OpenWebUI wird in `plugins-runtime-services` integriert, wenn vollständige Release-Pfad-Abdeckung dies anfordert, und behält nur für reine OpenWebUI-Dispatches einen eigenständigen Chunk `openwebui`. Update-Lanes für gebündelte Channels versuchen bei transienten npm-Netzwerkfehlern einmal erneut.

Jeder Chunk lädt `.artifacts/docker-tests/` mit Lane-Logs, Timings, `summary.json`, `failures.json`, Phasen-Timings, Scheduler-Plan-JSON, Tabellen langsamer Lanes und Befehlen zum erneuten Ausführen pro Lane hoch. Die Workflow-Eingabe `docker_lanes` führt ausgewählte Lanes gegen die vorbereiteten Images aus, statt die Chunk-Jobs zu verwenden. Dadurch bleibt das Debuggen fehlgeschlagener Lanes auf einen gezielten Docker-Job begrenzt, und das Paketartefakt für diesen Lauf wird vorbereitet, heruntergeladen oder wiederverwendet; wenn eine ausgewählte Lane eine Live-Docker-Lane ist, baut der gezielte Job das Live-Test-Image lokal für diesen erneuten Lauf. Generierte GitHub-Befehle zum erneuten Ausführen pro Lane enthalten `package_artifact_run_id`, `package_artifact_name` und vorbereitete Image-Eingaben, sofern diese Werte vorhanden sind, damit eine fehlgeschlagene Lane exakt dasselbe Paket und dieselben Images aus dem fehlgeschlagenen Lauf wiederverwenden kann.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Der geplante Live-/E2E-Workflow führt die vollständige Release-Pfad-Docker-Suite täglich aus.

## Plugin-Prerelease

`Plugin Prerelease` ist teurere Produkt-/Paket-Abdeckung und daher ein separater Workflow, der von `Full Release Validation` oder durch einen expliziten Operator ausgelöst wird. Normale Pull Requests, `main`-Pushes und eigenständige manuelle CI-Dispatches lassen diese Suite deaktiviert. Er verteilt Tests gebündelter Plugins auf acht Extension-Worker; diese Extension-Shard-Jobs führen bis zu zwei Plugin-Konfigurationsgruppen gleichzeitig mit einem Vitest-Worker pro Gruppe und einem größeren Node-Heap aus, damit importlastige Plugin-Batches keine zusätzlichen CI-Jobs erzeugen. Der nur für Releases vorgesehene Docker-Prerelease-Pfad bündelt gezielte Docker-Lanes in kleinen Gruppen, um nicht Dutzende Runner für ein- bis dreiminütige Jobs zu reservieren.

## QA Lab

QA Lab hat dedizierte CI-Lanes außerhalb des wichtigsten Smart-Scoped-Workflows. Agentische Parität ist unter den breiten QA- und Release-Harnesses verschachtelt und kein eigenständiger PR-Workflow. Verwenden Sie `Full Release Validation` mit `rerun_group=qa-parity`, wenn Parität zusammen mit einem breiten Validierungslauf laufen soll.

- Der Workflow `QA-Lab - All Lanes` läuft nächtlich auf `main` und bei manuellem Dispatch; er fächert die Mock-Paritäts-Lane, die Live-Matrix-Lane sowie die Live-Telegram- und Discord-Lanes als parallele Jobs auf. Live-Jobs verwenden die Umgebung `qa-live-shared`, und Telegram/Discord verwenden Convex-Leases.

Release-Prüfungen führen Matrix- und Telegram-Live-Transport-Lanes mit dem deterministischen Mock-Provider und mock-qualifizierten Modellen (`mock-openai/gpt-5.5` und `mock-openai/gpt-5.5-alt`) aus, sodass der Channel-Vertrag von Live-Modelllatenz und normalem Start von Provider-Plugins isoliert ist. Das Live-Transport-Gateway deaktiviert die Speichersuche, weil QA-Parität Speicherverhalten separat abdeckt; Provider-Konnektivität wird durch die separaten Live-Modell-, nativen Provider- und Docker-Provider-Suites abgedeckt.

Matrix verwendet `--profile fast` für geplante und Release-Gates und fügt `--fail-fast` nur hinzu, wenn die ausgecheckte CLI dies unterstützt. Der CLI-Standardwert und die manuelle Workflow-Eingabe bleiben `all`; ein manueller Dispatch mit `matrix_profile=all` shardet die vollständige Matrix-Abdeckung immer in die Jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` und `e2ee-cli`.

`OpenClaw Release Checks` führt außerdem die releasekritischen QA-Lab-Lanes vor der Release-Freigabe aus; sein QA-Paritäts-Gate führt Kandidaten- und Baseline-Packs als parallele Lane-Jobs aus und lädt anschließend beide Artefakte in einen kleinen Report-Job für den abschließenden Paritätsvergleich herunter.

Für normale PRs folgen Sie scoped CI-/Check-Nachweisen, statt Parität als erforderlichen Status zu behandeln.

## CodeQL

Der `CodeQL`-Workflow ist bewusst ein schmaler Sicherheits-Scanner für den ersten Durchlauf, nicht der vollständige Repository-Sweep. Tägliche, manuelle und Guard-Läufe für nicht als Entwurf markierte Pull Requests scannen Actions-Workflow-Code sowie die risikoreichsten JavaScript-/TypeScript-Flächen mit Sicherheitsabfragen hoher Konfidenz, gefiltert auf hohe/kritische `security-severity`.

Der Pull-Request-Guard bleibt leichtgewichtig: Er startet nur bei Änderungen unter `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` oder `src` und führt dieselbe Sicherheitsmatrix hoher Konfidenz wie der geplante Workflow aus. Android- und macOS-CodeQL bleiben außerhalb der PR-Standards.

### Sicherheitskategorien

| Kategorie                                         | Fläche                                                                                                                              |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Authentifizierung, Secrets, Sandbox, Cron und Gateway-Baseline                                                                      |
| `/codeql-security-high/channel-runtime-boundary`  | Core-Channel-Implementierungsverträge plus Channel-Plugin-Runtime, Gateway, Plugin SDK, Secrets, Audit-Berührungspunkte             |
| `/codeql-security-high/network-ssrf-boundary`     | Core-SSRF, IP-Parsing, Netzwerkschutz, Web-Fetch und SSRF-Policy-Flächen des Plugin SDK                                             |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP-Server, Hilfen zur Prozessausführung, ausgehende Zustellung und Gates für Agent-Tool-Ausführung                                 |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin-Installation, Loader, Manifest, Registry, Paketmanager-Installation, Source-Loading und Trust-Flächen des Plugin-SDK-Paketvertrags |

### Plattformspezifische Sicherheits-Shards

- `CodeQL Android Critical Security` — geplanter Android-Sicherheits-Shard. Baut die Android-App manuell für CodeQL auf dem kleinsten Blacksmith-Linux-Runner, den die Workflow-Sanity akzeptiert. Lädt unter `/codeql-critical-security/android` hoch.
- `CodeQL macOS Critical Security` — wöchentlicher/manueller macOS-Sicherheits-Shard. Baut die macOS-App manuell für CodeQL auf Blacksmith macOS, filtert Dependency-Build-Ergebnisse aus dem hochgeladenen SARIF heraus und lädt unter `/codeql-critical-security/macos` hoch. Bleibt außerhalb der täglichen Standards, weil der macOS-Build selbst bei sauberem Lauf die Laufzeit dominiert.

### Critical-Quality-Kategorien

`CodeQL Critical Quality` ist der passende Nicht-Sicherheits-Shard. Er führt nur JavaScript-/TypeScript-Qualitätsabfragen mit Fehler-Schweregrad und ohne Sicherheitsbezug über schmale, hochwertige Flächen auf dem kleineren Blacksmith-Linux-Runner aus. Sein Pull-Request-Guard ist bewusst kleiner als das geplante Profil: Nicht als Entwurf markierte PRs führen nur die passenden Shards `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` und `plugin-sdk-reply-runtime` für Änderungen an Agent-Befehl-/Modell-/Tool-Ausführung und Reply-Dispatch-Code, Config-Schema-/Migrations-/IO-Code, Auth-/Secrets-/Sandbox-/Sicherheitscode, Core-Channel- und gebündelter Channel-Plugin-Runtime, Gateway-Protokoll-/Server-Methoden, Memory-Runtime-/SDK-Glue, MCP-/Prozess-/ausgehender Zustellung, Provider-Runtime-/Modellkatalog, Session-Diagnose-/Zustellungswarteschlangen, Plugin-Loader, Plugin-SDK-/Paketvertrag oder Plugin-SDK-Reply-Runtime aus. Änderungen an CodeQL-Config und Quality-Workflow führen alle zwölf PR-Quality-Shards aus.

Manuelle Dispatches akzeptieren:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Die schmalen Profile sind Lehr-/Iterations-Hooks, um einen Quality-Shard isoliert auszuführen.

| Kategorie                                               | Fläche                                                                                                                                                            |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Authentifizierung, Secrets, Sandbox, Cron und Code an der Gateway-Sicherheitsgrenze                                                                               |
| `/codeql-critical-quality/config-boundary`              | Config-Schema, Migration, Normalisierung und IO-Verträge                                                                                                          |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway-Protokollschemata und Server-Methoden-Verträge                                                                                                           |
| `/codeql-critical-quality/channel-runtime-boundary`     | Core-Channel- und gebündelte Channel-Plugin-Implementierungsverträge                                                                                             |
| `/codeql-critical-quality/agent-runtime-boundary`       | Befehlsausführung, Modell-/Provider-Dispatch, Auto-Reply-Dispatch und Warteschlangen sowie ACP-Control-Plane-Runtime-Verträge                                    |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP-Server und Tool-Bridges, Prozessüberwachungs-Hilfen und Verträge für ausgehende Zustellung                                                                    |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory-Host-SDK, Memory-Runtime-Fassaden, Memory-Plugin-SDK-Aliasse, Memory-Runtime-Aktivierungs-Glue und Memory-Doctor-Befehle                                  |
| `/codeql-critical-quality/session-diagnostics-boundary` | Reply-Warteschlangen-Interna, Session-Zustellungswarteschlangen, Hilfen für ausgehende Session-Bindung/-Zustellung, Diagnoseereignis-/Log-Bundle-Flächen und Session-Doctor-CLI-Verträge |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Inbound-Reply-Dispatch des Plugin SDK, Reply-Payload-/Chunking-/Runtime-Hilfen, Channel-Reply-Optionen, Zustellungswarteschlangen und Hilfen für Session-/Thread-Bindung |
| `/codeql-critical-quality/provider-runtime-boundary`    | Modellkatalog-Normalisierung, Provider-Authentifizierung und -Erkennung, Provider-Runtime-Registrierung, Provider-Standards/-Kataloge und Web-/Search-/Fetch-/Embedding-Registries |
| `/codeql-critical-quality/ui-control-plane`             | Control-UI-Bootstrap, lokale Persistenz, Gateway-Control-Flows und Task-Control-Plane-Runtime-Verträge                                                            |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Core-Web-Fetch/-Search, Medien-IO, Medienverständnis, Bildgenerierung und Mediengenerierungs-Runtime-Verträge                                                     |
| `/codeql-critical-quality/plugin-boundary`              | Loader-, Registry-, Public-Surface- und Plugin-SDK-Entrypoint-Verträge                                                                                            |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Veröffentlichter paket seitiger Plugin-SDK-Quellcode und Hilfen für Plugin-Paketverträge                                                                         |

Quality bleibt von Security getrennt, damit Quality-Ergebnisse geplant, gemessen, deaktiviert oder erweitert werden können, ohne das Security-Signal zu verschleiern. Swift-, Python- und gebündelte-Plugin-CodeQL-Erweiterungen sollten erst wieder als scoped oder in Shards aufgeteilte Folgearbeit hinzugefügt werden, nachdem die schmalen Profile stabile Laufzeit und stabile Signale haben.

## Wartungs-Workflows

### Docs Agent

Der `Docs Agent`-Workflow ist eine ereignisgesteuerte Codex-Wartungslane, um vorhandene Docs mit kürzlich gelandeten Änderungen abzugleichen. Er hat keinen reinen Zeitplan: Ein erfolgreicher Nicht-Bot-Push-CI-Lauf auf `main` kann ihn auslösen, und ein manueller Dispatch kann ihn direkt ausführen. Workflow-Run-Aufrufe werden übersprungen, wenn `main` weitergelaufen ist oder wenn in der letzten Stunde ein anderer nicht übersprungener Docs-Agent-Lauf erstellt wurde. Wenn er läuft, prüft er den Commit-Bereich vom vorherigen nicht übersprungenen Docs-Agent-Source-SHA bis zum aktuellen `main`, sodass ein stündlicher Lauf alle seit dem letzten Docs-Durchlauf angesammelten Main-Änderungen abdecken kann.

### Test Performance Agent

Der `Test Performance Agent`-Workflow ist eine ereignisgesteuerte Codex-Wartungslane für langsame Tests. Er hat keinen reinen Zeitplan: Ein erfolgreicher Nicht-Bot-Push-CI-Lauf auf `main` kann ihn auslösen, aber er wird übersprungen, wenn an diesem UTC-Tag bereits ein anderer Workflow-Run-Aufruf gelaufen ist oder läuft. Manueller Dispatch umgeht dieses tägliche Aktivitäts-Gate. Die Lane erstellt einen gruppierten Vitest-Performance-Bericht der vollständigen Suite, lässt Codex nur kleine, Coverage-erhaltende Test-Performance-Fixes statt breiter Refactorings vornehmen, führt dann den vollständigen Suite-Bericht erneut aus und weist Änderungen zurück, die die Baseline-Anzahl bestandener Tests reduzieren. Wenn die Baseline fehlgeschlagene Tests hat, darf Codex nur offensichtliche Fehler beheben, und der vollständige Suite-Bericht nach dem Agent muss bestanden sein, bevor etwas committet wird. Wenn `main` vor dem Bot-Push weiterläuft, rebased die Lane den validierten Patch, führt `pnpm check:changed` erneut aus und versucht den Push erneut; konfliktbehaftete veraltete Patches werden übersprungen. Sie verwendet GitHub-gehostetes Ubuntu, damit die Codex-Action dieselbe Drop-sudo-Sicherheitshaltung wie der Docs Agent beibehalten kann.

### Doppelte PRs nach Merge

Der `Duplicate PRs After Merge`-Workflow ist ein manueller Maintainer-Workflow für die Bereinigung doppelter PRs nach dem Landen. Standardmäßig läuft er als Dry-Run und schließt nur ausdrücklich aufgeführte PRs, wenn `apply=true` gesetzt ist. Bevor er GitHub verändert, prüft er, dass der gelandete PR gemergt ist und dass jedes Duplikat entweder ein gemeinsam referenziertes Issue oder überlappende geänderte Hunks hat.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Lokale Check-Gates und Changed-Routing

Die lokale Changed-Lane-Logik liegt in `scripts/changed-lanes.mjs` und wird von `scripts/check-changed.mjs` ausgeführt. Dieses lokale Check-Gate ist bei Architekturgrenzen strenger als der breite CI-Plattform-Scope:

- Core-Produktionsänderungen führen Core-Prod- und Core-Test-Typecheck plus Core-Lint/-Guards aus;
- reine Core-Test-Änderungen führen nur Core-Test-Typecheck plus Core-Lint aus;
- Plugin-Produktionsänderungen führen Plugin-Prod- und Plugin-Test-Typecheck plus Plugin-Lint aus;
- reine Plugin-Test-Änderungen führen Plugin-Test-Typecheck plus Plugin-Lint aus;
- öffentliche Plugin-SDK- oder Plugin-Vertragsänderungen erweitern auf Plugin-Typecheck, weil Plugins von diesen Core-Verträgen abhängen (Vitest-Plugin-Sweeps bleiben explizite Testarbeit);
- reine Release-Metadaten-Versionsbumps führen gezielte Versions-/Config-/Root-Dependency-Checks aus;
- unbekannte Root-/Config-Änderungen fallen sicherheitshalber auf alle Check-Lanes zurück.

Lokales Changed-Test-Routing liegt in `scripts/test-projects.test-support.mjs` und ist bewusst günstiger als `check:changed`: Direkte Teständerungen führen sich selbst aus, Source-Änderungen bevorzugen explizite Mappings, danach Geschwistertests und Import-Graph-Abhängige. Shared Group-Room-Delivery-Config ist eines der expliziten Mappings: Änderungen an der für die Gruppe sichtbaren Reply-Config, am Source-Reply-Zustellungsmodus oder am Message-Tool-Systemprompt werden durch die Core-Reply-Tests plus Discord- und Slack-Zustellungsregressionen geroutet, sodass eine gemeinsame Standardänderung vor dem ersten PR-Push fehlschlägt. Verwenden Sie `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` nur, wenn die Änderung so harness-weit ist, dass die günstige gemappte Menge kein vertrauenswürdiger Proxy ist.

## Testbox-Validierung

Führen Sie Testbox vom Repo-Root aus und bevorzugen Sie für breite Nachweise eine frisch aufgewärmte Box. Bevor Sie ein langsames Gate auf einer Box ausführen, die wiederverwendet wurde, abgelaufen ist oder gerade einen unerwartet großen Sync gemeldet hat, führen Sie zuerst `pnpm testbox:sanity` innerhalb der Box aus.

Der Sanity-Check schlägt schnell fehl, wenn erforderliche Root-Dateien wie `pnpm-lock.yaml` verschwunden sind oder wenn `git status --short` mindestens 200 nachverfolgte Löschungen anzeigt. Das bedeutet in der Regel, dass der Remote-Sync-Zustand keine vertrauenswürdige Kopie des PR ist; stoppen Sie diese Box und wärmen Sie eine frische auf, statt den Produkttestfehler zu debuggen. Setzen Sie für absichtliche PRs mit vielen Löschungen `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` für diesen Sanity-Lauf.

`pnpm testbox:run` beendet außerdem eine lokale Blacksmith-CLI-Invocation, die länger als fünf Minuten ohne Ausgabe nach dem Sync in der Sync-Phase bleibt. Setzen Sie `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, um diesen Schutz zu deaktivieren, oder verwenden Sie einen größeren Millisekundenwert für ungewöhnlich große lokale Diffs.

Crabbox ist der repo-eigene Remote-Box-Wrapper für Maintainer-Linux-Nachweise. Verwenden Sie ihn, wenn ein Check für eine lokale Edit-Schleife zu breit ist, wenn CI-Parität wichtig ist oder wenn der Nachweis Secrets, Docker, Package-Lanes, wiederverwendbare Boxen oder Remote-Logs benötigt. Das normale OpenClaw-Backend ist `blacksmith-testbox`; eigene AWS-/Hetzner-Kapazität ist ein Fallback für Blacksmith-Ausfälle, Quotenprobleme oder ausdrücklich gewünschte Tests auf eigener Kapazität.

Prüfen Sie vor einem ersten Lauf den Wrapper vom Repo-Root aus:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Der Repo-Wrapper verweigert eine veraltete Crabbox-Binary, die `blacksmith-testbox` nicht ausweist. Übergeben Sie den Provider explizit, auch wenn `.crabbox.yaml` Defaults für die eigene Cloud enthält.

Changed-Gate:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
```

Gezielter Testwiederholungslauf:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm test <path-or-filter>"
```

Vollständige Suite:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox \
  --blacksmith-org openclaw \
  --blacksmith-workflow .github/workflows/ci-check-testbox.yml \
  --blacksmith-job check \
  --blacksmith-ref main \
  --idle-timeout 90m \
  --ttl 240m \
  --timing-json \
  --shell -- \
  "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm test"
```

Lesen Sie die abschließende JSON-Zusammenfassung. Die nützlichen Felder sind `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` und `totalMs`. Einmalige Blacksmith-gestützte Crabbox-Läufe sollten die Testbox automatisch stoppen; wenn ein Lauf unterbrochen wird oder die Bereinigung unklar ist, prüfen Sie laufende Boxen und stoppen Sie nur die Boxen, die Sie erstellt haben:

```bash
blacksmith testbox list
blacksmith testbox stop --id <tbx_id>
```

Verwenden Sie Wiederverwendung nur, wenn Sie absichtlich mehrere Befehle auf derselben hydrierten Box benötigen:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Wenn Crabbox die defekte Schicht ist, Blacksmith selbst aber funktioniert, verwenden Sie direktes Blacksmith als engen Fallback:

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

Eskalieren Sie nur dann auf eigene Crabbox-Kapazität, wenn Blacksmith ausgefallen, durch Quoten begrenzt oder die benötigte Umgebung nicht verfügbar ist, oder wenn eigene Kapazität ausdrücklich das Ziel ist:

```bash
pnpm crabbox:warmup -- --provider aws --class beast --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

`.crabbox.yaml` besitzt die Defaults für Provider, Sync und die GitHub Actions-Hydrierung für eigene Cloud-Lanes. Sie schließt lokales `.git` aus, damit der hydrierte Actions-Checkout seine eigenen Remote-Git-Metadaten behält, statt maintainer-lokale Remotes und Object Stores zu synchronisieren, und sie schließt lokale Runtime-/Build-Artefakte aus, die niemals übertragen werden sollten. `.github/workflows/crabbox-hydrate.yml` besitzt Checkout, Node-/pnpm-Setup, `origin/main`-Fetch und die nicht geheime Umgebungsübergabe für eigene Cloud-Befehle mit `crabbox run --id <cbx_id>`.

## Verwandt

- [Installationsübersicht](/de/install)
- [Entwicklungskanäle](/de/install/development-channels)
