---
read_when:
    - Sie müssen nachvollziehen, warum ein CI-Job ausgeführt wurde oder nicht.
    - Sie debuggen einen fehlschlagenden GitHub Actions-Check
    - Sie koordinieren einen Release-Validierungslauf oder eine erneute Ausführung
    - Sie ändern ClawSweeper-Dispatch oder die Weiterleitung von GitHub-Aktivitäten
summary: CI-Auftragsgraph, Umfangsprüfungen, Release-Sammelprüfungen und lokale Befehlsäquivalente
title: CI-Pipeline
x-i18n:
    generated_at: "2026-05-02T20:42:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: 39410c5ceb3598e9e1771f98fba79485b13967df372c7a3f55ef5a5350416435
    source_path: ci.md
    workflow: 16
---

OpenClaw-CI läuft bei jedem Push zu `main` und bei jedem Pull Request. Der `preflight`-Job klassifiziert den Diff und schaltet teure Lanes aus, wenn sich nur nicht zusammenhängende Bereiche geändert haben. Manuelle `workflow_dispatch`-Läufe umgehen das intelligente Scoping absichtlich und fächern den vollständigen Graphen für Release-Kandidaten und breite Validierung auf. Android-Lanes bleiben über `include_android` optional. Release-spezifische Plugin-Abdeckung lebt im separaten Workflow [`Plugin Prerelease`](#plugin-prerelease) und läuft nur über [`Full Release Validation`](#full-release-validation) oder einen expliziten manuellen Dispatch.

## Pipeline-Überblick

| Job                              | Zweck                                                                                                           | Wann er läuft                              |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `preflight`                      | Erkennt reine Dokumentationsänderungen, geänderte Scopes, geänderte Erweiterungen und erstellt das CI-Manifest | Immer bei Nicht-Entwurfs-Pushes und PRs    |
| `security-scm-fast`              | Erkennung privater Schlüssel und Workflow-Audit über `zizmor`                                                    | Immer bei Nicht-Entwurfs-Pushes und PRs    |
| `security-dependency-audit`      | Produktions-Lockfile-Audit ohne Dependencies gegen npm-Advisories                                                | Immer bei Nicht-Entwurfs-Pushes und PRs    |
| `security-fast`                  | Erforderliches Aggregat für die schnellen Security-Jobs                                                          | Immer bei Nicht-Entwurfs-Pushes und PRs    |
| `check-dependencies`             | Reiner Produktions-Knip-Dependency-Durchlauf plus Guard für die Allowlist ungenutzter Dateien                    | Node-relevante Änderungen                  |
| `build-artifacts`                | Erstellt `dist/`, Control UI, Built-Artifact-Prüfungen und wiederverwendbare Downstream-Artefakte                | Node-relevante Änderungen                  |
| `checks-fast-core`               | Schnelle Linux-Korrektheits-Lanes wie gebündelte/Plugin-Contract-/Protokollprüfungen                            | Node-relevante Änderungen                  |
| `checks-fast-contracts-channels` | Geshardete Channel-Contract-Prüfungen mit stabilem aggregiertem Prüfergebnis                                     | Node-relevante Änderungen                  |
| `checks-node-core-test`          | Core-Node-Test-Shards, ohne Channel-, gebündelte, Contract- und Erweiterungs-Lanes                               | Node-relevante Änderungen                  |
| `check`                          | Geshardetes Äquivalent zum lokalen Haupt-Gate: Produktions-Typen, Lint, Guards, Testtypen und strikter Smoke    | Node-relevante Änderungen                  |
| `check-additional`               | Architektur-, Boundary-, Erweiterungsoberflächen-Guards, Package-Boundary- und Gateway-Watch-Shards             | Node-relevante Änderungen                  |
| `build-smoke`                    | Built-CLI-Smoke-Tests und Startup-Memory-Smoke                                                                   | Node-relevante Änderungen                  |
| `checks`                         | Verifier für Built-Artifact-Channel-Tests                                                                        | Node-relevante Änderungen                  |
| `checks-node-compat-node22`      | Node-22-Kompatibilitäts-Build und Smoke-Lane                                                                     | Manueller CI-Dispatch für Releases         |
| `check-docs`                     | Dokumentationsformatierung, Lint und Broken-Link-Prüfungen                                                       | Dokumentation geändert                     |
| `skills-python`                  | Ruff + pytest für Python-gestützte Skills                                                                        | Python-Skill-relevante Änderungen          |
| `checks-windows`                 | Windows-spezifische Prozess-/Pfadtests plus Regressionen bei gemeinsamen Runtime-Import-Specifiern              | Windows-relevante Änderungen               |
| `macos-node`                     | macOS-TypeScript-Test-Lane mit den gemeinsamen Built-Artefakten                                                  | macOS-relevante Änderungen                 |
| `macos-swift`                    | Swift-Lint, Build und Tests für die macOS-App                                                                    | macOS-relevante Änderungen                 |
| `android`                        | Android-Unit-Tests für beide Flavors plus ein Debug-APK-Build                                                    | Android-relevante Änderungen               |
| `test-performance-agent`         | Tägliche Codex-Optimierung langsamer Tests nach vertrauenswürdiger Aktivität                                     | Main-CI-Erfolg oder manueller Dispatch     |
| `openclaw-performance`           | Tägliche/bedarfsgesteuerte Kova-Runtime-Performanceberichte mit Mock-Provider, Deep-Profile und GPT-5.4-Live-Lanes | Geplanter und manueller Dispatch        |

## Fail-Fast-Reihenfolge

1. `preflight` entscheidet, welche Lanes überhaupt existieren. Die Logik `docs-scope` und `changed-scope` sind Schritte innerhalb dieses Jobs, keine eigenständigen Jobs.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` und `skills-python` schlagen schnell fehl, ohne auf die schwereren Artefakt- und Plattform-Matrix-Jobs zu warten.
3. `build-artifacts` überlappt mit den schnellen Linux-Lanes, sodass Downstream-Consumer starten können, sobald der gemeinsame Build bereit ist.
4. Schwerere Plattform- und Runtime-Lanes fächern danach auf: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` und `android`.

GitHub kann überholte Jobs als `cancelled` markieren, wenn ein neuerer Push auf demselben PR- oder `main`-Ref landet. Behandeln Sie das als CI-Rauschen, sofern nicht auch der neueste Lauf für denselben Ref fehlschlägt. Aggregierte Shard-Prüfungen verwenden `!cancelled() && always()`, sodass sie weiterhin normale Shard-Fehler melden, aber nicht mehr in die Warteschlange gehen, nachdem der gesamte Workflow bereits überholt wurde. Der automatische CI-Concurrency-Schlüssel ist versioniert (`CI-v7-*`), sodass ein GitHub-seitiger Zombie in einer alten Queue-Gruppe neuere Main-Läufe nicht dauerhaft blockieren kann. Manuelle vollständige Suite-Läufe verwenden `CI-manual-v1-*` und brechen laufende Läufe nicht ab.

## Scope und Routing

Die Scope-Logik lebt in `scripts/ci-changed-scope.mjs` und ist durch Unit-Tests in `src/scripts/ci-changed-scope.test.ts` abgedeckt. Manueller Dispatch überspringt die Changed-Scope-Erkennung und lässt das Preflight-Manifest so handeln, als ob sich jeder gescopte Bereich geändert hätte.

- **CI-Workflow-Änderungen** validieren den Node-CI-Graphen plus Workflow-Linting, erzwingen aber für sich genommen keine nativen Windows-, Android- oder macOS-Builds; diese Plattform-Lanes bleiben auf Änderungen am Plattform-Quellcode begrenzt.
- **Reine CI-Routing-Änderungen, ausgewählte günstige Core-Test-Fixture-Änderungen und schmale Plugin-Contract-Helper-/Test-Routing-Änderungen** verwenden einen schnellen reinen Node-Manifestpfad: `preflight`, Security und eine einzelne `checks-fast-core`-Aufgabe. Dieser Pfad überspringt Build-Artefakte, Node-22-Kompatibilität, Channel-Contracts, vollständige Core-Shards, gebündelte Plugin-Shards und zusätzliche Guard-Matrizen, wenn die Änderung auf die Routing- oder Helper-Oberflächen beschränkt ist, die die schnelle Aufgabe direkt ausübt.
- **Windows-Node-Prüfungen** sind auf Windows-spezifische Prozess-/Pfad-Wrapper, npm-/pnpm-/UI-Runner-Helper, Package-Manager-Konfiguration und die CI-Workflow-Oberflächen begrenzt, die diese Lane ausführen; nicht zusammenhängende Source-, Plugin-, Install-Smoke- und reine Teständerungen bleiben auf den Linux-Node-Lanes.

Die langsamsten Node-Testfamilien sind aufgeteilt oder ausbalanciert, damit jeder Job klein bleibt, ohne Runner übermäßig zu reservieren: Channel-Contracts laufen als drei gewichtete Shards, kleine Core-Unit-Lanes werden gepaart, Auto-Reply läuft als vier ausbalancierte Worker (wobei der Reply-Teilbaum in Agent-Runner-, Dispatch- und Commands-/State-Routing-Shards aufgeteilt ist), und agentische Gateway-/Plugin-Konfigurationen werden über die bestehenden source-only agentischen Node-Jobs verteilt, statt auf Built-Artefakte zu warten. Breite Browser-, QA-, Medien- und sonstige Plugin-Tests verwenden ihre dedizierten Vitest-Konfigurationen statt des gemeinsamen Plugin-Catch-all. Include-Pattern-Shards zeichnen Timing-Einträge mit dem CI-Shard-Namen auf, sodass `.artifacts/vitest-shard-timings.json` eine ganze Konfiguration von einem gefilterten Shard unterscheiden kann. `check-additional` hält Package-Boundary-Compile-/Canary-Arbeit zusammen und trennt Runtime-Topology-Architektur von Gateway-Watch-Abdeckung; der Boundary-Guard-Shard führt seine kleinen unabhängigen Guards innerhalb eines Jobs parallel aus. Gateway-Watch, Channel-Tests und der Core-Support-Boundary-Shard laufen innerhalb von `build-artifacts` parallel, nachdem `dist/` und `dist-runtime/` bereits gebaut wurden.

Android-CI führt sowohl `testPlayDebugUnitTest` als auch `testThirdPartyDebugUnitTest` aus und baut anschließend die Play-Debug-APK. Der Third-Party-Flavor hat kein separates Source Set oder Manifest; seine Unit-Test-Lane kompiliert den Flavor weiterhin mit den SMS-/Call-Log-`BuildConfig`-Flags, vermeidet aber bei jedem Android-relevanten Push einen doppelten Debug-APK-Paketierungsjob.

Der `check-dependencies`-Shard führt `pnpm deadcode:dependencies` (einen reinen Produktions-Knip-Dependency-Durchlauf, gepinnt auf die neueste Knip-Version, wobei pnpm's Mindest-Release-Alter für die `dlx`-Installation deaktiviert ist) und `pnpm deadcode:unused-files` aus, das Knips Produktionsbefunde zu ungenutzten Dateien mit `scripts/deadcode-unused-files.allowlist.mjs` vergleicht. Der Unused-File-Guard schlägt fehl, wenn ein PR eine neue ungeprüfte ungenutzte Datei hinzufügt oder einen veralteten Allowlist-Eintrag stehen lässt, während absichtliche dynamische Plugin-, generierte, Build-, Live-Test- und Package-Bridge-Oberflächen erhalten bleiben, die Knip statisch nicht auflösen kann.

## Weiterleitung von ClawSweeper-Aktivitäten

`.github/workflows/clawsweeper-dispatch.yml` ist die zielseitige Bridge von OpenClaw-Repository-Aktivität zu ClawSweeper. Sie checkt keinen nicht vertrauenswürdigen Pull-Request-Code aus und führt ihn nicht aus. Der Workflow erstellt ein GitHub-App-Token aus `CLAWSWEEPER_APP_PRIVATE_KEY` und dispatcht anschließend kompakte `repository_dispatch`-Payloads an `openclaw/clawsweeper`.

Der Workflow hat vier Lanes:

- `clawsweeper_item` für exakte Issue- und Pull-Request-Review-Anfragen;
- `clawsweeper_comment` für explizite ClawSweeper-Befehle in Issue-Kommentaren;
- `clawsweeper_commit_review` für Review-Anfragen auf Commit-Ebene bei `main`-Pushes;
- `github_activity` für allgemeine GitHub-Aktivität, die der ClawSweeper-Agent prüfen kann.

Die Lane `github_activity` leitet nur normalisierte Metadaten weiter: Ereignistyp, Aktion, Akteur, Repository, Elementnummer, URL, Titel, Status und kurze Auszüge für Kommentare oder Reviews, falls vorhanden. Sie vermeidet absichtlich die Weiterleitung des vollständigen Webhook-Bodys. Der empfangende Workflow in `openclaw/clawsweeper` ist `.github/workflows/github-activity.yml`, der das normalisierte Ereignis an den OpenClaw-Gateway-Hook für den ClawSweeper-Agent postet.

Allgemeine Aktivität ist Beobachtung, keine standardmäßige Zustellung. Der ClawSweeper-Agent erhält das Discord-Ziel in seinem Prompt und sollte nur dann in `#clawsweeper` posten, wenn das Ereignis überraschend, handlungsrelevant, riskant oder operativ nützlich ist. Routinemäßiges Öffnen, Bearbeitungen, Bot-Fluktuation, doppeltes Webhook-Rauschen und normaler Review-Verkehr sollten zu `NO_REPLY` führen.

Behandeln Sie GitHub-Titel, Kommentare, Bodys, Review-Text, Branch-Namen und Commit-Nachrichten entlang dieses gesamten Pfads als nicht vertrauenswürdige Daten. Sie sind Eingaben für Zusammenfassung und Triage, keine Anweisungen für den Workflow oder die Agent-Runtime.

## Manuelle Dispatches

Manuelle CI-Dispatches führen denselben Jobgraphen wie normale CI aus, erzwingen aber jede nicht Android-bezogene Lane: Linux-Node-Shards, Shards für gebündelte Plugins, Channel-Verträge, Node-22-Kompatibilität, `check`, `check-additional`, Build-Smoke, Dokumentationsprüfungen, Python-Skills, Windows, macOS und Control-UI-i18n. Eigenständige manuelle CI-Dispatches führen Android nur mit `include_android=true` aus; der vollständige Release-Umbrella aktiviert Android durch Übergabe von `include_android=true`. Statische Plugin-Prerelease-Prüfungen, der nur für Releases vorgesehene `agentic-plugins`-Shard, der vollständige Batch-Sweep für Erweiterungen und Docker-Lanes für Plugin-Prereleases sind von CI ausgeschlossen. Die Docker-Prerelease-Suite läuft nur, wenn `Full Release Validation` den separaten Workflow `Plugin Prerelease` mit aktivierter Release-Validation-Gate auslöst.

Manuelle Läufe verwenden eine eindeutige Concurrency-Gruppe, sodass eine vollständige Suite für einen Release Candidate nicht durch einen anderen Push- oder PR-Lauf auf derselben Ref abgebrochen wird. Mit der optionalen Eingabe `target_ref` kann ein vertrauenswürdiger Aufrufer diesen Graphen gegen einen Branch, Tag oder vollständigen Commit-SHA ausführen, während die Workflow-Datei aus der ausgewählten Dispatch-Ref verwendet wird.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, schnelle Security-Jobs und Aggregate (`security-scm-fast`, `security-dependency-audit`, `security-fast`), schnelle Protokoll-/Vertrags-/gebündelte Prüfungen, geshardete Channel-Vertragsprüfungen, `check`-Shards außer Lint, `check-additional`-Shards und Aggregate, Aggregat-Verifizierer für Node-Tests, Dokumentationsprüfungen, Python-Skills, workflow-sanity, labeler, auto-response; install-smoke preflight nutzt ebenfalls GitHub-gehostetes Ubuntu, damit die Blacksmith-Matrix früher in die Warteschlange gehen kann |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, leichtere Erweiterungs-Shards, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` und `check-test-types`                                                                                                                                                                                                                                                                                                                |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux-Node-Test-Shards, Test-Shards für gebündelte Plugins, `android`                                                                                                                                                                                                                                                                                                                                                              |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (CPU-sensitiv genug, dass 8 vCPU mehr kosteten als sie einsparten); Docker-Builds für install-smoke (32-vCPU-Warteschlangenzeit kostete mehr als sie einspart)                                                                                                                                                                                                                                                                                         |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` auf `openclaw/openclaw`; Forks fallen auf `macos-latest` zurück                                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` auf `openclaw/openclaw`; Forks fallen auf `macos-latest` zurück                                                                                                                                                                                                                                                                                                                                                                                        |

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
```

Der Workflow installiert OCM aus einem gepinnten Release und Kova aus der gepinnten Eingabe `kova_ref` und führt dann drei Lanes aus:

- `mock-provider`: Kova-Diagnoseszenarien gegen eine Laufzeit aus lokalem Build mit deterministischer, gefälschter OpenAI-kompatibler Authentifizierung.
- `mock-deep-profile`: CPU-/Heap-/Trace-Profiling für Hotspots beim Start, Gateway und Agent-Turn.
- `live-gpt54`: ein echter Agent-Turn mit OpenAI `openai/gpt-5.4`, der übersprungen wird, wenn `OPENAI_API_KEY` nicht verfügbar ist.

Die mock-provider-Lane führt nach dem Kova-Durchlauf außerdem OpenClaw-native Quell-Probes aus: Gateway-Boot-Timing und Speicher über Standard-, Hook- und 50-Plugin-Startfälle hinweg; wiederholte mock-OpenAI-`channel-chat-baseline`-Hello-Schleifen; und CLI-Startbefehle gegen das gebootete Gateway. Die Markdown-Zusammenfassung der Quell-Probe liegt im Berichtspaket unter `source/index.md`, mit Roh-JSON daneben.

Jede Lane lädt GitHub-Artefakte hoch. Wenn `CLAWGRIT_REPORTS_TOKEN` konfiguriert ist, committet der Workflow außerdem `report.json`, `report.md`, Bundles, `index.md` und Quell-Probe-Artefakte in `openclaw/clawgrit-reports` unter `openclaw-performance/<ref>/<run-id>-<attempt>/<lane>/`. Der aktuelle Branch-Zeiger wird als `openclaw-performance/<ref>/latest-<lane>.json` geschrieben.

## Vollständige Release-Validierung

`Full Release Validation` ist der manuelle Umbrella-Workflow für „alles vor dem Release ausführen“. Er akzeptiert einen Branch, Tag oder vollständigen Commit-SHA, löst den manuellen Workflow `CI` mit diesem Ziel aus, löst `Plugin Prerelease` für nur releasebezogene Plugin-/Paket-/statische-/Docker-Nachweise aus und löst `OpenClaw Release Checks` für Install-Smoke, Paketakzeptanz, Docker-Release-Pfad-Suites, Live/E2E, OpenWebUI, QA-Lab-Parität, Matrix- und Telegram-Lanes aus. Mit `rerun_group=all` und `release_profile=full` führt er außerdem `NPM Telegram Beta E2E` gegen das Artefakt `release-package-under-test` aus den Release-Checks aus. Übergeben Sie nach der Veröffentlichung `npm_telegram_package_spec`, um dieselbe Telegram-Paket-Lane erneut gegen das veröffentlichte npm-Paket auszuführen.

Siehe [Vollständige Release-Validierung](/de/reference/full-release-validation) für die
Stage-Matrix, exakte Workflow-Jobnamen, Profilunterschiede, Artefakte und
gezielte Rerun-Handles.

`OpenClaw Release Publish` ist der manuelle, verändernde Release-Workflow. Lösen Sie ihn
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

Für gepinnten Commit-Nachweis auf einem schnelllebigen Branch verwenden Sie den Helper statt
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub-Workflow-Dispatch-Refs müssen Branches oder Tags sein, keine rohen Commit-SHAs. Der
Helper pusht einen temporären Branch `release-ci/<sha>-...` auf den Ziel-SHA,
löst `Full Release Validation` von dieser gepinnten Ref aus, verifiziert, dass jeder
untergeordnete Workflow-`headSha` dem Ziel entspricht, und löscht den temporären Branch, wenn der
Lauf abgeschlossen ist. Der Umbrella-Verifizierer schlägt ebenfalls fehl, wenn ein untergeordneter Workflow auf einem
anderen SHA lief.

`release_profile` steuert die Live-/Provider-Breite, die an Release-Checks übergeben wird. Die
manuellen Release-Workflows verwenden standardmäßig `stable`; verwenden Sie `full` nur, wenn Sie
bewusst die breite beratende Provider-/Medien-Matrix wünschen.

- `minimum` behält die schnellsten OpenAI-/Core-releasekritischen Lanes bei.
- `stable` fügt das stabile Provider-/Backend-Set hinzu.
- `full` führt die breite beratende Provider-/Medien-Matrix aus.

Der Umbrella zeichnet die ausgelösten untergeordneten Lauf-IDs auf, und der abschließende Job `Verify full validation` prüft die aktuellen Schlussfolgerungen der untergeordneten Läufe erneut und hängt Tabellen mit den langsamsten Jobs für jeden untergeordneten Lauf an. Wenn ein untergeordneter Workflow erneut ausgeführt wird und grün wird, führen Sie nur den übergeordneten Verifizierer-Job erneut aus, um das Umbrella-Ergebnis und die Timing-Zusammenfassung zu aktualisieren.

Für die Wiederherstellung akzeptieren sowohl `Full Release Validation` als auch `OpenClaw Release Checks` `rerun_group`. Verwenden Sie `all` für einen Release-Kandidaten, `ci` nur für das normale vollständige CI-Child, `plugin-prerelease` nur für das Plugin-Prerelease-Child, `release-checks` für jedes Release-Child oder eine engere Gruppe: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` oder `npm-telegram` im Umbrella. Dadurch bleibt ein erneuter Lauf einer fehlgeschlagenen Release-Box nach einer gezielten Korrektur begrenzt.

`OpenClaw Release Checks` verwendet die vertrauenswürdige Workflow-Ref, um die ausgewählte Ref einmal in einen `release-package-under-test`-Tarball aufzulösen, und übergibt dieses Artefakt dann sowohl an den Live/E2E-Docker-Workflow für den Release-Pfad als auch an den Package-Acceptance-Shard. Dadurch bleiben die Paket-Bytes über Release-Boxen hinweg konsistent, und dasselbe Kandidatenpaket muss nicht in mehreren Child-Jobs erneut gepackt werden.

Doppelte `Full Release Validation`-Läufe für `ref=main` und `rerun_group=all`
ersetzen den älteren Umbrella-Lauf. Der Parent-Monitor bricht jeden Child-Workflow ab, den er
bereits ausgelöst hat, wenn der Parent abgebrochen wird, sodass neuere Main-Validierung
nicht hinter einem veralteten zweistündigen Release-Check-Lauf wartet. Release-Branch-/Tag-
Validierung und gezielte Rerun-Gruppen behalten `cancel-in-progress: false`.

## Live- und E2E-Shards

Das Release-Live/E2E-Child behält breite native `pnpm test:live`-Abdeckung bei, führt sie aber als benannte Shards über `scripts/test-live-shard.mjs` aus, statt als einen seriellen Job:

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

Damit bleibt dieselbe Dateiabdeckung erhalten, während langsame Live-Provider-Fehler leichter erneut ausgeführt und diagnostiziert werden können. Die aggregierten Shard-Namen `native-live-extensions-o-z`, `native-live-extensions-media` und `native-live-extensions-media-music` bleiben für manuelle einmalige erneute Läufe gültig.

Die nativen Live-Medien-Shards laufen in `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, gebaut vom Workflow `Live Media Runner Image`. Dieses Image installiert `ffmpeg` und `ffprobe` vor; Medien-Jobs prüfen die Binärdateien nur vor dem Setup. Belassen Sie Docker-gestützte Live-Suiten auf normalen Blacksmith-Runnern — Container-Jobs sind der falsche Ort, um verschachtelte Docker-Tests zu starten.

Docker-gestützte Live-Modell-/Backend-Shards verwenden pro ausgewähltem Commit ein separates gemeinsames Image `ghcr.io/openclaw/openclaw-live-test:<sha>`. Der Live-Release-Workflow baut und veröffentlicht dieses Image einmal, danach laufen die Docker-Live-Modell-, Provider-geshardeten Gateway-, CLI-Backend-, ACP-Bind- und Codex-Harness-Shards mit `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gateway-Docker-Shards tragen explizite Timeout-Grenzen auf Skriptebene unterhalb des Workflow-Job-Timeouts, damit ein hängender Container oder Bereinigungspfad schnell fehlschlägt, statt das gesamte Release-Check-Budget zu verbrauchen. Wenn diese Shards das vollständige Source-Docker-Ziel unabhängig neu bauen, ist der Release-Lauf falsch konfiguriert und verschwendet Laufzeit durch doppelte Image-Builds.

## Paketakzeptanz

Verwenden Sie `Package Acceptance`, wenn die Frage lautet: „Funktioniert dieses installierbare OpenClaw-Paket als Produkt?“ Sie unterscheidet sich von normaler CI: Normale CI validiert den Source-Tree, während Paketakzeptanz einen einzelnen Tarball über dasselbe Docker-E2E-Harness validiert, das Benutzer nach Installation oder Update ausführen.

### Jobs

1. `resolve_package` checkt `workflow_ref` aus, löst einen Paketkandidaten auf, schreibt `.artifacts/docker-e2e-package/openclaw-current.tgz`, schreibt `.artifacts/docker-e2e-package/package-candidate.json`, lädt beides als Artefakt `package-under-test` hoch und gibt Quelle, Workflow-Ref, Paket-Ref, Version, SHA-256 und Profil in der GitHub-Schrittzusammenfassung aus.
2. `docker_acceptance` ruft `openclaw-live-and-e2e-checks-reusable.yml` mit `ref=workflow_ref` und `package_artifact_name=package-under-test` auf. Der wiederverwendbare Workflow lädt dieses Artefakt herunter, validiert das Tarball-Inventar, bereitet bei Bedarf Package-Digest-Docker-Images vor und führt die ausgewählten Docker-Lanes gegen dieses Paket aus, statt den Workflow-Checkout zu packen. Wenn ein Profil mehrere gezielte `docker_lanes` auswählt, bereitet der wiederverwendbare Workflow das Paket und die gemeinsamen Images einmal vor und fächert diese Lanes dann als parallele gezielte Docker-Jobs mit eindeutigen Artefakten auf.
3. `package_telegram` ruft optional `NPM Telegram Beta E2E` auf. Es läuft, wenn `telegram_mode` nicht `none` ist, und installiert dasselbe Artefakt `package-under-test`, wenn Package Acceptance eines aufgelöst hat; ein eigenständiger Telegram-Dispatch kann weiterhin eine veröffentlichte npm-Spezifikation installieren.
4. `summary` lässt den Workflow fehlschlagen, wenn Paketauflösung, Docker-Akzeptanz oder die optionale Telegram-Lane fehlgeschlagen sind.

### Kandidatenquellen

- `source=npm` akzeptiert nur `openclaw@alpha`, `openclaw@beta`, `openclaw@latest` oder eine exakte OpenClaw-Release-Version wie `openclaw@2026.4.27-beta.2`. Verwenden Sie dies für die Akzeptanz veröffentlichter Prerelease-/Stable-Pakete.
- `source=ref` packt einen vertrauenswürdigen `package_ref`-Branch, ein Tag oder eine vollständige Commit-SHA. Der Resolver ruft OpenClaw-Branches/-Tags ab, prüft, ob der ausgewählte Commit über die Repository-Branch-Historie oder ein Release-Tag erreichbar ist, installiert Abhängigkeiten in einem detached Worktree und packt ihn mit `scripts/package-openclaw-for-docker.mjs`.
- `source=url` lädt eine HTTPS-`.tgz` herunter; `package_sha256` ist erforderlich.
- `source=artifact` lädt eine `.tgz` aus `artifact_run_id` und `artifact_name` herunter; `package_sha256` ist optional, sollte aber für extern geteilte Artefakte angegeben werden.

Halten Sie `workflow_ref` und `package_ref` getrennt. `workflow_ref` ist der vertrauenswürdige Workflow-/Harness-Code, der den Test ausführt. `package_ref` ist der Source-Commit, der gepackt wird, wenn `source=ref` gesetzt ist. Dadurch kann das aktuelle Test-Harness ältere vertrauenswürdige Source-Commits validieren, ohne alte Workflow-Logik auszuführen.

### Suite-Profile

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — vollständige Docker-Release-Pfad-Chunks mit OpenWebUI
- `custom` — exakte `docker_lanes`; erforderlich, wenn `suite_profile=custom`

Das Profil `package` verwendet Offline-Plugin-Abdeckung, damit die Validierung veröffentlichter Pakete nicht von Live-Verfügbarkeit von ClawHub abhängt. Die optionale Telegram-Lane verwendet das Artefakt `package-under-test` in `NPM Telegram Beta E2E` wieder; der Pfad für veröffentlichte npm-Spezifikationen bleibt für eigenständige Dispatches erhalten.

Die dedizierte Test-Richtlinie für Updates und Plugins, einschließlich lokaler Befehle,
Docker-Lanes, Package-Acceptance-Eingaben, Release-Defaults und Fehlertriage,
finden Sie unter [Updates und Plugins testen](/de/help/testing-updates-plugins).

Release-Prüfungen rufen Package Acceptance mit `source=artifact`, dem vorbereiteten Release-Paketartefakt, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=all-since-2026.4.23`, `published_upgrade_survivor_scenarios=reported-issues` und `telegram_mode=mock-openai` auf. Dadurch bleiben Paketmigration, Update, Bereinigung veralteter Plugin-Abhängigkeiten, Reparatur konfigurierter Plugin-Installationen, Offline-Plugin, Plugin-Update und Telegram-Nachweis auf demselben aufgelösten Paket-Tarball. Setzen Sie `package_acceptance_package_spec` in Full Release Validation oder OpenClaw Release Checks, um dieselbe Matrix gegen ein ausgeliefertes npm-Paket statt gegen das aus der SHA gebaute Artefakt auszuführen. Cross-OS-Release-Prüfungen decken weiterhin OS-spezifisches Onboarding, Installer- und Plattformverhalten ab; Produktvalidierung für Paket/Update sollte mit Package Acceptance beginnen. Die Docker-Lane `published-upgrade-survivor` validiert pro Lauf eine veröffentlichte Paket-Baseline. In Package Acceptance ist der aufgelöste `package-under-test`-Tarball immer der Kandidat, und `published_upgrade_survivor_baseline` wählt die veröffentlichte Fallback-Baseline aus, standardmäßig `openclaw@latest`; Rerun-Befehle für fehlgeschlagene Lanes behalten diese Baseline bei. Setzen Sie `published_upgrade_survivor_baselines=all-since-2026.4.23`, um Full Release CI über jede stabile npm-Version von `2026.4.23` bis `latest` zu erweitern; `release-history` bleibt für manuelles breiteres Sampling mit dem älteren Vor-Datum-Anker verfügbar. Setzen Sie `published_upgrade_survivor_scenarios=reported-issues`, um dieselben Baselines über Issue-förmige Fixtures für Feishu-Konfiguration, beibehaltene Bootstrap-/Persona-Dateien, konfigurierte OpenClaw-Plugin-Installationen, Tilde-Logpfade und veraltete Legacy-Plugin-Abhängigkeitswurzeln zu erweitern. Der separate Workflow `Update Migration` verwendet die Docker-Lane `update-migration` mit `all-since-2026.4.23` und `plugin-deps-cleanup`, wenn es um vollständige Bereinigung veröffentlichter Updates geht, nicht um die normale Breite von Full Release CI. Lokale aggregierte Läufe können exakte Paketspezifikationen mit `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` übergeben, eine einzelne Lane mit `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` wie `openclaw@2026.4.15` beibehalten oder `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` für die Szenario-Matrix setzen. Die veröffentlichte Lane konfiguriert die Baseline mit einem eingebetteten `openclaw config set`-Befehlsrezept, zeichnet Rezeptschritte in `summary.json` auf und prüft `/healthz`, `/readyz` sowie den RPC-Status nach dem Gateway-Start. Die frischen Windows-Paket- und Installer-Lanes prüfen außerdem, dass ein installiertes Paket einen Browser-Control-Override aus einem rohen absoluten Windows-Pfad importieren kann. Der OpenAI-Cross-OS-Agent-Turn-Smoke verwendet standardmäßig `OPENCLAW_CROSS_OS_OPENAI_MODEL`, wenn gesetzt, andernfalls `openai/gpt-5.4`, sodass Installations- und Gateway-Nachweis auf einem GPT-5-Testmodell bleiben und GPT-4.x-Defaults vermieden werden.

### Legacy-Kompatibilitätsfenster

Package Acceptance hat begrenzte Legacy-Kompatibilitätsfenster für bereits veröffentlichte Pakete. Pakete bis einschließlich `2026.4.25`, einschließlich `2026.4.25-beta.*`, dürfen den Kompatibilitätspfad verwenden:

- bekannte private QA-Einträge in `dist/postinstall-inventory.json` dürfen auf Dateien zeigen, die im Tarball ausgelassen wurden;
- `doctor-switch` darf den Persistenz-Subcase `gateway install --wrapper` überspringen, wenn das Paket dieses Flag nicht bereitstellt;
- `update-channel-switch` darf fehlende `pnpm.patchedDependencies` aus dem aus dem Tarball abgeleiteten gefälschten Git-Fixture entfernen und fehlende persistierte `update.channel` protokollieren;
- Plugin-Smokes dürfen Legacy-Installationsdatensatz-Standorte lesen oder fehlende Marketplace-Installationsdatensatz-Persistenz akzeptieren;
- `plugin-update` darf die Migration von Konfigurationsmetadaten erlauben, während weiterhin verlangt wird, dass Installationsdatensatz und Verhalten ohne Neuinstallation unverändert bleiben.

Das veröffentlichte Paket `2026.4.26` darf außerdem vor lokalen Build-Metadaten-Stempeldateien warnen, die bereits ausgeliefert wurden. Spätere Pakete müssen die modernen Verträge erfüllen; dieselben Bedingungen schlagen dann fehl, statt zu warnen oder übersprungen zu werden.

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

Beginnen Sie beim Debuggen eines fehlgeschlagenen Package-Acceptance-Laufs mit der Zusammenfassung `resolve_package`, um Paketquelle, Version und SHA-256 zu bestätigen. Prüfen Sie anschließend den untergeordneten Lauf `docker_acceptance` und seine Docker-Artefakte: `.artifacts/docker-tests/**/summary.json`, `failures.json`, Lane-Logs, Phasenzeiten und Befehle zum erneuten Ausführen. Führen Sie bevorzugt das fehlgeschlagene Paketprofil oder die exakten Docker-Lanes erneut aus, statt die vollständige Release-Validierung erneut zu starten.

## Installations-Smoke-Test

Der separate Workflow `Install Smoke` verwendet dasselbe Scope-Skript über seinen eigenen `preflight`-Job wieder. Er teilt die Smoke-Abdeckung in `run_fast_install_smoke` und `run_full_install_smoke` auf.

- **Schneller Pfad** läuft für Pull Requests, die Docker-/Paketoberflächen, gebündelte Plugin-Paket-/Manifeständerungen oder zentrale Plugin-/Channel-/Gateway-/Plugin-SDK-Oberflächen betreffen, die von den Docker-Smoke-Jobs geprüft werden. Reine Quelländerungen an gebündelten Plugins, reine Teständerungen und reine Dokumentationsänderungen reservieren keine Docker-Worker. Der schnelle Pfad baut das Root-Dockerfile-Image einmal, prüft die CLI, führt den CLI-Smoke-Test zum Löschen von Agents mit gemeinsamem Workspace aus, führt das Container-Gateway-Network-E2E aus, verifiziert ein Build-Argument für gebündelte Erweiterungen und führt das begrenzte Docker-Profil für gebündelte Plugins unter einem aggregierten Befehls-Timeout von 240 Sekunden aus (jeder Docker-Lauf eines Szenarios wird separat begrenzt).
- **Vollständiger Pfad** behält QR-Paketinstallation sowie Installer-Docker-/Update-Abdeckung für nächtliche geplante Läufe, manuelle Dispatches, Workflow-Call-Release-Prüfungen und Pull Requests bei, die tatsächlich Installer-/Paket-/Docker-Oberflächen betreffen. Im vollständigen Modus bereitet install-smoke ein GHCR-Root-Dockerfile-Smoke-Image für die Ziel-SHA vor oder verwendet es wieder und führt dann QR-Paketinstallation, Root-Dockerfile-/Gateway-Smokes, Installer-/Update-Smokes und das schnelle gebündelte Plugin-Docker-E2E als separate Jobs aus, damit Installer-Arbeit nicht hinter den Root-Image-Smokes warten muss.

`main`-Pushes (einschließlich Merge-Commits) erzwingen nicht den vollständigen Pfad; wenn die Changed-Scope-Logik bei einem Push vollständige Abdeckung anfordern würde, behält der Workflow den schnellen Docker-Smoke-Test bei und überlässt den vollständigen Install-Smoke-Test der nächtlichen oder Release-Validierung.

Der langsame Bun-Global-Install-Image-Provider-Smoke-Test wird separat durch `run_bun_global_install_smoke` gesteuert. Er läuft nach dem nächtlichen Zeitplan und aus dem Release-Checks-Workflow heraus, und manuelle `Install Smoke`-Dispatches können ihn aktivieren, Pull Requests und `main`-Pushes jedoch nicht. QR- und Installer-Docker-Tests behalten ihre eigenen installationsfokussierten Dockerfiles.

## Lokales Docker-E2E

`pnpm test:docker:all` baut ein gemeinsames Live-Test-Image vor, packt OpenClaw einmal als npm-Tarball und baut zwei gemeinsame `scripts/e2e/Dockerfile`-Images:

- einen einfachen Node-/Git-Runner für Installer-/Update-/Plugin-Abhängigkeits-Lanes;
- ein funktionales Image, das denselben Tarball für normale Funktions-Lanes in `/app` installiert.

Docker-Lane-Definitionen befinden sich in `scripts/lib/docker-e2e-scenarios.mjs`, die Planner-Logik in `scripts/lib/docker-e2e-plan.mjs`, und der Runner führt nur den ausgewählten Plan aus. Der Scheduler wählt das Image pro Lane mit `OPENCLAW_DOCKER_E2E_BARE_IMAGE` und `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` aus und führt Lanes dann mit `OPENCLAW_SKIP_DOCKER_BUILD=1` aus.

### Konfigurierbare Parameter

| Variable                               | Standard | Zweck                                                                                         |
| -------------------------------------- | -------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10       | Slot-Anzahl des Haupt-Pools für normale Lanes.                                                |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10       | Provider-sensible Slot-Anzahl des Tail-Pools.                                                 |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9        | Begrenzung paralleler Live-Lanes, damit Provider nicht drosseln.                              |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10       | Begrenzung paralleler npm-Install-Lanes.                                                      |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7        | Begrenzung paralleler Multi-Service-Lanes.                                                    |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000     | Verzögerung zwischen Lane-Starts, um Docker-Daemon-Erstellungsstürme zu vermeiden; setzen Sie `0` für keine Verzögerung. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000  | Fallback-Timeout pro Lane (120 Minuten); ausgewählte Live-/Tail-Lanes verwenden engere Grenzen. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | nicht gesetzt | `1` gibt den Scheduler-Plan aus, ohne Lanes auszuführen.                                  |
| `OPENCLAW_DOCKER_ALL_LANES`            | nicht gesetzt | Kommagetrennte exakte Lane-Liste; überspringt Cleanup-Smoke, damit Agents eine fehlgeschlagene Lane reproduzieren können. |

Eine Lane, die schwerer ist als ihre effektive Grenze, kann dennoch aus einem leeren Pool starten und läuft dann allein, bis sie Kapazität freigibt. Die lokale Aggregation prüft Docker vorab, entfernt veraltete OpenClaw-E2E-Container, gibt den Status aktiver Lanes aus, speichert Lane-Zeiten für Longest-First-Sortierung und beendet standardmäßig nach dem ersten Fehler die Planung neuer gepoolter Lanes.

### Wiederverwendbarer Live-/E2E-Workflow

Der wiederverwendbare Live-/E2E-Workflow fragt `scripts/test-docker-all.mjs --plan-json`, welche Paket-, Image-Art-, Live-Image-, Lane- und Zugangsdatenabdeckung erforderlich ist. `scripts/docker-e2e.mjs` wandelt diesen Plan dann in GitHub-Ausgaben und Zusammenfassungen um. Er packt OpenClaw entweder über `scripts/package-openclaw-for-docker.mjs`, lädt ein Paketartefakt aus dem aktuellen Lauf herunter oder lädt ein Paketartefakt aus `package_artifact_run_id`; validiert das Tarball-Inventar; baut und pusht paket-digest-getaggte Bare-/Functional-GHCR-Docker-E2E-Images über Blacksmiths Docker-Layer-Cache, wenn der Plan Lanes mit installiertem Paket benötigt; und verwendet bereitgestellte Eingaben `docker_e2e_bare_image`/`docker_e2e_functional_image` oder vorhandene Paket-Digest-Images wieder, statt neu zu bauen. Docker-Image-Pulls werden mit einem begrenzten Timeout von 180 Sekunden pro Versuch erneut versucht, damit ein hängender Registry-/Cache-Stream schnell erneut versucht wird, statt den größten Teil des kritischen CI-Pfads zu verbrauchen.

### Release-Pfad-Chunks

Release-Docker-Abdeckung läuft in kleineren gechunkten Jobs mit `OPENCLAW_SKIP_DOCKER_BUILD=1`, sodass jeder Chunk nur die benötigte Image-Art zieht und mehrere Lanes über denselben gewichteten Scheduler ausführt:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Aktuelle Release-Docker-Chunks sind `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` und `plugins-runtime-install-a` bis `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` und `plugins-integrations` bleiben aggregierte Plugin-/Runtime-Aliasse. Der Lane-Alias `install-e2e` bleibt der aggregierte manuelle Rerun-Alias für beide Provider-Installer-Lanes.

OpenWebUI wird in `plugins-runtime-services` zusammengeführt, wenn vollständige Release-Pfad-Abdeckung dies anfordert, und behält nur für reine OpenWebUI-Dispatches einen eigenständigen `openwebui`-Chunk. Update-Lanes für gebündelte Channels versuchen transiente npm-Netzwerkfehler einmal erneut.

Jeder Chunk lädt `.artifacts/docker-tests/` mit Lane-Logs, Zeiten, `summary.json`, `failures.json`, Phasenzeiten, Scheduler-Plan-JSON, Slow-Lane-Tabellen und Befehlen zum erneuten Ausführen pro Lane hoch. Die Workflow-Eingabe `docker_lanes` führt ausgewählte Lanes gegen die vorbereiteten Images statt der Chunk-Jobs aus. Dadurch bleibt das Debuggen fehlgeschlagener Lanes auf einen gezielten Docker-Job begrenzt und das Paketartefakt für diesen Lauf wird vorbereitet, heruntergeladen oder wiederverwendet; wenn eine ausgewählte Lane eine Live-Docker-Lane ist, baut der gezielte Job das Live-Test-Image lokal für diesen erneuten Lauf. Generierte GitHub-Befehle zum erneuten Ausführen pro Lane enthalten `package_artifact_run_id`, `package_artifact_name` und Eingaben für vorbereitete Images, wenn diese Werte vorhanden sind, sodass eine fehlgeschlagene Lane das exakte Paket und die exakten Images aus dem fehlgeschlagenen Lauf wiederverwenden kann.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Der geplante Live-/E2E-Workflow führt die vollständige Release-Pfad-Docker-Suite täglich aus.

## Plugin-Prerelease

`Plugin Prerelease` ist aufwendigere Produkt-/Paketabdeckung und daher ein separater Workflow, der von `Full Release Validation` oder durch einen expliziten Operator ausgelöst wird. Normale Pull Requests, `main`-Pushes und eigenständige manuelle CI-Dispatches lassen diese Suite deaktiviert. Er verteilt gebündelte Plugin-Tests auf acht Erweiterungs-Worker; diese Erweiterungs-Shard-Jobs führen bis zu zwei Plugin-Konfigurationsgruppen gleichzeitig mit einem Vitest-Worker pro Gruppe und einem größeren Node-Heap aus, damit importlastige Plugin-Batches keine zusätzlichen CI-Jobs erzeugen. Der release-exklusive Docker-Prerelease-Pfad bündelt gezielte Docker-Lanes in kleinen Gruppen, um nicht Dutzende Runner für Jobs von ein bis drei Minuten zu reservieren.

## QA Lab

QA Lab hat dedizierte CI-Lanes außerhalb des zentralen smart gescopten Workflows. Agentische Parität ist unter den breiten QA- und Release-Harnesses verschachtelt, nicht als eigenständiger PR-Workflow. Verwenden Sie `Full Release Validation` mit `rerun_group=qa-parity`, wenn Parität zusammen mit einem breiten Validierungslauf laufen soll.

- Der Workflow `QA-Lab - All Lanes` läuft nächtlich auf `main` und bei manuellem Dispatch; er fächert die Mock-Paritäts-Lane, die Live-Matrix-Lane sowie die Live-Telegram- und Discord-Lanes als parallele Jobs auf. Live-Jobs verwenden die Umgebung `qa-live-shared`, und Telegram/Discord verwenden Convex-Leases.

Release-Prüfungen führen Matrix- und Telegram-Live-Transport-Lanes mit dem deterministischen Mock-Provider und mock-qualifizierten Modellen (`mock-openai/gpt-5.5` und `mock-openai/gpt-5.5-alt`) aus, sodass der Channel-Vertrag von Live-Modell-Latenz und normalem Start des Provider-Plugins isoliert ist. Das Live-Transport-Gateway deaktiviert die Speichersuche, weil QA-Parität Speicherverhalten separat abdeckt; Provider-Konnektivität wird durch die separaten Live-Modell-, nativen Provider- und Docker-Provider-Suites abgedeckt.

Matrix verwendet `--profile fast` für geplante und Release-Gates und fügt `--fail-fast` nur hinzu, wenn die ausgecheckte CLI dies unterstützt. Der CLI-Standard und die manuelle Workflow-Eingabe bleiben `all`; ein manueller Dispatch mit `matrix_profile=all` shardet die vollständige Matrix-Abdeckung immer in die Jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` und `e2ee-cli`.

`OpenClaw Release Checks` führt außerdem die release-kritischen QA-Lab-Lanes vor der Release-Freigabe aus; sein QA-Paritäts-Gate führt Kandidaten- und Baseline-Pakete als parallele Lane-Jobs aus und lädt dann beide Artefakte in einen kleinen Report-Job für den finalen Paritätsvergleich herunter.

Für normale PRs folgen Sie gescopten CI-/Check-Nachweisen, statt Parität als erforderlichen Status zu behandeln.

## CodeQL

Der `CodeQL`-Workflow ist absichtlich ein schmaler Security-Scanner für den ersten Durchlauf, nicht der vollständige Repository-Sweep. Tägliche, manuelle und nicht als Entwurf markierte Pull-Request-Guard-Läufe scannen Actions-Workflow-Code sowie die JavaScript-/TypeScript-Bereiche mit dem höchsten Risiko, mit High-Confidence-Sicherheitsabfragen, die auf hohe/kritische `security-severity` gefiltert sind.

Der Pull-Request-Guard bleibt leichtgewichtig: Er startet nur bei Änderungen unter `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` oder `src` und führt dieselbe High-Confidence-Sicherheitsmatrix aus wie der geplante Workflow. Android- und macOS-CodeQL bleiben außerhalb der PR-Standardwerte.

### Sicherheitskategorien

| Kategorie                                         | Bereich                                                                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, Secrets, Sandbox, Cron und Gateway-Basis                                                                                      |
| `/codeql-security-high/channel-runtime-boundary`  | Kernverträge der Kanalimplementierung plus Kanal-Plugin-Laufzeit, Gateway, Plugin SDK, Secrets und Audit-Berührungspunkte           |
| `/codeql-security-high/network-ssrf-boundary`     | Kernbereiche für SSRF, IP-Parsing, Netzwerk-Guard, Web-Fetch und Plugin-SDK-SSRF-Richtlinien                                        |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP-Server, Hilfsfunktionen für Prozessausführung, ausgehende Zustellung und Gates für Agent-Tool-Ausführung                        |
| `/codeql-security-high/plugin-trust-boundary`     | Vertrauensbereiche für Plugin-Installation, Loader, Manifest, Registry, Paketmanager-Installation, Quellladen und Plugin-SDK-Paketvertrag |

### Plattformspezifische Sicherheits-Shards

- `CodeQL Android Critical Security` — geplanter Android-Sicherheits-Shard. Baut die Android-App manuell für CodeQL auf dem kleinsten Blacksmith-Linux-Runner, den die Workflow-Sanity akzeptiert. Lädt unter `/codeql-critical-security/android` hoch.
- `CodeQL macOS Critical Security` — wöchentlicher/manueller macOS-Sicherheits-Shard. Baut die macOS-App manuell für CodeQL auf Blacksmith macOS, filtert Build-Ergebnisse von Abhängigkeiten aus dem hochgeladenen SARIF heraus und lädt unter `/codeql-critical-security/macos` hoch. Bleibt außerhalb der täglichen Standardwerte, weil der macOS-Build die Laufzeit selbst bei sauberem Lauf dominiert.

### Critical-Quality-Kategorien

`CodeQL Critical Quality` ist der entsprechende Nicht-Sicherheits-Shard. Er führt nur JavaScript-/TypeScript-Qualitätsabfragen mit Error-Schweregrad und ohne Sicherheitsbezug über schmale, hochwertige Bereiche auf dem kleineren Blacksmith-Linux-Runner aus. Sein Pull-Request-Guard ist absichtlich kleiner als das geplante Profil: Nicht als Entwurf markierte PRs führen nur die passenden Shards `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` und `plugin-sdk-reply-runtime` für Änderungen an Agent-Befehls-/Modell-/Tool-Ausführung und Antwort-Dispatch-Code, Config-Schema-/Migrations-/IO-Code, Auth-/Secrets-/Sandbox-/Security-Code, Kernkanal- und gebündelter Kanal-Plugin-Laufzeit, Gateway-Protokoll-/Servermethoden, Memory-Laufzeit/SDK-Verknüpfung, MCP/Prozess/ausgehender Zustellung, Provider-Laufzeit/Modellkatalog, Sitzungsdiagnostik/Zustellungswarteschlangen, Plugin-Loader, Plugin-SDK/Paketvertrag oder Plugin-SDK-Antwortlaufzeit aus. CodeQL-Config- und Qualitäts-Workflow-Änderungen führen alle zwölf PR-Qualitäts-Shards aus.

Manuelle Auslösung akzeptiert:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Die schmalen Profile sind Lehr-/Iterations-Hooks, um einen Qualitäts-Shard isoliert auszuführen.

| Kategorie                                               | Bereich                                                                                                                                                            |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/codeql-critical-quality/core-auth-secrets`            | Auth, Secrets, Sandbox, Cron und Code der Gateway-Sicherheitsgrenze                                                                                                |
| `/codeql-critical-quality/config-boundary`              | Config-Schema, Migration, Normalisierung und IO-Verträge                                                                                                          |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway-Protokollschemata und Servermethoden-Verträge                                                                                                             |
| `/codeql-critical-quality/channel-runtime-boundary`     | Implementierungsverträge für Kernkanal und gebündelte Kanal-Plugins                                                                                               |
| `/codeql-critical-quality/agent-runtime-boundary`       | Befehlsausführung, Modell-/Provider-Dispatch, Auto-Reply-Dispatch und -Warteschlangen sowie ACP-Control-Plane-Laufzeitverträge                                    |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP-Server und Tool-Bridges, Hilfsfunktionen für Prozessüberwachung und Verträge für ausgehende Zustellung                                                         |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory-Host-SDK, Memory-Laufzeitfassaden, Memory-Plugin-SDK-Aliase, Verknüpfung zur Aktivierung der Memory-Laufzeit und Memory-Doctor-Befehle                     |
| `/codeql-critical-quality/session-diagnostics-boundary` | Interna der Antwortwarteschlange, Sitzungszustellungswarteschlangen, Hilfsfunktionen für ausgehende Sitzungsbindung/-zustellung, Diagnoseereignis-/Log-Bundle-Bereiche und Session-Doctor-CLI-Verträge |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Eingehender Antwort-Dispatch im Plugin SDK, Hilfsfunktionen für Antwort-Payload/Chunking/Laufzeit, Kanalantwortoptionen, Zustellungswarteschlangen und Hilfsfunktionen für Sitzungs-/Thread-Bindung |
| `/codeql-critical-quality/provider-runtime-boundary`    | Modellkatalog-Normalisierung, Provider-Authentifizierung und -Discovery, Provider-Laufzeitregistrierung, Provider-Standardwerte/-Kataloge und Web-/Search-/Fetch-/Embedding-Registries |
| `/codeql-critical-quality/ui-control-plane`             | Control-UI-Bootstrap, lokale Persistenz, Gateway-Control-Flows und Task-Control-Plane-Laufzeitverträge                                                            |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Kernverträge für Web-Fetch/Search, Medien-IO, Medienverständnis, Bildgenerierung und Mediengenerierungslaufzeit                                                    |
| `/codeql-critical-quality/plugin-boundary`              | Loader-, Registry-, Public-Surface- und Plugin-SDK-Entrypoint-Verträge                                                                                             |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Veröffentlichte paket-seitige Plugin-SDK-Quelle und Hilfsfunktionen für Plugin-Paketverträge                                                                      |

Qualität bleibt von Sicherheit getrennt, damit Qualitätsbefunde geplant, gemessen, deaktiviert oder erweitert werden können, ohne das Sicherheitssignal zu verdecken. Swift-, Python- und gebündelte-Plugin-CodeQL-Erweiterung sollte erst dann wieder als bereichsbezogene oder geshardete Folgearbeit hinzugefügt werden, wenn die schmalen Profile stabile Laufzeit und stabiles Signal haben.

## Wartungs-Workflows

### Docs Agent

Der `Docs Agent`-Workflow ist eine ereignisgesteuerte Codex-Wartungslane, um bestehende Dokumentation mit kürzlich gelandeten Änderungen abzugleichen. Er hat keinen reinen Zeitplan: Ein erfolgreicher Nicht-Bot-Push-CI-Lauf auf `main` kann ihn auslösen, und manuelle Auslösung kann ihn direkt starten. Workflow-Run-Aufrufe werden übersprungen, wenn `main` weitergezogen ist oder wenn in der letzten Stunde ein anderer nicht übersprungener Docs-Agent-Lauf erstellt wurde. Wenn er läuft, prüft er den Commit-Bereich vom vorherigen nicht übersprungenen Docs-Agent-Quell-SHA bis zum aktuellen `main`, sodass ein stündlicher Lauf alle seit dem letzten Dokumentationsdurchlauf angesammelten Main-Änderungen abdecken kann.

### Test Performance Agent

Der `Test Performance Agent`-Workflow ist eine ereignisgesteuerte Codex-Wartungslane für langsame Tests. Er hat keinen reinen Zeitplan: Ein erfolgreicher Nicht-Bot-Push-CI-Lauf auf `main` kann ihn auslösen, aber er wird übersprungen, wenn an diesem UTC-Tag bereits ein anderer Workflow-Run-Aufruf gelaufen ist oder läuft. Manuelle Auslösung umgeht dieses tägliche Aktivitäts-Gate. Die Lane erstellt einen gruppierten Vitest-Performance-Bericht für die gesamte Suite, lässt Codex nur kleine, Coverage-erhaltende Test-Performance-Fixes statt breiter Refactorings durchführen, führt anschließend den Bericht für die gesamte Suite erneut aus und weist Änderungen zurück, die die Anzahl der bestandenen Baseline-Tests reduzieren. Wenn die Baseline fehlgeschlagene Tests hat, darf Codex nur offensichtliche Fehler beheben, und der Full-Suite-Bericht nach dem Agent muss bestehen, bevor etwas committed wird. Wenn `main` fortschreitet, bevor der Bot-Push landet, rebased die Lane den validierten Patch, führt `pnpm check:changed` erneut aus und wiederholt den Push; widersprüchliche veraltete Patches werden übersprungen. Sie verwendet GitHub-gehostetes Ubuntu, damit die Codex-Action dieselbe Drop-Sudo-Sicherheitshaltung wie der Docs Agent beibehalten kann.

### Doppelte PRs nach Merge

Der `Duplicate PRs After Merge`-Workflow ist ein manueller Maintainer-Workflow für die Bereinigung doppelter PRs nach dem Landen. Er ist standardmäßig ein Dry-Run und schließt nur ausdrücklich aufgelistete PRs, wenn `apply=true` ist. Bevor er GitHub verändert, verifiziert er, dass der gelandete PR gemergt ist und dass jeder Duplikat-PR entweder ein gemeinsam referenziertes Issue oder überlappende geänderte Hunks hat.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Lokale Check-Gates und Changed-Routing

Die lokale Changed-Lane-Logik lebt in `scripts/changed-lanes.mjs` und wird von `scripts/check-changed.mjs` ausgeführt. Dieses lokale Check-Gate ist bei Architekturgrenzen strenger als der breite CI-Plattformumfang:

- Änderungen an Core-Produktionscode führen Core-Prod- und Core-Test-Typecheck plus Core-Lint/Guards aus;
- reine Core-Teständerungen führen nur Core-Test-Typecheck plus Core-Lint aus;
- Änderungen an Plugin-Produktionscode führen Plugin-Prod- und Plugin-Test-Typecheck plus Plugin-Lint aus;
- reine Plugin-Teständerungen führen Plugin-Test-Typecheck plus Plugin-Lint aus;
- Änderungen am öffentlichen Plugin SDK oder an Plugin-Verträgen erweitern auf Plugin-Typecheck, weil Plugins von diesen Core-Verträgen abhängen (Vitest-Plugin-Sweeps bleiben explizite Testarbeit);
- reine Release-Metadaten-Versionsbumps führen gezielte Version-/Config-/Root-Dependency-Checks aus;
- unbekannte Root-/Config-Änderungen fallen sicherheitshalber auf alle Check-Lanes zurück.

Lokales Changed-Test-Routing lebt in `scripts/test-projects.test-support.mjs` und ist absichtlich günstiger als `check:changed`: Direkte Teständerungen führen sich selbst aus, Quelländerungen bevorzugen explizite Zuordnungen, dann Geschwistertests und Import-Graph-Abhängige. Die gemeinsame Group-Room-Zustellungs-Config ist eine der expliziten Zuordnungen: Änderungen an der Config für sichtbare Gruppenantworten, am Quell-Antwortzustellungsmodus oder am System-Prompt des Message-Tools werden durch die Core-Antworttests plus Discord- und Slack-Zustellungsregressionen geroutet, damit eine gemeinsame Standardänderung vor dem ersten PR-Push fehlschlägt. Verwenden Sie `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` nur, wenn die Änderung harness-weit genug ist, dass die günstige zugeordnete Menge kein vertrauenswürdiger Proxy ist.

## Testbox-Validierung

Führen Sie Testbox aus dem Repo-Root aus und bevorzugen Sie für umfassende Nachweise eine frisch vorgewärmte Box. Bevor Sie eine langsame Prüfung auf einer Box ausführen, die wiederverwendet wurde, abgelaufen ist oder gerade einen unerwartet großen Sync gemeldet hat, führen Sie zuerst `pnpm testbox:sanity` innerhalb der Box aus.

Der Sanity-Check schlägt schnell fehl, wenn erforderliche Root-Dateien wie `pnpm-lock.yaml` verschwunden sind oder wenn `git status --short` mindestens 200 nachverfolgte Löschungen zeigt. Das bedeutet normalerweise, dass der Remote-Sync-Status keine vertrauenswürdige Kopie des PR ist; stoppen Sie diese Box und wärmen Sie eine frische vor, statt den Produkttestfehler zu debuggen. Für PRs mit absichtlich vielen Löschungen setzen Sie `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` für diesen Sanity-Lauf.

`pnpm testbox:run` beendet außerdem einen lokalen Blacksmith-CLI-Aufruf, der länger als fünf Minuten in der Sync-Phase bleibt, ohne nach dem Sync Ausgaben zu liefern. Setzen Sie `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0`, um diese Schutzfunktion zu deaktivieren, oder verwenden Sie für ungewöhnlich große lokale Diffs einen größeren Millisekundenwert.

Crabbox ist der repo-eigene zweite Remote-Box-Pfad für Linux-Nachweise, wenn Blacksmith nicht verfügbar ist oder wenn eigene Cloud-Kapazität vorzuziehen ist. Wärmen Sie eine Box vor, hydratisieren Sie sie über den Projektworkflow und führen Sie dann Befehle über die Crabbox-CLI aus:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` verwaltet Provider-, Sync- und GitHub-Actions-Hydration-Defaults. Sie schließt das lokale `.git` aus, damit der hydratisierte Actions-Checkout seine eigenen Remote-Git-Metadaten behält, statt maintainer-lokale Remotes und Objektspeicher zu synchronisieren, und sie schließt lokale Laufzeit-/Build-Artefakte aus, die niemals übertragen werden sollten. `.github/workflows/crabbox-hydrate.yml` verwaltet Checkout, Node-/pnpm-Einrichtung, `origin/main`-Fetch und die nicht geheime Umgebungsübergabe, die spätere `crabbox run --id <cbx_id>`-Befehle als Quelle verwenden.

## Verwandt

- [Installationsüberblick](/de/install)
- [Entwicklungskanäle](/de/install/development-channels)
