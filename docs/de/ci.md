---
read_when:
    - Sie müssen nachvollziehen, warum ein CI-Job ausgeführt wurde oder nicht.
    - Sie untersuchen einen fehlgeschlagenen GitHub Actions-Check
    - Sie koordinieren eine Ausführung oder erneute Ausführung der Release-Validierung
    - Sie ändern den ClawSweeper-Dispatch oder die Weiterleitung von GitHub-Aktivitäten
summary: CI-Job-Graph, Scope-Gates, Release-Umbrellas und lokale Befehlsäquivalente
title: CI-Pipeline
x-i18n:
    generated_at: "2026-05-07T13:13:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1258ddb510538a250c68626f98b7f32201a46abf36f92d29e945bb7149a841cc
    source_path: ci.md
    workflow: 16
---

OpenClaw CI wird bei jedem Push auf `main` und bei jedem Pull Request ausgeführt. Der `preflight`-Job klassifiziert den Diff und deaktiviert teure Lanes, wenn sich nur nicht zusammenhängende Bereiche geändert haben. Manuelle `workflow_dispatch`-Läufe umgehen das intelligente Scoping bewusst und fächern den vollständigen Graphen für Release Candidates und breite Validierung auf. Android-Lanes bleiben über `include_android` optional. Release-spezifische Plugin-Abdeckung befindet sich im separaten [`Plugin Prerelease`](#plugin-prerelease)-Workflow und wird nur von [`Full Release Validation`](#full-release-validation) oder einem expliziten manuellen Dispatch ausgeführt.

## Pipeline-Übersicht

| Job                              | Zweck                                                                                                     | Wann er ausgeführt wird                |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| `preflight`                      | Erkennt reine Docs-Änderungen, geänderte Scopes, geänderte Erweiterungen und erstellt das CI-Manifest     | Immer bei Nicht-Draft-Pushes und PRs   |
| `security-scm-fast`              | Private-Key-Erkennung und Workflow-Audit über `zizmor`                                                    | Immer bei Nicht-Draft-Pushes und PRs   |
| `security-dependency-audit`      | Abhängigkeitsfreier Produktions-Lockfile-Audit gegen npm-Advisories                                       | Immer bei Nicht-Draft-Pushes und PRs   |
| `security-fast`                  | Erforderliches Aggregat für die schnellen Security-Jobs                                                   | Immer bei Nicht-Draft-Pushes und PRs   |
| `check-dependencies`             | Produktions-Knip-Durchlauf nur für Abhängigkeiten plus Allowlist-Guard für ungenutzte Dateien             | Node-relevante Änderungen              |
| `build-artifacts`                | Erstellt `dist/`, Control UI, Prüfungen gebauter Artefakte und wiederverwendbare Downstream-Artefakte     | Node-relevante Änderungen              |
| `checks-fast-core`               | Schnelle Linux-Korrektheits-Lanes wie gebündelte/plugin-contract/protocol-Prüfungen                       | Node-relevante Änderungen              |
| `checks-fast-contracts-channels` | Geshardete Channel-Contract-Prüfungen mit stabilem aggregiertem Prüfergebnis                              | Node-relevante Änderungen              |
| `checks-node-core-test`          | Core-Node-Test-Shards, ohne Channel-, gebündelte, Contract- und Erweiterungs-Lanes                        | Node-relevante Änderungen              |
| `check`                          | Gesplittetes Äquivalent zum lokalen Haupt-Gate: Prod-Typen, Lint, Guards, Testtypen und strenger Smoke    | Node-relevante Änderungen              |
| `check-additional`               | Architektur, geshardeter Boundary-/Prompt-Drift, Erweiterungs-Guards, Paket-Boundary und Gateway-Watch    | Node-relevante Änderungen              |
| `build-smoke`                    | Built-CLI-Smoke-Tests und Startup-Memory-Smoke                                                            | Node-relevante Änderungen              |
| `checks`                         | Verifier für Channel-Tests mit gebauten Artefakten                                                        | Node-relevante Änderungen              |
| `checks-node-compat-node22`      | Node-22-Kompatibilitäts-Build und Smoke-Lane                                                              | Manueller CI-Dispatch für Releases     |
| `check-docs`                     | Docs-Formatierung, Lint und Broken-Link-Prüfungen                                                         | Docs geändert                          |
| `skills-python`                  | Ruff + pytest für Python-gestützte Skills                                                                 | Python-Skill-relevante Änderungen      |
| `checks-windows`                 | Windows-spezifische Prozess-/Pfadtests plus Regressionen für gemeinsame Runtime-Import-Spezifizierer      | Windows-relevante Änderungen           |
| `macos-node`                     | macOS-TypeScript-Test-Lane mit den gemeinsamen gebauten Artefakten                                        | macOS-relevante Änderungen             |
| `macos-swift`                    | Swift-Lint, Build und Tests für die macOS-App                                                             | macOS-relevante Änderungen             |
| `android`                        | Android-Unit-Tests für beide Flavors plus ein Debug-APK-Build                                             | Android-relevante Änderungen           |
| `test-performance-agent`         | Tägliche Codex-Optimierung langsamer Tests nach vertrauenswürdiger Aktivität                              | Erfolg der Main-CI oder manueller Dispatch |
| `openclaw-performance`           | Tägliche/bedarfsgesteuerte Kova-Runtime-Performance-Berichte mit Mock-Provider-, Deep-Profile- und GPT-5.4-Live-Lanes | Geplanter und manueller Dispatch       |

## Fail-Fast-Reihenfolge

1. `preflight` entscheidet, welche Lanes überhaupt existieren. Die Logik für `docs-scope` und `changed-scope` sind Schritte innerhalb dieses Jobs, keine eigenständigen Jobs.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` und `skills-python` schlagen schnell fehl, ohne auf die schwereren Artefakt- und Plattform-Matrix-Jobs zu warten.
3. `build-artifacts` überschneidet sich mit den schnellen Linux-Lanes, damit Downstream-Verbraucher starten können, sobald der gemeinsame Build bereit ist.
4. Schwerere Plattform- und Runtime-Lanes fächern danach auf: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` und `android`.

GitHub kann überholte Jobs als `cancelled` markieren, wenn ein neuerer Push auf derselben PR- oder `main`-Ref landet. Behandeln Sie das als CI-Rauschen, sofern der neueste Lauf für dieselbe Ref nicht ebenfalls fehlschlägt. Aggregierte Shard-Prüfungen verwenden `!cancelled() && always()`, sodass sie normale Shard-Fehlschläge weiterhin melden, aber nicht mehr in die Warteschlange gehen, nachdem der gesamte Workflow bereits überholt wurde. Der automatische CI-Concurrency-Key ist versioniert (`CI-v7-*`), damit ein GitHub-seitiger Zombie in einer alten Queue-Gruppe neuere Main-Läufe nicht unbegrenzt blockieren kann. Manuelle Full-Suite-Läufe verwenden `CI-manual-v1-*` und brechen laufende Läufe nicht ab.

Der `ci-timings-summary`-Job lädt für jeden Nicht-Draft-CI-Lauf ein kompaktes `ci-timings-summary`-Artefakt hoch. Es zeichnet Wall Time, Queue Time, die langsamsten Jobs und fehlgeschlagene Jobs für den aktuellen Lauf auf, sodass CI-Health-Checks nicht wiederholt die vollständige Actions-Payload scrapen müssen.

## Scope und Routing

Die Scope-Logik befindet sich in `scripts/ci-changed-scope.mjs` und ist durch Unit-Tests in `src/scripts/ci-changed-scope.test.ts` abgedeckt. Manueller Dispatch überspringt die Changed-Scope-Erkennung und lässt das Preflight-Manifest so handeln, als hätte sich jeder gescopte Bereich geändert.

- **CI-Workflow-Bearbeitungen** validieren den Node-CI-Graphen plus Workflow-Linting, erzwingen aber für sich allein keine nativen Windows-, Android- oder macOS-Builds; diese Plattform-Lanes bleiben auf Plattform-Source-Änderungen begrenzt.
- **Nur-CI-Routing-Bearbeitungen, ausgewählte günstige Core-Test-Fixture-Bearbeitungen und enge Plugin-Contract-Helper-/Test-Routing-Bearbeitungen** verwenden einen schnellen Node-only-Manifestpfad: `preflight`, Security und eine einzelne `checks-fast-core`-Aufgabe. Dieser Pfad überspringt Build-Artefakte, Node-22-Kompatibilität, Channel-Contracts, vollständige Core-Shards, Bundled-Plugin-Shards und zusätzliche Guard-Matrizen, wenn die Änderung auf die Routing- oder Helper-Oberflächen begrenzt ist, die die schnelle Aufgabe direkt ausübt.
- **Windows-Node-Prüfungen** sind auf Windows-spezifische Prozess-/Pfad-Wrapper, npm-/pnpm-/UI-Runner-Helper, Paketmanager-Konfiguration und die CI-Workflow-Oberflächen gescopt, die diese Lane ausführen; nicht zusammenhängende Source-, Plugin-, Install-Smoke- und reine Teständerungen bleiben auf den Linux-Node-Lanes.

Die langsamsten Node-Testfamilien sind aufgeteilt oder ausbalanciert, sodass jeder Job klein bleibt, ohne Runner übermäßig zu reservieren: Channel-Contracts laufen als drei gewichtete Blacksmith-gestützte Shards mit dem Standard-GitHub-Runner-Fallback, Core-Unit-Fast-/Support-Lanes laufen getrennt, Core-Runtime-Infrastruktur ist zwischen State-, Prozess-/Config-, Cron- und Shared-Shards aufgeteilt, Auto-Reply läuft als ausbalancierte Worker (wobei der Reply-Subtree in Agent-Runner-, Dispatch- und Commands-/State-Routing-Shards aufgeteilt ist), und agentische Gateway-/Server-Konfigurationen sind über Chat-/Auth-/Model-/HTTP-Plugin-/Runtime-/Startup-Lanes verteilt, statt auf gebaute Artefakte zu warten. Breite Browser-, QA-, Media- und sonstige Plugin-Tests verwenden ihre dedizierten Vitest-Konfigurationen statt des gemeinsamen Plugin-Catch-all. Include-Pattern-Shards zeichnen Timing-Einträge mit dem CI-Shard-Namen auf, sodass `.artifacts/vitest-shard-timings.json` eine vollständige Konfiguration von einem gefilterten Shard unterscheiden kann. `check-additional` hält Paket-Boundary-Compile-/Canary-Arbeit zusammen und trennt Runtime-Topologie-Architektur von Gateway-Watch-Abdeckung; die Boundary-Guard-Liste wird über vier Matrix-Shards gestreift, wobei jeder ausgewählte unabhängige Guards parallel ausführt und Timings pro Prüfung ausgibt. Die teure Codex-Happy-Path-Prompt-Snapshot-Drift-Prüfung läuft als eigener zusätzlicher Job nur für manuelle CI und promptbeeinflussende Änderungen, sodass normale nicht zusammenhängende Node-Änderungen nicht hinter kalter Prompt-Snapshot-Generierung warten und die Boundary-Shards ausbalanciert bleiben, während Prompt-Drift weiterhin an die PR gebunden ist, die sie verursacht hat; dasselbe Flag überspringt die Prompt-Snapshot-Vitest-Generierung innerhalb des Built-Artifact-Core-Support-Boundary-Shards. Gateway-Watch, Channel-Tests und der Core-Support-Boundary-Shard laufen innerhalb von `build-artifacts` parallel, nachdem `dist/` und `dist-runtime/` bereits gebaut wurden.

Android-CI führt sowohl `testPlayDebugUnitTest` als auch `testThirdPartyDebugUnitTest` aus und baut anschließend das Play-Debug-APK. Der Third-Party-Flavor hat kein separates Source Set oder Manifest; seine Unit-Test-Lane kompiliert den Flavor weiterhin mit den SMS-/Call-Log-BuildConfig-Flags, während sie bei jedem Android-relevanten Push einen doppelten Debug-APK-Packaging-Job vermeidet.

Der `check-dependencies`-Shard führt `pnpm deadcode:dependencies` (einen Produktions-Knip-Durchlauf nur für Abhängigkeiten, gepinnt auf die neueste Knip-Version, mit deaktiviertem pnpm-Mindest-Release-Alter für die `dlx`-Installation) und `pnpm deadcode:unused-files` aus, das Knips Produktionsfunde ungenutzter Dateien mit `scripts/deadcode-unused-files.allowlist.mjs` vergleicht. Der Guard für ungenutzte Dateien schlägt fehl, wenn eine PR eine neue ungeprüfte ungenutzte Datei hinzufügt oder einen veralteten Allowlist-Eintrag zurücklässt, während beabsichtigte dynamische Plugin-, generierte, Build-, Live-Test- und Paket-Bridge-Oberflächen erhalten bleiben, die Knip statisch nicht auflösen kann.

## ClawSweeper-Aktivitätsweiterleitung

`.github/workflows/clawsweeper-dispatch.yml` ist die zielseitige Bridge von OpenClaw-Repository-Aktivität zu ClawSweeper. Sie checkt keinen nicht vertrauenswürdigen Pull-Request-Code aus und führt ihn nicht aus. Der Workflow erstellt aus `CLAWSWEEPER_APP_PRIVATE_KEY` ein GitHub-App-Token und dispatcht dann kompakte `repository_dispatch`-Payloads an `openclaw/clawsweeper`.

Der Workflow hat vier Lanes:

- `clawsweeper_item` für exakte Issue- und Pull-Request-Review-Anfragen;
- `clawsweeper_comment` für explizite ClawSweeper-Befehle in Issue-Kommentaren;
- `clawsweeper_commit_review` für Commit-Level-Review-Anfragen bei `main`-Pushes;
- `github_activity` für allgemeine GitHub-Aktivität, die der ClawSweeper-Agent prüfen kann.

Die `github_activity`-Lane leitet nur normalisierte Metadaten weiter: Event-Typ, Aktion, Actor, Repository, Item-Nummer, URL, Titel, Status und kurze Auszüge für Kommentare oder Reviews, wenn vorhanden. Sie vermeidet bewusst, den vollständigen Webhook-Body weiterzuleiten. Der empfangende Workflow in `openclaw/clawsweeper` ist `.github/workflows/github-activity.yml`, der das normalisierte Event an den OpenClaw-Gateway-Hook für den ClawSweeper-Agent postet.

Allgemeine Aktivität ist Beobachtung, keine standardmäßige Zustellung. Der ClawSweeper-Agent erhält das Discord-Ziel in seinem Prompt und sollte nur dann in `#clawsweeper` posten, wenn das Event überraschend, umsetzbar, riskant oder betrieblich nützlich ist. Routinemäßige Öffnungen, Bearbeitungen, Bot-Churn, doppeltes Webhook-Rauschen und normaler Review-Verkehr sollten zu `NO_REPLY` führen.

Behandeln Sie GitHub-Titel, Kommentare, Bodys, Review-Text, Branch-Namen und Commit-Nachrichten in diesem gesamten Pfad als nicht vertrauenswürdige Daten. Sie sind Eingaben für Zusammenfassung und Triage, keine Anweisungen für den Workflow oder die Agent-Laufzeit.

## Manuelle Dispatches

Manuelle CI-Dispatches führen denselben Job-Graphen wie normale CI aus, erzwingen aber jede nicht auf Android beschränkte Lane: Linux Node-Shards, gebündelte Plugin-Shards, Channel-Contracts, Node-22-Kompatibilität, `check`, `check-additional`, Build-Smoke, Docs-Prüfungen, Python-Skills, Windows, macOS und Control UI i18n. Eigenständige manuelle CI-Dispatches führen Android nur mit `include_android=true` aus; der vollständige Release-Umbrella aktiviert Android, indem `include_android=true` übergeben wird. Statische Plugin-Prerelease-Prüfungen, der nur für Releases vorgesehene `agentic-plugins`-Shard, der vollständige Extension-Batch-Sweep und Plugin-Prerelease-Docker-Lanes sind von CI ausgeschlossen. Die Docker-Prerelease-Suite läuft nur, wenn `Full Release Validation` den separaten `Plugin Prerelease`-Workflow mit aktivierter Release-Validation-Gate dispatcht.

Manuelle Läufe verwenden eine eindeutige Concurrency-Gruppe, damit eine vollständige Release-Candidate-Suite nicht durch einen weiteren Push- oder PR-Lauf auf derselben Ref abgebrochen wird. Die optionale Eingabe `target_ref` ermöglicht es einem vertrauenswürdigen Aufrufer, diesen Graphen gegen einen Branch, Tag oder vollständigen Commit-SHA auszuführen, während die Workflow-Datei aus der ausgewählten Dispatch-Ref verwendet wird.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, schnelle Security-Jobs und Aggregate (`security-scm-fast`, `security-dependency-audit`, `security-fast`), schnelle Protokoll-/Contract-/gebündelte Prüfungen, geshardete Channel-Contract-Prüfungen, `check`-Shards außer Lint, `check-additional`-Aggregate, Node-Test-Aggregat-Verifizierer, Docs-Prüfungen, Python-Skills, Workflow-Sanity, Labeler, Auto-Response; der Install-Smoke-Preflight verwendet ebenfalls von GitHub gehostetes Ubuntu, damit die Blacksmith-Matrix früher in die Warteschlange eingereiht werden kann |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, weniger schwere Extension-Shards, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` und `check-test-types`                                                                                                                                                                                                                                                                                                        |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, Build-Smoke, Linux Node-Test-Shards, gebündelte Plugin-Test-Shards, `check-additional`-Shards, `android`                                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (CPU-sensibel genug, dass 8 vCPU mehr kosteten, als sie einsparten); Install-Smoke-Docker-Builds (32-vCPU-Warteschlangenzeit kostete mehr, als sie einsparte)                                                                                                                                                                                                                                                                                                          |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` auf `openclaw/openclaw`; Forks fallen auf `macos-latest` zurück                                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` auf `openclaw/openclaw`; Forks fallen auf `macos-latest` zurück                                                                                                                                                                                                                                                                                                                                                                                      |

CI im kanonischen Repo behält Blacksmith als Standard-Runner-Pfad bei. Während `preflight` prüft `scripts/ci-runner-labels.mjs` aktuelle in der Warteschlange befindliche und laufende Actions-Läufe auf eingereihte Blacksmith-Jobs. Wenn ein bestimmtes Blacksmith-Label bereits eingereihte Jobs hat, fallen nachgelagerte Jobs, die genau dieses Label verwenden würden, nur für diesen Lauf auf den passenden von GitHub gehosteten Runner (`ubuntu-24.04`, `windows-2025` oder `macos-latest`) zurück. Andere Blacksmith-Größen in derselben OS-Familie bleiben auf ihren primären Labels. Wenn der API-Probe fehlschlägt, wird kein Fallback angewendet.

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

`OpenClaw Performance` ist der Performance-Workflow für Produkt und Laufzeit. Er läuft täglich auf `main` und kann manuell dispatcht werden:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Ein manueller Dispatch benchmarkt normalerweise die Workflow-Ref. Setzen Sie `target_ref`, um ein Release-Tag oder einen anderen Branch mit der aktuellen Workflow-Implementierung zu benchmarken. Veröffentlichte Berichtspfade und Latest-Pointer werden nach der getesteten Ref geschlüsselt, und jede `index.md` zeichnet die getestete Ref/SHA, Workflow-Ref/SHA, Kova-Ref, das Profil, den Lane-Auth-Modus, das Modell, die Wiederholungsanzahl und Szenariofilter auf.

Der Workflow installiert OCM aus einem gepinnten Release und Kova aus `openclaw/Kova` mit der gepinnten Eingabe `kova_ref` und führt anschließend drei Lanes aus:

- `mock-provider`: Kova-Diagnoseszenarien gegen eine Laufzeit aus lokalem Build mit deterministischer gefälschter OpenAI-kompatibler Auth.
- `mock-deep-profile`: CPU-/Heap-/Trace-Profiling für Start-, Gateway- und Agent-Turn-Hotspots.
- `live-gpt54`: ein echter OpenAI-`openai/gpt-5.4`-Agent-Turn, übersprungen, wenn `OPENAI_API_KEY` nicht verfügbar ist.

Die Mock-Provider-Lane führt nach dem Kova-Durchlauf außerdem OpenClaw-native Source-Probes aus: Gateway-Boot-Timing und Speicher über Standard-, Hook- und 50-Plugin-Startfälle hinweg; wiederholte Mock-OpenAI-`channel-chat-baseline`-Hello-Loops; und CLI-Startbefehle gegen das gestartete Gateway. Die Markdown-Zusammenfassung der Source-Probes befindet sich in `source/index.md` im Berichtsbundle, mit rohem JSON daneben.

Jede Lane lädt GitHub-Artefakte hoch. Wenn `CLAWGRIT_REPORTS_TOKEN` konfiguriert ist, committet der Workflow außerdem `report.json`, `report.md`, Bundles, `index.md` und Source-Probe-Artefakte nach `openclaw/clawgrit-reports` unter `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Der aktuelle Tested-Ref-Pointer wird als `openclaw-performance/<tested-ref>/latest-<lane>.json` geschrieben.

## Vollständige Release-Validierung

`Full Release Validation` ist der manuelle Umbrella-Workflow für „alles vor dem Release ausführen“. Er akzeptiert einen Branch, Tag oder vollständigen Commit-SHA, dispatcht den manuellen `CI`-Workflow mit diesem Ziel, dispatcht `Plugin Prerelease` für nur für Releases vorgesehene Plugin-/Paket-/statische/Docker-Nachweise und dispatcht `OpenClaw Release Checks` für Install-Smoke, Package Acceptance, Cross-OS-Package-Prüfungen, QA-Lab-Parität, Matrix und Telegram-Lanes. Stabile/Standard-Läufe halten umfassende Live-/E2E- und Docker-Release-Path-Abdeckung hinter `run_release_soak=true`; `release_profile=full` erzwingt diese Soak-Abdeckung, damit breite Advisory-Validierung breit bleibt. Mit `rerun_group=all` und `release_profile=full` läuft außerdem `NPM Telegram Beta E2E` gegen das `release-package-under-test`-Artefakt aus den Release-Prüfungen. Übergeben Sie nach der Veröffentlichung `npm_telegram_package_spec`, um dieselbe Telegram-Paket-Lane gegen das veröffentlichte npm-Paket erneut auszuführen.

Siehe [Vollständige Release-Validierung](/de/reference/full-release-validation) für die
Stage-Matrix, die exakten Workflow-Jobnamen, Profilunterschiede, Artefakte und
fokussierten Rerun-Handles.

`OpenClaw Release Publish` ist der manuelle mutierende Release-Workflow. Dispatchen Sie ihn
von `release/YYYY.M.D` oder `main`, nachdem das Release-Tag existiert und nachdem der
OpenClaw-npm-Preflight erfolgreich war. Er verifiziert `pnpm plugins:sync:check`,
dispatcht `Plugin NPM Release` für alle veröffentlichbaren Plugin-Pakete, dispatcht
`Plugin ClawHub Release` für denselben Release-SHA und dispatcht erst dann
`OpenClaw NPM Release` mit der gespeicherten `preflight_run_id`.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Für den Nachweis eines angehefteten Commits auf einem sich schnell bewegenden Branch verwenden Sie den Helper statt
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub-Workflow-Dispatch-Refs müssen Branches oder Tags sein, keine rohen Commit-SHAs. Der Helper pusht einen temporären Branch `release-ci/<sha>-...` am Ziel-SHA, dispatcht `Full Release Validation` von diesem angehefteten Ref, verifiziert, dass jeder untergeordnete Workflow-`headSha` mit dem Ziel übereinstimmt, und löscht den temporären Branch, wenn der Lauf abgeschlossen ist. Der übergeordnete Verifier schlägt auch fehl, wenn ein untergeordneter Workflow mit einem anderen SHA lief.

`release_profile` steuert die Live-/Provider-Breite, die an Release-Prüfungen übergeben wird. Die manuellen Release-Workflows verwenden standardmäßig `stable`; verwenden Sie `full` nur, wenn Sie bewusst die breite advisory Provider-/Medien-Matrix wünschen. `run_release_soak` steuert, ob stabile/standardmäßige Release-Prüfungen den umfassenden Live-/E2E- und Docker-Release-Pfad-Soak ausführen; `full` erzwingt den Soak.

- `minimum` behält die schnellsten OpenAI-/Core-Release-kritischen Lanes bei.
- `stable` ergänzt den stabilen Provider-/Backend-Satz.
- `full` führt die breite advisory Provider-/Medien-Matrix aus.

Der Umbrella zeichnet die IDs der dispatchten untergeordneten Läufe auf, und der abschließende Job `Verify full validation` prüft die aktuellen Ergebnisse der untergeordneten Läufe erneut und hängt Tabellen der langsamsten Jobs für jeden untergeordneten Lauf an. Wenn ein untergeordneter Workflow erneut ausgeführt wird und grün wird, führen Sie nur den übergeordneten Verifier-Job erneut aus, um das Umbrella-Ergebnis und die Timing-Zusammenfassung zu aktualisieren.

Für die Wiederherstellung akzeptieren sowohl `Full Release Validation` als auch `OpenClaw Release Checks` `rerun_group`. Verwenden Sie `all` für einen Release-Kandidaten, `ci` nur für das normale vollständige CI-Kind, `plugin-prerelease` nur für das Plugin-Prerelease-Kind, `release-checks` für jedes Release-Kind oder eine engere Gruppe: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` oder `npm-telegram` im Umbrella. So bleibt die erneute Ausführung einer fehlgeschlagenen Release-Box nach einer fokussierten Korrektur begrenzt. Für eine fehlgeschlagene Cross-OS-Lane kombinieren Sie `rerun_group=cross-os` mit `cross_os_suite_filter`, zum Beispiel `windows/packaged-upgrade`; lange Cross-OS-Befehle geben Heartbeat-Zeilen aus, und packaged-upgrade-Zusammenfassungen enthalten Timings pro Phase. QA-Release-Check-Lanes sind advisory, daher warnen reine QA-Fehler, blockieren aber den Release-Check-Verifier nicht.

`OpenClaw Release Checks` verwendet den vertrauenswürdigen Workflow-Ref, um den ausgewählten Ref einmal in ein `release-package-under-test`-Tarball aufzulösen, und gibt dieses Artefakt dann an Cross-OS-Prüfungen und Package Acceptance weiter, zusätzlich zum Live-/E2E-Release-Pfad-Docker-Workflow, wenn Soak-Abdeckung läuft. So bleiben die Paket-Bytes über Release-Boxen hinweg konsistent, und dasselbe Kandidatenpaket muss nicht in mehreren untergeordneten Jobs erneut gepackt werden.

Doppelte `Full Release Validation`-Läufe für `ref=main` und `rerun_group=all` ersetzen den älteren Umbrella. Der übergeordnete Monitor bricht jeden untergeordneten Workflow ab, den er bereits dispatcht hat, wenn der übergeordnete Lauf abgebrochen wird, sodass neuere Main-Validierung nicht hinter einem veralteten zweistündigen Release-Check-Lauf warten muss. Validierung von Release-Branches/-Tags und fokussierte Rerun-Gruppen behalten `cancel-in-progress: false` bei.

## Live- und E2E-Shards

Das Release-Live-/E2E-Kind behält breite native `pnpm test:live`-Abdeckung bei, führt sie aber als benannte Shards über `scripts/test-live-shard.mjs` aus statt als einen seriellen Job:

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
- aufgeteilte Audio-/Video-Medien-Shards und Provider-gefilterte Musik-Shards

Das behält dieselbe Dateiabdeckung bei und macht langsame Live-Provider-Fehler leichter erneut ausführbar und diagnostizierbar. Die aggregierten Shard-Namen `native-live-extensions-o-z`, `native-live-extensions-media` und `native-live-extensions-media-music` bleiben für manuelle einmalige Reruns gültig.

Die nativen Live-Medien-Shards laufen in `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, gebaut vom Workflow `Live Media Runner Image`. Dieses Image installiert `ffmpeg` und `ffprobe` vorab; Medien-Jobs verifizieren nur die Binärdateien vor dem Setup. Halten Sie Docker-gestützte Live-Suites auf normalen Blacksmith-Runnern — Container-Jobs sind der falsche Ort, um verschachtelte Docker-Tests zu starten.

Docker-gestützte Live-Modell-/Backend-Shards verwenden ein separates gemeinsames Image `ghcr.io/openclaw/openclaw-live-test:<sha>` pro ausgewähltem Commit. Der Live-Release-Workflow baut und pusht dieses Image einmal, danach laufen die Docker-Live-Modell-, Provider-geshardeten Gateway-, CLI-Backend-, ACP-Bind- und Codex-Harness-Shards mit `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gateway-Docker-Shards tragen explizite Timeout-Obergrenzen auf Skript-Ebene unterhalb des Workflow-Job-Timeouts, damit ein hängender Container oder Cleanup-Pfad schnell fehlschlägt, statt das gesamte Release-Check-Budget zu verbrauchen. Wenn diese Shards das vollständige Source-Docker-Target unabhängig neu bauen, ist der Release-Lauf falsch konfiguriert und verschwendet Laufzeit mit doppelten Image-Builds.

## Paketabnahme

Verwenden Sie `Package Acceptance`, wenn die Frage lautet: „Funktioniert dieses installierbare OpenClaw-Paket als Produkt?“ Sie unterscheidet sich von normalem CI: Normales CI validiert den Source-Tree, während die Paketabnahme ein einzelnes Tarball über denselben Docker-E2E-Harness validiert, den Nutzer nach Installation oder Update ausführen.

### Jobs

1. `resolve_package` checkt `workflow_ref` aus, löst einen Paketkandidaten auf, schreibt `.artifacts/docker-e2e-package/openclaw-current.tgz`, schreibt `.artifacts/docker-e2e-package/package-candidate.json`, lädt beide als Artefakt `package-under-test` hoch und gibt Quelle, Workflow-Ref, Paket-Ref, Version, SHA-256 und Profil in der GitHub-Step-Zusammenfassung aus.
2. `docker_acceptance` ruft `openclaw-live-and-e2e-checks-reusable.yml` mit `ref=workflow_ref` und `package_artifact_name=package-under-test` auf. Der wiederverwendbare Workflow lädt dieses Artefakt herunter, validiert das Tarball-Inventar, bereitet bei Bedarf Paket-Digest-Docker-Images vor und führt die ausgewählten Docker-Lanes gegen dieses Paket aus, statt den Workflow-Checkout zu packen. Wenn ein Profil mehrere gezielte `docker_lanes` auswählt, bereitet der wiederverwendbare Workflow das Paket und die gemeinsamen Images einmal vor und fächert diese Lanes dann als parallele gezielte Docker-Jobs mit eindeutigen Artefakten auf.
3. `package_telegram` ruft optional `NPM Telegram Beta E2E` auf. Es läuft, wenn `telegram_mode` nicht `none` ist, und installiert dasselbe Artefakt `package-under-test`, wenn Package Acceptance eines aufgelöst hat; eigenständiger Telegram-Dispatch kann weiterhin eine veröffentlichte npm-Spezifikation installieren.
4. `summary` lässt den Workflow fehlschlagen, wenn Paketauflösung, Docker-Abnahme oder die optionale Telegram-Lane fehlgeschlagen sind.

### Kandidatenquellen

- `source=npm` akzeptiert nur `openclaw@beta`, `openclaw@latest` oder eine exakte OpenClaw-Release-Version wie `openclaw@2026.4.27-beta.2`. Verwenden Sie dies für veröffentlichte Prerelease-/Stable-Abnahme.
- `source=ref` packt einen vertrauenswürdigen `package_ref`-Branch, Tag oder vollständigen Commit-SHA. Der Resolver ruft OpenClaw-Branches/-Tags ab, verifiziert, dass der ausgewählte Commit aus der Repository-Branch-Historie oder einem Release-Tag erreichbar ist, installiert Abhängigkeiten in einem abgekoppelten Worktree und packt ihn mit `scripts/package-openclaw-for-docker.mjs`.
- `source=url` lädt ein HTTPS-`.tgz` herunter; `package_sha256` ist erforderlich.
- `source=artifact` lädt ein `.tgz` aus `artifact_run_id` und `artifact_name` herunter; `package_sha256` ist optional, sollte aber für extern geteilte Artefakte angegeben werden.

Halten Sie `workflow_ref` und `package_ref` getrennt. `workflow_ref` ist der vertrauenswürdige Workflow-/Harness-Code, der den Test ausführt. `package_ref` ist der Source-Commit, der gepackt wird, wenn `source=ref` verwendet wird. Dadurch kann der aktuelle Test-Harness ältere vertrauenswürdige Source-Commits validieren, ohne alte Workflow-Logik auszuführen.

### Suite-Profile

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — vollständige Docker-Release-Pfad-Chunks mit OpenWebUI
- `custom` — exakte `docker_lanes`; erforderlich, wenn `suite_profile=custom`

Das Profil `package` verwendet Offline-Plugin-Abdeckung, damit Validierung veröffentlichter Pakete nicht von Live-ClawHub-Verfügbarkeit abhängt. Die optionale Telegram-Lane verwendet das Artefakt `package-under-test` in `NPM Telegram Beta E2E` erneut, wobei der Pfad über die veröffentlichte npm-Spezifikation für eigenständige Dispatches beibehalten wird.

Für die dedizierte Richtlinie zu Update- und Plugin-Tests, einschließlich lokaler Befehle, Docker-Lanes, Package-Acceptance-Eingaben, Release-Standards und Fehlertriage, siehe [Testen von Updates und Plugins](/de/help/testing-updates-plugins).

Release-Prüfungen rufen Package Acceptance mit `source=artifact`, dem vorbereiteten Release-Paketartefakt, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'` und `telegram_mode=mock-openai` auf. So bleiben Paketmigration, Update, Bereinigung veralteter Plugin-Abhängigkeiten, Reparatur installierter konfigurierter Plugins, Offline-Plugin, Plugin-Update und Telegram-Nachweis auf demselben aufgelösten Paket-Tarball. Setzen Sie `package_acceptance_package_spec` bei Full Release Validation oder OpenClaw Release Checks, um dieselbe Matrix gegen ein ausgeliefertes npm-Paket statt gegen das aus dem SHA gebaute Artefakt auszuführen. Cross-OS-Release-Prüfungen decken weiterhin OS-spezifisches Onboarding-, Installer- und Plattformverhalten ab; Produktvalidierung für Paket/Update sollte mit Package Acceptance beginnen. Die Docker-Lane `published-upgrade-survivor` validiert im blockierenden Release-Pfad pro Lauf eine veröffentlichte Paket-Baseline. In Package Acceptance ist das aufgelöste Tarball `package-under-test` immer der Kandidat, und `published_upgrade_survivor_baseline` wählt die veröffentlichte Fallback-Baseline aus, standardmäßig `openclaw@latest`; Befehle zum erneuten Ausführen fehlgeschlagener Lanes behalten diese Baseline bei. Full Release Validation mit `run_release_soak=true` oder `release_profile=full` setzt `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` und `published_upgrade_survivor_scenarios=reported-issues`, um über die vier neuesten stabilen npm-Releases plus angeheftete Plugin-Kompatibilitäts-Grenz-Releases und Issue-geformte Fixtures für Feishu-Konfiguration, beibehaltene Bootstrap-/Persona-Dateien, konfigurierte OpenClaw-Plugin-Installationen, Tilde-Logpfade und veraltete Legacy-Plugin-Abhängigkeitswurzeln zu erweitern. Multi-Baseline-Auswahlen für published-upgrade survivor werden nach Baseline in separate gezielte Docker-Runner-Jobs geshardet. Der separate Workflow `Update Migration` verwendet die Docker-Lane `update-migration` mit `all-since-2026.4.23` und `plugin-deps-cleanup`, wenn es um umfassende Bereinigung veröffentlichter Updates geht, nicht um normale Full-Release-CI-Breite. Lokale aggregierte Läufe können exakte Paketspezifikationen mit `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` übergeben, eine einzelne Lane mit `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` wie `openclaw@2026.4.15` beibehalten oder `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` für die Szenario-Matrix setzen. Die veröffentlichte Lane konfiguriert die Baseline mit einem eingebetteten Befehlsrezept `openclaw config set`, zeichnet Rezeptschritte in `summary.json` auf und prüft `/healthz`, `/readyz` sowie RPC-Status nach dem Gateway-Start. Die Windows-Packaged- und Installer-Fresh-Lanes verifizieren außerdem, dass ein installiertes Paket ein Browser-Control-Override von einem rohen absoluten Windows-Pfad importieren kann. Der OpenAI-Cross-OS-Agent-Turn-Smoke verwendet standardmäßig `OPENCLAW_CROSS_OS_OPENAI_MODEL`, wenn gesetzt, andernfalls `openai/gpt-5.4`, sodass der Installations- und Gateway-Nachweis auf einem GPT-5-Testmodell bleibt und GPT-4.x-Standards vermieden werden.

### Legacy-Kompatibilitätsfenster

Die Paketakzeptanz hat begrenzte Legacy-Kompatibilitätsfenster für bereits veröffentlichte Pakete. Pakete bis einschließlich `2026.4.25`, einschließlich `2026.4.25-beta.*`, dürfen den Kompatibilitätspfad verwenden:

- bekannte private QA-Einträge in `dist/postinstall-inventory.json` dürfen auf Dateien verweisen, die im Tarball ausgelassen wurden;
- `doctor-switch` darf den Unterfall zur Persistenz von `gateway install --wrapper` überspringen, wenn das Paket dieses Flag nicht bereitstellt;
- `update-channel-switch` darf fehlende `pnpm.patchedDependencies` aus dem vom Tarball abgeleiteten Fake-Git-Fixture entfernen und fehlendes persistiertes `update.channel` protokollieren;
- Plugin-Smokes dürfen Legacy-Install-Record-Speicherorte lesen oder fehlende Persistenz von Marketplace-Install-Records akzeptieren;
- `plugin-update` darf die Migration von Konfigurationsmetadaten zulassen, während weiterhin verlangt wird, dass Install-Record und Verhalten ohne Neuinstallation unverändert bleiben.

Das veröffentlichte Paket `2026.4.26` darf außerdem für lokale Build-Metadaten-Stempeldateien warnen, die bereits ausgeliefert wurden. Spätere Pakete müssen die modernen Verträge erfüllen; dieselben Bedingungen schlagen fehl, statt zu warnen oder zu überspringen.

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

Beginnen Sie beim Debuggen eines fehlgeschlagenen Paketakzeptanzlaufs mit der Zusammenfassung `resolve_package`, um Paketquelle, Version und SHA-256 zu bestätigen. Prüfen Sie anschließend den untergeordneten Lauf `docker_acceptance` und seine Docker-Artefakte: `.artifacts/docker-tests/**/summary.json`, `failures.json`, Lane-Logs, Phasen-Timings und Befehle für erneute Läufe. Bevorzugen Sie es, das fehlgeschlagene Paketprofil oder die exakten Docker-Lanes erneut auszuführen, statt die vollständige Release-Validierung erneut auszuführen.

## Installations-Smoke

Der separate Workflow `Install Smoke` verwendet dasselbe Scope-Skript über seinen eigenen Job `preflight` wieder. Er teilt die Smoke-Abdeckung in `run_fast_install_smoke` und `run_full_install_smoke` auf.

- **Schneller Pfad** wird für Pull Requests ausgeführt, die Docker-/Paketoberflächen, Änderungen an Paketen/Manifesten gebündelter Plugins oder Core-Plugin-/Channel-/Gateway-/Plugin-SDK-Oberflächen berühren, die von den Docker-Smoke-Jobs ausgeübt werden. Reine Quelländerungen an gebündelten Plugins, reine Teständerungen und reine Dokumentationsänderungen reservieren keine Docker-Worker. Der schnelle Pfad baut das Root-Dockerfile-Image einmal, prüft die CLI, führt den CLI-Smoke für das Löschen des gemeinsam genutzten Arbeitsbereichs der Agenten aus, führt das Container-Gateway-Network-E2E aus, verifiziert ein Build-Argument für gebündelte Erweiterungen und führt das begrenzte Docker-Profil für gebündelte Plugins unter einem aggregierten Befehls-Timeout von 240 Sekunden aus (jeder Docker-Lauf eines Szenarios ist separat begrenzt).
- **Vollständiger Pfad** behält QR-Paketinstallation und Installer-Docker-/Update-Abdeckung für nächtliche geplante Läufe, manuelle Dispatches, Workflow-Call-Release-Prüfungen und Pull Requests bei, die tatsächlich Installer-/Paket-/Docker-Oberflächen berühren. Im vollständigen Modus bereitet install-smoke ein GHCR-Root-Dockerfile-Smoke-Image für die Ziel-SHA vor oder verwendet es wieder und führt dann QR-Paketinstallation, Root-Dockerfile-/Gateway-Smokes, Installer-/Update-Smokes und das schnelle Docker-E2E für gebündelte Plugins als separate Jobs aus, damit Installer-Arbeit nicht hinter den Root-Image-Smokes warten muss.

`main`-Pushes (einschließlich Merge-Commits) erzwingen den vollständigen Pfad nicht; wenn die Changed-Scope-Logik bei einem Push vollständige Abdeckung anfordern würde, behält der Workflow den schnellen Docker-Smoke bei und überlässt den vollständigen Installations-Smoke der nächtlichen oder Release-Validierung.

Der langsame Bun-Global-Install-Image-Provider-Smoke wird separat durch `run_bun_global_install_smoke` gesteuert. Er läuft nach dem nächtlichen Zeitplan und aus dem Release-Checks-Workflow, und manuelle `Install Smoke`-Dispatches können ihn aktivieren, Pull Requests und `main`-Pushes jedoch nicht. QR- und Installer-Docker-Tests behalten ihre eigenen installfokussierten Dockerfiles.

## Lokales Docker-E2E

`pnpm test:docker:all` baut ein gemeinsam genutztes Live-Test-Image vor, packt OpenClaw einmal als npm-Tarball und baut zwei gemeinsam genutzte `scripts/e2e/Dockerfile`-Images:

- einen einfachen Node/Git-Runner für Installer-/Update-/Plugin-Abhängigkeits-Lanes;
- ein funktionales Image, das denselben Tarball für normale Funktions-Lanes in `/app` installiert.

Docker-Lane-Definitionen befinden sich in `scripts/lib/docker-e2e-scenarios.mjs`, die Planerlogik befindet sich in `scripts/lib/docker-e2e-plan.mjs`, und der Runner führt nur den ausgewählten Plan aus. Der Scheduler wählt das Image pro Lane mit `OPENCLAW_DOCKER_E2E_BARE_IMAGE` und `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` aus und führt dann Lanes mit `OPENCLAW_SKIP_DOCKER_BUILD=1` aus.

### Einstellbare Parameter

| Variable                               | Standard | Zweck                                                                                         |
| -------------------------------------- | -------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10       | Slot-Anzahl des Hauptpools für normale Lanes.                                                  |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10       | Slot-Anzahl des Provider-sensitiven Tail-Pools.                                                |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9        | Limit für gleichzeitige Live-Lanes, damit Provider nicht drosseln.                             |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10       | Limit für gleichzeitige npm-Install-Lanes.                                                     |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7        | Limit für gleichzeitige Multi-Service-Lanes.                                                    |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000     | Staffelung zwischen Lane-Starts, um Docker-Daemon-Erstellungsstürme zu vermeiden; setzen Sie `0` für keine Staffelung. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000  | Fallback-Timeout pro Lane (120 Minuten); ausgewählte Live-/Tail-Lanes verwenden engere Limits. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset    | `1` gibt den Scheduler-Plan aus, ohne Lanes auszuführen.                                       |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset    | Kommagetrennte Liste exakter Lanes; überspringt Cleanup-Smoke, damit Agenten eine fehlgeschlagene Lane reproduzieren können. |

Eine Lane, die schwerer ist als ihr effektives Limit, kann dennoch aus einem leeren Pool starten und läuft dann allein, bis sie Kapazität freigibt. Die lokale Aggregation prüft Docker vorab, entfernt veraltete OpenClaw-E2E-Container, gibt den Status aktiver Lanes aus, persistiert Lane-Timings für Longest-First-Sortierung und stoppt standardmäßig die Planung neuer gepoolter Lanes nach dem ersten Fehler.

### Wiederverwendbarer Live-/E2E-Workflow

Der wiederverwendbare Live-/E2E-Workflow fragt `scripts/test-docker-all.mjs --plan-json`, welche Paket-, Image-Art-, Live-Image-, Lane- und Credential-Abdeckung erforderlich ist. `scripts/docker-e2e.mjs` wandelt diesen Plan anschließend in GitHub-Ausgaben und Zusammenfassungen um. Er packt OpenClaw entweder über `scripts/package-openclaw-for-docker.mjs`, lädt ein Paketartefakt aus dem aktuellen Lauf herunter oder lädt ein Paketartefakt aus `package_artifact_run_id` herunter; validiert das Tarball-Inventar; baut und pusht Paket-Digest-getaggte Bare-/Functional-GHCR-Docker-E2E-Images über Blacksmiths Docker-Layer-Cache, wenn der Plan Lanes mit installiertem Paket benötigt; und verwendet bereitgestellte Eingaben `docker_e2e_bare_image`/`docker_e2e_functional_image` oder vorhandene Paket-Digest-Images wieder, statt neu zu bauen. Docker-Image-Pulls werden mit einem begrenzten Timeout von 180 Sekunden pro Versuch erneut versucht, damit ein hängender Registry-/Cache-Stream schnell erneut versucht wird, statt den Großteil des kritischen CI-Pfads zu verbrauchen.

### Release-Pfad-Chunks

Release-Docker-Abdeckung läuft in kleineren gechunkten Jobs mit `OPENCLAW_SKIP_DOCKER_BUILD=1`, sodass jeder Chunk nur die benötigte Image-Art pullt und mehrere Lanes über denselben gewichteten Scheduler ausführt:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Aktuelle Release-Docker-Chunks sind `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` und `plugins-runtime-install-a` bis `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` und `plugins-integrations` bleiben aggregierte Plugin-/Runtime-Aliasse. Der Lane-Alias `install-e2e` bleibt der aggregierte manuelle Wiederholungslauf-Alias für beide Provider-Installer-Lanes.

OpenWebUI wird in `plugins-runtime-services` aufgenommen, wenn die vollständige Release-Pfad-Abdeckung dies anfordert, und behält einen eigenständigen Chunk `openwebui` nur für reine OpenWebUI-Dispatches. Update-Lanes gebündelter Channels versuchen bei vorübergehenden npm-Netzwerkfehlern einmal erneut.

Jeder Chunk lädt `.artifacts/docker-tests/` mit Lane-Logs, Timings, `summary.json`, `failures.json`, Phasen-Timings, Scheduler-Plan-JSON, Tabellen langsamer Lanes und Wiederholungslauf-Befehlen pro Lane hoch. Die Workflow-Eingabe `docker_lanes` führt ausgewählte Lanes gegen die vorbereiteten Images aus, statt die Chunk-Jobs zu verwenden. Dadurch bleibt das Debuggen fehlgeschlagener Lanes auf einen gezielten Docker-Job begrenzt und das Paketartefakt für diesen Lauf wird vorbereitet, heruntergeladen oder wiederverwendet; wenn eine ausgewählte Lane eine Live-Docker-Lane ist, baut der gezielte Job das Live-Test-Image lokal für diesen Wiederholungslauf. Generierte GitHub-Wiederholungslauf-Befehle pro Lane enthalten `package_artifact_run_id`, `package_artifact_name` und Eingaben für vorbereitete Images, wenn diese Werte vorhanden sind, sodass eine fehlgeschlagene Lane exakt das Paket und die Images aus dem fehlgeschlagenen Lauf wiederverwenden kann.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Der geplante Live-/E2E-Workflow führt die vollständige Release-Pfad-Docker-Suite täglich aus.

## Plugin-Vorabrelease

`Plugin Prerelease` ist eine teurere Produkt-/Paketabdeckung und daher ein separater Workflow, der von `Full Release Validation` oder von einem expliziten Operator ausgelöst wird. Normale Pull Requests, `main`-Pushes und eigenständige manuelle CI-Dispatches lassen diese Suite deaktiviert. Er balanciert Tests gebündelter Plugins über acht Erweiterungs-Worker; diese Erweiterungs-Shard-Jobs führen bis zu zwei Plugin-Konfigurationsgruppen gleichzeitig mit einem Vitest-Worker pro Gruppe und einem größeren Node-Heap aus, damit importlastige Plugin-Batches keine zusätzlichen CI-Jobs erzeugen. Der nur für Releases bestimmte Docker-Vorabrelease-Pfad bündelt gezielte Docker-Lanes in kleinen Gruppen, um nicht Dutzende Runner für ein- bis dreiminütige Jobs zu reservieren.

## QA-Labor

QA-Labor hat dedizierte CI-Lanes außerhalb des zentralen smart-gescopten Workflows. Agentische Parität ist unter den breiten QA- und Release-Harnesses verschachtelt, nicht als eigenständiger PR-Workflow. Verwenden Sie `Full Release Validation` mit `rerun_group=qa-parity`, wenn Parität mit einem breiten Validierungslauf mitlaufen soll.

- Der Workflow `QA-Lab - All Lanes` läuft jede Nacht auf `main` und bei manuellem Dispatch; er fächert die Mock-Paritäts-Lane, die Live-Matrix-Lane sowie die Live-Telegram- und Discord-Lanes als parallele Jobs auf. Live-Jobs verwenden die Umgebung `qa-live-shared`, und Telegram/Discord verwenden Convex-Leases.

Release-Checks führen Matrix- und Telegram-Live-Transport-Lanes mit dem deterministischen Mock-Provider und mock-qualifizierten Modellen (`mock-openai/gpt-5.5` und `mock-openai/gpt-5.5-alt`) aus, damit der Channel-Vertrag von Live-Modell-Latenz und normalem Provider-Plugin-Start isoliert ist. Das Live-Transport-Gateway deaktiviert die Speichersuche, weil QA-Parität das Speicherverhalten separat abdeckt; Provider-Konnektivität wird durch die separaten Suiten für Live-Modelle, native Provider und Docker-Provider abgedeckt.

Matrix verwendet `--profile fast` für geplante Gates und Release-Gates und fügt `--fail-fast` nur hinzu, wenn die ausgecheckte CLI dies unterstützt. Der CLI-Standard und die manuelle Workflow-Eingabe bleiben `all`; eine manuelle `matrix_profile=all`-Ausführung shardet die vollständige Matrix-Abdeckung immer in die Jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` und `e2ee-cli`.

`OpenClaw Release Checks` führt außerdem die releasekritischen QA-Lab-Lanes vor der Release-Freigabe aus; das QA-Paritäts-Gate führt die Kandidaten- und Baseline-Pakete als parallele Lane-Jobs aus und lädt anschließend beide Artefakte in einen kleinen Berichtsjob für den finalen Paritätsvergleich herunter.

Für normale PRs folgen Sie bereichsbezogenen CI-/Check-Nachweisen, statt Parität als erforderlichen Status zu behandeln.

## CodeQL

Der `CodeQL`-Workflow ist bewusst ein enger Security-Scanner für den ersten Durchlauf, nicht der vollständige Repository-Sweep. Tägliche, manuelle und nicht als Draft markierte Pull-Request-Guard-Läufe scannen Actions-Workflow-Code sowie die JavaScript/TypeScript-Flächen mit dem höchsten Risiko mit hochzuverlässigen Security-Abfragen, gefiltert auf hohe/kritische `security-severity`.

Der Pull-Request-Guard bleibt leichtgewichtig: Er startet nur bei Änderungen unter `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` oder `src` und führt dieselbe hochzuverlässige Security-Matrix wie der geplante Workflow aus. Android- und macOS-CodeQL bleiben außerhalb der PR-Standards.

### Security-Kategorien

| Kategorie                                         | Fläche                                                                                                                               |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `/codeql-security-high/core-auth-secrets`         | Auth, Secrets, Sandbox, Cron und Gateway-Baseline                                                                                    |
| `/codeql-security-high/channel-runtime-boundary`  | Verträge der Kern-Channel-Implementierung sowie Channel-Plugin-Runtime, Gateway, Plugin SDK, Secrets, Audit-Berührungspunkte        |
| `/codeql-security-high/network-ssrf-boundary`     | Kernflächen für SSRF, IP-Parsing, Netzwerk-Guard, Web-Fetch und SSRF-Richtlinien des Plugin SDK                                      |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP-Server, Hilfsfunktionen für Prozessausführung, ausgehende Zustellung und Gates für Agent-Tool-Ausführung                         |
| `/codeql-security-high/plugin-trust-boundary`     | Vertrauensflächen für Plugin-Installation, Loader, Manifest, Registry, Package-Manager-Installation, Source-Loading und Plugin-SDK-Paketvertrag |

### Plattformspezifische Security-Shards

- `CodeQL Android Critical Security` — geplanter Android-Security-Shard. Baut die Android-App manuell für CodeQL auf dem kleinsten Blacksmith-Linux-Runner, den die Workflow-Sanity akzeptiert. Lädt unter `/codeql-critical-security/android` hoch.
- `CodeQL macOS Critical Security` — wöchentlicher/manueller macOS-Security-Shard. Baut die macOS-App manuell für CodeQL auf Blacksmith macOS, filtert Ergebnisse des Dependency-Builds aus dem hochgeladenen SARIF heraus und lädt unter `/codeql-critical-security/macos` hoch. Bleibt außerhalb der täglichen Standards, weil der macOS-Build die Laufzeit selbst bei sauberem Zustand dominiert.

### Critical-Quality-Kategorien

`CodeQL Critical Quality` ist der passende Nicht-Security-Shard. Er führt nur JavaScript/TypeScript-Qualitätsabfragen mit Error-Severity und ohne Security-Bezug über engen, hochwertigen Flächen auf dem kleineren Blacksmith-Linux-Runner aus. Sein Pull-Request-Guard ist bewusst kleiner als das geplante Profil: Nicht-Draft-PRs führen nur die passenden Shards `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` und `plugin-sdk-reply-runtime` für Änderungen an Code für Agent-Befehls-/Modell-/Tool-Ausführung und Reply-Dispatch, Config-Schema-/Migrations-/IO-Code, Auth-/Secrets-/Sandbox-/Security-Code, Kern-Channel und gebündelter Channel-Plugin-Runtime, Gateway-Protokoll/Server-Methode, Memory-Runtime/SDK-Verbindung, MCP/Prozess/ausgehender Zustellung, Provider-Runtime/Modellkatalog, Sitzungsdiagnose/Zustellungswarteschlangen, Plugin-Loader, Plugin-SDK/Paketvertrag oder Plugin-SDK-Reply-Runtime aus. Änderungen an CodeQL-Konfiguration und Quality-Workflow führen alle zwölf PR-Quality-Shards aus.

Manuelle Ausführung akzeptiert:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Die engen Profile sind Lehr-/Iterations-Hooks zum isolierten Ausführen eines Quality-Shards.

| Kategorie                                               | Fläche                                                                                                                                                            |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Auth, Secrets, Sandbox, Cron und Code an der Gateway-Security-Grenze                                                                                              |
| `/codeql-critical-quality/config-boundary`              | Config-Schema, Migration, Normalisierung und IO-Verträge                                                                                                          |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway-Protokollschemas und Server-Methoden-Verträge                                                                                                             |
| `/codeql-critical-quality/channel-runtime-boundary`     | Implementierungsverträge des Kern-Channels und gebündelten Channel-Plugins                                                                                        |
| `/codeql-critical-quality/agent-runtime-boundary`       | Befehlsausführung, Modell-/Provider-Dispatch, Auto-Reply-Dispatch und Warteschlangen sowie Runtime-Verträge der ACP-Control-Plane                                 |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP-Server und Tool-Bridges, Hilfsfunktionen für Prozessüberwachung und Verträge für ausgehende Zustellung                                                        |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory-Host-SDK, Memory-Runtime-Fassaden, Memory-Plugin-SDK-Aliase, Verbindung zur Memory-Runtime-Aktivierung und Memory-Doctor-Befehle                           |
| `/codeql-critical-quality/session-diagnostics-boundary` | Interna der Reply-Warteschlange, Sitzungs-Zustellungswarteschlangen, Hilfsfunktionen für Bindung/Zustellung ausgehender Sitzungen, Flächen für Diagnoseereignisse/Log-Bundles und Sitzungs-Doctor-CLI-Verträge |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Inbound-Reply-Dispatch des Plugin SDK, Reply-Payload-/Chunking-/Runtime-Hilfsfunktionen, Channel-Reply-Optionen, Zustellungswarteschlangen und Hilfsfunktionen für Sitzungs-/Thread-Bindung |
| `/codeql-critical-quality/provider-runtime-boundary`    | Modellkatalog-Normalisierung, Provider-Auth und -Discovery, Provider-Runtime-Registrierung, Provider-Standards/-Kataloge und Web-/Search-/Fetch-/Embedding-Registries |
| `/codeql-critical-quality/ui-control-plane`             | Control-UI-Bootstrap, lokale Persistenz, Gateway-Control-Flows und Runtime-Verträge der Task-Control-Plane                                                        |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Kern-Web-Fetch/Search, Medien-IO, Medienverständnis, Bildgenerierung und Runtime-Verträge für Mediengenerierung                                                   |
| `/codeql-critical-quality/plugin-boundary`              | Loader-, Registry-, Public-Surface- und Plugin-SDK-Entrypoint-Verträge                                                                                            |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Veröffentlichter paketinterner Plugin-SDK-Quellcode und Hilfsfunktionen für Plugin-Paketverträge                                                                 |

Quality bleibt von Security getrennt, damit Quality-Funde geplant, gemessen, deaktiviert oder erweitert werden können, ohne das Security-Signal zu verschleiern. Erweiterungen für Swift, Python und gebündelte Plugin-CodeQL sollten erst wieder als bereichsbezogene oder geshardete Folgearbeit hinzugefügt werden, nachdem die engen Profile stabile Laufzeit und stabiles Signal haben.

## Wartungs-Workflows

### Docs Agent

Der `Docs Agent`-Workflow ist eine ereignisgesteuerte Codex-Wartungs-Lane, um vorhandene Dokumentation an kürzlich gelandete Änderungen anzugleichen. Er hat keinen reinen Zeitplan: Ein erfolgreicher Nicht-Bot-Push-CI-Lauf auf `main` kann ihn auslösen, und manuelle Ausführung kann ihn direkt starten. Workflow-Run-Aufrufe werden übersprungen, wenn `main` weitergewandert ist oder wenn in der letzten Stunde ein anderer nicht übersprungener Docs-Agent-Lauf erstellt wurde. Wenn er läuft, prüft er den Commit-Bereich vom vorherigen nicht übersprungenen Docs-Agent-Quell-SHA bis zum aktuellen `main`, sodass ein stündlicher Lauf alle seit dem letzten Docs-Durchlauf angesammelten Main-Änderungen abdecken kann.

### Test Performance Agent

Der `Test Performance Agent`-Workflow ist eine ereignisgesteuerte Codex-Wartungs-Lane für langsame Tests. Er hat keinen reinen Zeitplan: Ein erfolgreicher Nicht-Bot-Push-CI-Lauf auf `main` kann ihn auslösen, aber er wird übersprungen, wenn am selben UTC-Tag bereits ein anderer Workflow-Run-Aufruf gelaufen ist oder läuft. Manuelle Ausführung umgeht dieses tägliche Aktivitäts-Gate. Die Lane erstellt einen gruppierten Vitest-Performance-Bericht der vollständigen Suite, lässt Codex nur kleine, Coverage-erhaltende Test-Performance-Korrekturen statt breiter Refactorings vornehmen, führt anschließend den Bericht der vollständigen Suite erneut aus und lehnt Änderungen ab, die die Baseline-Anzahl bestandener Tests reduzieren. Wenn die Baseline fehlgeschlagene Tests hat, darf Codex nur offensichtliche Fehler beheben, und der Full-Suite-Bericht nach dem Agent muss bestehen, bevor etwas committed wird. Wenn `main` fortschreitet, bevor der Bot-Push landet, rebased die Lane den validierten Patch, führt `pnpm check:changed` erneut aus und versucht den Push erneut; konfliktbehaftete veraltete Patches werden übersprungen. Sie verwendet GitHub-gehostetes Ubuntu, damit die Codex-Action dieselbe Drop-Sudo-Sicherheitshaltung wie der Docs Agent beibehalten kann.

### Doppelte PRs nach Merge

Der `Duplicate PRs After Merge`-Workflow ist ein manueller Maintainer-Workflow für die Bereinigung doppelter PRs nach dem Landen. Er ist standardmäßig ein Dry-Run und schließt nur ausdrücklich aufgelistete PRs, wenn `apply=true` gesetzt ist. Vor Änderungen an GitHub verifiziert er, dass der gelandete PR gemerged ist und dass jedes Duplikat entweder ein gemeinsam referenziertes Issue oder überlappende geänderte Hunks hat.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Lokale Check-Gates und Changed-Routing

Die lokale Changed-Lane-Logik befindet sich in `scripts/changed-lanes.mjs` und wird von `scripts/check-changed.mjs` ausgeführt. Dieses lokale Check-Gate ist bei Architekturgrenzen strenger als der breite CI-Plattformumfang:

- Änderungen an der Core-Produktion führen die Typechecks für Core-Produktion und Core-Tests plus Core-Lint/Guards aus;
- reine Änderungen an Core-Tests führen nur den Core-Test-Typecheck plus Core-Lint aus;
- Änderungen an der Plugin-Produktion führen die Typechecks für Plugin-Produktion und Plugin-Tests plus Plugin-Lint aus;
- reine Änderungen an Plugin-Tests führen den Plugin-Test-Typecheck plus Plugin-Lint aus;
- Änderungen am öffentlichen Plugin SDK oder an Plugin-Verträgen erweitern den Umfang auf den Plugin-Typecheck, weil Plugins von diesen Core-Verträgen abhängen (Vitest-Plugin-Sweeps bleiben explizite Testarbeit);
- reine Versionsanhebungen für Release-Metadaten führen gezielte Versions-/Konfigurations-/Root-Abhängigkeitsprüfungen aus;
- unbekannte Root-/Konfigurationsänderungen fallen sicher auf alle Prüflanes zurück.

Das lokale Routing geänderter Tests befindet sich in `scripts/test-projects.test-support.mjs` und ist absichtlich günstiger als `check:changed`: Direkte Teständerungen führen sich selbst aus, Quelländerungen bevorzugen explizite Zuordnungen, danach Geschwistertests und abhängige Elemente aus dem Importgraphen. Die gemeinsame Zustellkonfiguration für Gruppenräume ist eine der expliziten Zuordnungen: Änderungen an der gruppensichtbaren Antwortkonfiguration, am Zustellmodus für Quellantworten oder am Systemprompt des Nachrichtentools laufen über die Core-Antworttests plus Discord- und Slack-Zustellungsregressionen, damit eine Änderung an einem gemeinsamen Standard fehlschlägt, bevor der erste PR-Push erfolgt. Verwenden Sie `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` nur, wenn die Änderung so harness-weit ist, dass die günstige zugeordnete Menge kein vertrauenswürdiger Proxy ist.

## Testbox-Validierung

Führen Sie Testbox aus dem Repo-Root aus und bevorzugen Sie eine frisch vorgewärmte Box für breite Nachweise. Bevor Sie ein langsames Gate auf einer Box ausgeben, die wiederverwendet wurde, abgelaufen ist oder gerade eine unerwartet große Synchronisierung gemeldet hat, führen Sie zuerst `pnpm testbox:sanity` in der Box aus.

Die Plausibilitätsprüfung schlägt schnell fehl, wenn erforderliche Root-Dateien wie `pnpm-lock.yaml` verschwunden sind oder wenn `git status --short` mindestens 200 getrackte Löschungen zeigt. Das bedeutet normalerweise, dass der Remote-Synchronisierungszustand keine vertrauenswürdige Kopie des PR ist; stoppen Sie diese Box und wärmen Sie stattdessen eine frische auf, anstatt den Produkttestfehler zu debuggen. Setzen Sie für absichtliche PRs mit vielen Löschungen `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` für diesen Plausibilitätslauf.

`pnpm testbox:run` beendet außerdem einen lokalen Blacksmith-CLI-Aufruf, der länger als fünf Minuten ohne Ausgabe nach der Synchronisierung in der Synchronisierungsphase bleibt. Setzen Sie `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, um diese Guard zu deaktivieren, oder verwenden Sie einen größeren Millisekundenwert für ungewöhnlich große lokale Diffs.

Crabbox ist der repo-eigene Remote-Box-Wrapper für Maintainer-Linux-Nachweise. Verwenden Sie ihn, wenn eine Prüfung für eine lokale Bearbeitungsschleife zu breit ist, wenn CI-Parität wichtig ist oder wenn der Nachweis Secrets, Docker, Paket-Lanes, wiederverwendbare Boxen oder Remote-Logs benötigt. Das normale OpenClaw-Backend ist `blacksmith-testbox`; eigene AWS-/Hetzner-Kapazität ist ein Fallback für Blacksmith-Ausfälle, Kontingentprobleme oder explizite Tests mit eigener Kapazität.

Prüfen Sie den Wrapper vor dem ersten Lauf aus dem Repo-Root:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Der Repo-Wrapper verweigert ein veraltetes Crabbox-Binary, das `blacksmith-testbox` nicht ausweist. Übergeben Sie den Provider explizit, auch wenn `.crabbox.yaml` eigene Cloud-Defaults enthält.

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

Lesen Sie die abschließende JSON-Zusammenfassung. Die nützlichen Felder sind `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` und `totalMs`. Einmalige, von Blacksmith unterstützte Crabbox-Läufe sollten die Testbox automatisch stoppen; wenn ein Lauf unterbrochen wird oder die Bereinigung unklar ist, prüfen Sie Live-Boxen und stoppen Sie nur die Boxen, die Sie erstellt haben:

```bash
blacksmith testbox list --all
blacksmith testbox status --id <tbx_id>
blacksmith testbox stop --id <tbx_id>
```

Verwenden Sie Wiederverwendung nur, wenn Sie absichtlich mehrere Befehle auf derselben hydratisierten Box benötigen:

```bash
pnpm crabbox:run -- --provider blacksmith-testbox --id <tbx_id> --no-sync --timing-json --shell -- "pnpm test <path-or-filter>"
pnpm crabbox:stop -- <tbx_id>
```

Wenn Crabbox die fehlerhafte Schicht ist, Blacksmith selbst aber funktioniert, verwenden Sie direktes Blacksmith als engen Fallback:

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

Wenn `blacksmith testbox list --all` und `blacksmith testbox status` funktionieren, neue
Warmups aber nach ein paar Minuten ohne IP oder Actions-Lauf-URL auf `queued` bleiben,
behandeln Sie es als Druck durch Blacksmith-Provider, Warteschlange, Abrechnung oder Organisationslimit. Stoppen Sie die
von Ihnen erstellten Queue-IDs, vermeiden Sie das Starten weiterer Testboxes und verlagern Sie den Nachweis auf den
untenstehenden Pfad für eigene Crabbox-Kapazität, während jemand das Blacksmith-Dashboard,
die Abrechnung und die Organisationslimits prüft.

Eskalieren Sie nur dann auf eigene Crabbox-Kapazität, wenn Blacksmith ausgefallen, durch Kontingente begrenzt ist, die benötigte Umgebung fehlt oder eigene Kapazität explizit das Ziel ist:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Vermeiden Sie unter AWS-Druck `class=beast`, außer die Aufgabe benötigt wirklich CPU der 48xlarge-Klasse. Eine `beast`-Anfrage beginnt bei 192 vCPUs und ist der einfachste Weg, regionale Kontingente für EC2 Spot oder On-Demand Standard auszulösen. Die repo-eigene `.crabbox.yaml` verwendet standardmäßig `standard`, mehrere Kapazitätsregionen und `capacity.hints: true`, sodass vermittelte AWS-Leases ausgewählte Region/Markt, Kontingentdruck, Spot-Fallback und Warnungen für Klassen mit hohem Druck ausgeben. Verwenden Sie `fast` für schwerere breite Prüfungen, `large` erst, nachdem standard/fast nicht ausreichen, und `beast` nur für außergewöhnliche CPU-gebundene Lanes wie vollständige Suites oder Docker-Matrizen für alle Plugins, explizite Release-/Blocker-Validierung oder Performance-Profiling mit vielen Kernen. Verwenden Sie `beast` nicht für `pnpm check:changed`, fokussierte Tests, reine Dokumentationsarbeit, gewöhnliches Linting/Typechecking, kleine E2E-Reproduktionen oder die Triage von Blacksmith-Ausfällen. Verwenden Sie `--market on-demand` für Kapazitätsdiagnosen, damit Spot-Marktschwankungen nicht in das Signal einfließen.

`.crabbox.yaml` besitzt Provider-, Sync- und GitHub-Actions-Hydrationsdefaults für eigene Cloud-Lanes. Sie schließt lokales `.git` aus, damit der hydratisierte Actions-Checkout seine eigenen Remote-Git-Metadaten behält, statt Maintainer-lokale Remotes und Objektspeicher zu synchronisieren, und sie schließt lokale Laufzeit-/Build-Artefakte aus, die niemals übertragen werden sollten. `.github/workflows/crabbox-hydrate.yml` besitzt Checkout, Node-/pnpm-Einrichtung, `origin/main`-Fetch und die nicht geheime Umgebungsübergabe für eigene Cloud-Befehle vom Typ `crabbox run --id <cbx_id>`.

## Verwandt

- [Installationsübersicht](/de/install)
- [Entwicklungskanäle](/de/install/development-channels)
