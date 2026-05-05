---
read_when:
    - Sie müssen verstehen, warum ein CI-Job ausgeführt wurde oder nicht
    - Sie debuggen eine fehlgeschlagene GitHub-Actions-Prüfung
    - Sie koordinieren einen Release-Validierungslauf oder eine erneute Ausführung
    - Sie ändern den ClawSweeper-Dispatch oder die Weiterleitung von GitHub-Aktivitäten
summary: CI-Auftragsgraph, Bereichs-Gates, Release-Umbrellas und lokale Befehlsäquivalente
title: CI-Pipeline
x-i18n:
    generated_at: "2026-05-05T06:16:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 31fe6704e18f9efc519a1a73fc3aa8ae3909d6a27553874eb477e73979a94af2
    source_path: ci.md
    workflow: 16
---

OpenClaw CI läuft bei jedem Push auf `main` und bei jedem Pull Request. Der `preflight`-Job klassifiziert den Diff und schaltet teure Lanes ab, wenn sich nur nicht verwandte Bereiche geändert haben. Manuelle `workflow_dispatch`-Läufe umgehen Smart Scoping absichtlich und fächern für Release-Kandidaten und breite Validierung den vollständigen Graphen auf. Android-Lanes bleiben über `include_android` optional. Release-exklusive Plugin-Abdeckung liegt im separaten [`Plugin Prerelease`](#plugin-prerelease)-Workflow und läuft nur über [`Full Release Validation`](#full-release-validation) oder einen expliziten manuellen Dispatch.

## Pipeline-Übersicht

| Job                              | Zweck                                                                                                     | Wann er läuft                              |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `preflight`                      | Erkennt reine Docs-Änderungen, geänderte Scopes, geänderte Extensions und erstellt das CI-Manifest        | Immer bei Nicht-Entwurfs-Pushes und PRs    |
| `security-scm-fast`              | Erkennung privater Schlüssel und Workflow-Audit über `zizmor`                                             | Immer bei Nicht-Entwurfs-Pushes und PRs    |
| `security-dependency-audit`      | Abhängigkeitsfreier Audit des Produktions-Lockfiles gegen npm-Advisories                                  | Immer bei Nicht-Entwurfs-Pushes und PRs    |
| `security-fast`                  | Erforderliches Aggregat für die schnellen Sicherheitsjobs                                                 | Immer bei Nicht-Entwurfs-Pushes und PRs    |
| `check-dependencies`             | Reiner Produktions-Knip-Durchlauf für Abhängigkeiten plus Allowlist-Guard für ungenutzte Dateien          | Node-relevante Änderungen                  |
| `build-artifacts`                | Erstellt `dist/`, Control UI, Prüfungen gebauter Artefakte und wiederverwendbare nachgelagerte Artefakte  | Node-relevante Änderungen                  |
| `checks-fast-core`               | Schnelle Linux-Korrektheits-Lanes wie Bundled-/Plugin-Contract-/Protocol-Prüfungen                       | Node-relevante Änderungen                  |
| `checks-fast-contracts-channels` | Geshardete Channel-Contract-Prüfungen mit stabilem aggregiertem Prüfergebnis                             | Node-relevante Änderungen                  |
| `checks-node-core-test`          | Core-Node-Test-Shards, ohne Channel-, Bundled-, Contract- und Extension-Lanes                             | Node-relevante Änderungen                  |
| `check`                          | Geshardetes Äquivalent zum lokalen Haupt-Gate: Produktions-Typen, Lint, Guards, Testtypen und Strict-Smoke | Node-relevante Änderungen                  |
| `check-additional`               | Architektur, geshardete Boundary-/Prompt-Drift, Extension-Guards, Paketgrenze und Gateway-Watch          | Node-relevante Änderungen                  |
| `build-smoke`                    | Smoke-Tests für gebaute CLI und Startup-Memory-Smoke                                                      | Node-relevante Änderungen                  |
| `checks`                         | Verifier für gebaute Artefakt-Channel-Tests                                                              | Node-relevante Änderungen                  |
| `checks-node-compat-node22`      | Node-22-Kompatibilitäts-Build und Smoke-Lane                                                              | Manueller CI-Dispatch für Releases         |
| `check-docs`                     | Docs-Formatierung, Lint und Broken-Link-Prüfungen                                                        | Docs geändert                              |
| `skills-python`                  | Ruff + pytest für Python-gestützte Skills                                                                | Für Python-Skills relevante Änderungen     |
| `checks-windows`                 | Windows-spezifische Prozess-/Pfadtests plus Regressionen für gemeinsame Runtime-Import-Spezifizierer     | Windows-relevante Änderungen               |
| `macos-node`                     | macOS-TypeScript-Test-Lane mit den gemeinsamen gebauten Artefakten                                       | macOS-relevante Änderungen                 |
| `macos-swift`                    | Swift-Lint, Build und Tests für die macOS-App                                                            | macOS-relevante Änderungen                 |
| `android`                        | Android-Unit-Tests für beide Flavors plus ein Debug-APK-Build                                            | Android-relevante Änderungen               |
| `test-performance-agent`         | Tägliche Codex-Optimierung langsamer Tests nach vertrauenswürdiger Aktivität                             | Erfolg der Main-CI oder manueller Dispatch |
| `openclaw-performance`           | Tägliche/bedarfsgesteuerte Kova-Runtime-Performance-Berichte mit Mock-Provider-, Deep-Profile- und GPT-5.4-Live-Lanes | Geplant und manueller Dispatch             |

## Fail-Fast-Reihenfolge

1. `preflight` entscheidet, welche Lanes überhaupt existieren. Die `docs-scope`- und `changed-scope`-Logik sind Schritte innerhalb dieses Jobs, keine eigenständigen Jobs.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` und `skills-python` schlagen schnell fehl, ohne auf die schwereren Artefakt- und Plattform-Matrix-Jobs zu warten.
3. `build-artifacts` überlappt sich mit den schnellen Linux-Lanes, damit nachgelagerte Verbraucher starten können, sobald der gemeinsame Build bereit ist.
4. Schwerere Plattform- und Runtime-Lanes fächern danach auf: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` und `android`.

GitHub kann ersetzte Jobs als `cancelled` markieren, wenn ein neuerer Push auf demselben PR oder `main`-Ref landet. Behandeln Sie das als CI-Rauschen, sofern nicht auch der neueste Lauf für denselben Ref fehlschlägt. Aggregierte Shard-Prüfungen verwenden `!cancelled() && always()`, damit sie normale Shard-Fehler weiterhin melden, sich aber nicht mehr einreihen, nachdem der gesamte Workflow bereits ersetzt wurde. Der automatische CI-Concurrency-Schlüssel ist versioniert (`CI-v7-*`), damit ein GitHub-seitiger Zombie in einer alten Queue-Gruppe neuere Main-Läufe nicht unbegrenzt blockieren kann. Manuelle Full-Suite-Läufe verwenden `CI-manual-v1-*` und brechen laufende Läufe nicht ab.

## Scope und Routing

Die Scope-Logik liegt in `scripts/ci-changed-scope.mjs` und ist durch Unit-Tests in `src/scripts/ci-changed-scope.test.ts` abgedeckt. Manueller Dispatch überspringt die Changed-Scope-Erkennung und lässt das Preflight-Manifest so agieren, als hätte sich jeder gescopte Bereich geändert.

- **CI-Workflow-Änderungen** validieren den Node-CI-Graphen plus Workflow-Linting, erzwingen aber für sich genommen keine nativen Windows-, Android- oder macOS-Builds; diese Plattform-Lanes bleiben auf Plattform-Quelländerungen beschränkt.
- **Reine CI-Routing-Änderungen, ausgewählte günstige Core-Test-Fixture-Änderungen und enge Plugin-Contract-Helper-/Test-Routing-Änderungen** verwenden einen schnellen Node-only-Manifest-Pfad: `preflight`, Sicherheit und eine einzelne `checks-fast-core`-Aufgabe. Dieser Pfad überspringt Build-Artefakte, Node-22-Kompatibilität, Channel-Contracts, vollständige Core-Shards, Bundled-Plugin-Shards und zusätzliche Guard-Matrizen, wenn die Änderung auf Routing- oder Helper-Oberflächen begrenzt ist, die die schnelle Aufgabe direkt ausführt.
- **Windows-Node-Prüfungen** sind auf Windows-spezifische Prozess-/Pfad-Wrapper, npm-/pnpm-/UI-Runner-Helper, Paketmanager-Konfiguration und die CI-Workflow-Oberflächen beschränkt, die diese Lane ausführen; nicht verwandte Source-, Plugin-, Install-Smoke- und reine Teständerungen bleiben auf den Linux-Node-Lanes.

Die langsamsten Node-Testfamilien sind aufgeteilt oder ausbalanciert, damit jeder Job klein bleibt, ohne Runner übermäßig zu reservieren: Channel-Contracts laufen als drei gewichtete Shards, Core-Unit-Fast-/Support-Lanes laufen separat, Core-Runtime-Infrastruktur ist zwischen State- und Process-/Config-Shards aufgeteilt, Auto-Reply läuft als ausbalancierte Worker (wobei der Reply-Subtree in Agent-Runner-, Dispatch- und Commands-/State-Routing-Shards aufgeteilt ist), und Agentic-Gateway-/Server-Konfigurationen sind über Chat-/Auth-/Model-/HTTP-Plugin-/Runtime-/Startup-Lanes aufgeteilt, statt auf gebaute Artefakte zu warten. Breite Browser-, QA-, Medien- und sonstige Plugin-Tests verwenden ihre dedizierten Vitest-Konfigurationen statt des gemeinsamen Plugin-Catch-all. Include-Pattern-Shards zeichnen Timing-Einträge mit dem CI-Shard-Namen auf, sodass `.artifacts/vitest-shard-timings.json` eine ganze Konfiguration von einem gefilterten Shard unterscheiden kann. `check-additional` hält Package-Boundary-Compile-/Canary-Arbeit zusammen und trennt Runtime-Topology-Architektur von Gateway-Watch-Abdeckung; die Boundary-Guard-Liste ist über vier Matrix-Shards gestreift, wobei jeder ausgewählte unabhängige Guards parallel ausführt und Timings pro Prüfung ausgibt, einschließlich `pnpm prompt:snapshots:check`, damit Prompt-Drift im Codex-Runtime-Happy-Path an den PR gebunden ist, der ihn verursacht hat. Gateway-Watch, Channel-Tests und der Core-Support-Boundary-Shard laufen innerhalb von `build-artifacts` parallel, nachdem `dist/` und `dist-runtime/` bereits gebaut wurden.

Android-CI führt sowohl `testPlayDebugUnitTest` als auch `testThirdPartyDebugUnitTest` aus und baut anschließend das Play-Debug-APK. Der Third-Party-Flavor hat kein separates Source Set oder Manifest; seine Unit-Test-Lane kompiliert den Flavor weiterhin mit den SMS-/Call-Log-`BuildConfig`-Flags, vermeidet aber bei jedem Android-relevanten Push einen doppelten Debug-APK-Paketierungsjob.

Der `check-dependencies`-Shard führt `pnpm deadcode:dependencies` (einen reinen Produktions-Knip-Durchlauf für Abhängigkeiten, gepinnt auf die neueste Knip-Version, wobei pnpm's Mindest-Release-Alter für die `dlx`-Installation deaktiviert ist) und `pnpm deadcode:unused-files` aus, das Knips Produktionsfunde ungenutzter Dateien mit `scripts/deadcode-unused-files.allowlist.mjs` vergleicht. Der Guard für ungenutzte Dateien schlägt fehl, wenn ein PR eine neue, nicht geprüfte ungenutzte Datei hinzufügt oder einen veralteten Allowlist-Eintrag zurücklässt, während absichtliche dynamische Plugin-, generierte, Build-, Live-Test- und Package-Bridge-Oberflächen erhalten bleiben, die Knip statisch nicht auflösen kann.

## Weiterleitung von ClawSweeper-Aktivität

`.github/workflows/clawsweeper-dispatch.yml` ist die zielseitige Bridge von OpenClaw-Repository-Aktivität zu ClawSweeper. Sie checkt keinen nicht vertrauenswürdigen Pull-Request-Code aus und führt ihn nicht aus. Der Workflow erstellt aus `CLAWSWEEPER_APP_PRIVATE_KEY` ein GitHub-App-Token und dispatcht dann kompakte `repository_dispatch`-Payloads an `openclaw/clawsweeper`.

Der Workflow hat vier Lanes:

- `clawsweeper_item` für exakte Issue- und Pull-Request-Review-Anfragen;
- `clawsweeper_comment` für explizite ClawSweeper-Befehle in Issue-Kommentaren;
- `clawsweeper_commit_review` für Review-Anfragen auf Commit-Ebene bei `main`-Pushes;
- `github_activity` für allgemeine GitHub-Aktivität, die der ClawSweeper-Agent inspizieren kann.

Die `github_activity`-Lane leitet nur normalisierte Metadaten weiter: Ereignistyp, Aktion, Akteur, Repository, Item-Nummer, URL, Titel, Status und kurze Auszüge für Kommentare oder Reviews, sofern vorhanden. Sie vermeidet absichtlich die Weiterleitung des vollständigen Webhook-Bodys. Der empfangende Workflow in `openclaw/clawsweeper` ist `.github/workflows/github-activity.yml`, der das normalisierte Ereignis an den OpenClaw Gateway-Hook für den ClawSweeper-Agent sendet.

Allgemeine Aktivität ist Beobachtung, keine standardmäßige Zustellung. Der ClawSweeper-Agent erhält das Discord-Ziel in seinem Prompt und sollte nur dann in `#clawsweeper` posten, wenn das Ereignis überraschend, handlungsrelevant, riskant oder betrieblich nützlich ist. Routinemäßige Öffnungen, Bearbeitungen, Bot-Rauschen, doppelte Webhook-Störungen und normaler Review-Traffic sollten zu `NO_REPLY` führen.

Behandeln Sie GitHub-Titel, Kommentare, Bodys, Review-Text, Branch-Namen und Commit-Nachrichten entlang dieses gesamten Pfads als nicht vertrauenswürdige Daten. Sie sind Eingaben für Zusammenfassung und Triage, keine Anweisungen für den Workflow oder die Agent-Runtime.

## Manuelle Dispatches

Manuelle CI-Dispatches führen denselben Job-Graphen wie die normale CI aus, erzwingen aber jede nicht auf Android beschränkte Lane: Linux-Node-Shards, gebündelte Plugin-Shards, Channel-Verträge, Node-22-Kompatibilität, `check`, `check-additional`, Build-Smoke, Dokumentationsprüfungen, Python-Skills, Windows, macOS und Control-UI-i18n. Eigenständige manuelle CI-Dispatches führen Android nur mit `include_android=true` aus; der vollständige Release-Umbrella aktiviert Android, indem er `include_android=true` übergibt. Statische Plugin-Prerelease-Prüfungen, der nur für Releases vorgesehene `agentic-plugins`-Shard, der vollständige Erweiterungs-Batch-Sweep und Plugin-Prerelease-Docker-Lanes sind von der CI ausgeschlossen. Die Docker-Prerelease-Suite läuft nur, wenn `Full Release Validation` den separaten `Plugin Prerelease`-Workflow mit aktivierter Release-Validation-Gate auslöst.

Manuelle Läufe verwenden eine eindeutige Nebenläufigkeitsgruppe, damit eine vollständige Release-Candidate-Suite nicht durch einen anderen Push- oder PR-Lauf auf demselben Ref abgebrochen wird. Die optionale Eingabe `target_ref` ermöglicht es einem vertrauenswürdigen Aufrufer, diesen Graphen gegen einen Branch, Tag oder vollständigen Commit-SHA auszuführen, während die Workflow-Datei aus dem ausgewählten Dispatch-Ref verwendet wird.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, schnelle Sicherheitsjobs und Aggregate (`security-scm-fast`, `security-dependency-audit`, `security-fast`), schnelle Protokoll-/Vertrags-/gebündelte Prüfungen, geshardete Channel-Vertragsprüfungen, `check`-Shards außer Lint, `check-additional`-Shards und Aggregate, Node-Test-Aggregatprüfer, Dokumentationsprüfungen, Python-Skills, Workflow-Sanity, Labeler, Auto-Response; Install-Smoke-Preflight verwendet ebenfalls GitHub-gehostetes Ubuntu, damit die Blacksmith-Matrix früher in die Warteschlange kommen kann |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, leichtere Erweiterungs-Shards, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` und `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, Build-Smoke, Linux-Node-Test-Shards, gebündelte Plugin-Test-Shards, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (CPU-empfindlich genug, dass 8 vCPU mehr kosteten, als sie einsparten); Install-Smoke-Docker-Builds (die Warteschlangenzeit mit 32 vCPU kostete mehr, als sie einsparten)                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` auf `openclaw/openclaw`; Forks fallen auf `macos-latest` zurück                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` auf `openclaw/openclaw`; Forks fallen auf `macos-latest` zurück                                                                                                                                                                                                                                                                                                                                                                                                 |

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

`OpenClaw Performance` ist der Performance-Workflow für Produkt und Runtime. Er läuft täglich auf `main` und kann manuell ausgelöst werden:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Manueller Dispatch benchmarked normalerweise den Workflow-Ref. Setzen Sie `target_ref`, um ein Release-Tag oder einen anderen Branch mit der aktuellen Workflow-Implementierung zu benchmarken. Veröffentlichte Berichtspfade und Latest-Zeiger werden nach dem getesteten Ref geschlüsselt, und jede `index.md` erfasst den getesteten Ref/SHA, Workflow-Ref/SHA, Kova-Ref, Profil, Lane-Auth-Modus, Modell, Wiederholungsanzahl und Szenariofilter.

Der Workflow installiert OCM aus einem gepinnten Release und Kova aus `openclaw/Kova` mit der gepinnten Eingabe `kova_ref` und führt dann drei Lanes aus:

- `mock-provider`: Kova-Diagnoseszenarien gegen eine lokal gebaute Runtime mit deterministischer gefälschter OpenAI-kompatibler Authentifizierung.
- `mock-deep-profile`: CPU-/Heap-/Trace-Profiling für Hotspots beim Start, Gateway und Agent-Turn.
- `live-gpt54`: ein echter OpenAI-`openai/gpt-5.4`-Agent-Turn, der übersprungen wird, wenn `OPENAI_API_KEY` nicht verfügbar ist.

Die Mock-Provider-Lane führt nach dem Kova-Durchlauf auch OpenClaw-native Quell-Probes aus: Gateway-Startzeit und Speicher über Standard-, Hook- und 50-Plugin-Startfälle hinweg; wiederholte Mock-OpenAI-`channel-chat-baseline`-Hello-Loops; und CLI-Startbefehle gegen das gestartete Gateway. Die Markdown-Zusammenfassung der Quell-Probes liegt unter `source/index.md` im Berichtsbundle, mit Roh-JSON daneben.

Jede Lane lädt GitHub-Artefakte hoch. Wenn `CLAWGRIT_REPORTS_TOKEN` konfiguriert ist, committet der Workflow außerdem `report.json`, `report.md`, Bundles, `index.md` und Quell-Probe-Artefakte nach `openclaw/clawgrit-reports` unter `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Der aktuelle Zeiger des getesteten Refs wird als `openclaw-performance/<tested-ref>/latest-<lane>.json` geschrieben.

## Vollständige Release-Validierung

`Full Release Validation` ist der manuelle Umbrella-Workflow für „alles vor dem Release ausführen“. Er akzeptiert einen Branch, ein Tag oder einen vollständigen Commit-SHA, löst den manuellen `CI`-Workflow mit diesem Ziel aus, löst `Plugin Prerelease` für nur im Release benötigte Plugin-/Paket-/Statik-/Docker-Nachweise aus und löst `OpenClaw Release Checks` für Install-Smoke, Paketakzeptanz, paketübergreifende Cross-OS-Prüfungen, QA-Lab-Parität, Matrix- und Telegram-Lanes aus. Stabile/Standardläufe belassen umfassende Live-/E2E- und Docker-Release-Pfad-Abdeckung hinter `run_release_soak=true`; `release_profile=full` erzwingt diese Soak-Abdeckung, damit breite Advisory-Validierung breit bleibt. Mit `rerun_group=all` und `release_profile=full` führt er außerdem `NPM Telegram Beta E2E` gegen das Artefakt `release-package-under-test` aus den Release-Prüfungen aus. Nach der Veröffentlichung übergeben Sie `npm_telegram_package_spec`, um dieselbe Telegram-Paket-Lane gegen das veröffentlichte npm-Paket erneut auszuführen.

Siehe [Vollständige Release-Validierung](/de/reference/full-release-validation) für die
Stage-Matrix, exakte Workflow-Jobnamen, Profilunterschiede, Artefakte und
fokussierte Rerun-Handles.

`OpenClaw Release Publish` ist der manuelle mutierende Release-Workflow. Lösen Sie ihn
von `release/YYYY.M.D` oder `main` aus, nachdem das Release-Tag existiert und nachdem der
OpenClaw-npm-Preflight erfolgreich war. Er verifiziert `pnpm plugins:sync:check`,
löst `Plugin NPM Release` für alle veröffentlichbaren Plugin-Pakete aus, löst
`Plugin ClawHub Release` für denselben Release-SHA aus und löst erst dann
`OpenClaw NPM Release` mit der gespeicherten `preflight_run_id` aus.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Für den Nachweis eines gepinnten Commits auf einem schnell fortschreitenden Branch verwenden Sie den Helper statt
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub-Workflow-Dispatch-Refs müssen Branches oder Tags sein, keine rohen Commit-SHAs. Der
Helper pusht einen temporären Branch `release-ci/<sha>-...` am Ziel-SHA,
löst `Full Release Validation` von diesem gepinnten Ref aus, verifiziert, dass jedes untergeordnete
Workflow-`headSha` dem Ziel entspricht, und löscht den temporären Branch, wenn der
Lauf abgeschlossen ist. Der Umbrella-Verifizierer schlägt außerdem fehl, wenn ein untergeordneter Workflow mit einem
anderen SHA lief.

`release_profile` steuert die an Release-Prüfungen übergebene Live-/Provider-Breite. Die
manuellen Release-Workflows verwenden standardmäßig `stable`; verwenden Sie `full` nur, wenn Sie
bewusst die breite informative Provider-/Medienmatrix wünschen. `run_release_soak`
steuert, ob stabile/standardmäßige Release-Prüfungen den umfassenden Live-/E2E- und
Docker-Release-Pfad-Soak ausführen; `full` erzwingt den Soak.

- `minimum` behält die schnellsten release-kritischen OpenAI-/Core-Lanes.
- `stable` fügt den stabilen Provider-/Backend-Satz hinzu.
- `full` führt die breite informative Provider-/Medienmatrix aus.

Der Umbrella zeichnet die ausgelösten untergeordneten Run-IDs auf, und der abschließende Job `Verify full validation` prüft die aktuellen Ergebnisse der untergeordneten Runs erneut und hängt Tabellen der langsamsten Jobs für jeden untergeordneten Run an. Wenn ein untergeordneter Workflow erneut ausgeführt wird und grün wird, führen Sie nur den übergeordneten Verifier-Job erneut aus, um das Umbrella-Ergebnis und die Timing-Zusammenfassung zu aktualisieren.

Für die Wiederherstellung akzeptieren sowohl `Full Release Validation` als auch `OpenClaw Release Checks` `rerun_group`. Verwenden Sie `all` für einen Release Candidate, `ci` nur für das normale untergeordnete vollständige CI, `plugin-prerelease` nur für das untergeordnete Plugin-Prerelease, `release-checks` für jedes untergeordnete Release, oder eine engere Gruppe: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` oder `npm-telegram` im Umbrella. Dadurch bleibt die erneute Ausführung einer fehlgeschlagenen Release-Box nach einem gezielten Fix begrenzt. Für eine fehlgeschlagene Cross-OS-Lane kombinieren Sie `rerun_group=cross-os` mit `cross_os_suite_filter`, zum Beispiel `windows/packaged-upgrade`; lange Cross-OS-Befehle geben Heartbeat-Zeilen aus, und packaged-upgrade-Zusammenfassungen enthalten Timings pro Phase. QA-Release-Check-Lanes sind informativ, daher warnen reine QA-Fehler, blockieren den Release-Check-Verifier aber nicht.

`OpenClaw Release Checks` verwendet die vertrauenswürdige Workflow-Ref, um die ausgewählte Ref einmal in ein `release-package-under-test`-Tarball aufzulösen, und übergibt dieses Artefakt dann an Cross-OS-Prüfungen und Package Acceptance sowie an den Live-/E2E-Release-Pfad-Docker-Workflow, wenn Soak-Abdeckung ausgeführt wird. Dadurch bleiben die Paket-Bytes über Release-Boxen hinweg konsistent und dasselbe Candidate-Paket wird nicht in mehreren untergeordneten Jobs neu gepackt.

Doppelte `Full Release Validation`-Runs für `ref=main` und `rerun_group=all`
ersetzen den älteren Umbrella. Der übergeordnete Monitor bricht jeden untergeordneten Workflow ab, den
er bereits ausgelöst hat, wenn der übergeordnete abgebrochen wird, sodass eine neuere main-Validierung
nicht hinter einem veralteten zweistündigen Release-Check-Run wartet. Release-Branch-/Tag-
Validierung und gezielte Rerun-Gruppen behalten `cancel-in-progress: false` bei.

## Live- und E2E-Shards

Das untergeordnete Release-Live-/E2E behält die breite native `pnpm test:live`-Abdeckung bei, führt sie aber als benannte Shards über `scripts/test-live-shard.mjs` statt als einen seriellen Job aus:

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

Die nativen Live-Medien-Shards laufen in `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, gebaut vom Workflow `Live Media Runner Image`. Dieses Image installiert `ffmpeg` und `ffprobe` vor; Medienjobs prüfen die Binärdateien vor dem Setup nur noch. Lassen Sie Docker-gestützte Live-Suiten auf normalen Blacksmith-Runnern; Container-Jobs sind der falsche Ort, um verschachtelte Docker-Tests zu starten.

Docker-gestützte Live-Modell-/Backend-Shards verwenden ein separates gemeinsames Image `ghcr.io/openclaw/openclaw-live-test:<sha>` pro ausgewähltem Commit. Der Live-Release-Workflow baut und veröffentlicht dieses Image einmal, dann laufen die Docker-Live-Modell-, Provider-geshardeten Gateway-, CLI-Backend-, ACP-Bind- und Codex-Harness-Shards mit `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gateway-Docker-Shards tragen explizite Time-out-Grenzen auf Skriptebene unterhalb des Workflow-Job-Time-outs, sodass ein hängender Container oder Cleanup-Pfad schnell fehlschlägt, statt das gesamte Release-Check-Budget zu verbrauchen. Wenn diese Shards das vollständige Source-Docker-Target unabhängig neu bauen, ist der Release-Run falsch konfiguriert und verschwendet Laufzeit mit doppelten Image-Builds.

## Paketakzeptanz

Verwenden Sie `Package Acceptance`, wenn die Frage lautet: „Funktioniert dieses installierbare OpenClaw-Paket als Produkt?“ Sie unterscheidet sich von normalem CI: Normales CI validiert den Quellbaum, während Package Acceptance ein einzelnes Tarball über denselben Docker-E2E-Harness validiert, den Benutzer nach der Installation oder einem Update ausüben.

### Jobs

1. `resolve_package` checkt `workflow_ref` aus, löst einen Paket-Candidate auf, schreibt `.artifacts/docker-e2e-package/openclaw-current.tgz`, schreibt `.artifacts/docker-e2e-package/package-candidate.json`, lädt beide als Artefakt `package-under-test` hoch und gibt Quelle, Workflow-Ref, Paket-Ref, Version, SHA-256 und Profil in der GitHub-Schrittzusammenfassung aus.
2. `docker_acceptance` ruft `openclaw-live-and-e2e-checks-reusable.yml` mit `ref=workflow_ref` und `package_artifact_name=package-under-test` auf. Der wiederverwendbare Workflow lädt dieses Artefakt herunter, validiert das Tarball-Inventar, bereitet bei Bedarf Paket-Digest-Docker-Images vor und führt die ausgewählten Docker-Lanes gegen dieses Paket aus, statt den Workflow-Checkout zu packen. Wenn ein Profil mehrere gezielte `docker_lanes` auswählt, bereitet der wiederverwendbare Workflow das Paket und die gemeinsamen Images einmal vor und fächert diese Lanes dann als parallele gezielte Docker-Jobs mit eindeutigen Artefakten auf.
3. `package_telegram` ruft optional `NPM Telegram Beta E2E` auf. Es läuft, wenn `telegram_mode` nicht `none` ist, und installiert dasselbe Artefakt `package-under-test`, wenn Package Acceptance eines aufgelöst hat; eigenständige Telegram-Dispatches können weiterhin eine veröffentlichte npm-Spezifikation installieren.
4. `summary` lässt den Workflow fehlschlagen, wenn Paketauflösung, Docker-Akzeptanz oder die optionale Telegram-Lane fehlgeschlagen sind.

### Candidate-Quellen

- `source=npm` akzeptiert nur `openclaw@beta`, `openclaw@latest` oder eine exakte OpenClaw-Release-Version wie `openclaw@2026.4.27-beta.2`. Verwenden Sie dies für veröffentlichte Prerelease-/Stable-Akzeptanz.
- `source=ref` packt einen vertrauenswürdigen Branch, Tag oder vollständigen Commit-SHA aus `package_ref`. Der Resolver holt OpenClaw-Branches/-Tags, verifiziert, dass der ausgewählte Commit aus der Branch-Historie des Repositorys oder einem Release-Tag erreichbar ist, installiert Abhängigkeiten in einem detached Worktree und packt ihn mit `scripts/package-openclaw-for-docker.mjs`.
- `source=url` lädt ein HTTPS-`.tgz` herunter; `package_sha256` ist erforderlich.
- `source=artifact` lädt ein `.tgz` aus `artifact_run_id` und `artifact_name` herunter; `package_sha256` ist optional, sollte aber für extern geteilte Artefakte angegeben werden.

Halten Sie `workflow_ref` und `package_ref` getrennt. `workflow_ref` ist der vertrauenswürdige Workflow-/Harness-Code, der den Test ausführt. `package_ref` ist der Quell-Commit, der gepackt wird, wenn `source=ref` gilt. Dadurch kann der aktuelle Test-Harness ältere vertrauenswürdige Quell-Commits validieren, ohne alte Workflow-Logik auszuführen.

### Suite-Profile

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — vollständige Docker-Release-Pfad-Chunks mit OpenWebUI
- `custom` — exakte `docker_lanes`; erforderlich, wenn `suite_profile=custom`

Das Profil `package` verwendet Offline-Plugin-Abdeckung, sodass die Validierung veröffentlichter Pakete nicht von der Live-Verfügbarkeit von ClawHub abhängt. Die optionale Telegram-Lane verwendet das Artefakt `package-under-test` in `NPM Telegram Beta E2E` wieder; der veröffentlichte npm-Spezifikationspfad bleibt für eigenständige Dispatches erhalten.

Die dedizierte Richtlinie für Update- und Plugin-Tests, einschließlich lokaler Befehle,
Docker-Lanes, Package Acceptance-Eingaben, Release-Standards und Fehlertriage,
finden Sie unter [Updates und Plugins testen](/de/help/testing-updates-plugins).

Release-Prüfungen rufen Package Acceptance mit `source=artifact`, dem vorbereiteten Release-Paketartefakt, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'` und `telegram_mode=mock-openai` auf. Dadurch bleiben Paketmigration, Update, Bereinigung veralteter Plugin-Abhängigkeiten, Reparatur konfigurierter Plugin-Installationen, Offline-Plugin, Plugin-Update und Telegram-Nachweis auf demselben aufgelösten Paket-Tarball. Setzen Sie `package_acceptance_package_spec` bei Full Release Validation oder OpenClaw Release Checks, um dieselbe Matrix gegen ein ausgeliefertes npm-Paket statt gegen das aus dem SHA gebaute Artefakt auszuführen. Cross-OS-Release-Prüfungen decken weiterhin OS-spezifisches Onboarding, Installer- und Plattformverhalten ab; die Produktvalidierung für Paket/Update sollte mit Package Acceptance beginnen. Die Docker-Lane `published-upgrade-survivor` validiert im blockierenden Release-Pfad pro Run eine veröffentlichte Paketbaseline. In Package Acceptance ist das aufgelöste Tarball `package-under-test` immer der Candidate, und `published_upgrade_survivor_baseline` wählt die veröffentlichte Fallback-Baseline aus, standardmäßig `openclaw@latest`; Befehle zur erneuten Ausführung fehlgeschlagener Lanes behalten diese Baseline bei. Full Release Validation mit `run_release_soak=true` oder `release_profile=full` setzt `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` und `published_upgrade_survivor_scenarios=reported-issues`, um auf die vier neuesten stabilen npm-Releases plus festgelegte Grenz-Releases für Plugin-Kompatibilität und issue-förmige Fixtures für Feishu-Konfiguration, beibehaltene Bootstrap-/Persona-Dateien, konfigurierte OpenClaw-Plugin-Installationen, Tilde-Logpfade und veraltete Legacy-Plugin-Abhängigkeitswurzeln zu erweitern. Multi-Baseline-Auswahlen von published-upgrade survivor werden nach Baseline in separate gezielte Docker-Runner-Jobs geshardet. Der separate Workflow `Update Migration` verwendet die Docker-Lane `update-migration` mit `all-since-2026.4.23` und `plugin-deps-cleanup`, wenn die Frage umfassende Bereinigung veröffentlichter Updates ist, nicht normale Full-Release-CI-Breite. Lokale aggregierte Runs können exakte Paketspezifikationen mit `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` übergeben, mit `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` eine einzelne Lane wie `openclaw@2026.4.15` beibehalten oder `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` für die Szenariomatrix setzen. Die veröffentlichte Lane konfiguriert die Baseline mit einem eingebauten `openclaw config set`-Befehlsrezept, zeichnet Rezeptschritte in `summary.json` auf und prüft `/healthz`, `/readyz` sowie den RPC-Status nach dem Start des Gateway. Die frischen Windows-Packaged- und Installer-Lanes prüfen außerdem, dass ein installiertes Paket ein Browser-Control-Override von einem rohen absoluten Windows-Pfad importieren kann. Der OpenAI-Cross-OS-Agent-Turn-Smoke verwendet standardmäßig `OPENCLAW_CROSS_OS_OPENAI_MODEL`, wenn gesetzt, andernfalls `openai/gpt-5.4`, sodass der Installations- und Gateway-Nachweis auf einem GPT-5-Testmodell bleibt und GPT-4.x-Standards vermieden werden.

### Legacy-Kompatibilitätsfenster

Package Acceptance hat begrenzte Legacy-Kompatibilitätsfenster für bereits veröffentlichte Pakete. Pakete bis einschließlich `2026.4.25`, einschließlich `2026.4.25-beta.*`, können den Kompatibilitätspfad verwenden:

- bekannte private QA-Einträge in `dist/postinstall-inventory.json` können auf Dateien verweisen, die im Tarball ausgelassen wurden;
- `doctor-switch` kann den Unterfall für die Persistenz von `gateway install --wrapper` überspringen, wenn das Paket dieses Flag nicht bereitstellt;
- `update-channel-switch` kann fehlende `pnpm.patchedDependencies` aus dem aus dem Tarball abgeleiteten gefälschten Git-Fixture entfernen und fehlende persistierte `update.channel` protokollieren;
- Plugin-Smokes können Legacy-Speicherorte für Installationsdatensätze lesen oder fehlende Marketplace-Installationsdatensatz-Persistenz akzeptieren;
- `plugin-update` kann die Migration von Konfigurationsmetadaten zulassen, während weiterhin verlangt wird, dass Installationsdatensatz und No-Reinstall-Verhalten unverändert bleiben.

Das veröffentlichte Paket `2026.4.26` kann auch bei lokalen Build-Metadaten-Stempeldateien warnen, die bereits ausgeliefert wurden. Spätere Pakete müssen die modernen Verträge erfüllen; dieselben Bedingungen schlagen dann fehl, statt zu warnen oder übersprungen zu werden.

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

Wenn Sie einen fehlgeschlagenen Package-Acceptance-Lauf debuggen, beginnen Sie mit der Zusammenfassung `resolve_package`, um Paketquelle, Version und SHA-256 zu bestätigen. Prüfen Sie dann den untergeordneten Lauf `docker_acceptance` und dessen Docker-Artefakte: `.artifacts/docker-tests/**/summary.json`, `failures.json`, Lane-Protokolle, Phasen-Timings und Befehle zum erneuten Ausführen. Führen Sie bevorzugt das fehlgeschlagene Paketprofil oder die exakten Docker-Lanes erneut aus, statt die vollständige Release-Validierung erneut zu starten.

## Install-Smoke

Der separate Workflow `Install Smoke` verwendet dasselbe Scope-Skript über seinen eigenen Job `preflight` wieder. Er teilt die Smoke-Abdeckung in `run_fast_install_smoke` und `run_full_install_smoke` auf.

- **Schneller Pfad** läuft für Pull Requests, die Docker-/Paket-Oberflächen, Änderungen an Paket/Manifest gebündelter Plugins oder Core-Plugin-/Channel-/Gateway-/Plugin-SDK-Oberflächen berühren, welche die Docker-Smoke-Jobs ausführen. Reine Quelländerungen an gebündelten Plugins, reine Teständerungen und reine Dokuänderungen reservieren keine Docker-Worker. Der schnelle Pfad baut das Root-Dockerfile-Image einmal, prüft die CLI, führt den CLI-Smoke für `agents delete shared-workspace` aus, führt den Container-Gateway-Network-E2E aus, verifiziert ein Build-Argument für gebündelte Erweiterungen und führt das begrenzte Docker-Profil für gebündelte Plugins unter einem aggregierten Befehls-Timeout von 240 Sekunden aus (jeder Docker-Lauf eines Szenarios ist separat begrenzt).
- **Vollständiger Pfad** behält QR-Paketinstallation sowie Installer-Docker-/Update-Abdeckung für nächtlich geplante Läufe, manuelle Dispatches, Workflow-Call-Release-Prüfungen und Pull Requests bei, die tatsächlich Installer-/Paket-/Docker-Oberflächen berühren. Im vollständigen Modus bereitet install-smoke ein GHCR-Root-Dockerfile-Smoke-Image für den Ziel-SHA vor oder verwendet eines wieder und führt dann QR-Paketinstallation, Root-Dockerfile-/Gateway-Smokes, Installer-/Update-Smokes und den schnellen Docker-E2E für gebündelte Plugins als separate Jobs aus, damit Installer-Arbeit nicht hinter den Root-Image-Smokes warten muss.

`main`-Pushes (einschließlich Merge-Commits) erzwingen den vollständigen Pfad nicht; wenn die Changed-Scope-Logik bei einem Push vollständige Abdeckung anfordern würde, behält der Workflow den schnellen Docker-Smoke bei und überlässt den vollständigen Install-Smoke der nächtlichen oder Release-Validierung.

Der langsame Bun-Global-Install-Smoke für Image-Provider wird separat durch `run_bun_global_install_smoke` gesteuert. Er läuft nach nächtlichem Zeitplan und aus dem Release-Checks-Workflow, und manuelle Dispatches von `Install Smoke` können ihn aktivieren, aber Pull Requests und `main`-Pushes tun das nicht. QR- und Installer-Docker-Tests behalten ihre eigenen install-fokussierten Dockerfiles.

## Lokaler Docker-E2E

`pnpm test:docker:all` baut ein gemeinsames Live-Test-Image vorab, packt OpenClaw einmal als npm-Tarball und baut zwei gemeinsame Images aus `scripts/e2e/Dockerfile`:

- einen einfachen Node-/Git-Runner für Installer-/Update-/Plugin-Abhängigkeits-Lanes;
- ein funktionales Image, das denselben Tarball für normale Funktionalitäts-Lanes in `/app` installiert.

Docker-Lane-Definitionen liegen in `scripts/lib/docker-e2e-scenarios.mjs`, die Planner-Logik liegt in `scripts/lib/docker-e2e-plan.mjs`, und der Runner führt nur den ausgewählten Plan aus. Der Scheduler wählt das Image pro Lane mit `OPENCLAW_DOCKER_E2E_BARE_IMAGE` und `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` aus und führt Lanes dann mit `OPENCLAW_SKIP_DOCKER_BUILD=1` aus.

### Anpassbare Parameter

| Variable                               | Standard | Zweck                                                                                         |
| -------------------------------------- | -------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10       | Slot-Anzahl des Haupt-Pools für normale Lanes.                                                |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10       | Slot-Anzahl des Provider-sensitiven Tail-Pools.                                               |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9        | Limit für parallele Live-Lanes, damit Provider nicht drosseln.                                |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10       | Limit für parallele npm-Install-Lanes.                                                        |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7        | Limit für parallele Multi-Service-Lanes.                                                      |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000     | Staffelung zwischen Lane-Starts, um Docker-Daemon-Erstellungsstürme zu vermeiden; setzen Sie `0` für keine Staffelung. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000  | Fallback-Timeout pro Lane (120 Minuten); ausgewählte Live-/Tail-Lanes verwenden strengere Grenzen. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset    | `1` gibt den Scheduler-Plan aus, ohne Lanes auszuführen.                                      |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset    | Kommagetrennte Liste exakter Lanes; überspringt Cleanup-Smoke, damit Agents eine fehlgeschlagene Lane reproduzieren können. |

Eine Lane, die schwerer ist als ihre effektive Grenze, kann weiterhin aus einem leeren Pool starten und läuft dann allein, bis sie Kapazität freigibt. Die lokale aggregierte Ausführung prüft Docker vorab, entfernt veraltete OpenClaw-E2E-Container, gibt den Status aktiver Lanes aus, persistiert Lane-Timings für eine längste-zuerst-Reihenfolge und stoppt standardmäßig nach dem ersten Fehler die Einplanung neuer gepoolter Lanes.

### Wiederverwendbarer Live-/E2E-Workflow

Der wiederverwendbare Live-/E2E-Workflow fragt `scripts/test-docker-all.mjs --plan-json`, welches Paket, welche Image-Art, welches Live-Image, welche Lane und welche Credential-Abdeckung erforderlich sind. `scripts/docker-e2e.mjs` wandelt diesen Plan dann in GitHub-Ausgaben und Zusammenfassungen um. Es packt OpenClaw entweder über `scripts/package-openclaw-for-docker.mjs`, lädt ein Paketartefakt aus dem aktuellen Lauf herunter oder lädt ein Paketartefakt aus `package_artifact_run_id` herunter; validiert das Tarball-Inventar; baut und pusht paket-digest-getaggte Bare-/Functional-GHCR-Docker-E2E-Images über Blacksmiths Docker-Layer-Cache, wenn der Plan Lanes mit installiertem Paket benötigt; und verwendet angegebene Eingaben `docker_e2e_bare_image`/`docker_e2e_functional_image` oder vorhandene Paket-Digest-Images wieder, statt neu zu bauen. Docker-Image-Pulls werden mit einem begrenzten Timeout von 180 Sekunden pro Versuch erneut versucht, damit ein blockierter Registry-/Cache-Stream schnell wiederholt wird, statt den Großteil des kritischen CI-Pfads zu verbrauchen.

### Release-Pfad-Chunks

Release-Docker-Abdeckung läuft in kleineren, in Chunks aufgeteilten Jobs mit `OPENCLAW_SKIP_DOCKER_BUILD=1`, sodass jeder Chunk nur die Image-Art pullt, die er benötigt, und mehrere Lanes über denselben gewichteten Scheduler ausführt:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Aktuelle Release-Docker-Chunks sind `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` und `plugins-runtime-install-a` bis `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` und `plugins-integrations` bleiben aggregierte Plugin-/Runtime-Aliasse. Der Lane-Alias `install-e2e` bleibt der aggregierte manuelle Rerun-Alias für beide Provider-Installer-Lanes.

OpenWebUI wird in `plugins-runtime-services` integriert, wenn vollständige Release-Pfad-Abdeckung es anfordert, und behält nur für OpenWebUI-only-Dispatches einen eigenständigen Chunk `openwebui`. Update-Lanes für gebündelte Channels wiederholen bei vorübergehenden npm-Netzwerkfehlern einmal.

Jeder Chunk lädt `.artifacts/docker-tests/` mit Lane-Protokollen, Timings, `summary.json`, `failures.json`, Phasen-Timings, Scheduler-Plan-JSON, Tabellen langsamer Lanes und Rerun-Befehlen pro Lane hoch. Die Workflow-Eingabe `docker_lanes` führt ausgewählte Lanes gegen die vorbereiteten Images aus statt die Chunk-Jobs, wodurch Debugging fehlgeschlagener Lanes auf einen gezielten Docker-Job begrenzt bleibt und das Paketartefakt für diesen Lauf vorbereitet, heruntergeladen oder wiederverwendet wird; wenn eine ausgewählte Lane eine Live-Docker-Lane ist, baut der gezielte Job das Live-Test-Image für diesen Rerun lokal. Generierte GitHub-Rerun-Befehle pro Lane enthalten `package_artifact_run_id`, `package_artifact_name` und vorbereitete Image-Eingaben, wenn diese Werte existieren, sodass eine fehlgeschlagene Lane exakt dasselbe Paket und dieselben Images aus dem fehlgeschlagenen Lauf wiederverwenden kann.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Der geplante Live-/E2E-Workflow führt täglich die vollständige Release-Pfad-Docker-Suite aus.

## Plugin-Prerelease

`Plugin Prerelease` ist aufwendigere Produkt-/Paket-Abdeckung und daher ein separater Workflow, der von `Full Release Validation` oder durch einen expliziten Operator ausgelöst wird. Normale Pull Requests, `main`-Pushes und eigenständige manuelle CI-Dispatches lassen diese Suite deaktiviert. Er balanciert Tests gebündelter Plugins über acht Erweiterungs-Worker; diese Erweiterungs-Shard-Jobs führen bis zu zwei Plugin-Konfigurationsgruppen gleichzeitig mit einem Vitest-Worker pro Gruppe und einem größeren Node-Heap aus, damit importlastige Plugin-Batches keine zusätzlichen CI-Jobs erzeugen. Der reine Release-Docker-Prerelease-Pfad bündelt gezielte Docker-Lanes in kleinen Gruppen, um nicht Dutzende Runner für Jobs von ein bis drei Minuten zu reservieren.

## QA Lab

QA Lab hat dedizierte CI-Lanes außerhalb des hauptsächlichen smart-gescopten Workflows. Agentic Parity ist unter den breiten QA- und Release-Harnesses verschachtelt, kein eigenständiger PR-Workflow. Verwenden Sie `Full Release Validation` mit `rerun_group=qa-parity`, wenn Parity Teil eines breiten Validierungslaufs sein soll.

- Der Workflow `QA-Lab - All Lanes` läuft nächtlich auf `main` und bei manuellem Dispatch; er fächert die Mock-Parity-Lane, die Live-Matrix-Lane sowie die Live-Telegram- und Live-Discord-Lanes als parallele Jobs auf. Live-Jobs verwenden die Umgebung `qa-live-shared`, und Telegram/Discord verwenden Convex-Leases.

Release-Prüfungen führen Matrix- und Telegram-Live-Transport-Lanes mit dem deterministischen Mock-Provider und mock-qualifizierten Modellen (`mock-openai/gpt-5.5` und `mock-openai/gpt-5.5-alt`) aus, sodass der Channel-Vertrag von Live-Modell-Latenz und normalem Start von Provider-Plugins isoliert ist. Das Live-Transport-Gateway deaktiviert Speichersuche, weil QA-Parity das Speicherverhalten separat abdeckt; Provider-Konnektivität wird durch die separaten Live-Model-, Native-Provider- und Docker-Provider-Suites abgedeckt.

Matrix verwendet `--profile fast` für geplante und Release-Gates und fügt `--fail-fast` nur hinzu, wenn die ausgecheckte CLI dies unterstützt. Der CLI-Standard und die manuelle Workflow-Eingabe bleiben `all`; ein manueller Dispatch mit `matrix_profile=all` shardet die vollständige Matrix-Abdeckung immer in die Jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` und `e2ee-cli`.

`OpenClaw Release Checks` führt auch die release-kritischen QA-Lab-Lanes vor der Release-Freigabe aus; sein QA-Parity-Gate führt die Candidate- und Baseline-Packs als parallele Lane-Jobs aus und lädt anschließend beide Artefakte in einen kleinen Berichtsjob für den finalen Parity-Vergleich herunter.

Bei normalen PRs folgen Sie den bereichsbezogenen CI-/Prüfnachweisen, statt Parität als erforderlichen Status zu behandeln.

## CodeQL

Der `CodeQL`-Workflow ist bewusst ein enger Sicherheitsscan im ersten Durchlauf, kein vollständiger Repository-Sweep. Tägliche, manuelle und Guard-Ausführungen für nicht als Entwurf markierte Pull Requests scannen Actions-Workflow-Code sowie die JavaScript-/TypeScript-Bereiche mit dem höchsten Risiko mit hochverlässlichen Sicherheitsabfragen, gefiltert auf hohe/kritische `security-severity`.

Der Pull-Request-Guard bleibt leichtgewichtig: Er startet nur bei Änderungen unter `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` oder `src` und führt dieselbe hochverlässliche Sicherheitsmatrix wie der geplante Workflow aus. Android- und macOS-CodeQL bleiben außerhalb der PR-Standards.

### Sicherheitskategorien

| Kategorie                                         | Bereich                                                                                                                              |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `/codeql-security-high/core-auth-secrets`         | Auth, Geheimnisse, Sandbox, Cron und Gateway-Basis                                                                                    |
| `/codeql-security-high/channel-runtime-boundary`  | Core-Channel-Implementierungsverträge plus Channel-Plugin-Runtime, Gateway, Plugin SDK, Geheimnisse, Audit-Berührungspunkte          |
| `/codeql-security-high/network-ssrf-boundary`     | Core-SSRF, IP-Parsing, Network-Guard, Web-Fetch und SSRF-Policy-Bereiche des Plugin SDK                                              |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP-Server, Hilfsfunktionen für Prozessausführung, ausgehende Zustellung und Gates für Agent-Toolausführung                          |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin-Installation, Loader, Manifest, Registry, Package-Manager-Installation, Source-Loading und Vertrauensbereiche des Plugin-SDK-Package-Vertrags |

### Plattformspezifische Sicherheits-Shards

- `CodeQL Android Critical Security` — geplanter Android-Sicherheits-Shard. Baut die Android-App manuell für CodeQL auf dem kleinsten Blacksmith-Linux-Runner, den Workflow-Sanity akzeptiert. Lädt unter `/codeql-critical-security/android` hoch.
- `CodeQL macOS Critical Security` — wöchentlicher/manueller macOS-Sicherheits-Shard. Baut die macOS-App manuell für CodeQL auf Blacksmith macOS, filtert Ergebnisse aus Dependency-Builds aus dem hochgeladenen SARIF heraus und lädt unter `/codeql-critical-security/macos` hoch. Bleibt außerhalb der täglichen Standards, weil der macOS-Build die Laufzeit dominiert, selbst wenn er sauber ist.

### Critical-Quality-Kategorien

`CodeQL Critical Quality` ist der passende Nicht-Sicherheits-Shard. Er führt nur JavaScript-/TypeScript-Qualitätsabfragen mit Fehler-Schweregrad und ohne Sicherheitsbezug über enge, hochwertige Bereiche auf dem kleineren Blacksmith-Linux-Runner aus. Sein Pull-Request-Guard ist bewusst kleiner als das geplante Profil: Nicht-Entwurfs-PRs führen nur die passenden Shards `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` und `plugin-sdk-reply-runtime` für Agent-Befehls-/Modell-/Toolausführung und Antwort-Dispatch-Code, Config-Schema-/Migrations-/IO-Code, Auth-/Geheimnis-/Sandbox-/Sicherheitscode, Core-Channel und gebündelte Channel-Plugin-Runtime, Gateway-Protokoll/Servermethode, Memory-Runtime/SDK-Verknüpfung, MCP/Prozess/ausgehende Zustellung, Provider-Runtime/Modellkatalog, Sitzungsdiagnose/Zustellungswarteschlangen, Plugin-Loader, Plugin-SDK/Package-Vertrag oder Änderungen an der Plugin-SDK-Antwort-Runtime aus. Änderungen an CodeQL-Config und Quality-Workflow führen alle zwölf PR-Quality-Shards aus.

Manueller Dispatch akzeptiert:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Die engen Profile sind Lehr-/Iterations-Hooks, um einen Quality-Shard isoliert auszuführen.

| Kategorie                                               | Bereich                                                                                                                                                              |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Auth, Geheimnisse, Sandbox, Cron und Code der Gateway-Sicherheitsgrenze                                                                                              |
| `/codeql-critical-quality/config-boundary`              | Config-Schema-, Migrations-, Normalisierungs- und IO-Verträge                                                                                                        |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway-Protokollschemata und Servermethodenverträge                                                                                                                 |
| `/codeql-critical-quality/channel-runtime-boundary`     | Core-Channel- und gebündelte Channel-Plugin-Implementierungsverträge                                                                                                 |
| `/codeql-critical-quality/agent-runtime-boundary`       | Befehlsausführung, Modell-/Provider-Dispatch, Auto-Reply-Dispatch und Warteschlangen sowie Runtime-Verträge der ACP-Control-Plane                                    |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP-Server und Tool-Bridges, Hilfsfunktionen zur Prozessüberwachung und Verträge für ausgehende Zustellung                                                           |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory-Host-SDK, Memory-Runtime-Fassaden, Memory-Plugin-SDK-Aliasse, Verknüpfung zur Memory-Runtime-Aktivierung und Memory-Doctor-Befehle                            |
| `/codeql-critical-quality/session-diagnostics-boundary` | Interna der Antwortwarteschlange, Sitzungszustellungswarteschlangen, Hilfsfunktionen für ausgehende Sitzungsbindung/-zustellung, Diagnoseereignis-/Log-Bundle-Bereiche und Session-Doctor-CLI-Verträge |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Eingehender Antwort-Dispatch des Plugin SDK, Hilfsfunktionen für Antwort-Payload/Chunking/Runtime, Channel-Antwortoptionen, Zustellungswarteschlangen und Hilfsfunktionen für Sitzungs-/Thread-Bindung |
| `/codeql-critical-quality/provider-runtime-boundary`    | Modellkatalog-Normalisierung, Provider-Auth und -Discovery, Provider-Runtime-Registrierung, Provider-Standards/-Kataloge und Web-/Search-/Fetch-/Embedding-Registries |
| `/codeql-critical-quality/ui-control-plane`             | Control-UI-Bootstrap, lokale Persistenz, Gateway-Control-Flows und Runtime-Verträge der Task-Control-Plane                                                           |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Core-Web-Fetch/Search, Medien-IO, Medienverständnis, Bildgenerierung und Runtime-Verträge für Mediengenerierung                                                      |
| `/codeql-critical-quality/plugin-boundary`              | Loader-, Registry-, Public-Surface- und Plugin-SDK-Entrypoint-Verträge                                                                                               |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Veröffentlichter package-seitiger Plugin-SDK-Quellcode und Hilfsfunktionen für Plugin-Package-Verträge                                                              |

Quality bleibt von Security getrennt, damit Quality-Funde geplant, gemessen, deaktiviert oder erweitert werden können, ohne das Sicherheitssignal zu verdecken. Die CodeQL-Erweiterung für Swift, Python und gebündelte Plugins sollte erst wieder als bereichsbezogene oder geshardete Folgearbeit hinzugefügt werden, nachdem die engen Profile stabile Laufzeit und stabile Signale haben.

## Wartungs-Workflows

### Docs Agent

Der `Docs Agent`-Workflow ist eine ereignisgesteuerte Codex-Wartungsspur, um vorhandene Docs an kürzlich gelandete Änderungen anzupassen. Er hat keinen reinen Zeitplan: Ein erfolgreicher Nicht-Bot-Push-CI-Lauf auf `main` kann ihn auslösen, und manueller Dispatch kann ihn direkt ausführen. Workflow-Run-Aufrufe werden übersprungen, wenn `main` weitergezogen ist oder wenn in der letzten Stunde ein anderer nicht übersprungener Docs-Agent-Lauf erstellt wurde. Wenn er läuft, prüft er den Commit-Bereich vom vorherigen nicht übersprungenen Docs-Agent-Quell-SHA bis zum aktuellen `main`, sodass ein stündlicher Lauf alle Änderungen auf main seit dem letzten Docs-Durchlauf abdecken kann.

### Test Performance Agent

Der `Test Performance Agent`-Workflow ist eine ereignisgesteuerte Codex-Wartungsspur für langsame Tests. Er hat keinen reinen Zeitplan: Ein erfolgreicher Nicht-Bot-Push-CI-Lauf auf `main` kann ihn auslösen, aber er wird übersprungen, wenn an diesem UTC-Tag bereits ein anderer Workflow-Run-Aufruf lief oder läuft. Manueller Dispatch umgeht dieses tägliche Aktivitäts-Gate. Die Spur erstellt einen gruppierten Vitest-Performance-Bericht für die vollständige Suite, lässt Codex nur kleine, Coverage-erhaltende Test-Performance-Fixes statt breiter Refactorings vornehmen, führt den vollständigen Suite-Bericht danach erneut aus und weist Änderungen zurück, die die Baseline-Anzahl bestandener Tests reduzieren. Wenn die Baseline fehlgeschlagene Tests enthält, darf Codex nur offensichtliche Fehler beheben, und der Full-Suite-Bericht nach dem Agent muss bestehen, bevor etwas committet wird. Wenn `main` vor dem Bot-Push voranschreitet, rebasiert die Spur den validierten Patch, führt `pnpm check:changed` erneut aus und versucht den Push erneut; widersprüchliche veraltete Patches werden übersprungen. Sie verwendet GitHub-gehostetes Ubuntu, damit die Codex-Action dieselbe Drop-Sudo-Sicherheitsausrichtung wie der Docs Agent beibehalten kann.

### Doppelte PRs nach dem Merge

Der `Duplicate PRs After Merge`-Workflow ist ein manueller Maintainer-Workflow zur Duplikatbereinigung nach dem Landen. Er ist standardmäßig ein Dry-Run und schließt nur explizit aufgelistete PRs, wenn `apply=true` gesetzt ist. Bevor GitHub mutiert wird, prüft er, dass der gelandete PR gemergt ist und dass jedes Duplikat entweder ein gemeinsam referenziertes Issue oder überlappende geänderte Hunks hat.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Lokale Check-Gates und Changed-Routing

Die lokale Changed-Lane-Logik befindet sich in `scripts/changed-lanes.mjs` und wird von `scripts/check-changed.mjs` ausgeführt. Dieses lokale Check-Gate ist bei Architekturgrenzen strenger als der breite CI-Plattformbereich:

- Core-Produktionsänderungen führen Core-Prod- und Core-Test-Typecheck plus Core-Lint/Guards aus;
- reine Core-Teständerungen führen nur Core-Test-Typecheck plus Core-Lint aus;
- Extension-Produktionsänderungen führen Extension-Prod- und Extension-Test-Typecheck plus Extension-Lint aus;
- reine Extension-Teständerungen führen Extension-Test-Typecheck plus Extension-Lint aus;
- öffentliche Plugin-SDK- oder Plugin-Contract-Änderungen erweitern auf Extension-Typecheck, weil Extensions von diesen Core-Verträgen abhängen (Vitest-Extension-Sweeps bleiben explizite Testarbeit);
- reine Release-Metadaten-Versions-Bumps führen gezielte Versions-/Config-/Root-Dependency-Checks aus;
- unbekannte Root-/Config-Änderungen schlagen sicherheitshalber auf alle Check-Lanes aus.

Das lokale Changed-Test-Routing befindet sich in `scripts/test-projects.test-support.mjs` und ist bewusst günstiger als `check:changed`: Direkte Teständerungen führen sich selbst aus, Quelländerungen bevorzugen explizite Zuordnungen, dann Geschwistertests und Import-Graph-Dependents. Die gemeinsame Zustellungs-Config für Gruppenräume ist eine der expliziten Zuordnungen: Änderungen an der für Gruppen sichtbaren Antwort-Config, am Quell-Antwort-Zustellmodus oder am Message-Tool-System-Prompt laufen durch die Core-Antworttests plus Discord- und Slack-Zustellungsregressionen, sodass eine geänderte gemeinsame Voreinstellung vor dem ersten PR-Push fehlschlägt. Verwenden Sie `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` nur, wenn die Änderung so harness-weit ist, dass das günstige zugeordnete Set kein vertrauenswürdiger Proxy ist.

## Testbox-Validierung

Führen Sie Testbox aus dem Repo-Root aus und bevorzugen Sie für umfassende Nachweise eine frisch vorgewärmte Box. Bevor Sie ein langsames Gate auf einer Box ausführen, die wiederverwendet wurde, abgelaufen ist oder gerade eine unerwartet große Synchronisierung gemeldet hat, führen Sie zuerst `pnpm testbox:sanity` in der Box aus.

Der Sanity-Check schlägt schnell fehl, wenn erforderliche Root-Dateien wie `pnpm-lock.yaml` verschwunden sind oder wenn `git status --short` mindestens 200 nachverfolgte Löschungen anzeigt. Das bedeutet normalerweise, dass der Remote-Synchronisierungszustand keine vertrauenswürdige Kopie des PR ist; stoppen Sie diese Box und wärmen Sie eine frische vor, statt den Produkt-Testfehler zu debuggen. Für absichtliche PRs mit vielen Löschungen setzen Sie `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` für diesen Sanity-Lauf.

`pnpm testbox:run` beendet außerdem einen lokalen Blacksmith-CLI-Aufruf, der länger als fünf Minuten ohne Ausgabe nach der Synchronisierung in der Synchronisierungsphase bleibt. Setzen Sie `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, um diese Schutzprüfung zu deaktivieren, oder verwenden Sie einen größeren Millisekundenwert für ungewöhnlich große lokale Diffs.

Crabbox ist der repo-eigene Remote-Box-Wrapper für Linux-Nachweise von Maintainern. Verwenden Sie ihn, wenn ein Check für einen lokalen Edit-Loop zu breit ist, wenn CI-Parität wichtig ist oder wenn der Nachweis Secrets, Docker, Paket-Lanes, wiederverwendbare Boxen oder Remote-Logs benötigt. Das normale OpenClaw-Backend ist `blacksmith-testbox`; eigene AWS-/Hetzner-Kapazität ist ein Fallback bei Blacksmith-Ausfällen, Kontingentproblemen oder ausdrücklich gewünschtem Testen auf eigener Kapazität.

Prüfen Sie den Wrapper vor dem ersten Lauf aus dem Repo-Root:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Der Repo-Wrapper verweigert ein veraltetes Crabbox-Binary, das `blacksmith-testbox` nicht ausweist. Übergeben Sie den Provider explizit, auch wenn `.crabbox.yaml` Defaults für die eigene Cloud enthält.

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

Lesen Sie die abschließende JSON-Zusammenfassung. Die nützlichen Felder sind `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` und `totalMs`. Einmalige Blacksmith-gestützte Crabbox-Läufe sollten die Testbox automatisch stoppen; wenn ein Lauf unterbrochen wurde oder die Bereinigung unklar ist, prüfen Sie die laufenden Boxen und stoppen Sie nur die Boxen, die Sie erstellt haben:

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

Eskalieren Sie nur dann auf eigene Crabbox-Kapazität, wenn Blacksmith ausgefallen ist, durch Kontingente begrenzt ist, die benötigte Umgebung fehlt oder eigene Kapazität ausdrücklich das Ziel ist:

```bash
pnpm crabbox:warmup -- --provider aws --class beast --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

`.crabbox.yaml` besitzt die Defaults für Provider, Synchronisierung und GitHub-Actions-Hydrierung für eigene Cloud-Lanes. Sie schließt lokales `.git` aus, damit der hydrierte Actions-Checkout seine eigenen Remote-Git-Metadaten behält, statt maintainer-lokale Remotes und Object Stores zu synchronisieren, und sie schließt lokale Laufzeit-/Build-Artefakte aus, die niemals übertragen werden sollten. `.github/workflows/crabbox-hydrate.yml` besitzt Checkout, Node-/pnpm-Einrichtung, `origin/main`-Fetch und die nicht geheime Umgebungsübergabe für eigene Cloud-Befehle mit `crabbox run --id <cbx_id>`.

## Verwandt

- [Installationsübersicht](/de/install)
- [Entwicklungs-Channels](/de/install/development-channels)
