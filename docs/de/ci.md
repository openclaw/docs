---
read_when:
    - Sie müssen nachvollziehen, warum ein CI-Job ausgeführt wurde oder nicht
    - Sie debuggen eine fehlgeschlagene GitHub Actions-Prüfung
    - Sie koordinieren einen Release-Validierungslauf oder einen erneuten Durchlauf
    - Sie ändern den ClawSweeper-Dispatch oder die Weiterleitung von GitHub-Aktivitäten
summary: CI-Jobgraph, Bereichs-Gates, Release-Dachbereiche und lokale Befehlsäquivalente
title: CI-Pipeline
x-i18n:
    generated_at: "2026-05-11T20:22:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: b377be491770211595b12833b9bb18e5757839ef761539d5caa8eda6f63d75dc
    source_path: ci.md
    workflow: 16
---

OpenClaw-CI läuft bei jedem Push auf `main` und bei jedem Pull Request. Der Job `preflight` klassifiziert das Diff und deaktiviert aufwendige Lanes, wenn nur nicht betroffene Bereiche geändert wurden. Manuelle `workflow_dispatch`-Ausführungen umgehen das intelligente Scoping absichtlich und fächern für Release-Kandidaten und breite Validierung den vollständigen Graphen auf. Android-Lanes bleiben über `include_android` optional. Release-spezifische Plugin-Abdeckung befindet sich im separaten Workflow [`Plugin-Vorabrelease`](#plugin-prerelease) und läuft nur über [`Vollständige Release-Validierung`](#full-release-validation) oder einen expliziten manuellen Dispatch.

## Pipeline-Übersicht

| Job                              | Zweck                                                                                                             | Ausführungszeitpunkt                              |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `preflight`                      | Erkennt reine Dokumentationsänderungen, geänderte Scopes, geänderte Erweiterungen und erstellt das CI-Manifest    | Immer bei Nicht-Draft-Pushes und PRs              |
| `security-scm-fast`              | Erkennung privater Schlüssel und Workflow-Audit über `zizmor`                                                     | Immer bei Nicht-Draft-Pushes und PRs              |
| `security-dependency-audit`      | Abhängigkeitsfreier Audit des Produktions-Lockfiles gegen npm-Advisories                                          | Immer bei Nicht-Draft-Pushes und PRs              |
| `security-fast`                  | Erforderliches Aggregat für die schnellen Sicherheits-Jobs                                                        | Immer bei Nicht-Draft-Pushes und PRs              |
| `check-dependencies`             | Produktionsbezogener Knip-Durchlauf nur für Abhängigkeiten plus Guard für die Allowlist ungenutzter Dateien       | Node-relevante Änderungen                         |
| `build-artifacts`                | Erstellt `dist/`, Control UI, Prüfungen gebauter Artefakte und wiederverwendbare Downstream-Artefakte             | Node-relevante Änderungen                         |
| `checks-fast-core`               | Schnelle Linux-Korrektheits-Lanes wie gebündelte/Plugin-Vertrags-/Protokollprüfungen                             | Node-relevante Änderungen                         |
| `checks-fast-contracts-channels` | Gesplittete Channel-Vertragsprüfungen mit stabilem aggregiertem Prüfergebnis                                     | Node-relevante Änderungen                         |
| `checks-node-core-test`          | Core-Node-Test-Shards ohne Channel-, gebündelte, Vertrags- und Erweiterungs-Lanes                                 | Node-relevante Änderungen                         |
| `check`                          | Gesplittetes Äquivalent des lokalen Haupt-Gates: Produktions-Typen, Lint, Guards, Testtypen und strikter Smoke   | Node-relevante Änderungen                         |
| `check-additional`               | Architektur, gesplitteter Boundary-/Prompt-Drift, Erweiterungs-Guards, Paket-Boundary und Gateway-Watch          | Node-relevante Änderungen                         |
| `build-smoke`                    | Smoke-Tests für die gebaute CLI und Startup-Memory-Smoke                                                          | Node-relevante Änderungen                         |
| `checks`                         | Verifizierer für Channel-Tests mit gebauten Artefakten                                                            | Node-relevante Änderungen                         |
| `checks-node-compat-node22`      | Node-22-Kompatibilitäts-Build und Smoke-Lane                                                                      | Manueller CI-Dispatch für Releases                |
| `check-docs`                     | Dokumentationsformatierung, Lint und Prüfungen auf defekte Links                                                  | Dokumentation geändert                            |
| `skills-python`                  | Ruff + pytest für Python-gestützte Skills                                                                         | Für Python-Skills relevante Änderungen            |
| `checks-windows`                 | Windows-spezifische Prozess-/Pfadtests plus Regressionen für gemeinsame Runtime-Import-Spezifizierer              | Windows-relevante Änderungen                      |
| `macos-node`                     | macOS-TypeScript-Test-Lane mit den gemeinsamen gebauten Artefakten                                                | macOS-relevante Änderungen                        |
| `macos-swift`                    | Swift-Lint, Build und Tests für die macOS-App                                                                     | macOS-relevante Änderungen                        |
| `android`                        | Android-Unit-Tests für beide Flavors plus ein Debug-APK-Build                                                     | Android-relevante Änderungen                      |
| `test-performance-agent`         | Tägliche Codex-Optimierung langsamer Tests nach vertrauenswürdiger Aktivität                                      | Erfolg der Main-CI oder manueller Dispatch        |
| `openclaw-performance`           | Tägliche/bei Bedarf Kova-Runtime-Performance-Berichte mit Mock-Provider, Tiefenprofil und GPT-5.4-Live-Lanes     | Geplanter und manueller Dispatch                  |

## Fail-Fast-Reihenfolge

1. `preflight` entscheidet, welche Lanes überhaupt existieren. Die Logik für `docs-scope` und `changed-scope` sind Schritte innerhalb dieses Jobs, keine eigenständigen Jobs.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` und `skills-python` schlagen schnell fehl, ohne auf die schwereren Artefakt- und Plattform-Matrix-Jobs zu warten.
3. `build-artifacts` überlappt sich mit den schnellen Linux-Lanes, damit Downstream-Verbraucher starten können, sobald der gemeinsame Build bereit ist.
4. Schwerere Plattform- und Runtime-Lanes fächern danach auf: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` und `android`.

GitHub kann überholte Jobs als `cancelled` markieren, wenn ein neuerer Push auf derselben PR- oder `main`-Ref landet. Behandeln Sie das als CI-Rauschen, sofern nicht auch der neueste Lauf für dieselbe Ref fehlschlägt. Aggregierte Shard-Prüfungen verwenden `!cancelled() && always()`, damit sie normale Shard-Fehler weiterhin melden, aber nicht mehr in die Warteschlange gehen, nachdem der gesamte Workflow bereits überholt wurde. Der automatische CI-Concurrency-Schlüssel ist versioniert (`CI-v7-*`), sodass ein GitHub-seitiger Zombie in einer alten Queue-Gruppe neuere Main-Läufe nicht unbegrenzt blockieren kann. Manuelle Vollsuiten-Läufe verwenden `CI-manual-v1-*` und brechen laufende Ausführungen nicht ab.

Der Job `ci-timings-summary` lädt für jeden Nicht-Draft-CI-Lauf ein kompaktes Artefakt `ci-timings-summary` hoch. Es zeichnet Wall Time, Queue Time, die langsamsten Jobs und fehlgeschlagene Jobs für den aktuellen Lauf auf, damit CI-Health-Checks nicht wiederholt die vollständige Actions-Payload auslesen müssen.

## Scope und Routing

Scope-Logik befindet sich in `scripts/ci-changed-scope.mjs` und ist durch Unit-Tests in `src/scripts/ci-changed-scope.test.ts` abgedeckt. Manueller Dispatch überspringt die Changed-Scope-Erkennung und lässt das Preflight-Manifest so handeln, als hätte sich jeder gescopte Bereich geändert.

- **CI-Workflow-Änderungen** validieren den Node-CI-Graphen plus Workflow-Linting, erzwingen aber nicht von sich aus native Windows-, Android- oder macOS-Builds; diese Plattform-Lanes bleiben auf Änderungen an Plattformquellen gescopet.
- **Reine CI-Routing-Änderungen, ausgewählte günstige Core-Test-Fixture-Änderungen und enge Plugin-Vertrags-Helfer-/Test-Routing-Änderungen** verwenden einen schnellen reinen Node-Manifestpfad: `preflight`, Sicherheit und eine einzelne `checks-fast-core`-Aufgabe. Dieser Pfad überspringt Build-Artefakte, Node-22-Kompatibilität, Channel-Verträge, vollständige Core-Shards, Shards gebündelter Plugins und zusätzliche Guard-Matrizen, wenn die Änderung auf Routing- oder Helferflächen beschränkt ist, die die schnelle Aufgabe direkt ausübt.
- **Windows-Node-Prüfungen** sind auf Windows-spezifische Prozess-/Pfad-Wrapper, npm-/pnpm-/UI-Runner-Helfer, Paketmanager-Konfiguration und die CI-Workflow-Flächen gescopet, die diese Lane ausführen; nicht betroffene Quell-, Plugin-, Install-Smoke- und reine Teständerungen bleiben auf den Linux-Node-Lanes.

Die langsamsten Node-Testfamilien sind aufgeteilt oder ausbalanciert, damit jeder Job klein bleibt, ohne Runner übermäßig zu reservieren: Channel-Verträge laufen als drei gewichtete, Blacksmith-gestützte Shards mit dem standardmäßigen GitHub-Runner-Fallback, Core-Unit-Fast-/Support-Lanes laufen separat, Core-Runtime-Infrastruktur ist in State-, Process-/Config-, Cron- und Shared-Shards aufgeteilt, Auto-Reply läuft als ausbalancierte Worker (mit dem Reply-Teilbaum aufgeteilt in Agent-Runner-, Dispatch- und Commands-/State-Routing-Shards), und agentische Gateway-/Server-Konfigurationen sind über Chat-/Auth-/Model-/HTTP-Plugin-/Runtime-/Startup-Lanes verteilt, statt auf gebaute Artefakte zu warten. Breite Browser-, QA-, Medien- und sonstige Plugin-Tests verwenden ihre dedizierten Vitest-Konfigurationen statt des gemeinsamen Plugin-Catch-All. Include-Pattern-Shards zeichnen Timing-Einträge mit dem CI-Shard-Namen auf, damit `.artifacts/vitest-shard-timings.json` eine ganze Konfiguration von einem gefilterten Shard unterscheiden kann. `check-additional` hält Paket-Boundary-Compile-/Canary-Arbeit zusammen und trennt Runtime-Topologie-Architektur von Gateway-Watch-Abdeckung; die Boundary-Guard-Liste ist über vier Matrix-Shards gestreift, die jeweils ausgewählte unabhängige Guards parallel ausführen und Zeiten pro Prüfung ausgeben. Die aufwendige Codex-Happy-Path-Prompt-Snapshot-Drift-Prüfung läuft als eigener zusätzlicher Job nur für manuelle CI und für Prompt-beeinflussende Änderungen, sodass normale nicht betroffene Node-Änderungen nicht hinter kalter Prompt-Snapshot-Generierung warten und die Boundary-Shards ausbalanciert bleiben, während Prompt-Drift weiterhin an den PR gebunden ist, der ihn verursacht hat; dasselbe Flag überspringt die Prompt-Snapshot-Vitest-Generierung innerhalb des Core-Support-Boundary-Shards mit gebauten Artefakten. Gateway-Watch, Channel-Tests und der Core-Support-Boundary-Shard laufen innerhalb von `build-artifacts` parallel, nachdem `dist/` und `dist-runtime/` bereits gebaut wurden.

Android-CI führt sowohl `testPlayDebugUnitTest` als auch `testThirdPartyDebugUnitTest` aus und baut anschließend das Play-Debug-APK. Der Third-Party-Flavor hat kein separates Source Set oder Manifest; seine Unit-Test-Lane kompiliert den Flavor weiterhin mit den SMS-/Call-Log-`BuildConfig`-Flags und vermeidet zugleich einen doppelten Debug-APK-Packaging-Job bei jedem Android-relevanten Push.

Der Shard `check-dependencies` führt `pnpm deadcode:dependencies` (einen produktionsbezogenen Knip-Durchlauf nur für Abhängigkeiten, an die neueste Knip-Version gepinnt, wobei pnpm’s Mindest-Release-Alter für die `dlx`-Installation deaktiviert ist) und `pnpm deadcode:unused-files` aus, das Knips produktionsbezogene Funde ungenutzter Dateien mit `scripts/deadcode-unused-files.allowlist.mjs` vergleicht. Der Guard für ungenutzte Dateien schlägt fehl, wenn ein PR eine neue ungeprüfte ungenutzte Datei hinzufügt oder einen veralteten Allowlist-Eintrag zurücklässt, während absichtliche dynamische Plugin-, generierte, Build-, Live-Test- und Paket-Bridge-Flächen erhalten bleiben, die Knip statisch nicht auflösen kann.

## ClawSweeper-Aktivitätsweiterleitung

`.github/workflows/clawsweeper-dispatch.yml` ist die Zielseiten-Bridge von OpenClaw-Repository-Aktivität zu ClawSweeper. Sie checkt keinen nicht vertrauenswürdigen Pull-Request-Code aus und führt ihn nicht aus. Der Workflow erstellt ein GitHub-App-Token aus `CLAWSWEEPER_APP_PRIVATE_KEY` und dispatcht anschließend kompakte `repository_dispatch`-Payloads an `openclaw/clawsweeper`.

Der Workflow hat vier Lanes:

- `clawsweeper_item` für exakte Review-Anfragen zu Issues und Pull Requests;
- `clawsweeper_comment` für explizite ClawSweeper-Befehle in Issue-Kommentaren;
- `clawsweeper_commit_review` für Review-Anfragen auf Commit-Ebene bei `main`-Pushes;
- `github_activity` für allgemeine GitHub-Aktivität, die der ClawSweeper-Agent untersuchen kann.

Die Lane `github_activity` leitet nur normalisierte Metadaten weiter: Ereignistyp, Aktion, Akteur, Repository, Item-Nummer, URL, Titel, Status und kurze Auszüge für Kommentare oder Reviews, wenn vorhanden. Sie vermeidet absichtlich die Weiterleitung des vollständigen Webhook-Bodys. Der empfangende Workflow in `openclaw/clawsweeper` ist `.github/workflows/github-activity.yml`, der das normalisierte Ereignis an den OpenClaw-Gateway-Hook für den ClawSweeper-Agent postet.

Allgemeine Aktivität ist Beobachtung, keine standardmäßige Zustellung. Der ClawSweeper-Agent erhält das Discord-Ziel in seinem Prompt und sollte nur dann an `#clawsweeper` posten, wenn das Ereignis überraschend, umsetzbar, riskant oder betrieblich nützlich ist. Routinemäßiges Öffnen, Bearbeitungen, Bot-Fluktuation, doppeltes Webhook-Rauschen und normaler Review-Verkehr sollten zu `NO_REPLY` führen.

Behandeln Sie GitHub-Titel, Kommentare, Bodys, Review-Texte, Branch-Namen und Commit-Nachrichten in diesem gesamten Pfad als nicht vertrauenswürdige Daten. Sie sind Eingaben für Zusammenfassung und Triage, keine Anweisungen für den Workflow oder die Agent-Runtime.

## Manuelle Ausführungen

Manuelle CI-Ausführungen führen denselben Job-Graphen aus wie die normale CI, erzwingen aber jede nicht Android-bezogene Lane: Linux-Node-Shards, gebündelte Plugin-Shards, Channel-Verträge, Node-22-Kompatibilität, `check`, `check-additional`, Build-Smoke, Docs-Prüfungen, Python-Skills, Windows, macOS und Control-UI-i18n. Eigenständige manuelle CI-Ausführungen führen Android nur mit `include_android=true` aus; der vollständige Release-Umbrella aktiviert Android durch Übergabe von `include_android=true`. Statische Plugin-Prerelease-Prüfungen, der nur für Releases vorgesehene `agentic-plugins`-Shard, der vollständige Extension-Batch-Sweep und die Plugin-Prerelease-Docker-Lanes sind von der CI ausgeschlossen. Die Docker-Prerelease-Suite läuft nur, wenn `Full Release Validation` den separaten `Plugin Prerelease`-Workflow mit aktiviertem Release-Validation-Gate ausführt.

Manuelle Läufe verwenden eine eindeutige Concurrency-Gruppe, damit eine vollständige Release-Candidate-Suite nicht durch einen anderen Push- oder PR-Lauf auf derselben Ref abgebrochen wird. Die optionale Eingabe `target_ref` erlaubt es einem vertrauenswürdigen Aufrufer, diesen Graphen gegen einen Branch, ein Tag oder eine vollständige Commit-SHA auszuführen, während die Workflow-Datei aus der ausgewählten Dispatch-Ref verwendet wird.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, schnelle Security-Jobs und Aggregate (`security-scm-fast`, `security-dependency-audit`, `security-fast`), schnelle Protocol-/Contract-/Bundled-Prüfungen, geshardete Channel-Contract-Prüfungen, `check`-Shards außer Lint, `check-additional`-Aggregate, Node-Test-Aggregat-Verifizierer, Docs-Prüfungen, Python-Skills, Workflow-Sanity, Labeler, Auto-Response; Install-Smoke-Preflight verwendet ebenfalls von GitHub gehostetes Ubuntu, damit die Blacksmith-Matrix früher in die Warteschlange gehen kann |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, leichtere Extension-Shards, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` und `check-test-types`                                                                                                                                                                                                                                                                                                            |
| `blacksmith-8vcpu-ubuntu-2404`   | Build-Smoke, Linux-Node-Test-Shards, gebündelte Plugin-Test-Shards, `check-additional`-Shards, `android`                                                                                                                                                                                                                                                                                                                                                    |
| `blacksmith-16vcpu-ubuntu-2404`  | `build-artifacts`, `check-lint` (CPU-sensitiv genug, dass 8 vCPU mehr kosteten als sie einsparten); Install-Smoke-Docker-Builds (32-vCPU-Wartezeit kostete mehr als sie einsparte)                                                                                                                                                                                                                                                                          |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` auf `openclaw/openclaw`; Forks fallen auf `macos-latest` zurück                                                                                                                                                                                                                                                                                                                                                                                 |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` auf `openclaw/openclaw`; Forks fallen auf `macos-latest` zurück                                                                                                                                                                                                                                                                                                                                                                                |

Die CI des kanonischen Repos behält Blacksmith als Standard-Runner-Pfad bei. Während `preflight` prüft `scripts/ci-runner-labels.mjs` die zuletzt eingereihten und laufenden Actions-Läufe auf eingereihte Blacksmith-Jobs. Wenn ein bestimmtes Blacksmith-Label bereits eingereihte Jobs hat, fallen nachgelagerte Jobs, die genau dieses Label verwenden würden, nur für diesen Lauf auf den passenden von GitHub gehosteten Runner (`ubuntu-24.04`, `windows-2025` oder `macos-latest`) zurück. Andere Blacksmith-Größen derselben OS-Familie bleiben auf ihren primären Labels. Wenn der API-Probe fehlschlägt, wird kein Fallback angewendet.

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

`OpenClaw Performance` ist der Performance-Workflow für Produkt und Runtime. Er läuft täglich auf `main` und kann manuell ausgeführt werden:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Eine manuelle Ausführung benchmarked normalerweise die Workflow-Ref. Setzen Sie `target_ref`, um ein Release-Tag oder einen anderen Branch mit der aktuellen Workflow-Implementierung zu benchmarken. Veröffentlichte Berichtspfade und Latest-Pointer werden nach der getesteten Ref geschlüsselt, und jede `index.md` zeichnet getestete Ref/SHA, Workflow-Ref/SHA, Kova-Ref, Profil, Lane-Auth-Modus, Modell, Wiederholungsanzahl und Szenariofilter auf.

Der Workflow installiert OCM aus einem gepinnten Release und Kova aus `openclaw/Kova` mit der gepinnten Eingabe `kova_ref` und führt dann drei Lanes aus:

- `mock-provider`: Kova-Diagnoseszenarien gegen eine lokal gebaute Runtime mit deterministischer gefälschter OpenAI-kompatibler Authentifizierung.
- `mock-deep-profile`: CPU-/Heap-/Trace-Profiling für Startup-, Gateway- und Agent-Turn-Hotspots.
- `live-gpt54`: ein echter OpenAI-`openai/gpt-5.4`-Agent-Turn, übersprungen, wenn `OPENAI_API_KEY` nicht verfügbar ist.

Die mock-provider-Lane führt nach dem Kova-Durchlauf auch OpenClaw-native Source-Probes aus: Gateway-Boot-Timing und Speicher über Default-, Hook- und 50-Plugin-Startup-Fälle; wiederholte Mock-OpenAI-`channel-chat-baseline`-Hello-Loops; und CLI-Startup-Befehle gegen den gebooteten Gateway. Die Markdown-Zusammenfassung des Source-Probes liegt unter `source/index.md` im Berichtsbundle, mit Roh-JSON daneben.

Jede Lane lädt GitHub-Artefakte hoch. Wenn `CLAWGRIT_REPORTS_TOKEN` konfiguriert ist, committet der Workflow außerdem `report.json`, `report.md`, Bundles, `index.md` und Source-Probe-Artefakte nach `openclaw/clawgrit-reports` unter `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Der aktuelle Pointer der getesteten Ref wird als `openclaw-performance/<tested-ref>/latest-<lane>.json` geschrieben.

## Vollständige Release-Validierung

`Full Release Validation` ist der manuelle Umbrella-Workflow für „alles vor dem Release ausführen“. Er akzeptiert einen Branch, ein Tag oder eine vollständige Commit-SHA, führt den manuellen `CI`-Workflow mit diesem Ziel aus, führt `Plugin Prerelease` für nur im Release benötigte Plugin-/Package-/Static-/Docker-Nachweise aus und führt `OpenClaw Release Checks` für Install-Smoke, Package Acceptance, Cross-OS-Package-Prüfungen, QA-Lab-Parität, Matrix und Telegram-Lanes aus. Stabile/Default-Läufe halten umfassende Live-/E2E- und Docker-Release-Pfad-Abdeckung hinter `run_release_soak=true`; `release_profile=full` erzwingt diese Soak-Abdeckung, damit breite Advisory-Validierung breit bleibt. Mit `rerun_group=all` und `release_profile=full` läuft außerdem `NPM Telegram Beta E2E` gegen das Artefakt `release-package-under-test` aus den Release-Prüfungen. Übergeben Sie nach der Veröffentlichung `release_package_spec`, um das ausgelieferte npm-Package über Release-Prüfungen, Package Acceptance, Docker, Cross-OS und Telegram hinweg wiederzuverwenden, ohne neu zu bauen. Verwenden Sie `npm_telegram_package_spec` nur, wenn Telegram ein anderes Package nachweisen muss.

Siehe [Vollständige Release-Validierung](/de/reference/full-release-validation) für die
Stage-Matrix, exakte Workflow-Jobnamen, Profilunterschiede, Artefakte und
gezielte Rerun-Handles.

`OpenClaw Release Publish` ist der manuelle mutierende Release-Workflow. Führen Sie ihn
von `release/YYYY.M.D` oder `main` aus, nachdem das Release-Tag existiert und nachdem die
OpenClaw-npm-Preflight erfolgreich war. Er verifiziert `pnpm plugins:sync:check`,
führt `Plugin NPM Release` für alle veröffentlichbaren Plugin-Packages aus, führt
`Plugin ClawHub Release` für dieselbe Release-SHA aus und führt erst dann
`OpenClaw NPM Release` mit der gespeicherten `preflight_run_id` aus.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Für den Nachweis eines gepinnten Commits auf einem schnelllebigen Branch verwenden Sie den Helper statt
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub-Workflow-Dispatch-Refs müssen Branches oder Tags sein, keine rohen Commit-SHAs. Der
Helper pusht einen temporären Branch `release-ci/<sha>-...` am Ziel-SHA,
dispatcht `Full Release Validation` von diesem gepinnten Ref, verifiziert, dass jeder
Child-Workflow-`headSha` mit dem Ziel übereinstimmt, und löscht den temporären Branch, wenn der
Run abgeschlossen ist. Der Umbrella-Verifier schlägt ebenfalls fehl, wenn ein Child-Workflow mit
einem anderen SHA lief.

`release_profile` steuert die Live-/Provider-Breite, die an Release-Checks übergeben wird. Die
manuellen Release-Workflows verwenden standardmäßig `stable`; verwenden Sie `full` nur, wenn Sie
absichtlich die breite beratende Provider-/Medienmatrix möchten. `run_release_soak`
steuert, ob Stable-/Default-Release-Checks den ausführlichen Live-/E2E- und
Docker-Release-Pfad-Soak ausführen; `full` erzwingt den Soak.

- `minimum` behält die schnellsten OpenAI-/Core-releasekritischen Lanes bei.
- `stable` fügt den stabilen Provider-/Backend-Satz hinzu.
- `full` führt die breite beratende Provider-/Medienmatrix aus.

Der Umbrella zeichnet die IDs der dispatchten Child-Runs auf, und der abschließende Job `Verify full validation` prüft die aktuellen Ergebnisse der Child-Runs erneut und hängt Tabellen der langsamsten Jobs für jeden Child-Run an. Wenn ein Child-Workflow erneut ausgeführt wird und grün wird, führen Sie nur den Parent-Verifier-Job erneut aus, um das Umbrella-Ergebnis und die Timing-Zusammenfassung zu aktualisieren.

Für die Wiederherstellung akzeptieren sowohl `Full Release Validation` als auch `OpenClaw Release Checks` `rerun_group`. Verwenden Sie `all` für einen Release-Kandidaten, `ci` nur für das normale Full-CI-Child, `plugin-prerelease` nur für das Plugin-Prerelease-Child, `release-checks` für jedes Release-Child oder eine engere Gruppe: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` oder `npm-telegram` im Umbrella. So bleibt ein erneuter Run einer fehlgeschlagenen Release-Box nach einem gezielten Fix begrenzt. Für eine fehlgeschlagene Cross-OS-Lane kombinieren Sie `rerun_group=cross-os` mit `cross_os_suite_filter`, zum Beispiel `windows/packaged-upgrade`; lange Cross-OS-Befehle geben Heartbeat-Zeilen aus, und Packaged-Upgrade-Zusammenfassungen enthalten Timings pro Phase. QA-Release-Check-Lanes sind beratend, daher warnen reine QA-Fehler, blockieren aber den Release-Check-Verifier nicht.

`OpenClaw Release Checks` verwendet den vertrauenswürdigen Workflow-Ref, um den ausgewählten Ref einmal in einen `release-package-under-test`-Tarball aufzulösen, und übergibt dieses Artefakt dann an Cross-OS-Checks und Package Acceptance sowie an den Live-/E2E-Release-Pfad-Docker-Workflow, wenn Soak-Abdeckung läuft. Dadurch bleiben die Paketbytes über Release-Boxen hinweg konsistent, und derselbe Kandidat muss nicht in mehreren Child-Jobs erneut gepackt werden.

Doppelte `Full Release Validation`-Runs für `ref=main` und `rerun_group=all`
ersetzen den älteren Umbrella. Der Parent-Monitor bricht jeden bereits dispatchten Child-Workflow ab,
wenn der Parent abgebrochen wird, sodass neuere Main-Validierung nicht hinter einem veralteten
zweistündigen Release-Check-Run wartet. Release-Branch-/Tag-Validierung und gezielte Rerun-Gruppen
behalten `cancel-in-progress: false` bei.

## Live- und E2E-Shards

Das Release-Live-/E2E-Child behält breite native `pnpm test:live`-Abdeckung bei, führt sie aber als benannte Shards über `scripts/test-live-shard.mjs` aus statt als einen seriellen Job:

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

Das behält dieselbe Dateiabdeckung bei und macht langsame Live-Provider-Fehler leichter erneut ausführbar und diagnostizierbar. Die aggregierten Shard-Namen `native-live-extensions-o-z`, `native-live-extensions-media` und `native-live-extensions-media-music` bleiben für manuelle One-Shot-Reruns gültig.

Die nativen Live-Medien-Shards laufen in `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, gebaut durch den Workflow `Live Media Runner Image`. Dieses Image installiert `ffmpeg` und `ffprobe` vor; Medienjobs verifizieren vor dem Setup nur die Binaries. Behalten Sie Docker-gestützte Live-Suites auf normalen Blacksmith-Runnern bei — Container-Jobs sind der falsche Ort, um verschachtelte Docker-Tests zu starten.

Docker-gestützte Live-Modell-/Backend-Shards verwenden ein separates gemeinsames Image `ghcr.io/openclaw/openclaw-live-test:<sha>` pro ausgewähltem Commit. Der Live-Release-Workflow baut und pusht dieses Image einmal, dann laufen die Docker-Live-Modell-, Provider-geshardeten Gateway-, CLI-Backend-, ACP-Bind- und Codex-Harness-Shards mit `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gateway-Docker-Shards tragen explizite Timeout-Obergrenzen auf Skriptebene unterhalb des Workflow-Job-Timeouts, sodass ein hängender Container oder Cleanup-Pfad schnell fehlschlägt, statt das gesamte Release-Check-Budget zu verbrauchen. Wenn diese Shards das vollständige Source-Docker-Target unabhängig neu bauen, ist der Release-Run falsch konfiguriert und verschwendet Laufzeit durch doppelte Image-Builds.

## Paketabnahme

Verwenden Sie `Package Acceptance`, wenn die Frage lautet: „Funktioniert dieses installierbare OpenClaw-Paket als Produkt?“ Sie unterscheidet sich von normaler CI: Normale CI validiert den Source-Tree, während Paketabnahme einen einzelnen Tarball über denselben Docker-E2E-Harness validiert, den Benutzer nach Installation oder Update ausüben.

### Jobs

1. `resolve_package` checkt `workflow_ref` aus, löst einen Paketkandidaten auf, schreibt `.artifacts/docker-e2e-package/openclaw-current.tgz`, schreibt `.artifacts/docker-e2e-package/package-candidate.json`, lädt beide als Artefakt `package-under-test` hoch und gibt Quelle, Workflow-Ref, Paket-Ref, Version, SHA-256 und Profil in der GitHub-Step-Zusammenfassung aus.
2. `docker_acceptance` ruft `openclaw-live-and-e2e-checks-reusable.yml` mit `ref=workflow_ref` und `package_artifact_name=package-under-test` auf. Der wiederverwendbare Workflow lädt dieses Artefakt herunter, validiert das Tarball-Inventar, bereitet bei Bedarf Package-Digest-Docker-Images vor und führt die ausgewählten Docker-Lanes gegen dieses Paket aus, statt den Workflow-Checkout zu packen. Wenn ein Profil mehrere gezielte `docker_lanes` auswählt, bereitet der wiederverwendbare Workflow das Paket und die gemeinsamen Images einmal vor und fächert diese Lanes dann als parallele gezielte Docker-Jobs mit eindeutigen Artefakten auf.
3. `package_telegram` ruft optional `NPM Telegram Beta E2E` auf. Es läuft, wenn `telegram_mode` nicht `none` ist, und installiert dasselbe Artefakt `package-under-test`, wenn Package Acceptance eines aufgelöst hat; ein eigenständiger Telegram-Dispatch kann weiterhin eine veröffentlichte npm-Spezifikation installieren.
4. `summary` lässt den Workflow fehlschlagen, wenn Paketauflösung, Docker-Abnahme oder die optionale Telegram-Lane fehlgeschlagen ist.

### Kandidatenquellen

- `source=npm` akzeptiert nur `openclaw@beta`, `openclaw@latest` oder eine exakte OpenClaw-Release-Version wie `openclaw@2026.4.27-beta.2`. Verwenden Sie dies für veröffentlichte Prerelease-/Stable-Abnahme.
- `source=ref` packt einen vertrauenswürdigen `package_ref`-Branch, -Tag oder vollständigen Commit-SHA. Der Resolver fetcht OpenClaw-Branches/-Tags, verifiziert, dass der ausgewählte Commit aus der Repository-Branch-Historie oder einem Release-Tag erreichbar ist, installiert Abhängigkeiten in einem detached Worktree und packt ihn mit `scripts/package-openclaw-for-docker.mjs`.
- `source=url` lädt ein HTTPS-`.tgz` herunter; `package_sha256` ist erforderlich.
- `source=artifact` lädt ein `.tgz` von `artifact_run_id` und `artifact_name` herunter; `package_sha256` ist optional, sollte aber für extern geteilte Artefakte angegeben werden.

Halten Sie `workflow_ref` und `package_ref` getrennt. `workflow_ref` ist der vertrauenswürdige Workflow-/Harness-Code, der den Test ausführt. `package_ref` ist der Source-Commit, der gepackt wird, wenn `source=ref` gilt. Dadurch kann der aktuelle Test-Harness ältere vertrauenswürdige Source-Commits validieren, ohne alte Workflow-Logik auszuführen.

### Suite-Profile

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `skill-install`, `update-corrupt-plugin`, `upgrade-survivor`, `published-upgrade-survivor`, `update-restart-auth`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — vollständige Docker-Release-Pfad-Chunks mit OpenWebUI
- `custom` — exakte `docker_lanes`; erforderlich, wenn `suite_profile=custom`

Das Profil `package` verwendet Offline-Plugin-Abdeckung, damit die Validierung veröffentlichter Pakete nicht von der Live-Verfügbarkeit von ClawHub abhängt. Die optionale Telegram-Lane verwendet das Artefakt `package-under-test` in `NPM Telegram Beta E2E` wieder, wobei der veröffentlichte npm-Spezifikationspfad für eigenständige Dispatches erhalten bleibt.

Für die dedizierte Test-Policy für Updates und Plugins, einschließlich lokaler Befehle,
Docker-Lanes, Package-Acceptance-Eingaben, Release-Defaults und Fehlertriage,
siehe [Updates und Plugins testen](/de/help/testing-updates-plugins).

Release-Prüfungen rufen die Paketabnahme mit `source=artifact`, dem vorbereiteten Release-Paketartefakt, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch skill-install update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update'` und `telegram_mode=mock-openai` auf. Dadurch bleiben Paketmigration, Update, Live-ClawHub-Skill-Installation, Bereinigung veralteter Plugin-Abhängigkeiten, Reparatur der Installation konfigurierter Plugins, Offline-Plugin, Plugin-Update und Telegram-Nachweis auf demselben aufgelösten Paket-Tarball. Setzen Sie `release_package_spec` in Full Release Validation oder OpenClaw Release Checks nach der Veröffentlichung einer Beta, um dieselbe Matrix gegen das ausgelieferte npm-Paket ohne Neubuild auszuführen; setzen Sie `package_acceptance_package_spec` nur, wenn die Paketabnahme ein anderes Paket als der Rest der Release-Validierung benötigt. Cross-OS-Release-Prüfungen decken weiterhin OS-spezifisches Onboarding, Installer- und Plattformverhalten ab; die Produktvalidierung für Paket/Update sollte mit der Paketabnahme beginnen. Die Docker-Lane `published-upgrade-survivor` validiert pro Lauf im blockierenden Release-Pfad eine veröffentlichte Paket-Baseline. In der Paketabnahme ist der aufgelöste Tarball `package-under-test` immer der Kandidat, und `published_upgrade_survivor_baseline` wählt die veröffentlichte Fallback-Baseline aus, standardmäßig `openclaw@latest`; Befehle zur erneuten Ausführung fehlgeschlagener Lanes behalten diese Baseline bei. Full Release Validation mit `run_release_soak=true` oder `release_profile=full` setzt `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` und `published_upgrade_survivor_scenarios=reported-issues`, um auf die vier neuesten stabilen npm-Releases plus angeheftete Grenz-Releases für Plugin-Kompatibilität und issue-förmige Fixtures für Feishu-Konfiguration, beibehaltene Bootstrap-/Persona-Dateien, konfigurierte OpenClaw-Plugin-Installationen, Tilde-Logpfade und veraltete Legacy-Wurzeln für Plugin-Abhängigkeiten auszuweiten. Multi-Baseline-Auswahlen für Published-Upgrade-Survivor werden nach Baseline in separate, gezielte Docker-Runner-Jobs aufgeteilt. Der separate Workflow `Update Migration` verwendet die Docker-Lane `update-migration` mit `all-since-2026.4.23` und `plugin-deps-cleanup`, wenn es um eine vollständige Bereinigung veröffentlichter Updates geht, nicht um die normale Breite der Full-Release-CI. Lokale Aggregatlauf können exakte Paketspezifikationen mit `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` übergeben, mit `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` eine einzelne Lane beibehalten, etwa `openclaw@2026.4.15`, oder `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` für die Szenariomatrix setzen. Die veröffentlichte Lane konfiguriert die Baseline mit einem eingebetteten `openclaw config set`-Befehlsrezept, zeichnet Rezeptschritte in `summary.json` auf und prüft `/healthz`, `/readyz` sowie den RPC-Status nach dem Gateway-Start. Die frischen Windows-Paket- und Installer-Lanes verifizieren außerdem, dass ein installiertes Paket einen Browser-Control-Override aus einem rohen absoluten Windows-Pfad importieren kann. Der OpenAI-Cross-OS-Agent-Turn-Smoke verwendet standardmäßig `OPENCLAW_CROSS_OS_OPENAI_MODEL`, wenn gesetzt, andernfalls `openai/gpt-5.4`, sodass der Installations- und Gateway-Nachweis auf einem GPT-5-Testmodell bleibt und GPT-4.x-Standardwerte vermieden werden.

### Legacy-Kompatibilitätsfenster

Die Paketabnahme hat begrenzte Legacy-Kompatibilitätsfenster für bereits veröffentlichte Pakete. Pakete bis einschließlich `2026.4.25`, einschließlich `2026.4.25-beta.*`, dürfen den Kompatibilitätspfad verwenden:

- bekannte private QA-Einträge in `dist/postinstall-inventory.json` dürfen auf Dateien verweisen, die im Tarball ausgelassen wurden;
- `doctor-switch` darf den Unterfall für die Persistenz von `gateway install --wrapper` überspringen, wenn das Paket dieses Flag nicht bereitstellt;
- `update-channel-switch` darf fehlende pnpm-`patchedDependencies` aus dem vom Tarball abgeleiteten Fake-Git-Fixture entfernen und fehlendes persistiertes `update.channel` protokollieren;
- Plugin-Smokes dürfen Legacy-Installationsdatensatz-Speicherorte lesen oder fehlende Persistenz von Marketplace-Installationsdatensätzen akzeptieren;
- `plugin-update` darf die Migration von Konfigurationsmetadaten zulassen, während weiterhin verlangt wird, dass Installationsdatensatz und No-Reinstall-Verhalten unverändert bleiben.

Das veröffentlichte Paket `2026.4.26` darf außerdem vor bereits ausgelieferten lokalen Build-Metadaten-Stempeldateien warnen. Spätere Pakete müssen die modernen Verträge erfüllen; dieselben Bedingungen schlagen dann fehl, statt zu warnen oder übersprungen zu werden.

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

Beginnen Sie beim Debuggen eines fehlgeschlagenen Paketabnahmelaufs mit der Zusammenfassung `resolve_package`, um Paketquelle, Version und SHA-256 zu bestätigen. Prüfen Sie anschließend den untergeordneten Lauf `docker_acceptance` und seine Docker-Artefakte: `.artifacts/docker-tests/**/summary.json`, `failures.json`, Lane-Logs, Phasenzeiten und Befehle zur erneuten Ausführung. Führen Sie bevorzugt das fehlgeschlagene Paketprofil oder die exakten Docker-Lanes erneut aus, statt die vollständige Release-Validierung erneut auszuführen.

## Installations-Smoke

Der separate Workflow `Install Smoke` verwendet dasselbe Scope-Skript über seinen eigenen `preflight`-Job erneut. Er teilt die Smoke-Abdeckung in `run_fast_install_smoke` und `run_full_install_smoke` auf.

- **Schneller Pfad** läuft für Pull Requests, die Docker-/Paketoberflächen, Änderungen an gebündelten Plugin-Paketen/-Manifesten oder zentrale Plugin-/Kanal-/Gateway-/Plugin-SDK-Oberflächen berühren, welche die Docker-Smoke-Jobs ausüben. Reine Quelländerungen an gebündelten Plugins, reine Teständerungen und reine Dokumentationsänderungen reservieren keine Docker-Worker. Der schnelle Pfad baut das Root-Dockerfile-Image einmal, prüft die CLI, führt den CLI-Smoke zum Löschen von Agenten im gemeinsamen Workspace aus, führt das Container-Gateway-Network-E2E aus, verifiziert ein Build-Argument für gebündelte Erweiterungen und führt das begrenzte Docker-Profil für gebündelte Plugins unter einem aggregierten Befehls-Timeout von 240 Sekunden aus (jeder Docker-Lauf eines Szenarios ist separat begrenzt).
- **Vollständiger Pfad** behält QR-Paketinstallation sowie Installer-Docker-/Update-Abdeckung für nächtlich geplante Läufe, manuelle Dispatches, Workflow-Call-Release-Prüfungen und Pull Requests bei, die tatsächlich Installer-/Paket-/Docker-Oberflächen berühren. Im vollständigen Modus bereitet install-smoke ein GHCR-Smoke-Image für das Root-Dockerfile mit Ziel-SHA vor oder verwendet es erneut und führt dann QR-Paketinstallation, Root-Dockerfile-/Gateway-Smokes, Installer-/Update-Smokes und das schnelle Docker-E2E für gebündelte Plugins als separate Jobs aus, damit Installer-Arbeit nicht hinter den Root-Image-Smokes warten muss.

`main`-Pushes (einschließlich Merge-Commits) erzwingen den vollständigen Pfad nicht; wenn die Changed-Scope-Logik bei einem Push vollständige Abdeckung anfordern würde, behält der Workflow den schnellen Docker-Smoke bei und überlässt den vollständigen Installations-Smoke nächtlichen Läufen oder der Release-Validierung.

Der langsame Bun-Global-Install-Smoke für Image-Provider wird separat durch `run_bun_global_install_smoke` gesteuert. Er läuft im nächtlichen Zeitplan und aus dem Release-Checks-Workflow, und manuelle `Install Smoke`-Dispatches können ihn aktivieren, Pull Requests und `main`-Pushes jedoch nicht. QR- und Installer-Docker-Tests behalten ihre eigenen install-fokussierten Dockerfiles.

## Lokales Docker-E2E

`pnpm test:docker:all` baut ein gemeinsames Live-Test-Image vor, packt OpenClaw einmal als npm-Tarball und baut zwei gemeinsame `scripts/e2e/Dockerfile`-Images:

- einen reinen Node-/Git-Runner für Installer-/Update-/Plugin-Abhängigkeits-Lanes;
- ein funktionales Image, das denselben Tarball für normale Funktions-Lanes in `/app` installiert.

Docker-Lane-Definitionen befinden sich in `scripts/lib/docker-e2e-scenarios.mjs`, die Planerlogik in `scripts/lib/docker-e2e-plan.mjs`, und der Runner führt nur den ausgewählten Plan aus. Der Scheduler wählt das Image pro Lane mit `OPENCLAW_DOCKER_E2E_BARE_IMAGE` und `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` aus und führt dann Lanes mit `OPENCLAW_SKIP_DOCKER_BUILD=1` aus.

### Einstellbare Parameter

| Variable                               | Standard | Zweck                                                                                         |
| -------------------------------------- | -------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10       | Slot-Anzahl des Hauptpools für normale Lanes.                                                  |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10       | Slot-Anzahl des Provider-sensitiven Tail-Pools.                                                |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9        | Obergrenze für gleichzeitige Live-Lanes, damit Provider nicht drosseln.                        |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10       | Obergrenze für gleichzeitige npm-Installations-Lanes.                                          |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7        | Obergrenze für gleichzeitige Multi-Service-Lanes.                                              |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000     | Versatz zwischen Lane-Starts, um Docker-Daemon-Erstellungsstürme zu vermeiden; setzen Sie `0` für keinen Versatz. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000  | Fallback-Timeout pro Lane (120 Minuten); ausgewählte Live-/Tail-Lanes verwenden engere Grenzen. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset    | `1` gibt den Scheduler-Plan aus, ohne Lanes auszuführen.                                      |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset    | Kommagetrennte exakte Lane-Liste; überspringt Cleanup-Smoke, damit Agenten eine fehlgeschlagene Lane reproduzieren können. |

Eine Lane, die schwerer als ihre effektive Grenze ist, kann dennoch aus einem leeren Pool starten und läuft dann allein, bis sie Kapazität freigibt. Der lokale Aggregatlauf prüft Docker vorab, entfernt veraltete OpenClaw-E2E-Container, gibt den Status aktiver Lanes aus, persistiert Lane-Zeiten für eine Longest-First-Sortierung und stoppt standardmäßig die Planung neuer gepoolter Lanes nach dem ersten Fehler.

### Wiederverwendbarer Live-/E2E-Workflow

Der wiederverwendbare Live-/E2E-Workflow fragt `scripts/test-docker-all.mjs --plan-json`, welches Paket, welche Image-Art, welches Live-Image, welche Lane und welche Credential-Abdeckung erforderlich sind. `scripts/docker-e2e.mjs` wandelt diesen Plan anschließend in GitHub-Ausgaben und Zusammenfassungen um. Es packt OpenClaw entweder über `scripts/package-openclaw-for-docker.mjs`, lädt ein Paketartefakt aus dem aktuellen Lauf herunter oder lädt ein Paketartefakt aus `package_artifact_run_id`; validiert das Tarball-Inventar; baut und pusht mit Paket-Digest getaggte Bare-/Functional-GHCR-Docker-E2E-Images über Blacksmiths Docker-Layer-Cache, wenn der Plan Lanes mit installiertem Paket benötigt; und verwendet bereitgestellte Eingaben `docker_e2e_bare_image`/`docker_e2e_functional_image` oder vorhandene Paket-Digest-Images erneut, statt neu zu bauen. Docker-Image-Pulls werden mit einem begrenzten Timeout von 180 Sekunden pro Versuch erneut versucht, damit ein hängender Registry-/Cache-Stream schnell erneut versucht wird, statt den Großteil des kritischen CI-Pfads zu verbrauchen.

### Release-Pfad-Chunks

Die Release-Docker-Abdeckung läuft in kleineren aufgeteilten Jobs mit `OPENCLAW_SKIP_DOCKER_BUILD=1`, sodass jeder Chunk nur die benötigte Image-Art zieht und mehrere Lanes über denselben gewichteten Scheduler ausführt:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Aktuelle Release-Docker-Chunks sind `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` und `plugins-runtime-install-a` bis `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` und `plugins-integrations` bleiben aggregierte Plugin-/Runtime-Aliase. Der Lane-Alias `install-e2e` bleibt der aggregierte manuelle Wiederholungsalias für beide Provider-Installer-Lanes.

OpenWebUI wird in `plugins-runtime-services` aufgenommen, wenn vollständige Release-Pfad-Abdeckung dies anfordert, und behält einen eigenständigen `openwebui`-Chunk nur für reine OpenWebUI-Dispatches. Update-Lanes für gebündelte Kanäle versuchen vorübergehende npm-Netzwerkfehler einmal erneut.

Jeder Chunk lädt `.artifacts/docker-tests/` mit Lane-Logs, Zeitmessungen, `summary.json`, `failures.json`, Phasenzeitmessungen, Scheduler-Plan-JSON, Tabellen langsamer Lanes und Wiederholungsbefehlen pro Lane hoch. Die Workflow-Eingabe `docker_lanes` führt ausgewählte Lanes gegen die vorbereiteten Images aus statt über die Chunk-Jobs. Dadurch bleibt das Debugging fehlgeschlagener Lanes auf einen gezielten Docker-Job begrenzt und das Paketartefakt für diesen Lauf wird vorbereitet, heruntergeladen oder wiederverwendet; wenn eine ausgewählte Lane eine Live-Docker-Lane ist, baut der gezielte Job das Live-Test-Image lokal für diese Wiederholung. Generierte GitHub-Wiederholungsbefehle pro Lane enthalten `package_artifact_run_id`, `package_artifact_name` und vorbereitete Image-Eingaben, wenn diese Werte vorhanden sind, sodass eine fehlgeschlagene Lane das exakte Paket und die exakten Images aus dem fehlgeschlagenen Lauf wiederverwenden kann.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Der geplante Live-/E2E-Workflow führt die vollständige Release-Pfad-Docker-Suite täglich aus.

## Plugin-Vorabversion

`Plugin Prerelease` ist eine aufwendigere Produkt-/Paketabdeckung und deshalb ein separater Workflow, der von `Full Release Validation` oder von einem expliziten Operator ausgelöst wird. Normale Pull Requests, Pushes auf `main` und eigenständige manuelle CI-Dispatches lassen diese Suite deaktiviert. Er verteilt gebündelte Plugin-Tests auf acht Erweiterungs-Worker; diese Erweiterungs-Shard-Jobs führen bis zu zwei Plugin-Konfigurationsgruppen gleichzeitig mit einem Vitest-Worker pro Gruppe und einem größeren Node-Heap aus, damit importintensive Plugin-Batches keine zusätzlichen CI-Jobs erzeugen. Der nur für Releases vorgesehene Docker-Prerelease-Pfad bündelt gezielte Docker-Lanes in kleinen Gruppen, um nicht Dutzende Runner für Jobs von ein bis drei Minuten zu reservieren. Der Workflow lädt außerdem ein informatives Artefakt `plugin-inspector-advisory` aus `@openclaw/plugin-inspector` hoch; Inspector-Befunde dienen als Triage-Eingabe und ändern das blockierende Plugin-Prerelease-Gate nicht.

## QA Lab

QA Lab hat eigene CI-Lanes außerhalb des zentralen intelligent abgegrenzten Workflows. Agentische Parität ist unter den breiten QA- und Release-Harnesses eingebettet, nicht als eigenständiger PR-Workflow. Verwenden Sie `Full Release Validation` mit `rerun_group=qa-parity`, wenn Parität mit einem breiten Validierungslauf mitlaufen soll.

- Der Workflow `QA-Lab - All Lanes` läuft nächtlich auf `main` und bei manuellem Dispatch; er fächert die Mock-Paritäts-Lane, die Live-Matrix-Lane sowie die Live-Telegram- und Discord-Lanes als parallele Jobs auf. Live-Jobs verwenden die Umgebung `qa-live-shared`, und Telegram/Discord verwenden Convex-Leases.

Release-Prüfungen führen Matrix- und Telegram-Live-Transport-Lanes mit dem deterministischen Mock-Provider und mock-qualifizierten Modellen (`mock-openai/gpt-5.5` und `mock-openai/gpt-5.5-alt`) aus, damit der Kanalvertrag von Live-Modelllatenz und normalem Start des Provider-Plugins isoliert ist. Das Live-Transport-Gateway deaktiviert die Speichersuche, weil QA-Parität das Speicherverhalten separat abdeckt; Provider-Konnektivität wird von den separaten Live-Modell-, nativen Provider- und Docker-Provider-Suites abgedeckt.

Matrix verwendet `--profile fast` für geplante und Release-Gates und fügt `--fail-fast` nur hinzu, wenn die ausgecheckte CLI dies unterstützt. Der CLI-Standardwert und die manuelle Workflow-Eingabe bleiben `all`; manueller Dispatch mit `matrix_profile=all` shardet die vollständige Matrix-Abdeckung immer in die Jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` und `e2ee-cli`.

`OpenClaw Release Checks` führt außerdem die releasekritischen QA-Lab-Lanes vor der Release-Freigabe aus; sein QA-Paritäts-Gate führt die Kandidaten- und Basispakete als parallele Lane-Jobs aus und lädt anschließend beide Artefakte in einen kleinen Report-Job für den finalen Paritätsvergleich herunter.

Folgen Sie bei normalen PRs abgegrenzten CI-/Prüfnachweisen, statt Parität als erforderlichen Status zu behandeln.

## CodeQL

Der Workflow `CodeQL` ist bewusst ein enger Security-Scanner für einen ersten Durchlauf, nicht der vollständige Repository-Sweep. Tägliche, manuelle und nicht als Draft markierte Pull-Request-Guard-Läufe scannen Actions-Workflow-Code sowie die JavaScript-/TypeScript-Oberflächen mit dem höchsten Risiko mit Security-Abfragen hoher Konfidenz, gefiltert auf hohe/kritische `security-severity`.

Der Pull-Request-Guard bleibt leichtgewichtig: Er startet nur bei Änderungen unter `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` oder `src` und führt dieselbe Security-Matrix hoher Konfidenz aus wie der geplante Workflow. Android- und macOS-CodeQL bleiben außerhalb der PR-Standardwerte.

### Security-Kategorien

| Kategorie                                         | Oberfläche                                                                                                                        |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Authentifizierung, Secrets, Sandbox, Cron und Gateway-Basislinie                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Core-Kanalimplementierungsverträge plus Kanal-Plugin-Runtime, Gateway, Plugin SDK, Secrets, Audit-Berührungspunkte                |
| `/codeql-security-high/network-ssrf-boundary`     | Core-SSRF, IP-Parsing, Netzwerk-Guard, Web-Fetch und SSRF-Richtlinienoberflächen des Plugin SDK                                   |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP-Server, Helfer für Prozessausführung, ausgehende Zustellung und Gates für Tool-Ausführung durch Agenten                       |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin-Installation, Loader, Manifest, Registry, Package-Manager-Installation, Source-Loading und Vertrauensoberflächen des Paketvertrags im Plugin SDK |

### Plattformspezifische Security-Shards

- `CodeQL Android Critical Security` — geplanter Android-Security-Shard. Baut die Android-App manuell für CodeQL auf dem kleinsten Blacksmith-Linux-Runner, der von der Workflow-Plausibilitätsprüfung akzeptiert wird. Lädt unter `/codeql-critical-security/android` hoch.
- `CodeQL macOS Critical Security` — wöchentlicher/manueller macOS-Security-Shard. Baut die macOS-App manuell für CodeQL auf Blacksmith macOS, filtert Build-Ergebnisse von Abhängigkeiten aus hochgeladenem SARIF heraus und lädt unter `/codeql-critical-security/macos` hoch. Bleibt außerhalb der täglichen Standardwerte, weil der macOS-Build selbst bei sauberem Lauf die Laufzeit dominiert.

### Kritische Qualitätskategorien

`CodeQL Critical Quality` ist der passende Nicht-Security-Shard. Er führt nur Qualitätsabfragen mit Fehler-Schweregrad und ohne Security-Bezug für JavaScript/TypeScript über enge, hochwertige Oberflächen auf dem kleineren Blacksmith-Linux-Runner aus. Sein Pull-Request-Guard ist bewusst kleiner als das geplante Profil: Nicht-Draft-PRs führen nur die passenden Shards `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` und `plugin-sdk-reply-runtime` für Änderungen an Agenten-Befehls-/Modell-/Tool-Ausführung und Reply-Dispatch-Code, Konfigurationsschema-/Migrations-/IO-Code, Auth-/Secrets-/Sandbox-/Security-Code, Core-Kanal- und gebündelter Kanal-Plugin-Runtime, Gateway-Protokoll-/Server-Methoden, Speicher-Runtime-/SDK-Verknüpfung, MCP-/Prozess-/ausgehender Zustellung, Provider-Runtime-/Modellkatalog, Sitzungsdiagnosen-/Zustellungswarteschlangen, Plugin-Loader, Plugin-SDK-/Paketvertrag oder Plugin-SDK-Reply-Runtime aus. Änderungen an CodeQL-Konfiguration und Qualitätsworkflow führen alle zwölf PR-Qualitäts-Shards aus.

Manueller Dispatch akzeptiert:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Die engen Profile sind Lehr-/Iterations-Hooks, um einen Qualitäts-Shard isoliert auszuführen.

| Kategorie                                               | Oberfläche                                                                                                                                                                      |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Authentifizierung, Secrets, Sandbox, Cron und Code für Gateway-Sicherheitsgrenzen                                                                                                |
| `/codeql-critical-quality/config-boundary`              | Konfigurationsschema, Migration, Normalisierung und E/A-Verträge                                                                                                                 |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway-Protokollschemata und Verträge für Servermethoden                                                                                                                       |
| `/codeql-critical-quality/channel-runtime-boundary`     | Verträge für die Kernkanal- und gebündelte Kanal-Plugin-Implementierung                                                                                                          |
| `/codeql-critical-quality/agent-runtime-boundary`       | Befehlsausführung, Modell-/Provider-Dispatch, Auto-Reply-Dispatch und Warteschlangen sowie ACP-Control-Plane-Laufzeitverträge                                                   |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP-Server und Tool-Bridges, Helfer für Prozessüberwachung und Verträge für ausgehende Zustellung                                                                               |
| `/codeql-critical-quality/memory-runtime-boundary`      | Speicher-Host-SDK, Speicher-Laufzeitfassaden, Speicher-Plugin-SDK-Aliase, Glue-Code für Speicher-Laufzeitaktivierung und Speicher-Doctor-Befehle                                |
| `/codeql-critical-quality/session-diagnostics-boundary` | Interna der Antwortwarteschlange, Sitzungszustellungswarteschlangen, Helfer für ausgehende Sitzungsbindung/-zustellung, Diagnoseereignis-/Log-Bundle-Oberflächen und Sitzungs-Doctor-CLI-Verträge |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Eingehender Antwort-Dispatch des Plugin SDK, Antwort-Payload-/Chunking-/Laufzeithelfer, Kanalantwortoptionen, Zustellungswarteschlangen und Helfer für Sitzungs-/Thread-Bindung |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalisierung des Modellkatalogs, Provider-Authentifizierung und -Erkennung, Provider-Laufzeitregistrierung, Provider-Standardwerte/-Kataloge und Web-/Such-/Fetch-/Embedding-Register |
| `/codeql-critical-quality/ui-control-plane`             | Control-UI-Bootstrap, lokale Persistenz, Gateway-Control-Flows und Task-Control-Plane-Laufzeitverträge                                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Kernverträge für Web-Fetch/Suche, Medien-E/A, Medienverständnis, Bilderzeugung und Mediengenerierung                                                                            |
| `/codeql-critical-quality/plugin-boundary`              | Verträge für Loader, Registry, öffentliche Oberfläche und Plugin-SDK-Einstiegspunkte                                                                                            |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Veröffentlichter paket-seitiger Plugin-SDK-Quellcode und Helfer für Plugin-Paketverträge                                                                                       |

Qualität bleibt von Sicherheit getrennt, damit Qualitätsbefunde geplant, gemessen, deaktiviert oder erweitert werden können, ohne das Sicherheitssignal zu verdecken. Swift-, Python- und gebündelte-Plugin-CodeQL-Erweiterungen sollten erst wieder als begrenzte oder geshardete Folgearbeiten hinzugefügt werden, nachdem die schmalen Profile stabile Laufzeit und ein stabiles Signal haben.

## Wartungsworkflows

### Docs Agent

Der `Docs Agent`-Workflow ist eine ereignisgesteuerte Codex-Wartungsspur, um vorhandene Dokumentation mit kürzlich gelandeten Änderungen abzugleichen. Er hat keinen reinen Zeitplan: Ein erfolgreicher Nicht-Bot-Push-CI-Lauf auf `main` kann ihn auslösen, und eine manuelle Ausführung kann ihn direkt starten. Workflow-Run-Aufrufe werden übersprungen, wenn `main` inzwischen weitergelaufen ist oder wenn in der letzten Stunde ein anderer nicht übersprungener Docs-Agent-Lauf erstellt wurde. Wenn er läuft, prüft er den Commit-Bereich vom vorherigen nicht übersprungenen Docs-Agent-Quell-SHA bis zum aktuellen `main`, sodass ein stündlicher Lauf alle Main-Änderungen abdecken kann, die seit dem letzten Dokumentationsdurchlauf angefallen sind.

### Test Performance Agent

Der `Test Performance Agent`-Workflow ist eine ereignisgesteuerte Codex-Wartungsspur für langsame Tests. Er hat keinen reinen Zeitplan: Ein erfolgreicher Nicht-Bot-Push-CI-Lauf auf `main` kann ihn auslösen, aber er wird übersprungen, wenn an diesem UTC-Tag bereits ein anderer Workflow-Run-Aufruf gelaufen ist oder läuft. Manuelle Ausführung umgeht dieses tägliche Aktivitätsgate. Die Spur erstellt einen gruppierten Vitest-Performance-Bericht für die gesamte Suite, lässt Codex nur kleine, abdeckungserhaltende Test-Performance-Fixes statt breiter Refactorings durchführen, führt dann den Bericht für die gesamte Suite erneut aus und verwirft Änderungen, die die Baseline-Anzahl bestandener Tests reduzieren. Wenn die Baseline fehlschlagende Tests hat, darf Codex nur offensichtliche Fehler beheben, und der Full-Suite-Bericht nach dem Agent muss bestehen, bevor etwas committet wird. Wenn `main` fortschreitet, bevor der Bot-Push landet, rebased die Spur den validierten Patch, führt `pnpm check:changed` erneut aus und versucht den Push erneut; kollidierende veraltete Patches werden übersprungen. Sie verwendet GitHub-gehostetes Ubuntu, damit die Codex-Action dieselbe Drop-Sudo-Sicherheitshaltung wie der Docs Agent beibehalten kann.

### Duplicate PRs After Merge

Der `Duplicate PRs After Merge`-Workflow ist ein manueller Maintainer-Workflow für das Aufräumen von Duplikaten nach dem Landen. Standardmäßig läuft er als Dry-Run und schließt nur explizit aufgeführte PRs, wenn `apply=true` gesetzt ist. Bevor GitHub verändert wird, prüft er, dass der gelandete PR gemerged ist und dass jedes Duplikat entweder ein gemeinsam referenziertes Issue oder überlappende geänderte Hunks hat.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Lokale Check-Gates und Changed-Routing

Lokale Changed-Lane-Logik lebt in `scripts/changed-lanes.mjs` und wird von `scripts/check-changed.mjs` ausgeführt. Dieses lokale Check-Gate ist bei Architekturgrenzen strenger als der breite CI-Plattformumfang:

- Änderungen an Core-Produktionscode führen Core-Prod- und Core-Test-Typecheck plus Core-Lint/Guards aus;
- reine Core-Teständerungen führen nur Core-Test-Typecheck plus Core-Lint aus;
- Änderungen an Erweiterungs-Produktionscode führen Extension-Prod- und Extension-Test-Typecheck plus Extension-Lint aus;
- reine Erweiterungs-Teständerungen führen Extension-Test-Typecheck plus Extension-Lint aus;
- Änderungen am öffentlichen Plugin SDK oder an Plugin-Verträgen erweitern auf Extension-Typecheck, weil Erweiterungen von diesen Core-Verträgen abhängen (Vitest-Extension-Sweeps bleiben explizite Testarbeit);
- reine Release-Metadaten-Versionsbumps führen gezielte Versions-/Konfigurations-/Root-Abhängigkeitsprüfungen aus;
- unbekannte Root-/Konfigurationsänderungen fallen sicherheitshalber auf alle Check-Lanes zurück.

Lokales Changed-Test-Routing lebt in `scripts/test-projects.test-support.mjs` und ist absichtlich günstiger als `check:changed`: Direkte Teständerungen führen sich selbst aus, Quelländerungen bevorzugen explizite Mappings, dann Geschwistertests und Import-Graph-Dependents. Die gemeinsame Group-Room-Zustellungskonfiguration ist eines der expliziten Mappings: Änderungen an der gruppensichtbaren Antwortkonfiguration, am Quellantwort-Zustellungsmodus oder am Message-Tool-Systemprompt laufen über die Core-Reply-Tests plus Discord- und Slack-Zustellungsregressionen, damit eine gemeinsame Standardänderung vor dem ersten PR-Push fehlschlägt. Verwenden Sie `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` nur, wenn die Änderung so harness-weit ist, dass das günstige gemappte Set kein verlässlicher Proxy ist.

## Testbox-Validierung

Crabbox ist der repo-eigene Remote-Box-Wrapper für Maintainer-Linux-Nachweise. Verwenden Sie ihn
aus dem Repo-Root, wenn ein Check für eine lokale Bearbeitungsschleife zu breit ist, wenn CI-
Parität wichtig ist oder wenn der Nachweis Secrets, Docker, Paket-Lanes,
wiederverwendbare Boxen oder Remote-Logs benötigt. Das normale OpenClaw-Backend ist
`blacksmith-testbox`; eigene AWS-/Hetzner-Kapazität ist ein Fallback für Blacksmith-
Ausfälle, Quotenprobleme oder explizite Tests mit eigener Kapazität.

Crabbox-gestützte Blacksmith-Läufe wärmen, reservieren, synchronisieren, führen aus, berichten und räumen
einmalige Testboxes auf. Der eingebaute Sync-Sanity-Check schlägt schnell fehl, wenn erforderliche
Root-Dateien wie `pnpm-lock.yaml` verschwinden oder wenn `git status --short`
mindestens 200 getrackte Löschungen zeigt. Setzen Sie für beabsichtigte PRs mit großen Löschungen
`OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` für den Remote-Befehl.

Crabbox beendet außerdem einen lokalen Blacksmith-CLI-Aufruf, der länger als fünf Minuten in der
Sync-Phase bleibt, ohne Ausgabe nach dem Sync zu erzeugen. Setzen Sie
`CRABBOX_BLACKSMITH_SYNC_TIMEOUT_MS=0`, um diesen Guard zu deaktivieren, oder verwenden Sie einen größeren
Millisekundenwert für ungewöhnlich große lokale Diffs.

Prüfen Sie den Wrapper vor einem ersten Lauf aus dem Repo-Root:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Der Repo-Wrapper lehnt eine veraltete Crabbox-Binärdatei ab, die `blacksmith-testbox` nicht ausweist. Übergeben Sie den Provider explizit, auch wenn `.crabbox.yaml` eigene Cloud-Standardwerte enthält.

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

Fokussierte Test-Wiederholung:

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

Gesamte Suite:

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

Lesen Sie die abschließende JSON-Zusammenfassung. Die nützlichen Felder sind `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` und `totalMs`. Einmalige Blacksmith-gestützte Crabbox-Läufe sollten die Testbox automatisch stoppen; wenn ein Lauf unterbrochen wird oder das Cleanup unklar ist, prüfen Sie Live-Boxen und stoppen Sie nur die Boxen, die Sie erstellt haben:

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

Wenn Crabbox die defekte Schicht ist, Blacksmith selbst aber funktioniert, verwenden Sie direktes
Blacksmith nur für Diagnosen wie `list`, `status` und Cleanup. Beheben Sie den
Crabbox-Pfad, bevor Sie einen direkten Blacksmith-Lauf als Maintainer-Nachweis behandeln.

Wenn `blacksmith testbox list --all` und `blacksmith testbox status` funktionieren, neue
Warmups aber nach ein paar Minuten ohne IP oder Actions-Run-URL in `queued` bleiben,
behandeln Sie das als Druck durch Blacksmith-Provider, Warteschlange, Abrechnung oder Organisationslimit. Stoppen Sie die
erstellten queued-IDs, starten Sie keine weiteren Testboxes und verschieben Sie den Nachweis auf den
untenstehenden Pfad mit eigener Crabbox-Kapazität, während jemand das Blacksmith-Dashboard,
die Abrechnung und die Organisationslimits prüft.

Eskalieren Sie nur dann auf eigene Crabbox-Kapazität, wenn Blacksmith ausgefallen, quotenbegrenzt oder die benötigte Umgebung nicht verfügbar ist oder wenn eigene Kapazität explizit das Ziel ist:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Vermeiden Sie bei AWS-Kapazitätsdruck `class=beast`, es sei denn, die Aufgabe benötigt wirklich CPU-Leistung der 48xlarge-Klasse. Eine `beast`-Anforderung beginnt bei 192 vCPUs und ist der einfachste Weg, regionale EC2-Spot- oder On-Demand-Standard-Quoten auszulösen. Die repository-eigene `.crabbox.yaml` verwendet standardmäßig `standard`, mehrere Kapazitätsregionen und `capacity.hints: true`, sodass vermittelte AWS-Leases die ausgewählte Region/den ausgewählten Markt, Quotendruck, Spot-Fallback und Warnungen für Klassen unter hohem Druck ausgeben. Verwenden Sie `fast` für umfangreichere breite Prüfungen, `large` erst, nachdem standard/fast nicht ausreichen, und `beast` nur für außergewöhnliche CPU-gebundene Lanes wie vollständige Test-Suites oder Docker-Matrizen für alle Plugins, explizite Release-/Blocker-Validierung oder Performance-Profiling mit vielen Kernen. Verwenden Sie `beast` nicht für `pnpm check:changed`, fokussierte Tests, reine Dokumentationsarbeit, gewöhnliches Linting/Typecheck, kleine E2E-Reproduktionen oder die Triage eines Blacksmith-Ausfalls. Verwenden Sie `--market on-demand` für die Kapazitätsdiagnose, damit Spot-Marktschwankungen nicht mit dem Signal vermischt werden.

`.crabbox.yaml` besitzt die Standardwerte für Provider, Synchronisierung und GitHub-Actions-Hydration für eigene Cloud-Lanes. Sie schließt lokale `.git`-Daten aus, damit der hydratisierte Actions-Checkout seine eigenen Remote-Git-Metadaten behält, statt maintainer-lokale Remotes und Object Stores zu synchronisieren, und sie schließt lokale Runtime-/Build-Artefakte aus, die nie übertragen werden sollten. `.github/workflows/crabbox-hydrate.yml` besitzt Checkout, Node-/pnpm-Einrichtung, `origin/main`-Fetch und die nicht geheime Umgebungsübergabe für eigene Cloud-Befehle `crabbox run --id <cbx_id>`.

## Verwandt

- [Installationsübersicht](/de/install)
- [Entwicklungskanäle](/de/install/development-channels)
