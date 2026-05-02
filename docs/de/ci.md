---
read_when:
    - Sie müssen nachvollziehen, warum ein CI-Job ausgeführt wurde oder nicht
    - Sie debuggen einen fehlgeschlagenen GitHub Actions-Check
    - Sie koordinieren einen Release-Validierungslauf oder eine erneute Ausführung
    - Sie ändern den ClawSweeper-Dispatch oder die Weiterleitung von GitHub-Aktivitäten
summary: CI-Job-Graph, bereichsbezogene Gates, Release-Sammelprüfungen und lokale Befehlsäquivalente
title: CI-Pipeline
x-i18n:
    generated_at: "2026-05-02T22:17:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: a8033b928b26adfa340200ea69fd63d339a6e65c21659b8119a68b23b8b16016
    source_path: ci.md
    workflow: 16
---

OpenClaw CI läuft bei jedem Push auf `main` und bei jedem Pull Request. Der `preflight`-Job klassifiziert das Diff und deaktiviert teure Lanes, wenn sich nur nicht zugehörige Bereiche geändert haben. Manuelle `workflow_dispatch`-Läufe umgehen bewusst das intelligente Scoping und fächern den vollständigen Graphen für Release-Kandidaten und breite Validierung auf. Android-Lanes bleiben über `include_android` optional. Release-exklusive Plugin-Abdeckung befindet sich im separaten Workflow [`Plugin-Prerelease`](#plugin-prerelease) und läuft nur über [`vollständige Release-Validierung`](#full-release-validation) oder einen expliziten manuellen Dispatch.

## Pipeline-Übersicht

| Job                              | Zweck                                                                                                               | Wann er läuft                         |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| `preflight`                      | Erkennt reine Dokumentationsänderungen, geänderte Scopes, geänderte Erweiterungen und erstellt das CI-Manifest      | Immer bei Nicht-Entwurfs-Pushes und PRs |
| `security-scm-fast`              | Erkennung privater Schlüssel und Workflow-Audit über `zizmor`                                                       | Immer bei Nicht-Entwurfs-Pushes und PRs |
| `security-dependency-audit`      | Abhängigkeitsfreier Produktions-Lockfile-Audit gegen npm-Advisories                                                 | Immer bei Nicht-Entwurfs-Pushes und PRs |
| `security-fast`                  | Erforderliches Aggregat für die schnellen Sicherheitsjobs                                                           | Immer bei Nicht-Entwurfs-Pushes und PRs |
| `check-dependencies`             | Reiner Produktions-Knip-Abhängigkeitsdurchlauf plus Allowlist-Schutz für ungenutzte Dateien                         | Node-relevante Änderungen             |
| `build-artifacts`                | Erstellt `dist/`, Control UI, Prüfungen gebauter Artefakte und wiederverwendbare Downstream-Artefakte               | Node-relevante Änderungen             |
| `checks-fast-core`               | Schnelle Linux-Korrektheits-Lanes wie gebündelte/Plugin-Vertrags-/Protokollprüfungen                               | Node-relevante Änderungen             |
| `checks-fast-contracts-channels` | Gesplittete Channel-Vertragsprüfungen mit stabilem aggregiertem Prüfergebnis                                        | Node-relevante Änderungen             |
| `checks-node-core-test`          | Core-Node-Test-Shards, ohne Channel-, gebündelte, Vertrags- und Erweiterungs-Lanes                                  | Node-relevante Änderungen             |
| `check`                          | Gesplittetes Äquivalent zum lokalen Haupt-Gate: Produktionstypen, Lint, Guards, Testtypen und strikter Smoke-Test   | Node-relevante Änderungen             |
| `check-additional`               | Architektur, Grenzen, Prompt-Snapshot-Drift, Erweiterungsflächen-Guards, Paketgrenzen und Gateway-Watch-Shards      | Node-relevante Änderungen             |
| `build-smoke`                    | Smoke-Tests der gebauten CLI und Smoke-Test für Startspeicher                                                       | Node-relevante Änderungen             |
| `checks`                         | Verifizierer für Channel-Tests mit gebauten Artefakten                                                              | Node-relevante Änderungen             |
| `checks-node-compat-node22`      | Node-22-Kompatibilitäts-Build und Smoke-Lane                                                                        | Manueller CI-Dispatch für Releases    |
| `check-docs`                     | Dokumentationsformatierung, Lint und Broken-Link-Prüfungen                                                          | Dokumentation geändert                |
| `skills-python`                  | Ruff + pytest für Python-gestützte Skills                                                                           | Python-Skill-relevante Änderungen     |
| `checks-windows`                 | Windows-spezifische Prozess-/Pfadtests plus gemeinsame Regressionen bei Runtime-Import-Spezifizierern               | Windows-relevante Änderungen          |
| `macos-node`                     | macOS-TypeScript-Test-Lane mit den gemeinsam genutzten gebauten Artefakten                                          | macOS-relevante Änderungen            |
| `macos-swift`                    | Swift-Lint, Build und Tests für die macOS-App                                                                       | macOS-relevante Änderungen            |
| `android`                        | Android-Unit-Tests für beide Varianten plus ein Debug-APK-Build                                                     | Android-relevante Änderungen          |
| `test-performance-agent`         | Tägliche Codex-Optimierung langsamer Tests nach vertrauenswürdiger Aktivität                                        | Main-CI-Erfolg oder manueller Dispatch |
| `openclaw-performance`           | Tägliche/bedarfsbasierte Kova-Runtime-Performanceberichte mit Mock-Provider-, Deep-Profile- und GPT-5.4-Live-Lanes  | Geplanter und manueller Dispatch      |

## Fail-Fast-Reihenfolge

1. `preflight` entscheidet, welche Lanes überhaupt existieren. Die Logiken `docs-scope` und `changed-scope` sind Schritte innerhalb dieses Jobs, keine eigenständigen Jobs.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` und `skills-python` schlagen schnell fehl, ohne auf die schwereren Artefakt- und Plattform-Matrix-Jobs zu warten.
3. `build-artifacts` überschneidet sich mit den schnellen Linux-Lanes, damit Downstream-Verbraucher starten können, sobald der gemeinsame Build bereit ist.
4. Schwerere Plattform- und Runtime-Lanes fächern danach auf: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-core-test`, `checks`, `checks-windows`, `macos-node`, `macos-swift` und `android`.

GitHub kann überholte Jobs als `cancelled` markieren, wenn ein neuerer Push auf demselben PR- oder `main`-Ref landet. Behandeln Sie das als CI-Rauschen, sofern nicht auch der neueste Lauf für denselben Ref fehlschlägt. Aggregierte Shard-Prüfungen verwenden `!cancelled() && always()`, damit sie normale Shard-Fehler weiterhin melden, aber nicht mehr in die Warteschlange gehen, nachdem der gesamte Workflow bereits überholt wurde. Der automatische CI-Concurrency-Key ist versioniert (`CI-v7-*`), sodass ein GitHub-seitiger Zombie in einer alten Queue-Gruppe neuere main-Läufe nicht unbegrenzt blockieren kann. Manuelle vollständige Suite-Läufe verwenden `CI-manual-v1-*` und brechen laufende Läufe nicht ab.

## Scope und Routing

Die Scope-Logik befindet sich in `scripts/ci-changed-scope.mjs` und ist durch Unit-Tests in `src/scripts/ci-changed-scope.test.ts` abgedeckt. Manueller Dispatch überspringt die Changed-Scope-Erkennung und lässt das Preflight-Manifest so agieren, als hätte sich jeder gescopte Bereich geändert.

- **CI-Workflow-Änderungen** validieren den Node-CI-Graphen plus Workflow-Linting, erzwingen aber nicht von selbst native Windows-, Android- oder macOS-Builds; diese Plattform-Lanes bleiben auf Plattform-Quelländerungen beschränkt.
- **Reine CI-Routing-Änderungen, ausgewählte günstige Core-Test-Fixture-Änderungen und enge Plugin-Vertrags-Helfer-/Test-Routing-Änderungen** verwenden einen schnellen Node-only-Manifestpfad: `preflight`, Sicherheit und eine einzelne `checks-fast-core`-Aufgabe. Dieser Pfad überspringt Build-Artefakte, Node-22-Kompatibilität, Channel-Verträge, vollständige Core-Shards, gebündelte-Plugin-Shards und zusätzliche Guard-Matrizen, wenn die Änderung auf die Routing- oder Hilfsflächen beschränkt ist, die die schnelle Aufgabe direkt ausübt.
- **Windows-Node-Prüfungen** sind auf Windows-spezifische Prozess-/Pfad-Wrapper, npm/pnpm/UI-Runner-Helfer, Paketmanager-Konfiguration und die CI-Workflow-Flächen beschränkt, die diese Lane ausführen; nicht zugehörige Quell-, Plugin-, Install-Smoke- und reine Teständerungen bleiben auf den Linux-Node-Lanes.

Die langsamsten Node-Testfamilien sind aufgeteilt oder ausbalanciert, damit jeder Job klein bleibt, ohne Runner übermäßig zu reservieren: Channel-Verträge laufen als drei gewichtete Shards, kleine Core-Unit-Lanes werden gepaart, Auto-Reply läuft als vier ausbalancierte Worker (wobei der Reply-Teilbaum in Agent-Runner-, Dispatch- und Commands/State-Routing-Shards aufgeteilt ist), und agentische Gateway-/Plugin-Konfigurationen werden über die bestehenden quellcodebasierten agentischen Node-Jobs verteilt, statt auf gebaute Artefakte zu warten. Breite Browser-, QA-, Medien- und sonstige Plugin-Tests verwenden ihre dedizierten Vitest-Konfigurationen statt des gemeinsamen Plugin-Catch-all. Include-Pattern-Shards erfassen Timing-Einträge mit dem CI-Shard-Namen, sodass `.artifacts/vitest-shard-timings.json` eine ganze Konfiguration von einem gefilterten Shard unterscheiden kann. `check-additional` hält Paketgrenzen-Compile-/Canary-Arbeit zusammen und trennt Runtime-Topologie-Architektur von Gateway-Watch-Abdeckung; der Boundary-Guard-Shard führt seine kleinen unabhängigen Guards innerhalb eines Jobs parallel aus, einschließlich `pnpm prompt:snapshots:check`, sodass Codex-Happy-Path-Prompt-Drift an den PR gebunden wird, der ihn verursacht hat. Gateway-Watch, Channel-Tests und der Core-Support-Boundary-Shard laufen innerhalb von `build-artifacts` parallel, nachdem `dist/` und `dist-runtime/` bereits gebaut wurden.

Android-CI führt sowohl `testPlayDebugUnitTest` als auch `testThirdPartyDebugUnitTest` aus und baut anschließend das Play-Debug-APK. Die Drittanbieter-Variante hat kein separates Source Set oder Manifest; ihre Unit-Test-Lane kompiliert die Variante dennoch mit den SMS-/Anrufprotokoll-`BuildConfig`-Flags, während ein doppelter Debug-APK-Paketierungsjob bei jedem Android-relevanten Push vermieden wird.

Der Shard `check-dependencies` führt `pnpm deadcode:dependencies` (einen reinen Produktions-Knip-Abhängigkeitsdurchlauf, gepinnt auf die neueste Knip-Version, wobei pnpm's Mindest-Release-Alter für die `dlx`-Installation deaktiviert ist) und `pnpm deadcode:unused-files` aus, das Knips Produktionsfunde ungenutzter Dateien mit `scripts/deadcode-unused-files.allowlist.mjs` vergleicht. Der Guard für ungenutzte Dateien schlägt fehl, wenn ein PR eine neue ungeprüfte ungenutzte Datei hinzufügt oder einen veralteten Allowlist-Eintrag hinterlässt, während absichtliche dynamische Plugin-, generierte, Build-, Live-Test- und Paket-Bridge-Flächen erhalten bleiben, die Knip statisch nicht auflösen kann.

## ClawSweeper-Aktivitätsweiterleitung

`.github/workflows/clawsweeper-dispatch.yml` ist die zielseitige Bridge von OpenClaw-Repository-Aktivität zu ClawSweeper. Sie checkt keinen nicht vertrauenswürdigen Pull-Request-Code aus und führt ihn nicht aus. Der Workflow erstellt ein GitHub-App-Token aus `CLAWSWEEPER_APP_PRIVATE_KEY` und dispatcht dann kompakte `repository_dispatch`-Payloads an `openclaw/clawsweeper`.

Der Workflow hat vier Lanes:

- `clawsweeper_item` für exakte Issue- und Pull-Request-Review-Anfragen;
- `clawsweeper_comment` für explizite ClawSweeper-Befehle in Issue-Kommentaren;
- `clawsweeper_commit_review` für Review-Anfragen auf Commit-Ebene bei `main`-Pushes;
- `github_activity` für allgemeine GitHub-Aktivität, die der ClawSweeper-Agent prüfen kann.

Die Lane `github_activity` leitet nur normalisierte Metadaten weiter: Ereignistyp, Aktion, Akteur, Repository, Elementnummer, URL, Titel, Status und kurze Auszüge für Kommentare oder Reviews, sofern vorhanden. Sie vermeidet bewusst, den vollständigen Webhook-Body weiterzuleiten. Der empfangende Workflow in `openclaw/clawsweeper` ist `.github/workflows/github-activity.yml`, der das normalisierte Ereignis an den OpenClaw Gateway-Hook für den ClawSweeper-Agent sendet.

Allgemeine Aktivität ist Beobachtung, nicht standardmäßige Zustellung. Der ClawSweeper-Agent erhält das Discord-Ziel in seinem Prompt und sollte nur dann in `#clawsweeper` posten, wenn das Ereignis überraschend, handlungsrelevant, riskant oder operativ nützlich ist. Routinemäßige Eröffnungen, Bearbeitungen, Bot-Fluktuation, doppeltes Webhook-Rauschen und normaler Review-Verkehr sollten zu `NO_REPLY` führen.

Behandeln Sie GitHub-Titel, Kommentare, Bodys, Review-Text, Branch-Namen und Commit-Nachrichten entlang dieses gesamten Pfads als nicht vertrauenswürdige Daten. Sie sind Eingaben für Zusammenfassung und Triage, keine Anweisungen für den Workflow oder die Agent-Runtime.

## Manuelle Dispatches

Manuelle CI-Dispatches führen denselben Job-Graphen wie normale CI aus, erzwingen aber jede nicht auf Android beschränkte Lane: Linux Node-Shards, Shards für gebündelte Plugins, Kanalverträge, Node-22-Kompatibilität, `check`, `check-additional`, Build-Smoke, Dokumentationsprüfungen, Python-Skills, Windows, macOS und Control UI i18n. Eigenständige manuelle CI-Dispatches führen Android nur mit `include_android=true` aus; das vollständige Release-Umbrella aktiviert Android durch Übergabe von `include_android=true`. Statische Plugin-Prerelease-Prüfungen, der nur für Releases vorgesehene `agentic-plugins`-Shard, der vollständige Batch-Sweep für Extensions und Plugin-Prerelease-Docker-Lanes sind von der CI ausgeschlossen. Die Docker-Prerelease-Suite läuft nur, wenn `Full Release Validation` den separaten `Plugin Prerelease`-Workflow mit aktiviertem Release-Validation-Gate auslöst.

Manuelle Läufe verwenden eine eindeutige Concurrency-Gruppe, damit eine vollständige Release-Candidate-Suite nicht durch einen anderen Push- oder PR-Lauf auf demselben Ref abgebrochen wird. Die optionale Eingabe `target_ref` erlaubt es einem vertrauenswürdigen Aufrufer, diesen Graphen gegen einen Branch, Tag oder vollständigen Commit-SHA auszuführen, während die Workflow-Datei aus dem ausgewählten Dispatch-Ref verwendet wird.

```bash
gh workflow run ci.yml --ref release/YYYY.M.D
gh workflow run ci.yml --ref main -f target_ref=<branch-or-sha> -f include_android=true
gh workflow run full-release-validation.yml --ref main -f ref=<branch-or-sha>
```

## Runner

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, schnelle Sicherheitsjobs und Aggregate (`security-scm-fast`, `security-dependency-audit`, `security-fast`), schnelle Protokoll-/Vertrags-/Bundled-Prüfungen, geshardete Kanalvertragsprüfungen, `check`-Shards außer Lint, `check-additional`-Shards und Aggregate, Aggregat-Verifier für Node-Tests, Dokumentationsprüfungen, Python-Skills, Workflow-Sanity, Labeler, Auto-Response; die Install-Smoke-Preflight verwendet ebenfalls GitHub-gehostetes Ubuntu, damit die Blacksmith-Matrix früher in die Warteschlange eingereiht werden kann |
| `blacksmith-4vcpu-ubuntu-2404`   | `CodeQL Critical Quality`, leichtere Extension-Shards, `checks-fast-core`, `checks-node-compat-node22`, `check-prod-types` und `check-test-types`                                                                                                                                                                                                                                                                                                                   |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, Build-Smoke, Linux Node-Test-Shards, Test-Shards für gebündelte Plugins, `android`                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint` (CPU-sensitiv genug, dass 8 vCPU mehr kosteten, als sie einsparten); Install-Smoke-Docker-Builds (32-vCPU-Warteschlangenzeit kostete mehr, als sie einsparten)                                                                                                                                                                                                                                                                                                                     |
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

`OpenClaw Performance` ist der Workflow für Produkt-/Runtime-Performance. Er läuft täglich auf `main` und kann manuell ausgelöst werden:

```bash
gh workflow run openclaw-performance.yml --ref main -f profile=diagnostic -f repeat=3
gh workflow run openclaw-performance.yml --ref main -f profile=smoke -f repeat=1 -f deep_profile=true -f live_gpt54=true
```

Der Workflow installiert OCM aus einem gepinnten Release und Kova aus der gepinnten Eingabe `kova_ref` und führt dann drei Lanes aus:

- `mock-provider`: Kova-Diagnoseszenarien gegen eine Runtime aus lokalem Build mit deterministischer Fake-OpenAI-kompatibler Authentifizierung.
- `mock-deep-profile`: CPU-/Heap-/Trace-Profiling für Hotspots bei Start, Gateway und Agent-Turn.
- `live-gpt54`: ein echter OpenAI-`openai/gpt-5.4`-Agent-Turn, der übersprungen wird, wenn `OPENAI_API_KEY` nicht verfügbar ist.

Die Mock-Provider-Lane führt nach dem Kova-Durchlauf auch OpenClaw-native Source-Probes aus: Gateway-Startzeit und Speicher über Standard-, Hook- und 50-Plugin-Startfälle hinweg; wiederholte Mock-OpenAI-`channel-chat-baseline`-Hello-Loops; und CLI-Startbefehle gegen das gebootete Gateway. Die Markdown-Zusammenfassung der Source-Probes liegt unter `source/index.md` im Report-Bundle, mit Roh-JSON daneben.

Jede Lane lädt GitHub-Artefakte hoch. Wenn `CLAWGRIT_REPORTS_TOKEN` konfiguriert ist, committet der Workflow außerdem `report.json`, `report.md`, Bundles, `index.md` und Source-Probe-Artefakte nach `openclaw/clawgrit-reports` unter `openclaw-performance/<ref>/<run-id>-<attempt>/<lane>/`. Der aktuelle Branch-Zeiger wird als `openclaw-performance/<ref>/latest-<lane>.json` geschrieben.

## Full Release Validation

`Full Release Validation` ist der manuelle Umbrella-Workflow für „alles vor dem Release ausführen“. Er akzeptiert einen Branch, Tag oder vollständigen Commit-SHA, dispatcht den manuellen `CI`-Workflow mit diesem Ziel, dispatcht `Plugin Prerelease` für nur im Release vorgesehene Plugin-/Paket-/statische/Docker-Nachweise und dispatcht `OpenClaw Release Checks` für Install-Smoke, Paketakzeptanz, Docker-Release-Path-Suites, Live/E2E, OpenWebUI, QA-Lab-Parität, Matrix- und Telegram-Lanes. Mit `rerun_group=all` und `release_profile=full` führt er außerdem `NPM Telegram Beta E2E` gegen das Artefakt `release-package-under-test` aus den Release Checks aus. Übergeben Sie nach der Veröffentlichung `npm_telegram_package_spec`, um dieselbe Telegram-Paket-Lane gegen das veröffentlichte npm-Paket erneut auszuführen.

Siehe [Vollständige Release-Validierung](/de/reference/full-release-validation) für die
Stage-Matrix, exakte Workflow-Jobnamen, Profilunterschiede, Artefakte und
fokussierte Rerun-Handles.

`OpenClaw Release Publish` ist der manuelle mutierende Release-Workflow. Dispatchen Sie ihn
von `release/YYYY.M.D` oder `main`, nachdem der Release-Tag existiert und nachdem die
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

Für einen Nachweis mit gepinntem Commit auf einem schnelllebigen Branch verwenden Sie den Helper statt
`gh workflow run ... --ref main -f ref=<sha>`:

```bash
pnpm ci:full-release --sha <full-sha>
```

GitHub-Workflow-Dispatch-Refs müssen Branches oder Tags sein, keine rohen Commit-SHAs. Der
Helper pusht einen temporären Branch `release-ci/<sha>-...` auf dem Ziel-SHA,
dispatcht `Full Release Validation` von diesem gepinnten Ref, verifiziert, dass jeder
untergeordnete Workflow-`headSha` mit dem Ziel übereinstimmt, und löscht den temporären Branch, wenn der
Lauf abgeschlossen ist. Der Umbrella-Verifier schlägt außerdem fehl, wenn ein untergeordneter Workflow mit einem
anderen SHA lief.

`release_profile` steuert die Live-/Provider-Breite, die an Release Checks übergeben wird. Die
manuellen Release-Workflows verwenden standardmäßig `stable`; verwenden Sie `full` nur, wenn Sie
absichtlich die breite advisory Provider-/Medien-Matrix möchten.

- `minimum` behält die schnellsten OpenAI-/Core-releasekritischen Lanes bei.
- `stable` fügt den stabilen Provider-/Backend-Satz hinzu.
- `full` führt die breite advisory Provider-/Medien-Matrix aus.

Das Umbrella zeichnet die ausgelösten untergeordneten Run-IDs auf, und der abschließende Job `Verify full validation` prüft die aktuellen Conclusions der untergeordneten Läufe erneut und hängt Tabellen der langsamsten Jobs für jeden untergeordneten Lauf an. Wenn ein untergeordneter Workflow erneut ausgeführt wird und grün wird, führen Sie nur den übergeordneten Verifier-Job erneut aus, um das Umbrella-Ergebnis und die Timing-Zusammenfassung zu aktualisieren.

Für die Wiederherstellung akzeptieren sowohl `Full Release Validation` als auch `OpenClaw Release Checks` `rerun_group`. Verwenden Sie `all` für einen Release Candidate, `ci` nur für das normale vollständige CI-Child, `plugin-prerelease` nur für das Plugin-Prerelease-Child, `release-checks` für jedes Release-Child oder eine engere Gruppe: `install-smoke`, `cross-os`, `live-e2e`, `package`, `qa`, `qa-parity`, `qa-live` oder `npm-telegram` im Umbrella. Dadurch bleibt die erneute Ausführung einer fehlgeschlagenen Release-Box nach einem gezielten Fix begrenzt.

`OpenClaw Release Checks` verwendet den vertrauenswürdigen Workflow-Ref, um den ausgewählten Ref einmal in ein `release-package-under-test`-Tarball aufzulösen, und übergibt dieses Artefakt dann sowohl an den Live/E2E-Docker-Workflow für den Release-Pfad als auch an den Package-Acceptance-Shard. Dadurch bleiben die Package-Bytes über Release-Boxen hinweg konsistent, und derselbe Candidate muss nicht in mehreren Child-Jobs erneut gepackt werden.

Doppelte `Full Release Validation`-Runs für `ref=main` und `rerun_group=all`
ersetzen den älteren Umbrella. Der Parent-Monitor bricht jeden Child-Workflow ab, den er
bereits ausgelöst hat, wenn der Parent abgebrochen wird, sodass neuere Main-Validierung
nicht hinter einem veralteten zweistündigen Release-Check-Run wartet. Release-Branch/Tag-
Validierung und fokussierte Rerun-Gruppen behalten `cancel-in-progress: false`.

## Live- und E2E-Shards

Das Release-Live/E2E-Child behält die breite native `pnpm test:live`-Abdeckung bei, führt sie jedoch als benannte Shards über `scripts/test-live-shard.mjs` aus statt als einen seriellen Job:

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
- aufgeteilte Medien-Audio/Video-Shards und Provider-gefilterte Musik-Shards

Das behält dieselbe Dateiabdeckung bei und macht langsame Live-Provider-Fehler leichter erneut ausführbar und diagnostizierbar. Die aggregierten Shard-Namen `native-live-extensions-o-z`, `native-live-extensions-media` und `native-live-extensions-media-music` bleiben für manuelle einmalige Reruns gültig.

Die nativen Live-Medien-Shards laufen in `ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, gebaut durch den Workflow `Live Media Runner Image`. Dieses Image installiert `ffmpeg` und `ffprobe` vor; Medien-Jobs prüfen vor dem Setup nur die Binärdateien. Lassen Sie Docker-gestützte Live-Suites auf normalen Blacksmith-Runnern laufen — Container-Jobs sind der falsche Ort, um verschachtelte Docker-Tests zu starten.

Docker-gestützte Live-Modell/Backend-Shards verwenden ein separates gemeinsames Image `ghcr.io/openclaw/openclaw-live-test:<sha>` pro ausgewähltem Commit. Der Live-Release-Workflow baut und pusht dieses Image einmal; anschließend laufen die Docker-Live-Modell-, Provider-geshardeten Gateway-, CLI-Backend-, ACP-Bind- und Codex-Harness-Shards mit `OPENCLAW_SKIP_DOCKER_BUILD=1`. Gateway-Docker-Shards haben explizite Timeout-Obergrenzen auf Skriptebene unterhalb des Workflow-Job-Timeouts, damit ein hängender Container oder Cleanup-Pfad schnell fehlschlägt, statt das gesamte Release-Check-Budget zu verbrauchen. Wenn diese Shards das vollständige Source-Docker-Target unabhängig neu bauen, ist der Release-Run falsch konfiguriert und verschwendet Laufzeit mit doppelten Image-Builds.

## Package Acceptance

Verwenden Sie `Package Acceptance`, wenn die Frage lautet: „Funktioniert dieses installierbare OpenClaw-Package als Produkt?“ Sie unterscheidet sich von normaler CI: Normale CI validiert den Source Tree, während Package Acceptance ein einzelnes Tarball über denselben Docker-E2E-Harness validiert, den Benutzer nach Installation oder Update ausführen.

### Jobs

1. `resolve_package` checkt `workflow_ref` aus, löst einen Package-Candidate auf, schreibt `.artifacts/docker-e2e-package/openclaw-current.tgz`, schreibt `.artifacts/docker-e2e-package/package-candidate.json`, lädt beide als Artefakt `package-under-test` hoch und gibt Quelle, Workflow-Ref, Package-Ref, Version, SHA-256 und Profil in der GitHub-Step-Zusammenfassung aus.
2. `docker_acceptance` ruft `openclaw-live-and-e2e-checks-reusable.yml` mit `ref=workflow_ref` und `package_artifact_name=package-under-test` auf. Der wiederverwendbare Workflow lädt dieses Artefakt herunter, validiert das Tarball-Inventar, bereitet bei Bedarf Package-Digest-Docker-Images vor und führt die ausgewählten Docker-Lanes gegen dieses Package aus, statt den Workflow-Checkout zu packen. Wenn ein Profil mehrere gezielte `docker_lanes` auswählt, bereitet der wiederverwendbare Workflow das Package und die gemeinsamen Images einmal vor und fächert diese Lanes dann als parallele gezielte Docker-Jobs mit eindeutigen Artefakten aus.
3. `package_telegram` ruft optional `NPM Telegram Beta E2E` auf. Es läuft, wenn `telegram_mode` nicht `none` ist, und installiert dasselbe Artefakt `package-under-test`, wenn Package Acceptance eines aufgelöst hat; eigenständige Telegram-Dispatches können weiterhin eine veröffentlichte npm-Spezifikation installieren.
4. `summary` lässt den Workflow fehlschlagen, wenn Package-Auflösung, Docker Acceptance oder die optionale Telegram-Lane fehlgeschlagen ist.

### Candidate-Quellen

- `source=npm` akzeptiert nur `openclaw@alpha`, `openclaw@beta`, `openclaw@latest` oder eine exakte OpenClaw-Release-Version wie `openclaw@2026.4.27-beta.2`. Verwenden Sie dies für veröffentlichte Prerelease-/Stable-Abnahme.
- `source=ref` packt einen vertrauenswürdigen `package_ref`-Branch, -Tag oder vollständigen Commit-SHA. Der Resolver ruft OpenClaw-Branches/Tags ab, prüft, dass der ausgewählte Commit aus der Repository-Branch-Historie oder einem Release-Tag erreichbar ist, installiert Dependencies in einem detached Worktree und packt ihn mit `scripts/package-openclaw-for-docker.mjs`.
- `source=url` lädt ein HTTPS-`.tgz` herunter; `package_sha256` ist erforderlich.
- `source=artifact` lädt ein `.tgz` aus `artifact_run_id` und `artifact_name` herunter; `package_sha256` ist optional, sollte aber für extern geteilte Artefakte angegeben werden.

Halten Sie `workflow_ref` und `package_ref` getrennt. `workflow_ref` ist der vertrauenswürdige Workflow-/Harness-Code, der den Test ausführt. `package_ref` ist der Source-Commit, der gepackt wird, wenn `source=ref` gilt. Dadurch kann der aktuelle Test-Harness ältere vertrauenswürdige Source-Commits validieren, ohne alte Workflow-Logik auszuführen.

### Suite-Profile

- `smoke` — `npm-onboard-channel-agent`, `gateway-network`, `config-reload`
- `package` — `npm-onboard-channel-agent`, `doctor-switch`, `update-channel-switch`, `upgrade-survivor`, `published-upgrade-survivor`, `plugins-offline`, `plugin-update`
- `product` — `package` plus `mcp-channels`, `cron-mcp-cleanup`, `openai-web-search-minimal`, `openwebui`
- `full` — vollständige Docker-Release-Pfad-Chunks mit OpenWebUI
- `custom` — exakte `docker_lanes`; erforderlich, wenn `suite_profile=custom`

Das Profil `package` verwendet Offline-Plugin-Abdeckung, damit die Validierung veröffentlichter Packages nicht von Live-ClawHub-Verfügbarkeit abhängt. Die optionale Telegram-Lane verwendet das Artefakt `package-under-test` in `NPM Telegram Beta E2E` wieder; der veröffentlichte npm-Spezifikationspfad bleibt für eigenständige Dispatches erhalten.

Die dedizierte Update- und Plugin-Testpolicy, einschließlich lokaler Befehle,
Docker-Lanes, Package-Acceptance-Eingaben, Release-Defaults und Fehlertriage,
finden Sie unter [Updates und Plugins testen](/de/help/testing-updates-plugins).

Release Checks rufen Package Acceptance mit `source=artifact`, dem vorbereiteten Release-Package-Artefakt, `suite_profile=custom`, `docker_lanes='doctor-switch update-channel-switch upgrade-survivor published-upgrade-survivor plugins-offline plugin-update'`, `published_upgrade_survivor_baselines=all-since-2026.4.23`, `published_upgrade_survivor_scenarios=reported-issues` und `telegram_mode=mock-openai` auf. Dadurch bleiben Package-Migration, Update, Cleanup veralteter Plugin-Dependency, Reparatur installierter konfigurierter Plugins, Offline-Plugin, Plugin-Update und Telegram-Nachweis auf demselben aufgelösten Package-Tarball. Setzen Sie `package_acceptance_package_spec` für Full Release Validation oder OpenClaw Release Checks, um dieselbe Matrix gegen ein ausgeliefertes npm-Package statt gegen das aus dem SHA gebaute Artefakt auszuführen. Cross-OS Release Checks decken weiterhin OS-spezifisches Onboarding, Installer- und Plattformverhalten ab; Produktvalidierung für Package/Update sollte mit Package Acceptance beginnen. Die Docker-Lane `published-upgrade-survivor` validiert pro Run eine veröffentlichte Package-Baseline. In Package Acceptance ist das aufgelöste Tarball `package-under-test` immer der Candidate, und `published_upgrade_survivor_baseline` wählt die veröffentlichte Fallback-Baseline aus, standardmäßig `openclaw@latest`; Rerun-Befehle für fehlgeschlagene Lanes behalten diese Baseline bei. Setzen Sie `published_upgrade_survivor_baselines=all-since-2026.4.23`, um Full Release CI über jede stabile npm-Version von `2026.4.23` bis `latest` zu erweitern; `release-history` bleibt für manuelle breitere Stichproben mit dem älteren Vordatums-Anker verfügbar. Setzen Sie `published_upgrade_survivor_scenarios=reported-issues`, um dieselben Baselines über issue-förmige Fixtures für Feishu-Konfiguration, erhaltene Bootstrap-/Persona-Dateien, konfigurierte OpenClaw-Plugin-Installationen, Tilde-Logpfade und veraltete Legacy-Plugin-Dependency-Roots zu erweitern. Der separate Workflow `Update Migration` verwendet die Docker-Lane `update-migration` mit `all-since-2026.4.23` und `plugin-deps-cleanup`, wenn die Frage eine vollständige Cleanup-Prüfung veröffentlichter Updates ist und nicht die normale Breite von Full Release CI. Lokale Aggregat-Runs können exakte Package-Spezifikationen mit `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` übergeben, eine einzelne Lane mit `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC` wie `openclaw@2026.4.15` beibehalten oder `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` für die Szenario-Matrix setzen. Die veröffentlichte Lane konfiguriert die Baseline mit einem eingebauten `openclaw config set`-Befehlsrezept, zeichnet Rezeptschritte in `summary.json` auf und prüft nach Gateway-Start `/healthz`, `/readyz` sowie RPC-Status. Die frischen Windows-Packaged- und Installer-Lanes prüfen außerdem, dass ein installiertes Package einen Browser-Control-Override aus einem rohen absoluten Windows-Pfad importieren kann. Der OpenAI-Cross-OS-Agent-Turn-Smoke verwendet standardmäßig `OPENCLAW_CROSS_OS_OPENAI_MODEL`, wenn gesetzt, andernfalls `openai/gpt-5.4`, sodass der Installations- und Gateway-Nachweis auf einem GPT-5-Testmodell bleibt und GPT-4.x-Defaults vermieden werden.

### Legacy-Kompatibilitätsfenster

Package Acceptance hat begrenzte Legacy-Kompatibilitätsfenster für bereits veröffentlichte Packages. Packages bis `2026.4.25`, einschließlich `2026.4.25-beta.*`, dürfen den Kompatibilitätspfad verwenden:

- bekannte private QA-Einträge in `dist/postinstall-inventory.json` dürfen auf Dateien zeigen, die im Tarball fehlen;
- `doctor-switch` darf den Teilfall zur Persistenz von `gateway install --wrapper` überspringen, wenn das Package dieses Flag nicht bereitstellt;
- `update-channel-switch` darf fehlende `pnpm.patchedDependencies` aus der vom Tarball abgeleiteten Fake-Git-Fixture entfernen und fehlendes persistiertes `update.channel` protokollieren;
- Plugin-Smokes dürfen Legacy-Speicherorte von Installationsdatensätzen lesen oder fehlende Marketplace-Persistenz von Installationsdatensätzen akzeptieren;
- `plugin-update` darf Konfigurationsmetadaten-Migration zulassen, während weiterhin verlangt wird, dass Installationsdatensatz und No-Reinstall-Verhalten unverändert bleiben.

Das veröffentlichte Package `2026.4.26` darf außerdem vor lokal gebauten Metadaten-Stamp-Dateien warnen, die bereits ausgeliefert wurden. Spätere Packages müssen die modernen Verträge erfüllen; dieselben Bedingungen schlagen dann fehl, statt zu warnen oder übersprungen zu werden.

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

Beginnen Sie beim Debuggen eines fehlgeschlagenen Package-Acceptance-Laufs mit der `resolve_package`-Zusammenfassung, um Paketquelle, Version und SHA-256 zu bestätigen. Prüfen Sie anschließend den untergeordneten `docker_acceptance`-Lauf und seine Docker-Artefakte: `.artifacts/docker-tests/**/summary.json`, `failures.json`, Lane-Logs, Phasenzeiten und Befehle für erneute Läufe. Führen Sie bevorzugt das fehlgeschlagene Paketprofil oder die exakten Docker-Lanes erneut aus, statt die vollständige Release-Validierung erneut zu starten.

## Installations-Smoke-Test

Der separate Workflow `Install Smoke` verwendet dasselbe Scope-Skript über seinen eigenen `preflight`-Job wieder. Er teilt die Smoke-Abdeckung in `run_fast_install_smoke` und `run_full_install_smoke` auf.

- **Schneller Pfad** läuft für Pull Requests, die Docker-/Paket-Oberflächen, Änderungen an gebündelten Plugin-Paketen/-Manifesten oder Core-Plugin-/Channel-/Gateway-/Plugin SDK-Oberflächen betreffen, die von den Docker-Smoke-Jobs geprüft werden. Reine Source-Änderungen an gebündelten Plugins, reine Teständerungen und reine Dokumentationsänderungen reservieren keine Docker-Worker. Der schnelle Pfad baut das Root-Dockerfile-Image einmal, prüft die CLI, führt den Agents-Delete-Shared-Workspace-CLI-Smoke-Test aus, führt das Container-Gateway-Network-E2E aus, verifiziert ein Build-Argument für gebündelte Erweiterungen und führt das begrenzte gebündelte-Plugin-Docker-Profil unter einem aggregierten Befehls-Timeout von 240 Sekunden aus (jeder Docker-Lauf eines Szenarios ist separat begrenzt).
- **Vollständiger Pfad** behält QR-Paketinstallation sowie Installer-Docker-/Update-Abdeckung für nächtlich geplante Läufe, manuelle Dispatches, Workflow-Call-Release-Checks und Pull Requests bei, die tatsächlich Installer-/Paket-/Docker-Oberflächen betreffen. Im vollständigen Modus bereitet Install-Smoke ein Root-Dockerfile-Smoke-Image aus GHCR für die Ziel-SHA vor oder verwendet es wieder und führt dann QR-Paketinstallation, Root-Dockerfile-/Gateway-Smokes, Installer-/Update-Smokes und das schnelle gebündelte-Plugin-Docker-E2E als separate Jobs aus, damit Installer-Arbeit nicht hinter den Root-Image-Smokes warten muss.

`main`-Pushes (einschließlich Merge-Commits) erzwingen den vollständigen Pfad nicht; wenn die Changed-Scope-Logik bei einem Push vollständige Abdeckung anfordern würde, behält der Workflow den schnellen Docker-Smoke-Test bei und überlässt den vollständigen Install-Smoke-Test der nächtlichen oder Release-Validierung.

Der langsame Bun-Global-Install-Image-Provider-Smoke-Test wird separat durch `run_bun_global_install_smoke` gesteuert. Er läuft im nächtlichen Zeitplan und aus dem Release-Checks-Workflow, und manuelle `Install Smoke`-Dispatches können ihn optional aktivieren, Pull Requests und `main`-Pushes jedoch nicht. QR- und Installer-Docker-Tests behalten ihre eigenen installfokussierten Dockerfiles.

## Lokales Docker-E2E

`pnpm test:docker:all` baut ein gemeinsames Live-Test-Image vor, packt OpenClaw einmal als npm-Tarball und baut zwei gemeinsame `scripts/e2e/Dockerfile`-Images:

- einen einfachen Node-/Git-Runner für Installer-/Update-/Plugin-Abhängigkeits-Lanes;
- ein funktionsfähiges Image, das denselben Tarball für normale Funktions-Lanes in `/app` installiert.

Docker-Lane-Definitionen befinden sich in `scripts/lib/docker-e2e-scenarios.mjs`, die Planerlogik in `scripts/lib/docker-e2e-plan.mjs`, und der Runner führt nur den ausgewählten Plan aus. Der Scheduler wählt das Image pro Lane mit `OPENCLAW_DOCKER_E2E_BARE_IMAGE` und `OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE` aus und führt Lanes dann mit `OPENCLAW_SKIP_DOCKER_BUILD=1` aus.

### Einstellbare Parameter

| Variable                               | Standard | Zweck                                                                                         |
| -------------------------------------- | -------- | --------------------------------------------------------------------------------------------- |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`      | 10       | Slot-Anzahl im Hauptpool für normale Lanes.                                                   |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` | 10       | Provider-sensible Slot-Anzahl im Tail-Pool.                                                   |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`       | 9        | Limit für gleichzeitige Live-Lanes, damit Provider nicht drosseln.                            |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`        | 10       | Limit für gleichzeitige npm-Install-Lanes.                                                    |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`    | 7        | Limit für gleichzeitige Multi-Service-Lanes.                                                  |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS` | 2000     | Versatz zwischen Lane-Starts, um Docker-Daemon-Create-Stürme zu vermeiden; `0` deaktiviert den Versatz. |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`  | 7200000  | Fallback-Timeout pro Lane (120 Minuten); ausgewählte Live-/Tail-Lanes verwenden strengere Limits. |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`          | unset    | `1` gibt den Scheduler-Plan aus, ohne Lanes auszuführen.                                      |
| `OPENCLAW_DOCKER_ALL_LANES`            | unset    | Durch Kommas getrennte exakte Lane-Liste; überspringt Cleanup-Smoke, damit Agents eine fehlgeschlagene Lane reproduzieren können. |

Eine Lane, die schwerer ist als ihr effektives Limit, kann dennoch aus einem leeren Pool starten und läuft dann allein, bis sie Kapazität freigibt. Die lokale aggregierte Vorprüfung prüft Docker, entfernt veraltete OpenClaw-E2E-Container, gibt den Status aktiver Lanes aus, speichert Lane-Zeiten für Longest-First-Sortierung und plant standardmäßig nach dem ersten Fehler keine neuen gepoolten Lanes mehr ein.

### Wiederverwendbarer Live-/E2E-Workflow

Der wiederverwendbare Live-/E2E-Workflow fragt `scripts/test-docker-all.mjs --plan-json`, welche Paket-, Image-Art, welches Live-Image sowie welche Lane- und Zugangsdaten-Abdeckung erforderlich sind. `scripts/docker-e2e.mjs` wandelt diesen Plan dann in GitHub-Ausgaben und Zusammenfassungen um. Es packt OpenClaw entweder über `scripts/package-openclaw-for-docker.mjs`, lädt ein Paketartefakt des aktuellen Laufs herunter oder lädt ein Paketartefakt aus `package_artifact_run_id`; validiert das Tarball-Inventar; baut und pusht paketdigest-getaggte Bare-/Functional-GHCR-Docker-E2E-Images über Blacksmiths Docker-Layer-Cache, wenn der Plan Lanes mit installiertem Paket benötigt; und verwendet angegebene Eingaben `docker_e2e_bare_image`/`docker_e2e_functional_image` oder vorhandene Paketdigest-Images wieder, statt neu zu bauen. Docker-Image-Pulls werden mit einem begrenzten Timeout von 180 Sekunden pro Versuch erneut versucht, damit ein hängender Registry-/Cache-Stream schnell erneut versucht wird, statt den Großteil des kritischen CI-Pfads zu verbrauchen.

### Release-Pfad-Chunks

Release-Docker-Abdeckung läuft in kleineren aufgeteilten Jobs mit `OPENCLAW_SKIP_DOCKER_BUILD=1`, sodass jeder Chunk nur die benötigte Image-Art zieht und mehrere Lanes über denselben gewichteten Scheduler ausführt:

- `OPENCLAW_DOCKER_ALL_PROFILE=release-path`
- `OPENCLAW_DOCKER_ALL_CHUNK=core | package-update-openai | package-update-anthropic | package-update-core | plugins-runtime-plugins | plugins-runtime-services | plugins-runtime-install-a..h`

Aktuelle Release-Docker-Chunks sind `core`, `package-update-openai`, `package-update-anthropic`, `package-update-core`, `plugins-runtime-plugins`, `plugins-runtime-services` und `plugins-runtime-install-a` bis `plugins-runtime-install-h`. `plugins-runtime-core`, `plugins-runtime` und `plugins-integrations` bleiben aggregierte Plugin-/Runtime-Aliasse. Der Lane-Alias `install-e2e` bleibt der aggregierte manuelle Rerun-Alias für beide Provider-Installer-Lanes.

OpenWebUI wird in `plugins-runtime-services` aufgenommen, wenn vollständige Release-Pfad-Abdeckung es anfordert, und behält nur für reine OpenWebUI-Dispatches einen eigenständigen `openwebui`-Chunk. Update-Lanes für gebündelte Channels versuchen bei vorübergehenden npm-Netzwerkfehlern einmal erneut.

Jeder Chunk lädt `.artifacts/docker-tests/` mit Lane-Logs, Zeiten, `summary.json`, `failures.json`, Phasenzeiten, Scheduler-Plan-JSON, Tabellen langsamer Lanes und Rerun-Befehlen pro Lane hoch. Die Workflow-Eingabe `docker_lanes` führt ausgewählte Lanes gegen die vorbereiteten Images statt der Chunk-Jobs aus, wodurch das Debugging fehlgeschlagener Lanes auf einen gezielten Docker-Job begrenzt bleibt und das Paketartefakt für diesen Lauf vorbereitet, heruntergeladen oder wiederverwendet wird; wenn eine ausgewählte Lane eine Live-Docker-Lane ist, baut der gezielte Job das Live-Test-Image lokal für diesen erneuten Lauf. Generierte GitHub-Rerun-Befehle pro Lane enthalten `package_artifact_run_id`, `package_artifact_name` und vorbereitete Image-Eingaben, wenn diese Werte existieren, sodass eine fehlgeschlagene Lane exakt dasselbe Paket und dieselben Images aus dem fehlgeschlagenen Lauf wiederverwenden kann.

```bash
pnpm test:docker:rerun <run-id>      # download Docker artifacts and print combined/per-lane targeted rerun commands
pnpm test:docker:timings <summary>   # slow-lane and phase critical-path summaries
```

Der geplante Live-/E2E-Workflow führt täglich die vollständige Release-Pfad-Docker-Suite aus.

## Plugin-Vorveröffentlichung

`Plugin Prerelease` ist teurere Produkt-/Paket-Abdeckung und daher ein separater Workflow, der von `Full Release Validation` oder durch einen expliziten Operator ausgelöst wird. Normale Pull Requests, `main`-Pushes und eigenständige manuelle CI-Dispatches lassen diese Suite deaktiviert. Er verteilt gebündelte Plugin-Tests auf acht Erweiterungs-Worker; diese Erweiterungs-Shard-Jobs führen bis zu zwei Plugin-Konfigurationsgruppen gleichzeitig mit einem Vitest-Worker pro Gruppe und einem größeren Node-Heap aus, damit importlastige Plugin-Batches keine zusätzlichen CI-Jobs erzeugen. Der Release-only-Docker-Prerelease-Pfad bündelt gezielte Docker-Lanes in kleinen Gruppen, um nicht Dutzende Runner für ein- bis dreiminütige Jobs zu reservieren.

## QA-Lab

QA Lab hat dedizierte CI-Lanes außerhalb des wichtigsten smart-gescopten Workflows. Agentische Parität ist unter den breiten QA- und Release-Harnesses verschachtelt, nicht als eigenständiger PR-Workflow. Verwenden Sie `Full Release Validation` mit `rerun_group=qa-parity`, wenn Parität mit einem breiten Validierungslauf mitlaufen soll.

- Der Workflow `QA-Lab - All Lanes` läuft nächtlich auf `main` und bei manuellem Dispatch; er fächert die Mock-Parity-Lane, Live-Matrix-Lane sowie Live-Telegram- und Discord-Lanes als parallele Jobs auf. Live-Jobs verwenden die Umgebung `qa-live-shared`, und Telegram/Discord verwenden Convex-Leases.

Release-Checks führen Matrix- und Telegram-Live-Transport-Lanes mit dem deterministischen Mock-Provider und mock-qualifizierten Modellen (`mock-openai/gpt-5.5` und `mock-openai/gpt-5.5-alt`) aus, sodass der Channel-Vertrag von Live-Modell-Latenz und normalem Provider-Plugin-Start isoliert ist. Das Live-Transport-Gateway deaktiviert die Memory-Suche, weil QA-Parität Memory-Verhalten separat abdeckt; Provider-Konnektivität wird durch die separaten Live-Modell-, nativen Provider- und Docker-Provider-Suites abgedeckt.

Matrix verwendet `--profile fast` für geplante und Release-Gates und fügt `--fail-fast` nur hinzu, wenn die ausgecheckte CLI dies unterstützt. Der CLI-Standard und die manuelle Workflow-Eingabe bleiben `all`; manuelle `matrix_profile=all`-Dispatches sharden vollständige Matrix-Abdeckung immer in die Jobs `transport`, `media`, `e2ee-smoke`, `e2ee-deep` und `e2ee-cli`.

`OpenClaw Release Checks` führt außerdem die releasekritischen QA-Lab-Lanes vor der Release-Freigabe aus; sein QA-Parity-Gate führt Candidate- und Baseline-Packs als parallele Lane-Jobs aus und lädt anschließend beide Artefakte in einen kleinen Berichtsjob für den finalen Paritätsvergleich herunter.

Folgen Sie bei normalen PRs gescopten CI-/Check-Nachweisen, statt Parität als erforderlichen Status zu behandeln.

## CodeQL

Der `CodeQL`-Workflow ist absichtlich ein eng gefasster Security-Scanner für den ersten Durchlauf, nicht der vollständige Repository-Sweep. Tägliche, manuelle und nicht als Draft markierte Pull-Request-Guard-Läufe scannen Actions-Workflow-Code sowie die risikoreichsten JavaScript-/TypeScript-Bereiche mit Security-Abfragen mit hoher Konfidenz, gefiltert auf hohe/kritische `security-severity`.

Der Pull-Request-Guard bleibt leichtgewichtig: Er startet nur bei Änderungen unter `.github/actions`, `.github/codeql`, `.github/workflows`, `packages` oder `src`, und er führt dieselbe Security-Matrix mit hoher Konfidenz aus wie der geplante Workflow. Android- und macOS-CodeQL bleiben außerhalb der PR-Standardwerte.

### Security-Kategorien

| Kategorie                                         | Bereich                                                                                                                            |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-security-high/core-auth-secrets`         | Auth, Secrets, Sandbox, Cron und Gateway-Baseline                                                                                  |
| `/codeql-security-high/channel-runtime-boundary`  | Verträge der Kern-Channel-Implementierung plus Channel-Plugin-Runtime, Gateway, Plugin SDK, Secrets, Audit-Touchpoints             |
| `/codeql-security-high/network-ssrf-boundary`     | Kern-SSRF, IP-Parsing, Network Guard, Web-Fetch und SSRF-Policy-Bereiche des Plugin SDK                                             |
| `/codeql-security-high/mcp-process-tool-boundary` | MCP-Server, Helfer für Prozessausführung, ausgehende Zustellung und Agent-Gates für Tool-Ausführung                                |
| `/codeql-security-high/plugin-trust-boundary`     | Plugin-Installation, Loader, Manifest, Registry, Paketmanager-Installation, Source-Loading und Vertrauensbereiche des Plugin-SDK-Paketvertrags |

### Plattformspezifische Security-Shards

- `CodeQL Android Critical Security` — geplanter Android-Security-Shard. Baut die Android-App manuell für CodeQL auf dem kleinsten Blacksmith-Linux-Runner, den die Workflow-Sanity akzeptiert. Lädt unter `/codeql-critical-security/android` hoch.
- `CodeQL macOS Critical Security` — wöchentlicher/manueller macOS-Security-Shard. Baut die macOS-App manuell für CodeQL auf Blacksmith macOS, filtert Dependency-Build-Ergebnisse aus dem hochgeladenen SARIF heraus und lädt unter `/codeql-critical-security/macos` hoch. Bleibt außerhalb der täglichen Standardwerte, weil der macOS-Build selbst bei sauberem Lauf die Runtime dominiert.

### Critical-Quality-Kategorien

`CodeQL Critical Quality` ist der passende Nicht-Security-Shard. Er führt nur JavaScript-/TypeScript-Quality-Abfragen mit Fehler-Schweregrad und ohne Security-Bezug über enge, hochwertige Bereiche auf dem kleineren Blacksmith-Linux-Runner aus. Sein Pull-Request-Guard ist absichtlich kleiner als das geplante Profil: Nicht-Draft-PRs führen nur die passenden Shards `agent-runtime-boundary`, `config-boundary`, `core-auth-secrets`, `channel-runtime-boundary`, `gateway-runtime-boundary`, `memory-runtime-boundary`, `mcp-process-runtime-boundary`, `provider-runtime-boundary`, `session-diagnostics-boundary`, `plugin-boundary`, `plugin-sdk-package-contract` und `plugin-sdk-reply-runtime` für Agent-Befehls-/Modell-/Tool-Ausführung und Reply-Dispatch-Code, Konfigurationsschema-/Migrations-/IO-Code, Auth-/Secrets-/Sandbox-/Security-Code, Kern-Channel- und gebündelte Channel-Plugin-Runtime, Gateway-Protokoll-/Server-Methoden, Memory-Runtime-/SDK-Glue, MCP-/Prozess-/ausgehende Zustellung, Provider-Runtime-/Modellkatalog, Session-Diagnostics-/Delivery-Queues, Plugin-Loader, Plugin SDK/Paketvertrag oder Änderungen an der Plugin-SDK-Reply-Runtime aus. CodeQL-Konfigurations- und Quality-Workflow-Änderungen führen alle zwölf PR-Quality-Shards aus.

Manueller Dispatch akzeptiert:

```
profile=all|agent-runtime-boundary|config-boundary|core-auth-secrets|channel-runtime-boundary|gateway-runtime-boundary|memory-runtime-boundary|mcp-process-runtime-boundary|plugin-boundary|plugin-sdk-package-contract|plugin-sdk-reply-runtime|provider-runtime-boundary|session-diagnostics-boundary
```

Die engen Profile sind Teaching-/Iterations-Hooks, um einen Quality-Shard isoliert auszuführen.

| Kategorie                                               | Bereich                                                                                                                                                             |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/codeql-critical-quality/core-auth-secrets`            | Auth, Secrets, Sandbox, Cron und Code der Gateway-Security-Grenze                                                                                                   |
| `/codeql-critical-quality/config-boundary`              | Konfigurationsschema, Migration, Normalisierung und IO-Verträge                                                                                                     |
| `/codeql-critical-quality/gateway-runtime-boundary`     | Gateway-Protokollschemas und Server-Methoden-Verträge                                                                                                               |
| `/codeql-critical-quality/channel-runtime-boundary`     | Implementierungsverträge für Kern-Channel und gebündeltes Channel-Plugin                                                                                            |
| `/codeql-critical-quality/agent-runtime-boundary`       | Befehlsausführung, Modell-/Provider-Dispatch, Auto-Reply-Dispatch und Queues sowie ACP-Control-Plane-Runtime-Verträge                                               |
| `/codeql-critical-quality/mcp-process-runtime-boundary` | MCP-Server und Tool-Bridges, Helfer für Prozessüberwachung und Verträge für ausgehende Zustellung                                                                   |
| `/codeql-critical-quality/memory-runtime-boundary`      | Memory-Host-SDK, Memory-Runtime-Fassaden, Memory-Plugin-SDK-Aliasse, Glue für Memory-Runtime-Aktivierung und Memory-Doctor-Befehle                                  |
| `/codeql-critical-quality/session-diagnostics-boundary` | Reply-Queue-Interna, Session-Delivery-Queues, Helfer für ausgehende Session-Bindung/-Zustellung, Diagnoseereignis-/Log-Bundle-Bereiche und Session-Doctor-CLI-Verträge |
| `/codeql-critical-quality/plugin-sdk-reply-runtime`     | Plugin-SDK-Dispatch für eingehende Replies, Reply-Payload-/Chunking-/Runtime-Helfer, Channel-Reply-Optionen, Delivery-Queues und Helfer für Session-/Thread-Bindung |
| `/codeql-critical-quality/provider-runtime-boundary`    | Modellkatalog-Normalisierung, Provider-Auth und Discovery, Provider-Runtime-Registrierung, Provider-Defaults/-Kataloge und Web-/Search-/Fetch-/Embedding-Registries |
| `/codeql-critical-quality/ui-control-plane`             | Control-UI-Bootstrap, lokale Persistenz, Gateway-Control-Flows und Runtime-Verträge der Task-Control-Plane                                                          |
| `/codeql-critical-quality/web-media-runtime-boundary`   | Kern-Web-Fetch/Search, Media-IO, Media-Understanding, Image-Generation und Media-Generation-Runtime-Verträge                                                        |
| `/codeql-critical-quality/plugin-boundary`              | Loader-, Registry-, Public-Surface- und Plugin-SDK-Entrypoint-Verträge                                                                                              |
| `/codeql-critical-quality/plugin-sdk-package-contract`  | Veröffentlichter paketbezogener Plugin-SDK-Quellcode und Helfer für Plugin-Paketverträge                                                                           |

Quality bleibt von Security getrennt, damit Quality-Ergebnisse geplant, gemessen, deaktiviert oder erweitert werden können, ohne das Security-Signal zu verdecken. Swift-, Python- und gebündelte-Plugin-CodeQL-Erweiterungen sollten erst wieder als eng begrenzte oder geshardete Folgearbeit hinzugefügt werden, nachdem die engen Profile stabile Runtime und stabile Signale haben.

## Wartungsworkflows

### Docs Agent

Der `Docs Agent`-Workflow ist eine ereignisgesteuerte Codex-Wartungslane, um bestehende Dokumentation mit kürzlich gelandeten Änderungen synchron zu halten. Er hat keinen reinen Zeitplan: Ein erfolgreicher Nicht-Bot-Push-CI-Lauf auf `main` kann ihn auslösen, und manueller Dispatch kann ihn direkt ausführen. Workflow-Run-Aufrufe werden übersprungen, wenn `main` weitergezogen ist oder wenn in der letzten Stunde ein anderer nicht übersprungener Docs-Agent-Lauf erstellt wurde. Wenn er läuft, prüft er den Commit-Bereich von der vorherigen nicht übersprungenen Docs-Agent-Source-SHA bis zum aktuellen `main`, sodass ein stündlicher Lauf alle seit dem letzten Docs-Durchlauf angesammelten Main-Änderungen abdecken kann.

### Test Performance Agent

Der `Test Performance Agent`-Workflow ist eine ereignisgesteuerte Codex-Wartungslane für langsame Tests. Er hat keinen reinen Zeitplan: Ein erfolgreicher Nicht-Bot-Push-CI-Lauf auf `main` kann ihn auslösen, aber er wird übersprungen, wenn an diesem UTC-Tag bereits ein anderer Workflow-Run-Aufruf gelaufen ist oder läuft. Manueller Dispatch umgeht dieses tägliche Aktivitätsgate. Die Lane erstellt einen gruppierten Vitest-Performance-Bericht für die vollständige Suite, lässt Codex nur kleine, coverage-erhaltende Test-Performance-Fixes statt breiter Refactorings vornehmen, führt dann den Bericht für die vollständige Suite erneut aus und lehnt Änderungen ab, die die bestandene Baseline-Testanzahl reduzieren. Wenn die Baseline fehlschlagende Tests enthält, darf Codex nur offensichtliche Fehler beheben, und der Nach-Agent-Bericht für die vollständige Suite muss bestehen, bevor etwas committet wird. Wenn `main` weiterläuft, bevor der Bot-Push landet, rebased die Lane den validierten Patch, führt `pnpm check:changed` erneut aus und versucht den Push erneut; widersprüchliche veraltete Patches werden übersprungen. Sie verwendet GitHub-gehostetes Ubuntu, damit die Codex-Action dieselbe Drop-Sudo-Sicherheitsposition wie der Docs Agent beibehalten kann.

### Duplicate PRs After Merge

Der `Duplicate PRs After Merge`-Workflow ist ein manueller Maintainer-Workflow für Duplicate-Cleanup nach dem Landen. Er ist standardmäßig ein Dry-Run und schließt nur explizit aufgelistete PRs, wenn `apply=true` gesetzt ist. Vor GitHub-Mutationen prüft er, dass der gelandete PR gemergt ist und dass jedes Duplikat entweder ein gemeinsam referenziertes Issue oder überlappende geänderte Hunks hat.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Lokale Check-Gates und Changed-Routing

Die lokale Changed-Lane-Logik lebt in `scripts/changed-lanes.mjs` und wird von `scripts/check-changed.mjs` ausgeführt. Dieses lokale Check-Gate ist bei Architekturgrenzen strenger als der breite CI-Plattformumfang:

- Änderungen an Core-Produktionscode führen Core-Prod- und Core-Test-Typecheck plus Core-Lint/Guards aus;
- Änderungen nur an Core-Tests führen nur Core-Test-Typecheck plus Core-Lint aus;
- Änderungen an Extension-Produktionscode führen Extension-Prod- und Extension-Test-Typecheck plus Extension-Lint aus;
- Änderungen nur an Extension-Tests führen Extension-Test-Typecheck plus Extension-Lint aus;
- Änderungen am öffentlichen Plugin SDK oder Plugin-Vertrag erweitern auf Extension-Typecheck, weil Extensions von diesen Core-Verträgen abhängen (Vitest-Extension-Sweeps bleiben explizite Testarbeit);
- Release-Metadaten-only-Versionsbumps führen gezielte Versions-/Konfigurations-/Root-Dependency-Checks aus;
- unbekannte Root-/Konfigurationsänderungen fallen sicher auf alle Check-Lanes zurück.

Lokales Changed-Test-Routing lebt in `scripts/test-projects.test-support.mjs` und ist absichtlich günstiger als `check:changed`: Direkte Teständerungen führen sich selbst aus, Source-Änderungen bevorzugen explizite Zuordnungen, danach Sibling-Tests und Import-Graph-Abhängige. Die gemeinsame Group-Room-Delivery-Konfiguration ist eine der expliziten Zuordnungen: Änderungen an der sichtbaren Reply-Konfiguration der Gruppe, am Source-Reply-Delivery-Modus oder am System-Prompt des Message-Tools laufen durch die Core-Reply-Tests plus Discord- und Slack-Delivery-Regressionen, damit eine gemeinsame Default-Änderung vor dem ersten PR-Push fehlschlägt. Verwenden Sie `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` nur, wenn die Änderung harness-weit genug ist, dass die günstige zugeordnete Menge kein vertrauenswürdiger Proxy ist.

## Testbox-Validierung

Führen Sie Testbox aus dem Repository-Root aus und bevorzugen Sie für umfassende Nachweise eine frisch vorgewärmte Box. Bevor Sie einen langsamen Gate-Lauf auf eine Box verwenden, die wiederverwendet wurde, abgelaufen ist oder gerade eine unerwartet große Synchronisierung gemeldet hat, führen Sie zuerst `pnpm testbox:sanity` innerhalb der Box aus.

Der Sanity-Check schlägt schnell fehl, wenn erforderliche Root-Dateien wie `pnpm-lock.yaml` verschwunden sind oder wenn `git status --short` mindestens 200 nachverfolgte Löschungen anzeigt. Das bedeutet in der Regel, dass der Remote-Synchronisierungszustand keine vertrauenswürdige Kopie des PR ist; stoppen Sie diese Box und wärmen Sie stattdessen eine frische vor, anstatt den Produkttestfehler zu debuggen. Legen Sie für beabsichtigte PRs mit vielen Löschungen für diesen Sanity-Lauf `OPENCLAW_TESTBOX_ALLOW_MASS_DELETIONS=1` fest.

`pnpm testbox:run` beendet außerdem einen lokalen Blacksmith-CLI-Aufruf, der länger als fünf Minuten in der Synchronisierungsphase bleibt, ohne Ausgabe nach der Synchronisierung zu erzeugen. Legen Sie `OPENCLAW_TESTBOX_SYNC_TIMEOUT_MS=0` fest, um diesen Schutz zu deaktivieren, oder verwenden Sie für ungewöhnlich große lokale Diffs einen größeren Millisekundenwert.

Crabbox ist der repositoryeigene zweite Remote-Box-Pfad für Linux-Nachweise, wenn Blacksmith nicht verfügbar ist oder wenn eigene Cloud-Kapazität vorzuziehen ist. Wärmen Sie eine Box vor, hydratisieren Sie sie über den Projekt-Workflow, und führen Sie dann Befehle über die Crabbox-CLI aus:

```bash
pnpm crabbox:warmup -- --idle-timeout 90m
pnpm crabbox:hydrate -- --id <cbx_id>
pnpm crabbox:run -- --id <cbx_id> --shell "OPENCLAW_TESTBOX=1 pnpm check:changed"
pnpm crabbox:stop -- <cbx_id>
```

`.crabbox.yaml` verwaltet Provider-, Synchronisierungs- und GitHub-Actions-Hydrationsdefaults. Es schließt lokales `.git` aus, damit der hydratisierte Actions-Checkout seine eigenen Remote-Git-Metadaten behält, anstatt maintainerlokale Remotes und Objektspeicher zu synchronisieren, und es schließt lokale Runtime-/Build-Artefakte aus, die niemals übertragen werden sollten. `.github/workflows/crabbox-hydrate.yml` verwaltet Checkout, Node-/pnpm-Einrichtung, `origin/main`-Fetch und die nicht geheime Umgebungsübergabe, die spätere `crabbox run --id <cbx_id>`-Befehle beziehen.

## Verwandt

- [Installationsübersicht](/de/install)
- [Entwicklungskanäle](/de/install/development-channels)
