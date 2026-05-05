---
read_when:
    - Tests ausführen oder beheben
summary: Wie Sie Tests lokal ausführen (vitest) und wann Sie Force-/Coverage-Modi verwenden
title: Tests
x-i18n:
    generated_at: "2026-05-05T01:48:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7e8421518d63cade24ce8c2a08fa10538b66d2332b1eb5744e47c6d5a5e84605
    source_path: reference/test.md
    workflow: 16
---

- Vollständiges Testkit (Test-Suites, Live-Tests, Docker): [Tests](/de/help/testing)
- Update- und Plugin-Paketvalidierung: [Updates und Plugins testen](/de/help/testing-updates-plugins)

- `pnpm test:force`: Beendet jeden verbliebenen Gateway-Prozess, der den standardmäßigen Control-Port belegt, und führt dann die vollständige Vitest-Suite mit einem isolierten Gateway-Port aus, damit Server-Tests nicht mit einer laufenden Instanz kollidieren. Verwenden Sie dies, wenn ein vorheriger Gateway-Lauf Port 18789 belegt zurückgelassen hat.
- `pnpm test:coverage`: Führt die Unit-Suite mit V8-Coverage aus (über `vitest.unit.config.ts`). Dies ist ein Unit-Coverage-Gate für geladene Dateien, keine All-File-Coverage für das gesamte Repository. Die Schwellenwerte sind 70 % für Zeilen/Funktionen/Statements und 55 % für Branches. Da `coverage.all` false ist, misst das Gate Dateien, die von der Unit-Coverage-Suite geladen werden, statt jede Split-Lane-Quelldatei als ungetestet zu behandeln.
- `pnpm test:coverage:changed`: Führt Unit-Coverage nur für Dateien aus, die seit `origin/main` geändert wurden.
- `pnpm test:changed`: günstiger intelligenter Changed-Testlauf. Er führt präzise Ziele aus direkten Teständerungen, benachbarten `*.test.ts`-Dateien, expliziten Source-Mappings und dem lokalen Importgraphen aus. Breite Konfigurations-/Paketänderungen werden übersprungen, sofern sie nicht präzisen Tests zugeordnet werden.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: expliziter breiter Changed-Testlauf. Verwenden Sie ihn, wenn eine Änderung an Test-Harness/Konfiguration/Paket auf das breitere Changed-Test-Verhalten von Vitest zurückfallen soll.
- `pnpm changed:lanes`: zeigt die vom Diff gegen `origin/main` ausgelösten Architektur-Lanes.
- `pnpm check:changed`: führt das intelligente Changed-Check-Gate für den Diff gegen `origin/main` aus. Es führt Typecheck-, Lint- und Guard-Befehle für die betroffenen Architektur-Lanes aus, aber keine Vitest-Tests. Verwenden Sie `pnpm test:changed` oder explizit `pnpm test <target>` als Testnachweis.
- `pnpm test`: leitet explizite Datei-/Verzeichnisziele durch bereichsbezogene Vitest-Lanes. Nicht zielgerichtete Läufe verwenden feste Shard-Gruppen und werden für lokale parallele Ausführung auf Leaf-Konfigurationen erweitert; die Extension-Gruppe wird immer auf die Shard-Konfigurationen pro Extension erweitert, statt als ein riesiger Root-Project-Prozess zu laufen.
- Test-Wrapper-Läufe enden mit einer kurzen Zusammenfassung `[test] passed|failed|skipped ... in ...`. Die eigene Dauerzeile von Vitest bleibt das Detail pro Shard.
- Gemeinsamer OpenClaw-Testzustand: Verwenden Sie `src/test-utils/openclaw-test-state.ts` aus Vitest, wenn ein Test ein isoliertes `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, eine Konfigurations-Fixture, einen Workspace, ein Agent-Verzeichnis oder einen Auth-Profile-Store benötigt.
- Prozess-E2E-Helfer: Verwenden Sie `test/helpers/openclaw-test-instance.ts`, wenn ein Vitest-Prozess-Level-E2E-Test einen laufenden Gateway, CLI-Env, Log-Erfassung und Cleanup an einer Stelle benötigt.
- Docker-/Bash-E2E-Helfer: Lanes, die `scripts/lib/docker-e2e-image.sh` sourcen, können `docker_e2e_test_state_shell_b64 <label> <scenario>` in den Container übergeben und es mit `scripts/lib/openclaw-e2e-instance.sh` dekodieren; Multi-Home-Skripte können `docker_e2e_test_state_function_b64` übergeben und in jedem Flow `openclaw_test_state_create <label> <scenario>` aufrufen. Low-Level-Aufrufer können `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` für ein Shell-Snippet im Container verwenden oder `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` für eine sourcebare Host-Env-Datei. Das `--` vor `create` verhindert, dass neuere Node-Runtimes `--env-file` als Node-Flag behandeln. Docker-/Bash-Lanes, die einen Gateway starten, können `scripts/lib/openclaw-e2e-instance.sh` im Container sourcen für Entrypoint-Auflösung, Mock-OpenAI-Start, Gateway-Start im Vordergrund/Hintergrund, Readiness-Probes, State-Env-Export, Log-Dumps und Prozess-Cleanup.
- Full-, Extension- und Include-Pattern-Shard-Läufe aktualisieren lokale Timing-Daten in `.artifacts/vitest-shard-timings.json`; spätere Whole-Config-Läufe verwenden diese Timings, um langsame und schnelle Shards auszugleichen. Include-Pattern-CI-Shards hängen den Shard-Namen an den Timing-Key an, wodurch gefilterte Shard-Timings sichtbar bleiben, ohne Whole-Config-Timing-Daten zu ersetzen. Setzen Sie `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, um das lokale Timing-Artefakt zu ignorieren.
- Ausgewählte `plugin-sdk`- und `commands`-Testdateien laufen jetzt durch dedizierte Light-Lanes, die nur `test/setup.ts` beibehalten, während runtime-schwere Fälle auf ihren bestehenden Lanes bleiben.
- Quelldateien mit benachbarten Tests werden zuerst diesem benachbarten Test zugeordnet, bevor auf breitere Verzeichnis-Globs zurückgefallen wird. Änderungen an Helfern unter `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` und `src/plugins/contracts` verwenden einen lokalen Importgraphen, um importierende Tests auszuführen, statt jeden Shard breit auszuführen, wenn der Abhängigkeitspfad präzise ist.
- `auto-reply` wird jetzt ebenfalls in drei dedizierte Konfigurationen (`core`, `top-level`, `reply`) aufgeteilt, damit der Reply-Harness die leichteren Top-Level-Status-/Token-/Helper-Tests nicht dominiert.
- Die Basis-Vitest-Konfiguration verwendet jetzt standardmäßig `pool: "threads"` und `isolate: false`, mit dem gemeinsamen nicht isolierten Runner über die Repository-Konfigurationen hinweg aktiviert.
- `pnpm test:channels` führt `vitest.channels.config.ts` aus.
- `pnpm test:extensions` und `pnpm test extensions` führen alle Extension-/Plugin-Shards aus. Schwere Channel-Plugins, das Browser-Plugin und OpenAI laufen als dedizierte Shards; andere Plugin-Gruppen bleiben gebündelt. Verwenden Sie `pnpm test extensions/<id>` für eine gebündelte Plugin-Lane.
- `pnpm test:perf:imports`: aktiviert Vitest-Berichte zu Importdauer und Importaufschlüsselung, während für explizite Datei-/Verzeichnisziele weiterhin bereichsbezogenes Lane-Routing verwendet wird.
- `pnpm test:perf:imports:changed`: dasselbe Import-Profiling, aber nur für Dateien, die seit `origin/main` geändert wurden.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` benchmarket den gerouteten Changed-Mode-Pfad gegen den nativen Root-Project-Lauf für denselben committeten Git-Diff.
- `pnpm test:perf:changed:bench -- --worktree` benchmarket das aktuelle Worktree-Changeset, ohne zuerst zu committen.
- `pnpm test:perf:profile:main`: schreibt ein CPU-Profil für den Vitest-Main-Thread (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: schreibt CPU- und Heap-Profile für den Unit-Runner (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: führt jede Full-Suite-Vitest-Leaf-Konfiguration seriell aus und schreibt gruppierte Dauer-Daten sowie JSON-/Log-Artefakte pro Konfiguration. Der Test Performance Agent verwendet dies als Baseline, bevor er versucht, langsame Tests zu beheben.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: vergleicht gruppierte Berichte nach einer performanceorientierten Änderung.
- Gateway-Integration: Opt-in über `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` oder `pnpm test:gateway`.
- `pnpm test:e2e`: Führt Gateway-End-to-End-Smoke-Tests aus (Multi-Instance-WS/HTTP/Node-Pairing). Standardmäßig `threads` + `isolate: false` mit adaptiven Workern in `vitest.e2e.config.ts`; passen Sie dies mit `OPENCLAW_E2E_WORKERS=<n>` an und setzen Sie `OPENCLAW_E2E_VERBOSE=1` für ausführliche Logs.
- `pnpm test:live`: Führt Provider-Live-Tests aus (minimax/zai). Erfordert API-Schlüssel und `LIVE=1` (oder Provider-spezifisch `*_LIVE_TEST=1`), um sie zu aktivieren.
- `pnpm test:docker:all`: Baut das gemeinsame Live-Test-Image, packt OpenClaw einmal als npm-Tarball, baut/verwendet ein Bare-Node-/Git-Runner-Image sowie ein funktionales Image, das diesen Tarball nach `/app` installiert, und führt dann Docker-Smoke-Lanes mit `OPENCLAW_SKIP_DOCKER_BUILD=1` über einen gewichteten Scheduler aus. Das Bare-Image (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) wird für Installer-/Update-/Plugin-Abhängigkeits-Lanes verwendet; diese Lanes mounten den vorab gebauten Tarball, statt kopierte Repository-Quellen zu verwenden. Das funktionale Image (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) wird für normale Built-App-Funktions-Lanes verwendet. `scripts/package-openclaw-for-docker.mjs` ist der einzige lokale/CI-Package-Packer und validiert den Tarball sowie `dist/postinstall-inventory.json`, bevor Docker ihn verwendet. Docker-Lane-Definitionen liegen in `scripts/lib/docker-e2e-scenarios.mjs`; die Planner-Logik liegt in `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` führt den ausgewählten Plan aus. `node scripts/test-docker-all.mjs --plan-json` gibt den schedulerverwalteten CI-Plan für ausgewählte Lanes, Image-Arten, Paket-/Live-Image-Bedarf, State-Szenarien und Credential-Prüfungen aus, ohne Docker zu bauen oder auszuführen. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` steuert Prozess-Slots und ist standardmäßig 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` steuert den Provider-sensitiven Tail-Pool und ist standardmäßig 10. Caps für schwere Lanes sind standardmäßig `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` und `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; Provider-Caps sind standardmäßig eine schwere Lane pro Provider über `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` und `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Verwenden Sie `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` oder `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` für größere Hosts. Wenn eine Lane auf einem Host mit geringer Parallelität das effektive Gewicht oder Resource-Cap überschreitet, kann sie dennoch aus einem leeren Pool starten und läuft allein, bis sie Kapazität freigibt. Lane-Starts werden standardmäßig um 2 Sekunden gestaffelt, um lokale Create-Stürme des Docker-Daemons zu vermeiden; überschreiben Sie dies mit `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Der Runner führt standardmäßig Docker-Preflights aus, bereinigt veraltete OpenClaw-E2E-Container, gibt alle 30 Sekunden Active-Lane-Status aus, teilt Provider-CLI-Tool-Caches zwischen kompatiblen Lanes, wiederholt transiente Live-Provider-Fehler standardmäßig einmal (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) und speichert Lane-Timings in `.artifacts/docker-tests/lane-timings.json` für Longest-First-Reihenfolge bei späteren Läufen. Verwenden Sie `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, um das Lane-Manifest auszugeben, ohne Docker auszuführen, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>`, um Statusausgaben anzupassen, oder `OPENCLAW_DOCKER_ALL_TIMINGS=0`, um Timing-Wiederverwendung zu deaktivieren. Verwenden Sie `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` nur für deterministische/lokale Lanes oder `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` nur für Live-Provider-Lanes; Paket-Aliase sind `pnpm test:docker:local:all` und `pnpm test:docker:live:all`. Der Live-Only-Modus führt Main- und Tail-Live-Lanes in einem Longest-First-Pool zusammen, damit Provider-Buckets Claude-, Codex- und Gemini-Arbeit gemeinsam packen können. Der Runner stoppt das Scheduling neuer gepoolter Lanes nach dem ersten Fehler, sofern `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` nicht gesetzt ist, und jede Lane hat einen 120-Minuten-Fallback-Timeout, der mit `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` überschrieben werden kann; ausgewählte Live-/Tail-Lanes verwenden engere Caps pro Lane. Docker-Setup-Befehle für das CLI-Backend haben ihren eigenen Timeout über `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (Standard 180). Logs pro Lane, `summary.json`, `failures.json` und Phase-Timings werden unter `.artifacts/docker-tests/<run-id>/` geschrieben; verwenden Sie `pnpm test:docker:timings <summary.json>`, um langsame Lanes zu untersuchen, und `pnpm test:docker:rerun <run-id|summary.json|failures.json>`, um günstige zielgerichtete Rerun-Befehle auszugeben.
- `pnpm test:docker:browser-cdp-snapshot`: Baut einen Chromium-gestützten Source-E2E-Container, startet rohes CDP plus einen isolierten Gateway, führt `browser doctor --deep` aus und verifiziert, dass CDP-Rollen-Snapshots Link-URLs, cursor-promoted Clickables, iframe-Refs und Frame-Metadaten enthalten.
- CLI-Backend-Live-Docker-Probes können als fokussierte Lanes ausgeführt werden, zum Beispiel `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` oder `pnpm test:docker:live-cli-backend:codex:mcp`. Claude und Gemini haben entsprechende Aliase `:resume` und `:mcp`.
- `pnpm test:docker:openwebui`: Startet dockerisiertes OpenClaw + Open WebUI, meldet sich über Open WebUI an, prüft `/api/models` und führt dann einen echten proxied Chat über `/api/chat/completions` aus. Erfordert einen verwendbaren Live-Modellschlüssel (zum Beispiel OpenAI in `~/.profile`), zieht ein externes Open WebUI-Image und ist nicht so CI-stabil zu erwarten wie die normalen Unit-/E2E-Suiten.
- `pnpm test:docker:mcp-channels`: Startet einen vorbefüllten Gateway-Container und einen zweiten Client-Container, der `openclaw mcp serve` spawnt, und verifiziert dann routed Conversation Discovery, Transcript-Lesevorgänge, Attachment-Metadaten, Live-Event-Queue-Verhalten, Outbound-Send-Routing sowie Channel- und Berechtigungsbenachrichtigungen im Claude-Stil über die echte stdio-Bridge. Die Claude-Benachrichtigungs-Assertion liest die rohen stdio-MCP-Frames direkt, damit der Smoke widerspiegelt, was die Bridge tatsächlich ausgibt.
- `pnpm test:docker:upgrade-survivor`: Installiert den gepackten OpenClaw-Tarball über einer veränderten Fixture für alte Benutzer, führt eine Paketaktualisierung sowie den nicht interaktiven Doctor ohne Live-Provider- oder Kanalschlüssel aus, startet anschließend ein Loopback-Gateway und prüft, ob Agenten, Kanalkonfiguration, Plugin-Allowlists, Arbeitsbereichs-/Sitzungsdateien, veralteter Zustand von Legacy-Plugin-Abhängigkeiten, Startvorgang und RPC-Status erhalten bleiben.
- `pnpm test:docker:published-upgrade-survivor`: Installiert standardmäßig `openclaw@latest`, initialisiert realistische Dateien bestehender Benutzer ohne Live-Provider- oder Kanalschlüssel, konfiguriert diese Ausgangsbasis mit einem eingebetteten `openclaw config set`-Befehlsrezept, aktualisiert diese veröffentlichte Installation auf den gepackten OpenClaw-Tarball, führt den nicht interaktiven Doctor aus, schreibt `.artifacts/upgrade-survivor/summary.json`, startet anschließend ein Loopback-Gateway und prüft, ob konfigurierte Intents, Arbeitsbereichs-/Sitzungsdateien, veraltete Plugin-Konfiguration und Legacy-Abhängigkeitszustand, Startvorgang, `/healthz`, `/readyz` und RPC-Status erhalten bleiben oder sauber repariert werden. Überschreiben Sie eine Ausgangsbasis mit `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, erweitern Sie eine exakte Matrix mit `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` wie `all-since-2026.4.23`, oder fügen Sie Szenario-Fixtures mit `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` hinzu; die Gruppe der gemeldeten Probleme enthält `configured-plugin-installs`, um zu verifizieren, dass konfigurierte externe OpenClaw-Plugins während des Upgrades automatisch installiert werden, sowie `stale-source-plugin-shadow`, um zu verhindern, dass reine Quell-Plugin-Schatten den Startvorgang beschädigen. Package Acceptance stellt diese als `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` und `published_upgrade_survivor_scenarios` bereit.
- `pnpm test:docker:update-migration`: Führt den Harness für veröffentlichte Upgrade-Überlebensprüfungen im bereinigungsintensiven Szenario `plugin-deps-cleanup` aus und startet standardmäßig bei `openclaw@2026.4.23`. Der separate Workflow `Update Migration` erweitert diese Lane mit `baselines=all-since-2026.4.23`, sodass jedes stabile veröffentlichte Paket ab `.23` auf den Kandidaten aktualisiert wird und die Bereinigung konfigurierter Plugin-Abhängigkeiten außerhalb der Full Release CI nachweist.
- `pnpm test:docker:plugins`: Führt Installations-/Aktualisierungs-Smoke-Tests für lokale Pfade, `file:`, npm-Registry-Pakete mit hoisted Abhängigkeiten, bewegliche Git-Refs, ClawHub-Fixtures, Marketplace-Updates sowie Aktivieren/Untersuchen des Claude-Bundles aus.

## Lokales PR-Gate

Für lokale PR-Land-/Gate-Prüfungen führen Sie aus:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Wenn `pnpm test` auf einem ausgelasteten Host fluktuiert, führen Sie es einmal erneut aus, bevor Sie es als Regression behandeln, und isolieren Sie es anschließend mit `pnpm test <path/to/test>`. Für Hosts mit begrenztem Arbeitsspeicher verwenden Sie:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Modelllatenz-Benchmark (lokale Schlüssel)

Skript: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Verwendung:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Optionale Umgebungsvariablen: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Standard-Prompt: „Antworten Sie mit einem einzelnen Wort: ok. Keine Satzzeichen oder zusätzlicher Text.“

Letzter Lauf (2025-12-31, 20 Läufe):

- minimax Median 1279 ms (Min. 1114, Max. 2431)
- opus Median 2454 ms (Min. 1224, Max. 3170)

## CLI-Start-Benchmark

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

Die Ausgabe enthält `sampleCount`, Durchschnitt, p50, p95, Min./Max., Exit-Code-/Signalverteilung und Max-RSS-Zusammenfassungen für jeden Befehl. Optional schreibt `--cpu-prof-dir` / `--heap-prof-dir` V8-Profile pro Lauf, sodass Timing und Profilerfassung denselben Harness verwenden.

Konventionen für gespeicherte Ausgaben:

- `pnpm test:startup:bench:smoke` schreibt das gezielte Smoke-Artefakt nach `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` schreibt das Full-Suite-Artefakt nach `.artifacts/cli-startup-bench-all.json` mit `runs=5` und `warmup=1`
- `pnpm test:startup:bench:update` aktualisiert das eingecheckte Baseline-Fixture unter `test/fixtures/cli-startup-bench.json` mit `runs=5` und `warmup=1`

Eingechecktes Fixture:

- `test/fixtures/cli-startup-bench.json`
- Aktualisieren mit `pnpm test:startup:bench:update`
- Aktuelle Ergebnisse mit `pnpm test:startup:bench:check` gegen das Fixture vergleichen

## Onboarding E2E (Docker)

Docker ist optional; dies wird nur für containerisierte Onboarding-Smoke-Tests benötigt.

Vollständiger Cold-Start-Flow in einem sauberen Linux-Container:

```bash
scripts/e2e/onboard-docker.sh
```

Dieses Skript steuert den interaktiven Wizard über ein Pseudo-TTY, verifiziert Konfigurations-/Workspace-/Sitzungsdateien, startet dann den Gateway und führt `openclaw health` aus.

## QR-Import-Smoke (Docker)

Stellt sicher, dass der gepflegte QR-Runtime-Helper unter den unterstützten Docker-Node-Runtimes geladen wird (Node 24 Standard, Node 22 kompatibel):

```bash
pnpm test:docker:qr
```

## Verwandte Themen

- [Testen](/de/help/testing)
- [Live testen](/de/help/testing-live)
- [Updates und Plugins testen](/de/help/testing-updates-plugins)
