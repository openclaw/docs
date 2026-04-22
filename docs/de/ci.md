---
read_when:
    - Sie müssen verstehen, warum ein CI-Job ausgeführt wurde oder nicht
    - Sie debuggen fehlgeschlagene GitHub-Actions-Prüfungen
summary: CI-Job-Graph, Scope-Gates und lokale Befehlsäquivalente
title: CI-Pipeline
x-i18n:
    generated_at: "2026-04-22T04:21:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: ae08bad6cbd0f2eced6c88a792a11bc1c2b1a2bfb003a56f70ff328a2739d3fc
    source_path: ci.md
    workflow: 15
---

# CI-Pipeline

Die CI läuft bei jedem Push nach `main` und bei jeder Pull Request. Sie verwendet intelligentes Scoping, um teure Jobs zu überspringen, wenn sich nur nicht zusammenhängende Bereiche geändert haben.

## Job-Überblick

| Job                              | Zweck                                                                                        | Wann er läuft                      |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Erkennt reine Docs-Änderungen, geänderte Scopes, geänderte Extensions und erstellt das CI-Manifest | Immer bei nicht als Entwurf markierten Pushes und PRs |
| `security-scm-fast`              | Erkennung privater Schlüssel und Workflow-Audit über `zizmor`                               | Immer bei nicht als Entwurf markierten Pushes und PRs |
| `security-dependency-audit`      | Produktionssperrdatei-Audit ohne Abhängigkeiten gegen npm-Advisories                        | Immer bei nicht als Entwurf markierten Pushes und PRs |
| `security-fast`                  | Erforderliches Aggregat für die schnellen Security-Jobs                                     | Immer bei nicht als Entwurf markierten Pushes und PRs |
| `build-artifacts`                | Baut `dist/` und die Control UI einmal und lädt wiederverwendbare Artefakte für nachgelagerte Jobs hoch | Node-relevante Änderungen          |
| `checks-fast-core`               | Schnelle Linux-Korrektheits-Lanes wie gebündelte/Plugin-Contract-/Protokoll-Prüfungen      | Node-relevante Änderungen          |
| `checks-fast-contracts-channels` | Gesplittete Channel-Contract-Prüfungen mit einem stabilen aggregierten Prüfergebnis         | Node-relevante Änderungen          |
| `checks-node-extensions`         | Vollständige Test-Shards für gebündelte Plugins über die gesamte Extension-Suite            | Node-relevante Änderungen          |
| `checks-node-core-test`          | Core-Node-Test-Shards ohne Channel-, gebündelte-, Contract- und Extension-Lanes            | Node-relevante Änderungen          |
| `extension-fast`                 | Fokussierte Tests nur für die geänderten gebündelten Plugins                                | Wenn Extension-Änderungen erkannt werden |
| `check`                          | Gesplittetes Äquivalent zum lokalen Haupt-Gate: Produktions-Types, Lint, Guards, Test-Types und strikter Smoke-Test | Node-relevante Änderungen          |
| `check-additional`               | Architektur-, Boundary-, Extension-Surface-Guards, Package-Boundary- und Gateway-Watch-Shards | Node-relevante Änderungen          |
| `build-smoke`                    | Smoke-Tests für die gebaute CLI und Startup-Memory-Smoke                                    | Node-relevante Änderungen          |
| `checks`                         | Verbleibende Linux-Node-Lanes: Channel-Tests und nur bei Pushes ausgeführte Node-22-Kompatibilität | Node-relevante Änderungen          |
| `check-docs`                     | Docs-Formatierung, Lint und Broken-Link-Prüfungen                                           | Docs geändert                      |
| `skills-python`                  | Ruff + pytest für Python-basierte Skills                                                    | Python-Skill-relevante Änderungen  |
| `checks-windows`                 | Windows-spezifische Test-Lanes                                                              | Windows-relevante Änderungen       |
| `macos-node`                     | macOS-TypeScript-Test-Lane mit den gemeinsam genutzten Build-Artefakten                     | macOS-relevante Änderungen         |
| `macos-swift`                    | Swift-Lint, Build und Tests für die macOS-App                                               | macOS-relevante Änderungen         |
| `android`                        | Android-Build- und Test-Matrix                                                              | Android-relevante Änderungen       |

## Fail-Fast-Reihenfolge

Die Jobs sind so angeordnet, dass günstige Prüfungen fehlschlagen, bevor teure Jobs laufen:

1. `preflight` entscheidet, welche Lanes überhaupt existieren. Die Logik `docs-scope` und `changed-scope` sind Schritte innerhalb dieses Jobs, keine eigenständigen Jobs.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` und `skills-python` schlagen schnell fehl, ohne auf die schwereren Artefakt- und Plattform-Matrix-Jobs zu warten.
3. `build-artifacts` überlappt mit den schnellen Linux-Lanes, damit nachgelagerte Verbraucher starten können, sobald der gemeinsame Build bereit ist.
4. Schwerere Plattform- und Runtime-Lanes fächern sich danach auf: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` und `android`.

Die Scope-Logik befindet sich in `scripts/ci-changed-scope.mjs` und wird durch Unit-Tests in `src/scripts/ci-changed-scope.test.ts` abgedeckt.
Der separate Workflow `install-smoke` verwendet dasselbe Scope-Skript über seinen eigenen `preflight`-Job wieder. Er berechnet `run_install_smoke` aus dem engeren Signal `changed-smoke`, sodass Docker-/Install-Smoke nur bei install-, paketierungs- und containerrelevanten Änderungen läuft.

Die lokale Changed-Lane-Logik befindet sich in `scripts/changed-lanes.mjs` und wird von `scripts/check-changed.mjs` ausgeführt. Dieses lokale Gate ist bei Architekturgrenzen strenger als das breite CI-Plattform-Scoping: Änderungen an der Core-Produktion führen Core-Produktions-Typecheck plus Core-Tests aus, Änderungen nur an Core-Tests führen nur Core-Test-Typecheck/-Tests aus, Änderungen an der Extension-Produktion führen Extension-Produktions-Typecheck plus Extension-Tests aus, und Änderungen nur an Extension-Tests führen nur Extension-Test-Typecheck/-Tests aus. Änderungen an der öffentlichen Plugin SDK oder an Plugin-Contracts erweitern auf Extension-Validierung, weil Extensions von diesen Core-Contracts abhängen. Versionssprünge nur in Release-Metadaten führen gezielte Prüfungen für Version/Konfiguration/Root-Abhängigkeiten aus. Unbekannte Änderungen an Root/Konfiguration schlagen aus Sicherheitsgründen auf alle Lanes durch.

Bei Pushes fügt die Matrix `checks` die nur für Pushes bestimmte Lane `compat-node22` hinzu. Bei Pull Requests wird diese Lane übersprungen und die Matrix bleibt auf die normalen Test-/Channel-Lanes fokussiert.

Die langsamsten Node-Testfamilien sind in Include-File-Shards aufgeteilt, damit jeder Job klein bleibt: Channel-Contracts teilen Registry- und Core-Abdeckung in jeweils acht gewichtete Shards, Auto-Reply-Reply-Command-Tests teilen sich in vier Include-Pattern-Shards, und die anderen großen Auto-Reply-Reply-Prefix-Gruppen teilen sich jeweils in zwei Shards. `check-additional` trennt außerdem Package-Boundary-Compile-/Canary-Arbeit von Runtime-Topologie-Gateway-/Architektur-Arbeit.

GitHub kann ersetzte Jobs als `cancelled` markieren, wenn ein neuerer Push auf derselben PR oder demselben `main`-Ref landet. Behandeln Sie das als CI-Rauschen, sofern nicht auch der neueste Lauf für denselben Ref fehlschlägt. Die aggregierten Shard-Prüfungen weisen explizit auf diesen Fall der Stornierung hin, damit er leichter von einem Testfehler zu unterscheiden ist.

## Runner

| Runner                           | Jobs                                                                                                                                                    |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `blacksmith-16vcpu-ubuntu-2404`  | `preflight`, `security-scm-fast`, `security-dependency-audit`, `security-fast`, `build-artifacts`, Linux-Prüfungen, Docs-Prüfungen, Python-Skills, `android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                                                                        |
| `blacksmith-12vcpu-macos-latest` | `macos-node`, `macos-swift` auf `openclaw/openclaw`; Forks fallen auf `macos-latest` zurück                                                           |

## Lokale Äquivalente

```bash
pnpm changed:lanes   # lokalen Changed-Lane-Klassifizierer für origin/main...HEAD prüfen
pnpm check:changed   # intelligentes lokales Gate: geänderter Typecheck/Lint/Tests nach Boundary-Lane
pnpm check          # schnelles lokales Gate: Produktions-tsgo + gesplittetes Lint + parallele schnelle Guards
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
```
