---
read_when:
    - Sie müssen verstehen, warum ein CI-Job ausgeführt wurde oder nicht.
    - Sie debuggen fehlschlagende GitHub-Actions-Checks.
summary: CI-Job-Graph, Scope-Gates und lokale Befehlsäquivalente
title: CI-Pipeline
x-i18n:
    generated_at: "2026-04-23T06:25:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5c89c66204b203a39435cfc19de7b437867f2792bbfa2c3948371abde9f80e11
    source_path: ci.md
    workflow: 15
---

# CI-Pipeline

Die CI läuft bei jedem Push auf `main` und bei jeder Pull Request. Sie verwendet intelligentes Scoping, um teure Jobs zu überspringen, wenn nur nicht zusammenhängende Bereiche geändert wurden.

QA Lab hat eigene CI-Lanes außerhalb des main intelligent gescopten Workflows. Der Workflow
`Parity gate` läuft bei passenden PR-Änderungen und per manuellem Dispatch; er
baut die private QA-Laufzeitumgebung und vergleicht die agentischen Packs von mock GPT-5.4 und Opus 4.6.
Der Workflow `QA-Lab - All Lanes` läuft nachts auf `main` und per
manuellem Dispatch; er fächert das mock parity gate, die Live-Matrix-Lane und die Live-
Telegram-Lane als parallele Jobs auf. Die Live-Jobs verwenden die Umgebung `qa-live-shared`,
und die Telegram-Lane verwendet Convex-Leases. `OpenClaw Release
Checks` führt vor der Freigabe einer Release ebenfalls dieselben QA-Lab-Lanes aus.

## Job-Übersicht

| Job                              | Zweck                                                                                        | Wann er läuft                       |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | Nur-Dokumentations-Änderungen, geänderte Scopes, geänderte Erweiterungen erkennen und das CI-Manifest erstellen | Immer bei Nicht-Entwurf-Pushes und PRs |
| `security-scm-fast`              | Erkennung privater Schlüssel und Workflow-Audit über `zizmor`                               | Immer bei Nicht-Entwurf-Pushes und PRs |
| `security-dependency-audit`      | Produktions-Lockfile-Audit ohne Abhängigkeiten gegen npm-Advisories                         | Immer bei Nicht-Entwurf-Pushes und PRs |
| `security-fast`                  | Erforderliche Aggregation für die schnellen Security-Jobs                                   | Immer bei Nicht-Entwurf-Pushes und PRs |
| `build-artifacts`                | `dist/`, Control UI, Built-Artifact-Checks und wiederverwendbare nachgelagerte Artefakte bauen | Bei Node-relevanten Änderungen      |
| `checks-fast-core`               | Schnelle Linux-Korrektheits-Lanes wie Bundled-/Plugin-Contract-/Protokoll-Checks           | Bei Node-relevanten Änderungen      |
| `checks-fast-contracts-channels` | Geshardete Channel-Contract-Checks mit einem stabilen aggregierten Check-Ergebnis           | Bei Node-relevanten Änderungen      |
| `checks-node-extensions`         | Vollständige Test-Shards für gebündelte Plugins über die Erweiterungssuite hinweg           | Bei Node-relevanten Änderungen      |
| `checks-node-core-test`          | Core-Node-Test-Shards, ohne Channel-, Bundled-, Contract- und Erweiterungs-Lanes            | Bei Node-relevanten Änderungen      |
| `extension-fast`                 | Fokussierte Tests nur für die geänderten gebündelten Plugins                                | Pull Requests mit Erweiterungsänderungen |
| `check`                          | Geshardetes Äquivalent des main lokalen Gates: Prod-Typen, Lint, Guards, Test-Typen und strikter Smoke | Bei Node-relevanten Änderungen      |
| `check-additional`               | Architektur-, Boundary-, Extension-Surface-Guards, Package-Boundary- und Gateway-Watch-Shards | Bei Node-relevanten Änderungen      |
| `build-smoke`                    | Smoke-Tests für die gebaute CLI und Smoke für den Startspeicher                             | Bei Node-relevanten Änderungen      |
| `checks`                         | Verifier für Built-Artifact-Channel-Tests plus nur bei Pushes Node-22-Kompatibilität        | Bei Node-relevanten Änderungen      |
| `check-docs`                     | Dokumentationsformatierung, Lint und Broken-Link-Checks                                     | Wenn Docs geändert wurden           |
| `skills-python`                  | Ruff + pytest für Python-basierte Skills                                                    | Bei Python-Skills-relevanten Änderungen |
| `checks-windows`                 | Windows-spezifische Test-Lanes                                                              | Bei Windows-relevanten Änderungen   |
| `macos-node`                     | macOS-TypeScript-Test-Lane mit den gemeinsam genutzten gebauten Artefakten                  | Bei macOS-relevanten Änderungen     |
| `macos-swift`                    | Swift-Lint, Build und Tests für die macOS-App                                               | Bei macOS-relevanten Änderungen     |
| `android`                        | Android-Unit-Tests für beide Varianten plus ein Play-Debug-APK-Build                        | Bei Android-relevanten Änderungen   |

## Fail-Fast-Reihenfolge

Die Jobs sind so angeordnet, dass günstige Checks fehlschlagen, bevor teure ausgeführt werden:

1. `preflight` entscheidet, welche Lanes überhaupt existieren. Die Logik `docs-scope` und `changed-scope` sind Schritte innerhalb dieses Jobs, keine eigenständigen Jobs.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` und `skills-python` schlagen schnell fehl, ohne auf die schwereren Artefakt- und Plattform-Matrix-Jobs zu warten.
3. `build-artifacts` überlappt sich mit den schnellen Linux-Lanes, damit nachgelagerte Verbraucher starten können, sobald der gemeinsame Build bereit ist.
4. Danach fächern sich die schwereren Plattform- und Laufzeit-Lanes auf: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, das nur für PRs laufende `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` und `android`.

Die Scope-Logik liegt in `scripts/ci-changed-scope.mjs` und wird durch Unit-Tests in `src/scripts/ci-changed-scope.test.ts` abgedeckt.
Änderungen an CI-Workflows validieren den Node-CI-Graphen plus Workflow-Linting, erzwingen aber für sich genommen keine nativen Builds für Windows, Android oder macOS; diese Plattform-Lanes bleiben auf Änderungen an Plattformquellen beschränkt.
Windows-Node-Checks sind auf Windows-spezifische Prozess-/Pfad-Wrapper, npm-/pnpm-/UI-Runner-Helfer, Package-Manager-Konfiguration und die CI-Workflow-Oberflächen beschränkt, die diese Lane ausführen; nicht zusammenhängende Änderungen an Quellcode, Plugins, install-smoke und reine Teständerungen bleiben auf den Linux-Node-Lanes, damit sie keinen Windows-Worker mit 16 vCPUs für Abdeckung reservieren, die bereits durch die normalen Test-Shards ausgeübt wird.
Der separate Workflow `install-smoke` verwendet dasselbe Scope-Skript über seinen eigenen `preflight`-Job wieder. Er berechnet `run_install_smoke` aus dem engeren Signal changed-smoke, sodass Docker-/Install-Smoke für Installations-, Packaging-, containerrelevante Änderungen, Produktionsänderungen an gebündelten Erweiterungen und an den Core-Flächen von Plugin/Channel/Gateway/Plugin SDK läuft, die die Docker-Smoke-Jobs ausüben. Reine Test- und reine Docs-Änderungen reservieren keine Docker-Worker. Sein QR-Package-Smoke erzwingt, dass die Docker-Schicht `pnpm install` erneut läuft, während der BuildKit-pnpm-Store-Cache erhalten bleibt, sodass die Installation weiterhin getestet wird, ohne bei jedem Lauf Abhängigkeiten erneut herunterzuladen. Sein Gateway-Network-E2E verwendet das früher im Job gebaute Laufzeit-Image wieder, sodass echte container-zu-container-WebSocket-Abdeckung hinzukommt, ohne einen weiteren Docker-Build hinzuzufügen. Lokal baut `test:docker:all` ein gemeinsames Built-App-Image aus `scripts/e2e/Dockerfile` vor und verwendet es für die E2E-Container-Smoke-Runner wieder; der wiederverwendbare Live-/E2E-Workflow spiegelt dieses Muster, indem er vor der Docker-Matrix ein SHA-getaggtes GHCR-Docker-E2E-Image baut und pusht und dann die Matrix mit `OPENCLAW_SKIP_DOCKER_BUILD=1` ausführt. QR- und Installer-Docker-Tests behalten ihre eigenen installationsfokussierten Dockerfiles. Ein separater Job `docker-e2e-fast` führt das begrenzte gebündelte Plugin-Docker-Profil unter einem Befehls-Timeout von 120 Sekunden aus: Setup-Entry-Reparatur von Abhängigkeiten plus synthetische Isolation bei Ausfällen des Bundled-Loaders. Die vollständige Bundled-Update-/Channel-Matrix bleibt manuell/vollständige Suite, weil sie wiederholte echte npm-update- und doctor-repair-Durchläufe ausführt.

Die Logik für lokale Changed-Lanes liegt in `scripts/changed-lanes.mjs` und wird von `scripts/check-changed.mjs` ausgeführt. Dieses lokale Gate ist bei Architekturgrenzen strenger als das breite CI-Plattform-Scoping: Änderungen an der Core-Produktion führen Prod-Typecheck plus Core-Tests aus, reine Core-Teständerungen führen nur Test-Typecheck/-Tests aus, Änderungen an der Erweiterungsproduktion führen Extension-Prod-Typecheck plus Extension-Tests aus, und reine Erweiterungsteständerungen führen nur Erweiterungstest-Typecheck/-Tests aus. Öffentliche Änderungen an Plugin SDK oder Plugin-Contract erweitern auf Erweiterungsvalidierung, weil Erweiterungen von diesen Core-Verträgen abhängen. Versions-Bumps nur in Release-Metadaten führen gezielte Checks für Version/Config/Root-Abhängigkeiten aus. Unbekannte Änderungen an Root/Config schlagen aus Sicherheitsgründen auf alle Lanes durch.

Bei Pushes fügt die Matrix `checks` die nur bei Pushes laufende Lane `compat-node22` hinzu. Bei Pull Requests wird diese Lane übersprungen und die Matrix bleibt auf die normalen Test-/Channel-Lanes fokussiert.

Die langsamsten Node-Testfamilien sind aufgeteilt oder ausbalanciert, damit jeder Job klein bleibt: Channel-Contracts teilen Registry- und Core-Abdeckung in insgesamt sechs gewichtete Shards auf, Tests für gebündelte Plugins balancieren über sechs Erweiterungs-Worker, Auto-Reply läuft als drei ausbalancierte Worker statt sechs winziger Worker, und agentische Gateway-/Plugin-Konfigurationen werden über die bestehenden source-only agentic Node-Jobs verteilt, statt auf gebaute Artefakte zu warten. Breite Browser-, QA-, Medien- und sonstige Plugin-Tests verwenden ihre dedizierten Vitest-Konfigurationen statt des gemeinsamen Plugin-Catch-all. Die breite Agents-Lane verwendet den gemeinsamen dateiparallelen Vitest-Scheduler, weil sie von Imports/Planung dominiert wird und nicht von einer einzelnen langsamen Testdatei. `runtime-config` läuft mit dem Infra-Core-Runtime-Shard, damit der gemeinsame Runtime-Shard nicht den Nachzügler bildet. `check-additional` hält Package-Boundary-Compile-/Canary-Arbeit zusammen und trennt Architektur der Runtime-Topologie von Gateway-Watch-Abdeckung; der Boundary-Guard-Shard führt seine kleinen unabhängigen Guards innerhalb eines Jobs parallel aus. Gateway-Watch, Channel-Tests und der Core-Support-Boundary-Shard laufen innerhalb von `build-artifacts` parallel, nachdem `dist/` und `dist-runtime/` bereits gebaut wurden. Dabei behalten sie ihre alten Check-Namen als leichtgewichtige Verifier-Jobs, während zwei zusätzliche Blacksmith-Worker und eine zweite Artifact-Consumer-Warteschlange vermieden werden.
Android-CI führt sowohl `testPlayDebugUnitTest` als auch `testThirdPartyDebugUnitTest` aus und baut dann das Play-Debug-APK. Die Third-Party-Variante hat kein separates Source-Set und kein eigenes Manifest; ihre Unit-Test-Lane kompiliert diese Variante trotzdem mit den SMS-/Call-Log-BuildConfig-Flags und vermeidet dabei einen doppelten Packaging-Job für ein Debug-APK bei jedem Android-relevanten Push.
`extension-fast` läuft nur für PRs, weil Push-Läufe bereits die vollständigen Test-Shards für gebündelte Plugins ausführen. Das hält das Feedback für geänderte Plugins in Reviews aufrecht, ohne auf `main` einen zusätzlichen Blacksmith-Worker für Abdeckung zu reservieren, die bereits in `checks-node-extensions` vorhanden ist.

GitHub kann ersetzte Jobs als `cancelled` markieren, wenn ein neuerer Push auf derselben PR oder derselben `main`-Referenz landet. Behandeln Sie das als CI-Rauschen, außer wenn auch der neueste Lauf für dieselbe Referenz fehlschlägt. Aggregierte Shard-Checks verwenden `!cancelled() && always()`, sodass sie weiterhin normale Shard-Fehlschläge melden, aber nicht in die Queue kommen, nachdem der gesamte Workflow bereits ersetzt wurde.
Der CI-Concurrency-Key ist versioniert (`CI-v7-*`), damit ein GitHub-seitiger Zombie in einer alten Queue-Gruppe neuere main-Läufe nicht unbegrenzt blockieren kann.

## Runner

| Runner                           | Jobs                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`, schnelle Security-Jobs und -Aggregationen (`security-scm-fast`, `security-dependency-audit`, `security-fast`), schnelle Protokoll-/Contract-/Bundled-Checks, geshardete Channel-Contract-Checks, `check`-Shards außer Lint, `check-additional`-Shards und -Aggregationen, Aggregat-Verifier für Node-Tests, Docs-Checks, Python-Skills, Workflow-Sanity, Labeler, automatische Antwort; Preflight für install-smoke verwendet ebenfalls GitHub-gehostetes Ubuntu, damit die Blacksmith-Matrix früher in die Queue gehen kann |
| `blacksmith-8vcpu-ubuntu-2404`   | `build-artifacts`, build-smoke, Linux-Node-Test-Shards, Test-Shards für gebündelte Plugins, `android`                                                                                                                                                                                                                                                                                                                                                                       |
| `blacksmith-16vcpu-ubuntu-2404`  | `check-lint`, das weiterhin CPU-sensibel genug ist, dass 8 vCPUs mehr kosteten, als sie einsparten; install-smoke-Docker-Builds, bei denen die Queue-Zeit von 32 vCPUs mehr kostete, als sie einsparten                                                                                                                                                                                                                                                                 |
| `blacksmith-16vcpu-windows-2025` | `checks-windows`                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `blacksmith-6vcpu-macos-latest`  | `macos-node` auf `openclaw/openclaw`; Forks fallen auf `macos-latest` zurück                                                                                                                                                                                                                                                                                                                                                                                               |
| `blacksmith-12vcpu-macos-latest` | `macos-swift` auf `openclaw/openclaw`; Forks fallen auf `macos-latest` zurück                                                                                                                                                                                                                                                                                                                                                                                              |

## Lokale Äquivalente

```bash
pnpm changed:lanes   # den lokalen Changed-Lane-Klassifizierer für origin/main...HEAD prüfen
pnpm check:changed   # intelligentes lokales Gate: geänderter Typecheck/Lint/Tests nach Boundary-Lane
pnpm check          # schnelles lokales Gate: Produktions-tsgo + geshardetes Lint + parallele schnelle Guards
pnpm check:test-types
pnpm check:timed    # dasselbe Gate mit Zeitmessungen pro Stufe
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # Vitest-Tests
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # Docs-Formatierung + Lint + Broken Links
pnpm build          # dist bauen, wenn CI-Artefakt-/build-smoke-Lanes relevant sind
node scripts/ci-run-timings.mjs <run-id>  # Wall-Time, Queue-Zeit und die langsamsten Jobs zusammenfassen
```
