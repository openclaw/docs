---
read_when:
    - Sie müssen verstehen, warum ein CI-Job ausgeführt wurde oder nicht.
    - Sie debuggen fehlgeschlagene GitHub-Actions-Prüfungen.
summary: CI-Job-Graph, Scope-Gates und lokale Befehlsäquivalente
title: CI-Pipeline
x-i18n:
    generated_at: "2026-04-25T18:17:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 841b8036e59b5b03620b301918549670870842cc42681321a9b8f9d01792d950
    source_path: ci.md
    workflow: 15
---

Die CI läuft bei jedem Push nach `main` und bei jedem Pull Request. Sie verwendet intelligentes Scoping, um teure Jobs zu überspringen, wenn sich nur nicht zusammenhängende Bereiche geändert haben.

QA Lab hat eigene CI-Lanes außerhalb des Haupt-Workflows mit intelligentem Scoping. Der
Workflow `Parity gate` läuft bei passenden PR-Änderungen und bei manueller Auslösung; er
baut die private QA-Laufzeit und vergleicht die agentischen Packs mit Mock GPT-5.5 und Opus 4.6.
Der Workflow `QA-Lab - All Lanes` läuft nachts auf `main` und bei
manueller Auslösung; er fächert das Mock-Parity-Gate, die Live-Matrix-Lane und die Live-
Telegram-Lane als parallele Jobs auf. Die Live-Jobs verwenden die Umgebung `qa-live-shared`,
und die Telegram-Lane verwendet Convex-Leases. `OpenClaw Release
Checks` führt vor der Freigabegenehmigung ebenfalls dieselben QA-Lab-Lanes aus.

Der Workflow `Duplicate PRs After Merge` ist ein manueller Maintainer-Workflow für
das Bereinigen doppelter PRs nach dem Landen. Standardmäßig wird ein Dry-Run ausgeführt, und nur explizit
aufgelistete PRs werden geschlossen, wenn `apply=true`. Bevor GitHub verändert wird,
prüft er, dass der gelandete PR zusammengeführt wurde und dass jeder doppelte PR entweder ein gemeinsam referenziertes Issue
oder überlappende geänderte Hunks hat.

Der Workflow `Docs Agent` ist eine ereignisgesteuerte Codex-Wartungs-Lane, um
bestehende Dokumentation an kürzlich gelandete Änderungen anzupassen. Es gibt keinen reinen Zeitplan:
Ein erfolgreicher CI-Lauf bei einem Nicht-Bot-Push auf `main` kann ihn auslösen,
und eine manuelle Auslösung kann ihn direkt starten. Aufrufe über Workflow-Runs werden übersprungen, wenn
`main` inzwischen weitergegangen ist oder wenn in der letzten Stunde bereits ein anderer nicht übersprungener Docs-Agent-Lauf erstellt wurde. Wenn er läuft,
prüft er den Commit-Bereich vom vorherigen nicht übersprungenen Docs-Agent-Quell-SHA bis zum
aktuellen `main`, sodass ein stündlicher Lauf alle auf `main` seit dem letzten Docs-Durchlauf
angesammelten Änderungen abdecken kann.

Der Workflow `Test Performance Agent` ist eine ereignisgesteuerte Codex-Wartungs-Lane
für langsame Tests. Es gibt keinen reinen Zeitplan: Ein erfolgreicher CI-Lauf bei einem Nicht-Bot-Push auf
`main` kann ihn auslösen, aber er wird übersprungen, wenn an diesem UTC-Tag bereits ein anderer Aufruf über Workflow-Runs
gelaufen ist oder gerade läuft. Eine manuelle Auslösung umgeht diese tägliche Aktivitätssperre.
Die Lane erstellt einen gruppierten Vitest-Performance-Report für die vollständige Suite, lässt Codex
nur kleine, die Abdeckung erhaltende Test-Performance-Korrekturen statt umfassender Refactorings vornehmen,
führt dann den Report für die vollständige Suite erneut aus und lehnt Änderungen ab, die
die Anzahl der bestandenen Baseline-Tests verringern. Wenn die Baseline fehlschlagende Tests hat, darf Codex
nur offensichtliche Fehler beheben, und der Report der vollständigen Suite nach dem Agenten muss erfolgreich sein, bevor
irgendetwas committet wird. Wenn `main` weitergeht, bevor der Bot-Push landet,
rebased die Lane den validierten Patch, führt `pnpm check:changed` erneut aus und versucht den Push erneut;
konfliktbehaftete veraltete Patches werden übersprungen. Sie verwendet GitHub-gehostetes Ubuntu, damit die Codex-
Aktion dieselbe Drop-Sudo-Sicherheitsstrategie wie der Docs Agent beibehalten kann.

```bash
gh workflow run duplicate-after-merge.yml \
  -f landed_pr=70532 \
  -f duplicate_prs='70530,70592' \
  -f apply=true
```

## Job-Übersicht

| Job                              | Zweck                                                                                        | Wann er läuft                        |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`                      | Erkennt reine Docs-Änderungen, geänderte Scopes, geänderte Erweiterungen und erstellt das CI-Manifest | Immer bei Nicht-Entwurfs-Pushes und PRs |
| `security-scm-fast`              | Erkennung privater Schlüssel und Workflow-Audit über `zizmor`                                | Immer bei Nicht-Entwurfs-Pushes und PRs |
| `security-dependency-audit`      | Audit der produktionsrelevanten Lockfile ohne Abhängigkeiten gegen npm-Sicherheitsmeldungen  | Immer bei Nicht-Entwurfs-Pushes und PRs |
| `security-fast`                  | Erforderliche Aggregation für die schnellen Sicherheitsjobs                                  | Immer bei Nicht-Entwurfs-Pushes und PRs |
| `build-artifacts`                | Baut `dist/`, Control UI, Built-Artifact-Prüfungen und wiederverwendbare nachgelagerte Artefakte | Node-relevante Änderungen            |
| `checks-fast-core`               | Schnelle Linux-Korrektheits-Lanes wie Prüfungen für Bundles/Plugin-Verträge/Protokolle       | Node-relevante Änderungen            |
| `checks-fast-contracts-channels` | Gesplittete Channel-Vertragsprüfungen mit einem stabilen aggregierten Prüfergebnis           | Node-relevante Änderungen            |
| `checks-node-extensions`         | Vollständige Test-Shards für gebündelte Plugins über die gesamte Erweiterungssuite           | Node-relevante Änderungen            |
| `checks-node-core-test`          | Core-Node-Test-Shards, ohne Channel-, Bundle-, Vertrags- und Erweiterungs-Lanes              | Node-relevante Änderungen            |
| `extension-fast`                 | Fokussierte Tests nur für die geänderten gebündelten Plugins                                 | Pull Requests mit Erweiterungsänderungen |
| `check`                          | Gesplittetes Äquivalent zum lokalen Haupt-Gate: Produktiv-Typen, Lint, Guards, Testtypen und strikter Smoke | Node-relevante Änderungen            |
| `check-additional`               | Shards für Architektur-, Boundary-, Erweiterungsoberflächen-, Paketgrenzen- und Gateway-Watch-Guards | Node-relevante Änderungen            |
| `build-smoke`                    | Smoke-Tests für die gebaute CLI und Startup-Memory-Smoke                                     | Node-relevante Änderungen            |
| `checks`                         | Verifizierer für Built-Artifact-Channel-Tests plus Node-22-Kompatibilität nur für Pushes     | Node-relevante Änderungen            |
| `check-docs`                     | Docs-Formatierung, Lint und Broken-Link-Prüfungen                                            | Docs geändert                        |
| `skills-python`                  | Ruff + pytest für Python-basierte Skills                                                     | Python-Skills-relevante Änderungen   |
| `checks-windows`                 | Windows-spezifische Test-Lanes                                                               | Windows-relevante Änderungen         |
| `macos-node`                     | macOS-TypeScript-Test-Lane mit den gemeinsamen gebauten Artefakten                           | macOS-relevante Änderungen           |
| `macos-swift`                    | Swift-Lint, -Build und -Tests für die macOS-App                                              | macOS-relevante Änderungen           |
| `android`                        | Android-Unit-Tests für beide Varianten plus ein Debug-APK-Build                              | Android-relevante Änderungen         |
| `test-performance-agent`         | Tägliche Codex-Optimierung langsamer Tests nach vertrauenswürdiger Aktivität                 | Erfolg der Main-CI oder manuelle Auslösung |

## Fail-Fast-Reihenfolge

Jobs sind so angeordnet, dass günstige Prüfungen fehlschlagen, bevor teure ausgeführt werden:

1. `preflight` entscheidet, welche Lanes überhaupt existieren. Die Logik `docs-scope` und `changed-scope` sind Schritte innerhalb dieses Jobs, keine eigenständigen Jobs.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` und `skills-python` schlagen schnell fehl, ohne auf die schwereren Artefakt- und Plattform-Matrix-Jobs zu warten.
3. `build-artifacts` überlappt mit den schnellen Linux-Lanes, damit nachgelagerte Verbraucher starten können, sobald der gemeinsame Build bereit ist.
4. Danach fächern sich schwerere Plattform- und Laufzeit-Lanes auf: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, das nur für PRs laufende `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` und `android`.

Die Scope-Logik lebt in `scripts/ci-changed-scope.mjs` und wird durch Unit-Tests in `src/scripts/ci-changed-scope.test.ts` abgedeckt.
Änderungen am CI-Workflow validieren den Node-CI-Graphen plus Workflow-Linting, erzwingen aber nicht allein dadurch native Windows-, Android- oder macOS-Builds; diese Plattform-Lanes bleiben auf Änderungen im jeweiligen Plattform-Quellcode beschränkt.
Reine CI-Routing-Änderungen, ausgewählte günstige Core-Test-Fixture-Änderungen und schmale Plugin-Contract-Helper-/Test-Routing-Änderungen verwenden einen schnellen, nur auf Node basierenden Manifest-Pfad: Preflight, Security und eine einzelne `checks-fast-core`-Aufgabe. Dieser Pfad vermeidet Build-Artefakte, Node-22-Kompatibilität, Channel-Verträge, vollständige Core-Shards, Shards für gebündelte Plugins und zusätzliche Guard-Matrizen, wenn die geänderten Dateien auf die Routing- oder Helper-Oberflächen beschränkt sind, die die schnelle Aufgabe direkt ausführt.
Windows-Node-Prüfungen sind auf Windows-spezifische Prozess-/Pfad-Wrapper, npm/pnpm/UI-Runner-Helper, Paketmanager-Konfiguration und die CI-Workflow-Oberflächen beschränkt, die diese Lane ausführen; nicht zusammenhängende Quellcode-, Plugin-, Install-Smoke- und reine Teständerungen bleiben auf den Linux-Node-Lanes, damit sie keinen Windows-Worker mit 16 vCPU für eine Abdeckung reservieren, die bereits durch die normalen Test-Shards ausgeübt wird.
Der separate Workflow `install-smoke` verwendet dasselbe Scope-Skript erneut über seinen eigenen Job `preflight`. Er teilt die Smoke-Abdeckung in `run_fast_install_smoke` und `run_full_install_smoke` auf. Pull Requests führen den schnellen Pfad für Docker-/Paketoberflächen, Änderungen an Paketen/Manifests gebündelter Plugins und Core-Oberflächen von Plugin/Channel/Gateway/Plugin SDK aus, die von den Docker-Smoke-Jobs ausgeübt werden. Reine Quellcodeänderungen an gebündelten Plugins, reine Teständerungen und reine Docs-Änderungen reservieren keine Docker-Worker. Der schnelle Pfad baut das Root-Dockerfile-Image einmal, prüft die CLI, führt den CLI-Smoke `agents delete shared-workspace` aus, führt das Container-Gateway-Network-E2E aus, verifiziert ein Build-Arg für eine gebündelte Erweiterung und führt das begrenzte Docker-Profil für gebündelte Plugins unter einem aggregierten Befehls-Timeout von 240 Sekunden aus, wobei jeder `docker run` pro Szenario separat begrenzt wird. Der vollständige Pfad behält die Abdeckung für QR-Paketinstallation und Installer-Docker/Update für nächtliche geplante Läufe, manuelle Auslösungen, Workflow-Call-Release-Prüfungen und Pull Requests bei, die tatsächlich Installer-/Paket-/Docker-Oberflächen betreffen. Pushes auf `main`, einschließlich Merge-Commits, erzwingen nicht den vollständigen Pfad; wenn die `changed-scope`-Logik bei einem Push eine vollständige Abdeckung anfordern würde, behält der Workflow den schnellen Docker-Smoke bei und überlässt den vollständigen Install-Smoke der nächtlichen oder Release-Validierung. Der langsame Smoke für globales Bun-Installieren mit Image-Provider wird separat durch `run_bun_global_install_smoke` gesteuert; er läuft im nächtlichen Zeitplan und aus dem Workflow für Release-Prüfungen, und manuelle `install-smoke`-Auslösungen können ihn aktivieren, aber Pull Requests und Pushes auf `main` führen ihn nicht aus. QR- und Installer-Docker-Tests behalten ihre eigenen install-fokussierten Dockerfiles. Lokal baut `test:docker:all` ein gemeinsames Live-Test-Image und ein gemeinsames Built-App-Image aus `scripts/e2e/Dockerfile` vor und führt dann die Smoke-Lanes für Live/E2E mit einem gewichteten Scheduler und `OPENCLAW_SKIP_DOCKER_BUILD=1` aus; passe die Standard-Slot-Anzahl des Main-Pools von 10 mit `OPENCLAW_DOCKER_ALL_PARALLELISM` und die Standard-Slot-Anzahl des provider-sensitiven Tail-Pools von 10 mit `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM` an. Obergrenzen für schwere Lanes sind standardmäßig `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=8` und `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`, damit npm-Install- und Multi-Service-Lanes Docker nicht überbuchen, während leichtere Lanes weiterhin verfügbare Slots füllen. Lane-Starts werden standardmäßig um 2 Sekunden gestaffelt, um lokale Erstellungsstürme auf dem Docker-Daemon zu vermeiden; überschreibe dies mit `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=0` oder einem anderen Millisekundenwert. Das lokale Aggregat führt Preflight-Prüfungen für Docker aus, entfernt veraltete OpenClaw-E2E-Container, gibt den Status aktiver Lanes aus, speichert Lane-Zeiten für eine Reihenfolge nach längster Dauer zuerst und unterstützt `OPENCLAW_DOCKER_ALL_DRY_RUN=1` zur Inspektion des Schedulers. Standardmäßig plant es nach dem ersten Fehler keine neuen gepoolten Lanes mehr ein, und jede Lane hat ein Fallback-Timeout von 120 Minuten, das mit `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` überschrieben werden kann; ausgewählte Live-/Tail-Lanes verwenden engere Obergrenzen pro Lane. Der wiederverwendbare Workflow für Live/E2E spiegelt das gemeinsame Image-Muster wider, indem er vor der Docker-Matrix ein SHA-getaggtes GHCR-Docker-E2E-Image baut und pusht und dann die Matrix mit `OPENCLAW_SKIP_DOCKER_BUILD=1` ausführt. Der geplante Workflow für Live/E2E führt täglich die vollständige Docker-Suite des Release-Pfads aus. Die Matrix für gebündelte Updates wird nach Update-Ziel aufgeteilt, damit wiederholte npm-Updates und Doctor-Repair-Durchläufe zusammen mit anderen gebündelten Prüfungen aufgeteilt werden können.

Die lokale Logik für geänderte Lanes lebt in `scripts/changed-lanes.mjs` und wird von `scripts/check-changed.mjs` ausgeführt. Dieses lokale Gate ist bei Architekturgrenzen strenger als das breite CI-Plattform-Scoping: Änderungen an der Core-Production führen Core-Prod-Typecheck plus Core-Tests aus, reine Core-Test-Änderungen führen nur Typecheck/Tests für Core-Tests aus, Änderungen an der Extension-Production führen Extension-Prod-Typecheck plus Extension-Tests aus, und reine Extension-Test-Änderungen führen nur Typecheck/Tests für Extension-Tests aus. Änderungen am öffentlichen Plugin SDK oder an Plugin-Verträgen erweitern die Validierung auf Extensions, weil Extensions von diesen Core-Verträgen abhängen. Reine Versionsanhebungen in Release-Metadaten führen gezielte Prüfungen für Version/Konfiguration/Root-Abhängigkeiten aus. Unbekannte Root-/Konfigurationsänderungen schalten fehlersicher auf alle Lanes.

Bei Pushes fügt die Matrix `checks` die nur für Pushes laufende Lane `compat-node22` hinzu. Bei Pull Requests wird diese Lane übersprungen und die Matrix bleibt auf die normalen Test-/Channel-Lanes fokussiert.

Die langsamsten Node-Testfamilien werden aufgeteilt oder ausbalanciert, damit jeder Job klein bleibt, ohne Runner übermäßig zu reservieren: Channel-Verträge laufen als drei gewichtete Shards, Tests für gebündelte Plugins werden über sechs Extension-Worker verteilt, kleine Core-Unit-Lanes werden gepaart, Auto-Reply läuft als drei ausgewogene Worker statt sechs winziger Worker, und agentische Gateway-/Plugin-Konfigurationen werden auf die vorhandenen source-only agentischen Node-Jobs verteilt, statt auf gebaute Artefakte zu warten. Breite Browser-, QA-, Medien- und sonstige Plugin-Tests verwenden ihre dedizierten Vitest-Konfigurationen statt des gemeinsamen Plugin-Catch-All. Extension-Shard-Jobs führen bis zu zwei Plugin-Konfigurationsgruppen gleichzeitig aus, mit einem Vitest-Worker pro Gruppe und einem größeren Node-Heap, damit importlastige Plugin-Batches keine zusätzlichen CI-Jobs erzeugen. Die breite Agents-Lane verwendet den gemeinsamen file-parallel-Scheduler von Vitest, weil sie durch Imports/Planung dominiert ist und nicht durch eine einzelne langsame Testdatei. `runtime-config` läuft mit dem Shard für Infra-Core-Runtime, damit nicht der gemeinsame Runtime-Shard das Tail besitzt. `check-additional` hält Package-Boundary-Compile-/Canary-Arbeit zusammen und trennt Runtime-Topologie-Architektur von Gateway-Watch-Abdeckung; der Boundary-Guard-Shard führt seine kleinen unabhängigen Guards gleichzeitig innerhalb eines Jobs aus. Gateway-Watch, Channel-Tests und der Core-Support-Boundary-Shard laufen innerhalb von `build-artifacts` gleichzeitig, nachdem `dist/` und `dist-runtime/` bereits gebaut wurden, behalten ihre alten Prüfnamen als leichtgewichtige Verifizierer-Jobs und vermeiden gleichzeitig zwei zusätzliche Blacksmith-Worker und eine zweite Artifact-Consumer-Queue.
Android-CI führt sowohl `testPlayDebugUnitTest` als auch `testThirdPartyDebugUnitTest` aus und baut dann das Play-Debug-APK. Die Third-Party-Variante hat kein separates Source-Set oder Manifest; ihre Unit-Test-Lane kompiliert diese Variante dennoch mit den BuildConfig-Flags für SMS/Anrufprotokoll, vermeidet aber einen doppelten Packaging-Job für Debug-APKs bei jedem Android-relevanten Push.
`extension-fast` ist nur für PRs, weil Push-Läufe bereits die vollständigen Shards für gebündelte Plugins ausführen. Das hält Feedback zu geänderten Plugins für Reviews bereit, ohne auf `main` einen zusätzlichen Blacksmith-Worker für Abdeckung zu reservieren, die in `checks-node-extensions` bereits vorhanden ist.

GitHub kann ersetzte Jobs als `cancelled` markieren, wenn ein neuerer Push auf derselben PR- oder `main`-Ref landet. Behandeln Sie das als CI-Rauschen, sofern der neueste Lauf für dieselbe Ref nicht ebenfalls fehlschlägt. Aggregierte Shard-Prüfungen verwenden `!cancelled() && always()`, sodass sie weiterhin normale Shard-Fehler melden, aber nicht in die Queue gestellt werden, nachdem der gesamte Workflow bereits ersetzt wurde.
Der CI-Concurrency-Key ist versioniert (`CI-v7-*`), damit ein Zombie auf GitHub-Seite in einer alten Queue-Gruppe neuere Main-Läufe nicht unbegrenzt blockieren kann.

## Runner

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, schnelle Sicherheitsjobs und Aggregate (`security-scm-fast`, `security-dependency-audit`, `security-fast`), schnelle Protokoll-/Vertrags-/Bundle-Prüfungen, gesplittete Channel-Vertragsprüfungen, `check`-Shards außer Lint, `check-additional`-Shards und -Aggregate, Aggregate-Verifizierer für Node-Tests, Docs-Prüfungen, Python-Skills, Workflow-Sanity, Labeler, Auto-Response; der Preflight von `install-smoke` verwendet ebenfalls GitHub-gehostetes Ubuntu, damit die Blacksmith-Matrix früher in die Queue gehen kann |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, Build-Smoke, Linux-Node-Test-Shards, Test-Shards für gebündelte Plugins, `android`                                                                                                                                                                                                                                                                                                                                                                  |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, das CPU-sensitiv genug bleibt, sodass 8 vCPU mehr kosteten, als sie einsparten; Docker-Builds für `install-smoke`, bei denen die Queue-Zeit von 32 vCPU mehr kostete, als sie einsparten                                                                                                                                                                                                                                                             |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` auf `openclaw/openclaw`; Forks fallen auf `macos-latest` zurück                                                                                                                                                                                                                                                                                                                                                                                           |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` auf `openclaw/openclaw`; Forks fallen auf `macos-latest` zurück                                                                                                                                                                                                                                                                                                                                                                                          |

## Lokale Äquivalente

```bash
pnpm changed:lanes   # lokalen Changed-Lane-Klassifizierer für origin/main...HEAD prüfen
pnpm check:changed   # intelligentes lokales Gate: geänderter Typecheck/Lint/Tests nach Boundary-Lane
pnpm check          # schnelles lokales Gate: Production-`tsgo` + gesplittetes Lint + parallele schnelle Guards
pnpm check:test-types
pnpm check:timed    # gleiches Gate mit Timing pro Phase
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # Vitest-Tests
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # Docs-Formatierung + Lint + fehlerhafte Links
pnpm build          # `dist` bauen, wenn CI-Artefakt-/Build-Smoke-Lanes relevant sind
node scripts/ci-run-timings.mjs <run-id>      # Wandzeit, Queue-Zeit und die langsamsten Jobs zusammenfassen
node scripts/ci-run-timings.mjs --recent 10   # aktuelle erfolgreiche Main-CI-Läufe vergleichen
pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json
pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json
```

## Verwandt

- [Installationsübersicht](/de/install)
- [Release-Kanäle](/de/install/development-channels)
