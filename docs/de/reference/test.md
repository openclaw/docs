---
read_when:
    - Tests ausführen oder beheben
summary: So führen Sie Tests lokal aus (vitest) und wann Sie Force-/Coverage-Modi verwenden
title: Tests
x-i18n:
    generated_at: "2026-05-05T06:18:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: cc31ab27a63607ec5134306a0129bd164e4235f26631da4f691f657adda70eed
    source_path: reference/test.md
    workflow: 16
---

- Vollständiges Testkit (Suites, Live, Docker): [Tests](/de/help/testing)
- Update- und Plugin-Paketvalidierung: [Updates und Plugins testen](/de/help/testing-updates-plugins)

- `pnpm test:force`: Beendet alle verbleibenden Gateway-Prozesse, die den standardmäßigen Control-Port belegen, und führt anschließend die vollständige Vitest-Suite mit einem isolierten Gateway-Port aus, damit Server-Tests nicht mit einer laufenden Instanz kollidieren. Verwenden Sie dies, wenn ein vorheriger Gateway-Lauf Port 18789 belegt zurückgelassen hat.
- `pnpm test:coverage`: Führt die Unit-Suite mit V8-Coverage aus (über `vitest.unit.config.ts`). Dies ist ein Coverage-Gate für geladene Unit-Dateien, keine Whole-Repo-All-File-Coverage. Die Schwellenwerte liegen bei 70 % für Zeilen/Funktionen/Statements und 55 % für Branches. Da `coverage.all` false ist, misst das Gate Dateien, die von der Unit-Coverage-Suite geladen wurden, statt jede Split-Lane-Quelldatei als nicht abgedeckt zu behandeln.
- `pnpm test:coverage:changed`: Führt Unit-Coverage nur für Dateien aus, die seit `origin/main` geändert wurden.
- `pnpm test:changed`: günstiger smarter Changed-Testlauf. Er führt präzise Targets aus direkten Test-Änderungen, benachbarten `*.test.ts`-Dateien, expliziten Source-Mappings und dem lokalen Importgraphen aus. Breite Config-/Package-Änderungen werden übersprungen, sofern sie nicht auf präzise Tests abbilden.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: expliziter breiter Changed-Testlauf. Verwenden Sie dies, wenn eine Änderung an Test-Harness/Config/Package auf Vitests breiteres Changed-Test-Verhalten zurückfallen soll.
- `pnpm changed:lanes`: zeigt die Architektur-Lanes, die durch den Diff gegen `origin/main` ausgelöst werden.
- `pnpm check:changed`: führt das smarte Changed-Check-Gate für den Diff gegen `origin/main` aus. Es führt Typecheck-, Lint- und Guard-Befehle für die betroffenen Architektur-Lanes aus, führt aber keine Vitest-Tests aus. Verwenden Sie `pnpm test:changed` oder explizit `pnpm test <target>` als Testnachweis.
- `pnpm test`: leitet explizite Datei-/Verzeichnis-Targets durch scoped Vitest-Lanes. Läufe ohne Target verwenden feste Shard-Gruppen und expandieren für lokale parallele Ausführung zu Leaf-Configs; die Erweiterungsgruppe expandiert immer zu den pro-Erweiterung-Shard-Configs statt zu einem einzigen riesigen Root-Project-Prozess.
- Test-Wrapper-Läufe enden mit einer kurzen `[test] passed|failed|skipped ... in ...`-Zusammenfassung. Vitests eigene Dauerzeile bleibt das Detail pro Shard.
- Gemeinsamer OpenClaw-Testzustand: Verwenden Sie `src/test-utils/openclaw-test-state.ts` aus Vitest, wenn ein Test ein isoliertes `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, Config-Fixture, Workspace, Agent-Verzeichnis oder einen Auth-Profile-Store benötigt.
- Prozess-E2E-Helper: Verwenden Sie `test/helpers/openclaw-test-instance.ts`, wenn ein Vitest-Prozess-Level-E2E-Test einen laufenden Gateway, CLI-Umgebung, Log-Erfassung und Cleanup an einer Stelle benötigt.
- Docker-/Bash-E2E-Helper: Lanes, die `scripts/lib/docker-e2e-image.sh` sourcen, können `docker_e2e_test_state_shell_b64 <label> <scenario>` in den Container übergeben und es mit `scripts/lib/openclaw-e2e-instance.sh` decodieren; Multi-Home-Skripte können `docker_e2e_test_state_function_b64` übergeben und in jedem Flow `openclaw_test_state_create <label> <scenario>` aufrufen. Low-Level-Caller können `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` für ein In-Container-Shell-Snippet verwenden oder `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` für eine sourcebare Host-Env-Datei. Das `--` vor `create` verhindert, dass neuere Node-Runtimes `--env-file` als Node-Flag behandeln. Docker-/Bash-Lanes, die einen Gateway starten, können `scripts/lib/openclaw-e2e-instance.sh` im Container sourcen, für Entrypoint-Auflösung, Mock-OpenAI-Start, Gateway-Start im Vordergrund/Hintergrund, Readiness-Probes, State-Env-Export, Log-Dumps und Prozess-Cleanup.
- Full-, Extension- und Include-Pattern-Shard-Läufe aktualisieren lokale Timing-Daten in `.artifacts/vitest-shard-timings.json`; spätere Whole-Config-Läufe nutzen diese Timings, um langsame und schnelle Shards auszugleichen. Include-Pattern-CI-Shards hängen den Shard-Namen an den Timing-Key an, wodurch gefilterte Shard-Timings sichtbar bleiben, ohne Whole-Config-Timing-Daten zu ersetzen. Setzen Sie `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, um das lokale Timing-Artefakt zu ignorieren.
- Ausgewählte `plugin-sdk`- und `commands`-Testdateien werden jetzt durch dedizierte leichte Lanes geleitet, die nur `test/setup.ts` beibehalten; runtime-schwere Fälle bleiben auf ihren bestehenden Lanes.
- Quelldateien mit benachbarten Tests werden zuerst auf diese benachbarten Tests abgebildet, bevor auf breitere Verzeichnis-Globs zurückgefallen wird. Helper-Änderungen unter `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` und `src/plugins/contracts` verwenden einen lokalen Importgraphen, um importierende Tests auszuführen, statt jeden Shard breit auszuführen, wenn der Abhängigkeitspfad präzise ist.
- `auto-reply` wird jetzt ebenfalls in drei dedizierte Configs aufgeteilt (`core`, `top-level`, `reply`), damit das Reply-Harness nicht die leichteren Top-Level-Status-/Token-/Helper-Tests dominiert.
- Die Basis-Vitest-Config verwendet jetzt standardmäßig `pool: "threads"` und `isolate: false`, wobei der gemeinsame nicht isolierte Runner in den Repo-Configs aktiviert ist.
- `pnpm test:channels` führt `vitest.channels.config.ts` aus.
- `pnpm test:extensions` und `pnpm test extensions` führen alle Erweiterungs-/Plugin-Shards aus. Schwere Kanal-Plugins, das Browser-Plugin und OpenAI laufen als dedizierte Shards; andere Plugin-Gruppen bleiben gebündelt. Verwenden Sie `pnpm test extensions/<id>` für eine gebündelte Plugin-Lane.
- `pnpm test:perf:imports`: aktiviert Vitest-Importdauer- und Importaufschlüsselungs-Reporting, verwendet aber weiterhin scoped Lane-Routing für explizite Datei-/Verzeichnis-Targets.
- `pnpm test:perf:imports:changed`: dasselbe Import-Profiling, aber nur für Dateien, die seit `origin/main` geändert wurden.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` benchmarked den gerouteten Changed-Mode-Pfad gegen den nativen Root-Project-Lauf für denselben committeten Git-Diff.
- `pnpm test:perf:changed:bench -- --worktree` benchmarked das aktuelle Worktree-Changeset, ohne vorher zu committen.
- `pnpm test:perf:profile:main`: schreibt ein CPU-Profil für den Vitest-Main-Thread (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: schreibt CPU- und Heap-Profile für den Unit-Runner (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: führt jede Full-Suite-Vitest-Leaf-Config seriell aus und schreibt gruppierte Dauerdaten plus JSON-/Log-Artefakte pro Config. Der Test Performance Agent verwendet dies als Baseline, bevor er Slow-Test-Fixes versucht.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: vergleicht gruppierte Berichte nach einer performance-fokussierten Änderung.
- Gateway-Integration: Opt-in über `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` oder `pnpm test:gateway`.
- `pnpm test:e2e`: Führt Gateway-End-to-End-Smoke-Tests aus (Multi-Instance-WS/HTTP/Node-Pairing). Standardmäßig `threads` + `isolate: false` mit adaptiven Workern in `vitest.e2e.config.ts`; passen Sie dies mit `OPENCLAW_E2E_WORKERS=<n>` an und setzen Sie `OPENCLAW_E2E_VERBOSE=1` für ausführliche Logs.
- `pnpm test:live`: Führt Provider-Live-Tests aus (minimax/zai). Erfordert API-Schlüssel und `LIVE=1` (oder Provider-spezifisch `*_LIVE_TEST=1`), damit sie nicht übersprungen werden.
- `pnpm test:docker:all`: Baut das gemeinsame Live-Test-Image, packt OpenClaw einmal als npm-Tarball, baut/verwendet ein Bare-Node-/Git-Runner-Image plus ein funktionales Image, das diesen Tarball in `/app` installiert, und führt dann Docker-Smoke-Lanes mit `OPENCLAW_SKIP_DOCKER_BUILD=1` über einen gewichteten Scheduler aus. Das Bare-Image (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) wird für Installer-/Update-/Plugin-Abhängigkeits-Lanes verwendet; diese Lanes mounten den vorgebauten Tarball, statt kopierte Repo-Sources zu verwenden. Das funktionale Image (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) wird für normale Built-App-Funktionalitäts-Lanes verwendet. `scripts/package-openclaw-for-docker.mjs` ist der einzige lokale/CI-Package-Packer und validiert den Tarball plus `dist/postinstall-inventory.json`, bevor Docker ihn konsumiert. Docker-Lane-Definitionen liegen in `scripts/lib/docker-e2e-scenarios.mjs`; die Planner-Logik liegt in `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` führt den ausgewählten Plan aus. `node scripts/test-docker-all.mjs --plan-json` gibt den Scheduler-eigenen CI-Plan für ausgewählte Lanes, Image-Arten, Package-/Live-Image-Bedarf, State-Szenarien und Credential-Checks aus, ohne Docker zu bauen oder auszuführen. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` steuert Prozess-Slots und ist standardmäßig 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` steuert den Provider-sensitiven Tail-Pool und ist standardmäßig 10. Caps für schwere Lanes sind standardmäßig `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` und `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; Provider-Caps sind standardmäßig eine schwere Lane pro Provider über `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` und `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Verwenden Sie `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` oder `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` für größere Hosts. Wenn eine Lane auf einem Host mit niedriger Parallelität das effektive Gewicht oder Resource-Cap überschreitet, kann sie dennoch aus einem leeren Pool starten und läuft allein, bis sie Kapazität freigibt. Lane-Starts werden standardmäßig um 2 Sekunden gestaffelt, um lokale Create-Stürme des Docker-Daemons zu vermeiden; überschreiben Sie dies mit `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Der Runner preflightet Docker standardmäßig, bereinigt veraltete OpenClaw-E2E-Container, gibt alle 30 Sekunden Active-Lane-Status aus, teilt Provider-CLI-Tool-Caches zwischen kompatiblen Lanes, versucht transiente Live-Provider-Fehler standardmäßig einmal erneut (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) und speichert Lane-Timings in `.artifacts/docker-tests/lane-timings.json` für eine längste-zuerst-Sortierung bei späteren Läufen. Verwenden Sie `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, um das Lane-Manifest auszugeben, ohne Docker auszuführen, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>`, um die Statusausgabe anzupassen, oder `OPENCLAW_DOCKER_ALL_TIMINGS=0`, um Timing-Wiederverwendung zu deaktivieren. Verwenden Sie `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` nur für deterministische/lokale Lanes oder `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` nur für Live-Provider-Lanes; Package-Aliase sind `pnpm test:docker:local:all` und `pnpm test:docker:live:all`. Live-only-Modus führt Main- und Tail-Live-Lanes zu einem einzigen längste-zuerst-Pool zusammen, damit Provider-Buckets Claude-, Codex- und Gemini-Arbeit gemeinsam packen können. Der Runner stoppt das Scheduling neuer gepoolter Lanes nach dem ersten Fehler, sofern `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` nicht gesetzt ist, und jede Lane hat ein 120-Minuten-Fallback-Timeout, das mit `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` überschreibbar ist; ausgewählte Live-/Tail-Lanes verwenden engere Caps pro Lane. CLI-Backend-Docker-Setup-Befehle haben über `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` ihr eigenes Timeout (Standard 180). Logs pro Lane, `summary.json`, `failures.json` und Phasen-Timings werden unter `.artifacts/docker-tests/<run-id>/` geschrieben; verwenden Sie `pnpm test:docker:timings <summary.json>`, um langsame Lanes zu inspizieren, und `pnpm test:docker:rerun <run-id|summary.json|failures.json>`, um günstige gezielte Rerun-Befehle auszugeben.
- `pnpm test:docker:browser-cdp-snapshot`: Baut einen Chromium-gestützten Source-E2E-Container, startet rohes CDP plus einen isolierten Gateway, führt `browser doctor --deep` aus und verifiziert, dass CDP-Rollen-Snapshots Link-URLs, cursor-promoted Clickables, iframe-Refs und Frame-Metadaten enthalten.
- CLI-Backend-Live-Docker-Probes können als fokussierte Lanes ausgeführt werden, zum Beispiel `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` oder `pnpm test:docker:live-cli-backend:codex:mcp`. Claude und Gemini haben passende `:resume`- und `:mcp`-Aliase.
- `pnpm test:docker:openwebui`: Startet dockerisiertes OpenClaw + Open WebUI, meldet sich über Open WebUI an, prüft `/api/models` und führt anschließend einen echten proxied Chat über `/api/chat/completions` aus. Erfordert einen nutzbaren Live-Model-Schlüssel (zum Beispiel OpenAI in `~/.profile`), zieht ein externes Open-WebUI-Image und wird nicht als CI-stabil wie die normalen Unit-/E2E-Suites erwartet.
- `pnpm test:docker:mcp-channels`: Startet einen vorbefüllten Gateway-Container und einen zweiten Client-Container, der `openclaw mcp serve` startet, und verifiziert anschließend geroutete Conversation-Discovery, Transcript-Reads, Attachment-Metadaten, Live-Event-Queue-Verhalten, Outbound-Send-Routing sowie Channel- und Permission-Notifications im Claude-Stil über die echte stdio-Bridge. Die Claude-Notification-Assertion liest die rohen stdio-MCP-Frames direkt, damit der Smoke widerspiegelt, was die Bridge tatsächlich ausgibt.
- `pnpm test:docker:upgrade-survivor`: Installiert den gepackten OpenClaw-Tarball über einem verunreinigten Fixture eines alten Benutzers, führt die Paketaktualisierung sowie den nicht interaktiven Doctor ohne Live-Provider- oder Kanal-Schlüssel aus, startet anschließend einen Loopback-Gateway und prüft, dass Agents, Kanalkonfiguration, Plugin-Zulassungslisten, Arbeitsbereichs-/Sitzungsdateien, veralteter Zustand von Legacy-Plugin-Abhängigkeiten, Startvorgang und RPC-Status erhalten bleiben.
- `pnpm test:docker:published-upgrade-survivor`: Installiert standardmäßig `openclaw@latest`, befüllt realistische Dateien eines bestehenden Benutzers ohne Live-Provider- oder Kanal-Schlüssel, konfiguriert diese Ausgangsbasis mit einem eingebauten `openclaw config set`-Befehlsrezept, aktualisiert diese veröffentlichte Installation auf den gepackten OpenClaw-Tarball, führt den nicht interaktiven Doctor aus, schreibt `.artifacts/upgrade-survivor/summary.json`, startet anschließend einen Loopback-Gateway und prüft, dass konfigurierte Intents, Arbeitsbereichs-/Sitzungsdateien, veraltete Plugin-Konfiguration und Legacy-Abhängigkeitszustand, Startvorgang, `/healthz`, `/readyz` und RPC-Status erhalten bleiben oder sauber repariert werden. Überschreiben Sie eine Ausgangsbasis mit `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, erweitern Sie eine exakte lokale Matrix mit `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` wie `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, oder fügen Sie Szenario-Fixtures mit `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` hinzu; die reported-issues-Gruppe enthält `configured-plugin-installs`, um zu verifizieren, dass konfigurierte externe OpenClaw-Plugins während des Upgrades automatisch installiert werden, und `stale-source-plugin-shadow`, damit reine Quell-Plugin-Schatten den Startvorgang nicht beschädigen. Die Paketakzeptanz stellt diese als `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` und `published_upgrade_survivor_scenarios` bereit und löst Meta-Ausgangsbasis-Token wie `last-stable-4` oder `all-since-2026.4.23` auf, bevor sie exakte Paketspezifikationen an Docker-Lanes übergibt.
- `pnpm test:docker:update-migration`: Führt den Survivor-Harness für veröffentlichte Upgrades im bereinigungsintensiven Szenario `plugin-deps-cleanup` aus und beginnt standardmäßig bei `openclaw@2026.4.23`. Der separate Workflow `Update Migration` erweitert diese Lane mit `baselines=all-since-2026.4.23`, sodass jedes stabile veröffentlichte Paket ab `.23` auf den Kandidaten aktualisiert wird und die Bereinigung konfigurierter Plugin-Abhängigkeiten außerhalb der vollständigen Release-CI nachweist.
- `pnpm test:docker:plugins`: Führt Installations-/Update-Smokes für lokale Pfade, `file:`, npm-Registry-Pakete mit hoisteten Abhängigkeiten, bewegliche Git-Refs, ClawHub-Fixtures, Marktplatz-Updates sowie Aktivieren/Prüfen des Claude-Bundles aus.

## Lokales PR-Gate

Führen Sie für lokale PR-Landing-/Gate-Prüfungen Folgendes aus:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Wenn `pnpm test` auf einem ausgelasteten Host flakig ist, führen Sie es einmal erneut aus, bevor Sie es als Regression behandeln, und isolieren Sie es dann mit `pnpm test <path/to/test>`. Verwenden Sie für Hosts mit begrenztem Arbeitsspeicher:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Modell-Latenz-Benchmark (lokale Schlüssel)

Skript: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Verwendung:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Optionale Umgebungsvariablen: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Standard-Prompt: “Antworten Sie mit einem einzigen Wort: ok. Keine Satzzeichen oder zusätzlicher Text.”

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

Die Ausgabe enthält `sampleCount`, Durchschnitt, p50, p95, Min./Max., Verteilung von Exit-Code/Signal und Zusammenfassungen zum maximalen RSS für jeden Befehl. Optionales `--cpu-prof-dir` / `--heap-prof-dir` schreibt V8-Profile pro Lauf, sodass Timing und Profilerfassung denselben Harness verwenden.

Konventionen für gespeicherte Ausgaben:

- `pnpm test:startup:bench:smoke` schreibt das gezielte Smoke-Artefakt nach `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` schreibt das Full-Suite-Artefakt nach `.artifacts/cli-startup-bench-all.json` mit `runs=5` und `warmup=1`
- `pnpm test:startup:bench:update` aktualisiert die eingecheckte Baseline-Fixture unter `test/fixtures/cli-startup-bench.json` mit `runs=5` und `warmup=1`

Eingecheckte Fixture:

- `test/fixtures/cli-startup-bench.json`
- Aktualisieren Sie sie mit `pnpm test:startup:bench:update`
- Vergleichen Sie aktuelle Ergebnisse mit der Fixture über `pnpm test:startup:bench:check`

## Onboarding-E2E (Docker)

Docker ist optional; dies wird nur für containerisierte Onboarding-Smoke-Tests benötigt.

Vollständiger Cold-Start-Ablauf in einem sauberen Linux-Container:

```bash
scripts/e2e/onboard-docker.sh
```

Dieses Skript steuert den interaktiven Assistenten über ein Pseudo-TTY, überprüft Config-/Workspace-/Sitzungsdateien, startet dann den Gateway und führt `openclaw health` aus.

## QR-Import-Smoke (Docker)

Stellt sicher, dass der gepflegte QR-Runtime-Helper unter den unterstützten Docker-Node-Runtimes geladen wird (Node 24 standardmäßig, Node 22 kompatibel):

```bash
pnpm test:docker:qr
```

## Verwandt

- [Testing](/de/help/testing)
- [Live testen](/de/help/testing-live)
- [Updates und Plugins testen](/de/help/testing-updates-plugins)
