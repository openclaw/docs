---
read_when:
    - Sie müssen verstehen, warum ein CI-Job ausgeführt wurde oder nicht.
    - Sie debuggen fehlgeschlagene GitHub-Actions-Prüfungen.
summary: CI-Job-Graph, Scope-Gates und lokale Befehlsäquivalente
title: CI-Pipeline
x-i18n:
    generated_at: "2026-04-21T19:20:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4d01a178402976cdf7c3c864695e8a12d3f7d1d069a77ea1b02a8aef2a3497f7
    source_path: ci.md
    workflow: 15
---

# CI-Pipeline

Die CI läuft bei jedem Push auf `main` und bei jeder Pull Request. Sie verwendet intelligentes Scoping, um teure Jobs zu überspringen, wenn sich nur nicht zusammenhängende Bereiche geändert haben.

## Job-Überblick

| Job                              | Zweck                                                                                        | Wann er läuft                       |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------- |
| `preflight`                      | Nur-Doku-Änderungen, geänderte Scopes, geänderte Extensions erkennen und das CI-Manifest erstellen | Immer bei Nicht-Entwurf-Pushes und PRs |
| `security-scm-fast`              | Erkennung privater Schlüssel und Workflow-Audit über `zizmor`                               | Immer bei Nicht-Entwurf-Pushes und PRs |
| `security-dependency-audit`      | Audit der produktionsrelevanten Lockfile ohne Abhängigkeiten gegen npm-Sicherheitsmeldungen | Immer bei Nicht-Entwurf-Pushes und PRs |
| `security-fast`                  | Erforderliche Aggregation für die schnellen Sicherheitsjobs                                  | Immer bei Nicht-Entwurf-Pushes und PRs |
| `build-artifacts`                | `dist/` und die Control UI einmal bauen, wiederverwendbare Artefakte für nachgelagerte Jobs hochladen | Bei Node-relevanten Änderungen      |
| `checks-fast-core`               | Schnelle Linux-Korrektheits-Lanes wie bundled-/plugin-contract-/protocol-Prüfungen          | Bei Node-relevanten Änderungen      |
| `checks-fast-contracts-channels` | Gesplittete Kanal-Contract-Prüfungen mit einem stabilen aggregierten Prüfergebnis           | Bei Node-relevanten Änderungen      |
| `checks-node-extensions`         | Vollständige Test-Shards für bundled-Plugins über die gesamte Extension-Suite               | Bei Node-relevanten Änderungen      |
| `checks-node-core-test`          | Core-Node-Test-Shards, ausgenommen Kanal-, bundled-, Contract- und Extension-Lanes          | Bei Node-relevanten Änderungen      |
| `extension-fast`                 | Fokussierte Tests nur für die geänderten bundled-Plugins                                     | Wenn Extension-Änderungen erkannt werden |
| `check`                          | Gesplittetes Äquivalent zum Haupt-Local-Gate: Prod-Typen, Lint, Guards, Test-Typen und strenger Smoke | Bei Node-relevanten Änderungen      |
| `check-additional`               | Shards für Architektur-, Boundary-, Extension-Surface-Guards, Package-Boundary und Gateway-Watch | Bei Node-relevanten Änderungen      |
| `build-smoke`                    | Smoke-Tests für die gebaute CLI und Startup-Memory-Smoke                                     | Bei Node-relevanten Änderungen      |
| `checks`                         | Verbleibende Linux-Node-Lanes: Kanaltests und nur bei Pushes Node-22-Kompatibilität         | Bei Node-relevanten Änderungen      |
| `check-docs`                     | Doku-Formatierung, Lint- und Broken-Link-Prüfungen                                           | Wenn sich Doku geändert hat         |
| `skills-python`                  | Ruff + pytest für Python-gestützte Skills                                                    | Bei Python-Skills-relevanten Änderungen |
| `checks-windows`                 | Windows-spezifische Test-Lanes                                                               | Bei Windows-relevanten Änderungen   |
| `macos-node`                     | macOS-TypeScript-Test-Lane unter Verwendung der gemeinsam gebauten Artefakte                 | Bei macOS-relevanten Änderungen     |
| `macos-swift`                    | Swift-Lint, Build und Tests für die macOS-App                                                | Bei macOS-relevanten Änderungen     |
| `android`                        | Android-Build- und Test-Matrix                                                               | Bei Android-relevanten Änderungen   |

## Fail-Fast-Reihenfolge

Die Jobs sind so angeordnet, dass günstige Prüfungen fehlschlagen, bevor teure Jobs ausgeführt werden:

1. `preflight` entscheidet, welche Lanes überhaupt existieren. Die Logik `docs-scope` und `changed-scope` sind Schritte innerhalb dieses Jobs, keine eigenständigen Jobs.
2. `security-scm-fast`, `security-dependency-audit`, `security-fast`, `check`, `check-additional`, `check-docs` und `skills-python` schlagen schnell fehl, ohne auf die schwereren Artefakt- und Plattform-Matrix-Jobs zu warten.
3. `build-artifacts` überlappt mit den schnellen Linux-Lanes, sodass nachgelagerte Verbraucher starten können, sobald der gemeinsame Build bereit ist.
4. Danach fächern sich die schwereren Plattform- und Runtime-Lanes auf: `checks-fast-core`, `checks-fast-contracts-channels`, `checks-node-extensions`, `checks-node-core-test`, `extension-fast`, `checks`, `checks-windows`, `macos-node`, `macos-swift` und `android`.

Die Scope-Logik liegt in `scripts/ci-changed-scope.mjs` und ist durch Unit-Tests in `src/scripts/ci-changed-scope.test.ts` abgedeckt.
Der separate Workflow `install-smoke` verwendet dasselbe Scope-Skript über seinen eigenen Job `preflight` wieder. Er berechnet `run_install_smoke` aus dem engeren Signal `changed-smoke`, sodass Docker-/Install-Smoke nur bei Installations-, Packaging- und Container-relevanten Änderungen läuft.

Die lokale Changed-Lane-Logik liegt in `scripts/changed-lanes.mjs` und wird durch `scripts/check-changed.mjs` ausgeführt. Dieses lokale Gate ist bei Architekturgrenzen strenger als das breite CI-Plattform-Scoping: Änderungen an der Core-Production führen Core-Prod-Typecheck plus Core-Tests aus, Änderungen nur an Core-Tests führen nur Core-Test-Typecheck/-Tests aus, Änderungen an der Extension-Production führen Extension-Prod-Typecheck plus Extension-Tests aus, und Änderungen nur an Extension-Tests führen nur Extension-Test-Typecheck/-Tests aus. Öffentliche Änderungen am Plugin SDK oder plugin-contract erweitern die Extension-Validierung, weil Extensions von diesen Core-Contracts abhängen. Unbekannte Root-/Config-Änderungen fallen sicherheitshalber auf alle Lanes zurück.

Bei Pushes ergänzt die Matrix `checks` die nur bei Pushes vorhandene Lane `compat-node22`. Bei Pull Requests wird diese Lane übersprungen, und die Matrix bleibt auf die normalen Test-/Kanal-Lanes fokussiert.

Die langsamsten Node-Testfamilien sind in Include-File-Shards aufgeteilt, damit jeder Job klein bleibt: Kanal-Contracts teilen Registry- und Core-Abdeckung in jeweils acht gewichtete Shards auf, Auto-Reply-Reply-Command-Tests sind in vier Include-Pattern-Shards aufgeteilt, und die anderen großen Auto-Reply-Reply-Prefix-Gruppen sind jeweils in zwei Shards aufgeteilt. `check-additional` trennt außerdem Package-Boundary-Compile-/Canary-Arbeit von Runtime-Topology-Gateway-/Architektur-Arbeit.

GitHub kann ersetzte Jobs als `cancelled` markieren, wenn ein neuerer Push auf derselben PR oder derselben Ref `main` landet. Behandeln Sie das als CI-Rauschen, es sei denn, auch der neueste Lauf für dieselbe Ref schlägt fehl. Die aggregierten Shard-Prüfungen weisen explizit auf diesen Abbruchfall hin, damit er leichter von einem Testfehler zu unterscheiden ist.

## Runner

| Runner                           | Jobs                                                                                                                                                   |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `blacksmith-16vcpu-ubuntu-2404`  | `preflight`, `security-scm-fast`, `security-dependency-audit`, `security-fast`, `build-artifacts`, Linux-Prüfungen, Doku-Prüfungen, Python-Skills, `android` |
| `blacksmith-32vcpu-windows-2025` | `checks-windows`                                                                                                                                       |
| `blacksmith-12vcpu-macos-latest` | `macos-node`, `macos-swift` auf `openclaw/openclaw`; Forks fallen auf `macos-latest` zurück                                                          |

## Lokale Äquivalente

```bash
pnpm changed:lanes   # lokalen Changed-Lane-Klassifikator für origin/main...HEAD prüfen
pnpm check:changed   # intelligentes lokales Gate: geänderte Typecheck-/Lint-/Tests nach Boundary-Lane
pnpm check          # schnelles lokales Gate: Produktions-tsgo + gesplittetes Lint + parallele schnelle Guards
pnpm check:test-types
pnpm check:timed    # dasselbe Gate mit Zeiten pro Phase
pnpm build:strict-smoke
pnpm check:architecture
pnpm test:gateway:watch-regression
pnpm test           # Vitest-Tests
pnpm test:channels
pnpm test:contracts:channels
pnpm check:docs     # Doku-Formatierung + Lint + Broken Links
pnpm build          # dist bauen, wenn CI-Artefakt-/build-smoke-Lanes relevant sind
```
