---
read_when:
    - Du musst verstehen, warum ein CI-Job ausgeführt wurde oder nicht.
    - Du debuggst fehlgeschlagene GitHub-Actions-Prüfungen.
summary: CI-Job-Graph, Scope-Gates und lokale Befehlsäquivalente
title: CI-Pipeline
x-i18n:
    generated_at: "2026-04-25T13:42:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: fc363efb98c9f82b585161a017ba1c599344a4e38c3fe683d81b0997d1d2fd4d
    source_path: ci.md
    workflow: 15
---

Die CI läuft bei jedem Push auf `main` und bei jedem Pull Request. Sie verwendet intelligentes Scoping, um teure Jobs zu überspringen, wenn sich nur nicht zusammenhängende Bereiche geändert haben.

QA Lab hat dedizierte CI-Lanes außerhalb des intelligent gescopten Haupt-Workflows. Der Workflow `Parity gate` läuft bei passenden PR-Änderungen und bei manuellem Dispatch; er baut die private QA-Laufzeit und vergleicht die agentischen Mock-Pakete für GPT-5.4 und Opus 4.6. Der Workflow `QA-Lab - All Lanes` läuft nächtlich auf `main` und bei manuellem Dispatch; er fächert das Mock-Parity-Gate, die Live-Matrix-Lane und die Live-Telegram-Lane als parallele Jobs auf. Die Live-Jobs verwenden die Umgebung `qa-live-shared`, und die Telegram-Lane verwendet Convex-Leases. `OpenClaw Release Checks` führt dieselben QA-Lab-Lanes ebenfalls vor der Release-Freigabe aus.

Der Workflow `Duplicate PRs After Merge` ist ein manueller Maintainer-Workflow zur Bereinigung von Duplikaten nach dem Landen. Er verwendet standardmäßig einen Dry-Run und schließt nur ausdrücklich aufgeführte PRs, wenn `apply=true` gesetzt ist. Bevor er Änderungen auf GitHub vornimmt, verifiziert er, dass der gelandete PR zusammengeführt wurde und dass jedes Duplikat entweder ein gemeinsam referenziertes Issue oder sich überschneidende geänderte Hunks hat.

Der Workflow `Docs Agent` ist eine ereignisgesteuerte Codex-Wartungs-Lane, um bestehende Dokumentation an kürzlich gelandete Änderungen anzugleichen. Er hat keinen reinen Zeitplan: Ein erfolgreicher CI-Lauf auf `main` nach einem Push, der nicht von einem Bot stammt, kann ihn auslösen, und ein manueller Dispatch kann ihn direkt ausführen. Aufrufe über Workflow-Run werden übersprungen, wenn `main` inzwischen weitergelaufen ist oder wenn in der letzten Stunde bereits ein anderer nicht übersprungener Docs-Agent-Lauf erstellt wurde. Wenn er läuft, prüft er den Commit-Bereich vom vorherigen Quell-SHA des letzten nicht übersprungenen Docs-Agent-Laufs bis zum aktuellen `main`, sodass ein stündlicher Lauf alle seit dem letzten Docs-Durchlauf aufgelaufenen Änderungen auf `main` abdecken kann.

Der Workflow `Test Performance Agent` ist eine ereignisgesteuerte Codex-Wartungs-Lane für langsame Tests. Er hat keinen reinen Zeitplan: Ein erfolgreicher CI-Lauf auf `main` nach einem Push, der nicht von einem Bot stammt, kann ihn auslösen, aber er wird übersprungen, wenn an diesem UTC-Tag bereits ein anderer Aufruf per Workflow-Run gelaufen ist oder noch läuft. Ein manueller Dispatch umgeht dieses tägliche Aktivitäts-Gate. Die Lane erstellt einen gruppierten Vitest-Performancebericht für die vollständige Suite, lässt Codex nur kleine testleistungsbezogene Korrekturen vornehmen, die die Abdeckung erhalten, statt breiter Refactorings, führt dann den vollständigen Bericht erneut aus und verwirft Änderungen, die die Anzahl der erfolgreich laufenden Baseline-Tests verringern. Wenn die Baseline fehlschlagende Tests enthält, darf Codex nur offensichtliche Fehler beheben, und der vollständige Bericht nach dem Agenten muss erfolgreich sein, bevor etwas committed wird. Wenn `main` weiterläuft, bevor der Bot-Push landet, rebaset die Lane den validierten Patch, führt `pnpm check:changed` erneut aus und versucht den Push erneut; veraltete Patches mit Konflikten werden übersprungen. Sie verwendet GitHub-hosted Ubuntu, damit die Codex-Aktion dieselbe Drop-sudo-Sicherheitsstrategie wie der Docs Agent beibehalten kann.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Job-Überblick

| Job                              | Zweck                                                                                        | Wann er läuft                       |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | Erkennt reine Docs-Änderungen, geänderte Scopes, geänderte Extensions und baut das CI-Manifest | Immer bei Nicht-Entwurfs-Pushes und PRs |
| `security-scm-fast`              | Erkennung privater Schlüssel und Workflow-Audit über `zizmor`                               | Immer bei Nicht-Entwurfs-Pushes und PRs |
| `security-dependency-audit`      | Audit der produktionsrelevanten, abhängigkeitfreien Lockfile gegen npm-Advisories           | Immer bei Nicht-Entwurfs-Pushes und PRs |
| `security-fast`                  | Erforderliches Aggregat für die schnellen Sicherheitsjobs                                    | Immer bei Nicht-Entwurfs-Pushes und PRs |
| `build-artifacts`                | Baut `dist/`, Control UI, Prüfungen für Build-Artefakte und wiederverwendbare Downstream-Artefakte | Bei Node-relevanten Änderungen      |
| `checks-fast-core`               | Schnelle Linux-Korrektheits-Lanes wie Checks für gebündelte Plugins/Plugin-Verträge/Protokolle | Bei Node-relevanten Änderungen      |
| `checks-fast-contracts-channels` | Gesplittete Kanalvertrags-Checks mit stabilem aggregiertem Check-Ergebnis                   | Bei Node-relevanten Änderungen      |
| `checks-node-extensions`         | Vollständige Test-Shards für gebündelte Plugins über die gesamte Extension-Suite            | Bei Node-relevanten Änderungen      |
| `checks-node-core-test`          | Core-Node-Test-Shards ohne Kanal-, gebündelte-, Vertrags- und Extension-Lanes               | Bei Node-relevanten Änderungen      |
| `extension-fast`                 | Fokussierte Tests nur für die geänderten gebündelten Plugins                                 | Pull Requests mit Extension-Änderungen |
| `check`                          | Gesplittetes Äquivalent des lokalen Haupt-Gates: Produktiv-Typen, Lint, Guards, Testtypen und strikter Smoke | Bei Node-relevanten Änderungen      |
| `check-additional`               | Architektur-, Boundary-, Extension-Surface-Guards, Package-Boundary- und Gateway-Watch-Shards | Bei Node-relevanten Änderungen      |
| `build-smoke`                    | Smoke-Tests für gebaute CLI und Startspeicher-Smoke                                          | Bei Node-relevanten Änderungen      |
| `checks`                         | Verifizierer für Kanaltests gegen Build-Artefakte plus Node-22-Kompatibilität nur für Pushes | Bei Node-relevanten Änderungen      |
| `check-docs`                     | Docs-Formatierung, Lint und Broken-Link-Checks                                               | Wenn Docs geändert wurden           |
| `skills-python`                  | Ruff + pytest für Python-basierte Skills                                                     | Bei Python-Skills-relevanten Änderungen |
| `checks-windows`                 | Windows-spezifische Test-Lanes                                                               | Bei Windows-relevanten Änderungen   |
| `macos-node`                     | macOS-TypeScript-Test-Lane mit gemeinsam genutzten Build-Artefakten                         | Bei macOS-relevanten Änderungen     |
| `macos-swift`                    | Swift-Lint, -Build und -Tests für die macOS-App                                              | Bei macOS-relevanten Änderungen     |
| `android`                        | Android-Unit-Tests für beide Varianten plus ein Debug-APK-Build                              | Bei Android-relevanten Änderungen   |
| `test-performance-agent`         | Tägliche Codex-Optimierung langsamer Tests nach vertrauenswürdiger Aktivität                 | Erfolg der Main-CI oder manueller Dispatch |

## Fail-fast-Reihenfolge

Jobs sind so angeordnet, dass günstige Prüfungen fehlschlagen, bevor teurere ausgeführt werden:

1. `preflight` entscheidet, welche Lanes überhaupt existieren. Die Logik `docs-scope` und `changed-scope` sind Schritte innerhalb dieses Jobs, keine eigenständigen Jobs.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` und `skills-python` schlagen schnell fehl, ohne auf die schwereren Artefakt- und Plattform-Matrix-Jobs zu warten.
3. `build-artifacts` überlappt mit den schnellen Linux-Lanes, damit nachgelagerte Verbraucher starten können, sobald der gemeinsame Build bereit ist.
4. Schwerere Plattform- und Laufzeit-Lanes fächern sich danach auf: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, das nur für PRs laufende `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` und `android`.

Die Scope-Logik befindet sich in `scripts/ci-changed-scope.mjs` und wird durch Unit-Tests in `src/scripts/ci-changed-scope.test.ts` abgedeckt.
Änderungen an CI-Workflows validieren den Node-CI-Graphen plus Workflow-Linting, erzwingen aber für sich genommen keine nativen Windows-, Android- oder macOS-Builds; diese Plattform-Lanes bleiben weiterhin auf Änderungen an plattformspezifischem Quellcode beschränkt.
Nur auf CI-Routing bezogene Änderungen, ausgewählte günstige Core-Test-Fixture-Änderungen sowie enge Plugin-Contract-Helper-/Test-Routing-Änderungen verwenden einen schnellen, nur auf Node basierenden Manifest-Pfad: preflight, security und eine einzelne `checks-fast-core`-Aufgabe. Dieser Pfad vermeidet Build-Artefakte, Node-22-Kompatibilität, Kanal-Contracts, vollständige Core-Shards, Shards für gebündelte Plugins und zusätzliche Guard-Matrizen, wenn sich die geänderten Dateien auf die Routing- oder Helper-Oberflächen beschränken, die von der schnellen Aufgabe direkt geprüft werden.
Windows-Node-Checks sind auf Windows-spezifische Prozess-/Pfad-Wrapper, npm/pnpm/UI-Runner-Helper, Paketmanager-Konfiguration und die CI-Workflow-Oberflächen beschränkt, die diese Lane ausführen; nicht zusammenhängende Quellcode-, Plugin-, Install-Smoke- und reine Test-Änderungen bleiben auf den Linux-Node-Lanes, damit sie keinen Windows-Worker mit 16 vCPUs für Abdeckung reservieren, die bereits durch die normalen Test-Shards ausgeübt wird.
Der separate Workflow `install-smoke` verwendet über seinen eigenen Job `preflight` dasselbe Scope-Skript erneut. Er teilt die Smoke-Abdeckung in `run_fast_install_smoke` und `run_full_install_smoke` auf. Pull Requests führen den schnellen Pfad für Docker-/Paket-Oberflächen, Änderungen an gebündelten Plugin-Paketen/Manifests sowie Core-Plugin-/Kanal-/Gateway-/Plugin-SDK-Oberflächen aus, die von den Docker-Smoke-Jobs geprüft werden. Nur Quellcode-Änderungen an gebündelten Plugins, reine Test-Änderungen und reine Docs-Änderungen reservieren keine Docker-Worker. Der schnelle Pfad baut das Root-Dockerfile-Image einmal, prüft die CLI, führt den CLI-Smoke `agents delete shared-workspace` aus, führt das Container-Gateway-Network-E2E aus, verifiziert ein Build-Argument für eine gebündelte Extension und führt das begrenzte Docker-Profil für gebündelte Plugins mit einem aggregierten Kommando-Timeout von 240 Sekunden aus, wobei jeder Szenario-`docker run` separat begrenzt wird. Der vollständige Pfad behält QR-Paketinstallation sowie Installer-Docker-/Update-Abdeckung für nächtliche geplante Läufe, manuelle Dispatches, Workflow-Call-Release-Checks und Pull Requests bei, die tatsächlich Installer-/Paket-/Docker-Oberflächen berühren. Pushes auf `main`, einschließlich Merge-Commits, erzwingen nicht den vollständigen Pfad; wenn die Changed-Scope-Logik bei einem Push vollständige Abdeckung anfordern würde, behält der Workflow den schnellen Docker-Smoke bei und überlässt den vollständigen Install-Smoke der nächtlichen oder Release-Validierung. Der langsame Smoke für den Bun-Global-Install-Image-Provider wird separat durch `run_bun_global_install_smoke` gegatet; er läuft im nächtlichen Zeitplan und aus dem Workflow für Release-Checks heraus, und manuelle `install-smoke`-Dispatches können ihn optional aktivieren, aber Pull Requests und Pushes auf `main` führen ihn nicht aus. QR- und Installer-Docker-Tests behalten ihre eigenen installfokussierten Dockerfiles. Lokal baut `test:docker:all` ein gemeinsames Live-Test-Image und ein gemeinsames Built-App-Image aus `scripts/e2e/Dockerfile` vor und führt dann die Live-/E2E-Smoke-Lanes mit einem gewichteten Scheduler und `OPENCLAW_SKIP_DOCKER_BUILD=1` aus; passe die Standard-Slot-Anzahl des Main-Pools von 10 mit `OPENCLAW_DOCKER_ALL_PARALLELISM` und die Slot-Anzahl des provider-sensitiven Tail-Pools von 10 mit `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` an. Die Limits schwerer Lanes sind standardmäßig `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=8` und `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`, damit npm-Install- und Multi-Service-Lanes Docker nicht überbelegen, während leichtere Lanes weiterhin verfügbare Slots füllen. Lane-Starts werden standardmäßig um 2 Sekunden gestaffelt, um lokale Create-Stürme des Docker-Daemons zu vermeiden; überschreibe dies mit `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` oder einem anderen Millisekundenwert. Das lokale aggregierte Preflight prüft Docker vorab, entfernt veraltete OpenClaw-E2E-Container, gibt den Status aktiver Lanes aus, speichert Lane-Zeiten für eine Sortierung nach längster Dauer zuerst und unterstützt `OPENCLAW_DOCKER_ALL_DRY_RUN=1` zur Prüfung des Schedulers. Es stoppt standardmäßig das Planen neuer gepoolter Lanes nach dem ersten Fehler, und jede Lane hat ein Fallback-Timeout von 120 Minuten, das mit `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` überschrieben werden kann; ausgewählte Live-/Tail-Lanes verwenden engere Limits pro Lane. Der wiederverwendbare Live-/E2E-Workflow spiegelt das Muster mit gemeinsamem Image wider, indem er vor der Docker-Matrix ein SHA-getaggtes GHCR-Docker-E2E-Image baut und pusht und dann die Matrix mit `OPENCLAW_SKIP_DOCKER_BUILD=1` ausführt. Der geplante Live-/E2E-Workflow führt täglich die vollständige Docker-Suite des Release-Pfads aus. Die Matrix für gebündelte Updates ist nach Update-Ziel aufgeteilt, sodass wiederholte npm-Update- und Doctor-Repair-Durchläufe mit anderen gebündelten Checks geshardet werden können.

Die lokale Changed-Lane-Logik befindet sich in `scripts/changed-lanes.mjs` und wird von `scripts/check-changed.mjs` ausgeführt. Dieses lokale Gate ist bei Architekturgrenzen strenger als das breite CI-Plattform-Scoping: Änderungen an produktivem Core-Code führen Core-Prod-Typecheck plus Core-Tests aus, reine Core-Test-Änderungen führen nur Core-Test-Typecheck/-Tests aus, Änderungen an produktivem Extension-Code führen Extension-Prod-Typecheck plus Extension-Tests aus, und reine Extension-Test-Änderungen führen nur Extension-Test-Typecheck/-Tests aus. Öffentliche Änderungen am Plugin SDK oder an Plugin-Contracts erweitern die Validierung auf Extensions, weil Extensions von diesen Core-Contracts abhängen. Reine Versionsanhebungen in Release-Metadaten führen gezielte Prüfungen für Version/Konfiguration/Root-Abhängigkeiten aus. Unbekannte Root-/Konfigurationsänderungen schlagen sicherheitshalber auf alle Lanes durch.

Bei Pushes fügt die Matrix `checks` die nur für Pushes laufende Lane `compat-node22` hinzu. Bei Pull Requests wird diese Lane übersprungen, und die Matrix bleibt auf die normalen Test-/Kanal-Lanes fokussiert.

Die langsamsten Node-Testfamilien sind aufgeteilt oder ausbalanciert, sodass jeder Job klein bleibt, ohne Runner übermäßig zu reservieren: Kanal-Contracts laufen als drei gewichtete Shards, Tests für gebündelte Plugins werden auf sechs Extension-Worker verteilt, kleine Core-Unit-Lanes werden gepaart, `auto-reply` läuft als drei ausbalancierte Worker statt sechs winziger Worker, und agentische Gateway-/Plugin-Konfigurationen werden über die bestehenden source-only agentic Node-Jobs verteilt, statt auf Build-Artefakte zu warten. Breite Browser-, QA-, Medien- und sonstige Plugin-Tests verwenden ihre dedizierten Vitest-Konfigurationen statt des gemeinsamen Plugin-Catch-all. Jobs für Extension-Shards führen bis zu zwei Plugin-Konfigurationsgruppen gleichzeitig mit einem Vitest-Worker pro Gruppe und einem größeren Node-Heap aus, damit importlastige Plugin-Batches keine zusätzlichen CI-Jobs erzeugen. Die breite Agents-Lane verwendet den gemeinsamen dateiparallelen Vitest-Scheduler, weil sie von Import-/Scheduling-Kosten dominiert wird und nicht von einer einzelnen langsamen Testdatei. `runtime-config` läuft mit dem Infra-Core-Runtime-Shard, damit der gemeinsame Runtime-Shard nicht den Tail besitzt. `check-additional` hält Package-Boundary-Compile-/Canary-Arbeit zusammen und trennt Runtime-Topologie-Architektur von Gateway-Watch-Abdeckung; der Boundary-Guard-Shard führt seine kleinen unabhängigen Guards gleichzeitig innerhalb eines Jobs aus. Gateway-Watch, Kanaltests und der Core-Support-Boundary-Shard laufen gleichzeitig innerhalb von `build-artifacts`, nachdem `dist/` und `dist-runtime/` bereits gebaut sind, behalten ihre alten Check-Namen als leichtgewichtige Verifizierer-Jobs bei und vermeiden gleichzeitig zwei zusätzliche Blacksmith-Worker und eine zweite Queue für Artefakt-Konsumenten.
Android-CI führt sowohl `testPlayDebugUnitTest` als auch `testThirdPartyDebugUnitTest` aus und baut dann das Play-Debug-APK. Die Third-Party-Variante hat kein separates Source-Set oder Manifest; ihre Unit-Test-Lane kompiliert diese Variante dennoch mit den SMS-/Anrufprotokoll-BuildConfig-Flags, vermeidet aber einen doppelten Debug-APK-Packaging-Job bei jedem Android-relevanten Push.
`extension-fast` ist nur für PRs gedacht, weil Push-Läufe bereits die vollständigen Shards für gebündelte Plugins ausführen. Das hält Feedback zu geänderten Plugins für Reviews bereit, ohne auf `main` einen zusätzlichen Blacksmith-Worker für Abdeckung zu reservieren, die bereits in `checks-node-extensions` vorhanden ist.

GitHub kann ersetzte Jobs als `cancelled` markieren, wenn ein neuerer Push auf derselben PR oder demselben `main`-Ref landet. Behandle das als CI-Rauschen, sofern nicht auch der neueste Lauf für denselben Ref fehlschlägt. Aggregierte Shard-Checks verwenden `!cancelled() && always()`, damit sie weiterhin normale Shard-Fehler melden, aber nicht in die Queue gehen, nachdem der gesamte Workflow bereits ersetzt wurde.
Der CI-Concurrency-Key ist versioniert (`CI-v7-*`), damit ein zombiehafter alter Queue-Group-Eintrag auf GitHub-Seite neuere Main-Läufe nicht unbegrenzt blockieren kann.

## Runner

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, schnelle Sicherheitsjobs und -Aggregate (`security-scm-fast`, `security-dependency-audit`, `security-fast`), schnelle Protokoll-/Contract-/Bundled-Checks, geshardete Kanal-Contract-Checks, `check`-Shards außer Lint, `check-additional`-Shards und -Aggregate, Aggregate-Verifizierer für Node-Tests, Docs-Checks, Python-Skills, workflow-sanity, labeler, auto-response; das install-smoke-Preflight verwendet ebenfalls GitHub-hosted Ubuntu, damit die Blacksmith-Matrix früher in die Queue gehen kann |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux-Node-Test-Shards, Test-Shards für gebündelte Plugins, `android`                                                                                                                                                                                                                                                                                                                                                                 |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, das weiterhin CPU-sensitiv genug ist, dass 8 vCPUs mehr kosteten als sie einsparten; install-smoke-Docker-Builds, bei denen die Queue-Zeit von 32 vCPUs mehr kostete als sie einsparten                                                                                                                                                                                                                                                               |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` auf `openclaw/openclaw`; Forks fallen auf `macos-latest` zurück                                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` auf `openclaw/openclaw`; Forks fallen auf `macos-latest` zurück                                                                                                                                                                                                                                                                                                                                                                                          |

## Lokale Äquivalente

```bash
pnpm changed:lanes   # den lokalen Changed-Lane-Klassifikator für origin/main...HEAD prüfen
pnpm check:changed   # intelligentes lokales Gate: geänderter Typecheck/Lint/Tests nach Boundary-Lane
pnpm check          # schnelles lokales Gate: produktives tsgo + geshardetes Lint + parallele schnelle Guards
pnpm check:test-types
pnpm check:timed    # dasselbe Gate mit Timings pro Phase
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # Vitest-Tests
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # Docs-Formatierung + Lint + Broken Links
pnpm build          # `dist` bauen, wenn CI-Artefakt-/build-smoke-Lanes relevant sind
node scripts/ci-run-timings.mjs <run-id>      # Wall Time, Queue-Zeit und langsamste Jobs zusammenfassen
node scripts/ci-run-timings.mjs --recent 10   # aktuelle erfolgreiche Main-CI-Läufe vergleichen
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## Verwandt

- [Installationsüberblick](/de/install)
- [Release-Kanäle](/de/install/development-channels)
