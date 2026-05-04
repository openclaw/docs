---
read_when:
    - Sie müssen nachvollziehen, warum ein CI-Job ausgeführt wurde oder nicht
    - Sie debuggen eine fehlgeschlagene GitHub Actions-Prüfung
    - Sie koordinieren einen Durchlauf oder erneuten Durchlauf der Release-Validierung.
    - Sie ändern die ClawSweeper-Auslösung oder die Weiterleitung von GitHub-Aktivitäten
summary: CI-Jobgraph, Bereichs-Gates, Release-Dachworkflows und lokale Befehlsäquivalente
title: CI-Pipeline
x-i18n:
    generated_at: "2026-05-04T06:41:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 72959d0feaf1339f01c9da263153fd89cc4727da6f928933819931991222714d
    source_path: ci.md
    workflow: 16
---

OpenClaw CI läuft bei jedem Push nach `main` und jedem Pull Request. Der `preflight`-Job klassifiziert den Diff und deaktiviert teure Lanes, wenn sich nur nicht zusammenhängende Bereiche geändert haben. Manuelle `workflow_dispatch`-Läufe umgehen bewusst das intelligente Scoping und fächern den vollständigen Graphen für Release-Kandidaten und breite Validierung auf. Android-Lanes bleiben über `include_android` Opt-in. Release-spezifische Plugin-Abdeckung befindet sich im separaten Workflow [`Plugin-Vorabrelease`](#plugin-prerelease) und läuft nur über [`Vollständige Release-Validierung`](#full-release-validation) oder einen expliziten manuellen Dispatch.

## Pipeline-Übersicht

| Job                              | Zweck                                                                                                     | Wann er läuft                              |
| -------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `preflight`                      | Erkennt reine Docs-Änderungen, geänderte Scopes, geänderte Erweiterungen und erstellt das CI-Manifest     | Immer bei Nicht-Draft-Pushes und PRs       |
| `security-scm-fast`              | Erkennung privater Schlüssel und Workflow-Audit über `zizmor`                                             | Immer bei Nicht-Draft-Pushes und PRs       |
| `security-dependency-audit`      | Produktions-Lockfile-Audit ohne Abhängigkeiten gegen npm-Advisories                                       | Immer bei Nicht-Draft-Pushes und PRs       |
| `security-fast`                  | Erforderliches Aggregat für die schnellen Sicherheits-Jobs                                                | Immer bei Nicht-Draft-Pushes und PRs       |
| `check-dependencies`             | Produktions-Knip-Durchlauf nur für Abhängigkeiten plus Guard für die Allowlist ungenutzter Dateien        | Node-relevante Änderungen                  |
| `build-artifacts`                | Erstellt `dist/`, Control UI, Built-Artifact-Prüfungen und wiederverwendbare Downstream-Artefakte         | Node-relevante Änderungen                  |
| `checks-fast-core`               | Schnelle Linux-Korrektheits-Lanes wie gebündelte/Plugin-Vertrags-/Protokollprüfungen                     | Node-relevante Änderungen                  |
| `checks-fast-contracts-channels` | Gesplittete Channel-Vertragsprüfungen mit stabilem aggregiertem Prüfergebnis                             | Node-relevante Änderungen                  |
| `checks-node-core-test`          | Core-Node-Test-Shards, ohne Channel-, gebündelte, Vertrags- und Erweiterungs-Lanes                        | Node-relevante Änderungen                  |
| `check`                          | Gesplittetes Äquivalent zum lokalen Haupt-Gate: Prod-Typen, Lint, Guards, Testtypen und strikter Smoke    | Node-relevante Änderungen                  |
| `check-additional`               | Architektur, gesplitteter Boundary-/Prompt-Drift, Erweiterungs-Guards, Paketgrenze und Gateway Watch      | Node-relevante Änderungen                  |
| `build-smoke`                    | Built-CLI-Smoke-Tests und Startup-Memory-Smoke                                                            | Node-relevante Änderungen                  |
| `checks`                         | Verifier für Built-Artifact-Channel-Tests                                                                 | Node-relevante Änderungen                  |
| `checks-node-compat-node22`      | Node-22-Kompatibilitäts-Build und Smoke-Lane                                                              | Manueller CI-Dispatch für Releases         |
| `check-docs`                     | Docs-Formatierung, Lint und Prüfungen auf defekte Links                                                   | Docs geändert                              |
| `skills-python`                  | Ruff + pytest für Python-gestützte Skills                                                                 | Python-Skill-relevante Änderungen          |
| `checks-windows`                 | Windows-spezifische Prozess-/Pfadtests plus Regressionen bei gemeinsamen Runtime-Import-Spezifizierern    | Windows-relevante Änderungen               |
| `macos-node`                     | macOS-TypeScript-Test-Lane mit den gemeinsamen Built Artifacts                                            | macOS-relevante Änderungen                 |
| `macos-swift`                    | Swift-Lint, Build und Tests für die macOS-App                                                             | macOS-relevante Änderungen                 |
| `android`                        | Android-Unit-Tests für beide Flavors plus ein Debug-APK-Build                                             | Android-relevante Änderungen               |
| `test-performance-agent`         | Tägliche Codex-Optimierung langsamer Tests nach vertrauenswürdiger Aktivität                              | Main-CI-Erfolg oder manueller Dispatch     |
| `openclaw-performance`           | Tägliche/bedarfsweise Kova-Runtime-Performance-Berichte mit Mock-Provider-, Deep-Profile- und GPT-5.4-Live-Lanes | Geplanter und manueller Dispatch           |

## Fail-Fast-Reihenfolge

1. `preflight` entscheidet, welche Lanes überhaupt existieren. Die Logik für `docs-scope` und `changed-scope` sind Schritte innerhalb dieses Jobs, keine eigenständigen Jobs.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` und `skills-python` schlagen schnell fehl, ohne auf die schwereren Artefakt- und Plattform-Matrix-Jobs zu warten.
3. `build-artifacts` überschneidet sich mit den schnellen Linux-Lanes, damit Downstream-Consumer starten können, sobald der gemeinsame Build bereit ist.
4. Schwerere Plattform- und Runtime-Lanes fächern danach auf: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` und `android`.

GitHub kann ersetzte Jobs als `cancelled` markieren, wenn ein neuerer Push auf demselben PR- oder `main`-Ref landet. Behandeln Sie das als CI-Rauschen, sofern nicht auch der neueste Lauf für denselben Ref fehlschlägt. Aggregierte Shard-Prüfungen verwenden `!cancelled() && always()`, sodass sie normale Shard-Fehler weiterhin melden, aber nicht mehr in die Warteschlange gehen, nachdem der gesamte Workflow bereits ersetzt wurde. Der automatische CI-Concurrency-Key ist versioniert (`CI-v7-*`), damit ein GitHub-seitiger Zombie in einer alten Queue-Gruppe neuere Main-Läufe nicht unbegrenzt blockieren kann. Manuelle Läufe der vollständigen Suite verwenden `CI-manual-v1-*` und brechen laufende Läufe nicht ab.

## Scope und Routing

Die Scope-Logik befindet sich in `scripts/ci-changed-scope.mjs` und ist durch Unit-Tests in `src/scripts/ci-changed-scope.test.ts` abgedeckt. Manueller Dispatch überspringt die Erkennung geänderter Scopes und lässt das Preflight-Manifest so handeln, als hätte sich jeder gescopte Bereich geändert.

- **CI-Workflow-Änderungen** validieren den Node-CI-Graphen plus Workflow-Linting, erzwingen aber für sich genommen keine nativen Windows-, Android- oder macOS-Builds; diese Plattform-Lanes bleiben auf Plattform-Source-Änderungen beschränkt.
- **Reine CI-Routing-Änderungen, ausgewählte günstige Core-Test-Fixture-Änderungen und schmale Plugin-Vertrags-Helper-/Test-Routing-Änderungen** verwenden einen schnellen Node-only-Manifestpfad: `preflight`, Sicherheit und eine einzelne `checks-fast-core`-Aufgabe. Dieser Pfad überspringt Build-Artefakte, Node-22-Kompatibilität, Channel-Verträge, vollständige Core-Shards, Bundled-Plugin-Shards und zusätzliche Guard-Matrizen, wenn die Änderung auf die Routing- oder Helper-Oberflächen beschränkt ist, die die schnelle Aufgabe direkt ausführt.
- **Windows-Node-Prüfungen** sind auf Windows-spezifische Prozess-/Pfad-Wrapper, npm-/pnpm-/UI-Runner-Helper, Paketmanager-Konfiguration und die CI-Workflow-Oberflächen beschränkt, die diese Lane ausführen; nicht zusammenhängende Source-, Plugin-, Install-Smoke- und reine Teständerungen bleiben auf den Linux-Node-Lanes.

Die langsamsten Node-Testfamilien sind aufgeteilt oder ausbalanciert, damit jeder Job klein bleibt, ohne Runner übermäßig zu reservieren: Channel-Verträge laufen als drei gewichtete Shards, Core-Unit-Fast-/Support-Lanes laufen separat, Core-Runtime-Infrastruktur ist zwischen State- und Process-/Config-Shards aufgeteilt, Auto-Reply läuft als ausbalancierte Worker (mit dem Reply-Teilbaum aufgeteilt in Agent-Runner-, Dispatch- und Commands-/State-Routing-Shards), und agentische Gateway-/Server-Konfigurationen sind über Chat-/Auth-/Model-/HTTP-Plugin-/Runtime-/Startup-Lanes aufgeteilt, statt auf Built Artifacts zu warten. Breite Browser-, QA-, Medien- und sonstige Plugin-Tests verwenden ihre dedizierten Vitest-Konfigurationen statt des gemeinsamen Plugin-Catch-all. Include-Pattern-Shards erfassen Timing-Einträge mit dem CI-Shard-Namen, sodass `.artifacts/vitest-shard-timings.json` eine ganze Konfiguration von einem gefilterten Shard unterscheiden kann. `check-additional` hält Compile-/Canary-Arbeit zur Paketgrenze zusammen und trennt Runtime-Topologie-Architektur von Gateway-Watch-Abdeckung; die Boundary-Guard-Liste ist über vier Matrix-Shards gestreift, von denen jeder ausgewählte unabhängige Guards parallel ausführt und Timings pro Prüfung ausgibt, einschließlich `pnpm prompt:snapshots:check`, damit Prompt-Drift im Happy Path der Codex-Runtime dem PR zugeordnet bleibt, der sie verursacht hat. Gateway Watch, Channel-Tests und der Core-Support-Boundary-Shard laufen innerhalb von `build-artifacts` parallel, nachdem `dist/` und `dist-runtime/` bereits gebaut sind.

Android CI führt sowohl `testPlayDebugUnitTest` als auch `testThirdPartyDebugUnitTest` aus und erstellt anschließend das Play-Debug-APK. Der Third-Party-Flavor hat kein separates Source Set oder Manifest; seine Unit-Test-Lane kompiliert den Flavor weiterhin mit den SMS-/Anrufprotokoll-BuildConfig-Flags, vermeidet aber bei jedem Android-relevanten Push einen doppelten Debug-APK-Paketierungsjob.

Der `check-dependencies`-Shard führt `pnpm deadcode:dependencies` (einen Produktions-Knip-Durchlauf nur für Abhängigkeiten, fixiert auf die neueste Knip-Version, wobei pnpm's Mindest-Release-Alter für die `dlx`-Installation deaktiviert ist) und `pnpm deadcode:unused-files` aus, das Knips Produktionsfunde ungenutzter Dateien mit `scripts/deadcode-unused-files.allowlist.mjs` vergleicht. Der Guard für ungenutzte Dateien schlägt fehl, wenn ein PR eine neue, nicht geprüfte ungenutzte Datei hinzufügt oder einen veralteten Allowlist-Eintrag zurücklässt, während absichtlich dynamische Plugin-, generierte, Build-, Live-Test- und Paket-Bridge-Oberflächen erhalten bleiben, die Knip statisch nicht auflösen kann.

## ClawSweeper-Aktivitätsweiterleitung

`.github/workflows/clawsweeper-dispatch.yml` ist die zielseitige Bridge von OpenClaw-Repository-Aktivität zu ClawSweeper. Sie checkt keinen nicht vertrauenswürdigen Pull-Request-Code aus und führt ihn nicht aus. Der Workflow erstellt aus `CLAWSWEEPER_APP_PRIVATE_KEY` ein GitHub-App-Token und dispatcht dann kompakte `repository_dispatch`-Payloads an `openclaw/clawsweeper`.

Der Workflow hat vier Lanes:

- `clawsweeper_item` für exakte Review-Anfragen zu Issues und Pull Requests;
- `clawsweeper_comment` für explizite ClawSweeper-Befehle in Issue-Kommentaren;
- `clawsweeper_commit_review` für Review-Anfragen auf Commit-Ebene bei `main`-Pushes;
- `github_activity` für allgemeine GitHub-Aktivität, die der ClawSweeper-Agent inspizieren kann.

Die `github_activity`-Lane leitet nur normalisierte Metadaten weiter: Ereignistyp, Aktion, Akteur, Repository, Item-Nummer, URL, Titel, Status und kurze Auszüge für Kommentare oder Reviews, sofern vorhanden. Sie vermeidet bewusst die Weiterleitung des vollständigen Webhook-Bodys. Der empfangende Workflow in `openclaw/clawsweeper` ist `.github/workflows/github-activity.yml`, der das normalisierte Ereignis an den OpenClaw-Gateway-Hook für den ClawSweeper-Agent postet.

Allgemeine Aktivität ist Beobachtung, nicht standardmäßige Zustellung. Der ClawSweeper-Agent erhält das Discord-Ziel in seinem Prompt und sollte nur dann in `#clawsweeper` posten, wenn das Ereignis überraschend, handlungsrelevant, riskant oder betrieblich nützlich ist. Routinemäßige Opens, Edits, Bot-Aktivität, doppeltes Webhook-Rauschen und normaler Review-Verkehr sollten zu `NO_REPLY` führen.

Behandeln Sie GitHub-Titel, Kommentare, Bodies, Review-Text, Branch-Namen und Commit-Nachrichten in diesem gesamten Pfad als nicht vertrauenswürdige Daten. Sie sind Eingaben für Zusammenfassung und Triage, keine Anweisungen für den Workflow oder die Agent-Runtime.

## Manuelle Dispatches

Manuelle CI-Dispatches führen denselben Job-Graphen wie die normale CI aus, erzwingen jedoch jede nicht auf Android begrenzte Lane: Linux Node-Shards, gebündelte Plugin-Shards, Channel-Verträge, Node-22-Kompatibilität, `check`, `check-additional`, Build-Smoke, Dokumentationsprüfungen, Python-Skills, Windows, macOS und Control UI i18n. Eigenständige manuelle CI-Dispatches führen Android nur mit `include_android=true` aus; der vollständige Release-Umbrella aktiviert Android durch Übergabe von `include_android=true`. Statische Plugin-Prerelease-Prüfungen, der nur für Releases vorgesehene `agentic-plugins`-Shard, die vollständige Erweiterungs-Batch-Prüfung und Docker-Lanes für Plugin-Prereleases sind von der CI ausgeschlossen. Die Docker-Prerelease-Suite wird nur ausgeführt, wenn `Full Release Validation` den separaten `Plugin Prerelease`-Workflow mit aktiviertem Release-Validation-Gate dispatcht.

Manuelle Läufe verwenden eine eindeutige Concurrency-Gruppe, damit eine vollständige Suite für einen Release-Kandidaten nicht durch einen anderen Push- oder PR-Lauf auf demselben Ref abgebrochen wird. Die optionale Eingabe `target_ref` ermöglicht einem vertrauenswürdigen Aufrufer, diesen Graphen gegen einen Branch, ein Tag oder eine vollständige Commit-SHA auszuführen, während die Workflow-Datei aus dem ausgewählten Dispatch-Ref verwendet wird.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, schnelle Security-Jobs und Aggregationen (`security-scm-fast`, `security-dependency-audit`, `security-fast`), schnelle Protokoll-/Vertrags-/gebündelte Prüfungen, geshardete Channel-Vertragsprüfungen, `check`-Shards außer Lint, `check-additional`-Shards und Aggregationen, Aggregat-Prüfer für Node-Tests, Dokumentationsprüfungen, Python-Skills, workflow-sanity, labeler, auto-response; install-smoke preflight verwendet ebenfalls GitHub-gehostetes Ubuntu, damit die Blacksmith-Matrix früher eingereiht werden kann |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, weniger gewichtige Erweiterungs-Shards, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` und `check-test-types`                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux Node-Test-Shards, gebündelte Plugin-Test-Shards, `android`                                                                                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (CPU-sensitiv genug, dass 8 vCPU mehr kosteten, als sie einsparten); install-smoke-Docker-Builds (32-vCPU-Warteschlangenzeit kostete mehr, als sie einsparte)                                                                                                                                                                                                                                                                                                         |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` auf `openclaw/openclaw`; Forks fallen auf `macos-latest` zurück                                                                                                                                                                                                                                                                                                                                                                                                      |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` auf `openclaw/openclaw`; Forks fallen auf `macos-latest` zurück                                                                                                                                                                                                                                                                                                                                                                                                     |

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

`OpenClaw Performance` ist der Produkt-/Runtime-Performance-Workflow. Er läuft täglich auf `main` und kann manuell dispatcht werden:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
gh workflow run openclaw-performance.yml --ref main -f target_ref=v2026.5.2 -f profile=diagnostic -f repeat=3
```

Ein manueller Dispatch benchmarkt normalerweise den Workflow-Ref. Setzen Sie `target_ref`, um ein Release-Tag oder einen anderen Branch mit der aktuellen Workflow-Implementierung zu benchmarken. Veröffentlichte Berichtspfade und latest-Zeiger werden nach dem getesteten Ref geschlüsselt, und jede `index.md` erfasst den getesteten Ref/SHA, Workflow-Ref/SHA, Kova-Ref, Profil, Lane-Auth-Modus, Modell, Wiederholungsanzahl und Szenariofilter.

Der Workflow installiert OCM aus einem gepinnten Release und Kova aus `openclaw/Kova` mit der gepinnten Eingabe `kova_ref` und führt dann drei Lanes aus:

- `mock-provider`: Kova-Diagnoseszenarien gegen eine lokal gebaute Runtime mit deterministischer gefälschter OpenAI-kompatibler Authentifizierung.
- `mock-deep-profile`: CPU-/Heap-/Trace-Profiling für Start-, Gateway- und Agent-Turn-Hotspots.
- `live-gpt54`: ein echter OpenAI-`openai/gpt-5.4`-Agent-Turn, der übersprungen wird, wenn `OPENAI_API_KEY` nicht verfügbar ist.

Die mock-provider-Lane führt nach dem Kova-Durchlauf außerdem OpenClaw-native Source-Probes aus: Gateway-Start-Timing und Speicher über Standard-, Hook- und 50-Plugin-Startfälle hinweg; wiederholte mock-OpenAI-`channel-chat-baseline`-Hello-Loops; und CLI-Startbefehle gegen das gestartete Gateway. Die Markdown-Zusammenfassung der Source-Probe liegt unter `source/index.md` im Berichtsbundle, mit Roh-JSON daneben.

Jede Lane lädt GitHub-Artefakte hoch. Wenn `CLAWGRIT_REPORTS_TOKEN` konfiguriert ist, committet der Workflow außerdem `report.json`, `report.md`, Bundles, `index.md` und Source-Probe-Artefakte in `openclaw/clawgrit-reports` unter `openclaw-performance/<tested-ref>/<run-id>-<attempt>/<lane>/`. Der aktuelle tested-ref-Zeiger wird als `openclaw-performance/<tested-ref>/latest-<lane>.json` geschrieben.

## Vollständige Release-Validierung

`Full Release Validation` ist der manuelle Umbrella-Workflow für „alles vor dem Release ausführen“. Er akzeptiert einen Branch, ein Tag oder eine vollständige Commit-SHA, dispatcht den manuellen `CI`-Workflow mit diesem Ziel, dispatcht `Plugin Prerelease` für nur für Releases vorgesehene Plugin-/Paket-/statische/Docker-Nachweise und dispatcht `OpenClaw Release Checks` für Install-Smoke, Paketakzeptanz, Docker-Release-Pfad-Suites, Live/E2E, OpenWebUI, QA-Lab-Parität, Matrix und Telegram-Lanes. Mit `rerun_group=all` und `release_profile=full` führt er außerdem `NPM Telegram Beta E2E` gegen das Artefakt `release-package-under-test` aus den Release-Prüfungen aus. Nach der Veröffentlichung übergeben Sie `npm_telegram_package_spec`, um dieselbe Telegram-Paket-Lane gegen das veröffentlichte npm-Paket erneut auszuführen.

Siehe [Vollständige Release-Validierung](/de/reference/full-release-validation) für die
Stage-Matrix, exakten Workflow-Jobnamen, Profilunterschiede, Artefakte und
gezielte Rerun-Handles.

`OpenClaw Release Publish` ist der manuelle mutierende Release-Workflow. Dispatchen Sie ihn
von `release/YYYY.M.D` oder `main`, nachdem das Release-Tag existiert und nachdem der
OpenClaw-npm-Preflight erfolgreich war. Er verifiziert `pnpm plugins:sync:check`,
dispatcht `Plugin NPM Release` für alle veröffentlichbaren Plugin-Pakete, dispatcht
`Plugin ClawHub Release` für dieselbe Release-SHA und dispatcht erst dann
`OpenClaw NPM Release` mit der gespeicherten `preflight_run_id`.

```bash
gh workflow run openclaw-release-publish.yml \
  --ref release/YYYY.M.D \
  -f tag=vYYYY.M.D-beta.N \
  -f preflight_run_id=<successful-openclaw-npm-preflight-run-id> \
  -f npm_dist_tag=beta
```

Für einen gepinnten Commit-Nachweis auf einem sich schnell bewegenden Branch verwenden Sie den Helper anstelle von
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub-Workflow-Dispatch-Refs müssen Branches oder Tags sein, keine rohen Commit-SHAs. Der
Helper pusht einen temporären Branch `release-ci/<sha>-...` auf der Ziel-SHA,
dispatcht `Full Release Validation` von diesem gepinnten Ref, verifiziert, dass jede untergeordnete
Workflow-`headSha` dem Ziel entspricht, und löscht den temporären Branch, wenn der
Lauf abgeschlossen ist. Der Umbrella-Verifizierer schlägt außerdem fehl, wenn ein untergeordneter Workflow mit einer
anderen SHA lief.

`release_profile` steuert die Live-/Provider-Breite, die an Release-Prüfungen übergeben wird. Die
manuellen Release-Workflows verwenden standardmäßig `stable`; verwenden Sie `full` nur, wenn Sie
bewusst die breite beratende Provider-/Medienmatrix ausführen möchten.

- `minimum` behält die schnellsten OpenAI-/Core-Lanes bei, die für Releases kritisch sind.
- `stable` fügt das stabile Provider-/Backend-Set hinzu.
- `full` führt die breite beratende Provider-/Medienmatrix aus.

Der Umbrella zeichnet die IDs der gestarteten Child-Runs auf, und der abschließende Job `Verify full validation` prüft die aktuellen Ergebnisse der Child-Runs erneut und hängt Tabellen mit den langsamsten Jobs für jeden Child-Run an. Wenn ein Child-Workflow erneut ausgeführt wird und grün wird, führen Sie nur den Parent-Verifier-Job erneut aus, um das Umbrella-Ergebnis und die Timing-Zusammenfassung zu aktualisieren.

Für die Wiederherstellung akzeptieren sowohl `Full Release Validation` als auch `OpenClaw Release Checks` `rerun_group`. Verwenden Sie `all` für einen Release-Kandidaten, `ci` nur für das normale vollständige CI-Child, `plugin-prerelease` nur für das Plugin-Prerelease-Child, `release-checks` für jedes Release-Child oder eine engere Gruppe: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` oder `npm-telegram` auf dem Umbrella. Dadurch bleibt die erneute Ausführung einer fehlgeschlagenen Release-Box nach einer gezielten Korrektur begrenzt.

`OpenClaw Release Checks` verwendet die vertrauenswürdige Workflow-Referenz, um die ausgewählte Referenz einmal in ein `release-package-under-test`-Tarball aufzulösen, und übergibt dieses Artefakt dann sowohl an den Docker-Workflow für den Live-/E2E-Release-Pfad als auch an den Package-Acceptance-Shard. Dadurch bleiben die Paketbytes über Release-Boxen hinweg konsistent, und derselbe Kandidat muss nicht in mehreren Child-Jobs neu gepackt werden.

Doppelte `Full Release Validation`-Runs für `ref=main` und `rerun_group=all`
ersetzen den älteren Umbrella. Der Parent-Monitor bricht jeden Child-Workflow ab,
den er bereits gestartet hat, wenn der Parent abgebrochen wird, sodass eine neuere
Main-Validierung nicht hinter einem veralteten zweistündigen Release-Check-Run
wartet. Die Validierung von Release-Branches/-Tags und gezielte Rerun-Gruppen
behalten `cancel-in-progress: false` bei.

## Live- und E2E-Shards

Das Release-Live-/E2E-Child behält die breite native Abdeckung durch `pnpm test:live` bei, führt sie aber über `scripts/test-live-shard.mjs` als benannte Shards aus statt als einen seriellen Job:

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

Das behält dieselbe Dateiabdeckung bei und macht langsame Live-Provider-Fehler leichter erneut ausführbar und diagnostizierbar. Die aggregierten Shard-Namen `native-live-extensions-o-z`, `native-live-extensions-media` und `native-live-extensions-media-music` bleiben für manuelle Einmal-Reruns gültig.

Die nativen Live-Medien-Shards laufen in `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, gebaut vom Workflow `Live Media Runner Image`. Dieses Image installiert `ffmpeg` und `ffprobe` vor; Medien-Jobs verifizieren nur die Binärdateien vor dem Setup. Belassen Sie Docker-gestützte Live-Suites auf normalen Blacksmith-Runnern — Container-Jobs sind der falsche Ort, um verschachtelte Docker-Tests zu starten.

Docker-gestützte Live-Modell-/Backend-Shards verwenden ein separates gemeinsames Image `ghcr.io/openclaw/openclaw-live-test:<sha>` pro ausgewähltem Commit. Der Live-Release-Workflow baut und pusht dieses Image einmal; anschließend laufen die Docker-Live-Modell-, Provider-geshardeten Gateway-, CLI-Backend-, ACP-Bind- und Codex-Harness-Shards mit `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gateway-Docker-Shards tragen explizite Timeout-Obergrenzen auf Skriptebene unterhalb des Workflow-Job-Timeouts, damit ein hängender Container oder Cleanup-Pfad schnell fehlschlägt, statt das gesamte Release-Check-Budget zu verbrauchen. Wenn diese Shards das vollständige Source-Docker-Target unabhängig neu bauen, ist der Release-Run falsch konfiguriert und verschwendet Laufzeit durch doppelte Image-Builds.

## Paketabnahme

Verwenden Sie `Package Acceptance`, wenn die Frage lautet: „Funktioniert dieses installierbare OpenClaw-Paket als Produkt?“ Sie unterscheidet sich von normalem CI: Normales CI validiert den Quellbaum, während Package Acceptance ein einzelnes Tarball über denselben Docker-E2E-Harness validiert, den Benutzer nach Installation oder Update ausführen.

### Jobs

1. `resolve_package` checkt `workflow_ref` aus, löst einen Paketkandidaten auf, schreibt `.artifacts/docker-e2e-package/openclaw-current.tgz`, schreibt `.artifacts/docker-e2e-package/package-candidate.json`, lädt beide als Artefakt `package-under-test` hoch und gibt Quelle, Workflow-Referenz, Paket-Referenz, Version, SHA-256 und Profil in der GitHub-Step-Zusammenfassung aus.
2. `docker_acceptance` ruft `openclaw-live-and-e2e-checks-reusable.yml` mit `ref=workflow_ref` und `package_artifact_name=package-under-test` auf. Der wiederverwendbare Workflow lädt dieses Artefakt herunter, validiert das Tarball-Inventar, bereitet bei Bedarf Package-Digest-Docker-Images vor und führt die ausgewählten Docker-Lanes gegen dieses Paket aus, statt den Workflow-Checkout zu packen. Wenn ein Profil mehrere gezielte `docker_lanes` auswählt, bereitet der wiederverwendbare Workflow das Paket und die gemeinsamen Images einmal vor und fächert diese Lanes dann als parallele gezielte Docker-Jobs mit eindeutigen Artefakten auf.
3. `package_telegram` ruft optional `NPM Telegram Beta E2E` auf. Es läuft, wenn `telegram_mode` nicht `none` ist, und installiert dasselbe Artefakt `package-under-test`, wenn Package Acceptance eines aufgelöst hat; ein eigenständiger Telegram-Dispatch kann weiterhin eine veröffentlichte npm-Spezifikation installieren.
4. `summary` lässt den Workflow fehlschlagen, wenn die Paketauflösung, Docker Acceptance oder die optionale Telegram-Lane fehlgeschlagen ist.

### Kandidatenquellen

- `source=npm` akzeptiert nur `openclaw@beta`, `openclaw@latest` oder eine exakte OpenClaw-Release-Version wie `openclaw@2026.4.27-beta.2`. Verwenden Sie dies für die Abnahme veröffentlichter Prerelease-/Stable-Versionen.
- `source=ref` packt einen vertrauenswürdigen `package_ref`-Branch, -Tag oder vollständigen Commit-SHA. Der Resolver ruft OpenClaw-Branches/-Tags ab, verifiziert, dass der ausgewählte Commit aus der Repository-Branch-Historie oder einem Release-Tag erreichbar ist, installiert Abhängigkeiten in einem detached Worktree und packt ihn mit `scripts/package-openclaw-for-docker.mjs`.
- `source=url` lädt ein HTTPS-`.tgz` herunter; `package_sha256` ist erforderlich.
- `source=artifact` lädt ein `.tgz` aus `artifact_run_id` und `artifact_name` herunter; `package_sha256` ist optional, sollte aber für extern geteilte Artefakte angegeben werden.

Halten Sie `workflow_ref` und `package_ref` getrennt. `workflow_ref` ist der vertrauenswürdige Workflow-/Harness-Code, der den Test ausführt. `package_ref` ist der Source-Commit, der gepackt wird, wenn `source=ref` verwendet wird. Dadurch kann der aktuelle Test-Harness ältere vertrauenswürdige Source-Commits validieren, ohne alte Workflow-Logik auszuführen.

### Suite-Profile

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — vollständige Docker-Release-Pfad-Chunks mit OpenWebUI
- `custom` — exakte `docker_lanes`; erforderlich, wenn `suite_profile=custom`

Das Profil `package` verwendet Offline-Plugin-Abdeckung, sodass die Validierung veröffentlichter Pakete nicht von der Live-Verfügbarkeit von ClawHub abhängt. Die optionale Telegram-Lane verwendet das Artefakt `package-under-test` in `NPM Telegram Beta E2E` wieder; der Pfad für veröffentlichte npm-Spezifikationen bleibt für eigenständige Dispatches erhalten.

Für die dedizierte Update- und Plugin-Test-Richtlinie, einschließlich lokaler Befehle,
Docker-Lanes, Package-Acceptance-Eingaben, Release-Standards und Fehlertriage,
siehe [Updates und Plugins testen](/de/help/testing-updates-plugins).

Release-Prüfungen rufen Package Acceptance mit `source=artifact`, dem vorbereiteten Release-Paketartefakt, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=all-since-2026.4.23`, `published_upgrade_survivor_scenarios=reported-issues` und `telegram_mode=mock-openai` auf. Dadurch bleiben Paketmigration, Update, Bereinigung veralteter Plugin-Abhängigkeiten, Reparatur der Installation konfigurierter Plugins, Offline-Plugin, Plugin-Update und Telegram-Nachweis auf demselben aufgelösten Paket-Tarball. Setzen Sie `package_acceptance_package_spec` in Full Release Validation oder OpenClaw Release Checks, um dieselbe Matrix gegen ein ausgeliefertes npm-Paket statt gegen das SHA-gebaute Artefakt auszuführen. Cross-OS-Release-Prüfungen decken weiterhin betriebssystemspezifisches Onboarding-, Installer- und Plattformverhalten ab; Produktvalidierung für Paket/Update sollte mit Package Acceptance beginnen. Die Docker-Lane `published-upgrade-survivor` validiert pro Run eine veröffentlichte Paketbaseline. In Package Acceptance ist das aufgelöste Tarball `package-under-test` immer der Kandidat, und `published_upgrade_survivor_baseline` wählt die veröffentlichte Fallback-Baseline aus, standardmäßig `openclaw@latest`; Rerun-Befehle für fehlgeschlagene Lanes bewahren diese Baseline. Setzen Sie `published_upgrade_survivor_baselines=all-since-2026.4.23`, um Full Release CI auf jedes stabile npm-Release von `2026.4.23` bis `latest` auszuweiten; `release-history` bleibt für manuelles breiteres Sampling mit dem älteren Vor-Datum-Anker verfügbar. Setzen Sie `published_upgrade_survivor_scenarios=reported-issues`, um dieselben Baselines auf issue-geformte Fixtures für Feishu-Konfiguration, bewahrte Bootstrap-/Persona-Dateien, konfigurierte OpenClaw-Plugin-Installationen, Tilde-Logpfade und veraltete Legacy-Plugin-Abhängigkeitsroots auszuweiten. Der separate Workflow `Update Migration` verwendet die Docker-Lane `update-migration` mit `all-since-2026.4.23` und `plugin-deps-cleanup`, wenn die Frage umfassende Bereinigung veröffentlichter Updates ist, nicht die normale Breite von Full Release CI. Lokale Aggregat-Runs können exakte Paketspezifikationen mit `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` übergeben, eine einzelne Lane mit `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` wie `openclaw@2026.4.15` behalten oder `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` für die Szenariomatrix setzen. Die veröffentlichte Lane konfiguriert die Baseline mit einem eingebetteten `openclaw config set`-Befehlsrezept, zeichnet Rezeptschritte in `summary.json` auf und prüft `/healthz`, `/readyz` sowie den RPC-Status nach dem Gateway-Start. Die Windows-Packaged- und Installer-Fresh-Lanes verifizieren außerdem, dass ein installiertes Paket einen Browser-Control-Override aus einem rohen absoluten Windows-Pfad importieren kann. Der OpenAI-Cross-OS-Agent-Turn-Smoke verwendet standardmäßig `OPENCLAW_CROSS_OS_OPENAI_MODEL`, wenn gesetzt, andernfalls `openai/gpt-5.4`, sodass der Installations- und Gateway-Nachweis auf einem GPT-5-Testmodell bleibt und GPT-4.x-Standards vermieden werden.

### Legacy-Kompatibilitätsfenster

Package Acceptance hat begrenzte Legacy-Kompatibilitätsfenster für bereits veröffentlichte Pakete. Pakete bis einschließlich `2026.4.25`, einschließlich `2026.4.25-beta.*`, dürfen den Kompatibilitätspfad verwenden:

- bekannte private QA-Einträge in `dist/postinstall-inventory.json` dürfen auf Dateien verweisen, die im Tarball ausgelassen wurden;
- `doctor-switch` darf den Unterfall für die Persistenz von `gateway install --wrapper` überspringen, wenn das Paket dieses Flag nicht bereitstellt;
- `update-channel-switch` darf fehlende `pnpm.patchedDependencies` aus dem aus dem Tarball abgeleiteten Fake-Git-Fixture entfernen und darf fehlendes persistiertes `update.channel` protokollieren;
- Plugin-Smokes dürfen Legacy-Install-Record-Speicherorte lesen oder fehlende Persistenz des Marketplace-Install-Records akzeptieren;
- `plugin-update` darf die Migration von Konfigurationsmetadaten zulassen, muss aber weiterhin verlangen, dass Install-Record und No-Reinstall-Verhalten unverändert bleiben.

Das veröffentlichte Paket `2026.4.26` darf außerdem Warnungen für lokale Build-Metadaten-Stempeldateien ausgeben, die bereits ausgeliefert wurden. Spätere Pakete müssen die modernen Verträge erfüllen; dieselben Bedingungen schlagen dann fehl, statt zu warnen oder zu überspringen.

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

Wenn Sie einen fehlgeschlagenen Package-Acceptance-Lauf debuggen, beginnen Sie bei der Zusammenfassung `resolve_package`, um Paketquelle, Version und SHA-256 zu bestätigen. Prüfen Sie anschließend den untergeordneten Lauf `docker_acceptance` und dessen Docker-Artefakte: `.artifacts/docker-tests/**/summary.json`, `failures.json`, Lane-Logs, Phasen-Timings und Befehle für erneute Läufe. Führen Sie bevorzugt das fehlgeschlagene Paketprofil oder die exakten Docker-Lanes erneut aus, statt die vollständige Release-Validierung erneut auszuführen.

## Installations-Smoke-Test

Der separate Workflow `Install Smoke` verwendet dasselbe Scope-Skript über seinen eigenen Job `preflight` wieder. Er teilt die Smoke-Abdeckung in `run_fast_install_smoke` und `run_full_install_smoke` auf.

- **Schneller Pfad** läuft für Pull Requests, die Docker-/Paket-Oberflächen, Änderungen an Paket/Manifest gebündelter Plugins oder Core-Plugin-/Channel-/Gateway-/Plugin-SDK-Oberflächen berühren, die von den Docker-Smoke-Jobs geprüft werden. Reine Quelländerungen an gebündelten Plugins, reine Teständerungen und reine Dokumentationsänderungen reservieren keine Docker-Worker. Der schnelle Pfad baut das Root-Dockerfile-Image einmal, prüft die CLI, führt den CLI-Smoke-Test zum Löschen von Agents im gemeinsam genutzten Arbeitsbereich aus, führt den Container-Gateway-Netzwerk-E2E aus, verifiziert ein Build-Argument für eine gebündelte Erweiterung und führt das begrenzte Docker-Profil für gebündelte Plugins mit einem aggregierten Befehls-Timeout von 240 Sekunden aus (jeder Docker-Lauf eines Szenarios ist separat begrenzt).
- **Vollständiger Pfad** behält die QR-Paketinstallation sowie Installer-Docker-/Update-Abdeckung für nächtliche geplante Läufe, manuelle Dispatches, Release-Prüfungen per Workflow-Call und Pull Requests bei, die tatsächlich Installer-/Paket-/Docker-Oberflächen berühren. Im vollständigen Modus bereitet install-smoke ein GHCR-Root-Dockerfile-Smoke-Image für den Ziel-SHA vor oder verwendet es wieder und führt dann QR-Paketinstallation, Root-Dockerfile-/Gateway-Smoke-Tests, Installer-/Update-Smoke-Tests und den schnellen Docker-E2E für gebündelte Plugins als separate Jobs aus, damit Installer-Arbeit nicht hinter den Root-Image-Smoke-Tests warten muss.

`main`-Pushes (einschließlich Merge-Commits) erzwingen nicht den vollständigen Pfad; wenn die Changed-Scope-Logik bei einem Push vollständige Abdeckung anfordern würde, behält der Workflow den schnellen Docker-Smoke-Test bei und überlässt den vollständigen Installations-Smoke-Test der nächtlichen oder Release-Validierung.

Der langsame Bun-Global-Install-Image-Provider-Smoke-Test wird separat durch `run_bun_global_install_smoke` gesteuert. Er läuft im nächtlichen Zeitplan und aus dem Workflow für Release-Prüfungen heraus; manuelle `Install Smoke`-Dispatches können ihn aktivieren, Pull Requests und `main`-Pushes jedoch nicht. QR- und Installer-Docker-Tests behalten ihre eigenen installationsfokussierten Dockerfiles.

## Lokaler Docker-E2E

`pnpm test:docker:all` baut ein gemeinsam genutztes Live-Test-Image vor, packt OpenClaw einmal als npm-Tarball und baut zwei gemeinsam genutzte `scripts/e2e/Dockerfile`-Images:

- einen schlanken Node-/Git-Runner für Installer-/Update-/Plugin-Abhängigkeits-Lanes;
- ein funktionales Image, das denselben Tarball für normale Funktionalitäts-Lanes in `/app` installiert.

Docker-Lane-Definitionen befinden sich in `scripts/lib/docker-e2e-scenarios.mjs`, die Planerlogik befindet sich in `scripts/lib/docker-e2e-plan.mjs`, und der Runner führt nur den ausgewählten Plan aus. Der Scheduler wählt das Image pro Lane mit `OPENCLAW_DOCKER_E2E_BARE_IMAGE` und `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` aus und führt dann Lanes mit `OPENCLAW_SKIP_DOCKER_BUILD=1` aus.

### Einstellbare Parameter

| Variable                               | Standard | Zweck                                                                                              |
| -------------------------------------- | -------- | -------------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10       | Slot-Anzahl des Haupt-Pools für normale Lanes.                                                     |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10       | Slot-Anzahl des Provider-sensitiven Tail-Pools.                                                    |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9        | Limit für gleichzeitige Live-Lanes, damit Provider nicht drosseln.                                 |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10       | Limit für gleichzeitige npm-Installations-Lanes.                                                   |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7        | Limit für gleichzeitige Multi-Service-Lanes.                                                       |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000     | Versatz zwischen Lane-Starts, um Docker-Daemon-Create-Spitzen zu vermeiden; `0` deaktiviert ihn.   |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000  | Fallback-Timeout pro Lane (120 Minuten); ausgewählte Live-/Tail-Lanes verwenden engere Grenzen.    |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset    | `1` gibt den Scheduler-Plan aus, ohne Lanes auszuführen.                                           |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset    | Kommagetrennte exakte Lane-Liste; überspringt Cleanup-Smoke, damit Agents eine fehlgeschlagene Lane reproduzieren können. |

Eine Lane, die schwerer als ihre effektive Grenze ist, kann trotzdem aus einem leeren Pool starten und läuft dann allein, bis sie Kapazität freigibt. Die lokale Aggregation prüft Docker vorab, entfernt veraltete OpenClaw-E2E-Container, gibt den Status aktiver Lanes aus, persistiert Lane-Timings für eine längste-zuerst-Sortierung und stoppt standardmäßig die Planung neuer gepoolter Lanes nach dem ersten Fehler.

### Wiederverwendbarer Live-/E2E-Workflow

Der wiederverwendbare Live-/E2E-Workflow fragt `scripts/test-docker-all.mjs --plan-json`, welche Paket-, Image-Typ-, Live-Image-, Lane- und Credential-Abdeckung erforderlich ist. `scripts/docker-e2e.mjs` wandelt diesen Plan anschließend in GitHub-Ausgaben und Zusammenfassungen um. Er packt OpenClaw entweder über `scripts/package-openclaw-for-docker.mjs`, lädt ein Paket-Artefakt des aktuellen Laufs herunter oder lädt ein Paket-Artefakt aus `package_artifact_run_id`; validiert das Tarball-Inventar; baut und pusht paket-digest-getaggte Bare-/Functional-GHCR-Docker-E2E-Images über Blacksmiths Docker-Layer-Cache, wenn der Plan Lanes mit installiertem Paket benötigt; und verwendet bereitgestellte Eingaben `docker_e2e_bare_image`/`docker_e2e_functional_image` oder vorhandene Package-Digest-Images wieder, statt neu zu bauen. Docker-Image-Pulls werden mit einem begrenzten Timeout von 180 Sekunden pro Versuch erneut versucht, sodass ein festhängender Registry-/Cache-Stream schnell wiederholt wird, statt den Großteil des kritischen CI-Pfads zu verbrauchen.

### Release-Pfad-Chunks

Release-Docker-Abdeckung läuft in kleineren, aufgeteilten Jobs mit `OPENCLAW_SKIP_DOCKER_BUILD=1`, sodass jeder Chunk nur den benötigten Image-Typ zieht und mehrere Lanes über denselben gewichteten Scheduler ausführt:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Aktuelle Release-Docker-Chunks sind `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` und `plugins-runtime-install-a` bis `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` und `plugins-integrations` bleiben aggregierte Plugin-/Runtime-Aliasse. Der Lane-Alias `install-e2e` bleibt der aggregierte manuelle Rerun-Alias für beide Provider-Installer-Lanes.

OpenWebUI wird in `plugins-runtime-services` integriert, wenn vollständige Release-Pfad-Abdeckung dies anfordert, und behält nur für reine OpenWebUI-Dispatches einen eigenständigen Chunk `openwebui`. Update-Lanes für gebündelte Channels wiederholen bei vorübergehenden npm-Netzwerkfehlern einmal.

Jeder Chunk lädt `.artifacts/docker-tests/` mit Lane-Logs, Timings, `summary.json`, `failures.json`, Phasen-Timings, Scheduler-Plan-JSON, Tabellen langsamer Lanes und Befehlen für erneute Läufe pro Lane hoch. Die Workflow-Eingabe `docker_lanes` führt ausgewählte Lanes gegen die vorbereiteten Images aus, statt die Chunk-Jobs zu verwenden. Dadurch bleibt das Debugging fehlgeschlagener Lanes auf einen gezielten Docker-Job begrenzt und das Paket-Artefakt für diesen Lauf wird vorbereitet, heruntergeladen oder wiederverwendet; wenn eine ausgewählte Lane eine Live-Docker-Lane ist, baut der gezielte Job das Live-Test-Image lokal für diesen erneuten Lauf. Generierte GitHub-Rerun-Befehle pro Lane enthalten `package_artifact_run_id`, `package_artifact_name` und vorbereitete Image-Eingaben, sofern diese Werte vorhanden sind, sodass eine fehlgeschlagene Lane exakt dasselbe Paket und dieselben Images aus dem fehlgeschlagenen Lauf wiederverwenden kann.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Der geplante Live-/E2E-Workflow führt die vollständige Release-Pfad-Docker-Suite täglich aus.

## Plugin Prerelease

`Plugin Prerelease` ist eine aufwendigere Produkt-/Paket-Abdeckung und daher ein separater Workflow, der von `Full Release Validation` oder einem expliziten Operator ausgelöst wird. Normale Pull Requests, `main`-Pushes und eigenständige manuelle CI-Dispatches lassen diese Suite deaktiviert. Er balanciert Tests gebündelter Plugins über acht Erweiterungs-Worker; diese Erweiterungs-Shard-Jobs führen bis zu zwei Plugin-Konfigurationsgruppen gleichzeitig mit einem Vitest-Worker pro Gruppe und einem größeren Node-Heap aus, damit importlastige Plugin-Batches keine zusätzlichen CI-Jobs erzeugen. Der nur für Releases vorgesehene Docker-Prerelease-Pfad bündelt gezielte Docker-Lanes in kleinen Gruppen, um nicht Dutzende Runner für ein- bis dreiminütige Jobs zu reservieren.

## QA Lab

QA Lab verfügt über dedizierte CI-Lanes außerhalb des hauptsächlichen Smart-Scoped-Workflows. Agentische Parität ist unter den breiten QA- und Release-Harnessen verschachtelt, nicht als eigenständiger PR-Workflow. Verwenden Sie `Full Release Validation` mit `rerun_group=qa-parity`, wenn Parität mit einem breiten Validierungslauf mitlaufen soll.

- Der Workflow `QA-Lab - All Lanes` läuft nächtlich auf `main` und bei manuellem Dispatch; er fächert die Mock-Paritäts-Lane, die Live-Matrix-Lane sowie die Live-Telegram- und Live-Discord-Lanes als parallele Jobs auf. Live-Jobs verwenden die Umgebung `qa-live-shared`, und Telegram/Discord verwenden Convex-Leases.

Release-Prüfungen führen Matrix- und Telegram-Live-Transport-Lanes mit dem deterministischen Mock-Provider und mock-qualifizierten Modellen (`mock-openai/gpt-5.5` und `mock-openai/gpt-5.5-alt`) aus, sodass der Channel-Vertrag von Live-Modelllatenz und normalem Provider-Plugin-Start isoliert ist. Das Live-Transport-Gateway deaktiviert die Speichersuche, weil QA-Parität das Speicherverhalten separat abdeckt; Provider-Konnektivität wird durch die separaten Live-Modell-, nativen Provider- und Docker-Provider-Suites abgedeckt.

Matrix verwendet `--profile fast` für geplante und Release-Gates und fügt `--fail-fast` nur hinzu, wenn die ausgecheckte CLI dies unterstützt. Der CLI-Standardwert und die manuelle Workflow-Eingabe bleiben `all`; manueller Dispatch mit `matrix_profile=all` shardet die vollständige Matrix-Abdeckung immer in die Jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` und `e2ee-cli`.

`OpenClaw Release Checks` führt außerdem die release-kritischen QA-Lab-Lanes vor der Release-Genehmigung aus; sein QA-Paritäts-Gate führt Kandidaten- und Baseline-Pakete als parallele Lane-Jobs aus und lädt anschließend beide Artefakte in einen kleinen Berichtsjob für den abschließenden Paritätsvergleich herunter.

Für normale PRs folgen Sie gescopter CI-/Check-Evidenz, statt Parität als erforderlichen Status zu behandeln.

## CodeQL

Der `CodeQL`-Workflow ist bewusst ein schmaler Sicherheits-Scan im ersten Durchlauf, nicht der vollständige Repository-Durchlauf. Tägliche, manuelle und nicht als Entwurf markierte Pull-Request-Guard-Läufe scannen Actions-Workflow-Code plus die JavaScript-/TypeScript-Oberflächen mit dem höchsten Risiko mit hochzuverlässigen Sicherheitsabfragen, gefiltert auf hohe/kritische `security-severity`.

Der Pull-Request-Guard bleibt schlank: Er startet nur bei Änderungen unter `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` oder `src`, und er führt dieselbe hochzuverlässige Sicherheitsmatrix aus wie der geplante Workflow. Android- und macOS-CodeQL bleiben außerhalb der PR-Standardeinstellungen.

### Sicherheitskategorien

| Kategorie                                         | Oberfläche                                                                                                                        |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Authentifizierung, Secrets, Sandbox, Cron und Gateway-Baseline                                                                    |
| `/codeql-security-high/channel-runtime-boundary`  | Implementierungsverträge des Core-Kanals plus Channel-Plugin-Laufzeit, Gateway, Plugin SDK, Secrets, Audit-Berührungspunkte      |
| `/codeql-security-high/network-ssrf-boundary`     | Core-SSRF, IP-Parsing, Netzwerk-Guard, Web-Fetch und SSRF-Richtlinienoberflächen des Plugin SDK                                   |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP-Server, Hilfsfunktionen zur Prozessausführung, ausgehende Zustellung und Gates für die Tool-Ausführung von Agenten            |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin-Installation, Loader, Manifest, Registry, Package-Manager-Installation, Source-Loading und Vertrauensoberflächen des Plugin-SDK-Paketvertrags |

### Plattformspezifische Sicherheits-Shards

- `CodeQL Android Critical Security` — geplanter Android-Sicherheits-Shard. Baut die Android-App manuell für CodeQL auf dem kleinsten Blacksmith-Linux-Runner, der von der Workflow-Sanity-Prüfung akzeptiert wird. Lädt unter `/codeql-critical-security/android` hoch.
- `CodeQL macOS Critical Security` — wöchentlicher/manueller macOS-Sicherheits-Shard. Baut die macOS-App manuell für CodeQL auf Blacksmith macOS, filtert Build-Ergebnisse von Abhängigkeiten aus der hochgeladenen SARIF-Datei heraus und lädt unter `/codeql-critical-security/macos` hoch. Bleibt außerhalb der täglichen Standardeinstellungen, weil der macOS-Build die Laufzeit auch im sauberen Zustand dominiert.

### Critical-Quality-Kategorien

`CodeQL Critical Quality` ist der passende nicht sicherheitsbezogene Shard. Er führt nur JavaScript-/TypeScript-Qualitätsabfragen mit Error-Schweregrad und ohne Sicherheitsbezug über schmale, hochwertige Oberflächen auf dem kleineren Blacksmith-Linux-Runner aus. Sein Pull-Request-Guard ist bewusst kleiner als das geplante Profil: Nicht als Entwurf markierte PRs führen nur die passenden Shards `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` und `plugin-sdk-reply-runtime` für Änderungen an Agent-Befehls-/Modell-/Tool-Ausführung und Antwort-Dispatch-Code, Konfigurationsschema-/Migrations-/IO-Code, Authentifizierungs-/Secrets-/Sandbox-/Sicherheitscode, Core-Kanal- und gebündelter Channel-Plugin-Laufzeit, Gateway-Protokoll-/Server-Methoden, Memory-Laufzeit-/SDK-Verbindungscode, MCP-/Prozess-/ausgehender Zustellung, Provider-Laufzeit-/Modellkatalog, Sitzungsdiagnose-/Zustellungswarteschlangen, Plugin-Loader, Plugin-SDK-/Paketvertrag oder Plugin-SDK-Antwortlaufzeit aus. Änderungen an CodeQL-Konfiguration und Qualitäts-Workflow führen alle zwölf PR-Quality-Shards aus.

Manueller Dispatch akzeptiert:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Die schmalen Profile sind Lehr-/Iterations-Hooks, um einen Qualitäts-Shard isoliert auszuführen.

| Kategorie                                               | Oberfläche                                                                                                                                                                  |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Authentifizierung, Secrets, Sandbox, Cron und Code der Gateway-Sicherheitsgrenze                                                                                            |
| `/codeql-critical-quality/config-boundary`              | Konfigurationsschema, Migration, Normalisierung und IO-Verträge                                                                                                             |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway-Protokollschemata und Server-Methodenverträge                                                                                                                       |
| `/codeql-critical-quality/channel-runtime-boundary`     | Implementierungsverträge für Core-Kanal und gebündeltes Channel-Plugin                                                                                                      |
| `/codeql-critical-quality/agent-runtime-boundary`       | Befehlsausführung, Modell-/Provider-Dispatch, Auto-Reply-Dispatch und Warteschlangen sowie ACP-Control-Plane-Laufzeitverträge                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP-Server und Tool-Bridges, Hilfsfunktionen zur Prozessüberwachung und Verträge für ausgehende Zustellung                                                                  |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory Host SDK, Memory-Laufzeitfassaden, Memory-Plugin-SDK-Aliasse, Verbindungscode zur Aktivierung der Memory-Laufzeit und Memory-Doctor-Befehle                         |
| `/codeql-critical-quality/session-diagnostics-boundary` | Interna der Antwortwarteschlange, Sitzungszustellungswarteschlangen, Hilfsfunktionen für ausgehende Sitzungsbindung/-zustellung, Diagnoseereignis-/Log-Bundle-Oberflächen und CLI-Verträge des Sitzungs-Doctor |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Eingehender Antwort-Dispatch des Plugin SDK, Antwort-Payload-/Chunking-/Laufzeit-Hilfsfunktionen, Channel-Antwortoptionen, Zustellungswarteschlangen und Hilfsfunktionen zur Sitzungs-/Thread-Bindung |
| `/codeql-critical-quality/provider-runtime-boundary`    | Normalisierung des Modellkatalogs, Provider-Authentifizierung und -Discovery, Provider-Laufzeitregistrierung, Provider-Standardeinstellungen/-Kataloge sowie Web-/Search-/Fetch-/Embedding-Registries |
| `/codeql-critical-quality/ui-control-plane`             | Bootstrap der Control UI, lokale Persistenz, Gateway-Control-Flows und Task-Control-Plane-Laufzeitverträge                                                                  |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Core-Web-Fetch/Search, Medien-IO, Medienverständnis, Bildgenerierung und Laufzeitverträge für Mediengenerierung                                                             |
| `/codeql-critical-quality/plugin-boundary`              | Loader-, Registry-, Public-Surface- und Plugin-SDK-Entrypoint-Verträge                                                                                                      |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Veröffentlichter paketbasierter Plugin-SDK-Quellcode und Hilfsfunktionen für Plugin-Paketverträge                                                                          |

Quality bleibt von Security getrennt, damit Quality-Befunde geplant, gemessen, deaktiviert oder erweitert werden können, ohne das Security-Signal zu verdecken. Die Erweiterung von CodeQL für Swift, Python und gebündelte Plugins sollte erst wieder als eingegrenzte oder geshardete Folgearbeit hinzugefügt werden, nachdem die schmalen Profile stabile Laufzeit und stabile Signale haben.

## Wartungs-Workflows

### Docs Agent

Der `Docs Agent`-Workflow ist eine ereignisgesteuerte Codex-Wartungsspur, um bestehende Dokumentation mit kürzlich gelandeten Änderungen abzugleichen. Er hat keinen reinen Zeitplan: Ein erfolgreicher nicht von Bots stammender Push-CI-Lauf auf `main` kann ihn auslösen, und manueller Dispatch kann ihn direkt ausführen. Workflow-Run-Aufrufe werden übersprungen, wenn `main` weitergewandert ist oder wenn in der letzten Stunde ein anderer nicht übersprungener Docs-Agent-Lauf erstellt wurde. Wenn er läuft, überprüft er den Commit-Bereich von der vorherigen nicht übersprungenen Docs-Agent-Quell-SHA bis zum aktuellen `main`, sodass ein stündlicher Lauf alle seit dem letzten Dokumentationsdurchlauf angesammelten Main-Änderungen abdecken kann.

### Test Performance Agent

Der `Test Performance Agent`-Workflow ist eine ereignisgesteuerte Codex-Wartungsspur für langsame Tests. Er hat keinen reinen Zeitplan: Ein erfolgreicher nicht von Bots stammender Push-CI-Lauf auf `main` kann ihn auslösen, aber er wird übersprungen, wenn an diesem UTC-Tag bereits ein anderer Workflow-Run-Aufruf gelaufen ist oder gerade läuft. Manueller Dispatch umgeht dieses tägliche Aktivitäts-Gate. Die Spur erstellt einen gruppierten Vitest-Performance-Bericht für die vollständige Suite, lässt Codex nur kleine, die Abdeckung erhaltende Test-Performance-Fixes statt breiter Refactorings vornehmen, führt anschließend den Bericht für die vollständige Suite erneut aus und verwirft Änderungen, die die Baseline-Anzahl bestandener Tests verringern. Wenn die Baseline fehlschlagende Tests enthält, darf Codex nur offensichtliche Fehler beheben, und der Full-Suite-Bericht nach dem Agenten muss bestehen, bevor etwas committet wird. Wenn `main` vor dem Bot-Push weiterläuft, rebaset die Spur den validierten Patch, führt `pnpm check:changed` erneut aus und versucht den Push erneut; kollidierende veraltete Patches werden übersprungen. Sie verwendet GitHub-gehostetes Ubuntu, damit die Codex-Action dieselbe Drop-Sudo-Sicherheitshaltung wie der Docs Agent beibehalten kann.

### Duplicate PRs After Merge

Der `Duplicate PRs After Merge`-Workflow ist ein manueller Maintainer-Workflow für die Bereinigung von Duplikaten nach dem Landen. Er verwendet standardmäßig Dry-Run und schließt nur explizit aufgelistete PRs, wenn `apply=true` gesetzt ist. Vor Änderungen an GitHub überprüft er, dass der gelandete PR gemergt ist und dass jedes Duplikat entweder ein gemeinsam referenziertes Issue oder überlappende geänderte Hunks hat.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Lokale Check-Gates und Changed-Routing

Die lokale Changed-Lane-Logik liegt in `scripts/changed-lanes.mjs` und wird von `scripts/check-changed.mjs` ausgeführt. Dieses lokale Check-Gate ist bei Architekturgrenzen strenger als der breite CI-Plattformumfang:

- Änderungen an Core-Produktionscode führen Core-Prod- und Core-Test-Typecheck plus Core-Lint/-Guards aus;
- Änderungen nur an Core-Tests führen nur Core-Test-Typecheck plus Core-Lint aus;
- Änderungen an Extension-Produktionscode führen Extension-Prod- und Extension-Test-Typecheck plus Extension-Lint aus;
- Änderungen nur an Extension-Tests führen Extension-Test-Typecheck plus Extension-Lint aus;
- Änderungen am öffentlichen Plugin SDK oder an Plugin-Contracts erweitern auf Extension-Typecheck, weil Extensions von diesen Core-Verträgen abhängen (Vitest-Extension-Sweeps bleiben explizite Testarbeit);
- Release-Metadaten-only-Version-Bumps führen gezielte Versions-/Konfigurations-/Root-Abhängigkeitsprüfungen aus;
- unbekannte Root-/Konfigurationsänderungen fallen sicherheitshalber auf alle Check-Lanes zurück.

Das lokale Changed-Test-Routing liegt in `scripts/test-projects.test-support.mjs` und ist bewusst günstiger als `check:changed`: Direkte Teständerungen führen sich selbst aus, Quellcodeänderungen bevorzugen explizite Mappings, danach gleichgeordnete Tests und Import-Graph-Abhängige. Die gemeinsame Group-Room-Zustellungskonfiguration ist eines der expliziten Mappings: Änderungen an der für Gruppen sichtbaren Antwortkonfiguration, am Quell-Antwortzustellungsmodus oder am System-Prompt des Message-Tools laufen über die Core-Antworttests plus Discord- und Slack-Zustellungsregressionen, damit eine gemeinsame Standardänderung vor dem ersten PR-Push fehlschlägt. Verwenden Sie `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` nur, wenn die Änderung so harness-weit ist, dass die günstige gemappte Menge kein vertrauenswürdiger Proxy ist.

## Testbox-Validierung

Führen Sie Testbox aus dem Repo-Root aus und bevorzugen Sie für breiten Nachweis eine frisch vorgewärmte Box. Bevor Sie eine langsame Gate-Prüfung auf einer Box ausführen, die wiederverwendet wurde, abgelaufen ist oder gerade eine unerwartet große Synchronisierung gemeldet hat, führen Sie zuerst `pnpm testbox:sanity` in der Box aus.

Die Sanity-Prüfung schlägt schnell fehl, wenn erforderliche Root-Dateien wie `pnpm-lock.yaml` verschwunden sind oder wenn `git status --short` mindestens 200 nachverfolgte Löschungen anzeigt. Das bedeutet normalerweise, dass der Remote-Sync-Zustand keine vertrauenswürdige Kopie des PR ist; stoppen Sie diese Box und wärmen Sie stattdessen eine frische vor, anstatt den Produkttestfehler zu debuggen. Für absichtliche PRs mit vielen Löschungen setzen Sie für diesen Sanity-Lauf `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1`.

`pnpm testbox:run` beendet außerdem einen lokalen Blacksmith-CLI-Aufruf, der länger als fünf Minuten ohne Ausgabe nach der Synchronisierung in der Sync-Phase bleibt. Setzen Sie `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, um diesen Schutz zu deaktivieren, oder verwenden Sie einen größeren Millisekundenwert für ungewöhnlich große lokale Diffs.

Crabbox ist der repo-eigene Remote-Box-Wrapper für Linux-Nachweise durch Maintainer. Verwenden Sie ihn, wenn eine Prüfung zu breit für einen lokalen Bearbeitungs-Loop ist, wenn CI-Parität wichtig ist oder wenn der Nachweis Secrets, Docker, Paket-Lanes, wiederverwendbare Boxen oder Remote-Logs benötigt. Das normale OpenClaw-Backend ist `blacksmith-testbox`; eigene AWS/Hetzner-Kapazität ist ein Fallback für Blacksmith-Ausfälle, Quotenprobleme oder explizite Tests mit eigener Kapazität.

Prüfen Sie vor einem ersten Lauf den Wrapper aus dem Repo-Root:

```bash
pnpm crabbox:run -- --help | sed -n '1,120p'
```

Der Repo-Wrapper verweigert eine veraltete Crabbox-Binärdatei, die `blacksmith-testbox` nicht ausweist. Geben Sie den Provider explizit an, obwohl `.crabbox.yaml` Standardwerte für die eigene Cloud enthält.

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

Lesen Sie die abschließende JSON-Zusammenfassung. Die nützlichen Felder sind `provider`, `leaseId`, `syncDelegated`, `exitCode`, `commandMs` und `totalMs`. Einmalige Blacksmith-gestützte Crabbox-Läufe sollten die Testbox automatisch stoppen; wenn ein Lauf unterbrochen wurde oder die Bereinigung unklar ist, prüfen Sie die Live-Boxen und stoppen Sie nur die Boxen, die Sie erstellt haben:

```bash
blacksmith testbox list
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

Eskalieren Sie nur dann auf eigene Crabbox-Kapazität, wenn Blacksmith ausgefallen, durch Quoten begrenzt oder ohne die benötigte Umgebung ist oder wenn eigene Kapazität explizit das Ziel ist:

```bash
pnpm crabbox:warmup -- --provider aws --class beast --market on-demand --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id-or-slug>
pnpm crabbox:run -- --id <cbx_id-or-slug> --timing-json --shell -- "env NODE_OPTIONS=--max-old-space-size=4096 OPENCLAW_TEST_PROJECTS_PARALLEL=6 OPENCLAW_VITEST_MAX_WORKERS=1 OPENCLAW_VITEST_NO_OUTPUT_TIMEOUT_MS=900000 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id-or-slug>
```

`.crabbox.yaml` verwaltet die Standardwerte für Provider, Synchronisierung und GitHub-Actions-Hydratisierung für eigene Cloud-Lanes. Sie schließt lokales `.git` aus, damit der hydratisierte Actions-Checkout seine eigenen Remote-Git-Metadaten behält, anstatt maintainer-lokale Remotes und Objektspeicher zu synchronisieren, und sie schließt lokale Laufzeit-/Build-Artefakte aus, die niemals übertragen werden sollten. `.github/workflows/crabbox-hydrate.yml` verwaltet Checkout, Node-/pnpm-Einrichtung, `origin/main`-Fetch und die nicht geheime Umgebungsübergabe für eigene Cloud-Befehle vom Typ `crabbox run --id <cbx_id>`.

## Verwandt

- [Installationsübersicht](/de/install)
- [Entwicklungskanäle](/de/install/development-channels)
