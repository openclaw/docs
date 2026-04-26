---
read_when:
    - Tests ausführen oder beheben
summary: Wie Tests lokal ausgeführt werden (Vitest) und wann Force-/Coverage-Modi verwendet werden sollten
title: Tests
x-i18n:
    generated_at: "2026-04-26T11:39:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 24eb2d122c806237bd4b90dffbd293479763c11a42cfcd195e1aed59efc71a5b
    source_path: reference/test.md
    workflow: 15
---

- Vollständiges Testing-Kit (Suites, Live, Docker): [Testing](/de/help/testing)

- `pnpm test:force`: Beendet alle hängen gebliebenen Gateway-Prozesse, die den Standard-Control-Port halten, und führt dann die vollständige Vitest-Suite mit einem isolierten Gateway-Port aus, damit Server-Tests nicht mit einer laufenden Instanz kollidieren. Verwenden Sie dies, wenn ein vorheriger Gateway-Lauf Port 18789 belegt hinterlassen hat.
- `pnpm test:coverage`: Führt die Unit-Suite mit V8-Coverage aus (über `vitest.unit.config.ts`). Dies ist ein Coverage-Gate für geladene Unit-Dateien, keine all-file-Coverage für das gesamte Repo. Die Schwellwerte sind 70 % für Zeilen/Funktionen/Statements und 55 % für Branches. Da `coverage.all` false ist, misst das Gate Dateien, die von der Unit-Coverage-Suite geladen werden, statt jede Source-Datei gesplitteter Lanes als nicht abgedeckt zu behandeln.
- `pnpm test:coverage:changed`: Führt Unit-Coverage nur für Dateien aus, die sich seit `origin/main` geändert haben.
- `pnpm test:changed`: erweitert geänderte Git-Pfade in bereichsbezogene Vitest-Lanes, wenn der Diff nur routbare Source-/Testdateien betrifft. Änderungen an Konfiguration/Setup fallen weiterhin auf den nativen Root-Projekt-Lauf zurück, damit Wiring-Änderungen bei Bedarf umfassend neu ausgeführt werden.
- `pnpm test:changed:focused`: Inner-Loop-Testlauf für geänderte Dateien. Führt nur präzise Ziele aus direkten Testbearbeitungen, benachbarten Dateien `*.test.ts`, expliziten Source-Zuordnungen und dem lokalen Import-Graphen aus. Breite Änderungen an Konfiguration/Paketen werden übersprungen, statt zum vollständigen Fallback für geänderte Tests zu expandieren.
- `pnpm changed:lanes`: zeigt die architektonischen Lanes, die durch den Diff gegenüber `origin/main` ausgelöst werden.
- `pnpm check:changed`: führt das intelligente Changed-Gate für den Diff gegenüber `origin/main` aus. Es führt Core-Arbeit mit Core-Test-Lanes aus, Extension-Arbeit mit Extension-Test-Lanes, reine Testarbeit nur mit Test-Typecheck/Tests, erweitert Änderungen am öffentlichen Plugin SDK oder Plugin-Verträgen auf einen Validierungsdurchlauf für Extensions und hält Versions-Bumps nur in Release-Metadaten bei gezielten Prüfungen auf Version/Konfiguration/Root-Abhängigkeiten.
- `pnpm test`: leitet explizite Datei-/Verzeichnisziele durch bereichsbezogene Vitest-Lanes. Läufe ohne Ziel verwenden feste Shard-Gruppen und expandieren zu Leaf-Konfigurationen für lokale parallele Ausführung; die Extension-Gruppe expandiert immer zu den Shard-Konfigurationen pro Extension statt zu einem riesigen Root-Prozess.
- Vollständige, Extension- und Include-Pattern-Shard-Läufe aktualisieren lokale Zeitdaten in `.artifacts/vitest-shard-timings.json`; spätere Ganzkonfigurationsläufe verwenden diese Zeiten, um langsame und schnelle Shards auszubalancieren. Include-Pattern-CI-Shards hängen den Shard-Namen an den Timing-Schlüssel an, wodurch Zeiten gefilterter Shards sichtbar bleiben, ohne Timing-Daten der Ganzkonfiguration zu ersetzen. Setzen Sie `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, um das lokale Timing-Artefakt zu ignorieren.
- Ausgewählte Testdateien in `plugin-sdk` und `commands` werden jetzt über dedizierte leichte Lanes geroutet, die nur `test/setup.ts` beibehalten, während laufzeitintensive Fälle auf ihren bestehenden Lanes bleiben.
- Source-Dateien mit benachbarten Tests werden zuerst auf diesen Nachbarn gemappt, bevor auf breitere Verzeichnis-Globs zurückgefallen wird. Änderungen an Helpern unter `test/helpers/channels` und `test/helpers/plugins` verwenden einen lokalen Import-Graphen, um importierende Tests auszuführen, statt alle Shards breit neu zu starten, wenn der Abhängigkeitspfad präzise ist.
- `auto-reply` ist jetzt ebenfalls in drei dedizierte Konfigurationen aufgeteilt (`core`, `top-level`, `reply`), sodass das Reply-Harness die leichteren Top-Level-Tests für Status/Token/Helper nicht dominiert.
- Die Basis-Vitest-Konfiguration verwendet jetzt standardmäßig `pool: "threads"` und `isolate: false`, wobei der gemeinsame nicht isolierte Runner über die Konfigurationen des Repos hinweg aktiviert ist.
- `pnpm test:channels` führt `vitest.channels.config.ts` aus.
- `pnpm test:extensions` und `pnpm test extensions` führen alle Extension-/Plugin-Shards aus. Schwere Kanal-Plugins, das Browser-Plugin und OpenAI laufen als dedizierte Shards; andere Plugin-Gruppen bleiben gebündelt. Verwenden Sie `pnpm test extensions/<id>` für eine Lane eines einzelnen gebündelten Plugins.
- `pnpm test:perf:imports`: aktiviert Vitest-Berichte zu Importdauer + Importaufschlüsselung und verwendet weiterhin bereichsbezogenes Lane-Routing für explizite Datei-/Verzeichnisziele.
- `pnpm test:perf:imports:changed`: dasselbe Import-Profiling, aber nur für Dateien, die sich seit `origin/main` geändert haben.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` benchmarkt den gerouteten Changed-Mode-Pfad gegen den nativen Root-Projekt-Lauf für denselben committeten Git-Diff.
- `pnpm test:perf:changed:bench -- --worktree` benchmarkt die aktuelle Änderungssatz des Worktree, ohne ihn zuerst zu committen.
- `pnpm test:perf:profile:main`: schreibt ein CPU-Profil für den Vitest-Haupt-Thread (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: schreibt CPU- + Heap-Profile für den Unit-Runner (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: führt jede Leaf-Konfiguration von Vitest für die vollständige Suite seriell aus und schreibt gruppierte Laufzeitdaten plus JSON-/Log-Artefakte pro Konfiguration. Der Test-Performance-Agent verwendet dies als Baseline, bevor er versucht, langsame Tests zu beheben.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: vergleicht gruppierte Berichte nach einer leistungsorientierten Änderung.
- Gateway-Integration: Opt-in über `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` oder `pnpm test:gateway`.
- `pnpm test:e2e`: Führt Gateway-End-to-End-Smoke-Tests aus (Multi-Instance-WS/HTTP/Node-Pairing). Standardmäßig mit `threads` + `isolate: false` und adaptiven Workern in `vitest.e2e.config.ts`; feinjustieren mit `OPENCLAW_E2E_WORKERS=<n>` und `OPENCLAW_E2E_VERBOSE=1` für ausführliche Logs.
- `pnpm test:live`: Führt Live-Tests für Anbieter aus (minimax/zai). Erfordert API-Schlüssel und `LIVE=1` (oder anbieterspezifisch `*_LIVE_TEST=1`), um das Überspringen aufzuheben.
- `pnpm test:docker:all`: Baut das gemeinsame Live-Test-Image und das Docker-E2E-Image einmal und führt dann die Docker-Smoke-Lanes mit `OPENCLAW_SKIP_DOCKER_BUILD=1` über einen gewichteten Scheduler aus. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` steuert Prozess-Slots und ist standardmäßig 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` steuert den provider-sensitiven Tail-Pool und ist standardmäßig 10. Begrenzungen für schwere Lanes sind standardmäßig `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` und `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; Provider-Limits sind standardmäßig auf eine schwere Lane pro Provider gesetzt über `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` und `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Verwenden Sie `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` oder `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` für größere Hosts. Starts von Lanes werden standardmäßig um 2 Sekunden gestaffelt, um lokale Create-Stürme des Docker-Daemons zu vermeiden; überschreiben Sie dies mit `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Der Runner prüft Docker standardmäßig vorab, bereinigt veraltete OpenClaw-E2E-Container, gibt alle 30 Sekunden aktiven Lane-Status aus, teilt CLI-Tool-Caches von Providern zwischen kompatiblen Lanes, wiederholt vorübergehende Fehler von Live-Providern standardmäßig einmal (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) und speichert Lane-Zeiten in `.artifacts/docker-tests/lane-timings.json` für longest-first-Reihenfolge bei späteren Läufen. Verwenden Sie `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, um das Lane-Manifest auszugeben, ohne Docker auszuführen, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>`, um die Statusausgabe anzupassen, oder `OPENCLAW_DOCKER_ALL_TIMINGS=0`, um die Wiederverwendung von Timings zu deaktivieren. Verwenden Sie `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` für nur deterministische/lokale Lanes oder `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` für nur Live-Provider-Lanes; Paket-Aliasse sind `pnpm test:docker:local:all` und `pnpm test:docker:live:all`. Der Modus nur Live führt Main- und Tail-Live-Lanes in einem gemeinsamen longest-first-Pool zusammen, sodass Provider-Buckets Claude-, Codex- und Gemini-Arbeit gemeinsam packen können. Der Runner plant nach dem ersten Fehler standardmäßig keine neuen gepoolten Lanes mehr, außer `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` ist gesetzt, und jede Lane hat ein Fallback-Timeout von 120 Minuten, überschreibbar mit `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`; ausgewählte Live-/Tail-Lanes verwenden engere Limits pro Lane. Docker-Setup-Befehle für CLI-Backends haben ein eigenes Timeout über `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (Standard 180). Logs pro Lane werden unter `.artifacts/docker-tests/<run-id>/` geschrieben.
- `pnpm test:docker:browser-cdp-snapshot`: Baut einen Chromium-basierten Source-E2E-Container, startet rohes CDP plus ein isoliertes Gateway, führt `browser doctor --deep` aus und verifiziert, dass CDP-Rollensnapshots Link-URLs, cursor-promotete klickbare Elemente, iframe-Refs und Frame-Metadaten enthalten.
- Live-Docker-Sonden für CLI-Backends können als fokussierte Lanes ausgeführt werden, zum Beispiel `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` oder `pnpm test:docker:live-cli-backend:codex:mcp`. Claude und Gemini haben entsprechende Aliasse `:resume` und `:mcp`.
- `pnpm test:docker:openwebui`: Startet Dockerisiertes OpenClaw + Open WebUI, meldet sich über Open WebUI an, prüft `/api/models` und führt dann einen echten proxied Chat über `/api/chat/completions` aus. Erfordert einen verwendbaren Live-Modellschlüssel (zum Beispiel OpenAI in `~/.profile`), zieht ein externes Open-WebUI-Image und soll nicht so CI-stabil sein wie normale Unit-/E2E-Suites.
- `pnpm test:docker:mcp-channels`: Startet einen initialisierten Gateway-Container und einen zweiten Client-Container, der `openclaw mcp serve` startet, und verifiziert dann geroutete Konversations-Discovery, Lesen von Transkripten, Anhangsmetadaten, Verhalten der Live-Event-Queue, Routing ausgehender Sendungen und Claude-artige Kanal- + Berechtigungsbenachrichtigungen über die echte stdio-Bridge. Die Claude-Benachrichtigungsprüfung liest die rohen stdio-MCP-Frames direkt, sodass der Smoke-Test widerspiegelt, was die Bridge tatsächlich ausgibt.

## Lokales PR-Gate

Für lokale PR-Land-/Gate-Prüfungen führen Sie Folgendes aus:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Wenn `pnpm test` auf einem stark ausgelasteten Host flaky ist, führen Sie es einmal erneut aus, bevor Sie es als Regression behandeln, und isolieren Sie dann mit `pnpm test <path/to/test>`. Für Hosts mit wenig Speicher verwenden Sie:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark für Modelllatenz (lokale Schlüssel)

Skript: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Verwendung:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Optionale Umgebungsvariablen: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
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

Die Ausgabe enthält `sampleCount`, Durchschnitt, p50, p95, Min/Max, Verteilung von Exit-Code/Signal und Zusammenfassungen zu max RSS für jeden Befehl. Optionale `--cpu-prof-dir` / `--heap-prof-dir` schreiben V8-Profile pro Lauf, sodass Timing und Profilerfassung denselben Harness verwenden.

Konventionen für gespeicherte Ausgaben:

- `pnpm test:startup:bench:smoke` schreibt das gezielte Smoke-Artefakt nach `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` schreibt das Artefakt der vollständigen Suite nach `.artifacts/cli-startup-bench-all.json` mit `runs=5` und `warmup=1`
- `pnpm test:startup:bench:update` aktualisiert die eingecheckte Baseline-Fixture unter `test/fixtures/cli-startup-bench.json` mit `runs=5` und `warmup=1`

Eingecheckte Fixture:

- `test/fixtures/cli-startup-bench.json`
- Aktualisieren mit `pnpm test:startup:bench:update`
- Aktuelle Ergebnisse mit der Fixture vergleichen mit `pnpm test:startup:bench:check`

## Onboarding-E2E (Docker)

Docker ist optional; dies wird nur für containerisierte Smoke-Tests des Onboardings benötigt.

Vollständiger Cold-Start-Ablauf in einem sauberen Linux-Container:

```bash
scripts/e2e/onboard-docker.sh
```

Dieses Skript steuert den interaktiven Assistenten über ein Pseudo-TTY, prüft Konfigurations-/Workspace-/Sitzungsdateien und startet dann das Gateway und führt `openclaw health` aus.

## QR-Import-Smoke (Docker)

Stellt sicher, dass der gepflegte Laufzeit-Helper für QR unter den unterstützten Docker-Node-Laufzeiten geladen wird (standardmäßig Node 24, kompatibel mit Node 22):

```bash
pnpm test:docker:qr
```

## Verwandt

- [Testing](/de/help/testing)
- [Testing live](/de/help/testing-live)
