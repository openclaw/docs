---
read_when:
    - Tests ausführen oder beheben
summary: Wie Sie Tests lokal ausführen (Vitest) und wann Sie die Modi „force“/„coverage“ verwenden sollten
title: Tests
x-i18n:
    generated_at: "2026-04-22T04:27:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: ed665840ef2c7728da8ec923eb3ea2878d9b20a841cb2fe4116a7f6334567b8e
    source_path: reference/test.md
    workflow: 15
---

# Tests

- Vollständiges Test-Kit (Suites, Live, Docker): [Testing](/de/help/testing)

- `pnpm test:force`: Beendet jeden hängengebliebenen Gateway-Prozess, der den Standard-Control-Port belegt, und führt dann die vollständige Vitest-Suite mit einem isolierten Gateway-Port aus, damit Server-Tests nicht mit einer laufenden Instanz kollidieren. Verwenden Sie dies, wenn ein vorheriger Gateway-Lauf Port 18789 belegt zurückgelassen hat.
- `pnpm test:coverage`: Führt die Unit-Suite mit V8-Coverage aus (über `vitest.unit.config.ts`). Dies ist ein Unit-Coverage-Gate für geladene Dateien, nicht eine repo-weite All-File-Coverage. Die Schwellenwerte sind 70 % für Zeilen/Funktionen/Statements und 55 % für Branches. Weil `coverage.all` false ist, misst das Gate Dateien, die von der Unit-Coverage-Suite geladen wurden, statt jede Quelldatei auf Split-Lane-Ebene als nicht abgedeckt zu behandeln.
- `pnpm test:coverage:changed`: Führt Unit-Coverage nur für Dateien aus, die sich seit `origin/main` geändert haben.
- `pnpm test:changed`: Erweitert geänderte Git-Pfade in scoped Vitest-Lanes, wenn der Diff nur routbare Source-/Test-Dateien berührt. Änderungen an Konfiguration/Setup fallen weiterhin auf den nativen Root-Projects-Lauf zurück, damit Änderungen an der Verdrahtung bei Bedarf breit neu ausgeführt werden.
- `pnpm changed:lanes`: Zeigt die architektonischen Lanes an, die durch den Diff gegen `origin/main` ausgelöst werden.
- `pnpm check:changed`: Führt das intelligente Changed-Gate für den Diff gegen `origin/main` aus. Es führt Core-Arbeit mit Core-Test-Lanes aus, Erweiterungsarbeit mit Erweiterungs-Test-Lanes, test-only-Arbeit nur mit Test-Typecheck/Tests, erweitert Änderungen am öffentlichen Plugin SDK oder an Plugin-Verträgen auf Validierung der Erweiterungen und hält version-only Änderungen an Release-Metadaten auf gezielte Prüfungen von Version/Konfiguration/Root-Abhängigkeiten beschränkt.
- `pnpm test`: Leitet explizite Datei-/Verzeichnisziele über scoped Vitest-Lanes. Läufe ohne Ziel verwenden feste Shard-Gruppen und werden zu Leaf-Configs für lokale parallele Ausführung erweitert; die Erweiterungsgruppe wird immer zu den Shard-Configs pro Erweiterung erweitert statt in einen riesigen Root-Project-Prozess.
- Vollständige Läufe und Erweiterungs-Shards aktualisieren lokale Timing-Daten in `.artifacts/vitest-shard-timings.json`; spätere Läufe verwenden diese Timings, um langsame und schnelle Shards auszubalancieren. Setzen Sie `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, um das lokale Timing-Artefakt zu ignorieren.
- Ausgewählte Testdateien aus `plugin-sdk` und `commands` werden jetzt über dedizierte leichte Lanes geleitet, die nur `test/setup.ts` beibehalten, während laufzeitschwere Fälle auf ihren bestehenden Lanes bleiben.
- Ausgewählte Hilfsquelldateien aus `plugin-sdk` und `commands` ordnen `pnpm test:changed` ebenfalls expliziten Schwester-Tests in diesen leichten Lanes zu, sodass kleine Änderungen an Hilfsdateien das erneute Ausführen der schweren laufzeitgestützten Suites vermeiden.
- `auto-reply` ist jetzt ebenfalls in drei dedizierte Configs aufgeteilt (`core`, `top-level`, `reply`), sodass das Reply-Harness nicht die leichteren Top-Level-Tests für Status/Token/Helper dominiert.
- Die Basis-Vitest-Konfiguration verwendet jetzt standardmäßig `pool: "threads"` und `isolate: false`, wobei der gemeinsame nicht isolierte Runner über die Repo-Configs hinweg aktiviert ist.
- `pnpm test:channels` führt `vitest.channels.config.ts` aus.
- `pnpm test:extensions` und `pnpm test extensions` führen alle Erweiterungs-/Plugin-Shards aus. Schwere Channel-Erweiterungen und OpenAI laufen als dedizierte Shards; andere Erweiterungsgruppen bleiben gebündelt. Verwenden Sie `pnpm test extensions/<id>` für die Lane eines gebündelten Plugins.
- `pnpm test:perf:imports`: Aktiviert Reporting zu Vitest-Importdauer + Importaufschlüsselung, verwendet aber weiterhin scoped Lane-Routing für explizite Datei-/Verzeichnisziele.
- `pnpm test:perf:imports:changed`: Dasselbe Import-Profiling, aber nur für Dateien, die sich seit `origin/main` geändert haben.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` benchmarkt den gerouteten Changed-Mode-Pfad gegen den nativen Root-Projects-Lauf für denselben committeten Git-Diff.
- `pnpm test:perf:changed:bench -- --worktree` benchmarkt die aktuelle Änderung im Worktree, ohne vorher zu committen.
- `pnpm test:perf:profile:main`: Schreibt ein CPU-Profil für den Vitest-Hauptthread (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: Schreibt CPU- + Heap-Profile für den Unit-Runner (`.artifacts/vitest-runner-profile`).
- Gateway-Integration: Opt-in über `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` oder `pnpm test:gateway`.
- `pnpm test:e2e`: Führt Gateway-End-to-End-Smoke-Tests aus (Multi-Instance WS/HTTP/Node-Pairing). Verwendet standardmäßig `threads` + `isolate: false` mit adaptiven Workern in `vitest.e2e.config.ts`; anpassen mit `OPENCLAW_E2E_WORKERS=<n>` und `OPENCLAW_E2E_VERBOSE=1` für ausführliche Logs.
- `pnpm test:live`: Führt Live-Tests für Anbieter aus (minimax/zai). Erfordert API-Schlüssel und `LIVE=1` (oder anbieterspezifisches `*_LIVE_TEST=1`), damit das Überspringen aufgehoben wird.
- `pnpm test:docker:openwebui`: Startet Docker-basiertes OpenClaw + Open WebUI, meldet sich über Open WebUI an, prüft `/api/models` und führt dann einen echten proxied Chat über `/api/chat/completions` aus. Erfordert einen verwendbaren Live-Modellschlüssel (zum Beispiel OpenAI in `~/.profile`), zieht ein externes Open-WebUI-Image und soll nicht so CI-stabil sein wie die normalen Unit-/e2e-Suites.
- `pnpm test:docker:mcp-channels`: Startet einen vorbereiteten Gateway-Container und einen zweiten Client-Container, der `openclaw mcp serve` startet, und verifiziert dann geroutete Unterhaltungserkennung, Transkript-Lesezugriffe, Attachment-Metadaten, Verhalten der Live-Event-Queue, ausgehendes Send-Routing und Claude-artige Channel- + Berechtigungsbenachrichtigungen über die echte stdio-Bridge. Die Assertion für Claude-Benachrichtigungen liest die rohen stdio-MCP-Frames direkt, sodass der Smoke dem entspricht, was die Bridge tatsächlich ausgibt.

## Lokales PR-Gate

Für lokale PR-Land-/Gate-Prüfungen ausführen:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Wenn `pnpm test` auf einem ausgelasteten Host flakey ist, einmal erneut ausführen, bevor Sie es als Regression behandeln, und dann mit `pnpm test <path/to/test>` isolieren. Für Hosts mit knappen Speicherressourcen verwenden Sie:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark der Modelllatenz (lokale Schlüssel)

Skript: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Verwendung:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Optionale env: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Standard-Prompt: „Reply with a single word: ok. No punctuation or extra text.“

Letzter Lauf (2025-12-31, 20 Läufe):

- minimax Median 1279 ms (min 1114, max 2431)
- opus Median 2454 ms (min 1224, max 3170)

## Benchmark für CLI-Start

Skript: [`scripts/bench-cli-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-cli-startup.ts)

Verwendung:

- `pnpm test:startup:bench`
- `pnpm test:startup:bench:smoke`
- `pnpm test:startup:bench:save`
- `pnpm test:startup:bench:update`
- `pnpm test:startup:bench:check`
- `pnpm tsx scripts/bench-cli-startup.ts`
- `pnpm tsx scripts/bench-cli-startup.ts --runs 12`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --case gatewayStatus --runs 3`
- `pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all`
- `pnpm tsx scripts/bench-cli-startup.ts --preset all --output .artifacts/cli-startup-bench-all.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case gatewayStatusJson --output .artifacts/cli-startup-bench-smoke.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu`
- `pnpm tsx scripts/bench-cli-startup.ts --json`

Presets:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: beide Presets

Die Ausgabe enthält `sampleCount`, avg, p50, p95, min/max, Verteilung von Exit-Code/Signal und Zusammenfassungen zu max RSS für jeden Befehl. Optionales `--cpu-prof-dir` / `--heap-prof-dir` schreibt V8-Profile pro Lauf, sodass Zeitmessung und Profilerfassung dasselbe Harness verwenden.

Konventionen für gespeicherte Ausgaben:

- `pnpm test:startup:bench:smoke` schreibt das gezielte Smoke-Artefakt nach `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` schreibt das vollständige Suite-Artefakt nach `.artifacts/cli-startup-bench-all.json` mit `runs=5` und `warmup=1`
- `pnpm test:startup:bench:update` aktualisiert die eingecheckte Baseline-Fixture unter `test/fixtures/cli-startup-bench.json` mit `runs=5` und `warmup=1`

Eingecheckte Fixture:

- `test/fixtures/cli-startup-bench.json`
- Aktualisieren mit `pnpm test:startup:bench:update`
- Aktuelle Ergebnisse mit der Fixture vergleichen über `pnpm test:startup:bench:check`

## Onboarding E2E (Docker)

Docker ist optional; dies wird nur für containerisierte Onboarding-Smoke-Tests benötigt.

Vollständiger Cold-Start-Ablauf in einem sauberen Linux-Container:

```bash
scripts/e2e/onboard-docker.sh
```

Dieses Skript steuert den interaktiven Wizard über ein Pseudo-TTY, prüft Konfigurations-/Workspace-/Sitzungsdateien, startet dann das Gateway und führt `openclaw health` aus.

## QR-Import-Smoke (Docker)

Stellt sicher, dass `qrcode-terminal` unter den unterstützten Docker-Node-Laufzeiten geladen wird (standardmäßig Node 24, kompatibel mit Node 22):

```bash
pnpm test:docker:qr
```
