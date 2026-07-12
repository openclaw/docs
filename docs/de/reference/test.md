---
read_when:
    - Tests ausführen oder beheben
summary: So führen Sie Tests lokal aus (vitest) und wann Sie Force-/Coverage-Modi verwenden sollten
title: Tests
x-i18n:
    generated_at: "2026-07-12T15:52:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 63806ea72da1579f4aa0b92c14a6d2d3e67990d6c10cb6d9b1b2bb4a63c8e140
    source_path: reference/test.md
    workflow: 16
---

- Vollständiges Testpaket (Suiten, Live, Docker): [Tests](/de/help/testing)
- Validierung von Updates und Plugin-Paketen: [Updates und Plugins testen](/de/help/testing-updates-plugins)

## Agent-Standard

Agent-Sitzungen führen Tests und rechenintensive Validierungen remote
über Crabbox aus. Für vertrauenswürdigen Maintainer-Code wird standardmäßig Blacksmith Testbox verwendet. Der
konfigurierte Testbox-Workflow stellt Anmeldedaten bereit, daher muss nicht vertrauenswürdiger Code von Mitwirkenden oder
Forks stattdessen geheimnislose Fork-CI oder eine bereinigte direkte AWS-Crabbox verwenden.

Wenn eine vertrauenswürdige Codeaufgabe voraussichtlich Tests oder umfangreiche Nachweise benötigt, wärmen Sie
sie sofort in einer Befehlssitzung im Hintergrund vor, arbeiten Sie weiter, während sie vorbereitet wird,
verwenden Sie die zurückgegebene `tbx_...`-ID erneut, synchronisieren Sie bei jedem Lauf den aktuellen Checkout und
stoppen Sie sie vor der Übergabe:

```bash
node scripts/crabbox-wrapper.mjs warmup --provider blacksmith-testbox --keep --timing-json
```

Nach der ersten erfolgreichen Wiederverwendung zeichnet der Wrapper die Basis,
Abhängigkeiten und den Fingerabdruck des Testbox-Workflows der Lease unter `.crabbox/testbox-leases/`
auf. Bei reinen Quellcodeänderungen wird die vorgewärmte Box weiterhin verwendet. Eine geänderte Merge-Basis, Lockfile,
Paketmanager-Eingabe, ein geänderter Wrapper oder Testbox-Workflow führt zu einem geschlossenen Fehlerzustand und erfordert eine
neue Lease. Bei jedem Lauf wird weiterhin der aktuelle Checkout synchronisiert.
`OPENCLAW_TESTBOX_ALLOW_STALE=1` ist nur für gezielte Diagnosen vorgesehen, nicht
für Release-Nachweise.

Die folgenden lokalen Testbefehle sind für menschliche Arbeitsabläufe oder einen ausdrücklich vom Benutzer angeforderten
Agent-Fallback vorgesehen. Die Nichtverfügbarkeit eines Remote-Providers muss gemeldet werden; sie ist
keine Erlaubnis, stillschweigend eine umfassende lokale Prüfung auszuführen.

Wärmen Sie für nicht vertrauenswürdigen Code mit `--provider aws` vor. Bei jedem Lauf muss
`CRABBOX_ENV_ALLOW=CI` gesetzt, `--provider aws --no-hydrate` übergeben und
vor der Installation von Abhängigkeiten oder der Ausführung von
Tests ein neues temporäres Remote-`HOME` verwendet werden. Verwenden Sie eine neu vorgewärmte Lease, die ausschließlich für diese nicht vertrauenswürdige Quelle bestimmt ist; verwenden Sie niemals
eine vertrauenswürdige oder zuvor mit Anmeldedaten ausgestattete Lease erneut. Starten Sie eine installierte vertrauenswürdige Crabbox-
Binärdatei aus einem sauberen, vertrauenswürdigen `main`-Checkout und rufen Sie nur den Remote-PR mit
`--fresh-pr` ab; führen Sie niemals den Wrapper oder die Konfiguration des nicht vertrauenswürdigen Checkouts lokal aus.
Entfernen Sie `CRABBOX_AWS_INSTANCE_PROFILE` und wechseln Sie in einen geschlossenen Fehlerzustand, sofern das aufgelöste
`aws.instanceProfile` nicht leer ist. Verwenden Sie vor jeder Installation und jedem Test vertrauenswürdige
Werkzeuge mit absoluten Pfaden, um ein IMDSv2-Token zu erzwingen, nachzuweisen, dass der Endpunkt für IAM-Anmeldedaten
404 zurückgibt, und zu überprüfen, dass das Remote-Ergebnis von `git rev-parse HEAD` dem vollständigen
geprüften SHA des PR-Heads entspricht. Binden Sie die Lease an diesen SHA und stoppen bzw. wärmen Sie sie erneut vor, wenn sich der Head
ändert. Laden Sie das vertrauenswürdige Skript `scripts/crabbox-untrusted-bootstrap.sh` aus einem sauberen
`main` zusammen mit `--fresh-pr` hoch; es installiert die festgelegten Versionen von Node/pnpm, überprüft den SHA
und die Paketmanager-Festlegung, isoliert `HOME`, installiert Abhängigkeiten und führt anschließend
den angeforderten Test aus. Wenn der Broker nicht nachweisen kann, dass keine Rolle vorhanden ist, oder kein Remote-PR existiert,
verwenden Sie geheimnislose Fork-CI. Verwenden Sie weder `hydrate-github` noch `--no-sync` oder einen
mit Anmeldedaten ausgestatteten Testbox-Workflow.
Entfernen Sie alle `CRABBOX_TAILSCALE*`-Überschreibungen, erzwingen Sie `--network public
--tailscale=false`, entfernen Sie Exit-Node-/LAN-Flags und verlangen Sie, dass `crabbox inspect`
ein öffentliches Netzwerk ohne Tailscale-Status meldet, bevor Sie ein Skript hochladen.

## Routinemäßige lokale Reihenfolge

1. `pnpm test:changed` für einen Vitest-Nachweis des geänderten Umfangs.
2. `pnpm test <path-or-filter>` für eine Datei, ein Verzeichnis oder ein explizites Ziel.
3. `pnpm test` nur, wenn Sie bewusst die vollständige lokale Vitest-Suite benötigen.

In einem Codex-Worktree oder einem verknüpften bzw. Sparse-Checkout vermeiden Agents die direkte lokale Ausführung von
`pnpm test*` / `pnpm check*` / `pnpm crabbox:run`:

- Ausdrücklich vom Benutzer angeforderter lokaler Fallback für eine kleine Datei:
  `node scripts/run-vitest.mjs <path-or-filter>`.
- Prüfungen für Änderungen oder umfassende Nachweise: `node scripts/crabbox-wrapper.mjs run --provider blacksmith-testbox ... -- env OPENCLAW_CHECK_CHANGED_REMOTE_CHILD=1 OPENCLAW_CHANGED_LANES_RAW_SYNC=1 corepack pnpm check:changed`, damit pnpm innerhalb von Testbox ausgeführt wird.
- Der abschließende `exitCode` und das Timing-JSON des Wrappers bilden das Befehlsergebnis. Ein delegierter Blacksmith-GitHub-Actions-Lauf kann nach einem erfolgreichen SSH-Befehl `cancelled` anzeigen, weil die Testbox außerhalb der Keepalive-Action gestoppt wird; prüfen Sie die Wrapper-Zusammenfassung und die Befehlsausgabe, bevor Sie dies als Fehler behandeln.
- `OPENCLAW_HEAVY_CHECK_LOCK_SCOPE=worktree <local-heavy-check command>`: Beschränkt die Serialisierung aufwendiger Prüfungen auf den aktuellen Worktree statt auf das gemeinsame Git-Verzeichnis für Befehle wie `pnpm check:changed` und gezielte `pnpm test ...`. Verwenden Sie dies nur auf leistungsfähigen lokalen Hosts, wenn Sie bewusst unabhängige Prüfungen in verknüpften Worktrees ausführen.

## Kernbefehle

Läufe des Test-Wrappers enden mit einer kurzen Zusammenfassung im Format `[test] passed|failed|skipped ... in ...`; die eigene Dauerzeile von Vitest bleibt die Detailangabe pro Shard.

| Befehl                                            | Funktion                                                                                                                                                                                                                                                                                                                                              |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test`                                       | Explizite Datei-/Verzeichnisziele werden durch bereichsspezifische Vitest-Lanes geleitet. Läufe ohne Zielangabe dienen als Nachweis für die vollständige Suite: Feste Shard-Gruppen werden für die lokale parallele Ausführung in Blattkonfigurationen erweitert, wobei der erwartete Shard-Fanout vor dem Start ausgegeben wird. Die Erweiterungsgruppe wird immer in Shard-Konfigurationen pro Erweiterung aufgeteilt, statt einen einzigen riesigen Root-Projekt-Prozess zu verwenden. |
| `pnpm test:changed`                               | Kostengünstiger intelligenter Testlauf für Änderungen: präzise Ziele aus direkten Teständerungen, benachbarten `*.test.ts`-Dateien, expliziten Quellzuordnungen und dem lokalen Importgraphen. Umfassende Konfigurations-/Paketänderungen werden übersprungen, sofern sie keinen präzisen Tests zugeordnet werden können.                                                                                                                     |
| `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` | Expliziter umfassender Testlauf für Änderungen; verwenden Sie ihn, wenn eine Änderung an Test-Harness, Konfiguration oder Paket auf das umfassendere Verhalten von Vitest für geänderte Tests zurückfallen soll.                                                                                                                                                                                                       |
| `pnpm test:force`                                 | Gibt den konfigurierten OpenClaw-Gateway-Port frei (Standardwert `18789`) und führt dann die vollständige Suite mit einem isolierten Gateway-Port aus, damit Servertests nicht mit einer laufenden Instanz kollidieren.                                                                                                                                   |
| `pnpm test:coverage`                              | Gibt einen informativen V8-Abdeckungsbericht für die standardmäßige Unit-Lane (`vitest.unit.config.ts`) aus; es werden keine Abdeckungsschwellenwerte erzwungen.                                                                                                                                                                                        |
| `pnpm test:coverage:changed`                      | Unit-Abdeckung nur für Dateien, die seit `origin/main` geändert wurden.                                                                                                                                                                                                                                                                                |
| `pnpm changed:lanes`                              | Zeigt die architektonischen Lanes an, die durch den Diff gegenüber `origin/main` ausgelöst werden.                                                                                                                                                                                                                                                      |
| `pnpm check:changed`                              | Delegiert außerhalb der CI standardmäßig an Crabbox/Testbox und führt dann im Remote-Child die intelligente Prüfung für Änderungen aus: Formatierung sowie Typprüfung, Linting und Schutzbefehle für betroffene Lanes. Führt Vitest nicht aus; verwenden Sie `pnpm test:changed` oder `pnpm test <target>` für den Testnachweis.                                                                                       |

## Gemeinsamer Teststatus und Prozesshilfen

- `src/test-utils/openclaw-test-state.ts`: Verwenden Sie dies aus Vitest, wenn ein Test ein isoliertes `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, eine Konfigurations-Fixture, einen Workspace, ein Agent-Verzeichnis oder einen Authentifizierungsprofilspeicher benötigt.
- `pnpm test:env-mutations:report`: Nicht blockierender Bericht über Tests/Harnesses, die `HOME`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_WORKSPACE_DIR` oder verwandte Umgebungsschlüssel direkt verändern. Verwenden Sie ihn, um Migrationskandidaten für die gemeinsame Teststatus-Hilfe zu finden.
- `test/helpers/openclaw-test-instance.ts`: E2E-Tests auf Prozessebene, die einen laufenden Gateway, eine CLI-Umgebung, Protokollerfassung und Bereinigung an einem Ort benötigen.
- Docker-/Bash-E2E-Lanes, die `scripts/lib/docker-e2e-image.sh` einbinden, können `docker_e2e_test_state_shell_b64 <label> <scenario>` an den Container übergeben und mit `scripts/lib/openclaw-e2e-instance.sh` dekodieren; Skripte mit mehreren Home-Verzeichnissen können `docker_e2e_test_state_function_b64` übergeben und in jedem Ablauf `openclaw_test_state_create <label> <scenario>` aufrufen. `node scripts/lib/openclaw-test-state.mjs -- create --label <name> --scenario <name> --env-file <path> --json` schreibt eine auf dem Host einbindbare Umgebungsdatei (das `--` vor `create` verhindert, dass neuere Node-Runtimes `--env-file` als Node-Flag behandeln). Lanes, die einen Gateway starten, können `scripts/lib/openclaw-e2e-instance.sh` für die Auflösung des Einstiegspunkts, den simulierten OpenAI-Start, den Start im Vordergrund/Hintergrund, Bereitschaftsprüfungen, den Export der Statusumgebung, Protokollausgaben und die Prozessbereinigung einbinden.

## Control UI, TUI und Erweiterungs-Lanes

- **Gemockte Control-UI-E2E-Tests:** `pnpm test:ui:e2e` führt die Vitest- und Playwright-Teststrecke aus, die die Vite-Control-UI startet und eine echte Chromium-Seite gegen einen gemockten Gateway-WebSocket steuert. Die Tests befinden sich in `ui/src/**/*.e2e.test.ts`; gemeinsame Mocks und Steuerelemente befinden sich in `ui/src/test-helpers/control-ui-e2e.ts`. `pnpm test:e2e` umfasst diese Teststrecke. Agent-Ausführungen verwenden standardmäßig Testbox/Crabbox, einschließlich gezielter Nachweise; verwenden Sie `node scripts/run-vitest.mjs run --config test/vitest/vitest.ui-e2e.config.ts --configLoader runner ui/src/ui/e2e/chat-flow.e2e.test.ts` nur als ausdrücklich angeforderten lokalen Fallback.
- **TUI-PTY-Tests:** `node scripts/run-vitest.mjs run --config test/vitest/vitest.tui-pty.config.ts` führt die schnelle PTY-Teststrecke mit simuliertem Backend aus. `OPENCLAW_TUI_PTY_INCLUDE_LOCAL=1` oder `pnpm tui:pty:test:watch --mode local` führt den langsameren Smoke-Test für `tui --local` aus, der nur den externen Modell-Endpunkt simuliert. Prüfen Sie stabilen sichtbaren Text oder Fixture-Aufrufe, keine unverarbeiteten ANSI-Snapshots.
- `pnpm test:extensions` und `pnpm test extensions` führen alle Erweiterungs-/Plugin-Shards aus. Ressourcenintensive Kanal-Plugins, das Browser-Plugin und OpenAI werden als dedizierte Shards ausgeführt; andere Plugin-Gruppen bleiben gebündelt. `pnpm test extensions/<id>` führt die Teststrecke eines gebündelten Plugins aus.
- Quelldateien mit benachbarten Tests werden zuerst diesem benachbarten Test zugeordnet, bevor auf weiter gefasste Verzeichnis-Globs zurückgegriffen wird. Änderungen an Hilfsfunktionen unter `src/channels/plugins/contracts/test-helpers`, `src/plugin-sdk/test-helpers` und `src/plugins/contracts` verwenden einen lokalen Importgraphen, um importierende Tests auszuführen, anstatt jeden Shard umfassend auszuführen, wenn der Abhängigkeitspfad eindeutig ist.
- Ziele in Contract-Verzeichnissen werden auf ihre Contract-Teststrecken aufgefächert: `pnpm test src/channels/plugins/contracts` führt die vier Konfigurationen für Kanal-Contracts aus und `pnpm test src/plugins/contracts` führt die Konfiguration für Plugin-Contracts aus, da die generischen Projekte `channels`/`plugins` den Pfad `contracts/**` ausschließen.
- `auto-reply` ist in drei dedizierte Konfigurationen (`core`, `top-level`, `reply`) aufgeteilt, damit das Reply-Testgerüst die leichteren Status-, Token- und Hilfsfunktionstests der obersten Ebene nicht dominiert.
- Ausgewählte Testdateien für `plugin-sdk` und `commands` werden über dedizierte schlanke Teststrecken geleitet, die nur `test/setup.ts` beibehalten; laufzeitintensive Fälle verbleiben in ihren vorhandenen Teststrecken.
- Die Vitest-Basiskonfiguration verwendet standardmäßig `pool: "threads"` und `isolate: false`; der gemeinsame nicht isolierte Runner ist in allen Repository-Konfigurationen aktiviert.
- `pnpm test:channels` führt `vitest.channels.config.ts` aus.

## Gateway und E2E

- Die Gateway-Integration muss ausdrücklich aktiviert werden: `OPENCLAW_TEST_INCLUDE_GATEWAY=1 pnpm test` oder `pnpm test:gateway`.
- `pnpm test:e2e`: E2E-Gesamtlauf des Repositorys = `pnpm test:e2e:gateway && pnpm test:ui:e2e`.
- `pnpm test:e2e:gateway`: Gateway-End-to-End-Smoke-Tests (WS-/HTTP-/Node-Kopplung mit mehreren Instanzen). Verwendet standardmäßig `threads` + `isolate: false` mit adaptiver Worker-Anzahl in `vitest.e2e.config.ts`; anpassbar mit `OPENCLAW_E2E_WORKERS=<n>`, ausführliche Protokolle mit `OPENCLAW_E2E_VERBOSE=1`.
- `pnpm test:live`: Live-Tests für Provider (Claude/Minimax/DeepSeek/z.ai/usw., gesteuert durch `*.live.test.ts`). Erfordert API-Schlüssel und `LIVE=1` (oder `OPENCLAW_LIVE_TEST=1`), damit die Tests nicht übersprungen werden; ausführliche Ausgabe mit `OPENCLAW_LIVE_TEST_QUIET=0`.

## Vollständige Docker-Suite (`pnpm test:docker:all`)

Erstellt das gemeinsame Live-Test-Image, packt OpenClaw einmal als npm-Tarball, erstellt/verwendet ein minimales Node-/Git-Runner-Image sowie ein funktionales Image, das diesen Tarball unter `/app` installiert, und führt anschließend Docker-Smoke-Teststrecken über einen gewichteten Scheduler aus. `scripts/package-openclaw-for-docker.mjs` ist der einzige lokale/CI-Paket-Packer und validiert den Tarball sowie `dist/postinstall-inventory.json`, bevor Docker ihn verwendet.

- Minimales Image (`OPENCLAW_DOCKER_E2E_BARE_IMAGE`): Teststrecken für Installation, Aktualisierung und Plugin-Abhängigkeiten; bindet den vorab erstellten Tarball ein, anstatt kopierte Repository-Quellen zu verwenden.
- Funktionales Image (`OPENCLAW_DOCKER_E2E_FUNCTIONAL_IMAGE`): Teststrecken für die normale Funktionalität der erstellten Anwendung.
- Definitionen der Teststrecken: `scripts/lib/docker-e2e-scenarios.mjs`. Planer: `scripts/lib/docker-e2e-plan.mjs`. Ausführung: `scripts/test-docker-all.mjs`.
- `node scripts/test-docker-all.mjs --plan-json` gibt den vom Scheduler verwalteten CI-Plan (Teststrecken, Image-Arten, Anforderungen an Paket-/Live-Images, Zustandsszenarien, Prüfung der Zugangsdaten) aus, ohne Docker zu erstellen oder auszuführen.

Steuerungsoptionen für die Planung (Umgebungsvariablen, Standardwerte in Klammern):

| Umgebungsvariable                                                                                               | Standard            | Zweck                                                                                                                                                                                                                                                                                                                                                        |
| --------------------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_DOCKER_ALL_PARALLELISM`                                                                               | 10                  | Prozess-Slots.                                                                                                                                                                                                                                                                                                                                               |
| `OPENCLAW_DOCKER_ALL_TAIL_PARALLELISM`                                                                          | 10                  | Provider-sensitiver nachgelagerter Pool.                                                                                                                                                                                                                                                                                                                      |
| `OPENCLAW_DOCKER_ALL_LIVE_LIMIT`                                                                                | 9                   | Obergrenze für ressourcenintensive Live-Provider-Teststrecken.                                                                                                                                                                                                                                                                                                |
| `OPENCLAW_DOCKER_ALL_NPM_LIMIT`                                                                                 | 5                   | Obergrenze für Teststrecken mit npm-Ressourcen.                                                                                                                                                                                                                                                                                                               |
| `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT`                                                                             | 7                   | Obergrenze für Teststrecken mit Dienstressourcen.                                                                                                                                                                                                                                                                                                             |
| `OPENCLAW_DOCKER_ALL_LIVE_CLAUDE_LIMIT` / `_CODEX_LIMIT` / `_GEMINI_LIMIT` / `_DROID_LIMIT` / `_OPENCODE_LIMIT` | 4                   | Provider-spezifische Obergrenzen für ressourcenintensive Teststrecken.                                                                                                                                                                                                                                                                                         |
| `OPENCLAW_DOCKER_ALL_LIVE_OPENAI_LIMIT` / `_TELEGRAM_LIMIT`                                                     | 1                   | Engere Provider-spezifische Obergrenzen.                                                                                                                                                                                                                                                                                                                      |
| `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` / `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT`                                         | -                   | Überschreibung für größere Hosts.                                                                                                                                                                                                                                                                                                                             |
| `OPENCLAW_DOCKER_ALL_START_STAGGER_MS`                                                                          | 2000                | Verzögerung zwischen den Starts der Teststrecken, um lokale Erstellungsstürme des Docker-Daemons zu vermeiden.                                                                                                                                                                                                                                                |
| `OPENCLAW_DOCKER_ALL_LANE_TIMEOUT_MS`                                                                           | 7,200,000 (120 min) | Fallback-Zeitüberschreitung pro Teststrecke; ausgewählte Live-/nachgelagerte Teststrecken verwenden strengere Obergrenzen.                                                                                                                                                                                                                                     |
| `OPENCLAW_DOCKER_ALL_LIVE_RETRIES`                                                                              | 1                   | Wiederholungsversuche bei vorübergehenden Fehlern von Live-Providern.                                                                                                                                                                                                                                                                                          |
| `OPENCLAW_DOCKER_ALL_DRY_RUN`                                                                                   | off                 | Gibt das Manifest der Teststrecken aus, ohne Docker auszuführen.                                                                                                                                                                                                                                                                                              |
| `OPENCLAW_DOCKER_ALL_STATUS_INTERVAL_MS`                                                                        | 30000               | Intervall für Statusausgaben aktiver Teststrecken.                                                                                                                                                                                                                                                                                                            |
| `OPENCLAW_DOCKER_ALL_TIMINGS`                                                                                   | on                  | Verwendet `.artifacts/docker-tests/lane-timings.json` für die Reihenfolge von der längsten zur kürzesten Teststrecke erneut; zum Deaktivieren auf `0` setzen.                                                                                                                                                                                                   |
| `OPENCLAW_DOCKER_ALL_LIVE_MODE`                                                                                 | -                   | `skip` nur für deterministische/lokale Teststrecken, `only` nur für Live-Provider-Teststrecken. Aliasse: `pnpm test:docker:local:all`, `pnpm test:docker:live:all`. Im Nur-Live-Modus werden die primären und nachgelagerten Live-Teststrecken in einem einzigen Pool mit längster Teststrecke zuerst zusammengeführt, sodass Provider-Buckets Claude-/Codex-/Gemini-Aufgaben gemeinsam bündeln. |
| `OPENCLAW_LIVE_CLI_BACKEND_SETUP_TIMEOUT_SECONDS`                                                               | 180                 | Zeitüberschreitung für die Docker-Einrichtung des CLI-Backends.                                                                                                                                                                                                                                                                                                |

Das Muster für Umgebungsvariablen zur Begrenzung von Ressourcen lautet `OPENCLAW_DOCKER_ALL_<RESOURCE>_LIMIT` (Ressourcenname in Großbuchstaben, nicht alphanumerische Zeichen zu `_` zusammengefasst).

Anderes Verhalten: Der Runner führt standardmäßig einen Preflight für Docker aus, bereinigt veraltete OpenClaw-E2E-Container, teilt Caches für Provider-CLI-Tools zwischen kompatiblen Lanes und plant nach dem ersten Fehler keine neuen gepoolten Lanes mehr ein, sofern nicht `OPENCLAW_DOCKER_ALL_FAIL_FAST=0` gesetzt ist. Wenn eine Lane die effektive Gewichtungs-/Ressourcenobergrenze auf einem Host mit geringer Parallelität überschreitet, kann sie dennoch aus einem leeren Pool starten und allein ausgeführt werden, bis sie Kapazität freigibt. Lane-spezifische Protokolle, `summary.json`, `failures.json` und Phasenzeitmessungen werden unter `.artifacts/docker-tests/<run-id>/` geschrieben; verwenden Sie `pnpm test:docker:timings <summary.json>`, um langsame Lanes zu untersuchen, und `pnpm test:docker:rerun <run-id|summary.json|failures.json>`, um kostengünstige, gezielte Befehle zur erneuten Ausführung auszugeben.

### Wichtige Docker-Lanes

| Befehl                                                                      | Überprüft                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test:docker:browser-cdp-snapshot`                                     | Chromium-basierter Quell-E2E-Container mit unverarbeitetem CDP und isoliertem Gateway; CDP-Rollen-Snapshots von `browser doctor --deep` enthalten Link-URLs, durch den Cursor als anklickbar erkannte Elemente, iframe-Referenzen und Frame-Metadaten.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `pnpm test:docker:skill-install`                                            | Installiert das gepackte Tarball in einem minimalistischen Docker-Runner mit `skills.install.allowUploadedArchives: false`, ermittelt über die Live-Suche von ClawHub einen aktuellen Skill-Slug, installiert ihn über `openclaw skills install` und überprüft `SKILL.md`, `.clawhub/origin.json`, `.clawhub/lock.json` und `skills info --json`.                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `pnpm test:docker:live-cli-backend:claude`, `:claude:resume`, `:claude:mcp` | Fokussierte Live-Prüfungen des CLI-Backends; Gemini verfügt über entsprechende Aliase für `:resume` und `:mcp`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `pnpm test:docker:openwebui`                                                | OpenClaw + Open WebUI in Docker: anmelden, `/api/models` prüfen und einen echten weitergeleiteten Chat über `/api/chat/completions` ausführen. Erfordert einen verwendbaren Live-Modellschlüssel und lädt ein externes Image herunter; es wird nicht erwartet, dass dies so CI-stabil wie die Unit-/E2E-Suiten ist.                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `pnpm test:docker:mcp-channels`                                             | Vorbereiteter Gateway-Container sowie ein Client-Container, der `openclaw mcp serve` startet: geroutete Konversationserkennung, Lesen von Transkripten, Anhangsmetadaten, Verhalten der Live-Ereigniswarteschlange, Routing ausgehender Sendungen sowie kanal- und berechtigungsbezogene Benachrichtigungen im Claude-Stil über die echte stdio-Bridge (die Assertion liest unverarbeitete stdio-MCP-Frames direkt).                                                                                                                                                                                                                                                                                 |
| `pnpm test:docker:upgrade-survivor`                                         | Installiert das gepackte Tarball über ein verunreinigtes Fixture eines alten Benutzers, führt eine Paketaktualisierung sowie Doctor nicht interaktiv und ohne Live-Schlüssel für Provider/Kanäle aus, startet einen Loopback-Gateway und prüft, ob Agenten-/Kanalkonfiguration, Plugin-Zulassungslisten, Workspace-/Sitzungsdateien, veralteter Legacy-Zustand von Plugin-Abhängigkeiten, Start und RPC-Status erhalten bleiben.                                                                                                                                                                                                                                                                      |
| `pnpm test:docker:published-upgrade-survivor`                               | Installiert standardmäßig `openclaw@latest`, legt realistische Dateien eines bestehenden Benutzers an, konfiguriert sie über ein integriertes `openclaw config set`-Rezept, aktualisiert auf das gepackte Tarball, führt Doctor nicht interaktiv aus, schreibt `.artifacts/upgrade-survivor/summary.json` und prüft `/healthz`, `/readyz` sowie den RPC-Status. Überschreiben Sie dies mit `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, erweitern Sie eine Matrix mit `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` oder fügen Sie Szenario-Fixtures mit `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` hinzu (enthält `configured-plugin-installs` und `stale-source-plugin-shadow`). Package Acceptance stellt diese als `published_upgrade_survivor_baseline(s)` / `_scenarios` bereit und löst Meta-Tokens wie `last-stable-4` oder `all-since-2026.4.23` auf. |
| `pnpm test:docker:update-migration`                                         | Harness für das Überleben veröffentlichter Upgrades im Szenario `plugin-deps-cleanup`, das standardmäßig bei `openclaw@2026.4.23` beginnt. Der Workflow `Update Migration` erweitert dies mit `baselines=all-since-2026.4.23`, um die Bereinigung konfigurierter Plugin-Abhängigkeiten außerhalb der vollständigen Release-CI nachzuweisen.                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `pnpm test:docker:plugins`                                                  | Installations-/Aktualisierungs-Smoke-Test für lokale Pfade, `file:`, npm-Registry-Pakete mit hochgezogenen Abhängigkeiten, veränderliche Git-Referenzen, ClawHub-Fixtures, Marketplace-Aktualisierungen sowie Aktivierung/Inspektion von Claude-Bundles.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |

## Lokales PR-Gate

Führen Sie für lokale Prüfungen vor dem Landen bzw. für Gate-Prüfungen eines PR Folgendes aus:

- `pnpm check:changed`
- `pnpm check`
- `pnpm check:test-types`
- `pnpm build`
- `pnpm test`
- `pnpm check:docs`

Wenn `pnpm test` auf einem ausgelasteten Host sporadisch fehlschlägt, führen Sie es einmal erneut aus, bevor Sie den Fehler als Regression behandeln, und isolieren Sie ihn anschließend mit `pnpm test <path/to/test>`. Für Hosts mit eingeschränktem Arbeitsspeicher:

- `OPENCLAW_VITEST_MAX_WORKERS=1 pnpm test`
- `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/tmp/openclaw-vitest-cache pnpm test:changed`

## Tools für die Testleistung

- `pnpm test:perf:imports`: aktiviert die Berichterstattung zu Vitest-Importdauer und Importaufschlüsselung und verwendet für explizite Datei-/Verzeichnisziele weiterhin das bereichsspezifische Lane-Routing. `pnpm test:perf:imports:changed` beschränkt dasselbe Profiling auf Dateien, die sich seit `origin/main` geändert haben.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` vergleicht die Performance des gerouteten Changed-Mode-Pfads mit dem nativen Lauf des Root-Projekts für denselben committeten Git-Diff; `pnpm test:perf:changed:bench -- --worktree` vergleicht die Performance des aktuellen Worktree-Änderungssatzes, ohne ihn vorher zu committen.
- `pnpm test:perf:profile:main` schreibt ein CPU-Profil für den Vitest-Hauptthread (`.artifacts/vitest-main-profile`); `pnpm test:perf:profile:runner` schreibt CPU- und Heap-Profile für den Unit-Runner (`.artifacts/vitest-runner-profile`).
- `pnpm test:perf:groups --full-suite --allow-failures --output .artifacts/test-perf/baseline-before.json`: führt jede untergeordnete Vitest-Konfiguration der vollständigen Suite seriell aus und schreibt gruppierte Laufzeitdaten sowie JSON-/Log-Artefakte pro Konfiguration. Berichte der vollständigen Suite isolieren Dateien standardmäßig, damit beibehaltene Modulgraphen und GC-Pausen aus früheren Dateien nicht späteren Assertions zugerechnet werden; übergeben Sie `-- --no-isolate` nur, wenn Sie die Akkumulation in gemeinsam genutzten Workern absichtlich profilieren. Der Agent für Testperformance verwendet dies als Ausgangsbasis, bevor er versucht, langsame Tests zu optimieren. `pnpm test:perf:groups:compare .artifacts/test-perf/baseline-before.json .artifacts/test-perf/after-agent.json` vergleicht gruppierte Berichte nach einer auf Performance ausgerichteten Änderung.
- Shard-Läufe für vollständige Suites, Erweiterungen und Include-Muster aktualisieren lokale Zeitmessdaten in `.artifacts/vitest-shard-timings.json`; spätere Läufe der gesamten Konfiguration verwenden diese Zeitmessungen, um langsame und schnelle Shards auszubalancieren. Include-Muster-CI-Shards hängen den Shard-Namen an den Zeitmessschlüssel an, sodass gefilterte Shard-Zeitmessungen sichtbar bleiben, ohne die Zeitmessdaten der gesamten Konfiguration zu ersetzen. Setzen Sie `OPENCLAW_TEST_PROJECTS_TIMINGS=0`, um das lokale Zeitmessartefakt zu ignorieren.

## Benchmarks

<Accordion title="Modelllatenz (scripts/bench-model.ts)">

```bash
pnpm tsx scripts/bench-model.ts --runs 10
```

Optionale Umgebungsvariablen: `MINIMAX_API_KEY`, `MINIMAX_BASE_URL`, `MINIMAX_MODEL`, `ANTHROPIC_API_KEY`. Standard-Prompt: „Antworten Sie mit einem einzigen Wort: ok. Keine Satzzeichen oder zusätzlicher Text.“

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

Die Ausgabe enthält `sampleCount`, Durchschnitt, p50, p95, Minimum/Maximum, die Verteilung von Exit-Codes/Signalen und den maximalen RSS-Wert pro Befehl. `--cpu-prof-dir` / `--heap-prof-dir` schreiben V8-Profile pro Lauf.

Gespeicherte Ausgabe: `pnpm test:startup:bench:smoke` schreibt `.artifacts/cli-startup-bench-smoke.json`; `pnpm test:startup:bench:save` schreibt `.artifacts/cli-startup-bench-all.json` (`runs=5 warmup=1`). Eingecheckte Fixture: `test/fixtures/cli-startup-bench.json`, aktualisiert durch `pnpm test:startup:bench:update`, verglichen durch `pnpm test:startup:bench:check`.

</Accordion>

<Accordion title="Gateway-Start (scripts/bench-gateway-startup.ts)">

Verwendet standardmäßig den gebauten CLI-Einstiegspunkt unter `dist/entry.js`; führen Sie zuerst `pnpm build` aus. Übergeben Sie `--entry scripts/run-node.mjs`, um stattdessen den Source-Runner zu messen, und halten Sie diese Ergebnisse von den Baselines des gebauten Einstiegspunkts getrennt.

```bash
pnpm test:startup:gateway -- --runs 5 --warmup 1
pnpm test:startup:gateway -- --case skipChannels --case fiftyPlugins --runs 5
node --import tsx scripts/bench-gateway-startup.ts --case default --runs 5 --output .artifacts/gateway-startup.json
```

Fall-IDs: `default`, `skipChannels` (Kanalstart übersprungen), `oneInternalHook`, `allInternalHooks`, `fiftyPlugins` (50 Manifest-Plugins), `fiftyStartupLazyPlugins` (50 beim Start verzögert geladene Manifest-Plugins).

Die Ausgabe enthält die erste Prozessausgabe, `/healthz`, `/readyz`, die Zeit des HTTP-Listen-Logs, die Zeit des Gateway-Bereitschaftslogs, CPU-Zeit, CPU-Kern-Verhältnis, maximalen RSS-Wert, Heap, Metriken der Startablaufverfolgung, Event-Loop-Verzögerung und detaillierte Metriken der Plugin-Lookup-Tabelle. Das Skript setzt `OPENCLAW_GATEWAY_STARTUP_TRACE=1` in der Umgebung des untergeordneten Gateway-Prozesses.

`/healthz` zeigt die Betriebsfähigkeit an (der HTTP-Server kann antworten). `/readyz` zeigt die nutzbare Bereitschaft an (Start-Sidecars der Plugins, Kanäle und für die Bereitschaft kritische Arbeiten nach dem Anhängen sind abgeschlossen). Start-Hooks werden asynchron ausgelöst und sind nicht Teil der Bereitschaftsgarantie. Die Zeit des Bereitschaftslogs ist der interne Zeitstempel des Gateways, der für die prozessseitige Zuordnung nützlich ist, aber die externe `/readyz`-Prüfung nicht ersetzt.

Verwenden Sie beim Vergleichen von Änderungen die JSON-Ausgabe oder `--output`. Verwenden Sie `--cpu-prof-dir` nur, wenn die Ablaufverfolgung auf Import-, Kompilierungs- oder CPU-gebundene Arbeiten hinweist, die sich allein durch Phasenzeitmessungen nicht erklären lassen.

</Accordion>

<Accordion title="Gateway-Neustart (scripts/bench-gateway-restart.ts)">

Nur macOS und Linux (verwendet SIGUSR1 für prozessinterne Neustarts; schlägt unter Windows sofort fehl). Derselbe Standard für den gebauten Einstiegspunkt und dieselbe Überschreibung mit `--entry scripts/run-node.mjs` wie beim Gateway-Start oben.

```bash
pnpm test:restart:gateway -- --case skipChannels --runs 1 --restarts 5
pnpm test:restart:gateway -- --case default --runs 3 --restarts 3 --warmup 1
```

Fall-IDs: `skipChannels`, `skipChannelsAcpxProbe` (ACPX-Startprüfung aktiviert), `skipChannelsNoAcpxProbe` (Prüfung deaktiviert), `default`, `fiftyPlugins`.

Die Ausgabe enthält das nächste `/healthz`, das nächste `/readyz`, die Ausfallzeit, die Bereitschaftszeit des Neustarts, CPU, RSS, Metriken der Startablaufverfolgung für den Ersatzprozess und Metriken der Neustartablaufverfolgung für Signalverarbeitung, das Auslaufen aktiver Arbeiten, Schließphasen, den nächsten Start, Bereitschaftszeitmessungen und Speicher-Snapshots. Das Skript setzt `OPENCLAW_GATEWAY_STARTUP_TRACE=1` und `OPENCLAW_GATEWAY_RESTART_TRACE=1`.

Verwenden Sie diesen Benchmark, wenn eine Änderung die Neustartsignalisierung, Schließ-Handler, den Start nach einem Neustart, das Herunterfahren von Sidecars, die Dienstübergabe oder die Bereitschaft nach einem Neustart betrifft. Beginnen Sie mit `skipChannels`, um die Gateway-Mechanik vom Kanalstart zu isolieren; verwenden Sie `default` oder Plugin-intensive Fälle erst, nachdem der eng eingegrenzte Fall den Neustartpfad erklärt hat. Ablaufverfolgungsmetriken sind Hinweise zur Zuordnung, keine endgültigen Bewertungen — beurteilen Sie eine Neustartänderung anhand mehrerer Stichproben, des passenden Verantwortungsbereichs, des Verhaltens von `/healthz`/`/readyz` und des für Benutzer sichtbaren Neustartvertrags.

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
- [Tests von Updates und Plugins](/de/help/testing-updates-plugins)
