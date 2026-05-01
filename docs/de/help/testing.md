---
read_when:
    - Tests lokal oder in CI ausführen
    - Regressionstests für Modell-/Provider-Fehler hinzufügen
    - Debugging von Gateway- und Agentenverhalten
summary: 'Testkit: Unit-/E2E-/Live-Suiten, Docker-Runner und was jeder Test abdeckt'
title: Tests
x-i18n:
    generated_at: "2026-05-01T06:43:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3c28e45c483169f528483f7a27265d89c34f3865eb56b51407639b566e117162
    source_path: help/testing.md
    workflow: 16
---

OpenClaw hat drei Vitest-Suiten (Unit/Integration, E2E, Live) und eine kleine Gruppe
von Docker-Runnern. Dieses Dokument ist ein Leitfaden dazu, wie wir testen:

- Was die einzelnen Suiten abdecken (und was sie bewusst _nicht_ abdecken).
- Welche Befehle Sie für typische Workflows ausführen sollten (lokal, vor dem Push, Debugging).
- Wie Live-Tests Anmeldedaten ermitteln und Modelle/Provider auswählen.
- Wie Sie Regressionstests für reale Modell-/Provider-Probleme hinzufügen.

<Note>
**QA-Stack (qa-lab, qa-channel, Live-Transport-Lanes)** ist separat dokumentiert:

- [QA-Übersicht](/de/concepts/qa-e2e-automation) — Architektur, Befehlsoberfläche, Szenarioerstellung.
- [Matrix-QA](/de/concepts/qa-matrix) — Referenz für `pnpm openclaw qa matrix`.
- [QA-Kanal](/de/channels/qa-channel) — das synthetische Transport-Plugin, das von Repository-gestützten Szenarien verwendet wird.

Diese Seite behandelt das Ausführen der regulären Testsuiten und der Docker-/Parallels-Runner. Der unten stehende Abschnitt zu QA-spezifischen Runnern ([QA-spezifische Runner](#qa-specific-runners)) listet die konkreten `qa`-Aufrufe auf und verweist zurück auf die obigen Referenzen.
</Note>

## Schnellstart

An den meisten Tagen:

- Vollständiges Gate (vor dem Push erwartet): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Schnellere lokale Ausführung der gesamten Suite auf einem großzügig ausgestatteten Rechner: `pnpm test:max`
- Direkte Vitest-Beobachtungsschleife: `pnpm test:watch`
- Direktes Ansteuern von Dateien leitet jetzt auch Erweiterungs-/Kanalpfade weiter: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Bevorzugen Sie zuerst zielgerichtete Läufe, wenn Sie an einem einzelnen Fehler iterieren.
- Docker-gestützte QA-Site: `pnpm qa:lab:up`
- Linux-VM-gestützte QA-Lane: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Wenn Sie Tests ändern oder zusätzliche Sicherheit benötigen:

- Coverage-Gate: `pnpm test:coverage`
- E2E-Suite: `pnpm test:e2e`

Beim Debuggen echter Provider/Modelle (erfordert echte Anmeldedaten):

- Live-Suite (Modelle + Gateway-Tool-/Bildprüfungen): `pnpm test:live`
- Eine Live-Datei gezielt und ruhig ausführen: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Docker-Live-Modell-Sweep: `pnpm test:docker:live-models`
  - Jedes ausgewählte Modell führt jetzt einen Text-Turn plus eine kleine Datei-Lese-artige Prüfung aus.
    Modelle, deren Metadaten `image`-Eingabe ausweisen, führen außerdem einen kleinen Bild-Turn aus.
    Deaktivieren Sie die zusätzlichen Prüfungen mit `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` oder
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`, wenn Sie Provider-Fehler isolieren.
  - CI-Abdeckung: Der tägliche Lauf `OpenClaw Scheduled Live And E2E Checks` und der manuelle Lauf
    `OpenClaw Release Checks` rufen beide den wiederverwendbaren Live-/E2E-Workflow mit
    `include_live_suites: true` auf; dies umfasst separate Docker-Live-Modell-
    Matrix-Jobs, nach Provider aufgeteilt.
  - Für fokussierte CI-Wiederholungsläufe starten Sie `OpenClaw Live And E2E Checks (Reusable)`
    mit `include_live_suites: true` und `live_models_only: true`.
  - Fügen Sie neue aussagekräftige Provider-Secrets zu `scripts/ci-hydrate-live-auth.sh`
    sowie `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` und dessen
    geplanten/Release-Aufrufern hinzu.
- Nativer Codex-Bound-Chat-Smoke-Test: `pnpm test:docker:live-codex-bind`
  - Führt eine Docker-Live-Lane gegen den Codex-App-Server-Pfad aus, bindet eine synthetische
    Slack-DM mit `/codex bind`, führt `/codex fast` und
    `/codex permissions` aus und verifiziert anschließend, dass eine einfache Antwort und ein Bildanhang
    über die native Plugin-Bindung statt über ACP geroutet werden.
- Codex-App-Server-Harness-Smoke-Test: `pnpm test:docker:live-codex-harness`
  - Führt Gateway-Agent-Turns über das Plugin-eigene Codex-App-Server-Harness aus,
    verifiziert `/codex status` und `/codex models` und übt standardmäßig Bild-,
    Cron-MCP-, Sub-Agent- und Guardian-Prüfungen aus. Deaktivieren Sie die Sub-Agent-Prüfung mit
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0`, wenn Sie andere Codex-
    App-Server-Fehler isolieren. Für eine fokussierte Sub-Agent-Prüfung deaktivieren Sie die anderen Prüfungen:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Dies beendet den Lauf nach der Sub-Agent-Prüfung, sofern
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` nicht gesetzt ist.
- Crestodian-Rettungsbefehls-Smoke-Test: `pnpm test:live:crestodian-rescue-channel`
  - Opt-in-Prüfung mit doppelter Absicherung für die Rettungsbefehlsoberfläche des Nachrichtenkanals.
    Sie führt `/crestodian status` aus, stellt eine persistente Modelländerung in die Warteschlange,
    antwortet mit `/crestodian yes` und verifiziert den Audit-/Konfigurations-Schreibpfad.
- Crestodian-Planer-Docker-Smoke-Test: `pnpm test:docker:crestodian-planner`
  - Führt Crestodian in einem konfigurationslosen Container mit einer gefälschten Claude-CLI in `PATH` aus
    und verifiziert, dass der Fuzzy-Planer-Fallback in einen auditierten typisierten
    Konfigurationsschreibvorgang übersetzt wird.
- Crestodian-Erstlauf-Docker-Smoke-Test: `pnpm test:docker:crestodian-first-run`
  - Startet aus einem leeren OpenClaw-Zustandsverzeichnis, leitet nacktes `openclaw` an
    Crestodian weiter, wendet Setup-/Modell-/Agent-/Discord-Plugin- und SecretRef-Schreibvorgänge an,
    validiert die Konfiguration und verifiziert Audit-Einträge. Derselbe Ring-0-Setup-Pfad wird
    auch in QA Lab durch
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` abgedeckt.
- Moonshot/Kimi-Kosten-Smoke-Test: mit gesetztem `MOONSHOT_API_KEY`
  `openclaw models list --provider moonshot --json` ausführen, dann einen isolierten
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  gegen `moonshot/kimi-k2.6` ausführen. Verifizieren Sie, dass das JSON Moonshot/K2.6 meldet und das
  Assistententranskript normalisierte `usage.cost` speichert.

<Tip>
Wenn Sie nur einen fehlschlagenden Fall benötigen, sollten Sie Live-Tests bevorzugt über die unten beschriebenen Allowlist-Umgebungsvariablen einschränken.
</Tip>

## QA-spezifische Runner

Diese Befehle stehen neben den Haupttestsuiten, wenn Sie QA-Lab-Realismus benötigen:

CI führt QA Lab in dedizierten Workflows aus. `Parity gate` läuft bei passenden PRs und
über manuelle Auslösung mit Mock-Providern. `QA-Lab - All Lanes` läuft nächtlich auf
`main` und über manuelle Auslösung mit dem Mock-Parity-Gate, der Live-Matrix-Lane,
der von Convex verwalteten Live-Telegram-Lane und der von Convex verwalteten Live-Discord-Lane als
parallele Jobs. Geplante QA- und Release-Prüfungen übergeben Matrix `--profile fast`
explizit, während die Standardwerte der Matrix-CLI und der manuellen Workflow-Eingabe
`all` bleiben; manuelle Auslösung kann `all` in `transport`, `media`, `e2ee-smoke`,
`e2ee-deep` und `e2ee-cli`-Jobs aufteilen. `OpenClaw Release Checks` führt vor der
Release-Freigabe Parity sowie die schnellen Matrix- und Telegram-Lanes aus und verwendet
`mock-openai/gpt-5.5` für Release-Transportprüfungen, damit sie deterministisch bleiben
und den normalen Start von Provider-Plugins vermeiden. Diese Live-Transport-Gateways deaktivieren
Speichersuche; Speicherverhalten bleibt durch die QA-Parity-Suiten abgedeckt.

Vollständige Release-Live-Media-Shards verwenden
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, das bereits
`ffmpeg` und `ffprobe` enthält. Docker-Live-Modell-/Backend-Shards verwenden das gemeinsame
Image `ghcr.io/openclaw/openclaw-live-test:<sha>`, das einmal pro ausgewähltem
Commit gebaut wird; anschließend wird es mit `OPENCLAW_SKIP_DOCKER_BUILD=1` gezogen, statt
in jedem Shard neu gebaut zu werden.

- `pnpm openclaw qa suite`
  - Führt Repository-gestützte QA-Szenarien direkt auf dem Host aus.
  - Führt mehrere ausgewählte Szenarien standardmäßig parallel mit isolierten
    Gateway-Workern aus. `qa-channel` verwendet standardmäßig Nebenläufigkeit 4 (begrenzt durch die
    Anzahl der ausgewählten Szenarien). Verwenden Sie `--concurrency <count>`, um die Worker-
    Anzahl anzupassen, oder `--concurrency 1` für die ältere serielle Lane.
  - Beendet mit einem Nicht-Null-Code, wenn ein Szenario fehlschlägt. Verwenden Sie `--allow-failures`, wenn Sie
    Artefakte ohne fehlschlagenden Exit-Code wünschen.
  - Unterstützt Provider-Modi `live-frontier`, `mock-openai` und `aimock`.
    `aimock` startet einen lokalen AIMock-gestützten Provider-Server für experimentelle
    Fixture- und Protokoll-Mock-Abdeckung, ohne die szenariobewusste
    `mock-openai`-Lane zu ersetzen.
- `pnpm test:gateway:cpu-scenarios`
  - Führt den Gateway-Startup-Benchmark plus ein kleines Mock-QA-Lab-Szenariopaket aus
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) und schreibt eine kombinierte CPU-Beobachtungs-
    Zusammenfassung unter `.artifacts/gateway-cpu-scenarios/`.
  - Markiert standardmäßig nur anhaltend heiße CPU-Beobachtungen (`--cpu-core-warn`
    plus `--hot-wall-warn-ms`), sodass kurze Startup-Spitzen als Metriken aufgezeichnet werden,
    ohne wie die minutenlange Gateway-Peg-Regression auszusehen.
  - Verwendet gebaute `dist`-Artefakte; führen Sie zuerst einen Build aus, wenn der Checkout noch keine
    frische Runtime-Ausgabe hat.
- `pnpm openclaw qa suite --runner multipass`
  - Führt dieselbe QA-Suite in einer wegwerfbaren Multipass-Linux-VM aus.
  - Behält dasselbe Szenario-Auswahlverhalten wie `qa suite` auf dem Host bei.
  - Verwendet dieselben Provider-/Modellauswahl-Flags wie `qa suite`.
  - Live-Läufe leiten die unterstützten QA-Authentifizierungseingaben weiter, die für den Gast praktikabel sind:
    env-basierte Provider-Schlüssel, den QA-Live-Provider-Konfigurationspfad und `CODEX_HOME`,
    wenn vorhanden.
  - Ausgabeverzeichnisse müssen unter dem Repository-Stamm bleiben, damit der Gast über den
    eingebundenen Arbeitsbereich zurückschreiben kann.
  - Schreibt den normalen QA-Bericht plus Zusammenfassung sowie Multipass-Protokolle unter
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Startet die Docker-gestützte QA-Site für operatorartige QA-Arbeit.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Baut ein npm-Tarball aus dem aktuellen Checkout, installiert es global in
    Docker, führt nicht-interaktives Onboarding für OpenAI-API-Schlüssel aus, konfiguriert standardmäßig Telegram,
    verifiziert, dass das Aktivieren des Plugins Runtime-Abhängigkeiten bei Bedarf installiert,
    führt doctor aus und führt einen lokalen Agent-Turn gegen einen gemockten OpenAI-
    Endpunkt aus.
  - Verwenden Sie `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, um dieselbe Lane für paketierte Installation
    mit Discord auszuführen.
- `pnpm test:docker:session-runtime-context`
  - Führt einen deterministischen Docker-Smoke-Test für eingebaute App-Runtime-Kontext-
    Transkripte aus. Er verifiziert, dass versteckter OpenClaw-Runtime-Kontext als
    nicht anzuzeigende benutzerdefinierte Nachricht persistiert wird, statt in den sichtbaren Benutzer-Turn zu gelangen,
    setzt anschließend ein betroffenes kaputtes Session-JSONL und verifiziert, dass
    `openclaw doctor --fix` es mit einem Backup in den aktiven Branch umschreibt.
- `pnpm test:docker:npm-telegram-live`
  - Installiert einen OpenClaw-Paketkandidaten in Docker, führt Onboarding für das installierte Paket aus,
    konfiguriert Telegram über die installierte CLI und verwendet anschließend die
    Live-Telegram-QA-Lane mit diesem installierten Paket als zu testendem Gateway erneut.
  - Standard ist `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; setzen Sie
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` oder
    `OPENCLAW_CURRENT_PACKAGE_TGZ`, um stattdessen ein aufgelöstes lokales Tarball zu testen,
    statt aus der Registry zu installieren.
  - Verwendet dieselben Telegram-Umgebungsanmeldedaten oder dieselbe Convex-Anmeldedatenquelle wie
    `pnpm openclaw qa telegram`. Für CI-/Release-Automatisierung setzen Sie
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` plus
    `OPENCLAW_QA_CONVEX_SITE_URL` und das Rollen-Secret. Wenn
    `OPENCLAW_QA_CONVEX_SITE_URL` und ein Convex-Rollen-Secret in CI vorhanden sind,
    wählt der Docker-Wrapper Convex automatisch aus.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` überschreibt die gemeinsame
    `OPENCLAW_QA_CREDENTIAL_ROLE` nur für diese Lane.
  - GitHub Actions stellt diese Lane als manuellen Maintainer-Workflow
    `NPM Telegram Beta E2E` bereit. Er läuft nicht bei Merge. Der Workflow verwendet die
    Umgebung `qa-live-shared` und Convex-CI-Anmeldedaten-Leases.
- GitHub Actions stellt außerdem `Package Acceptance` für begleitende Produktnachweise
  gegen ein Kandidatenpaket bereit. Es akzeptiert einen vertrauenswürdigen Ref, eine veröffentlichte npm-Spezifikation,
  eine HTTPS-Tarball-URL plus SHA-256 oder ein Tarball-Artefakt aus einem anderen Lauf, lädt
  das normalisierte `openclaw-current.tgz` als `package-under-test` hoch und führt anschließend den
  bestehenden Docker-E2E-Scheduler mit Smoke-, Paket-, Produkt-, vollständigen oder benutzerdefinierten
  Lane-Profilen aus. Setzen Sie `telegram_mode=mock-openai` oder `live-frontier`, um den
  Telegram-QA-Workflow gegen dasselbe `package-under-test`-Artefakt auszuführen.
  - Neuester Beta-Produktnachweis:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Exakter Tarball-URL-Nachweis erfordert einen Digest:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Der Artefaktnachweis lädt ein Tarball-Artefakt aus einem anderen Actions-Lauf herunter:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:bundled-channel-deps`
  - Packt und installiert den aktuellen OpenClaw-Build in Docker, startet das Gateway
    mit konfiguriertem OpenAI und aktiviert dann gebündelte Kanäle/Plugins über
    Konfigurationsänderungen.
  - Prüft, dass die Setup-Erkennung unkonfigurierte Plugin-Laufzeitabhängigkeiten
    nicht installiert, der erste konfigurierte Gateway- oder Doctor-Lauf die
    Laufzeitabhängigkeiten jedes gebündelten Plugins bei Bedarf installiert und
    ein zweiter Neustart bereits aktivierte Abhängigkeiten nicht erneut
    installiert.
  - Installiert außerdem eine bekannte ältere npm-Baseline, aktiviert Telegram vor
    dem Ausführen von `openclaw update --tag <candidate>` und prüft, dass der
    Post-Update-Doctor des Kandidaten gebündelte Kanal-Laufzeitabhängigkeiten ohne
    harness-seitige Postinstall-Reparatur repariert.
- `pnpm test:parallels:npm-update`
  - Führt den nativen Update-Smoke für Paketinstallationen über Parallels-Gäste aus. Jede
    ausgewählte Plattform installiert zuerst das angeforderte Baseline-Paket, führt dann
    den installierten Befehl `openclaw update` im selben Gast aus und prüft die
    installierte Version, den Update-Status, die Gateway-Bereitschaft und eine lokale
    Agent-Antwort.
  - Verwenden Sie `--platform macos`, `--platform windows` oder `--platform linux`, während
    Sie auf einem Gast iterieren. Verwenden Sie `--json` für den Pfad zum Zusammenfassungsartefakt und
    den Status pro Lane.
  - Die OpenAI-Lane verwendet standardmäßig `openai/gpt-5.5` für den Nachweis der
    Live-Agent-Antwort. Übergeben Sie `--model <provider/model>` oder setzen Sie
    `OPENCLAW_PARALLELS_OPENAI_MODEL`, wenn Sie bewusst ein anderes
    OpenAI-Modell validieren.
  - Umschließen Sie lange lokale Läufe mit einem Host-Timeout, damit Parallels-Transport-Blockaden nicht
    den Rest des Testfensters verbrauchen können:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Das Skript schreibt verschachtelte Lane-Logs unter `/tmp/openclaw-parallels-npm-update.*`.
    Prüfen Sie `windows-update.log`, `macos-update.log` oder `linux-update.log`,
    bevor Sie annehmen, dass der äußere Wrapper hängt.
  - Das Windows-Update kann auf einem kalten Gast 10 bis 15 Minuten mit der
    Post-Update-Doctor-/Laufzeitabhängigkeitsreparatur verbringen; das ist weiterhin gesund, wenn das verschachtelte
    npm-Debug-Log fortschreitet.
  - Führen Sie diesen aggregierten Wrapper nicht parallel zu einzelnen Parallels-
    Smoke-Lanes für macOS, Windows oder Linux aus. Sie teilen VM-Zustand und können bei
    Snapshot-Wiederherstellung, Paketbereitstellung oder Gateway-Zustand des Gasts kollidieren.
  - Der Post-Update-Nachweis führt die normale Oberfläche für gebündelte Plugins aus, weil
    Capability-Fassaden wie Sprache, Bilderzeugung und Medienverständnis
    über gebündelte Laufzeit-APIs geladen werden, auch wenn die Agent-Antwort
    selbst nur eine einfache Textantwort prüft.

- `pnpm openclaw qa aimock`
  - Startet nur den lokalen AIMock-Provider-Server für direkte Protokoll-Smoke-
    Tests.
- `pnpm openclaw qa matrix`
  - Führt die Matrix-Live-QA-Lane gegen einen kurzlebigen Docker-gestützten Tuwunel-Homeserver aus. Nur Source-Checkout — Paketinstallationen liefern `qa-lab` nicht aus.
  - Vollständige CLI, Profil-/Szenariokatalog, Umgebungsvariablen und Artefaktlayout: [Matrix-QA](/de/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Führt die Telegram-Live-QA-Lane gegen eine echte private Gruppe mit den Treiber- und SUT-Bot-Tokens aus der Umgebung aus.
  - Erfordert `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` und `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Die Gruppen-ID muss die numerische Telegram-Chat-ID sein.
  - Unterstützt `--credential-source convex` für gemeinsam genutzte gepoolte Zugangsdaten. Verwenden Sie standardmäßig den Umgebungsmodus oder setzen Sie `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, um gepoolte Leases zu verwenden.
  - Beendet sich mit einem Nicht-Null-Code, wenn ein Szenario fehlschlägt. Verwenden Sie `--allow-failures`, wenn Sie
    Artefakte ohne fehlgeschlagenen Exit-Code möchten.
  - Erfordert zwei unterschiedliche Bots in derselben privaten Gruppe, wobei der SUT-Bot einen Telegram-Benutzernamen bereitstellt.
  - Aktivieren Sie für stabile Bot-zu-Bot-Beobachtung den Bot-to-Bot Communication Mode in `@BotFather` für beide Bots und stellen Sie sicher, dass der Treiber-Bot Bot-Traffic in der Gruppe beobachten kann.
  - Schreibt einen Telegram-QA-Bericht, eine Zusammenfassung und ein Artefakt mit beobachteten Nachrichten unter `.artifacts/qa-e2e/...`. Antwortszenarien enthalten die RTT von der Sendeanforderung des Treibers bis zur beobachteten SUT-Antwort.

Live-Transport-Lanes teilen einen Standardvertrag, damit neue Transports nicht abweichen; die Abdeckungsmatrix pro Lane befindet sich in [QA-Übersicht → Live-Transport-Abdeckung](/de/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` ist die breite synthetische Suite und nicht Teil dieser Matrix.

### Gemeinsame Telegram-Zugangsdaten über Convex (v1)

Wenn `--credential-source convex` (oder `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) für
`openclaw qa telegram` aktiviert ist, erwirbt QA Lab eine exklusive Lease aus einem Convex-gestützten Pool, sendet Heartbeats
für diese Lease, während die Lane läuft, und gibt die Lease beim Herunterfahren frei.

Referenz-Scaffold für das Convex-Projekt:

- `qa/convex-credential-broker/`

Erforderliche Umgebungsvariablen:

- `OPENCLAW_QA_CONVEX_SITE_URL` (zum Beispiel `https://your-deployment.convex.site`)
- Ein Geheimnis für die ausgewählte Rolle:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` für `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` für `ci`
- Auswahl der Zugangsdatenrolle:
  - CLI: `--credential-role maintainer|ci`
  - Umgebungsstandard: `OPENCLAW_QA_CREDENTIAL_ROLE` (standardmäßig `ci` in CI, sonst `maintainer`)

Optionale Umgebungsvariablen:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (Standard `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (Standard `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (Standard `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (Standard `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (Standard `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (optionale Trace-ID)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` erlaubt loopback-`http://`-Convex-URLs für rein lokale Entwicklung.

`OPENCLAW_QA_CONVEX_SITE_URL` sollte im Normalbetrieb `https://` verwenden.

Maintainer-Admin-Befehle (Pool hinzufügen/entfernen/auflisten) erfordern
speziell `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI-Helfer für Maintainer:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Verwenden Sie `doctor` vor Live-Läufen, um die Convex-Site-URL, Broker-Geheimnisse,
den Endpoint-Präfix, HTTP-Timeout und die Erreichbarkeit von Admin/List zu prüfen, ohne
Geheimwerte auszugeben. Verwenden Sie `--json` für maschinenlesbare Ausgabe in Skripten und CI-
Hilfsprogrammen.

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
- `POST /admin/add` (nur Maintainer-Geheimnis)
  - Anfrage: `{ kind, actorId, payload, note?, status? }`
  - Erfolg: `{ status: "ok", credential }`
- `POST /admin/remove` (nur Maintainer-Geheimnis)
  - Anfrage: `{ credentialId, actorId }`
  - Erfolg: `{ status: "ok", changed, credential }`
  - Schutz bei aktiver Lease: `{ status: "error", code: "LEASE_ACTIVE", ... }`
- `POST /admin/list` (nur Maintainer-Geheimnis)
  - Anfrage: `{ kind?, status?, includePayload?, limit? }`
  - Erfolg: `{ status: "ok", credentials, count }`

Payload-Form für Telegram-Art:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` muss ein numerischer Telegram-Chat-ID-String sein.
- `admin/add` validiert diese Form für `kind: "telegram"` und weist fehlerhafte Payloads zurück.

### Einen Kanal zu QA hinzufügen

Die Architektur- und Szenario-Helfernamen für neue Kanaladapter befinden sich in [QA-Übersicht → Einen Kanal hinzufügen](/de/concepts/qa-e2e-automation#adding-a-channel). Mindestanforderung: Implementieren Sie den Transport-Runner auf dem gemeinsamen `qa-lab`-Host-Seam, deklarieren Sie `qaRunners` im Plugin-Manifest, mounten Sie ihn als `openclaw qa <runner>` und erstellen Sie Szenarien unter `qa/scenarios/`.

## Testsuiten (was wo läuft)

Betrachten Sie die Suiten als „zunehmende Realitätsnähe“ (und zunehmende Flakiness/Kosten):

### Unit / Integration (Standard)

- Befehl: `pnpm test`
- Konfiguration: Nicht zielgerichtete Läufe verwenden das Shard-Set `vitest.full-*.config.ts` und können Multi-Projekt-Shards für parallele Planung in Projektkonfigurationen pro Projekt aufteilen
- Dateien: Core-/Unit-Inventare unter `src/**/*.test.ts`, `packages/**/*.test.ts` und `test/**/*.test.ts`; UI-Unit-Tests laufen im dedizierten `unit-ui`-Shard
- Umfang:
  - Reine Unit-Tests
  - In-Prozess-Integrationstests (Gateway-Authentifizierung, Routing, Tooling, Parsing, Konfiguration)
  - Deterministische Regressionen für bekannte Fehler
- Erwartungen:
  - Läuft in CI
  - Keine echten Schlüssel erforderlich
  - Sollte schnell und stabil sein
  - Resolver- und Public-Surface-Loader-Tests müssen breites `api.js`- und
    `runtime-api.js`-Fallback-Verhalten mit generierten kleinen Plugin-Fixtures nachweisen, nicht mit
    echten Quell-APIs gebündelter Plugins. Echte Plugin-API-Ladevorgänge gehören in
    Plugin-eigene Vertrags-/Integrationssuiten.

<AccordionGroup>
  <Accordion title="Projekte, Shards und bereichsbezogene Lanes">

    - Ein nicht gezielter `pnpm test`-Lauf führt zwölf kleinere Shard-Konfigurationen (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) statt eines einzigen riesigen nativen Root-Projekt-Prozesses aus. Das senkt die Spitzen-RSS auf ausgelasteten Maschinen und verhindert, dass Auto-Reply-/Erweiterungsarbeit nicht zusammenhängende Suites ausbremst.
    - `pnpm test --watch` verwendet weiterhin den nativen Root-Projektgraphen `vitest.config.ts`, da ein Watch-Loop mit mehreren Shards nicht praktikabel ist.
    - `pnpm test`, `pnpm test:watch` und `pnpm test:perf:imports` leiten explizite Datei-/Verzeichnisziele zuerst über bereichsspezifische Lanes, sodass `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` nicht die vollständigen Startkosten des Root-Projekts bezahlt.
    - `pnpm test:changed` erweitert geänderte Git-Pfade standardmäßig zu günstigen bereichsspezifischen Lanes: direkte Teständerungen, benachbarte `*.test.ts`-Dateien, explizite Quellzuordnungen und lokale Importgraph-Abhängige. Config-/Setup-/Package-Änderungen führen Tests nicht breit aus, es sei denn, Sie verwenden explizit `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` ist das normale intelligente lokale Check-Gate für eng begrenzte Arbeit. Es klassifiziert den Diff in Core, Core-Tests, Erweiterungen, Erweiterungstests, Apps, Docs, Release-Metadaten, Live-Docker-Tooling und Tooling und führt dann die passenden Typecheck-, Lint- und Guard-Befehle aus. Es führt keine Vitest-Tests aus; rufen Sie `pnpm test:changed` oder explizit `pnpm test <target>` für Testnachweise auf. Versionsbumps, die nur Release-Metadaten betreffen, führen gezielte Versions-/Config-/Root-Dependency-Checks aus, mit einem Guard, der Package-Änderungen außerhalb des Versionsfelds auf oberster Ebene ablehnt.
    - Änderungen am Live-Docker-ACP-Harness führen fokussierte Checks aus: Shell-Syntax für die Live-Docker-Auth-Skripte und einen Dry-Run des Live-Docker-Schedulers. `package.json`-Änderungen werden nur einbezogen, wenn der Diff auf `scripts["test:docker:live-*"]` beschränkt ist; Dependency-, Export-, Versions- und andere Package-Oberflächenänderungen verwenden weiterhin die breiteren Guards.
    - Import-leichte Unit-Tests aus Agents, Befehlen, Plugins, Auto-Reply-Helpers, `plugin-sdk` und ähnlichen reinen Utility-Bereichen werden über die Lane `unit-fast` geleitet, die `test/setup-openclaw-runtime.ts` überspringt; zustandsbehaftete/runtime-lastige Dateien bleiben auf den bestehenden Lanes.
    - Ausgewählte `plugin-sdk`- und `commands`-Helper-Quelldateien ordnen Changed-Mode-Läufe außerdem expliziten benachbarten Tests in diesen leichten Lanes zu, sodass Helper-Änderungen vermeiden, die gesamte schwere Suite für dieses Verzeichnis erneut auszuführen.
    - `auto-reply` hat dedizierte Buckets für Core-Helpers auf oberster Ebene, `reply.*`-Integrationstests auf oberster Ebene und den Teilbaum `src/auto-reply/reply/**`. CI teilt den Reply-Teilbaum zusätzlich in Agent-Runner-, Dispatch- und Commands/State-Routing-Shards auf, damit ein import-lastiger Bucket nicht den vollständigen Node-Schwanz trägt.
    - Normale PR-/Main-CI überspringt absichtlich den Erweiterungs-Batch-Sweep und den nur für Releases vorgesehenen Shard `agentic-plugins`. Full Release Validation startet den separaten Child-Workflow `Plugin Prerelease` für diese Plugin-/erweiterungslastigen Suites auf Release-Kandidaten.

  </Accordion>

  <Accordion title="Embedded runner coverage">

    - Wenn Sie Eingaben für die Message-Tool-Erkennung oder den Compaction-Runtime-Kontext ändern, behalten Sie beide Coverage-Ebenen bei.
    - Fügen Sie fokussierte Helper-Regressionen für reine Routing- und Normalisierungsgrenzen hinzu.
    - Halten Sie die Embedded-Runner-Integrationssuites funktionsfähig:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` und
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Diese Suites verifizieren, dass bereichsspezifische IDs und Compaction-Verhalten weiterhin durch die echten Pfade `run.ts` / `compact.ts` fließen; reine Helper-Tests sind kein ausreichender Ersatz für diese Integrationspfade.

  </Accordion>

  <Accordion title="Vitest pool and isolation defaults">

    - Die Basis-Vitest-Konfiguration verwendet standardmäßig `threads`.
    - Die gemeinsame Vitest-Konfiguration legt `isolate: false` fest und verwendet den nicht isolierten Runner für die Root-Projekte, E2E- und Live-Konfigurationen.
    - Die Root-UI-Lane behält ihr `jsdom`-Setup und ihren Optimizer bei, läuft aber ebenfalls auf dem gemeinsamen nicht isolierten Runner.
    - Jeder `pnpm test`-Shard erbt dieselben Standardwerte `threads` + `isolate: false` aus der gemeinsamen Vitest-Konfiguration.
    - `scripts/run-vitest.mjs` fügt standardmäßig `--no-maglev` für Vitest-Child-Node-Prozesse hinzu, um V8-Kompilierungsaufwand während großer lokaler Läufe zu reduzieren. Setzen Sie `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, um mit dem Standardverhalten von V8 zu vergleichen.

  </Accordion>

  <Accordion title="Fast local iteration">

    - `pnpm changed:lanes` zeigt, welche Architektur-Lanes ein Diff auslöst.
    - Der Pre-Commit-Hook ist nur für Formatierung zuständig. Er staged formatierte Dateien erneut und führt weder Lint noch Typecheck oder Tests aus.
    - Führen Sie `pnpm check:changed` explizit vor der Übergabe oder vor dem Push aus, wenn Sie das intelligente lokale Check-Gate benötigen.
    - `pnpm test:changed` leitet standardmäßig über günstige bereichsspezifische Lanes. Verwenden Sie `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` nur, wenn der Agent entscheidet, dass eine Harness-, Config-, Package- oder Contract-Änderung wirklich breitere Vitest-Coverage benötigt.
    - `pnpm test:max` und `pnpm test:changed:max` behalten dasselbe Routing-Verhalten bei, nur mit einer höheren Worker-Obergrenze.
    - Die lokale Worker-Autoskalierung ist absichtlich konservativ und reduziert die Last, wenn der Host-Load-Average bereits hoch ist, sodass mehrere gleichzeitige Vitest-Läufe standardmäßig weniger Schaden anrichten.
    - Die Basis-Vitest-Konfiguration markiert die Projekte/Config-Dateien als `forceRerunTriggers`, damit Changed-Mode-Neuläufe korrekt bleiben, wenn sich die Testverdrahtung ändert.
    - Die Config hält `OPENCLAW_VITEST_FS_MODULE_CACHE` auf unterstützten Hosts aktiviert; setzen Sie `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, wenn Sie einen expliziten Cache-Ort für direktes Profiling wünschen.

  </Accordion>

  <Accordion title="Perf debugging">

    - `pnpm test:perf:imports` aktiviert Vitest-Reporting zur Importdauer plus Import-Breakdown-Ausgabe.
    - `pnpm test:perf:imports:changed` beschränkt dieselbe Profiling-Ansicht auf Dateien, die seit `origin/main` geändert wurden.
    - Shard-Timing-Daten werden nach `.artifacts/vitest-shard-timings.json` geschrieben. Läufe über die gesamte Config verwenden den Config-Pfad als Schlüssel; Include-Pattern-CI-Shards hängen den Shard-Namen an, damit gefilterte Shards separat verfolgt werden können.
    - Wenn ein heißer Test weiterhin den größten Teil seiner Zeit in Startimports verbringt, halten Sie schwere Dependencies hinter einer schmalen lokalen `*.runtime.ts`-Seam und mocken Sie diese Seam direkt, statt Runtime-Helpers tief zu importieren, nur um sie durch `vi.mock(...)` weiterzureichen.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` vergleicht das geroutete `test:changed` mit dem nativen Root-Projekt-Pfad für diesen committeten Diff und gibt Wall Time plus macOS-Max-RSS aus.
    - `pnpm test:perf:changed:bench -- --worktree` benchmarked den aktuellen Dirty Tree, indem die Liste geänderter Dateien durch `scripts/test-projects.mjs` und die Root-Vitest-Konfiguration geroutet wird.
    - `pnpm test:perf:profile:main` schreibt ein Main-Thread-CPU-Profil für Vitest-/Vite-Startup und Transform-Overhead.
    - `pnpm test:perf:profile:runner` schreibt Runner-CPU- und Heap-Profile für die Unit-Suite mit deaktivierter Datei-Parallelität.

  </Accordion>
</AccordionGroup>

### Stabilität (Gateway)

- Befehl: `pnpm test:stability:gateway`
- Config: `vitest.gateway.config.ts`, auf einen Worker erzwungen
- Umfang:
  - Startet standardmäßig einen echten Loopback-Gateway mit aktivierter Diagnose
  - Treibt synthetischen Gateway-Nachrichten-, Memory- und Large-Payload-Churn durch den Diagnoseereignispfad
  - Fragt `diagnostics.stability` über den Gateway-WS-RPC ab
  - Deckt Persistenz-Helpers für das Diagnose-Stabilitäts-Bundle ab
  - Stellt sicher, dass der Recorder begrenzt bleibt, synthetische RSS-Samples unter dem Pressure-Budget bleiben und Queue-Tiefen pro Sitzung wieder auf null ablaufen
- Erwartungen:
  - CI-sicher und ohne Keys
  - Schmale Lane für Nachverfolgung von Stabilitätsregressionen, kein Ersatz für die vollständige Gateway-Suite

### E2E (Gateway-Smoke)

- Befehl: `pnpm test:e2e`
- Config: `vitest.e2e.config.ts`
- Dateien: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` und gebündelte Plugin-E2E-Tests unter `extensions/`
- Runtime-Standardwerte:
  - Verwendet Vitest `threads` mit `isolate: false`, passend zum Rest des Repos.
  - Verwendet adaptive Worker (CI: bis zu 2, lokal: standardmäßig 1).
  - Läuft standardmäßig im Silent-Modus, um Console-I/O-Overhead zu reduzieren.
- Nützliche Overrides:
  - `OPENCLAW_E2E_WORKERS=<n>`, um die Worker-Anzahl zu erzwingen (auf 16 begrenzt).
  - `OPENCLAW_E2E_VERBOSE=1`, um ausführliche Konsolenausgabe wieder zu aktivieren.
- Umfang:
  - End-to-End-Verhalten von Gateway-Mehrfachinstanzen
  - WebSocket-/HTTP-Oberflächen, Node-Pairing und schwereres Networking
- Erwartungen:
  - Läuft in CI (wenn in der Pipeline aktiviert)
  - Keine echten Keys erforderlich
  - Mehr bewegliche Teile als Unit-Tests (kann langsamer sein)

### E2E: OpenShell-Backend-Smoke

- Befehl: `pnpm test:e2e:openshell`
- Datei: `extensions/openshell/src/backend.e2e.test.ts`
- Umfang:
  - Startet über Docker einen isolierten OpenShell-Gateway auf dem Host
  - Erstellt eine Sandbox aus einer temporären lokalen Dockerfile
  - Testet das OpenShell-Backend von OpenClaw über echtes `sandbox ssh-config` + SSH-Exec
  - Verifiziert remote-kanonisches Dateisystemverhalten über die Sandbox-fs-Bridge
- Erwartungen:
  - Nur Opt-in; nicht Teil des standardmäßigen `pnpm test:e2e`-Laufs
  - Erfordert eine lokale `openshell`-CLI plus einen funktionierenden Docker-Daemon
  - Verwendet isoliertes `HOME` / `XDG_CONFIG_HOME` und zerstört danach den Test-Gateway und die Sandbox
- Nützliche Overrides:
  - `OPENCLAW_E2E_OPENSHELL=1`, um den Test zu aktivieren, wenn die breitere E2E-Suite manuell ausgeführt wird
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, um auf ein nicht standardmäßiges CLI-Binary oder Wrapper-Skript zu zeigen

### Live (echte Provider + echte Modelle)

- Befehl: `pnpm test:live`
- Config: `vitest.live.config.ts`
- Dateien: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` und gebündelte Plugin-Live-Tests unter `extensions/`
- Standard: durch `pnpm test:live` **aktiviert** (setzt `OPENCLAW_LIVE_TEST=1`)
- Umfang:
  - „Funktioniert dieser Provider/dieses Modell _heute_ tatsächlich mit echten Zugangsdaten?“
  - Erkennt Provider-Formatänderungen, Besonderheiten bei Tool-Aufrufen, Auth-Probleme und Rate-Limit-Verhalten
- Erwartungen:
  - Per Design nicht CI-stabil (echte Netzwerke, echte Provider-Richtlinien, Kontingente, Ausfälle)
  - Kostet Geld / verwendet Rate Limits
  - Bevorzugen Sie eingeschränkte Teilmengen statt „alles“ auszuführen
- Live-Läufe sourcen `~/.profile`, um fehlende API-Keys aufzunehmen.
- Standardmäßig isolieren Live-Läufe weiterhin `HOME` und kopieren Config-/Auth-Material in ein temporäres Test-Home, damit Unit-Fixtures Ihr echtes `~/.openclaw` nicht verändern können.
- Setzen Sie `OPENCLAW_LIVE_USE_REAL_HOME=1` nur, wenn Live-Tests absichtlich Ihr echtes Home-Verzeichnis verwenden müssen.
- `pnpm test:live` verwendet jetzt standardmäßig einen ruhigeren Modus: Es behält `[live] ...`-Fortschrittsausgaben bei, unterdrückt aber den zusätzlichen Hinweis zu `~/.profile` und schaltet Gateway-Bootstrap-Logs/Bonjour-Ausgaben stumm. Setzen Sie `OPENCLAW_LIVE_TEST_QUIET=0`, wenn Sie die vollständigen Startlogs wiederhaben möchten.
- API-Key-Rotation (Provider-spezifisch): Setzen Sie `*_API_KEYS` im Komma-/Semikolonformat oder `*_API_KEY_1`, `*_API_KEY_2` (zum Beispiel `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) oder einen Live-spezifischen Override per `OPENCLAW_LIVE_*_KEY`; Tests versuchen es bei Rate-Limit-Antworten erneut.
- Fortschritts-/Heartbeat-Ausgabe:
  - Live-Suites geben jetzt Fortschrittszeilen nach stderr aus, sodass lange Provider-Aufrufe sichtbar aktiv sind, selbst wenn Vitest-Konsolenerfassung ruhig ist.
  - `vitest.live.config.ts` deaktiviert Vitests Konsoleninterception, damit Provider-/Gateway-Fortschrittszeilen während Live-Läufen sofort streamen.
  - Stimmen Sie Direct-Model-Heartbeats mit `OPENCLAW_LIVE_HEARTBEAT_MS` ab.
  - Stimmen Sie Gateway-/Probe-Heartbeats mit `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` ab.

## Welche Suite sollte ich ausführen?

Verwenden Sie diese Entscheidungstabelle:

- Bearbeitungslogik/-tests: `pnpm test` ausführen (und `pnpm test:coverage`, wenn Sie viel geändert haben)
- Änderungen an Gateway-Netzwerk / WS-Protokoll / Pairing: `pnpm test:e2e` hinzufügen
- Debugging von „mein Bot ist ausgefallen“ / Provider-spezifischen Fehlern / Tool-Aufrufen: einen eingegrenzten `pnpm test:live` ausführen

## Live-Tests (mit Netzwerkzugriff)

Für die Live-Modellmatrix, CLI-Backend-Smokes, ACP-Smokes, den Codex-App-Server-
Harness und alle Live-Tests für Medien-Provider (Deepgram, BytePlus, ComfyUI, Bild,
Musik, Video, Medien-Harness) – plus Umgang mit Zugangsdaten für Live-Läufe – siehe
[Tests – Live-Suites](/de/help/testing-live).

## Docker-Runner (optionale „funktioniert unter Linux“-Prüfungen)

Diese Docker-Runner sind in zwei Gruppen aufgeteilt:

- Live-Modell-Runner: `test:docker:live-models` und `test:docker:live-gateway` führen nur die jeweils passende Live-Datei mit Profil-Schlüssel im Docker-Image des Repos aus (`src/agents/models.profiles.live.test.ts` und `src/gateway/gateway-models.profiles.live.test.ts`), wobei Ihr lokales Konfigurationsverzeichnis und Ihr Workspace eingebunden werden (und `~/.profile` eingelesen wird, falls eingebunden). Die entsprechenden lokalen Einstiegspunkte sind `test:live:models-profiles` und `test:live:gateway-profiles`.
- Docker-Live-Runner verwenden standardmäßig eine kleinere Smoke-Obergrenze, damit ein vollständiger Docker-Durchlauf praktikabel bleibt:
  `test:docker:live-models` verwendet standardmäßig `OPENCLAW_LIVE_MAX_MODELS=12`, und
  `test:docker:live-gateway` verwendet standardmäßig `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` und
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Überschreiben Sie diese Umgebungsvariablen, wenn Sie
  ausdrücklich den größeren, vollständigen Scan wünschen.
- `test:docker:all` baut das Live-Docker-Image einmal über `test:docker:live-build`, packt OpenClaw einmal als npm-Tarball über `scripts/package-openclaw-for-docker.mjs` und baut bzw. verwendet dann zwei `scripts/e2e/Dockerfile`-Images wieder. Das Bare-Image ist nur der Node/Git-Runner für Installations-, Update- und Plugin-Abhängigkeits-Lanes; diese Lanes binden den vorab erstellten Tarball ein. Das funktionale Image installiert denselben Tarball nach `/app` für Lanes mit Built-App-Funktionalität. Docker-Lane-Definitionen liegen in `scripts/lib/docker-e2e-scenarios.mjs`; die Planner-Logik liegt in `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` führt den ausgewählten Plan aus. Das Aggregat verwendet einen gewichteten lokalen Scheduler: `OPENCLAW_DOCKER_ALL_PARALLELISM` steuert Prozess-Slots, während Ressourcenobergrenzen verhindern, dass schwere Live-, npm-Installations- und Multi-Service-Lanes alle gleichzeitig starten. Wenn eine einzelne Lane schwerer ist als die aktiven Obergrenzen, kann der Scheduler sie trotzdem starten, wenn der Pool leer ist, und lässt sie dann allein laufen, bis wieder Kapazität verfügbar ist. Standardwerte sind 10 Slots, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` und `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; passen Sie `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` oder `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` nur an, wenn der Docker-Host mehr Spielraum hat. Der Runner führt standardmäßig eine Docker-Vorabprüfung aus, entfernt veraltete OpenClaw-E2E-Container, gibt alle 30 Sekunden den Status aus, speichert erfolgreiche Lane-Laufzeiten in `.artifacts/docker-tests/lane-timings.json` und nutzt diese Laufzeiten, um bei späteren Läufen längere Lanes zuerst zu starten. Verwenden Sie `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, um das gewichtete Lane-Manifest ohne Build oder Docker-Ausführung auszugeben, oder `node scripts/test-docker-all.mjs --plan-json`, um den CI-Plan für ausgewählte Lanes, Paket-/Image-Anforderungen und Zugangsdaten auszugeben.
- `Package Acceptance` ist das GitHub-native Paket-Gate für „funktioniert dieser installierbare Tarball als Produkt?“. Es löst ein Kandidatenpaket aus `source=npm`, `source=ref`, `source=url` oder `source=artifact` auf, lädt es als `package-under-test` hoch und führt dann die wiederverwendbaren Docker-E2E-Lanes gegen genau diesen Tarball aus, statt den ausgewählten Ref erneut zu packen. `workflow_ref` wählt die vertrauenswürdigen Workflow-/Harness-Skripte aus, während `package_ref` den Quell-Commit, Branch oder Tag auswählt, der bei `source=ref` gepackt wird; dadurch kann aktuelle Acceptance-Logik ältere vertrauenswürdige Commits validieren. Profile sind nach Umfang geordnet: `smoke` ist eine schnelle Installations-/Channel-/Agent-Prüfung plus Gateway/Konfiguration, `package` ist der Paket-/Update-/Plugin-Vertrag plus das keyless Upgrade-Survivor-Fixture, die Published-Baseline-Upgrade-Survivor-Lane und der standardmäßige native Ersatz für die meiste Parallels-Paket-/Update-Abdeckung, `product` ergänzt MCP-Channels, Cron-/Subagent-Bereinigung, OpenAI-Websuche und OpenWebUI, und `full` führt die Docker-Chunks des Release-Pfads mit OpenWebUI aus. Für `published-upgrade-survivor` verwendet Package Acceptance immer `package-under-test` als Kandidaten und `published_upgrade_survivor_baseline` als veröffentlichte Baseline, standardmäßig `openclaw@latest`; teilen Sie breitere Abdeckung auf, indem Sie mehrere Läufe mit exakten Baseline-Werten auslösen. Die veröffentlichte Lane konfiguriert ihre Baseline mit einem eingebetteten `openclaw config set`-Befehlsrezept und zeichnet die Rezeptschritte anschließend in der Lane-Zusammenfassung auf. Die Release-Validierung führt ein benutzerdefiniertes Paket-Delta (`bundled-channel-deps-compat plugins-offline`) plus Telegram-Paket-QA aus, weil die Docker-Chunks des Release-Pfads bereits die überlappenden Paket-/Update-/Plugin-Lanes abdecken. Aus Artefakten erzeugte gezielte GitHub-Docker-Rerun-Befehle enthalten das vorherige Paketartefakt, vorbereitete Image-Eingaben und, wenn verfügbar, die veröffentlichte Upgrade-Survivor-Baseline, sodass fehlgeschlagene Lanes Paket und Images nicht erneut bauen müssen.
- Build- und Release-Prüfungen führen `scripts/check-cli-bootstrap-imports.mjs` nach tsdown aus. Der Guard durchläuft den statisch gebauten Graphen ab `dist/entry.js` und `dist/cli/run-main.js` und schlägt fehl, wenn der Pre-Dispatch-Start Paketabhängigkeiten wie Commander, Prompt-UI, undici oder Logging vor der Befehlsauswahl importiert; außerdem hält er den gebündelten Gateway-Run-Chunk innerhalb des Budgets und weist statische Imports bekannter kalter Gateway-Pfade zurück. Der gepackte CLI-Smoke deckt außerdem Root-Hilfe, Onboard-Hilfe, Doctor-Hilfe, Status, Konfigurationsschema und einen Modelllisten-Befehl ab.
- Die Legacy-Kompatibilität von Package Acceptance ist bei `2026.4.25` gedeckelt (`2026.4.25-beta.*` eingeschlossen). Bis zu diesem Stichtag toleriert der Harness nur Metadatenlücken ausgelieferter Pakete: ausgelassene private QA-Inventareinträge, fehlendes `gateway install --wrapper`, fehlende Patch-Dateien im aus dem Tarball abgeleiteten Git-Fixture, fehlendes persistiertes `update.channel`, alte Plugin-Installationsdatensatz-Speicherorte, fehlende Marketplace-Installationsdatensatz-Persistenz und Konfigurationsmetadatenmigration während `plugins update`. Für Pakete nach `2026.4.25` sind diese Pfade strikte Fehler.
- Container-Smoke-Runner: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update` und `test:docker:config-reload` starten einen oder mehrere echte Container und prüfen Integrationspfade auf höherer Ebene.

Die Live-Modell-Docker-Runner binden außerdem nur die benötigten CLI-Auth-Homes ein (oder alle unterstützten, wenn der Lauf nicht eingegrenzt ist) und kopieren sie dann vor dem Lauf in das Container-Home, damit OAuth externer CLIs Tokens aktualisieren kann, ohne den Auth-Speicher des Hosts zu verändern:

- Direkte Modelle: `pnpm test:docker:live-models` (Skript: `scripts/test-live-models-docker.sh`)
- ACP-Bind-Smoke-Test: `pnpm test:docker:live-acp-bind` (Skript: `scripts/test-live-acp-bind-docker.sh`; deckt Claude, Codex und Gemini standardmäßig ab, mit strikter Droid/OpenCode-Abdeckung über `pnpm test:docker:live-acp-bind:droid` und `pnpm test:docker:live-acp-bind:opencode`)
- CLI-Backend-Smoke-Test: `pnpm test:docker:live-cli-backend` (Skript: `scripts/test-live-cli-backend-docker.sh`)
- Codex-App-Server-Harness-Smoke-Test: `pnpm test:docker:live-codex-harness` (Skript: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + Dev-Agent: `pnpm test:docker:live-gateway` (Skript: `scripts/test-live-gateway-models-docker.sh`)
- Beobachtbarkeits-Smoke-Test: `pnpm qa:otel:smoke` ist eine private QA-Lane aus dem Source-Checkout. Sie ist absichtlich nicht Teil der Package-Docker-Release-Lanes, weil der npm-Tarball QA Lab auslässt.
- Open WebUI-Live-Smoke-Test: `pnpm test:docker:openwebui` (Skript: `scripts/e2e/openwebui-docker.sh`)
- Onboarding-Assistent (TTY, vollständiges Scaffolding): `pnpm test:docker:onboard` (Skript: `scripts/e2e/onboard-docker.sh`)
- Npm-Tarball-Smoke-Test für Onboarding/Kanal/Agent: `pnpm test:docker:npm-onboard-channel-agent` installiert den gepackten OpenClaw-Tarball global in Docker, konfiguriert OpenAI per Env-Ref-Onboarding plus standardmäßig Telegram, prüft, dass Doctor aktivierte Plugin-Runtime-Abhängigkeiten repariert, und führt einen gemockten OpenAI-Agent-Turn aus. Verwenden Sie einen vorab gebauten Tarball mit `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` wieder, überspringen Sie den Host-Rebuild mit `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, oder wechseln Sie den Kanal mit `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke-Test für Update-Kanalwechsel: `pnpm test:docker:update-channel-switch` installiert den gepackten OpenClaw-Tarball global in Docker, wechselt von Package `stable` zu Git `dev`, prüft den persistierten Kanal und die Plugin-Arbeit nach dem Update, wechselt dann zurück zu Package `stable` und prüft den Update-Status.
- Upgrade-Survivor-Smoke-Test: `pnpm test:docker:upgrade-survivor` installiert den gepackten OpenClaw-Tarball über ein unverändertes Altnutzer-Fixture mit Agenten, Kanalkonfiguration, Plugin-Allowlists, veraltetem Zustand der Plugin-Runtime-Abhängigkeiten und vorhandenen Workspace-/Sitzungsdateien. Er führt ein Package-Update plus nicht interaktiven Doctor ohne Live-Provider- oder Kanalschlüssel aus, startet dann ein loopback-Gateway und prüft die Beibehaltung von Konfiguration/Zustand sowie Start-/Status-Budgets.
- Veröffentlichter Upgrade-Survivor-Smoke-Test: `pnpm test:docker:published-upgrade-survivor` installiert standardmäßig `openclaw@latest`, erzeugt realistische vorhandene Nutzerdateien, konfiguriert diese Baseline mit einem eingebetteten Befehlsrezept, validiert die resultierende Konfiguration, aktualisiert diese veröffentlichte Installation auf den Kandidaten-Tarball, führt den nicht interaktiven Doctor aus, schreibt `.artifacts/upgrade-survivor/summary.json`, startet dann ein loopback-Gateway und prüft konfigurierte Intents, Zustandserhaltung, Start und Status-Budgets. Überschreiben Sie die Baseline mit `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`; Package Acceptance stellt denselben Wert als `published_upgrade_survivor_baseline` bereit.
- Smoke-Test für Sitzungs-Runtime-Kontext: `pnpm test:docker:session-runtime-context` prüft die Persistenz versteckter Runtime-Kontext-Transkripte plus die Doctor-Reparatur betroffener duplizierter Prompt-Rewrite-Branches.
- Smoke-Test für globale Bun-Installation: `bash scripts/e2e/bun-global-install-smoke.sh` packt den aktuellen Tree, installiert ihn mit `bun install -g` in einem isolierten Home und prüft, dass `openclaw infer image providers --json` gebündelte Bild-Provider zurückgibt, statt hängen zu bleiben. Verwenden Sie einen vorab gebauten Tarball mit `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` wieder, überspringen Sie den Host-Build mit `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, oder kopieren Sie `dist/` aus einem gebauten Docker-Image mit `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Installer-Docker-Smoke-Test: `bash scripts/test-install-sh-docker.sh` teilt einen npm-Cache zwischen seinen Root-, Update- und direkten npm-Containern. Der Update-Smoke-Test nutzt standardmäßig npm `latest` als stabile Baseline vor dem Upgrade auf den Kandidaten-Tarball. Überschreiben Sie dies lokal mit `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` oder auf GitHub mit der Eingabe `update_baseline_version` des Install-Smoke-Workflows. Nicht-Root-Installer-Prüfungen behalten einen isolierten npm-Cache, damit root-eigene Cache-Einträge das nutzerlokale Installationsverhalten nicht verdecken. Setzen Sie `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, um den Root-/Update-/Direct-npm-Cache über lokale Wiederholungen hinweg wiederzuverwenden.
- Install Smoke CI überspringt das doppelte direkte globale npm-Update mit `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; führen Sie das Skript lokal ohne diese Env aus, wenn Abdeckung für direktes `npm install -g` benötigt wird.
- Agents-delete-shared-workspace-CLI-Smoke-Test: `pnpm test:docker:agents-delete-shared-workspace` (Skript: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) baut standardmäßig das Root-Dockerfile-Image, legt zwei Agenten mit einem Workspace in einem isolierten Container-Home an, führt `agents delete --json` aus und prüft gültiges JSON plus Verhalten für beibehaltene Workspaces. Verwenden Sie das Install-Smoke-Image mit `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` wieder.
- Gateway-Netzwerk (zwei Container, WS-Auth + Health): `pnpm test:docker:gateway-network` (Skript: `scripts/e2e/gateway-network-docker.sh`)
- Browser-CDP-Snapshot-Smoke-Test: `pnpm test:docker:browser-cdp-snapshot` (Skript: `scripts/e2e/browser-cdp-snapshot-docker.sh`) baut das Source-E2E-Image plus eine Chromium-Schicht, startet Chromium mit rohem CDP, führt `browser doctor --deep` aus und prüft, dass CDP-Rollen-Snapshots Link-URLs, per Cursor hochgestufte anklickbare Elemente, iframe-Refs und Frame-Metadaten abdecken.
- OpenAI-Responses-Regression für `web_search` mit minimalem Reasoning: `pnpm test:docker:openai-web-search-minimal` (Skript: `scripts/e2e/openai-web-search-minimal-docker.sh`) führt einen gemockten OpenAI-Server über Gateway aus, prüft, dass `web_search` `reasoning.effort` von `minimal` auf `low` anhebt, erzwingt dann die Ablehnung durch das Provider-Schema und prüft, dass das rohe Detail in Gateway-Logs erscheint.
- MCP-Kanal-Bridge (vorkonfiguriertes Gateway + stdio-Bridge + Smoke-Test für rohe Claude-Notification-Frames): `pnpm test:docker:mcp-channels` (Skript: `scripts/e2e/mcp-channels-docker.sh`)
- Pi-Bundle-MCP-Tools (echter stdio-MCP-Server + eingebetteter Pi-Profil-Allow/Deny-Smoke-Test): `pnpm test:docker:pi-bundle-mcp-tools` (Skript: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cron-/Subagent-MCP-Cleanup (echtes Gateway + stdio-MCP-Child-Teardown nach isolierten Cron- und einmaligen Subagent-Läufen): `pnpm test:docker:cron-mcp-cleanup` (Skript: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (Install-Smoke-Test, ClawHub-Kitchen-Sink-Install/Uninstall, Marketplace-Updates und Claude-Bundle-Enable/Inspect): `pnpm test:docker:plugins` (Skript: `scripts/e2e/plugins-docker.sh`)
  Setzen Sie `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, um den ClawHub-Block zu überspringen, oder überschreiben Sie das standardmäßige Kitchen-Sink-Package-/Runtime-Paar mit `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` und `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Ohne `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` verwendet der Test einen hermetischen lokalen ClawHub-Fixture-Server.
- Smoke-Test für unverändertes Plugin-Update: `pnpm test:docker:plugin-update` (Skript: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Smoke-Test für Config-Reload-Metadaten: `pnpm test:docker:config-reload` (Skript: `scripts/e2e/config-reload-source-docker.sh`)
- Gebündelte Plugin-Runtime-Abhängigkeiten: `pnpm test:docker:bundled-channel-deps` baut standardmäßig ein kleines Docker-Runner-Image, baut und packt OpenClaw einmal auf dem Host und mountet diesen Tarball dann in jedes Linux-Installationsszenario. Verwenden Sie das Image mit `OPENCLAW_SKIP_DOCKER_BUILD=1` wieder, überspringen Sie den Host-Rebuild nach einem frischen lokalen Build mit `OPENCLAW_BUNDLED_CHANNEL_HOST_BUILD=0`, oder verweisen Sie mit `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` auf einen vorhandenen Tarball. Das vollständige Docker-Aggregat und die Release-Path-Bundled-Channel-Chunks pre-packen diesen Tarball einmal und sharden dann gebündelte Kanalprüfungen in unabhängige Lanes, einschließlich separater Update-Lanes für Telegram, Discord, Slack, Feishu, memory-lancedb und ACPX. Release-Chunks teilen Kanal-Smoke-Tests, Update-Ziele und Setup-/Runtime-Verträge in `bundled-channels-core`, `bundled-channels-update-a`, `bundled-channels-update-b` und `bundled-channels-contracts`; der Aggregat-Chunk `bundled-channels` bleibt für manuelle Wiederholungen verfügbar. Der Release-Workflow teilt außerdem Provider-Installer-Chunks und gebündelte Plugin-Install-/Uninstall-Chunks; die Legacy-Chunks `package-update`, `plugins-runtime` und `plugins-integrations` bleiben Aggregat-Aliasse für manuelle Wiederholungen. Verwenden Sie `OPENCLAW_BUNDLED_CHANNELS=telegram,slack`, um die Kanalmatrix beim direkten Ausführen der gebündelten Lane einzugrenzen, oder `OPENCLAW_BUNDLED_CHANNEL_UPDATE_TARGETS=telegram,acpx`, um das Update-Szenario einzugrenzen. Docker-Läufe pro Szenario verwenden standardmäßig `OPENCLAW_BUNDLED_CHANNEL_DOCKER_RUN_TIMEOUT=900s`; das Mehrziel-Update-Szenario verwendet standardmäßig `OPENCLAW_BUNDLED_CHANNEL_UPDATE_DOCKER_RUN_TIMEOUT=2400s`. Die Lane prüft außerdem, dass `channels.<id>.enabled=false` und `plugins.entries.<id>.enabled=false` die Doctor-/Runtime-Abhängigkeitsreparatur unterdrücken.
- Grenzen Sie gebündelte Plugin-Runtime-Abhängigkeiten während der Iteration ein, indem Sie nicht zusammenhängende Szenarien deaktivieren, zum Beispiel:
  `OPENCLAW_BUNDLED_CHANNEL_SCENARIOS=0 OPENCLAW_BUNDLED_CHANNEL_UPDATE_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_ROOT_OWNED_SCENARIO=0 OPENCLAW_BUNDLED_CHANNEL_SETUP_ENTRY_SCENARIO=0 pnpm test:docker:bundled-channel-deps`.

Um das gemeinsam genutzte funktionale Image manuell vorzubauen und wiederzuverwenden:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Suite-spezifische Image-Overrides wie `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` haben weiterhin Vorrang, wenn sie gesetzt sind. Wenn `OPENCLAW_SKIP_DOCKER_BUILD=1` auf ein remote gemeinsam genutztes Image zeigt, ziehen die Skripte es, falls es noch nicht lokal vorhanden ist. Die QR- und Installer-Docker-Tests behalten ihre eigenen Dockerfiles, weil sie Package-/Installationsverhalten statt der gemeinsam gebauten App-Runtime validieren.

Die Live-Modell-Docker-Runner binden außerdem den aktuellen Checkout schreibgeschützt ein und
stellen ihn in einem temporären Arbeitsverzeichnis im Container bereit. Dadurch bleibt das Runtime-
Image schlank, während Vitest trotzdem gegen Ihre exakte lokale Quelle/Konfiguration läuft.
Der Staging-Schritt überspringt große rein lokale Caches und App-Build-Ausgaben wie
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` sowie app-lokale `.build`- oder
Gradle-Ausgabeverzeichnisse, damit Docker-Live-Läufe nicht minutenlang
maschinenspezifische Artefakte kopieren.
Sie setzen außerdem `OPENCLAW_SKIP_CHANNELS=1`, damit Gateway-Live-Probes keine
echten Telegram-/Discord-/usw.-Channel-Worker im Container starten.
`test:docker:live-models` führt weiterhin `pnpm test:live` aus; reichen Sie daher
auch `OPENCLAW_LIVE_GATEWAY_*` durch, wenn Sie die Gateway-
Live-Abdeckung in dieser Docker-Lane eingrenzen oder ausschließen müssen.
`test:docker:openwebui` ist ein höherstufiger Kompatibilitäts-Smoke: Es startet einen
OpenClaw-Gateway-Container mit aktivierten OpenAI-kompatiblen HTTP-Endpunkten,
startet einen gepinnten Open WebUI-Container gegen dieses Gateway, meldet sich über
Open WebUI an, verifiziert, dass `/api/models` `openclaw/default` bereitstellt, und sendet dann eine
echte Chat-Anfrage über den `/api/chat/completions`-Proxy von Open WebUI.
Der erste Lauf kann deutlich langsamer sein, weil Docker möglicherweise das
Open WebUI-Image ziehen muss und Open WebUI eventuell seine eigene Cold-Start-Einrichtung abschließen muss.
Diese Lane erwartet einen nutzbaren Live-Modellschlüssel, und `OPENCLAW_PROFILE_FILE`
(standardmäßig `~/.profile`) ist die primäre Möglichkeit, ihn in Dockerisierten Läufen bereitzustellen.
Erfolgreiche Läufe geben eine kleine JSON-Nutzlast wie `{ "ok": true, "model":
"openclaw/default", ... }` aus.
`test:docker:mcp-channels` ist absichtlich deterministisch und benötigt kein
echtes Telegram-, Discord- oder iMessage-Konto. Es startet einen gesetzten Gateway-
Container, startet einen zweiten Container, der `openclaw mcp serve` erzeugt, und
verifiziert dann geroutete Conversation Discovery, Transcript-Lesezugriffe, Attachment-Metadaten,
Live-Event-Queue-Verhalten, ausgehendes Send-Routing sowie Channel- und
Berechtigungsbenachrichtigungen im Claude-Stil über die echte stdio-MCP-Bridge. Die Benachrichtigungsprüfung
untersucht die rohen stdio-MCP-Frames direkt, sodass der Smoke validiert, was die
Bridge tatsächlich ausgibt, und nicht nur, was ein bestimmtes Client-SDK zufällig bereitstellt.
`test:docker:pi-bundle-mcp-tools` ist deterministisch und benötigt keinen Live-
Modellschlüssel. Es baut das Repo-Docker-Image, startet einen echten stdio-MCP-Probe-Server
im Container, materialisiert diesen Server über die eingebettete Pi-Bundle-
MCP-Runtime, führt das Tool aus und verifiziert anschließend, dass `coding` und `messaging`
`bundle-mcp`-Tools behalten, während `minimal` und `tools.deny: ["bundle-mcp"]` sie filtern.
`test:docker:cron-mcp-cleanup` ist deterministisch und benötigt keinen Live-Modellschlüssel.
Es startet ein gesetztes Gateway mit einem echten stdio-MCP-Probe-Server, führt einen
isolierten Cron-Turn und einen `/subagents spawn`-One-Shot-Child-Turn aus und verifiziert dann,
dass der MCP-Child-Prozess nach jedem Lauf beendet wird.

Manueller ACP-Plain-Language-Thread-Smoke (nicht CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Behalten Sie dieses Skript für Regressions-/Debug-Workflows. Es kann für die ACP-Thread-Routing-Validierung erneut benötigt werden, löschen Sie es daher nicht.

Nützliche Env Vars:

- `OPENCLAW_CONFIG_DIR=...` (Standard: `~/.openclaw`), eingehängt nach `/home/node/.openclaw`
- `OPENCLAW_WORKSPACE_DIR=...` (Standard: `~/.openclaw/workspace`), eingehängt nach `/home/node/.openclaw/workspace`
- `OPENCLAW_PROFILE_FILE=...` (Standard: `~/.profile`), eingehängt nach `/home/node/.profile` und vor dem Ausführen der Tests gesourct
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, um nur Env Vars zu verifizieren, die aus `OPENCLAW_PROFILE_FILE` gesourct wurden, mit temporären Konfigurations-/Workspace-Verzeichnissen und ohne externe CLI-Auth-Mounts
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (Standard: `~/.cache/openclaw/docker-cli-tools`), eingehängt nach `/home/node/.npm-global` für gecachte CLI-Installationen in Docker
- Externe CLI-Auth-Verzeichnisse/-Dateien unter `$HOME` werden schreibgeschützt unter `/host-auth...` eingehängt und dann vor Testbeginn nach `/home/node/...` kopiert
  - Standardverzeichnisse: `.minimax`
  - Standarddateien: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Eingegrenzte Provider-Läufe mounten nur die benötigten Verzeichnisse/Dateien, die aus `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` abgeleitet werden
  - Manuelle Überschreibung mit `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` oder einer Kommaliste wie `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, um den Lauf einzugrenzen
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, um Provider im Container zu filtern
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, um ein vorhandenes `openclaw:local-live`-Image für Wiederholungen wiederzuverwenden, die keinen Rebuild benötigen
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um sicherzustellen, dass Zugangsdaten aus dem Profilspeicher stammen (nicht aus Env)
- `OPENCLAW_OPENWEBUI_MODEL=...`, um das vom Gateway für den Open-WebUI-Smoke bereitgestellte Modell auszuwählen
- `OPENCLAW_OPENWEBUI_PROMPT=...`, um den vom Open-WebUI-Smoke verwendeten Nonce-Check-Prompt zu überschreiben
- `OPENWEBUI_IMAGE=...`, um den gepinnten Open-WebUI-Image-Tag zu überschreiben

## Docs-Sanity

Führen Sie nach Dokumentationsänderungen Docs-Prüfungen aus: `pnpm check:docs`.
Führen Sie die vollständige Mintlify-Anker-Validierung aus, wenn Sie zusätzlich In-Page-Heading-Prüfungen benötigen: `pnpm docs:check-links:anchors`.

## Offline-Regression (CI-sicher)

Dies sind Regressionen der „echten Pipeline“ ohne echte Provider:

- Gateway-Tool-Calling (Mock-OpenAI, echtes Gateway + Agent-Loop): `src/gateway/gateway.test.ts` (Fall: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway-Wizard (WS `wizard.start`/`wizard.next`, schreibt Konfiguration + Auth erzwungen): `src/gateway/gateway.test.ts` (Fall: "runs wizard over ws and writes auth token config")

## Agent-Zuverlässigkeits-Evals (Skills)

Wir haben bereits einige CI-sichere Tests, die sich wie „Agent-Zuverlässigkeits-Evals“ verhalten:

- Mock-Tool-Calling durch das echte Gateway + Agent-Loop (`src/gateway/gateway.test.ts`).
- End-to-End-Wizard-Flows, die Session-Verkabelung und Konfigurationseffekte validieren (`src/gateway/gateway.test.ts`).

Was für Skills noch fehlt (siehe [Skills](/de/tools/skills)):

- **Entscheidungsfindung:** Wenn Skills im Prompt aufgeführt sind, wählt der Agent den richtigen Skill (oder vermeidet irrelevante)?
- **Compliance:** Liest der Agent vor der Verwendung `SKILL.md` und befolgt erforderliche Schritte/Argumente?
- **Workflow-Verträge:** Mehrturn-Szenarien, die Tool-Reihenfolge, Session-History-Übernahme und Sandbox-Grenzen prüfen.

Zukünftige Evals sollten zuerst deterministisch bleiben:

- Ein Szenario-Runner mit Mock-Providern, um Tool-Aufrufe + Reihenfolge, Skill-Dateilesezugriffe und Session-Verkabelung zu prüfen.
- Eine kleine Suite Skill-fokussierter Szenarien (verwenden vs. vermeiden, Gating, Prompt Injection).
- Optionale Live-Evals (Opt-in, Env-gesteuert) erst, nachdem die CI-sichere Suite vorhanden ist.

## Contract-Tests (Plugin- und Channel-Shape)

Contract-Tests verifizieren, dass jedes registrierte Plugin und jeder registrierte Channel seinem
Interface-Vertrag entspricht. Sie iterieren über alle entdeckten Plugins und führen eine Suite von
Shape- und Verhaltensassertions aus. Die standardmäßige `pnpm test`-Unit-Lane überspringt diese gemeinsamen
Seam- und Smoke-Dateien absichtlich; führen Sie die Contract-Befehle explizit aus,
wenn Sie gemeinsame Channel- oder Provider-Oberflächen berühren.

### Befehle

- Alle Contracts: `pnpm test:contracts`
- Nur Channel-Contracts: `pnpm test:contracts:channels`
- Nur Provider-Contracts: `pnpm test:contracts:plugins`

### Channel-Contracts

Zu finden in `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Grundlegender Plugin-Shape (ID, Name, Capabilities)
- **setup** - Setup-Wizard-Contract
- **session-binding** - Session-Binding-Verhalten
- **outbound-payload** - Struktur der Nachrichten-Nutzlast
- **inbound** - Verarbeitung eingehender Nachrichten
- **actions** - Channel-Action-Handler
- **threading** - Thread-ID-Verarbeitung
- **directory** - Directory-/Roster-API
- **group-policy** - Durchsetzung der Gruppenrichtlinie

### Provider-Status-Contracts

Zu finden in `src/plugins/contracts/*.contract.test.ts`.

- **status** - Channel-Status-Probes
- **registry** - Plugin-Registry-Shape

### Provider-Contracts

Zu finden in `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Auth-Flow-Contract
- **auth-choice** - Auth-Auswahl/Selektion
- **catalog** - Model-Catalog-API
- **discovery** - Plugin-Discovery
- **loader** - Plugin-Laden
- **runtime** - Provider-Runtime
- **shape** - Plugin-Shape/Interface
- **wizard** - Setup-Wizard

### Wann ausführen

- Nach Änderungen an plugin-sdk-Exports oder Subpaths
- Nach dem Hinzufügen oder Ändern eines Channel- oder Provider-Plugins
- Nach Refactoring von Plugin-Registrierung oder Discovery

Contract-Tests laufen in CI und benötigen keine echten API-Schlüssel.

## Regressionen hinzufügen (Leitlinien)

Wenn Sie ein Provider-/Modellproblem beheben, das live entdeckt wurde:

- Fügen Sie nach Möglichkeit eine CI-sichere Regression hinzu (Mock-/Stub-Provider oder Erfassen der exakten Request-Shape-Transformation)
- Wenn es inhärent nur live prüfbar ist (Rate Limits, Auth-Richtlinien), halten Sie den Live-Test eng begrenzt und als Opt-in über Env Vars
- Bevorzugen Sie die kleinste Ebene, die den Fehler erfasst:
  - Provider-Request-Conversion-/Replay-Fehler → direkter Modelltest
  - Gateway-Session-/History-/Tool-Pipeline-Fehler → Gateway-Live-Smoke oder CI-sicherer Gateway-Mock-Test
- SecretRef-Traversal-Guardrail:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` leitet pro SecretRef-Klasse ein gesampeltes Ziel aus Registry-Metadaten (`listSecretTargetRegistryEntries()`) ab und prüft dann, dass Exec-IDs mit Traversal-Segmenten abgelehnt werden.
  - Wenn Sie eine neue `includeInPlan`-SecretRef-Zielfamilie in `src/secrets/target-registry-data.ts` hinzufügen, aktualisieren Sie `classifyTargetClass` in diesem Test. Der Test schlägt absichtlich bei nicht klassifizierten Ziel-IDs fehl, damit neue Klassen nicht stillschweigend übersprungen werden können.

## Verwandt

- [Live testen](/de/help/testing-live)
- [CI](/de/ci)
