---
read_when:
    - Tests ausführen oder korrigieren
summary: Wie Sie Tests lokal ausführen (Vitest) und wann Sie Force-/Coverage-Modi verwenden sollten
title: Tests
x-i18n:
    generated_at: "2026-04-24T09:00:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 26cdb5fe005e738ddd00b183e91ccebe08c709bd64eed377d573a37b76e3a3bf
    source_path: reference/test.md
    workflow: 15
---

- Vollständiges Test-Kit (Suites, Live, Docker): [Testing](/de/help/testing)

- `pnpm test:force`: Beendet alle verbliebenen Gateway-Prozesse, die den Standard-Control-Port belegen, und führt dann die vollständige Vitest-Suite mit einem isolierten Gateway-Port aus, damit Server-Tests nicht mit einer laufenden Instanz kollidieren. Verwenden Sie dies, wenn ein vorheriger Gateway-Lauf Port 18789 belegt hinterlassen hat.
- `pnpm test:coverage`: Führt die Unit-Suite mit V8-Coverage aus (über `vitest.unit.config.ts`). Dies ist eine Coverage-Prüfung für geladene Unit-Dateien, nicht eine repositoryweite All-File-Coverage. Die Schwellenwerte sind 70 % für Zeilen/Funktionen/Statements und 55 % für Branches. Da `coverage.all` auf `false` steht, misst die Prüfung Dateien, die von der Unit-Coverage-Suite geladen wurden, statt jede Quelldatei aus aufgeteilten Lanes als nicht abgedeckt zu behandeln.
- `pnpm test:coverage:changed`: Führt Unit-Coverage nur für Dateien aus, die sich seit `origin/main` geändert haben.
- `pnpm test:changed`: Erweitert geänderte Git-Pfade in abgegrenzte Vitest-Lanes, wenn der Diff nur routbare Quell-/Testdateien berührt. Änderungen an Konfiguration/Setup fallen weiterhin auf den nativen Root-Projects-Lauf zurück, sodass Verdrahtungsänderungen bei Bedarf breit erneut ausgeführt werden.
- `pnpm changed:lanes`: Zeigt die architektonischen Lanes, die durch den Diff gegen `origin/main` ausgelöst werden.
- `pnpm check:changed`: Führt die intelligente Changed-Prüfung für den Diff gegen `origin/main` aus. Es führt Core-Arbeit mit Core-Test-Lanes aus, Extension-Arbeit mit Extension-Test-Lanes, reine Test-Arbeit nur mit Test-Typecheck/Tests, erweitert Änderungen am öffentlichen Plugin-SDK oder an Plugin-Verträgen auf einen Extension-Validierungsdurchlauf und hält rein release-metadatenbezogene Versionsanhebungen bei gezielten Prüfungen für Version/Konfiguration/Root-Abhängigkeiten.
- `pnpm test`: Leitet explizite Datei-/Verzeichnisziele über abgegrenzte Vitest-Lanes. Läufe ohne Ziel verwenden feste Shard-Gruppen und erweitern auf Leaf-Konfigurationen für lokale parallele Ausführung; die Extension-Gruppe wird immer zu den Shard-Konfigurationen pro Extension erweitert statt zu einem riesigen Root-Project-Prozess.
- Vollständige Läufe und Extension-Shard-Läufe aktualisieren lokale Timing-Daten in `.artifacts/vitest-shard-timings.json`; spätere Läufe verwenden diese Timings, um langsame und schnelle Shards auszubalancieren. Setzen Sie `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, um das lokale Timing-Artefakt zu ignorieren.
- Ausgewählte Testdateien in `plugin-sdk` und `commands` werden jetzt über dedizierte leichte Lanes geleitet, die nur `test/setup.ts` beibehalten, während laufzeitintensive Fälle auf ihren bestehenden Lanes bleiben.
- Ausgewählte Helper-Quelldateien in `plugin-sdk` und `commands` ordnen `pnpm test:changed` ebenfalls expliziten benachbarten Tests in diesen leichten Lanes zu, sodass kleine Helper-Änderungen nicht die erneute Ausführung schwerer laufzeitgestützter Suites auslösen.
- `auto-reply` ist jetzt ebenfalls in drei dedizierte Konfigurationen aufgeteilt (`core`, `top-level`, `reply`), damit das Reply-Harness nicht die leichteren Top-Level-Tests für Status/Token/Helper dominiert.
- Die Basis-Vitest-Konfiguration verwendet jetzt standardmäßig `pool: "threads"` und `isolate: false`, wobei der gemeinsam genutzte nicht isolierte Runner in den Repo-Konfigurationen aktiviert ist.
- `pnpm test:channels` führt `vitest.channels.config.ts` aus.
- `pnpm test:extensions` und `pnpm test extensions` führen alle Extension-/Plugin-Shards aus. Schwere Channel-Plugins, das Browser-Plugin und OpenAI laufen als dedizierte Shards; andere Plugin-Gruppen bleiben gebündelt. Verwenden Sie `pnpm test extensions/<id>` für die Lane eines einzelnen gebündelten Plugins.
- `pnpm test:perf:imports`: Aktiviert Vitest-Berichte zu Importdauer und Importaufschlüsselung und verwendet weiterhin abgegrenztes Lane-Routing für explizite Datei-/Verzeichnisziele.
- `pnpm test:perf:imports:changed`: Dasselbe Import-Profiling, aber nur für Dateien, die sich seit `origin/main` geändert haben.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` benchmarkt den gerouteten Changed-Modus-Pfad gegen den nativen Root-Projects-Lauf für denselben eingecheckten Git-Diff.
- `pnpm test:perf:changed:bench -- --worktree` benchmarkt den aktuellen Worktree-Änderungssatz, ohne zuerst zu committen.
- `pnpm test:perf:profile:main`: Schreibt ein CPU-Profil für den Vitest-Hauptthread (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: Schreibt CPU- und Heap-Profile für den Unit-Runner (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: Führt jede Leaf-Konfiguration der vollständigen Vitest-Suite seriell aus und schreibt gruppierte Laufzeitdaten plus JSON-/Log-Artefakte pro Konfiguration. Der Test Performance Agent verwendet dies als Baseline, bevor er versucht, langsame Tests zu beheben.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: Vergleicht gruppierte Berichte nach einer leistungsorientierten Änderung.
- Gateway-Integration: per Opt-in mit `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` oder `pnpm test:gateway`.
- `pnpm test:e2e`: Führt Gateway-End-to-End-Smoke-Tests aus (Multi-Instance-WS/HTTP/Node-Pairing). Standardmäßig mit `threads` + `isolate: false` und adaptiven Workern in `vitest.e2e.config.ts`; abstimmbar mit `OPENCLAW_E2E_WORKERS=<n>`, und setzen Sie `OPENCLAW_E2E_VERBOSE=1` für ausführliche Logs.
- `pnpm test:live`: Führt Provider-Live-Tests aus (minimax/zai). Benötigt API-Keys und `LIVE=1` (oder provider-spezifisch `*_LIVE_TEST=1`), um das Überspringen aufzuheben.
- `pnpm test:docker:all`: Baut das gemeinsame Live-Test-Image und das Docker-E2E-Image einmal und führt dann die Docker-Smoke-Lanes mit `OPENCLAW_SKIP_DOCKER_BUILD=1` standardmäßig mit einer Nebenläufigkeit von 8 aus. Stimmen Sie den Haupt-Pool mit `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` und den provider-sensitiven Tail-Pool mit `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` ab; beide haben standardmäßig den Wert 8. Lane-Starts werden standardmäßig um 2 Sekunden versetzt, um lokale Docker-Daemon-Erstellungsstürme zu vermeiden; überschreiben Sie dies mit `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Der Runner plant nach dem ersten Fehler keine neuen gepoolten Lanes mehr ein, sofern nicht `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` gesetzt ist, und jede Lane hat ein Timeout von 120 Minuten, das mit `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` überschrieben werden kann. Logs pro Lane werden unter `.artifacts/docker-tests/<run-id>/` geschrieben.
- `pnpm test:docker:openwebui`: Startet Dockerisiertes OpenClaw + Open WebUI, meldet sich über Open WebUI an, prüft `/api/models` und führt dann einen echten proxied Chat über `/api/chat/completions` aus. Erfordert einen nutzbaren Live-Modell-Key (zum Beispiel OpenAI in `~/.profile`), zieht ein externes Open-WebUI-Image und ist nicht dafür gedacht, so CI-stabil zu sein wie die normalen Unit-/E2E-Suites.
- `pnpm test:docker:mcp-channels`: Startet einen vorbefüllten Gateway-Container und einen zweiten Client-Container, der `openclaw mcp serve` startet, und prüft dann die geroutete Conversation-Erkennung, Transcript-Lesevorgänge, Attachment-Metadaten, Verhalten der Live-Event-Queue, Outbound-Send-Routing sowie Channel- und Berechtigungsbenachrichtigungen im Claude-Stil über die echte stdio-Bridge. Die Claude-Benachrichtigungs-Assertion liest die rohen stdio-MCP-Frames direkt, sodass der Smoke das widerspiegelt, was die Bridge tatsächlich ausgibt.

## Lokale PR-Prüfung

Führen Sie für lokale PR-Land-/Gate-Prüfungen Folgendes aus:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Wenn `pnpm test` auf einem stark ausgelasteten Host flakey ist, führen Sie es einmal erneut aus, bevor Sie es als Regression behandeln, und isolieren Sie es dann mit `pnpm test <path/to/test>`. Verwenden Sie für Hosts mit wenig Speicher:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Modell-Latenz-Benchmark (lokale Keys)

Skript: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Verwendung:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Optionale env-Variablen: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Standard-Prompt: „Reply with a single word: ok. No punctuation or extra text.“

Letzter Lauf (2025-12-31, 20 Läufe):

- minimax median 1279ms (min 1114, max 2431)
- opus median 2454ms (min 1224, max 3170)

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

Vorgaben:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: beide Vorgaben

Die Ausgabe enthält `sampleCount`, avg, p50, p95, min/max, Verteilung von Exit-Code/Signal und Zusammenfassungen des maximalen RSS für jeden Befehl. Optionales `--cpu-prof-dir` / `--heap-prof-dir` schreibt V8-Profile pro Lauf, sodass Timing und Profilerfassung dasselbe Harness verwenden.

Konventionen für gespeicherte Ausgaben:

- `pnpm test:startup:bench:smoke` schreibt das gezielte Smoke-Artefakt nach `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` schreibt das Artefakt der vollständigen Suite nach `.artifacts/cli-startup-bench-all.json` mit `runs=5` und `warmup=1`
- `pnpm test:startup:bench:update` aktualisiert das eingecheckte Baseline-Fixture unter `test/fixtures/cli-startup-bench.json` mit `runs=5` und `warmup=1`

Eingechecktes Fixture:

- `test/fixtures/cli-startup-bench.json`
- Aktualisieren mit `pnpm test:startup:bench:update`
- Aktuelle Ergebnisse mit dem Fixture vergleichen mit `pnpm test:startup:bench:check`

## Onboarding-E2E (Docker)

Docker ist optional; dies wird nur für containerisierte Onboarding-Smoke-Tests benötigt.

Vollständiger Cold-Start-Flow in einem sauberen Linux-Container:

```bash
scripts/e2e/onboard-docker.sh
```

Dieses Skript steuert den interaktiven Wizard über ein Pseudo-TTY, prüft Konfigurations-/Workspace-/Session-Dateien, startet dann das Gateway und führt `openclaw health` aus.

## Smoke für QR-Import (Docker)

Stellt sicher, dass der gepflegte QR-Laufzeit-Helper unter den unterstützten Docker-Node-Laufzeiten geladen wird (Node 24 standardmäßig, Node 22 kompatibel):

```bash
pnpm test:docker:qr
```

## Verwandt

- [Testing](/de/help/testing)
- [Testing live](/de/help/testing-live)
