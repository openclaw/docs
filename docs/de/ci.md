---
read_when:
    - Sie müssen verstehen, warum ein CI-Job ausgeführt wurde oder nicht.
    - Sie debuggen fehlgeschlagene GitHub-Actions-Prüfungen.
summary: CI-Job-Graph, Scope-Gates und lokale Befehlsäquivalente
title: CI-Pipeline
x-i18n:
    generated_at: "2026-04-22T06:22:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: fc7ec59123aee65634736320dbf1cf5cdfb08786a78cca82ce9596fedc68b3cc
    source_path: ci.md
    workflow: 15
---

# CI-Pipeline

Die CI läuft bei jedem Push auf `main` und bei jedem Pull Request. Sie verwendet intelligentes Scoping, um teure Jobs zu überspringen, wenn sich nur nicht zusammenhängende Bereiche geändert haben.

## Job-Übersicht

| Job                              | Zweck                                                                                        | Wann er läuft                      |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------- |
| `preflight`                      | Nur-Doku-Änderungen, geänderte Scopes, geänderte Extensions erkennen und das CI-Manifest erstellen | Immer bei Nicht-Entwurf-Pushes und PRs |
| `security-scm-fast`              | Erkennung privater Schlüssel und Workflow-Audit über `zizmor`                                | Immer bei Nicht-Entwurf-Pushes und PRs |
| `security-dependency-audit`      | Produktions-Lockfile-Audit ohne Abhängigkeiten gegen npm-Hinweise                            | Immer bei Nicht-Entwurf-Pushes und PRs |
| `security-fast`                  | Erforderliche Aggregation für die schnellen Sicherheitsjobs                                  | Immer bei Nicht-Entwurf-Pushes und PRs |
| `build-artifacts`                | `dist/` und die Control UI einmal bauen, wiederverwendbare Artefakte für nachgelagerte Jobs hochladen | Node-relevante Änderungen          |
| `checks-fast-core`               | Schnelle Linux-Korrektheits-Lanes wie gebündelte/Plugin-Contract-/Protokoll-Prüfungen       | Node-relevante Änderungen          |
| `checks-fast-contracts-channels` | Gesplittete Channel-Contract-Prüfungen mit einem stabilen aggregierten Prüfergebnis          | Node-relevante Änderungen          |
| `checks-node-extensions`         | Vollständige Shards für Tests gebündelter Plugins über die gesamte Extension-Suite           | Node-relevante Änderungen          |
| `checks-node-core-test`          | Core-Node-Test-Shards, ohne Channel-, gebündelte, Contract- und Extension-Lanes             | Node-relevante Änderungen          |
| `extension-fast`                 | Fokussierte Tests nur für die geänderten gebündelten Plugins                                 | Wenn Extension-Änderungen erkannt werden |
| `check`                          | Gesplittetes Äquivalent zum lokalen Haupt-Gate: Produktions-Typen, Lint, Guards, Testtypen und strikter Smoke | Node-relevante Änderungen          |
| `check-additional`               | Architektur-, Boundary-, Extension-Surface-Guards, Package-Boundary- und Gateway-Watch-Shards | Node-relevante Änderungen          |
| `build-smoke`                    | Smoke-Tests für gebaute CLI und Startup-Memory-Smoke                                         | Node-relevante Änderungen          |
| `checks`                         | Verbleibende Linux-Node-Lanes: Channel-Tests und nur bei Pushes Node-22-Kompatibilität      | Node-relevante Änderungen          |
| `check-docs`                     | Prüfungen für Doku-Formatierung, Lint und defekte Links                                      | Doku geändert                      |
| `skills-python`                  | Ruff + pytest für Python-gestützte Skills                                                    | Python-Skills-relevante Änderungen |
| `checks-windows`                 | Windows-spezifische Test-Lanes                                                               | Windows-relevante Änderungen       |
| `macos-node`                     | macOS-TypeScript-Test-Lane mit den gemeinsam genutzten Build-Artefakten                      | macOS-relevante Änderungen         |
| `macos-swift`                    | Swift-Lint, Build und Tests für die macOS-App                                                | macOS-relevante Änderungen         |
| `android`                        | Android-Build- und Test-Matrix                                                               | Android-relevante Änderungen       |

## Reihenfolge für schnelles Fehlschlagen

Die Jobs sind so angeordnet, dass günstige Prüfungen fehlschlagen, bevor teure Jobs ausgeführt werden:

1. `preflight` entscheidet, welche Lanes überhaupt existieren. Die Logik `docs-scope` und `changed-scope` sind Schritte innerhalb dieses Jobs, keine eigenständigen Jobs.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` und `skills-python` schlagen schnell fehl, ohne auf die schwereren Artefakt- und Plattform-Matrix-Jobs zu warten.
3. `build-artifacts` läuft parallel zu den schnellen Linux-Lanes, damit nachgelagerte Verbraucher starten können, sobald der gemeinsame Build bereit ist.
4. Danach verzweigen die schwereren Plattform- und Runtime-Lanes: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` und `android`.

Die Scope-Logik befindet sich in `scripts/ci-changed-scope.mjs` und ist durch Unit-Tests in `src/scripts/ci-changed-scope.test.ts` abgedeckt.
Der separate Workflow `install-smoke` verwendet dasselbe Scope-Skript über seinen eigenen `preflight`-Job wieder. Er berechnet `run_install_smoke` aus dem engeren Signal geänderter Smoke-Bereiche, sodass Docker-/Install-Smoke nur bei install-, paketierungs- und containerrelevanten Änderungen läuft.

Die lokale Changed-Lane-Logik befindet sich in `scripts/changed-lanes.mjs` und wird von `scripts/check-changed.mjs` ausgeführt. Dieses lokale Gate ist bei Architekturgrenzen strenger als das breite CI-Plattform-Scoping: Änderungen an der Core-Produktion führen zu Core-Produktions-Typecheck plus Core-Tests, reine Core-Test-Änderungen führen nur zu Core-Test-Typecheck/-Tests, Änderungen an der Extension-Produktion führen zu Extension-Produktions-Typecheck plus Extension-Tests, und reine Extension-Test-Änderungen führen nur zu Extension-Test-Typecheck/-Tests. Änderungen am öffentlichen Plugin SDK oder Plugin-Contract erweitern die Validierung auf Extensions, weil Extensions von diesen Core-Contracts abhängen. Reine Versionsanhebungen in Release-Metadaten führen zu gezielten Prüfungen für Version/Konfiguration/Root-Abhängigkeiten. Unbekannte Änderungen an Root/Konfiguration schlagen sicherheitshalber auf alle Lanes durch.

Bei Pushes fügt die Matrix `checks` die nur bei Pushes verwendete Lane `compat-node22` hinzu. Bei Pull Requests wird diese Lane übersprungen, und die Matrix bleibt auf die normalen Test-/Channel-Lanes fokussiert.

Die langsamsten Node-Testfamilien werden in Include-File-Shards aufgeteilt, damit jeder Job klein bleibt: Channel-Contracts teilen Registry- und Core-Abdeckung jeweils in acht gewichtete Shards auf, Tests für Auto-Reply-Reply-Commands werden in vier Include-Pattern-Shards aufgeteilt, und die anderen großen Auto-Reply-Reply-Prefix-Gruppen werden jeweils in zwei Shards aufgeteilt. `check-additional` trennt außerdem Package-Boundary-Compile-/Canary-Arbeit von Runtime-Topologie-Gateway-/Architektur-Arbeit.

GitHub kann überholte Jobs als `cancelled` markieren, wenn ein neuerer Push auf derselben PR oder derselben `main`-Ref landet. Behandeln Sie das als CI-Rauschen, außer wenn auch der neueste Run für dieselbe Ref fehlschlägt. Die aggregierten Shard-Prüfungen weisen explizit auf diesen Abbruchfall hin, damit er leichter von einem Testfehler zu unterscheiden ist.

## Runner

| Runner                           | Jobs                                                                                                                                      |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `ubuntu-24.04`                   | `preflight`; install-smoke-preflight verwendet ebenfalls GitHub-gehostetes Ubuntu, damit die Blacksmith-Matrix früher in die Warteschlange gestellt werden kann |
| `blacksmith-16vcpu-ubuntu-2404`  | `security-scm-fast`, `security-dependency-audit`, `security-fast`, `build-artifacts`, Linux-Prüfungen, Doku-Prüfungen, Python-Skills, `android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                                                          |
| `blacksmith-12vcpu-macos-latest` | `macos-node`, `macos-swift` auf `openclaw/openclaw`; Forks fallen auf `macos-latest` zurück                                             |

## Lokale Äquivalente

```bash
pnpm changed:lanes   # den lokalen Changed-Lane-Klassifizierer für origin/main...HEAD prüfen
pnpm check:changed   # intelligentes lokales Gate: geänderter Typecheck/Lint/Tests nach Boundary-Lane
pnpm check          # schnelles lokales Gate: Produktions-tsgo + gesplittetes Lint + parallele schnelle Guards
pnpm check:test-types
pnpm check:timed    # dasselbe Gate mit Zeitmessungen pro Stufe
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # Vitest-Tests
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # Doku-Format + Lint + Prüfungen auf defekte Links
pnpm build          # `dist` bauen, wenn CI-Artefakt-/build-smoke-Lanes relevant sind
```
