---
read_when:
    - Tests lokal oder in CI ausführen
    - Regressionen für Modell-/Provider-Fehler hinzufügen
    - Debuggen von Gateway- und Agentenverhalten
summary: 'Test-Kit: Unit-/E2E-/Live-Suiten, Docker-Runner und was jeder Test abdeckt'
title: Tests
x-i18n:
    generated_at: "2026-04-22T04:23:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: f7309f596dc0fd8b6dac936be74af1c8b4aa1dccc98e169a6b6934206547a0ca
    source_path: help/testing.md
    workflow: 15
---

# Tests

OpenClaw hat drei Vitest-Suiten (Unit/Integration, E2E, Live) und eine kleine Menge an Docker-Runnern.

Dieses Dokument ist ein Leitfaden „wie wir testen“:

- Was jede Suite abdeckt (und was sie bewusst _nicht_ abdeckt)
- Welche Befehle für typische Workflows auszuführen sind (lokal, vor dem Push, Debugging)
- Wie Live-Tests Credentials finden und Modelle/Provider auswählen
- Wie Regressionen für reale Modell-/Provider-Probleme hinzugefügt werden

## Schnellstart

An den meisten Tagen:

- Vollständiges Gate (vor dem Push erwartet): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Schnellerer lokaler Lauf der vollständigen Suite auf einer leistungsfähigen Maschine: `pnpm test:max`
- Direkte Vitest-Watch-Schleife: `pnpm test:watch`
- Direktes Targeting von Dateien routet jetzt auch Erweiterungs-/Kanalpfade: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Bevorzuge zuerst zielgerichtete Läufe, wenn du an einem einzelnen Fehler iterierst.
- Docker-gestützte QA-Site: `pnpm qa:lab:up`
- Linux-VM-gestützte QA-Lane: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Wenn du Tests anfasst oder zusätzliche Sicherheit möchtest:

- Coverage-Gate: `pnpm test:coverage`
- E2E-Suite: `pnpm test:e2e`

Beim Debuggen realer Provider/Modelle (erfordert echte Credentials):

- Live-Suite (Modelle + Gateway-Tool-/Image-Probes): `pnpm test:live`
- Eine Live-Datei gezielt und ruhig ausführen: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Moonshot/Kimi-Kosten-Smoke: mit gesetztem `MOONSHOT_API_KEY` führe
  `openclaw models list --provider moonshot --json` aus und dann einen isolierten
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  gegen `moonshot/kimi-k2.6`. Verifiziere, dass das JSON Moonshot/K2.6 meldet und das
  Assistant-Transkript normalisierte `usage.cost` speichert.

Tipp: Wenn du nur einen einzelnen fehlschlagenden Fall brauchst, solltest du Live-Tests bevorzugt über die unten beschriebenen Allowlist-Umgebungsvariablen eingrenzen.

## QA-spezifische Runner

Diese Befehle stehen neben den Haupttest-Suiten bereit, wenn du mehr QA-Lab-Realismus brauchst:

- `pnpm openclaw qa suite`
  - Führt Repo-gestützte QA-Szenarien direkt auf dem Host aus.
  - Führt standardmäßig mehrere ausgewählte Szenarien parallel mit isolierten
    Gateway-Workern aus. `qa-channel` verwendet standardmäßig Concurrency 4 (begrenzt durch die
    Anzahl der ausgewählten Szenarien). Verwende `--concurrency <count>`, um die Worker-Anzahl anzupassen,
    oder `--concurrency 1` für die ältere serielle Lane.
  - Beendet mit einem Fehlercode ungleich null, wenn irgendein Szenario fehlschlägt. Verwende `--allow-failures`, wenn du
    Artefakte ohne fehlerhaften Exit-Code möchtest.
  - Unterstützt die Provider-Modi `live-frontier`, `mock-openai` und `aimock`.
    `aimock` startet einen lokalen AIMock-gestützten Provider-Server für experimentelle
    Fixture- und Protokoll-Mock-Abdeckung, ohne die szenariobewusste
    `mock-openai`-Lane zu ersetzen.
- `pnpm openclaw qa suite --runner multipass`
  - Führt dieselbe QA-Suite in einer wegwerfbaren Multipass-Linux-VM aus.
  - Behält dasselbe Verhalten zur Szenarioauswahl wie `qa suite` auf dem Host bei.
  - Verwendet dieselben Flags zur Provider-/Modellauswahl wie `qa suite`.
  - Live-Läufe leiten die unterstützten QA-Auth-Eingaben weiter, die für den Gast praktikabel sind:
    env-basierte Provider-Schlüssel, den QA-Live-Provider-Konfigurationspfad und `CODEX_HOME`,
    falls vorhanden.
  - Ausgabeverzeichnisse müssen unter dem Repo-Root bleiben, damit der Gast über
    den gemounteten Workspace zurückschreiben kann.
  - Schreibt den normalen QA-Report + die Zusammenfassung sowie Multipass-Logs unter
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Startet die Docker-gestützte QA-Site für operatorartige QA-Arbeit.
- `pnpm test:docker:bundled-channel-deps`
  - Packt und installiert den aktuellen OpenClaw-Build in Docker, startet das Gateway
    mit konfiguriertem OpenAI und aktiviert dann Telegram und Discord über Konfigurationsänderungen.
  - Verifiziert, dass der erste Gateway-Neustart die Laufzeitabhängigkeiten jedes gebündelten Kanal-Plugins
    bei Bedarf installiert, und dass ein zweiter Neustart keine bereits aktivierten
    Abhängigkeiten erneut installiert.
  - Installiert außerdem eine bekannte ältere npm-Basis, aktiviert Telegram vor dem Ausführen von
    `openclaw update --tag <candidate>` und verifiziert, dass der
    Post-Update-Doctor des Kandidaten die Laufzeitabhängigkeiten gebündelter Kanal-Plugins ohne
    eine harnessseitige Postinstall-Reparatur repariert.
- `pnpm openclaw qa aimock`
  - Startet nur den lokalen AIMock-Provider-Server für direktes Protokoll-Smoke-Testing.
- `pnpm openclaw qa matrix`
  - Führt die Matrix-Live-QA-Lane gegen einen wegwerfbaren Docker-gestützten Tuwunel-Homeserver aus.
  - Dieser QA-Host ist heute nur für Repo/Entwicklung gedacht. Gepackte OpenClaw-Installationen liefern
    `qa-lab` nicht mit, daher stellen sie `openclaw qa` nicht bereit.
  - Repo-Checkouts laden den gebündelten Runner direkt; kein separater Plugin-Installationsschritt
    ist erforderlich.
  - Stellt drei temporäre Matrix-Benutzer bereit (`driver`, `sut`, `observer`) sowie einen privaten Raum und startet dann ein untergeordnetes QA-Gateway mit dem realen Matrix-Plugin als SUT-Transport.
  - Verwendet standardmäßig das fest angeheftete stabile Tuwunel-Image `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Mit `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE` überschreiben, wenn du ein anderes Image testen musst.
  - Matrix stellt keine gemeinsamen Credential-Source-Flags bereit, da die Lane lokal disponierbare Benutzer erzeugt.
  - Schreibt einen Matrix-QA-Report, eine Zusammenfassung, ein Artifact mit beobachteten Ereignissen und ein kombiniertes stdout/stderr-Ausgabelog unter `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - Führt die Telegram-Live-QA-Lane gegen eine reale private Gruppe mit den Bot-Tokens von Driver und SUT aus der Umgebung aus.
  - Erfordert `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` und `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Die Gruppen-ID muss die numerische Telegram-Chat-ID sein.
  - Unterstützt `--credential-source convex` für gemeinsam genutzte gepoolte Credentials. Standardmäßig den Env-Modus verwenden oder `OPENCLAW_QA_CREDENTIAL_SOURCE=convex` setzen, um gepoolte Leases zu nutzen.
  - Beendet mit einem Fehlercode ungleich null, wenn irgendein Szenario fehlschlägt. Verwende `--allow-failures`, wenn du
    Artefakte ohne fehlerhaften Exit-Code möchtest.
  - Erfordert zwei unterschiedliche Bots in derselben privaten Gruppe, wobei der SUT-Bot einen Telegram-Benutzernamen bereitstellt.
  - Für stabile Bot-zu-Bot-Beobachtung aktiviere den Modus „Bot-to-Bot Communication“ in `@BotFather` für beide Bots und stelle sicher, dass der Driver-Bot Bot-Verkehr in der Gruppe beobachten kann.
  - Schreibt einen Telegram-QA-Report, eine Zusammenfassung und ein Artifact mit beobachteten Nachrichten unter `.artifacts/qa-e2e/...`.

Live-Transport-Lanes teilen einen Standardvertrag, damit neue Transporte nicht auseinanderdriften:

`qa-channel` bleibt die breite synthetische QA-Suite und ist nicht Teil der Live-Transport-Coverage-Matrix.

| Lane     | Canary | Mention-Gating | Allowlist-Block | Antwort auf Top-Level | Neustart-Fortsetzung | Thread-Follow-up | Thread-Isolation | Reaktionsbeobachtung | Help-Befehl |
| -------- | ------ | -------------- | --------------- | --------------------- | -------------------- | ---------------- | ---------------- | -------------------- | ------------ |
| Matrix   | x      | x              | x               | x                     | x                    | x                | x                | x                    |              |
| Telegram | x      |                |                 |                       |                      |                  |                  |                      | x            |

### Gemeinsame Telegram-Credentials über Convex (v1)

Wenn `--credential-source convex` (oder `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) für
`openclaw qa telegram` aktiviert ist, erwirbt QA lab ein exklusives Lease aus einem Convex-gestützten Pool, sendet
Heartbeat-Signale für dieses Lease, während die Lane läuft, und gibt das Lease beim Herunterfahren frei.

Referenz-Convex-Projektgerüst:

- `qa/convex-credential-broker/`

Erforderliche Umgebungsvariablen:

- `OPENCLAW_QA_CONVEX_SITE_URL` (zum Beispiel `https://your-deployment.convex.site`)
- Ein Secret für die ausgewählte Rolle:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` für `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` für `ci`
- Auswahl der Credential-Rolle:
  - CLI: `--credential-role maintainer|ci`
  - Env-Standard: `OPENCLAW_QA_CREDENTIAL_ROLE` (standardmäßig `ci` in CI, sonst `maintainer`)

Optionale Umgebungsvariablen:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (Standard `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (Standard `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (Standard `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (Standard `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (Standard `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (optionale Trace-ID)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` erlaubt Loopback-`http://`-Convex-URLs für rein lokale Entwicklung.

`OPENCLAW_QA_CONVEX_SITE_URL` sollte im normalen Betrieb `https://` verwenden.

Maintainer-Admin-Befehle (Pool hinzufügen/entfernen/auflisten) erfordern
speziell `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI-Helfer für Maintainer:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Verwende `--json` für maschinenlesbare Ausgabe in Skripten und CI-Utilities.

Standard-Endpunktvertrag (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Request: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Erfolg: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Erschöpft/wiederholbar: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - Request: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Erfolg: `{ status: "ok" }` (oder leeres `2xx`)
- `POST /release`
  - Request: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Erfolg: `{ status: "ok" }` (oder leeres `2xx`)
- `POST /admin/add` (nur Maintainer-Secret)
  - Request: `{ kind, actorId, payload, note?, status? }`
  - Erfolg: `{ status: "ok", credential }`
- `POST /admin/remove` (nur Maintainer-Secret)
  - Request: `{ credentialId, actorId }`
  - Erfolg: `{ status: "ok", changed, credential }`
  - Schutz bei aktivem Lease: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (nur Maintainer-Secret)
  - Request: `{ kind?, status?, includePayload?, limit? }`
  - Erfolg: `{ status: "ok", credentials, count }`

Payload-Form für Telegram-Typ:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` muss eine numerische Telegram-Chat-ID als String sein.
- `admin/add` validiert diese Form für `kind: "telegram"` und lehnt fehlerhafte Payloads ab.

### Einen Kanal zu QA hinzufügen

Das Hinzufügen eines Kanals zum Markdown-QA-System erfordert genau zwei Dinge:

1. Einen Transport-Adapter für den Kanal.
2. Ein Szenario-Pack, das den Kanalvertrag ausübt.

Füge keinen neuen QA-Befehls-Root auf oberster Ebene hinzu, wenn der gemeinsame `qa-lab`-Host
den Ablauf besitzen kann.

`qa-lab` besitzt die gemeinsame Host-Mechanik:

- den `openclaw qa`-Befehls-Root
- Start und Abbau der Suite
- Worker-Concurrency
- Schreiben von Artefakten
- Berichtserstellung
- Ausführung von Szenarien
- Kompatibilitätsaliase für ältere `qa-channel`-Szenarien

Runner-Plugins besitzen den Transportvertrag:

- wie `openclaw qa <runner>` unter dem gemeinsamen `qa`-Root eingehängt wird
- wie das Gateway für diesen Transport konfiguriert wird
- wie Bereitschaft geprüft wird
- wie eingehende Ereignisse injiziert werden
- wie ausgehende Nachrichten beobachtet werden
- wie Transkripte und normalisierter Transportstatus bereitgestellt werden
- wie transportgestützte Aktionen ausgeführt werden
- wie transportspezifisches Zurücksetzen oder Aufräumen behandelt wird

Die minimale Übernahmeschwelle für einen neuen Kanal ist:

1. Behalte `qa-lab` als Eigentümer des gemeinsamen `qa`-Root.
2. Implementiere den Transport-Runner auf der gemeinsamen `qa-lab`-Host-Seam.
3. Behalte transportspezifische Mechaniken innerhalb des Runner-Plugins oder Channel-Harness.
4. Hänge den Runner als `openclaw qa <runner>` ein, statt einen konkurrierenden Root-Befehl zu registrieren.
   Runner-Plugins sollten `qaRunners` in `openclaw.plugin.json` deklarieren und ein passendes `qaRunnerCliRegistrations`-Array aus `runtime-api.ts` exportieren.
   Halte `runtime-api.ts` schlank; lazy CLI und Runner-Ausführung sollten hinter separaten Entry-Points bleiben.
5. Verfasse oder passe Markdown-Szenarien unter den thematischen Verzeichnissen `qa/scenarios/` an.
6. Verwende die generischen Szenario-Helfer für neue Szenarien.
7. Halte bestehende Kompatibilitätsaliase funktionsfähig, sofern das Repo keine absichtliche Migration durchführt.

Die Entscheidungsregel ist strikt:

- Wenn Verhalten einmalig in `qa-lab` ausgedrückt werden kann, lege es in `qa-lab` ab.
- Wenn Verhalten von einem Kanaltransport abhängt, behalte es in diesem Runner-Plugin oder Plugin-Harness.
- Wenn ein Szenario eine neue Fähigkeit braucht, die mehr als ein Kanal nutzen kann, füge einen generischen Helfer hinzu statt eines kanalspezifischen Branches in `suite.ts`.
- Wenn ein Verhalten nur für einen Transport sinnvoll ist, behalte das Szenario transportspezifisch und mache das im Szenariovertrag explizit.

Bevorzugte generische Helfernamen für neue Szenarien sind:

- `waitForTransportReady`
- `waitForChannelReady`
- `injectInboundMessage`
- `injectOutboundMessage`
- `waitForTransportOutboundMessage`
- `waitForChannelOutboundMessage`
- `waitForNoTransportOutbound`
- `getTransportSnapshot`
- `readTransportMessage`
- `readTransportTranscript`
- `formatTransportTranscript`
- `resetTransport`

Kompatibilitätsaliase bleiben für bestehende Szenarien verfügbar, darunter:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

Neue Kanal-Arbeit sollte die generischen Helfernamen verwenden.
Kompatibilitätsaliase existieren, um eine harte Migration an einem Stichtag zu vermeiden, nicht als Modell für
neue Szenario-Erstellung.

## Test-Suiten (was wo läuft)

Betrachte die Suiten als „zunehmenden Realismus“ (und zunehmende Flakiness/Kosten):

### Unit / Integration (Standard)

- Befehl: `pnpm test`
- Konfiguration: zehn sequenzielle Shard-Läufe (`vitest.full-*.config.ts`) über die vorhandenen gescopten Vitest-Projekte
- Dateien: Core-/Unit-Inventare unter `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` und die auf der Allowlist stehenden `ui`-Node-Tests, die von `vitest.unit.config.ts` abgedeckt werden
- Umfang:
  - Reine Unit-Tests
  - In-Process-Integrationstests (Gateway-Auth, Routing, Tooling, Parsing, Konfiguration)
  - Deterministische Regressionen für bekannte Bugs
- Erwartungen:
  - Läuft in CI
  - Keine echten Schlüssel erforderlich
  - Sollte schnell und stabil sein
- Hinweis zu Projekten:
  - Ungezieltes `pnpm test` führt jetzt elf kleinere Shard-Konfigurationen aus (`core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) statt eines riesigen nativen Root-Projekt-Prozesses. Das reduziert Peak-RSS auf ausgelasteten Maschinen und verhindert, dass Auto-Reply-/Extension-Arbeit nicht verwandte Suiten aushungert.
  - `pnpm test --watch` verwendet weiterhin den nativen Root-`vitest.config.ts`-Projektgraphen, weil eine Multi-Shard-Watch-Schleife nicht praktikabel ist.
  - `pnpm test`, `pnpm test:watch` und `pnpm test:perf:imports` routen explizite Datei-/Verzeichnisziele zuerst durch gescopte Lanes, sodass `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` nicht den vollen Startup-Aufwand des Root-Projekts zahlen muss.
  - `pnpm test:changed` erweitert geänderte Git-Pfade in dieselben gescopten Lanes, wenn der Diff nur routbare Source-/Test-Dateien berührt; Änderungen an Konfiguration/Setup greifen weiterhin auf den breiten Root-Projekt-Neulauf zurück.
  - `pnpm check:changed` ist das normale smarte lokale Gate für eng begrenzte Arbeit. Es klassifiziert den Diff in Core, Core-Tests, Extensions, Extension-Tests, Apps, Dokumentation, Release-Metadaten und Tooling und führt dann die passenden Typecheck-/Lint-/Test-Lanes aus. Änderungen am öffentlichen Plugin SDK und an Plugin-Verträgen beinhalten Extension-Validierung, weil Extensions von diesen Core-Verträgen abhängen. Reine Versionsanhebungen in Release-Metadaten führen gezielte Version-/Konfigurations-/Root-Dependency-Prüfungen statt der kompletten Suite aus, mit einer Guard, die Paketänderungen außerhalb des Versionsfelds auf oberster Ebene ablehnt.
  - Import-leichte Unit-Tests aus Agents, Commands, Plugins, Auto-Reply-Helfern, `plugin-sdk` und ähnlichen reinen Utility-Bereichen laufen über die `unit-fast`-Lane, die `test/setup-openclaw-runtime.ts` überspringt; zustandsbehaftete/laufzeitintensive Dateien bleiben auf den bestehenden Lanes.
  - Ausgewählte Quell-Helferdateien aus `plugin-sdk` und `commands` mappen Changed-Mode-Läufe auch auf explizite Nachbar-Tests in diesen leichten Lanes, sodass Helper-Änderungen nicht die komplette schwere Suite für dieses Verzeichnis erneut ausführen müssen.
  - `auto-reply` hat jetzt drei dedizierte Buckets: Core-Helfer auf oberster Ebene, `reply.*`-Integrationstests auf oberster Ebene und den Teilbaum `src/auto-reply/reply/**`. Dadurch bleibt die schwerste Reply-Harness-Arbeit von den günstigen Status-/Chunk-/Token-Tests fern.
- Hinweis zu eingebettetem Runner:
  - Wenn du Discovery-Eingaben für Message-Tools oder den Laufzeitkontext von Compaction änderst,
    behalte beide Ebenen der Abdeckung bei.
  - Füge fokussierte Helper-Regressionen für reine Routing-/Normalisierungsgrenzen hinzu.
  - Halte außerdem die eingebetteten Runner-Integration-Suiten gesund:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` und
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Diese Suiten verifizieren, dass gescopte IDs und Compaction-Verhalten weiterhin
    durch die echten Pfade `run.ts` / `compact.ts` fließen; reine Helper-Tests sind kein
    ausreichender Ersatz für diese Integrationspfade.
- Hinweis zu Pools:
  - Die Basis-Vitest-Konfiguration verwendet jetzt standardmäßig `threads`.
  - Die gemeinsame Vitest-Konfiguration setzt außerdem `isolate: false` fest und verwendet den nicht isolierten Runner über Root-Projekte, E2E- und Live-Konfigurationen hinweg.
  - Die Root-UI-Lane behält ihr `jsdom`-Setup und ihren Optimizer, läuft jetzt aber ebenfalls auf dem gemeinsamen nicht isolierten Runner.
  - Jeder `pnpm test`-Shard erbt dieselben Standards `threads` + `isolate: false` aus der gemeinsamen Vitest-Konfiguration.
  - Der gemeinsame Launcher `scripts/run-vitest.mjs` fügt jetzt standardmäßig auch `--no-maglev` für untergeordnete Vitest-Node-Prozesse hinzu, um V8-Kompilierungs-Churn bei großen lokalen Läufen zu reduzieren. Setze `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, wenn du gegen das Standardverhalten von V8 vergleichen musst.
- Hinweis zu schneller lokaler Iteration:
  - `pnpm changed:lanes` zeigt, welche Architektur-Lanes ein Diff auslöst.
  - Der Pre-Commit-Hook führt nach gestagtem Formatieren/Linting `pnpm check:changed --staged` aus, sodass reine Core-Commits nicht die Kosten für Extension-Tests zahlen, sofern sie keine öffentlichen extensionseitigen Verträge berühren. Reine Release-Metadaten-Commits bleiben auf der gezielten Version-/Konfigurations-/Root-Dependency-Lane.
  - `pnpm test:changed` routet über gescopte Lanes, wenn die geänderten Pfade sauber auf eine kleinere Suite abgebildet werden.
  - `pnpm test:max` und `pnpm test:changed:max` behalten dasselbe Routing-Verhalten bei, nur mit höherem Worker-Limit.
  - Das automatische Skalieren lokaler Worker ist jetzt bewusst konservativ und fährt ebenfalls zurück, wenn die Load Average des Hosts bereits hoch ist, sodass mehrere parallele Vitest-Läufe standardmäßig weniger Schaden anrichten.
  - Die Basis-Vitest-Konfiguration markiert die Projekte-/Konfigurationsdateien als `forceRerunTriggers`, sodass Changed-Mode-Neuläufe korrekt bleiben, wenn sich das Test-Wiring ändert.
  - Die Konfiguration hält `OPENCLAW_VITEST_FS_MODULE_CACHE` auf unterstützten Hosts aktiviert; setze `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, wenn du einen expliziten Cache-Ort für direktes Profiling möchtest.
- Hinweis zu Performance-Debugging:
  - `pnpm test:perf:imports` aktiviert Vitest-Reporting zur Importdauer plus Ausgabe der Import-Aufschlüsselung.
  - `pnpm test:perf:imports:changed` begrenzt dieselbe Profiling-Ansicht auf Dateien, die seit `origin/main` geändert wurden.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` vergleicht geroutetes `test:changed` mit dem nativen Root-Projekt-Pfad für diesen festgeschriebenen Diff und gibt Wall Time sowie macOS-Max-RSS aus.
- `pnpm test:perf:changed:bench -- --worktree` benchmarkt den aktuellen schmutzigen Baum, indem die Liste geänderter Dateien durch `scripts/test-projects.mjs` und die Root-Vitest-Konfiguration geroutet wird.
  - `pnpm test:perf:profile:main` schreibt ein CPU-Profil des Hauptthreads für Vitest/Vite-Startup und Transform-Overhead.
  - `pnpm test:perf:profile:runner` schreibt Runner-CPU- und Heap-Profile für die Unit-Suite bei deaktivierter Dateiparallelität.

### E2E (Gateway-Smoke)

- Befehl: `pnpm test:e2e`
- Konfiguration: `vitest.e2e.config.ts`
- Dateien: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- Laufzeitstandards:
  - Verwendet Vitest `threads` mit `isolate: false`, passend zum Rest des Repos.
  - Verwendet adaptive Worker (CI: bis zu 2, lokal: standardmäßig 1).
  - Läuft standardmäßig im Silent-Modus, um den Overhead durch Konsolen-I/O zu reduzieren.
- Nützliche Überschreibungen:
  - `OPENCLAW_E2E_WORKERS=<n>`, um die Worker-Anzahl zu erzwingen (begrenzt auf 16).
  - `OPENCLAW_E2E_VERBOSE=1`, um ausführliche Konsolenausgabe wieder zu aktivieren.
- Umfang:
  - End-to-End-Verhalten des Gateways mit mehreren Instanzen
  - WebSocket-/HTTP-Oberflächen, Node-Pairing und schwergewichtigere Netzwerkeffekte
- Erwartungen:
  - Läuft in CI (wenn in der Pipeline aktiviert)
  - Keine echten Schlüssel erforderlich
  - Mehr bewegliche Teile als Unit-Tests (kann langsamer sein)

### E2E: OpenShell-Backend-Smoke

- Befehl: `pnpm test:e2e:openshell`
- Datei: `test/openshell-sandbox.e2e.test.ts`
- Umfang:
  - Startet ein isoliertes OpenShell-Gateway auf dem Host über Docker
  - Erstellt eine Sandbox aus einem temporären lokalen Dockerfile
  - Übt das OpenShell-Backend von OpenClaw über echtes `sandbox ssh-config` + SSH-Exec aus
  - Verifiziert remote-kanonisches Dateisystemverhalten über die Sandbox-FS-Bridge
- Erwartungen:
  - Nur Opt-in; nicht Teil des Standardlaufs `pnpm test:e2e`
  - Erfordert ein lokales `openshell`-CLI und einen funktionierenden Docker-Daemon
  - Verwendet isoliertes `HOME` / `XDG_CONFIG_HOME`, zerstört dann Test-Gateway und Sandbox
- Nützliche Überschreibungen:
  - `OPENCLAW_E2E_OPENSHELL=1`, um den Test zu aktivieren, wenn die breitere E2E-Suite manuell ausgeführt wird
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, um auf ein nicht standardmäßiges CLI-Binary oder Wrapper-Skript zu zeigen

### Live (reale Provider + reale Modelle)

- Befehl: `pnpm test:live`
- Konfiguration: `vitest.live.config.ts`
- Dateien: `src/**/*.live.test.ts`
- Standard: **aktiviert** durch `pnpm test:live` (setzt `OPENCLAW_LIVE_TEST=1`)
- Umfang:
  - „Funktioniert dieser Provider/dieses Modell _heute_ tatsächlich mit echten Credentials?“
  - Erkennt Änderungen am Provider-Format, Tool-Calling-Eigenheiten, Auth-Probleme und Rate-Limit-Verhalten
- Erwartungen:
  - Absichtlich nicht CI-stabil (reale Netzwerke, reale Provider-Richtlinien, Quoten, Ausfälle)
  - Kostet Geld / verbraucht Rate Limits
  - Bevorzuge eingegrenzte Teilmengen statt „alles“
- Live-Läufe sourcen `~/.profile`, um fehlende API-Schlüssel aufzunehmen.
- Standardmäßig isolieren Live-Läufe weiterhin `HOME` und kopieren Config-/Auth-Material in ein temporäres Test-Home, damit Unit-Fixtures dein echtes `~/.openclaw` nicht verändern können.
- Setze `OPENCLAW_LIVE_USE_REAL_HOME=1` nur dann, wenn du absichtlich möchtest, dass Live-Tests dein echtes Home-Verzeichnis verwenden.
- `pnpm test:live` verwendet jetzt standardmäßig einen ruhigeren Modus: Es behält die `[live] ...`-Fortschrittsausgabe bei, unterdrückt aber den zusätzlichen `~/.profile`-Hinweis und schaltet Gateway-Bootstrap-Logs/Bonjour-Chattern stumm. Setze `OPENCLAW_LIVE_TEST_QUIET=0`, wenn du die vollständigen Startup-Logs wiederhaben möchtest.
- API-Key-Rotation (providerspezifisch): setze `*_API_KEYS` im Komma-/Semikolon-Format oder `*_API_KEY_1`, `*_API_KEY_2` (zum Beispiel `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) oder einen per-Live-Override über `OPENCLAW_LIVE_*_KEY`; Tests versuchen es bei Rate-Limit-Antworten erneut.
- Fortschritts-/Heartbeat-Ausgabe:
  - Live-Suiten geben jetzt Fortschrittszeilen an stderr aus, sodass lange Provider-Aufrufe sichtbar aktiv bleiben, auch wenn Vitest-Konsolenerfassung still ist.
  - `vitest.live.config.ts` deaktiviert Vitest-Konsoleninterception, sodass Fortschrittszeilen von Provider/Gateway bei Live-Läufen sofort gestreamt werden.
  - Direkte Modell-Heartbeats mit `OPENCLAW_LIVE_HEARTBEAT_MS` anpassen.
  - Gateway-/Probe-Heartbeats mit `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` anpassen.

## Welche Suite sollte ich ausführen?

Verwende diese Entscheidungstabelle:

- Logik/Tests bearbeiten: `pnpm test` ausführen (und `pnpm test:coverage`, wenn du viel geändert hast)
- Gateway-Netzwerk / WS-Protokoll / Pairing anfassen: zusätzlich `pnpm test:e2e`
- „Mein Bot ist down“ / providerspezifische Fehler / Tool-Calling debuggen: einen eingegrenzten `pnpm test:live` ausführen

## Live: Android-Node-Fähigkeiten-Sweep

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Skript: `pnpm android:test:integration`
- Ziel: **jeden aktuell beworbenen Befehl** eines verbundenen Android-Node aufrufen und das Verhalten des Befehlsvertrags prüfen.
- Umfang:
  - Vorbedingte/manuelle Einrichtung (die Suite installiert/startet/paart die App nicht).
  - Gateway-`node.invoke`-Validierung Befehl für Befehl für den ausgewählten Android-Node.
- Erforderliche Vorab-Einrichtung:
  - Android-App bereits mit dem Gateway verbunden und gepairt.
  - App im Vordergrund halten.
  - Berechtigungen/Erfassungszustimmung für Fähigkeiten erteilen, die erfolgreich sein sollen.
- Optionale Zielüberschreibungen:
  - `OPENCLAW_ANDROID_NODE_ID` oder `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Vollständige Android-Setup-Details: [Android App](/de/platforms/android)

## Live: Modell-Smoke (Profil-Schlüssel)

Live-Tests sind in zwei Ebenen aufgeteilt, damit wir Fehler isolieren können:

- „Direktes Modell“ sagt uns, ob der Provider/das Modell mit dem gegebenen Schlüssel überhaupt antworten kann.
- „Gateway-Smoke“ sagt uns, ob die vollständige Gateway-+Agent-Pipeline für dieses Modell funktioniert (Sitzungen, Verlauf, Tools, Sandbox-Richtlinie usw.).

### Ebene 1: Direkte Modell-Completion (ohne Gateway)

- Test: `src/agents/models.profiles.live.test.ts`
- Ziel:
  - Erkannte Modelle aufzählen
  - `getApiKeyForModel` verwenden, um Modelle auszuwählen, für die du Credentials hast
  - Pro Modell eine kleine Completion ausführen (und gezielte Regressionen, wo nötig)
- Aktivierung:
  - `pnpm test:live` (oder `OPENCLAW_LIVE_TEST=1`, wenn Vitest direkt aufgerufen wird)
- Setze `OPENCLAW_LIVE_MODELS=modern` (oder `all`, Alias für modern), damit diese Suite tatsächlich läuft; andernfalls wird sie übersprungen, damit `pnpm test:live` auf Gateway-Smoke fokussiert bleibt
- Modellauswahl:
  - `OPENCLAW_LIVE_MODELS=modern`, um die moderne Allowlist auszuführen (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` ist ein Alias für die moderne Allowlist
  - oder `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (kommagetrennte Allowlist)
  - Moderne/alle Sweeps verwenden standardmäßig ein kuratiertes High-Signal-Limit; setze `OPENCLAW_LIVE_MAX_MODELS=0` für einen vollständigen modernen Sweep oder eine positive Zahl für ein kleineres Limit.
- Providerauswahl:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (kommagetrennte Allowlist)
- Woher die Schlüssel kommen:
  - Standardmäßig: Profile-Store und Env-Fallbacks
  - Setze `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um **nur** den Profile-Store zu erzwingen
- Warum das existiert:
  - Trennt „Provider-API ist kaputt / Schlüssel ist ungültig“ von „Gateway-Agent-Pipeline ist kaputt“
  - Enthält kleine, isolierte Regressionen (Beispiel: OpenAI-Responses/Codex-Responses-Reasoning-Replay + Tool-Call-Flows)

### Ebene 2: Gateway + Dev-Agent-Smoke (was "@openclaw" tatsächlich macht)

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Ziel:
  - Ein In-Process-Gateway hochfahren
  - Eine `agent:dev:*`-Sitzung erstellen/patchen (Modell-Override pro Lauf)
  - Modelle mit Schlüsseln durchiterieren und prüfen:
    - „sinnvolle“ Antwort (ohne Tools)
    - ein echter Tool-Aufruf funktioniert (Read-Probe)
    - optionale zusätzliche Tool-Probes (Exec+Read-Probe)
    - OpenAI-Regressionspfade (nur Tool-Call → Follow-up) bleiben funktionsfähig
- Probe-Details (damit du Fehler schnell erklären kannst):
  - `read`-Probe: Der Test schreibt eine Nonce-Datei in den Workspace und fordert den Agenten auf, sie zu `read`en und die Nonce zurückzugeben.
  - `exec+read`-Probe: Der Test fordert den Agenten auf, per `exec` eine Nonce in eine Temp-Datei zu schreiben und sie dann zurück zu `read`en.
  - Image-Probe: Der Test hängt ein generiertes PNG (Katze + randomisierter Code) an und erwartet, dass das Modell `cat <CODE>` zurückgibt.
  - Implementierungsreferenz: `src/gateway/gateway-models.profiles.live.test.ts` und `src/gateway/live-image-probe.ts`.
- Aktivierung:
  - `pnpm test:live` (oder `OPENCLAW_LIVE_TEST=1`, wenn Vitest direkt aufgerufen wird)
- Modellauswahl:
  - Standard: moderne Allowlist (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` ist ein Alias für die moderne Allowlist
  - Oder `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (oder Kommaliste) setzen, um einzugrenzen
  - Moderne/alle Gateway-Sweeps verwenden standardmäßig ein kuratiertes High-Signal-Limit; setze `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` für einen vollständigen modernen Sweep oder eine positive Zahl für ein kleineres Limit.
- Providerauswahl (vermeide „OpenRouter alles“):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (kommagetrennte Allowlist)
- Tool- + Image-Probes sind in diesem Live-Test immer aktiviert:
  - `read`-Probe + `exec+read`-Probe (Tool-Stress)
  - Image-Probe läuft, wenn das Modell Unterstützung für Bildeingabe bewirbt
  - Ablauf (auf hoher Ebene):
    - Test generiert ein kleines PNG mit „CAT“ + Zufallscode (`src/gateway/live-image-probe.ts`)
    - Sendet es via `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Gateway parst Attachments in `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Eingebetteter Agent leitet eine multimodale Benutzernachricht an das Modell weiter
    - Assertion: Antwort enthält `cat` + den Code (OCR-Toleranz: kleine Fehler erlaubt)

Tipp: Um zu sehen, was du auf deiner Maschine testen kannst (und die exakten `provider/model`-IDs), führe aus:

```bash
openclaw models list
openclaw models list --json
```

## Live: CLI-Backend-Smoke (Claude, Codex, Gemini oder andere lokale CLIs)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Ziel: die Gateway-+Agent-Pipeline mit einem lokalen CLI-Backend validieren, ohne deine Standardkonfiguration anzufassen.
- Backend-spezifische Smoke-Standards liegen mit der `cli-backend.ts`-Definition der besitzenden Erweiterung.
- Aktivierung:
  - `pnpm test:live` (oder `OPENCLAW_LIVE_TEST=1`, wenn Vitest direkt aufgerufen wird)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Standards:
  - Standard-Provider/-Modell: `claude-cli/claude-sonnet-4-6`
  - Befehl/Args/Image-Verhalten kommen aus den Plugin-Metadaten des besitzenden CLI-Backends.
- Überschreibungen (optional):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`, um ein echtes Bild-Attachment zu senden (Pfade werden in den Prompt injiziert).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`, um Bilddateipfade statt per Prompt-Injektion als CLI-Args zu übergeben.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (oder `"list"`), um zu steuern, wie Bild-Args übergeben werden, wenn `IMAGE_ARG` gesetzt ist.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`, um einen zweiten Turn zu senden und den Resume-Flow zu validieren.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0`, um die standardmäßige Sonnet-→-Opus-Kontinuitätsprobe derselben Sitzung für Claude zu deaktivieren (auf `1` setzen, um sie zu erzwingen, wenn das ausgewählte Modell ein Switch-Ziel unterstützt).

Beispiel:

```bash
OPENCLAW_LIVE_CLI_BACKEND=1 \
  OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4" \
  pnpm test:live src/gateway/gateway-cli-backend.live.test.ts
```

Docker-Rezept:

```bash
pnpm test:docker:live-cli-backend
```

Docker-Rezepte für einzelne Provider:

```bash
pnpm test:docker:live-cli-backend:claude
pnpm test:docker:live-cli-backend:claude-subscription
pnpm test:docker:live-cli-backend:codex
pnpm test:docker:live-cli-backend:gemini
```

Hinweise:

- Der Docker-Runner liegt unter `scripts/test-live-cli-backend-docker.sh`.
- Er führt den Live-CLI-Backend-Smoke innerhalb des Repo-Docker-Images als nicht-root-`node`-Benutzer aus.
- Er löst CLI-Smoke-Metadaten aus der besitzenden Erweiterung auf und installiert dann das passende Linux-CLI-Paket (`@anthropic-ai/claude-code`, `@openai/codex` oder `@google/gemini-cli`) in ein gecachtes beschreibbares Präfix unter `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (Standard: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` erfordert portables Claude-Code-Subscription-OAuth über entweder `~/.claude/.credentials.json` mit `claudeAiOauth.subscriptionType` oder `CLAUDE_CODE_OAUTH_TOKEN` aus `claude setup-token`. Es beweist zuerst direkt `claude -p` in Docker und führt dann zwei Gateway-CLI-Backend-Turns aus, ohne Anthropic-API-Key-Env-Variablen beizubehalten. Diese Subscription-Lane deaktiviert standardmäßig die Claude-MCP-/Tool- und Image-Probes, weil Claude derzeit die Nutzung von Drittanbieter-Apps über zusätzliche Nutzungsabrechnung statt über normale Subscription-Plan-Grenzen routet.
- Der Live-CLI-Backend-Smoke übt jetzt denselben End-to-End-Flow für Claude, Codex und Gemini aus: Text-Turn, Bildklassifizierungs-Turn, dann MCP-Tool-Call `cron`, der über das Gateway-CLI verifiziert wird.
- Claudes Standard-Smoke patcht außerdem die Sitzung von Sonnet auf Opus und verifiziert, dass die fortgesetzte Sitzung sich weiterhin an eine frühere Notiz erinnert.

## Live: ACP-Bind-Smoke (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Ziel: den realen ACP-Konversations-Bind-Flow mit einem Live-ACP-Agenten validieren:
  - `/acp spawn <agent> --bind here` senden
  - eine synthetische Message-Channel-Konversation direkt vor Ort binden
  - ein normales Follow-up in derselben Konversation senden
  - verifizieren, dass das Follow-up im Transkript der gebundenen ACP-Sitzung landet
- Aktivierung:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Standards:
  - ACP-Agenten in Docker: `claude,codex,gemini`
  - ACP-Agent für direktes `pnpm test:live ...`: `claude`
  - Synthetischer Kanal: Slack-DM-artiger Konversationskontext
  - ACP-Backend: `acpx`
- Überschreibungen:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- Hinweise:
  - Diese Lane verwendet die Gateway-Oberfläche `chat.send` mit admin-only synthetischen Feldern für die Ursprung-Route, damit Tests Message-Channel-Kontext anheften können, ohne vorzutäuschen, extern zuzustellen.
  - Wenn `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` nicht gesetzt ist, verwendet der Test die eingebaute Agent-Registry des eingebetteten `acpx`-Plugins für den ausgewählten ACP-Harness-Agenten.

Beispiel:

```bash
OPENCLAW_LIVE_ACP_BIND=1 \
  OPENCLAW_LIVE_ACP_BIND_AGENT=claude \
  pnpm test:live src/gateway/gateway-acp-bind.live.test.ts
```

Docker-Rezept:

```bash
pnpm test:docker:live-acp-bind
```

Docker-Rezepte für einzelne Agenten:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

Docker-Hinweise:

- Der Docker-Runner liegt unter `scripts/test-live-acp-bind-docker.sh`.
- Standardmäßig führt er den ACP-Bind-Smoke nacheinander gegen alle unterstützten Live-CLI-Agenten aus: `claude`, `codex`, dann `gemini`.
- Verwende `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` oder `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`, um die Matrix einzugrenzen.
- Er sourct `~/.profile`, staged das passende CLI-Auth-Material in den Container, installiert `acpx` in ein beschreibbares npm-Präfix und installiert dann das angeforderte Live-CLI (`@anthropic-ai/claude-code`, `@openai/codex` oder `@google/gemini-cli`), falls es fehlt.
- Innerhalb von Docker setzt der Runner `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx`, damit acpx Provider-Env-Variablen aus dem gesourcten Profil für das untergeordnete Harness-CLI verfügbar hält.

## Live: Codex-App-Server-Harness-Smoke

- Ziel: das Plugin-eigene Codex-Harness über die normale Gateway-
  `agent`-Methode validieren:
  - das gebündelte `codex` Plugin laden
  - `OPENCLAW_AGENT_RUNTIME=codex` auswählen
  - einen ersten Gateway-Agent-Turn an `codex/gpt-5.4` senden
  - einen zweiten Turn an dieselbe OpenClaw-Sitzung senden und verifizieren, dass der App-Server-
    Thread fortgesetzt werden kann
  - `/codex status` und `/codex models` über denselben Gateway-Befehls-
    pfad ausführen
- Test: `src/gateway/gateway-codex-harness.live.test.ts`
- Aktivieren: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Standardmodell: `codex/gpt-5.4`
- Optionale Image-Probe: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Optionale MCP-/Tool-Probe: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Der Smoke setzt `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, damit ein defektes Codex-
  Harness nicht dadurch besteht, dass es stillschweigend auf PI zurückfällt.
- Auth: `OPENAI_API_KEY` aus Shell/Profil, plus optional kopierte
  `~/.codex/auth.json` und `~/.codex/config.toml`

Lokales Rezept:

```bash
source ~/.profile
OPENCLAW_LIVE_CODEX_HARNESS=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1 \
  OPENCLAW_LIVE_CODEX_HARNESS_MODEL=codex/gpt-5.4 \
  pnpm test:live -- src/gateway/gateway-codex-harness.live.test.ts
```

Docker-Rezept:

```bash
source ~/.profile
pnpm test:docker:live-codex-harness
```

Docker-Hinweise:

- Der Docker-Runner liegt unter `scripts/test-live-codex-harness-docker.sh`.
- Er sourct das gemountete `~/.profile`, übergibt `OPENAI_API_KEY`, kopiert Codex-CLI-
  Auth-Dateien, wenn vorhanden, installiert `@openai/codex` in ein beschreibbares gemountetes npm-
  Präfix, staged den Source-Tree und führt dann nur den Codex-Harness-Live-Test aus.
- Docker aktiviert die Image- und MCP-/Tool-Probes standardmäßig. Setze
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` oder
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0`, wenn du einen engeren Debug-Lauf brauchst.
- Docker exportiert außerdem `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, passend zur Live-
  Testkonfiguration, sodass `openai-codex/*`- oder PI-Fallback keinen Codex-Harness-
  Regressionsfehler verbergen kann.

### Empfohlene Live-Rezepte

Schmale, explizite Allowlists sind am schnellsten und am wenigsten flaky:

- Einzelnes Modell, direkt (ohne Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Einzelnes Modell, Gateway-Smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Tool-Calling über mehrere Provider hinweg:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google-Fokus (Gemini-API-Key + Antigravity):
  - Gemini (API-Key): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Hinweise:

- `google/...` verwendet die Gemini-API (API-Key).
- `google-antigravity/...` verwendet die Antigravity-OAuth-Bridge (Cloud-Code-Assist-artiger Agent-Endpunkt).
- `google-gemini-cli/...` verwendet das lokale Gemini-CLI auf deiner Maschine (separate Auth + Tooling-Eigenheiten).
- Gemini-API vs Gemini-CLI:
  - API: OpenClaw ruft Googles gehostete Gemini-API über HTTP auf (API-Key / Profil-Auth); das ist das, was die meisten Benutzer mit „Gemini“ meinen.
  - CLI: OpenClaw shellt zu einem lokalen `gemini`-Binary aus; es hat seine eigene Auth und kann sich unterschiedlich verhalten (Streaming/Tool-Support/Versionsabweichung).

## Live: Modellmatrix (was wir abdecken)

Es gibt keine feste „CI-Modellliste“ (Live ist Opt-in), aber dies sind die **empfohlenen** Modelle, die regelmäßig auf einer Entwickler-Maschine mit Schlüsseln abgedeckt werden sollten.

### Moderner Smoke-Satz (Tool-Calling + Bild)

Das ist der Lauf für die „üblichen Modelle“, den wir funktionsfähig halten wollen:

- OpenAI (nicht-Codex): `openai/gpt-5.4` (optional: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (oder `anthropic/claude-sonnet-4-6`)
- Google (Gemini-API): `google/gemini-3.1-pro-preview` und `google/gemini-3-flash-preview` (ältere Gemini-2.x-Modelle vermeiden)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` und `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Gateway-Smoke mit Tools + Bild ausführen:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Baseline: Tool-Calling (Read + optional Exec)

Wähle mindestens eines pro Provider-Familie:

- OpenAI: `openai/gpt-5.4` (oder `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (oder `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (oder `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Optionale zusätzliche Abdeckung (nice to have):

- xAI: `xai/grok-4` (oder die neueste verfügbare Version)
- Mistral: `mistral/`… (wähle ein „tools“-fähiges Modell, das du aktiviert hast)
- Cerebras: `cerebras/`… (falls du Zugriff hast)
- LM Studio: `lmstudio/`… (lokal; Tool-Calling hängt vom API-Modus ab)

### Vision: Bild senden (Attachment → multimodale Nachricht)

Nimm mindestens ein bildfähiges Modell in `OPENCLAW_LIVE_GATEWAY_MODELS` auf (Claude/Gemini/OpenAI-Varianten mit Bildunterstützung usw.), um die Image-Probe auszuüben.

### Aggregatoren / alternative Gateways

Wenn du entsprechende Schlüssel aktiviert hast, unterstützen wir auch Tests über:

- OpenRouter: `openrouter/...` (Hunderte Modelle; verwende `openclaw models scan`, um Kandidaten mit Tool- + Bildfähigkeit zu finden)
- OpenCode: `opencode/...` für Zen und `opencode-go/...` für Go (Auth über `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Weitere Provider, die du in die Live-Matrix aufnehmen kannst (wenn du Credentials/Konfiguration hast):

- Eingebaut: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Über `models.providers` (benutzerdefinierte Endpunkte): `minimax` (Cloud/API) sowie jeder OpenAI-/Anthropic-kompatible Proxy (LM Studio, vLLM, LiteLLM usw.)

Tipp: Versuche nicht, „alle Modelle“ fest in die Dokumentation zu codieren. Die maßgebliche Liste ist das, was `discoverModels(...)` auf deiner Maschine zurückgibt + welche Schlüssel verfügbar sind.

## Credentials (niemals committen)

Live-Tests finden Credentials auf dieselbe Weise wie das CLI. Praktische Folgen:

- Wenn das CLI funktioniert, sollten Live-Tests dieselben Schlüssel finden.
- Wenn ein Live-Test „keine Credentials“ meldet, debugge genauso, wie du `openclaw models list` / Modellauswahl debuggen würdest.

- Auth-Profile pro Agent: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (das ist mit „Profil-Schlüssel“ in den Live-Tests gemeint)
- Konfiguration: `~/.openclaw/openclaw.json` (oder `OPENCLAW_CONFIG_PATH`)
- Veraltetes State-Verzeichnis: `~/.openclaw/credentials/` (wird in das gestagte Live-Home kopiert, wenn vorhanden, aber nicht in den Haupt-Store für Profil-Schlüssel)
- Lokale Live-Läufe kopieren standardmäßig die aktive Konfiguration, `auth-profiles.json`-Dateien pro Agent, das veraltete `credentials/` und unterstützte externe CLI-Auth-Verzeichnisse in ein temporäres Test-Home; gestagte Live-Homes überspringen `workspace/` und `sandboxes/`, und Pfad-Overrides `agents.*.workspace` / `agentDir` werden entfernt, damit Probes von deinem echten Host-Workspace fernbleiben.

Wenn du dich auf Env-Schlüssel verlassen willst (z. B. in deiner `~/.profile` exportiert), führe lokale Tests nach `source ~/.profile` aus oder verwende die Docker-Runner unten (sie können `~/.profile` in den Container mounten).

## Deepgram live (Audiotranskription)

- Test: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- Aktivieren: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## BytePlus Coding-Plan live

- Test: `src/agents/byteplus.live.test.ts`
- Aktivieren: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- Optionale Modellüberschreibung: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI-Workflow-Medien live

- Test: `extensions/comfy/comfy.live.test.ts`
- Aktivieren: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Umfang:
  - Übt die gebündelten Comfy-Pfade für Bild, Video und `music_generate` aus
  - Überspringt jede Fähigkeit, sofern `models.providers.comfy.<capability>` nicht konfiguriert ist
  - Nützlich nach Änderungen an Comfy-Workflow-Übermittlung, Polling, Downloads oder Plugin-Registrierung

## Bildgenerierung live

- Test: `src/image-generation/runtime.live.test.ts`
- Befehl: `pnpm test:live src/image-generation/runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Umfang:
  - Zählt jedes registrierte Plugin für Bildgenerierungs-Provider auf
  - Lädt fehlende Provider-Env-Variablen vor den Probes aus deiner Login-Shell (`~/.profile`)
  - Verwendet standardmäßig Live-/Env-API-Schlüssel vor gespeicherten Auth-Profilen, sodass veraltete Testschlüssel in `auth-profiles.json` echte Shell-Credentials nicht verdecken
  - Überspringt Provider ohne nutzbare Auth/Profil/Modell
  - Führt die Standardvarianten der Bildgenerierung über die gemeinsame Runtime-Fähigkeit aus:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Aktuell abgedeckte gebündelte Provider:
  - `openai`
  - `google`
- Optionale Eingrenzung:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-2,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- Optionales Auth-Verhalten:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um Auth aus dem Profile-Store zu erzwingen und rein env-basierte Overrides zu ignorieren

## Musikgenerierung live

- Test: `extensions/music-generation-providers.live.test.ts`
- Aktivieren: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Umfang:
  - Übt den gemeinsamen gebündelten Provider-Pfad für Musikgenerierung aus
  - Deckt derzeit Google und MiniMax ab
  - Lädt Provider-Env-Variablen vor den Probes aus deiner Login-Shell (`~/.profile`)
  - Verwendet standardmäßig Live-/Env-API-Schlüssel vor gespeicherten Auth-Profilen, sodass veraltete Testschlüssel in `auth-profiles.json` echte Shell-Credentials nicht verdecken
  - Überspringt Provider ohne nutzbare Auth/Profil/Modell
  - Führt beide deklarierten Runtime-Modi aus, wenn verfügbar:
    - `generate` mit nur Prompt als Eingabe
    - `edit`, wenn der Provider `capabilities.edit.enabled` deklariert
  - Aktuelle Abdeckung der gemeinsamen Lane:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: separate Comfy-Live-Datei, nicht dieser gemeinsame Sweep
- Optionale Eingrenzung:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- Optionales Auth-Verhalten:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um Auth aus dem Profile-Store zu erzwingen und rein env-basierte Overrides zu ignorieren

## Videogenerierung live

- Test: `extensions/video-generation-providers.live.test.ts`
- Aktivieren: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Umfang:
  - Übt den gemeinsamen gebündelten Provider-Pfad für Videogenerierung aus
  - Verwendet standardmäßig den release-sicheren Smoke-Pfad: Nicht-FAL-Provider, eine Text-zu-Video-Anfrage pro Provider, ein einsekündiger Hummer-Prompt und ein Provider-spezifisches Operationslimit aus `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (standardmäßig `180000`)
  - Überspringt FAL standardmäßig, weil providerseitige Queue-Latenz die Release-Zeit dominieren kann; übergib `--video-providers fal` oder `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"`, um es explizit auszuführen
  - Lädt vor den Probes Provider-Env-Variablen aus deiner Login-Shell (`~/.profile`)
  - Verwendet standardmäßig Live-/Env-API-Schlüssel vor gespeicherten Auth-Profilen, sodass veraltete Testschlüssel in `auth-profiles.json` echte Shell-Credentials nicht verdecken
  - Überspringt Provider ohne nutzbare Auth/Profil/Modell
  - Führt standardmäßig nur `generate` aus
  - Setze `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, um zusätzlich deklarierte Transform-Modi auszuführen, wenn verfügbar:
    - `imageToVideo`, wenn der Provider `capabilities.imageToVideo.enabled` deklariert und der ausgewählte Provider/das Modell im gemeinsamen Sweep buffer-gestützte lokale Bildeingabe akzeptiert
    - `videoToVideo`, wenn der Provider `capabilities.videoToVideo.enabled` deklariert und der ausgewählte Provider/das Modell im gemeinsamen Sweep buffer-gestützte lokale Videoeingabe akzeptiert
  - Aktuell deklarierte, aber im gemeinsamen Sweep übersprungene `imageToVideo`-Provider:
    - `vydra`, weil das gebündelte `veo3` nur Text unterstützt und das gebündelte `kling` eine entfernte Bild-URL erfordert
  - Provider-spezifische Vydra-Abdeckung:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - diese Datei führt `veo3` Text-zu-Video sowie eine `kling`-Lane aus, die standardmäßig eine Fixture mit entfernter Bild-URL verwendet
  - Aktuelle `videoToVideo`-Live-Abdeckung:
    - nur `runway`, wenn das ausgewählte Modell `runway/gen4_aleph` ist
  - Aktuell deklarierte, aber im gemeinsamen Sweep übersprungene `videoToVideo`-Provider:
    - `alibaba`, `qwen`, `xai`, weil diese Pfade derzeit entfernte Referenz-URLs mit `http(s)` / MP4 erfordern
    - `google`, weil die aktuelle gemeinsame Gemini-/Veo-Lane lokale buffer-gestützte Eingabe verwendet und dieser Pfad im gemeinsamen Sweep nicht akzeptiert wird
    - `openai`, weil der aktuelle gemeinsame Pfad keine org-spezifischen Garantien für Zugriff auf Video-Inpaint/Remix hat
- Optionale Eingrenzung:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`, um jeden Provider in den Standard-Sweep einzubeziehen, einschließlich FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`, um das Operationslimit pro Provider für einen aggressiven Smoke-Lauf zu reduzieren
- Optionales Auth-Verhalten:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um Auth aus dem Profile-Store zu erzwingen und rein env-basierte Overrides zu ignorieren

## Media-Live-Harness

- Befehl: `pnpm test:live:media`
- Zweck:
  - Führt die gemeinsamen Live-Suiten für Bild, Musik und Video über einen einzigen repo-nativen Entry-Point aus
  - Lädt fehlende Provider-Env-Variablen automatisch aus `~/.profile`
  - Grenzt jede Suite standardmäßig automatisch auf Provider ein, die aktuell nutzbare Auth haben
  - Verwendet `scripts/test-live.mjs` erneut, sodass Heartbeat- und Quiet-Mode-Verhalten konsistent bleiben
- Beispiele:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Docker-Runner (optionale „funktioniert unter Linux“-Prüfungen)

Diese Docker-Runner teilen sich in zwei Gruppen:

- Live-Modell-Runner: `test:docker:live-models` und `test:docker:live-gateway` führen nur ihre passende Live-Datei für Profil-Schlüssel im Repo-Docker-Image aus (`src/agents/models.profiles.live.test.ts` und `src/gateway/gateway-models.profiles.live.test.ts`), mounten dein lokales Config-Verzeichnis und deinen Workspace (und sourcen `~/.profile`, falls gemountet). Die passenden lokalen Entry-Points sind `test:live:models-profiles` und `test:live:gateway-profiles`.
- Docker-Live-Runner verwenden standardmäßig ein kleineres Smoke-Limit, damit ein vollständiger Docker-Sweep praktikabel bleibt:
  `test:docker:live-models` verwendet standardmäßig `OPENCLAW_LIVE_MAX_MODELS=12`, und
  `test:docker:live-gateway` verwendet standardmäßig `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` und
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Überschreibe diese Env-Variablen, wenn du
  ausdrücklich den größeren vollständigen Scan möchtest.
- `test:docker:all` baut das Live-Docker-Image einmal über `test:docker:live-build` und verwendet es dann für die beiden Docker-Live-Lanes wieder.
- Container-Smoke-Runner: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:gateway-network`, `test:docker:mcp-channels` und `test:docker:plugins` booten einen oder mehrere reale Container und verifizieren Integrationspfade auf höherer Ebene.

Die Docker-Runner für Live-Modelle binden außerdem nur die benötigten externen CLI-Auth-Homes ein (oder alle unterstützten, wenn der Lauf nicht eingegrenzt ist) und kopieren sie dann vor dem Lauf in das Container-Home, sodass OAuth externer CLIs Tokens aktualisieren kann, ohne den Auth-Store des Hosts zu verändern:

- Direkte Modelle: `pnpm test:docker:live-models` (Skript: `scripts/test-live-models-docker.sh`)
- ACP-Bind-Smoke: `pnpm test:docker:live-acp-bind` (Skript: `scripts/test-live-acp-bind-docker.sh`)
- CLI-Backend-Smoke: `pnpm test:docker:live-cli-backend` (Skript: `scripts/test-live-cli-backend-docker.sh`)
- Codex-App-Server-Harness-Smoke: `pnpm test:docker:live-codex-harness` (Skript: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + Dev-Agent: `pnpm test:docker:live-gateway` (Skript: `scripts/test-live-gateway-models-docker.sh`)
- Open-WebUI-Live-Smoke: `pnpm test:docker:openwebui` (Skript: `scripts/e2e/openwebui-docker.sh`)
- Onboarding-Wizard (TTY, vollständiges Scaffolding): `pnpm test:docker:onboard` (Skript: `scripts/e2e/onboard-docker.sh`)
- Gateway-Netzwerk (zwei Container, WS-Auth + Health): `pnpm test:docker:gateway-network` (Skript: `scripts/e2e/gateway-network-docker.sh`)
- MCP-Kanal-Bridge (vorgefülltes Gateway + stdio-Bridge + roher Claude-Benachrichtigungsframe-Smoke): `pnpm test:docker:mcp-channels` (Skript: `scripts/e2e/mcp-channels-docker.sh`)
- Plugins (Installations-Smoke + `/plugin`-Alias + Neustart-Semantik des Claude-Bundles): `pnpm test:docker:plugins` (Skript: `scripts/e2e/plugins-docker.sh`)

Die Docker-Runner für Live-Modelle binden den aktuellen Checkout außerdem schreibgeschützt ein und
stagen ihn in ein temporäres Workdir innerhalb des Containers. Dadurch bleibt das Runtime-
Image schlank und Vitest läuft trotzdem gegen deinen exakten lokalen Source/Config-Stand.
Der Staging-Schritt überspringt große, nur lokale Caches und Build-Ausgaben von Apps wie
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` und app-lokale `.build`- oder
Gradle-Ausgabeverzeichnisse, sodass Docker-Live-Läufe nicht minutenlang
maschinenabhängige Artefakte kopieren.
Sie setzen außerdem `OPENCLAW_SKIP_CHANNELS=1`, damit Gateway-Live-Probes keine
echten Telegram-/Discord-/etc.-Kanal-Worker im Container starten.
`test:docker:live-models` führt weiterhin `pnpm test:live` aus, daher gib
auch `OPENCLAW_LIVE_GATEWAY_*` weiter, wenn du in dieser Docker-Lane die Gateway-
Live-Abdeckung eingrenzen oder ausschließen musst.
`test:docker:openwebui` ist ein höherstufiger Kompatibilitäts-Smoke: Er startet einen
OpenClaw-Gateway-Container mit aktivierten OpenAI-kompatiblen HTTP-Endpunkten,
startet einen fest angehefteten Open-WebUI-Container gegen dieses Gateway, meldet sich über
Open WebUI an, verifiziert, dass `/api/models` `openclaw/default` bereitstellt, und sendet dann eine
reale Chat-Anfrage über den Proxy `/api/chat/completions` von Open WebUI.
Der erste Lauf kann merklich langsamer sein, weil Docker möglicherweise zuerst das
Open-WebUI-Image ziehen muss und Open WebUI eventuell sein eigenes Cold-Start-Setup abschließen muss.
Diese Lane erwartet einen nutzbaren Live-Modell-Schlüssel, und `OPENCLAW_PROFILE_FILE`
(`~/.profile` standardmäßig) ist der primäre Weg, ihn in dockerisierten Läufen bereitzustellen.
Erfolgreiche Läufe geben eine kleine JSON-Payload wie `{ "ok": true, "model":
"openclaw/default", ... }` aus.
`test:docker:mcp-channels` ist bewusst deterministisch und benötigt kein
echtes Telegram-, Discord- oder iMessage-Konto. Es bootet ein vorgefülltes Gateway-
Container, startet einen zweiten Container, der `openclaw mcp serve` startet, und
verifiziert dann geroutete Konversationserkennung, das Lesen von Transkripten, Attachment-Metadaten,
Verhalten der Live-Ereignis-Warteschlange, Routing ausgehender Sendungen sowie Claude-artige Kanal- +
Berechtigungsbenachrichtigungen über die echte stdio-MCP-Bridge. Die Benachrichtigungsprüfung
inspiziert die rohen stdio-MCP-Frames direkt, sodass der Smoke validiert, was die
Bridge tatsächlich ausgibt, und nicht nur das, was ein bestimmtes Client-SDK zufällig bereitstellt.

Manueller ACP-Thread-Smoke in Klartextsprache (nicht CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Behalte dieses Skript für Regressions-/Debug-Workflows. Es könnte erneut für ACP-Thread-Routing-Validierung benötigt werden, also nicht löschen.

Nützliche Env-Variablen:

- `OPENCLAW_CONFIG_DIR=...` (Standard: `~/.openclaw`), gemountet nach `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (Standard: `~/.openclaw/workspace`), gemountet nach `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (Standard: `~/.profile`), gemountet nach `/home/node/.profile` und vor dem Ausführen der Tests gesourct
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, um nur Env-Variablen zu prüfen, die aus `OPENCLAW_PROFILE_FILE` gesourct wurden, mit temporären Config-/Workspace-Verzeichnissen und ohne Mounts externer CLI-Auth
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (Standard: `~/.cache/openclaw/docker-cli-tools`), gemountet nach `/home/node/.npm-global` für gecachte CLI-Installationen in Docker
- Externe CLI-Auth-Verzeichnisse/-Dateien unter `$HOME` werden schreibgeschützt unter `/host-auth...` gemountet und dann vor Testbeginn nach `/home/node/...` kopiert
  - Standardverzeichnisse: `.minimax`
  - Standarddateien: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Eingegrenzte Provider-Läufe mounten nur die benötigten Verzeichnisse/Dateien, die aus `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` abgeleitet werden
  - Manuell überschreiben mit `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` oder einer Kommaliste wie `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, um den Lauf einzugrenzen
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, um Provider im Container zu filtern
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, um ein vorhandenes `openclaw:local-live`-Image für erneute Läufe zu verwenden, die keinen Rebuild brauchen
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um sicherzustellen, dass Credentials aus dem Profile-Store kommen (nicht aus env)
- `OPENCLAW_OPENWEBUI_MODEL=...`, um das vom Gateway für den Open-WebUI-Smoke bereitgestellte Modell auszuwählen
- `OPENCLAW_OPENWEBUI_PROMPT=...`, um den für den Open-WebUI-Smoke verwendeten Nonce-Check-Prompt zu überschreiben
- `OPENWEBUI_IMAGE=...`, um das fest angeheftete Open-WebUI-Image-Tag zu überschreiben

## Docs-Sanity

Führe nach Dokumentationsänderungen Docs-Prüfungen aus: `pnpm check:docs`.
Führe die vollständige Mintlify-Anker-Validierung aus, wenn du auch In-Page-Heading-Prüfungen brauchst: `pnpm docs:check-links:anchors`.

## Offline-Regression (CI-sicher)

Dies sind Regressionen für „echte Pipeline“ ohne echte Provider:

- Gateway-Tool-Calling (Mock OpenAI, echtes Gateway + Agent-Loop): `src/gateway/gateway.test.ts` (Fall: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway-Wizard (WS `wizard.start`/`wizard.next`, schreibt Konfiguration + Auth erzwungen): `src/gateway/gateway.test.ts` (Fall: "runs wizard over ws and writes auth token config")

## Evaluierungen der Agent-Zuverlässigkeit (Skills)

Wir haben bereits einige CI-sichere Tests, die sich wie „Evaluierungen der Agent-Zuverlässigkeit“ verhalten:

- Mock-Tool-Calling über das echte Gateway + Agent-Loop (`src/gateway/gateway.test.ts`).
- End-to-End-Wizard-Flows, die Sitzungs-Wiring und Konfigurationseffekte validieren (`src/gateway/gateway.test.ts`).

Was für Skills noch fehlt (siehe [Skills](/de/tools/skills)):

- **Entscheidungsfindung:** Wenn Skills im Prompt aufgeführt sind, wählt der Agent den richtigen Skill (oder vermeidet irrelevante)?
- **Compliance:** Liest der Agent vor der Verwendung `SKILL.md` und befolgt er die erforderlichen Schritte/Args?
- **Workflow-Verträge:** Mehrzügige Szenarien, die Tool-Reihenfolge, Mitnahme des Sitzungsverlaufs und Sandbox-Grenzen prüfen.

Zukünftige Evaluierungen sollten zuerst deterministisch bleiben:

- Ein Szenario-Runner mit Mock-Providern, um Tool-Aufrufe + Reihenfolge, Skill-Datei-Lesevorgänge und Sitzungs-Wiring zu prüfen.
- Eine kleine Suite auf Skills fokussierter Szenarien (verwenden vs. vermeiden, Gating, Prompt-Injection).
- Optionale Live-Evaluierungen (Opt-in, env-gated) erst, nachdem die CI-sichere Suite vorhanden ist.

## Vertragstests (Plugin- und Kanalform)

Vertragstests prüfen, dass jedes registrierte Plugin und jeder Kanal seinem
Schnittstellenvertrag entspricht. Sie iterieren über alle entdeckten Plugins und führen eine Suite von
Assertions zu Form und Verhalten aus. Die Standard-Unit-Lane `pnpm test` überspringt diese gemeinsam genutzten Seam- und Smoke-Dateien absichtlich; führe die Vertragsbefehle
explizit aus, wenn du gemeinsam genutzte Kanal- oder Provider-Oberflächen anfasst.

### Befehle

- Alle Verträge: `pnpm test:contracts`
- Nur Kanalverträge: `pnpm test:contracts:channels`
- Nur Providerverträge: `pnpm test:contracts:plugins`

### Kanalverträge

Zu finden unter `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Grundlegende Plugin-Form (ID, Name, Fähigkeiten)
- **setup** - Vertrag des Setup-Wizards
- **session-binding** - Verhalten der Sitzungsbindung
- **outbound-payload** - Struktur der Nachrichten-Payload
- **inbound** - Behandlung eingehender Nachrichten
- **actions** - Kanal-Aktions-Handler
- **threading** - Behandlung von Thread-IDs
- **directory** - Directory-/Roster-API
- **group-policy** - Durchsetzung der Gruppenrichtlinie

### Verträge für Provider-Status

Zu finden unter `src/plugins/contracts/*.contract.test.ts`.

- **status** - Kanal-Status-Probes
- **registry** - Form der Plugin-Registry

### Providerverträge

Zu finden unter `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Auth-Flow-Vertrag
- **auth-choice** - Auth-Auswahl/-Selektion
- **catalog** - API des Modellkatalogs
- **discovery** - Plugin-Discovery
- **loader** - Laden von Plugins
- **runtime** - Provider-Runtime
- **shape** - Plugin-Form/Schnittstelle
- **wizard** - Setup-Wizard

### Wann ausführen

- Nach Änderungen an `plugin-sdk`-Exports oder Subpaths
- Nach dem Hinzufügen oder Ändern eines Kanal- oder Provider-Plugins
- Nach Refactorings an Plugin-Registrierung oder Discovery

Vertragstests laufen in CI und erfordern keine echten API-Schlüssel.

## Regressionen hinzufügen (Leitlinien)

Wenn du ein in Live entdecktes Provider-/Modellproblem behebst:

- Füge nach Möglichkeit eine CI-sichere Regression hinzu (Mock-/Stub-Provider oder die exakte Transformation der Request-Form erfassen)
- Wenn es von Natur aus nur live prüfbar ist (Rate Limits, Auth-Richtlinien), halte den Live-Test eng begrenzt und per Env-Variablen opt-in
- Ziele bevorzugt auf die kleinste Ebene, die den Bug erkennt:
  - Bug bei Provider-Request-Konvertierung/Wiedergabe → direkter Modelltest
  - Bug in Gateway-Sitzung/Verlauf/Tool-Pipeline → Gateway-Live-Smoke oder CI-sicherer Gateway-Mock-Test
- SecretRef-Guardrail für Traversal:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` leitet pro SecretRef-Klasse ein gesampeltes Ziel aus Registry-Metadaten ab (`listSecretTargetRegistryEntries()`) und prüft dann, dass Exec-IDs mit Traversal-Segmenten abgelehnt werden.
  - Wenn du in `src/secrets/target-registry-data.ts` eine neue `includeInPlan`-SecretRef-Zielfamilie hinzufügst, aktualisiere `classifyTargetClass` in diesem Test. Der Test schlägt absichtlich bei nicht klassifizierten Ziel-IDs fehl, damit neue Klassen nicht stillschweigend übersprungen werden können.
