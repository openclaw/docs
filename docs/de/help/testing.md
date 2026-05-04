---
read_when:
    - Tests lokal oder in CI ausführen
    - Regressionstests für Modell-/Provider-Fehler hinzufügen
    - Debugging von Gateway- und Agentenverhalten
summary: 'Testkit: Unit-/E2E-/Live-Suiten, Docker-Runner und welche Bereiche jeder Test abdeckt'
title: Tests
x-i18n:
    generated_at: "2026-05-04T06:42:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: ad724e3879d1d4dec21c4ea97e2fd5724c47269c1084c558a09f51bd72afc6a4
    source_path: help/testing.md
    workflow: 16
---

OpenClaw verfügt über drei Vitest-Suites (Unit/Integration, E2E, Live) und eine kleine Auswahl
von Docker-Runnern. Dieses Dokument ist ein Leitfaden dazu, „wie wir testen“:

- Was jede Suite abdeckt (und was sie bewusst _nicht_ abdeckt).
- Welche Befehle Sie für gängige Workflows ausführen sollten (lokal, vor dem Push, Debugging).
- Wie Live-Tests Zugangsdaten ermitteln und Modelle/Provider auswählen.
- Wie Sie Regressionstests für reale Modell-/Provider-Probleme hinzufügen.

<Note>
**QA-Stack (qa-lab, qa-channel, Live-Transport-Lanes)** ist separat dokumentiert:

- [QA-Überblick](/de/concepts/qa-e2e-automation) — Architektur, Befehlsoberfläche, Szenarioerstellung.
- [Matrix-QA](/de/concepts/qa-matrix) — Referenz für `pnpm openclaw qa matrix`.
- [QA-Kanal](/de/channels/qa-channel) — das synthetische Transport-Plugin, das von repository-gestützten Szenarien verwendet wird.

Diese Seite behandelt das Ausführen der regulären Test-Suites und Docker-/Parallels-Runner. Der QA-spezifische Runner-Abschnitt unten ([QA-spezifische Runner](#qa-specific-runners)) listet die konkreten `qa`-Aufrufe auf und verweist auf die oben genannten Referenzen.
</Note>

## Schnellstart

An den meisten Tagen:

- Vollständiges Gate (vor dem Push erwartet): `pnpm build && pnpm check && pnpm check:test-types && pnpm test`
- Schnellerer lokaler Lauf der vollständigen Suite auf einer großzügig ausgestatteten Maschine: `pnpm test:max`
- Direkte Vitest-Watch-Schleife: `pnpm test:watch`
- Direkte Dateiauswahl leitet jetzt auch Erweiterungs-/Kanalpfade weiter: `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts`
- Bevorzugen Sie zunächst gezielte Läufe, wenn Sie an einem einzelnen Fehler iterieren.
- Docker-gestützte QA-Site: `pnpm qa:lab:up`
- Linux-VM-gestützte QA-Lane: `pnpm openclaw qa suite --runner multipass --scenario channel-chat-baseline`

Wenn Sie Tests berühren oder zusätzliche Sicherheit möchten:

- Coverage-Gate: `pnpm test:coverage`
- E2E-Suite: `pnpm test:e2e`

Beim Debuggen realer Provider/Modelle (erfordert echte Zugangsdaten):

- Live-Suite (Modelle + Gateway-Tool-/Bildprüfungen): `pnpm test:live`
- Eine Live-Datei gezielt und leise ausführen: `pnpm test:live -- src/agents/models.profiles.live.test.ts`
- Laufzeit-Performance-Berichte: dispatchen Sie `OpenClaw Performance` mit
  `live_gpt54=true` für einen echten `openai/gpt-5.4`-Agent-Turn oder
  `deep_profile=true` für Kova-CPU-/Heap-/Trace-Artefakte. Täglich geplante Läufe
  veröffentlichen Mock-Provider-, Deep-Profile- und GPT-5.4-Lane-Artefakte in
  `openclaw/clawgrit-reports`, wenn `CLAWGRIT_REPORTS_TOKEN` konfiguriert ist. Der
  Mock-Provider-Bericht enthält außerdem Zahlen zu Gateway-Boot auf Source-Ebene, Speicher,
  Plugin-Druck, wiederholten Fake-Model-Hello-Loops und CLI-Start.
- Docker-Live-Modell-Sweep: `pnpm test:docker:live-models`
  - Jedes ausgewählte Modell führt jetzt einen Text-Turn plus eine kleine Prüfung im Stil eines Datei-Lesezugriffs aus.
    Modelle, deren Metadaten `image`-Eingabe ausweisen, führen außerdem einen kleinen Bild-Turn aus.
    Deaktivieren Sie die zusätzlichen Prüfungen mit `OPENCLAW_LIVE_MODEL_FILE_PROBE=0` oder
    `OPENCLAW_LIVE_MODEL_IMAGE_PROBE=0`, wenn Sie Provider-Fehler isolieren.
  - CI-Abdeckung: Tägliche `OpenClaw Scheduled Live And E2E Checks` und manuelle
    `OpenClaw Release Checks` rufen beide den wiederverwendbaren Live-/E2E-Workflow mit
    `include_live_suites: true` auf, der separate Docker-Live-Modell-Matrix-Jobs enthält,
    die nach Provider geshardet sind.
  - Für fokussierte CI-Neuläufe dispatchen Sie `OpenClaw Live And E2E Checks (Reusable)`
    mit `include_live_suites: true` und `live_models_only: true`.
  - Fügen Sie neue aussagekräftige Provider-Secrets zu `scripts/ci-hydrate-live-auth.sh`
    sowie `.github/workflows/openclaw-live-and-e2e-checks-reusable.yml` und seinen
    geplanten/Release-Aufrufern hinzu.
- Nativer Codex-Bound-Chat-Smoke-Test: `pnpm test:docker:live-codex-bind`
  - Führt eine Docker-Live-Lane gegen den Codex-App-Server-Pfad aus, bindet eine synthetische
    Slack-DM mit `/codex bind`, übt `/codex fast` und
    `/codex permissions` aus und verifiziert anschließend, dass eine einfache Antwort und ein Bildanhang
    über die native Plugin-Bindung statt über ACP geroutet werden.
- Codex-App-Server-Harness-Smoke-Test: `pnpm test:docker:live-codex-harness`
  - Führt Gateway-Agent-Turns durch das Plugin-eigene Codex-App-Server-Harness aus,
    verifiziert `/codex status` und `/codex models` und übt standardmäßig Bild-,
    Cron-MCP-, Sub-Agent- und Guardian-Prüfungen aus. Deaktivieren Sie die Sub-Agent-Prüfung mit
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=0`, wenn Sie andere Codex-
    App-Server-Fehler isolieren. Für eine fokussierte Sub-Agent-Prüfung deaktivieren Sie die anderen Prüfungen:
    `OPENCLAW_LIVE_CODEX_HARNESS_IMAGE_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_MCP_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_GUARDIAN_PROBE=0 OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_PROBE=1 pnpm test:docker:live-codex-harness`.
    Dies beendet den Lauf nach der Sub-Agent-Prüfung, sofern nicht
    `OPENCLAW_LIVE_CODEX_HARNESS_SUBAGENT_ONLY=0` gesetzt ist.
- Crestodian-Rettungsbefehl-Smoke-Test: `pnpm test:live:crestodian-rescue-channel`
  - Opt-in-Prüfung mit doppelter Absicherung für die Rettungsbefehlsoberfläche des Nachrichtenkanals.
    Sie übt `/crestodian status` aus, stellt eine persistente Modelländerung in die Warteschlange,
    antwortet mit `/crestodian yes` und verifiziert den Audit-/Konfigurations-Schreibpfad.
- Crestodian-Planner-Docker-Smoke-Test: `pnpm test:docker:crestodian-planner`
  - Führt Crestodian in einem konfigurationslosen Container mit einer gefälschten Claude-CLI auf `PATH`
    aus und verifiziert, dass der Fuzzy-Planner-Fallback in einen auditierten typisierten
    Konfigurationsschreibvorgang übersetzt wird.
- Crestodian-Erstlauf-Docker-Smoke-Test: `pnpm test:docker:crestodian-first-run`
  - Startet aus einem leeren OpenClaw-State-Verzeichnis, routet ein nacktes `openclaw` zu
    Crestodian, wendet Setup-/Modell-/Agent-/Discord-Plugin- und SecretRef-Schreibvorgänge an,
    validiert die Konfiguration und verifiziert Audit-Einträge. Derselbe Ring-0-Setup-Pfad wird
    auch in QA Lab durch
    `pnpm openclaw qa suite --scenario crestodian-ring-zero-setup` abgedeckt.
- Moonshot-/Kimi-Kosten-Smoke-Test: Führen Sie bei gesetztem `MOONSHOT_API_KEY`
  `openclaw models list --provider moonshot --json` aus und anschließend einen isolierten
  `openclaw agent --local --session-id live-kimi-cost --message 'Reply exactly: KIMI_LIVE_OK' --thinking off --json`
  gegen `moonshot/kimi-k2.6`. Verifizieren Sie, dass das JSON Moonshot/K2.6 meldet und das
  Assistenten-Transkript normalisierte `usage.cost` speichert.

<Tip>
Wenn Sie nur einen fehlschlagenden Fall benötigen, bevorzugen Sie das Eingrenzen von Live-Tests über die unten beschriebenen Allowlist-Umgebungsvariablen.
</Tip>

## QA-spezifische Runner

Diese Befehle stehen neben den Haupt-Test-Suites, wenn Sie QA-Lab-Realismus benötigen:

CI führt QA Lab in dedizierten Workflows aus. Agentische Parität ist unter
`QA-Lab - All Lanes` und Release-Validierung verschachtelt, nicht in einem eigenständigen PR-Workflow.
Breite Validierung sollte `Full Release Validation` mit
`rerun_group=qa-parity` oder die QA-Gruppe der Release-Checks verwenden. `QA-Lab - All Lanes`
läuft nächtlich auf `main` und per manuellem Dispatch mit der Mock-Parity-Lane, der Live-
Matrix-Lane, der Convex-verwalteten Live-Telegram-Lane und der Convex-verwalteten Live-Discord-
Lane als parallele Jobs. Geplante QA- und Release-Checks übergeben Matrix
`--profile fast` explizit, während die Matrix-CLI und die manuelle Workflow-Eingabe
standardmäßig `all` bleiben; manueller Dispatch kann `all` in `transport`,
`media`, `e2ee-smoke`, `e2ee-deep` und `e2ee-cli`-Jobs sharden. `OpenClaw Release
Checks` führt vor der Release-Freigabe Parität plus die Fast-Matrix- und Telegram-Lanes aus
und verwendet `mock-openai/gpt-5.5` für Release-Transport-Checks, damit sie
deterministisch bleiben und den normalen Start des Provider-Plugins vermeiden. Diese Live-Transport-
Gateways deaktivieren die Memory-Suche; Memory-Verhalten bleibt durch die QA-Parity-
Suites abgedeckt.

Vollständige Release-Live-Media-Shards verwenden
`ghcr.io/openclaw/openclaw-live-media-runner:ubuntu-24.04`, das bereits
`ffmpeg` und `ffprobe` enthält. Docker-Live-Modell-/Backend-Shards verwenden das gemeinsam genutzte
`ghcr.io/openclaw/openclaw-live-test:<sha>`-Image, das einmal pro ausgewähltem
Commit gebaut wird, und ziehen es dann mit `OPENCLAW_SKIP_DOCKER_BUILD=1`, statt es
in jedem Shard neu zu bauen.

- `pnpm openclaw qa suite`
  - Führt repo-gestützte QA-Szenarien direkt auf dem Host aus.
  - Führt standardmäßig mehrere ausgewählte Szenarien parallel mit isolierten
    Gateway-Workern aus. `qa-channel` verwendet standardmäßig Parallelität 4 (begrenzt durch die
    Anzahl der ausgewählten Szenarien). Verwenden Sie `--concurrency <count>`, um die Anzahl der
    Worker anzupassen, oder `--concurrency 1` für den älteren seriellen Prüflauf.
  - Beendet sich mit einem Fehlercode ungleich null, wenn ein Szenario fehlschlägt. Verwenden Sie `--allow-failures`, wenn Sie
    Artefakte ohne fehlschlagenden Exit-Code möchten.
  - Unterstützt die Provider-Modi `live-frontier`, `mock-openai` und `aimock`.
    `aimock` startet einen lokalen AIMock-gestützten Provider-Server für experimentelle
    Fixture- und Protocol-Mock-Abdeckung, ohne den szenariobewussten
    `mock-openai`-Prüflauf zu ersetzen.
- `pnpm test:gateway:cpu-scenarios`
  - Führt die Gateway-Start-Benchmark plus ein kleines Mock-QA-Lab-Szenariopaket aus
    (`channel-chat-baseline`, `memory-failure-fallback`,
    `gateway-restart-inflight-run`) und schreibt eine zusammengefasste CPU-Beobachtungsübersicht
    unter `.artifacts/gateway-cpu-scenarios/`.
  - Markiert standardmäßig nur dauerhaft heiße CPU-Beobachtungen (`--cpu-core-warn`
    plus `--hot-wall-warn-ms`), sodass kurze Startspitzen als Metriken erfasst werden,
    ohne wie die minutenlange Gateway-Auslastungsregression zu wirken.
  - Verwendet gebaute `dist`-Artefakte; führen Sie zuerst einen Build aus, wenn der Checkout noch keine
    frische Laufzeitausgabe enthält.
- `pnpm openclaw qa suite --runner multipass`
  - Führt dieselbe QA-Suite in einer wegwerfbaren Multipass-Linux-VM aus.
  - Behält dasselbe Szenarioauswahlverhalten wie `qa suite` auf dem Host bei.
  - Verwendet dieselben Provider-/Modellauswahl-Flags wie `qa suite`.
  - Live-Ausführungen leiten die unterstützten QA-Authentifizierungseingaben weiter, die für den Guest praktikabel sind:
    env-basierte Provider-Schlüssel, den Pfad zur QA-Live-Provider-Konfiguration und `CODEX_HOME`,
    wenn vorhanden.
  - Ausgabeverzeichnisse müssen unter dem Repo-Root bleiben, damit der Guest über den
    gemounteten Workspace zurückschreiben kann.
  - Schreibt den normalen QA-Bericht und die Zusammenfassung plus Multipass-Protokolle unter
    `.artifacts/qa-e2e/...`.
- `pnpm qa:lab:up`
  - Startet die Docker-gestützte QA-Site für operatorähnliche QA-Arbeit.
- `pnpm test:docker:npm-onboard-channel-agent`
  - Baut einen npm-Tarball aus dem aktuellen Checkout, installiert ihn global in
    Docker, führt nicht interaktives OpenAI-API-Schlüssel-Onboarding aus, konfiguriert standardmäßig Telegram,
    verifiziert, dass die paketierte Plugin-Laufzeit ohne Startreparatur für Abhängigkeiten geladen wird,
    führt doctor aus und führt einen lokalen Agent-Durchlauf gegen einen
    gemockten OpenAI-Endpunkt aus.
  - Verwenden Sie `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`, um denselben Prüflauf für paketierte Installationen
    mit Discord auszuführen.
- `pnpm test:docker:session-runtime-context`
  - Führt einen deterministischen Docker-Smoke-Test der gebauten App für eingebettete Laufzeitkontext-
    Transkripte aus. Er verifiziert, dass verborgener OpenClaw-Laufzeitkontext als
    nicht angezeigte benutzerdefinierte Nachricht persistiert wird, statt in den sichtbaren Benutzer-Turn zu gelangen,
    seedet anschließend eine betroffene defekte Sitzungs-JSONL und verifiziert,
    dass `openclaw doctor --fix` sie mit einem Backup auf den aktiven Branch umschreibt.
- `pnpm test:docker:npm-telegram-live`
  - Installiert einen OpenClaw-Paketkandidaten in Docker, führt Onboarding für das installierte Paket aus,
    konfiguriert Telegram über die installierte CLI und verwendet dann den
    Live-Telegram-QA-Prüflauf mit diesem installierten Paket als SUT-Gateway wieder.
  - Standard ist `OPENCLAW_NPM_TELEGRAM_PACKAGE_SPEC=openclaw@beta`; setzen Sie
    `OPENCLAW_NPM_TELEGRAM_PACKAGE_TGZ=/path/to/openclaw-current.tgz` oder
    `OPENCLAW_CURRENT_PACKAGE_TGZ`, um stattdessen einen aufgelösten lokalen Tarball zu testen, statt
    aus der Registry zu installieren.
  - Verwendet dieselben Telegram-env-Anmeldedaten oder dieselbe Convex-Anmeldedatenquelle wie
    `pnpm openclaw qa telegram`. Für CI-/Release-Automatisierung setzen Sie
    `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_SOURCE=convex` plus
    `OPENCLAW_QA_CONVEX_SITE_URL` und das Rollen-Secret. Wenn
    `OPENCLAW_QA_CONVEX_SITE_URL` und ein Convex-Rollen-Secret in CI vorhanden sind,
    wählt der Docker-Wrapper Convex automatisch aus.
  - Der Wrapper validiert Telegram- oder Convex-Anmeldedaten-env auf dem Host, bevor
    Docker-Build-/Installationsarbeit beginnt. Setzen Sie `OPENCLAW_NPM_TELEGRAM_SKIP_CREDENTIAL_PREFLIGHT=1`
    nur, wenn Sie bewusst die Einrichtung vor den Anmeldedaten debuggen.
  - `OPENCLAW_NPM_TELEGRAM_CREDENTIAL_ROLE=ci|maintainer` überschreibt die gemeinsame
    `OPENCLAW_QA_CREDENTIAL_ROLE` nur für diesen Prüflauf.
  - GitHub Actions stellt diesen Prüflauf als manuellen Maintainer-Workflow
    `NPM Telegram Beta E2E` bereit. Er läuft nicht bei einem Merge. Der Workflow verwendet die
    `qa-live-shared`-Umgebung und Convex-CI-Anmeldedaten-Leases.
- GitHub Actions stellt außerdem `Package Acceptance` für seitlich ausgeführte Produktnachweise
  gegen ein Kandidatenpaket bereit. Es akzeptiert einen vertrauenswürdigen Ref, eine veröffentlichte npm-Spezifikation,
  eine HTTPS-Tarball-URL plus SHA-256 oder ein Tarball-Artefakt aus einem anderen Lauf, lädt
  das normalisierte `openclaw-current.tgz` als `package-under-test` hoch und führt dann den
  vorhandenen Docker-E2E-Scheduler mit Smoke-, Paket-, Produkt-, Full- oder benutzerdefinierten
  Prüflaufprofilen aus. Setzen Sie `telegram_mode=mock-openai` oder `live-frontier`, um den
  Telegram-QA-Workflow gegen dasselbe `package-under-test`-Artefakt auszuführen.
  - Neuester Beta-Produktnachweis:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=product \
  -f telegram_mode=mock-openai
```

- Nachweis mit genauer Tarball-URL erfordert einen Digest:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=url \
  -f package_url=https://registry.npmjs.org/openclaw/-/openclaw-VERSION.tgz \
  -f package_sha256=<sha256> \
  -f suite_profile=package
```

- Artefaktnachweis lädt ein Tarball-Artefakt aus einem anderen Actions-Lauf herunter:

```bash
gh workflow run package-acceptance.yml --ref main \
  -f source=artifact \
  -f artifact_run_id=<run-id> \
  -f artifact_name=<artifact-name> \
  -f suite_profile=smoke
```

- `pnpm test:docker:plugins`
  - Packt und installiert den aktuellen OpenClaw-Build in Docker, startet das Gateway
    mit konfiguriertem OpenAI und aktiviert dann gebündelte Kanäle/Plugins über Konfigurationsänderungen.
  - Verifiziert, dass die Einrichtungserkennung nicht konfigurierte herunterladbare Plugins auslässt,
    die erste konfigurierte doctor-Reparatur jedes fehlende herunterladbare
    Plugin explizit installiert und ein zweiter Neustart keine verborgene
    Abhängigkeitsreparatur ausführt.
  - Installiert außerdem eine bekannte ältere npm-Baseline, aktiviert Telegram vor dem Ausführen von
    `openclaw update --tag <candidate>` und verifiziert, dass der
    post-update doctor des Kandidaten Altlasten von Plugin-Abhängigkeiten ohne eine
    postinstall-Reparatur auf Harness-Seite bereinigt.
- `pnpm test:parallels:npm-update`
  - Führt den nativen Smoke-Test für paketierte Installationsupdates über Parallels-Guests hinweg aus. Jede
    ausgewählte Plattform installiert zuerst das angeforderte Baseline-Paket, führt dann den
    installierten Befehl `openclaw update` im selben Guest aus und verifiziert die
    installierte Version, den Update-Status, die Gateway-Bereitschaft und einen lokalen Agent-Durchlauf.
  - Verwenden Sie `--platform macos`, `--platform windows` oder `--platform linux`, während Sie
    an einem Guest iterieren. Verwenden Sie `--json` für den Pfad zum Zusammenfassungsartefakt und
    den Status pro Prüflauf.
  - Der OpenAI-Prüflauf verwendet standardmäßig `openai/gpt-5.5` für den Live-Agent-Durchlaufnachweis.
    Übergeben Sie `--model <provider/model>` oder setzen Sie
    `OPENCLAW_PARALLELS_OPENAI_MODEL`, wenn Sie bewusst ein anderes
    OpenAI-Modell validieren.
  - Umhüllen Sie lange lokale Läufe mit einem Host-Timeout, damit Parallels-Transport-Hänger nicht
    den Rest des Testfensters verbrauchen können:

    ```bash
    timeout --foreground 150m pnpm test:parallels:npm-update -- --json
    timeout --foreground 90m pnpm test:parallels:npm-update -- --platform windows --json
    ```

  - Das Skript schreibt verschachtelte Prüflaufprotokolle unter `/tmp/openclaw-parallels-npm-update.*`.
    Prüfen Sie `windows-update.log`, `macos-update.log` oder `linux-update.log`,
    bevor Sie annehmen, dass der äußere Wrapper hängt.
  - Windows-Updates können auf einem kalten Guest 10 bis 15 Minuten mit post-update doctor und Paket-
    Update-Arbeit verbringen; das ist weiterhin gesund, wenn das verschachtelte npm-
    Debug-Protokoll voranschreitet.
  - Führen Sie diesen aggregierten Wrapper nicht parallel zu einzelnen Parallels-
    macOS-, Windows- oder Linux-Smoke-Prüfläufen aus. Sie teilen VM-Zustand und können bei
    Snapshot-Wiederherstellung, Paketbereitstellung oder Guest-Gateway-Zustand kollidieren.
  - Der post-update-Nachweis führt die normale gebündelte Plugin-Oberfläche aus, weil
    Capability-Fassaden wie Sprache, Bilderzeugung und Medienverständnis
    über gebündelte Laufzeit-APIs geladen werden, selbst wenn der Agent-Durchlauf
    selbst nur eine einfache Textantwort prüft.

- `pnpm openclaw qa aimock`
  - Startet nur den lokalen AIMock-Provider-Server für direkte Protocol-Smoke-
    Tests.
- `pnpm openclaw qa matrix`
  - Führt den Matrix-Live-QA-Prüflauf gegen einen wegwerfbaren Docker-gestützten Tuwunel-Homeserver aus. Nur Source-Checkout — paketierte Installationen liefern `qa-lab` nicht mit.
  - Vollständige CLI, Profil-/Szenariokatalog, env vars und Artefaktlayout: [Matrix-QA](/de/concepts/qa-matrix).
- `pnpm openclaw qa telegram`
  - Führt den Telegram-Live-QA-Prüflauf gegen eine echte private Gruppe mit den Driver- und SUT-Bot-Token aus env aus.
  - Erfordert `OPENCLAW_QA_TELEGRAM_GROUP_ID`, `OPENCLAW_QA_TELEGRAM_DRIVER_BOT_TOKEN` und `OPENCLAW_QA_TELEGRAM_SUT_BOT_TOKEN`. Die Gruppen-ID muss die numerische Telegram-Chat-ID sein.
  - Unterstützt `--credential-source convex` für gemeinsam genutzte gepoolte Anmeldedaten. Verwenden Sie standardmäßig den env-Modus oder setzen Sie `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`, um gepoolte Leases zu verwenden.
  - Beendet sich mit einem Fehlercode ungleich null, wenn ein Szenario fehlschlägt. Verwenden Sie `--allow-failures`, wenn Sie
    Artefakte ohne fehlschlagenden Exit-Code möchten.
  - Erfordert zwei unterschiedliche Bots in derselben privaten Gruppe, wobei der SUT-Bot einen Telegram-Benutzernamen bereitstellt.
  - Für stabile Bot-zu-Bot-Beobachtung aktivieren Sie den Bot-to-Bot Communication Mode in `@BotFather` für beide Bots und stellen Sie sicher, dass der Driver-Bot Gruppen-Bot-Datenverkehr beobachten kann.
  - Schreibt einen Telegram-QA-Bericht, eine Zusammenfassung und ein observed-messages-Artefakt unter `.artifacts/qa-e2e/...`. Antwortszenarien enthalten die RTT von der Sendeanforderung des Drivers bis zur beobachteten SUT-Antwort.

Live-Transport-Prüfläufe teilen einen Standardvertrag, damit neue Transporte nicht abweichen; die Abdeckungsmatrix pro Prüflauf befindet sich in [QA-Übersicht → Live-Transport-Abdeckung](/de/concepts/qa-e2e-automation#live-transport-coverage). `qa-channel` ist die breite synthetische Suite und nicht Teil dieser Matrix.

### Gemeinsame Telegram-Anmeldedaten über Convex (v1)

Wenn `--credential-source convex` (oder `OPENCLAW_QA_CREDENTIAL_SOURCE=convex`) für
`openclaw qa telegram` aktiviert ist, erwirbt QA Lab eine exklusive Lease aus einem Convex-gestützten Pool, sendet Heartbeats
für diese Lease, während der Prüflauf läuft, und gibt die Lease beim Herunterfahren frei.

Referenzgerüst für das Convex-Projekt:

- `qa/convex-credential-broker/`

Erforderliche env vars:

- `OPENCLAW_QA_CONVEX_SITE_URL` (zum Beispiel `https://your-deployment.convex.site`)
- Ein Secret für die ausgewählte Rolle:
  - `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER` für `maintainer`
  - `OPENCLAW_QA_CONVEX_SECRET_CI` für `ci`
- Auswahl der Anmeldedatenrolle:
  - CLI: `--credential-role maintainer|ci`
  - env-Standard: `OPENCLAW_QA_CREDENTIAL_ROLE` (standardmäßig `ci` in CI, andernfalls `maintainer`)

Optionale env vars:

- `OPENCLAW_QA_CREDENTIAL_LEASE_TTL_MS` (Standard `1200000`)
- `OPENCLAW_QA_CREDENTIAL_HEARTBEAT_INTERVAL_MS` (Standard `30000`)
- `OPENCLAW_QA_CREDENTIAL_ACQUIRE_TIMEOUT_MS` (Standard `90000`)
- `OPENCLAW_QA_CREDENTIAL_HTTP_TIMEOUT_MS` (Standard `15000`)
- `OPENCLAW_QA_CONVEX_ENDPOINT_PREFIX` (Standard `/qa-credentials/v1`)
- `OPENCLAW_QA_CREDENTIAL_OWNER_ID` (optionale Trace-ID)
- `OPENCLAW_QA_ALLOW_INSECURE_HTTP=1` erlaubt local loopback-`http://`-Convex-URLs für ausschließlich lokale Entwicklung.

`OPENCLAW_QA_CONVEX_SITE_URL` sollte im normalen Betrieb `https://` verwenden.

Maintainer-Admin-Befehle (Pool hinzufügen/entfernen/auflisten) erfordern
speziell `OPENCLAW_QA_CONVEX_SECRET_MAINTAINER`.

CLI-Hilfsbefehle für Maintainer:

```bash
pnpm openclaw qa credentials doctor
pnpm openclaw qa credentials add --kind telegram --payload-file qa/telegram-credential.json
pnpm openclaw qa credentials list --kind telegram
pnpm openclaw qa credentials remove --credential-id <credential-id>
```

Verwenden Sie `doctor` vor Live-Läufen, um die URL der Convex-Site, Broker-Secrets,
Endpunktpräfix, HTTP-Timeout und Erreichbarkeit von Admin/List zu prüfen, ohne
Secret-Werte auszugeben. Verwenden Sie `--json` für maschinenlesbare Ausgabe in Skripten und CI
Hilfsprogrammen.

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

Payload-Form für Telegram-Kind:

- `{ groupId: string, driverToken: string, sutToken: string }`
- `groupId` muss eine numerische Telegram-Chat-ID-Zeichenfolge sein.
- `admin/add` validiert diese Form für `kind: "telegram"` und weist fehlerhafte Payloads zurück.

### Einen Kanal zu QA hinzufügen

Die Architektur und Namen der Szenario-Helfer für neue Kanaladapter finden Sie in [QA-Überblick → Einen Kanal hinzufügen](/de/concepts/qa-e2e-automation#adding-a-channel). Die Mindestanforderung: Implementieren Sie den Transport-Runner auf der gemeinsamen `qa-lab`-Host-Nahtstelle, deklarieren Sie `qaRunners` im Plugin-Manifest, mounten Sie ihn als `openclaw qa <runner>` und erstellen Sie Szenarien unter `qa/scenarios/`.

## Testsuiten (was wo läuft)

Betrachten Sie die Suiten als „zunehmenden Realismus“ (und zunehmende Instabilität/Kosten):

### Unit / Integration (Standard)

- Befehl: `pnpm test`
- Konfiguration: Nicht zielgerichtete Läufe verwenden das `vitest.full-*.config.ts`-Shard-Set und können Multi-Projekt-Shards für parallele Planung in projektbezogene Konfigurationen erweitern
- Dateien: Core-/Unit-Inventare unter `src/**/*.test.ts`, `packages/**/*.test.ts` und `test/**/*.test.ts`; UI-Unit-Tests laufen im dedizierten `unit-ui`-Shard
- Umfang:
  - Reine Unit-Tests
  - In-Process-Integrationstests (Gateway-Authentifizierung, Routing, Werkzeuge, Parsing, Konfiguration)
  - Deterministische Regressionen für bekannte Fehler
- Erwartungen:
  - Läuft in CI
  - Keine echten Schlüssel erforderlich
  - Sollte schnell und stabil sein
  - Resolver- und Public-Surface-Loader-Tests müssen breites Fallback-Verhalten von `api.js` und
    `runtime-api.js` mit generierten kleinen Plugin-Fixtures nachweisen, nicht mit
    echten APIs aus gebündeltem Plugin-Quellcode. Echte Plugin-API-Ladevorgänge gehören in
    Plugin-eigene Contract-/Integrationssuiten.

<AccordionGroup>
  <Accordion title="Projekte, Shards und bereichsbezogene Lanes">

    - Nicht zielgerichtetes `pnpm test` führt zwölf kleinere Shard-Konfigurationen (`core-unit-fast`, `core-unit-src`, `core-unit-security`, `core-unit-ui`, `core-unit-support`, `core-support-boundary`, `core-contracts`, `core-bundled`, `core-runtime`, `agentic`, `auto-reply`, `extensions`) statt eines einzigen riesigen nativen Root-Projektprozesses aus. Das senkt die maximale RSS auf ausgelasteten Maschinen und verhindert, dass Auto-Reply-/Extension-Arbeit unabhängige Suiten ausbremst.
    - `pnpm test --watch` verwendet weiterhin den nativen Root-Projektgraphen `vitest.config.ts`, weil eine Multi-Shard-Watch-Schleife nicht praktikabel ist.
    - `pnpm test`, `pnpm test:watch` und `pnpm test:perf:imports` leiten explizite Datei-/Verzeichnisziele zuerst durch bereichsbezogene Lanes, sodass `pnpm test extensions/discord/src/monitor/message-handler.preflight.test.ts` nicht die volle Startlast des Root-Projekts bezahlen muss.
    - `pnpm test:changed` erweitert geänderte Git-Pfade standardmäßig zu günstigen bereichsbezogenen Lanes: direkte Teständerungen, benachbarte `*.test.ts`-Dateien, explizite Quellzuordnungen und lokale Importgraph-Abhängige. Konfigurations-/Setup-/Paketänderungen führen Tests nicht breit aus, es sei denn, Sie verwenden explizit `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed`.
    - `pnpm check:changed` ist das normale intelligente lokale Prüfgate für eng begrenzte Arbeit. Es klassifiziert das Diff in Core, Core-Tests, Extensions, Extension-Tests, Apps, Dokumentation, Release-Metadaten, Live-Docker-Werkzeuge und Werkzeuge und führt dann die passenden Typecheck-, Lint- und Guard-Befehle aus. Es führt keine Vitest-Tests aus; rufen Sie `pnpm test:changed` oder explizit `pnpm test <target>` für Testnachweise auf. Versionsanhebungen nur für Release-Metadaten führen gezielte Versions-/Konfigurations-/Root-Abhängigkeitsprüfungen aus, mit einem Guard, der Paketänderungen außerhalb des obersten Versionsfelds ablehnt.
    - Änderungen am Live-Docker-ACP-Harness führen fokussierte Prüfungen aus: Shell-Syntax für die Live-Docker-Auth-Skripte und einen Live-Docker-Scheduler-Probelauf. `package.json`-Änderungen werden nur einbezogen, wenn das Diff auf `scripts["test:docker:live-*"]` begrenzt ist; Abhängigkeits-, Export-, Versions- und andere Paketoberflächenänderungen verwenden weiterhin die breiteren Guards.
    - Importleichte Unit-Tests aus Agents, Befehlen, Plugins, Auto-Reply-Helfern, `plugin-sdk` und ähnlichen reinen Hilfsbereichen laufen durch die `unit-fast`-Lane, die `test/setup-openclaw-runtime.ts` überspringt; zustandsbehaftete/laufzeitlastige Dateien bleiben auf den bestehenden Lanes.
    - Ausgewählte `plugin-sdk`- und `commands`-Helfer-Quelldateien ordnen Changed-Mode-Läufe außerdem expliziten benachbarten Tests in diesen leichten Lanes zu, sodass Helferänderungen nicht die gesamte schwere Suite dieses Verzeichnisses erneut ausführen.
    - `auto-reply` hat dedizierte Buckets für Top-Level-Core-Helfer, Top-Level-`reply.*`-Integrationstests und den Teilbaum `src/auto-reply/reply/**`. CI teilt den Reply-Teilbaum zusätzlich in Agent-Runner-, Dispatch- und Commands/State-Routing-Shards auf, sodass ein importlastiger Bucket nicht den gesamten Node-Auslauf besitzt.
    - Normale PR-/Main-CI überspringt absichtlich den Extension-Batch-Sweep und den release-exklusiven Shard `agentic-plugins`. Full Release Validation startet für diese plugin-/extension-lastigen Suiten auf Release-Kandidaten den separaten untergeordneten Workflow `Plugin Prerelease`.

  </Accordion>

  <Accordion title="Abdeckung des eingebetteten Runners">

    - Wenn Sie Eingaben für die Message-Tool-Erkennung oder den Compaction-Laufzeitkontext ändern,
      behalten Sie beide Abdeckungsebenen bei.
    - Fügen Sie fokussierte Helfer-Regressionen für reine Routing- und Normalisierungsgrenzen hinzu.
    - Halten Sie die Integrationssuiten des eingebetteten Runners stabil:
      `src/agents/pi-embedded-runner/compact.hooks.test.ts`,
      `src/agents/pi-embedded-runner/run.overflow-compaction.test.ts` und
      `src/agents/pi-embedded-runner/run.overflow-compaction.loop.test.ts`.
    - Diese Suiten verifizieren, dass bereichsbezogene IDs und Compaction-Verhalten weiterhin
      durch die echten `run.ts`- / `compact.ts`-Pfade fließen; reine Helfertests sind
      kein ausreichender Ersatz für diese Integrationspfade.

  </Accordion>

  <Accordion title="Vitest-Pool- und Isolationsstandards">

    - Die Basis-Vitest-Konfiguration verwendet standardmäßig `threads`.
    - Die gemeinsame Vitest-Konfiguration setzt `isolate: false` fest und verwendet den
      nicht isolierten Runner über Root-Projekte, E2E- und Live-Konfigurationen hinweg.
    - Die Root-UI-Lane behält ihr `jsdom`-Setup und ihren Optimizer, läuft aber ebenfalls auf dem
      gemeinsamen nicht isolierten Runner.
    - Jeder `pnpm test`-Shard erbt dieselben `threads`- + `isolate: false`-
      Standards aus der gemeinsamen Vitest-Konfiguration.
    - `scripts/run-vitest.mjs` fügt standardmäßig `--no-maglev` für untergeordnete Vitest-Node-
      Prozesse hinzu, um V8-Kompilierungsaufwand bei großen lokalen Läufen zu reduzieren.
      Setzen Sie `OPENCLAW_VITEST_ENABLE_MAGLEV=1`, um mit dem Standardverhalten von V8
      zu vergleichen.

  </Accordion>

  <Accordion title="Schnelle lokale Iteration">

    - `pnpm changed:lanes` zeigt, welche Architektur-Lanes ein Diff auslöst.
    - Der Pre-Commit-Hook ist nur für Formatierung zuständig. Er staged formatierte Dateien erneut und
      führt weder Linting, Typecheck noch Tests aus.
    - Führen Sie `pnpm check:changed` explizit vor Übergabe oder Push aus, wenn Sie
      das intelligente lokale Prüfgate benötigen.
    - `pnpm test:changed` leitet standardmäßig durch günstige bereichsbezogene Lanes. Verwenden Sie
      `OPENCLAW_TEST_CHANGED_BROAD=1 pnpm test:changed` nur, wenn der Agent
      entscheidet, dass eine Harness-, Konfigurations-, Paket- oder Contract-Änderung wirklich breitere
      Vitest-Abdeckung benötigt.
    - `pnpm test:max` und `pnpm test:changed:max` behalten dasselbe Routing-
      Verhalten bei, nur mit einer höheren Worker-Obergrenze.
    - Die lokale automatische Worker-Skalierung ist absichtlich konservativ und reduziert die Last,
      wenn der Load Average des Hosts bereits hoch ist, sodass mehrere gleichzeitige
      Vitest-Läufe standardmäßig weniger Schaden verursachen.
    - Die Basis-Vitest-Konfiguration markiert die Projekte/Konfigurationsdateien als
      `forceRerunTriggers`, sodass Changed-Mode-Neuläufe korrekt bleiben, wenn sich die Test-
      Verdrahtung ändert.
    - Die Konfiguration hält `OPENCLAW_VITEST_FS_MODULE_CACHE` auf unterstützten
      Hosts aktiviert; setzen Sie `OPENCLAW_VITEST_FS_MODULE_CACHE_PATH=/abs/path`, wenn Sie
      einen expliziten Cache-Speicherort für direktes Profiling möchten.

  </Accordion>

  <Accordion title="Performance-Debugging">

    - `pnpm test:perf:imports` aktiviert Vitest-Importdauerberichte plus
      Import-Breakdown-Ausgabe.
    - `pnpm test:perf:imports:changed` beschränkt dieselbe Profiling-Ansicht auf
      seit `origin/main` geänderte Dateien.
    - Shard-Timing-Daten werden nach `.artifacts/vitest-shard-timings.json` geschrieben.
      Läufe über ganze Konfigurationen verwenden den Konfigurationspfad als Schlüssel; Include-Pattern-CI-
      Shards hängen den Shard-Namen an, damit gefilterte Shards separat verfolgt
      werden können.
    - Wenn ein heißer Test weiterhin die meiste Zeit in Start-Imports verbringt,
      halten Sie schwere Abhängigkeiten hinter einer schmalen lokalen `*.runtime.ts`-Nahtstelle und
      mocken Sie diese Nahtstelle direkt, statt Laufzeithelfer tief zu importieren, nur
      um sie durch `vi.mock(...)` zu schleusen.
    - `pnpm test:perf:changed:bench -- --ref <git-ref>` vergleicht geroutetes
      `test:changed` mit dem nativen Root-Projektpfad für dieses commitete
      Diff und gibt Laufzeit plus macOS-Max-RSS aus.
    - `pnpm test:perf:changed:bench -- --worktree` benchmarked den aktuellen
      dirty Tree, indem die Liste geänderter Dateien durch
      `scripts/test-projects.mjs` und die Root-Vitest-Konfiguration geroutet wird.
    - `pnpm test:perf:profile:main` schreibt ein Main-Thread-CPU-Profil für
      Vitest-/Vite-Start und Transform-Overhead.
    - `pnpm test:perf:profile:runner` schreibt Runner-CPU+Heap-Profile für die
      Unit-Suite mit deaktivierter Dateiparallelität.

  </Accordion>
</AccordionGroup>

### Stabilität (Gateway)

- Befehl: `pnpm test:stability:gateway`
- Konfiguration: `vitest.gateway.config.ts`, auf einen Worker erzwungen
- Umfang:
  - Startet standardmäßig ein echtes local loopback-Gateway mit aktivierter Diagnose
  - Treibt synthetische Gateway-Nachrichten-, Speicher- und Large-Payload-Last durch den Diagnoseereignispfad
  - Fragt `diagnostics.stability` über den Gateway-WS-RPC ab
  - Deckt Persistenzhelfer für Diagnose-Stabilitätsbundles ab
  - Stellt sicher, dass der Recorder begrenzt bleibt, synthetische RSS-Samples unter dem Druckbudget bleiben und Queue-Tiefen pro Sitzung wieder auf null ablaufen
- Erwartungen:
  - CI-sicher und ohne Schlüssel
  - Enge Lane für Stabilitätsregressions-Nachverfolgung, kein Ersatz für die vollständige Gateway-Suite

### E2E (Gateway-Smoke)

- Befehl: `pnpm test:e2e`
- Konfiguration: `vitest.e2e.config.ts`
- Dateien: `src/**/*.e2e.test.ts`, `test/**/*.e2e.test.ts` und E2E-Tests gebündelter Plugins unter `extensions/`
- Runtime-Standardeinstellungen:
  - Verwendet Vitest-`threads` mit `isolate: false`, passend zum Rest des Repositorys.
  - Verwendet adaptive Worker (CI: bis zu 2, lokal: standardmäßig 1).
  - Läuft standardmäßig im stillen Modus, um den Aufwand für Konsolen-I/O zu reduzieren.
- Nützliche Überschreibungen:
  - `OPENCLAW_E2E_WORKERS=<n>`, um die Worker-Anzahl zu erzwingen (auf 16 begrenzt).
  - `OPENCLAW_E2E_VERBOSE=1`, um ausführliche Konsolenausgabe wieder zu aktivieren.
- Umfang:
  - End-to-End-Verhalten des Multi-Instanz-Gateway
  - WebSocket-/HTTP-Oberflächen, Node-Kopplung und aufwendigere Netzwerkfunktionen
- Erwartungen:
  - Läuft in CI (wenn in der Pipeline aktiviert)
  - Keine echten Schlüssel erforderlich
  - Mehr bewegliche Teile als Unit-Tests (kann langsamer sein)

### E2E: OpenShell-Backend-Smoke-Test

- Befehl: `pnpm test:e2e:openshell`
- Datei: `extensions/openshell/src/backend.e2e.test.ts`
- Umfang:
  - Startet ein isoliertes OpenShell-Gateway auf dem Host über Docker
  - Erstellt eine Sandbox aus einem temporären lokalen Dockerfile
  - Testet das OpenShell-Backend von OpenClaw über echtes `sandbox ssh-config` + SSH-Ausführung
  - Verifiziert remote-kanonisches Dateisystemverhalten über die Sandbox-fs-Bridge
- Erwartungen:
  - Nur Opt-in; nicht Teil des standardmäßigen `pnpm test:e2e`-Laufs
  - Erfordert eine lokale `openshell`-CLI plus einen funktionierenden Docker-Daemon
  - Verwendet isolierte `HOME` / `XDG_CONFIG_HOME`, zerstört danach das Test-Gateway und die Sandbox
- Nützliche Überschreibungen:
  - `OPENCLAW_E2E_OPENSHELL=1`, um den Test beim manuellen Ausführen der breiteren E2E-Suite zu aktivieren
  - `OPENCLAW_E2E_OPENSHELL_COMMAND=/path/to/openshell`, um auf ein nicht standardmäßiges CLI-Binary oder Wrapper-Skript zu verweisen

### Live (echte Provider + echte Modelle)

- Befehl: `pnpm test:live`
- Konfiguration: `vitest.live.config.ts`
- Dateien: `src/**/*.live.test.ts`, `test/**/*.live.test.ts` und Live-Tests gebündelter Plugins unter `extensions/`
- Standard: durch `pnpm test:live` **aktiviert** (setzt `OPENCLAW_LIVE_TEST=1`)
- Umfang:
  - „Funktioniert dieser Provider/dieses Modell _heute_ tatsächlich mit echten Zugangsdaten?“
  - Erkennt Provider-Formatänderungen, Besonderheiten beim Tool-Aufruf, Auth-Probleme und Rate-Limit-Verhalten
- Erwartungen:
  - Absichtlich nicht CI-stabil (echte Netzwerke, echte Provider-Richtlinien, Kontingente, Ausfälle)
  - Kostet Geld / nutzt Rate Limits
  - Führen Sie vorzugsweise eingeschränkte Teilmengen statt „alles“ aus
- Live-Läufe sourcen `~/.profile`, um fehlende API-Schlüssel zu laden.
- Standardmäßig isolieren Live-Läufe weiterhin `HOME` und kopieren Konfigurations-/Auth-Material in ein temporäres Test-Home, damit Unit-Fixtures Ihr echtes `~/.openclaw` nicht verändern können.
- Setzen Sie `OPENCLAW_LIVE_USE_REAL_HOME=1` nur, wenn Live-Tests absichtlich Ihr echtes Home-Verzeichnis verwenden sollen.
- `pnpm test:live` verwendet jetzt standardmäßig einen ruhigeren Modus: Die `[live] ...`-Fortschrittsausgabe bleibt erhalten, aber der zusätzliche `~/.profile`-Hinweis wird unterdrückt und Gateway-Bootstrap-Logs/Bonjour-Meldungen werden stummgeschaltet. Setzen Sie `OPENCLAW_LIVE_TEST_QUIET=0`, wenn Sie die vollständigen Startlogs zurückhaben möchten.
- API-Schlüssel-Rotation (Provider-spezifisch): Setzen Sie `*_API_KEYS` im Komma-/Semikolonformat oder `*_API_KEY_1`, `*_API_KEY_2` (zum Beispiel `OPENAI_API_KEYS`, `ANTHROPIC_API_KEYS`, `GEMINI_API_KEYS`) oder eine Live-Überschreibung pro Lauf über `OPENCLAW_LIVE_*_KEY`; Tests versuchen es bei Rate-Limit-Antworten erneut.
- Fortschritts-/Heartbeat-Ausgabe:
  - Live-Suites geben jetzt Fortschrittszeilen an stderr aus, damit lange Provider-Aufrufe sichtbar aktiv bleiben, auch wenn die Vitest-Konsolenerfassung ruhig ist.
  - `vitest.live.config.ts` deaktiviert die Vitest-Konsolenabfangung, damit Provider-/Gateway-Fortschrittszeilen während Live-Läufen sofort gestreamt werden.
  - Stimmen Sie Direct-Model-Heartbeats mit `OPENCLAW_LIVE_HEARTBEAT_MS` ab.
  - Stimmen Sie Gateway-/Probe-Heartbeats mit `OPENCLAW_LIVE_GATEWAY_HEARTBEAT_MS` ab.

## Welche Suite sollte ich ausführen?

Verwenden Sie diese Entscheidungstabelle:

- Logik/Tests bearbeiten: Führen Sie `pnpm test` aus (und `pnpm test:coverage`, wenn Sie viel geändert haben)
- Gateway-Netzwerk / WS-Protokoll / Kopplung berühren: Fügen Sie `pnpm test:e2e` hinzu
- „Mein Bot ist offline“ / Provider-spezifische Fehler / Tool-Aufrufe debuggen: Führen Sie ein eingeschränktes `pnpm test:live` aus

## Live-Tests (mit Netzwerkzugriff)

Informationen zur Live-Modellmatrix, zu CLI-Backend-Smoke-Tests, ACP-Smoke-Tests, zum Codex-App-Server-
Harness und zu allen Live-Tests für Medien-Provider (Deepgram, BytePlus, ComfyUI, Bild,
Musik, Video, Medien-Harness) — plus Umgang mit Zugangsdaten für Live-Läufe — finden Sie unter
[Live-Suites testen](/de/help/testing-live). Die dedizierte Checkliste für Update- und
Plugin-Validierung finden Sie unter
[Updates und Plugins testen](/de/help/testing-updates-plugins).

## Docker-Runner (optionale „funktioniert unter Linux“-Prüfungen)

Diese Docker-Runner sind in zwei Bereiche aufgeteilt:

- Live-Modell-Runner: `test:docker:live-models` und `test:docker:live-gateway` führen nur ihre passende Live-Datei mit Profilschlüssel im Repository-Docker-Image aus (`src/agents/models.profiles.live.test.ts` und `src/gateway/gateway-models.profiles.live.test.ts`), mounten Ihr lokales Konfigurationsverzeichnis und Ihren Workspace (und sourcen `~/.profile`, falls gemountet). Die passenden lokalen Einstiegspunkte sind `test:live:models-profiles` und `test:live:gateway-profiles`.
- Docker-Live-Runner verwenden standardmäßig eine kleinere Smoke-Obergrenze, damit ein vollständiger Docker-Durchlauf praktikabel bleibt:
  `test:docker:live-models` verwendet standardmäßig `OPENCLAW_LIVE_MAX_MODELS=12`, und
  `test:docker:live-gateway` verwendet standardmäßig `OPENCLAW_LIVE_GATEWAY_SMOKE=1`,
  `OPENCLAW_LIVE_GATEWAY_MAX_MODELS=8`,
  `OPENCLAW_LIVE_GATEWAY_STEP_TIMEOUT_MS=45000` und
  `OPENCLAW_LIVE_GATEWAY_MODEL_TIMEOUT_MS=90000`. Überschreiben Sie diese Umgebungsvariablen, wenn Sie
  ausdrücklich den größeren vollständigen Scan möchten.
- `test:docker:all` baut das Live-Docker-Image einmal über `test:docker:live-build`, packt OpenClaw einmal als npm-Tarball über `scripts/package-openclaw-for-docker.mjs` und baut/verwendet dann zwei `scripts/e2e/Dockerfile`-Images wieder. Das Bare-Image ist nur der Node-/Git-Runner für Installations-/Update-/Plugin-Abhängigkeits-Lanes; diese Lanes mounten den vorab gebauten Tarball. Das funktionale Image installiert denselben Tarball nach `/app` für Lanes mit Built-App-Funktionalität. Docker-Lane-Definitionen befinden sich in `scripts/lib/docker-e2e-scenarios.mjs`; Planerlogik befindet sich in `scripts/lib/docker-e2e-plan.mjs`; `scripts/test-docker-all.mjs` führt den ausgewählten Plan aus. Das Aggregat verwendet einen gewichteten lokalen Scheduler: `OPENCLAW_DOCKER_ALL_PARALLELISM` steuert Prozess-Slots, während Ressourcenobergrenzen verhindern, dass schwere Live-, npm-Installations- und Multi-Service-Lanes alle gleichzeitig starten. Wenn eine einzelne Lane schwerer als die aktiven Obergrenzen ist, kann der Scheduler sie trotzdem starten, wenn der Pool leer ist, und lässt sie dann allein laufen, bis wieder Kapazität verfügbar ist. Standards sind 10 Slots, `OPENCLAW_DOCKER_ALL_LIVE_LIMIT=9`, `OPENCLAW_DOCKER_ALL_NPM_LIMIT=10` und `OPENCLAW_DOCKER_ALL_SERVICE_LIMIT=7`; stimmen Sie `OPENCLAW_DOCKER_ALL_WEIGHT_LIMIT` oder `OPENCLAW_DOCKER_ALL_DOCKER_LIMIT` nur ab, wenn der Docker-Host mehr Spielraum hat. Der Runner führt standardmäßig einen Docker-Preflight aus, entfernt veraltete OpenClaw-E2E-Container, gibt alle 30 Sekunden Status aus, speichert erfolgreiche Lane-Zeiten in `.artifacts/docker-tests/lane-timings.json` und verwendet diese Zeiten, um bei späteren Läufen längere Lanes zuerst zu starten. Verwenden Sie `OPENCLAW_DOCKER_ALL_DRY_RUN=1`, um das gewichtete Lane-Manifest ohne Bauen oder Ausführen von Docker auszugeben, oder `node scripts/test-docker-all.mjs --plan-json`, um den CI-Plan für ausgewählte Lanes, Paket-/Image-Anforderungen und Zugangsdaten auszugeben.
- `Package Acceptance` ist das GitHub-native Paket-Gate für „funktioniert dieser installierbare Tarball als Produkt?“ Es löst ein Kandidatenpaket aus `source=npm`, `source=ref`, `source=url` oder `source=artifact` auf, lädt es als `package-under-test` hoch und führt dann die wiederverwendbaren Docker-E2E-Lanes gegen genau diesen Tarball aus, statt die ausgewählte Ref neu zu packen. Profile sind nach Breite geordnet: `smoke`, `package`, `product` und `full`. Siehe [Updates und Plugins testen](/de/help/testing-updates-plugins) für den Paket-/Update-/Plugin-Vertrag, die Survivor-Matrix für veröffentlichte Upgrades, Release-Standards und Fehlertriage.
- Build- und Release-Prüfungen führen `scripts/check-cli-bootstrap-imports.mjs` nach tsdown aus. Der Guard läuft den statisch gebauten Graphen von `dist/entry.js` und `dist/cli/run-main.js` ab und schlägt fehl, wenn Pre-Dispatch-Startimporte Paketabhängigkeiten wie Commander, Prompt-UI, undici oder Logging vor dem Command Dispatch importieren; außerdem hält er den gebündelten Gateway-Run-Chunk unter Budget und weist statische Importe bekannter kalter Gateway-Pfade zurück. Der Paket-CLI-Smoke-Test deckt außerdem Root-Hilfe, Onboard-Hilfe, Doctor-Hilfe, Status, Konfigurationsschema und einen Modelllistenbefehl ab.
- Die Legacy-Kompatibilität von Package Acceptance ist auf `2026.4.25` begrenzt (`2026.4.25-beta.*` eingeschlossen). Bis zu diesem Stichtag toleriert der Harness nur Metadatenlücken ausgelieferter Pakete: ausgelassene private QA-Inventareinträge, fehlendes `gateway install --wrapper`, fehlende Patch-Dateien im aus dem Tarball abgeleiteten Git-Fixture, fehlendes persistiertes `update.channel`, Legacy-Speicherorte für Plugin-Installationsdatensätze, fehlende Marketplace-Installationsdatensatz-Persistenz und Konfigurationsmetadatenmigration während `plugins update`. Für Pakete nach `2026.4.25` sind diese Pfade strikte Fehler.
- Container-Smoke-Runner: `test:docker:openwebui`, `test:docker:onboard`, `test:docker:npm-onboard-channel-agent`, `test:docker:update-channel-switch`, `test:docker:upgrade-survivor`, `test:docker:published-upgrade-survivor`, `test:docker:session-runtime-context`, `test:docker:agents-delete-shared-workspace`, `test:docker:gateway-network`, `test:docker:browser-cdp-snapshot`, `test:docker:mcp-channels`, `test:docker:pi-bundle-mcp-tools`, `test:docker:cron-mcp-cleanup`, `test:docker:plugins`, `test:docker:plugin-update`, `test:docker:plugin-lifecycle-matrix` und `test:docker:config-reload` starten einen oder mehrere echte Container und verifizieren höherstufige Integrationspfade.

Die Live-Modell-Docker-Runner binden außerdem nur die benötigten CLI-Auth-Homes ein (oder alle unterstützten, wenn der Lauf nicht eingeschränkt ist) und kopieren sie dann vor dem Lauf in das Container-Home, damit externe CLI-OAuth Token aktualisieren kann, ohne den Auth-Speicher des Hosts zu verändern:

- Direkte Modelle: `pnpm test:docker:live-models` (Skript: `scripts/test-live-models-docker.sh`)
- ACP-Bind-Smoke: `pnpm test:docker:live-acp-bind` (Skript: `scripts/test-live-acp-bind-docker.sh`; deckt standardmäßig Claude, Codex und Gemini ab, mit strenger Droid/OpenCode-Abdeckung über `pnpm test:docker:live-acp-bind:droid` und `pnpm test:docker:live-acp-bind:opencode`)
- CLI-Backend-Smoke: `pnpm test:docker:live-cli-backend` (Skript: `scripts/test-live-cli-backend-docker.sh`)
- Codex-App-Server-Harness-Smoke: `pnpm test:docker:live-codex-harness` (Skript: `scripts/test-live-codex-harness-docker.sh`)
- Gateway + Entwicklungsagent: `pnpm test:docker:live-gateway` (Skript: `scripts/test-live-gateway-models-docker.sh`)
- Observability-Smoke: `pnpm qa:otel:smoke` ist eine private QA-Lane für Source-Checkouts. Sie ist absichtlich nicht Teil der Docker-Release-Lanes für Pakete, da der npm-Tarball QA Lab auslässt.
- Open WebUI-Live-Smoke: `pnpm test:docker:openwebui` (Skript: `scripts/e2e/openwebui-docker.sh`)
- Onboarding-Assistent (TTY, vollständiges Scaffolding): `pnpm test:docker:onboard` (Skript: `scripts/e2e/onboard-docker.sh`)
- Npm-Tarball-Onboarding/Channel/Agent-Smoke: `pnpm test:docker:npm-onboard-channel-agent` installiert den gepackten OpenClaw-Tarball global in Docker, konfiguriert standardmäßig OpenAI per Env-Ref-Onboarding plus Telegram, führt doctor aus und führt einen gemockten OpenAI-Agent-Turn aus. Verwenden Sie einen vorab gebauten Tarball mit `OPENCLAW_CURRENT_PACKAGE_TGZ=/path/to/openclaw-*.tgz` wieder, überspringen Sie den Host-Neubau mit `OPENCLAW_NPM_ONBOARD_HOST_BUILD=0`, oder wechseln Sie den Channel mit `OPENCLAW_NPM_ONBOARD_CHANNEL=discord`.
- Smoke für Wechsel des Update-Channels: `pnpm test:docker:update-channel-switch` installiert den gepackten OpenClaw-Tarball global in Docker, wechselt von Paket `stable` zu Git `dev`, verifiziert den persistierten Channel und die Plugin-Funktion nach dem Update, wechselt anschließend zurück zu Paket `stable` und prüft den Update-Status.
- Upgrade-Survivor-Smoke: `pnpm test:docker:upgrade-survivor` installiert den gepackten OpenClaw-Tarball über ein verunreinigtes Fixture eines alten Benutzers mit Agenten, Channel-Konfiguration, Plugin-Allowlists, veraltetem Plugin-Abhängigkeitszustand und vorhandenen Workspace-/Session-Dateien. Es führt Paket-Update plus nicht interaktiven doctor ohne Live-Provider- oder Channel-Schlüssel aus, startet anschließend ein loopback-Gateway und prüft die Beibehaltung von Konfiguration/Zustand sowie Start-/Status-Budgets.
- Veröffentlichter Upgrade-Survivor-Smoke: `pnpm test:docker:published-upgrade-survivor` installiert standardmäßig `openclaw@latest`, legt realistische Dateien bestehender Benutzer an, konfiguriert diese Baseline mit einem eingebauten Befehlsrezept, validiert die resultierende Konfiguration, aktualisiert diese veröffentlichte Installation auf den Kandidaten-Tarball, führt nicht interaktiven doctor aus, schreibt `.artifacts/upgrade-survivor/summary.json`, startet anschließend ein loopback-Gateway und prüft konfigurierte Intents, Zustandsbeibehaltung, Start, `/healthz`, `/readyz` und RPC-Status-Budgets. Überschreiben Sie eine Baseline mit `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC`, lassen Sie den Aggregat-Scheduler exakte Baselines mit `OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPECS` wie `all-since-2026.4.23` erweitern, und erweitern Sie issue-förmige Fixtures mit `OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS` wie `reported-issues`; die Menge `reported-issues` enthält `configured-plugin-installs` für automatische Reparatur externer OpenClaw-Plugin-Installationen. Package Acceptance stellt diese als `published_upgrade_survivor_baseline`, `published_upgrade_survivor_baselines` und `published_upgrade_survivor_scenarios` bereit.
- Session-Runtime-Kontext-Smoke: `pnpm test:docker:session-runtime-context` verifiziert die Persistenz verborgener Runtime-Kontext-Transkripte plus doctor-Reparatur betroffener duplizierter Prompt-Rewrite-Branches.
- Bun-Globalinstallations-Smoke: `bash scripts/e2e/bun-global-install-smoke.sh` packt den aktuellen Tree, installiert ihn mit `bun install -g` in einem isolierten Home und verifiziert, dass `openclaw infer image providers --json` gebündelte Image-Provider zurückgibt, statt hängen zu bleiben. Verwenden Sie einen vorab gebauten Tarball mit `OPENCLAW_BUN_GLOBAL_SMOKE_PACKAGE_TGZ=/path/to/openclaw-*.tgz` wieder, überspringen Sie den Host-Build mit `OPENCLAW_BUN_GLOBAL_SMOKE_HOST_BUILD=0`, oder kopieren Sie `dist/` aus einem gebauten Docker-Image mit `OPENCLAW_BUN_GLOBAL_SMOKE_DIST_IMAGE=openclaw-dockerfile-smoke:local`.
- Installer-Docker-Smoke: `bash scripts/test-install-sh-docker.sh` teilt einen npm-Cache zwischen seinen Root-, Update- und Direct-npm-Containern. Der Update-Smoke verwendet standardmäßig npm `latest` als stabile Baseline, bevor auf den Kandidaten-Tarball aktualisiert wird. Überschreiben Sie dies lokal mit `OPENCLAW_INSTALL_SMOKE_UPDATE_BASELINE=2026.4.22` oder mit der Eingabe `update_baseline_version` des Install Smoke-Workflows auf GitHub. Nicht-Root-Installer-Prüfungen behalten einen isolierten npm-Cache, damit root-eigene Cache-Einträge das benutzerlokale Installationsverhalten nicht verdecken. Setzen Sie `OPENCLAW_INSTALL_SMOKE_NPM_CACHE_DIR=/path/to/cache`, um den Root-/Update-/Direct-npm-Cache über lokale Wiederholungen hinweg wiederzuverwenden.
- Install Smoke CI überspringt das doppelte direkte globale npm-Update mit `OPENCLAW_INSTALL_SMOKE_SKIP_NPM_GLOBAL=1`; führen Sie das Skript lokal ohne diese Env aus, wenn direkte `npm install -g`-Abdeckung benötigt wird.
- Agents-delete-shared-workspace-CLI-Smoke: `pnpm test:docker:agents-delete-shared-workspace` (Skript: `scripts/e2e/agents-delete-shared-workspace-docker.sh`) baut standardmäßig das Root-Dockerfile-Image, legt zwei Agenten mit einem Workspace in einem isolierten Container-Home an, führt `agents delete --json` aus und verifiziert gültiges JSON plus Verhalten zum Beibehalten des Workspace. Verwenden Sie das install-smoke-Image mit `OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_IMAGE=openclaw-dockerfile-smoke:local OPENCLAW_AGENTS_DELETE_SHARED_WORKSPACE_E2E_SKIP_BUILD=1` wieder.
- Gateway-Netzwerk (zwei Container, WS-Auth + Health): `pnpm test:docker:gateway-network` (Skript: `scripts/e2e/gateway-network-docker.sh`)
- Browser-CDP-Snapshot-Smoke: `pnpm test:docker:browser-cdp-snapshot` (Skript: `scripts/e2e/browser-cdp-snapshot-docker.sh`) baut das Source-E2E-Image plus eine Chromium-Schicht, startet Chromium mit rohem CDP, führt `browser doctor --deep` aus und verifiziert, dass CDP-Rollensnapshots Link-URLs, zu Klickzielen hochgestufte Cursor-Elemente, iframe-Refs und Frame-Metadaten abdecken.
- OpenAI Responses web_search-Regression für minimales Reasoning: `pnpm test:docker:openai-web-search-minimal` (Skript: `scripts/e2e/openai-web-search-minimal-docker.sh`) führt einen gemockten OpenAI-Server durch Gateway aus, verifiziert, dass `web_search` `reasoning.effort` von `minimal` auf `low` anhebt, erzwingt anschließend die Provider-Schema-Ablehnung und prüft, dass das Rohdetail in Gateway-Logs erscheint.
- MCP-Channel-Bridge (vorgefülltes Gateway + stdio-Bridge + roher Claude-Benachrichtigungsframe-Smoke): `pnpm test:docker:mcp-channels` (Skript: `scripts/e2e/mcp-channels-docker.sh`)
- Pi-Bundle-MCP-Tools (echter stdio-MCP-Server + eingebetteter Pi-Profil-Allow/Deny-Smoke): `pnpm test:docker:pi-bundle-mcp-tools` (Skript: `scripts/e2e/pi-bundle-mcp-tools-docker.sh`)
- Cron/Subagent-MCP-Cleanup (echtes Gateway + stdio-MCP-Child-Teardown nach isoliertem Cron und einmaligen Subagent-Läufen): `pnpm test:docker:cron-mcp-cleanup` (Skript: `scripts/e2e/cron-mcp-cleanup-docker.sh`)
- Plugins (Installations-/Update-Smoke für lokalen Pfad, `file:`, npm-Registry mit gehoisteten Abhängigkeiten, Git-Moving-Refs, ClawHub-Kitchen-Sink, Marketplace-Updates und Claude-Bundle-Aktivieren/Prüfen): `pnpm test:docker:plugins` (Skript: `scripts/e2e/plugins-docker.sh`)
  Setzen Sie `OPENCLAW_PLUGINS_E2E_CLAWHUB=0`, um den ClawHub-Block zu überspringen, oder überschreiben Sie das standardmäßige Kitchen-Sink-Paket/Runtime-Paar mit `OPENCLAW_PLUGINS_E2E_CLAWHUB_SPEC` und `OPENCLAW_PLUGINS_E2E_CLAWHUB_ID`. Ohne `OPENCLAW_CLAWHUB_URL`/`CLAWHUB_URL` verwendet der Test einen hermetischen lokalen ClawHub-Fixture-Server.
- Plugin-update-unchanged-Smoke: `pnpm test:docker:plugin-update` (Skript: `scripts/e2e/plugin-update-unchanged-docker.sh`)
- Plugin-Lifecycle-Matrix-Smoke: `pnpm test:docker:plugin-lifecycle-matrix` installiert den gepackten OpenClaw-Tarball in einem leeren Container, installiert ein npm-Plugin, schaltet enable/disable um, aktualisiert es über eine lokale npm-Registry und stuft es herab, löscht den installierten Code und verifiziert anschließend, dass uninstall weiterhin veralteten Zustand entfernt, während RSS-/CPU-Metriken für jede Lifecycle-Phase protokolliert werden.
- Config-reload-metadata-Smoke: `pnpm test:docker:config-reload` (Skript: `scripts/e2e/config-reload-source-docker.sh`)
- Plugins: `pnpm test:docker:plugins` deckt Installations-/Update-Smoke für lokalen Pfad, `file:`, npm-Registry mit gehoisteten Abhängigkeiten, Git-Moving-Refs, ClawHub-Fixtures, Marketplace-Updates und Claude-Bundle-Aktivieren/Prüfen ab. `pnpm test:docker:plugin-update` deckt unverändertes Update-Verhalten für installierte Plugins ab. `pnpm test:docker:plugin-lifecycle-matrix` deckt ressourcenverfolgte npm-Plugin-Installation, Aktivieren, Deaktivieren, Upgrade, Downgrade und Deinstallation bei fehlendem Code ab.

Um das gemeinsam genutzte funktionale Image manuell vorzubauen und wiederzuverwenden:

```bash
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local pnpm test:docker:e2e-build
OPENCLAW_DOCKER_E2E_IMAGE=openclaw-docker-e2e-functional:local OPENCLAW_SKIP_DOCKER_BUILD=1 pnpm test:docker:mcp-channels
```

Suite-spezifische Image-Overrides wie `OPENCLAW_GATEWAY_NETWORK_E2E_IMAGE` haben weiterhin Vorrang, wenn sie gesetzt sind. Wenn `OPENCLAW_SKIP_DOCKER_BUILD=1` auf ein entferntes gemeinsam genutztes Image zeigt, ziehen die Skripte es, falls es noch nicht lokal vorhanden ist. Die QR- und Installer-Docker-Tests behalten ihre eigenen Dockerfiles, weil sie Paket-/Installationsverhalten statt der gemeinsam genutzten Built-App-Runtime validieren.

Die Live-Modell-Docker-Runner binden außerdem den aktuellen Checkout schreibgeschützt per Bind-Mount ein und
stellen ihn in einem temporären Arbeitsverzeichnis im Container bereit. Dadurch bleibt das Runtime-
Image schlank, während Vitest trotzdem gegen Ihren exakten lokalen Quellcode/Ihre lokale Konfiguration ausgeführt wird.
Der Bereitstellungsschritt überspringt große, nur lokal verwendete Caches und App-Build-Ausgaben wie
`.pnpm-store`, `.worktrees`, `__openclaw_vitest__` sowie app-lokale `.build`- oder
Gradle-Ausgabeverzeichnisse, damit Docker-Live-Läufe nicht minutenlang
maschinenspezifische Artefakte kopieren.
Sie setzen außerdem `OPENCLAW_SKIP_CHANNELS=1`, damit Gateway-Live-Probes keine
echten Telegram-/Discord-/usw.-Kanal-Worker im Container starten.
`test:docker:live-models` führt weiterhin `pnpm test:live` aus; reichen Sie daher auch
`OPENCLAW_LIVE_GATEWAY_*` durch, wenn Sie Live-Gateway-Abdeckung in dieser
Docker-Lane eingrenzen oder ausschließen müssen.
`test:docker:openwebui` ist ein höherstufiger Kompatibilitäts-Smoke-Test: Er startet einen
OpenClaw-Gateway-Container mit aktivierten OpenAI-kompatiblen HTTP-Endpunkten,
startet einen gepinnten Open WebUI-Container gegen dieses Gateway, meldet sich über
Open WebUI an, prüft, dass `/api/models` `openclaw/default` bereitstellt, und sendet dann eine
echte Chat-Anfrage über Open WebUIs Proxy `/api/chat/completions`.
Der erste Lauf kann spürbar langsamer sein, weil Docker möglicherweise das
Open WebUI-Image laden muss und Open WebUI möglicherweise seine eigene Cold-Start-Einrichtung abschließen muss.
Diese Lane erwartet einen nutzbaren Live-Modell-Key, und `OPENCLAW_PROFILE_FILE`
(standardmäßig `~/.profile`) ist der primäre Weg, ihn in Docker-basierten Läufen bereitzustellen.
Erfolgreiche Läufe geben eine kleine JSON-Nutzlast wie `{ "ok": true, "model":
"openclaw/default", ... }` aus.
`test:docker:mcp-channels` ist absichtlich deterministisch und benötigt kein
echtes Telegram-, Discord- oder iMessage-Konto. Es startet einen vorbefüllten Gateway-
Container, startet einen zweiten Container, der `openclaw mcp serve` spawnt, und
prüft dann geroutete Konversationserkennung, Transkript-Lesezugriffe, Anhangsmetadaten,
Verhalten der Live-Ereignisqueue, Routing ausgehender Sendungen sowie Kanal- und
Berechtigungsbenachrichtigungen im Claude-Stil über die echte stdio-MCP-Bridge. Die Benachrichtigungsprüfung
inspiziert die rohen stdio-MCP-Frames direkt, sodass der Smoke-Test validiert, was die
Bridge tatsächlich ausgibt, nicht nur das, was ein bestimmtes Client-SDK zufällig sichtbar macht.
`test:docker:pi-bundle-mcp-tools` ist deterministisch und benötigt keinen Live-
Modell-Key. Es baut das Repo-Docker-Image, startet einen echten stdio-MCP-Probe-Server
im Container, materialisiert diesen Server über die eingebettete Pi-Bundle-
MCP-Runtime, führt das Tool aus und prüft dann, dass `coding` und `messaging`
`bundle-mcp`-Tools behalten, während `minimal` und `tools.deny: ["bundle-mcp"]` sie herausfiltern.
`test:docker:cron-mcp-cleanup` ist deterministisch und benötigt keinen Live-Modell-
Key. Es startet ein vorbefülltes Gateway mit einem echten stdio-MCP-Probe-Server, führt einen
isolierten Cron-Turn und einen `/subagents spawn`-One-Shot-Child-Turn aus und prüft dann,
dass der MCP-Child-Prozess nach jedem Lauf beendet wird.

Manueller ACP-Plain-Language-Thread-Smoke-Test (nicht CI):

- `bun scripts/dev/discord-acp-plain-language-smoke.ts --channel <discord-channel-id> ...`
- Behalten Sie dieses Skript für Regressions-/Debug-Workflows. Es kann für die Validierung des ACP-Thread-Routings erneut benötigt werden; löschen Sie es daher nicht.

Nützliche Umgebungsvariablen:

- `OPENCLAW_CONFIG_DIR=...` (Standard: `~/.openclaw`) wird nach `/home/node/.openclaw` gemountet
- `OPENCLAW_WORKSPACE_DIR=...` (Standard: `~/.openclaw/workspace`) wird nach `/home/node/.openclaw/workspace` gemountet
- `OPENCLAW_PROFILE_FILE=...` (Standard: `~/.profile`) wird nach `/home/node/.profile` gemountet und vor dem Ausführen von Tests gesourct
- `OPENCLAW_DOCKER_PROFILE_ENV_ONLY=1`, um nur Umgebungsvariablen zu prüfen, die aus `OPENCLAW_PROFILE_FILE` gesourct wurden, mit temporären Konfigurations-/Workspace-Verzeichnissen und ohne externe CLI-Auth-Mounts
- `OPENCLAW_DOCKER_CLI_TOOLS_DIR=...` (Standard: `~/.cache/openclaw/docker-cli-tools`) wird für gecachte CLI-Installationen innerhalb von Docker nach `/home/node/.npm-global` gemountet
- Externe CLI-Auth-Verzeichnisse/-Dateien unter `$HOME` werden schreibgeschützt unter `/host-auth...` gemountet und dann vor Testbeginn nach `/home/node/...` kopiert
  - Standardverzeichnisse: `.minimax`
  - Standarddateien: `~/.codex/auth.json`, `~/.codex/config.toml`, `.claude.json`, `~/.claude/.credentials.json`, `~/.claude/settings.json`, `~/.claude/settings.local.json`
  - Eingegrenzte Provider-Läufe mounten nur die benötigten Verzeichnisse/Dateien, die aus `OPENCLAW_LIVE_PROVIDERS` / `OPENCLAW_LIVE_GATEWAY_PROVIDERS` abgeleitet werden
  - Manuell überschreiben mit `OPENCLAW_DOCKER_AUTH_DIRS=all`, `OPENCLAW_DOCKER_AUTH_DIRS=none` oder einer kommagetrennten Liste wie `OPENCLAW_DOCKER_AUTH_DIRS=.claude,.codex`
- `OPENCLAW_LIVE_GATEWAY_MODELS=...` / `OPENCLAW_LIVE_MODELS=...`, um den Lauf einzugrenzen
- `OPENCLAW_LIVE_GATEWAY_PROVIDERS=...` / `OPENCLAW_LIVE_PROVIDERS=...`, um Provider im Container zu filtern
- `OPENCLAW_SKIP_DOCKER_BUILD=1`, um ein vorhandenes `openclaw:local-live`-Image für erneute Läufe wiederzuverwenden, die keinen Neubau benötigen
- `OPENCLAW_LIVE_REQUIRE_PROFILE_KEYS=1`, um sicherzustellen, dass Zugangsdaten aus dem Profil-Store (nicht aus der Umgebung) stammen
- `OPENCLAW_OPENWEBUI_MODEL=...`, um das Modell auszuwählen, das das Gateway für den Open WebUI-Smoke-Test bereitstellt
- `OPENCLAW_OPENWEBUI_PROMPT=...`, um den vom Open WebUI-Smoke-Test verwendeten Nonce-Prüf-Prompt zu überschreiben
- `OPENWEBUI_IMAGE=...`, um das gepinnte Open WebUI-Image-Tag zu überschreiben

## Docs-Sanity

Führen Sie nach Docs-Änderungen Docs-Prüfungen aus: `pnpm check:docs`.
Führen Sie die vollständige Mintlify-Ankervalidierung aus, wenn Sie auch In-Page-Heading-Prüfungen benötigen: `pnpm docs:check-links:anchors`.

## Offline-Regression (CI-sicher)

Dies sind „echte Pipeline“-Regressionen ohne echte Provider:

- Gateway-Tool-Aufrufe (Mock-OpenAI, echtes Gateway + Agent-Loop): `src/gateway/gateway.test.ts` (Fall: "runs a mock OpenAI tool call end-to-end via gateway agent loop")
- Gateway-Wizard (WS `wizard.start`/`wizard.next`, schreibt Konfiguration + Auth erzwungen): `src/gateway/gateway.test.ts` (Fall: "runs wizard over ws and writes auth token config")

## Agent-Zuverlässigkeits-Evals (Skills)

Wir haben bereits einige CI-sichere Tests, die sich wie „Agent-Zuverlässigkeits-Evals“ verhalten:

- Mock-Tool-Aufrufe über das echte Gateway + Agent-Loop (`src/gateway/gateway.test.ts`).
- End-to-End-Wizard-Flows, die Session-Verdrahtung und Konfigurationseffekte validieren (`src/gateway/gateway.test.ts`).

Was für Skills noch fehlt (siehe [Skills](/de/tools/skills)):

- **Entscheidungslogik:** Wenn Skills im Prompt aufgeführt sind, wählt der Agent den richtigen Skill (oder vermeidet irrelevante)?
- **Compliance:** Liest der Agent `SKILL.md` vor der Verwendung und befolgt erforderliche Schritte/Argumente?
- **Workflow-Verträge:** Mehrstufige Szenarien, die Tool-Reihenfolge, Übernahme des Sitzungsverlaufs und Sandbox-Grenzen prüfen.

Zukünftige Evals sollten zuerst deterministisch bleiben:

- Ein Szenario-Runner mit Mock-Providern, um Tool-Aufrufe + Reihenfolge, Skill-Dateilesezugriffe und Session-Verdrahtung zu prüfen.
- Eine kleine Suite Skill-fokussierter Szenarien (verwenden vs. vermeiden, Gating, Prompt Injection).
- Optionale Live-Evals (Opt-in, env-gated) erst, nachdem die CI-sichere Suite vorhanden ist.

## Vertragstests (Plugin- und Kanalform)

Vertragstests prüfen, dass jedes registrierte Plugin und jeder registrierte Kanal seinem
Schnittstellenvertrag entspricht. Sie iterieren über alle entdeckten Plugins und führen eine Suite von
Form- und Verhaltensassertions aus. Die standardmäßige `pnpm test`-Unit-Lane überspringt diese gemeinsam genutzten Seam- und Smoke-Dateien absichtlich; führen Sie die Vertragsbefehle explizit aus,
wenn Sie gemeinsam genutzte Kanal- oder Provider-Oberflächen berühren.

### Befehle

- Alle Verträge: `pnpm test:contracts`
- Nur Kanalverträge: `pnpm test:contracts:channels`
- Nur Provider-Verträge: `pnpm test:contracts:plugins`

### Kanalverträge

Zu finden in `src/channels/plugins/contracts/*.contract.test.ts`:

- **plugin** - Grundlegende Plugin-Form (ID, Name, Fähigkeiten)
- **setup** - Setup-Wizard-Vertrag
- **session-binding** - Session-Binding-Verhalten
- **outbound-payload** - Struktur der Nachrichten-Nutzlast
- **inbound** - Verarbeitung eingehender Nachrichten
- **actions** - Kanal-Aktionshandler
- **threading** - Thread-ID-Verarbeitung
- **directory** - Directory-/Roster-API
- **group-policy** - Durchsetzung von Gruppenrichtlinien

### Provider-Statusverträge

Zu finden in `src/plugins/contracts/*.contract.test.ts`.

- **status** - Kanalstatus-Probes
- **registry** - Plugin-Registry-Form

### Provider-Verträge

Zu finden in `src/plugins/contracts/*.contract.test.ts`:

- **auth** - Auth-Flow-Vertrag
- **auth-choice** - Auth-Auswahl/Selektion
- **catalog** - Modellkatalog-API
- **discovery** - Plugin-Erkennung
- **loader** - Plugin-Laden
- **runtime** - Provider-Runtime
- **shape** - Plugin-Form/Schnittstelle
- **wizard** - Setup-Wizard

### Wann ausführen

- Nach Änderungen an plugin-sdk-Exports oder Subpaths
- Nach dem Hinzufügen oder Ändern eines Kanal- oder Provider-Plugins
- Nach Refactorings der Plugin-Registrierung oder -Erkennung

Vertragstests laufen in CI und benötigen keine echten API-Keys.

## Regressionen hinzufügen (Anleitung)

Wenn Sie ein Provider-/Modellproblem beheben, das live entdeckt wurde:

- Fügen Sie nach Möglichkeit eine CI-sichere Regression hinzu (Mock-/Stub-Provider oder die exakte Request-Shape-Transformation erfassen)
- Wenn es grundsätzlich nur live prüfbar ist (Rate Limits, Auth-Richtlinien), halten Sie den Live-Test eng und per Umgebungsvariablen Opt-in
- Zielen Sie bevorzugt auf die kleinste Schicht, die den Fehler erfasst:
  - Fehler in Provider-Request-Konvertierung/-Replay → direkter Modelltest
  - Fehler in Gateway-Session-/History-/Tool-Pipeline → Gateway-Live-Smoke oder CI-sicherer Gateway-Mock-Test
- SecretRef-Traversal-Guardrail:
  - `src/secrets/exec-secret-ref-id-parity.test.ts` leitet ein gesampeltes Ziel pro SecretRef-Klasse aus Registry-Metadaten (`listSecretTargetRegistryEntries()`) ab und stellt dann sicher, dass Exec-IDs mit Traversal-Segmenten abgelehnt werden.
  - Wenn Sie eine neue `includeInPlan`-SecretRef-Zielfamilie in `src/secrets/target-registry-data.ts` hinzufügen, aktualisieren Sie `classifyTargetClass` in diesem Test. Der Test schlägt absichtlich bei nicht klassifizierten Ziel-IDs fehl, damit neue Klassen nicht stillschweigend übersprungen werden können.

## Verwandt

- [Live testen](/de/help/testing-live)
- [Updates und Plugins testen](/de/help/testing-updates-plugins)
- [CI](/de/ci)
