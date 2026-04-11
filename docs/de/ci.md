---
read_when:
    - Sie müssen verstehen, warum ein CI-Job ausgeführt wurde oder nicht ausgeführt wurde.
    - Sie debuggen fehlgeschlagene GitHub-Actions-Prüfungen.
summary: CI-Jobgraph, Umfangs-Gates und lokale Befehlsäquivalente
title: CI-Pipeline
x-i18n:
    generated_at: "2026-04-11T02:44:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: ca7e355b7f73bfe8ea8c6971e78164b8b2e68cbb27966964955e267fed89fce6
    source_path: ci.md
    workflow: 15
---

# CI-Pipeline

Die CI läuft bei jedem Push nach `main` und bei jedem Pull Request. Sie verwendet intelligentes Scoping, um teure Jobs zu überspringen, wenn sich nur nicht zusammenhängende Bereiche geändert haben.

## Job-Überblick

| Job                      | Zweck                                                                                  | Wann er läuft                        |
| ------------------------ | -------------------------------------------------------------------------------------- | ------------------------------------ |
| `preflight`              | Erkennt reine Doku-Änderungen, geänderte Scopes, geänderte Erweiterungen und erstellt das CI-Manifest | Immer bei Nicht-Entwurf-Pushes und PRs |
| `security-fast`          | Erkennung privater Schlüssel, Workflow-Audit über `zizmor`, Audit von Produktionsabhängigkeiten | Immer bei Nicht-Entwurf-Pushes und PRs |
| `build-artifacts`        | Baut `dist/` und die Control UI einmal und lädt wiederverwendbare Artefakte für nachgelagerte Jobs hoch | Node-relevante Änderungen            |
| `checks-fast-core`       | Schnelle Linux-Korrektheits-Lanes wie Prüfungen für gebündelte/plugin-contract/protocol | Node-relevante Änderungen            |
| `checks-node-extensions` | Vollständige Test-Shards für gebündelte Plugins über die Erweiterungssuite hinweg      | Node-relevante Änderungen            |
| `checks-node-core-test`  | Core-Node-Test-Shards, ohne Channel-, gebündelte, Contract- und Erweiterungs-Lanes     | Node-relevante Änderungen            |
| `extension-fast`         | Fokussierte Tests nur für die geänderten gebündelten Plugins                           | Wenn Erweiterungsänderungen erkannt werden |
| `check`                  | Wichtigstes lokales Gate in CI: `pnpm check` plus `pnpm build:strict-smoke`            | Node-relevante Änderungen            |
| `check-additional`       | Architektur-, Boundary- und Importzyklus-Schutzmaßnahmen plus der Gateway-Watch-Regression-Harness | Node-relevante Änderungen            |
| `build-smoke`            | Smoke-Tests für die gebaute CLI und Startup-Speicher-Smoke                             | Node-relevante Änderungen            |
| `checks`                 | Verbleibende Linux-Node-Lanes: Channel-Tests und die nur bei Pushes laufende Node-22-Kompatibilität | Node-relevante Änderungen            |
| `check-docs`             | Doku-Formatierung, Linting und Broken-Link-Prüfungen                                   | Wenn sich Doku geändert hat          |
| `skills-python`          | Ruff + pytest für Python-basierte Skills                                               | Python-Skill-relevante Änderungen    |
| `checks-windows`         | Windows-spezifische Test-Lanes                                                         | Windows-relevante Änderungen         |
| `macos-node`             | macOS-TypeScript-Test-Lane mit den gemeinsam genutzten Build-Artefakten                | macOS-relevante Änderungen           |
| `macos-swift`            | Swift-Linting, Build und Tests für die macOS-App                                       | macOS-relevante Änderungen           |
| `android`                | Android-Build- und Test-Matrix                                                         | Android-relevante Änderungen         |

## Fail-Fast-Reihenfolge

Die Jobs sind so angeordnet, dass günstige Prüfungen fehlschlagen, bevor teurere Jobs laufen:

1. `preflight` entscheidet, welche Lanes überhaupt existieren. Die Logik `docs-scope` und `changed-scope` sind Schritte innerhalb dieses Jobs, keine eigenständigen Jobs.
2. `security-fast`, `check`, `check-additional`, `check-docs` und `skills-python` schlagen schnell fehl, ohne auf die schwereren Artefakt- und Plattform-Matrix-Jobs zu warten.
3. `build-artifacts` überschneidet sich mit den schnellen Linux-Lanes, damit nachgelagerte Consumer starten können, sobald der gemeinsame Build bereit ist.
4. Danach verzweigen die schwereren Plattform- und Runtime-Lanes: `checks-fast-core`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` und `android`.

Die Scope-Logik befindet sich in `scripts/ci-changed-scope.mjs` und wird durch Unit-Tests in `src/scripts/ci-changed-scope.test.ts` abgedeckt.
Der separate Workflow `install-smoke` verwendet dasselbe Scope-Skript über seinen eigenen Job `preflight` wieder. Er berechnet `run_install_smoke` aus dem engeren Signal changed-smoke, sodass Docker-/Install-Smoke nur bei install-, packaging- und container-relevanten Änderungen läuft.

Bei Pushes ergänzt die Matrix `checks` die nur bei Pushes laufende Lane `compat-node22`. Bei Pull Requests wird diese Lane übersprungen, und die Matrix bleibt auf die normalen Test-/Channel-Lanes fokussiert.

## Runner

| Runner                           | Jobs                                                                                                  |
| -------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `blacksmith-16vcpu-ubuntu-2404`  | `preflight`, `security-fast`, `build-artifacts`, Linux-Prüfungen, Doku-Prüfungen, Python-Skills, `android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                      |
| `macos-latest`                   | `macos-node`, `macos-swift`                                                                           |

## Lokale Äquivalente

```bash
pnpm check          # Typen + Lint + Format
pnpm build:strict-smoke
pnpm check:import-cycles
pnpm test:gateway:watch-regression
pnpm test           # Vitest-Tests
pnpm test:channels
pnpm check:docs     # Doku-Format + Lint + Broken Links
pnpm build          # baut dist, wenn die CI-Artefakt-/build-smoke-Lanes relevant sind
```
