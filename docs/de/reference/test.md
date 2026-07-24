---
read_when:
    - Tests ausführen oder beheben
summary: So führen Sie Tests lokal aus (vitest) und wann Sie Force-/Coverage-Modi verwenden sollten
title: Tests
x-i18n:
    generated_at: "2026-07-24T05:21:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 391185703e853bb523e1396eb22da4693d10d47b1644d3b2a51707d329f67dae
    source_path: reference/test.md
    workflow: 16
---

- Vollständiges Test-Kit (Testsuiten, Live-Tests, Docker): [Tests](/de/help/testing)
- Validierung von Updates und Plugin-Paketen: [Updates und Plugins testen](/de/help/testing-updates-plugins)

## Standardvorgehen für Agents

Agent-Sitzungen führen einen oder wenige fokussierte Tests und kostengünstige statische Prüfungen nur dann lokal aus,
wenn die Quelle vertrauenswürdig und die vorhandene Abhängigkeitsinstallation einsatzbereit ist. Führen Sie niemals
Repository-Werkzeuge aus nicht vertrauenswürdigen Quellen lokal aus. Größere Testsuiten, Änderungsprüfungen mit
Typecheck-/Lint-Auffächerung, Builds, Docker-, Paket- und E2E-Lanes, Live-Nachweise sowie
plattformübergreifende Validierungen werden über Crabbox remote ausgeführt. Für aufwendige Nachweise durch vertrauenswürdige Maintainer
wird standardmäßig Blacksmith Testbox verwendet. Der konfigurierte Testbox-Workflow
stellt Anmeldedaten bereit. Daher muss nicht vertrauenswürdiger Code von Mitwirkenden oder Forks stattdessen
geheimnisfreie Fork-CI oder eine bereinigte direkte AWS-Crabbox verwenden.

Wärmen Sie die Umgebung nicht vorsorglich für erwartete Arbeiten vor. Fordern Sie das Backend erst dann bei Bedarf an, wenn
der erste aufwendige Befehl bereit ist, verwenden Sie die zurückgegebene `tbx_...`-ID für spätere aufwendige
Befehle erneut, synchronisieren Sie bei jeder Ausführung den aktuellen Checkout und stoppen Sie das Backend vor der Übergabe.

Nach der ersten erfolgreichen Wiederverwendung zeichnet der Wrapper die Basis, die
Abhängigkeiten und den Fingerabdruck des Testbox-Workflows der Lease unter `.crabbox/testbox-leases/` auf.
Bei reinen Quelltextänderungen wird die vorgewärmte Box weiterhin verwendet. Eine geänderte Merge-Basis, Lockfile,
Paketmanager-Eingabe, ein geänderter Wrapper oder Testbox-Workflow führt zu einem sicheren Abbruch und erfordert eine
neue Lease. Bei jeder Ausführung wird weiterhin der aktuelle Checkout synchronisiert.
`OPENCLAW_TESTBOX_ALLOW_STALE=1` dient ausschließlich der gezielten Diagnose, nicht
dem Release-Nachweis.

Die nachstehenden lokalen Testbefehle sind für menschliche Workflows und begrenzte Agent-Nachweise vorgesehen.
Die Nichtverfügbarkeit des Remote-Providers muss gemeldet werden; sie erlaubt nicht,
stillschweigend eine umfassende lokale Prüfung auszuführen.

Wärmen Sie für aufwendige Nachweise mit nicht vertrauenswürdigem Code bei Bedarf mit `--provider aws` vor. Jede Ausführung muss
`CRABBOX_ENV_ALLOW=CI` setzen, `--provider aws --no-hydrate` übergeben und
vor der Installation von Abhängigkeiten oder der Ausführung von
Tests eine neue temporäre Remote-`HOME` verwenden. Verwenden Sie eine neu vorgewärmte Lease, die ausschließlich dieser nicht vertrauenswürdigen Quelle dient; verwenden Sie niemals
eine vertrauenswürdige oder zuvor mit Anmeldedaten ausgestattete Lease erneut. Starten Sie ein installiertes, vertrauenswürdiges Crabbox-
Binary aus einem sauberen, vertrauenswürdigen `main`-Checkout und rufen Sie mit
`--fresh-pr` ausschließlich den Remote-PR ab; führen Sie niemals den Wrapper oder die Konfiguration des nicht vertrauenswürdigen Checkouts lokal aus.
Entfernen Sie `CRABBOX_AWS_INSTANCE_PROFILE` und brechen Sie sicher ab, sofern das aufgelöste
`aws.instanceProfile` nicht leer ist. Verwenden Sie vor jeder Installation bzw. jedem Test vertrauenswürdige
Werkzeuge mit absoluten Pfaden, um ein IMDSv2-Token zu verlangen, nachzuweisen, dass der Endpunkt für IAM-Anmeldedaten
404 zurückgibt, und zu überprüfen, dass die Remote-`git rev-parse HEAD` dem vollständigen
SHA des geprüften PR-Heads entspricht. Binden Sie die Lease an diesen SHA und stoppen bzw. erwärmen Sie sie erneut, wenn sich der Head
ändert. Laden Sie die vertrauenswürdige Datei `scripts/crabbox-untrusted-bootstrap.sh` aus dem sauberen
`main` zusammen mit `--fresh-pr` hoch; sie installiert festgelegte Node-/pnpm-Versionen, überprüft den SHA
und die Paketmanager-Festlegung, isoliert `HOME`, installiert Abhängigkeiten und führt anschließend
den angeforderten Test aus. Wenn der Broker nicht nachweisen kann, dass keine Rolle vorhanden ist, oder kein Remote-PR existiert,
verwenden Sie geheimnisfreie Fork-CI. Verwenden Sie weder `hydrate-github` noch `--no-sync` oder einen
mit Anmeldedaten ausgestatteten Testbox-Workflow.
Entfernen Sie alle `CRABBOX_TAILSCALE*`-Überschreibungen, erzwingen Sie `--network public
--tailscale=false`, löschen Sie Exit-Node-/LAN-Flags und verlangen Sie, dass `crabbox inspect`
öffentliche Netzwerkanbindung ohne Tailscale-Status meldet, bevor Sie ein Skript hochladen.

## Übliche lokale Reihenfolge

1. `pnpm test:changed` für Vitest-Nachweise im geänderten Umfang.
2. `pnpm test <path-or-filter>` für eine Datei, ein Verzeichnis oder ein explizites Ziel.
3. `pnpm test` nur, wenn Sie bewusst die vollständige lokale Vitest-Testsuite benötigen.

In einem Codex-Worktree oder einem verknüpften bzw. Sparse-Checkout vermeiden Agents die direkte lokale Verwendung von
`pnpm test*` / `pnpm check*` / `pnpm crabbox:run`:

- Begrenzter fokussierter Nachweis mit einsatzbereiten Abhängigkeiten:
  `node scripts/run-vitest.mjs <path-or-filter>`.
- Änderungsprüfung mit vorheriger Klassifizierung: `node scripts/check-changed.mjs`; reine Dokumentations-,
  unveränderte und kleine Metadatenpläne bleiben lokal, wenn die Abhängigkeiten einsatzbereit sind,
  während aufwendige Pläne oder Pläne mit fehlenden Abhängigkeiten an Testbox delegiert werden.
- Expliziter umfassender Nachweis mit beibehaltener Lease: `node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox ... -- env OPENCLAW_CHECK_CHANGED_REMOTE_CHILD=1 OPENCLAW_CHANGED_LANES_RAW_SYNC=1 corepack pnpm check:changed`, damit pnpm innerhalb von Testbox ausgeführt wird.
- Die abschließende `exitCode`-Meldung und das Zeitmessungs-JSON des Wrappers bilden das Befehlsergebnis. Eine delegierte Ausführung über Blacksmith GitHub Actions kann nach einem erfolgreichen SSH-Befehl `cancelled` anzeigen, weil Testbox außerhalb der Keepalive-Action gestoppt wird; prüfen Sie die Wrapper-Zusammenfassung und die Befehlsausgabe, bevor Sie dies als Fehler behandeln.
- `OPENCLAW_HEAVY_CHECK_LOCK_SCOPE=worktree <local-heavy-check command>`: hält die Serialisierung aufwendiger Prüfungen innerhalb des aktuellen Worktrees statt im gemeinsamen Git-Verzeichnis für Befehle wie `pnpm check:changed` und gezielte `pnpm test ...`. Verwenden Sie dies nur auf leistungsfähigen lokalen Hosts, wenn Sie bewusst unabhängige Prüfungen über verknüpfte Worktrees hinweg ausführen.

## Kernbefehle

Ausführungen des Test-Wrappers enden mit einer kurzen `[test] passed|failed|skipped ... in ...`-Zusammenfassung; die eigene Laufzeitzeile von Vitest bleibt die Detailangabe je Shard.

| Befehl                                            | Funktion                                                                                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test`                                       | Explizite Datei-/Verzeichnisziele werden über bereichsspezifische Vitest-Lanes geleitet. Ausführungen ohne Ziel dienen als Nachweis der vollständigen Testsuite: Feste Shard-Gruppen werden für die lokale parallele Ausführung zu Blattkonfigurationen erweitert, wobei die erwartete Shard-Auffächerung vor dem Start ausgegeben wird. Die Erweiterungsgruppe wird stets zu Shard-Konfigurationen je Erweiterung erweitert, statt in einem einzigen riesigen Root-Projekt-Prozess ausgeführt zu werden. |
| `pnpm test:changed`                               | Kostengünstige intelligente Ausführung geänderter Tests: präzise Ziele aus direkten Teständerungen, gleichgeordneten `*.test.ts`-Dateien, expliziten Quellzuordnungen und dem lokalen Importgraphen. Umfassende Konfigurations-/Paketänderungen werden übersprungen, sofern sie sich nicht präzisen Tests zuordnen lassen. |
| `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` | Explizite umfassende Ausführung geänderter Tests; verwenden Sie sie, wenn eine Änderung an Test-Harness, Konfiguration oder Paket auf das umfassendere Verhalten von Vitest für geänderte Tests zurückfallen soll. |
| `pnpm test:force`                                 | Gibt den konfigurierten OpenClaw-Gateway-Port frei (Standard: `18789`) und führt anschließend die vollständige Testsuite mit einem isolierten Gateway-Port aus, damit Servertests nicht mit einer laufenden Instanz kollidieren. |
| `pnpm test:coverage`                              | Erstellt einen informativen V8-Abdeckungsbericht für die standardmäßige Unit-Lane (`vitest.unit.config.ts`); es werden keine Abdeckungsschwellenwerte erzwungen. |
| `pnpm test:coverage:changed`                      | Unit-Testabdeckung nur für Dateien, die seit `origin/main` geändert wurden. |
| `pnpm changed:lanes`                              | Zeigt die durch den Diff gegenüber `origin/main` ausgelösten Architekturlanes. |
| `pnpm check:changed`                              | Klassifiziert die geänderten Lanes vor der Auswahl der Ausführung. Reine Dokumentations-, unveränderte und kleine Metadatenpläne bleiben lokal, wenn die Abhängigkeiten einsatzbereit sind; Pläne mit Typecheck-/Lint-Auffächerung, anderen aufwendigen Lanes oder fehlenden lokalen Abhängigkeiten werden außerhalb der CI an Crabbox/Testbox delegiert. Führt Vitest nicht aus; verwenden Sie `pnpm test:changed` oder `pnpm test <target>` für Testnachweise. |

## Gemeinsamer Teststatus und Prozesshilfen

- `src/test-utils/openclaw-test-state.ts`: in Vitest verwenden, wenn ein Test eine isolierte `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, Konfigurations-Fixture, einen Workspace, ein Agent-Verzeichnis oder einen Speicher für Authentifizierungsprofile benötigt.
- `pnpm test:env-mutations:report`: nicht blockierender Bericht über Tests/Harnesses, die `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_WORKSPACE_DIR` oder zugehörige Umgebungsschlüssel direkt verändern. Verwenden Sie ihn, um Migrationskandidaten für die gemeinsame Teststatus-Hilfsfunktion zu finden.
- `test/helpers/openclaw-test-instance.ts`: E2E-Tests auf Prozessebene, die einen laufenden Gateway, eine CLI-Umgebung, Protokollerfassung und Bereinigung an einer zentralen Stelle benötigen.
- Docker-/Bash-E2E-Lanes, die `scripts/lib/docker-e2e-image.sh` einbinden, können `docker_e2e_test_state_shell_b64 <label> <scenario>` an den Container übergeben und mit `scripts/lib/openclaw-e2e-instance.sh` dekodieren; Skripte mit mehreren Home-Verzeichnissen können `docker_e2e_test_state_function_b64` übergeben und in jedem Ablauf `openclaw_test_state_create <label> <scenario>` aufrufen. `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` schreibt eine einbindbare Host-Umgebungsdatei (das `--` vor `create` verhindert, dass neuere Node-Laufzeiten `--env-file` als Node-Flag behandeln). Lanes, die einen Gateway starten, können `scripts/lib/openclaw-e2e-instance.sh` für die Auflösung des Einstiegspunkts, den Start eines OpenAI-Mocks, den Start im Vorder- bzw. Hintergrund, Bereitschaftsprüfungen, den Export der Statusumgebung, Protokollausgaben und die Prozessbereinigung einbinden.

## Control UI, TUI und Erweiterungs-Lanes

- **Gemockte E2E-Tests der Control UI:** `pnpm test:ui:e2e` führt die Vitest- und Playwright-Lane aus, die die Vite Control UI startet und eine echte Chromium-Seite gegen einen gemockten Gateway-WebSocket steuert. Die Tests befinden sich in `ui/src/**/*.e2e.test.ts`; gemeinsame Mocks und Steuerelemente befinden sich in `ui/src/test-helpers/control-ui-e2e.ts`. `pnpm test:e2e` umfasst diese Lane. Agent-Ausführungen verwenden standardmäßig Testbox/Crabbox, einschließlich gezielter Nachweise; verwenden Sie `node scripts/run-vitest.mjs run --config test/vitest/vitest.ui-e2e.config.ts --configLoader runner ui/src/ui/e2e/chat-flow.e2e.test.ts` nur für einen ausdrücklich festgelegten lokalen Fallback.
- **TUI-PTY-Tests:** `node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts` führt die schnelle PTY-Lane mit simuliertem Backend aus. `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` oder `pnpm tui:pty:test:watch --mode local` führt den langsameren `tui --local`-Smoke-Test aus, der nur den externen Modellendpunkt mockt. Prüfen Sie stabilen sichtbaren Text oder Fixture-Aufrufe, nicht rohe ANSI-Snapshots.
- `pnpm test:extensions` und `pnpm test extensions` führen alle Erweiterungs-/Plugin-Shards aus. Ressourcenintensive Kanal-Plugins, das Browser-Plugin und OpenAI werden als dedizierte Shards ausgeführt; andere Plugin-Gruppen bleiben gebündelt. `pnpm test extensions/<id>` führt eine Lane für ein einzelnes gebündeltes Plugin aus.
- Quelldateien mit Tests in Geschwisterdateien werden zunächst diesen Geschwisterdateien zugeordnet, bevor auf breitere Verzeichnis-Globs zurückgegriffen wird. Änderungen an Hilfsfunktionen unter `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` und `src/plugins/contracts` verwenden einen lokalen Importgraphen, um importierende Tests auszuführen, statt bei einem eindeutigen Abhängigkeitspfad jeden Shard umfassend auszuführen.
- Ziele in Vertragsverzeichnissen werden auf ihre Vertrags-Lanes verteilt: `pnpm test src/channels/plugins/contracts` führt die vier Konfigurationen für Kanalverträge aus und `pnpm test src/plugins/contracts` führt die Konfiguration für Plugin-Verträge aus, da die generischen Projekte `channels`/`plugins` `contracts/**` ausschließen.
- `auto-reply` wird in drei dedizierte Konfigurationen aufgeteilt (`core`, `top-level`, `reply`), damit das Antwort-Testgerüst die leichteren übergeordneten Status-/Token-/Hilfsfunktionstests nicht dominiert.
- Ausgewählte Testdateien aus `plugin-sdk` und `commands` werden über dedizierte ressourcenschonende Lanes geleitet, die nur `test/setup.ts` enthalten; laufzeitintensive Fälle verbleiben auf ihren bestehenden Lanes.
- Die Vitest-Basiskonfiguration verwendet standardmäßig `pool: "threads"` und `isolate: false`, wobei der gemeinsame nicht isolierte Runner für alle Repository-Konfigurationen aktiviert ist.
- `pnpm test:channels` führt `vitest.channels.config.ts` aus.

## Gateway und E2E

- Die Gateway-Integration ist optional zu aktivieren: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` oder `pnpm test:gateway`.
- `pnpm test:e2e`: Repository-E2E-Gesamtlauf = `pnpm test:e2e:gateway && pnpm test:ui:e2e`.
- `pnpm test:e2e:gateway`: Gateway-End-to-End-Smoke-Tests (WS-/HTTP-/Node-Kopplung mit mehreren Instanzen). Verwendet standardmäßig `threads` + `isolate: false` mit adaptiven Workern in `vitest.e2e.config.ts`; Anpassung mit `OPENCLAW_E2E_WORKERS=<n>`, ausführliche Protokolle mit `OPENCLAW_E2E_VERBOSE=1`.
- `pnpm test:live`: Live-Tests für Provider (Claude/Minimax/DeepSeek/z.ai/usw., gesteuert durch `*.live.test.ts`). Erfordert API-Schlüssel und `LIVE=1` (oder `OPENCLAW_LIVE_TEST=1`), um die Tests nicht zu überspringen; ausführliche Ausgabe mit `OPENCLAW_LIVE_TEST_QUIET=0`.

## Vollständige Docker-Suite (`pnpm test:docker:all`)

Erstellt das gemeinsame Live-Test-Image, verpackt OpenClaw einmalig als npm-Tarball, erstellt/verwendet ein minimales Node-/Git-Runner-Image sowie ein Funktions-Image, das diesen Tarball in `/app` installiert, und führt anschließend Docker-Smoke-Lanes über einen gewichteten Scheduler aus. `scripts/package-openclaw-for-docker.mjs` ist der einzige lokale/CI-Paket-Packer und validiert den Tarball sowie `dist/postinstall-inventory.json`, bevor Docker ihn verwendet.

- Minimales Image (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`): Lanes für Installation/Aktualisierung/Plugin-Abhängigkeiten; bindet den vorab erstellten Tarball ein, statt kopierte Repository-Quellen zu verwenden.
- Funktions-Image (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`): Lanes für die normale Funktionalität der erstellten Anwendung.
- Lane-Definitionen: `scripts/lib/docker-e2e-scenarios.mjs`. Planer: `scripts/lib/docker-e2e-plan.mjs`. Ausführer: `scripts/test-docker-all.mjs`.
- `node scripts/test-docker-all.mjs --plan-json` gibt den vom Scheduler verwalteten CI-Plan (Lanes, Image-Typen, Anforderungen an Paket-/Live-Images, Zustandsszenarien, Anmeldedatenprüfungen) aus, ohne Docker zu erstellen oder auszuführen.

Scheduler-Einstellungen (Umgebungsvariablen, Standardwerte in Klammern):

| Umgebungsvariable                                                                                               | Standardwert        | Zweck                                                                                                                                                                                                                                                                                      |
| --------------------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`                                                                               | 10                  | Prozess-Slots.                                                                                                                                                                                                                                                                             |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`                                                                          | 10                  | Provider-sensitiver Tail-Pool.                                                                                                                                                                                                                                                             |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`                                                                                | 9                   | Obergrenze für ressourcenintensive Live-Provider-Lanes.                                                                                                                                                                                                                                    |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`                                                                                 | 5                   | Obergrenze für Lanes mit npm-Ressourcen.                                                                                                                                                                                                                                                   |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`                                                                             | 7                   | Obergrenze für Lanes mit Dienstressourcen.                                                                                                                                                                                                                                                 |
| `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT` / `_CODEX_LIMIT` / `_GEMINI_LIMIT` / `_DROID_LIMIT` / `_OPENCODE_LIMIT` | 4                   | Provider-spezifische Obergrenzen für ressourcenintensive Lanes.                                                                                                                                                                                                                            |
| `OPENCLAW_DOCKER_ALL_LIVE_OPENAI_LIMIT` / `_TELEGRAM_LIMIT`                                                     | 1                   | Engere Provider-spezifische Obergrenzen.                                                                                                                                                                                                                                                   |
| `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` / `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`                                         | -                   | Überschreibung für größere Hosts.                                                                                                                                                                                                                                                          |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS`                                                                          | 2000                | Verzögerung zwischen Lane-Starts, um Erstellungsstürme beim lokalen Docker-Daemon zu vermeiden.                                                                                                                                                                                            |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`                                                                           | 7,200,000 (120 min) | Fallback-Zeitüberschreitung pro Lane; ausgewählte Live-/Tail-Lanes verwenden engere Obergrenzen.                                                                                                                                                                                           |
| `OPENCLAW_DOCKER_ALL_LIVE_RETRIES`                                                                              | 1                   | Wiederholungsversuche bei vorübergehenden Live-Provider-Fehlern.                                                                                                                                                                                                                           |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`                                                                                   | aus                 | Gibt das Lane-Manifest aus, ohne Docker auszuführen.                                                                                                                                                                                                                                       |
| `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS`                                                                        | 30000               | Intervall für die Statusausgabe aktiver Lanes.                                                                                                                                                                                                                                             |
| `OPENCLAW_DOCKER_ALL_TIMINGS`                                                                                   | ein                 | Verwendet `.artifacts/docker-tests/lane-timings.json` erneut für eine Sortierung mit den längsten zuerst; setzen Sie den Wert auf `0`, um dies zu deaktivieren.                                                                                                                                        |
| `OPENCLAW_DOCKER_ALL_LIVE_MODE`                                                                                 | -                   | `skip` nur für deterministische/lokale Lanes, `only` nur für Live-Provider-Lanes. Aliasse: `pnpm test:docker:local:all`, `pnpm test:docker:live:all`. Der Nur-Live-Modus führt Haupt- und Tail-Live-Lanes in einem einzigen, nach längsten zuerst sortierten Pool zusammen, sodass Provider-Buckets Claude-/Codex-/Gemini-Aufgaben gemeinsam bündeln. |
| `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS`                                                               | 180                 | Zeitüberschreitung für die Docker-Einrichtung des CLI-Backends.                                                                                                                                                                                                                            |

Das Muster für Umgebungsvariablen von Ressourcenobergrenzen lautet `OPENCLAW_DOCKER_ALL_<RESOURCE>_LIMIT` (Ressourcenname in Großbuchstaben, nicht alphanumerische Zeichen zu `_` zusammengefasst).

Weiteres Verhalten: Der Runner führt standardmäßig einen Docker-Preflight durch, bereinigt veraltete OpenClaw-E2E-Container, teilt Caches für Provider-CLI-Tools zwischen kompatiblen Lanes und plant nach dem ersten Fehler keine neuen gepoolten Lanes mehr ein, sofern `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` nicht gesetzt ist. Wenn eine Lane auf einem Host mit geringer Parallelität die effektive Gewichtungs-/Ressourcenobergrenze überschreitet, kann sie dennoch aus einem leeren Pool starten und allein ausgeführt werden, bis sie Kapazität freigibt. Lane-spezifische Protokolle, `summary.json`, `failures.json` und Phasenzeiten werden unter `.artifacts/docker-tests/<run-id>/` geschrieben; verwenden Sie `pnpm test:docker:timings <summary.json>`, um langsame Lanes zu untersuchen, und `pnpm test:docker:rerun <run-id|summary.json|failures.json>`, um kostengünstige Befehle für gezielte Wiederholungsläufe auszugeben.

### Wichtige Docker-Lanes

| Befehl                                                                      | Überprüft                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test:docker:browser-cdp-snapshot`                                     | Chromium-gestützter Quell-E2E-Container mit direktem CDP und isoliertem Gateway; CDP-Rollen-Snapshots von `browser doctor --deep` enthalten Link-URLs, durch den Cursor als anklickbar erkannte Elemente, iframe-Referenzen und Frame-Metadaten.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `pnpm test:docker:skill-install`                                            | Installiert das gepackte Tarball in einem minimalistischen Docker-Runner mit `skills.install.allowUploadedArchives: false`, ermittelt über eine Live-ClawHub-Suche einen aktuellen Skill-Slug, installiert ihn über `openclaw skills install` und überprüft `SKILL.md`, `.clawhub/origin.json`, `.clawhub/lock.json` und `skills info --json`.                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `pnpm test:docker:live-cli-backend:claude`, `:claude:resume`, `:claude:mcp` | Gezielte Live-Prüfungen für CLI-Backends; Gemini verfügt über die entsprechenden Aliasse `:resume` und `:mcp`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `pnpm test:docker:openwebui`                                                | Dockerisiertes OpenClaw + Open WebUI: anmelden, `/api/models` prüfen und einen echten weitergeleiteten Chat über `/api/chat/completions` ausführen. Erfordert einen nutzbaren Schlüssel für ein Live-Modell und lädt ein externes Image herunter; es wird nicht dieselbe CI-Stabilität wie bei den Unit-/E2E-Suites erwartet.                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `pnpm test:docker:mcp-channels`                                             | Vorbereiteter Gateway-Container sowie ein Client-Container, der `openclaw mcp serve` startet: geroutete Konversationserkennung, Lesen von Transkripten, Anhangsmetadaten, Verhalten der Live-Ereigniswarteschlange, Routing ausgehender Sendungen sowie Benachrichtigungen zu Kanälen und Berechtigungen im Claude-Stil über die echte stdio-Bridge (die Assertion liest unverarbeitete stdio-MCP-Frames direkt).                                                                                                                                                                                                                                                                                                                                         |
| `pnpm test:docker:upgrade-survivor`                                         | Installiert das gepackte Tarball über einer veralteten Bestandsbenutzer-Fixture, führt ohne Live-Schlüssel für Provider/Kanäle eine Paketaktualisierung sowie Doctor im nicht interaktiven Modus aus, startet ein Loopback-Gateway und prüft, ob Agenten-/Kanalkonfiguration, Plugin-Zulassungslisten, Workspace-/Sitzungsdateien, veralteter Abhängigkeitsstatus von Legacy-Plugins, Start und RPC-Status erhalten bleiben.                                                                                                                                                                                                                                                                                                                             |
| `pnpm test:docker:published-upgrade-survivor`                               | Installiert standardmäßig `openclaw@latest`, legt realistische Dateien eines Bestandsbenutzers an, konfiguriert über ein integriertes `openclaw config set`-Rezept, aktualisiert auf das gepackte Tarball, führt Doctor im nicht interaktiven Modus aus, schreibt `.artifacts/upgrade-survivor/summary.json` und prüft `/healthz`, `/readyz` sowie den RPC-Status. Überschreiben Sie dies mit `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, erweitern Sie eine Matrix mit `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` oder fügen Sie Szenario-Fixtures mit `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` hinzu (enthält `configured-plugin-installs` und `stale-source-plugin-shadow`). Package Acceptance stellt diese als `published_upgrade_survivor_baseline(s)` / `_scenarios` bereit und löst Metatoken wie `last-stable-4` oder `all-since-2026.4.23` auf. |
| `pnpm test:docker:update-migration`                                         | Testsystem für das Überstehen einer veröffentlichten Aktualisierung im Szenario `plugin-deps-cleanup`, das standardmäßig bei `openclaw@2026.4.23` beginnt. Der Workflow `Update Migration` erweitert dies mit `baselines=all-since-2026.4.23`, um die Bereinigung von Abhängigkeiten konfigurierter Plugins außerhalb der vollständigen Release-CI nachzuweisen.                                                                                                                                                                                                                                                                                                                                                                                                   |
| `pnpm test:docker:plugins`                                                  | Installations-/Aktualisierungs-Smoke-Test für lokalen Pfad, `file:`, npm-Registry-Pakete mit hochgezogenen Abhängigkeiten, sich bewegende Git-Referenzen, ClawHub-Fixtures, Marketplace-Aktualisierungen sowie Aktivierung/Inspektion des Claude-Bundles.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |

## Lokales PR-Gate

Führen Sie für lokale Prüfungen zum Landen/Gating eines PR Folgendes aus:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Wenn `pnpm test` auf einem ausgelasteten Host sporadisch fehlschlägt, führen Sie es einmal erneut aus, bevor Sie es als Regression behandeln, und isolieren Sie es anschließend mit `pnpm test <path/to/test>`. Für Hosts mit begrenztem Arbeitsspeicher:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Tools für die Testleistung

- `pnpm test:perf:imports`: Aktiviert die Berichterstellung zu Vitest-Importdauer und Importaufschlüsselung, verwendet für explizite Datei-/Verzeichnisziele jedoch weiterhin das bereichsspezifische Lane-Routing. `pnpm test:perf:imports:changed` beschränkt dasselbe Profiling auf Dateien, die seit `origin/main` geändert wurden.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` vergleicht die Leistung des gerouteten Modus für Änderungen mit dem nativen Lauf des Root-Projekts für denselben committeten Git-Diff; `pnpm test:perf:changed:bench -- --worktree` misst den aktuellen Änderungssatz im Worktree, ohne ihn zuvor zu committen.
- `pnpm test:perf:profile:main` schreibt ein CPU-Profil für den Vitest-Hauptthread (`.artifacts/vitest-main-profile`); `pnpm test:perf:profile:runner` schreibt CPU- und Heap-Profile für den Unit-Runner (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: Führt jede Vitest-Blattkonfiguration der vollständigen Suite seriell aus und schreibt gruppierte Laufzeitdaten sowie JSON-/Protokollartefakte pro Konfiguration. Berichte der vollständigen Suite isolieren Dateien standardmäßig, damit beibehaltene Modulgraphen und GC-Pausen aus früheren Dateien nicht späteren Assertions zugerechnet werden; übergeben Sie `-- --no-isolate` nur, wenn Sie bewusst die Akkumulation in gemeinsam genutzten Workern profilieren. Der Agent für Testleistung verwendet dies als Ausgangsbasis, bevor er versucht, langsame Tests zu beheben. `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json` vergleicht gruppierte Berichte nach einer leistungsorientierten Änderung.
- Läufe für vollständige Suites, Erweiterungen und Include-Muster aktualisieren lokale Zeitmessdaten in `.artifacts/vitest-shard-timings.json`; spätere Läufe der gesamten Konfiguration verwenden diese Messwerte, um langsame und schnelle Shards auszugleichen. CI-Shards mit Include-Muster hängen den Shard-Namen an den Zeitmessschlüssel an, wodurch die Zeitmessungen gefilterter Shards sichtbar bleiben, ohne die Zeitmessdaten der gesamten Konfiguration zu ersetzen. Setzen Sie `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, um das lokale Zeitmessartefakt zu ignorieren.

## Benchmarks

<Accordion title="Modelllatenz (scripts/bench-model.ts)">

```bash
pnpm tsx scripts/bench-model.ts --runs 10
```

Optionale Umgebungsvariablen: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`. Standard-Prompt: „Antworten Sie mit einem einzigen Wort: ok. Keine Satzzeichen oder zusätzlichen Texte.“

</Accordion>

<Accordion title="CLI-Start (scripts/bench-cli-startup.ts)">

```bash
pnpm test:startup:bench
pnpm test:startup:bench:smoke
pnpm test:startup:bench:save
pnpm test:startup:bench:update
pnpm test:startup:bench:check
pnpm tsx scripts/bench-cli-startup.ts --runs 12
pnpm tsx scripts/bench-cli-startup.ts --preset real --case status --case gatewayStatus --runs 3
pnpm tsx scripts/bench-cli-startup.ts --entry openclaw.mjs --entry-secondary dist/entry.js --preset all
```

Voreinstellungen:

- `startup`: `--version`, `--help`, `health`, `health --json`, `status --json`, `status`
- `real`: `health`, `status`, `status --json`, `sessions`, `sessions --json`, `tasks --json`, `tasks list --json`, `tasks audit --json`, `agents list --json`, `gateway status`, `gateway status --json`, `gateway health --json`, `config get gateway.port`
- `all`: beide Voreinstellungen kombiniert

Die Ausgabe enthält `sampleCount`, Durchschnitt, p50, p95, Minimum/Maximum, die Verteilung von Exit-Codes/Signalen und den maximalen RSS-Wert pro Befehl. `--cpu-prof-dir` / `--heap-prof-dir` schreiben V8-Profile für jeden Durchlauf.

Gespeicherte Ausgabe: `pnpm test:startup:bench:smoke` schreibt `.artifacts/cli-startup-bench-smoke.json`; `pnpm test:startup:bench:save` schreibt `.artifacts/cli-startup-bench-all.json` (`runs=5 warmup=1`). Eingecheckte Fixture: `test/fixtures/cli-startup-bench.json`, aktualisiert durch `pnpm test:startup:bench:update`, verglichen durch `pnpm test:startup:bench:check`.

</Accordion>

<Accordion title="Gateway-Start (scripts/bench-gateway-startup.ts)">

Verwendet standardmäßig den gebauten CLI-Einstiegspunkt unter `dist/entry.js`; führen Sie zuerst `pnpm build` aus. Übergeben Sie `--entry scripts/run-node.mjs`, um stattdessen den Quellcode-Runner zu messen, und halten Sie diese Ergebnisse von den Baselines des gebauten Einstiegspunkts getrennt.

```bash
pnpm test:startup:gateway -- --runs 5 --warmup 1
pnpm test:startup:gateway -- --case skipChannels --case fiftyPlugins --runs 5
node --import tsx scripts/bench-gateway-startup.ts --case default --runs 5 --output .artifacts/gateway-startup.json
```

Fall-IDs: `default`, `skipChannels` (Kanalstart übersprungen), `oneInternalHook`, `allInternalHooks`, `fiftyPlugins` (50 Manifest-Plugins), `fiftyStartupLazyPlugins` (50 beim Start verzögert geladene Manifest-Plugins).

Die Ausgabe enthält die erste Prozessausgabe, `/healthz`, `/readyz`, die Zeit des HTTP-Listen-Logs, die Zeit des Gateway-Bereitschaftslogs, CPU-Zeit, CPU-Kernverhältnis, maximalen RSS-Wert, Heap, Metriken der Startablaufverfolgung, Event-Loop-Verzögerung und detaillierte Metriken der Plugin-Lookup-Tabelle. Das Skript setzt `OPENCLAW_GATEWAY_STARTUP_TRACE=1` in der Umgebung des untergeordneten Gateways.

`/healthz` steht für Erreichbarkeit (der HTTP-Server kann antworten). `/readyz` steht für Nutzungsbereitschaft (Plugin-Sidecars beim Start, Kanäle und für die Bereitschaft kritische Arbeiten nach dem Anhängen sind abgeschlossen). Start-Hooks werden asynchron ausgeführt und sind nicht Teil der Bereitschaftsgarantie. Die Zeit des Bereitschaftslogs ist der interne Zeitstempel des Gateways, der für die prozessseitige Zuordnung nützlich ist, aber die externe `/readyz`-Prüfung nicht ersetzt.

Verwenden Sie beim Vergleich von Änderungen die JSON-Ausgabe oder `--output`. Verwenden Sie `--cpu-prof-dir` nur, wenn die Ablaufverfolgung auf Import-, Kompilierungs- oder CPU-gebundene Arbeit hinweist, die sich nicht allein durch die Phasenzeiten erklären lässt.

</Accordion>

<Accordion title="Gateway-Neustart (scripts/bench-gateway-restart.ts)">

Nur macOS und Linux (verwendet SIGUSR1 für prozessinterne Neustarts; schlägt unter Windows sofort fehl). Es gelten derselbe standardmäßige gebaute Einstiegspunkt und dieselbe `--entry scripts/run-node.mjs`-Überschreibung wie beim Gateway-Start oben.

```bash
pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5
pnpm test:restart:gateway -- --case default --runs 3 --restarts 3 --warmup 1
```

Fall-IDs: `skipChannels`, `skipChannelsAcpxProbe` (ACPX-Startprüfung aktiviert), `skipChannelsNoAcpxProbe` (Prüfung deaktiviert), `default`, `fiftyPlugins`.

Die Ausgabe enthält den nächsten `/healthz`-Wert, den nächsten `/readyz`-Wert, Ausfallzeit, Zeit bis zur Bereitschaft nach dem Neustart, CPU, RSS, Metriken der Startablaufverfolgung für den Ersatzprozess sowie Neustart-Ablaufverfolgungsmetriken für Signalverarbeitung, das Leeren aktiver Arbeiten, Schließphasen, den nächsten Start, die Bereitschaftszeit und Speicher-Snapshots. Das Skript setzt `OPENCLAW_GATEWAY_STARTUP_TRACE=1` und `OPENCLAW_GATEWAY_RESTART_TRACE=1`.

Verwenden Sie diesen Benchmark, wenn eine Änderung die Neustartsignalisierung, Schließ-Handler, den Start nach einem Neustart, das Herunterfahren von Sidecars, die Dienstübergabe oder die Bereitschaft nach einem Neustart betrifft. Beginnen Sie mit `skipChannels`, um die Gateway-Mechanik vom Kanalstart zu isolieren; verwenden Sie `default` oder Plugin-intensive Fälle erst, nachdem der eng gefasste Fall den Neustartpfad erklärt hat. Ablaufverfolgungsmetriken sind Hinweise zur Zuordnung, keine abschließenden Bewertungen — beurteilen Sie eine Neustartänderung anhand mehrerer Stichproben, der zugehörigen Eigentümer-Spanne, des Verhaltens von `/healthz`/`/readyz` und des für Benutzer sichtbaren Neustartvertrags.

</Accordion>

## Onboarding-E2E (Docker)

Optional; nur für containerisierte Onboarding-Smoke-Tests erforderlich. Vollständiger Kaltstartablauf in einem sauberen Linux-Container:

```bash
scripts/e2e/onboard-docker.sh
```

Steuert den interaktiven Assistenten über ein Pseudo-TTY, überprüft Konfigurations-, Workspace- und Sitzungsdateien, startet anschließend das Gateway und führt `openclaw health` aus.

## QR-Import-Smoke-Test (Docker)

Stellt sicher, dass der gepflegte QR-Laufzeithelfer unter den unterstützten Docker-Node-Laufzeiten geladen wird (standardmäßig Node 24, kompatibel mit Node 22):

```bash
pnpm test:docker:qr
```

## Verwandte Themen

- [Tests](/de/help/testing)
- [Live-Tests](/de/help/testing-live)
- [Testen von Updates und Plugins](/de/help/testing-updates-plugins)
