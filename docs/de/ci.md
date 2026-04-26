---
read_when:
    - Sie müssen verstehen, warum ein CI-Job ausgeführt wurde oder nicht.
    - Sie beheben Fehler bei fehlschlagenden GitHub-Actions-Prüfungen.
summary: CI-Job-Graph, Bereichs-Gates und lokale Befehlsäquivalente
title: CI-Pipeline
x-i18n:
    generated_at: "2026-04-26T11:24:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1a6c14f785434585f2b3a72bcd2cff3a281e51fe12cc4c14aa7613d47cd8efc4
    source_path: ci.md
    workflow: 15
---

Die CI läuft bei jedem Push nach `main` und bei jedem Pull Request. Sie verwendet intelligentes Scoping, um teure Jobs zu überspringen, wenn nur nicht zusammenhängende Bereiche geändert wurden.

QA Lab hat eigene CI-Lanes außerhalb des Haupt-Workflows mit intelligentem Scoping. Der Workflow `Parity gate` läuft bei passenden PR-Änderungen und bei manueller Auslösung; er baut die private QA-Laufzeit und vergleicht die agentischen Mock-Pakete GPT-5.5 und Opus 4.6. Der Workflow `QA-Lab - All Lanes` läuft nachts auf `main` und bei manueller Auslösung; er fächert das Mock-Parity-Gate, die Live-Matrix-Lane und die Live-Telegram-Lane als parallele Jobs auf. Die Live-Jobs verwenden die Umgebung `qa-live-shared`, und die Telegram-Lane verwendet Convex-Leases. `OpenClaw Release Checks` führt vor der Freigabegenehmigung ebenfalls dieselben QA-Lab-Lanes aus.

Der Workflow `Duplicate PRs After Merge` ist ein manueller Maintainer-Workflow für die Bereinigung doppelter PRs nach dem Merge. Standardmäßig läuft er im Dry-Run-Modus und schließt nur explizit aufgeführte PRs, wenn `apply=true` gesetzt ist. Bevor GitHub verändert wird, prüft er, dass der gelandete PR gemergt ist und dass jeder doppelte PR entweder ein gemeinsames referenziertes Issue oder überlappende geänderte Hunk-Bereiche hat.

Der Workflow `Docs Agent` ist eine ereignisgesteuerte Codex-Wartungslane, um bestehende Dokumentation an kürzlich gelandete Änderungen anzupassen. Er hat keinen reinen Zeitplan: Ein erfolgreicher CI-Lauf auf `main` nach einem Nicht-Bot-Push kann ihn auslösen, und eine manuelle Auslösung kann ihn direkt starten. Aufrufe über Workflow-Run werden übersprungen, wenn `main` inzwischen weitergezogen ist oder wenn in der letzten Stunde bereits ein anderer nicht übersprungener Lauf von Docs Agent erstellt wurde. Wenn er läuft, prüft er den Commit-Bereich von der vorherigen nicht übersprungenen Docs-Agent-Quell-SHA bis zum aktuellen `main`, sodass ein stündlicher Lauf alle seit dem letzten Docs-Durchlauf angesammelten Änderungen auf `main` abdecken kann.

Der Workflow `Test Performance Agent` ist eine ereignisgesteuerte Codex-Wartungslane für langsame Tests. Er hat keinen reinen Zeitplan: Ein erfolgreicher CI-Lauf auf `main` nach einem Nicht-Bot-Push kann ihn auslösen, wird aber übersprungen, wenn an diesem UTC-Tag bereits ein anderer Aufruf über Workflow-Run gelaufen ist oder gerade läuft. Eine manuelle Auslösung umgeht dieses tägliche Aktivitäts-Gate. Die Lane erstellt einen Performance-Bericht für die gesamte Testsuite mit gruppiertem Vitest, lässt Codex nur kleine testleistungsbezogene Korrekturen vornehmen, die die Abdeckung erhalten, statt breiter Refactorings, führt dann den vollständigen Bericht erneut aus und lehnt Änderungen ab, die die Anzahl der erfolgreichen Baseline-Tests reduzieren. Wenn die Baseline fehlschlagende Tests enthält, darf Codex nur offensichtliche Fehler beheben, und der vollständige Nachher-Bericht muss erfolgreich sein, bevor etwas committet wird. Wenn `main` weiterzieht, bevor der Bot-Push landet, rebased die Lane den validierten Patch, führt `pnpm check:changed` erneut aus und versucht den Push erneut; veraltete konfliktbehaftete Patches werden übersprungen. Sie verwendet GitHub-hosted Ubuntu, damit die Codex-Aktion dieselbe Drop-Sudo-Sicherheitsstrategie wie der Docs Agent beibehalten kann.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Job-Überblick

| Job                              | Zweck                                                                                        | Wann er läuft                        |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                      | Erkennt reine Docs-Änderungen, geänderte Bereiche, geänderte Erweiterungen und erstellt das CI-Manifest | Immer bei Nicht-Draft-Pushes und PRs |
| `security-scm-fast`              | Erkennung privater Schlüssel und Workflow-Audit über `zizmor`                               | Immer bei Nicht-Draft-Pushes und PRs |
| `security-dependency-audit`      | Produktionssperrdatei-Audit ohne Abhängigkeiten gegen npm-Advisories                        | Immer bei Nicht-Draft-Pushes und PRs |
| `security-fast`                  | Erforderliche Aggregation für die schnellen Sicherheitsjobs                                 | Immer bei Nicht-Draft-Pushes und PRs |
| `build-artifacts`                | Baut `dist/`, Control UI, Prüfungen gebauter Artefakte und wiederverwendbare nachgelagerte Artefakte | Bei Node-relevanten Änderungen       |
| `checks-fast-core`               | Schnelle Linux-Korrektheits-Lanes wie Prüfungen für gebündelte Plugins/Plugin-Verträge/Protokolle | Bei Node-relevanten Änderungen       |
| `checks-fast-contracts-channels` | Gesplittete Prüfungen für Channel-Verträge mit einem stabilen aggregierten Prüfergebnis     | Bei Node-relevanten Änderungen       |
| `checks-node-extensions`         | Vollständige Test-Shards für gebündelte Plugins über die gesamte Erweiterungssuite          | Bei Node-relevanten Änderungen       |
| `checks-node-core-test`          | Core-Node-Test-Shards, ohne Channel-, gebündelte Plugin-, Vertrags- und Erweiterungslanes   | Bei Node-relevanten Änderungen       |
| `extension-fast`                 | Gezielte Tests nur für die geänderten gebündelten Plugins                                   | Pull Requests mit Erweiterungsänderungen |
| `check`                          | Gesplittetes Äquivalent zum lokalen Haupt-Gate: Prod-Typen, Lint, Guards, Test-Typen und strenger Smoke-Test | Bei Node-relevanten Änderungen       |
| `check-additional`               | Shards für Architektur-, Boundary-, Erweiterungsoberflächen-Guards, Paketgrenzen und Gateway-Watch | Bei Node-relevanten Änderungen       |
| `build-smoke`                    | Smoke-Tests für die gebaute CLI und Startup-Memory-Smoke                                    | Bei Node-relevanten Änderungen       |
| `checks`                         | Verifier für Channel-Tests mit gebauten Artefakten plus nur bei Push Node-22-Kompatibilität | Bei Node-relevanten Änderungen       |
| `check-docs`                     | Docs-Formatierung, Lint und Prüfungen auf fehlerhafte Links                                 | Wenn Docs geändert wurden            |
| `skills-python`                  | Ruff + pytest für Python-basierte Skills                                                    | Bei Python-Skills-relevanten Änderungen |
| `checks-windows`                 | Windows-spezifische Test-Lanes                                                              | Bei Windows-relevanten Änderungen    |
| `macos-node`                     | macOS-TypeScript-Test-Lane mit den gemeinsam genutzten gebauten Artefakten                  | Bei macOS-relevanten Änderungen      |
| `macos-swift`                    | Swift-Lint, Build und Tests für die macOS-App                                               | Bei macOS-relevanten Änderungen      |
| `android`                        | Android-Unit-Tests für beide Varianten plus ein Debug-APK-Build                             | Bei Android-relevanten Änderungen    |
| `test-performance-agent`         | Tägliche Codex-Optimierung langsamer Tests nach vertrauenswürdiger Aktivität                | Erfolg der Main-CI oder manuelle Auslösung |

## Fail-fast-Reihenfolge

Jobs sind so angeordnet, dass günstige Prüfungen fehlschlagen, bevor teurere Jobs laufen:

1. `preflight` entscheidet, welche Lanes überhaupt existieren. Die Logik `docs-scope` und `changed-scope` sind Schritte innerhalb dieses Jobs, keine eigenständigen Jobs.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` und `skills-python` schlagen schnell fehl, ohne auf die schwereren Artefakt- und Plattform-Matrix-Jobs zu warten.
3. `build-artifacts` überlappt sich mit den schnellen Linux-Lanes, damit nachgelagerte Verbraucher starten können, sobald der gemeinsame Build bereit ist.
4. Schwerere Plattform- und Laufzeit-Lanes fächern sich danach auf: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, das nur für PRs laufende `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` und `android`.

Die Bereichslogik liegt in `scripts/ci-changed-scope.mjs` und wird durch Unit-Tests in `src/scripts/ci-changed-scope.test.ts` abgedeckt.
Änderungen an CI-Workflows validieren den Node-CI-Graphen plus Workflow-Linting, erzwingen aber nicht von sich aus Windows-, Android- oder macOS-Native-Builds; diese Plattform-Lanes bleiben auf Änderungen an plattformspezifischem Quellcode beschränkt.
Änderungen nur am CI-Routing, ausgewählte günstige Änderungen an Core-Test-Fixtures sowie enge Änderungen an Plugin-Contract-Helpern/Test-Routing verwenden einen schnellen Node-only-Manifestpfad: preflight, security und eine einzelne `checks-fast-core`-Aufgabe. Dieser Pfad vermeidet Build-Artefakte, Node-22-Kompatibilität, Channel-Contracts, vollständige Core-Shards, Shards für gebündelte Plugins und zusätzliche Guard-Matrizen, wenn die geänderten Dateien auf die Routing- oder Helper-Oberflächen beschränkt sind, die die schnelle Aufgabe direkt ausführt.
Windows-Node-Prüfungen sind auf Windows-spezifische Prozess-/Pfad-Wrapper, npm/pnpm/UI-Runner-Helper, Package-Manager-Konfiguration und die CI-Workflow-Oberflächen beschränkt, die diese Lane ausführen; nicht zusammenhängende Source-, Plugin-, Install-Smoke- und reine Teständerungen bleiben auf den Linux-Node-Lanes, damit sie keinen Windows-Worker mit 16 vCPUs für Abdeckung reservieren, die bereits durch die normalen Test-Shards ausgeübt wird.
Der separate Workflow `install-smoke` verwendet dasselbe Bereichsskript erneut über seinen eigenen `preflight`-Job. Er teilt die Smoke-Abdeckung in `run_fast_install_smoke` und `run_full_install_smoke` auf. Pull Requests führen den schnellen Pfad für Docker-/Paket-Oberflächen, Änderungen an gebündelten Plugin-Paketen/-Manifesten und Core-Plugin-/Channel-/Gateway-/Plugin-SDK-Oberflächen aus, die die Docker-Smoke-Jobs ausüben. Reine Source-Änderungen an gebündelten Plugins, reine Teständerungen und reine Docs-Änderungen reservieren keine Docker-Worker. Der schnelle Pfad baut das Root-Dockerfile-Image einmal, prüft die CLI, führt den CLI-Smoke `agents delete shared-workspace` aus, führt das Container-Gateway-Network-E2E aus, verifiziert ein Build-Arg für eine gebündelte Erweiterung und führt das begrenzte Docker-Profil für gebündelte Plugins unter einem aggregierten Befehls-Timeout von 240 Sekunden aus, wobei jede Docker-Ausführung pro Szenario separat begrenzt wird. Der vollständige Pfad behält die QR-Paketinstallation und die Docker-/Update-Abdeckung des Installers für nächtliche geplante Läufe, manuelle Auslösungen, workflow-call-Release-Checks und Pull Requests bei, die tatsächlich Installer-/Paket-/Docker-Oberflächen berühren. Pushes nach `main`, einschließlich Merge-Commits, erzwingen den vollständigen Pfad nicht; wenn die changed-scope-Logik bei einem Push vollständige Abdeckung anfordern würde, behält der Workflow den schnellen Docker-Smoke bei und überlässt den vollständigen Install-Smoke der nächtlichen oder Release-Validierung. Der langsame Image-Provider-Smoke für globale Bun-Installationen wird separat über `run_bun_global_install_smoke` gesteuert; er läuft im nächtlichen Zeitplan und aus dem Workflow für Release-Checks, und manuelle `install-smoke`-Auslösungen können ihn optional einschließen, aber Pull Requests und Pushes nach `main` führen ihn nicht aus. QR- und Installer-Docker-Tests behalten ihre eigenen installfokussierten Dockerfiles. Lokal baut `test:docker:all` ein gemeinsames Live-Test-Image und ein gemeinsames Built-App-Image aus `scripts/e2e/Dockerfile` vor und führt dann die Live-/E2E-Smoke-Lanes mit einem gewichteten Scheduler und `OPENCLAW_SKIP_DOCKER_BUILD=1` aus; passen Sie die Standard-Slot-Anzahl des Main-Pools von 10 mit `OPENCLAW_DOCKER_ALL_PARALLELISM` und die Standard-Slot-Anzahl des providerempfindlichen Tail-Pools von 10 mit `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` an. Limits für schwere Lanes sind standardmäßig `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=8` und `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`, damit npm-Installationen und Multi-Service-Lanes Docker nicht überbuchen, während leichtere Lanes verfügbare Slots weiterhin ausfüllen. Lane-Starts werden standardmäßig um 2 Sekunden versetzt, um lokale Create-Stürme des Docker-Daemons zu vermeiden; überschreiben Sie dies mit `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` oder einem anderen Millisekundenwert. Das lokale aggregierte Preflight prüft Docker vorab, entfernt veraltete OpenClaw-E2E-Container, gibt den Status aktiver Lanes aus, speichert Lane-Timings für längste-zuerst-Reihenfolge und unterstützt `OPENCLAW_DOCKER_ALL_DRY_RUN=1` zur Prüfung des Schedulers. Es hört standardmäßig nach dem ersten Fehler auf, neue gepoolte Lanes zu planen, und jede Lane hat ein Fallback-Timeout von 120 Minuten, das mit `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` überschrieben werden kann; ausgewählte Live-/Tail-Lanes verwenden engere Limits pro Lane. Der wiederverwendbare Live-/E2E-Workflow spiegelt das Muster mit gemeinsamen Images wider, indem vor der Docker-Matrix ein SHA-getaggtes GHCR-Docker-E2E-Image gebaut und gepusht wird; dann läuft die Matrix mit `OPENCLAW_SKIP_DOCKER_BUILD=1`. Der geplante Live-/E2E-Workflow führt täglich die vollständige Docker-Suite des Release-Pfads aus. Die Matrix für gebündelte Updates wird nach Update-Ziel aufgeteilt, sodass wiederholte npm-Update- und Doctor-Repair-Durchläufe gemeinsam mit anderen gebündelten Prüfungen geshardet werden können.

Die lokale Changed-Lane-Logik liegt in `scripts/changed-lanes.mjs` und wird von `scripts/check-changed.mjs` ausgeführt. Dieses lokale Gate ist bei Architekturgrenzen strenger als der breite CI-Plattformbereich: Änderungen an der Core-Produktionslogik führen Core-Prod-Typecheck plus Core-Tests aus, reine Core-Teständerungen führen nur Core-Test-Typecheck/-Tests aus, Änderungen an der Produktionslogik von Erweiterungen führen Extension-Prod-Typecheck plus Extension-Tests aus, und reine Extension-Teständerungen führen nur Extension-Test-Typecheck/-Tests aus. Öffentliche Änderungen am Plugin SDK oder an Plugin-Contracts erweitern auf Erweiterungsvalidierung, weil Erweiterungen von diesen Core-Verträgen abhängen. Reine Versionsanhebungen in Release-Metadaten führen gezielte Prüfungen für Version/Konfiguration/Root-Abhängigkeiten aus. Unbekannte Änderungen an Root/Konfiguration schlagen sicherheitsorientiert auf alle Lanes durch.

Bei Pushes fügt die Matrix `checks` die nur bei Pushes laufende Lane `compat-node22` hinzu. Bei Pull Requests wird diese Lane übersprungen und die Matrix bleibt auf die normalen Test-/Channel-Lanes fokussiert.

Die langsamsten Node-Testfamilien sind aufgeteilt oder ausbalanciert, damit jeder Job klein bleibt, ohne Runner übermäßig zu reservieren: Channel-Contracts laufen als drei gewichtete Shards, Tests für gebündelte Plugins werden über sechs Erweiterungs-Worker ausbalanciert, kleine Core-Unit-Lanes werden gepaart, Auto-Reply läuft auf vier ausbalancierten Workern, wobei der Reply-Teilbaum in Agent-Runner-, Dispatch- und Commands-/State-Routing-Shards aufgeteilt ist, und agentische Gateway-/Plugin-Konfigurationen werden über die vorhandenen source-only-agentischen Node-Jobs verteilt, statt auf Build-Artefakte zu warten. Breite Browser-, QA-, Medien- und sonstige Plugin-Tests verwenden ihre dedizierten Vitest-Konfigurationen statt des gemeinsam genutzten Catch-all für Plugins. Jobs für Erweiterungs-Shards führen bis zu zwei Plugin-Konfigurationsgruppen gleichzeitig aus, mit einem Vitest-Worker pro Gruppe und größerem Node-Heap, damit importlastige Plugin-Batches keine zusätzlichen CI-Jobs erzeugen. Die breite Agents-Lane verwendet den gemeinsam genutzten file-parallel-Scheduler von Vitest, weil sie von Importen/Planung dominiert wird und nicht von einer einzelnen langsamen Testdatei. `runtime-config` läuft zusammen mit dem Infra-Core-Runtime-Shard, damit der gemeinsame Runtime-Shard nicht das Tail besitzt. Include-Pattern-Shards zeichnen Timingeinträge mit dem Namen des CI-Shards auf, sodass `.artifacts/vitest-shard-timings.json` eine vollständige Konfiguration von einem gefilterten Shard unterscheiden kann. `check-additional` hält Kompilierungs-/Canary-Arbeit an Paketgrenzen zusammen und trennt Architektur der Runtime-Topologie von Gateway-Watch-Abdeckung; der Boundary-Guard-Shard führt seine kleinen unabhängigen Guards parallel innerhalb eines Jobs aus. Gateway-Watch, Channel-Tests und der Core-Support-Boundary-Shard laufen innerhalb von `build-artifacts` parallel, nachdem `dist/` und `dist-runtime/` bereits gebaut wurden; dadurch behalten sie ihre alten Prüfnamen als leichtgewichtige Verifier-Jobs und vermeiden zugleich zwei zusätzliche Blacksmith-Worker und eine zweite Queue für Artefaktverbraucher.
Android-CI führt sowohl `testPlayDebugUnitTest` als auch `testThirdPartyDebugUnitTest` aus und baut dann das Play-Debug-APK. Das Third-Party-Flavor hat kein separates Source-Set oder Manifest; seine Unit-Test-Lane kompiliert dieses Flavor dennoch mit den SMS-/Anruflisten-BuildConfig-Flags, vermeidet dabei aber einen doppelten Debug-APK-Packaging-Job bei jedem Android-relevanten Push.
`extension-fast` ist nur für PRs, weil Push-Läufe bereits die vollständigen Shards für gebündelte Plugins ausführen. So bleibt Feedback zu geänderten Plugins für Reviews erhalten, ohne auf `main` einen zusätzlichen Blacksmith-Worker für Abdeckung zu reservieren, die bereits in `checks-node-extensions` vorhanden ist.

GitHub kann ersetzte Jobs als `cancelled` markieren, wenn ein neuerer Push auf derselben PR oder demselben `main`-Ref landet. Behandeln Sie das als CI-Rauschen, außer der neueste Lauf für denselben Ref schlägt ebenfalls fehl. Aggregierte Shard-Checks verwenden `!cancelled() && always()`, damit sie normale Shard-Fehler weiterhin melden, aber nicht mehr in die Queue gehen, nachdem der gesamte Workflow bereits ersetzt wurde.
Der CI-Concurrency-Key ist versioniert (`CI-v7-*`), sodass ein Zombie in einer alten Queue-Gruppe auf GitHub-Seite neuere Main-Läufe nicht unbegrenzt blockieren kann.

## Runner

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, schnelle Sicherheitsjobs und -aggregate (`security-scm-fast`, `security-dependency-audit`, `security-fast`), schnelle Protokoll-/Contract-/gebündelte Prüfungen, geshardete Channel-Contract-Prüfungen, `check`-Shards außer Lint, `check-additional`-Shards und -Aggregate, Verifier-Aggregate für Node-Tests, Docs-Prüfungen, Python-Skills, workflow-sanity, labeler, auto-response; das `preflight` von install-smoke verwendet ebenfalls GitHub-hosted Ubuntu, damit die Blacksmith-Matrix früher in die Queue gehen kann |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux-Node-Test-Shards, Test-Shards für gebündelte Plugins, `android`                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, das weiterhin CPU-empfindlich genug ist, dass 8 vCPU mehr kosteten als sie einsparten; install-smoke-Docker-Builds, bei denen die Queue-Zeit mit 32 vCPU mehr kostete als sie einsparten                                                                                                                                                                                                                                                               |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` auf `openclaw/openclaw`; Forks fallen auf `macos-latest` zurück                                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` auf `openclaw/openclaw`; Forks fallen auf `macos-latest` zurück                                                                                                                                                                                                                                                                                                                                                                                          |

## Lokale Äquivalente

```bash
pnpm changed:lanes   # den lokalen Changed-Lane-Klassifikator für origin/main...HEAD prüfen
pnpm check:changed   # intelligentes lokales Gate: geänderter Typecheck/Lint/Tests nach Boundary-Lane
pnpm check          # schnelles lokales Gate: Produktions-tsgo + geshardetes Lint + parallele schnelle Guards
pnpm check:test-types
pnpm check:timed    # dasselbe Gate mit Timings pro Phase
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # Vitest-Tests
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # Docs-Format + Lint + fehlerhafte Links
pnpm build          # `dist` bauen, wenn CI-Artefakt-/build-smoke-Lanes relevant sind
pnpm ci:timings                               # den neuesten Push-CI-Lauf von origin/main zusammenfassen
pnpm ci:timings:recent                        # aktuelle erfolgreiche Main-CI-Läufe vergleichen
node scripts/ci-run-timings.mjs <run-id>      # Wall Time, Queue-Zeit und langsamste Jobs zusammenfassen
node scripts/ci-run-timings.mjs --latest-main # Issue-/Kommentar-Rauschen ignorieren und den Push-CI-Lauf von origin/main wählen
node scripts/ci-run-timings.mjs --recent 10   # aktuelle erfolgreiche Main-CI-Läufe vergleichen
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## Verwandte Inhalte

- [Installationsüberblick](/de/install)
- [Release-Channels](/de/install/development-channels)
