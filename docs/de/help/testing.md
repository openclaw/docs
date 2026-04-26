---
read_when:
    - Tests lokal oder in CI ausführen
    - Regressionen für Modell-/Provider-Bugs hinzufügen
    - Gateway- und Agentenverhalten debuggen
summary: 'Test-Kit: Unit-/E2E-/Live-Suites, Docker-Runner und was jeder Test abdeckt'
title: Testen
x-i18n:
    generated_at: "2026-04-26T11:31:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 46c01493284511d99c37a18fc695cc0af19f87eb6d99eb2ef1beec331c290155
    source_path: help/testing.md
    workflow: 15
---

OpenClaw hat drei Vitest-Suites (Unit/Integration, E2E, Live) und eine kleine Menge
an Docker-Runnern. Dieses Dokument ist eine Anleitung dazu, „wie wir testen“:

- Was jede Suite abdeckt (und was sie bewusst _nicht_ abdeckt).
- Welche Befehle Sie für gängige Workflows ausführen sollten (lokal, vor dem Push, Debugging).
- Wie Live-Tests Zugangsdaten erkennen und Modelle/Provider auswählen.
- Wie Regressionen für reale Modell-/Provider-Probleme hinzugefügt werden.

## Schnellstart

An den meisten Tagen:

- Vollständiges Gate (vor dem Push erwartet): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Schnellere lokale Ausführung der vollständigen Suite auf einem leistungsfähigen Rechner: `pnpm test:max`
- Direkte Vitest-Watch-Schleife: `pnpm test:watch`
- Direktes Targeting einzelner Dateien leitet jetzt auch Erweiterungs-/Kanalpfade weiter: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Bevorzugen Sie zunächst gezielte Läufe, wenn Sie an einem einzelnen Fehler arbeiten.
- Docker-gestützte QA-Site: `pnpm qa:lab:up`
- Linux-VM-gestützte QA-Lane: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Wenn Sie Tests anfassen oder zusätzliche Sicherheit möchten:

- Coverage-Gate: `pnpm test:coverage`
- E2E-Suite: `pnpm test:e2e`

Beim Debuggen realer Provider/Modelle (erfordert echte Zugangsdaten):

- Live-Suite (Modelle + Gateway-Tool-/Bild-Probes): `pnpm test:live`
- Eine einzelne Live-Datei leise ausführen: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker-Live-Modell-Sweep: `pnpm test:docker:live-models`
  - Jedes ausgewählte Modell führt jetzt einen Textzug plus eine kleine Probe im Stil eines Dateilesevorgangs aus.
    Modelle, deren Metadaten `image`-Eingabe ausweisen, führen außerdem einen winzigen Bildzug aus.
    Deaktivieren Sie die zusätzlichen Probes mit `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` oder
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`, wenn Sie Provider-Fehler isolieren.
  - CI-Abdeckung: Die täglichen `OpenClaw Scheduled Live And E2E Checks` und die manuellen
    `OpenClaw Release Checks` rufen beide den wiederverwendbaren Live-/E2E-Workflow mit
    `include_live_suites: true` auf, der separate Docker-Live-Modell-Matrix-Jobs umfasst,
    aufgeteilt nach Provider.
  - Für gezielte CI-Neustarts führen Sie `OpenClaw Live And E2E Checks (Reusable)`
    mit `include_live_suites: true` und `live_models_only: true` aus.
  - Fügen Sie neue aussagekräftige Provider-Secrets zu `scripts/ci-hydrate-live-auth.sh`
    sowie `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` und dessen
    geplanten/Release-Aufrufern hinzu.
- Native Codex-Bound-Chat-Smoke: `pnpm test:docker:live-codex-bind`
  - Führt eine Docker-Live-Lane gegen den Codex-App-Server-Pfad aus, bindet eine synthetische
    Slack-DM mit `/codex bind`, testet `/codex fast` und
    `/codex permissions` und verifiziert dann, dass eine normale Antwort und ein Bildanhang
    über das native Plugin-Binding statt über ACP geroutet werden.
- Codex-App-Server-Harness-Smoke: `pnpm test:docker:live-codex-harness`
  - Führt Gateway-Agenten-Züge über das plugin-eigene Codex-App-Server-Harness aus,
    verifiziert `/codex status` und `/codex models` und testet standardmäßig Bild-,
    Cron-MCP-, Sub-Agent- und Guardian-Probes. Deaktivieren Sie die Sub-Agent-Probe mit
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0`, wenn Sie andere Codex-
    App-Server-Fehler isolieren. Für eine gezielte Sub-Agent-Prüfung deaktivieren Sie die anderen Probes:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Dies beendet sich nach der Sub-Agent-Probe, sofern
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` nicht gesetzt ist.
- Crestodian-Rescue-Command-Smoke: `pnpm test:live:crestodian-rescue-channel`
  - Opt-in-Prüfung mit doppelter Absicherung für die Oberfläche des Rettungsbefehls im Nachrichtenkanal.
    Testet `/crestodian status`, reiht eine persistente Modelländerung ein,
    antwortet mit `/crestodian yes` und verifiziert den Audit-/Konfigurationsschreibpfad.
- Crestodian-Planner-Docker-Smoke: `pnpm test:docker:crestodian-planner`
  - Führt Crestodian in einem konfigurationslosen Container mit einer gefälschten Claude CLI auf `PATH`
    aus und verifiziert, dass das fuzzy Planner-Fallback in einen auditierbaren typisierten
    Konfigurationsschreibvorgang übersetzt wird.
- Crestodian-First-Run-Docker-Smoke: `pnpm test:docker:crestodian-first-run`
  - Startet mit einem leeren OpenClaw-Statusverzeichnis, leitet nacktes `openclaw` an
    Crestodian weiter, wendet Setup-/Modell-/Agent-/Discord-Plugin- plus SecretRef-Schreibvorgänge an,
    validiert die Konfiguration und verifiziert Audit-Einträge. Derselbe Ring-0-Setup-Pfad wird
    auch in QA Lab durch
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` abgedeckt.
- Moonshot/Kimi-Kosten-Smoke: Führen Sie bei gesetztem `MOONSHOT_API_KEY`
  `openclaw models list --provider moonshot --json` aus und dann einen isolierten
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  gegen `moonshot/kimi-k2.6`. Verifizieren Sie, dass das JSON Moonshot/K2.6 meldet und das
  Assistenten-Transkript normalisierte `usage.cost` speichert.

Tipp: Wenn Sie nur einen einzelnen fehlschlagenden Fall benötigen, sollten Sie Live-Tests bevorzugt über die unten beschriebenen Allowlist-Umgebungsvariablen einschränken.

## QA-spezifische Runner

Diese Befehle stehen neben den Haupttest-Suites bereit, wenn Sie mehr Realismus aus QA Lab benötigen:

CI führt QA Lab in dedizierten Workflows aus. `Parity gate` läuft bei passenden PRs und
bei manueller Ausführung mit Mock-Providern. `QA-Lab - All Lanes` läuft nachts auf
`main` und bei manueller Ausführung mit dem Mock-Parity-Gate, einer Live-Matrix-Lane
und einer von Convex verwalteten Live-Telegram-Lane als parallele Jobs. `OpenClaw Release Checks`
führt dieselben Lanes vor der Freigabe eines Releases aus.

- `pnpm openclaw qa suite`
  - Führt repository-gestützte QA-Szenarien direkt auf dem Host aus.
  - Führt mehrere ausgewählte Szenarien standardmäßig parallel mit isolierten
    Gateway-Workern aus. `qa-channel` verwendet standardmäßig Concurrency 4 (begrenzt durch die
    Anzahl der ausgewählten Szenarien). Verwenden Sie `--concurrency <count>`, um die Worker-
    Anzahl anzupassen, oder `--concurrency 1` für die ältere serielle Lane.
  - Beendet sich mit einem Fehlercode ungleich null, wenn irgendein Szenario fehlschlägt. Verwenden Sie `--allow-failures`,
    wenn Sie Artefakte ohne fehlschlagenden Exit-Code möchten.
  - Unterstützt die Provider-Modi `live-frontier`, `mock-openai` und `aimock`.
    `aimock` startet einen lokalen AIMock-gestützten Provider-Server für experimentelle
    Fixture- und Protokoll-Mock-Abdeckung, ohne die szenariobewusste
    `mock-openai`-Lane zu ersetzen.
- `pnpm openclaw qa suite --runner multipass`
  - Führt dieselbe QA-Suite in einer wegwerfbaren Multipass-Linux-VM aus.
  - Behält dasselbe Szenario-Auswahlverhalten wie `qa suite` auf dem Host bei.
  - Verwendet dieselben Provider-/Modellauswahl-Flags wie `qa suite`.
  - Live-Läufe reichen die unterstützten QA-Auth-Eingaben weiter, die für den Gast praktikabel sind:
    env-basierte Provider-Keys, den QA-Live-Provider-Konfigurationspfad und `CODEX_HOME`,
    wenn vorhanden.
  - Ausgabeverzeichnisse müssen unter der Repository-Root bleiben, damit der Gast über
    den eingebundenen Workspace zurückschreiben kann.
  - Schreibt den normalen QA-Bericht + die Zusammenfassung sowie Multipass-Logs unter
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Startet die Docker-gestützte QA-Site für operatorähnliche QA-Arbeit.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Baut aus dem aktuellen Checkout ein npm-Tarball, installiert es global in
    Docker, führt nicht interaktives OpenAI-API-Key-Onboarding aus, konfiguriert standardmäßig Telegram,
    verifiziert, dass das Aktivieren des Plugins Laufzeitabhängigkeiten bei Bedarf installiert,
    führt `doctor` aus und führt einen lokalen Agenten-Zug gegen einen gemockten OpenAI-Endpunkt aus.
  - Verwenden Sie `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, um dieselbe Lane mit paketierter Installation
    mit Discord auszuführen.
- `pnpm test:docker:session-runtime-context`
  - Führt einen deterministischen Docker-Smoke auf Basis der gebauten App für eingebettete Laufzeitkontext-
    Transkripte aus. Es verifiziert, dass versteckter OpenClaw-Laufzeitkontext als
    nicht angezeigte benutzerdefinierte Nachricht persistiert wird, statt in den sichtbaren Benutzerzug zu leaken,
    setzt dann eine betroffene defekte Sitzungs-JSONL-Datei vor und verifiziert,
    dass `openclaw doctor --fix` sie mit Backup auf den aktiven Branch umschreibt.
- `pnpm test:docker:npm-telegram-live`
  - Installiert ein veröffentlichtes OpenClaw-Paket in Docker, führt installiertes Paket-
    Onboarding aus, konfiguriert Telegram über die installierte CLI und verwendet dann die
    Live-Telegram-QA-Lane mit diesem installierten Paket als SUT-Gateway wieder.
  - Standard ist `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`.
  - Verwendet dieselben Telegram-Umgebungszugangsdaten oder dieselbe Convex-Credential-Quelle wie
    `pnpm openclaw qa telegram`. Für CI-/Release-Automatisierung setzen Sie
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` plus
    `OPENCLAW_QA_CONVEX_SITE_URL` und das Role-Secret. Wenn
    `OPENCLAW_QA_CONVEX_SITE_URL` und ein Convex-Role-Secret in CI vorhanden sind,
    wählt der Docker-Wrapper automatisch Convex aus.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` überschreibt das gemeinsame
    `OPENCLAW_QA_CREDENTIAL_ROLE` nur für diese Lane.
  - GitHub Actions stellt diese Lane als manuellen Maintainer-Workflow
    `NPM Telegram Beta E2E` bereit. Sie läuft nicht bei Merges. Der Workflow verwendet die
    Umgebung `qa-live-shared` und Convex-CI-Credential-Leases.
- `pnpm test:docker:bundled-channel-deps`
  - Packt und installiert den aktuellen OpenClaw-Build in Docker, startet das Gateway
    mit konfiguriertem OpenAI und aktiviert dann gebündelte Kanäle/Plugins über Konfigurations-
    Bearbeitungen.
  - Verifiziert, dass die Setup-Erkennung nicht konfigurierte Plugin-Laufzeitabhängigkeiten
    zunächst unberührt lässt, dass der erste konfigurierte Gateway- oder Doctor-Lauf die Laufzeitabhängigkeiten
    jedes gebündelten Plugins bei Bedarf installiert und dass ein zweiter Neustart
    bereits aktivierte Abhängigkeiten nicht erneut installiert.
  - Installiert außerdem eine bekannte ältere npm-Basislinie, aktiviert Telegram vor dem Ausführen von
    `openclaw update --tag <candidate>` und verifiziert, dass der
    Post-Update-Doctor des Kandidaten gebündelte Kanal-Laufzeitabhängigkeiten repariert, ohne
    eine seitens des Harnesses durchgeführte Postinstall-Reparatur.
- `pnpm test:parallels:npm-update`
  - Führt den nativen Update-Smoke für paketierte Installationen über Parallels-Gäste hinweg aus. Jede
    ausgewählte Plattform installiert zunächst das angeforderte Basispaket, führt dann im selben Gast den
    installierten Befehl `openclaw update` aus und verifiziert installierte Version,
    Update-Status, Gateway-Bereitschaft und einen lokalen Agenten-Zug.
  - Verwenden Sie `--platform macos`, `--platform windows` oder `--platform linux`, wenn Sie auf
    einem einzelnen Gast iterieren. Verwenden Sie `--json` für den Pfad des Zusammenfassungsartefakts und
    den Status pro Lane.
  - Die OpenAI-Lane verwendet standardmäßig `openai/gpt-5.5` für den Nachweis eines Live-Agenten-Zugs.
    Übergeben Sie `--model <provider/model>` oder setzen Sie
    `OPENCLAW_PARALLELS_OPENAI_MODEL`, wenn Sie bewusst ein anderes
    OpenAI-Modell validieren möchten.
  - Umschließen Sie lange lokale Läufe mit einem Host-Timeout, damit Störungen im Parallels-Transport
    nicht den Rest des Testfensters verbrauchen:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Das Skript schreibt verschachtelte Lane-Logs unter `/tmp/openclaw-parallels-npm-update.*`.
    Prüfen Sie `windows-update.log`, `macos-update.log` oder `linux-update.log`,
    bevor Sie annehmen, dass der äußere Wrapper hängt.
  - Das Windows-Update kann auf einem kalten Gast 10 bis 15 Minuten in der Reparatur von Doctor-/Laufzeitabhängigkeiten nach dem Update verbringen;
    das ist weiterhin gesund, solange das verschachtelte npm-Debug-Log Fortschritt zeigt.
  - Führen Sie diesen aggregierten Wrapper nicht parallel zu einzelnen Parallels-
    macOS-, Windows- oder Linux-Smoke-Lanes aus. Sie teilen sich VM-Status und können bei
    Snapshot-Wiederherstellung, Paketbereitstellung oder Gateway-Status des Gasts kollidieren.
  - Der Nachweis nach dem Update führt die normale gebündelte Plugin-Oberfläche aus, da
    Fähigkeits-Fassaden wie Sprache, Bilderzeugung und Medienverständnis
    über gebündelte Laufzeit-APIs geladen werden, selbst wenn der Agentenzug selbst nur
    eine einfache Textantwort prüft.

- `pnpm openclaw qa aimock`
  - Startet nur den lokalen AIMock-Provider-Server für direkte Protokoll-Smoke-Tests.
- `pnpm openclaw qa matrix`
  - Führt die Matrix-Live-QA-Lane gegen einen wegwerfbaren, Docker-gestützten Tuwunel-Homeserver aus.
  - Dieser QA-Host ist derzeit nur für Repository/Entwicklung gedacht. Paketierte OpenClaw-Installationen enthalten
    `qa-lab` nicht, daher stellen sie `openclaw qa` nicht bereit.
  - Repository-Checkouts laden den gebündelten Runner direkt; kein separater Plugin-Installationsschritt
    ist erforderlich.
  - Stellt drei temporäre Matrix-Benutzer (`driver`, `sut`, `observer`) sowie einen privaten Raum bereit und startet dann einen QA-Gateway-Kindprozess mit dem echten Matrix-Plugin als SUT-Transport.
  - Verwendet standardmäßig das fest gepinnte stabile Tuwunel-Image `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Überschreiben Sie es mit `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`, wenn Sie ein anderes Image testen müssen.
  - Matrix stellt keine gemeinsamen Credential-Source-Flags bereit, da die Lane lokal temporäre Benutzer bereitstellt.
  - Schreibt einen Matrix-QA-Bericht, eine Zusammenfassung, ein Artefakt mit beobachteten Ereignissen und ein kombiniertes stdout-/stderr-Ausgabelog unter `.artifacts/qa-e2e/...`.
  - Gibt standardmäßig Fortschritt aus und erzwingt ein hartes Ausführungs-Timeout mit `OPENCLAW_QA_MATRIX_TIMEOUT_MS` (standardmäßig 30 Minuten). Das Cleanup wird durch `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` begrenzt, und Fehler enthalten den Recovery-Befehl `docker compose ... down --remove-orphans`.
- `pnpm openclaw qa telegram`
  - Führt die Telegram-Live-QA-Lane gegen eine echte private Gruppe mit den Driver- und SUT-Bot-Tokens aus der Umgebung aus.
  - Erfordert `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` und `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Die Gruppen-ID muss die numerische Telegram-Chat-ID sein.
  - Unterstützt `--credential-source convex` für gemeinsam genutzte gepoolte Zugangsdaten. Verwenden Sie standardmäßig den Env-Modus oder setzen Sie `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, um gepoolte Leases zu verwenden.
  - Beendet sich mit einem Fehlercode ungleich null, wenn ein Szenario fehlschlägt. Verwenden Sie `--allow-failures`, wenn Sie Artefakte ohne fehlschlagenden Exit-Code möchten.
  - Erfordert zwei unterschiedliche Bots in derselben privaten Gruppe, wobei der SUT-Bot einen Telegram-Benutzernamen bereitstellt.
  - Für stabile Bot-zu-Bot-Beobachtung aktivieren Sie den Bot-to-Bot Communication Mode in `@BotFather` für beide Bots und stellen Sie sicher, dass der Driver-Bot Bot-Verkehr in der Gruppe beobachten kann.
  - Schreibt einen Telegram-QA-Bericht, eine Zusammenfassung und ein Artefakt mit beobachteten Nachrichten unter `.artifacts/qa-e2e/...`. Antwortszenarien enthalten die RTT vom Send-Request des Drivers bis zur beobachteten SUT-Antwort.

Live-Transport-Lanes teilen sich einen Standardvertrag, damit neue Transporte nicht auseinanderdriften:

`qa-channel` bleibt die breite synthetische QA-Suite und ist nicht Teil der Live-
Transport-Abdeckungsmatrix.

| Lane     | Canary | Erwähnungssteuerung | Allowlist-Block | Antwort auf Top-Level | Neustart-Fortsetzung | Thread-Follow-up | Thread-Isolation | Reaktionsbeobachtung | Hilfebefehl |
| -------- | ------ | ------------------- | --------------- | --------------------- | -------------------- | ---------------- | ---------------- | -------------------- | ------------ |
| Matrix   | x      | x                   | x               | x                     | x                    | x                | x                | x                    |              |
| Telegram | x      |                     |                 |                       |                      |                  |                  |                      | x            |

### Gemeinsame Telegram-Zugangsdaten über Convex (v1)

Wenn `--credential-source convex` (oder `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) für
`openclaw qa telegram` aktiviert ist, bezieht QA Lab ein exklusives Lease aus einem Convex-gestützten Pool, sendet
Heartbeat-Signale für dieses Lease, während die Lane läuft, und gibt das Lease beim Beenden frei.

Referenzgerüst für ein Convex-Projekt:

- `qa/convex-credential-broker/`

Erforderliche Env-Variablen:

- `OPENCLAW_QA_CONVEX_SITE_URL` (zum Beispiel `https://your-deployment.convex.site`)
- Ein Secret für die gewählte Rolle:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` für `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` für `ci`
- Auswahl der Credential-Rolle:
  - CLI: `--credential-role maintainer|ci`
  - Env-Standard: `OPENCLAW_QA_CREDENTIAL_ROLE` (standardmäßig `ci` in CI, sonst `maintainer`)

Optionale Env-Variablen:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (standardmäßig `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (standardmäßig `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (standardmäßig `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (standardmäßig `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (standardmäßig `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (optionale Trace-ID)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` erlaubt Loopback-`http://`-Convex-URLs nur für lokale Entwicklung.

`OPENCLAW_QA_CONVEX_SITE_URL` sollte im normalen Betrieb `https://` verwenden.

Maintainer-Admin-Befehle (Pool hinzufügen/entfernen/auflisten) erfordern ausdrücklich
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI-Helfer für Maintainer:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Verwenden Sie `doctor` vor Live-Läufen, um die Convex-Site-URL, Broker-Secrets,
das Endpunktpräfix, das HTTP-Timeout und die Erreichbarkeit von Admin/List zu prüfen, ohne
Secret-Werte auszugeben. Verwenden Sie `--json` für maschinenlesbare Ausgabe in Skripten und CI-
Utilities.

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
- `POST /admin/add` (nur mit Maintainer-Secret)
  - Request: `{ kind, actorId, payload, note?, status? }`
  - Erfolg: `{ status: "ok", credential }`
- `POST /admin/remove` (nur mit Maintainer-Secret)
  - Request: `{ credentialId, actorId }`
  - Erfolg: `{ status: "ok", changed, credential }`
  - Schutz bei aktivem Lease: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (nur mit Maintainer-Secret)
  - Request: `{ kind?, status?, includePayload?, limit? }`
  - Erfolg: `{ status: "ok", credentials, count }`

Payload-Struktur für die Art Telegram:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` muss eine numerische Telegram-Chat-ID als String sein.
- `admin/add` validiert diese Struktur für `kind: "telegram"` und weist fehlerhafte Payloads zurück.

### Einen Kanal zu QA hinzufügen

Das Hinzufügen eines Kanals zum markdownbasierten QA-System erfordert genau zwei Dinge:

1. Einen Transportadapter für den Kanal.
2. Ein Szenario-Paket, das den Kanalvertrag testet.

Fügen Sie keinen neuen Root-Befehl der obersten Ebene für QA hinzu, wenn der gemeinsame `qa-lab`-Host
diesen Ablauf besitzen kann.

`qa-lab` besitzt die gemeinsame Host-Mechanik:

- den Root-Befehl `openclaw qa`
- Start und Beenden der Suite
- Worker-Concurrency
- Schreiben von Artefakten
- Berichtserstellung
- Szenarioausführung
- Kompatibilitätsaliase für ältere `qa-channel`-Szenarien

Runner-Plugins besitzen den Transportvertrag:

- wie `openclaw qa <runner>` unter dem gemeinsamen Root `qa` eingebunden wird
- wie das Gateway für diesen Transport konfiguriert wird
- wie Bereitschaft geprüft wird
- wie eingehende Ereignisse injiziert werden
- wie ausgehende Nachrichten beobachtet werden
- wie Transkripte und normalisierter Transportstatus bereitgestellt werden
- wie transportgestützte Aktionen ausgeführt werden
- wie transportspezifisches Reset oder Cleanup behandelt wird

Die minimale Hürde für die Einführung eines neuen Kanals ist:

1. `qa-lab` als Besitzer des gemeinsamen Root `qa` beibehalten.
2. Den Transport-Runner an der gemeinsamen `qa-lab`-Host-Seam implementieren.
3. Transportspezifische Mechanik im Runner-Plugin oder Kanal-Harness belassen.
4. Den Runner als `openclaw qa <runner>` einbinden, statt einen konkurrierenden Root-Befehl zu registrieren.
   Runner-Plugins sollten `qaRunners` in `openclaw.plugin.json` deklarieren und ein passendes Array `qaRunnerCliRegistrations` aus `runtime-api.ts` exportieren.
   Halten Sie `runtime-api.ts` schlank; Lazy-CLI- und Runner-Ausführung sollten hinter separaten Entrypoints bleiben.
5. Markdown-Szenarien unter den thematischen Verzeichnissen `qa/scenarios/` schreiben oder anpassen.
6. Die generischen Szenario-Helfer für neue Szenarien verwenden.
7. Bestehende Kompatibilitätsaliase funktionsfähig halten, sofern das Repository keine absichtliche Migration durchführt.

Die Entscheidungsregel ist streng:

- Wenn ein Verhalten einmalig in `qa-lab` ausgedrückt werden kann, gehört es in `qa-lab`.
- Wenn ein Verhalten von einem Kanaltransport abhängt, bleibt es im Runner-Plugin oder Plugin-Harness dieses Runners.
- Wenn ein Szenario eine neue Fähigkeit benötigt, die mehr als ein Kanal verwenden kann, fügen Sie einen generischen Helfer hinzu statt eines kanalspezifischen Branches in `suite.ts`.
- Wenn ein Verhalten nur für einen Transport sinnvoll ist, halten Sie das Szenario transportspezifisch und machen Sie das im Szenariovertrag ausdrücklich.

Bevorzugte Namen generischer Helfer für neue Szenarien sind:

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

Kompatibilitätsaliase bleiben für bestehende Szenarien verfügbar, einschließlich:

- `waitForQaChannelReady`
- `waitForOutboundMessage`
- `waitForNoOutbound`
- `formatConversationTranscript`
- `resetBus`

Neue Kanal-Arbeit sollte die generischen Helfernamen verwenden.
Kompatibilitätsaliase existieren, um eine Flag-Day-Migration zu vermeiden, nicht als Modell für
neues Schreiben von Szenarien.

## Test-Suites (was wo läuft)

Betrachten Sie die Suites als „zunehmenden Realismus“ (und zunehmende Flakiness/Kosten):

### Unit / Integration (Standard)

- Befehl: `pnpm test`
- Konfiguration: Nicht zielgerichtete Läufe verwenden den Shard-Satz `vitest.full-*.config.ts` und können Multi-Project-Shards für parallele Planung in pro-Projekt-Konfigurationen aufteilen
- Dateien: Core-/Unit-Bestände unter `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` sowie die per Allowlist zugelassenen `ui`-Node-Tests, die von `vitest.unit.config.ts` abgedeckt werden
- Umfang:
  - Reine Unit-Tests
  - In-Process-Integrationstests (Gateway-Authentifizierung, Routing, Tooling, Parsing, Konfiguration)
  - Deterministische Regressionen für bekannte Bugs
- Erwartungen:
  - Läuft in CI
  - Keine echten Schlüssel erforderlich
  - Sollte schnell und stabil sein

<AccordionGroup>
  <Accordion title="Projekte, Shards und bereichsbezogene Lanes">

    - Nicht zielgerichtete `pnpm test`-Läufe verwenden zwölf kleinere Shard-Konfigurationen (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) statt eines riesigen nativen Root-Project-Prozesses. Das senkt den Spitzen-RSS auf belasteten Maschinen und verhindert, dass auto-reply-/Extension-Arbeit nicht zusammenhängende Suites ausbremst.
    - `pnpm test --watch` verwendet weiterhin den nativen Root-Project-Graphen aus `vitest.config.ts`, weil eine Watch-Schleife über mehrere Shards nicht praktikabel ist.
    - `pnpm test`, `pnpm test:watch` und `pnpm test:perf:imports` leiten explizite Datei-/Verzeichnisziele zuerst durch bereichsbezogene Lanes, sodass `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` nicht den Startaufwand des vollständigen Root-Projects bezahlen muss.
    - `pnpm test:changed` erweitert geänderte Git-Pfade in dieselben bereichsbezogenen Lanes, wenn der Diff nur routbare Quell-/Testdateien berührt; Änderungen an Konfiguration/Setup fallen weiterhin auf den breiten erneuten Lauf des Root-Projects zurück.
    - `pnpm check:changed` ist das normale intelligente lokale Gate für schmale Arbeiten. Es klassifiziert den Diff in Core, Core-Tests, Extensions, Extension-Tests, Apps, Docs, Release-Metadaten, Live-Docker-Tooling und Tooling und führt dann die passenden Lanes für Typecheck/Lint/Tests aus. Änderungen am öffentlichen Plugin-SDK und an Plugin-Verträgen enthalten einen Extension-Validierungslauf, weil Extensions von diesen Core-Verträgen abhängen. Reine Versionsanhebungen in Release-Metadaten führen gezielte Prüfungen für Version/Konfiguration/Root-Abhängigkeiten statt der vollständigen Suite aus, mit einer Schutzmaßnahme, die Paketänderungen außerhalb des obersten Versionsfeldes zurückweist.
    - Änderungen am Live-Docker-ACP-Harness führen ein fokussiertes lokales Gate aus: Shell-Syntax für die Live-Docker-Auth-Skripte, Dry-run des Live-Docker-Schedulers, ACP-Bind-Unit-Tests und die ACPX-Extension-Tests. `package.json`-Änderungen werden nur einbezogen, wenn der Diff auf `scripts["test:docker:live-*"]` beschränkt ist; Änderungen an Abhängigkeiten, Exports, Versionen und anderen Paketoberflächen verwenden weiterhin die breiteren Schutzmaßnahmen.
    - Import-leichte Unit-Tests aus Agents, Commands, Plugins, auto-reply-Helfern, `plugin-sdk` und ähnlichen reinen Utility-Bereichen werden über die Lane `unit-fast` geroutet, die `test/setup-openclaw-runtime.ts` überspringt; zustandsbehaftete/laufzeitlastige Dateien bleiben auf den vorhandenen Lanes.
    - Ausgewählte Hilfsquelldateien aus `plugin-sdk` und `commands` mappen Läufe im Changed-Modus außerdem auf explizite Schwester-Tests in diesen leichten Lanes, sodass Helper-Änderungen vermeiden, die vollständige schwere Suite für dieses Verzeichnis erneut auszuführen.
    - `auto-reply` hat dedizierte Buckets für Core-Helfer auf oberster Ebene, `reply.*`-Integrationstests auf oberster Ebene und den Teilbaum `src/auto-reply/reply/**`. CI teilt den Reply-Teilbaum zusätzlich in Shards für Agent-Runner, Dispatch und Commands/State-Routing, sodass nicht ein importlastiger Bucket den gesamten Node-Tail übernimmt.

  </Accordion>

  <Accordion title="Abdeckung für eingebettete Runner">

    - Wenn Sie Inputs für die Erkennung von Nachrichten-Tools oder den Laufzeitkontext für Compaction ändern, halten Sie beide Ebenen der Abdeckung aufrecht.
    - Fügen Sie fokussierte Helper-Regressionen für reine Grenzen von Routing und Normalisierung hinzu.
    - Halten Sie die Integrations-Suites für eingebettete Runner gesund:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` und
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Diese Suites verifizieren, dass bereichsbezogene IDs und Compaction-Verhalten weiterhin durch die echten Pfade `run.ts` / `compact.ts` fließen; reine Helper-Tests sind kein ausreichender Ersatz für diese Integrationspfade.

  </Accordion>

  <Accordion title="Vitest-Pool und Standardwerte für Isolation">

    - Die Basis-Konfiguration von Vitest verwendet standardmäßig `threads`.
    - Die gemeinsame Vitest-Konfiguration fixiert `isolate: false` und verwendet den
      nicht isolierten Runner über Root-Projekte, E2E- und Live-Konfigurationen hinweg.
    - Die Root-UI-Lane behält ihr `jsdom`-Setup und ihren Optimizer, läuft aber ebenfalls auf dem
      gemeinsamen nicht isolierten Runner.
    - Jeder `pnpm test`-Shard übernimmt dieselben Standardwerte `threads` + `isolate: false`
      aus der gemeinsamen Vitest-Konfiguration.
    - `scripts/run-vitest.mjs` fügt standardmäßig `--no-maglev` für Node-
      Kindprozesse von Vitest hinzu, um bei großen lokalen Läufen V8-Compile-Churn zu reduzieren.
      Setzen Sie `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, um mit dem Standardverhalten von V8
      zu vergleichen.

  </Accordion>

  <Accordion title="Schnelle lokale Iteration">

    - `pnpm changed:lanes` zeigt, welche Architektur-Lanes ein Diff auslöst.
    - Der Pre-Commit-Hook ist nur für Formatierung zuständig. Er staged formatierte Dateien erneut und
      führt kein Lint, keinen Typecheck und keine Tests aus.
    - Führen Sie `pnpm check:changed` explizit vor Übergabe oder Push aus, wenn Sie
      das intelligente lokale Gate benötigen. Änderungen am öffentlichen Plugin-SDK und an Plugin-Verträgen
      enthalten einen Extension-Validierungslauf.
    - `pnpm test:changed` leitet über bereichsbezogene Lanes, wenn die geänderten Pfade
      sauber auf eine kleinere Suite abbildbar sind.
    - `pnpm test:max` und `pnpm test:changed:max` behalten dasselbe Routing-
      Verhalten, nur mit einer höheren Worker-Obergrenze.
    - Die automatische Skalierung lokaler Worker ist absichtlich konservativ und fährt zurück,
      wenn die Host-Load-Average bereits hoch ist, sodass mehrere gleichzeitige
      Vitest-Läufe standardmäßig weniger Schaden anrichten.
    - Die Basis-Konfiguration von Vitest markiert die Projekte/Konfigurationsdateien als
      `forceRerunTriggers`, damit erneute Läufe im Changed-Modus korrekt bleiben, wenn sich
      die Testverdrahtung ändert.
    - Die Konfiguration hält `OPENCLAW_VITEST_FS_MODULE_CACHE` auf unterstützten
      Hosts aktiviert; setzen Sie `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, wenn Sie
      einen expliziten Cache-Ort für direktes Profiling möchten.

  </Accordion>

  <Accordion title="Performance-Debugging">

    - `pnpm test:perf:imports` aktiviert die Berichterstattung über Importdauer in Vitest sowie
      die Ausgabe einer Import-Aufschlüsselung.
    - `pnpm test:perf:imports:changed` beschränkt dieselbe Profiling-Ansicht auf
      Dateien, die seit `origin/main` geändert wurden.
    - Timing-Daten für Shards werden in `.artifacts/vitest-shard-timings.json` geschrieben.
      Läufe mit vollständiger Konfiguration verwenden den Konfigurationspfad als Schlüssel; Include-Pattern-CI-
      Shards hängen den Shard-Namen an, damit gefilterte Shards separat
      verfolgt werden können.
    - Wenn ein heißer Test weiterhin den Großteil seiner Zeit in Start-Imports verbringt,
      halten Sie schwere Abhängigkeiten hinter einer schmalen lokalen Seam `*.runtime.ts` und
      mocken Sie diese Seam direkt, statt Laufzeit-Helper tief zu importieren, nur um sie durch
      `vi.mock(...)` zu schleusen.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` vergleicht das geroutete
      `test:changed` mit dem nativen Root-Project-Pfad für diesen eingecheckten Diff und gibt
      Wall Time sowie maximalen RSS unter macOS aus.
    - `pnpm test:perf:changed:bench -- --worktree` benchmarkt den aktuellen
      veränderten Tree, indem die Liste geänderter Dateien durch
      `scripts/test-projects.mjs` und die Root-Vitest-Konfiguration geroutet wird.
    - `pnpm test:perf:profile:main` schreibt ein CPU-Profil des Main-Threads für
      Start- und Transform-Overhead von Vitest/Vite.
    - `pnpm test:perf:profile:runner` schreibt CPU- + Heap-Profile des Runners für die
      Unit-Suite bei deaktivierter Dateiparallelität.

  </Accordion>
</AccordionGroup>

### Stabilität (Gateway)

- Befehl: `pnpm test:stability:gateway`
- Konfiguration: `vitest.gateway.config.ts`, erzwungen auf einen Worker
- Umfang:
  - Startet ein echtes Loopback-Gateway mit standardmäßig aktivierter Diagnostik
  - Leitet synthetische Churn-Muster für Gateway-Nachrichten, Speicher und große Payloads über den Pfad für Diagnoseereignisse
  - Fragt `diagnostics.stability` über das Gateway-WS-RPC ab
  - Deckt Helper für die Persistenz von Diagnose-Stabilitäts-Bundles ab
  - Prüft, dass der Recorder begrenzt bleibt, synthetische RSS-Samples unter dem Druckbudget bleiben und Queues pro Sitzung wieder auf null zurücklaufen
- Erwartungen:
  - CI-sicher und ohne Schlüssel
  - Schmale Lane zur Nachverfolgung von Stabilitätsregressionen, kein Ersatz für die vollständige Gateway-Suite

### E2E (Gateway-Smoke)

- Befehl: `pnpm test:e2e`
- Konfiguration: `vitest.e2e.config.ts`
- Dateien: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` und E2E-Tests gebündelter Plugins unter `extensions/`
- Laufzeit-Standards:
  - Verwendet Vitest-`threads` mit `isolate: false`, passend zum Rest des Repositorys.
  - Verwendet adaptive Worker (CI: bis zu 2, lokal: standardmäßig 1).
  - Läuft standardmäßig im Silent-Modus, um den Overhead durch Konsolen-I/O zu reduzieren.
- Nützliche Überschreibungen:
  - `OPENCLAW_E2E_WORKERS=<n>`, um die Anzahl der Worker zu erzwingen (begrenzt auf 16).
  - `OPENCLAW_E2E_VERBOSE=1`, um ausführliche Konsolenausgabe wieder zu aktivieren.
- Umfang:
  - End-to-End-Verhalten von Gateway über mehrere Instanzen hinweg
  - WebSocket-/HTTP-Oberflächen, Node-Pairing und schwereres Networking
- Erwartungen:
  - Läuft in CI (wenn in der Pipeline aktiviert)
  - Keine echten Schlüssel erforderlich
  - Mehr bewegliche Teile als Unit-Tests (kann langsamer sein)

### E2E: OpenShell-Backend-Smoke

- Befehl: `pnpm test:e2e:openshell`
- Datei: `extensions/openshell/src/backend.e2e.test.ts`
- Umfang:
  - Startet über Docker ein isoliertes OpenShell-Gateway auf dem Host
  - Erstellt eine Sandbox aus einem temporären lokalen Dockerfile
  - Testet das OpenShell-Backend von OpenClaw über echte `sandbox ssh-config` + SSH-Exec
  - Verifiziert remote-kanonisches Dateisystemverhalten über die Sandbox-FS-Bridge
- Erwartungen:
  - Nur Opt-in; nicht Teil des Standardlaufs `pnpm test:e2e`
  - Erfordert eine lokale `openshell`-CLI plus einen funktionierenden Docker-Daemon
  - Verwendet isoliertes `HOME` / `XDG_CONFIG_HOME` und zerstört danach das Test-Gateway und die Sandbox
- Nützliche Überschreibungen:
  - `OPENCLAW_E2E_OPENSHELL=1`, um den Test zu aktivieren, wenn die breitere E2E-Suite manuell ausgeführt wird
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, um auf eine nicht standardmäßige CLI-Binärdatei oder ein Wrapper-Skript zu zeigen

### Live (reale Provider + reale Modelle)

- Befehl: `pnpm test:live`
- Konfiguration: `vitest.live.config.ts`
- Dateien: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` und Live-Tests gebündelter Plugins unter `extensions/`
- Standard: **aktiviert** durch `pnpm test:live` (setzt `OPENCLAW_LIVE_TEST=1`)
- Umfang:
  - „Funktioniert dieser Provider/dieses Modell _heute_ tatsächlich mit echten Zugangsdaten?“
  - Erfasst Änderungen im Provider-Format, Eigenheiten beim Tool-Calling, Auth-Probleme und Verhalten bei Rate-Limits
- Erwartungen:
  - Absichtlich nicht CI-stabil (reale Netzwerke, reale Provider-Richtlinien, Quoten, Ausfälle)
  - Kostet Geld / verbraucht Rate-Limits
  - Bevorzugen Sie eingeschränkte Teilmengen statt „alles“
- Live-Läufe sourcen `~/.profile`, um fehlende API-Keys aufzunehmen.
- Standardmäßig isolieren Live-Läufe dennoch `HOME` und kopieren Konfigurations-/Auth-Material in ein temporäres Test-Home, damit Unit-Fixtures Ihr echtes `~/.openclaw` nicht verändern können.
- Setzen Sie `OPENCLAW_LIVE_USE_REAL_HOME=1` nur dann, wenn Live-Tests absichtlich Ihr echtes Home-Verzeichnis verwenden sollen.
- `pnpm test:live` verwendet jetzt standardmäßig einen leiseren Modus: Die Fortschrittsausgabe `[live] ...` bleibt erhalten, aber der zusätzliche Hinweis zu `~/.profile` wird unterdrückt und Gateway-Bootstrap-Logs/Bonjour-Chatter werden stummgeschaltet. Setzen Sie `OPENCLAW_LIVE_TEST_QUIET=0`, wenn Sie die vollständigen Start-Logs wiederhaben möchten.
- API-Key-Rotation (providerspezifisch): Setzen Sie `*_API_KEYS` im Komma-/Semikolonformat oder `*_API_KEY_1`, `*_API_KEY_2` (zum Beispiel `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) oder eine Live-Überschreibung pro Lauf via `OPENCLAW_LIVE_*_KEY`; Tests wiederholen sich bei Antworten mit Rate-Limits.
- Fortschritts-/Heartbeat-Ausgabe:
  - Live-Suites geben jetzt Fortschrittszeilen auf stderr aus, sodass lange Provider-Aufrufe sichtbar aktiv bleiben, auch wenn die Konsolenerfassung von Vitest leise ist.
  - `vitest.live.config.ts` deaktiviert die Konsoleninterzeption von Vitest, sodass Fortschrittszeilen von Provider/Gateway bei Live-Läufen sofort gestreamt werden.
  - Passen Sie Heartbeats für direkte Modelle mit `OPENCLAW_LIVE_HEARTBEAT_MS` an.
  - Passen Sie Heartbeats für Gateway/Probes mit `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` an.

## Welche Suite sollte ich ausführen?

Verwenden Sie diese Entscheidungstabelle:

- Logik/Tests bearbeiten: Führen Sie `pnpm test` aus (und `pnpm test:coverage`, wenn Sie viel geändert haben)
- Gateway-Networking / WS-Protokoll / Pairing anfassen: ergänzen Sie `pnpm test:e2e`
- „Mein Bot ist down“ / providerspezifische Fehler / Tool-Calling debuggen: Führen Sie ein eingeschränktes `pnpm test:live` aus

## Live-Tests (mit Netzwerkberührung)

Für die Live-Modell-Matrix, CLI-Backend-Smokes, ACP-Smokes, das Codex-App-Server-
Harness und alle Live-Tests für Medien-Provider (Deepgram, BytePlus, ComfyUI, Bild,
Musik, Video, Medien-Harness) — plus das Credential-Handling für Live-Läufe — siehe
[Testing — live suites](/de/help/testing-live).

## Docker-Runner (optionale „funktioniert unter Linux“-Prüfungen)

Diese Docker-Runner teilen sich in zwei Gruppen:

- Live-Modell-Runner: `test:docker:live-models` und `test:docker:live-gateway` führen nur ihre passende Live-Datei mit Profil-Schlüssel innerhalb des Docker-Images des Repos aus (`src/agents/models.profiles.live.test.ts` und `src/gateway/gateway-models.profiles.live.test.ts`), wobei Ihr lokales Konfigurationsverzeichnis und Ihr Workspace eingebunden werden (und `~/.profile` gesourct wird, falls eingebunden). Die passenden lokalen Entrypoints sind `test:live:models-profiles` und `test:live:gateway-profiles`.
- Docker-Live-Runner verwenden standardmäßig eine kleinere Smoke-Obergrenze, damit ein vollständiger Docker-Sweep praktikabel bleibt:
  `test:docker:live-models` verwendet standardmäßig `OPENCLAW_LIVE_MAX_MODELS=12`, und
  `test:docker:live-gateway` verwendet standardmäßig `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` und
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Überschreiben Sie diese Env-Variablen, wenn Sie
  ausdrücklich den größeren vollständigen Scan möchten.
- `test:docker:all` baut das Live-Docker-Image einmal über `test:docker:live-build` und verwendet es dann für die Live-Docker-Lanes wieder. Es baut außerdem ein gemeinsames Image aus `scripts/e2e/Dockerfile` über `test:docker:e2e-build` und verwendet es für die E2E-Container-Smoke-Runner wieder, die die gebaute App testen. Das Aggregat verwendet einen gewichteten lokalen Scheduler: `OPENCLAW_DOCKER_ALL_PARALLELISM` steuert Prozess-Slots, während Ressourcenobergrenzen verhindern, dass schwere Live-, npm-Installations- und Multi-Service-Lanes alle gleichzeitig starten. Standardmäßig sind es 10 Slots, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=8` und `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; passen Sie `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` oder `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` nur an, wenn der Docker-Host mehr Spielraum hat. Der Runner führt standardmäßig einen Docker-Preflight aus, entfernt veraltete OpenClaw-E2E-Container, gibt alle 30 Sekunden Status aus, speichert erfolgreiche Lane-Timings in `.artifacts/docker-tests/lane-timings.json` und nutzt diese Timings, um bei späteren Läufen längere Lanes zuerst zu starten. Verwenden Sie `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, um das gewichtete Lane-Manifest auszugeben, ohne Docker zu bauen oder auszuführen.
- Container-Smoke-Runner: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` und `test:docker:config-reload` starten einen oder mehrere echte Container und verifizieren Integrationspfade höherer Ebene.

Die Docker-Runner für Live-Modelle binden außerdem nur die benötigten CLI-Auth-Homes ein (oder alle unterstützten, wenn der Lauf nicht eingegrenzt ist) und kopieren sie dann vor dem Lauf in das Container-Home, sodass OAuth externer CLI-Tools Tokens aktualisieren kann, ohne den Auth-Speicher des Hosts zu verändern:

- Direkte Modelle: `pnpm test:docker:live-models` (Skript: `scripts/test-live-models-docker.sh`)
- ACP-Bind-Smoke: `pnpm test:docker:live-acp-bind` (Skript: `scripts/test-live-acp-bind-docker.sh`; deckt standardmäßig Claude, Codex und Gemini ab, mit strikter Droid-/OpenCode-Abdeckung über `pnpm test:docker:live-acp-bind:droid` und `pnpm test:docker:live-acp-bind:opencode`)
- CLI-Backend-Smoke: `pnpm test:docker:live-cli-backend` (Skript: `scripts/test-live-cli-backend-docker.sh`)
- Codex-App-Server-Harness-Smoke: `pnpm test:docker:live-codex-harness` (Skript: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + Dev-Agent: `pnpm test:docker:live-gateway` (Skript: `scripts/test-live-gateway-models-docker.sh`)
- Open-WebUI-Live-Smoke: `pnpm test:docker:openwebui` (Skript: `scripts/e2e/openwebui-docker.sh`)
- Onboarding-Assistent (TTY, vollständiges Scaffolding): `pnpm test:docker:onboard` (Skript: `scripts/e2e/onboard-docker.sh`)
- Smoke für npm-Tarball-Onboarding/Kanal/Agent: `pnpm test:docker:npm-onboard-channel-agent` installiert das gepackte OpenClaw-Tarball global in Docker, konfiguriert OpenAI über Env-Ref-Onboarding plus standardmäßig Telegram, verifiziert, dass `doctor` aktivierte Laufzeitabhängigkeiten von Plugins repariert, und führt einen gemockten OpenAI-Agenten-Zug aus. Verwenden Sie ein vorgebautes Tarball mit `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz` wieder, überspringen Sie den Host-Neubau mit `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` oder wechseln Sie den Kanal mit `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke für Wechsel des Update-Kanals: `pnpm test:docker:update-channel-switch` installiert das gepackte OpenClaw-Tarball global in Docker, wechselt vom Paketkanal `stable` zu Git `dev`, verifiziert, dass der persistierte Kanal und das Plugin nach dem Update funktionieren, wechselt dann zurück zu Paket `stable` und prüft den Update-Status.
- Smoke für Laufzeitkontext der Sitzung: `pnpm test:docker:session-runtime-context` verifiziert die Persistenz versteckter Laufzeitkontext-Transkripte sowie die Reparatur betroffener duplizierter Prompt-Rewrite-Branches durch `doctor`.
- Bun-Global-Install-Smoke: `bash scripts/e2e/bun-global-install-smoke.sh` packt den aktuellen Tree, installiert ihn mit `bun install -g` in einem isolierten Home und verifiziert, dass `openclaw infer image providers --json` gebündelte Bild-Provider zurückgibt, statt zu hängen. Verwenden Sie ein vorgebautes Tarball erneut mit `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, überspringen Sie den Host-Build mit `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` oder kopieren Sie `dist/` aus einem gebauten Docker-Image mit `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Installer-Docker-Smoke: `bash scripts/test-install-sh-docker.sh` teilt einen npm-Cache über Root-, Update- und Direct-npm-Container hinweg. Der Update-Smoke verwendet standardmäßig npm `latest` als stabile Basislinie, bevor auf das Kandidaten-Tarball aktualisiert wird. Nicht-Root-Installer-Prüfungen behalten einen isolierten npm-Cache, damit Root-besessene Cache-Einträge das benutzerlokale Installationsverhalten nicht maskieren. Setzen Sie `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, um den Root-/Update-/Direct-npm-Cache über lokale Wiederholungsläufe hinweg wiederzuverwenden.
- Install-Smoke in CI überspringt das doppelte direkte globale Update via npm mit `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; führen Sie das Skript lokal ohne diese Env-Variable aus, wenn Abdeckung für direktes `npm install -g` benötigt wird.
- CLI-Smoke für `agents delete` mit gemeinsamem Workspace: `pnpm test:docker:agents-delete-shared-workspace` (Skript: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) baut standardmäßig das Root-Dockerfile-Image, setzt zwei Agenten mit einem Workspace in einem isolierten Container-Home auf, führt `agents delete --json` aus und verifiziert gültiges JSON plus das Beibehalten des Workspace-Verhaltens. Verwenden Sie das Install-Smoke-Image erneut mit `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Gateway-Networking (zwei Container, WS-Auth + Health): `pnpm test:docker:gateway-network` (Skript: `scripts/e2e/gateway-network-docker.sh`)
- Browser-CDP-Snapshot-Smoke: `pnpm test:docker:browser-cdp-snapshot` (Skript: `scripts/e2e/browser-cdp-snapshot-docker.sh`) baut das E2E-Quellimage plus eine Chromium-Schicht, startet Chromium mit rohem CDP, führt `browser doctor --deep` aus und verifiziert, dass CDP-Rollensnapshots Link-URLs, per Cursor hervorgehobene anklickbare Elemente, Iframe-Refs und Frame-Metadaten abdecken.
- OpenAI-Responses-Regression für minimal reasoning mit `web_search`: `pnpm test:docker:openai-web-search-minimal` (Skript: `scripts/e2e/openai-web-search-minimal-docker.sh`) führt einen gemockten OpenAI-Server durch das Gateway, verifiziert, dass `web_search` `reasoning.effort` von `minimal` auf `low` anhebt, erzwingt dann, dass das Provider-Schema ablehnt, und prüft, dass das rohe Detail in den Gateway-Logs erscheint.
- MCP-Kanal-Bridge (geseedetes Gateway + stdio-Bridge + roher Claude-Benachrichtigungs-Frame-Smoke): `pnpm test:docker:mcp-channels` (Skript: `scripts/e2e/mcp-channels-docker.sh`)
- Pi-Bundle-MCP-Tools (echter stdio-MCP-Server + Smoke für eingebettetes Pi-Profil Allow/Deny): `pnpm test:docker:pi-bundle-mcp-tools` (Skript: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cleanup von Cron-/Subagent-MCP (echtes Gateway + Teardown von stdio-MCP-Kindprozessen nach isoliertem Cron und einmaligen Subagent-Läufen): `pnpm test:docker:cron-mcp-cleanup` (Skript: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (Install-Smoke, ClawHub-Installation/Deinstallation, Marketplace-Updates und Aktivieren/Prüfen des Claude-Bundles): `pnpm test:docker:plugins` (Skript: `scripts/e2e/plugins-docker.sh`)
  Setzen Sie `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, um den Live-Block für ClawHub zu überspringen, oder überschreiben Sie das Standardpaket mit `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` und `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`.
- Unveränderter Plugin-Update-Smoke: `pnpm test:docker:plugin-update` (Skript: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke für Metadaten beim Konfigurations-Reload: `pnpm test:docker:config-reload` (Skript: `scripts/e2e/config-reload-source-docker.sh`)
- Laufzeitabhängigkeiten gebündelter Plugins: `pnpm test:docker:bundled-channel-deps` baut standardmäßig ein kleines Docker-Runner-Image, baut und packt OpenClaw einmal auf dem Host und bindet dieses Tarball dann in jede Linux-Installationsszenario ein. Verwenden Sie das Image erneut mit `OPENCLAW_SKIP_DOCKER_BUILD=1`, überspringen Sie den Host-Neubau nach einem frischen lokalen Build mit `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` oder zeigen Sie mit `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz` auf ein vorhandenes Tarball. Das vollständige Docker-Aggregat packt dieses Tarball einmal vor und shardet dann die Prüfungen für gebündelte Kanäle in unabhängige Lanes, einschließlich separater Update-Lanes für Telegram, Discord, Slack, Feishu, memory-lancedb und ACPX. Verwenden Sie `OPENCLAW_BUNDLED_CHANNELS=telegram,slack`, um die Kanalmatrix beim direkten Ausführen der gebündelten Lane einzuschränken, oder `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx`, um das Update-Szenario einzuschränken. Die Lane verifiziert außerdem, dass `channels.<id>.enabled=false` und `plugins.entries.<id>.enabled=false` die Reparatur von Laufzeitabhängigkeiten durch doctor unterdrücken.
- Grenzen Sie Laufzeitabhängigkeiten gebündelter Plugins während der Iteration ein, indem Sie nicht zusammenhängende Szenarien deaktivieren, zum Beispiel:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Um das gemeinsame Image der gebauten App manuell vorab zu bauen und wiederzuverwenden:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Suite-spezifische Image-Überschreibungen wie `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` haben weiterhin Vorrang, wenn sie gesetzt sind. Wenn `OPENCLAW_SKIP_DOCKER_BUILD=1` auf ein entferntes gemeinsames Image zeigt, ziehen die Skripte es, falls es noch nicht lokal vorhanden ist. Die Docker-Tests für QR und Installer behalten ihre eigenen Dockerfiles, weil sie Paket-/Installationsverhalten statt der gemeinsamen Laufzeit der gebauten App validieren.

Die Docker-Runner für Live-Modelle binden außerdem den aktuellen Checkout schreibgeschützt ein und
stellen ihn in ein temporäres Arbeitsverzeichnis innerhalb des Containers bereit. Dadurch bleibt das Runtime-
Image schlank, während Vitest trotzdem gegen Ihren exakten lokalen Source-/Konfigurationsstand läuft.
Der Staging-Schritt überspringt große rein lokale Caches und Build-Ausgaben von Apps wie
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` und app-lokale `.build`- oder
Gradle-Ausgabeverzeichnisse, sodass Docker-Live-Läufe nicht minutenlang maschinenspezifische Artefakte kopieren.
Sie setzen außerdem `OPENCLAW_SKIP_CHANNELS=1`, damit Gateway-Live-Probes keine
echten Kanal-Worker für Telegram/Discord usw. innerhalb des Containers starten.
`test:docker:live-models` führt weiterhin `pnpm test:live` aus, daher reichen Sie
auch `OPENCLAW_LIVE_GATEWAY_*` durch, wenn Sie Gateway-
Live-Abdeckung in dieser Docker-Lane eingrenzen oder ausschließen müssen.
`test:docker:openwebui` ist ein höherstufiger Kompatibilitäts-Smoke: Er startet einen
OpenClaw-Gateway-Container mit aktivierten OpenAI-kompatiblen HTTP-Endpunkten,
startet einen fest gepinnten Open-WebUI-Container gegen dieses Gateway, meldet sich über
Open WebUI an, verifiziert, dass `/api/models` `openclaw/default` bereitstellt, und sendet dann eine
echte Chat-Anfrage über den Proxy `/api/chat/completions` von Open WebUI.
Der erste Lauf kann spürbar langsamer sein, weil Docker möglicherweise das
Open-WebUI-Image ziehen muss und Open WebUI sein eigenes Cold-Start-Setup abschließen muss.
Diese Lane erwartet einen verwendbaren Live-Modell-Schlüssel, und `OPENCLAW_PROFILE_FILE`
(standardmäßig `~/.profile`) ist der primäre Weg, ihn bei Docker-basierten Läufen bereitzustellen.
Erfolgreiche Läufe geben eine kleine JSON-Nutzlast wie `{ "ok": true, "model":
"openclaw/default", ... }` aus.
`test:docker:mcp-channels` ist absichtlich deterministisch und benötigt kein
echtes Telegram-, Discord- oder iMessage-Konto. Es startet ein geseedetes Gateway-
Container, startet einen zweiten Container, der `openclaw mcp serve` ausführt, und
verifiziert dann die Erkennung gerouteter Unterhaltungen, das Lesen von Transkripten, Attachment-Metadaten,
das Verhalten der Live-Ereigniswarteschlange, das Routing ausgehender Sendungen sowie kanal- und Berechtigungsbenachrichtigungen im Claude-Stil über die echte stdio-MCP-Bridge. Die Prüfung der Benachrichtigungen
inspiziert die rohen stdio-MCP-Frames direkt, sodass der Smoke validiert, was die
Bridge tatsächlich ausgibt, und nicht nur, was ein bestimmtes Client-SDK gerade bereitstellt.
`test:docker:pi-bundle-mcp-tools` ist deterministisch und benötigt keinen Live-
Modell-Schlüssel. Es baut das Docker-Image des Repos, startet einen echten stdio-MCP-Probe-Server
innerhalb des Containers, materialisiert diesen Server über die eingebettete Pi-Bundle-
MCP-Runtime, führt das Tool aus und verifiziert dann, dass `coding` und `messaging`
`bundle-mcp`-Tools behalten, während `minimal` und `tools.deny: ["bundle-mcp"]` sie herausfiltern.
`test:docker:cron-mcp-cleanup` ist deterministisch und benötigt keinen Live-Modell-
Schlüssel. Es startet ein geseedetes Gateway mit einem echten stdio-MCP-Probe-Server, führt einen
isolierten Cron-Zug und einen einmaligen Kindzug mit `/subagents spawn` aus und verifiziert dann,
dass der MCP-Kindprozess nach jedem Lauf beendet wird.

Manueller ACP-Smoke für Plain-Language-Threads (nicht CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Behalten Sie dieses Skript für Workflows zur Regression/zum Debugging bei. Es könnte für die Validierung des ACP-Thread-Routings erneut benötigt werden, also nicht löschen.

Nützliche Env-Variablen:

- `OPENCLAW_CONFIG_DIR=...` (Standard: `~/.openclaw`) wird nach `/home/node/.openclaw` gemountet
- `OPENCLAW_WORKSPACE_DIR=...` (Standard: `~/.openclaw/workspace`) wird nach `/home/node/.openclaw/workspace` gemountet
- `OPENCLAW_PROFILE_FILE=...` (Standard: `~/.profile`) wird nach `/home/node/.profile` gemountet und vor dem Ausführen der Tests gesourct
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, um nur Env-Variablen zu prüfen, die aus `OPENCLAW_PROFILE_FILE` gesourct wurden, unter Verwendung temporärer Konfigurations-/Workspace-Verzeichnisse und ohne externe CLI-Auth-Mounts
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (Standard: `~/.cache/openclaw/docker-cli-tools`) wird nach `/home/node/.npm-global` gemountet für zwischengespeicherte CLI-Installationen innerhalb von Docker
- Externe CLI-Auth-Verzeichnisse/-Dateien unter `$HOME` werden schreibgeschützt unter `/host-auth...` gemountet und dann vor dem Start der Tests nach `/home/node/...` kopiert
  - Standardverzeichnisse: `.minimax`
  - Standarddateien: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Eingegrenzte Provider-Läufe mounten nur die benötigten Verzeichnisse/Dateien, abgeleitet aus `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS`
  - Manuell überschreiben mit `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` oder einer Kommaliste wie `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, um den Lauf einzugrenzen
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, um Provider im Container zu filtern
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, um für Wiederholungsläufe, die keinen Neubau benötigen, ein vorhandenes Image `openclaw:local-live` wiederzuverwenden
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um sicherzustellen, dass Zugangsdaten aus dem Profilspeicher kommen (nicht aus Env)
- `OPENCLAW_OPENWEBUI_MODEL=...`, um das vom Gateway für den Open-WebUI-Smoke bereitgestellte Modell auszuwählen
- `OPENCLAW_OPENWEBUI_PROMPT=...`, um den für den Open-WebUI-Smoke verwendeten Nonce-Prüf-Prompt zu überschreiben
- `OPENWEBUI_IMAGE=...`, um das fest gepinnte Open-WebUI-Image-Tag zu überschreiben

## Docs-Sanity

Führen Sie nach Änderungen an der Dokumentation die Docs-Prüfungen aus: `pnpm check:docs`.
Führen Sie die vollständige Mintlify-Anchor-Validierung aus, wenn Sie zusätzlich Prüfungen für Überschriften innerhalb von Seiten benötigen: `pnpm docs:check-links:anchors`.

## Offline-Regression (CI-sicher)

Dies sind „echte Pipeline“-Regressionen ohne echte Provider:

- Tool-Calling über Gateway (gemocktes OpenAI, echtes Gateway + Agentenschleife): `src/gateway/gateway.test.ts` (Fall: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway-Assistent (WS `wizard.start`/`wizard.next`, schreibt Konfiguration + Auth erzwungen): `src/gateway/gateway.test.ts` (Fall: "runs wizard over ws and writes auth token config")

## Agenten-Zuverlässigkeits-Evals (Skills)

Wir haben bereits einige CI-sichere Tests, die sich wie „Agenten-Zuverlässigkeits-Evals“ verhalten:

- Gemocktes Tool-Calling über die echte Gateway- + Agentenschleife (`src/gateway/gateway.test.ts`).
- End-to-End-Assistentenabläufe, die Sitzungsverdrahtung und Konfigurationseffekte validieren (`src/gateway/gateway.test.ts`).

Was für Skills noch fehlt (siehe [Skills](/de/tools/skills)):

- **Entscheidungsfindung:** Wenn Skills im Prompt aufgelistet sind, wählt der Agent dann den richtigen Skill (oder vermeidet irrelevante)?
- **Compliance:** Liest der Agent vor der Verwendung `SKILL.md` und befolgt er erforderliche Schritte/Argumente?
- **Workflow-Verträge:** Mehrzügige Szenarien, die Tool-Reihenfolge, Übernahme des Sitzungsverlaufs und Sandbox-Grenzen überprüfen.

Zukünftige Evals sollten zuerst deterministisch bleiben:

- Ein Szenario-Runner mit Mock-Providern, um Tool-Aufrufe + Reihenfolge, das Lesen von Skill-Dateien und Sitzungsverdrahtung zu prüfen.
- Eine kleine Suite von skillfokussierten Szenarien (verwenden vs. vermeiden, Gating, Prompt-Injection).
- Optionale Live-Evals (Opt-in, per Env gesteuert) erst, nachdem die CI-sichere Suite vorhanden ist.

## Vertragstests (Plugin- und Kanalstruktur)

Vertragstests prüfen, dass jedes registrierte Plugin und jeder Kanal seinem
Vertrags-Interface entspricht. Sie iterieren über alle erkannten Plugins und führen eine Suite
von Struktur- und Verhaltensprüfungen aus. Die standardmäßige Unit-Lane `pnpm test`
überspringt diese gemeinsam genutzten Seam- und Smoke-Dateien absichtlich; führen Sie die Vertragsbefehle explizit aus,
wenn Sie gemeinsam genutzte Kanal- oder Provider-Oberflächen anfassen.

### Befehle

- Alle Verträge: `pnpm test:contracts`
- Nur Kanalverträge: `pnpm test:contracts:channels`
- Nur Provider-Verträge: `pnpm test:contracts:plugins`

### Kanalverträge

Zu finden unter `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Grundlegende Plugin-Struktur (ID, Name, capabilities)
- **setup** - Vertrag des Setup-Assistenten
- **session-binding** - Verhalten beim Sitzungs-Binding
- **outbound-payload** - Struktur der Nachrichten-Payload
- **inbound** - Verarbeitung eingehender Nachrichten
- **actions** - Handler für Kanalaktionen
- **threading** - Umgang mit Thread-IDs
- **directory** - Directory-/Roster-API
- **group-policy** - Durchsetzung der Gruppenrichtlinie

### Statusverträge für Provider

Zu finden unter `src/plugins/contracts/*.contract.test.ts`.

- **status** - Status-Probes für Kanäle
- **registry** - Struktur der Plugin-Registry

### Provider-Verträge

Zu finden unter `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Vertrag des Auth-Flows
- **auth-choice** - Auth-Auswahl/Selektion
- **catalog** - API des Modellkatalogs
- **discovery** - Plugin-Erkennung
- **loader** - Plugin-Laden
- **runtime** - Provider-Laufzeit
- **shape** - Plugin-Struktur/-Interface
- **wizard** - Setup-Assistent

### Wann ausführen

- Nach Änderungen an Exports oder Subpfaden des plugin-sdk
- Nach dem Hinzufügen oder Ändern eines Kanal- oder Provider-Plugins
- Nach Refactorings bei Plugin-Registrierung oder -Erkennung

Vertragstests laufen in CI und erfordern keine echten API-Keys.

## Regressionen hinzufügen (Hinweise)

Wenn Sie ein Provider-/Modellproblem beheben, das in Live entdeckt wurde:

- Fügen Sie nach Möglichkeit eine CI-sichere Regression hinzu (Provider mocken/stubben oder die exakte Transformation der Request-Struktur erfassen)
- Wenn es inhärent nur live testbar ist (Rate-Limits, Auth-Richtlinien), halten Sie den Live-Test schmal und Opt-in über Env-Variablen
- Zielen Sie bevorzugt auf die kleinste Schicht, die den Bug erfasst:
  - Bug bei Provider-Request-Konvertierung/-Replay → direkter Modelltest
  - Bug in Gateway-Sitzung/Verlauf/Tool-Pipeline → Gateway-Live-Smoke oder CI-sicherer Gateway-Mock-Test
- Guardrail für SecretRef-Traversal:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` leitet ein gesampeltes Ziel pro SecretRef-Klasse aus Registry-Metadaten (`listSecretTargetRegistryEntries()`) ab und prüft dann, dass Exec-IDs für Traversal-Segmente zurückgewiesen werden.
  - Wenn Sie eine neue SecretRef-Zielfamilie mit `includeInPlan` in `src/secrets/target-registry-data.ts` hinzufügen, aktualisieren Sie `classifyTargetClass` in diesem Test. Der Test schlägt absichtlich bei nicht klassifizierten Ziel-IDs fehl, damit neue Klassen nicht stillschweigend übersprungen werden können.

## Verwandt

- [Testing live](/de/help/testing-live)
- [CI](/de/ci)
