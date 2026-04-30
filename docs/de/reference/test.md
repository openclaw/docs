---
read_when:
    - Tests ausführen oder korrigieren
summary: So führen Sie Tests lokal aus (vitest) und wann Sie Erzwingungs- oder Testabdeckungsmodi verwenden
title: Tests
x-i18n:
    generated_at: "2026-04-30T18:38:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 131f2bad3b2806d28394213cec38d632d106ddbf8ff04d06345ab8046fb8bcf2
    source_path: reference/test.md
    workflow: 16
---

- Vollständiges Testkit (Suites, Live, Docker): [Testen](/de/help/testing)

- `pnpm test:force`: Beendet jeden verbleibenden Gateway-Prozess, der den standardmäßigen Control-Port belegt, und führt dann die vollständige Vitest-Suite mit einem isolierten Gateway-Port aus, damit Server-Tests nicht mit einer laufenden Instanz kollidieren. Verwenden Sie dies, wenn ein vorheriger Gateway-Lauf Port 18789 belegt gelassen hat.
- `pnpm test:coverage`: Führt die Unit-Suite mit V8-Coverage aus (über `vitest.unit.config.ts`). Dies ist ein Unit-Coverage-Gate für geladene Dateien, keine Whole-Repo-All-File-Coverage. Die Schwellenwerte liegen bei 70 % für Zeilen/Funktionen/Statements und 55 % für Branches. Da `coverage.all` false ist, misst das Gate Dateien, die von der Unit-Coverage-Suite geladen werden, anstatt jede Split-Lane-Quelldatei als nicht abgedeckt zu behandeln.
- `pnpm test:coverage:changed`: Führt Unit-Coverage nur für Dateien aus, die seit `origin/main` geändert wurden.
- `pnpm test:changed`: günstiger intelligenter Changed-Test-Lauf. Er führt präzise Ziele aus direkten Teständerungen, benachbarten `*.test.ts`-Dateien, expliziten Quellzuordnungen und dem lokalen Importgraphen aus. Breite/config/package-Änderungen werden übersprungen, sofern sie nicht auf präzise Tests abbilden.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: expliziter breiter Changed-Test-Lauf. Verwenden Sie dies, wenn eine Änderung an Test-Harness/config/package auf das breitere Changed-Test-Verhalten von Vitest zurückfallen soll.
- `pnpm changed:lanes`: zeigt die durch den Diff gegen `origin/main` ausgelösten Architektur-Lanes.
- `pnpm check:changed`: führt das intelligente Changed-Check-Gate für den Diff gegen `origin/main` aus. Es führt Typecheck-, Lint- und Guard-Befehle für die betroffenen Architektur-Lanes aus, führt aber keine Vitest-Tests aus. Verwenden Sie `pnpm test:changed` oder explizit `pnpm test <target>` als Testnachweis.
- `pnpm test`: routet explizite Datei-/Verzeichnisziele durch scoped Vitest-Lanes. Nicht zielgerichtete Läufe verwenden feste Shard-Gruppen und erweitern auf Leaf-Configs für lokale parallele Ausführung; die Extension-Gruppe wird immer zu den pro Extension definierten Shard-Configs erweitert, statt zu einem einzigen riesigen Root-Project-Prozess.
- Test-Wrapper-Läufe enden mit einer kurzen Zusammenfassung `[test] passed|failed|skipped ... in ...`. Die eigene Dauerzeile von Vitest bleibt das Detail pro Shard.
- Gemeinsamer OpenClaw-Testzustand: Verwenden Sie `src/test-utils/openclaw-test-state.ts` aus Vitest, wenn ein Test ein isoliertes `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, eine Config-Fixture, einen Workspace, ein Agent-Verzeichnis oder einen Auth-Profile-Store benötigt.
- Prozess-E2E-Helfer: Verwenden Sie `test/helpers/openclaw-test-instance.ts`, wenn ein Vitest-Prozess-Level-E2E-Test ein laufendes Gateway, CLI-Env, Log-Erfassung und Cleanup an einer Stelle benötigt.
- Docker-/Bash-E2E-Helfer: Lanes, die `scripts/lib/docker-e2e-image.sh` sourcen, können `docker_e2e_test_state_shell_b64 <label> <scenario>` in den Container übergeben und mit `scripts/lib/openclaw-e2e-instance.sh` dekodieren; Multi-Home-Skripte können `docker_e2e_test_state_function_b64` übergeben und in jedem Flow `openclaw_test_state_create <label> <scenario>` aufrufen. Low-Level-Aufrufer können `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` für ein In-Container-Shell-Snippet verwenden oder `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` für eine sourcebare Host-Env-Datei. Das `--` vor `create` verhindert, dass neuere Node-Runtimes `--env-file` als Node-Flag behandeln. Docker-/Bash-Lanes, die ein Gateway starten, können `scripts/lib/openclaw-e2e-instance.sh` im Container sourcen für Entrypoint-Auflösung, Mock-OpenAI-Start, Gateway-Vordergrund-/Hintergrundstart, Readiness-Probes, State-Env-Export, Log-Dumps und Prozess-Cleanup.
- Full-, Extension- und Include-Pattern-Shard-Läufe aktualisieren lokale Timing-Daten in `.artifacts/vitest-shard-timings.json`; spätere Whole-Config-Läufe verwenden diese Timings, um langsame und schnelle Shards auszubalancieren. Include-Pattern-CI-Shards hängen den Shard-Namen an den Timing-Schlüssel an, wodurch gefilterte Shard-Timings sichtbar bleiben, ohne Whole-Config-Timing-Daten zu ersetzen. Setzen Sie `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, um das lokale Timing-Artefakt zu ignorieren.
- Ausgewählte `plugin-sdk`- und `commands`-Testdateien routen jetzt durch dedizierte leichte Lanes, die nur `test/setup.ts` beibehalten, während runtime-lastige Fälle auf ihren bestehenden Lanes bleiben.
- Quelldateien mit benachbarten Tests werden zuerst auf diesen benachbarten Test abgebildet, bevor auf breitere Verzeichnis-Globs zurückgefallen wird. Helferänderungen unter `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` und `src/plugins/contracts` verwenden einen lokalen Importgraphen, um importierende Tests auszuführen, statt jeden Shard breit auszuführen, wenn der Dependency-Pfad präzise ist.
- `auto-reply` wird jetzt ebenfalls in drei dedizierte Configs (`core`, `top-level`, `reply`) aufgeteilt, damit das Reply-Harness die leichteren Top-Level-Status-/Token-/Helper-Tests nicht dominiert.
- Die Basis-Vitest-Config verwendet jetzt standardmäßig `pool: "threads"` und `isolate: false`, wobei der gemeinsame nicht isolierte Runner in allen Repo-Configs aktiviert ist.
- `pnpm test:channels` führt `vitest.channels.config.ts` aus.
- `pnpm test:extensions` und `pnpm test extensions` führen alle Extension-/Plugin-Shards aus. Schwere Channel-Plugins, das Browser-Plugin und OpenAI laufen als dedizierte Shards; andere Plugin-Gruppen bleiben gebündelt. Verwenden Sie `pnpm test extensions/<id>` für eine gebündelte Plugin-Lane.
- `pnpm test:perf:imports`: aktiviert Vitest-Berichte zu Importdauer und Importaufschlüsselung, während weiterhin scoped Lane-Routing für explizite Datei-/Verzeichnisziele verwendet wird.
- `pnpm test:perf:imports:changed`: gleiches Import-Profiling, aber nur für Dateien, die seit `origin/main` geändert wurden.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` benchmarked den gerouteten Changed-Mode-Pfad gegen den nativen Root-Project-Lauf für denselben committeten Git-Diff.
- `pnpm test:perf:changed:bench -- --worktree` benchmarked das aktuelle Worktree-Changeset, ohne zuerst zu committen.
- `pnpm test:perf:profile:main`: schreibt ein CPU-Profil für den Vitest-Main-Thread (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: schreibt CPU- und Heap-Profile für den Unit-Runner (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: führt jede Full-Suite-Vitest-Leaf-Config seriell aus und schreibt gruppierte Dauerdaten sowie JSON-/Log-Artefakte pro Config. Der Test Performance Agent verwendet dies als Baseline, bevor er Slow-Test-Fixes versucht.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: vergleicht gruppierte Berichte nach einer performanceorientierten Änderung.
- Gateway-Integration: Opt-in über `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` oder `pnpm test:gateway`.
- `pnpm test:e2e`: Führt Gateway-End-to-End-Smoke-Tests aus (Multi-Instance-WS/HTTP/Node-Pairing). Verwendet standardmäßig `threads` + `isolate: false` mit adaptiven Workern in `vitest.e2e.config.ts`; passen Sie dies mit `OPENCLAW_E2E_WORKERS=<n>` an und setzen Sie `OPENCLAW_E2E_VERBOSE=1` für ausführliche Logs.
- `pnpm test:live`: Führt Provider-Live-Tests aus (minimax/zai). Erfordert API-Schlüssel und `LIVE=1` (oder Provider-spezifisch `*_LIVE_TEST=1`), um sie nicht zu überspringen.
- `pnpm test:docker:all`: Baut das gemeinsame Live-Test-Image, packt OpenClaw einmal als npm-Tarball, baut/verwendet ein Bare-Node-/Git-Runner-Image plus ein funktionales Image, das diesen Tarball in `/app` installiert, und führt dann Docker-Smoke-Lanes mit `OPENCLAW_SKIP_DOCKER_BUILD=1` über einen gewichteten Scheduler aus. Das Bare-Image (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) wird für Installer-/Update-/Plugin-Dependency-Lanes verwendet; diese Lanes mounten den vorgebauten Tarball, statt kopierte Repo-Quellen zu verwenden. Das funktionale Image (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) wird für normale Built-App-Funktionalitäts-Lanes verwendet. `scripts/package-openclaw-for-docker.mjs` ist der einzige lokale/CI-Package-Packer und validiert den Tarball sowie `dist/postinstall-inventory.json`, bevor Docker ihn verwendet. Docker-Lane-Definitionen befinden sich in `scripts/lib/docker-e2e-scenarios.mjs`; die Planner-Logik befindet sich in `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` führt den ausgewählten Plan aus. `node scripts/test-docker-all.mjs --plan-json` gibt den Scheduler-eigenen CI-Plan für ausgewählte Lanes, Image-Arten, Package-/Live-Image-Anforderungen, State-Szenarien und Credential-Prüfungen aus, ohne Docker zu bauen oder auszuführen. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` steuert Prozess-Slots und ist standardmäßig 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` steuert den Provider-sensitiven Tail-Pool und ist standardmäßig 10. Die Caps für schwere Lanes sind standardmäßig `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` und `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; Provider-Caps sind standardmäßig eine schwere Lane pro Provider über `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` und `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Verwenden Sie `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` oder `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` für größere Hosts. Wenn eine Lane auf einem Host mit niedriger Parallelität das effektive Gewicht oder Resource-Cap überschreitet, kann sie dennoch aus einem leeren Pool starten und läuft allein, bis sie Kapazität freigibt. Lane-Starts werden standardmäßig um 2 Sekunden versetzt, um lokale Docker-Daemon-Create-Stürme zu vermeiden; überschreiben Sie dies mit `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Der Runner führt standardmäßig Docker-Preflights aus, bereinigt veraltete OpenClaw-E2E-Container, gibt alle 30 Sekunden Active-Lane-Status aus, teilt Provider-CLI-Tool-Caches zwischen kompatiblen Lanes, wiederholt transiente Live-Provider-Fehler standardmäßig einmal (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) und speichert Lane-Timings in `.artifacts/docker-tests/lane-timings.json` für Longest-First-Sortierung bei späteren Läufen. Verwenden Sie `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, um das Lane-Manifest ohne Docker-Lauf auszugeben, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>`, um die Statusausgabe anzupassen, oder `OPENCLAW_DOCKER_ALL_TIMINGS=0`, um Timing-Wiederverwendung zu deaktivieren. Verwenden Sie `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` nur für deterministische/lokale Lanes oder `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` nur für Live-Provider-Lanes; Package-Aliasse sind `pnpm test:docker:local:all` und `pnpm test:docker:live:all`. Der Live-Only-Modus führt Main- und Tail-Live-Lanes zu einem Longest-First-Pool zusammen, damit Provider-Buckets Claude-, Codex- und Gemini-Arbeit gemeinsam packen können. Der Runner plant nach dem ersten Fehler keine neuen gepoolten Lanes mehr ein, sofern `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` nicht gesetzt ist, und jede Lane hat ein 120-Minuten-Fallback-Timeout, das mit `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` überschrieben werden kann; ausgewählte Live-/Tail-Lanes verwenden engere Caps pro Lane. CLI-Backend-Docker-Setup-Befehle haben ein eigenes Timeout über `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (Standard 180). Logs pro Lane, `summary.json`, `failures.json` und Phase-Timings werden unter `.artifacts/docker-tests/<run-id>/` geschrieben; verwenden Sie `pnpm test:docker:timings <summary.json>`, um langsame Lanes zu untersuchen, und `pnpm test:docker:rerun <run-id|summary.json|failures.json>`, um günstige zielgerichtete Rerun-Befehle auszugeben.
- `pnpm test:docker:browser-cdp-snapshot`: Baut einen Chromium-gestützten Source-E2E-Container, startet raw CDP plus ein isoliertes Gateway, führt `browser doctor --deep` aus und verifiziert, dass CDP-Rollen-Snapshots Link-URLs, cursor-promoted Clickables, iframe-Refs und Frame-Metadaten enthalten.
- CLI-Backend-Live-Docker-Probes können als fokussierte Lanes ausgeführt werden, zum Beispiel `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` oder `pnpm test:docker:live-cli-backend:codex:mcp`. Claude und Gemini haben entsprechende `:resume`- und `:mcp`-Aliasse.
- `pnpm test:docker:openwebui`: Startet Dockerized OpenClaw + Open WebUI, meldet sich über Open WebUI an, prüft `/api/models` und führt dann einen echten proxied Chat über `/api/chat/completions` aus. Erfordert einen nutzbaren Live-Modellschlüssel (zum Beispiel OpenAI in `~/.profile`), zieht ein externes Open WebUI-Image und wird nicht als CI-stabil wie die normalen Unit-/E2E-Suites erwartet.
- `pnpm test:docker:mcp-channels`: Startet einen geseedeten Gateway-Container und einen zweiten Client-Container, der `openclaw mcp serve` startet, und verifiziert dann geroutete Conversation-Discovery, Transcript-Reads, Attachment-Metadaten, Live-Event-Queue-Verhalten, Outbound-Send-Routing sowie Claude-artige Channel- und Berechtigungsbenachrichtigungen über die echte stdio-Bridge. Die Claude-Benachrichtigungs-Assertion liest die rohen stdio-MCP-Frames direkt, damit der Smoke widerspiegelt, was die Bridge tatsächlich ausgibt.
- `pnpm test:docker:upgrade-survivor`: Installiert den gepackten OpenClaw-Tarball über ein unsauberes Fixture für alte Benutzer, führt ein Paket-Update plus nicht interaktiven Doctor ohne Live-Provider- oder Kanal-Keys aus, startet anschließend einen Loopback-Gateway und prüft, ob Agenten, Kanalkonfiguration, Plugin-Allowlists, Workspace-/Sitzungsdateien, veralteter Plugin-`runtime-deps`-Status, Start und RPC-Status erhalten bleiben.

## Lokales PR-Gate

Führen Sie für lokale PR-Lande-/Gate-Prüfungen aus:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Wenn `pnpm test` auf einem ausgelasteten Host flackert, führen Sie es einmal erneut aus, bevor Sie es als Regression behandeln, und isolieren Sie es dann mit `pnpm test <path/to/test>`. Verwenden Sie für Hosts mit begrenztem Arbeitsspeicher:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark für Modelllatenz (lokale Schlüssel)

Skript: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Verwendung:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Optionale Umgebung: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Standard-Prompt: „Antworte mit einem einzelnen Wort: ok. Keine Satzzeichen oder zusätzlicher Text.“

Letzte Ausführung (2025-12-31, 20 Läufe):

- minimax Median 1279 ms (min. 1114, max. 2431)
- opus Median 2454 ms (min. 1224, max. 3170)

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
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case tasksJson --case tasksListJson --case tasksAuditJson --runs 3`
- `pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all`
- `pnpm tsx scripts/bench-cli-startup.ts --preset all --output .artifacts/cli-startup-bench-all.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --case gatewayStatusJson --output .artifacts/cli-startup-bench-smoke.json`
- `pnpm tsx scripts/bench-cli-startup.ts --preset real --cpu-prof-dir .artifacts/cli-cpu`
- `pnpm tsx scripts/bench-cli-startup.ts --json`

Voreinstellungen:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `tasks --json`, `tasks list --json`, `tasks audit --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: beide Voreinstellungen

Die Ausgabe enthält `sampleCount`, Durchschnitt, p50, p95, Minimum/Maximum, Verteilung von Exit-Code/Signal und maximale RSS-Zusammenfassungen für jeden Befehl. Optional schreibt `--cpu-prof-dir` / `--heap-prof-dir` V8-Profile pro Lauf, sodass Timing und Profilerfassung denselben Harness verwenden.

Konventionen für gespeicherte Ausgaben:

- `pnpm test:startup:bench:smoke` schreibt das gezielte Smoke-Artefakt nach `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` schreibt das Artefakt der vollständigen Suite nach `.artifacts/cli-startup-bench-all.json` mit `runs=5` und `warmup=1`
- `pnpm test:startup:bench:update` aktualisiert die eingecheckte Baseline-Fixture unter `test/fixtures/cli-startup-bench.json` mit `runs=5` und `warmup=1`

Eingecheckte Fixture:

- `test/fixtures/cli-startup-bench.json`
- Aktualisieren mit `pnpm test:startup:bench:update`
- Aktuelle Ergebnisse mit `pnpm test:startup:bench:check` gegen die Fixture vergleichen

## Onboarding-E2E (Docker)

Docker ist optional; dies wird nur für containerisierte Onboarding-Smoke-Tests benötigt.

Vollständiger Kaltstart-Ablauf in einem sauberen Linux-Container:

```bash
scripts/e2e/onboard-docker.sh
```

Dieses Skript steuert den interaktiven Assistenten über ein Pseudo-TTY, verifiziert Konfigurations-/Workspace-/Sitzungsdateien, startet anschließend den Gateway und führt `openclaw health` aus.

## QR-Import-Smoke (Docker)

Stellt sicher, dass der gepflegte QR-Laufzeit-Helper unter den unterstützten Docker-Node-Laufzeiten geladen wird (Node 24 Standard, Node 22 kompatibel):

```bash
pnpm test:docker:qr
```

## Zugehörig

- [Testen](/de/help/testing)
- [Live testen](/de/help/testing-live)
