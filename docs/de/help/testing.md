---
read_when:
    - Tests lokal oder in CI ausführen
    - Regressionstests für Modell-/Provider-Fehler hinzufügen
    - Gateway- und Agent-Verhalten debuggen
summary: 'Test-Kit: Unit-/E2E-/Live-Suiten, Docker-Runner und was jeder Test abdeckt'
title: Testen
x-i18n:
    generated_at: "2026-04-16T21:51:19Z"
    model: gpt-5.4
    provider: openai
    source_hash: af2bc0e9b5e08ca3119806d355b517290f6078fda430109e7a0b153586215e34
    source_path: help/testing.md
    workflow: 15
---

# Testen

OpenClaw hat drei Vitest-Suiten (Unit/Integration, E2E, Live) und eine kleine Auswahl an Docker-Runnern.

Dieses Dokument ist ein Leitfaden dazu, „wie wir testen“:

- Was jede Suite abdeckt (und was sie bewusst _nicht_ abdeckt)
- Welche Befehle Sie für gängige Workflows ausführen sollten (lokal, vor dem Push, Debugging)
- Wie Live-Tests Zugangsdaten erkennen und Modelle/Provider auswählen
- Wie Sie Regressionstests für reale Modell-/Provider-Probleme hinzufügen

## Schnellstart

An den meisten Tagen:

- Vollständige Prüfleiste (vor dem Push erwartet): `pnpm build && pnpm check && pnpm test`
- Schnellere lokale Ausführung der gesamten Suite auf einem leistungsfähigen Rechner: `pnpm test:max`
- Direkte Vitest-Watch-Schleife: `pnpm test:watch`
- Direktes Targeting von Dateien routet jetzt auch Erweiterungs-/Channel-Pfade: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Bevorzugen Sie zuerst gezielte Ausführungen, wenn Sie an einem einzelnen Fehler iterieren.
- Docker-gestützte QA-Site: `pnpm qa:lab:up`
- Linux-VM-gestützte QA-Lane: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Wenn Sie Tests anfassen oder zusätzliche Sicherheit möchten:

- Coverage-Prüfleiste: `pnpm test:coverage`
- E2E-Suite: `pnpm test:e2e`

Beim Debuggen echter Provider/Modelle (erfordert echte Zugangsdaten):

- Live-Suite (Modelle + Gateway-Tool-/Image-Probes): `pnpm test:live`
- Eine einzelne Live-Datei still ausführen: `pnpm test:live -- src/agents/models.profiles.live.test.ts`

Tipp: Wenn Sie nur einen einzelnen fehlschlagenden Fall benötigen, grenzen Sie Live-Tests bevorzugt über die unten beschriebenen Allowlist-Umgebungsvariablen ein.

## QA-spezifische Runner

Diese Befehle stehen neben den Haupttestsuiten zur Verfügung, wenn Sie die Realitätsnähe von QA-lab benötigen:

- `pnpm openclaw qa suite`
  - Führt repo-gestützte QA-Szenarien direkt auf dem Host aus.
  - Führt standardmäßig mehrere ausgewählte Szenarien parallel mit isolierten Gateway-Workern aus, bis zu 64 Worker oder die Anzahl der ausgewählten Szenarien. Verwenden Sie `--concurrency <count>`, um die Anzahl der Worker anzupassen, oder `--concurrency 1` für die ältere serielle Lane.
- `pnpm openclaw qa suite --runner multipass`
  - Führt dieselbe QA-Suite in einer wegwerfbaren Multipass-Linux-VM aus.
  - Behält dasselbe Verhalten bei der Szenarioauswahl wie `qa suite` auf dem Host bei.
  - Verwendet dieselben Flags zur Provider-/Modellauswahl wie `qa suite`.
  - Live-Ausführungen leiten die unterstützten QA-Authentifizierungs-Eingaben weiter, die für den Gast praktikabel sind:
    env-basierte Provider-Schlüssel, den Konfigurationspfad des QA-Live-Providers und `CODEX_HOME`, falls vorhanden.
  - Ausgabeverzeichnisse müssen unterhalb der Repo-Wurzel bleiben, damit der Gast über den eingebundenen Workspace zurückschreiben kann.
  - Schreibt den normalen QA-Bericht und die Zusammenfassung sowie Multipass-Logs unter
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Startet die Docker-gestützte QA-Site für operatorähnliche QA-Arbeit.
- `pnpm openclaw qa matrix`
  - Führt die Matrix-Live-QA-Lane gegen einen wegwerfbaren, Docker-gestützten Tuwunel-Homeserver aus.
  - Dieser QA-Host ist derzeit nur für Repo/Entwicklung gedacht. Paketierte OpenClaw-Installationen enthalten kein `qa-lab` und stellen daher `openclaw qa` nicht bereit.
  - Repo-Checkouts laden den gebündelten Runner direkt; ein separater Plugin-Installationsschritt ist nicht erforderlich.
  - Stellt drei temporäre Matrix-Benutzer (`driver`, `sut`, `observer`) sowie einen privaten Raum bereit und startet dann einen QA-Gateway-Child mit dem echten Matrix-Plugin als SUT-Transport.
  - Verwendet standardmäßig das festgelegte stabile Tuwunel-Image `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Überschreiben Sie dies mit `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`, wenn Sie ein anderes Image testen müssen.
  - Matrix stellt keine gemeinsamen Credential-Source-Flags bereit, weil die Lane lokal temporäre Benutzer bereitstellt.
  - Schreibt einen Matrix-QA-Bericht, eine Zusammenfassung, ein Artifact mit beobachteten Ereignissen und ein kombiniertes stdout/stderr-Ausgabelog unter `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - Führt die Telegram-Live-QA-Lane gegen eine echte private Gruppe aus, unter Verwendung der Bot-Tokens für Driver und SUT aus den Umgebungsvariablen.
  - Erfordert `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` und `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Die Gruppen-ID muss die numerische Telegram-Chat-ID sein.
  - Unterstützt `--credential-source convex` für gemeinsam genutzte gepoolte Zugangsdaten. Verwenden Sie standardmäßig den env-Modus oder setzen Sie `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, um gepoolte Leases zu verwenden.
  - Erfordert zwei unterschiedliche Bots in derselben privaten Gruppe, wobei der SUT-Bot einen Telegram-Benutzernamen bereitstellen muss.
  - Für eine stabile Beobachtung zwischen Bots aktivieren Sie in `@BotFather` für beide Bots den Modus „Bot-to-Bot Communication“ und stellen Sie sicher, dass der Driver-Bot Bot-Datenverkehr in der Gruppe beobachten kann.
  - Schreibt einen Telegram-QA-Bericht, eine Zusammenfassung und ein Artifact mit beobachteten Nachrichten unter `.artifacts/qa-e2e/...`.

Live-Transport-Lanes teilen sich einen Standardvertrag, damit neue Transporte nicht auseinanderlaufen:

`qa-channel` bleibt die breite synthetische QA-Suite und ist nicht Teil der Live-Transport-Abdeckungsmatrix.

| Lane     | Canary | Mention-Gating | Allowlist-Block | Antwort auf oberster Ebene | Fortsetzen nach Neustart | Thread-Follow-up | Thread-Isolation | Reaktionsbeobachtung | Help-Befehl |
| -------- | ------ | -------------- | ---------------- | -------------------------- | ------------------------ | ---------------- | ---------------- | -------------------- | ------------ |
| Matrix   | x      | x              | x                | x                          | x                        | x                | x                | x                    |              |
| Telegram | x      |                |                  |                            |                          |                  |                  |                      | x            |

### Gemeinsame Telegram-Zugangsdaten über Convex (v1)

Wenn `--credential-source convex` (oder `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) für
`openclaw qa telegram` aktiviert ist, erwirbt QA lab ein exklusives Lease aus einem Convex-gestützten Pool, sendet Heartbeat-Signale für dieses Lease, während die Lane läuft, und gibt das Lease beim Herunterfahren frei.

Referenzgerüst für ein Convex-Projekt:

- `qa/convex-credential-broker/`

Erforderliche Umgebungsvariablen:

- `OPENCLAW_QA_CONVEX_SITE_URL` (zum Beispiel `https://your-deployment.convex.site`)
- Ein Secret für die ausgewählte Rolle:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` für `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` für `ci`
- Auswahl der Credential-Rolle:
  - CLI: `--credential-role maintainer|ci`
  - Standard per Umgebungsvariable: `OPENCLAW_QA_CREDENTIAL_ROLE` (standardmäßig `maintainer`)

Optionale Umgebungsvariablen:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (Standard `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (Standard `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (Standard `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (Standard `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (Standard `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (optionale Trace-ID)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` erlaubt lokale `http://`-Convex-URLs über Loopback nur für die lokale Entwicklung.

`OPENCLAW_QA_CONVEX_SITE_URL` sollte im normalen Betrieb `https://` verwenden.

Maintainer-Admin-Befehle (Pool hinzufügen/entfernen/auflisten) erfordern
explizit `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI-Helfer für Maintainer:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Verwenden Sie `--json` für maschinenlesbare Ausgaben in Skripten und CI-Hilfsprogrammen.

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
- `POST /admin/add` (nur mit Maintainer-Secret)
  - Anfrage: `{ kind, actorId, payload, note?, status? }`
  - Erfolg: `{ status: "ok", credential }`
- `POST /admin/remove` (nur mit Maintainer-Secret)
  - Anfrage: `{ credentialId, actorId }`
  - Erfolg: `{ status: "ok", changed, credential }`
  - Schutz bei aktivem Lease: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (nur mit Maintainer-Secret)
  - Anfrage: `{ kind?, status?, includePayload?, limit? }`
  - Erfolg: `{ status: "ok", credentials, count }`

Payload-Form für den Telegram-Typ:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` muss ein numerischer String der Telegram-Chat-ID sein.
- `admin/add` validiert diese Form für `kind: "telegram"` und weist fehlerhafte Payloads zurück.

### Einen Channel zu QA hinzufügen

Das Hinzufügen eines Channel zur Markdown-QA-Systematik erfordert genau zwei Dinge:

1. Einen Transport-Adapter für den Channel.
2. Ein Szenario-Paket, das den Channel-Vertrag testet.

Fügen Sie keinen neuen Root-Befehl auf oberster QA-Ebene hinzu, wenn der gemeinsame `qa-lab`-Host den Ablauf übernehmen kann.

`qa-lab` ist für die gemeinsamen Host-Mechaniken zuständig:

- die Root für den Befehl `openclaw qa`
- Starten und Beenden der Suite
- Worker-Konkurrenz
- Schreiben von Artifacts
- Berichtsgenerierung
- Ausführung von Szenarien
- Kompatibilitäts-Aliase für ältere `qa-channel`-Szenarien

Runner-Plugins sind für den Transportvertrag zuständig:

- wie `openclaw qa <runner>` unterhalb der gemeinsamen `qa`-Root eingehängt wird
- wie das Gateway für diesen Transport konfiguriert wird
- wie die Bereitschaft geprüft wird
- wie eingehende Ereignisse injiziert werden
- wie ausgehende Nachrichten beobachtet werden
- wie Transkripte und normalisierter Transportstatus bereitgestellt werden
- wie transportgestützte Aktionen ausgeführt werden
- wie transport-spezifische Rücksetzungen oder Bereinigungen behandelt werden

Die minimale Hürde für die Übernahme eines neuen Channel ist:

1. Behalten Sie `qa-lab` als Besitzer der gemeinsamen `qa`-Root bei.
2. Implementieren Sie den Transport-Runner auf der gemeinsamen `qa-lab`-Host-Schnittstelle.
3. Behalten Sie transport-spezifische Mechaniken im Runner-Plugin oder im Channel-Harness.
4. Hängen Sie den Runner als `openclaw qa <runner>` ein, statt eine konkurrierende Root-Command zu registrieren.
   Runner-Plugins sollten `qaRunners` in `openclaw.plugin.json` deklarieren und ein passendes Array `qaRunnerCliRegistrations` aus `runtime-api.ts` exportieren.
   Halten Sie `runtime-api.ts` schlank; lazy CLI- und Runner-Ausführung sollte hinter separaten Entry-Points bleiben.
5. Erstellen oder passen Sie Markdown-Szenarien unter `qa/scenarios/` an.
6. Verwenden Sie die generischen Szenario-Helfer für neue Szenarien.
7. Halten Sie bestehende Kompatibilitäts-Aliase funktionsfähig, sofern das Repo nicht gerade eine gezielte Migration durchführt.

Die Entscheidungsregel ist strikt:

- Wenn ein Verhalten einmalig in `qa-lab` ausgedrückt werden kann, platzieren Sie es in `qa-lab`.
- Wenn ein Verhalten von einem einzelnen Channel-Transport abhängt, belassen Sie es in diesem Runner-Plugin oder Plugin-Harness.
- Wenn ein Szenario eine neue Fähigkeit benötigt, die von mehr als einem Channel genutzt werden kann, fügen Sie einen generischen Helfer hinzu, statt einen channelspezifischen Zweig in `suite.ts`.
- Wenn ein Verhalten nur für einen einzelnen Transport sinnvoll ist, halten Sie das Szenario transportspezifisch und machen Sie das im Szenariovertrag ausdrücklich.

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

Kompatibilitäts-Aliase bleiben für bestehende Szenarien verfügbar, darunter:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

Neue Channel-Arbeit sollte die generischen Helfernamen verwenden.
Kompatibilitäts-Aliase existieren, um eine Migration mit Stichtag zu vermeiden, nicht als Vorbild für das Verfassen neuer Szenarien.

## Test-Suiten (was wo läuft)

Stellen Sie sich die Suiten als „zunehmenden Realismus“ vor (und zunehmende Flakiness/Kosten):

### Unit / Integration (Standard)

- Befehl: `pnpm test`
- Konfiguration: zehn sequentielle Shard-Läufe (`vitest.full-*.config.ts`) über die vorhandenen abgegrenzten Vitest-Projekte
- Dateien: Core-/Unit-Inventare unter `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` sowie die per Whitelist zugelassenen `ui`-Node-Tests, die von `vitest.unit.config.ts` abgedeckt werden
- Umfang:
  - Reine Unit-Tests
  - In-Process-Integrationstests (Gateway-Authentifizierung, Routing, Tooling, Parsing, Konfiguration)
  - Deterministische Regressionstests für bekannte Fehler
- Erwartungen:
  - Läuft in CI
  - Keine echten Schlüssel erforderlich
  - Sollte schnell und stabil sein
- Hinweis zu Projekten:
  - Nicht gezieltes `pnpm test` führt jetzt elf kleinere Shard-Konfigurationen aus (`core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) statt eines einzigen großen nativen Root-Project-Prozesses. Das senkt die Spitzen-RSS auf stark ausgelasteten Rechnern und verhindert, dass `auto-reply`-/Erweiterungsarbeit andere Suiten verhungern lässt.
  - `pnpm test --watch` verwendet weiterhin den nativen Root-`vitest.config.ts`-Projektgraphen, weil eine Multi-Shard-Watch-Schleife nicht praktikabel ist.
  - `pnpm test`, `pnpm test:watch` und `pnpm test:perf:imports` leiten explizite Datei-/Verzeichnisziele jetzt zuerst durch abgegrenzte Lanes, sodass `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` nicht den Startaufwand des vollständigen Root-Projekts zahlen muss.
  - `pnpm test:changed` erweitert geänderte Git-Pfade in dieselben abgegrenzten Lanes, wenn der Diff nur routbare Quell-/Testdateien berührt; Änderungen an Konfiguration/Setup fallen weiterhin auf die breite erneute Ausführung des Root-Projekts zurück.
  - Import-leichte Unit-Tests aus Agents, Commands, Plugins, `auto-reply`-Hilfen, `plugin-sdk` und ähnlichen reinen Utility-Bereichen laufen über die `unit-fast`-Lane, die `test/setup-openclaw-runtime.ts` überspringt; zustandsbehaftete/runtime-lastige Dateien bleiben auf den vorhandenen Lanes.
  - Ausgewählte Hilfsquelldateien aus `plugin-sdk` und `commands` ordnen Läufe im Changed-Modus ebenfalls expliziten benachbarten Tests in diesen leichten Lanes zu, sodass Änderungen an Helfern nicht die gesamte schwere Suite für dieses Verzeichnis erneut ausführen.
  - `auto-reply` hat jetzt drei dedizierte Buckets: Core-Helfer auf oberster Ebene, `reply.*`-Integrationstests auf oberster Ebene und den Teilbaum `src/auto-reply/reply/**`. Dadurch bleibt die schwerste Reply-Harness-Arbeit von den günstigen Status-/Chunk-/Token-Tests getrennt.
- Hinweis zum eingebetteten Runner:
  - Wenn Sie Eingaben für die Erkennung von Message-Tools oder den Laufzeitkontext von Compaction ändern, halten Sie beide Ebenen der Abdeckung aufrecht.
  - Fügen Sie fokussierte Hilfs-Regressionstests für reine Routing-/Normalisierungsgrenzen hinzu.
  - Halten Sie außerdem die Integrationstest-Suiten des eingebetteten Runners funktionsfähig:
    `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
    `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` und
    `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
  - Diese Suiten verifizieren, dass abgegrenzte IDs und Compaction-Verhalten weiterhin durch die echten Pfade `run.ts` / `compact.ts` fließen; reine Hilfstests sind kein ausreichender Ersatz für diese Integrationspfade.
- Hinweis zum Pool:
  - Die Basis-Vitest-Konfiguration verwendet jetzt standardmäßig `threads`.
  - Die gemeinsame Vitest-Konfiguration legt außerdem `isolate: false` fest und verwendet den nicht isolierten Runner über die Root-Projekte, E2E- und Live-Konfigurationen hinweg.
  - Die Root-UI-Lane behält ihr `jsdom`-Setup und ihren Optimizer bei, läuft jetzt aber ebenfalls auf dem gemeinsamen nicht isolierten Runner.
  - Jeder `pnpm test`-Shard übernimmt dieselben Standardwerte `threads` + `isolate: false` aus der gemeinsamen Vitest-Konfiguration.
  - Der gemeinsame Launcher `scripts/run-vitest.mjs` fügt für Vitest-Child-Node-Prozesse jetzt standardmäßig ebenfalls `--no-maglev` hinzu, um den V8-Kompilierungs-Overhead bei großen lokalen Läufen zu verringern. Setzen Sie `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, wenn Sie mit dem Standardverhalten von V8 vergleichen möchten.
- Hinweis zur schnellen lokalen Iteration:
  - `pnpm test:changed` läuft über abgegrenzte Lanes, wenn die geänderten Pfade sauber auf eine kleinere Suite abgebildet werden.
  - `pnpm test:max` und `pnpm test:changed:max` behalten dasselbe Routing-Verhalten bei, nur mit einer höheren Worker-Obergrenze.
  - Die automatische lokale Worker-Skalierung ist jetzt bewusst konservativ und fährt auch zurück, wenn die Last des Hosts bereits hoch ist, sodass mehrere gleichzeitige Vitest-Läufe standardmäßig weniger Schaden anrichten.
  - Die Basis-Vitest-Konfiguration markiert die Projekte/Konfigurationsdateien als `forceRerunTriggers`, damit erneute Läufe im Changed-Modus korrekt bleiben, wenn sich die Test-Verdrahtung ändert.
  - Die Konfiguration lässt `OPENCLAW_VITEST_FS_MODULE_CACHE` auf unterstützten Hosts aktiviert; setzen Sie `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, wenn Sie einen expliziten Cache-Speicherort für direktes Profiling möchten.
- Hinweis zum Performance-Debugging:
  - `pnpm test:perf:imports` aktiviert die Berichterstattung zu Vitest-Importdauer sowie die Ausgabe einer Import-Aufschlüsselung.
  - `pnpm test:perf:imports:changed` begrenzt dieselbe Profiling-Ansicht auf Dateien, die seit `origin/main` geändert wurden.
- `pnpm test:perf:changed:bench -- --ref <git-ref>` vergleicht das geroutete `test:changed` mit dem nativen Root-Project-Pfad für diesen festgeschriebenen Diff und gibt Wandzeit sowie den maximalen RSS unter macOS aus.
- `pnpm test:perf:changed:bench -- --worktree` benchmarkt den aktuellen schmutzigen Arbeitsbaum, indem die Liste geänderter Dateien durch `scripts/test-projects.mjs` und die Root-Vitest-Konfiguration geroutet wird.
  - `pnpm test:perf:profile:main` schreibt ein CPU-Profil des Haupt-Threads für Vitest-/Vite-Start und Transform-Overhead.
  - `pnpm test:perf:profile:runner` schreibt CPU- und Heap-Profile des Runners für die Unit-Suite bei deaktivierter Datei-Parallelisierung.

### E2E (Gateway-Smoke)

- Befehl: `pnpm test:e2e`
- Konfiguration: `vitest.e2e.config.ts`
- Dateien: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts`
- Laufzeit-Standards:
  - Verwendet Vitest-`threads` mit `isolate: false`, passend zum Rest des Repos.
  - Verwendet adaptive Worker (CI: bis zu 2, lokal: standardmäßig 1).
  - Läuft standardmäßig im stillen Modus, um den Console-I/O-Overhead zu reduzieren.
- Nützliche Overrides:
  - `OPENCLAW_E2E_WORKERS=<n>`, um die Anzahl der Worker fest vorzugeben (begrenzt auf 16).
  - `OPENCLAW_E2E_VERBOSE=1`, um ausführliche Konsolenausgabe wieder zu aktivieren.
- Umfang:
  - End-to-End-Verhalten des Gateway mit mehreren Instanzen
  - WebSocket-/HTTP-Oberflächen, Node-Pairing und schwergewichtigere Netzwerkarbeit
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
  - Testet OpenClaws OpenShell-Backend über echtes `sandbox ssh-config` + SSH-Ausführung
  - Verifiziert kanonisches Remote-Dateisystemverhalten über die Sandbox-FS-Bridge
- Erwartungen:
  - Nur Opt-in; kein Teil des standardmäßigen Laufs `pnpm test:e2e`
  - Erfordert eine lokale `openshell`-CLI sowie einen funktionierenden Docker-Daemon
  - Verwendet isoliertes `HOME` / `XDG_CONFIG_HOME` und zerstört anschließend Test-Gateway und Sandbox
- Nützliche Overrides:
  - `OPENCLAW_E2E_OPENSHELL=1`, um den Test zu aktivieren, wenn Sie die breitere E2E-Suite manuell ausführen
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, um auf ein nicht standardmäßiges CLI-Binary oder Wrapper-Skript zu verweisen

### Live (echte Provider + echte Modelle)

- Befehl: `pnpm test:live`
- Konfiguration: `vitest.live.config.ts`
- Dateien: `src/**/*.live.test.ts`
- Standard: per `pnpm test:live` **aktiviert** (setzt `OPENCLAW_LIVE_TEST=1`)
- Umfang:
  - „Funktioniert dieser Provider/dieses Modell _heute_ tatsächlich mit echten Zugangsdaten?“
  - Erkennt Änderungen am Provider-Format, Eigenheiten bei Tool-Aufrufen, Authentifizierungsprobleme und Rate-Limit-Verhalten
- Erwartungen:
  - Absichtlich nicht CI-stabil (echte Netzwerke, echte Provider-Richtlinien, Quoten, Ausfälle)
  - Kostet Geld / verbraucht Rate Limits
  - Führen Sie bevorzugt eingegrenzte Teilmengen statt „alles“ aus
- Live-Läufe sourcen `~/.profile`, um fehlende API-Schlüssel zu übernehmen.
- Standardmäßig isolieren Live-Läufe weiterhin `HOME` und kopieren Konfigurations-/Authentifizierungsmaterial in ein temporäres Test-Home, damit Unit-Fixtures Ihr echtes `~/.openclaw` nicht verändern können.
- Setzen Sie `OPENCLAW_LIVE_USE_REAL_HOME=1` nur dann, wenn Live-Tests bewusst Ihr echtes Home-Verzeichnis verwenden sollen.
- `pnpm test:live` verwendet jetzt standardmäßig einen ruhigeren Modus: Es behält die Fortschrittsausgabe `[live] ...` bei, unterdrückt aber den zusätzlichen Hinweis zu `~/.profile` und schaltet Gateway-Bootstrap-Logs/Bonjour-Rauschen stumm. Setzen Sie `OPENCLAW_LIVE_TEST_QUIET=0`, wenn Sie wieder vollständige Start-Logs möchten.
- Rotation von API-Schlüsseln (providerspezifisch): Setzen Sie `*_API_KEYS` im Komma-/Semikolon-Format oder `*_API_KEY_1`, `*_API_KEY_2` (zum Beispiel `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) oder je Live-Override `OPENCLAW_LIVE_*_KEY`; Tests versuchen bei Rate-Limit-Antworten erneut.
- Fortschritts-/Heartbeat-Ausgabe:
  - Live-Suiten geben jetzt Fortschrittszeilen auf stderr aus, sodass bei langen Provider-Aufrufen sichtbar bleibt, dass sie aktiv sind, auch wenn die Konsolenerfassung von Vitest ruhig ist.
  - `vitest.live.config.ts` deaktiviert die Konsolenabfangung von Vitest, sodass Fortschrittszeilen von Provider/Gateway bei Live-Läufen sofort gestreamt werden.
  - Passen Sie Heartbeats für direkte Modelle mit `OPENCLAW_LIVE_HEARTBEAT_MS` an.
  - Passen Sie Heartbeats für Gateway/Probes mit `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` an.

## Welche Suite sollte ich ausführen?

Verwenden Sie diese Entscheidungstabelle:

- Logik/Tests bearbeiten: `pnpm test` ausführen (und `pnpm test:coverage`, wenn Sie viel geändert haben)
- Gateway-Netzwerk / WS-Protokoll / Pairing berühren: zusätzlich `pnpm test:e2e` ausführen
- Debugging von „mein Bot ist ausgefallen“ / providerspezifischen Fehlern / Tool-Aufrufen: ein eingegrenztes `pnpm test:live` ausführen

## Live: Android-Node-Fähigkeitssweep

- Test: `src/gateway/android-node.capabilities.live.test.ts`
- Skript: `pnpm android:test:integration`
- Ziel: **jeden aktuell angekündigten Befehl** eines verbundenen Android-Node aufrufen und das Vertragsverhalten des Befehls verifizieren.
- Umfang:
  - Vorgegebene/manuelle Einrichtung (die Suite installiert/startet/pairt die App nicht).
  - Validierung von Gateway-`node.invoke` für den ausgewählten Android-Node Befehl für Befehl.
- Erforderliche Vorbereitung:
  - Android-App bereits mit dem Gateway verbunden und gepairt.
  - App im Vordergrund halten.
  - Berechtigungen/Erfassungseinwilligungen für Fähigkeiten erteilen, von denen Sie erwarten, dass sie erfolgreich sind.
- Optionale Ziel-Overrides:
  - `OPENCLAW_ANDROID_NODE_ID` oder `OPENCLAW_ANDROID_NODE_NAME`.
  - `OPENCLAW_ANDROID_GATEWAY_URL` / `OPENCLAW_ANDROID_GATEWAY_TOKEN` / `OPENCLAW_ANDROID_GATEWAY_PASSWORD`.
- Vollständige Details zur Android-Einrichtung: [Android-App](/de/platforms/android)

## Live: Modell-Smoke (Profilschlüssel)

Live-Tests sind in zwei Ebenen aufgeteilt, damit wir Fehler isolieren können:

- „Direktes Modell“ zeigt uns, ob der Provider/das Modell mit dem angegebenen Schlüssel überhaupt antworten kann.
- „Gateway-Smoke“ zeigt uns, ob die vollständige Gateway+Agent-Pipeline für dieses Modell funktioniert (Sitzungen, Verlauf, Tools, Sandbox-Richtlinien usw.).

### Ebene 1: Direkte Modell-Completion (ohne Gateway)

- Test: `src/agents/models.profiles.live.test.ts`
- Ziel:
  - Erkannte Modelle aufzählen
  - Mit `getApiKeyForModel` Modelle auswählen, für die Sie Zugangsdaten haben
  - Pro Modell eine kleine Completion ausführen (und gezielte Regressionen, falls nötig)
- So aktivieren Sie es:
  - `pnpm test:live` (oder `OPENCLAW_LIVE_TEST=1`, wenn Sie Vitest direkt aufrufen)
- Setzen Sie `OPENCLAW_LIVE_MODELS=modern` (oder `all`, Alias für modern), um diese Suite tatsächlich auszuführen; andernfalls wird sie übersprungen, damit `pnpm test:live` auf Gateway-Smoke fokussiert bleibt
- So wählen Sie Modelle aus:
  - `OPENCLAW_LIVE_MODELS=modern`, um die moderne Allowlist auszuführen (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_MODELS=all` ist ein Alias für die moderne Allowlist
  - oder `OPENCLAW_LIVE_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,..."` (Komma-Allowlist)
  - Moderne/alle Sweeps verwenden standardmäßig eine kuratierte Obergrenze mit hohem Signal; setzen Sie `OPENCLAW_LIVE_MAX_MODELS=0` für einen vollständigen modernen Sweep oder eine positive Zahl für eine kleinere Obergrenze.
- So wählen Sie Provider aus:
  - `OPENCLAW_LIVE_PROVIDERS="google,google-antigravity,google-gemini-cli"` (Komma-Allowlist)
- Woher die Schlüssel kommen:
  - Standardmäßig: Profilspeicher und env-Fallbacks
  - Setzen Sie `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um **nur** den Profilspeicher zu erzwingen
- Warum es das gibt:
  - Trennt „Provider-API ist defekt / Schlüssel ist ungültig“ von „Gateway-Agent-Pipeline ist defekt“
  - Enthält kleine, isolierte Regressionen (Beispiel: OpenAI-Responses/Codex-Responses-Reasoning-Replay- und Tool-Call-Flows)

### Ebene 2: Gateway + Dev-Agent-Smoke (was "@openclaw" tatsächlich macht)

- Test: `src/gateway/gateway-models.profiles.live.test.ts`
- Ziel:
  - Ein In-Process-Gateway starten
  - Eine Sitzung `agent:dev:*` erstellen/patchen (Modell-Override pro Lauf)
  - Modelle mit vorhandenen Schlüsseln durchlaufen und Folgendes verifizieren:
    - „sinnvolle“ Antwort (ohne Tools)
    - ein echter Tool-Aufruf funktioniert (Read-Probe)
    - optionale zusätzliche Tool-Probes (Exec+Read-Probe)
    - OpenAI-Regressionspfade (nur Tool-Call → Follow-up) funktionieren weiterhin
- Details zu den Probes (damit Sie Fehler schnell erklären können):
  - `read`-Probe: Der Test schreibt eine Nonce-Datei in den Workspace und fordert den Agent auf, sie zu `read`en und die Nonce zurückzugeben.
  - `exec+read`-Probe: Der Test fordert den Agent auf, per `exec` eine Nonce in eine temporäre Datei zu schreiben und sie dann per `read` zurückzulesen.
  - Image-Probe: Der Test hängt eine generierte PNG-Datei an (Katze + randomisierter Code) und erwartet, dass das Modell `cat <CODE>` zurückgibt.
  - Implementierungsreferenz: `src/gateway/gateway-models.profiles.live.test.ts` und `src/gateway/live-image-probe.ts`.
- So aktivieren Sie sie:
  - `pnpm test:live` (oder `OPENCLAW_LIVE_TEST=1`, wenn Sie Vitest direkt aufrufen)
- So wählen Sie Modelle aus:
  - Standard: moderne Allowlist (Opus/Sonnet 4.6+, GPT-5.x + Codex, Gemini 3, GLM 4.7, MiniMax M2.7, Grok 4)
  - `OPENCLAW_LIVE_GATEWAY_MODELS=all` ist ein Alias für die moderne Allowlist
  - Oder setzen Sie `OPENCLAW_LIVE_GATEWAY_MODELS="provider/model"` (oder eine kommaseparierte Liste), um einzugrenzen
  - Moderne/alle Gateway-Sweeps verwenden standardmäßig eine kuratierte Obergrenze mit hohem Signal; setzen Sie `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=0` für einen vollständigen modernen Sweep oder eine positive Zahl für eine kleinere Obergrenze.
- So wählen Sie Provider aus (vermeiden Sie „alles über OpenRouter“):
  - `OPENCLAW_LIVE_GATEWAY_PROVIDERS="google,google-antigravity,google-gemini-cli,openai,anthropic,zai,minimax"` (Komma-Allowlist)
- Tool- und Image-Probes sind in diesem Live-Test immer aktiviert:
  - `read`-Probe + `exec+read`-Probe (Tool-Stresstest)
  - Die Image-Probe läuft, wenn das Modell Unterstützung für Bildeingaben ankündigt
  - Ablauf (auf hoher Ebene):
    - Der Test generiert eine kleine PNG-Datei mit „CAT“ + zufälligem Code (`src/gateway/live-image-probe.ts`)
    - Sendet sie über `agent` `attachments: [{ mimeType: "image/png", content: "<base64>" }]`
    - Das Gateway parst Attachments in `images[]` (`src/gateway/server-methods/agent.ts` + `src/gateway/chat-attachments.ts`)
    - Der eingebettete Agent leitet eine multimodale Benutzernachricht an das Modell weiter
    - Verifikation: Die Antwort enthält `cat` + den Code (OCR-Toleranz: kleine Fehler sind zulässig)

Tipp: Um zu sehen, was Sie auf Ihrem Rechner testen können (und die genauen IDs `provider/model`), führen Sie Folgendes aus:

```bash
openclaw models list
openclaw models list --json
```

## Live: CLI-Backend-Smoke (Claude, Codex, Gemini oder andere lokale CLIs)

- Test: `src/gateway/gateway-cli-backend.live.test.ts`
- Ziel: die Gateway- + Agent-Pipeline mit einem lokalen CLI-Backend validieren, ohne Ihre Standardkonfiguration zu verändern.
- Backend-spezifische Smoke-Standards befinden sich in der Definition `cli-backend.ts` der jeweiligen zuständigen Erweiterung.
- Aktivieren:
  - `pnpm test:live` (oder `OPENCLAW_LIVE_TEST=1`, wenn Sie Vitest direkt aufrufen)
  - `OPENCLAW_LIVE_CLI_BACKEND=1`
- Standardwerte:
  - Standard-Provider/-Modell: `claude-cli/claude-sonnet-4-6`
  - Verhalten für Command/Args/Image stammt aus den Metadaten des zuständigen CLI-Backend-Plugins.
- Overrides (optional):
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL="codex-cli/gpt-5.4"`
  - `OPENCLAW_LIVE_CLI_BACKEND_COMMAND="/full/path/to/codex"`
  - `OPENCLAW_LIVE_CLI_BACKEND_ARGS='["exec","--json","--color","never","--sandbox","read-only","--skip-git-repo-check"]'`
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_PROBE=1`, um ein echtes Bild-Attachment zu senden (Pfade werden in den Prompt injiziert).
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_ARG="--image"`, um Bilddateipfade als CLI-Args statt per Prompt-Injektion zu übergeben.
  - `OPENCLAW_LIVE_CLI_BACKEND_IMAGE_MODE="repeat"` (oder `"list"`), um zu steuern, wie Bild-Args übergeben werden, wenn `IMAGE_ARG` gesetzt ist.
  - `OPENCLAW_LIVE_CLI_BACKEND_RESUME_PROBE=1`, um einen zweiten Turn zu senden und den Resume-Ablauf zu validieren.
  - `OPENCLAW_LIVE_CLI_BACKEND_MODEL_SWITCH_PROBE=0`, um die standardmäßige Kontinuitätsprobe Claude Sonnet -> Opus in derselben Sitzung zu deaktivieren (setzen Sie auf `1`, um sie zu erzwingen, wenn das ausgewählte Modell ein Wechselziel unterstützt).

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

- Der Docker-Runner befindet sich unter `scripts/test-live-cli-backend-docker.sh`.
- Er führt den CLI-Backend-Live-Smoke innerhalb des Repo-Docker-Images als nicht-root-Benutzer `node` aus.
- Er ermittelt die CLI-Smoke-Metadaten aus der zuständigen Erweiterung und installiert dann das passende Linux-CLI-Paket (`@anthropic-ai/claude-code`, `@openai/codex` oder `@google/gemini-cli`) in ein zwischengespeichertes beschreibbares Präfix unter `OPENCLAW_DOCKER_CLI_TOOLS_DIR` (Standard: `~/.cache/openclaw/docker-cli-tools`).
- `pnpm test:docker:live-cli-backend:claude-subscription` erfordert portable Claude Code Subscription-OAuth entweder über `~/.claude/.credentials.json` mit `claudeAiOauth.subscriptionType` oder `CLAUDE_CODE_OAUTH_TOKEN` aus `claude setup-token`. Es verifiziert zuerst direkt `claude -p` in Docker und führt dann zwei Gateway-CLI-Backend-Turns aus, ohne Anthropic-API-Key-Umgebungsvariablen beizubehalten. Diese Subscription-Lane deaktiviert standardmäßig Claude-MCP-/Tool- und Image-Probes, weil Claude derzeit die Nutzung durch Drittanbieter-Apps über Extra-Usage-Abrechnung statt über normale Subscription-Plan-Limits abrechnet.
- Der Live-Smoke des CLI-Backends testet jetzt denselben End-to-End-Ablauf für Claude, Codex und Gemini: Text-Turn, Turn zur Bildklassifizierung und anschließend einen MCP-`cron`-Tool-Aufruf, der über die Gateway-CLI verifiziert wird.
- Claudes Standard-Smoke patcht außerdem die Sitzung von Sonnet auf Opus und verifiziert, dass die fortgesetzte Sitzung sich weiterhin an eine frühere Notiz erinnert.

## Live: ACP-Bind-Smoke (`/acp spawn ... --bind here`)

- Test: `src/gateway/gateway-acp-bind.live.test.ts`
- Ziel: den echten ACP-Converstion-Bind-Ablauf mit einem Live-ACP-Agent validieren:
  - `/acp spawn <agent> --bind here` senden
  - eine synthetische Message-Channel-Converstion direkt binden
  - einen normalen Follow-up in derselben Conversation senden
  - verifizieren, dass der Follow-up im Transkript der gebundenen ACP-Sitzung landet
- Aktivieren:
  - `pnpm test:live src/gateway/gateway-acp-bind.live.test.ts`
  - `OPENCLAW_LIVE_ACP_BIND=1`
- Standardwerte:
  - ACP-Agents in Docker: `claude,codex,gemini`
  - ACP-Agent für direktes `pnpm test:live ...`: `claude`
  - Synthetischer Channel: Slack-DM-artiger Conversation-Kontext
  - ACP-Backend: `acpx`
- Overrides:
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=claude`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=codex`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT=gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude,codex,gemini`
  - `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND='npx -y @agentclientprotocol/claude-agent-acp@<version>'`
- Hinweise:
  - Diese Lane verwendet die Gateway-Oberfläche `chat.send` mit admin-only synthetischen Feldern für `originating-route`, damit Tests Message-Channel-Kontext anhängen können, ohne vorzutäuschen, extern zuzustellen.
  - Wenn `OPENCLAW_LIVE_ACP_BIND_AGENT_COMMAND` nicht gesetzt ist, verwendet der Test die integrierte Agent-Registry des eingebetteten `acpx`-Plugins für den ausgewählten ACP-Harness-Agent.

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

- Der Docker-Runner befindet sich unter `scripts/test-live-acp-bind-docker.sh`.
- Standardmäßig führt er den ACP-Bind-Smoke nacheinander gegen alle unterstützten Live-CLI-Agents aus: `claude`, `codex` und dann `gemini`.
- Verwenden Sie `OPENCLAW_LIVE_ACP_BIND_AGENTS=claude`, `OPENCLAW_LIVE_ACP_BIND_AGENTS=codex` oder `OPENCLAW_LIVE_ACP_BIND_AGENTS=gemini`, um die Matrix einzugrenzen.
- Er sourced `~/.profile`, stellt das passende CLI-Authentifizierungsmaterial im Container bereit, installiert `acpx` in ein beschreibbares npm-Präfix und installiert dann, falls nötig, die angeforderte Live-CLI (`@anthropic-ai/claude-code`, `@openai/codex` oder `@google/gemini-cli`).
- Innerhalb von Docker setzt der Runner `OPENCLAW_LIVE_ACP_BIND_ACPX_COMMAND=$HOME/.npm-global/bin/acpx`, damit `acpx` Provider-Umgebungsvariablen aus dem gesourcten Profil für die Child-Harness-CLI verfügbar hält.

## Live: Codex-App-Server-Harness-Smoke

- Ziel: die Plugin-eigene Codex-Harness über die normale Gateway-Methode
  `agent` validieren:
  - das gebündelte Plugin `codex` laden
  - `OPENCLAW_AGENT_RUNTIME=codex` auswählen
  - einen ersten Gateway-Agent-Turn an `codex/gpt-5.4` senden
  - einen zweiten Turn an dieselbe OpenClaw-Sitzung senden und verifizieren, dass der App-Server-Thread fortgesetzt werden kann
  - `/codex status` und `/codex models` über denselben Gateway-Command-Pfad ausführen
- Test: `src/gateway/gateway-codex-harness.live.test.ts`
- Aktivieren: `OPENCLAW_LIVE_CODEX_HARNESS=1`
- Standardmodell: `codex/gpt-5.4`
- Optionale Image-Probe: `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=1`
- Optionale MCP-/Tool-Probe: `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=1`
- Der Smoke setzt `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, damit eine defekte Codex-Harness nicht unbemerkt durch stilles Fallback auf PI bestehen kann.
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

- Der Docker-Runner befindet sich unter `scripts/test-live-codex-harness-docker.sh`.
- Er sourced das eingebundene `~/.profile`, übergibt `OPENAI_API_KEY`, kopiert Codex-CLI-Auth-Dateien, falls vorhanden, installiert `@openai/codex` in ein beschreibbares eingebundenes npm-Präfix, stellt den Quellbaum bereit und führt dann nur den Codex-Harness-Live-Test aus.
- Docker aktiviert standardmäßig die Image- und MCP-/Tool-Probes. Setzen Sie
  `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0` oder
  `OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0`, wenn Sie einen engeren Debug-Lauf benötigen.
- Docker exportiert außerdem `OPENCLAW_AGENT_HARNESS_FALLBACK=none`, passend zur Live-Test-Konfiguration, sodass `openai-codex/*`- oder PI-Fallbacks keine Codex-Harness-Regression verbergen können.

### Empfohlene Live-Rezepte

Schmale, explizite Allowlists sind am schnellsten und am wenigsten fehleranfällig:

- Einzelnes Modell, direkt (ohne Gateway):
  - `OPENCLAW_LIVE_MODELS="openai/gpt-5.4" pnpm test:live src/agents/models.profiles.live.test.ts`

- Einzelnes Modell, Gateway-Smoke:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Tool-Aufrufe über mehrere Provider hinweg:
  - `OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3-flash-preview,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

- Google-Fokus (Gemini-API-Schlüssel + Antigravity):
  - Gemini (API-Schlüssel): `OPENCLAW_LIVE_GATEWAY_MODELS="google/gemini-3-flash-preview" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`
  - Antigravity (OAuth): `OPENCLAW_LIVE_GATEWAY_MODELS="google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-pro-high" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

Hinweise:

- `google/...` verwendet die Gemini-API (API-Schlüssel).
- `google-antigravity/...` verwendet die Antigravity-OAuth-Bridge (Cloud-Code-Assist-artiger Agent-Endpoint).
- `google-gemini-cli/...` verwendet die lokale Gemini-CLI auf Ihrem Rechner (separate Authentifizierung + eigene Tooling-Eigenheiten).
- Gemini-API vs. Gemini-CLI:
  - API: OpenClaw ruft Googles gehostete Gemini-API über HTTP auf (API-Schlüssel / Profil-Authentifizierung); das ist es, was die meisten Benutzer mit „Gemini“ meinen.
  - CLI: OpenClaw ruft ein lokales `gemini`-Binary per Shell auf; es hat seine eigene Authentifizierung und kann sich anders verhalten (Streaming/Tool-Unterstützung/Versionsabweichungen).

## Live: Modellmatrix (was wir abdecken)

Es gibt keine feste „CI-Modellliste“ (Live ist Opt-in), aber dies sind die **empfohlenen** Modelle, die regelmäßig auf einem Entwicklungsrechner mit Schlüsseln abgedeckt werden sollten.

### Modernes Smoke-Set (Tool-Aufrufe + Bild)

Das ist der Lauf für die „üblichen Modelle“, von dem wir erwarten, dass er weiterhin funktioniert:

- OpenAI (nicht Codex): `openai/gpt-5.4` (optional: `openai/gpt-5.4-mini`)
- OpenAI Codex: `openai-codex/gpt-5.4`
- Anthropic: `anthropic/claude-opus-4-6` (oder `anthropic/claude-sonnet-4-6`)
- Google (Gemini-API): `google/gemini-3.1-pro-preview` und `google/gemini-3-flash-preview` (ältere Gemini-2.x-Modelle vermeiden)
- Google (Antigravity): `google-antigravity/claude-opus-4-6-thinking` und `google-antigravity/gemini-3-flash`
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Gateway-Smoke mit Tools + Bild ausführen:
`OPENCLAW_LIVE_GATEWAY_MODELS="openai/gpt-5.4,openai-codex/gpt-5.4,anthropic/claude-opus-4-6,google/gemini-3.1-pro-preview,google/gemini-3-flash-preview,google-antigravity/claude-opus-4-6-thinking,google-antigravity/gemini-3-flash,zai/glm-4.7,minimax/MiniMax-M2.7" pnpm test:live src/gateway/gateway-models.profiles.live.test.ts`

### Basislinie: Tool-Aufrufe (Read + optional Exec)

Wählen Sie mindestens eines pro Provider-Familie:

- OpenAI: `openai/gpt-5.4` (oder `openai/gpt-5.4-mini`)
- Anthropic: `anthropic/claude-opus-4-6` (oder `anthropic/claude-sonnet-4-6`)
- Google: `google/gemini-3-flash-preview` (oder `google/gemini-3.1-pro-preview`)
- Z.AI (GLM): `zai/glm-4.7`
- MiniMax: `minimax/MiniMax-M2.7`

Optionale zusätzliche Abdeckung (nice to have):

- xAI: `xai/grok-4` (oder die neueste verfügbare Version)
- Mistral: `mistral/`… (wählen Sie ein „tools“-fähiges Modell, das Sie aktiviert haben)
- Cerebras: `cerebras/`… (falls Sie Zugriff haben)
- LM Studio: `lmstudio/`… (lokal; Tool-Aufrufe hängen vom API-Modus ab)

### Vision: Bild senden (Anhang → multimodale Nachricht)

Nehmen Sie mindestens ein bildfähiges Modell in `OPENCLAW_LIVE_GATEWAY_MODELS` auf (Claude-/Gemini-/OpenAI-Varianten mit Bildunterstützung usw.), um die Image-Probe auszuführen.

### Aggregatoren / alternative Gateways

Wenn Sie aktivierte Schlüssel haben, unterstützen wir auch Tests über:

- OpenRouter: `openrouter/...` (Hunderte von Modellen; verwenden Sie `openclaw models scan`, um Kandidaten mit Tool- und Bildunterstützung zu finden)
- OpenCode: `opencode/...` für Zen und `opencode-go/...` für Go (Authentifizierung über `OPENCODE_API_KEY` / `OPENCODE_ZEN_API_KEY`)

Weitere Provider, die Sie in die Live-Matrix aufnehmen können (wenn Sie Zugangsdaten/Konfiguration haben):

- Integriert: `openai`, `openai-codex`, `anthropic`, `google`, `google-vertex`, `google-antigravity`, `google-gemini-cli`, `zai`, `openrouter`, `opencode`, `opencode-go`, `xai`, `groq`, `cerebras`, `mistral`, `github-copilot`
- Über `models.providers` (benutzerdefinierte Endpoints): `minimax` (Cloud/API) sowie jeder OpenAI-/Anthropic-kompatible Proxy (LM Studio, vLLM, LiteLLM usw.)

Tipp: Versuchen Sie nicht, „alle Modelle“ in der Dokumentation fest zu codieren. Die maßgebliche Liste ist das, was `discoverModels(...)` auf Ihrem Rechner zurückgibt, plus die verfügbaren Schlüssel.

## Zugangsdaten (niemals committen)

Live-Tests erkennen Zugangsdaten auf dieselbe Weise wie die CLI. Praktische Auswirkungen:

- Wenn die CLI funktioniert, sollten Live-Tests dieselben Schlüssel finden.
- Wenn ein Live-Test „keine Zugangsdaten“ meldet, debuggen Sie das genauso wie `openclaw models list` / Modellauswahl.

- Authentifizierungsprofile pro Agent: `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (das ist es, was in den Live-Tests mit „profile keys“ gemeint ist)
- Konfiguration: `~/.openclaw/openclaw.json` (oder `OPENCLAW_CONFIG_PATH`)
- Legacy-State-Verzeichnis: `~/.openclaw/credentials/` (wird in das bereitgestellte Live-Test-Home kopiert, wenn vorhanden, aber nicht in den Hauptspeicher für Profilschlüssel)
- Lokale Live-Läufe kopieren standardmäßig die aktive Konfiguration, `auth-profiles.json`-Dateien pro Agent, Legacy-`credentials/` und unterstützte externe CLI-Auth-Verzeichnisse in ein temporäres Test-Home; bereitgestellte Live-Homes überspringen `workspace/` und `sandboxes/`, und Pfad-Overrides für `agents.*.workspace` / `agentDir` werden entfernt, damit Probes von Ihrem echten Host-Workspace fernbleiben.

Wenn Sie sich auf env-Schlüssel verlassen möchten (z. B. in Ihrem `~/.profile` exportiert), führen Sie lokale Tests nach `source ~/.profile` aus oder verwenden Sie die Docker-Runner unten (sie können `~/.profile` in den Container einbinden).

## Deepgram live (Audiotranskription)

- Test: `src/media-understanding/providers/deepgram/audio.live.test.ts`
- Aktivieren: `DEEPGRAM_API_KEY=... DEEPGRAM_LIVE_TEST=1 pnpm test:live src/media-understanding/providers/deepgram/audio.live.test.ts`

## BytePlus Coding-Plan live

- Test: `src/agents/byteplus.live.test.ts`
- Aktivieren: `BYTEPLUS_API_KEY=... BYTEPLUS_LIVE_TEST=1 pnpm test:live src/agents/byteplus.live.test.ts`
- Optionales Modell-Override: `BYTEPLUS_CODING_MODEL=ark-code-latest`

## ComfyUI-Workflow-Medien live

- Test: `extensions/comfy/comfy.live.test.ts`
- Aktivieren: `OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts`
- Umfang:
  - Führt die gebündelten Comfy-Pfade für Bild, Video und `music_generate` aus
  - Überspringt jede Fähigkeit, sofern `models.providers.comfy.<capability>` nicht konfiguriert ist
  - Nützlich nach Änderungen an Comfy-Workflow-Übermittlung, Polling, Downloads oder Plugin-Registrierung

## Bildgenerierung live

- Test: `src/image-generation/runtime.live.test.ts`
- Befehl: `pnpm test:live src/image-generation/runtime.live.test.ts`
- Harness: `pnpm test:live:media image`
- Umfang:
  - Zählt jedes registrierte Provider-Plugin für Bildgenerierung auf
  - Lädt fehlende Provider-Umgebungsvariablen vor dem Probing aus Ihrer Login-Shell (`~/.profile`)
  - Verwendet standardmäßig Live-/env-API-Schlüssel vor gespeicherten Authentifizierungsprofilen, damit veraltete Testschlüssel in `auth-profiles.json` echte Shell-Zugangsdaten nicht verdecken
  - Überspringt Provider ohne nutzbare Authentifizierung/Profil/Modell
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
  - `OPENCLAW_LIVE_IMAGE_GENERATION_MODELS="openai/gpt-image-1,google/gemini-3.1-flash-image-preview"`
  - `OPENCLAW_LIVE_IMAGE_GENERATION_CASES="google:flash-generate,google:pro-edit"`
- Optionales Authentifizierungsverhalten:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um Authentifizierung aus dem Profilspeicher zu erzwingen und reine env-Overrides zu ignorieren

## Musikgenerierung live

- Test: `extensions/music-generation-providers.live.test.ts`
- Aktivieren: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media music`
- Umfang:
  - Führt den gemeinsamen gebündelten Provider-Pfad für Musikgenerierung aus
  - Deckt derzeit Google und MiniMax ab
  - Lädt Provider-Umgebungsvariablen vor dem Probing aus Ihrer Login-Shell (`~/.profile`)
  - Verwendet standardmäßig Live-/env-API-Schlüssel vor gespeicherten Authentifizierungsprofilen, damit veraltete Testschlüssel in `auth-profiles.json` echte Shell-Zugangsdaten nicht verdecken
  - Überspringt Provider ohne nutzbare Authentifizierung/Profil/Modell
  - Führt beide deklarierten Runtime-Modi aus, sofern verfügbar:
    - `generate` mit Eingabe nur über Prompt
    - `edit`, wenn der Provider `capabilities.edit.enabled` deklariert
  - Aktuelle Abdeckung der gemeinsamen Lane:
    - `google`: `generate`, `edit`
    - `minimax`: `generate`
    - `comfy`: separate Comfy-Live-Datei, nicht dieser gemeinsame Sweep
- Optionale Eingrenzung:
  - `OPENCLAW_LIVE_MUSIC_GENERATION_PROVIDERS="google,minimax"`
  - `OPENCLAW_LIVE_MUSIC_GENERATION_MODELS="google/lyria-3-clip-preview,minimax/music-2.5+"`
- Optionales Authentifizierungsverhalten:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um Authentifizierung aus dem Profilspeicher zu erzwingen und reine env-Overrides zu ignorieren

## Videogenerierung live

- Test: `extensions/video-generation-providers.live.test.ts`
- Aktivieren: `OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/video-generation-providers.live.test.ts`
- Harness: `pnpm test:live:media video`
- Umfang:
  - Führt den gemeinsamen gebündelten Provider-Pfad für Videogenerierung aus
  - Verwendet standardmäßig den release-sicheren Smoke-Pfad: Provider außer FAL, eine Text-zu-Video-Anfrage pro Provider, ein einsekündiger Lobster-Prompt und eine providerbezogene Obergrenze pro Vorgang aus `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS` (standardmäßig `180000`)
  - Überspringt FAL standardmäßig, weil providerseitige Queue-Latenz die Release-Zeit dominieren kann; übergeben Sie `--video-providers fal` oder `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="fal"`, um es explizit auszuführen
  - Lädt Provider-Umgebungsvariablen vor dem Probing aus Ihrer Login-Shell (`~/.profile`)
  - Verwendet standardmäßig Live-/env-API-Schlüssel vor gespeicherten Authentifizierungsprofilen, damit veraltete Testschlüssel in `auth-profiles.json` echte Shell-Zugangsdaten nicht verdecken
  - Überspringt Provider ohne nutzbare Authentifizierung/Profil/Modell
  - Führt standardmäßig nur `generate` aus
  - Setzen Sie `OPENCLAW_LIVE_VIDEO_GENERATION_FULL_MODES=1`, um zusätzlich deklarierte Transform-Modi auszuführen, sofern verfügbar:
    - `imageToVideo`, wenn der Provider `capabilities.imageToVideo.enabled` deklariert und der ausgewählte Provider/das Modell buffer-gestützte lokale Bildeingaben im gemeinsamen Sweep akzeptiert
    - `videoToVideo`, wenn der Provider `capabilities.videoToVideo.enabled` deklariert und der ausgewählte Provider/das Modell buffer-gestützte lokale Videoeingaben im gemeinsamen Sweep akzeptiert
  - Aktuell deklarierte, aber im gemeinsamen Sweep übersprungene `imageToVideo`-Provider:
    - `vydra`, weil das gebündelte `veo3` nur Text unterstützt und das gebündelte `kling` eine Remote-Bild-URL erfordert
  - Providerspezifische Vydra-Abdeckung:
    - `OPENCLAW_LIVE_TEST=1 OPENCLAW_LIVE_VYDRA_VIDEO=1 pnpm test:live -- extensions/vydra/vydra.live.test.ts`
    - diese Datei führt `veo3` Text-zu-Video sowie standardmäßig eine `kling`-Lane aus, die eine Fixture mit Remote-Bild-URL verwendet
  - Aktuelle `videoToVideo`-Live-Abdeckung:
    - nur `runway`, wenn das ausgewählte Modell `runway/gen4_aleph` ist
  - Aktuell deklarierte, aber im gemeinsamen Sweep übersprungene `videoToVideo`-Provider:
    - `alibaba`, `qwen`, `xai`, weil diese Pfade derzeit Referenz-URLs mit Remote-`http(s)` / MP4 erfordern
    - `google`, weil die aktuelle gemeinsame Gemini-/Veo-Lane lokale buffer-gestützte Eingaben verwendet und dieser Pfad im gemeinsamen Sweep nicht akzeptiert wird
    - `openai`, weil der aktuellen gemeinsamen Lane Garantien für organisationsspezifischen Zugriff auf Video-Inpaint/Remix fehlen
- Optionale Eingrenzung:
  - `OPENCLAW_LIVE_VIDEO_GENERATION_PROVIDERS="google,openai,runway"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_MODELS="google/veo-3.1-fast-generate-preview,openai/sora-2,runway/gen4_aleph"`
  - `OPENCLAW_LIVE_VIDEO_GENERATION_SKIP_PROVIDERS=""`, um jeden Provider in den Standard-Sweep aufzunehmen, einschließlich FAL
  - `OPENCLAW_LIVE_VIDEO_GENERATION_TIMEOUT_MS=60000`, um die providerbezogene Vorgangsobergrenze für einen aggressiven Smoke-Lauf zu verkleinern
- Optionales Authentifizierungsverhalten:
  - `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um Authentifizierung aus dem Profilspeicher zu erzwingen und reine env-Overrides zu ignorieren

## Medien-Live-Harness

- Befehl: `pnpm test:live:media`
- Zweck:
  - Führt die gemeinsamen Live-Suiten für Bild, Musik und Video über einen repo-nativen Entry-Point aus
  - Lädt fehlende Provider-Umgebungsvariablen automatisch aus `~/.profile`
  - Grenzt jede Suite standardmäßig automatisch auf Provider ein, die derzeit nutzbare Authentifizierung haben
  - Verwendet `scripts/test-live.mjs` wieder, sodass Heartbeat- und Quiet-Mode-Verhalten konsistent bleiben
- Beispiele:
  - `pnpm test:live:media`
  - `pnpm test:live:media image video --providers openai,google,minimax`
  - `pnpm test:live:media video --video-providers openai,runway --all-providers`
  - `pnpm test:live:media music --quiet`

## Docker-Runner (optionale „funktioniert unter Linux“-Prüfungen)

Diese Docker-Runner sind in zwei Gruppen unterteilt:

- Live-Modell-Runner: `test:docker:live-models` und `test:docker:live-gateway` führen nur ihre jeweils passende Live-Datei mit Profilschlüsseln innerhalb des Repo-Docker-Images aus (`src/agents/models.profiles.live.test.ts` und `src/gateway/gateway-models.profiles.live.test.ts`), wobei Ihr lokales Konfigurationsverzeichnis und Ihr Workspace eingebunden werden (und `~/.profile` gesourced wird, falls eingebunden). Die passenden lokalen Entry-Points sind `test:live:models-profiles` und `test:live:gateway-profiles`.
- Docker-Live-Runner verwenden standardmäßig eine kleinere Smoke-Obergrenze, damit ein vollständiger Docker-Sweep praktikabel bleibt:
  `test:docker:live-models` verwendet standardmäßig `OPENCLAW_LIVE_MAX_MODELS=12`, und
  `test:docker:live-gateway` verwendet standardmäßig `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` und
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Überschreiben Sie diese env-Variablen, wenn Sie ausdrücklich den größeren vollständigen Scan möchten.
- `test:docker:all` baut das Live-Docker-Image einmal über `test:docker:live-build` und verwendet es dann für die beiden Docker-Lanes für Live-Tests wieder.
- Container-Smoke-Runner: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:gateway-network`, `test:docker:mcp-channels` und `test:docker:plugins` starten einen oder mehrere echte Container und verifizieren Integrationspfade auf höherer Ebene.

Die Docker-Runner für Live-Modelle binden außerdem nur die benötigten CLI-Auth-Homes ein (oder alle unterstützten, wenn der Lauf nicht eingegrenzt ist) und kopieren sie dann vor dem Lauf in das Home im Container, damit OAuth für externe CLI-Tools Tokens aktualisieren kann, ohne den Auth-Speicher des Hosts zu verändern:

- Direkte Modelle: `pnpm test:docker:live-models` (Skript: `scripts/test-live-models-docker.sh`)
- ACP-Bind-Smoke: `pnpm test:docker:live-acp-bind` (Skript: `scripts/test-live-acp-bind-docker.sh`)
- CLI-Backend-Smoke: `pnpm test:docker:live-cli-backend` (Skript: `scripts/test-live-cli-backend-docker.sh`)
- Codex-App-Server-Harness-Smoke: `pnpm test:docker:live-codex-harness` (Skript: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + Dev-Agent: `pnpm test:docker:live-gateway` (Skript: `scripts/test-live-gateway-models-docker.sh`)
- Open-WebUI-Live-Smoke: `pnpm test:docker:openwebui` (Skript: `scripts/e2e/openwebui-docker.sh`)
- Onboarding-Assistent (TTY, vollständiges Scaffolding): `pnpm test:docker:onboard` (Skript: `scripts/e2e/onboard-docker.sh`)
- Gateway-Netzwerk (zwei Container, WS-Auth + Health): `pnpm test:docker:gateway-network` (Skript: `scripts/e2e/gateway-network-docker.sh`)
- MCP-Channel-Bridge (vorbefülltes Gateway + stdio-Bridge + roher Claude-Benachrichtigungs-Frame-Smoke): `pnpm test:docker:mcp-channels` (Skript: `scripts/e2e/mcp-channels-docker.sh`)
- Plugins (Installations-Smoke + Alias `/plugin` + Neustartsemantik des Claude-Bundles): `pnpm test:docker:plugins` (Skript: `scripts/e2e/plugins-docker.sh`)

Die Docker-Runner für Live-Modelle binden außerdem den aktuellen Checkout schreibgeschützt ein und stellen ihn in ein temporäres Arbeitsverzeichnis im Container bereit. Dadurch bleibt das Runtime-Image schlank, während Vitest weiterhin gegen Ihren exakten lokalen Quellcode und Ihre Konfiguration ausgeführt wird.
Der Bereitstellungsschritt überspringt große nur lokal vorhandene Caches und Build-Ausgaben von Apps wie
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` und app-lokale `.build`- oder
Gradle-Ausgabeverzeichnisse, damit Docker-Live-Läufe nicht minutenlang
rechnerspezifische Artefakte kopieren.
Sie setzen außerdem `OPENCLAW_SKIP_CHANNELS=1`, damit Gateway-Live-Probes im
Container keine echten Channel-Worker für Telegram/Discord usw. starten.
`test:docker:live-models` führt weiterhin `pnpm test:live` aus; reichen Sie daher
auch `OPENCLAW_LIVE_GATEWAY_*` durch, wenn Sie Gateway-Live-Abdeckung in dieser Docker-Lane
eingrenzen oder ausschließen möchten.
`test:docker:openwebui` ist ein Kompatibilitäts-Smoke auf höherer Ebene: Es startet einen
OpenClaw-Gateway-Container mit aktivierten OpenAI-kompatiblen HTTP-Endpoints,
startet einen festgelegten Open-WebUI-Container gegen dieses Gateway, meldet sich
über Open WebUI an, verifiziert, dass `/api/models` `openclaw/default` bereitstellt, und sendet dann
eine echte Chat-Anfrage über den Proxy `/api/chat/completions` von Open WebUI.
Der erste Lauf kann deutlich langsamer sein, weil Docker möglicherweise zuerst das
Open-WebUI-Image ziehen muss und Open WebUI möglicherweise seinen eigenen Kaltstart
abschließen muss.
Diese Lane erwartet einen nutzbaren Live-Modellschlüssel, und `OPENCLAW_PROFILE_FILE`
(`~/.profile` standardmäßig) ist die primäre Methode, ihn in Docker-Läufen bereitzustellen.
Erfolgreiche Läufe geben ein kleines JSON-Payload wie `{ "ok": true, "model":
"openclaw/default", ... }` aus.
`test:docker:mcp-channels` ist bewusst deterministisch und benötigt kein
echtes Telegram-, Discord- oder iMessage-Konto. Es startet ein vorbefülltes Gateway
im Container, startet einen zweiten Container, der `openclaw mcp serve` startet, und
verifiziert dann geroutete Conversation-Erkennung, Transkript-Lesevorgänge, Attachment-Metadaten,
Verhalten der Live-Event-Queue, Outbound-Send-Routing sowie Claude-artige Channel- und
Berechtigungsbenachrichtigungen über die echte stdio-MCP-Bridge. Die Benachrichtigungsprüfung
untersucht die rohen stdio-MCP-Frames direkt, sodass der Smoke das validiert, was die
Bridge tatsächlich emittiert, nicht nur das, was ein bestimmtes Client-SDK zufällig sichtbar macht.

Manueller ACP-Thread-Smoke in natürlicher Sprache (nicht CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Behalten Sie dieses Skript für Regressionen und Debug-Workflows. Es könnte für die Validierung des ACP-Thread-Routings erneut benötigt werden, also nicht löschen.

Nützliche env-Variablen:

- `OPENCLAW_CONFIG_DIR=...` (Standard: `~/.openclaw`), eingebunden nach `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (Standard: `~/.openclaw/workspace`), eingebunden nach `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (Standard: `~/.profile`), eingebunden nach `/home/node/.profile` und vor dem Ausführen der Tests gesourced
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, um nur env-Variablen zu verifizieren, die aus `OPENCLAW_PROFILE_FILE` gesourced wurden, unter Verwendung temporärer Konfigurations-/Workspace-Verzeichnisse und ohne Einbindungen externer CLI-Authentifizierung
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (Standard: `~/.cache/openclaw/docker-cli-tools`), eingebunden nach `/home/node/.npm-global` für zwischengespeicherte CLI-Installationen in Docker
- Externe CLI-Auth-Verzeichnisse/-Dateien unter `$HOME` werden schreibgeschützt unter `/host-auth...` eingebunden und dann vor dem Start der Tests nach `/home/node/...` kopiert
  - Standardverzeichnisse: `.minimax`
  - Standarddateien: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Eingegrenzte Provider-Läufe binden nur die benötigten Verzeichnisse/Dateien ein, die aus `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` abgeleitet werden
  - Manuelles Override mit `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` oder einer Komma-Liste wie `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, um den Lauf einzugrenzen
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, um Provider im Container zu filtern
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, um ein vorhandenes Image `openclaw:local-live` für erneute Läufe wiederzuverwenden, die keinen Neubau benötigen
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um sicherzustellen, dass Zugangsdaten aus dem Profilspeicher stammen (nicht aus env)
- `OPENCLAW_OPENWEBUI_MODEL=...`, um das Modell auszuwählen, das das Gateway für den Open-WebUI-Smoke bereitstellt
- `OPENCLAW_OPENWEBUI_PROMPT=...`, um den für den Open-WebUI-Smoke verwendeten Prompt zur Nonce-Prüfung zu überschreiben
- `OPENWEBUI_IMAGE=...`, um den festgelegten Tag des Open-WebUI-Images zu überschreiben

## Dokumentations-Sanity

Führen Sie nach Änderungen an der Dokumentation die Docs-Prüfungen aus: `pnpm check:docs`.
Führen Sie die vollständige Mintlify-Validierung von Anchors aus, wenn Sie zusätzlich Prüfungen für Überschriften innerhalb der Seite benötigen: `pnpm docs:check-links:anchors`.

## Offline-Regression (CI-sicher)

Das sind Regressionen der „echten Pipeline“ ohne echte Provider:

- Gateway-Tool-Aufrufe (gemocktes OpenAI, echtes Gateway + Agent-Schleife): `src/gateway/gateway.test.ts` (Fall: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway-Assistent (WS `wizard.start`/`wizard.next`, schreibt Konfiguration + erzwungene Authentifizierung): `src/gateway/gateway.test.ts` (Fall: "runs wizard over ws and writes auth token config")

## Evaluierungen der Agent-Zuverlässigkeit (Skills)

Wir haben bereits einige CI-sichere Tests, die sich wie „Evaluierungen der Agent-Zuverlässigkeit“ verhalten:

- Gemockte Tool-Aufrufe über die echte Gateway- + Agent-Schleife (`src/gateway/gateway.test.ts`).
- End-to-End-Abläufe des Assistenten, die Session-Verdrahtung und Konfigurationseffekte validieren (`src/gateway/gateway.test.ts`).

Was für Skills noch fehlt (siehe [Skills](/de/tools/skills)):

- **Entscheidungsfindung:** Wenn Skills im Prompt aufgelistet sind, wählt der Agent den richtigen Skill aus (oder vermeidet irrelevante)?
- **Compliance:** Liest der Agent `SKILL.md` vor der Verwendung und befolgt er die erforderlichen Schritte/Argumente?
- **Workflow-Verträge:** Mehrturn-Szenarien, die Tool-Reihenfolge, Übernahme des Sitzungsverlaufs und Sandbox-Grenzen verifizieren.

Zukünftige Evaluierungen sollten zunächst deterministisch bleiben:

- Ein Szenario-Runner mit gemockten Providern, um Tool-Aufrufe + Reihenfolge, das Lesen von Skill-Dateien und Session-Verdrahtung zu verifizieren.
- Eine kleine Suite skill-fokussierter Szenarien (verwenden vs. vermeiden, Gating, Prompt-Injection).
- Optionale Live-Evaluierungen (Opt-in, per env gesteuert) erst, nachdem die CI-sichere Suite vorhanden ist.

## Vertragstests (Plugin- und Channel-Form)

Vertragstests verifizieren, dass jedes registrierte Plugin und jeder Channel seinem
Schnittstellenvertrag entspricht. Sie iterieren über alle erkannten Plugins und führen eine Suite aus
Form- und Verhaltensverifikationen aus. Die standardmäßige Unit-Lane `pnpm test`
überspringt diese gemeinsamen Seam- und Smoke-Dateien absichtlich; führen Sie die
Vertragsbefehle explizit aus, wenn Sie gemeinsame Channel- oder Provider-Oberflächen ändern.

### Befehle

- Alle Verträge: `pnpm test:contracts`
- Nur Channel-Verträge: `pnpm test:contracts:channels`
- Nur Provider-Verträge: `pnpm test:contracts:plugins`

### Channel-Verträge

Zu finden unter `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Grundlegende Plugin-Form (ID, Name, Fähigkeiten)
- **setup** - Vertrag des Setup-Assistenten
- **session-binding** - Verhalten beim Session-Binding
- **outbound-payload** - Struktur des Message-Payloads
- **inbound** - Verarbeitung eingehender Nachrichten
- **actions** - Channel-Action-Handler
- **threading** - Behandlung von Thread-IDs
- **directory** - Verzeichnis-/Roster-API
- **group-policy** - Durchsetzung von Gruppenrichtlinien

### Provider-Statusverträge

Zu finden unter `src/plugins/contracts/*.contract.test.ts`.

- **status** - Channel-Status-Probes
- **registry** - Form der Plugin-Registry

### Provider-Verträge

Zu finden unter `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Vertrag des Auth-Flows
- **auth-choice** - Auth-Auswahl/Auswahlmechanismus
- **catalog** - API des Modellkatalogs
- **discovery** - Plugin-Erkennung
- **loader** - Laden von Plugins
- **runtime** - Provider-Runtime
- **shape** - Plugin-Form/Schnittstelle
- **wizard** - Setup-Assistent

### Wann ausführen

- Nach Änderungen an `plugin-sdk`-Exports oder Subpfaden
- Nach dem Hinzufügen oder Ändern eines Channel- oder Provider-Plugins
- Nach Refactorings der Plugin-Registrierung oder -Erkennung

Vertragstests laufen in CI und erfordern keine echten API-Schlüssel.

## Regressionen hinzufügen (Leitlinien)

Wenn Sie ein in Live entdecktes Provider-/Modellproblem beheben:

- Fügen Sie nach Möglichkeit eine CI-sichere Regression hinzu (Mock/Stub-Provider oder Erfassen der exakten Transformation der Request-Form)
- Wenn es inhärent nur live testbar ist (Rate Limits, Authentifizierungsrichtlinien), halten Sie den Live-Test schmal und per env-Variablen opt-in
- Zielen Sie bevorzugt auf die kleinste Ebene, die den Fehler erkennt:
  - Fehler bei Provider-Request-Konvertierung/Replay → Test für direkte Modelle
  - Fehler in Gateway-Session-/Verlauf-/Tool-Pipeline → Gateway-Live-Smoke oder CI-sicherer Gateway-Mock-Test
- Guardrail für SecretRef-Traversal:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` leitet pro SecretRef-Klasse aus Registry-Metadaten (`listSecretTargetRegistryEntries()`) ein Beispielziel ab und verifiziert dann, dass Exec-IDs für Traversal-Segmente abgewiesen werden.
  - Wenn Sie in `src/secrets/target-registry-data.ts` eine neue SecretRef-Zielfamilie mit `includeInPlan` hinzufügen, aktualisieren Sie `classifyTargetClass` in diesem Test. Der Test schlägt absichtlich bei nicht klassifizierten Ziel-IDs fehl, damit neue Klassen nicht stillschweigend übersprungen werden.
