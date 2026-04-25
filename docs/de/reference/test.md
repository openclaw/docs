---
read_when:
    - Tests ausführen oder beheben
summary: Wie man Tests lokal ausführt (`vitest`) und wann man Force-/Coverage-Modi verwendet
title: Tests
x-i18n:
    generated_at: "2026-04-25T13:56:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: dc138f5e3543b45598ab27b9f7bc9ce43979510b4508580a0cf95c43f97bac53
    source_path: reference/test.md
    workflow: 15
---

- Vollständiges Test-Kit (Suites, Live, Docker): [Testing](/de/help/testing)

- `pnpm test:force`: Beendet alle verbliebenen Gateway-Prozesse, die den Standard-Control-Port belegen, und führt dann die vollständige Vitest-Suite mit einem isolierten Gateway-Port aus, damit Servertests nicht mit einer laufenden Instanz kollidieren. Verwende dies, wenn ein vorheriger Gateway-Lauf Port 18789 belegt gelassen hat.
- `pnpm test:coverage`: Führt die Unit-Suite mit V8-Coverage aus (über `vitest.unit.config.ts`). Dies ist ein Coverage-Gate für geladene Unit-Dateien, nicht eine All-File-Coverage für das gesamte Repo. Die Schwellenwerte sind 70 % für Zeilen/Funktionen/Statements und 55 % für Branches. Da `coverage.all` auf false gesetzt ist, misst das Gate Dateien, die von der Unit-Coverage-Suite geladen werden, anstatt jede Quelldatei aus aufgeteilten Lanes als ungedeckt zu behandeln.
- `pnpm test:coverage:changed`: Führt Unit-Coverage nur für Dateien aus, die sich seit `origin/main` geändert haben.
- `pnpm test:changed`: Erweitert geänderte Git-Pfade zu bereichsbezogenen Vitest-Lanes, wenn der Diff nur routbare Source-/Testdateien berührt. Änderungen an Konfiguration/Setup fallen weiterhin auf den nativen Root-Projects-Lauf zurück, sodass Änderungen am Wiring bei Bedarf breit neu ausgeführt werden.
- `pnpm changed:lanes`: Zeigt die architektonischen Lanes an, die durch den Diff gegen `origin/main` ausgelöst werden.
- `pnpm check:changed`: Führt das intelligente Changed-Gate für den Diff gegen `origin/main` aus. Es führt Core-Arbeit mit Core-Test-Lanes aus, Extension-Arbeit mit Extension-Test-Lanes, test-only Arbeit nur mit Test-Typecheck/Tests, erweitert Änderungen an öffentlichem Plugin SDK oder Plugin-Contract auf einen Validierungsdurchlauf für eine Extension und hält Version-Bumps, die nur Release-Metadaten betreffen, auf gezielte Prüfungen von Version/Konfiguration/Root-Abhängigkeiten beschränkt.
- `pnpm test`: Leitet explizite Datei-/Verzeichnisziele durch bereichsbezogene Vitest-Lanes. Nicht zielgerichtete Läufe verwenden feste Shard-Gruppen und erweitern zu Leaf-Configs für lokale parallele Ausführung; die Extension-Gruppe wird immer zu den Shard-Configs pro Extension erweitert statt zu einem einzigen riesigen Root-Project-Prozess.
- Vollständige Läufe und Extension-Shard-Läufe aktualisieren lokale Zeitdaten in `.artifacts/vitest-shard-timings.json`; spätere Läufe verwenden diese Zeiten, um langsame und schnelle Shards auszubalancieren. Setze `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, um das lokale Timing-Artefakt zu ignorieren.
- Ausgewählte Testdateien in `plugin-sdk` und `commands` werden jetzt über dedizierte leichte Lanes geleitet, die nur `test/setup.ts` beibehalten, während laufzeitintensive Fälle auf ihren bestehenden Lanes bleiben.
- Ausgewählte Hilfsquelldateien in `plugin-sdk` und `commands` ordnen `pnpm test:changed` ebenfalls expliziten benachbarten Tests in diesen leichten Lanes zu, sodass kleine Änderungen an Helfern nicht die erneute Ausführung der schweren, laufzeitgestützten Suites auslösen.
- `auto-reply` ist jetzt ebenfalls in drei dedizierte Configs aufgeteilt (`core`, `top-level`, `reply`), sodass das Reply-Harness nicht die leichteren Top-Level-Status-/Token-/Helper-Tests dominiert.
- Die Basis-Vitest-Konfiguration verwendet jetzt standardmäßig `pool: "threads"` und `isolate: false`, wobei der gemeinsame nicht isolierte Runner in den Repo-Configs aktiviert ist.
- `pnpm test:channels` führt `vitest.channels.config.ts` aus.
- `pnpm test:extensions` und `pnpm test extensions` führen alle Extension-/Plugin-Shards aus. Schwere Channel-Plugins, das Browser-Plugin und OpenAI laufen als dedizierte Shards; andere Plugin-Gruppen bleiben gebündelt. Verwende `pnpm test extensions/<id>` für eine gebündelte Plugin-Lane.
- `pnpm test:perf:imports`: Aktiviert die Vitest-Berichterstattung zu Importdauer und Importaufschlüsselung und verwendet weiterhin bereichsbezogenes Lane-Routing für explizite Datei-/Verzeichnisziele.
- `pnpm test:perf:imports:changed`: Gleiches Import-Profiling, aber nur für Dateien, die sich seit `origin/main` geändert haben.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` benchmarkt den gerouteten Changed-Mode-Pfad gegen den nativen Root-Project-Lauf für denselben festgeschriebenen Git-Diff.
- `pnpm test:perf:changed:bench -- --worktree` benchmarkt das aktuelle Worktree-Änderungsset, ohne es zuerst zu committen.
- `pnpm test:perf:profile:main`: Schreibt ein CPU-Profil für den Vitest-Hauptthread (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: Schreibt CPU- und Heap-Profile für den Unit-Runner (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: Führt jede Leaf-Config der vollständigen Vitest-Suite seriell aus und schreibt gruppierte Laufzeitdaten plus JSON-/Log-Artefakte pro Config. Der Test Performance Agent verwendet dies als Baseline, bevor er versucht, langsame Tests zu beheben.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: Vergleicht gruppierte Berichte nach einer performancefokussierten Änderung.
- Gateway-Integration: Opt-in über `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` oder `pnpm test:gateway`.
- `pnpm test:e2e`: Führt Gateway-End-to-End-Smoke-Tests aus (Multi-Instance WS/HTTP/Node-Pairing). Verwendet standardmäßig `threads` + `isolate: false` mit adaptiven Workern in `vitest.e2e.config.ts`; feinjustiere mit `OPENCLAW_E2E_WORKERS=<n>` und setze `OPENCLAW_E2E_VERBOSE=1` für ausführliche Logs.
- `pnpm test:live`: Führt Live-Tests für Provider aus (minimax/zai). Erfordert API-Schlüssel und `LIVE=1` (oder provider-spezifisch `*_LIVE_TEST=1`), um das Überspringen aufzuheben.
- `pnpm test:docker:all`: Baut das gemeinsame Live-Test-Image und das Docker-E2E-Image einmal und führt dann die Docker-Smoke-Lanes mit `OPENCLAW_SKIP_DOCKER_BUILD=1` über einen gewichteten Scheduler aus. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` steuert die Prozess-Slots und hat standardmäßig den Wert 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` steuert den provider-sensitiven Tail-Pool und hat standardmäßig den Wert 10. Schwere Lane-Limits sind standardmäßig `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` und `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; Provider-Limits sind standardmäßig auf eine schwere Lane pro Provider gesetzt über `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` und `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Verwende `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` oder `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` für größere Hosts. Lane-Starts werden standardmäßig um 2 Sekunden gestaffelt, um lokale Docker-Daemon-Erstellungsstürme zu vermeiden; überschreibe dies mit `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Der Runner führt standardmäßig einen Docker-Preflight aus, bereinigt veraltete OpenClaw-E2E-Container, gibt alle 30 Sekunden den Status aktiver Lanes aus, teilt Provider-CLI-Tool-Caches zwischen kompatiblen Lanes, versucht transiente Live-Provider-Fehler standardmäßig einmal erneut (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) und speichert Lane-Zeiten in `.artifacts/docker-tests/lane-timings.json` für eine Reihenfolge nach längste zuerst bei späteren Läufen. Verwende `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, um das Lane-Manifest auszugeben, ohne Docker auszuführen, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>` zum Feinjustieren der Statusausgabe oder `OPENCLAW_DOCKER_ALL_TIMINGS=0`, um die Wiederverwendung von Zeitdaten zu deaktivieren. Verwende `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` für nur deterministische/lokale Lanes oder `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` für nur Live-Provider-Lanes; Paket-Aliase sind `pnpm test:docker:local:all` und `pnpm test:docker:live:all`. Der Modus nur live führt Main- und Tail-Live-Lanes zu einem einzigen Pool nach längste zuerst zusammen, sodass Provider-Buckets Claude-, Codex- und Gemini-Arbeit gemeinsam packen können. Der Runner plant nach dem ersten Fehler standardmäßig keine neuen gepoolten Lanes mehr ein, es sei denn, `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` ist gesetzt, und jede Lane hat ein Fallback-Timeout von 120 Minuten, das mit `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` überschrieben werden kann; ausgewählte Live-/Tail-Lanes verwenden engere Limits pro Lane. Docker-Setup-Befehle für CLI-Backends haben ein eigenes Timeout über `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (Standard 180). Logs pro Lane werden unter `.artifacts/docker-tests/<run-id>/` geschrieben.
- Live-Docker-Probes für CLI-Backends können als fokussierte Lanes ausgeführt werden, zum Beispiel `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` oder `pnpm test:docker:live-cli-backend:codex:mcp`. Claude und Gemini haben entsprechende `:resume`- und `:mcp`-Aliase.
- `pnpm test:docker:openwebui`: Startet Docker-basiertes OpenClaw + Open WebUI, meldet sich über Open WebUI an, prüft `/api/models` und führt dann einen echten proxied Chat über `/api/chat/completions` aus. Erfordert einen nutzbaren Live-Modellschlüssel (zum Beispiel OpenAI in `~/.profile`), zieht ein externes Open-WebUI-Image und ist nicht darauf ausgelegt, so CI-stabil wie die normalen Unit-/E2E-Suites zu sein.
- `pnpm test:docker:mcp-channels`: Startet einen vorinitialisierten Gateway-Container und einen zweiten Client-Container, der `openclaw mcp serve` startet, und überprüft dann geroutete Konversationsfindung, Transkript-Lesevorgänge, Anhangsmetadaten, das Verhalten der Live-Event-Queue, Outbound-Send-Routing sowie Claude-ähnliche Channel- und Berechtigungsbenachrichtigungen über die echte stdio-Bridge. Die Claude-Benachrichtigungs-Assertion liest die rohen stdio-MCP-Frames direkt, damit der Smoke-Test widerspiegelt, was die Bridge tatsächlich ausgibt.

## Lokales PR-Gate

Führe für lokale PR-Land-/Gate-Prüfungen Folgendes aus:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Wenn `pnpm test` auf einem stark belasteten Host flaky ist, führe es einmal erneut aus, bevor du es als Regression behandelst, und grenze es dann mit `pnpm test <path/to/test>` ein. Für Hosts mit knappen Speicherressourcen verwende:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Modell-Latenz-Benchmark (lokale Schlüssel)

Skript: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Verwendung:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Optionale Umgebungsvariablen: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Standard-Prompt: „Reply with a single word: ok. No punctuation or extra text.“

Letzter Lauf (2025-12-31, 20 Läufe):

- minimax Median 1279 ms (min. 1114, max. 2431)
- opus Median 2454 ms (min. 1224, max. 3170)

## CLI-Startup-Benchmark

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

Die Ausgabe enthält `sampleCount`, Durchschnitt, p50, p95, Min/Max, Verteilung von Exit-Code/Signal und Zusammenfassungen des maximalen RSS für jeden Befehl. Optionales `--cpu-prof-dir` / `--heap-prof-dir` schreibt V8-Profile pro Lauf, sodass Timing und Profilerfassung dasselbe Harness verwenden.

Konventionen für gespeicherte Ausgaben:

- `pnpm test:startup:bench:smoke` schreibt das gezielte Smoke-Artefakt nach `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` schreibt das Artefakt der vollständigen Suite nach `.artifacts/cli-startup-bench-all.json` mit `runs=5` und `warmup=1`
- `pnpm test:startup:bench:update` aktualisiert die eingecheckte Baseline-Fixture unter `test/fixtures/cli-startup-bench.json` mit `runs=5` und `warmup=1`

Eingecheckte Fixture:

- `test/fixtures/cli-startup-bench.json`
- Aktualisieren mit `pnpm test:startup:bench:update`
- Aktuelle Ergebnisse mit der Fixture vergleichen mit `pnpm test:startup:bench:check`

## Onboarding-E2E (Docker)

Docker ist optional; dies wird nur für containerisierte Onboarding-Smoke-Tests benötigt.

Vollständiger Cold-Start-Ablauf in einem sauberen Linux-Container:

```bash
scripts/e2e/onboard-docker.sh
```

Dieses Skript steuert den interaktiven Assistenten über ein Pseudo-TTY, überprüft Konfigurations-/Workspace-/Session-Dateien, startet dann das Gateway und führt `openclaw health` aus.

## QR-Import-Smoke (Docker)

Stellt sicher, dass der gepflegte QR-Runtime-Helper unter den unterstützten Docker-Node-Runtimes geladen wird (standardmäßig Node 24, kompatibel mit Node 22):

```bash
pnpm test:docker:qr
```

## Verwandt

- [Testing](/de/help/testing)
- [Testing live](/de/help/testing-live)
