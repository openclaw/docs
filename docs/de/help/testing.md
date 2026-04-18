---
read_when:
    - Tests lokal oder in CI ausführen
    - Regressionstests für Modell-/Provider-Fehler hinzufügen
    - Gateway- und Agent-Verhalten debuggen
summary: 'Test-Kit: Unit-/E2E-/Live-Suiten, Docker-Runner und was jeder Test abdeckt'
title: Testen
x-i18n:
    generated_at: "2026-04-18T06:12:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7cdd2048ba58e606fd68703977c2b33000abdb1826b6589ce25a35c53468726a
    source_path: help/testing.md
    workflow: 15
---

# Testen

OpenClaw hat drei Vitest-Suiten (Unit/Integration, E2E, Live) und eine kleine Anzahl von Docker-Runnern.

Dieses Dokument ist ein Leitfaden dazu, „wie wir testen“:

- Was jede Suite abdeckt (und was sie bewusst _nicht_ abdeckt)
- Welche Befehle Sie für gängige Workflows ausführen sollten (lokal, vor dem Push, Debugging)
- Wie Live-Tests Anmeldedaten erkennen und Modelle/Provider auswählen
- Wie Sie Regressionstests für reale Modell-/Provider-Probleme hinzufügen

## Schnellstart

An den meisten Tagen:

- Vollständiges Gate (vor dem Push erwartet): `pnpm build && pnpm check && pnpm test`
- Schnellere lokale Ausführung der kompletten Suite auf einem leistungsfähigen Rechner: `pnpm test:max`
- Direkte Vitest-Watch-Schleife: `pnpm test:watch`
- Direktes Targeting einzelner Dateien leitet jetzt auch Erweiterungs-/Channel-Pfade weiter: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Bevorzugen Sie zuerst gezielte Ausführungen, wenn Sie an einem einzelnen Fehler iterieren.
- Docker-gestützte QA-Site: `pnpm qa:lab:up`
- Linux-VM-gestützte QA-Lane: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Wenn Sie Tests ändern oder zusätzliche Sicherheit möchten:

- Coverage-Gate: `pnpm test:coverage`
- E2E-Suite: `pnpm test:e2e`

Beim Debuggen realer Provider/Modelle (erfordert echte Anmeldedaten):

- Live-Suite (Modelle + Gateway-Tool-/Bild-Probes): `pnpm test:live`
- Eine einzelne Live-Datei ohne viel Ausgabe ausführen: `pnpm test:live -- src/agents/models.profiles.live.test.ts`

Tipp: Wenn Sie nur einen einzelnen fehlschlagenden Fall benötigen, schränken Sie Live-Tests bevorzugt über die unten beschriebenen Allowlist-Umgebungsvariablen ein.

## QA-spezifische Runner

Diese Befehle stehen neben den Haupt-Test-Suiten zur Verfügung, wenn Sie die Realitätsnähe von QA-Lab benötigen:

- `pnpm openclaw qa suite`
  - Führt repo-gestützte QA-Szenarien direkt auf dem Host aus.
  - Führt standardmäßig mehrere ausgewählte Szenarien parallel mit isolierten Gateway-Workern aus, mit bis zu 64 Workern oder der Anzahl der ausgewählten Szenarien. Verwenden Sie `--concurrency <count>`, um die Anzahl der Worker anzupassen, oder `--concurrency 1` für die ältere serielle Lane.
  - Unterstützt die Provider-Modi `live-frontier`, `mock-openai` und `aimock`.
    `aimock` startet einen lokalen AIMock-gestützten Provider-Server für experimentelle Fixture- und Protokoll-Mock-Abdeckung, ohne die szenarienbewusste `mock-openai`-Lane zu ersetzen.
- `pnpm openclaw qa suite --runner multipass`
  - Führt dieselbe QA-Suite in einer kurzlebigen Multipass-Linux-VM aus.
  - Behält dasselbe Szenarioauswahlverhalten wie `qa suite` auf dem Host bei.
  - Verwendet dieselben Provider-/Modellauswahl-Flags wie `qa suite`.
  - Live-Ausführungen leiten die unterstützten QA-Authentifizierungseingaben weiter, die für den Gast praktikabel sind:
    umgebungsbasierte Provider-Schlüssel, den QA-Live-Provider-Konfigurationspfad und `CODEX_HOME`, sofern vorhanden.
  - Ausgabeverzeichnisse müssen unter dem Repo-Root bleiben, damit der Gast über den eingebundenen Workspace zurückschreiben kann.
  - Schreibt den normalen QA-Report + die Zusammenfassung sowie Multipass-Logs unter
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Startet die Docker-gestützte QA-Site für operatorähnliche QA-Arbeiten.
- `pnpm openclaw qa aimock`
  - Startet nur den lokalen AIMock-Provider-Server für direkte Protokoll-Smoke-Tests.
- `pnpm openclaw qa matrix`
  - Führt die Matrix-Live-QA-Lane gegen einen kurzlebigen Docker-gestützten Tuwunel-Homeserver aus.
  - Dieser QA-Host ist derzeit nur für Repo/Entwicklung gedacht. Gepackte OpenClaw-Installationen enthalten kein `qa-lab` und stellen daher `openclaw qa` nicht bereit.
  - Repo-Checkouts laden den gebündelten Runner direkt; ein separater Installationsschritt für Plugins ist nicht erforderlich.
  - Stellt drei temporäre Matrix-Benutzer (`driver`, `sut`, `observer`) sowie einen privaten Raum bereit und startet dann einen untergeordneten QA-Gateway-Prozess mit dem echten Matrix-Plugin als SUT-Transport.
  - Verwendet standardmäßig das festgelegte stabile Tuwunel-Image `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Überschreiben Sie es mit `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`, wenn Sie ein anderes Image testen müssen.
  - Matrix stellt keine gemeinsamen Credential-Source-Flags bereit, da die Lane lokal kurzlebige Benutzer bereitstellt.
  - Schreibt einen Matrix-QA-Report, eine Zusammenfassung, ein Artifact für beobachtete Ereignisse und ein kombiniertes stdout/stderr-Ausgabeprotokoll unter `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - Führt die Telegram-Live-QA-Lane gegen eine reale private Gruppe aus, unter Verwendung der Driver- und SUT-Bot-Tokens aus der Umgebung.
  - Erfordert `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` und `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Die Gruppen-ID muss die numerische Telegram-Chat-ID sein.
  - Unterstützt `--credential-source convex` für gemeinsam genutzte gepoolte Anmeldedaten. Verwenden Sie standardmäßig den Env-Modus oder setzen Sie `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, um gepoolte Leases zu verwenden.
  - Erfordert zwei unterschiedliche Bots in derselben privaten Gruppe, wobei der SUT-Bot einen Telegram-Benutzernamen bereitstellt.
  - Für eine stabile Beobachtung von Bot-zu-Bot-Kommunikation aktivieren Sie in `@BotFather` den Modus Bot-to-Bot Communication Mode für beide Bots und stellen Sie sicher, dass der Driver-Bot Bot-Traffic in der Gruppe beobachten kann.
  - Schreibt einen Telegram-QA-Report, eine Zusammenfassung und ein Artifact für beobachtete Nachrichten unter `.artifacts/qa-e2e/...`.

Live-Transport-Lanes teilen sich einen Standardvertrag, damit neue Transporte nicht auseinanderlaufen:

`qa-channel` bleibt die breite synthetische QA-Suite und ist nicht Teil der Live-Transport-Abdeckungsmatrix.

| Lane     | Canary | Mention-Gating | Allowlist-Sperre | Antwort auf oberster Ebene | Neustart-Fortsetzung | Thread-Nachverfolgung | Thread-Isolierung | Reaktionsbeobachtung | Help-Befehl |
| -------- | ------ | -------------- | ---------------- | -------------------------- | -------------------- | -------------------- | ----------------- | -------------------- | ------------ |
| Matrix   | x      | x              | x                | x                          | x                    | x                    | x                 | x                    |              |
| Telegram | x      |                |                  |                            |                      |                      |                   |                      | x            |

### Gemeinsame Telegram-Anmeldedaten über Convex (v1)

Wenn `--credential-source convex` (oder `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) für
`openclaw qa telegram` aktiviert ist, bezieht QA-Lab ein exklusives Lease aus einem Convex-gestützten Pool, sendet Heartbeat-Signale für dieses Lease, während die Lane läuft, und gibt das Lease beim Herunterfahren frei.

Referenz-Scaffold für Convex-Projekte:

- `qa/convex-credential-broker/`

Erforderliche Umgebungsvariablen:

- `OPENCLAW_QA_CONVEX_SITE_URL` (zum Beispiel `https://your-deployment.convex.site`)
- Ein Secret für die ausgewählte Rolle:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` für `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` für `ci`
- Auswahl der Credential-Rolle:
  - CLI: `--credential-role maintainer|ci`
  - Env-Standard: `OPENCLAW_QA_CREDENTIAL_ROLE` (Standard ist `maintainer`)

Optionale Umgebungsvariablen:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (Standard `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (Standard `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (Standard `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (Standard `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (Standard `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (optionale Trace-ID)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` erlaubt Loopback-`http://`-Convex-URLs nur für lokale Entwicklung.

`OPENCLAW_QA_CONVEX_SITE_URL` sollte im Normalbetrieb `https://` verwenden.

Maintainer-Admin-Befehle (Pool hinzufügen/entfernen/auflisten) erfordern explizit
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI-Hilfsprogramme für Maintainer:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Verwenden Sie `--json` für maschinenlesbare Ausgabe in Skripten und CI-Dienstprogrammen.

Standard-Endpoint-Vertrag (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

- `POST /acquire`
  - Anfrage: `{ kind, ownerId, actorRole, leaseTtlMs, heartbeatIntervalMs }`
  - Erfolg: `{ status: "ok", credentialId, leaseToken, payload, leaseTtlMs?, heartbeatIntervalMs? }`
  - Erschöpft/wiederholbar: `{ status: "error", code: "POOL_EXHAUSTED" | "NO_CREDENTIAL_AVAILABLE", ... }`
- `POST /heartbeat`
  - Anfrage: `{ kind, ownerId, actorRole, credentialId, leaseToken, leaseTtlMs }`
  - Erfolg: `{ status: "ok" }` (oder leeres `2xx`)
- `POST /release`
  - Anfrage: `{ kind, ownerId, actorRole, credentialId, leaseToken }`
  - Erfolg: `{ status: "ok" }` (oder leeres `2xx`)
- `POST /admin/add` (nur Maintainer-Secret)
  - Anfrage: `{ kind, actorId, payload, note?, status? }`
  - Erfolg: `{ status: "ok", credential }`
- `POST /admin/remove` (nur Maintainer-Secret)
  - Anfrage: `{ credentialId, actorId }`
  - Erfolg: `{ status: "ok", changed, credential }`
  - Schutz bei aktivem Lease: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (nur Maintainer-Secret)
  - Anfrage: `{ kind?, status?, includePayload?, limit? }`
  - Erfolg: `{ status: "ok", credentials, count }`

Payload-Form für die Art Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` muss eine numerische Telegram-Chat-ID als String sein.
- `admin/add` validiert diese Form für `kind: "telegram"` und lehnt fehlerhafte Payloads ab.

### Einen Channel zu QA hinzufügen

Das Hinzufügen eines Channels zum Markdown-QA-System erfordert genau zwei Dinge:

1. Einen Transport-Adapter für den Channel.
2. Ein Szenariopaket, das den Channel-Vertrag testet.

Fügen Sie keinen neuen Top-Level-QA-Befehls-Root hinzu, wenn der gemeinsame `qa-lab`-Host
den Ablauf besitzen kann.

`qa-lab` besitzt die gemeinsamen Host-Mechanismen:

- den Befehls-Root `openclaw qa`
- Starten und Herunterfahren der Suite
- Worker-Parallelität
- Schreiben von Artifacts
- Report-Erstellung
- Szenarioausführung
- Kompatibilitäts-Aliasse für ältere `qa-channel`-Szenarien

Runner-Plugins besitzen den Transportvertrag:

- wie `openclaw qa <runner>` unter dem gemeinsamen `qa`-Root eingebunden wird
- wie das Gateway für diesen Transport konfiguriert wird
- wie Bereitschaft geprüft wird
- wie eingehende Ereignisse injiziert werden
- wie ausgehende Nachrichten beobachtet werden
- wie Transkripte und normalisierter Transportzustand bereitgestellt werden
- wie transportgestützte Aktionen ausgeführt werden
- wie transportspezifisches Zurücksetzen oder Cleanup gehandhabt wird

Die minimale Übernahmeschwelle für einen neuen Channel ist:

1. Behalten Sie `qa-lab` als Eigentümer des gemeinsamen `qa`-Roots bei.
2. Implementieren Sie den Transport-Runner an der gemeinsamen `qa-lab`-Host-Schnittstelle.
3. Behalten Sie transportspezifische Mechanismen im Runner-Plugin oder im Channel-Harness.
4. Binden Sie den Runner als `openclaw qa <runner>` ein, statt einen konkurrierenden Root-Befehl zu registrieren.
   Runner-Plugins sollten `qaRunners` in `openclaw.plugin.json` deklarieren und ein passendes Array `qaRunnerCliRegistrations` aus `runtime-api.ts` exportieren.
   Halten Sie `runtime-api.ts` schlank; Lazy-CLI- und Runner-Ausführung sollten hinter separaten Entry-Points bleiben.
5. Erstellen oder passen Sie Markdown-Szenarien unter den thematischen Verzeichnissen `qa/scenarios/` an.
6. Verwenden Sie die generischen Szenario-Helfer für neue Szenarien.
7. Halten Sie bestehende Kompatibilitäts-Aliasse funktionsfähig, sofern das Repo keine absichtliche Migration durchführt.

Die Entscheidungsregel ist strikt:

- Wenn Verhalten einmalig in `qa-lab` ausgedrückt werden kann, platzieren Sie es in `qa-lab`.
- Wenn Verhalten von einem Channel-Transport abhängt, behalten Sie es im entsprechenden Runner-Plugin oder Plugin-Harness.
- Wenn ein Szenario eine neue Fähigkeit benötigt, die mehr als ein Channel verwenden kann, fügen Sie einen generischen Helfer hinzu statt eines channelspezifischen Zweigs in `suite.ts`.
- Wenn ein Verhalten nur für einen Transport sinnvoll ist, behalten Sie das Szenario transportspezifisch und machen Sie das im Szenariovertrag explizit.

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

Kompatibilitäts-Aliasse bleiben für bestehende Szenarien verfügbar, darunter:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

Neue Channel-Arbeit sollte die generischen Helfernamen verwenden.
Kompatibilitäts-Aliasse existieren, um eine sofortige Migration an einem Stichtag zu vermeiden, nicht als Modell für das Verfassen neuer Szenarien.

## Test-Suiten (was wo ausgeführt wird)

Betrachten Sie die Suiten als „zunehmend realitätsnah“ (und zunehmend fehleranfällig/kostenintensiv):

### Unit / Integration (Standard)

- Befehl: `pnpm test`
- Konfiguration: zehn sequentielle Shard-Läufe (`vitest.full-*.config.ts`) über die vorhandenen scoped Vitest-Projekte
- Dateien: Core-/Unit-Inventare unter `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` sowie die in `vitest.unit.config.ts` freigegebenen `ui`-Node-Tests
- Umfang:
  - Reine Unit-Tests
  - In-Process-Integrationstests (Gateway-Authentifizierung, Routing, Tooling, Parsing, Konfiguration)
  - Deterministische Regressionstests für bekannte Fehler
- Erwartungen:
  - Läuft in CI
  - Keine echten Schlüssel erforderlich
  - Sollte schnell und stabil sein
- Hinweis zu Projekten:
  - Nicht gezieltes `pnpm test` führt jetzt elf kleinere Shard-Konfigurationen aus (`core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) statt eines einzigen riesigen nativen Root-Project-Prozesses. Das reduziert die maximale RSS auf ausgelasteten Maschinen und verhindert, dass Auto-Reply-/Erweiterungsarbeit nicht verwandte Suiten ausbremst.
  - `pnpm test --watch` verwendet weiterhin den nativen Root-`vitest.config.ts`-Projektgraphen, da eine Watch-Schleife über mehrere Shards nicht praktikabel ist.
  - `pnpm test`, `pnpm test:watch` und `pnpm test:perf:imports` leiten explizite Datei-/Verzeichnisziele jetzt zuerst durch scoped Lanes, sodass `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` nicht den Startaufwand des vollständigen Root-Projekts bezahlen muss.
  - `pnpm test:changed` erweitert geänderte Git-Pfade in dieselben scoped Lanes, wenn der Diff nur routbare Quell-/Testdateien betrifft; Änderungen an Konfiguration/Setup fallen weiterhin auf den breiten Root-Project-Neulauf zurück.
  - Import-leichte Unit-Tests aus Agents, Commands, Plugins, Auto-Reply-Helfern, `plugin-sdk` und ähnlichen reinen Utility-Bereichen laufen über die `unit-fast`-Lane, die `test/setup-openclaw-runtime.ts` überspringt; zustandsbehaftete/runtime-lastige Dateien bleiben auf den vorhandenen Lanes.
  - Ausgewählte `plugin-sdk`- und `commands`-Hilfsquelldateien ordnen Changed-Mode-Läufe außerdem explizit benachbarten Tests in diesen leichten Lanes zu, sodass Änderungen an Helfern keinen erneuten Lauf der vollständigen schweren Suite für dieses Verzeichnis auslösen.
  - `auto-reply` hat jetzt drei dedizierte Buckets: Core-Helfer auf oberster Ebene, Integrations-Tests auf oberster Ebene `reply.*` und den Teilbaum `src/auto-reply/reply/**`. Dadurch bleibt die schwerste Reply-Harness-Arbeit von den günstigen Status-/Chunk-/Token-Tests getrennt.
- Hinweis zum eingebetteten Runner:
  - Wenn Sie Eingaben für die Discovery von Message-Tools oder den Laufzeitkontext von Compaction ändern, erhalten Sie beide Abdeckungsebenen aufrecht.
  - Fügen Sie gezielte Helfer-Regressionen für reine Routing-/Normalisierungsgrenzen hinzu.
  - Halten Sie außerdem die Integrations-Suiten des eingebetteten Runners gesund:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` und
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Diese Suiten verifizieren, dass Scoped-IDs und Compaction-Verhalten weiterhin durch die realen Pfade `run.ts` / `compact.ts` fließen; reine Helfer-Tests sind kein ausreichender Ersatz für diese Integrationspfade.
- Hinweis zum Pool:
  - Die Basis-Vitest-Konfiguration verwendet jetzt standardmäßig `threads`.
  - Die gemeinsame Vitest-Konfiguration setzt außerdem `isolate: false` fest und verwendet den nicht isolierten Runner für die Root-Projekte sowie die E2E- und Live-Konfigurationen.
  - Die Root-UI-Lane behält ihr `jsdom`-Setup und ihren Optimizer bei, läuft jetzt aber ebenfalls auf dem gemeinsamen nicht isolierten Runner.
  - Jeder `pnpm test`-Shard übernimmt dieselben Standardwerte `threads` + `isolate: false` aus der gemeinsamen Vitest-Konfiguration.
  - Der gemeinsame Launcher `scripts/run-vitest.mjs` fügt für Vitest-Child-Node-Prozesse jetzt standardmäßig auch `--no-maglev` hinzu, um V8-Kompilierungsaufwand bei großen lokalen Läufen zu reduzieren. Setzen Sie `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, wenn Sie mit dem Standardverhalten von V8 vergleichen müssen.
- Hinweis zur schnellen lokalen Iteration:
  - `pnpm test:changed` läuft über scoped Lanes, wenn sich die geänderten Pfade sauber einer kleineren Suite zuordnen lassen.
  - `pnpm test:max` und `pnpm test:changed:max` behalten dasselbe Routing-Verhalten bei, nur mit einem höheren Worker-Limit.
  - Die lokale automatische Worker-Skalierung ist jetzt absichtlich konservativ und reduziert sich auch, wenn die durchschnittliche Host-Last bereits hoch ist, sodass mehrere gleichzeitige Vitest-Läufe standardmäßig weniger Schaden anrichten.
  - Die Basis-Vitest-Konfiguration markiert die Projekte/Konfigurationsdateien als `forceRerunTriggers`, damit Neuläufe im Changed-Mode korrekt bleiben, wenn sich die Test-Verdrahtung ändert.
  - Die Konfiguration lässt `OPENCLAW_VITEST_FS_MODULE_CACHE` auf unterstützten Hosts aktiviert; setzen Sie `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, wenn Sie einen expliziten Cache-Speicherort für direktes Profiling möchten.
- Hinweis zum Performance-Debugging:
  - `pnpm test:perf:imports` aktiviert die Berichterstattung über Vitest-Importdauer sowie die Ausgabe einer Import-Aufschlüsselung.
  - `pnpm test:perf:imports:changed` beschränkt dieselbe Profiling-Ansicht auf Dateien, die seit `origin/main` geändert wurden.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` vergleicht geroutetes `test:changed` mit dem nativen Root-Project-Pfad für diesen festgeschriebenen Diff und gibt Wall Time sowie den maximalen RSS unter macOS aus.
- `pnpm test:perf:changed:bench -- --worktree` benchmarkt den aktuellen schmutzigen Arbeitsbaum, indem die geänderte Dateiliste durch `scripts/test-projects.mjs` und die Root-Vitest-Konfiguration geroutet wird.
  - `pnpm test:perf:profile:main` schreibt ein CPU-Profil des Main-Threads für Vitest/Vite-Startup- und Transform-Overhead.
  - `pnpm test:perf:profile:runner` schreibt CPU- und Heap-Profile des Runners für die Unit-Suite bei deaktivierter Datei-Parallelität.

### E2E (Gateway-Smoke)

- Befehl: `pnpm test:e2e`
- Konfiguration: `vitest.e2e.config.ts`
- Dateien: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- Standard-Runtime:
  - Verwendet Vitest-`threads` mit `isolate: false`, passend zum Rest des Repos.
  - Verwendet adaptive Worker (CI: bis zu 2, lokal: standardmäßig 1).
  - Läuft standardmäßig im Silent-Modus, um den Console-I/O-Overhead zu reduzieren.
- Nützliche Überschreibungen:
  - `OPENCLAW_E2E_WORKERS=<n>`, um die Anzahl der Worker fest vorzugeben (begrenzt auf 16).
  - `OPENCLAW_E2E_VERBOSE=1`, um ausführliche Console-Ausgabe wieder zu aktivieren.
- Umfang:
  - End-to-End-Verhalten des Gateways mit mehreren Instanzen
  - WebSocket-/HTTP-Oberflächen, Node-Pairing und aufwendigeres Networking
- Erwartungen:
  - Läuft in CI (wenn in der Pipeline aktiviert)
  - Keine echten Schlüssel erforderlich
  - Mehr bewegliche Teile als Unit-Tests (kann langsamer sein)

### E2E: OpenShell-Backend-Smoke

- Befehl: `pnpm test:e2e:openshell`
- Datei: `test/openshell-sandbox.e2e.test.ts`
- Umfang:
  - Startet über Docker ein isoliertes OpenShell-Gateway auf dem Host
  - Erstellt eine Sandbox aus einem temporären lokalen Dockerfile
  - Testet das OpenShell-Backend von OpenClaw über echtes `sandbox ssh-config` + SSH-Ausführung
  - Verifiziert remote-kanonisches Dateisystemverhalten über die Sandbox-FS-Bridge
- Erwartungen:
  - Nur Opt-in; nicht Teil des standardmäßigen `pnpm test:e2e`-Laufs
  - Erfordert eine lokale `openshell`-CLI sowie einen funktionierenden Docker-Daemon
  - Verwendet isoliertes `HOME` / `XDG_CONFIG_HOME` und zerstört anschließend das Test-Gateway und die Sandbox
- Nützliche Überschreibungen:
  - `OPENCLAW_E2E_OPENSHELL=1`, um den Test zu aktivieren, wenn die breitere E2E-Suite manuell ausgeführt wird
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, um auf ein nicht standardmäßiges CLI-Binary oder Wrapper-Skript zu verweisen

### Live (reale Provider + reale Modelle)

- Befehl: `pnpm test:live`
- Konfiguration: `vitest.live.config.ts`
- Dateien: `src/**/*.live.test.ts`
- Standard: **aktiviert** durch `pnpm test:live` (setzt `OPENCLAW_LIVE_TEST=1`)
- Umfang:
  - „Funktioniert dieser Provider/dieses Modell _heute_ tatsächlich mit echten Anmeldedaten?“
  - Erfasst Änderungen am Provider-Format, Besonderheiten beim Tool-Calling, Auth-Probleme und Rate-Limit-Verhalten
- Erwartungen:
  - Von Natur aus nicht CI-stabil (reale Netzwerke, reale Provider-Richtlinien, Kontingente, Ausfälle)
  - Kostet Geld / verbraucht Rate Limits
  - Bevorzugt eingeschränkte Teilmengen statt „alles“
- Live-Läufe sourcen `~/.profile`, um fehlende API-Schlüssel zu übernehmen.
- Standardmäßig isolieren Live-Läufe weiterhin `HOME` und kopieren Konfigurations-/Authentifizierungsmaterial in ein temporäres Test-Home, damit Unit-Fixtures Ihr echtes `~/.openclaw` nicht verändern können.
- Setzen Sie `OPENCLAW_LIVE_USE_REAL_HOME=1` nur, wenn Live-Tests absichtlich Ihr echtes Home-Verzeichnis verwenden sollen.
- `pnpm test:live` verwendet jetzt standardmäßig einen ruhigeren Modus: Es behält die Fortschrittsausgabe `[live] ...` bei, unterdrückt aber den zusätzlichen Hinweis zu `~/.profile` und schaltet Gateway-Bootstrap-Logs/Bonjour-Rauschen stumm. Setzen Sie `OPENCLAW_LIVE_TEST_QUIET=0`, wenn Sie die vollständigen Start-Logs wieder sehen möchten.
- Rotation von API-Schlüsseln (providerspezifisch): Setzen Sie `*_API_KEYS` im Komma-/Semikolon-Format oder `*_API_KEY_1`, `*_API_KEY_2` (zum Beispiel `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) oder einen per-Live-Override mit `OPENCLAW_LIVE_*_KEY`; Tests versuchen bei Rate-Limit-Antworten erneut.
- Fortschritts-/Heartbeat-Ausgabe:
  - Live-Suiten geben jetzt Fortschrittszeilen nach stderr aus, damit bei langen Provider-Aufrufen sichtbar bleibt, dass Aktivität stattfindet, selbst wenn die Vitest-Console-Erfassung ruhig ist.
  - `vitest.live.config.ts` deaktiviert die Vitest-Console-Interception, damit Fortschrittszeilen von Provider/Gateway bei Live-Läufen sofort gestreamt werden.
  - Stimmen Sie Heartbeats für direkte Modelle mit `OPENCLAW_LIVE_HEARTBEAT_MS` ab.
  - Stimmen Sie Gateway-/Probe-Heartbeats mit `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` ab.

## Welche Suite sollte ich ausführen?

Verwenden Sie diese Entscheidungstabelle:

- Logik/Tests bearbeiten: `pnpm test` ausführen (und `pnpm test:coverage`, wenn Sie viel geändert haben)
- Gateway-Networking / WS-Protokoll / Pairing anfassen: `pnpm test:e2e` zusätzlich ausführen
- „Mein Bot ist down“ / providerspezifische Fehler / Tool-Calling debuggen: eine eingeschränkte Variante von `pnpm test:live` ausführen

## Live: Android-Node-Capability-Sweep

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Skript: `pnpm android:test:integration`
- Ziel: **jeden aktuell beworbenen Befehl** eines verbundenen Android-Nodes aufrufen und das Vertragsverhalten des Befehls prüfen.
- Umfang:
  - Vorausgesetztes/manuelles Setup (die Suite installiert/startet/pairt die App nicht).
  - Befehlsweise Validierung von Gateway-`node.invoke` für den ausgewählten Android-Node.
- Erforderliches Vorab-Setup:
  - Android-App bereits verbunden und mit dem Gateway gepairt.
  - App im Vordergrund halten.
  - Berechtigungen/Capture-Zustimmung für Capabilities erteilen, die erfolgreich sein sollen.
- Optionale Ziel-Überschreibungen:
  - `OPENCLAW_ANDROID_NODE_ID` oder `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Vollständige Android-Setup-Details: [Android App](/de/platforms/android)

## Live: Modell-Smoke (Profilschlüssel)

Live-Tests sind in zwei Ebenen aufgeteilt, damit wir Fehler isolieren können:

- „Direktes Modell“ sagt uns, ob der Provider/das Modell mit dem gegebenen Schlüssel überhaupt antworten kann.
- „Gateway-Smoke“ sagt uns, ob die vollständige Gateway-+Agent-Pipeline für dieses Modell funktioniert (Sessions, Verlauf, Tools, Sandbox-Richtlinie usw.).

### Ebene 1: Direkte Modellvervollständigung (ohne Gateway)

- Test: `src/agents/models.profiles.live.test.ts`
- Ziel:
  - Erkannte Modelle auflisten
  - `getApiKeyForModel` verwenden, um Modelle auszuwählen, für die Sie Anmeldedaten haben
  - Pro Modell eine kleine Vervollständigung ausführen (und gezielte Regressionen, wo nötig)
- Aktivierung:
  - `pnpm test:live` (oder `OPENCLAW_LIVE_TEST=1`, wenn Vitest direkt aufgerufen wird)
- Setzen Sie `OPENCLAW_LIVE_MODELS=modern` (oder `all`, Alias für modern), um diese Suite tatsächlich auszuführen; andernfalls wird sie übersprungen, damit `pnpm test:live` auf Gateway-Smoke fokussiert bleibt
- Modellauswahl:
  - `OPENCLAW_LIVE_MODELS=modern`, um die moderne Allowlist auszuführen (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` ist ein Alias für die moderne Allowlist
  - oder `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (kommagetrennte Allowlist)
  - Moderne/All-Sweeps verwenden standardmäßig ein kuratiertes High-Signal-Limit; setzen Sie `OPENCLAW_LIVE_MAX_MODELS=0` für einen vollständigen modernen Sweep oder einen positiven Wert für ein kleineres Limit.
- Providerauswahl:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (kommagetrennte Allowlist)
- Woher die Schlüssel kommen:
  - Standardmäßig: Profilspeicher und Env-Fallbacks
  - Setzen Sie `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um **nur den Profilspeicher** zu erzwingen
- Warum es das gibt:
  - Trennt „Provider-API ist kaputt / Schlüssel ist ungültig“ von „Gateway-Agent-Pipeline ist kaputt“
  - Enthält kleine, isolierte Regressionen (Beispiel: OpenAI-Responses/Codex-Responses-Reasoning-Replay + Tool-Call-Flows)

### Ebene 2: Gateway + Dev-Agent-Smoke (was "@openclaw" tatsächlich macht)

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Ziel:
  - Ein In-Process-Gateway starten
  - Eine `agent:dev:*`-Session erstellen/patchen (Modell-Override pro Lauf)
  - Modelle mit Schlüsseln durchlaufen und Folgendes prüfen:
    - „aussagekräftige“ Antwort (keine Tools)
    - eine echte Tool-Invocation funktioniert (Read-Probe)
    - optionale zusätzliche Tool-Probes (Exec+Read-Probe)
    - OpenAI-Regressionspfade (nur Tool-Call → Follow-up) funktionieren weiterhin
- Probe-Details (damit Sie Fehler schnell erklären können):
  - `read`-Probe: Der Test schreibt eine Nonce-Datei in den Workspace und fordert den Agent auf, sie zu `read`en und die Nonce zurückzugeben.
  - `exec+read`-Probe: Der Test fordert den Agent auf, per `exec` eine Nonce in eine temporäre Datei zu schreiben und sie dann per `read` wieder auszulesen.
  - Bild-Probe: Der Test hängt eine generierte PNG-Datei an (Katze + randomisierter Code) und erwartet, dass das Modell `cat <CODE>` zurückgibt.
  - Implementierungsreferenz: `src/gateway/gateway-models.profiles.live.test.ts` und `src/gateway/live-image-probe.ts`.
- Aktivierung:
  - `pnpm test:live` (oder `OPENCLAW_LIVE_TEST=1`, wenn Vitest direkt aufgerufen wird)
- Modellauswahl:
  - Standard: moderne Allowlist (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` ist ein Alias für die moderne Allowlist
  - Oder setzen Sie `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (oder kommagetrennte Liste), um einzugrenzen
  - Moderne/All-Gateway-Sweeps verwenden standardmäßig ein kuratiertes High-Signal-Limit; setzen Sie `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` für einen vollständigen modernen Sweep oder einen positiven Wert für ein kleineres Limit.
- Providerauswahl (vermeiden Sie „alles über OpenRouter“):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (kommagetrennte Allowlist)
- Tool- und Bild-Probes sind in diesem Live-Test immer aktiviert:
  - `read`-Probe + `exec+read`-Probe (Tool-Stresstest)
  - Bild-Probe wird ausgeführt, wenn das Modell Unterstützung für Bildeingaben bewirbt
  - Ablauf (allgemein):
    - Der Test generiert eine kleine PNG-Datei mit „CAT“ + Zufallscode (`src/gateway/live-image-probe.ts`)
    - Sendet sie über `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Das Gateway parst Attachments in `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Der eingebettete Agent leitet eine multimodale Benutzernachricht an das Modell weiter
    - Assertion: Die Antwort enthält `cat` + den Code (OCR-Toleranz: kleine Fehler sind erlaubt)

Tipp: Um zu sehen, was Sie auf Ihrem Rechner testen können (und die exakten `provider/model`-IDs), führen Sie aus:

```bash
openclaw models list
openclaw models list --json
```

## Live: CLI-Backend-Smoke (Claude, Codex, Gemini oder andere lokale CLIs)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Ziel: die Gateway- + Agent-Pipeline mit einem lokalen CLI-Backend validieren, ohne Ihre Standardkonfiguration zu verändern.
- Backend-spezifische Smoke-Standards liegen in der Definition `cli-backend.ts` der jeweiligen Erweiterung.
- Aktivierung:
  - `pnpm test:live` (oder `OPENCLAW_LIVE_TEST=1`, wenn Vitest direkt aufgerufen wird)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Standardwerte:
  - Standard-Provider/-Modell: `claude-cli/claude-sonnet-4-6`
  - Command/Args/Bildverhalten stammen aus den Metadaten des zugehörigen CLI-Backend-Plugins.
- Überschreibungen (optional):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`, um ein echtes Bild-Attachment zu senden (Pfade werden in den Prompt injiziert).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`, um Bilddateipfade als CLI-Args statt per Prompt-Injektion zu übergeben.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (oder `"list"`), um zu steuern, wie Bild-Args übergeben werden, wenn `IMAGE_ARG` gesetzt ist.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`, um einen zweiten Turn zu senden und den Resume-Flow zu validieren.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0`, um die standardmäßige Claude-Sonnet-→-Opus-Probe für Kontinuität in derselben Session zu deaktivieren (auf `1` setzen, um sie zu erzwingen, wenn das ausgewählte Modell ein Umschaltziel unterstützt).

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
- Er führt den Live-CLI-Backend-Smoke im Repo-Docker-Image als Nicht-Root-Benutzer `node` aus.
- Er löst die CLI-Smoke-Metadaten aus der jeweiligen Erweiterung auf und installiert dann das passende Linux-CLI-Paket (`@anthropic-ai/claude-code`, `@openai/codex` oder `@google/gemini-cli`) in ein zwischengespeichertes beschreibbares Präfix unter `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (Standard: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` erfordert portable Claude Code-Subscription-OAuth über entweder `~/.claude/.credentials.json` mit `claudeAiOauth.subscriptionType` oder `CLAUDE_CODE_OAUTH_TOKEN` aus `claude setup-token`. Es prüft zuerst direkt `claude -p` in Docker und führt dann zwei Gateway-CLI-Backend-Turns aus, ohne Anthropic-API-Key-Umgebungsvariablen beizubehalten. Diese Subscription-Lane deaktiviert standardmäßig die Claude-MCP-/Tool- und Bild-Probes, weil Claude die Nutzung durch Drittanbieter-Apps derzeit über zusätzliche Nutzungsabrechnung statt über normale Limits des Subscription-Plans abrechnet.
- Der Live-CLI-Backend-Smoke testet jetzt denselben End-to-End-Ablauf für Claude, Codex und Gemini: Text-Turn, Bildklassifizierungs-Turn, dann MCP-`cron`-Tool-Call, verifiziert über die Gateway-CLI.
- Claudes Standard-Smoke patcht außerdem die Session von Sonnet auf Opus und verifiziert, dass sich die fortgesetzte Session weiterhin eine frühere Notiz merkt.

## Live: ACP-Bind-Smoke (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Ziel: den realen ACP-Konversations-Bind-Flow mit einem Live-ACP-Agent validieren:
  - `/acp spawn <agent> --bind here` senden
  - eine synthetische Message-Channel-Konversation direkt an Ort und Stelle binden
  - auf derselben Konversation eine normale Follow-up-Nachricht senden
  - verifizieren, dass das Follow-up im gebundenen ACP-Session-Transkript landet
- Aktivierung:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Standardwerte:
  - ACP-Agents in Docker: `claude,codex,gemini`
  - ACP-Agent für direktes `pnpm test:live ...`: `claude`
  - Synthetischer Channel: Slack-DM-artiger Konversationskontext
  - ACP-Backend: `acpx`
- Überschreibungen:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- Hinweise:
  - Diese Lane verwendet die Gateway-Oberfläche `chat.send` mit rein administrativen synthetischen Feldern für die Ursprungroute, sodass Tests Message-Channel-Kontext anhängen können, ohne eine externe Zustellung vorzutäuschen.
  - Wenn `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` nicht gesetzt ist, verwendet der Test das eingebaute Agent-Registry des eingebetteten `acpx`-Plugins für den ausgewählten ACP-Harness-Agent.

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

Docker-Rezepte für einzelne Agents:

```bash
pnpm test:docker:live-acp-bind:claude
pnpm test:docker:live-acp-bind:codex
pnpm test:docker:live-acp-bind:gemini
```

Docker-Hinweise:

- Der Docker-Runner liegt unter `scripts/test-live-acp-bind-docker.sh`.
- Standardmäßig führt er den ACP-Bind-Smoke nacheinander gegen alle unterstützten Live-CLI-Agents aus: `claude`, `codex`, dann `gemini`.
- Verwenden Sie `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` oder `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`, um die Matrix einzugrenzen.
- Er sourct `~/.profile`, stellt das passende CLI-Authentifizierungsmaterial dem Container bereit, installiert `acpx` in ein beschreibbares npm-Präfix und installiert dann die angeforderte Live-CLI (`@anthropic-ai/claude-code`, `@openai/codex` oder `@google/gemini-cli`), falls sie fehlt.
- Innerhalb von Docker setzt der Runner `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx`, damit `acpx` Provider-Umgebungsvariablen aus dem gesourcten Profil für die untergeordnete Harness-CLI verfügbar hält.

## Live: Codex-App-Server-Harness-Smoke

- Ziel: den plugin-eigenen Codex-Harness über die normale Gateway-
  `agent`-Methode validieren:
  - das gebündelte `codex`-Plugin laden
  - `OPENCLAW_AGENT_RUNTIME=codex` auswählen
  - einen ersten Gateway-Agent-Turn an `codex/gpt-5.4` senden
  - einen zweiten Turn an dieselbe OpenClaw-Session senden und verifizieren, dass der App-Server-Thread fortgesetzt werden kann
  - `/codex status` und `/codex models` über denselben Gateway-Command-Pfad ausführen
- Test: `src/gateway/gateway-codex-harness.live.test.ts`
- Aktivierung: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Standardmodell: `codex/gpt-5.4`
- Optionale Bild-Probe: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Optionale MCP-/Tool-Probe: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Der Smoke setzt `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, damit ein defekter Codex-
  Harness nicht dadurch bestehen kann, dass stillschweigend auf Pi zurückgefallen wird.
- Auth: `OPENAI_API_KEY` aus Shell/Profil sowie optional kopierte
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
- Er sourct das eingebundene `~/.profile`, übergibt `OPENAI_API_KEY`, kopiert Codex-CLI-
  Auth-Dateien, falls vorhanden, installiert `@openai/codex` in ein beschreibbares eingebundenes npm-
  Präfix, stellt den Quellbaum bereit und führt dann nur den Codex-Harness-Live-Test aus.
- Docker aktiviert standardmäßig die Bild- und MCP-/Tool-Probes. Setzen Sie
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` oder
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0`, wenn Sie einen engeren Debug-Lauf benötigen.
- Docker exportiert außerdem `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, passend zur Live-
  Testkonfiguration, damit `openai-codex/*`- oder Pi-Fallback einen Codex-Harness-
  Regression nicht verbergen kann.

### Empfohlene Live-Rezepte

Enge, explizite Allowlists sind am schnellsten und am wenigsten fehleranfällig:

- Einzelnes Modell, direkt (ohne Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Einzelnes Modell, Gateway-Smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Tool-Calling über mehrere Provider hinweg:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google-Fokus (Gemini-API-Schlüssel + Antigravity):
  - Gemini (API-Schlüssel): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Hinweise:

- `google/...` verwendet die Gemini API (API-Schlüssel).
- `google-antigravity/...` verwendet die Antigravity-OAuth-Bridge (Cloud-Code-Assist-artiger Agent-Endpoint).
- `google-gemini-cli/...` verwendet die lokale Gemini-CLI auf Ihrem Rechner (separate Auth + Tooling-Besonderheiten).
- Gemini API vs. Gemini CLI:
  - API: OpenClaw ruft Googles gehostete Gemini API über HTTP auf (API-Schlüssel / Profil-Auth); das ist das, was die meisten Benutzer mit „Gemini“ meinen.
  - CLI: OpenClaw führt lokal ein `gemini`-Binary aus; es hat seine eigene Auth und kann sich anders verhalten (Streaming/Tool-Support/Versionsabweichungen).

## Live: Modellmatrix (was wir abdecken)

Es gibt keine feste „CI-Modellliste“ (Live ist Opt-in), aber dies sind die **empfohlenen** Modelle, die auf einem Entwicklungsrechner mit Schlüsseln regelmäßig abgedeckt werden sollten.

### Modernes Smoke-Set (Tool-Calling + Bild)

Dies ist der Lauf für die „gängigen Modelle“, von dem wir erwarten, dass er weiterhin funktioniert:

- OpenAI (nicht-Codex): `openai/gpt-5.4` (optional: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (oder `anthropic/claude-sonnet-4-6`)
- Google (Gemini API): `google/gemini-3.1-pro-preview` und `google/gemini-3-flash-preview` (ältere Gemini-2.x-Modelle vermeiden)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` und `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Gateway-Smoke mit Tools + Bild ausführen:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Baseline: Tool-Calling (Read + optional Exec)

Wählen Sie mindestens eines pro Provider-Familie:

- OpenAI: `openai/gpt-5.4` (oder `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (oder `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (oder `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Optionale zusätzliche Abdeckung (nice to have):

- xAI: `xai/grok-4` (oder die neueste verfügbare Version)
- Mistral: `mistral/`… (wählen Sie ein „tools“-fähiges Modell aus, das Sie aktiviert haben)
- Cerebras: `cerebras/`… (falls Sie Zugriff haben)
- LM Studio: `lmstudio/`… (lokal; Tool-Calling hängt vom API-Modus ab)

### Vision: Bild senden (Attachment → multimodale Nachricht)

Nehmen Sie mindestens ein bildfähiges Modell in `OPENCLAW_LIVE_GATEWAY_MODELS` auf (Claude/Gemini/OpenAI-vision-fähige Varianten usw.), um die Bild-Probe auszuführen.

### Aggregatoren / alternative Gateways

Wenn Sie aktivierte Schlüssel haben, unterstützen wir außerdem Tests über:

- OpenRouter: `openrouter/...` (Hunderte von Modellen; verwenden Sie `openclaw models scan`, um Kandidaten mit Tool- und Bild-Support zu finden)
- OpenCode: `opencode/...` für Zen und `opencode-go/...` für Go (Auth über `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Weitere Provider, die Sie in die Live-Matrix aufnehmen können (wenn Sie Anmeldedaten/Konfiguration haben):

- Integriert: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Über `models.providers` (benutzerdefinierte Endpoints): `minimax` (Cloud/API) sowie jeder OpenAI-/Anthropic-kompatible Proxy (LM Studio, vLLM, LiteLLM usw.)

Tipp: Versuchen Sie nicht, in der Dokumentation „alle Modelle“ fest zu verdrahten. Die maßgebliche Liste ist das, was `discoverModels(...)` auf Ihrem Rechner zurückgibt + welche Schlüssel verfügbar sind.

## Anmeldedaten (niemals committen)

Live-Tests erkennen Anmeldedaten auf dieselbe Weise wie die CLI. Praktische Auswirkungen:

- Wenn die CLI funktioniert, sollten Live-Tests dieselben Schlüssel finden.
- Wenn ein Live-Test „keine Anmeldedaten“ meldet, debuggen Sie ihn genauso, wie Sie `openclaw models list` / Modellauswahl debuggen würden.

- Pro-Agent-Auth-Profile: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (das ist es, was in den Live-Tests mit „Profilschlüsseln“ gemeint ist)
- Konfiguration: `~/.openclaw/openclaw.json` (oder `OPENCLAW_CONFIG_PATH`)
- Legacy-State-Verzeichnis: `~/.openclaw/credentials/` (wird in das bereitgestellte Live-Home kopiert, sofern vorhanden, ist aber nicht der Hauptspeicher für Profilschlüssel)
- Lokale Live-Läufe kopieren standardmäßig die aktive Konfiguration, pro-Agent-`auth-profiles.json`-Dateien, Legacy-`credentials/` und unterstützte externe CLI-Auth-Verzeichnisse in ein temporäres Test-Home; bereitgestellte Live-Homes überspringen `workspace/` und `sandboxes/`, und Pfad-Overrides für `agents.*.workspace` / `agentDir` werden entfernt, damit Probes nicht in Ihrem echten Host-Workspace laufen.

Wenn Sie sich auf Env-Schlüssel verlassen möchten (z. B. in Ihrem `~/.profile` exportiert), führen Sie lokale Tests nach `source ~/.profile` aus oder verwenden Sie die Docker-Runner unten (sie können `~/.profile` in den Container einbinden).

## Deepgram Live (Audiotranskription)

- Test: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- Aktivierung: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## BytePlus Coding-Plan Live

- Test: `src/agents/byteplus.live.test.ts`
- Aktivierung: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- Optionales Modell-Override: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI-Workflow-Media-Live

- Test: `extensions/comfy/comfy.live.test.ts`
- Aktivierung: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Umfang:
  - Testet die gebündelten Comfy-Pfade für Bild, Video und `music_generate`
  - Überspringt jede Capability, sofern `models.providers.comfy.<capability>` nicht konfiguriert ist
  - Nützlich nach Änderungen an Comfy-Workflow-Submission, Polling, Downloads oder Plugin-Registrierung

## Bildgenerierung Live

- Test: `src/image-generation/runtime.live.test.ts`
- Befehl: `pnpm test:live src/image-generation/runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Umfang:
  - Listet jedes registrierte Plugin für Bildgenerierungs-Provider auf
  - Lädt fehlende Provider-Umgebungsvariablen vor dem Testen aus Ihrer Login-Shell (`~/.profile`)
  - Verwendet standardmäßig Live-/Env-API-Schlüssel vor gespeicherten Auth-Profilen, sodass veraltete Testschlüssel in `auth-profiles.json` echte Shell-Anmeldedaten nicht verdecken
  - Überspringt Provider ohne nutzbare Auth/Profil/Modell
  - Führt die Standardvarianten der Bildgenerierung über die gemeinsame Runtime-Capability aus:
    - `google:flash-generate`
    - `google:pro-generate`
    - `google:pro-edit`
    - `openai:default-generate`
- Derzeit abgedeckte gebündelte Provider:
  - `openai`
  - `google`
- Optionale Eingrenzung:
  - `OPENCLAW_LIVE_IMAGE_GENERATION_PROVIDERS="openai,google"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-1,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- Optionales Auth-Verhalten:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um Auth über den Profilspeicher zu erzwingen und reine Env-Overrides zu ignorieren

## Musikgenerierung Live

- Test: `extensions/music-generation-providers.live.test.ts`
- Aktivierung: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Umfang:
  - Testet den gemeinsamen gebündelten Pfad für Musikgenerierungs-Provider
  - Deckt derzeit Google und MiniMax ab
  - Lädt Provider-Umgebungsvariablen vor dem Testen aus Ihrer Login-Shell (`~/.profile`)
  - Verwendet standardmäßig Live-/Env-API-Schlüssel vor gespeicherten Auth-Profilen, sodass veraltete Testschlüssel in `auth-profiles.json` echte Shell-Anmeldedaten nicht verdecken
  - Überspringt Provider ohne nutzbare Auth/Profil/Modell
  - Führt beide deklarierten Runtime-Modi aus, wenn verfügbar:
    - `generate` mit nur promptbasierter Eingabe
    - `edit`, wenn der Provider `capabilities.edit.enabled` deklariert
  - Aktuelle Abdeckung der gemeinsamen Lane:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: separate Comfy-Live-Datei, nicht dieser gemeinsame Sweep
- Optionale Eingrenzung:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- Optionales Auth-Verhalten:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um Auth über den Profilspeicher zu erzwingen und reine Env-Overrides zu ignorieren

## Videogenerierung Live

- Test: `extensions/video-generation-providers.live.test.ts`
- Aktivierung: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Umfang:
  - Testet den gemeinsamen gebündelten Pfad für Videogenerierungs-Provider
  - Verwendet standardmäßig den release-sicheren Smoke-Pfad: nicht-FAL-Provider, eine Text-zu-Video-Anfrage pro Provider, ein einsekündiger Lobster-Prompt und ein providerbezogenes Operationslimit aus `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (`180000` standardmäßig)
  - Überspringt FAL standardmäßig, da providerseitige Queue-Latenz die Release-Zeit dominieren kann; übergeben Sie `--video-providers fal` oder `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"`, um es explizit auszuführen
  - Lädt Provider-Umgebungsvariablen vor dem Testen aus Ihrer Login-Shell (`~/.profile`)
  - Verwendet standardmäßig Live-/Env-API-Schlüssel vor gespeicherten Auth-Profilen, sodass veraltete Testschlüssel in `auth-profiles.json` echte Shell-Anmeldedaten nicht verdecken
  - Überspringt Provider ohne nutzbare Auth/Profil/Modell
  - Führt standardmäßig nur `generate` aus
  - Setzen Sie `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, um zusätzlich deklarierte Transform-Modi auszuführen, wenn verfügbar:
    - `imageToVideo`, wenn der Provider `capabilities.imageToVideo.enabled` deklariert und der ausgewählte Provider/das ausgewählte Modell im gemeinsamen Sweep buffer-gestützte lokale Bildeingaben akzeptiert
    - `videoToVideo`, wenn der Provider `capabilities.videoToVideo.enabled` deklariert und der ausgewählte Provider/das ausgewählte Modell im gemeinsamen Sweep buffer-gestützte lokale Videoeingaben akzeptiert
  - Aktuell deklarierte, aber im gemeinsamen Sweep übersprungene `imageToVideo`-Provider:
    - `vydra`, weil das gebündelte `veo3` nur Text unterstützt und das gebündelte `kling` eine entfernte Bild-URL erfordert
  - Providerspezifische Vydra-Abdeckung:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - diese Datei führt `veo3` Text-zu-Video sowie eine `kling`-Lane aus, die standardmäßig eine Fixture mit entfernter Bild-URL verwendet
  - Aktuelle `videoToVideo`-Live-Abdeckung:
    - nur `runway`, wenn das ausgewählte Modell `runway/gen4_aleph` ist
  - Aktuell deklarierte, aber im gemeinsamen Sweep übersprungene `videoToVideo`-Provider:
    - `alibaba`, `qwen`, `xai`, weil diese Pfade derzeit entfernte `http(s)`-/MP4-Referenz-URLs erfordern
    - `google`, weil die aktuelle gemeinsame Gemini-/Veo-Lane lokale buffer-gestützte Eingaben verwendet und dieser Pfad im gemeinsamen Sweep nicht akzeptiert wird
    - `openai`, weil die aktuelle gemeinsame Lane keine Garantien für organisationsspezifischen Zugriff auf Video-Inpaint/Remix bietet
- Optionale Eingrenzung:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`, um jeden Provider im Standard-Sweep einzuschließen, einschließlich FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`, um das Operationslimit pro Provider für einen aggressiven Smoke-Lauf zu reduzieren
- Optionales Auth-Verhalten:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um Auth über den Profilspeicher zu erzwingen und reine Env-Overrides zu ignorieren

## Media-Live-Harness

- Befehl: `pnpm test:live:media`
- Zweck:
  - Führt die gemeinsamen Live-Suiten für Bild, Musik und Video über einen repo-nativen Entry-Point aus
  - Lädt fehlende Provider-Umgebungsvariablen automatisch aus `~/.profile`
  - Grenzt standardmäßig jede Suite automatisch auf Provider ein, die derzeit nutzbare Auth haben
  - Verwendet `scripts/test-live.mjs` wieder, damit Heartbeat- und Quiet-Mode-Verhalten konsistent bleiben
- Beispiele:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Docker-Runner (optionale „funktioniert unter Linux“-Prüfungen)

Diese Docker-Runner sind in zwei Gruppen aufgeteilt:

- Live-Modell-Runner: `test:docker:live-models` und `test:docker:live-gateway` führen nur ihre jeweils passende Profilschlüssel-Live-Datei im Repo-Docker-Image aus (`src/agents/models.profiles.live.test.ts` und `src/gateway/gateway-models.profiles.live.test.ts`), wobei Ihr lokales Konfigurationsverzeichnis und Ihr Workspace eingebunden werden (und `~/.profile` gesourct wird, falls eingebunden). Die entsprechenden lokalen Entry-Points sind `test:live:models-profiles` und `test:live:gateway-profiles`.
- Docker-Live-Runner verwenden standardmäßig ein kleineres Smoke-Limit, damit ein vollständiger Docker-Sweep praktikabel bleibt:
  `test:docker:live-models` verwendet standardmäßig `OPENCLAW_LIVE_MAX_MODELS=12`, und
  `test:docker:live-gateway` verwendet standardmäßig `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` und
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Überschreiben Sie diese Env-Variablen, wenn Sie
  explizit den größeren vollständigen Scan möchten.
- `test:docker:all` baut das Live-Docker-Image einmal über `test:docker:live-build` und verwendet es dann für die beiden Docker-Lanes für Live-Tests wieder.
- Container-Smoke-Runner: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:gateway-network`, `test:docker:mcp-channels` und `test:docker:plugins` starten einen oder mehrere reale Container und verifizieren Integrationspfade auf höherer Ebene.

Die Docker-Runner für Live-Modelle binden außerdem nur die benötigten CLI-Auth-Homes ein (oder alle unterstützten, wenn der Lauf nicht eingegrenzt ist) und kopieren sie dann vor dem Lauf in das Container-Home, damit externe CLI-OAuth Tokens aktualisieren kann, ohne den Auth-Speicher des Hosts zu verändern:

- Direkte Modelle: `pnpm test:docker:live-models` (Skript: `scripts/test-live-models-docker.sh`)
- ACP-Bind-Smoke: `pnpm test:docker:live-acp-bind` (Skript: `scripts/test-live-acp-bind-docker.sh`)
- CLI-Backend-Smoke: `pnpm test:docker:live-cli-backend` (Skript: `scripts/test-live-cli-backend-docker.sh`)
- Codex-App-Server-Harness-Smoke: `pnpm test:docker:live-codex-harness` (Skript: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + Dev-Agent: `pnpm test:docker:live-gateway` (Skript: `scripts/test-live-gateway-models-docker.sh`)
- Open-WebUI-Live-Smoke: `pnpm test:docker:openwebui` (Skript: `scripts/e2e/openwebui-docker.sh`)
- Onboarding-Assistent (TTY, vollständiges Scaffold): `pnpm test:docker:onboard` (Skript: `scripts/e2e/onboard-docker.sh`)
- Gateway-Networking (zwei Container, WS-Auth + Health): `pnpm test:docker:gateway-network` (Skript: `scripts/e2e/gateway-network-docker.sh`)
- MCP-Channel-Bridge (vorbereiteter Gateway + stdio-Bridge + roher Claude-Benachrichtigungs-Frame-Smoke): `pnpm test:docker:mcp-channels` (Skript: `scripts/e2e/mcp-channels-docker.sh`)
- Plugins (Installations-Smoke + `/plugin`-Alias + Claude-Bundle-Neustart-Semantik): `pnpm test:docker:plugins` (Skript: `scripts/e2e/plugins-docker.sh`)

Die Docker-Runner für Live-Modelle binden außerdem den aktuellen Checkout schreibgeschützt ein und
stellen ihn in ein temporäres Arbeitsverzeichnis im Container bereit. Dadurch bleibt das Runtime-
Image schlank, während Vitest weiterhin gegen Ihre exakte lokale Quelle/Konfiguration ausgeführt wird.
Der Bereitstellungsschritt überspringt große lokale Caches und App-Build-Ausgaben wie
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` und app-lokale `.build`- oder
Gradle-Ausgabeverzeichnisse, damit Docker-Live-Läufe nicht minutenlang damit verbringen,
maschinenspezifische Artefakte zu kopieren.
Sie setzen außerdem `OPENCLAW_SKIP_CHANNELS=1`, damit Gateway-Live-Probes keine
realen Worker für Telegram/Discord/etc. im Container starten.
`test:docker:live-models` führt weiterhin `pnpm test:live` aus; reichen Sie daher
auch `OPENCLAW_LIVE_GATEWAY_*` durch, wenn Sie Gateway-
Live-Abdeckung in dieser Docker-Lane eingrenzen oder ausschließen möchten.
`test:docker:openwebui` ist ein Smoke-Test für Kompatibilität auf höherer Ebene: Er startet einen
OpenClaw-Gateway-Container mit aktivierten OpenAI-kompatiblen HTTP-Endpoints,
startet einen festgelegten Open-WebUI-Container gegen dieses Gateway, meldet sich über
Open WebUI an, verifiziert, dass `/api/models` `openclaw/default` bereitstellt, und sendet dann eine
reale Chat-Anfrage über den Proxy `/api/chat/completions` von Open WebUI.
Der erste Lauf kann merklich langsamer sein, weil Docker möglicherweise erst das
Open-WebUI-Image ziehen muss und Open WebUI möglicherweise seine eigene Cold-Start-Einrichtung erst abschließen muss.
Diese Lane erwartet einen nutzbaren Live-Modellschlüssel, und `OPENCLAW_PROFILE_FILE`
(`~/.profile` standardmäßig) ist der primäre Weg, ihn in Docker-Läufen bereitzustellen.
Erfolgreiche Läufe geben eine kleine JSON-Payload wie `{ "ok": true, "model":
"openclaw/default", ... }` aus.
`test:docker:mcp-channels` ist absichtlich deterministisch und benötigt kein
reales Telegram-, Discord- oder iMessage-Konto. Es startet einen vorbereiteten Gateway-
Container, startet einen zweiten Container, der `openclaw mcp serve` ausführt, und
verifiziert dann geroutete Konversationserkennung, Transkript-Lesevorgänge, Attachment-Metadaten,
Verhalten der Live-Ereigniswarteschlange, Routing für ausgehendes Senden und Claude-artige Channel- +
Berechtigungsbenachrichtigungen über die reale stdio-MCP-Bridge. Die Benachrichtigungsprüfung
untersucht die rohen stdio-MCP-Frames direkt, sodass der Smoke das validiert, was die
Bridge tatsächlich ausgibt, nicht nur das, was ein bestimmtes Client-SDK zufällig bereitstellt.

Manueller ACP-Smoke für Plain-Language-Threads (nicht CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Behalten Sie dieses Skript für Regression-/Debug-Workflows. Es könnte für die Validierung des ACP-Thread-Routings erneut benötigt werden, also löschen Sie es nicht.

Nützliche Env-Variablen:

- `OPENCLAW_CONFIG_DIR=...` (Standard: `~/.openclaw`), eingebunden nach `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (Standard: `~/.openclaw/workspace`), eingebunden nach `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (Standard: `~/.profile`), eingebunden nach `/home/node/.profile` und vor dem Ausführen von Tests gesourct
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, um nur Env-Variablen zu verifizieren, die aus `OPENCLAW_PROFILE_FILE` gesourct wurden, unter Verwendung temporärer Konfigurations-/Workspace-Verzeichnisse und ohne externe CLI-Auth-Mounts
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (Standard: `~/.cache/openclaw/docker-cli-tools`), eingebunden nach `/home/node/.npm-global` für zwischengespeicherte CLI-Installationen in Docker
- Externe CLI-Auth-Verzeichnisse/-Dateien unter `$HOME` werden schreibgeschützt unter `/host-auth...` eingebunden und dann vor Testbeginn nach `/home/node/...` kopiert
  - Standardverzeichnisse: `.minimax`
  - Standarddateien: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Eingegrenzte Provider-Läufe binden nur die benötigten Verzeichnisse/Dateien ein, die aus `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` abgeleitet werden
  - Manuelles Überschreiben mit `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` oder einer kommagetrennten Liste wie `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, um den Lauf einzugrenzen
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, um Provider im Container zu filtern
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, um ein vorhandenes Image `openclaw:local-live` für erneute Läufe ohne Neubau wiederzuverwenden
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um sicherzustellen, dass Anmeldedaten aus dem Profilspeicher kommen (nicht aus Env)
- `OPENCLAW_OPENWEBUI_MODEL=...`, um das vom Gateway für den Open-WebUI-Smoke bereitgestellte Modell auszuwählen
- `OPENCLAW_OPENWEBUI_PROMPT=...`, um den vom Open-WebUI-Smoke verwendeten Nonce-Check-Prompt zu überschreiben
- `OPENWEBUI_IMAGE=...`, um das festgelegte Open-WebUI-Image-Tag zu überschreiben

## Plausibilitätsprüfung für die Dokumentation

Führen Sie nach Änderungen an der Dokumentation die Docs-Prüfungen aus: `pnpm check:docs`.
Führen Sie die vollständige Mintlify-Anchor-Validierung aus, wenn Sie auch In-Page-Heading-Prüfungen benötigen: `pnpm docs:check-links:anchors`.

## Offline-Regression (CI-sicher)

Dies sind „echte Pipeline“-Regressionen ohne reale Provider:

- Gateway-Tool-Calling (Mock-OpenAI, reales Gateway + Agent-Loop): `src/gateway/gateway.test.ts` (Fall: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway-Assistent (WS `wizard.start`/`wizard.next`, schreibt Konfiguration + Auth erzwungen): `src/gateway/gateway.test.ts` (Fall: "runs wizard over ws and writes auth token config")

## Evals zur Agent-Zuverlässigkeit (Skills)

Wir haben bereits einige CI-sichere Tests, die sich wie „Evals zur Agent-Zuverlässigkeit“ verhalten:

- Mock-Tool-Calling durch den realen Gateway- + Agent-Loop (`src/gateway/gateway.test.ts`).
- End-to-End-Assistenten-Flows, die Session-Verdrahtung und Konfigurationseffekte validieren (`src/gateway/gateway.test.ts`).

Was für Skills noch fehlt (siehe [Skills](/de/tools/skills)):

- **Entscheidungsfindung:** Wenn Skills im Prompt aufgeführt sind, wählt der Agent dann den richtigen Skill aus (oder vermeidet irrelevante)?
- **Compliance:** Liest der Agent vor der Nutzung `SKILL.md` und befolgt erforderliche Schritte/Args?
- **Workflow-Verträge:** Mehrturn-Szenarien, die Tool-Reihenfolge, Übernahme des Session-Verlaufs und Sandbox-Grenzen prüfen.

Zukünftige Evals sollten zuerst deterministisch bleiben:

- Ein Szenario-Runner mit Mock-Providern, um Tool-Calls + Reihenfolge, Skill-Datei-Lesevorgänge und Session-Verdrahtung zu prüfen.
- Eine kleine Suite mit skillfokussierten Szenarien (verwenden vs. vermeiden, Gating, Prompt-Injection).
- Optionale Live-Evals (Opt-in, per Env gesteuert) erst, nachdem die CI-sichere Suite vorhanden ist.

## Vertragstests (Plugin- und Channel-Form)

Vertragstests verifizieren, dass jedes registrierte Plugin und jeder Channel seinem
Schnittstellenvertrag entspricht. Sie iterieren über alle erkannten Plugins und führen eine Suite aus
Form- und Verhaltensprüfungen aus. Die standardmäßige Unit-Lane `pnpm test` überspringt diese gemeinsamen
Seam- und Smoke-Dateien absichtlich; führen Sie die Vertragsbefehle explizit aus,
wenn Sie gemeinsame Channel- oder Provider-Oberflächen verändern.

### Befehle

- Alle Verträge: `pnpm test:contracts`
- Nur Channel-Verträge: `pnpm test:contracts:channels`
- Nur Provider-Verträge: `pnpm test:contracts:plugins`

### Channel-Verträge

Zu finden unter `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Grundlegende Plugin-Form (ID, Name, Capabilities)
- **setup** - Vertrag des Setup-Assistenten
- **session-binding** - Verhalten der Session-Bindung
- **outbound-payload** - Struktur der Nachrichten-Payload
- **inbound** - Verarbeitung eingehender Nachrichten
- **actions** - Handler für Channel-Aktionen
- **threading** - Verarbeitung von Thread-IDs
- **directory** - Verzeichnis-/Roster-API
- **group-policy** - Durchsetzung der Gruppenrichtlinie

### Verträge für Provider-Status

Zu finden unter `src/plugins/contracts/*.contract.test.ts`.

- **status** - Status-Probes für Channels
- **registry** - Form der Plugin-Registry

### Provider-Verträge

Zu finden unter `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Auth-Flow-Vertrag
- **auth-choice** - Auswahl/Selektion von Auth
- **catalog** - API für Modellkataloge
- **discovery** - Plugin-Erkennung
- **loader** - Plugin-Laden
- **runtime** - Provider-Runtime
- **shape** - Plugin-Form/-Schnittstelle
- **wizard** - Setup-Assistent

### Wann ausführen

- Nach Änderungen an `plugin-sdk`-Exports oder Subpaths
- Nach dem Hinzufügen oder Ändern eines Channel- oder Provider-Plugins
- Nach Refactorings an Plugin-Registrierung oder -Erkennung

Vertragstests laufen in CI und erfordern keine echten API-Schlüssel.

## Regressionen hinzufügen (Leitlinien)

Wenn Sie ein in Live entdecktes Provider-/Modellproblem beheben:

- Fügen Sie nach Möglichkeit eine CI-sichere Regression hinzu (Mock-/Stub-Provider oder erfassen Sie die genaue Transformation der Request-Form)
- Wenn es inhärent nur Live betrifft (Rate Limits, Auth-Richtlinien), halten Sie den Live-Test eng gefasst und per Env-Variablen opt-in
- Zielen Sie bevorzugt auf die kleinste Ebene, die den Fehler erfasst:
  - Fehler bei Provider-Request-Konvertierung/Replay → direkter Modelltest
  - Fehler in Gateway-Session-/Verlaufs-/Tool-Pipeline → Gateway-Live-Smoke oder CI-sicherer Gateway-Mock-Test
- Schutzregel für SecretRef-Traversal:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` leitet aus Registry-Metadaten (`listSecretTargetRegistryEntries()`) ein Beispielziel pro SecretRef-Klasse ab und prüft dann, dass Exec-IDs von Traversal-Segmenten abgelehnt werden.
  - Wenn Sie in `src/secrets/target-registry-data.ts` eine neue `includeInPlan`-SecretRef-Zielfamilie hinzufügen, aktualisieren Sie `classifyTargetClass` in diesem Test. Der Test schlägt absichtlich bei nicht klassifizierten Ziel-IDs fehl, sodass neue Klassen nicht stillschweigend übersprungen werden können.
