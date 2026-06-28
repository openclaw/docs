---
read_when:
    - Tests ausführen oder beheben
summary: Tests lokal ausführen (vitest) und wann Force-/Coverage-Modi verwendet werden sollten
title: Tests
x-i18n:
    generated_at: "2026-06-28T00:13:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7d1aed76ed59713ee320eb2d18dc8c392ea7a810096a0ef3131388001bbe5d8d
    source_path: reference/test.md
    workflow: 16
---

- Komplettes Test-Kit (Suites, Live, Docker): [Tests](/de/help/testing)
- Validierung von Updates und Plugin-Paketen: [Updates und Plugins testen](/de/help/testing-updates-plugins)

- Routinemäßige lokale Testreihenfolge:
  1. `pnpm test:changed` für geänderten Vitest-Nachweis im Änderungsumfang.
  2. `pnpm test <path-or-filter>` für eine Datei, ein Verzeichnis oder ein explizites Ziel.
  3. `pnpm test` nur, wenn Sie bewusst die vollständige lokale Vitest-Suite benötigen.
- `pnpm test:force`: Beendet jeden verbliebenen Gateway-Prozess, der den Standard-Kontrollport belegt, und führt dann die vollständige Vitest-Suite mit einem isolierten Gateway-Port aus, damit Server-Tests nicht mit einer laufenden Instanz kollidieren. Verwenden Sie dies, wenn ein vorheriger Gateway-Lauf Port 18789 belegt gelassen hat.
- `pnpm test:coverage`: Führt die Unit-Suite mit V8-Abdeckung aus (über `vitest.unit.config.ts`). Dies ist ein Abdeckungs-Gate für die Standard-Unit-Lane, keine vollständige All-File-Abdeckung für das gesamte Repository. Die Schwellenwerte liegen bei 70 % für Zeilen/Funktionen/Anweisungen und 55 % für Branches. Da `coverage.all` false ist und die Standard-Lane die Abdeckung auf nicht schnelle Unit-Tests mit benachbarten Quelldateien beschränkt, misst das Gate den von dieser Lane verantworteten Quellcode statt jedes transitiven Imports, den sie zufällig lädt.
- `pnpm test:coverage:changed`: Führt Unit-Abdeckung nur für Dateien aus, die seit `origin/main` geändert wurden.
- `pnpm test:changed`: günstiger, intelligenter geänderter Testlauf. Er führt präzise Ziele aus direkten Teständerungen, benachbarten `*.test.ts`-Dateien, expliziten Quellzuordnungen und dem lokalen Importgraphen aus. Breite Konfigurations-/Paketänderungen werden übersprungen, sofern sie nicht präzisen Tests zugeordnet werden können.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: explizit breiter geänderter Testlauf. Verwenden Sie dies, wenn eine Änderung an Test-Harness/Konfiguration/Paket auf das breitere geänderte Testverhalten von Vitest zurückfallen soll.
- `pnpm changed:lanes`: zeigt die durch den Diff gegen `origin/main` ausgelösten Architektur-Lanes an.
- `pnpm check:changed`: delegiert außerhalb von CI standardmäßig an Crabbox/Testbox und führt dann das intelligente geänderte Check-Gate für den Diff gegen `origin/main` im Remote-Child aus. Es führt Typecheck-, Lint- und Guard-Befehle für die betroffenen Architektur-Lanes aus, aber keine Vitest-Tests. Verwenden Sie `pnpm test:changed` oder explizit `pnpm test <target>` als Testnachweis.
- Codex-Worktrees und verlinkte/sparse Checkouts: Vermeiden Sie direkte lokale `pnpm test*`, `pnpm check*` und `pnpm crabbox:run`, sofern Sie nicht verifiziert haben, dass pnpm keine Abhängigkeiten abgleicht. Für winzige Nachweise mit expliziter Datei verwenden Sie `node scripts/run-vitest.mjs <path-or-filter>`; für geänderte Gates oder breiten Nachweis verwenden Sie `node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox ... -- env OPENCLAW_CHECK_CHANGED_REMOTE_CHILD=1 OPENCLAW_CHANGED_LANES_RAW_SYNC=1 corepack pnpm check:changed`, damit pnpm innerhalb von Testbox läuft.
- Testbox-über-Crabbox-Nachweis: Verwenden Sie den finalen `exitCode` des Wrappers und das Timing-JSON als Befehlsergebnis. Der delegierte Blacksmith-GitHub-Actions-Lauf kann nach einem erfolgreichen SSH-Befehl `cancelled` anzeigen, weil die Testbox von außerhalb der Keepalive-Action gestoppt wird; prüfen Sie die Wrapper-Zusammenfassung und die Befehlsausgabe, bevor Sie dies als Testfehler behandeln.
- `OPENCLAW_HEAVY_CHECK_LOCK_SCOPE=worktree <local-heavy-check command>`: hält die Serialisierung schwerer Checks für Befehle wie `pnpm check:changed` und gezielte `pnpm test ...` innerhalb des aktuellen Worktrees statt im gemeinsamen Git-Verzeichnis. Verwenden Sie dies nur auf leistungsstarken lokalen Hosts, wenn Sie bewusst unabhängige Checks über verlinkte Worktrees hinweg ausführen.
- `pnpm test`: leitet explizite Datei-/Verzeichnisziele durch bereichsbezogene Vitest-Lanes. Läufe ohne Ziel sind Full-Suite-Nachweise: Sie verwenden feste Shard-Gruppen, expandieren für lokale parallele Ausführung zu Leaf-Konfigurationen und geben den erwarteten lokalen Shard-Fanout vor dem Start aus. Die Erweiterungsgruppe expandiert immer zu den Shard-Konfigurationen pro Erweiterung statt zu einem einzigen riesigen Root-Projektprozess.
- Test-Wrapper-Läufe enden mit einer kurzen Zusammenfassung `[test] passed|failed|skipped ... in ...`. Vitests eigene Dauerzeile bleibt das Detail pro Shard.
- Gemeinsamer OpenClaw-Testzustand: Verwenden Sie `src/test-utils/openclaw-test-state.ts` aus Vitest, wenn ein Test ein isoliertes `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, eine Konfigurations-Fixture, einen Workspace, ein Agent-Verzeichnis oder einen Auth-Profile-Speicher benötigt.
- `pnpm test:env-mutations:report`: nicht blockierender Bericht über Tests und Harnesses, die `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_WORKSPACE_DIR` oder verwandte OpenClaw-Env-Schlüssel direkt verändern. Verwenden Sie ihn, um Kandidaten für die Migration zum gemeinsamen Test-State-Helfer zu finden.
- Gemocktes Control-UI-E2E: Verwenden Sie `pnpm test:ui:e2e` für die Vitest-+Playwright-Lane, die die Vite Control UI startet und eine echte Chromium-Seite gegen einen gemockten Gateway-WebSocket steuert. Tests liegen in `ui/src/**/*.e2e.test.ts`; gemeinsame Mocks und Steuerungen liegen in `ui/src/test-helpers/control-ui-e2e.ts`. `pnpm test:e2e` enthält diese Lane. In Codex-Worktrees bevorzugen Sie `node scripts/run-vitest.mjs run --config test/vitest/vitest.ui-e2e.config.ts --configLoader runner ui/src/ui/e2e/chat-flow.e2e.test.ts` für winzige gezielte Nachweise, nachdem Abhängigkeiten installiert sind, oder Testbox/Crabbox für breiteren GUI-Nachweis.
- Prozess-E2E-Helfer: Verwenden Sie `test/helpers/openclaw-test-instance.ts`, wenn ein Vitest-Prozess-Level-E2E-Test einen laufenden Gateway, eine CLI-Umgebung, Log-Erfassung und Cleanup an einer Stelle benötigt.
- TUI-PTY-Tests: Verwenden Sie `node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts` für die schnelle Fake-Backend-PTY-Lane. Verwenden Sie `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` oder `pnpm tui:pty:test:watch --mode local` für den langsameren `tui --local`-Smoke, der nur den externen Modellendpunkt mockt. Prüfen Sie stabilen sichtbaren Text oder Fixture-Aufrufe, keine rohen ANSI-Snapshots.
- Docker-/Bash-E2E-Helfer: Lanes, die `scripts/lib/docker-e2e-image.sh` sourcen, können `docker_e2e_test_state_shell_b64 <label> <scenario>` in den Container übergeben und mit `scripts/lib/openclaw-e2e-instance.sh` dekodieren; Multi-Home-Skripte können `docker_e2e_test_state_function_b64` übergeben und in jedem Flow `openclaw_test_state_create <label> <scenario>` aufrufen. Low-Level-Aufrufer können `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` für ein Shell-Snippet im Container verwenden oder `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` für eine sourcebare Host-Env-Datei. Das `--` vor `create` verhindert, dass neuere Node-Runtimes `--env-file` als Node-Flag behandeln. Docker-/Bash-Lanes, die einen Gateway starten, können `scripts/lib/openclaw-e2e-instance.sh` im Container sourcen für Entrypoint-Auflösung, gemockten OpenAI-Start, Gateway-Start im Vordergrund/Hintergrund, Readiness-Probes, State-Env-Export, Log-Dumps und Prozess-Cleanup.
- Full-, Extension- und Include-Pattern-Shard-Läufe aktualisieren lokale Timing-Daten in `.artifacts/vitest-shard-timings.json`; spätere Whole-Config-Läufe verwenden diese Timings, um langsame und schnelle Shards auszubalancieren. Include-Pattern-CI-Shards hängen den Shard-Namen an den Timing-Schlüssel an, wodurch gefilterte Shard-Timings sichtbar bleiben, ohne Whole-Config-Timing-Daten zu ersetzen. Setzen Sie `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, um das lokale Timing-Artefakt zu ignorieren.
- Ausgewählte `plugin-sdk`- und `commands`-Testdateien laufen jetzt über dedizierte leichte Lanes, die nur `test/setup.ts` behalten und laufzeitlastige Fälle auf ihren vorhandenen Lanes belassen.
- Quelldateien mit benachbarten Tests werden diesem benachbarten Test zugeordnet, bevor auf breitere Verzeichnis-Globs zurückgefallen wird. Helferänderungen unter `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` und `src/plugins/contracts` verwenden einen lokalen Importgraphen, um importierende Tests auszuführen, statt jeden Shard breit laufen zu lassen, wenn der Abhängigkeitspfad präzise ist.
- `auto-reply` teilt sich jetzt außerdem in drei dedizierte Konfigurationen (`core`, `top-level`, `reply`) auf, damit das Reply-Harness die leichteren Top-Level-Status-/Token-/Helfer-Tests nicht dominiert.
- Die Basis-Vitest-Konfiguration setzt jetzt standardmäßig `pool: "threads"` und `isolate: false`, wobei der gemeinsame nicht isolierte Runner über die Repository-Konfigurationen hinweg aktiviert ist.
- `pnpm test:channels` führt `vitest.channels.config.ts` aus.
- `pnpm test:extensions` und `pnpm test extensions` führen alle Erweiterungs-/Plugin-Shards aus. Schwere Channel-Plugins, das Browser-Plugin und OpenAI laufen als dedizierte Shards; andere Plugin-Gruppen bleiben gebündelt. Verwenden Sie `pnpm test extensions/<id>` für eine gebündelte Plugin-Lane.
- `pnpm test:perf:imports`: aktiviert Vitest-Berichte zu Importdauer und Importaufschlüsselung, während für explizite Datei-/Verzeichnisziele weiterhin bereichsbezogenes Lane-Routing verwendet wird.
- `pnpm test:perf:imports:changed`: dasselbe Import-Profiling, aber nur für Dateien, die seit `origin/main` geändert wurden.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` benchmarked den gerouteten Changed-Mode-Pfad gegen den nativen Root-Projektlauf für denselben committeten Git-Diff.
- `pnpm test:perf:changed:bench -- --worktree` benchmarked die aktuelle Worktree-Änderungsmenge, ohne vorher zu committen.
- `pnpm test:perf:profile:main`: schreibt ein CPU-Profil für den Vitest-Main-Thread (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: schreibt CPU- und Heap-Profile für den Unit-Runner (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: führt jede Full-Suite-Vitest-Leaf-Konfiguration seriell aus und schreibt gruppierte Dauerdaten sowie JSON-/Log-Artefakte pro Konfiguration. Der Test Performance Agent verwendet dies als Baseline, bevor er Slow-Test-Fixes versucht.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: vergleicht gruppierte Berichte nach einer performanceorientierten Änderung.
- `pnpm test:docker:timings <summary.json>` untersucht langsame Docker-Lanes nach einem Docker-All-Lauf; verwenden Sie `pnpm test:docker:rerun <run-id|summary.json|failures.json>`, um günstige gezielte Rerun-Befehle aus denselben Artefakten auszugeben.
- Gateway-Integration: Opt-in über `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` oder `pnpm test:gateway`.
- `pnpm test:e2e`: Führt das Repository-E2E-Aggregat aus: Gateway-End-to-End-Smoke-Tests plus die gemockte Browser-E2E-Lane der Control UI.
- `pnpm test:e2e:gateway`: Führt Gateway-End-to-End-Smoke-Tests aus (Multi-Instance-WS/HTTP/Node-Pairing). Standardmäßig `threads` + `isolate: false` mit adaptiven Workern in `vitest.e2e.config.ts`; passen Sie dies mit `OPENCLAW_E2E_WORKERS=<n>` an und setzen Sie `OPENCLAW_E2E_VERBOSE=1` für ausführliche Logs.
- `pnpm test:live`: Führt Provider-Live-Tests aus (minimax/zai). Erfordert API-Schlüssel und `LIVE=1` (oder provider-spezifisch `*_LIVE_TEST=1`), um sie nicht zu überspringen.
- `pnpm test:docker:all`: Erstellt das gemeinsame Live-Test-Image, packt OpenClaw einmal als npm-Tarball, erstellt oder verwendet ein minimales Node/Git-Runner-Image sowie ein funktionales Image, das diesen Tarball nach `/app` installiert, und führt dann Docker-Smoke-Lanes mit `OPENCLAW_SKIP_DOCKER_BUILD=1` über einen gewichteten Scheduler aus. Das minimale Image (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) wird für Installer-/Update-/Plugin-Abhängigkeits-Lanes verwendet; diese Lanes mounten den vorab erstellten Tarball, statt kopierte Repo-Quellen zu verwenden. Das funktionale Image (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) wird für normale Built-App-Funktions-Lanes verwendet. `scripts/package-openclaw-for-docker.mjs` ist der einzige lokale/CI-Package-Packer und validiert den Tarball sowie `dist/postinstall-inventory.json`, bevor Docker ihn verwendet. Docker-Lane-Definitionen befinden sich in `scripts/lib/docker-e2e-scenarios.mjs`; die Planner-Logik befindet sich in `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` führt den ausgewählten Plan aus. `node scripts/test-docker-all.mjs --plan-json` gibt den Scheduler-eigenen CI-Plan für ausgewählte Lanes, Image-Arten, Package-/Live-Image-Anforderungen, State-Szenarien und Zugangsdatenprüfungen aus, ohne Docker zu bauen oder auszuführen. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` steuert Prozess-Slots und ist standardmäßig 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` steuert den Provider-sensitiven Tail-Pool und ist standardmäßig 10. Caps für schwere Lanes sind standardmäßig `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=5` und `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; Provider-Caps sind standardmäßig auf eine schwere Lane pro Provider gesetzt über `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` und `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Verwenden Sie `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` oder `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` für größere Hosts. Wenn eine Lane auf einem Host mit niedriger Parallelität das effektive Gewicht oder Ressourcen-Cap überschreitet, kann sie dennoch aus einem leeren Pool starten und allein laufen, bis sie Kapazität freigibt. Lane-Starts werden standardmäßig um 2 Sekunden gestaffelt, um lokale Erstellungsanstürme des Docker-Daemons zu vermeiden; überschreiben Sie dies mit `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Der Runner führt standardmäßig Docker-Preflights aus, bereinigt veraltete OpenClaw-E2E-Container, gibt alle 30 Sekunden den Status aktiver Lanes aus, teilt Provider-CLI-Tool-Caches zwischen kompatiblen Lanes, wiederholt vorübergehende Live-Provider-Fehler standardmäßig einmal (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) und speichert Lane-Zeiten in `.artifacts/docker-tests/lane-timings.json` für eine längste-zuerst-Sortierung in späteren Läufen. Verwenden Sie `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, um das Lane-Manifest ohne Docker-Ausführung auszugeben, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>`, um die Statusausgabe anzupassen, oder `OPENCLAW_DOCKER_ALL_TIMINGS=0`, um die Wiederverwendung von Zeitdaten zu deaktivieren. Verwenden Sie `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` nur für deterministische/lokale Lanes oder `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` nur für Live-Provider-Lanes; Package-Aliasse sind `pnpm test:docker:local:all` und `pnpm test:docker:live:all`. Der Nur-Live-Modus führt Main- und Tail-Live-Lanes in einem längste-zuerst-Pool zusammen, sodass Provider-Buckets Claude-, Codex- und Gemini-Arbeiten gemeinsam packen können. Der Runner plant nach dem ersten Fehler keine neuen gepoolten Lanes mehr ein, außer `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` ist gesetzt, und jede Lane hat ein Fallback-Timeout von 120 Minuten, das mit `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` überschrieben werden kann; ausgewählte Live-/Tail-Lanes verwenden strengere Caps pro Lane. CLI-Backend-Docker-Setup-Befehle haben ein eigenes Timeout über `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (Standard 180). Pro-Lane-Logs, `summary.json`, `failures.json` und Phasenzeiten werden unter `.artifacts/docker-tests/<run-id>/` geschrieben; verwenden Sie `pnpm test:docker:timings <summary.json>`, um langsame Lanes zu untersuchen, und `pnpm test:docker:rerun <run-id|summary.json|failures.json>`, um günstige gezielte Wiederholungsbefehle auszugeben.
- `pnpm test:docker:browser-cdp-snapshot`: Erstellt einen Chromium-gestützten Source-E2E-Container, startet rohes CDP plus einen isolierten Gateway, führt `browser doctor --deep` aus und verifiziert, dass CDP-Rollen-Snapshots Link-URLs, zu Klickzielen hochgestufte Cursor-Elemente, iframe-Referenzen und Frame-Metadaten enthalten.
- `pnpm test:docker:skill-install`: Installiert den gepackten OpenClaw-Tarball in einem minimalen Docker-Runner, deaktiviert `skills.install.allowUploadedArchives`, löst einen aktuellen Skill-Slug aus der Live-ClawHub-Suche auf, installiert ihn über `openclaw skills install` und verifiziert `SKILL.md`, `.clawhub/origin.json`, `.clawhub/lock.json` und `skills info --json`.
- CLI-Backend-Live-Docker-Probes können als fokussierte Lanes ausgeführt werden, zum Beispiel `pnpm test:docker:live-cli-backend:claude`, `pnpm test:docker:live-cli-backend:claude:resume` oder `pnpm test:docker:live-cli-backend:claude:mcp`. Gemini hat entsprechende `:resume`- und `:mcp`-Aliasse.
- `pnpm test:docker:openwebui`: Startet Dockerisierte OpenClaw + Open WebUI, meldet sich über Open WebUI an, prüft `/api/models` und führt dann einen echten proxied Chat über `/api/chat/completions` aus. Erfordert einen nutzbaren Live-Model-Key, lädt ein externes Open WebUI-Image und ist nicht erwartungsgemäß so CI-stabil wie die normalen Unit-/E2E-Suites.
- `pnpm test:docker:mcp-channels`: Startet einen vorbefüllten Gateway-Container und einen zweiten Client-Container, der `openclaw mcp serve` startet, und verifiziert dann geroutete Conversation Discovery, Transcript-Lesezugriffe, Attachment-Metadaten, Live-Event-Queue-Verhalten, Outbound-Send-Routing sowie Claude-artige Channel- und Berechtigungsbenachrichtigungen über die echte stdio-Bridge. Die Claude-Benachrichtigungsassertion liest die rohen stdio-MCP-Frames direkt, sodass der Smoke widerspiegelt, was die Bridge tatsächlich ausgibt.
- `pnpm test:docker:upgrade-survivor`: Installiert den gepackten OpenClaw-Tarball über ein verschmutztes Altbenutzer-Fixture, führt Package-Update plus nicht interaktiven Doctor ohne Live-Provider- oder Channel-Keys aus, startet dann einen Loopback-Gateway und prüft, dass Agenten, Channel-Konfiguration, Plugin-Allowlisten, Workspace-/Session-Dateien, veralteter Legacy-Plugin-Abhängigkeitszustand, Start und RPC-Status erhalten bleiben.
- `pnpm test:docker:published-upgrade-survivor`: Installiert standardmäßig `openclaw@latest`, seeding realistische Bestandsbenutzerdateien ohne Live-Provider- oder Channel-Keys, konfiguriert diese Baseline mit einem eingebetteten `openclaw config set`-Befehlsrezept, aktualisiert diese veröffentlichte Installation auf den gepackten OpenClaw-Tarball, führt den nicht interaktiven Doctor aus, schreibt `.artifacts/upgrade-survivor/summary.json`, startet dann einen Loopback-Gateway und prüft, dass konfigurierte Intents, Workspace-/Session-Dateien, veraltete Plugin-Konfiguration und Legacy-Abhängigkeitszustand, Start, `/healthz`, `/readyz` und RPC-Status erhalten bleiben oder sauber repariert werden. Überschreiben Sie eine Baseline mit `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, erweitern Sie eine exakte lokale Matrix mit `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` wie `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15` oder fügen Sie Szenario-Fixtures mit `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` hinzu; das reported-issues-Set enthält `configured-plugin-installs`, um zu verifizieren, dass konfigurierte externe OpenClaw-Plugins während des Upgrades automatisch installiert werden, und `stale-source-plugin-shadow`, um zu verhindern, dass source-only Plugin-Schatten den Start beschädigen. Package Acceptance stellt diese als `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` und `published_upgrade_survivor_scenarios` bereit und löst Meta-Baseline-Tokens wie `last-stable-4` oder `all-since-2026.4.23` auf, bevor exakte Package-Spezifikationen an Docker-Lanes übergeben werden.
- `pnpm test:docker:update-migration`: Führt das Published-Upgrade-Survivor-Harness im bereinigungsintensiven `plugin-deps-cleanup`-Szenario aus und startet standardmäßig bei `openclaw@2026.4.23`. Der separate `Update Migration`-Workflow erweitert diese Lane mit `baselines=all-since-2026.4.23`, sodass jedes stabile veröffentlichte Package ab `.23` auf den Kandidaten aktualisiert wird und die Bereinigung konfigurierter Plugin-Abhängigkeiten außerhalb der Full-Release-CI nachweist.
- `pnpm test:docker:plugins`: Führt Install-/Update-Smokes für lokale Pfade, `file:`, npm-Registry-Packages mit gehoisteten Abhängigkeiten, bewegliche Git-Refs, ClawHub-Fixtures, Marketplace-Updates und Claude-Bundle-Aktivierung/-Inspektion aus.

## Lokales PR-Gate

Führen Sie für lokale PR-Lande-/Gate-Prüfungen Folgendes aus:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Wenn `pnpm test` auf einem ausgelasteten Host flakig ist, führen Sie es einmal erneut aus, bevor Sie es als Regression behandeln, und isolieren Sie dann mit `pnpm test <path/to/test>`. Verwenden Sie für hosts mit begrenztem Arbeitsspeicher:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Modelllatenz-Benchmark (lokale Schlüssel)

Skript: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Verwendung:

- `pnpm tsx scripts/bench-model.ts --runs 10`
- Optionale Umgebung: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Standard-Prompt: "Antworte mit einem einzigen Wort: ok. Keine Satzzeichen oder zusätzlicher Text."

Letzter Lauf (2025-12-31, 20 Läufe):

- minimax Median 1279ms (min. 1114, max. 2431)
- opus Median 2454ms (min. 1224, max. 3170)

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

Die Ausgabe enthält `sampleCount`, Durchschnitt, p50, p95, min./max., Exit-Code-/Signalverteilung und maximale RSS-Zusammenfassungen für jeden Befehl. Optional schreibt `--cpu-prof-dir` / `--heap-prof-dir` V8-Profile pro Lauf, sodass Zeitmessung und Profilerfassung denselben Harness verwenden.

Konventionen für gespeicherte Ausgaben:

- `pnpm test:startup:bench:smoke` schreibt das gezielte Smoke-Artefakt nach `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` schreibt das Artefakt der vollständigen Suite nach `.artifacts/cli-startup-bench-all.json` mit `runs=5` und `warmup=1`
- `pnpm test:startup:bench:update` aktualisiert das eingecheckte Baseline-Fixture unter `test/fixtures/cli-startup-bench.json` mit `runs=5` und `warmup=1`

Eingechecktes Fixture:

- `test/fixtures/cli-startup-bench.json`
- Aktualisieren mit `pnpm test:startup:bench:update`
- Aktuelle Ergebnisse mit dem Fixture vergleichen mit `pnpm test:startup:bench:check`

## Gateway-Start-Benchmark

Skript: [`scripts/bench-gateway-startup.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-gateway-startup.ts)

Der Benchmark verwendet standardmäßig den gebauten CLI-Einstieg unter `dist/entry.js`; führen Sie
`pnpm build` aus, bevor Sie die Package-Script-Befehle verwenden. Um stattdessen den Quell-Runner
zu messen, übergeben Sie `--entry scripts/run-node.mjs` und halten Sie diese Ergebnisse
getrennt von Baselines mit gebautem Einstieg.

Verwendung:

- `pnpm test:startup:gateway -- --runs 5 --warmup 1`
- `pnpm test:startup:gateway -- --case default --runs 10 --warmup 1`
- `pnpm test:startup:gateway -- --case skipChannels --case fiftyPlugins --runs 5`
- `node --import tsx scripts/bench-gateway-startup.ts --case default --runs 5 --output .artifacts/gateway-startup.json`
- `node --import tsx scripts/bench-gateway-startup.ts --case default --runs 3 --cpu-prof-dir .artifacts/gateway-startup-cpu`

Fall-IDs:

- `default`: normaler Gateway-Start.
- `skipChannels`: Gateway-Start mit übersprungenem Kanalstart.
- `oneInternalHook`: ein konfigurierter interner Hook.
- `allInternalHooks`: alle internen Hooks.
- `fiftyPlugins`: 50 Manifest-Plugins.
- `fiftyStartupLazyPlugins`: 50 startup-lazy Manifest-Plugins.

Die Ausgabe enthält die erste Prozessausgabe, `/healthz`, `/readyz`, die HTTP-Listen-Logzeit,
die Gateway-Ready-Logzeit, CPU-Zeit, CPU-Core-Verhältnis, max. RSS, Heap, Startup-Trace-
Metriken, Event-Loop-Verzögerung und Detailmetriken der Plugin-Lookup-Tabelle. Das Skript
aktiviert `OPENCLAW_GATEWAY_STARTUP_TRACE=1` in der Kind-Gateway-Umgebung.

Lesen Sie `/healthz` als Liveness: Der HTTP-Server kann antworten. Lesen Sie `/readyz` als
nutzbare Bereitschaft: Startup-Plugin-Sidecars, Kanäle und ready-kritische
Post-Attach-Arbeit sind abgeschlossen. Gateway-Startup-Hooks werden
asynchron ausgelöst und sind nicht Teil der Bereitschaftsgarantie. Die Ready-Logzeit ist der
interne Ready-Log-Zeitstempel des Gateway; sie ist für prozessseitige
Zuordnung nützlich, ersetzt aber nicht den externen `/readyz`-Probe.

Verwenden Sie JSON-Ausgabe oder `--output`, wenn Sie Änderungen vergleichen. Verwenden Sie `--cpu-prof-dir` erst,
nachdem die Trace-Ausgabe auf Import-, Compile- oder CPU-gebundene Arbeit hinweist, die nicht
allein aus Phasenzeiten erklärt werden kann. Vergleichen Sie Quell-Runner-Ergebnisse nicht mit
gebauten `dist/entry.js`-Ergebnissen als derselben Baseline.

## Gateway-Neustart-Benchmark

Skript: [`scripts/bench-gateway-restart.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-gateway-restart.ts)

Der Neustart-Benchmark wird nur auf macOS und Linux unterstützt. Er verwendet SIGUSR1 für
In-Process-Neustarts und schlägt unter Windows sofort fehl.

Der Benchmark verwendet standardmäßig den gebauten CLI-Einstieg unter `dist/entry.js`; führen Sie
`pnpm build` aus, bevor Sie die Package-Script-Befehle verwenden. Um stattdessen den Quell-Runner
zu messen, übergeben Sie `--entry scripts/run-node.mjs` und halten Sie diese Ergebnisse
getrennt von Baselines mit gebautem Einstieg.

Verwendung:

- `pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5`
- `pnpm test:restart:gateway -- --case default --runs 3 --restarts 3 --warmup 1`
- `pnpm test:restart:gateway -- --case skipChannelsAcpxProbe --case skipChannelsNoAcpxProbe --runs 1 --restarts 5`
- `node --import tsx scripts/bench-gateway-restart.ts --case fiftyPlugins --runs 1 --restarts 5 --output .artifacts/gateway-restart.json`
- `node --import tsx scripts/bench-gateway-restart.ts --json`

Fall-IDs:

- `skipChannels`: Neustart mit übersprungenen Kanälen.
- `skipChannelsAcpxProbe`: Neustart mit übersprungenen Kanälen und eingeschaltetem ACPX-Startup-Probe.
- `skipChannelsNoAcpxProbe`: Neustart mit übersprungenen Kanälen und ausgeschaltetem ACPX-Startup-Probe.
- `default`: normaler Neustart.
- `fiftyPlugins`: Neustart mit 50 Manifest-Plugins.

Die Ausgabe enthält das nächste `/healthz`, das nächste `/readyz`, Ausfallzeit, Restart-Ready-Timing,
CPU, RSS, Startup-Trace-Metriken für den Ersatzprozess und Restart-Trace-
Metriken für Signalverarbeitung, Active-Work-Drain, Close-Phasen, nächsten Start, Ready-
Timing und Speicher-Snapshots. Das Skript aktiviert
`OPENCLAW_GATEWAY_STARTUP_TRACE=1` und `OPENCLAW_GATEWAY_RESTART_TRACE=1` in der
Kind-Gateway-Umgebung.

Verwenden Sie diesen Benchmark, wenn eine Änderung Neustart-Signalisierung, Close-Handler,
Startup-after-Restart, Sidecar-Shutdown, Service-Übergabe oder Bereitschaft nach
Neustart betrifft. Beginnen Sie mit `skipChannels`, wenn Sie Gateway-Mechanik vom Kanal-
Start isolieren. Verwenden Sie `default` oder Plugin-lastige Fälle erst, nachdem der enge Fall
den Neustartpfad erklärt.

Trace-Metriken sind Zuordnungshinweise, keine Urteile. Eine Neustartänderung sollte anhand
mehrerer Samples, der passenden Owner-Spanne, des `/healthz`- und `/readyz`-
Verhaltens und des benutzersichtbaren Neustartvertrags beurteilt werden.

## Onboarding-E2E (Docker)

Docker ist optional; dies wird nur für containerisierte Onboarding-Smoke-Tests benötigt.

Vollständiger Cold-Start-Ablauf in einem sauberen Linux-Container:

```bash
scripts/e2e/onboard-docker.sh
```

Dieses Skript steuert den interaktiven Assistenten über ein Pseudo-TTY, verifiziert Konfigurations-/Workspace-/Session-Dateien, startet dann das Gateway und führt `openclaw health` aus.

## QR-Import-Smoke (Docker)

Stellt sicher, dass der gepflegte QR-Laufzeithelfer unter den unterstützten Docker-Node-Laufzeiten geladen wird (Node 24 Standard, Node 22 kompatibel):

```bash
pnpm test:docker:qr
```

## Verwandt

- [Tests](/de/help/testing)
- [Live testen](/de/help/testing-live)
- [Updates und Plugins testen](/de/help/testing-updates-plugins)
