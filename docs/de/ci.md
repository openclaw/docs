---
read_when:
    - Sie müssen nachvollziehen, warum ein CI-Job ausgeführt wurde oder nicht.
    - Sie debuggen eine fehlschlagende GitHub Actions-Prüfung
    - Sie koordinieren einen Release-Validierungslauf oder eine erneute Ausführung
    - Sie ändern den ClawSweeper-Dispatch oder die Weiterleitung von GitHub-Aktivitäten
summary: CI-Jobgraph, Scope-Gates, Release-Umbrellas und lokale Befehlsäquivalente
title: CI-Pipeline
x-i18n:
    generated_at: "2026-05-02T23:39:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 321fe0a061044f75b8e1d03b4d3e76d4f8dd2dae0ebc58831887fc20af953cf1
    source_path: ci.md
    workflow: 16
---

OpenClaw CI wird bei jedem Push nach `main` und jedem Pull Request ausgeführt. Der Job `preflight` klassifiziert den Diff und deaktiviert teure Lanes, wenn sich nur nicht zusammenhängende Bereiche geändert haben. Manuelle `workflow_dispatch`-Ausführungen umgehen Smart Scoping absichtlich und fächern den vollständigen Graphen für Release-Kandidaten und breite Validierung auf. Android-Lanes bleiben über `include_android` opt-in. Die Plugin-Abdeckung nur für Releases befindet sich im separaten Workflow [`Plugin-Prerelease`](#plugin-prerelease) und wird nur von [`Vollständige Release-Validierung`](#full-release-validation) oder einem expliziten manuellen Dispatch ausgeführt.

## Pipeline-Übersicht

| Job                              | Zweck                                                                                                               | Wann er ausgeführt wird                       |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `preflight`                      | Erkennt reine Dokumentationsänderungen, geänderte Scopes, geänderte Erweiterungen und erstellt das CI-Manifest      | Immer bei nicht als Entwurf markierten Pushes und PRs |
| `security-scm-fast`              | Erkennung privater Schlüssel und Workflow-Audit über `zizmor`                                                       | Immer bei nicht als Entwurf markierten Pushes und PRs |
| `security-dependency-audit`      | Dependency-freier Audit des Produktions-Lockfiles gegen npm-Advisories                                              | Immer bei nicht als Entwurf markierten Pushes und PRs |
| `security-fast`                  | Erforderliches Aggregat für die schnellen Sicherheitsjobs                                                           | Immer bei nicht als Entwurf markierten Pushes und PRs |
| `check-dependencies`             | Produktions-Knip-Durchlauf nur für Dependencies plus Allowlist-Schutz für ungenutzte Dateien                        | Node-relevante Änderungen                    |
| `build-artifacts`                | Erstellt `dist/`, Control UI, Built-Artifact-Prüfungen und wiederverwendbare Downstream-Artefakte                   | Node-relevante Änderungen                    |
| `checks-fast-core`               | Schnelle Linux-Korrektheits-Lanes wie Prüfungen für gebündelte Plugins, Plugin-Verträge und Protokolle              | Node-relevante Änderungen                    |
| `checks-fast-contracts-channels` | Geshardete Channel-Contract-Prüfungen mit stabilem aggregiertem Prüfergebnis                                        | Node-relevante Änderungen                    |
| `checks-node-core-test`          | Core-Node-Test-Shards ohne Channel-, gebündelte, Contract- und Extension-Lanes                                      | Node-relevante Änderungen                    |
| `check`                          | Geshardetes Äquivalent zum lokalen Haupt-Gate: Prod-Typen, Lint, Guards, Testtypen und strikter Smoke-Test          | Node-relevante Änderungen                    |
| `check-additional`               | Architektur-, Boundary-, Prompt-Snapshot-Drift-, Extension-Surface-, Package-Boundary- und Gateway-Watch-Shards     | Node-relevante Änderungen                    |
| `build-smoke`                    | Smoke-Tests für die gebaute CLI und Startup-Memory-Smoke                                                            | Node-relevante Änderungen                    |
| `checks`                         | Verifier für Built-Artifact-Channel-Tests                                                                           | Node-relevante Änderungen                    |
| `checks-node-compat-node22`      | Node-22-Kompatibilitäts-Build und Smoke-Lane                                                                        | Manueller CI-Dispatch für Releases           |
| `check-docs`                     | Dokumentationsformatierung, Lint und Broken-Link-Prüfungen                                                          | Dokumentation geändert                       |
| `skills-python`                  | Ruff + pytest für Python-gestützte Skills                                                                           | Python-Skill-relevante Änderungen            |
| `checks-windows`                 | Windows-spezifische Prozess-/Pfadtests plus gemeinsame Regressionstests für Runtime-Import-Spezifizierer            | Windows-relevante Änderungen                 |
| `macos-node`                     | macOS-TypeScript-Test-Lane mit den gemeinsam gebauten Artefakten                                                    | macOS-relevante Änderungen                   |
| `macos-swift`                    | Swift-Lint, Build und Tests für die macOS-App                                                                       | macOS-relevante Änderungen                   |
| `android`                        | Android-Unit-Tests für beide Flavors plus ein Debug-APK-Build                                                       | Android-relevante Änderungen                 |
| `test-performance-agent`         | Tägliche Codex-Optimierung langsamer Tests nach vertrauenswürdiger Aktivität                                        | Main-CI-Erfolg oder manueller Dispatch       |
| `openclaw-performance`           | Tägliche/bedarfsbasierte Kova-Runtime-Performanceberichte mit Mock-Provider-, Deep-Profile- und GPT-5.4-Live-Lanes | Geplanter und manueller Dispatch             |

## Fail-Fast-Reihenfolge

1. `preflight` entscheidet, welche Lanes überhaupt existieren. Die Logik `docs-scope` und `changed-scope` sind Schritte innerhalb dieses Jobs, keine eigenständigen Jobs.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` und `skills-python` schlagen schnell fehl, ohne auf die schwereren Artefakt- und Plattform-Matrix-Jobs zu warten.
3. `build-artifacts` überlappt sich mit den schnellen Linux-Lanes, damit Downstream-Verbraucher starten können, sobald der gemeinsame Build bereit ist.
4. Schwerere Plattform- und Runtime-Lanes fächern danach auf: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` und `android`.

GitHub kann überholte Jobs als `cancelled` markieren, wenn ein neuerer Push auf demselben PR- oder `main`-Ref landet. Behandeln Sie das als CI-Rauschen, sofern nicht auch die neueste Ausführung für denselben Ref fehlschlägt. Aggregierte Shard-Prüfungen verwenden `!cancelled() && always()`, sodass sie normale Shard-Fehler weiterhin melden, aber nicht mehr eingereiht werden, nachdem der gesamte Workflow bereits überholt wurde. Der automatische CI-Concurrency-Schlüssel ist versioniert (`CI-v7-*`), damit ein Zombie auf GitHub-Seite in einer alten Queue-Gruppe neuere Main-Ausführungen nicht unbegrenzt blockieren kann. Manuelle Full-Suite-Ausführungen verwenden `CI-manual-v1-*` und brechen laufende Ausführungen nicht ab.

## Scope und Routing

Die Scope-Logik befindet sich in `scripts/ci-changed-scope.mjs` und wird durch Unit-Tests in `src/scripts/ci-changed-scope.test.ts` abgedeckt. Manueller Dispatch überspringt die Changed-Scope-Erkennung und lässt das Preflight-Manifest so agieren, als hätte sich jeder gescopte Bereich geändert.

- **CI-Workflow-Bearbeitungen** validieren den Node-CI-Graphen plus Workflow-Linting, erzwingen aber für sich genommen keine nativen Windows-, Android- oder macOS-Builds; diese Plattform-Lanes bleiben auf Plattform-Quelländerungen beschränkt.
- **CI-Bearbeitungen nur am Routing, ausgewählte günstige Core-Test-Fixture-Bearbeitungen und schmale Plugin-Contract-Helper-/Test-Routing-Bearbeitungen** verwenden einen schnellen Node-only-Manifestpfad: `preflight`, Sicherheit und eine einzelne `checks-fast-core`-Aufgabe. Dieser Pfad überspringt Build-Artefakte, Node-22-Kompatibilität, Channel-Contracts, vollständige Core-Shards, Bundled-Plugin-Shards und zusätzliche Guard-Matrizen, wenn die Änderung auf die Routing- oder Helper-Oberflächen beschränkt ist, die die schnelle Aufgabe direkt ausführt.
- **Windows-Node-Prüfungen** sind auf Windows-spezifische Prozess-/Pfad-Wrapper, npm-/pnpm-/UI-Runner-Helper, Paketmanager-Konfiguration und die CI-Workflow-Oberflächen beschränkt, die diese Lane ausführen; nicht zusammenhängende Quell-, Plugin-, Install-Smoke- und reine Teständerungen bleiben auf den Linux-Node-Lanes.

Die langsamsten Node-Testfamilien sind aufgeteilt oder ausbalanciert, damit jeder Job klein bleibt, ohne Runner übermäßig zu reservieren: Channel-Contracts laufen als drei gewichtete Shards, kleine Core-Unit-Lanes werden gepaart, Auto-Reply läuft als vier ausbalancierte Worker (wobei der Reply-Teilbaum in Agent-Runner-, Dispatch- und Commands/State-Routing-Shards aufgeteilt ist), und agentische Gateway-/Plugin-Konfigurationen werden auf die bestehenden source-only agentischen Node-Jobs verteilt, statt auf gebaute Artefakte zu warten. Breite Browser-, QA-, Medien- und sonstige Plugin-Tests verwenden ihre dedizierten Vitest-Konfigurationen statt des gemeinsamen Plugin-Catch-all. Include-Pattern-Shards zeichnen Timing-Einträge mit dem CI-Shard-Namen auf, sodass `.artifacts/vitest-shard-timings.json` eine ganze Konfiguration von einem gefilterten Shard unterscheiden kann. `check-additional` hält Package-Boundary-Compile-/Canary-Arbeit zusammen und trennt Runtime-Topology-Architektur von Gateway-Watch-Abdeckung; der Boundary-Guard-Shard führt seine kleinen unabhängigen Guards innerhalb eines Jobs parallel aus, einschließlich `pnpm prompt:snapshots:check`, sodass Prompt-Drift im Codex-Runtime-Happy-Path an den verursachenden PR gebunden ist. Gateway-Watch-, Channel-Tests und der Core-Support-Boundary-Shard laufen innerhalb von `build-artifacts` parallel, nachdem `dist/` und `dist-runtime/` bereits gebaut wurden.

Android CI führt sowohl `testPlayDebugUnitTest` als auch `testThirdPartyDebugUnitTest` aus und baut anschließend das Play-Debug-APK. Der Third-Party-Flavor hat kein separates Source Set oder Manifest; seine Unit-Test-Lane kompiliert den Flavor dennoch mit den SMS-/Call-Log-BuildConfig-Flags und vermeidet gleichzeitig einen doppelten Debug-APK-Packaging-Job bei jedem Android-relevanten Push.

Der Shard `check-dependencies` führt `pnpm deadcode:dependencies` (einen Produktions-Knip-Durchlauf nur für Dependencies, fixiert auf die neueste Knip-Version, wobei pnpm's Mindest-Release-Alter für die `dlx`-Installation deaktiviert ist) und `pnpm deadcode:unused-files` aus, das Knip's Produktionsbefunde zu ungenutzten Dateien mit `scripts/deadcode-unused-files.allowlist.mjs` vergleicht. Der Guard für ungenutzte Dateien schlägt fehl, wenn ein PR eine neue nicht überprüfte ungenutzte Datei hinzufügt oder einen veralteten Allowlist-Eintrag zurücklässt, während absichtliche dynamische Plugin-, generierte, Build-, Live-Test- und Package-Bridge-Oberflächen erhalten bleiben, die Knip statisch nicht auflösen kann.

## Weiterleitung von ClawSweeper-Aktivitäten

`.github/workflows/clawsweeper-dispatch.yml` ist die zielseitige Brücke von OpenClaw-Repository-Aktivitäten zu ClawSweeper. Sie checkt keinen nicht vertrauenswürdigen Pull-Request-Code aus und führt ihn nicht aus. Der Workflow erstellt aus `CLAWSWEEPER_APP_PRIVATE_KEY` ein GitHub-App-Token und sendet dann kompakte `repository_dispatch`-Payloads an `openclaw/clawsweeper`.

Der Workflow hat vier Lanes:

- `clawsweeper_item` für exakte Review-Anfragen zu Issues und Pull Requests;
- `clawsweeper_comment` für explizite ClawSweeper-Befehle in Issue-Kommentaren;
- `clawsweeper_commit_review` für Review-Anfragen auf Commit-Ebene bei `main`-Pushes;
- `github_activity` für allgemeine GitHub-Aktivitäten, die der ClawSweeper-Agent prüfen kann.

Die Lane `github_activity` leitet nur normalisierte Metadaten weiter: Ereignistyp, Aktion, Actor, Repository, Item-Nummer, URL, Titel, Zustand und kurze Auszüge für Kommentare oder Reviews, sofern vorhanden. Sie vermeidet absichtlich die Weiterleitung des vollständigen Webhook-Bodys. Der empfangende Workflow in `openclaw/clawsweeper` ist `.github/workflows/github-activity.yml`, der das normalisierte Ereignis an den OpenClaw-Gateway-Hook für den ClawSweeper-Agent postet.

Allgemeine Aktivität ist Beobachtung, keine standardmäßige Zustellung. Der ClawSweeper-Agent erhält das Discord-Ziel in seinem Prompt und sollte nur dann an `#clawsweeper` posten, wenn das Ereignis überraschend, handlungsrelevant, riskant oder betrieblich nützlich ist. Routinemäßiges Öffnen, Bearbeiten, Bot-Aktivität, doppeltes Webhook-Rauschen und normaler Review-Verkehr sollten zu `NO_REPLY` führen.

Behandeln Sie GitHub-Titel, Kommentare, Bodys, Review-Text, Branch-Namen und Commit-Nachrichten auf diesem gesamten Pfad als nicht vertrauenswürdige Daten. Sie sind Eingaben für Zusammenfassung und Triage, keine Anweisungen für den Workflow oder die Agent-Runtime.

## Manuelle Dispatches

Manuelle CI-Dispatches führen denselben Job-Graphen wie die normale CI aus, erzwingen aber jede nicht auf Android beschränkte Lane: Linux-Node-Shards, gebündelte Plugin-Shards, Channel-Contracts, Node-22-Kompatibilität, `check`, `check-additional`, Build-Smoke, Dokumentationsprüfungen, Python-Skills, Windows, macOS und Control-UI-i18n. Eigenständige manuelle CI-Dispatches führen Android nur mit `include_android=true` aus; der vollständige Release-Umbrella aktiviert Android durch Übergabe von `include_android=true`. Statische Plugin-Prerelease-Prüfungen, der nur für Releases vorgesehene `agentic-plugins`-Shard, der vollständige Erweiterungs-Batch-Sweep und Plugin-Prerelease-Docker-Lanes sind von der CI ausgeschlossen. Die Docker-Prerelease-Suite läuft nur, wenn `Full Release Validation` den separaten Workflow `Plugin Prerelease` mit aktiviertem Release-Validierungs-Gate auslöst.

Manuelle Läufe verwenden eine eindeutige Nebenläufigkeitsgruppe, damit eine vollständige Release-Candidate-Suite nicht durch einen anderen Push- oder PR-Lauf auf derselben Ref abgebrochen wird. Die optionale Eingabe `target_ref` ermöglicht es einem vertrauenswürdigen Aufrufer, diesen Graphen gegen einen Branch, ein Tag oder eine vollständige Commit-SHA auszuführen, während die Workflow-Datei aus der ausgewählten Dispatch-Ref verwendet wird.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, schnelle Security-Jobs und Aggregate (`security-scm-fast`, `security-dependency-audit`, `security-fast`), schnelle Protokoll-/Contract-/gebündelte Prüfungen, geshardete Channel-Contract-Prüfungen, `check`-Shards außer Lint, `check-additional`-Shards und Aggregate, Node-Test-Aggregatverifizierer, Dokumentationsprüfungen, Python-Skills, Workflow-Sanity, Labeler, Auto-Response; Install-Smoke-Preflight verwendet ebenfalls GitHub-gehostetes Ubuntu, damit die Blacksmith-Matrix früher in die Warteschlange kann |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, weniger aufwendige Erweiterungs-Shards, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` und `check-test-types`                                                                                                                                                                                                                                                                                                      |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, Build-Smoke, Linux-Node-Test-Shards, gebündelte Plugin-Test-Shards, `android`                                                                                                                                                                                                                                                                                                                                                                    |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (CPU-sensibel genug, dass 8 vCPU mehr gekostet haben, als sie eingespart haben); Install-Smoke-Docker-Builds (32-vCPU-Warteschlangenzeit hat mehr gekostet, als sie eingespart hat)                                                                                                                                                                                                                                                                   |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` auf `openclaw/openclaw`; Forks fallen auf `macos-latest` zurück                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` auf `openclaw/openclaw`; Forks fallen auf `macos-latest` zurück                                                                                                                                                                                                                                                                                                                                                                                       |

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

## OpenClaw-Performance

`OpenClaw Performance` ist der Workflow für Produkt-/Runtime-Performance. Er läuft täglich auf `main` und kann manuell ausgelöst werden:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
```

Der Workflow installiert OCM aus einem gepinnten Release und Kova aus der gepinnten Eingabe `kova_ref` und führt dann drei Lanes aus:

- `mock-provider`: Kova-Diagnoseszenarien gegen eine lokal gebaute Runtime mit deterministischer gefälschter OpenAI-kompatibler Authentifizierung.
- `mock-deep-profile`: CPU-/Heap-/Trace-Profiling für Hotspots beim Start, Gateway und Agent-Turn.
- `live-gpt54`: ein echter Agent-Turn mit OpenAI `openai/gpt-5.4`, der übersprungen wird, wenn `OPENAI_API_KEY` nicht verfügbar ist.

Die Mock-Provider-Lane führt nach dem Kova-Durchlauf außerdem OpenClaw-native Source-Probes aus: Gateway-Startzeit und Speicher über Standard-, Hook- und 50-Plugin-Startfälle hinweg; wiederholte Mock-OpenAI-`channel-chat-baseline`-Hello-Loops; und CLI-Startbefehle gegen das gestartete Gateway. Die Markdown-Zusammenfassung der Source-Probe befindet sich unter `source/index.md` im Report-Bundle, mit Roh-JSON daneben.

Jede Lane lädt GitHub-Artefakte hoch. Wenn `CLAWGRIT_REPORTS_TOKEN` konfiguriert ist, committet der Workflow außerdem `report.json`, `report.md`, Bundles, `index.md` und Source-Probe-Artefakte nach `openclaw/clawgrit-reports` unter `openclaw-performance/<ref>/<run-id>-<attempt>/<lane>/`. Der aktuelle Branch-Zeiger wird als `openclaw-performance/<ref>/latest-<lane>.json` geschrieben.

## Vollständige Release-Validierung

`Full Release Validation` ist der manuelle Umbrella-Workflow für „alles vor dem Release ausführen“. Er akzeptiert einen Branch, ein Tag oder eine vollständige Commit-SHA, löst den manuellen `CI`-Workflow mit diesem Ziel aus, löst `Plugin Prerelease` für nur im Release verwendete Plugin-/Paket-/Static-/Docker-Nachweise aus und löst `OpenClaw Release Checks` für Install-Smoke, Package Acceptance, Docker-Release-Pfad-Suites, Live/E2E, OpenWebUI, QA-Lab-Parität, Matrix- und Telegram-Lanes aus. Mit `rerun_group=all` und `release_profile=full` führt er außerdem `NPM Telegram Beta E2E` gegen das Artefakt `release-package-under-test` aus den Release-Checks aus. Übergeben Sie nach der Veröffentlichung `npm_telegram_package_spec`, um dieselbe Telegram-Paket-Lane gegen das veröffentlichte npm-Paket erneut auszuführen.

Siehe [Vollständige Release-Validierung](/de/reference/full-release-validation) für die
Stage-Matrix, exakte Workflow-Jobnamen, Profilunterschiede, Artefakte und
fokussierte Rerun-Handles.

`OpenClaw Release Publish` ist der manuelle mutierende Release-Workflow. Lösen Sie ihn
von `release/YYYY.M.D` oder `main` aus, nachdem das Release-Tag existiert und nachdem der
OpenClaw-npm-Preflight erfolgreich war. Er verifiziert `pnpm plugins:sync:check`,
löst `Plugin NPM Release` für alle veröffentlichbaren Plugin-Pakete aus, löst
`Plugin ClawHub Release` für dieselbe Release-SHA aus und löst erst dann
`OpenClaw NPM Release` mit der gespeicherten `preflight_run_id` aus.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Für einen gepinnten Commit-Nachweis auf einem sich schnell bewegenden Branch verwenden Sie den Helper statt
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub-Workflow-Dispatch-Refs müssen Branches oder Tags sein, keine rohen Commit-SHAs. Der
Helper pusht einen temporären Branch `release-ci/<sha>-...` an der Ziel-SHA,
löst `Full Release Validation` von dieser gepinnten Ref aus, verifiziert, dass jede
Child-Workflow-`headSha` mit dem Ziel übereinstimmt, und löscht den temporären Branch, wenn der
Lauf abgeschlossen ist. Der Umbrella-Verifizierer schlägt außerdem fehl, wenn ein Child-Workflow mit einer
anderen SHA lief.

`release_profile` steuert die Live-/Provider-Breite, die an Release-Checks übergeben wird. Die
manuellen Release-Workflows verwenden standardmäßig `stable`; verwenden Sie `full` nur, wenn Sie
absichtlich die breite beratende Provider-/Medien-Matrix wünschen.

- `minimum` behält die schnellsten OpenAI-/Core-releasekritischen Lanes bei.
- `stable` fügt den stabilen Provider-/Backend-Satz hinzu.
- `full` führt die breite beratende Provider-/Medien-Matrix aus.

Der Umbrella zeichnet die ausgelösten Child-Run-IDs auf, und der abschließende Job `Verify full validation` prüft die aktuellen Child-Run-Ergebnisse erneut und hängt Tabellen der langsamsten Jobs für jeden Child-Run an. Wenn ein Child-Workflow erneut ausgeführt wird und grün wird, führen Sie nur den übergeordneten Verifiziererjob erneut aus, um das Umbrella-Ergebnis und die Timing-Zusammenfassung zu aktualisieren.

Für die Wiederherstellung akzeptieren sowohl `Full Release Validation` als auch `OpenClaw Release Checks` `rerun_group`. Verwenden Sie `all` für einen Release Candidate, `ci` nur für das normale vollständige CI-Child, `plugin-prerelease` nur für das Plugin-Prerelease-Child, `release-checks` für jedes Release-Child oder eine engere Gruppe: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` oder `npm-telegram` im Umbrella. Dadurch bleibt die erneute Ausführung einer fehlgeschlagenen Release-Box nach einem gezielten Fix begrenzt.

`OpenClaw Release Checks` verwendet den vertrauenswürdigen Workflow-Ref, um den ausgewählten Ref einmal in ein `release-package-under-test`-Tarball aufzulösen, und übergibt dieses Artefakt dann sowohl an den Live/E2E-Docker-Workflow für den Release-Pfad als auch an den Package-Acceptance-Shard. Dadurch bleiben die Paketbytes über Release-Boxen hinweg konsistent und dasselbe Candidate wird nicht in mehreren Child-Jobs erneut gepackt.

Doppelte `Full Release Validation`-Läufe für `ref=main` und `rerun_group=all`
ersetzen das ältere Umbrella. Der Parent-Monitor bricht jeden Child-Workflow ab, den er
bereits ausgelöst hat, wenn der Parent abgebrochen wird, sodass neuere Main-Validierung
nicht hinter einem veralteten zweistündigen Release-Check-Lauf wartet. Validierung von Release-Branches/-Tags
und gezielte Rerun-Gruppen behalten `cancel-in-progress: false`.

## Live- und E2E-Shards

Das Release-Live/E2E-Child behält breite native `pnpm test:live`-Abdeckung bei, führt sie aber als benannte Shards über `scripts/test-live-shard.mjs` statt als einen seriellen Job aus:

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
- Aufgeteilte Media-Audio/Video-Shards und Provider-gefilterte Musik-Shards

Dadurch bleibt dieselbe Datei-Abdeckung erhalten, während langsame Live-Provider-Fehler leichter erneut auszuführen und zu diagnostizieren sind. Die aggregierten Shard-Namen `native-live-extensions-o-z`, `native-live-extensions-media` und `native-live-extensions-media-music` bleiben für manuelle One-Shot-Reruns gültig.

Die nativen Live-Media-Shards laufen in `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, gebaut vom Workflow `Live Media Runner Image`. Dieses Image installiert `ffmpeg` und `ffprobe` vorab; Media-Jobs prüfen vor dem Setup nur die Binärdateien. Lassen Sie Docker-gestützte Live-Suites auf normalen Blacksmith-Runnern laufen — Container-Jobs sind der falsche Ort, um verschachtelte Docker-Tests zu starten.

Docker-gestützte Live-Modell-/Backend-Shards verwenden ein separates gemeinsames Image `ghcr.io/openclaw/openclaw-live-test:<sha>` pro ausgewähltem Commit. Der Live-Release-Workflow baut und pusht dieses Image einmal, dann laufen die Docker-Live-Modell-, Provider-Sharded-Gateway-, CLI-Backend-, ACP-Bind- und Codex-Harness-Shards mit `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gateway-Docker-Shards haben explizite Timeout-Obergrenzen auf Skriptebene unterhalb des Workflow-Job-Timeouts, sodass ein hängender Container oder Cleanup-Pfad schnell fehlschlägt, statt das gesamte Release-Check-Budget zu verbrauchen. Wenn diese Shards das vollständige Source-Docker-Target unabhängig neu bauen, ist der Release-Lauf falsch konfiguriert und verschwendet Laufzeit mit doppelten Image-Builds.

## Package Acceptance

Verwenden Sie `Package Acceptance`, wenn die Frage lautet: „Funktioniert dieses installierbare OpenClaw-Paket als Produkt?“ Es unterscheidet sich von normaler CI: Normale CI validiert den Source Tree, während Package Acceptance ein einzelnes Tarball über dasselbe Docker-E2E-Harness validiert, das Nutzer nach Installation oder Update ausführen.

### Jobs

1. `resolve_package` checkt `workflow_ref` aus, löst einen Paket-Candidate auf, schreibt `.artifacts/docker-e2e-package/openclaw-current.tgz`, schreibt `.artifacts/docker-e2e-package/package-candidate.json`, lädt beide als Artefakt `package-under-test` hoch und gibt Quelle, Workflow-Ref, Paket-Ref, Version, SHA-256 und Profil in der GitHub-Step-Summary aus.
2. `docker_acceptance` ruft `openclaw-live-and-e2e-checks-reusable.yml` mit `ref=workflow_ref` und `package_artifact_name=package-under-test` auf. Der wiederverwendbare Workflow lädt dieses Artefakt herunter, validiert das Tarball-Inventar, bereitet bei Bedarf Package-Digest-Docker-Images vor und führt die ausgewählten Docker-Lanes gegen dieses Paket aus, statt den Workflow-Checkout zu packen. Wenn ein Profil mehrere gezielte `docker_lanes` auswählt, bereitet der wiederverwendbare Workflow das Paket und die gemeinsamen Images einmal vor und fächert diese Lanes dann als parallele gezielte Docker-Jobs mit eindeutigen Artefakten auf.
3. `package_telegram` ruft optional `NPM Telegram Beta E2E` auf. Es läuft, wenn `telegram_mode` nicht `none` ist, und installiert dasselbe Artefakt `package-under-test`, wenn Package Acceptance eines aufgelöst hat; eigenständige Telegram-Dispatches können weiterhin eine veröffentlichte npm-Spezifikation installieren.
4. `summary` lässt den Workflow fehlschlagen, wenn Paketauflösung, Docker Acceptance oder die optionale Telegram-Lane fehlgeschlagen ist.

### Candidate-Quellen

- `source=npm` akzeptiert nur `openclaw@beta`, `openclaw@latest` oder eine exakte OpenClaw-Release-Version wie `openclaw@2026.4.27-beta.2`. Verwenden Sie dies für veröffentlichte Prerelease-/Stable-Acceptance.
- `source=ref` packt einen vertrauenswürdigen `package_ref`-Branch, -Tag oder vollständigen Commit-SHA. Der Resolver ruft OpenClaw-Branches/-Tags ab, überprüft, dass der ausgewählte Commit aus der Repository-Branch-Historie oder einem Release-Tag erreichbar ist, installiert Abhängigkeiten in einem losgelösten Worktree und packt ihn mit `scripts/package-openclaw-for-docker.mjs`.
- `source=url` lädt ein HTTPS-`.tgz` herunter; `package_sha256` ist erforderlich.
- `source=artifact` lädt ein `.tgz` aus `artifact_run_id` und `artifact_name` herunter; `package_sha256` ist optional, sollte aber für extern geteilte Artefakte angegeben werden.

Halten Sie `workflow_ref` und `package_ref` getrennt. `workflow_ref` ist der vertrauenswürdige Workflow-/Harness-Code, der den Test ausführt. `package_ref` ist der Source-Commit, der gepackt wird, wenn `source=ref` verwendet wird. Dadurch kann das aktuelle Test-Harness ältere vertrauenswürdige Source-Commits validieren, ohne alte Workflow-Logik auszuführen.

### Suite-Profile

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — vollständige Docker-Release-Pfad-Chunks mit OpenWebUI
- `custom` — exakte `docker_lanes`; erforderlich, wenn `suite_profile=custom`

Das Profil `package` verwendet Offline-Plugin-Abdeckung, sodass die Validierung veröffentlichter Pakete nicht von Live-ClawHub-Verfügbarkeit abhängt. Die optionale Telegram-Lane verwendet das Artefakt `package-under-test` in `NPM Telegram Beta E2E` wieder; der veröffentlichte npm-Spezifikationspfad bleibt für eigenständige Dispatches erhalten.

Zur dedizierten Richtlinie für Update- und Plugin-Tests, einschließlich lokaler Befehle,
Docker-Lanes, Package-Acceptance-Eingaben, Release-Defaults und Fehlertriage,
siehe [Testen von Updates und Plugins](/de/help/testing-updates-plugins).

Release-Checks rufen Package Acceptance mit `source=artifact`, dem vorbereiteten Release-Package-Artefakt, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=all-since-2026.4.23`, `published_upgrade_survivor_scenarios=reported-issues` und `telegram_mode=mock-openai` auf. Dadurch bleiben Paketmigration, Update, Bereinigung veralteter Plugin-Abhängigkeiten, Installationsreparatur für konfigurierte Plugins, Offline-Plugin, Plugin-Update und Telegram-Nachweis auf demselben aufgelösten Paket-Tarball. Setzen Sie `package_acceptance_package_spec` bei Full Release Validation oder OpenClaw Release Checks, um dieselbe Matrix gegen ein ausgeliefertes npm-Paket statt gegen das aus dem SHA gebaute Artefakt auszuführen. Cross-OS-Release-Checks decken weiterhin betriebssystemspezifisches Onboarding-, Installer- und Plattformverhalten ab; Produktvalidierung für Pakete/Updates sollte mit Package Acceptance beginnen. Die Docker-Lane `published-upgrade-survivor` validiert eine veröffentlichte Paket-Baseline pro Lauf. In Package Acceptance ist das aufgelöste Tarball `package-under-test` immer der Candidate, und `published_upgrade_survivor_baseline` wählt die veröffentlichte Fallback-Baseline aus, standardmäßig `openclaw@latest`; Befehle zur erneuten Ausführung fehlgeschlagener Lanes behalten diese Baseline bei. Setzen Sie `published_upgrade_survivor_baselines=all-since-2026.4.23`, um Full Release CI über jedes stabile npm-Release von `2026.4.23` bis `latest` zu erweitern; `release-history` bleibt für manuelles breiteres Sampling mit dem älteren Pre-Date-Anker verfügbar. Setzen Sie `published_upgrade_survivor_scenarios=reported-issues`, um dieselben Baselines über issue-förmige Fixtures für Feishu-Konfiguration, erhaltene Bootstrap-/Persona-Dateien, konfigurierte OpenClaw-Plugin-Installationen, Tilde-Logpfade und veraltete Legacy-Plugin-Abhängigkeits-Roots zu erweitern. Der separate Workflow `Update Migration` verwendet die Docker-Lane `update-migration` mit `all-since-2026.4.23` und `plugin-deps-cleanup`, wenn es um erschöpfende veröffentlichte Update-Bereinigung geht, nicht um normale Full-Release-CI-Breite. Lokale aggregierte Läufe können exakte Paketspezifikationen mit `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` übergeben, eine einzelne Lane mit `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` wie `openclaw@2026.4.15` beibehalten oder `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` für die Szenario-Matrix setzen. Die veröffentlichte Lane konfiguriert die Baseline mit einem eingebetteten `openclaw config set`-Befehlsrezept, zeichnet Rezeptschritte in `summary.json` auf und prüft `/healthz`, `/readyz` sowie den RPC-Status nach dem Gateway-Start. Die frischen Windows-Packaged- und Installer-Lanes prüfen außerdem, dass ein installiertes Paket einen Browser-Control-Override aus einem rohen absoluten Windows-Pfad importieren kann. Der OpenAI-Cross-OS-Agent-Turn-Smoke verwendet standardmäßig `OPENCLAW_CROSS_OS_OPENAI_MODEL`, wenn gesetzt, andernfalls `openai/gpt-5.4`, sodass Installations- und Gateway-Nachweis auf einem GPT-5-Testmodell bleiben und GPT-4.x-Defaults vermieden werden.

### Legacy-Kompatibilitätsfenster

Package Acceptance hat begrenzte Legacy-Kompatibilitätsfenster für bereits veröffentlichte Pakete. Pakete bis einschließlich `2026.4.25`, einschließlich `2026.4.25-beta.*`, können den Kompatibilitätspfad verwenden:

- bekannte private QA-Einträge in `dist/postinstall-inventory.json` dürfen auf Dateien verweisen, die im Tarball fehlen;
- `doctor-switch` darf den Unterfall zur Persistenz von `gateway install --wrapper` überspringen, wenn das Paket dieses Flag nicht bereitstellt;
- `update-channel-switch` darf fehlende `pnpm.patchedDependencies` aus dem aus dem Tarball abgeleiteten Fake-Git-Fixture entfernen und darf fehlendes persistiertes `update.channel` protokollieren;
- Plugin-Smokes dürfen Legacy-Install-Record-Speicherorte lesen oder fehlende Marketplace-Install-Record-Persistenz akzeptieren;
- `plugin-update` darf die Migration von Konfigurationsmetadaten zulassen, während weiterhin gefordert wird, dass Install Record und No-Reinstall-Verhalten unverändert bleiben.

Das veröffentlichte Paket `2026.4.26` darf auch vor lokal bereits ausgelieferten Build-Metadaten-Stamp-Dateien warnen. Spätere Pakete müssen die modernen Verträge erfüllen; dieselben Bedingungen schlagen dann fehl, statt zu warnen oder übersprungen zu werden.

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

Beginnen Sie beim Debuggen eines fehlgeschlagenen Paketakzeptanzlaufs mit der Zusammenfassung `resolve_package`, um Paketquelle, Version und SHA-256 zu bestätigen. Prüfen Sie anschließend den untergeordneten Lauf `docker_acceptance` und seine Docker-Artefakte: `.artifacts/docker-tests/**/summary.json`, `failures.json`, Lane-Logs, Phasen-Timings und Befehle zum erneuten Ausführen. Führen Sie bevorzugt das fehlgeschlagene Paketprofil oder die exakten Docker-Lanes erneut aus, statt die vollständige Release-Validierung erneut zu starten.

## Installations-Smoke-Test

Der separate Workflow `Install Smoke` verwendet dasselbe Scope-Skript über seinen eigenen Job `preflight` wieder. Er teilt die Smoke-Abdeckung in `run_fast_install_smoke` und `run_full_install_smoke` auf.

- **Schneller Pfad** läuft für Pull Requests, die Docker-/Paketoberflächen, Änderungen an gebündelten Plugin-Paketen/-Manifesten oder Kernoberflächen für Plugin/Kanal/Gateway/Plugin SDK berühren, die von den Docker-Smoke-Jobs ausgeführt werden. Reine Quelländerungen an gebündelten Plugins, reine Teständerungen und reine Dokumentationsänderungen reservieren keine Docker-Worker. Der schnelle Pfad baut das Root-Dockerfile-Image einmal, prüft die CLI, führt den CLI-Smoke-Test zum Löschen des gemeinsamen Arbeitsbereichs der Agents aus, führt den Container-Gateway-Netzwerk-E2E-Test aus, verifiziert ein Build-Argument für gebündelte Erweiterungen und führt das begrenzte gebündelte-Plugin-Docker-Profil mit einem aggregierten Befehls-Timeout von 240 Sekunden aus, wobei jeder Docker-Lauf eines Szenarios separat begrenzt ist.
- **Vollständiger Pfad** behält QR-Paketinstallation sowie Installer-Docker-/Update-Abdeckung für nächtlich geplante Läufe, manuelle Dispatches, Workflow-Call-Release-Checks und Pull Requests bei, die tatsächlich Installer-/Paket-/Docker-Oberflächen berühren. Im vollständigen Modus bereitet install-smoke ein Ziel-SHA-GHCR-Root-Dockerfile-Smoke-Image vor oder verwendet es wieder und führt dann QR-Paketinstallation, Root-Dockerfile-/Gateway-Smokes, Installer-/Update-Smokes und das schnelle gebündelte-Plugin-Docker-E2E als separate Jobs aus, damit Installer-Arbeit nicht hinter den Root-Image-Smokes warten muss.

`main`-Pushes (einschließlich Merge-Commits) erzwingen den vollständigen Pfad nicht; wenn die Changed-Scope-Logik bei einem Push vollständige Abdeckung anfordern würde, behält der Workflow den schnellen Docker-Smoke-Test bei und überlässt den vollständigen Installations-Smoke-Test der nächtlichen oder Release-Validierung.

Der langsame Bun-Global-Install-Image-Provider-Smoke-Test wird separat durch `run_bun_global_install_smoke` gesteuert. Er läuft im nächtlichen Zeitplan und aus dem Release-Checks-Workflow heraus, und manuelle `Install Smoke`-Dispatches können ihn aktivieren, Pull Requests und `main`-Pushes jedoch nicht. QR- und Installer-Docker-Tests behalten ihre eigenen installfokussierten Dockerfiles.

## Lokales Docker-E2E

`pnpm test:docker:all` baut ein gemeinsames Live-Test-Image vorab, packt OpenClaw einmal als npm-Tarball und baut zwei gemeinsame `scripts/e2e/Dockerfile`-Images:

- einen einfachen Node-/Git-Runner für Installer-/Update-/Plugin-Abhängigkeits-Lanes;
- ein funktionales Image, das denselben Tarball für normale Funktions-Lanes nach `/app` installiert.

Docker-Lane-Definitionen befinden sich in `scripts/lib/docker-e2e-scenarios.mjs`, die Planerlogik in `scripts/lib/docker-e2e-plan.mjs`, und der Runner führt nur den ausgewählten Plan aus. Der Scheduler wählt das Image pro Lane mit `OPENCLAW_DOCKER_E2E_BARE_IMAGE` und `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` aus und führt Lanes anschließend mit `OPENCLAW_SKIP_DOCKER_BUILD=1` aus.

### Einstellbare Parameter

| Variable                               | Standard | Zweck                                                                                         |
| -------------------------------------- | -------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10       | Slot-Anzahl des Haupt-Pools für normale Lanes.                                                |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10       | Provider-sensible Slot-Anzahl des Tail-Pools.                                                 |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9        | Obergrenze für gleichzeitige Live-Lanes, damit Provider nicht drosseln.                       |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10       | Obergrenze für gleichzeitige npm-Install-Lanes.                                               |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7        | Obergrenze für gleichzeitige Multi-Service-Lanes.                                             |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000     | Staffelung zwischen Lane-Starts zur Vermeidung von Docker-Daemon-Erstellungswellen; setzen Sie `0` für keine Staffelung. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000  | Fallback-Timeout pro Lane (120 Minuten); ausgewählte Live-/Tail-Lanes verwenden engere Grenzen. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset    | `1` gibt den Scheduler-Plan aus, ohne Lanes auszuführen.                                     |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset    | Durch Kommas getrennte exakte Lane-Liste; überspringt den Cleanup-Smoke, damit Agents eine fehlgeschlagene Lane reproduzieren können. |

Eine Lane, die schwerer als ihre effektive Grenze ist, kann trotzdem aus einem leeren Pool starten und läuft dann allein, bis sie Kapazität freigibt. Die lokale Aggregation führt Docker-Preflights aus, entfernt veraltete OpenClaw-E2E-Container, gibt den Status aktiver Lanes aus, persistiert Lane-Timings für Longest-first-Sortierung und stoppt standardmäßig nach dem ersten Fehler die Planung neuer gepoolter Lanes.

### Wiederverwendbarer Live-/E2E-Workflow

Der wiederverwendbare Live-/E2E-Workflow fragt `scripts/test-docker-all.mjs --plan-json`, welche Paket-, Image-Art-, Live-Image-, Lane- und Zugangsdatenabdeckung erforderlich ist. `scripts/docker-e2e.mjs` wandelt diesen Plan anschließend in GitHub-Ausgaben und Zusammenfassungen um. Es packt OpenClaw entweder über `scripts/package-openclaw-for-docker.mjs`, lädt ein Paketartefakt aus dem aktuellen Lauf herunter oder lädt ein Paketartefakt aus `package_artifact_run_id` herunter; validiert das Tarball-Inventar; baut und pusht paketdigest-getaggte Bare-/Functional-GHCR-Docker-E2E-Images über Blacksmiths Docker-Layer-Cache, wenn der Plan paketinstallierte Lanes benötigt; und verwendet bereitgestellte Eingaben `docker_e2e_bare_image`/`docker_e2e_functional_image` oder vorhandene Paketdigest-Images wieder, statt neu zu bauen. Docker-Image-Pulls werden mit einem begrenzten Timeout von 180 Sekunden pro Versuch erneut versucht, damit ein hängender Registry-/Cache-Stream schnell erneut versucht wird, statt den Großteil des kritischen CI-Pfads zu verbrauchen.

### Release-Pfad-Blöcke

Die Release-Docker-Abdeckung läuft in kleineren aufgeteilten Jobs mit `OPENCLAW_SKIP_DOCKER_BUILD=1`, sodass jeder Block nur die benötigte Image-Art zieht und mehrere Lanes über denselben gewichteten Scheduler ausführt:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Aktuelle Release-Docker-Blöcke sind `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` sowie `plugins-runtime-install-a` bis `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` und `plugins-integrations` bleiben aggregierte Plugin-/Runtime-Aliase. Der Lane-Alias `install-e2e` bleibt der aggregierte manuelle Wiederholungslauf-Alias für beide Provider-Installer-Lanes.

OpenWebUI wird in `plugins-runtime-services` eingebunden, wenn vollständige Release-Pfad-Abdeckung dies anfordert, und behält nur für OpenWebUI-only-Dispatches einen eigenständigen Block `openwebui`. Update-Lanes für gebündelte Kanäle versuchen bei vorübergehenden npm-Netzwerkfehlern einmal erneut.

Jeder Block lädt `.artifacts/docker-tests/` mit Lane-Logs, Timings, `summary.json`, `failures.json`, Phasen-Timings, Scheduler-Plan-JSON, Tabellen langsamer Lanes und Wiederholungslaufbefehlen pro Lane hoch. Die Workflow-Eingabe `docker_lanes` führt ausgewählte Lanes gegen die vorbereiteten Images aus statt gegen die Block-Jobs. Dadurch bleibt das Debuggen fehlgeschlagener Lanes auf einen gezielten Docker-Job begrenzt, und das Paketartefakt für diesen Lauf wird vorbereitet, heruntergeladen oder wiederverwendet; wenn eine ausgewählte Lane eine Live-Docker-Lane ist, baut der gezielte Job das Live-Test-Image für diesen Wiederholungslauf lokal. Generierte GitHub-Wiederholungslaufbefehle pro Lane enthalten `package_artifact_run_id`, `package_artifact_name` und vorbereitete Image-Eingaben, sofern diese Werte vorhanden sind, sodass eine fehlgeschlagene Lane exakt dasselbe Paket und dieselben Images aus dem fehlgeschlagenen Lauf wiederverwenden kann.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Der geplante Live-/E2E-Workflow führt täglich die vollständige Release-Pfad-Docker-Suite aus.

## Plugin-Prerelease

`Plugin Prerelease` ist teurere Produkt-/Paketabdeckung, daher ist es ein separater Workflow, der durch `Full Release Validation` oder durch einen expliziten Operator ausgelöst wird. Normale Pull Requests, `main`-Pushes und eigenständige manuelle CI-Dispatches halten diese Suite deaktiviert. Er verteilt Tests gebündelter Plugins auf acht Erweiterungs-Worker; diese Erweiterungs-Shard-Jobs führen jeweils bis zu zwei Plugin-Konfigurationsgruppen gleichzeitig aus, mit einem Vitest-Worker pro Gruppe und größerem Node-Heap, damit importlastige Plugin-Batches keine zusätzlichen CI-Jobs erzeugen. Der nur für Releases vorgesehene Docker-Prerelease-Pfad bündelt gezielte Docker-Lanes in kleinen Gruppen, um nicht Dutzende Runner für Jobs von ein bis drei Minuten zu reservieren.

## QA Lab

QA Lab verfügt über dedizierte CI-Lanes außerhalb des zentralen Smart-Scoped-Workflows. Agentische Parität ist unter die breiten QA- und Release-Harnesses geschachtelt, nicht als eigenständiger PR-Workflow. Verwenden Sie `Full Release Validation` mit `rerun_group=qa-parity`, wenn Parität Teil eines breiten Validierungslaufs sein soll.

- Der Workflow `QA-Lab - All Lanes` läuft nächtlich auf `main` und bei manuellem Dispatch; er fächert die Mock-Paritäts-Lane, Live-Matrix-Lane sowie Live-Telegram- und Discord-Lanes als parallele Jobs auf. Live-Jobs verwenden die Umgebung `qa-live-shared`, und Telegram/Discord verwenden Convex-Leases.

Release-Checks führen Matrix- und Telegram-Live-Transport-Lanes mit dem deterministischen Mock-Provider und mockqualifizierten Modellen (`mock-openai/gpt-5.5` und `mock-openai/gpt-5.5-alt`) aus, sodass der Kanalvertrag von Live-Modelllatenz und normalem Provider-Plugin-Start isoliert ist. Das Live-Transport-Gateway deaktiviert die Speichersuche, da QA-Parität das Speicherverhalten separat abdeckt; Provider-Konnektivität wird durch die separaten Live-Modell-, nativen Provider- und Docker-Provider-Suites abgedeckt.

Matrix verwendet `--profile fast` für geplante und Release-Gates und ergänzt `--fail-fast` nur, wenn die ausgecheckte CLI dies unterstützt. Der CLI-Standard und die manuelle Workflow-Eingabe bleiben `all`; ein manueller Dispatch mit `matrix_profile=all` shardet vollständige Matrix-Abdeckung immer in die Jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` und `e2ee-cli`.

`OpenClaw Release Checks` führt außerdem die releasekritischen QA-Lab-Lanes vor der Release-Freigabe aus; sein QA-Paritäts-Gate führt Kandidaten- und Baseline-Pakete als parallele Lane-Jobs aus und lädt anschließend beide Artefakte in einen kleinen Berichtsjob für den finalen Paritätsvergleich herunter.

Für normale PRs verwenden Sie gescopte CI-/Check-Nachweise, statt Parität als erforderlichen Status zu behandeln.

## CodeQL

Der `CodeQL`-Workflow ist bewusst als enger Sicherheits-Scanner für den ersten Durchlauf angelegt, nicht als vollständige Repository-Prüfung. Tägliche, manuelle und Wächterläufe für Pull Requests, die keine Entwürfe sind, scannen Actions-Workflow-Code sowie die JavaScript/TypeScript-Flächen mit dem höchsten Risiko und verwenden Sicherheitsabfragen mit hoher Konfidenz, gefiltert auf hohe/kritische `security-severity`.

Der Pull-Request-Wächter bleibt schlank: Er startet nur bei Änderungen unter `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` oder `src` und führt dieselbe Sicherheitsmatrix mit hoher Konfidenz aus wie der geplante Workflow. Android- und macOS-CodeQL bleiben aus den PR-Standardeinstellungen heraus.

### Sicherheitskategorien

| Kategorie                                         | Fläche                                                                                                                              |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Authentifizierung, Secrets, Sandbox, Cron und Gateway-Basislinie                                                                     |
| `/codeql-security-high/channel-runtime-boundary`  | Implementierungsverträge für zentrale Channels plus Channel-Plugin-Runtime, Gateway, Plugin SDK, Secrets, Audit-Berührungspunkte    |
| `/codeql-security-high/network-ssrf-boundary`     | Zentrale SSRF-, IP-Parsing-, Netzwerkschutz-, Web-Fetch- und SSRF-Policy-Flächen des Plugin SDK                                      |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP-Server, Hilfsfunktionen für Prozessausführung, ausgehende Zustellung und Gates für Tool-Ausführung durch Agents                 |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin-Installation, Loader, Manifest, Registry, Package-Manager-Installation, Source-Loading und Trust-Flächen des Plugin-SDK-Package-Vertrags |

### Plattformspezifische Sicherheits-Shards

- `CodeQL Android Critical Security` — geplanter Android-Sicherheits-Shard. Baut die Android-App manuell für CodeQL auf dem kleinsten Blacksmith-Linux-Runner, den die Workflow-Sanity akzeptiert. Lädt unter `/codeql-critical-security/android` hoch.
- `CodeQL macOS Critical Security` — wöchentlicher/manueller macOS-Sicherheits-Shard. Baut die macOS-App manuell für CodeQL auf Blacksmith macOS, filtert Build-Ergebnisse von Abhängigkeiten aus dem hochgeladenen SARIF heraus und lädt unter `/codeql-critical-security/macos` hoch. Bleibt außerhalb der täglichen Standardeinstellungen, weil der macOS-Build selbst bei sauberem Lauf die Laufzeit dominiert.

### Kategorien für Critical Quality

`CodeQL Critical Quality` ist der entsprechende Nicht-Sicherheits-Shard. Er führt nur JavaScript/TypeScript-Qualitätsabfragen mit Fehler-Schweregrad und ohne Sicherheitsbezug über enge, besonders wertvolle Flächen auf dem kleineren Blacksmith-Linux-Runner aus. Sein Pull-Request-Wächter ist bewusst kleiner als das geplante Profil: PRs, die keine Entwürfe sind, führen nur die passenden Shards `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` und `plugin-sdk-reply-runtime` aus, wenn sich Agent-Befehls-/Modell-/Tool-Ausführung und Reply-Dispatch-Code, Konfigurationsschema-/Migrations-/IO-Code, Auth-/Secrets-/Sandbox-/Sicherheitscode, zentrale Channel- und gebündelte Channel-Plugin-Runtime, Gateway-Protokoll-/Server-Methoden, Memory-Runtime-/SDK-Verbindungscode, MCP-/Prozess-/ausgehende Zustellung, Provider-Runtime-/Modellkatalog, Session-Diagnose-/Zustellungswarteschlangen, Plugin-Loader, Plugin-SDK-/Package-Vertrag oder Plugin-SDK-Reply-Runtime ändern. Änderungen an CodeQL-Konfiguration und Qualitäts-Workflow führen alle zwölf PR-Qualitäts-Shards aus.

Manuelle Ausführung akzeptiert:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Die engen Profile sind Lehr- und Iterations-Hooks, um einen Qualitäts-Shard isoliert auszuführen.

| Kategorie                                               | Fläche                                                                                                                                                                      |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Authentifizierung, Secrets, Sandbox, Cron und Code für die Gateway-Sicherheitsgrenze                                                                                        |
| `/codeql-critical-quality/config-boundary`              | Konfigurationsschema, Migration, Normalisierung und IO-Verträge                                                                                                             |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway-Protokollschemata und Server-Methoden-Verträge                                                                                                                     |
| `/codeql-critical-quality/channel-runtime-boundary`     | Implementierungsverträge für zentrale Channels und gebündelte Channel-Plugins                                                                                              |
| `/codeql-critical-quality/agent-runtime-boundary`       | Befehlsausführung, Modell-/Provider-Dispatch, Auto-Reply-Dispatch und Warteschlangen sowie ACP-Control-Plane-Runtime-Verträge                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP-Server und Tool-Bridges, Hilfsfunktionen für Prozessüberwachung und Verträge für ausgehende Zustellung                                                                 |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory-Host-SDK, Memory-Runtime-Fassaden, Memory-Plugin-SDK-Aliasse, Verbindungscode für Memory-Runtime-Aktivierung und Memory-Doctor-Befehle                              |
| `/codeql-critical-quality/session-diagnostics-boundary` | Interna der Reply-Warteschlange, Session-Zustellungswarteschlangen, Hilfsfunktionen für ausgehende Session-Bindung/-Zustellung, Diagnose-Event-/Log-Bundle-Flächen und Session-Doctor-CLI-Verträge |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin-SDK-Dispatch für eingehende Replies, Reply-Payload-/Chunking-/Runtime-Hilfsfunktionen, Channel-Reply-Optionen, Zustellungswarteschlangen und Hilfsfunktionen für Session-/Thread-Bindung |
| `/codeql-critical-quality/provider-runtime-boundary`    | Modellkatalog-Normalisierung, Provider-Authentifizierung und -Discovery, Provider-Runtime-Registrierung, Provider-Standardeinstellungen/-Kataloge sowie Web-/Search-/Fetch-/Embedding-Registries |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap der Control UI, lokale Persistenz, Gateway-Control-Flows und Task-Control-Plane-Runtime-Verträge                                                                 |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Zentrale Web-Fetch-/Search-Flächen, Medien-IO, Medienverständnis, Bildgenerierung und Runtime-Verträge für Mediengenerierung                                               |
| `/codeql-critical-quality/plugin-boundary`              | Loader-, Registry-, Public-Surface- und Plugin-SDK-Entrypoint-Verträge                                                                                                     |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Veröffentlichtes Package-seitiges Plugin-SDK-Source und Hilfsfunktionen für Plugin-Package-Verträge                                                                        |

Qualität bleibt von Sicherheit getrennt, damit Qualitätsbefunde geplant, gemessen, deaktiviert oder erweitert werden können, ohne das Sicherheitssignal zu verdecken. Swift-, Python- und gebündelte-Plugin-CodeQL-Erweiterungen sollten erst wieder als eng begrenzte oder geshardete Folgearbeit hinzugefügt werden, nachdem die engen Profile stabile Laufzeit und stabiles Signal haben.

## Wartungs-Workflows

### Docs Agent

Der `Docs Agent`-Workflow ist eine ereignisgesteuerte Codex-Wartungsspur, um bestehende Dokumentation mit kürzlich gelandeten Änderungen abzugleichen. Er hat keinen reinen Zeitplan: Ein erfolgreicher, nicht von einem Bot stammender Push-CI-Lauf auf `main` kann ihn auslösen, und manuelle Ausführung kann ihn direkt starten. Workflow-Run-Aufrufe werden übersprungen, wenn `main` weitergelaufen ist oder wenn in der letzten Stunde ein anderer, nicht übersprungener Docs-Agent-Lauf erstellt wurde. Wenn er läuft, prüft er den Commit-Bereich von der vorherigen nicht übersprungenen Docs-Agent-Source-SHA bis zum aktuellen `main`, sodass ein stündlicher Lauf alle Main-Änderungen abdecken kann, die seit dem letzten Dokumentationsdurchlauf aufgelaufen sind.

### Test Performance Agent

Der `Test Performance Agent`-Workflow ist eine ereignisgesteuerte Codex-Wartungsspur für langsame Tests. Er hat keinen reinen Zeitplan: Ein erfolgreicher, nicht von einem Bot stammender Push-CI-Lauf auf `main` kann ihn auslösen, aber er überspringt, wenn an diesem UTC-Tag bereits ein anderer Workflow-Run-Aufruf gelaufen ist oder läuft. Manuelle Ausführung umgeht dieses tägliche Aktivitäts-Gate. Die Spur erstellt einen gruppierten Vitest-Performance-Bericht für die vollständige Suite, lässt Codex nur kleine, Coverage-erhaltende Test-Performance-Korrekturen statt breiter Refactorings vornehmen, führt danach den Full-Suite-Bericht erneut aus und verwirft Änderungen, die die Anzahl der bestehenden bestandenen Baseline-Tests reduzieren. Wenn die Baseline fehlschlagende Tests hat, darf Codex nur offensichtliche Fehler beheben, und der Full-Suite-Bericht nach dem Agent muss bestanden sein, bevor etwas committed wird. Wenn `main` weiterläuft, bevor der Bot-Push landet, rebaset die Spur den validierten Patch, führt `pnpm check:changed` erneut aus und versucht den Push erneut; konfligierende veraltete Patches werden übersprungen. Sie verwendet GitHub-gehostetes Ubuntu, damit die Codex-Action dieselbe Drop-Sudo-Sicherheitshaltung wie der Docs Agent beibehalten kann.

### Doppelte PRs nach Merge

Der `Duplicate PRs After Merge`-Workflow ist ein manueller Maintainer-Workflow für die Bereinigung von Duplikaten nach dem Landen. Er verwendet standardmäßig einen Dry Run und schließt nur ausdrücklich aufgeführte PRs, wenn `apply=true` ist. Bevor GitHub geändert wird, prüft er, dass der gelandete PR gemerged ist und dass jedes Duplikat entweder ein gemeinsam referenziertes Issue oder überlappende geänderte Hunks hat.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Lokale Check-Gates und Routing für Änderungen

Die lokale Changed-Lane-Logik liegt in `scripts/changed-lanes.mjs` und wird von `scripts/check-changed.mjs` ausgeführt. Dieses lokale Check-Gate ist bei Architekturgrenzen strenger als der breite CI-Plattformumfang:

- Änderungen an zentralem Produktionscode führen Core-Prod- und Core-Test-Typecheck plus Core-Lint/-Guards aus;
- reine Änderungen an zentralen Tests führen nur Core-Test-Typecheck plus Core-Lint aus;
- Änderungen an Plugin-Produktionscode führen Plugin-Prod- und Plugin-Test-Typecheck plus Plugin-Lint aus;
- reine Änderungen an Plugin-Tests führen Plugin-Test-Typecheck plus Plugin-Lint aus;
- Änderungen am öffentlichen Plugin SDK oder an Plugin-Verträgen erweitern auf Plugin-Typecheck, weil Plugins von diesen zentralen Verträgen abhängen (Vitest-Plugin-Sweeps bleiben explizite Testarbeit);
- reine Versionsbump-Änderungen an Release-Metadaten führen gezielte Versions-/Konfigurations-/Root-Abhängigkeitschecks aus;
- unbekannte Root-/Konfigurationsänderungen schlagen sicher auf alle Check-Lanes aus.

Lokales Changed-Test-Routing liegt in `scripts/test-projects.test-support.mjs` und ist bewusst günstiger als `check:changed`: Direkte Teständerungen führen sich selbst aus, Source-Änderungen bevorzugen explizite Mappings, danach Geschwistertests und Import-Graph-Abhängige. Shared-Group-Room-Zustellungskonfiguration ist eines der expliziten Mappings: Änderungen an der für Gruppen sichtbaren Reply-Konfiguration, am Source-Reply-Zustellungsmodus oder am System-Prompt des Message-Tools laufen über die zentralen Reply-Tests plus Discord- und Slack-Zustellungsregressionen, damit eine gemeinsame Standardänderung vor dem ersten PR-Push fehlschlägt. Verwenden Sie `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` nur, wenn die Änderung so weitreichend für das Test-Harness ist, dass das günstige gemappte Set kein vertrauenswürdiger Proxy ist.

## Testbox-Validierung

Führen Sie Testbox vom Repo-Root aus und bevorzugen Sie für breite Validierung eine frisch vorgewärmte Box. Bevor Sie eine langsame Gate-Prüfung auf einer Box ausführen, die wiederverwendet wurde, abgelaufen ist oder gerade eine unerwartet große Synchronisierung gemeldet hat, führen Sie zuerst `pnpm testbox:sanity` innerhalb der Box aus.

Die Sanity-Prüfung schlägt schnell fehl, wenn erforderliche Root-Dateien wie `pnpm-lock.yaml` verschwunden sind oder wenn `git status --short` mindestens 200 nachverfolgte Löschungen anzeigt. Das bedeutet in der Regel, dass der Remote-Synchronisierungszustand keine vertrauenswürdige Kopie des PR ist; stoppen Sie diese Box und wärmen Sie stattdessen eine frische vor, anstatt den Produkttestfehler zu debuggen. Für absichtliche PRs mit vielen Löschungen setzen Sie für diesen Sanity-Lauf `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`.

`pnpm testbox:run` beendet außerdem eine lokale Blacksmith-CLI-Ausführung, die länger als fünf Minuten in der Synchronisierungsphase bleibt, ohne Ausgabe nach der Synchronisierung zu liefern. Setzen Sie `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, um diese Schutzvorkehrung zu deaktivieren, oder verwenden Sie einen größeren Millisekundenwert für ungewöhnlich große lokale Diffs.

Crabbox ist der repo-eigene zweite Remote-Box-Pfad für Linux-Nachweise, wenn Blacksmith nicht verfügbar ist oder wenn eigene Cloud-Kapazität vorzuziehen ist. Wärmen Sie eine Box vor, hydratisieren Sie sie über den Projekt-Workflow und führen Sie dann Befehle über die Crabbox-CLI aus:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` verwaltet die Standardwerte für Provider, Synchronisierung und GitHub Actions-Hydration. Sie schließt die lokale `.git` aus, damit der hydratisierte Actions-Checkout seine eigenen Remote-Git-Metadaten behält, statt maintainer-lokale Remotes und Objektspeicher zu synchronisieren, und sie schließt lokale Laufzeit-/Build-Artefakte aus, die niemals übertragen werden sollten. `.github/workflows/crabbox-hydrate.yml` verwaltet Checkout, Node-/pnpm-Einrichtung, `origin/main`-Abruf und die nicht geheime Umgebungsübergabe, die spätere `crabbox run --id <cbx_id>`-Befehle sourcen.

## Verwandte Themen

- [Installationsübersicht](/de/install)
- [Entwicklungskanäle](/de/install/development-channels)
