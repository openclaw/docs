---
read_when:
    - Sie müssen nachvollziehen, warum ein CI-Job ausgeführt wurde oder nicht.
    - Sie debuggen eine fehlgeschlagene GitHub Actions-Prüfung
    - Sie koordinieren einen Lauf oder eine erneute Ausführung der Release-Validierung
    - Sie ändern den ClawSweeper-Dispatch oder die Weiterleitung von GitHub-Aktivitäten
summary: CI-Jobgraph, Umfangs-Gates, Release-Dachbereiche und lokale Befehlsäquivalente
title: CI-Pipeline
x-i18n:
    generated_at: "2026-05-10T19:25:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: b4317a3985fd34470c4b9fd981a2048af9c395bdc65fe99853286628d1ee47d3
    source_path: ci.md
    workflow: 16
---

OpenClaw-CI wird bei jedem Push auf `main` und bei jedem Pull Request ausgeführt. Der Job `preflight` klassifiziert den Diff und deaktiviert teure Lanes, wenn sich nur nicht verwandte Bereiche geändert haben. Manuelle `workflow_dispatch`-Ausführungen umgehen Smart Scoping bewusst und fächern den vollständigen Graphen für Release Candidates und breite Validierung auf. Android-Lanes bleiben über `include_android` opt-in. Die nur für Releases vorgesehene Plugin-Abdeckung befindet sich im separaten Workflow [`Plugin-Vorab-Release`](#plugin-prerelease) und wird nur aus [`Vollständige Release-Validierung`](#full-release-validation) oder einem expliziten manuellen Dispatch ausgeführt.

## Pipeline-Übersicht

| Job                              | Zweck                                                                                                                        | Wann er ausgeführt wird                         |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `preflight`                      | Erkennt reine Docs-Änderungen, geänderte Scopes, geänderte Erweiterungen und erstellt das CI-Manifest                       | Immer bei Nicht-Draft-Pushes und PRs            |
| `security-scm-fast`              | Erkennung privater Schlüssel und Workflow-Audit über `zizmor`                                                               | Immer bei Nicht-Draft-Pushes und PRs            |
| `security-dependency-audit`      | Dependency-freier Audit des Produktions-Lockfiles gegen npm-Advisories                                                       | Immer bei Nicht-Draft-Pushes und PRs            |
| `security-fast`                  | Erforderliches Aggregat für die schnellen Security-Jobs                                                                      | Immer bei Nicht-Draft-Pushes und PRs            |
| `check-dependencies`             | Reiner Produktions-Knip-Dependency-Durchlauf plus Allowlist-Guard für ungenutzte Dateien                                    | Node-relevante Änderungen                       |
| `build-artifacts`                | Baut `dist/`, die Control UI, Prüfungen für gebaute Artefakte und wiederverwendbare Downstream-Artefakte                    | Node-relevante Änderungen                       |
| `checks-fast-core`               | Schnelle Linux-Korrektheits-Lanes wie Prüfungen für gebündelte Plugins, Plugin-Verträge und Protokolle                      | Node-relevante Änderungen                       |
| `checks-fast-contracts-channels` | Geshardete Channel-Vertragsprüfungen mit stabilem aggregiertem Prüfergebnis                                                 | Node-relevante Änderungen                       |
| `checks-node-core-test`          | Core-Node-Test-Shards ohne Channel-, gebündelte, Vertrags- und Erweiterungs-Lanes                                            | Node-relevante Änderungen                       |
| `check`                          | Geshardetes Äquivalent des lokalen Haupt-Gates: Produktionstypen, Lint, Guards, Testtypen und strikter Smoke-Test           | Node-relevante Änderungen                       |
| `check-additional`               | Architektur, geshardete Boundary-/Prompt-Drift, Erweiterungs-Guards, Package-Boundary und Gateway-Watch                    | Node-relevante Änderungen                       |
| `build-smoke`                    | Smoke-Tests für die gebaute CLI und Startup-Memory-Smoke                                                                     | Node-relevante Änderungen                       |
| `checks`                         | Verifier für Channel-Tests mit gebauten Artefakten                                                                           | Node-relevante Änderungen                       |
| `checks-node-compat-node22`      | Node-22-Kompatibilitäts-Build und Smoke-Lane                                                                                 | Manueller CI-Dispatch für Releases              |
| `check-docs`                     | Docs-Formatierung, Lint und Broken-Link-Prüfungen                                                                            | Docs geändert                                   |
| `skills-python`                  | Ruff + pytest für Python-gestützte Skills                                                                                    | Änderungen mit Relevanz für Python-Skills       |
| `checks-windows`                 | Windows-spezifische Prozess-/Pfadtests plus Regressionen bei gemeinsamen Runtime-Import-Spezifizierern                      | Windows-relevante Änderungen                    |
| `macos-node`                     | macOS-TypeScript-Test-Lane mit den gemeinsam gebauten Artefakten                                                             | macOS-relevante Änderungen                      |
| `macos-swift`                    | Swift-Lint, Build und Tests für die macOS-App                                                                                | macOS-relevante Änderungen                      |
| `android`                        | Android-Unit-Tests für beide Flavors plus ein Debug-APK-Build                                                                | Android-relevante Änderungen                    |
| `test-performance-agent`         | Tägliche Codex-Optimierung langsamer Tests nach vertrauenswürdiger Aktivität                                                 | Erfolg der Main-CI oder manueller Dispatch      |
| `openclaw-performance`           | Tägliche/bedarfsweise Kova-Runtime-Performanceberichte mit Mock-Provider, Deep-Profile und GPT-5.4-Live-Lanes              | Geplanter und manueller Dispatch                |

## Fail-Fast-Reihenfolge

1. `preflight` entscheidet, welche Lanes überhaupt existieren. Die Logik `docs-scope` und `changed-scope` sind Schritte innerhalb dieses Jobs, keine eigenständigen Jobs.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` und `skills-python` schlagen schnell fehl, ohne auf die schwergewichtigeren Artefakt- und Plattform-Matrix-Jobs zu warten.
3. `build-artifacts` überschneidet sich mit den schnellen Linux-Lanes, damit Downstream-Consumer starten können, sobald der gemeinsame Build bereit ist.
4. Schwergewichtigere Plattform- und Runtime-Lanes fächern danach auf: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` und `android`.

GitHub kann überholte Jobs als `cancelled` markieren, wenn ein neuerer Push auf demselben PR oder derselben `main`-Ref landet. Behandeln Sie das als CI-Rauschen, sofern nicht auch der neueste Lauf für dieselbe Ref fehlschlägt. Aggregierte Shard-Prüfungen verwenden `!cancelled() && always()`, sodass sie normale Shard-Fehler weiterhin melden, aber nicht mehr in die Queue gestellt werden, nachdem der gesamte Workflow bereits überholt wurde. Der automatische CI-Concurrency-Key ist versioniert (`CI-v7-*`), damit ein GitHub-seitiger Zombie in einer alten Queue-Gruppe neuere Main-Läufe nicht unbegrenzt blockieren kann. Manuelle Full-Suite-Läufe verwenden `CI-manual-v1-*` und brechen laufende Ausführungen nicht ab.

Der Job `ci-timings-summary` lädt für jeden Nicht-Draft-CI-Lauf ein kompaktes Artefakt `ci-timings-summary` hoch. Es zeichnet Wall Time, Queue-Zeit, langsamste Jobs und fehlgeschlagene Jobs für den aktuellen Lauf auf, sodass CI-Health-Checks nicht wiederholt die vollständige Actions-Payload auslesen müssen.

## Scope und Routing

Die Scope-Logik befindet sich in `scripts/ci-changed-scope.mjs` und ist durch Unit-Tests in `src/scripts/ci-changed-scope.test.ts` abgedeckt. Manueller Dispatch überspringt die Changed-Scope-Erkennung und lässt das Preflight-Manifest so handeln, als hätte sich jeder gescopte Bereich geändert.

- **CI-Workflow-Änderungen** validieren den Node-CI-Graphen plus Workflow-Linting, erzwingen aber für sich genommen keine nativen Windows-, Android- oder macOS-Builds; diese Plattform-Lanes bleiben auf Änderungen am Plattform-Quellcode beschränkt.
- **Nur-CI-Routing-Änderungen, ausgewählte günstige Core-Test-Fixture-Änderungen und enge Plugin-Vertrags-Helfer-/Test-Routing-Änderungen** verwenden einen schnellen reinen Node-Manifest-Pfad: `preflight`, Security und eine einzelne `checks-fast-core`-Aufgabe. Dieser Pfad überspringt Build-Artefakte, Node-22-Kompatibilität, Channel-Verträge, vollständige Core-Shards, Shards gebündelter Plugins und zusätzliche Guard-Matrizen, wenn die Änderung auf die Routing- oder Helferoberflächen begrenzt ist, die die schnelle Aufgabe direkt ausübt.
- **Windows-Node-Prüfungen** sind auf Windows-spezifische Prozess-/Pfad-Wrapper, npm/pnpm/UI-Runner-Helfer, Package-Manager-Konfiguration und die CI-Workflow-Oberflächen gescopet, die diese Lane ausführen; nicht verwandte Source-, Plugin-, Install-Smoke- und reine Teständerungen bleiben auf den Linux-Node-Lanes.

Die langsamsten Node-Testfamilien sind aufgeteilt oder ausbalanciert, damit jeder Job klein bleibt, ohne Runner übermäßig zu reservieren: Channel-Verträge laufen als drei gewichtete Blacksmith-gestützte Shards mit Standard-GitHub-Runner-Fallback, schnelle Core-Unit-/Support-Lanes laufen separat, Core-Runtime-Infrastruktur ist zwischen State-, Process/Config-, Cron- und Shared-Shards aufgeteilt, Auto-Reply läuft als ausbalancierte Worker (wobei der Reply-Teilbaum in Agent-Runner-, Dispatch- und Commands/State-Routing-Shards aufgeteilt ist), und agentische Gateway-/Server-Konfigurationen sind über Chat-/Auth-/Model-/HTTP-Plugin-/Runtime-/Startup-Lanes aufgeteilt, statt auf gebaute Artefakte zu warten. Breite Browser-, QA-, Media- und sonstige Plugin-Tests verwenden ihre dedizierten Vitest-Konfigurationen statt des gemeinsamen Plugin-Catch-Alls. Include-Pattern-Shards zeichnen Timing-Einträge mit dem CI-Shard-Namen auf, sodass `.artifacts/vitest-shard-timings.json` eine ganze Konfiguration von einem gefilterten Shard unterscheiden kann. `check-additional` hält Package-Boundary-Compile-/Canary-Arbeit zusammen und trennt Runtime-Topology-Architektur von Gateway-Watch-Abdeckung; die Boundary-Guard-Liste wird über vier Matrix-Shards gestreift, wobei jeder ausgewählte unabhängige Guards parallel ausführt und Timing pro Prüfung ausgibt. Die teure Codex-Happy-Path-Prompt-Snapshot-Drift-Prüfung läuft als eigener zusätzlicher Job für manuelle CI und nur für Prompt-beeinflussende Änderungen, sodass normale nicht verwandte Node-Änderungen nicht hinter kalter Prompt-Snapshot-Erzeugung warten und die Boundary-Shards ausbalanciert bleiben, während Prompt Drift dennoch an den PR gebunden ist, der sie verursacht hat; dasselbe Flag überspringt die Prompt-Snapshot-Vitest-Erzeugung innerhalb des Core-Support-Boundary-Shards für gebaute Artefakte. Gateway-Watch, Channel-Tests und der Core-Support-Boundary-Shard laufen innerhalb von `build-artifacts` parallel, nachdem `dist/` und `dist-runtime/` bereits gebaut sind.

Android-CI führt sowohl `testPlayDebugUnitTest` als auch `testThirdPartyDebugUnitTest` aus und baut anschließend das Play-Debug-APK. Der Third-Party-Flavor hat kein separates Source Set oder Manifest; seine Unit-Test-Lane kompiliert den Flavor trotzdem mit den BuildConfig-Flags für SMS/Call Log, während ein doppelter Debug-APK-Packaging-Job bei jedem Android-relevanten Push vermieden wird.

Der Shard `check-dependencies` führt `pnpm deadcode:dependencies` (einen reinen Produktions-Knip-Dependency-Durchlauf, der auf die neueste Knip-Version gepinnt ist, wobei pnpm's Mindest-Release-Alter für die `dlx`-Installation deaktiviert ist) und `pnpm deadcode:unused-files` aus, das Knips Produktionsfunde ungenutzter Dateien mit `scripts/deadcode-unused-files.allowlist.mjs` vergleicht. Der Unused-File-Guard schlägt fehl, wenn ein PR eine neue ungeprüfte ungenutzte Datei hinzufügt oder einen veralteten Allowlist-Eintrag zurücklässt, während absichtliche dynamische Plugin-, generierte, Build-, Live-Test- und Package-Bridge-Oberflächen erhalten bleiben, die Knip statisch nicht auflösen kann.

## ClawSweeper-Aktivitätsweiterleitung

`.github/workflows/clawsweeper-dispatch.yml` ist die zielseitige Brücke von OpenClaw-Repository-Aktivität zu ClawSweeper. Sie checkt keinen nicht vertrauenswürdigen Pull-Request-Code aus und führt ihn nicht aus. Der Workflow erstellt aus `CLAWSWEEPER_APP_PRIVATE_KEY` ein GitHub-App-Token und dispatcht anschließend kompakte `repository_dispatch`-Payloads an `openclaw/clawsweeper`.

Der Workflow hat vier Lanes:

- `clawsweeper_item` für exakte Review-Anfragen zu Issues und Pull Requests;
- `clawsweeper_comment` für explizite ClawSweeper-Befehle in Issue-Kommentaren;
- `clawsweeper_commit_review` für Review-Anfragen auf Commit-Ebene bei `main`-Pushes;
- `github_activity` für allgemeine GitHub-Aktivität, die der ClawSweeper-Agent inspizieren kann.

Die Lane `github_activity` leitet nur normalisierte Metadaten weiter: Ereignistyp, Aktion, Akteur, Repository, Elementnummer, URL, Titel, Status und kurze Auszüge für Kommentare oder Reviews, sofern vorhanden. Sie vermeidet bewusst die Weiterleitung des vollständigen Webhook-Bodys. Der empfangende Workflow in `openclaw/clawsweeper` ist `.github/workflows/github-activity.yml`; er postet das normalisierte Ereignis an den OpenClaw-Gateway-Hook für den ClawSweeper-Agent.

Allgemeine Aktivität ist Beobachtung, keine standardmäßige Zustellung. Der ClawSweeper-Agent erhält das Discord-Ziel in seinem Prompt und sollte nur dann in `#clawsweeper` posten, wenn das Ereignis überraschend, handlungsrelevant, riskant oder betrieblich nützlich ist. Routine-Öffnungen, Bearbeitungen, Bot-Aktivität, doppelte Webhook-Geräusche und normaler Review-Traffic sollten zu `NO_REPLY` führen.

Behandeln Sie GitHub-Titel, -Kommentare, -Bodies, Review-Texte, Branch-Namen und Commit-Nachrichten in diesem gesamten Pfad als nicht vertrauenswürdige Daten. Sie sind Eingaben für Zusammenfassung und Triage, keine Anweisungen für den Workflow oder die Agent-Laufzeit.

## Manuelle Dispatches

Manuelle CI-Dispatches führen denselben Job-Graphen wie normale CI aus, erzwingen aber jede nicht auf Android beschränkte Lane: Linux-Node-Shards, gebündelte-Plugin-Shards, Channel-Verträge, Node-22-Kompatibilität, `check`, `check-additional`, Build-Smoke, Docs-Prüfungen, Python-Skills, Windows, macOS und Control-UI-i18n. Eigenständige manuelle CI-Dispatches führen Android nur mit `include_android=true` aus; das vollständige Release-Umbrella aktiviert Android, indem es `include_android=true` übergibt. Statische Plugin-Prerelease-Prüfungen, der nur für Releases vorgesehene `agentic-plugins`-Shard, der vollständige Extension-Batch-Sweep und Plugin-Prerelease-Docker-Lanes sind von CI ausgeschlossen. Die Docker-Prerelease-Suite läuft nur, wenn `Full Release Validation` den separaten `Plugin Prerelease`-Workflow mit aktivierter Release-Validation-Gate auslöst.

Manuelle Läufe verwenden eine eindeutige Concurrency-Gruppe, damit eine vollständige Release-Candidate-Suite nicht durch einen anderen Push- oder PR-Lauf auf demselben Ref abgebrochen wird. Die optionale Eingabe `target_ref` ermöglicht einem vertrauenswürdigen Aufrufer, diesen Graphen gegen einen Branch, Tag oder vollständigen Commit-SHA auszuführen, während die Workflow-Datei aus dem ausgewählten Dispatch-Ref verwendet wird.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, schnelle Sicherheitsjobs und Aggregate (`security-scm-fast`, `security-dependency-audit`, `security-fast`), schnelle Protocol-/Contract-/Bundled-Prüfungen, geshardete Channel-Contract-Prüfungen, `check`-Shards außer Lint, `check-additional`-Aggregate, Node-Test-Aggregat-Verifizierer, Docs-Prüfungen, Python-Skills, Workflow-Sanity, Labeler, Auto-Response; Install-Smoke-Preflight verwendet ebenfalls GitHub-gehostetes Ubuntu, damit die Blacksmith-Matrix früher in die Warteschlange gelangen kann |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, leichtere Extension-Shards, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` und `check-test-types`                                                                                                                                                                                                                                                                                                             |
| `blacksmith-8vcpu-ubuntu-2404`   | Build-Smoke, Linux-Node-Test-Shards, gebündelte Plugin-Test-Shards, `check-additional`-Shards, `android`                                                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-ubuntu-2404`  | `build-artifacts`, `check-lint` (CPU-sensitiv genug, dass 8 vCPU mehr kosteten, als sie sparten); Install-Smoke-Docker-Builds (32-vCPU-Warteschlangenzeit kostete mehr, als sie sparte)                                                                                                                                                                                                                                                                       |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` auf `openclaw/openclaw`; Forks fallen auf `macos-latest` zurück                                                                                                                                                                                                                                                                                                                                                                                 |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` auf `openclaw/openclaw`; Forks fallen auf `macos-latest` zurück                                                                                                                                                                                                                                                                                                                                                                                |

Die CI des kanonischen Repos behält Blacksmith als Standard-Runner-Pfad bei. Während `preflight` prüft `scripts/ci-runner-labels.mjs` aktuelle eingereihte und laufende Actions-Läufe auf eingereihte Blacksmith-Jobs. Wenn für ein bestimmtes Blacksmith-Label bereits Jobs eingereiht sind, fallen nachgelagerte Jobs, die genau dieses Label verwenden würden, nur für diesen Lauf auf den passenden GitHub-gehosteten Runner (`ubuntu-24.04`, `windows-2025` oder `macos-latest`) zurück. Andere Blacksmith-Größen derselben OS-Familie bleiben auf ihren primären Labels. Wenn der API-Probe fehlschlägt, wird kein Fallback angewendet.

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

## OpenClaw Performance

`OpenClaw Performance` ist der Performance-Workflow für Produkt und Laufzeit. Er läuft täglich auf `main` und kann manuell ausgelöst werden:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Ein manueller Dispatch benchmarked normalerweise den Workflow-Ref. Setzen Sie `target_ref`, um ein Release-Tag oder einen anderen Branch mit der aktuellen Workflow-Implementierung zu benchmarken. Veröffentlichte Report-Pfade und Latest-Pointer werden nach dem getesteten Ref indiziert, und jede `index.md` zeichnet getesteten Ref/SHA, Workflow-Ref/SHA, Kova-Ref, Profil, Lane-Auth-Modus, Modell, Wiederholungsanzahl und Szenariofilter auf.

Der Workflow installiert OCM aus einem gepinnten Release und Kova aus `openclaw/Kova` mit der gepinnten Eingabe `kova_ref` und führt dann drei Lanes aus:

- `mock-provider`: Kova-Diagnoseszenarien gegen eine lokal gebaute Laufzeit mit deterministischer gefälschter OpenAI-kompatibler Authentifizierung.
- `mock-deep-profile`: CPU-/Heap-/Trace-Profiling für Hotspots bei Startup, Gateway und Agent-Turn.
- `live-gpt54`: ein echter OpenAI-`openai/gpt-5.4`-Agent-Turn, übersprungen, wenn `OPENAI_API_KEY` nicht verfügbar ist.

Die Mock-Provider-Lane führt nach dem Kova-Durchlauf außerdem OpenClaw-native Source-Probes aus: Gateway-Boot-Timing und Arbeitsspeicher über Default-, Hook- und 50-Plugin-Startup-Fälle hinweg; wiederholte Mock-OpenAI-`channel-chat-baseline`-Hello-Loops; und CLI-Startup-Befehle gegen das gestartete Gateway. Die Markdown-Zusammenfassung der Source-Probes liegt unter `source/index.md` im Report-Bundle, mit Roh-JSON daneben.

Jede Lane lädt GitHub-Artefakte hoch. Wenn `CLAWGRIT_REPORTS_TOKEN` konfiguriert ist, committet der Workflow außerdem `report.json`, `report.md`, Bundles, `index.md` und Source-Probe-Artefakte nach `openclaw/clawgrit-reports` unter `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Der aktuelle Pointer des getesteten Refs wird als `openclaw-performance/<tested-ref>/latest-<lane>.json` geschrieben.

## Vollständige Release-Validierung

`Full Release Validation` ist der manuelle Umbrella-Workflow für „alles vor dem Release ausführen“. Er akzeptiert einen Branch, ein Tag oder einen vollständigen Commit-SHA, löst den manuellen `CI`-Workflow mit diesem Ziel aus, löst `Plugin Prerelease` für nur im Release benötigte Plugin-/Package-/statische-/Docker-Nachweise aus und löst `OpenClaw Release Checks` für Install-Smoke, Package Acceptance, Cross-OS-Package-Prüfungen, QA-Lab-Parität, Matrix- und Telegram-Lanes aus. Stabile/Default-Läufe halten umfassende Live-/E2E- und Docker-Release-Pfad-Abdeckung hinter `run_release_soak=true`; `release_profile=full` erzwingt diese Soak-Abdeckung, damit breite Advisory-Validierung breit bleibt. Mit `rerun_group=all` und `release_profile=full` führt er außerdem `NPM Telegram Beta E2E` gegen das Artefakt `release-package-under-test` aus den Release-Prüfungen aus. Übergeben Sie nach der Veröffentlichung `npm_telegram_package_spec`, um dieselbe Telegram-Package-Lane gegen das veröffentlichte npm-Package erneut auszuführen.

Siehe [Vollständige Release-Validierung](/de/reference/full-release-validation) für die
Stage-Matrix, exakten Workflow-Jobnamen, Profilunterschiede, Artefakte und
Handles für fokussierte Wiederholungen.

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

Für den Nachweis eines fixierten Commits auf einem schnelllebigen Branch verwenden Sie den Helper anstelle von
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub-Workflow-Dispatch-Refs müssen Branches oder Tags sein, keine rohen Commit-SHAs. Der
Helper pusht einen temporären Branch `release-ci/<sha>-...` am Ziel-SHA,
dispatcht `Full Release Validation` von diesem fixierten Ref, verifiziert, dass jeder untergeordnete
Workflow-`headSha` dem Ziel entspricht, und löscht den temporären Branch, wenn der
Lauf abgeschlossen ist. Der Umbrella-Verifier schlägt ebenfalls fehl, wenn ein untergeordneter Workflow mit einem
anderen SHA gelaufen ist.

`release_profile` steuert die Live-/Provider-Breite, die an Release-Prüfungen übergeben wird. Die
manuellen Release-Workflows verwenden standardmäßig `stable`; verwenden Sie `full` nur, wenn Sie
bewusst die breite advisory Provider-/Media-Matrix wünschen. `run_release_soak`
steuert, ob stabile/standardmäßige Release-Prüfungen den vollständigen Live-/E2E- und
Docker-Release-Pfad-Soak ausführen; `full` erzwingt Soak.

- `minimum` behält die schnellsten OpenAI-/Core-releasekritischen Lanes bei.
- `stable` ergänzt das stabile Provider-/Backend-Set.
- `full` führt die breite advisory Provider-/Media-Matrix aus.

Der Umbrella zeichnet die IDs der dispatchten untergeordneten Läufe auf, und der finale Job `Verify full validation` prüft die aktuellen Ergebnisse der untergeordneten Läufe erneut und hängt Tabellen der langsamsten Jobs für jeden untergeordneten Lauf an. Wenn ein untergeordneter Workflow erneut ausgeführt wird und grün wird, führen Sie nur den übergeordneten Verifier-Job erneut aus, um das Umbrella-Ergebnis und die Zeitübersicht zu aktualisieren.

Für die Wiederherstellung akzeptieren sowohl `Full Release Validation` als auch `OpenClaw Release Checks` `rerun_group`. Verwenden Sie `all` für einen Release-Kandidaten, `ci` nur für das normale vollständige CI-Kind, `plugin-prerelease` nur für das Plugin-Prerelease-Kind, `release-checks` für jedes Release-Kind oder eine engere Gruppe: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` oder `npm-telegram` im Umbrella. Dadurch bleibt ein erneuter Lauf einer fehlgeschlagenen Release-Box nach einem gezielten Fix begrenzt. Für eine einzelne fehlgeschlagene Cross-OS-Lane kombinieren Sie `rerun_group=cross-os` mit `cross_os_suite_filter`, zum Beispiel `windows/packaged-upgrade`; lange Cross-OS-Befehle geben Heartbeat-Zeilen aus, und Packaged-Upgrade-Zusammenfassungen enthalten Zeitangaben pro Phase. QA-Release-Check-Lanes sind advisory, daher warnen reine QA-Fehler, blockieren aber den Release-Check-Verifier nicht.

`OpenClaw Release Checks` verwendet den vertrauenswürdigen Workflow-Ref, um den ausgewählten Ref einmal in einen `release-package-under-test`-Tarball aufzulösen, und übergibt dieses Artefakt dann an Cross-OS-Prüfungen und Paketakzeptanz sowie an den Live-/E2E-Release-Pfad-Docker-Workflow, wenn Soak-Abdeckung läuft. Dadurch bleiben die Paketbytes über Release-Boxen hinweg konsistent, und derselbe Kandidat wird nicht in mehreren untergeordneten Jobs neu gepackt.

Doppelte `Full Release Validation`-Läufe für `ref=main` und `rerun_group=all`
ersetzen den älteren Umbrella. Der übergeordnete Monitor bricht jeden untergeordneten Workflow ab, den er
bereits dispatcht hat, wenn der übergeordnete Lauf abgebrochen wird, damit eine neuere Main-Validierung
nicht hinter einem veralteten zweistündigen Release-Check-Lauf wartet. Validierung von Release-Branches/-Tags
und fokussierte Rerun-Gruppen behalten `cancel-in-progress: false`.

## Live- und E2E-Shards

Das Release-Live-/E2E-Kind behält eine breite native `pnpm test:live`-Abdeckung bei, führt sie aber als benannte Shards über `scripts/test-live-shard.mjs` statt als einen seriellen Job aus:

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
- aufgeteilte Media-Audio-/Video-Shards und Provider-gefilterte Musik-Shards

Dadurch bleibt dieselbe Dateiabdeckung erhalten, während langsame Live-Provider-Fehler einfacher erneut ausgeführt und diagnostiziert werden können. Die aggregierten Shard-Namen `native-live-extensions-o-z`, `native-live-extensions-media` und `native-live-extensions-media-music` bleiben für manuelle einmalige Reruns gültig.

Die nativen Live-Media-Shards laufen in `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, erstellt durch den Workflow `Live Media Runner Image`. Dieses Image installiert `ffmpeg` und `ffprobe` vor; Media-Jobs verifizieren die Binärdateien vor dem Setup nur. Belassen Sie Docker-gestützte Live-Suites auf normalen Blacksmith-Runnern — Container-Jobs sind der falsche Ort, um verschachtelte Docker-Tests zu starten.

Docker-gestützte Live-Modell-/Backend-Shards verwenden ein separates gemeinsames Image `ghcr.io/openclaw/openclaw-live-test:<sha>` pro ausgewähltem Commit. Der Live-Release-Workflow erstellt und pusht dieses Image einmal, dann laufen die Docker-Live-Modell-, Provider-geshardeten Gateway-, CLI-Backend-, ACP-Bind- und Codex-Harness-Shards mit `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gateway-Docker-Shards tragen explizite `timeout`-Obergrenzen auf Skriptebene unterhalb des Workflow-Job-Timeouts, damit ein hängender Container oder Cleanup-Pfad schnell fehlschlägt, statt das gesamte Release-Check-Budget zu verbrauchen. Wenn diese Shards das vollständige Source-Docker-Target unabhängig neu bauen, ist der Release-Lauf falsch konfiguriert und verschwendet Laufzeit durch doppelte Image-Builds.

## Paketakzeptanz

Verwenden Sie `Package Acceptance`, wenn die Frage lautet: „Funktioniert dieses installierbare OpenClaw-Paket als Produkt?“ Sie unterscheidet sich von normaler CI: Normale CI validiert den Source-Tree, während Paketakzeptanz einen einzelnen Tarball über denselben Docker-E2E-Harness validiert, den Benutzer nach Installation oder Update ausführen.

### Jobs

1. `resolve_package` checkt `workflow_ref` aus, löst einen Paketkandidaten auf, schreibt `.artifacts/docker-e2e-package/openclaw-current.tgz`, schreibt `.artifacts/docker-e2e-package/package-candidate.json`, lädt beide als Artefakt `package-under-test` hoch und gibt Quelle, Workflow-Ref, Paket-Ref, Version, SHA-256 und Profil in der GitHub-Step-Zusammenfassung aus.
2. `docker_acceptance` ruft `openclaw-live-and-e2e-checks-reusable.yml` mit `ref=workflow_ref` und `package_artifact_name=package-under-test` auf. Der wiederverwendbare Workflow lädt dieses Artefakt herunter, validiert das Tarball-Inventar, bereitet bei Bedarf Package-Digest-Docker-Images vor und führt die ausgewählten Docker-Lanes gegen dieses Paket aus, statt den Workflow-Checkout zu packen. Wenn ein Profil mehrere gezielte `docker_lanes` auswählt, bereitet der wiederverwendbare Workflow das Paket und die gemeinsamen Images einmal vor und fächert diese Lanes dann als parallele gezielte Docker-Jobs mit eindeutigen Artefakten auf.
3. `package_telegram` ruft optional `NPM Telegram Beta E2E` auf. Es läuft, wenn `telegram_mode` nicht `none` ist, und installiert dasselbe Artefakt `package-under-test`, wenn Paketakzeptanz eines aufgelöst hat; ein eigenständiger Telegram-Dispatch kann weiterhin eine veröffentlichte npm-Spezifikation installieren.
4. `summary` lässt den Workflow fehlschlagen, wenn die Paketauflösung, die Docker-Akzeptanz oder die optionale Telegram-Lane fehlgeschlagen ist.

### Kandidatenquellen

- `source=npm` akzeptiert nur `openclaw@beta`, `openclaw@latest` oder eine exakte OpenClaw-Release-Version wie `openclaw@2026.4.27-beta.2`. Verwenden Sie dies für veröffentlichte Prerelease-/Stable-Akzeptanz.
- `source=ref` packt einen vertrauenswürdigen `package_ref`-Branch, -Tag oder vollständigen Commit-SHA. Der Resolver ruft OpenClaw-Branches/-Tags ab, verifiziert, dass der ausgewählte Commit aus der Repository-Branch-Historie oder einem Release-Tag erreichbar ist, installiert Abhängigkeiten in einem detached Worktree und packt ihn mit `scripts/package-openclaw-for-docker.mjs`.
- `source=url` lädt eine HTTPS-`.tgz` herunter; `package_sha256` ist erforderlich.
- `source=artifact` lädt eine `.tgz` aus `artifact_run_id` und `artifact_name` herunter; `package_sha256` ist optional, sollte aber für extern geteilte Artefakte angegeben werden.

Halten Sie `workflow_ref` und `package_ref` getrennt. `workflow_ref` ist der vertrauenswürdige Workflow-/Harness-Code, der den Test ausführt. `package_ref` ist der Source-Commit, der gepackt wird, wenn `source=ref` verwendet wird. Dadurch kann der aktuelle Test-Harness ältere vertrauenswürdige Source-Commits validieren, ohne alte Workflow-Logik auszuführen.

### Suite-Profile

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — vollständige Docker-Release-Pfad-Chunks mit OpenWebUI
- `custom` — exakte `docker_lanes`; erforderlich, wenn `suite_profile=custom`

Das Profil `package` verwendet Offline-Plugin-Abdeckung, damit die Validierung veröffentlichter Pakete nicht von Live-ClawHub-Verfügbarkeit abhängt. Die optionale Telegram-Lane verwendet das Artefakt `package-under-test` in `NPM Telegram Beta E2E` wieder; der veröffentlichte npm-Spezifikationspfad bleibt für eigenständige Dispatches erhalten.

Die dedizierte Update- und Plugin-Test-Policy, einschließlich lokaler Befehle,
Docker-Lanes, Paketakzeptanz-Eingaben, Release-Standards und Fehlertriage,
finden Sie unter [Updates und Plugins testen](/de/help/testing-updates-plugins).

Release-Prüfungen rufen Paketakzeptanz mit `source=artifact`, dem vorbereiteten Release-Paketartefakt, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` und `telegram_mode=mock-openai` auf. Dadurch bleiben Paketmigration, Update, Live-ClawHub-Skill-Installation, Cleanup veralteter Plugin-Abhängigkeiten, Reparatur konfigurierter Plugin-Installationen, Offline-Plugin, Plugin-Update und Telegram-Nachweis auf demselben aufgelösten Paket-Tarball. Setzen Sie `package_acceptance_package_spec` bei Full Release Validation oder OpenClaw Release Checks, um dieselbe Matrix gegen ein ausgeliefertes npm-Paket statt gegen das SHA-gebaute Artefakt auszuführen. Cross-OS-Release-Prüfungen decken weiterhin OS-spezifisches Onboarding, Installer- und Plattformverhalten ab; Paket-/Update-Produktvalidierung sollte mit Paketakzeptanz beginnen. Die Docker-Lane `published-upgrade-survivor` validiert eine veröffentlichte Paket-Baseline pro Lauf im blockierenden Release-Pfad. In Paketakzeptanz ist der aufgelöste Tarball `package-under-test` immer der Kandidat, und `published_upgrade_survivor_baseline` wählt die veröffentlichte Fallback-Baseline aus, standardmäßig `openclaw@latest`; Rerun-Befehle für fehlgeschlagene Lanes behalten diese Baseline bei. Full Release Validation mit `run_release_soak=true` oder `release_profile=full` setzt `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` und `published_upgrade_survivor_scenarios=reported-issues`, um über die vier neuesten stabilen npm-Releases plus fixierte Plugin-Kompatibilitätsgrenzen-Releases und issue-geformte Fixtures für Feishu-Konfiguration, erhaltene Bootstrap-/Persona-Dateien, konfigurierte OpenClaw-Plugin-Installationen, Tilde-Logpfade und veraltete Legacy-Plugin-Abhängigkeits-Roots zu erweitern. Multi-Baseline-Auswahlen für `published-upgrade-survivor` werden nach Baseline in separate gezielte Docker-Runner-Jobs geshardet. Der separate Workflow `Update Migration` verwendet die Docker-Lane `update-migration` mit `all-since-2026.4.23` und `plugin-deps-cleanup`, wenn die Frage vollständiges Cleanup veröffentlichter Updates ist, nicht normale Full-Release-CI-Breite. Lokale aggregierte Läufe können exakte Paket-Spezifikationen mit `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` übergeben, eine einzelne Lane mit `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` wie `openclaw@2026.4.15` behalten oder `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` für die Szenariomatrix setzen. Die veröffentlichte Lane konfiguriert die Baseline mit einem eingebauten `openclaw config set`-Befehlsrezept, zeichnet Rezeptschritte in `summary.json` auf und prüft `/healthz`, `/readyz` sowie den RPC-Status nach dem Gateway-Start. Die frischen Windows-Packaged- und Installer-Lanes verifizieren außerdem, dass ein installiertes Paket einen Browser-Control-Override aus einem rohen absoluten Windows-Pfad importieren kann. Der OpenAI-Cross-OS-Agent-Turn-Smoke verwendet standardmäßig `OPENCLAW_CROSS_OS_OPENAI_MODEL`, wenn gesetzt, andernfalls `openai/gpt-5.4`, sodass der Installations- und Gateway-Nachweis auf einem GPT-5-Testmodell bleibt und GPT-4.x-Standards vermieden werden.

### Legacy-Kompatibilitätsfenster

Die Paketakzeptanz hat begrenzte Legacy-Kompatibilitätsfenster für bereits veröffentlichte Pakete. Pakete bis `2026.4.25`, einschließlich `2026.4.25-beta.*`, dürfen den Kompatibilitätspfad verwenden:

- bekannte private QA-Einträge in `dist/postinstall-inventory.json` dürfen auf Dateien verweisen, die im Tarball ausgelassen wurden;
- `doctor-switch` darf den Persistenz-Unterfall `gateway install --wrapper` überspringen, wenn das Paket dieses Flag nicht anbietet;
- `update-channel-switch` darf fehlende `pnpm.patchedDependencies` aus dem aus dem Tarball abgeleiteten Fake-Git-Fixture entfernen und darf fehlendes persistiertes `update.channel` protokollieren;
- Plugin-Smokes dürfen Legacy-Speicherorte für Installationsdatensätze lesen oder fehlende Persistenz von Marketplace-Installationsdatensätzen akzeptieren;
- `plugin-update` darf die Migration von Konfigurationsmetadaten zulassen, während weiterhin verlangt wird, dass der Installationsdatensatz und das Verhalten ohne Neuinstallation unverändert bleiben.

Das veröffentlichte Paket `2026.4.26` darf außerdem vor lokalen Build-Metadaten-Stempeldateien warnen, die bereits ausgeliefert wurden. Spätere Pakete müssen die modernen Verträge erfüllen; dieselben Bedingungen schlagen dann fehl, statt nur zu warnen oder übersprungen zu werden.

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

Wenn Sie einen fehlgeschlagenen Paketakzeptanzlauf debuggen, beginnen Sie bei der Zusammenfassung `resolve_package`, um Paketquelle, Version und SHA-256 zu bestätigen. Prüfen Sie anschließend den untergeordneten Lauf `docker_acceptance` und dessen Docker-Artefakte: `.artifacts/docker-tests/**/summary.json`, `failures.json`, Lane-Protokolle, Phasenzeiten und Befehle für erneute Läufe. Führen Sie bevorzugt das fehlgeschlagene Paketprofil oder die exakten Docker-Lanes erneut aus, statt die vollständige Release-Validierung erneut zu starten.

## Installations-Smoke

Der separate Workflow `Install Smoke` verwendet dasselbe Scope-Skript über seinen eigenen `preflight`-Job wieder. Er teilt die Smoke-Abdeckung in `run_fast_install_smoke` und `run_full_install_smoke` auf.

- **Schneller Pfad** läuft für Pull Requests, die Docker-/Paketoberflächen, gebündelte Plugin-Paket-/Manifeständerungen oder Kernoberflächen für Plugin/Kanal/Gateway/Plugin SDK berühren, die von den Docker-Smoke-Jobs ausgeübt werden. Reine Quelländerungen an gebündelten Plugins, reine Teständerungen und reine Dokumentationsänderungen reservieren keine Docker-Worker. Der schnelle Pfad baut das Root-Dockerfile-Image einmal, prüft die CLI, führt den CLI-Smoke für das Löschen von Agents im gemeinsamen Workspace aus, führt den Container-Gateway-Netzwerk-E2E aus, verifiziert ein Build-Argument für gebündelte Plugins und führt das begrenzte gebündelte-Plugin-Docker-Profil unter einem aggregierten Befehls-Timeout von 240 Sekunden aus (jeder Docker-Lauf eines Szenarios ist separat begrenzt).
- **Vollständiger Pfad** behält QR-Paketinstallation sowie Installer-Docker-/Update-Abdeckung für nächtliche geplante Läufe, manuelle Dispatches, Workflow-Call-Release-Prüfungen und Pull Requests bei, die tatsächlich Installer-/Paket-/Docker-Oberflächen berühren. Im vollständigen Modus bereitet install-smoke ein GHCR-Root-Dockerfile-Smoke-Image für den Ziel-SHA vor oder verwendet es wieder und führt dann QR-Paketinstallation, Root-Dockerfile-/Gateway-Smokes, Installer-/Update-Smokes und den schnellen gebündelte-Plugin-Docker-E2E als separate Jobs aus, damit Installer-Arbeit nicht hinter den Root-Image-Smokes warten muss.

Pushes auf `main` (einschließlich Merge-Commits) erzwingen den vollständigen Pfad nicht; wenn die Changed-Scope-Logik bei einem Push vollständige Abdeckung anfordern würde, behält der Workflow den schnellen Docker-Smoke bei und überlässt den vollständigen Installations-Smoke der nächtlichen oder Release-Validierung.

Der langsame Bun-Global-Install-Image-Provider-Smoke wird separat durch `run_bun_global_install_smoke` gesteuert. Er läuft im nächtlichen Zeitplan und aus dem Release-Checks-Workflow heraus, und manuelle `Install Smoke`-Dispatches können ihn aktivieren, Pull Requests und Pushes auf `main` jedoch nicht. QR- und Installer-Docker-Tests behalten ihre eigenen installationsbezogenen Dockerfiles.

## Lokaler Docker-E2E

`pnpm test:docker:all` baut ein gemeinsames Live-Test-Image vorab, packt OpenClaw einmal als npm-Tarball und baut zwei gemeinsame Images aus `scripts/e2e/Dockerfile`:

- einen nackten Node-/Git-Runner für Installer-/Update-/Plugin-Abhängigkeits-Lanes;
- ein funktionales Image, das denselben Tarball für normale Funktionalitäts-Lanes in `/app` installiert.

Docker-Lane-Definitionen liegen in `scripts/lib/docker-e2e-scenarios.mjs`, die Planner-Logik liegt in `scripts/lib/docker-e2e-plan.mjs`, und der Runner führt nur den ausgewählten Plan aus. Der Scheduler wählt das Image pro Lane mit `OPENCLAW_DOCKER_E2E_BARE_IMAGE` und `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` aus und führt Lanes dann mit `OPENCLAW_SKIP_DOCKER_BUILD=1` aus.

### Einstellbare Parameter

| Variable                               | Standard | Zweck                                                                                         |
| -------------------------------------- | -------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10       | Slot-Anzahl des Hauptpools für normale Lanes.                                                  |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10       | Slot-Anzahl des provider-sensitiven Tail-Pools.                                                |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9        | Limit gleichzeitiger Live-Lanes, damit Provider nicht drosseln.                                |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10       | Limit gleichzeitiger npm-Installations-Lanes.                                                  |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7        | Limit gleichzeitiger Multi-Service-Lanes.                                                      |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000     | Versatz zwischen Lane-Starts, um Docker-Daemon-Erstellungsstürme zu vermeiden; setzen Sie `0` für keinen Versatz. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000  | Fallback-Timeout pro Lane (120 Minuten); ausgewählte Live-/Tail-Lanes verwenden engere Grenzen. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | nicht gesetzt | `1` gibt den Scheduler-Plan aus, ohne Lanes auszuführen.                                      |
| `OPENCLAW_DOCKER_ALL_LANES`            | nicht gesetzt | Kommagetrennte exakte Lane-Liste; überspringt den Cleanup-Smoke, damit Agents eine fehlgeschlagene Lane reproduzieren können. |

Eine Lane, die schwerer als ihre effektive Grenze ist, kann dennoch aus einem leeren Pool starten und läuft dann allein, bis sie Kapazität freigibt. Die lokale Aggregation führt Docker-Preflights aus, entfernt veraltete OpenClaw-E2E-Container, gibt den Status aktiver Lanes aus, persistiert Lane-Zeiten für die längste-zuerst-Sortierung und plant standardmäßig nach dem ersten Fehler keine neuen gepoolten Lanes mehr.

### Wiederverwendbarer Live-/E2E-Workflow

Der wiederverwendbare Live-/E2E-Workflow fragt mit `scripts/test-docker-all.mjs --plan-json` ab, welche Paket-, Image-Typ-, Live-Image-, Lane- und Credential-Abdeckung erforderlich ist. `scripts/docker-e2e.mjs` wandelt diesen Plan anschließend in GitHub-Ausgaben und Zusammenfassungen um. Es packt OpenClaw entweder über `scripts/package-openclaw-for-docker.mjs`, lädt ein Paketartefakt aus dem aktuellen Lauf herunter oder lädt ein Paketartefakt aus `package_artifact_run_id` herunter; validiert das Tarball-Inventar; baut und pusht paket-digest-getaggte Bare-/Functional-GHCR-Docker-E2E-Images über den Docker-Layer-Cache von Blacksmith, wenn der Plan Lanes mit installiertem Paket benötigt; und verwendet bereitgestellte Eingaben `docker_e2e_bare_image`/`docker_e2e_functional_image` oder vorhandene Package-Digest-Images wieder, statt neu zu bauen. Docker-Image-Pulls werden mit einem begrenzten Timeout von 180 Sekunden pro Versuch erneut versucht, sodass ein hängender Registry-/Cache-Stream schnell erneut versucht wird, statt den Großteil des kritischen CI-Pfads zu verbrauchen.

### Release-Pfad-Chunks

Die Release-Docker-Abdeckung läuft in kleineren Chunk-Jobs mit `OPENCLAW_SKIP_DOCKER_BUILD=1`, sodass jeder Chunk nur den benötigten Image-Typ zieht und mehrere Lanes über denselben gewichteten Scheduler ausführt:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Aktuelle Release-Docker-Chunks sind `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` und `plugins-runtime-install-a` bis `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` und `plugins-integrations` bleiben aggregierte Plugin-/Runtime-Aliasse. Der Lane-Alias `install-e2e` bleibt der aggregierte manuelle Wiederholungsalias für beide Provider-Installer-Lanes.

OpenWebUI wird in `plugins-runtime-services` integriert, wenn die vollständige Release-Pfad-Abdeckung dies anfordert, und behält nur für reine OpenWebUI-Dispatches einen eigenständigen Chunk `openwebui`. Gebündelte-Kanal-Update-Lanes versuchen bei transienten npm-Netzwerkfehlern einmal erneut.

Jeder Chunk lädt `.artifacts/docker-tests/` mit Lane-Protokollen, Zeiten, `summary.json`, `failures.json`, Phasenzeiten, Scheduler-Plan-JSON, Tabellen langsamer Lanes und Wiederholungsbefehlen pro Lane hoch. Die Workflow-Eingabe `docker_lanes` führt ausgewählte Lanes gegen die vorbereiteten Images aus, statt die Chunk-Jobs zu verwenden. Dadurch bleibt das Debugging fehlgeschlagener Lanes auf einen gezielten Docker-Job begrenzt und das Paketartefakt für diesen Lauf wird vorbereitet, heruntergeladen oder wiederverwendet; wenn eine ausgewählte Lane eine Live-Docker-Lane ist, baut der gezielte Job das Live-Test-Image lokal für diesen erneuten Lauf. Generierte GitHub-Wiederholungsbefehle pro Lane enthalten `package_artifact_run_id`, `package_artifact_name` und vorbereitete Image-Eingaben, wenn diese Werte existieren, sodass eine fehlgeschlagene Lane exakt das Paket und die Images aus dem fehlgeschlagenen Lauf wiederverwenden kann.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Der geplante Live-/E2E-Workflow führt täglich die vollständige Release-Pfad-Docker-Suite aus.

## Plugin-Prerelease

`Plugin Prerelease` ist teurere Produkt-/Paketabdeckung und daher ein separater Workflow, der von `Full Release Validation` oder durch einen expliziten Operator ausgelöst wird. Normale Pull Requests, Pushes auf `main` und eigenständige manuelle CI-Dispatches lassen diese Suite deaktiviert. Er verteilt gebündelte Plugin-Tests auf acht Plugin-Worker; diese Plugin-Shard-Jobs führen jeweils bis zu zwei Plugin-Konfigurationsgruppen gleichzeitig mit einem Vitest-Worker pro Gruppe und einem größeren Node-Heap aus, damit importintensive Plugin-Batches keine zusätzlichen CI-Jobs erzeugen. Der nur für Releases vorgesehene Docker-Prerelease-Pfad bündelt gezielte Docker-Lanes in kleinen Gruppen, um nicht Dutzende Runner für ein bis drei Minuten lange Jobs zu reservieren.

## QA-Labor

Das QA-Labor hat dedizierte CI-Lanes außerhalb des hauptsächlichen smart gescopten Workflows. Agentische Parität ist unter den breiten QA- und Release-Harnesses verschachtelt, nicht als eigenständiger PR-Workflow. Verwenden Sie `Full Release Validation` mit `rerun_group=qa-parity`, wenn Parität mit einem breiten Validierungslauf mitlaufen soll.

- Der Workflow `QA-Lab - All Lanes` läuft nächtlich auf `main` und bei manuellem Dispatch; er fächert die Mock-Paritäts-Lane, die Live-Matrix-Lane sowie die Live-Telegram- und Live-Discord-Lanes als parallele Jobs auf. Live-Jobs verwenden die Umgebung `qa-live-shared`, und Telegram/Discord verwenden Convex-Leases.

Release-Prüfungen führen Matrix- und Telegram-Live-Transport-Lanes mit dem deterministischen Mock-Provider und mock-qualifizierten Modellen (`mock-openai/gpt-5.5` und `mock-openai/gpt-5.5-alt`) aus, sodass der Channel-Vertrag von Live-Modelllatenz und normalem Provider-Plugin-Start isoliert ist. Das Live-Transport-Gateway deaktiviert die Speichersuche, weil QA-Parität das Speicherverhalten separat abdeckt; die Provider-Konnektivität wird durch die separaten Live-Modell-, nativen Provider- und Docker-Provider-Suiten abgedeckt.

Matrix verwendet `--profile fast` für geplante und Release-Gates und fügt `--fail-fast` nur hinzu, wenn die ausgecheckte CLI dies unterstützt. Der CLI-Standardwert und die manuelle Workflow-Eingabe bleiben `all`; manuelle `matrix_profile=all`-Dispatches sharden die vollständige Matrix-Abdeckung immer in die Jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` und `e2ee-cli`.

`OpenClaw Release Checks` führt außerdem die release-kritischen QA-Lab-Lanes vor der Release-Freigabe aus; das QA-Paritäts-Gate führt die Kandidaten- und Baseline-Pakete als parallele Lane-Jobs aus und lädt anschließend beide Artefakte in einen kleinen Report-Job für den abschließenden Paritätsvergleich herunter.

Für normale PRs folgen Sie scoped CI-/Prüfnachweisen, statt Parität als erforderlichen Status zu behandeln.

## CodeQL

Der `CodeQL`-Workflow ist bewusst ein enger Sicherheits-Scanner für den ersten Durchlauf, kein vollständiger Repository-Sweep. Tägliche, manuelle und nicht als Draft markierte Pull-Request-Guard-Läufe scannen Actions-Workflow-Code sowie die risikoreichsten JavaScript-/TypeScript-Flächen mit sicherheitsbezogenen High-Confidence-Abfragen, gefiltert auf hohe/kritische `security-severity`.

Der Pull-Request-Guard bleibt leichtgewichtig: Er startet nur bei Änderungen unter `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` oder `src` und führt dieselbe High-Confidence-Sicherheitsmatrix wie der geplante Workflow aus. Android- und macOS-CodeQL bleiben außerhalb der PR-Standards.

### Sicherheitskategorien

| Kategorie                                         | Fläche                                                                                                                              |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, Secrets, Sandbox, Cron und Gateway-Baseline                                                                                   |
| `/codeql-security-high/channel-runtime-boundary`  | Core-Channel-Implementierungsverträge plus Channel-Plugin-Laufzeit, Gateway, Plugin-SDK, Secrets, Audit-Berührungspunkte           |
| `/codeql-security-high/network-ssrf-boundary`     | Core-SSRF, IP-Parsing, Network Guard, Web-Fetch und SSRF-Policy-Flächen des Plugin-SDK                                              |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP-Server, Prozessausführungshelfer, ausgehende Zustellung und Gates für Agent-Tool-Ausführung                                     |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin-Installation, Loader, Manifest, Registry, Package-Manager-Installation, Source-Loading und Vertrauensflächen des Plugin-SDK-Paketvertrags |

### Plattformspezifische Sicherheits-Shards

- `CodeQL Android Critical Security` — geplanter Android-Sicherheits-Shard. Baut die Android-App manuell für CodeQL auf dem kleinsten Blacksmith-Linux-Runner, der von der Workflow-Sanity akzeptiert wird. Lädt unter `/codeql-critical-security/android` hoch.
- `CodeQL macOS Critical Security` — wöchentlicher/manueller macOS-Sicherheits-Shard. Baut die macOS-App manuell für CodeQL auf Blacksmith macOS, filtert Ergebnisse aus Dependency-Builds aus dem hochgeladenen SARIF heraus und lädt unter `/codeql-critical-security/macos` hoch. Bleibt außerhalb der täglichen Standards, weil der macOS-Build selbst im sauberen Zustand die Laufzeit dominiert.

### Critical-Quality-Kategorien

`CodeQL Critical Quality` ist der entsprechende Nicht-Sicherheits-Shard. Er führt nur JavaScript-/TypeScript-Qualitätsabfragen mit Error-Schweregrad und ohne Sicherheitsbezug über enge, hochwertige Flächen auf dem kleineren Blacksmith-Linux-Runner aus. Sein Pull-Request-Guard ist bewusst kleiner als das geplante Profil: Nicht-Draft-PRs führen nur die passenden Shards `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` und `plugin-sdk-reply-runtime` für Änderungen an Agent-Befehls-/Modell-/Tool-Ausführung und Reply-Dispatch-Code, Config-Schema-/Migrations-/IO-Code, Auth-/Secrets-/Sandbox-/Sicherheitscode, Core-Channel und gebündelter Channel-Plugin-Laufzeit, Gateway-Protokoll-/Server-Methoden, Speicherlaufzeit-/SDK-Glue, MCP-/Prozess-/ausgehender Zustellung, Provider-Laufzeit-/Modellkatalog, Sitzungsdiagnose-/Zustellungswarteschlangen, Plugin-Loader, Plugin-SDK-/Paketvertrag oder Plugin-SDK-Reply-Laufzeit aus. Änderungen an CodeQL-Konfiguration und Qualitäts-Workflow führen alle zwölf PR-Qualitäts-Shards aus.

Manueller Dispatch akzeptiert:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Die engen Profile sind Lehr-/Iterations-Hooks, um einen Qualitäts-Shard isoliert auszuführen.

| Kategorie                                               | Fläche                                                                                                                                                          |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Auth, Secrets, Sandbox, Cron und Code der Gateway-Sicherheitsgrenze                                                                                              |
| `/codeql-critical-quality/config-boundary`              | Config-Schema, Migration, Normalisierung und IO-Verträge                                                                                                         |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway-Protokollschemas und Server-Methodenverträge                                                                                                             |
| `/codeql-critical-quality/channel-runtime-boundary`     | Core-Channel- und gebündelte Channel-Plugin-Implementierungsverträge                                                                                             |
| `/codeql-critical-quality/agent-runtime-boundary`       | Befehlsausführung, Modell-/Provider-Dispatch, Auto-Reply-Dispatch und Warteschlangen sowie ACP-Control-Plane-Laufzeitverträge                                   |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP-Server und Tool-Bridges, Helfer für Prozessüberwachung und Verträge für ausgehende Zustellung                                                                |
| `/codeql-critical-quality/memory-runtime-boundary`      | Speicher-Host-SDK, Speicherlaufzeit-Fassaden, Speicher-Plugin-SDK-Aliase, Aktivierungs-Glue der Speicherlaufzeit und Speicher-Doctor-Befehle                    |
| `/codeql-critical-quality/session-diagnostics-boundary` | Interna der Reply-Warteschlange, Sitzungszustellungswarteschlangen, Helfer für ausgehende Sitzungsbindung/-zustellung, Diagnoseereignis-/Log-Bundle-Flächen und Sitzungs-Doctor-CLI-Verträge |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Inbound-Reply-Dispatch des Plugin-SDK, Reply-Payload-/Chunking-/Laufzeithelfer, Channel-Reply-Optionen, Zustellungswarteschlangen und Sitzungs-/Thread-Bindungshelfer |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalisierung des Modellkatalogs, Provider-Auth und Discovery, Provider-Laufzeitregistrierung, Provider-Standards/-Kataloge sowie Web-/Search-/Fetch-/Embedding-Registries |
| `/codeql-critical-quality/ui-control-plane`             | Control-UI-Bootstrap, lokale Persistenz, Gateway-Control-Flows und Laufzeitverträge der Task-Control-Plane                                                       |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Core-Web-Fetch/Search, Medien-IO, Medienverständnis, Bildgenerierung und Laufzeitverträge für Mediengenerierung                                                  |
| `/codeql-critical-quality/plugin-boundary`              | Loader-, Registry-, Public-Surface- und Plugin-SDK-Entrypoint-Verträge                                                                                           |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Veröffentlichter paket-seitiger Plugin-SDK-Quellcode und Hilfen für Plugin-Paketverträge                                                                        |

Qualität bleibt von Sicherheit getrennt, damit Qualitätsbefunde geplant, gemessen, deaktiviert oder erweitert werden können, ohne das Sicherheitssignal zu verdecken. Swift-, Python- und gebündelte-Plugin-CodeQL-Erweiterungen sollten erst wieder als scoped oder geshardete Folgearbeit hinzugefügt werden, nachdem die engen Profile stabile Laufzeit und stabile Signale haben.

## Wartungs-Workflows

### Docs Agent

Der `Docs Agent`-Workflow ist eine ereignisgesteuerte Codex-Wartungs-Lane, um vorhandene Dokumentation mit kürzlich gelandeten Änderungen abzugleichen. Er hat keinen reinen Zeitplan: Ein erfolgreicher Nicht-Bot-Push-CI-Lauf auf `main` kann ihn auslösen, und ein manueller Dispatch kann ihn direkt ausführen. Workflow-Run-Aufrufe werden übersprungen, wenn `main` weitergelaufen ist oder wenn in der letzten Stunde ein weiterer nicht übersprungener Docs-Agent-Lauf erstellt wurde. Wenn er läuft, prüft er den Commit-Bereich von der vorherigen nicht übersprungenen Docs-Agent-Quell-SHA bis zum aktuellen `main`, sodass ein stündlicher Lauf alle seit dem letzten Docs-Durchlauf angesammelten Main-Änderungen abdecken kann.

### Test Performance Agent

Der `Test Performance Agent`-Workflow ist eine ereignisgesteuerte Codex-Wartungs-Lane für langsame Tests. Er hat keinen reinen Zeitplan: Ein erfolgreicher Nicht-Bot-Push-CI-Lauf auf `main` kann ihn auslösen, aber er wird übersprungen, wenn an diesem UTC-Tag bereits ein anderer Workflow-Run-Aufruf gelaufen ist oder läuft. Manueller Dispatch umgeht dieses tägliche Aktivitäts-Gate. Die Lane erstellt einen gruppierten Vitest-Performance-Report für die vollständige Suite, lässt Codex nur kleine, abdeckungserhaltende Test-Performance-Fixes statt breiter Refactorings vornehmen, führt den Full-Suite-Report anschließend erneut aus und weist Änderungen zurück, die die Baseline-Anzahl bestandener Tests reduzieren. Wenn die Baseline fehlschlagende Tests enthält, darf Codex nur offensichtliche Fehler beheben, und der Full-Suite-Report nach dem Agent muss bestehen, bevor etwas committed wird. Wenn `main` vor dem Bot-Push weiterläuft, rebased die Lane den validierten Patch, führt `pnpm check:changed` erneut aus und versucht den Push erneut; kollidierende veraltete Patches werden übersprungen. Sie verwendet GitHub-gehostetes Ubuntu, damit die Codex-Action dieselbe Drop-Sudo-Sicherheitshaltung wie der Docs Agent beibehalten kann.

### Doppelte PRs nach Merge

Der Workflow `Duplicate PRs After Merge` ist ein manueller Maintainer-Workflow für die Bereinigung von Duplikaten nach dem Landen. Er verwendet standardmäßig einen Dry-Run und schließt explizit aufgelistete PRs nur, wenn `apply=true` ist. Vor Mutationen in GitHub überprüft er, dass der gelandete PR gemergt ist und dass jedes Duplikat entweder ein gemeinsames referenziertes Issue oder überlappende geänderte Hunks hat.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Lokale Check-Gates und Changed-Routing

Die lokale Changed-Lane-Logik liegt in `scripts/changed-lanes.mjs` und wird von `scripts/check-changed.mjs` ausgeführt. Dieses lokale Check-Gate ist bei Architekturgrenzen strenger als der breite CI-Plattform-Scope:

- Core-Produktionsänderungen führen Core-Produktions- und Core-Test-Typecheck sowie Core-Lint/Guards aus;
- reine Core-Teständerungen führen nur Core-Test-Typecheck sowie Core-Lint aus;
- Plugin-Produktionsänderungen führen Plugin-Produktions- und Plugin-Test-Typecheck sowie Plugin-Lint aus;
- reine Plugin-Teständerungen führen Plugin-Test-Typecheck sowie Plugin-Lint aus;
- Änderungen am öffentlichen Plugin SDK oder an Plugin-Verträgen werden auf Plugin-Typecheck erweitert, weil Plugins von diesen Core-Verträgen abhängen (Vitest-Plugin-Durchläufe bleiben explizite Testarbeit);
- reine Versionsanhebungen in Release-Metadaten führen gezielte Versions-/Konfigurations-/Root-Abhängigkeitsprüfungen aus;
- unbekannte Root-/Konfigurationsänderungen schlagen sicherheitshalber auf alle Prüfbahnen fehl.

Lokales Routing geänderter Tests lebt in `scripts/test-projects.test-support.mjs` und ist absichtlich günstiger als `check:changed`: direkte Teständerungen führen sich selbst aus, Quellcodeänderungen bevorzugen explizite Zuordnungen, dann benachbarte Tests und Abhängige im Importgraphen. Die gemeinsam genutzte Zustellungskonfiguration für Gruppenräume ist eine der expliziten Zuordnungen: Änderungen an der für Gruppen sichtbaren Antwortkonfiguration, am Zustellmodus für Quellantworten oder am System-Prompt des Nachrichten-Tools laufen über die Core-Antworttests plus Discord- und Slack-Zustellungsregressionen, damit eine gemeinsame Standardänderung vor dem ersten PR-Push fehlschlägt. Verwenden Sie `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` nur, wenn die Änderung so harness-weit ist, dass die günstige zugeordnete Menge kein vertrauenswürdiger Stellvertreter ist.

## Testbox-Validierung

Führen Sie Testbox vom Repo-Root aus und bevorzugen Sie für breiten Nachweis eine frisch vorgewärmte Box. Bevor Sie einen langsamen Gate-Lauf auf einer Box ausgeben, die wiederverwendet wurde, abgelaufen ist oder gerade eine unerwartet große Synchronisierung gemeldet hat, führen Sie zuerst `pnpm testbox:sanity` innerhalb der Box aus.

Die Plausibilitätsprüfung schlägt schnell fehl, wenn erforderliche Root-Dateien wie `pnpm-lock.yaml` verschwunden sind oder wenn `git status --short` mindestens 200 nachverfolgte Löschungen zeigt. Das bedeutet normalerweise, dass der Remote-Synchronisierungszustand keine vertrauenswürdige Kopie des PR ist; stoppen Sie diese Box und wärmen Sie stattdessen eine frische vor, anstatt den Produkttestfehler zu debuggen. Setzen Sie für beabsichtigte PRs mit vielen Löschungen `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` für diesen Plausibilitätslauf.

`pnpm testbox:run` beendet außerdem einen lokalen Blacksmith-CLI-Aufruf, der länger als fünf Minuten ohne Ausgabe nach der Synchronisierung in der Synchronisierungsphase bleibt. Setzen Sie `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, um diesen Guard zu deaktivieren, oder verwenden Sie für ungewöhnlich große lokale Diffs einen größeren Millisekundenwert.

Crabbox ist der repo-eigene Remote-Box-Wrapper für Maintainer-Linux-Nachweise. Verwenden Sie ihn, wenn eine Prüfung zu breit für einen lokalen Bearbeitungszyklus ist, wenn CI-Parität wichtig ist oder wenn der Nachweis Secrets, Docker, Paketbahnen, wiederverwendbare Boxen oder Remote-Logs benötigt. Das normale OpenClaw-Backend ist `blacksmith-testbox`; eigene AWS-/Hetzner-Kapazität ist ein Fallback für Blacksmith-Ausfälle, Quotenprobleme oder explizite Tests auf eigener Kapazität.

Prüfen Sie vor einem ersten Lauf den Wrapper vom Repo-Root aus:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Der Repo-Wrapper verweigert eine veraltete Crabbox-Binärdatei, die `blacksmith-testbox` nicht ausweist. Geben Sie den Provider explizit an, obwohl `.crabbox.yaml` eigene Cloud-Standardwerte hat.

Geändertes Gate:

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

Fokussierte Testwiederholung:

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

Lesen Sie die abschließende JSON-Zusammenfassung. Die nützlichen Felder sind `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` und `totalMs`. Einmalige Blacksmith-gestützte Crabbox-Läufe sollten die Testbox automatisch stoppen; wenn ein Lauf unterbrochen wird oder die Bereinigung unklar ist, prüfen Sie aktive Boxen und stoppen Sie nur die Boxen, die Sie erstellt haben:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Verwenden Sie Wiederverwendung nur, wenn Sie absichtlich mehrere Befehle auf derselben befüllten Box benötigen:

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

Wenn `blacksmith testbox list --all` und `blacksmith testbox status` funktionieren, neue Warmups aber nach ein paar Minuten ohne IP oder Actions-Ausführungs-URL bei `queued` bleiben, behandeln Sie das als Druck durch Blacksmith-Provider, Warteschlange, Abrechnung oder Organisationslimit. Stoppen Sie die von Ihnen erstellten IDs in der Warteschlange, starten Sie keine weiteren Testboxes und verschieben Sie den Nachweis auf den unten beschriebenen Pfad mit eigener Crabbox-Kapazität, während jemand das Blacksmith-Dashboard, die Abrechnung und die Organisationslimits prüft.

Eskalieren Sie nur dann auf eigene Crabbox-Kapazität, wenn Blacksmith ausgefallen ist, durch Quoten begrenzt ist, die benötigte Umgebung fehlt oder eigene Kapazität ausdrücklich das Ziel ist:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Vermeiden Sie unter AWS-Druck `class=beast`, außer die Aufgabe benötigt wirklich CPU der 48xlarge-Klasse. Eine `beast`-Anfrage beginnt bei 192 vCPUs und ist der einfachste Weg, regionale EC2-Spot- oder On-Demand-Standard-Quoten auszulösen. Die repo-eigene `.crabbox.yaml` verwendet standardmäßig `standard`, mehrere Kapazitätsregionen und `capacity.hints: true`, sodass vermittelte AWS-Leases ausgewählte Region/Markt, Quotendruck, Spot-Fallback und Warnungen zu Klassen unter hohem Druck ausgeben. Verwenden Sie `fast` für schwerere breite Prüfungen, `large` nur, nachdem standard/fast nicht ausreichen, und `beast` nur für außergewöhnliche CPU-gebundene Bahnen wie vollständige Suites oder Docker-Matrizen für alle Plugins, explizite Release-/Blocker-Validierung oder Performance-Profiling mit vielen Kernen. Verwenden Sie `beast` nicht für `pnpm check:changed`, fokussierte Tests, reine Dokumentationsarbeit, gewöhnliche Lint-/Typecheck-Läufe, kleine E2E-Reproduktionen oder Blacksmith-Ausfalltriage. Verwenden Sie `--market on-demand` für Kapazitätsdiagnosen, damit Spot-Marktfluktuationen nicht in das Signal gemischt werden.

`.crabbox.yaml` besitzt Provider-, Synchronisierungs- und GitHub-Actions-Hydration-Standardwerte für eigene Cloud-Bahnen. Sie schließt lokales `.git` aus, damit der befüllte Actions-Checkout seine eigenen Remote-Git-Metadaten behält, statt maintainer-lokale Remotes und Object Stores zu synchronisieren, und sie schließt lokale Laufzeit-/Build-Artefakte aus, die niemals übertragen werden sollten. `.github/workflows/crabbox-hydrate.yml` besitzt Checkout, Node-/pnpm-Einrichtung, `origin/main`-Fetch und die nicht geheime Umgebungsübergabe für eigene Cloud-Befehle mit `crabbox run --id <cbx_id>`.

## Verwandt

- [Installationsübersicht](/de/install)
- [Entwicklungskanäle](/de/install/development-channels)
