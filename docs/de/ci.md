---
read_when:
    - Sie müssen verstehen, warum ein CI-Job ausgeführt wurde oder nicht
    - Sie debuggen eine fehlgeschlagene GitHub Actions-Prüfung
    - Sie koordinieren einen Release-Validierungslauf oder dessen erneute Ausführung
    - Sie ändern den ClawSweeper-Dispatch oder die Weiterleitung von GitHub-Aktivitäten
summary: CI-Job-Graph, Scope-Gates, Release-Umbrellas und lokale Befehlsäquivalente
title: CI-Pipeline
x-i18n:
    generated_at: "2026-05-07T01:51:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 284b83d7baf451a3e6bb557832f53513d7191f0b6d7c34fc4f7483a0851676cd
    source_path: ci.md
    workflow: 16
---

OpenClaw CI läuft bei jedem Push auf `main` und bei jedem Pull Request. Der `preflight`-Job klassifiziert den Diff und schaltet teure Lanes aus, wenn sich nur unabhängige Bereiche geändert haben. Manuelle `workflow_dispatch`-Läufe umgehen das intelligente Scoping absichtlich und fächern den vollständigen Graphen für Release-Kandidaten und breite Validierung auf. Android-Lanes bleiben über `include_android` opt-in. Release-spezifische Plugin-Abdeckung befindet sich im separaten Workflow [`Plugin-Prerelease`](#plugin-prerelease) und läuft nur aus [`Vollständige Release-Validierung`](#full-release-validation) oder durch einen expliziten manuellen Dispatch.

## Pipeline-Übersicht

| Job                              | Zweck                                                                                                                        | Wann er läuft                                  |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `preflight`                      | Erkennt reine Dokumentationsänderungen, geänderte Scopes, geänderte Erweiterungen und erstellt das CI-Manifest               | Immer bei nicht als Entwurf markierten Pushes und PRs |
| `security-scm-fast`              | Erkennung privater Schlüssel und Workflow-Audit über `zizmor`                                                                | Immer bei nicht als Entwurf markierten Pushes und PRs |
| `security-dependency-audit`      | Produktions-Lockfile-Audit ohne Dependency-Installation gegen npm-Advisories                                                  | Immer bei nicht als Entwurf markierten Pushes und PRs |
| `security-fast`                  | Erforderliches Aggregat für die schnellen Sicherheitsjobs                                                                     | Immer bei nicht als Entwurf markierten Pushes und PRs |
| `check-dependencies`             | Reiner Produktions-Knip-Durchlauf für Dependencies plus Guard für die Allowlist ungenutzter Dateien                           | Node-relevante Änderungen                      |
| `build-artifacts`                | Baut `dist/`, Control UI, Prüfungen gebauter Artefakte und wiederverwendbare Downstream-Artefakte                             | Node-relevante Änderungen                      |
| `checks-fast-core`               | Schnelle Linux-Korrektheits-Lanes wie gebündelte/Plugin-Contract/Protocol-Prüfungen                                           | Node-relevante Änderungen                      |
| `checks-fast-contracts-channels` | Gesplittete Channel-Contract-Prüfungen mit stabilem aggregiertem Prüfergebnis                                                 | Node-relevante Änderungen                      |
| `checks-node-core-test`          | Core-Node-Test-Shards, ohne Channel-, gebündelte, Contract- und Erweiterungs-Lanes                                             | Node-relevante Änderungen                      |
| `check`                          | Gesplittes Äquivalent des lokalen Haupt-Gates: Prod-Typen, Lint, Guards, Testtypen und strikter Smoke-Test                    | Node-relevante Änderungen                      |
| `check-additional`               | Architektur, gesplitteter Boundary-/Prompt-Drift, Erweiterungs-Guards, Paket-Boundary und Gateway-Watch                       | Node-relevante Änderungen                      |
| `build-smoke`                    | Smoke-Tests für die gebaute CLI und Startup-Memory-Smoke                                                                      | Node-relevante Änderungen                      |
| `checks`                         | Verifier für Channel-Tests mit gebauten Artefakten                                                                            | Node-relevante Änderungen                      |
| `checks-node-compat-node22`      | Node-22-Kompatibilitäts-Build und Smoke-Lane                                                                                  | Manueller CI-Dispatch für Releases             |
| `check-docs`                     | Dokumentationsformatierung, Lint und Prüfungen auf defekte Links                                                              | Dokumentation geändert                         |
| `skills-python`                  | Ruff + pytest für Python-gestützte Skills                                                                                     | Für Python-Skills relevante Änderungen         |
| `checks-windows`                 | Windows-spezifische Prozess-/Pfadtests plus gemeinsame Regressionen bei Runtime-Import-Spezifizierern                         | Windows-relevante Änderungen                   |
| `macos-node`                     | macOS-TypeScript-Test-Lane mit den gemeinsamen gebauten Artefakten                                                            | macOS-relevante Änderungen                     |
| `macos-swift`                    | Swift-Lint, Build und Tests für die macOS-App                                                                                 | macOS-relevante Änderungen                     |
| `android`                        | Android-Unit-Tests für beide Flavors plus ein Debug-APK-Build                                                                 | Android-relevante Änderungen                   |
| `test-performance-agent`         | Tägliche Codex-Optimierung langsamer Tests nach vertrauenswürdiger Aktivität                                                  | Erfolg der Main-CI oder manueller Dispatch     |
| `openclaw-performance`           | Tägliche/bedarfsgesteuerte Kova-Runtime-Performance-Berichte mit Mock-Provider-, Deep-Profile- und GPT-5.4-Live-Lanes         | Geplanter und manueller Dispatch               |

## Fail-Fast-Reihenfolge

1. `preflight` entscheidet, welche Lanes überhaupt existieren. Die Logik `docs-scope` und `changed-scope` sind Schritte innerhalb dieses Jobs, keine eigenständigen Jobs.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` und `skills-python` schlagen schnell fehl, ohne auf die schwereren Artefakt- und Plattform-Matrix-Jobs zu warten.
3. `build-artifacts` überlappt mit den schnellen Linux-Lanes, damit Downstream-Verbraucher starten können, sobald der gemeinsame Build bereit ist.
4. Schwerere Plattform- und Runtime-Lanes fächern danach auf: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` und `android`.

GitHub kann überholte Jobs als `cancelled` markieren, wenn ein neuerer Push auf demselben PR- oder `main`-Ref landet. Behandeln Sie das als CI-Rauschen, sofern nicht auch der neueste Lauf für denselben Ref fehlschlägt. Aggregierte Shard-Prüfungen verwenden `!cancelled() && always()`, sodass sie normale Shard-Fehler weiterhin melden, aber nicht in die Warteschlange gehen, nachdem der gesamte Workflow bereits überholt wurde. Der automatische CI-Concurrency-Key ist versioniert (`CI-v7-*`), sodass ein GitHub-seitiger Zombie in einer alten Warteschlangengruppe neuere Main-Läufe nicht dauerhaft blockieren kann. Manuelle Läufe der vollständigen Suite verwenden `CI-manual-v1-*` und brechen laufende Läufe nicht ab.

Der Job `ci-timings-summary` lädt für jeden nicht als Entwurf markierten CI-Lauf ein kompaktes Artefakt `ci-timings-summary` hoch. Es zeichnet Wall Time, Queue Time, langsamste Jobs und fehlgeschlagene Jobs für den aktuellen Lauf auf, sodass CI-Health-Checks nicht wiederholt das vollständige Actions-Payload auslesen müssen.

## Scope und Routing

Die Scope-Logik befindet sich in `scripts/ci-changed-scope.mjs` und ist durch Unit-Tests in `src/scripts/ci-changed-scope.test.ts` abgedeckt. Manueller Dispatch überspringt die Changed-Scope-Erkennung und lässt das Preflight-Manifest so agieren, als hätte sich jeder gescopte Bereich geändert.

- **CI-Workflow-Änderungen** validieren den Node-CI-Graphen plus Workflow-Linting, erzwingen aber nicht von sich aus Windows-, Android- oder macOS-native Builds; diese Plattform-Lanes bleiben auf Änderungen am Plattform-Quellcode gescopt.
- **Reine CI-Routing-Änderungen, ausgewählte günstige Core-Test-Fixture-Änderungen und schmale Plugin-Contract-Helper-/Test-Routing-Änderungen** verwenden einen schnellen Node-only-Manifestpfad: `preflight`, Sicherheit und eine einzelne `checks-fast-core`-Aufgabe. Dieser Pfad überspringt Build-Artefakte, Node-22-Kompatibilität, Channel-Contracts, vollständige Core-Shards, gebündelte Plugin-Shards und zusätzliche Guard-Matrizen, wenn die Änderung auf die Routing- oder Helper-Oberflächen beschränkt ist, die die schnelle Aufgabe direkt ausübt.
- **Windows-Node-Prüfungen** sind auf Windows-spezifische Prozess-/Pfad-Wrapper, npm-/pnpm-/UI-Runner-Helper, Paketmanager-Konfiguration und die CI-Workflow-Oberflächen gescopt, die diese Lane ausführen; unabhängige Quellcode-, Plugin-, Install-Smoke- und reine Teständerungen bleiben auf den Linux-Node-Lanes.

Die langsamsten Node-Testfamilien sind aufgeteilt oder ausbalanciert, sodass jeder Job klein bleibt, ohne Runner übermäßig zu reservieren: Channel-Contracts laufen als drei gewichtete Shards, Core-Unit-Fast-/Support-Lanes laufen separat, Core-Runtime-Infrastruktur ist zwischen State-, Process/Config-, Cron- und Shared-Shards aufgeteilt, Auto-Reply läuft als ausbalancierte Worker (wobei der Reply-Teilbaum in Agent-Runner-, Dispatch- und Commands/State-Routing-Shards aufgeteilt ist), und agentische Gateway-/Server-Konfigurationen sind über Chat/Auth/Model/HTTP-Plugin/Runtime/Startup-Lanes verteilt, statt auf gebaute Artefakte zu warten. Breite Browser-, QA-, Media- und sonstige Plugin-Tests verwenden ihre dedizierten Vitest-Konfigurationen statt des gemeinsamen Plugin-Catch-all. Include-Pattern-Shards zeichnen Timing-Einträge mit dem CI-Shard-Namen auf, sodass `.artifacts/vitest-shard-timings.json` eine vollständige Konfiguration von einem gefilterten Shard unterscheiden kann. `check-additional` hält Paket-Boundary-Compile-/Canary-Arbeit zusammen und trennt Runtime-Topology-Architektur von Gateway-Watch-Abdeckung; die Boundary-Guard-Liste ist über vier Matrix-Shards gestreift, von denen jeder ausgewählte unabhängige Guards parallel ausführt und Timings pro Prüfung ausgibt. Die teure Codex-Happy-Path-Prompt-Snapshot-Drift-Prüfung läuft nur für manuelle CI und für Prompt-beeinflussende Änderungen, sodass normale unabhängige Node-Änderungen nicht hinter kalter Prompt-Snapshot-Generierung warten, während Prompt-Drift weiterhin an den PR gebunden ist, der ihn verursacht hat; dasselbe Flag überspringt die Prompt-Snapshot-Vitest-Generierung innerhalb des Core-Support-Boundary-Shards für gebaute Artefakte. Gateway-Watch, Channel-Tests und der Core-Support-Boundary-Shard laufen innerhalb von `build-artifacts` parallel, nachdem `dist/` und `dist-runtime/` bereits gebaut sind.

Android-CI führt sowohl `testPlayDebugUnitTest` als auch `testThirdPartyDebugUnitTest` aus und baut anschließend das Play-Debug-APK. Der Third-Party-Flavor hat kein separates Source Set oder Manifest; seine Unit-Test-Lane kompiliert den Flavor dennoch mit den SMS-/Call-Log-`BuildConfig`-Flags, vermeidet aber bei jedem Android-relevanten Push einen doppelten Debug-APK-Packaging-Job.

Der Shard `check-dependencies` führt `pnpm deadcode:dependencies` aus (ein reiner Produktions-Knip-Durchlauf für Dependencies, angeheftet an die neueste Knip-Version, wobei pnpm's Mindest-Release-Alter für die `dlx`-Installation deaktiviert ist) sowie `pnpm deadcode:unused-files`, das Knips Produktionsbefunde zu ungenutzten Dateien mit `scripts/deadcode-unused-files.allowlist.mjs` vergleicht. Der Guard für ungenutzte Dateien schlägt fehl, wenn ein PR eine neue ungeprüfte ungenutzte Datei hinzufügt oder einen veralteten Allowlist-Eintrag zurücklässt, während absichtliche dynamische Plugin-, generierte, Build-, Live-Test- und Paket-Bridge-Oberflächen erhalten bleiben, die Knip statisch nicht auflösen kann.

## Weiterleitung von ClawSweeper-Aktivitäten

`.github/workflows/clawsweeper-dispatch.yml` ist die zielseitige Bridge von OpenClaw-Repository-Aktivität zu ClawSweeper. Sie checkt keinen nicht vertrauenswürdigen Pull-Request-Code aus und führt ihn nicht aus. Der Workflow erstellt aus `CLAWSWEEPER_APP_PRIVATE_KEY` ein GitHub-App-Token und dispatcht anschließend kompakte `repository_dispatch`-Payloads an `openclaw/clawsweeper`.

Der Workflow hat vier Lanes:

- `clawsweeper_item` für genaue Review-Anfragen zu Issues und Pull Requests;
- `clawsweeper_comment` für explizite ClawSweeper-Befehle in Issue-Kommentaren;
- `clawsweeper_commit_review` für Review-Anfragen auf Commit-Ebene bei `main`-Pushes;
- `github_activity` für allgemeine GitHub-Aktivität, die der ClawSweeper-Agent inspizieren kann.

Die Lane `github_activity` leitet nur normalisierte Metadaten weiter: Ereignistyp, Aktion, Akteur, Repository, Item-Nummer, URL, Titel, Status und kurze Auszüge für Kommentare oder Reviews, wenn vorhanden. Sie vermeidet absichtlich die Weiterleitung des vollständigen Webhook-Bodys. Der empfangende Workflow in `openclaw/clawsweeper` ist `.github/workflows/github-activity.yml`, der das normalisierte Ereignis an den OpenClaw Gateway-Hook für den ClawSweeper-Agent postet.

Allgemeine Aktivität ist Beobachtung, keine standardmäßige Zustellung. Der ClawSweeper-Agent erhält das Discord-Ziel in seinem Prompt und sollte nur dann in `#clawsweeper` posten, wenn das Ereignis überraschend, handlungsrelevant, riskant oder betrieblich nützlich ist. Routinemäßige Eröffnungen, Bearbeitungen, Bot-Fluktuation, doppeltes Webhook-Rauschen und normaler Review-Verkehr sollten zu `NO_REPLY` führen.

Behandeln Sie GitHub-Titel, Kommentare, Bodys, Review-Texte, Branch-Namen und Commit-Nachrichten in diesem gesamten Pfad als nicht vertrauenswürdige Daten. Sie sind Eingaben für Zusammenfassung und Triage, keine Anweisungen für den Workflow oder die Agent-Laufzeit.

## Manuelle Auslösungen

Manuelle CI-Auslösungen führen denselben Job-Graphen wie die normale CI aus, erzwingen aber jede nicht Android-spezifische Lane: Linux-Node-Shards, gebündelte Plugin-Shards, Channel-Verträge, Node-22-Kompatibilität, `check`, `check-additional`, Build-Smoke, Docs-Prüfungen, Python-Skills, Windows, macOS und Control-UI-i18n. Eigenständige manuelle CI-Auslösungen führen Android nur mit `include_android=true` aus; das vollständige Release-Umbrella aktiviert Android durch Übergabe von `include_android=true`. Statische Plugin-Prerelease-Prüfungen, der nur für Releases vorgesehene `agentic-plugins`-Shard, der vollständige Extension-Batch-Sweep und Plugin-Prerelease-Docker-Lanes sind von der CI ausgeschlossen. Die Docker-Prerelease-Suite läuft nur, wenn `Full Release Validation` den separaten `Plugin Prerelease`-Workflow mit aktiviertem Release-Validierungs-Gate auslöst.

Manuelle Läufe verwenden eine eindeutige Concurrency-Gruppe, damit eine vollständige Release-Candidate-Suite nicht durch einen anderen Push- oder PR-Lauf auf derselben Ref abgebrochen wird. Die optionale Eingabe `target_ref` ermöglicht es einem vertrauenswürdigen Aufrufer, diesen Graphen gegen einen Branch, Tag oder vollständigen Commit-SHA auszuführen, während die Workflow-Datei aus der ausgewählten Dispatch-Ref verwendet wird.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ubuntu-24.04`                   | `preflight`, schnelle Sicherheitsjobs und Aggregate (`security-scm-fast`, `security-dependency-audit`, `security-fast`), schnelle Protokoll-/Vertrags-/Bündelprüfungen, geshardete Channel-Vertragsprüfungen, `check`-Shards außer Lint, `check-additional`-Aggregate, Verifizierer für Node-Testaggregate, Docs-Prüfungen, Python-Skills, Workflow-Sanity, Labeler, Auto-Response; Install-Smoke-Preflight verwendet ebenfalls GitHub-gehostetes Ubuntu, damit die Blacksmith-Matrix früher in die Warteschlange gestellt werden kann |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, weniger rechenintensive Extension-Shards, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` und `check-test-types`                                                                                                                                                                                                                                                                                                        |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, Build-Smoke, Linux-Node-Test-Shards, gebündelte Plugin-Test-Shards, `check-additional`-Shards, `android`                                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (CPU-sensibel genug, dass 8 vCPU mehr kosteten, als sie einsparten); Install-Smoke-Docker-Builds (32-vCPU-Warteschlangenzeit kostete mehr, als sie einsparten)                                                                                                                                                                                                                                                                                                          |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` auf `openclaw/openclaw`; Forks fallen auf `macos-latest` zurück                                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` auf `openclaw/openclaw`; Forks fallen auf `macos-latest` zurück                                                                                                                                                                                                                                                                                                                                                                                      |

Die CI des kanonischen Repos behält Blacksmith als Standard-Runner-Pfad bei. Während `preflight` prüft `scripts/ci-runner-labels.mjs` aktuelle in der Warteschlange stehende und laufende Actions-Läufe auf wartende Blacksmith-Jobs. Wenn für ein bestimmtes Blacksmith-Label bereits Jobs in der Warteschlange stehen, fallen nachgelagerte Jobs, die genau dieses Label verwenden würden, nur für diesen Lauf auf den passenden GitHub-gehosteten Runner (`ubuntu-24.04`, `windows-2025` oder `macos-latest`) zurück. Andere Blacksmith-Größen in derselben Betriebssystemfamilie bleiben auf ihren primären Labels. Wenn die API-Prüfung fehlschlägt, wird kein Fallback angewendet.

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

`OpenClaw Performance` ist der Workflow für Produkt- und Laufzeit-Performance. Er läuft täglich auf `main` und kann manuell ausgelöst werden:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Eine manuelle Auslösung benchmarked normalerweise die Workflow-Ref. Setzen Sie `target_ref`, um ein Release-Tag oder einen anderen Branch mit der aktuellen Workflow-Implementierung zu benchmarken. Veröffentlichte Berichtspfade und Latest-Zeiger werden nach der getesteten Ref indiziert, und jede `index.md` zeichnet getestete Ref/SHA, Workflow-Ref/SHA, Kova-Ref, Profil, Lane-Auth-Modus, Modell, Wiederholungsanzahl und Szenariofilter auf.

Der Workflow installiert OCM aus einem gepinnten Release und Kova aus `openclaw/Kova` mit der gepinnten Eingabe `kova_ref` und führt dann drei Lanes aus:

- `mock-provider`: Kova-Diagnoseszenarien gegen eine Laufzeit aus lokalem Build mit deterministischer gefälschter OpenAI-kompatibler Authentifizierung.
- `mock-deep-profile`: CPU-/Heap-/Trace-Profiling für Start-, Gateway- und Agent-Turn-Hotspots.
- `live-gpt54`: ein echter OpenAI-`openai/gpt-5.4`-Agent-Turn, übersprungen, wenn `OPENAI_API_KEY` nicht verfügbar ist.

Die Mock-Provider-Lane führt nach dem Kova-Durchlauf auch OpenClaw-native Source-Probes aus: Gateway-Startzeit und Speicher über Standard-, Hook- und 50-Plugin-Startfälle hinweg; wiederholte Mock-OpenAI-`channel-chat-baseline`-Hallo-Schleifen; und CLI-Startbefehle gegen das gestartete Gateway. Die Markdown-Zusammenfassung der Source-Probe befindet sich unter `source/index.md` im Berichtsbundle, mit Roh-JSON daneben.

Jede Lane lädt GitHub-Artefakte hoch. Wenn `CLAWGRIT_REPORTS_TOKEN` konfiguriert ist, committet der Workflow außerdem `report.json`, `report.md`, Bundles, `index.md` und Source-Probe-Artefakte nach `openclaw/clawgrit-reports` unter `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Der aktuelle Zeiger für die getestete Ref wird als `openclaw-performance/<tested-ref>/latest-<lane>.json` geschrieben.

## Vollständige Release-Validierung

`Full Release Validation` ist der manuelle Umbrella-Workflow für „vor dem Release alles ausführen“. Er akzeptiert einen Branch, Tag oder vollständigen Commit-SHA, löst den manuellen `CI`-Workflow mit diesem Ziel aus, löst `Plugin Prerelease` für nur für Releases vorgesehene Plugin-/Paket-/statische/Docker-Nachweise aus und löst `OpenClaw Release Checks` für Install-Smoke, Paketakzeptanz, betriebssystemübergreifende Paketprüfungen, QA-Lab-Parität, Matrix- und Telegram-Lanes aus. Stabile/Standardläufe belassen vollständige Live-/E2E- und Docker-Release-Pfad-Abdeckung hinter `run_release_soak=true`; `release_profile=full` erzwingt diese Soak-Abdeckung, damit breite Advisory-Validierung breit bleibt. Mit `rerun_group=all` und `release_profile=full` läuft auch `NPM Telegram Beta E2E` gegen das Artefakt `release-package-under-test` aus den Release-Prüfungen. Übergeben Sie nach der Veröffentlichung `npm_telegram_package_spec`, um dieselbe Telegram-Paket-Lane gegen das veröffentlichte npm-Paket erneut auszuführen.

Siehe [Vollständige Release-Validierung](/de/reference/full-release-validation) für die
Stage-Matrix, exakten Workflow-Jobnamen, Profilunterschiede, Artefakte und
fokussierten Rerun-Handles.

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

Für den Nachweis eines angepinnten Commits auf einem schnelllebigen Branch verwenden Sie das Hilfsskript statt
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub-Workflow-Dispatch-Refs müssen Branches oder Tags sein, keine rohen Commit-SHAs. Das
Hilfsskript pusht einen temporären Branch `release-ci/<sha>-...` am Ziel-SHA,
dispatcht `Full Release Validation` von diesem angepinnten Ref, verifiziert, dass jedes untergeordnete
Workflow-`headSha` dem Ziel entspricht, und löscht den temporären Branch, wenn der
Lauf abgeschlossen ist. Der übergeordnete Verifier schlägt auch fehl, wenn ein untergeordneter Workflow mit einem
anderen SHA lief.

`release_profile` steuert die Live-/Provider-Breite, die an Release-Prüfungen übergeben wird. Die
manuellen Release-Workflows verwenden standardmäßig `stable`; verwenden Sie `full` nur, wenn Sie
absichtlich die breite advisory Provider-/Medienmatrix möchten. `run_release_soak`
steuert, ob stabile/standardmäßige Release-Prüfungen den umfassenden Live-/E2E- und
Docker-Release-Pfad-Soak ausführen; `full` erzwingt den Soak.

- `minimum` behält die schnellsten OpenAI-/Core-Lanes bei, die für das Release kritisch sind.
- `stable` ergänzt das stabile Provider-/Backend-Set.
- `full` führt die breite advisory Provider-/Medienmatrix aus.

Der Umbrella-Workflow zeichnet die dispatchten untergeordneten Run-IDs auf, und der abschließende Job `Verify full validation` prüft die aktuellen Ergebnisse der untergeordneten Läufe erneut und hängt Tabellen der langsamsten Jobs für jeden untergeordneten Lauf an. Wenn ein untergeordneter Workflow erneut ausgeführt wird und grün wird, führen Sie nur den übergeordneten Verifier-Job erneut aus, um das Umbrella-Ergebnis und die Zeitübersicht zu aktualisieren.

Für die Wiederherstellung akzeptieren sowohl `Full Release Validation` als auch `OpenClaw Release Checks` `rerun_group`. Verwenden Sie `all` für einen Release-Kandidaten, `ci` nur für das normale vollständige CI-Kind, `plugin-prerelease` nur für das Plugin-Prerelease-Kind, `release-checks` für jedes Release-Kind oder eine engere Gruppe: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` oder `npm-telegram` im Umbrella-Workflow. So bleibt ein erneuter Lauf einer fehlgeschlagenen Release-Box nach einem fokussierten Fix begrenzt. Für eine einzelne fehlgeschlagene Cross-OS-Lane kombinieren Sie `rerun_group=cross-os` mit `cross_os_suite_filter`, zum Beispiel `windows/packaged-upgrade`; lange Cross-OS-Befehle geben Heartbeat-Zeilen aus, und Packaged-Upgrade-Zusammenfassungen enthalten Zeitangaben pro Phase. QA-Release-Check-Lanes sind advisory, daher warnen reine QA-Fehler, blockieren aber den Release-Check-Verifier nicht.

`OpenClaw Release Checks` verwendet den vertrauenswürdigen Workflow-Ref, um den ausgewählten Ref einmal in einen `release-package-under-test`-Tarball aufzulösen, und übergibt dieses Artefakt dann an Cross-OS-Prüfungen und Package Acceptance sowie an den Live-/E2E-Docker-Workflow für den Release-Pfad, wenn Soak-Abdeckung läuft. Dadurch bleiben die Paketbytes über Release-Boxen hinweg konsistent, und derselbe Kandidat muss nicht in mehreren untergeordneten Jobs neu gepackt werden.

Doppelte `Full Release Validation`-Läufe für `ref=main` und `rerun_group=all`
ersetzen den älteren Umbrella-Lauf. Der übergeordnete Monitor bricht jeden bereits dispatchten untergeordneten Workflow ab,
wenn der übergeordnete Lauf abgebrochen wird, sodass neuere Main-Validierung
nicht hinter einem veralteten zweistündigen Release-Check-Lauf wartet. Release-Branch-/Tag-
Validierung und fokussierte Rerun-Gruppen behalten `cancel-in-progress: false`.

## Live- und E2E-Shards

Das Live-/E2E-Kind des Releases behält die breite native `pnpm test:live`-Abdeckung bei, führt sie aber als benannte Shards über `scripts/test-live-shard.mjs` aus statt als einen seriellen Job:

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

Das behält dieselbe Dateiabdeckung bei und macht langsame Live-Provider-Fehler zugleich leichter erneut ausführbar und diagnostizierbar. Die aggregierten Shard-Namen `native-live-extensions-o-z`, `native-live-extensions-media` und `native-live-extensions-media-music` bleiben für manuelle einmalige Reruns gültig.

Die nativen Live-Medien-Shards laufen in `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, gebaut vom Workflow `Live Media Runner Image`. Dieses Image installiert `ffmpeg` und `ffprobe` vor; Medienjobs verifizieren vor dem Setup nur die Binärdateien. Lassen Sie Docker-gestützte Live-Suites auf normalen Blacksmith-Runnern laufen — Container-Jobs sind der falsche Ort, um verschachtelte Docker-Tests zu starten.

Docker-gestützte Live-Modell-/Backend-Shards verwenden pro ausgewähltem Commit ein separates gemeinsames Image `ghcr.io/openclaw/openclaw-live-test:<sha>`. Der Live-Release-Workflow baut und pusht dieses Image einmal, dann laufen die Docker-Live-Modell-, Provider-geshardeten Gateway-, CLI-Backend-, ACP-Bind- und Codex-Harness-Shards mit `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gateway-Docker-Shards tragen explizite Skript-`timeout`-Limits unterhalb des Workflow-Job-Timeouts, damit ein hängender Container oder Cleanup-Pfad schnell fehlschlägt, statt das gesamte Release-Check-Budget zu verbrauchen. Wenn diese Shards das vollständige Source-Docker-Ziel unabhängig neu bauen, ist der Release-Lauf falsch konfiguriert und verschwendet Laufzeit mit doppelten Image-Builds.

## Package Acceptance

Verwenden Sie `Package Acceptance`, wenn die Frage lautet: „Funktioniert dieses installierbare OpenClaw-Paket als Produkt?“ Es unterscheidet sich von normaler CI: Normale CI validiert den Source-Tree, während Package Acceptance einen einzelnen Tarball über dasselbe Docker-E2E-Harness validiert, das Benutzer nach Installation oder Update ausüben.

### Jobs

1. `resolve_package` checkt `workflow_ref` aus, löst einen Paketkandidaten auf, schreibt `.artifacts/docker-e2e-package/openclaw-current.tgz`, schreibt `.artifacts/docker-e2e-package/package-candidate.json`, lädt beide als Artefakt `package-under-test` hoch und gibt Quelle, Workflow-Ref, Paket-Ref, Version, SHA-256 und Profil in der GitHub-Schrittzusammenfassung aus.
2. `docker_acceptance` ruft `openclaw-live-and-e2e-checks-reusable.yml` mit `ref=workflow_ref` und `package_artifact_name=package-under-test` auf. Der wiederverwendbare Workflow lädt dieses Artefakt herunter, validiert das Tarball-Inventar, bereitet bei Bedarf Package-Digest-Docker-Images vor und führt die ausgewählten Docker-Lanes gegen dieses Paket aus, statt den Workflow-Checkout zu packen. Wenn ein Profil mehrere gezielte `docker_lanes` auswählt, bereitet der wiederverwendbare Workflow das Paket und die gemeinsamen Images einmal vor und fächert diese Lanes dann als parallele gezielte Docker-Jobs mit eindeutigen Artefakten auf.
3. `package_telegram` ruft optional `NPM Telegram Beta E2E` auf. Es läuft, wenn `telegram_mode` nicht `none` ist, und installiert dasselbe Artefakt `package-under-test`, wenn Package Acceptance eines aufgelöst hat; ein eigenständiger Telegram-Dispatch kann weiterhin eine veröffentlichte npm-Spezifikation installieren.
4. `summary` lässt den Workflow fehlschlagen, wenn Paketauflösung, Docker Acceptance oder die optionale Telegram-Lane fehlgeschlagen ist.

### Kandidatenquellen

- `source=npm` akzeptiert nur `openclaw@beta`, `openclaw@latest` oder eine exakte OpenClaw-Release-Version wie `openclaw@2026.4.27-beta.2`. Verwenden Sie dies für veröffentlichte Prerelease-/Stable-Acceptance.
- `source=ref` packt einen vertrauenswürdigen `package_ref`-Branch, -Tag oder vollständigen Commit-SHA. Der Resolver fetcht OpenClaw-Branches/-Tags, verifiziert, dass der ausgewählte Commit aus der Repository-Branch-Historie oder einem Release-Tag erreichbar ist, installiert Abhängigkeiten in einem detached Worktree und packt ihn mit `scripts/package-openclaw-for-docker.mjs`.
- `source=url` lädt ein HTTPS-`.tgz` herunter; `package_sha256` ist erforderlich.
- `source=artifact` lädt ein `.tgz` aus `artifact_run_id` und `artifact_name` herunter; `package_sha256` ist optional, sollte aber für extern geteilte Artefakte angegeben werden.

Halten Sie `workflow_ref` und `package_ref` getrennt. `workflow_ref` ist der vertrauenswürdige Workflow-/Harness-Code, der den Test ausführt. `package_ref` ist der Quell-Commit, der gepackt wird, wenn `source=ref` gilt. Dadurch kann das aktuelle Test-Harness ältere vertrauenswürdige Quell-Commits validieren, ohne alte Workflow-Logik auszuführen.

### Suite-Profile

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — vollständige Docker-Release-Pfad-Chunks mit OpenWebUI
- `custom` — exakte `docker_lanes`; erforderlich, wenn `suite_profile=custom`

Das Profil `package` verwendet Offline-Plugin-Abdeckung, sodass die Validierung veröffentlichter Pakete nicht von der Live-Verfügbarkeit von ClawHub abhängt. Die optionale Telegram-Lane verwendet das Artefakt `package-under-test` in `NPM Telegram Beta E2E` wieder; der Pfad für die veröffentlichte npm-Spezifikation bleibt für eigenständige Dispatches erhalten.

Die dedizierte Richtlinie für Update- und Plugin-Tests, einschließlich lokaler Befehle,
Docker-Lanes, Package-Acceptance-Eingaben, Release-Defaults und Fehlertriage,
finden Sie unter [Updates und Plugins testen](/de/help/testing-updates-plugins).

Release-Prüfungen rufen Package Acceptance mit `source=artifact`, dem vorbereiteten Release-Paketartefakt, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'` und `telegram_mode=mock-openai` auf. Dadurch bleiben Paketmigration, Update, Bereinigung veralteter Plugin-Abhängigkeiten, Reparatur der Installation konfigurierter Plugins, Offline-Plugin, Plugin-Update und Telegram-Nachweis auf demselben aufgelösten Paket-Tarball. Setzen Sie `package_acceptance_package_spec` in Full Release Validation oder OpenClaw Release Checks, um dieselbe Matrix gegen ein ausgeliefertes npm-Paket statt gegen das aus dem SHA gebaute Artefakt auszuführen. Cross-OS-Release-Prüfungen decken weiterhin OS-spezifisches Onboarding, Installer- und Plattformverhalten ab; Paket-/Update-Produktvalidierung sollte mit Package Acceptance beginnen. Die Docker-Lane `published-upgrade-survivor` validiert pro Lauf eine veröffentlichte Paketbaseline im blockierenden Release-Pfad. In Package Acceptance ist der aufgelöste Tarball `package-under-test` immer der Kandidat, und `published_upgrade_survivor_baseline` wählt die Fallback-veröffentlichte Baseline aus, standardmäßig `openclaw@latest`; Befehle zum erneuten Ausführen fehlgeschlagener Lanes behalten diese Baseline bei. Full Release Validation mit `run_release_soak=true` oder `release_profile=full` setzt `published_upgrade_survivor_baselines='last-stable-4 2026.4.23 2026.5.2 2026.4.15'` und `published_upgrade_survivor_scenarios=reported-issues`, um über die vier neuesten stabilen npm-Releases plus angepinnte Plugin-Kompatibilitäts-Grenzreleases und issue-förmige Fixtures für Feishu-Konfiguration, erhaltene Bootstrap-/Persona-Dateien, konfigurierte OpenClaw-Plugin-Installationen, Tilde-Logpfade und veraltete Legacy-Plugin-Abhängigkeitswurzeln zu erweitern. Published-Upgrade-Survivor-Auswahlen mit mehreren Baselines werden nach Baseline in separate gezielte Docker-Runner-Jobs geshardet. Der separate Workflow `Update Migration` verwendet die Docker-Lane `update-migration` mit `all-since-2026.4.23` und `plugin-deps-cleanup`, wenn es um umfassende Bereinigung veröffentlichter Updates geht, nicht um die normale Breite der Full Release CI. Lokale aggregierte Läufe können exakte Paketspezifikationen mit `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` übergeben, eine einzelne Lane mit `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` wie `openclaw@2026.4.15` beibehalten oder `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` für die Szenariomatrix setzen. Die veröffentlichte Lane konfiguriert die Baseline mit einem eingebetteten `openclaw config set`-Befehlsrezept, zeichnet Rezeptschritte in `summary.json` auf und prüft `/healthz`, `/readyz` sowie den RPC-Status nach dem Gateway-Start. Die Windows-Packaged- und Installer-Fresh-Lanes verifizieren außerdem, dass ein installiertes Paket ein Browser-Control-Override aus einem rohen absoluten Windows-Pfad importieren kann. Der OpenAI-Cross-OS-Agent-Turn-Smoke verwendet standardmäßig `OPENCLAW_CROSS_OS_OPENAI_MODEL`, wenn gesetzt, andernfalls `openai/gpt-5.4`, sodass der Installations- und Gateway-Nachweis auf einem GPT-5-Testmodell bleibt und GPT-4.x-Defaults vermieden werden.

### Legacy-Kompatibilitätsfenster

Package Acceptance hat begrenzte Legacy-Kompatibilitätsfenster für bereits veröffentlichte Pakete. Pakete bis einschließlich `2026.4.25`, einschließlich `2026.4.25-beta.*`, dürfen den Kompatibilitätspfad verwenden:

- bekannte private QA-Einträge in `dist/postinstall-inventory.json` dürfen auf Dateien verweisen, die im Tarball ausgelassen wurden;
- `doctor-switch` darf den Persistenz-Unterfall `gateway install --wrapper` überspringen, wenn das Paket dieses Flag nicht bereitstellt;
- `update-channel-switch` darf fehlende `pnpm.patchedDependencies` aus dem aus dem Tarball abgeleiteten Fake-Git-Fixture entfernen und fehlendes persistiertes `update.channel` protokollieren;
- Plugin-Smokes dürfen Legacy-Speicherorte für Installationsdatensätze lesen oder fehlende Marketplace-Persistenz von Installationsdatensätzen akzeptieren;
- `plugin-update` darf die Migration von Konfigurationsmetadaten zulassen, während weiterhin erforderlich ist, dass der Installationsdatensatz und das Verhalten ohne Neuinstallation unverändert bleiben.

Das veröffentlichte Paket `2026.4.26` darf auch für bereits ausgelieferte Stempeldateien lokaler Build-Metadaten warnen. Spätere Pakete müssen die modernen Verträge erfüllen; dieselben Bedingungen schlagen dann fehl, statt zu warnen oder übersprungen zu werden.

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

Beginnen Sie beim Debuggen eines fehlgeschlagenen Package-Acceptance-Laufs mit der Zusammenfassung `resolve_package`, um Paketquelle, Version und SHA-256 zu bestätigen. Prüfen Sie anschließend den untergeordneten Lauf `docker_acceptance` und dessen Docker-Artefakte: `.artifacts/docker-tests/**/summary.json`, `failures.json`, Lane-Logs, Phasen-Timings und Befehle zum erneuten Ausführen. Führen Sie bevorzugt das fehlgeschlagene Paketprofil oder die exakten Docker-Lanes erneut aus, statt die vollständige Release-Validierung erneut auszuführen.

## Installations-Smoke

Der separate Workflow `Install Smoke` verwendet dasselbe Scope-Skript über seinen eigenen Job `preflight`. Er teilt die Smoke-Abdeckung in `run_fast_install_smoke` und `run_full_install_smoke` auf.

- **Schneller Pfad** läuft für Pull Requests, die Docker-/Paketoberflächen, Änderungen an gebündelten Plugin-Paketen/-Manifesten oder Kernoberflächen für Plugin/Kanal/Gateway/Plugin SDK berühren, die von den Docker-Smoke-Jobs ausgeübt werden. Reine Quelländerungen an gebündelten Plugins, reine Teständerungen und reine Dokumentationsänderungen reservieren keine Docker-Worker. Der schnelle Pfad baut das Root-Dockerfile-Image einmal, prüft die CLI, führt den CLI-Smoke zum Löschen von Agents im gemeinsamen Workspace aus, führt das Container-Gateway-Network-E2E aus, verifiziert ein Build-Argument für eine gebündelte Extension und führt das begrenzte Docker-Profil für gebündelte Plugins unter einem aggregierten Befehls-Timeout von 240 Sekunden aus, wobei jeder Docker-Lauf eines Szenarios separat begrenzt ist.
- **Vollständiger Pfad** behält QR-Paketinstallation und Installer-Docker-/Update-Abdeckung für nächtlich geplante Läufe, manuelle Dispatches, Workflow-Call-Release-Prüfungen und Pull Requests bei, die tatsächlich Installer-/Paket-/Docker-Oberflächen berühren. Im vollständigen Modus bereitet install-smoke ein GHCR-Root-Dockerfile-Smoke-Image für die Ziel-SHA vor oder verwendet eines wieder; anschließend laufen QR-Paketinstallation, Root-Dockerfile-/Gateway-Smokes, Installer-/Update-Smokes und das schnelle Docker-E2E für gebündelte Plugins als separate Jobs, damit Installer-Arbeit nicht hinter den Root-Image-Smokes warten muss.

`main`-Pushes (einschließlich Merge-Commits) erzwingen den vollständigen Pfad nicht; wenn die Changed-Scope-Logik bei einem Push vollständige Abdeckung anfordern würde, behält der Workflow den schnellen Docker-Smoke bei und überlässt den vollständigen Installations-Smoke der nächtlichen oder Release-Validierung.

Der langsame Bun-Global-Install-Image-Provider-Smoke wird separat durch `run_bun_global_install_smoke` gesteuert. Er läuft im nächtlichen Zeitplan und aus dem Release-Checks-Workflow, und manuelle `Install Smoke`-Dispatches können ihn aktivieren, Pull Requests und `main`-Pushes jedoch nicht. QR- und Installer-Docker-Tests behalten ihre eigenen installfokussierten Dockerfiles.

## Lokales Docker-E2E

`pnpm test:docker:all` baut ein gemeinsames Live-Test-Image vor, packt OpenClaw einmal als npm-Tarball und baut zwei gemeinsame `scripts/e2e/Dockerfile`-Images:

- einen einfachen Node-/Git-Runner für Installer-/Update-/Plugin-Dependency-Lanes;
- ein funktionales Image, das denselben Tarball für normale Funktionalitäts-Lanes in `/app` installiert.

Docker-Lane-Definitionen befinden sich in `scripts/lib/docker-e2e-scenarios.mjs`, die Planner-Logik befindet sich in `scripts/lib/docker-e2e-plan.mjs`, und der Runner führt nur den ausgewählten Plan aus. Der Scheduler wählt das Image pro Lane mit `OPENCLAW_DOCKER_E2E_BARE_IMAGE` und `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` aus und führt dann Lanes mit `OPENCLAW_SKIP_DOCKER_BUILD=1` aus.

### Einstellbare Parameter

| Variable                               | Standard | Zweck                                                                                         |
| -------------------------------------- | -------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10       | Slot-Anzahl des Haupt-Pools für normale Lanes.                                                |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10       | Slot-Anzahl des Provider-sensiblen Tail-Pools.                                                |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9        | Begrenzung gleichzeitiger Live-Lanes, damit Provider nicht drosseln.                          |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10       | Begrenzung gleichzeitiger npm-Installations-Lanes.                                            |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7        | Begrenzung gleichzeitiger Multi-Service-Lanes.                                                |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000     | Staffelung zwischen Lane-Starts, um Docker-Daemon-Create-Spitzen zu vermeiden; `0` deaktiviert die Staffelung. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000  | Fallback-Timeout pro Lane (120 Minuten); ausgewählte Live-/Tail-Lanes verwenden engere Grenzen. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset    | `1` gibt den Scheduler-Plan aus, ohne Lanes auszuführen.                                      |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset    | Kommagetrennte exakte Lane-Liste; überspringt Cleanup-Smoke, damit Agents eine fehlgeschlagene Lane reproduzieren können. |

Eine Lane, die schwerer ist als ihre effektive Begrenzung, kann dennoch aus einem leeren Pool starten und läuft dann allein, bis sie Kapazität freigibt. Die lokale Aggregation prüft Docker vorab, entfernt veraltete OpenClaw-E2E-Container, gibt den Status aktiver Lanes aus, persistiert Lane-Timings für die Sortierung nach längsten Läufen zuerst und plant standardmäßig nach dem ersten Fehler keine neuen gepoolten Lanes mehr ein.

### Wiederverwendbarer Live-/E2E-Workflow

Der wiederverwendbare Live-/E2E-Workflow fragt `scripts/test-docker-all.mjs --plan-json`, welches Paket, welche Image-Art, welches Live-Image sowie welche Lane- und Credential-Abdeckung erforderlich sind. `scripts/docker-e2e.mjs` wandelt diesen Plan anschließend in GitHub-Ausgaben und Zusammenfassungen um. Er packt OpenClaw entweder über `scripts/package-openclaw-for-docker.mjs`, lädt ein Paketartefakt des aktuellen Laufs herunter oder lädt ein Paketartefakt aus `package_artifact_run_id` herunter; validiert das Tarball-Inventar; baut und pusht über Blacksmiths Docker-Layer-Cache paketdigest-getaggte Bare-/Functional-GHCR-Docker-E2E-Images, wenn der Plan Lanes mit installiertem Paket benötigt; und verwendet bereitgestellte Eingaben `docker_e2e_bare_image`/`docker_e2e_functional_image` oder vorhandene Paketdigest-Images erneut, statt neu zu bauen. Docker-Image-Pulls werden mit einem begrenzten Timeout von 180 Sekunden pro Versuch wiederholt, damit ein blockierter Registry-/Cache-Stream schnell erneut versucht wird, statt den Großteil des kritischen CI-Pfads zu verbrauchen.

### Release-Pfad-Chunks

Die Release-Docker-Abdeckung läuft in kleineren gechunkten Jobs mit `OPENCLAW_SKIP_DOCKER_BUILD=1`, sodass jeder Chunk nur die benötigte Image-Art zieht und mehrere Lanes über denselben gewichteten Scheduler ausführt:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Aktuelle Release-Docker-Chunks sind `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` und `plugins-runtime-install-a` bis `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` und `plugins-integrations` bleiben aggregierte Plugin-/Runtime-Aliase. Der Lane-Alias `install-e2e` bleibt der aggregierte manuelle Rerun-Alias für beide Provider-Installer-Lanes.

OpenWebUI wird in `plugins-runtime-services` integriert, wenn die vollständige Release-Pfad-Abdeckung dies anfordert, und behält nur für reine OpenWebUI-Dispatches einen eigenständigen Chunk `openwebui`. Update-Lanes für gebündelte Kanäle versuchen bei vorübergehenden npm-Netzwerkfehlern einmal erneut.

Jeder Chunk lädt `.artifacts/docker-tests/` mit Lane-Logs, Timings, `summary.json`, `failures.json`, Phasen-Timings, Scheduler-Plan-JSON, Tabellen langsamer Lanes und Rerun-Befehlen pro Lane hoch. Die Workflow-Eingabe `docker_lanes` führt ausgewählte Lanes gegen die vorbereiteten Images aus, statt die Chunk-Jobs zu verwenden. Dadurch bleibt das Debugging fehlgeschlagener Lanes auf einen gezielten Docker-Job begrenzt und das Paketartefakt wird für diesen Lauf vorbereitet, heruntergeladen oder wiederverwendet; wenn eine ausgewählte Lane eine Live-Docker-Lane ist, baut der gezielte Job das Live-Test-Image lokal für diesen Rerun. Generierte GitHub-Rerun-Befehle pro Lane enthalten `package_artifact_run_id`, `package_artifact_name` und vorbereitete Image-Eingaben, wenn diese Werte vorhanden sind, sodass eine fehlgeschlagene Lane exakt das Paket und die Images aus dem fehlgeschlagenen Lauf wiederverwenden kann.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Der geplante Live-/E2E-Workflow führt täglich die vollständige Release-Pfad-Docker-Suite aus.

## Plugin-Vorabrelease

`Plugin Prerelease` ist teurere Produkt-/Paketabdeckung und daher ein separater Workflow, der durch `Full Release Validation` oder durch einen expliziten Operator dispatcht wird. Normale Pull Requests, `main`-Pushes und eigenständige manuelle CI-Dispatches halten diese Suite deaktiviert. Er balanciert Tests für gebündelte Plugins über acht Extension-Worker; diese Extension-Shard-Jobs führen bis zu zwei Plugin-Konfigurationsgruppen gleichzeitig aus, mit einem Vitest-Worker pro Gruppe und einem größeren Node-Heap, damit importlastige Plugin-Batches keine zusätzlichen CI-Jobs erzeugen. Der release-only Docker-Prerelease-Pfad bündelt gezielte Docker-Lanes in kleinen Gruppen, um nicht Dutzende Runner für ein- bis dreiminütige Jobs zu reservieren.

## QA Lab

QA Lab hat dedizierte CI-Lanes außerhalb des Hauptworkflows mit intelligenter Scope-Begrenzung. Agentische Parität ist unter den breiten QA- und Release-Harnesses verschachtelt, nicht als eigenständiger PR-Workflow. Verwenden Sie `Full Release Validation` mit `rerun_group=qa-parity`, wenn Parität zusammen mit einem breiten Validierungslauf laufen soll.

- Der Workflow `QA-Lab - All Lanes` läuft nächtlich auf `main` und bei manuellem Dispatch; er fächert die Mock-Paritäts-Lane, die Live-Matrix-Lane sowie die Live-Lanes für Telegram und Discord als parallele Jobs auf. Live-Jobs verwenden die Umgebung `qa-live-shared`, und Telegram/Discord verwenden Convex-Leases.

Release-Prüfungen führen Matrix- und Telegram-Live-Transport-Lanes mit dem deterministischen Mock-Provider und mock-qualifizierten Modellen (`mock-openai/gpt-5.5` und `mock-openai/gpt-5.5-alt`) aus, damit der Channel-Vertrag von Live-Modelllatenz und normalem Provider-Plugin-Start isoliert ist. Das Live-Transport-Gateway deaktiviert die Speichersuche, weil die QA-Parität das Speicherverhalten separat abdeckt; Provider-Konnektivität wird durch die separaten Live-Modell-, nativen Provider- und Docker-Provider-Suiten abgedeckt.

Matrix verwendet `--profile fast` für geplante und Release-Gates und fügt `--fail-fast` nur hinzu, wenn die ausgecheckte CLI es unterstützt. Der CLI-Standard und die manuelle Workflow-Eingabe bleiben `all`; ein manueller `matrix_profile=all`-Dispatch teilt die vollständige Matrix-Abdeckung immer in `transport`-, `media`-, `e2ee-smoke`-, `e2ee-deep`- und `e2ee-cli`-Jobs auf.

`OpenClaw Release Checks` führt vor der Release-Freigabe außerdem die releasekritischen QA-Lab-Lanes aus; das QA-Paritäts-Gate führt die Kandidaten- und Baseline-Pakete als parallele Lane-Jobs aus und lädt dann beide Artefakte in einen kleinen Berichtsjob für den abschließenden Paritätsvergleich herunter.

Folgen Sie bei normalen PRs den jeweils passenden CI-/Check-Nachweisen, statt Parität als erforderlichen Status zu behandeln.

## CodeQL

Der `CodeQL`-Workflow ist bewusst ein enger Sicherheitsscanner für den ersten Durchlauf, nicht der vollständige Repository-Sweep. Tägliche, manuelle und nicht als Entwurf markierte Pull-Request-Guard-Läufe scannen Actions-Workflow-Code sowie die JavaScript-/TypeScript-Oberflächen mit dem höchsten Risiko mit hochzuverlässigen Sicherheitsabfragen, gefiltert auf hohe/kritische `security-severity`.

Der Pull-Request-Guard bleibt leichtgewichtig: Er startet nur bei Änderungen unter `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` oder `src` und führt dieselbe hochzuverlässige Sicherheitsmatrix wie der geplante Workflow aus. Android- und macOS-CodeQL bleiben außerhalb der PR-Standardeinstellungen.

### Sicherheitskategorien

| Kategorie                                         | Oberfläche                                                                                                                         |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Authentifizierung, Secrets, Sandbox, Cron und Gateway-Baseline                                                                      |
| `/codeql-security-high/channel-runtime-boundary`  | Kernverträge der Channel-Implementierung plus Channel-Plugin-Runtime, Gateway, Plugin SDK, Secrets, Audit-Berührungspunkte         |
| `/codeql-security-high/network-ssrf-boundary`     | Kernoberflächen für SSRF, IP-Parsing, Netzwerkschutz, Web-Fetch und Plugin-SDK-SSRF-Richtlinie                                    |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP-Server, Prozessausführungshelfer, ausgehende Zustellung und Gates für Agent-Tool-Ausführung                                    |
| `/codeql-security-high/plugin-trust-boundary`     | Vertrauensoberflächen für Plugin-Installation, Loader, Manifest, Registry, Paketmanager-Installation, Quellladen und Plugin-SDK-Paketvertrag |

### Plattformspezifische Sicherheits-Shards

- `CodeQL Android Critical Security` — geplanter Android-Sicherheits-Shard. Baut die Android-App manuell für CodeQL auf dem kleinsten Blacksmith-Linux-Runner, den die Workflow-Sanity akzeptiert. Lädt unter `/codeql-critical-security/android` hoch.
- `CodeQL macOS Critical Security` — wöchentlicher/manueller macOS-Sicherheits-Shard. Baut die macOS-App manuell für CodeQL auf Blacksmith macOS, filtert Ergebnisse aus Dependency-Builds aus dem hochgeladenen SARIF heraus und lädt unter `/codeql-critical-security/macos` hoch. Bleibt außerhalb der täglichen Standards, weil der macOS-Build die Laufzeit selbst bei sauberem Ergebnis dominiert.

### Kategorien für kritische Qualität

`CodeQL Critical Quality` ist der passende Nicht-Sicherheits-Shard. Er führt nur Qualitätsabfragen mit Fehler-Schweregrad ohne Sicherheitsbezug über enge, besonders wertvolle JavaScript-/TypeScript-Oberflächen auf dem kleineren Blacksmith-Linux-Runner aus. Sein Pull-Request-Guard ist bewusst kleiner als das geplante Profil: Nicht als Entwurf markierte PRs führen nur die passenden Shards `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` und `plugin-sdk-reply-runtime` für Änderungen an Code für Agent-Befehls-/Modell-/Tool-Ausführung und Antwort-Dispatch, Config-Schema/Migration/IO-Code, Authentifizierungs-/Secret-/Sandbox-/Sicherheitscode, Kern-Channel- und gebündelte Channel-Plugin-Runtime, Gateway-Protokoll/Servermethode, Speicher-Runtime/SDK-Verbindungslogik, MCP/Prozess/ausgehende Zustellung, Provider-Runtime/Modellkatalog, Sitzungsdiagnose/Zustellungswarteschlangen, Plugin-Loader, Plugin-SDK/Paketvertrag oder Plugin-SDK-Antwort-Runtime aus. Änderungen an CodeQL-Config und Qualitäts-Workflow führen alle zwölf PR-Qualitäts-Shards aus.

Manueller Dispatch akzeptiert:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Die engen Profile sind Lern- und Iterationshaken, um einen einzelnen Qualitäts-Shard isoliert auszuführen.

| Kategorie                                               | Oberfläche                                                                                                                                                         |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/codeql-critical-quality/core-auth-secrets`            | Authentifizierung, Secrets, Sandbox, Cron und Code an der Gateway-Sicherheitsgrenze                                                                                |
| `/codeql-critical-quality/config-boundary`              | Verträge für Config-Schema, Migration, Normalisierung und IO                                                                                                       |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway-Protokollschemas und Verträge für Servermethoden                                                                                                           |
| `/codeql-critical-quality/channel-runtime-boundary`     | Implementierungsverträge für Kern-Channel und gebündelte Channel-Plugins                                                                                           |
| `/codeql-critical-quality/agent-runtime-boundary`       | Befehlsausführung, Modell-/Provider-Dispatch, Auto-Reply-Dispatch und -Warteschlangen sowie ACP-Control-Plane-Runtime-Verträge                                    |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP-Server und Tool-Bridges, Prozessüberwachungshelfer und Verträge für ausgehende Zustellung                                                                      |
| `/codeql-critical-quality/memory-runtime-boundary`      | Speicher-Host-SDK, Speicher-Runtime-Fassaden, Speicher-Plugin-SDK-Aliasse, Verbindungslogik zur Aktivierung der Speicher-Runtime und Speicher-Doctor-Befehle      |
| `/codeql-critical-quality/session-diagnostics-boundary` | Interna der Antwortwarteschlange, Sitzungszustellungswarteschlangen, Helfer für Bindung/Zustellung ausgehender Sitzungen, Diagnoseereignis-/Log-Bundle-Oberflächen und Sitzungs-Doctor-CLI-Verträge |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Eingehender Antwort-Dispatch im Plugin SDK, Antwort-Payload-/Chunking-/Runtime-Helfer, Channel-Antwortoptionen, Zustellungswarteschlangen und Helfer für Sitzungs-/Thread-Bindung |
| `/codeql-critical-quality/provider-runtime-boundary`    | Modellkatalog-Normalisierung, Provider-Authentifizierung und -Discovery, Provider-Runtime-Registrierung, Provider-Standards/-Kataloge sowie Web-/Search-/Fetch-/Embedding-Registries |
| `/codeql-critical-quality/ui-control-plane`             | Control-UI-Bootstrap, lokale Persistenz, Gateway-Control-Flows und Task-Control-Plane-Runtime-Verträge                                                             |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Verträge für Kern-Web-Fetch/-Search, Medien-IO, Medienverständnis, Bildgenerierung und Mediengenerierungs-Runtime                                                  |
| `/codeql-critical-quality/plugin-boundary`              | Verträge für Loader, Registry, öffentliche Oberfläche und Plugin-SDK-Einstiegspunkte                                                                               |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Veröffentlichte paketseitige Plugin-SDK-Quelle und Helfer für Plugin-Paketverträge                                                                                |

Qualität bleibt von Sicherheit getrennt, damit Qualitätsbefunde geplant, gemessen, deaktiviert oder erweitert werden können, ohne das Sicherheitssignal zu verdecken. Die CodeQL-Erweiterung für Swift, Python und gebündelte Plugins sollte erst wieder als eng begrenzte oder geshardete Anschlussarbeit hinzugefügt werden, nachdem die engen Profile stabile Laufzeit und stabiles Signal haben.

## Wartungs-Workflows

### Docs Agent

Der `Docs Agent`-Workflow ist eine ereignisgesteuerte Codex-Wartungs-Lane, um vorhandene Dokumentation mit kürzlich gelandeten Änderungen abzugleichen. Er hat keinen reinen Zeitplan: Ein erfolgreicher Nicht-Bot-Push-CI-Lauf auf `main` kann ihn auslösen, und manueller Dispatch kann ihn direkt ausführen. Workflow-Run-Aufrufe werden übersprungen, wenn `main` weitergezogen ist oder wenn in der letzten Stunde ein anderer nicht übersprungener Docs-Agent-Lauf erstellt wurde. Wenn er läuft, prüft er den Commit-Bereich von der vorherigen nicht übersprungenen Docs-Agent-Quell-SHA bis zum aktuellen `main`, sodass ein stündlicher Lauf alle seit dem letzten Dokumentationsdurchlauf angesammelten Main-Änderungen abdecken kann.

### Test Performance Agent

Der `Test Performance Agent`-Workflow ist eine ereignisgesteuerte Codex-Wartungs-Lane für langsame Tests. Er hat keinen reinen Zeitplan: Ein erfolgreicher Nicht-Bot-Push-CI-Lauf auf `main` kann ihn auslösen, aber er wird übersprungen, wenn am selben UTC-Tag bereits ein anderer Workflow-Run-Aufruf gelaufen ist oder läuft. Manueller Dispatch umgeht dieses tägliche Aktivitäts-Gate. Die Lane erstellt einen gruppierten Vitest-Performance-Bericht für die vollständige Suite, lässt Codex nur kleine, abdeckungserhaltende Test-Performance-Fixes statt breiter Refactorings vornehmen, führt dann den vollständigen Suite-Bericht erneut aus und weist Änderungen zurück, die die Anzahl der bestandenen Baseline-Tests verringern. Wenn die Baseline fehlschlagende Tests hat, darf Codex nur offensichtliche Fehler beheben, und der vollständige Suite-Bericht nach dem Agent muss bestehen, bevor etwas committed wird. Wenn `main` weiterläuft, bevor der Bot-Push landet, rebased die Lane den validierten Patch, führt `pnpm check:changed` erneut aus und versucht den Push erneut; konfliktbehaftete veraltete Patches werden übersprungen. Sie verwendet GitHub-gehostetes Ubuntu, damit die Codex-Action dieselbe Drop-Sudo-Sicherheitshaltung wie der Docs Agent beibehalten kann.

### Doppelte PRs nach dem Merge

Der `Duplicate PRs After Merge`-Workflow ist ein manueller Maintainer-Workflow zur Bereinigung von Duplikaten nach dem Landen. Er verwendet standardmäßig einen Probelauf und schließt nur explizit aufgelistete PRs, wenn `apply=true` ist. Bevor GitHub mutiert wird, verifiziert er, dass der gelandete PR gemerged ist und dass jedes Duplikat entweder ein gemeinsam referenziertes Issue oder überlappende geänderte Hunks hat.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Lokale Check-Gates und Änderungsrouting

Die lokale Changed-Lane-Logik liegt in `scripts/changed-lanes.mjs` und wird von `scripts/check-changed.mjs` ausgeführt. Dieses lokale Check-Gate ist bei Architekturgrenzen strenger als der breite CI-Plattformumfang:

- Änderungen an der Kernproduktion führen Core-Prod- und Core-Test-Typecheck plus Core-Lint/Guards aus;
- reine Core-Test-Änderungen führen nur Core-Test-Typecheck plus Core-Lint aus;
- Änderungen an der Extension-Produktion führen Extension-Prod- und Extension-Test-Typecheck plus Extension-Lint aus;
- reine Extension-Test-Änderungen führen Extension-Test-Typecheck plus Extension-Lint aus;
- Änderungen am öffentlichen Plugin SDK oder am Plugin-Vertrag erweitern sich auf Extension-Typecheck, weil Extensions von diesen Core-Verträgen abhängen (Vitest-Extension-Sweeps bleiben explizite Testarbeit);
- reine Versionsanhebungen für Release-Metadaten führen gezielte Versions-/Config-/Root-Dependency-Prüfungen aus;
- unbekannte Root-/Config-Änderungen fallen sicherheitshalber auf alle Check-Lanes zurück.

Das lokale Routing geänderter Tests lebt in `scripts/test-projects.test-support.mjs` und ist absichtlich günstiger als `check:changed`: direkte Teständerungen führen sich selbst aus, Quelltextänderungen bevorzugen explizite Zuordnungen, danach Geschwistertests und Import-Graph-Abhängige. Die gemeinsame Delivery-Konfiguration für Gruppenräume ist eine der expliziten Zuordnungen: Änderungen an der gruppensichtbaren Reply-Konfiguration, am Source-Reply-Delivery-Modus oder am System-Prompt des Message-Tools laufen über die Core-Reply-Tests plus Discord- und Slack-Delivery-Regressionen, damit eine gemeinsame Standardänderung vor dem ersten PR-Push fehlschlägt. Verwenden Sie `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` nur, wenn die Änderung harness-weit genug ist, dass die günstige zugeordnete Menge kein vertrauenswürdiger Proxy ist.

## Testbox-Validierung

Führen Sie Testbox aus dem Repo-Root aus und bevorzugen Sie für breiten Nachweis eine frisch vorgewärmte Box. Bevor Sie ein langsames Gate auf einer Box ausführen, die wiederverwendet wurde, abgelaufen ist oder gerade eine unerwartet große Synchronisierung gemeldet hat, führen Sie zuerst `pnpm testbox:sanity` innerhalb der Box aus.

Der Sanity-Check schlägt schnell fehl, wenn erforderliche Root-Dateien wie `pnpm-lock.yaml` verschwunden sind oder wenn `git status --short` mindestens 200 nachverfolgte Löschungen zeigt. Das bedeutet normalerweise, dass der Remote-Sync-Zustand keine vertrauenswürdige Kopie des PR ist; stoppen Sie diese Box und wärmen Sie eine frische auf, statt den Produkttestfehler zu debuggen. Für absichtliche PRs mit vielen Löschungen setzen Sie `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` für diesen Sanity-Lauf.

`pnpm testbox:run` beendet außerdem eine lokale Blacksmith-CLI-Ausführung, die länger als fünf Minuten ohne Ausgabe nach der Synchronisierung in der Sync-Phase bleibt. Setzen Sie `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, um diesen Guard zu deaktivieren, oder verwenden Sie einen größeren Millisekundenwert für ungewöhnlich große lokale Diffs.

Crabbox ist der repo-eigene Remote-Box-Wrapper für Linux-Nachweise durch Maintainer. Verwenden Sie ihn, wenn eine Prüfung zu breit für einen lokalen Edit-Loop ist, wenn CI-Parität wichtig ist oder wenn der Nachweis Secrets, Docker, Package-Lanes, wiederverwendbare Boxen oder Remote-Logs benötigt. Das normale OpenClaw-Backend ist `blacksmith-testbox`; eigene AWS-/Hetzner-Kapazität ist ein Fallback bei Blacksmith-Ausfällen, Kontingentproblemen oder expliziten Tests mit eigener Kapazität.

Prüfen Sie den Wrapper vor einem ersten Lauf aus dem Repo-Root:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Der Repo-Wrapper verweigert ein veraltetes Crabbox-Binary, das `blacksmith-testbox` nicht ausweist. Übergeben Sie den Provider explizit, obwohl `.crabbox.yaml` Standards für Owned-Cloud enthält.

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

Lesen Sie die abschließende JSON-Zusammenfassung. Die nützlichen Felder sind `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` und `totalMs`. Einmalige Blacksmith-gestützte Crabbox-Läufe sollten die Testbox automatisch stoppen; wenn ein Lauf unterbrochen wird oder die Bereinigung unklar ist, prüfen Sie Live-Boxen und stoppen Sie nur die Boxen, die Sie erstellt haben:

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

Wenn Crabbox die defekte Schicht ist, Blacksmith selbst aber funktioniert, verwenden Sie direktes Blacksmith als engen Fallback:

```bash
blacksmith testbox warmup ci-check-testbox.yml --ref main --idle-timeout 90
blacksmith testbox run --id <tbx_id> "env CI=1 NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
blacksmith testbox stop --id <tbx_id>
```

Wenn `blacksmith testbox list --all` und `blacksmith testbox status` funktionieren, neue Warmups aber nach ein paar Minuten ohne IP oder Actions-Run-URL auf `queued` stehen bleiben, behandeln Sie das als Druck durch Blacksmith-Provider, Warteschlange, Abrechnung oder Organisationslimit. Stoppen Sie die von Ihnen erstellten Queue-IDs, starten Sie keine weiteren Testboxes und verlagern Sie den Nachweis auf den unten beschriebenen Pfad mit eigener Crabbox-Kapazität, während jemand das Blacksmith-Dashboard, die Abrechnung und die Organisationslimits prüft.

Eskalieren Sie nur dann auf eigene Crabbox-Kapazität, wenn Blacksmith ausgefallen ist, durch Kontingente begrenzt ist, die benötigte Umgebung fehlt oder eigene Kapazität ausdrücklich das Ziel ist:

```bash
CRABBOX_CAPACITY_REGIONS=eu-west-1,eu-west-2,eu-central-1,us-east-1,us-west-2 \
  pnpm crabbox:warmup -- --provider aws --class standard --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

Unter AWS-Druck vermeiden Sie `class=beast`, es sei denn, die Aufgabe benötigt wirklich CPU der 48xlarge-Klasse. Eine `beast`-Anforderung beginnt bei 192 vCPUs und ist der einfachste Weg, regionale EC2-Spot- oder On-Demand-Standard-Kontingente auszulösen. Die repo-eigene `.crabbox.yaml` verwendet standardmäßig `standard`, mehrere Kapazitätsregionen und `capacity.hints: true`, sodass vermittelte AWS-Leases ausgewählte Region/Market, Kontingentdruck, Spot-Fallback und Warnungen zu Klassen mit hohem Druck ausgeben. Verwenden Sie `fast` für schwerere breite Prüfungen, `large` erst, nachdem standard/fast nicht ausreichen, und `beast` nur für außergewöhnliche CPU-gebundene Lanes wie vollständige Suites oder Docker-Matrizen für alle Plugins, explizite Release-/Blocker-Validierung oder High-Core-Performance-Profiling. Verwenden Sie `beast` nicht für `pnpm check:changed`, fokussierte Tests, reine Docs-Arbeit, gewöhnliches Lint/Typecheck, kleine E2E-Reproduktionen oder Blacksmith-Ausfalltriage. Verwenden Sie `--market on-demand` für Kapazitätsdiagnosen, damit Spot-Market-Churn nicht in das Signal gemischt wird.

`.crabbox.yaml` besitzt Provider-, Sync- und GitHub-Actions-Hydrationsstandards für Owned-Cloud-Lanes. Sie schließt lokales `.git` aus, damit der hydratisierte Actions-Checkout seine eigenen Remote-Git-Metadaten behält, statt maintainer-lokale Remotes und Object Stores zu synchronisieren, und sie schließt lokale Runtime-/Build-Artefakte aus, die niemals übertragen werden sollten. `.github/workflows/crabbox-hydrate.yml` besitzt Checkout, Node-/pnpm-Setup, `origin/main`-Fetch und die nicht geheime Environment-Übergabe für Owned-Cloud-Befehle mit `crabbox run --id <cbx_id>`.

## Verwandt

- [Installationsübersicht](/de/install)
- [Entwicklungskanäle](/de/install/development-channels)
