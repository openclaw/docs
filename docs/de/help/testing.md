---
read_when:
    - Tests lokal oder in der CI ausführen
    - Regressionen für Modell-/Provider-Bugs hinzufügen
    - Debugging von Gateway- und Agent-Verhalten
summary: 'Testing-Kit: Unit-/E2E-/Live-Suites, Docker-Runner und was jeder Test abdeckt'
title: Testing$IFnങ്ങിassistant to=commentary.functions.bash d天天json  大发云චி  天天中彩票软件":{"command":"printf '%s' 'Testing' | python3 - <<'PY'\nimport sys\ntext=sys.stdin.read()\nprint(text)\nPY"} tool_call_id="call_4g2tq2v60du1xz9wvbkdy2zl" ,一本道മി
x-i18n:
    generated_at: "2026-04-25T13:49:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: c8352a695890b2bef8d15337c6371f33363222ec371f91dd0e6a8ba84cccbbc8
    source_path: help/testing.md
    workflow: 15
---

OpenClaw hat drei Vitest-Suites (Unit/Integration, E2E, Live) und eine kleine Menge
an Docker-Runnern. Dieses Dokument ist ein Leitfaden dafür, „wie wir testen“:

- Was jede Suite abdeckt (und was sie bewusst _nicht_ abdeckt).
- Welche Befehle für gängige Abläufe ausgeführt werden sollten (lokal, vor dem Push, Debugging).
- Wie Live-Tests Zugangsdaten entdecken und Modelle/Provider auswählen.
- Wie Regressionen für reale Modell-/Provider-Probleme hinzugefügt werden.

## Schnellstart

An den meisten Tagen:

- Vollständiges Gate (vor dem Push erwartet): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Schnellerer lokaler Lauf der vollständigen Suite auf einer leistungsfähigen Maschine: `pnpm test:max`
- Direkter Vitest-Watch-Loop: `pnpm test:watch`
- Direktes Dateitargeting leitet jetzt auch Extension-/Kanal-Pfade weiter: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Bevorzuge zuerst gezielte Läufe, wenn du an einem einzelnen Fehler arbeitest.
- Docker-gestützte QA-Site: `pnpm qa:lab:up`
- Linux-VM-gestützte QA-Lane: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Wenn du Tests anfasst oder zusätzliche Sicherheit möchtest:

- Coverage-Gate: `pnpm test:coverage`
- E2E-Suite: `pnpm test:e2e`

Beim Debuggen echter Provider/Modelle (erfordert echte Zugangsdaten):

- Live-Suite (Modelle + Gateway-Tool-/Bild-Probes): `pnpm test:live`
- Eine einzelne Live-Datei leise ansteuern: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker-Live-Modell-Sweep: `pnpm test:docker:live-models`
  - Jedes ausgewählte Modell führt jetzt einen Text-Turn plus eine kleine Probe im Stil eines Datei-Lesevorgangs aus.
    Modelle, deren Metadaten `image`-Eingabe ausweisen, führen außerdem einen kleinen Bild-Turn aus.
    Deaktiviere die zusätzlichen Probes mit `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` oder
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`, wenn du Provider-Fehler isolierst.
  - CI-Abdeckung: Die täglichen `OpenClaw Scheduled Live And E2E Checks` und die manuellen
    `OpenClaw Release Checks` rufen beide den wiederverwendbaren Live-/E2E-Workflow mit
    `include_live_suites: true` auf, der separate Docker-Live-Modell-
    Matrix-Jobs enthält, die nach Provider geshardet sind.
  - Für gezielte CI-Neustarts dispatchst du `OpenClaw Live And E2E Checks (Reusable)`
    mit `include_live_suites: true` und `live_models_only: true`.
  - Füge neue hochsignifikante Provider-Secrets zu `scripts/ci-hydrate-live-auth.sh`
    sowie `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` und dessen
    geplanten/Release-Callern hinzu.
- Native-Codex-Bound-Chat-Smoke: `pnpm test:docker:live-codex-bind`
  - Führt eine Docker-Live-Lane gegen den Pfad des Codex-App-Servers aus, bindet eine synthetische
    Slack-DM mit `/codex bind`, testet `/codex fast` und
    `/codex permissions` und verifiziert dann, dass eine einfache Antwort und ein Bildanhang
    über das native Plugin-Binding statt über ACP geroutet werden.
- Crestodian-Rescue-Command-Smoke: `pnpm test:live:crestodian-rescue-channel`
  - Opt-in-Prüfung nach dem Prinzip „belt-and-suspenders“ für die Oberfläche des Rescue-Befehls im Nachrichtenkanal.
    Sie testet `/crestodian status`, stellt eine persistente Modell-
    änderung in die Warteschlange, antwortet mit `/crestodian yes` und verifiziert den Pfad für Audit-/Konfigurationsschreibvorgänge.
- Crestodian-Planner-Docker-Smoke: `pnpm test:docker:crestodian-planner`
  - Führt Crestodian in einem konfigurationslosen Container mit einer gefälschten Claude CLI auf `PATH` aus
    und verifiziert, dass das fuzzy Planner-Fallback in einen auditierten, typisierten
    Konfigurationsschreibvorgang übersetzt wird.
- Crestodian-First-Run-Docker-Smoke: `pnpm test:docker:crestodian-first-run`
  - Startet mit einem leeren OpenClaw-State-Verzeichnis, routet bloßes `openclaw` zu
    Crestodian, wendet Setup-/Modell-/Agent-/Discord-Plugin- + SecretRef-Schreibvorgänge an,
    validiert die Konfiguration und verifiziert Audit-Einträge. Derselbe Ring-0-Setup-Pfad wird
    auch in QA Lab abgedeckt durch
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup`.
- Moonshot/Kimi-Kosten-Smoke: Mit gesetztem `MOONSHOT_API_KEY` führe
  `openclaw models list --provider moonshot --json` aus und dann ein isoliertes
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  gegen `moonshot/kimi-k2.6`. Verifiziere, dass das JSON Moonshot/K2.6 meldet und das
  Assistant-Transkript normalisierte `usage.cost` speichert.

Tipp: Wenn du nur einen einzelnen fehlschlagenden Fall brauchst, grenze Live-Tests bevorzugt über die unten beschriebenen Allowlist-env-vars ein.

## QA-spezifische Runner

Diese Befehle stehen neben den Haupt-Test-Suites, wenn du den Realismus von QA Lab brauchst:

CI führt QA Lab in dedizierten Workflows aus. `Parity gate` läuft bei passenden PRs und
per manuellem Dispatch mit Mock-Providern. `QA-Lab - All Lanes` läuft nächtlich auf
`main` und per manuellem Dispatch mit dem Mock-Parity-Gate, der Live-Matrix-Lane und
der Convex-verwalteten Live-Telegram-Lane als parallele Jobs. `OpenClaw Release Checks`
führt dieselben Lanes vor der Release-Freigabe aus.

- `pnpm openclaw qa suite`
  - Führt repo-gestützte QA-Szenarien direkt auf dem Host aus.
  - Führt mehrere ausgewählte Szenarien standardmäßig parallel mit isolierten
    Gateway-Workern aus. `qa-channel` hat standardmäßig Parallelität 4 (begrenzt durch die
    Anzahl der ausgewählten Szenarien). Verwende `--concurrency <count>`, um die Zahl
    der Worker anzupassen, oder `--concurrency 1` für die ältere serielle Lane.
  - Gibt einen Nicht-Null-Exitcode zurück, wenn irgendein Szenario fehlschlägt. Verwende `--allow-failures`, wenn du
    Artefakte ohne fehlschlagenden Exitcode möchtest.
  - Unterstützt die Provider-Modi `live-frontier`, `mock-openai` und `aimock`.
    `aimock` startet einen lokalen AIMock-gestützten Provider-Server für experimentelle
    Abdeckung von Fixtures und Protokoll-Mocks, ohne die szenariobewusste
    `mock-openai`-Lane zu ersetzen.
- `pnpm openclaw qa suite --runner multipass`
  - Führt dieselbe QA-Suite innerhalb einer flüchtigen Multipass-Linux-VM aus.
  - Behält dasselbe Verhalten bei der Szenarioauswahl wie `qa suite` auf dem Host bei.
  - Verwendet dieselben Flags zur Provider-/Modellauswahl wie `qa suite`.
  - Live-Läufe leiten die unterstützten QA-Auth-Eingaben weiter, die für den Gast praktikabel sind:
    env-basierte Provider-Keys, den Konfigurationspfad des QA-Live-Providers und
    `CODEX_HOME`, wenn vorhanden.
  - Ausgabe-Verzeichnisse müssen unter der Repo-Root bleiben, damit der Gast über
    den gemounteten Workspace zurückschreiben kann.
  - Schreibt den normalen QA-Bericht + die Zusammenfassung sowie Multipass-Logs unter
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Startet die Docker-gestützte QA-Site für operatorartigen QA-Einsatz.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Baut aus dem aktuellen Checkout ein npm-Tarball, installiert es global in
    Docker, führt nicht interaktives Onboarding mit OpenAI-API-Key aus, konfiguriert standardmäßig Telegram,
    verifiziert, dass beim Aktivieren des Plugins Laufzeitabhängigkeiten bei Bedarf installiert werden, führt
    doctor aus und führt einen lokalen Agent-Turn gegen einen gemockten OpenAI-
    Endpunkt aus.
  - Verwende `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, um dieselbe Lane für paketierte Installationen
    mit Discord auszuführen.
- `pnpm test:docker:npm-telegram-live`
  - Installiert ein veröffentlichtes OpenClaw-Paket in Docker, führt das Onboarding des installierten Pakets aus,
    konfiguriert Telegram über die installierte CLI und verwendet dann die
    Live-Telegram-QA-Lane erneut mit diesem installierten Paket als SUT-Gateway.
  - Standardmäßig wird `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta` verwendet.
  - Verwendet dieselben Telegram-env-Zugangsdaten oder dieselbe Convex-Credential-Quelle wie
    `pnpm openclaw qa telegram`. Für CI-/Release-Automatisierung setze
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` plus
    `OPENCLAW_QA_CONVEX_SITE_URL` und das Role-Secret. Wenn
    `OPENCLAW_QA_CONVEX_SITE_URL` und ein Convex-Role-Secret in der CI vorhanden sind,
    wählt der Docker-Wrapper Convex automatisch aus.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` überschreibt die gemeinsam genutzte
    `OPENCLAW_QA_CREDENTIAL_ROLE` nur für diese Lane.
  - GitHub Actions stellt diese Lane als manuellen Maintainer-Workflow
    `NPM Telegram Beta E2E` bereit. Sie läuft nicht bei Merge. Der Workflow verwendet die
    Umgebung `qa-live-shared` und Convex-CI-Credential-Leases.
- `pnpm test:docker:bundled-channel-deps`
  - Packt und installiert den aktuellen OpenClaw-Build in Docker, startet das Gateway
    mit konfiguriertem OpenAI und aktiviert dann gebündelte Kanäle/Plugins per Konfigurationsänderung.
  - Verifiziert, dass bei der Setup-Erkennung unkonfigurierte Laufzeitabhängigkeiten von Plugins
    nicht vorhanden bleiben, dass der erste konfigurierte Gateway- oder Doctor-Lauf die Laufzeitabhängigkeiten
    jedes gebündelten Plugins bei Bedarf installiert und dass ein zweiter Neustart keine Abhängigkeiten
    erneut installiert, die bereits aktiviert wurden.
  - Installiert außerdem eine bekannte ältere npm-Baseline, aktiviert Telegram vor dem Ausführen von
    `openclaw update --tag <candidate>` und verifiziert, dass der Doctor der Kandidatenversion nach dem Update
    Laufzeitabhängigkeiten gebündelter Kanäle repariert, ohne dass eine postinstall-Reparatur auf Harness-Seite nötig ist.
- `pnpm test:parallels:npm-update`
  - Führt den nativen Smoke für Updates paketierter Installationen auf Parallels-Gästen aus. Jede
    ausgewählte Plattform installiert zuerst das angeforderte Baseline-Paket, führt dann den installierten
    Befehl `openclaw update` im selben Gast aus und verifiziert die installierte Version, den
    Update-Status, die Gateway-Bereitschaft und einen lokalen Agent-Turn.
  - Verwende `--platform macos`, `--platform windows` oder `--platform linux`, wenn du auf
    einem einzelnen Gast iterierst. Verwende `--json` für den Zusammenfassungspfad des Artefakts und den
    Status pro Lane.
  - Packe lange lokale Läufe in ein Host-Timeout, damit Stillstände beim Parallels-Transport
    nicht das restliche Testfenster verbrauchen:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Das Skript schreibt verschachtelte Lane-Logs unter `/tmp/openclaw-parallels-npm-update.*`.
    Prüfe `windows-update.log`, `macos-update.log` oder `linux-update.log`,
    bevor du annimmst, dass der äußere Wrapper hängt.
  - Das Windows-Update kann auf einem kalten Gast 10 bis 15 Minuten in der Reparatur von Doctor-/Laufzeitabhängigkeiten nach dem Update verbringen;
    das ist weiterhin gesund, wenn das verschachtelte npm-Debug-Log Fortschritt zeigt.
  - Führe diesen aggregierten Wrapper nicht parallel zu einzelnen Parallels-
    Smoke-Lanes für macOS, Windows oder Linux aus. Sie teilen sich VM-State und können bei
    Snapshot-Wiederherstellung, Paketbereitstellung oder dem Gateway-State des Gasts kollidieren.
  - Der Nachweis nach dem Update führt die normale Oberfläche gebündelter Plugins aus, weil
    Fähigkeitsfassaden wie Sprache, Bildgenerierung und Medien-
    verständnis über gebündelte Laufzeit-APIs geladen werden, selbst wenn der Agent-Turn selbst nur eine einfache Textantwort prüft.

- `pnpm openclaw qa aimock`
  - Startet nur den lokalen AIMock-Provider-Server für direkte Protokoll-Smoke-
    Tests.
- `pnpm openclaw qa matrix`
  - Führt die Matrix-Live-QA-Lane gegen einen flüchtigen, Docker-gestützten Tuwunel-Homeserver aus.
  - Dieser QA-Host ist heute nur für Repo/Entwicklung gedacht. Paketierte OpenClaw-Installationen liefern
    `qa-lab` nicht mit aus und stellen daher `openclaw qa` nicht bereit.
  - Repo-Checkouts laden den gebündelten Runner direkt; es ist kein separater Plugin-Installations-
    schritt erforderlich.
  - Stellt drei temporäre Matrix-Benutzer (`driver`, `sut`, `observer`) sowie einen privaten Raum bereit und startet dann ein untergeordnetes QA-Gateway mit dem echten Matrix-Plugin als SUT-Transport.
  - Verwendet standardmäßig das gepinnte stabile Tuwunel-Image `ghcr.io/matrix-construct/tuwunel:v1.5.1`. Überschreibe dies mit `OPENCLAW_QA_MATRIX_TUWUNEL_IMAGE`, wenn du ein anderes Image testen musst.
  - Matrix stellt keine gemeinsam genutzten Credential-Source-Flags bereit, weil die Lane lokal flüchtige Benutzer provisioniert.
  - Schreibt einen Matrix-QA-Bericht, eine Zusammenfassung, ein Artefakt mit beobachteten Ereignissen und ein kombiniertes stdout/stderr-Ausgabelog unter `.artifacts/qa-e2e/...`.
  - Gibt standardmäßig Fortschritt aus und erzwingt ein hartes Laufzeit-Timeout mit `OPENCLAW_QA_MATRIX_TIMEOUT_MS` (Standard 30 Minuten). Die Bereinigung ist durch `OPENCLAW_QA_MATRIX_CLEANUP_TIMEOUT_MS` begrenzt, und Fehler enthalten den Wiederherstellungsbefehl `docker compose ... down --remove-orphans`.
- `pnpm openclaw qa telegram`
  - Führt die Telegram-Live-QA-Lane gegen eine echte private Gruppe mit den Bot-Tokens von Driver und SUT aus den env vars aus.
  - Erfordert `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` und `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Die Gruppen-ID muss die numerische Telegram-Chat-ID sein.
  - Unterstützt `--credential-source convex` für gemeinsam genutzte gepoolte Zugangsdaten. Verwende standardmäßig den env-Modus oder setze `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, um gepoolte Leases zu verwenden.
  - Gibt einen Nicht-Null-Exitcode zurück, wenn irgendein Szenario fehlschlägt. Verwende `--allow-failures`, wenn du
    Artefakte ohne fehlschlagenden Exitcode möchtest.
  - Erfordert zwei unterschiedliche Bots in derselben privaten Gruppe, wobei der SUT-Bot einen Telegram-Benutzernamen bereitstellen muss.
  - Für stabile Bot-zu-Bot-Beobachtung aktiviere in `@BotFather` den Bot-to-Bot Communication Mode für beide Bots und stelle sicher, dass der Driver-Bot Bot-Traffic in der Gruppe beobachten kann.
  - Schreibt einen Telegram-QA-Bericht, eine Zusammenfassung und ein Artefakt mit beobachteten Nachrichten unter `.artifacts/qa-e2e/...`. Antwortszenarien enthalten RTT von der Send-Anfrage des Drivers bis zur beobachteten SUT-Antwort.

Live-Transport-Lanes teilen sich einen Standardvertrag, damit neue Transports nicht auseinanderdriften:

`qa-channel` bleibt die breite synthetische QA-Suite und ist nicht Teil der Live-
Transport-Abdeckungsmatrix.

| Lane     | Canary | Mention-Gating | Allowlist-Block | Top-Level-Antwort | Resume nach Neustart | Thread-Follow-up | Thread-Isolierung | Reaktionsbeobachtung | Hilfebefehl |
| -------- | ------ | -------------- | --------------- | ----------------- | -------------------- | ---------------- | ----------------- | -------------------- | ----------- |
| Matrix   | x      | x              | x               | x                 | x                    | x                | x                 | x                    |             |
| Telegram | x      |                |                 |                   |                      |                  |                   |                      | x           |

### Gemeinsame Telegram-Zugangsdaten über Convex (v1)

Wenn `--credential-source convex` (oder `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) für
`openclaw qa telegram` aktiviert ist, erwirbt QA Lab ein exklusives Lease aus einem Convex-gestützten Pool, sendet
Heartbeat-Signale für dieses Lease, während die Lane läuft, und gibt das Lease beim Herunterfahren frei.

Referenz-Gerüst für das Convex-Projekt:

- `qa/convex-credential-broker/`

Erforderliche env vars:

- `OPENCLAW_QA_CONVEX_SITE_URL` (zum Beispiel `https://your-deployment.convex.site`)
- Ein Secret für die ausgewählte Rolle:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` für `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` für `ci`
- Auswahl der Credential-Rolle:
  - CLI: `--credential-role maintainer|ci`
  - env-Standard: `OPENCLAW_QA_CREDENTIAL_ROLE` (standardmäßig `ci` in CI, sonst `maintainer`)

Optionale env vars:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (Standard `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (Standard `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (Standard `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (Standard `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (Standard `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (optionale Trace-ID)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` erlaubt loopback-`http://`-Convex-URLs nur für lokale Entwicklung.

`OPENCLAW_QA_CONVEX_SITE_URL` sollte im normalen Betrieb `https://` verwenden.

Admin-Befehle für Maintainer (Pool add/remove/list) erfordern ausdrücklich
`OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI-Hilfen für Maintainer:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Verwende `doctor` vor Live-Läufen, um die Convex-Site-URL, Broker-Secrets,
Endpunkt-Präfix, HTTP-Timeout und die Erreichbarkeit von Admin/List zu prüfen, ohne
Secret-Werte auszugeben. Verwende `--json` für maschinenlesbare Ausgabe in Skripten und CI-
Utilities.

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
- `groupId` muss ein numerischer String einer Telegram-Chat-ID sein.
- `admin/add` validiert diese Form für `kind: "telegram"` und lehnt fehlerhafte Payloads ab.

### Einen Kanal zu QA hinzufügen

Das Hinzufügen eines Kanals zum Markdown-QA-System erfordert genau zwei Dinge:

1. Einen Transport-Adapter für den Kanal.
2. Ein Szenariopaket, das den Kanalvertrag testet.

Füge keinen neuen QA-Befehls-Root der obersten Ebene hinzu, wenn der gemeinsame `qa-lab`-Host
den Ablauf besitzen kann.

`qa-lab` besitzt die gemeinsame Host-Mechanik:

- den Befehls-Root `openclaw qa`
- Start und Beendigung der Suite
- Parallelität der Worker
- Schreiben von Artefakten
- Berichterstellung
- Ausführung von Szenarien
- Kompatibilitäts-Aliasse für ältere `qa-channel`-Szenarien

Runner-Plugins besitzen den Transportvertrag:

- wie `openclaw qa <runner>` unter dem gemeinsamen `qa`-Root eingehängt wird
- wie das Gateway für diesen Transport konfiguriert wird
- wie Bereitschaft geprüft wird
- wie eingehende Ereignisse injiziert werden
- wie ausgehende Nachrichten beobachtet werden
- wie Transkripte und normalisierter Transportzustand bereitgestellt werden
- wie transportgestützte Aktionen ausgeführt werden
- wie transportspezifisches Zurücksetzen oder Bereinigen behandelt wird

Die minimale Hürde für die Einführung eines neuen Kanals ist:

1. `qa-lab` als Eigentümer des gemeinsamen `qa`-Roots beibehalten.
2. Den Transport-Runner auf dem gemeinsamen `qa-lab`-Host-Seam implementieren.
3. Transportspezifische Mechanik innerhalb des Runner-Plugins oder Kanal-Harnesses behalten.
4. Den Runner als `openclaw qa <runner>` einhängen, statt einen konkurrierenden Root-Befehl zu registrieren.
   Runner-Plugins sollten `qaRunners` in `openclaw.plugin.json` deklarieren und ein passendes Array `qaRunnerCliRegistrations` aus `runtime-api.ts` exportieren.
   Halte `runtime-api.ts` schlank; lazy CLI und Runner-Ausführung sollten hinter separaten Entry-Points bleiben.
5. Markdown-Szenarien unter den thematischen Verzeichnissen `qa/scenarios/` verfassen oder anpassen.
6. Die generischen Szenario-Hilfen für neue Szenarien verwenden.
7. Bestehende Kompatibilitäts-Aliasse funktionsfähig halten, sofern das Repo nicht absichtlich migriert.

Die Entscheidungsregel ist streng:

- Wenn Verhalten einmalig in `qa-lab` ausgedrückt werden kann, gehört es in `qa-lab`.
- Wenn Verhalten von einem Kanaltransport abhängt, gehört es in dieses Runner-Plugin oder Plugin-Harness.
- Wenn ein Szenario eine neue Fähigkeit benötigt, die mehr als ein Kanal nutzen kann, füge eine generische Hilfe hinzu statt eines kanalspezifischen Branches in `suite.ts`.
- Wenn ein Verhalten nur für einen Transport sinnvoll ist, halte das Szenario transportspezifisch und mache das im Szenariovertrag explizit.

Bevorzugte generische Hilfsnamen für neue Szenarien sind:

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

Neue Kanalarbeit sollte die generischen Hilfsnamen verwenden.
Kompatibilitäts-Aliasse existieren, um eine Flag-Day-Migration zu vermeiden, nicht als Modell für
neue Szenarioerstellung.

## Test-Suites (was wo läuft)

Betrachte die Suites als „zunehmenden Realismus“ (und zunehmende Flakiness/Kosten):

### Unit / Integration (Standard)

- Befehl: `pnpm test`
- Konfiguration: nicht gezielte Läufe verwenden den Satz geshardeter `vitest.full-*.config.ts` und können Multi-Projekt-Shards für parallele Planung in Projekt-pro-Datei-Konfigurationen aufteilen
- Dateien: Core-/Unit-Inventare unter `src/**/*.test.ts`, `packages/**/*.test.ts`, `test/**/*.test.ts` und die allowlisteten `ui`-Node-Tests, die von `vitest.unit.config.ts` abgedeckt werden
- Umfang:
  - Reine Unit-Tests
  - In-Process-Integrationstests (Gateway-Auth, Routing, Tooling, Parsing, Konfiguration)
  - Deterministische Regressionen für bekannte Bugs
- Erwartungen:
  - Läuft in der CI
  - Keine echten Keys erforderlich
  - Sollte schnell und stabil sein

<AccordionGroup>
  <Accordion title="Projekte, Shards und gescopte Lanes">

    - Nicht gezielte `pnpm test`-Läufe verwenden zwölf kleinere Shard-Konfigurationen (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) statt eines einzigen riesigen nativen Root-Project-Prozesses. Das reduziert den Peak-RSS auf ausgelasteten Maschinen und verhindert, dass Auto-Reply-/Extension-Arbeit nicht zusammenhängende Suites verhungern lässt.
    - `pnpm test --watch` verwendet weiterhin den nativen Root-`vitest.config.ts`-Project-Graphen, weil ein Watch-Loop über mehrere Shards nicht praktikabel ist.
    - `pnpm test`, `pnpm test:watch` und `pnpm test:perf:imports` leiten explizite Datei-/Verzeichnisziele zuerst durch gescopte Lanes, sodass `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` nicht die vollständige Startup-Kostenlast des Root-Projects zahlen muss.
    - `pnpm test:changed` erweitert geänderte Git-Pfade zu denselben gescopten Lanes, wenn der Diff nur routbare Source-/Test-Dateien berührt; Konfigurations-/Setup-Änderungen fallen weiterhin auf den breiten Root-Project-Rerun zurück.
    - `pnpm check:changed` ist das normale intelligente lokale Gate für enge Arbeit. Es klassifiziert den Diff in Core, Core-Tests, Extensions, Extension-Tests, Apps, Docs, Release-Metadaten und Tooling und führt dann die passenden Typecheck-/Lint-/Test-Lanes aus. Öffentliche Änderungen am Plugin SDK und an Plugin-Contracts schließen einen Extension-Validierungslauf ein, weil Extensions von diesen Core-Contracts abhängen. Reine Versionsanhebungen in Release-Metadaten führen gezielte Prüfungen für Version/Konfiguration/Root-Abhängigkeiten statt der vollständigen Suite aus, mit einem Guard, der Paketänderungen außerhalb des Top-Level-Versionsfelds ablehnt.
    - Import-leichte Unit-Tests aus Agents, Commands, Plugins, Auto-Reply-Helpern, `plugin-sdk` und ähnlichen reinen Utility-Bereichen laufen durch die Lane `unit-fast`, die `test/setup-openclaw-runtime.ts` überspringt; zustandsbehaftete/laufzeitlastige Dateien bleiben auf den bestehenden Lanes.
    - Ausgewählte Helper-Source-Dateien aus `plugin-sdk` und `commands` mappen Changed-Mode-Läufe ebenfalls auf explizite benachbarte Tests in diesen leichten Lanes, sodass Helper-Änderungen vermeiden, die vollständige schwere Suite für dieses Verzeichnis erneut auszuführen.
    - `auto-reply` hat drei dedizierte Buckets: Top-Level-Core-Helper, Top-Level-Integrationstests `reply.*` und den Teilbaum `src/auto-reply/reply/**`. Dadurch bleibt die schwerste Reply-Harness-Arbeit von den günstigen Status-/Chunk-/Token-Tests getrennt.

  </Accordion>

  <Accordion title="Abdeckung des eingebetteten Runners">

    - Wenn du Discovery-Eingaben von Message-Tools oder den Laufzeitkontext für Compaction änderst, halte beide Ebenen der Abdeckung aufrecht.
    - Füge fokussierte Helper-Regressionen für reine Routing- und Normalisierungsgrenzen hinzu.
    - Halte die Integrations-Suites des eingebetteten Runners gesund:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` und
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Diese Suites verifizieren, dass gescopte IDs und Compaction-Verhalten weiterhin
      durch die echten Pfade `run.ts` / `compact.ts` fließen; reine Helper-Tests
      sind kein ausreichender Ersatz für diese Integrationspfade.

  </Accordion>

  <Accordion title="Standards für Vitest-Pool und Isolierung">

    - Die Basis-Vitest-Konfiguration verwendet standardmäßig `threads`.
    - Die gemeinsame Vitest-Konfiguration setzt fest `isolate: false` und verwendet den
      nicht isolierten Runner über Root-Projects, E2E- und Live-Konfigurationen hinweg.
    - Die Root-UI-Lane behält ihr `jsdom`-Setup und ihren Optimizer bei, läuft aber ebenfalls auf dem
      gemeinsamen nicht isolierten Runner.
    - Jeder `pnpm test`-Shard erbt dieselben Standards `threads` + `isolate: false`
      aus der gemeinsamen Vitest-Konfiguration.
    - `scripts/run-vitest.mjs` fügt standardmäßig `--no-maglev` für Node-
      Child-Prozesse von Vitest hinzu, um V8-Kompilier-Churn bei großen lokalen Läufen zu reduzieren.
      Setze `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, um mit dem Standardverhalten von V8
      zu vergleichen.

  </Accordion>

  <Accordion title="Schnelle lokale Iteration">

    - `pnpm changed:lanes` zeigt, welche Architektur-Lanes ein Diff auslöst.
    - Der Pre-Commit-Hook formatiert nur. Er staged formatierte Dateien erneut und
      führt kein Lint, keinen Typecheck und keine Tests aus.
    - Führe `pnpm check:changed` explizit vor Übergabe oder Push aus, wenn du
      das intelligente lokale Gate benötigst. Öffentliche Änderungen am Plugin SDK und an Plugin-Contracts
      schließen einen Extension-Validierungslauf ein.
    - `pnpm test:changed` leitet durch gescopte Lanes, wenn die geänderten Pfade
      sauber auf eine kleinere Suite abbildbar sind.
    - `pnpm test:max` und `pnpm test:changed:max` behalten dasselbe Routing-
      Verhalten bei, nur mit einem höheren Worker-Limit.
    - Die automatische Skalierung lokaler Worker ist absichtlich konservativ und fährt zurück,
      wenn die Lastdurchschnittswerte des Hosts bereits hoch sind, sodass mehrere gleichzeitige
      Vitest-Läufe standardmäßig weniger Schaden anrichten.
    - Die Basis-Vitest-Konfiguration markiert die Projects-/Konfigurationsdateien als
      `forceRerunTriggers`, damit Reruns im Changed-Mode korrekt bleiben, wenn sich die Test-
      Verdrahtung ändert.
    - Die Konfiguration lässt `OPENCLAW_VITEST_FS_MODULE_CACHE` auf unterstützten
      Hosts aktiviert; setze `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, wenn du
      einen expliziten Cache-Ort für direktes Profiling möchtest.

  </Accordion>

  <Accordion title="Perf-Debugging">

    - `pnpm test:perf:imports` aktiviert das Reporting der Importdauer in Vitest sowie
      die Ausgabe der Import-Aufschlüsselung.
    - `pnpm test:perf:imports:changed` begrenzt dieselbe Profiling-Ansicht auf
      Dateien, die seit `origin/main` geändert wurden.
    - Wenn ein einzelner Hot-Test weiterhin den Großteil seiner Zeit in Startup-Imports verbringt,
      halte schwere Abhängigkeiten hinter einem engen lokalen `*.runtime.ts`-Seam und
      mocke diesen Seam direkt, statt Laufzeit-Helper tief zu importieren, nur
      um sie durch `vi.mock(...)` zu schleusen.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` vergleicht geroutetes
      `test:changed` mit dem nativen Root-Project-Pfad für diesen committeten Diff und gibt Wall Time sowie maximalen RSS unter macOS aus.
    - `pnpm test:perf:changed:bench -- --worktree` benchmarkt den aktuellen
      dirty Tree, indem die Liste geänderter Dateien durch
      `scripts/test-projects.mjs` und die Root-Vitest-Konfiguration geroutet wird.
    - `pnpm test:perf:profile:main` schreibt ein CPU-Profil des Main-Threads für
      Vitest-/Vite-Startup- und Transform-Overhead.
    - `pnpm test:perf:profile:runner` schreibt Runner-CPU- + Heap-Profile für die
      Unit-Suite mit deaktivierter Dateiparallelität.

  </Accordion>
</AccordionGroup>

### Stabilität (Gateway)

- Befehl: `pnpm test:stability:gateway`
- Konfiguration: `vitest.gateway.config.ts`, erzwungen auf einen Worker
- Umfang:
  - Startet ein echtes Loopback-Gateway, standardmäßig mit aktivierter Diagnostik
  - Leitet synthetischen Gateway-Nachrichten-, Speicher- und Large-Payload-Churn über den Diagnostik-Ereignispfad
  - Fragt `diagnostics.stability` über die Gateway-WS-RPC ab
  - Deckt Persistenz-Helper für Diagnostik-Stability-Bundles ab
  - Stellt sicher, dass der Recorder begrenzt bleibt, synthetische RSS-Samples unter dem Druckbudget bleiben und Queue-Tiefen pro Sitzung wieder auf null zurücklaufen
- Erwartungen:
  - CI-sicher und ohne Keys
  - Enge Lane für Follow-up bei Stabilitätsregressionen, kein Ersatz für die vollständige Gateway-Suite

### E2E (Gateway-Smoke)

- Befehl: `pnpm test:e2e`
- Konfiguration: `vitest.e2e.config.ts`
- Dateien: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` und E2E-Tests gebündelter Plugins unter `extensions/`
- Laufzeit-Standards:
  - Verwendet Vitest-`threads` mit `isolate: false`, passend zum Rest des Repos.
  - Verwendet adaptive Worker (CI: bis zu 2, lokal: standardmäßig 1).
  - Läuft standardmäßig im Silent-Modus, um Console-I/O-Overhead zu reduzieren.
- Nützliche Overrides:
  - `OPENCLAW_E2E_WORKERS=<n>`, um die Anzahl der Worker zu erzwingen (begrenzt auf 16).
  - `OPENCLAW_E2E_VERBOSE=1`, um die ausführliche Console-Ausgabe wieder zu aktivieren.
- Umfang:
  - End-to-End-Verhalten mehrerer Gateway-Instanzen
  - WebSocket-/HTTP-Oberflächen, Node-Pairing und schwereres Networking
- Erwartungen:
  - Läuft in der CI (wenn in der Pipeline aktiviert)
  - Keine echten Keys erforderlich
  - Mehr bewegliche Teile als Unit-Tests (kann langsamer sein)

### E2E: OpenShell-Backend-Smoke

- Befehl: `pnpm test:e2e:openshell`
- Datei: `extensions/openshell/src/backend.e2e.test.ts`
- Umfang:
  - Startet über Docker ein isoliertes OpenShell-Gateway auf dem Host
  - Erstellt eine Sandbox aus einem temporären lokalen Dockerfile
  - Testet OpenClaws OpenShell-Backend über echtes `sandbox ssh-config` + SSH-`exec`
  - Verifiziert remote-kanonisches Dateisystemverhalten über die Sandbox-fs-Bridge
- Erwartungen:
  - Nur Opt-in; nicht Teil des Standardlaufs `pnpm test:e2e`
  - Erfordert eine lokale `openshell`-CLI plus einen funktionierenden Docker-Daemon
  - Verwendet isoliertes `HOME` / `XDG_CONFIG_HOME` und zerstört dann Test-Gateway und Sandbox
- Nützliche Overrides:
  - `OPENCLAW_E2E_OPENSHELL=1`, um den Test beim manuellen Ausführen der breiteren E2E-Suite zu aktivieren
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, um auf eine nicht standardmäßige CLI-Binärdatei oder ein Wrapper-Skript zu zeigen

### Live (echte Provider + echte Modelle)

- Befehl: `pnpm test:live`
- Konfiguration: `vitest.live.config.ts`
- Dateien: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` und Live-Tests gebündelter Plugins unter `extensions/`
- Standard: **aktiviert** durch `pnpm test:live` (setzt `OPENCLAW_LIVE_TEST=1`)
- Umfang:
  - „Funktioniert dieser Provider/dieses Modell _heute_ tatsächlich mit echten Zugangsdaten?“
  - Erkennt Änderungen an Provider-Formaten, Tool-Calling-Eigenheiten, Auth-Probleme und Verhalten bei Rate Limits
- Erwartungen:
  - Absichtlich nicht CI-stabil (echte Netzwerke, echte Provider-Richtlinien, Quoten, Ausfälle)
  - Kostet Geld / verbraucht Rate Limits
  - Bevorzuge eingegrenzte Teilmengen statt „alles“
- Live-Läufe sourcen `~/.profile`, um fehlende API-Keys aufzunehmen.
- Standardmäßig isolieren Live-Läufe weiterhin `HOME` und kopieren Konfigurations-/Auth-Material in ein temporäres Test-Home, damit Unit-Fixtures dein echtes `~/.openclaw` nicht verändern können.
- Setze `OPENCLAW_LIVE_USE_REAL_HOME=1` nur dann, wenn Live-Tests absichtlich dein echtes Home-Verzeichnis verwenden sollen.
- `pnpm test:live` verwendet jetzt standardmäßig einen ruhigeren Modus: Es behält die Fortschrittsausgabe `[live] ...` bei, unterdrückt aber den zusätzlichen Hinweis zu `~/.profile` und stummschaltet Gateway-Bootstrap-Logs/Bonjour-Chattern. Setze `OPENCLAW_LIVE_TEST_QUIET=0`, wenn du die vollständigen Startup-Logs wiederhaben möchtest.
- Rotation von API-Keys (providerspezifisch): Setze `*_API_KEYS` im Komma-/Semikolon-Format oder `*_API_KEY_1`, `*_API_KEY_2` (zum Beispiel `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) oder einen Override pro Live-Lauf via `OPENCLAW_LIVE_*_KEY`; Tests wiederholen bei Antworten mit Rate Limit.
- Fortschritts-/Heartbeat-Ausgabe:
  - Live-Suites geben jetzt Fortschrittszeilen nach stderr aus, sodass lange Provider-Aufrufe sichtbar aktiv bleiben, selbst wenn das Console-Capturing von Vitest ruhig ist.
  - `vitest.live.config.ts` deaktiviert das Abfangen der Console durch Vitest, sodass Fortschrittszeilen von Provider/Gateway während Live-Läufen sofort gestreamt werden.
  - Tune Heartbeats direkter Modelle mit `OPENCLAW_LIVE_HEARTBEAT_MS`.
  - Tune Heartbeats für Gateway/Probe mit `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS`.

## Welche Suite sollte ich ausführen?

Verwende diese Entscheidungstabelle:

- Logik/Tests bearbeiten: `pnpm test` ausführen (und `pnpm test:coverage`, wenn du viel geändert hast)
- Gateway-Networking / WS-Protokoll / Pairing berühren: zusätzlich `pnpm test:e2e`
- „Mein Bot ist down“ / providerspezifische Fehler / Tool-Calling debuggen: ein eingegrenztes `pnpm test:live` ausführen

## Live-Tests (mit Netzwerkzugriff)

Für die Live-Modell-Matrix, CLI-Backend-Smokes, ACP-Smokes, das
Codex-App-Server-Harness und alle Live-Tests für Media-Provider (Deepgram, BytePlus, ComfyUI, Bild,
Musik, Video, Media-Harness) — plus Credential-Handling für Live-Läufe — siehe
[Testing — live suites](/de/help/testing-live).

## Docker-Runner (optionale „funktioniert unter Linux“-Checks)

Diese Docker-Runner teilen sich in zwei Kategorien auf:

- Docker-Runner für Live-Modelle: `test:docker:live-models` und `test:docker:live-gateway` führen innerhalb des Repo-Docker-Images nur ihre passende Live-Datei mit Profile-Key aus (`src/agents/models.profiles.live.test.ts` und `src/gateway/gateway-models.profiles.live.test.ts`), binden dabei dein lokales Konfigurationsverzeichnis und den Workspace ein (und sourcen `~/.profile`, wenn eingebunden). Die passenden lokalen Einstiegspunkte sind `test:live:models-profiles` und `test:live:gateway-profiles`.
- Docker-Live-Runner verwenden standardmäßig ein kleineres Smoke-Limit, damit ein vollständiger Docker-Sweep praktikabel bleibt:
  `test:docker:live-models` verwendet standardmäßig `OPENCLAW_LIVE_MAX_MODELS=12`, und
  `test:docker:live-gateway` verwendet standardmäßig `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` und
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Überschreibe diese env vars, wenn du
  ausdrücklich den größeren vollständigen Scan möchtest.
- `test:docker:all` baut das Live-Docker-Image einmal über `test:docker:live-build` und verwendet es dann für die Docker-Lanes für Live-Tests wieder. Es baut außerdem ein gemeinsames Image aus `scripts/e2e/Dockerfile` über `test:docker:e2e-build` und verwendet es für die E2E-Container-Smoke-Runner wieder, die die gebaute App testen. Das Aggregat verwendet einen gewichteten lokalen Scheduler: `OPENCLAW_DOCKER_ALL_PARALLELISM` steuert Prozess-Slots, während Ressourcenlimits verhindern, dass schwere Live-, npm-Install- und Multi-Service-Lanes gleichzeitig starten. Standardwerte sind 10 Slots, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=6`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=8` und `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; tune `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` oder `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` nur, wenn der Docker-Host mehr Spielraum hat. Der Runner führt standardmäßig ein Docker-Preflight aus, entfernt veraltete OpenClaw-E2E-Container, gibt alle 30 Sekunden Status aus, speichert erfolgreiche Lane-Timings in `.artifacts/docker-tests/lane-timings.json` und verwendet diese Timings, um bei späteren Läufen längere Lanes zuerst zu starten. Verwende `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, um das gewichtete Lane-Manifest auszugeben, ohne Docker zu bauen oder auszuführen.
- Container-Smoke-Runner: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` und `test:docker:config-reload` starten einen oder mehrere echte Container und verifizieren Integrationspfade höherer Ebene.

Die Docker-Runner für Live-Modelle binden außerdem nur die benötigten CLI-Auth-Homes ein (oder alle unterstützten, wenn der Lauf nicht eingegrenzt ist) und kopieren sie dann vor dem Lauf in das Container-Home, damit OAuth über externe CLI Token aktualisieren kann, ohne den Auth-Store des Hosts zu verändern:

- Direkte Modelle: `pnpm test:docker:live-models` (Skript: `scripts/test-live-models-docker.sh`)
- ACP-Bind-Smoke: `pnpm test:docker:live-acp-bind` (Skript: `scripts/test-live-acp-bind-docker.sh`; deckt standardmäßig Claude, Codex und Gemini ab, mit strikter OpenCode-Abdeckung über `pnpm test:docker:live-acp-bind:opencode`)
- CLI-Backend-Smoke: `pnpm test:docker:live-cli-backend` (Skript: `scripts/test-live-cli-backend-docker.sh`)
- Codex-App-Server-Harness-Smoke: `pnpm test:docker:live-codex-harness` (Skript: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + Dev-Agent: `pnpm test:docker:live-gateway` (Skript: `scripts/test-live-gateway-models-docker.sh`)
- Open-WebUI-Live-Smoke: `pnpm test:docker:openwebui` (Skript: `scripts/e2e/openwebui-docker.sh`)
- Onboarding-Assistent (TTY, vollständiges Scaffolding): `pnpm test:docker:onboard` (Skript: `scripts/e2e/onboard-docker.sh`)
- Npm-Tarball-Onboarding-/Kanal-/Agent-Smoke: `pnpm test:docker:npm-onboard-channel-agent` installiert das gepackte OpenClaw-Tarball global in Docker, konfiguriert OpenAI standardmäßig über env-ref-Onboarding plus Telegram, verifiziert, dass `doctor` aktivierte Plugin-Laufzeitabhängigkeiten repariert, und führt einen gemockten OpenAI-Agent-Turn aus. Verwende ein vorgebautes Tarball wieder mit `OPENCLAW_NPM_ONBOARD_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, überspringe den Host-Rebuild mit `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0` oder wechsle den Kanal mit `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Bun-Global-Install-Smoke: `bash scripts/e2e/bun-global-install-smoke.sh` packt den aktuellen Tree, installiert ihn mit `bun install -g` in einem isolierten Home und verifiziert, dass `openclaw infer image providers --json` gebündelte Bild-Provider zurückgibt, statt zu hängen. Verwende ein vorgebautes Tarball wieder mit `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz`, überspringe den Host-Build mit `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0` oder kopiere `dist/` aus einem gebauten Docker-Image mit `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Installer-Docker-Smoke: `bash scripts/test-install-sh-docker.sh` teilt sich einen npm-Cache über seine Root-, Update- und Direct-npm-Container. Update-Smoke verwendet standardmäßig npm `latest` als stabile Baseline, bevor auf das Kandidaten-Tarball aktualisiert wird. Nicht-Root-Installer-Prüfungen behalten einen isolierten npm-Cache, damit Root-eigene Cache-Einträge das benutzerlokale Installationsverhalten nicht verdecken. Setze `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, um den Root-/Update-/Direct-npm-Cache bei lokalen Wiederholungen wiederzuverwenden.
- Install-Smoke-CI überspringt das doppelte direkte globale npm-Update mit `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; führe das Skript lokal ohne diese env var aus, wenn Abdeckung für direktes `npm install -g` benötigt wird.
- CLI-Smoke für `agents delete shared workspace`: `pnpm test:docker:agents-delete-shared-workspace` (Skript: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) baut standardmäßig das Root-Dockerfile-Image, befüllt zwei Agents mit einem Workspace in einem isolierten Container-Home, führt `agents delete --json` aus und verifiziert gültiges JSON sowie das Verhalten beim Beibehalten des Workspace. Verwende das Install-Smoke-Image wieder mit `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1`.
- Gateway-Networking (zwei Container, WS-Auth + Health): `pnpm test:docker:gateway-network` (Skript: `scripts/e2e/gateway-network-docker.sh`)
- OpenAI-Responses-Regression für `web_search` mit minimalem Reasoning: `pnpm test:docker:openai-web-search-minimal` (Skript: `scripts/e2e/openai-web-search-minimal-docker.sh`) führt einen gemockten OpenAI-Server durch das Gateway aus, verifiziert, dass `web_search` `reasoning.effort` von `minimal` auf `low` erhöht, erzwingt dann, dass das Provider-Schema die Anfrage ablehnt, und prüft, dass das rohe Detail in den Gateway-Logs erscheint.
- MCP-Kanal-Bridge (vorgefülltes Gateway + stdio-Bridge + roher Claude-Notification-Frame-Smoke): `pnpm test:docker:mcp-channels` (Skript: `scripts/e2e/mcp-channels-docker.sh`)
- MCP-Tools im Pi-Bundle (echter stdio-MCP-Server + Smoke für embedded-Pi-Profil-allow/deny): `pnpm test:docker:pi-bundle-mcp-tools` (Skript: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- MCP-Cleanup für Cron/Subagent (echtes Gateway + Teardown von stdio-MCP-Child nach isolierten Cron- und One-Shot-Subagent-Läufen): `pnpm test:docker:cron-mcp-cleanup` (Skript: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (Install-Smoke + Alias `/plugin` + Restart-Semantik für Claude-Bundle): `pnpm test:docker:plugins` (Skript: `scripts/e2e/plugins-docker.sh`)
- Smoke für unverändertes Plugin-Update: `pnpm test:docker:plugin-update` (Skript: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke für Metadaten von Config-Reload: `pnpm test:docker:config-reload` (Skript: `scripts/e2e/config-reload-source-docker.sh`)
- Laufzeitabhängigkeiten gebündelter Plugins: `pnpm test:docker:bundled-channel-deps` baut standardmäßig ein kleines Docker-Runner-Image, baut und packt OpenClaw einmal auf dem Host und bindet dieses Tarball dann in jedes Linux-Installationsszenario ein. Verwende das Image mit `OPENCLAW_SKIP_DOCKER_BUILD=1` wieder, überspringe den Host-Rebuild nach einem frischen lokalen Build mit `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0` oder verweise mit `OPENCLAW_BUNDLED_CHANNEL_PACKAGE_TGZ=/path/to/openclaw-*.tgz` auf ein vorhandenes Tarball. Das vollständige Docker-Aggregat packt dieses Tarball einmal vorab und shardet dann die Checks für gebündelte Kanäle in unabhängige Lanes, einschließlich separater Update-Lanes für Telegram, Discord, Slack, Feishu, memory-lancedb und ACPX. Verwende `OPENCLAW_BUNDLED_CHANNELS=telegram,slack`, um die Kanalmatrix einzugrenzen, wenn du die gebündelte Lane direkt ausführst, oder `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx`, um das Update-Szenario einzugrenzen. Die Lane verifiziert außerdem, dass `channels.<id>.enabled=false` und `plugins.entries.<id>.enabled=false` die Reparatur von Doctor-/Laufzeitabhängigkeiten unterdrücken.
- Grenzen Sie Laufzeitabhängigkeiten gebündelter Plugins während der Iteration ein, indem du nicht zusammenhängende Szenarien deaktivierst, zum Beispiel:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

So baust du das gemeinsame Built-App-Image manuell vor und verwendest es wieder:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Suite-spezifische Image-Overrides wie `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` haben weiterhin Vorrang, wenn sie gesetzt sind. Wenn `OPENCLAW_SKIP_DOCKER_BUILD=1` auf ein entferntes gemeinsam genutztes Image zeigt, ziehen die Skripte es, falls es noch nicht lokal vorhanden ist. Die QR- und Installer-Docker-Tests behalten ihre eigenen Dockerfiles, weil sie Paket-/Installationsverhalten validieren und nicht die gemeinsam genutzte Laufzeit der gebauten App.

Die Docker-Runner für Live-Modelle binden außerdem den aktuellen Checkout schreibgeschützt ein und
stagen ihn in ein temporäres Workdir innerhalb des Containers. Dadurch bleibt das Runtime-
Image schlank, während Vitest trotzdem gegen deinen exakten lokalen Source-/Config-Stand läuft.
Der Staging-Schritt überspringt große lokale Caches und App-Build-Ausgaben wie
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` und app-lokale `.build`- oder
Gradle-Ausgabeverzeichnisse, damit Docker-Live-Läufe nicht minutenlang
maschinenspezifische Artefakte kopieren.
Sie setzen außerdem `OPENCLAW_SKIP_CHANNELS=1`, damit Gateway-Live-Probes keine
echten Kanal-Worker für Telegram/Discord/etc. innerhalb des Containers starten.
`test:docker:live-models` führt weiterhin `pnpm test:live` aus, also reiche
auch `OPENCLAW_LIVE_GATEWAY_*` durch, wenn du Gateway-
Live-Abdeckung aus dieser Docker-Lane eingrenzen oder ausschließen möchtest.
`test:docker:openwebui` ist ein höherstufiger Kompatibilitäts-Smoke: Er startet einen
OpenClaw-Gateway-Container mit aktivierten OpenAI-kompatiblen HTTP-Endpunkten,
startet einen gepinnten Open-WebUI-Container gegen dieses Gateway, meldet sich über
Open WebUI an, verifiziert, dass `/api/models` `openclaw/default` bereitstellt, und sendet dann eine
echte Chat-Anfrage über den Proxy `/api/chat/completions` von Open WebUI.
Der erste Lauf kann merklich langsamer sein, weil Docker möglicherweise das
Open-WebUI-Image ziehen muss und Open WebUI sein eigenes Cold-Start-Setup
abschließen muss.
Diese Lane erwartet einen nutzbaren Live-Modell-Key, und `OPENCLAW_PROFILE_FILE`
(`~/.profile` standardmäßig) ist der primäre Weg, ihn in Docker-Läufen bereitzustellen.
Erfolgreiche Läufe geben eine kleine JSON-Payload wie `{ "ok": true, "model":
"openclaw/default", ... }` aus.
`test:docker:mcp-channels` ist absichtlich deterministisch und benötigt kein
echtes Telegram-, Discord- oder iMessage-Konto. Es startet einen
vorgefüllten Gateway-Container, startet einen zweiten Container, der `openclaw mcp serve`
ausführt, und verifiziert dann Routing für Konversationserkennung, Lesen von Transkripten, Anhangsmetadaten,
Verhalten der Live-Ereignis-Queue, Routing ausgehender Sendungen und Claude-artige Kanal- +
Berechtigungsbenachrichtigungen über die echte stdio-MCP-Bridge. Die Benachrichtigungsprüfung
inspiziert die rohen stdio-MCP-Frames direkt, sodass der Smoke validiert, was die
Bridge tatsächlich ausgibt, nicht nur das, was ein bestimmtes Client-SDK zufällig sichtbar macht.
`test:docker:pi-bundle-mcp-tools` ist deterministisch und benötigt keinen Live-
Modell-Key. Es baut das Repo-Docker-Image, startet einen echten stdio-MCP-Probe-Server
innerhalb des Containers, materialisiert diesen Server über die eingebettete Pi-Bundle-
MCP-Runtime, führt das Tool aus und verifiziert dann, dass `coding` und `messaging`
`bundle-mcp`-Tools behalten, während `minimal` und `tools.deny: ["bundle-mcp"]` sie herausfiltern.
`test:docker:cron-mcp-cleanup` ist deterministisch und benötigt keinen Live-Modell-
Key. Es startet ein vorgefülltes Gateway mit einem echten stdio-MCP-Probe-Server, führt einen
isolierten Cron-Turn und einen One-Shot-Child-Turn über `/subagents spawn` aus und verifiziert dann,
dass der MCP-Child-Prozess nach jedem Lauf beendet wird.

Manueller ACP-Smoke für Plain-Language-Threads (nicht CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Behalte dieses Skript für Regression-/Debug-Abläufe. Es könnte wieder für die Validierung von ACP-Thread-Routing benötigt werden, also lösche es nicht.

Nützliche env vars:

- `OPENCLAW_CONFIG_DIR=...` (Standard: `~/.openclaw`), gemountet nach `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (Standard: `~/.openclaw/workspace`), gemountet nach `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (Standard: `~/.profile`), gemountet nach `/home/node/.profile` und vor dem Ausführen der Tests gesourct
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, um nur env vars zu verifizieren, die aus `OPENCLAW_PROFILE_FILE` gesourct werden, unter Verwendung temporärer Config-/Workspace-Verzeichnisse und ohne externe CLI-Auth-Mounts
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (Standard: `~/.cache/openclaw/docker-cli-tools`), gemountet nach `/home/node/.npm-global` für gecachte CLI-Installationen innerhalb von Docker
- Externe CLI-Auth-Verzeichnisse/-Dateien unter `$HOME` werden schreibgeschützt unter `/host-auth...` gemountet und vor dem Start der Tests nach `/home/node/...` kopiert
  - Standardverzeichnisse: `.minimax`
  - Standarddateien: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Eingegrenzte Provider-Läufe mounten nur die benötigten Verzeichnisse/Dateien, die aus `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` abgeleitet werden
  - Manuell überschreiben mit `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` oder einer Kommaliste wie `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, um den Lauf einzugrenzen
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, um Provider im Container zu filtern
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, um für Wiederholungsläufe, die keinen Rebuild benötigen, ein bestehendes Image `openclaw:local-live` wiederzuverwenden
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um sicherzustellen, dass Zugangsdaten aus dem Profile-Store kommen (nicht aus env)
- `OPENCLAW_OPENWEBUI_MODEL=...`, um das Modell auszuwählen, das das Gateway für den Open-WebUI-Smoke bereitstellt
- `OPENCLAW_OPENWEBUI_PROMPT=...`, um den Prompt für den Nonce-Check zu überschreiben, der vom Open-WebUI-Smoke verwendet wird
- `OPENWEBUI_IMAGE=...`, um den gepinnten Open-WebUI-Image-Tag zu überschreiben

## Docs-Sanity

Führe nach Bearbeitungen an den Docs die Docs-Checks aus: `pnpm check:docs`.
Führe vollständige Mintlify-Anker-Validierung aus, wenn du zusätzlich In-Page-Heading-Checks benötigst: `pnpm docs:check-links:anchors`.

## Offline-Regression (CI-sicher)

Das sind Regressionen für „echte Pipelines“ ohne echte Provider:

- Gateway-Tool-Calling (gemocktes OpenAI, echtes Gateway + Agent-Loop): `src/gateway/gateway.test.ts` (Fall: „runs a mock OpenAI tool call end-to-end via gateway agent loop“)
- Gateway-Assistent (WS `wizard.start`/`wizard.next`, schreibt Konfiguration + Auth erzwungen): `src/gateway/gateway.test.ts` (Fall: „runs wizard over ws and writes auth token config“)

## Zuverlässigkeits-Evals für Agenten (Skills)

Wir haben bereits einige CI-sichere Tests, die sich wie „Agent reliability evals“ verhalten:

- Gemocktes Tool-Calling über den echten Gateway- + Agent-Loop (`src/gateway/gateway.test.ts`).
- End-to-End-Assistentenabläufe, die Sitzungsverdrahtung und Konfigurationseffekte validieren (`src/gateway/gateway.test.ts`).

Was für Skills noch fehlt (siehe [Skills](/de/tools/skills)):

- **Decisioning:** Wenn Skills im Prompt aufgelistet sind, wählt der Agent den richtigen Skill (oder vermeidet irrelevante)?
- **Compliance:** Liest der Agent vor der Verwendung `SKILL.md` und befolgt erforderliche Schritte/Argumente?
- **Workflow-Verträge:** Multi-Turn-Szenarien, die Tool-Reihenfolge, Übernahme des Sitzungsverlaufs und Sandbox-Grenzen prüfen.

Künftige Evals sollten zuerst deterministisch bleiben:

- Ein Szenario-Runner, der Mock-Provider verwendet, um Tool-Calls + Reihenfolge, Lesen von Skill-Dateien und Sitzungsverdrahtung zu prüfen.
- Eine kleine Suite skillfokussierter Szenarien (verwenden vs. vermeiden, Gating, Prompt Injection).
- Optionale Live-Evals (Opt-in, per env gegatet) erst, nachdem die CI-sichere Suite vorhanden ist.

## Contract-Tests (Plugin- und Kanalform)

Contract-Tests verifizieren, dass jedes registrierte Plugin und jeder registrierte Kanal
seinem Schnittstellenvertrag entspricht. Sie iterieren über alle entdeckten Plugins und führen eine Suite
von Form- und Verhaltensprüfungen aus. Die Standard-Unit-Lane `pnpm test`
überspringt diese gemeinsam genutzten Seam- und Smoke-Dateien absichtlich; führe die Contract-Befehle explizit aus,
wenn du gemeinsame Kanal- oder Provider-Oberflächen berührst.

### Befehle

- Alle Contracts: `pnpm test:contracts`
- Nur Kanal-Contracts: `pnpm test:contracts:channels`
- Nur Provider-Contracts: `pnpm test:contracts:plugins`

### Kanal-Contracts

Befinden sich in `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Grundlegende Plugin-Form (ID, Name, Fähigkeiten)
- **setup** - Vertrag des Setup-Assistenten
- **session-binding** - Verhalten bei Sitzungsbindung
- **outbound-payload** - Struktur der Nachrichten-Payload
- **inbound** - Verarbeitung eingehender Nachrichten
- **actions** - Handler für Kanalaktionen
- **threading** - Behandlung von Thread-IDs
- **directory** - Verzeichnis-/Roster-API
- **group-policy** - Durchsetzung von Gruppenrichtlinien

### Provider-Status-Contracts

Befinden sich in `src/plugins/contracts/*.contract.test.ts`.

- **status** - Kanal-Status-Probes
- **registry** - Form der Plugin-Registry

### Provider-Contracts

Befinden sich in `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Vertrag des Auth-Ablaufs
- **auth-choice** - Auth-Auswahl/Selektion
- **catalog** - API des Modellkatalogs
- **discovery** - Plugin-Discovery
- **loader** - Plugin-Laden
- **runtime** - Laufzeit des Providers
- **shape** - Plugin-Form/Schnittstelle
- **wizard** - Setup-Assistent

### Wann ausführen

- Nach Änderungen an Exports oder Subpfaden von `plugin-sdk`
- Nach dem Hinzufügen oder Ändern eines Kanal- oder Provider-Plugins
- Nach Refactorings bei Plugin-Registrierung oder Discovery

Contract-Tests laufen in der CI und benötigen keine echten API-Keys.

## Regressionen hinzufügen (Leitfaden)

Wenn du ein Provider-/Modellproblem behebst, das in Live entdeckt wurde:

- Füge nach Möglichkeit eine CI-sichere Regression hinzu (Mock/Stub des Providers oder Erfassung der exakten Transformation der Request-Form)
- Wenn es inhärent nur live auftritt (Rate Limits, Auth-Richtlinien), halte den Live-Test eng und per env vars opt-in
- Bevorzuge die kleinste Ebene, die den Bug erkennt:
  - Bug bei Request-Konvertierung/Replay des Providers → direkter Modelltst
  - Bug in Gateway-Session-/Verlauf-/Tool-Pipeline → Gateway-Live-Smoke oder CI-sicherer Gateway-Mock-Test
- Guardrail für SecretRef-Traversal:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` leitet aus Registry-Metadaten (`listSecretTargetRegistryEntries()`) ein gesampeltes Ziel pro SecretRef-Klasse ab und stellt dann sicher, dass Exec-IDs in Traversal-Segmenten abgelehnt werden.
  - Wenn du in `src/secrets/target-registry-data.ts` eine neue SecretRef-Zielfamilie `includeInPlan` hinzufügst, aktualisiere `classifyTargetClass` in diesem Test. Der Test schlägt absichtlich bei nicht klassifizierten Ziel-IDs fehl, damit neue Klassen nicht stillschweigend übersprungen werden können.

## Verwandt

- [Testing live](/de/help/testing-live)
- [CI](/de/ci)
