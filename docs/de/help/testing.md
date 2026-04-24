---
read_when:
    - Tests lokal oder in CI ausführen
    - Regressionstests für Modell-/Provider-Fehler hinzufügen
    - Gateway- und Agent-Verhalten debuggen
summary: 'Test-Kit: Unit-/E2E-/Live-Suiten, Docker-Runner und was jeder Test abdeckt'
title: Tests
x-i18n:
    generated_at: "2026-04-24T08:57:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6c88325e0edb49437e7faa2eaf730eb3be59054d8c4bb86e56a42bc39a29a2b1
    source_path: help/testing.md
    workflow: 15
---

OpenClaw hat drei Vitest-Suiten (Unit/Integration, E2E, Live) und eine kleine Anzahl
von Docker-Runnern. Dieses Dokument ist ein Leitfaden dazu, **wie wir testen**:

- Was jede Suite abdeckt (und was sie bewusst _nicht_ abdeckt).
- Welche Befehle Sie für gängige Workflows ausführen sollten (lokal, vor dem Push, Debugging).
- Wie Live-Tests Credentials erkennen und Modelle/Provider auswählen.
- Wie man Regressionstests für reale Modell-/Provider-Probleme hinzufügt.

## Schnellstart

An den meisten Tagen:

- Vollständiges Gate (vor dem Push erwartet): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Schnellere lokale Ausführung der vollständigen Suite auf einem leistungsfähigen Rechner: `pnpm test:max`
- Direkte Vitest-Watch-Schleife: `pnpm test:watch`
- Direktes Targeting von Dateien leitet jetzt auch Erweiterungs-/Kanalpfade weiter: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Bevorzugen Sie zunächst gezielte Läufe, wenn Sie an einem einzelnen Fehler arbeiten.
- Docker-gestützte QA-Site: `pnpm qa:lab:up`
- Linux-VM-gestützte QA-Lane: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Wenn Sie Tests anfassen oder zusätzliche Sicherheit möchten:

- Coverage-Gate: `pnpm test:coverage`
- E2E-Suite: `pnpm test:e2e`

Beim Debuggen echter Provider/Modelle (erfordert echte Credentials):

- Live-Suite (Modelle + Gateway-Tool-/Image-Probes): `pnpm test:live`
- Eine einzelne Live-Datei gezielt und leise ausführen: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker-Live-Modell-Sweep: `pnpm test:docker:live-models`
  - Jedes ausgewählte Modell führt jetzt einen Text-Turn plus eine kleine Datei-Lesen-artige Probe aus.
    Modelle, deren Metadaten `image`-Eingaben ausweisen, führen außerdem einen kleinen Bild-Turn aus.
    Deaktivieren Sie die zusätzlichen Probes mit `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` oder
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`, wenn Sie Provider-Fehler isolieren.
  - CI-Abdeckung: Das tägliche `OpenClaw Scheduled Live And E2E Checks` und die manuelle
    `OpenClaw Release Checks` rufen beide den wiederverwendbaren Live-/E2E-Workflow mit
    `include_live_suites: true` auf, was separate Docker-Live-Modell-Matrix-Jobs
    beinhaltet, die nach Provider geshardet sind.
  - Für gezielte CI-Neustarts dispatchen Sie `OpenClaw Live And E2E Checks (Reusable)`
    mit `include_live_suites: true` und `live_models_only: true`.
  - Fügen Sie neue hochsignifikante Provider-Secrets zu `scripts/ci-hydrate-live-auth.sh`
    sowie `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` und dessen
    geplanten/Release-Aufrufern hinzu.
- Native Codex-bound-chat-Smoke: `pnpm test:docker:live-codex-bind`
  - Führt eine Docker-Live-Lane gegen den Codex-App-Server-Pfad aus, bindet eine synthetische
    Slack-DM mit `/codex bind`, testet `/codex fast` und
    `/codex permissions` und verifiziert dann, dass eine normale Antwort und ein Bildanhang
    über die native Plugin-Bindung statt über ACP geleitet werden.
- Moonshot/Kimi-Kosten-Smoke: Setzen Sie `MOONSHOT_API_KEY`, führen Sie dann
  `openclaw models list --provider moonshot --json` aus und anschließend ein isoliertes
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  gegen `moonshot/kimi-k2.6`. Verifizieren Sie, dass das JSON Moonshot/K2.6 meldet und das
  Assistant-Transkript normalisierte `usage.cost` speichert.

Tipp: Wenn Sie nur einen einzelnen fehlschlagenden Fall benötigen, bevorzugen Sie das Eingrenzen von Live-Tests über die unten beschriebenen Allowlist-Umgebungsvariablen.

## QA-spezifische Runner

Diese Befehle stehen neben den Haupttestsuiten bereit, wenn Sie den Realismus von QA-Lab benötigen:

CI führt QA Lab in dedizierten Workflows aus. `Parity gate` läuft auf passenden PRs und
bei manueller Ausführung mit Mock-Providern. `QA-Lab - All Lanes` läuft nächtlich auf
`main` und bei manueller Ausführung mit dem Mock-Parity-Gate, einer Live-Matrix-Lane und einer
Convex-verwalteten Live-Telegram-Lane als parallele Jobs. `OpenClaw Release Checks`
führt dieselben Lanes vor der Freigabe eines Releases aus.

- `pnpm openclaw qa suite`
  - Führt repo-gestützte QA-Szenarien direkt auf dem Host aus.
  - Führt mehrere ausgewählte Szenarien standardmäßig parallel mit isolierten
    Gateway-Workern aus. `qa-channel` verwendet standardmäßig Concurrency 4 (begrenzt durch die
    Anzahl der ausgewählten Szenarien). Verwenden Sie `--concurrency <count>`, um die Anzahl
    der Worker anzupassen, oder `--concurrency 1` für die ältere serielle Lane.
  - Beendet sich mit einem Fehlercode ungleich null, wenn irgendein Szenario fehlschlägt. Verwenden Sie `--allow-failures`, wenn Sie
    Artefakte ohne fehlschlagenden Exit-Code möchten.
  - Unterstützt die Provider-Modi `live-frontier`, `mock-openai` und `aimock`.
    `aimock` startet einen lokalen AIMock-gestützten Provider-Server für experimentelle
    Fixture- und Protokoll-Mock-Abdeckung, ohne die szenariobewusste
    `mock-openai`-Lane zu ersetzen.
- `pnpm openclaw qa suite --runner multipass`
  - Führt dieselbe QA-Suite in einer flüchtigen Multipass-Linux-VM aus.
  - Behält dasselbe Szenario-Auswahlverhalten wie `qa suite` auf dem Host bei.
  - Verwendet dieselben Provider-/Modell-Auswahlflags wie `qa suite`.
  - Live-Läufe leiten die unterstützten QA-Authentifizierungsinputs weiter, die für den Gast praktikabel sind:
    env-basierte Provider-Keys, den QA-Live-Provider-Konfigurationspfad und `CODEX_HOME`, falls vorhanden.
  - Ausgabe-Verzeichnisse müssen unter dem Repo-Root bleiben, damit der Gast über den
    gemounteten Workspace zurückschreiben kann.
  - Schreibt den normalen QA-Bericht + die Zusammenfassung sowie Multipass-Logs unter
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Startet die Docker-gestützte QA-Site für operatorähnliche QA-Arbeit.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Baut ein npm-Tarball aus dem aktuellen Checkout, installiert es global in
    Docker, führt ein nicht-interaktives Onboarding mit OpenAI-API-Key durch, konfiguriert standardmäßig
    Telegram, verifiziert, dass das Aktivieren des Plugins Laufzeitabhängigkeiten bei Bedarf installiert,
    führt `doctor` aus und führt einen lokalen Agent-Turn gegen einen gemockten OpenAI-Endpunkt aus.
  - Verwenden Sie `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, um dieselbe Lane für paketierte Installation
    mit Discord auszuführen.
- `pnpm test:docker:npm-telegram-live`
  - Installiert ein veröffentlichtes OpenClaw-Paket in Docker, führt das Onboarding des installierten Pakets aus,
    konfiguriert Telegram über die installierte CLI und verwendet dann erneut die
    Live-Telegram-QA-Lane mit diesem installierten Paket als Gateway des SUT.
  - Standardmäßig wird `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` verwendet.
  - Verwendet dieselben Telegram-env-Credentials oder dieselbe Convex-Credential-Quelle wie
    `pnpm openclaw qa telegram`. Für CI-/Release-Automatisierung setzen Sie
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` plus
    `OPENCLAW_QA_CONVEX_SITE_URL` und das Role-Secret. Falls
    `OPENCLAW_QA_CONVEX_SITE_URL` und ein Convex-Role-Secret in CI vorhanden sind,
    wählt der Docker-Wrapper Convex automatisch aus.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` überschreibt die gemeinsame
    `OPENCLAW_QA_CREDENTIAL_ROLE` nur für diese Lane.
  - GitHub Actions stellt diese Lane als manuellen Maintainer-Workflow
    `NPM Telegram Beta E2E` bereit. Sie läuft nicht bei Merges. Der Workflow verwendet die
    Umgebung `qa-live-shared` und Convex-CI-Credential-Leases.
- `pnpm test:docker:bundled-channel-deps`
  - Packt und installiert den aktuellen OpenClaw-Build in Docker, startet das Gateway
    mit konfiguriertem OpenAI und aktiviert dann gebündelte Kanal-/Plugins per Konfigurationsänderungen.
  - Verifiziert, dass die Setup-Erkennung nicht konfigurierte Plugin-Laufzeitabhängigkeiten
    nicht installiert lässt, dass der erste konfigurierte Gateway- oder Doctor-Lauf die Laufzeitabhängigkeiten
    jedes gebündelten Plugins bei Bedarf installiert und dass ein zweiter Neustart bereits aktivierte
    Abhängigkeiten nicht erneut installiert.
  - Installiert außerdem eine bekannte ältere npm-Baseline, aktiviert Telegram vor dem Ausführen von
    `openclaw update --tag <candidate>` und verifiziert, dass der Doctor des Kandidaten nach dem Update
    die Laufzeitabhängigkeiten gebündelter Kanäle ohne harness-seitige Postinstall-Reparatur korrigiert.
- `pnpm openclaw qa aimock`
  - Startet nur den lokalen AIMock-Provider-Server für direktes Protokoll-Smoke-Testing.
- `pnpm openclaw qa matrix`
  - Führt die Matrix-Live-QA-Lane gegen einen flüchtigen Docker-gestützten Tuwunel-Homeserver aus.
  - Dieser QA-Host ist heute nur für Repo/Entwicklung vorgesehen. Paketierte OpenClaw-Installationen liefern
    `qa-lab` nicht aus und stellen daher `openclaw qa` nicht bereit.
  - Repo-Checkouts laden den gebündelten Runner direkt; kein separater Plugin-Installationsschritt
    ist erforderlich.
  - Stellt drei temporäre Matrix-Nutzer (`driver`, `sut`, `observer`) plus einen privaten Raum bereit
    und startet dann einen QA-Gateway-Child mit dem echten Matrix-Plugin als SUT-Transport.
  - Verwendet standardmäßig das fest gepinnte stabile Tuwunel-Image `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Überschreiben Sie es mit `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`, wenn Sie ein anderes Image testen müssen.
  - Matrix stellt keine gemeinsamen Credential-Source-Flags bereit, da die Lane lokal flüchtige Nutzer bereitstellt.
  - Schreibt einen Matrix-QA-Bericht, eine Zusammenfassung, ein Observed-Events-Artefakt und ein kombiniertes stdout/stderr-Ausgabelog unter `.artifacts/qa-e2e/...`.
- `pnpm openclaw qa telegram`
  - Führt die Telegram-Live-QA-Lane gegen eine echte private Gruppe mit den Driver- und SUT-Bot-Tokens aus der Umgebung aus.
  - Erfordert `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` und `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Die Gruppen-ID muss die numerische Telegram-Chat-ID sein.
  - Unterstützt `--credential-source convex` für gemeinsam genutzte gepoolte Credentials. Verwenden Sie standardmäßig den env-Modus oder setzen Sie `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, um gepoolte Leases zu verwenden.
  - Beendet sich mit einem Fehlercode ungleich null, wenn irgendein Szenario fehlschlägt. Verwenden Sie `--allow-failures`, wenn Sie
    Artefakte ohne fehlschlagenden Exit-Code möchten.
  - Erfordert zwei unterschiedliche Bots in derselben privaten Gruppe, wobei der SUT-Bot einen Telegram-Benutzernamen bereitstellen muss.
  - Für stabile Bot-zu-Bot-Beobachtung aktivieren Sie den Bot-to-Bot Communication Mode in `@BotFather` für beide Bots und stellen Sie sicher, dass der Driver-Bot Bot-Verkehr in der Gruppe beobachten kann.
  - Schreibt einen Telegram-QA-Bericht, eine Zusammenfassung und ein Observed-Messages-Artefakt unter `.artifacts/qa-e2e/...`. Antwortszenarien enthalten die RTT von der Sendeanfrage des Drivers bis zur beobachteten Antwort des SUT.

Live-Transport-Lanes teilen einen einheitlichen Standardvertrag, damit neue Transporte nicht auseinanderdriften:

`qa-channel` bleibt die breite synthetische QA-Suite und ist nicht Teil der Live-Transport-Abdeckungsmatrix.

| Lane     | Canary | Mention-Gating | Allowlist-Block | Antwort auf oberster Ebene | Fortsetzen nach Neustart | Thread-Follow-up | Thread-Isolation | Reaktionsbeobachtung | Help-Befehl |
| -------- | ------ | -------------- | --------------- | -------------------------- | ------------------------ | ---------------- | ---------------- | -------------------- | ------------ |
| Matrix   | x      | x              | x               | x                          | x                        | x                | x                | x                    |              |
| Telegram | x      |                |                 |                            |                          |                  |                  |                      | x            |

### Gemeinsame Telegram-Credentials über Convex (v1)

Wenn `--credential-source convex` (oder `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) für
`openclaw qa telegram` aktiviert ist, erwirbt QA Lab ein exklusives Lease aus einem Convex-gestützten Pool,
sendet Heartbeat-Signale für dieses Lease, während die Lane läuft, und gibt das Lease beim Herunterfahren frei.

Referenz-Gerüst für ein Convex-Projekt:

- `qa/convex-credential-broker/`

Erforderliche Umgebungsvariablen:

- `OPENCLAW_QA_CONVEX_SITE_URL` (zum Beispiel `https://your-deployment.convex.site`)
- Ein Secret für die ausgewählte Rolle:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` für `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` für `ci`
- Auswahl der Credential-Rolle:
  - CLI: `--credential-role maintainer|ci`
  - env-Standard: `OPENCLAW_QA_CREDENTIAL_ROLE` (standardmäßig `ci` in CI, sonst `maintainer`)

Optionale Umgebungsvariablen:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (Standard `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (Standard `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (Standard `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (Standard `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (Standard `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (optionale Trace-ID)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` erlaubt loopback-`http://`-Convex-URLs nur für lokale Entwicklung.

`OPENCLAW_QA_CONVEX_SITE_URL` sollte im Normalbetrieb `https://` verwenden.

Maintainer-Admin-Befehle (Pool hinzufügen/entfernen/listen) erfordern
explizit `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI-Helfer für Maintainer:

```bash
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Verwenden Sie `--json` für maschinenlesbare Ausgabe in Skripten und CI-Hilfsprogrammen.

Standard-Endpunktvertrag (`OPENCLAW_QA_CONVEX_SITE_URL` + `/qa-credentials/v1`):

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
  - Schutz für aktives Lease: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (nur mit Maintainer-Secret)
  - Anfrage: `{ kind?, status?, includePayload?, limit? }`
  - Erfolg: `{ status: "ok", credentials, count }`

Payload-Format für die Art Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` muss eine numerische Telegram-Chat-ID als String sein.
- `admin/add` validiert dieses Format für `kind: "telegram"` und lehnt fehlerhafte Payloads ab.

### Einen Kanal zu QA hinzufügen

Das Hinzufügen eines Kanals zum Markdown-QA-System erfordert genau zwei Dinge:

1. Einen Transport-Adapter für den Kanal.
2. Ein Szenario-Pack, das den Kanalvertrag testet.

Fügen Sie keinen neuen Top-Level-QA-Befehlsstamm hinzu, wenn der gemeinsame `qa-lab`-Host
den Ablauf übernehmen kann.

`qa-lab` ist für die gemeinsamen Host-Mechanismen zuständig:

- den Befehlsstamm `openclaw qa`
- Starten und Herunterfahren der Suite
- Worker-Concurrency
- Schreiben von Artefakten
- Berichtserstellung
- Ausführen von Szenarien
- Kompatibilitätsaliasse für ältere `qa-channel`-Szenarien

Runner-Plugins sind für den Transportvertrag zuständig:

- wie `openclaw qa <runner>` unter dem gemeinsamen `qa`-Stamm eingehängt wird
- wie das Gateway für diesen Transport konfiguriert wird
- wie Bereitschaft geprüft wird
- wie eingehende Ereignisse eingespeist werden
- wie ausgehende Nachrichten beobachtet werden
- wie Transkripte und normalisierter Transportstatus bereitgestellt werden
- wie transportgestützte Aktionen ausgeführt werden
- wie transportspezifisches Zurücksetzen oder Aufräumen gehandhabt wird

Die Mindestanforderung für die Aufnahme eines neuen Kanals ist:

1. Behalten Sie `qa-lab` als Besitzer des gemeinsamen `qa`-Stamms bei.
2. Implementieren Sie den Transport-Runner auf der gemeinsamen `qa-lab`-Host-Seam.
3. Behalten Sie transportspezifische Mechanismen innerhalb des Runner-Plugins oder Channel-Harnesses.
4. Hängen Sie den Runner als `openclaw qa <runner>` ein, statt einen konkurrierenden Root-Befehl zu registrieren.
   Runner-Plugins sollten `qaRunners` in `openclaw.plugin.json` deklarieren und ein passendes `qaRunnerCliRegistrations`-Array aus `runtime-api.ts` exportieren.
   Halten Sie `runtime-api.ts` schlank; lazy CLI- und Runner-Ausführung sollten hinter separaten Entry-Points bleiben.
5. Verfassen oder passen Sie Markdown-Szenarien unter den thematischen Verzeichnissen `qa/scenarios/` an.
6. Verwenden Sie die generischen Szenario-Helfer für neue Szenarien.
7. Halten Sie bestehende Kompatibilitätsaliasse funktionsfähig, sofern das Repo keine beabsichtigte Migration durchführt.

Die Entscheidungsregel ist strikt:

- Wenn Verhalten einmalig in `qa-lab` ausgedrückt werden kann, platzieren Sie es in `qa-lab`.
- Wenn Verhalten von einem Kanaltransport abhängt, belassen Sie es in diesem Runner-Plugin oder Plugin-Harness.
- Wenn ein Szenario eine neue Fähigkeit benötigt, die mehr als ein Kanal verwenden kann, fügen Sie einen generischen Helfer hinzu statt eines kanalspezifischen Zweigs in `suite.ts`.
- Wenn ein Verhalten nur für einen Transport sinnvoll ist, halten Sie das Szenario transportspezifisch und machen Sie das im Szenariovertrag ausdrücklich.

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

Kompatibilitätsaliasse bleiben für bestehende Szenarien verfügbar, darunter:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

Neue Kanalarbeit sollte die generischen Helfernamen verwenden.
Kompatibilitätsaliasse existieren, um eine Flag-Day-Migration zu vermeiden, nicht als Modell für
neue Szenario-Erstellung.

## Testsuiten (was wo läuft)

Betrachten Sie die Suiten als „zunehmenden Realismus“ (und zunehmende Flakiness/Kosten):

### Unit / Integration (Standard)

- Befehl: `pnpm test`
- Konfiguration: Nicht zielgerichtete Läufe verwenden den Shard-Satz `vitest.full-*.config.ts` und können Multi-Projekt-Shards für parallele Planung in pro-Projekt-Konfigurationen aufteilen
- Dateien: Core-/Unit-Inventare unter `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` und die per Allowlist freigegebenen `ui`-Node-Tests, die von `vitest.unit.config.ts` abgedeckt werden
- Umfang:
  - Reine Unit-Tests
  - In-Process-Integrationstests (Gateway-Authentifizierung, Routing, Tooling, Parsing, Konfiguration)
  - Deterministische Regressionen für bekannte Fehler
- Erwartungen:
  - Läuft in CI
  - Keine echten Keys erforderlich
  - Sollte schnell und stabil sein
    <AccordionGroup>
    <Accordion title="Projekte, Shards und bereichsbezogene Lanes"> - Nicht zielgerichtete `pnpm test`-Läufe verwenden zwölf kleinere Shard-Konfigurationen (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) statt eines riesigen nativen Root-Projekt-Prozesses. Das senkt die Spitzen-RSS auf belasteten Rechnern und verhindert, dass Auto-Reply-/Erweiterungsarbeit nicht zusammenhängende Suiten ausbremst. - `pnpm test --watch` verwendet weiterhin den nativen Root-`vitest.config.ts`-Projektgraphen, weil eine Multi-Shard-Watch-Schleife nicht praktikabel ist. - `pnpm test`, `pnpm test:watch` und `pnpm test:perf:imports` leiten explizite Datei-/Verzeichnisziele zuerst über bereichsbezogene Lanes, sodass `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` nicht den Startup-Overhead des vollständigen Root-Projekts zahlen muss. - `pnpm test:changed` erweitert geänderte Git-Pfade zu denselben bereichsbezogenen Lanes, wenn das Diff nur routbare Quell-/Testdateien berührt; Änderungen an Konfiguration/Setup fallen weiterhin auf den breiten erneuten Lauf des Root-Projekts zurück. - `pnpm check:changed` ist das normale intelligente lokale Gate für eng begrenzte Arbeit. Es klassifiziert das Diff in Core, Core-Tests, Erweiterungen, Erweiterungstests, Apps, Dokumentation, Release-Metadaten und Tooling und führt dann die passenden Typecheck-/Lint-/Test-Lanes aus. Öffentliche Plugin-SDK- und Plugin-Contract-Änderungen enthalten einen Erweiterungs-Validierungsdurchlauf, weil Erweiterungen von diesen Core-Verträgen abhängen. Versionsanhebungen nur in Release-Metadaten führen gezielte Versions-/Konfigurations-/Root-Abhängigkeitsprüfungen statt der vollständigen Suite aus, mit einer Schutzprüfung, die Paketänderungen außerhalb des Top-Level-Versionsfelds ablehnt. - Import-leichte Unit-Tests aus Agents, Commands, Plugins, Auto-Reply-Helfern, `plugin-sdk` und ähnlichen rein utilitären Bereichen laufen über die Lane `unit-fast`, die `test/setup-openclaw-runtime.ts` überspringt; zustandsbehaftete/laufzeitschwere Dateien bleiben auf den bestehenden Lanes. - Ausgewählte Hilfsquellendateien aus `plugin-sdk` und `commands` mappen Läufe im Changed-Modus ebenfalls auf explizite benachbarte Tests in diesen leichten Lanes, damit Hilfsänderungen nicht die vollständige schwere Suite für dieses Verzeichnis erneut ausführen. - `auto-reply` hat drei dedizierte Bereiche: Core-Helfer auf oberster Ebene, Integrationstests `reply.*` auf oberster Ebene und den Teilbaum `src/auto-reply/reply/**`. So bleibt die schwerste Reply-Harness-Arbeit von den günstigen Status-/Chunk-/Token-Tests getrennt.
    </Accordion>

      <Accordion title="Coverage des eingebetteten Runners">
        - Wenn Sie Eingaben für die Discovery von Message-Tools oder den Laufzeitkontext von Compaction ändern, halten Sie beide Coverage-Ebenen aufrecht.
        - Fügen Sie fokussierte Regressionsprüfungen für reine Routing- und Normalisierungsgrenzen hinzu.
        - Halten Sie die integrierten Embedded-Runner-Integrationssuiten gesund:
          `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
          `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` und
          `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
        - Diese Suiten verifizieren, dass bereichsbezogene IDs und Compaction-Verhalten weiterhin durch die echten Pfade `run.ts` / `compact.ts` fließen; reine Hilfstests sind kein ausreichender Ersatz für diese Integrationspfade.
      </Accordion>

      <Accordion title="Vitest-Pool- und Isolationsstandards">
        - Die Basis-Vitest-Konfiguration verwendet standardmäßig `threads`.
        - Die gemeinsame Vitest-Konfiguration fixiert `isolate: false` und verwendet den
          nicht isolierten Runner über die Root-Projekte sowie E2E- und Live-Konfigurationen hinweg.
        - Die Root-UI-Lane behält ihr `jsdom`-Setup und ihren Optimizer bei, läuft jedoch ebenfalls auf dem
          gemeinsamen nicht isolierten Runner.
        - Jeder `pnpm test`-Shard übernimmt dieselben Standardwerte `threads` + `isolate: false` aus der gemeinsamen Vitest-Konfiguration.
        - `scripts/run-vitest.mjs` fügt standardmäßig `--no-maglev` für Vitest-Child-Node-Prozesse hinzu, um den V8-Kompilierungs-Overhead bei großen lokalen Läufen zu reduzieren.
          Setzen Sie `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, um das Verhalten mit Standard-V8 zu vergleichen.
      </Accordion>

      <Accordion title="Schnelle lokale Iteration">
        - `pnpm changed:lanes` zeigt, welche architektonischen Lanes ein Diff auslöst.
        - Der Pre-Commit-Hook ist nur für Formatierung zuständig. Er staged formatierte Dateien erneut und
          führt weder Lint, Typecheck noch Tests aus.
        - Führen Sie `pnpm check:changed` explizit vor Übergabe oder Push aus, wenn Sie
          das intelligente lokale Gate benötigen. Öffentliche Plugin-SDK- und Plugin-Contract-
          Änderungen enthalten einen Erweiterungs-Validierungsdurchlauf.
        - `pnpm test:changed` leitet über bereichsbezogene Lanes, wenn die geänderten Pfade
          sauber auf eine kleinere Suite abgebildet werden können.
        - `pnpm test:max` und `pnpm test:changed:max` behalten dasselbe Routing-
          Verhalten bei, nur mit einer höheren Worker-Obergrenze.
        - Die automatische Skalierung lokaler Worker ist bewusst konservativ und fährt zurück,
          wenn die Last auf dem Host bereits hoch ist, sodass mehrere gleichzeitige
          Vitest-Läufe standardmäßig weniger Schaden anrichten.
        - Die Basis-Vitest-Konfiguration markiert die Projekte/Konfigurationsdateien als
          `forceRerunTriggers`, damit Reruns im Changed-Modus korrekt bleiben, wenn sich die Testverdrahtung ändert.
        - Die Konfiguration hält `OPENCLAW_VITEST_FS_MODULE_CACHE` auf unterstützten
          Hosts aktiviert; setzen Sie `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, wenn Sie
          einen expliziten Cache-Speicherort für direktes Profiling möchten.
      </Accordion>

      <Accordion title="Performance-Debugging">
        - `pnpm test:perf:imports` aktiviert die Importdauer-Berichterstattung von Vitest plus
          Ausgabe zur Import-Aufschlüsselung.
        - `pnpm test:perf:imports:changed` begrenzt dieselbe Profiling-Ansicht auf
          Dateien, die seit `origin/main` geändert wurden.
        - Wenn ein einzelner Hot-Test weiterhin den Großteil seiner Zeit für Start-Importe aufwendet,
          halten Sie schwere Abhängigkeiten hinter einer schmalen lokalen `*.runtime.ts`-Seam und
          mocken Sie diese Seam direkt, statt Runtime-Helfer tief zu importieren, nur um sie
          durch `vi.mock(...)` weiterzureichen.
        - `pnpm test:perf:changed:bench -- --ref <git-ref>` vergleicht geroutetes
          `test:changed` mit dem nativen Root-Projekt-Pfad für dieses commitete Diff
          und gibt Wall-Time plus macOS-Max-RSS aus.
        - `pnpm test:perf:changed:bench -- --worktree` benchmarkt den aktuellen
          Dirty-Tree, indem die Liste geänderter Dateien durch
          `scripts/test-projects.mjs` und die Root-Vitest-Konfiguration geroutet wird.
        - `pnpm test:perf:profile:main` schreibt ein CPU-Profil des Main-Threads für
          Vitest/Vite-Startup- und Transform-Overhead.
        - `pnpm test:perf:profile:runner` schreibt CPU- und Heap-Profile des Runners für die
          Unit-Suite mit deaktivierter Datei-Parallelität.
      </Accordion>
    </AccordionGroup>

### Stabilität (Gateway)

- Befehl: `pnpm test:stability:gateway`
- Konfiguration: `vitest.gateway.config.ts`, auf einen Worker festgelegt
- Umfang:
  - Startet ein echtes loopback-Gateway mit standardmäßig aktivierter Diagnose
  - Leitet synthetische Gateway-Nachrichten-, Speicher- und große Payload-Lasten über den diagnostischen Ereignispfad
  - Fragt `diagnostics.stability` über Gateway-WS-RPC ab
  - Deckt Persistenzhelfer für das Diagnose-Stabilitäts-Bundle ab
  - Stellt sicher, dass der Recorder begrenzt bleibt, synthetische RSS-Samples unter dem Druckbudget bleiben und Queue-Tiefen pro Session wieder auf null zurücklaufen
- Erwartungen:
  - CI-sicher und ohne Keys
  - Schmale Lane für das Nachverfolgen von Stabilitätsregressionen, kein Ersatz für die vollständige Gateway-Suite

### E2E (Gateway-Smoke)

- Befehl: `pnpm test:e2e`
- Konfiguration: `vitest.e2e.config.ts`
- Dateien: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` und E2E-Tests gebündelter Plugins unter `extensions/`
- Laufzeitstandards:
  - Verwendet Vitest-`threads` mit `isolate: false`, passend zum Rest des Repos.
  - Verwendet adaptive Worker (CI: bis zu 2, lokal: standardmäßig 1).
  - Läuft standardmäßig im Silent-Modus, um den Console-I/O-Overhead zu verringern.
- Nützliche Überschreibungen:
  - `OPENCLAW_E2E_WORKERS=<n>`, um die Worker-Anzahl zu erzwingen (maximal 16).
  - `OPENCLAW_E2E_VERBOSE=1`, um ausführliche Console-Ausgabe wieder zu aktivieren.
- Umfang:
  - End-to-End-Verhalten mehrerer Gateway-Instanzen
  - WebSocket-/HTTP-Oberflächen, Node-Pairing und schwereres Networking
- Erwartungen:
  - Läuft in CI (wenn in der Pipeline aktiviert)
  - Keine echten Keys erforderlich
  - Mehr bewegliche Teile als Unit-Tests (kann langsamer sein)

### E2E: OpenShell-Backend-Smoke

- Befehl: `pnpm test:e2e:openshell`
- Datei: `extensions/openshell/src/backend.e2e.test.ts`
- Umfang:
  - Startet ein isoliertes OpenShell-Gateway auf dem Host via Docker
  - Erstellt eine Sandbox aus einem temporären lokalen Dockerfile
  - Testet OpenClaws OpenShell-Backend über echtes `sandbox ssh-config` + SSH-Exec
  - Verifiziert Remote-Canonical-Dateisystemverhalten über die Sandbox-fs-Bridge
- Erwartungen:
  - Nur Opt-in; nicht Teil des standardmäßigen Laufs `pnpm test:e2e`
  - Erfordert eine lokale `openshell`-CLI plus einen funktionierenden Docker-Daemon
  - Verwendet isoliertes `HOME` / `XDG_CONFIG_HOME` und zerstört anschließend das Test-Gateway und die Sandbox
- Nützliche Überschreibungen:
  - `OPENCLAW_E2E_OPENSHELL=1`, um den Test zu aktivieren, wenn die breitere E2E-Suite manuell ausgeführt wird
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, um auf eine nicht standardmäßige CLI-Binärdatei oder ein Wrapper-Skript zu verweisen

### Live (echte Provider + echte Modelle)

- Befehl: `pnpm test:live`
- Konfiguration: `vitest.live.config.ts`
- Dateien: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` und Live-Tests gebündelter Plugins unter `extensions/`
- Standard: **aktiviert** durch `pnpm test:live` (setzt `OPENCLAW_LIVE_TEST=1`)
- Umfang:
  - „Funktioniert dieser Provider/dieses Modell _heute_ tatsächlich mit echten Credentials?“
  - Erkennt Provider-Formatänderungen, Tool-Calling-Eigenheiten, Auth-Probleme und Rate-Limit-Verhalten
- Erwartungen:
  - Absichtlich nicht CI-stabil (echte Netzwerke, echte Provider-Richtlinien, Quotas, Ausfälle)
  - Kostet Geld / nutzt Rate Limits
  - Bevorzugt eingegrenzte Teilmengen statt „alles“
- Live-Läufe sourcen `~/.profile`, um fehlende API-Keys aufzunehmen.
- Standardmäßig isolieren Live-Läufe weiterhin `HOME` und kopieren Konfigurations-/Auth-Material in ein temporäres Test-Home, damit Unit-Fixtures Ihr echtes `~/.openclaw` nicht verändern können.
- Setzen Sie `OPENCLAW_LIVE_USE_REAL_HOME=1` nur dann, wenn Live-Tests absichtlich Ihr echtes Home-Verzeichnis verwenden sollen.
- `pnpm test:live` verwendet jetzt standardmäßig einen leiseren Modus: Die Fortschrittsausgabe `[live] ...` bleibt erhalten, unterdrückt aber den zusätzlichen Hinweis zu `~/.profile` und schaltet Gateway-Bootstrap-Logs/Bonjour-Chat aus. Setzen Sie `OPENCLAW_LIVE_TEST_QUIET=0`, wenn Sie die vollständigen Startup-Logs wieder sehen möchten.
- API-Key-Rotation (providerspezifisch): Setzen Sie `*_API_KEYS` im Komma-/Semikolon-Format oder `*_API_KEY_1`, `*_API_KEY_2` (zum Beispiel `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) oder pro-Live-Override via `OPENCLAW_LIVE_*_KEY`; Tests versuchen bei Rate-Limit-Antworten erneut.
- Fortschritts-/Heartbeat-Ausgabe:
  - Live-Suiten geben jetzt Fortschrittszeilen auf stderr aus, sodass lange Provider-Aufrufe sichtbar aktiv bleiben, auch wenn die Console-Erfassung von Vitest leise ist.
  - `vitest.live.config.ts` deaktiviert die Console-Abfangung von Vitest, damit Fortschrittszeilen von Provider/Gateway bei Live-Läufen sofort gestreamt werden.
  - Passen Sie Heartbeats für direkte Modelle mit `OPENCLAW_LIVE_HEARTBEAT_MS` an.
  - Passen Sie Heartbeats für Gateway/Probes mit `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` an.

## Welche Suite sollte ich ausführen?

Verwenden Sie diese Entscheidungstabelle:

- Logik/Tests bearbeiten: `pnpm test` ausführen (und `pnpm test:coverage`, wenn Sie viel geändert haben)
- Gateway-Networking / WS-Protokoll / Pairing berühren: zusätzlich `pnpm test:e2e`
- „Mein Bot ist down“ / providerspezifische Fehler / Tool Calling debuggen: ein eingegrenztes `pnpm test:live` ausführen

## Live-Tests (mit Netzwerkzugriff)

Für die Live-Modell-Matrix, CLI-Backend-Smokes, ACP-Smokes, den Codex-App-Server-
Harness und alle Live-Tests für Medien-Provider (Deepgram, BytePlus, ComfyUI, Bild,
Musik, Video, Medien-Harness) — sowie Credential-Handling für Live-Läufe — siehe
[Testing — Live-Suiten](/de/help/testing-live).

## Docker-Runner (optionale „funktioniert unter Linux“-Prüfungen)

Diese Docker-Runner teilen sich in zwei Gruppen:

- Live-Modell-Runner: `test:docker:live-models` und `test:docker:live-gateway` führen nur ihre passende Live-Datei mit Profil-Key innerhalb des Repo-Docker-Images aus (`src/agents/models.profiles.live.test.ts` und `src/gateway/gateway-models.profiles.live.test.ts`), wobei Ihr lokales Konfigurationsverzeichnis und Ihr Workspace gemountet werden (und `~/.profile` gesourct wird, falls gemountet). Die passenden lokalen Entry-Points sind `test:live:models-profiles` und `test:live:gateway-profiles`.
- Docker-Live-Runner verwenden standardmäßig ein kleineres Smoke-Limit, damit ein vollständiger Docker-Sweep praktikabel bleibt:
  `test:docker:live-models` verwendet standardmäßig `OPENCLAW_LIVE_MAX_MODELS=12`, und
  `test:docker:live-gateway` verwendet standardmäßig `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` und
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Überschreiben Sie diese env vars, wenn Sie
  ausdrücklich einen größeren vollständigen Scan möchten.
- `test:docker:all` baut das Live-Docker-Image einmal über `test:docker:live-build`, verwendet es dann erneut für die beiden Live-Docker-Lanes. Es baut außerdem ein gemeinsames Image `scripts/e2e/Dockerfile` über `test:docker:e2e-build` und verwendet dieses erneut für die E2E-Container-Smoke-Runner, die die gebaute App testen.
- Container-Smoke-Runner: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:gateway-network`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` und `test:docker:config-reload` starten einen oder mehrere echte Container und verifizieren Integrationspfade auf höherer Ebene.

Die Docker-Runner für Live-Modelle binden außerdem nur die benötigten CLI-Auth-Homes ein (oder alle unterstützten, wenn der Lauf nicht eingegrenzt ist) und kopieren sie vor dem Lauf in das Container-Home, damit OAuth externer CLIs Tokens aktualisieren kann, ohne den Auth-Speicher des Hosts zu verändern:

- Direkte Modelle: `pnpm test:docker:live-models` (Skript: `scripts/test-live-models-docker.sh`)
- ACP-Bind-Smoke: `pnpm test:docker:live-acp-bind` (Skript: `scripts/test-live-acp-bind-docker.sh`)
- CLI-Backend-Smoke: `pnpm test:docker:live-cli-backend` (Skript: `scripts/test-live-cli-backend-docker.sh`)
- Codex-App-Server-Harness-Smoke: `pnpm test:docker:live-codex-harness` (Skript: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + Dev-Agent: `pnpm test:docker:live-gateway` (Skript: `scripts/test-live-gateway-models-docker.sh`)
- Open WebUI Live-Smoke: `pnpm test:docker:openwebui` (Skript: `scripts/e2e/openwebui-docker.sh`)
- Onboarding-Assistent (TTY, vollständiges Scaffolding): `pnpm test:docker:onboard` (Skript: `scripts/e2e/onboard-docker.sh`)
- Npm-Tarball-Onboarding/Kanal/Agent-Smoke: `pnpm test:docker:npm-onboard-channel-agent` installiert das gepackte OpenClaw-Tarball global in Docker, konfiguriert OpenAI standardmäßig per env-ref-Onboarding plus Telegram, verifiziert, dass `doctor` aktivierte Plugin-Laufzeitabhängigkeiten repariert, und führt einen gemockten OpenAI-Agent-Turn aus. Verwenden Sie ein vorab gebautes Tarball erneut mit `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, überspringen Sie den Host-Rebuild mit `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` oder wechseln Sie den Kanal mit `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Bun-Global-Install-Smoke: `bash scripts/e2e/bun-global-install-smoke.sh` packt den aktuellen Tree, installiert ihn mit `bun install -g` in einem isolierten Home und verifiziert, dass `openclaw infer image providers --json` gebündelte Bild-Provider zurückgibt, statt zu hängen. Verwenden Sie ein vorab gebautes Tarball erneut mit `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, überspringen Sie den Host-Build mit `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` oder kopieren Sie `dist/` aus einem gebauten Docker-Image mit `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Installer-Docker-Smoke: `bash scripts/test-install-sh-docker.sh` teilt einen npm-Cache zwischen seinen Root-, Update- und Direct-npm-Containern. Update-Smoke verwendet standardmäßig npm `latest` als stabile Baseline, bevor auf das Kandidaten-Tarball aktualisiert wird. Installer-Prüfungen ohne Root behalten einen isolierten npm-Cache, damit Root-eigene Cache-Einträge das benutzerlokale Installationsverhalten nicht verdecken. Setzen Sie `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, um den Root-/Update-/Direct-npm-Cache über lokale Reruns hinweg wiederzuverwenden.
- Install-Smoke-CI überspringt das doppelte direkte globale npm-Update mit `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; führen Sie das Skript lokal ohne diese env aus, wenn direkte `npm install -g`-Abdeckung benötigt wird.
- Gateway-Networking (zwei Container, WS-Auth + Health): `pnpm test:docker:gateway-network` (Skript: `scripts/e2e/gateway-network-docker.sh`)
- Minimale Reasoning-Regression für OpenAI Responses `web_search`: `pnpm test:docker:openai-web-search-minimal` (Skript: `scripts/e2e/openai-web-search-minimal-docker.sh`) führt einen gemockten OpenAI-Server durch das Gateway, verifiziert, dass `web_search` `reasoning.effort` von `minimal` auf `low` anhebt, erzwingt dann eine Ablehnung durch das Provider-Schema und prüft, dass das rohe Detail in den Gateway-Logs erscheint.
- MCP-Kanal-Bridge (Seeded Gateway + stdio-Bridge + rohe Claude-Benachrichtigungsframe-Smoke): `pnpm test:docker:mcp-channels` (Skript: `scripts/e2e/mcp-channels-docker.sh`)
- Pi-Bundle-MCP-Tools (echter stdio-MCP-Server + eingebettete Pi-Profil-Allow/Deny-Smoke): `pnpm test:docker:pi-bundle-mcp-tools` (Skript: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cron-/Subagent-MCP-Bereinigung (echtes Gateway + Beenden eines stdio-MCP-Childs nach isolierten Cron- und einmaligen Subagent-Läufen): `pnpm test:docker:cron-mcp-cleanup` (Skript: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (Install-Smoke + Alias `/plugin` + Claude-Bundle-Neustart-Semantik): `pnpm test:docker:plugins` (Skript: `scripts/e2e/plugins-docker.sh`)
- Plugin-Update-Unchanged-Smoke: `pnpm test:docker:plugin-update` (Skript: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Konfigurations-Reload-Metadaten-Smoke: `pnpm test:docker:config-reload` (Skript: `scripts/e2e/config-reload-source-docker.sh`)
- Laufzeitabhängigkeiten gebündelter Plugins: `pnpm test:docker:bundled-channel-deps` baut standardmäßig ein kleines Docker-Runner-Image, baut und packt OpenClaw einmal auf dem Host und mountet dieses Tarball dann in jedes Linux-Installationsszenario. Verwenden Sie das Image erneut mit `OPENCLAW_SKIP_DOCKER_BUILD=1`, überspringen Sie den Host-Rebuild nach einem frischen lokalen Build mit `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` oder verweisen Sie mit `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz` auf ein vorhandenes Tarball.
- Grenzen Sie Laufzeitabhängigkeiten gebündelter Plugins während der Iteration ein, indem Sie nicht relevante Szenarien deaktivieren, zum Beispiel:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Um das gemeinsame Built-App-Image manuell vorzubauen und wiederzuverwenden:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Suite-spezifische Image-Overrides wie `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` haben weiterhin Vorrang, wenn sie gesetzt sind. Wenn `OPENCLAW_SKIP_DOCKER_BUILD=1` auf ein entferntes gemeinsam genutztes Image verweist, ziehen die Skripte es, falls es noch nicht lokal vorhanden ist. Die Docker-Tests für QR und Installer behalten ihre eigenen Dockerfiles, weil sie Paket-/Installationsverhalten statt der gemeinsamen Built-App-Laufzeit validieren.

Die Docker-Runner für Live-Modelle binden außerdem den aktuellen Checkout schreibgeschützt ein und
stagen ihn in ein temporäres Workdir innerhalb des Containers. Dadurch bleibt das Runtime-
Image schlank und Vitest läuft dennoch gegen genau Ihre lokale Source/Config.
Der Staging-Schritt überspringt große nur lokale Caches und App-Build-Ausgaben wie
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` und app-lokale `.build`- oder
Gradle-Ausgabeverzeichnisse, damit Docker-Live-Läufe nicht minutenlang
maschinenspezifische Artefakte kopieren.
Sie setzen außerdem `OPENCLAW_SKIP_CHANNELS=1`, damit Gateway-Live-Probes keine
echten Telegram-/Discord-/usw.-Kanal-Worker innerhalb des Containers starten.
`test:docker:live-models` führt weiterhin `pnpm test:live` aus, geben Sie also
auch `OPENCLAW_LIVE_GATEWAY_*` durch, wenn Sie die Gateway-
Live-Abdeckung aus dieser Docker-Lane eingrenzen oder ausschließen möchten.
`test:docker:openwebui` ist ein Kompatibilitäts-Smoke auf höherer Ebene: Es startet einen
OpenClaw-Gateway-Container mit aktivierten OpenAI-kompatiblen HTTP-Endpunkten,
startet einen gepinnten Open-WebUI-Container gegen dieses Gateway, meldet sich über
Open WebUI an, verifiziert, dass `/api/models` `openclaw/default` bereitstellt, und sendet dann eine
echte Chat-Anfrage über den Proxy `/api/chat/completions` von Open WebUI.
Der erste Lauf kann deutlich langsamer sein, weil Docker möglicherweise erst das
Open-WebUI-Image ziehen muss und Open WebUI möglicherweise sein eigenes Cold-Start-Setup abschließen muss.
Diese Lane erwartet einen verwendbaren Live-Modell-Key, und `OPENCLAW_PROFILE_FILE`
(standardmäßig `~/.profile`) ist der primäre Weg, ihn in Docker-Läufen bereitzustellen.
Erfolgreiche Läufe geben eine kleine JSON-Payload wie `{ "ok": true, "model":
"openclaw/default", ... }` aus.
`test:docker:mcp-channels` ist bewusst deterministisch und benötigt kein
echtes Telegram-, Discord- oder iMessage-Konto. Es startet einen Seeded-Gateway-
Container, startet einen zweiten Container, der `openclaw mcp serve` startet, und
verifiziert dann geroutete Conversation-Discovery, Transcript-Lesevorgänge, Anhang-Metadaten,
das Verhalten der Live-Ereignis-Queue, Routing ausgehender Sendungen und Claude-artige Kanal- +
Berechtigungsbenachrichtigungen über die echte stdio-MCP-Bridge. Die Benachrichtigungsprüfung
prüft die rohen stdio-MCP-Frames direkt, sodass der Smoke validiert, was die
Bridge tatsächlich ausgibt, nicht nur das, was ein bestimmtes Client-SDK zufällig sichtbar macht.
`test:docker:pi-bundle-mcp-tools` ist deterministisch und benötigt keinen Live-
Modell-Key. Es baut das Repo-Docker-Image, startet einen echten stdio-MCP-Probe-Server
innerhalb des Containers, materialisiert diesen Server über die eingebettete Pi-Bundle-
MCP-Laufzeit, führt das Tool aus und verifiziert dann, dass `coding` und `messaging`
`bundle-mcp`-Tools beibehalten, während `minimal` und `tools.deny: ["bundle-mcp"]` sie herausfiltern.
`test:docker:cron-mcp-cleanup` ist deterministisch und benötigt keinen Live-Modell-
Key. Es startet ein Seeded Gateway mit einem echten stdio-MCP-Probe-Server, führt einen
isolierten Cron-Turn und einen einmaligen Child-Turn von `/subagents spawn` aus und verifiziert dann,
dass der MCP-Child-Prozess nach jedem Lauf beendet wird.

Manueller ACP-Plain-Language-Thread-Smoke (nicht CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Behalten Sie dieses Skript für Regressions-/Debug-Workflows. Es könnte erneut für die ACP-Thread-Routing-Validierung benötigt werden, also nicht löschen.

Nützliche env vars:

- `OPENCLAW_CONFIG_DIR=...` (Standard: `~/.openclaw`) gemountet nach `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (Standard: `~/.openclaw/workspace`) gemountet nach `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (Standard: `~/.profile`) gemountet nach `/home/node/.profile` und vor dem Ausführen der Tests gesourct
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, um nur aus `OPENCLAW_PROFILE_FILE` gesourcte env vars zu verifizieren, mit temporären Config-/Workspace-Verzeichnissen und ohne externe CLI-Auth-Mounts
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (Standard: `~/.cache/openclaw/docker-cli-tools`) gemountet nach `/home/node/.npm-global` für zwischengespeicherte CLI-Installationen innerhalb von Docker
- Externe CLI-Auth-Verzeichnisse/-Dateien unter `$HOME` werden schreibgeschützt unter `/host-auth...` gemountet und dann vor Testbeginn nach `/home/node/...` kopiert
  - Standardverzeichnisse: `.minimax`
  - Standarddateien: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Eingegrenzte Provider-Läufe mounten nur die benötigten Verzeichnisse/Dateien, abgeleitet aus `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Manuell überschreiben mit `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` oder einer Kommaliste wie `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, um den Lauf einzugrenzen
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, um Provider im Container zu filtern
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, um für Reruns, die keinen Rebuild benötigen, ein vorhandenes `openclaw:local-live`-Image wiederzuverwenden
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um sicherzustellen, dass Credentials aus dem Profile-Store kommen (nicht aus env)
- `OPENCLAW_OPENWEBUI_MODEL=...`, um das vom Gateway für den Open-WebUI-Smoke bereitgestellte Modell auszuwählen
- `OPENCLAW_OPENWEBUI_PROMPT=...`, um den für den Open-WebUI-Smoke verwendeten Nonce-Check-Prompt zu überschreiben
- `OPENWEBUI_IMAGE=...`, um das gepinnte Open-WebUI-Image-Tag zu überschreiben

## Plausibilitätsprüfung für Dokumentation

Führen Sie nach Änderungen an der Dokumentation Docs-Checks aus: `pnpm check:docs`.
Führen Sie die vollständige Mintlify-Anchor-Validierung aus, wenn Sie auch In-Page-Heading-Prüfungen benötigen: `pnpm docs:check-links:anchors`.

## Offline-Regression (CI-sicher)

Dies sind Regressionen für „echte Pipeline“ ohne echte Provider:

- Gateway-Tool-Calling (gemocktes OpenAI, echtes Gateway + Agent-Schleife): `src/gateway/gateway.test.ts` (Fall: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway-Assistent (WS `wizard.start`/`wizard.next`, schreibt erzwungene Config + Auth): `src/gateway/gateway.test.ts` (Fall: "runs wizard over ws and writes auth token config")

## Agent-Zuverlässigkeits-Evals (Skills)

Wir haben bereits einige CI-sichere Tests, die sich wie „Agent-Zuverlässigkeits-Evals“ verhalten:

- Gemocktes Tool-Calling durch die echte Gateway- + Agent-Schleife (`src/gateway/gateway.test.ts`).
- End-to-End-Assistentenabläufe, die Session-Verdrahtung und Konfigurationseffekte validieren (`src/gateway/gateway.test.ts`).

Was für Skills noch fehlt (siehe [Skills](/de/tools/skills)):

- **Entscheidungsfindung:** Wählt der Agent, wenn Skills im Prompt aufgelistet sind, den richtigen Skill (oder vermeidet irrelevante)?
- **Compliance:** Liest der Agent vor der Nutzung `SKILL.md` und befolgt er die erforderlichen Schritte/Argumente?
- **Workflow-Verträge:** Multi-Turn-Szenarien, die Tool-Reihenfolge, Übernahme des Session-Verlaufs und Sandbox-Grenzen sicherstellen.

Zukünftige Evals sollten zuerst deterministisch bleiben:

- Ein Szenario-Runner mit Mock-Providern, um Tool-Aufrufe + Reihenfolge, Skill-Dateilesen und Session-Verdrahtung sicherzustellen.
- Eine kleine Suite von auf Skills fokussierten Szenarien (verwenden vs. vermeiden, Gating, Prompt Injection).
- Optionale Live-Evals (Opt-in, env-gesteuert) erst, nachdem die CI-sichere Suite vorhanden ist.

## Contract-Tests (Plugin- und Kanalform)

Contract-Tests verifizieren, dass jedes registrierte Plugin und jeder Kanal seinem
Schnittstellenvertrag entspricht. Sie iterieren über alle erkannten Plugins und führen eine Suite von
Assertions zu Form und Verhalten aus. Die standardmäßige Unit-Lane `pnpm test`
überspringt diese gemeinsamen Seam- und Smoke-Dateien absichtlich; führen Sie die Contract-Befehle ausdrücklich aus,
wenn Sie gemeinsame Kanal- oder Provider-Oberflächen berühren.

### Befehle

- Alle Contracts: `pnpm test:contracts`
- Nur Kanal-Contracts: `pnpm test:contracts:channels`
- Nur Provider-Contracts: `pnpm test:contracts:plugins`

### Kanal-Contracts

Zu finden unter `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Grundlegende Plugin-Form (id, name, capabilities)
- **setup** - Vertrag des Setup-Assistenten
- **session-binding** - Verhalten der Session-Bindung
- **outbound-payload** - Struktur der Nachrichten-Payload
- **inbound** - Verarbeitung eingehender Nachrichten
- **actions** - Handler für Kanalaktionen
- **threading** - Verarbeitung von Thread-IDs
- **directory** - Directory-/Roster-API
- **group-policy** - Durchsetzung von Gruppenrichtlinien

### Provider-Status-Contracts

Zu finden unter `src/plugins/contracts/*.contract.test.ts`.

- **status** - Status-Probes für Kanäle
- **registry** - Form der Plugin-Registry

### Provider-Contracts

Zu finden unter `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Vertrag des Auth-Flows
- **auth-choice** - Auth-Auswahl/Selektion
- **catalog** - API des Modellkatalogs
- **discovery** - Plugin-Erkennung
- **loader** - Plugin-Laden
- **runtime** - Provider-Laufzeit
- **shape** - Plugin-Form/Schnittstelle
- **wizard** - Setup-Assistent

### Wann ausführen

- Nach Änderungen an Plugin-SDK-Exports oder Subpfaden
- Nach dem Hinzufügen oder Ändern eines Kanal- oder Provider-Plugins
- Nach Refactorings der Plugin-Registrierung oder -Erkennung

Contract-Tests laufen in CI und benötigen keine echten API-Keys.

## Regressionen hinzufügen (Richtlinien)

Wenn Sie ein in Live entdecktes Provider-/Modellproblem beheben:

- Fügen Sie nach Möglichkeit eine CI-sichere Regression hinzu (Mock/Stub-Provider oder Erfassung der exakten Transformation der Anfrageform)
- Wenn das Problem inhärent nur Live betrifft (Rate Limits, Auth-Richtlinien), halten Sie den Live-Test eng begrenzt und per env vars opt-in
- Zielen Sie bevorzugt auf die kleinste Ebene, die den Fehler erkennt:
  - Fehler bei Provider-Anfragekonvertierung/-Replay → Test für direkte Modelle
  - Fehler in Gateway-Session-/Verlaufs-/Tool-Pipeline → Gateway-Live-Smoke oder CI-sicherer Gateway-Mock-Test
- Schutzregel für SecretRef-Traversal:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` leitet aus Registry-Metadaten (`listSecretTargetRegistryEntries()`) ein Beispielziel pro SecretRef-Klasse ab und stellt dann sicher, dass Exec-IDs mit Traversal-Segmenten abgelehnt werden.
  - Wenn Sie in `src/secrets/target-registry-data.ts` eine neue SecretRef-Zielfamilie mit `includeInPlan` hinzufügen, aktualisieren Sie `classifyTargetClass` in diesem Test. Der Test schlägt absichtlich bei nicht klassifizierten Ziel-IDs fehl, damit neue Klassen nicht stillschweigend übersprungen werden können.

## Verwandt

- [Live-Tests](/de/help/testing-live)
- [CI](/de/ci)
