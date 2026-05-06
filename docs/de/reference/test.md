---
read_when:
    - Tests ausführen oder korrigieren
summary: Tests lokal ausführen (vitest) und wann Force-/Coverage-Modi verwendet werden
title: Tests
x-i18n:
    generated_at: "2026-05-06T07:02:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 794589ee8362795c949626203e8129d6a8bb1d2e5ccf9a18f0d9b4bbd347156e
    source_path: reference/test.md
    workflow: 16
---

- Vollständiges Testkit (Suites, Live, Docker): [Testen](/de/help/testing)
- Validierung von Updates und Plugin-Paketen: [Updates und Plugins testen](/de/help/testing-updates-plugins)

- `pnpm test:force`: Beendet alle zurückgebliebenen Gateway-Prozesse, die den standardmäßigen Steuerport belegen, und führt dann die vollständige Vitest-Suite mit einem isolierten Gateway-Port aus, damit Server-Tests nicht mit einer laufenden Instanz kollidieren. Verwenden Sie dies, wenn ein vorheriger Gateway-Lauf Port 18789 belegt hat.
- `pnpm test:coverage`: Führt die Unit-Suite mit V8-Coverage aus (über `vitest.unit.config.ts`). Dies ist ein Coverage-Gate für die Standard-Unit-Lane, keine dateiübergreifende Coverage für das gesamte Repository. Die Schwellenwerte liegen bei 70 % für Zeilen/Funktionen/Anweisungen und 55 % für Branches. Da `coverage.all` false ist und die Standard-Lane die Coverage-Includes auf nicht schnelle Unit-Tests mit benachbarten Quelldateien beschränkt, misst das Gate den von dieser Lane verantworteten Quellcode statt jedes transitiven Imports, den sie zufällig lädt.
- `pnpm test:coverage:changed`: Führt Unit-Coverage nur für Dateien aus, die seit `origin/main` geändert wurden.
- `pnpm test:changed`: günstiger, intelligenter geänderter Testlauf. Er führt präzise Ziele aus direkten Teständerungen, benachbarten `*.test.ts`-Dateien, expliziten Quellcode-Zuordnungen und dem lokalen Importgraph aus. Breite Konfigurations-/Paketänderungen werden übersprungen, sofern sie nicht präzisen Tests zugeordnet werden.
- `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`: expliziter breiter geänderter Testlauf. Verwenden Sie ihn, wenn eine Änderung an Test-Harness/Konfiguration/Paket auf Vitests breiteres Verhalten für geänderte Tests zurückfallen soll.
- `pnpm changed:lanes`: zeigt die architektonischen Lanes, die durch den Diff gegen `origin/main` ausgelöst werden.
- `pnpm check:changed`: führt das intelligente Check-Gate für Änderungen gegen `origin/main` aus. Es führt Typecheck-, Lint- und Guard-Befehle für die betroffenen architektonischen Lanes aus, führt aber keine Vitest-Tests aus. Verwenden Sie `pnpm test:changed` oder explizit `pnpm test <target>` als Testnachweis.
- `pnpm test`: leitet explizite Datei-/Verzeichnisziele durch scoped Vitest-Lanes. Läufe ohne Ziel verwenden feste Shard-Gruppen und expandieren für lokale parallele Ausführung zu Leaf-Konfigurationen; die Extension-Gruppe expandiert immer zu den Shard-Konfigurationen pro Extension statt zu einem einzigen riesigen Root-Projektprozess.
- Test-Wrapper-Läufe enden mit einer kurzen Zusammenfassung `[test] passed|failed|skipped ... in ...`. Vitests eigene Zeitdauerzeile bleibt das Detail pro Shard.
- Gemeinsamer OpenClaw-Testzustand: Verwenden Sie `src/test-utils/openclaw-test-state.ts` aus Vitest, wenn ein Test ein isoliertes `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, eine Konfigurations-Fixture, einen Workspace, ein Agent-Verzeichnis oder einen Auth-Profile-Store benötigt.
- Process-E2E-Helfer: Verwenden Sie `test/helpers/openclaw-test-instance.ts`, wenn ein Vitest-E2E-Test auf Prozessebene einen laufenden Gateway, eine CLI-Umgebung, Log-Erfassung und Bereinigung an einer Stelle benötigt.
- Docker-/Bash-E2E-Helfer: Lanes, die `scripts/lib/docker-e2e-image.sh` sourcen, können `docker_e2e_test_state_shell_b64 <label> <scenario>` in den Container übergeben und mit `scripts/lib/openclaw-e2e-instance.sh` decodieren; Multi-Home-Skripte können `docker_e2e_test_state_function_b64` übergeben und in jedem Ablauf `openclaw_test_state_create <label> <scenario>` aufrufen. Aufrufer auf niedrigerer Ebene können `scripts/lib/openclaw-test-state.mjs shell --label <name> --scenario <name>` für ein Shell-Snippet im Container verwenden oder `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` für eine sourcebare Host-Env-Datei. Das `--` vor `create` verhindert, dass neuere Node-Runtimes `--env-file` als Node-Flag behandeln. Docker-/Bash-Lanes, die einen Gateway starten, können `scripts/lib/openclaw-e2e-instance.sh` im Container sourcen für Entrypoint-Auflösung, Mock-OpenAI-Start, Start des Gateway im Vorder-/Hintergrund, Bereitschaftsprüfungen, Export der Zustandsumgebung, Log-Dumps und Prozessbereinigung.
- Full-, Extension- und Include-Pattern-Shard-Läufe aktualisieren lokale Timing-Daten in `.artifacts/vitest-shard-timings.json`; spätere Whole-Config-Läufe verwenden diese Timings, um langsame und schnelle Shards auszubalancieren. Include-Pattern-CI-Shards hängen den Shard-Namen an den Timing-Schlüssel an, wodurch gefilterte Shard-Timings sichtbar bleiben, ohne Whole-Config-Timing-Daten zu ersetzen. Setzen Sie `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, um das lokale Timing-Artefakt zu ignorieren.
- Ausgewählte `plugin-sdk`- und `commands`-Testdateien werden jetzt durch dedizierte leichte Lanes geleitet, die nur `test/setup.ts` behalten, während runtime-lastige Fälle auf ihren bestehenden Lanes bleiben.
- Quelldateien mit benachbarten Tests werden zuerst diesem benachbarten Test zugeordnet, bevor sie auf breitere Verzeichnis-Globs zurückfallen. Helferänderungen unter `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` und `src/plugins/contracts` verwenden einen lokalen Importgraph, um importierende Tests auszuführen, statt jeden Shard breit auszuführen, wenn der Abhängigkeitspfad präzise ist.
- `auto-reply` wird jetzt außerdem in drei dedizierte Konfigurationen (`core`, `top-level`, `reply`) aufgeteilt, damit das Reply-Harness die leichteren Top-Level-Status-/Token-/Helfertests nicht dominiert.
- Die Basis-Vitest-Konfiguration verwendet jetzt standardmäßig `pool: "threads"` und `isolate: false`, wobei der gemeinsame nicht isolierte Runner über die Repository-Konfigurationen hinweg aktiviert ist.
- `pnpm test:channels` führt `vitest.channels.config.ts` aus.
- `pnpm test:extensions` und `pnpm test extensions` führen alle Extension-/Plugin-Shards aus. Schwere Channel-Plugins, das Browser-Plugin und OpenAI laufen als dedizierte Shards; andere Plugin-Gruppen bleiben gebündelt. Verwenden Sie `pnpm test extensions/<id>` für eine einzelne gebündelte Plugin-Lane.
- `pnpm test:perf:imports`: aktiviert Vitest-Berichte zu Importdauer und Importaufschlüsselung, während weiterhin scoped Lane-Routing für explizite Datei-/Verzeichnisziele verwendet wird.
- `pnpm test:perf:imports:changed`: dasselbe Import-Profiling, aber nur für Dateien, die seit `origin/main` geändert wurden.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` benchmarked den gerouteten Changed-Mode-Pfad gegen den nativen Root-Projektlauf für denselben committeten Git-Diff.
- `pnpm test:perf:changed:bench -- --worktree` benchmarked den aktuellen Worktree-Änderungssatz, ohne vorher zu committen.
- `pnpm test:perf:profile:main`: schreibt ein CPU-Profil für den Vitest-Hauptthread (`.artifacts/vitest-main-profile`).
- `pnpm test:perf:profile:runner`: schreibt CPU- und Heap-Profile für den Unit-Runner (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: führt jede Full-Suite-Vitest-Leaf-Konfiguration seriell aus und schreibt gruppierte Laufzeitdaten plus JSON-/Log-Artefakte pro Konfiguration. Der Test Performance Agent verwendet dies als Baseline, bevor er versucht, langsame Tests zu beheben.
- `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json`: vergleicht gruppierte Berichte nach einer performanceorientierten Änderung.
- Gateway-Integration: Opt-in über `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` oder `pnpm test:gateway`.
- `pnpm test:e2e`: Führt Gateway-End-to-End-Smoke-Tests aus (Multi-Instance-WS/HTTP/Node-Pairing). Standardmäßig `threads` + `isolate: false` mit adaptiven Workern in `vitest.e2e.config.ts`; konfigurieren Sie dies mit `OPENCLAW_E2E_WORKERS=<n>` und setzen Sie `OPENCLAW_E2E_VERBOSE=1` für ausführliche Logs.
- `pnpm test:live`: Führt Provider-Live-Tests aus (minimax/zai). Erfordert API-Schlüssel und `LIVE=1` (oder Provider-spezifisch `*_LIVE_TEST=1`), um das Überspringen aufzuheben.
- `pnpm test:docker:all`: Baut das gemeinsame Live-Test-Image, packt OpenClaw einmal als npm-Tarball, baut/verwendet ein minimales Node-/Git-Runner-Image plus ein Funktions-Image, das diesen Tarball in `/app` installiert, und führt dann Docker-Smoke-Lanes mit `OPENCLAW_SKIP_DOCKER_BUILD=1` über einen gewichteten Scheduler aus. Das minimale Image (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`) wird für Installer-/Update-/Plugin-Abhängigkeits-Lanes verwendet; diese Lanes mounten den vorgebauten Tarball, statt kopierte Repository-Quellen zu verwenden. Das Funktions-Image (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`) wird für normale Built-App-Funktions-Lanes verwendet. `scripts/package-openclaw-for-docker.mjs` ist der einzige lokale/CI-Package-Packer und validiert den Tarball plus `dist/postinstall-inventory.json`, bevor Docker ihn verwendet. Docker-Lane-Definitionen liegen in `scripts/lib/docker-e2e-scenarios.mjs`; die Planerlogik liegt in `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` führt den ausgewählten Plan aus. `node scripts/test-docker-all.mjs --plan-json` gibt den Scheduler-eigenen CI-Plan für ausgewählte Lanes, Image-Arten, Paket-/Live-Image-Bedarf, Zustandsszenarien und Zugangsdatenprüfungen aus, ohne Docker zu bauen oder auszuführen. `OPENCLAW_DOCKER_ALL_PARALLELISM=<n>` steuert Prozess-Slots und ist standardmäßig 10; `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM=<n>` steuert den Provider-sensitiven Tail-Pool und ist standardmäßig 10. Schwere Lane-Caps sind standardmäßig `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` und `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; Provider-Caps sind standardmäßig eine schwere Lane pro Provider über `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT=4`, `OPENCLAW_DOCKER_ALL_LIVE_CODEX_LIMIT=4` und `OPENCLAW_DOCKER_ALL_LIVE_GEMINI_LIMIT=4`. Verwenden Sie `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` oder `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` für größere Hosts. Wenn eine Lane die effektive Gewichts- oder Ressourcengrenze auf einem Host mit geringer Parallelität überschreitet, kann sie trotzdem aus einem leeren Pool starten und läuft allein, bis sie Kapazität freigibt. Lane-Starts werden standardmäßig um 2 Sekunden gestaffelt, um lokale Docker-Daemon-Create-Stürme zu vermeiden; überschreiben Sie dies mit `OPENCLAW_DOCKER_ALL_START_STAGGER_MS=<ms>`. Der Runner prüft Docker standardmäßig vorab, bereinigt veraltete OpenClaw-E2E-Container, gibt alle 30 Sekunden den Status aktiver Lanes aus, teilt Provider-CLI-Tool-Caches zwischen kompatiblen Lanes, wiederholt vorübergehende Live-Provider-Fehler standardmäßig einmal (`OPENCLAW_DOCKER_ALL_LIVE_RETRIES=<n>`) und speichert Lane-Timings in `.artifacts/docker-tests/lane-timings.json` für eine Reihenfolge nach den längsten Läufen bei späteren Ausführungen. Verwenden Sie `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, um das Lane-Manifest auszugeben, ohne Docker auszuführen, `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS=<ms>`, um die Statusausgabe anzupassen, oder `OPENCLAW_DOCKER_ALL_TIMINGS=0`, um Timing-Wiederverwendung zu deaktivieren. Verwenden Sie `OPENCLAW_DOCKER_ALL_LIVE_MODE=skip` nur für deterministische/lokale Lanes oder `OPENCLAW_DOCKER_ALL_LIVE_MODE=only` nur für Live-Provider-Lanes; Paket-Aliasse sind `pnpm test:docker:local:all` und `pnpm test:docker:live:all`. Der Nur-Live-Modus führt Haupt- und Tail-Live-Lanes in einem Pool mit längsten Läufen zuerst zusammen, sodass Provider-Buckets Claude-, Codex- und Gemini-Arbeit gemeinsam packen können. Der Runner plant nach dem ersten Fehler keine neuen gepoolten Lanes mehr ein, sofern `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` nicht gesetzt ist, und jede Lane hat einen 120-Minuten-Fallback-Timeout, der mit `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS` überschrieben werden kann; ausgewählte Live-/Tail-Lanes verwenden engere Caps pro Lane. CLI-Backend-Docker-Setup-Befehle haben ihren eigenen Timeout über `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS` (Standard 180). Logs pro Lane, `summary.json`, `failures.json` und Phasen-Timings werden unter `.artifacts/docker-tests/<run-id>/` geschrieben; verwenden Sie `pnpm test:docker:timings <summary.json>`, um langsame Lanes zu untersuchen, und `pnpm test:docker:rerun <run-id|summary.json|failures.json>`, um günstige zielgerichtete Wiederholungsbefehle auszugeben.
- `pnpm test:docker:browser-cdp-snapshot`: Baut einen Chromium-basierten Source-E2E-Container, startet rohes CDP plus einen isolierten Gateway, führt `browser doctor --deep` aus und verifiziert, dass CDP-Rollen-Snapshots Link-URLs, per Cursor hervorgehobene anklickbare Elemente, iframe-Refs und Frame-Metadaten enthalten.
- CLI-Backend-Live-Docker-Probes können als fokussierte Lanes ausgeführt werden, zum Beispiel `pnpm test:docker:live-cli-backend:codex`, `pnpm test:docker:live-cli-backend:codex:resume` oder `pnpm test:docker:live-cli-backend:codex:mcp`. Claude und Gemini haben passende `:resume`- und `:mcp`-Aliasse.
- `pnpm test:docker:openwebui`: Startet dockerisiertes OpenClaw + Open WebUI, meldet sich über Open WebUI an, prüft `/api/models` und führt dann einen echten proxied Chat über `/api/chat/completions` aus. Erfordert einen verwendbaren Live-Modellschlüssel (zum Beispiel OpenAI in `~/.profile`), zieht ein externes Open-WebUI-Image und wird voraussichtlich nicht so CI-stabil sein wie die normalen Unit-/E2E-Suites.
- `pnpm test:docker:mcp-channels`: Startet einen vorbereiteten Gateway-Container und einen zweiten Client-Container, der `openclaw mcp serve` startet, und verifiziert anschließend die Erkennung gerouteter Konversationen, Transkript-Lesevorgänge, Anhangsmetadaten, das Verhalten der Live-Ereigniswarteschlange, das Routing ausgehender Sendungen sowie Claude-artige Kanal- und Berechtigungsbenachrichtigungen über die echte stdio-Bridge. Die Claude-Benachrichtigungsprüfung liest die rohen stdio-MCP-Frames direkt, sodass der Smoke-Test widerspiegelt, was die Bridge tatsächlich ausgibt.
- `pnpm test:docker:upgrade-survivor`: Installiert den gepackten OpenClaw-Tarball über eine schmutzige Fixture eines alten Benutzers, führt ein Paket-Update sowie den nicht interaktiven Doctor ohne Live-Provider- oder Kanalschlüssel aus, startet anschließend ein Loopback-Gateway und prüft, dass Agents, Kanalkonfiguration, Plugin-Zulassungslisten, Workspace-/Sitzungsdateien, veralteter Legacy-Plugin-Abhängigkeitszustand, Startvorgang und RPC-Status erhalten bleiben.
- `pnpm test:docker:published-upgrade-survivor`: Installiert standardmäßig `openclaw@latest`, legt realistische Dateien eines bestehenden Benutzers ohne Live-Provider- oder Kanalschlüssel an, konfiguriert diese Baseline mit einem eingebetteten `openclaw config set`-Befehlsrezept, aktualisiert diese veröffentlichte Installation auf den gepackten OpenClaw-Tarball, führt den nicht interaktiven Doctor aus, schreibt `.artifacts/upgrade-survivor/summary.json`, startet anschließend ein Loopback-Gateway und prüft, dass konfigurierte Intents, Workspace-/Sitzungsdateien, veraltete Plugin-Konfiguration und Legacy-Abhängigkeitszustand, Startvorgang, `/healthz`, `/readyz` und RPC-Status erhalten bleiben oder sauber repariert werden. Überschreiben Sie eine Baseline mit `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, erweitern Sie eine exakte lokale Matrix mit `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` wie `openclaw@2026.5.2 openclaw@2026.4.23 openclaw@2026.4.15`, oder fügen Sie Szenario-Fixtures mit `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` hinzu; die reported-issues-Menge enthält `configured-plugin-installs`, um zu verifizieren, dass konfigurierte externe OpenClaw-Plugins während des Upgrades automatisch installiert werden, sowie `stale-source-plugin-shadow`, damit reine Quell-Plugin-Schatten den Start nicht unterbrechen. Package Acceptance stellt diese als `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` und `published_upgrade_survivor_scenarios` bereit und löst Meta-Baseline-Tokens wie `last-stable-4` oder `all-since-2026.4.23` auf, bevor exakte Paketspezifikationen an Docker-Lanes übergeben werden.
- `pnpm test:docker:update-migration`: Führt das Published-Upgrade-Survivor-Harness im bereinigungsintensiven Szenario `plugin-deps-cleanup` aus und startet standardmäßig bei `openclaw@2026.4.23`. Der separate Workflow `Update Migration` erweitert diese Lane mit `baselines=all-since-2026.4.23`, sodass jedes stabile veröffentlichte Paket ab `.23` auf den Kandidaten aktualisiert wird und die Bereinigung konfigurierter Plugin-Abhängigkeiten außerhalb der Full Release CI nachweist.
- `pnpm test:docker:plugins`: Führt Installations-/Update-Smoke-Tests für lokale Pfade, `file:`, npm-Registry-Pakete mit gehobenen Abhängigkeiten, bewegliche Git-Refs, ClawHub-Fixtures, Marketplace-Updates sowie Aktivierung/Inspektion des Claude-Bundles aus.

## Lokales PR-Gate

Führen Sie für lokale Prüfungen zum Landen/Gate von PRs Folgendes aus:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Wenn `pnpm test` auf einem ausgelasteten Host flakt, führen Sie es einmal erneut aus, bevor Sie es als Regression behandeln, und isolieren Sie dann mit `pnpm test <path/to/test>`. Verwenden Sie für speicherbeschränkte Hosts:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Benchmark für Modelllatenz (lokale Schlüssel)

Skript: [`scripts/bench-model.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/bench-model.ts)

Verwendung:

- `source ~/.profile && pnpm tsx scripts/bench-model.ts --runs 10`
- Optionale Umgebungsvariablen: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`
- Standard-Prompt: "Antworte mit einem einzelnen Wort: ok. Keine Satzzeichen oder zusätzlicher Text."

Letzter Lauf (2025-12-31, 20 Läufe):

- minimax Median 1279 ms (Min. 1114, Max. 2431)
- opus Median 2454 ms (Min. 1224, Max. 3170)

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

Presets:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `tasks --json`, `tasks list --json`, `tasks audit --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: beide Presets

Die Ausgabe enthält `sampleCount`, Durchschnitt, p50, p95, Min./Max., Exit-Code-/Signal-Verteilung und Zusammenfassungen des maximalen RSS für jeden Befehl. Optional schreibt `--cpu-prof-dir` / `--heap-prof-dir` V8-Profile pro Lauf, sodass Timing und Profilerfassung denselben Harness verwenden.

Konventionen für gespeicherte Ausgaben:

- `pnpm test:startup:bench:smoke` schreibt das gezielte Smoke-Artefakt nach `.artifacts/cli-startup-bench-smoke.json`
- `pnpm test:startup:bench:save` schreibt das Artefakt der vollständigen Suite nach `.artifacts/cli-startup-bench-all.json` mit `runs=5` und `warmup=1`
- `pnpm test:startup:bench:update` aktualisiert die eingecheckte Baseline-Fixture unter `test/fixtures/cli-startup-bench.json` mit `runs=5` und `warmup=1`

Eingecheckte Fixture:

- `test/fixtures/cli-startup-bench.json`
- Aktualisieren mit `pnpm test:startup:bench:update`
- Aktuelle Ergebnisse mit `pnpm test:startup:bench:check` mit der Fixture vergleichen

## Onboarding-E2E (Docker)

Docker ist optional; dies ist nur für containerisierte Onboarding-Smoke-Tests erforderlich.

Vollständiger Kaltstartablauf in einem sauberen Linux-Container:

```bash
scripts/e2e/onboard-docker.sh
```

Dieses Skript steuert den interaktiven Assistenten über ein Pseudo-TTY, verifiziert Konfigurations-/Workspace-/Sitzungsdateien, startet dann das Gateway und führt `openclaw health` aus.

## QR-Import-Smoke-Test (Docker)

Stellt sicher, dass der gepflegte QR-Runtime-Helper unter den unterstützten Docker-Node-Runtimes geladen wird (Node 24 Standard, Node 22 kompatibel):

```bash
pnpm test:docker:qr
```

## Verwandte Themen

- [Tests](/de/help/testing)
- [Live-Tests](/de/help/testing-live)
- [Updates und Plugins testen](/de/help/testing-updates-plugins)
