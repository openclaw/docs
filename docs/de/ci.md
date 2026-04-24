---
read_when:
    - Sie müssen verstehen, warum ein CI-Job ausgeführt wurde oder nicht.
    - Sie debuggen fehlgeschlagene GitHub-Actions-Prüfungen.
summary: CI-Job-Graph, Scope-Gates und lokale Befehlsäquivalente
title: CI-Pipeline
x-i18n:
    generated_at: "2026-04-24T08:57:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 489ac05725a316b25f56f7f754d6a8652abbd60481fbe6e692572b81581fe405
    source_path: ci.md
    workflow: 15
---

Die CI läuft bei jedem Push auf `main` und bei jedem Pull Request. Sie verwendet intelligentes Scoping, um teure Jobs zu überspringen, wenn sich nur nicht zusammenhängende Bereiche geändert haben.

QA Lab hat dedizierte CI-Lanes außerhalb des Haupt-Workflows mit intelligentem Scoping. Der
Workflow `Parity gate` läuft bei passenden PR-Änderungen und bei manuellem Dispatch; er
baut die private QA-Laufzeitumgebung und vergleicht die agentischen Packs für Mock GPT-5.4 und Opus 4.6.
Der Workflow `QA-Lab - All Lanes` läuft nachts auf `main` und bei
manuellem Dispatch; er fächert das Mock-Parity-Gate, die Live-Matrix-Lane und die Live-
Telegram-Lane als parallele Jobs auf. Die Live-Jobs verwenden die Umgebung
`qa-live-shared`, und die Telegram-Lane verwendet Convex-Leases. `OpenClaw Release
Checks` führt vor der Release-Freigabe ebenfalls dieselben QA-Lab-Lanes aus.

Der Workflow `Duplicate PRs After Merge` ist ein manueller Maintainer-Workflow für
die Bereinigung von Duplikaten nach dem Merge. Standardmäßig läuft er als Dry Run und schließt nur explizit
aufgelistete PRs, wenn `apply=true` gesetzt ist. Bevor GitHub verändert wird,
prüft er, dass der gelandete PR gemergt ist und dass jedes Duplikat entweder ein gemeinsames referenziertes Issue
oder überlappende geänderte Hunk-Bereiche hat.

Der Workflow `Docs Agent` ist eine ereignisgesteuerte Codex-Wartungslane, um
bestehende Docs an kürzlich gelandete Änderungen angepasst zu halten. Er hat keinen reinen Zeitplan:
Ein erfolgreicher nicht von einem Bot stammender Push-CI-Lauf auf `main` kann ihn auslösen, und manueller Dispatch kann
ihn direkt ausführen. Aufrufe per Workflow-Run werden übersprungen, wenn `main` inzwischen weitergezogen ist oder wenn
im letzten Stunde bereits ein anderer nicht übersprungener Docs-Agent-Lauf erstellt wurde. Wenn er läuft,
prüft er den Commit-Bereich vom vorherigen nicht übersprungenen Docs-Agent-Source-SHA bis zum
aktuellen `main`, sodass ein stündlicher Lauf alle Änderungen auf `main` seit dem
letzten Docs-Durchlauf abdecken kann.

Der Workflow `Test Performance Agent` ist eine ereignisgesteuerte Codex-Wartungslane
für langsame Tests. Er hat keinen reinen Zeitplan: Ein erfolgreicher nicht von einem Bot stammender Push-CI-Lauf auf
`main` kann ihn auslösen, aber er wird übersprungen, wenn an diesem UTC-Tag bereits ein anderer
workflow-run-Aufruf gelaufen ist oder gerade läuft. Manueller Dispatch umgeht diese tägliche
Aktivitätsprüfung. Die Lane erstellt einen gruppierten Vitest-Performancebericht für die vollständige Test-Suite, lässt Codex
nur kleine testleistungsbezogene Korrekturen vornehmen, die die Abdeckung erhalten, statt umfassender
Refactorings, führt dann den vollständigen Bericht erneut aus und lehnt Änderungen ab, die
die Zahl der bestandenen Baseline-Tests verringern. Wenn die Baseline fehlschlagende Tests hat,
darf Codex nur offensichtliche Fehler beheben, und der vollständige Bericht nach dem Agenten muss bestehen, bevor
irgendetwas committet wird. Wenn `main` weitergeht, bevor der Bot-Push landet, rebaset die Lane
den validierten Patch, führt `pnpm check:changed` erneut aus und versucht den Push erneut;
konfliktbehaftete veraltete Patches werden übersprungen. Sie verwendet GitHub-gehostetes Ubuntu, damit die Codex-
Action dieselbe Drop-Sudo-Sicherheitsposition wie der Docs Agent beibehalten kann.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Job-Übersicht

| Job                              | Zweck                                                                                        | Wann er läuft                       |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | Erkennt reine Docs-Änderungen, geänderte Scopes, geänderte Erweiterungen und erstellt das CI-Manifest | Immer bei nicht als Draft markierten Pushes und PRs |
| `security-scm-fast`              | Erkennung privater Schlüssel und Workflow-Audit über `zizmor`                               | Immer bei nicht als Draft markierten Pushes und PRs |
| `security-dependency-audit`      | Audit der produktionsrelevanten Lockfile ohne Abhängigkeiten gegen npm-Advisories           | Immer bei nicht als Draft markierten Pushes und PRs |
| `security-fast`                  | Erforderliche Aggregation für die schnellen Sicherheitsjobs                                  | Immer bei nicht als Draft markierten Pushes und PRs |
| `build-artifacts`                | Baut `dist/`, Control UI, Prüfungen für gebaute Artefakte und wiederverwendbare Downstream-Artefakte | Bei Node-relevanten Änderungen      |
| `checks-fast-core`               | Schnelle Linux-Korrektheits-Lanes wie bundled/plugin-contract/protocol-Prüfungen            | Bei Node-relevanten Änderungen      |
| `checks-fast-contracts-channels` | Gesplittete Channel-Contract-Prüfungen mit einem stabilen aggregierten Prüfergebnis         | Bei Node-relevanten Änderungen      |
| `checks-node-extensions`         | Vollständige Test-Shards für gebündelte Plugins über die gesamte Erweiterungssuite          | Bei Node-relevanten Änderungen      |
| `checks-node-core-test`          | Core-Node-Test-Shards, ohne Channel-, bundled-, contract- und extension-Lanes               | Bei Node-relevanten Änderungen      |
| `extension-fast`                 | Fokussierte Tests nur für die geänderten gebündelten Plugins                                | Pull Requests mit Erweiterungsänderungen |
| `check`                          | Gesplittetes Äquivalent zum lokalen Haupt-Gate: Prod-Typen, Lint, Guards, Test-Typen und strikter Smoke-Test | Bei Node-relevanten Änderungen      |
| `check-additional`               | Architektur-, Boundary-, Erweiterungsflächen-Guards, Package-Boundary- und Gateway-Watch-Shards | Bei Node-relevanten Änderungen      |
| `build-smoke`                    | Smoke-Tests für gebaute CLI und Startup-Memory-Smoke                                        | Bei Node-relevanten Änderungen      |
| `checks`                         | Verifier für gebaute-Artefakt-Channel-Tests plus nur für Pushes Node-22-Kompatibilität      | Bei Node-relevanten Änderungen      |
| `check-docs`                     | Docs-Formatierung, Lint und Prüfungen auf defekte Links                                      | Wenn Docs geändert wurden           |
| `skills-python`                  | Ruff + pytest für Python-basierte Skills                                                    | Bei Python-Skills-relevanten Änderungen |
| `checks-windows`                 | Windows-spezifische Test-Lanes                                                               | Bei Windows-relevanten Änderungen   |
| `macos-node`                     | macOS-TypeScript-Test-Lane mit den gemeinsam genutzten gebauten Artefakten                  | Bei macOS-relevanten Änderungen     |
| `macos-swift`                    | Swift-Lint, Build und Tests für die macOS-App                                               | Bei macOS-relevanten Änderungen     |
| `android`                        | Android-Unit-Tests für beide Varianten plus ein Debug-APK-Build                             | Bei Android-relevanten Änderungen   |
| `test-performance-agent`         | Tägliche Codex-Optimierung langsamer Tests nach vertrauenswürdiger Aktivität                | Erfolg der Main-CI oder manueller Dispatch |

## Fail-Fast-Reihenfolge

Jobs sind so angeordnet, dass günstige Prüfungen fehlschlagen, bevor teure ausgeführt werden:

1. `preflight` entscheidet, welche Lanes überhaupt existieren. Die Logik `docs-scope` und `changed-scope` sind Schritte innerhalb dieses Jobs, keine eigenständigen Jobs.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` und `skills-python` schlagen schnell fehl, ohne auf die schwereren Artefakt- und Plattform-Matrix-Jobs zu warten.
3. `build-artifacts` überlappt mit den schnellen Linux-Lanes, sodass nachgelagerte Verbraucher starten können, sobald der gemeinsame Build bereit ist.
4. Danach fächern sich die schwereren Plattform- und Laufzeit-Lanes auf: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, das nur für PRs laufende `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` und `android`.

Die Scope-Logik liegt in `scripts/ci-changed-scope.mjs` und wird durch Unit-Tests in `src/scripts/ci-changed-scope.test.ts` abgedeckt.
Änderungen am CI-Workflow validieren den Node-CI-Graphen plus Workflow-Linting, erzwingen aber nicht von sich aus Windows-, Android- oder macOS-native Builds; diese Plattform-Lanes bleiben auf Änderungen an Plattformquellen beschränkt.
Windows-Node-Prüfungen sind auf Windows-spezifische Prozess-/Pfad-Wrapper, npm/pnpm/UI-Runner-Helfer, Package-Manager-Konfiguration und die CI-Workflow-Oberflächen beschränkt, die diese Lane ausführen; nicht zusammenhängende Source-, Plugin-, install-smoke- und reine Teständerungen bleiben auf den Linux-Node-Lanes, damit sie keinen Windows-Worker mit 16 vCPU für Abdeckung reservieren, die bereits durch die normalen Test-Shards ausgeübt wird.
Der separate Workflow `install-smoke` verwendet dasselbe Scope-Skript über seinen eigenen `preflight`-Job wieder. Er teilt die Smoke-Abdeckung in `run_fast_install_smoke` und `run_full_install_smoke`. Pull Requests führen den schnellen Pfad für Docker-/Package-Oberflächen, gebündelte Plugin-Package-/Manifest-Änderungen und Core-Plugin-/Channel-/Gateway-/Plugin-SDK-Oberflächen aus, die von den Docker-Smoke-Jobs abgedeckt werden. Reine Source-Änderungen an gebündelten Plugins, reine Teständerungen und reine Docs-Änderungen reservieren keine Docker-Worker. Der schnelle Pfad baut das Root-Dockerfile-Image einmal, prüft die CLI, führt das Container-Gateway-Network-E2E aus, verifiziert ein Build-Arg für eine gebündelte Erweiterung und führt das begrenzte Docker-Profil für gebündelte Plugins mit einem Befehls-Timeout von 120 Sekunden aus. Der vollständige Pfad behält Paketinstallation per QR und Installer-Docker-/Update-Abdeckung für nächtlich geplante Läufe, manuelle Dispatches, workflow-call-Release-Prüfungen und Pull Requests bei, die tatsächlich Installer-/Package-/Docker-Oberflächen betreffen. Pushes auf `main`, einschließlich Merge-Commits, erzwingen nicht den vollständigen Pfad; wenn die changed-scope-Logik bei einem Push vollständige Abdeckung anfordern würde, behält der Workflow den schnellen Docker-Smoke bei und überlässt den vollständigen Install-Smoke der nächtlichen oder Release-Validierung. Der langsame Smoke für den globalen Bun-Install mit Image-Provider wird separat durch `run_bun_global_install_smoke` gesteuert; er läuft nachts und aus dem Release-Checks-Workflow heraus, und manuelle `install-smoke`-Dispatches können ihn optional einschalten, aber Pull Requests und Pushes auf `main` führen ihn nicht aus. QR- und Installer-Docker-Tests behalten ihre eigenen installationsfokussierten Dockerfiles. Lokal baut `test:docker:all` ein gemeinsames Live-Test-Image und ein gemeinsames Built-App-Image aus `scripts/e2e/Dockerfile` vor und führt dann die Live-/E2E-Smoke-Lanes parallel mit `OPENCLAW_SKIP_DOCKER_BUILD=1` aus; stimmen Sie die Standard-Konkurrenz des Haupt-Pools von 8 mit `OPENCLAW_DOCKER_ALL_PARALLELISM` und die Konkurrenz des provider-sensitiven Tail-Pools von 8 mit `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` ab. Standardmäßig werden Lane-Starts um 2 Sekunden versetzt, um lokale Docker-Daemon-Erstellungsstürme zu vermeiden; überschreiben Sie dies mit `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` oder einem anderen Millisekundenwert. Das lokale Aggregat plant standardmäßig nach dem ersten Fehler keine neuen gepoolten Lanes mehr ein, und jede Lane hat ein Timeout von 120 Minuten, das mit `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` überschrieben werden kann. Der wiederverwendbare Live-/E2E-Workflow spiegelt das Muster gemeinsamer Images, indem er vor der Docker-Matrix ein per SHA getaggtes GHCR-Docker-E2E-Image baut und pusht und dann die Matrix mit `OPENCLAW_SKIP_DOCKER_BUILD=1` ausführt. Der geplante Live-/E2E-Workflow führt täglich die vollständige Docker-Suite des Release-Pfads aus. Die vollständige Matrix für gebündelte Updates/Channels bleibt manuell/vollständig, weil sie wiederholte echte npm-Update- und doctor-repair-Durchläufe ausführt.

Die lokale Logik für geänderte Lanes liegt in `scripts/changed-lanes.mjs` und wird von `scripts/check-changed.mjs` ausgeführt. Dieses lokale Gate ist bei Architekturgrenzen strenger als das breite CI-Plattform-Scoping: Core-Produktionsänderungen führen Core-Prod-Typecheck plus Core-Tests aus, reine Core-Teständerungen führen nur Core-Test-Typecheck/-Tests aus, Produktionsänderungen an Erweiterungen führen Extension-Prod-Typecheck plus Extension-Tests aus, und reine Extension-Teständerungen führen nur Extension-Test-Typecheck/-Tests aus. Änderungen am öffentlichen Plugin SDK oder am Plugin-Contract erweitern die Validierung auf Erweiterungen, weil Erweiterungen von diesen Core-Contracts abhängen. Versionssprünge nur in Release-Metadaten führen gezielte Prüfungen für Version/Config/Root-Abhängigkeiten aus. Unbekannte Root-/Config-Änderungen schlagen sicherheitshalber auf alle Lanes durch.

Bei Pushes fügt die `checks`-Matrix die nur für Pushes geltende Lane `compat-node22` hinzu. Bei Pull Requests wird diese Lane übersprungen, und die Matrix bleibt auf die normalen Test-/Channel-Lanes fokussiert.

Die langsamsten Node-Testfamilien werden aufgeteilt oder ausbalanciert, damit jeder Job klein bleibt, ohne Runner übermäßig zu reservieren: Channel-Contracts laufen als drei gewichtete Shards, Tests für gebündelte Plugins werden über sechs Erweiterungs-Worker ausbalanciert, kleine Core-Unit-Lanes werden gepaart, Auto-Reply läuft als drei ausbalancierte Worker statt als sechs winzige Worker, und agentische Gateway-/Plugin-Konfigurationen werden über die bestehenden source-only agentischen Node-Jobs verteilt, statt auf gebaute Artefakte zu warten. Breite Browser-, QA-, Medien- und sonstige Plugin-Tests verwenden ihre dedizierten Vitest-Konfigurationen statt des gemeinsamen Plugin-Catch-all. Jobs für Erweiterungs-Shards führen Plugin-Konfigurationsgruppen seriell mit einem Vitest-Worker und einem größeren Node-Heap aus, damit importlastige Plugin-Batches kleine CI-Runner nicht überbelegen. Die breite Agents-Lane verwendet den gemeinsamen dateiparallelen Vitest-Scheduler, weil sie von Importen/Planung dominiert wird statt von einer einzelnen langsamen Testdatei. `runtime-config` läuft mit dem Infra-Core-Runtime-Shard, damit der gemeinsame Runtime-Shard nicht das Tail besitzt. `check-additional` hält Package-Boundary-Compile-/Canary-Arbeit zusammen und trennt Runtime-Topologie-Architektur von Gateway-Watch-Abdeckung; der Boundary-Guard-Shard führt seine kleinen unabhängigen Guards innerhalb eines Jobs gleichzeitig aus. Gateway-Watch, Channel-Tests und der Core-Support-Boundary-Shard laufen innerhalb von `build-artifacts` gleichzeitig, nachdem `dist/` und `dist-runtime/` bereits gebaut wurden, wodurch ihre bisherigen Check-Namen als leichtgewichtige Verifier-Jobs erhalten bleiben, während zwei zusätzliche Blacksmith-Worker und eine zweite Artifact-Consumer-Warteschlange vermieden werden.

Android-CI führt sowohl `testPlayDebugUnitTest` als auch `testThirdPartyDebugUnitTest` aus und baut dann die Play-Debug-APK. Die Third-Party-Variante hat kein separates Source-Set und kein separates Manifest; ihre Unit-Test-Lane kompiliert diese Variante trotzdem mit den BuildConfig-Flags für SMS/Anrufprotokoll, vermeidet dabei aber bei jedem Android-relevanten Push einen doppelten Packaging-Job für Debug-APKs.
`extension-fast` ist nur für PRs, weil Push-Läufe bereits die vollständigen Shards für gebündelte Plugins ausführen. Das hält Feedback zu geänderten Plugins für Reviews verfügbar, ohne auf `main` einen zusätzlichen Blacksmith-Worker für Abdeckung zu reservieren, die bereits in `checks-node-extensions` vorhanden ist.

GitHub kann ersetzte Jobs als `cancelled` markieren, wenn ein neuerer Push auf derselben PR oder auf derselben `main`-Ref landet. Behandeln Sie das als CI-Rauschen, sofern der neueste Lauf für dieselbe Ref nicht ebenfalls fehlschlägt. Aggregierte Shard-Checks verwenden `!cancelled() && always()`, damit sie weiterhin normale Shard-Fehler melden, aber nicht erst in die Warteschlange gehen, nachdem der gesamte Workflow bereits ersetzt wurde.
Der CI-Concurrency-Key ist versioniert (`CI-v7-*`), damit ein zombieartiger GitHub-Eintrag in einer alten Warteschlangengruppe neuere Main-Läufe nicht unbegrenzt blockieren kann.

## Runner

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, schnelle Sicherheitsjobs und Aggregate (`security-scm-fast`, `security-dependency-audit`, `security-fast`), schnelle Protokoll-/Contract-/bundled-Prüfungen, geshardete Channel-Contract-Prüfungen, `check`-Shards außer Lint, `check-additional`-Shards und -Aggregate, Node-Test-Aggregat-Verifier, Docs-Prüfungen, Python-Skills, workflow-sanity, labeler, auto-response; install-smoke-preflight verwendet ebenfalls GitHub-gehostetes Ubuntu, damit die Blacksmith-Matrix früher in die Warteschlange gehen kann |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux-Node-Test-Shards, Test-Shards für gebündelte Plugins, `android`                                                                                                                                                                                                                                                                                                                                                               |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, das weiterhin CPU-sensitiv genug ist, dass 8 vCPU mehr kosteten, als sie einsparten; install-smoke-Docker-Builds, bei denen die Warteschlangenzeit für 32 vCPU mehr kostete, als sie einsparten                                                                                                                                                                                                                                                   |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` auf `openclaw/openclaw`; Forks fallen auf `macos-latest` zurück                                                                                                                                                                                                                                                                                                                                                                                         |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` auf `openclaw/openclaw`; Forks fallen auf `macos-latest` zurück                                                                                                                                                                                                                                                                                                                                                                                        |

## Lokale Äquivalente

```bash
pnpm changed:lanes   # den lokalen Klassifikator für geänderte Lanes für origin/main...HEAD prüfen
pnpm check:changed   # intelligentes lokales Gate: geänderter Typecheck/Lint/Tests nach Boundary-Lane
pnpm check          # schnelles lokales Gate: produktionsrelevantes tsgo + geshardetes Lint + parallele schnelle Guards
pnpm check:test-types
pnpm check:timed    # dasselbe Gate mit Timing pro Phase
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # Vitest-Tests
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # Docs-Formatierung + Lint + defekte Links
pnpm build          # `dist` bauen, wenn CI-Artefakt-/build-smoke-Lanes relevant sind
node scripts/ci-run-timings.mjs <run-id>      # Laufzeit, Warteschlangenzeit und langsamste Jobs zusammenfassen
node scripts/ci-run-timings.mjs --recent 10   # aktuelle erfolgreiche Main-CI-Läufe vergleichen
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## Verwandt

- [Installationsübersicht](/de/install)
- [Release-Kanäle](/de/install/development-channels)
